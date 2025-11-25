import byteSize from 'byte-size';

function formatBytes(receivedBytes, decimals = 0) {
    const realBytes = typeof receivedBytes === 'string' ? Number(receivedBytes) : receivedBytes;
    const { value, unit } = byteSize(realBytes * 1000, {
        precision: decimals
    });
    if (!unit) {
        return '0B';
    }
    return `${value}${unit.toUpperCase()}`;
}

export { formatBytes };
//# sourceMappingURL=formatBytes.mjs.map
