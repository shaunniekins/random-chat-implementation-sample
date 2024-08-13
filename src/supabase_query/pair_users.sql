CREATE OR REPLACE FUNCTION pair_users() RETURNS TRIGGER AS $$
DECLARE
    other_user RECORD;
BEGIN
    -- Find a user who is not in an active chat session
    SELECT INTO other_user *
    FROM user_queue
    WHERE user_id != NEW.user_id
      AND user_id NOT IN (
        SELECT user1_id
        FROM chat_sessions
        WHERE user1_connection = true
        UNION
        SELECT user2_id
        FROM chat_sessions
        WHERE user2_connection = true
      )
    ORDER BY timestamp
    LIMIT 1;

    IF FOUND THEN
        -- Pair the users
        INSERT INTO chat_sessions(user1_id, user2_id, user1_connection, user2_connection)
        VALUES (NEW.user_id, other_user.user_id, true, true);

        -- Remove both users from the queue
        DELETE FROM user_queue
        WHERE user_id IN (NEW.user_id, other_user.user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pair_users_trigger
AFTER
INSERT
    ON user_queue FOR EACH ROW EXECUTE FUNCTION pair_users();