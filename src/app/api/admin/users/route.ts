import { NextResponse } from 'next/server';
import { getDB, today } from '@/lib/db';

// GET /api/admin/users - List all parents (admin only)
export async function GET() {
  try {
    const db = getDB();
    const todayStr = today();

    const users = await db.prepare(
      `SELECT p.id, p.email, p.name, p.is_active, p.is_admin, p.created_at,
              p.children_count,
              (SELECT COUNT(*) FROM daily_checkins dc JOIN children c ON dc.child_id = c.id WHERE c.parent_id = p.id AND dc.checkin_date = ?) as today_active
       FROM parents p
       ORDER BY p.created_at DESC`
    ).bind(todayStr).all() as any;

    return NextResponse.json({ users: users.results || [] });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: '获取用户列表失败', users: [] },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Toggle user status
export async function PUT(request: Request) {
  try {
    const { user_id, action } = await request.json();
    if (!user_id || !action) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const db = getDB();

    if (action === 'enable' || action === 'disable') {
      const isActive = action === 'enable' ? 1 : 0;
      const result = await db.prepare('UPDATE parents SET is_active = ? WHERE id = ?')
        .bind(isActive, user_id).run();

      if ((result as any).meta?.changes === 0) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }
    } else if (action === 'delete') {
      const result = await db.prepare(
        'DELETE FROM parents WHERE id = ? AND is_admin = 0'
      ).bind(user_id).run();

      if ((result as any).meta?.changes === 0) {
        return NextResponse.json({ error: '用户不存在或为管理员' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user action error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
