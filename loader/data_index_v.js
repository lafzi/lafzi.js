import fs from "fs";

const textFile = fs.readFileSync(__dirname + '/../data/index_v.jsn', 'utf8');

export default textFile;