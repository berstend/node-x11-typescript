import { XCallback, XExtension, XExtensionInit } from '../xcore';
export interface XCMisc extends XExtension {
    QueryVersion: (clientMaj: number, clientMin: number, cb: XCallback<[number, number]>) => void;
    GetXIDRange: (cb: XCallback<{
        startId: number;
        count: number;
    }>) => void;
    GetXIDList: (count: number, cb: XCallback<number[]>) => void;
    major: number;
    minor: number;
}
export declare const requireExt: XExtensionInit<XCMisc>;
