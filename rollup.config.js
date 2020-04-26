import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
// import pkg from './package.json';

export default [
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "src/main.js",
    external: "fs",
    output: {
      dir: "dist",
      entryFileNames: "index.cjs.js",
      chunkFileNames: "[name].cjs.js",
      format: "cjs",
    },
    plugins: [
      commonjs(),
      resolve(),
      babel({
        babelrc: false,
        plugins: [["@babel/transform-runtime"]],
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                browsers: ["last 2 versions", "safari >= 7"],
              },
              modules: false,
            },
          ],
        ],
        exclude: ["node_modules/**"],
        runtimeHelpers: true
      }),
    ],
  },
  {
    input: "src/main.js",
    external: "fs",
    output: {
      dir: "dist",
      entryFileNames: "index.esm.js",
      chunkFileNames: "[name].esm.js",
      format: "es",
    },
    plugins: [
      resolve(),
      babel({
        babelrc: false,
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                browsers: ["last 2 versions", "safari >= 7"],
              },
              modules: false,
            },
          ],
        ],
        exclude: ["node_modules/**"]
      }),
    ],
  },
];
