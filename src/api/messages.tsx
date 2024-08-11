import { supabase } from "../../utils/supabase";

export const fetchMessages = async (chatSessionId: number) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_session_id", chatSessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages: ", error);
    return [];
  }

  return data || [];
};

export const sendMessage = async (data: any) => {
  const { error } = await supabase.from("messages").insert(data);

  if (error) {
    console.error("Error adding user to queue: ", error);
  }
};
