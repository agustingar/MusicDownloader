#!/bin/bash

# Script para configurar Music Downloader de forma completamente permanente
# Configura tanto el servidor backend como la aplicación Expo

set -e

echo "🎵 Configurando Music Downloader de forma completamente permanente..."

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
    
    # Verificar Expo CLI
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx no está disponible${NC}"
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
    
    cd "$PROJECT_ROOT"
    
    # Instalar dependencias principales
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✅ Dependencias principales ya instaladas${NC}"
    fi
    
    # Instalar dependencias del backend
    cd "$PROJECT_ROOT/backend"
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✅ Dependencias del backend ya instaladas${NC}"
    fi
    
    cd "$PROJECT_ROOT"
}

# Función para crear servicio del servidor backend (macOS)
create_backend_service_macos() {
    echo -e "${YELLOW}🍎 Configurando servicio del backend para macOS...${NC}"
    
    SERVICE_NAME="com.musicdownloader.backend"
    PLIST_FILE="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
    
    # Crear directorio si no existe
    mkdir -p "$HOME/Library/LaunchAgents"
    mkdir -p "$PROJECT_ROOT/backend/logs"
    
    # Crear archivo plist para el backend
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
        <string>$PROJECT_ROOT/backend/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT/backend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/backend/logs/server.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/backend/logs/server.error.log</string>
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

    # Cargar el servicio
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    echo -e "${GREEN}✅ Servicio del backend configurado${NC}"
}

# Función para crear servicio de Expo (macOS)
create_expo_service_macos() {
    echo -e "${YELLOW}🍎 Configurando servicio de Expo para macOS...${NC}"
    
    SERVICE_NAME="com.musicdownloader.expo"
    PLIST_FILE="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
    
    # Crear directorio de logs
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Crear archivo plist para Expo
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>npx</string>
        <string>expo</string>
        <string>start</string>
        <string>--tunnel</string>
        <string>--non-interactive</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/logs/expo.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/logs/expo.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>EXPO_NO_DOTENV</key>
        <string>1</string>
    </dict>
</dict>
</plist>
EOF

    # Cargar el servicio
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    echo -e "${GREEN}✅ Servicio de Expo configurado${NC}"
}

# Función para crear servicios de sistema (Linux)
create_services_linux() {
    echo -e "${YELLOW}🐧 Configurando servicios para Linux...${NC}"
    
    # Servicio del backend
    BACKEND_SERVICE_NAME="musicdownloader-backend"
    BACKEND_SERVICE_FILE="/etc/systemd/system/$BACKEND_SERVICE_NAME.service"
    
    sudo tee "$BACKEND_SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Music Downloader Backend Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT/backend
ExecStart=/usr/bin/node $PROJECT_ROOT/backend/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
StandardOutput=append:$PROJECT_ROOT/backend/logs/server.log
StandardError=append:$PROJECT_ROOT/backend/logs/server.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Servicio de Expo
    EXPO_SERVICE_NAME="musicdownloader-expo"
    EXPO_SERVICE_FILE="/etc/systemd/system/$EXPO_SERVICE_NAME.service"
    
    sudo tee "$EXPO_SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Music Downloader Expo Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=/usr/bin/npx expo start --tunnel --non-interactive
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=EXPO_NO_DOTENV=1
StandardOutput=append:$PROJECT_ROOT/logs/expo.log
StandardError=append:$PROJECT_ROOT/logs/expo.error.log

[Install]
WantedBy=multi-user.target
EOF

    # Crear directorios de logs
    mkdir -p "$PROJECT_ROOT/backend/logs"
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Recargar systemd y habilitar los servicios
    sudo systemctl daemon-reload
    sudo systemctl enable "$BACKEND_SERVICE_NAME"
    sudo systemctl enable "$EXPO_SERVICE_NAME"
    sudo systemctl start "$BACKEND_SERVICE_NAME"
    sudo systemctl start "$EXPO_SERVICE_NAME"
    
    echo -e "${GREEN}✅ Servicios de Linux configurados${NC}"
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

# Función para crear script de control
create_control_script() {
    echo -e "${YELLOW}📝 Creando script de control...${NC}"
    
    cat > "$PROJECT_ROOT/control-services.sh" << 'EOF'
#!/bin/bash

# Script para controlar los servicios de Music Downloader

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}🎵 Music Downloader - Control de Servicios${NC}"
    echo "=============================================="
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start     - Iniciar todos los servicios"
    echo "  stop      - Detener todos los servicios"
    echo "  restart   - Reiniciar todos los servicios"
    echo "  status    - Ver estado de los servicios"
    echo "  logs      - Ver logs en tiempo real"
    echo "  help      - Mostrar esta ayuda"
}

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    BACKEND_SERVICE="com.musicdownloader.backend"
    EXPO_SERVICE="com.musicdownloader.expo"
    
    case $1 in
        start)
            echo -e "${GREEN}🚀 Iniciando servicios...${NC}"
            launchctl load ~/Library/LaunchAgents/$BACKEND_SERVICE.plist
            launchctl load ~/Library/LaunchAgents/$EXPO_SERVICE.plist
            ;;
        stop)
            echo -e "${YELLOW}⏹️  Deteniendo servicios...${NC}"
            launchctl unload ~/Library/LaunchAgents/$BACKEND_SERVICE.plist
            launchctl unload ~/Library/LaunchAgents/$EXPO_SERVICE.plist
            ;;
        restart)
            echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"
            launchctl unload ~/Library/LaunchAgents/$BACKEND_SERVICE.plist
            launchctl unload ~/Library/LaunchAgents/$EXPO_SERVICE.plist
            sleep 2
            launchctl load ~/Library/LaunchAgents/$BACKEND_SERVICE.plist
            launchctl load ~/Library/LaunchAgents/$EXPO_SERVICE.plist
            ;;
        status)
            echo -e "${BLUE}📊 Estado de los servicios:${NC}"
            echo ""
            echo "Backend:"
            launchctl list | grep musicdownloader.backend || echo "  No está ejecutándose"
            echo ""
            echo "Expo:"
            launchctl list | grep musicdownloader.expo || echo "  No está ejecutándose"
            ;;
        logs)
            echo -e "${BLUE}📋 Logs en tiempo real (Ctrl+C para salir):${NC}"
            tail -f backend/logs/server.log logs/expo.log
            ;;
        *)
            show_help
            ;;
    esac
