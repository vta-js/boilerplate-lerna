const path = require("path");
const fse = require("fs-extra");
const { default: chalk } = require("chalk");

const cwd = process.cwd();

const savePath = path.resolve(
  cwd,
  "./.cache/80a2e8bd-db98-4190-afbe-0509f8e06f89/copied-files.json",
);
const needCopiedFiles = [];

function fileExists(dest) {
  return new Promise(resolve => {
    fse.exists(dest, resolve);
  });
}

function copyFiles(files, copiedFiles) {
  if (files.length === 0) return Promise.resolve();
  const { src, dest } = files[0];
  return fileExists(dest)
    .then(destExists => {
      if (!destExists) {
        return fileExists(src).then(srcExists => {
          if (srcExists) {
            return fse
              .ensureDir(dest.replace(/[^/\\]+?$/, ""))
              .then(() => fse.copyFile(src, dest))
              .then(() => ({ src, dest, copied: true }))
              .catch(() => {
                throw new Error(
                  `[file copy fail] from ${chalk.cyan(path.relative(cwd, src))} to ${chalk.yellow(
                    path.relative(cwd, dest),
                  )}`,
                );
              });
          }
          throw new Error(`[file cannot find] ${chalk.yellow(path.relative(cwd, src))}`);
        });
      }
      return { src, dest, copied: false };
    })
    .then(file => {
      copiedFiles.push(file);
      return copyFiles(files.slice(1), copiedFiles);
    });
}

module.exports = {
  add(src, dest) {
    needCopiedFiles.push({ src, dest });
  },
  remove(dest) {
    for (let i = 0, len = needCopiedFiles.length; i < len; i += 1) {
      if (needCopiedFiles.dest === dest) {
        needCopiedFiles.splice(i, 1);
        break;
      }
    }
  },
  commit() {
    const copiedFiles = [];
    return copyFiles(needCopiedFiles, copiedFiles)
      .then(
        () => {
          return fse.ensureFile(savePath).then(() =>
            fse.writeFile(
              savePath,
              JSON.stringify(
                copiedFiles.filter(({ copied }) => copied).map(({ dest }) => dest),
                null,
                2,
              ),
              {
                encoding: "utf8",
              },
            ),
          );
        },
        err => {
          return Promise.all(
            copiedFiles.filter(({ copied }) => copied).map(({ dest }) => fse.remove(dest)),
          ).then(() => {
            throw err;
          });
        },
      )
      .then(() => {
        needCopiedFiles.length = 0;
      });
  },
  wipe() {
    return fse
      .readFile(savePath, { encoding: "utf8" })
      .then(content => JSON.parse(content))
      .then(files => Promise.all(files.map(dest => fse.remove(dest))))
      .then(() => {});
  },
};
