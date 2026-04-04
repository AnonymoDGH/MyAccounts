import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { supabase } from '../lib/supabase';

const LOGO_URL = 'https://raw.githubusercontent.com/skelettn/MyDrugs2.0/main/assets/logo.png';

interface CartItem { id: string | number; name: string; qty: number; image: string; price: number; }

interface HeroProps {
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
  onShop: () => void;
  onSupplierClick?: (supplierId: string) => void;
}

interface Slide {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  image: string;
  usd_price: string;
  eur_price: string;
  stars: number;
  bg: string;
  glow_color: string;
  accent: string;
  supplier?: { id: string; username: string; avatar_url: string; } | null;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: '1', name: 'NETFLIX PREMIUM', subtitle: 'WATCH ANYWHERE. CANCEL ANYTIME.',
    desc: 'Get access to Netflix Premium with 4K Ultra HD and HDR. Stream on 4 devices at once. Reliable and stable accounts.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', usd_price: '1.00', eur_price: '0.92', stars: 5,
    bg: 'slide-red', glow_color: 'rgba(229,9,20,0.25)', accent: '#e50914',
  },
  {
    id: '2', name: 'DISNEY+ ANNUAL', subtitle: 'THE BEST STORIES IN ONE PLACE',
    desc: 'Enjoy Disney, Pixar, Marvel, Star Wars, and National Geographic. Ad-free experience with unlimited downloads.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg', usd_price: '0.60', eur_price: '0.55', stars: 5,
    bg: 'slide-blue', glow_color: 'rgba(0,114,206,0.2)', accent: '#0072ce',
  },
  {
    id: '3', name: 'CRUNCHYROLL MEGA', subtitle: 'THE WORLD\'S LARGEST ANIME LIBRARY',
    desc: 'Stream new episodes shortly after they air in Japan. Offline viewing and access to the entire manga library.',
    image: 'https://media.discordapp.net/attachments/1377724259882762432/1489124840437846167/Crunchyroll-Manga-precio-y-fecha-estreno-removebg-preview.png?ex=69cf4714&is=69cdf594&hm=b7240f9a4a135b65784187fe6a0ed539c9d1eabc4754b5031050b6cb11aa75af&=&format=webp&quality=lossless&width=519&height=390', usd_price: '0.30', eur_price: '0.28', stars: 5,
    bg: 'slide-orange', glow_color: 'rgba(244,117,33,0.25)', accent: '#f47521',
  },
  {
    id: '4', name: 'DISCORD NITRO', subtitle: 'UNLEASH THE BEST OF DISCORD',
    desc: 'Get custom emojis, larger file uploads, HD video streaming, and 2 Server Boosts. Enhance your Discord experience.',
    image: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/688bbfec88fb6c55f8e87c0f_imgonline-com-ua-Resize-JSJAo2mDwZhTEs.webp', usd_price: '2.90', eur_price: '2.65', stars: 5,
    bg: 'slide-purple', glow_color: 'rgba(88,101,242,0.25)', accent: '#5865f2',
  },
];

function Stars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <div className="hero-stars">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`hero-star ${i < count ? 'filled' : 'empty'}`}>
          <i className={`bi ${i < count ? 'bi-star-fill' : 'bi-star'}`}></i>
        </span>
      ))}
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8, fontWeight: 600 }}>
        ({count}.0)
      </span>
    </div>
  );
}

