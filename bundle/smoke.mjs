// 冒烟测试：加载产物，创建终端，写入并检查 bridge API
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const dist = resolve("dist");
const b = await chromium.launch();
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.setContent(`<link rel=stylesheet href="${pathToFileURL(dist)}/wterm.css"><div id=t style="height:300px;width:600px"></div>`);
await p.addScriptTag({ path: `${dist}/wterm.js` });
const r = await p.evaluate(async () => {
  const t = new WTermLib.WTerm(document.getElementById("t"), {});
  await t.init();
  t.write("hello\r\n\x1b[?1049h\x1b[Halt");
  const br = t.bridge;
  return { cols: t.cols, alt: br.usingAltScreen(),
    api: ["getSelectionText", "selectAll", "search", "findNext", "findPrevious", "clearSearch", "fit", "focus", "destroy"].every((k) => typeof t[k] === "function"),
    bridge: ["cursorKeysApp", "bracketedPaste", "mouseTracking", "usingAltScreen"].every((k) => typeof br[k] === "function") };
});
await b.close();
console.log(JSON.stringify(r), errs);
if (errs.length || !r.alt || !r.api || !r.bridge || r.cols < 10) process.exit(1);
