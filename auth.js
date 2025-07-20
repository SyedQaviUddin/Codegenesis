import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API = process.env.NEXT_PUBLIC_API || 'http://127.0.0.1:8000';

export default function Auth({ theme, toggleTheme, login }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    full_name: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const formData = new FormData();
        formData.append('username', form.username);
        formData.append('password', form.password);
        
        const res = await fetch(`${API}/users/token`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('token', data.access_token);
          login(data.user);
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => router.push('/'), 1000);
        } else {
          setError(data.detail || 'Login failed. Please check your credentials.');
        }
      } else {
        // Registration
        const res = await fetch(`${API}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
            full_name: form.full_name || form.username
          })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setSuccess('Registration successful! Please login.');
          setMode('login');
          setForm({ username: form.username, email: '', password: '', full_name: '' });
        } else {
          setError(data.detail || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (mode === 'login') {
      return form.username && form.password;
    } else {
      return form.username && form.email && form.password && form.password.length >= 6;
    }
  };

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Login' : 'Register'} - CodeGenesis</title>
        <meta name="description" content="Login or register to CodeGenesis" />
      </Head>

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="/" className="logo">
              🚀 CodeGenesis
            </a>
            
            <nav className="nav">
              <a href="/" className="nav-link">Home</a>
              <button 
                onClick={toggleTheme} 
                className="btn btn-secondary btn-sm"
                style={{ minWidth: '40px', padding: '0.5rem' }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ 
        paddingTop: '2rem', 
        paddingBottom: '2rem',
        minHeight: 'calc(100vh - var(--header-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card fade-in" style={{ 
          maxWidth: '400px', 
          width: '100%',
          padding: '2rem'
        }}>
          <div className="text-center mb-lg">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {mode === 'login' ? '🔐' : '📝'}
            </div>
            <h1>{mode === 'login' ? 'Welcome Back' : 'Join CodeGenesis'}</h1>
            <p className="text-secondary">
              {mode === 'login' 
                ? 'Sign in to your account to continue' 
                : 'Create your account to get started'
              }
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error mb-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-lg">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="form-input"
                required
                minLength={mode === 'register' ? 6 : undefined}
              />
              {mode === 'register' && (
                <small className="text-muted">
                  Password must be at least 6 characters long
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <>
                  <div className="loading"></div>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="text-center mt-lg">
            <p className="text-secondary">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
                setForm({ username: '', email: '', password: '', full_name: '' });
              }}
              className="btn btn-secondary"
              disabled={loading}
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          {/* Demo Credentials */}
          {mode === 'login' && (
            <div className="mt-lg p-md" style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <p className="text-secondary mb-sm">
                <strong>Demo Credentials:</strong>
              </p>
              <p className="text-muted mb-xs">Username: demo</p>
              <p className="text-muted">Password: demo123</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 