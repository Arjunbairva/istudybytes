-- Free NCERT solutions. Independent of the premium course / entitlement tables.
-- "chapter" uses the same chapter key as quiz_questions.chapter (see js/chapter-data.js).
create table if not exists public.ncert_solutions (id uuid primary key default gen_random_uuid(), class_level text not null, subject text not null, chapter text not null, exercise text not null default 'Exercise', question_number text not null default '', question text not null, solution text not null, display_order integer not null default 0, published boolean not null default false, created_at timestamptz not null default now());
create index if not exists ncert_solutions_lookup_idx on public.ncert_solutions(class_level,subject,chapter,published,display_order);
alter table public.ncert_solutions enable row level security;
drop policy if exists "public can read published ncert solutions" on public.ncert_solutions;
create policy "public can read published ncert solutions" on public.ncert_solutions for select to anon,authenticated using (published = true);
