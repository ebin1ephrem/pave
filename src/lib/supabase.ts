import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These two values are public by design: they ship to every browser. Row-level security protects
// the data, not secrecy of the key. Defaults are built in so a build without a .env file still
// signs in; set the VITE_ variables to point a build at a different project.
const DEFAULT_URL = "https://osgporxbqlmrufqyborv.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_3eK7-_ptC1fhMh86_ELWOg_VCkEya1H";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || DEFAULT_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

export const SUPABASE_PROJECT_REF = new URL(url).hostname.split(".")[0];
