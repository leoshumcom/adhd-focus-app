'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTheme, type Theme } from '@/lib/theme-context';

interface ChildInfo {
  id: string;
  name: string;
  age: string;
  gender: 'boy' | 'girl' | '';
  points: number;
  streak: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', age: '', gender: '' as 'boy' | 'girl' | '' });
  const [stats, setStats] = useState({
    totalPoints: 0,
    streakDays: 0,
    badges: 0,
    completedGames: 0,
    totalFocusMinutes: 0,
  });
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [savingChild, setSavingChild] = useState(false);
  const [childError, setChildError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Load children from API when session is ready
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadChildren = async () => {
      setLoadingChildren(true);
      try {
        const res = await fetch(`/api/children?parent_id=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.children && data.children.length > 0) {
            const mapped: ChildInfo[] = data.children.map((c: any) => ({
              id: c.id,
              name: c.name,
              age: c.age || c.birth_date || '5',
              gender: c.gender || '' as 'boy' | 'girl' | '',
              points: c.total_points || 0,
              streak: c.streak_days || 0,
            }));
            setChildren(mapped);
            // Also cache in localStorage
            localStorage.setItem('adhd-children', JSON.stringify(mapped));
            return;
          }
        }
      } catch {
        // Fallback to localStorage
      }

      // Fallback: load from localStorage
      const saved = localStorage.getItem('adhd-children');
      if (saved) {
        try {
          const cached = JSON.parse(saved);
          if (cached.length > 0) {
            setChildren(cached);
            setLoadingChildren(false);
            return;
          }
        } catch {}
      }

      // Default fallback
      setChildren([
        { id: '1', name: '小明', age: '8', gender: 'boy', points: 230, streak: 5 },
      ]);
      setLoadingChildren(false);
    };

    loadChildren();
  }, [session]);

  // Save to localStorage as cache
  useEffect(() => {
    if (typeof window !== 'undefined' && children.length > 0) {
      localStorage.setItem('adhd-children', JSON.stringify(children));
    }
  }, [children]);

  // Compute stats
  useEffect(() => {
    const points = typeof window !== 'undefined' ? localStorage.getItem('adhd-points') : null;
    const totalPoints = points ? parseInt(points, 10) : children.reduce((s, c) => s + c.points, 0);
    const streakDays = Math.max(...children.map((c) => c.streak), 0);
    setStats({
      totalPoints,
      streakDays,
      badges: 3,
      completedGames: 24,
      totalFocusMinutes: 180,
    });
  }, [children]);

  // Add child - sync to API
  const addChild = async () => {
    if (!newChild.name.trim()) return;

    if (!session?.user?.id) {
      setChildError('请先登录');
      return;
    }

    setSavingChild(true);
    setChildError('');

    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: session.user.id,
          name: newChild.name.trim(),
          gender: newChild.gender || 'boy',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '添加失败');
      }

      const data = await res.json();

      const child: ChildInfo = {
        id: data.childId || Date.now().toString(),
        name: newChild.name.trim(),
        age: newChild.age || '5',
        gender: newChild.gender,
        points: 0,
        streak: 0,
      };

      setChildren((prev) => [...prev, child]);
      setNewChild({ name: '', age: '', gender: '' });
      setShowAddChild(false);
    } catch (error: any) {
      setChildError(error.message || '添加孩子失败，请稍后重试');
    } finally {
      setSavingChild(false);
    }
  };

  const removeChild = (id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const handleLogout = async () => {
    localStorage.removeItem('adhd-children');
    await signOut({ callbackUrl: '/' });
  };

  if (!mounted) return null;

  const navItems = [
    { href: '/train', label: '训练', icon: '🎯' },
    { href: '/homework', label: '作业', icon: '📝' },
    { href: '/rewards', label: '抽奖', icon: '🎁' },
    { href: '/profile', label: '个人中心', icon: '👤' },
  ];

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: theme === 'egg' ? '1rem' : '0px',
    border: '2px solid var(--border-default)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-family)',
    outline: 'none',
  };

  const statCard = (icon: string, value: number, label: string, accent: string) => (
    <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{icon}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: accent }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      {/* Profile Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div
          className="animate-float"
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 0.5rem',
            border: '3px solid var(--border-default)',
            color: 'white',
          }}
        >
          {session?.user?.name?.[0] || (theme === 'egg' ? '🥚' : '⛏️')}
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          {session?.user?.name || '家长'}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {session?.user?.email || '家长账号'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {statCard('⭐', stats.totalPoints, '总积分', 'var(--accent-tertiary)')}
        {statCard('🔥', stats.streakDays, '连续打卡', 'var(--accent-primary)')}
        {statCard('🏅', stats.badges, '勋章数', 'var(--accent-green)')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        {statCard('🎮', stats.completedGames, '完成游戏', 'var(--accent-blue)')}
        {statCard('⏱️', stats.totalFocusMinutes, '专注分钟', 'var(--accent-secondary)')}
      </div>

      {/* Theme Toggle */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {theme === 'egg' ? '🎨 主题皮肤' : '🎨 THEME SKIN'}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['egg', 'minecraft'] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: theme === 'egg' ? '1rem' : '0px',
                border: `3px solid ${theme === t ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                background: theme === t ? 'var(--bg-button)' : 'white',
                color: theme === t ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{t === 'egg' ? '🥚' : '⛏️'}</span>
              <span>{t === 'egg' ? '蛋仔派对' : '我的世界'}</span>
            </button>
          ))}
        </div>
        <div style={{
          marginTop: '0.5rem',
          padding: '0.4rem',
          borderRadius: theme === 'egg' ? '0.75rem' : '0px',
          background: 'var(--bg-secondary)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}>
          {theme === 'egg'
            ? '🥚 粉色可爱风格，适合低龄儿童'
            : '⛏️ 像素方块风格，适合喜欢Minecraft的孩子'}
        </div>
      </div>

      {/* Child Management */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            {theme === 'egg' ? '👨‍👩‍👧‍👦 孩子管理' : '⛏️ CHILD MANAGEMENT'}
          </h3>
          <button
            className="btn-primary"
            onClick={() => setShowAddChild(true)}
            style={{ padding: '0.25rem 0.8rem', fontSize: '0.75rem' }}
          >
            + 添加孩子
          </button>
        </div>

        {loadingChildren ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem 0' }}>
            加载中...
          </div>
        ) : children.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem 0' }}>
            还没有添加孩子
          </div>
        ) : (
          children.map((child) => (
            <div
              key={child.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: child.gender === 'boy' ? '#7EC8E3' : '#FFB3C6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
              }}>
                {child.gender === 'boy' ? '👦' : (child.gender === 'girl' ? '👧' : '🧒')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{child.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {child.age}岁 · ⭐ {child.points}分 · 🔥 {child.streak}天
                </div>
              </div>
              <button
                onClick={() => removeChild(child.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF6B6B',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
                title="移除"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem',
          }}
          onClick={() => setShowAddChild(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '360px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              {theme === 'egg' ? '➕ 添加孩子' : '➕ ADD CHILD'}
            </h3>

            {childError && (
              <div
                style={{
                  background: '#FFF0F0',
                  border: '1px solid #FF6B6B',
                  borderRadius: theme === 'egg' ? '0.75rem' : '0px',
                  padding: '0.4rem 0.6rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#CC0000',
                  textAlign: 'center',
                }}
              >
                {childError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem', fontWeight: 'bold' }}>名字</label>
                <input
                  type="text"
                  value={newChild.name}
                  onChange={(e) => setNewChild((p) => ({ ...p, name: e.target.value }))}
                  placeholder="输入孩子名字"
                  autoFocus
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem', fontWeight: 'bold' }}>年龄</label>
                <input
                  type="number"
                  value={newChild.age}
                  onChange={(e) => setNewChild((p) => ({ ...p, age: e.target.value }))}
                  placeholder="几岁"
                  min={3}
                  max={18}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem', fontWeight: 'bold' }}>性别</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['boy', 'girl'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setNewChild((p) => ({ ...p, gender: p.gender === g ? '' : g }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: theme === 'egg' ? '1rem' : '0px',
                        border: `2px solid ${newChild.gender === g ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        background: newChild.gender === g ? 'var(--bg-button)' : 'white',
                        color: newChild.gender === g ? 'white' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-family)',
                        fontSize: '0.85rem',
                      }}
                    >
                      {g === 'boy' ? '👦 男孩' : '👧 女孩'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  className="btn-primary"
                  onClick={addChild}
                  disabled={!newChild.name.trim() || savingChild}
                  style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                >
                  {savingChild ? '保存中...' : '添加'}
                </button>
                <button
                  onClick={() => { setShowAddChild(false); setChildError(''); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: theme === 'egg' ? '1rem' : '0px',
                    border: '2px solid var(--border-default)',
                    background: 'white',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family)',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout & Version */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className="btn-primary"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.6rem',
            fontSize: '0.9rem',
            background: theme === 'egg'
              ? 'linear-gradient(135deg, #FF6B6B, #EE5A24)'
              : undefined,
          }}
        >
          {theme === 'egg' ? '🚪 退出登录' : '▶ LOGOUT'}
        </button>
        <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
          ADHD专注力闯关 v1.0.0
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => { e.preventDefault(); router.push(item.href); }}
            className={pathname === item.href ? 'active' : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
