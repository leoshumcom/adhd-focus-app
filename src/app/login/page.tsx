'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTheme } from '@/lib/theme-context';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
      } else {
        router.push('/train');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ paddingTop: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }} className="animate-float">
          {theme === 'egg' ? '🥚' : '🎮'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>家长登录</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div className="card" style={{ background: '#FFF0F0', border: '2px solid #FF6B6B', textAlign: 'center', color: '#CC0000' }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: theme === 'egg' ? '1rem' : '0px',
              border: `2px solid var(--border-default)`,
              background: 'white',
              fontSize: '1rem',
              fontFamily: 'var(--font-family)',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.9rem' }}>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: theme === 'egg' ? '1rem' : '0px',
              border: `2px solid var(--border-default)`,
              background: 'white',
              fontSize: '1rem',
              fontFamily: 'var(--font-family)',
              outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            fontSize: '1.1rem',
            padding: '0.85rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '登录中...' : (theme === 'egg' ? '🌟 登录' : '▶ LOGIN')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span
            style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => router.push('/register')}
          >
            还没有账号？立即注册
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}
            onClick={() => alert('请联系管理员重置密码')}
          >
            忘记密码？
          </span>
        </div>
      </form>
    </div>
  );
}
