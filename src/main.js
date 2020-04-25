import loaddata from "./loaddata.js";
import {
  parseMuqathaat,
  parseIndex,
  parseQuran,
  parsePosmap,
} from "../core/dataParser";
import { search, rank, prepare } from "../core/searcher";

async function parseData() {
  const buffer = await loaddata();
  let dataMuqathaat;
  let dataQuran;
  let dataPosmap;
  let dataIndex;
  dataMuqathaat = parseMuqathaat(buffer["muqathaat"]);
  dataQuran = parseQuran(
    buffer["quran_teks"],
    buffer["quran_trans_indonesian"]
  );
  dataPosmap = {};
  dataPosmap["nv"] = parsePosmap(buffer["posmap_nv"]);
  dataPosmap["v"] = parsePosmap(buffer["posmap_v"]);
  dataIndex = {};
  dataIndex["nv"] = parseIndex(buffer["index_nv"]);
  dataIndex["v"] = parseIndex(buffer["index_v"]);

  return {
    dataIndex: dataIndex,
    dataPosmap: dataPosmap,
    dataQuran: dataQuran,
    dataMuqathaat: dataMuqathaat,
  };
}

function optimizedThreshold(t) {
  let tmpT = parseFloat(t).toPrecision(2) * 10;
  if (tmpT - 1 !== 0) {
    return --tmpT / 10;
  }
  return t;
}

function checkQuery(query) {
  if (query) {
    return decodeURIComponent(query.trim()).replace(/(\-|\+)/g, " ");
  }
  return null;
}

export default async function index({
  mode = "v",
  threshold = 0.95,
  isHilight = true,
  query = null,
  multipleHighlightPos = false,
} = {}) {
  query = checkQuery(query);
  if (query == null) {
    return [];
  }

  const { dataIndex, dataPosmap, dataQuran, dataMuqathaat } = await parseData();
  let searched = await search(dataIndex[mode], query, threshold, mode);
  let oldThreshold = threshold;

  if (searched && searched.length == 0 && oldThreshold !== threshold) {
    threshold = optimizedThreshold(threshold);
    oldThreshold = threshold;
    searched = await search(dataIndex[mode], query, threshold, mode);
  }
  if (searched && searched.length == 0 && oldThreshold !== threshold) {
    searched = await search(dataIndex[mode], query, threshold, mode);
  }

  let ranked = await rank(searched, dataPosmap[mode], dataQuran, { multipleHighlightPos: multipleHighlightPos });
  let result = await prepare(ranked, dataQuran, { muqathaatData: dataMuqathaat, isHilight: isHilight, multipleHighlightPos: multipleHighlightPos });
  return result;
}
