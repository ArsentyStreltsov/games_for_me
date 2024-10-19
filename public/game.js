const socket = io();
let currentPlayer = '';
let roomCode = '';
let isMyTurn = false;
let currentTurnPlayer = ''; // Следит за тем, чей сейчас ход

document.getElementById('joinGame').addEventListener('click', () => {
  roomCode = document.getElementById('roomCode').value;
  socket.emit('joinRoom', roomCode);
});

socket.on('roomJoined', (player) => {
  currentPlayer = player;
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('waitingMessage').style.display = 'block'; // Показываем статус ожидания
  document.getElementById('currentPlayer').textContent = `Вы играете за: ${player}`;
});

function updateTurnIndicator() {
  const turnIndicator = document.getElementById('turnIndicator');
  turnIndicator.textContent = currentTurnPlayer === currentPlayer ? 'Ваш ход' : 'Ход оппонента';
  turnIndicator.className = currentTurnPlayer === currentPlayer ? 'your-turn' : 'opponent-turn';
}

// Показываем анимацию выбора первого игрока
function showFirstPlayerAnimation(firstPlayer) {
  currentTurnPlayer = firstPlayer; // Сохраняем, кто будет ходить первым
  const animationDiv = document.getElementById('animation');
  animationDiv.textContent = "Определяем, кто будет ходить первым...";
  animationDiv.style.display = 'block';
  
  setTimeout(() => {
    animationDiv.textContent = `Первый ход у: ${firstPlayer}`;
    setTimeout(() => {
      animationDiv.style.display = 'none';
      document.getElementById('game').style.display = 'block';
      isMyTurn = currentPlayer === firstPlayer; // Если первый ход у текущего игрока
      updateTurnIndicator(); // Обновляем индикатор хода
    }, 2000); // Скрываем анимацию через 2 секунды
  }, 2000); // Имитируем задержку перед показом первого игрока
}

socket.on('secondPlayerJoined', (firstPlayer) => {
  document.getElementById('waitingMessage').style.display = 'none';
  showFirstPlayerAnimation(firstPlayer);
});

socket.on('roomFull', () => {
  alert('Комната уже заполнена');
});

let gameBoard = document.getElementById('gameBoard');

gameBoard.addEventListener('click', function (event) {
  if (event.target.tagName === 'TD' && event.target.textContent === '' && isMyTurn) {
    let id = event.target.id;
    socket.emit('makeMove', { roomCode, id, player: currentPlayer });
    isMyTurn = false; // Блокируем ход игрока после того, как он сделал ход
  }
});

socket.on('moveMade', (data) => {
  document.getElementById(data.id).textContent = data.player;
  currentTurnPlayer = data.player === 'X' ? 'O' : 'X'; // Меняем ход на следующего игрока
  isMyTurn = currentTurnPlayer === currentPlayer; // Проверяем, теперь ли ходит текущий игрок
  updateTurnIndicator(); // Обновляем индикатор хода
});

socket.on('gameOver', (data) => {
  if (data.winner === currentPlayer) {
    alert('Ты выиграл!');
  } else {
    alert('Ты проиграл!');
  }
  document.getElementById('gameControls').style.display = 'block';
});

document.getElementById('restartGame').addEventListener('click', () => {
  socket.emit('restartGame', roomCode);
});

document.getElementById('leaveLobby').addEventListener('click', () => {
  location.reload();
});

socket.on('gameReset', () => {
  let cells = document.querySelectorAll('td');
  cells.forEach(cell => cell.textContent = '');
  document.getElementById('gameControls').style.display = 'none';
});
