# Audit of the legacy app (`ebin1ephrem/merstra-srl`)

Audited at commit `f49a571` (single squashed commit, 2026-11-16). Read-only: nothing in that repo was changed.
This file quotes legacy vocabulary by necessity and is excluded from the banned-term grep.

**What I could not see:** the live database. Everything about the schema comes from the 14 migration files and the generated types. Row counts, data entered outside migrations, and any dashboard-side policy edits are unknown. Section 6 lists what you need to run to close that gap.

## Headline findings

1. **The active founder form and the dashboards are not connected.** The form writes to `benchmark_responses` / `benchmark_dimension_results`. The founder profile radar, the cohort heat map and the PDF all read `dimension_scores`, which only the older, unrouted survey flow writes. A benchmark completed through the live form produces no cohort data.
2. **Auto-scores are structurally capped.** Migration `20260510180142` turned every file-upload question into a pasted link, but `compute_benchmark_scores` still counts `evidence_file_ids`, which the form never fills. Every evidence-gated branch is unreachable: Customer cannot exceed level 3; confidence can never be HIGH on Customer, Business Model or Capital.
3. **Tenant isolation has a real hole.** Both invite functions look up startups by `legal_name` across all tenants. A manager in tenant B who invites a founder under a name that exists in tenant A attaches that founder to tenant A's startup, with read/write access to its assessments.
4. **Founders can read system scores before review** (`bdr_select` uses `can_access_enrollment`) and can un-submit or edit a submitted assessment through the API; the lock is enforced only in the React UI until status is `finalized`.
5. **The public site makes claims that are almost certainly untrue today**: "SOC 2 Type II", "GDPR-compliant", EU/India/GCC data residency, on-prem, named institutions and networks as users.
6. **Licensing.** The site states the framework is built on a third-party framework published under CC BY-NC-SA. The level descriptors in the seed data are close to that source. A paid product is a commercial use. Renaming stages does not by itself cure this; the descriptors must be genuinely rewritten from Merstra's own criteria. Get a lawyer's view before launch. (Likely, not certain: I am not a lawyer and have not compared texts line by line.)

## 1. Stack, tooling, deployment

| Item | Finding | Path |
|---|---|---|
| Framework | React 18.3, TypeScript 5.8, Vite 5.4 (SWC), React Router 6.30, TanStack Query 5 | `package.json` |
| UI | Tailwind 3.4, shadcn/ui (48 components, ~25 unused), lucide, Recharts 2.15, sonner | `src/components/ui/` |
| Backend | Supabase JS 2.105; project ref `yuqxtffphagisnpqsstj`; 3 Deno edge functions | `supabase/` |
| PDF | jsPDF 4.2 client-side; html2canvas installed but unused | `src/lib/pdf.ts` |
| Forms | react-hook-form + zod installed; the main form uses neither | `src/pages/founder/FounderBenchmark.tsx` |
| Tests | Vitest 3.2 + Testing Library; one placeholder test | `src/test/example.test.ts` |
| Env vars | `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL` | `.env` (committed) |
| Edge secrets | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | function code |
| Deployment | Lovable hosting (`merstra-srl.lovable.app`). No CI, no Dockerfile, no Vercel/Netlify config. `supabase/config.toml` holds only the project id | — |
| Lockfiles | `bun.lockb` and `package-lock.json` both present; `package-lock.json` is out of sync (`npm ci` fails) and needs `--legacy-peer-deps` (`react-day-picker` 8 vs `date-fns` 4) | repo root |

**Lovable-generated vs hand-written:** effectively all of it is Lovable-generated. One commit, authored by Lovable. `README.md` is the original master prompt. Files marked auto-generated: `src/integrations/supabase/client.ts`, `types.ts`, `src/integrations/lovable/index.ts`. Google sign-in goes through `@lovable.dev/cloud-auth-js`, so auth depends on Lovable Cloud. Pushes to `main` sync back into the Lovable editor.

## 2. Supabase

### Tables (31, all with RLS enabled — none without)

| Group | Tables |
|---|---|
| Identity | `profiles`, `user_roles` (enum `app_role`) |
| Tenancy | `customers`, `customer_users`, `programs`, `program_managers`, `startups` (global), `startup_team`, `enrollments` (unique startup x program) |
| Framework v1 (survey) | `srl_dimensions` (with `min_signals_threshold`), `srl_levels`, `survey_questions`, `question_options` |
| Assessment v1 | `assessments` (unique enrollment x type), `assessment_responses`, `dimension_scores` |
| Assessment v2 (active form) | `benchmark_questions` (text ids), `benchmark_responses` (jsonb), `benchmark_dimension_results`, `company_snapshots` |
| Plan / risk | `ninety_day_plans`, `ninety_day_milestones`, `benchmark_risks`, `support_requests` (v2); `action_milestones`, `risks`, `mentoring_logs` (v1) |
| Evidence | `evidence_files` (+ `supports_question_id`) |
| Ops | `audit_log`, `impersonation_sessions`, `access_requests` |

