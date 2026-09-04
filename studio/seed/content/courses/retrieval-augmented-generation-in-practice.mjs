export const course = {
  key: 'retrieval-augmented-generation-in-practice',
  title: 'Retrieval-Augmented Generation in Practice',
  summary:
    'Build a RAG system that actually retrieves the right thing: chunking that preserves meaning, hybrid search, re-ranking, and answers you can trace to a source.',
  level: 'advanced',
  price: 219,
  popular: false,
  studentCount: 7430,
  coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80&fm=jpg',
  coverAlt: 'Network of connected points of light',
  instructorKey: 'priya-raghunathan',
  categoryKey: 'ai-and-machine-learning',
  learningOutcomes: [
    {
      icon: 'layers',
      title: 'Design a retrieval pipeline',
      description:
        'Understand every stage from ingestion to grounded answer, and where each one typically fails.',
    },
    {
      icon: 'database',
      title: 'Chunk and embed sensibly',
      description:
        'Split documents so a retrieved passage still makes sense on its own, and pick an embedding model deliberately.',
    },
    {
      icon: 'gauge',
      title: 'Measure retrieval quality',
      description:
        'Score recall and precision so you can tell whether a change to the pipeline helped.',
    },
    {
      icon: 'shield',
      title: 'Ground every answer',
      description:
        'Cite sources, detect unsupported claims, and make the system say it does not know.',
    },
  ],
  modules: [
    {
      title: 'Why Retrieval',
      summary:
        'What retrieval solves, what the pipeline looks like end to end, and when you should not build one.',
      lessons: [
        {
          title: 'The knowledge cutoff problem',
          videoQuery: 'llm knowledge cutoff hallucination retrieval explained',
          keyPoints: [
            'Understand what a model does not know',
            'Separate missing knowledge from bad reasoning',
            'See why fine-tuning is not a knowledge fix',
          ],
          notes: [
            '## Models know a lot, but not your data',
            'A model is trained on a snapshot. It has never seen your internal documents, your prices, or anything published after training, and it cannot tell you which of those categories a question falls into.',
            'Asked about something it does not know, a model produces a plausible answer rather than an empty one. Retrieval fixes this by putting the actual facts in front of it at request time.',
            'Fine-tuning teaches style and format far more reliably than facts. Changing knowledge means retraining; changing a retrieved document means saving a file.',
          ],
          proTip:
            'If your answers are wrong because the model lacks information, retrieve. If they are wrong because it reasons badly about information it has, retrieval will not help.',
          resources: [
            {
              type: 'article',
              title: 'Retrieval-augmented generation',
              description: 'The original RAG formulation.',
              url: 'https://arxiv.org/abs/2005.11401',
            },
          ],
        },
        {
          title: 'Anatomy of a RAG pipeline',
          videoQuery: 'rag pipeline architecture ingestion retrieval generation',
          keyPoints: [
            'Trace a query through every stage',
            'Separate the ingestion path from the query path',
            'Know which stage a bad answer came from',
          ],
          notes: [
            '## Two pipelines, not one',
            'Ingestion runs offline: load documents, split them, embed the pieces, and index them with their metadata. The query path runs per request: embed or parse the question, retrieve candidates, re-rank, assemble a prompt, generate.',
            'Keeping them separate matters operationally. Re-indexing a corpus should never happen inside a user request, and changing an embedding model means reprocessing everything on the ingestion side.',
            'When an answer is wrong, find the stage. Was the right passage retrieved at all? If not, it is a retrieval problem. If it was retrieved and the answer still ignored it, it is a generation problem. These have completely different fixes.',
          ],
          proTip:
            'Log the retrieved passages with every answer. Without them you are debugging the generation step blind, and it is usually not the guilty one.',
          resources: [
            {
              type: 'article',
              title: 'RAG system design',
              description: 'Stages of a production retrieval pipeline.',
              url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/',
            },
          ],
        },
        {
          title: 'When RAG is the wrong answer',
          videoQuery: 'when not to use rag alternatives long context',
          keyPoints: [
            'Compare RAG with a long context window',
            'Recognise questions retrieval cannot serve',
            'Consider structured queries instead',
          ],
          notes: [
            '## Not every question is a search',
            'If the whole corpus fits comfortably in context and cost allows, sending it directly is simpler and more accurate than any retrieval pipeline you could build.',
            'Aggregate questions — how many, what is the trend, which is the largest — are not retrieval questions. Retrieval returns a handful of passages; the answer requires scanning everything. That is a database query.',
            'Retrieval also struggles with questions that need the whole document, like summarising a contract. Chunk-level search returns fragments, and a summary of fragments is not a summary.',
          ],
          proTip:
            'Route the query before retrieving. Sending aggregate questions to SQL and factual ones to retrieval outperforms forcing everything through one path.',
          resources: [
            {
              type: 'article',
              title: 'Long context versus retrieval',
              description: 'When to retrieve and when to just include everything.',
              url: 'https://www.anthropic.com/news/contextual-retrieval',
            },
          ],
        },
      ],
    },
    {
      title: 'Chunking and Embeddings',
      summary:
        'Turning documents into retrievable units without destroying the meaning that made them useful.',
      lessons: [
        {
          title: 'Chunking strategies',
          videoQuery: 'rag chunking strategies chunk size overlap',
          keyPoints: [
            'Split on structure rather than character count',
            'Choose a size that keeps a passage self-contained',
            'Use overlap to avoid cutting an answer in half',
          ],
          notes: [
            '## A chunk has to make sense alone',
            'The retrieved passage is what the model sees. If a chunk boundary lands mid-argument, the model gets half a thought and answers from half a thought.',
            'Splitting on document structure — headings, sections, paragraphs — beats fixed character counts, because those boundaries were chosen by an author to separate ideas. Fall back to a size limit only inside a section that is too long.',
            'A modest overlap between adjacent chunks stops an answer that straddles a boundary from being lost by both. Too much overlap inflates the index and returns near-duplicates.',
          ],
          proTip:
            'Prepend the document title and section heading to every chunk. It costs a few tokens and dramatically improves retrieval for chunks that use pronouns.',
          resources: [
            {
              type: 'article',
              title: 'Chunking strategies',
              description: 'Comparing splitting approaches for retrieval.',
              url: 'https://www.pinecone.io/learn/chunking-strategies/',
            },
          ],
        },
        {
          title: 'Choosing an embedding model',
          videoQuery: 'text embeddings model comparison vector similarity',
          keyPoints: [
            'Understand what an embedding represents',
            'Weigh dimensions against cost and speed',
            'Check domain fit before committing',
          ],
          notes: [
            '## Similar meaning, nearby vectors',
            'An embedding maps text to a vector so that semantically related passages land close together. That is what lets a query about "cutting cloud spend" match a document about "reducing infrastructure costs" with no shared keywords.',
            'Larger vectors capture more nuance and cost more to store and search. The honest way to choose is to evaluate a few candidates on your own queries, because leaderboard rankings rarely survive contact with a specific domain.',
            'Switching models later means re-embedding everything, and vectors from different models are not comparable. Treat the choice as a migration, not a config change.',
          ],
          proTip:
            'Embed the query and the documents with the same model and the same preprocessing. A mismatch degrades quality quietly rather than failing loudly.',
          resources: [
            {
              type: 'article',
              title: 'Embeddings overview',
              description: 'How text embeddings work and how to compare them.',
              url: 'https://huggingface.co/blog/getting-started-with-embeddings',
            },
          ],
        },
        {
          title: 'Vector stores and indexes',
          videoQuery: 'vector database index hnsw approximate nearest neighbor',
          keyPoints: [
            'Compare exact and approximate search',
            'Understand the recall and latency trade-off',
            'Plan for updates and deletions',
          ],
          notes: [
            '## Approximate, on purpose',
            'Exact nearest-neighbour search compares the query against every vector and is fine up to a point. Beyond that, approximate indexes trade a small amount of recall for orders of magnitude less latency.',
            'Index parameters are a dial between speed and completeness. Tune them against your own evaluation set rather than accepting defaults, because the right point depends on how much recall your application can lose.',
            'Ask how the store handles updates before you pick it. Some indexes degrade as documents are deleted and need periodic rebuilds, which is an operational cost you inherit.',
          ],
          proTip:
            'Store the source id and a content hash alongside every vector. Re-indexing only what changed is the difference between a five-minute job and an overnight one.',
          resources: [
            {
              type: 'article',
              title: 'Approximate nearest neighbour search',
              description: 'How vector indexes trade recall for speed.',
              url: 'https://www.pinecone.io/learn/series/faiss/hnsw/',
            },
          ],
        },
        {
          title: 'Metadata filtering',
          videoQuery: 'vector search metadata filtering hybrid query',
          keyPoints: [
            'Restrict search by tenant, date, or type',
            'Combine a filter with vector similarity',
            'Avoid filters that empty the result set',
          ],
          notes: [
            '## Similarity is not enough',
            'Most real queries carry implicit constraints: this workspace, this product version, documents the user may actually see. Those belong in a metadata filter, not in the embedding.',
            'Access control especially. Filtering by permission at query time is the only way to be sure a user never sees a passage from a document they cannot open — post-filtering the results is both slower and easier to get wrong.',
            'Aggressive filters can leave nothing to retrieve. Detect the empty case and tell the user, rather than generating an answer from no context at all.',
          ],
          proTip:
            'Index the metadata you might filter on from the start. Backfilling a field across millions of vectors is far more painful than storing it up front.',
          resources: [
            {
              type: 'article',
              title: 'Filtered vector search',
              description: 'Combining metadata filters with similarity search.',
              url: 'https://www.pinecone.io/learn/vector-search-filtering/',
            },
          ],
        },
      ],
    },
    {
      title: 'Retrieval Quality',
      summary:
        'Getting the right passages into the top few results, and proving that you did.',
      lessons: [
        {
          title: 'Hybrid keyword and vector search',
          videoQuery: 'hybrid search bm25 vector search combination rrf',
          keyPoints: [
            'Understand where each method fails',
            'Fuse two ranked lists into one',
            'Handle exact identifiers and rare terms',
          ],
          notes: [
            '## Two methods with complementary blind spots',
            'Vector search finds meaning but misses exact tokens: an error code, a product SKU, a surname. Keyword search nails those and misses every paraphrase.',
            'Running both and fusing the ranked lists gives you the union of their strengths. Reciprocal rank fusion is the standard approach and needs no score calibration between the two systems, which is what makes it robust.',
            'Hybrid search is usually the single largest quality improvement available to a pipeline that started with vectors alone.',
          ],
          proTip:
            'Test with queries containing an exact identifier. Pure vector search fails those badly, and identifiers are exactly what users paste in.',
          resources: [
            {
              type: 'article',
              title: 'Hybrid search',
              description: 'Combining lexical and semantic retrieval.',
              url: 'https://www.elastic.co/what-is/hybrid-search',
            },
          ],
        },
        {
          title: 'Re-ranking results',
          videoQuery: 'cross encoder reranking search results tutorial',
          keyPoints: [
            'Retrieve widely, then rank precisely',
            'Understand the cross-encoder trade-off',
            'Pick how many results to keep',
          ],
          notes: [
            '## Cheap recall, then expensive precision',
            'Retrieve fifty candidates with a fast method, then re-score them with a model that reads the query and the passage together. That two-stage shape gives you accuracy you could not afford across the whole corpus.',
            'A cross-encoder is far more accurate than vector similarity because it can attend to the query while reading the passage — and far too slow to run over everything, which is exactly why it belongs in stage two.',
            'Keeping fewer, better passages usually beats keeping more. Irrelevant context does not just waste tokens, it actively distracts the generation step.',
          ],
          proTip:
            'Measure quality against the number of passages kept. Most pipelines peak around three to five and get worse, not better, beyond that.',
          resources: [
            {
              type: 'article',
              title: 'Rerankers',
              description: 'Two-stage retrieval with cross-encoders.',
              url: 'https://www.pinecone.io/learn/series/rag/rerankers/',
            },
          ],
        },
        {
          title: 'Query rewriting and expansion',
          videoQuery: 'query rewriting expansion rag multi query retrieval',
          keyPoints: [
            'Resolve pronouns from conversation history',
            'Expand a short query into several',
            'Avoid rewriting away the user intent',
          ],
          notes: [
            '## The question as asked is often not searchable',
            'In a conversation, a follow-up like "what about the second one" contains almost nothing to match on. Rewriting it against the history into a standalone question is what makes multi-turn retrieval work at all.',
            'Expansion generates several phrasings of the same question, retrieves for each, and merges the results. It rescues queries whose vocabulary happens not to match the corpus.',
            'Rewriting can also destroy intent. Always retrieve for the original query alongside the rewrites, so an over-eager reformulation cannot lose the answer entirely.',
          ],
          proTip:
            'Log the rewritten query next to the original. When a follow-up returns nothing useful, the rewrite is the first place to look.',
          resources: [
            {
              type: 'article',
              title: 'Query transformations',
              description: 'Rewriting and expanding queries for retrieval.',
              url: 'https://www.pinecone.io/learn/series/rag/query-transformations/',
            },
          ],
        },
        {
          title: 'Measuring retrieval with recall@k',
          videoQuery: 'information retrieval metrics recall precision mrr ndcg',
          keyPoints: [
            'Build a labelled query set',
            'Compute recall and precision at k',
            'Track retrieval separately from answer quality',
          ],
          notes: [
            '## Score the retriever on its own',
            'Recall at k asks whether the passage containing the answer appears in the top k results. If it does not, no amount of prompt engineering downstream can produce a correct answer.',
            'Building the labelled set is the real work: real queries paired with the passages that genuinely answer them. A few dozen carefully labelled queries are enough to make pipeline changes measurable.',
            'Keep this metric separate from end-to-end answer quality. Combining them means a retrieval regression can be masked by a generation improvement, and you will not see it until users do.',
          ],
          proTip:
            'Report recall at several values of k. Recall at twenty that is much higher than at three tells you the ranking is the problem, not the retrieval.',
          resources: [
            {
              type: 'article',
              title: 'Evaluating retrieval',
              description: 'Recall, precision, MRR, and NDCG.',
              url: 'https://www.pinecone.io/learn/offline-evaluation/',
            },
          ],
        },
      ],
    },
    {
      title: 'Grounded Generation',
      summary:
        'Turning retrieved passages into an answer the user can verify — and refusing when the passages do not support one.',
      lessons: [
        {
          title: 'Prompting with retrieved context',
          videoQuery: 'rag prompt template context grounding instructions',
          keyPoints: [
            'Structure the prompt so sources are distinguishable',
            'Instruct the model to answer only from context',
            'Order passages deliberately',
          ],
          notes: [
            '## Structure beats concatenation',
            'Passages pasted into one block become indistinguishable. Wrapping each in a delimiter with its source id lets the model attribute claims and lets you check that it did.',
            'State the grounding rule explicitly: answer only from the provided context, and say when the context does not contain the answer. Without that instruction the model falls back on training knowledge and you cannot tell which sentence came from where.',
            'Position matters. Models attend most reliably to the beginning and end of a long context, so put the strongest passages at the edges rather than burying them in the middle.',
          ],
          proTip:
            'Keep retrieved content clearly marked as data. It came from documents you may not control, and it can contain instructions aimed at your model.',
          resources: [
            {
              type: 'article',
              title: 'Contextual retrieval',
              description: 'Improving how retrieved context is presented.',
              url: 'https://www.anthropic.com/news/contextual-retrieval',
            },
          ],
        },
        {
          title: 'Citations and attribution',
          videoQuery: 'llm citations source attribution rag implementation',
          keyPoints: [
            'Require a source id per claim',
            'Link a citation back to the exact passage',
            'Verify citations rather than trusting them',
          ],
          notes: [
            '## An answer you cannot check is an opinion',
            'Citations turn a generated paragraph into something a user can verify in seconds. Ask for a source identifier alongside each claim and render it as a link to the passage, not just to the document.',
            'Models do sometimes cite a passage that does not support the claim. Verifying that the cited id was actually retrieved is a cheap check that catches the most embarrassing cases.',
            'Deep-link to the location — a heading anchor, a page number, a timestamp. Landing a user at the top of a fifty-page document is technically a citation and practically useless.',
          ],
          proTip:
            'Show the source snippet on hover. Users who can confirm a claim without leaving the page trust the system far more quickly.',
          resources: [
            {
              type: 'documentation',
              title: 'Citations',
              description: 'Producing verifiable source attributions.',
              url: 'https://docs.anthropic.com/en/docs/build-with-claude/citations',
            },
          ],
        },
        {
          title: 'Detecting and reducing hallucination',
          videoQuery: 'reduce llm hallucination grounding faithfulness evaluation',
          keyPoints: [
            'Score whether an answer is supported',
            'Make refusal an acceptable outcome',
            'Fix retrieval before blaming generation',
          ],
          notes: [
            '## Faithfulness is measurable',
            'Split an answer into claims and check each against the retrieved passages. Automating that check with a grader model gives you a faithfulness score you can track across releases.',
            'Most hallucination in a RAG system is a retrieval failure in disguise: the passage was not there, and the model filled the gap. Check recall before rewriting the prompt.',
            'Design for refusal. If saying "the documents do not cover this" is treated as a failure, the system will learn to guess instead, which is strictly worse.',
          ],
          proTip:
            'Track refusal rate alongside accuracy. A sudden drop in refusals usually means the model started inventing answers, not that it got smarter.',
          resources: [
            {
              type: 'article',
              title: 'Evaluating faithfulness',
              description: 'Measuring whether answers are grounded in context.',
              url: 'https://docs.ragas.io/en/stable/concepts/metrics/',
            },
          ],
        },
      ],
    },
  ],
}
