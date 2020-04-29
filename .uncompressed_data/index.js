var fs = require('fs')
var LZUTF8 = require('lzutf8')
// var sourceReadStream = fs.createReadStream("./index_nv.jsn");
// var destWriteStream = fs.createWriteStream("./index_nv.jsn.lzutf8");
// var compressionStream = LZUTF8.createCompressionStream();
// sourceReadStream.pipe(compressionStream).pipe(destWriteStream);

fs
 .readdirSync(__dirname)
 .filter(file => (file.indexOf('.') !== 0) && (file.slice(-3) === 'jsn' || file.slice(-3) === 'txt'))
 .forEach((file) => {
  let tmp = fs.readFileSync(__dirname + '/' + file, 'utf8')
  let compressedBytes = LZUTF8.compress(tmp)
  let compressedBytesAsDecimalString = LZUTF8.encodeStorageBinaryString(compressedBytes)
  fs.writeFileSync(__dirname + '/../data/lzutf8.' + file, compressedBytesAsDecimalString,'utf8')
 })

