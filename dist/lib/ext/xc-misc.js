"use strict";
// http://www.x.org/releases/X11R7.6/doc/xcmiscproto/xc-misc.pdf
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('XC-MISC', function (err, ext) {
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
            X.packStream.pack('CCSSS', [ext.majorOpcode, 0, 2, clientMaj, clientMin]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('SS'); },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetXIDRange = function (cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCS', [ext.majorOpcode, 1, 1]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var res = buf.unpack('LL');
                    return {
                        startId: res[0],
                        count: res[1]
                    };
                },
                cb
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetXIDList = function (count, cb) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 2, 2, count]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var numIds = buf.unpack('L')[0];
                    var res = [];
                    for (var i = 0; i < numIds; ++i) {
                        res.push(buf.unpack('L', 24 + i * 4));
                    }
                    return res;
                },
                cb
            ];
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
    });
};
//# sourceMappingURL=xc-misc.js.map