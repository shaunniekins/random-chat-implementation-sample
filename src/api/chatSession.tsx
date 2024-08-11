import { supabase } from "../../utils/supabase";

export const fetchSession = async (userID: string) => {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .or(`user1_id.eq.${userID},user2_id.eq.${userID}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages: ", error);
    return [];
  }

  return data || [];
};

export const updateSessionUser1 = async (
  userID: string,
  connection: boolean
) => {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ user1_connection: connection })
      .eq("user1_id", userID);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating pet record:", error);
    return null;
  }
};

export const updateSessionUser2 = async (
  userID: string,
  connection: boolean
) => {
  try {
    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ user2_connection: connection })
      .eq("user2_id", userID);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error updating pet record:", error);
    return null;
  }
};

export const deleteChatSession = async (sessionId: number) => {
  try {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return false;
  }
};
