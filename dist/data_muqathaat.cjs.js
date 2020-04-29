'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var LZUTF8 = _interopDefault(require('lzutf8'));

var textFile;
var fileName = 'muqathaat.txt';
var tmp = fs.readFileSync(__dirname + '/../data/lzutf8.' + fileName, 'utf8');
var decompressedBytesAsDecimalString = LZUTF8.decodeStorageBinaryString(tmp);
var decompressedBytes = LZUTF8.decompress(decompressedBytesAsDecimalString);
textFile = decompressedBytes;
var textFile$1 = textFile;

exports.default = textFile$1;
