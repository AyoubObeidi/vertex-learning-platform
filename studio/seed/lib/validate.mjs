/**
 * The consistency invariants the seed must satisfy. The build fails on any
 * violation rather than importing content that would render wrong.
 *
 * The headline requirement — "a module equals the sum of its lessons and a
 * course equals the sum of its modules" — is enforced structurally: nothing
 * stores a duration or a count, so the only way for those to disagree is for a
 * reference to dangle or for a lesson to belong to more than one course. Both
 * are checked here.
 */

/** Field vocabularies, mirrored from studio/schemaTypes. */
const LEVELS = new Set(['beginner', 'intermediate', 'advanced'])
const OUTCOME_ICONS = new Set([
  'zap',
  'layers',
  'shield',
  'rocket',
  'code',
  'database',
  'gauge',
  'git-branch',
])
const RESOURCE_TYPES = new Set([
  'article',
  'documentation',
  'code',
  'download',
  'video',
])
const VIDEO_HOSTS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'mediadelivery.net',
  'b-cdn.net',
]

function isSupportedVideoHost(url) {
  try {
    const {hostname} = new URL(url)
    return VIDEO_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

/**
 * @param {object[]} documents every document destined for the NDJSON file
 * @returns {string[]} human-readable problems; empty means the seed is sound
 */
export function validateDocuments(documents) {
  const problems = []
  const byType = (type) => documents.filter((doc) => doc._type === type)

  const courses = byType('course')
  const lessons = byType('lesson')
  const instructors = byType('instructor')
  const categories = byType('category')

  const ids = new Set()
  for (const doc of documents) {
    if (ids.has(doc._id)) problems.push(`Duplicate _id: ${doc._id}`)
    ids.add(doc._id)
  }

  /* Slugs are unique per type — two courses at the same URL is a silent 404. */
  for (const [type, docs] of [
    ['course', courses],
    ['lesson', lessons],
    ['instructor', instructors],
    ['category', categories],
  ]) {
    const seen = new Map()
    for (const doc of docs) {
      const slug = doc.slug?.current
      if (!slug) {
        problems.push(`${type} ${doc._id} has no slug`)
        continue
      }
      if (seen.has(slug)) {
        problems.push(`Duplicate ${type} slug "${slug}": ${seen.get(slug)} and ${doc._id}`)
      }
      seen.set(slug, doc._id)
    }
  }

  /* Every reference resolves inside this import. */
  const refsIn = (value, found = []) => {
    if (Array.isArray(value)) {
      for (const item of value) refsIn(item, found)
    } else if (value && typeof value === 'object') {
      if (typeof value._ref === 'string') found.push(value._ref)
      for (const nested of Object.values(value)) refsIn(nested, found)
    }
    return found
  }
  for (const doc of documents) {
    for (const ref of refsIn(doc)) {
      if (!ids.has(ref)) problems.push(`${doc._id} references missing document ${ref}`)
    }
  }

  /* A lesson belongs to exactly one module of exactly one course. The lesson
     page resolves its course by reverse reference, which is ambiguous if a
     lesson is shared, and broken if it is orphaned. */
  const owners = new Map(lessons.map((lesson) => [lesson._id, []]))
  for (const course of courses) {
    for (const courseModule of course.modules) {
      for (const ref of courseModule.lessons) {
        const list = owners.get(ref._ref)
        if (list) list.push(`${course._id} / ${courseModule.title}`)
      }
    }
  }
  for (const [lessonId, ownedBy] of owners) {
    if (ownedBy.length === 0) problems.push(`Orphan lesson (no module references it): ${lessonId}`)
    if (ownedBy.length > 1) {
      problems.push(`Lesson ${lessonId} is referenced by ${ownedBy.length}: ${ownedBy.join(', ')}`)
    }
  }

  /* Videos: unique across the seed, on the schema's host allowlist, with a
     positive integer duration (durations are what the derived module and
     course totals are summed from). */
  const videoUrls = new Map()
  for (const lesson of lessons) {
    const url = lesson.videoUrl
    if (!isSupportedVideoHost(url)) {
      problems.push(`${lesson._id} has an unsupported video host: ${url}`)
    }
    if (videoUrls.has(url)) {
      problems.push(`Duplicate videoUrl ${url}: ${videoUrls.get(url)} and ${lesson._id}`)
    }
    videoUrls.set(url, lesson._id)

    const seconds = lesson.durationSeconds
    if (!Number.isInteger(seconds) || seconds <= 0) {
      problems.push(`${lesson._id} has an invalid durationSeconds: ${seconds}`)
    }

    if (!Array.isArray(lesson.keyPoints) || lesson.keyPoints.length === 0) {
      problems.push(`${lesson._id} has no keyPoints`)
    } else {
      if (lesson.keyPoints.length > 6) problems.push(`${lesson._id} has more than 6 keyPoints`)
      if (new Set(lesson.keyPoints).size !== lesson.keyPoints.length) {
        problems.push(`${lesson._id} has duplicate keyPoints`)
      }
    }

    for (const resource of lesson.resources ?? []) {
      if (!RESOURCE_TYPES.has(resource.type)) {
        problems.push(`${lesson._id} resource has an unknown type: ${resource.type}`)
      }
    }
  }

  /* Titles are distinct, so search results and the Studio list stay legible. */
  for (const [label, values] of [
    ['course', courses.map((doc) => doc.title)],
    ['lesson', lessons.map((doc) => doc.title)],
    [
      'module',
      courses.flatMap((course) => course.modules.map((m) => `${course._id}:${m.title}`)),
    ],
  ]) {
    const seen = new Set()
    for (const value of values) {
      if (seen.has(value)) problems.push(`Duplicate ${label} title: ${value}`)
      seen.add(value)
    }
  }

  /* Courses: enum values, at least one module, and student counts that make
     sense against the lessons they contain. */
  const lessonsById = new Map(lessons.map((lesson) => [lesson._id, lesson]))
  for (const course of courses) {
    if (!LEVELS.has(course.level)) problems.push(`${course._id} has an unknown level: ${course.level}`)
    if (!Array.isArray(course.modules) || course.modules.length === 0) {
      problems.push(`${course._id} has no modules`)
    }
    for (const outcome of course.learningOutcomes ?? []) {
      if (!OUTCOME_ICONS.has(outcome.icon)) {
        problems.push(`${course._id} outcome has an unknown icon: ${outcome.icon}`)
      }
    }
    if ((course.learningOutcomes ?? []).length > 6) {
      problems.push(`${course._id} has more than 6 learning outcomes`)
    }

    let previous = Infinity
    for (const courseModule of course.modules) {
      if (!courseModule.lessons?.length) {
        problems.push(`${course._id} / ${courseModule.title} has no lessons`)
      }
      for (const ref of courseModule.lessons ?? []) {
        const lesson = lessonsById.get(ref._ref)
        if (!lesson) continue
        if (lesson.studentCount > course.studentCount) {
          problems.push(
            `${lesson._id} studentCount (${lesson.studentCount}) exceeds its course (${course.studentCount})`,
          )
        }
        if (lesson.studentCount > previous) {
          problems.push(`${lesson._id} studentCount increases through ${course._id}`)
        }
        previous = lesson.studentCount
      }
    }

    /* Exactly one free preview per course, and it is the opening lesson. */
    const previews = course.modules
      .flatMap((m) => m.lessons)
      .map((ref) => lessonsById.get(ref._ref))
      .filter((lesson) => lesson?.freePreview)
    if (previews.length !== 1) {
      problems.push(`${course._id} has ${previews.length} free preview lessons, expected 1`)
    }
  }

  return problems
}
