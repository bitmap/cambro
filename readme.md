# cambro
`cambro` uses your webcam to detect changes in lightness. This data is then sent over websockets and you can do whatever you want with it. Like this:

<img src="https://github.com/bitmap/cambro/blob/master/etc/demo1.gif" alt="cambro demo">

# Install
You're gonna need Node.js. After running `npm install`, run `npm start` and hit up `http://localhost:5555` in one window and `http://localhost:5555/client` in another. Make sure you've given it permission to use your webcam.

# Customize
There's a settings object at the top of `src/cambro.js` that lets you tweak things like grid size and lightness threshold. Keep in mind `cambro` is has to crunch a lot of data so the more you split the grid or increase the resolution the more it's gonna chug.
