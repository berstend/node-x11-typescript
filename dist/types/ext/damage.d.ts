import { XCallback, XEvent, XExtension, XExtensionInit } from '../xcore';
export interface Damage extends XExtension {
    ReportLevel: {
        RawRectangles: 0;
        DeltaRectangles: 1;
        BoundingBox: 2;
        NonEmpty: 3;
    };
    QueryVersion: (clientMaj: number, clientMin: number, callback: XCallback<[number, number]>) => void;
    Create: (damage: number, drawable: number, reportlevel: number) => void;
    Destroy: (damage: number) => void;
    Subtract: (damage: number, repair: number, parts: number) => void;
    Add: (damage: number, region: number) => void;
    major: number;
    minor: number;
    events: {
        DamageNotify: 0;
    };
}
export interface DamageEvent extends XEvent {
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
    name: string;
}
export declare const requireExt: XExtensionInit<Damage>;
