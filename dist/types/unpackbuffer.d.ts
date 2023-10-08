declare global {
    interface Buffer {
        unpack(format: string, offset?: number): number[];
        unpackString(n: number, offset: number): string;
    }
}
export {};
