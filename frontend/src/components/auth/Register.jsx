import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await register({ name: formData.name, email: formData.email, password: formData.password });
    if (result.success) { navigate('/dashboard'); } else { setError(result.message || 'Registration failed'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex relative bg-dark-900">
      <div className="ambient-glow" />

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-start px-16 max-w-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-green to-emerald-600 rounded-2xl flex items-center justify-center mb-10">
            <span className="text-white text-2xl font-bold">₹</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Start your<br />financial journey<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-purple">today.</span>
          </h1>
          <p className="text-dark-300 text-lg leading-relaxed mb-12">
            Join thousands of users who are taking control of their finances with Expensify.
          </p>
          
          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            <div className="glass-card p-5 hover:border-brand-500/20">
              <p className="text-2xl font-bold text-white">₹0</p>
              <p className="text-dark-400 text-sm mt-1">Free forever</p>
            </div>
            <div className="glass-card p-5 hover:border-brand-500/20">
              <p className="text-2xl font-bold text-white">2 min</p>
              <p className="text-dark-400 text-sm mt-1">Quick setup</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-green to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">₹</span>
            </div>
            <span className="text-xl font-bold text-white">Expensify</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Create account</h2>
            <p className="text-dark-400 mt-2">Start tracking your expenses in seconds</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm rounded-xl backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                disabled={loading}
                className="w-full px-4 py-3 glass-input text-sm placeholder:text-dark-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
                className="w-full px-4 py-3 glass-input text-sm placeholder:text-dark-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 glass-input text-sm placeholder:text-dark-500 disabled:opacity-50 pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-dark-300 mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 glass-input text-sm placeholder:text-dark-500 disabled:opacity-50 pr-10"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="spinner-sm" />
                  <span className="relative z-10">Creating account...</span>
                </>
              ) : <span className="relative z-10">Create Account</span>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
