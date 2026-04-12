import { createClient } from "@supabase/supabase-js";

let supabase = null;

const getSupabaseClient = () => {
  if (!supabase) {
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '***' + process.env.SUPABASE_KEY.slice(-4) : 'undefined');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }
  return supabase;
};

export default getSupabaseClient;