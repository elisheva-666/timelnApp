export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-7 gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-dark-50" style={{ letterSpacing: '-0.03em' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm font-medium" style={{ color: '#94a3b8', letterSpacing: '-0.01em' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {actions}
        </div>
      )}
    </div>
  );
}
