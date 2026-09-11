const SUPABASE_URL = "https://xfhjpcesauwdflodbhrg.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_bkkeyvNAa_kVEqifspscUw_Myf4Y3y9";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log("SUPABASE URL:", SUPABASE_URL);