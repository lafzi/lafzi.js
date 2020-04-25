/**
 * @param {Array.<number>} arr
 * @returns {number}
 */
export function contiguityScore(arr) {

    let diff = [];
    let len = arr.length;

    if (len == 1) return 1;

    for (let i = 0; i < len - 1; i++) {
        diff.push(1 / (arr[i+1] - arr[i]));
    }

    let sum = diff.reduce(function(a, b) {return a+b}, 0);
    return sum / (len - 1);

}

/**
 * Longest Contiguous Subsequence
 * @param {Array.<number>} seq
 * @param {number} [maxgap=7]
 * @returns {Array.<number>}
 */
export function LCS(seq, maxgap) {
    if (maxgap === undefined) maxgap = 7;

    seq.sort(function (a, b) {return a-b;});
    let size = seq.length;
    let start = 0, length = 0, maxstart = 0, maxlength = 0;

    for (let i = 0; i < size - 1; i++) {
        if ((seq[i+1] - seq[i]) > maxgap) {
            length = 0;
            start = i+1;
        } else {
            length++;
            if (length > maxlength) {
                maxlength = length;
                maxstart = start;
            }
        }
    }

    maxlength++;

    return seq.slice(maxstart, maxstart + maxlength);

}

/**
 * @param {Object.<string,Array.<number>>} obj
 * @returns {Array.<number>}
 */
export function flattenValues(obj) {
    let result = [];
    let keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        result = result.concat(obj[key]);
    }
    return result;
}

/**
 * @param {Array.<number>} hlSequence
 * @param {number} [minLength=3]
 * @returns {Array.<Array.<number>>}
 */
export function highlightSpan(hlSequence, minLength) {
    if (minLength === undefined) minLength = 3;

    let len = hlSequence.length;
    if (len == 1)
        return [[hlSequence[0], hlSequence[0] + minLength]];

    hlSequence.sort(function (a, b) {return a-b;});

    let result = [];
    let j = 1;

    for (let i = 0; i < len; i++) {
        while (hlSequence[j] !== undefined && hlSequence[j] - hlSequence[j-1] <= minLength + 1 && j < len) {
            j++;
        }
        result.push([hlSequence[i], hlSequence[j-1]]);
        i = j - 1;
        j++;
    }

    return result;
}