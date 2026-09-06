# Vertex: drop the manual toggle, complete lessons automatically

## Goal

Remove the **Mark as complete** button. A lesson completes on its own when the
learner finishes the video, and the progress bar moves off the back of that
alone.

## Skills and docs read

- `CLAUDE.md` sections 3 (do not add UI beyond the reference), 5 (boundaries),
  7 (progress decisions), 13 (checks).
- No new skill applies. This narrows work built under
  [prompts/vertex-learner-progress.md](vertex-learner-progress.md).

## Code inspected

- [web/app/components/lesson/LessonCompleteButton.tsx](../web/app/components/lesson/LessonCompleteButton.tsx) — the toggle, to be deleted outright.
- [web/app/components/lesson/LessonFooterNav.tsx](../web/app/components/lesson/LessonFooterNav.tsx) — hosts it between the prev/next links. Its `if (!previous && !next) return null` early return was removed to make room for the toggle and now has to come back.
- [web/app/components/lesson/LessonProgressProvider.tsx](../web/app/components/lesson/LessonProgressProvider.tsx) — exposes `setCompleted` and `pending` for the toggle, plus a `source: "manual"` PostHog capture. All three lose their only caller.
- [web/app/api/progress/route.ts](../web/app/api/progress/route.ts) — its `action` enum is `complete | uncomplete | position`. With the button gone, only `position` is ever sent.
- [web/app/lib/player-messages.ts](../web/app/lib/player-messages.ts) — already subscribes to each provider's `ended` event; today it just reports the duration as a position. YouTube's end-of-video signal (`playerState: 0`) is not read at all.
- [studio/schemaTypes/documents/progress.ts](../studio/schemaTypes/documents/progress.ts) — the `completedLessons` description still mentions the toggle.

## Decisions and assumptions

**The route's `action` narrows to `position` only.** `complete` and
`uncomplete` would become endpoints nothing calls — dead code that still accepts
requests, and the `uncomplete` path is the one way to *lower* a percentage. With
no UI behind them they come out.

**The `ended` event becomes a completion signal in its own right**, separate
from the 90% threshold. This is the part that is not merely deletion, and it is
here because removing the button removes the only fallback: completion now rests
entirely on the embed reporting playback. A lesson whose stored
`durationSeconds` is slightly longer than the actual video would never reach 90%
of the stored figure and could never complete at all. The player already
subscribes to `ended` for Vimeo and Bunny; YouTube reports it as
`playerState: 0`. Reporting it explicitly closes that hole.

So a lesson completes when either the reported position passes 90% of duration,
or the player says the video ended.

**Completion stays sticky and one-way.** Nothing can un-complete a lesson any
more. That follows from the request, and it is worth stating plainly.

**The provider keeps `reportPosition` and everything else.** Resume position,
the milestone analytics, the throttled saves and the `pagehide` flush are all
unaffected.

**`lesson_completed` keeps its `source` property**, now always `"auto"`. Kept
rather than dropped so existing PostHog insights built on it do not break.

## Files expected to change

- `web/app/components/lesson/LessonCompleteButton.tsx` (deleted)
- `web/app/components/lesson/LessonFooterNav.tsx` (remove the toggle, restore the early return)
- `web/app/components/lesson/LessonProgressProvider.tsx` (drop `setCompleted` and `pending`; add the ended signal)
- `web/app/components/lesson/LessonPlayer.tsx` (forward an ended event)
- `web/app/lib/player-messages.ts` (report `ended` distinctly from a position)
- `web/app/api/progress/route.ts` (narrow `action` to `position`)
- `studio/schemaTypes/documents/progress.ts` (description no longer mentions the toggle)

## Requirements

1. No **Mark as complete** control anywhere. The footer bar returns to exactly
   its previous layout, and renders nothing when a lesson has no neighbours.
2. A lesson completes when the reported position passes 90% of its duration, or
   when the player reports the video ended.
3. The sidebar check and the percentage still update live, with no reload.
4. `POST /api/progress` accepts only `action: "position"`. Anything else is a
   400.
5. `lesson_completed` still fires once, with `source: "auto"`.
6. Signed-out learners are unchanged: zero state, no requests.

## Security considerations

Unchanged from the progress prompt, and slightly reduced: narrowing the accepted
`action` removes two write paths from a route the browser can reach. The learner
is still taken from Clerk on the server, the lesson is still verified against the
course, and the position is still clamped to the lesson duration.

The `ended` signal arrives by postMessage from a cross-origin frame, so it is
subject to the same checks the position already passes: the message must come
from the iframe the page mounted and from that provider's own origin. It is
treated as "the video finished", never as a position value to trust.

## Acceptance criteria

- The lesson page has no completion button, and the footer bar looks exactly as
  it did before the previous prompt added one.
- Letting a video play to the end marks the lesson complete and moves the bar.
- Reaching 90% marks it complete without waiting for the end.
- A completed lesson cannot be un-completed from the UI.
- A POST with `action: "complete"` is rejected with a 400.

## Checks to run

In `web/`: `npx tsc --noEmit`, `npm run lint`, and `npm run build` — a route and
server modules change. In `studio/`: redeploy the schema, since a field
description changes.

## Manual test steps

1. `npm run dev` in `web/`, signed in, with `SANITY_API_WRITE_TOKEN` set.
2. Open a lesson. There is no **Mark as complete** button in the footer bar.
3. Play the video to the end. The sidebar row ticks and the percentage rises.
4. Reload — it persisted.
5. On another lesson, scrub past 90% without reaching the end. It also completes.
6. Open a lesson that is both first and last in its course; the footer bar is
   absent rather than empty.
7. POST `/api/progress` with `action: "complete"` from the console; expect 400.
