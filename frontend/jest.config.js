module.exports = {
    // globalSetup: "jest-preset-angular/global-setup",
    preset: "jest-preset-angular",
    setupFilesAfterEnv: ["<rootDir>/setup-jest.js"],
    // moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: "<rootDir>" }),
    testEnvironment: "jsdom",
    modulePaths: ["./"],
    roots: ["<rootDir>/src"],
    // moduleFileExtensions: ["ts", "html", "js", "json", "mjs"],
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                isolatedModules: true,
                tsconfig: "tsconfig.spec.json",
            },
        ],
    },
};
