const socket = io();
let currentPlayer = '';
let roomCode = '';

document.getElementById('joinGame').addEventListener('click', () => {
  roomCode = document.getElementById('roomCode').value;
  socket.emit('joinRoom', roomCode);
});

socket.on('roomJoined', (player) => {
  currentPlayer = player;
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
});

socket.on('roomFull', () => {
  alert('Комната уже заполнена');
});

let gameBoard = document.getElementById('gameBoard');

gameBoard.addEventListener('click', function (event) {
  if (event.target.tagName === 'TD' && event.target.textContent === '') {
    let id = event.target.id;
    socket.emit('makeMove', { roomCode, id, player: currentPlayer });
  }
});

socket.on('moveMade', (data) => {
  document.getElementById(data.id).textContent = data.player;
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
