CREATE
OR REPLACE FUNCTION pair_users() RETURNS TRIGGER AS $$ DECLARE other_user RECORD;

BEGIN
SELECT
    INTO other_user *
FROM
    user_queue
WHERE
    user_id != NEW.user_id
    AND user_id NOT IN (
        SELECT
            user1_id
        FROM
            chat_sessions2
        UNION
        SELECT
            user2_id
        FROM
            chat_sessions2
    )
ORDER BY
    timestamp
LIMIT
    1;

IF FOUND THEN
INSERT INTO
    chat_sessions2(user1_id, user2_id)
VALUES
    (NEW.user_id, other_user.user_id);

DELETE FROM
    user_queue
WHERE
    id IN (NEW.id, other_user.id);

ELSE -- No match found, check if the current user is already in the queue
SELECT
    INTO other_user *
FROM
    user_queue
WHERE
    user_id != NEW.user_id
    AND user_id NOT IN (
        SELECT
            user1_id
        FROM
            chat_sessions2
        UNION
        SELECT
            user2_id
        FROM
            chat_sessions2
    )
ORDER BY
    timestamp
LIMIT
    1;

IF FOUND THEN -- Pair the current user with the user found in the queue
INSERT INTO
    chat_sessions2(user1_id, user2_id)
VALUES
    (NEW.user_id, other_user.user_id);

DELETE FROM
    user_queue
WHERE
    id IN (NEW.id, other_user.id);

END IF;

END IF;

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

CREATE TRIGGER pair_users_trigger
AFTER
INSERT
    ON user_queue FOR EACH ROW EXECUTE FUNCTION pair_users();