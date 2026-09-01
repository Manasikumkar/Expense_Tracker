import React, { useEffect, useState } from "react";
import { useAuth } from '../../context/AuthContext';

const getCategoryStyle = (category) => {
  const styles = {
    Food: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-l-orange-500', icon: '🍽️' },
    Transport: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-l-blue-500', icon: '🚗' },
    Shopping: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-l-purple-500', icon: '🛍️' },
    Entertainment: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-l-pink-500', icon: '🎬' },
    Bills: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-l-emerald-500', icon: '📱' },
    Healthcare: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-l-red-500', icon: '💊' },
    Education: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-l-indigo-500', icon: '📚' },
    General: { bg: 'bg-dark-600', text: 'text-dark-300', border: 'border-l-dark-400', icon: '📦' }
  };
  return styles[category] || styles.General;
};

export default function ExpenseList({ refresh, onDelete, onEdit }) {
  const { api } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/expenses");
      const result = response.data;
      const expensesData = result.data || result;
      if (Array.isArray(expensesData)) {
        setExpenses(expensesData);
        setError("");
      } else {
        setExpenses([]);
        setError("Invalid data format received");
      }
    } catch (err) {
      setError("Failed to load expenses");
      console.error("Fetch error:", err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(exp => exp._id !== id));
      if (onDelete) onDelete();
    } catch (error) {
      alert("Error deleting expense");
      console.error("Delete error:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return "Invalid date";
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = !searchTerm || 
      exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...new Set(expenses.map(e => e.category).filter(Boolean))];

  if (loading && expenses.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="spinner-sm"></div>
          <p className="text-dark-400 text-sm">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <p className="text-accent-red text-sm mb-3">❌ {error}</p>
          <button onClick={loadExpenses} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-dark-300 text-sm font-medium rounded-xl transition-colors border border-white/5">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-white">All Expenses</h3>
          <span className="px-3 py-1 bg-brand-500/10 text-brand-400 text-[11px] font-semibold rounded-full border border-brand-500/20">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 glass-input text-sm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 glass-input text-sm appearance-none cursor-pointer min-w-[120px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-dark-800">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-dark-300 font-medium">{searchTerm || filterCategory !== "All" ? "No matching expenses" : "No expenses yet"}</p>
          <p className="text-dark-400 text-sm mt-1">{searchTerm || filterCategory !== "All" ? "Try a different search or filter" : "Add your first expense to get started"}</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.03]">
          {filteredExpenses.map((expense) => {
            const style = getCategoryStyle(expense.category);
            return (
              <div key={expense._id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors border-l-4 ${style.border}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${style.bg}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-dark-100 truncate">{expense.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] ${style.text}`}>{expense.category || 'General'}</span>
                    <span className="text-dark-600">•</span>
                    <span className="text-[11px] text-dark-400">{formatDate(expense.date || expense.createdAt)}</span>
                    {expense.paymentMethod && (
                      <>
                        <span className="text-dark-600">•</span>
                        <span className="text-[11px] text-dark-400">{expense.paymentMethod}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-accent-red flex-shrink-0">
                  -₹{(expense.amount || 0).toLocaleString('en-IN')}
                </p>
                {/* Edit button */}
                <button
                  onClick={() => onEdit && onEdit(expense)}
                  className="p-2 text-dark-500 hover:text-accent-amber hover:bg-accent-amber/10 rounded-lg transition-colors flex-shrink-0"
                  title="Edit expense"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(expense._id)}
                  className="p-2 text-dark-500 hover:text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors flex-shrink-0"
                  title="Delete expense"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
