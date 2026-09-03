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
 * The course's modules come back as ordered lists of lesson ids. GROQ has no
 * index-of operator, so the caller derives the "Lesson 5.1" label by finding
 * this lesson's `_id` in `course.modules[].lessonIds` — module position + 1,
 * lesson position + 1.
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
      coverImage{${imageFragment}},
      instructor->{_id, name, "slug": slug.current, photo{${imageFragment}}},
      modules[]{
        _key,
        title,
        "lessonIds": lessons[]._ref
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
