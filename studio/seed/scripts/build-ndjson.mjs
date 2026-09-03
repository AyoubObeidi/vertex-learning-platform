/**
 * Builds seed/dist/vertex-seed.ndjson from the authored content.
 *
 *   node seed/scripts/build-ndjson.mjs
 *   node seed/scripts/build-ndjson.mjs --skip-image-check
 *
 * Every remote image URL is checked before the file is written, so a dead link
 * fails here rather than halfway through an import that has already created
 * documents. Exits non-zero if any invariant in ../lib/validate.mjs is broken.
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {categories} from '../content/categories.mjs'
import {courses} from '../content/courses.mjs'
import {instructors} from '../content/instructors.mjs'
import {buildDocuments} from '../lib/build.mjs'
import {formatDuration} from '../lib/text.mjs'
import {validateDocuments} from '../lib/validate.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const videosPath = resolve(here, '../videos.json')
const outputPath = resolve(here, '../dist/vertex-seed.ndjson')

const SKIP_IMAGE_CHECK = process.argv.includes('--skip-image-check')

/** Collect the remote asset URLs the importer will have to fetch. */
function imageUrls(documents) {
  const urls = new Set()
  const walk = (value) => {
    if (Array.isArray(value)) return value.forEach(walk)
    if (value && typeof value === 'object') {
      if (typeof value._sanityAsset === 'string') {
        urls.add(value._sanityAsset.replace(/^image@/, ''))
      }
      Object.values(value).forEach(walk)
    }
  }
  walk(documents)
  return [...urls]
}

async function checkImages(urls) {
  const broken = []
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {method: 'HEAD', redirect: 'follow'})
        if (!response.ok) broken.push(`${url} → ${response.status}`)
      } catch (error) {
        broken.push(`${url} → ${error.message}`)
      }
    }),
  )
  return broken
}

async function main() {
  let videos
  try {
    videos = JSON.parse(await readFile(videosPath, 'utf8'))
  } catch {
    console.error('Missing seed/videos.json. Run: npm run seed:videos')
    process.exit(1)
  }

  const {documents, rollup} = buildDocuments({categories, instructors, courses, videos})

  const problems = validateDocuments(documents)
  if (problems.length > 0) {
    console.error(`\n${problems.length} consistency problem(s):`)
    for (const problem of problems) console.error(`  ✗ ${problem}`)
    process.exit(1)
  }

  if (!SKIP_IMAGE_CHECK) {
    const urls = imageUrls(documents)
    process.stdout.write(`Checking ${urls.length} image URLs … `)
    const broken = await checkImages(urls)
    if (broken.length > 0) {
      console.error('\nUnreachable images:')
      for (const entry of broken) console.error(`  ✗ ${entry}`)
      process.exit(1)
    }
    console.log('all reachable')
  }

  await mkdir(dirname(outputPath), {recursive: true})
  await writeFile(outputPath, documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n')

  const counts = documents.reduce((totals, doc) => {
    totals[doc._type] = (totals[doc._type] ?? 0) + 1
    return totals
  }, {})

  console.log('\nCourse rollup (durations summed from lesson durations):\n')
  for (const course of rollup) {
    console.log(
      `  ${course.title} — ${course.modules.length} modules, ${course.lessons} lessons, ${formatDuration(course.durationSeconds)}`,
    )
    for (const [index, courseModule] of course.modules.entries()) {
      console.log(
        `    ${index + 1}. ${courseModule.title} — ${courseModule.lessons} lessons, ${formatDuration(courseModule.durationSeconds)}`,
      )
    }
  }

  console.log(
    `\n${documents.length} documents ` +
      `(${Object.entries(counts).map(([type, count]) => `${count} ${type}`).join(', ')})`,
  )
  console.log(`Wrote ${outputPath}`)
}

await main()
