const express = require('express');
const path = require('path');
const log = require('pino')();
const pinoMiddleware = require('express-pino-logger')({ logger: log });

const { loadConfig, config } = require('./data/config');

const PORT = process.env.PORT || 3000;
const CLIENT_CODE_PATH = path.resolve(__dirname, '..', 'client-dist');

(async function() {
  const app = express();

  app.use(pinoMiddleware);
  app.use(express.static(CLIENT_CODE_PATH));

  app.use('/api', require('./api'));

  app.get('*', (req, res, next) => {
    res.sendFile(path.join(CLIENT_CODE_PATH, 'index.html'));
  });

  await loadConfig();
  app.listen(PORT, () => {
    log.info(`Server is listening on port ${PORT}`);
  });
})();
