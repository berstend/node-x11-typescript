"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var glxrender_1 = require("./glxrender");
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('GLX', function (err, ext) {
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
            X.packStream.pack('CCSLL', [ext.majorOpcode, 7, 3, clientMaj, clientMin]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('LL'); },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.QueryServerString = function (screen, name, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 19, 3, screen, name]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var len = buf.unpack('xxxxL')[0];
                    return buf.toString().substring(24, 24 + len * 4);
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.CreateGLXPixmap = function (screen, visual, pixmap, glxpixmap) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLLL', [ext.majorOpcode, 13, 5, screen, visual, pixmap, glxpixmap]);
            // console.log('CreateGlxPix', X.seqNum)
            // console.log(ext.majorOpcode, 13, 5, screen, visual, pixmap, glxpixmap)
            // console.trace()
            X.packStream.flush();
        };
        // @ts-ignore
        ext.QueryExtensionsString = function (screen, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 18, 2, screen]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var len = buf.unpack('xxxxL')[0];
                    return buf.toString().substring(24, 24 + len * 4);
                },
                callback
            ];
            X.packStream.flush();
        };
        // see __glXInitializeVisualConfigFromTags in mesa/src/glx/glxext.c
        //
        // @ts-ignore
        ext.GetVisualConfigs = function (screen, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 14, 2, screen]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var res = buf.unpack('LL');
                    var numConfigs = res[0];
                    var numProps = res[1];
                    var configs = new Array(numConfigs);
                    for (var i = 0; i < numConfigs; ++i) {
                        var props = {}; // new Array(numProps);
                        var names = 'visualID visualType rgbMode redBits greenBits blueBits alphaBits accumRedBits accumGreen accumBlueBits accumAlphaBits doubleBufferMode stereoMode rgbBits depthBits stencilBits numAuxBuffers level'.split(' ');
                        for (var j = 0; j < 18 && j < numProps; ++j) {
                            // @ts-ignore
                            props[names[j]] = buf.unpack('L', 24 + (i * numProps + j) * 4)[0];
                        }
                        // read tag + property
                        configs[i] = props;
                    }
                    return configs;
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GetFBConfigs = function (screen, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 21, 2, screen]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var res = buf.unpack('LL');
                    var numConfigs = res[0];
                    var numProps = res[1];
                    var configs = new Array(numConfigs);
                    for (var i = 0; i < numConfigs; ++i) {
                        var props = new Array(numProps);
                        for (var j = 0; j < numProps; ++j) {
                            props[j] = buf.unpack('LL', 24 + (i * numProps + j) * 8);
                        }
                        configs[i] = props;
                    }
                    return configs;
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.CreateContext = function (ctx, visual, screen, shareListCtx, isDirect) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLLLCxxx', [ext.majorOpcode, 3, 6, ctx, visual, screen, shareListCtx, isDirect]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.SwapBuffers = function (ctx, drawable) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 11, 3, ctx, drawable]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.NewList = function (ctx, list, mode) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLL', [ext.majorOpcode, 101, 4, ctx, list, mode]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.EndList = function (ctx) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 102, 2, ctx]);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GenLists = function (ctx, count, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 104, 3, ctx, count]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('L')[0]; },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.GenTextures = function (ctx, count, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 145, 3, ctx, count]);
            X.replies[X.seqNum] = [
                function (buf) {
                    var format = new Buffer(count);
                    format.fill('L');
                    return buf.unpack('xxxxxxxxxxxxxxxxxxxxxxxx' + format.toString());
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.IsTexture = function (ctx, texture, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 146, 3, ctx, texture]);
            X.replies[X.seqNum] = [
                // FIXME this is probably wrong?
                function (buf) { return buf.unpack('CCCCCCCCCCCCCCCCCCCCCCCCCC'); },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.MakeCurrent = function (drawable, ctx, oldctx, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLLL', [ext.majorOpcode, 5, 4, drawable, ctx, oldctx]);
            X.replies[X.seqNum] = [
                function (buf) { return buf.unpack('L')[0]; },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.Finish = function (ctx, callback) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 108, 2, ctx]);
            X.replies[X.seqNum] = [
                function () {
                    return;
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.Render = function (ctx, data) {
            X.seqNum++;
            var length = 0;
            if (Buffer.isBuffer(data)) {
                length = 2 + data.length / 4;
            }
            else if (Array.isArray(data)) {
                length = 2;
                for (var i = 0; i < data.length; ++i) {
                    length += data[i].length / 4;
                }
            }
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 1, length, ctx]);
            if (Buffer.isBuffer(data)) {
                X.packStream.writeQueue.push(data);
            }
            else if (Array.isArray(data)) {
                for (var i = 0; i < data.length; ++i) {
                    X.packStream.writeQueue.push(data[i]);
                }
            }
            else {
                throw new Error("invalid data, expected buffer or buffers array, got:" + data);
            }
            X.packStream.flush();
        };
        // @ts-ignore
        ext.VendorPrivate = function (ctx, code, data) {
            X.seqNum++;
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 16, 3 + data.length / 4, code, ctx]);
            X.packStream.writeQueue.push(data);
            X.packStream.flush();
        };
        // 1330 - X_GLXvop_BindTexImageEXT
        // 1331 - X_GLXvop_ReleaseTexImageEXT
        // @ts-ignore
        ext.BindTexImage = function (ctx, drawable, buffer, attribs) {
            if (!attribs) {
                attribs = [];
            }
            var data = Buffer.alloc(12 + attribs.length * 4);
            data.writeUInt32LE(drawable, 0);
            data.writeUInt32LE(buffer, 4);
            data.writeUInt32LE(attribs.length, 8);
            for (var i = 0; i < attribs.length; ++i) {
                data.writeUInt32LE(attribs[i], 12 + i * 4);
            }
            // @ts-ignore
            ext.VendorPrivate(ctx, 1330, data);
        };
        // @ts-ignore
        ext.ReleaseTexImage = function (ctx, drawable, buffer) {
            var data = Buffer.alloc(8);
            data.writeUInt32LE(drawable, 0);
            data.writeUInt32LE(buffer, 4);
            // @ts-ignore
            ext.VendorPrivate(ctx, 1331, data);
        };
        // VendorPrivateWithReply - opcode 17
        // @ts-ignore
        ext.RenderLarge = function (ctx, requestNum, requestTotal, data) {
            X.seqNum++;
            // var data = Buffer.concat(data);
            var padLength = 4 - data.length % 4;
            if (padLength === 4) {
                padLength = 0;
            }
            var length = 4 + (data.length + padLength) / 4;
            // @ts-ignore
            X.packStream.pack('CCSLSSL', [ext.majorOpcode, 2, length, ctx, requestNum, requestTotal, data.length]);
            X.packStream.writeQueue.push(data);
            var pad = Buffer.alloc(padLength);
            pad.fill(0);
            X.packStream.writeQueue.push(pad);
            X.packStream.flush();
        };
        // @ts-ignore
        ext.renderPipeline = function (ctx) { return glxrender_1.glxrender(ext, ctx); };
        var errors = [
            'context',
            'contect state',
            'drawable',
            'pixmap',
            'context tag',
            'current window',
            'Render request',
            'RenderLarge request',
            '(unsupported) VendorPrivate request',
            'FB config',
            'pbuffer',
            'current drawable',
            'window'
        ];
        errors.forEach(function (message, code) {
            // @ts-ignore
            X.errorParsers[ext.firstError + code] = function (err) {
                err.message = 'GLX: Bad ' + message;
                return err;
            };
        });
        callback(null, ext);
    });
};
//# sourceMappingURL=glx.js.map