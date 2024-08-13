CREATE OR REPLACE FUNCTION delete_chat_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user1_connection = false AND NEW.user2_connection = false THEN
        DELETE FROM public.chat_sessions WHERE id = NEW.id;
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_and_delete_chat_session
AFTER UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION delete_chat_session();