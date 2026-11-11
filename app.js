let artists = [];
let sets = [];
let artistSlugOverrides = {};

const artistCache = new Map();
const setCache = new Map();

let currentArtist = null;
let currentSet = null;
let currentCards = [];
let artworkModalScrollY = 0;
let artworkModalBodyStyles = null;

const artistInfoSectionEl = document.getElementById("artist-info-btn");
const artistInfoBtnEl = document.getElementById("artist-info-btn");
const artistInfoModalEl = document.getElementById("artist-info-modal");
const artistInfoContentEl = document.getElementById("artist-info-content");
const aboutLinkEl = document.getElementById("about-link");
const defaultDocumentTitle = document.title;
let homeViewRequest = 0;
let homeArtworkSelectionPromise = null;


// ============================================================
// LOAD DATA
// ============================================================

const ARTIST_LINK_KEYS = [
    "website", "wikipedia", "instagram", "twitter", "bluesky",
    "artstation", "facebook", "youtube", "patreon", "store"
];

// Attaches hand-maintained links (data/artist-links.json) to artists by slug.
// A missing or invalid file is ignored so the gallery keeps working.
async function mergeArtistLinks(linksRes) {

    try {

        if (!linksRes || !linksRes.ok) {
            return;
        }

        const linksBySlug = await linksRes.json();

        artists.forEach(artist => {

            const entry = linksBySlug[artistShardSlug(artist)];

            if (!entry || typeof entry !== "object") {
                return;
            }

            const links = {};

            ARTIST_LINK_KEYS.forEach(key => {
                if (
                    typeof entry[key] === "string"
                    && entry[key].startsWith("https://")
                ) {
                    links[key] = entry[key];
                }
            });

            if (Object.keys(links).length) {
                artist.links = links;
            }
        });

    } catch (error) {
        console.warn("Could not load artist links", error);
    }
}

async function loadData() {

    try {

        const [artistsRes, setsRes, manifestRes, linksRes] =
            await Promise.all([
                fetch("./data/artists.json"),
                fetch("./data/sets.json"),
                fetch("./data/manifest.json")
                    .catch(() => null),
                fetch("./data/artist-links.json")
                    .catch(() => null)
            ]);

        if (!artistsRes.ok) {
            throw new Error("Could not load artists.json");
        }

        if (!setsRes.ok) {
            throw new Error("Could not load sets.json");
        }

        artists = await artistsRes.json();
        sets = await setsRes.json();

        if (manifestRes && manifestRes.ok) {
            const manifest = await manifestRes.json();
            artistSlugOverrides =
                manifest.artistSlugOverrides || {};
        }

        await mergeArtistLinks(linksRes);

        console.log(
            `Loaded ${artists.length} artists`
        );

        console.log(
            `Loaded ${sets.length} sets`
        );

        loadInitialView();

    } catch (error) {

        console.error(error);

        const grid = document.getElementById("grid");

        if (grid) {
            grid.innerHTML = `
                <p class="error">
                    Failed to load gallery data.
                </p>
            `;
        }
    }
}


// ============================================================
// URL ROUTING
// ============================================================

function getRoute() {
    const params = new URLSearchParams(window.location.search);

    if (params.get("page") === "about") {
        return {
            type: "about",
            value: ""
        };
    }

    if (params.has("artist")) {
        return {
            type: "artist",
            value: params.get("artist")
        };
    }

    if (params.has("set")) {
        return {
            type: "set",
            value: params.get("set")
        };
    }

    return {
        type: "home",
        value: ""
    };
}

function loadInitialView() {
    const route = getRoute();

    if (route.type === "about") {
        showAboutPage();
        return;
    }

    if (route.type === "artist") {
        const artist = findArtist(route.value);

        if (artist) {
            loadArtist(artist, false);
            return;
        }
    }

    if (route.type === "set") {
        const set = findSet(route.value);

        if (set) {
            loadSet(set.code, false);
            return;
        }
    }

    showHomePage();
}

