import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Navigation links
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/expenses', label: 'Expenses', icon: '💰' },
    { path: '/budget', label: 'Budget', icon: '🎯' },
  ];

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/dashboard" className="logo-link">
            <div className="logo-icon">💰</div>
            <div className="logo-text">
              <h1>ExpenseTracker</h1>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          <ul className="nav-links">
            {navLinks.map(link => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={location.pathname === link.path ? 'active' : ''}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Dropdown */}
        <div className="user-dropdown-container">
          <div 
            className="user-avatar-trigger"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="avatar-circle">
              {getInitials(user?.name || 'User')}
            </div>
          </div>

          {showDropdown && (
            <div className="user-dropdown-menu">
              {/* User Info Section */}
              <div className="user-info-section">
                <div className="user-avatar-large">
                  {getInitials(user?.name || 'User')}
                </div>
                <div className="user-details">
                  <div className="user-name">{user?.name || 'User'}</div>
                  <div className="user-email">{user?.email || 'user@example.com'}</div>
                </div>
              </div>

              {/* Divider */}
              <div className="dropdown-divider"></div>

              {/* Logout Button */}
              <button onClick={handleLogout} className="logout-button">
                <span className="logout-icon">↩️</span>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Close dropdown when clicking outside */}
        {showDropdown && (
          <div 
            className="dropdown-backdrop"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;