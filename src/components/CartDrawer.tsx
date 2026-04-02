import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface CartItem { id: string | number; name: string; qty: number; image: string; }

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string | number) => void;
  onCheckout: () => void;
}

export default function CartDrawer({ open, onClose, items, onRemove, onCheckout }: CartDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + i.qty, 0);

  const handleSecureCheckout = async () => {
    setIsCheckingOut(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        onCheckout(); // Trigger login modal if not logged in
        setIsCheckingOut(false);
        return;
      }

      // Calculate a mock total USD for demonstration (you can replace this with real logic)
      const totalUsd = (total * 15.99).toFixed(2);

      // Call the Discord Bot API
      // Note: In production, this should point to where your bot is hosted (e.g., https://your-bot-domain.com/api/checkout)
      const response = await fetch('http://localhost:3001/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          items: items,
          totalUsd: totalUsd
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTicketUrl(data.ticketUrl);
      } else {
        setError(data.error || 'Failed to create ticket');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the checkout server.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <div className={`cart-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer${open ? ' open' : ''}`}>
        <div className="cart-drawer-header">
          <span className="cart-drawer-title">
            <i className="bi bi-bag-fill"></i>
            Cart ({total})
          </span>
          <button className="cart-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="cart-items">
          {ticketUrl ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: 48, color: 'var(--green)', marginBottom: 16, display: 'block' }}></i>
              <h3 style={{ marginBottom: 12 }}>Ticket Created!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Please continue with the payment and receive your accounts in your dedicated Discord ticket.
              </p>
              <a 
                href={ticketUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#5865F2', color: 'white', padding: '12px 24px',
                  borderRadius: 8, textDecoration: 'none', fontWeight: 600
                }}
              >
                <i className="bi bi-discord"></i> Go to Ticket
              </a>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <i className="bi bi-bag-x" style={{ fontSize: 44, display: 'block', marginBottom: 14, color: 'var(--accent)' }}></i>
              <p style={{ fontWeight: 600 }}>Your cart is empty</p>
              <p style={{ fontSize: 12, marginTop: 6, color: 'var(--text-muted)' }}>Start adding some products!</p>
            </div>
          ) : (
            items.map(item => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-qty">
                    <i className="bi bi-x-lg" style={{ fontSize: 9, marginRight: 2 }}></i>
                    {item.qty}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.3s', width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#e74c3c'; e.currentTarget.style.borderColor = '#e74c3c'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <i className="bi bi-trash3"></i>
                </button>
              </div>
            ))
          )}
          {error && (
            <div style={{ color: '#e74c3c', padding: 16, textAlign: 'center', fontSize: 13, background: 'rgba(231,76,60,0.1)', margin: 16, borderRadius: 8 }}>
              {error}
            </div>
          )}
        </div>

        {!ticketUrl && (
          <div className="cart-footer">
            {items.length > 0 && (
              <button className="cart-checkout-btn" onClick={handleSecureCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? (
                  <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                ) : (
                  <><i className="bi bi-lock-fill"></i> Secure Checkout</>
                )}
              </button>
            )}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <i className="bi bi-currency-bitcoin" style={{ color: 'var(--accent2)' }}></i>
              BTC · ETH · XRP · IOTA
            </p>
          </div>
        )}
      </div>
    </>
  );
}
