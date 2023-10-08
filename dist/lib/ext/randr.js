"use strict";
// http://www.x.org/releases/X11R7.6/doc/randrproto/randrproto.txt
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('RANDR', function (err, ext) {
        if (err) {
            return callback(err);
        }
        // @ts-ignore
        if (!ext.present) {
            return callback(new Error('extension not available'));
        }
        // @ts-ignore
        ext.QueryVersion = function (clientMaj, clientMin, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 0, 3, clientMaj, clientMin]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('LL'); },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.events = {
            RRScreenChangeNotify: 0
        };
        // @ts-ignore
        ext.NotifyMask = {
            ScreenChange: 1,
            CrtcChange: 2,
            OutputChange: 4,
            OutputProperty: 8,
            All: 15
        };
        // @ts-ignore
        ext.Rotation = {
            Rotate_0: 1,
            Rotate_90: 2,
            Rotate_180: 4,
            Rotate_270: 8,
            Reflect_X: 16,
            Reflect_Y: 32
        };
        // @ts-ignore
        ext.ConfigStatus = {
            Sucess: 0,
            InvalidConfigTime: 1,
            InvalidTime: 2,
            Failed: 3
        };
        // @ts-ignore
        ext.ModeFlag = {
            HSyncPositive: 1,
            HSyncNegative: 2,
            VSyncPositive: 4,
            VSyncNegative: 8,
            Interlace: 16,
            DoubleScan: 32,
            CSync: 64,
            CSyncPositive: 128,
            CSyncNegative: 256,
            HSkewPresent: 512,
            BCast: 1024,
            PixelMultiplex: 2048,
            DoubleClock: 4096,
            ClockDivideBy2: 8192
        };
        // @ts-ignore
        ext.SetScreenConfig = function (win, ts, configTs, sizeId, rotation, rate, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLLSSSS', [ext.majorOpcode, 2, 6, win, ts, configTs, sizeId, rotation, rate, 0]);
            X.replies[X.seqNum] = [
                function (buf, opt) {
                    var res = buf.unpack('LLLSSLL');
                    return {
                        status: opt,
                        newTs: res[0],
                        configTs: res[1],
                        root: res[2],
                        subpixelOrder: res[3]
                    };
                },
                function (err, res) {
                    if (err) {
                        cb(err);
                    }
                    else {
                        var error = null;
                        if (res.status !== 0) {
                            error = new Error('SetScreenConfig error: ' + res.status);
                        }
                        cb(error, res);
                    }
                }
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.SelectInput = function (win, mask) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLSS', [ext.majorOpcode, 4, 3, win, mask, 0]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetScreenInfo = function (win, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 5, 2, win]);
            X.replies[X.seqNum] = [
                function (buf, opt) {
                    var res = buf.unpack('LLLSSSSSS');
                    var info = {
                        rotations: opt,
                        root: res[0],
                        timestamp: res[1],
                        configTimestamp: res[2],
                        sizeID: res[4],
                        rotation: res[5],
                        rate: res[6],
                        rates: [],
                        screens: []
                    };
                    var nSizes = res[3];
                    var nRates = res[7];
                    var screensLen = nSizes << 2;
                    var format = Array(screensLen + 1).join('S');
                    res = buf.unpack(format, 24);
                    for (var i = 0; i < screensLen; i += 4) {
                        info.screens.push({
                            pxWidth: res[i],
                            pxHeight: res[i + 1],
                            mmWidth: res[i + 2],
                            mmHeight: res[i + 3]
                        });
                    }
                    format = Array(nRates + 1).join('S');
                    info.rates = buf.unpack(format, 24 + screensLen * 2);
                    return info;
                },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetScreenResources = function (win, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 8, 2, win]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var pos = 0;
                    var res = buf.unpack('LLSSSSxxxxxxxx');
                    var resources = {
                        timestamp: res[0],
                        configTimestamp: res[1],
                        modeinfos: [],
                        crtcs: [],
                        outputs: []
                    };
                    pos += 24;
                    var format = Array(res[2] + 1).join('L');
                    resources.crtcs = buf.unpack(format, pos);
                    pos += res[2] << 2;
                    format = Array(res[3] + 1).join('L');
                    resources.outputs = buf.unpack(format, pos);
                    pos += res[3] << 2;
                    format = Array(res[4] + 1).join('LSSLSSSSSSSSL');
                    var resModes = buf.unpack(format, pos);
                    pos += res[4] << 5;
                    for (var i = 0; i < res[4]; i += 13) {
                        resources.modeinfos.push({
                            id: resModes[i + 0],
                            width: resModes[i + 1],
                            height: resModes[i + 2],
                            dotClock: resModes[i + 3],
                            hSyncStart: resModes[i + 4],
                            hSyncEnd: resModes[i + 5],
                            hTotal: resModes[i + 6],
                            hSkew: resModes[i + 7],
                            vSyncStart: resModes[i + 8],
                            vSyncEnd: resModes[i + 9],
                            vTotal: resModes[i + 10],
                            modeflags: resModes[i + 12],
                            name: buf.slice(pos, pos + resModes[i + 11]).toString()
                        });
                        pos += resModes[i + 11];
                    }
                    return resources;
                },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetOutputInfo = function (output, ts, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 9, 3, output, ts]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var pos = 0;
                    var res = buf.unpack('LLLLCCSSSSS');
                    pos += 28;
                    var format = Array(res[6] + 1).join('L');
                    var crtcs = buf.unpack(format, pos);
                    pos += res[6] << 2;
                    format = Array(res[7] + 1).join('L');
                    var modes = buf.unpack(format, pos);
                    pos += res[7] << 2;
                    format = Array(res[9] + 1).join('L');
                    var clones = buf.unpack(format, pos);
                    pos += res[9] << 2;
                    var name = buf.slice(pos, pos + res[10]).toString('binary');
                    var info = {
                        timestamp: res[0],
                        crtc: res[1],
                        mmWidth: res[2],
                        mmHeight: res[3],
                        connection: res[4],
                        subpixelOrder: res[5],
                        preferredModes: res[8],
                        crtcs: crtcs,
                        modes: modes,
                        clones: clones,
                        name: name
                    };
                    return info;
                },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetCrtcInfo = function (crtc, configTs, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 20, 3, crtc, configTs]);
            X.replies[X.seqNum] = [
                function (buf, opt) {
                    var pos = 0;
                    var res = buf.unpack('LssSSLSSSS');
                    pos += 24;
                    var format = Array(res[8] + 1).join('L');
                    var output = buf.unpack(format, pos);
                    format = Array(res[9] + 1).join('L');
                    var possible = buf.unpack(format, pos);
                    var info = {
                        status: opt,
                        timestamp: res[0],
                        x: res[1],
                        y: res[2],
                        width: res[3],
                        height: res[4],
                        mode: res[5],
                        rotation: res[6],
                        rotations: res[7],
                        output: output,
                        possible: possible
                    };
                    return info;
                },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        X.extraEventParsers[ext.firstEvent + ext.events.RRScreenChangeNotify] = function (type, seq, extra, code, raw) {
            var values = raw.unpack('LLLSSSSSS');
            return {
                rawData: raw,
                type: type,
                seq: seq,
                rotation: code,
                time: extra,
                configTime: values[0],
                root: values[1],
                requestWindow: values[2],
                sizeId: values[3],
                subpixelOrder: values[4],
                width: values[5],
                height: values[6],
                physWidth: values[7],
                physHeight: values[8],
                name: 'RRScreenChangeNotify'
            };
        };
        // @ts-ignore
        ext.QueryVersion(255, 255, function (err, version) {
            if (err)
                return callback(err);
            // @ts-ignore
            ext.majorVersion = version[0];
            // @ts-ignore
            ext.minorVersion = version[1];
            callback(null, ext);
        });
    });
};
//# sourceMappingURL=randr.js.map