import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import PlayerService from '../services/PlayerService';
import DownloadService, { DownloadedItem } from '../services/DownloadService';
import PlaylistService from '../services/PlaylistService';
import { Player, cleanupPlayer, closePlayerCompletely } from '../components/Player';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const PlaylistDetailScreen = ({ route, navigation }: any) => {
  const { playlist: initialPlaylist } = route.params;
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [songs, setSongs] = useState<DownloadedItem[]>([]);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [currentPlayerState, setCurrentPlayerState] = useState(PlayerService.getState());
  const [isLoading, setIsLoading] = useState(true);

  // Recargar datos cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadPlaylistSongs();
      
      // Inicializar audio
      const setupAudio = async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (error) {
          console.error('Error al configurar audio:', error);
        }
      };
      
      setupAudio();
      
      // Suscribirse a cambios en el estado del reproductor
      const unsubscribe = PlayerService.addListener(setCurrentPlayerState);
      
      // Limpiar al perder el foco
      return () => {
        unsubscribe();
      };
    }, [])
  );

  // Cargar las canciones de la playlist
  const loadPlaylistSongs = async () => {
    try {
      setIsLoading(true);
      
      // Obtener la playlist actualizada
      const currentPlaylist = PlaylistService.getPlaylistById(playlist.id);
      
      if (!currentPlaylist) {
        Alert.alert('Error', 'No se pudo cargar la playlist');
        navigation.goBack();
        return;
      }
      
      setPlaylist(currentPlaylist);
      
      // Obtener todas las canciones descargadas
      const allDownloads = DownloadService.getDownloads();
      
      // Filtrar solo las canciones que pertenecen a esta playlist
      const playlistSongs = allDownloads.filter(song => 
        currentPlaylist.songIds.includes(song.id)
      );
      
      setSongs(playlistSongs);
    } catch (error) {
      console.error('Error al cargar canciones:', error);
      Alert.alert('Error', 'No se pudo cargar las canciones de la playlist');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para reproducir una canción
  const playSong = async (song: DownloadedItem, index: number) => {
    try {
      // Limpiar cualquier reproductor existente
      await cleanupPlayer();
      
      // Verificar que el archivo exista antes de cargarlo
      const fileInfo = await FileSystem.getInfoAsync(song.filePath);
      if (!fileInfo.exists) {
        throw new Error(`Archivo no encontrado: ${song.filePath}`);
      }
      
      console.log(`Reproduciendo archivo: ${song.filePath}`);
      
      // Cargar la playlist en el reproductor
      PlayerService.loadPlaylist(songs, index);
      
      // Mostrar el reproductor completo
      setShowFullPlayer(true);
    } catch (error) {
      console.error('Error al reproducir canción:', error);
      Alert.alert(
        'Error de reproducción', 
        'No se pudo reproducir la canción. El archivo puede haber sido movido o eliminado.'
      );
    }
  };

  // Función para eliminar una canción de la playlist
  const removeSong = (songId: string) => {
    Alert.alert(
      'Eliminar canción',
      '¿Estás seguro de que deseas eliminar esta canción de la playlist?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              const success = await PlaylistService.removeSongFromPlaylist(playlist.id, songId);
              
              if (success) {
                // Actualizar la lista de canciones localmente
                setSongs(songs.filter(song => song.id !== songId));
                // Actualizar la playlist
                const updatedPlaylist = PlaylistService.getPlaylistById(playlist.id);
                if (updatedPlaylist) {
                  setPlaylist(updatedPlaylist);
                }
              } else {
                Alert.alert('Error', 'No se pudo eliminar la canción');
              }
            } catch (error) {
              console.error('Error al eliminar canción:', error);
              Alert.alert('Error', 'Ocurrió un error al eliminar la canción');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{playlist.name}</Text>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Opciones de playlist',
              '¿Qué deseas hacer con esta playlist?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel'
                },
                {
                  text: 'Cambiar nombre',
                  onPress: () => {
                    // Aquí iría la lógica para cambiar el nombre
                    Alert.alert(
                      'Cambiar nombre',
                      'Esta función estará disponible pronto'
                    );
                  }
                },
                {
                  text: 'Eliminar playlist',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Eliminar playlist',
                      '¿Estás seguro? Esta acción no se puede deshacer.',
                      [
                        {
                          text: 'Cancelar',
                          style: 'cancel'
                        },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await PlaylistService.deletePlaylist(playlist.id);
                              navigation.goBack();
                            } catch (error) {
                              console.error('Error al eliminar playlist:', error);
                              Alert.alert('Error', 'No se pudo eliminar la playlist');
                            }
                          }
                        }
                      ]
                    );
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.playlistInfo}>
        <View style={styles.playlistIcon}>
          <Ionicons name="musical-notes" size={48} color="#fff" />
        </View>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.playlistCount}>
          {playlist.songIds.length} {playlist.songIds.length === 1 ? 'canción' : 'canciones'}
        </Text>
        <TouchableOpacity
          style={[
            styles.playAllButton,
            songs.length === 0 && styles.disabledButton
          ]}
          onPress={() => {
            if (songs.length > 0) {
              playSong(songs[0], 0);
            }
          }}
          disabled={songs.length === 0}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.playAllText}>Reproducir Todo</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Cargando canciones...</Text>
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            No hay canciones en esta playlist. 
            Busca y descarga música para añadirla a la playlist.
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Buscar Música</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[
                styles.songItem,
                currentPlayerState.currentSong?.id === item.id && styles.currentSongItem,
              ]}
              onPress={() => playSong(item, index)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.songThumbnail} />
              <View style={styles.songInfo}>
                <Text 
                  style={[
                    styles.songTitle,
                    currentPlayerState.currentSong?.id === item.id && styles.currentSongText,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.artist} • {formatTime(item.duration)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeSong(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Mini reproductor - ocultarlo si el reproductor completo está visible */}
      {/* Eliminado para evitar duplicación con el mini-reproductor global en App.tsx */}

      {/* Reproductor completo */}
      <Player 
        visible={showFullPlayer} 
        onClose={() => setShowFullPlayer(false)} 
      />
    </SafeAreaView>
  );
};

// Convertir milisegundos a formato mm:ss
const formatTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  playlistInfo: {
    alignItems: 'center',
    padding: 24,
  },
  playlistIcon: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  playlistCount: {
    fontSize: 14,
    color: '#b3b3b3',
    marginBottom: 24,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  playAllText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#b3b3b3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#b3b3b3',
    marginVertical: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  currentSongItem: {
    backgroundColor: '#282828',
  },
  songThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 16,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  currentSongText: {
    color: '#1DB954',
  },
  songArtist: {
    fontSize: 14,
    color: '#b3b3b3',
  },
  deleteButton: {
    padding: 8,
  },
});

export default PlaylistDetailScreen; 