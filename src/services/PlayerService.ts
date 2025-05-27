import { Audio } from 'expo-av';
import { DownloadedItem } from './DownloadService';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos para el reproductor
export type PlayerStatus = {
  isPlaying: boolean;
  currentSong: any | null;
  currentSongIndex: number;
  position: number;
  duration: number;
  sound: Audio.Sound | null;
};

// Listeners para eventos del reproductor
type PlayerListener = (state: PlayerStatus) => void;

class PlayerService {
  // Estado del reproductor
  private state: PlayerStatus = {
    isPlaying: false,
    currentSong: null,
    currentSongIndex: -1,
    position: 0,
    duration: 0,
    sound: null,
  };
  
  // Lista de reproducción actual
  private playlist: DownloadedItem[] = [];
  
  // Lista de funciones listener para notificar cambios
  private listeners: PlayerListener[] = [];
  
  // Singleton
  private static instance: PlayerService;
  public static getInstance(): PlayerService {
    if (!PlayerService.instance) {
      PlayerService.instance = new PlayerService();
    }
    return PlayerService.instance;
  }
  
  // Constructor
  constructor() {
    this.initializeAudio();
  }
  
  // Inicializar el servicio de reproducción
  async initializeAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,     // Mantener activo en segundo plano
        interruptionModeIOS: 1,            // 1 = Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS
        playsInSilentModeIOS: true,        // Reproducir incluso en modo silencioso
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,        // 1 = Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
        playThroughEarpieceAndroid: false,
      });
      
      // Asegurar que la reproducción en segundo plano esté habilitada
      await Audio.setIsEnabledAsync(true);
      
      console.log('Audio inicializado correctamente para reproducción en segundo plano');
    } catch (error) {
      console.error('Error al inicializar audio:', error);
    }
  }
  
  // Añadir listener para cambios de estado
  addListener(callback: PlayerListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  // Notificar a todos los listeners
  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
  
  // Actualizar estado
  private updateState(newState: Partial<PlayerStatus>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }
  
  // Obtener estado actual
  getState(): PlayerStatus {
    return { ...this.state };
  }
  
  // Cargar canción
  async loadSong(song: DownloadedItem): Promise<void> {
    try {
      // Limpiar reproductor anterior
      await this.unloadCurrentSong();
      
      // Verificar que el archivo exista
      const fileInfo = await FileSystem.getInfoAsync(song.filePath);
      if (!fileInfo.exists) {
        throw new Error(`El archivo no existe: ${song.filePath}`);
      }
      
      // Crear un nuevo objeto de sonido
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.filePath },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 1000,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );
      
      // Actualizar estado
      this.updateState({
        sound,
        currentSong: song,
        currentSongIndex: this.playlist.findIndex(s => s.id === song.id),
        duration: song.duration || 0,
        position: 0,
      });
      
      // Configurar información para la pantalla de bloqueo
      this.setupLockScreenControls(song);
      
      console.log(`Canción cargada: ${song.title}`);
    } catch (error) {
      console.error('Error al cargar canción:', error);
      Alert.alert('Error', 'No se pudo cargar el archivo de audio.');
    }
  }
  
  // Configurar controles para la pantalla de bloqueo
  private async setupLockScreenControls(song: DownloadedItem) {
    // Asegurar que tenemos acceso a los controles de audio en segundo plano
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true
    });
  }
  
  // Método para cargar y reproducir una canción inmediatamente
  async loadAndPlaySong(song: DownloadedItem): Promise<void> {
    try {
      // Cargar la canción
      await this.loadSong(song);
      
      // Reproducir inmediatamente
      await this.play();
      
      console.log(`Reproduciendo: ${song.title}`);
    } catch (error) {
      console.error('Error al cargar y reproducir canción:', error);
    }
  }
  
  // Método para descargar la canción actual
  private async unloadCurrentSong(): Promise<void> {
    if (this.state.sound) {
      try {
        await this.state.sound.stopAsync();
        await this.state.sound.unloadAsync();
      } catch (error) {
        console.error('Error al descargar sonido:', error);
      }
    }
  }
  
  // Manejar cambios en la reproducción
  private onPlaybackStatusUpdate(status: any) {
    if (!status.isLoaded) {
      // Sonido ha sido descargado o ha ocurrido un error
      if (status.error) {
        console.error(`Error en la reproducción: ${status.error}`);
      }
      return;
    }
    
    // Actualizar posición actual
    const position = status.positionMillis;
    const duration = status.durationMillis || this.state.duration;
    
    // Actualizar estado solo si hay cambios significativos
    if (Math.abs(position - this.state.position) > 500) {
      this.updateState({ position, duration });
    }
    
    // Verificar si la reproducción ha terminado
    if (status.didJustFinish) {
      console.log('Reproducción finalizada');
      this.playNext();
    }
  }
  
  // Reproducir canción actual
  async play(): Promise<void> {
    if (!this.state.sound) {
      console.warn('No hay sonido cargado para reproducir');
      return;
    }
    
    try {
      await this.state.sound.playAsync();
      this.updateState({ isPlaying: true });
    } catch (error) {
      console.error('Error al reproducir:', error);
    }
  }
  
  // Pausar reproducción
  async pause(): Promise<void> {
    if (!this.state.sound) return;
    
    try {
      await this.state.sound.pauseAsync();
      this.updateState({ isPlaying: false });
    } catch (error) {
      console.error('Error al pausar:', error);
    }
  }
  
  // Alternar entre reproducir y pausar
  async togglePlay(): Promise<void> {
    if (this.state.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }
  
  // Buscar posición en la canción
  async seekTo(position: number): Promise<void> {
    if (!this.state.sound) return;
    
    try {
      await this.state.sound.setPositionAsync(position);
      this.updateState({ position });
    } catch (error) {
      console.error('Error al buscar posición:', error);
    }
  }
  
  // Cargar lista de reproducción
  loadPlaylist(songs: DownloadedItem[], startIndex: number = 0): void {
    this.playlist = [...songs];
    
    if (this.playlist.length > 0 && startIndex >= 0 && startIndex < this.playlist.length) {
      this.loadAndPlaySong(this.playlist[startIndex]);
    }
  }
  
  // Reproducir siguiente canción
  async playNext(): Promise<void> {
    if (this.playlist.length === 0) return;
    
    const nextIndex = (this.state.currentSongIndex + 1) % this.playlist.length;
    await this.loadAndPlaySong(this.playlist[nextIndex]);
  }
  
  // Reproducir canción anterior
  async playPrevious(): Promise<void> {
    if (this.playlist.length === 0) return;
    
    let prevIndex = this.state.currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = this.playlist.length - 1;
    
    await this.loadAndPlaySong(this.playlist[prevIndex]);
  }
  
  // Limpiar reproductor completamente
  async cleanup(): Promise<void> {
    await this.unloadCurrentSong();
    this.playlist = [];
    this.updateState({
      isPlaying: false,
      currentSong: null,
      currentSongIndex: -1,
      position: 0,
      duration: 0,
      sound: null,
    });
  }
}

// Crear instancia singleton
const playerService = PlayerService.getInstance();

// Función para limpiar el reproductor
export const cleanupPlayer = async () => {
  await playerService.cleanup();
};

// Función para cerrar completamente el reproductor
export const closePlayerCompletely = async () => {
  await playerService.cleanup();
};

export default playerService; 