import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CURRENCY = { symbol: '₹', locale: 'en-IN' };
const categoryColors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'];

const Reports = () => {
  const { api } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data?.data || []);
    } catch (e) {
      console.error('Error fetching expenses:', e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const getFilteredExpenses = () => {
    const now = new Date();
    return expenses.filter(exp => {
      const d = new Date(exp.date);
      if (dateRange === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateRange === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (dateRange === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filtered = getFilteredExpenses();
  const totalSpent = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const avgPerTransaction = filtered.length > 0 ? totalSpent / filtered.length : 0;
  const highestCategory = (() => {
    const cats = {};
    filtered.forEach(e => { cats[e.category || 'General'] = (cats[e.category || 'General'] || 0) + (e.amount || 0); });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], total: sorted[0][1] } : null;
  })();

  const categoryData = (() => {
    const cats = {};
    filtered.forEach(e => { cats[e.category || 'General'] = (cats[e.category || 'General'] || 0) + (e.amount || 0); });
    const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: categoryColors.slice(0, entries.length),
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  })();

  const monthlyData = (() => {
    const months = {};
    filtered.forEach(e => {
      const d = new Date(e.date);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = (months[key] || 0) + (e.amount || 0);
    });
    const entries = Object.entries(months);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: (ctx) => {
          const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c'];
          return colors[ctx.dataIndex % colors.length] || '#818cf8';
        },
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 28,
      }]
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(99,102,241,0.2)', borderWidth: 1,
        titleFont: { family: 'Inter', size: 13 }, bodyFont: { family: 'Inter', size: 12 }, padding: 12, cornerRadius: 10,
        callbacks: { label: (ctx) => ` ${CURRENCY.symbol}${(ctx.raw || 0).toLocaleString(CURRENCY.locale)}` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#475569' }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#475569', callback: (v) => `${CURRENCY.symbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` }, border: { display: false } }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-dark-400 text-sm font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-dark-400 text-sm mt-1">Insights into your spending patterns</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'bg-white/5 text-dark-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">Total Spent</p>
          <p className="text-2xl font-bold text-white">{CURRENCY.symbol}{totalSpent.toLocaleString(CURRENCY.locale)}</p>
          <p className="text-[12px] text-dark-400 mt-1">{filtered.length} transactions</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">Avg per Transaction</p>
          <p className="text-2xl font-bold text-white">{CURRENCY.symbol}{avgPerTransaction.toLocaleString(CURRENCY.locale, { maximumFractionDigits: 0 })}</p>
          <p className="text-[12px] text-dark-400 mt-1">Average spending</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">Highest Category</p>
          <p className="text-2xl font-bold text-white">{highestCategory?.name || '—'}</p>
          <p className="text-[12px] text-dark-400 mt-1">{highestCategory ? `${CURRENCY.symbol}${highestCategory.total.toLocaleString(CURRENCY.locale)}` : 'No data'}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider mb-2">Categories Used</p>
          <p className="text-2xl font-bold text-white">{new Set(filtered.map(e => e.category)).size}</p>
          <p className="text-[12px] text-dark-400 mt-1">Unique categories</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-[15px] font-semibold text-white mb-4">Spending by Category</h3>
          {filtered.length > 0 ? (
            <div className="h-[280px]">
              <Doughnut data={categoryData} options={{ ...chartOptions, cutout: '65%' }} />
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-dark-400 text-sm">No data for this period</p>
            </div>
          )}
        </div>
        <div className="glass-card p-5">
          <h3 className="text-[15px] font-semibold text-white mb-4">Monthly Comparison</h3>
          {filtered.length > 0 ? (
            <div className="h-[280px]">
              <Bar data={monthlyData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-dark-400 text-sm">No data for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card p-5">
        <h3 className="text-[15px] font-semibold text-white mb-4">Spending Insights</h3>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <p className="text-dark-400 text-sm mb-1">Most Expensive Transaction</p>
              <p className="text-white font-semibold">{filtered.sort((a,b) => b.amount - a.amount)[0]?.title}</p>
              <p className="text-brand-400 text-sm mt-1">{CURRENCY.symbol}{filtered.sort((a,b) => b.amount - a.amount)[0]?.amount?.toLocaleString(CURRENCY.locale)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <p className="text-dark-400 text-sm mb-1">Most Active Category</p>
              <p className="text-white font-semibold">{highestCategory?.name}</p>
              <p className="text-brand-400 text-sm mt-1">{CURRENCY.symbol}{highestCategory?.total?.toLocaleString(CURRENCY.locale)} total</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <p className="text-dark-400 text-sm mb-1">Spending Frequency</p>
              <p className="text-white font-semibold">{filtered.length} transactions</p>
              <p className="text-brand-400 text-sm mt-1">~{Math.round(filtered.length / Math.max(1, dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365))}/day avg</p>
            </div>
          </div>
        ) : (
          <p className="text-dark-400 text-sm text-center py-8">No insights available for this period</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
