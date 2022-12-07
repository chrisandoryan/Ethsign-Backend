const map = require("it-map");
const { pipe } = require("it-pipe");
const { extract } = require("it-tar");
const toBuffer = require("it-to-buffer");

exports.arrayEquals = (a, b) => {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

async function* tarballed(source) {
    yield* pipe(
        source,
        extract(),
        async function* (source) {
            for await (const entry of source) {
                yield {
                    ...entry,
                    body: await toBuffer(map(entry.body, (buf) => buf.slice()))
                }
            }
        }
    )
}

exports.tarballed = tarballed;