# PAVE — project memory

## Product
- PAVE is the Venture Progression Assessment tool. It runs on Merstra's Venture Progression Assessment Framework (VPAF). The output report is the Venture Progression Profile (VPP).
- Banned vocabulary: the legacy product name, its dimension codes, and every third-party framework name are listed in `/framework/banned-terms.txt`. None of them may appear anywhere in code, UI copy, seed data, comments or docs. That file is the single place the terms are listed. Only it and `/docs/audit.md` (which quotes the legacy code) are excluded from the banned-term grep.
- Framework shape: 6 dimensions x 9 stages.
  - Dimensions: Customer (CUS), Product (PRD), Business Model (BIZ), Defensibility (DEF), Team (TEA), Capital (CAP).
  - Stages 1-9: Premise, Probe, Define, Verify, Trial, Pilot, Transact, Repeat, Scale.
  - Bands: Explore (1-3), Validate (4-6), Scale (7-9).
- All framework wording must be written fresh from the behavioural criteria in `/framework/source-notes.md`. Do not reproduce or paraphrase descriptor text from any published framework.

## Users
- Merstra admin (platform owner), Customer (tenant: incubator / accelerator / university / government), Program manager, Founder.
- A startup can be enrolled in several programs; each enrollment has its own independent assessments.

## Checkpoints
- Benchmark, Midline, Endline. Reported delta is always Benchmark -> Endline.

## Stack
- React + TypeScript + Vite, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage, RLS). Server-side PDF generation.

## Working rules
- Small commits, one feature per prompt. Write tests for the scoring engine before UI.
- Ask before adding any dependency not listed above.
