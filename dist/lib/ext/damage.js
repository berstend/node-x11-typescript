"use strict";
// http://www.x.org/releases/X11R7.6/doc/damageproto/damageproto.txt
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('DAMAGE', function (err, ext) {
        if (err) {
            return callback(err);
        }
        if (!ext.present) {
            return callback(new Error('extension not available'));
        }
        ext.ReportLevel = {
            RawRectangles: 0,
            DeltaRectangles: 1,
            BoundingBox: 2,
            NonEmpty: 3
        };
        ext.QueryVersion = function (clientMaj, clientMin, callback) {
            X.seqNum++;
            X.packStream.pack('CCSLL', [ext.majorOpcode, 0, 3, clientMaj, clientMin]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('LL'); },
                callback
            ];
            X.packStream.flush();
        };
        ext.Create = function (damage, drawable, reportlevel) {
            X.seqNum++;
            X.packStream.pack('CCSLLCxxx', [ext.majorOpcode, 1, 4, damage, drawable, reportlevel]);
            X.packStream.flush();
        };
        ext.Destroy = function (damage) {
            X.seqNum++;
            X.packStream.pack('CCSLL', [ext.majorOpcode, 2, 3, damage]);
            X.packStream.flush();
        };
        ext.Subtract = function (damage, repair, parts) {
            X.seqNum++;
            X.packStream.pack('CCSLLL', [ext.majorOpcode, 3, 4, damage, repair, parts]);
            X.packStream.flush();
        };
        ext.Add = function (damage, region) {
            X.seqNum++;
            X.packStream.pack('CCSLL', [ext.majorOpcode, 4, 3, damage, region]);
            X.packStream.flush();
        };
        ext.QueryVersion(1, 1, function (err, vers) {
            if (err) {
                return callback(err);
            }
            // @ts-ignore
            ext.major = vers[0];
            // @ts-ignore
            ext.minor = vers[1];
            callback(null, ext);
        });
        ext.events = {
            DamageNotify: 0
        };
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
//# sourceMappingURL=damage.js.map