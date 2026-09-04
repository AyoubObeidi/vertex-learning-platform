export const course = {
  key: 'docker-essentials',
  title: 'Docker Essentials',
  summary:
    'Understand what a container actually is, build small images that rebuild fast, and run a multi-service stack on your own machine.',
  level: 'beginner',
  price: 79,
  popular: false,
  studentCount: 28390,
  coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1600&q=80&fm=jpg',
  coverAlt: 'Stacked shipping containers',
  instructorKey: 'tomas-lindqvist',
  categoryKey: 'devops-and-cloud',
  learningOutcomes: [
    {
      icon: 'layers',
      title: 'Know what a container really is',
      description:
        'Explain images, layers, and the kernel features that make isolation work, rather than treating it as magic.',
    },
    {
      icon: 'zap',
      title: 'Build images that rebuild in seconds',
      description:
        'Order a Dockerfile so the cache does its job and a code change does not reinstall every dependency.',
    },
    {
      icon: 'shield',
      title: 'Ship a small, safe image',
      description:
        'Use multi-stage builds and non-root users to cut both size and attack surface.',
    },
    {
      icon: 'git-branch',
      title: 'Run a full stack locally',
      description:
        'Wire an app, a database, and a cache together with Compose, including volumes and networking.',
    },
  ],
  modules: [
    {
      title: 'Containers from First Principles',
      summary:
        'What is really happening when you run a container, and the vocabulary the rest of the course depends on.',
      lessons: [
        {
          title: 'Images, containers, and layers',
          videoQuery: 'docker images containers layers explained',
          keyPoints: [
            'Tell an image apart from a container',
            'Understand the copy-on-write layer stack',
            'See why layers are shared between images',
          ],
          notes: [
            '## A template and a running instance',
            'An image is an immutable stack of filesystem layers plus metadata. A container is one running instance of that image with a thin writable layer on top, which is why starting one is fast and why anything written inside it disappears when it is removed.',
            'Each build instruction adds a layer, and layers are content-addressed. Ten images built from the same base share that base on disk and in transfers — only the differing layers move.',
            'The writable layer is also why data belongs in a volume. Treating a container filesystem as storage works right up until the first restart.',
          ],
          proTip:
            'Deleting a file in a later layer does not shrink the image; the file is still in the earlier layer. Avoid adding it in the first place.',
          resources: [
            {
              type: 'documentation',
              title: 'Images and layers',
              description: 'The storage model behind images.',
              url: 'https://docs.docker.com/build/guide/layers/',
            },
          ],
        },
        {
          title: 'Running your first container',
          videoQuery: 'docker run command tutorial beginners ports volumes',
          keyPoints: [
            'Run, list, and remove containers',
            'Publish a port and mount a directory',
            'Get a shell inside a running container',
          ],
          notes: [
            '## The handful of commands you will use daily',
            'Running a container starts it from an image with the arguments you supply: which ports to publish, which directories to mount, which environment variables to pass. Everything else is a variation on that.',
            'Publishing a port maps a host port to a container port. Forgetting it is the reason a service that is definitely running is definitely not reachable.',
            'Executing a shell inside a running container is the main debugging tool. Note that many minimal images have no shell at all, which is a deliberate trade-off you will meet later.',
          ],
          proTip:
            'Name your containers. Working from truncated ids gets old immediately, and a name makes logs and cleanup scripts readable.',
          resources: [
            {
              type: 'documentation',
              title: 'docker run',
              description: 'The full command reference.',
              url: 'https://docs.docker.com/reference/cli/docker/container/run/',
            },
          ],
        },
        {
          title: 'Namespaces, cgroups, and the isolation illusion',
          videoQuery: 'linux namespaces cgroups container isolation explained',
          keyPoints: [
            'See which kernel features provide isolation',
            'Understand why a container is not a VM',
            'Know what is shared with the host',
          ],
          notes: [
            '## Processes wearing a disguise',
            'A container is an ordinary host process with a restricted view. Namespaces give it its own process tree, network interfaces, mounts, and hostname; control groups cap how much CPU and memory it can use.',
            'Crucially, the kernel is shared. That is why containers start in milliseconds and why a kernel-level vulnerability is a container escape, whereas a virtual machine has its own kernel and a much stronger boundary.',
            'It also explains the constraints: a Linux container needs a Linux kernel, which is what the virtual machine on a Mac or Windows host is quietly providing.',
          ],
          proTip:
            'Set memory and CPU limits on every container. Without them, one runaway process can starve everything else sharing the host.',
          resources: [
            {
              type: 'article',
              title: 'Namespaces and cgroups',
              description: 'The kernel features containers are built on.',
              url: 'https://man7.org/linux/man-pages/man7/namespaces.7.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Building Images',
      summary:
        'Writing a Dockerfile that builds quickly, produces a small image, and is safe to run.',
      lessons: [
        {
          title: 'Writing a Dockerfile',
          videoQuery: 'dockerfile tutorial best practices beginners',
          keyPoints: [
            'Choose an appropriate base image',
            'Understand each instruction you write',
            'Tell CMD and ENTRYPOINT apart',
          ],
          notes: [
            '## A build script with caching semantics',
            'A Dockerfile lists the steps to build an image. Each instruction produces a layer, so the order you write them in determines both the size of the result and how much of it can be reused on the next build.',
            'ENTRYPOINT declares what the container is; CMD supplies the default arguments. Getting them the wrong way round is why an image ignores the command you pass it.',
            'Pin the base image to a specific version. A floating latest tag means today build and tomorrow build are not the same thing, and the difference will surface at the worst possible moment.',
          ],
          proTip:
            'Add a dockerignore file early. Without it the whole working directory, including build output and secrets, is sent to the daemon as build context.',
          resources: [
            {
              type: 'documentation',
              title: 'Dockerfile reference',
              description: 'Every instruction and what it does.',
              url: 'https://docs.docker.com/reference/dockerfile/',
            },
          ],
        },
        {
          title: 'Layer caching and build speed',
          videoQuery: 'docker layer caching build speed optimization',
          keyPoints: [
            'Order instructions from least to most volatile',
            'Copy dependency manifests before source',
            'Recognise what invalidates the cache',
          ],
          notes: [
            '## Put the things that change last, last',
            'The builder reuses a cached layer until one instruction changes; from that point everything after it rebuilds. So the order of your instructions is the single biggest factor in build time.',
            'The standard pattern is to copy only the dependency manifest, install dependencies, and then copy the source. A code change then invalidates only the final layers, and the dependency install — the slow part — is reused.',
            'Copying the whole project before installing defeats this entirely: every one-character change reinstalls everything.',
          ],
          proTip:
            'Use a cache mount for the package manager cache. Even when a dependency changes, only the new package is downloaded rather than all of them.',
          resources: [
            {
              type: 'documentation',
              title: 'Build cache',
              description: 'How caching works and how to keep it.',
              url: 'https://docs.docker.com/build/cache/',
            },
          ],
        },
        {
          title: 'Multi-stage builds',
          videoQuery: 'docker multi stage build tutorial smaller images',
          keyPoints: [
            'Separate build tools from the runtime image',
            'Copy only the artefacts you need',
            'Target a stage for development',
          ],
          notes: [
            '## Build in one image, ship another',
            'A multi-stage build compiles in a stage that has the full toolchain, then copies just the output into a clean runtime stage. Compilers, headers, and development dependencies never reach production.',
            'The size difference is often an order of magnitude, and the security difference is larger: a runtime image with no shell and no package manager offers an attacker very little to work with.',
            'Stages can also be targeted directly, so the same Dockerfile can produce a fat development image with hot reloading and a minimal production one.',
          ],
          proTip:
            'Name every stage. Copying from a numbered stage breaks silently the moment someone inserts a stage above it.',
          resources: [
            {
              type: 'documentation',
              title: 'Multi-stage builds',
              description: 'Separating build and runtime.',
              url: 'https://docs.docker.com/build/building/multi-stage/',
            },
          ],
        },
        {
          title: 'Slimming and securing images',
          videoQuery: 'docker image security non root user distroless scanning',
          keyPoints: [
            'Run as a non-root user',
            'Keep secrets out of image layers',
            'Scan images for known vulnerabilities',
          ],
          notes: [
            '## Small is also safer',
            'Containers run as root by default, which means a process escaping the container escapes as root. Creating an unprivileged user and switching to it is a one-line change with a large payoff.',
            'A secret passed as a build argument is baked into the image history and remains readable to anyone who pulls it, even if a later layer deletes the file. Use build secrets or inject at runtime.',
            'Scan images in the pipeline and rebuild regularly. Most vulnerabilities in your image come from the base, and they appear without you changing a line of code.',
          ],
          proTip:
            'Fewer packages means fewer advisories. A minimal base image reduces your patching workload permanently, not just your image size.',
          resources: [
            {
              type: 'documentation',
              title: 'Building secure images',
              description: 'Non-root users, secrets, and scanning.',
              url: 'https://docs.docker.com/build/building/best-practices/',
            },
          ],
        },
      ],
    },
    {
      title: 'Working with Multiple Services',
      summary:
        'Persistent data, container-to-container networking, and describing a whole stack in one file.',
      lessons: [
        {
          title: 'Volumes and persistent data',
          videoQuery: 'docker volumes bind mounts persistent data tutorial',
          keyPoints: [
            'Choose between a volume and a bind mount',
            'Keep database data across restarts',
            'Back up and restore a volume',
          ],
          notes: [
            '## Containers are disposable, data is not',
            'Anything written to the container filesystem dies with the container. A named volume is managed storage that outlives it, which is what makes running a database in a container reasonable.',
            'Bind mounts map a host directory in and are the right tool for development, where you want your source to appear live inside the container. They are a poor fit for production, since they couple the container to the host layout.',
            'A volume is not a backup. It is on one machine and it is one accidental prune away from being gone.',
          ],
          proTip:
            'Never prune volumes on a machine that holds data you care about. The command is fast, quiet, and irreversible.',
          resources: [
            {
              type: 'documentation',
              title: 'Volumes',
              description: 'Persistent storage for containers.',
              url: 'https://docs.docker.com/engine/storage/volumes/',
            },
          ],
        },
        {
          title: 'Container networking',
          videoQuery: 'docker networking bridge network container communication',
          keyPoints: [
            'Connect containers on a user-defined network',
            'Resolve a service by container name',
            'Distinguish host ports from container ports',
          ],
          notes: [
            '## Containers find each other by name',
            'On a user-defined network, containers resolve each other by name through the built-in DNS. An application connects to a database at its service name — no ip addresses, no discovery mechanism to build.',
            'Publishing a port is only about reaching a container from the host. Two containers on the same network talk to each other without publishing anything, which is also the safer default.',
            'From inside a container, localhost means that container. Trying to reach the host or a sibling that way is the most common networking mistake there is.',
          ],
          proTip:
            'Only publish the ports you genuinely need from outside. A database published to all interfaces on a developer laptop is a real exposure, not a theoretical one.',
          resources: [
            {
              type: 'documentation',
              title: 'Networking overview',
              description: 'Bridge networks and service discovery.',
              url: 'https://docs.docker.com/engine/network/',
            },
          ],
        },
        {
          title: 'Docker Compose for local stacks',
          videoQuery: 'docker compose tutorial multi container application',
          keyPoints: [
            'Describe several services in one file',
            'Order startup with health conditions',
            'Override configuration per environment',
          ],
          notes: [
            '## The whole stack in one command',
            'Compose declares your services, their networks, and their volumes in a single file, so a new contributor gets a running application and database with one command instead of a page of setup instructions.',
            'Dependencies need care. Waiting for a container to start is not the same as waiting for the database inside it to accept connections — depend on a health check, not on start order.',
            'Override files keep one base definition and layer environment-specific changes on top, which avoids three files that have quietly diverged.',
          ],
          proTip:
            'Commit a compose file that works from a fresh clone with no manual steps. It is the highest-value onboarding document a project can have.',
          resources: [
            {
              type: 'documentation',
              title: 'Docker Compose',
              description: 'Defining multi-container applications.',
              url: 'https://docs.docker.com/compose/',
            },
          ],
        },
      ],
    },
    {
      title: 'Containers in a Pipeline',
      summary:
        'Getting images out of your machine and into a registry, a pipeline, and production.',
      lessons: [
        {
          title: 'Tagging and registries',
          videoQuery: 'docker registry tagging push pull images tutorial',
          keyPoints: [
            'Adopt a tagging scheme you can trace',
            'Push and pull from a registry',
            'Understand digests versus tags',
          ],
          notes: [
            '## A tag is a label, a digest is an identity',
            'Tags are mutable pointers. The same tag can point at different images tomorrow, which is convenient for a rolling tag and dangerous for a deployment you want to reproduce.',
            'A digest is the content hash and never changes. Deploying by digest is how you guarantee that what you tested is what runs.',
            'Tag with something traceable — the commit sha — alongside any human-friendly tag. When production is misbehaving you want to know exactly which commit built the running image.',
          ],
          proTip:
            'Never deploy the latest tag. It means whatever was pushed most recently, which makes rollbacks and incident timelines impossible to reason about.',
          resources: [
            {
              type: 'documentation',
              title: 'Tagging images',
              description: 'Tags, digests, and registries.',
              url: 'https://docs.docker.com/reference/cli/docker/image/tag/',
            },
          ],
        },
        {
          title: 'Building images in CI',
          videoQuery: 'docker build github actions ci pipeline caching',
          keyPoints: [
            'Build and push from a pipeline',
            'Reuse a build cache between runs',
            'Build for more than one architecture',
          ],
          notes: [
            '## The pipeline builds it, not your laptop',
            'A CI-built image is reproducible and traceable to a commit. Images built and pushed from a developer machine carry whatever happened to be in that working directory.',
            'CI runners start clean, so the build cache is empty unless you bring it. Exporting the cache to the registry between runs is usually the difference between a one-minute build and a ten-minute one.',
            'Multi-architecture builds matter now that developer machines and production hosts frequently differ. Building both platforms in the pipeline avoids the image that only runs on the machine that built it.',
          ],
          proTip:
            'Only push on the branches that should produce artefacts. Building on every pull request is useful; publishing on every pull request is not.',
          resources: [
            {
              type: 'documentation',
              title: 'Building in CI',
              description: 'Cache reuse and multi-platform builds.',
              url: 'https://docs.docker.com/build/ci/',
            },
          ],
        },
        {
          title: 'Debugging a failing container',
          videoQuery: 'debug docker container exit code logs troubleshooting',
          keyPoints: [
            'Read logs and exit codes',
            'Inspect a container that will not start',
            'Reproduce a failure interactively',
          ],
          notes: [
            '## Start with the exit code',
            'The exit code narrows the problem immediately: a non-zero application code points at your code, while codes from a signal usually mean the container was killed — most often an out-of-memory kill, which produces no application error at all.',
            'Inspecting a container shows the resolved configuration: the actual command, environment, mounts, and network. It is frequently different from what you thought you specified.',
            'When a container exits instantly, override the entrypoint with a shell and run the command by hand. The failure is usually a missing file or a permission the runtime image does not have.',
          ],
          proTip:
            'Log to standard output, not to a file inside the container. Logs written to the container filesystem vanish with it, precisely when you need them.',
          resources: [
            {
              type: 'documentation',
              title: 'Troubleshooting containers',
              description: 'Logs, inspect, and exec.',
              url: 'https://docs.docker.com/engine/containers/run/',
            },
          ],
        },
      ],
    },
  ],
}
