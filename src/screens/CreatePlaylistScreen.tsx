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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaylistService from '../services/PlaylistService';

const CreatePlaylistScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Función para crear una nueva playlist
  const handleCreatePlaylist = async () => {
    // Validar nombre
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la playlist');
      return;
    }

    try {
      setIsCreating(true);
      
      // Crear la playlist
      const playlist = await PlaylistService.createPlaylist(name, description);
      
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
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la playlist"
              value={name}
              onChangeText={setName}
              maxLength={30}
            />
            <Text style={styles.charCount}>{name.length}/30</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe tu playlist..."
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{description.length}/100</Text>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <Text style={styles.infoText}>
              Puedes añadir canciones a tu playlist después de crearla. Para ello, busca y descarga
              canciones desde la pantalla de búsqueda.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePlaylist}
            disabled={isCreating || !name.trim()}
          >
            <Text style={styles.buttonText}>Crear Playlist</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#6200ee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  createButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreatePlaylistScreen; 