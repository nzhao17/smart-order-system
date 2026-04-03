import { useWindowDimensions } from 'react-native';

// 断点定义
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // 判断设备类型
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isLargeScreen = width >= BREAKPOINTS.tablet;

  // 计算内容区域最大宽度
  const getMaxWidth = (type: 'narrow' | 'medium' | 'wide' = 'medium') => {
    const maxWidths = {
      narrow: 600,
      medium: 900,
      wide: 1200,
    };
    return isLargeScreen ? maxWidths[type] : width;
  };

  // 计算列数
  const getColumns = () => {
    if (width >= BREAKPOINTS.wide) return 4;
    if (width >= BREAKPOINTS.desktop) return 3;
    if (width >= BREAKPOINTS.tablet) return 2;
    return 1;
  };

  // 计算侧边栏宽度（用于左右分栏布局）
  const getSidebarWidth = () => {
    if (width >= BREAKPOINTS.wide) return 400;
    if (width >= BREAKPOINTS.desktop) return 350;
    if (width >= BREAKPOINTS.tablet) return 300;
    return width * 0.4;
  };

  // 通用间距
  const spacing = isLargeScreen ? 24 : 16;

  // 卡片宽度
  const cardWidth = isLargeScreen ? Math.min((width - spacing * 3) / 2, 400) : width - spacing * 2;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    getMaxWidth,
    getColumns,
    getSidebarWidth,
    spacing,
    cardWidth,
  };
}
