import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
  Dimensions,
  FlatList,
  Image,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'react-native-progress';
import DownloadService from '../services/DownloadService';
import PlaylistService from '../services/PlaylistService';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { closePlayerCompletely } from '../components/Player';
import PlayerService from '../services/PlayerService';
import AutoCloseModal from '../components/AutoCloseModal';
import { useYouTubeConverter } from '../hooks/useYouTubeConverter';

const { width, height } = Dimensions.get('window');

// Ejemplo de URLs reales de audio para pruebas
const SAMPLE_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const SearchScreen = ({ navigation }: any) => {
  const [url, setUrl] = useState('https://www.youtube.com');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<'youtube'>('youtube');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentMediaInfo, setCurrentMediaInfo] = useState<any>(null);
  const webViewRef = useRef<WebView>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Hook para conversión automática con modales
  const {
    conversionState,
    isModalVisible,
    convertAndDownload,
    resetState,
    getModalType,
    getModalTitle,
    getModalMessage,
    shouldShowCloseButton,
    modalProps
  } = useYouTubeConverter();

  // Estados derivados para compatibilidad
  const isConverting = conversionState.step === 'converting';
  const isDownloading = conversionState.step === 'downloading';
  const progress = conversionState.progress;
  const modalVisible = isModalVisible;
  const modalType = getModalType();
  const modalTitle = getModalTitle();
  const modalMessage = getModalMessage();
  const closeModal = resetState;

  // Configurar audio cuando la pantalla obtiene el foco
  useFocusEffect(
    React.useCallback(() => {
      // Inicializar audio
      const initializeAudio = async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (error) {
          console.error('Error al inicializar audio:', error);
        }
      };
      
      initializeAudio();
      
      // Limpiar recursos cuando la pantalla pierde el foco
      return () => {
        if (sound) {
          sound.unloadAsync();
          setSound(null);
          setIsPlaying(false);
          setShowPlayer(false);
        }
      };
    }, [])
  );

  // Limpiar recursos al desmontar el componente
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Cambiar URL según la fuente seleccionada
    setUrl('https://www.youtube.com');
  }, [selectedSource]);

  // Simular resultados de búsqueda para la demo
  const simulateSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // Realizamos búsqueda real usando WebView
    setSearchQuery(query);
    setShowWebView(true);
    
    // Construir URL de búsqueda para YouTube
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    setUrl(searchUrl);
  };

  // Inyectar script mejorado para detectar videos y prevenir navegación no deseada
  const injectedJavaScript = `
    (function() {
      let isNavigationBlocked = false;
      
      // Función para manejar clics en la página
      function handleClick(event) {
        // Detectar clics en enlaces a videos
        const target = event.target.closest('a[href*="watch?v="], ytd-thumbnail, a[id*="thumbnail"]');
        if (target) {
          // Extraer ID del video
          let videoId = '';
          let href = target.getAttribute('href');
          
          // Buscar href en elementos cercanos si no lo tiene
          if (!href) {
            const linkElement = target.querySelector('a[href*="watch?v="]') || target.closest('a[href*="watch?v="]');
            if (linkElement) {
              href = linkElement.getAttribute('href');
            }
          }
          
          if (href) {
            const match = href.match(/watch\\?v=([^&]+)/);
            if (match && match[1]) {
              videoId = match[1];
              
              // Enviar mensaje a React Native con la información del video
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'VIDEO_CLICK',
                videoId: videoId,
                url: href.startsWith('/') ? 'https://www.youtube.com' + href : href
              }));
              
              // Prevenir navegación normal
              event.preventDefault();
              event.stopPropagation();
              isNavigationBlocked = true;
              return false;
            }
          }
        }
        
        return true;
      }
      
      // Detectar cuando hay resultados de búsqueda en YouTube
      function checkForSearchResults() {
        // Estamos en una página de resultados de búsqueda de YouTube
        if (window.location.href.includes('youtube.com/results')) {
          // Buscar todos los elementos que parecen ser videos
          const videoElements = document.querySelectorAll('ytd-video-renderer, ytm-compact-video-renderer');
          
          if (videoElements && videoElements.length > 0) {
            const searchResults = [];
            
            // Extraer información de cada video
            videoElements.forEach((element, index) => {
              if (index >= 10) return; // Limitar a 10 resultados
              
              let title = '';
              let videoId = '';
              let thumbnail = '';
              let channelName = '';
              
              // Intentar extraer título
              const titleElement = element.querySelector('#video-title, .title');
              if (titleElement) {
                title = titleElement.textContent.trim();
              }
              
              // Intentar extraer videoId de enlaces
              const linkElement = element.querySelector('a[href*="watch?v="]');
              if (linkElement) {
                const href = linkElement.getAttribute('href');
                if (href) {
                  const match = href.match(/watch\\?v=([^&]+)/);
                  if (match && match[1]) {
                    videoId = match[1];
                    thumbnail = 'https://i.ytimg.com/vi/' + videoId + '/mqdefault.jpg';
                  }
                }
              }
              
              // Intentar extraer nombre del canal
              const channelElement = element.querySelector('#channel-name, .subtitle');
              if (channelElement) {
                channelName = channelElement.textContent.trim();
              }
              
              if (title && videoId) {
                searchResults.push({
                  title: title,
                  videoId: videoId,
                  thumbnail: thumbnail,
                  artist: channelName || 'YouTube'
                });
              }
            });
            
            // Enviar resultados a React Native
            if (searchResults.length > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SEARCH_RESULTS',
                results: searchResults
              }));
            }
          }
        }
      }
      
      // Bloquear navegación a páginas de video
      function blockVideoNavigation() {
        // Interceptar cambios de URL
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(state, title, url) {
          if (url && url.includes('watch?v=')) {
            console.log('Navegación a video bloqueada:', url);
            return;
          }
          return originalPushState.apply(history, arguments);
        };
        
        history.replaceState = function(state, title, url) {
          if (url && url.includes('watch?v=')) {
            console.log('Navegación a video bloqueada:', url);
            return;
          }
          return originalReplaceState.apply(history, arguments);
        };
        
        // Interceptar clics en enlaces
        document.addEventListener('click', handleClick, true);
        
        // Interceptar eventos de toque para móviles
        document.addEventListener('touchstart', handleClick, true);
      }
      
      // Ejecutar cada segundo para detectar cambios
      setInterval(checkForSearchResults, 1000);
      
      // Ejecutar cuando la página termina de cargar
      window.addEventListener('load', function() {
        checkForSearchResults();
        blockVideoNavigation();
      });
      
      // Ejecutar inmediatamente
      blockVideoNavigation();
      
      true;
    })();
  `;

  // Manejar mensajes desde el WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'SEARCH_RESULTS') {
        // Recibimos resultados de búsqueda
        console.log('Resultados de búsqueda recibidos:', data.results);
        setSearchResults(data.results.map((item: any, index: number) => ({
          ...item,
          id: `youtube-${index}-${Date.now()}`
        })));
        
        // Salimos del WebView para mostrar los resultados
        setShowWebView(false);
      }
      else if (data.type === 'VIDEO_CLICK') {
        // El usuario ha hecho clic en un video
        console.log('Usuario hizo clic en video:', data.videoId);
        
        // Usar el hook para conversión automática
        handleVideoDownload(data.videoId);
      }
    } catch (error) {
      console.error('Error al procesar mensaje del WebView:', error);
    }
  };

  // Manejar descarga de video con modales automáticos
  const handleVideoDownload = async (videoId: string) => {
    try {
      // Cerrar WebView inmediatamente
      setShowWebView(false);
      
      // Usar el hook para conversión automática
      const result = await convertAndDownload(videoId);
      
      if (result.success && result.downloadedItem) {
        // Éxito - el modal se cerrará automáticamente
        console.log('Descarga completada:', result.downloadedItem.title);
        
        // Opcional: Mostrar opciones adicionales después de un breve delay
        setTimeout(() => {
          showPostDownloadOptions(result.downloadedItem);
        }, 1000);
      } else {
        // Error - mostrar mensaje
        Alert.alert(
          'Error en la descarga',
          result.error || 'No se pudo completar la descarga',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error en handleVideoDownload:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error inesperado durante la descarga',
        [{ text: 'OK' }]
      );
    }
  };

  // Mostrar opciones después de la descarga
  const showPostDownloadOptions = (downloadedItem: any) => {
    Alert.alert(
      'Descarga Completa',
      `"${downloadedItem.title}" se ha descargado correctamente.`,
      [
        {
          text: 'Añadir a Playlist',
          onPress: () => showAddToPlaylistOptions(downloadedItem.id)
        },
        {
          text: 'Reproducir',
          onPress: () => {
            try {
              PlayerService.loadAndPlaySong(downloadedItem);
            } catch (error) {
              console.error('Error al reproducir:', error);
            }
          }
        },
        {
          text: 'Cerrar',
          style: 'cancel'
        }
      ]
    );
  };

  // Reproducir audio de muestra para verificar el funcionamiento
  const playSample = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      console.log('Cargando audio de muestra...');
      
      const audioUrl = SAMPLE_AUDIO_URL;
      setIsLoading(true);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error al reproducir audio:', error);
      setIsLoading(false);
      Alert.alert('Error de reproducción', 'No se pudo reproducir el audio de muestra');
    }
  };

  // Escuchar cambios en el estado de reproducción
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    } else if (status.error) {
      console.error('Error en la reproducción:', status.error);
      setIsPlaying(false);
    }
  };

  // Detener la reproducción
  const stopPlayback = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error al detener reproducción:', error);
      }
    }
  };

  // Cerrar completamente el reproductor
  const handleClosePlayer = async () => {
    await stopPlayback();
    setShowPlayer(false);
    await closePlayerCompletely();
  };

  // Función para iniciar descarga desde el resultado de búsqueda
  const handleDownloadItem = async (item: any, asVideo: boolean = false) => {
    if (!item || !item.videoId) {
      Alert.alert('Error', 'No se pudo obtener información del contenido para descargar');
      return;
    }
    
    // Usar el hook para conversión automática
    await handleVideoDownload(item.videoId);
  };

  // Mostrar opciones para añadir a playlist
  const showAddToPlaylistOptions = (songId: string) => {
    const playlists = PlaylistService.getPlaylists();
    
    if (playlists.length === 0) {
      Alert.alert('No hay playlists', 'Primero debes crear una playlist');
      return;
    }
    
    Alert.alert(
      'Seleccionar Playlist',
      'Elige una playlist para añadir esta canción:',
      [
        ...playlists.map(playlist => ({
          text: playlist.name,
          onPress: () => {
            PlaylistService.addSongToPlaylist(playlist.id, songId);
            Alert.alert(
              'Éxito', 
              `Añadido a la playlist "${playlist.name}"`,
              [{ text: 'OK' }]
            );
          }
        })),
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

  // Navegación del WebView
  const goBack = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  const reload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // Manejar cambios en la búsqueda
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // Manejar envío de búsqueda
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      simulateSearch(searchQuery);
    }
  };

  // Renderizar cada elemento de la lista de resultados
  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={styles.searchResultItem}>
      <Image 
        source={{ uri: item.thumbnail }} 
        style={styles.resultThumbnail} 
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultArtist}>{item.artist}</Text>
      </View>
      <View style={styles.downloadButtons}>
        <TouchableOpacity 
          style={styles.downloadIconButton}
          onPress={() => handleDownloadItem(item, false)}
          disabled={isConverting || isDownloading}
        >
          <Ionicons 
            name="arrow-down-circle" 
            size={28} 
            color={isConverting || isDownloading ? "#666" : "#1DB954"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera con buscador */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar</Text>
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#b3b3b3" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Canciones, artistas o videos de YouTube"
            placeholderTextColor="#727272"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            editable={!isConverting && !isDownloading}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#b3b3b3" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mostrar WebView o resultados de búsqueda */}
      {showWebView ? (
        <>
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              injectedJavaScript={injectedJavaScript}
              onMessage={handleMessage}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onShouldStartLoadWithRequest={(request) => {
                // Bloquear navegación a páginas de video
                if (request.url.includes('youtube.com/watch') || request.url.includes('youtu.be/')) {
                  console.log('Navegación a video bloqueada:', request.url);
                  return false;
                }
                // Permitir otras navegaciones
                return true;
              }}
              userAgent={
                Platform.OS === 'android'
                  ? 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
                  : 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
              }
            />
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#1DB954" />
              </View>
            )}
          </View>

          <View style={styles.navBar}>
            <TouchableOpacity onPress={goBack} style={styles.navButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={reload} style={styles.navButton}>
              <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={goForward} style={styles.navButton}>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowWebView(false)} 
              style={styles.navButton}
            >
              <Ionicons name="list" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.resultsContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#1DB954" style={styles.resultsLoader} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsList}
            />
          ) : searchQuery.length > 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={64} color="#727272" />
              <Text style={styles.noResultsText}>No se encontraron resultados</Text>
              <TouchableOpacity 
                style={styles.webViewButton}
                onPress={() => setShowWebView(true)}
              >
                <Text style={styles.webViewButtonText}>
                  Buscar en YouTube
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.initialSearch}>
              <Ionicons name="search-outline" size={64} color="#727272" />
              <Text style={styles.initialSearchText}>
                Busca tus canciones y videos favoritos
              </Text>
              <TouchableOpacity 
                style={styles.webViewButton}
                onPress={() => setShowWebView(true)}
              >
                <Text style={styles.webViewButtonText}>
                  Ir a YouTube
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Modal automático para conversión y descarga */}
      <AutoCloseModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        progress={progress}
        onClose={closeModal}
        autoCloseDelay={modalType === 'success' ? 2000 : undefined}
      />

      {/* Reproductor de muestra */}
      {showPlayer && (
        <View style={styles.samplePlayer}>
          <Text style={styles.samplePlayerText}>
            Reproduciendo muestra de audio
          </Text>
          <View style={styles.samplePlayerControls}>
            <TouchableOpacity 
              style={styles.samplePlayerButton}
              onPress={isPlaying ? stopPlayback : playSample}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={30} 
                color="#fff" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.samplePlayerClose}
              onPress={handleClosePlayer}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    backgroundColor: '#121212',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 40,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#282828',
  },
  navButton: {
    padding: 8,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  resultThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultArtist: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  downloadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  downloadIconButton: {
    padding: 8,
  },
  resultsLoader: {
    marginTop: 50,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  noResultsText: {
    color: '#b3b3b3',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  initialSearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  initialSearchText: {
    color: '#b3b3b3',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  webViewButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  webViewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  samplePlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#333',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  samplePlayerText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  samplePlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  samplePlayerButton: {
    marginRight: 16,
  },
  samplePlayerClose: {
    padding: 4,
  },
});

export default SearchScreen; 