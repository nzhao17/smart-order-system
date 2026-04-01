import { pgTable, serial, timestamp, varchar, integer, text, numeric, date, time, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 订单表 - 旅行社接站/送站订单管理
export const orders = pgTable(
  "orders",
  {
    id: serial().primaryKey(),
    // 业务字段
    order_date: date("order_date"), // 时间/日期
    group_no: varchar("group_no", { length: 100 }), // 团号
    station: varchar("station", { length: 100 }), // 场站（大兴机场、北京南站等）
    pickup_type: varchar("pickup_type", { length: 20 }), // 接送站（接站/送站）
    dispatcher: varchar("dispatcher", { length: 50 }), // 调度
    driver: varchar("driver", { length: 50 }), // 司机
    train_no: varchar("train_no", { length: 50 }), // 班次（航班号/车次号）
    train_time: time("train_time"), // 班次时间
    time_remark: text("time_remark"), // 时间备注
    guest_name: varchar("guest_name", { length: 100 }), // 客人姓名
    phone: varchar("phone", { length: 50 }), // 手机号
    people_count: integer("people_count"), // 人数
    hotel: varchar("hotel", { length: 200 }), // 宾馆
    remark: text("remark"), // 备注
    amount: numeric("amount", { precision: 10, scale: 2 }), // 金额
    fleet_amount: numeric("fleet_amount", { precision: 10, scale: 2 }), // 车队金额
    agency_amount: numeric("agency_amount", { precision: 10, scale: 2 }), // 旅行社金额
    // 系统字段
    source: varchar("source", { length: 20 }).default("manual"), // 来源：manual/excel/image/text
    raw_content: text("raw_content"), // 原始内容（用于追溯）
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("orders_order_date_idx").on(table.order_date), // 按日期查询
    index("orders_station_idx").on(table.station), // 按场站筛选
    index("orders_pickup_type_idx").on(table.pickup_type), // 按接送站筛选
    index("orders_driver_idx").on(table.driver), // 按司机筛选
    index("orders_created_at_idx").on(table.created_at), // 按创建时间排序
  ]
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
