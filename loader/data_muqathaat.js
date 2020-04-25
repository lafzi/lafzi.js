import fs from "fs";

const textFile = fs.readFileSync(__dirname + '/../data/muqathaat.txt', 'utf8');

export default textFile;