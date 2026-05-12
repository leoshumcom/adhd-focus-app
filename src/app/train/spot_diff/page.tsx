'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useSession } from 'next-auth/react';

interface SpotDiffPuzzle {
  items: { label: string; emoji: string; diff: boolean }[];
  found: Set<number>;
}

const PUZZLES: SpotDiffPuzzle[] = [
  {
    items: [
      { label: '太阳', emoji: '☀️', diff: false },
      { label: '月亮', emoji: '🌙', diff: false },
      { label: '星星', emoji: '⭐', diff: false },
      { label: '云朵', emoji: '☁️', diff: false },
      { label: '彩虹', emoji: '🌈', diff: true },
      { label: '花朵', emoji: '🌸', diff: false },
      { label: '大树', emoji: '🌳', diff: true },
      { label: '小鸟', emoji: '🐦', diff: false },
    ],
    found: new Set(),
  },
  {
    items: [
      { label: '苹果', emoji: '🍎', diff: false },
      { label: '香蕉', emoji: '🍌', diff: true },
      { label: '葡萄', emoji: '🍇', diff: false },
      { label: '西瓜', emoji: '🍉', diff: false },
      { label: '橙子', emoji: '🍊', diff: false },
      { label: '草莓', emoji: '🍓', diff: true },
      { label: '柠檬', emoji: '🍋', diff: false },
      { label: '樱桃', emoji: '🍒', diff: false },
    ],
    found: new Set(),
  },
  {
    items: [
      { label: '红色', emoji: '🔴', diff: false },
      { label: '蓝色', emoji: '🔵', diff: false },
      { label: '黄色', emoji: '🟡', diff: true },
      { label: '绿色', emoji: '🟢', diff: false },
      { label: '紫色', emoji: '🟣', diff: false },
      { label: '橙色', emoji: '🟠', diff: false },
      { label: '粉色', emoji: '🩷', diff: true },
      { label: '黑色', emoji: '⚫', diff: false },
    ],
    found: new Set(),
  },
];

