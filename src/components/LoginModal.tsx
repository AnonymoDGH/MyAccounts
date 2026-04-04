import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscordLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
        scopes: 'identify email guilds.join',
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className={`modal-overlay open`} onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <i className="bi bi-discord" style={{ fontSize: 40, color: '#5865F2' }}></i>
        </div>

        <div className="modal-title" style={{ textAlign: 'center' }}>
          Welcome to MyAccounts
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

        <div style={{ marginTop: 20 }}>
          <button 
            type="button"
            className="modal-submit" 
            onClick={handleDiscordLogin}
            disabled={loading}
            style={{ background: '#5865F2', marginBottom: 20 }}
          >
            <i className="bi bi-discord"></i>
            {loading ? 'Connecting...' : 'Login with Discord'}
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
          marginTop: 10, lineHeight: 1.7,
        }}>
          Only Discord login is supported to ensure secure and verified access.
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
