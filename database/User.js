const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    nonce: {
        type: String
    },
    wallet_address: {
        type: String,
        required: true
    }
});

schema.pre(
    'save',
    async function (next) {
        const user = this;
        const hash = await bcrypt.hash(this.password, 10);
        const nonce = Math.floor(Math.random() * 1000000);

        this.password = hash;
        this.nonce = nonce;
        next();
    }
);

schema.methods.isValidPassword = async function (password) {
    const user = this;
    const compare = await bcrypt.compare(password, user.password);

    return compare;
}



module.exports = mongoose.model("User", schema)