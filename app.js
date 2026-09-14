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
    
    // Get all artworks for this set
    const setArtworks = artworks.filter(
        artwork =>
            artwork.cards?.some(
                card =>
                    card.setCode.toLowerCase() ===
                    set.code.toLowerCase()
            )
    );
    
    currentCards = setArtworks;
    
    const title = document.getElementById("title");
    if (title) {
        title.textContent = set.name;
    }
    
    clearArtistInfo();
    renderGrid(setArtworks);
}
