import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import DownloadService from '../services/DownloadService';
import PlaylistService from '../services/PlaylistService';

// Tipo para información del sitio web
type SiteInfo = {
  title: string;
  source: 'youtube' | 'soundcloud';
  url: string;
  isDownloadable: boolean;
};

const WebViewScreen: React.FC = () => {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('https://www.youtube.com');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentSiteInfo, setCurrentSiteInfo] = useState<SiteInfo | null>(null);
  const [showDownloadOptions, setShowDownloadOptions] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState<boolean>(false);
  const [currentDownloadId, setCurrentDownloadId] = useState<string>('');

  // Detectar si la página actual es un contenido descargable
  const checkIfDownloadable = (url: string): SiteInfo | null => {
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      // Es un video de YouTube
      return {
        title: 'Video de YouTube',
        source: 'youtube',
        url: url,
        isDownloadable: true,
      };
    } else if (url.includes('soundcloud.com') && !url.includes('/discover')) {
      // Es una pista de SoundCloud (excepto páginas de descubrimiento)
      return {
        title: 'Pista de SoundCloud',
        source: 'soundcloud',
        url: url,
        isDownloadable: true,
      };
    }
    return null;
  };

  // Manejar cambios en la URL
  const handleNavigationStateChange = (navState: any) => {
    const newUrl = navState.url;
    setCurrentUrl(newUrl);
    setIsLoading(navState.loading);
    
    // Comprobar si la página actual es descargable
    const siteInfo = checkIfDownloadable(newUrl);
    setCurrentSiteInfo(siteInfo);
  };

  // Extraer título de la página
  const extractTitle = (js: string) => {
    if (currentSiteInfo) {
      // Actualizar el título si tenemos información del sitio
      setCurrentSiteInfo({
        ...currentSiteInfo,
        title: js.trim() || currentSiteInfo.title,
      });
    }
  };

  // Manejar la descarga del contenido actual
  const handleDownload = async (asVideo: boolean) => {
    try {
      // Comprobamos si tenemos información de la página actual
      if (!currentSiteInfo) {
        Alert.alert('Error', 'No hay información disponible para descargar');
        return;
      }

      setIsDownloading(true);
      setDownloadProgress(0);

      // Simular progreso de descarga
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 0.05;
        if (progress >= 1) {
          clearInterval(progressInterval);
        }
        setDownloadProgress(progress);
      }, 100);

      // Finalizar la descarga y guardar en el dispositivo
      await finishDownload(currentSiteInfo.title, currentSiteInfo.source, asVideo);

      clearInterval(progressInterval);
      setIsDownloading(false);
      setDownloadProgress(0);
      setShowDownloadOptions(false);
    } catch (error) {
      console.error('Error en la descarga:', error);
      Alert.alert('Error', 'No se pudo completar la descarga');
      setIsDownloading(false);
      setDownloadProgress(0);
      setShowDownloadOptions(false);
    }
  };

  // Finalizar la descarga y guardar en el dispositivo
  const finishDownload = async (title: string, source: string, asVideo: boolean) => {
    try {
      // URL de muestra para la demostración
      // Usamos archivos de muestra más confiables y probados
      const mediaUrl = asVideo 
        ? 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4' // Archivo de video confiable
        : 'https://filesamples.com/samples/audio/mp3/sample3.mp3'; // Archivo de audio confiable
      
      // Directorio de descargas
      const downloadDir = FileSystem.documentDirectory + 'downloads/';
      
      // Asegurar que el directorio exista
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      }
      
      // Nombre de archivo único
      const fileExtension = asVideo ? 'mp4' : 'mp3';
      const timestamp = Date.now();
      const filename = `${downloadDir}${source}_${timestamp}.${fileExtension}`;
      
      // Descargar el archivo
      console.log(`Iniciando descarga desde: ${mediaUrl}`);
      console.log(`Guardando en: ${filename}`);
      
      const downloadResult = await FileSystem.downloadAsync(
        mediaUrl,
        filename
      );
      
      console.log('Resultado de la descarga:', downloadResult);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Error al descargar el archivo: ${downloadResult.status}`);
      }
      
      // Verificar que el archivo se descargó correctamente
      const fileInfo = await FileSystem.getInfoAsync(filename);
      if (!fileInfo.exists) {
        throw new Error('El archivo descargado no existe');
      }
      
      console.log(`Archivo descargado correctamente. Tamaño: ${(fileInfo as any).size} bytes`);
      
      // Crear entrada en el servicio de descargas
      const downloadItem = {
        id: `${source}-${timestamp}`,
        title: title,
        artist: source === 'youtube' ? 'YouTube' : 'SoundCloud',
        thumbnail: 'https://via.placeholder.com/480x360?text=Thumbnail',
        filePath: filename,
        duration: 60000, // 1 minuto como duración de ejemplo
        size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        downloadDate: new Date().toISOString(),
        mediaType: asVideo ? 'video' as const : 'audio' as const,
      };
      
      // Guardar en el servicio
      const added = await DownloadService.addDownload(downloadItem);
      if (!added) {
        console.warn('El ítem ya existe en las descargas');
      }
      
      setIsDownloading(false);
      setDownloadProgress(0);
      
      // Preguntar si quiere añadir a una playlist
      const allPlaylists = PlaylistService.getPlaylists();
      
      if (allPlaylists.length > 0) {
        Alert.alert(
          'Descarga Exitosa',
          `Se ha descargado "${title}". ¿Deseas añadirlo a una playlist?`,
          [
            {
              text: 'No, gracias',
              style: 'cancel',
            },
            {
              text: 'Añadir a Playlist',
              onPress: () => showAddToPlaylistOptions(downloadItem.id),
            },
          ]
        );
      } else {
        Alert.alert(
          'Descarga Exitosa',
          `Se ha descargado "${title}". ¿Deseas crear una playlist para organizarlo?`,
          [
            {
              text: 'No, gracias',
              style: 'cancel',
            },
            {
              text: 'Crear Playlist',
              onPress: () => navigation.navigate('CreatePlaylist' as never),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error al finalizar la descarga:', error);
      setIsDownloading(false);
      Alert.alert('Error', 'No se pudo completar la descarga: ' + (error as Error).message);
    }
  };

  // Mostrar opciones para añadir a playlist
  const showAddToPlaylistOptions = (downloadId: string) => {
    setCurrentDownloadId(downloadId);
    setShowPlaylistModal(true);
  };

  // Añadir a una playlist específica
  const addToPlaylist = (playlistId: string) => {
    if (currentDownloadId) {
      PlaylistService.addSongToPlaylist(playlistId, currentDownloadId);
      setShowPlaylistModal(false);
      Alert.alert('Éxito', 'Añadido a la playlist correctamente');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior con acciones */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentSiteInfo?.title || 'Navegador Web'}
        </Text>
        
        {currentSiteInfo?.isDownloadable && (
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={() => setShowDownloadOptions(true)}
          >
            <Ionicons name="download" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Barra de descarga */}
      {isDownloading && (
        <View style={styles.downloadBar}>
          <View style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]} />
          <Text style={styles.downloadText}>
            Descargando... {Math.round(downloadProgress * 100)}% 🎵
          </Text>
        </View>
      )}
      
      {/* WebView principal */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript="window.document.title;"
        onMessage={(event) => extractTitle(event.nativeEvent.data)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6600" />
          </View>
        )}
      />
      
      {/* Modal de opciones de descarga */}
      <Modal
        visible={showDownloadOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDownloadOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opciones de descarga</Text>
            <Text style={styles.modalSubtitle}>{currentSiteInfo?.title}</Text>
            
            <TouchableOpacity 
              style={styles.downloadOption}
              onPress={() => handleDownload(false)}
              disabled={isDownloading}
            >
              <Ionicons name="musical-note" size={24} color="#FF6600" />
              <Text style={styles.optionText}>Descargar como Audio (MP3)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.downloadOption}
              onPress={() => handleDownload(true)}
              disabled={isDownloading}
            >
              <Ionicons name="videocam" size={24} color="#FF6600" />
              <Text style={styles.optionText}>Descargar como Video (MP4)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowDownloadOptions(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Modal para seleccionar playlist */}
      <Modal
        visible={showPlaylistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Playlist</Text>
            
            {PlaylistService.getPlaylists().map((playlist) => (
              <TouchableOpacity 
                key={playlist.id}
                style={styles.playlistOption}
                onPress={() => addToPlaylist(playlist.id)}
              >
                <Ionicons name="list" size={24} color="#FF6600" />
                <Text style={styles.optionText}>{playlist.name}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowPlaylistModal(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6600',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  downloadButton: {
    padding: 5,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  downloadBar: {
    height: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#FF9800',
    opacity: 0.7,
  },
  downloadText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  downloadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playlistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  cancelButton: {
    paddingVertical: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WebViewScreen; 