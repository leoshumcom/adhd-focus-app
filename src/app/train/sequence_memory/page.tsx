'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useSession } from 'next-auth/react';

const COLORS = [
  { name: '红色', value: '#FF4444' },
  { name: '蓝色', value: '#4488FF' },
  { name: '绿色', value: '#44BB44' },
  { name: '黄色', value: '#FFCC00' },
];

type PlayState = 'showing' | 'input' | 'result';

export default function SequenceMemoryGame() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<'ready' | 'playing' | 'done'>('ready');
  const [playState, setPlayState] = useState<PlayState>('showing');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setMounted(true);
    return () => {
      timeoutRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const showSequence = (seq: number[]) => {
    setPlayState('showing');
    setPlayerSequence([]);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    seq.forEach((colorIdx, i) => {
      const t1 = setTimeout(() => {
        setActiveIndex(colorIdx);
      }, i * 500);
      const t2 = setTimeout(() => {
        setActiveIndex(-1);
      }, i * 500 + 350);
      timeouts.push(t1, t2);
    });

    const finalT = setTimeout(() => {
      setPlayState('input');
      setActiveIndex(-1);
    }, seq.length * 500 + 100);

    timeoutRef.current = timeouts;
    timeoutRef.current.push(finalT);
  };

  const startRound = () => {
    const len = Math.min(2 + level, 8);
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * COLORS.length));
    setSequence(seq);
    setMessage('');
    showSequence(seq);
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setCompleted(false);
    setStage('playing');
    setTimeout(() => startRound(), 500);
  };

  const handleColorClick = (colorIdx: number) => {
    if (playState !== 'input') return;

    const newSeq = [...playerSequence, colorIdx];
    setPlayerSequence(newSeq);
    setActiveIndex(colorIdx);
    setTimeout(() => setActiveIndex(-1), 200);

    // Check
    const expected = sequence[playerSequence.length];
    if (colorIdx !== expected) {
      // Wrong
      setMessage(`❌ 点错了！正确顺序：${sequence.map((i) => COLORS[i].name).join(' → ')}`);
      setPlayState('result');
      return;
    }

    // Correct so far
    if (newSeq.length === sequence.length) {
      // Round complete
      const roundScore = level * 15;
      setScore((s) => s + roundScore);
      setLevel((l) => l + 1);
      setMessage(`✅ 正确！+${roundScore}分`);
      setPlayState('result');

      if (level >= 6) {
        // Max level reached
        setTimeout(() => setStage('done'), 1000);
      } else {
        setTimeout(() => startRound(), 1200);
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
          game_type: 'sequence_memory',
          score,
          level,
          duration_seconds: 0,
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
          <div style={{ fontSize: '2rem' }}>🧩</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>顺序记忆闯关</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            记住颜色的闪烁顺序，然后点击还原
          </p>
        </div>

        {/* Info */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', padding: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>得分</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-tertiary)' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>关卡</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
              Lv.{level}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}">长度</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-secondary)' }}>
              {Math.min(2 + level, 8)}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="card" style={{ padding: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
          {stage === 'ready' && !completed && (
            <div>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                观察颜色闪烁顺序，然后按顺序点击
              </p>
              <button className="btn-primary" onClick={startGame} style={{ padding: '0.6rem 2rem', fontSize: '1rem' }}>
                🎮 开始
              </button>
            </div>
          )}

          {stage === 'playing' && (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {playState === 'showing' ? '👀 记住顺序...' : '✋ 按顺序点击颜色'}
              </p>

              {/* Color buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxWidth: '280px', margin: '0 auto' }}>
                {COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleColorClick(idx)}
                    disabled={playState !== 'input'}
                    style={{
                      aspectRatio: '1',
                      borderRadius: theme === 'egg' ? '1.5rem' : '0px',
                      border: 'none',
                      background: activeIndex === idx
                        ? color.value
                        : playState === 'input'
                          ? `linear-gradient(135deg, ${color.value}, ${color.value}88)`
                          : color.value,
                      opacity: playState === 'input' ? 1 : 0.7,
                      cursor: playState === 'input' ? 'pointer' : 'default',
                      boxShadow: activeIndex === idx
                        ? `0 0 20px ${color.value}, inset 0 0 15px rgba(255,255,255,0.3)`
                        : `0 2px 8px rgba(0,0,0,0.15)`,
                      transition: 'all 0.15s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      color: 'white',
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}>
                      {activeIndex === idx ? '✨' : ''}
                    </span>
                  </button>
                ))}
              </div>

              {/* Progress */}
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {playState === 'input' && (
                  <span>
                    已点 {playerSequence.length}/{sequence.length}
                    <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center', marginTop: '0.3rem' }}>
                      {Array.from({ length: sequence.length }, (_, i) => (
                        <span
                          key={i}
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: i < playerSequence.length ? 'var(--accent-green)' : 'var(--border-default)',
                            display: 'inline-block',
                          }}
                        />
                      ))}
                    </div>
                  </span>
                )}
              </div>

              {message && (
                <p style={{
                  marginTop: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: message.startsWith('✅') ? 'var(--accent-green)' : '#FF6B6B',
                }}>
                  {message}
                </p>
              )}
            </div>
          )}

          {(stage === 'done' || completed) && (
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
                    最高关：Lv.{level} · 得分：{score}
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
