import { NextResponse } from 'next/server';

// GET /api/profile?user_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    const db = getDB();

    const [parent, children] = await Promise.all([
      db.prepare('SELECT id, email, name, theme, children_count FROM parents WHERE id = ?').bind(userId).first() as any,
      db.prepare('SELECT * FROM children WHERE parent_id = ? ORDER BY created_at').bind(userId).all() as any,
    ]);

    // Get badges for all children
    const badges = await db.prepare(
      'SELECT b.*, c.name as child_name FROM badges b JOIN children c ON b.child_id = c.id WHERE c.parent_id = ? ORDER BY b.earned_date DESC'
    ).bind(userId).all() as any;

    // Get total checkin stats
    const stats = await db.prepare(
      `SELECT
        COUNT(DISTINCT dc.checkin_date) as total_checkins,
        COALESCE(SUM(dc.points_earned), 0) + COALESCE(SUM(hr.points_earned), 0) + COALESCE(SUM(gr.total_game_points), 0) as total_points
       FROM children c
       LEFT JOIN daily_checkins dc ON c.id = dc.child_id
       LEFT JOIN homework_records hr ON c.id = hr.child_id
       LEFT JOIN (SELECT child_id, SUM(COALESCE(score,0) + 5) as total_game_points FROM game_records WHERE completed = 1 GROUP BY child_id) gr ON c.id = gr.child_id
       WHERE c.parent_id = ?`
    ).bind(userId).first() as any;

    return NextResponse.json({
      parent,
      children: children.results,
      badges: badges.results,
      stats,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: '获取资料失败' }, { status: 500 });
  }
}

// PUT /api/profile - Update profile
export async function PUT(request: Request) {
  try {
    const { user_id, theme } = await request.json();
    const db = getDB();

    if (user_id && theme) {
      await db.prepare('UPDATE parents SET theme = ? WHERE id = ?').bind(theme, user_id).run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
