var fs = require('fs')

fs
 .readdirSync(__dirname + '/../data/')
 .filter(file => (file.indexOf('.') !== 0) && file.slice(0,7) != 'lzutf8.' && (file.slice(-3) === 'jsn' || file.slice(-3) === 'txt'))
 .forEach((file) => {
  fs.unlinkSync(__dirname + '/../data/' + file)
 })

