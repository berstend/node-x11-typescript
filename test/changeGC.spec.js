const x11 = require('../src')
const should = require('should')

let client
let X
let root
let white
let black
let wid

beforeAll(done => {
  client = x11.createClient((err, dpy) => {
    should.not.exist(err)
    X = dpy.client
    root = dpy.screen[0].root
    white = dpy.screen[0].white_pixel
    black = dpy.screen[0].black_pixel
    wid = X.AllocID()
    X.CreateWindow(wid, root, 0, 0, 1, 1) // 1x1 pixel window
    X.MapWindow(wid)
    X.QueryTree(root, (err, list) => {
      should.not.exist(err)
      list.children.indexOf(wid).should.not.equal(-1)
      done()
    })
  })
})

describe('CreateGC', () => {
  it('should create a Graphic Context correctly', () => {
    client.on('error', err => {
      should.not.exist(err)
    })

    const gc = X.AllocID()
    X.CreateGC(gc,
      wid,
      {
        foreground: black,
        background: white,
        lineStyle: 0
      }
    )

    X.ChangeGC(gc,
      {
        foreground: 0xffff00,
        background: 0x0000ff,
        lineStyle: 2
      }
    )
  })
})

afterAll(done => {
  X.DestroyWindow(wid)
  X.on('end', done)
  X.terminate()
})
