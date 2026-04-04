import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';

/* ─────────────────────────── Types ─────────────────────────── */

interface Product {
  id?: string;
  name: string;
  image: string;
  usd_price: string;
  eur_price: string;
  tag: string | null;
  glow_color: string;
  description: string;
  is_featured: boolean;
  subtitle?: string;
  accent?: string;
  bg?: string;
  in_stock: boolean;
}

interface Bundle {
  id?: string;
  name: string;
  image: string;
  description: string;
  usd: string;
  eur: string;
  savings: number;
}

type Tab = 'products' | 'bundles' | 'users';
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

/* ─────────────────────────── Defaults ─────────────────────────── */

const EMPTY_PRODUCT: Product = {
  name: '',
  image: '',
  usd_price: '',
  eur_price: '',
  tag: null,
  glow_color: 'rgba(255,255,255,0.3)',
  description: '',
  is_featured: false,
  subtitle: '',
  accent: '#f5f5f5',
  bg: 'slide-dark',
  in_stock: true,
};

const EMPTY_BUNDLE: Bundle = {
  name: '',
  image: '',
  description: '',
  usd: '',
  eur: '',
  savings: 0,
};

/* ─────────────────────────── Styles ─────────────────────────── */

const styles = {
  /* Layout */
  page: {
    padding: '32px 24px',
    maxWidth: 1440,
    margin: '0 auto',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 40,
    flexWrap: 'wrap' as const,
    gap: 20,
  } as React.CSSProperties,

  headerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  } as React.CSSProperties,

  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--accent2, #6c5ce7)',
    background: 'rgba(108,92,231,0.08)',
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid rgba(108,92,231,0.15)',
    width: 'fit-content',
  } as React.CSSProperties,

  headerTitle: {
    fontSize: 32,
    fontWeight: 900,
    margin: 0,
    letterSpacing: '-0.03em',
    background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  } as React.CSSProperties,

  headerSubtitle: {
    fontSize: 14,
    color: 'var(--text-muted, #888)',
    margin: 0,
    fontWeight: 500,
  } as React.CSSProperties,

  /* Stats bar */
  statsBar: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  statCard: {
    background: 'var(--card-bg, #1a1a2e)',
    border: '1px solid var(--border, #2a2a3e)',
    borderRadius: 16,
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 200,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,

  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  } as React.CSSProperties,

  statValue: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,

  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted, #888)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  } as React.CSSProperties,

  /* Tabs */
  tabContainer: {
    display: 'flex',
    gap: 4,
    background: 'rgba(255,255,255,0.03)',
    padding: 5,
    borderRadius: 16,
    border: '1px solid var(--border, #2a2a3e)',
  } as React.CSSProperties,

  tab: (active: boolean) =>
    ({
      background: active
        ? 'linear-gradient(135deg, var(--accent2, #6c5ce7), #a29bfe)'
        : 'transparent',
      color: active ? '#fff' : 'var(--text-muted, #888)',
      padding: '10px 26px',
      borderRadius: 12,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 700,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      boxShadow: active ? '0 4px 20px rgba(108,92,231,0.35)' : 'none',
      transform: active ? 'scale(1)' : 'scale(0.98)',
    }) as React.CSSProperties,

  /* Grid layout */
  gridLayout: {
    display: 'grid',
    gridTemplateColumns: '420px 1fr',
    gap: 36,
    alignItems: 'start',
  } as React.CSSProperties,

  /* Form panel */
  formPanel: {
    position: 'sticky' as const,
    top: 100,
  } as React.CSSProperties,

  formCard: {
    background: 'var(--card-bg, #1a1a2e)',
    padding: 32,
    borderRadius: 24,
    border: '1px solid var(--border, #2a2a3e)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.03) inset',
    backdropFilter: 'blur(20px)',
  } as React.CSSProperties,

  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid var(--border, #2a2a3e)',
  } as React.CSSProperties,

  formTitle: {
    fontSize: 20,
    fontWeight: 900,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,

  editBadge: {
    fontSize: 9,
    background: 'linear-gradient(135deg, var(--accent2, #6c5ce7), #a29bfe)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 800,
    letterSpacing: '0.08em',
    animation: 'pulse 2s ease-in-out infinite',
  } as React.CSSProperties,

  formBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  } as React.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,

  label: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted, #888)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,

  input: {
    width: '100%',
    textAlign: 'left' as const,
    background: 'rgba(255,255,255,0.04)',
    padding: '13px 16px',
    borderRadius: 12,
    border: '1px solid var(--border, #2a2a3e)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    textAlign: 'left' as const,
    background: 'rgba(255,255,255,0.04)',
    padding: '13px 16px',
    borderRadius: 12,
    border: '1px solid var(--border, #2a2a3e)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    minHeight: 90,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,

  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  } as React.CSSProperties,

  imagePreviewRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  } as React.CSSProperties,

  imagePreviewBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border, #2a2a3e)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s',
  } as React.CSSProperties,

  imagePreview: {
    width: '80%',
    height: '80%',
    objectFit: 'contain' as const,
  } as React.CSSProperties,

  checkboxRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border, #2a2a3e)',
  } as React.CSSProperties,

  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
  } as React.CSSProperties,

  customCheckbox: (checked: boolean) =>
    ({
      width: 20,
      height: 20,
      borderRadius: 6,
      border: checked
        ? '2px solid var(--accent2, #6c5ce7)'
        : '2px solid var(--border, #2a2a3e)',
      background: checked
        ? 'linear-gradient(135deg, var(--accent2, #6c5ce7), #a29bfe)'
        : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      cursor: 'pointer',
      flexShrink: 0,
    }) as React.CSSProperties,

  checkboxLabel: {
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none' as const,
  } as React.CSSProperties,

  buttonRow: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  } as React.CSSProperties,

  submitBtn: (isEditing: boolean) =>
    ({
      flex: 1,
      padding: '14px 20px',
      borderRadius: 14,
      border: 'none',
      background: isEditing
        ? 'linear-gradient(135deg, #f39c12, #e67e22)'
        : 'linear-gradient(135deg, var(--accent2, #6c5ce7), #a29bfe)',
      color: '#fff',
      fontWeight: 800,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      boxShadow: isEditing
        ? '0 8px 24px rgba(243,156,18,0.3)'
        : '0 8px 24px rgba(108,92,231,0.3)',
    }) as React.CSSProperties,

  cancelBtn: {
    padding: '14px 22px',
    borderRadius: 14,
    border: '1px solid var(--border, #2a2a3e)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-muted, #888)',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,

  /* Item cards */
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  } as React.CSSProperties,

  card: (isEditing: boolean) =>
    ({
      background: 'var(--card-bg, #1a1a2e)',
      padding: 22,
      borderRadius: 20,
      border: isEditing
        ? '2px solid var(--accent2, #6c5ce7)'
        : '1px solid var(--border, #2a2a3e)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 16,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isEditing
        ? '0 12px 36px rgba(108,92,231,0.25), 0 0 0 1px rgba(108,92,231,0.1)'
        : '0 4px 16px rgba(0,0,0,0.15)',
      transform: isEditing ? 'scale(1.01)' : 'scale(1)',
      position: 'relative' as const,
      overflow: 'hidden',
    }) as React.CSSProperties,

  cardGlow: (isEditing: boolean) =>
    ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      background: isEditing
        ? 'linear-gradient(90deg, var(--accent2, #6c5ce7), #a29bfe, var(--accent2, #6c5ce7))'
        : 'transparent',
      backgroundSize: '200% 100%',
      animation: isEditing ? 'shimmer 2s linear infinite' : 'none',
    }) as React.CSSProperties,

  cardHeader: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  } as React.CSSProperties,

  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border, #2a2a3e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  } as React.CSSProperties,

  cardImageInner: {
    width: '75%',
    height: '75%',
    objectFit: 'contain' as const,
  } as React.CSSProperties,

  cardInfo: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  cardName: {
    fontWeight: 800,
    fontSize: 15,
    marginBottom: 6,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as React.CSSProperties,

  badgeRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  badge: (color: string, bgColor: string) =>
    ({
      fontSize: 9,
      background: bgColor,
      color: color,
      padding: '3px 9px',
      borderRadius: 6,
      fontWeight: 800,
      letterSpacing: '0.05em',
      border: `1px solid ${color}22`,
    }) as React.CSSProperties,

  priceBlock: {
    background: 'rgba(0,0,0,0.25)',
    padding: '12px 16px',
    borderRadius: 12,
    fontSize: 12,
    color: 'var(--text-muted, #888)',
  } as React.CSSProperties,

  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,

  priceValue: {
    color: '#fff',
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
  } as React.CSSProperties,

  priceDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '8px 0',
  } as React.CSSProperties,

  cardActions: {
    display: 'flex',
    gap: 10,
  } as React.CSSProperties,

  editBtn: (isEditing: boolean) =>
    ({
      flex: 1,
      padding: '11px 16px',
      borderRadius: 12,
      border: isEditing
        ? '1px solid var(--accent2, #6c5ce7)'
        : '1px solid var(--border, #2a2a3e)',
      background: isEditing
        ? 'rgba(108,92,231,0.15)'
        : 'rgba(255,255,255,0.04)',
      color: isEditing ? 'var(--accent2, #6c5ce7)' : '#fff',
      fontWeight: 700,
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }) as React.CSSProperties,

  deleteBtn: {
    padding: '11px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,77,105,0.15)',
    background: 'rgba(255,77,105,0.06)',
    color: '#ff4d6d',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  /* Loader */
  loaderWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 100,
    gap: 16,
  } as React.CSSProperties,

  spinner: {
    width: 40,
    height: 40,
    border: '3px solid var(--border, #2a2a3e)',
    borderTop: '3px solid var(--accent2, #6c5ce7)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  } as React.CSSProperties,

  empty: {
    color: 'var(--text-muted, #888)',
    gridColumn: '1/-1',
    textAlign: 'center' as const,
    padding: 60,
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    border: '1px dashed var(--border, #2a2a3e)',
  } as React.CSSProperties,

  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
    opacity: 0.3,
  } as React.CSSProperties,

  emptyText: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 6,
  } as React.CSSProperties,

  emptyHint: {
    fontSize: 13,
    opacity: 0.6,
  } as React.CSSProperties,

  /* Search */
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    padding: '12px 18px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border, #2a2a3e)',
  } as React.CSSProperties,

  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    fontWeight: 500,
  } as React.CSSProperties,

  searchCount: {
    fontSize: 12,
    color: 'var(--text-muted, #888)',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  /* Toast */
  toastContainer: {
    position: 'fixed' as const,
    top: 24,
    right: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    zIndex: 10000,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  toast: (type: ToastType) => {
    const colors = {
      success: { bg: 'rgba(46,204,113,0.12)', border: 'rgba(46,204,113,0.25)', color: '#2ecc71', icon: 'bi-check-circle-fill' },
      error: { bg: 'rgba(231,76,60,0.12)', border: 'rgba(231,76,60,0.25)', color: '#e74c3c', icon: 'bi-exclamation-triangle-fill' },
      info: { bg: 'rgba(108,92,231,0.12)', border: 'rgba(108,92,231,0.25)', color: '#6c5ce7', icon: 'bi-info-circle-fill' },
    };
    const c = colors[type];
    return {
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      padding: '14px 20px',
      borderRadius: 14,
      fontSize: 13,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease, fadeOut 0.3s ease 2.7s',
      pointerEvents: 'auto' as const,
      icon: c.icon,
    };
  },

  /* Delete confirmation modal */
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease',
  } as React.CSSProperties,

  modalCard: {
    background: 'var(--card-bg, #1a1a2e)',
    border: '1px solid var(--border, #2a2a3e)',
    borderRadius: 24,
    padding: 36,
    maxWidth: 420,
    width: '90%',
    textAlign: 'center' as const,
    boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
    animation: 'scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,

  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: 'rgba(255,77,105,0.1)',
    border: '1px solid rgba(255,77,105,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: 28,
    color: '#ff4d6d',
  } as React.CSSProperties,

  modalTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 8,
  } as React.CSSProperties,

  modalDesc: {
    fontSize: 14,
    color: 'var(--text-muted, #888)',
    marginBottom: 28,
    lineHeight: 1.6,
  } as React.CSSProperties,

  modalActions: {
    display: 'flex',
    gap: 12,
  } as React.CSSProperties,

  modalCancelBtn: {
    flex: 1,
    padding: '13px',
    borderRadius: 14,
    border: '1px solid var(--border, #2a2a3e)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,

  modalDeleteBtn: {
    flex: 1,
    padding: '13px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #ff4d6d, #e74c3c)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(255,77,105,0.3)',
  } as React.CSSProperties,
};

