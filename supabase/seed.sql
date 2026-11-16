-- Sample data for development: 1 tenant, 1 program, 6 startups at different stages of completion.
-- Safe to re-run: it removes its own earlier rows first. Every id is derived from a fixed label.
-- Sample users have example.org addresses and no password, so nobody can sign in as them.
-- No scores are seeded: scores come from the scoring engine, not from made-up numbers.
begin;

delete from public.tenants where id = md5('seed:tenant')::uuid;
delete from auth.users where email like 'seed.%@example.org';

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select md5('seed:user:' || u)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       'seed.' || u || '@example.org', '{}', jsonb_build_object('full_name', 'Sample ' || replace(u, '.', ' ')), now(), now()
from unnest(array['admin', 'manager', 'founder.1', 'founder.2', 'founder.3', 'founder.4', 'founder.5', 'founder.6']) u;

insert into public.tenants (id, name, type, country)
values (md5('seed:tenant')::uuid, 'Sample incubator', 'incubator', 'India');
insert into public.tenant_members (tenant_id, user_id, role) values
  (md5('seed:tenant')::uuid, md5('seed:user:admin')::uuid, 'customer_admin'),
  (md5('seed:tenant')::uuid, md5('seed:user:manager')::uuid, 'manager');
insert into public.programs (id, tenant_id, name, start_date, end_date, sector_tags, status)
values (md5('seed:program')::uuid, md5('seed:tenant')::uuid, 'Sample cohort 2026', '2026-09-01', '2027-02-28',
        array['agritech', 'medtech', 'cleantech'], 'active');
insert into public.program_managers (program_id, user_id)
values (md5('seed:program')::uuid, md5('seed:user:manager')::uuid);

insert into public.startups (id, tenant_id, name, sector)
select md5('seed:startup:' || n)::uuid, md5('seed:tenant')::uuid, 'Sample venture ' || n,
       (array['agritech', 'medtech', 'cleantech', 'agritech', 'medtech', 'cleantech'])[n]
from generate_series(1, 6) n;
insert into public.startup_members (startup_id, user_id)
select md5('seed:startup:' || n)::uuid, md5('seed:user:founder.' || n)::uuid from generate_series(1, 6) n;
insert into public.enrollments (id, tenant_id, startup_id, program_id)
select md5('seed:enrollment:' || n)::uuid, md5('seed:tenant')::uuid, md5('seed:startup:' || n)::uuid, md5('seed:program')::uuid
from generate_series(1, 6) n;

-- One row per question: the option a venture around Stage 2, 4 or 6 would pick.
create temporary table seed_q (ord int, question_id text, dimension text, evidence_type text, opt_low text, opt_mid text, opt_high text) on commit drop;
insert into seed_q values
  (0,'cus.segment_clarity','CUS','segment_problem_statement','mixed_answers','confirmed_by_interviews','confirmed_by_interviews'),
  (1,'cus.conversations','CUS','conversation_notes','a_few','many','many'),
  (2,'cus.pattern','CUS','interview_log','answers_vary','pattern_logged','pattern_logged'),
  (3,'cus.written_offer','CUS','written_offer',null,'written_and_shared','written_and_shared'),
  (4,'cus.user_testing','CUS','user_test_record',null,'feedback_recorded','feedback_changed_something'),
  (5,'cus.signed_commitment','CUS','letter_of_intent',null,'verbal_interest','signed'),
  (6,'cus.success_measures','CUS','pilot_plan',null,null,'agreed_in_writing'),
  (7,'cus.paying_customers','CUS','invoice_or_payment_record',null,null,'first_one'),
  (8,'cus.pipeline','CUS','pipeline_list',null,null,null),
  (9,'cus.retention','CUS','retention_data',null,null,null),
  (10,'prd.what_exists','PRD','design_document','written_plan','works_in_own_tests','works_near_real_use'),
  (11,'prd.build_plan','PRD','design_document','buildable_plan','buildable_plan','buildable_plan'),
  (12,'prd.testing_done','PRD','test_report',null,'measured','retested'),
  (13,'prd.key_measure','PRD','test_report',null,'measured_own_tests','measured_in_field'),
  (14,'prd.iteration','PRD','test_report',null,'changed_not_retested','changed_and_retested'),
  (15,'prd.environment','PRD','field_trial_log',null,'own_lab','external_site'),
  (16,'prd.consistency','PRD','performance_data',null,null,null),
  (17,'prd.support','PRD','volume_records',null,null,null),
  (18,'biz.who_pays','BIZ','written_model','written','written','written'),
  (19,'biz.cost_and_price','BIZ','cost_price_sheet',null,'own_estimates','real_figures'),
  (20,'biz.price_tested','BIZ','price_discussion_record',null,'adjusted','paid_or_committed'),
  (21,'biz.unit_margin','BIZ','cost_price_sheet',null,'rough','from_real_figures'),
  (22,'biz.routes_to_market','BIZ','go_to_market_plan',null,'general_list','named_plan'),
  (23,'biz.test_sales','BIZ','invoice_or_payment_record',null,null,'a_few'),
  (24,'biz.delivery_plan','BIZ','delivery_plan',null,null,'written_plan'),
  (25,'biz.growth_review','BIZ','growth_plan',null,null,null),
  (26,'mot.hard_to_copy','MOT','uniqueness_note','cannot_say','written','written'),
  (27,'mot.existing_check','MOT','search_notes','started','started','risk_reviewed'),
  (28,'mot.ownership','MOT','ownership_agreement','verbal','signed','signed'),
  (29,'mot.protection_route','MOT','protection_plan',null,'written_plan','written_plan'),
  (30,'mot.preparation','MOT','draft_applications',null,'on_our_own','with_professional'),
  (31,'mot.record_keeping','MOT','record_keeping',null,'informal','standard_and_confidential'),
  (32,'mot.formal_protection','MOT','filing_receipt',null,null,'first_in_place'),
  (33,'mot.business_link','MOT','protection_revenue_plan',null,null,null),
  (34,'tea.core_team','TEA','role_map','in_talks','roles_owned','roles_owned'),
  (35,'tea.gaps','TEA','gap_list',null,'written','written'),
  (36,'tea.rhythm','TEA','weekly_tracker',null,'weekly_recorded','kept_over_time'),
  (37,'tea.advisers','TEA','adviser_list',null,'names_only','active_independent'),
  (38,'tea.hiring_plan','TEA','hiring_plan',null,'informal','written'),
  (39,'tea.founder_agreement','TEA','founder_agreement',null,'verbal','signed'),
  (40,'tea.functions_covered','TEA','role_map',null,null,'covered_uneven'),
  (41,'tea.leadership','TEA','governance_records',null,null,null),
  (42,'cap.runway_view','CAP','budget_runway_sheet','budget','budget','budget'),
  (43,'cap.pitch','CAP','pitch_deck','partial','with_data','with_data'),
  (44,'cap.milestones','CAP','milestone_list',null,'listed','tied_to_amounts'),
  (45,'cap.funder_progress','CAP','outreach_plan',null,'plan_no_contact','live'),
  (46,'cap.use_of_funds','CAP','use_of_funds_statement',null,null,'written'),
  (47,'cap.document_set','CAP','funder_document_set',null,null,'full_set'),
  (48,'cap.commitments','CAP','commitment_letter',null,null,'verbal'),
  (49,'cap.controls','CAP','runway_plan',null,null,null);

