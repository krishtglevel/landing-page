'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/dashboard-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Wrong password. Try again.');
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoBox}>TG</div>

        {/* Title */}
        <h1 style={styles.title}>Marketing Intelligence</h1>
        <p style={styles.subtitle}>Enter your access password to continue</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>Company staff only · Authorized access</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #0d2818 0%, #1a4d2e 50%, #0d2818 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  container: {
    background: '#ffffff',
    borderRadius: '32px',
    padding: '48px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  logoBox: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #39ff14 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 900,
    color: '#0d2818',
    margin: '0 auto 24px',
    boxShadow: '0 12px 32px rgba(57, 255, 20, 0.3)',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '32px',
    fontWeight: 900,
    color: '#0d2818',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '0 0 32px',
    fontSize: '15px',
    color: '#6b7280',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '16px 20px',
    borderRadius: '16px',
    border: '2px solid #e8f5e9',
    background: '#f8fffe',
    fontSize: '15px',
    fontWeight: 600,
    color: '#0d2818',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: 700,
    margin: 0,
  },
  button: {
    background: 'linear-gradient(135deg, #39ff14 0%, #10b981 100%)',
    color: '#0d2818',
    border: 'none',
    padding: '16px',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 900,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(57, 255, 20, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '32px',
    fontSize: '13px',
    color: '#9ca3af',
    fontWeight: 500,
  },
};