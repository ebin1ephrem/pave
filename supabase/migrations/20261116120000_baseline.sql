-- PAVE baseline schema: tenancy, checkpoints, responses, evidence, scores, overrides, audit.
-- One replayable migration. Every table has row-level security; nothing is readable by anon.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.tenant_type as enum ('incubator', 'accelerator', 'university', 'government', 'other');
create type public.tenant_role as enum ('customer_admin', 'manager');
create type public.program_status as enum ('draft', 'active', 'completed', 'archived');
create type public.enrollment_status as enum ('active', 'withdrawn', 'graduated');
create type public.checkpoint_type as enum ('benchmark', 'midline', 'endline');
create type public.checkpoint_status as enum ('not_started', 'in_progress', 'submitted', 'reviewed');
create type public.evidence_kind as enum ('file', 'link');
create type public.review_status as enum ('pending', 'accepted', 'weak', 'rejected');
create type public.confidence as enum ('HIGH', 'MEDIUM', 'LOW');

create domain public.dimension_code as text
  check (value in ('CUS', 'PRD', 'BIZ', 'MOT', 'TEA', 'CAP'));
create domain public.stage_number as smallint
  check (value between 1 and 9);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Merstra staff. Rows are added by Merstra with the service role only; there is no client write path.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  type public.tenant_type not null default 'incubator',
  country text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.tenant_role not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create index tenant_members_user_idx on public.tenant_members (user_id);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  start_date date,
  end_date date,
  sector_tags text[] not null default '{}',
  status public.program_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id),
  check (end_date is null or start_date is null or end_date >= start_date)
);
create index programs_tenant_idx on public.programs (tenant_id);

create table public.program_managers (
  program_id uuid not null references public.programs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_id, user_id)
);
create index program_managers_user_idx on public.program_managers (user_id);

-- A startup belongs to one tenant. The same company working with two tenants is two rows,
-- so no tenant can ever reach another tenant's record of it.
create table public.startups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  sector text,
  one_liner text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tenant_id)
);
create index startups_tenant_idx on public.startups (tenant_id);

create table public.startup_members (
  startup_id uuid not null references public.startups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (startup_id, user_id)
);
create index startup_members_user_idx on public.startup_members (user_id);

-- Startup x program. The composite foreign keys make a cross-tenant enrollment impossible.
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  startup_id uuid not null,
  program_id uuid not null,
  status public.enrollment_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (startup_id, program_id),
  foreign key (startup_id, tenant_id) references public.startups (id, tenant_id) on delete cascade,
  foreign key (program_id, tenant_id) references public.programs (id, tenant_id) on delete cascade
);
create index enrollments_program_idx on public.enrollments (program_id);
create index enrollments_startup_idx on public.enrollments (startup_id);
create index enrollments_tenant_idx on public.enrollments (tenant_id);

-- Benchmark, Midline, Endline for one enrollment. Created automatically with the enrollment.
create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  type public.checkpoint_type not null,
  status public.checkpoint_status not null default 'not_started',
  framework_version text,
  submitted_at timestamptz,
  submitted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (enrollment_id, type)
);

-- One row per answered question. No row, or a null option, means unanswered: never a default.
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  question_id text not null,
  option_id text,
  narrative text,
  entered_by uuid references auth.users (id) on delete set null default auth.uid(),
  entered_by_manager boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (checkpoint_id, question_id)
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  kind public.evidence_kind not null,
  storage_path text,
  url text,
  file_name text,
  evidence_type text not null,
  dimension public.dimension_code not null,
  question_id text,
  uploaded_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  review_status public.review_status not null default 'pending',
  review_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  check (
    (kind = 'file' and storage_path is not null and url is null)
    or (kind = 'link' and url ~* '^https?://' and storage_path is null)
  )
);
create index evidence_checkpoint_idx on public.evidence (checkpoint_id);

-- System scores are append-only: each scoring run adds rows, none is ever changed.
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  dimension public.dimension_code not null,
  system_stage public.stage_number not null,
  confidence public.confidence not null,
  rationale text not null,
  anchor_stage public.stage_number,
  evidence_used jsonb not null default '[]',
  evidence_missing jsonb not null default '[]',
  framework_version text not null,
  computed_at timestamptz not null default now()
);
create index scores_checkpoint_idx on public.scores (checkpoint_id, dimension, computed_at desc);

