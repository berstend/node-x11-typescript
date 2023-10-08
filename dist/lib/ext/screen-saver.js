"use strict";
// http://www.x.org/releases/X11R7.6/doc/scrnsaverproto/saver.pdf
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('MIT-SCREEN-SAVER', function (err, ext) {
        if (err) {
            return callback(err);
        }
        // @ts-ignore
        if (!ext.present) {
            return callback(new Error('extension not available'));
        }
        // @ts-ignore
        ext.QueryVersion = function (clientMaj, clientMin, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSCCxx', [ext.majorOpcode, 0, 2, clientMaj, clientMin]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('CC'); },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.State = {
            Off: 0,
            On: 1,
            Disabled: 2
        };
        // @ts-ignore
        ext.Kind = {
            Blanked: 0,
            Internal: 1,
            External: 2
        };
        // @ts-ignore
        ext.QueryInfo = function (drawable, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 1, 2, drawable]);
            X.replies[X.seqNum] = [
                function (buf, opt) {
                    var res = buf.unpack('LLLLC');
                    return {
                        state: opt,
                        window: res[0],
                        until: res[1],
                        idle: res[2],
                        eventMask: res[3],
                        kind: res[4]
                    };
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.eventMask = {
            Notify: 1,
            Cycle: 2
        };
        // @ts-ignore
        ext.SelectInput = function (drawable, eventMask) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 2, 3, drawable, eventMask]);
            X.packStream.flush();
        };
        // @ts-ignore
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
        // @ts-ignore
        ext.events = {
            ScreenSaverNotify: 0
        };
        // @ts-ignore
        ext.NotifyState = {
            Off: 0,
            On: 1,
            Cycle: 2
        };
        // @ts-ignore
        X.extraEventParsers[ext.firstEvent + ext.events.ScreenSaverNotify] = function (type, seq, extra, code, raw) {
            var values = raw.unpack('LLCC');
            return {
                type: type,
                state: code,
                rawData: raw,
                seq: seq,
                time: extra,
                // CCSL = type, code, seq, extra
                root: values[0],
                saverWindow: values[1],
                kind: values[2],
                forced: values[1],
                name: 'ScreenSaverNotify'
            };
        };
    });
};
//# sourceMappingURL=screen-saver.js.map