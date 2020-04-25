const test = require("ava");

test("query search", (t) => {
  function checkQuery(query) {
    if (query) {
      return decodeURIComponent(query.trim()).replace(/(\-|\+)/g, " ");
    }
    return null;
  }
  t.deepEqual(checkQuery(""), null);
  t.deepEqual(checkQuery(), null);
  t.deepEqual(checkQuery(undefined), null);
});

test("default value mode", (t) => {
  function index({ mode = "v", threshold = 0.95, isHilight = true, query } = {}) {
    return mode;
  }
  t.deepEqual(index(), "v");
});

test("default value mode with object", (t) => {
  function index({ mode = "v", threshold = 0.95, isHilight = true, query } = {}) {
    return mode;
  }
  let option = { mode: "nv", query: "waliyadin" };
  t.deepEqual(index(option), "nv");
});

test("default query", (t) => {
  function index({ mode = "v", threshold = 0.95, isHilight = true, query = null } = {}) {
    return query;
  }
  t.deepEqual(index(), null);
});

test("default query with object", (t) => {
  function index({ mode = "v", threshold = 0.95, isHilight = true, query } = {}) {
    return query;
  }
  let option = { mode: "nv", query: "waliyadin" };
  t.deepEqual(index(option), "waliyadin");
});

test("default threshold", (t) => {
  function index({ mode = "v", threshold = 0.95, isHilight = true, query = null } = {}) {
    return threshold;
  }
  t.deepEqual(index(), 0.95);
});

test("default threshold with object", (t) => {
  function index({ mode = "v", threshold = 0.95, isHilight = true, query } = {}) {
    return threshold;
  }
  let option = { mode: "nv", query: "waliyadin", threshold: 0.6 };
  t.deepEqual(index(option), 0.6);
});

test("default threshold test case 1", (t) => {
  function optimizedThreshold(t) {
    let tmpT = parseFloat(t).toPrecision(2) * 10;
    if (tmpT - 1 !== 0) {
      return (--tmpT / 10);
    }
    return t;
  }
  t.deepEqual(optimizedThreshold(0.1), 0.1);
});