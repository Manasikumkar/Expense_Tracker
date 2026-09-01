import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(ArcElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const CURRENCY = { symbol: '₹', code: 'INR', locale: 'en-IN' };

const categoryColors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'];

const categoryIcons = {
  Food: '🍽️', Transport: '🚗', Shopping: '🛍️', Entertainment: '🎬',
  Bills: '📱', Healthcare: '💊', Education: '📚', General: '📦',
};

const StatCard = ({ icon, label, value, sub, trend, trendUp, color }) => (
  <div className="glass-card p-5 group cursor-default">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color || 'bg-brand-500/10'}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
    <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</p>
    {sub && <p className="text-[12px] text-dark-400 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { api, user } = useAuth();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBudget, setUserBudget] = useState(30000);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user budget
      try {
        const profileRes = await api.get('/users/profile');
        if (profileRes.data?.user?.monthlyBudget !== undefined) {
          const b = Number(profileRes.data.user.monthlyBudget);
          if (b > 0) setUserBudget(b);
        }
      } catch (e) { /* use default */ }

      // Fetch ALL expenses
      const expensesRes = await api.get('/expenses');
      const expenses = expensesRes.data?.data || [];
      setAllExpenses(expenses);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute ALL stats CLIENT-SIDE from actual expenses
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const todayExpenses = allExpenses.filter(exp => {
    if (!exp.date) return false;
    return new Date(exp.date).toISOString().split('T')[0] === todayStr;
  });
  
  const monthExpenses = allExpenses.filter(exp => {
    if (!exp.date) return false;
    const d = new Date(exp.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekExpenses = allExpenses.filter(exp => exp.date && new Date(exp.date) >= weekAgo);

  const todayTotal = todayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const monthTotal = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const weekTotal = weekExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const allTimeTotal = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const usagePercent = userBudget > 0 ? Math.round((allTimeTotal / userBudget) * 100) : 0;
  const remaining = Math.max(0, userBudget - allTimeTotal);
  const currentDay = now.getDate();
  const dailyAvg = currentDay > 0 ? Math.round(monthTotal / currentDay) : 0;

  // Category breakdown for this month
  const categoryBreakdown = {};
  monthExpenses.forEach(exp => {
    const cat = exp.category || 'General';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (exp.amount || 0);
  });
  const formattedCategoryBreakdown = Object.entries(categoryBreakdown)
    .map(([key, value]) => ({ _id: key, total: value }))
    .sort((a, b) => b.total - a.total);

  // Spending trend data (7 days)
  const getSpendingTrendData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const total = allExpenses
        .filter(exp => exp.date && new Date(exp.date).toISOString().split('T')[0] === dateStr)
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      days.push({ label, total, isToday: i === 0 });
    }
    return {
      labels: days.map(d => d.label),
      datasets: [{
        data: days.map(d => d.total),
        backgroundColor: (ctx) => {
          if (!ctx.chart.chartArea) return '#2dd4bf';
          const gradient = ctx.chart.ctx.createLinearGradient(0, ctx.chart.chartArea.bottom, 0, ctx.chart.chartArea.top);
          gradient.addColorStop(0, 'rgba(45, 212, 191, 0.05)');
          gradient.addColorStop(1, 'rgba(45, 212, 191, 0.25)');
          return gradient;
        },
        borderColor: '#2dd4bf',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: days.map(d => d.isToday ? '#2dd4bf' : 'transparent'),
        pointBorderColor: days.map(d => d.isToday ? '#fff' : 'transparent'),
        pointBorderWidth: days.map(d => d.isToday ? 2 : 0),
        pointRadius: days.map(d => d.isToday ? 5 : 0),
        pointHoverRadius: 6,
      }]
    };
  };

  const getBudgetProgressData = () => ({
    labels: ['Spent', 'Remaining'],
    datasets: [{
      data: [allTimeTotal, remaining],
      backgroundColor: ['#f87171', '#34d399'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '0%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${CURRENCY.symbol}${(ctx.raw || 0).toLocaleString(CURRENCY.locale)}` }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx) => ` ${CURRENCY.symbol}${(ctx.raw || 0).toLocaleString(CURRENCY.locale)}` }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { family: 'Inter', size: 12, weight: 500 }, color: '#475569' }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#475569', callback: (val) => `${CURRENCY.symbol}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}` }, border: { display: false } }
    },
    interaction: { intersect: false, mode: 'index' }
  };

  const recentExpenses = allExpenses.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-dark-400 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-dark-400 text-sm mt-1">Here's an overview of your finances.</p>
        </div>
        <Link 
          to="/expenses"
          className="btn-primary px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 w-fit"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Expense
          </span>
        </Link>
      </div>

      {/* Stat cards - ALL computed client-side from expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard 
          icon="💰"
          label="Today's Spending"
          value={`${CURRENCY.symbol}${todayTotal.toLocaleString(CURRENCY.locale)}`}
          sub={`${todayExpenses.length} transactions today`}
          color="bg-brand-500/10"
        />
        <StatCard 
          icon="📅"
          label="This Month"
          value={`${CURRENCY.symbol}${monthTotal.toLocaleString(CURRENCY.locale)}`}
          sub={`${monthExpenses.length} expenses this month`}
          color="bg-accent-purple/10"
        />
        <StatCard 
          icon="🎯"
          label="Budget Used"
          value={`${usagePercent}%`}
          sub={`${CURRENCY.symbol}${remaining.toLocaleString(CURRENCY.locale)} remaining`}
          color={usagePercent >= 80 ? 'bg-accent-red/10' : 'bg-accent-green/10'}
        />
        <StatCard 
          icon="📊"
          label="Daily Average"
          value={`${CURRENCY.symbol}${dailyAvg.toLocaleString(CURRENCY.locale)}`}
          sub={`Based on ${currentDay} days`}
          color="bg-accent-amber/10"
        />
      </div>

      {/* Spending Trend + Budget Progress */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-white">Spending Trend</h3>
              <p className="text-[12px] text-dark-400 mt-0.5">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-dark-400 uppercase tracking-wider font-medium">Week Total</p>
              <p className="text-lg font-bold text-white">
                {CURRENCY.symbol}{weekTotal.toLocaleString(CURRENCY.locale)}
              </p>
            </div>
          </div>
          <div className="h-[220px]">
            {allExpenses.length > 0 ? (
              <Line data={getSpendingTrendData()} options={lineOptions} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-dark-500 text-4xl mb-3">📈</p>
                  <p className="text-sm text-dark-400">No spending data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-[15px] font-semibold text-white mb-4">Budget Progress</h3>
          <div className="h-[180px] flex items-center justify-center">
            <div className="relative">
              <Doughnut data={getBudgetProgressData()} options={{ ...doughnutOptions, cutout: '72%' }} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <p className="text-2xl font-bold text-white">{usagePercent}%</p>
                <p className="text-[11px] text-dark-400 font-medium">used</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                <span className="text-dark-300">Spent</span>
              </div>
              <span className="font-semibold text-dark-100">{CURRENCY.symbol}{allTimeTotal.toLocaleString(CURRENCY.locale)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                <span className="text-dark-300">Remaining</span>
              </div>
              <span className="font-semibold text-dark-100">{CURRENCY.symbol}{remaining.toLocaleString(CURRENCY.locale)}</span>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-sm">
              <span className="text-dark-400">Total Budget</span>
              <span className="font-bold text-white">{CURRENCY.symbol}{userBudget.toLocaleString(CURRENCY.locale)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown + Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-white">Spending by Category</h3>
            <span className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">This Month</span>
          </div>
          {formattedCategoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {formattedCategoryBreakdown.map((cat, i) => {
                const total = formattedCategoryBreakdown.reduce((s, c) => s + c.total, 0);
                const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
                return (
                  <div key={cat._id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: categoryColors[i % categoryColors.length] + '20' }}>
                          {categoryIcons[cat._id] || '📦'}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-dark-100">{cat._id}</p>
                          <p className="text-[11px] text-dark-400">{pct}% of total</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-semibold text-white">{CURRENCY.symbol}{cat.total.toLocaleString(CURRENCY.locale)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden ml-[42px]">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: categoryColors[i % categoryColors.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center">
                <p className="text-dark-500 text-4xl mb-3">📊</p>
                <p className="text-sm text-dark-400">No spending data this month</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
            <h3 className="text-[15px] font-semibold text-white">Recent Transactions</h3>
            <Link to="/expenses" className="text-[13px] font-medium text-accent-green hover:text-accent-green/80 transition-colors flex items-center gap-1">
              View all
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="flex-1">
              {recentExpenses.map((expense, index) => (
                <div key={index} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: (categoryColors[Object.keys(categoryIcons).indexOf(expense.category) % categoryColors.length] || '#818cf8') + '20' }}
                  >
                    {categoryIcons[expense.category] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-dark-100 truncate">{expense.title}</p>
                    <p className="text-[11px] text-dark-400 mt-0.5">
                      {expense.category} • {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <p className="text-[13px] font-semibold text-accent-red flex-shrink-0">
                    -{CURRENCY.symbol}{expense.amount.toLocaleString(CURRENCY.locale)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center flex-1 flex items-center justify-center">
              <div>
                <p className="text-dark-500 text-4xl mb-3">📝</p>
                <p className="text-sm text-dark-300 font-medium">No transactions yet</p>
                <p className="text-xs text-dark-400 mt-1">Add your first expense to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default Dashboard;
