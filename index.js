const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'pug');

app.use((req, res, next) => {
  // SET res.locals

  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(require('./routes'));

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