### RLS model
Security-definer helpers in `20260505192215_*.sql`: `has_role`, `is_customer_member`, `is_customer_admin`, `is_program_manager`, `is_startup_member`, `can_access_enrollment`, `can_manage_enrollment`, `assessment_enrollment`, `program_customer`, later `can_view_profile`. The design is sound and worth keeping.

Weak policies:

| Table | Problem |
|---|---|
| `benchmark_dimension_results` | Founders can SELECT computed levels before finalisation |
| `assessments` (UPDATE) | Founder may move status between `not_started` / `in_progress` / `founder_submitted`, so can un-submit |
| `assessments` (INSERT) | Requires manager rights, but the founder form inserts the row itself. As written in migrations the founder's first load fails. Either the live DB differs from the migrations or this flow is broken |
| `benchmark_responses` | Lock trigger fires only on `finalized`; editable after submit via API |
| `ninety_day_*`, `benchmark_risks`, `support_requests`, `company_snapshots` (insert) | No lock at all; founders can write after finalisation |
| `startups` (INSERT) | Any manager of any tenant can insert; `startups` has no tenant column |
| `startups` (UPDATE) | Founders can rename their startup, which feeds the name-match problem in finding 3 |
| `audit_log` (INSERT) | Any signed-in user can insert arbitrary rows with their own actor id |
| `access_requests` (INSERT) | Open to anonymous with no rate limit |
| `dimension_scores` | `manager_score` and `final_score` live on one mutable row; override history is not preserved |

### Functions and triggers
- `compute_dimension_score`, `recompute_assessment_scores` (v1 scoring).
- `compute_benchmark_scores` + `bench_val/text/num/files` (v2 scoring), fired per row by trigger `br_recompute` on every autosave.
- `guard_locked_assessment`, `write_audit_log` (on `customers`, `programs`, `enrollments`, `assessments`, `dimension_scores` only), `bootstrap_customer_admin`, `handle_new_user`, `set_updated_at`.
- `handle_new_user` grants `merstra_admin` by a hardcoded two-address allowlist, repeated in four migrations.

### Edge functions
| Function | Does | Problems |
|---|---|---|
| `invite-user` | Creates user with temp password, assigns role, creates startup + enrollment | Returns temp password to the browser; `listUsers()` reads only the first page, so lookups fail beyond 50 users; startup matched by name across tenants; CORS `*` |
| `bulk-invite-startups` | Same per CSV row, max 500 | Same problems; sequential, likely to time out on large files |
| `send-access-request` | Inserts `access_requests` | Unauthenticated, no rate limit or captcha |

All three call `send-transactional-email`, **which does not exist in the repo**. Failures are swallowed. No email is ever sent.

### Storage and auth
- One private bucket, `evidence`: 10 MB limit, MIME allowlist, policies keyed on enrollment-id path prefix. **Nothing in the app uploads to it.**
- Auth: email + password, Google via Lovable Cloud, password reset. No magic link. `must_change_password` is stored but not enforced.

### Schema drift
`benchmark_questions` is seeded in migrations for company snapshot and Customer only (27 rows). The scoring function and the form reference question ids for the other five dimensions that no migration creates. They must have been inserted directly into the live database. The migrations cannot rebuild the live system.

## 3. Routes and screens

