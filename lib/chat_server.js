const socketio = require('socket.io')
let io
let guestNumber = 1
let nickNames = {}
let namesUsed = []
let currentRoom = {}

exports.listen = function(server) {
  io = socketio.listen(server)

  io.serveClient('log level', 1)

  io.sockets.on('connection', (socket) => { // 定义每个用户连接的处理逻辑
    // 在用户连接上来时赋予其一个访客名
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed)

    // 在用户连接上来时把他放入聊天室Lobby
    joinRoom(socket, 'Lobby')

    // 处理用户的消息，更名，以及聊天室的创建和变更
    handleMessageBroadcasting(socket, nickNames)
    handleNameChangeAttempts(socket, nickNames, namesUsed)
    handleRoomJoining(socket)

    // 用户发出请求时，向其提供已经被占用的聊天室的列表
    socket.on('rooms', () => { 
      socket.emit('rooms', io.sockets.manager.rooms)
    })

    // 定义用户断开连接后的清楚逻辑
    handleClientDisconnection(socket, nickNames, namesUsed)
  })
}

// 分配昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  let name = 'Guest' + guestNumber // 生成新的昵称
  nickNames[socket.id] = name // 把用户昵称跟客户端连接id关联上
  socket.emit('nameResult', { // 让用户知道他么的昵称
    success: true,
    name: name
  })
  namesUsed.push(name) // 存放已被占用的昵称
  return guestNumber + 1 // 增加用来生成昵称的计数器
}

// 进入聊天室
function joinRoom(socket, room) {
  socket.join(room) // 让用户进入房间
  currentRoom[socket.id] = room // 记录用户的当前房间
  socket.emit('joinResult', {room: room}) // 让用户知道它们进入了新的房间
  socket.broadcast.to(room).emit('message', { // 通知房间其他的人有新用户进入
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  })

  const usersInRoom = io.sockets.clients(room) // 确定哪些用户在这个房间
  // 如果不止一个用户在这个房间，汇总
  if (usersInRoom.length > 1) {
    let usersInRoomSummary = 'User currently in ' + room + ': '
    for(let index in usersInRoom) {
      const userSocketId = usersInRoom[index].id
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', '
        }
      }
      usersInRoomSummary += nickNames[userSocketId]
    }
    usersInRoomSummary += '.'
    socket.emit('message', {text: usersInRoomSummary}) // 将房间里其他用户的汇总发送给这个用户
  }
}

// 处理昵称变更要求
handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', (name) => {
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      })
    } else {
      if (namesUsed.indexOf(name) === -1) {
        const previousName = nickNames[socket.id]
        const previousNameIndex = namesUsed.indexOf(previousName)
        namesUsed.push(name)
        nickNames[socket.id] = name
        delete namesUsed[previousNameIndex]
        socket.emit('nameResult', {
          success: true,
          name: name
        })
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        })
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use'
        })
      }
    }
  })
}
