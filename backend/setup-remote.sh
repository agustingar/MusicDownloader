#!/bin/bash

# Script para configurar el servidor en un servidor remoto (VPS, EC2, etc.)
# Esto permite compartir la aplicación con personas fuera de tu red WiFi local

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MusicDownloader - Configuración de Servidor Remoto ===${NC}"
echo ""

# Obtener información del servidor remoto
read -p "Ingresa la dirección IP o dominio del servidor remoto: " SERVER_IP
read -p "Ingresa el nombre de usuario SSH: " SSH_USER
read -p "¿El servidor tiene Node.js instalado? (s/n): " HAS_NODE

# Generar la carpeta para el servidor
echo -e "${YELLOW}Preparando archivos para el servidor remoto...${NC}"

# Crear carpeta temporal
TEMP_DIR="./temp_remote_setup"
mkdir -p $TEMP_DIR

# Copiar archivos necesarios
cp server.js $TEMP_DIR/
cp package.json $TEMP_DIR/
cp -r downloads $TEMP_DIR/ 2>/dev/null || mkdir -p $TEMP_DIR/downloads

# Crear script de instalación remota
cat > $TEMP_DIR/install.sh << 'EOF'
#!/bin/bash

# Instalar dependencias si es necesario
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Instalar ffmpeg y yt-dlp
echo "Instalando ffmpeg y yt-dlp..."
sudo apt-get update
sudo apt-get install -y ffmpeg
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Instalar dependencias de Node.js
echo "Instalando dependencias de Node.js..."
npm install

# Crear servicio systemd
echo "Configurando servicio systemd..."
cat > musicdownloader.service << EOL
[Unit]
Description=MusicDownloader Backend Server
After=network.target

[Service]
ExecStart=$(which node) $(pwd)/server.js
Restart=always
User=$USER
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=$(pwd)
StandardOutput=append:$(pwd)/output.log
StandardError=append:$(pwd)/error.log

[Install]
WantedBy=multi-user.target
EOL

sudo mv musicdownloader.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable musicdownloader
sudo systemctl start musicdownloader

echo "Servidor configurado y ejecutándose en http://$(hostname -I | awk '{print $1}'):3000"
EOF

# Hacer el script ejecutable
chmod +x $TEMP_DIR/install.sh

# Copiar archivos al servidor remoto
echo -e "${YELLOW}Copiando archivos al servidor remoto...${NC}"
scp -r $TEMP_DIR/* $SSH_USER@$SERVER_IP:~/musicdownloader/

# Ejecutar script de instalación en el servidor remoto
echo -e "${YELLOW}Ejecutando script de instalación remota...${NC}"
ssh $SSH_USER@$SERVER_IP "cd ~/musicdownloader && chmod +x install.sh && ./install.sh"

# Obtener la URL del servidor remoto
REMOTE_URL=$(ssh $SSH_USER@$SERVER_IP "hostname -I | awk '{print \$1}'")

# Limpiar archivos temporales
rm -rf $TEMP_DIR

echo -e "${GREEN}¡Servidor remoto configurado correctamente!${NC}"
echo -e "URL del servidor: ${YELLOW}http://$REMOTE_URL:3000${NC}"
echo ""
echo -e "${YELLOW}Actualiza el archivo ApiService.ts con esta URL:${NC}"
echo "const BASE_URL = __DEV__ "
echo "  ? 'http://$REMOTE_URL:3000'"
echo "  : 'http://$REMOTE_URL:3000';"
echo ""
echo -e "${GREEN}Ahora puedes compartir la aplicación con usuarios fuera de tu red WiFi.${NC}" 