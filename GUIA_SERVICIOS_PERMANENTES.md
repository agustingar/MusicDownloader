# 🎵 Guía: Servicios Permanentes para Music Downloader

Esta guía te explica cómo configurar tu aplicación Music Downloader para que **tanto el servidor backend como Expo funcionen de forma completamente automática**, sin necesidad de ejecutar `npx expo start` o iniciar el servidor manualmente.

## 🎯 ¿Qué lograremos?

✅ **Servidor backend** funcionando permanentemente  
✅ **Expo server** funcionando permanentemente  
✅ **Inicio automático** al reiniciar el sistema  
✅ **Acceso desde iPhone** sin configuración manual  
✅ **Control fácil** de ambos servicios  

---

## 🚀 Configuración Automática (Recomendado)

### Paso 1: Ejecutar el script de configuración

```bash
# En el directorio raíz del proyecto
./scripts/setup-permanent-app.sh
```

Este script automáticamente:
- ✅ Verifica todas las dependencias
- ✅ Instala dependencias faltantes
- ✅ Configura el servidor backend como servicio
- ✅ Configura Expo como servicio
- ✅ Crea scripts de control
- ✅ Inicia ambos servicios

### Paso 2: Verificar que todo funciona

```bash
# Ver estado de los servicios
./control-services.sh status

# Ver logs en tiempo real
./control-services.sh logs
```

---

## 📱 Conectar desde iPhone

### Obtener el código QR de Expo

```bash
# Ver logs de Expo para encontrar el código QR
tail -f logs/expo.log

# O ver todos los logs
./control-services.sh logs
```

### Conectar tu iPhone

1. **Abre Expo Go** en tu iPhone
2. **Escanea el código QR** que aparece en los logs
3. **¡Listo!** La app se cargará automáticamente

---

## 🎛️ Control de Servicios

Usa el script `control-services.sh` para manejar ambos servicios:

```bash
# Iniciar todos los servicios
./control-services.sh start

# Detener todos los servicios
./control-services.sh stop

# Reiniciar todos los servicios
./control-services.sh restart

# Ver estado de los servicios
./control-services.sh status

# Ver logs en tiempo real
./control-services.sh logs

# Mostrar ayuda
./control-services.sh help
```

---

## 📊 Verificación de Estado

### Verificar Backend
```bash
# Probar endpoint de salud
curl http://localhost:3000/health

# Debería responder:
# {"status":"ok","message":"Server is running","timestamp":"...","uptime":...}
```

### Verificar Expo
```bash
# Ver logs de Expo
tail -f logs/expo.log

# Buscar líneas como:
# › Metro waiting on exp://192.168.x.x:19000
# › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

## 🔧 Configuración Manual (Avanzado)

Si prefieres configurar manualmente o el script automático no funciona:

### macOS - Configuración Manual

#### Backend Service
```bash
# Crear archivo de servicio para el backend
cat > ~/Library/LaunchAgents/com.musicdownloader.backend.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.musicdownloader.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>/ruta/completa/al/proyecto/backend/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/ruta/completa/al/proyecto/backend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/ruta/completa/al/proyecto/backend/logs/server.log</string>
    <key>StandardErrorPath</key>
    <string>/ruta/completa/al/proyecto/backend/logs/server.error.log</string>
</dict>
</plist>
EOF

# Cargar el servicio
launchctl load ~/Library/LaunchAgents/com.musicdownloader.backend.plist
```

#### Expo Service
```bash
# Crear archivo de servicio para Expo
cat > ~/Library/LaunchAgents/com.musicdownloader.expo.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.musicdownloader.expo</string>
    <key>ProgramArguments</key>
    <array>
        <string>npx</string>
        <string>expo</string>
        <string>start</string>
        <string>--tunnel</string>
        <string>--non-interactive</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/ruta/completa/al/proyecto</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/ruta/completa/al/proyecto/logs/expo.log</string>
    <key>StandardErrorPath</key>
    <string>/ruta/completa/al/proyecto/logs/expo.error.log</string>
</dict>
</plist>
EOF

# Cargar el servicio
launchctl load ~/Library/LaunchAgents/com.musicdownloader.expo.plist
```

---

## 📋 Archivos de Log

Los logs se guardan automáticamente en:

```
📁 Proyecto/
├── 📁 backend/logs/
│   ├── 📄 server.log          # Logs del servidor backend
│   └── 📄 server.error.log    # Errores del servidor backend
└── 📁 logs/
    ├── 📄 expo.log            # Logs de Expo
    └── 📄 expo.error.log      # Errores de Expo
```

### Ver logs específicos
```bash
# Solo backend
tail -f backend/logs/server.log

# Solo Expo
tail -f logs/expo.log

# Ambos al mismo tiempo
tail -f backend/logs/server.log logs/expo.log

# Usando el script de control
./control-services.sh logs
```

---

## 🔍 Solución de Problemas

### ❌ "Los servicios no se inician"

**Verificar dependencias:**
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar yt-dlp
yt-dlp --version

# Verificar Expo CLI
npx expo --version
```

**Reinstalar dependencias:**
```bash
# En el directorio raíz
npm install

# En el directorio backend
cd backend && npm install
```

### ❌ "No puedo ver el código QR de Expo"

**Ver logs de Expo:**
```bash
tail -f logs/expo.log
```

**Buscar líneas como:**
```
› Metro waiting on exp://192.168.x.x:19000
› Scan the QR code above with Expo Go
```

**Reiniciar servicio de Expo:**
```bash
./control-services.sh restart
```

### ❌ "El iPhone no se conecta"

1. **Verificar que ambos dispositivos están en la misma red WiFi**
2. **Usar modo túnel de Expo** (ya configurado automáticamente)
3. **Verificar que Expo Go está actualizado** en el iPhone

### ❌ "Los servicios no se inician al reiniciar"

**macOS - Verificar servicios:**
```bash
launchctl list | grep musicdownloader
```

**Recargar servicios:**
```bash
./control-services.sh stop
./control-services.sh start
```

---

## 🎯 Ventajas del Sistema Permanente

### ✅ **Automático**
- Los servicios se inician automáticamente al encender el Mac
- No necesitas recordar ejecutar comandos
- Funciona en segundo plano

### ✅ **Confiable**
- Los servicios se reinician automáticamente si fallan
- Logs automáticos para debugging
- Control centralizado

### ✅ **Fácil de usar**
- Un solo comando para controlar todo
- Acceso inmediato desde iPhone
- Sin configuración manual repetitiva

### ✅ **Escalable**
- Fácil de compartir con otros usuarios
- Configuración consistente
- Mantenimiento simplificado

---

## 📞 URLs de Acceso

Una vez configurado, tendrás acceso a:

```
🌐 Backend (Local):     http://localhost:3000
🌐 Backend (Red):       http://TU_IP_LOCAL:3000
📱 Expo (iPhone):       Código QR en logs/expo.log
🔍 Health Check:        http://localhost:3000/health
```

---

## 🎉 ¡Listo!

Con esta configuración:

1. **Tu servidor backend** funciona 24/7 automáticamente
2. **Expo server** está siempre disponible para tu iPhone
3. **Todo se inicia automáticamente** al reiniciar tu Mac
4. **Control fácil** con un solo comando
5. **Logs automáticos** para monitoreo

¡Ahora puedes usar tu aplicación Music Downloader desde el iPhone sin preocuparte por configuraciones manuales! 🎵 