const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage({
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

exports.storage = storage;