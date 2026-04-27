const configs = {
  // TimeEntry status
  draft:     { label: 'טיוטה',    cls: 'bg-dark-600 text-dark-300' },
  submitted: { label: 'הוגש',     cls: 'bg-blue-900/60 text-blue-300' },
  approved:  { label: 'אושר',     cls: 'bg-green-900/60 text-green-300' },
  rejected:  { label: 'נדחה',     cls: 'bg-red-900/60 text-red-300' },
  // Task status
  new:         { label: 'NEW',       cls: 'bg-blue-900/60 text-blue-300 border border-blue-700/50' },
  in_progress: { label: 'בעבודה',   cls: 'bg-yellow-900/60 text-yellow-300' },
  completed:   { label: 'COMPLETED', cls: 'bg-green-900/60 text-green-300 border border-green-700/50' },
  cancelled:   { label: 'בוטל',     cls: 'bg-dark-600 text-dark-400' },
  // Project status
  active:   { label: 'פעיל',    cls: 'bg-green-900/60 text-green-300' },
  inactive: { label: 'לא פעיל', cls: 'bg-dark-600 text-dark-400' },
  archived: { label: 'ארכיון',  cls: 'bg-dark-600 text-dark-500' },
  // Priority
  low:    { label: 'נמוכה',  cls: 'bg-dark-600 text-dark-300' },
  medium: { label: 'בינונית', cls: 'bg-yellow-900/60 text-yellow-300' },
  high:   { label: 'גבוהה',  cls: 'bg-orange-900/60 text-orange-300' },
  urgent: { label: 'דחוף',   cls: 'bg-red-900/60 text-red-300' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || { label: status, cls: 'bg-dark-600 text-dark-300' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
