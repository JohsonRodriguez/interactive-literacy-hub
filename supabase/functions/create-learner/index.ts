import { createClient } from "npm:@supabase/supabase-js@2.110.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14) || "learner";
const randomPart = (length: number) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");
};

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Function configuration is incomplete" }, 500);

    const authorization = request.headers.get("Authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return json({ error: "Authentication required" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData.user) return json({ error: "Session is not valid" }, 401);

    const { action = "create", displayName, classId, learnerId } = await request.json();
    const cleanName = String(displayName || "").trim().slice(0, 60);
    if (!classId) return json({ error: "Learning group is required" }, 400);

    const { data: educator, error: educatorError } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (educatorError) {
      console.error("Educator profile query failed", educatorError);
      return json({ error: "Educator profile could not be read" }, 500);
    }
    if (!educator) return json({ error: "Educator profile was not found" }, 403);
    if (!educator || !["teacher", "admin"].includes(educator.role)) return json({ error: "Educator role required" }, 403);
    const { data: learningGroup, error: groupError } = await admin.from("classes").select("id").eq("id", classId).eq("teacher_id", userData.user.id).eq("is_active", true).maybeSingle();
    if (groupError) {
      console.error("Learning group query failed", groupError);
      return json({ error: "Learning group could not be read" }, 500);
    }
    if (!learningGroup) return json({ error: "Learning group not found" }, 404);

    if (action === "reset") {
      if (!learnerId) return json({ error: "Learner is required" }, 400);
      const { data: membership, error: membershipError } = await admin.from("class_members").select("student_id").eq("class_id", classId).eq("student_id", learnerId).maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) return json({ error: "Learner does not belong to this group" }, 403);
      const { data: learner, error: learnerError } = await admin.from("profiles").select("display_name,username,role").eq("id", learnerId).maybeSingle();
      if (learnerError) throw learnerError;
      if (!learner || learner.role !== "student" || !learner.username) return json({ error: "Learner profile is incomplete" }, 400);
      const loginCode = `${randomPart(4)}-${randomPart(4)}`;
      const { error: resetError } = await admin.auth.admin.updateUserById(learnerId, { password: loginCode });
      if (resetError) throw resetError;
      return json({ username: learner.username, loginCode, displayName: learner.display_name || learner.username });
    }

    if (cleanName.length < 2) return json({ error: "Learner alias is required" }, 400);

    let createdUserId = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const username = `${slug(cleanName)}${randomPart(4).toLowerCase()}`;
      const loginCode = `${randomPart(4)}-${randomPart(4)}`;
      const internalEmail = `${username}@learners.interactive-literacy-hub.invalid`;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: internalEmail,
        password: loginCode,
        email_confirm: true,
        user_metadata: { display_name: cleanName, role: "student", avatar: "owl", managed_by: userData.user.id },
      });
      if (createError) {
        if (String(createError.message).toLowerCase().includes("already")) continue;
        throw createError;
      }
      createdUserId = created.user.id;
      try {
        const { error: profileError } = await admin.from("profiles").update({ display_name: cleanName, username, role: "student", avatar: "owl", updated_at: new Date().toISOString() }).eq("id", createdUserId);
        if (profileError) throw profileError;
        const { error: memberError } = await admin.from("class_members").insert({ class_id: classId, student_id: createdUserId });
        if (memberError) throw memberError;
        return json({ username, loginCode, displayName: cleanName });
      } catch (linkError) {
        await admin.auth.admin.deleteUser(createdUserId);
        throw linkError;
      }
    }
    return json({ error: "Could not generate a unique learner username" }, 409);
  } catch (error) {
    console.error("create-learner error", error);
    return json({ error: "The learner account could not be created" }, 500);
  }
});
