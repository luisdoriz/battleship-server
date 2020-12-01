const port = 3000;
var express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');


const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { 
  cors: true,
 });

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'token, Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, x-chat-id');
  if (req.method === 'OPTIONS') {
    res.send(204);
  } else {
    next();
  }
};

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app, io);

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`battleship api still alive though ${bind}`); // eslint-disable-line
}

server.listen(3000);
server.on('listening', onListening);

module.exports = {
  app,
};