import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '@/components/Provider';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

export default function RootLayout() {
  return (
    <Provider>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: '智能录单系统' }} />
        <Stack.Screen name="order-entry" options={{ title: '订单录入' }} />
        <Stack.Screen name="order-list" options={{ title: '订单统计' }} />
        <Stack.Screen name="order-detail" options={{ title: '订单详情' }} />
      </Stack>
      <Toast />
    </Provider>
  );
}
