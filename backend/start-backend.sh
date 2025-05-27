#!/bin/bash

# Script para iniciar el backend de Music Downloader
echo "🚀 Iniciando Music Downloader Backend..."

# Verificar que estamos en el directorio correcto
if [ ! -f "server.js" ]; then
    echo "❌ Error: No se encontró server.js. Ejecuta este script desde el directorio backend."
    exit 1
fi

# Verificar que yt-dlp está instalado
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️ yt-dlp no está instalado. Instalando..."
    pip3 install yt-dlp
fi

# Matar procesos anteriores del servidor
echo "🔄 Deteniendo procesos anteriores..."
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Crear directorio de descargas si no existe
mkdir -p downloads

# Iniciar el servidor
echo "▶️ Iniciando servidor en puerto 3000..."
node server.js &

# Esperar un momento para que el servidor se inicie
sleep 3

# Verificar que el servidor está funcionando
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Servidor iniciado correctamente en http://localhost:3000"
    echo "📊 Estado del servidor:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
    echo ""
    echo "🎵 ¡Backend listo para convertir videos de YouTube!"
else
    echo "❌ Error: El servidor no pudo iniciarse correctamente"
    exit 1
fi 