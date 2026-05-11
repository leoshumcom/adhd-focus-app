import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET /api/admin/stats - Global statistics
export async function GET() {
  try {
    const db = getDB();

    const [totalUsers, totalChildren, todayCheckins, totalCheckins] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM parents').first() as any,
      db.prepare('SELECT COUNT(*) as count FROM children').first() as any,
      db.prepare('SELECT COUNT(*) as count FROM daily_checkins WHERE checkin_date = date(\'now\')').first() as any,
      db.prepare('SELECT COUNT(*) as count FROM daily_checkins').all() as any,
    ]);

    const todayGames = await db.prepare(
      'SELECT COUNT(*) as count FROM game_records WHERE checkin_date = date(\'now\')'
    ).first() as any;

    return NextResponse.json({
      totalUsers: (totalUsers as any)?.count || 0,
      totalChildren: (totalChildren as any)?.count || 0,
      todayCheckins: (todayCheckins as any)?.count || 0,
      totalCheckins: (totalCheckins as any)?.count || 0,
      todayGames: (todayGames as any)?.count || 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
