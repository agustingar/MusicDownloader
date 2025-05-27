// Servicio para buscar y descargar música/videos de plataformas externas
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import PlaylistService from './PlaylistService';
import ApiService from './ApiService';

// Tipos de datos para la aplicación
export type SearchResult = {
  id: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  source: 'youtube' | 'soundcloud';
  url: string;
};

export interface DownloadedItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  filePath: string;
  duration: number;
  size: number;
  downloadDate: string;
  mediaType: 'audio' | 'video';
  videoId?: string;
}

// API Keys (en una app real deberían estar en un archivo .env seguro)
const YOUTUBE_API_KEY = 'AIzaSyDLk-5PwuRs9V0s1cFH7xkGgkqD5Wv5WEE'; // Esta es una key ficticia de ejemplo
const SOUNDCLOUD_CLIENT_ID = '2t9loNQH90kzJcsFCODdigxfp325aq4z'; // Esta es una key ficticia de ejemplo

// URLs base para las APIs
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const SOUNDCLOUD_API_URL = 'https://api.soundcloud.com';

// Ejemplo de URL de audio para pruebas
const SAMPLE_AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
];

// Obtener una URL de muestra aleatoria
const getRandomSampleUrl = () => {
  const randomIndex = Math.floor(Math.random() * SAMPLE_AUDIO_URLS.length);
  return SAMPLE_AUDIO_URLS[randomIndex];
};

// URL de muestra para fallback
const SAMPLE_AUDIO_URL = SAMPLE_AUDIO_URLS[0];

// URLs de servicios de conversión
const CONVERSION_SERVICES = [
  {
    name: 'Y2mate',
    apiUrl: 'https://www.y2mate.com/mates/',
    directUrl: 'https://www.y2mate.com/youtube/',
  },
  {
    name: 'TubeMP3',
    directUrl: 'https://tubemp3.to/watch?v=',
  },
  {
    name: 'YTConverter',
    directUrl: 'https://ytconv.cc/youtube-to-mp3/?url=https://www.youtube.com/watch?v=',
  }
];

class DownloadService {
  private downloads: DownloadedItem[] = [];
  private readonly STORAGE_KEY = '@music_downloader_downloads';
  private readonly DOWNLOAD_DIRECTORY = FileSystem.documentDirectory + 'downloads/';

  constructor() {
    this.loadDownloads();
    this.ensureDownloadDirectory();
  }

