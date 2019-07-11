const express = require('express');
const next = require('next');
const bodyParser = require('body-parser');
const http = require('http');
const SocketIO = require('socket.io');
const sslRedirect = require('heroku-ssl-redirect');

require('dotenv').config();
const db = require('./queries');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
nextApp
  .prepare()
  .then(() => {
    const app = express();
    app.use(bodyParser.json());
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    app.use(sslRedirect());

    const server = http.Server(app);
    const io = SocketIO(server);
    const apiUrl = process.env.API_URL;

    app.get('/api/fields/:roomCode', db.getRoomFields);
    app.get('/api/room/:roomCode', db.getUsers);
    app.post('/api/room', db.createRoom);
    app.post('/api/user', db.addUser);

    app.get('/room/:roomCode', (req, res) => {
      return nextApp.render(req, res, '/room', {
        roomCode: req.params.roomCode,
        apiUrl,
      });
    });
    app.get('/join/:roomCode', (req, res) => {
      return nextApp.render(req, res, '/join', {
        roomCode: req.params.roomCode,
        apiUrl,
      });
    });

    app.get('*', (req, res) => {
      return handle(req, res, '/notfound');
    });
    const port = process.env.PORT || 3000;
    server.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on port ${port}`);
    });

    io.on('connection', socket => {
      console.log('connection!');
      socket.emit('news', { hello: 'world' });
      socket.on('new-user', data => {
        console.log('server: new user');
        const { roomCode, ...user } = data;
        socket.to(roomCode).emit('add-user', { user });
      });
      socket.on('join-room', roomCode => {
        console.log('server: join room');
        socket.join(roomCode);
      });
      socket.on('error', res => {
        console.log('err');
        console.log(res);
      });
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });
