import {type SchemaTypeDefinition} from 'sanity'

import {category} from './documents/category'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {blockContent} from './objects/blockContent'
import {courseModule} from './objects/courseModule'
import {learningOutcome} from './objects/learningOutcome'
import {lessonResource} from './objects/lessonResource'

export const schema: {types: SchemaTypeDefinition[]} = {
  types: [
    // Documents
    course,
    lesson,
    instructor,
    category,
    // Objects
    courseModule,
    learningOutcome,
    lessonResource,
    blockContent,
  ],
}
