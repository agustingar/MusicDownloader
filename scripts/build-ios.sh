#!/bin/bash

# Script para construir la aplicación para iOS y generar un IPA

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MusicDownloader - Compilación para iOS ===${NC}"
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "app.json" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde la carpeta raíz del proyecto${NC}"
    echo "Por favor ejecuta: cd MusicDownloader && ./scripts/build-ios.sh"
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

# Verificar EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}EAS CLI no está instalado. Instalando...${NC}"
    npm install -g eas-cli
else
    echo -e "${GREEN}EAS CLI está instalado correctamente.${NC}"
fi

# Instalar dependencias del proyecto
echo -e "${YELLOW}Instalando dependencias del proyecto...${NC}"
npm install

# Preguntar si está logueado en Expo
echo -e "${YELLOW}¿Estás logueado en Expo? (s/n)${NC}"
read login_response

if [[ $login_response != "s" && $login_response != "S" ]]; then
    echo -e "${YELLOW}Iniciando sesión en Expo...${NC}"
    eas login
fi

# Configurar EAS
echo -e "${YELLOW}Configurando EAS Build...${NC}"
eas build:configure

# Preguntar por el tipo de build
echo -e "${YELLOW}¿Qué tipo de build deseas crear?${NC}"
echo "1. Desarrollo (para pruebas)"
echo "2. Ad Hoc (para compartir sin App Store)"
echo "3. App Store (para enviar a la App Store)"
read build_type

case $build_type in
    1)
        profile="development"
        ;;
    2)
        profile="adhoc"
        ;;
    3)
        profile="production"
        ;;
    *)
        echo -e "${RED}Opción no válida. Usando Ad Hoc por defecto.${NC}"
        profile="adhoc"
        ;;
esac

# Iniciar la compilación
echo -e "${GREEN}Iniciando compilación para iOS con perfil: $profile${NC}"
echo -e "${YELLOW}Esto puede tardar varios minutos. Se abrirá el dashboard de Expo en tu navegador.${NC}"

eas build --platform ios --profile $profile --non-interactive

echo -e "${GREEN}El proceso de compilación ha sido iniciado.${NC}"
echo -e "${YELLOW}Puedes monitorear el progreso en la página web que se abrió.${NC}"
echo ""
echo -e "${GREEN}Una vez completado:${NC}"
echo "1. Descarga el archivo IPA desde el dashboard de Expo"
echo "2. Compártelo a través de AltStore, TestFlight o un servicio de distribución"
echo ""
echo -e "${YELLOW}Para más información, consulta README.md${NC}" 