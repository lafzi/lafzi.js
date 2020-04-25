/**
 * Extract trigrams from string
 * @param {string} string
 * @returns {Array.<string>}
 */
function trigram(string) {

    string = string.trim();
    let length = string.length;

    if (length < 3) return [];
    if (length == 3) return [string];

    let trigrams = [];
    for (let i = 0; i <= length - 3; i++) {
        trigrams.push(string.substring(i, i+3));
    }

    return trigrams;

}

/**
 * Extract trigrams with frequencies
 * @param {string} string
 * @returns {Object.<string,number>}
 */
export function extract(string) {

    let trig = trigram(string);
    return trig.reduce(function (acc, e) {
        acc[e] = (e in acc ? acc[e] + 1 : 1);
        return acc;
    }, {});

}

