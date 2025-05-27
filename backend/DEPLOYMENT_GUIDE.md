# 🚀 Guía de Despliegue - Music Downloader Backend

## 📋 Opciones de Hosting

### 1. **Tu Servidor Propio (Recomendado)**

#### Requisitos:
- Ubuntu/Debian 20.04+
- 2GB RAM mínimo
- 20GB espacio libre
- Dominio propio (opcional pero recomendado)

#### Instalación:
```bash
# 1. Clonar el proyecto
git clone <tu-repositorio>
cd MusicDownloader/backend

# 2. Ejecutar script de despliegue
chmod +x deploy-production.sh
./deploy-production.sh

# 3. Configurar tu dominio en el script (editar línea 45)
nano deploy-production.sh
# Cambiar "tu-dominio.com" por tu dominio real

# 4. Configurar SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

#### Monitoreo:
```bash
# Ver estado del servidor
pm2 status

# Ver logs en tiempo real
pm2 logs music-downloader-backend

# Reiniciar servidor
pm2 restart music-downloader-backend

# Ver métricas
pm2 monit
```

---

### 2. **Railway (Gratuito hasta 500 horas/mes)**

#### Pasos:
1. Crear cuenta en [Railway.app](https://railway.app)
2. Conectar tu repositorio GitHub
3. Seleccionar el directorio `backend`
4. Railway detectará automáticamente el `package.json`
5. Tu app estará disponible en: `https://tu-app.up.railway.app`

#### Variables de entorno en Railway:
```
NODE_ENV=production
PORT=3000
```

---

### 3. **Render (Gratuito con limitaciones)**

#### Pasos:
1. Crear cuenta en [Render.com](https://render.com)
2. Conectar repositorio GitHub
3. Crear nuevo "Web Service"
4. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

---

### 4. **Heroku (Gratuito hasta Nov 2022, ahora de pago)**

#### Pasos:
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create tu-music-downloader-backend

# Configurar buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git

# Deploy
git push heroku main
```

---

### 5. **DigitalOcean App Platform**

#### Pasos:
1. Crear cuenta en DigitalOcean
2. Ir a "App Platform"
3. Conectar repositorio GitHub
4. Seleccionar directorio `backend`
5. Configurar plan (desde $5/mes)

---

## 🔧 Configuración de la App

### Actualizar URLs en la app:

1. **Editar `src/services/ApiService.ts`**:
```typescript
const BACKEND_URLS = [
  'https://tu-dominio-real.com', // Tu servidor
  'https://tu-app.up.railway.app', // Railway
  'https://tu-app.onrender.com', // Render
  'http://192.168.0.54:3000', // IP local para desarrollo
];
```

2. **Compilar y probar**:
```bash
cd .. # Volver al directorio raíz
npx expo run:ios --device "iPhone de Tinin"
```

---

## 🛡️ Seguridad y Optimización

### 1. **Configurar HTTPS**
```bash
# Con Let's Encrypt (gratis)
sudo certbot --nginx -d tu-dominio.com

# Renovación automática
sudo crontab -e
# Añadir: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. **Configurar Firewall**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

### 3. **Limitar Recursos**
```bash
# Editar server.js para añadir límites
app.use(express.json({ limit: '10mb' }));

// Límite de conversiones simultáneas
const MAX_CONCURRENT_CONVERSIONS = 3;
```

### 4. **Monitoreo de Logs**
```bash
# Configurar logrotate
sudo nano /etc/logrotate.d/music-downloader
```

---

## 📊 Monitoreo y Mantenimiento

### 1. **Endpoint de Salud**
Tu backend incluye `/api/health` que muestra:
- Estado del servidor
- Tiempo de actividad
- Conversiones activas
- Memoria utilizada

### 2. **Limpieza Automática**
- Archivos MP3 se eliminan automáticamente después de 24 horas
- Conversiones completadas se limpian de memoria

### 3. **Alertas**
```bash
# Configurar alertas por email cuando el servidor esté caído
# Usar servicios como UptimeRobot (gratis)
```

---

## 🚨 Solución de Problemas

### Error: "yt-dlp not found"
```bash
# Reinstalar yt-dlp
pip3 install --upgrade yt-dlp
```

### Error: "ffmpeg not found"
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

### Error: "Permission denied"
```bash
# Dar permisos al directorio de descargas
chmod 755 downloads/
```

### Error: "Port already in use"
```bash
# Encontrar proceso usando el puerto
sudo lsof -i :3000
# Matar proceso
sudo kill -9 <PID>
```

---

## 💡 Consejos Adicionales

1. **Backup Regular**: Configura backups automáticos de tu servidor
2. **CDN**: Usa CloudFlare para mejorar velocidad y seguridad
3. **Base de Datos**: Para apps grandes, considera usar Redis para caché
4. **Escalabilidad**: Para muchos usuarios, usa múltiples instancias con load balancer

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs music-downloader-backend`
2. Verifica el endpoint de salud: `curl https://tu-dominio.com/api/health`
3. Comprueba que yt-dlp funciona: `yt-dlp --version`

¡Tu backend estará funcionando 24/7 para que tu app siempre pueda convertir videos! 🎵 