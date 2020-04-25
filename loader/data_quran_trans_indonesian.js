import fs from "fs";

const textFile = fs.readFileSync(__dirname + '/../data/quran_trans_indonesian.txt', 'utf8');

export default textFile;