else
    # Linux
    case $1 in
        start)
            echo -e "${GREEN}🚀 Iniciando servicios...${NC}"
            sudo systemctl start musicdownloader-backend
            sudo systemctl start musicdownloader-expo
            ;;
        stop)
            echo -e "${YELLOW}⏹️  Deteniendo servicios...${NC}"
            sudo systemctl stop musicdownloader-backend
            sudo systemctl stop musicdownloader-expo
            ;;
        restart)
            echo -e "${YELLOW}🔄 Reiniciando servicios...${NC}"
            sudo systemctl restart musicdownloader-backend
            sudo systemctl restart musicdownloader-expo
            ;;
        status)
            echo -e "${BLUE}📊 Estado de los servicios:${NC}"
            echo ""
            echo "Backend:"
            sudo systemctl status musicdownloader-backend --no-pager
            echo ""
            echo "Expo:"
            sudo systemctl status musicdownloader-expo --no-pager
            ;;
        logs)
            echo -e "${BLUE}📋 Logs en tiempo real (Ctrl+C para salir):${NC}"
            sudo journalctl -u musicdownloader-backend -u musicdownloader-expo -f
            ;;
        *)
            show_help
            ;;
    esac
fi
EOF

    chmod +x "$PROJECT_ROOT/control-services.sh"
    echo -e "${GREEN}✅ Script de control creado: control-services.sh${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}🎵 Music Downloader - Configuración Permanente Completa${NC}"
    echo "========================================================"
    
    # Verificar dependencias
    check_dependencies
    
    # Instalar dependencias del proyecto
    install_project_dependencies
    
    # Detectar sistema operativo y configurar servicios
    if [[ "$OSTYPE" == "darwin"* ]]; then
        create_backend_service_macos
        create_expo_service_macos
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        create_services_linux
    else
        echo -e "${RED}❌ Sistema operativo no soportado: $OSTYPE${NC}"
        echo "Este script soporta macOS y Linux"
        exit 1
    fi
    
    # Crear script de control
    create_control_script
    
    # Esperar un momento para que los servicios se inicien
    sleep 5
    
    # Obtener IP local
    LOCAL_IP=$(get_local_ip)
    
    echo ""
    echo -e "${GREEN}🎉 ¡Configuración completada!${NC}"
    echo "========================================================"
    echo -e "${BLUE}🌐 Los servicios están disponibles en:${NC}"
    echo "   • Backend: http://localhost:3000"
    echo "   • Backend (red local): http://$LOCAL_IP:3000"
    echo "   • Expo: Revisa los logs para obtener el código QR"
    echo ""
    echo -e "${YELLOW}📱 Para usar en tu iPhone:${NC}"
    echo "   1. Abre Expo Go en tu iPhone"
    echo "   2. Escanea el código QR que aparece en los logs de Expo"
    echo "   3. O usa el link que aparece en los logs"
    echo ""
    echo -e "${BLUE}📋 Comandos útiles:${NC}"
    echo "   • Control de servicios: ./control-services.sh [start|stop|restart|status|logs]"
    echo "   • Ver logs de Expo: tail -f logs/expo.log"
    echo "   • Ver logs del backend: tail -f backend/logs/server.log"
    echo ""
    echo -e "${GREEN}✅ Ambos servicios se iniciarán automáticamente al reiniciar el sistema${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Para ver el código QR de Expo, ejecuta:${NC}"
    echo "   ./control-services.sh logs"
}

# Ejecutar función principal
main "$@" 