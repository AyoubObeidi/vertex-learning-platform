import {defineQuery} from 'next-sanity'

/**
 * Every read the pages perform. Queries are wrapped in `defineQuery` so TypeGen
 * generates a result type for each, and every name is unique — duplicates would
 * silently overwrite each other's types.
 *
 * Conventions here:
 * - The numbers the UI shows (module count, lesson count, course duration,
 *   "Lesson 5.1") are derived from array order and `count()`, never stored.
 * - A lesson does not store its parent course; it is resolved with a reverse
 *   reference.
 * - `_key` is projected on every array member so React keys and future Visual
 *   Editing overlays work.
 */

const imageFragment = /* groq */ `
  asset->{_id, url, metadata{lqip, dimensions}},
  hotspot,
  crop,
  alt
`

/** Shared shape for a course as it appears in a list or on a card. */
const courseCardFragment = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  level,
  price,
  popular,
  studentCount,
  coverImage{${imageFragment}},
  instructor->{
    _id,
    name,
    "slug": slug.current,
    photo{${imageFragment}}
  },
  category->{_id, title, "slug": slug.current},
  "moduleCount": count(modules),
  "lessonCount": count(modules[].lessons[]),
  "durationSeconds": math::sum(modules[].lessons[]->durationSeconds)
`

/* -------------------------------------------------------------------------- */
/* Static params                                                              */
/* -------------------------------------------------------------------------- */

export const COURSE_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current)]{"slug": slug.current}
`)

export const LESSON_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && defined(slug.current)]{"slug": slug.current}
`)

export const INSTRUCTOR_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "instructor" && defined(slug.current)]{"slug": slug.current}
`)

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export const COURSES_CATALOG_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current)]
    | order(popular desc, title asc){
      ${courseCardFragment}
    }
`)

/**
 * The three courses an author has flagged popular, for the home page. Filtered
 * on the flag rather than padded from the rest of the catalog — padding would
 * make the flag meaningless.
 */
export const POPULAR_COURSES_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current) && popular == true]
    | order(studentCount desc, title asc)[0...3]{
      ${courseCardFragment}
    }
`)

export const COURSES_BY_CATEGORY_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && defined(slug.current) && category->slug.current == $category]
    | order(popular desc, title asc){
      ${courseCardFragment}
    }
`)

export const CATEGORIES_QUERY = defineQuery(/* groq */ `
  *[_type == "category" && defined(slug.current)] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    "courseCount": count(*[_type == "course" && references(^._id)])
  }
`)

/* -------------------------------------------------------------------------- */
/* Course detail                                                              */
/* -------------------------------------------------------------------------- */

export const COURSE_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && slug.current == $slug][0]{
    ${courseCardFragment},
    learningOutcomes[]{_key, icon, title, description},
    instructor->{
      _id,
      name,
      "slug": slug.current,
      expertise,
      bio,
      photo{${imageFragment}}
    },
    modules[]{
      _key,
      title,
      summary,
      "durationSeconds": math::sum(lessons[]->durationSeconds),
      lessons[]->{
        _id,
        title,
        "slug": slug.current,
        durationSeconds,
        freePreview,
        poster{${imageFragment}}
      }
    }
  }
`)

/* -------------------------------------------------------------------------- */
/* Lesson detail                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The lesson plus the course that uses it, resolved by reverse reference since
 * a lesson does not store its parent.
 *
 * The whole course outline comes back with it, because the lesson page renders
 * the course sidebar: every module, every module's lessons, and the durations
 * the sidebar shows. GROQ has no index-of operator, so the caller derives the
 * "Lesson 5.1" label and the previous/next links by finding this lesson's `_id`
 * in `course.modules[].lessons[]._id` — module position + 1, lesson position + 1.
 */
export const LESSON_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    durationSeconds,
    freePreview,
    studentCount,
    keyPoints,
    notes,
    proTip,
    poster{${imageFragment}},
    resources[]{_key, type, title, description, url},
    "course": *[_type == "course" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current,
      level,
      coverImage{${imageFragment}},
      instructor->{_id, name, "slug": slug.current, photo{${imageFragment}}},
      modules[]{
        _key,
        title,
        "durationSeconds": math::sum(lessons[]->durationSeconds),
        lessons[]->{
          _id,
          title,
          "slug": slug.current,
          durationSeconds,
          freePreview
        }
      }
    }
  }
`)

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the lessons the search agent picked, by id.
 *
 * This is what grounds search (CLAUDE.md section 11). The model only ever
 * returns lesson ids and a one-line description; every field a result card
 * shows — title, course, label, duration, thumbnail — is read here, from the
 * dataset. A lesson the model invented has no id that resolves, so it cannot
 * reach the response.
 *
 * The course outline comes back id-only: enough to derive "Lesson 5.1" and the
 * module title by array position, and nothing more. `notes` is projected solely
 * so `deriveLessonDescription` has a fallback when the model's description is
 * unusable — it is never sent to the model and never returned to the client.
 */
export const LESSONS_BY_IDS_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && _id in $ids]{
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    durationSeconds,
    freePreview,
    keyPoints,
    notes,
    poster{${imageFragment}},
    "course": *[_type == "course" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current,
      coverImage{${imageFragment}},
      modules[]{
        _key,
        title,
        lessons[]->{_id}
      }
    }
  }
`)

/* -------------------------------------------------------------------------- */
/* Instructor                                                                 */
/* -------------------------------------------------------------------------- */

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "instructor" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    expertise,
    bio,
    photo{${imageFragment}},
    "courses": *[_type == "course" && references(^._id)]
      | order(popular desc, title asc){
        ${courseCardFragment}
      }
  }
`)
