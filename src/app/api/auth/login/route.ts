import { NextResponse } from 'next/server';

// POST /api/auth/login - Validate credentials against D1
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    // Validate credentials against D1 database
    // This endpoint is called by next-auth authorize callback
    const db = getDB();
    const result = await db.prepare(
      'SELECT id, email, name, is_admin FROM parents WHERE email = ? AND password_hash = ? AND is_active = 1'
    ).bind(email, password).first();

    if (!result) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      is_admin: result.is_admin,
      role: result.is_admin ? 'admin' : 'parent',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
