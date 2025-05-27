# Usar imagen base de Node.js
FROM node:18-slim

# Instalar solo lo esencial
RUN apt-get update && apt-get install -y curl ffmpeg && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp directamente
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

# Crear directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copiar código
COPY backend/ ./backend/

# Crear directorio de descargas
RUN mkdir -p /app/backend/downloads

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "backend/server.js"] 