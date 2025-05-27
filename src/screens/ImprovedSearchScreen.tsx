import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AutoCloseModal from '../components/AutoCloseModal';
import { useYouTubeConverter } from '../hooks/useYouTubeConverter';

// Ejemplo de datos de búsqueda (en una app real vendrían de una API)
const SAMPLE_RESULTS = [
  {
    videoId: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    artist: 'Rick Astley',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    duration: '3:33'
  },
  {
    videoId: 'kJQP7kiw5Fk',
    title: 'Despacito - Luis Fonsi ft. Daddy Yankee',
    artist: 'Luis Fonsi',
    thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    duration: '4:42'
  },
  {
    videoId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody - Queen',
    artist: 'Queen',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    duration: '5:55'
  }
];

const ImprovedSearchScreen = ({ navigation }: any) => {
  const [searchResults] = useState(SAMPLE_RESULTS);
  const { convertAndDownload, modalProps } = useYouTubeConverter();

  const handleDownload = async (item: any) => {
    try {
      const result = await convertAndDownload(item.videoId, item.title);
      
      if (result.success) {
        // Mostrar mensaje de éxito adicional si es necesario
        setTimeout(() => {
          Alert.alert(
            '🎵 ¡Descarga Completada!',
            `"${item.title}" se ha añadido a tu biblioteca.`,
            [
              {
                text: 'Ver Descargas',
                onPress: () => navigation.navigate('Downloads')
              },
              { text: 'OK' }
            ]
          );
        }, 3500);
      }
    } catch (error) {
      console.error('Error en descarga:', error);
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={styles.resultItem}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.resultArtist} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={styles.resultDuration}>
          {item.duration}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => handleDownload(item)}
      >
        <Ionicons name="download" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Búsqueda Mejorada</Text>
        <Text style={styles.headerSubtitle}>
          Sin abrir YouTube • Modales automáticos
        </Text>
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item.videoId}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
      {/* Modal automático mejorado */}
      <AutoCloseModal 
        visible={modalProps.visible}
        type={modalProps.type}
        title={modalProps.title}
        message={modalProps.message}
        progress={modalProps.progress}
        onClose={modalProps.onClose || (() => {})}
        autoCloseDelay={modalProps.autoCloseDelay}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ Conversión automática sin abrir navegador
        </Text>
        <Text style={styles.footerText}>
          ⏱️ Modales que se cierran automáticamente
        </Text>
        <Text style={styles.footerText}>
          🔄 Progreso en tiempo real
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultsList: {
    flex: 1,
    padding: 15,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDuration: {
    fontSize: 12,
    color: '#999',
  },
  downloadButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
});

export default ImprovedSearchScreen; 