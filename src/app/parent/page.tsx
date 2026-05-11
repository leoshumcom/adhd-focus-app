'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Child, Reward } from '@/types';

export default function ParentDashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tab, setTab] = useState<'children' | 'rewards'>('children');
  const [newChildName, setNewChildName] = useState('');
  const [newChildGender, setNewChildGender] = useState<'boy' | 'girl'>('boy');
  const [newReward, setNewReward] = useState({ name: '', cost_points: 10 });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/children?parent_id=${session.user.id}`)
      .then(r => r.json())
      .then(d => setChildren(d.children || []));
    fetch(`/api/rewards?parent_id=${session.user.id}`)
      .then(r => r.json())
      .then(d => setRewards(d.rewards || []));
  }, [session, refresh]);

  if (status === 'loading') return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;

  const addChild = async () => {
    if (!newChildName || !session?.user?.id) return;
    await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: session.user.id, name: newChildName, gender: newChildGender }),
    });
    setNewChildName('');
    setRefresh(r => r + 1);
  };

  const addReward = async () => {
    if (!newReward.name || !session?.user?.id) return;
    await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: session.user.id, ...newReward }),
    });
    setNewReward({ name: '', cost_points: 10 });
    setRefresh(r => r + 1);
  };

  const deleteReward = async (id: string) => {
    await fetch(`/api/rewards?id=${id}`, { method: 'DELETE' });
    setRefresh(r => r + 1);
  };

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {theme === 'egg' ? '📋 家长后台' : '📋 PARENT DASHBOARD'}
      </h1>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={tab === 'children' ? 'btn-primary' : 'card'}
          style={{ flex: 1, padding: '0.6rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.9rem' }}
          onClick={() => setTab('children')}
        >
          {theme === 'egg' ? '👶 孩子管理' : '👶 CHILDREN'}
        </button>
        <button
          className={tab === 'rewards' ? 'btn-primary' : 'card'}
          style={{ flex: 1, padding: '0.6rem', cursor: 'pointer', textAlign: 'center', fontSize: '0.9rem' }}
          onClick={() => setTab('rewards')}
        >
          {theme === 'egg' ? '🎁 奖励库' : '🎁 REWARDS'}
        </button>
      </div>

      {tab === 'children' && (
        <>
          {/* Children List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {children.map(child => (
              <div key={child.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{child.gender === 'girl' ? '👧' : '👦'}</span>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{child.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ⭐ {child.total_points}分 | 🔥 {child.streak_days}天
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Child Form */}
          <div className="card">
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>添加孩子</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                value={newChildName}
                onChange={e => setNewChildName(e.target.value)}
                placeholder="孩子名字"
                style={{
                  padding: '0.5rem',
                  borderRadius: theme === 'egg' ? '0.75rem' : '0',
                  border: '2px solid var(--border-default)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '1rem',
                }}
              />
              <select
                value={newChildGender}
                onChange={e => setNewChildGender(e.target.value as any)}
                style={{
                  padding: '0.5rem',
                  borderRadius: theme === 'egg' ? '0.75rem' : '0',
                  border: '2px solid var(--border-default)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '1rem',
                }}
              >
                <option value="boy">👦 男孩</option>
                <option value="girl">👧 女孩</option>
              </select>
              <button className="btn-primary" onClick={addChild} style={{ padding: '0.5rem' }}>
                {theme === 'egg' ? '➕ 添加' : '➕ ADD'}
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'rewards' && (
        <>
          {/* Rewards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {rewards.map(reward => (
              <div key={reward.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{reward.icon || '🎁'} {reward.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ⭐ {reward.cost_points}分 | {reward.reward_type === 'privilege' ? '特权' : reward.reward_type === 'activity' ? '活动' : '物品'}
                  </div>
                </div>
                <button
                  style={{ color: '#FF6B6B', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.85rem' }}
                  onClick={() => deleteReward(reward.id)}
                >
                  删除
                </button>
              </div>
            ))}
            {rewards.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                还没有添加奖励，添加一些吧！
              </div>
            )}
          </div>

          {/* Add Reward Form */}
          <div className="card">
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>添加奖励</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                value={newReward.name}
                onChange={e => setNewReward({ ...newReward, name: e.target.value })}
                placeholder="奖励名称 (如: 多看10分钟动画)"
                style={{
                  padding: '0.5rem',
                  borderRadius: theme === 'egg' ? '0.75rem' : '0',
                  border: '2px solid var(--border-default)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '1rem',
                }}
              />
              <input
                type="number"
                value={newReward.cost_points}
                onChange={e => setNewReward({ ...newReward, cost_points: parseInt(e.target.value) || 10 })}
                placeholder="所需积分"
                style={{
                  padding: '0.5rem',
                  borderRadius: theme === 'egg' ? '0.75rem' : '0',
                  border: '2px solid var(--border-default)',
                  fontFamily: 'var(--font-family)',
                  fontSize: '1rem',
                }}
              />
              <button className="btn-primary" onClick={addReward} style={{ padding: '0.5rem' }}>
                {theme === 'egg' ? '🎁 添加奖励' : '🎁 ADD REWARD'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
