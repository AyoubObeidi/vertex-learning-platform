export const course = {
  key: 'api-design-with-nodejs',
  title: 'API Design with Node.js',
  summary:
    'Design an HTTP API other people can use without asking you questions: sensible resources, honest errors, real auth, and documentation that stays true.',
  level: 'beginner',
  price: 99,
  popular: false,
  studentCount: 21310,
  coverImage: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1600&q=80&fm=jpg',
  coverAlt: 'Laptop open on a desk with code',
  instructorKey: 'daniel-reyes',
  categoryKey: 'data-and-backend',
  learningOutcomes: [
    {
      icon: 'code',
      title: 'Design resources, not endpoints',
      description:
        'Model your API around things rather than actions, and use HTTP methods and status codes as they were intended.',
    },
    {
      icon: 'shield',
      title: 'Validate and authorise every request',
      description:
        'Reject bad input at the edge and check permissions on the server, never in the client.',
    },
    {
      icon: 'layers',
      title: 'Handle collections properly',
      description:
        'Paginate, filter, and sort in a way that stays correct as data changes underneath.',
    },
    {
      icon: 'gauge',
      title: 'Operate the service',
      description:
        'Document it, test it, and instrument it so a failure is diagnosable from the logs.',
    },
  ],
  modules: [
    {
      title: 'HTTP and REST Foundations',
      summary:
        'The protocol you are building on, and the conventions that make an API predictable.',
      lessons: [
        {
          title: 'Methods, status codes, and headers',
          videoQuery: 'http methods status codes rest api explained',
          keyPoints: [
            'Use the method that matches the operation',
            'Return a status code that means something',
            'Understand idempotency and safety',
          ],
          notes: [
            '## The protocol already made these decisions',
            'GET reads and must not change anything. PUT replaces and is idempotent. POST creates and is not. DELETE removes and should be safe to repeat. Following that is what lets caches, proxies, and retry logic behave correctly without knowing anything about your domain.',
            'Status codes are part of your API contract. A 200 with an error message in the body defeats every client library, every monitor, and every retry policy in the path.',
            'Idempotency matters most for retries. A client that times out will retry, and if your create endpoint is not idempotent you will produce duplicates — an idempotency key is the standard remedy.',
          ],
          proTip:
            'Return 201 with a Location header when you create something. Clients should not have to guess the URL of the resource they just made.',
          resources: [
            {
              type: 'documentation',
              title: 'HTTP semantics',
              description: 'Methods, status codes, and headers.',
              url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods',
            },
          ],
        },
        {
          title: 'Designing resources and URLs',
          videoQuery: 'rest api url design resource naming best practices',
          keyPoints: [
            'Name resources as nouns, consistently',
            'Nest only where ownership is real',
            'Keep identifiers stable',
          ],
          notes: [
            '## Things, not procedures',
            'A URL should name a thing. Verbs belong in the method, so listing, fetching, and deleting a user are one path with three methods rather than three paths.',
            'Nest a path only when the child genuinely belongs to the parent and cannot be addressed without it. Deeply nested paths become unusable the moment a resource needs to be reached another way.',
            'Consistency beats elegance. Plural nouns everywhere, one casing convention, one date format — an API that is predictable is one people can guess correctly.',
          ],
          proTip:
            'Do not expose sequential database ids publicly. They leak volume and invite enumeration; an opaque identifier costs nothing extra.',
          resources: [
            {
              type: 'article',
              title: 'API design guide',
              description: 'Resource-oriented design conventions.',
              url: 'https://cloud.google.com/apis/design',
            },
          ],
        },
        {
          title: 'Content negotiation and versioning',
          videoQuery: 'api versioning strategies rest breaking changes',
          keyPoints: [
            'Decide what counts as a breaking change',
            'Pick a versioning strategy and hold to it',
            'Deprecate on a published timeline',
          ],
          notes: [
            '## Plan for the second version before shipping the first',
            'Removing a field, renaming one, tightening validation, or changing a status code are all breaking. Adding an optional field is not — provided clients ignore unknown fields, which you should state explicitly.',
            'A version in the path is the most obvious and most widely understood option. Header-based versioning is tidier and harder for people to use with a browser or a curl command.',
            'Whatever you choose, publish a deprecation policy and honour it. An API that changes without notice is one people build defensive wrappers around.',
          ],
          proTip:
            'Add fields rather than changing them. Most breaking changes can be avoided entirely by living with a slightly imperfect name.',
          resources: [
            {
              type: 'article',
              title: 'API versioning',
              description: 'Strategies and their trade-offs.',
              url: 'https://cloud.google.com/apis/design/versioning',
            },
          ],
        },
      ],
    },
    {
      title: 'Building the Service',
      summary:
        'Routing, validation, error handling, and collection endpoints that behave under real data.',
      lessons: [
        {
          title: 'Routing and middleware',
          videoQuery: 'node express routing middleware tutorial',
          keyPoints: [
            'Structure routes by resource',
            'Compose cross-cutting concerns as middleware',
            'Keep handlers thin',
          ],
          notes: [
            '## A request passes through a pipeline',
            'Middleware runs in order and each layer can inspect, modify, or short-circuit the request. Parsing, authentication, logging, and rate limiting all belong here rather than repeated in every handler.',
            'Order is behaviour. Authentication before authorisation, body parsing before validation, error handling last. A middleware in the wrong position is a bug that presents as inconsistent behaviour across routes.',
            'Handlers should orchestrate, not implement. A handler that parses, validates, queries, and formats is untestable except through HTTP.',
          ],
          proTip:
            'Apply auth middleware to a router, not to individual routes. Route-by-route protection is one forgotten line away from an open endpoint.',
          resources: [
            {
              type: 'documentation',
              title: 'Express middleware',
              description: 'Writing and ordering middleware.',
              url: 'https://expressjs.com/en/guide/using-middleware.html',
            },
          ],
        },
        {
          title: 'Request validation',
          videoQuery: 'api request validation node zod schema tutorial',
          keyPoints: [
            'Validate body, query, and path parameters',
            'Return field-level errors',
            'Reject unknown fields deliberately',
          ],
          notes: [
            '## Nothing untrusted goes past the edge',
            'Every part of a request is user input, including path and query parameters. Validate all of them against a schema at the boundary, and let the rest of the code work with a typed, known-good object.',
            'Errors should say which field failed and why. A single "invalid request" message forces the client developer to bisect their payload by hand.',
            'Decide explicitly what happens to unknown fields. Silently ignoring them hides client typos; rejecting them is stricter but can break clients when you later remove a field.',
          ],
          proTip:
            'Cap request body size and array lengths in the schema. Without limits, a single request can exhaust memory before your handler ever runs.',
          resources: [
            {
              type: 'documentation',
              title: 'Zod',
              description: 'Schema validation for request payloads.',
              url: 'https://zod.dev',
            },
          ],
        },
        {
          title: 'Error handling and problem details',
          videoQuery: 'api error handling problem details rfc 9457',
          keyPoints: [
            'Return a consistent error shape',
            'Separate client errors from server errors',
            'Never leak internals in a response',
          ],
          notes: [
            '## Errors are part of the API',
            'One error shape across every endpoint means a client writes error handling once. The problem details standard gives you a ready-made structure — a type, a title, a status, and a detail — so you do not have to invent one.',
            'Four-hundred-level responses mean the client should change something; five-hundred means you should. Returning 500 for a validation failure sends clients into retry loops that cannot succeed.',
            'Never return a stack trace or a raw database error. Log it with a correlation id and return the id, so support can find the trace without exposing your schema to the internet.',
          ],
          proTip:
            'Include a correlation id in every error response and every log line. It turns "the API failed earlier" into a single log query.',
          resources: [
            {
              type: 'documentation',
              title: 'Problem details for HTTP APIs',
              description: 'A standard error response format.',
              url: 'https://www.rfc-editor.org/rfc/rfc9457.html',
            },
          ],
        },
        {
          title: 'Pagination, filtering, and sorting',
          videoQuery: 'api pagination cursor filtering sorting best practices',
          keyPoints: [
            'Always paginate collection endpoints',
            'Prefer cursors for changing data',
            'Constrain filter and sort options',
          ],
          notes: [
            '## Every collection grows',
            'An endpoint returning all records works in development and falls over in production. Paginate from the first version, with a default page size and a hard maximum, because clients will ask for a hundred thousand rows if you let them.',
            'Offset pagination skips and duplicates rows when data changes between pages. Cursor pagination keyed on a stable sort column stays correct, and it stays fast at any depth.',
            'Expose a fixed set of sortable fields and filters. Arbitrary sorting means arbitrary queries, and an unindexed sort column is a table scan per request.',
          ],
          proTip:
            'Sort by a unique tiebreaker alongside your sort field. Two rows with the same timestamp will otherwise appear on two pages or on none.',
          resources: [
            {
              type: 'article',
              title: 'Pagination design',
              description: 'Cursor versus offset in APIs.',
              url: 'https://cloud.google.com/apis/design/design_patterns#list_pagination',
            },
          ],
        },
      ],
    },
    {
      title: 'Auth and Safety',
      summary:
        'Establishing who is calling, what they may do, and how much of it they may do.',
      lessons: [
        {
          title: 'Authentication with tokens',
          videoQuery: 'jwt authentication api tokens refresh tutorial',
          keyPoints: [
            'Verify a token on every request',
            'Keep access tokens short-lived',
            'Store credentials safely on the client',
          ],
          notes: [
            '## Establishing who is calling',
            'A signed token lets you verify the caller without a database lookup per request. Verify the signature, the issuer, the audience, and the expiry — skipping any of those turns the token into a decorative header.',
            'Short-lived access tokens with a refresh mechanism limit the damage from a leaked token. A token valid for a year is a password with worse handling.',
            'Storage on the client is the weak point. A token in local storage is readable by any script that gets injected; an http-only cookie is not, at the cost of needing cross-site request protection.',
          ],
          proTip:
            'Never accept the algorithm from the token header. Pin the expected algorithm server-side, or an attacker will pick one you did not intend.',
          resources: [
            {
              type: 'article',
              title: 'JSON Web Tokens',
              description: 'Structure, verification, and pitfalls.',
              url: 'https://datatracker.ietf.org/doc/html/rfc7519',
            },
          ],
        },
        {
          title: 'Authorisation and scopes',
          videoQuery: 'api authorization rbac scopes permissions design',
          keyPoints: [
            'Separate authentication from authorisation',
            'Check ownership on every resource access',
            'Model permissions as roles or scopes',
          ],
          notes: [
            '## Knowing who they are is not knowing what they may do',
            'Authentication establishes identity; authorisation decides permission. Conflating them produces the most common serious API bug: any authenticated user can read any record by changing an id in the URL.',
            'Check ownership at the point of data access, not in the route. A helper that fetches a resource scoped to the current user makes the safe path the default one.',
            'Roles are coarse and simple; scopes are finer and better for third-party clients. Either works — an inconsistent mix of both does not.',
          ],
          proTip:
            'Return 404 rather than 403 for a resource the caller may not see. A 403 confirms it exists, which is itself a disclosure.',
          resources: [
            {
              type: 'article',
              title: 'Broken object level authorization',
              description: 'The most common API vulnerability.',
              url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/',
            },
          ],
        },
        {
          title: 'Rate limiting and abuse prevention',
          videoQuery: 'api rate limiting throttling implementation tutorial',
          keyPoints: [
            'Limit per identity, not just per address',
            'Tell clients their limit and reset time',
            'Protect expensive endpoints specifically',
          ],
          notes: [
            '## Fair use, enforced',
            'Rate limits protect availability and cost. Limiting per authenticated identity is far more accurate than per ip address, since many legitimate users share addresses and one attacker can use many.',
            'Communicate the limit. Returning the remaining quota and a retry-after header lets well-behaved clients back off correctly instead of hammering you into a longer ban.',
            'Expensive endpoints deserve their own limits. Search, export, and anything invoking a model cost far more per call than a simple read, and a global limit prices them identically.',
          ],
          proTip:
            'Rate limit authentication endpoints hardest. They are the target of credential stuffing, and they are cheap for an attacker to call.',
          resources: [
            {
              type: 'article',
              title: 'Rate limiting strategies',
              description: 'Token bucket, sliding window, and headers.',
              url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429',
            },
          ],
        },
      ],
    },
    {
      title: 'Quality and Delivery',
      summary:
        'Making the API understandable, provably correct, and diagnosable in production.',
      lessons: [
        {
          title: 'Documenting with OpenAPI',
          videoQuery: 'openapi swagger documentation node api tutorial',
          keyPoints: [
            'Describe endpoints, schemas, and errors',
            'Generate documentation from the source of truth',
            'Keep the spec honest with tests',
          ],
          notes: [
            '## Documentation that cannot lie',
            'An OpenAPI description covers paths, parameters, schemas, and responses in a machine-readable form, which means clients, mocks, and documentation pages can all be generated from it.',
            'Hand-written documentation drifts within weeks. Deriving the specification from the same schemas your validation uses keeps them aligned by construction.',
            'Document error responses too. An API that only describes its happy path leaves every client to discover failure modes in production.',
          ],
          proTip:
            'Validate responses against the spec in your test suite. It catches drift the moment it appears rather than when an integrator reports it.',
          resources: [
            {
              type: 'documentation',
              title: 'OpenAPI specification',
              description: 'Describing an HTTP API.',
              url: 'https://spec.openapis.org/oas/latest.html',
            },
          ],
        },
        {
          title: 'Testing an API',
          videoQuery: 'api testing integration tests node supertest tutorial',
          keyPoints: [
            'Test at the HTTP boundary',
            'Cover auth and error paths',
            'Keep tests independent of each other',
          ],
          notes: [
            '## Test what the client actually calls',
            'Unit tests on handlers miss routing, middleware, serialisation, and status codes — which is where API bugs live. Tests that make real requests through the whole stack catch them.',
            'The error paths deserve as much coverage as the happy path: unauthenticated, unauthorised, malformed body, missing resource, conflict. These are the responses clients handle most often and that break most silently.',
            'Tests that depend on execution order or on data another test created fail mysteriously and get deleted. Each test should set up what it needs.',
          ],
          proTip:
            'Add a regression test for every bug before fixing it. It is the only test you can be sure would have caught the problem.',
          resources: [
            {
              type: 'documentation',
              title: 'SuperTest',
              description: 'HTTP assertions for Node services.',
              url: 'https://github.com/ladjs/supertest',
            },
          ],
        },
        {
          title: 'Logging, tracing, and health checks',
          videoQuery: 'structured logging distributed tracing health checks node',
          keyPoints: [
            'Log structured events, not sentences',
            'Trace a request across services',
            'Expose readiness and liveness endpoints',
          ],
          notes: [
            '## Diagnosable from the outside',
            'Structured logs are queryable. A log line with fields for the route, status, duration, user, and correlation id can answer questions that a formatted sentence cannot.',
            'A trace id propagated across service boundaries turns a multi-service request into a single timeline. Without it, correlating an error in one service to its cause in another is manual archaeology.',
            'Health endpoints are for orchestrators. A readiness check that verifies the database connection is useful; a liveness check that does the same will restart your service every time the database hiccups.',
          ],
          proTip:
            'Never log request bodies wholesale. They contain passwords, tokens, and personal data, and logs are usually the least protected system you own.',
          resources: [
            {
              type: 'documentation',
              title: 'OpenTelemetry',
              description: 'Tracing and metrics instrumentation.',
              url: 'https://opentelemetry.io/docs/languages/js/',
            },
          ],
        },
      ],
    },
  ],
}
