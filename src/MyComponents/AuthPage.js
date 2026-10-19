import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (mode === 'login' ? login : register)(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: 420 }}>
      <form onSubmit={submit} className="app-card">
        <h4 className="fw-bold mb-1">{mode === 'login' ? 'Welcome back' : 'Create account'}</h4>
        <p className="text-secondary small mb-3">
          Todos you made as a guest are saved to your account when you sign in.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="mb-3">
          <label htmlFor="email" className="app-label">Email</label>
          <input id="email" type="email" className="form-control app-input" value={email}
                 onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="app-label">Password</label>
          <input id="password" type="password" className="form-control app-input" value={password}
                 onChange={(e) => setPassword(e.target.value)} required minLength={8}
                 autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </div>

        <button type="submit" className="app-btn w-100" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <button type="button" className="btn btn-link w-100 mt-2"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? "No account? Sign up" : "Have an account? Log in"}
        </button>
      </form>
    </div>
  );
}