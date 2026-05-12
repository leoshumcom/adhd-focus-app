'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status !== 'authenticated') return;

    // Check if user is admin
    const isAdmin = session?.user && 'is_admin' in session.user ? (session.user as any).is_admin : false;
    if (!isAdmin) {
      setError('无权访问，仅限超级管理员');
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setError('');

    // Fetch data
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/users').then(r => r.json()).catch(() => ({})),
    ]).then(([statsData, usersData]) => {
      if (statsData.error) {
        setError(statsData.error);
      } else {
        setStats(statsData);
      }
      setUsers(usersData.users || []);
      setLoadingData(false);
    });
  }, [status, session, router]);

  const handleUserAction = async (userId: string, action: string) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action }),
    });
    // Refresh user list
    const d = await fetch('/api/admin/users').then(r => r.json());
    setUsers(d.users || []);
  };

  if (status === 'loading') {
    return <div className="page-content" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>加载中...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // will redirect
  }

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {theme === 'egg' ? '⚙️ 管理后台' : '⚙️ ADMIN'}
      </h1>

      {error && (
        <div className="card" style={{ background: '#FFF0F0', border: '2px solid #FF6B6B', textAlign: 'center', color: '#CC0000', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '用户总数', value: stats.totalUsers ?? 0, color: 'var(--accent-primary)' },
          { label: '孩子总数', value: stats.totalChildren ?? 0, color: 'var(--accent-secondary)' },
          { label: '今日打卡', value: stats.todayCheckins ?? 0, color: 'var(--accent-tertiary)' },
          { label: '今日游戏', value: stats.todayGames ?? 0, color: 'var(--accent-green)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: s.color }}>
              {loadingData ? '-' : (s.value ?? 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* User Management */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>👥 用户管理</h2>
      {loadingData ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>加载用户数据...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>暂无注册用户</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {users.map((user: any) => (
            <div key={user.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.name || '未知'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  孩子: {user.children_count || 0} | 今日活跃: {user.today_active || 0}
                  {user.is_admin ? ' | 👑 管理员' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {user.is_admin !== 1 && (
                  <>
                    <button
                      className="card"
                      style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', border: '1px solid var(--accent-green)' }}
                      onClick={() => handleUserAction(user.id, user.is_active ? 'disable' : 'enable')}
                    >
                      {user.is_active ? '禁用' : '启用'}
                    </button>
                    <button
                      className="card"
                      style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', border: '1px solid #FF6B6B', color: '#FF6B6B' }}
                      onClick={() => { if (confirm(`确认删除用户 ${user.name}？`)) handleUserAction(user.id, 'delete'); }}
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
