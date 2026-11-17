const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
    path.join(__dirname, "..", "quiz", "quiz.js"),
    "utf8"
);
const elements = new Map();
function element(id) {
    if (!elements.has(id)) {
        elements.set(id, {
            addEventListener() {},
            add() {},
            appendChild() {},
            replaceChildren() {},
            querySelector() { return element("play-again"); },
            focus() {},
            options: [],
            value: "",
            hidden: false
        });
    }
    return elements.get(id);
}

const context = vm.createContext({
    document: {
        getElementById: element,
        createElement: () => ({})
    },
    Option: function Option(text, value) { return { text, value }; },
    fetch: async () => ({
        ok: true,
        json: async () => ({
            years: [2000],
            questions: [{
                id: "shared-art",
                artist: "Artist",
                image: "https://example.test/art.jpg",
                printings: [
                    { name: "Card", set: "Set Alpha", year: 2000 },
                    { name: "Card", set: "Set Beta", year: 2000 }
                ]
            }]
        })
    }),
    console
});

vm.runInContext(source, context);

const question = {
    correct: {
        name: "Card",
        set: "Set Alpha",
        sets: ["Set Alpha", "Set Beta"]
    }
};

assert.equal(context.scoreAnswer(question, "Card", "Set Alpha").points, 6);
assert.equal(context.scoreAnswer(question, "Card", "Set Beta").points, 6);
assert.equal(context.scoreAnswer(question, "Card", "Set Gamma").points, 5);
console.log("Quiz multi-set answer tests passed.");
