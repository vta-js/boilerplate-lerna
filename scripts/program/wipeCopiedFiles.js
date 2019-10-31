const copiedFilesStore = require("../utils/copiedFilesStore");

module.exports = function wipeCopiedFiles() {
  return copiedFilesStore.wipe();
};
