/* globals io */

class Cambro {
  constructor (x, y) {
    this.settings = {
      gridX: x,
      gridY: y,
      threshold: 128,
      camWidth: 640,
      camHeight: 480,
      showGuides: true
    }

    this.ctx = null
    this.btx = null

    this.counter = -1
    this.socket = io.connect()
    this.data = []
  }

  get totalSlices () {
    return this.settings.gridX * this.settings.gridY
  }

  get slice () {
    const width = this.settings.camWidth / this.settings.gridX
    const height = this.settings.camHeight / this.settings.gridY

    return {
      width: width,
      height: height
    }
  }

  get maxPixels () {
    return this.slice.width * this.settings.camHeight / this.settings.gridY
  }

  createCanvas () {
    const video = document.createElement('video')
    video.setAttribute('autoplay', '1')
    video.setAttribute('width', this.settings.camWidth)
    video.setAttribute('height', this.settings.camHeight)

    const canvas = document.createElement('canvas')
    const banvas = document.createElement('canvas')

    canvas.width = banvas.width = this.settings.camWidth
    canvas.height = banvas.height = this.settings.camHeight

    this.ctx = canvas.getContext('2d')
    this.btx = banvas.getContext('2d')

    navigator.getUserMedia(
      { video: true },
      stream => {
        video.src = window.URL.createObjectURL(stream)
        document.body.appendChild(canvas)
        this.draw(video, this.btx, this.ctx)
      },
      err => {
        throw err
      }
    )
  }

  normalize (value) {
    const average = value / 3
    const normied = Math.floor(average / this.maxPixels * 100)
    return normied
  }

  bro (source) {
    for (let iy = 0; iy < this.settings.gridY; iy += 1) {
      for (let ix = 0; ix < this.settings.gridX; ix += 1) {
        // This is the current slice number
        this.counter += 1

        if (this.counter >= this.totalSlices) {
          this.counter = 0
        }

        // Find position of this slice
        const start = this.slice.width * ix
        const end = this.slice.height * iy

        // New data each draw

        // Reset data
        let lightness = 0

        // draw video on offscreen canvas for speed
        this.btx.drawImage(
          source,
          0,
          0,
          this.settings.camWidth,
          this.settings.camHeight
        )

        // get that data from offscreen canvas
        const sliceImage = this.btx.getImageData(
          start,
          end,
          this.slice.width,
          this.slice.height
        )

        const sliceData = sliceImage.data

        // loop through the pixels (r, g, b) to get the value
        // if it's greater than the threshold add to lightness
        for (let i = 0; i < sliceData.length; i += 4) {
          if (sliceData[i] >= this.settings.threshold) {
            lightness += 1
          }
          if (sliceData[i + 1] >= this.settings.threshold) {
            lightness += 1
          }
          if (sliceData[i + 2] >= this.settings.threshold) {
            lightness += 1
          }
        }

        // calculate average of lightness
        const normie = this.normalize(lightness)

        // update data array
        this.data.splice(this.counter, 1, normie)
        const cambroData = this.data

        // send data over websockets
        this.socket.emit('cambro_data_in', { cambroData, undefined })

        // draw image to canvas
        this.ctx.putImageData(sliceImage, start, end)

        if (this.settings.showGuides) {
          this.ctx.font = '20px monospace'
          this.ctx.fillStyle = 'lime'
          this.ctx.fillText(normie.toString(), start + 2, end + 20)

          this.ctx.fillStyle = 'magenta'
          this.ctx.fillText(this.counter.toString(), start + 2, end + 40)
        }
      }
    }
  }

  draw (video) {
    const update = () => {
      this.bro(video)
      requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  }
}

const cambro = new Cambro(4, 4)

cambro.createCanvas()
