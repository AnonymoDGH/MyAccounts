import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        if (error.status === 400) setError('Invalid email or password');
        else setError(error.message);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    // Validation
    if (!trimmedEmail || !password || !trimmedUsername) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError('Username must be between 3 and 20 characters');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            username: trimmedUsername,
            display_name: trimmedUsername,
          }
        }
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.status === 422) {
          setError('Invalid email or password format. If you already have an account, please login.');
        } else {
          setError(error.message);
        }
      } else if (data.user && !data.session) {
        setSuccess('Registration successful! Please check your email inbox for the confirmation link.');
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else if (data.session) {
        setSuccess('Registration successful! You are now logged in.');
        onClose();
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={`modal-overlay open`} onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <i className="bi bi-person-circle" style={{ fontSize: 40, color: 'var(--accent2)' }}></i>
        </div>

        <div className="modal-title" style={{ textAlign: 'center' }}>
          {view === 'login' ? 'Welcome Back' : 'Create Account'}
        </div>
        
        {error && (
          <div style={{ 
            background: 'rgba(231,76,60,0.1)', 
            border: '1px solid rgba(231,76,60,0.3)', 
            color: '#e74c3c', 
            padding: '10px', 
            borderRadius: 8, 
            fontSize: 12, 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: 'rgba(46,204,113,0.1)', 
            border: '1px solid rgba(46,204,113,0.3)', 
            color: '#2ecc71', 
            padding: '10px', 
            borderRadius: 8, 
            fontSize: 12, 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={view === 'login' ? handleEmailLogin : handleEmailSignUp}>
          <button 
            type="button"
            className="modal-submit" 
            onClick={handleDiscordLogin}
            style={{ background: '#5865F2', marginBottom: 20 }}
          >
            <i className="bi bi-discord"></i>
            {view === 'login' ? 'Login with Discord' : 'Sign up with Discord'}
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            marginBottom: 20,
            color: 'var(--text-muted)',
            fontSize: 12
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            OR
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>

          {view === 'register' && (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <i className="bi bi-person" style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 16,
              }}></i>
              <input 
                className="modal-input" 
                type="text" 
                placeholder="Username (3-20 chars)" 
                style={{ paddingLeft: 42, marginBottom: 0 }} 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
              />
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: 14 }}>
            <i className="bi bi-envelope" style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: 16,
            }}></i>
            <input 
              className="modal-input" 
              type="email" 
              placeholder="Email Address" 
              style={{ paddingLeft: 42, marginBottom: 0 }} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ position: 'relative', marginBottom: 14 }}>
            <i className="bi bi-key" style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: 16,
            }}></i>
            <input 
              className="modal-input" 
              type="password" 
              placeholder="Password" 
              style={{ paddingLeft: 42, marginBottom: 0 }} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={view === 'login' ? "current-password" : "new-password"}
            />
          </div>

          {view === 'register' && (
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <i className="bi bi-shield-lock" style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 16,
              }}></i>
              <input 
                className="modal-input" 
                type="password" 
                placeholder="Confirm Password" 
                style={{ paddingLeft: 42, marginBottom: 0 }} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          )}

          <button className="modal-submit" type="submit" disabled={loading}>
            <i className="bi bi-box-arrow-in-right"></i>
            {loading ? 'Processing...' : (view === 'login' ? 'Login with Email' : 'Register with Email')}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
          marginTop: 22, lineHeight: 1.7,
        }}>
          {view === 'login' ? (
            <>
              Don't have an account?{' '}
              <span 
                style={{ color: 'var(--accent2)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { setView('register'); setError(null); setSuccess(null); }}
              >
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span 
                style={{ color: 'var(--accent2)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { setView('login'); setError(null); setSuccess(null); }}
              >
                Login
              </span>
            </>
          )}
          <br />
          <span style={{ fontSize: 11, opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
            <i className="bi bi-shield-fill-check" style={{ fontSize: 12 }}></i>
            Secure & Instant Access
          </span>
        </p>
      </div>
    </div>
  );
}
