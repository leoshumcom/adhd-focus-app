import { NextResponse } from 'next/server';
import { uuid, now, getDB } from '@/lib/db';

// POST /api/auth/register
export async function POST(request: Request) {
  try {
    const { email, password, name, childName, childGender } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '请填写必填信息' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    const db = getDB();

    // Check if email already exists
    const existing = await db.prepare(
      'SELECT id FROM parents WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }

    const parentId = uuid();
    const childId = uuid();
    const createdAt = now();

    // Create parent
    await db.prepare(
      `INSERT INTO parents (id, email, name, password_hash, children_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(parentId, email, name, password, childName ? 1 : 0, createdAt, createdAt).run();

    // Create child if name provided
    if (childName) {
      await db.prepare(
        `INSERT INTO children (id, parent_id, name, gender, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(childId, parentId, childName, childGender || 'boy', createdAt).run();
    }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      parentId,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
