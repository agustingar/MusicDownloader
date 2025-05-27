# 🎵 Music Downloader - Aplicación Completa

Una aplicación completa para descargar música de YouTube en formato MP3, con interfaz móvil en React Native/Expo y servidor backend en Node.js.

## ✨ Características Principales

- 🎵 **Descarga música** de YouTube en formato MP3
- 📱 **Interfaz móvil** optimizada para iPhone
- 🎨 **Playlists personalizadas** con imágenes
- 🔄 **Servicios permanentes** - funciona automáticamente
- 🌐 **Acceso desde cualquier dispositivo** en la red local
- 📊 **Progreso en tiempo real** de descargas
- 🎛️ **Control centralizado** de servicios

---

## 🚀 Instalación Rápida (Recomendado)

### Configuración Automática Completa

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd MusicDownloader

# 2. Ejecutar configuración automática
./scripts/setup-permanent-app.sh

# 3. ¡Listo! Ambos servicios están funcionando
```

Este comando configura automáticamente:
- ✅ Servidor backend permanente
- ✅ Expo server permanente  
- ✅ Inicio automático al reiniciar
- ✅ Scripts de control

### Conectar iPhone

```bash
# Ver código QR para iPhone
./scripts/get-expo-qr.sh

# O ver logs en tiempo real
./control-services.sh logs
```

---

## 📱 Uso Diario

### Control de Servicios

```bash
# Iniciar todos los servicios
./control-services.sh start

# Ver estado
./control-services.sh status

# Ver logs en tiempo real
./control-services.sh logs

# Reiniciar servicios
./control-services.sh restart

# Detener servicios
./control-services.sh stop
```

### Conectar iPhone

1. **Abre Expo Go** en tu iPhone
2. **Ejecuta:** `./scripts/get-expo-qr.sh`
3. **Escanea el código QR** mostrado
4. **¡Disfruta la app!**

---

## 🏗️ Estructura del Proyecto

```
📁 MusicDownloader/
├── 📁 src/                    # Código fuente de la app
│   ├── 📁 components/         # Componentes React Native
│   ├── 📁 screens/           # Pantallas de la app
│   ├── 📁 services/          # Servicios (API, Downloads, etc.)
│   ├── 📁 hooks/             # Custom hooks
│   └── 📁 config/            # Configuración
├── 📁 backend/               # Servidor Node.js
│   ├── 📄 server.js          # Servidor principal
│   ├── 📄 package.json       # Dependencias backend
│   └── 📁 logs/              # Logs del servidor
├── 📁 scripts/               # Scripts de automatización
│   ├── 📄 setup-permanent-app.sh    # Configuración automática
│   └── 📄 get-expo-qr.sh            # Obtener código QR
├── 📁 logs/                  # Logs de Expo
├── 📄 control-services.sh    # Control de servicios
├── 📄 GUIA_SERVICIOS_PERMANENTES.md # Guía detallada
└── 📄 README.md              # Este archivo
```

---

## 🔧 Instalación Manual (Avanzado)

Si prefieres configurar paso a paso:

### 1. Dependencias del Sistema

```bash
# macOS
brew install node yt-dlp

# Linux
sudo apt update
sudo apt install nodejs npm
pip3 install yt-dlp
```

### 2. Dependencias del Proyecto

```bash
# Dependencias principales
npm install

# Dependencias del backend
cd backend && npm install && cd ..
```

### 3. Configurar Servicios

```bash
# Ejecutar script de configuración
./scripts/setup-permanent-app.sh
```

---

## 📊 Monitoreo y Logs

### Archivos de Log

```
📁 backend/logs/
├── 📄 server.log          # Logs del servidor
└── 📄 server.error.log    # Errores del servidor

📁 logs/
├── 📄 expo.log            # Logs de Expo
└── 📄 expo.error.log      # Errores de Expo
```

### Comandos de Monitoreo

```bash
# Ver todos los logs en tiempo real
./control-services.sh logs

# Solo logs del backend
tail -f backend/logs/server.log

# Solo logs de Expo
tail -f logs/expo.log

# Verificar salud del servidor
curl http://localhost:3000/health
```

---

## 🌐 URLs de Acceso

Una vez configurado:

```
🖥️  Backend Local:      http://localhost:3000
🌐 Backend Red Local:   http://TU_IP_LOCAL:3000
📱 Expo (iPhone):       Código QR en logs
🔍 Health Check:        http://localhost:3000/health
```

---

## 🔍 Solución de Problemas

### ❌ Los servicios no se inician

```bash
# Verificar dependencias
node --version
npm --version
yt-dlp --version

# Reinstalar dependencias
npm install
cd backend && npm install
```

### ❌ No veo el código QR

```bash
# Obtener información de conexión
./scripts/get-expo-qr.sh

# Reiniciar Expo
./control-services.sh restart
```

### ❌ iPhone no se conecta

1. Verificar que ambos están en la misma red WiFi
2. Usar modo túnel (ya configurado automáticamente)
3. Actualizar Expo Go en iPhone

### ❌ Errores de descarga

```bash
# Verificar yt-dlp
yt-dlp --version

# Actualizar yt-dlp
pip3 install --upgrade yt-dlp

# Ver logs del servidor
tail -f backend/logs/server.log
```

---

## 🎯 Características Técnicas

### Backend (Node.js)
- **Puerto:** 3000
- **API REST** para conversión de YouTube
- **Descarga automática** con yt-dlp
- **Limpieza automática** de archivos temporales
- **Logs detallados** para debugging

### Frontend (React Native/Expo)
- **Interfaz nativa** para iOS
- **Progreso en tiempo real** de descargas
- **Playlists con imágenes** personalizadas
- **Reproductor integrado**
- **Gestión de estado** optimizada

### Servicios del Sistema
- **Inicio automático** al reiniciar
- **Reinicio automático** si fallan
- **Logs centralizados**
- **Control unificado**

---

## 📚 Documentación Adicional

- 📖 **[Guía de Servicios Permanentes](GUIA_SERVICIOS_PERMANENTES.md)** - Configuración detallada
- 📱 **[Guía de Instalación iPhone](GUIA_INSTALACION_IPHONE.md)** - Instalación paso a paso
- 🔧 **[Documentación de API](backend/README.md)** - Endpoints del servidor

---

## 🎉 ¡Listo para Usar!

Con esta configuración tienes:

1. ✅ **Servidor backend** funcionando 24/7
2. ✅ **Expo server** siempre disponible
3. ✅ **Inicio automático** al reiniciar
4. ✅ **Control fácil** con comandos simples
5. ✅ **Acceso desde iPhone** sin configuración

¡Disfruta descargando tu música favorita! 🎵

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs:** `./control-services.sh logs`
2. **Verifica el estado:** `./control-services.sh status`
3. **Reinicia servicios:** `./control-services.sh restart`
4. **Consulta la documentación** en las guías incluidas

---

## 📄 Licencia

Este proyecto es de código abierto. Úsalo responsablemente y respeta los términos de servicio de YouTube. 