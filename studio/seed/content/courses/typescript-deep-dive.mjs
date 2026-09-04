export const course = {
  key: 'typescript-deep-dive',
  title: 'TypeScript Deep Dive',
  summary:
    'Go past the annotations. Learn how the type system actually reasons, write generics that stay readable, and take a large JavaScript codebase to strict mode.',
  level: 'intermediate',
  price: 129,
  popular: true,
  studentCount: 24680,
  coverImage: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1600&q=80&fm=jpg',
  coverAlt: 'Colourful source code on a dark background',
  instructorKey: 'daniel-reyes',
  categoryKey: 'programming-languages',
  learningOutcomes: [
    {
      icon: 'code',
      title: 'Reason like the compiler',
      description:
        'Predict how a type is inferred and narrowed instead of adding annotations until the error goes away.',
    },
    {
      icon: 'layers',
      title: 'Write generics people can read',
      description:
        'Use constraints, defaults, and conditional types to build APIs that infer well at the call site.',
    },
    {
      icon: 'shield',
      title: 'Type the edges safely',
      description:
        'Validate data arriving from APIs and forms at runtime so your types describe reality.',
    },
    {
      icon: 'git-branch',
      title: 'Migrate a real codebase',
      description:
        'Move an existing project to strict mode incrementally, without freezing feature work.',
    },
  ],
  modules: [
    {
      title: 'The Type System Underneath',
      summary:
        'How TypeScript decides two types are compatible, and how it narrows a value as your code branches.',
      lessons: [
        {
          title: 'Structural typing and assignability',
          videoQuery: 'typescript structural typing assignability explained',
          keyPoints: [
            'Understand why shape matters more than name',
            'Predict when an extra property is allowed',
            'Use branded types when structure is not enough',
          ],
          notes: [
            '## Shape, not name',
            'TypeScript compares types by structure. Two separately declared types with the same members are interchangeable, and a value is assignable anywhere its shape satisfies the target — the name it was declared under is irrelevant.',
            'The exception is excess property checking on object literals assigned directly to a typed target, which catches typos in configuration objects. Assign through a variable first and the check does not apply, which surprises people regularly.',
            'When two structurally identical types must not mix — a user id and an order id, both strings — add a phantom property to brand them. The compiler then treats them as distinct even though the runtime value is unchanged.',
          ],
          proTip:
            'If a function accepts the wrong kind of string, the fix is a branded type, not a comment. Structural typing will happily let any string through otherwise.',
          resources: [
            {
              type: 'documentation',
              title: 'Type compatibility',
              description: 'How assignability is decided.',
              url: 'https://www.typescriptlang.org/docs/handbook/type-compatibility.html',
            },
          ],
        },
        {
          title: 'Unions, intersections, and narrowing',
          videoQuery: 'typescript narrowing type guards discriminated unions',
          keyPoints: [
            'Model a value that has several shapes',
            'Narrow with typeof, in, and discriminants',
            'Write a type predicate for a custom check',
          ],
          notes: [
            '## Let the branch prove the type',
            'A union says a value is one of several types; control flow analysis then narrows it as you check. Inside an if branch, the compiler knows more than it did outside — that is the mechanism behind almost all idiomatic TypeScript.',
            'A discriminated union, where each member carries a distinct literal tag, is the most reliable form. Switching on the tag narrows exhaustively, and adding a new member turns every unhandled switch into a compile error.',
            'When a check is too clever for the compiler to follow, a type predicate lets you assert the outcome. It is a promise you are making, so the body must genuinely verify what it claims.',
            '- typeof narrows primitives',
            '- in narrows by property presence',
            '- a literal discriminant narrows object unions exhaustively',
          ],
          proTip:
            'Assign the narrowed value to a never-typed variable in the default branch. Adding a case to the union then fails the build at exactly the switch that forgot it.',
          resources: [
            {
              type: 'documentation',
              title: 'Narrowing',
              description: 'Control flow analysis and type guards.',
              url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
            },
          ],
        },
        {
          title: 'Literal types and const assertions',
          videoQuery: 'typescript literal types as const assertion',
          keyPoints: [
            'Keep a literal from widening to string',
            'Freeze an object or array into exact types',
            'Derive a union from a runtime array',
          ],
          notes: [
            '## Widening, and how to stop it',
            'By default a literal assigned to a mutable binding widens to its base type, because the binding could later hold any string. That is usually what you want and occasionally exactly what you do not.',
            'A const assertion stops the widening: properties become readonly, arrays become tuples, and every literal keeps its exact type. It is the standard way to define a set of allowed values once and use it in both worlds.',
            'From such an array you can derive the union of its members, so the runtime list and the type stay in sync automatically. Adding a value in one place updates both.',
          ],
          proTip:
            'Define allowed values as a const-asserted array and derive the type from it. Two separate declarations will drift apart the first time someone is in a hurry.',
          resources: [
            {
              type: 'documentation',
              title: 'const assertions',
              description: 'Literal types and as const.',
              url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html',
            },
          ],
        },
        {
          title: 'unknown, never, and the any escape hatch',
          videoQuery: 'typescript unknown vs any never type explained',
          keyPoints: [
            'Use unknown for values you have not validated',
            'Recognise what never means when it appears',
            'Contain any instead of letting it spread',
          ],
          notes: [
            '## The top type, the bottom type, and the one that gives up',
            'any switches the checker off for that value and everything it touches. It is contagious: a single any at an API boundary can silently untype an entire module downstream.',
            'unknown is the safe alternative. Anything is assignable to it, but you can do nothing with it until you narrow it, which forces the validation to happen exactly where the untrusted data enters.',
            'never is the type with no values. Seeing it usually means the compiler has proved a branch is unreachable — which is useful for exhaustiveness checks and alarming when it appears somewhere you expected real data.',
          ],
          proTip:
            'Type parsed JSON as unknown, not any. It costs one validation step and it is the difference between a type system that describes your data and one that describes your hopes.',
          resources: [
            {
              type: 'documentation',
              title: 'The unknown type',
              description: 'unknown, any, and never compared.',
              url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown',
            },
          ],
        },
      ],
    },
    {
      title: 'Generics That Earn Their Keep',
      summary:
        'Building reusable types that infer well, without turning your codebase into a puzzle.',
      lessons: [
        {
          title: 'Writing your first generic',
          videoQuery: 'typescript generics tutorial for beginners',
          keyPoints: [
            'Link an input type to an output type',
            'Let inference do the work at the call site',
            'Know when a generic is not needed',
          ],
          notes: [
            '## A type parameter is a relationship',
            'A generic is worth adding when two positions in a signature must agree — the element of the array you pass in and the element you get back. If a type parameter appears only once in a signature, it is not relating anything and a plain type would say the same thing more clearly.',
            'Good generic APIs are inferred, not annotated. If callers have to spell out the parameter every time, the signature has failed at the one job it had.',
            'Name parameters for what they mean. A tree of T, U, and V is legal and unreadable.',
          ],
          proTip:
            'Write the call site first, then the signature that makes it infer. Designing the generic in isolation almost always produces something that needs explicit arguments.',
          resources: [
            {
              type: 'documentation',
              title: 'Generics',
              description: 'Type parameters and inference.',
              url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
            },
          ],
        },
        {
          title: 'Constraints and defaults',
          videoQuery: 'typescript generic constraints extends keyof',
          keyPoints: [
            'Restrict a parameter with extends',
            'Use keyof to type a property accessor',
            'Give a parameter a sensible default',
          ],
          notes: [
            '## Say what the parameter is allowed to be',
            'A constraint lets you use a parameter while keeping it generic: constrain it to an object and you can read its keys; constrain it with keyof and a getter can return the exact type of the property it fetches rather than a union of all of them.',
            'Defaults keep a flexible type approachable. A response type parameterised over its payload can default to unknown, so the common case stays short and the advanced case stays available.',
            'Constrain to what you actually need. Over-constraining rejects valid callers, and under-constraining pushes the error message somewhere unhelpful.',
          ],
          proTip:
            'Constrain to the narrowest shape the implementation uses. The error then lands at the call site with a message that names the missing property.',
          resources: [
            {
              type: 'documentation',
              title: 'Generic constraints',
              description: 'extends, keyof, and default type arguments.',
              url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints',
            },
          ],
        },
        {
          title: 'Conditional and mapped types',
          videoQuery: 'typescript conditional types mapped types tutorial',
          keyPoints: [
            'Branch on a type with a conditional',
            'Transform every property with a mapped type',
            'Understand distribution over unions',
          ],
          notes: [
            '## Types that compute',
            'A conditional type chooses between two results based on an assignability test, which is how the built-in helpers pick apart function and promise types. A mapped type walks the keys of an object type and rewrites each property, which is how readonly and optional variants are produced.',
            'Conditionals distribute over unions by default: applied to a union, the test runs per member and the results are unioned back. That is usually what you want, and when it is not, wrapping both sides in a tuple suppresses it.',
            'Combine the two with key remapping and you can derive an event-handler type from a state shape, or a partial update type from a record, with no duplication.',
          ],
          proTip:
            'Check what a computed type resolves to by hovering an alias of it, not by reading the definition. Type-level code is far easier to verify than to trace.',
          resources: [
            {
              type: 'documentation',
              title: 'Conditional types',
              description: 'Conditional and mapped type mechanics.',
              url: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html',
            },
          ],
        },
        {
          title: 'infer and type-level pattern matching',
          videoQuery: 'typescript infer keyword template literal types',
          keyPoints: [
            'Extract a piece of a type with infer',
            'Parse a string type with template literals',
            'Know when type-level cleverness costs too much',
          ],
          notes: [
            '## Pulling a type back out',
            'Inside a conditional, infer introduces a type variable bound to whatever matched. That is how you get an array element type, a promise resolution type, or the parameters of a function without the caller passing them.',
            'Template literal types extend this to strings: a route pattern can be matched against and its parameters extracted, so a router knows the shape of its own params object.',
            'There is a ceiling. Deeply recursive type-level code slows the compiler and produces error messages nobody can read. When a type takes longer to understand than the bug it prevents, it is no longer paying for itself.',
          ],
          proTip:
            'Watch the editor. If autocomplete starts lagging in a file, your type-level recursion has become an engineering cost, not just a clever trick.',
          resources: [
            {
              type: 'documentation',
              title: 'Template literal types',
              description: 'infer and string pattern matching in types.',
              url: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Typing Real Codebases',
      summary:
        'The problems that only appear once the project is large, shared, and already running in production.',
      lessons: [
        {
          title: 'Declaration files and module augmentation',
          videoQuery: 'typescript declaration files d.ts module augmentation',
          keyPoints: [
            'Type an untyped dependency',
            'Extend an existing module or global',
            'Keep ambient declarations under control',
          ],
          notes: [
            '## Describing code you do not own',
            'A declaration file carries types with no implementation. It is how you type a plain JavaScript dependency, and how community type packages work for libraries that ship none.',
            'Module augmentation adds members to an existing module — a custom property on a framework request object, an extra field on a session. Because it is global and invisible at the use site, it should live in one obvious file rather than being scattered.',
            'Ambient declarations are unchecked assertions. If the library changes, nothing tells you the declaration is now wrong except a runtime failure, so keep them minimal.',
          ],
          proTip:
            'Prefer a small hand-written declaration covering the parts you use over a large generated one. Less surface area means less that can silently drift.',
          resources: [
            {
              type: 'documentation',
              title: 'Declaration files',
              description: 'Writing and organising .d.ts files.',
              url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html',
            },
          ],
        },
        {
          title: 'Typing async boundaries and API responses',
          videoQuery: 'typescript typing fetch api response error handling',
          keyPoints: [
            'Stop trusting a response body by assertion',
            'Model failure as part of the return type',
            'Keep generated API types in sync',
          ],
          notes: [
            '## Your types stop at the network',
            'Asserting a fetch result into an interface tells the compiler what you hope arrived. The server can change tomorrow and the types will keep insisting everything is fine, right up until a property is undefined in production.',
            'Parse instead of assert. Validate the payload at the boundary and let the parsed result carry the type, so a schema change surfaces as a caught validation error with a useful message.',
            'Where failure is expected, return it rather than throwing. A result type that forces the caller to handle the error branch is checked; a thrown error is a comment.',
          ],
          proTip:
            'Generate client types from the API schema and re-generate in CI. Hand-maintained response interfaces are always slightly wrong and nobody knows which part.',
          resources: [
            {
              type: 'article',
              title: 'Parse, do not validate',
              description: 'Making illegal states unrepresentable at boundaries.',
              url: 'https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/',
            },
          ],
        },
        {
          title: 'Strict mode migration strategy',
          videoQuery: 'typescript strict mode migration javascript codebase',
          keyPoints: [
            'Turn on strict flags one at a time',
            'Stop the bleeding before fixing history',
            'Track progress without blocking releases',
          ],
          notes: [
            '## Incremental, or it will not happen',
            'Enabling every strict flag on a large codebase produces thousands of errors and a branch nobody merges. Enable one flag at a time, starting with the one that finds real bugs — null and undefined checking — and fix its errors before moving on.',
            'New code should be strict immediately, even while old code is not. A lint rule that blocks new violations means the number only goes down.',
            'Convert file by file, prioritising the modules that are edited most often. The oldest untouched file is also the one least likely to hurt you.',
          ],
          proTip:
            'Count errors per flag and publish the trend. A visible number going down keeps a migration alive far longer than any plan document.',
          resources: [
            {
              type: 'documentation',
              title: 'Strictness flags',
              description: 'What each strict option enables.',
              url: 'https://www.typescriptlang.org/tsconfig#strict',
            },
          ],
        },
      ],
    },
    {
      title: 'Tooling and Build',
      summary:
        'Compiler configuration, project layout, and closing the gap between compile time and runtime.',
      lessons: [
        {
          title: 'tsconfig options that matter',
          videoQuery: 'typescript tsconfig explained target module moduleResolution',
          keyPoints: [
            'Set target and module for your runtime',
            'Choose the right module resolution mode',
            'Separate type checking from emitting',
          ],
          notes: [
            '## A short list of options with large consequences',
            'target decides which syntax is downlevelled, module decides what the emitted imports look like, and module resolution decides how specifiers are found on disk. Mismatching them against your runtime produces confusing failures that look like bugs in your code.',
            'In most modern setups a bundler does the emitting and the compiler only checks types. Saying so explicitly avoids two tools disagreeing about the output.',
            'Everything else is preference until it is not. Skipping library checks speeds up builds and hides genuine incompatibilities between dependency type versions.',
          ],
          proTip:
            'Start from the published base config for your runtime rather than an empty file. The defaults are wrong for almost every modern project.',
          resources: [
            {
              type: 'documentation',
              title: 'tsconfig reference',
              description: 'Every compiler option, annotated.',
              url: 'https://www.typescriptlang.org/tsconfig',
            },
          ],
        },
        {
          title: 'Project references and monorepos',
          videoQuery: 'typescript project references monorepo build setup',
          keyPoints: [
            'Split a large build into checkable units',
            'Keep package boundaries honest',
            'Speed up rebuilds with incremental output',
          ],
          notes: [
            '## Many small builds instead of one enormous one',
            'Project references let one package depend on another package built output rather than its source, so the compiler can check and rebuild only what changed. On a large repository the difference is minutes.',
            'They also enforce the dependency graph. A package that has not declared a dependency simply cannot import from it, which stops the slow slide into an implicit ball of mud.',
            'The cost is discipline: every package needs its own config and correct references, and a missing one produces an error message that does not obviously say so.',
          ],
          proTip:
            'Point package entries at source during development and at built output for consumers. Editors then jump to real code while the build stays incremental.',
          resources: [
            {
              type: 'documentation',
              title: 'Project references',
              description: 'Composite projects and incremental builds.',
              url: 'https://www.typescriptlang.org/docs/handbook/project-references.html',
            },
          ],
        },
        {
          title: 'Runtime validation with Zod',
          videoQuery: 'zod typescript schema validation tutorial',
          keyPoints: [
            'Define one schema and infer the type from it',
            'Validate untrusted input at the boundary',
            'Turn validation failures into useful messages',
          ],
          notes: [
            '## One source of truth for a shape',
            'Types vanish at runtime, so anything crossing a boundary — a request body, a form, an environment variable, a third-party response — needs a real check. A schema library gives you that check and the static type from a single declaration.',
            'Inferring the type from the schema is what keeps the two aligned. Declaring an interface alongside a schema reintroduces exactly the drift you were trying to remove.',
            'Validate environment variables at startup. Failing immediately with a clear message beats a null reference three hours into a deployment.',
          ],
          proTip:
            'Map validation errors to field paths and return them as data. A flat "invalid input" message makes the user guess which of eight fields is wrong.',
          resources: [
            {
              type: 'documentation',
              title: 'Zod',
              description: 'Schema declaration and type inference.',
              url: 'https://zod.dev',
            },
          ],
        },
      ],
    },
  ],
}
