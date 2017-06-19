const express = require('express')
const socket = require('socket.io')

const app = express()

const server = app.listen(4000, () => {
  console.log('listening to requests on port 4000')
})

// static flies
app.use(express.static('public'))

// socket setup
const io = socket(server)

io.on('connection', (socket) => {
  console.log('made socket connection', socket.id)

  // handle chat event
  socket.on('chat', (data) => {
    // 给所有客户端广播消息
    io.sockets.emit('chat', data)
  })

  // Handle typing event
  socket.on('typing', (data) => {
    // 给除了自己以外的客户端广播消息
    socket.broadcast.emit('typing', data)
  })
})