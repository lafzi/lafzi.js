# Lafzi.js

## Setup

```bash
yarn add lafzi.js
# OR npm install lafzi.js
```

### Options
```js
{
  query: 'kunfayakun',
  mode: 'v', // "v", "nv"
  threshold: 0.95, // 0.3 - 0.95
  isHilight: true, // Boolean
  multipleHighlightPos: false, // Boolean
}
```

### Usage
```js
import Lafzi from 'lafzi.js' // commonjs
// import Lafzi from 'lafzi.js/dist/index.esm' // es module
const opt = {
    query: 'kunfayakun'
}
Lafzi(opt).then((res) => {
    console.log(res)
})
```

### Example
https://repl.it/@sprabowo/lafzijs-demo

## License

[MIT](LICENSE)
