import { extract } from './trigram'
import { LCS, flattenValues, contiguityScore, highlightSpan } from './array'
import { convert, convertNoVowel } from './phonetic'
import { hilight } from '../utils/hilight'

const LafziDocument = function() {

    this.id = 0;
    this.matchCount = 0;
    this.contigScore = 0;
    this.score = 0;
    this.matchTerms = {};
    this.LCS = [];
    this.highlightPos = [];

};

/**
 * @param {Object.<string,Array.<{docID:Number,freq:Number,pos:Array.<Number>}>>} docIndex
 * @param {string} query
 * @param {number} threshold
 * @param {string} [mode='v']
 * @param {searchCb} callback
 */
export const search = function (docIndex, query, threshold, mode, callback) {
    //  mode = v | nv
    if (mode === undefined) mode = 'v';
    let queryFinal;

    if (mode == 'v')
        queryFinal = convert(query);
    else
        queryFinal = convertNoVowel(query);

    let queryTrigrams = extract(queryFinal);
    if (Object.keys(queryTrigrams).length <= 0)
        callback([]);

    let matchedDocs = {};

    Object.keys(queryTrigrams).forEach(function (trigram) {
        let trigramFreq = queryTrigrams[trigram];

        if (docIndex[trigram] && Array.isArray(docIndex[trigram])) {
            let indexEntry = docIndex[trigram];
            for (let i = 0; i < indexEntry.length; i++) {
                let match = indexEntry[i];

                // hitung jumlah kemunculan dll
                if (matchedDocs[match.docID] !== undefined) {
                    matchedDocs[match.docID].matchCount += (trigramFreq < match.freq) ? trigramFreq : match.freq;
                } else {
                    matchedDocs[match.docID] = new LafziDocument();
                    matchedDocs[match.docID].matchCount = 1;
                    matchedDocs[match.docID].id = match.docID;
                }

                matchedDocs[match.docID].matchTerms[trigram] = match.pos;

            }
        }
    });

    let filteredDocs = [];
    let minScore = parseFloat(threshold * Object.keys(queryTrigrams).length).toPrecision(2);

    let matches = Object.keys(matchedDocs);
    for (let i = 0; i < matches.length; i++) {
        let docID = matches[i];
        let doc = matchedDocs[docID];

        let lcs = LCS(flattenValues(doc.matchTerms));
        let orderScore = lcs.length;

        doc.LCS = lcs;
        doc.contigScore = contiguityScore(lcs);
        doc.score = orderScore * doc.contigScore;

        if (doc.score >= minScore) {
            filteredDocs.push(doc);
        }
    }
    return new Promise(function (resolve, reject) {
        resolve(filteredDocs)
    });
    // callback(filteredDocs);

};
/**
 * @callback searchCb
 * @param {Array.<LafziDocument>} res
 */

Array.prototype.unique = function(){
    let u = {}, a = [];
    for(let i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
};

/**
 * @param {Array.<LafziDocument>} filteredDocs
 * @param {Array.<Array>} posmapData
 * @param {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string}>} quranTextData
 * @param {rankCb} callback
 */
export const rank = function (filteredDocs, posmapData, quranTextData, { multipleHighlightPos = false } = {}) {

    for (let i = 0; i < filteredDocs.length; i++) {
        let doc = filteredDocs[i];

        let realPos = [];
        let posmap = posmapData[doc.id - 1];
        let seq = [];

        for (let j = 0; j < doc.LCS.length; j++) {
            let pos = doc.LCS[j];
            seq.push(pos);
            seq.push(pos + 1);
            seq.push(pos + 2);
        }
        seq = seq.unique();
        
        for (let k = 0; k < seq.length; k++) {
            let pos = seq[k];
            realPos.push(posmap[pos - 1]);
        }

        // additional highlight custom
        let tmpHighlight = highlightSpan(realPos, 6);
        doc.highlightPos = tmpHighlight.filter(function(o) {
            return (o[0] != undefined && o[1] != undefined)
        })

        // additional scoring based on space
        if (quranTextData !== undefined && doc.highlightPos.length) {
            if (multipleHighlightPos) {
                for (let k = 0; k < doc.highlightPos.length; k++) {
                    let endPos = doc.highlightPos[k][1];
                    let docText = quranTextData[doc.id - 1].text;
                    if (docText[endPos + 1] == ' ' || docText[endPos + 2] == ' ' || docText[endPos + 3] == ' ') {
                        // doc.score += 0.001;
                        doc.highlightPos[k][1] += 2 // tambah 2 karakter
                    }
                }
            } else {
                let endPos = doc.highlightPos[doc.highlightPos.length - 1][1];
                let docText = quranTextData[doc.id - 1].text;
                if (docText[endPos + 1] == ' ' || docText[endPos + 2] == ' ' || docText[endPos + 3] == ' ') {
                    // doc.score += 0.001;
                    doc.highlightPos[0][1] += 2 // tambah 2 karakter
                }
            }
        }

        delete doc.LCS;
        delete doc.matchTerms;
        delete doc.contigScore;
    }

    filteredDocs.sort(function (docA, docB) {
        return docB.score - docA.score;
    });

    return new Promise(function (resolve, reject) {
        resolve(filteredDocs)
    });

};
/**
 * @callback rankCb
 * @param {Array.<LafziDocument>} res
 */

/**
 * Prepare search result for view
 * @param {Array.<{id:number,matchCount:number,score:number,highlightPos:Array.<number>}>}  rankedSearchResult
 * @param {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string}>}         quranTextData
 * @param {prepareCb} callback
 */
export const prepare = function (rankedSearchResult, quranTextData, { muqathaatData, isHilight = true, multipleHighlightPos = false } = {}) {
    
    let result = [];
    for (let i = 0; i < rankedSearchResult.length; i++) {
        let searchRes = rankedSearchResult[i];
        let quranData = quranTextData[searchRes.id - 1];
        let obj = {
            surah: quranData.surah,
            name: quranData.name,
            ayat: quranData.ayat,
            text: quranData.text,
            trans: quranData.trans,
            score: searchRes.score,
            highlightPos: searchRes.highlightPos
        };

        if (muqathaatData && muqathaatData[obj.surah] && muqathaatData[obj.surah][obj.ayat]) {
            obj.text = muqathaatData[obj.surah][obj.ayat]
        }

        obj.highlightPos = (multipleHighlightPos) ? obj.highlightPos : obj.highlightPos.slice(0,1)

        // hilight feature
        obj = (isHilight) ? Object.assign(obj, { text_hilight: hilight(obj.text, obj.highlightPos) }) : obj
        result.push(obj);
    }

    return new Promise(function (resolve, reject) {
        resolve(result)
    });
    // callback(result);

};
/**
 * @callback prepareCb
 * @param {Array.<{surah:Number,name:string,ayat:Number,text:string,trans:string,score:number,highlightPos:Array.<number>}>} res
 */