import { CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react'
import type { DeterministicReport } from '../types'

interface Props {
  data: DeterministicReport
}

function SeverityBadge({ severity }: { severity?: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-950/60 text-red-300 border-red-800',
    high: 'bg-orange-950/60 text-orange-300 border-orange-800',
    medium: 'bg-amber-950/60 text-amber-300 border-amber-800',
    low: 'bg-slate-800 text-slate-400 border-slate-700',
  }
  if (!severity) return null
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${map[severity] ?? map.low}`}>
      {severity}
    </span>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'pass') return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
  if (status === 'fail') return <XCircle className="w-4 h-4 text-red-400 shrink-0" />
  return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
}

export function Layer1Panel({ data }: Props) {
  const passCount = data.checks.filter(c => c.status === 'pass').length
  const failCount = data.checks.filter(c => c.status === 'fail').length

  return (
    <div className="space-y-4">
      {/* Extracted fields */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Extracted Fields</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Role', value: data.role ?? '—' },
            { label: 'Hours', value: data.hours != null ? `${data.hours}h` : '—' },
            { label: 'Wage', value: data.wage != null ? `$${data.wage}/hr` : '—' },
            { label: 'Fringe', value: data.fringe != null ? `$${data.fringe}/hr` : '—' },
            { label: 'Gross Pay', value: data.grossPay != null ? `$${data.grossPay}` : '—' },
            {
              label: 'DBWD Rate',
              value: data.dbwdRate ? `$${data.dbwdRate.base} + $${data.dbwdRate.fringe}` : '—',
            },
          ].map(({ label, value }) => (
            <div key={label} className="text-xs">
              <div className="text-slate-500 mb-0.5">{label}</div>
              <div className="font-mono text-slate-200">{String(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Checks summary */}
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" /> {passCount} passed
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <XCircle className="w-3.5 h-3.5" /> {failCount} failed
        </span>
        <span className="ml-auto text-slate-500">Score: {(data.score * 100).toFixed(0)}%</span>
      </div>

      {/* Check rows */}
      <div className="space-y-2">
        {data.checks.map((check) => (
          <div
            key={check.id}
            className={`rounded-lg border p-3 text-xs ${
              check.status === 'fail'
                ? 'bg-red-950/20 border-red-900'
                : check.status === 'warning'
                ? 'bg-amber-950/20 border-amber-900'
                : 'bg-emerald-950/10 border-emerald-900/40'
            }`}
          >
            <div className="flex items-start gap-2">
              <StatusIcon status={check.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-slate-400 text-[11px]">{check.id}</span>
                  <span className="text-slate-500 capitalize">{check.type.replace(/_/g, ' ')}</span>
                  <SeverityBadge severity={check.severity} />
                </div>
                <p className="text-slate-300 leading-relaxed">{check.message}</p>
                {check.regulation && (
                  <span className="inline-block mt-1 text-[10px] font-mono text-violet-400 bg-violet-950/30 px-1.5 py-0.5 rounded">
                    {check.regulation}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
