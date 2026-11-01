'use client';

import { BudgetBreakdown } from '@/lib/types';
import { DollarSign, TrendingDown, Lightbulb } from 'lucide-react';

interface BudgetChartProps {
  budget: BudgetBreakdown;
  travelers: number;
  days: number;
}

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', emoji: '🏨', color: '#6366f1' },
  { key: 'food',          label: 'Food & Dining',  emoji: '🍜', color: '#f97316' },
  { key: 'attractions',   label: 'Attractions',    emoji: '🎫', color: '#22c55e' },
  { key: 'transport',     label: 'Transport',      emoji: '🚌', color: '#3b82f6' },
  { key: 'miscellaneous', label: 'Miscellaneous',  emoji: '🛍️', color: '#a855f7' },
] as const;

export default function BudgetChart({ budget, travelers, days }: BudgetChartProps) {
  const perPerson = budget.total / travelers;
  const perDay    = budget.total / days;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Budget" value={`$${budget.total.toLocaleString()}`} sub={budget.currency} icon="💰" color="from-primary-500 to-purple-600" />
        <SummaryCard label="Per Person" value={`$${Math.round(perPerson).toLocaleString()}`} sub={`${travelers} traveler${travelers > 1 ? 's' : ''}`} icon="👤" color="from-blue-500 to-cyan-600" />
        <SummaryCard label="Per Day" value={`$${Math.round(perDay).toLocaleString()}`} sub={`${days} days`} icon="📅" color="from-green-500 to-emerald-600" />
        <SummaryCard label="Savings Tips" value={`${budget.savingTips.length}`} sub="money-saving tips" icon="💡" color="from-accent-500 to-orange-600" />
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-400" /> Budget Breakdown
        </h3>
        <div className="space-y-5">
          {CATEGORIES.map(({ key, label, emoji, color }) => {
            const amount = budget[key];
            const pct = budget.total > 0 ? (amount / budget.total) * 100 : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <span className="text-dark-300 text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-dark-500 text-xs">{Math.round(pct)}%</span>
                    <span className="font-bold text-white text-sm w-24 text-right">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      boxShadow: `0 0 8px ${color}44`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Donut-like visual summary */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {CATEGORIES.map(({ key, label, color }) => {
            const pct = budget.total > 0 ? Math.round((budget[key] / budget.total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-xs text-dark-400">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {label}: {pct}%
              </div>
            );
          })}
        </div>
      </div>

      {/* Saving tips */}
      {budget.savingTips.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" /> Money-Saving Tips
          </h3>
          <div className="space-y-3">
            {budget.savingTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                <TrendingDown className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-dark-300 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily cost breakdown */}
      <div className="card">
        <h3 className="font-display font-bold text-lg text-white mb-4">Daily Cost Estimate</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-display font-bold text-2xl text-green-400">
              ${Math.round(perDay * 0.7).toLocaleString()}
            </div>
            <div className="text-dark-500 text-xs mt-1">Budget Day</div>
          </div>
          <div>
            <div className="font-display font-bold text-2xl gradient-text">
              ${Math.round(perDay).toLocaleString()}
            </div>
            <div className="text-dark-500 text-xs mt-1">Average Day</div>
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-accent-400">
              ${Math.round(perDay * 1.4).toLocaleString()}
            </div>
            <div className="text-dark-500 text-xs mt-1">Splurge Day</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: string;
  color: string;
}) {
  return (
    <div className="card text-center">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg mx-auto mb-3`}>
        {icon}
      </div>
      <div className="font-display font-bold text-2xl text-white">{value}</div>
      <div className="text-dark-400 text-xs mt-1">{label}</div>
      <div className="text-dark-600 text-xs">{sub}</div>
    </div>
  );
}