| Role | Route(s) | State |
|---|---|---|
| Public | `/`, `/product/platform`, `/product/diagnostic-engine`, `/framework`, `/framework/:code`, `/solutions/*`, `/pricing`, `/customers`, `/research/*`, `/about/*`, `/security`, `/legal`, `/contact`, `/glossary`, `/srl` | Working as static pages; much of the copy is drafting notes ("~1,000 words. Cite ...") published as content |
| Public | 12 `/product/*` and `/resources/*` routes | Stub ("coming soon") |
| All | `/auth`, `/reset-password`, `/settings`, `/admin/login` | Working |
| Merstra admin | `/admin` (customers + audit), `/admin/programs`, `/admin/audit`, `/admin/customers/:id` | Working, read-only lists |
| Merstra admin | `/admin/users` | Working (grant/revoke roles) |
| Merstra admin | `/admin/framework` | Partial: read-only; shows v1 framework, not the active question set |
| Merstra admin | Impersonation, anonymised aggregate | Not built (table only) |
| Customer admin | `/customer`, `/customer/programs/new`, `/customer/programs/:id`, `/customer/managers`, `/customer/startups`, `/customer/settings` | Working |
| Customer admin | `/customer/onboarding` | Partial: customer creation is now admin-only by RLS, so self-onboarding fails |
| Manager | `/manager` (review queue), `/manager/programs`, `/manager/enrollments`, `/manager/enrollment/:id` | Working. Queue links every assessment to the v1 review screen, including benchmarks |
| Manager | `/manager/benchmark/:id/review` | Working: answers, computed level, override with justification, return to founder, lock |
| Manager | `/manager/review/:id` | Partial: v1 only; shows nothing for assessments done in the active form |
| Manager | `/manager/cohort/:programId` | Partial: reads v1 scores, so empty for real data |
| Manager | `/manager/startups/bulk` | Working UI; emails not sent; shows temp passwords on screen |
| Founder | `/founder`, `/founder/assessments`, `/founder/startup`, `/founder/enrollment/:id` | Working; plan / risks / mentoring tabs are stubs |
| Founder | `/founder/enrollment/:id/assessment/:type` (3 aliases) | Partial: 10-section form with autosave and resume. Midline/endline reuse it with the snapshot section removed; no anchoring to the prior checkpoint |
| Founder | Profile after finalisation | Broken: reads v1 scores |

## 4. Framework content in the code

| Content | Where |
|---|---|
| 6 dimensions, 54 level descriptors (final seed) | `supabase/migrations/20260506142316_*.sql` lines 9-78; earlier variant in `20260506051141_*.sql` lines 78-83; copy in `README.md` section 9 |
| Marketing copy of dimensions and the full Customer table | `src/content/srl-content.ts` (header: "used verbatim") |
| v1 questions: one "pick your level" question per dimension plus one free-text prompt | same migration, lines 80-103 |
| v2 question bank: 13 snapshot + 14 Customer in migrations; other dimensions only in the live DB | `supabase/migrations/20260510164807_*.sql` lines 399-426 |
| v1 scoring: highest level with >= threshold selections; minus 1 if any evidence-required question has no text | `20260505192215_*.sql` lines 612-660 |
| v2 scoring: hand-written if/else ladder per dimension, with HIGH/MEDIUM/LOW confidence | `20260510164807_*.sql` lines 200-387 |
| Override: justification >= 50 chars | DB check on `dimension_scores`; client-only check in `ManagerBenchmarkReview.tsx` `lock` mutation for v2 |
| Section list and dimension labels | `src/pages/founder/FounderBenchmark.tsx` lines 41-52 |
| Level colour scale | `src/lib/srl.ts` |
| Anchor / ratchet / silence | **Not implemented anywhere.** Named only in marketing copy and a stub whitepaper route |

Differences from the PAVE scoring rules (input to Prompt 5):

| PAVE rule | Legacy behaviour |
|---|---|
| Qualitative options only | Several free-number inputs with numeric thresholds (interview count, customer count, runway, investor conversations) |
| Weak evidence = one stage lower | v1: any empty text box drops one level. v2: no strong/weak concept |
| No evidence = claim not counted | v2 hard-gates on a file count that is always zero |
| Contradictions cancel | Warn-only, two checks, client side |
| Unanswered stored as unanswered | Unanswered dimension scores level 1 |
| Confidence with rationale and evidence lists | Confidence label only; no rationale |
| Anchor, ratchet, silence, LOW = anchor | Absent |
| Both scores kept permanently | Single mutable row |

## 5. Evidence, plan, reports, email, invitations

| Feature | State |
|---|---|
| Evidence | Links pasted as answers. No upload, no evidence type, no review status. Manager screen can open a signed URL for files that never exist |
| 90-day plan | Founder-side editor inside the form: success statement plus milestones (outcome, dimension, proof, owner, deadline, support). Not weighted to the bottleneck, not manager-editable, no "done", no link to next checkpoint. Portable as a starting point |
| Risk register, support requests | Working inside the form; not in the PAVE scope |
| Report | One client-side jsPDF cohort summary; reads v1 scores; footer carries the legacy product name. No per-startup report |
| CSV export | None |
| Email / notifications | None functional |
| Invitations | Temp password shown on screen for the manager to pass on by hand. Bulk CSV parser and row preview work |

## 6. Live data that must survive

Cannot be determined from the repository. If cohorts have been run, the tables that hold them are:

