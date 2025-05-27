#!/usr/bin/env node

// Archivo de inicio para Railway
// Este archivo inicia el servidor desde el directorio backend

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor Music Downloader...');
console.log('📁 Directorio actual:', process.cwd());
console.log('📁 Directorio backend:', path.join(process.cwd(), 'backend'));

// Cambiar al directorio backend y ejecutar el servidor
process.chdir(path.join(process.cwd(), 'backend'));

console.log('📁 Nuevo directorio de trabajo:', process.cwd());

// Ejecutar npm start en el directorio backend
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🔚 Servidor terminado con código: ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.kill('SIGINT');
}); 