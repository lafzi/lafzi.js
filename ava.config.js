export default () => {
  return {
    require: ["./test/_register.js", "esm", "@babel/polyfill"],
    files: ["test/**/*"],
    babel: true,
  };
};
