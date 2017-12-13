/* globals io */

const bro = Symbol('bro')
const draw = Symbol('draw')
const normalize = Symbol('normalize')

class Cambro {
  constructor (x, y, t = 128, w = 640, h = 480) {
    this.gridX = x
    this.gridY = y
    this.width = w
    this.height = h
    this.threshold = t
    this.showGuides = true
    this.data = []
    this.socket = io.connect()
  }

  get totalSlices () {
    return this.gridX * this.gridY
  }

  get slice () {
    const width = this.width / this.gridX
    const height = this.height / this.gridY

    return {
      width: width,
      height: height
    }
  }

  get maxPixels () {
    return this.slice.width * this.height / this.gridY
  }

  [normalize] (value) {
    const average = value / 3
    const normied = Math.floor(average / this.maxPixels * 100)
    return normied
  }

  [bro] (source, context, backContext) {
    let sliceValue = 0
    let sliceCount = -1
    let cambroData = []

    for (let iy = 0; iy < this.gridY; iy += 1) {
      for (let ix = 0; ix < this.gridX; ix += 1) {
        // This is the current slice number
        sliceCount += 1

        // Find position of this slice
        const start = this.slice.width * ix
        const end = this.slice.height * iy

        // Reset data
        let lightness = 0

        // draw video on offscreen canvas for speed
        backContext.drawImage(source, 0, 0, this.width, this.height)

        // get that data from offscreen canvas
        const sliceImage = backContext.getImageData(
          start,
          end,
          this.slice.width,
          this.slice.height
        )

        const sliceData = sliceImage.data

        // loop through the pixels (r, g, b) to get the value
        // if it's greater than the threshold add to lightness
        for (let i = 0; i < sliceData.length; i += 4) {
          if (sliceData[i] >= this.threshold) {
            lightness += 1
          }
          if (sliceData[i + 1] >= this.threshold) {
            lightness += 1
          }
          if (sliceData[i + 2] >= this.threshold) {
            lightness += 1
          }
        }

        // calculate average of lightness
        sliceValue = this[normalize](lightness)

        // update data array
        this.data.splice(sliceCount, 1, sliceValue)
        cambroData = this.data

        // draw image to canvas
        context.putImageData(sliceImage, start, end)

        if (this.showGuides) {
          context.font = '20px monospace'
          context.fillStyle = 'lime'
          context.fillText(sliceValue.toString(), start + 2, end + 20)

          context.fillStyle = 'magenta'
          context.fillText(sliceCount.toString(), start + 2, end + 40)
        }
      }
    }

    // send data over websockets
    this.socket.emit('cambro_data_in', { cambroData, undefined })
  }

  [draw] (video, context, backContext) {
    const update = () => {
      this[bro](video, context, backContext)
      requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  }

  start () {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const banvas = document.createElement('canvas')

    video.width = canvas.width = banvas.width = this.width
    video.height = canvas.height = banvas.height = this.height

    video.setAttribute('autoplay', true)

    const ctx = canvas.getContext('2d')
    const btx = banvas.getContext('2d')

    navigator.getUserMedia(
      { video: true },
      stream => {
        video.src = window.URL.createObjectURL(stream)
        document.body.appendChild(canvas)
        this[draw](video, ctx, btx)
      },
      err => {
        throw err
      }
    )
  }
}

const cambro = new Cambro(4, 4)
console.log(cambro);
cambro.start()
