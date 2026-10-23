
create extension if not exists pg_trgm;   -- fuzzy name/description search


-- Catalog tables

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  icon_key    text,
  sort        int  not null default 0
);

create table if not exists tools (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  website_url      text,
  pricing_model    text not null default 'unknown'
    check (pricing_model in
      ('free','freemium','paid','open-source','contact-for-pricing','unknown')),
  pricing_url      text,
  source_url       text,
  pricing_source_url text,
  logo_url         text,
  featured         boolean not null default false,
  date_added       date,
  last_verified_at date
);

-- Many-to-many: replaces the tools.categories[] name array on the frontend.
create table if not exists tool_categories (
  tool_id     uuid not null references tools(id)      on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (tool_id, category_id)
);

-- Free-form text arrays kept in a 1:1 side table so `tools` stays tidy.
create table if not exists tool_text (
  tool_id   uuid primary key references tools(id) on delete cascade,
  use_cases text[] not null default '{}',
  tags      text[] not null default '{}',
  features  text[] not null default '{}'
);

-- ---------------------------------------------------------------------------
-- Per-user state (replaces localStorage favorites / compare)
-- ---------------------------------------------------------------------------
create table if not exists favorites (
  user_id    uuid not null,            -- auth.uid() (anonymous or real user)
  tool_id    uuid not null references tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create table if not exists compares (
  user_id    uuid not null,
  tool_id    uuid not null references tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

-- Enforce the existing "max 3 selected" compare rule at the database level.
create or replace function enforce_compare_limit()
returns trigger language plpgsql as $$
declare
  cnt int;
begin
  select count(*) into cnt from compares where user_id = new.user_id;
  if cnt >= 3 then
    raise exception 'Compare list is full (max 3).';
  end if;
  return new;
end;
$$;

drop trigger if exists compares_limit on compares;
create trigger compares_limit
  before insert on compares
  for each row execute function enforce_compare_limit();

-- ---------------------------------------------------------------------------
-- Waitlist (replaces the client-only notify-me form)
-- ---------------------------------------------------------------------------
create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text not null default 'submit-page',
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_key on waitlist (lower(email));

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists tools_name_trgm     on tools using gin (name gin_trgm_ops);
create index if not exists tools_desc_trgm     on tools using gin (description gin_trgm_ops);
create index if not exists tools_pricing_idx   on tools (pricing_model);
create index if not exists tools_featured_idx  on tools (featured) where featured;
create index if not exists tool_cat_category_idx on tool_categories (category_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table categories      enable row level security;
alter table tools           enable row level security;
alter table tool_categories enable row level security;
alter table tool_text       enable row level security;
alter table favorites       enable row level security;
alter table compares        enable row level security;
alter table waitlist        enable row level security;

-- Public read for the catalog.
drop policy if exists "read categories" on categories;
drop policy if exists "read tools" on tools;
drop policy if exists "read tool_cats" on tool_categories;
drop policy if exists "read tool_text" on tool_text;
create policy "read categories" on categories      for select using (true);
create policy "read tools"      on tools           for select using (true);
create policy "read tool_cats"  on tool_categories for select using (true);
create policy "read tool_text"  on tool_text       for select using (true);

-- Favorites / compare are owner-only (works for anonymous users too).
drop policy if exists "own favorites" on favorites;
drop policy if exists "own compares" on compares;
create policy "own favorites" on favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own compares" on compares
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Waitlist: anyone may insert, nobody reads it from the client.
drop policy if exists "waitlist insert" on waitlist;
create policy "waitlist insert" on waitlist
  for insert with check (true);

-- ---------------------------------------------------------------------------
-- Server-side search / filter / sort / pagination RPC (Phase 6 wiring target)
-- ---------------------------------------------------------------------------
create or replace function search_tools(
  q text default null,
  pricing text default null,
  category_slug text default null,
  sort_by text default 'featured',
  lim int default 9,
  off int default 0
)
returns setof tools
language sql
stable
as $$
  select t.*
  from tools t
  left join tool_categories tc on tc.tool_id = t.id
  left join categories c       on c.id = tc.category_id
  where (q is null or q = ''
         or t.name ilike '%' || q || '%'
         or t.description ilike '%' || q || '%')
    and (pricing is null or t.pricing_model = pricing)
    and (category_slug is null or c.slug = category_slug)
  group by t.id
  order by
    case when sort_by = 'featured' then (case when t.featured then 1 else 0 end) end desc nulls last,
    case when sort_by = 'name'     then lower(t.name)     end asc,
    case when sort_by = 'newest'   then t.date_added      end desc nulls last,
    lower(t.name) asc
  limit lim offset off;
$$;
