-- 0002_search.sql — Server-side search / filter / sort / pagination for Explore.

-- Drop the original 0001 signature (q, pricing, category_slug, sort, lim, off)
-- so the new overload is unambiguous when called with named parameters.
drop function if exists search_tools(text, text, text, text, int, int);

create or replace function search_tools(
  q text default null,
  category_slugs text[] default null,
  pricing text default null,
  use_case text default null,
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
  left join tool_text tt on tt.tool_id = t.id
  left join tool_categories tc on tc.tool_id = t.id
  left join categories c on c.id = tc.category_id
  where (q is null or q = ''
         or t.name ilike '%' || q || '%'
         or t.description ilike '%' || q || '%'
         or coalesce(array_to_string(tt.use_cases, ' '), '') ilike '%' || q || '%'
         or coalesce(array_to_string(tt.tags, ' '), '') ilike '%' || q || '%'
         or coalesce(array_to_string(tt.features, ' '), '') ilike '%' || q || '%')
    and (pricing is null or t.pricing_model = pricing)
    and (use_case is null or use_case = any(tt.use_cases))
    and (category_slugs is null or c.slug = any(category_slugs))
  group by t.id
  order by
    case when sort_by = 'featured'   then (case when t.featured then 1 else 0 end) end desc nulls last,
    case when sort_by = 'name'       then lower(t.name)  end asc nulls last,
    case when sort_by = 'name-desc'  then lower(t.name)  end desc nulls last,
    case when sort_by = 'newest'     then t.date_added   end desc nulls last,
    lower(t.name) asc
  limit lim offset off;
$$;

-- Total number of tools matching the same filters (ignores pagination).
create or replace function count_tools(
  q text default null,
  category_slugs text[] default null,
  pricing text default null,
  use_case text default null
)
returns bigint
language sql
stable
as $$
  select count(distinct t.id)
  from tools t
  left join tool_text tt on tt.tool_id = t.id
  left join tool_categories tc on tc.tool_id = t.id
  left join categories c on c.id = tc.category_id
  where (q is null or q = ''
         or t.name ilike '%' || q || '%'
         or t.description ilike '%' || q || '%'
         or coalesce(array_to_string(tt.use_cases, ' '), '') ilike '%' || q || '%'
         or coalesce(array_to_string(tt.tags, ' '), '') ilike '%' || q || '%'
         or coalesce(array_to_string(tt.features, ' '), '') ilike '%' || q || '%')
    and (pricing is null or t.pricing_model = pricing)
    and (use_case is null or use_case = any(tt.use_cases))
    and (category_slugs is null or c.slug = any(category_slugs));
$$;
