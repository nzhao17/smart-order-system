import express from 'express';
import type { Request, Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';
import type { Order, InsertOrder } from '../storage/database/shared/schema';

const router = express.Router();

/**
 * 获取订单列表
 * GET /api/v1/orders
 * Query 参数：
 * - date: 日期筛选 (YYYY-MM-DD)
 * - station: 场站筛选
 * - pickup_type: 接送站筛选
 * - driver: 司机筛选
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { date, station, pickup_type, driver, page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    let query = client
      .from('orders')
      .select('*', { count: 'exact' })
      .order('order_date', { ascending: true })
      .order('train_time', { ascending: true })
      .range(offset, offset + pageSizeNum - 1);

    // 筛选条件
    if (date) {
      query = query.eq('order_date', date);
    }
    if (station) {
      query = query.eq('station', station);
    }
    if (pickup_type) {
      query = query.eq('pickup_type', pickup_type);
    }
    if (driver) {
      query = query.ilike('driver', `%${driver}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`查询订单失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: data as Order[],
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSizeNum),
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
    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('order_date', today);

    if (error) {
      throw new Error(`获取统计失败: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        date: today,
        totalOrders: count || 0,
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
    const client = getSupabaseClient();
    const { id } = req.params;

    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`查询订单失败: ${error.message}`);
    }

    if (!data) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    res.json({ success: true, data: data as Order });
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 创建订单
 * POST /api/v1/orders
 * Body: InsertOrder
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const orderData: InsertOrder = req.body;

    const { data, error } = await client
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      throw new Error(`创建订单失败: ${error.message}`);
    }

    res.json({ success: true, data: data as Order });
  } catch (err) {
    console.error('创建订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 批量创建订单
 * POST /api/v1/orders/batch
 * Body: { orders: InsertOrder[] }
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ success: false, error: '请提供订单数据' });
    }

    const { data, error } = await client
      .from('orders')
      .insert(orders)
      .select();

    if (error) {
      throw new Error(`批量创建订单失败: ${error.message}`);
    }

    res.json({ success: true, data: data as Order[], count: data?.length || 0 });
  } catch (err) {
    console.error('批量创建订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 更新订单
 * PUT /api/v1/orders/:id
 * Body: Partial<InsertOrder>
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };

    const { data, error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新订单失败: ${error.message}`);
    }

    res.json({ success: true, data: data as Order });
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
    const client = getSupabaseClient();
    const { id } = req.params;

    const { error } = await client
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除订单失败: ${error.message}`);
    }

    res.json({ success: true, message: '订单已删除' });
  } catch (err) {
    console.error('删除订单失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
