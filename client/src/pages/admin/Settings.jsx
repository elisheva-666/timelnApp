import { GitBranch, ExternalLink, Settings2, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function Settings() {
  return (
    <div>
      <PageHeader title="הגדרות מערכת" subtitle="ניהול אינטגרציות וקונפיגורציה" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Git Integration */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-dark-900 rounded-xl border border-dark-700">
              <GitBranch size={20} className="text-brand-600" />
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold">Git Integration</h3>
              <p className="text-dark-500 text-xs">חיבור לגיטהאב / גיטלב</p>
            </div>
            <span className="mr-auto badge bg-slate-100 text-slate-500 border border-slate-200">MVP</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">GitHub Token</label>
              <input type="password" className="input-field" placeholder="ghp_..." disabled />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Organization / Username</label>
              <input type="text" className="input-field" placeholder="my-org" disabled />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-blue-700 text-xs">
                  בשלב ה-MVP ניתן לשמור commit hash ידנית בכל דיווח שעות.
                  אינטגרציה מלאה עם Git API תתווסף בגרסה הבאה.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ClickUp Integration */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-dark-900 rounded-xl border border-dark-700">
              <ExternalLink size={20} className="text-brand-600" />
            </div>
            <div>
              <h3 className="text-dark-50 font-semibold">ClickUp Integration</h3>
              <p className="text-dark-500 text-xs">חיבור לניהול משימות</p>
            </div>
            <span className="mr-auto badge bg-slate-100 text-slate-500 border border-slate-200">MVP</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">ClickUp API Token</label>
              <input type="password" className="input-field" placeholder="pk_..." disabled />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Team ID</label>
              <input type="text" className="input-field" placeholder="12345678" disabled />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-blue-700 text-xs">
                  בשלב ה-MVP ניתן לשמור ClickUp Task ID ידנית בפרויקטים ובמשימות.
                  סנכרון אוטומטי יתווסף בגרסה הבאה.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-dark-900 rounded-xl border border-dark-700">
              <Settings2 size={20} className="text-brand-600" />
            </div>
            <h3 className="text-dark-50 font-semibold">מידע על המערכת</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              ['גרסה', '1.0.0 MVP'],
              ['Database', 'SQLite'],
              ['Backend', 'Node.js + Express'],
              ['Frontend', 'React + Vite + Tailwind'],
            ].map(([k, v]) => (
              <div key={k} className="bg-dark-900 rounded-xl p-3 border border-dark-700">
                <p className="text-dark-500 text-xs mb-1">{k}</p>
                <p className="text-dark-50 font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
