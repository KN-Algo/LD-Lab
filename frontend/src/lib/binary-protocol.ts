/**
 * Custom Binary Protocol Codec
 */

export const MessageType = {
    BATCH_UPDATE: 0x01,
    CONTROL: 0x02,
} as const;
export type MessageType = typeof MessageType[keyof typeof MessageType];

export const VariableType = {
    BOOL: 0x01,
    INT: 0x02,
    FLOAT: 0x03,
} as const;
export type VariableType = typeof VariableType[keyof typeof VariableType];

export interface MessageHeader {
    type: MessageType;
    reserved: number;
    count: number;
    timestamp: number;
}

export interface VariableEntry {
    name: string;
    type: VariableType;
    value: number;
}

export class BinaryDecoder {
    static decodeBatch(data: Uint8Array): { header: MessageHeader, entries: VariableEntry[] } {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        let offset = 0;

        // Read header (8 bytes)
        const type = view.getUint8(offset) as MessageType;
        offset += 1;
        const reserved = view.getUint8(offset);
        offset += 1;
        const count = view.getUint16(offset, true); // little-endian
        offset += 2;
        const timestamp = view.getUint32(offset, true); // little-endian
        offset += 4;

        const header: MessageHeader = { type, reserved, count, timestamp };
        const entries: VariableEntry[] = [];

        const decoder = new TextDecoder('utf-8');

        for (let i = 0; i < count; i++) {
            // Read name length
            const nameLen = view.getUint8(offset);
            offset += 1;

            // Read name
            const nameBytes = new Uint8Array(data.buffer, data.byteOffset + offset, nameLen);
            const name = decoder.decode(nameBytes);
            offset += nameLen;

            // Read type
            const varType = view.getUint8(offset) as VariableType;
            offset += 1;

            // Read value (8 bytes double)
            const value = view.getFloat64(offset, true); // little-endian
            offset += 8;

            entries.push({ name, type: varType, value });
        }

        return { header, entries };
    }
}
