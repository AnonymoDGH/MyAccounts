import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import { supabase } from '../lib/supabase';

interface CartItem { id: string | number; name: string; qty: number; image: string; }
interface ShopProps {
  cart: CartItem[];
  onUpdateCartQty: (item: CartItem) => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
  onSupplierClick?: (supplierId: string) => void;
}

interface Product {
  id: string;
  name: string;
  image: string;
  usd_price: string;
  eur_price: string;
  tag: string | null;
  glow_color: string;
  in_stock?: boolean;
  is_active?: boolean;
  supplier?: { id: string; username: string; avatar_url: string; } | null;
}

const TAG_CONFIG: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  HOT: { bg: 'rgba(231,76,60,0.12)', border: 'rgba(231,76,60,0.3)', color: '#e74c3c', icon: 'bi-fire' },
  NEW: { bg: 'rgba(39,174,96,0.12)', border: 'rgba(39,174,96,0.3)', color: '#2ecc71', icon: 'bi-stars' },
  PREMIUM: { bg: 'rgba(142,68,173,0.12)', border: 'rgba(142,68,173,0.3)', color: '#9b59b6', icon: 'bi-gem' },
  POPULAR: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', color: '#e5e7eb', icon: 'bi-heart-fill' },
};

const FILTERS = [
  { label: 'All', icon: 'bi-grid-fill' },
  { label: 'Popular', icon: 'bi-heart-fill' },
  { label: 'Premium', icon: 'bi-gem' },
  { label: 'New', icon: 'bi-stars' },
  { label: 'Hot', icon: 'bi-fire' },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Netflix Premium 1 Month', image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    usd_price: '1.00', eur_price: '0.92', tag: 'POPULAR', glow_color: 'rgba(229,9,20,0.25)', in_stock: true
  },
  {
    id: 'p2', name: 'Spotify Premium 3 Months', image: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
    usd_price: '0.80', eur_price: '0.75', tag: 'HOT', glow_color: 'rgba(30,215,96,0.25)', in_stock: true
  },
  {
    id: 'p3', name: 'Disney+ 1 Year', image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
    usd_price: '0.60', eur_price: '0.55', tag: 'PREMIUM', glow_color: 'rgba(0,114,206,0.2)', in_stock: true
  },
  {
    id: 'p4', name: 'Crunchyroll Mega Fan', image: 'https://media.discordapp.net/attachments/1377724259882762432/1489124840437846167/Crunchyroll-Manga-precio-y-fecha-estreno-removebg-preview.png?ex=69cf4714&is=69cdf594&hm=b7240f9a4a135b65784187fe6a0ed539c9d1eabc4754b5031050b6cb11aa75af&=&format=webp&quality=lossless&width=519&height=390',
    usd_price: '0.30', eur_price: '0.28', tag: 'NEW', glow_color: 'rgba(244,117,33,0.25)', in_stock: true
  },
  {
    id: 'p5', name: 'Discord Nitro Basic', image: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/688bbfec88fb6c55f8e87c0f_imgonline-com-ua-Resize-JSJAo2mDwZhTEs.webp',
    usd_price: '0.60', eur_price: '0.55', tag: 'POPULAR', glow_color: 'rgba(88,101,242,0.25)', in_stock: true
  },
  {
    id: 'p6', name: 'Discord Nitro Boost', image: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/688bbfec88fb6c55f8e87c0f_imgonline-com-ua-Resize-JSJAo2mDwZhTEs.webp',
    usd_price: '2.90', eur_price: '2.65', tag: 'PREMIUM', glow_color: 'rgba(255,115,250,0.25)', in_stock: true
  }
];

