'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

interface Prize {
  id: string;
  name: string;
  icon: string;
  probability: number;
  color: string;
  isWin: boolean;
}

const PRIZES: Prize[] = [
  { id: '1', name: '额外看动画片15分钟', icon: '📺', probability: 15, color: '#FFD93D', isWin: true },
  { id: '2', name: '选一个小礼物', icon: '🎁', probability: 10, color: '#C29BFF', isWin: true },
  { id: '3', name: '周末去公园玩', icon: '🌳', probability: 5, color: '#8BC48A', isWin: true },
  { id: '4', name: '5积分', icon: '⭐', probability: 30, color: '#7EC8E3', isWin: true },
  { id: '5', name: '下次再努力', icon: '😅', probability: 25, color: '#FFD1DC', isWin: false },
  { id: '6', name: '2积分', icon: '✨', probability: 15, color: '#FFB347', isWin: true },
];

interface SpinRecordItem {
  prize: string;
  points: number;
  date: string;
}

type TabKey = 'spin' | 'settings' | 'records';

export default function RewardsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [points, setPoints] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [records, setRecords] = useState<SpinRecordItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('spin');
  const wheelRef = useRef<HTMLDivElement>(null);

  // Reward settings
  const [rewardSettings, setRewardSettings] = useState<Prize[]>(PRIZES);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const saved = localStorage.getItem('adhd-points');
    if (saved) setPoints(parseInt(saved, 10));
    const savedRecords = localStorage.getItem('adhd-spin-records');
    if (savedRecords) {
      try { setRecords(JSON.parse(savedRecords)); } catch {}
    }
  }, []);

  const savePoints = (p: number) => {
    setPoints(p);
    localStorage.setItem('adhd-points', String(p));
  };

  const doSpin = () => {
    if (spinning || points < 10) return;
    setSpinning(true);
    setShowResult(false);
    setSpinResult(null);

    // Deduct points
    savePoints(points - 10);

    // Pick prize by probability
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selected = PRIZES[PRIZES.length - 1];
    for (const prize of PRIZES) {
      cumulative += prize.probability;
      if (rand <= cumulative) {
        selected = prize;
        break;
      }
    }

    // Animate
    if (wheelRef.current) {
      const deg = 720 + Math.random() * 360;
      wheelRef.current.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
      wheelRef.current.style.transform = `rotate(${deg}deg)`;
    }

    setTimeout(() => {
      setSpinning(false);
      setSpinResult(selected);
      setShowResult(true);

      const record: SpinRecordItem = {
        prize: selected.name,
        points: 10,
        date: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      };
      const updatedRecords = [record, ...records].slice(0, 50);
      setRecords(updatedRecords);
      localStorage.setItem('adhd-spin-records', JSON.stringify(updatedRecords));

      // Add points if winning
      if (selected.id === '4') savePoints(points - 10 + 5);
      if (selected.id === '6') savePoints(points - 10 + 2);
    }, 3100);
  };

  const startEditReward = (id: string, name: string) => {
    setEditingReward(id);
    setEditName(name);
  };

  const saveEditReward = () => {
    if (!editingReward || !editName.trim()) return;
    setRewardSettings((prev) =>
      prev.map((r) => (r.id === editingReward ? { ...r, name: editName.trim() } : r))
    );
    setEditingReward(null);
    setEditName('');
  };

  if (!mounted) return null;

  const tabButton = (key: TabKey, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        flex: 1,
        padding: '0.5rem',
        borderRadius: theme === 'egg' ? '1rem' : '0px',
        border: `2px solid ${activeTab === key ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        background: activeTab === key ? 'var(--bg-button)' : 'white',
        color: activeTab === key ? 'white' : 'var(--text-primary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-family)',
        fontWeight: activeTab === key ? 'bold' : 'normal',
        fontSize: '0.8rem',
        transition: 'all 0.2s',
      }}
    >
      {icon} {label}
    </button>
  );

  const navItems = [
    { href: '/train', label: '训练', icon: '🎯' },
    { href: '/homework', label: '作业', icon: '📝' },
    { href: '/rewards', label: '抽奖', icon: '🎁' },
    { href: '/profile', label: '个人中心', icon: '👤' },
  ];

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div className="animate-float" style={{ fontSize: '2.5rem' }}>
          {theme === 'egg' ? '🎰' : '⛏️'}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>奖励抽奖</h1>
      </div>

      {/* Points Display */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>当前积分</div>
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: 'var(--accent-tertiary)',
          textShadow: theme === 'egg' ? '0 2px 8px rgba(255,217,61,0.4)' : 'none',
        }}>
          {points}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          每次抽奖消耗 10 积分
        </div>
      </div>

      {/* Spin Wheel */}
      {activeTab === 'spin' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
            <div
              ref={wheelRef}
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${PRIZES.map((p, i) => {
                    const start = PRIZES.slice(0, i).reduce((s, r) => s + r.probability, 0);
                    const end = start + p.probability;
                    return `${p.color} ${start}% ${end}%`;
                  }).join(', ')}
                )`,
                border: `6px solid var(--accent-primary)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                border: '3px solid var(--accent-primary)',
                zIndex: 2,
              }}>
                🎯
              </div>
            </div>
            {/* Pointer */}
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid var(--accent-primary)',
              marginTop: '-8px',
              zIndex: 3,
            }} />
            <button
              className="btn-primary"
              onClick={doSpin}
              disabled={spinning || points < 10}
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 2rem',
                fontSize: '1.1rem',
                opacity: spinning || points < 10 ? 0.6 : 1,
              }}
            >
              {spinning ? '🎡 转动中...' : (points < 10 ? '积分不足' : '🎰 抽奖')}
            </button>
          </div>

          {/* Result Modal */}
          {showResult && spinResult && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                padding: '1rem',
              }}
              onClick={() => setShowResult(false)}
            >
              <div
                className="card animate-float"
                style={{
                  textAlign: 'center',
                  maxWidth: '320px',
                  width: '100%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{spinResult.icon}</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {spinResult.isWin ? '🎉 恭喜中奖！' : '😅 下次加油！'}
                </h2>
                <p style={{ fontSize: '1rem', color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {spinResult.name}
                </p>
                {spinResult.id === '4' && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>获得 5 积分</p>}
                {spinResult.id === '6' && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>获得 2 积分</p>}
                <button
                  className="btn-primary"
                  onClick={() => setShowResult(false)}
                  style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 1.5rem' }}
                >
                  知道了
                </button>
              </div>
            </div>
          )}

          {/* Prize List */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>🎯 奖品列表</h3>
            {PRIZES.map((prize) => (
              <div
                key={prize.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.4rem 0',
                  borderBottom: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{prize.icon}</span>
                  <span style={{ fontSize: '0.8rem' }}>{prize.name}</span>
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'white',
                  background: prize.isWin ? 'var(--accent-green)' : 'var(--text-secondary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: theme === 'egg' ? '0.5rem' : '0px',
                }}>
                  {prize.probability}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {tabButton('spin', '抽奖', '🎰')}
        {tabButton('settings', '奖励设置', '⚙️')}
        {tabButton('records', '抽奖记录', '📋')}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            ⚙️ 奖励设置
          </h3>
          {rewardSettings.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
              {editingReward === r.id ? (
                <div style={{ flex: 1, display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.2rem 0.5rem',
                      borderRadius: theme === 'egg' ? '0.5rem' : '0px',
                      border: '2px solid var(--border-default)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-family)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={saveEditReward}
                    style={{
                      padding: '0.2rem 0.5rem',
                      background: 'var(--accent-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: theme === 'egg' ? '0.5rem' : '0px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    保存
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{r.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.probability}%</span>
                  <button
                    onClick={() => startEditReward(r.id, r.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: 'var(--accent-blue)',
                    }}
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            📋 抽奖记录
          </h3>
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '1rem 0' }}>
              还没有抽奖记录
            </div>
          ) : (
            records.slice(0, 20).map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0',
                  borderBottom: i < records.length - 1 ? '1px solid var(--border-default)' : 'none',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold' }}>{r.prize}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.3rem', fontSize: '0.7rem' }}>
                    -{r.points}分
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{r.date}</span>
              </div>
            ))
          )}
        </div>
      )}

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
