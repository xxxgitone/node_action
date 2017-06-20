function Chat(socket) {
  this.socket = socket
}
// 发送消息
Chat.prototype.sendMessage = function(room, text) {
  const message = {
    room: room,
    text: text
  }
  this.socket.emit('message', message)
}

  // 变更房间
Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', {
    newRoom: room
  })
}

// 处理聊天命令
Chat.prototype.processCommand = function(command) {
  const words = command.split(' ')
  const cmd = words[0].substring(1, words[0].length).toLowerCase()
  let message = false

  switch(cmd) {
    case 'join':   // 处理房间的变换和创建
      words.shift()
      const room = words.join(' ')
      this.changeRoom(room)
      break
    case 'nick': // 处理更名
      words.shift()
      const name = words.join(' ')
      this.socket.emit('nameAttempt', name)
      break
    default:
      message = 'Unrecognized command.'
      break
  }

  return message
}
