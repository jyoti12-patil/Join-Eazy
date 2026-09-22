import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { AnimatedCheckmark } from '../../components/AnimatedCheckmark';
import { Users, Lock, Mail, User, Hash, ArrowRight, Sun, Moon, Eye, EyeOff, Loader2, GraduationCap, BookOpen } from 'lucide-react';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-danger-400' };
    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-warning-400' };
    if (score <= 3) return { score: 3, label: 'Good', color: 'bg-warning-500' };
    if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-success-400' };
    return { score: 5, label: 'Very Strong', color: 'bg-success-500' };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1 animate-fade-in">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${
        strength.score <= 1 ? 'text-danger-500' : strength.score <= 3 ? 'text-warning-500' : 'text-success-500'
      }`}>
        {strength.label}
      </p>
    </div>
  );
};

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    studentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'name':
        if (!value.trim()) newErrors.name = 'Full name is required';
        else if (value.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
        else delete newErrors.name;
        break;
      case 'email':
        if (!value) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Please enter a valid email';
        else delete newErrors.email;
        break;
      case 'password':
        if (!value) newErrors.password = 'Password is required';
        else if (value.length < 6) newErrors.password = 'Password must be at least 6 characters';
        else delete newErrors.password;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched({ ...touched, [name]: true });
    validateField(name, formData[name]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldsToValidate = ['name', 'email', 'password'];
    const newTouched = {};
    fieldsToValidate.forEach((f) => {
      newTouched[f] = true;
      validateField(f, formData[f]);
    });
    setTouched({ ...touched, ...newTouched });

    if (!formData.name || !formData.email || !formData.password) return;
    if (formData.password.length < 6) return;

    setLoading(true);
    try {
      const user = await register(formData);
      setSuccess(true);
      toast.success(`Account created successfully! Welcome, ${user.name}`);
      setTimeout(() => {
        navigate(user.role === 'ADMIN' ? '/professor' : '/student');
      }, 1500);
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (field) => {
    const base = 'block w-full pl-10 pr-10 py-3 text-sm bg-white dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';
    if (touched[field] && errors[field]) return `${base} border-danger-400 dark:border-danger-500 focus:ring-danger-500/30 focus:border-danger-500`;
    if (touched[field] && !errors[field] && formData[field]) return `${base} border-success-400 dark:border-success-500 focus:ring-success-500/30 focus:border-success-500`;
    return `${base} border-slate-200 dark:border-slate-700/80 focus:ring-brand-500/30 focus:border-brand-500`;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 animate-scale-in">
          <AnimatedCheckmark size={80} />
          <h2 className="text-2xl font-bold text-white mt-4">Account Created!</h2>
          <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
      {/* Floating shapes */}
      <div className="floating-shape w-72 h-72 bg-brand-500 top-[10%] left-[5%] animate-float" />
      <div className="floating-shape w-96 h-96 bg-purple-500 bottom-[10%] right-[5%] animate-float-delayed" />
      <div className="floating-shape w-48 h-48 bg-indigo-400 top-[50%] left-[70%] animate-float" />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white shadow-lg backdrop-blur-md transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
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
          Create an Account
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-400">
          Join JoinEazy as a student or professor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-white/20 dark:border-slate-800/80 transition-colors duration-200">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Role selector cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    formData.role === 'STUDENT'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    formData.role === 'STUDENT'
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold ${
                    formData.role === 'STUDENT' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'
                  }`}>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    formData.role === 'ADMIN'
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    formData.role === 'ADMIN'
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold ${
                    formData.role === 'ADMIN' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'
                  }`}>Professor</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                <input type="text" required name="name" value={formData.name} onChange={handleChange} onBlur={() => handleBlur('name')} placeholder="e.g. Alex Chen" className={getInputClass('name')} />
              </div>
              {touched.name && errors.name && <p className="mt-1 text-xs text-danger-500 font-medium animate-fade-in">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Institutional Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4" /></div>
                <input type="email" required name="email" value={formData.email} onChange={handleChange} onBlur={() => handleBlur('email')} placeholder="alex@joineazy.edu" className={getInputClass('email')} />
              </div>
              {touched.email && errors.email && <p className="mt-1 text-xs text-danger-500 font-medium animate-fade-in">{errors.email}</p>}
            </div>

            {/* Student ID */}
            {formData.role === 'STUDENT' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Student ID (for group invites)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Hash className="w-4 h-4" /></div>
                  <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="e.g. STU-2026-101" className="block w-full pl-10 pr-3 py-3 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="At least 6 characters"
                  className={getInputClass('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && <p className="mt-1 text-xs text-danger-500 font-medium animate-fade-in">{errors.password}</p>}
              <PasswordStrength password={formData.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="register-submit"
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 hover:shadow-glow cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account...</span></>
              ) : (
                <><span>Complete Registration</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
