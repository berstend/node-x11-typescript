"use strict";
// TODO: differentiate between auth types (i.e., MIT-MAGIC-COOKIE-1 and XDM-AUTHORIZATION-1)
// and choose the best based on the algorithm in libXau's XauGetBestAuthByAddr
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var os_1 = require("os");
var path = require("path");
require("./unpackbuffer");
var connectionTypeToName = {
    256: 'Local',
    65535: 'Wild',
    254: 'Netname',
    253: 'Krb5Principal',
    252: 'LocalHost',
    0: 'Internet',
    1: 'DECnet',
    2: 'Chaos',
    5: 'ServerInterpreted',
    6: 'Internet6'
};
var homedir = os_1.homedir();
function parseXauth(buf) {
    var offset = 0;
    var auth = [];
    var cookieProperties = ['address', 'display', 'authName', 'authData'];
    var _loop_1 = function () {
        var type = buf.readUInt16BE(offset);
        if (!connectionTypeToName.hasOwnProperty(type)) {
            throw new Error('Unknown address type');
        }
        var cookie = {
            type: type
        };
        offset += 2;
        cookieProperties.forEach(function (property) {
            var length = buf.unpack('n', offset)[0];
            offset += 2;
            if (cookie.type === 0 && property === 'address') { // Internet
                // 4 bytes of ip addess, convert to w.x.y.z string
                cookie.address = [
                    buf[offset],
                    buf[offset + 1],
                    buf[offset + 2],
                    buf[offset + 3]
                ].map(function (octet) { return octet.toString(10); }).join('.');
            }
            else {
                cookie[property] = buf.unpackString(length, offset);
            }
            offset += length;
        });
        auth.push(cookie);
    };
    while (offset < buf.length) {
        _loop_1();
    }
    return auth;
}
// TODO give options type of connection options
function readXauthority(cb, options) {
    var nixFilename = options && options.xAuthority ? options.xAuthority : process.env.XAUTHORITY || path.join(homedir, '.Xauthority');
    fs.readFile(nixFilename, function (err, data) {
        var _a, _b;
        if (!err) {
            return cb(null, data);
        }
        if (err.code === 'ENOENT') {
            // TODO we could solve this with recursion instead of c/p the readFile logic here from before
            // Xming/windows uses %HOME%/Xauthority ( .Xauthority with no dot ) - try with this name
            var winFilename = (_b = (_a = options === null || options === void 0 ? void 0 : options.xAuthority) !== null && _a !== void 0 ? _a : process.env.XAUTHORITY) !== null && _b !== void 0 ? _b : path.join(homedir, 'Xauthority');
            fs.readFile(winFilename, function (err, data) {
                if (!err) {
                    return cb(null, data);
                }
                if (err.code === 'ENOENT') {
                    cb(null, undefined);
                }
                else {
                    cb(err);
                }
            });
        }
        else {
            cb(err);
        }
    });
}
// TODO give options type of connection options
function default_1(display, host, socketFamily, cb, options) {
    var family;
    if (socketFamily === 'IPv4') {
        family = 0; // Internet
    }
    else if (socketFamily === 'IPv6') {
        family = 6; // Internet6
    }
    else {
        family = 256; // Local
    }
    readXauthority(function (err, data) {
        if (err)
            return cb(err);
        if (!data) {
            return cb(null, {
                authName: '',
                authData: ''
            });
        }
        var auth = parseXauth(data);
        for (var cookieNum in auth) {
            var cookie = auth[cookieNum];
            if ((connectionTypeToName[cookie.type] === 'Wild' || (cookie.type === family && cookie.address === host)) &&
                (cookie.display.length === 0 || cookie.display === display)) {
                return cb(null, cookie);
            }
        }
        // If no cookie is found, proceed without authentication
        cb(null, {
            authName: '',
            authData: ''
        });
    }, options);
}
exports.default = default_1;
//# sourceMappingURL=auth.js.map