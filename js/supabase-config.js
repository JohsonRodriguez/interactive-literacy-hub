/* Public browser configuration only. Never place a service-role or secret key here. */
(() => {
  "use strict";

  const SUPABASE_URL = "https://mghhqtlojowuylgmbmhy.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dGGXgEwDxTtj6Z2SjAN1Ww_ZzbDUuKu";
  const placeholders = SUPABASE_URL.includes("PASTE_") || SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

  window.hubSupabaseConfigured = !placeholders;
  window.supabaseClient = placeholders || !window.supabase?.createClient
    ? null
    : window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
})();
