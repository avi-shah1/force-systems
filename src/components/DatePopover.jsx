import { useState } from 'react'
import './DatePopover.css'

const TODAY_ISO = new Date().toISOString().slice(0, 10)

function addDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function DatePopover({ title = 'Set check-in date', onSelect, onClose }) {
  return (
    <div className="popover-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popover">
        <div className="popover-top">
          <span className="popover-title">{title}</span>
          <button className="popover-close" onClick={onClose}>✕</button>
        </div>

        <div className="popover-quick">
          <button onClick={() => onSelect(TODAY_ISO)}>Today</button>
          <button onClick={() => onSelect(addDays(2))}>+2 days</button>
          <button onClick={() => onSelect(addDays(7))}>+7 days</button>
          <button onClick={() => onSelect(addDays(10))}>+10 days (general)</button>
        </div>

        <MiniCalendar onSelect={onSelect} />
      </div>
    </div>
  )
}

function MiniCalendar({ onSelect }) {
  const now = new Date()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const firstDay    = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const startDow    = firstDay.getDay()

  const cells = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function toISO(day) {
    const m = String(view.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${view.year}-${m}-${d}`
  }

  function prev() {
    setView((v) => {
      const d = new Date(v.year, v.month - 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function next() {
    setView((v) => {
      const d = new Date(v.year, v.month + 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="cal">
      <div className="cal-nav">
        <button className="cal-arrow" onClick={prev}>‹</button>
        <span className="cal-month">{monthName}</span>
        <button className="cal-arrow" onClick={next}>›</button>
      </div>
      <div className="cal-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dow) => (
          <span key={dow} className="cal-dow">{dow}</span>
        ))}
        {cells.map((day, i) =>
          day === null
            ? <span key={`e${i}`} className="cal-empty" />
            : (
              <button
                key={toISO(day)}
                className={`cal-day${toISO(day) === TODAY_ISO ? ' cal-day--today' : ''}`}
                onClick={() => onSelect(toISO(day))}
              >
                {day}
              </button>
            )
        )}
      </div>
    </div>
  )
}
