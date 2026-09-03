export const course = {
  key: 'building-llm-applications',
  title: 'Building LLM Applications',
  summary:
    'Take a language model from a demo to a feature: structured output, tool calling, streaming interfaces, evaluation, and a cost you can defend.',
  level: 'intermediate',
  price: 199,
  popular: true,
  studentCount: 15870,
  coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&q=80&fm=jpg',
  coverAlt: 'Abstract representation of an AI model',
  instructorKey: 'priya-raghunathan',
  categoryKey: 'ai-and-machine-learning',
  learningOutcomes: [
    {
      icon: 'code',
      title: 'Get reliable structured output',
      description:
        'Constrain a model to a schema and validate what comes back, so downstream code can depend on it.',
    },
    {
      icon: 'git-branch',
      title: 'Design tools an agent can use',
      description:
        'Write tool interfaces with clear contracts and failure modes, and control how many steps a loop may take.',
    },
    {
      icon: 'zap',
      title: 'Stream a responsive interface',
      description:
        'Send tokens to the browser as they arrive and handle cancellation without leaking work.',
    },
    {
      icon: 'gauge',
      title: 'Evaluate before you ship',
      description:
        'Build a scored evaluation set so a prompt change is a measurement rather than a hunch.',
    },
  ],
  modules: [
    {
      title: 'Talking to a Model',
      summary:
        'The request and response cycle, what a prompt is actually doing, and how to get output your code can parse.',
      lessons: [
        {
          title: 'How chat completions work',
          videoQuery: 'how large language models work tokens inference explained',
          keyPoints: [
            'Understand messages, roles, and tokens',
            'See why the model has no memory between calls',
            'Read latency and cost as a function of tokens',
          ],
          notes: [
            '## Every call starts from nothing',
            'A chat request is a list of messages with roles, and the model predicts the next tokens given all of them. There is no server-side memory: the conversation exists because you resend it, which is why context grows and cost grows with it.',
            'Tokens are the unit of everything. They determine cost, they determine latency, and they determine what fits. A rough rule of a few characters per token is enough to reason about budget before you measure precisely.',
            'Temperature controls how much randomness is allowed in sampling. Low values make output repeatable, which is what you want for extraction and classification; higher values suit drafting and ideation.',
          ],
          proTip:
            'Put the instructions in the system message and the data in the user message. Mixing them makes the model treat your rules as content it can negotiate with.',
          resources: [
            {
              type: 'documentation',
              title: 'Messages API',
              description: 'Roles, tokens, and request structure.',
              url: 'https://docs.anthropic.com/en/api/messages',
            },
          ],
        },
        {
          title: 'Prompting fundamentals',
          videoQuery: 'prompt engineering fundamentals system prompt few shot',
          keyPoints: [
            'Specify the task, the format, and the constraints',
            'Use examples where description is ambiguous',
            'Iterate against fixed inputs, not fresh ones',
          ],
          notes: [
            '## A prompt is a specification',
            'Vague prompts produce vague output. State what the task is, what the output should look like, and what the model must not do. Most disappointing results are underspecified requests rather than model limitations.',
            'When a rule is hard to describe, show it. Two or three examples of an edge case handled correctly communicate more than a paragraph of instruction.',
            'Iterate against a fixed set of inputs. Changing the prompt and the test case at the same time means you learn nothing from the result.',
          ],
          proTip:
            'Tell the model what to do when it is unsure. Without an explicit instruction to say so, it will produce a confident answer instead of an honest one.',
          resources: [
            {
              type: 'documentation',
              title: 'Prompt engineering guide',
              description: 'Practical prompting techniques.',
              url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
            },
          ],
        },
        {
          title: 'Structured output and JSON schemas',
          videoQuery: 'llm structured output json schema function calling',
          keyPoints: [
            'Constrain the model to a schema',
            'Validate the response before using it',
            'Design a schema that is easy to fill correctly',
          ],
          notes: [
            '## Text is not an interface',
            'Parsing prose with a regular expression works until the day it does not. Asking for output against a schema makes the shape part of the contract, and gives you a real object to hand to the rest of your code.',
            'Validate anyway. A schema constrains structure, not meaning: a required field can still come back as an empty string, and a date can still be nonsense.',
            'Schema design affects accuracy. Flat schemas with descriptive field names and small enums are filled correctly far more often than deeply nested ones with abbreviated keys.',
          ],
          proTip:
            'Include a field for the model to flag low confidence or missing information. Without an escape hatch it will invent a value to satisfy a required field.',
          resources: [
            {
              type: 'documentation',
              title: 'Structured outputs',
              description: 'Constraining generation to a schema.',
              url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use',
            },
          ],
        },
      ],
    },
    {
      title: 'Tools and Agents',
      summary:
        'Letting a model take actions, and keeping the loop bounded, observable, and safe.',
      lessons: [
        {
          title: 'Tool calling basics',
          videoQuery: 'llm tool calling function calling tutorial',
          keyPoints: [
            'Describe a tool the model can request',
            'Execute the call and return the result',
            'Understand that the model never runs your code',
          ],
          notes: [
            '## The model asks, your code decides',
            'A tool is a name, a description, and an input schema. The model can request a call with arguments; your application decides whether to run it, runs it, and passes the result back for the next turn.',
            'That boundary is the entire safety story. The model produces a request, not an execution, so every check you need — authorisation, validation, rate limiting — belongs on your side of it.',
            'The description is the prompt for the tool. A tool that is called at the wrong time almost always has a description that does not say when it applies.',
          ],
          proTip:
            'Return errors to the model as tool results rather than throwing. Told that an id was not found, it can recover; given an exception, the loop just dies.',
          resources: [
            {
              type: 'documentation',
              title: 'Tool use',
              description: 'Defining tools and handling tool calls.',
              url: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use',
            },
          ],
        },
        {
          title: 'Designing a tool interface',
          videoQuery: 'designing tools for ai agents api design best practices',
          keyPoints: [
            'Give a tool one clear job',
            'Return compact, relevant results',
            'Make dangerous operations explicit',
          ],
          notes: [
            '## Design for a reader with no memory',
            'A tool that does three things needs a prompt to explain when each applies. Three separate tools with precise descriptions are chosen correctly far more often.',
            'Every token a tool returns is context the model must carry for the rest of the conversation. Returning a whole record when three fields were needed is how a loop runs out of room after four steps.',
            'Separate reads from writes, and make anything destructive require an explicit, unambiguous argument. The model should not be able to delete something by being slightly imprecise.',
          ],
          proTip:
            'Paginate every list-returning tool and say so in the description. Unbounded results are the fastest way to blow the context window.',
          resources: [
            {
              type: 'article',
              title: 'Writing tools for agents',
              description: 'Interface design for model-facing tools.',
              url: 'https://www.anthropic.com/engineering/writing-tools-for-agents',
            },
          ],
        },
        {
          title: 'Multi-step agent loops',
          videoQuery: 'ai agent loop reasoning multi step tool use',
          keyPoints: [
            'Run a call-execute-continue loop',
            'Bound the number of steps',
            'Log each step for debugging',
          ],
          notes: [
            '## A loop with a budget',
            'An agent is a loop: send the conversation, get either a final answer or a tool request, execute, append the result, repeat. The pattern is simple; the discipline is in the limits.',
            'Always bound the step count and the total token spend. A model that keeps trying a failing tool will loop until something stops it, and without a cap that something is your bill.',
            'Log every step — the request, the arguments, the result. When an agent produces a strange answer, the trace is the only way to find out which step went wrong.',
          ],
          proTip:
            'Feed a failed step back as an observation and let the model try a different approach. Retrying identical arguments is almost always wasted spend.',
          resources: [
            {
              type: 'article',
              title: 'Building effective agents',
              description: 'Patterns for agentic loops.',
              url: 'https://www.anthropic.com/engineering/building-effective-agents',
            },
          ],
        },
        {
          title: 'Guardrails and failure modes',
          videoQuery: 'llm guardrails prompt injection safety mitigation',
          keyPoints: [
            'Treat retrieved content as untrusted input',
            'Keep authorisation outside the model',
            'Fail closed when validation fails',
          ],
          notes: [
            '## The model is not a security boundary',
            'Text that arrives from a document, a web page, or a tool result can contain instructions. If your prompt concatenates it with your own rules, the model has no reliable way to tell which is which — that is prompt injection, and it is a data-flow problem, not a prompting one.',
            'Permission checks belong in your code, keyed on the authenticated user. A model instructed not to access other tenants data is a request, not a control.',
            'When output fails validation, fail closed. Passing through a partially valid object because the call was expensive is how a bad value reaches the database.',
          ],
          proTip:
            'Mark untrusted content explicitly in the prompt and tell the model it is data, never instructions. It reduces the attack surface, though it does not remove it.',
          resources: [
            {
              type: 'article',
              title: 'Prompt injection',
              description: 'How injection works and what mitigates it.',
              url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
            },
          ],
        },
      ],
    },
    {
      title: 'Streaming and UX',
      summary:
        'Making a slow, probabilistic backend feel like a responsive product.',
      lessons: [
        {
          title: 'Streaming responses to the browser',
          videoQuery: 'streaming llm response server sent events tutorial',
          keyPoints: [
            'Stream tokens as they are generated',
            'Keep the model call on the server',
            'Render partial output without flicker',
          ],
          notes: [
            '## Time to first token is the number that matters',
            'A complete response can take ten seconds; the first token usually arrives in well under one. Streaming converts a long wait into immediate feedback without making the model any faster.',
            'The provider call stays server-side. The browser talks to your route, your route talks to the model, and the API key never leaves the server — streaming does not change that boundary.',
            'Append to a buffer and render the whole buffer each time. Rendering per chunk causes visible flicker and breaks any markdown that spans chunks.',
          ],
          proTip:
            'Buffer a little before rendering markdown. A half-arrived code fence renders as broken formatting that then rewrites itself, which reads as a bug.',
          resources: [
            {
              type: 'documentation',
              title: 'Streaming messages',
              description: 'Server-sent streaming from a model API.',
              url: 'https://docs.anthropic.com/en/api/streaming',
            },
          ],
        },
        {
          title: 'Handling latency and cancellation',
          videoQuery: 'abort controller cancel streaming request javascript',
          keyPoints: [
            'Cancel a request the user abandoned',
            'Propagate cancellation to the provider',
            'Time out a call that will never finish',
          ],
          notes: [
            '## Stop paying for answers nobody will read',
            'When a user navigates away or edits their question, the in-flight generation is worthless. An abort signal threaded from the client through your route to the provider stops the billing as well as the work.',
            'Cancellation has to propagate all the way. Dropping the response while the upstream call continues generates the full answer and charges you for every token of it.',
            'Set a timeout as well. A stalled connection produces a spinner that never resolves, which is worse for the user than a clear failure.',
          ],
          proTip:
            'Persist partial output before aborting. Users frequently want to keep what already arrived, and discarding it feels like losing work.',
          resources: [
            {
              type: 'documentation',
              title: 'AbortController',
              description: 'Cancelling fetch requests.',
              url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController',
            },
          ],
        },
        {
          title: 'Showing intermediate steps',
          videoQuery: 'ai agent ui showing reasoning steps tool calls',
          keyPoints: [
            'Surface tool calls as they happen',
            'Set expectations during a long task',
            'Avoid exposing raw internal state',
          ],
          notes: [
            '## Progress is a feature',
            'A multi-step agent can work for thirty seconds. Showing which tool is running turns dead time into visible progress and gives the user a reason to trust the eventual answer.',
            'Summarise rather than dump. A line saying which source is being searched is informative; a raw JSON payload is noise that also leaks the shape of your internals.',
            'Keep the steps visible after completion, collapsed. Users who want to check the reasoning can expand it, and everyone else sees a clean answer.',
          ],
          proTip:
            'Label each step with what it accomplished rather than what it called. "Searched 12 lessons" is progress; "invoked search_tool" is a log line.',
          resources: [
            {
              type: 'article',
              title: 'Designing AI interfaces',
              description: 'Communicating progress and uncertainty.',
              url: 'https://pair.withgoogle.com/guidebook/',
            },
          ],
        },
      ],
    },
    {
      title: 'Evaluating and Shipping',
      summary:
        'Knowing whether a change made things better, and running the feature at a cost that makes sense.',
      lessons: [
        {
          title: 'Building an evaluation set',
          videoQuery: 'llm evaluation benchmark test set building evals',
          keyPoints: [
            'Collect real inputs, including the hard ones',
            'Define what a correct answer looks like',
            'Score consistently across prompt changes',
          ],
          notes: [
            '## Without evals, every change is a guess',
            'An evaluation set is a fixed list of inputs with expected outcomes. Twenty carefully chosen cases beat two hundred random ones, provided they include the failures you actually saw in production.',
            'Correctness has to be defined before you measure. Exact match works for extraction, a rubric works for prose, and a model-graded score works for anything in between — as long as the grader is itself checked against human judgement.',
            'Run the whole set on every prompt change. A prompt tweak that fixes one case and breaks three is extremely common and invisible without the set.',
          ],
          proTip:
            'Add every production failure to the set as it is reported. The evaluation set should grow from real complaints, not from imagination.',
          resources: [
            {
              type: 'article',
              title: 'Creating evaluations',
              description: 'Building and scoring an eval suite.',
              url: 'https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests',
            },
          ],
        },
        {
          title: 'Cost, caching, and token budgets',
          videoQuery: 'llm cost optimization prompt caching token usage',
          keyPoints: [
            'Attribute cost per feature and per request',
            'Cache a stable prompt prefix',
            'Choose a model per task, not per project',
          ],
          notes: [
            '## Cost is a design constraint',
            'Token spend scales with usage, so a feature that is cheap in testing can be expensive at launch. Measure cost per request early, while the design is still easy to change.',
            'Prompt caching pays for itself whenever a long, stable prefix is reused — system instructions, a schema, a document. The variable part goes at the end so the cached prefix stays identical.',
            'Not every step needs the largest model. Routing classification and extraction to a smaller one and reserving the large model for synthesis often cuts cost several-fold with no measurable quality loss.',
          ],
          proTip:
            'Log token counts per request from day one. Retrofitting cost attribution once the feature is live is far harder than recording it as you go.',
          resources: [
            {
              type: 'documentation',
              title: 'Prompt caching',
              description: 'Reusing a cached prompt prefix.',
              url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching',
            },
          ],
        },
        {
          title: 'Observability for LLM features',
          videoQuery: 'llm observability tracing monitoring production',
          keyPoints: [
            'Trace a request end to end',
            'Capture inputs, outputs, and user feedback',
            'Alert on quality, not just errors',
          ],
          notes: [
            '## A failed answer returns a 200',
            'LLM features fail differently: the request succeeds, the latency looks fine, and the answer is wrong. Error-rate monitoring is blind to exactly the failure mode that matters.',
            'Trace each request with its prompt version, model, tokens, tool calls, and the final output, so you can reconstruct any single answer. Attach the user feedback signal to the same trace.',
            'Watch the shape of the traffic too. A sudden change in output length or refusal rate is usually the first sign that a prompt change or a model update has shifted behaviour.',
          ],
          proTip:
            'Version your prompts and record the version on every trace. Without it you cannot tell whether last week answers came from the prompt you are currently reading.',
          resources: [
            {
              type: 'article',
              title: 'Monitoring LLM applications',
              description: 'Tracing, quality signals, and alerting.',
              url: 'https://opentelemetry.io/docs/concepts/observability-primer/',
            },
          ],
        },
      ],
    },
  ],
}
