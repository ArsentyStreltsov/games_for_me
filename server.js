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
      rooms[roomCode] = {
        players: [],
        deck: shuffleDeck(),
        hands: {}, // Руки игроков
        lives: {}, // Жизни каждого игрока
        currentPlayer: null,
        tableCards: [],
        readyPlayers: 0, // Количество готовых игроков
      };
    }

    if (rooms[roomCode].players.length < 4) {
      rooms[roomCode].players.push(socket.id);
      rooms[roomCode].lives[socket.id] = 6; // У каждого игрока 6 жизней
      socket.join(roomCode);
      io.to(socket.id).emit('roomJoined', rooms[roomCode].players.length);

      io.to(roomCode).emit('waitingForPlayers', rooms[roomCode].players.length);

      if (rooms[roomCode].players.length >= 2) {
        io.to(roomCode).emit('readyToStart');
      }
    } else {
      socket.emit('roomFull');
    }
  });

  // Игрок нажимает "Готово"
  socket.on('playerReady', (roomCode) => {
    let room = rooms[roomCode];
    room.readyPlayers++;
    if (room.readyPlayers >= 2) {
      dealCards(roomCode); // Раздаем карты игрокам
      startGame(roomCode); // Игра начинается, если два игрока готовы
    }
  });

  // Раздача карт каждому игроку
  function dealCards(roomCode) {
    let room = rooms[roomCode];
    for (let player of room.players) {
      room.hands[player] = room.deck.splice(0, 5); // Раздаем по 5 карт каждому игроку
      io.to(player).emit('dealCards', room.hands[player]); // Отправляем карты игрокам
    }
  }

  // Обработка хода игрока
  socket.on('playTurn', ({ roomCode, cards }) => {
    let room = rooms[roomCode];
    room.tableCards.push(...cards); // Добавляем карты на стол
    room.currentPlayer = getNextPlayer(room); // Определяем следующего игрока
    io.to(roomCode).emit('updateTable', room.tableCards);
    io.to(room.currentPlayer).emit('yourTurn'); // Сообщаем следующему игроку, что его ход
  });

  socket.on('challenge', ({ roomCode }) => {
    let room = rooms[roomCode];
    let previousPlayer = getPreviousPlayer(room); // Получаем предыдущего игрока для проверки
    let lastCards = room.tableCards.slice(-5); // Проверка последних карт
    // Логика проверки карт...
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

function startGame(roomCode) {
  let room = rooms[roomCode];
  room.currentPlayer = room.players[0]; // Начинает первый игрок
  io.to(roomCode).emit('gameStarted');
  io.to(room.currentPlayer).emit('yourTurn'); // Уведомляем первого игрока о начале игры
}

function getNextPlayer(room) {
  let currentIndex = room.players.indexOf(room.currentPlayer);
  return room.players[(currentIndex + 1) % room.players.length];
}

function getPreviousPlayer(room) {
  let currentIndex = room.players.indexOf(room.currentPlayer);
  return room.players[(currentIndex - 1 + room.players.length) % room.players.length];
}

function shuffleDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['J', 'Q', 'K', 'A'];
  let deck = [];

  for (let suit of suits) {
    for (let value of values) {
      for (let i = 0; i < 6; i++) {
        deck.push({ suit, value });
      }
    }
  }

  deck.push({ suit: null, value: 'Joker' }, { suit: null, value: 'Joker' });

  return deck.sort(() => Math.random() - 0.5); // Перемешиваем карты
}

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
