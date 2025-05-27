#!/bin/bash

# Script para ejecutar el servidor backend como daemon permanente
# Para usar con builds de Xcode independientes de Expo

echo "🚀 Iniciando Music Downloader Backend como daemon..."

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

# Crear directorio de logs
mkdir -p logs

# Obtener IP local para mostrar
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

# Iniciar el servidor como daemon con logs
echo "▶️ Iniciando servidor daemon en puerto 3000..."
echo "📍 Servidor disponible en:"
echo "   - http://localhost:3000"
echo "   - http://${LOCAL_IP}:3000"

# Ejecutar servidor en background con logs
nohup node server.js > logs/server.log 2>&1 &
SERVER_PID=$!

# Guardar PID para poder detenerlo después
echo $SERVER_PID > logs/server.pid

# Esperar un momento para que el servidor se inicie
sleep 3

# Verificar que el servidor está funcionando
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Servidor daemon iniciado correctamente"
    echo "📊 Estado del servidor:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   - Ver logs: tail -f backend/logs/server.log"
    echo "   - Detener: kill \$(cat backend/logs/server.pid)"
    echo "   - Estado: curl http://localhost:3000/api/health"
    echo ""
    echo "🎵 ¡Backend daemon listo para tu app de Xcode!"
else
    echo "❌ Error: El servidor no pudo iniciarse correctamente"
    echo "📋 Revisa los logs: cat logs/server.log"
    exit 1
fi 