const mongoose = require("mongoose")

const schema = mongoose.Schema({
	doc_id: String,
	doc_title: String,
    file_size: Number,
	ipfs_hash: String
})

module.exports = mongoose.model("Document", schema)