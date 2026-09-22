import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { Users, Lock, Mail, ArrowRight, Sparkles, Eye, EyeOff, Sun, Moon, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    if (name === 'email') {
      if (!value) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Please enter a valid email address';
      else delete newErrors.email;
    }
    if (name === 'password') {
      if (!value) newErrors.password = 'Password is required';
      else if (value.length < 6) newErrors.password = 'Password must be at least 6 characters';
      else delete newErrors.password;
    }
    setErrors(newErrors);
  };

  const handleBlur = (name) => {
    setTouched({ ...touched, [name]: true });
    validateField(name, name === 'email' ? email : password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    validateField('email', email);
    validateField('password', password);
    setTouched({ email: true, password: true });

    if (!email || !password || Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/professor' : '/student');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    try {
      const user = await login(demoEmail, 'password123');
      toast.success(`Logged in as ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/professor' : '/student');
    } catch (err) {
      toast.error(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (field) => {
    const base = 'block w-full pl-10 pr-10 py-3 text-sm bg-white dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';
    if (touched[field] && errors[field]) {
      return `${base} border-danger-400 dark:border-danger-500 focus:ring-danger-500/30 focus:border-danger-500`;
    }
    if (touched[field] && !errors[field]) {
      return `${base} border-success-400 dark:border-success-500 focus:ring-success-500/30 focus:border-success-500`;
    }
    return `${base} border-slate-200 dark:border-slate-700/80 focus:ring-brand-500/30 focus:border-brand-500`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
      {/* Floating geometric shapes */}
      <div className="floating-shape w-72 h-72 bg-brand-500 top-[10%] left-[5%] animate-float" />
      <div className="floating-shape w-96 h-96 bg-purple-500 bottom-[10%] right-[5%] animate-float-delayed" />
      <div className="floating-shape w-48 h-48 bg-indigo-400 top-[60%] left-[60%] animate-float" />
      <div className="floating-shape w-32 h-32 bg-cyan-400 top-[20%] right-[20%] animate-float-delayed" />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white shadow-lg backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <><Sun className="w-4 h-4 text-amber-400" /><span className="hidden sm:inline">Light</span></>
          ) : (
            <><Moon className="w-4 h-4 text-indigo-300" /><span className="hidden sm:inline">Dark</span></>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 animate-bounce-in">
            <Users className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-white">
          JoinEazy
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          Student, Group & Assignment Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20 dark:border-slate-800/80 transition-colors duration-200">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="login-email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField('email', e.target.value); }}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@joineazy.edu"
                  className={getInputClass('email')}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-danger-500 font-medium animate-fade-in">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password', e.target.value); }}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={getInputClass('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-danger-500 font-medium animate-fade-in">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 hover:shadow-glow cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in...</span></>
              ) : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Demo Logins</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { email: 'professor@joineazy.edu', emoji: '🎓', name: 'Dr. Evelyn Reed (Professor)', desc: 'Manage assignments, track group progress & analytics' },
                { email: 'alex@joineazy.edu', emoji: '🧑‍💻', name: 'Alex Chen (Student Leader)', desc: 'Leader of "Quantum Coders", manage members & submit' },
                { email: 'emily@joineazy.edu', emoji: '🌟', name: 'Emily Zhang (Unassigned Student)', desc: 'Test creating a new group or joining one' },
              ].map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickLogin(demo.email)}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 transition-colors">
                      {demo.emoji} {demo.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {demo.desc}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
