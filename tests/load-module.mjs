import { readFileSync } from "node:fs";
import ts from "typescript";

// Execute real source with explicit mocks for framework/database boundaries.
export function loadModule(path, mocks) {
  const source = readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  });
  const loadedModule = { exports: {} };
  const resolve = (name) => {
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function("require", "module", "exports", outputText)(resolve, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
