export const course = {
  key: 'python-foundations-for-data-work',
  title: 'Python Foundations for Data Work',
  summary:
    'Learn Python the way data people actually use it: clean scripts, the standard library, and enough pandas to answer a real question.',
  level: 'beginner',
  price: 89,
  popular: false,
  studentCount: 31150,
  coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80&fm=jpg',
  coverAlt: 'Streams of code on a dark screen',
  instructorKey: 'aisha-benali',
  categoryKey: 'programming-languages',
  learningOutcomes: [
    {
      icon: 'code',
      title: 'Write Python you can come back to',
      description:
        'Use functions, comprehensions, and modules to keep a script readable after you have forgotten how it works.',
    },
    {
      icon: 'database',
      title: 'Choose the right data structure',
      description:
        'Know when a list, a dict, a set, or a generator is the right shape for the job.',
    },
    {
      icon: 'git-branch',
      title: 'Work with files and APIs',
      description:
        'Read and write CSV and JSON, call an HTTP service, and handle the failures both of those bring.',
    },
    {
      icon: 'gauge',
      title: 'Answer a question with pandas',
      description:
        'Load a dataset, filter and group it, and produce a chart that supports a conclusion.',
    },
  ],
  modules: [
    {
      title: 'Python Essentials',
      summary:
        'The language core: values, control flow, functions, and how a project is organised on disk.',
      lessons: [
        {
          title: 'Values, types, and variables',
          videoQuery: 'python variables data types tutorial for beginners',
          keyPoints: [
            'Tell the built-in types apart',
            'Understand names as references to objects',
            'Recognise mutability and why it matters',
          ],
          notes: [
            '## Names point at objects',
            'A Python variable is a name bound to an object, not a box holding a value. Assigning one name to another binds both to the same object, which is invisible for numbers and strings and very visible for lists.',
            'That distinction is the source of the classic beginner surprise: appending to a list through one name changes what the other name sees, because there was only ever one list.',
            'Immutable types — numbers, strings, tuples — sidestep the problem entirely. Any operation that looks like a change produces a new object instead.',
          ],
          proTip:
            'Never use a mutable value as a default argument. It is created once when the function is defined and quietly accumulates across every call.',
          resources: [
            {
              type: 'documentation',
              title: 'Built-in types',
              description: 'The standard type reference.',
              url: 'https://docs.python.org/3/library/stdtypes.html',
            },
          ],
        },
        {
          title: 'Control flow and comprehensions',
          videoQuery: 'python list comprehension for loops tutorial',
          keyPoints: [
            'Loop and branch idiomatically',
            'Replace a build-up loop with a comprehension',
            'Know when a comprehension hurts readability',
          ],
          notes: [
            '## The shape most Python loops want to be',
            'A very common loop creates an empty list, iterates, transforms, and appends. A comprehension expresses the same thing in one line that reads as a description of the result rather than a recipe for building it.',
            'Comprehensions come in dict and set forms too, and a filtering clause folds the if into the same expression.',
            'They stop helping when nested more than one level deep or when the expression grows a conditional inside a conditional. At that point an explicit loop is the readable choice, and readability is the entire point.',
          ],
          proTip:
            'Use enumerate when you need the index and zip when you are walking two sequences together. Manual counter variables are where off-by-one bugs live.',
          resources: [
            {
              type: 'documentation',
              title: 'Control flow',
              description: 'Loops, conditionals, and comprehensions.',
              url: 'https://docs.python.org/3/tutorial/controlflow.html',
            },
          ],
        },
        {
          title: 'Functions, arguments, and scope',
          videoQuery: 'python functions arguments kwargs scope tutorial',
          keyPoints: [
            'Use positional, keyword, and default arguments',
            'Understand local, enclosing, and global scope',
            'Return values instead of mutating inputs',
          ],
          notes: [
            '## A function should be honest about what it touches',
            'Python resolves a name by looking in the local scope, then any enclosing function, then the module, then the built-ins. Assigning to a name anywhere in a function makes it local for the whole function, which is why reading a global before assigning it raises an error.',
            'Keyword arguments with defaults make a call site self-documenting, and are the difference between a call you can read and four bare booleans in a row.',
            'A function that both returns a value and mutates its argument is hard to reuse and harder to test. Pick one.',
          ],
          proTip:
            'Add type hints to function signatures even in small scripts. They are the cheapest documentation available and your editor turns them into autocomplete.',
          resources: [
            {
              type: 'documentation',
              title: 'Defining functions',
              description: 'Arguments, defaults, and scope rules.',
              url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions',
            },
          ],
        },
        {
          title: 'Modules, packages, and virtual environments',
          videoQuery: 'python virtual environment venv pip packages tutorial',
          keyPoints: [
            'Split a script into importable modules',
            'Isolate dependencies per project',
            'Pin what you installed so it reproduces',
          ],
          notes: [
            '## One environment per project, always',
            'Installing packages globally means every project shares one set of versions, and the first version conflict breaks something you were not working on. A virtual environment gives each project its own isolated set.',
            'A module is just a file, and a package a directory of them. The import guard that checks whether a file is being run directly is what lets the same file work as both a script and an importable module.',
            'Record your dependencies in a file and pin versions for anything you will run again. An unpinned environment reproduces differently every month.',
          ],
          proTip:
            'Create the environment before installing the first package. Retrofitting one after a global install means untangling which packages your project actually needs.',
          resources: [
            {
              type: 'documentation',
              title: 'Virtual environments',
              description: 'Creating and using venv.',
              url: 'https://docs.python.org/3/tutorial/venv.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Working with Data Structures',
      summary:
        'Picking the container that makes your problem easy, and iterating over data too large to hold at once.',
      lessons: [
        {
          title: 'Lists, tuples, and slicing',
          videoQuery: 'python list slicing tuples tutorial',
          keyPoints: [
            'Slice a sequence without a loop',
            'Choose a tuple when the shape is fixed',
            'Copy a list instead of aliasing it',
          ],
          notes: [
            '## Slicing is the most underused syntax in Python',
            'A slice takes a start, a stop, and a step, and any of them can be omitted or negative. Reversing, taking every second element, or dropping the first and last item are all one expression.',
            'A slice of a list is a new list, which makes it the shortest way to copy one — and a reminder that plain assignment does not copy anything.',
            'Tuples are for fixed-length records where position has meaning: a coordinate, a database row. Lists are for variable-length collections of like things.',
          ],
          proTip:
            'Reach for a named tuple or a dataclass once a tuple grows past two or three fields. Nobody remembers what index three meant a month later.',
          resources: [
            {
              type: 'documentation',
              title: 'Data structures',
              description: 'Lists, tuples, and sequence operations.',
              url: 'https://docs.python.org/3/tutorial/datastructures.html',
            },
          ],
        },
        {
          title: 'Dictionaries and sets',
          videoQuery: 'python dictionary set operations tutorial',
          keyPoints: [
            'Look up by key instead of scanning a list',
            'Use a set for membership and deduplication',
            'Group records with a default dictionary',
          ],
          notes: [
            '## Stop scanning lists',
            'Checking membership in a list walks it from the start; checking membership in a set or a dict is effectively constant time. Converting a lookup list to a set is often the entire fix for a script that got slow as its input grew.',
            'Dictionaries preserve insertion order and are the natural shape for records keyed by id. Grouping is the most common operation you will write, and a default dictionary removes the does-this-key-exist boilerplate.',
            'Set algebra — union, intersection, difference — answers which-items-are-in-both questions directly, without any loop at all.',
          ],
          proTip:
            'Use get with a default rather than checking for a key first. It is one operation instead of two and it reads as the question you were asking.',
          resources: [
            {
              type: 'documentation',
              title: 'collections',
              description: 'defaultdict, Counter, and friends.',
              url: 'https://docs.python.org/3/library/collections.html',
            },
          ],
        },
        {
          title: 'Iterators and generators',
          videoQuery: 'python generators yield iterators explained',
          keyPoints: [
            'Process a large file without loading it',
            'Write a generator with yield',
            'Understand that a generator is consumed once',
          ],
          notes: [
            '## Streaming instead of holding',
            'A generator produces values one at a time as they are asked for. Reading a multi-gigabyte log becomes possible on a laptop, because only the current line is ever in memory.',
            'Writing one is a matter of yielding instead of appending to a list and returning it. Generators also compose: piping one into another builds a processing chain that still streams end to end.',
            'The catch is that a generator is exhausted after one pass. Iterating it twice silently gives you nothing the second time, which is a genuinely confusing bug the first time you meet it.',
          ],
          proTip:
            'If you need the values more than once, materialise the generator into a list deliberately. Discovering it was consumed halfway through a pipeline is much harder to debug.',
          resources: [
            {
              type: 'documentation',
              title: 'Generators',
              description: 'yield, generator expressions, and itertools.',
              url: 'https://docs.python.org/3/howto/functional.html#generators',
            },
          ],
        },
      ],
    },
    {
      title: 'Files, APIs, and the Standard Library',
      summary:
        'Getting data in and out of your program, and the batteries that ship with Python.',
      lessons: [
        {
          title: 'Reading and writing CSV and JSON',
          videoQuery: 'python csv json file handling tutorial',
          keyPoints: [
            'Read a CSV into dictionaries',
            'Handle encodings and delimiters',
            'Serialise data to JSON safely',
          ],
          notes: [
            '## The two formats you will meet every week',
            'Reading a CSV as dictionaries rather than positional rows makes downstream code refer to column names, so an inserted column does not silently shift every field.',
            'Encoding is where real CSVs go wrong. Files exported from spreadsheets frequently are not UTF-8, and the resulting decode error is easier to diagnose than the mojibake you get by ignoring it.',
            'JSON handles nested structures but only knows a few types. Dates and decimals need an explicit conversion, and floats will not round-trip a currency amount exactly.',
          ],
          proTip:
            'Always open files with a context manager and an explicit encoding. Relying on the platform default is how a script that works on your machine fails in the container.',
          resources: [
            {
              type: 'documentation',
              title: 'csv module',
              description: 'Reading and writing delimited files.',
              url: 'https://docs.python.org/3/library/csv.html',
            },
          ],
        },
        {
          title: 'Calling HTTP APIs',
          videoQuery: 'python requests library api tutorial error handling',
          keyPoints: [
            'Send a request and read the response',
            'Check the status before parsing the body',
            'Retry transient failures with backoff',
          ],
          notes: [
            '## The network is not a function call',
            'Parsing the body before checking the status is the most common mistake: an error page is not JSON, and the traceback you get points at the parser rather than the failed request.',
            'Set a timeout on every request. Without one, a hung server hangs your script indefinitely, and there is no default that saves you.',
            'Transient failures deserve a retry with exponential backoff; a client error does not. Retrying a bad request just sends the same wrong thing repeatedly.',
            '- Check the status code first',
            '- Set a timeout on every call',
            '- Retry only on transient failures, with backoff',
          ],
          proTip:
            'Keep credentials in environment variables, not in the script. A key committed to version control has to be rotated even after you delete the line.',
          resources: [
            {
              type: 'documentation',
              title: 'Requests',
              description: 'Making HTTP requests in Python.',
              url: 'https://requests.readthedocs.io/',
            },
          ],
        },
        {
          title: 'Dates, paths, and the standard library',
          videoQuery: 'python datetime pathlib standard library tutorial',
          keyPoints: [
            'Handle time zones without guessing',
            'Build file paths that work anywhere',
            'Reach for the standard library first',
          ],
          notes: [
            '## Most of what you need already ships with Python',
            'Datetimes come in naive and aware flavours, and mixing them raises an error at the worst moment. Store and compute in UTC, convert to a local zone only for display, and the entire category of bug disappears.',
            'Path objects replace string concatenation for filesystem work. Joining, extension changes, and existence checks all become methods, and the result is correct on every platform.',
            'Before adding a dependency, check the standard library. Grouping, permutations, temporary files, and configuration parsing are all already there.',
          ],
          proTip:
            'Never build a path by concatenating strings with a slash. It works until the first Windows machine, and then it fails in a way that looks like a missing file.',
          resources: [
            {
              type: 'documentation',
              title: 'pathlib',
              description: 'Object-oriented filesystem paths.',
              url: 'https://docs.python.org/3/library/pathlib.html',
            },
          ],
        },
      ],
    },
    {
      title: 'Analysing Data with pandas',
      summary:
        'Loading a real dataset, reshaping it, and getting to a defensible answer.',
      lessons: [
        {
          title: 'DataFrames and Series',
          videoQuery: 'pandas dataframe series basics tutorial',
          keyPoints: [
            'Load a dataset and inspect its shape',
            'Select rows and columns predictably',
            'Fix dtypes before analysing',
          ],
          notes: [
            '## Look at the data before you trust it',
            'A DataFrame is a table of Series, each with its own dtype. The first thing to do after loading is inspect the dtypes and the null counts, because a numeric column read as text will silently produce nonsense averages later.',
            'Label-based and position-based selection are separate accessors on purpose. Mixing them is the source of most confusing indexing errors, especially after a filter has left a non-contiguous index.',
            'Parse dates at load time rather than converting afterwards. It is one argument and it saves an entire category of comparison bugs.',
          ],
          proTip:
            'Reset the index after filtering if you are about to select by position. A filtered frame keeps the original labels, and position and label stop agreeing.',
          resources: [
            {
              type: 'documentation',
              title: 'pandas getting started',
              description: 'DataFrame and Series basics.',
              url: 'https://pandas.pydata.org/docs/getting_started/index.html',
            },
          ],
        },
        {
          title: 'Filtering, grouping, and aggregation',
          videoQuery: 'pandas groupby aggregation filtering tutorial',
          keyPoints: [
            'Filter with boolean masks',
            'Group and aggregate in one expression',
            'Handle missing values on purpose',
          ],
          notes: [
            '## Split, apply, combine',
            'Almost every analytical question is the same shape: split the rows into groups, apply an aggregation to each, and combine the results. Once you see it, group-by stops being syntax and becomes the tool you reach for.',
            'Boolean masks compose with and-or operators, which keeps a multi-condition filter as one readable expression rather than a chain of intermediate frames.',
            'Missing values need a decision, not a default. Dropping them, filling them, or treating them as a category are all defensible; ignoring the question is not, because different operations skip nulls differently.',
          ],
          proTip:
            'Aggregate with named outputs so the resulting columns are named for what they mean. Auto-generated multi-level column names are painful to work with downstream.',
          resources: [
            {
              type: 'documentation',
              title: 'Group by',
              description: 'The split-apply-combine pattern.',
              url: 'https://pandas.pydata.org/docs/user_guide/groupby.html',
            },
          ],
        },
        {
          title: 'Plotting results',
          videoQuery: 'pandas matplotlib plotting data visualization tutorial',
          keyPoints: [
            'Pick a chart type that fits the question',
            'Label axes and units',
            'Export a figure at a usable size',
          ],
          notes: [
            '## The chart is an argument',
            'The chart type follows the question. Comparing categories is a bar chart, showing change over time is a line, and showing a relationship between two measures is a scatter. A pie chart answers almost nothing.',
            'Unlabelled axes are the most common flaw in analysis output. A reader who cannot tell whether the y axis is counts or percentages cannot evaluate your conclusion.',
            'Save figures at an explicit size and resolution. A chart that looks fine in a notebook is frequently unreadable when pasted into a document.',
          ],
          proTip:
            'Start the y axis at zero for bar charts. A truncated axis exaggerates differences, and reviewers who notice will stop trusting the rest of the analysis.',
          resources: [
            {
              type: 'documentation',
              title: 'pandas visualization',
              description: 'Plotting directly from a DataFrame.',
              url: 'https://pandas.pydata.org/docs/user_guide/visualization.html',
            },
          ],
        },
      ],
    },
  ],
}
