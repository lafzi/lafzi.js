import fs from "fs";

const textFile = fs.readFileSync(__dirname + '/../data/index_nv.jsn', 'utf8');

export default textFile;