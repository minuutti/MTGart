const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const allSets = JSON.parse(fs.readFileSync(path.join(root, "data/sets.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "data/excluded-sets.json"), "utf8"));
const elements = {
    title: { textContent: "" },
    grid: { innerHTML: "" },
    "grid-loading": { classList: { add() {}, remove() {} } }
};
const errors = [];
const context = vm.createContext({
    document: {
        title: "",
        getElementById: id => elements[id] || null,
        querySelectorAll: () => []
    },
    window: {
        location: { pathname: "/" },
        matchMedia: () => ({ addEventListener() {} }),
        addEventListener() {},
        scrollTo() {}
    },
    history: { pushState() {} },
    console: { log() {}, error: error => errors.push(error) }
});

assert.match(source, /\ninit\(\);\s*$/);
vm.runInContext(source.replace(/\ninit\(\);\s*$/, ""), context);
context.fetch = async url => ({
    ok: true,
    json: async () => url.includes("sets.json") ? allSets :
        url.includes("artists.json") ? [{ name: "Dan Frazier" }, { name: "John Avon" }] : []
});
context.fetchJson = async url => url.includes("artist-artwork-aliases") ? {} : config;
context.loadInitialView = () => {};
context.hideAboutPage = () => {};
context.renderGrid = () => {};

(async () => {
    await context.loadData();
    assert.equal(context.findSet("tafr"), undefined);
    assert.equal(context.findSet("dmu").name, "Dominaria United");
    const loadSet = context.loadSet;
    const selected = [];
    context.loadSet = code => selected.push(code);
    for (let i = 0; i < 2000; i++) context.loadRandomSet();
    assert.equal(selected.length, 2000);
    for (const code of selected) {
        const set = allSets.find(item => item.code === code);
        assert.notEqual(set.hasArtworks, false, `${code} has no artwork shard`);
    }

    context.loadSet = loadSet;
    context.getSetEntries = async () => [{ id: "artwork" }];
    await context.loadSet("dmu", false);
    assert.equal(elements.title.textContent, "Dominaria United");
    context.getSetEntries = async () => { throw new Error("Network error"); };
    await context.loadSet("tmp", false);
    assert.equal(elements.title.textContent, "Tempest");
    assert.match(elements.grid.innerHTML, /Failed to load artworks/);
    assert.equal(errors.length, 1);
    context.getArtistArtworks = async () => [{ id: "artwork" }];
    const dan = context.findArtist("dan-frazier");
    await context.loadArtist(dan, false);
    await context.loadArtist(dan, false);
    assert.equal(elements.title.textContent, "Dan Frazier");
    context.getArtistArtworks = async () => { throw new Error("Network error"); };
    await context.loadArtist(context.findArtist("john-avon"), false);
    assert.equal(elements.title.textContent, "John Avon");
    assert.match(elements.grid.innerHTML, /Failed to load artworks/);
    assert.equal(errors.length, 2);
    context.getArtistArtworks = async () => {
        const error = new Error("Missing shard");
        error.status = 404;
        throw error;
    };
    await context.loadArtist(dan, false);
    assert.match(elements.grid.innerHTML, /Artwork data is not available for this artist/);
    assert.equal(errors.length, 3);
    console.log("Random set availability tests passed.");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
