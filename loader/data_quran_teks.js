import fs from "fs";

const textFile = fs.readFileSync(__dirname + '/../data/quran_teks.txt', 'utf8');

export default textFile;