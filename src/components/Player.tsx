import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import PlayerService, { PlayerStatus } from '../services/PlayerService';
import * as FileSystem from 'expo-file-system';
import { DownloadedItem } from '../services/DownloadService';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

// URL de audio de muestra para reproducción real
const SAMPLE_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

// Referencia global al objeto de sonido para evitar múltiples instancias
let soundInstance: Audio.Sound | null = null;

// Referencia para control global del reproductor
let isPlayerActive = true;

// Variable global para mantener track de la canción que se está reproduciendo
let currentPlayingFilePath: string | null = null;

// Convertir milisegundos a formato mm:ss
const formatTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Cerrar completamente el reproductor (tanto mini como completo)
const closePlayerCompletely = async () => {
  try {
    // Detener y descargar el audio
    if (soundInstance) {
      await soundInstance.stopAsync().catch(() => {});
      await soundInstance.unloadAsync().catch(() => {});
      soundInstance = null;
    }
    
    // Actualizar estado global
    isPlayerActive = false; // Desactivar el reproductor completamente
    currentPlayingFilePath = null; // Limpiar la referencia al archivo actual
    
    // Actualizar el estado del servicio
    await PlayerService.cleanup();
    
    console.log('Reproductor cerrado completamente');
  } catch (error) {
    console.error('Error al cerrar reproductor:', error);
  }
};