function showAboutPage() {
    homeViewRequest++;
    document.getElementById("home-page")?.classList.add("hidden");
    document.getElementById("gallery")?.classList.add("hidden");
    document.querySelector(".page-heading")?.classList.add("hidden");
    document.getElementById("about-page")?.classList.remove("hidden");
    animatePageTitle(document.querySelector("#about-page h1"));
    document.title = "About — MTG Artist Gallery";

    currentArtist = null;
    currentSet = null;
    currentCards = [];
    clearArtistInfo();
    hideGridLoading();
}

function hideAboutPage() {
    homeViewRequest++;
    document.getElementById("home-page")?.classList.add("hidden");
    document.getElementById("gallery")?.classList.remove("hidden");
    document.querySelector(".page-heading")?.classList.remove("hidden");
    document.getElementById("about-page")?.classList.add("hidden");
    document.title = defaultDocumentTitle;
}

async function showHomePage() {
    const request = ++homeViewRequest;
    const homePage = document.getElementById("home-page");
    const artworkContainer = document.getElementById("home-artworks");
    const errorEl = document.getElementById("home-artwork-error");

    document.getElementById("gallery")?.classList.add("hidden");
    document.querySelector(".page-heading")?.classList.add("hidden");
    document.getElementById("about-page")?.classList.add("hidden");
    homePage.classList.remove("hidden");
    animatePageTitle(document.getElementById("home-title"));
    document.title = defaultDocumentTitle;
    currentArtist = null;
    currentSet = null;
    currentCards = [];
    clearArtistInfo();
    hideGridLoading();
    artworkContainer.replaceChildren();
    errorEl.classList.add("hidden");

    try {
        if (!homeArtworkSelectionPromise) {
            homeArtworkSelectionPromise = fetchJson("./data/home-artworks.json")
                .catch(error => {
                    homeArtworkSelectionPromise = null;
                    throw error;
                });
        }
        const selection = await homeArtworkSelectionPromise;
        if (!Array.isArray(selection) || selection.length !== 30 ||
            selection.some(entry => !entry || typeof entry.illustration_id !== "string" ||
                typeof entry.artistSlug !== "string") ||
            new Set(selection.map(entry => entry.illustration_id)).size !== selection.length) {
            throw new Error("Invalid home artwork selection");
        }

        const shuffled = [...selection];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const featured = await Promise.all(shuffled.slice(0, 8).map(async entry => {
            const artworks = await getArtistArtworks(entry.artistSlug);
            const artwork = artworks.find(item => item.id === entry.illustration_id);
            if (!artwork || !artwork.image) {
                throw new Error(`Featured artwork not found: ${entry.illustration_id}`);
            }
            return artwork;
        }));

        if (request !== homeViewRequest) return;

        featured.forEach(artwork => {
            const image = document.createElement("img");
            image.addEventListener("error", () => {
                console.warn(`Could not load featured artwork image: ${artwork.id}`);
                if (request === homeViewRequest) {
                    errorEl.textContent = "Some featured artwork images could not be loaded.";
                    errorEl.classList.remove("hidden");
                }
            }, { once: true });
            image.src = artwork.image;
            image.alt = `${artwork.cards[0]?.name || "Artwork"} by ${artwork.artist}`;
            image.title = image.alt;
            image.decoding = "async";
            artworkContainer.appendChild(image);
        });
    } catch (error) {
        console.error("Could not load featured artwork", error);
        if (request !== homeViewRequest) return;
        errorEl.textContent = "Featured artwork could not be loaded.";
        errorEl.classList.remove("hidden");
    }
}


// ============================================================
// URL HELPERS
// ============================================================

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function artistShardSlug(artistOrSlug) {

    if (typeof artistOrSlug === "string") {
        return slugify(artistOrSlug);
    }

    return artistSlugOverrides[artistOrSlug.name]
        || slugify(artistOrSlug.name);
}

