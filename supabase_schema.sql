-- ============================================================
-- Mommyoffice — Supabase Schema
-- Run this in Supabase SQL Editor (same project as MNT Prime)
-- All tables use mo_ prefix to avoid conflicts
-- ============================================================

-- Instructors
create table if not exists mo_instructors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio_mn text,
  bio_en text,
  photo_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Courses
create table if not exists mo_courses (
  id uuid primary key default gen_random_uuid(),
  title_mn text not null,
  title_en text,
  description_mn text,
  description_en text,
  price integer not null default 0,
  cover_image_url text,
  trailer_url text,
  is_published boolean default false,
  instructor_id uuid references mo_instructors(id),
  slug text unique not null,
  category text not null default 'Хоол',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Course Modules (video lessons)
create table if not exists mo_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references mo_courses(id) on delete cascade,
  title_mn text not null,
  title_en text,
  video_id text,
  video_provider text not null default 'youtube', -- 'youtube' | 'cloudflare'
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Articles
create table if not exists mo_articles (
  id uuid primary key default gen_random_uuid(),
  title_mn text not null,
  title_en text,
  body_mn text,
  body_en text,
  category text not null default 'Lifestyle',
  cover_image_url text,
  is_published boolean default false,
  published_at timestamptz,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Banners (homepage hero carousel)
create table if not exists mo_banners (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  title_mn text,
  title_en text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Access Tokens (email-based course access)
create table if not exists mo_access_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  course_id uuid not null references mo_courses(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists mo_courses_slug_idx on mo_courses(slug);
create index if not exists mo_courses_published_idx on mo_courses(is_published);
create index if not exists mo_articles_slug_idx on mo_articles(slug);
create index if not exists mo_articles_published_idx on mo_articles(is_published, published_at desc);
create index if not exists mo_access_tokens_token_idx on mo_access_tokens(token);
create index if not exists mo_access_tokens_email_idx on mo_access_tokens(email);
create index if not exists mo_modules_course_idx on mo_modules(course_id, sort_order);

-- RLS Policies
alter table mo_courses enable row level security;
alter table mo_modules enable row level security;
alter table mo_articles enable row level security;
alter table mo_instructors enable row level security;
alter table mo_banners enable row level security;
alter table mo_access_tokens enable row level security;

-- Public: read published courses
create policy "Public read published courses"
  on mo_courses for select
  using (is_published = true);

-- Public: read modules of published courses
create policy "Public read modules"
  on mo_modules for select
  using (
    exists (
      select 1 from mo_courses c
      where c.id = mo_modules.course_id and c.is_published = true
    )
  );

-- Public: read published articles
create policy "Public read published articles"
  on mo_articles for select
  using (is_published = true);

-- Public: read instructors
create policy "Public read instructors"
  on mo_instructors for select
  using (is_active = true);

-- Public: read active banners
create policy "Public read banners"
  on mo_banners for select
  using (is_active = true);

-- Access tokens: service role only (no public access)
-- (admin API uses service role key which bypasses RLS)

-- Admin (authenticated): full access to all tables
create policy "Admin full access courses"
  on mo_courses for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full access modules"
  on mo_modules for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full access articles"
  on mo_articles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full access instructors"
  on mo_instructors for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full access banners"
  on mo_banners for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin full access tokens"
  on mo_access_tokens for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- Seed: Insert a sample instructor and course to test
-- ============================================================
insert into mo_instructors (name, bio_mn, bio_en) values
  ('Mommyoffice Team', 'Монголын тэргүүлэх эмэгтэйчүүдийн платформ', 'Mongolia''s leading women''s platform')
on conflict do nothing;
