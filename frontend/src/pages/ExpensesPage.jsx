import React, { useState } from 'react';
import AddExpense from '../components/expenses/AddExpense';
import ExpenseList from '../components/expenses/ExpenseList';
import Summary from '../components/expenses/Summary';

const ExpensesPage = () => {
  const [refresh, setRefresh] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleExpenseAdded = () => {
    setRefresh(!refresh);
    setEditingExpense(null);
  };

  const handleExpenseDeleted = () => {
    setRefresh(!refresh);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditCancel = () => {
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Expenses</h1>
          <p className="text-dark-400 text-sm mt-1">Track and manage your spending</p>
        </div>
      </div>
      
      {/* Summary stats */}
      <Summary refresh={refresh} />
      
      {/* Add/Edit form + Expense list */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <AddExpense 
            onExpenseAdded={handleExpenseAdded} 
            editingExpense={editingExpense}
            onEditCancel={handleEditCancel}
          />
        </div>
        <div className="xl:col-span-2">
          <ExpenseList refresh={refresh} onDelete={handleExpenseDeleted} onEdit={handleEditExpense} />
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
