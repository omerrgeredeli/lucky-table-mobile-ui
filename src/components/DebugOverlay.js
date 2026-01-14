import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

// Global log store
let logStore = [];
let listeners = [];

export const addLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp,
    message,
    type, // 'info', 'success', 'error', 'warning'
  };
  
  logStore.push(logEntry);
  
  // Son 100 log'u tut
  if (logStore.length > 100) {
    logStore = logStore.slice(-100);
  }
  
  // Tüm listener'lara bildir
  listeners.forEach(listener => listener([...logStore]));
  
  // Console'a da yaz
  console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
};

export const subscribeToLogs = (callback) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

const DebugOverlay = ({ visible, onClose }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (visible) {
      // Mevcut logları yükle
      setLogs([...logStore]);
      
      // Yeni logları dinle
      const unsubscribe = subscribeToLogs((newLogs) => {
        setLogs([...newLogs]);
      });
      
      return unsubscribe;
    }
  }, [visible]);

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return '#2ECC71';
      case 'error':
        return '#E74C3C';
      case 'warning':
        return '#F39C12';
      default:
        return '#3498DB';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Debug Logs</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.logContainer}
          contentContainerStyle={styles.logContent}
        >
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>Henüz log yok</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <View 
                    style={[
                      styles.logTypeBadge,
                      { backgroundColor: getLogColor(log.type) }
                    ]}
                  >
                    <Text style={styles.logTypeText}>{log.type.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))
          )}
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={() => {
              logStore = [];
              setLogs([]);
            }}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>Temizle</Text>
          </TouchableOpacity>
          <Text style={styles.countText}>{logs.length} log</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  logContainer: {
    flex: 1,
  },
  logContent: {
    padding: spacing.sm,
  },
  logItem: {
    backgroundColor: colors.surface,
    borderRadius: spacing.xs,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logTimestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  logTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logTypeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  logMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    padding: spacing.sm,
    backgroundColor: colors.error || '#E74C3C',
    borderRadius: spacing.xs,
  },
  clearText: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  countText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default DebugOverlay;
