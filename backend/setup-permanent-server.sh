#!/bin/bash

# Script para configurar el servidor Music Downloader de forma permanente
# Este script configura el servidor para que se ejecute automáticamente

set -e

echo "🎵 Configurando Music Downloader Server de forma permanente..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Obtener directorio actual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}📁 Directorio del proyecto: $PROJECT_ROOT${NC}"

# Función para verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependencias...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        echo "Por favor instala Node.js desde https://nodejs.org/"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm no está instalado${NC}"
        exit 1
    fi
    
    # Verificar yt-dlp
    if ! command -v yt-dlp &> /dev/null; then
        echo -e "${YELLOW}⚠️  yt-dlp no está instalado. Instalando...${NC}"
        if command -v brew &> /dev/null; then
            brew install yt-dlp
        elif command -v pip3 &> /dev/null; then
            pip3 install yt-dlp
        else
            echo -e "${RED}❌ No se pudo instalar yt-dlp automáticamente${NC}"
            echo "Por favor instala yt-dlp manualmente:"
            echo "  - macOS: brew install yt-dlp"
            echo "  - Linux: pip3 install yt-dlp"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Todas las dependencias están instaladas${NC}"
}

# Función para instalar dependencias del proyecto
install_project_dependencies() {
    echo -e "${YELLOW}📦 Instalando dependencias del proyecto...${NC}"
    
    cd "$SCRIPT_DIR"
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✅ Dependencias ya instaladas${NC}"
    fi
}

# Función para crear servicio de sistema (macOS)
create_macos_service() {
    echo -e "${YELLOW}🍎 Configurando servicio para macOS...${NC}"
    
    SERVICE_NAME="com.musicdownloader.server"
    PLIST_FILE="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
    
    # Crear directorio si no existe
    mkdir -p "$HOME/Library/LaunchAgents"
    
    # Crear archivo plist
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>$SCRIPT_DIR/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/server.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/server.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3000</string>
    </dict>
</dict>
</plist>
EOF

    # Crear directorio de logs
    mkdir -p "$SCRIPT_DIR/logs"
    
    # Cargar el servicio
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    echo -e "${GREEN}✅ Servicio de macOS configurado${NC}"
    echo -e "${BLUE}📝 Archivo de configuración: $PLIST_FILE${NC}"
}

# Función para crear servicio de sistema (Linux)
create_linux_service() {
    echo -e "${YELLOW}🐧 Configurando servicio para Linux...${NC}"
    
    SERVICE_NAME="musicdownloader-server"
    SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
    
    # Crear archivo de servicio
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Music Downloader Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/node $SCRIPT_DIR/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=append:$SCRIPT_DIR/logs/server.log
StandardError=append:$SCRIPT_DIR/logs/server.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Crear directorio de logs
    mkdir -p "$SCRIPT_DIR/logs"
    
    # Recargar systemd y habilitar el servicio
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    sudo systemctl start "$SERVICE_NAME"
    
    echo -e "${GREEN}✅ Servicio de Linux configurado${NC}"
    echo -e "${BLUE}📝 Archivo de configuración: $SERVICE_FILE${NC}"
}

# Función para obtener IP local
get_local_ip() {
    if command -v ipconfig &> /dev/null; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
    else
        # Linux
        hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1"
    fi
}

# Función principal
main() {
    echo -e "${BLUE}🎵 Music Downloader - Configuración de Servidor Permanente${NC}"
    echo "=================================================="
    
    # Verificar dependencias
    check_dependencies
    
    # Instalar dependencias del proyecto
    install_project_dependencies
    
    # Detectar sistema operativo y configurar servicio
    if [[ "$OSTYPE" == "darwin"* ]]; then
        create_macos_service
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        create_linux_service
    else
        echo -e "${RED}❌ Sistema operativo no soportado: $OSTYPE${NC}"
        echo "Este script soporta macOS y Linux"
        exit 1
    fi
    
    # Esperar un momento para que el servicio se inicie
    sleep 3
    
    # Obtener IP local
    LOCAL_IP=$(get_local_ip)
    
    echo ""
    echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
    echo "=================================================="
    echo -e "${BLUE}🌐 El servidor está disponible en:${NC}"
    echo "   • Local: http://localhost:3000"
    echo "   • Red local: http://$LOCAL_IP:3000"
    echo ""
    echo -e "${YELLOW}📱 Para usar en tu iPhone:${NC}"
    echo "   1. Asegúrate de que tu iPhone esté en la misma red WiFi"
    echo "   2. Usa la URL: http://$LOCAL_IP:3000"
    echo ""
    echo -e "${BLUE}📋 Comandos útiles:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   • Ver estado: launchctl list | grep musicdownloader"
        echo "   • Detener: launchctl unload ~/Library/LaunchAgents/com.musicdownloader.server.plist"
        echo "   • Iniciar: launchctl load ~/Library/LaunchAgents/com.musicdownloader.server.plist"
    else
        echo "   • Ver estado: sudo systemctl status musicdownloader-server"
        echo "   • Detener: sudo systemctl stop musicdownloader-server"
        echo "   • Iniciar: sudo systemctl start musicdownloader-server"
        echo "   • Ver logs: sudo journalctl -u musicdownloader-server -f"
    fi
    echo "   • Ver logs: tail -f $SCRIPT_DIR/logs/server.log"
    echo ""
    echo -e "${GREEN}✅ El servidor se iniciará automáticamente al reiniciar el sistema${NC}"
}

# Ejecutar función principal
main "$@" 