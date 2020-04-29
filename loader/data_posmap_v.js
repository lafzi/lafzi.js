import fs from "fs";
import LZUTF8 from 'lzutf8'

let textFile
let fileName = 'posmap_v.txt'

if (!fs.existsSync(__dirname + '/../data/' + fileName)) {
  let tmp = fs.readFileSync(__dirname + '/../data/lzutf8.' + fileName, 'utf8')
  let decompressedBytesAsDecimalString = LZUTF8.Encoding.BinaryString.decode(tmp)
  let decompressedBytes = LZUTF8.decompress(decompressedBytesAsDecimalString)
  fs.writeFileSync(__dirname + '/../data/' + fileName, decompressedBytes, 'utf8')
}
textFile = fs.readFileSync(__dirname + '/../data/' + fileName, 'utf8');

export default textFile;