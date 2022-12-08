const map = require("it-map");
const { pipe } = require("it-pipe");
const { extract } = require("it-tar");
const toBuffer = require("it-to-buffer");

const containsAll = (arr1, arr2) => arr2.every(arr2Item => arr1.includes(arr2Item))
exports.sameMembers = (arr1, arr2) => containsAll(arr1, arr2) && containsAll(arr2, arr1);

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