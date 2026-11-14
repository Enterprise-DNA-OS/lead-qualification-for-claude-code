create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table contacts (
 id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(email)), name text not null,
 company text not null default '', industry text not null default '', country text not null default '', employees integer check(employees>=0),
 owner text not null default '', purpose text not null default '', purpose_evidence text not null default '',
 accuracy_checked_at timestamptz, retain_until date, suppressed boolean not null default false,
 outcome text not null default 'open' check(outcome in ('open','won','lost','disqualified')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table models (
 id uuid primary key default gen_random_uuid(), name text not null unique, policy jsonb not null,
 active boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_active_model on models(active) where active;
create table events (
 id uuid primary key default gen_random_uuid(), event_key text not null unique, contact_id uuid not null references contacts,
 kind text not null check(kind in ('demo_requested','trial_started','pricing_viewed','active_day','meeting_held')),
 occurred_at timestamptz not null, evidence text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index events_contact_time on events(contact_id,occurred_at);
create table import_batches (
 id uuid primary key default gen_random_uuid(), fingerprint text not null unique, source text not null, exported_at timestamptz not null,
 raw_csv text not null, mapping jsonb not null, actor text not null, row_count integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table vendor_scores (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references import_batches, contact_id uuid not null references contacts,
 external_id text, fit_score numeric, engagement_score numeric, fit_segment text, engagement_segment text, signals text,
 original_row jsonb not null, unique(batch_id,contact_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table score_runs (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references contacts, model_id uuid not null references models,
 as_of timestamptz not null, fit integer not null check(fit between 0 and 100), engagement integer not null check(engagement between 0 and 100),
 total integer not null check(total between 0 and 100), segment text not null check(segment in ('priority','nurture','hold')),
 reasons jsonb not null, blockers jsonb not null, inputs jsonb not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index scores_contact on score_runs(contact_id,created_at desc);
create table notes (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references contacts, body text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), action text not null, entity_id uuid, actor text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create view latest_scores as
 select distinct on (s.contact_id) s.*, c.name,c.email,c.company,c.owner,c.suppressed,c.outcome
 from score_runs s join contacts c on c.id=s.contact_id order by s.contact_id,s.created_at desc,s.id desc;
create view qualification_attention as
 select c.id,c.name,c.company,c.owner,'no score' as reason from contacts c where not exists(select 1 from score_runs s where s.contact_id=c.id)
 union all select c.id,c.name,c.company,c.owner,'missing purpose evidence' from contacts c where c.purpose='' or c.purpose_evidence=''
 union all select c.id,c.name,c.company,c.owner,'accuracy review overdue' from contacts c where c.accuracy_checked_at is null or c.accuracy_checked_at < now()-interval '90 days'
 union all select c.id,c.name,c.company,c.owner,'retention review due' from contacts c where c.retain_until is null or c.retain_until<current_date
 union all select c.id,c.name,c.company,c.owner,'no owner' from contacts c where c.owner=''
 union all select c.id,c.name,c.company,c.owner,'score inputs changed' from contacts c join latest_scores s on s.contact_id=c.id
 where c.updated_at>s.created_at or exists(select 1 from events e where e.contact_id=c.id and e.created_at>s.created_at)
 union all select c.id,c.name,c.company,c.owner,'model changed' from contacts c join latest_scores s on s.contact_id=c.id join models m on m.active where s.model_id<>m.id
 union all select c.id,c.name,c.company,c.owner,'score older than one day' from contacts c join latest_scores s on s.contact_id=c.id where s.as_of<now()-interval '1 day';
create view qualification_outcomes as
 select coalesce(s.segment,'unscored') segment,c.outcome,count(*)::int contacts from contacts c left join latest_scores s on c.id=s.contact_id group by 1,2;
create view source_freshness as
 select source,max(exported_at) exported_at,sum(row_count)::int rows_imported,count(*)::int batches from import_batches group by source;
DO $$ declare t text; begin foreach t in array array['contacts','models','events','import_batches','vendor_scores','score_runs','notes','audit_log'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop; end $$;
revoke all on latest_scores,qualification_attention,qualification_outcomes,source_freshness from public;
