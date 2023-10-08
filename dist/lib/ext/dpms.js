"use strict";
// http://www.x.org/releases/X11R7.6/doc/xextproto/dpms.txt
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: move to templates
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('DPMS', function (err, ext) {
        if (err) {
            return callback(err);
        }
        if (!ext.present) {
            return callback(new Error('extension not available'));
        }
        ext.GetVersion = function (clientMaj, clientMin, callback) {
            X.seqNum++;
            X.packStream.pack('CCSSS', [ext.majorOpcode, 0, 2, clientMaj, clientMin]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('SS'); },
                callback
            ];
            X.packStream.flush();
        };
        ext.Capable = function (callback) {
            X.seqNum++;
            X.packStream.pack('CCS', [ext.majorOpcode, 1, 1]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('C'); },
                callback
            ];
            X.packStream.flush();
        };
        ext.GetTimeouts = function (callback) {
            X.seqNum++;
            X.packStream.pack('CCS', [ext.majorOpcode, 2, 1]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('SSS'); },
                callback
            ];
            X.packStream.flush();
        };
        ext.SetTimeouts = function (standby, suspend, off) {
            X.seqNum++;
            X.packStream.pack('CCSSSSxx', [ext.majorOpcode, 3, 3, standby, suspend, off]);
            X.packStream.flush();
        };
        ext.Enable = function () {
            X.seqNum++;
            X.packStream.pack('CCS', [ext.majorOpcode, 4, 1]);
            X.packStream.flush();
        };
        ext.Disable = function () {
            X.seqNum++;
            X.packStream.pack('CCS', [ext.majorOpcode, 5, 1]);
            X.packStream.flush();
        };
        ext.ForceLevel = function (level) {
            X.seqNum++;
            X.packStream.pack('CCSSxx', [ext.majorOpcode, 6, 2, level]);
            X.packStream.flush();
        };
        ext.Info = function (callback) {
            X.seqNum++;
            X.packStream.pack('CCS', [ext.majorOpcode, 7, 1]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('SC'); },
                callback
            ];
            X.packStream.flush();
        };
        callback(null, ext);
    });
};
//# sourceMappingURL=dpms.js.map