// Configuración de API para Music Downloader
// Cambia esta URL por tu IP local para usar desde iPhone

// Para desarrollo local (mismo dispositivo)
// export const API_BASE_URL = 'http://localhost:3000';

// Para iPhone en la misma red WiFi (reemplaza con tu IP local)
export const API_BASE_URL = 'http://192.168.0.54:3000';

// Función para obtener la IP local automáticamente (solo para referencia)
// En producción, deberías configurar esto manualmente
export const getLocalIP = async (): Promise<string> => {
  try {
    // Esta función solo funciona en desarrollo
    // En producción, usa la IP configurada arriba
    return API_BASE_URL.replace('http://', '').replace(':3000', '');
  } catch (error) {
    console.error('Error obteniendo IP local:', error);
    return 'localhost';
  }
};

// Endpoints de la API
export const API_ENDPOINTS = {
  // Salud del servidor
  HEALTH: '/health',
  
  // Conversión de YouTube
  CONVERT_YOUTUBE: '/api/convert-youtube',
  CONVERSION_STATUS: '/api/conversion-status',
  
  // Descarga de archivos
  DOWNLOAD: '/downloads',
  
  // Limpieza
  CLEAR_ACTIVE: '/api/clear-active-conversions',
  CLEAR_COMPLETED: '/api/clear-completed-conversions',
};

// Configuración de timeouts
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Función para verificar si el servidor está disponible
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(buildApiUrl(API_ENDPOINTS.HEALTH), {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    
    return false;
  } catch (error) {
    console.error('Error verificando salud del servidor:', error);
    return false;
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  buildApiUrl,
  checkServerHealth,
  getLocalIP,
}; 