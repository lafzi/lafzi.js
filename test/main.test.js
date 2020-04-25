const test = require("ava");
import search from '../src/main'

test("lafzi search case 1", (t) => {
  return search({ query: 'aliflammim' }).then(res => {
    t.is(res.length, 8)
  })
});

test("lafzi search case 2", (t) => {
  return search({ query: '' }).then(res => {
    t.deepEqual(res, [])
  })
});