export default function Shop({ cart, onUpdateCartQty, onAddToCart, onBuyNow, onSupplierClick }: ShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'price-low' | 'price-high'>('featured');
  const [currency, setCurrency] = useState<'usd' | 'eur'>('usd');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*, supplier:users!supplier_id(id, username, avatar_url)');
      if (error) {
        console.error('Error fetching products:', error);
        setProducts(DEFAULT_PRODUCTS);
      } else if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(DEFAULT_PRODUCTS);
      }
    } catch (err) {
      console.error('Unexpected error fetching products:', err);
      setProducts(DEFAULT_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }

  const getCartQty = (id: string) => {
    return cart.find(item => item.id === id)?.qty || 0;
  };

  const decQty = (p: Product) => {
    const currentQty = getCartQty(p.id);
    if (currentQty > 0) {
      onUpdateCartQty({ id: p.id, name: p.name, qty: currentQty - 1, image: p.image, price: Number(p.usd_price) });
    }
  };

  const incQty = (p: Product) => {
    const currentQty = getCartQty(p.id);
    onUpdateCartQty({ id: p.id, name: p.name, qty: currentQty + 1, image: p.image, price: Number(p.usd_price) });
  };

  const filtered = useMemo(() => {
    const byFilter = activeFilter === 'All'
      ? products
      : products.filter(p => p.tag?.toUpperCase() === activeFilter.toUpperCase());

    const bySearch = search.trim().length === 0
      ? byFilter
      : byFilter.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    const sorted = [...bySearch];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => Number(a.usd_price) - Number(b.usd_price));
    }
    if (sortBy === 'price-high') {
      sorted.sort((a, b) => Number(b.usd_price) - Number(a.usd_price));
    }

    return sorted;
  }, [activeFilter, search, sortBy, products]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="page-enter">
      <div style={{
        background: 'linear-gradient(135deg, var(--nav-bg) 0%, var(--card-bg) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '60px 80px 40px',
      }}>
        <div className="section-title">
          <i className="bi bi-shop"></i> Our Products
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 className="section-heading" style={{ marginBottom: 0 }}>The Shop</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 440, lineHeight: 1.7 }}>
            <i className="bi bi-patch-check-fill" style={{ color: 'var(--accent2)', marginRight: 6 }}></i>
            All accounts are 100% verified and include a full warranty. Secure payments accepted in BTC and ETH.
          </p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 48 }}>
        {/* Filter bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 16,
          marginBottom: 24,
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            {FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.label)}
                style={{
                  padding: '8px 20px', borderRadius: 30,
                  border: activeFilter === f.label ? '1.5px solid var(--accent2)' : '1.5px solid var(--border)',
                  background: activeFilter === f.label ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: activeFilter === f.label ? 'white' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <i className={`bi ${f.icon}`} style={{ fontSize: 13 }}></i>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <i className="bi bi-search" style={{ color: 'var(--text-muted)', fontSize: 12 }}></i>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search product"
                style={{
                  background: 'transparent', border: 'none', outline: 'none', color: 'white',
                  fontSize: 12, width: 130,
                }}
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'featured' | 'name' | 'price-low' | 'price-high')}
              style={{
                padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)', color: 'white', fontSize: 12,
              }}
            >
              <option value="featured" style={{ color: 'black' }}>Featured</option>
              <option value="name" style={{ color: 'black' }}>Name A-Z</option>
              <option value="price-low" style={{ color: 'black' }}>Price: Low to High</option>
              <option value="price-high" style={{ color: 'black' }}>Price: High to Low</option>
            </select>

            <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <button
                onClick={() => setCurrency('usd')}
                style={{
                  padding: '8px 12px', border: 'none', background: currency === 'usd' ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: currency === 'usd' ? 'white' : 'var(--text-muted)', fontSize: 11, fontWeight: 700,
                }}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency('eur')}
                style={{
                  padding: '8px 12px', border: 'none', background: currency === 'eur' ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: currency === 'eur' ? 'white' : 'var(--text-muted)', fontSize: 11, fontWeight: 700,
                }}
              >
                EUR
              </button>
            </div>

            <button
              onClick={() => {
                setSearch('');
                setSortBy('featured');
                setActiveFilter('All');
              }}
              style={{
                padding: '9px 12px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="shop-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shop-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                <div style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 16 }} />
                <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '70%', marginBottom: 10 }} />
                <div style={{ height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '40%' }} />
              </div>
            ))
          ) : filtered.map(p => {
            const tagConf = p.tag ? TAG_CONFIG[p.tag] : null;
            return (
              <div className="shop-card" key={p.id}>
                <button
                  onClick={() => toggleFavorite(p.id)}
                  title={favorites[p.id] ? 'Remove from favorites' : 'Add to favorites'}
                  style={{
                    position: 'absolute', top: 14, left: 14,
                    width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                    background: 'rgba(0,0,0,0.4)', color: favorites[p.id] ? '#ff4d6d' : 'rgba(255,255,255,0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6,
                  }}
                >
                  <i className={`bi ${favorites[p.id] ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                </button>

                {tagConf && (
                  <div style={{
                    position: 'absolute', top: 14, right: 14,
                    padding: '4px 12px', borderRadius: 20,
                    background: tagConf.bg, border: `1px solid ${tagConf.border}`,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    color: tagConf.color, display: 'flex', alignItems: 'center', gap: 5, zIndex: 5,
                  }}>
                    <i className={`bi ${tagConf.icon}`} style={{ fontSize: 11 }}></i>
                    {p.tag}
                  </div>
                )}

                <div className="shop-card-media" style={{ '--drug-glow': p.glow_color } as CSSProperties}>
                  <img src={p.image} alt={p.name} className="shop-card-img" />
                </div>
                <div className="shop-card-name">{p.name}</div>
                <div className="shop-card-price">
                  <i className={`bi bi-currency-${currency === 'usd' ? 'dollar' : 'euro'}`}></i>
                  {currency === 'usd' ? `${p.usd_price} USD` : `${p.eur_price} EUR`}
                </div>
                <div className="shop-card-stock">
                  <i className="bi bi-circle-fill" style={{ color: p.is_active === false ? '#e74c3c' : (p.in_stock ? 'var(--green)' : '#e74c3c') }}></i>
                  {p.is_active === false ? 'Unavailable' : (p.in_stock ? 'In Stock' : 'Out of Stock')}
                </div>

                {p.supplier && onSupplierClick && (
                  <div 
                    onClick={() => onSupplierClick(p.supplier!.id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 16, paddingTop: 12, 
                      borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' 
                    }}
                  >
                    <img src={p.supplier.avatar_url || 'https://via.placeholder.com/24'} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sold by <strong style={{color: '#fff'}}>{p.supplier.username || 'Unknown'}</strong></span>
                  </div>
                )}

                <div className="shop-card-qty">
                  <button
                    className="qty-btn"
                    onClick={() => decQty(p)}
                    disabled={getCartQty(p.id) <= 0 || !p.in_stock || p.is_active === false}
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <span className="qty-num">{getCartQty(p.id)}</span>
                  <button className="qty-btn" onClick={() => incQty(p)} disabled={!p.in_stock || p.is_active === false}>
                    <i className="bi bi-plus"></i>
                  </button>
                </div>

                <button
                  className="shop-card-buy"
                  onClick={() => {
                    const currentQty = getCartQty(p.id);
                    onBuyNow({ id: p.id, name: p.name, qty: currentQty === 0 ? 1 : currentQty, image: p.image, price: Number(p.usd_price) });
                  }}
                  disabled={!p.in_stock || p.is_active === false}
                  style={{ opacity: (p.in_stock && p.is_active !== false) ? 1 : 0.5, cursor: (p.in_stock && p.is_active !== false) ? 'pointer' : 'not-allowed', gridColumn: 'span 2' }}
                >
                  <i className="bi bi-lightning-charge-fill"></i>
                  {p.is_active === false ? 'Unavailable' : 'Buy Now'}
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}></i>
            No products found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
