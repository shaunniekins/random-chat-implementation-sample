CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP,
    user1_connection BOOLEAN NULL DEFAULT TRUE,
    user2_connection BOOLEAN NULL DEFAULT TRUE
) TABLESPACE pg_default;