import { XCallback, XExtension, XExtensionInit } from '../xcore';
export interface DPMS extends XExtension {
    GetVersion: (clientMaj: number, clientMin: number, callback: XCallback<[number, number]>) => void;
    Capable: (callback: XCallback<any>) => void;
    GetTimeouts: (callback: XCallback<[number, number, number]>) => void;
    SetTimeouts: (standby: number, suspend: number, off: number) => void;
    Enable: () => void;
    Disable: () => void;
    ForceLevel: (level: 0 | 1 | 2 | 3) => void;
    Info: (callback: XCallback<[number, number]>) => void;
}
export declare const requireExt: XExtensionInit<DPMS>;
