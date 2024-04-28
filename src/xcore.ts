import { Buffer } from 'buffer'
import { EventEmitter } from 'events'
import * as net from 'net'
import * as os from 'os'
import { coreRequests, ValueMask } from './corereqs'
import type { BigRequest } from './ext/big-requests'
import { readServerHello, writeClientHello } from './handshake'
import { stdAtoms, StdAtoms } from './stdatoms'
import { PackStream } from './unpackstream'
import { xErrors } from './xerrors'

export type RequestTemplate = Function | [string, Array<number>]
export type ResponseTemplate = Function
export type ProtocolTemplates = {
  [key: string]: [RequestTemplate] | [RequestTemplate, ResponseTemplate]
}

import * as module_apple_wm from './ext/apple-wm'
import * as module_big_requests from './ext/big-requests'
import * as module_composite from './ext/composite'
import * as module_damage from './ext/damage'
import * as module_dpms from './ext/dpms'
import * as module_fixes from './ext/fixes'
import * as module_glxconstants from './ext/glxconstants'
import * as module_glx from './ext/glx'
import * as module_glxrender from './ext/glxrender'
import * as module_randr from './ext/randr'
import * as module_render from './ext/render'
import * as module_screen_saver from './ext/screen-saver'
import * as module_shape from './ext/shape'
import * as module_xc_misc from './ext/xc-misc'
import * as module_xtest from './ext/xtest'

const extModules = {
  'apple-wm': module_apple_wm,
  'big-requests': module_big_requests,
  composite: module_composite,
  damage: module_damage,
  dpms: module_dpms,
  fixes: module_fixes,
  glxconstants: module_glxconstants,
  glx: module_glx,
  glxrender: module_glxrender,
  randr: module_randr,
  render: module_render,
  'screen-saver': module_screen_saver,
  shape: module_shape,
  'xc-misc': module_xc_misc,
  xtest: module_xtest,
}

export interface StackTrace {
  stack: string
  timestamp: number
}

export interface XCallback<T, E = XError> {
  (error: E | null, reply?: T): any
}

export interface XConnectionOptions {
  xAuthority?: string
  display?: string
  debug?: boolean
  disableBigRequests?: boolean
}

export interface XScreen {
  root: number
  default_colormap: number
  white_pixel: number
  black_pixel: number
  input_masks: number
  pixel_width: number
  pixel_height: number
  mm_width: number
  mm_height: number
  min_installed_maps: number
  max_installed_maps: number
  root_visual: number
  root_depth: number
  backing_stores: number
  num_depths: number
  depths: { [key: string]: { [key: string]: XVisual } }
}

export interface XDisplay {
  screen_num: number
  screen: XScreen[]
  resource_mask: number
  vlen: number
  rsrc_shift: number
  rsrc_id: number
  vendor: string
  format: { [key: number]: { bits_per_pixel: number; scanline_pad: number } }
  major: number
  minor: number
  xlen: number
  release: number
  resource_base: number
  motion_buffer_size: number
  max_request_length: number
  format_num: number
  image_byte_order: number
  bitmap_bit_order: number
  bitmap_scanline_unit: number
  bitmap_scanline_pad: number
  min_keycode: number
  max_keycode: number
  client?: XClient
}

export interface XVisual {
  vid: number
  class: number
  bits_per_rgb: number
  map_ent: number
  red_mask: number
  green_mask: number
  blue_mask: number
}

export interface XEvent {
  type: number
  seq: number
  rawData?: Buffer
  wid?: number
  parent?: number
}

export interface XEventParser<T extends XEvent> {
  (type: number, seq: number, extra: number, code: number, raw: Buffer): T
}

export interface XErrorParser<T = XError> {
  (error: XError, errorCode: number, seqNum: number, badValue: number, buf: Buffer): T
}

export interface XExtension {
  present: number
  majorOpcode: number
  firstEvent: number
  firstError: number
}

export interface XExtensionInit<E extends XExtension, ERR extends Error = Error> {
  (display: XDisplay, callback: XCallback<E, ERR>): void
}

export interface XExtensionModule<E extends XExtension> {
  requireExt: XExtensionInit<E>
}

