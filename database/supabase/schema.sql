create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  wallet text not null unique,
  xp integer not null default 0,
  level integer not null default 1,
  achievements text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  xp integer not null,
  difficulty text not null default 'medium'
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  timestamp timestamptz not null default now()
);

insert into quests (title, xp, difficulty)
values
  ('Deploy Project', 200, 'medium'),
  ('Fix Bug', 100, 'easy'),
  ('Write Docs', 150, 'easy')
on conflict do nothing;
