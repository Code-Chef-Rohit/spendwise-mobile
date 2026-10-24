import React, { useState, useEffect, useRef } from 'react';
import {
  BackHandler,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AiCoachScreen } from './src/screens/AiCoachScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LiveBankNotificationBanner } from './src/components/LiveBankNotificationBanner';

type TabType = 'today' | 'expenses' | 'analytics' | 'settings';

function MainNavigator() {
  const {
    isLoadingApp,
    setIsLoadingApp,
    profile,
    calendarModalVisible,
    setCalendarModalVisible,
    nightReportVisible,
    setNightReportVisible,
    pendingLargeExpense,
    setPendingLargeExpense,
    addExpenseModalVisible,
    setAddExpenseModalVisible,
    bankSyncModalVisible,
    setBankSyncModalVisible,
    liveBankAlert,
    setLiveBankAlert,
  } = useApp();

  // Floating AI Coach Modal state
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Initial scope for ExpensesScreen when navigating from Today's Activity
  const [expensesInitialScope, setExpensesInitialScope] = useState<'today' | 'month'>('today');

  // Press back again to close state & timer ref
  const [exitPopupVisible, setExitPopupVisible] = useState(false);
  const lastBackPressRef = useRef<number>(0);
  const exitTimerRef = useRef<any>(null);

  // Clean Navigation History Stack
  const [navHistory, setNavHistory] = useState<TabType[]>(['today']);
  const activeTab = navHistory[navHistory.length - 1] || 'today';

  const insets = useSafeAreaInsets();

  const navigateTo = (tab: TabType) => {
    if (tab === activeTab) return;
    if (exitPopupVisible) setExitPopupVisible(false);

    // If navigating to home ('today'), always reset history directly to ['today']
    if (tab === 'today') {
      setNavHistory(['today']);
      return;
    }

    // If opening settings from another sub-screen, remember parent
    if (tab === 'settings' && activeTab !== 'today') {
      setNavHistory(['today', activeTab, 'settings']);
      return;
    }

    // Switching to any main tab: clean anchor to ['today', tab]
    setNavHistory(['today', tab]);
  };

  const handleBack = () => {
    // 0. If AI Coach modal is open, close it first
    if (aiModalVisible) {
      setAiModalVisible(false);
      return true;
    }
    // 1. If any full-screen modal / dialog is currently active, close it first
    if (calendarModalVisible) {
      setCalendarModalVisible(false);
      return true;
    }
    if (addExpenseModalVisible) {
      setAddExpenseModalVisible(false);
      return true;
    }
    if (bankSyncModalVisible) {
      setBankSyncModalVisible(false);
      return true;
    }
    if (nightReportVisible) {
      setNightReportVisible(false);
      return true;
    }
    if (pendingLargeExpense) {
      setPendingLargeExpense(null);
      return true;
    }

    // 2. If we are on ANY other page than 'today' (expenses, analytics, settings):
    // Navigate straight back to 'today' (Home) or pop sub-screen
    if (activeTab !== 'today') {
      if (exitPopupVisible) setExitPopupVisible(false);
      if (navHistory.length > 2) {
        setNavHistory((prev) => prev.slice(0, prev.length - 1));
      } else {
        setNavHistory(['today']);
      }
      return true; // Handled internally
    }

    // 3. We are on the root Home page ('today') with no modals open!
    // Double-press back within 2.5 seconds to exit SpendWise
    const now = Date.now();
    if (exitPopupVisible && now - lastBackPressRef.current < 2500) {
      // Second back press within 2.5 seconds -> exit app!
      if (Platform.OS === 'android') {
        BackHandler.exitApp();
      }
      return true;
    }

    // First back press on Home -> show popup & record time
    lastBackPressRef.current = now;
    setExitPopupVisible(true);

    if (Platform.OS === 'android' && ToastAndroid) {
      ToastAndroid.show('Press back again to close SpendWise', ToastAndroid.SHORT);
    }

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    exitTimerRef.current = setTimeout(() => {
      setExitPopupVisible(false);
    }, 2500);

    return true; // Intercepted: do not exit on first press
  };

  // Register Android Hardware Back Button listener
  useEffect(() => {
    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBack
    );
    return () => backSubscription.remove();
  }, [
    navHistory,
    activeTab,
    exitPopupVisible,
    aiModalVisible,
    calendarModalVisible,
    addExpenseModalVisible,
    bankSyncModalVisible,
    nightReportVisible,
    pendingLargeExpense,
  ]);

  // Bulletproof bezel & status bar inset calculation
  const topInset = Platform.select({
    android: Math.max(insets.top, RNStatusBar.currentHeight || 28),
    ios: Math.max(insets.top, 20),
    default: insets.top || 16,
  });

  const bottomInset = Platform.select({
    ios: Math.max(insets.bottom, 20),
    android: Math.max(insets.bottom, 10),
    default: 10,
  });

  // If the app is initializing, render the luxury Loading / Splash Screen
  if (isLoadingApp) {
    return (
      <View style={[styles.rootContainer, { paddingTop: topInset }]}>
        <StatusBar style="light" />
        <LoadingScreen onFinish={() => setIsLoadingApp(false)} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'today':
        return (
          <DashboardScreen
            onNavigateToExpenses={() => {
              setExpensesInitialScope('today');
              navigateTo('expenses');
            }}
            onNavigateToCoach={() => setAiModalVisible(true)}
            onOpenSettings={() => navigateTo('settings')}
          />
        );
      case 'expenses':
        return (
          <ExpensesScreen
            onBack={handleBack}
            initialScope={expensesInitialScope}
          />
        );
      case 'analytics':
        return <AnalyticsScreen onBack={handleBack} />;
      case 'settings':
        return <SettingsScreen onBack={handleBack} />;
      default:
        return (
          <DashboardScreen
            onNavigateToExpenses={() => {
              setExpensesInitialScope('today');
              navigateTo('expenses');
            }}
            onNavigateToCoach={() => setAiModalVisible(true)}
            onOpenSettings={() => navigateTo('settings')}
          />
        );
    }
  };

  const navItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: '🏠' },
    { id: 'expenses', label: 'Expenses', icon: '💳' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <View style={[styles.rootContainer, { paddingTop: topInset }]}>
      <StatusBar style="light" />

      {/* Live Bank Notification Dropdown */}
      {liveBankAlert && (
        <LiveBankNotificationBanner
          alert={liveBankAlert}
          onDismiss={() => setLiveBankAlert(null)}
        />
      )}

      {/* Screen Body */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Floating AI Coach Button (FAB) */}
      <TouchableOpacity
        style={[styles.floatingAiBtn, { bottom: bottomInset + 66 }]}
        onPress={() => setAiModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.floatingAiInner}>
          <Text style={styles.floatingAiIcon}>🤖</Text>
          <View style={styles.floatingPulseDot} />
        </View>
      </TouchableOpacity>

      {/* AI Coach Slide-up Modal */}
      <Modal
        visible={aiModalVisible}
        animationType="slide"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={[styles.rootContainer, { paddingTop: topInset }]}>
          <StatusBar style="light" />
          <AiCoachScreen onClose={() => setAiModalVisible(false)} />
        </View>
      </Modal>

      {/* Press Back Again To Close Popup */}
      {exitPopupVisible && (
        <View style={[styles.exitPopupWrapper, { bottom: bottomInset + 70 }]}>
          <View style={styles.exitPopupCard}>
            <View style={styles.exitPopupLeft}>
              <View style={styles.exitIconCircle}>
                <Text style={styles.exitIconEmoji}>🚪</Text>
              </View>
              <View style={styles.exitTextCol}>
                <Text style={styles.exitPopupTitle}>Press back again to close</Text>
                <Text style={styles.exitPopupSubtitle}>
                  Tap back within 2s to exit SpendWise
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.exitNowBtn}
              onPress={() => {
                if (Platform.OS === 'android') {
                  BackHandler.exitApp();
                } else {
                  setExitPopupVisible(false);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.exitNowText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Tab Bar with safe bottom inset */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.tabItem}
              onPress={() => {
                if (item.id === 'expenses') {
                  setExpensesInitialScope('month');
                }
                navigateTo(item.id);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconCircle, isActive && styles.tabIconCircleActive]}>
                <Text style={styles.tabIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0B0F19',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIconCircle: {
    width: 38,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconCircleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  floatingAiBtn: {
    position: 'absolute',
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3730A3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  floatingAiInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingAiIcon: {
    fontSize: 26,
  },
  floatingPulseDot: {
    position: 'absolute',
    top: 3,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#3730A3',
  },
  exitPopupWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  exitPopupCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  exitPopupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exitIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitIconEmoji: {
    fontSize: 18,
  },
  exitTextCol: {
    flex: 1,
  },
  exitPopupTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  exitPopupSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  exitNowBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  exitNowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