// TODO remove?
// export function stash() {
//   require('./ext/apple-wm')
//   require('./ext/big-requests')
//   require('./ext/composite')
//   require('./ext/damage')
//   require('./ext/dpms')
//   require('./ext/fixes')
//   require('./ext/glxconstants')
//   require('./ext/glx')
//   require('./ext/glxrender')
//   require('./ext/randr')
//   require('./ext/render')
//   require('./ext/screen-saver')
//   require('./ext/shape')
//   require('./ext/xc-misc')
//   require('./ext/xtest')
// }

export class XError extends Error {
  error: number
  seq: number
  longstack?: StackTrace
  badParam: number
  minorOpcode: number
  majorOpcode: number
  message: string

  constructor(
    error: number,
    seq: number,
    badParam: number,
    minorOpcode: number,
    majorOpcode: number,
    message: string
  ) {
    super()
    this.error = error
    this.seq = seq
    this.badParam = badParam
    this.minorOpcode = minorOpcode
    this.majorOpcode = majorOpcode
    this.message = message
  }
}

export interface WindowAttributes {
  visual: number
  klass: number
  bitGravity: number
  winGravity: number
  backingPlanes: number
  backingPixel: number
  saveUnder: number
  mapIsInstalled: number
  mapState: number
  overrideRedirect: number
  colormap: number
  allEventMasks: number
  myEventMasks: number
  doNotPropogateMask: number
}

export class XClient extends EventEmitter {
  private readonly options: XConnectionOptions
  private coreRequests: {}
  private extRequests: {}
  private readonly displayNum: string
  private screenNum: string
  private display?: XDisplay

  private stream?: net.Socket
  private authHost?: string
  private authFamily?: 'IPv4' | 'IPv6' | undefined
  packStream: PackStream = new PackStream()
  // TODO remove?
  // private rsrcId = 0
  private _seqNum = 0
  private seq2stack: { [key: number]: StackTrace } = {}

  replies: { [key: number]: [Function | undefined, XCallback<any>] } = {}

  atoms: Readonly<StdAtoms> & { [key: string]: number } = stdAtoms
  atomNames: { [key: number]: string } = (() => {
    const names: { [key: number]: string } = {}
    Object.keys(stdAtoms).forEach((key) => {
      names[stdAtoms[key as keyof StdAtoms] as number] = key
    })
    return names
  })()

  private eventConsumers: { [key: number]: EventEmitter } = {} // maps window id to eventemitter TODO: bad name
  extraEventParsers: { [key: number]: XEventParser<XEvent> } = {}
  errorParsers: { [key: number]: XErrorParser } = {}
  private _extensions: { [key: string]: XExtension } = {}
  private _closing = false
  private _unusedIds: number[] = []

  pendingAtoms: { [key: number]: string } = {}

