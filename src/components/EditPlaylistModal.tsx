import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importar ImagePicker de forma segura
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
  console.log('ImagePicker cargado correctamente');
} catch (error) {
  console.warn('expo-image-picker no está disponible:', error);
}

const { width } = Dimensions.get('window');

interface EditPlaylistModalProps {
  visible: boolean;
  playlist: any;
  onClose: () => void;
  onSave: (updatedData: { name: string; description?: string; image?: string | null }) => void;
}

const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  visible,
  playlist,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name || '');
      setDescription(playlist.description || '');
      setImage(playlist.image || playlist.coverImage || null);
    }
  }, [playlist]);

  const handleSelectImage = async () => {
    // Verificar si ImagePicker está disponible
    if (!ImagePicker) {
      Alert.alert(
        'Función no disponible',
        'El selector de imagen no está disponible en este momento. Asegúrate de que la aplicación esté compilada correctamente.'
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
      '¿Estás seguro de que quieres eliminar la imagen de la playlist?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => setImage(null) }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la playlist no puede estar vacío');
      return;
    }

    setIsSaving(true);
    
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        image,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Resetear valores al cerrar
    if (playlist) {
      setName(playlist.name || '');
      setDescription(playlist.description || '');
      setImage(playlist.image || playlist.coverImage || null);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Playlist</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            {/* Image Section */}
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

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la playlist</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ingresa el nombre"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                />
                <Text style={styles.charCount}>{name.length}/50</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
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

            {/* Info */}
            <View style={styles.infoSection}>
              <Ionicons name="information-circle-outline" size={20} color="#1DB954" />
              <Text style={styles.infoText}>
                Los cambios se aplicarán inmediatamente a tu playlist
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  modalContent: {
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
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
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
  infoSection: {
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

export default EditPlaylistModal; 