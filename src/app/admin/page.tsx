'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_active: number;
  is_admin: number;
  children_count: number;
  today_active: number;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalChildren: number;
  todayCheckins: number;
  totalCheckins: number;
  todayGames: number;
}

export default function AdminPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalChildren: 0,
    todayCheckins: 0,
    totalCheckins: 0,
    todayGames: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session?.user?.is_admin) return;
    setLoading(true);
    setError('');

    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      } else {
        const errData = await usersRes.json().catch(() => ({}));
        setError(errData.error || '获取用户数据失败');
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalUsers: statsData.totalUsers ?? 0,
          totalChildren: statsData.totalChildren ?? 0,
          todayCheckins: statsData.todayCheckins ?? 0,
          totalCheckins: statsData.totalCheckins ?? 0,
          todayGames: statsData.todayGames ?? 0,
        });
      }
    } catch (e) {
      setError('网络错误，无法加载数据');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session, router, fetchData]);

  const handleUserAction = async (userId: string, action: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || '操作失败');
      }
      // Refresh data
      await fetchData();
    } catch {
      setError('网络错误');
    }
  };

  if (status === 'loading') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;
  }

  if (!session?.user?.is_admin) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>无权访问</div>;
  }

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {theme === 'egg' ? '⚙️ 管理后台' : '⚙️ ADMIN'}
      </h1>

      {/* Error Message */}
      {error && (
        <div
          className="card"
          style={{
            background: '#FFF0F0',
            border: '2px solid #FF6B6B',
            textAlign: 'center',
            color: '#CC0000',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}
        >
          {error}
          <button
            onClick={fetchData}
            style={{
              marginLeft: '0.5rem',
              background: 'none',
              border: 'none',
              color: 'var(--accent-blue)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.85rem',
            }}
          >
            重试
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          加载中...
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: '用户总数', value: stats.totalUsers, color: 'var(--accent-primary)' },
          { label: '孩子总数', value: stats.totalChildren, color: 'var(--accent-secondary)' },
          { label: '今日打卡', value: stats.todayCheckins, color: 'var(--accent-tertiary)' },
          { label: '今日游戏', value: stats.todayGames, color: 'var(--accent-green)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* User Management */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>👥 用户管理</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {users.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>暂无注册用户</div>
        )}
        {users.map((user) => (
          <div
            key={user.id}
            className="card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                孩子: {user.children_count} | 今日活跃: {user.today_active}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {user.is_admin === 0 && (
                <>
                  <button
                    className="card"
                    style={{
                      padding: '0.3rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      border: `1px solid ${user.is_active ? '#FF6B6B' : 'var(--accent-green)'}`,
                      color: user.is_active ? '#FF6B6B' : 'var(--accent-green)',
                    }}
                    onClick={() => handleUserAction(user.id, user.is_active ? 'disable' : 'enable')}
                  >
                    {user.is_active ? '禁用' : '启用'}
                  </button>
                  <button
                    className="card"
                    style={{
                      padding: '0.3rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      border: '1px solid #FF6B6B',
                      color: '#FF6B6B',
                    }}
                    onClick={() => {
                      if (confirm(`确定删除用户 ${user.name}？此操作不可撤销。`)) {
                        handleUserAction(user.id, 'delete');
                      }
                    }}
                  >
                    删除
                  </button>
                </>
              )}
              {user.is_admin === 1 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--accent-primary)',
                    padding: '0.3rem 0.6rem',
                  }}
                >
                  管理员
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
