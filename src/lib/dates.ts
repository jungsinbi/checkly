import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export const today = () => new Date()
export const toDateStr = (d: Date) => format(d, 'yyyy-MM-dd')
export const fromDateStr = (s: string) => parseISO(s)

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  const end = endOfWeek(date, { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const days = eachDayOfInterval({ start, end })

  // 앞 빈칸 채우기 (일요일 시작)
  const firstDay = start.getDay()
  const prevDays: Date[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(start)
    d.setDate(d.getDate() - i - 1)
    prevDays.push(d)
  }

  // 뒷 빈칸 채우기
  const lastDay = end.getDay()
  const nextDays: Date[] = []
  for (let i = 1; i < 7 - lastDay; i++) {
    const d = new Date(end)
    d.setDate(d.getDate() + i)
    nextDays.push(d)
  }

  return [...prevDays, ...days, ...nextDays]
}

export function formatMonthTitle(date: Date): string {
  return format(date, 'yyyy년 M월', { locale: ko })
}

export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 0 })
  const end = endOfWeek(date, { weekStartsOn: 0 })
  return `${format(start, 'M/d')} — ${format(end, 'M/d')}`
}

export { isSameDay, isSameMonth, format }

export function calcStreak(doneDates: string[]): number {
  const done = new Set(doneDates)
  const cursor = today()
  // 오늘 아직 체크 전이면 어제까지 이어진 기록을 보여줌
  if (!done.has(toDateStr(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (done.has(toDateStr(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function calcMaxStreak(doneDates: string[]): number {
  const sorted = [...new Set(doneDates)].sort()
  if (sorted.length === 0) return 0
  let max = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1])
    prev.setDate(prev.getDate() + 1)
    if (toDateStr(prev) === sorted[i]) {
      current++
      max = Math.max(max, current)
    } else {
      current = 1
    }
  }
  return max
}
