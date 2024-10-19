const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {}; // Хранение данных по комнатам

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New user connected');

  // Пользователь присоединяется к комнате
  socket.on('joinRoom', (roomCode) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = { players: [], board: Array(9).fill('') };
    }
  
    if (rooms[roomCode].players.length < 2) {
      rooms[roomCode].players.push(socket.id);
      socket.join(roomCode);
  
      io.to(socket.id).emit('roomJoined', rooms[roomCode].players.length === 1 ? 'X' : 'O');
  
      if (rooms[roomCode].players.length === 2) {
        const firstPlayer = Math.random() < 0.5 ? 'X' : 'O'; // Рандомно выбираем первого игрока
        io.to(roomCode).emit('secondPlayerJoined', firstPlayer);
      }
    } else {
      socket.emit('roomFull');
    }
  });

  // Обработка хода игрока
  socket.on('makeMove', ({ roomCode, id, player }) => {
    let room = rooms[roomCode];
    if (room) {
      room.board[id] = player;
      io.to(roomCode).emit('moveMade', { id, player });
      
      // Проверка победителя
      const winner = checkWinner(room.board);
      if (winner) {
        io.to(roomCode).emit('gameOver', { winner });
      }
    }
  });

  // Сброс игры
  socket.on('restartGame', (roomCode) => {
    rooms[roomCode].board = Array(9).fill('');
    io.to(roomCode).emit('gameReset');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function checkWinner(board) {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (let combo of winningCombinations) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; // Возвращаем победителя 'X' или 'O'
    }
  }
  return null; // Если победителя нет
}

// Используем динамический порт для Heroku
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
