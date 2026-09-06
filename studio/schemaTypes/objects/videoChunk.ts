import {TextIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

import {formatTimestamp} from './videoChapter'

/**
 * One short, timestamped piece of a transcript.
 *
 * The transcript is only ever stored in pieces this size — never as one long
 * field — so a query can return the few chunks that matched instead of an
 * entire video's words (CLAUDE.md sections 8 and 12).
 */
export const videoChunk = defineType({
  name: 'videoChunk',
  title: 'Transcript chunk',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'startSeconds',
      title: 'Start (seconds)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'text',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {text: 'text', startSeconds: 'startSeconds'},
    prepare({text, startSeconds}) {
      const snippet = typeof text === 'string' ? text : ''
      return {
        title: snippet.length > 60 ? `${snippet.slice(0, 60)}…` : snippet,
        subtitle: formatTimestamp(startSeconds),
      }
    },
  },
})
