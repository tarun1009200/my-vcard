// Checks every card listed in cards.json before GitHub Pages deploys it.
// Fails the build on missing pages, broken local links, invalid vCards or duplicate ids.
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || ".";
const registryPath = path.join(root, "cards.json");
const errors = [];
let registry = { cards: [] };

if (fs.existsSync(registryPath)) {
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch (e) {
    errors.push("cards.json is not valid JSON: " + e.message);
  }
}

const seen = new Set();
for (const card of registry.cards || []) {
  const id = card.id || "";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    errors.push("Invalid card id: " + JSON.stringify(id));
    continue;
  }
  if (seen.has(id)) errors.push("Duplicate card id: " + id);
  seen.add(id);

  const dir = path.join(root, "cards", id);
  const page = path.join(dir, "index.html");
  if (!fs.existsSync(page)) {
    errors.push(id + ": missing index.html");
    continue;
  }
  const html = fs.readFileSync(page, "utf8");
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:|#)/.test(ref)) continue;
    if (!fs.existsSync(path.join(dir, ref.split(/[?#]/)[0]))) errors.push(id + ": broken link " + ref);
  }

  if (card.active !== false) {
    const vcf = path.join(dir, "contact.vcf");
    if (!fs.existsSync(vcf)) {
      errors.push(id + ": missing contact.vcf");
    } else {
      const text = fs.readFileSync(vcf, "utf8");
      if (!text.startsWith("BEGIN:VCARD") || !text.trim().endsWith("END:VCARD")) errors.push(id + ": contact.vcf is not a valid vCard");
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => "ERROR " + e).join("\n"));
  process.exit(1);
}
console.log("Checked " + seen.size + " card(s): OK");
