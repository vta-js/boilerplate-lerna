const config = require("./config");
const copyFiles = require("./program/copyFiles");
const commitCopyFiles = require("./program/commitCopyFiles");

Promise.all([copyFiles(config.packages, config.filesCopyToPackages)]).then(() => {
  commitCopyFiles();
});