/* ─────────────────────────── CSS keyframes ─────────────────────────── */

const keyframes = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes fadeOut { to { opacity: 0; transform: translateY(-10px); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  input:focus, textarea:focus {
    border-color: var(--accent2, #6c5ce7) !important;
    box-shadow: 0 0 0 3px rgba(108,92,231,0.15) !important;
  }
`;

/* ─────────────────────────── Sub-Components ─────────────────────────── */

function ToastNotification({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={styles.toastContainer}>
      {toasts.map((t) => {
        const toastStyle = styles.toast(t.type);
        return (
          <div key={t.id} style={toastStyle}>
            <i className={`bi ${toastStyle.icon}`}></i>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

function DeleteModal({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={styles.modalOverlay} onClick={onCancel}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalIcon}>
          <i className="bi bi-trash3"></i>
        </div>
        <div style={styles.modalTitle}>Delete "{itemName}"?</div>
        <div style={styles.modalDesc}>
          This action cannot be undone. The item will be permanently removed from your store.
        </div>
        <div style={styles.modalActions}>
          <button style={styles.modalCancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={styles.modalDeleteBtn} onClick={onConfirm}>
            <i className="bi bi-trash3" style={{ marginRight: 6 }}></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconColor,
}: {
  icon: string;
  value: number | string;
  label: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: iconBg, color: iconColor }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function CustomCheckbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <div style={styles.checkboxItem} onClick={() => onChange(!checked)}>
      <div style={styles.customCheckbox(checked)}>
        {checked && (
          <i className="bi bi-check" style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}></i>
        )}
      </div>
      <label htmlFor={id} style={styles.checkboxLabel}>
        {label}
      </label>
    </div>
  );
}

function EmptyState({ type }: { type: 'products' | 'bundles' }) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>
        <i className={`bi ${type === 'products' ? 'bi-box-seam' : 'bi-tags'}`}></i>
      </div>
      <div style={styles.emptyText}>
        No {type} found
      </div>
      <div style={styles.emptyHint}>
        Start by creating your first {type === 'products' ? 'product' : 'bundle'} using the form.
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={styles.loaderWrap}>
      <div style={styles.spinner}></div>
      <div style={{ fontSize: 13, color: 'var(--text-muted, #888)', fontWeight: 600 }}>
        Loading data...
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    table: 'products' | 'bundles';
    id: string;
    name: string;
  } | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Product>({ ...EMPTY_PRODUCT });

  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [bundleForm, setBundleForm] = useState<Bundle>({ ...EMPTY_BUNDLE });

  const formRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);

  /* ── Toast helper ── */
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, bRes, uRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('bundles').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*').order('created_at', { ascending: false }),
    ]);

    if (pRes.error) {
      console.error('Error fetching products:', pRes.error);
      addToast('Failed to load products', 'error');
    } else {
      setProducts(pRes.data || []);
    }

    if (bRes.error) {
      console.error('Error fetching bundles:', bRes.error);
      addToast('Failed to load bundles', 'error');
    } else {
      setBundles(bRes.data || []);
    }

    if (uRes.error) {
      console.error('Error fetching users:', uRes.error);
      addToast('Failed to load users', 'error');
    } else {
      setUsers(uRes.data || []);
    }

    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Product form helpers ── */
  const updateProductField = useCallback(
    <K extends keyof Product>(field: K, value: Product[K]) => {
      setProductForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetProductForm = useCallback(() => {
    setProductForm({ ...EMPTY_PRODUCT });
    setEditingProduct(null);
  }, []);

  const handleProductSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      if (editingProduct?.id) {
        const { error } = await supabase
          .from('products')
          .update(productForm)
          .eq('id', editingProduct.id);
        if (error) {
          addToast(error.message, 'error');
        } else {
          addToast(`"${productForm.name}" updated successfully`, 'success');
          resetProductForm();
          fetchData();
        }
      } else {
        const { error } = await supabase.from('products').insert([productForm]);
        if (error) {
          addToast(error.message, 'error');
        } else {
          addToast(`"${productForm.name}" created successfully`, 'success');
          resetProductForm();
          fetchData();
        }
      }

      setSaving(false);
    },
    [editingProduct, productForm, addToast, resetProductForm, fetchData]
  );

  const startEditProduct = useCallback((p: Product) => {
    setEditingProduct(p);
    setProductForm(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ── Bundle form helpers ── */
  const updateBundleField = useCallback(
    <K extends keyof Bundle>(field: K, value: Bundle[K]) => {
      setBundleForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetBundleForm = useCallback(() => {
    setBundleForm({ ...EMPTY_BUNDLE });
    setEditingBundle(null);
  }, []);

  const handleBundleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);

      if (editingBundle?.id) {
        const { error } = await supabase
          .from('bundles')
          .update(bundleForm)
          .eq('id', editingBundle.id);
        if (error) {
          addToast(error.message, 'error');
        } else {
          addToast(`"${bundleForm.name}" updated successfully`, 'success');
          resetBundleForm();
          fetchData();
        }
      } else {
        const { error } = await supabase.from('bundles').insert([bundleForm]);
        if (error) {
          addToast(error.message, 'error');
        } else {
          addToast(`"${bundleForm.name}" created successfully`, 'success');
          resetBundleForm();
          fetchData();
        }
      }

      setSaving(false);
    },
    [editingBundle, bundleForm, addToast, resetBundleForm, fetchData]
  );

  const startEditBundle = useCallback((b: Bundle) => {
    setEditingBundle(b);
    setBundleForm(b);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ── Delete ── */
  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return;
    const { error } = await supabase.from(deleteModal.table).delete().eq('id', deleteModal.id);
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast(`"${deleteModal.name}" deleted`, 'info');
      fetchData();
    }
    setDeleteModal(null);
  }, [deleteModal, addToast, fetchData]);

  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast(`User role updated to ${newRole}`, 'success');
      fetchData();
    }
  }, [addToast, fetchData]);

  /* ── Filtered data ── */
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const filteredBundles = useMemo(() => {
    if (!searchQuery.trim()) return bundles;
    const q = searchQuery.toLowerCase();
    return bundles.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
    );
  }, [bundles, searchQuery]);

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      inStock: products.filter((p) => p.in_stock).length,
      featured: products.filter((p) => p.is_featured).length,
      totalBundles: bundles.length,
    }),
    [products, bundles]
  );

  /* ─────────────────────────── Render ─────────────────────────── */
  return (
    <>
      <style>{keyframes}</style>
      <ToastNotification toasts={toasts} />
      {deleteModal && (
        <DeleteModal
          itemName={deleteModal.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}

      <div style={styles.page}>
        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerBadge}>
              <i className="bi bi-shield-lock-fill"></i>
              Admin Control Center
            </div>
            <h1 style={styles.headerTitle}>Store Management</h1>
            <p style={styles.headerSubtitle}>
              Manage your products and bundles in real-time
            </p>
          </div>

          <div style={styles.tabContainer}>
            <button style={styles.tab(tab === 'products')} onClick={() => { setTab('products'); setSearchQuery(''); }}>
              <i className="bi bi-box-seam"></i>
              Products
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: tab === 'products' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {products.length}
              </span>
            </button>
            <button style={styles.tab(tab === 'bundles')} onClick={() => { setTab('bundles'); setSearchQuery(''); }}>
              <i className="bi bi-tags"></i>
              Bundles
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: tab === 'bundles' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {bundles.length}
              </span>
            </button>
            <button style={styles.tab(tab === 'users')} onClick={() => { setTab('users'); setSearchQuery(''); }}>
              <i className="bi bi-people"></i>
              Users
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: tab === 'users' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {users.length}
              </span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={styles.statsBar}>
          <StatCard
            icon="bi-box-seam"
            value={stats.totalProducts}
            label="Total Products"
            iconBg="rgba(108,92,231,0.12)"
            iconColor="#6c5ce7"
          />
          <StatCard
            icon="bi-check-circle"
            value={stats.inStock}
            label="In Stock"
            iconBg="rgba(46,204,113,0.12)"
            iconColor="#2ecc71"
          />
          <StatCard
            icon="bi-star"
            value={stats.featured}
            label="Featured"
            iconBg="rgba(241,196,15,0.12)"
            iconColor="#f1c40f"
          />
          <StatCard
            icon="bi-tags"
            value={stats.totalBundles}
            label="Bundles"
            iconBg="rgba(52,152,219,0.12)"
            iconColor="#3498db"
          />
        </div>

        {/* ── Products Tab ── */}
        {tab === 'products' && (
          <div style={styles.gridLayout}>
            {/* Form */}
            <div style={styles.formPanel} ref={formRef}>
              <div style={styles.formCard}>
                <div style={styles.formHeader}>
                  <h2 style={styles.formTitle}>
                    <i
                      className={`bi ${editingProduct ? 'bi-pencil-square' : 'bi-plus-circle'}`}
                      style={{ color: 'var(--accent2, #6c5ce7)' }}
                    ></i>
                    {editingProduct ? 'Edit Product' : 'New Product'}
                  </h2>
                  {editingProduct && <span style={styles.editBadge}>EDITING</span>}
                </div>

                <form onSubmit={handleProductSubmit} style={styles.formBody}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-type" style={{ fontSize: 10 }}></i>
                      Product Name
                    </label>
                    <input
                      style={styles.input}
                      value={productForm.name}
                      onChange={(e) => updateProductField('name', e.target.value)}
                      placeholder="e.g. Netflix Premium"
                      required
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-image" style={{ fontSize: 10 }}></i>
                      Image URL
                    </label>
                    <div style={styles.imagePreviewRow}>
                      <input
                        style={{ ...styles.input, flex: 1 }}
                        value={productForm.image}
                        onChange={(e) => updateProductField('image', e.target.value)}
                        placeholder="https://..."
                        required
                      />
                      <div style={styles.imagePreviewBox}>
                        {productForm.image ? (
                          <img
                            src={productForm.image}
                            alt=""
                            style={styles.imagePreview}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <i className="bi bi-image" style={{ color: 'var(--text-muted)', fontSize: 16 }}></i>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-currency-dollar" style={{ fontSize: 10 }}></i>
                        USD Price
                      </label>
                      <input
                        style={styles.input}
                        value={productForm.usd_price}
                        onChange={(e) => updateProductField('usd_price', e.target.value)}
                        placeholder="1.00"
                        required
                      />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-currency-euro" style={{ fontSize: 10 }}></i>
                        EUR Price
                      </label>
                      <input
                        style={styles.input}
                        value={productForm.eur_price}
                        onChange={(e) => updateProductField('eur_price', e.target.value)}
                        placeholder="0.92"
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-tag" style={{ fontSize: 10 }}></i>
                        Tag (HOT, NEW, etc.)
                      </label>
                      <select
                        style={styles.input}
                        value={productForm.tag || ''}
                        onChange={(e) => updateProductField('tag', e.target.value || null)}
                      >
                        <option value="">No Tag</option>
                        <option value="HOT">HOT</option>
                        <option value="NEW">NEW</option>
                        <option value="PREMIUM">PREMIUM</option>
                        <option value="POPULAR">POPULAR</option>
                      </select>
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-palette" style={{ fontSize: 10 }}></i>
                        Accent Color
                      </label>
                      <input
                        type="color"
                        style={{ ...styles.input, padding: '4px 8px', height: 44 }}
                        value={productForm.accent || '#6c5ce7'}
                        onChange={(e) => updateProductField('accent', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-magic" style={{ fontSize: 10 }}></i>
                        Glow Color (RGBA)
                      </label>
                      <input
                        style={styles.input}
                        value={productForm.glow_color}
                        onChange={(e) => updateProductField('glow_color', e.target.value)}
                        placeholder="rgba(255,255,255,0.3)"
                      />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-layers" style={{ fontSize: 10 }}></i>
                        Hero Background
                      </label>
                      <select
                        style={styles.input}
                        value={productForm.bg || 'slide-dark'}
                        onChange={(e) => updateProductField('bg', e.target.value)}
                      >
                        <option value="slide-dark">Dark</option>
                        <option value="slide-red">Red (Netflix)</option>
                        <option value="slide-blue">Blue (Disney)</option>
                        <option value="slide-orange">Orange (Crunchyroll)</option>
                        <option value="slide-purple">Purple (Discord)</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-card-heading" style={{ fontSize: 10 }}></i>
                      Hero Subtitle
                    </label>
                    <input
                      style={styles.input}
                      value={productForm.subtitle || ''}
                      onChange={(e) => updateProductField('subtitle', e.target.value)}
                      placeholder="WATCH ANYWHERE..."
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-text-paragraph" style={{ fontSize: 10 }}></i>
                      Description
                    </label>
                    <textarea
                      style={styles.textarea}
                      value={productForm.description}
                      onChange={(e) => updateProductField('description', e.target.value)}
                      placeholder="Product details..."
                    />
                  </div>

                  <div style={styles.checkboxRow}>
                    <CustomCheckbox
                      id="feat"
                      checked={productForm.is_featured}
                      onChange={(val) => updateProductField('is_featured', val)}
                      label="Featured (Hero)"
                    />
                    <CustomCheckbox
                      id="stock"
                      checked={productForm.in_stock}
                      onChange={(val) => updateProductField('in_stock', val)}
                      label="In Stock"
                    />
                  </div>

                  <div style={styles.buttonRow}>
                    <button
                      type="submit"
                      style={styles.submitBtn(!!editingProduct)}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div
                            style={{
                              ...styles.spinner,
                              width: 16,
                              height: 16,
                              borderWidth: 2,
                              borderTopColor: '#fff',
                            }}
                          ></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className={`bi ${editingProduct ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                          {editingProduct ? 'Save Changes' : 'Create Product'}
                        </>
                      )}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={resetProductForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Product List */}
            <div>
              <div style={styles.searchBar}>
                <i className="bi bi-search" style={{ color: 'var(--text-muted)', fontSize: 16 }}></i>
                <input
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                />
                <span style={styles.searchCount}>
                  {filteredProducts.length} of {products.length}
                </span>
              </div>

              {loading ? (
                <Loader />
              ) : (
                <div style={styles.cardGrid}>
                  {filteredProducts.map((p) => {
                    const isEditing = editingProduct?.id === p.id;
                    return (
                      <div key={p.id} style={styles.card(isEditing)}>
                        <div style={styles.cardGlow(isEditing)}></div>

                        <div style={styles.cardHeader}>
                          <div style={styles.cardImage}>
                            <img src={p.image} alt="" style={styles.cardImageInner} />
                          </div>
                          <div style={styles.cardInfo}>
                            <div style={styles.cardName}>{p.name}</div>
                            <div style={styles.badgeRow}>
                              {p.tag && (
                                <span
                                  style={styles.badge(
                                    '#9b59b6',
                                    'rgba(155,89,182,0.1)'
                                  )}
                                >
                                  {p.tag}
                                </span>
                              )}
                              {p.is_featured && (
                                <span
                                  style={styles.badge(
                                    '#f1c40f',
                                    'rgba(241,196,15,0.1)'
                                  )}
                                >
                                  ★ HERO
                                </span>
                              )}
                              {p.in_stock ? (
                                <span
                                  style={styles.badge(
                                    '#2ecc71',
                                    'rgba(46,204,113,0.1)'
                                  )}
                                >
                                  IN STOCK
                                </span>
                              ) : (
                                <span
                                  style={styles.badge(
                                    '#e74c3c',
                                    'rgba(231,76,60,0.1)'
                                  )}
                                >
                                  OUT OF STOCK
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={styles.priceBlock}>
                          <div style={styles.priceRow}>
                            <span>
                              <i className="bi bi-currency-dollar" style={{ marginRight: 4 }}></i>
                              USD
                            </span>
                            <span style={styles.priceValue}>{p.usd_price}</span>
                          </div>
                          <div style={styles.priceDivider}></div>
                          <div style={styles.priceRow}>
                            <span>
                              <i className="bi bi-currency-euro" style={{ marginRight: 4 }}></i>
                              EUR
                            </span>
                            <span style={styles.priceValue}>{p.eur_price}</span>
                          </div>
                        </div>

                        <div style={styles.cardActions}>
                          <button
                            style={styles.editBtn(isEditing)}
                            onClick={() => startEditProduct(p)}
                          >
                            <i className="bi bi-pencil-square"></i>
                            {isEditing ? 'Editing...' : 'Edit'}
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={() =>
                              setDeleteModal({
                                table: 'products',
                                id: p.id!,
                                name: p.name,
                              })
                            }
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && !loading && (
                    <EmptyState type="products" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bundles Tab ── */}
        {tab === 'bundles' && (
          <div style={styles.gridLayout}>
            {/* Form */}
            <div style={styles.formPanel}>
              <div style={styles.formCard}>
                <div style={styles.formHeader}>
                  <h2 style={styles.formTitle}>
                    <i
                      className={`bi ${editingBundle ? 'bi-pencil-square' : 'bi-plus-circle'}`}
                      style={{ color: 'var(--accent2, #6c5ce7)' }}
                    ></i>
                    {editingBundle ? 'Edit Bundle' : 'New Bundle'}
                  </h2>
                  {editingBundle && <span style={styles.editBadge}>EDITING</span>}
                </div>

                <form onSubmit={handleBundleSubmit} style={styles.formBody}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-type" style={{ fontSize: 10 }}></i>
                      Bundle Name
                    </label>
                    <input
                      style={styles.input}
                      value={bundleForm.name}
                      onChange={(e) => updateBundleField('name', e.target.value)}
                      placeholder="e.g. Streaming Starter"
                      required
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-image" style={{ fontSize: 10 }}></i>
                      Image URL
                    </label>
                    <div style={styles.imagePreviewRow}>
                      <input
                        style={{ ...styles.input, flex: 1 }}
                        value={bundleForm.image}
                        onChange={(e) => updateBundleField('image', e.target.value)}
                        placeholder="https://..."
                        required
                      />
                      <div style={styles.imagePreviewBox}>
                        {bundleForm.image ? (
                          <img
                            src={bundleForm.image}
                            alt=""
                            style={styles.imagePreview}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <i className="bi bi-image" style={{ color: 'var(--text-muted)', fontSize: 16 }}></i>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-currency-dollar" style={{ fontSize: 10 }}></i>
                        USD Price
                      </label>
                      <input
                        style={styles.input}
                        value={bundleForm.usd}
                        onChange={(e) => updateBundleField('usd', e.target.value)}
                        placeholder="1.00"
                        required
                      />
                    </div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>
                        <i className="bi bi-currency-euro" style={{ fontSize: 10 }}></i>
                        EUR Price
                      </label>
                      <input
                        style={styles.input}
                        value={bundleForm.eur}
                        onChange={(e) => updateBundleField('eur', e.target.value)}
                        placeholder="0.92"
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-percent" style={{ fontSize: 10 }}></i>
                      Savings %
                    </label>
                    <input
                      type="number"
                      style={styles.input}
                      value={bundleForm.savings}
                      onChange={(e) => updateBundleField('savings', Number(e.target.value))}
                      placeholder="15"
                      min={0}
                      max={100}
                      required
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      <i className="bi bi-text-paragraph" style={{ fontSize: 10 }}></i>
                      Description
                    </label>
                    <textarea
                      style={styles.textarea}
                      value={bundleForm.description}
                      onChange={(e) => updateBundleField('description', e.target.value)}
                      placeholder="Bundle details..."
                    />
                  </div>

                  <div style={styles.buttonRow}>
                    <button
                      type="submit"
                      style={styles.submitBtn(!!editingBundle)}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div
                            style={{
                              ...styles.spinner,
                              width: 16,
                              height: 16,
                              borderWidth: 2,
                              borderTopColor: '#fff',
                            }}
                          ></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className={`bi ${editingBundle ? 'bi-check-lg' : 'bi-plus-lg'}`}></i>
                          {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                        </>
                      )}
                    </button>
                    {editingBundle && (
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={resetBundleForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Bundle List */}
            <div>
              <div style={styles.searchBar}>
                <i className="bi bi-search" style={{ color: 'var(--text-muted)', fontSize: 16 }}></i>
                <input
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bundles..."
                />
                <span style={styles.searchCount}>
                  {filteredBundles.length} of {bundles.length}
                </span>
              </div>

              {loading ? (
                <Loader />
              ) : (
                <div style={styles.cardGrid}>
                  {filteredBundles.map((b) => {
                    const isEditing = editingBundle?.id === b.id;
                    return (
                      <div key={b.id} style={styles.card(isEditing)}>
                        <div style={styles.cardGlow(isEditing)}></div>

                        <div style={styles.cardHeader}>
                          <div style={styles.cardImage}>
                            <img src={b.image} alt="" style={styles.cardImageInner} />
                          </div>
                          <div style={styles.cardInfo}>
                            <div style={styles.cardName}>{b.name}</div>
                            <div style={styles.badgeRow}>
                              <span
                                style={styles.badge(
                                  '#2ecc71',
                                  'rgba(46,204,113,0.1)'
                                )}
                              >
                                SAVE {b.savings}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {b.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted, #888)',
                              lineHeight: 1.5,
                              padding: '0 2px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as const,
                              overflow: 'hidden',
                            }}
                          >
                            {b.description}
                          </div>
                        )}

                        <div style={styles.priceBlock}>
                          <div style={styles.priceRow}>
                            <span>
                              <i className="bi bi-currency-dollar" style={{ marginRight: 4 }}></i>
                              USD
                            </span>
                            <span style={styles.priceValue}>{b.usd}</span>
                          </div>
                          <div style={styles.priceDivider}></div>
                          <div style={styles.priceRow}>
                            <span>
                              <i className="bi bi-currency-euro" style={{ marginRight: 4 }}></i>
                              EUR
                            </span>
                            <span style={styles.priceValue}>{b.eur}</span>
                          </div>
                        </div>

                        <div style={styles.cardActions}>
                          <button
                            style={styles.editBtn(isEditing)}
                            onClick={() => startEditBundle(b)}
                          >
                            <i className="bi bi-pencil-square"></i>
                            {isEditing ? 'Editing...' : 'Edit'}
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={() =>
                              setDeleteModal({
                                table: 'bundles',
                                id: b.id!,
                                name: b.name,
                              })
                            }
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredBundles.length === 0 && !loading && (
                    <EmptyState type="bundles" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={styles.gridLayout}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={styles.formCard}>
                <div style={styles.formHeader}>
                  <h2 style={styles.formTitle}>
                    <i className="bi bi-people" style={{ color: 'var(--accent2, #6c5ce7)' }}></i>
                    User Management
                  </h2>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border, #2a2a3e)' }}>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #888)', fontWeight: 600 }}>Email</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #888)', fontWeight: 600 }}>Role</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #888)', fontWeight: 600 }}>Joined</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted, #888)', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px' }}>{user.email}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              background: user.role === 'admin' ? 'rgba(108, 92, 231, 0.2)' : 'rgba(255,255,255,0.1)',
                              color: user.role === 'admin' ? '#a29bfe' : '#fff',
                              padding: '4px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--text-muted, #888)' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border, #2a2a3e)',
                                color: '#fff',
                                padding: '6px 12px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && !loading && (
                        <tr>
                          <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted, #888)' }}>
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}