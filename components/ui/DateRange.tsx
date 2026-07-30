'use client'

import { daysAgoISO, todayISO } from '@/lib/format'

interface Props {
  start: string
  end: string
  onChange: (start: string, end: string) => void
}

const PRESETS = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 6 },
  { label: '30 dias', days: 29 },
  { label: '90 dias', days: 89 },
]

export default function DateRange({ start, end, onChange }: Props) {
  const today = todayISO()
  const activeDays =
    end === today
      ? PRESETS.find((p) => start === daysAgoISO(p.days))?.days ?? null
      : null

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange(daysAgoISO(p.days), today)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-bold transition ${
              activeDays === p.days
                ? 'bg-ember text-coal-50 shadow-glow-sm'
                : 'bg-black/[0.05] text-coal-400 hover:text-coal-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label">De</label>
          <input
            type="date"
            className="field"
            value={start}
            max={end}
            onChange={(e) => onChange(e.target.value || start, end)}
          />
        </div>
        <div className="flex-1">
          <label className="label">Até</label>
          <input
            type="date"
            className="field"
            value={end}
            min={start}
            max={today}
            onChange={(e) => onChange(start, e.target.value || end)}
          />
        </div>
      </div>
    </div>
  )
}
