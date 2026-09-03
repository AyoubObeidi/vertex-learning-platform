/**
 * Six fictional instructors. Names, bios, and companies are invented; the
 * portraits come from randomuser.me, a placeholder portrait service.
 *
 * `bio` is authored as plain blocks and converted to Portable Text by the
 * builder (see ../lib/text.mjs for the block markers).
 */
export const instructors = [
  {
    key: 'maya-oduya',
    name: 'Maya Oduya',
    expertise: ['Next.js', 'React', 'Web performance', 'Edge rendering'],
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    photoAlt: 'Portrait of Maya Oduya',
    bio: [
      'Maya has spent the last decade shipping React applications that have to stay fast under real traffic — commerce storefronts, news sites, and one very stubborn internal dashboard.',
      'She works on the rendering boundary: what belongs on the server, what genuinely needs to hydrate in the browser, and how to tell the difference before it becomes a performance incident.',
      'She writes about caching, streaming, and the parts of the framework that only show up under load.',
    ],
  },
  {
    key: 'daniel-reyes',
    name: 'Daniel Reyes',
    expertise: ['TypeScript', 'API design', 'Node.js', 'Developer tooling'],
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    photoAlt: 'Portrait of Daniel Reyes',
    bio: [
      'Daniel builds the type definitions and service contracts that hold large codebases together, and has migrated more than one seven-figure-line JavaScript project to TypeScript without stopping feature work.',
      'His teaching starts from the compiler: what it can prove, what it cannot, and where a type assertion is quietly lying to you.',
    ],
  },
  {
    key: 'priya-raghunathan',
    name: 'Priya Raghunathan',
    expertise: ['Machine learning', 'LLM applications', 'Retrieval', 'Evaluation'],
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    photoAlt: 'Portrait of Priya Raghunathan',
    bio: [
      'Priya moved from research into production ML and now spends her time on the unglamorous half of the job: evaluation harnesses, retrieval quality, and knowing when a model is confidently wrong.',
      'She is sceptical of demos and insistent about measurement. Every one of her courses ends with you building something you can actually score.',
    ],
  },
  {
    key: 'tomas-lindqvist',
    name: 'Tomas Lindqvist',
    expertise: ['Docker', 'Kubernetes', 'CI/CD', 'Observability'],
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    photoAlt: 'Portrait of Tomas Lindqvist',
    bio: [
      'Tomas has been on call for enough production systems to have opinions about all of them. He teaches containers and orchestration the way he runs them: small images, boring deployments, and alerts that mean something.',
      'He is happiest explaining what a tool is actually doing underneath the abstraction.',
    ],
  },
  {
    key: 'aisha-benali',
    name: 'Aisha Benali',
    expertise: ['PostgreSQL', 'Data modelling', 'Query performance', 'Python'],
    photo: 'https://randomuser.me/api/portraits/women/12.jpg',
    photoAlt: 'Portrait of Aisha Benali',
    bio: [
      'Aisha is a database engineer who believes most application performance problems are schema problems wearing a disguise.',
      'She works on query planning, indexing strategy, and the migrations that let a growing product change its mind about its data without downtime.',
    ],
  },
  {
    key: 'ethan-park',
    name: 'Ethan Park',
    expertise: ['React', 'Rendering performance', 'Profiling', 'Accessibility'],
    photo: 'https://randomuser.me/api/portraits/men/19.jpg',
    photoAlt: 'Portrait of Ethan Park',
    bio: [
      'Ethan profiles interfaces for a living. He has rescued enough sluggish React applications to know that the fix is almost never the one people expect.',
      'He teaches with the profiler open, measuring before and after every change, because a performance claim without a trace is just a hunch.',
    ],
  },
]