  // core protocol
  QueryExtension?: <E extends XExtension>(extName: string, callback: XCallback<E, Error>) => void
  CreateWindow?: (
    id: number,
    parentId: number,
    x: number,
    y: number,
    width: number,
    height: number,
    borderWidth?: number,
    depth?: number,
    _class?: number,
    visual?: number,
    values?: Partial<
      Exclude<
        { [key in keyof ValueMask['CreateWindow']]: number | boolean },
        | 'id'
        | 'parentId'
        | 'x'
        | 'y'
        | 'width'
        | 'height'
        | 'borderWidth'
        | 'depth'
        | '_class'
        | 'visual'
      >
    >
  ) => void
  MapWindow?: (wid: number) => void
  QueryPointer?: (
    wid: number,
    callback: XCallback<{
      root: number
      child: number
      rootX: number
      rootY: number
      childX: number
      childY: number
      keyMask: number
      sameScreen: number
    }>
  ) => void
  WarpPointer?: (
    srcWin: number,
    dstWin: number,
    srcX: number,
    srcY: number,
    srcWidth: number,
    srcHeight: number,
    dstX: number,
    dstY: number
  ) => void
  GrabPointer?: (
    wid: number,
    ownerEvents: boolean,
    mask: number,
    pointerMode: number,
    keybMode: number,
    confineTo: number,
    cursor: number,
    time: number
  ) => void
  AllowEvents?: (mode: number, ts: number) => void
  InternAtom?: (returnOnlyIfExist: boolean, value: string, cb: XCallback<number>) => void
  GetAtomName?: (atom: number, cb: XCallback<string>) => void
  QueryTree?: (
    window: number,
    callback: XCallback<{
      root: number
      parent: number
      children: number[]
    }>
  ) => void
  ChangeWindowAttributes?: (
    wid: number,
    values: Partial<{ [key in keyof ValueMask['CreateWindow']]: number }>
  ) => void
  DestroyWindow?: (wid: number) => void
  ChangeProperty?: (
    mode: 0 | 1 | 2,
    wid: number,
    atomName: number,
    atomType: number,
    units: 8 | 16 | 32,
    data: Buffer | string
  ) => void
  GetProperty?: (
    del: number,
    wid: number,
    name: number,
    type: number,
    longOffset: number,
    longLength: number,
    callback: XCallback<{ type: number; bytesAfter: number; data: Buffer }>
  ) => void
  CreateGC?: (
    cid: number,
    drawable: number,
    values: Partial<{
      clipXOrigin: number
      joinStyle: number
      capStyle: number
      arcMode: number
      subwindowMode: number
      foreground: number
      graphicsExposures: number
      clipMask: number
      dashOffset: number
      lineWidth: number
      dashes: number
      lineStyle: number
      fillRule: number
      background: number
      function: number
      tileStippleYOrigin: number
      tile: number
      fillStyle: number
      stipple: number
      planeMask: number
      clipYOrigin: number
      tileStippleXOrigin: number
      font: number
    }>
  ) => void
  ChangeGC?: (
    cid: number,
    values: Partial<{
      clipXOrigin: number
      joinStyle: number
      capStyle: number
      arcMode: number
      subwindowMode: number
      foreground: number
      graphicsExposures: number
      clipMask: number
      dashOffset: number
      lineWidth: number
      dashes: number
      lineStyle: number
      fillRule: number
      background: number
      function: number
      tileStippleYOrigin: number
      tile: number
      fillStyle: number
      stipple: number
      planeMask: number
      clipYOrigin: number
      tileStippleXOrigin: number
      font: number
    }>
  ) => void
  GetWindowAttributes?: (wid: number, callback: XCallback<WindowAttributes>) => void
  DeleteProperty?: (wid: number, atom: number) => void
  KillClient?: (resource: number) => void
  ForceScreenSaver?: (activate: boolean) => void
  UnmapWindow?: (wid: number) => void
  ResizeWindow?: (wid: number, width: number, height: number) => void
  MoveWindow?: (wid: number, x: number, y: number) => void
  MoveResizeWindow?: (win: number, x: number, y: number, width: number, height: number) => void
  RaiseWindow?: (win: number) => void
  LowerWindow?: (win: number) => void
  ConfigureWindow?: (
    win: number,
    options: {
      stackMode: number
      sibling: number
      borderWidth: number
      x: number
      y: number
      width: number
      height: number
    }
  ) => void
  SendEvent?: (
    destination: number,
    propagate: boolean,
    eventMask: number,
    eventRawData: Buffer
  ) => void

  constructor(displayNum: string, screenNum: string, options: XConnectionOptions) {
    super()
    this.options = options
    this.coreRequests = {}
    this.extRequests = {}

    this.displayNum = displayNum
    this.screenNum = screenNum
  }

  set seqNum(v: number) {
    this._seqNum = v
    if (this.options.debug) {
      const stack = {} as StackTrace
      Error.captureStackTrace(stack)
      stack.timestamp = Date.now()
      this.seq2stack[this.seqNum] = stack
    }
  }

  get seqNum(): number {
    return this._seqNum
  }

  init(stream: net.Socket) {
    this.stream = stream

    this.authHost = stream.remoteAddress
    this.authFamily = stream.remoteFamily as 'IPv4' | 'IPv6' | undefined
    if (!this.authHost || this.authHost === '127.0.0.1' || this.authHost === '::1') {
      this.authHost = os.hostname()
      this.authFamily = undefined
    }

    const packStream = new PackStream()

    // data received from stream is dispached to
    // read requests set by calls to .unpack and .unpackTo
    // stream.pipe(packStream);

    // packStream write requests are buffered and
    // flushed to stream as result of call to .flush
    // TODO: listen for drain event and flush automatically
    // packStream.pipe(stream);
    packStream.on('data', (data) => stream.write(data))
    stream.on('data', (data) => packStream.write(data))
    stream.on('end', () => this.emit('end'))

    this.packStream = packStream

    // FIXME use augmented types to add protocol api
    // @ts-ignore
    this.importRequestsFromTemplates(this, coreRequests)

    this.startHandshake(this.authHost)
  }

