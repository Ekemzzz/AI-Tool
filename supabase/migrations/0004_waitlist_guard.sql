-- 0004_waitlist_guard.sql — Phase 9: waitlist abuse / rate-limit protection.
-- All signups go through a SECURITY DEFINER function that validates the email
-- and throttles per device, and direct client inserts on the table are revoked
-- so the function is the only write path. Run in the SQL Editor (as 0001-0003).

-- 1. Record who submitted so we can rate-limit per anonymous user / account.
--    (Existing rows just get NULL; the guard treats NULL as "cannot throttle".)
alter table waitlist add column if not exists user_id uuid;

-- 2. The guarded signup path. Returns a status string the client understands:
--    'ok' | 'duplicate' | 'invalid' | 'rate_limited'.
create or replace function join_waitlist(
  p_email text,
  p_source text default 'submit-page'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid   uuid := auth.uid();
  v_recent int;
  v_total  int;
begin
  v_email := lower(btrim(coalesce(p_email, '')));

  -- Shape check (mirrors the client-side validation; defence in depth).
  if v_email = '' or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return 'invalid';
  end if;

  -- Per-device throttle: at most 3 signups total, and no faster than 1/30s.
  if v_uid is not null then
    select count(*) into v_total
      from waitlist where user_id = v_uid;
    if v_total >= 3 then
      return 'rate_limited';
    end if;

    select count(*) into v_recent
      from waitlist
      where user_id = v_uid
        and created_at > now() - interval '30 seconds';
    if v_recent > 0 then
      return 'rate_limited';
    end if;
  end if;

  -- ON CONFLICT on the unique lower(email) index turns a repeat into 'duplicate'
  -- without raising an error; FOUND is false when the insert was skipped.
  insert into waitlist (email, source, user_id)
    values (v_email, coalesce(nullif(btrim(p_source), ''), 'submit-page'), v_uid)
    on conflict (lower(email)) do nothing;

  if not found then
    return 'duplicate';
  end if;

  return 'ok';
end;
$$;

-- 3. Lock the table down: only the guard function may write.
--    Revoke direct DML from the roles PostgREST uses, and drop the old
--    public insert policy so raw inserts are no longer possible.
revoke insert on table waitlist from anon, authenticated;
drop policy if exists "waitlist insert" on waitlist;

-- 4. Allow the browser roles to call the guarded function.
grant execute on function join_waitlist(text, text) to anon, authenticated;
