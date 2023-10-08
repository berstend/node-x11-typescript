/// <reference types="node" />
import { EventEmitter } from 'events';
import * as net from 'net';
import { ValueMask } from './corereqs';
import { StdAtoms } from './stdatoms';
import { PackStream } from './unpackstream';
export declare type RequestTemplate = Function | [string, Array<number>];
export declare type ResponseTemplate = Function;
export declare type ProtocolTemplates = {
    [key: string]: [RequestTemplate] | [RequestTemplate, ResponseTemplate];
};
export interface StackTrace {
    stack: string;
    timestamp: number;
}
export interface XCallback<T, E = XError> {
    (error: E | null, reply?: T): any;
}
export interface XConnectionOptions {
    xAuthority?: string;
    display?: string;
    debug?: boolean;
    disableBigRequests?: boolean;
}
export interface XScreen {
    root: number;
    default_colormap: number;
    white_pixel: number;
    black_pixel: number;
    input_masks: number;
    pixel_width: number;
    pixel_height: number;
    mm_width: number;
    mm_height: number;
    min_installed_maps: number;
    max_installed_maps: number;
    root_visual: number;
    root_depth: number;
    backing_stores: number;
    num_depths: number;
    depths: {
        [key: string]: {
            [key: string]: XVisual;
        };
    };
}
export interface XDisplay {
    screen_num: number;
    screen: XScreen[];
    resource_mask: number;
    vlen: number;
    rsrc_shift: number;
    rsrc_id: number;
    vendor: string;
    format: {
        [key: number]: {
            bits_per_pixel: number;
            scanline_pad: number;
        };
    };
    major: number;
    minor: number;
    xlen: number;
    release: number;
    resource_base: number;
    motion_buffer_size: number;
    max_request_length: number;
    format_num: number;
    image_byte_order: number;
    bitmap_bit_order: number;
    bitmap_scanline_unit: number;
    bitmap_scanline_pad: number;
    min_keycode: number;
    max_keycode: number;
    client?: XClient;
}
export interface XVisual {
    vid: number;
    class: number;
    bits_per_rgb: number;
    map_ent: number;
    red_mask: number;
    green_mask: number;
    blue_mask: number;
}
export interface XEvent {
    type: number;
    seq: number;
    rawData?: Buffer;
    wid?: number;
    parent?: number;
}
export interface XEventParser<T extends XEvent> {
    (type: number, seq: number, extra: number, code: number, raw: Buffer): T;
}
export interface XErrorParser<T = XError> {
    (error: XError, errorCode: number, seqNum: number, badValue: number, buf: Buffer): T;
}
export interface XExtension {
    present: number;
    majorOpcode: number;
    firstEvent: number;
    firstError: number;
}
export interface XExtensionInit<E extends XExtension, ERR extends Error = Error> {
    (display: XDisplay, callback: XCallback<E, ERR>): void;
}
export interface XExtensionModule<E extends XExtension> {
    requireExt: XExtensionInit<E>;
}
export declare class XError extends Error {
    error: number;
    seq: number;
    longstack?: StackTrace;
    badParam: number;
    minorOpcode: number;
    majorOpcode: number;
    message: string;
    constructor(error: number, seq: number, badParam: number, minorOpcode: number, majorOpcode: number, message: string);
}
export interface WindowAttributes {
    visual: number;
    klass: number;
    bitGravity: number;
    winGravity: number;
    backingPlanes: number;
    backingPixel: number;
    saveUnder: number;
    mapIsInstalled: number;
    mapState: number;
    overrideRedirect: number;
    colormap: number;
    allEventMasks: number;
    myEventMasks: number;
    doNotPropogateMask: number;
}
export declare class XClient extends EventEmitter {
    private readonly options;
    private coreRequests;
    private extRequests;
    private readonly displayNum;
    private screenNum;
    private display?;
    private stream?;
    private authHost?;
    private authFamily?;
    packStream: PackStream;
    private _seqNum;
    private seq2stack;
    replies: {
        [key: number]: [Function | undefined, XCallback<any>];
    };
    atoms: Readonly<StdAtoms> & {
        [key: string]: number;
    };
    atomNames: {
        [key: number]: string;
    };
    private eventConsumers;
    extraEventParsers: {
        [key: number]: XEventParser<XEvent>;
    };
    errorParsers: {
        [key: number]: XErrorParser;
    };
    private _extensions;
    private _closing;
    private _unusedIds;
    pendingAtoms: {
        [key: number]: string;
    };
    QueryExtension?: <E extends XExtension>(extName: string, callback: XCallback<E, Error>) => void;
    CreateWindow?: (id: number, parentId: number, x: number, y: number, width: number, height: number, borderWidth?: number, depth?: number, _class?: number, visual?: number, values?: Partial<Exclude<{
        [key in keyof ValueMask['CreateWindow']]: number | boolean;
    }, 'id' | 'parentId' | 'x' | 'y' | 'width' | 'height' | 'borderWidth' | 'depth' | '_class' | 'visual'>>) => void;
    MapWindow?: (wid: number) => void;
    QueryPointer?: (wid: number, callback: XCallback<{
        root: number;
        child: number;
        rootX: number;
        rootY: number;
        childX: number;
        childY: number;
        keyMask: number;
        sameScreen: number;
    }>) => void;
    WarpPointer?: (srcWin: number, dstWin: number, srcX: number, srcY: number, srcWidth: number, srcHeight: number, dstX: number, dstY: number) => void;
    GrabPointer?: (wid: number, ownerEvents: boolean, mask: number, pointerMode: number, keybMode: number, confineTo: number, cursor: number, time: number) => void;
    AllowEvents?: (mode: number, ts: number) => void;
    InternAtom?: (returnOnlyIfExist: boolean, value: string, cb: XCallback<number>) => void;
    GetAtomName?: (atom: number, cb: XCallback<string>) => void;
    QueryTree?: (window: number, callback: XCallback<{
        root: number;
        parent: number;
        children: number[];
    }>) => void;
    ChangeWindowAttributes?: (wid: number, values: Partial<{
        [key in keyof ValueMask['CreateWindow']]: number;
    }>) => void;
    DestroyWindow?: (wid: number) => void;
    ChangeProperty?: (mode: 0 | 1 | 2, wid: number, atomName: number, atomType: number, units: 8 | 16 | 32, data: Buffer | string) => void;
    GetProperty?: (del: number, wid: number, name: number, type: number, longOffset: number, longLength: number, callback: XCallback<{
        type: number;
        bytesAfter: number;
        data: Buffer;
    }>) => void;
    CreateGC?: (cid: number, drawable: number, values: Partial<{
        clipXOrigin: number;
        joinStyle: number;
        capStyle: number;
        arcMode: number;
        subwindowMode: number;
        foreground: number;
        graphicsExposures: number;
        clipMask: number;
        dashOffset: number;
        lineWidth: number;
        dashes: number;
        lineStyle: number;
        fillRule: number;
        background: number;
        function: number;
        tileStippleYOrigin: number;
        tile: number;
        fillStyle: number;
        stipple: number;
        planeMask: number;
        clipYOrigin: number;
        tileStippleXOrigin: number;
        font: number;
    }>) => void;
    ChangeGC?: (cid: number, values: Partial<{
        clipXOrigin: number;
        joinStyle: number;
        capStyle: number;
        arcMode: number;
        subwindowMode: number;
        foreground: number;
        graphicsExposures: number;
        clipMask: number;
        dashOffset: number;
        lineWidth: number;
        dashes: number;
        lineStyle: number;
        fillRule: number;
        background: number;
        function: number;
        tileStippleYOrigin: number;
        tile: number;
        fillStyle: number;
        stipple: number;
        planeMask: number;
        clipYOrigin: number;
        tileStippleXOrigin: number;
        font: number;
    }>) => void;
    GetWindowAttributes?: (wid: number, callback: XCallback<WindowAttributes>) => void;
    DeleteProperty?: (wid: number, atom: number) => void;
    KillClient?: (resource: number) => void;
    ForceScreenSaver?: (activate: boolean) => void;
    UnmapWindow?: (wid: number) => void;
    ResizeWindow?: (wid: number, width: number, height: number) => void;
    MoveWindow?: (wid: number, x: number, y: number) => void;
    MoveResizeWindow?: (win: number, x: number, y: number, width: number, height: number) => void;
    RaiseWindow?: (win: number) => void;
    LowerWindow?: (win: number) => void;
    ConfigureWindow?: (win: number, options: {
        stackMode: number;
        sibling: number;
        borderWidth: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }) => void;
    SendEvent?: (destination: number, propagate: boolean, eventMask: number, eventRawData: Buffer) => void;
    constructor(displayNum: string, screenNum: string, options: XConnectionOptions);
    set seqNum(v: number);
    get seqNum(): number;
    init(stream: net.Socket): void;
    terminate(): void;
    ping(cb: XCallback<number>): void;
    close(cb: XCallback<never>): void;
    importRequestsFromTemplates(target: {
        [key: string]: Function;
    }, reqs: ProtocolTemplates): void;
    AllocID(): number | undefined;
    ReleaseID(id: number): void;
    unpackEvent(type: number, seq: number, extra: number, code: number, raw: Buffer, headerBuf: Buffer): XEvent;
    expectReplyHeader(): void;
    private startHandshake;
    require<E extends XExtension>(extName: string, callback: XCallback<E, Error>): void;
}
export declare function createClient(options: XConnectionOptions, initCb: XCallback<XDisplay, Error>): XClient;
