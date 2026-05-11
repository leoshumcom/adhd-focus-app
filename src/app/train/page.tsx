'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

interface GameCard {
  id: string;
  icon: string;
  name: string;
  desc: string;
  status: 'completed' | 'pending' | 'checked';
}

const GAMES: GameCard[] = [
  { id: 'memory_digits', icon: '🔢', name: '数字记忆复述', desc: '听数字序列并复述，训练听觉记忆', status: 'pending' },
  { id: 'listen_commands', icon: '👂', name: '听口令做动作', desc: '听指令做动作，训练完整听指令', status: 'pending' },
  { id: 'schulte_grid', icon: '🔲', name: '舒尔特方格', desc: '按序点击数字，训练视觉专注力', status: 'pending' },
  { id: 'spot_diff', icon: '🔍', name: '视觉找不同', desc: '对比两幅图，训练持续专注力', status: 'pending' },
  { id: 'sequence_memory', icon: '🧩', name: '顺序记忆闯关', desc: '记住顺序并还原，训练信息记忆', status: 'pending' },
  { id: 'breathing_light', icon: '💡', name: '专注力呼吸灯', desc: '跟随呼吸灯节奏，训练放松专注', status: 'pending' },
];

function getToday() {
  const d = new Date();
  const off = 8 * 60;
  const local = new Date(d.getTime() + off * 60 * 1000);
  return local.toISOString().split('T')[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00+08:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
}

export default function TrainPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [games, setGames] = useState<GameCard[]>(GAMES);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const today = getToday();

  useEffect(() => { setMounted(true); }, []);

  // Load check-in status when mounted
  useEffect(() => {
    const saved = localStorage.getItem(`adhd-checkin-${today}`);
    if (saved === 'done') {
      setCheckedIn(true);
      setGames((prev) => prev.map((g) => ({ ...g, status: 'checked' } as GameCard)));
    }
  }, [today]);

  const handleCheckin = async () => {
    setCheckinLoading(true);
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      });
      const data = await res.json();
      if (res.ok || data.success) {
        setCheckedIn(true);
        localStorage.setItem(`adhd-checkin-${today}`, 'done');
        setGames((prev) => prev.map((g) => ({ ...g, status: 'checked' } as GameCard)));
      }
    } catch {
      // fallback: set as checked anyway for demo
      setCheckedIn(true);
      localStorage.setItem(`adhd-checkin-${today}`, 'done');
      setGames((prev) => prev.map((g) => ({ ...g, status: 'checked' } as GameCard)));
    } finally {
      setCheckinLoading(false);
    }
  };

  if (!mounted) return null;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span style={{
            background: 'var(--accent-green)',
            color: 'white',
            padding: '0.15rem 0.5rem',
            borderRadius: theme === 'egg' ? '1rem' : '0px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
          }}>已完成</span>
        );
      case 'checked':
        return (
          <span style={{
            background: 'var(--accent-blue)',
            color: 'white',
            padding: '0.15rem 0.5rem',
            borderRadius: theme === 'egg' ? '1rem' : '0px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
          }}>已打卡</span>
        );
      default:
        return (
          <span style={{
            background: 'var(--border-default)',
            color: 'var(--text-secondary)',
            padding: '0.15rem 0.5rem',
            borderRadius: theme === 'egg' ? '1rem' : '0px',
            fontSize: '0.7rem',
          }}>未完成</span>
        );
    }
  };

  const navItems = [
    { href: '/train', label: '训练', icon: '🎯' },
    { href: '/homework', label: '作业', icon: '📝' },
    { href: '/rewards', label: '抽奖', icon: '🎁' },
    { href: '/profile', label: '个人中心', icon: '👤' },
  ];

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div className="animate-float" style={{ fontSize: '2.5rem' }}>
          {theme === 'egg' ? '🎮' : '⛏️'}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>每日训练</h1>
      </div>

      {/* Date & Check-in */}
      <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📅 {formatDate(today)}</div>
          <div style={{ fontSize: '0.75rem', color: checkedIn ? 'var(--accent-green)' : 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {checkedIn ? '✅ 今日已打卡' : '⏳ 今日未打卡'}
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleCheckin}
          disabled={checkedIn || checkinLoading}
          style={{
            padding: '0.4rem 1.2rem',
            fontSize: '0.85rem',
            opacity: checkedIn ? 0.5 : 1,
          }}
        >
          {checkinLoading ? '...' : (checkedIn ? '已打卡' : '🌟 打卡')}
        </button>
      </div>

      {/* Game Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {games.map((game) => (
          <div
            key={game.id}
            className="card"
            style={{
              padding: '0.85rem',
              cursor: checkedIn ? 'pointer' : 'not-allowed',
              textAlign: 'center',
              opacity: checkedIn ? 1 : 0.6,
              transition: 'all 0.2s',
            }}
            onClick={() => {
              if (checkedIn) {
                router.push(`/train/${game.id}`);
              }
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '0.3rem' }}>{game.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{game.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
              {game.desc}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {statusBadge(game.status)}
            </div>
          </div>
        ))}
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
