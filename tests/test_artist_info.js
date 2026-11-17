const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const content = { innerHTML: "" };
const section = { classList: { remove() {} }, addEventListener() {} };
const context = vm.createContext({
    document: {
        title: "",
        getElementById: id => id === "artist-info-content" ? content :
            id === "artist-info-btn" ? section : null,
        querySelectorAll: () => []
    },
    window: { matchMedia: () => ({ addEventListener() {} }), addEventListener() {} },
    history: {}
});

assert.match(source, /\ninit\(\);\s*$/);
vm.runInContext(source.replace(/\ninit\(\);\s*$/, ""), context);
context.renderArtistInfo({
    name: "Artist <Name>",
    bio: "First paragraph.\n\nSecond <paragraph>.",
    links: {
        website: "https://example.com/?a=1&b=2",
        instagram: "https://instagram.com/example",
        tiktok: "https://tiktok.com/@example",
        unknown: "https://example.com/ignored",
        store: "javascript:alert(1)"
    }
});

assert.match(content.innerHTML, /<p>First paragraph\.<\/p>/);
assert.match(content.innerHTML, /<p>Second &lt;paragraph&gt;\.<\/p>/);
assert.match(content.innerHTML, /aria-label="More about Artist &lt;Name&gt;"/);
assert.match(content.innerHTML, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
assert.match(content.innerHTML, /rel="noopener noreferrer"/);
assert.match(content.innerHTML, /Website[\s\S]*?<\/a>/);
assert.match(content.innerHTML, /Instagram[\s\S]*?<\/a>/);
assert.match(content.innerHTML, /TikTok[\s\S]*?<\/a>/);
assert.equal((content.innerHTML.match(/class="external-link-icon"/g) || []).length, 3);
assert.match(content.innerHTML, /external-link-icon" aria-hidden="true"/);
assert.doesNotMatch(content.innerHTML, /unknown|javascript:|<paragraph>/);
console.log("Artist info rendering tests passed.");
