import { NextResponse } from 'next/server';
import { uuid } from '@/lib/db';

// GET /api/children?parent_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id');

  if (!parentId) {
    return NextResponse.json({ error: 'parent_id required' }, { status: 400 });
  }

  try {
    const env = process.env as any;
    const db = env.DB as D1Database;

    const children = await db.prepare(
      'SELECT * FROM children WHERE parent_id = ? ORDER BY created_at'
    ).bind(parentId).all();

    return NextResponse.json({ children: children.results });
  } catch (error) {
    console.error('Children fetch error:', error);
    return NextResponse.json({ error: '获取孩子数据失败' }, { status: 500 });
  }
}

// POST /api/children - Add a child
export async function POST(request: Request) {
  try {
    const { parent_id, name, gender } = await request.json();

    if (!parent_id || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const env = process.env as any;
    const db = env.DB as D1Database;

    const id = uuid();

    await db.prepare(
      `INSERT INTO children (id, parent_id, name, gender)
       VALUES (?, ?, ?, ?)`
    ).bind(id, parent_id, name, gender || 'boy').run();

    // Update parent children count
    await db.prepare(
      'UPDATE parents SET children_count = children_count + 1 WHERE id = ?'
    ).bind(parent_id).run();

    return NextResponse.json({ success: true, childId: id });
  } catch (error) {
    console.error('Child create error:', error);
    return NextResponse.json({ error: '添加孩子失败' }, { status: 500 });
  }
}
