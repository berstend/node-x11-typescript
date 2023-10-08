import { XCallback, XEvent, XExtension, XExtensionInit } from '../xcore';
export interface Shape extends XExtension {
    Kind: {
        Bounding: 0;
        Clip: 1;
        Input: 2;
    };
    Op: {
        Set: 0;
        Union: 1;
        Intersect: 2;
        Subtract: 3;
        Invert: 4;
    };
    Ordering: {
        Unsorted: 0;
        YSorted: 1;
        YXSorted: 2;
        YXBanded: 3;
    };
    QueryVersion: (cb: XCallback<[number, number]>) => void;
    Rectangles: (op: number, kind: number, window: number, x: number, y: number, rectangles: [number, number, number, number][], ordering: number) => void;
    Mask: (op: number, kind: number, window: number, x: number, y: number, bitmap: number) => void;
    SelectInput: (window: number, enable: boolean) => void;
    InputSelected: (window: number, cb: XCallback<number>) => void;
    events: {
        ShapeNotify: 0;
    };
}
export interface ShapeNotify extends XEvent {
    type: number;
    kind: number;
    seq: number;
    window: number;
    x: number;
    y: number;
    width: number;
    height: number;
    time: number;
    shaped: number;
    name: string;
}
export declare const requireExt: XExtensionInit<Shape>;
