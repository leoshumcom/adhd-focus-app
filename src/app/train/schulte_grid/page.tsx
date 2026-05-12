'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useSession } from 'next-auth/react';

const GRID_SIZE = 5; // 5x5 grid

export default function SchulteGridGame() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [stage, setStage] = useState<'ready' | 'playing' | 'result'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clicked, setClicked] = useState<number[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const generateGrid = useCallback(() => {
    const nums = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    setNumbers(nums);
    setNextExpected(1);
    setClicked([]);
    startTimeRef.current = Date.now();
    setTimeLeft(60);
  }, []);

  const startGame = () => {
    setScore(0);
    setCompleted(false);
    setStage('playing');
    generateGrid();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStage('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleCellClick = (num: number) => {
    if (num === nextExpected) {
      setClicked((prev) => [...prev, num]);

      const points = 60 - Math.floor((Date.now() - startTimeRef.current) / 100);
      setScore((s) => s + Math.max(1, Math.min(points, 10)));
      startTimeRef.current = Date.now();

      if (num === GRID_SIZE * GRID_SIZE) {
        // All numbers clicked
        if (timerRef.current) clearInterval(timerRef.current);
        setStage('result');
      } else {
        setNextExpected(num + 1);
      }
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
          game_type: 'schulte_grid',
          score,
          level: 1,
          duration_seconds: 60,
          completed: true,
        }),
      });
    } catch {}
    setCompleted(true);
    setSaving(false);
  };

  if (!mounted) return null;

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🔲</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>舒尔特方格</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            按顺序点击数字 1→25，越快越好
          </p>
        </div>

        {/* Info Bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', padding: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>得分</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-tertiary)' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>下一个</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>{nextExpected}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>时间</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft < 10 ? '#FF6B6B' : 'var(--accent-green)' }}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Grid */}
        {stage === 'ready' && !completed && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              按 1→{GRID_SIZE * GRID_SIZE} 的顺序依次点击
            </p>
            <button className="btn-primary" onClick={startGame} style={{ padding: '0.6rem 2rem', fontSize: '1rem' }}>
              🎮 开始
            </button>
          </div>
        )}

        {stage === 'playing' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gap: '0.4rem',
              marginBottom: '1rem',
            }}
          >
            {numbers.map((num, idx) => {
              const isDone = clicked.includes(num);
              const isActive = num === nextExpected;
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(num)}
                  disabled={isDone}
                  style={{
                    aspectRatio: '1',
                    padding: '0',
                    borderRadius: theme === 'egg' ? '0.75rem' : '0px',
                    border: `2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    background: isDone ? 'var(--accent-green)' : 'white',
                    color: isDone ? 'white' : 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: isDone ? 'default' : 'pointer',
                    opacity: isDone ? 0.6 : 1,
                    fontFamily: 'var(--font-family)',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? '0 0 8px var(--accent-primary)' : 'none',
                  }}
                >
                  {isDone ? '✓' : num}
                </button>
              );
            })}
          </div>
        )}

        {(stage === 'result' || completed) && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1rem' }}>
            {completed ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-green)' }}>游戏完成！</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>得分：{score}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏰</div>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>时间到！</p>
                <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  点了 {clicked.length}/{GRID_SIZE * GRID_SIZE} 个 · 得分：{score}
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
