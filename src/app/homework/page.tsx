'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

interface Task {
  id: string;
  title: string;
  subject: string;
  estimated: number;
  completed: boolean;
}

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '📖 语文',
  math: '🔢 数学',
  english: '🌍 英语',
  other: '📋 其他',
};

export default function HomeworkPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: '语文课文朗读', subject: 'chinese', estimated: 15, completed: false },
    { id: '2', title: '数学口算练习', subject: 'math', estimated: 10, completed: false },
    { id: '3', title: '英语单词拼写', subject: 'english', estimated: 10, completed: false },
  ]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('other');
  const [batchText, setBatchText] = useState('');

  // Focus timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = (() => {
    const d = new Date();
    const off = 8 * 60;
    const local = new Date(d.getTime() + off * 60 * 1000);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${local.getMonth() + 1}月${local.getDate()}日 星期${weekdays[local.getDay()]}`;
  })();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const stored = localStorage.getItem('adhd-homework-tasks');
    if (stored) {
      try { setTasks(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adhd-homework-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // --- Delete a task ---
  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (confirm(`确定删除作业「${task.title}」吗？`)) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- Single Add ---
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newId = Date.now().toString();
    setTasks((prev) => [
      ...prev,
      {
        id: newId,
        title: newTaskTitle.trim(),
        subject: newTaskSubject,
        estimated: 10,
        completed: false,
      },
    ]);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  // --- Batch Add ---
  const batchAddTasks = () => {
    if (!batchText.trim()) return;
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const newTasks: Task[] = lines.map((title) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      title,
      subject: 'other',
      estimated: 10,
      completed: false,
    }));

    setTasks((prev) => [...prev, ...newTasks]);
    setBatchText('');
    setShowBatchAdd(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (!mounted) return null;

  const navItems = [
    { href: '/train', label: '训练', icon: '🎯' },
    { href: '/homework', label: '作业', icon: '📝' },
    { href: '/rewards', label: '抽奖', icon: '🎁' },
    { href: '/profile', label: '个人中心', icon: '👤' },
  ];

  const modalOverlayStyle = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '1rem',
  };

  const modalCardStyle = {
    width: '100%',
    maxWidth: '380px',
  };

  return (
    <div className="page-content" style={{ paddingTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>📝 作业闯关</h1>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>📅 {today}</div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>今日进度</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
            {completedCount}/{tasks.length} ({progressPct}%)
          </span>
        </div>
        <div className="progress-track" style={{ width: '100%', overflow: 'hidden' }}>
          <div className="progress-bar" style={{ width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 'bold' }}>作业列表</h2>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="btn-primary"
            onClick={() => setShowBatchAdd(true)}
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', background: 'var(--accent-secondary)' }}
          >
            📋 批量
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddTask(true)}
            style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}
          >
            + 添加
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {tasks.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            还没有作业，点击上方添加
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="card"
            style={{
              padding: '0.75rem 0.75rem 0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: task.completed ? 0.7 : 1,
            }}
          >
            {/* Checkbox */}
            <div
              onClick={() => toggleTask(task.id)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: theme === 'egg' ? '50%' : '0px',
                border: `3px solid ${task.completed ? 'var(--accent-green)' : 'var(--border-default)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                flexShrink: 0,
                transition: 'all 0.2s',
                background: task.completed ? 'var(--accent-green)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {task.completed && <span style={{ color: 'white', fontWeight: 'bold' }}>✓</span>}
            </div>

            {/* Task info */}
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => toggleTask(task.id)}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}>
                {task.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {SUBJECT_LABELS[task.subject]} · {task.estimated}分钟
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => deleteTask(task.id, e)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FF6B6B',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.3rem 0.5rem',
                borderRadius: theme === 'egg' ? '0.5rem' : '0px',
                opacity: 0.7,
                transition: 'opacity 0.15s',
                flexShrink: 0,
                lineHeight: 1,
              }}
              title="删除作业"
              onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7'; }}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Add Task Modal (single) */}
      {showAddTask && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowAddTask(false)}
        >
          <div
            className="card"
            style={modalCardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>添加作业</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="作业名称"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: theme === 'egg' ? '1rem' : '0px',
                  border: '2px solid var(--border-default)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-family)',
                  outline: 'none',
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
              />
              <select
                value={newTaskSubject}
                onChange={(e) => setNewTaskSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: theme === 'egg' ? '1rem' : '0px',
                  border: '2px solid var(--border-default)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-family)',
                  outline: 'none',
                  background: 'white',
                }}
              >
                <option value="chinese">📖 语文</option>
                <option value="math">🔢 数学</option>
                <option value="english">🌍 英语</option>
                <option value="other">📋 其他</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={addTask}
                  disabled={!newTaskTitle.trim()}
                  style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                >
                  添加
                </button>
                <button
                  onClick={() => setShowAddTask(false)}
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

      {/* Batch Add Modal */}
      {showBatchAdd && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowBatchAdd(false)}
        >
          <div
            className="card"
            style={{ ...modalCardStyle, maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>📋 批量添加作业</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              每行输入一个作业名称，支持多行同时添加
            </p>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`语文课文朗读\n数学练习题\n英语单词抄写\n科学小实验`}
              rows={6}
              autoFocus
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: theme === 'egg' ? '1rem' : '0px',
                border: '2px solid var(--border-default)',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-family)',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem', marginBottom: '0.5rem' }}>
              {batchText.trim() ? `共 ${batchText.split('\n').filter(l => l.trim()).length} 项` : '请输入作业名称'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-primary"
                onClick={batchAddTasks}
                disabled={!batchText.trim()}
                style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
              >
                批量添加
              </button>
              <button
                onClick={() => setShowBatchAdd(false)}
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
      )}

      {/* Focus Timer */}
      <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {theme === 'egg' ? '⏱️ 专注计时器' : '⏱️ FOCUS TIMER'}
      </h2>
      <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', margin: '0.5rem 0' }}>
          {formatTime(timerSeconds)}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {!timerRunning ? (
            <button
              className="btn-primary"
              onClick={startTimer}
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
            >
              {timerSeconds > 0 ? '▶️ 继续' : '▶️ 开始'}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={pauseTimer}
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: theme === 'egg' ? 'var(--accent-blue)' : undefined }}
            >
              ⏸️ 暂停
            </button>
          )}
          <button
            onClick={resetTimer}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: theme === 'egg' ? '1rem' : '0px',
              border: '2px solid var(--border-default)',
              background: 'white',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-family)',
            }}
          >
            🔄 重置
          </button>
        </div>
        {timerSeconds > 0 && !timerRunning && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            专注了 {Math.floor(timerSeconds / 60)} 分钟
          </div>
        )}
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
