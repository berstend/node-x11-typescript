import type { XCallback, XExtension, XExtensionInit } from '../xcore';
export interface BigRequest extends XExtension {
    Enable(callback: XCallback<any>): void;
}
export declare const requireExt: XExtensionInit<BigRequest>;
