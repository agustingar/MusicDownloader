import { useState, useCallback, useRef } from 'react';
import DownloadService from '../services/DownloadService';
import ApiService from '../services/ApiService';

interface ConversionStep {
  step: 'idle' | 'connecting' | 'converting' | 'downloading' | 'completed' | 'error';
  progress: number;
  message: string;
  title?: string;
  error?: string;
  percentage?: string;
  timeRemaining?: string;
  downloadSpeed?: string;
}

interface ConversionResult {
  success: boolean;
  downloadedItem?: any;
  error?: string;
}

export const useYouTubeConverter = () => {
  const [conversionState, setConversionState] = useState<ConversionStep>({
    step: 'idle',
    progress: 0,
    message: ''
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const startTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const resetState = useCallback(() => {
    setConversionState({
      step: 'idle',
      progress: 0,
      message: ''
    });
    setIsModalVisible(false);
    startTimeRef.current = 0;
    isProcessingRef.current = false;
  }, []);

  // Función para calcular tiempo restante (optimizada)
  const calculateTimeRemaining = useCallback((currentProgress: number, elapsedTime: number): string => {
    if (currentProgress <= 0.1) return 'Calculando...';
    
    const totalEstimatedTime = elapsedTime / currentProgress;
    const remainingTime = totalEstimatedTime - elapsedTime;
    
    if (remainingTime <= 1000) return 'Finalizando...';
    
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s restantes`;
    } else {
      return `${seconds}s restantes`;
    }
  }, []);

  // Función para calcular velocidad de descarga (optimizada)
  const calculateDownloadSpeed = useCallback((progress: number, elapsedTime: number): string => {
    if (elapsedTime <= 1000 || progress <= 0.1) return '';
    
    // Estimamos un tamaño promedio de archivo MP3 de 4MB
    const estimatedFileSize = 4 * 1024 * 1024; // 4MB en bytes
    const downloadedBytes = estimatedFileSize * progress;
    const speedBytesPerSecond = downloadedBytes / (elapsedTime / 1000);
    
    if (speedBytesPerSecond < 1024) {
      return `${Math.round(speedBytesPerSecond)} B/s`;
    } else if (speedBytesPerSecond < 1024 * 1024) {
      return `${Math.round(speedBytesPerSecond / 1024)} KB/s`;
    } else {
      return `${(speedBytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  }, []);

  const convertAndDownload = useCallback(async (
    videoId: string, 
    videoTitle?: string
  ): Promise<ConversionResult> => {
    // Evitar múltiples ejecuciones simultáneas
    if (isProcessingRef.current) {
      console.log('Ya hay una conversión en proceso');
      return { success: false, error: 'Ya hay una conversión en proceso' };
    }

    try {
      isProcessingRef.current = true;
      setIsModalVisible(true);
      startTimeRef.current = Date.now();
      
      // Paso 1: Conectando al servidor
      setConversionState({
        step: 'connecting',
        progress: 0.1,
        message: 'Conectando al servidor...',
        title: 'Iniciando Conversión',
        percentage: '10%',
        timeRemaining: 'Calculando...'
      });

      // Verificar que el backend esté disponible
      let backendAvailable = true;
      try {
        await ApiService.checkHealth();
      } catch (error) {
        console.log('Backend no disponible, usando modo demo');
        backendAvailable = false;
      }

      // Paso 2: Convirtiendo
      setConversionState({
        step: 'converting',
        progress: 0.3,
        message: 'Convirtiendo video a MP3...',
        title: 'Procesando Video',
        percentage: '30%',
        timeRemaining: 'Calculando...'
      });

      // Progreso de conversión más suave
      const conversionSteps = [35, 40, 45, 50, 55, 60];
      for (const step of conversionSteps) {
        if (!isProcessingRef.current) break; // Salir si se cancela
        
        await new Promise(resolve => setTimeout(resolve, 300));
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current;
        const currentProgress = step / 100;
        
        setConversionState(prev => ({
          ...prev,
          progress: currentProgress,
          message: `Convirtiendo video a MP3...`,
          percentage: `${step}%`,
          timeRemaining: calculateTimeRemaining(currentProgress, elapsedTime),
          downloadSpeed: ''
        }));
      }

      // Ejecutar conversión real
      const conversionResult = await DownloadService.processYoutubeToMp3Step1(videoId);

      if (!conversionResult.success) {
        throw new Error('Error en la conversión del video');
      }

      // Paso 3: Descargando
      setConversionState({
        step: 'downloading',
        progress: 0.7,
        message: 'Descargando archivo MP3...',
        title: `Descargando: ${conversionResult.videoTitle || videoTitle || 'Audio'}`,
        percentage: '70%',
        timeRemaining: 'Calculando...',
        downloadSpeed: 'Iniciando descarga...'
      });

      // Progreso de descarga más suave
      const downloadSteps = [75, 80, 85, 90, 95];
      for (const step of downloadSteps) {
        if (!isProcessingRef.current) break; // Salir si se cancela
        
        await new Promise(resolve => setTimeout(resolve, 200));
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTimeRef.current;
        const currentProgress = step / 100;
        
        setConversionState(prev => ({
          ...prev,
          progress: currentProgress,
          message: `Descargando archivo MP3...`,
          percentage: `${step}%`,
          timeRemaining: calculateTimeRemaining(currentProgress, elapsedTime),
          downloadSpeed: calculateDownloadSpeed(currentProgress, elapsedTime)
        }));
      }

      // Ejecutar descarga real
      const downloadedItem = await DownloadService.processYoutubeToMp3Step2({
        convertedId: conversionResult.convertedId || `demo_${videoId}_${Date.now()}`,
        videoTitle: conversionResult.videoTitle || videoTitle || 'Video de YouTube',
        channelName: conversionResult.channelName || 'YouTube',
        thumbnailUrl: conversionResult.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        directUrl: conversionResult.directUrl
      });

      if (!downloadedItem) {
        throw new Error('Error al descargar el archivo');
      }

      // Paso 4: Completado
      const totalTime = Date.now() - startTimeRef.current;
      const totalTimeFormatted = totalTime < 60000 
        ? `${Math.round(totalTime / 1000)}s` 
        : `${Math.floor(totalTime / 60000)}m ${Math.round((totalTime % 60000) / 1000)}s`;

      setConversionState({
        step: 'completed',
        progress: 1,
        message: `¡Descarga completada en ${totalTimeFormatted}!`,
        title: `✅ ${downloadedItem.title}`,
        percentage: '100%',
        timeRemaining: 'Completado',
        downloadSpeed: 'Finalizado'
      });

      // Auto-cerrar después de 2 segundos
      setTimeout(() => {
        if (isProcessingRef.current) {
          resetState();
        }
      }, 2000);

      return {
        success: true,
        downloadedItem
      };

    } catch (error) {
      console.error('Error en conversión:', error);
      
      setConversionState({
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Error desconocido',
        title: 'Error en la Conversión',
        error: error instanceof Error ? error.message : 'Error desconocido',
        percentage: '0%',
        timeRemaining: 'Error',
        downloadSpeed: 'Error'
      });

      // Auto-cerrar error después de 3 segundos
      setTimeout(() => {
        if (isProcessingRef.current) {
          resetState();
        }
      }, 3000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }, [resetState, calculateTimeRemaining, calculateDownloadSpeed]);

  const getModalType = useCallback((): 'info' | 'success' | 'error' | 'loading' | 'progress' => {
    switch (conversionState.step) {
      case 'connecting':
      case 'converting':
      case 'downloading':
        return 'progress';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }, [conversionState.step]);

  const getModalTitle = useCallback(() => {
    return conversionState.title || 'Procesando...';
  }, [conversionState.title]);

  const getModalMessage = useCallback(() => {
    const { message, percentage, timeRemaining, downloadSpeed } = conversionState;
    
    // Construir mensaje detallado con porcentaje y tiempo
    let detailedMessage = message;
    
    if (percentage && percentage !== '0%' && percentage !== '10%') {
      detailedMessage += `\n\n📊 Progreso: ${percentage}`;
    }
    
    if (timeRemaining && timeRemaining !== 'Calculando...' && timeRemaining !== 'Error') {
      detailedMessage += `\n⏱️ ${timeRemaining}`;
    }
    
    if (downloadSpeed && downloadSpeed !== '' && downloadSpeed !== 'Error' && downloadSpeed !== 'Iniciando descarga...') {
      detailedMessage += `\n🚀 Velocidad: ${downloadSpeed}`;
    }
    
    return detailedMessage;
  }, [conversionState]);

  const shouldShowCloseButton = useCallback(() => {
    return conversionState.step === 'error' || conversionState.step === 'completed';
  }, [conversionState.step]);

  return {
    // Estado
    conversionState,
    isModalVisible,
    
    // Acciones
    convertAndDownload,
    resetState,
    
    // Helpers para el modal
    getModalType,
    getModalTitle,
    getModalMessage,
    shouldShowCloseButton,
    
    // Propiedades del modal
    modalProps: {
      visible: isModalVisible,
      type: getModalType(),
      title: getModalTitle(),
      message: getModalMessage(),
      progress: conversionState.progress,
      onClose: shouldShowCloseButton() ? resetState : undefined,
      autoCloseDelay: conversionState.step === 'completed' ? 2000 : undefined
    }
  };
}; 