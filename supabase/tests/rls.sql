-- Tenant-isolation tests. Run the whole file as one batch with a privileged role.
-- It builds its own fixtures, checks each rule as a real signed-in user, then rolls
-- everything back: no row it creates survives. The final SELECT lists every test.
create or replace function pg_temp.rls_tests() returns table (test text, passed boolean, detail text)
language plpgsql as $fn$
declare
  names text[] := '{}'; oks boolean[] := '{}'; notes text[] := '{}';
  admin uuid := gen_random_uuid(); ta1 uuid := gen_random_uuid(); m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid(); fa uuid := gen_random_uuid(); fb uuid := gen_random_uuid();
  t1 uuid; t2 uuid; p1 uuid; p1b uuid; p2 uuid;
  sa uuid; sb uuid; sc uuid; sd uuid; ea uuid; eb uuid; ed uuid; ca uuid; cb uuid; cd uuid;
  score_a uuid; ev_a uuid; n int; n2 int; ok boolean; s text;
begin
  begin
    -- Fixtures -------------------------------------------------------------
    insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    select u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
           'rls-test-' || u || '@example.org', '{}', '{}', now(), now()
    from unnest(array[admin, ta1, m1, m2, fa, fb]) u;
    insert into public.platform_admins (user_id) values (admin);
    insert into public.tenants (name) values ('RLS test tenant 1') returning id into t1;
    insert into public.tenants (name) values ('RLS test tenant 2') returning id into t2;
    insert into public.tenant_members (tenant_id, user_id, role)
    values (t1, ta1, 'customer_admin'), (t1, m1, 'manager'), (t2, m2, 'manager');
    insert into public.programs (tenant_id, name) values (t1, 'P1') returning id into p1;
    insert into public.programs (tenant_id, name) values (t1, 'P1b') returning id into p1b;
    insert into public.programs (tenant_id, name) values (t2, 'P2') returning id into p2;
    insert into public.program_managers (program_id, user_id) values (p1, m1), (p2, m2);
    insert into public.startups (tenant_id, name) values (t1, 'A') returning id into sa;
    insert into public.startups (tenant_id, name) values (t1, 'B') returning id into sb;
    insert into public.startups (tenant_id, name) values (t1, 'C') returning id into sc;
    insert into public.startups (tenant_id, name) values (t2, 'D') returning id into sd;
    insert into public.startup_members (startup_id, user_id) values (sa, fa), (sb, fb);
    insert into public.enrollments (tenant_id, startup_id, program_id) values (t1, sa, p1) returning id into ea;
    insert into public.enrollments (tenant_id, startup_id, program_id) values (t1, sb, p1) returning id into eb;
    insert into public.enrollments (tenant_id, startup_id, program_id) values (t1, sc, p1b);
    insert into public.enrollments (tenant_id, startup_id, program_id) values (t2, sd, p2) returning id into ed;
    select id into ca from public.checkpoints where enrollment_id = ea and type = 'benchmark';
    select id into cb from public.checkpoints where enrollment_id = eb and type = 'benchmark';
    select id into cd from public.checkpoints where enrollment_id = ed and type = 'benchmark';
    insert into public.responses (checkpoint_id, question_id, option_id, entered_by)
    values (ca, 'cus.segment_clarity', 'own_belief', fa), (cb, 'cus.segment_clarity', 'own_belief', fb),
           (cd, 'cus.segment_clarity', 'own_belief', null);
    insert into public.evidence (checkpoint_id, kind, url, evidence_type, dimension, uploaded_by)
    values (ca, 'link', 'https://example.org/a', 'conversation_notes', 'CUS', fa) returning id into ev_a;
    insert into public.scores (checkpoint_id, dimension, system_stage, confidence, rationale, framework_version)
    values (ca, 'CUS', 2, 'MEDIUM', 'test', '1') returning id into score_a;
    insert into public.scores (checkpoint_id, dimension, system_stage, confidence, rationale, framework_version)
    values (cd, 'CUS', 3, 'MEDIUM', 'test', '1');

    -- Founder A ------------------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', fa, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.startups;
    names := names || 'founder reads only their own startup'::text; oks := oks || (n = 1); notes := notes || ('startups visible: ' || n);
    select count(*) into n from public.startups where id in (sb, sc, sd);
    select count(*) into n2 from public.responses where checkpoint_id in (cb, cd);
    names := names || 'founder cannot read another startup or its answers'::text; oks := oks || (n = 0 and n2 = 0); notes := notes || ('startups: ' || n || ', responses: ' || n2);
    select count(*) into n from public.checkpoints where enrollment_id <> ea;
    select count(*) into n2 from public.tenants;
    names := names || 'founder cannot read other checkpoints or any tenant record'::text; oks := oks || (n = 0 and n2 = 0); notes := notes || ('checkpoints: ' || n || ', tenants: ' || n2);
    select count(*) into n from public.scores;
    names := names || 'founder cannot see scores before submitting'::text; oks := oks || (n = 0); notes := notes || ('scores visible: ' || n);
    ok := false; begin
      insert into public.responses (checkpoint_id, question_id, option_id) values (cb, 'cus.pattern', 'answers_vary');
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'founder cannot answer on another startup''s checkpoint'::text; oks := oks || ok; notes := notes || coalesce(s, 'insert was allowed');
    ok := false; s := null; begin
      insert into public.scores (checkpoint_id, dimension, system_stage, confidence, rationale, framework_version)
      values (ca, 'PRD', 9, 'HIGH', 'self-awarded', '1');
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'founder cannot write a score'::text; oks := oks || ok; notes := notes || coalesce(s, 'insert was allowed');
    s := null; begin
      update public.evidence set review_status = 'accepted' where id = ev_a;
    exception when others then s := sqlerrm; end;
    perform set_config('role', 'none', true);
    select (review_status = 'pending') into ok from public.evidence where id = ev_a;
    names := names || 'founder cannot mark their own evidence accepted'::text; oks := oks || ok; notes := notes || coalesce(s, 'update matched no rows');
    perform set_config('role', 'authenticated', true);
    perform public.submit_checkpoint(ca, '1');
    select count(*) into n from public.scores;
    names := names || 'founder sees their scores after submitting'::text; oks := oks || (n = 1); notes := notes || ('scores visible: ' || n);
    ok := false; s := null; begin
      insert into public.responses (checkpoint_id, question_id, option_id) values (ca, 'cus.pattern', 'answers_vary');
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'founder cannot change answers after submitting'::text; oks := oks || ok; notes := notes || coalesce(s, 'insert was allowed');
    ok := false; s := null; begin
      perform public.reopen_checkpoint(ca);
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'founder cannot reopen a submitted checkpoint'::text; oks := oks || ok; notes := notes || coalesce(s, 'reopen was allowed');
    select count(*) into n from public.audit_log;
    names := names || 'founder cannot read the audit log'::text; oks := oks || (n = 0); notes := notes || ('rows visible: ' || n);

    -- Manager of P1 in tenant 1 -------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', m1, 'role', 'authenticated')::text, true);
    select count(*) into n from public.startups;
    names := names || 'manager reads the startups in their assigned program'::text; oks := oks || (n = 2); notes := notes || ('startups visible: ' || n);
    select count(*) into n from public.startups where id = sc;
    select count(*) into n2 from public.programs where id = p1b;
    names := names || 'manager cannot read an unassigned program in the same tenant'::text; oks := oks || (n = 0 and n2 = 0); notes := notes || ('startups: ' || n || ', programs: ' || n2);
    select count(*) into n from (
      select id from public.tenants where id = t2 union all select id from public.programs where tenant_id = t2
      union all select id from public.startups where tenant_id = t2 union all select id from public.enrollments where tenant_id = t2
      union all select id from public.checkpoints where id = cd union all select id from public.responses where checkpoint_id = cd
      union all select id from public.scores where checkpoint_id = cd) x;
    names := names || 'manager cannot read anything in another tenant'::text; oks := oks || (n = 0); notes := notes || ('rows visible across 7 tables: ' || n);
    ok := false; s := null; begin
      insert into public.overrides (score_id, checkpoint_id, dimension, manager_stage, justification)
      values (score_a, ca, 'CUS', 3, 'too short');
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'override is refused without a 50-character justification'::text; oks := oks || ok; notes := notes || coalesce(s, 'insert was allowed');
    ok := true; s := null; begin
      insert into public.overrides (score_id, checkpoint_id, dimension, manager_stage, justification)
      values (score_a, ca, 'CUS', 3, 'Signed pilot agreement seen on the review call; raises Customer by one stage.');
    exception when others then ok := false; s := sqlerrm; end;
    select count(*) into n from public.scores where id = score_a and system_stage = 2;
    names := names || 'manager can override, and the system score is kept alongside'::text; oks := oks || (ok and n = 1); notes := notes || coalesce(s, 'override stored; system score unchanged');
    ok := false; s := null; begin
      insert into public.responses (checkpoint_id, question_id, option_id, entered_by_manager) values (cb, 'cus.pattern', 'answers_vary', false);
    exception when others then ok := true; s := sqlerrm; end;
    insert into public.responses (checkpoint_id, question_id, option_id, entered_by_manager) values (cb, 'cus.pattern', 'answers_vary', true);
    names := names || 'manager entries must be flagged as entered by manager'::text; oks := oks || ok; notes := notes || coalesce(s, 'unflagged insert was allowed');

    -- Manager in tenant 2 --------------------------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', m2, 'role', 'authenticated')::text, true);
    ok := false; s := null; begin
      insert into public.overrides (score_id, checkpoint_id, dimension, manager_stage, justification)
      values (score_a, ca, 'CUS', 9, 'An override from a manager in a different tenant must never be accepted.');
    exception when others then ok := true; s := sqlerrm; end;
    select count(*) into n from public.startups where tenant_id = t1;
    names := names || 'manager in another tenant cannot read or override'::text; oks := oks || (ok and n = 0); notes := notes || coalesce(s, 'override was allowed');

    -- Tenant admin, Merstra admin, anonymous ------------------------------
    perform set_config('request.jwt.claims', json_build_object('sub', ta1, 'role', 'authenticated')::text, true);
    select count(*) into n from public.startups;
    select count(*) into n2 from public.audit_log where tenant_id is distinct from t1;
    names := names || 'tenant admin sees their whole tenant and nothing else'::text; oks := oks || (n = 3 and n2 = 0); notes := notes || ('startups: ' || n || ', foreign audit rows: ' || n2);
    select count(*) into n from public.audit_log where tenant_id = t1 and table_name = 'overrides';
    names := names || 'overrides are recorded in the audit log'::text; oks := oks || (n = 1); notes := notes || ('override audit rows: ' || n);
    perform set_config('request.jwt.claims', json_build_object('sub', admin, 'role', 'authenticated')::text, true);
    select count(*) into n from public.tenants where id in (t1, t2);
    names := names || 'Merstra admin sees all tenants'::text; oks := oks || (n = 2); notes := notes || ('test tenants visible: ' || n);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
    ok := false; s := null; begin
      select count(*) into n from public.tenants; ok := (n = 0); s := 'rows visible: ' || n;
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'signed-out visitors read nothing'::text; oks := oks || ok; notes := notes || s;

    -- Integrity rules, checked with full privileges -----------------------
    perform set_config('role', 'none', true);
    ok := false; s := null; begin
      update public.scores set system_stage = 9 where id = score_a;
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'a stored score can never be changed'::text; oks := oks || ok; notes := notes || coalesce(s, 'update was allowed');
    ok := false; s := null; begin
      insert into public.enrollments (tenant_id, startup_id, program_id) values (t1, sa, p2);
    exception when others then ok := true; s := sqlerrm; end;
    names := names || 'a startup cannot be enrolled in another tenant''s program'::text; oks := oks || ok; notes := notes || coalesce(s, 'insert was allowed');
    ok := public.evidence_path_enrollment(t1 || '/' || ea || '/' || ca || '/file.pdf') = ea
      and public.evidence_path_enrollment(t2 || '/' || ea || '/' || ca || '/file.pdf') is null;
    names := names || 'evidence file paths are tied to tenant, enrollment and checkpoint'::text; oks := oks || ok; notes := notes || 'path check'::text;

    raise exception 'ROLLBACK_FIXTURES';
  exception when others then
    perform set_config('role', 'none', true);
    if sqlerrm <> 'ROLLBACK_FIXTURES' then
      names := names || 'TEST RUN ABORTED'::text; oks := oks || false; notes := notes || sqlerrm;
    end if;
  end;
  return query select names[i], oks[i], notes[i] from generate_subscripts(names, 1) i;
end $fn$;

select * from pg_temp.rls_tests();
