# Dockerfile para Music Downloader Backend
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && pip3 install yt-dlp

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio de descargas
RUN mkdir -p downloads

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"] 