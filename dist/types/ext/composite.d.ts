import { XCallback, XExtension, XExtensionInit } from '../xcore';
export interface Composite extends XExtension {
    Redirect: {
        Automatic: 0;
        Manual: 1;
    };
    QueryVersion: (clientMaj: number, clientMin: number, callback: XCallback<[number, number]>) => void;
    RedirectWindow: (window: number, updateType: number) => void;
    RedirectSubwindows: (window: number, updateType: number) => void;
    UnredirectWindow: (window: number) => void;
    UnredirectSubwindows: (window: number) => void;
    CreateRegionFromBorderClip: (region: number, window: number) => void;
    NameWindowPixmap: (window: number, pixmap: number) => void;
    GetOverlayWindow: (window: number, callback: XCallback<number>) => void;
    ReleaseOverlayWindow: (window: number) => void;
    major: number;
    minor: number;
}
export declare const requireExt: XExtensionInit<Composite>;
