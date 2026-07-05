const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveGeneratedTs(
  request,
  parent,
  isMain,
  options,
) {
  if (
    parent?.filename?.includes(
      `${path.sep}src${path.sep}generated${path.sep}prisma${path.sep}`,
    ) &&
    request.endsWith(".js")
  ) {
    const tsPath = path.resolve(
      path.dirname(parent.filename),
      request.slice(0, -3) + ".ts",
    );

    if (fs.existsSync(tsPath)) {
      return tsPath;
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
