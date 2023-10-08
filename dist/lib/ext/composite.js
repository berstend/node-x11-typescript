"use strict";
// /usr/share/doc/x11proto-composite-dev/compositeproto.txt.gz
// http://cgit.freedesktop.org/xorg/proto/compositeproto/plain/compositeproto.txt
//
// /usr/include/X11/extensions/Xcomposite.h       Xlib
// /usr/include/X11/extensions/composite.h        constants
// /usr/include/X11/extensions/compositeproto.h   structs
//
// http://ktown.kde.org/~fredrik/composite_howto.html
//
// server side source:
//     http://cgit.freedesktop.org/xorg/xserver/tree/composite/compext.c
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('Composite', function (err, ext) {
        if (err) {
            return callback(err);
        }
        if (!ext.present) {
            return callback(new Error('extension not available'));
        }
        ext.Redirect = {
            Automatic: 0,
            Manual: 1
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
        ext.RedirectWindow = function (window, updateType) {
            X.seqNum++;
            X.packStream.pack('CCSLCxxx', [ext.majorOpcode, 1, 3, window, updateType]);
            X.packStream.flush();
        };
        ext.RedirectSubwindows = function (window, updateType) {
            X.seqNum++;
            X.packStream.pack('CCSLCxxx', [ext.majorOpcode, 2, 3, window, updateType]);
            X.packStream.flush();
        };
        ext.UnredirectWindow = function (window) {
            X.seqNum++;
            X.packStream.pack('CCSL', [ext.majorOpcode, 3, 2, window]);
            X.packStream.flush();
        };
        ext.UnredirectSubwindows = function (window) {
            X.seqNum++;
            X.packStream.pack('CCSL', [ext.majorOpcode, 4, 2, window]);
            X.packStream.flush();
        };
        ext.CreateRegionFromBorderClip = function (region, window) {
            X.seqNum++;
            // FIXME bug from original js library
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 5, 3, damage, region]);
            X.packStream.flush();
        };
        ext.NameWindowPixmap = function (window, pixmap) {
            X.seqNum++;
            X.packStream.pack('CCSLL', [ext.majorOpcode, 6, 3, window, pixmap]);
            X.packStream.flush();
        };
        ext.GetOverlayWindow = function (window, callback) {
            X.seqNum++;
            X.packStream.pack('CCSL', [ext.majorOpcode, 7, 2, window]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('L')[0]; },
                callback
            ];
            X.packStream.flush();
        };
        ext.ReleaseOverlayWindow = function (window) {
            X.seqNum++;
            X.packStream.pack('CCSL', [ext.majorOpcode, 8, 2, window]);
            X.packStream.flush();
        };
        // currently version 0.4 TODO: bump up with coordinate translations
        ext.QueryVersion(0, 4, function (err, vers) {
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
//# sourceMappingURL=composite.js.map