(() => {
  "use strict";
  const result = (ok, data = null, message = "") => ({ ok, data, message });

  async function authenticatedUser() {
    const client = window.supabaseClient;
    if (!client) throw new Error("Supabase is not configured.");
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("Your session has expired. Please sign in again.");
    return user;
  }

  async function saveActivityProgress({ activityId, status, score = null, attempts = 1, confidenceLevel = null, timeSpentSeconds = 0 }) {
    try {
      if (!activityId || !["not_started", "started", "completed"].includes(status)) throw new Error("Invalid activity progress.");
      const user = await authenticatedUser();
      const client = window.supabaseClient;
      const { data: existing, error: readError } = await client.from("student_progress").select("status, score, attempts, completed_at").eq("student_id", user.id).eq("activity_id", activityId).maybeSingle();
      if (readError) throw readError;
      const now = new Date().toISOString();
      const completedAt = status === "completed" ? (existing?.completed_at || now) : null;
      const payload = {
        student_id: user.id, activity_id: activityId, status,
        score: score === null ? null : Math.max(0, Math.min(100, Math.round(Number(score)))),
        attempts: (Number(existing?.attempts) || 0) + Math.max(0, Number(attempts) || 0),
        confidence_level: confidenceLevel === null ? null : Math.max(1, Math.min(4, Number(confidenceLevel))),
        time_spent_seconds: Math.max(0, Math.round(Number(timeSpentSeconds) || 0)),
        completed_at: completedAt, updated_at: now
      };
      if (!existing && status !== "not_started") payload.started_at = now;
      const { data, error } = await client.from("student_progress").upsert(payload, { onConflict: "student_id,activity_id" }).select().single();
      if (error) throw error;
      return result(true, data, existing?.status === "completed" ? "Your latest practice was saved." : "Great work! Your progress was saved.");
    } catch (error) {
      console.error("Progress save error:", error);
      return result(false, null, navigator.onLine ? "We could not save this yet. Please try again." : "You are offline. Reconnect, then try saving again.");
    }
  }

  async function saveReflection({ activityId, reflectionText, confidenceLevel }) {
    try {
      const text = String(reflectionText || "").trim();
      if (text.length < 2 || text.length > 1000) return result(false, null, "Write between 2 and 1,000 characters.");
      const user = await authenticatedUser();
      const client = window.supabaseClient;
      const { data: existing, error: lookupError } = await client.from("reflections").select("id").eq("student_id", user.id).eq("activity_id", activityId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      const values = { reflection_text: text, confidence_level: Math.max(1, Math.min(4, Number(confidenceLevel))), updated_at: new Date().toISOString() };
      const query = existing?.id
        ? client.from("reflections").update(values).eq("id", existing.id)
        : client.from("reflections").insert({ ...values, student_id: user.id, activity_id: activityId });
      const { data, error } = await query.select().single();
      if (error) throw error;
      return result(true, data, "Your metacognition response was saved.");
    } catch (error) {
      console.error("Reflection save error:", error);
      return result(false, null, "We could not save your metacognition response. Please try again.");
    }
  }

  async function recordCompletedActivity(activityId, score, attempts, options = {}) {
    if (!window.supabaseClient) return result(false, null, "Sign in to save this activity.");
    const saved = await saveActivityProgress({ activityId, status: "completed", score, attempts, confidenceLevel: options.confidenceLevel ?? null, timeSpentSeconds: options.timeSpentSeconds ?? 0 });
    const host = options.messageElement;
    if (host) { host.textContent = `${host.textContent} ${saved.message}`.trim(); host.classList.add(saved.ok ? "progress-save-success" : "progress-save-error"); }
    return saved;
  }

  window.hubProgress = { saveActivityProgress, saveReflection, recordCompletedActivity };
})();
