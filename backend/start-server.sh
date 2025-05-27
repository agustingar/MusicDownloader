#!/bin/bash

# Obtener la dirección IP local
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
  # Linux
  IP=$(hostname -I | awk '{print $1}')
fi

echo "======================================================"
echo "   Servidor de MusicDownloader"
echo "======================================================"
echo ""
echo "IP local detectada: $IP"
echo ""

# Ruta al archivo ApiService.ts
API_SERVICE_FILE="../src/services/ApiService.ts"

if [ -f "$API_SERVICE_FILE" ]; then
  echo "Actualizando automáticamente IP en ApiService.ts..."
  # Reemplazar la IP en el archivo
  sed -i.bak "s/const LOCALHOST_IP = '.*';/const LOCALHOST_IP = '$IP';/" $API_SERVICE_FILE
  rm -f "${API_SERVICE_FILE}.bak"
  echo "✅ ApiService.ts actualizado con IP: $IP"
else
  echo "⚠️ No se encontró el archivo ApiService.ts en $API_SERVICE_FILE"
  echo "Por favor actualiza manualmente el archivo con:"
  echo "const LOCALHOST_IP = '$IP';"
fi

echo ""
echo "======================================================"
echo "Iniciando servidor en http://$IP:3000"
echo "======================================================"
echo ""

# Iniciar el servidor
node server.js 