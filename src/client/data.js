/* globals io */

const ip = 'http://localhost:5555'
const socket = io.connect(ip)
let cambroData = []

socket.on('cambro_data_out', (data) => {
  cambroData = data.cambroData || []
})
