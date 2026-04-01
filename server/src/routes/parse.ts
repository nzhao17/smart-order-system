import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { parseTextToOrder, parseImageToOrder, parseExcelToOrder } from '../services/parseService';

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * 解析文本，提取订单信息
 * POST /api/v1/parse/text
 * Body: { text: string }
 */
router.post('/text', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: '请提供文本内容' });
    }

    const orders = await parseTextToOrder(text);
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    console.error('文本解析失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 解析图片，提取订单信息
 * POST /api/v1/parse/image
 * Body: multipart/form-data, field: image
 */
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传图片' });
    }

    const base64 = req.file.buffer.toString('base64');
    const orders = await parseImageToOrder(base64);
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    console.error('图片解析失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

/**
 * 解析Excel文件，提取订单信息
 * POST /api/v1/parse/excel
 * Body: multipart/form-data, field: file
 */
router.post('/excel', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '请上传Excel文件' });
    }

    const orders = await parseExcelToOrder(req.file.buffer);
    res.json({ success: true, data: orders, count: orders.length });
  } catch (err) {
    console.error('Excel解析失败:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
