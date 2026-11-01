const { spawn } = require('child_process');

console.log('🚀 Starting Voyage AI Python Backend on http://127.0.0.1:5000 ...');
const py = spawn('python', ['-m', 'backend.app'], { stdio: 'inherit', shell: true });

console.log('⚡ Starting Voyage AI Next.js Frontend on http://localhost:3000 ...');
const next = spawn('npx', ['next', 'dev', '--turbopack'], { stdio: 'inherit', shell: true });

py.on('error', (err) => {
  console.error('[Backend Process Error]:', err);
});

next.on('error', (err) => {
  console.error('[Frontend Process Error]:', err);
});

process.on('SIGINT', () => {
  py.kill();
  next.kill();
  process.exit();
});

