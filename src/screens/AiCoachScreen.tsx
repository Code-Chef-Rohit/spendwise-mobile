import React, { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';

interface AiCoachScreenProps {
  onClose?: () => void;
}

export const AiCoachScreen: React.FC<AiCoachScreenProps> = ({ onClose }) => {
  const { chatMessages, sendChatMessage, budget, profile } = useApp();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setInputText('');
  };

  const samplePrompts = [
    'Can I afford ₹2,000 headphones?',
    'Where did I spend most?',
    'How much can I spend today?',
    'How can I save ₹5,000 this month?',
  ];

  // Helper to cleanly parse and render messages without raw asterisks
  const renderCleanMessage = (rawText: string, isUser: boolean) => {
    const lines = rawText.split('\n');

    return (
      <View style={styles.textWrapper}>
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <View key={lineIdx} style={styles.emptyLineSpacer} />;
          }

          // Split by bold (**text**) or italic (*text*)
          const parts = line.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g);

          return (
            <Text
              key={lineIdx}
              style={[
                styles.messageText,
                isUser ? styles.textUser : styles.textAssistant,
                lineIdx > 0 && { marginTop: 2 },
              ]}
            >
              {parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                  const boldContent = part.slice(2, -2);
                  return (
                    <Text
                      key={partIdx}
                      style={[
                        styles.messageText,
                        isUser ? styles.textUserBold : styles.textAssistantBold,
                      ]}
                    >
                      {boldContent}
                    </Text>
                  );
                }
                if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                  const italicContent = part.slice(1, -1);
                  return (
                    <Text
                      key={partIdx}
                      style={[
                        styles.messageText,
                        isUser ? styles.textUser : styles.textAssistantItalic,
                      ]}
                    >
                      {italicContent}
                    </Text>
                  );
                }
                // Strip any orphan asterisks
                const cleaned = part.replace(/\*/g, '');
                return cleaned;
              })}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachAvatarIcon}>🤖</Text>
          </View>
          <View>
            <Text style={styles.title}>SpendWise AI Coach</Text>
            <Text style={styles.statusText}>🟢 Real-time context enabled</Text>
          </View>
        </View>

        {/* Live context metrics badge & Close Button */}
        <View style={styles.headerRight}>
          <View style={styles.contextBadge}>
            <Text style={styles.contextText}>
              Safe: ₹{budget.todaySafeLimit}/d
            </Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages ScrollView */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
      >
        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {!isUser && (
                <View style={styles.botIconSmall}>
                  <Text style={styles.botEmoji}>🤖</Text>
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                {renderCleanMessage(msg.text, isUser)}

                {/* Highlight Card if present */}
                {msg.highlightCard && (
                  <View
                    style={[
                      styles.cardBadge,
                      msg.highlightCard.safe ? styles.cardSafe : styles.cardWarning,
                    ]}
                  >
                    <Text style={styles.cardTitle}>{msg.highlightCard.title}</Text>
                    <Text style={styles.cardDesc}>{msg.highlightCard.description}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Suggested Quick Prompt Chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {samplePrompts.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              onPress={() => handleSend(prompt)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Text Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Ask anything about your money..."
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coachAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  coachAvatarIcon: {
    fontSize: 20,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  contextBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contextText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  botIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  botEmoji: {
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textWrapper: {
    gap: 1,
  },
  emptyLineSpacer: {
    height: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textUserBold: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  textAssistant: {
    color: '#E2E8F0',
    fontWeight: '400',
  },
  textAssistantBold: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  textAssistantItalic: {
    color: '#CBD5E1',
    fontStyle: 'italic',
  },
  cardBadge: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
  },
  cardSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  cardWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardDesc: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
  },
  chipsWrapper: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
