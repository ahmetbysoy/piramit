import type { ReactNode } from 'react'

export function SettingCard({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="setting-card">
      <span className="setting-label">{label}</span>
      {hint && <p className="dim">{hint}</p>}
      <div className="setting-options">{children}</div>
    </div>
  )
}
