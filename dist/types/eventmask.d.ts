export interface EventMask {
    KeymapState: number;
    PropertyChange: number;
    EnterWindow: number;
    Button2Motion: number;
    ButtonMotion: number;
    OwnerGrabButton: number;
    StructureNotify: number;
    ButtonRelease: number;
    VisibilityChange: number;
    Button3Motion: number;
    Button5Motion: number;
    PointerMotion: number;
    PointerMotionHint: number;
    SubstructureNotify: number;
    ColormapChange: number;
    KeyPress: number;
    FocusChange: number;
    KeyRelease: number;
    Button1Motion: number;
    ButtonPress: number;
    Exposure: number;
    SubstructureRedirect: number;
    Button4Motion: number;
    LeaveWindow: number;
    ResizeRedirect: number;
}
export declare const eventMask: EventMask;
