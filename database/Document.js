const mongoose = require("mongoose")

const schema = mongoose.Schema({
	doc_id: String,
	doc_title: String,
    file_size: Number,
    file_type: String,
	ipfs_hash: String,
    uploader_address: String,
    signer_addresses: Array,
    signed_addresses: Array,
})

module.exports = mongoose.model("Document", schema)