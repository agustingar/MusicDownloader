// Servidor principal para Railway
// Este archivo inicia el servidor desde la raíz

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Music Downloader Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint para convertir YouTube a MP3
app.post('/api/convert', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const outputId = uuidv4();
  const outputPath = path.join(__dirname, 'downloads', `${outputId}.mp3`);
  
  // Crear directorio downloads si no existe
  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  try {
    console.log(`🎵 Convirtiendo: ${url}`);
    
    // Usar yt-dlp para descargar y convertir
    const ytDlp = spawn('yt-dlp', [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '192K',
      '--output', outputPath.replace('.mp3', '.%(ext)s'),
      url
    ]);

    let stderr = '';
    
    ytDlp.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('yt-dlp:', data.toString());
    });

    ytDlp.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Conversión completada: ${outputId}`);
        res.json({
          success: true,
          downloadId: outputId,
          message: 'Conversión completada'
        });
      } else {
        console.error(`❌ Error en conversión: ${stderr}`);
        res.status(500).json({
          error: 'Error en la conversión',
          details: stderr
        });
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para descargar el archivo MP3
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, 'downloads', `${id}.mp3`);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, `audio_${id}.mp3`, (err) => {
      if (err) {
        console.error('❌ Error al descargar:', err);
        res.status(500).json({ error: 'Error al descargar el archivo' });
      }
    });
  } else {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Music Downloader API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      convert: 'POST /api/convert',
      download: 'GET /api/download/:id'
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Music Downloader corriendo en puerto ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
}); 