const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const path = require('path')
const index = path.join(__dirname, '/index.html')

server.listen(5555)

app.use(express.static('src'))

app.get('/', (req, res) => {
  res.sendFile(index)
})

io.on('connection', (socket) => {
  // recieve client data
  socket.on('cambro_data_in', (data) => {
    // send that data to other client
    socket.broadcast.emit('cambro_data_out', {
      cambroData: data.cambroData
    })
  })
})
