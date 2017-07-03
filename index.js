const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.use('/api', require('./api'));

app.get('*', (req, res, next) => {
  res.sendFile(__dirname + '/build/index.html');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
