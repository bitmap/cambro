/* globals io */

var settings = {
  gridX: 4,
  gridY: 4,
  threshold: 128,
  camWidth: 640,
  camHeight: 480,
  showGuides: true
}

function init () {
  let i = 0
  let ix = 0
  let iy = 0
  let minPixels = 0
  let counter = -1
  let slice
  let sliceData
  let sliceStart
  let sliceEnd
  let lightness
  let averageLightness
  let cambroData = []
  let cambroIO

  const socket = io.connect()

  const video = document.createElement('video')
  video.setAttribute('autoplay', '1')
  video.setAttribute('width', settings.camWidth)
  video.setAttribute('height', settings.camHeight)
  // video.setAttribute('style', 'display:none')

  navigator.getUserMedia({video: true}, (stream) => {
    video.src = window.URL.createObjectURL(stream)
    update()
  }, (err) => {
    throw err
  })

  const total = (settings.gridX * settings.gridY)
  const sliceWidth = settings.camWidth / settings.gridX
  const sliceHeight = settings.camHeight / settings.gridY
  const maxPixels = (sliceWidth * settings.camHeight) / settings.gridY

  const canvas = document.createElement('canvas')
  const banvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const btx = banvas.getContext('2d')

  canvas.width = banvas.width = settings.camWidth
  canvas.height = banvas.height = settings.camHeight

  function normalize (data) {
    data = Math.floor((averageLightness - minPixels) / (maxPixels - minPixels) * 100)

    if (data >= 100) {
      data = 100
    }

    return data
  }

  function draw (video) {
    for (iy = 0; iy < settings.gridY; iy++) {
      for (ix = 0; ix < settings.gridX; ix++) {
        sliceStart = (sliceWidth * ix)
        sliceEnd = (sliceHeight * iy)

        // set variable to 0 each draw
        lightness = 0

        // draw video on offscreen canvas for speed
        btx.drawImage(video, 0, 0, settings.camWidth, settings.camHeight)

        // get that data from offscreen canvas
        slice = btx.getImageData(sliceStart, sliceEnd, sliceWidth, sliceHeight)
        sliceData = slice.data

        // loop through the pixels (r , g, b) to get the value
        // if it's greater than the threshold add to lightness
        for (i = 0; i < sliceData.length; i += 4) {
          if (sliceData[i] >= settings.threshold) {
            lightness += 1
          }
          if (sliceData[i + 1] >= settings.threshold) {
            lightness += 1
          }
          if (sliceData[i + 2] >= settings.threshold) {
            lightness += 1
          }
        }

        // calculate average of lightness
        averageLightness = (lightness / 3)

        // take that data and normalize it (0 - 100)
        normalize(averageLightness)

        counter += 1

        if (counter >= total) {
          counter = 0
        }

        cambroData.splice(counter, 1, normalize())

        socket.emit('cambro_data_in', {cambroData, cambroIO})

        ctx.putImageData(slice, sliceStart, sliceEnd)

        if (settings.showGuides) {
          ctx.font = '20px monospace'
          ctx.fillStyle = 'lime'
          ctx.fillText(normalize().toString(), (sliceStart + 2), (sliceEnd + 20))

          ctx.fillStyle = 'magenta'
          ctx.fillText(counter.toString(), (sliceStart + 2), (sliceEnd + 40))
        }
      }
    }
  } // end draw()

  document.body.appendChild(canvas)

  var update = () => {
    draw(video)
    requestAnimationFrame(update)
  }

  requestAnimationFrame(update)
}

init()
