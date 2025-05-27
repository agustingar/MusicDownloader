import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AutoCloseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'loading' | 'progress';
  autoCloseDelay?: number; // en milisegundos
  progress?: number; // 0-1 para barras de progreso
  showCloseButton?: boolean;
  onAction?: () => void;
  actionText?: string;
}

const AutoCloseModal: React.FC<AutoCloseModalProps> = React.memo(({
  visible,
  onClose,
  title,
  message,
  type,
  autoCloseDelay = 3000,
  progress = 0,
  showCloseButton = true,
  onAction,
  actionText
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [dotsAnim] = useState(new Animated.Value(0));
  const dotsAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    // Limpiar timers y animaciones
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    
    if (dotsAnimationRef.current) {
      dotsAnimationRef.current.stop();
      dotsAnimationRef.current = null;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [fadeAnim, onClose]);

  useEffect(() => {
    if (visible) {
      // Animar entrada
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-cerrar solo para tipos específicos
      if ((type === 'success' || type === 'info') && autoCloseDelay > 0) {
        autoCloseTimerRef.current = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }
    } else {
      // Limpiar al ocultar
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      
      if (dotsAnimationRef.current) {
        dotsAnimationRef.current.stop();
        dotsAnimationRef.current = null;
      }
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      if (dotsAnimationRef.current) {
        dotsAnimationRef.current.stop();
      }
    };
  }, [visible, type, autoCloseDelay, handleClose]);

  useEffect(() => {
    if (type === 'progress' && visible) {
      // Animar barra de progreso
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Animar puntos de progreso solo si no hay una animación en curso
      if (!dotsAnimationRef.current) {
        const animateDots = () => {
          dotsAnimationRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(dotsAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(dotsAnim, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          );
          dotsAnimationRef.current.start();
        };
        
        animateDots();
      }
    } else {
      // Detener animación de puntos si no es progreso
      if (dotsAnimationRef.current) {
        dotsAnimationRef.current.stop();
        dotsAnimationRef.current = null;
      }
    }
  }, [progress, type, visible]);

  const getIconName = useCallback(() => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'loading':
      case 'progress':
        return 'download';
      default:
        return 'information-circle';
    }
  }, [type]);

  const getIconColor = useCallback(() => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'loading':
      case 'progress':
        return '#1DB954';
      default:
        return '#FF9800';
    }
  }, [type]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }
          ]}
        >
          <View style={styles.header}>
            <Ionicons 
              name={getIconName()} 
              size={32} 
              color={getIconColor()} 
            />
            {showCloseButton && type !== 'loading' && type !== 'progress' && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {type === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1DB954" />
            </View>
          )}

          {type === 'progress' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressPercentage}>
                  {Math.round(progress * 100)}%
                </Text>
                <Animated.View 
                  style={[
                    styles.progressDots,
                    { opacity: dotsAnim }
                  ]}
                >
                  <Text style={styles.progressDot}>•</Text>
                  <Text style={styles.progressDot}>•</Text>
                  <Text style={styles.progressDot}>•</Text>
                </Animated.View>
              </View>
            </View>
          )}

          {onAction && actionText && type !== 'loading' && type !== 'progress' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onAction}
            >
              <Text style={styles.actionButtonText}>{actionText}</Text>
            </TouchableOpacity>
          )}

          {type === 'success' && autoCloseDelay > 0 && (
            <Text style={styles.autoCloseText}>
              Se cerrará automáticamente en {Math.ceil(autoCloseDelay / 1000)}s
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#b3b3b3',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  loadingContainer: {
    marginVertical: 20,
  },
  progressContainer: {
    width: '100%',
    marginVertical: 15,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 6,
    shadowColor: '#1DB954',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#1DB954',
    fontWeight: 'bold',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    fontSize: 16,
    color: '#1DB954',
    marginHorizontal: 1,
    opacity: 0.7,
  },
  actionButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
    shadowColor: '#1DB954',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  autoCloseText: {
    fontSize: 12,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
  },
});

export default AutoCloseModal; 