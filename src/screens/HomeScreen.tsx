import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaylistService, { Playlist } from '../services/PlaylistService';
import DownloadService, { DownloadedItem } from '../services/DownloadService';
import PlayerService from '../services/PlayerService';

const HomeScreen = ({ navigation }: any) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();

    // Agregar listener para cuando la pantalla vuelva a estar en foco
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  // Función para cargar playlists y descargas
  const loadData = () => {
    setIsLoading(true);
    
    // Obtener todas las playlists
    const allPlaylists = PlaylistService.getPlaylists();
    setPlaylists(allPlaylists);
    
    // Obtener todas las descargas
    const allDownloads = DownloadService.getDownloads();
    setDownloads(allDownloads);
    
    setIsLoading(false);
  };

  // Función para reproducir canción
  const playSong = (song: DownloadedItem) => {
    PlayerService.loadSong(song);
    PlayerService.togglePlay();
  };

  // Función para agregar canción a una playlist
  const addToPlaylist = (song: DownloadedItem) => {
    if (playlists.length === 0) {
      Alert.alert(
        'Sin playlists',
        'No tienes playlists creadas. ¿Quieres crear una nueva playlist?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Crear Playlist',
            onPress: () => navigation.navigate('CreatePlaylist'),
          },
        ]
      );
      return;
    }

    // Mostrar opciones de playlists
    Alert.alert(
      'Agregar a playlist',
      'Selecciona una playlist:',
      [
        ...playlists.map(playlist => ({
          text: playlist.name,
          onPress: async () => {
            const success = await PlaylistService.addSongToPlaylist(playlist.id, song.id);
            if (success) {
              Alert.alert('Éxito', `Canción agregada a ${playlist.name}`);
              loadData(); // Recargar datos
            } else {
              Alert.alert('Error', 'No se pudo agregar la canción a la playlist');
            }
          },
        })),
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tu Biblioteca</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Sección de Playlists */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tus Playlists</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreatePlaylist')}
          >
            <Ionicons name="add-circle" size={24} color="#1DB954" />
          </TouchableOpacity>
        </View>
        
        {playlists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes" size={48} color="#b3b3b3" />
            <Text style={styles.emptyText}>No tienes playlists creadas</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreatePlaylist')}
            >
              <Ionicons name="add" size={24} color="#000" />
              <Text style={styles.buttonText}>Crear Playlist</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playlistCard}
                onPress={() => navigation.navigate('PlaylistDetail', { playlist: item })}
              >
                <View style={styles.playlistIcon}>
                  <Ionicons name="musical-notes" size={24} color="#1DB954" />
                </View>
                <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.playlistCount}>
                  {item.songIds.length} {item.songIds.length === 1 ? 'canción' : 'canciones'}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Sección de Canciones Descargadas */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Descargas Recientes</Text>
        
        {downloads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-download" size={48} color="#b3b3b3" />
            <Text style={styles.emptyText}>
              No tienes canciones descargadas.
              Busca y descarga música para empezar.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={24} color="#000" />
              <Text style={styles.buttonText}>Buscar Música</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={downloads}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.songItem}
                onPress={() => playSong(item)}
              >
                <Image 
                  source={{ uri: item.thumbnail || 'https://via.placeholder.com/60' }} 
                  style={styles.songThumbnail} 
                />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToPlaylist(item)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#1DB954" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchButton: {
    padding: 8,
  },
  sectionContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  playlistCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  playlistIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  playlistCount: {
    fontSize: 12,
    color: '#b3b3b3',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  songThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#333',
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
  songArtist: {
    fontSize: 14,
    color: '#b3b3b3',
  },
  addButton: {
    padding: 10,
  },
});

export default HomeScreen; 