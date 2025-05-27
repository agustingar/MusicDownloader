# Usar imagen base de Node.js
FROM node:18-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp
RUN pip3 install yt-dlp

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json del backend
COPY backend/package*.json ./backend/

# Instalar dependencias de Node.js
RUN cd backend && npm ci --only=production

# Copiar código del backend
COPY backend/ ./backend/

# Crear directorio de descargas
RUN mkdir -p /app/backend/downloads

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start", "--prefix", "backend"] 