async function fetchJson(url) {

    const response = await fetch(url);

    if (!response.ok) {
        const error = new Error(
            `Could not load ${url}`
        );
        error.status = response.status;
        throw error;
    }

    return response.json();
}

function cachedFetch(cache, key, url, fallback) {

    if (!cache.has(key)) {

        const promise = fetchJson(url).catch(error => {

            cache.delete(key);

            if (fallback && error.status === 404) {
                return fallback;
            }

            throw error;
        });

        cache.set(key, promise);
    }

    return cache.get(key);
}

function getArtistArtworks(artistOrSlug) {

    const slug = artistShardSlug(artistOrSlug);

    return cachedFetch(
        artistCache,
        slug,
        `./data/artists/${encodeURIComponent(slug)}.json`,
        []
    );
}

function getSetEntries(setCode) {

    const code = setCode.toLowerCase();

    return cachedFetch(
        setCache,
        code,
        `./data/sets/${encodeURIComponent(code)}.json`
    );
}

function showGridError(message) {

    hideGridLoading();

    const grid = document.getElementById("grid");

    if (grid) {
        grid.innerHTML = `
            <p class="error">
                ${escapeHtml(message)}
            </p>
        `;
    }
}

function artistUrl(artist) {
    return `${window.location.pathname}?artist=${encodeURIComponent(slugify(artist.name))}`;
}

function setUrl(setCode) {
    return `${window.location.pathname}?set=${encodeURIComponent(setCode)}`;
}

function aboutUrl() {
    return `${window.location.pathname}?page=about`;
}

function navigate(url) {
    history.pushState({}, "", url);
    loadInitialView();
}

window.addEventListener("popstate", () => {
    loadInitialView();
});


// ============================================================
// FIND ARTIST
// ============================================================

function findArtist(value) {

    const slug = slugify(value);

    return artists.find(
        artist =>
            slugify(artist.name) === slug
    );
}


// ============================================================
// FIND SET
// ============================================================

function findSet(value) {

    const normalized = value
        .toLowerCase();

    return sets.find(
        set =>
            set.code.toLowerCase()
            === normalized
            ||
            slugify(set.name)
            === normalized
    );
}


// ============================================================
// RANDOM ARTIST
// ============================================================

function randomArtist() {

    if (!artists.length) {
        return null;
    }

    return artists[
        Math.floor(
            Math.random() *
            artists.length
        )
    ];
}


function loadRandomArtist(updateUrl = true) {

    const artist = randomArtist();

    if (!artist) {
        return;
    }

    if (updateUrl) {

        history.pushState(
            {},
            "",
            artistUrl(artist)
        );
    }

    loadArtist(
        artist,
        false
    );
}


// ============================================================
// ARTIST VIEW
// ============================================================

async function loadArtist(
    artist,
    updateUrl = true
) {

    if (!artist) {
        return;
    }

    hideAboutPage();
    currentArtist = artist;
    currentSet = null;

    if (updateUrl) {

        history.pushState(
            {},
            "",
            artistUrl(artist)
        );
    }

    showGridLoading();

    let artistArtworks;

    try {

        artistArtworks =
            await getArtistArtworks(artist);

    } catch (error) {

        console.error(error);

        if (currentArtist === artist) {
            showGridError(
                "Failed to load artworks."
            );
        }

        return;
    }

    // Ignore stale responses if the user navigated meanwhile.
    if (currentArtist !== artist) {
        return;
    }

    currentCards =
        artistArtworks;

    renderArtistInfo(
        artist
    );

    renderArtistView(
        artist,
        artistArtworks
    );
}


// ============================================================
// ARTIST INFO
// ============================================================

