import fs from "fs";

const textFile = fs.readFileSync(__dirname + '/../data/posmap_nv.txt', 'utf8');

export default textFile;