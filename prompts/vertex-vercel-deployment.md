# Deploy Vertex to Vercel

## Goal

Get the `web` workspace running on Vercel as a production deployment, connected to
GitHub so `main` deploys to production and every other branch gets a preview URL.
The Studio is a separate workspace and is **not** deployed here — it already
deploys through `sanity deploy` (CLAUDE.md section 5: two standalone workspaces,
independent deploys).

## What I read

- `CLAUDE.md` — sections 5 (workspace boundaries), 6 (stack), 12 (private
  dataset, server-only tokens, Clerk secret key, MCP needs a deployed Studio),
  13 (checks).
- `.env.example` — the canonical env var list, and the notes on which values are
  browser-safe and which are server-only.
- `web/next.config.ts` — PostHog reverse-proxy rewrites, `skipTrailingSlashRedirect`,
  `images.remotePatterns` for `cdn.sanity.io` and `i.ytimg.com`.
- `web/proxy.ts` — Clerk middleware (Next 16 names it `proxy.ts`, not `middleware.ts`).
- `web/app/api/search/route.ts` and `web/app/api/progress/route.ts` — both
  `runtime = "nodejs"`, `dynamic = "force-dynamic"`, neither sets `maxDuration`.
- `web/sanity/env.ts` — `assertValue` throws when a Sanity env var is missing, so
  env has to exist **before** the first build, not after.
- `package.json` (root, web, studio) — npm workspaces: `web` and `studio`.

## Decisions and assumptions

Confirmed with the user before writing this:

1. **Auth** — the user runs `npx vercel login` themselves (browser device flow,
   which I cannot drive); I do everything after that from the CLI.
2. **Branch** — `feat/learner-progress-my-learning-and-dark-mode` (1 commit ahead
   of `main`, fully pushed) gets a PR and is merged to `main` first. Production
   tracks `main`.
3. **Clerk** — reuse the existing development keys (`pk_test` / `sk_test`). They
   work on a `vercel.app` domain with no DNS setup. Trade-off accepted: Clerk's
   dev banner, shorter sessions, low user cap. Moving to `pk_live` later needs a
   custom domain.

Further assumptions:

4. Env values are copied from `web/.env.local`, which is the working local set.
   Values are piped from the file into the CLI and never printed to the terminal.
   `NEXT_PUBLIC_SANITY_DATASET` and `NEXT_PUBLIC_SANITY_PROJECT_ID` are quoted in
   that file (`"production"`); dotenv strips the quotes locally but the Vercel CLI
   would not, so quotes are stripped when pushing.
5. `NEXT_PUBLIC_SANITY_API_VERSION` is absent locally and falls back to
   `2026-09-02` in `web/sanity/env.ts`. It is set explicitly on Vercel so a
   default change never silently moves the deployed API version.
6. `OPENCODE_BASE_URL` and `OPENCODE_MODEL` are optional and unset locally; they
   stay unset so the code defaults apply.
7. Every var is set for all three environments (production, preview, development),
   so preview deployments of feature branches work without further setup.
8. Root Directory is `web`. The repo is an npm workspace monorepo, so Vercel
   installs from the repo root and builds `web`.

## Files I expect to touch

- `web/app/api/search/route.ts` — add `export const maxDuration = 60;`. Search is
  an agentic loop (up to 12 steps against the Context MCP plus a structured-output
  call), which is well past Vercel's default function duration. 60s is the value
  that is valid on every plan.
- `prompts/vertex-vercel-deployment.md` — this file.
- `.vercel/` is created by the CLI and is already gitignored.

No other source changes. No `vercel.json` — Root Directory plus Vercel's Next.js
framework detection covers it, and an unnecessary config file is one more thing to
keep in sync.

## Requirements

1. `main` contains the learner-progress / My Learning / dark-mode work before the
   production deploy.
2. Root Directory is `web`; the build command stays the framework default.
3. All 15 env vars below exist on Vercel for production, preview, and development,
   before the first build runs.
