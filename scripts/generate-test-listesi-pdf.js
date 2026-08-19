import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdPath = path.resolve(__dirname, "../docs/TEST-LISTESI.md");
const pdfPath = path.resolve(__dirname, "../docs/TEST-LISTESI.pdf");

function mdToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    html.push('<table class="data-table">');
    tableRows.forEach((row, idx) => {
      const tag = idx === 0 ? "th" : "td";
      html.push("<tr>");
      row.forEach((cell) => {
        html.push(`<${tag}>${escapeHtml(cell.trim())}</${tag}>`);
      });
      html.push("</tr>");
    });
    html.push("</table>");
    tableRows = [];
    inTable = false;
  };

  const escapeHtml = (text) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  for (const line of lines) {
    if (line.startsWith("|")) {
      if (/^\|[-| :]+\|$/.test(line.trim())) continue;
      inTable = true;
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|");
      tableRows.push(cells);
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith("# ")) {
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("---")) {
      html.push('<hr class="section-rule" />');
    } else if (/^\d+\.\s/.test(line)) {
      html.push(`<p class="ordered">${escapeHtml(line)}</p>`);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      html.push(`<p class="meta"><strong>${escapeHtml(line.slice(2, -2))}</strong></p>`);
    } else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      html.push(`<p class="footer-note">${escapeHtml(line.slice(1, -1))}</p>`);
    } else if (line.trim()) {
      html.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  if (inTable) flushTable();
  return html.join("\n");
}

const markdown = readFileSync(mdPath, "utf8");
const body = mdToHtml(markdown);

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      font-size: 10.5pt;
      line-height: 1.45;
    }
    h1 {
      color: #b45309;
      font-size: 20pt;
      margin: 0 0 8px;
      border-bottom: 3px solid #f59e0b;
      padding-bottom: 6px;
    }
    h2 {
      color: #1e293b;
      font-size: 12pt;
      margin: 18px 0 8px;
      background: #f8fafc;
      border-left: 4px solid #f59e0b;
      padding: 6px 10px;
    }
    p { margin: 4px 0 8px; }
    p.meta { font-size: 10pt; color: #334155; }
    p.ordered { margin-left: 8px; }
    p.footer-note {
      margin-top: 24px;
      text-align: center;
      color: #64748b;
      font-size: 9pt;
    }
    hr.section-rule {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 14px 0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 12px;
      font-size: 9.5pt;
    }
    table.data-table th {
      background: #0f172a;
      color: #f8fafc;
      text-align: left;
      padding: 7px 8px;
      border: 1px solid #1e293b;
    }
    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
  </style>
</head>
<body>${body}</body>
</html>`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
});
await browser.close();

console.log("✅ PDF oluşturuldu:", pdfPath);
