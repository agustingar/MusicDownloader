// Servidor Node.js para convertir videos de YouTube a MP3
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Directorio para descargas
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Endpoint de salud del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Registro de conversiones activas y completadas
const activeConversions = new Set();
const completedConversions = new Map(); // videoId -> {outputId, info}

// Endpoint para obtener información del video
app.get('/api/info/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Se requiere videoId' });
  }
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    // Obtener información del video usando youtube-dl
    exec(`yt-dlp --dump-json ${videoUrl}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al obtener información: ${stderr}`);
        return res.status(500).json({ error: 'Error al obtener información del video' });
      }
      
      try {
        const videoInfo = JSON.parse(stdout);
        return res.json({
          success: true,
          videoId,
          title: videoInfo.title,
          artist: videoInfo.uploader,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration
        });
      } catch (parseError) {
        console.error('Error al parsear información:', parseError);
        return res.status(500).json({ error: 'Error al procesar información del video' });
      }
    });
  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para convertir video a MP3
app.post('/api/convert', async (req, res) => {
  const { videoId } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Se requiere videoId' });
  }
  
  // Verificar si ya está en proceso de conversión
  if (activeConversions.has(videoId)) {
    console.log(`Conversión para ${videoId} ya está en proceso - devolviendo estado`);
    // En lugar de error 409, devolver que está en proceso
    return res.json({ 
      success: false,
      inProgress: true,
      message: 'Este video ya está siendo convertido. Espera un momento.',
      videoId: videoId
    });
  }
  
  // Verificar si ya está completado
  if (completedConversions.has(videoId)) {
    const conversion = completedConversions.get(videoId);
    console.log(`Reutilizando conversión completada para ${videoId}: ${conversion.outputId}`);
    return res.json({
      success: true,
      convertedId: conversion.outputId,
      title: conversion.title,
      artist: conversion.artist,
      thumbnail: conversion.thumbnail,
      downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${conversion.outputId}.mp3`,
      reused: true
    });
  }
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputId = uuidv4();
  const outputPath = path.join(downloadsDir, `${outputId}.mp3`);
  
  console.log(`Iniciando conversión para video ${videoId}`);
  
  // Marcar como en proceso
  activeConversions.add(videoId);
  
  // Timeout de seguridad para limpiar conversiones colgadas (5 minutos)
  const timeoutId = setTimeout(() => {
    if (activeConversions.has(videoId)) {
      console.log(`Timeout: Limpiando conversión colgada para ${videoId}`);
      activeConversions.delete(videoId);
    }
  }, 5 * 60 * 1000); // 5 minutos
  
  try {
    // Comando para descargar y convertir a MP3 con yt-dlp
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath.replace('.mp3', '')}.%(ext)s" ${videoUrl}`;
    
    exec(command, (error, stdout, stderr) => {
      // Limpiar timeout
      clearTimeout(timeoutId);
      
      // Conversión finalizada, remover de activas
      activeConversions.delete(videoId);
      
      if (error) {
        console.error(`Error en la conversión: ${stderr}`);
        return res.status(500).json({ error: 'Error al convertir video a MP3' });
      }
      
      console.log(`Conversión completada: ${outputId}.mp3`);
      
      // Obtener información del video para la respuesta
      exec(`yt-dlp --dump-json ${videoUrl}`, (infoError, infoStdout) => {
        if (infoError) {
          // Si no podemos obtener la info, al menos devolvemos la URL del archivo
          const result = {
            success: true,
            convertedId: outputId,
            downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputId}.mp3`
          };
          
          // Guardar en completados
          completedConversions.set(videoId, {
            outputId,
            title: 'Unknown',
            artist: 'Unknown',
            thumbnail: ''
          });
          
          return res.json(result);
        }
        
        try {
          const videoInfo = JSON.parse(infoStdout);
          const result = {
            success: true,
            convertedId: outputId,
            title: videoInfo.title,
            artist: videoInfo.uploader,
            thumbnail: videoInfo.thumbnail,
            downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputId}.mp3`
          };
          
          // Guardar en completados
          completedConversions.set(videoId, {
            outputId,
            title: videoInfo.title,
            artist: videoInfo.uploader,
            thumbnail: videoInfo.thumbnail
          });
          
          return res.json(result);
        } catch (parseError) {
          // Si hay error al parsear, devolvemos lo básico
          const result = {
            success: true,
            convertedId: outputId,
            downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${outputId}.mp3`
          };
          
          // Guardar en completados
          completedConversions.set(videoId, {
            outputId,
            title: 'Unknown',
            artist: 'Unknown',
            thumbnail: ''
          });
          
          return res.json(result);
        }
      });
    });
  } catch (error) {
    // Limpiar timeout y eliminar de activas en caso de error
    clearTimeout(timeoutId);
    activeConversions.delete(videoId);
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint para verificar si un archivo convertido está listo
app.get('/api/status/:convertedId', (req, res) => {
  const { convertedId } = req.params;
  const filePath = path.join(downloadsDir, `${convertedId}.mp3`);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return res.json({
      success: true,
      ready: true,
      size: stats.size,
      downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${convertedId}.mp3`
    });
  } else {
    return res.json({
      success: true,
      ready: false
    });
  }
});

// Ruta para descargar archivo MP3
app.get('/downloads/:convertedId.mp3', (req, res) => {
  const { convertedId } = req.params;
  const filePath = path.join(downloadsDir, `${convertedId}.mp3`);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

// Endpoint para limpiar conversiones completadas manualmente
app.post('/api/cleanup', (req, res) => {
  const beforeCount = completedConversions.size;
  completedConversions.clear();
  
  res.json({
    success: true,
    message: `Se eliminaron ${beforeCount} conversiones completadas de la memoria`
  });
});

// Endpoint para limpiar conversiones activas (útil para debugging)
app.post('/api/clear-active', (req, res) => {
  const beforeCount = activeConversions.size;
  activeConversions.clear();
  
  res.json({
    success: true,
    message: `Se eliminaron ${beforeCount} conversiones activas`
  });
});

// Limpieza automática de archivos viejos (más de 24 horas)
const cleanupDownloads = () => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      console.error('Error al leer directorio de descargas:', err);
      return;
    }
    
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(downloadsDir, file);
      
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          console.error(`Error al obtener estadísticas de archivo ${file}:`, statErr);
          return;
        }
        
        // Eliminar archivos con más de 24 horas
        const fileAge = now - stats.mtime.getTime();
        if (fileAge > 24 * 60 * 60 * 1000) {
          fs.unlink(filePath, unlinkErr => {
            if (unlinkErr) {
              console.error(`Error al eliminar archivo antiguo ${file}:`, unlinkErr);
            } else {
              console.log(`Archivo antiguo eliminado: ${file}`);
              
              // También eliminamos referencias en completedConversions si corresponde
              for (const [videoId, data] of completedConversions.entries()) {
                if (`${data.outputId}.mp3` === file) {
                  completedConversions.delete(videoId);
                  console.log(`Referencia a conversión eliminada para video ${videoId}`);
                  break;
                }
              }
            }
          });
        }
      });
    });
  });
};

// Ejecutar limpieza cada 1 hora
setInterval(cleanupDownloads, 60 * 60 * 1000);

// Iniciar servidor - escuchar en todas las interfaces, no solo localhost
app.listen(PORT, '0.0.0.0', () => {
  // Obtener IP para mostrarla en la consola
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let ipAddress = 'localhost';
  
  // Encontrar una dirección IP no interna
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Saltar direcciones internas y no IPv4
      if (net.family === 'IPv4' && !net.internal) {
        ipAddress = net.address;
      }
    }
  }
  
  console.log(`Servidor ejecutándose en http://${ipAddress}:${PORT}`);
}); 