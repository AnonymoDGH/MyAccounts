import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AgeGate from './components/AgeGate';
import Header from './components/Header';
import Hero from './components/Hero';
import Shop from './components/Shop';
import FAQ from './components/FAQ';
import Safety from './components/Safety';
import Contact from './components/Contact';
import CartDrawer from './components/CartDrawer';
import LoginModal from './components/LoginModal';
import Economy from './components/Economy';
import Admin from './components/Admin';

interface CartItem { id: string | number; name: string; qty: number; image: string; }

type Page = 'home' | 'shop' | 'economy' | 'safety' | 'faq' | 'contact' | 'admin';

const PAGE_PATHS: Record<Page, string> = {
  home: '/',
  shop: '/shop',
  economy: '/economy',
  safety: '/safety',
  faq: '/faq',
  contact: '/contact',
  admin: '/admin',
};

const PATH_TO_PAGE: Record<string, Page> = {
  '/': 'home',
  '/home': 'home',
  '/shop': 'shop',
  '/economy': 'economy',
  '/safety': 'safety',
  '/faq': 'faq',
  '/contact': 'contact',
  '/admin': 'admin',
};

const LOGO_URL = 'https://raw.githubusercontent.com/skelettn/MyDrugs2.0/main/assets/logo.png';

const DEFAULT_PRODUCTS = [
  {
    id: 'p1', name: 'Netflix Premium 1 Month', image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    btc_price: '0.00013', eth_price: '0.00223', tag: 'POPULAR', glow_color: 'rgba(229,9,20,0.25)', in_stock: true
  },
  {
    id: 'p2', name: 'Spotify Premium 3 Months', image: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
    btc_price: '0.00008', eth_price: '0.00142', tag: 'HOT', glow_color: 'rgba(30,215,96,0.25)', in_stock: true
  },
  {
    id: 'p3', name: 'Disney+ 1 Year', image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
    btc_price: '0.00014', eth_price: '0.00261', tag: 'PREMIUM', glow_color: 'rgba(0,114,206,0.2)', in_stock: true
  },
  {
    id: 'p4', name: 'Crunchyroll Mega Fan', image: 'https://media.discordapp.net/attachments/1377724259882762432/1489124840437846167/Crunchyroll-Manga-precio-y-fecha-estreno-removebg-preview.png?ex=69cf4714&is=69cdf594&hm=b7240f9a4a135b65784187fe6a0ed539c9d1eabc4754b5031050b6cb11aa75af&=&format=webp&quality=lossless&width=519&height=390',
    btc_price: '0.00016', eth_price: '0.00341', tag: 'NEW', glow_color: 'rgba(244,117,33,0.25)', in_stock: true
  }
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [ageAccepted, setAgeAccepted] = useState(() => {
    return localStorage.getItem('md_age') === 'yes';
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    fetchFeatured();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchFeatured() {
    try {
      setLoadingFeatured(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) {
        console.error('Failed to fetch featured products:', error);
        setFeaturedProducts(DEFAULT_PRODUCTS);
      } else if (data && data.length > 0) {
        setFeaturedProducts(data);
      } else {
        setFeaturedProducts(DEFAULT_PRODUCTS);
      }
    } catch (err) {
      console.error('Failed to fetch featured products:', err);
      setFeaturedProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoadingFeatured(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const page = PATH_TO_PAGE[normalizedPath] ?? 'home';

  const handleAcceptAge = () => {
    localStorage.setItem('md_age', 'yes');
    setAgeAccepted(true);
  };

  const handleAddToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: item.qty } : i);
      }
      return [...prev, item];
    });
    setCartOpen(true);
  };

  const handleBuyNow = (item: CartItem) => {
    handleAddToCart(item);
  };

  const handleHeroBuyNow = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: item.qty } : i);
      }
      return [...prev, item];
    });
    navigateTo('shop');
  };

  const handleRemoveFromCart = (id: string | number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setLoginOpen(true);
  };

  const navigateTo = (p: string) => {
    const target = (p in PAGE_PATHS ? (p as Page) : 'home');
    navigate(PAGE_PATHS[target]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [normalizedPath]);

  useEffect(() => {
    if (!PATH_TO_PAGE[normalizedPath]) {
      navigate('/', { replace: true });
    }
  }, [normalizedPath, navigate]);

  if (!ageAccepted) {
    return <AgeGate onAccept={handleAcceptAge} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        page={page}
        setPage={navigateTo}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        onLoginOpen={() => setLoginOpen(true)}
        onLogout={handleLogout}
        user={user}
        onTickerVisibleChange={setTickerVisible}
      />

      <main style={{ flex: 1, marginTop: page === 'home' ? (tickerVisible ? 36 : 0) : (tickerVisible ? 96 : 60) }}>
        {page === 'home' && (
          <>
            <Hero 
              onAddToCart={handleAddToCart} 
              onBuyNow={handleHeroBuyNow}
              onShop={() => navigateTo('shop')} 
            />

            {/* Mini shop preview */}
            <div style={{ background: 'var(--nav-bg)', padding: '80px 80px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div className="section-title">
                    <i className="bi bi-fire"></i> Top Sellers
                  </div>
                  <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em' }}>Featured Accounts</h2>
                </div>
                <button
                  onClick={() => navigateTo('shop')}
                  style={{
                    padding: '10px 24px', border: '1.5px solid var(--border)',
                    borderRadius: 30, background: 'transparent',
                    color: 'var(--text-muted)', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <i className="bi bi-grid-fill" style={{ fontSize: 14 }}></i>
                  View All
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                {loadingFeatured ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="shop-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                      <div style={{ height: 180, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 16 }} />
                      <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '70%', marginBottom: 10 }} />
                      <div style={{ height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '40%' }} />
                    </div>
                  ))
                ) : featuredProducts.length > 0 ? (
                  featuredProducts.map(p => (
                    <div className="shop-card" key={p.id}>
                      {p.tag && (
                        <div style={{
                          position: 'absolute', top: 14, right: 14,
                          padding: '4px 12px', borderRadius: 20,
                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                          color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: 5, zIndex: 5,
                        }}>
                          <i className="bi bi-stars" style={{ fontSize: 11 }}></i>
                          {p.tag}
                        </div>
                      )}
                      <img src={p.image} alt={p.name} className="shop-card-img" />
                      <div className="shop-card-name">{p.name}</div>
                      <div className="shop-card-price">
                        <i className="bi bi-currency-bitcoin"></i>
                        {p.btc_price} BTC / {p.eth_price} ETH
                      </div>
                      <div className="shop-card-stock" style={{ marginBottom: 20 }}>
                        <i className="bi bi-circle-fill" style={{ color: p.in_stock ? 'var(--green)' : '#e74c3c' }}></i>
                        {p.in_stock ? 'In Stock' : 'Out of Stock'}
                      </div>
                      <button
                        className="shop-card-atc"
                        onClick={() => handleAddToCart({ id: p.id, name: p.name, qty: 1, image: p.image })}
                        disabled={!p.in_stock}
                        style={{ opacity: p.in_stock ? 1 : 0.5 }}
                      >
                        <i className="bi bi-bag-plus"></i>
                        Add to Cart
                      </button>
                      <button
                        className="shop-card-buy"
                        onClick={() => handleBuyNow({ id: p.id, name: p.name, qty: 1, image: p.image })}
                        disabled={!p.in_stock}
                        style={{ opacity: p.in_stock ? 1 : 0.5 }}
                      >
                        <i className="bi bi-lightning-charge-fill"></i>
                        Buy Now
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No products found. Add some in the Admin panel!
                  </div>
                )}
              </div>
            </div>

            {/* Stats section */}
            <div style={{ padding: '80px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {[
                { num: '99.9%', label: 'Service Uptime', icon: 'bi-patch-check-fill' },
                { num: '50K+', label: 'Happy Customers', icon: 'bi-people-fill' },
                { num: 'Instant', label: 'Delivery Time', icon: 'bi-lightning-fill' },
                { num: '100%', label: 'Warranty Cover', icon: 'bi-shield-fill-check' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-icon"><i className={`bi ${s.icon}`}></i></div>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trust section */}
            <div style={{
              padding: '60px 80px', background: 'var(--nav-bg)',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                <div className="section-title" style={{ justifyContent: 'center' }}>
                  <i className="bi bi-shield-fill-check"></i> Why Choose Us
                </div>
                <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 48, letterSpacing: '-0.02em' }}>
                  Built on Trust & Security
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                  {[
                    { icon: 'bi-lock-fill', title: 'Secure Transactions', desc: 'All payments and account details are handled through secure, encrypted channels.' },
                    { icon: 'bi-eye-slash-fill', title: 'Privacy First', desc: 'We value your privacy. No unnecessary personal data is stored on our servers.' },
                    { icon: 'bi-fingerprint', title: 'Instant Access', desc: 'Receive your account credentials immediately after payment confirmation.' },
                  ].map(t => (
                    <div key={t.title} style={{ padding: '24px', textAlign: 'center' }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}>
                        <i className={`bi ${t.icon}`} style={{ fontSize: 24, color: '#f5f5f5' }}></i>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{t.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {page === 'shop' && <Shop onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />}
        {page === 'economy' && <Economy onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />}
        {page === 'faq' && <FAQ />}
        {page === 'safety' && <Safety />}
        {page === 'contact' && <Contact />}
        {page === 'admin' && <Admin />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-name">
              <img src={LOGO_URL} alt="MyAccounts" />
              MYACCOUNTS
            </div>
            <div className="footer-brand-desc">
              Premium Digital Accounts Store
            </div>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Navigation</div>
            <span className="footer-col-link" onClick={() => navigateTo('home')}>
              <i className="bi bi-house-fill" style={{ marginRight: 8, fontSize: 12 }}></i>Home
            </span>
            <span className="footer-col-link" onClick={() => navigateTo('shop')}>
              <i className="bi bi-shop" style={{ marginRight: 8, fontSize: 12 }}></i>Shop
            </span>
            <span className="footer-col-link" onClick={() => navigateTo('faq')}>
              <i className="bi bi-question-circle" style={{ marginRight: 8, fontSize: 12 }}></i>FAQ
            </span>
            <span className="footer-col-link" onClick={() => navigateTo('contact')}>
              <i className="bi bi-envelope" style={{ marginRight: 8, fontSize: 12 }}></i>Contact
            </span>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Products</div>
            <span className="footer-col-link" onClick={() => navigateTo('economy')}>
              <i className="bi bi-tags-fill" style={{ marginRight: 8, fontSize: 12 }}></i>Economy
            </span>
            <span className="footer-col-link" onClick={() => navigateTo('safety')}>
              <i className="bi bi-shield-check" style={{ marginRight: 8, fontSize: 12 }}></i>Safety
            </span>
          </div>

          <div className="footer-col">
            <div className="footer-col-title">Security</div>
            <span className="footer-col-link">
              <i className="bi bi-lock-fill" style={{ marginRight: 8, fontSize: 12 }}></i>Encrypted
            </span>
            <span className="footer-col-link">
              <i className="bi bi-currency-bitcoin" style={{ marginRight: 8, fontSize: 12 }}></i>Crypto Only
            </span>
            <span className="footer-col-link">
              <i className="bi bi-shield-fill-check" style={{ marginRight: 8, fontSize: 12 }}></i>Verified
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            <i className="bi bi-c-circle" style={{ marginRight: 6 }}></i>
            2024 MyAccounts 2.0
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      {/* Login Modal */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  );
}
