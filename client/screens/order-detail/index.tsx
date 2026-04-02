import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

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
  people_count: number | null;
  hotel: string;
  remark: string;
  amount: number | null;
  fleet_amount: number | null;
  agency_amount: number | null;
  source: string;
  created_at: string;
}

export default function OrderDetailScreen() {
  const { id } = useSafeSearchParams<{ id: number }>();
  const router = useSafeRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    order_date: '',
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
    remark: '',
    amount: '',
    fleet_amount: '',
    agency_amount: '',
  });

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/${id}`);
      const result = await response.json();
      if (result.success) {
        const data = result.data;
        setOrder(data);
        setFormData({
          order_date: data.order_date || '',
          group_no: data.group_no || '',
          station: data.station || '',
          pickup_type: data.pickup_type || '',
          dispatcher: data.dispatcher || '',
          driver: data.driver || '',
          train_no: data.train_no || '',
          train_time: data.train_time || '',
          time_remark: data.time_remark || '',
          guest_name: data.guest_name || '',
          phone: data.phone || '',
          people_count: data.people_count?.toString() || '',
          hotel: data.hotel || '',
          remark: data.remark || '',
          amount: data.amount?.toString() || '',
          fleet_amount: data.fleet_amount?.toString() || '',
          agency_amount: data.agency_amount?.toString() || '',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('获取订单详情失败:', err);
      Alert.alert('错误', '获取订单详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // 更新表单字段
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setEdited(true);
  };

  // 保存订单
  const handleSave = async () => {
    if (!order) return;
    
    setSaving(true);
    try {
      const updateData = {
        order_date: formData.order_date || null,
        group_no: formData.group_no || null,
        station: formData.station || null,
        pickup_type: formData.pickup_type || null,
        dispatcher: formData.dispatcher || null,
        driver: formData.driver || null,
        train_no: formData.train_no || null,
        train_time: formData.train_time || null,
        time_remark: formData.time_remark || null,
        guest_name: formData.guest_name || null,
        phone: formData.phone || null,
        people_count: formData.people_count ? parseInt(formData.people_count) : null,
        hotel: formData.hotel || null,
        remark: formData.remark || null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        fleet_amount: formData.fleet_amount ? parseFloat(formData.fleet_amount) : null,
        agency_amount: formData.agency_amount ? parseFloat(formData.agency_amount) : null,
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (result.success) {
        setEdited(false);
        Alert.alert('成功', '订单已更新');
        fetchOrderDetail();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      Alert.alert('保存失败', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 删除订单
  const handleDelete = () => {
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
              Alert.alert('成功', '订单已删除', [
                { text: '确定', onPress: () => router.back() }
              ]);
            } else {
              throw new Error(result.error);
            }
          } catch {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  // 加载中状态
  if (loading) {
    return (
      <Screen style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>订单详情</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  // 订单不存在
  if (!order) {
    return (
      <Screen style={{ backgroundColor: COLORS.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            <Text style={styles.backText}>返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>订单详情</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: COLORS.textSecondary }}>订单不存在</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ backgroundColor: COLORS.background }}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单详情</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderBtn}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 接送站类型选择 */}
            <View style={styles.pickupTypeSection}>
              {['接站', '送站'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickupTypeBtn,
                    formData.pickup_type === type && styles.pickupTypeBtnActive,
                  ]}
                  onPress={() => updateField('pickup_type', type)}
                >
                  <Text style={[
                    styles.pickupTypeText,
                    formData.pickup_type === type && styles.pickupTypeTextActive,
                  ]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 基本信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>基本信息</Text>
              <FormInput label="时间" value={formData.order_date} placeholder="YYYY-MM-DD"
                onChange={(v) => updateField('order_date', v)} />
              <FormInput label="团号" value={formData.group_no} placeholder="请输入团号"
                onChange={(v) => updateField('group_no', v)} />
              <FormInput label="场站" value={formData.station} placeholder="如：大兴机场"
                onChange={(v) => updateField('station', v)} />
              <FormInput label="调度" value={formData.dispatcher} placeholder="请输入调度姓名"
                onChange={(v) => updateField('dispatcher', v)} />
              <FormInput label="司机" value={formData.driver} placeholder="请输入司机姓名"
                onChange={(v) => updateField('driver', v)} />
            </View>

            {/* 班次信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>班次信息</Text>
              <FormInput label="班次" value={formData.train_no} placeholder="如：CZ8929"
                onChange={(v) => updateField('train_no', v)} />
              <FormInput label="班次时间" value={formData.train_time} placeholder="如：15:30"
                onChange={(v) => updateField('train_time', v)} />
              <FormInput label="时间备注" value={formData.time_remark} placeholder="请输入时间备注"
                onChange={(v) => updateField('time_remark', v)} />
            </View>

            {/* 客人信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>客人信息</Text>
              <FormInput label="客人姓名" value={formData.guest_name} placeholder="请输入客人姓名"
                onChange={(v) => updateField('guest_name', v)} />
              <FormInput label="手机号" value={formData.phone} placeholder="请输入手机号"
                onChange={(v) => updateField('phone', v)} keyboardType="phone-pad" />
              <FormInput label="人数" value={formData.people_count} placeholder="请输入人数"
                onChange={(v) => updateField('people_count', v)} keyboardType="numeric" />
              <FormInput label="宾馆" value={formData.hotel} placeholder="请输入宾馆名称"
                onChange={(v) => updateField('hotel', v)} />
            </View>

            {/* 金额信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>金额信息</Text>
              <FormInput label="金额" value={formData.amount} placeholder="请输入金额"
                onChange={(v) => updateField('amount', v)} keyboardType="decimal-pad" />
              <FormInput label="车队金额" value={formData.fleet_amount} placeholder="请输入车队金额"
                onChange={(v) => updateField('fleet_amount', v)} keyboardType="decimal-pad" />
              <FormInput label="旅行社金额" value={formData.agency_amount} placeholder="请输入旅行社金额"
                onChange={(v) => updateField('agency_amount', v)} keyboardType="decimal-pad" />
            </View>

            {/* 备注 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>备注</Text>
              <FormInput label="备注" value={formData.remark} placeholder="请输入备注"
                onChange={(v) => updateField('remark', v)} multiline />
            </View>

            {/* 保存按钮 */}
            <TouchableOpacity
              style={[styles.saveButton, (!edited || saving) && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={!edited || saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>保存修改</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// 表单输入组件
function FormInput({ label, value, placeholder, onChange, multiline, keyboardType }: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'numeric' | 'phone-pad' | 'decimal-pad' | 'default';
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
      />
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
  deleteHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: 'rgba(220,38,38,0.08)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  pickupTypeSection: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 14,
  },
  pickupTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickupTypeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pickupTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textSecondary,
  },
  pickupTypeTextActive: {
    color: '#FFF',
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  formField: {
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  formInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
    fontSize: 16,
    letterSpacing: 2,
  },
};
