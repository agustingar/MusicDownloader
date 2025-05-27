# 🚀 Desplegar Music Downloader en Railway

## Pasos Rápidos (5 minutos)

### 1. Subir tu código a GitHub
```bash
# Si no tienes repo en GitHub, créalo:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/MusicDownloader.git
git push -u origin main
```

### 2. Desplegar en Railway

1. **Ve a [railway.app](https://railway.app)**
2. **Haz clic en "Deploy from GitHub repo"**
3. **Conecta tu cuenta de GitHub** si no lo has hecho
4. **Selecciona tu repositorio** MusicDownloader
5. **Railway detectará automáticamente** que es una app Node.js
6. **Haz clic en "Deploy"**

### 3. Configurar Variables de Entorno

En el dashboard de Railway:
1. Ve a tu servicio desplegado
2. Haz clic en **"Variables"**
3. Agrega estas variables:
   - `PORT` = `3000`
   - `NODE_ENV` = `production`

### 4. Obtener tu URL Pública

1. Ve a **"Settings"** → **"Networking"**
2. Haz clic en **"Generate Domain"**
3. **¡Copia tu URL!** (algo como `https://tu-app.up.railway.app`)

## 🎵 Usar tu App

### Desde iPhone (Expo Go):
1. Cambia la URL en tu app React Native:
   ```javascript
   // En src/config/api.js o donde tengas la URL
   const API_URL = 'https://tu-app.up.railway.app';
   ```
2. Ejecuta `npx expo start`
3. Escanea el QR con Expo Go

### Desde Web:
Tu API estará disponible en:
- `https://tu-app.up.railway.app/health` - Verificar que funciona
- `https://tu-app.up.railway.app/api/convert` - Convertir videos

## 📱 Compartir tu App

### Opción 1: Expo Go (Desarrollo)
- Comparte el QR code que genera `npx expo start`
- La gente necesita tener Expo Go instalado

### Opción 2: Build para App Store (Producción)
```bash
# Crear build para iOS
npx expo build:ios

# Crear build para Android  
npx expo build:android
```

### Opción 3: Web App
```bash
# Crear versión web
npx expo export:web

# Desplegar en Netlify/Vercel
```

## 🔧 Troubleshooting

### Si no funciona la conversión:
- Verifica que yt-dlp esté instalado en Railway
- Revisa los logs en Railway dashboard

### Si la app no conecta:
- Asegúrate de cambiar la URL del API en tu código
- Verifica que el dominio de Railway esté activo

## 💰 Costos

Railway es **GRATIS** para:
- $5 USD de crédito mensual
- Suficiente para una app personal
- Escala automáticamente

¡Tu servidor estará **SIEMPRE CORRIENDO** sin que tengas que hacer nada! 🎉 