function renderArtistInfo(artist) {
    if (!artistInfoSectionEl) {
        return;
    }

    // Show the artist info link
    artistInfoSectionEl.classList.remove("hidden");

    if (!artistInfoContentEl) {
        return;
    }

    // Populate the modal content
    artistInfoContentEl.innerHTML = `
        <div class="artist-info-card">

            ${
                artist.portrait
                    ? `
                        <img
                            src="${artist.portrait}"
                            alt="${escapeHtml(artist.name)}"
                            class="artist-info-portrait"
                        >
                    `
                    : ""
            }

            <div class="artist-info-copy">

                <h3>
                    ${escapeHtml(artist.name)}
                </h3>

                ${
                    artist.dateOfBirth
                    ? `
                        <p>
                            <strong>Born:</strong>
                            ${escapeHtml(artist.dateOfBirth)}
                        </p>
                    `
                    : ""
                }

                ${
                    artist.location
                    ? `
                        <p>
                            <strong>Location:</strong>
                            ${escapeHtml(artist.location)}
                        </p>
                    `
                    : ""
                }

                ${
                    artist.firstArtYear
                    ? `
                        <p>
                            <strong>First Magic art:</strong>
                            ${artist.firstArtYear}
                            ${
                                artist.firstArtSet
                                ? ` — ${escapeHtml(artist.firstArtSet)}`
                                : ""
                            }
                        </p>
                    `
                    : ""
                }

                ${
                    artist.bio
                    ? `
                        <p>
                            ${escapeHtml(artist.bio)}
                        </p>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}


// ============================================================
// ARTIST INFO MODAL
// ============================================================

function openArtistInfoModal() {
    if (!artistInfoModalEl) {
        return;
    }

    artistInfoModalEl.classList.remove("hidden");
}

function closeArtistInfoModal() {
    if (!artistInfoModalEl) {
        return;
    }

    artistInfoModalEl.classList.add("hidden");
}


// ============================================================
// ARTIST VIEW
// ============================================================

function renderArtistView(
    artist,
    artistArtworks
) {

    const title =
        document.getElementById(
            "title"
        );

    if (title) {
        title.textContent =
            artist.name;
        animatePageTitle(title);
    }

    renderGrid(
        artistArtworks
    );
}


// ============================================================
// RANDOM SET
// ============================================================

function randomSet() {

    if (!sets.length) {
        return null;
    }

    return sets[
        Math.floor(
            Math.random() *
            sets.length
        )
    ];
}


function loadRandomSet() {

    const set = randomSet();

    if (!set) {
        return;
    }

    history.pushState(
        {},
        "",
        setUrl(set.code)
    );

    loadSet(
        set.code,
        false
    );
}


// ============================================================
// SET VIEW
// ============================================================

async function loadSet(
    setCode,
    updateUrl = true
) {

    const set = findSet(
        setCode
    );

    if (!set) {

        console.warn(
            "Set not found:",
            setCode
        );

        return;
    }

    hideAboutPage();
    currentSet = set;
    currentArtist = null;

    if (updateUrl) {

        history.pushState(
            {},
            "",
            setUrl(set.code)
        );
    }

    showGridLoading();

    let setArtworks;

    try {

        setArtworks =
            await getSetEntries(set.code);

    } catch (error) {

        console.error(error);

        if (currentSet === set) {
            clearArtistInfo();
            showGridError(
                "Failed to load artworks."
            );
        }

        return;
    }

    if (currentSet !== set) {
        return;
    }

    currentCards =
        setArtworks;

    const title =
        document.getElementById(
            "title"
        );

    if (title) {

        title.textContent =
            set.name;
        animatePageTitle(title);
    }

    clearArtistInfo();

    renderGrid(
        setArtworks
    );
}


// ============================================================
// CLEAR ARTIST INFO
// ============================================================

function clearArtistInfo() {

    if (artistInfoSectionEl) {
        artistInfoSectionEl.classList.add("hidden");
    }

    if (artistInfoContentEl) {
        artistInfoContentEl.innerHTML = "";
    }
}


// ============================================================
// GRID
// ============================================================

