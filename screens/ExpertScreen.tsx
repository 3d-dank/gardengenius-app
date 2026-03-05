import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY ?? '';
const CHAT_KEY = '@gardengenius_expert_chat';
const MAX_STORED_MESSAGES = 20;

const SYSTEM_PROMPT =
  'You are GardenGenius Expert, a professional lawn care advisor with 20 years of experience. ' +
  'Give specific, actionable advice. Be friendly but concise. ' +
  'Always ask for location/grass type if relevant to the question. ' +
  'Keep responses under 150 words unless the question requires more detail.';

const QUICK_QUESTIONS = [
  'Why is my grass yellow?',
  'When should I fertilize?',
  'How do I get rid of crabgrass?',
  'Best time to water?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function ExpertScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(CHAT_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch { /* silent */ }
  };

  const saveHistory = async (msgs: Message[]) => {
    try {
      const toSave = msgs.slice(-MAX_STORED_MESSAGES);
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(toSave));
    } catch { /* silent */ }
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      // Build API messages — include last 10 turns for context
      const contextMessages = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...contextMessages,
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantText: string = response.data.choices[0].message.content;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantText.trim(),
        timestamp: Date.now(),
      };

      const updated = [...newMessages, assistantMessage];
      setMessages(updated);
      await saveHistory(updated);
      scrollToBottom();
    } catch (e) {
      Alert.alert('Error', 'Could not reach the expert. Please try again.');
    }
    setLoading(false);
  };

  const clearChat = () => {
    Alert.alert('Clear Chat', 'Remove all conversation history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setMessages([]);
          await AsyncStorage.removeItem(CHAT_KEY);
        },
      },
    ]);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F0FFF4' }}>
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>💬 Ask the Expert</Text>
            <Text style={styles.headerSub}>20 years of lawn care knowledge</Text>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Quick Questions */}
        {messages.length === 0 && (
          <View style={styles.quickContainer}>
            <Text style={styles.quickLabel}>Quick questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
              {QUICK_QUESTIONS.map((q, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(q)}>
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>GardenGenius Expert</Text>
              <Text style={styles.emptyText}>
                Ask me anything about your lawn — grass types, fertilizing, weed control, watering schedules, and more.
              </Text>
            </View>
          )}

          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrapper,
                msg.role === 'user' ? styles.bubbleWrapperUser : styles.bubbleWrapperAssistant,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>🌿</Text>
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                  ]}
                >
                  {msg.content}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    msg.role === 'user' ? styles.bubbleTimeUser : styles.bubbleTimeAssistant,
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubbleWrapper, styles.bubbleWrapperAssistant]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>🌿</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.typingText}>Expert is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick questions shown inline when there are messages */}
        {messages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.inlineQuickBar}
            contentContainerStyle={styles.quickScroll}
          >
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(q)}>
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your lawn..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: '#A8D5C2',
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  quickContainer: {
    paddingTop: 12,
    paddingLeft: 16,
    paddingBottom: 4,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickScroll: {
    paddingRight: 16,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chipText: {
    fontSize: 13,
    color: '#1B4332',
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: '#1B4332',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextAssistant: {
    color: '#1F2937',
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
  },
  bubbleTimeAssistant: {
    color: '#9CA3AF',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  typingText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inlineQuickBar: {
    maxHeight: 50,
    paddingLeft: 16,
    paddingBottom: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
});
