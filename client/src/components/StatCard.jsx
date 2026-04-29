export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand' }) {
  const colors = {
    brand:  'text-brand-600 bg-brand-50',
    green:  'text-green-600 bg-green-50',
    yellow: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
    red:    'text-red-600 bg-red-50',
  };

  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`p-3 rounded-xl flex-shrink-0 ${colors[color]}`}>
          <Icon size={20} className={colors[color].split(' ')[0]} />
        </div>
      )}
      <div>
        <p className="text-dark-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-dark-50 mt-0.5">{value}</p>
        {subtitle && <p className="text-dark-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
