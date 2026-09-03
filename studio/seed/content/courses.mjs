/**
 * The seed catalog. One file per course under ./courses/, aggregated here in
 * the order they should appear when a reviewer reads through them.
 *
 * Fields that the frontend derives are deliberately absent: module and course
 * durations, module and lesson counts, and the "Lesson 5.1" labels all come
 * from array order and math::sum in GROQ (see web/sanity/lib/queries.ts).
 *
 * Per-lesson `studentCount` and `freePreview` are also absent — the builder
 * assigns them so the invariants in ../lib/validate.mjs hold by construction.
 */
import {course as apiDesignWithNodejs} from './courses/api-design-with-nodejs.mjs'
import {course as buildingLlmApplications} from './courses/building-llm-applications.mjs'
import {course as dockerEssentials} from './courses/docker-essentials.mjs'
import {course as kubernetesForApplicationDevelopers} from './courses/kubernetes-for-application-developers.mjs'
import {course as nextjsForProduction} from './courses/nextjs-for-production.mjs'
import {course as postgresqlForApplicationDevelopers} from './courses/postgresql-for-application-developers.mjs'
import {course as pythonFoundationsForDataWork} from './courses/python-foundations-for-data-work.mjs'
import {course as reactPerformanceEngineering} from './courses/react-performance-engineering.mjs'
import {course as retrievalAugmentedGenerationInPractice} from './courses/retrieval-augmented-generation-in-practice.mjs'
import {course as typescriptDeepDive} from './courses/typescript-deep-dive.mjs'

export const courses = [
  nextjsForProduction,
  reactPerformanceEngineering,
  typescriptDeepDive,
  pythonFoundationsForDataWork,
  buildingLlmApplications,
  retrievalAugmentedGenerationInPractice,
  dockerEssentials,
  kubernetesForApplicationDevelopers,
  postgresqlForApplicationDevelopers,
  apiDesignWithNodejs,
]
