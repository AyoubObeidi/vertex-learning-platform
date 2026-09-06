import {PlayIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

import {formatTimestamp} from '../objects/videoChapter'

/**
 * Video intelligence: one document per unique video URL, holding that video's
 * table of contents and its transcript in short timestamped pieces
 * (CLAUDE.md sections 8 and 9).
 *
 * These are an internal lookup, not content. Search reads them to resolve a
 * query to an exact second in a lesson's video; a learner never sees one as a
 * result. A lesson does not reference a video document — the two are joined on
 * `lesson.videoUrl == video.url`.
 *
 * Every field here is written by the offline pipeline in `studio/videos/`. It
 * imports with `--replace`, so a hand edit in the Studio survives only until
 * the next run. Chapters are the exception worth authoring: put them in
 * `studio/videos/chapters.json` and they win over the provider's own.
 */

/** Mirrors the allowlist on `lesson.videoUrl`. */
const SUPPORTED_VIDEO_HOSTS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'mediadelivery.net',
  'b-cdn.net',
]

function formatDuration(totalSeconds?: number): string | undefined {
  if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds)) return undefined
  return formatTimestamp(totalSeconds)
}

export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: PlayIcon,
  description:
    'Built by the ingestion pipeline in studio/videos. Hand edits are overwritten by the next import — author chapters in studio/videos/chapters.json instead.',
  groups: [
    {name: 'source', title: 'Source', default: true},
    {name: 'intelligence', title: 'Chapters & transcript'},
  ],
  fields: [
    defineField({
      name: 'videoId',
      title: 'Video ID',
      type: 'string',
      group: 'source',
      description: "The provider's own id for this video.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      group: 'source',
      description: 'Matches the `videoUrl` of every lesson that uses this video.',
      validation: (rule) => [
        rule.required().uri({scheme: ['http', 'https']}),
        rule
          .custom((value) => {
            if (!value) return true
            try {
              const {hostname} = new URL(value)
              const supported = SUPPORTED_VIDEO_HOSTS.some(
                (host) => hostname === host || hostname.endsWith(`.${host}`),
              )
              return supported || 'Not a YouTube, Vimeo, or Bunny URL'
            } catch {
              return 'Must be a valid URL'
            }
          })
          .warning(),
      ],
    }),
    defineField({
      name: 'provider',
      type: 'string',
      group: 'source',
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Vimeo', value: 'vimeo'},
          {title: 'Bunny', value: 'bunny'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      group: 'source',
      description: "The source video's own title. For recognising this document, not for display.",
    }),
    defineField({
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'number',
      group: 'source',
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: 'chapters',
      title: 'Table of contents',
      type: 'array',
      group: 'intelligence',
      description: 'Empty when the source has none. Search then falls back to the transcript.',
      of: [defineArrayMember({type: 'videoChapter'})],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      type: 'array',
      group: 'intelligence',
      description: 'The transcript in short timestamped pieces. Never stored as one field.',
      of: [defineArrayMember({type: 'videoChunk'})],
    }),
    defineField({
      name: 'captionSource',
      title: 'Caption source',
      type: 'string',
      group: 'intelligence',
      options: {
        list: [
          {title: 'Author-uploaded', value: 'manual'},
          {title: 'Auto-generated', value: 'auto'},
          {title: 'None', value: 'none'},
        ],
        layout: 'radio',
      },
      description: 'Says whether thin transcript text is a bug or just a rough auto-caption.',
    }),
    defineField({
      name: 'chapterSource',
      title: 'Chapter source',
      type: 'string',
      group: 'intelligence',
      options: {
        list: [
          {title: 'From the provider', value: 'provider'},
          {title: 'Authored', value: 'authored'},
          {title: 'None', value: 'none'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'ingestedAt',
      title: 'Ingested at',
      type: 'datetime',
      group: 'source',
      description: 'When the pipeline last rebuilt this document.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      videoId: 'videoId',
      provider: 'provider',
      durationSeconds: 'durationSeconds',
      chapters: 'chapters',
      chunks: 'chunks',
    },
    prepare({title, videoId, provider, durationSeconds, chapters, chunks}) {
      const parts = [
        provider,
        formatDuration(durationSeconds),
        `${chapters?.length ?? 0} chapters`,
        `${chunks?.length ?? 0} chunks`,
      ].filter(Boolean)
      return {title: title || videoId, subtitle: parts.join(' · ')}
    },
  },
})
