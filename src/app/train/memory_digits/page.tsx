'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useSession } from 'next-auth/react';

export default function MemoryDigitsGame() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<'ready' | 'showing' | 'input' | 'result'>('ready');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const generateSequence = useCallback((len: number) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 10));
  }, []);

  const startGame = () => {
    const len = Math.min(3 + level - 1, 9);
    const seq = generateSequence(len);
    setSequence(seq);
    setUserInput('');
    setMessage('');
    setStage('showing');

    setTimeout(() => {
      setStage('input');
    }, Math.max(1000, len * 600));
  };

  const submitAnswer = () => {
    const correct = userInput.trim() === sequence.join('');
    if (correct) {
      const newScore = score + level * 10;
      setScore(newScore);
      setLevel((l) => l + 1);
      setMessage('✅ 正确！进入下一关');
      setTimeout(() => {
        setStage('ready');
      }, 1000);
    } else {
      setMessage(`❌ 不对哦，正确的数字是：${sequence.join('')}`);
      setStage('result');
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
          game_type: 'memory_digits',
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

  // Handle Enter key on input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitAnswer();
  };

  if (!mounted) return null;

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🔢</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>数字记忆复述</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            记住显示的数字，然后按顺序输入
          </p>
        </div>

        {/* Score & Level */}
        <div
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '1rem',
            padding: '0.75rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>得分</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-tertiary)' }}>
              {score}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>当前关</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
              Lv.{level}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>数字长度</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-secondary)' }}>
              {Math.min(3 + level - 1, 9)}位
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '2rem',
            marginBottom: '1rem',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {stage === 'ready' && !completed && (
            <div>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                点击开始，记忆数字序列
              </p>
              <button
                className="btn-primary"
                onClick={startGame}
                style={{ padding: '0.6rem 2rem', fontSize: '1rem' }}
              >
                🎮 开始
              </button>
            </div>
          )}

          {stage === 'showing' && (
            <div>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                仔细观察 👀
              </div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.3em',
                  color: 'var(--accent-primary)',
                }}
              >
                {sequence.join(' ')}
              </div>
            </div>
          )}

          {stage === 'input' && (
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                输入你记住的数字
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={handleKeyDown}
                autoFocus
                placeholder="输入数字..."
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.2em',
                  borderRadius: theme === 'egg' ? '1rem' : '0px',
                  border: '2px solid var(--border-default)',
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                className="btn-primary"
                onClick={submitAnswer}
                disabled={!userInput.trim()}
                style={{ marginTop: '0.75rem', padding: '0.5rem 2rem', fontSize: '0.9rem' }}
              >
                确认
              </button>
            </div>
          )}

          {stage === 'result' && (
            <div>
              <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {message}
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                最终得分：{score} 分
              </p>
              <button
                className="btn-primary"
                onClick={startGame}
                style={{ padding: '0.5rem 2rem', fontSize: '0.9rem', marginRight: '0.5rem' }}
              >
                再来一次
              </button>
              {!completed && (
                <button
                  className="btn-primary"
                  onClick={completeGame}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 2rem',
                    fontSize: '0.9rem',
                    background: 'var(--accent-green)',
                  }}
                >
                  {saving ? '保存中...' : '✅ 完成打卡'}
                </button>
              )}
            </div>
          )}

          {completed && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-green)' }}>
                游戏完成！
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                得分：{score}
              </p>
            </div>
          )}

          {message && stage !== 'result' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--accent-green)' }}>
              {message}
            </p>
          )}
        </div>

        {/* Back Button */}
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