  // TODO: close() = set 'closing' flag, watch it in replies and writeQueue, terminate if empty
  terminate() {
    this.stream?.end()
  }

  // GetAtomName used as cheapest non-modifying request with reply
  // 3 - id for shortest standard atom, "ARC"
  ping(cb: XCallback<number>) {
    const start = Date.now()
    // FIXME this will be fixed once we do a huge refactor where protocol calls are defined through typescript using augmented types
    // @ts-ignore
    this.GetAtomName(3, (err, _) => {
      if (err) return cb(err)
      return cb(null, Date.now() - start)
    })
  }

  close(cb: XCallback<never>) {
    const cli = this
    cli.ping((err) => {
      if (err) return cb(err)
      cli.terminate()
      if (cb) cb(null)
    })
    cli._closing = true
  }

  importRequestsFromTemplates(target: { [key: string]: Function }, reqs: ProtocolTemplates) {
    const client = this
    this.pendingAtoms = {}

    Object.entries(reqs).forEach(([reqName, reqReplTemplate]) => {
      target[reqName] = function reqProxy(this: XClient, ...args: any[]) {
        if (client._closing) {
          throw new Error('client is in closing state')
        }

        // simple overflow handling (this means that currently there is no way to have more than 65535 requests in the queue
        // TODO: edge cases testing
        if (client.seqNum === 65535) {
          client.seqNum = 0
        } else {
          client.seqNum++
        }

        let callback = args.length > 0 ? args[args.length - 1] : null
        if (callback && callback.constructor.name !== 'Function') {
          callback = null
        }

        // TODO: see how much we can calculate in advance (not in each request)
        const reqTemplate = reqReplTemplate[0]
        let templateType: string = typeof reqTemplate

        if (templateType === 'object') {
          templateType = reqTemplate.constructor.name
        }

        if (templateType === 'function') {
          const functionTemplateType = reqTemplate as Function
          if (reqName === 'InternAtom') {
            const value = args[1]
            if (client.atoms[value]) {
              --client.seqNum
              return setImmediate(() => callback(undefined, client.atoms[value]))
            } else {
              client.pendingAtoms[client.seqNum] = value
            }
          }

          // call template with input arguments (not including callback which is last argument TODO currently with callback. won't hurt)
          // reqPack = reqTemplate.call(args);
          const reqPack = functionTemplateType.apply(this, args)
          const format = reqPack[0]
          const requestArguments = reqPack[1]

          if (callback) {
            this.replies[this.seqNum] = [reqReplTemplate[1], callback]
          }

          client.packStream.pack(format, requestArguments)
          // FIXME not needed?
          // const b = client.packStream.write_queue[0]
          client.packStream.flush()
        } else if (templateType === 'Array') {
          const arrayTemplateType = reqTemplate as [string, Array<number>]

          if (reqName === 'GetAtomName') {
            const atom = args[0]
            if (client.atomNames[atom]) {
              --client.seqNum
              return setImmediate(() => callback(undefined, client.atomNames[atom]))
            } else {
              client.pendingAtoms[client.seqNum] = atom
            }
          }

          const format = arrayTemplateType[0]
          const requestArguments = []

          for (let a = 0; a < arrayTemplateType[1].length; ++a) {
            requestArguments.push(arrayTemplateType[1][a])
          }
          args.forEach((element) => requestArguments.push(element))

          if (callback) {
            this.replies[this.seqNum] = [reqReplTemplate[1], callback]
          }

          client.packStream.pack(format, requestArguments)
          client.packStream.flush()
        } else {
          throw new Error('unknown request format - ' + templateType)
        }
      }
    })
  }

  AllocID() {
    if (!this.display) {
      throw new Error('Display not initialized.')
    }
    if (this._unusedIds.length > 0) {
      return this._unusedIds.pop()
    }
    // TODO: handle overflow (XCMiscGetXIDRange from XC_MISC ext)
    this.display.rsrc_id++
    return (this.display.rsrc_id << this.display.rsrc_shift) + this.display.resource_base
  }

  ReleaseID(id: number) {
    this._unusedIds.push(id)
  }

