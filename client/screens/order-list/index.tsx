import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

// 配色方案
const COLORS = {
  primary: '#6C63FF',
  primaryGradient: '#896BFF',
  secondary: '#FF6584',
  background: '#F0F0F3',
  card: '#F0F0F3',
  shadowDark: '#D1D9E6',
  shadowLight: '#FFFFFF',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  placeholder: '#B2BEC3',
  success: '#00B894',
  surface: '#E8E8EB',
  error: '#FF6B6B',
  warning: '#FDCB6E',
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

export default function OrderListScreen() {
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ date: '', totalOrders: 0 });
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    station: '',
    pickup_type: '',
    driver: '',
  });
  const [tempFilters, setTempFilters] = useState(filters);

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
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.station) params.append('station', filters.station);
      if (filters.pickup_type) params.append('pickup_type', filters.pickup_type);
      if (filters.driver) params.append('driver', filters.driver);

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

  // 应用筛选
  const applyFilters = () => {
    setFilters(tempFilters);
    setFilterVisible(false);
  };

  // 清除筛选
  const clearFilters = () => {
    setTempFilters({ date: '', station: '', pickup_type: '', driver: '' });
  };

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return `${parts[1]}月${parts[2]}日`;
  };

  return (
    <Screen style={{ backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 120,
        }}
      >
        {/* 页面标题 */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginTop: 20 }}>
          订单统计
        </Text>

        {/* 今日统计卡片 */}
        <View
          style={{
            shadowColor: COLORS.shadowDark,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.7,
            shadowRadius: 8,
            borderRadius: 24,
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              shadowColor: COLORS.shadowLight,
              shadowOffset: { width: -6, height: -6 },
              shadowOpacity: 0.9,
              shadowRadius: 8,
              backgroundColor: COLORS.card,
              borderRadius: 24,
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>今日订单数</Text>
              <Text style={{ fontSize: 36, fontWeight: '800', color: COLORS.primary, marginTop: 4 }}>
                {todayStats.totalOrders}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                {todayStats.date}
              </Text>
            </View>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(108,99,255,0.12)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="clipboard" size={36} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* 筛选按钮 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}>
            订单列表
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(108,99,255,0.12)',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
            }}
            onPress={() => {
              setTempFilters(filters);
              setFilterVisible(true);
            }}
          >
            <Ionicons name="filter" size={14} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>筛选</Text>
          </TouchableOpacity>
        </View>

        {/* 订单列表 */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
            }}
          >
            <Ionicons name="folder-open" size={48} color={COLORS.placeholder} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>暂无订单数据</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push('/order-detail', { id: order.id })}
            >
              <View
                style={{
                  shadowColor: COLORS.shadowDark,
                  shadowOffset: { width: 6, height: 6 },
                  shadowOpacity: 0.7,
                  shadowRadius: 8,
                  borderRadius: 20,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    shadowColor: COLORS.shadowLight,
                    shadowOffset: { width: -6, height: -6 },
                    shadowOpacity: 0.9,
                    shadowRadius: 8,
                    backgroundColor: COLORS.card,
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  {/* 顶部：日期和接送站类型 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="calendar" size={14} color={COLORS.primary} />
                      <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>
                        {formatDate(order.order_date)}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          order.pickup_type === '接站'
                            ? 'rgba(0,184,148,0.12)'
                            : 'rgba(255,101,132,0.12)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: order.pickup_type === '接站' ? COLORS.success : COLORS.secondary,
                          fontWeight: '600',
                          fontSize: 12,
                        }}
                      >
                        {order.pickup_type || '-'}
                      </Text>
                    </View>
                  </View>

                  {/* 核心信息 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="person" size={14} color={COLORS.textSecondary} />
                    <Text
                      style={{
                        fontWeight: '700',
                        color: COLORS.textPrimary,
                        marginLeft: 8,
                        fontSize: 16,
                      }}
                    >
                      {order.guest_name || '-'}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, marginLeft: 8 }}>
                      {order.group_no || '-'}
                    </Text>
                  </View>

                  {/* 详细信息 */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="location" size={12} color={COLORS.textSecondary} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        {order.station}
                      </Text>
                      <Ionicons name="train" size={12} color={COLORS.textSecondary} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        {order.train_no} {order.train_time}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="car-sport" size={12} color={COLORS.textSecondary} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        {order.driver || '-'}
                      </Text>
                      <Ionicons name="call" size={12} color={COLORS.textSecondary} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        {order.phone}
                      </Text>
                      <Ionicons name="people" size={12} color={COLORS.textSecondary} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        {order.people_count}人
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="bed" size={12} color={COLORS.textSecondary} />
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        {order.hotel || '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 筛选弹窗 */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        >
          <View
            style={{
              backgroundColor: COLORS.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}>
                筛选条件
              </Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 筛选字段 */}
            <View style={{ gap: 16 }}>
              <FilterInput
                label="日期"
                value={tempFilters.date}
                placeholder="YYYY-MM-DD"
                onChange={(text) => setTempFilters({ ...tempFilters, date: text })}
              />
              <FilterInput
                label="场站"
                value={tempFilters.station}
                placeholder="如：大兴机场"
                onChange={(text) => setTempFilters({ ...tempFilters, station: text })}
              />
              <FilterSelect
                label="接送站"
                value={tempFilters.pickup_type}
                options={['接站', '送站']}
                onChange={(value) => setTempFilters({ ...tempFilters, pickup_type: value })}
              />
              <FilterInput
                label="司机"
                value={tempFilters.driver}
                placeholder="司机姓名"
                onChange={(text) => setTempFilters({ ...tempFilters, driver: text })}
              />
            </View>

            {/* 操作按钮 */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={clearFilters}
              >
                <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>清除</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: COLORS.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
                onPress={applyFilters}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>确认筛选</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

function FilterInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (text: string) => void;
}) {
  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.6)',
        }}
      >
        <TextInput
          style={{ fontSize: 15, color: COLORS.textPrimary }}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChange}
        />
      </View>
    </View>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={{
              flex: 1,
              backgroundColor: value === option ? COLORS.primary : COLORS.surface,
              borderRadius: 12,
              padding: 14,
              alignItems: 'center',
            }}
            onPress={() => onChange(value === option ? '' : option)}
          >
            <Text
              style={{
                color: value === option ? '#FFF' : COLORS.textSecondary,
                fontWeight: '600',
              }}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
