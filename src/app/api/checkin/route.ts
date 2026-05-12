import { NextResponse } from 'next/server';
import { uuid, today, getDB } from '@/lib/db';

// GET /api/checkin?child_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');
  const date = searchParams.get('date') || today();

  if (!childId) {
    return NextResponse.json({ error: 'child_id required' }, { status: 400 });
  }

  try {
    const db = getDB();

    // Get today's checkin
    const checkin = await db.prepare(
      'SELECT * FROM daily_checkins WHERE child_id = ? AND checkin_date = ?'
    ).bind(childId, date).first();

    // Get games completed today
    const games = await db.prepare(
      'SELECT game_type, completed FROM game_records WHERE child_id = ? AND checkin_date = ?'
    ).bind(childId, date).all();

    // Get homework completed today
    const homework = await db.prepare(
      'SELECT COUNT(*) as count FROM homework_records WHERE child_id = ? AND checkin_date = ? AND completed = 1'
    ).bind(childId, date).first();

    // Get child's total points and streak
    const child = await db.prepare(
      'SELECT total_points, streak_days, last_checkin_date FROM children WHERE id = ?'
    ).bind(childId).first();

    return NextResponse.json({
      checkin,
      games: games.results,
      homeworkCompleted: (homework as any)?.count || 0,
      child,
      today: today(),
    });
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: '获取打卡数据失败' }, { status: 500 });
  }
}

// POST /api/checkin - Complete daily checkin
export async function POST(request: Request) {
  try {
    const { child_id, parent_id } = await request.json();
    const date = today();

    // If no child_id but parent_id provided, find first child
    let activeChildId = child_id;
    if (!activeChildId && parent_id) {
      const db = getDB();
      const firstChild = await db.prepare(
        'SELECT id FROM children WHERE parent_id = ? ORDER BY created_at LIMIT 1'
      ).bind(parent_id).first() as any;
      if (firstChild) activeChildId = firstChild.id;
    }

    if (!activeChildId) {
      return NextResponse.json({ error: 'child_id required' }, { status: 400 });
    }

    const db = getDB();

    // Check if already checked in today
    const existing = await db.prepare(
      'SELECT id FROM daily_checkins WHERE child_id = ? AND checkin_date = ?'
    ).bind(activeChildId, date).first();

    if (existing) {
      return NextResponse.json({ error: '今日已打卡' }, { status: 409 });
    }

    const id = uuid();
    const bonusPoints = 10;

    // Create checkin record
    await db.prepare(
      `INSERT INTO daily_checkins (id, child_id, checkin_date, points_earned)
       VALUES (?, ?, ?, ?)`
    ).bind(id, activeChildId, date, bonusPoints).run();

    // Update child streak
    const child = await db.prepare(
      'SELECT last_checkin_date, streak_days FROM children WHERE id = ?'
    ).bind(activeChildId).first() as any;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (child?.last_checkin_date === yesterdayStr) {
      newStreak = (child.streak_days || 0) + 1;
    }

    // Update child
    await db.prepare(
      `UPDATE children SET total_points = total_points + ?, streak_days = ?, last_checkin_date = ? WHERE id = ?`
    ).bind(bonusPoints, newStreak, date, activeChildId).run();

    // Record points transaction
    await db.prepare(
      `INSERT INTO point_transactions (id, child_id, points, transaction_type, reference_id, note)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(uuid(), activeChildId, bonusPoints, 'checkin_bonus', id, '每日打卡奖励').run();

    // Check for badge milestones
    if (newStreak === 7) {
      await db.prepare(
        `INSERT OR IGNORE INTO badges (id, child_id, badge_type, badge_name, earned_date)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(uuid(), activeChildId, 'streak_7', '连续7天打卡', date).run();
    }
    if (newStreak === 30) {
      await db.prepare(
        `INSERT OR IGNORE INTO badges (id, child_id, badge_type, badge_name, earned_date)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(uuid(), activeChildId, 'streak_30', '连续30天打卡', date).run();
    }

    return NextResponse.json({
      success: true,
      checkinId: id,
      points: bonusPoints,
      streak: newStreak,
    });
  } catch (error) {
    console.error('Checkin post error:', error);
    return NextResponse.json({ error: '打卡失败' }, { status: 500 });
  }
}
