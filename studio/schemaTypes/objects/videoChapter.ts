import {ClockIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/** Seconds to "4:32" / "1:04:32", the shape a player shows. */
export function formatTimestamp(totalSeconds?: number): string {
  if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds)) return '0:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const paddedSeconds = String(seconds).padStart(2, '0')
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
  return `${minutes}:${paddedSeconds}`
}

/**
 * One entry in a video's table of contents.
 *
 * Chapter labels are the clean, authored-quality half of a video document:
 * search matches these first and only falls back to transcript chunks when no
 * chapter fits (CLAUDE.md section 7).
 */
export const videoChapter = defineType({
  name: 'videoChapter',
  title: 'Chapter',
  type: 'object',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'startSeconds',
      title: 'Start (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {label: 'label', startSeconds: 'startSeconds'},
    prepare({label, startSeconds}) {
      return {title: label, subtitle: formatTimestamp(startSeconds)}
    },
  },
})
