const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "app.js"), "utf8");
const allSets = JSON.parse(fs.readFileSync(path.join(root, "data/sets.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "data/excluded-sets.json"), "utf8"));
const context = vm.createContext({
    document: {
        title: "",
        getElementById: () => null,
        querySelectorAll: () => []
    },
    window: {
        matchMedia: () => ({ addEventListener: () => {} }),
        addEventListener: () => {}
    },
    history: {}
});

assert.match(source, /\ninit\(\);\s*$/);
vm.runInContext(source.replace(/\ninit\(\);\s*$/, ""), context);
const exclude = context.getExcludedSetCodes;
const excluded = exclude(allSets, config);
const byCode = new Map(allSets.map(set => [set.code, set]));

for (const entry of config.sets) {
    assert.equal(byCode.get(entry.code)?.name, entry.name, `Invalid set entry: ${entry.code}`);
    assert(excluded.has(entry.code), `${entry.code} should be excluded`);
}

for (const code of [
    "sunf", "svow", "smid", "skhm", "sneo", "smom", "smh3", "sstx", "sbro", "slci", "sznr",
    "pwor", "ptmp", "p30a", "p2hg", "wc97", "wc98", "wc99", "wc00",
    "wc01", "wc02", "wc03", "wc04", "pafr", "p10e", "p5dn", "pltr", "pclb",
    "pdtp", "pdp10", "pdp12", "pdp13", "pdp14", "pdp15",
    "ocmd", "oc13", "oc14", "oc15", "oc16", "oc17", "oc18", "oc19",
    "oc20", "ocm1", "oafr", "o90p", "olep",
    "ftla", "jtla", "fdmu", "ffdn", "fj25", "fj22", "fjmp", "fmom", "fmsc",
    "fone", "fclu", "fltr", "ftmc", "fbro"
]) {
    assert(excluded.has(code), `${code} should be excluded`);
}
for (const set of allSets.filter(set => /^Duels of the Planeswalkers .* Promos$/.test(set.name))) {
    assert(excluded.has(set.code), `${set.name} should be excluded`);
}
for (const set of allSets.filter(set => /Front Cards$/i.test(set.name))) {
    assert(excluded.has(set.code), `${set.name} should be excluded`);
}
for (const set of allSets.filter(set => /Substitute Cards$/i.test(set.name))) {
    assert(excluded.has(set.code), `${set.name} should be excluded`);
}
for (const set of allSets.filter(set => /oversized/i.test(set.name))) {
    assert(excluded.has(set.code), `${set.name} should be excluded`);
}
for (const code of ["tmp", "afr", "pmic", "30a", "p30h", "p30m", "pgpx", "pnat", "dpa", "jmp", "j22", "clu", "fdn", "vow", "mid"]) {
    assert(!excluded.has(code), `${code} should remain visible`);
}

const futureSets = [
    { code: "abc", name: "Future Set" },
    { code: "pabc", name: "Future Set Promos" },
    { code: "wc30", name: "World Championship Decks 2030" }
];
const futureExcluded = exclude(futureSets, config);
assert(futureExcluded.has("pabc"));
assert(futureExcluded.has("wc30"));

const manualOnly = exclude(futureSets, {
    ...config,
    excludeSetPromos: false,
    excludeWorldChampionshipDecks: false
});
assert(!manualOnly.has("pabc"));
assert(!manualOnly.has("wc30"));
assert.throws(() => exclude(allSets, { ...config, sets: [{ code: "TMP", name: "Tempest" }] }));
assert.throws(() => exclude(allSets, { ...config, excludeSetPromos: "true" }));

context.allSets = allSets;
context.excluded = excluded;
vm.runInContext(`
    excludedSetCodes = excluded;
    sets = allSets.filter(set => !excludedSetCodes.has(set.code));
`, context);
assert.equal(context.findSet("ptmp"), undefined);
assert.equal(context.findSet("tmp").name, "Tempest");

const info = { innerHTML: "", querySelector: () => null };
const modal = { querySelector: () => null, classList: { remove: () => {} } };
context.document.getElementById = id => ({ modal, "modal-info": info })[id] || null;
context.document.body = { style: {} };
context.window.scrollY = 0;
const artworks = JSON.parse(fs.readFileSync(path.join(root, "data/artists/dan-frazier.json"), "utf8"));
const artwork = artworks.find(item => item.id === "c4cc8456-361f-4009-82d1-c5aaa85ba054");

(async () => {
    await context.openModal(artwork);
    assert.match(info.innerHTML, /Printed in \(2\)/);
    assert.match(info.innerHTML, /Tempest/);
    assert.doesNotMatch(info.innerHTML, /Tempest Promos/);
    await context.openModal({ ...artwork, cards: artwork.cards.filter(card => card.setCode === "ptmp") });
    assert.match(info.innerHTML, /Dirtcowl Wurm/);
    assert.match(info.innerHTML, /First print 1997/);
    assert.doesNotMatch(info.innerHTML, /Printed in/);
    console.log("Set exclusion tests passed.");
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
