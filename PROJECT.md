# MTG Artist Gallery

## Overview

MTG Artist Gallery is a visual exploration of the artists behind Magic: The Gathering.

The project is not primarily a card database. Its purpose is to bring the artists to the foreground and make it possible to explore their work across different sets, eras, styles, and artistic directions.

The gallery should encourage looking, browsing, discovering connections, and understanding how the visual identity of Magic has evolved over time.

## Core idea

The artists have always been one of the most interesting parts of Magic.

This project started from a simple desire to see their work together — not as isolated cards, but as bodies of work that span sets, years, and changing visual directions.

## Goals

### Primary goals

- Put Magic artists at the center of the experience.
- Make it easy to explore an artist's body of work.
- Show how an artist's work appears across different sets.
- Make different artistic directions within Magic visible.
- Provide another way to explore the evolution of the game.
- Create a visually focused browsing experience.
- Showcase the artists and give info about them.

### Secondary goals

- Provide useful contextual information about artists.
- Make discovering unfamiliar artists easy.
- Allow users to explore artwork without needing to know specific card names.
- Keep the interface simple and image-focused.

## Non-goals

The application is not intended to become:

- A comprehensive card database.
- A deck-building tool.
- A card price tracker.
- A rules reference.
- A replacement for Scryfall.
- A social network for artists.

Card information exists primarily to provide context for artwork.

## Current views

### Artist view

The Artist view shows:

- Artist name
- Artist artwork
- About the artist button
- Artist information modal
- Artwork modal
- Sample card information
- Artist search
- Random artist

### Set view

The Set view shows:

- Set name
- Artwork from the set
- Artwork modal
- Set search
- Random set

## Navigation

The application uses query parameters.

Artist:

`/MTGart-main/?artist=artist-slug`

Set:

`/MTGart-main/?set=set-code`

Home:

`/MTGart-main/`

No server-side routing is required.

## Data

The application uses locally generated JSON data.

Primary data sources:

- `artists.json`
- `data/artworks.json`
- `data/sets.json`

Scryfall bulk card data is processed locally to generate artwork and set data.

The browser does not make live Scryfall API requests.

## Visual principles

The application should feel like a gallery rather than a database.

Priorities:

1. Artwork
2. Artist
3. Visual exploration
4. Context
5. Card information

Avoid unnecessary UI, metadata, controls, and visual noise.

## Future direction

Potential future areas include:

- Artist timelines
- Artistic style exploration
- Better artist biographies
- Artist portraits
- Visual comparisons between sets
- Historical exploration of Magic's visual evolution
- More ways to discover artists
- Improved mobile experience