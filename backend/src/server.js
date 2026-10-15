const { port } = require('./config/env');
const { createApp } = require('./app');

createApp().listen(port, () => {
  console.log(`API de FitTrack escuchando en http://localhost:${port}/api`);
});
