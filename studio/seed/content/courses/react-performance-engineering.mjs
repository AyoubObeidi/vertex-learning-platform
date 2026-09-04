export const course = {
  key: 'react-performance-engineering',
  title: 'React Performance Engineering',
  summary:
    'Profile first, then fix. Diagnose slow React interfaces with real traces and apply the change that actually moves the number.',
  level: 'advanced',
  price: 179,
  popular: false,
  studentCount: 9240,
  coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80&fm=jpg',
  coverAlt: 'Code editor showing a component tree',
  instructorKey: 'ethan-park',
  categoryKey: 'web-development',
  learningOutcomes: [
    {
      icon: 'gauge',
      title: 'Measure before you change anything',
      description:
        'Capture a profile, read the flame graph, and identify the component that is actually costing you time.',
    },
    {
      icon: 'zap',
      title: 'Stop unnecessary re-renders',
      description:
        'Know why a component re-rendered and pick the fix that removes the cause rather than papering over it.',
    },
    {
      icon: 'layers',
      title: 'Render large lists smoothly',
      description:
        'Virtualise long lists and use concurrent features so a heavy update never blocks typing.',
    },
    {
      icon: 'rocket',
      title: 'Cut what the browser downloads',
      description:
        'Split bundles along real boundaries and prefetch the code the user is about to need.',
    },
  ],
  modules: [
    {
      title: 'Measuring Before You Optimize',
      summary:
        'Getting an honest baseline, in the browser and in the field, so you can prove an optimisation worked.',
      lessons: [
        {
          title: 'Profiling with React DevTools',
          videoQuery: 'React DevTools profiler tutorial flame graph',
          keyPoints: [
            'Record a profile of a slow interaction',
            'Find the components that dominate a commit',
            'Use the highlight setting to see re-renders live',
          ],
          notes: [
            '## Start with a recording, not a theory',
            'The profiler records every commit during an interaction and shows how long each component took to render. That is the difference between knowing a page is slow and knowing which subtree is responsible for it.',
            'Work interaction by interaction. Record one action — a keystroke, a filter change — and look at the commits it produced. A profile of a whole session averages away the spike you are hunting.',
            'The re-render highlight is the fastest first signal: if half the screen flashes when you type one character, you have found your problem before opening a single trace.',
          ],
          proTip:
            'Profile a production build. A development build carries extra work per render and will point you at costs that do not exist for your users.',
          resources: [
            {
              type: 'documentation',
              title: 'React DevTools Profiler',
              description: 'Recording and interpreting profiles.',
              url: 'https://react.dev/learn/react-developer-tools',
            },
          ],
        },
        {
          title: 'Core Web Vitals in the field',
          videoQuery: 'core web vitals LCP INP CLS explained field data',
          keyPoints: [
            'Tell lab data and field data apart',
            'Know what LCP, INP, and CLS each measure',
            'Report vitals from real sessions',
          ],
          notes: [
            '## Your laptop is not your user',
            'Lab tools run on a fast machine over a fast network and produce a repeatable best case. Field data comes from real devices and shows the distribution, which is where the interesting problems live.',
            'Largest contentful paint is how long until the main content appears. Interaction to next paint measures the worst responsiveness the user actually experienced. Cumulative layout shift captures how much the page moved under them while they were reading it.',
            'Look at the 75th percentile rather than the average. Performance work is about the bad sessions; the average hides them by definition.',
          ],
          proTip:
            'Segment field metrics by device class and route. A single site-wide number almost always conceals one very slow page dragging everything else down.',
          resources: [
            {
              type: 'article',
              title: 'Web Vitals',
              description: 'What each metric measures and what counts as good.',
              url: 'https://web.dev/articles/vitals',
            },
          ],
        },
        {
          title: 'Reading a flame graph',
          videoQuery: 'chrome devtools performance flame chart long tasks',
          keyPoints: [
            'Read width as time and depth as call stack',
            'Spot long tasks that block the main thread',
            'Separate script time from layout and paint',
          ],
          notes: [
            '## Width is time, depth is who called whom',
            'In a flame graph each bar is a function call: how wide it is tells you how long it ran, and what sits beneath it tells you what it called. Wide bars are your targets; deep stacks are just structure.',
            'Anything over fifty milliseconds on the main thread is a long task, and long tasks are what make an interface feel unresponsive — during one, the browser cannot respond to input at all.',
            'Check what kind of work the bar represents before optimising it. Time spent in layout and paint is not fixed by memoising a component; that is a CSS or DOM-size problem wearing a React costume.',
          ],
          proTip:
            'Throttle the CPU to four or six times slower while profiling. It makes the ordering of your bottlenecks match what mid-range phones experience.',
          resources: [
            {
              type: 'documentation',
              title: 'Analyze runtime performance',
              description: 'Using the Chrome DevTools performance panel.',
              url: 'https://developer.chrome.com/docs/devtools/performance',
            },
          ],
        },
      ],
    },
    {
      title: 'Taming Re-renders',
      summary:
        'Why components render again, and the small set of techniques that reliably stop the ones you do not want.',
      lessons: [
        {
          title: 'Why components re-render',
          videoQuery: 'why react components re-render explained state props',
          keyPoints: [
            'Trace a render back to its trigger',
            'Understand that a parent render renders its children',
            'Recognise identity changes as a cause',
          ],
          notes: [
            '## Three reasons, and only three',
            'A component renders again because its own state changed, because its parent rendered, or because a context it consumes changed. Every mysterious re-render reduces to one of those, and naming which one comes first.',
            'The second is the one people forget. A parent re-rendering re-renders its whole subtree by default, whether or not any prop actually differs, which is why an unrelated state variable at the top of a tree can cost you the entire page.',
            'Identity is the other common culprit. An object or function created inline is a new value on every render, so any comparison against it always reports a change.',
          ],
          proTip:
            'Before reaching for memoisation, ask whether the state can move down. A state variable owned closer to where it is used often eliminates the re-render instead of caching around it.',
          resources: [
            {
              type: 'article',
              title: 'Render and commit',
              description: 'How React decides what to re-render.',
              url: 'https://react.dev/learn/render-and-commit',
            },
          ],
        },
        {
          title: 'memo, useMemo, and useCallback',
          videoQuery: 'react memo useMemo useCallback when to use',
          keyPoints: [
            'Know what each one actually caches',
            'Avoid memoisation that cannot possibly help',
            'Keep dependency arrays honest',
          ],
          notes: [
            '## Three tools, three different jobs',
            'memo skips re-rendering a component when its props are unchanged. useMemo caches a computed value between renders. useCallback caches a function identity so a memoised child is not defeated by a new prop every time.',
            'They only pay off in specific conditions: the component must be expensive to render or the value expensive to compute, and the memoised props must genuinely stay stable. Wrapping a cheap component whose props change every render adds a comparison and saves nothing.',
            'The dependency array is a contract. Omitting a dependency to stop something recomputing does not fix the render — it produces a stale value that will be wrong in a way that is very hard to trace.',
          ],
          proTip:
            'Measure before and after every memoisation. A profile that looks identical means you have added complexity for nothing, and the honest move is to remove it.',
          resources: [
            {
              type: 'documentation',
              title: 'useMemo',
              description: 'When memoisation helps and when it does not.',
              url: 'https://react.dev/reference/react/useMemo',
            },
          ],
        },
        {
          title: 'Context without the re-render tax',
          videoQuery: 'react context performance re-renders split context',
          keyPoints: [
            'Understand why every consumer re-renders together',
            'Split a context by update frequency',
            'Keep the provider value stable',
          ],
          notes: [
            '## One context, one blast radius',
            'When a context value changes, every component consuming it re-renders — there is no partial subscription. A context holding both a theme and a live cursor position re-renders your theme consumers sixty times a second.',
            'The fix is to split by how often each piece changes. Slow-moving configuration belongs in one context, rapidly changing state in another, and components subscribe only to what they need.',
            'Building the provider value inline creates a fresh object on every provider render, which invalidates every consumer regardless of whether the contents changed. Memoise it.',
          ],
          proTip:
            'Putting a whole application store in one context is the most common cause of a globally slow React app. Split it before you start memoising consumers.',
          resources: [
            {
              type: 'documentation',
              title: 'Passing data deeply with context',
              description: 'Context semantics and its update behaviour.',
              url: 'https://react.dev/learn/passing-data-deeply-with-context',
            },
          ],
        },
        {
          title: 'State colocation and lifting',
          videoQuery: 'react state colocation lifting state up performance',
          keyPoints: [
            'Own state at the lowest node that needs it',
            'Recognise when lifting state is costing you renders',
            'Use children to keep a subtree out of a render',
          ],
          notes: [
            '## Where state lives decides what re-renders',
            'Advice to lift state up is about correctness, not performance. Lifted state re-renders everything below its new owner, so a value used by one input at the bottom of the tree should not live at the top of it.',
            'Colocation is the counter-move: push each piece of state down until it sits at the closest common ancestor of the components that read it, and no higher.',
            'When state genuinely must live high up, passing an expensive subtree through the children prop keeps it out of the re-render — it was created by the parent above and its element identity does not change.',
          ],
          proTip:
            'A controlled input at the top of a large tree is a classic performance bug. Isolate the form state in a small component and the keystroke cost disappears.',
          resources: [
            {
              type: 'article',
              title: 'Choosing the state structure',
              description: 'Where state should live and why.',
              url: 'https://react.dev/learn/choosing-the-state-structure',
            },
          ],
        },
      ],
    },
    {
      title: 'Rendering Large Data Sets',
      summary:
        'Keeping thousands of rows interactive, and keeping the interface responsive while they update.',
      lessons: [
        {
          title: 'List virtualization',
          videoQuery: 'react list virtualization windowing tutorial',
          keyPoints: [
            'Render only the rows currently on screen',
            'Handle variable row heights',
            'Keep scroll position and keyboard access intact',
          ],
          notes: [
            '## Ten thousand rows, twenty DOM nodes',
            'Virtualisation renders only the visible window of a list plus a small overscan buffer, and translates the container so the scrollbar still behaves. The cost of the list stops scaling with its length.',
            'Fixed row heights make this easy because every offset is arithmetic. Variable heights need measurement and caching, which is where most naive implementations start jittering during fast scrolls.',
            'Accessibility is the part that gets dropped. Rows that do not exist cannot be found by in-page search or reached by a screen reader, so pair virtualisation with real search and skip links.',
          ],
          proTip:
            'Virtualise only after you have made a single row cheap. Windowing an expensive row still stutters — you have just reduced how many expensive things render at once.',
          resources: [
            {
              type: 'article',
              title: 'Virtualize large lists',
              description: 'Windowing techniques and their trade-offs.',
              url: 'https://web.dev/articles/virtualize-long-lists-react-window',
            },
          ],
        },
        {
          title: 'Pagination versus infinite scroll',
          videoQuery: 'infinite scroll vs pagination performance ux',
          keyPoints: [
            'Compare offset and cursor pagination',
            'Understand the memory cost of infinite lists',
            'Keep a shareable URL for a result position',
          ],
          notes: [
            '## The choice is about state, not taste',
            'Offset pagination is simple and breaks quietly: rows inserted while the user reads page one push items across the boundary, so page two skips them. Cursor pagination keys off a stable sort value and stays correct under writes.',
            'Infinite scroll accumulates every loaded page in memory and in the DOM. Without virtualisation it degrades steadily the longer someone browses, and it makes returning to a position genuinely hard.',
            'Whichever you pick, encode position in the URL. A result the user cannot link to or return to after a refresh is a small betrayal.',
          ],
          proTip:
            'Infinite scroll with virtualisation and a URL-encoded cursor gives you the feel of the former with the recoverability of the latter.',
          resources: [
            {
              type: 'article',
              title: 'Pagination strategies',
              description: 'Offset versus cursor pagination in practice.',
              url: 'https://use-the-index-luke.com/no-offset',
            },
          ],
        },
        {
          title: 'Concurrent rendering with useTransition',
          videoQuery: 'react useTransition useDeferredValue concurrent rendering',
          keyPoints: [
            'Mark an update as interruptible',
            'Keep an input responsive during a heavy render',
            'Choose between a transition and a deferred value',
          ],
          notes: [
            '## Some updates are more urgent than others',
            'Typing must be immediate; the filtered ten-thousand-row list below it does not have to be. A transition tells React that the second update can be interrupted, so a new keystroke pre-empts the in-progress render instead of queueing behind it.',
            'useTransition is for when you control the event that triggers the update and want a pending flag. useDeferredValue is for when you only receive a value as a prop and want to render a lagging copy of it.',
            'Neither makes rendering faster. They change which work is allowed to block input, which is what users actually perceive as speed.',
          ],
          proTip:
            'Show the stale results at reduced opacity while a transition is pending. Blanking the list on every keystroke feels slower than the version that never blanks at all.',
          resources: [
            {
              type: 'documentation',
              title: 'useTransition',
              description: 'Marking updates as non-urgent.',
              url: 'https://react.dev/reference/react/useTransition',
            },
          ],
        },
      ],
    },
    {
      title: 'Loading Performance',
      summary:
        'Reducing what the browser has to download and parse before the interface becomes usable.',
      lessons: [
        {
          title: 'Code splitting and lazy boundaries',
          videoQuery: 'react code splitting lazy suspense dynamic import',
          keyPoints: [
            'Split along routes and rare interactions',
            'Give every lazy boundary a sensible fallback',
            'Avoid splitting so finely that you add round trips',
          ],
          notes: [
            '## Ship the code for this screen, not every screen',
            'A dynamic import becomes a separate chunk that is fetched only when the code is first needed. Routes are the natural boundary; the second-best is anything behind a rare interaction, like an editor or a chart library inside a modal.',
            'Every boundary needs a fallback, and the fallback should reserve the space the real component will occupy or you have traded a slow load for a layout shift.',
            'Over-splitting has its own cost. Dozens of tiny chunks mean dozens of requests and a waterfall of dependent loads, which is often slower than one reasonably sized bundle.',
          ],
          proTip:
            'Prefetch the chunk on hover or focus. The user has told you where they are going roughly two hundred milliseconds before they commit to it.',
          resources: [
            {
              type: 'documentation',
              title: 'lazy',
              description: 'Loading components on demand.',
              url: 'https://react.dev/reference/react/lazy',
            },
          ],
        },
        {
          title: 'Bundle analysis',
          videoQuery: 'javascript bundle analyzer reduce bundle size',
          keyPoints: [
            'Find out what is actually in your bundle',
            'Spot duplicated and oversized dependencies',
            'Replace a heavy library with a lighter path',
          ],
          notes: [
            '## Open the bundle before you guess at it',
            'A treemap of the built output turns the bundle from an abstraction into a picture, and the picture is usually surprising: a date library with every locale, two versions of the same package, an icon set imported in full for three icons.',
            'Duplicates come from version mismatches between transitive dependencies. Deduplicating them is often the single largest win available and requires no code change at all.',
            'For anything large, check whether it supports importing only what you use before you accept its full weight.',
          ],
          proTip:
            'Put a size budget in CI. Bundles do not regress in one big jump; they grow a few kilobytes per pull request until someone notices a year later.',
          resources: [
            {
              type: 'article',
              title: 'Reduce JavaScript payloads',
              description: 'Analysing and shrinking bundles.',
              url: 'https://web.dev/articles/reduce-javascript-payloads-with-code-splitting',
            },
          ],
        },
        {
          title: 'Prefetching and priority hints',
          videoQuery: 'resource hints preload prefetch priority hints web performance',
          keyPoints: [
            'Tell the browser what matters first',
            'Prefetch the next navigation without stealing bandwidth',
            'Avoid preloading things you never use',
          ],
          notes: [
            '## Ordering is a performance feature',
            'The browser guesses at priorities from markup order and element type, and it guesses reasonably well. Hints are for the cases where you know better — the hero image below the fold in the DOM, the font needed for the first paragraph.',
            'Prefetching the next likely navigation at low priority is close to free and makes the following click feel instant. Do it on intent signals like hover and viewport entry rather than for every link on the page.',
            'A preload that is never used is a pure regression: you spent bandwidth ahead of things that were on the critical path, and the console will tell you so.',
          ],
          proTip:
            'Lower the priority of below-the-fold images explicitly. Competing with the hero image for early bandwidth is a common, invisible cause of a slow largest contentful paint.',
          resources: [
            {
              type: 'documentation',
              title: 'Resource hints',
              description: 'preload, prefetch, and fetch priority.',
              url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload',
            },
          ],
        },
      ],
    },
  ],
}
