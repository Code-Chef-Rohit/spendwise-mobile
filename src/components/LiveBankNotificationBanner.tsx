import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface LiveBankAlert {
  id: string;
  merchant: string;
  amount: number;
  bankName: string;
  remainingDailyLimit: number;
  timestamp: string;
}

interface LiveBankNotificationBannerProps {
  alert: LiveBankAlert;
  onDismiss: () => void;
}

export const LiveBankNotificationBanner: React.FC<LiveBankNotificationBannerProps> = ({
  alert,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide down smoothly
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 4.5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, [alert]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔔</Text>
          </View>
        </View>

        <View style={styles.contentCol}>
          <View style={styles.headerRow}>
            <View style={styles.liveTag}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveTagText}>LIVE BANK FEED</Text>
            </View>
            <Text style={styles.bankName}>{alert.bankName}</Text>
            <Text style={styles.timeText}>{alert.timestamp}</Text>
          </View>

          <Text style={styles.spendTitle}>
            ₹{alert.amount.toLocaleString()} spent at{' '}
            <Text style={styles.merchantHighlight}>{alert.merchant}</Text>
          </Text>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Remaining safe limit today:</Text>
            <Text
              style={[
                styles.calcValue,
                { color: alert.remainingDailyLimit >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              ₹{Math.max(0, alert.remainingDailyLimit).toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  leftCol: {
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  iconEmoji: {
    fontSize: 20,
  },
  contentCol: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  liveTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  bankName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    color: '#64748B',
    fontSize: 10,
    marginLeft: 'auto',
  },
  spendTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  merchantHighlight: {
    color: '#38BDF8',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calcLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  calcValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
