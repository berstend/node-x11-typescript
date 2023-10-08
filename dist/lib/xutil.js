"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function paddedLength(len) {
    if (len) {
        return ((len + 3) >> 2) << 2;
    }
    else {
        return 0;
    }
    /*
    var rem = len % 4;
    var pl = len;
    if (rem)
        return len + 4 - rem;
    return len;
    */
}
exports.paddedLength = paddedLength;
// TODO: make it return buffer?
// str += is slow
function padded_string(str) {
    if (str.length === 0) {
        return '';
    }
    var pad = paddedLength(str.length) - str.length;
    var res = str;
    for (var i = 0; i < pad; ++i) {
        res += String.fromCharCode(0);
    }
    return res;
}
exports.padded_string = padded_string;
//# sourceMappingURL=xutil.js.map