import fs from 'fs';
import LZUTF8 from 'lzutf8';

var textFile;
var fileName = 'posmap_v.txt';
var tmp = fs.readFileSync(__dirname + '/../data/lzutf8.' + fileName, 'utf8');
var decompressedBytesAsDecimalString = LZUTF8.decodeStorageBinaryString(tmp);
var decompressedBytes = LZUTF8.decompress(decompressedBytesAsDecimalString);
textFile = decompressedBytes;
var textFile$1 = textFile;

export default textFile$1;
