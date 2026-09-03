import {defineField, defineType} from 'sanity'

/** One entry in a course's "what you'll learn" list. */
export const learningOutcome = defineType({
  name: 'learningOutcome',
  title: 'Learning outcome',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      type: 'string',
      description: 'Picked from a fixed vocabulary the frontend maps to an icon.',
      options: {
        list: [
          {title: 'Speed', value: 'zap'},
          {title: 'Architecture', value: 'layers'},
          {title: 'Security', value: 'shield'},
          {title: 'Deployment', value: 'rocket'},
          {title: 'Code', value: 'code'},
          {title: 'Data', value: 'database'},
          {title: 'Performance', value: 'gauge'},
          {title: 'Workflow', value: 'git-branch'},
        ],
      },
      initialValue: 'zap',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
