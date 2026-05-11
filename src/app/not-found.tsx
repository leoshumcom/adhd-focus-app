'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

export default function NotFound() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }} className="animate-float">
        {theme === 'egg' ? '🫣' : '❓'}
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>页面走丢了～</p>
      <button className="btn-primary" onClick={() => router.push('/')}>
        {theme === 'egg' ? '🏠 回首页' : '🏠 HOME'}
      </button>
    </div>
  );
}
