Telegram.WebApp.ready();
const user = Telegram.WebApp.initDataUnsafe.user;
let socket, gameId;

document.getElementById('btnCreate').onclick = async () => {
  const res = await fetch('https://адрес-сервера/createGame', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ hostId: user.id })
  });
  const { gameId: id } = await res.json();
  startGame(id);
};

document.getElementById('btnJoin').onclick = () => {
  const id = prompt('Введите код игры:');
  if (id) startGame(id);
};

function startGame(id) {
  gameId = id;
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  socket = io('https://адрес-сервера');
  socket.emit('join', { gameId, userId: user.id });
  socket.on('dealCards', renderHand);
  socket.on('tableUpdated', renderTable);
  socket.on('handUpdated', renderHand);
}

function renderHand(cards) {
  const hand = document.getElementById('hand');
  hand.innerHTML = '';
  cards.forEach(c => {
    const d = document.createElement('div');
    d.className = 'card'; d.innerText = c;
    d.onclick = () => socket.emit('playCard', { gameId, userId: user.id, card: c });
    hand.appendChild(d);
  });
}

function renderTable(cards) {
  const tbl = document.getElementById('table');
  tbl.innerHTML = '';
  cards.forEach(c => {
    const d = document.createElement('div');
    d.className = 'card'; d.innerText = c;
    tbl.appendChild(d);
  });
}

document.getElementById('btnTake').onclick = () => {
  socket.emit('takeTable', { gameId, userId: user.id });
};
