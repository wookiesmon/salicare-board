import { createClient } from "@supabase/supabase-js";

// The publishable key is safe in the browser: row-level security policies decide what each user can read.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mxqwlvgxlhfgablavprr.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_Z36PY6VmQruJl72ZqDdR0A_9662v6io";

export const supabase = createClient(url, key);
