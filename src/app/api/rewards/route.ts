import { NextResponse } from 'next/server';
import { uuid } from '@/lib/db';

// GET /api/rewards?parent_id=xxx&child_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id');
  const childId = searchParams.get('child_id');

  if (!parentId && !childId) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  try {
    const env = process.env as any;
    const db = env.DB as D1Database;

    // Get rewards
    const rewards = await db.prepare(
      'SELECT * FROM rewards WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order'
    ).bind(parentId).all();

    // Get spin history for child
    let spins: any[] = [];
    if (childId) {
      const result = await db.prepare(
        'SELECT * FROM spin_records WHERE child_id = ? ORDER BY created_at DESC LIMIT 20'
      ).bind(childId).all();
      spins = result.results;
    }

    // Get child points
    let totalPoints = 0;
    if (childId) {
      const child = await db.prepare('SELECT total_points FROM children WHERE id = ?').bind(childId).first() as any;
      totalPoints = child?.total_points || 0;
    }

    return NextResponse.json({ rewards: rewards.results, spins, totalPoints });
  } catch (error) {
    console.error('Rewards fetch error:', error);
    return NextResponse.json({ error: '获取奖励数据失败' }, { status: 500 });
  }
}

// POST /api/rewards - Create reward item
export async function POST(request: Request) {
  try {
    const { parent_id, name, description, icon, cost_points, reward_type } = await request.json();

    if (!parent_id || !name) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const env = process.env as any;
    const db = env.DB as D1Database;

    const id = uuid();

    await db.prepare(
      `INSERT INTO rewards (id, parent_id, name, description, icon, cost_points, reward_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, parent_id, name, description || '', icon || '🎁', cost_points || 10, reward_type || 'item').run();

    return NextResponse.json({ success: true, rewardId: id });
  } catch (error) {
    console.error('Reward create error:', error);
    return NextResponse.json({ error: '创建奖励失败' }, { status: 500 });
  }
}

// PUT /api/rewards/spin - Perform a spin
export async function PUT(request: Request) {
  try {
    const { child_id, parent_id } = await request.json();
    const spinCost = 10;

    if (!child_id || !parent_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const env = process.env as any;
    const db = env.DB as D1Database;

    // Check child has enough points
    const child = await db.prepare('SELECT total_points FROM children WHERE id = ?').bind(child_id).first() as any;
    if (!child || child.total_points < spinCost) {
      return NextResponse.json({ error: '积分不足', needed: spinCost, current: child?.total_points || 0 }, { status: 400 });
    }

    // Get active rewards
    const rewards = await db.prepare(
      'SELECT * FROM rewards WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order'
    ).bind(parent_id).all();

    let selectedReward: any;
    if (rewards.results.length > 0) {
      const idx = Math.floor(Math.random() * rewards.results.length);
      selectedReward = rewards.results[idx];
    } else {
      selectedReward = { name: '再来一次', cost_points: 0 };
    }

    // Deduct points
    await db.prepare('UPDATE children SET total_points = total_points - ? WHERE id = ?')
      .bind(spinCost, child_id).run();

    // Record spin
    const spinId = uuid();
    await db.prepare(
      `INSERT INTO spin_records (id, child_id, reward_id, reward_name, points_spent, spin_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(spinId, child_id, selectedReward.id || null, selectedReward.name, spinCost, new Date().toISOString().split('T')[0]).run();

    // Record transaction
    await db.prepare(
      `INSERT INTO point_transactions (id, child_id, points, transaction_type, reference_id, note)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(uuid(), child_id, -spinCost, 'spin_cost', spinId, `抽奖: ${selectedReward.name}`).run();

    return NextResponse.json({
      success: true,
      reward: selectedReward,
      spinId,
      pointsRemaining: child.total_points - spinCost,
    });
  } catch (error) {
    console.error('Spin error:', error);
    return NextResponse.json({ error: '抽奖失败' }, { status: 500 });
  }
}

// DELETE /api/rewards - Delete reward
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  try {
    const env = process.env as any;
    const db = env.DB as D1Database;
    await db.prepare('UPDATE rewards SET is_active = 0 WHERE id = ?').bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reward delete error:', error);
    return NextResponse.json({ error: '删除奖励失败' }, { status: 500 });
  }
}
