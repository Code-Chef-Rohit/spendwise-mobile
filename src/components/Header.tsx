import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { profile } = useApp();

  return (
    <View style={styles.container}>
      {/* Tapping on the Profile (Avatar or Name) opens Profile & Settings */}
      <TouchableOpacity
        style={styles.profileTouchArea}
        onPress={onOpenSettings}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.appName}>SPENDWISE</Text>
          <View style={styles.userRow}>
            <Text style={styles.welcomeText}>
              Hi, <Text style={styles.userName}>{profile.name}</Text>
            </Text>
            <Text style={styles.profileCaret}>›</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.right}>
        {/* Streak Pill */}
        <View style={styles.streakBadge}>
          <Text style={styles.streakFlame}>🔥</Text>
          <Text style={styles.streakNumber}>{profile.streakDays}</Text>
          <Text style={styles.streakDays}>DAYS</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#0B0F19',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0B0F19',
  },
  greetingContainer: {
    justifyContent: 'center',
    gap: 1,
  },
  appName: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  welcomeText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  profileCaret: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 4,
  },
  streakFlame: {
    fontSize: 13,
  },
  streakNumber: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '900',
  },
  streakDays: {
    color: '#FCA5A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
