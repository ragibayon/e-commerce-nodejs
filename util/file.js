const fs = require('fs');
const util = require('util');

exports.deleteFile = async filepath => {
  try {
    const unlinkFile = util.promisify(fs.unlink);
    await unlinkFile(filepath);
  } catch (err) {
    throw err;
  }
};
