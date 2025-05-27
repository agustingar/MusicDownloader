#!/bin/bash

# Script para actualizar la URL de Railway en el código

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la URL de Railway"
    echo ""
    echo "Uso: $0 https://tu-app.up.railway.app"
    echo ""
    echo "Ejemplo: $0 https://musicdownloader-production.up.railway.app"
    exit 1
fi

RAILWAY_URL="$1"

echo "🔄 Actualizando URL de Railway a: $RAILWAY_URL"

# Actualizar ApiService.ts
if [ -f "src/services/ApiService.ts" ]; then
    sed -i.bak "s|'https://tu-app.up.railway.app'|'$RAILWAY_URL'|g" src/services/ApiService.ts
    rm -f src/services/ApiService.ts.bak
    echo "✅ ApiService.ts actualizado"
else
    echo "❌ No se encontró src/services/ApiService.ts"
fi

# Actualizar api.ts si existe
if [ -f "src/config/api.ts" ]; then
    sed -i.bak "s|export const API_BASE_URL = '.*';|export const API_BASE_URL = '$RAILWAY_URL';|g" src/config/api.ts
    rm -f src/config/api.ts.bak
    echo "✅ api.ts actualizado"
fi

echo ""
echo "🎉 ¡URL de Railway actualizada!"
echo "📱 Ahora puedes usar tu app con el servidor en Railway"
echo ""
echo "Para probar:"
echo "  curl $RAILWAY_URL/health" 