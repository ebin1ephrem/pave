-- Prompt 3A: checkpoint windows, consent, email queue, reminders, export and delete, profile emails.

-- Profiles carry the sign-in email so managers can see whom they invited.
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

create function public.can_view_profile(_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select _user = (select auth.uid())
      or public.is_merstra_admin()
      or exists (select 1 from public.tenant_members tm where tm.user_id = _user and public.is_tenant_admin(tm.tenant_id))
      or exists (select 1 from public.startup_members sm where sm.user_id = _user and public.manages_startup(sm.startup_id))
      or exists (select 1 from public.program_managers pm where pm.user_id = _user and public.manages_program(pm.program_id));
$$;
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (public.can_view_profile(id));

-- A manager opens and closes each checkpoint for a whole program, with a due date.
create table public.checkpoint_windows (
  program_id uuid not null references public.programs (id) on delete cascade,
  type public.checkpoint_type not null,
  is_open boolean not null default false,
  due_date date,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  primary key (program_id, type)
);
alter table public.checkpoint_windows enable row level security;
create policy checkpoint_windows_select on public.checkpoint_windows for select to authenticated
  using (
    public.is_merstra_admin() or public.manages_program(program_id)
    or exists (select 1 from public.enrollments e
               where e.program_id = checkpoint_windows.program_id and public.is_startup_member(e.startup_id))
  );
create policy checkpoint_windows_insert on public.checkpoint_windows for insert to authenticated
  with check (public.manages_program(program_id));
create policy checkpoint_windows_update on public.checkpoint_windows for update to authenticated
  using (public.manages_program(program_id)) with check (public.manages_program(program_id));
create trigger checkpoint_windows_set_updated_at before update on public.checkpoint_windows
  for each row execute function public.set_updated_at();

create function public.window_is_open(_checkpoint uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.checkpoints c
    join public.enrollments e on e.id = c.enrollment_id
    join public.checkpoint_windows w on w.program_id = e.program_id and w.type = c.type
    where c.id = _checkpoint and w.is_open
  );
$$;

-- Founders may write only to their own open, unsubmitted checkpoint.
create function public.founder_can_edit(_checkpoint uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.checkpoint_is_editable(_checkpoint)
     and public.window_is_open(_checkpoint)
     and public.is_enrollment_founder(public.checkpoint_enrollment(_checkpoint));
$$;

create function public.manager_can_edit(_checkpoint uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.checkpoint_is_editable(_checkpoint)
     and public.manages_enrollment(public.checkpoint_enrollment(_checkpoint));
$$;

drop policy responses_insert on public.responses;
drop policy responses_update on public.responses;
drop policy responses_delete on public.responses;
create policy responses_insert on public.responses for insert to authenticated
  with check ((public.founder_can_edit(checkpoint_id) and not entered_by_manager)
           or (public.manager_can_edit(checkpoint_id) and entered_by_manager));
create policy responses_update on public.responses for update to authenticated
  using (public.founder_can_edit(checkpoint_id) or public.manager_can_edit(checkpoint_id))
  with check ((public.founder_can_edit(checkpoint_id) and not entered_by_manager)
           or (public.manager_can_edit(checkpoint_id) and entered_by_manager));
create policy responses_delete on public.responses for delete to authenticated
  using (public.founder_can_edit(checkpoint_id) or public.manager_can_edit(checkpoint_id));

drop policy evidence_insert on public.evidence;
drop policy evidence_delete on public.evidence;
create policy evidence_insert on public.evidence for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and review_status = 'pending' and review_note is null and reviewed_by is null and reviewed_at is null
    and (public.founder_can_edit(checkpoint_id)
         or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id)))
    and (kind = 'link'
         or public.evidence_path_enrollment(storage_path) = public.checkpoint_enrollment(checkpoint_id))
  );
create policy evidence_delete on public.evidence for delete to authenticated
  using (
    (uploaded_by = (select auth.uid()) and public.founder_can_edit(checkpoint_id))
    or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
  );

drop policy evidence_files_insert on storage.objects;
drop policy evidence_files_delete on storage.objects;
create policy evidence_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (public.manages_enrollment(public.evidence_path_enrollment(name))
         or (public.evidence_path_enrollment(name) is not null
             and public.founder_can_edit(split_part(name, '/', 3)::uuid)))
  );
