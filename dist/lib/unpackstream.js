"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var buffer_1 = require("buffer");
var events_1 = require("events");
var xutil_1 = require("./xutil");
var ProtocolFormat;
(function (ProtocolFormat) {
    ProtocolFormat["C"] = "C";
    ProtocolFormat["S"] = "S";
    ProtocolFormat["s"] = "s";
    ProtocolFormat["l"] = "l";
    ProtocolFormat["L"] = "L";
    ProtocolFormat["x"] = "x";
    ProtocolFormat["p"] = "p";
    ProtocolFormat["a"] = "a";
})(ProtocolFormat || (ProtocolFormat = {}));
var argumentLength = (_a = {},
    _a[ProtocolFormat.C] = 1,
    _a[ProtocolFormat.S] = 2,
    _a[ProtocolFormat.s] = 2,
    _a[ProtocolFormat.L] = 4,
    _a[ProtocolFormat.l] = 4,
    _a[ProtocolFormat.x] = 1,
    _a);
var ReadFormatRequest = /** @class */ (function () {
    function ReadFormatRequest(format, callback) {
        this.format = format;
        this.currentArg = 0;
        this.data = [];
        this.callback = callback;
    }
    ReadFormatRequest.prototype.execute = function (bufferlist) {
        var _a;
        while (this.currentArg < this.format.length) {
            var arg = this.format[this.currentArg];
            if (bufferlist.length < argumentLength[arg]) {
                return false;
            } // need to wait for more data to process this argument
            // TODO: measure Buffer.readIntXXX performance and use them if faster
            // note: 4 and 2-byte values may cross chunk border & split. need to handle this correctly
            // maybe best approach is to wait all data required for format and then process fixed buffer
            // TODO: byte order!!!
            switch (arg) {
                case ProtocolFormat.C: {
                    this.data.push(bufferlist.getbyte());
                    break;
                }
                case ProtocolFormat.S:
                case ProtocolFormat.s: {
                    var b1 = bufferlist.getbyte();
                    var b2 = bufferlist.getbyte();
                    this.data.push(b2 * 256 + b1);
                    break;
                }
                case ProtocolFormat.l:
                case ProtocolFormat.L: {
                    var b1 = bufferlist.getbyte();
                    var b2 = bufferlist.getbyte();
                    var b3 = bufferlist.getbyte();
                    var b4 = bufferlist.getbyte();
                    this.data.push(((b4 * 256 + b3) * 256 + b2) * 256 + b1);
                    break;
                }
                case ProtocolFormat.x: {
                    bufferlist.getbyte();
                    break;
                }
            }
            this.currentArg++;
        }
        (_a = this.callback) === null || _a === void 0 ? void 0 : _a.call(this, this.data);
        return true;
    };
    return ReadFormatRequest;
}());
var ReadFixedRequest = /** @class */ (function () {
    function ReadFixedRequest(length, callback) {
        this.length = length;
        this.callback = callback;
        this.data = buffer_1.Buffer.alloc(length);
        this.receivedBytes = 0;
    }
    ReadFixedRequest.prototype.execute = function (bufferlist) {
        // TODO: this is a brute force version
        // replace with Buffer.slice calls
        var toReceive = this.length - this.receivedBytes;
        for (var i = 0; i < toReceive; ++i) {
            if (bufferlist.length === 0) {
                return false;
            }
            this.data[this.receivedBytes++] = bufferlist.getbyte();
        }
        this.callback(this.data);
        return true;
    };
    return ReadFixedRequest;
}());
var PackStream = /** @class */ (function (_super) {
    __extends(PackStream, _super);
    function PackStream() {
        var _this = _super.call(this) || this;
        _this.readlist = [];
        _this.length = 0;
        _this.offset = 0;
        _this.readQueue = [];
        _this.writeQueue = [];
        _this.writeLength = 0;
        _this.resumed = false;
        return _this;
    }
    PackStream.prototype.write = function (buf) {
        this.readlist.push(buf);
        this.length += buf.length;
        this.resume();
    };
    PackStream.prototype.pipe = function (stream) {
        // TODO: ondrain & pause
        this.on('data', function (data) {
            stream.write(data);
        });
    };
    PackStream.prototype.unpack = function (format, callback) {
        this.readQueue.push(new ReadFormatRequest(format, callback));
        this.resume();
    };
    PackStream.prototype.unpackTo = function (destination, namesFormats, callback) {
        var names = [];
        var format = '';
        for (var i = 0; i < namesFormats.length; ++i) {
            var off = 0;
            while (off < namesFormats[i].length && namesFormats[i][off] === ProtocolFormat.x) {
                format += ProtocolFormat.x;
                off++;
            }
            if (off < namesFormats[i].length) {
                var formatName = namesFormats[i][off];
                format += formatName;
                var name_1 = namesFormats[i].substr(off + 2);
                names.push(name_1);
            }
        }
        this.unpack(format, function (data) {
            if (data.length !== names.length) {
                throw new Error('Number of arguments mismatch, ' + names.length + ' fields and ' + data.length + ' arguments');
            }
            for (var fld = 0; fld < data.length; ++fld) {
                destination[names[fld]] = data[fld];
            }
            callback(destination);
        });
    };
    PackStream.prototype.get = function (length, callback) {
        this.readQueue.push(new ReadFixedRequest(length, callback));
        this.resume();
    };
    PackStream.prototype.resume = function () {
        if (this.resumed) {
            return;
        }
        this.resumed = true;
        // process all read requests until enough data in the buffer
        while (this.readQueue[0].execute(this)) {
            this.readQueue.shift();
            if (this.readQueue.length === 0) {
                return;
            }
        }
        this.resumed = false;
    };
    PackStream.prototype.getbyte = function () {
        var res = 0;
        var b = this.readlist[0];
        if (this.offset + 1 < b.length) {
            res = b[this.offset];
            this.offset++;
            this.length--;
        }
        else {
            // last byte in current buffer, shift read list
            res = b[this.offset];
            this.readlist.shift();
            this.length--;
            this.offset = 0;
        }
        return res;
    };
    PackStream.prototype.pack = function (format, args) {
        var packetlength = 0;
        var arg = 0;
        for (var i = 0; i < format.length; ++i) {
            var f = format[i];
            if (f === ProtocolFormat.x) {
                packetlength++;
            }
            else if (f === ProtocolFormat.p) {
                packetlength += xutil_1.paddedLength(args[arg++].length);
            }
            else if (f === ProtocolFormat.a) {
                packetlength += args[arg].length;
                arg++;
            }
            else {
                // this is a fixed-length format, get length from argument_length table
                packetlength += argumentLength[f];
                arg++;
            }
        }
        var buf = buffer_1.Buffer.alloc(packetlength);
        var offset = 0;
        arg = 0;
        for (var i = 0; i < format.length; ++i) {
            switch (format[i]) {
                case ProtocolFormat.x: {
                    buf[offset++] = 0;
                    break;
                }
                case ProtocolFormat.C: {
                    var n = args[arg++];
                    buf[offset++] = n;
                    break;
                }
                case ProtocolFormat.s: {
                    var n = args[arg++];
                    buf.writeInt16LE(n, offset);
                    offset += 2;
                    break;
                }
                case ProtocolFormat.S: {
                    var n = args[arg++];
                    buf[offset++] = n & 0xff;
                    buf[offset++] = (n >> 8) & 0xff;
                    break;
                }
                case ProtocolFormat.l: {
                    var n = args[arg++];
                    buf.writeInt32LE(n, offset);
                    offset += 4;
                    break;
                }
                case ProtocolFormat.L: {
                    var n = args[arg++];
                    buf[offset++] = n & 0xff;
                    buf[offset++] = (n >> 8) & 0xff;
                    buf[offset++] = (n >> 16) & 0xff;
                    buf[offset++] = (n >> 24) & 0xff;
                    break;
                }
                case ProtocolFormat.a: { // string, buffer, or array
                    var str = args[arg++];
                    if (buffer_1.Buffer.isBuffer(str)) {
                        str.copy(buf, offset);
                        offset += str.length;
                    }
                    else if (Array.isArray(str)) {
                        for (var _i = 0, str_1 = str; _i < str_1.length; _i++) {
                            var item = str_1[_i];
                            buf[offset++] = item;
                        }
                    }
                    else {
                        // TODO: buffer.write could be faster
                        for (var c = 0; c < str.length; ++c) {
                            buf[offset++] = str.charCodeAt(c);
                        }
                    }
                    break;
                }
                case ProtocolFormat.p: { // padded string
                    var str = args[arg++];
                    var len = xutil_1.paddedLength(str.length);
                    // TODO: buffer.write could be faster
                    var c = 0;
                    for (; c < str.length; ++c) {
                        buf[offset++] = str.charCodeAt(c);
                    }
                    for (; c < len; ++c) {
                        buf[offset++] = 0;
                    }
                    break;
                }
            }
        }
        this.writeQueue.push(buf);
        this.writeLength += buf.length;
        return this;
    };
    PackStream.prototype.flush = function () {
        // TODO: measure performance benefit of
        // creating and writing one big concatenated buffer
        // TODO: check write result
        // pause/resume streaming
        for (var i = 0; i < this.writeQueue.length; ++i) {
            // stream.write(this.write_queue[i])
            this.emit('data', this.writeQueue[i]);
        }
        this.writeQueue = [];
        this.writeLength = 0;
    };
    return PackStream;
}(events_1.EventEmitter));
exports.PackStream = PackStream;
//# sourceMappingURL=unpackstream.js.map