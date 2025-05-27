#!/bin/bash

# Script para detener el servidor backend daemon

echo "🛑 Deteniendo Music Downloader Backend daemon..."

# Verificar si existe el archivo PID
if [ -f "logs/server.pid" ]; then
    SERVER_PID=$(cat logs/server.pid)
    
    # Verificar si el proceso está ejecutándose
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "🔄 Deteniendo servidor (PID: $SERVER_PID)..."
        kill $SERVER_PID
        
        # Esperar a que termine
        sleep 2
        
        # Verificar si terminó
        if ps -p $SERVER_PID > /dev/null 2>&1; then
            echo "⚠️ Forzando cierre del servidor..."
            kill -9 $SERVER_PID
        fi
        
        echo "✅ Servidor detenido correctamente"
    else
        echo "⚠️ El servidor no estaba ejecutándose"
    fi
    
    # Limpiar archivo PID
    rm -f logs/server.pid
else
    echo "⚠️ No se encontró archivo PID. Intentando detener por nombre de proceso..."
    pkill -f "node.*server.js" 2>/dev/null || true
fi

# Verificar que no hay procesos ejecutándose en puerto 3000
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️ Aún hay procesos en puerto 3000. Forzando cierre..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

echo "🏁 Servidor completamente detenido" 