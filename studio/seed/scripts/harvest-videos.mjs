/**
 * One-off tooling: find a real, unique, on-topic YouTube video for every seed
 * lesson and freeze the result in seed/videos.json.
 *
 * This never runs in the request path and the seed build does not depend on the
 * network — it reads the committed JSON. Re-run it only to refresh the mapping:
 *
 *   node seed/scripts/harvest-videos.mjs            # fill in missing lessons
 *   node seed/scripts/harvest-videos.mjs --refresh  # re-harvest everything
 *
 * How it works: YouTube's search results page embeds its data as a JSON blob in
 * the HTML. We pull videoId, title, and duration out of that blob, skip videos
 * already claimed by another lesson, and confirm the pick is publicly
 * embeddable through the public oEmbed endpoint before keeping it.
 */
import {readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {courses} from '../content/courses.mjs'
import {durationToSeconds, slugify} from '../lib/text.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(here, '../videos.json')

const REFRESH = process.argv.includes('--refresh')
const DELAY_MS = 900
const MAX_CANDIDATES = 12
/** Ignore results that are almost certainly clips or multi-hour compilations. */
const MIN_SECONDS = 120
const MAX_SECONDS = 4 * 60 * 60

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/** Every lesson in the seed, flattened, with the query to search for. */
function lessonTargets() {
  const targets = []
  for (const course of courses) {
    for (const courseModule of course.modules) {
      for (const lesson of courseModule.lessons) {
        targets.push({
          key: slugify(lesson.title),
          lessonTitle: lesson.title,
          courseTitle: course.title,
          query: lesson.videoQuery || `${lesson.title} ${course.title} tutorial`,
        })
      }
    }
  }
  return targets
}

/**
 * Walk an arbitrarily nested object and collect every videoRenderer, which is
 * the shape YouTube uses for a search result. Doing it structurally rather than
 * by a fixed path keeps this working when the surrounding layout changes.
 */
function collectVideoRenderers(node, found = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, found)
    return found
  }
  if (node && typeof node === 'object') {
    if (node.videoRenderer) found.push(node.videoRenderer)
    for (const value of Object.values(node)) collectVideoRenderers(value, found)
  }
  return found
}

/** Pull the ytInitialData JSON blob out of a search results page. */
function extractInitialData(html) {
  const marker = 'var ytInitialData = '
  const start = html.indexOf(marker)
  if (start === -1) return undefined
  let index = start + marker.length
  // Scan forward tracking brace depth so we stop at the end of the object
  // rather than at the first brace-looking character inside a string.
  let depth = 0
  let inString = false
  let escaped = false
  const from = index
  for (; index < html.length; index++) {
    const char = html[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(from, index + 1))
        } catch {
          return undefined
        }
      }
    }
  }
  return undefined
}

async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`
  const response = await fetch(url, {
    headers: {'user-agent': USER_AGENT, 'accept-language': 'en-US,en;q=0.9'},
  })
  if (!response.ok) throw new Error(`search failed: ${response.status}`)
  const data = extractInitialData(await response.text())
  if (!data) return []

  return collectVideoRenderers(data)
    .map((renderer) => {
      const title =
        renderer.title?.runs?.[0]?.text ?? renderer.title?.simpleText ?? undefined
      const lengthText =
        renderer.lengthText?.simpleText ??
        renderer.lengthText?.accessibility?.accessibilityData?.label
      return {
        videoId: renderer.videoId,
        title,
        channel: renderer.ownerText?.runs?.[0]?.text,
        durationSeconds: durationToSeconds(lengthText),
      }
    })
    .filter((candidate) => candidate.videoId && candidate.title)
    .slice(0, MAX_CANDIDATES)
}

/** A public video answers oEmbed; a private, deleted, or blocked one does not. */
async function isPlayable(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`
  try {
    const response = await fetch(url, {headers: {'user-agent': USER_AGENT}})
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  const targets = lessonTargets()

  /** @type {Record<string, {videoId: string, url: string, title: string, channel?: string, durationSeconds: number, query: string}>} */
  let existing = {}
  if (!REFRESH) {
    try {
      existing = JSON.parse(await readFile(outputPath, 'utf8'))
    } catch {
      existing = {}
    }
  }

  const claimed = new Set(Object.values(existing).map((entry) => entry.videoId))
  const missing = []
  let harvested = 0

  for (const [index, target] of targets.entries()) {
    if (existing[target.key]) continue

    process.stdout.write(
      `[${index + 1}/${targets.length}] ${target.lessonTitle} … `,
    )
    let candidates = []
    try {
      candidates = await searchYouTube(target.query)
    } catch (error) {
      process.stdout.write(`search error (${error.message})\n`)
    }

    let picked
    for (const candidate of candidates) {
      if (claimed.has(candidate.videoId)) continue
      const seconds = candidate.durationSeconds
      if (!seconds || seconds < MIN_SECONDS || seconds > MAX_SECONDS) continue
      if (!(await isPlayable(candidate.videoId))) continue
      picked = candidate
      break
    }

    if (!picked) {
      process.stdout.write('no candidate\n')
      missing.push(target)
    } else {
      claimed.add(picked.videoId)
      existing[target.key] = {
        videoId: picked.videoId,
        url: `https://www.youtube.com/watch?v=${picked.videoId}`,
        title: picked.title,
        channel: picked.channel,
        durationSeconds: picked.durationSeconds,
        query: target.query,
      }
      harvested++
      process.stdout.write(`${picked.videoId} — ${picked.title}\n`)
    }

    await sleep(DELAY_MS)
  }

  // Sort keys so the committed file has a stable diff.
  const sorted = Object.fromEntries(
    Object.keys(existing)
      .sort()
      .map((key) => [key, existing[key]]),
  )
  await writeFile(outputPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')

  console.log(`\nHarvested ${harvested} new, ${Object.keys(sorted).length} total.`)
  if (missing.length > 0) {
    console.log(`\n${missing.length} lesson(s) still unmapped:`)
    for (const target of missing) {
      console.log(`  - ${target.courseTitle} / ${target.lessonTitle}`)
    }
    console.log('Re-run to retry, or add an entry to videos.json by hand.')
    process.exitCode = 1
  }
}

await main()
