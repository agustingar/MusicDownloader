#!/bin/bash

# Script para preparar el proyecto para Xcode e instalarlo en un iPhone

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MusicDownloader - Preparación para Xcode ===${NC}"
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "app.json" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde la carpeta raíz del proyecto${NC}"
    echo "Por favor ejecuta: cd MusicDownloader && ./scripts/setup-xcode.sh"
    exit 1
fi

# Verificar dependencias
echo -e "${YELLOW}Verificando dependencias...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js no está instalado. Por favor instálalo desde https://nodejs.org${NC}"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm no está instalado. Generalmente viene con Node.js${NC}"
    exit 1
fi

# Verificar Expo CLI
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}Expo CLI no está instalado. Instalando...${NC}"
    npm install -g expo-cli
else
    echo -e "${GREEN}Expo CLI está instalado correctamente.${NC}"
fi

# Verificar que Xcode está instalado
if ! xcode-select -p &> /dev/null; then
    echo -e "${RED}Xcode no está instalado. Por favor instala Xcode desde la Mac App Store.${NC}"
    exit 1
else
    echo -e "${GREEN}Xcode está instalado correctamente.${NC}"
fi

# Instalar dependencias del proyecto
echo -e "${YELLOW}Instalando dependencias del proyecto...${NC}"
npm install

# Verificar que el servidor backend está configurado
echo -e "${YELLOW}Verificando configuración del servidor backend...${NC}"
if [ ! -f "backend/server.js" ]; then
    echo -e "${RED}No se encuentra el servidor backend. Asegúrate de que la carpeta 'backend' existe y contiene server.js${NC}"
    exit 1
fi

# Comprobar si el backend está configurado como servicio
echo -e "${YELLOW}¿Quieres configurar el servidor backend como servicio? (s/n)${NC}"
read setup_service

if [[ $setup_service == "s" || $setup_service == "S" ]]; then
    cd backend && ./setup-service.sh && cd ..
    echo -e "${GREEN}Servidor backend configurado como servicio.${NC}"
else
    echo -e "${YELLOW}Recuerda iniciar el servidor backend manualmente antes de usar la app:${NC}"
    echo "cd backend && ./start-server.sh"
fi

# Preparar el proyecto para Xcode
echo -e "${YELLOW}Preparando el proyecto para Xcode...${NC}"
echo -e "${YELLOW}Este proceso puede tardar varios minutos...${NC}"

# Ejecución en modo bare workflow
npx expo prebuild --platform ios
npx expo run:ios

echo -e "${GREEN}¡Proyecto preparado para Xcode!${NC}"
echo -e "${YELLOW}Se ha abierto Xcode con el proyecto.${NC}"
echo ""
echo -e "${GREEN}Para instalar en tu iPhone:${NC}"
echo "1. Conecta tu iPhone al Mac con un cable USB"
echo "2. En Xcode, selecciona tu iPhone como dispositivo de destino"
echo "3. Haz clic en el botón 'Play' para compilar e instalar la app"
echo ""
echo -e "${YELLOW}Notas importantes:${NC}"
echo "- Necesitas tener una cuenta de Apple Developer (la gratuita funciona para desarrollo)"
echo "- Es posible que tengas que confiar en el certificado de desarrollador en tu iPhone"
echo "  (Ajustes > General > Gestión de dispositivos)"
echo "- La reproducción en segundo plano ya está configurada" 