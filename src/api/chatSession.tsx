import { supabase } from "../../utils/supabase";

export const fetchSession = async (userID: number) => {
  const { data, error } = await supabase
    .from("chat_sessions2")
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
  userID: number,
  connection: boolean
) => {
  console.log("userID1: ", userID);
  try {
    const { data, error } = await supabase
      .from("chat_sessions2")
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
  userID: number,
  connection: boolean
) => {
  console.log("userID2: ", userID);

  try {
    const { data, error } = await supabase
      .from("chat_sessions2")
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
