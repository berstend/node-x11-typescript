import { eventMask as em } from './eventmask'

export { createClient } from './xcore'
export { em as eventMask }

import keysms from './keysyms'
import gcfunction from './gcfunction'

export const keySyms = keysms
export const gcFunction = gcfunction

// Object.defineProperty(module.exports, 'keySyms', {
//   enumerable: true,
//   get: function () {
//     return keysms
//   },
// })

// Object.defineProperty(module.exports, 'gcFunction', {
//   enumerable: true,
//   get: function () {
//     return gcfunction
//   },
// })

// TODO:
// keepe everything in namespace for consistensy (eventMask, keySyms, class, destination ...
// or put most used constants to top namespace? (currently class and destination in top)

// basic constants

// class
export const CopyFromParent = 0
export const InputOutput = 1
export const InputOnly = 2

// destination
export const PointerWindow = 0
export const InputFocus = 1

// TODO
export const bitGravity = {}

export const winGravity = {}
