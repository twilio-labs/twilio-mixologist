const express = require('express');
const path = require('path');

const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'pug');

app.use((req, res, next) => {
  // SET res.locals
  res.locals.PUSHER_APP_KEY = process.env.PUSHER_APP_KEY;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(require('./routes'));

sequelize.sync({force: false}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
