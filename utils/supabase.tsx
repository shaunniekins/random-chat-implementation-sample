import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase Problem!");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// import { createClient } from "@supabase/supabase-js";
// import { create } from "domain";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// const supabaseAdminKey =
//   process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ?? "";

// if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase Problem!");

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
