import React, { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { name: "Food", icon: "🍽️" },
  { name: "Transport", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Bills", icon: "📱" },
  { name: "Healthcare", icon: "💊" },
  { name: "Education", icon: "📚" },
  { name: "General", icon: "📦" },
];

export default function AddExpense({ onExpenseAdded, editingExpense, onEditCancel }) {
  const { api } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "General",
    description: "",
    paymentMethod: "Cash"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title || "",
        amount: editingExpense.amount || "",
        category: editingExpense.category || "General",
        description: editingExpense.description || "",
        paymentMethod: editingExpense.paymentMethod || "Cash"
      });
    } else {
      setFormData({ title: "", amount: "", category: "General", description: "", paymentMethod: "Cash" });
    }
  }, [editingExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || "" : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.amount || formData.amount <= 0) {
      setMessage("Please enter valid title and amount");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (editingExpense) {
        // UPDATE existing expense
        const response = await api.put(`/expenses/${editingExpense._id}`, {
          title: formData.title.trim(),
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          paymentMethod: formData.paymentMethod
        });

        if (response.data.success) {
          setFormData({ title: "", amount: "", category: "General", description: "", paymentMethod: "Cash" });
          setMessage("success:Expense updated successfully!");
          onExpenseAdded();
          setTimeout(() => setMessage(""), 3000);
        } else {
          throw new Error(response.data.error || "Failed to update expense");
        }
      } else {
        // CREATE new expense
        const response = await api.post("/expenses", {
          title: formData.title.trim(),
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          paymentMethod: formData.paymentMethod
        });

        if (response.data.success) {
          setFormData({ title: "", amount: "", category: "General", description: "", paymentMethod: "Cash" });
          setMessage("success:Expense added successfully!");
          onExpenseAdded();
          setTimeout(() => setMessage(""), 3000);
        } else {
          throw new Error(response.data.error || "Failed to add expense");
        }
      }
    } catch (error) {
      console.error("Expense error:", error);
      setMessage("error:" + (error.response?.data?.error || error.message || "Error saving expense"));
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-[15px] font-semibold text-white flex items-center gap-2.5">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingExpense ? 'bg-accent-amber/10' : 'bg-accent-green/10'}`}>
            {editingExpense ? (
              <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </span>
          {editingExpense ? 'Edit Expense' : 'Add Expense'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {message && (
          <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
            message.startsWith('success:') 
              ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' 
              : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
          }`}>
            {message.replace('success:', '').replace('error:', '')}
          </div>
        )}

        <div>
          <label className="block text-[13px] font-medium text-dark-300 mb-2">Title *</label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Lunch, Groceries"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 glass-input text-sm placeholder:text-dark-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-dark-300 mb-2">Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">₹</span>
              <input
                name="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full pl-8 pr-4 py-3 glass-input text-sm placeholder:text-dark-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-dark-300 mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 glass-input text-sm appearance-none cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name} className="bg-dark-800 text-dark-100">{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-dark-300 mb-2">Description</label>
          <textarea
            name="description"
            placeholder="Optional notes..."
            value={formData.description}
            onChange={handleChange}
            rows="2"
            className="w-full px-4 py-3 glass-input text-sm placeholder:text-dark-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-dark-300 mb-2">Payment Method</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full px-4 py-3 glass-input text-sm appearance-none cursor-pointer"
          >
            <option value="Cash" className="bg-dark-800">💵 Cash</option>
            <option value="Card" className="bg-dark-800">💳 Card</option>
            <option value="UPI" className="bg-dark-800">📱 UPI</option>
            <option value="Net Banking" className="bg-dark-800">🏦 Net Banking</option>
            <option value="Wallet" className="bg-dark-800">👛 Wallet</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-3 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="spinner-sm" />
                <span className="relative z-10">{editingExpense ? 'Updating...' : 'Adding...'}</span>
              </>
            ) : <span className="relative z-10">{editingExpense ? 'Update Expense' : 'Add Expense'}</span>}
          </button>
          {editingExpense && (
            <button 
              type="button"
              onClick={onEditCancel}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-dark-300 text-sm font-medium rounded-xl transition-colors border border-white/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
