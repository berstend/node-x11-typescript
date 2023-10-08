import { XCallback, XEvent, XExtension, XExtensionInit } from '../xcore';
export interface ScreenSaver extends XExtension {
    QueryVersion: (clientMaj: number, clientMin: number, cb: XCallback<[number, number]>) => void;
    State: {
        Off: 0;
        On: 1;
        Disabled: 2;
    };
    Kind: {
        Blanked: 0;
        Internal: 1;
        External: 2;
    };
    eventMask: {
        Notify: 1;
        Cycle: 2;
    };
    QueryInfo: (drawable: number, callback: XCallback<{
        state: number;
        window: number;
        until: number;
        idle: number;
        eventMask: number;
        kind: number;
    }>) => void;
    SelectInput: (drawable: number, eventMask: number) => void;
    major: number;
    minor: number;
    events: {
        ScreenSaverNotify: 0;
    };
    NotifyState: {
        Off: 0;
        On: 1;
        Cycle: 2;
    };
}
export interface ScreenSaverNotify extends XEvent {
    state: number;
    time: number;
    root: number;
    saverWindow: number;
    kind: number;
    forced: number;
    name: string;
}
export declare const requireExt: XExtensionInit<ScreenSaver>;
