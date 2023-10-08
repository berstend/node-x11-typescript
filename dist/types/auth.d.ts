/// <reference types="node" />
import './unpackbuffer';
import type { XConnectionOptions } from './xcore';
import ErrnoException = NodeJS.ErrnoException;
export interface ConnectionTypeToName {
    256: 'Local';
    65535: 'Wild';
    254: 'Netname';
    253: 'Krb5Principal';
    252: 'LocalHost';
    0: 'Internet';
    1: 'DECnet';
    2: 'Chaos';
    5: 'ServerInterpreted';
    6: 'Internet6';
}
export interface Cookie {
    type: keyof ConnectionTypeToName;
    address: string;
    display: string;
    authName: string;
    authData: string;
}
export default function (display: string, host: string, socketFamily: 'IPv4' | 'IPv6' | undefined, cb: (err: ErrnoException | null, cookie?: Pick<Cookie, 'authName'> & Pick<Cookie, 'authData'> & Partial<Cookie>) => void, options: XConnectionOptions): void;