function renderGrid(artworkList) {
    const grid = document.getElementById("grid");

    if (!grid) {
        return;
    }

    showGridLoading();
    grid.innerHTML = "";

    const groups = artworkList || [];

    if (!groups.length) {
        hideGridLoading();
        return;
    }

    let loaded = 0;
    let revealed = 0;
    const total = groups.length;

    function imageFinished() {
        loaded++;

        if (loaded >= total) {
            hideGridLoading();
        }
    }

    groups.forEach(group => {
        const wrapper = document.createElement("span");
        wrapper.className = "imageWrapper";

        const img = document.createElement("img");

        img.loading = "lazy";
        img.decoding = "async";
        img.alt = `${group.artist} artwork`;

        let imageHandled = false;
        function handleImageFinished(isLoaded) {
            if (imageHandled) {
                return;
            }

            imageHandled = true;
            if (isLoaded) {
                const stagger = Math.min(revealed++, 8) * 45;
                img.style.setProperty("--grid-image-enter-delay", `${stagger}ms`);
                img.classList.add("grid-image-loaded");
            }
            imageFinished();
        }

        img.addEventListener("load", () => handleImageFinished(true), {
            once: true
        });

        img.addEventListener("error", () => handleImageFinished(false), {
            once: true
        });

        img.src = group.image;

        // Handle images that are already cached.
        if (img.complete) {
            handleImageFinished(img.naturalWidth > 0);
        }

        wrapper.appendChild(img);

        wrapper.addEventListener("click", () => {
            openModal(group);
        });

        grid.appendChild(wrapper);
    });
}

function animatePageTitle(title) {
    if (!title) {
        return;
    }

    title.classList.remove("title-enter");
    void title.offsetWidth;
    title.classList.add("title-enter");
}


// ============================================================
// MODAL
// ============================================================

async function openModal(
    artwork
) {

    const modal =
        document.getElementById(
            "modal"
        );

    if (!modal) {
        return;
    }

    const modalContent = modal.querySelector(".artwork-modal-content");
    if (modalContent) {
        modalContent.scrollTop = 0;
    }

    // Set shard entries are slim; resolve the full artwork
    // (with cards/reprints) from the artist shard.
    if (!artwork.cards) {

        try {

            const artistArtworks =
                await getArtistArtworks(
                    artwork.artistSlug
                    || artwork.artist
                );

            artwork =
                artistArtworks.find(
                    item =>
                        item.id === artwork.id
                ) || artwork;

        } catch (error) {

            console.error(error);
        }
    }

    const sample =
        artwork.cards?.[0];


    const modalImg =
        document.getElementById(
            "modal-img"
        );

    if (modalImg) {

        modalImg.src =
            artwork.image;

        modalImg.alt =
            `${artwork.artist} artwork`;
    }


    const info =
        document.getElementById(
            "modal-info"
        );

    if (!info) {
        return;
    }


    const artist =
        findArtist(
            artwork.artist
        );


    const cards =
        artwork.cards || [];


    info.innerHTML = `

        <h3 id="modal-title">
            ${escapeHtml(
                sample?.name || artwork.artist || "Artwork"
            )}
        </h3>


        <p>

            <strong>Artist:</strong>

            ${
                artist
                ? `
                    <a
                        href="${artistUrl(
                            artist
                        )}"
                        onclick="event.preventDefault(); closeModal(); loadArtist(${JSON.stringify(artist).replace(/"/g, "&quot;")}); history.pushState({}, '', '${artistUrl(artist)}');"
                    >
                        ${escapeHtml(
                            artwork.artist
                        )}
                    </a>
                `
                : escapeHtml(
                    artwork.artist
                )
            }

        </p>


        ${
            sample?.image
                ? `
                    <div class="card-preview">
                        <img
                            class="previewImage"
                            src="${escapeHtml(sample.image)}"
                            alt="${escapeHtml(sample.name)}"
                        >
                    </div>
                `
                : `
                    <div class="card-preview">
                        <p>Card preview unavailable.</p>
                    </div>
                `
        }


        ${
            cards.length
                ? `
                    <button
                        type="button"
                        class="reprints-toggle"
                        aria-expanded="false"
                        aria-controls="artwork-reprints"
                    >
                        Show reprints (${cards.length})
                    </button>

                    <div
                        id="artwork-reprints"
                        class="reprints"
                        hidden
                    >

                        <h4>Reprints</h4>

                        ${cards.map(
                            card => {
                                const setObj = sets.find(
                                    s => s.code === card.setCode
                                );
                                const setName = setObj
                                    ? setObj.name
                                    : card.setName;

                                return `
                                    <div class="reprint">
                                        <strong>${escapeHtml(card.name)}</strong>
                                        <span>
                                            <a
                                                href="#"
                                                class="reprint-link"
                                                data-set-code="${escapeHtml(card.setCode)}"
                                                data-artwork-id="${escapeHtml(artwork.id)}"
                                                onclick="event.preventDefault(); closeModal(); loadSet('${card.setCode}');"
                                            >
                                                ${escapeHtml(setName)}
                                            </a>
                                            ${card.year ? ` (${card.year})` : ""}
                                            — ${escapeHtml(card.rarity)}
                                        </span>
                                    </div>
                                `;
                            }
                        ).join("")}

                    </div>
                `
                : ""
        }

    `;

    const reprintsToggle = info.querySelector(".reprints-toggle");
    if (reprintsToggle) {
        reprintsToggle.addEventListener("click", () => {
            const expanded = reprintsToggle.getAttribute("aria-expanded") === "true";
            reprintsToggle.setAttribute("aria-expanded", String(!expanded));
            reprintsToggle.textContent = expanded
                ? `Show reprints (${cards.length})`
                : "Hide reprints";
            info.querySelector("#artwork-reprints").hidden = expanded;
        });
    }

    if (!artworkModalBodyStyles) {
        artworkModalScrollY = window.scrollY;
        artworkModalBodyStyles = {
            position: document.body.style.position,
            top: document.body.style.top,
            width: document.body.style.width,
            overflow: document.body.style.overflow
        };
        document.body.style.position = "fixed";
        document.body.style.top = `-${artworkModalScrollY}px`;
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
    }
    modal.classList.remove(
        "hidden"
    );
}