create policy evidence_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (public.manages_enrollment(public.evidence_path_enrollment(name))
         or (owner_id = (select auth.uid())::text
             and public.evidence_path_enrollment(name) is not null
             and public.founder_can_edit(split_part(name, '/', 3)::uuid)))
  );

-- Founders cannot submit outside an open window; managers can, for assisted entry.
create or replace function public.submit_checkpoint(_checkpoint uuid, _framework_version text) returns void
language plpgsql security definer set search_path = '' as $$
declare _enrollment uuid := public.checkpoint_enrollment(_checkpoint);
begin
  if _enrollment is null then
    raise exception 'Not allowed';
  end if;
  if public.manages_enrollment(_enrollment) then
    null;
  elsif public.is_enrollment_founder(_enrollment) then
    if not public.window_is_open(_checkpoint) then
      raise exception 'This checkpoint is not open for submissions';
    end if;
  else
    raise exception 'Not allowed';
  end if;
  update public.checkpoints
  set status = 'submitted', submitted_at = now(), submitted_by = (select auth.uid()),
      framework_version = _framework_version
  where id = _checkpoint and status in ('not_started', 'in_progress');
  if not found then
    raise exception 'This checkpoint has already been submitted';
  end if;
end $$;

-- Consent, recorded once per user with a timestamp.
create table public.consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version text not null,
  research_opt_in boolean not null default false,
  accepted_at timestamptz not null default now()
);
alter table public.consents enable row level security;
create policy consents_select on public.consents for select to authenticated
  using (user_id = (select auth.uid()) or public.is_merstra_admin());
create policy consents_insert on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy consents_update on public.consents for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Every email PAVE sends is queued here first, so there is a record of what went out.
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete set null,
  to_email text not null,
  template text not null,
  payload jsonb not null default '{}',
  dedupe_key text unique,
  status text not null default 'queued' check (status in ('queued', 'sent', 'skipped', 'failed')),
  detail text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.email_outbox enable row level security;
create policy email_outbox_select on public.email_outbox for select to authenticated
  using (public.is_merstra_admin() or (tenant_id is not null and public.is_tenant_admin(tenant_id)));
revoke insert, update, delete on public.email_outbox from authenticated;

-- Queues one reminder per founder for each open, unsubmitted checkpoint due within three days.
create function public.queue_due_reminders() returns integer
language plpgsql security definer set search_path = '' as $$
declare _n integer;
begin
  insert into public.email_outbox (tenant_id, to_email, template, payload, dedupe_key)
  select e.tenant_id, p.email, 'reminder',
         jsonb_build_object('startup', s.name, 'program', pr.name, 'checkpoint', c.type, 'due_date', w.due_date),
         'reminder:' || c.id || ':' || p.id || ':' || w.due_date
  from public.checkpoint_windows w
  join public.programs pr on pr.id = w.program_id
  join public.enrollments e on e.program_id = w.program_id and e.status = 'active'
  join public.checkpoints c on c.enrollment_id = e.id and c.type = w.type and c.status in ('not_started', 'in_progress')
  join public.startups s on s.id = e.startup_id
  join public.startup_members sm on sm.startup_id = s.id
  join public.profiles p on p.id = sm.user_id
  where w.is_open and w.due_date between current_date and current_date + 3 and p.email is not null
  on conflict (dedupe_key) do nothing;
  get diagnostics _n = row_count;
  return _n;
end $$;
revoke execute on function public.queue_due_reminders() from public, anon, authenticated;

-- Export everything held about one startup.
create function public.export_startup(_startup uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_merstra_admin() or public.manages_startup(_startup) or public.is_startup_member(_startup)) then
    raise exception 'Not allowed';
  end if;
  return (
    select jsonb_build_object(
      'exported_at', now(),
      'startup', to_jsonb(s),
      'members', (select coalesce(jsonb_agg(jsonb_build_object('name', p.full_name, 'email', p.email)), '[]')
                  from public.startup_members sm join public.profiles p on p.id = sm.user_id where sm.startup_id = s.id),
      'enrollments', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'program', pr.name, 'status', e.status,
          'checkpoints', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'type', c.type, 'status', c.status, 'submitted_at', c.submitted_at, 'framework_version', c.framework_version,
              'responses', (select coalesce(jsonb_agg(to_jsonb(r) - 'id' - 'checkpoint_id'), '[]') from public.responses r where r.checkpoint_id = c.id),
              'evidence', (select coalesce(jsonb_agg(to_jsonb(v) - 'checkpoint_id'), '[]') from public.evidence v where v.checkpoint_id = c.id),
              'scores', (select coalesce(jsonb_agg(to_jsonb(sc) - 'checkpoint_id'), '[]') from public.scores sc where sc.checkpoint_id = c.id),
              'overrides', (select coalesce(jsonb_agg(to_jsonb(o) - 'checkpoint_id'), '[]') from public.overrides o where o.checkpoint_id = c.id)
            ) order by c.type), '[]')
            from public.checkpoints c where c.enrollment_id = e.id)
        )), '[]')
        from public.enrollments e join public.programs pr on pr.id = e.program_id where e.startup_id = s.id)
    )
    from public.startups s where s.id = _startup
  );
