# 🎵 Guía Completa: Music Downloader para iPhone

Esta guía te llevará paso a paso para tener tu aplicación Music Downloader funcionando perfectamente en tu iPhone.

## 📋 Requisitos Previos

### En tu Mac/PC:
- **Node.js** (versión 16 o superior) - [Descargar aquí](https://nodejs.org/)
- **yt-dlp** para descargar videos de YouTube
- **Xcode** (solo para Mac) - [Descargar desde App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **Expo CLI** instalado globalmente

### En tu iPhone:
- **iOS 13.0 o superior**
- **Expo Go** app - [Descargar desde App Store](https://apps.apple.com/app/expo-go/id982107779)

---

## 🚀 Paso 1: Configuración Inicial del Proyecto

### 1.1 Instalar dependencias globales
```bash
# Instalar Expo CLI globalmente
npm install -g @expo/cli

# Instalar yt-dlp (macOS con Homebrew)
brew install yt-dlp

# O instalar yt-dlp (con pip)
pip3 install yt-dlp
```

### 1.2 Instalar dependencias del proyecto
```bash
# En el directorio raíz del proyecto
npm install

# En el directorio backend
cd backend
npm install
cd ..
```

---

## 🖥️ Paso 2: Configurar el Servidor Backend

### 2.1 Configuración Automática (Recomendado)
```bash
# Ejecutar script de configuración automática
cd backend
./setup-permanent-server.sh
```

Este script:
- ✅ Verifica todas las dependencias
- ✅ Configura el servidor como servicio del sistema
- ✅ Se inicia automáticamente al reiniciar
- ✅ Proporciona las URLs para conectar desde iPhone

### 2.2 Configuración Manual (Alternativa)
```bash
# Iniciar servidor manualmente
cd backend
./run-server-daemon.sh
```

### 2.3 Verificar que el servidor funciona
Abre en tu navegador: `http://localhost:3000/health`
Deberías ver: `{"status":"ok","message":"Server is running"}`

---

## 📱 Paso 3: Configurar la App para iPhone

### 3.1 Obtener tu IP local
```bash
# En macOS
ipconfig getifaddr en0

# En Linux
hostname -I | awk '{print $1}'
```

### 3.2 Configurar la URL del servidor en la app
Edita el archivo `src/config/api.ts`:
```typescript
// Reemplaza con tu IP local
export const API_BASE_URL = 'http://TU_IP_LOCAL:3000';

// Ejemplo:
export const API_BASE_URL = 'http://192.168.1.100:3000';
```

### 3.3 Iniciar la aplicación
```bash
# En el directorio raíz del proyecto
npx expo start
```

---

## 📲 Paso 4: Instalar en iPhone

### 4.1 Conectar iPhone y Mac a la misma red WiFi
- Asegúrate de que ambos dispositivos estén en la misma red WiFi

### 4.2 Abrir la app en iPhone
1. **Abre Expo Go** en tu iPhone
2. **Escanea el código QR** que aparece en la terminal
3. **Espera** a que la app se compile y se abra

### 4.3 Verificar conexión
- La app debería cargar correctamente
- Intenta buscar y descargar una canción para verificar que todo funciona

---

## 🏗️ Paso 5: Crear Build para Distribución (Opcional)

### 5.1 Configurar EAS Build
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Inicializar EAS
eas build:configure
```

### 5.2 Crear build para iOS
```bash
# Build para desarrollo (no necesita App Store)
eas build --platform ios --profile development

# Build para distribución interna
eas build --platform ios --profile preview
```

### 5.3 Instalar el build
1. **Descarga el archivo .ipa** desde el link que proporciona EAS
2. **Instala usando AltStore, Sideloadly o similar**
3. **O comparte el link** para que otros descarguen

---

## 🔧 Paso 6: Solución de Problemas Comunes

### ❌ "No se puede conectar al servidor"
**Solución:**
1. Verifica que el servidor esté ejecutándose: `http://localhost:3000/health`
2. Confirma que iPhone y Mac están en la misma red WiFi
3. Verifica que la IP en `src/config/api.ts` sea correcta
4. Desactiva temporalmente el firewall del Mac

### ❌ "Error al descargar videos"
**Solución:**
1. Verifica que yt-dlp esté instalado: `yt-dlp --version`
2. Actualiza yt-dlp: `pip3 install --upgrade yt-dlp`
3. Revisa los logs del servidor: `tail -f backend/logs/server.log`

### ❌ "La app se cierra inesperadamente"
**Solución:**
1. Reinicia Expo Go
2. Limpia caché: `npx expo start --clear`
3. Verifica que todas las dependencias estén instaladas

---

## 📤 Paso 7: Compartir la Aplicación

### 7.1 Compartir durante desarrollo
```bash
# Generar link público
npx expo start --tunnel

# Compartir el link o código QR generado
```

### 7.2 Compartir build compilado
1. **Crea un build** siguiendo el Paso 5
2. **Comparte el link de descarga** que proporciona EAS
3. **Los usuarios necesitan** instalar Expo Go o usar AltStore/Sideloadly

### 7.3 Distribución a través de TestFlight (Avanzado)
1. **Configura Apple Developer Account** ($99/año)
2. **Crea build para App Store:**
   ```bash
   eas build --platform ios --profile production
   ```
3. **Sube a App Store Connect** y distribuye via TestFlight

---

## 🎯 Paso 8: Configuración Final y Optimización

### 8.1 Configurar servidor permanente
```bash
# El servidor se iniciará automáticamente
# Verificar estado:
launchctl list | grep musicdownloader

# Ver logs:
tail -f backend/logs/server.log
```

### 8.2 Configurar red local estática (Opcional)
Para evitar cambios de IP, configura una IP estática en tu router para tu Mac.

### 8.3 Configurar acceso remoto (Avanzado)
Para acceder desde fuera de tu red local:
1. **Configura port forwarding** en tu router (puerto 3000)
2. **Usa tu IP pública** en lugar de la local
3. **Considera usar un servicio como ngrok** para túneles seguros

---

## 📋 Comandos Útiles de Mantenimiento

```bash
# Ver estado del servidor
launchctl list | grep musicdownloader

# Reiniciar servidor
launchctl unload ~/Library/LaunchAgents/com.musicdownloader.server.plist
launchctl load ~/Library/LaunchAgents/com.musicdownloader.server.plist

# Ver logs en tiempo real
tail -f backend/logs/server.log

# Limpiar caché de Expo
npx expo start --clear

# Actualizar yt-dlp
pip3 install --upgrade yt-dlp

# Ver IP local actual
ipconfig getifaddr en0
```

---

## 🎉 ¡Listo!

Tu aplicación Music Downloader debería estar funcionando perfectamente en tu iPhone. Ahora puedes:

- ✅ **Buscar videos** en YouTube desde la app
- ✅ **Descargar música** en formato MP3
- ✅ **Crear playlists** con imágenes personalizadas
- ✅ **Reproducir música** descargada
- ✅ **Compartir la app** con amigos y familia

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs:** `tail -f backend/logs/server.log`
2. **Verifica la conexión:** `http://localhost:3000/health`
3. **Reinicia todo:** Servidor, Expo y la app
4. **Consulta la documentación** de Expo y React Native

¡Disfruta tu nueva aplicación de música! 🎵 