`customers`, `customer_users`, `programs`, `program_managers`, `startups`, `startup_team`, `enrollments`, `assessments`, `benchmark_responses`, `benchmark_dimension_results`, `company_snapshots`, `ninety_day_plans`, `ninety_day_milestones`, `benchmark_risks`, `support_requests`, `profiles`, `user_roles`, plus `auth.users`. Also `benchmark_questions`, because it exists nowhere else. Probably empty: `assessment_responses`, `dimension_scores`, `evidence_files`, `action_milestones`, `risks`, `mentoring_logs`.

Note that migration `20260506051141` contains an unconditional `DELETE FROM assessment_responses`; never replay these migrations against a database with data.

**Needed from you before Prompt 3:** row counts for the tables above, a dump of `benchmark_questions`, and confirmation of whether you can reach this Supabase project directly (dashboard, connection string, service key) or only through Lovable.

## 7. Banned vocabulary

38 files contain banned terms. The production bundle contains 227 occurrences.

| File | Count |
|---|---|
| `supabase/migrations/20260506142316_*.sql` | 72 |
| `supabase/migrations/20260510164807_*.sql` | 71 |
| `src/pages/marketing/Solution.tsx` | 33 |
| `README.md` | 31 |
| `src/content/srl-content.ts` | 15 |
| `src/pages/marketing/Home.tsx` | 14 |
| `src/pages/founder/FounderBenchmark.tsx` | 13 |
| `src/pages/SRLFramework.tsx` | 12 |
| `src/pages/marketing/Dimension.tsx` | 11 |
| `src/pages/Glossary.tsx` | 10 |
| `src/pages/marketing/Research.tsx` | 9 |
| `src/pages/Landing.tsx` | 8 |
| `supabase/migrations/20260506051141_*.sql` | 6 |
| `src/pages/marketing/{StaticPages,FrameworkOverview,DiagnosticEngine,Customers}.tsx`, `src/components/StartupSRLProfile.tsx` | 5 each |
| `src/pages/marketing/{Pricing,Platform}.tsx`, `src/components/marketing/MarketingShell.tsx` | 4 each |
| `src/pages/manager/ManagerEnrollment.tsx`, `src/components/AppShell.tsx`, `src/App.tsx` | 3 each |
| `supabase/migrations/20260505192215_*.sql`, `src/pages/marketing/SolutionsIndex.tsx`, `src/pages/manager/ManagerBenchmarkReview.tsx`, `src/pages/customer/ProgramDetail.tsx`, `src/pages/admin/AdminHome.tsx` | 2 each |
| 9 further files (`ManagerReview`, `CohortDashboard`, `FounderHome`, `FounderEnrollment`, `FrameworkEditor`, `lib/srl.ts`, `lib/pdf.ts`, `useMerstraData.ts`, `SRLBadge.tsx`) | 1 each |

Also embedded in identifiers: tables `srl_dimensions`, `srl_levels`; files and components `SRLBadge`, `SRLRadar`, `StartupSRLProfile`, `SRLFramework`, `srl.ts`, `srl-content.ts`; route `/srl`; question ids prefixed `crl.` `trl.` `brl.` `iprl.` `tmrl.` `frl.`; the repo name; the hosted URL.

Third-party framework references and descriptor text that reads as taken from outside:
- Direct attribution to the third-party framework: `MarketingShell.tsx:225`, `Home.tsx:13,27,55,67,124,144`, `FrameworkOverview.tsx:12,20-23`, `Solution.tsx:26,65-75`, `Research.tsx:58-72`, `StaticPages.tsx:26`, `Glossary.tsx:9`.
- The 54 level descriptors in the seed migration and `README.md`. Treat all 54 as tainted and write PAVE's from `/framework/source-notes.md` without looking at them.

## 8. Quality and security

| Area | Finding |
|---|---|
| Tests | 1 placeholder. Zero coverage of scoring, RLS or UI |
| Types | `tsc` passes, but `strict` is off and there are 141 explicit `any` |
| Lint | 159 problems (145 errors): 141 `no-explicit-any`, 12 fast-refresh, 2 `exhaustive-deps` |
| Build | Passes. Single 1.72 MB JS chunk (506 kB gzip); no code splitting |
| Dead code | `FounderAssessment.tsx` (imported, never routed), `Landing.tsx`, `Index.tsx`, `PhasePlaceholder.tsx`, `EnrollmentPanels.tsx`, the whole v1 survey path, html2canvas, ~25 shadcn components |
| Secrets | `.env` committed. The values are the public URL and publishable key, so not a leak in themselves, but `.env` is not in `.gitignore`. No service key in the repo |
| Client-only checks | Submit lock; v2 override justification length; evidence gating; reconciliation; role routing (backed by RLS for data, not for the checks above) |
| Tenant isolation | Finding 3 above |
| Credentials | Temp passwords returned to the browser and displayed; forced change not enforced |
| Abuse | Unauthenticated insert endpoint with no rate limit; CORS `*` on all functions |
| Audit | Covers 5 tables; records only the operation name, no before/after; forgeable by any user |
| Staff allowlist | Admin role granted by hardcoded email in a trigger |
| Public claims | Security and compliance statements with no evidence of being true; named institutions and networks presented as users |

