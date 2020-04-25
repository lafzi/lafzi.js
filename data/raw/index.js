var fs = require('fs')
var file = process.argv[2]
var file2 = process.argv[3]

var obj = fs.readFileSync(file, 'utf8')
var obj2 = fs.readFileSync(file2, 'utf8')

var arrayLine = obj.split('\n')
var arrayLine2 = obj2.split('\n')
var newJson = []
var newJson02 = {}
var newJson2 = []

arrayLine.forEach((element, id) => {
  if (element)
    newJson.push({"id": id, "kode": element.split('|')[0] })  
});
arrayLine2.forEach((element1, id) => {
  if (element1) {
    let arrayLine3 = element1.split(';')
    newJson2 = []
    arrayLine3.forEach(element2 => {
      let arrayLine4 = element2.split(':')
      newJson2.push({'docID': arrayLine4[0], 'freq': arrayLine4[1], 'pos': arrayLine4[2].split(',') })
    });
    if (!newJson02.hasOwnProperty([newJson[id]["kode"]])) {
      newJson02[newJson[id]["kode"]] = newJson2
    }
  }
});

let renameFile
renameFile = (file.includes('nonvokal')) ? 'index_nv.jsn' : 'index_v.jsn'
fs.writeFileSync(renameFile, JSON.stringify(newJson02), 'utf-8')