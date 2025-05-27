#!/bin/bash

# Script de despliegue para servidor propio
# Ejecutar como: ./deploy-production.sh

echo "🚀 Desplegando Music Downloader Backend en servidor propio..."

# Instalar dependencias del sistema
echo "📦 Instalando dependencias del sistema..."
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip ffmpeg

# Instalar yt-dlp
echo "📺 Instalando yt-dlp..."
sudo pip3 install yt-dlp

# Instalar PM2 para gestión de procesos
echo "⚙️ Instalando PM2..."
sudo npm install -g pm2

# Instalar dependencias del proyecto
echo "📚 Instalando dependencias del proyecto..."
npm install --production

# Crear directorio de descargas
mkdir -p downloads

# Configurar PM2
echo "🔧 Configurando PM2..."
pm2 delete music-downloader-backend 2>/dev/null || true
pm2 start server.js --name music-downloader-backend --instances 2 --exec-mode cluster

# Configurar PM2 para reinicio automático
pm2 save
pm2 startup

# Configurar Nginx (opcional)
echo "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/music-downloader-backend > /dev/null <<EOF
server {
    listen 80;
    server_name tu-dominio.com;  # Cambiar por tu dominio
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;  # Cambiar por tu dominio
    
    # Configuración SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    # Proxy al backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Servir archivos de descarga
    location /downloads/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Configuración de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/music-downloader-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Despliegue completado!"
echo "📍 Tu backend estará disponible en: http://tu-dominio.com"
echo "🔧 Para monitorear: pm2 monit"
echo "📊 Para ver logs: pm2 logs music-downloader-backend" 