// ============================================================
// MODAL CLOSE
// ============================================================

function closeModal() {

    const modal =
        document.getElementById(
            "modal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }

    if (artworkModalBodyStyles) {
        document.body.style.position = artworkModalBodyStyles.position;
        document.body.style.top = artworkModalBodyStyles.top;
        document.body.style.width = artworkModalBodyStyles.width;
        document.body.style.overflow = artworkModalBodyStyles.overflow;
        window.scrollTo(0, artworkModalScrollY);
        artworkModalBodyStyles = null;
    }
}


function setupModal() {

    const modal =
        document.getElementById(
            "modal"
        );

    if (!modal) {
        return;
    }

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal();
            }
        }
    );
}


// ============================================================
// ARTIST SEARCH
// ============================================================

function showArtistSearch() {

    const modal =
        document.getElementById(
            "ArtistSearchModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    const input =
        document.getElementById(
            "artist-search"
        );

    if (input) {

        input.value = "";

        renderArtistList(
            artists
        );

        setTimeout(
            () => input.focus(),
            50
        );
    }
}


function closeArtistSearch() {

    const modal =
        document.getElementById(
            "ArtistSearchModal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }

    resetSearchNavigation("artist-search", "artist-list");
    document.getElementById("search-artist")?.focus();
}

function resetSearchNavigation(inputId, listId) {

    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    if (input) {
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        input.dataset.activeOptionIndex = "-1";
    }

    if (list) {
        list.querySelectorAll('[role="option"]').forEach(option => {
            option.setAttribute("aria-selected", "false");
            option.classList.remove("search-option--active");
        });
    }
}

function refreshSearchNavigation(inputId, listId) {

    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    if (!input || !list) {
        return;
    }

    const options = list.querySelectorAll('[role="option"]');
    input.setAttribute("aria-expanded", String(options.length > 0));
    input.removeAttribute("aria-activedescendant");
    input.dataset.activeOptionIndex = "-1";

    options.forEach(option => {
        option.setAttribute("aria-selected", "false");
        option.classList.remove("search-option--active");
    });
}

function activateSearchOption(input, list, index) {

    const options = list.querySelectorAll('[role="option"]');
    if (!options.length) {
        return;
    }

    const boundedIndex = Math.max(0, Math.min(index, options.length - 1));
    const activeOption = options[boundedIndex];

    options.forEach((option, optionIndex) => {
        const isActive = optionIndex === boundedIndex;
        option.setAttribute("aria-selected", String(isActive));
        option.classList.toggle("search-option--active", isActive);
    });

    input.dataset.activeOptionIndex = String(boundedIndex);
    input.setAttribute("aria-activedescendant", activeOption.id);
    activeOption.scrollIntoView({ block: "nearest" });
}

function setupSearchKeyboard(input, list, closeSearch) {

    if (!list) {
        return;
    }

    input.dataset.activeOptionIndex = "-1";

    input.addEventListener("keydown", event => {

        const options = list.querySelectorAll('[role="option"]');
        const activeIndex = Number(input.dataset.activeOptionIndex || -1);

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();

            if (!options.length) {
                return;
            }

            const direction = event.key === "ArrowDown" ? 1 : -1;
            const nextIndex = activeIndex < 0
                ? (direction > 0 ? 0 : options.length - 1)
                : activeIndex + direction;

            activateSearchOption(input, list, nextIndex);
        } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            options[activeIndex]?.click();
        } else if (event.key === "Escape") {
            event.preventDefault();
            closeSearch();
        }
    });
}


