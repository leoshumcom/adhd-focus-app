'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';

export default function RegisterPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    parentName: '',
    childName: '',
    childAge: '',
    childGender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    if (form.password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, string> = {
        email: form.email,
        password: form.password,
        name: form.parentName,
      };
      if (form.childName) body.childName = form.childName;
      if (form.childAge) body.childAge = form.childAge;
      if (form.childGender) body.childGender = form.childGender;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败，请稍后重试');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: theme === 'egg' ? '1rem' : '0px',
    border: '2px solid var(--border-default)',
    background: 'white',
    fontSize: '1rem',
    fontFamily: 'var(--font-family)',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  };

  return (
    <div className="page-content" style={{ paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="animate-float" style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>
          {theme === 'egg' ? '🥚' : '🎮'}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>家长注册</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
          创建账号，开启专注力训练
        </p>
      </div>

      {success && (
        <div className="card" style={{ background: '#F0FFF0', border: '2px solid var(--accent-green)', textAlign: 'center', marginBottom: '1rem' }}>
          ✅ 注册成功！即将跳转到登录页...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div className="card" style={{ background: '#FFF0F0', border: '2px solid #FF6B6B', textAlign: 'center', color: '#CC0000' }}>
            {error}
          </div>
        )}

        {/* Parent fields */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
            {theme === 'egg' ? '👨‍👩‍👧‍👦 家长信息' : '⛏️ PARENT INFO'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>邮箱 *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="请输入邮箱"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>密码 *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="至少6位密码"
                required
                minLength={6}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>确认密码 *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="再次输入密码"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>家长姓名</label>
              <input
                type="text"
                value={form.parentName}
                onChange={(e) => updateField('parentName', e.target.value)}
                placeholder="如何称呼您"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Child fields (optional) */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--accent-secondary)' }}>
            {theme === 'egg' ? '🧒 孩子信息（可选）' : '⛏️ CHILD INFO (OPTIONAL)'}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            注册后可随时添加或修改
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>孩子姓名</label>
              <input
                type="text"
                value={form.childName}
                onChange={(e) => updateField('childName', e.target.value)}
                placeholder="输入孩子昵称"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>年龄</label>
              <input
                type="number"
                value={form.childAge}
                onChange={(e) => updateField('childAge', e.target.value)}
                placeholder="几岁"
                min={3}
                max={18}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>性别</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['boy', 'girl'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateField('childGender', form.childGender === g ? '' : g)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: theme === 'egg' ? '1rem' : '0px',
                      border: `2px solid ${form.childGender === g ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      background: form.childGender === g ? 'var(--bg-button)' : 'white',
                      color: form.childGender === g ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family)',
                      fontWeight: form.childGender === g ? 'bold' : 'normal',
                      fontSize: '0.9rem',
                    }}
                  >
                    {g === 'boy' ? '👦 男孩' : '👧 女孩'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            fontSize: '1.1rem',
            padding: '0.85rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '注册中...' : (theme === 'egg' ? '🎉 立即注册' : '▶ REGISTER')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span
            style={{ color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => router.push('/login')}
          >
            已有账号？立即登录
          </span>
        </div>
      </form>

      <div style={{ height: '2rem' }} />
    </div>
  );
}
