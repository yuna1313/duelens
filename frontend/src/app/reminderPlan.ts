import type { TaskPreview } from '../features/tasks/model.ts'
import type { ReminderPreferences } from '../features/settings/model.ts'
import type { PlannedNotification } from '../features/notifications/model.ts'
import { isCalendarDate } from '../utils/date.ts'

// Computes the preview only; it never schedules timers, requests permission or sends.
export function planReminders(tasks: TaskPreview[], preferences: ReminderPreferences, now: number): PlannedNotification[] {
  return tasks.flatMap(task => {
    if (!task.dueDate || !isCalendarDate(task.dueDate) || !task.dueTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.dueTime)
      || task.status === 'submitted' || (task.status === 'written' && !preferences.afterWritten)) return []
    const dueAt = `${task.dueDate}T${task.dueTime}:00+09:00`
    return ([['day-before', 24, preferences.dayBefore], ['three-hours-before', 3, preferences.threeHoursBefore]] as const)
      .flatMap(([reason, hours, enabled]) => {
        const scheduled = Date.parse(dueAt) - hours * 60 * 60 * 1000
        return enabled && scheduled > now ? [{ id: `${task.id}-${reason}`, taskId: task.id, title: task.title, course: task.course, scheduledAt: new Date(scheduled).toISOString(), dueAt, reason }] : []
      })
  })
}
