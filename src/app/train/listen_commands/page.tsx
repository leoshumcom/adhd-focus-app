'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { useSession } from 'next-auth/react';

interface Command {
  action: string;
  emoji: string;
  description: string;
}

const COMMANDS: Command[] = [
  { action: 'raise_left', emoji: '🫲', description: '举起左手' },
  { action: 'raise_right', emoji: '🫱', description: '举起右手' },
  { action: 'clap', emoji: '👏', description: '拍拍手' },
  { action: 'stomp', emoji: '🦶', description: '跺跺脚' },
  { action: 'turn', emoji: '🔄', description: '转一圈' },
  { action: 'jump', emoji: '🦘', description: '跳一跳' },
  { action: 'pat_head', emoji: '🤲', description: '摸摸头' },
  { action: 'stand_still', emoji: '🧍', description: '站好不动' },
];

export default function ListenCommandsGame() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<'ready' | 'playing' | 'result'>('ready');
  const [currentRound, setCurrentRound] = useState(0);
  const [currentCommand, setCurrentCommand] = useState<Command | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const totalRounds = 5;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

  const getRandomCommand = (): Command => {
    return COMMANDS[Math.floor(Math.random() * COMMANDS.length)];
  };

  const startRound = () => {
    if (currentRound >= totalRounds) {
      setStage('result');
      return;
    }
    const cmd = getRandomCommand();
    setCurrentCommand(cmd);
    setFeedback('');
    setStage('playing');

    // Show the command instruction with sound-like text
    const displayTime = 2000 + Math.random() * 1000;
    timeoutRef.current = setTimeout(() => {
      // Time's up - user didn't respond
      setFeedback('⏰ 时间到！');
      setCurrentRound((r) => r + 1);
      timeoutRef.current = setTimeout(() => startRound(), 1000);
    }, displayTime);
  };

  const handleAction = (action: string) => {
    if (!currentCommand || stage !== 'playing') return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const isCorrect = action === currentCommand.action;
    if (isCorrect) {
      setScore((s) => s + 10);
      setFeedback('✅ 做对了！');
    } else {
      setFeedback(`❌ 应该 ${currentCommand.description}`);
    }
    setCurrentRound((r) => r + 1);
    timeoutRef.current = setTimeout(() => startRound(), 1200);
  };

  const startGame = () => {
    setCurrentRound(0);
    setScore(0);
    setCompleted(false);
    setStage('ready');
    setTimeout(() => startRound(), 500);
  };

  const completeGame = async () => {
    setSaving(true);
    try {
      await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: session?.user?.id || '',
          game_type: 'listen_commands',
          score,
          level: 1,
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
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>👂</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>听口令做动作</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            看口令提示，快速做出相应的动作
          </p>
        </div>

        {/* Score Bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', padding: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>得分</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-tertiary)' }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>进度</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
              {Math.min(currentRound, totalRounds)}/{totalRounds}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1rem', minHeight: '200px' }}>
          {stage === 'ready' && !completed && (
            <div>
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                共 {totalRounds} 轮，看提示并点击对应动作按钮
              </p>
              <button className="btn-primary" onClick={startGame} style={{ padding: '0.6rem 2rem', fontSize: '1rem' }}>
                🎮 开始
              </button>
            </div>
          )}

          {stage === 'playing' && currentCommand && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{currentCommand.emoji}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.3rem', color: 'var(--accent-primary)' }}>
                {currentCommand.description}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                快点击下面正确的动作！
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {COMMANDS.map((cmd) => (
                  <button
                    key={cmd.action}
                    onClick={() => handleAction(cmd.action)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: theme === 'egg' ? '1rem' : '0px',
                      border: '2px solid var(--border-default)',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-family)',
                      transition: 'all 0.1s',
                    }}
                  >
                    {cmd.emoji} {cmd.description}
                  </button>
                ))}
              </div>
              {feedback && (
                <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 'bold', color: feedback.startsWith('✅') ? 'var(--accent-green)' : '#FF6B6B' }}>
                  {feedback}
                </p>
              )}
            </div>
          )}

          {stage === 'result' && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎮</div>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>游戏结束！</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                得分：{score}
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
            </div>
          )}

          {completed && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-green)' }}>游戏完成！</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>得分：{score}</p>
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
