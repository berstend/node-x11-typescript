"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xutil_1 = require("../xutil");
// adding XRender functions manually from
//     http://cgit.freedesktop.org/xcb/proto/tree/src/render.xml?id=HEAD
// and http://www.x.org/releases/X11R7.6/doc/renderproto/renderproto.txt
// TODO: move to templates
exports.requireExt = function (display, callback) {
    var X = display.client;
    // @ts-ignore
    X.QueryExtension('RENDER', function (err, ext) {
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
        ext.QueryPictFormat = function (callback) {
            // @ts-ignore
            X.packStream.pack('CCS', [ext.majorOpcode, 1, 1]);
            X.seqNum++;
            X.replies[X.seqNum] = [
                function (buf) {
                    var res = {};
                    var res1 = buf.unpack('LLLLL');
                    // FIXME hardly any of these are used?
                    var numFormats = res1[0];
                    // const num_screens = res1[1]
                    // const num_depths = res1[2]
                    // const num_visuals = res1[3]
                    // const num_subpixel = res1[4]
                    // formats list:
                    var offset = 24;
                    var formats = [];
                    for (var i = 0; i < numFormats; ++i) {
                        // const format = {}
                        var f = buf.unpack('LCCxxSSSSSSSSL', offset);
                        formats.push(f);
                        offset += 28;
                    }
                    return {
                        formats: formats
                    };
                },
                callback
            ];
            X.packStream.flush();
        };
        // @ts-ignore
        ext.QueryFilters = function (callback) {
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 29, 2, display.screen[0].root]);
            X.seqNum++;
            X.replies[X.seqNum] = [
                function (buf) {
                    var h = buf.unpack('LL');
                    var numAliases = h[0];
                    var numFilters = h[1];
                    var aliases = [];
                    var offset = 24; // LL + 16 bytes pad
                    for (var i = 0; i < numAliases; ++i) {
                        aliases.push(buf.unpack('S', offset)[0]);
                        offset += 2;
                    }
                    var filters = [];
                    for (var i = 0; i < numFilters; ++i) {
                        var len = buf.unpack('C', offset)[0];
                        // if (!len) break;
                        offset++;
                        filters.push(buf.toString('ascii', offset, offset + len));
                        offset += len;
                    }
                    return [aliases, filters];
                },
                callback
            ];
            X.packStream.flush();
        };
        var valueList = [
            ['repeat', 'Cxxx'],
            ['alphaMap', 'L'],
            ['alphaXOrigin', 'sxx'],
            ['alphaYOrigin', 'sxx'],
            ['clipXOrigin', 'sxx'],
            ['clipYOrigin', 'sxx'],
            ['clipMask', 'L'],
            ['graphicsExposures', 'Cxxx'],
            ['subwindowMode', 'Cxxx'],
            ['polyEdge', 'Cxxx'],
            ['polyMode', 'Cxxx'],
            ['dither', 'L'],
            ['componentAlpha', 'Cxxx']
        ];
        // FIXME not used?
        // const argumentLength = {
        //   C: 1,
        //   S: 2,
        //   s: 2,
        //   L: 4,
        //   x: 1
        // }
        // @ts-ignore
        ext.CreatePicture = function (pid, drawable, pictformat, values) {
            var mask = 0;
            var reqLen = 5; // + (values + pad)/4
            var format = 'CCSLLLL';
            // @ts-ignore
            var params = [ext.majorOpcode, 4, reqLen, pid, drawable, pictformat, mask];
            if (values) {
                var valuesLength = 0;
                for (var i = 0; i < valueList.length; ++i) {
                    var name_1 = valueList[i][0];
                    // @ts-ignore
                    var val = values[name_1];
                    if (val) {
                        mask |= 1 << i;
                        params.push(val);
                        var valueFormat = valueList[i][1];
                        format += valueFormat;
                        valuesLength += 4; // argumentLength[valueFormat];
                    }
                }
                var pad4 = (valuesLength + 3) >> 2;
                var toPad = (pad4 << 2) - valuesLength;
                for (var i = 0; i < toPad; ++i)
                    format += 'x';
                reqLen += pad4;
                params[2] = reqLen;
                params[6] = mask;
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.FreePicture = function (pid) {
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 7, 2, pid]);
            X.packStream.flush();
            X.seqNum++;
        };
        function floatToFix(f) {
            return parseInt(String(f * 65536), 10);
        }
        function colorToFix(f) {
            if (f < 0)
                f = 0;
            if (f > 1)
                f = 1;
            return parseInt(String(f * 65535), 10);
        }
        // @ts-ignore
        ext.SetPictureTransform = function (pid, matrix) {
            var format = 'CCSLLLLLLLLLL';
            if (matrix.length !== 9) {
                throw new Error('Render.SetPictureTransform: incorrect transform matrix. Must be array of 9 numbers');
            }
            // @ts-ignore
            var params = [ext.majorOpcode, 28, 11, pid];
            for (var i = 0; i < 9; ++i) {
                if (typeof matrix[i] !== 'number') {
                    throw new Error('Render.SetPictureTransform: matrix element must be a number');
                }
                params.push(floatToFix(matrix[i]));
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // see example of blur filter here: https://github.com/richoH/rxvt-unicode/blob/master/src/background.C
        // @ts-ignore
        ext.SetPictureFilter = function (pid, name, filterParams) {
            if (filterParams === 0)
                filterParams = [0];
            if (!filterParams)
                filterParams = [];
            if (!Array.isArray(filterParams))
                filterParams = [filterParams];
            var reqLen = 2;
            var format = 'CCSLSxxp';
            // @ts-ignore
            var params = [ext.majorOpcode, 30, reqLen, pid, name.length, name];
            reqLen += xutil_1.paddedLength(name.length + 3) / 4 + filterParams.length;
            if (name === 'nearest' ||
                name === 'bilinear' ||
                name === 'fast' ||
                name === 'good') {
                if (filterParams.length !== 0) {
                    throw new Error('Render.SetPictureFilter: "' + name + '" - unexpected parameters for filters');
                }
            }
            else if (name === 'convolution') {
                if (filterParams.length < 2 ||
                    filterParams[0] * filterParams[1] + 2 !== filterParams.length) {
                    throw new Error('Render.SetPictureFilter: "convolution" - incorrect matrix dimensions. Must be flat array [ w, h, elem1, elem2, ... ]');
                }
                for (var i = 0; i < filterParams.length; ++i) {
                    format += 'L';
                    params.push(floatToFix(filterParams[i]));
                }
            }
            else if (name === 'binomial' || name === 'gaussian') {
                if (filterParams.length !== 1) {
                    throw new Error('Render.SetPictureFilter: "' +
                        name +
                        '" - incorrect number of parameters, must be exactly 1 number, instead got: ' +
                        filterParams);
                }
                format += 'L';
                params.push(floatToFix(filterParams[0]));
            }
            else {
                throw new Error('Render.SetPictureFilter: unknown filter "' + name + '"');
            }
            params[2] = reqLen;
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.CreateSolidFill = function (pid, r, g, b, a) {
            X.packStream.pack('CCSLSSSS', [
                // @ts-ignore
                ext.majorOpcode,
                33,
                4,
                pid,
                colorToFix(r),
                colorToFix(g),
                colorToFix(b),
                colorToFix(a)
            ]);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.RadialGradient = function (pid, p1, p2, r1, r2, stops) {
            var reqLen = 9 + stops.length * 3; // header + params + 1xStopfix+2xColors
            var format = 'CCSLLLLLLLL';
            // @ts-ignore
            var params = [ext.majorOpcode, 35, reqLen, pid];
            params.push(floatToFix(p1[0])); // L
            params.push(floatToFix(p1[1]));
            params.push(floatToFix(p2[0]));
            params.push(floatToFix(p2[1])); // L
            params.push(floatToFix(r1)); // L
            params.push(floatToFix(r2)); // L
            params.push(stops.length);
            // [ [float stopDist, [float r, g, b, a] ], ...]
            // stop distances
            for (var i = 0; i < stops.length; ++i) {
                format += 'L';
                // TODO: we know total params length in advance. ? params[index] =
                params.push(floatToFix(stops[i][0]));
            }
            // colors
            for (var i = 0; i < stops.length; ++i) {
                format += 'SSSS';
                for (var j = 0; j < 4; ++j)
                    params.push(colorToFix(stops[i][1][j]));
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.LinearGradient = function (pid, p1, p2, stops) {
            var reqLen = 7 + stops.length * 3; // header + params + 1xStopfix+2xColors
            var format = 'CCSLLLLLL';
            // @ts-ignore
            var params = [ext.majorOpcode, 34, reqLen, pid];
            params.push(floatToFix(p1[0])); // L
            params.push(floatToFix(p1[1]));
            params.push(floatToFix(p2[0]));
            params.push(floatToFix(p2[1])); // L
            params.push(stops.length);
            // [ [float stopDist, [float r, g, b, a] ], ...]
            // stop distances
            for (var i = 0; i < stops.length; ++i) {
                format += 'L';
                // TODO: we know total params length in advance. ? params[index] =
                params.push(floatToFix(stops[i][0]));
            }
            // colors
            for (var i = 0; i < stops.length; ++i) {
                format += 'SSSS';
                for (var j = 0; j < 4; ++j)
                    params.push(colorToFix(stops[i][1][j]));
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.ConicalGradient = function (pid, center, angle, stops) {
            var reqLen = 6 + stops.length * 3; // header + params + 1xStopfix+2xColors
            var format = 'CCSLLLLL';
            // @ts-ignore
            var params = [ext.majorOpcode, 36, reqLen, pid];
            params.push(floatToFix(center[0])); // L
            params.push(floatToFix(center[1]));
            params.push(floatToFix(angle)); // L
            params.push(stops.length);
            // [ [float stopDist, [float r, g, b, a] ], ...]
            // stop distances
            for (var i = 0; i < stops.length; ++i) {
                format += 'L';
                // TODO: we know total params length in advance. ? params[index] =
                params.push(floatToFix(stops[i][0]));
            }
            // colors
            for (var i = 0; i < stops.length; ++i) {
                format += 'SSSS';
                for (var j = 0; j < 4; ++j)
                    params.push(colorToFix(stops[i][1][j]));
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.FillRectangles = function (op, pid, color, rects) {
            var reqLen = 5 + rects.length / 2;
            var format = 'CCSCxxxLSSSS';
            // @ts-ignore
            var params = [ext.majorOpcode, 26, reqLen, op, pid];
            for (var j = 0; j < 4; ++j)
                params.push(colorToFix(color[j]));
            for (var i = 0; i < rects.length; i += 4) {
                format += 'ssSS';
                params.push(rects[i * 4]);
                params.push(rects[i * 4 + 1]);
                params.push(rects[i * 4 + 2]);
                params.push(rects[i * 4 + 3]);
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.Composite = function (op, src, mask, dst, srcX, srcY, maskX, maskY, dstX, dstY, width, height) {
            X.packStream
                .pack('CCSCxxxLLLssssssSS', [
                // @ts-ignore
                ext.majorOpcode,
                8,
                9,
                op,
                src,
                mask,
                dst,
                srcX,
                srcY,
                maskX,
                maskY,
                dstX,
                dstY,
                width,
                height
            ])
                .flush();
            X.seqNum++;
        };
        // note that Trapezoids is considered deprecated by Render extension
        // @ts-ignore
        ext.Trapezoids = function (op, src, srcX, srcY, dst, maskFormat, trapz) {
            var format = 'CCSCxxxLLLss';
            // @ts-ignore
            var params = [ext.majorOpcode, 10, 6 + trapz.length, op, src, dst, maskFormat, srcX, srcY];
            for (var i = 0; i < trapz.length; i++) {
                format += 'llllllllll';
                for (var j = 0; j < 10; ++j)
                    params.push(floatToFix(trapz[i * 10 + j]));
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.AddTraps = function (pic, offX, offY, trapList) {
            var format = 'CCSLss';
            // @ts-ignore
            var params = [ext.majorOpcode, 32, 3 + trapList.length, pic, offX, offY];
            for (var i = 0; i < trapList.length; i++) {
                format += 'l';
                params.push(floatToFix(trapList[i]));
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.Triangles = function (op, src, srcX, srcY, dst, maskFormat, tris) {
            var format = 'CCSCxxxLLLss';
            // @ts-ignore
            var params = [ext.majorOpcode, 11, 6 + tris.length, op, src, dst, maskFormat, srcX, srcY];
            for (var i = 0; i < tris.length; i += 6) {
                format += 'llllll';
                // TODO: Array.copy
                params.push(floatToFix(tris[i + 0])); // x1
                params.push(floatToFix(tris[i + 1])); // y1
                params.push(floatToFix(tris[i + 2])); // x2
                params.push(floatToFix(tris[i + 3])); // y2
                params.push(floatToFix(tris[i + 4])); // x3
                params.push(floatToFix(tris[i + 5])); // y3
            }
            X.packStream.pack(format, params);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.CreateGlyphSet = function (gsid, format) {
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 17, 3, gsid, format]);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.ReferenceGlyphSet = function (gsid, existing) {
            // @ts-ignore
            X.packStream.pack('CCSLL', [ext.majorOpcode, 18, 3, gsid, existing]);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.FreeGlyphSet = function (gsid) {
            // @ts-ignore
            X.packStream.pack('CCSL', [ext.majorOpcode, 19, 2, gsid]);
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.AddGlyphs = function (gsid, glyphs) {
            var numGlyphs = glyphs.length;
            var imageBytes = 0;
            var glyphPaddedLength;
            var glyphLength;
            var stride;
            var glyph;
            for (var i = 0; i < numGlyphs; i++) {
                glyph = glyphs[i];
                if (glyph.width % 4 !== 0) {
                    var stride_1 = (glyph.width + 3) & ~3;
                    var res = Buffer.alloc(glyph.height * stride_1);
                    res.fill(0);
                    for (var y = 0; y < glyph.height; ++y) {
                        glyph.image.copy(res, y * stride_1, y * glyph.width, y * glyph.width + glyph.width);
                    }
                    glyph.image = res;
                    glyph.width = stride_1;
                }
                glyphLength = glyphs[i].image.length;
                imageBytes += glyphLength;
                glyph.offX = glyph.offX / 64;
                glyph.offY = glyph.offY / 64;
            }
            var len = numGlyphs * 4 + imageBytes / 4 + 3;
            // TODO: check length, use bigReq
            // X.packStream.pack('CCSLL', [ext.majorOpcode, 20, len, gsid, glyphs.length]);
            // BigReq: S + [ length ] replaced with SL + [ 0, length+1 ]
            // @ts-ignore
            X.packStream.pack('CCSLLL', [ext.majorOpcode, 20, 0, len + 1, gsid, glyphs.length]);
            // glyph ids
            for (var i = 0; i < numGlyphs; i++) {
                X.packStream.pack('L', [glyphs[i].id]);
            }
            // width + heiht + origin xy + advance xy
            for (var i = 0; i < numGlyphs; i++) {
                X.packStream.pack('SSssss', [
                    glyphs[i].width,
                    glyphs[i].height,
                    -glyphs[i].x,
                    glyphs[i].y,
                    glyphs[i].offX,
                    glyphs[i].offY
                ]);
            }
            // image
            for (var i = 0; i < numGlyphs; i++) {
                X.packStream.writeQueue.push(glyphs[i].image);
            }
            X.packStream.flush();
            X.seqNum++;
        };
        // As far as I know this is not implemented in any X server and always retuen "Bad implementation"
        // Also documentation looks misleading as it's not mention glyph ids.
        // @ts-ignore
        ext.AddGlyphsFromPicture = function (gsid, src, glyphs) {
            var len = 3 + glyphs.length * 5;
            // @ts-ignore
            X.packStream.pack('CCSLLL', [ext.majorOpcode, 21, 0, len + 1, gsid, src]);
            for (var i = 0; i < glyphs.length; i++) {
                X.packStream.pack('L', [glyphs[i].id]);
            }
            for (var i = 0; i < glyphs.length; i++) {
                X.packStream.pack('SSssssss', [
                    glyphs[i].width,
                    glyphs[i].height,
                    -glyphs[i].x,
                    glyphs[i].y,
                    glyphs[i].offX,
                    glyphs[i].offY,
                    glyphs[i].srcX,
                    glyphs[i].srcY
                ]);
            }
        };
        // each GlyphEle:
        // 1 byte - number of glyphs
        // xxx
        // int16 deltax, deltay
        // + list of 8/16/32 byte indexesext.CompositeGlyphs
        //  OR
        //  255 + 0 + 0 + glyphsetId / font:
        //  CxxxssL, [255, 0, 0, glyphable]
        //
        //  Each GlyphEle must be padded to 4 byte boundary
        //
        // glyphs as input:
        // [ "just string (0,0) offset is used", [ 10, 10, "string offseted 10,10 from previous pen position" ], 1234567 ] 1234567 is glypfset id or FONT
        // TODO: pre-process input so strings larger than 254 chars are supported
        // (split them into multiple entries with 0,0 offset)
        // tslint:disable-next-line:ter-no-sparse-arrays
        var formatFromBits = [
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'C',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'S',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'L'
        ];
        var bufferWriteBits = [
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'writeUInt8',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'writeUInt16LE',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            'writeUInt32LE'
        ];
        // 8/16/32 bit string + 4-byte pad
        function wstring(bits, s) {
            var charLength = bits / 8;
            var dataLength = s.length * charLength;
            var res = Buffer.alloc(xutil_1.paddedLength(dataLength));
            debugger;
            // @ts-ignore
            var write = res[bufferWriteBits[bits]];
            res.fill(0);
            for (var i = 0; i < s.length; i++)
                write.call(res, s.charCodeAt(i), i * charLength);
            return res;
        }
        var compositeGlyphsOpcodeFromBits = [
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            23,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            24,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            25
        ];
        // @ts-ignore
        ext.CompositeGlyphs = function (glyphBits, op, src, dst, maskFormat, gsid, srcX, srcY, glyphs) {
            var opcode = compositeGlyphsOpcodeFromBits[glyphBits];
            var charFormat = formatFromBits[glyphBits];
            var charLength = glyphBits / 8;
            var length = 7;
            var glyphsLengthSplit = [];
            for (var i = 0; i < glyphs.length; ++i) {
                var g = glyphs[i];
                switch (typeof g) {
                    case 'string':
                        length += xutil_1.paddedLength(g.length * charLength) / 4 + 2;
                        break;
                    case 'object':
                        length += xutil_1.paddedLength(g[2].length * charLength) / 4 + 2;
                        break;
                    case 'number': // glyphset id
                        length += 3;
                        break;
                }
            }
            X.packStream.pack('CCSCxxxLLLLss', [
                // @ts-ignore
                ext.majorOpcode,
                opcode,
                length,
                op,
                src,
                dst,
                maskFormat,
                gsid,
                srcX,
                srcY
            ]);
            for (var i = 0; i < glyphs.length; ++i) {
                var g = glyphs[i];
                switch (typeof g) {
                    case 'string':
                        X.packStream.pack('Cxxxssa', [g.length, 0, 0, wstring(glyphBits, g)]);
                        break;
                    case 'object': // array
                        X.packStream.pack('Cxxxssa', [g[2].length, g[0], g[1], wstring(glyphBits, g[2])]);
                        break;
                    case 'number': // glyphset id
                        X.packStream.pack('CxxxSSL', [0xff, 0, 0, g]);
                        break;
                }
            }
            X.packStream.flush();
            X.seqNum++;
        };
        // @ts-ignore
        ext.CompositeGlyphs8 = function (op, src, dst, maskFormat, gsid, srcX, srcY, glyphs) { return ext.CompositeGlyphs(8, op, src, dst, maskFormat, gsid, srcX, srcY, glyphs); };
        // @ts-ignore
        ext.CompositeGlyphs16 = function (op, src, dst, maskFormat, gsid, srcX, srcY, glyphs) { return ext.CompositeGlyphs(16, op, src, dst, maskFormat, gsid, srcX, srcY, glyphs); };
        // @ts-ignore
        ext.CompositeGlyphs32 = function (op, src, dst, maskFormat, gsid, srcX, srcY, glyphs) { return ext.CompositeGlyphs(32, op, src, dst, maskFormat, gsid, srcX, srcY, glyphs); };
        // TODO: implement xutil-like code https://github.com/alexer/python-xlib-render/blob/master/xutil.py
        // TODO: name format fields
        // 0 - id
        // 1 - type ( direct / ? /)
        // 2 - depth
        //
        // 3 - red shift
        // 4 - red mask
        // 5 - green shift
        // 6 - green mask
        // 7 - blue shift
        // 8 - blue mask
        // 9 - alpha shift
        // 10 - alpha mask
        // 11 - colormap or none
        // @ts-ignore
        ext.QueryPictFormat(function (err, formats) {
            if (err)
                return callback(err);
            // @ts-ignore
            for (var i = 0; i < formats.formats.length; ++i) {
                // @ts-ignore
                var f = formats.formats[i];
                if (f[2] === 1 && f[10] === 1) {
                    // @ts-ignore
                    ext.mono1 = f[0];
                }
                if (f[2] === 24 && f[3] === 16 && f[5] === 8 && f[7] === 0) {
                    // @ts-ignore
                    ext.rgb24 = f[0];
                }
                // 1, 32, 16, 255, 8, 255, 0, 255, 24, 255, 0
                if (f[2] === 32 &&
                    f[3] === 16 &&
                    f[4] === 255 &&
                    f[5] === 8 &&
                    f[6] === 255 &&
                    f[7] === 0 &&
                    f[9] === 24) {
                    // @ts-ignore
                    ext.rgba32 = f[0];
                }
                if (f[2] === 8 && f[10] === 255) {
                    // @ts-ignore
                    ext.a8 = f[0];
                }
            }
            callback(null, ext);
        });
        [
            'PICTFORMAT argument does not name a defined PICTFORMAT',
            'PICTURE argument does not name a defined PICTURE',
            'PICTOP argument does not name a defined PICTOP',
            'GLYPHSET argument does not name a defined GLYPHSET',
            'GLYPH argument does not name a defined GLYPH in the glyphset'
        ].forEach(function (desc, code) {
            // @ts-ignore
            X.errorParsers[ext.firstError + code] = function (err) {
                err.message = 'XRender: a value for a ' + desc;
                return err;
            };
        });
        // @ts-ignore
        ext.PictOp = {
            Minimum: 0,
            Clear: 0,
            Src: 1,
            Dst: 2,
            Over: 3,
            OverReverse: 4,
            In: 5,
            InReverse: 6,
            Out: 7,
            OutReverse: 8,
            Atop: 9,
            AtopReverse: 10,
            Xor: 11,
            Add: 12,
            Saturate: 13,
            Maximum: 13,
            /*,
             * Operators only available in version 0.2,
             */
            DisjointMinimum: 0x10,
            DisjointClear: 0x10,
            DisjointSrc: 0x11,
            DisjointDst: 0x12,
            DisjointOver: 0x13,
            DisjointOverReverse: 0x14,
            DisjointIn: 0x15,
            DisjointInReverse: 0x16,
            DisjointOut: 0x17,
            DisjointOutReverse: 0x18,
            DisjointAtop: 0x19,
            DisjointAtopReverse: 0x1a,
            DisjointXor: 0x1b,
            DisjointMaximum: 0x1b,
            ConjointMinimum: 0x20,
            ConjointClear: 0x20,
            ConjointSrc: 0x21,
            ConjointDst: 0x22,
            ConjointOver: 0x23,
            ConjointOverReverse: 0x24,
            ConjointIn: 0x25,
            ConjointInReverse: 0x26,
            ConjointOut: 0x27,
            ConjointOutReverse: 0x28,
            ConjointAtop: 0x29,
            ConjointAtopReverse: 0x2a,
            ConjointXor: 0x2b,
            ConjointMaximum: 0x2b,
            /*,
             * Operators only available in version 0.11,
             */
            BlendMinimum: 0x30,
            Multiply: 0x30,
            Screen: 0x31,
            Overlay: 0x32,
            Darken: 0x33,
            Lighten: 0x34,
            ColorDodge: 0x35,
            ColorBurn: 0x36,
            HardLight: 0x37,
            SoftLight: 0x38,
            Difference: 0x39,
            Exclusion: 0x3a,
            HSLHue: 0x3b,
            HSLSaturation: 0x3c,
            HSLColor: 0x3d,
            HSLLuminosity: 0x3e,
            BlendMaximum: 0x3e
        };
        // @ts-ignore
        ext.PolyEdge = {
            Sharp: 0,
            Smooth: 1
        };
        // @ts-ignore
        ext.PolyMode = {
            Precise: 0,
            Imprecise: 1
        };
        // @ts-ignore
        ext.Repeat = {
            None: 0,
            Normal: 1,
            Pad: 2,
            Reflect: 3
        };
        // @ts-ignore
        ext.Subpixel = {
            Unknown: 0,
            HorizontalRGB: 1,
            HorizontalBGR: 2,
            VerticalRGB: 3,
            VerticalBGR: 4,
            None: 5
        };
        // @ts-ignore
        ext.Filters = {
            Nearest: 'nearest',
            Bilinear: 'bilinear',
            Convolution: 'convolution',
            Fast: 'fast',
            Good: 'good',
            Best: 'best'
        };
    });
};
//# sourceMappingURL=render.js.map