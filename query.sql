CREATE TABLE user_queue (
id SERIAL PRIMARY KEY,
user_id INTEGER NOT NULL,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_sessions2 (
id SERIAL PRIMARY KEY,
user1_id INTEGER NOT NULL,
user2_id INTEGER NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION pair_users() RETURNS TRIGGER AS $$
DECLARE
other_user RECORD;
BEGIN
SELECT INTO other_user * FROM user_queue 
WHERE user_id != NEW.user_id 
AND user_id NOT IN (SELECT user1_id FROM chat_sessions2 UNION SELECT user2_id FROM chat_sessions2)
ORDER BY timestamp LIMIT 1;

    IF FOUND THEN
        INSERT INTO chat_sessions2(user1_id, user2_id)
        VALUES (NEW.user_id, other_user.user_id);

        DELETE FROM user_queue WHERE id IN (NEW.id, other_user.id);
    END IF;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER pair_users_trigger
AFTER INSERT ON user_queue
FOR EACH ROW EXECUTE FUNCTION pair_users();

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);