import {ActivityIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A learner's progress through one course (CLAUDE.md sections 7 and 8).
 *
 * This is application state, not content. It is keyed by the Clerk user id and
 * written only by `web/app/api/progress/route.ts` with a server-side write
 * token — the browser never writes it, and no author edits it here. It is
 * listed in the Studio only so a run can be eyeballed without opening Vision.
 *
 * One document per learner per course, at the deterministic id
 * `progress.<userId>.<courseId>`, so every write is idempotent and needs no
 * lookup query first.
 *
 * The completion percentage is deliberately not stored. It is derived at read
 * time from `completedLessons` against the course's own lesson list, because a
 * stored percentage would drift the moment an author adds a lesson.
 */
export const progress = defineType({
  name: 'progress',
  title: 'Learner progress',
  type: 'document',
  icon: ActivityIcon,
  description:
    'App state written by the web app, not content. One record per learner per course, keyed by the Clerk user id.',
  fields: [
    defineField({
      name: 'userId',
      title: 'Clerk user ID',
      type: 'string',
      description: 'The learner. Comes from Clerk on the server, never from the browser.',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{type: 'course'}],
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'completedLessons',
      title: 'Completed lessons',
      type: 'array',
      description:
        'Set automatically once the learner watches past 90% of a lesson, or when the player reports the video finished. There is no manual control, and nothing clears it.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      readOnly: true,
    }),
    defineField({
      name: 'lastLesson',
      title: 'Last lesson',
      type: 'reference',
      to: [{type: 'lesson'}],
      description: 'Where the learner left off. Drives the Continue Learning affordance.',
      readOnly: true,
    }),
    defineField({
      name: 'lastPositionSeconds',
      title: 'Last position (seconds)',
      type: 'number',
      description: 'Playback position in the last lesson, as a whole number of seconds.',
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated at',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      userId: 'userId',
      course: 'course.title',
      updatedAt: 'updatedAt',
    },
    prepare({userId, course, updatedAt}) {
      return {
        title: course || 'Unknown course',
        subtitle: [userId, updatedAt].filter(Boolean).join(' — '),
      }
    },
  },
})
