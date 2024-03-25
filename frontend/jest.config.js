var preset = require("jest-preset-angular/jest-preset");
module.exports = {
    ...preset,
    preset: "jest-preset-angular",
    setupFilesAfterEnv: ["./setup-jest.js"],
    testMatch: ["**/*.test.ts"],
    globals: {
        ...preset.globals,
        "ts-jest": {
            ...preset.globals["ts-jest"],
            tsconfig: "./tsconfig.test.json",
            isolatedModules: true,
        },
    },
    // moduleDirectories: ["node_modules", "src", __dirname],
    modulePaths: ["<rootDir>"],
};
