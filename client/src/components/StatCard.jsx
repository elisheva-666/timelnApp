export default function StatCard({ title, value, subtitle, icon: Icon, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-600/10',
    green: 'text-green-400 bg-green-600/10',
    yellow: 'text-yellow-400 bg-yellow-600/10',
    purple: 'text-purple-400 bg-purple-600/10',
    red: 'text-red-400 bg-red-600/10',
  };

  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={20} className={colors[color].split(' ')[0]} />
        </div>
      )}
      <div>
        <p className="text-dark-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-dark-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
