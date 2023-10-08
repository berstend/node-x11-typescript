import { PackStream } from './unpackstream';
import type { XCallback, XConnectionOptions, XDisplay } from './xcore';
export declare function readServerHello(bl: PackStream, cb: XCallback<XDisplay, Error>): void;
export declare function writeClientHello(stream: PackStream, displayNum: string, authHost: string, socketFamily: 'IPv4' | 'IPv6' | undefined, options: XConnectionOptions): void;
