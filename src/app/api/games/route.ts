import { NextResponse } from 'next/server';
import { getDB, uuid, today } from '@/lib/db'

// GET /api/games?child_id=xxx&date=2026-05-11
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');
  const date = searchParams.get('date') || today();

  if (!childId) {
    return NextResponse.json({ error: 'child_id required' }, { status: 400 });
  }

  try {
    const db = getDB();

    const games = await db.prepare(
      'SELECT * FROM game_records WHERE child_id = ? AND checkin_date = ? ORDER BY created_at'
    ).bind(childId, date).all() as any;

    // Get today's checkin status
    const checkin = await db.prepare(
      'SELECT id FROM daily_checkins WHERE child_id = ? AND checkin_date = ?'
    ).bind(childId, date).first() as any;

    return NextResponse.json({
      games: games.results,
      checkedIn: !!checkin,
      date,
    });
  } catch (error) {
    console.error('Games fetch error:', error);
    return NextResponse.json({ error: '获取游戏数据失败' }, { status: 500 });
  }
}

// POST /api/games - Submit game result
export async function POST(request: Request) {
  try {
    const { child_id, game_type, score, level, duration_seconds, completed } = await request.json();
    const date = today();

    if (!child_id || !game_type) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const db = getDB();

    // Check daily limit (once per game per day)
    const existing = await db.prepare(
      'SELECT id FROM game_records WHERE child_id = ? AND game_type = ? AND checkin_date = ?'
    ).bind(child_id, game_type, date).first() as any;

    if (existing) {
      return NextResponse.json({ error: '该游戏今日已完成' }, { status: 409 });
    }

    const id = uuid();
    const earnedPoints = completed ? (score || 0) + 5 : 0;

    // Save game record
    await db.prepare(
      `INSERT INTO game_records (id, child_id, game_type, checkin_date, score, level, duration_seconds, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, child_id, game_type, date, score || 0, level || 1, duration_seconds || 0, completed ? 1 : 0).run();

    // Award points
    if (earnedPoints > 0) {
      await db.prepare(
        'UPDATE children SET total_points = total_points + ? WHERE id = ?'
      ).bind(earnedPoints, child_id).run();

      await db.prepare(
        `INSERT INTO point_transactions (id, child_id, points, transaction_type, reference_id, note)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(uuid(), child_id, earnedPoints, 'game', id, `游戏: ${game_type}`).run();
    }

    // Auto checkin: completing any game counts as today's checkin
    if (completed) {
      const existingCheckin = await db.prepare(
        'SELECT id FROM daily_checkins WHERE child_id = ? AND checkin_date = ?'
      ).bind(child_id, date).first() as any;

      if (!existingCheckin) {
        const checkinId = uuid();
        await db.prepare(
          `INSERT INTO daily_checkins (id, child_id, checkin_date, points_earned, games_completed)
           VALUES (?, ?, ?, ?, 1)`
        ).bind(checkinId, child_id, date, 5).run();

        // Update streak
        const child = await db.prepare(
          'SELECT last_checkin_date, streak_days FROM children WHERE id = ?'
        ).bind(child_id).first() as any;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        let newStreak = 1;
        if (child?.last_checkin_date === yesterdayStr) {
          newStreak = (child.streak_days || 0) + 1;
        }

        await db.prepare(
          'UPDATE children SET total_points = total_points + 5, streak_days = ?, last_checkin_date = ? WHERE id = ?'
        ).bind(newStreak, date, child_id).run();
      }
    }

    return NextResponse.json({
      success: true,
      recordId: id,
      pointsEarned: earnedPoints,
      autoCheckedIn: completed,
    });
  } catch (error) {
    console.error('Game post error:', error);
    return NextResponse.json({ error: '保存游戏记录失败' }, { status: 500 });
  }
}
