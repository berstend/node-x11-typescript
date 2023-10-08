"use strict";
// http://www.x.org/releases/X11R7.6/doc/fixesproto/fixesproto.txt
Object.defineProperty(exports, "__esModule", { value: true });
function parse_rectangle(buf, pos) {
    if (!pos) {
        pos = 0;
    }
    return {
        x: buf[pos],
        y: buf[pos + 1],
        width: buf[pos + 2],
        height: buf[pos + 3]
    };
}
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('XFIXES', function (err, ext) {
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
        ext.SaveSetMode = { Insert: 0, Delete: 1 };
        // @ts-ignore
        ext.SaveSetTarget = { Nearest: 0, Root: 1 };
        // @ts-ignore
        ext.SaveSetMap = { Map: 0, Unmap: 1 };
        // @ts-ignore
        ext.ChangeSaveSet = function (window, mode, target, map) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSCCxL', [ext.majorOpcode, 1, 3, mode, target, map]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.WindowRegionKind = {
            Bounding: 0,
            Clip: 1
        };
        // @ts-ignore
        ext.CreateRegion = function (region, rects) {
            X.seqNum++;
            var format = 'CCSL';
            format += Array(rects.length + 1).join('ssSS');
            // @ts-ignore
            var args = [ext.majorOpcode, 5, 2 + (rects.length << 1), region];
            rects.forEach(function (rect) {
                args.push(rect.x);
                args.push(rect.y);
                args.push(rect.width);
                args.push(rect.height);
            });
            X.packStream.pack(format, args);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.CreateRegionFromWindow = function (region, wid, kind) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLCxxx', [ext.majorOpcode, 7, 4, region, wid, kind]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.DestroyRegion = function (region) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 10, 2, region]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.UnionRegion = function (src1, src2, dst) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLL', [ext.majorOpcode, 13, 4, src1, src2, dst]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.TranslateRegion = function (region, dx, dy) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLss', [ext.majorOpcode, 17, 3, region, dx, dy]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.FetchRegion = function (region, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 19, 2, region]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var nRectangles = (buf.length - 24) >> 3;
                    var format = 'ssSSxxxxxxxxxxxxxxxx';
                    format += Array(nRectangles + 1).join('ssSS');
                    var res = buf.unpack(format);
                    var reg = {
                        extends: parse_rectangle(res),
                        rectangles: []
                    };
                    for (var i = 0; i < nRectangles; ++i) {
                        reg.rectangles.push(parse_rectangle(res, 4 + (i << 2)));
                    }
                    return reg;
                },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.QueryVersion(5, 0, function (err, vers) {
            if (err) {
                return callback(err);
            }
            // @ts-ignore
            ext.major = vers[0];
            // @ts-ignore
            ext.minor = vers[1];
            callback(null, ext);
        });
        // @ts-ignore
        ext.events = {
            DamageNotify: 0
        };
        // @ts-ignore
        X.extraEventParsers[ext.firstEvent + ext.events.DamageNotify] = function (type, seq, extra, code, raw) {
            var values = raw.unpack('LLssSSssSS');
            return {
                type: type,
                level: code,
                seq: seq,
                drawable: extra,
                damage: values[0],
                time: values[1],
                area: {
                    x: values[2],
                    y: values[3],
                    w: values[4],
                    h: values[5]
                },
                geometry: {
                    x: values[6],
                    y: values[7],
                    w: values[8],
                    h: values[9]
                },
                name: 'DamageNotify'
            };
        };
    });
};
//# sourceMappingURL=fixes.js.map