export default function SpotDiffGame() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<'ready' | 'playing' | 'result'>('ready');
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [foundItems, setFoundItems] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const totalPuzzles = PUZZLES.length;

  useEffect(() => { setMounted(true); }, []);

  const startGame = () => {
    setCurrentPuzzle(0);
    setScore(0);
    setCompleted(false);
    setFoundItems(new Set());
    setMessage('');
    setStage('playing');
  };

  const handleItemClick = (idx: number) => {
    if (foundItems.has(idx)) return;

    const puzzle = PUZZLES[currentPuzzle];
    if (puzzle.items[idx].diff) {
      const newFound = new Set(foundItems);
      newFound.add(idx);
      setFoundItems(newFound);
      setScore((s) => s + 20);
      setMessage(`✅ 找到了！`);

      // Check if all differences found
      const totalDiff = puzzle.items.filter((i) => i.diff).length;
      if (newFound.size >= totalDiff) {
        if (currentPuzzle < totalPuzzles - 1) {
          setMessage('🎉 过关！进入下一关');
          setTimeout(() => {
            setCurrentPuzzle((p) => p + 1);
            setFoundItems(new Set());
            setMessage('');
          }, 1000);
        } else {
          setStage('result');
        }
      }
    } else {
      setScore((s) => Math.max(0, s - 5));
      setMessage('❌ 这里没有不同');
    }
  };

  const completeGame = async () => {
    setSaving(true);
    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: session?.user?.id || '',
          game_type: 'spot_diff',
          score,
          level: currentPuzzle + 1,
          duration_seconds: 0,
          completed: true,
        }),
      });
    } catch {}
    setCompleted(true);
    setSaving(false);
  };

  if (!mounted) return null;

  const puzzle = PUZZLES[currentPuzzle];

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🔍</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>视觉找不同</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            找出两幅图不同的地方
          </p>
        </div>

        {/* Info Bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', padding: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>得分</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-tertiary)' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>关卡</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
              {currentPuzzle + 1}/{totalPuzzles}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          {stage === 'ready' && !completed && (
            <div>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {totalPuzzles} 关，每关找出不同的图标
              </p>
              <button className="btn-primary" onClick={startGame} style={{ padding: '0.6rem 2rem', fontSize: '1rem' }}>
                🎮 开始
              </button>
            </div>
          )}

          {stage === 'playing' && (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                点击下面不同的图标（每关 {puzzle.items.filter((i) => i.diff).length} 处不同）
              </p>

              {/* Two columns - side by side comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {/* Left side: original */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>图 A</div>
                  <div style={{
                    border: '2px solid var(--border-default)',
                    borderRadius: theme === 'egg' ? '0.75rem' : '0px',
                    padding: '0.5rem',
                    background: '#F9F9F9',
                  }}>
                    {puzzle.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.3rem 0.4rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          borderRadius: theme === 'egg' ? '0.5rem' : '0px',
                          background: foundItems.has(idx) ? 'rgba(76, 175, 80, 0.15)' : 'transparent',
                          border: foundItems.has(idx) ? '1px solid var(--accent-green)' : '1px solid transparent',
                          marginBottom: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                        onClick={() => handleItemClick(idx)}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                        {foundItems.has(idx) && <span style={{ marginLeft: 'auto', color: 'var(--accent-green)', fontSize: '0.7rem' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: same but with differences */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>图 B</div>
                  <div style={{
                    border: '2px solid var(--border-default)',
                    borderRadius: theme === 'egg' ? '0.75rem' : '0px',
                    padding: '0.5rem',
                    background: '#F9F9F9',
                  }}>
                    {puzzle.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.3rem 0.4rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          borderRadius: theme === 'egg' ? '0.5rem' : '0px',
                          background: foundItems.has(idx) ? 'rgba(76, 175, 80, 0.15)' : 'transparent',
                          border: foundItems.has(idx) ? '1px solid var(--accent-green)' : '1px solid transparent',
                          marginBottom: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                        onClick={() => handleItemClick(idx)}
                      >
                        <span style={{
                          opacity: item.diff && !foundItems.has(idx) ? 0.9 : 1,
                          transform: item.diff && !foundItems.has(idx) ? 'scale(1.1)' : 'scale(1)',
                          display: 'inline-block',
                        }}>
                          {item.diff ? '❓' : item.emoji}
                        </span>
                        <span style={{
                          color: item.diff && !foundItems.has(idx) ? '#FF6B6B' : 'inherit',
                          fontWeight: item.diff && !foundItems.has(idx) ? 'bold' : 'normal',
                        }}>
                          {item.diff ? '???' : item.label}
                        </span>
                        {foundItems.has(idx) && <span style={{ marginLeft: 'auto', color: 'var(--accent-green)', fontSize: '0.7rem' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {message && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: message.startsWith('✅') ? 'var(--accent-green)' : '#FF6B6B' }}>
                  {message}
                </p>
              )}
            </div>
          )}

          {(stage === 'result' || completed) && (
            <div>
              {completed ? (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-green)' }}>游戏完成！</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>得分：{score}</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>全部通关！</p>
                  <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    最终得分：{score}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={startGame} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
                      再来一次
                    </button>
                    {!completed && (
                      <button
                        className="btn-primary"
                        onClick={completeGame}
                        disabled={saving}
                        style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: 'var(--accent-green)' }}
                      >
                        {saving ? '保存中...' : '✅ 完成打卡'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => router.push('/train')}
          style={{
            width: '100%',
            padding: '0.6rem',
            borderRadius: theme === 'egg' ? '1rem' : '0px',
            border: '2px solid var(--border-default)',
            background: 'white',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-family)',
          }}
        >
          ← 返回训练页
        </button>
      </div>
    </div>
  );
}
