import { XCallback, XEvent, XExtension, XExtensionInit } from '../xcore';
export interface AppleWMEvent extends XEvent {
    type: number;
    name: 'AppleWMControllerNotify' | 'AppleWMActivationNotify' | 'AppleWMPasteboardNotify';
    time: number;
    arg: number;
}
export interface AppleWM extends XExtension {
    QueryVersion: (callback: XCallback<number[]>) => void;
    FrameRect: {
        Titlebar: 1;
        Tracking: 2;
        Growbox: 3;
    };
    FrameGetRect: (frameClass: number, frameRect: number, ix: number, iy: number, iw: number, ih: number, ox: number, oy: number, ow: number, oh: number, callback: XCallback<{
        x: number;
        y: number;
        w: number;
        h: number;
    }>) => void;
    FrameHitTest: (frameClass: number, px: number, py: number, ix: number, iy: number, iw: number, ih: number, ox: number, oy: number, ow: number, oh: number, callback: XCallback<number>) => void;
    FrameClass: {
        DecorLarge: 1;
        Reserved1: 2;
        Reserved2: 4;
        Reserved3: 8;
        DecorSmall: 16;
        Reserved5: 32;
        Reserved6: 64;
        Reserved8: 128;
        Managed: 32768;
        Transient: 65536;
        Stationary: 131072;
    };
    FrameAttr: {
        Active: 1;
        Urgent: 2;
        Title: 4;
        Prelight: 8;
        Shaded: 16;
        CloseBox: 0x100;
        Collapse: 0x200;
        Zoom: 0x400;
        CloseBoxClicked: 0x800;
        CollapseBoxClicked: 0x1000;
        ZoomBoxClicked: 0x2000;
        GrowBox: 0x4000;
    };
    FrameDraw: (screen: number, window: number, frameClass: number, attr: number, ix: number, iy: number, iw: number, ih: number, ox: number, oy: number, ow: number, oh: number, title: string) => void;
    NotifyMask: {
        Controller: 1;
        Activation: 2;
        Pasteboard: 4;
        All: 7;
    };
    SelectInput: (mask: number) => void;
    SetFrontProcess: () => void;
    WindowLevel: {
        Normal: 0;
        Floating: 1;
        TornOff: 2;
        Dock: 3;
        Desktop: 4;
    };
    SetWindowLevel: (window: number, level: number) => void;
    CanQuit: (state: number) => void;
    SetWindowMenu: (items: string) => void;
    SendPSN: (hi: number, lo: number) => void;
    AttachTransient: (child: number, parent: number) => void;
    events: {
        AppleWMControllerNotify: 0;
        AppleWMActivationNotify: 1;
        AppleWMPasteboardNotify: 2;
    };
    EventKind: {
        Controller: {
            MinimizeWindow: 0;
            ZoomWindow: 1;
            CloseWindow: 2;
            BringAllToFront: 3;
            WideWindow: 4;
            HideAll: 5;
            ShowAll: 6;
            WindowMenuItem: 9;
            WindowMenuNotify: 10;
            NextWindow: 11;
            PreviousWindow: 12;
        };
        Activation: {
            IsActive: 0;
            IsInactive: 1;
            ReloadPreferences: 2;
        };
        Pasteboard: {
            CopyToPasteboard: 0;
        };
    };
}
export declare const requireExt: XExtensionInit<AppleWM>;
