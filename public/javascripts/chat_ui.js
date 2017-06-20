function divEscapedContentElement(message) {
  return $('<div></div>').text(message)
}

// 处理可疑文本
function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</li>')
}

// 处理原始的用户输入
function processUserInput(chatApp, socket) {
  let message = $('#sned-message').val()
  let systemMessage

  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message)
    if (systemMessage) {
      $('#message').append(divSystemContentElement(systemMessage))
    }
  } else {
    chatApp.sendMessage($('#room').text(), message)
    $('#message').append(divEscapedContentElement(message))
    $('#messages').scrollTop($('#message').prop('scrollHeight'));
  }

  $('#send-message').val('');
}


let socket = io.connect()

$(document).ready(function () {
  let chatApp = new Chat(socket)

  socket.on('nameResult', function(result) { // 显示更名结果
    let message
    console.log('nameResult： ' + result)
    if (result.success) {
      message = 'You are now known as ' + result.name + '.'
    } else {
      message = result.message
    }
    $('#message').append(divSystemContentElement(message))
  })

  socket.on('joinResult', function(result) { // 显示房间更名结果
    $('#room').text(result.room)
    $('#message').append(divSystemContentElement('Room changed.'))
  })

  socket.on('message', function(message) { // 显示接收到的消息
    let newElement = $('<div></div>').text(message.text)
    $('#message').append(newElement)
  })

  socket.on('rooms', function(rooms) { // 显示可用房间
    $('#room-list').empty()

    for(let room in rooms) {
      room = room.substring(1, room.length)
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(function () {  // 点击房间名可以切换到哪个房间
      chatApp.processCommand('/join ' + $(this).text())
      $('#send-message').focus()
    })
  })

  setInterval(function () { // 定期请求可用房间列表
    socket.emit('rooms')
  }, 1000)

  $('#send-message').focus()

  $('#send-form').submit(function () {  // 提交表单可疑发送聊天消息
    processUserInput(chatApp, socket)
    return false
  })
})
