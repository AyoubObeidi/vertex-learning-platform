import {PlayIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Supported video providers, per CLAUDE.md section 9. A URL from anywhere else
 * warns rather than blocks, so an author is never hard-stopped by a host we
 * have not listed yet.
 */
const SUPPORTED_VIDEO_HOSTS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'mediadelivery.net',
  'b-cdn.net',
]

/** Seconds to the "1h 04m" / "12m 30s" shape used in Studio previews. */
function formatDuration(totalSeconds?: number): string | undefined {
  if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds)) return undefined
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'video', title: 'Video'},
    {name: 'meta', title: 'Meta'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      group: 'video',
      description: 'YouTube, Vimeo, or Bunny. Played as a provider embed on the lesson page.',
      validation: (rule) => [
        rule
          .required()
          .uri({scheme: ['http', 'https']}),
        rule.custom((value) => {
          if (!value) return true
          try {
            const {hostname} = new URL(value)
            const supported = SUPPORTED_VIDEO_HOSTS.some(
              (host) => hostname === host || hostname.endsWith(`.${host}`),
            )
            return supported || 'Not a YouTube, Vimeo, or Bunny URL — playback may not work'
          } catch {
            return 'Must be a valid URL'
          }
        }).warning(),
      ],
    }),
    defineField({
      name: 'poster',
      title: 'Poster image',
      type: 'image',
      group: 'video',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required().warning('Alt text is important for accessibility'),
        }),
      ],
    }),
    defineField({
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'number',
      group: 'video',
      description: 'Stored in seconds. The frontend formats it for display.',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'freePreview',
      title: 'Free preview',
      type: 'boolean',
      group: 'meta',
      description: 'A label only. It does not grant or restrict access.',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      type: 'number',
      group: 'meta',
      description: 'Shown in the UI. Not derived from real enrolments.',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key points',
      type: 'array',
      group: 'content',
      description: 'The "in this lesson you will" list.',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.max(6).unique(),
    }),
    defineField({
      name: 'notes',
      type: 'blockContent',
      group: 'content',
    }),
    defineField({
      name: 'proTip',
      title: 'Pro tip',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'resources',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'lessonResource'})],
    }),
  ],
  preview: {
    select: {title: 'title', durationSeconds: 'durationSeconds', media: 'poster'},
    prepare({title, durationSeconds, media}) {
      return {title, subtitle: formatDuration(durationSeconds), media}
    },
  },
})
