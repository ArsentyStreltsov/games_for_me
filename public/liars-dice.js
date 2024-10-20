const socket = io();
let roomCode = '';
let playerCards = [];
let isMyTurn = false;

// Присоединение к комнате
document.getElementById('joinGame').addEventListener('click', () => {
  roomCode = document.getElementById('roomCode').value;
  socket.emit('joinRoom', roomCode);
});

// Обновление лобби и ожидание игроков
socket.on('roomJoined', (playerCount) => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('waitingForPlayers').style.display = 'block';
  document.getElementById('playerCount').textContent = `Players in room: ${playerCount}`;
});

// Показываем кнопку "Ready", когда достаточно игроков
socket.on('readyToStart', () => {
  document.getElementById('readyButton').style.display = 'inline';
});

// Нажатие кнопки "Ready"
document.getElementById('readyButton').addEventListener('click', () => {
  socket.emit('playerReady', roomCode);
  const readyButton = document.getElementById('readyButton');
  readyButton.textContent = 'Ready!';
  readyButton.disabled = true;
  readyButton.style.backgroundColor = 'green';
});

// Начало игры и раздача карт
socket.on('dealCards', (cards) => {
  playerCards = cards;
  document.getElementById('waitingForPlayers').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  renderPlayerCards();
});

// Ваш ход
socket.on('yourTurn', () => {
  isMyTurn = true;
  document.getElementById('currentPlayerStatus').textContent = 'Ваш ход';
  document.getElementById('playTurn').disabled = false;
  document.getElementById('challenge').disabled = false;
});

// Обновление карт на столе
socket.on('updateTable', (cards) => {
  const tableDiv = document.getElementById('table');
  tableDiv.innerHTML = '';
  cards.forEach(card => {
    const cardElem = document.createElement('img');
    cardElem.src = getCardImage(card);
    tableDiv.appendChild(cardElem);
  });
});

// Функция рендера карт игрока
function renderPlayerCards() {
  const cardsDiv = document.getElementById('cards');
  cardsDiv.innerHTML = '';
  playerCards.forEach((card, index) => {
    const cardElem = document.createElement('img');
    cardElem.src = getCardImage(card);
    cardElem.classList.add('card');
    cardElem.setAttribute('data-index', index);
    cardElem.addEventListener('click', toggleCardSelection);
    cardsDiv.appendChild(cardElem);
  });
}

// Получаем путь к изображению карты
function getCardImage(card) {
    if (card.value === 'Joker') {
      return `/images/joker_${Math.floor(Math.random() * 6) + 1}.png`;
    }
    return `/images/${card.value}_of_${card.suit}.png`;
  }
  

// Обновление количества игроков
function updatePlayerCount(playerCount) {
  document.getElementById('playerCount').textContent = `Players in room: ${playerCount}`;
}

let selectedCards = [];

// Выбор/снятие выбора карт
function toggleCardSelection(event) {
  const cardElem = event.target;
  const cardIndex = cardElem.getAttribute('data-index');

  if (selectedCards.includes(cardIndex)) {
    selectedCards = selectedCards.filter(index => index !== cardIndex);
    cardElem.classList.remove('selected');
  } else if (selectedCards.length < 5) {
    selectedCards.push(cardIndex);
    cardElem.classList.add('selected');
  }
}

// Игровой ход
document.getElementById('playTurn').addEventListener('click', () => {
  if (isMyTurn && selectedCards.length > 0) {
    const cardsToPlay = selectedCards.map(index => playerCards[index]);
    socket.emit('playTurn', { roomCode, cards: cardsToPlay });
    isMyTurn = false;
    selectedCards = [];
    renderPlayerCards();
  }
});

// Челлендж
document.getElementById('challenge').addEventListener('click', () => {
  if (!isMyTurn) {
    socket.emit('challenge', { roomCode });
  }
});
