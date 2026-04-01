import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

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

export default function OrderDetailScreen() {
  const { id } = useSafeSearchParams<{ id: number }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/${id}`);
      const result = await response.json();
      if (result.success) {
        setOrder(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('获取订单详情失败:', err);
      Alert.alert('错误', '获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    
    Alert.alert('确认删除', '确定要删除这条订单吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/${order.id}`,
              { method: 'DELETE' }
            );
            const result = await response.json();
            if (result.success) {
              Alert.alert('成功', '订单已删除');
            } else {
              throw new Error(result.error);
            }
          } catch (err) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return `${parts[0]}年${parts[1]}月${parts[2]}日`;
  };

  if (loading) {
    return (
      <Screen style={{ backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen style={{ backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.textSecondary }}>订单不存在</Text>
      </Screen>
    );
  }

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
          订单详情
        </Text>

        {/* 主要信息卡片 */}
        <View
          style={{
            shadowColor: COLORS.shadowDark,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.7,
            shadowRadius: 8,
            borderRadius: 24,
            marginTop: 20,
            marginBottom: 16,
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
            }}
          >
            {/* 日期和类型 */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary }}>
                {formatDate(order.order_date)}
              </Text>
              <View
                style={{
                  backgroundColor:
                    order.pickup_type === '接站'
                      ? 'rgba(0,184,148,0.12)'
                      : 'rgba(255,101,132,0.12)',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text
                  style={{
                    color: order.pickup_type === '接站' ? COLORS.success : COLORS.secondary,
                    fontWeight: '700',
                  }}
                >
                  {order.pickup_type || '-'}
                </Text>
              </View>
            </View>

            {/* 客人信息 */}
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.textPrimary }}>
              {order.guest_name || '-'}
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 4 }}>
              {order.group_no || '无团号'}
            </Text>
          </View>
        </View>

        {/* 详细信息 */}
        <View
          style={{
            shadowColor: COLORS.shadowDark,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.7,
            shadowRadius: 8,
            borderRadius: 24,
            marginBottom: 16,
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
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 }}>
              班次信息
            </Text>

            <DetailRow icon="location" label="场站" value={order.station} />
            <DetailRow icon="train" label="班次" value={order.train_no} />
            <DetailRow icon="time" label="时间" value={order.train_time} />
            <DetailRow icon="create" label="时间备注" value={order.time_remark} />
          </View>
        </View>

        {/* 人员信息 */}
        <View
          style={{
            shadowColor: COLORS.shadowDark,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.7,
            shadowRadius: 8,
            borderRadius: 24,
            marginBottom: 16,
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
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 }}>
              人员信息
            </Text>

            <DetailRow icon="call" label="手机号" value={order.phone} />
            <DetailRow icon="people" label="人数" value={order.people_count ? `${order.people_count}人` : '-'} />
            <DetailRow icon="person" label="调度" value={order.dispatcher} />
            <DetailRow icon="car-sport" label="司机" value={order.driver} />
            <DetailRow icon="bed" label="宾馆" value={order.hotel} />
          </View>
        </View>

        {/* 金额信息 */}
        <View
          style={{
            shadowColor: COLORS.shadowDark,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.7,
            shadowRadius: 8,
            borderRadius: 24,
            marginBottom: 16,
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
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 }}>
              金额信息
            </Text>

            <DetailRow icon="cash" label="金额" value={order.amount ? `¥${order.amount}` : '-'} />
            <DetailRow icon="bus" label="车队金额" value={order.fleet_amount ? `¥${order.fleet_amount}` : '-'} />
            <DetailRow icon="business" label="旅行社金额" value={order.agency_amount ? `¥${order.agency_amount}` : '-'} />
          </View>
        </View>

        {/* 备注 */}
        {(order.remark || order.source) && (
          <View
            style={{
              shadowColor: COLORS.shadowDark,
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.7,
              shadowRadius: 8,
              borderRadius: 24,
              marginBottom: 16,
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
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 }}>
                其他信息
              </Text>

              {order.remark && <DetailRow icon="chatbubble" label="备注" value={order.remark} />}
              <DetailRow
                icon="layers"
                label="来源"
                value={
                  order.source === 'text'
                    ? '文本录入'
                    : order.source === 'image'
                      ? '图片识别'
                        : order.source === 'excel'
                        ? 'Excel导入'
                        : '手动录入'
                }
              />
            </View>
          </View>
        )}

        {/* 删除按钮 */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.error,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleDelete}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="trash" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>删除订单</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(209,217,230,0.3)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(108,99,255,0.1)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={14} color={COLORS.primary} />
      </View>
      <Text style={{ color: COLORS.textSecondary, marginLeft: 12, width: 80 }}>{label}</Text>
      <Text style={{ flex: 1, color: COLORS.textPrimary, fontWeight: '500' }}>{value || '-'}</Text>
    </View>
  );
}
