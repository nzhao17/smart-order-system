import express from 'express';
import type { Request, Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client';
import type { Order, InsertOrder } from '../storage/database/shared/schema';

const router = express.Router();

/**
 * 获取订单列表
 * GET /api/v1/orders
 * Query 参数：
 * - date_from: 开始日期 (YYYY-MM-DD)
 * - date_to: 结束日期 (YYYY-MM-DD)
 * - group_no: 团号筛选
 * - station: 场站筛选
 * - pickup_type: 接送站筛选
 * - dispatcher: 调度筛选
 * - driver: 司机筛选
 * - train_no: 班次筛选
 * - train_time: 班次时间筛选
 * - time_remark: 时间备注筛选
 * - guest_name: 客人姓名筛选
 * - phone: 手机号筛选
 * - people_count: 人数筛选
 * - hotel: 宾馆筛选
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const {
      date_from, date_to, group_no, station, pickup_type, dispatcher, driver,
      train_no, train_time, time_remark, guest_name, phone, people_count, hotel,
      page = '1', pageSize = '20'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSizeNum = parseInt(pageSize as string) || 20;
    const offset = (pageNum - 1) * pageSizeNum;

    // 按时间倒序排列（最新的在前面）
    let query = client
      .from('orders')
      .select('*', { count: 'exact' })
      .order('order_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);

    // 筛选条件
    if (date_from) {
      query = query.gte('order_date', date_from);
    }
    if (date_to) {
      query = query.lte('order_date', date_to);
    }
    if (group_no) {
      query = query.ilike('group_no', `%${group_no}%`);
    }
    if (station) {
      query = query.ilike('station', `%${station}%`);
    }
    if (pickup_type) {
      query = query.eq('pickup_type', pickup_type);
    }
    if (dispatcher) {
      query = query.ilike('dispatcher', `%${dispatcher}%`);
    }
    if (driver) {
      query = query.ilike('driver', `%${driver}%`);
    }
    if (train_no) {
      query = query.ilike('train_no', `%${train_no}%`);
    }
    if (train_time) {
      query = query.ilike('train_time', `%${train_time}%`);
    }
    if (time_remark) {
      query = query.ilike('time_remark', `%${time_remark}%`);
    }
    if (guest_name) {
      query = query.ilike('guest_name', `%${guest_name}%`);
    }
    if (phone) {
      query = query.ilike('phone', `%${phone}%`);
    }
    if (people_count) {
      query = query.eq('people_count', parseInt(people_count as string));
    }
    if (hotel) {
      query = query.ilike('hotel', `%${hotel}%`);
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
