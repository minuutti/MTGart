const setupScreen = document.getElementById("setup-screen");
const questionScreen = document.getElementById("question-screen");
const resultsScreen = document.getElementById("results-screen");
const setupForm = document.getElementById("setup-form");
const yearFrom = document.getElementById("year-from");
const yearTo = document.getElementById("year-to");
const questionCount = document.getElementById("question-count");
const availability = document.getElementById("availability");
const setupError = document.getElementById("setup-error");
const dataError = document.getElementById("data-error");
const answerForm = document.getElementById("answer-form");
const cardAnswer = document.getElementById("card-answer");
const setAnswer = document.getElementById("set-answer");
const submitAnswer = document.getElementById("submit-answer");
const nextQuestion = document.getElementById("next-question");

let quizData = null;
let questions = [];
let currentIndex = 0;
let totalScore = 0;

function normalizeAnswer(value) {
    return value.normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function nameSimilarity(left, right) {
    const a = normalizeAnswer(left);
    const b = normalizeAnswer(right);
    if (!a || !b) return 0;
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    let row = [];

    for (let i = 1; i <= a.length; i++) {
        row = [i];
        for (let j = 1; j <= b.length; j++) {
            row[j] = Math.min(
                row[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
        for (let j = 0; j <= b.length; j++) previous[j] = row[j];
    }

    return 1 - row[b.length] / Math.max(a.length, b.length);
}

function isNameCorrect(answer, expected) {
    return nameSimilarity(answer, expected) >= 0.8;
}

function isSetCorrect(answer, expected) {
    const normalized = normalizeAnswer(answer);
    return Boolean(normalized) && normalized === normalizeAnswer(expected);
}

function eligibleQuestions(from, to) {
    return quizData.questions.flatMap(question => {
        const printings = question.printings.filter(printing =>
            printing.year >= from && printing.year <= to
        );
        return printings.length ? [{ ...question, eligiblePrintings: printings }] : [];
    });
}

function updateAvailability() {
    if (!quizData) return;
    const from = Number(yearFrom.value);
    const to = Number(yearTo.value);
    const candidates = from <= to ? eligibleQuestions(from, to) : [];
    const available = candidates.length;
    const availableSets = [...new Set(
        candidates.flatMap(question => question.eligiblePrintings.map(printing => printing.set))
    )].sort((a, b) => a.localeCompare(b));

    setAnswer.replaceChildren(new Option("Choose a set", ""));
    availableSets.forEach(set => setAnswer.add(new Option(set, set)));
    setAnswer.disabled = !availableSets.length;
    questionCount.max = String(Math.max(available, 1));
    availability.textContent =
        `${available.toLocaleString()} distinct artworks and ${availableSets.length.toLocaleString()} sets available in this range.`;
    setupError.hidden = true;
}

function createYearOptions() {
    for (const year of quizData.years) {
        for (const select of [yearFrom, yearTo]) {
            const option = document.createElement("option");
            option.value = String(year);
            option.textContent = String(year);
            select.appendChild(option);
        }
    }
    yearFrom.value = String(quizData.years[0]);
    yearTo.value = String(quizData.years[quizData.years.length - 1]);
    updateAvailability();
}

function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    return shuffled;
}

function showQuestion() {
    const question = questions[currentIndex];
    const printing = question.printing;
    document.getElementById("question-progress").textContent =
        `Question ${currentIndex + 1} of ${questions.length}`;
    document.getElementById("question-score").textContent = `${totalScore} points`;

    const image = document.getElementById("question-image");
    image.src = question.image;
    image.alt = `Unidentified artwork by ${question.artist}`;
    document.getElementById("question-attribution").textContent =
        question.artist ? `Illustrated by ${question.artist}` : "";

    answerForm.reset();
    cardAnswer.disabled = false;
    setAnswer.disabled = false;
    submitAnswer.hidden = false;
    nextQuestion.hidden = true;
    nextQuestion.textContent = currentIndex === questions.length - 1
        ? "See results"
        : "Next question";
    question.answer = null;
    question.correct = {
        name: printing.name,
        set: printing.set,
        year: printing.year
    };
    setupScreen.hidden = true;
    resultsScreen.hidden = true;
    questionScreen.hidden = false;
    cardAnswer.focus();
}

function scoreAnswer(question, card, set) {
    const nameCorrect = isNameCorrect(card, question.correct.name);
    const setCorrect = isSetCorrect(set, question.correct.set);
    return {
        card,
        set,
        nameCorrect,
        setCorrect,
        points: (nameCorrect ? 5 : 0) + (setCorrect ? 1 : 0)
    };
}

function submitCurrentAnswer() {
    if (cardAnswer.disabled) return;
    const question = questions[currentIndex];
    question.answer = scoreAnswer(question, cardAnswer.value.trim(), setAnswer.value.trim());
    totalScore += question.answer.points;
    cardAnswer.disabled = true;
    setAnswer.disabled = true;
    submitAnswer.hidden = true;
    nextQuestion.hidden = false;
    document.getElementById("question-score").textContent = `${totalScore} points`;
    nextQuestion.focus();
}

function renderResults() {
    questionScreen.hidden = true;
    resultsScreen.hidden = false;
    document.getElementById("final-score").textContent =
        `You scored ${totalScore} out of ${questions.length * 6} points.`;

    const review = document.getElementById("answer-review");
    review.replaceChildren();
    questions.forEach((question, index) => {
        const item = document.createElement("article");
        item.className = "review-item";
        const image = document.createElement("img");
        image.src = question.image;
        image.alt = `Artwork by ${question.artist}`;
        const details = document.createElement("div");
        const title = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = `${index + 1}. ${question.correct.name}`;
        title.appendChild(strong);
        const set = document.createElement("p");
        set.textContent = `${question.correct.set} (${question.correct.year})`;
        const response = document.createElement("p");
        response.textContent =
            `Your answers: ${question.answer.card || "—"} / ${question.answer.set || "—"}`;
        const points = document.createElement("p");
        points.className = "review-points";
        points.textContent =
            `${question.answer.nameCorrect ? 5 : 0} name + ${question.answer.setCorrect ? 1 : 0} set = ${question.answer.points} points`;
        details.append(title, set, response, points);
        item.append(image, details);
        review.appendChild(item);
    });

    resultsScreen.querySelector("#play-again").focus();
}

function startQuiz(event) {
    event.preventDefault();
    const from = Number(yearFrom.value);
    const to = Number(yearTo.value);
    const count = Number(questionCount.value);
    const candidates = from <= to ? eligibleQuestions(from, to) : [];

    if (from > to) {
        setupError.textContent = "The start year must not be later than the end year.";
        setupError.hidden = false;
        return;
    }
    if (!Number.isInteger(count) || count < 1 || count > candidates.length) {
        setupError.textContent = `Choose between 1 and ${candidates.length} questions for this year range.`;
        setupError.hidden = false;
        return;
    }
    if (!setAnswer.options.length || setAnswer.options.length < 2) {
        setupError.textContent = "No sets are available in this year range.";
        setupError.hidden = false;
        return;
    }

    totalScore = 0;
    currentIndex = 0;
    questions = shuffle(candidates).slice(0, count).map(question => {
        const printing = question.eligiblePrintings[
            Math.floor(Math.random() * question.eligiblePrintings.length)
        ];
        return { ...question, printing, answer: null };
    });
    showQuestion();
}

async function loadQuizData() {
    try {
        const response = await fetch("./data/questions.json");
        if (!response.ok) throw new Error(`Could not load quiz data (${response.status})`);
        quizData = await response.json();
        if (!Array.isArray(quizData.years) || !quizData.years.length ||
            !Array.isArray(quizData.questions) || !quizData.questions.length) {
            throw new Error("Quiz data is empty or invalid");
        }
        createYearOptions();
    } catch (error) {
        console.error(error);
        dataError.textContent = "Quiz data could not be loaded. Please try again later.";
        dataError.hidden = false;
        setupForm.querySelector("button[type='submit']").disabled = true;
    }
}

yearFrom.addEventListener("change", updateAvailability);
yearTo.addEventListener("change", updateAvailability);
setupForm.addEventListener("submit", startQuiz);
answerForm.addEventListener("submit", event => {
    event.preventDefault();
    if (answerForm.reportValidity()) submitCurrentAnswer();
});
nextQuestion.addEventListener("click", () => {
    if (currentIndex === questions.length - 1) {
        renderResults();
    } else {
        currentIndex++;
        showQuestion();
    }
});
document.getElementById("play-again").addEventListener("click", () => {
    resultsScreen.hidden = true;
    setupScreen.hidden = false;
    updateAvailability();
    document.getElementById("setup-title").focus();
});

loadQuizData();
