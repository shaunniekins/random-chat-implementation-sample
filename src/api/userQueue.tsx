import { supabase } from "../../utils/supabase";

export const checkIdInQueue = async (userId: number) => {
  const { data: existingUser, error } = await supabase
    .from("user_queue")
    .select("user_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user from queue: ", error);
    return false;
  }

  return existingUser && existingUser.length > 0;
};

export const addToQueue = async (userId: number) => {
  const { error } = await supabase
    .from("user_queue")
    .insert([{ user_id: userId }]);

  if (error) {
    console.error("Error adding user to queue: ", error);
  }
};
