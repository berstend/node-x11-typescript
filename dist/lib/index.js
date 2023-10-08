"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var eventmask_1 = require("./eventmask");
exports.eventMask = eventmask_1.eventMask;
var xcore_1 = require("./xcore");
exports.createClient = xcore_1.createClient;
var keysyms_1 = require("./keysyms");
var gcfunction_1 = require("./gcfunction");
exports.keySyms = keysyms_1.default;
exports.gcFunction = gcfunction_1.default;
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
exports.CopyFromParent = 0;
exports.InputOutput = 1;
exports.InputOnly = 2;
// destination
exports.PointerWindow = 0;
exports.InputFocus = 1;
// TODO
exports.bitGravity = {};
exports.winGravity = {};
//# sourceMappingURL=index.js.map