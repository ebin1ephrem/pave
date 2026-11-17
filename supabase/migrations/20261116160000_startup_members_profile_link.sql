-- Lets founders be read together with their profile (name and email) in one query.
alter table public.startup_members
  add constraint startup_members_profile_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
