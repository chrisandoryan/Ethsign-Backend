const ipfsClient = require('ipfs-http-client');

const projectId = process.env.INFURA_IPFS_PROJECT_ID;
const apiSecret = process.env.INFURA_IPFS_API_SECRET;
const url = process.env.INFURA_IPFS_ENDPOINT;

const auth = "Basic " + Buffer.from(projectId + ":" + apiSecret).toString('base64')

const ipfs = ipfsClient.create({
    url: url,
    headers: {
        authorization: auth,
    }
});

exports.ipfs = ipfs;