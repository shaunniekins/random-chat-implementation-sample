import { supabase } from "../../utils/supabase";

export const addToQueue = async (userId: number) => {
  const { error } = await supabase
    .from("user_queue")
    .insert([{ user_id: userId }]);

  if (error) {
    console.error("Error adding user to queue: ", error);
  }
};
