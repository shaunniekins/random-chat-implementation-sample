create table public.messages (
    id serial,
    chat_session_id integer not null,
    user_id integer not null,
    content text not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint messages_pkey primary key (id),
    constraint messages_chat_session_id_fkey foreign key (chat_session_id) references chat_sessions2 (id) on update cascade on delete cascade
) tablespace pg_default;