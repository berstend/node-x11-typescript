import { XCallback, XEvent, XExtension, XExtensionInit } from '../xcore';
export interface Randr extends XExtension {
    QueryVersion: (clientMaj: number, clientMin: number, callback: XCallback<[number, number]>) => void;
    events: {
        RRScreenChangeNotify: 0;
    };
    NotifyMask: {
        ScreenChange: 1;
        CrtcChange: 2;
        OutputChange: 4;
        OutputProperty: 8;
        All: 15;
    };
    Rotation: {
        Rotate_0: 1;
        Rotate_90: 2;
        Rotate_180: 4;
        Rotate_270: 8;
        Reflect_X: 16;
        Reflect_Y: 32;
    };
    ConfigStatus: {
        Sucess: 0;
        InvalidConfigTime: 1;
        InvalidTime: 2;
        Failed: 3;
    };
    ModeFlag: {
        HSyncPositive: 1;
        HSyncNegative: 2;
        VSyncPositive: 4;
        VSyncNegative: 8;
        Interlace: 16;
        DoubleScan: 32;
        CSync: 64;
        CSyncPositive: 128;
        CSyncNegative: 256;
        HSkewPresent: 512;
        BCast: 1024;
        PixelMultiplex: 2048;
        DoubleClock: 4096;
        ClockDivideBy2: 8192;
    };
    majorOpcode: number;
    SetScreenConfig: (win: number, ts: number, configTs: number, sizeId: number, rotation: number, rate: number, cb: XCallback<{
        status: number;
        newTs: number;
        configTs: number;
        root: number;
        subpixelOrder: number;
    }, Error>) => void;
    SelectInput: (win: number, mask: number) => void;
    GetScreenInfo: (win: number, cb: XCallback<{
        rotations: number;
        root: number;
        timestamp: number;
        configTimestamp: number;
        sizeID: number;
        rotation: number;
        rate: number;
        rates: number[];
        screens: {
            pxWidth: number;
            pxHeight: number;
            mmWidth: number;
            mmHeight: number;
        }[];
    }>) => void;
    GetScreenResources: (win: number, cb: XCallback<{
        timestamp: number;
        configTimestamp: number;
        modeinfos: {
            id: number;
            width: number;
            height: number;
            dotClock: number;
            hSyncStart: number;
            hSyncEnd: number;
            hTotal: number;
            hSkew: number;
            vSyncStart: number;
            vSyncEnd: number;
            vTotal: number;
            modeflags: number;
            name: string;
        }[];
        crtcs: number[];
        outputs: number[];
    }>) => void;
    GetOutputInfo: (output: number, ts: number, cb: XCallback<{
        timestamp: number;
        crtc: number;
        crtcs: number[];
        mmWidth: number;
        mmHeight: number;
        modes: number[];
        clones: number[];
        connection: number;
        subpixelOrder: number;
        preferredModes: number;
        name: string;
    }>) => void;
    GetCrtcInfo: (crtc: number, configTs: number, cb: XCallback<{
        status: number;
        timestamp: number;
        x: number;
        y: number;
        width: number;
        height: number;
        mode: number;
        rotation: number;
        rotations: number;
    }>) => void;
    majorVersion: number;
    minorVersion: number;
}
export interface RRScreenChangeNotify extends XEvent {
    rotation: number;
    time: number;
    configTime: number;
    root: number;
    requestWindow: number;
    sizeId: number;
    subpixelOrder: number;
    width: number;
    height: number;
    physWidth: number;
    physHeight: number;
    name: string;
}
export declare const requireExt: XExtensionInit<Randr>;
