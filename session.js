const rooms = {};

const getUserId = (socket, uid) => Object.keys(rooms[uid].players).find((player) => player !== socket.id)

const getEmptyMatrix = () => {
  return new Array(10).fill(".").map(() => new Array(10).fill("."));
}

const getMatrix = (tablero) => {
  let matrix = getEmptyMatrix();

  Object.keys(tablero).forEach((key) => {
    const { yi, yf, xi, xf } = tablero[key];
    for (let i = xi; i <= xf; i++) {
      for (let j = yi; j <= yf; j++) {
        matrix[i][j] = "s";
      }
    }
  });
  return matrix;
}

const didPlayerLose = (tablero) => {
  
    for(let i=0;i<10;i++)
        for(let j=0;j<10;j++)
            if (tablero[i][j]=='s')
                return false;
    return true;
}

const startGame = (socket, nameSpace, tablero, uid) => {
  console.log('recibiendo tablero');
  const matrix = getMatrix(tablero);
  rooms[uid].players[socket.id] = matrix;
  const tableros = Object.keys(rooms[uid].players);
  const tablerosCount = tableros.length;
  if (tablerosCount === 2) {
    const random = Math.floor(Math.random() * Math.floor(2));
    const firstShooterId = Object.keys(rooms[uid].players)[random];
    const firstShooter = nameSpace.sockets.get(firstShooterId);
    firstShooter.emit('turno');
  }
    
}

const shoot = (x, y, socket, nameSpace, playerCount, uid) => {
  const numJugador = playerCount[socket.id];
  const victimId = getUserId(socket, uid);
  const tablero = rooms[uid].players[victimId];
  const victimSocket = nameSpace.sockets.get(victimId);
  if (x < 0 || x > 9 || y < 0 || y > 9) {
    console.log(`Jugador ${numJugador}: disparo invalido en x:${x} y:${y}`);
    
    socket.emit('perdedor', {
      razon: 'tiro invalido'
    });
    victimSocket.emit('ganador', {
      razon: 'tiro invalido'
    });
    return;
  }
  if (tablero[x][y] === 's') {
    console.log(`Jugador ${numJugador}: Disparo exitoso en x:${x} y:${y}`);
    tablero[x][y] = 'x';
    socket.emit('exito', { x, y });
    victimSocket.emit('impacto', { x, y });
    //victimSocket.emit('turno');
    
    if (didPlayerLose(tablero)) {
        console.log(`Jugador ${numJugador}: perdiste`);
      socket.emit('ganador', {
        razon: 'fin'
      });
      victimSocket.emit('perdedor', {
        razon: 'fin'
      });
    } else {
      socket.emit('turno');
    }
  }
  else {
    console.log(`Jugador ${numJugador}: Disparo fallido en  x:${x + 1} y:${y + 1}`);
    tablero[x][y] = 'x';
    socket.emit('fracaso', { x, y });
    const victimSocket = nameSpace.sockets.get(victimId);
    victimSocket.emit('salvado', { x, y });
    victimSocket.emit('turno');
  }

}

module.exports = (io, uid) => {
  rooms[uid] = { uid, players: {} };
  const nameSpace = io.of(`/${uid}`);
  playerCount = {};

  nameSpace.on('connection', (socket) => {
    console.log('connection')
    playerCount[socket.id] = nameSpace.sockets.size;
    if (nameSpace.sockets.size === 2) {
      nameSpace.emit('start');
    }
    socket.on('disconnect', () => {
      console.log('Got disconnected!');
      const winnerId = getUserId(socket, uid);
      const winner = nameSpace.sockets.get(winnerId);
      if (!winner) return;
      winner.emit('ganador', {
        razon: 'desconectado'
      });
    });

    socket.on('start', (tablero) => {
      startGame(socket, nameSpace, tablero, uid);
    });

    socket.on('disparo', ({ x, y }) => {
      shoot( x, y, socket, nameSpace, playerCount, uid);
    });
  });
}