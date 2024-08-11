CREATE TABLE public.user_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT CURRENT_TIMESTAMP
) TABLESPACE pg_default;