import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

// 配色方案 - 柔和卡片风
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
  success: '#00B894',
  surface: '#E8E8EB',
};

export default function HomeScreen() {
  const router = useSafeRouter();

  return (
    <Screen style={{ backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 120,
        }}
      >
        {/* 顶部标题区域 */}
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.textPrimary }}>
            智能录单系统
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 8 }}>
            旅行社订单管理，一键录入更高效
          </Text>
        </View>

        {/* 功能入口卡片 */}
        <View style={{ gap: 20 }}>
          {/* 订单录入入口 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/order-entry')}
          >
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 24,
                padding: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(108,99,255,0.12)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="add-circle" size={28} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}
                >
                  订单录入
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.textSecondary,
                    marginTop: 4,
                  }}
                >
                  支持文本粘贴、图片上传、Excel导入
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* 订单统计入口 */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/order-list')}
          >
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 24,
                padding: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(255,101,132,0.12)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="stats-chart" size={28} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: '700', color: COLORS.textPrimary }}
                >
                  订单统计
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: COLORS.textSecondary,
                    marginTop: 4,
                  }}
                >
                  查看订单列表、筛选、详情
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 功能说明 */}
        <View style={{ marginTop: 40 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: COLORS.textPrimary,
              marginBottom: 16,
            }}
          >
            功能特点
          </Text>
          <View style={{ gap: 12 }}>
            <FeatureItem
              icon="bulb"
              title="智能解析"
              description="自动识别文本、图片中的订单信息"
              color={COLORS.primary}
            />
            <FeatureItem
              icon="document-text"
              title="批量导入"
              description="支持Excel表格批量上传订单数据"
              color={COLORS.success}
            />
            <FeatureItem
              icon="share-social"
              title="共享录入"
              description="生成链接，多人协作录入订单"
              color={COLORS.secondary}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  color,
}: {
  icon: 'bulb' | 'document-text' | 'share-social';
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: color + '15',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textPrimary }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{description}</Text>
      </View>
    </View>
  );
}
