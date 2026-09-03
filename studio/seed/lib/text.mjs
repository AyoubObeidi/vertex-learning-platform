/**
 * Text helpers for the seed builder.
 *
 * Everything here is deterministic: the same spec always produces the same
 * slugs, `_id`s, and Portable Text `_key`s, so re-running the seed replaces
 * documents in place instead of creating new ones.
 */

/** "Next.js for Production" -> "nextjs-for-production" */
export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+\+/g, 'pp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '')
}

/** A Sanity slug field value. */
export function slugField(value) {
  return {_type: 'slug', current: slugify(value)}
}

/**
 * A short, stable key. Portable Text spans and array members need a `_key`
 * that survives a re-run, so it is derived from the path, never random.
 */
export function keyFor(...parts) {
  const input = parts.join('|')
  // FNV-1a, plenty for uniqueness inside one document.
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36).padStart(7, '0').slice(0, 7)
}

/**
 * Plain authored text -> `blockContent` Portable Text.
 *
 * The input is an array of strings, each one a block. A leading marker picks
 * the style so the seed content can carry structure without hand-writing
 * Portable Text:
 *
 *   "## Heading"   -> h2
 *   "### Heading"  -> h3
 *   "- item"       -> bullet list item
 *   "1. item"      -> numbered list item
 *   "> quote"      -> blockquote
 *   anything else  -> normal paragraph
 *
 * Inline marks are deliberately not supported. Seed prose reads fine without
 * them, and parsing inline syntax would be a markdown pipeline in disguise —
 * CLAUDE.md section 7 keeps content structured, not markdown.
 */
export function toPortableText(blocks, scope) {
  return blocks.map((raw, index) => {
    const key = keyFor(scope, 'block', index)
    let text = raw
    let style = 'normal'
    let listItem
    let level

    if (text.startsWith('### ')) {
      style = 'h3'
      text = text.slice(4)
    } else if (text.startsWith('## ')) {
      style = 'h2'
      text = text.slice(3)
    } else if (text.startsWith('> ')) {
      style = 'blockquote'
      text = text.slice(2)
    } else if (text.startsWith('- ')) {
      listItem = 'bullet'
      level = 1
      text = text.slice(2)
    } else {
      const numbered = /^(\d+)\.\s+/.exec(text)
      if (numbered) {
        listItem = 'number'
        level = 1
        text = text.slice(numbered[0].length)
      }
    }

    const block = {
      _type: 'block',
      _key: key,
      style,
      markDefs: [],
      children: [{_type: 'span', _key: `${key}s`, text, marks: []}],
    }
    if (listItem) {
      block.listItem = listItem
      block.level = level
    }
    return block
  })
}

/** "12:34" or "1:02:03" -> seconds. Returns undefined for anything else. */
export function durationToSeconds(label) {
  if (typeof label !== 'string') return undefined
  const parts = label.trim().split(':').map((part) => Number(part))
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part))) {
    return undefined
  }
  return parts.reduce((total, part) => total * 60 + part, 0)
}

/** Seconds -> "18h 24m" / "12m 30s", for the build report only. */
export function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}