function renderArtistList(
    list
) {

    const el =
        document.getElementById(
            "artist-list"
        );

    if (!el) {
        return;
    }

    el.innerHTML = "";

    list
        .slice()
        .sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        )
        .forEach(
            artist => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "artist-search-item";

                item.id = `artist-search-option-${el.children.length}`;
                item.setAttribute("role", "option");
                item.setAttribute("aria-selected", "false");

                item.textContent =
                    artist.name;


                item.onclick =
                    () => {

                        closeArtistSearch();

                        loadArtist(
                            artist,
                            true
                        );
                    };


                el.appendChild(
                    item
                );
            }
        );

    refreshSearchNavigation("artist-search", "artist-list");
}


// ============================================================
// SEARCH INPUT
// ============================================================

function setupArtistSearch() {

    const input =
        document.getElementById(
            "artist-search"
        );

    if (!input) {
        return;
    }

    const list = document.getElementById("artist-list");
    setupSearchKeyboard(input, list, closeArtistSearch);

    input.addEventListener(
        "input",
        event => {

            const query =
                event.target.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                renderArtistList(
                    artists
                );

                return;
            }


            const filtered =
                artists.filter(
                    artist =>
                        artist.name
                            .toLowerCase()
                            .includes(query)
                );


            renderArtistList(
                filtered
            );
        }
    );
}




// ============================================================
// SET SEARCH
// ============================================================

function showSetSearch() {

    const modal =
        document.getElementById(
            "SetSearchModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    const input =
        document.getElementById(
            "set-search"
        );

    if (input) {

        input.value = "";

        renderSetList(
            sets
        );

        setTimeout(
            () => input.focus(),
            50
        );
    }
}


function closeSetSearch() {

    const modal =
        document.getElementById(
            "SetSearchModal"
        );

    if (modal) {

        modal.classList.add(
            "hidden"
        );
    }

    resetSearchNavigation("set-search", "set-list");
    document.getElementById("search-set")?.focus();
}


function renderSetList(list) {

    const el =
        document.getElementById(
            "set-list"
        );

    if (!el) {
        return;
    }

    el.innerHTML = "";

    list
        .slice()
        .sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        )
        .forEach(set => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "set-search-item";

            item.id = `set-search-option-${el.children.length}`;
            item.setAttribute("role", "option");
            item.setAttribute("aria-selected", "false");

            item.textContent =
                set.name;

            item.addEventListener(
                "click",
                () => {

                    closeSetSearch();

                    loadSet(
                        set.code,
                        true
                    );
                }
            );

            el.appendChild(
                item
            );
        });

    refreshSearchNavigation("set-search", "set-list");
}