## Capability decisions

| PAVE capability | Decision | Reason | Effort |
|---|---|---|---|
| Multi-tenant auth and roles | **REFACTOR** | Role enum, `user_roles`, helper functions and most policies are sound. Fix the name-match hole, add tenant scoping for startups, add customer-admin-or-manager checks, replace the email allowlist, drop the Lovable auth dependency | M |
| Tenancy schema (tenants, programs, startups, enrollments) | **REFACTOR** | Shape already matches the target model; rename `customers` to `tenants`, add sector tags, checkpoint windows | S |
| Founder form | **REBUILD**, port the shell | Autosave, resume, section stepper and conditional logic are worth copying. Question source, numeric inputs, evidence handling and locking all change | L |
| Question bank | **REFACTOR** content | The v2 questions are Merstra's own and are a good base once reworded and the numeric inputs become qualitative. Needs the live DB dump for 5 of 6 dimensions | M |
| Evidence (upload, type, review) | **REBUILD** | Only a bucket and policies exist; keep those | M |
| Scoring engine | **REBUILD** | Two engines, both in SQL, one unreachable above low levels, neither testable, no anchor/ratchet/silence. PAVE wants pure TypeScript with tests | L |
| Manager dashboard and cohort grid | **REBUILD** | Reads the wrong tables; no evidence-gap view, filters or export | L |
| Startup review screen and override | **REFACTOR** | `ManagerBenchmarkReview` layout (answers beside computed level, override, return to founder) is close; move the rule to the DB and keep both scores as separate rows | M |
| Evidence-gap view | **REBUILD** | Does not exist | M |
| 90-day plan | **REFACTOR** | Port the milestone editor and table shape; add weighting, manager edit, done + proof | M |
| PDF profile | **REBUILD** | Client-side, wrong data, one layout. PAVE requires server-side | L |
| Onboarding, invites, checkpoints | **REFACTOR** | CSV parser and invite function structure are reusable; switch to magic links, add real email, checkpoint windows, consent | M |
| Email | **REBUILD** | Nothing exists | M |
| Audit log | **REFACTOR** | Table and trigger exist; widen coverage, capture changes, close the insert policy | S |
| App shell and UI kit | **REUSE**, restyle | `AppShell`, `ProtectedRoute`, `AuthContext`, the shadcn components in use | S |
| Public site | **REBUILD** | Structure is reusable; almost every page carries banned terms, third-party attribution or unverified claims | M |

## Recommendation

**Start clean in `ebin1ephrem/pave` and port selected modules. Do not evolve `merstra-srl` in place.**

- `merstra-srl` `main` is wired to Lovable; every push syncs back, and Lovable can overwrite generated files. A long-lived `pave` branch avoids that only until merge.
- The banned vocabulary is in table names, migration history, question ids, file names and the repo name. In place, the migration history keeps it forever and Prompt 8's "clean bundle" check fights the schema.
- The migrations do not reproduce the live database and contain a destructive delete. PAVE needs one consolidated, replayable baseline migration.
- More than half the capabilities are REBUILD. What is worth keeping (RLS helpers, tenancy tables, auth context, shell, form mechanics, review layout, CSV parser, plan editor) is small and ports cleanly.
- Live data moves across by the Prompt 8 migration from the old Supabase project into a new one, which is how that prompt is already written.

Cost of this choice: a new Supabase project and a data migration instead of in-place `ALTER`s. That cost exists either way because of the drift.

Take the legacy site's compliance and "used by" claims down now, independent of this decision.

## Decision

2026-11-16: **clean repo.** PAVE is built in `ebin1ephrem/pave`; selected modules are ported from the legacy app per the table above. The legacy repo is left untouched until the Prompt 8 data migration.

2026-11-16: **no legacy data migration.** PAVE starts with an empty database. Nothing is carried over from the legacy app, so Prompt 8 reduces to redirects and the vocabulary check; the 1:1 mapping of old scores is no longer a constraint.
