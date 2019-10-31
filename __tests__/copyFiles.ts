import path from "path";
import fse from "fs-extra";
import copyFiles from "../scripts/program/copyFiles";
import commitCopyFiles from "../scripts/program/commitCopyFiles";
import wipeCopiedFiles from "../scripts/program/wipeCopiedFiles";

jest.setTimeout(200000);

const cwd = process.cwd();

function fileExists(dest) {
  return new Promise(resolve => {
    fse.exists(dest, resolve);
  });
}

function readContent(dest) {
  return fileExists(dest).then(exists => {
    if (exists) {
      return fse.readFile(dest, "utf8");
    }
    return "";
  });
}

function readFileCount(dest) {
  return fse.readdir(dest).then(files => {
    return Promise.all(
      files.map(file => {
        const target = path.resolve(dest, file);
        if (fse.statSync(target).isDirectory()) {
          return readFileCount(target);
        }
        return 1;
      }),
    ).then(fileCounts => fileCounts.reduce((sum, fileCount) => sum + fileCount, 0));
  });
}

const packages = ["delay", "test-files-copy-001", "test-files-copy-002", "test-files-copy-011"];
const filesCopyToPackages = [
  "LICENSE",
  { src: "__tests__/data/copy-files/guid.txt", dest: "guid.txt" },
  {
    // only copy to `test-files-copy-011`
    src: "./__tests__/data/copy-files/verify.txt",
    exclude: "copy-00",
    include: /01/,
    dest(pkg) {
      return `docs/verify-${pkg.replace("test-files-copy-", "")}.txt`;
    },
  },
];

const CONTENTS = {
  guid: "guid-1ccf70f0-e413-40ca-8c59-3ee67134b92a",
  delayGuid: "[!important](don not edit content): ef84b3c4-b6d4-46bf-91cb-37e1a1fd9eb5",
  verify: "verify-72ab5f35-a064-4483-a4b6-c56248a76eb4",
};

it("readFileCount", () =>
  readFileCount(path.resolve(cwd, "__tests__/data/copy-files/")).then(fileCount => {
    expect(fileCount).toBe(4);
  }));

it("copyFiles", () => {
  return Promise.all(
    packages
      .filter(pkg => /^test-/.test(pkg))
      .map(pkg => fse.emptyDir(path.resolve(cwd, "packages", pkg)))
      .concat([fse.remove("packages/delay/LICENSE")]),
  )
    .then(() => copyFiles(packages, filesCopyToPackages))
    .then(() => commitCopyFiles())
    .then(() =>
      readContent(path.resolve(cwd, "packages/delay/guid.txt")).then(content => {
        // `delay` has its `guid.txt`, donnot copy and test origin content
        expect(content).toBe(CONTENTS.delayGuid);
      }),
    )
    .then(() =>
      fileExists(path.resolve(cwd, "packages/delay/LICENSE")).then(exists => {
        // expect copy `LICENSE` to package `delay`
        expect(exists).toBe(true);
      }),
    )
    .then(() =>
      readContent(path.resolve(cwd, "packages/test-files-copy-001/guid.txt")).then(content => {
        // expect copy `guid.txt` to package `test-files-copy-001`
        expect(content).toBe(CONTENTS.guid);
      }),
    )
    .then(() =>
      fileExists(path.resolve(cwd, "packages/test-files-copy-001/docs/verify-001.txt")).then(
        exists => {
          // expect donnot copy `verify.txt` to package `test-files-copy-001`
          expect(exists).toBe(false);
        },
      ),
    )
    .then(() =>
      fileExists(path.resolve(cwd, "packages/test-files-copy-001/docs/verify-002.txt")).then(
        exists => {
          // expect donnot copy `verify.txt` to package `test-files-copy-002`
          expect(exists).toBe(false);
        },
      ),
    )
    .then(() =>
      readContent(path.resolve(cwd, "packages/test-files-copy-011/docs/verify-011.txt")).then(
        content => {
          // expect copy `verify.txt` to package `test-files-copy-011`
          expect(content).toBe(CONTENTS.verify);
        },
      ),
    )
    .then(() => wipeCopiedFiles())
    .then(() =>
      Promise.all([
        readContent(path.resolve(cwd, "packages/delay/guid.txt")).then(content => {
          // `delay` has its `guid.txt`, donnot wipe and change it
          expect(content).toBe(CONTENTS.delayGuid);
        }),
        fileExists(path.resolve(cwd, "packages/delay/LICENSE")).then(exists => {
          // `LICENSE` is copied to package `delay`, wipe it
          expect(exists).toBe(false);
        }),
      ]),
    )
    .then(() =>
      Promise.all(
        packages
          .filter(pkg => /^test-/.test(pkg))
          .map(pkg => readFileCount(path.resolve(cwd, "packages", pkg))),
      ).then(fileLengths => {
        // all packages `test-*` should have no files
        expect(JSON.stringify(fileLengths)).toBe("[0,0,0]");
      }),
    )
    .then(() => fse.emptyDir(path.resolve(cwd, "packages", "test-files-copy-404")))
    .then(() =>
      copyFiles(
        ["test-files-copy-404"],
        ["LICENSE", { src: "__tests__/data/copy-files/404.html", dest: "404.html" }],
      ),
    )
    .then(() => commitCopyFiles())
    .then(
      () =>
        fileExists(path.resolve(cwd, "packages/test-files-copy-404/404.html")).then(exists => {
          // `LICENSE` is copied to package `delay`, wipe it
          expect(exists).toBe(false);
        }),
      err => {
        expect(/file cannot find/.test(err.message)).toBe(true);
      },
    )
    .then(
      () =>
        new Promise(resolve => {
          setTimeout(resolve, 3000);
        }),
    )
    .then(() =>
      fileExists(path.resolve(cwd, "packages/test-files-copy-404/LICENSE")).then(exists => {
        // when copied failed,should remove all copied files
        expect(exists).toBe(false);
      }),
    );
});