// Componente de mini reproductor que se muestra en la parte inferior
const MiniPlayer: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerStatus>(PlayerService.getState());
  const [playerVisible, setPlayerVisible] = useState(false);

  useEffect(() => {
    // Suscribirse a los cambios en el estado del reproductor
    const unsubscribe = PlayerService.addListener((newState) => {
      setPlayerState(newState);
      
      // Si hay una canción activa, asegurarse de que el reproductor esté activo
      if (newState.currentSong && newState.currentSong.filePath) {
        isPlayerActive = true;
        currentPlayingFilePath = newState.currentSong.filePath;
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Si no hay canción actual o el reproductor está desactivado, no mostrar nada
  if (!playerState.currentSong || !isPlayerActive) {
    return null;
  }

  const handlePlayPause = async () => {
    try {
      // Usar el servicio de reproductor global
      await PlayerService.togglePlay();
    } catch (error) {
      console.error('Error al controlar la reproducción:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  return (
    <>
      <View style={styles.miniPlayerContainer}>
        <TouchableOpacity 
          style={styles.miniPlayerContent}
          onPress={() => setPlayerVisible(true)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: playerState.currentSong.thumbnail }}
            style={styles.miniPlayerImage}
          />
          <View style={styles.miniPlayerInfo}>
            <Text style={styles.miniPlayerTitle} numberOfLines={1}>
              {playerState.currentSong.title}
            </Text>
            <Text style={styles.miniPlayerArtist} numberOfLines={1}>
              {playerState.currentSong.artist}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.miniPlayerButton}
            onPress={(e) => {
              e.stopPropagation(); // Evitar que se abra el reproductor completo
              handlePlayPause();
            }}
          >
            <Ionicons
              name={playerState.isPlaying ? 'pause' : 'play'}
              size={24}
              color="#1DB954"
            />
          </TouchableOpacity>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.miniPlayerCloseButton}
          onPress={closePlayerCompletely}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Player 
        visible={playerVisible} 
        onClose={() => setPlayerVisible(false)} 
      />
    </>
  );
};

// Componente de reproductor completo
const Player: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const [playerState, setPlayerState] = useState<PlayerStatus>(PlayerService.getState());
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);

  useEffect(() => {
    // Suscribirse a los cambios en el estado del reproductor
    const unsubscribe = PlayerService.addListener(newState => {
      setPlayerState(newState);
      
      // Sincronizar la instancia global con la del servicio
      if (newState.sound && !soundInstance) {
        soundInstance = newState.sound;
      }
      
      // Si no estamos buscando, actualizar el valor del slider
      if (!isSeeking && newState.duration > 0) {
        setSliderValue(newState.position / newState.duration);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isSeeking]);

  // Efecto para manejar el cierre del reproductor
  useEffect(() => {
    if (!visible && playerState.isPlaying) {
      // Si el reproductor se cierra mientras está reproduciendo,
      // no lo pausamos para permitir que siga sonando en segundo plano
      console.log('Reproductor minimizado pero continúa reproduciendo');
    }
  }, [visible]);

  // Efecto para cerrar el modal si no hay canción
  useEffect(() => {
    if (visible && !playerState.currentSong) {
      setShouldClose(true);
    } else {
      setShouldClose(false);
    }
  }, [visible, playerState.currentSong]);

  // Efecto para ejecutar el cierre si shouldClose es true
  useEffect(() => {
    if (shouldClose) {
      onClose();
    }
  }, [shouldClose, onClose]);

  // Si no hay canción actual, no mostrar el reproductor
  if (!playerState.currentSong) {
    return null;
  }

  // Manejar cambios en el slider
  const onSlidingStart = () => {
    setIsSeeking(true);
  };

  const onSlidingComplete = (value: number) => {
    if (playerState.duration > 0) {
      const position = value * playerState.duration;
      PlayerService.seekTo(position);
    }
    setIsSeeking(false);
  };

  // Reproducir/Pausar
  const togglePlay = async () => {
    try {
      // Usar directamente el servicio global de reproducción
      await PlayerService.togglePlay();
    } catch (error) {
      console.error('Error al controlar la reproducción:', error);
      setIsLoading(false);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  // Función para cambiar a la canción anterior
  const playPrevious = async () => {
    try {
      await PlayerService.playPrevious();
    } catch (error) {
      console.error('Error al reproducir canción anterior:', error);
    }
  };

  // Función para cambiar a la siguiente canción
  const playNext = async () => {
    try {
      await PlayerService.playNext();
    } catch (error) {
      console.error('Error al reproducir siguiente canción:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        // Esta función se llama cuando se presiona el botón de retroceso en Android
        // o cuando se desliza hacia abajo en iOS
        onClose();
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.playerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="chevron-down" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REPRODUCIENDO</Text>
          <TouchableOpacity
            onPress={closePlayerCompletely}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.coverContainer}>
          <Image
            source={{ uri: playerState.currentSong.thumbnail || 'https://via.placeholder.com/300' }}
            style={styles.cover}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{playerState.currentSong.title}</Text>
          <Text style={styles.artist}>{playerState.currentSong.artist}</Text>
        </View>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sliderValue}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#535353"
            thumbTintColor="#1DB954"
            onSlidingStart={onSlidingStart}
            onSlidingComplete={onSlidingComplete}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(playerState.position)}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(playerState.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          {/* Botones de control simplificados */}
          <TouchableOpacity
            style={styles.controlButton}
          >
            <Ionicons
              name="shuffle"
              size={24}
              color="#b3b3b3"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={playPrevious}
          >
            <Ionicons name="play-skip-back" size={36} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButtonContainer}
            onPress={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" size="large" />
            ) : (
              <Ionicons
                name={playerState.isPlaying ? 'pause' : 'play'}
                size={32}
                color="#000"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={playNext}
          >
            <Ionicons name="play-skip-forward" size={36} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
          >
            <Ionicons
              name="repeat"
              size={24}
              color="#b3b3b3"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Limpieza del reproductor cuando la app se cierra o se desmonta
const cleanupPlayer = async () => {
  if (soundInstance) {
    await soundInstance.unloadAsync();
    soundInstance = null;
  }
  
  // Asegurar limpieza mediante el servicio de reproductor
  await PlayerService.cleanup();
};

// Estilos actualizados al estilo Spotify
const styles = StyleSheet.create({
  // Mini Player
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 60, // Posicionarlo encima del menú de navegación
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#282828',
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    zIndex: 999, // Asegurar que aparezca por encima de otros elementos
  },
  miniPlayerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  miniPlayerImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  miniPlayerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  miniPlayerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  miniPlayerArtist: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  miniPlayerButton: {
    padding: 8,
  },
  miniPlayerCloseButton: {
    padding: 8,
    backgroundColor: '#444',
    height: '100%',
    justifyContent: 'center',
    width: 40,
    alignItems: 'center',
  },
  
  // Player Completo
  playerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  coverContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  cover: {
    width: width - 80,
    height: width - 80,
    borderRadius: 8,
  },
  infoContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlButton: {
    padding: 10,
  },
  playButtonContainer: {
    backgroundColor: '#1DB954',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 10,
  },
  // ... puedes añadir más estilos si los necesitas
});

export { MiniPlayer, Player, cleanupPlayer, closePlayerCompletely };
export default Player; 