-- Manager overrides are append-only and always point at the system score they override.
create table public.overrides (
  id uuid primary key default gen_random_uuid(),
  score_id uuid not null references public.scores (id) on delete cascade,
  checkpoint_id uuid not null references public.checkpoints (id) on delete cascade,
  dimension public.dimension_code not null,
  manager_stage public.stage_number not null,
  justification text not null check (length(trim(justification)) >= 50),
  author uuid not null references auth.users (id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now()
);
create index overrides_checkpoint_idx on public.overrides (checkpoint_id, dimension, created_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  table_name text not null,
  row_id text,
  tenant_id uuid,
  old_row jsonb,
  new_row jsonb
);
create index audit_log_tenant_idx on public.audit_log (tenant_id, at desc);

-- ---------------------------------------------------------------------------
-- Access helpers. SECURITY DEFINER so policies can consult membership tables
-- without recursing into their own policies.
-- ---------------------------------------------------------------------------
create function public.is_merstra_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create function public.is_tenant_admin(_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = _tenant and user_id = (select auth.uid()) and role = 'customer_admin'
  );
$$;

create function public.is_tenant_member(_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_members where tenant_id = _tenant and user_id = (select auth.uid())
  );
$$;

-- A program is managed by its assigned managers and by the admins of its tenant.
create function public.manages_program(_program uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.program_managers pm
    join public.programs p on p.id = pm.program_id
    join public.tenant_members tm on tm.tenant_id = p.tenant_id and tm.user_id = pm.user_id
    where pm.program_id = _program and pm.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.programs p
    join public.tenant_members tm on tm.tenant_id = p.tenant_id
    where p.id = _program and tm.user_id = (select auth.uid()) and tm.role = 'customer_admin'
  );
$$;

create function public.is_startup_member(_startup uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.startup_members where startup_id = _startup and user_id = (select auth.uid())
  );
$$;

create function public.manages_startup(_startup uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.startups s where s.id = _startup and public.is_tenant_admin(s.tenant_id)
  ) or exists (
    select 1 from public.enrollments e where e.startup_id = _startup and public.manages_program(e.program_id)
  );
$$;

create function public.manages_enrollment(_enrollment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e where e.id = _enrollment and public.manages_program(e.program_id)
  );
$$;

create function public.is_enrollment_founder(_enrollment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e where e.id = _enrollment and public.is_startup_member(e.startup_id)
  );
$$;

create function public.can_read_enrollment(_enrollment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_merstra_admin()
      or public.manages_enrollment(_enrollment)
      or public.is_enrollment_founder(_enrollment);
$$;

create function public.checkpoint_enrollment(_checkpoint uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select enrollment_id from public.checkpoints where id = _checkpoint;
$$;

create function public.checkpoint_is_editable(_checkpoint uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.checkpoints where id = _checkpoint and status in ('not_started', 'in_progress')
  );
$$;

create function public.checkpoint_is_submitted(_checkpoint uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.checkpoints where id = _checkpoint and status in ('submitted', 'reviewed')
  );
$$;

-- Evidence files live at {tenant_id}/{enrollment_id}/{checkpoint_id}/{file}. Returns the
-- enrollment only when the three ids in the path agree with each other.
create function public.evidence_path_enrollment(_path text) returns uuid
language sql stable security definer set search_path = '' as $$
  select e.id
  from public.checkpoints c
  join public.enrollments e on e.id = c.enrollment_id
  where array_length(string_to_array(_path, '/'), 1) = 4
    and c.id::text = split_part(_path, '/', 3)
    and e.id::text = split_part(_path, '/', 2)
    and e.tenant_id::text = split_part(_path, '/', 1);
$$;

-- The roles the signed-in user holds, for the app shell.
create function public.my_roles() returns table (role text, tenant_id uuid)
language sql stable security definer set search_path = '' as $$
  select 'merstra_admin', null::uuid from public.platform_admins where user_id = (select auth.uid())
  union all
  select tm.role::text, tm.tenant_id from public.tenant_members tm where tm.user_id = (select auth.uid())
  union all
  select distinct 'founder', s.tenant_id
  from public.startup_members sm join public.startups s on s.id = sm.startup_id
  where sm.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.create_enrollment_checkpoints() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.checkpoints (enrollment_id, type)
  values (new.id, 'benchmark'), (new.id, 'midline'), (new.id, 'endline');
  return new;
end $$;

create trigger enrollments_create_checkpoints after insert on public.enrollments
  for each row execute function public.create_enrollment_checkpoints();

-- First answer moves a checkpoint from not_started to in_progress.
create function public.mark_checkpoint_started() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.checkpoints set status = 'in_progress'
  where id = new.checkpoint_id and status = 'not_started';
  return new;
end $$;

create trigger responses_mark_started after insert on public.responses
  for each row execute function public.mark_checkpoint_started();

-- A program manager must belong to the program's tenant.
create function public.check_program_manager_tenant() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.programs p
    join public.tenant_members tm on tm.tenant_id = p.tenant_id
    where p.id = new.program_id and tm.user_id = new.user_id
  ) then
    raise exception 'A program manager must be a member of the program''s tenant';
  end if;
  return new;
end $$;

create trigger program_managers_check_tenant before insert or update on public.program_managers
  for each row execute function public.check_program_manager_tenant();

-- Scores and overrides are never changed after they are written.
create function public.forbid_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% rows are permanent and cannot be changed', tg_table_name;
end $$;

create trigger scores_immutable before update on public.scores
  for each row execute function public.forbid_update();
create trigger overrides_immutable before update on public.overrides
  for each row execute function public.forbid_update();

-- An override must match the score it points at.
create function public.check_override_matches_score() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.scores s
    where s.id = new.score_id and s.checkpoint_id = new.checkpoint_id and s.dimension = new.dimension
  ) then
    raise exception 'Override does not match the checkpoint and dimension of its system score';
  end if;
  return new;
end $$;

create trigger overrides_check_score before insert on public.overrides
  for each row execute function public.check_override_matches_score();

-- Evidence review: stamp who reviewed it and when.
create function public.stamp_evidence_review() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.review_status is distinct from old.review_status or new.review_note is distinct from old.review_note then
    new.reviewed_by = (select auth.uid());
    new.reviewed_at = now();
  end if;
  return new;
end $$;

create trigger evidence_stamp_review before update on public.evidence
  for each row execute function public.stamp_evidence_review();

do $$
declare t text;
begin
  foreach t in array array['profiles', 'tenants', 'programs', 'startups', 'enrollments', 'checkpoints', 'responses'] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end $$;

-- Audit: who changed what, with before and after. Written only by this trigger.
create function public.write_audit_log() returns trigger
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
  elsif tg_table_name = 'program_managers' then
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
    coalesce(_row ->> 'id', _row ->> 'user_id'),
    _tenant,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'tenants', 'tenant_members', 'programs', 'program_managers', 'startups', 'startup_members',
    'enrollments', 'checkpoints', 'evidence', 'scores', 'overrides'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit_log()',
      t || '_audit', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Submitting and reopening a checkpoint
-- ---------------------------------------------------------------------------
create function public.submit_checkpoint(_checkpoint uuid, _framework_version text) returns void
language plpgsql security definer set search_path = '' as $$
declare _enrollment uuid := public.checkpoint_enrollment(_checkpoint);
begin
  if _enrollment is null
     or not (public.is_enrollment_founder(_enrollment) or public.manages_enrollment(_enrollment)) then
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

-- Only a manager can reopen a submitted checkpoint.
create function public.reopen_checkpoint(_checkpoint uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.manages_enrollment(public.checkpoint_enrollment(_checkpoint)) then
    raise exception 'Not allowed';
  end if;
  update public.checkpoints
  set status = 'in_progress', submitted_at = null, submitted_by = null
  where id = _checkpoint and status in ('submitted', 'reviewed');
end $$;

-- A manager adds a startup and enrolls it in one step, so it is never left unreachable.
create function public.add_startup_to_program(_program uuid, _name text, _sector text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  _tenant uuid;
  _startup uuid;
begin
  if not (public.is_merstra_admin() or public.manages_program(_program)) then
    raise exception 'Not allowed';
  end if;
  select tenant_id into _tenant from public.programs where id = _program;
  insert into public.startups (tenant_id, name, sector) values (_tenant, _name, _sector)
  returning id into _startup;
  insert into public.enrollments (tenant_id, startup_id, program_id) values (_tenant, _startup, _program);
  return _startup;
end $$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.programs enable row level security;
alter table public.program_managers enable row level security;
alter table public.startups enable row level security;
alter table public.startup_members enable row level security;
alter table public.enrollments enable row level security;
alter table public.checkpoints enable row level security;
alter table public.responses enable row level security;
alter table public.evidence enable row level security;
alter table public.scores enable row level security;
alter table public.overrides enable row level security;
alter table public.audit_log enable row level security;

-- profiles: yourself, and Merstra admins. (Names of colleagues are exposed through views later, if needed.)
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_merstra_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()) or public.is_merstra_admin());

-- tenants
create policy tenants_select on public.tenants for select to authenticated
  using (public.is_merstra_admin() or public.is_tenant_member(id));
create policy tenants_insert on public.tenants for insert to authenticated
  with check (public.is_merstra_admin());
create policy tenants_update on public.tenants for update to authenticated
  using (public.is_merstra_admin() or public.is_tenant_admin(id))
  with check (public.is_merstra_admin() or public.is_tenant_admin(id));
create policy tenants_delete on public.tenants for delete to authenticated
  using (public.is_merstra_admin());

-- tenant_members
create policy tenant_members_select on public.tenant_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_merstra_admin() or public.is_tenant_admin(tenant_id));
create policy tenant_members_insert on public.tenant_members for insert to authenticated
  with check (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));
