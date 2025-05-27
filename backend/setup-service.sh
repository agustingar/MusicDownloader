#!/bin/bash

# Script para configurar el servidor como un servicio en segundo plano
# Funciona tanto en macOS como en Linux

# Obtener el directorio actual
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_PATH="$SCRIPT_DIR/server.js"

# Comprobar el sistema operativo
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS - Usar launchd
  echo "Configurando servicio para macOS..."
  
  # Crear archivo plist
  PLIST_FILE="$HOME/Library/LaunchAgents/com.musicdownloader.backend.plist"
  PLIST_DIR="$HOME/Library/LaunchAgents"
  
  # Crear directorio si no existe
  mkdir -p "$PLIST_DIR"
  
  # Crear archivo plist
  cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.musicdownloader.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$SERVER_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/error.log</string>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/output.log</string>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
</dict>
</plist>
EOF
  
  # Cargar el servicio
  echo "Cargando servicio..."
  launchctl unload "$PLIST_FILE" 2>/dev/null
  launchctl load -w "$PLIST_FILE"
  
  echo "✅ Servicio configurado correctamente"
  echo "El servidor se ejecutará automáticamente al iniciar sesión"
  echo "Para iniciar manualmente: launchctl start com.musicdownloader.backend"
  echo "Para detener: launchctl stop com.musicdownloader.backend"
  echo "Para ver logs: cat $SCRIPT_DIR/output.log o cat $SCRIPT_DIR/error.log"
  
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux - Usar systemd (requiere permisos de root)
  echo "Configurando servicio para Linux..."
  
  # Crear archivo de servicio
  SERVICE_FILE="/tmp/musicdownloader-backend.service"
  
  cat > "$SERVICE_FILE" << EOF
[Unit]
Description=MusicDownloader Backend Server
After=network.target

[Service]
ExecStart=/usr/bin/node $SERVER_PATH
Restart=always
User=$USER
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=$SCRIPT_DIR
StandardOutput=append:$SCRIPT_DIR/output.log
StandardError=append:$SCRIPT_DIR/error.log

[Install]
WantedBy=multi-user.target
EOF
  
  echo "Archivo de servicio creado en $SERVICE_FILE"
  echo "Para instalar el servicio, ejecuta:"
  echo "sudo cp $SERVICE_FILE /etc/systemd/system/musicdownloader-backend.service"
  echo "sudo systemctl enable musicdownloader-backend"
  echo "sudo systemctl start musicdownloader-backend"
  echo "Para ver el estado: sudo systemctl status musicdownloader-backend"
  
else
  echo "Sistema operativo no soportado: $OSTYPE"
  echo "Puedes ejecutar el servidor manualmente con:"
  echo "nohup node $SERVER_PATH > $SCRIPT_DIR/output.log 2> $SCRIPT_DIR/error.log &"
fi

# Actualizar el archivo ApiService.ts con la IP correcta
./start-server.sh &

echo ""
echo "Para conectar desde el iPhone:"
echo "1. Asegúrate de que el iPhone esté en la misma red WiFi que este dispositivo"
echo "2. En la app, configura la IP correcta en ApiService.ts"
echo "3. Si la conexión falla, comprueba que no hay firewalls bloqueando el puerto 3000" 