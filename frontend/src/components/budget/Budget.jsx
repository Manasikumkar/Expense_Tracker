import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CURRENCY = { symbol: '₹', code: 'INR', locale: 'en-IN' };

const Budget = () => {
  const { api } = useAuth();
  const [budget, setBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMonthlyBudget, setUserMonthlyBudget] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');

  const getDefaultCategories = (totalBudget) => {
    const percentages = {
      'Food': 0.20, 'Transport': 0.15, 'Shopping': 0.15,
      'Entertainment': 0.10, 'Bills': 0.25, 'Other': 0.15
    };
    return Object.entries(percentages).map(([name, percentage], index) => ({
      name,
      budget: Math.round(totalBudget * percentage),
      color: ['#818cf8', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#64748b'][index],
      spent: 0
    }));
  };

  const fetchUserBudget = useCallback(async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.data?.user?.monthlyBudget !== undefined) {
        const userBudget = Number(response.data.user.monthlyBudget);
        const budgetValue = userBudget > 0 ? userBudget : 10000;
        setBudget(budgetValue);
        setUserMonthlyBudget(budgetValue);
        return budgetValue;
      }
      const defaultBudget = 10000;
      setBudget(defaultBudget);
      setUserMonthlyBudget(defaultBudget);
      return defaultBudget;
    } catch (error) {
      const storedBudget = localStorage.getItem('userBudget');
      if (storedBudget) {
        const budgetValue = Number(storedBudget);
        setBudget(budgetValue);
        setUserMonthlyBudget(budgetValue);
        return budgetValue;
      }
      const defaultBudget = 10000;
      setBudget(defaultBudget);
      setUserMonthlyBudget(defaultBudget);
      return defaultBudget;
    }
  }, [api]);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await api.get('/expenses');
      const expensesData = response.data?.data || [];
      setExpenses(expensesData);
      localStorage.setItem('expenses', JSON.stringify(expensesData));
      return expensesData;
    } catch (error) {
      const storedExpenses = localStorage.getItem('expenses');
      if (storedExpenses) {
        try {
          const expensesData = JSON.parse(storedExpenses);
          setExpenses(expensesData);
          return expensesData;
        } catch (e) { console.error('Failed to parse stored expenses:', e); }
      }
      return [];
    }
  }, [api]);

  const calculateCategoryBudgets = useCallback((expensesData, totalBudget) => {
    const categoriesWithSpending = getDefaultCategories(totalBudget);
    if (!expensesData || expensesData.length === 0) {
      return categoriesWithSpending.map(cat => ({ ...cat, spent: 0, remaining: cat.budget, usage: 0, status: 'good' }));
    }
    expensesData.forEach(expense => {
      const categoryName = expense.category || 'Other';
      const amount = Number(expense.amount) || 0;
      const categoryIndex = categoriesWithSpending.findIndex(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
      if (categoryIndex !== -1) {
        categoriesWithSpending[categoryIndex].spent += amount;
      } else {
        const otherIndex = categoriesWithSpending.findIndex(cat => cat.name === 'Other');
        if (otherIndex !== -1) categoriesWithSpending[otherIndex].spent += amount;
      }
    });
    return categoriesWithSpending.map(category => {
      const spent = category.spent;
      const remaining = Math.max(0, category.budget - spent);
      const usage = category.budget > 0 ? (spent / category.budget) * 100 : 0;
      const status = usage >= 100 ? 'over' : usage >= 80 ? 'warning' : 'good';
      return { ...category, spent, remaining, usage, status };
    });
  }, []);

  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    setSyncStatus('Loading data...');
    try {
      const budgetValue = await fetchUserBudget();
      const expensesData = await fetchExpenses();
      const calculatedCategories = calculateCategoryBudgets(expensesData, budgetValue);
      setCategoryBudgets(calculatedCategories);
      setSyncStatus('Data loaded successfully');
    } catch (error) {
      const fallbackBudget = userMonthlyBudget > 0 ? userMonthlyBudget : 10000;
      const defaultCategories = getDefaultCategories(fallbackBudget).map(cat => ({ ...cat, spent: 0, remaining: cat.budget, usage: 0, status: 'good' }));
      setCategoryBudgets(defaultCategories);
    } finally {
      setLoading(false);
    }
  }, [fetchUserBudget, fetchExpenses, calculateCategoryBudgets, userMonthlyBudget]);

  useEffect(() => { fetchBudgetData(); }, [fetchBudgetData]);

  const handleBudgetUpdate = async () => {
    if (budget <= 0) { alert('Please enter a valid budget amount (greater than 0)'); return; }
    setSyncStatus('Updating budget...');
    try {
      await api.put('/users/profile', { monthlyBudget: budget });
      setUserMonthlyBudget(budget);
      localStorage.setItem('userBudget', budget.toString());
      setSyncStatus('Budget updated successfully!');
      alert(`Budget updated to ${CURRENCY.symbol}${budget.toLocaleString(CURRENCY.locale)}`);
      fetchBudgetData();
    } catch (error) {
      localStorage.setItem('userBudget', budget.toString());
      setUserMonthlyBudget(budget);
      setSyncStatus('Budget saved locally');
      alert('Budget saved locally!');
      fetchBudgetData();
    }
  };

  const handleBudgetChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setBudget(value === '' ? 0 : parseInt(value, 10));
  };

  const totalSpent = categoryBudgets.reduce((sum, cat) => sum + cat.spent, 0);
  const remainingBudget = Math.max(0, userMonthlyBudget - totalSpent);
  const overallUsage = userMonthlyBudget > 0 ? (totalSpent / userMonthlyBudget) * 100 : 0;

  const doughnutData = {
    labels: categoryBudgets.map(cat => cat.name),
    datasets: [{
      data: categoryBudgets.map(cat => cat.spent),
      backgroundColor: categoryBudgets.map(cat => cat.color),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 10,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${CURRENCY.symbol}${(ctx.raw || 0).toLocaleString(CURRENCY.locale)}` }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-dark-400 text-sm font-medium">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Budget Overview</h1>
          <p className="text-dark-400 text-sm mt-1">Track and manage your monthly spending</p>
        </div>
        {syncStatus && syncStatus !== 'Data loaded successfully' && (
          <div className="px-4 py-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm rounded-xl font-medium">
            🔄 {syncStatus}
          </div>
        )}
        {userMonthlyBudget === 0 && (
          <div className="px-4 py-2 bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-sm rounded-xl font-medium">
            ⚠️ No budget set yet
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-accent-amber/10 rounded-xl flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Total Budget</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {userMonthlyBudget > 0 ? `${CURRENCY.symbol}${userMonthlyBudget.toLocaleString(CURRENCY.locale)}` : <span className="text-accent-red">Not set</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-accent-red/10 rounded-xl flex items-center justify-center text-xl">📉</div>
            <div>
              <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Spent</p>
              <p className="text-xl font-bold text-white mt-0.5">{CURRENCY.symbol}{totalSpent.toLocaleString(CURRENCY.locale)}</p>
              <p className="text-[11px] text-dark-400">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-accent-green/10 rounded-xl flex items-center justify-center text-xl">💎</div>
            <div>
              <p className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Remaining</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {userMonthlyBudget > 0 ? `${CURRENCY.symbol}${remainingBudget.toLocaleString(CURRENCY.locale)}` : <span className="text-accent-red">Set budget first</span>}
              </p>
              <p className="text-[11px] text-dark-400">{overallUsage.toFixed(1)}% used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Spending Distribution */}
        <div className="glass-card p-5">
          <h3 className="text-[15px] font-semibold text-white mb-4">Spending Distribution</h3>
          {totalSpent > 0 ? (
            <>
              <div className="h-56">
                <Doughnut data={doughnutData} options={chartOptions} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {categoryBudgets.filter(c => c.spent > 0).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-dark-300 truncate">{cat.name}</span>
                    <span className="font-semibold text-dark-100 ml-auto">{CURRENCY.symbol}{cat.spent.toLocaleString(CURRENCY.locale)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-56 flex items-center justify-center">
              <div className="text-center">
                <p className="text-dark-500 text-4xl mb-3">📊</p>
                <p className="text-sm text-dark-400">No expenses yet</p>
                <p className="text-xs text-dark-500 mt-1">Add expenses to see distribution</p>
              </div>
            </div>
          )}
        </div>

        {/* Budget Control */}
        <div className="glass-card p-5">
          <h3 className="text-[15px] font-semibold text-white mb-4">Budget Control</h3>
          <div className="flex gap-3 mb-5">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 font-semibold text-sm">₹</span>
              <input
                type="text"
                value={budget === 0 ? '' : budget}
                onChange={handleBudgetChange}
                placeholder="Enter monthly budget"
                className="w-full pl-9 pr-4 py-3 glass-input text-sm"
              />
            </div>
            <button onClick={handleBudgetUpdate} className="btn-primary px-5 py-3 text-sm whitespace-nowrap">
              <span className="relative z-10">{userMonthlyBudget === 0 ? 'Set Budget' : 'Update'}</span>
            </button>
          </div>

          {userMonthlyBudget > 0 && (
            <div>
              <div className="flex justify-between text-sm text-dark-300 mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="font-semibold text-white">{overallUsage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${overallUsage >= 100 ? 'bg-accent-red' : overallUsage >= 80 ? 'bg-accent-amber' : 'bg-accent-green'}`}
                  style={{ width: `${Math.min(overallUsage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-dark-400">
                <span>{CURRENCY.symbol}{totalSpent.toLocaleString(CURRENCY.locale)} spent</span>
                <span>{CURRENCY.symbol}{remainingBudget.toLocaleString(CURRENCY.locale)} left</span>
              </div>
            </div>
          )}

          {userMonthlyBudget === 0 && (
            <div className="mt-4 p-4 bg-white/[0.02] rounded-xl text-center border border-white/5">
              <p className="text-sm text-dark-400 mb-3">Start by setting your monthly budget</p>
              <button onClick={() => { setBudget(10000); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-dark-300 text-sm font-medium rounded-lg transition-colors border border-white/5">
                Suggest ₹10,000 budget
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Category Breakdown</h3>
            <p className="text-[12px] text-dark-400 mt-0.5">Based on your {CURRENCY.symbol}{userMonthlyBudget.toLocaleString(CURRENCY.locale)} budget</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categoryBudgets.map((category, index) => (
            <div key={index} className="border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                <span className="text-[13px] font-medium text-dark-100 flex-1">{category.name}</span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  category.status === 'good' ? 'bg-accent-green/10 text-accent-green' :
                  category.status === 'warning' ? 'bg-accent-amber/10 text-accent-amber' :
                  'bg-accent-red/10 text-accent-red'
                }`}>
                  {category.usage.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${category.status === 'good' ? 'bg-accent-green' : category.status === 'warning' ? 'bg-accent-amber' : 'bg-accent-red'}`}
                  style={{ width: `${Math.min(category.usage, 100)}%` }}
                />
              </div>
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between"><span className="text-dark-400">Budget</span><span className="font-medium text-dark-200">{CURRENCY.symbol}{category.budget.toLocaleString(CURRENCY.locale)}</span></div>
                <div className="flex justify-between"><span className="text-dark-400">Spent</span><span className="font-medium text-dark-200">{CURRENCY.symbol}{category.spent.toLocaleString(CURRENCY.locale)}</span></div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Remaining</span>
                  <span className={`font-medium ${category.remaining > 0 ? 'text-accent-green' : 'text-accent-red'}`}>{CURRENCY.symbol}{category.remaining.toLocaleString(CURRENCY.locale)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Budget;
