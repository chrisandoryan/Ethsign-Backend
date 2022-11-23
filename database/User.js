const mongoose = require("mongoose")

const schema = mongoose.Schema({
	username: String,
	password: String,
    email: Number,
})

module.exports = mongoose.model("User", schema)