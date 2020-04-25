String.prototype.splice = function( idx, rem, s ) {
  return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

export function hilight(text, posArray) {
  let startPos, endPos;
  let tmpText = text

  // workaround for chromium arabic bug (not completed yet)
  let zwj = "&#x200d;";

  for (let i = posArray.length - 1; i >= 0; i--) {
    startPos = posArray[i][0];
    endPos = posArray[i][1] + 1;

    if (tmpText.length <= startPos)
      continue

    let spanStart = "<span class='hl_block'>";
    let spanEnd = "</span>";

    text = text.splice(endPos, 0, spanEnd);
    text = text.splice(startPos, 0, spanStart);
  }
  return text;
}
