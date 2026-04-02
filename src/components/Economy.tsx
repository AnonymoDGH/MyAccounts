import { useMemo, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CartItem { id: string | number; name: string; qty: number; image: string; }
interface Props {
  cart: CartItem[];
  onUpdateCartQty: (item: CartItem) => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
}

interface Bundle {
  id: string;
  name: string;
  image: string;
  description: string;
  btc: string;
  eth: string;
  savings: number;
}

const DEFAULT_BUNDLES: Bundle[] = [
  {
    id: '101', name: 'STREAMING STARTER', image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    description: 'Get the best of both worlds. Includes Netflix Premium + Disney+ Annual access.',
    btc: '0.00023', eth: '0.00412', savings: 15,
  },
  {
    id: '102', name: 'ANIME & CHAT', image: 'https://media.discordapp.net/attachments/1377724259882762432/1489124840437846167/Crunchyroll-Manga-precio-y-fecha-estreno-removebg-preview.png?ex=69cf4714&is=69cdf594&hm=b7240f9a4a135b65784187fe6a0ed539c9d1eabc4754b5031050b6cb11aa75af&=&format=webp&quality=lossless&width=519&height=390',
    description: 'The ultimate combo for fans. Includes Crunchyroll Mega + Discord Nitro Monthly.',
    btc: '0.00022', eth: '0.00395', savings: 20,
  },
  {
    id: '103', name: 'ULTIMATE FAMILY', image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
    description: 'Everything your family needs. Netflix Premium + Disney+ + Crunchyroll Mega.',
    btc: '0.00032', eth: '0.00581', savings: 25,
  },
  {
    id: '104', name: 'DISCORD BULK', image: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/688bbfec88fb6c55f8e87c0f_imgonline-com-ua-Resize-JSJAo2mDwZhTEs.webp',
    description: "Buy 5 Discord Nitro Monthly codes at once and save big. Perfect for gifting.",
    btc: '0.00042', eth: '0.00752', savings: 30,
  },
];

export default function Economy({ cart, onUpdateCartQty, onAddToCart, onBuyNow }: Props) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'deal' | 'btc-low' | 'btc-high'>('deal');
  const [discountFilter, setDiscountFilter] = useState<'all' | '15' | '20'>('all');
  const [currency, setCurrency] = useState<'btc' | 'eth'>('btc');

  useEffect(() => {
    async function fetchBundles() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('bundles').select('*').order('created_at', { ascending: true });
        if (error) {
          console.error('Error fetching bundles:', error);
          setBundles(DEFAULT_BUNDLES);
        } else if (data && data.length > 0) {
          setBundles(data);
        } else {
          setBundles(DEFAULT_BUNDLES);
        }
      } catch (err) {
        console.error('Unexpected error fetching bundles:', err);
        setBundles(DEFAULT_BUNDLES);
      } finally {
        setLoading(false);
      }
    }
    fetchBundles();
  }, []);

  const getCartQty = (id: string) => {
    return cart.find(item => item.id === id)?.qty || 0;
  };

  const decreaseQty = (b: Bundle) => {
    const currentQty = getCartQty(b.id);
    if (currentQty > 0) {
      onUpdateCartQty({ id: b.id, name: b.name, qty: currentQty - 1, image: b.image });
    }
  };

  const increaseQty = (b: Bundle) => {
    const currentQty = getCartQty(b.id);
    onUpdateCartQty({ id: b.id, name: b.name, qty: currentQty + 1, image: b.image });
  };

  const filteredBundles = useMemo(() => {
    const bySearch = search.trim().length === 0
      ? bundles
      : bundles.filter(bundle => bundle.name.toLowerCase().includes(search.toLowerCase()));

    const byDiscount = discountFilter === 'all'
      ? bySearch
      : bySearch.filter(bundle => bundle.savings >= Number(discountFilter));

    const sorted = [...byDiscount];
    if (sortBy === 'btc-low') {
      sorted.sort((a, b) => Number(a.btc) - Number(b.btc));
    }
    if (sortBy === 'btc-high') {
      sorted.sort((a, b) => Number(b.btc) - Number(a.btc));
    }
    if (sortBy === 'deal') {
      sorted.sort((a, b) => b.savings - a.savings);
    }
    return sorted;
  }, [bundles, discountFilter, search, sortBy]);

  return (
    <div className="page-enter">
      <div style={{
        background: 'linear-gradient(135deg, var(--nav-bg) 0%, var(--card-bg) 100%)',
        borderBottom: '1px solid var(--border)', padding: '60px 80px 40px',
      }}>
        <div className="section-title">
          <i className="bi bi-tags-fill"></i> Save More
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 className="section-heading" style={{ marginBottom: 0 }}>Economy Accounts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 400, lineHeight: 1.7 }}>
            <i className="bi bi-percent" style={{ color: 'var(--green)', marginRight: 6 }}></i>
            Get more for less. Our bulk account bundles offer the best value for power users.
          </p>
        </div>
      </div>

      <div className="section">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
            }}>
              <i className="bi bi-search" style={{ color: 'var(--text-muted)', fontSize: 12 }}></i>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search accounts..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none', color: 'white',
                  fontSize: 12, width: 140,
                }}
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'deal' | 'btc-low' | 'btc-high')}
              style={{
                padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)', color: 'white', fontSize: 12,
              }}
            >
              <option value="deal" style={{ color: 'black' }}>Best Deal</option>
              <option value="btc-low" style={{ color: 'black' }}>Price: Low to High</option>
              <option value="btc-high" style={{ color: 'black' }}>Price: High to Low</option>
            </select>
            <select
              value={discountFilter}
              onChange={e => setDiscountFilter(e.target.value as 'all' | '15' | '20')}
              style={{
                padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)', color: 'white', fontSize: 12,
              }}
            >
              <option value="all" style={{ color: 'black' }}>All Discounts</option>
              <option value="15" style={{ color: 'black' }}>15%+ Savings</option>
              <option value="20" style={{ color: 'black' }}>20%+ Savings</option>
            </select>
          </div>

          <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <button
              onClick={() => setCurrency('btc')}
              style={{
                padding: '8px 12px', border: 'none', background: currency === 'btc' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: currency === 'btc' ? 'white' : 'var(--text-muted)', fontSize: 11, fontWeight: 700,
              }}
            >
              BTC
            </button>
            <button
              onClick={() => setCurrency('eth')}
              style={{
                padding: '8px 12px', border: 'none', background: currency === 'eth' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: currency === 'eth' ? 'white' : 'var(--text-muted)', fontSize: 11, fontWeight: 700,
              }}
            >
              ETH
            </button>
          </div>
        </div>

        <div className="shop-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shop-card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                <div style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 16 }} />
                <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '70%', marginBottom: 10 }} />
                <div style={{ height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '40%' }} />
              </div>
            ))
          ) : filteredBundles.map(b => (
            <div key={b.id} className="shop-card">
              <div style={{
                position: 'absolute', top: 14, right: 14,
                padding: '4px 12px', borderRadius: 20,
                background: 'rgba(39,174,96,0.12)',
                border: '1px solid rgba(39,174,96,0.3)',
                fontSize: 10, fontWeight: 700, color: '#2ecc71',
                letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5, zIndex: 5,
              }}>
                <i className="bi bi-tag-fill" style={{ fontSize: 11 }}></i>
                SAVE {b.savings}%
              </div>
              <img src={b.image} alt={b.name} className="shop-card-img" />
              <div className="shop-card-name">{b.name}</div>
              <div className="shop-card-price">
                <i className="bi bi-currency-bitcoin"></i>
                {currency === 'btc' ? `${b.btc} BTC` : `${b.eth} ETH`}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>{b.description}</p>
              <div className="shop-card-stock">
                <i className="bi bi-circle-fill"></i>
                In Stock
              </div>

              <div className="shop-card-qty">
                <button
                  className="qty-btn"
                  onClick={() => decreaseQty(b)}
                  disabled={getCartQty(b.id) <= 0}
                >
                  <i className="bi bi-dash"></i>
                </button>
                <span className="qty-num">{getCartQty(b.id)}</span>
                <button className="qty-btn" onClick={() => increaseQty(b)}>
                  <i className="bi bi-plus"></i>
                </button>
              </div>

              <button
                className="shop-card-buy"
                onClick={() => {
                  const currentQty = getCartQty(b.id);
                  onBuyNow({ id: b.id, name: b.name, qty: currentQty === 0 ? 1 : currentQty, image: b.image });
                }}
                style={{ gridColumn: 'span 2' }}
              >
                <i className="bi bi-lightning-charge-fill"></i>
                Buy Now
              </button>
            </div>
          ))}
        </div>

        {filteredBundles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <i className="bi bi-inbox" style={{ fontSize: 36, display: 'block', marginBottom: 10 }}></i>
            No bundles match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
