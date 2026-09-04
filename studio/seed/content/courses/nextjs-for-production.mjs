export const course = {
  key: 'nextjs-for-production',
  title: 'Next.js for Production',
  summary:
    'Ship a Next.js application that stays fast under real traffic: the App Router, the caching model, Server Actions, and everything that only shows up once you deploy.',
  level: 'intermediate',
  price: 149,
  popular: true,
  studentCount: 18420,
  coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1600&q=80&fm=jpg',
  coverAlt: 'Application code on a monitor',
  instructorKey: 'maya-oduya',
  categoryKey: 'web-development',
  learningOutcomes: [
    {
      icon: 'layers',
      title: 'Structure an App Router project',
      description:
        'Lay out routes, nested layouts, and route groups so the URL structure and the file structure stay in sync as the app grows.',
    },
    {
      icon: 'database',
      title: 'Control what is cached',
      description:
        'Reason about request memoization, the data cache, and revalidation instead of guessing why a page is showing stale content.',
    },
    {
      icon: 'zap',
      title: 'Stream a page in pieces',
      description:
        'Use Suspense boundaries so the fast parts of a page reach the browser without waiting on the slow ones.',
    },
    {
      icon: 'rocket',
      title: 'Deploy with confidence',
      description:
        'Add instrumentation, error boundaries, and monitoring before launch rather than after the first incident.',
    },
  ],
  modules: [
    {
      title: 'Routing and Layouts in the App Router',
      summary:
        'How the file system becomes your routing table, and how layouts let you share chrome without re-rendering it.',
      lessons: [
        {
          title: 'App Router file conventions',
          videoQuery: 'Next.js app router file conventions tutorial',
          keyPoints: [
            'Map a URL to the folder and file that serve it',
            'Tell page, layout, loading, and error files apart',
            'Understand why only some files become routes',
          ],
          notes: [
            '## The file system is the router',
            'In the App Router, a folder inside app/ is a URL segment and a page file inside that folder makes the segment routable. A folder without a page file still shapes the URL — it just has nothing to render on its own.',
            'A handful of reserved filenames carry meaning, and everything else in the folder is ordinary code you can colocate next to the route that uses it.',
            '- page: the UI for this route, and the only file that makes a segment publicly reachable',
            '- layout: shared chrome that wraps this segment and everything nested below it',
            '- loading: the fallback shown while this segment streams in',
            '- error: the boundary that catches a render error in this segment',
            '- not-found: what renders when the segment calls notFound()',
            'Because the conventions are filenames rather than configuration, a route is always discoverable by reading the directory tree — there is no central routes file to drift out of date.',
          ],
          proTip:
            'Colocate components, tests, and helpers inside the route folder that uses them. Only the reserved filenames become routes, so nothing leaks into your URL space.',
          resources: [
            {
              type: 'documentation',
              title: 'Routing fundamentals',
              description: 'The full list of file conventions and what each one does.',
              url: 'https://nextjs.org/docs/app/building-your-application/routing',
            },
          ],
        },
        {
          title: 'Nested layouts and templates',
          videoQuery: 'Next.js nested layouts and templates explained',
          keyPoints: [
            'Share chrome across routes without re-rendering it',
            'Choose between a layout and a template',
            'Preserve state across navigations inside a layout',
          ],
          notes: [
            '## Layouts persist, templates do not',
            'A layout wraps its segment and every route nested below it. On navigation between sibling routes, the layout instance is preserved: its state survives, its effects do not re-run, and only the segment below it swaps out. That is what makes a persistent sidebar or a media player possible.',
            'A template looks identical but remounts on every navigation. Reach for it when you specifically want that reset — an entry animation that should replay, or a form that must clear between records.',
            'Layouts nest, so a route inherits every layout above it. The root layout is special: it owns the html and body tags and is the one layout that cannot be skipped.',
            '> If you find yourself fighting a layout to reset state, you probably wanted a template.',
          ],
          proTip:
            'A layout does not re-render on navigation, so it never sees the current pathname through props. If a layout needs to react to the URL, read it in a small client component nested inside it.',
          resources: [
            {
              type: 'documentation',
              title: 'Layouts and pages',
              description: 'How nesting, persistence, and the root layout work.',
              url: 'https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts',
            },
          ],
        },
        {
          title: 'Dynamic segments and route parameters',
          videoQuery: 'Next.js dynamic routes params generateStaticParams',
          keyPoints: [
            'Capture a slug or id from the URL',
            'Pre-render known paths with generateStaticParams',
            'Handle a missing record with notFound',
          ],
          notes: [
            '## Turning part of the URL into data',
            'Wrapping a folder name in square brackets makes that segment dynamic, and its value arrives as a route parameter on the page and layout below it. A catch-all segment collects the rest of the path into an array instead of a single value.',
            'For content you already know about at build time, generateStaticParams returns the list of parameter values to pre-render. Anything not in that list is still served — rendered on demand the first time it is requested — unless you explicitly opt out.',
            'A dynamic route will eventually be handed a value that matches nothing. Calling notFound() from the page renders the nearest not-found boundary and returns a real 404 status, which matters for crawlers as much as for users.',
          ],
          proTip:
            'Validate the parameter before you query with it. A dynamic segment is user input, and treating it as a trusted key is how a lookup becomes an injection.',
          resources: [
            {
              type: 'documentation',
              title: 'Dynamic routes',
              description: 'Dynamic segments, catch-all routes, and generateStaticParams.',
              url: 'https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes',
            },
          ],
        },
        {
          title: 'Route groups and parallel routes',
          videoQuery: 'Next.js route groups parallel routes intercepting routes',
          keyPoints: [
            'Organise folders without changing the URL',
            'Render two independent sections in one layout',
            'Intercept a route to show it in a modal',
          ],
          notes: [
            '## Structure that the URL never sees',
            'A folder in parentheses is a route group: it organises files and can carry its own layout, but contributes nothing to the URL. Use it to give a marketing section and an application section separate root chrome while both live at the top level.',
            'Parallel routes let one layout render several independent segments at once, each with its own loading and error state. The classic case is a dashboard where a feed and an activity panel load at different speeds and neither should block the other.',
            'Intercepting routes pair with them to produce the photo-modal pattern: clicking a thumbnail opens the detail route in an overlay, while loading that same URL directly renders the full page.',
          ],
          proTip:
            'Every parallel slot needs a default file, or a hard navigation to a URL that does not populate that slot will 404 the whole page.',
          resources: [
            {
              type: 'documentation',
              title: 'Route groups and parallel routes',
              description: 'Organising routes and rendering multiple pages in one layout.',
              url: 'https://nextjs.org/docs/app/building-your-application/routing/route-groups',
            },
          ],
        },
      ],
    },
    {
      title: 'Data Fetching and Caching',
      summary:
        'Where data is fetched, how long it is kept, and how to invalidate it on purpose instead of by accident.',
      lessons: [
        {
          title: 'Fetching data in Server Components',
          videoQuery: 'Next.js server components data fetching async await',
          keyPoints: [
            'Fetch directly in an async Server Component',
            'Keep credentials off the client',
            'Avoid the request waterfall',
          ],
          notes: [
            '## The component is the data layer',
            'A Server Component can be an async function, so fetching is just awaiting inside the component that needs the data. There is no separate loader, no client-side effect, and no serialisation step you have to write yourself.',
            'Because the code never reaches the browser, the component can hold a database connection or an API token directly. That is the single biggest structural advantage over fetching in a client effect.',
            'The trap is sequencing. Awaiting one request and then another inside the same component creates a waterfall even when the two are unrelated. Start both promises first and await them together when neither depends on the other.',
          ],
          proTip:
            'Fetch data in the component that renders it, not in a parent that passes it down. Duplicate requests are deduplicated for you; prop-drilling is not undone for you.',
          resources: [
            {
              type: 'documentation',
              title: 'Fetching data',
              description: 'Server Component data fetching patterns.',
              url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/fetching',
            },
          ],
        },
        {
          title: 'Request memoization and the data cache',
          videoQuery: 'Next.js caching data cache request memoization explained',
          keyPoints: [
            'Separate per-request deduplication from persistent caching',
            'Opt a fetch out of the cache deliberately',
            'Recognise which cache is serving stale data',
          ],
          notes: [
            '## Two different caches with two different lifetimes',
            'Request memoization deduplicates identical fetches within a single render pass. Ten components asking for the same user produce one request. It lives and dies with the request and has no configuration.',
            'The data cache is persistent: it survives across requests and deployments until something invalidates it. This is the one that serves a visitor content fetched an hour ago.',
            'When a page shows stale data, work out which cache is responsible before changing anything. Memoization cannot serve stale content across requests, so persistent staleness is always the data cache or a caller that opted into it.',
            '- Use no-store for data that must be fresh on every request',
            '- Set a revalidate window for data that can be a little behind',
            '- Tag a fetch when you want to invalidate it by name later',
          ],
          proTip:
            'Caching is per fetch, not per page. One uncached call in a subtree is enough to change how the whole route is rendered, so audit the calls rather than the page.',
          resources: [
            {
              type: 'documentation',
              title: 'Caching in Next.js',
              description: 'The full caching model and how the layers interact.',
              url: 'https://nextjs.org/docs/app/building-your-application/caching',
            },
          ],
        },
        {
          title: 'Revalidation: time-based and on-demand',
          videoQuery: 'Next.js revalidatePath revalidateTag on demand revalidation',
          keyPoints: [
            'Choose a revalidation window that matches the content',
            'Invalidate by tag when content changes',
            'Wire a CMS webhook to a revalidation route',
          ],
          notes: [
            '## Stale content, on a schedule you choose',
            'Time-based revalidation serves the cached response and refreshes it in the background once the window has passed. The first visitor after expiry still gets a fast response — they just get the previous one.',
            'On-demand revalidation is the precise tool: when an editor publishes, the publishing system tells your app exactly what changed and only that content is dropped from the cache. Invalidating by tag is usually easier to reason about than by path, because one tag can cover every page that uses a piece of content.',
            'The two combine well. A generous time window is your safety net for changes the webhook missed, and the webhook keeps the common case immediate.',
          ],
          proTip:
            'Protect your revalidation endpoint with a shared secret. An unauthenticated invalidation route is a free way for anyone to strip your cache.',
          resources: [
            {
              type: 'documentation',
              title: 'Incremental static regeneration',
              description: 'Time-based and on-demand revalidation.',
              url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration',
            },
          ],
        },
        {
          title: 'Streaming with Suspense boundaries',
          videoQuery: 'React Suspense streaming server rendering Next.js',
          keyPoints: [
            'Send the fast part of a page first',
            'Place a boundary around the slow subtree',
            'Improve perceived load without faster data',
          ],
          notes: [
            '## Do not let the slowest query set the pace',
            'Without streaming, the response waits for every await on the page. One slow recommendation service and the entire document is held back, including the header the user could have seen instantly.',
            'A Suspense boundary breaks that coupling. Everything outside it is flushed to the browser immediately with the fallback in place, and the real content is streamed in when it resolves.',
            'A loading file is exactly this: an implicit Suspense boundary around the route segment. Nesting boundaries more tightly gives you finer control over what appears when.',
            '> Streaming does not make your data faster. It stops one slow query from holding the whole page hostage.',
          ],
          proTip:
            'Make the fallback the same shape and size as the real content. A skeleton that matches the final layout avoids the layout shift that a spinner guarantees.',
          resources: [
            {
              type: 'documentation',
              title: 'Loading UI and streaming',
              description: 'Suspense boundaries and the loading file convention.',
              url: 'https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming',
            },
          ],
        },
      ],
    },
    {
      title: 'Server Actions and Mutations',
      summary:
        'Writing data from a form without hand-rolling an API route, and keeping the interface responsive while it happens.',
      lessons: [
        {
          title: 'Writing your first Server Action',
          videoQuery: 'Next.js server actions tutorial use server',
          keyPoints: [
            'Define a server function you can call from a form',
            'Understand what crosses the network boundary',
            'Refresh the page data after a write',
          ],
          notes: [
            '## A function that runs on the server, called from the client',
            'Marking a function with the server directive turns it into an endpoint. You pass the function itself to a form action, and the framework generates the network call, the serialisation, and the routing.',
            'What actually crosses the wire is the arguments, so they must be serialisable, and the return value, which the caller receives back. The function body — including any secret it closes over — never leaves the server.',
            'After a successful write, the cached data for the affected routes is still the old data. An action that mutates should end by revalidating the path or tag it invalidated, or the user will submit a form and watch nothing change.',
          ],
          proTip:
            'A Server Action is a public HTTP endpoint the moment it exists. Authenticate and authorise inside the action itself — the fact that the UI only offers the button to admins protects nothing.',
          resources: [
            {
              type: 'documentation',
              title: 'Server Actions and mutations',
              description: 'Defining, calling, and securing Server Actions.',
              url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations',
            },
          ],
        },
        {
          title: 'Form validation and progressive enhancement',
          videoQuery: 'Next.js form validation server actions useActionState',
          keyPoints: [
            'Validate on the server and return field errors',
            'Keep the form working before JavaScript loads',
            'Show pending state during submission',
          ],
          notes: [
            '## Validate where it counts, enhance where it helps',
            'Client-side validation is a convenience for the user. Server-side validation is the one that protects your data, because the client one can simply be skipped. Parse the submitted form data against a schema at the top of the action and return structured errors when it fails.',
            'Because a form wired to a Server Action submits as an ordinary HTML form, it works before the page has hydrated. That is real progressive enhancement rather than a slogan: a slow connection degrades to a full page submit instead of a dead button.',
            'Pending state comes from the framework hooks rather than from your own state variable, which keeps it correct when a submission is interrupted or replayed.',
          ],
          proTip:
            'Return errors as data from the action instead of throwing. A thrown error trips the error boundary and takes the whole form down with it, losing what the user typed.',
          resources: [
            {
              type: 'article',
              title: 'Server-side form validation',
              description: 'Returning field-level errors from an action.',
              url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations',
            },
          ],
        },
        {
          title: 'Optimistic updates with useOptimistic',
          videoQuery: 'React useOptimistic hook optimistic UI updates',
          keyPoints: [
            'Show the result before the server confirms it',
            'Roll back cleanly when the write fails',
            'Decide which actions deserve optimism',
          ],
          notes: [
            '## Trading certainty for responsiveness',
            'An optimistic update renders the outcome the moment the user acts, then reconciles with whatever the server actually returns. For a like button or a todo checkbox, that removes a round trip from the interaction entirely.',
            'The hook keeps the optimistic value only until the action settles, so a failure reverts to the real state without any rollback code of your own. What you do owe the user is a message — silently reverting a change looks like a bug.',
            'Reserve the technique for actions that almost always succeed and are cheap to undo. Optimistically showing a completed payment is not responsiveness, it is lying.',
          ],
          proTip:
            'If reverting the change would confuse or alarm the user, the action is not a candidate for optimism. Show a pending state instead.',
          resources: [
            {
              type: 'documentation',
              title: 'useOptimistic',
              description: 'The React hook behind optimistic updates.',
              url: 'https://react.dev/reference/react/useOptimistic',
            },
          ],
        },
      ],
    },
    {
      title: 'Shipping to Production',
      summary:
        'The work between a demo that runs locally and an application you are willing to be paged for.',
      lessons: [
        {
          title: 'Error boundaries and instrumentation',
          videoQuery: 'Next.js error handling error boundary instrumentation',
          keyPoints: [
            'Contain a render error to one segment',
            'Report errors somewhere you will actually see them',
            'Distinguish expected failures from bugs',
          ],
          notes: [
            '## Failing in one place instead of everywhere',
            'An error file wraps its segment in a boundary, so a crash in one panel leaves the rest of the page usable and offers a retry. Without it, a single thrown error replaces the whole application with a blank screen.',
            'Boundaries are per segment, which means placement is a design decision. A boundary at the root is a safety net; a boundary around each widget is a resilient dashboard.',
            'Expected failures are not errors. A record that does not exist should call notFound(), not throw — mixing the two floods your error reporting with 404s and buries the real bugs.',
          ],
          proTip:
            'Register your error reporter in the instrumentation hook so it initialises once at server start, before the first request has a chance to fail unobserved.',
          resources: [
            {
              type: 'documentation',
              title: 'Error handling',
              description: 'Error boundaries, notFound, and global errors.',
              url: 'https://nextjs.org/docs/app/building-your-application/routing/error-handling',
            },
          ],
        },
        {
          title: 'Image and font optimization',
          videoQuery: 'Next.js image optimization next font layout shift',
          keyPoints: [
            'Serve correctly sized, modern-format images',
            'Eliminate layout shift from media and text',
            'Prioritise the image that matters for LCP',
          ],
          notes: [
            '## The two easiest wins in web performance',
            'The image component resizes, converts, and lazily loads images for you, and refuses to render without dimensions — which is precisely what stops the page jumping as images arrive. Mark the hero image as priority so it is not lazily loaded; it is usually the element the browser measures as the largest contentful paint.',
            'Fonts are the other half. Self-hosting through the font loader removes a third-party connection from the critical path and generates a matched fallback so the swap from fallback to webfont does not reflow the paragraph beneath it.',
            'Both problems are invisible on a fast local network and obvious on a phone on mobile data, which is why they survive so long in production.',
          ],
          proTip:
            'Set sizes on any image that is not fixed-width. Without it the browser downloads the largest candidate, and your optimisation quietly does nothing.',
          resources: [
            {
              type: 'documentation',
              title: 'Optimizing images',
              description: 'Sizing, formats, priority, and layout shift.',
              url: 'https://nextjs.org/docs/app/building-your-application/optimizing/images',
            },
          ],
        },
        {
          title: 'Deploying and monitoring a Next.js app',
          videoQuery: 'deploy Next.js production monitoring core web vitals',
          keyPoints: [
            'Separate build-time and runtime configuration',
            'Watch real-user metrics, not just synthetic ones',
            'Roll back quickly when a deploy goes wrong',
          ],
          notes: [
            '## Launch is the start of the feedback loop',
            'Environment variables split cleanly: values the browser needs are inlined at build time and are therefore public, and everything else stays server-side. Getting this wrong is how a secret key ends up in a client bundle, and the build will not stop you.',
            'Synthetic tests on a fast machine tell you the best case. Field data from real users tells you what is actually happening on mid-range phones, and the gap between the two is usually the whole problem.',
            'Have the rollback path ready before you need it. A deploy you can reverse in a minute changes how a bad release feels — an inconvenience rather than an outage.',
            '- Track largest contentful paint, interaction to next paint, and cumulative layout shift in the field',
            '- Alert on error rate and latency, not on server metrics alone',
            '- Keep the previous build deployable at all times',
          ],
          proTip:
            'Anything prefixed for the browser is public forever, including in old builds. Rotate a key that leaks that way; removing the variable does not un-ship the bundle.',
          resources: [
            {
              type: 'documentation',
              title: 'Deploying',
              description: 'Build output, runtime configuration, and hosting options.',
              url: 'https://nextjs.org/docs/app/building-your-application/deploying',
            },
          ],
        },
      ],
    },
  ],
}
