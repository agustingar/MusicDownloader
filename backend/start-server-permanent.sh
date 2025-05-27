#!/bin/bash

# Script para iniciar el servidor Music Downloader de forma permanente
# Se ejecuta en segundo plano y se reinicia automáticamente si falla

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/server.log"
ERROR_LOG="$SCRIPT_DIR/logs/server.error.log"
PID_FILE="$SCRIPT_DIR/server.pid"

# Crear directorio de logs si no existe
mkdir -p "$SCRIPT_DIR/logs"

# Función para limpiar al salir
cleanup() {
    echo "Deteniendo servidor..."
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        kill $PID 2>/dev/null
        rm -f "$PID_FILE"
    fi
    exit 0
}

# Configurar trap para limpiar al salir
trap cleanup SIGTERM SIGINT

# Función para iniciar el servidor
start_server() {
    echo "$(date): Iniciando servidor Music Downloader..." >> "$LOG_FILE"
    
    cd "$SCRIPT_DIR"
    
    # Iniciar servidor en segundo plano
    /opt/homebrew/bin/node server.js >> "$LOG_FILE" 2>> "$ERROR_LOG" &
    
    # Guardar PID
    echo $! > "$PID_FILE"
    
    echo "$(date): Servidor iniciado con PID $!" >> "$LOG_FILE"
    
    # Esperar a que el proceso termine
    wait $!
    
    # Si llegamos aquí, el servidor se cerró
    echo "$(date): Servidor se cerró inesperadamente. Reiniciando en 5 segundos..." >> "$LOG_FILE"
    sleep 5
}

# Bucle infinito para reiniciar el servidor si falla
while true; do
    start_server
done 