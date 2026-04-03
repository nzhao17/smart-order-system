import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useResponsive } from '@/hooks/useResponsive';

// 商务风格配色
const COLORS = {
  primary: '#002FA7',      // 克莱因蓝
  primaryDark: '#001F7A',  // 深蓝
  accent: '#C9A96E',       // 香槟金
  background: '#F8F6F2',   // 米金白
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',  // 深蓝黑
  textSecondary: '#6B7280',
  textLight: '#FFFFFF',
  border: 'rgba(201, 169, 110, 0.3)',
};

export default function HomeScreen() {
  const router = useSafeRouter();
  const { isLargeScreen, getMaxWidth } = useResponsive();

  const maxWidth = getMaxWidth('narrow');

  return (
    <Screen style={styles.container}>
      {/* 主内容区域 */}
      <View style={[styles.content, isLargeScreen && { maxWidth, alignSelf: 'center' }]}>
        {/* 标题区域 */}
        <View style={[styles.headerSection, isLargeScreen && { marginBottom: 48 }]}>
          <View style={styles.decorativeLine} />
          <Text style={[styles.title, isLargeScreen && { fontSize: 36 }]}>智能录单系统</Text>
          <View style={styles.decorativeLine} />
        </View>

        {/* 功能按钮区域 - PC端横向排列 */}
        <View style={[styles.buttonContainer, isLargeScreen && styles.buttonContainerPC]}>
          {/* 订单录入按钮 */}
          <TouchableOpacity
            style={[styles.primaryButton, isLargeScreen && styles.buttonPC]}
            activeOpacity={0.9}
            onPress={() => router.push('/order-entry')}
          >
            <View style={[styles.buttonIconWrapper, isLargeScreen && { width: 48, height: 48, borderRadius: 24 }]}>
              <Ionicons name="add-circle-outline" size={isLargeScreen ? 28 : 32} color={COLORS.textLight} />
            </View>
            <Text style={[styles.primaryButtonText, isLargeScreen && { fontSize: 16 }]}>订单录入</Text>
            <Text style={styles.buttonSubtext}>文本 · 图片 · Excel</Text>
          </TouchableOpacity>

          {/* 订单统计按钮 */}
          <TouchableOpacity
            style={[styles.secondaryButton, isLargeScreen && styles.buttonPC]}
            activeOpacity={0.9}
            onPress={() => router.push('/order-list')}
          >
            <View style={[styles.secondaryIconWrapper, isLargeScreen && { width: 48, height: 48, borderRadius: 24 }]}>
              <Ionicons name="stats-chart-outline" size={isLargeScreen ? 28 : 32} color={COLORS.primary} />
            </View>
            <Text style={[styles.secondaryButtonText, isLargeScreen && { fontSize: 16 }]}>订单统计</Text>
            <Text style={styles.secondarySubtext}>筛选 · 详情 · 导出</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 底部装饰 */}
      <View style={[styles.footer, isLargeScreen && { maxWidth, alignSelf: 'center' }]}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>北京心鑫相连科技有限公司 2026</Text>
        <View style={styles.footerLine} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  decorativeLine: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  buttonContainerPC: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonPC: {
    minWidth: 200,
    paddingVertical: 24,
    paddingHorizontal: 40,
    flex: 1,
    maxWidth: 280,
  },
  buttonIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 6,
    marginBottom: 4,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 2,
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderRadius: 4,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  secondaryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,47,167,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 6,
    marginBottom: 4,
  },
  secondarySubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    paddingHorizontal: 32,
    width: '100%',
  },
  footerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: COLORS.accent,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
    marginHorizontal: 16,
  },
});
