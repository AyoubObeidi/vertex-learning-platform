/**
 * Turns the authored content specs into the Sanity documents the NDJSON import
 * expects.
 *
 * Two conventions worth knowing before reading this:
 *
 * - `_id`s are deterministic and human readable (`course.docker-essentials`).
 *   References inside one NDJSON file must point at ids that exist in that
 *   file, and stable ids make `sanity dataset import --replace` re-runnable
 *   instead of duplicating the catalog on every run.
 * - Nothing the frontend derives is stored. Module and course durations,
 *   module and lesson counts, and the "Lesson 5.1" labels are all computed in
 *   GROQ from array order — see web/sanity/lib/queries.ts.
 */
import {keyFor, slugField, slugify, toPortableText} from './text.mjs'

/** Remote images are fetched by the importer and become real Sanity assets. */
function imageField(url, alt) {
  return {_type: 'image', _sanityAsset: `image@${url}`, alt}
}

function instructorDoc(spec) {
  return {
    _id: `instructor.${spec.key}`,
    _type: 'instructor',
    name: spec.name,
    slug: slugField(spec.name),
    photo: imageField(spec.photo, spec.photoAlt),
    expertise: spec.expertise,
    bio: toPortableText(spec.bio, `instructor.${spec.key}.bio`),
  }
}

function categoryDoc(spec) {
  return {
    _id: `category.${spec.key}`,
    _type: 'category',
    title: spec.title,
    slug: slugField(spec.title),
    description: spec.description,
  }
}

/**
 * Lesson student counts decay through the course, which is both realistic and
 * what keeps the "never above the course total, never increasing" invariant
 * true without anyone hand-authoring 135 numbers.
 */
function lessonStudentCount(courseStudentCount, position, total) {
  const retention = 1 - 0.55 * (position / Math.max(total - 1, 1))
  return Math.round((courseStudentCount * retention) / 10) * 10
}

function lessonDoc(spec, context) {
  const video = context.videos[slugify(spec.title)]
  if (!video) {
    throw new Error(
      `No video mapped for lesson "${spec.title}". Run: npm run seed:videos`,
    )
  }

  const id = `lesson.${slugify(spec.title)}`
  return {
    _id: id,
    _type: 'lesson',
    title: spec.title,
    slug: slugField(spec.title),
    videoUrl: video.url,
    durationSeconds: video.durationSeconds,
    freePreview: context.freePreview,
    studentCount: lessonStudentCount(
      context.courseStudentCount,
      context.position,
      context.totalLessons,
    ),
    keyPoints: spec.keyPoints,
    notes: toPortableText(spec.notes, `${id}.notes`),
    proTip: spec.proTip,
    resources: (spec.resources ?? []).map((resource, index) => ({
      _type: 'lessonResource',
      _key: keyFor(id, 'resource', index),
      type: resource.type,
      title: resource.title,
      description: resource.description,
      url: resource.url,
    })),
  }
}

function courseDoc(spec) {
  const id = `course.${spec.key}`
  return {
    _id: id,
    _type: 'course',
    title: spec.title,
    slug: slugField(spec.title),
    summary: spec.summary,
    coverImage: imageField(spec.coverImage, spec.coverAlt),
    level: spec.level,
    price: spec.price,
    popular: spec.popular,
    studentCount: spec.studentCount,
    learningOutcomes: spec.learningOutcomes.map((outcome, index) => ({
      _type: 'learningOutcome',
      _key: keyFor(id, 'outcome', index),
      icon: outcome.icon,
      title: outcome.title,
      description: outcome.description,
    })),
    instructor: {_type: 'reference', _ref: `instructor.${spec.instructorKey}`},
    category: {_type: 'reference', _ref: `category.${spec.categoryKey}`},
    modules: spec.modules.map((courseModule, moduleIndex) => ({
      _type: 'courseModule',
      _key: keyFor(id, 'module', moduleIndex),
      title: courseModule.title,
      summary: courseModule.summary,
      lessons: courseModule.lessons.map((lesson, lessonIndex) => ({
        _type: 'reference',
        _key: keyFor(id, 'module', moduleIndex, 'lesson', lessonIndex),
        _ref: `lesson.${slugify(lesson.title)}`,
      })),
    })),
  }
}

/**
 * @returns every document to import, plus a per-course rollup for the build
 *   report. The rollup sums lesson durations the same way the catalog query
 *   does, so a mismatch between the two shows up at build time.
 */
export function buildDocuments({categories, instructors, courses, videos}) {
  const documents = []
  const rollup = []

  for (const spec of categories) documents.push(categoryDoc(spec))
  for (const spec of instructors) documents.push(instructorDoc(spec))

  for (const spec of courses) {
    const totalLessons = spec.modules.reduce(
      (total, courseModule) => total + courseModule.lessons.length,
      0,
    )

    let position = 0
    const moduleRollup = []

    for (const [moduleIndex, courseModule] of spec.modules.entries()) {
      let moduleSeconds = 0
      for (const lesson of courseModule.lessons) {
        const doc = lessonDoc(lesson, {
          videos,
          courseStudentCount: spec.studentCount,
          position,
          totalLessons,
          // The first lesson of the first module is the free preview. It is a
          // label only and grants no access — CLAUDE.md section 7.
          freePreview: moduleIndex === 0 && position === 0,
        })
        documents.push(doc)
        moduleSeconds += doc.durationSeconds
        position++
      }
      moduleRollup.push({
        title: courseModule.title,
        lessons: courseModule.lessons.length,
        durationSeconds: moduleSeconds,
      })
    }

    documents.push(courseDoc(spec))
    rollup.push({
      title: spec.title,
      modules: moduleRollup,
      lessons: totalLessons,
      durationSeconds: moduleRollup.reduce((total, m) => total + m.durationSeconds, 0),
    })
  }

  return {documents, rollup}
}
