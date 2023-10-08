import { XCallback, XExtension } from '../xcore';
export interface XTest extends XExtension {
    GetVersion: (clientMaj: number, clientMin: number, callback: XCallback<[number, number]>) => void;
    KeyPress: 2;
    KeyRelease: 3;
    ButtonPress: 4;
    ButtonRelease: 5;
    MotionNotify: 6;
    FakeInput: (type: number, keycode: number, time: number, wid: number, x: number, y: number) => void;
}
