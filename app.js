let artists = [];
let artworks = [];
let sets = [];

let currentArtist = null;
let currentSet = null;
let currentCards = [];

const artistHeaderEl = document.getElementById("artist-header");
const artistNameEl = document.getElementById("artist-name");
const artistInfoBtnEl = document.getElementById("artist-info-btn");
const artistInfoModalEl = document.getElementById("artist-info-modal");
const artistInfoContentEl = document.getElementById("artist-info-content");


// ============================================================
// LOAD DATA
// ============================================================

async function loadData() {

    try {

        const [artistsRes, artworksRes, setsRes] =
            await Promise.all([
                fetch("./data/artists.json"),
                fetch("./data/artworks.json"),
                fetch("./data/sets.json")
            ]);

        if (!artistsRes.ok) {
            throw new Error("Could not load artists.json");
        }

        if (!artworksRes.ok) {
            throw new Error("Could not load artworks.json");
        }

        if (!setsRes.ok) {
            throw new Error("Could not load sets.json");
        }

        artists = await artistsRes.json();
        artworks = await artworksRes.json();
        sets = await setsRes.json();

        console.log(
            `Loaded ${artists.length} artists`
        );

        console.log(
            `Loaded ${artworks.length} artworks`
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

function loadArtist(
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

    const artistName =
        artist.name;

    const artistArtworks =
        artworks.filter(
            artwork =>
                artwork.artist
                .toLowerCase()
                === artistName.toLowerCase()
        );

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
    if (!artistHeaderEl || !artistNameEl) {
        return;
    }

    artistHeaderEl.classList.remove("hidden");
    artistNameEl.textContent = artist.name;

    if (!artistInfoContentEl) {
        return;
    }

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

function loadSet(
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

    const setArtworks =
        artworks.filter(
            artwork =>
                artwork.cards?.some(
                    card =>
                        card.setCode
                        .toLowerCase()
                        ===
                        set.code.toLowerCase()
                )
        );

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

    if (artistHeaderEl) {
        artistHeaderEl.classList.add("hidden");
    }

    if (artistNameEl) {
        artistNameEl.textContent = "";
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

function openModal(
    artwork
) {

    const modal =
        document.getElementById(
            "modal"
        );

    if (!modal) {
        return;
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

function loadSetWithArtwork(setCode, artworkId) {
    
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
    
    // Filter artworks to only show the specific artwork in this set
    const filteredArtworks = artworks.filter(
        artwork => 
            artwork.id === artworkId && 
            artwork.cards?.some(
                card => card.setCode.toLowerCase() === set.code.toLowerCase()
            )
    );
    
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
