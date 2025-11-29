const express = require("express");
const path = require("path");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

// SERVIR ARCHIVOS ESTÁTICOS
app.use(express.static(__dirname));

let board = [
    ["B", "", "B", ""],
    ["", "B", "", "B"],
    ["N", "", "N", ""],
    ["", "N", "", "N"]
];

let currentTurn = "B";

io.on("connection", (socket) => {
    console.log("Jugador conectado:", socket.id);

    // Enviar tablero al conectar
    socket.emit("boardState", { board, turn: currentTurn });

    // --- MOVER FICHA ---
    socket.on("move", ({ from, to }) => {
        const fx = from.x, fy = from.y;
        const tx = to.x, ty = to.y;

        const ficha = board[fy][fx];

        if (ficha === currentTurn && board[ty][tx] === "") {
            board[ty][tx] = ficha;
            board[fy][fx] = "";

            // REGISTRO DE JUGADA
            const jugada = {
                jugador: socket.id,
                ficha,
                desde: { x: fx, y: fy },
                hacia: { x: tx, y: ty }
            };

            console.log(
                `Jugador ${socket.id} movió ficha ${ficha} desde (${fx},${fy}) hacia (${tx},${ty})`
            );

            io.emit("jugada", jugada);

            // Cambiar turno
            currentTurn = currentTurn === "B" ? "N" : "B";
        }

        io.emit("boardState", { board, turn: currentTurn });
    });

    socket.on("disconnect", () => {
        console.log("Jugador desconectado:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("SERVIDOR OK → http://localhost:3000");
});
