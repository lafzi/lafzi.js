import fs from 'fs'

export function loadResources() {

    const files = [
        'index_nv.jsn',
        'index_v.jsn',
        'muqathaat.txt',
        'posmap_nv.txt',
        'posmap_v.txt',
        'quran_teks.txt',
        'quran_trans_indonesian.txt'
    ];

    let totalSize = 0;
    const dataRoot = __dirname + '/../data/';

    files.forEach(function (f) {
        totalSize += fs.statSync(dataRoot + f).size;
    });

    let loaded = 0;
    let buffer = {};

    files.forEach(function (f) {

        let name = f.slice(0, -4);
        buffer[name] = '';

        let readable = fs.createReadStream(dataRoot + f);
        readable.on('data', function (chunk) {
            loaded += chunk.length;
            // let percent = loaded / totalSize * 100;

            buffer[name] += chunk;

            if (loaded >= totalSize) {
                return new Promise(function (resolve, reject) {
                    resolve(buffer)
                })
            }
        });

    });

}


