export default function StatCard({ label, value, accent, selected, onClick }) {
  return (
    <div
      className={[
        'stat-card',
        accent    ? `stat-card--${accent}`    : '',
        selected  ? 'stat-card--selected'     : '',
        onClick   ? 'stat-card--clickable'    : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
