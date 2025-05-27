# Backend para Music Downloader

Este es un servidor backend para la aplicación Music Downloader que permite convertir videos de YouTube a MP3.

## Requisitos previos

- Node.js (versión 14 o superior)
- npm o yarn
- youtube-dl o yt-dlp (recomendado) instalado en el sistema

## Instalación de yt-dlp

### Linux/macOS
```bash
# Con pip (Python)
pip install yt-dlp

# Alternativamente, puedes descargar el binario directamente
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### Windows
```bash
# Con pip (Python)
pip install yt-dlp

# O descargar el ejecutable desde:
# https://github.com/yt-dlp/yt-dlp/releases
# Y agregarlo al PATH del sistema
```

## Instalación del servidor

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor:
```bash
npm start
```

Para desarrollo (con recarga automática):
```bash
npm run dev
```

El servidor estará disponible en http://localhost:3000

## Endpoints de la API

- `GET /api/info/:videoId` - Obtener información de un video de YouTube
- `POST /api/convert` - Convertir un video a MP3 (body: `{ "videoId": "ID_DEL_VIDEO" }`)
- `GET /api/status/:convertedId` - Verificar si un archivo convertido está listo
- `GET /downloads/:convertedId.mp3` - Descargar un archivo MP3 convertido

## Despliegue en producción

Para desplegar este servidor en un entorno de producción, considere:

1. Usar un proxy como Nginx para servir archivos estáticos
2. Configurar HTTPS para conexiones seguras
3. Usar PM2 para mantener el servidor activo
4. Considerar límites de tamaño y cuotas para evitar abusos

Ejemplo de instalación de PM2:
```bash
npm install -g pm2
pm2 start server.js --name music-downloader-backend
pm2 save
pm2 startup
``` 