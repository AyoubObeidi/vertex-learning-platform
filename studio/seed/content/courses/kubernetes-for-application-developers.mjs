export const course = {
  key: 'kubernetes-for-application-developers',
  title: 'Kubernetes for Application Developers',
  summary:
    'The parts of Kubernetes you actually touch when you own a service: deployments, traffic, resource limits, rollouts, and debugging at three in the morning.',
  level: 'intermediate',
  price: 169,
  popular: false,
  studentCount: 12060,
  coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1600&q=80&fm=jpg',
  coverAlt: 'Racks of servers in a data centre',
  instructorKey: 'tomas-lindqvist',
  categoryKey: 'devops-and-cloud',
  learningOutcomes: [
    {
      icon: 'layers',
      title: 'Deploy and configure a service',
      description:
        'Use deployments, services, config maps, and secrets without copying a manifest you do not understand.',
    },
    {
      icon: 'git-branch',
      title: 'Get traffic to your pods',
      description:
        'Route external requests through an ingress with TLS, and use probes so only healthy pods receive traffic.',
    },
    {
      icon: 'gauge',
      title: 'Size and scale workloads',
      description:
        'Set requests and limits that reflect real usage, and scale horizontally on a signal that means something.',
    },
    {
      icon: 'shield',
      title: 'Debug a broken workload',
      description:
        'Work from events and logs to a root cause instead of restarting pods and hoping.',
    },
  ],
  modules: [
    {
      title: 'The Objects You Actually Use',
      summary:
        'A working vocabulary: what each core object is for and how they fit together.',
      lessons: [
        {
          title: 'Pods, ReplicaSets, and Deployments',
          videoQuery: 'kubernetes pods replicasets deployments explained',
          keyPoints: [
            'Understand the pod as the unit of scheduling',
            'See how a deployment manages replica sets',
            'Read the desired-versus-actual reconciliation loop',
          ],
          notes: [
            '## Declare the desired state and let the loop converge',
            'A pod is one or more containers scheduled together, sharing a network namespace. It is the smallest thing the scheduler places, and on its own it is fragile — nothing recreates a pod that dies.',
            'A deployment is what you actually write. It owns a replica set, which owns the pods, and a controller continuously works to make reality match the spec you declared.',
            'That reconciliation model explains most of Kubernetes behaviour. You do not tell it to start a container; you declare that three should exist, and something keeps checking.',
          ],
          proTip:
            'Never create bare pods outside a controller. When the node they landed on is drained, they are simply gone.',
          resources: [
            {
              type: 'documentation',
              title: 'Deployments',
              description: 'Managing replicated applications.',
              url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',
            },
          ],
        },
        {
          title: 'Services and cluster networking',
          videoQuery: 'kubernetes services clusterip nodeport loadbalancer explained',
          keyPoints: [
            'Give a set of pods a stable address',
            'Compare the service types',
            'Understand how selectors bind a service to pods',
          ],
          notes: [
            '## Pods come and go, services do not',
            'Pod ip addresses change on every restart, so nothing should ever be configured with one. A service provides a stable name and address, and load balances across whichever pods currently match its selector.',
            'The types stack: a cluster-internal service is the default, a node port exposes it on every node, and a load balancer asks the cloud provider for an external one. Most application services should stay internal, with an ingress in front.',
            'The selector is the whole binding mechanism. A label typo produces a service with no endpoints, which fails as a connection timeout rather than an obvious error.',
          ],
          proTip:
            'When a service is unreachable, check its endpoints first. Empty endpoints means the selector matches nothing, and that is a label problem, not a network one.',
          resources: [
            {
              type: 'documentation',
              title: 'Services',
              description: 'Service types and cluster networking.',
              url: 'https://kubernetes.io/docs/concepts/services-networking/service/',
            },
          ],
        },
        {
          title: 'ConfigMaps and Secrets',
          videoQuery: 'kubernetes configmap secret environment variables tutorial',
          keyPoints: [
            'Separate configuration from the image',
            'Mount config as environment variables or files',
            'Understand what a secret does and does not protect',
          ],
          notes: [
            '## One image, many environments',
            'Configuration belongs outside the image so the same artefact runs in staging and production. Config maps hold non-sensitive values; secrets hold credentials and are handled with a little more care.',
            'Secrets are base64-encoded, not encrypted, by default. Anyone who can read the object can read the value, so real protection comes from access control and encryption at rest — plus an external secret manager if you need more.',
            'Values injected as environment variables are read once at start. Mounting as files allows updates without a restart, if your application watches the file.',
          ],
          proTip:
            'Roll pods when configuration changes. A deployment whose config map changed does not restart on its own, so half your fleet can be running last week settings.',
          resources: [
            {
              type: 'documentation',
              title: 'ConfigMaps',
              description: 'Injecting configuration into pods.',
              url: 'https://kubernetes.io/docs/concepts/configuration/configmap/',
            },
          ],
        },
        {
          title: 'Namespaces and labels',
          videoQuery: 'kubernetes namespaces labels selectors organization',
          keyPoints: [
            'Partition a cluster into namespaces',
            'Use labels as the selection mechanism',
            'Adopt a consistent labelling convention',
          ],
          notes: [
            '## Labels are the query language',
            'Almost every relationship in Kubernetes is expressed as a label selector: services find pods, deployments find their pods, network policies find their targets. Labels are not documentation, they are wiring.',
            'Namespaces scope names and provide a boundary for quotas and access control. They do not isolate the network by default, which surprises people who assume separate namespaces cannot talk.',
            'Adopt the recommended label conventions from the beginning. Retrofitting labels across a live cluster means touching every workload.',
          ],
          proTip:
            'Set a resource quota on every namespace. Without one, a single misconfigured workload can consume the whole cluster capacity.',
          resources: [
            {
              type: 'documentation',
              title: 'Labels and selectors',
              description: 'How selection works across objects.',
              url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/',
            },
          ],
        },
      ],
    },
    {
      title: 'Getting Traffic In',
      summary:
        'Routing external requests to your service, terminating TLS, and only sending traffic to pods that can serve it.',
      lessons: [
        {
          title: 'Ingress and routing',
          videoQuery: 'kubernetes ingress controller routing tutorial',
          keyPoints: [
            'Route by host and path to services',
            'Understand the controller behind the resource',
            'Avoid one load balancer per service',
          ],
          notes: [
            '## One entry point, many services',
            'An ingress is a routing rule set: this hostname and path go to that service. Without it, every externally reachable service needs its own cloud load balancer, which is expensive and unwieldy.',
            'The resource does nothing on its own — a controller running in the cluster watches ingress objects and configures a proxy. Which controller you run determines the annotations and features available to you.',
            'Path matching rules are more precise than they look. Prefix and exact matching behave differently, and rewriting is controller-specific rather than part of the standard.',
          ],
          proTip:
            'Check the controller documentation, not just the Kubernetes documentation. Most of the behaviour you will rely on lives in controller-specific annotations.',
          resources: [
            {
              type: 'documentation',
              title: 'Ingress',
              description: 'HTTP routing into a cluster.',
              url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/',
            },
          ],
        },
        {
          title: 'TLS and certificates',
          videoQuery: 'kubernetes tls certificates cert-manager ingress https',
          keyPoints: [
            'Terminate TLS at the ingress',
            'Automate certificate issuance and renewal',
            'Handle certificate secrets safely',
          ],
          notes: [
            '## Certificates should renew themselves',
            'TLS is normally terminated at the ingress, which holds the certificate and forwards plain traffic inside the cluster. That keeps certificate management in one place instead of in every service.',
            'Manual renewal is a recurring outage waiting to happen. A controller that requests and renews certificates automatically removes an entire class of calendar-driven incident.',
            'Certificates live in secrets, so the same access control questions apply. A private key readable by every workload in the namespace is not really private.',
          ],
          proTip:
            'Alert on certificate expiry independently of the renewal system. Automation that silently stops renewing looks exactly like automation that is working.',
          resources: [
            {
              type: 'documentation',
              title: 'Ingress TLS',
              description: 'Configuring TLS termination.',
              url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/#tls',
            },
          ],
        },
        {
          title: 'Readiness and liveness probes',
          videoQuery: 'kubernetes liveness readiness startup probes explained',
          keyPoints: [
            'Keep traffic away from pods that are not ready',
            'Restart a process that is genuinely stuck',
            'Give slow starters a startup probe',
          ],
          notes: [
            '## Two probes with completely different jobs',
            'Readiness controls whether a pod receives traffic. Liveness controls whether it gets killed and restarted. Confusing them causes real outages.',
            'A liveness probe that checks a dependency is a distributed outage generator: when the database is briefly slow, every pod fails its probe and the whole deployment restarts, which makes recovery slower. Liveness should test only whether this process is stuck.',
            'A slow-starting application needs a startup probe, otherwise the liveness probe kills it before it ever finishes booting — a restart loop that looks like a crash.',
          ],
          proTip:
            'Readiness may check dependencies; liveness must not. That single rule prevents most probe-induced incidents.',
          resources: [
            {
              type: 'documentation',
              title: 'Configure probes',
              description: 'Liveness, readiness, and startup probes.',
              url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/',
            },
          ],
        },
      ],
    },
    {
      title: 'Running Reliably',
      summary:
        'Sizing workloads, scaling them, and changing them without dropping requests.',
      lessons: [
        {
          title: 'Requests, limits, and quality of service',
          videoQuery: 'kubernetes resource requests limits qos oomkilled',
          keyPoints: [
            'Set requests from observed usage',
            'Understand CPU throttling versus memory kills',
            'Know which pods get evicted first',
          ],
          notes: [
            '## The two numbers that decide your fate',
            'The request is what the scheduler reserves; the limit is the ceiling the runtime enforces. Requests decide where a pod lands, limits decide how it misbehaves when it exceeds them.',
            'CPU and memory fail differently. Exceeding a CPU limit throttles the process — it gets slow. Exceeding a memory limit kills it outright, with no application-level error and a very unhelpful exit.',
            'Pods whose requests equal their limits get the highest quality-of-service class and are evicted last under pressure. Pods with no requests at all are the first to go.',
          ],
          proTip:
            'Set requests from real usage percentiles, not from guesses. Requests set far above actual usage waste cluster capacity as reliably as requests set too low cause evictions.',
          resources: [
            {
              type: 'documentation',
              title: 'Resource management',
              description: 'Requests, limits, and QoS classes.',
              url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
            },
          ],
        },
        {
          title: 'Horizontal pod autoscaling',
          videoQuery: 'kubernetes horizontal pod autoscaler hpa tutorial',
          keyPoints: [
            'Scale on a metric that tracks load',
            'Set sensible minimum and maximum replicas',
            'Avoid oscillation between scale events',
          ],
          notes: [
            '## Scale on the thing that hurts',
            'CPU is the default scaling signal and often the wrong one. A service that is slow because it waits on a database shows low CPU while queueing badly — scaling on queue depth or request latency tracks the actual pain.',
            'Autoscaling only helps if a new pod becomes useful quickly. A workload that takes two minutes to warm up cannot respond to a traffic spike, however aggressive the policy.',
            'Stabilisation windows exist to stop flapping. Scaling down too eagerly after a spike means scaling back up moments later, which costs more than staying scaled.',
          ],
          proTip:
            'Set the minimum replica count above one for anything that matters. Autoscaling from a single pod means the first spike hits a single pod.',
          resources: [
            {
              type: 'documentation',
              title: 'Horizontal Pod Autoscaling',
              description: 'Scaling workloads on metrics.',
              url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/',
            },
          ],
        },
        {
          title: 'Rolling updates and rollbacks',
          videoQuery: 'kubernetes rolling update strategy rollback zero downtime',
          keyPoints: [
            'Tune surge and unavailability',
            'Drain connections before a pod stops',
            'Roll back a bad release quickly',
          ],
          notes: [
            '## Replacing pods without dropping requests',
            'A rolling update replaces pods gradually, controlled by how many extra pods may exist and how many may be missing. Those two numbers decide whether an update is fast or safe.',
            'Graceful shutdown is where zero-downtime deploys are usually lost. A pod removed from the service still has in-flight requests, so it needs a pre-stop delay and a process that finishes work before exiting.',
            'Deployment history makes rollback a single command. Practise it before you need it, because the first time should not be during an incident.',
          ],
          proTip:
            'Handle the termination signal and stop accepting new connections while finishing existing ones. Without it, every deploy drops some requests.',
          resources: [
            {
              type: 'documentation',
              title: 'Rolling updates',
              description: 'Update strategies and rollbacks.',
              url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/',
            },
          ],
        },
        {
          title: 'Jobs and CronJobs',
          videoQuery: 'kubernetes jobs cronjobs batch workloads tutorial',
          keyPoints: [
            'Run a task to completion',
            'Schedule recurring work',
            'Handle retries and concurrency',
          ],
          notes: [
            '## Work that finishes',
            'A job runs pods until a set number succeed, then stops. It is the right object for migrations, imports, and any batch task — unlike a deployment, which will restart your finished task forever.',
            'Cron jobs create jobs on a schedule. Decide explicitly what happens when a run overlaps the previous one; the default allows concurrent runs, which is rarely what a nightly import wants.',
            'Set a retry limit and a deadline. A job that retries indefinitely on a permanent failure quietly burns cluster resources for days.',
          ],
          proTip:
            'Make scheduled work idempotent. Cron jobs do occasionally run twice, and a task that cannot tolerate that will eventually corrupt something.',
          resources: [
            {
              type: 'documentation',
              title: 'CronJob',
              description: 'Scheduled and batch workloads.',
              url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/',
            },
          ],
        },
      ],
    },
    {
      title: 'Operating and Debugging',
      summary:
        'Finding out what is actually wrong, and packaging your manifests so they are reusable.',
      lessons: [
        {
          title: 'Reading logs and events',
          videoQuery: 'kubectl logs events describe debugging pods',
          keyPoints: [
            'Read events for scheduling and probe failures',
            'Get logs from a crashed previous container',
            'Recognise the common pod status messages',
          ],
          notes: [
            '## Events explain what logs cannot',
            'When a pod never starts, its logs are empty and the events tell the whole story: no node had capacity, the image could not be pulled, a volume would not mount, a probe kept failing.',
            'For a pod that crashed and restarted, the current logs are from the new container. Fetching the previous container logs is how you see the actual crash.',
            'Learn the status vocabulary. Pending is scheduling, image pull errors are registry or credentials, crash loops are your application, and an out-of-memory kill is a limits problem.',
          ],
          proTip:
            'Events expire, usually within an hour. Capture them while investigating rather than expecting to come back to them tomorrow.',
          resources: [
            {
              type: 'documentation',
              title: 'Debug pods',
              description: 'Using describe, logs, and events.',
              url: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/',
            },
          ],
        },
        {
          title: 'A kubectl debugging workflow',
          videoQuery: 'kubectl debugging workflow exec port forward ephemeral containers',
          keyPoints: [
            'Work from cluster state down to the process',
            'Port-forward to test a service directly',
            'Debug a container that has no shell',
          ],
          notes: [
            '## Narrow it down in a fixed order',
            'Work outside in: is the pod running, is it ready, does the service have endpoints, does the ingress route to it. Each step eliminates a layer, which beats guessing.',
            'Port-forwarding straight to a pod bypasses the service and ingress entirely. If the application answers there, your problem is in the routing layers, not the code.',
            'Minimal images with no shell are exactly the case ephemeral debug containers exist for: attach a container with tools into the running pod namespace without rebuilding the image.',
          ],
          proTip:
            'Keep a debug image with curl, dig, and a shell ready to run in any namespace. Assembling one during an incident wastes the time you have least of.',
          resources: [
            {
              type: 'documentation',
              title: 'Ephemeral containers',
              description: 'Debugging running pods.',
              url: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/',
            },
          ],
        },
        {
          title: 'Packaging with Helm',
          videoQuery: 'helm charts kubernetes packaging tutorial',
          keyPoints: [
            'Template a manifest across environments',
            'Manage releases and rollbacks',
            'Avoid unreadable template logic',
          ],
          notes: [
            '## One chart, several environments',
            'Copying manifests per environment guarantees drift. A chart templates the varying parts and takes a values file per environment, so the structure stays in one place.',
            'Helm tracks releases, which gives you an upgrade and rollback story for a whole application rather than object by object.',
            'Templates can become unreadable quickly. Conditionals nested inside loops inside partials produce yaml nobody can predict — keep the logic shallow and render the output to check it.',
          ],
          proTip:
            'Render the templates and read the yaml before applying. Chart bugs are far easier to spot in the output than in the template.',
          resources: [
            {
              type: 'documentation',
              title: 'Helm',
              description: 'Charts, values, and releases.',
              url: 'https://helm.sh/docs/',
            },
          ],
        },
      ],
    },
  ],
}
