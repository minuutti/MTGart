const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const aliases = readJson("data/artist-artwork-aliases.json");
const artists = readJson("data/artists.json");
const manifest = readJson("data/manifest.json");
const context = vm.createContext({
    document: { title: "", getElementById: () => null, querySelectorAll: () => [] },
    window: { matchMedia: () => ({ addEventListener() {} }), addEventListener() {} },
    history: {}
});
assert.match(source, /\ninit\(\);\s*$/);
vm.runInContext(source.replace(/\ninit\(\);\s*$/, ""), context);
context.testArtists = artists;
context.testAliases = aliases;
context.testOverrides = manifest.artistSlugOverrides;
vm.runInContext(`
    artists = testArtists;
    artistArtworkAliases = testAliases;
    artistSlugOverrides = testOverrides;
`, context);

for (const [name, credit] of Object.entries(aliases)) {
    const artist = artists.find(item => item.name === name);
    assert(artist, `Unknown artist ${name}`);
    const slug = context.artistShardSlug(artist);
    const artwork = readJson(`data/artists/${slug}.json`);
    assert(artwork.length, `Empty shard for ${name}`);
    assert(artwork.every(item => item.artist === credit), `Incorrect credit for ${name}`);
    assert.equal(context.findArtist(name), artist);
    const canonical = artists.find(item => context.slugify(item.name) === context.slugify(credit));
    assert.equal(context.findArtist(credit), canonical || artist);
}
assert.equal(context.artistShardSlug(context.findArtist("Massimilano Frezzato")), "massimiliano-frezzato");
assert.equal(context.findArtist("Massimiliano Frezzato").name, "Massimilano Frezzato");
console.log("Artist artwork alias tests passed.");
