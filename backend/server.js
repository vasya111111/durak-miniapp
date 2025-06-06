// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Храним состояние игр в памяти
const games = {};

function createDeck() {
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['6','7','8','9','10','J','Q','K','A'];
  let deck = [];
  suits.forEach(s => ranks.forEach(r => deck.push(r + s)));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

app.post('/createGame', (req, res) => {
  const { hostId } = req.body;
  const gameId = Math.random().toString(36).substr(2, 6);
  const deck = createDeck();
  games[gameId] = { players: [], deck, table: [], hands: {} };
  res.json({ gameId });
});

io.on('connection', socket => {
  socket.on('join', ({ gameId, userId }) => {
    const game = games[gameId];
    if (!game) return;
    if (!game.players.includes(userId)) {
      game.players.push(userId);
      game.hands[userId] = game.deck.splice(0, 6);
    }
    socket.join(gameId);
    io.to(gameId).emit('dealCards', game.hands[userId]);
    io.to(gameId).emit('tableUpdated', game.table);
  });

  socket.on('playCard', ({ gameId, userId, card }) => {
    const game = games[gameId];
    const hand = game.hands[userId];
    const idx = hand.indexOf(card);
    if (idx === -1) return;
    hand.splice(idx,1);
    game.table.push(card);
    io.to(gameId).emit('tableUpdated', game.table);
    io.to(gameId).emit('handUpdated', hand);
  });

  socket.on('takeTable', ({ gameId, userId }) => {
    const game = games[gameId];
    game.hands[userId].push(...game.table);
    game.table = [];
    io.to(gameId).emit('tableUpdated', game.table);
    io.to(gameId).emit('handUpdated', game.hands[userId]);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
