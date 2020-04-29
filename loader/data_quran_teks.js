import fs from "fs";
import LZUTF8 from 'lzutf8'

let textFile
let fileName = 'quran_teks.txt'

let tmp = fs.readFileSync(__dirname + '/../data/lzutf8.' + fileName, 'utf8')
let decompressedBytesAsDecimalString = LZUTF8.Encoding.BinaryString.decode(tmp)
let decompressedBytes = LZUTF8.decompress(decompressedBytesAsDecimalString)
textFile = decompressedBytes

export default textFile;