import { Transform } from 'stream';

/**
 * Create a filter stream that discard chunks which doesn't satisfies the given predicate
 *
 * @param predicate - A filter predicate, takes a stream data chunk as parameter and returns a boolean value
 * @param options - Transform stream options
 */ const filter = (predicate, options = {
    objectMode: true
})=>{
    return new Transform({
        ...options,
        async transform (chunk, _encoding, callback) {
            const keep = await predicate(chunk);
            callback(null, keep ? chunk : undefined);
        }
    });
};
/**
 * Create a map stream that transform chunks using the given predicate
 *
 * @param predicate - A map predicate, takes a stream data chunk as parameter and returns a mapped value
 * @param options - Transform stream options
 */ const map = (predicate, options = {
    objectMode: true
})=>{
    return new Transform({
        ...options,
        async transform (chunk, _encoding, callback) {
            const mappedValue = await predicate(chunk);
            callback(null, mappedValue);
        }
    });
};
/**
 * Collect every chunks from a Readable stream.
 *
 * @param stream - The redable stream to collect data from
 * @param options.destroy - If set to true, it automatically calls `destroy()` on the given stream upon receiving the 'end' event
 */ const collect = (stream, options = {
    destroy: true
})=>{
    const chunks = [];
    return new Promise((resolve, reject)=>{
        stream.on('close', ()=>resolve(chunks)).on('error', reject).on('data', (chunk)=>chunks.push(chunk)).on('end', ()=>{
            if (options.destroy) {
                stream.destroy();
            }
            resolve(chunks);
        });
    });
};

export { collect, filter, map };
//# sourceMappingURL=stream.mjs.map
