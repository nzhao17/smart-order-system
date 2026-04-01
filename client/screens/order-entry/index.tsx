import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/Screen';
import { createFormDataFile } from '@/utils';

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

type InputMode = 'text' | 'image' | 'excel';

export default function OrderEntryScreen() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedOrders, setParsedOrders] = useState<any[]>([]);

  // 请求相册权限
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能选择图片');
      return false;
    }
    return true;
  };

  // 选择图片
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

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

  // 拍照
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
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
    } catch (err) {
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
      Alert.alert('提示', '请选择或拍摄图片');
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
          { text: '继续录入', onPress: resetForm },
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

  const resetForm = () => {
    setTextInput('');
    setSelectedImage(null);
    setSelectedFile(null);
    setParsedOrders([]);
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
          订单录入
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 8, marginBottom: 24 }}>
          选择录入方式，智能识别订单信息
        </Text>

        {/* 输入方式选择 */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <ModeButton
            icon="text"
            label="文本粘贴"
            active={inputMode === 'text'}
            onPress={() => {
              setInputMode('text');
              setSelectedImage(null);
              setSelectedFile(null);
            }}
          />
          <ModeButton
            icon="image"
            label="图片上传"
            active={inputMode === 'image'}
            onPress={() => {
              setInputMode('image');
              setTextInput('');
              setSelectedFile(null);
            }}
          />
          <ModeButton
            icon="document-text"
            label="Excel导入"
            active={inputMode === 'excel'}
            onPress={() => {
              setInputMode('excel');
              setTextInput('');
              setSelectedImage(null);
            }}
          />
        </View>

        {/* 输入区域 */}
        <View
          style={{
            shadowColor: COLORS.shadowDark,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.7,
            shadowRadius: 8,
            borderRadius: 24,
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
            }}
          >
            {inputMode === 'text' && (
              <>
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 }}
                >
                  粘贴订单文本
                </Text>
                <View
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.6)',
                    minHeight: 150,
                  }}
                >
                  <TextInput
                    style={{ fontSize: 15, color: COLORS.textPrimary, textAlignVertical: 'top' }}
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
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 }}
                >
                  选择图片
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(108,99,255,0.12)',
                      borderRadius: 16,
                      paddingVertical: 16,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onPress={pickImage}
                  >
                    <Ionicons name="images" size={18} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>相册选择</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,101,132,0.12)',
                      borderRadius: 16,
                      paddingVertical: 16,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={18} color={COLORS.secondary} />
                    <Text style={{ color: COLORS.secondary, fontWeight: '600' }}>拍照</Text>
                  </TouchableOpacity>
                </View>
                {selectedImage && (
                  <View
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      padding: 16,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <Text style={{ color: COLORS.success, marginTop: 8, fontWeight: '600' }}>
                      已选择图片
                    </Text>
                  </View>
                )}
              </>
            )}

            {inputMode === 'excel' && (
              <>
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 }}
                >
                  选择Excel文件
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(0,184,148,0.12)',
                    borderRadius: 16,
                    paddingVertical: 20,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onPress={pickDocument}
                >
                  <Ionicons name="cloud-upload" size={20} color={COLORS.success} />
                  <Text style={{ color: COLORS.success, fontWeight: '600', fontSize: 16 }}>
                    选择Excel文件
                  </Text>
                </TouchableOpacity>
                {selectedFile && (
                  <View
                    style={{
                      backgroundColor: COLORS.surface,
                      borderRadius: 16,
                      padding: 16,
                      alignItems: 'center',
                      marginTop: 12,
                    }}
                  >
                    <Ionicons name="document-text" size={24} color={COLORS.success} />
                    <Text style={{ color: COLORS.success, marginTop: 8, fontWeight: '600' }}>
                      已选择Excel文件
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* 解析按钮 */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 999,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 20,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleParse}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="bulb" size={18} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>智能解析</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 解析结果 */}
        {parsedOrders.length > 0 && (
          <View
            style={{
              shadowColor: COLORS.shadowDark,
              shadowOffset: { width: 6, height: 6 },
              shadowOpacity: 0.7,
              shadowRadius: 8,
              borderRadius: 24,
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
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textPrimary }}>
                  识别结果 ({parsedOrders.length}条)
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>清空</Text>
                </TouchableOpacity>
              </View>

              {parsedOrders.map((order, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>
                    {order.guest_name || '未命名'} - {order.group_no || '无团号'}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                    {order.order_date} | {order.station} | {order.pickup_type} | {order.train_no} {order.train_time}
                  </Text>
                </View>
              ))}

              {/* 提交按钮 */}
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.success,
                  borderRadius: 999,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 16,
                  opacity: loading ? 0.7 : 1,
                }}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                      确认录入
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function ModeButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: active ? COLORS.primary : COLORS.surface,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 8,
      }}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? '#FFF' : COLORS.textSecondary}
      />
      <Text
        style={{
          color: active ? '#FFF' : COLORS.textSecondary,
          fontWeight: '600',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
