let artists = [];
let sets = [];
let artistSlugOverrides = {};

const artistCache = new Map();
const setCache = new Map();

let currentArtist = null;
let currentSet = null;
let currentCards = [];

const artistInfoSectionEl = document.getElementById("artist-info-section");
const artistInfoBtnEl = document.getElementById("artist-info-btn");
const artistInfoModalEl = document.getElementById("artist-info-modal");
const artistInfoContentEl = document.getElementById("artist-info-content");


// ============================================================
// LOAD DATA
// ============================================================

async function loadData() {

    try {

        const [artistsRes, setsRes, manifestRes] =
            await Promise.all([
                fetch("./data/artists.json"),
                fetch("./data/sets.json"),
                fetch("./data/manifest.json")
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

const BASE_PATH = "/MTGart";

function getRoute() {
    const params = new URLSearchParams(window.location.search);

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

    loadRandomArtist(false);
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
    return `${BASE_PATH}/?artist=${encodeURIComponent(slugify(artist.name))}`;
}

function setUrl(setCode) {
    return `${BASE_PATH}/?set=${encodeURIComponent(setCode)}`;
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

    // Show the artist info section (button)
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

        img.addEventListener("load", imageFinished, {
            once: true
        });

        img.addEventListener("error", imageFinished, {
            once: true
        });

        img.src = group.image;

        // Handle images that are already cached.
        if (img.complete) {
            imageFinished();
        }

        wrapper.appendChild(img);

        wrapper.addEventListener("click", () => {
            openModal(group);
        });

        grid.appendChild(wrapper);
    });
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

        <h3>
            ${escapeHtml(
                sample?.name || ""
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


        <h4>
            Reprints
        </h4>


        <div class="reprints">

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

                            <strong>
                                ${escapeHtml(
                                    card.name
                                )}
                            </strong>

                            <span>
                                <a 
                                    href="#" 
                                    class="reprint-link"
                                    data-set-code="${escapeHtml(card.setCode)}"
                                    data-artwork-id="${escapeHtml(artwork.id)}"
                                    onclick="event.preventDefault(); closeModal(); loadSetWithArtwork('${card.setCode}', '${artwork.id}');"
                                >
                                    ${escapeHtml(
                                        setName
                                    )}
                                </a>
                                ${
                                    card.year
                                    ? ` (${card.year})`
                                    : ""
                                }
                                —
                                ${escapeHtml(
                                    card.rarity
                                )}
                            </span>

                        </div>
                    `;
                }
            ).join("")}

        </div>

    `;


    modal.classList.remove(
        "hidden"
    );
}


// ============================================================
// LOAD SET WITH ARTWORK FILTER
// ============================================================

async function loadSetWithArtwork(setCode, artworkId) {
    
    const set = findSet(setCode);
    
    if (!set) {
        console.warn("Set not found:", setCode);
        return;
    }
    
    currentSet = set;
    currentArtist = null;
    
    history.pushState(
        {},
        "",
        setUrl(set.code)
    );
    
    showGridLoading();

    let filteredArtworks;

    try {

        const entries = await getSetEntries(set.code);

        // Only show the specific artwork in this set
        filteredArtworks = entries.filter(
            entry => entry.id === artworkId
        );

    } catch (error) {

        console.error(error);

        if (currentSet === set) {
            clearArtistInfo();
            showGridError("Failed to load artworks.");
        }

        return;
    }

    if (currentSet !== set) {
        return;
    }

    currentCards = filteredArtworks;

    const title = document.getElementById("title");
    if (title) {
        title.textContent = set.name;
    }
    
    clearArtistInfo();
    renderGrid(filteredArtworks);
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
}


function setupSetSearch() {

    const input =
        document.getElementById(
            "set-search"
        );

    if (!input) {
        return;
    }

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

artistInfoBtnEl?.addEventListener(
    "click",
    openArtistInfoModal
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

function init() {

    setupModal();
    setupArtistSearch();
    setupSetSearch();

    loadData();
}


init();