export default function Hero({ onAddToCart, onBuyNow, onShop, onSupplierClick }: HeroProps) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 7000;

  useEffect(() => {
    fetchFeatured();
  }, []);

  async function fetchFeatured() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, supplier:users!supplier_id(id, username, avatar_url)')
        .eq('is_featured', true)
        .order('hero_order', { ascending: true });
      if (error) {
        console.error('Error fetching featured products:', error);
        setSlides(DEFAULT_SLIDES);
      } else if (data && data.length > 0) {
        setSlides(data.map(p => ({
          id: p.id,
          name: p.name,
          subtitle: p.subtitle || 'PREMIUM DIGITAL ACCOUNT',
          desc: p.description || 'Premium quality digital account with instant delivery and full warranty.',
          image: p.image,
          usd_price: p.usd_price,
          eur_price: p.eur_price,
          stars: 5,
          bg: p.bg || (p.name.toLowerCase().includes('netflix') ? 'slide-red' : 
                      p.name.toLowerCase().includes('disney') ? 'slide-blue' : 
                      p.name.toLowerCase().includes('crunchy') ? 'slide-orange' : 'slide-purple'),
          glow_color: p.glow_color || 'rgba(255,255,255,0.2)',
          accent: p.accent || '#f5f5f5',
          supplier: p.supplier,
        })));
      } else {
        setSlides(DEFAULT_SLIDES);
      }
    } catch (err) {
      console.error('Unexpected error fetching featured slides:', err);
      setSlides(DEFAULT_SLIDES);
    }
  }

  const resetTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    if (slides.length === 0) return;
    setProgress(0);

    let p = 0;
    progressRef.current = setInterval(() => {
      p += 100 / (DURATION / 50);
      if (p >= 100) p = 100;
      setProgress(p);
    }, 50);

    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
      setAnimKey(k => k + 1);
      setProgress(0);
      p = 0;
    }, DURATION);
  };

  useEffect(() => {
    if (slides.length > 0) {
      resetTimers();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
    // eslint-disable-next-line
  }, [slides]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    setAnimKey(k => k + 1);
    resetTimers();
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className={`hero hero-v2 ${slide.bg}`}>
      <div className="hero-slide hero-stage" style={{ position: 'relative' }}>
        <div className="hero-watermark">MYACCOUNTS</div>

        <img
          src={LOGO_URL}
          alt=""
          aria-hidden="true"
          className="hero-bg-logo"
        />

        <div className="hero-copy hero-copy-left">
          <h1 className="hero-title" key={`title-${animKey}`} style={{ animation: 'fadeSlideUp 0.6s ease' }}>
            {slide.name}
          </h1>
          <p className="hero-subtitle" key={`sub-${animKey}`} style={{ animation: 'fadeSlideUp 0.6s ease 0.1s both' }}>
            {slide.subtitle}
          </p>
          <Stars count={slide.stars} />

          <div className="hero-nav-inline">
            <button className="hero-arrow" onClick={prev}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <button className="hero-arrow" onClick={next}>
              <i className="bi bi-chevron-right"></i>
            </button>
            <button className="hero-view-all" onClick={onShop}>
              <i className="bi bi-grid-fill"></i>
              Shop
            </button>
          </div>
        </div>

        <div
          className="hero-pill-stage"
          style={{
            '--pill-accent': slide.accent,
            '--pill-glow': slide.glow_color,
          } as CSSProperties}
        >
          <div className="hero-pill-glow" style={{ background: slide.glow_color }} />
          <img
            src={slide.image}
            alt={slide.name}
            className="hero-pill-img"
            key={`pill-${animKey}`}
            style={{
              animation: 'float 4s ease-in-out infinite, pillEnter 0.7s ease',
              filter: `drop-shadow(0 18px 36px rgba(0,0,0,0.75)) drop-shadow(0 0 38px ${slide.glow_color}) drop-shadow(0 0 15px rgba(128,128,128,0.6)) saturate(1.26)`,
            }}
          />
        </div>

        <div className="hero-copy hero-copy-right">
          <p className="hero-price" key={`price-${animKey}`} style={{ animation: 'fadeSlideUp 0.5s ease 0.2s both' }}>
            <i className="bi bi-currency-dollar"></i>
            <span>{slide.usd_price} USD</span> / <span>{slide.eur_price} EUR</span>
          </p>

          <p className="hero-desc" key={`desc-${animKey}`} style={{ animation: 'fadeSlideUp 0.5s ease 0.3s both' }}>
            {slide.desc}
          </p>

          <div className="hero-actions" key={`btns-${animKey}`}>
            <button
              className="hero-add-btn"
              onClick={() => onAddToCart({ id: slide.id, name: slide.name, qty: 1, image: slide.image, price: Number(slide.usd_price) })}
              title="Add to cart"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
            <button
              className="hero-buy-btn"
              onClick={() => onBuyNow({ id: slide.id, name: slide.name, qty: 1, image: slide.image, price: Number(slide.usd_price) })}
            >
              <i className="bi bi-bag-plus-fill"></i>
              Buy Now
            </button>
          </div>

          {slide.supplier && onSupplierClick && (
            <div 
              onClick={() => onSupplierClick(slide.supplier!.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, 
                padding: '12px 16px', background: 'rgba(255,255,255,0.03)', 
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', animation: 'fadeSlideUp 0.5s ease 0.4s both',
                width: 'fit-content'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <img 
                src={slide.supplier.avatar_url || 'https://via.placeholder.com/32'} 
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent2, #00ff88)' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Verified Supplier</span>
                <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{slide.supplier.username || 'Unknown'}</span>
              </div>
              <i className="bi bi-patch-check-fill" style={{ color: 'var(--accent2, #00ff88)', fontSize: 14, marginLeft: 'auto' }}></i>
            </div>
          )}
        </div>

        <div className="slide-dots">
          {slides.map((_, i) => (
            <button key={i} className={`slide-dot${i === current ? ' active' : ''}`} onClick={() => goTo(i)} />
          ))}
        </div>

        <div className="hero-counter">
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>

        <div className="slide-progress" style={{ width: `${progress}%` }} />
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pillEnter {
          from { opacity: 0; transform: translateY(30px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
}
