"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var auth_1 = require("./auth");
var xutil_1 = require("./xutil");
function readVisuals(bl, visuals, nVisuals, cb) {
    if (nVisuals === 0) {
        cb();
        return;
    }
    var visual = {};
    // @ts-ignore
    bl.unpackTo(visual, [
        'L vid',
        'C class',
        'C bits_per_rgb',
        'S map_ent',
        'L red_mask',
        'L green_mask',
        'L blue_mask',
        'xxxx'
    ], function () {
        var vid = visual.vid;
        // delete visual.vid;
        visuals[vid] = visual;
        if (Object.keys(visuals).length === nVisuals) {
            cb();
        }
        else {
            readVisuals(bl, visuals, nVisuals, cb);
        }
    });
}
function readScreens(bl, display, cbDisplayReady) {
    var numParsedDepths = 0;
    var readDepths = function (bl, display, depths, nDepths, cb) {
        if (nDepths === 0) {
            cb();
            return;
        }
        bl.unpack('CxSxxxx', function (res) {
            var dep = res[0];
            var nVisuals = res[1];
            var visuals = {};
            readVisuals(bl, visuals, nVisuals, function () {
                if (dep in depths) {
                    for (var visual in visuals) {
                        // FIXME this line doesn't make sense
                        depths[dep][visual] = visuals[visual];
                    }
                }
                else {
                    depths[dep] = visuals;
                }
                numParsedDepths++;
                if (numParsedDepths === nDepths) {
                    cb();
                }
                else {
                    readDepths(bl, display, depths, nDepths, cb);
                }
            });
        });
    };
    // for (i=0; i < display.screen_num; ++i)
    {
        var scr_1 = {};
        // FIXME root_depth twice?
        bl.unpackTo(scr_1, [
            'L root',
            'L default_colormap',
            'L white_pixel',
            'L black_pixel',
            'L input_masks',
            'S pixel_width',
            'S pixel_height',
            'S mm_width',
            'S mm_height',
            'S min_installed_maps',
            'S max_installed_maps',
            'L root_visual',
            'C root_depth',
            'C backing_stores',
            'C root_depth',
            'C num_depths'
        ], function () {
            var depths = {};
            readDepths(bl, display, depths, scr_1.num_depths, function () {
                scr_1.depths = depths;
                delete scr_1.num_depths;
                display.screen.push(scr_1);
                if (display.screen.length === display.screen_num) {
                    delete display.screen_num;
                    cbDisplayReady(null, display);
                    return;
                }
                else {
                    readScreens(bl, display, cbDisplayReady);
                }
            });
        });
    }
}
function readServerHello(bl, cb) {
    bl.unpack('C', function (res) {
        if (res[0] === 0) {
            // conection time error
            // unpack error
            bl.unpack('Cxxxxxx', function (rlen) {
                bl.get(rlen[0], function (reason) {
                    var err = new Error('X server connection failed: ' + reason.toString());
                    cb(err);
                });
            });
            // TODO: do we need to close stream from our side?
            // TODO: api to close source stream via attached unpackstream
            return;
        }
        var display = {};
        bl.unpackTo(display, [
            'x',
            'S major',
            'S minor',
            'S xlen',
            'L release',
            'L resource_base',
            'L resource_mask',
            'L motion_buffer_size',
            'S vlen',
            'S max_request_length',
            'C screen_num',
            'C format_num',
            'C image_byte_order',
            'C bitmap_bit_order',
            'C bitmap_scanline_unit',
            'C bitmap_scanline_pad',
            'C min_keycode',
            'C max_keycode',
            'xxxx'
        ], function () {
            var pvlen = xutil_1.paddedLength(display.vlen);
            // setup data to generate resource id
            // TODO: cleaunup code here
            var mask = display.resource_mask;
            display.rsrc_shift = 0;
            while (!((mask >> display.rsrc_shift) & 1)) {
                display.rsrc_shift++;
            }
            display.rsrc_id = 0;
            bl.get(pvlen, function (vendor) {
                display.vendor = vendor.toString().substr(0, display.vlen); // utf8 by default?
                display.format = {};
                for (var i = 0; i < display.format_num; ++i) {
                    bl.unpack('CCCxxxxx', function (fmt) {
                        var depth = fmt[0];
                        display.format[depth] = {
                            bits_per_pixel: fmt[1],
                            scanline_pad: fmt[2]
                        };
                        if (Object.keys(display.format).length === display.format_num) {
                            delete display.format_num;
                            display.screen = [];
                            readScreens(bl, display, cb);
                        }
                    });
                }
            });
        });
    });
}
exports.readServerHello = readServerHello;
function getByteOrder() {
    var isLittleEndian = ((new Uint32Array((new Uint8Array([1, 2, 3, 4])).buffer))[0] === 0x04030201);
    if (isLittleEndian) {
        return 'l'.charCodeAt(0);
    }
    else {
        return 'B'.charCodeAt(0);
    }
}
// TODO give options type of connection options
// TODO give stream type of PackStream from unpackstream file
function writeClientHello(stream, displayNum, authHost, socketFamily, options) {
    auth_1.default(displayNum, authHost, socketFamily, function (err, cookie) {
        if (err) {
            throw err;
        }
        if (!cookie) {
            throw new Error('No Cookie found :(');
        }
        var byteOrder = getByteOrder();
        var protocolMajor = 11; // TODO: config? env?
        var protocolMinor = 0;
        stream.pack('CxSSSSxxpp', [
            byteOrder,
            protocolMajor,
            protocolMinor,
            cookie.authName.length,
            cookie.authData.length,
            cookie.authName,
            cookie.authData
        ]);
        stream.flush();
    }, options);
}
exports.writeClientHello = writeClientHello;
//# sourceMappingURL=handshake.js.map