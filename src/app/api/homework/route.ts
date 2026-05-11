import { NextResponse } from 'next/server';
import { uuid, today } from '@/lib/db';

// GET /api/homework?child_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('child_id');

  if (!childId) {
    return NextResponse.json({ error: 'child_id required' }, { status: 400 });
  }

  try {
    const env = process.env as any;
    const db = env.DB as D1Database;

    const tasks = await db.prepare(
      'SELECT * FROM homework_tasks WHERE child_id = ? AND is_active = 1 ORDER BY sort_order'
    ).bind(childId).all();

    const date = today();
    const completed = await db.prepare(
      'SELECT task_id FROM homework_records WHERE child_id = ? AND checkin_date = ? AND completed = 1'
    ).bind(childId, date).all();

    const completedIds = new Set(completed.results.map((r: any) => r.task_id));

    return NextResponse.json({
      tasks: tasks.results.map((t: any) => ({ ...t, done: completedIds.has(t.id) })),
      date,
      completedCount: completedIds.size,
      totalCount: tasks.results.length,
    });
  } catch (error) {
    console.error('Homework fetch error:', error);
    return NextResponse.json({ error: '获取作业数据失败' }, { status: 500 });
  }
}

// POST /api/homework - Create homework task
export async function POST(request: Request) {
  try {
    const { child_id, parent_id, title, subject } = await request.json();

    if (!child_id || !parent_id || !title) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const env = process.env as any;
    const db = env.DB as D1Database;

    // Get next sort order
    const maxOrder = await db.prepare(
      'SELECT MAX(sort_order) as max_order FROM homework_tasks WHERE child_id = ?'
    ).bind(child_id).first() as any;

    const id = uuid();
    const sortOrder = (maxOrder?.max_order || 0) + 1;

    await db.prepare(
      `INSERT INTO homework_tasks (id, child_id, parent_id, title, subject, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, child_id, parent_id, title, subject || 'other', sortOrder).run();

    return NextResponse.json({ success: true, taskId: id });
  } catch (error) {
    console.error('Homework create error:', error);
    return NextResponse.json({ error: '创建作业失败' }, { status: 500 });
  }
}

// PUT /api/homework/complete - Mark task as completed
export async function PUT(request: Request) {
  try {
    const { task_id, child_id, focus_minutes } = await request.json();

    if (!task_id || !child_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const env = process.env as any;
    const db = env.DB as D1Database;
    const date = today();

    // Check if already completed today
    const existing = await db.prepare(
      'SELECT id FROM homework_records WHERE task_id = ? AND checkin_date = ?'
    ).bind(task_id, date).first();

    if (existing) {
      return NextResponse.json({ error: '该作业今日已完成' }, { status: 409 });
    }

    const id = uuid();
    const earnedPoints = 15;

    await db.prepare(
      `INSERT INTO homework_records (id, task_id, child_id, checkin_date, focus_minutes, points_earned, completed)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).bind(id, task_id, child_id, date, focus_minutes || 0, earnedPoints).run();

    // Award points
    await db.prepare(
      'UPDATE children SET total_points = total_points + ? WHERE id = ?'
    ).bind(earnedPoints, child_id).run();

    await db.prepare(
      `INSERT INTO point_transactions (id, child_id, points, transaction_type, reference_id, note)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(uuid(), child_id, earnedPoints, 'homework', id, '完成作业').run();

    return NextResponse.json({ success: true, recordId: id, pointsEarned: earnedPoints });
  } catch (error) {
    console.error('Homework complete error:', error);
    return NextResponse.json({ error: '完成作业失败' }, { status: 500 });
  }
}

// DELETE /api/homework - Delete homework task
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  try {
    const env = process.env as any;
    const db = env.DB as D1Database;
    await db.prepare('UPDATE homework_tasks SET is_active = 0 WHERE id = ?').bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Homework delete error:', error);
    return NextResponse.json({ error: '删除作业失败' }, { status: 500 });
  }
}
