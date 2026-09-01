import React, { useEffect, useState } from "react";
import { useAuth } from '../../context/AuthContext';

export default function Summary({ refresh }) {
  const { api } = useAuth();
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userBudget, setUserBudget] = useState(30000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        // Fetch user budget
        try {
          const profileRes = await api.get('/users/profile');
          if (profileRes.data?.user?.monthlyBudget !== undefined) {
            const b = Number(profileRes.data.user.monthlyBudget);
            if (b > 0) setUserBudget(b);
          }
        } catch (e) { /* use default */ }

        const response = await api.get("/expenses");
        const result = response.data;
        const expenses = result.data || result;
        if (Array.isArray(expenses)) {
          const sum = expenses.reduce((acc, item) => acc + Number(item.amount || 0), 0);
          setTotal(sum);
          setAverage(expenses.length > 0 ? sum / expenses.length : 0);
          setCount(expenses.length);
        } else {
          setTotal(0); setAverage(0); setCount(0);
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
        setTotal(0); setAverage(0); setCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [refresh, api]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="skeleton h-3 w-20 mb-3"></div>
            <div className="skeleton h-7 w-28 mb-2"></div>
            <div className="skeleton h-2 w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const usagePercent = userBudget > 0 ? Math.min(100, (total / userBudget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Spent */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-accent-red/10 rounded-xl flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-accent-red" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Total Spent</p>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">₹{total.toFixed(2)}</p>
        <p className="text-[12px] text-dark-400 mt-1">{count} transactions</p>
      </div>

      {/* Average */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-brand-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Average</p>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">₹{average.toFixed(2)}</p>
        <p className="text-[12px] text-dark-400 mt-1">Per transaction</p>
      </div>

      {/* Budget Progress */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-accent-green/10 rounded-xl flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-accent-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Budget Used</p>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{usagePercent.toFixed(1)}%</p>
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${usagePercent >= 80 ? 'bg-accent-red' : usagePercent >= 50 ? 'bg-accent-amber' : 'bg-accent-green'}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
