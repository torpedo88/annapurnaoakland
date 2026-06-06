// Map the build-time-only "server-only" marker to Next's empty shim for node/tsx runs.
const Module = require("module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return require.resolve("next/dist/compiled/server-only/empty.js");
  return orig.call(this, request, ...rest);
};
