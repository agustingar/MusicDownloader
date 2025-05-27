# 🎵 Instrucciones del Backend - Music Downloader

## ✅ Problema Resuelto

El error **405 Method Not Allowed** se debía a que el backend no estaba ejecutándose. Ahora tienes un servidor backend local completamente funcional.

## 🚀 Cómo Iniciar el Backend

### Opción 1: Script Automático (Recomendado)
```bash
cd backend
./start-backend.sh
```

### Opción 2: Manual
```bash
cd backend
node server.js &
```

## 📊 Verificar que Funciona

Una vez iniciado, puedes verificar que el backend está funcionando:

```bash
# Verificar salud del servidor
curl http://localhost:3000/api/health

# Debería devolver algo como:
# {"status":"OK","timestamp":"2025-05-27T10:01:09.870Z","uptime":12.406585167,"activeConversions":0,"completedConversions":0,"version":"1.0.0"}
```

## 🔧 Configuración Actual

Tu app está configurada para buscar automáticamente el backend en este orden:

1. `http://localhost:3000` (servidor local)
2. `http://192.168.0.54:3000` (tu IP local)
3. Servidores en la nube (si los configuras)

## 🎯 Cómo Usar en la App

1. **Inicia el backend** usando el script o manualmente
2. **Compila la app** con `npx expo run:ios --device "iPhone de Tinin"`
3. **Busca un video** en YouTube en la app
4. **Descarga** - ahora debería funcionar sin errores 405

## 📱 Qué Cambió

### Antes:
- ❌ Error 405 Method Not Allowed
- ❌ Backend no ejecutándose
- ❌ App usaba URLs de muestra

### Ahora:
- ✅ Backend local funcionando en puerto 3000
- ✅ Conversión real de YouTube a MP3
- ✅ Descarga directa sin abrir navegador
- ✅ Modales automáticos que se cierran solos

## 🛠️ Comandos Útiles

```bash
# Ver si el backend está ejecutándose
lsof -i :3000

# Detener el backend
pkill -f "node.*server.js"

# Ver logs del servidor (si lo ejecutaste en primer plano)
# Los logs aparecerán en la terminal donde ejecutaste el servidor

# Probar conversión manualmente
curl -X POST -H "Content-Type: application/json" \
     -d '{"videoId":"dQw4w9WgXcQ"}' \
     http://localhost:3000/api/convert
```

## 🎵 ¡Listo para Usar!

Tu Music Downloader ahora:
- ✅ Convierte videos de YouTube reales a MP3
- ✅ No abre el navegador
- ✅ Modales se cierran automáticamente
- ✅ Funciona completamente offline (una vez descargado)

**¡Disfruta tu app de música sin errores!** 🎧 