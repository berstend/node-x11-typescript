"use strict";
// http://www.x.org/releases/X11R7.6/doc/bigreqsproto/bigreq.html
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: move to templates
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('BIG-REQUESTS', function (err, ext) {
        if (err) {
            return callback(err);
        }
        if (!ext.present) {
            return callback(new Error('extension not available'));
        }
        ext.Enable = function (cb) {
            X.seqNum++;
            X.packStream.pack('CCS', [ext.majorOpcode, 0, 1]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('L')[0]; },
                cb
            ];
            X.packStream.flush();
        };
        callback(null, ext);
    });
};
//# sourceMappingURL=big-requests.js.map