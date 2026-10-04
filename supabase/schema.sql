-- HANDOVER: table for the "Make the call" AI feedback feature.
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.

create table if not exists public.decision_checks (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),
  visitor_id       text not null,          -- random id kept in the visitor's browser (not a person's name)
  ip_hash          text,                   -- SHA-256 hash of the IP, used only for the abuse cap; raw IP is never stored
  scenario         text not null,          -- stalled | deadline | conflict
  background       text,                   -- from a fixed dropdown
  experience       text,                   -- from a fixed dropdown
  input            text not null,          -- the visitor's answer
  output           jsonb,                  -- what the page showed back
  is_valid_attempt boolean,                -- false = guardrail refused the input
  verdict          text,                   -- strong | partial | missed
  focus_skill      text,                   -- the skill this answer most needs to work on
  model            text,
  input_tokens     integer,
  output_tokens    integer,
  latency_ms       integer,
  error            text
);

create index if not exists decision_checks_visitor_idx on public.decision_checks (visitor_id);
create index if not exists decision_checks_created_idx on public.decision_checks (created_at desc);
create index if not exists decision_checks_ip_idx on public.decision_checks (ip_hash, created_at);

-- Row Level Security ON with no policies: the public (anon) key can't read or write anything.
-- Only the server-side key held in Vercel (SUPABASE_SERVICE_KEY) can, via /api/feedback and /api/stats.
alter table public.decision_checks enable row level security;
