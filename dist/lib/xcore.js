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
Object.defineProperty(exports, "__esModule", { value: true });
var buffer_1 = require("buffer");
var events_1 = require("events");
var net = require("net");
var os = require("os");
var corereqs_1 = require("./corereqs");
var handshake_1 = require("./handshake");
var stdatoms_1 = require("./stdatoms");
var unpackstream_1 = require("./unpackstream");
var xerrors_1 = require("./xerrors");
var module_apple_wm = require("./ext/apple-wm");
var module_big_requests = require("./ext/big-requests");
var module_composite = require("./ext/composite");
var module_damage = require("./ext/damage");
var module_dpms = require("./ext/dpms");
var module_fixes = require("./ext/fixes");
var module_glxconstants = require("./ext/glxconstants");
var module_glx = require("./ext/glx");
var module_glxrender = require("./ext/glxrender");
var module_randr = require("./ext/randr");
var module_render = require("./ext/render");
var module_screen_saver = require("./ext/screen-saver");
var module_shape = require("./ext/shape");
var module_xc_misc = require("./ext/xc-misc");
var module_xtest = require("./ext/xtest");
var extModules = {
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
};
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
var XError = /** @class */ (function (_super) {
    __extends(XError, _super);
    function XError(error, seq, badParam, minorOpcode, majorOpcode, message) {
        var _this = _super.call(this) || this;
        _this.error = error;
        _this.seq = seq;
        _this.badParam = badParam;
        _this.minorOpcode = minorOpcode;
        _this.majorOpcode = majorOpcode;
        _this.message = message;
        return _this;
    }
    return XError;
}(Error));
exports.XError = XError;
var XClient = /** @class */ (function (_super) {
    __extends(XClient, _super);
    function XClient(displayNum, screenNum, options) {
        var _this = _super.call(this) || this;
        _this.packStream = new unpackstream_1.PackStream();
        // TODO remove?
        // private rsrcId = 0
        _this._seqNum = 0;
        _this.seq2stack = {};
        _this.replies = {};
        _this.atoms = stdatoms_1.stdAtoms;
        _this.atomNames = (function () {
            var names = {};
            Object.keys(stdatoms_1.stdAtoms).forEach(function (key) {
                names[stdatoms_1.stdAtoms[key]] = key;
            });
            return names;
        })();
        _this.eventConsumers = {}; // maps window id to eventemitter TODO: bad name
        _this.extraEventParsers = {};
        _this.errorParsers = {};
        _this._extensions = {};
        _this._closing = false;
        _this._unusedIds = [];
        _this.pendingAtoms = {};
        _this.options = options;
        _this.coreRequests = {};
        _this.extRequests = {};
        _this.displayNum = displayNum;
        _this.screenNum = screenNum;
        return _this;
    }
    Object.defineProperty(XClient.prototype, "seqNum", {
        get: function () {
            return this._seqNum;
        },
        set: function (v) {
            this._seqNum = v;
            if (this.options.debug) {
                var stack = {};
                Error.captureStackTrace(stack);
                stack.timestamp = Date.now();
                this.seq2stack[this.seqNum] = stack;
            }
        },
        enumerable: true,
        configurable: true
    });
    XClient.prototype.init = function (stream) {
        var _this = this;
        this.stream = stream;
        this.authHost = stream.remoteAddress;
        this.authFamily = stream.remoteFamily;
        if (!this.authHost || this.authHost === '127.0.0.1' || this.authHost === '::1') {
            this.authHost = os.hostname();
            this.authFamily = undefined;
        }
        var packStream = new unpackstream_1.PackStream();
        // data received from stream is dispached to
        // read requests set by calls to .unpack and .unpackTo
        // stream.pipe(packStream);
        // packStream write requests are buffered and
        // flushed to stream as result of call to .flush
        // TODO: listen for drain event and flush automatically
        // packStream.pipe(stream);
        packStream.on('data', function (data) { return stream.write(data); });
        stream.on('data', function (data) { return packStream.write(data); });
        stream.on('end', function () { return _this.emit('end'); });
        this.packStream = packStream;
        // FIXME use augmented types to add protocol api
        // @ts-ignore
        this.importRequestsFromTemplates(this, corereqs_1.coreRequests);
        this.startHandshake(this.authHost);
    };
    // TODO: close() = set 'closing' flag, watch it in replies and writeQueue, terminate if empty
    XClient.prototype.terminate = function () {
        var _a;
        (_a = this.stream) === null || _a === void 0 ? void 0 : _a.end();
    };
    // GetAtomName used as cheapest non-modifying request with reply
    // 3 - id for shortest standard atom, "ARC"
    XClient.prototype.ping = function (cb) {
        var start = Date.now();
        // FIXME this will be fixed once we do a huge refactor where protocol calls are defined through typescript using augmented types
        // @ts-ignore
        this.GetAtomName(3, function (err, _) {
            if (err)
                return cb(err);
            return cb(null, Date.now() - start);
        });
    };
    XClient.prototype.close = function (cb) {
        var cli = this;
        cli.ping(function (err) {
            if (err)
                return cb(err);
            cli.terminate();
            if (cb)
                cb(null);
        });
        cli._closing = true;
    };
    XClient.prototype.importRequestsFromTemplates = function (target, reqs) {
        var client = this;
        this.pendingAtoms = {};
        Object.entries(reqs).forEach(function (_a) {
            var reqName = _a[0], reqReplTemplate = _a[1];
            target[reqName] = function reqProxy() {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (client._closing) {
                    throw new Error('client is in closing state');
                }
                // simple overflow handling (this means that currently there is no way to have more than 65535 requests in the queue
                // TODO: edge cases testing
                if (client.seqNum === 65535) {
                    client.seqNum = 0;
                }
                else {
                    client.seqNum++;
                }
                var callback = args.length > 0 ? args[args.length - 1] : null;
                if (callback && callback.constructor.name !== 'Function') {
                    callback = null;
                }
                // TODO: see how much we can calculate in advance (not in each request)
                var reqTemplate = reqReplTemplate[0];
                var templateType = typeof reqTemplate;
                if (templateType === 'object') {
                    templateType = reqTemplate.constructor.name;
                }
                if (templateType === 'function') {
                    var functionTemplateType = reqTemplate;
                    if (reqName === 'InternAtom') {
                        var value_1 = args[1];
                        if (client.atoms[value_1]) {
                            --client.seqNum;
                            return setImmediate(function () { return callback(undefined, client.atoms[value_1]); });
                        }
                        else {
                            client.pendingAtoms[client.seqNum] = value_1;
                        }
                    }
                    // call template with input arguments (not including callback which is last argument TODO currently with callback. won't hurt)
                    // reqPack = reqTemplate.call(args);
                    var reqPack = functionTemplateType.apply(this, args);
                    var format = reqPack[0];
                    var requestArguments = reqPack[1];
                    if (callback) {
                        this.replies[this.seqNum] = [reqReplTemplate[1], callback];
                    }
                    client.packStream.pack(format, requestArguments);
                    // FIXME not needed?
                    // const b = client.packStream.write_queue[0]
                    client.packStream.flush();
                }
                else if (templateType === 'Array') {
                    var arrayTemplateType = reqTemplate;
                    if (reqName === 'GetAtomName') {
                        var atom_1 = args[0];
                        if (client.atomNames[atom_1]) {
                            --client.seqNum;
                            return setImmediate(function () { return callback(undefined, client.atomNames[atom_1]); });
                        }
                        else {
                            client.pendingAtoms[client.seqNum] = atom_1;
                        }
                    }
                    var format = arrayTemplateType[0];
                    var requestArguments_1 = [];
                    for (var a = 0; a < arrayTemplateType[1].length; ++a) {
                        requestArguments_1.push(arrayTemplateType[1][a]);
                    }
                    args.forEach(function (element) { return requestArguments_1.push(element); });
                    if (callback) {
                        this.replies[this.seqNum] = [reqReplTemplate[1], callback];
                    }
                    client.packStream.pack(format, requestArguments_1);
                    client.packStream.flush();
                }
                else {
                    throw new Error('unknown request format - ' + templateType);
                }
            };
        });
    };
    XClient.prototype.AllocID = function () {
        if (!this.display) {
            throw new Error('Display not initialized.');
        }
        if (this._unusedIds.length > 0) {
            return this._unusedIds.pop();
        }
        // TODO: handle overflow (XCMiscGetXIDRange from XC_MISC ext)
        this.display.rsrc_id++;
        return (this.display.rsrc_id << this.display.rsrc_shift) + this.display.resource_base;
    };
    XClient.prototype.ReleaseID = function (id) {
        this._unusedIds.push(id);
    };
    XClient.prototype.unpackEvent = function (type, seq, extra, code, raw, headerBuf) {
        type = type & 0x7f;
        // FIXME Define an XEvent type for each specific event, instead of XEvent & {...}
        var event = {
            type: type,
            seq: seq,
        }; // TODO: constructor & base functions
        // Remove the most significant bit. See Chapter 1, Event Format section in X11 protocol
        // specification
        var extUnpacker = this.extraEventParsers[type];
        if (extUnpacker) {
            return extUnpacker(type, seq, extra, code, raw);
        }
        if (type === 2 || type === 3 || type === 4 || type === 5 || type === 6) {
            // motion event
            var values = raw.unpack('LLLssssSC');
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
            ][type];
            event.time = extra;
            event.keycode = code;
            event.root = values[0];
            event.wid = values[1];
            event.child = values[2];
            event.rootx = values[3];
            event.rooty = values[4];
            event.x = values[5];
            event.y = values[6];
            event.buttons = values[7];
            event.sameScreen = values[8];
        }
        else if (type === 7 || type === 8) {
            // EnterNotify || LeaveNotify
            event.name = type === 7 ? 'EnterNotify' : 'LeaveNotify';
            var values = raw.unpack('LLLssssSC');
            event.root = values[0];
            event.wid = values[1];
            event.child = values[2];
            event.rootx = values[3];
            event.rooty = values[4];
            event.x = values[5];
            event.y = values[6];
            event.values = values;
        }
        else if (type === 12) {
            // Expose
            var values = raw.unpack('SSSSS');
            event.name = 'Expose';
            event.wid = extra;
            event.x = values[0];
            event.y = values[1];
            event.width = values[2];
            event.height = values[3];
            event.count = values[4]; // TODO: ???
        }
        else if (type === 16) {
            // CreateNotify
            var values = raw.unpack('LssSSSc');
            event.name = 'CreateNotify';
            event.parent = extra;
            event.wid = values[0];
            event.x = values[1];
            event.y = values[2];
            event.width = values[3];
            event.height = values[4];
            event.borderWidth = values[5];
            event.overrideRedirect = !!values[6];
            // x, y, width, height, border
        }
        else if (type === 17) {
            // destroy notify
            var values = raw.unpack('L');
            event.name = 'DestroyNotify';
            event.event = extra;
            event.wid = values[0];
        }
        else if (type === 18) {
            // UnmapNotify
            var values = raw.unpack('LC');
            event.name = 'UnmapNotify';
            event.event = extra;
            event.wid = values[0];
            event.fromConfigure = !!values[1];
        }
        else if (type === 19) {
            // MapNotify
            var values = raw.unpack('LC');
            event.name = 'MapNotify';
            event.event = extra;
            event.wid = values[0];
            event.overrideRedirect = !!values[1];
        }
        else if (type === 20) {
            var values = raw.unpack('L');
            event.name = 'MapRequest';
            event.parent = extra;
            event.wid = values[0];
        }
        else if (type === 22) {
            var values = raw.unpack('LLssSSSC');
            event.name = 'ConfigureNotify';
            event.wid = extra;
            // TODO rename
            event.wid1 = values[0];
            event.aboveSibling = values[1];
            event.x = values[2];
            event.y = values[3];
            event.width = values[4];
            event.height = values[5];
            event.borderWidth = values[6];
            event.overrideRedirect = values[7];
        }
        else if (type === 23) {
            var values = raw.unpack('LLssSSSS');
            event.name = 'ConfigureRequest';
            event.stackMode = code;
            event.parent = extra;
            event.wid = values[0];
            event.sibling = values[1];
            event.x = values[2];
            event.y = values[3];
            event.width = values[4];
            event.height = values[5];
            event.borderWidth = values[6];
            //
            // The value-mask indicates which components were specified in
            // the request. The value-mask and the corresponding values are reported as given
            // in the request. The remaining values are filled in from the current geometry of the
            // window, except in the case of sibling and stack-mode, which are reported as None
            // and Above (respectively) if not given in the request.
            event.mask = values[6];
            // 322, [ 12582925, 0, 0, 484, 316, 1, 12, 0
            // console.log([extra, code, values]);
        }
        else if (type === 28) {
            // PropertyNotify
            event.name = 'PropertyNotify';
            var values = raw.unpack('LLC');
            event.wid = extra;
            event.atom = values[0];
            event.time = values[1];
            event.state = values[2];
        }
        else if (type === 29) {
            // SelectionClear
            event.name = 'SelectionClear';
            event.time = extra;
            var values = raw.unpack('LL');
            event.owner = values[0];
            event.selection = values[1];
        }
        else if (type === 30) {
            // SelectionRequest
            event.name = 'SelectionRequest';
            // TODO check this
            event.time = extra;
            var values = raw.unpack('LLLLL');
            event.owner = values[0];
            event.requestor = values[1];
            event.selection = values[2];
            event.target = values[3];
            event.property = values[4];
        }
        else if (type === 31) {
            // SelectionNotify
            event.name = 'SelectionNotify';
            // TODO check this
            event.time = extra;
            var values = raw.unpack('LLLL');
            event.requestor = values[0];
            event.selection = values[1];
            event.target = values[2];
            event.property = values[3];
        }
        else if (type === 33) {
            // ClientMessage
            event.name = 'ClientMessage';
            event.format = code;
            event.wid = extra;
            event.message_type = raw.unpack('L')[0];
            var format = code === 32 ? 'LLLLL' : code === 16 ? 'SSSSSSSSSS' : 'CCCCCCCCCCCCCCCCCCCC';
            event.data = raw.unpack(format, 4);
        }
        else if (type === 34) {
            event.name = 'MappingNotify';
            event.request = headerBuf[4];
            event.firstKeyCode = headerBuf[5];
            event.count = headerBuf[6];
        }
        return event;
    };
    XClient.prototype.expectReplyHeader = function () {
        // TODO: move error parsers to corereqs.js
        var _this = this;
        this.packStream.get(8, function (headerBuf) {
            var res = headerBuf.unpack('CCSL');
            var type = res[0];
            var seqNum = res[2];
            var badValue = res[3];
            if (type === 0) {
                var errorCode_1 = res[1];
                var longstack_1;
                if (_this.options.debug) {
                    longstack_1 = _this.seq2stack[seqNum];
                    console.log(_this.seq2stack[seqNum].stack);
                }
                // unpack error packet (32 bytes for all error types, 8 of them in CCSL header)
                _this.packStream.get(24, function (buf) {
                    var res = buf.unpack('SC');
                    var message = xerrors_1.xErrors[errorCode_1];
                    var badParam = badValue;
                    var minorOpcode = res[0];
                    var majorOpcode = res[1];
                    var error = new XError(errorCode_1, seqNum, badParam, minorOpcode, majorOpcode, message);
                    error.longstack = longstack_1;
                    var extUnpacker = _this.errorParsers[errorCode_1];
                    if (extUnpacker) {
                        extUnpacker(error, errorCode_1, seqNum, badValue, buf);
                    }
                    var handler = _this.replies[seqNum];
                    if (handler) {
                        var callback = handler[1];
                        var handled = callback(error);
                        if (!handled) {
                            _this.emit('error', error);
                        }
                        // TODO: should we delete seq2stack and reply even if there is no handler?
                        if (_this.options.debug) {
                            delete _this.seq2stack[seqNum];
                        }
                        delete _this.replies[seqNum];
                    }
                    else {
                        _this.emit('error', error);
                    }
                    _this.expectReplyHeader();
                });
                return;
            }
            else if (type > 1) {
                _this.packStream.get(24, function (buf) {
                    var extra = res[3];
                    var code = res[1];
                    var ev = _this.unpackEvent(type, seqNum, extra, code, buf, headerBuf);
                    // raw event 32-bytes packet (primarily for use in SendEvent);
                    // TODO: Event::pack based on event parameters, inverse to unpackEvent
                    ev.rawData = buffer_1.Buffer.alloc(32);
                    headerBuf.copy(ev.rawData);
                    buf.copy(ev.rawData, 8);
                    _this.emit('event', ev);
                    if (ev.wid) {
                        var ee = _this.eventConsumers[ev.wid];
                        if (ee) {
                            ee.emit('event', ev);
                        }
                    }
                    if (ev.parent) {
                        var ee = _this.eventConsumers[ev.parent];
                        if (ee) {
                            ee.emit('child-event', ev);
                        }
                    }
                    _this.expectReplyHeader();
                });
                return;
            }
            var optData = res[1];
            var lengthTotal = res[3]; // in 4-bytes units, _including_ this header
            var bodylength = 24 + lengthTotal * 4; // 24 is rest if 32-bytes header
            _this.packStream.get(bodylength, function (data) {
                var handler = _this.replies[seqNum];
                if (handler && handler[0]) {
                    var unpack = handler[0];
                    if (_this.pendingAtoms[seqNum]) {
                        optData = seqNum;
                    }
                    var result = unpack.call(_this, data, optData);
                    var callback = handler[1];
                    callback(null, result);
                    // TODO: add multiple replies flag and delete handler only after last reply (eg ListFontsWithInfo)
                    delete _this.replies[seqNum];
                }
                // wait for new packet from server
                _this.expectReplyHeader();
            });
        });
    };
    XClient.prototype.startHandshake = function (authHost) {
        var _this = this;
        handshake_1.writeClientHello(this.packStream, this.displayNum, authHost, this.authFamily, this.options);
        handshake_1.readServerHello(this.packStream, function (err, display) {
            if (err) {
                _this.emit('error', err);
                return;
            }
            _this.expectReplyHeader();
            if (display) {
                _this.display = display;
                display.client = _this;
                _this.emit('connect', display);
            }
        });
    };
    XClient.prototype.require = function (extName, callback) {
        var _this = this;
        var ext = this._extensions[extName];
        if (ext) {
            return process.nextTick(function () { return callback(null, ext); });
        }
        // import('./ext/' + extName).then((extModule: XExtensionModule<E>) => {
        var extModule = extModules[extName];
        if (!extModule) {
            throw new Error('Ext module not found: ' + extName);
        }
        if (!this.display) {
            throw new Error('Display not initialized');
        }
        extModule.requireExt(this.display, function (err, _ext) {
            if (err) {
                return callback(err);
            }
            if (_ext) {
                _this._extensions[extName] = _ext;
                callback(null, _ext);
            }
        });
        // })
    };
    return XClient;
}(events_1.EventEmitter));
exports.XClient = XClient;
function createClient(options, initCb) {
    var _a, _b, _c, _d;
    if (typeof options === 'function') {
        initCb = options;
        options = {};
    }
    if (!options)
        options = {};
    var display = (_b = (_a = options.display) !== null && _a !== void 0 ? _a : process.env.DISPLAY) !== null && _b !== void 0 ? _b : ':0';
    var displayMatch = display.match(/^(?:[^:]*?\/)?(.*):(\d+)(?:.(\d+))?$/);
    if (!displayMatch) {
        throw new Error('Cannot parse display');
    }
    var host = displayMatch[1];
    var displayNum = (_c = displayMatch[2]) !== null && _c !== void 0 ? _c : '0';
    var screenNum = (_d = displayMatch[3]) !== null && _d !== void 0 ? _d : '0';
    // open stream
    var stream;
    var connected = false;
    var cbCalled = false;
    var socketPath;
    // try local socket on non-windows platforms
    if (['cygwin', 'win32', 'win64'].indexOf(process.platform) < 0) {
        // FIXME check if mac is ok?
        // @ts-ignore
        if (process.platform === 'darwin' || process.platform === 'mac') {
            // socket path on OSX is /tmp/launch-(some id)/org.x:0
            if (display[0] === '/') {
                socketPath = display;
            }
        }
        else if (!host) {
            socketPath = '/tmp/.X11-unix/X' + displayNum;
        }
    }
    var client = new XClient(displayNum, screenNum, options);
    var connectStream = function () {
        if (socketPath) {
            stream = net.createConnection(socketPath);
        }
        else {
            stream = net.createConnection(6000 + parseInt(displayNum, 10), host);
        }
        stream.on('connect', function () {
            connected = true;
            client.init(stream);
        });
        stream.on('error', function (err) {
            if (!connected && socketPath && err.code === 'ENOENT') {
                // Retry connection with TCP on localhost
                socketPath = null;
                host = 'localhost';
                try {
                    connectStream();
                }
                catch (err2) {
                    if (initCb && !cbCalled) {
                        cbCalled = true;
                        initCb(err2);
                    }
                    else {
                        client.emit('error', err2);
                    }
                }
            }
            else if (initCb && !cbCalled) {
                cbCalled = true;
                initCb(err);
            }
            else {
                client.emit('error', err);
            }
        });
    };
    connectStream();
    if (initCb) {
        client.on('connect', function (display) {
            // opt-in BigReq
            if (!options.disableBigRequests) {
                client.require('big-requests', function (err, BigReq) {
                    if (err) {
                        return initCb(err);
                    }
                    if (BigReq) {
                        BigReq.Enable(function (err, maxLen) {
                            if (err) {
                                initCb(err);
                                return;
                            }
                            display.max_request_length = maxLen;
                            cbCalled = true;
                            initCb(null, display);
                        });
                    }
                });
            }
            else {
                cbCalled = true;
                initCb(null, display);
            }
        });
    }
    return client;
}
exports.createClient = createClient;
//# sourceMappingURL=xcore.js.map