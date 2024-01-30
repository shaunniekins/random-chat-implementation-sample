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
