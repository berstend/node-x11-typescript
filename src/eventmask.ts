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
  ResizeRedirect: number
}

export const eventMask: EventMask = {
  KeyPress: 0x00000001,
  KeyRelease: 0x00000002,
  ButtonPress: 0x00000004,
  ButtonRelease: 0x00000008,
  EnterWindow: 0x00000010,
  LeaveWindow: 0x00000020,
  PointerMotion: 0x00000040,
  PointerMotionHint: 0x00000080,
  Button1Motion: 0x00000100,
  Button2Motion: 0x00000200,
  Button3Motion: 0x00000400,
  Button4Motion: 0x00000800,
  Button5Motion: 0x00001000,
  ButtonMotion: 0x00002000,
  KeymapState: 0x00004000,
  Exposure: 0x00008000,
  VisibilityChange: 0x00010000,
  StructureNotify: 0x00020000,
  ResizeRedirect: 0x00040000,
  SubstructureNotify: 0x00080000,
  SubstructureRedirect: 0x00100000,
  FocusChange: 0x00200000,
  PropertyChange: 0x00400000,
  ColormapChange: 0x00800000,
  OwnerGrabButton: 0x01000000
  // TODO: add more names for common masks combinations
}