create policy tenant_members_update on public.tenant_members for update to authenticated
  using (public.is_merstra_admin() or public.is_tenant_admin(tenant_id))
  with check (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));
create policy tenant_members_delete on public.tenant_members for delete to authenticated
  using (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));

-- programs: tenant admins see all of their tenant's; managers only the ones assigned to them;
-- founders the ones their startup is enrolled in.
create policy programs_select on public.programs for select to authenticated
  using (
    public.is_merstra_admin()
    or public.manages_program(id)
    or exists (
      select 1 from public.enrollments e
      where e.program_id = programs.id and public.is_startup_member(e.startup_id)
    )
  );
create policy programs_insert on public.programs for insert to authenticated
  with check (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));
create policy programs_update on public.programs for update to authenticated
  using (public.is_merstra_admin() or public.is_tenant_admin(tenant_id))
  with check (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));
create policy programs_delete on public.programs for delete to authenticated
  using (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));

-- program_managers
create policy program_managers_select on public.program_managers for select to authenticated
  using (user_id = (select auth.uid()) or public.is_merstra_admin() or public.manages_program(program_id));
create policy program_managers_insert on public.program_managers for insert to authenticated
  with check (
    public.is_merstra_admin()
    or exists (select 1 from public.programs p where p.id = program_id and public.is_tenant_admin(p.tenant_id))
  );
