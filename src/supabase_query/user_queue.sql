create table public.user_queue (
    id serial,
    user_id integer not null,
    timestamp timestamp without time zone null default current_timestamp,
    constraint user_queue_pkey primary key (id)
) tablespace pg_default;