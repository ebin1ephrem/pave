-- At Midline and Endline the founder says, per question, whether the previous answer is still true,
-- has changed, or has been lost. Null at Benchmark and for questions with no previous answer.
create type public.carry_status as enum ('still_true', 'changed', 'lost');
alter table public.responses add column carry_status public.carry_status;