function setupSetSearch() {

    const input =
        document.getElementById(
            "set-search"
        );

    if (!input) {
        return;
    }

    const list = document.getElementById("set-list");
    setupSearchKeyboard(input, list, closeSetSearch);

    input.addEventListener(
        "input",
        event => {

            const query =
                event.target.value
                    .trim()
                    .toLowerCase();

            if (!query) {

                renderSetList(
                    sets
                );

                return;
            }

            const filtered =
                sets.filter(
                    set =>
                        set.name
                            .toLowerCase()
                            .includes(query)

                        ||

                        set.code
                            .toLowerCase()
                            .includes(query)
                );

            renderSetList(
                filtered
            );
        }
    );
}


// ============================================================
// LOADING
// ============================================================

function showGridLoading() {

    const loading =
        document.getElementById(
            "grid-loading"
        );

    if (loading) {

        loading.classList.remove(
            "hidden"
        );
    }
}


function hideGridLoading() {

    const loading =
        document.getElementById(
            "grid-loading"
        );

    if (loading) {

        loading.classList.add(
            "hidden"
        );
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}




// ============================================================
// SEARCH BUTTONS
// ============================================================


document.getElementById("search-artist")?.addEventListener(
        "click",
        showArtistSearch
    );

document.getElementById("search-set")?.addEventListener(
        "click",
        showSetSearch
    );

document.getElementById("random-artist")?.addEventListener(
        "click",
        () => loadRandomArtist(true)
    );

document.getElementById("random-set")?.addEventListener(
        "click",
        loadRandomSet
    );

document.getElementById("home-random-artist")?.addEventListener(
    "click", () => loadRandomArtist(true)
);
document.getElementById("home-random-set")?.addEventListener(
    "click", loadRandomSet
);
document.getElementById("home-link")?.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(window.location.pathname);
});
document.querySelector(".home-about-link")?.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(aboutUrl());
});

artistInfoBtnEl?.addEventListener(
    "click",
    event => {
        event.preventDefault();
        openArtistInfoModal();
    }
);

artistInfoModalEl?.addEventListener(
    "click",
    event => {
        if (event.target === artistInfoModalEl) {
            closeArtistInfoModal();
        }
    }
);




// ============================================================
// INITIALIZE
// ============================================================

function setupHeaderScroll() {

    const headerEl = document.querySelector("header");
    if (!headerEl) return;

    const updateHeaderHeight = () => {
        document.documentElement.style.setProperty("--header-height", `${headerEl.offsetHeight}px`);
    };
    updateHeaderHeight();
    new ResizeObserver(updateHeaderHeight).observe(headerEl);

    const HIDE_THRESHOLD = 12;
    const SHOW_THRESHOLD = 8;
    let lastScrollY = window.scrollY;
    let isHeaderHidden = false;
    let ticking = false;

    function update() {
        ticking = false;
        const y = Math.max(window.scrollY, 0);
        const delta = y - lastScrollY;

        if (y <= 0) {
            isHeaderHidden = false;
        } else if (delta > HIDE_THRESHOLD) {
            isHeaderHidden = true;
        } else if (delta < -SHOW_THRESHOLD) {
            isHeaderHidden = false;
        } else {
            return; // small delta: keep anchor so slow scrolls accumulate
        }

        lastScrollY = y;
        headerEl.classList.toggle("site-header--hidden", isHeaderHidden);
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
}

function init() {

    setupHeaderScroll();

    setupModal();
    setupArtistSearch();
    setupSetSearch();

    if (aboutLinkEl) {
        aboutLinkEl.addEventListener("click", event => {
            event.preventDefault();
            navigate(aboutUrl());
        });
    }

    if (getRoute().type === "about") {
        showAboutPage();
    }

    loadData();
}


init();
