# Interactive Literacy Hub

## Reading Journey phase gate

Development must remain in **Phase 1** with one complete prototype reading: **The Community Garden**. Do not add the other nine proposed Reading Journeys, seed their content, or expose them in the library until all prototype persistence, continuation, completion, badge, educator-visibility, RLS, accessibility, responsive, local, and GitHub Pages tests pass and the project owner gives explicit approval. When Phase 1 is complete, stop and request approval before beginning Phase 2.

### Install the Phase 1 prototype

Run these migrations in Supabase SQL Editor, in order:

1. `supabase/migrations/add-reading-journeys.sql`
2. `supabase/migrations/add-reading-journey-policies.sql`
3. `supabase/migrations/add-reading-completion-rpc.sql`

The first migration creates `readings` and `student_readings`, safely extends `activities`, inserts only **The Community Garden**, creates its six required stages, and creates the Community Garden Explorer badge. The second enables RLS for learner ownership and educator read-only visibility through class membership. The third grants the authenticated learner access to a security-definer completion check that verifies all required stages before marking the journey complete and awarding its single badge.

The frontend uses `reading-library.html?`-compatible relative navigation and `reading-journey.html?reading=community-garden&stage=...`; it does not create one HTML file per reading. Prototype content and stage definitions live in `js/readings.js`. Future readings must reuse this architecture, but may only be added after explicit Phase 2 approval.

Static, responsive literacy practice for fourth-grade English learners. The site uses HTML5, CSS3, browser JavaScript, Supabase, and GitHub Pages—without a frontend framework or server dependency.

## Architecture

- Public learning pages and four custom activities remain regular `.html` files.
- `css/styles.css` contains the shared visual system plus authentication/dashboard styles.
- `js/supabase-config.js` creates one Supabase v2 browser client.
- `js/auth.js` handles sign-in, profile lookup, role routing, and sign-out.
- `js/auth-guard.js` hides protected content until session and role checks finish.
- `js/progress.js` exposes reusable `saveActivityProgress`, `saveReflection`, and completion helpers. The authenticated user ID always comes from Supabase Auth, never from form input.
- Student and teacher dashboard modules query only data permitted by Row Level Security (RLS).

All links are relative so the site works at a GitHub Pages project path such as `username.github.io/interactive-literacy-hub/`.

## Configure Supabase

1. Open the Supabase project, then **Project Settings → API**.
2. Copy the Project URL and the Publishable Key.
3. In `js/supabase-config.js`, replace only:

   ```js
   const SUPABASE_URL = "PASTE_SUPABASE_URL_HERE";
   const SUPABASE_PUBLISHABLE_KEY = "PASTE_PUBLISHABLE_KEY_HERE";
   ```

4. Keep RLS enabled. Authenticated users must be able to read active `activities` and `badges`; students must only access their own profile, progress, reflections, and earned badges; teachers must only see their own classes and enrolled students.
5. Confirm that `student_progress` has a unique constraint on `(student_id, activity_id)` and `reflections` has the conflict target required by your policy/schema if reflection upserts are used.

Never place a Service Role Key, secret key, database password, or private administrative credential in this repository. A publishable key is expected in browser code; RLS is the data boundary.

## Enable public educator registration

The site supports open registration only for classroom educators, tutors, advisers, homeschool caregivers, and family learning support. The visible term is **Educator**; the database continues using the technical role `teacher` for compatibility. Learners cannot register or self-enroll publicly and only use the sign-in page.

Before using `register.html`, run `supabase/migrations/20260717_public_educator_registration.sql` in the Supabase SQL Editor. It adds safe educator-role synchronization and `create_learning_group(...)`. Educators create private groups from their dashboard.

To let educators generate learner credentials, deploy `supabase/functions/create-learner/index.ts` as the `create-learner` Edge Function. The function verifies the caller's session, confirms the caller has role `teacher` or `admin`, and confirms ownership of the selected group before using `auth.admin.createUser`. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the hosted function; never copy the Service Role Key into frontend files.

Because this project has automatic table exposure disabled, also run `supabase/migrations/20260717_create_learner_service_privileges.sql`. It grants `service_role` only the table privileges needed by this function: profile lookup/update, class lookup, and class-membership management.

Using the Supabase CLI after linking the project:

```text
supabase functions deploy create-learner
```

You can also create/deploy the function from the Supabase Dashboard Edge Functions editor. Keep JWT verification enabled. Learners receive a generated username and temporary login code and can only use the shared login page; they cannot register publicly.

For a public production deployment, enable email confirmation, CAPTCHA, rate limits, abuse reporting, and appropriate legal/privacy documents. Use aliases/display names and do not collect minors’ full names or sensitive information.

To convert the existing test profile to a teacher:

1. Find that user’s UUID in Authentication.
2. Open `supabase/migrations/20260717_promote_demo_teacher.sql`.
3. Replace `PASTE_USER_UUID_HERE` with that exact UUID.
4. Run the script once in the Supabase SQL Editor and verify the affected profile.

The repository deliberately does not contain or guess a UUID.

## Run locally

Use VS Code Live Server on `index.html`, or any static HTTP server. Do not test authentication by double-clicking HTML files: browser/CDN/auth behavior is more reliable through `http://localhost`.

After adding the public credentials, test:

1. A valid student login routes to `student-dashboard.html`.
2. A teacher or admin login routes to `teacher-dashboard.html`.
3. An invalid login shows a friendly message.
4. Opening a protected dashboard while signed out routes to `login.html`.
5. Logout clears the session and returns to login.
6. Completing Context Clues, Main Idea, Inference, or Text Evidence updates `student_progress` and appears on the student dashboard.

## Publish with GitHub Pages

1. Push the repository to GitHub only after inserting the publishable credentials (never private credentials).
2. In **Settings → Pages**, deploy from the desired branch/root.
3. Open the generated project URL and repeat the authentication checks.
4. Add the GitHub Pages URL to Supabase Auth URL configuration if redirect behavior is expanded later.

The current implementation uses no rewrite rules, server routes, build step, or root-relative paths.

## Current scope and limitations

Implemented: open educator-only registration, email/password login for educators and learners, logout, session/role guards, private group creation, student dashboard, educator overview, progress upserts, reflection helper, four tracked activities, earned-badge display, loading/empty/error/offline states, and relative GitHub Pages routing.

Not implemented yet: password-reset workflow for managed learner accounts, forced password change, account/group deletion, invitations by email, badge awarding, messaging/chat, exports, admin moderation, CAPTCHA UI, and secure point-awarding automation. Trusted operations must never put a Service Role Key in the browser.

## Privacy and content review

Use aliases instead of required full names. Do not collect birth dates, addresses, phone numbers, personal photographs, or sensitive data. Before thesis delivery, review district privacy requirements and confirm that final texts and references match the approved thesis materials.
