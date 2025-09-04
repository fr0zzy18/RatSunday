const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public')); // віддає статичні файли з папки public

let players = {}; // зберігаємо стан клітинок гравців

io.on('connection', socket => {
    console.log('Новий гравець підключився: ' + socket.id);

    // Надсилаємо існуючий стан суперника
    socket.on('joinGame', () => {
    let opponentState = Object.values(players).find(p => p.id !== socket.id);
    if(opponentState){
        socket.emit('opponentBoard', { 
            board: opponentState.board, 
            nickname: opponentState.nickname 
        });
    }
});

    // Гравець надсилає свою картку та нік
    socket.on('setBoard', ({ board, nickname }) => {
    players[socket.id] = { id: socket.id, board, nickname };
    // Відправляємо супернику
    socket.broadcast.emit('opponentBoard', { board, nickname });
});

    // Гравець закреслив клітинку
    socket.on('markCell', (index) => {
        if(players[socket.id]){
            players[socket.id].board[index].marked = !players[socket.id].board[index].marked;
            // Відправляємо супротивнику зміни
            socket.broadcast.emit('opponentMark', index);
        }
    });

    // Відключення
    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log('Гравець відключився: ' + socket.id);
        socket.broadcast.emit('opponentDisconnected');
    });
});

http.listen(3000, () => {
    console.log('Сервер працює на http://localhost:3000');
});
