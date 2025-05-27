#!/bin/bash

# Script para obtener el código QR y información de conexión de Expo

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎵 Music Downloader - Información de Conexión${NC}"
echo "=================================================="

# Obtener directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Verificar si el archivo de logs de Expo existe
EXPO_LOG_FILE="$PROJECT_ROOT/logs/expo.log"

if [ ! -f "$EXPO_LOG_FILE" ]; then
    echo -e "${RED}❌ No se encontró el archivo de logs de Expo${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que el servicio de Expo esté ejecutándose:${NC}"
    echo "   ./control-services.sh start"
    echo "   ./control-services.sh status"
    exit 1
fi

echo -e "${GREEN}📱 Información para conectar desde iPhone:${NC}"
echo ""

# Buscar información de conexión en los logs
echo -e "${YELLOW}🔍 Buscando información de conexión...${NC}"

# Buscar la URL de Expo
EXPO_URL=$(tail -n 50 "$EXPO_LOG_FILE" | grep -E "exp://.*:19000" | tail -n 1 | sed 's/.*\(exp:\/\/[^[:space:]]*\).*/\1/')

if [ -n "$EXPO_URL" ]; then
    echo -e "${GREEN}✅ URL de Expo encontrada:${NC}"
    echo "   $EXPO_URL"
    echo ""
fi

# Buscar información del túnel
TUNNEL_URL=$(tail -n 50 "$EXPO_LOG_FILE" | grep -E "https://.*\.exp\.direct" | tail -n 1 | sed 's/.*\(https:\/\/[^[:space:]]*\).*/\1/')

if [ -n "$TUNNEL_URL" ]; then
    echo -e "${GREEN}✅ URL del túnel encontrada:${NC}"
    echo "   $TUNNEL_URL"
    echo ""
fi

# Buscar código QR
QR_FOUND=$(tail -n 50 "$EXPO_LOG_FILE" | grep -c "QR code")

if [ "$QR_FOUND" -gt 0 ]; then
    echo -e "${GREEN}✅ Código QR disponible en los logs${NC}"
else
    echo -e "${YELLOW}⚠️  Código QR no encontrado en logs recientes${NC}"
fi

echo ""
echo -e "${BLUE}📋 Instrucciones para iPhone:${NC}"
echo "1. 📱 Abre la app 'Expo Go' en tu iPhone"
echo "2. 📷 Toca 'Scan QR Code'"
echo "3. 🎯 Escanea el código QR que aparece abajo"
echo "4. ⏳ Espera a que la app se cargue"
echo ""

echo -e "${YELLOW}🔍 Código QR y logs recientes:${NC}"
echo "=================================================="

# Mostrar las últimas líneas del log que contienen información útil
tail -n 30 "$EXPO_LOG_FILE" | grep -E "(QR code|exp://|Scan|Metro|tunnel|https://.*\.exp\.direct)" || {
    echo -e "${YELLOW}⚠️  No se encontró información de QR en logs recientes${NC}"
    echo -e "${BLUE}📋 Mostrando últimas líneas del log:${NC}"
    tail -n 10 "$EXPO_LOG_FILE"
}

echo ""
echo "=================================================="
echo -e "${GREEN}💡 Comandos útiles:${NC}"
echo "   • Ver logs completos: tail -f logs/expo.log"
echo "   • Reiniciar Expo: ./control-services.sh restart"
echo "   • Ver estado: ./control-services.sh status"
echo "   • Ver todos los logs: ./control-services.sh logs"
echo ""

# Verificar si el servicio está ejecutándose
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if launchctl list | grep -q "musicdownloader.expo"; then
        echo -e "${GREEN}✅ Servicio de Expo está ejecutándose${NC}"
    else
        echo -e "${RED}❌ Servicio de Expo no está ejecutándose${NC}"
        echo -e "${YELLOW}💡 Para iniciarlo: ./control-services.sh start${NC}"
    fi
else
    # Linux
    if systemctl is-active --quiet musicdownloader-expo; then
        echo -e "${GREEN}✅ Servicio de Expo está ejecutándose${NC}"
    else
        echo -e "${RED}❌ Servicio de Expo no está ejecutándose${NC}"
        echo -e "${YELLOW}💡 Para iniciarlo: ./control-services.sh start${NC}"
    fi
fi 