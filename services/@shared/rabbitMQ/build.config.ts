import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
    entries: ["src/index"],
    clean: true,
    rollup: {
        inlineDependencies: true,
        esbuild: {
            target: "ESNext",
            minify: true,
        },
        output: {
            esModule: true,
        },
        emitCJS: true,
    },
    declaration: true,
});