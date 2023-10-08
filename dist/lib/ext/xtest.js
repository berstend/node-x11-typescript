"use strict";
// http://www.x.org/releases/X11R7.6/doc/xextproto/xtest.pdf
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: move to templates
exports.requireExt = function (display, callback) {
    var _a;
    var X = display.client;
    (_a = X.QueryExtension) === null || _a === void 0 ? void 0 : _a.call(X, 'XTEST', function (err, ext) {
        if (err) {
            return callback(err);
        }
        if (ext) {
            if (!ext.present) {
                return callback(new Error('extension not available'));
            }
            ext.GetVersion = function (clientMaj, clientMin, callback) {
                X.seqNum++;
                X.packStream.pack('CCSCxS', [ext.majorOpcode, 0, 2, clientMaj, clientMin]);
                X.replies[X.seqNum] = [
                    function (buf, opt) {
                        var res = buf.unpack('S');
                        // Major version is in byte 1 of Reply Header
                        // Minor version is in the body of the reply
                        return [opt, res[0]];
                    },
                    callback
                ];
                X.packStream.flush();
            };
            ext.KeyPress = 2;
            ext.KeyRelease = 3;
            ext.ButtonPress = 4;
            ext.ButtonRelease = 5;
            ext.MotionNotify = 6;
            ext.FakeInput = function (type, keycode, time, wid, x, y) {
                X.seqNum++;
                X.packStream.pack('CCSCCxxLLxxxxxxxxssxxxxxxxx', [ext.majorOpcode, 2, 9, type, keycode, time, wid, x, y]);
                X.packStream.flush();
            };
            callback(null, ext);
        }
    });
};
//# sourceMappingURL=xtest.js.map