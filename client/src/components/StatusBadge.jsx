const configs = {
  // TimeEntry status
  draft:     { label: 'טיוטה',    cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  submitted: { label: 'הוגש',     cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  approved:  { label: 'אושר',     cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  rejected:  { label: 'נדחה',     cls: 'bg-red-100 text-red-700 border border-red-200' },
  // Task status
  new:         { label: 'חדש',      cls: 'bg-sky-100 text-sky-700 border border-sky-200' },
  in_progress: { label: 'בעבודה',   cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  completed:   { label: 'הושלם',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  cancelled:   { label: 'בוטל',     cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  // Project status
  active:   { label: 'פעיל',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  inactive: { label: 'לא פעיל', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  archived: { label: 'ארכיון',  cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  // Priority
  low:    { label: 'נמוכה',   cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
  medium: { label: 'בינונית', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  high:   { label: 'גבוהה',   cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  urgent: { label: 'דחוף',    cls: 'bg-red-100 text-red-700 border border-red-200' },
};

export default function StatusBadge({ status }) {
  const cfg = configs[status] || { label: status, cls: 'bg-slate-100 text-slate-500 border border-slate-200' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
