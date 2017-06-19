const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime') // 用于判断各种文件类型
const cache = {} // 缓存文件内容

const chatServer = require('./lib/chat_server')

// 404
function send404(res) {
  res.writeHead(404, {'Content-Type': 'text/plain'})
  res.write('Error 404: resource not found')
  res.end()
}

// 发送文件数据
function sendFile(res, filePath, fileContents) {
  // 通过后缀名指定类型
  // path.basename提取出用 ‘/' 隔开的path的最后一部分
  res.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))})
  res.end(fileContents)
}

// 提供静态文件服务
function serverStatic(res, cache, absPath) {
  if (cache[absPath]) { // 检查文件是否缓存在内存中
    sendFile(res, absPath, cache[absPath]) // 从内存中返回
  } else {
    fs.exists(absPath, function(exists) { // 检查文件是否存在
      if (exists) {
        fs.readFile(absPath, function(err, data) { // 从硬盘中读取
          if (err) {
            send404(res)
          } else {
            cache[absPath] = data // 写入缓存，并从硬盘读取返回
            sendFile(res, absPath, data)
          }
        })
      } else {
        send404(res)
      }
    })
  }
}

// HTTP服务
const server = http.createServer((req, res) => {
  let filePath = false

  if (req.url === '/') {
    filePath = 'public/index.html'
  } else {
    filePath = 'public' + req.url // 将url路径转为文件的相对路径
  }

  const absPath = './' + filePath
  serverStatic(res, cache, absPath)
})

server.listen(3000, () => {
  console.log('server listening on port 3000.')
})

chatServer.listen(server) // 将HTTP服务提供给socket.io，使得它们共享同一个端口