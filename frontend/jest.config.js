// const { pathsToModuleNameMapper } = require("ts-jest");
// const { paths } = require("./tsconfig.json").compilerOptions;

// globalThis.ngJest = {
//     // skipNgcc: false,
//     tsconfig: "tsconfig.spec.json",
// };

module.exports = {
    // globalSetup: "jest-preset-angular/global-setup",
    preset: "jest-preset-angular",
    setupFilesAfterEnv: ["<rootDir>/setup-jest.js"],
    // moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: "<rootDir>" }),
    testEnvironment: "jsdom",
    modulePaths: ["./"],
    moduleFileExtensions: ["ts", "html", "js", "json", "mjs"],
};
