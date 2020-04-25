
/**
 * Parse Lafzi text data to some defined structures
 * @param {string} buffer
 * @returns {Object.<Number,Object.<Number,string>>}
 */
export const parseMuqathaat = function (buffer) {
    // Result:
    // Array[noSurat][noAyat] = text

    let lines = buffer.split('\n');
    let result = {};
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        let data = line.split('|');
        if (data) {
            let noSurat = data[0];
            let noAyat = data[2];
            let text = data[3];
            if(!result[noSurat])
                result[noSurat] = {};
    
            result[noSurat][noAyat] = text;
        }
    }

    return result;
};

/**
 * @param {string} bufferText
 * @param {string} bufferTrans
 * @returns {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string}>}
 */
export const parseQuran = function(bufferText, bufferTrans) {

    let lineText = bufferText.split('\n');
    let lineTrans = bufferTrans.split('\n');
    let result = [];

    for (let i = 0; i < lineText.length; i++) {
        let dataText = lineText[i].split('|');
        let dataTrans = lineTrans[i].split('|');
        let obj = {
            surah: Number(dataText[0]),
            name: dataText[1],
            ayat: Number(dataText[2]),
            text: dataText[3],
            trans: dataTrans[2]
        };
        result.push(obj);
    }

    return result;
};

/**
 * convert comma-delimited string to int array
 * @param {string} str
 * @returns {Array.<Number>}
 */
function strToIntArray(str) {
    let arr = str.split(',');
    return arr.map(function (val) {return Number(val)});
}

/**
 * @param {string} buffer
 * @returns {Array.<Array>}
 */
export const parsePosmap = function (buffer) {

    let lines = buffer.split('\n');
    let result = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        result.push(strToIntArray(line));
    }

    return result;

};

/**
 * @param {string} buffer
 * @returns {Object.<string,Array.<{docID:Number,freq:Number,pos:Array.<Number>}>>}
 */
export const parseIndex = function (buffer) {

    return JSON.parse(buffer);

};

