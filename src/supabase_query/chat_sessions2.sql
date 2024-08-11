create table public.chat_sessions2 (
    id serial,
    user1_id integer not null,
    user2_id integer not null,
    created_at timestamp without time zone null default current_timestamp,
    user1_connection boolean null default true,
    user2_connection boolean null default true,
    constraint chat_sessions2_pkey primary key (id)
) tablespace pg_default;