  unpackEvent(
    type: number,
    seq: number,
    extra: number,
    code: number,
    raw: Buffer,
    headerBuf: Buffer
  ): XEvent {
    type = type & 0x7f
    // FIXME Define an XEvent type for each specific event, instead of XEvent & {...}
    const event: XEvent & { [key: string]: any } = {
      type,
      seq,
    } // TODO: constructor & base functions
    // Remove the most significant bit. See Chapter 1, Event Format section in X11 protocol
    // specification

    const extUnpacker = this.extraEventParsers[type]
    if (extUnpacker) {
      return extUnpacker(type, seq, extra, code, raw)
    }

    if (type === 2 || type === 3 || type === 4 || type === 5 || type === 6) {
      // motion event
      const values = raw.unpack('LLLssssSC')
      // event.raw = values;
      // TODO: use unpackTo???
      event.name = [
        undefined,
        undefined,
        'KeyPress',
        'KeyRelease',
        'ButtonPress',
        'ButtonRelease',
        'MotionNotify',
      ][type]
      event.time = extra
      event.keycode = code
      event.root = values[0]
      event.wid = values[1]
      event.child = values[2]
      event.rootx = values[3]
      event.rooty = values[4]
      event.x = values[5]
      event.y = values[6]
      event.buttons = values[7]
      event.sameScreen = values[8]
    } else if (type === 7 || type === 8) {
      // EnterNotify || LeaveNotify
      event.name = type === 7 ? 'EnterNotify' : 'LeaveNotify'
      let values = raw.unpack('LLLssssSC')
      event.root = values[0]
      event.wid = values[1]
      event.child = values[2]
      event.rootx = values[3]
      event.rooty = values[4]
      event.x = values[5]
      event.y = values[6]
      event.values = values
    } else if (type === 12) {
      // Expose
      const values = raw.unpack('SSSSS')
      event.name = 'Expose'
      event.wid = extra
      event.x = values[0]
      event.y = values[1]
      event.width = values[2]
      event.height = values[3]
      event.count = values[4] // TODO: ???
    } else if (type === 16) {
      // CreateNotify
      const values = raw.unpack('LssSSSc')
      event.name = 'CreateNotify'
      event.parent = extra
      event.wid = values[0]
      event.x = values[1]
      event.y = values[2]
      event.width = values[3]
      event.height = values[4]
      event.borderWidth = values[5]
      event.overrideRedirect = !!values[6]
      // x, y, width, height, border
    } else if (type === 17) {
      // destroy notify
      const values = raw.unpack('L')
      event.name = 'DestroyNotify'
      event.event = extra
      event.wid = values[0]
    } else if (type === 18) {
      // UnmapNotify
      const values = raw.unpack('LC')
      event.name = 'UnmapNotify'
      event.event = extra
      event.wid = values[0]
      event.fromConfigure = !!values[1]
    } else if (type === 19) {
      // MapNotify
      const values = raw.unpack('LC')
      event.name = 'MapNotify'
      event.event = extra
      event.wid = values[0]
      event.overrideRedirect = !!values[1]
    } else if (type === 20) {
      const values = raw.unpack('L')
      event.name = 'MapRequest'
      event.parent = extra
      event.wid = values[0]
    } else if (type === 22) {
      const values = raw.unpack('LLssSSSC')
      event.name = 'ConfigureNotify'
      event.wid = extra
      // TODO rename
      event.wid1 = values[0]
      event.aboveSibling = values[1]
      event.x = values[2]
      event.y = values[3]
      event.width = values[4]
      event.height = values[5]
      event.borderWidth = values[6]
      event.overrideRedirect = values[7]
    } else if (type === 23) {
      const values = raw.unpack('LLssSSSS')
      event.name = 'ConfigureRequest'
      event.stackMode = code
      event.parent = extra
      event.wid = values[0]
      event.sibling = values[1]
      event.x = values[2]
      event.y = values[3]
      event.width = values[4]
      event.height = values[5]
      event.borderWidth = values[6]
      //
      // The value-mask indicates which components were specified in
      // the request. The value-mask and the corresponding values are reported as given
      // in the request. The remaining values are filled in from the current geometry of the
      // window, except in the case of sibling and stack-mode, which are reported as None
      // and Above (respectively) if not given in the request.
      event.mask = values[6]
      // 322, [ 12582925, 0, 0, 484, 316, 1, 12, 0
      // console.log([extra, code, values]);
    } else if (type === 28) {
      // PropertyNotify
      event.name = 'PropertyNotify'
      const values = raw.unpack('LLC')
      event.wid = extra
      event.atom = values[0]
      event.time = values[1]
      event.state = values[2]
    } else if (type === 29) {
      // SelectionClear
      event.name = 'SelectionClear'
      event.time = extra
      const values = raw.unpack('LL')
      event.owner = values[0]
      event.selection = values[1]
    } else if (type === 30) {
      // SelectionRequest
      event.name = 'SelectionRequest'
      // TODO check this
      event.time = extra
      const values = raw.unpack('LLLLL')
      event.owner = values[0]
      event.requestor = values[1]
      event.selection = values[2]
      event.target = values[3]
      event.property = values[4]
    } else if (type === 31) {
      // SelectionNotify
      event.name = 'SelectionNotify'
      // TODO check this
      event.time = extra
      const values = raw.unpack('LLLL')
      event.requestor = values[0]
      event.selection = values[1]
      event.target = values[2]
      event.property = values[3]
    } else if (type === 33) {
      // ClientMessage
      event.name = 'ClientMessage'
      event.format = code
      event.wid = extra
      event.message_type = raw.unpack('L')[0]
      const format = code === 32 ? 'LLLLL' : code === 16 ? 'SSSSSSSSSS' : 'CCCCCCCCCCCCCCCCCCCC'
      event.data = raw.unpack(format, 4)
    } else if (type === 34) {
      event.name = 'MappingNotify'
      event.request = headerBuf[4]
      event.firstKeyCode = headerBuf[5]
      event.count = headerBuf[6]
    }
    return event
  }

