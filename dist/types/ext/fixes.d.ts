import { XCallback, XEvent, XExtension, XExtensionInit } from '../xcore';
export interface Fixes extends XExtension {
    QueryVersion: (clientMaj: number, clientMin: number, callback: XCallback<[number, number]>) => void;
    SaveSetMode: {
        Insert: 0;
        Delete: 1;
    };
    SaveSetTarget: {
        Nearest: 0;
        Root: 1;
    };
    SaveSetMap: {
        Map: 0;
        Unmap: 1;
    };
    ChangeSaveSet: (window: number, mode: number, target: number, map: number) => void;
    WindowRegionKind: {
        Bounding: 0;
        Clip: 1;
    };
    CreateRegion: (region: number, rects: {
        x: number;
        y: number;
        width: number;
        height: number;
    }[]) => void;
    CreateRegionFromWindow: (region: number, wid: number, kind: number) => void;
    DestroyRegion: (region: number) => void;
    UnionRegion: (src1: number, src2: number, dst: number) => void;
    TranslateRegion: (region: number, dx: number, dy: number) => void;
    FetchRegion: (region: number, cb: XCallback<{
        extends: Rectangle;
        rectangles: Rectangle[];
    }>) => void;
    major: number;
    minor: number;
    events: {
        DamageNotify: 0;
    };
}
export interface DamageNotify extends XEvent {
    level: number;
    drawable: number;
    damage: number;
    time: number;
    area: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    geometry: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    name: 'DamageNotify';
}
export declare type Rectangle = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare const requireExt: XExtensionInit<Fixes>;
