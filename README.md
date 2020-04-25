# Lafzi.js

## Setup

```bash
yarn add lafzi.js
# OR npm install lafzi.js
```

### Options
```
{
  query: 'kunfayakun',
  mode: 'v', // "v", "nv"
  threshold: 0.95, // 0.3 - 0.95
  isHilight: true, // Boolean
  multipleHighlightPos: false, // Boolean
}
```

### Usage
```
import Lafzi from 'lafzi.js' // commonjs
# import Lafzi from 'lafzi.js/dist/index.esm' // es module
const opt = {
    query: 'kunfayakun'
}
Lafzi(opt).then((res) => {
    console.log(res)
})
```

## License

[MIT](LICENSE).