  expectReplyHeader() {
    // TODO: move error parsers to corereqs.js

    this.packStream.get(8, (headerBuf: Buffer) => {
      const res = headerBuf.unpack('CCSL')
      const type = res[0]
      const seqNum = res[2]
      const badValue = res[3]

      if (type === 0) {
        const errorCode = res[1]
        let longstack: StackTrace
        if (this.options.debug) {
          longstack = this.seq2stack[seqNum]
          console.log(this.seq2stack[seqNum].stack)
        }

        // unpack error packet (32 bytes for all error types, 8 of them in CCSL header)
        this.packStream.get(24, (buf) => {
          const res = buf.unpack('SC')
          const message = xErrors[errorCode]
          const badParam = badValue
          const minorOpcode = res[0]
          const majorOpcode = res[1]

          const error = new XError(errorCode, seqNum, badParam, minorOpcode, majorOpcode, message)
          error.longstack = longstack

          const extUnpacker = this.errorParsers[errorCode]
          if (extUnpacker) {
            extUnpacker(error, errorCode, seqNum, badValue, buf)
          }

          const handler = this.replies[seqNum]
          if (handler) {
            const callback = handler[1]
            const handled = callback(error)
            if (!handled) {
              this.emit('error', error)
            }
            // TODO: should we delete seq2stack and reply even if there is no handler?
            if (this.options.debug) {
              delete this.seq2stack[seqNum]
            }
            delete this.replies[seqNum]
          } else {
            this.emit('error', error)
          }
          this.expectReplyHeader()
        })
        return
      } else if (type > 1) {
        this.packStream.get(24, (buf) => {
          const extra = res[3]
          const code = res[1]
          const ev = this.unpackEvent(type, seqNum, extra, code, buf, headerBuf)

          // raw event 32-bytes packet (primarily for use in SendEvent);
          // TODO: Event::pack based on event parameters, inverse to unpackEvent
          ev.rawData = Buffer.alloc(32)
          headerBuf.copy(ev.rawData)
          buf.copy(ev.rawData, 8)

          this.emit('event', ev)
          if (ev.wid) {
            const ee = this.eventConsumers[ev.wid]
            if (ee) {
              ee.emit('event', ev)
            }
          }
          if (ev.parent) {
            const ee = this.eventConsumers[ev.parent]
            if (ee) {
              ee.emit('child-event', ev)
            }
          }
          this.expectReplyHeader()
        })
        return
      }

      let optData = res[1]
      const lengthTotal = res[3] // in 4-bytes units, _including_ this header
      const bodylength = 24 + lengthTotal * 4 // 24 is rest if 32-bytes header

      this.packStream.get(bodylength, (data) => {
        const handler = this.replies[seqNum]
        if (handler && handler[0]) {
          const unpack = handler[0] as Function
          if (this.pendingAtoms[seqNum]) {
            optData = seqNum
          }

          const result = unpack.call(this, data, optData)
          const callback = handler[1]
          callback(null, result)
          // TODO: add multiple replies flag and delete handler only after last reply (eg ListFontsWithInfo)
          delete this.replies[seqNum]
        }
        // wait for new packet from server
        this.expectReplyHeader()
      })
    })
  }

