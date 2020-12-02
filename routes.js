const { v4: uuidv4 } = require('uuid');
const session = require('./session');

const rooms = [];

module.exports = (app, io) => {
  app.get("/room", (req, res) => {
    let uid = "";
    const availableRoom = rooms.filter(room => room.users === 1);
    if (availableRoom.length < 1 || rooms.length < 1) {//no hay sesiones disponibles, crear una
      uid = uuidv4();
      rooms.push({ uid, users: 1 });
      session(io, uid);//crear websocket namespace
    } else {//Hay sesiones con 1 solo jugador, añadirlo
      uid = availableRoom[0].uid;
      availableRoom[0].users = 2;
      rooms.pop();
    }
    res.send({ room: uid }).status(200);
  });

};

