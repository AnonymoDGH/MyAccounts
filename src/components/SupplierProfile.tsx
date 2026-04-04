import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SupplierProfileProps {
  supplierId: string;
  onClose: () => void;
}

export default function SupplierProfile({ supplierId, onClose }: SupplierProfileProps) {
  const [supplier, setSupplier] = useState<any>(null);
  const [stats, setStats] = useState({ products: 0, joined: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplier() {
      setLoading(true);
      const { data: user } = await supabase.from('users').select('*').eq('id', supplierId).single();
      if (user) {
        setSupplier(user);
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('supplier_id', supplierId);
        setStats({
          products: count || 0,
          joined: new Date(user.created_at).toLocaleDateString()
        });
      }
      setLoading(false);
    }
    fetchSupplier();
  }, [supplierId]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: 20
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 24, padding: 40, width: '100%', maxWidth: 400,
        textAlign: 'center', position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20, background: 'transparent',
          border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20
        }}>
          <i className="bi bi-x-lg"></i>
        </button>

        {loading ? (
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        ) : supplier ? (
          <>
            <img 
              src={supplier.avatar_url || 'https://via.placeholder.com/100'} 
              alt={supplier.username}
              style={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid var(--accent2)', marginBottom: 20, objectFit: 'cover' }}
            />
            <h2 style={{ margin: '0 0 5px 0', fontSize: 24, color: '#fff' }}>{supplier.username || 'Unknown Supplier'}</h2>
            <div style={{ color: 'var(--accent2)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 30 }}>
              Verified Supplier <i className="bi bi-patch-check-fill"></i>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{stats.products}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Products</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 4 }}>{stats.joined}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Joined</div>
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Supplier not found.</p>
        )}
      </div>
    </div>
  );
}
