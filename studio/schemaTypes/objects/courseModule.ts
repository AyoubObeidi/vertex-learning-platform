import {BlockContentIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A module is embedded in its course, not a document of its own. The numbers
 * shown in the UI ("Module 5", "Lesson 5.1") come from array order, never from
 * a stored field — see CLAUDE.md section 8.
 */
export const courseModule = defineType({
  name: 'courseModule',
  title: 'Module',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'lessons',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'lesson'}]})],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: {title: 'title', lessons: 'lessons'},
    prepare({title, lessons}) {
      const count = Array.isArray(lessons) ? lessons.length : 0
      return {
        title: title || 'Untitled module',
        subtitle: `${count} ${count === 1 ? 'lesson' : 'lessons'}`,
      }
    },
  },
})
