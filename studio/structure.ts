import {ActivityIcon, BookIcon, DocumentVideoIcon, PlayIcon, TagIcon, UserIcon} from '@sanity/icons'
import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('course').title('Courses').icon(BookIcon),
      S.documentTypeListItem('lesson').title('Lessons').icon(PlayIcon),
      S.documentTypeListItem('instructor').title('Instructors').icon(UserIcon),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
      // Built by studio/videos, not authored. Listed so an ingestion run can be
      // eyeballed without opening Vision.
      S.documentTypeListItem('video').title('Videos').icon(DocumentVideoIcon),
      // App state, written by the web app's progress route. Listed so a
      // learner's record can be eyeballed without opening Vision.
      S.documentTypeListItem('progress').title('Learner progress').icon(ActivityIcon),
    ])