create policy program_managers_delete on public.program_managers for delete to authenticated
  using (
    public.is_merstra_admin()
    or exists (select 1 from public.programs p where p.id = program_id and public.is_tenant_admin(p.tenant_id))
  );

-- startups
create policy startups_select on public.startups for select to authenticated
  using (public.is_merstra_admin() or public.is_startup_member(id) or public.manages_startup(id));
-- Tenant admins insert directly; managers go through add_startup_to_program, which enrolls it at once.
create policy startups_insert on public.startups for insert to authenticated
  with check (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));
create policy startups_update on public.startups for update to authenticated
  using (public.is_merstra_admin() or public.manages_startup(id))
  with check (public.is_merstra_admin() or public.is_tenant_member(tenant_id));
create policy startups_delete on public.startups for delete to authenticated
  using (public.is_merstra_admin() or public.is_tenant_admin(tenant_id));

-- startup_members
create policy startup_members_select on public.startup_members for select to authenticated
  using (
    user_id = (select auth.uid()) or public.is_merstra_admin()
    or public.is_startup_member(startup_id) or public.manages_startup(startup_id)
  );
create policy startup_members_insert on public.startup_members for insert to authenticated
  with check (public.is_merstra_admin() or public.manages_startup(startup_id));
create policy startup_members_delete on public.startup_members for delete to authenticated
  using (public.is_merstra_admin() or public.manages_startup(startup_id));

-- enrollments
create policy enrollments_select on public.enrollments for select to authenticated
  using (public.can_read_enrollment(id));
create policy enrollments_insert on public.enrollments for insert to authenticated
  with check (public.is_merstra_admin() or public.manages_program(program_id));
create policy enrollments_update on public.enrollments for update to authenticated
  using (public.is_merstra_admin() or public.manages_program(program_id))
  with check (public.is_merstra_admin() or public.manages_program(program_id));
create policy enrollments_delete on public.enrollments for delete to authenticated
  using (public.is_merstra_admin() or public.manages_program(program_id));

-- checkpoints: read with the enrollment. Status changes go through submit_checkpoint / reopen_checkpoint;
-- managers may also mark a checkpoint reviewed.
create policy checkpoints_select on public.checkpoints for select to authenticated
  using (public.can_read_enrollment(enrollment_id));
create policy checkpoints_update on public.checkpoints for update to authenticated
  using (public.manages_enrollment(enrollment_id))
  with check (public.manages_enrollment(enrollment_id));

-- responses: founders write only while the checkpoint is open; managers may enter on a founder's behalf.
create policy responses_select on public.responses for select to authenticated
  using (public.can_read_enrollment(public.checkpoint_enrollment(checkpoint_id)));
