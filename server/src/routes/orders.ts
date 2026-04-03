import express from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../storage/database/db';
import { orders } from '../storage/database/shared/schema';
import { eq, ilike, gte, lte, desc, asc, and, or, sql } from 'drizzle-orm';
import type { Order, InsertOrder } from '../storage/database/shared/schema';

const router = express.Router();

/**
 * 获取订单列表
 * GET /api/v1/orders
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const {
      date_from, date_to, group_no, station, pickup_type, dispatcher, driver,
      train_no, train_time, time_remark, guest_name, phone, people_count, hotel,
      page = '1', pageSize = '20', sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const offset = (pageNum - 1) * pageSizeNum;
    const isAscending = sortOrder === 'asc';

    // 构建筛选条件
    const conditions = [];
    
    if (date_from) {
      conditions.push(gte(orders.order_date, date_from as string));
    }
    if (date_to) {
      conditions.push(lte(orders.order_date, date_to as string));
    }
    if (group_no) {
      conditions.push(ilike(orders.group_no, `%${group_no}%`));
    }
    if (station) {
      conditions.push(ilike(orders.station, `%${station}%`));
    }
    if (pickup_type) {
      conditions.push(eq(orders.pickup_type, pickup_type as string));
    }
    if (dispatcher) {
      conditions.push(ilike(orders.dispatcher, `%${dispatcher}%`));
    }
    if (driver) {
      conditions.push(ilike(orders.driver, `%${driver}%`));
    }
    if (train_no) {
      conditions.push(ilike(orders.train_no, `%${train_no}%`));
    }
    if (train_time) {
      conditions.push(ilike(orders.train_time, `%${train_time}%`));
    }
    if (time_remark) {
      conditions.push(ilike(orders.time_remark, `%${time_remark}%`));
    }
    if (guest_name) {
      conditions.push(ilike(orders.guest_name, `%${guest_name}%`));
    }
    if (phone) {
      conditions.push(ilike(orders.phone, `%${phone}%`));
    }
    if (people_count) {
      conditions.push(eq(orders.people_count, parseInt(people_count as string)));
    }
    if (hotel) {
      conditions.push(ilike(orders.hotel, `%${hotel}%`));
    }

    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count || 0;

    // 查询数据
    const orderDirection = isAscending ? asc : desc;
    const data = await db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDirection(orders.order_date), orderDirection(orders.created_at))
      .limit(pageSizeNum)
      .offset(offset);

    res.json({
      success: true,
      data: data as Order[],
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: total,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 获取今日订单统计
 * GET /api/v1/orders/stats/today
 */
router.get('/stats/today', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.order_date, today));

    const count = result[0]?.count || 0;

    res.json({
      success: true,
      data: {
        date: today,
        totalOrders: count,
      },
    });
  } catch (err) {
    console.error('获取统计失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 获取单条订单详情
 * GET /api/v1/orders/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam || '');

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    res.json({ success: true, data: result[0] as Order });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 创建订单
 * POST /api/v1/orders
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const orderData: InsertOrder = req.body;

    const result = await db
      .insert(orders)
      .values(orderData)
      .returning();

    res.json({ success: true, data: result[0] as Order });
  } catch (err) {
    console.error('创建订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 批量创建订单
 * POST /api/v1/orders/batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { orders: orderList } = req.body;

    if (!Array.isArray(orderList) || orderList.length === 0) {
      return res.status(400).json({ success: false, error: '请提供订单数据' });
    }

    const result = await db
      .insert(orders)
      .values(orderList)
      .returning();

    res.json({ success: true, data: result as Order[], count: result.length });
  } catch (err) {
    console.error('批量创建订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 更新订单
 * PUT /api/v1/orders/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam || '');
    const updateData = { ...req.body, updated_at: new Date() };

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    const result = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    res.json({ success: true, data: result[0] as Order });
  } catch (err) {
    console.error('更新订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 删除订单
 * DELETE /api/v1/orders/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam || '');

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的订单ID' });
    }

    const result = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    res.json({ success: true, message: '订单已删除' });
  } catch (err) {
    console.error('删除订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
