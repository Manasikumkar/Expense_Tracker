import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/dashboard',
      description: 'Overview & Analytics'
    },
    {
      title: 'Expenses',
      icon: '💰',
      path: '/expenses',
      description: 'Manage Spending'
    },
    {
      title: 'Budget',
      icon: '🎯',
      path: '/budget',
      description: 'Plan & Track'
    },
    {
      title: 'Reports',
      icon: '📈',
      path: '/reports',
      description: 'Insights & Trends'
    },
    {
      title: 'Goals',
      icon: '🏆',
      path: '/goals',
      description: 'Financial Targets'
    },
    {
      title: 'Categories',
      icon: '🏷️',
      path: '/categories',
      description: 'Customize'
    },
    {
      title: 'Settings',
      icon: '⚙️',
      path: '/settings',
      description: 'Preferences'
    }
  ];

  const quickStats = [
    { label: 'Today', value: '₹ 1,250', trend: '+12%' },
    { label: 'This Week', value: '₹ 8,500', trend: '-5%' },
    { label: 'Budget Left', value: '₹ 15,200', trend: '42%' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="profile-avatar">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3>{user?.name || 'User'}</h3>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      <div className="sidebar-stats">
        <h4>Quick Stats</h4>
        <div className="stats-grid">
          {quickStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              <span className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                {stat.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      <nav className="sidebar-nav">
        <h4>Navigation</h4>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? 'nav-item active' : 'nav-item'
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-content">
                  <span className="nav-title">{item.title}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
                <span className="nav-arrow">→</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="budget-progress">
          <div className="progress-header">
            <span>Monthly Budget</span>
            <span>65% Used</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '65%' }}></div>
          </div>
          <div className="progress-details">
            <span>₹ 6,500 / ₹ 10,000</span>
            <span className="remaining">₹ 3,500 Left</span>
          </div>
        </div>
        
        <button className="premium-upgrade">
          <span className="premium-icon">⭐</span>
          Upgrade to Premium
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;