const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./api'));

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