  private startHandshake(authHost: string) {
    writeClientHello(this.packStream, this.displayNum, authHost, this.authFamily, this.options)
    readServerHello(this.packStream, (err, display) => {
      if (err) {
        this.emit('error', err)
        return
      }
      this.expectReplyHeader()
      if (display) {
        this.display = display
        display.client = this
        this.emit('connect', display)
      }
    })
  }

  require<E extends XExtension>(extName: string, callback: XCallback<E, Error>) {
    const ext = this._extensions[extName] as E
    if (ext) {
      return process.nextTick(() => callback(null, ext))
    }

    // import('./ext/' + extName).then((extModule: XExtensionModule<E>) => {

    const extModule = (extModules as any)[extName as any] as XExtensionModule<E>
    if (!extModule) {
      throw new Error('Ext module not found: ' + extName)
    }

    if (!this.display) {
      throw new Error('Display not initialized')
    }
    extModule.requireExt(this.display, (err: Error | null, _ext?: E) => {
      if (err) {
        return callback(err)
      }
      if (_ext) {
        this._extensions[extName] = _ext
        callback(null, _ext)
      }
    })
    // })
  }
}

export function createClient(
  options: XConnectionOptions,
  initCb: XCallback<XDisplay, Error>
): XClient {
  if (typeof options === 'function') {
    initCb = options
    options = {}
  }

  if (!options) options = {}

  const display: string = options.display ?? process.env.DISPLAY ?? ':0'

  const displayMatch = display.match(/^(?:[^:]*?\/)?(.*):(\d+)(?:.(\d+))?$/)
  if (!displayMatch) {
    throw new Error('Cannot parse display')
  }

  let host = displayMatch[1]
  const displayNum = displayMatch[2] ?? '0'
  const screenNum = displayMatch[3] ?? '0'

  // open stream
  let stream: net.Socket
  let connected = false
  let cbCalled = false
  let socketPath: string | null

  // try local socket on non-windows platforms
  if (['cygwin', 'win32', 'win64'].indexOf(process.platform) < 0) {
    // FIXME check if mac is ok?
    // @ts-ignore
    if (process.platform === 'darwin' || process.platform === 'mac') {
      // socket path on OSX is /tmp/launch-(some id)/org.x:0
      if (display[0] === '/') {
        socketPath = display
      }
    } else if (!host) {
      socketPath = '/tmp/.X11-unix/X' + displayNum
    }
  }
  const client = new XClient(displayNum, screenNum, options)

  const connectStream = function () {
    if (socketPath) {
      stream = net.createConnection(socketPath)
    } else {
      stream = net.createConnection(6000 + parseInt(displayNum, 10), host)
    }
    stream.on('connect', () => {
      connected = true
      client.init(stream)
    })
    stream.on('error', (err: NodeJS.ErrnoException) => {
      if (!connected && socketPath && err.code === 'ENOENT') {
        // Retry connection with TCP on localhost
        socketPath = null
        host = 'localhost'
        try {
          connectStream()
        } catch (err2) {
          if (initCb && !cbCalled) {
            cbCalled = true
            initCb(err2 as Error)
          } else {
            client.emit('error', err2)
          }
        }
      } else if (initCb && !cbCalled) {
        cbCalled = true
        initCb(err)
      } else {
        client.emit('error', err)
      }
    })
  }
  connectStream()
  if (initCb) {
    client.on('connect', (display) => {
      // opt-in BigReq
      if (!options.disableBigRequests) {
        client.require<BigRequest>('big-requests', (err, BigReq) => {
          if (err) {
            return initCb(err)
          }
          if (BigReq) {
            BigReq.Enable((err, maxLen) => {
              if (err) {
                initCb(err)
                return
              }
              display.max_request_length = maxLen
              cbCalled = true
              initCb(null, display)
            })
          }
        })
      } else {
        cbCalled = true
        initCb(null, display)
      }
    })
  }
  return client
}
