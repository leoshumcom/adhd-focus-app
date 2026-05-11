'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="page-content" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="animate-float" style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
          {theme === 'egg' ? '🥚' : '⛏️'}
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          专注力闯关
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          每天十分钟，提升专注力
        </p>
      </div>

      {/* Quick Stats */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>0</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>今日积分</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>0</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>连续打卡</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-tertiary)' }}>0</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>勋章</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.2rem', padding: '1rem 2rem', width: '100%' }}
          onClick={() => router.push('/login')}
        >
          {theme === 'egg' ? '🌟 开始闯关' : '▶ START GAME'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            className="card"
            style={{ border: '2px solid var(--accent-blue)', cursor: 'pointer', textAlign: 'center' }}
            onClick={() => router.push('/register')}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>👋</div>
            <div style={{ fontWeight: 'bold' }}>注册</div>
          </button>
          <button
            className="card"
            style={{ border: '2px solid var(--accent-green)', cursor: 'pointer', textAlign: 'center' }}
            onClick={() => router.push('/login')}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>🔑</div>
            <div style={{ fontWeight: 'bold' }}>登录</div>
          </button>
        </div>
      </div>

      {/* Feature Intro */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎯 训练项目
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { icon: '🔢', label: '数字记忆', desc: '听觉记忆训练' },
            { icon: '👂', label: '听口令', desc: '完整听指令' },
            { icon: '🔲', label: '舒尔特方格', desc: '视觉专注' },
            { icon: '🔍', label: '找不同', desc: '持续专注' },
            { icon: '🧩', label: '顺序记忆', desc: '信息记忆' },
            { icon: '📝', label: '作业闯关', desc: '作业分段训练' },
          ].map((item) => (
            <div key={item.label} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer spacing */}
      <div style={{ height: '1rem' }} />
    </div>
  );
}
