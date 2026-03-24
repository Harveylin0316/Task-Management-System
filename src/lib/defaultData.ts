import { createDefaultDepartments } from './presetDepartments'
import type { AppData } from './types'

export function defaultData(): AppData {
  return {
    departments: createDefaultDepartments(),
    teamRoster: [],
    today: [],
    active: [],
    someday: [],
    done: [],
    waiting: [],
    projects: [],
    deadlines: [],
    meetingNotes: '',
    weeklyReview: {},
    bigProjects: [],
  }
}
