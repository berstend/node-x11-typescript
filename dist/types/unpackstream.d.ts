/// <reference types="node" />
import { EventEmitter } from 'events';
import { Writable } from 'stream';
export declare class PackStream extends EventEmitter {
    length: number;
    private readonly readlist;
    private offset;
    private readQueue;
    writeQueue: Buffer[];
    private writeLength;
    private resumed;
    constructor();
    write(buf: Buffer): void;
    pipe(stream: Writable): void;
    unpack(format: string, callback?: (data: number[]) => void): void;
    unpackTo(destination: {
        [key: string]: number;
    }, namesFormats: string[], callback: (arg: {
        [key: string]: number;
    }) => void): void;
    get(length: number, callback: (data: Buffer) => void): void;
    resume(): void;
    getbyte(): number;
    pack(format: string, args: any[]): this;
    flush(): void;
}
