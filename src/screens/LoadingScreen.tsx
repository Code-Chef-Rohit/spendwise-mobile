import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface LoadingScreenProps {
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [statusIndex, setStatusIndex] = useState(0);

  const statusMessages = [
    'Initializing SpendWise dynamic engine...',
    'Calculating safe daily spending limits...',
    'Analyzing cash flow & savings targets...',
    'Launching your personal money coach...',
  ];

  useEffect(() => {
    // Pulse animation for the central emblem
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ambient glow flicker
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fill progress bar from 0 to 100% over 1800ms
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(() => {
      if (onFinish) {
        setTimeout(onFinish, 200);
      }
    });

    // Step through status messages
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev < statusMessages.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Ambient background glow */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowAnim }]} />

      {/* Center Branding & Logo */}
      <View style={styles.centerBox}>
        <Animated.View style={[styles.emblemContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.emblemOuter}>
            <View style={styles.emblemInner}>
              <Text style={styles.emblemEmoji}>💎</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.brandTitle}>SPENDWISE</Text>
        <Text style={styles.brandSubtitle}>KNOW YOUR LIMIT • SPEND WITH CONFIDENCE</Text>
      </View>

      {/* Bottom Loading Progress Container */}
      <View style={styles.bottomBox}>
        {/* Progress Track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Dynamic Status Text */}
        <View style={styles.statusRow}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>{statusMessages[statusIndex]}</Text>
        </View>

        {/* Security badge at very bottom */}
        <View style={styles.securitySeal}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>AES-256 On-Device Financial Intelligence</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A12',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: '25%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemContainer: {
    marginBottom: 24,
  },
  emblemOuter: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  emblemInner: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emblemEmoji: {
    fontSize: 34,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  brandSubtitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  bottomBox: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  securityIcon: {
    fontSize: 11,
  },
  securityText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