end $$;

-- Deleting a startup: list its stored files first (the app removes them), then delete every row.
create function public.startup_file_paths(_startup uuid) returns setof text
language sql stable security definer set search_path = '' as $$
  select v.storage_path
  from public.evidence v
  join public.checkpoints c on c.id = v.checkpoint_id
  join public.enrollments e on e.id = c.enrollment_id
  join public.startups s on s.id = e.startup_id
  where e.startup_id = _startup and v.storage_path is not null
    and (public.is_merstra_admin() or public.is_tenant_admin(s.tenant_id));
$$;

create function public.delete_startup(_startup uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare _tenant uuid;
begin
  select tenant_id into _tenant from public.startups where id = _startup;
  if _tenant is null or not (public.is_merstra_admin() or public.is_tenant_admin(_tenant)) then
    raise exception 'Not allowed';
  end if;
  delete from public.startups where id = _startup;
end $$;

-- Audit: resolve the tenant for any table that carries a program id; cover checkpoint windows.
create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  _row jsonb := to_jsonb(coalesce(new, old));
  _tenant uuid;
  _checkpoint uuid;
begin
  if tg_table_name = 'tenants' then
    _tenant := (_row ->> 'id')::uuid;
  elsif _row ? 'tenant_id' then
    _tenant := (_row ->> 'tenant_id')::uuid;
  elsif _row ? 'program_id' then
    select p.tenant_id into _tenant from public.programs p where p.id = (_row ->> 'program_id')::uuid;
  elsif tg_table_name = 'startup_members' then
    select s.tenant_id into _tenant from public.startups s where s.id = (_row ->> 'startup_id')::uuid;
  else
    _checkpoint := case when tg_table_name = 'checkpoints' then (_row ->> 'id')::uuid
                        else (_row ->> 'checkpoint_id')::uuid end;
    select e.tenant_id into _tenant
    from public.checkpoints c join public.enrollments e on e.id = c.enrollment_id
    where c.id = _checkpoint;
    if _tenant is null and tg_table_name = 'checkpoints' then
      select e.tenant_id into _tenant from public.enrollments e where e.id = (_row ->> 'enrollment_id')::uuid;
    end if;
  end if;

  insert into public.audit_log (actor, action, table_name, row_id, tenant_id, old_row, new_row)
  values (
    (select auth.uid()), tg_op, tg_table_name,
    coalesce(_row ->> 'id', _row ->> 'user_id', _row ->> 'program_id'),
    _tenant,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;
create trigger checkpoint_windows_audit after insert or update or delete on public.checkpoint_windows
  for each row execute function public.write_audit_log();
create trigger consents_audit after insert or update on public.consents
  for each row execute function public.write_audit_log();

revoke all on public.checkpoint_windows, public.consents, public.email_outbox from anon;
revoke execute on function public.can_view_profile(uuid), public.window_is_open(uuid), public.founder_can_edit(uuid),
  public.manager_can_edit(uuid), public.export_startup(uuid), public.startup_file_paths(uuid), public.delete_startup(uuid)
  from public, anon;
grant execute on function public.can_view_profile(uuid), public.window_is_open(uuid), public.founder_can_edit(uuid),
  public.manager_can_edit(uuid), public.export_startup(uuid), public.startup_file_paths(uuid), public.delete_startup(uuid)
  to authenticated, service_role;
grant execute on function public.queue_due_reminders() to service_role;

-- Daily at 03:30 UTC: queue reminders, then ask the email function to send what is queued.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('pave-reminders', '30 3 * * *', $job$
  select public.queue_due_reminders();
  select net.http_post(
    url := 'https://osgporxbqlmrufqyborv.supabase.co/functions/v1/pave',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"action":"dispatch"}'::jsonb);
$job$);
