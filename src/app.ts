const express = require('express');
const expressRequestId = require('express-request-id')();

const app = express();

app.use(expressRequestId);

const port = 3075;

app.get('/', function (req, res) {

  console.log('request id: ' + req.id);
  res.send('Pong!');
})

app.listen(port);
console.log('aika server running on port: ' + port);