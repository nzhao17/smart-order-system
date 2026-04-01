import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { createFormDataFile } from '@/utils';

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

// 订单字段类型
interface OrderData {
  order_date?: string;
  group_no?: string;
  station?: string;
  pickup_type?: string;
  dispatcher?: string;
  driver?: string;
  train_no?: string;
  train_time?: string;
  guest_name?: string;
  phone?: string;
  people_count?: number;
  hotel?: string;
  remark?: string;
}

type InputMode = 'text' | 'image' | 'excel';

export default function OrderEntryScreen() {
  const router = useSafeRouter();
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedOrders, setParsedOrders] = useState<OrderData[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderData>({});

  // 选择图片
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setSelectedFile(null);
    }
  };

  // 选择文件（Excel）
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0].uri);
        setSelectedImage(null);
      }
    } catch {
      Alert.alert('错误', '选择文件失败');
    }
  };

  // 解析内容
  const handleParse = async () => {
    if (inputMode === 'text' && !textInput.trim()) {
      Alert.alert('提示', '请输入或粘贴文本内容');
      return;
    }
    if (inputMode === 'image' && !selectedImage) {
      Alert.alert('提示', '请选择图片');
      return;
    }
    if (inputMode === 'excel' && !selectedFile) {
      Alert.alert('提示', '请选择Excel文件');
      return;
    }

    setLoading(true);
    try {
      if (inputMode === 'text') {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/parse/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textInput }),
        });
        const result = await response.json();
        if (result.success) {
          setParsedOrders(result.data);
          Alert.alert('成功', `识别到 ${result.count} 条订单`);
        } else {
          throw new Error(result.error);
        }
      } else if (inputMode === 'image' && selectedImage) {
        const formData = new FormData();
        const file = await createFormDataFile(selectedImage, 'image.jpg', 'image/jpeg');
        formData.append('image', file as any);

        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/parse/image`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          setParsedOrders(result.data);
          Alert.alert('成功', `识别到 ${result.count} 条订单`);
        } else {
          throw new Error(result.error);
        }
      } else if (inputMode === 'excel' && selectedFile) {
        const formData = new FormData();
        const file = await createFormDataFile(
          selectedFile,
          'orders.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        formData.append('file', file as any);

        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/parse/excel`, {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          setParsedOrders(result.data);
          Alert.alert('成功', `识别到 ${result.count} 条订单`);
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err) {
      Alert.alert('解析失败', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 提交订单
  const handleSubmit = async () => {
    if (parsedOrders.length === 0) {
      Alert.alert('提示', '请先解析订单信息');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/orders/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: parsedOrders }),
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', `成功录入 ${result.count} 条订单`, [
          { text: '查看订单', onPress: () => router.replace('/order-list') },
        ]);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      Alert.alert('提交失败', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑弹窗
  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setEditingOrder({ ...parsedOrders[index] });
    setEditModalVisible(true);
  };

  // 保存编辑
  const saveEdit = () => {
    if (editingIndex !== null) {
      const newOrders = [...parsedOrders];
      newOrders[editingIndex] = editingOrder;
      setParsedOrders(newOrders);
    }
    setEditModalVisible(false);
    setEditingIndex(null);
    setEditingOrder({});
  };

  // 删除识别结果
  const deleteParsedOrder = (index: number) => {
    Alert.alert('确认删除', '确定要删除这条识别结果吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '删除', 
        style: 'destructive',
        onPress: () => {
          const newOrders = parsedOrders.filter((_, i) => i !== index);
          setParsedOrders(newOrders);
        }
      },
    ]);
  };

  const resetForm = () => {
    setTextInput('');
    setSelectedImage(null);
    setSelectedFile(null);
    setParsedOrders([]);
  };

  return (
    <Screen style={{ backgroundColor: COLORS.background }}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>订单录入</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
      >
        {/* 输入方式选择 */}
        <View style={styles.modeContainer}>
          <ModeButton
            icon="text"
            label="文本粘贴"
            active={inputMode === 'text'}
            onPress={() => { setInputMode('text'); setSelectedImage(null); setSelectedFile(null); }}
          />
          <ModeButton
            icon="image-outline"
            label="图片上传"
            active={inputMode === 'image'}
            onPress={() => { setInputMode('image'); setTextInput(''); setSelectedFile(null); }}
          />
          <ModeButton
            icon="document-text-outline"
            label="Excel导入"
            active={inputMode === 'excel'}
            onPress={() => { setInputMode('excel'); setTextInput(''); setSelectedImage(null); }}
          />
        </View>

        {/* 输入区域 */}
        <View style={styles.inputCard}>
          {inputMode === 'text' && (
            <>
              <Text style={styles.inputLabel}>粘贴订单文本</Text>
              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="粘贴订单信息，如：更新-明日4月1日到京陆加文5人接站信息G56北京南15:27..."
                  placeholderTextColor={COLORS.placeholder}
                  multiline
                  value={textInput}
                  onChangeText={setTextInput}
                />
              </View>
            </>
          )}

          {inputMode === 'image' && (
            <>
              <Text style={styles.inputLabel}>选择图片</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadButtonText}>从相册选择</Text>
              </TouchableOpacity>
              {selectedImage && (
                <View style={styles.selectedFile}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.selectedFileText}>已选择图片</Text>
                </View>
              )}
            </>
          )}

          {inputMode === 'excel' && (
            <>
              <Text style={styles.inputLabel}>选择Excel文件</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Ionicons name="document-text-outline" size={24} color={COLORS.success} />
                <Text style={[styles.uploadButtonText, { color: COLORS.success }]}>选择Excel文件</Text>
              </TouchableOpacity>
              {selectedFile && (
                <View style={styles.selectedFile}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.selectedFileText}>已选择Excel文件</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* 解析按钮 */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handleParse}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="search-outline" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>智能解析</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 解析结果 */}
        {parsedOrders.length > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>识别结果 ({parsedOrders.length}条)</Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.clearText}>清空</Text>
              </TouchableOpacity>
            </View>

            {parsedOrders.map((order, index) => (
              <TouchableOpacity key={index} style={styles.orderItem} onPress={() => openEditModal(index)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderItemTitle}>
                    {order.guest_name || '未命名'} - {order.group_no || '无团号'}
                  </Text>
                  <Text style={styles.orderItemSub}>
                    {[order.order_date, order.station, order.pickup_type, order.train_no, order.train_time]
                      .filter(Boolean).join(' | ')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    onPress={() => openEditModal(index)}
                    style={styles.editIcon}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => deleteParsedOrder(index)}
                    style={styles.editIcon}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}

            {/* 提交按钮 */}
            <TouchableOpacity
              style={[styles.submitButton, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                  <Text style={styles.submitButtonText}>确认录入</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 编辑弹窗 */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>编辑订单信息</Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                    <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <EditField label="时间" value={editingOrder.order_date || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, order_date: v })} />
                  <EditField label="团号" value={editingOrder.group_no || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, group_no: v })} />
                  <EditField label="场站" value={editingOrder.station || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, station: v })} />
                  <EditField label="接送站" value={editingOrder.pickup_type || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, pickup_type: v })} />
                  <EditField label="调度" value={editingOrder.dispatcher || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, dispatcher: v })} />
                  <EditField label="司机" value={editingOrder.driver || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, driver: v })} />
                  <EditField label="班次" value={editingOrder.train_no || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, train_no: v })} />
                  <EditField label="班次时间" value={editingOrder.train_time || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, train_time: v })} />
                  <EditField label="客人" value={editingOrder.guest_name || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, guest_name: v })} />
                  <EditField label="手机号" value={editingOrder.phone || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, phone: v })} />
                  <EditField label="人数" value={editingOrder.people_count?.toString() || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, people_count: v ? parseInt(v) : undefined })} 
                    keyboardType="numeric" />
                  <EditField label="宾馆" value={editingOrder.hotel || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, hotel: v })} />
                  <EditField label="备注" value={editingOrder.remark || ''} 
                    onChange={(v) => setEditingOrder({ ...editingOrder, remark: v })} multiline />
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                    <Text style={styles.saveButtonText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </Screen>
  );
}

