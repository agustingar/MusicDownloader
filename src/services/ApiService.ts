// Servicio para comunicarse con el backend
import axios from 'axios';

// URLs de backend disponibles (en orden de prioridad)
const BACKEND_URLS = [
  'http://localhost:3000', // Servidor local (primera prioridad)
  'https://musicdownloader-85gv.onrender.com', // Render - Funcionando perfectamente
  'http://192.168.0.54:3000', // IP local para dispositivos en la misma red
  'https://musicdownloader-production-6a60.up.railway.app', // Railway - Con problemas
  'https://tu-dominio.com', // Tu servidor propio (cambiar por tu dominio real)
];

class ApiService {
  private baseUrl: string = '';
  private isInitialized: boolean = false;

  // Inicializar y encontrar el backend disponible
  async initialize() {
    if (this.isInitialized) return;

    console.log('🔍 Buscando servidor backend disponible...');
    
    for (const url of BACKEND_URLS) {
      try {
        console.log(`⏳ Probando: ${url}`);
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        
        if (response.status === 200) {
          this.baseUrl = url;
          this.isInitialized = true;
          console.log(`✅ Backend encontrado: ${url}`);
          console.log(`📊 Estado del servidor:`, response.data);
          return;
        }
      } catch (error) {
        console.log(`❌ No disponible: ${url}`);
        continue;
      }
    }
    
    // Si no se encuentra ningún backend, usar el primero como fallback
    this.baseUrl = BACKEND_URLS[0];
    this.isInitialized = true;
    console.warn('⚠️ No se encontró ningún backend disponible. Usando fallback:', this.baseUrl);
  }

  // Asegurar que el servicio esté inicializado
  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Obtener información de un video de YouTube
  async getVideoInfo(videoId: string) {
    await this.ensureInitialized();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/info/${videoId}`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del video:', error);
      throw error;
    }
  }

  // Convertir un video de YouTube a MP3
  async convertVideoToMp3(videoId: string) {
    await this.ensureInitialized();
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/convert`, 
        { videoId }, 
        { timeout: 30000 } // 30 segundos para conversión
      );
      return response.data;
    } catch (error) {
      console.error('Error al convertir video a MP3:', error);
      throw error;
    }
  }

  // Verificar el estado de una conversión
  async checkConversionStatus(convertedId: string) {
    await this.ensureInitialized();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/status/${convertedId}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error al verificar estado de conversión:', error);
      throw error;
    }
  }

  // Obtener URL de descarga
  async getDownloadUrl(convertedId: string) {
    await this.ensureInitialized();
    return `${this.baseUrl}/downloads/${convertedId}.mp3`;
  }

  // Verificar salud del backend
  async checkHealth() {
    await this.ensureInitialized();
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error al verificar salud del backend:', error);
      throw error;
    }
  }

  // Obtener URL base actual
  getBaseUrl() {
    return this.baseUrl;
  }
}

export default new ApiService(); 