-- What each startup has filled in.
--   1: everything, strong position, evidence on every answer      -> Benchmark submitted
--   2: everything, middling position, evidence on one answer in 3 -> Benchmark submitted
--   3: first four dimensions, evidence on half                    -> in progress
--   4: Customer only, no evidence                                 -> in progress
--   5: nothing                                                    -> not started
--   6: Benchmark complete and submitted (early position); Midline started on two dimensions
create temporary table seed_plan (n int, cp public.checkpoint_type, tier text, dims text[], evidence_every int) on commit drop;
insert into seed_plan values
  (1, 'benchmark', 'high', array['CUS','PRD','BIZ','MOT','TEA','CAP'], 1),
  (2, 'benchmark', 'mid',  array['CUS','PRD','BIZ','MOT','TEA','CAP'], 3),
  (3, 'benchmark', 'mid',  array['CUS','PRD','BIZ','MOT'], 2),
  (4, 'benchmark', 'low',  array['CUS'], 0),
  (6, 'benchmark', 'low',  array['CUS','PRD','BIZ','MOT','TEA','CAP'], 1),
  (6, 'midline',   'mid',  array['CUS','PRD'], 2);

insert into public.responses (checkpoint_id, question_id, option_id, entered_by)
select c.id, q.question_id,
       case p.tier when 'low' then q.opt_low when 'mid' then q.opt_mid else q.opt_high end,
       md5('seed:user:founder.' || p.n)::uuid
from seed_plan p
join public.checkpoints c on c.enrollment_id = md5('seed:enrollment:' || p.n)::uuid and c.type = p.cp
join seed_q q on q.dimension = any (p.dims)
where case p.tier when 'low' then q.opt_low when 'mid' then q.opt_mid else q.opt_high end is not null;

insert into public.evidence (checkpoint_id, kind, url, file_name, evidence_type, dimension, question_id, uploaded_by)
select c.id, 'link', 'https://example.org/sample-evidence/' || p.n || '/' || q.question_id, null,
       q.evidence_type, q.dimension, q.question_id, md5('seed:user:founder.' || p.n)::uuid
from seed_plan p
join public.checkpoints c on c.enrollment_id = md5('seed:enrollment:' || p.n)::uuid and c.type = p.cp
join seed_q q on q.dimension = any (p.dims)
where p.evidence_every > 0 and q.ord % p.evidence_every = 0
  and case p.tier when 'low' then q.opt_low when 'mid' then q.opt_mid else q.opt_high end is not null;

update public.checkpoints c set status = 'submitted', submitted_at = now(), framework_version = '1', submitted_by = sm.user_id
from public.enrollments e join public.startup_members sm on sm.startup_id = e.startup_id
where c.enrollment_id = e.id and c.type = 'benchmark'
  and e.id in (md5('seed:enrollment:1')::uuid, md5('seed:enrollment:2')::uuid, md5('seed:enrollment:6')::uuid);

commit;

select s.name, c.type, c.status,
       (select count(*) from public.responses r where r.checkpoint_id = c.id) as answers,
       (select count(*) from public.evidence v where v.checkpoint_id = c.id) as evidence
from public.startups s join public.enrollments e on e.startup_id = s.id join public.checkpoints c on c.enrollment_id = e.id
where s.tenant_id = md5('seed:tenant')::uuid and (c.type = 'benchmark' or c.status <> 'not_started')
order by s.name, c.type;
