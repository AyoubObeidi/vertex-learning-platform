import {LinkIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

/** A downloadable or linked resource listed on a lesson. */
export const lessonResource = defineType({
  name: 'lessonResource',
  title: 'Resource',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'type',
      type: 'string',
      options: {
        list: [
          {title: 'Article', value: 'article'},
          {title: 'Documentation', value: 'documentation'},
          {title: 'Code', value: 'code'},
          {title: 'Download', value: 'download'},
          {title: 'Video', value: 'video'},
        ],
      },
      initialValue: 'article',
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
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'type'},
  },
})