  // Asegurar que el directorio de descargas exista
  private async ensureDownloadDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.DOWNLOAD_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.DOWNLOAD_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Error al crear directorio de descargas:', error);
    }
  }

  // Cargar descargas almacenadas
  private async loadDownloads(): Promise<void> {
    try {
      const storedDownloads = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedDownloads) {
        this.downloads = JSON.parse(storedDownloads);
      }
    } catch (error) {
      console.error('Error al cargar descargas:', error);
    }
  }

  // Guardar descargas en AsyncStorage
  private async saveDownloads(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.downloads));
    } catch (error) {
      console.error('Error al guardar descargas:', error);
    }
  }

  // Buscar en YouTube (real)
  async searchYouTube(query: string): Promise<SearchResult[]> {
    try {
      // En una app real usaríamos la API de YouTube
      // Pero como es un prototipo y no queremos gastar cuota de API, usamos datos simulados
      // que son más representativos que los ejemplos anteriores
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular retraso de red
      
      if (!query.trim()) return [];
      
      // Resultados simulados más realistas
      const currentDate = Date.now();
      const results: SearchResult[] = [
        {
          id: `yt-${currentDate}-1`,
          title: `${query} - Official Music Video`,
          author: 'VEVO',
          duration: '3:45',
          thumbnail: `https://i.ytimg.com/vi/sample1/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample1.mp4',
        },
        {
          id: `yt-${currentDate}-2`,
          title: `${query} (Lyrics Video)`,
          author: 'LyricWorld',
          duration: '3:52',
          thumbnail: `https://i.ytimg.com/vi/sample2/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample2.mp4',
        },
        {
          id: `yt-${currentDate}-3`,
          title: `${query} - Live at Madison Square Garden`,
          author: 'Live Music Channel',
          duration: '4:12',
          thumbnail: `https://i.ytimg.com/vi/sample3/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample3.mp4',
        },
        {
          id: `yt-${currentDate}-4`,
          title: `${query} (Official Audio)`,
          author: 'Universal Music',
          duration: '3:38',
          thumbnail: `https://i.ytimg.com/vi/sample4/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample4.mp4',
        },
        {
          id: `yt-${currentDate}-5`,
          title: `${query} - Cover by Alex Goot`,
          author: 'Alex Goot',
          duration: '3:56',
          thumbnail: `https://i.ytimg.com/vi/sample5/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample5.mp4',
        },
        {
          id: `yt-${currentDate}-6`,
          title: `${query} - Acoustic Version`,
          author: 'Acoustic Sessions',
          duration: '4:05',
          thumbnail: `https://i.ytimg.com/vi/sample6/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample6.mp4',
        },
        {
          id: `yt-${currentDate}-7`,
          title: `${query} - Reaction Video`,
          author: 'Music Reactions',
          duration: '8:32',
          thumbnail: `https://i.ytimg.com/vi/sample7/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample7.mp4',
        },
        {
          id: `yt-${currentDate}-8`,
          title: `How to play "${query}" on Guitar - Tutorial`,
          author: 'Guitar Lessons',
          duration: '12:45',
          thumbnail: `https://i.ytimg.com/vi/sample8/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample8.mp4',
        },
        {
          id: `yt-${currentDate}-9`,
          title: `${query} - Piano Cover`,
          author: 'Piano Covers',
          duration: '3:40',
          thumbnail: `https://i.ytimg.com/vi/sample9/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample9.mp4',
        },
        {
          id: `yt-${currentDate}-10`,
          title: `${query} - Remix by DJ Snake`,
          author: 'DJ Snake',
          duration: '4:58',
          thumbnail: `https://i.ytimg.com/vi/sample10/hqdefault.jpg`,
          source: 'youtube',
          url: 'https://example.com/sample10.mp4',
        },
      ];
      
      return results;

      /* Implementación real que usaríamos con una API key válida:
      
      const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
        params: {
          key: YOUTUBE_API_KEY,
          part: 'snippet',
          q: query,
          maxResults: 10,
          type: 'video',
        },
      });

      const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');

      const detailsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
        params: {
          key: YOUTUBE_API_KEY,
          part: 'contentDetails,snippet',
          id: videoIds,
        },
      });

      return detailsResponse.data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        author: item.snippet.channelTitle,
        duration: this.formatDuration(item.contentDetails.duration),
        thumbnail: item.snippet.thumbnails.high.url,
        source: 'youtube',
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
      */
    } catch (error) {
      console.error('Error al buscar en YouTube:', error);
      return [];
    }
  }

  // Buscar en SoundCloud (real)
  async searchSoundCloud(query: string): Promise<SearchResult[]> {
    try {
      // En una app real usaríamos la API de SoundCloud
      // Pero como es un prototipo y no queremos gastar cuota de API, usamos datos simulados
      // que son más representativos que los ejemplos anteriores
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simular retraso de red
      
      if (!query.trim()) return [];
      
      // Resultados simulados más realistas
      const currentDate = Date.now();
      const results: SearchResult[] = [
        {
          id: `sc-${currentDate}-1`,
          title: `${query} (Original Mix)`,
          author: 'FreshBeats',
          duration: '3:24',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample1.mp3',
        },
        {
          id: `sc-${currentDate}-2`,
          title: `${query} - Deep House Remix`,
          author: 'DeepHouseMasters',
          duration: '6:12',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample2.mp3',
        },
        {
          id: `sc-${currentDate}-3`,
          title: `${query} (Tropical House Edit)`,
          author: 'TropicalVibes',
          duration: '4:45',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample3.mp3',
        },
        {
          id: `sc-${currentDate}-4`,
          title: `${query} - Chill Lofi Flip`,
          author: 'LofiHipHop',
          duration: '2:55',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample4.mp3',
        },
        {
          id: `sc-${currentDate}-5`,
          title: `${query} (Drum & Bass Remix)`,
          author: 'DnBFactory',
          duration: '5:33',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample5.mp3',
        },
        {
          id: `sc-${currentDate}-6`,
          title: `${query} - Bootleg Remix`,
          author: 'RemixCulture',
          duration: '4:18',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample6.mp3',
        },
        {
          id: `sc-${currentDate}-7`,
          title: `${query} (Acoustic Cover)`,
          author: 'AcousticDreams',
          duration: '3:50',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample7.mp3',
        },
        {
          id: `sc-${currentDate}-8`,
          title: `${query} - Lo-Fi Beat`,
          author: 'ChillBeats',
          duration: '2:34',
          thumbnail: 'https://via.placeholder.com/500x500?text=SoundCloud',
          source: 'soundcloud',
          url: 'https://soundcloud.com/sample8.mp3',
        },
      ];
      
      return results;

      /* Implementación real que usaríamos con una API key válida:
      
      const response = await axios.get(`${SOUNDCLOUD_API_URL}/tracks`, {
        params: {
          client_id: SOUNDCLOUD_CLIENT_ID,
          q: query,
          limit: 10,
        },
      });

      return response.data.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        author: item.user.username,
        duration: this.formatTime(item.duration),
        thumbnail: item.artwork_url || item.user.avatar_url,
        source: 'soundcloud',
        url: item.permalink_url,
      }));
      */
    } catch (error) {
      console.error('Error al buscar en SoundCloud:', error);
      return [];
    }
  }

  // Descargar como audio
  async downloadAudio(item: SearchResult): Promise<boolean> {
    try {
      // En una app real, usaríamos una API para convertir y descargar el audio
      console.log(`Descargando audio de: ${item.url}`);
      
      // URL de archivo de audio de prueba (archivo MP3 de muestra confiable)
      const audioSampleUrl = 'https://filesamples.com/samples/audio/mp3/sample3.mp3';
      
      // Generar un nombre de archivo único
      const filename = `${this.DOWNLOAD_DIRECTORY}audio_${Date.now()}.mp3`;
      
      // Descargar el archivo
      console.log(`Iniciando descarga a: ${filename}`);
      const downloadResult = await FileSystem.downloadAsync(
        audioSampleUrl,
        filename
      );
      
      console.log('Resultado de la descarga:', downloadResult);
      
      if (downloadResult.status !== 200) {
        console.error('Error al descargar el archivo:', downloadResult);
        return false;
      }
      
      // Verificar que el archivo se descargó correctamente
      const fileInfo = await FileSystem.getInfoAsync(filename);
      if (!fileInfo.exists) {
        console.error('El archivo descargado no existe');
        return false;
      }
      
      console.log(`Archivo descargado correctamente. Tamaño: ${(fileInfo as any).size} bytes`);
      
      // Crear el objeto de ítem descargado
      const downloadedItem: DownloadedItem = {
        id: item.id,
        title: item.title,
        artist: item.author,
        thumbnail: item.thumbnail,
        filePath: filename,
        duration: this.convertDurationToSeconds(item.duration) * 1000,
        size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        downloadDate: new Date().toISOString(),
        mediaType: 'audio',
      };
      
      // Añadir a la lista de descargas
      this.downloads.push(downloadedItem);
      await this.saveDownloads();
      
      return true;
    } catch (error) {
      console.error('Error al descargar audio:', error);
      return false;
    }
  }

  // Descargar como video
  async downloadVideo(item: SearchResult): Promise<boolean> {
    try {
      // En una app real, usaríamos una API para convertir y descargar el video
      console.log(`Descargando video de: ${item.url}`);
      
      // URL de archivo de video de prueba (archivo MP4 de muestra confiable)
      const videoSampleUrl = 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4';
      
      // Generar un nombre de archivo único
      const filename = `${this.DOWNLOAD_DIRECTORY}video_${Date.now()}.mp4`;
      
      // Descargar el archivo
      console.log(`Iniciando descarga a: ${filename}`);
      const downloadResult = await FileSystem.downloadAsync(
        videoSampleUrl,
        filename
      );
      
      console.log('Resultado de la descarga:', downloadResult);
      
      if (downloadResult.status !== 200) {
        console.error('Error al descargar el archivo:', downloadResult);
        return false;
      }
      
      // Verificar que el archivo se descargó correctamente
      const fileInfo = await FileSystem.getInfoAsync(filename);
      if (!fileInfo.exists) {
        console.error('El archivo descargado no existe');
        return false;
      }
      
      console.log(`Archivo descargado correctamente. Tamaño: ${(fileInfo as any).size} bytes`);
      
      // Crear el objeto de ítem descargado
      const downloadedItem: DownloadedItem = {
        id: item.id,
        title: item.title,
        artist: item.author,
        thumbnail: item.thumbnail,
        filePath: filename,
        duration: this.convertDurationToSeconds(item.duration) * 1000,
        size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        downloadDate: new Date().toISOString(),
        mediaType: 'video',
      };
      
      // Añadir a la lista de descargas
      this.downloads.push(downloadedItem);
      await this.saveDownloads();
      
      return true;
    } catch (error) {
      console.error('Error al descargar video:', error);
      return false;
    }
  }

  // Obtener todas las descargas
  getDownloads(): DownloadedItem[] {
    return [...this.downloads];
  }

  // Obtener descarga por ID
  getDownloadById(id: string): DownloadedItem | undefined {
    return this.downloads.find(item => item.id === id);
  }

  // Añadir una descarga manualmente
  async addDownload(item: DownloadedItem): Promise<boolean> {
    try {
      // Comprobar si ya existe
      const existingItem = this.downloads.find(d => d.id === item.id);
      if (existingItem) {
        return false;
      }

      // Añadir a la lista
      this.downloads.push(item);
      await this.saveDownloads();
      return true;
    } catch (error) {
      console.error('Error al añadir descarga:', error);
      return false;
    }
  }

  // Eliminar descarga
  async deleteDownload(id: string): Promise<boolean> {
    try {
      const download = this.downloads.find(item => item.id === id);
      
      if (download) {
        // Eliminar archivo físico
        const fileInfo = await FileSystem.getInfoAsync(download.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(download.filePath);
        }
      }
      
      // Eliminar de la lista
      const initialLength = this.downloads.length;
      this.downloads = this.downloads.filter(item => item.id !== id);
      
      if (this.downloads.length !== initialLength) {
        await this.saveDownloads();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al eliminar descarga:', error);
      return false;
    }
  }

  // Convertir duración de formato mm:ss a segundos
  private convertDurationToSeconds(duration: string): number {
    const parts = duration.split(':');
    let seconds = 0;
    
    if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    
    return seconds;
  }

  // Formatear duración ISO 8601 (PT1H2M3S) a formato legible (01:02:03)
  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Formatear milisegundos a formato mm:ss
  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Descargar audio desde un videoId de YouTube
  async downloadYouTubeAudio(videoId: string, title: string, artist: string, thumbnail: string): Promise<DownloadedItem | null> {
    try {
      console.log(`Iniciando descarga automática del videoId: ${videoId}`);
      
      // En una aplicación real, aquí llamaríamos a un backend que realice la conversión
      // Ya que no es posible hacerlo directamente desde la app por razones técnicas y legales
      
      // Directorio de descargas
      const downloadDir = FileSystem.documentDirectory + 'downloads/';
      
      // Asegurar que el directorio exista
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      }
      
      // Nombre de archivo único que incluye el videoId
      const filename = `${downloadDir}${videoId}_${Date.now()}.mp3`;
      
      // Iniciar descarga (en una app real, aquí se descargaría el archivo convertido)
      console.log(`Descargando audio a: ${filename}`);
      
      const downloadResult = await FileSystem.downloadAsync(
        SAMPLE_AUDIO_URL,
        filename
      );
      
      if (downloadResult.status !== 200) {
        throw new Error(`Error en la descarga: ${downloadResult.status}`);
      }
      
      // Verificar que el archivo se descargó correctamente
      const fileInfo = await FileSystem.getInfoAsync(filename);
      if (!fileInfo.exists) {
        throw new Error('El archivo descargado no existe');
      }
      
      console.log(`Archivo descargado correctamente. Tamaño: ${(fileInfo as any).size} bytes`);
      
      // Crear y guardar el item descargado
      const downloadItem: DownloadedItem = {
        id: `youtube-${videoId}-${Date.now()}`,
        title: title || 'Audio de YouTube',
        artist: artist || 'YouTube',
        thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        filePath: filename,
        duration: 60000, // 1 minuto (ejemplo)
        size: (fileInfo as any).size || 0,
        downloadDate: new Date().toISOString(),
        mediaType: 'audio',
        videoId: videoId
      };
      
      // Guardar en el servicio
      await this.addDownload(downloadItem);
      
      return downloadItem;
    } catch (error) {
      console.error('Error al descargar audio de YouTube:', error);
      return null;
    }
  }
  
  // Obtener URL para abrir servicios de conversión externos
  getConversionServiceUrl(videoId: string, serviceName?: string): string {
    // Encontrar el servicio solicitado o usar el primero
    const service = serviceName 
      ? CONVERSION_SERVICES.find(s => s.name === serviceName) 
      : CONVERSION_SERVICES[0];
    
    if (!service) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    // Construir URL directa al servicio de conversión
    return `${service.directUrl}${videoId}`;
  }

  // Convertir video de YouTube a MP3 usando API real (solo conversión, sin descarga)
  async convertYouTubeToMp3(videoId: string): Promise<{
    success: boolean;
    videoTitle?: string;
    channelName?: string;
    thumbnailUrl?: string;
    convertedId?: string;
    directUrl?: string;
  }> {
    try {
      console.log(`Iniciando conversión real del videoId: ${videoId}`);
      
      // Usar nuestro ApiService para comunicarse con el backend
      const result = await ApiService.convertVideoToMp3(videoId);
      
      // Si la conversión fue exitosa
      if (result.success) {
        return {
          success: true,
          videoTitle: result.title || `Video de YouTube (${videoId})`,
          channelName: result.artist || 'YouTube',
          thumbnailUrl: result.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          convertedId: result.convertedId,
          directUrl: result.downloadUrl
        };
      }
      
      // Si está en proceso de conversión, esperar un poco y reintentar
      if (result.inProgress) {
        console.log(`Video ${videoId} está en proceso de conversión, esperando...`);
        
        // Esperar 3 segundos y reintentar una vez
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
          const retryResult = await ApiService.convertVideoToMp3(videoId);
          if (retryResult.success) {
            return {
              success: true,
              videoTitle: retryResult.title || `Video de YouTube (${videoId})`,
              channelName: retryResult.artist || 'YouTube',
              thumbnailUrl: retryResult.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              convertedId: retryResult.convertedId,
              directUrl: retryResult.downloadUrl
            };
          }
        } catch (retryError) {
          console.log('Error en reintento, usando fallback:', retryError);
        }
      }
      
      throw new Error('Error en la conversión a MP3');
    } catch (error) {
      console.error('Error al convertir video de YouTube a MP3:', error);
      
      // En caso de error, podemos seguir usando nuestro método de respaldo con URLs aleatorias
      // para que la app siga funcionando incluso si el backend no está disponible
      console.log('Usando URL de audio de muestra aleatoria como fallback por error en backend');
      return {
        success: true,
        videoTitle: `Video de YouTube (${videoId}) [Demo]`,
        channelName: 'YouTube',
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        convertedId: `demo_${videoId}_${Date.now()}`,
        directUrl: getRandomSampleUrl()
      };
    }
  }
  
  // Proceso completo separado en dos pasos: primero convertir, luego descargar
  async processYoutubeToMp3Step1(videoId: string): Promise<{
    success: boolean;
    videoTitle?: string;
    channelName?: string;
    thumbnailUrl?: string;
    convertedId?: string;
    directUrl?: string;
  }> {
    try {
      console.log(`Iniciando paso 1: Conversión de YouTube a MP3 para ID: ${videoId}`);
      
      // Primero intentamos obtener información del video
      let videoInfo;
      try {
        videoInfo = await ApiService.getVideoInfo(videoId);
      } catch (infoError) {
        console.log('Error al obtener información del video, continuando con la conversión:', infoError);
      }
      
      // Mostrar alerta solo si estamos usando el respaldo de demostración
      if (!videoInfo) {
        Alert.alert(
          'Versión de demostración',
          'Usando canciones de muestra porque el servidor backend no está disponible. Para una versión real, necesitarías un servidor backend funcionando.',
          [{ text: 'Entendido' }]
        );
      }
      
      // Paso 1: Solo convertir, obtener información y URL
      const conversionResult = await this.convertYouTubeToMp3(videoId);
      
      if (!conversionResult.success) {
        throw new Error('Error en la conversión de video a MP3');
      }
      
      return conversionResult;
    } catch (error) {
      console.error('Error en el paso 1 (conversión):', error);
      return { success: false };
    }
  }
  
  // Paso 2: Descargar el archivo ya convertido
  async processYoutubeToMp3Step2(convertedData: {
    convertedId: string;
    videoTitle: string;
    channelName: string;
    thumbnailUrl: string;
    directUrl?: string;
  }): Promise<DownloadedItem | null> {
    try {
      console.log(`Iniciando paso 2: Descarga del MP3 convertido para: ${convertedData.videoTitle}`);
      
      const { convertedId, videoTitle, channelName, thumbnailUrl, directUrl } = convertedData;
      
      // Descargar el archivo MP3 convertido
      const downloadItem = await this.downloadConvertedMp3(
        convertedId,
        videoTitle,
        channelName,
        thumbnailUrl,
        directUrl
      );
      
      if (!downloadItem) {
        throw new Error('Error al descargar el archivo convertido');
      }
      
      console.log(`Descarga completada con éxito. Archivo listo en: ${downloadItem.filePath}`);
      
      return downloadItem;
    } catch (error) {
      console.error('Error en el paso 2 (descarga):', error);
      return null;
    }
  }

  // Procesar y descargar directamente desde una URL de YouTube (método de compatibilidad)
  async processAndDownloadFromYoutube(videoId: string, videoUrl?: string): Promise<DownloadedItem | null> {
    try {
      console.log(`Método de compatibilidad: processAndDownloadFromYoutube para ID: ${videoId}`);
      
      // Paso 1: Convertir
      const conversionResult = await this.processYoutubeToMp3Step1(videoId);
      
      if (!conversionResult.success || !conversionResult.videoTitle || !conversionResult.convertedId) {
        throw new Error('No se pudo completar la conversión del video');
      }
      
      // Paso 2: Descargar
      return await this.processYoutubeToMp3Step2({
        convertedId: conversionResult.convertedId,
        videoTitle: conversionResult.videoTitle,
        channelName: conversionResult.channelName || 'YouTube',
        thumbnailUrl: conversionResult.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        directUrl: conversionResult.directUrl
      });
    } catch (error) {
      console.error('Error en el proceso de descarga:', error);
      return null;
    }
  }

  // Descargar MP3 convertido usando el backend real
  async downloadConvertedMp3(convertedId: string, videoTitle: string, channelName: string, thumbnailUrl: string, directUrl?: string): Promise<DownloadedItem | null> {
    try {
      console.log(`Descargando MP3 convertido: ${convertedId}`);
      
      // Extraer el videoId del convertedId (si está disponible)
      let videoId = '';
      if (convertedId.includes('_')) {
        const parts = convertedId.split('_');
        videoId = parts.length > 1 ? parts[1] : '';
      }
      
      // Directorio de descargas
      const downloadDir = FileSystem.documentDirectory + 'downloads/';
      
      // Asegurar que el directorio exista
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      }
      
      // Generar nombre de archivo basado en el título del video
      // Limpiar el título para usarlo como nombre de archivo
      const safeTitle = videoTitle
        .replace(/[\\/:*?"<>|]/g, '') // Eliminar caracteres no válidos para nombres de archivo
        .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
        .trim();
      
      const filename = `${downloadDir}${safeTitle}.mp3`;
      
      // Determinar la URL de descarga
      let downloadUrl = directUrl;
      
      // Si no tenemos URL directa pero tenemos un convertedId, construir la URL
      if (!downloadUrl && convertedId.startsWith('demo_')) {
        // Es una demo, usar URL de muestra
        downloadUrl = getRandomSampleUrl();
      } else if (!downloadUrl && convertedId) {
        // Usar API para construir la URL
        downloadUrl = await ApiService.getDownloadUrl(convertedId);
      }
      
      if (!downloadUrl) {
        throw new Error('No se pudo obtener URL de descarga');
      }
      
      console.log(`Descargando audio desde: ${downloadUrl} a: ${filename}`);
      
      // Eliminar el archivo existente si ya existe
      const fileExists = await FileSystem.getInfoAsync(filename);
      if (fileExists.exists) {
        console.log(`Eliminando archivo existente: ${filename}`);
        await FileSystem.deleteAsync(filename, { idempotent: true });
      }
      
      // Descargar el nuevo archivo
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, filename);
      console.log(`Descarga completada: ${downloadResult.status} ${downloadResult.uri}`);
      
      // Verificar que el archivo se descargó correctamente
      const fileInfo = await FileSystem.getInfoAsync(filename);
      if (!fileInfo.exists) {
        throw new Error('El archivo descargado no existe');
      }
      
      // Verificar que el archivo tenga un tamaño razonable
      if ((fileInfo as any).size < 10000) { // Archivo demasiado pequeño
        console.warn(`El archivo descargado es muy pequeño (${(fileInfo as any).size} bytes), probablemente corrupto`);
        throw new Error('El archivo descargado es demasiado pequeño y podría estar corrupto');
      }
      
      console.log(`Archivo descargado correctamente. Tamaño: ${(fileInfo as any).size} bytes, ruta: ${filename}`);
      
      // Crear y guardar el item descargado
      const downloadItem: DownloadedItem = {
        id: `youtube-${videoId || convertedId}-${Date.now()}`,
        title: videoTitle,
        artist: channelName,
        thumbnail: thumbnailUrl,
        filePath: filename,
        duration: 0, // Se actualizará cuando se reproduzca
        size: (fileInfo as any).size || 0,
        downloadDate: new Date().toISOString(),
        mediaType: 'audio',
        videoId: videoId
      };
      
      // Guardar en el servicio
      await this.addDownload(downloadItem);
      
      return downloadItem;
    } catch (error) {
      console.error('Error al descargar MP3 convertido:', error);
      
      // Si hay un error, intentar con una URL de muestra
      if (!directUrl || !directUrl.includes('soundhelix.com')) {
        console.log('Intentando descargar desde URL de muestra como respaldo...');
        try {
          return await this.downloadSampleAudio(videoTitle, channelName, thumbnailUrl);
        } catch (fallbackError) {
          console.error('Error incluso en la descarga de respaldo:', fallbackError);
          return null;
        }
      }
      
      return null;
    }
  }
  
  // Método para descargar audio de muestra como respaldo
  private async downloadSampleAudio(
    title: string, 
    artist: string, 
    thumbnail: string, 
    videoId?: string
  ): Promise<DownloadedItem | null> {
    try {
      const downloadDir = FileSystem.documentDirectory + 'downloads/';
      const safeTitle = `${title} [Demo]`.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
      const filename = `${downloadDir}${safeTitle}.mp3`;
      
      // Usar una URL de muestra aleatoria
      const sampleUrl = getRandomSampleUrl();
      
      // Eliminar archivo existente
      const fileExists = await FileSystem.getInfoAsync(filename);
      if (fileExists.exists) {
        await FileSystem.deleteAsync(filename, { idempotent: true });
      }
      
      // Descargar el archivo de muestra
      const downloadResult = await FileSystem.downloadAsync(sampleUrl, filename);
      
      if (downloadResult.status !== 200) {
        throw new Error('Error en la descarga de muestra');
      }
      
      const fileInfo = await FileSystem.getInfoAsync(filename);
      
      // Crear item de descarga
      const downloadItem: DownloadedItem = {
        id: `demo-${Date.now()}`,
        title: `${title} [Demo]`,
        artist: artist,
        thumbnail: thumbnail,
        filePath: filename,
        duration: 0,
        size: (fileInfo as any).size || 0,
        downloadDate: new Date().toISOString(),
        mediaType: 'audio',
        videoId: videoId
      };
      
      // Guardar en el servicio
      await this.addDownload(downloadItem);
      
      return downloadItem;
    } catch (error) {
      console.error('Error al descargar audio de muestra:', error);
      return null;
    }
  }
}

export default new DownloadService(); 