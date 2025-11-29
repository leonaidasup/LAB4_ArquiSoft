const log = console.log
const http = require('http').createServer()
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})
const port = 3000

// Almacenamos el estado del pizarrón
let boardState = {
    paths: [],
    backgroundColor: '#ffffff'
}

http.listen(port, () => log(`Server listening on port: ${port}`))

io.on('connection', (socket) => {
    log('User connected:', socket.id)
    
    // Enviar estado actual del pizarrón al nuevo usuario
    socket.emit('board-state', boardState)
    
    // Manejar nuevo trazo de dibujo
    socket.on('draw', (data) => {
        log('Draw event received:', data)
        // Guardar el trazo en el estado del servidor
        boardState.paths.push(data)
        // Retransmitir a todos los demás usuarios
        socket.broadcast.emit('draw', data)
    })
    
    // Manejar dibujo en tiempo real (mientras se dibuja)
    socket.on('drawing', (data) => {
        // No guardamos estos datos, solo los retransmitimos
        socket.broadcast.emit('drawing', data)
    })
    
    // Manejar limpieza del pizarrón
    socket.on('clear-board', () => {
        log('Board cleared by user:', socket.id)
        boardState.paths = []
        boardState.backgroundColor = '#ffffff'
        // Notificar a todos los usuarios
        io.emit('clear-board')
    })
    
    // Manejar cambio de color de fondo
    socket.on('background-color', (color) => {
        log('Background color changed to:', color)
        boardState.backgroundColor = color
        socket.broadcast.emit('background-color', color)
    })
    
    socket.on('disconnect', () => {
        log('User disconnected:', socket.id)
    })
})