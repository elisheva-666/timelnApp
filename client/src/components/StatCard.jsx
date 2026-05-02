export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand' }) {
  const palette = {
    brand:  { icon: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    green:  { icon: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
    yellow: { icon: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    purple: { icon: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
    red:    { icon: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  };

  const c = palette[color] || palette.brand;

  return (
    <div className="card card-hover">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 rounded-xl flex-shrink-0"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <Icon size={19} strokeWidth={2} style={{ color: c.icon }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#64748b', letterSpacing: '-0.01em' }}>{title}</p>
          <p className="stat-number mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
