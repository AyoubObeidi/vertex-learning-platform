export const course = {
  key: 'postgresql-for-application-developers',
  title: 'PostgreSQL for Application Developers',
  summary:
    'Model data that will not fight you later, write queries the planner can execute well, and change a live schema without downtime.',
  level: 'intermediate',
  price: 139,
  popular: false,
  studentCount: 16740,
  coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1600&q=80&fm=jpg',
  coverAlt: 'Server hardware with status lights',
  instructorKey: 'aisha-benali',
  categoryKey: 'data-and-backend',
  learningOutcomes: [
    {
      icon: 'database',
      title: 'Model data with real constraints',
      description:
        'Use types, keys, and constraints so the database refuses to store something invalid in the first place.',
    },
    {
      icon: 'code',
      title: 'Write queries that express intent',
      description:
        'Use joins, window functions, and CTEs to answer a question in one readable statement.',
    },
    {
      icon: 'gauge',
      title: 'Make slow queries fast',
      description:
        'Read a query plan, choose the right index, and know why the planner ignored the one you added.',
    },
    {
      icon: 'shield',
      title: 'Change a live schema safely',
      description:
        'Run migrations on a busy table without taking a lock that stops the application.',
    },
  ],
  modules: [
    {
      title: 'Modelling Your Data',
      summary:
        'Getting the schema right first, because every performance and correctness problem downstream starts here.',
      lessons: [
        {
          title: 'Tables, types, and constraints',
          videoQuery: 'postgresql data types constraints tutorial',
          keyPoints: [
            'Pick precise column types',
            'Push invariants into the schema',
            'Understand nullability as a design decision',
          ],
          notes: [
            '## The database is your last line of defence',
            'Application code is one deploy away from letting bad data through; a constraint is not. Not-null, check, unique, and foreign key constraints make invalid rows impossible rather than merely unlikely.',
            'Choose types precisely. Timestamps with time zone rather than without, numeric rather than float for money, an enum or a lookup table rather than free text for a fixed set. Each wrong choice becomes a class of bug.',
            'Nullable columns spread through every query as a special case. If a value is genuinely required, say so in the schema and stop handling the null everywhere else.',
          ],
          proTip:
            'Never store money as a floating point number. The rounding errors are small, silent, and eventually appear in someone financial report.',
          resources: [
            {
              type: 'documentation',
              title: 'Data types',
              description: 'The PostgreSQL type reference.',
              url: 'https://www.postgresql.org/docs/current/datatype.html',
            },
          ],
        },
        {
          title: 'Normalisation in practice',
          videoQuery: 'database normalization explained practical examples',
          keyPoints: [
            'Remove duplicated facts from a schema',
            'Recognise an update anomaly',
            'Denormalise deliberately, with a reason',
          ],
          notes: [
            '## Every fact in exactly one place',
            'Normalisation is one idea applied repeatedly: store each fact once. Storing a customer address on every order means an address change updates some rows and not others, and now the data disagrees with itself.',
            'A well-normalised schema makes writes safe and joins routine. Modern databases join efficiently; the fear of joins is usually inherited rather than measured.',
            'Denormalising is legitimate when you have measured a problem you cannot solve otherwise. It is a trade you make consciously, and it comes with the obligation to keep the copies in sync.',
          ],
          proTip:
            'If you find yourself updating the same value in several tables, the schema is telling you something. Fix the model before adding triggers to keep copies aligned.',
          resources: [
            {
              type: 'article',
              title: 'Database normalization',
              description: 'Normal forms with practical examples.',
              url: 'https://www.postgresql.org/docs/current/ddl.html',
            },
          ],
        },
        {
          title: 'Keys and relationships',
          videoQuery: 'postgresql primary key foreign key relationships tutorial',
          keyPoints: [
            'Choose between surrogate and natural keys',
            'Enforce referential integrity',
            'Model many-to-many with a join table',
          ],
          notes: [
            '## Keys are how rows find each other',
            'A surrogate key is stable and meaningless, which is exactly what you want for identity. Natural keys change — email addresses, order numbers, country codes — and a changing primary key propagates through every referencing row.',
            'Foreign keys are cheap insurance. Without them, orphaned rows accumulate quietly and cleanup scripts become a permanent fixture.',
            'Many-to-many needs a join table. Once it exists it usually wants its own columns anyway — when the relationship was created, by whom, in what role.',
          ],
          proTip:
            'Index your foreign key columns. PostgreSQL indexes the referenced primary key but not the referencing side, and deletes on the parent will crawl without it.',
          resources: [
            {
              type: 'documentation',
              title: 'Constraints',
              description: 'Primary keys, foreign keys, and referential actions.',
              url: 'https://www.postgresql.org/docs/current/ddl-constraints.html',
            },
          ],
        },
        {
          title: 'JSONB and when to use it',
          videoQuery: 'postgresql jsonb tutorial indexing when to use',
          keyPoints: [
            'Store genuinely variable data as JSONB',
            'Query and index inside a document',
            'Recognise when a column would be better',
          ],
          notes: [
            '## A document column, not an escape hatch',
            'JSONB is the right choice for data whose shape genuinely varies per row: third-party payloads, user-defined fields, event properties. It is binary, indexable, and queryable.',
            'It is the wrong choice for fields every row has. Those deserve real columns with real types and real constraints — a JSONB blob has none of that, and typos in key names fail silently.',
            'Index it with a GIN index when you filter on containment. Without one, every query reads and parses every document in the table.',
          ],
          proTip:
            'Promote a JSONB field to a real column as soon as you filter or sort on it regularly. The document was for flexibility you no longer need there.',
          resources: [
            {
              type: 'documentation',
              title: 'JSON types',
              description: 'JSONB storage, operators, and indexing.',
              url: 'https://www.postgresql.org/docs/current/datatype-json.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Querying with Intent',
      summary:
        'Expressing a real question as one statement the database can answer well.',
      lessons: [
        {
          title: 'Joins and set operations',
          videoQuery: 'sql joins inner left outer explained visually',
          keyPoints: [
            'Choose the join that matches the question',
            'Avoid accidentally multiplying rows',
            'Use set operations where they fit',
          ],
          notes: [
            '## The join type is part of the question',
            'An inner join answers "rows that match"; a left join answers "all of these, with matches where they exist". Reaching for an inner join when you meant the second quietly drops exactly the rows you were looking for.',
            'Joining on a non-unique column multiplies rows, and an aggregate over the result then double-counts. If a total is suspiciously high, count the rows before and after the join.',
            'Set operations are sometimes clearer than a join. Asking which ids exist here but not there reads better as an except than as a left join with a null check.',
          ],
          proTip:
            'Filter in the ON clause for outer joins, not in WHERE. A condition on the outer table in WHERE turns your outer join back into an inner one.',
          resources: [
            {
              type: 'documentation',
              title: 'Joins',
              description: 'Join types and set operations.',
              url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
            },
          ],
        },
        {
          title: 'Aggregation and window functions',
          videoQuery: 'sql window functions over partition by tutorial',
          keyPoints: [
            'Aggregate without losing row detail',
            'Rank and number rows within a group',
            'Compute running totals and comparisons',
          ],
          notes: [
            '## Aggregate without collapsing the rows',
            'Group-by collapses rows into one per group. A window function computes across a set of rows while keeping every row — which is how you show each order alongside the customer total on the same line.',
            'Partitioning defines the window and ordering defines the sequence within it. Together they give you ranks, row numbers, running totals, and comparisons to the previous or next row.',
            'The classic use is picking the latest row per group: number rows within each partition by date descending and keep the first. It replaces a correlated subquery that is both slower and harder to read.',
          ],
          proTip:
            'Window functions run after WHERE. To filter on a rank you must wrap the query in a CTE or subquery and filter outside.',
          resources: [
            {
              type: 'documentation',
              title: 'Window functions',
              description: 'OVER, PARTITION BY, and frames.',
              url: 'https://www.postgresql.org/docs/current/tutorial-window.html',
            },
          ],
        },
        {
          title: 'CTEs and subqueries',
          videoQuery: 'sql common table expressions cte recursive tutorial',
          keyPoints: [
            'Name a step to make a query readable',
            'Walk a hierarchy with a recursive CTE',
            'Know when a CTE changes the plan',
          ],
          notes: [
            '## Naming the steps of a query',
            'A common table expression lets you name an intermediate result, so a three-stage query reads as three named steps rather than as nested subqueries you have to unpick from the inside.',
            'Recursive CTEs traverse hierarchies — category trees, org charts, dependency graphs — in a single statement, with a base case and a step, and a termination condition you must get right.',
            'Modern PostgreSQL usually inlines a CTE into the surrounding query, but marking one as materialised forces evaluation once. That is occasionally the fix for a plan that recomputes an expensive step repeatedly.',
          ],
          proTip:
            'Always bound a recursive CTE with a depth limit while developing. A cycle in the data turns into an infinite loop that consumes the server.',
          resources: [
            {
              type: 'documentation',
              title: 'WITH queries',
              description: 'Common table expressions and recursion.',
              url: 'https://www.postgresql.org/docs/current/queries-with.html',
            },
          ],
        },
        {
          title: 'Full text search',
          videoQuery: 'postgresql full text search tsvector tutorial',
          keyPoints: [
            'Turn text into a searchable vector',
            'Rank results by relevance',
            'Index the search column properly',
          ],
          notes: [
            '## Search without another system',
            'PostgreSQL parses text into normalised lexemes, so a search for one word form matches the others and stop words are dropped. For a great many applications that is enough, and one fewer system to operate is a real feature.',
            'Store the search vector in a generated column and index it. Computing it per query means a full table scan and a lot of parsing on every search.',
            'Relevance ranking weights matches by field and frequency, so a match in a title can outrank one buried in a body.',
          ],
          proTip:
            'Match on wildcarded tokens rather than whole phrases. Users type fragments, and phrase matching fails on the very queries you most want to serve.',
          resources: [
            {
              type: 'documentation',
              title: 'Full text search',
              description: 'tsvector, tsquery, and ranking.',
              url: 'https://www.postgresql.org/docs/current/textsearch.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Making Queries Fast',
      summary:
        'How the planner decides, which indexes help, and how to read the evidence.',
      lessons: [
        {
          title: 'How the query planner works',
          videoQuery: 'postgresql query planner explained statistics cost',
          keyPoints: [
            'Understand cost-based plan selection',
            'See why statistics matter',
            'Recognise when an estimate is badly wrong',
          ],
          notes: [
            '## Estimates in, plan out',
            'The planner enumerates ways to execute a query and picks the cheapest by its cost model. That model runs on statistics about your data — how many rows, how distinct the values are, how they are distributed.',
            'When statistics are stale, the estimates are wrong and the plan is wrong with them. A query that was fast yesterday and is slow today, with no code change, is very often this.',
            'The gap between estimated and actual rows is your main diagnostic. An estimate of ten rows against an actual of a million explains almost any bad plan choice that follows.',
          ],
          proTip:
            'Run ANALYZE after a bulk load. A large import leaves statistics describing the table as it was before, and the planner believes them.',
          resources: [
            {
              type: 'documentation',
              title: 'Query planning',
              description: 'How PostgreSQL chooses a plan.',
              url: 'https://www.postgresql.org/docs/current/planner-optimizer.html',
            },
          ],
        },
        {
          title: 'Indexes: B-tree, GIN, and partial',
          videoQuery: 'postgresql indexes btree gin partial index tutorial',
          keyPoints: [
            'Match the index type to the operator',
            'Order composite index columns correctly',
            'Use partial indexes for skewed data',
          ],
          notes: [
            '## The right index, not just an index',
            'B-tree serves equality and range comparisons and is the default for good reason. GIN indexes containment queries over arrays, JSONB, and text search vectors. Using the wrong type means the index simply is not consulted.',
            'Column order in a composite index matters: it can serve a query filtering on a leading prefix, but not one filtering only on a later column. Put the equality columns first and the range column last.',
            'A partial index covers only the rows matching a condition. On a table where one percent of rows are pending, an index on just those is a fraction of the size and far more effective.',
          ],
          proTip:
            'Every index slows writes and consumes space. Audit for unused indexes periodically — they are pure cost.',
          resources: [
            {
              type: 'documentation',
              title: 'Index types',
              description: 'B-tree, GIN, GiST, and partial indexes.',
              url: 'https://www.postgresql.org/docs/current/indexes-types.html',
            },
          ],
        },
        {
          title: 'Reading EXPLAIN ANALYZE',
          videoQuery: 'postgresql explain analyze tutorial reading query plans',
          keyPoints: [
            'Read a plan from the inside out',
            'Compare estimated and actual rows',
            'Spot the node that dominates the time',
          ],
          notes: [
            '## The plan is the evidence',
            'EXPLAIN shows the plan; adding ANALYZE runs the query and reports what actually happened. Guessing at query performance without it is guesswork, and the guess is usually wrong.',
            'Read from the innermost nodes outward — those run first — and find where the time accumulates. Note that costs shown are cumulative, so the interesting number is the node exclusive time.',
            'A sequential scan is not automatically bad; on a small table it is the fastest option. The red flag is a sequential scan over a large table where you expected an index, which usually means the index cannot serve the predicate as written.',
          ],
          proTip:
            'Wrapping an indexed column in a function disables the index. Rewrite the predicate to leave the column bare, or build an index on the expression.',
          resources: [
            {
              type: 'documentation',
              title: 'Using EXPLAIN',
              description: 'Reading and interpreting query plans.',
              url: 'https://www.postgresql.org/docs/current/using-explain.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Transactions and Change',
      summary:
        'Concurrency semantics, the locks that bite, and migrating a schema that is in use.',
      lessons: [
        {
          title: 'Transactions and isolation levels',
          videoQuery: 'postgresql transaction isolation levels mvcc explained',
          keyPoints: [
            'Group writes into an atomic unit',
            'Compare read committed and serializable',
            'Handle serialization failures with a retry',
          ],
          notes: [
            '## Atomic, and only as isolated as you asked',
            'A transaction makes several statements succeed or fail together. That much is familiar; the interesting part is what other transactions can see while yours is running.',
            'The default read-committed level means each statement sees a fresh snapshot, so two statements in one transaction can see different data. Repeatable read fixes the snapshot for the whole transaction, and serializable additionally guarantees the outcome matches some serial order.',
            'Stronger isolation means transactions can be aborted to preserve those guarantees. Code using serializable must be prepared to retry, and a retry loop is a normal part of the design, not a workaround.',
          ],
          proTip:
            'Keep transactions short. A long-running transaction holds locks and blocks vacuum, which is how a slow report degrades write performance across the database.',
          resources: [
            {
              type: 'documentation',
              title: 'Transaction isolation',
              description: 'Isolation levels and MVCC.',
              url: 'https://www.postgresql.org/docs/current/transaction-iso.html',
            },
          ],
        },
        {
          title: 'Locking and deadlocks',
          videoQuery: 'postgresql locks deadlock troubleshooting tutorial',
          keyPoints: [
            'Know which statements take which locks',
            'Diagnose a blocked query',
            'Prevent deadlocks with consistent ordering',
          ],
          notes: [
            '## Blocked, not slow',
            'A query that is doing nothing for thirty seconds is usually waiting on a lock, not working. The lock views tell you which session holds what and who is waiting, which turns a mystery into a specific culprit.',
            'Deadlocks happen when two transactions acquire the same locks in opposite orders. The database detects the cycle and aborts one, and the durable fix is to always acquire locks in a consistent order.',
            'Schema changes take heavy locks. An ALTER that rewrites a table blocks reads and writes for the duration, which on a large table means an outage.',
          ],
          proTip:
            'Set a lock timeout on migrations. Failing fast is far better than a migration that silently queues behind a long transaction and then blocks the whole application.',
          resources: [
            {
              type: 'documentation',
              title: 'Explicit locking',
              description: 'Lock modes and deadlock handling.',
              url: 'https://www.postgresql.org/docs/current/explicit-locking.html',
            },
          ],
        },
        {
          title: 'Zero-downtime migrations',
          videoQuery: 'zero downtime database migration postgres expand contract',
          keyPoints: [
            'Split a breaking change into safe steps',
            'Add indexes concurrently',
            'Backfill in batches',
          ],
          notes: [
            '## Expand, migrate, contract',
            'A change that breaks the running application cannot be a single step. Add the new structure while the old one still works, migrate the data and the code, then remove the old structure once nothing reads it.',
            'Renaming a column is the classic example: add the new one, write to both, backfill, switch reads, stop writing the old, drop it. Five deploys instead of one, and no downtime in any of them.',
            'Build indexes concurrently so the table stays writable, and backfill in batches with pauses. A single update touching ten million rows holds locks and bloats the table.',
          ],
          proTip:
            'Test migrations against a copy of production-sized data. A migration that takes two seconds on a development database can take forty minutes on the real one.',
          resources: [
            {
              type: 'documentation',
              title: 'ALTER TABLE',
              description: 'Which changes require a rewrite and which do not.',
              url: 'https://www.postgresql.org/docs/current/sql-altertable.html',
            },
          ],
        },
      ],
    },
  ],
}
