import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importar ImagePicker de forma segura
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
  console.log('ImagePicker cargado correctamente en CreatePlaylistScreen');
} catch (error) {
  console.warn('expo-image-picker no está disponible:', error);
}

import PlaylistService from '../services/PlaylistService';

const { width } = Dimensions.get('window');

const CreatePlaylistScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => setImage(null) }
      ]
    );
  };

  // Función para crear una nueva playlist
  const handleCreatePlaylist = async () => {
    // Validar nombre
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la playlist');
      return;
    }

    try {
      setIsCreating(true);
      
      // Crear la playlist con imagen
      const playlist = await PlaylistService.createPlaylist(
        name.trim(), 
        image, 
        description.trim()
      );
      
      // Mostrar mensaje de éxito
      Alert.alert(
        'Playlist Creada',
        `La playlist "${playlist.name}" ha sido creada exitosamente.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navegar a la pantalla de detalle de la playlist
              navigation.replace('PlaylistDetail', { playlist });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al crear playlist:', error);
      Alert.alert('Error', 'No se pudo crear la playlist');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Playlist</Text>
          <TouchableOpacity
            onPress={handleCreatePlaylist}
            style={[styles.createButton, (isCreating || !name.trim()) && styles.disabledButton]}
            disabled={isCreating || !name.trim()}
          >
            <Text style={styles.createButtonText}>
              {isCreating ? 'Creando...' : 'Crear'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Sección de imagen */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handleSelectImage}
            >
              {image ? (
                <>
                  <Image source={{ uri: image }} style={styles.playlistImage} />
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
            
            {image && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="trash-outline" size={16} color="#ff4444" />
                <Text style={styles.removeImageText}>Eliminar imagen</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de la playlist</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa el nombre"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
              <Text style={styles.charCount}>{name.length}/50</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe tu playlist..."
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={150}
              />
              <Text style={styles.charCount}>{description.length}/150</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#1DB954" />
            <Text style={styles.infoText}>
              Puedes añadir canciones a tu playlist después de crearla. Para ello, busca y descarga
              canciones desde la pantalla de búsqueda.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  playlistImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#555',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
  },
  removeImageText: {
    color: '#ff4444',
    fontSize: 12,
    marginLeft: 4,
  },
  formSection: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3d1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    color: '#1DB954',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

export default CreatePlaylistScreen;