4. GitHub is connected to the project, with `main` as the production branch.
5. The deployment is verified live, not just reported as green.

### Env vars to set

Browser-safe (`NEXT_PUBLIC_`): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`,
`NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`,
`NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`,
`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
`NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`,
`NEXT_PUBLIC_POSTHOG_HOST`.

Server-only: `CLERK_SECRET_KEY`, `SANITY_API_READ_TOKEN`,
`SANITY_API_WRITE_TOKEN`, `SANITY_CONTEXT_MCP_URL`, `OPENCODE_API_KEY`.

## Security considerations

- No secret is echoed to the terminal or written into a committed file. Values are
  piped from `web/.env.local` straight into `vercel env add` via stdin.
- Nothing server-only gains a `NEXT_PUBLIC_` prefix. The read token, write token,
  MCP URL, OpenCode key, and Clerk secret key stay server-side, exactly as they are
  locally (CLAUDE.md section 12).
- The dataset stays private. Every content read is server-side through
  `web/sanity/lib/fetch.ts`; the browser holds no token in production either.
- The write token is used by exactly one caller, `/api/progress`, and that stays
  true — this change adds no new write path.
- `.vercel/` is gitignored, so `.vercel/.env.development.local` (which `vercel pull`
  can write with real values) cannot be committed.
- The Clerk keys are a development instance. That is a deliberate, stated trade-off
  for a `vercel.app` deploy, not an oversight.

## Steps

1. **Merge to main.** Open a PR from the feature branch, merge it, and check out
   and pull `main` locally.
2. **User logs in.** `npx vercel login` from `C:\Users\ayoub\vertex` in PowerShell.
3. **Link the project.** Create/link a Vercel project from `web/` so the Root
   Directory is `web`. Verify the root directory took; if it did not, the fix is
   one dashboard toggle (Settings → General → Root Directory → `web`) and it will
   be reported rather than worked around.
4. **Push env vars.** All 15, to production, preview, and development.
5. **Add `maxDuration`** to the search route and re-run the checks.
6. **Connect GitHub** with `vercel git connect`, with `main` as production.
7. **Deploy** `main` to production and capture the URL.
8. **Verify live** (see Test steps).

## Acceptance criteria

- `main` on GitHub contains the merged work.
- The Vercel project builds `web` from the repo root install and the production
  deployment is in state READY.
- The production URL serves the catalog with real Sanity content and real images.
- Sign-in loads and completes on the deployed domain.
- A search query returns grounded result cards inside the function time limit.
- A lesson video plays in its embed and seeks to its start second correctly.
- Marking progress persists across a reload (it round-trips through `/api/progress`).
- Pushing to `main` triggers a new production deployment; a PR gets a preview URL.

## Checks to run

- `npm run typecheck --workspace web`
- `npm run lint --workspace web`
- `npm run build --workspace web` (routes/server code changed — the search route
  gains `maxDuration`)
- The Vercel build log itself, read, not assumed.

## Manual test steps (for the user)

1. Open the production URL. The catalog lists courses with cover images.
2. Click a course, then a lesson. The video embed plays without leaving the site.
3. Search for something like `data fetching`. Result cards appear with a count;
   clicking a video result opens the lesson at the matched second.
4. Sign in. The Clerk dev banner is expected.
5. Mark a lesson complete, reload, and confirm the mark survives. Check My Learning.
6. Push a trivial commit to a branch, open a PR, and confirm Vercel comments a
   preview URL on it.

## Known risks

- **Search timeout.** If the agentic loop needs more than 60s, search fails on the
  live site while working locally. Fix: raise `maxDuration` (up to 300 on Pro with
  Fluid compute) or accept a narrower step budget. Verified in step 8, not assumed.
- **Context MCP.** It only serves a dataset with a *deployed Studio application*
  (CLAUDE.md section 12). The deploy does not change that, but if search returns
  nothing live, this is the first thing to check.
- **Root Directory.** If the CLI does not set it from the subdirectory link, the
  build will fail looking for Next.js at the repo root. Reported and fixed, not
  hidden.
