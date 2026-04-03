import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import * as XLSX from 'xlsx';
import type { InsertOrder } from '../storage/database/shared/schema';

// 从环境变量读取配置，使用 SDK 期望的变量名
const config = new Config({
  apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
  baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
  modelBaseUrl: process.env.COZE_INTEGRATION_MODEL_BASE_URL,
});

/**
 * 计算送站时间备注
 * - 机场提前3小时
 * - 火车站提前2小时
 * - 接站时与班次时间相同
 */
function calculateTimeRemark(pickupType: string, station: string, trainTime: string): string | null {
  if (!trainTime) return null;
  
  // 接站时，时间备注与班次时间相同
  if (pickupType === '接站') {
    return trainTime;
  }
  
  // 送站时，计算提前时间
  if (pickupType === '送站') {
    const [hours, minutes] = trainTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const trainDate = new Date();
    trainDate.setHours(hours, minutes, 0, 0);
    
    // 判断场站类型
    const isAirport = station && station.includes('机场');
    const isStation = station && station.includes('站');
    
    let pickupDate = new Date(trainDate);
    if (isAirport) {
      // 机场提前3小时
      pickupDate.setHours(pickupDate.getHours() - 3);
    } else if (isStation) {
      // 火车站提前2小时
      pickupDate.setHours(pickupDate.getHours() - 2);
    } else {
      // 默认提前2小时
      pickupDate.setHours(pickupDate.getHours() - 2);
    }
    
    const pickupHours = pickupDate.getHours().toString().padStart(2, '0');
    const pickupMinutes = pickupDate.getMinutes().toString().padStart(2, '0');
    return `${pickupHours}:${pickupMinutes}`;
  }
  
  return null;
}

/**
 * 处理订单数据，自动填充时间备注
 */
function processOrderTimeRemark(order: any): InsertOrder {
  const result = { ...order };
  
  // 如果已有时间备注，保留原值
  if (result.time_remark) {
    return result;
  }
  
  // 如果有班次时间和接送站类型，计算时间备注
  if (result.train_time && result.pickup_type) {
    const timeRemark = calculateTimeRemark(
      result.pickup_type,
      result.station || '',
      result.train_time
    );
    if (timeRemark) {
      result.time_remark = timeRemark;
    }
  }
  
  return result;
}

/**
 * 解析文本，提取订单关键字段
 * 使用LLM智能提取
 */
export async function parseTextToOrder(text: string): Promise<InsertOrder[]> {
  const client = new LLMClient(config);

  const systemPrompt = `你是一个旅行社订单信息提取助手。用户会给你一段关于接站或送站的订单信息文本，请提取关键字段并返回JSON数组。

注意：
1. 如果文本中提到多个订单，返回多个对象
2. 日期格式统一转为 YYYY-MM-DD
3. 时间格式统一转为 HH:MM (24小时制)
4. 如果某个字段无法提取，返回null
5. 返回纯JSON数组，不要包含markdown代码块标记

字段说明：
- order_date: 日期，格式YYYY-MM-DD
- group_no: 团号
- station: 场站（如：大兴机场、北京南站、首都机场等）
- pickup_type: 接送站类型（接站 或 送站）
- dispatcher: 调度员姓名
- driver: 司机姓名
- train_no: 班次号（航班号如CZ8929，或高铁车次如G56）
- train_time: 班次时间，格式HH:MM
- time_remark: 时间备注
- guest_name: 客人姓名
- phone: 手机号
- people_count: 人数
- hotel: 宾馆名称
- remark: 其他备注

示例输入："更新-明日4月1日到京陆加文5人接站信息G56北京南15:27 陈红13668251132的来京信息"
示例输出：[{"order_date":"2024-04-01","group_no":"陆加文","station":"北京南站","pickup_type":"接站","train_no":"G56","train_time":"15:27","guest_name":"陈红","phone":"13668251132","people_count":5}]`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: text },
  ];

  const response = await client.invoke(messages, { model: 'glm-4-flash', temperature: 0.1 });
  const content = response.content.trim();

  try {
    // 尝试解析JSON
    let jsonStr = content;
    // 去除可能的markdown代码块标记
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
    }
    const orders = JSON.parse(jsonStr);
    if (!Array.isArray(orders)) {
      return [orders];
    }
    return orders.map((order: any) => processOrderTimeRemark({
      ...order,
      source: 'text',
      raw_content: text,
    }));
  } catch (e) {
    console.error('解析JSON失败:', e, '原始内容:', content);
    throw new Error('无法解析订单信息，请检查输入格式');
  }
}

/**
 * 解析图片，提取订单关键字段
 * 使用视觉模型进行OCR
 */