// 输入方式按钮
function ModeButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={onPress}
    >
      <Ionicons name={icon as any} size={20} color={active ? '#FFF' : COLORS.textSecondary} />
      <Text style={[styles.modeButtonText, active && { color: '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// 编辑字段
function EditField({ label, value, onChange, multiline, keyboardType }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={[styles.editInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={`请输入${label}`}
        placeholderTextColor={COLORS.placeholder}
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
  modeContainer: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center' as const,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent' as const,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  inputCard: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  textInputWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 14,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlignVertical: 'top' as const,
  },
  uploadButton: {
    backgroundColor: 'rgba(0,47,167,0.06)',
    borderRadius: 4,
    paddingVertical: 20,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed' as const,
  },
  uploadButtonText: {
    color: COLORS.primary,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  selectedFile: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(5,150,105,0.08)',
    borderRadius: 4,
    gap: 8,
  },
  selectedFileText: {
    color: COLORS.success,
    fontWeight: '500' as const,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
    fontSize: 16,
    letterSpacing: 2,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
  clearText: {
    color: COLORS.primary,
    fontWeight: '500' as const,
  },
  orderItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
  },
  orderItemTitle: {
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  orderItemSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  editIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  submitButton: {
    backgroundColor: COLORS.success,
    borderRadius: 4,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 12,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
    fontSize: 16,
    letterSpacing: 2,
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
    maxHeight: 400,
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500' as const,
  },
  editInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalFooter: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
    fontSize: 15,
  },
};
