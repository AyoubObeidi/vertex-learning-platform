import {BookIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: BookIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'curriculum', title: 'Curriculum'},
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
      name: 'summary',
      type: 'text',
      group: 'content',
      rows: 3,
      validation: (rule) =>
        rule.required().max(200).warning('Keep the summary under 200 characters'),
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      group: 'content',
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
      name: 'level',
      type: 'string',
      group: 'content',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
        layout: 'radio',
      },
      initialValue: 'beginner',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      type: 'number',
      group: 'meta',
      description: 'In USD. Zero means free.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'popular',
      type: 'boolean',
      group: 'meta',
      description: 'Flags the course as popular in the catalog.',
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
      name: 'learningOutcomes',
      title: 'What you will learn',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'learningOutcome'})],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'instructor',
      type: 'reference',
      group: 'content',
      to: [{type: 'instructor'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      group: 'content',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'modules',
      type: 'array',
      group: 'curriculum',
      of: [defineArrayMember({type: 'courseModule'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', instructorName: 'instructor.name', media: 'coverImage'},
    prepare({title, instructorName, media}) {
      return {title, subtitle: instructorName, media}
    },
  },
})
