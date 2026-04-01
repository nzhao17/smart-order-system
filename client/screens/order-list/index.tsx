import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

// 商务风格配色
const COLORS = {
  primary: '#002FA7',
  primaryDark: '#001F7A',
  accent: '#C9A96E',
  background: '#F8F6F2',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
  success: '#059669',
  surface: '#F3F4F6',
  error: '#DC2626',
  warning: '#D97706',
  border: 'rgba(201, 169, 110, 0.3)',
};

interface Order {
  id: number;
  order_date: string;
  group_no: string;
  station: string;
  pickup_type: string;
  dispatcher: string;
  driver: string;
  train_no: string;
  train_time: string;
  time_remark: string;
  guest_name: string;
  phone: string;
  people_count: number;
  hotel: string;
  remark: string;
  amount: number;
  fleet_amount: number;
  agency_amount: number;
  source: string;
  created_at: string;
}

interface Filters {
  date_from: string;
  date_to: string;
  group_no: string;
  station: string;
  pickup_type: string;
  dispatcher: string;
  driver: string;
  train_no: string;
  train_time: string;
  time_remark: string;
  guest_name: string;
  phone: string;
  people_count: string;
  hotel: string;
}

export default function OrderListScreen() {
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ date: '', totalOrders: 0 });
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    date_from: '',
    date_to: '',
    group_no: '',
    station: '',
    pickup_type: '',
    dispatcher: '',
    driver: '',
    train_no: '',
    train_time: '',
    time_remark: '',
    guest_name: '',
    phone: '',
    people_count: '',
    hotel: '',
  });
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 获取今日统计
  const fetchTodayStats = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/stats/today`);
      const result = await response.json();
      if (result.success) {
        setTodayStats(result.data);
      }
    } catch (err) {
      console.error('获取统计失败:', err);
    }
  };

  // 获取订单列表
  const fetchOrders = async (customFilters?: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const activeFilters = customFilters || filters;
      
      if (activeFilters.date_from) params.append('date_from', activeFilters.date_from);
      if (activeFilters.date_to) params.append('date_to', activeFilters.date_to);
      if (activeFilters.group_no) params.append('group_no', activeFilters.group_no);
      if (activeFilters.station) params.append('station', activeFilters.station);
      if (activeFilters.pickup_type) params.append('pickup_type', activeFilters.pickup_type);
      if (activeFilters.dispatcher) params.append('dispatcher', activeFilters.dispatcher);
      if (activeFilters.driver) params.append('driver', activeFilters.driver);
      if (activeFilters.train_no) params.append('train_no', activeFilters.train_no);
      if (activeFilters.train_time) params.append('train_time', activeFilters.train_time);
      if (activeFilters.time_remark) params.append('time_remark', activeFilters.time_remark);
      if (activeFilters.guest_name) params.append('guest_name', activeFilters.guest_name);
      if (activeFilters.phone) params.append('phone', activeFilters.phone);
      if (activeFilters.people_count) params.append('people_count', activeFilters.people_count);
      if (activeFilters.hotel) params.append('hotel', activeFilters.hotel);

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders?${params.toString()}&pageSize=100`
      );
      const result = await response.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      console.error('获取订单列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchTodayStats();
      fetchOrders();
    }, [filters])
  );

  // 删除订单
  const deleteOrder = (id: number) => {
    Alert.alert('确认删除', '确定要删除这条订单吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/${id}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
              setOrders(orders.filter(o => o.id !== id));
              fetchTodayStats();
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            Alert.alert('删除失败', (err as Error).message);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  // 点击今日订单筛选今日订单
  const filterToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayFilters: Filters = { ...filters, date_from: today, date_to: today };
    setTempFilters(todayFilters);
    setFilters(todayFilters);
  };

  // 应用筛选
  const applyFilters = () => {
    setFilters(tempFilters);
    setFilterVisible(false);
  };

  // 清除筛选
  const clearFilters = () => {
    const emptyFilters: Filters = {
      date_from: '',
      date_to: '',
      group_no: '',
      station: '',
      pickup_type: '',
      dispatcher: '',
      driver: '',
      train_no: '',
      train_time: '',
      time_remark: '',
      guest_name: '',
      phone: '',
      people_count: '',
      hotel: '',
    };
    setTempFilters(emptyFilters);
  };

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      return `${parts[1]}月${parts[2]}日`;
    }
    return dateStr;
  };

  // 检查是否有激活的筛选条件
  const hasActiveFilters = () => {
    return Object.values(filters).some(v => v !== '');
  };

  return (
    <Screen style={{ backgroundColor: COLORS.background }}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单统计</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
        {/* 今日统计卡片 */}
        <TouchableOpacity onPress={filterToday} activeOpacity={0.8}>
          <View style={styles.statsCard}>
            <View style={styles.statsContent}>
              <Text style={styles.statsLabel}>今日订单数</Text>
              <Text style={styles.statsNumber}>{todayStats.totalOrders}</Text>
              <Text style={styles.statsDate}>{todayStats.date}</Text>
            </View>
            <View style={styles.statsIcon}>
              <Ionicons name="clipboard-outline" size={32} color={COLORS.accent} />
            </View>
          </View>
        </TouchableOpacity>

        {/* 筛选按钮 */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>订单列表</Text>
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters() && { backgroundColor: COLORS.primary }]}
            onPress={() => { setTempFilters(filters); setFilterVisible(true); }}
          >
            <Ionicons name="filter-outline" size={16} color={hasActiveFilters() ? '#FFF' : COLORS.primary} />
            <Text style={[styles.filterButtonText, hasActiveFilters() && { color: '#FFF' }]}>筛选</Text>
          </TouchableOpacity>
        </View>

        {/* 订单列表 */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={COLORS.placeholder} />
            <Text style={styles.emptyText}>暂无订单数据</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => router.push('/order-detail', { id: order.id })}
              >
                {/* 顶部：日期和接送站类型 */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderDate}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.orderDateText}>{formatDate(order.order_date)}</Text>
                  </View>
                  <View style={[styles.pickupTypeBadge, 
                    order.pickup_type === '接站' ? { backgroundColor: 'rgba(5,150,105,0.1)' } : { backgroundColor: 'rgba(220,38,38,0.1)' }
                  ]}>
                    <Text style={[styles.pickupTypeText,
                      order.pickup_type === '接站' ? { color: COLORS.success } : { color: COLORS.error }
                    ]}>{order.pickup_type || '-'}</Text>
                  </View>
                </View>

                {/* 核心信息 */}
                <View style={styles.orderMain}>
                  <Text style={styles.orderGuest}>{order.guest_name || '-'}</Text>
                  <Text style={styles.orderGroup}>{order.group_no || '-'}</Text>
                </View>

                {/* 详细信息 */}
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{order.station}</Text>
                    <Ionicons name="train-outline" size={12} color={COLORS.textSecondary} style={{ marginLeft: 12 }} />
                    <Text style={styles.detailText}>{order.train_no} {order.train_time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{order.driver || '-'}</Text>
                    <Ionicons name="call-outline" size={12} color={COLORS.textSecondary} style={{ marginLeft: 12 }} />
                    <Text style={styles.detailText}>{order.phone}</Text>
                    <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} style={{ marginLeft: 12 }} />
                    <Text style={styles.detailText}>{order.people_count}人</Text>
                  </View>
                  {order.hotel && (
                    <View style={styles.detailRow}>
                      <Ionicons name="bed-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>{order.hotel}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* 删除按钮 */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteOrder(order.id)}
                disabled={deletingId === order.id}
              >
                {deletingId === order.id ? (
                  <ActivityIndicator size="small" color={COLORS.error} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* 筛选弹窗 */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>筛选条件</Text>
                <TouchableOpacity onPress={() => setFilterVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>时间范围</Text>
                  <View style={styles.dateRangeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.filterLabel}>开始日期</Text>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.placeholder}
                        value={tempFilters.date_from}
                        onChangeText={(v) => setTempFilters({ ...tempFilters, date_from: v })}
                      />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.filterLabel}>结束日期</Text>
                      <TextInput
                        style={styles.filterInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.placeholder}
                        value={tempFilters.date_to}
                        onChangeText={(v) => setTempFilters({ ...tempFilters, date_to: v })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>基本信息</Text>
                  <FilterInput label="团号" value={tempFilters.group_no} placeholder="请输入团号"
                    onChange={(v) => setTempFilters({ ...tempFilters, group_no: v })} />
                  <FilterInput label="场站" value={tempFilters.station} placeholder="如：大兴机场"
                    onChange={(v) => setTempFilters({ ...tempFilters, station: v })} />
                  <FilterSelect label="接送站" value={tempFilters.pickup_type} options={['接站', '送站']}
                    onChange={(v) => setTempFilters({ ...tempFilters, pickup_type: v })} />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>人员信息</Text>
                  <FilterInput label="调度" value={tempFilters.dispatcher} placeholder="请输入调度姓名"
                    onChange={(v) => setTempFilters({ ...tempFilters, dispatcher: v })} />
                  <FilterInput label="司机" value={tempFilters.driver} placeholder="请输入司机姓名"
                    onChange={(v) => setTempFilters({ ...tempFilters, driver: v })} />
                  <FilterInput label="客人" value={tempFilters.guest_name} placeholder="请输入客人姓名"
                    onChange={(v) => setTempFilters({ ...tempFilters, guest_name: v })} />
                  <FilterInput label="手机号" value={tempFilters.phone} placeholder="请输入手机号"
                    onChange={(v) => setTempFilters({ ...tempFilters, phone: v })} />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>行程信息</Text>
                  <FilterInput label="班次" value={tempFilters.train_no} placeholder="如：CZ8929"
                    onChange={(v) => setTempFilters({ ...tempFilters, train_no: v })} />
                  <FilterInput label="班次时间" value={tempFilters.train_time} placeholder="如：15:30"
                    onChange={(v) => setTempFilters({ ...tempFilters, train_time: v })} />
                  <FilterInput label="时间备注" value={tempFilters.time_remark} placeholder="请输入时间备注"
                    onChange={(v) => setTempFilters({ ...tempFilters, time_remark: v })} />
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>其他信息</Text>
                  <FilterInput label="人数" value={tempFilters.people_count} placeholder="请输入人数" keyboardType="numeric"
                    onChange={(v) => setTempFilters({ ...tempFilters, people_count: v })} />
                  <FilterInput label="宾馆" value={tempFilters.hotel} placeholder="请输入宾馆名称"
                    onChange={(v) => setTempFilters({ ...tempFilters, hotel: v })} />
                </View>
              </ScrollView>

              {/* 操作按钮 */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>清除筛选</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>确认筛选</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

// 筛选输入框
function FilterInput({ label, value, placeholder, onChange, keyboardType }: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TextInput
        style={styles.filterInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

// 筛选选择框
function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.selectRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.selectOption, value === option && styles.selectOptionActive]}
            onPress={() => onChange(value === option ? '' : option)}
          >
            <Text style={[styles.selectOptionText, value === option && styles.selectOptionTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 15,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  statsCard: {
    flexDirection: 'row' as const,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center' as const,
  },
  statsContent: {
    flex: 1,
  },
  statsLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  statsNumber: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#FFF',
    marginTop: 4,
  },
  statsDate: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
  },
  statsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  listHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  filterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(0,47,167,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.primary,
    fontWeight: '500' as const,
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 40,
    alignItems: 'center' as const,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  orderCard: {
    flexDirection: 'row' as const,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start' as const,
  },
  orderHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  orderDate: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  orderDateText: {
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  pickupTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
  },
  pickupTypeText: {
    fontWeight: '600' as const,
    fontSize: 12,
  },
  orderMain: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 12,
  },
  orderGuest: {
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  orderGroup: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  orderDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: 'rgba(220,38,38,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%' as const,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  modalBody: {
    padding: 20,
    maxHeight: 450,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  filterLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  filterInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateRangeRow: {
    flexDirection: 'row' as const,
  },
  selectRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  selectOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectOptionText: {
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  selectOptionTextActive: {
    color: '#FFF',
  },
  modalFooter: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center' as const,
  },
  clearButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
    fontSize: 15,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    alignItems: 'center' as const,
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
    fontSize: 15,
    letterSpacing: 1,
  },
};