export async function parseImageToOrder(imageBase64: string): Promise<InsertOrder[]> {
  const client = new LLMClient(config);

  const systemPrompt = `你是一个旅行社订单信息提取助手。用户会给你一张包含接站或送站信息的图片，请识别图片中的文字并提取关键字段，返回JSON数组。

注意：
1. 如果图片中有多个订单，返回多个对象
2. 日期格式统一转为 YYYY-MM-DD
3. 时间格式统一转为 HH:MM (24小时制)
4. 如果某个字段无法识别，返回null
5. 返回纯JSON数组，不要包含markdown代码块标记

字段说明：
- order_date: 日期，格式YYYY-MM-DD
- group_no: 团号
- station: 场站（如：大兴机场、北京南站、首都机场等）
- pickup_type: 接送站类型（接站 或 送站）
- dispatcher: 调度员姓名
- driver: 司机姓名
- train_no: 班次号（航班号如CZ8929，或高铁车次如G56）
- train_time: 班次时间，格式HH:MM
- time_remark: 时间备注
- guest_name: 客人姓名
- phone: 手机号
- people_count: 人数
- hotel: 宾馆名称
- remark: 其他备注`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: '请识别这张图片中的订单信息并提取关键字段' },
        {
          type: 'image_url' as const,
          image_url: {
            url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high' as const,
          },
        },
      ],
    },
  ];

  const response = await client.invoke(messages, {
    model: 'glm-4v-flash',  // 智谱AI视觉模型
    temperature: 0.1
  });
  const content = response.content.trim();

  try {
    let jsonStr = content;
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '');
    }
    const orders = JSON.parse(jsonStr);
    if (!Array.isArray(orders)) {
      return [orders];
    }
    return orders.map((order: any) => processOrderTimeRemark({
      ...order,
      source: 'image',
    }));
  } catch (e) {
    console.error('解析图片JSON失败:', e, '原始内容:', content);
    throw new Error('无法识别图片中的订单信息');
  }
}

/**
 * 解析Excel文件，提取订单数据
 */
export async function parseExcelToOrder(buffer: Buffer): Promise<InsertOrder[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

  if (data.length === 0) {
    throw new Error('Excel文件中没有数据');
  }

  // 字段映射：Excel表头 -> 数据库字段
  const fieldMapping: Record<string, string> = {
    '时间': 'order_date',
    '团号': 'group_no',
    '场站': 'station',
    '接送站': 'pickup_type',
    '调度': 'dispatcher',
    '司机': 'driver',
    '班次': 'train_no',
    '班次时间': 'train_time',
    '时间备注': 'time_remark',
    '客人': 'guest_name',
    '手机号': 'phone',
    '人数': 'people_count',
    '宾馆': 'hotel',
    '备注': 'remark',
    '金额': 'amount',
    '车队金额': 'fleet_amount',
    '旅行社金额': 'agency_amount',
  };

  const orders: InsertOrder[] = data.map((row: any) => {
    const order: any = { source: 'excel' };

    for (const [excelHeader, dbField] of Object.entries(fieldMapping)) {
      if (row[excelHeader] !== undefined && row[excelHeader] !== null) {
        let value = row[excelHeader];

        // 处理日期
        if (dbField === 'order_date') {
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          } else if (typeof value === 'string') {
            // 尝试解析日期字符串
            const dateStr = value.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              value = dateStr;
            } else if (/^\d{1,2}月\d{1,2}日/.test(dateStr)) {
              // 处理 "3月22日" 格式
              const match = dateStr.match(/(\d+)月(\d+)日/);
              if (match) {
                const month = match[1].padStart(2, '0');
                const day = match[2].padStart(2, '0');
                const year = new Date().getFullYear();
                value = `${year}-${month}-${day}`;
              }
            }
          }
        }

        // 处理时间
        if (dbField === 'train_time') {
          if (value instanceof Date) {
            const hours = value.getHours().toString().padStart(2, '0');
            const minutes = value.getMinutes().toString().padStart(2, '0');
            value = `${hours}:${minutes}`;
          } else if (typeof value === 'number') {
            // Excel时间序列号
            const totalMinutes = Math.round(value * 24 * 60);
            const hours = Math.floor(totalMinutes / 60) % 24;
            const minutes = totalMinutes % 60;
            value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          } else if (typeof value === 'string') {
            // 已经是时间格式，移除可能的时区后缀如 +08
            value = value.trim().replace(/\s*\+[\d:]+$/, '');
          }
        }

        // 处理数字
        if (['people_count'].includes(dbField)) {
          value = parseInt(value) || null;
        }

        // 处理金额
        if (['amount', 'fleet_amount', 'agency_amount'].includes(dbField)) {
          value = parseFloat(value) || null;
        }

        order[dbField] = value;
      }
    }

    return processOrderTimeRemark(order);
  }).filter((order: any) => {
    // 过滤掉空行
    return order.order_date || order.group_no || order.guest_name;
  });

  return orders;
}
