# PostHog Self-driving setup report

## Summary

PostHog Self-driving was configured for the Vertex learning platform. Session Replay and Error Tracking were already enabled; Support (Conversations) was enabled during this setup. Health checks, Error Tracking, and Support responders were enabled, a selective scout troop was configured, one custom learning-path scout was created, and two Replay Vision monitors were armed.

Findings will begin appearing in the [Self-driving inbox](https://us.posthog.com/project/593493/inbox) within about 30 minutes. No project source files were changed.

## AI data processing

Approved by the wizard’s organization-level gate before setup began.

## GitHub

GitHub App connected before this setup began. GitHub Issues was not selected as an external responder, so no GitHub warehouse source or responder was added.

## Products enabled

| Product | Status | Notes |
| --- | --- | --- |
| Session Replay | Already enabled | The browser PostHog initialization has no `disable_session_recording` override. No recordings were found yet; monitors are armed for the first recordings. |
| Error Tracking | Already enabled | The browser initialization explicitly enables exception capture. No active issue evidence was returned in the probe. |
| Support (Conversations) | Enabled | Tickets will reach Self-driving once an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Signal source | Action | Details |
| --- | --- | --- |
| `signals_scout` / `cross_source_issue` | Enabled by server default | No config row is required; the scout gate is on unless explicitly opted out. |
| `health_checks` / `health_issue` | Enabled | Created source config `01a06b99-dbfe-7379-9eca-0359f73cc9e4`. |
| `error_tracking` / `issue_created` | Enabled | Created source config `01a06b99-dbe6-76bc-a33d-152ff093ee0d`. |
| `error_tracking` / `issue_reopened` | Enabled | Created source config `01a06b99-dc3a-78a5-ba0a-c65c36dde32e`. |
| `error_tracking` / `issue_spiking` | Enabled | Created source config `01a06b99-dc27-7cc6-987b-f81e03ac038e`. |
| `conversations` / `ticket` | Enabled | Created source config `01a06b99-dbde-7429-9769-9ed023c4a7dc`; remains idle until a support channel exists. |
| Session Replay source row | Deliberately skipped | Replay evidence reaches Self-driving through the Replay Vision scanners below; the retired session-analysis source was not created. |

## Connected tools

No external connected-tool responder was selected. The warehouse source inventory was empty.

| Tool | Status |
| --- | --- |
| GitHub Issues | Not used |
| Linear | Not used |
| Jira | Not used |
| Sentry | Not used |
| Zendesk | Not used |

## Scout troop

The configured troop has five active scouts, well below the ten-scout quality ceiling. The verified budget is **100 runs per day**, with **0 used** and **100 remaining** at setup time. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

| Scout | Status | Reason |
| --- | --- | --- |
| `signals-scout-general` | Enabled | Cross-product correlations and gaps outside a specialist’s scope. |
| `signals-scout-product-analytics` | Enabled | Existing learner engagement instrumentation makes behavioral-flow monitoring applicable. |
| `signals-scout-web-analytics` | Enabled | Vertex is a browser-based learning application with course discovery traffic. |
| `signals-scout-health-checks` | Enabled | Keeps Self-driving setup and telemetry health actionable. |
| `signals-scout-learning-path-activation` | Enabled | Approved custom learning-path conversion coverage. |
| `signals-scout-error-tracking` | Disabled | Covered by the native Error Tracking responders. |
| `signals-scout-session-replay` | Disabled | Covered by the two Replay Vision monitors. |
| All other built-in scouts (23) | Disabled | No evidence of active revenue, surveys, flags, experiments, logs, AI observability, warehouse, CSP, customer analytics, or related surfaces; preserving a selective troop. |

Enable a currently disabled specialist later from the Self-driving inbox if its matching PostHog product becomes active.

## Custom scouts

Created **`signals-scout-learning-path-activation`**. It watches the Vertex path from starting a course through expanding curriculum and selecting a lesson. Its discriminator is a material decline in downstream curriculum or lesson-selection conversion while course starts remain steady. This is a product-specific learning journey that the generic product-analytics scout cannot infer without a dedicated flow definition.

The proposed course-discovery-to-start scout was declined. The custom scout can be switched to dry-run without removing it by setting `emit: false` on its scout configuration in PostHog.

The custom scout verifies its event contract at runtime and safely closes out if telemetry is unavailable. Schema-read access was not granted to this MCP connection during setup, so event ingestion could not be independently confirmed from the server.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes confirmed findings into Self-driving. These are the only items in this setup that spend Replay Vision quota. Findings arrive at half weight and need independent corroboration before promotion to an inbox report.

No recordings or existing scanners were found at setup time. Both monitors are enabled and emit Self-driving findings immediately when recordings begin. Their current projected monthly spend is zero credits because no matching recordings exist; the organization has 2,500 credits remaining in the current period.

| Brief | Status | Scanner | Query scope | Sampling | Estimate |
| --- | --- | --- | --- | --- | --- |
| Breakage monitor | Created | Course learning breakage | Recording URL contains `/courses/`, covering course browsing, curriculum, and the start-learning route—the product’s identified completion path. | 50% | 0 observations / 0 credits monthly at current volume. |
| Frustration monitor | Created | Learning navigation frustration | `$rageclick` only; intentionally not URL-filtered to preserve separation from the breakage monitor. | 100% | 0 observations / 0 credits monthly at current volume. |

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so Conversations tickets can begin reaching Self-driving.
- [ ] Ensure production traffic reaches the existing browser SDK so Session Replay recordings become available for the two armed monitors.
- [ ] Reauthorize the MCP connection with `property_definition:read` if server-side event-schema verification is needed.

## What happens next

Fresh scout configurations are picked up by the coordinator within about 30 minutes and consume the project’s daily scout budget. Replay Vision monitors begin when matching recordings arrive. Findings are grouped into reports in the [Self-driving inbox](https://us.posthog.com/project/593493/inbox); immediately actionable reports can start coding tasks.

## Repository changes

- Created `posthog-self-driving-report.md`.
- No application source, configuration, dependency, or environment files were modified.
