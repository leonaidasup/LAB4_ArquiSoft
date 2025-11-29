// Conectar al servidor WebSocket
const socket = io('http://localhost:3000')
const log = console.log

// Variables para el canvas
let canvas, ctx
let isDrawing = false
let currentColor = '#000000'
let lineWidth = 2
let currentPath = []

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas()
    setupEventListeners()
})

function initializeCanvas() {
    canvas = document.getElementById('drawingCanvas')
    ctx = canvas.getContext('2d')
    
    // Configurar el canvas
    canvas.width = 800
    canvas.height = 600
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function setupEventListeners() {
    // Eventos del mouse
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)
    
    // Eventos táctiles para dispositivos móviles
    canvas.addEventListener('touchstart', handleTouch)
    canvas.addEventListener('touchmove', handleTouch)
    canvas.addEventListener('touchend', stopDrawing)
    
    // Botones de control
    document.getElementById('clearBtn').addEventListener('click', clearBoard)
    document.getElementById('colorPicker').addEventListener('change', changeColor)
    document.getElementById('lineWidthRange').addEventListener('input', changeLineWidth)
    document.getElementById('downloadBtn').addEventListener('click', downloadImage)
    document.getElementById('bgColorPicker').addEventListener('change', changeBackgroundColor)
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect()
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    }
}

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect()
    return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
    }
}

function startDrawing(e) {
    isDrawing = true
    const pos = getMousePos(e)
    currentPath = [{
        x: pos.x,
        y: pos.y,
        color: currentColor,
        lineWidth: lineWidth
    }]
    
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
}

function draw(e) {
    if (!isDrawing) return
    
    const pos = getMousePos(e)
    currentPath.push({
        x: pos.x,
        y: pos.y,
        color: currentColor,
        lineWidth: lineWidth
    })
    
    // Dibujar localmente
    ctx.strokeStyle = currentColor
    ctx.lineWidth = lineWidth
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    
    // Enviar datos de dibujo en tiempo real
    socket.emit('drawing', {
        x: pos.x,
        y: pos.y,
        color: currentColor,
        lineWidth: lineWidth,
        drawing: true
    })
}

function stopDrawing() {
    if (!isDrawing) return
    isDrawing = false
    
    // Enviar el trazo completo al servidor
    if (currentPath.length > 0) {
        socket.emit('draw', {
            path: currentPath,
            timestamp: Date.now()
        })
    }
    
    currentPath = []
    ctx.beginPath()
}

function handleTouch(e) {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    })
    canvas.dispatchEvent(mouseEvent)
}

function clearBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    socket.emit('clear-board')
}

function changeColor(e) {
    currentColor = e.target.value
    document.getElementById('colorDisplay').textContent = currentColor
}

function changeLineWidth(e) {
    lineWidth = e.target.value
    document.getElementById('lineWidthDisplay').textContent = lineWidth + 'px'
}

function changeBackgroundColor(e) {
    const bgColor = e.target.value
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    socket.emit('background-color', bgColor)
}

function downloadImage() {
    const link = document.createElement('a')
    link.download = 'pizarron-' + new Date().toISOString().slice(0, 10) + '.png'
    link.href = canvas.toDataURL()
    link.click()
}

function drawPath(pathData) {
    if (!pathData.path || pathData.path.length === 0) return
    
    ctx.beginPath()
    ctx.strokeStyle = pathData.path[0].color
    ctx.lineWidth = pathData.path[0].lineWidth
    ctx.moveTo(pathData.path[0].x, pathData.path[0].y)
    
    for (let i = 1; i < pathData.path.length; i++) {
        ctx.lineTo(pathData.path[i].x, pathData.path[i].y)
    }
    
    ctx.stroke()
}

// Eventos del socket
socket.on('connect', () => {
    log('Connected to server')
})

socket.on('board-state', (state) => {
    log('Received board state:', state)
    // Restaurar estado del pizarrón
    ctx.fillStyle = state.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Dibujar todos los trazos guardados
    state.paths.forEach(pathData => {
        drawPath(pathData)
    })
})

socket.on('draw', (data) => {
    log('Received draw event:', data)
    drawPath(data)
})

socket.on('drawing', (data) => {
    // Mostrar dibujo en tiempo real de otros usuarios
    if (data.drawing) {
        ctx.strokeStyle = data.color
        ctx.lineWidth = data.lineWidth
        ctx.lineTo(data.x, data.y)
        ctx.stroke()
    }
})

socket.on('clear-board', () => {
    log('Board cleared by another user')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
})

socket.on('background-color', (color) => {
    log('Background color changed by another user:', color)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
})

socket.on('disconnect', () => {
    log('Disconnected from server')
})

// Mostrar información de conexión en la consola
socket.on('connect', () => {
    log('=== WEBSOCKET CONNECTION INFO ===')
    log('Socket ID:', socket.id)
    log('Transport:', socket.io.engine.transport.name)
    log('Upgraded:', socket.io.engine.upgraded)
})