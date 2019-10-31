const copiedFilesStore = require("../utils/copiedFilesStore");

module.exports = function commitCopyFiles() {
  return copiedFilesStore.commit();
};
