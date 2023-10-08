"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var buffer_1 = require("buffer");
buffer_1.Buffer.prototype.unpack = function (format, offset) {
    if (offset === void 0) { offset = 0; }
    if (!offset) {
        offset = 0;
    }
    var data = [];
    var currentArg = 0;
    while (currentArg < format.length) {
        var arg = format[currentArg];
        switch (arg) {
            case 'C':
                data.push(this.readUInt8(offset++));
                break;
            case 'c':
                data.push(this.readInt8(offset++));
                break;
            case 'S':
                data.push(this.readUInt16LE(offset));
                offset += 2;
                break;
            case 's':
                data.push(this.readInt16LE(offset));
                offset += 2;
                break;
            case 'n':
                data.push(this.readUInt16BE(offset));
                offset += 2;
                break;
            case 'L':
                data.push(this.readUInt32LE(offset));
                offset += 4;
                break;
            case 'l':
                data.push(this.readInt32LE(offset));
                offset += 4;
                break;
            case 'x':
                offset++;
                break;
        }
        currentArg++;
    }
    return data;
};
buffer_1.Buffer.prototype.unpackString = function (n, offset) {
    var res = '';
    var end = offset + n;
    while (offset < end) {
        res += String.fromCharCode(this[offset++]);
    }
    return res;
};
//# sourceMappingURL=unpackbuffer.js.map