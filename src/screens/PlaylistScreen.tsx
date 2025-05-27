import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importar ImagePicker de forma segura
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
  console.log('ImagePicker cargado correctamente en PlaylistScreen');
} catch (error) {
  console.warn('expo-image-picker no está disponible:', error);
}
import PlaylistService from '../services/PlaylistService';
import PlayerService from '../services/PlayerService';

const { width } = Dimensions.get('window');

const PlaylistScreen = ({ navigation }: any) => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistImage, setNewPlaylistImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = () => {
    const loadedPlaylists = PlaylistService.getPlaylists();
    setPlaylists(loadedPlaylists);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la playlist');
      return;
    }

    setIsCreating(true);
    
    try {
      const newPlaylist = PlaylistService.createPlaylist(
        newPlaylistName.trim(),
        newPlaylistImage,
        newPlaylistDescription.trim()
      );
      
      setPlaylists(prev => [...prev, newPlaylist]);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setNewPlaylistImage(null);
      setShowCreateModal(false);
      
      Alert.alert(
        'Éxito',
        `Playlist "${newPlaylistName}" creada correctamente`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectImage = async () => {
    // Verificar si ImagePicker está disponible
    if (!ImagePicker) {
      Alert.alert(
        'Función no disponible',
        'El selector de imagen no está disponible en este momento. Puedes crear la playlist sin imagen por ahora.'
      );
      return;
    }
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos acceso a tu galería para seleccionar una imagen'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPlaylistImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    Alert.alert(
      'Eliminar Playlist',
      `¿Estás seguro de que quieres eliminar "${playlistName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            PlaylistService.deletePlaylist(playlistId);
            loadPlaylists();
          }
        }
      ]
    );
  };

  const handlePlayPlaylist = (playlist: any) => {
    const songs = PlaylistService.getPlaylistSongs(playlist.id);
    if (songs.length === 0) {
      Alert.alert('Playlist vacía', 'Esta playlist no tiene canciones');
      return;
    }

    try {
      PlayerService.loadAndPlaySong(songs[0]);
      Alert.alert(
        'Reproduciendo',
        `Iniciando reproducción de "${playlist.name}"`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo reproducir la playlist');
    }
  };

  const renderPlaylistItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => navigation.navigate('PlaylistDetail', { playlist: item })}
    >
      <View style={styles.playlistImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.playlistImage} />
        ) : (
          <View style={styles.defaultPlaylistImage}>
            <Ionicons name="musical-notes" size={32} color="#1DB954" />
          </View>
        )}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlayPlaylist(item)}
        >
          <Ionicons name="play" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.playlistDetails}>
          {PlaylistService.getPlaylistSongs(item.id).length} canciones
        </Text>
        <Text style={styles.playlistDate}>
          Creada el {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeletePlaylist(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Playlists</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={64} color="#666" />
          <Text style={styles.emptyStateTitle}>No tienes playlists</Text>
          <Text style={styles.emptyStateText}>
            Crea tu primera playlist para organizar tu música
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createFirstButtonText}>Crear Playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playlistList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal para crear playlist */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nueva Playlist</Text>
              <TouchableOpacity
                onPress={handleCreatePlaylist}
                style={[styles.saveButton, (isCreating || !newPlaylistName.trim()) && styles.disabledSaveButton]}
                disabled={isCreating || !newPlaylistName.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isCreating ? 'Creando...' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.imageSelector}
                onPress={handleSelectImage}
              >
                {newPlaylistImage ? (
                  <>
                    <Image source={{ uri: newPlaylistImage }} style={styles.selectedImage} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={24} color="#fff" />
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={32} color="#666" />
                    <Text style={styles.imagePlaceholderText}>Agregar imagen</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la playlist</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Ingresa el nombre"
                    placeholderTextColor="#666"
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    maxLength={50}
                  />
                  <Text style={styles.charCount}>{newPlaylistName.length}/50</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.nameInput, styles.textArea]}
                    placeholder="Describe tu playlist..."
                    placeholderTextColor="#666"
                    value={newPlaylistDescription}
                    onChangeText={setNewPlaylistDescription}
                    multiline
                    numberOfLines={3}
                    maxLength={100}
                  />
                  <Text style={styles.charCount}>{newPlaylistDescription.length}/100</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Ionicons name="information-circle-outline" size={20} color="#1DB954" />
                <Text style={styles.infoText}>
                  Podrás agregar canciones después de crear la playlist
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#1DB954',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#b3b3b3',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  createFirstButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playlistList: {
    padding: 20,
    paddingTop: 0,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  defaultPlaylistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#1DB954',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playlistDetails: {
    fontSize: 12,
    color: '#b3b3b3',
    marginBottom: 2,
  },
  playlistDate: {
    fontSize: 11,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 5,
  },
  imageSelector: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  nameInput: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#444',
  },
  descriptionInput: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createPlaylistButton: {
    flex: 1,
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  createPlaylistButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalContent: {
    flex: 1,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledSaveButton: {
    opacity: 0.6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#b3b3b3',
    marginLeft: 5,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default PlaylistScreen; 