create policy responses_insert on public.responses for insert to authenticated
  with check (
    public.checkpoint_is_editable(checkpoint_id)
    and (
      (public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id)) and not entered_by_manager)
      or (public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id)) and entered_by_manager)
    )
  );
create policy responses_update on public.responses for update to authenticated
  using (
    public.checkpoint_is_editable(checkpoint_id)
    and (
      public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id))
      or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
    )
  )
  with check (
    public.checkpoint_is_editable(checkpoint_id)
    and (
      (public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id)) and not entered_by_manager)
      or (public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id)) and entered_by_manager)
    )
  );
create policy responses_delete on public.responses for delete to authenticated
  using (
    public.checkpoint_is_editable(checkpoint_id)
    and (
      public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id))
      or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
    )
  );

-- evidence: founders add and remove while the checkpoint is open; managers add at any time and review.
create policy evidence_select on public.evidence for select to authenticated
  using (public.can_read_enrollment(public.checkpoint_enrollment(checkpoint_id)));
create policy evidence_insert on public.evidence for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and review_status = 'pending' and review_note is null and reviewed_by is null and reviewed_at is null
    and (
      (public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id))
        and public.checkpoint_is_editable(checkpoint_id))
      or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
    )
    and (kind = 'link'
         or public.evidence_path_enrollment(storage_path) = public.checkpoint_enrollment(checkpoint_id))
  );
create policy evidence_review on public.evidence for update to authenticated
  using (public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id)))
  with check (public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id)));
create policy evidence_delete on public.evidence for delete to authenticated
  using (
    (uploaded_by = (select auth.uid())
      and public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id))
      and public.checkpoint_is_editable(checkpoint_id))
    or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
  );

-- scores: managers always; founders only once the checkpoint is submitted. Written by the scoring
-- service (service role) or a manager-triggered run; never updated.
create policy scores_select on public.scores for select to authenticated
  using (
    public.is_merstra_admin()
    or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
    or (public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id))
        and public.checkpoint_is_submitted(checkpoint_id))
  );
create policy scores_insert on public.scores for insert to authenticated
  with check (public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id)));

create policy overrides_select on public.overrides for select to authenticated
  using (
    public.is_merstra_admin()
    or public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
    or (public.is_enrollment_founder(public.checkpoint_enrollment(checkpoint_id))
        and public.checkpoint_is_submitted(checkpoint_id))
  );
create policy overrides_insert on public.overrides for insert to authenticated
  with check (
    author = (select auth.uid())
    and public.manages_enrollment(public.checkpoint_enrollment(checkpoint_id))
  );

-- audit_log: read-only. Merstra sees everything; tenant admins see their own tenant.
create policy audit_log_select on public.audit_log for select to authenticated
  using (public.is_merstra_admin() or (tenant_id is not null and public.is_tenant_admin(tenant_id)));

-- ---------------------------------------------------------------------------
-- Privileges: nothing for anon; column-limited updates where it matters.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- Managers may change only the review fields of evidence, and only the status of a checkpoint.
revoke update on public.evidence from authenticated;
grant update (review_status, review_note) on public.evidence to authenticated;
revoke update on public.checkpoints from authenticated;
grant update (status) on public.checkpoints to authenticated;
revoke insert, update, delete on public.audit_log from authenticated;
revoke insert, update, delete on public.platform_admins from authenticated;
revoke update, delete on public.scores from authenticated;
revoke update, delete on public.overrides from authenticated;
revoke insert, delete on public.checkpoints from authenticated;
revoke insert, delete on public.profiles from authenticated;

-- ---------------------------------------------------------------------------
-- Evidence storage: private bucket, 10 MB, document and image types only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence', 'evidence', false, 10485760,
  array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv', 'text/plain'
  ]
)
on conflict (id) do nothing;

create policy evidence_files_select on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and public.can_read_enrollment(public.evidence_path_enrollment(name)));

create policy evidence_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (
      public.manages_enrollment(public.evidence_path_enrollment(name))
      or (public.is_enrollment_founder(public.evidence_path_enrollment(name))
          and public.checkpoint_is_editable(split_part(name, '/', 3)::uuid))
    )
  );

create policy evidence_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (
      public.manages_enrollment(public.evidence_path_enrollment(name))
      or (owner_id = (select auth.uid())::text
          and public.is_enrollment_founder(public.evidence_path_enrollment(name))
          and public.checkpoint_is_editable(split_part(name, '/', 3)::uuid))
    )
  );
