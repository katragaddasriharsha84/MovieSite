/* 
  Simple Movie Review Hub logic.
  - Stores reviews in an array.
  - Also syncs them with localStorage so they stay after refresh.
  - Renders reviews into the page dynamically.
*/

/* Grab references to important DOM elements */
const searchInput = document.getElementById("movie-search-input");
const searchButton = document.getElementById("movie-search-button");
const searchStatus = document.getElementById("movie-search-status");

const movieDetailsModal = document.getElementById("movie-details-modal");
const movieDetailsCloseBtn = document.getElementById("movie-details-close");
const movieDetailsPoster = document.getElementById("movie-details-poster");
const movieDetailsMeta = document.getElementById("movie-details-meta");

/* -------------------- OMDb API -------------------- */
// Paste your OMDb API key here (or from your course instructions).
// Note: this is client-side JS, so do not use a paid/private key for real production apps.
const OMDB_API_KEY = "a10e4b13";
const OMDB_BASE_URL = "https://www.omdbapi.com/";

// Ensure modal stays closed on initial page load.
if (movieDetailsModal) {
  movieDetailsModal.hidden = true;
  movieDetailsModal.setAttribute("aria-hidden", "true");
}

function openMovieDetailsModal() {
  if (!movieDetailsModal) return;
  movieDetailsModal.hidden = false;
  movieDetailsModal.setAttribute("aria-hidden", "false");
}

function closeMovieDetailsModal() {
  if (!movieDetailsModal) return;
  movieDetailsModal.hidden = true;
  movieDetailsModal.setAttribute("aria-hidden", "true");
}

if (movieDetailsCloseBtn) {
  movieDetailsCloseBtn.addEventListener("click", closeMovieDetailsModal);
}

if (movieDetailsModal) {
  movieDetailsModal.addEventListener("click", (e) => {
    // Close only when the overlay background is clicked.
    if (e.target === movieDetailsModal) closeMovieDetailsModal();
  });
}

function getPosterOrPlaceholder(posterUrl, title) {
  if (posterUrl && posterUrl !== "N/A") return posterUrl;
  const safeTitle = encodeURIComponent(title || "Movie");
  return `https://via.placeholder.com/300x450?text=${safeTitle}`;
}

async function fetchOmdbMovieByTitle(title) {
  const resp = await fetch(
    `${OMDB_BASE_URL}?t=${encodeURIComponent(title)}&apikey=${encodeURIComponent(
      OMDB_API_KEY
    )}&plot=short&r=json`
  );

  if (!resp.ok) {
    throw new Error(`OMDb request failed: ${resp.status}`);
  }

  const data = await resp.json();
  if (data && data.Response === "False") {
    throw new Error(data.Error || "OMDb: movie not found");
  }
  return data;
}

function renderFeaturedMovies(movies) {
  const grid = document.getElementById("featured-movies-grid");
  if (!grid) return;

  grid.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";

    const img = document.createElement("img");
    img.className = "movie-poster";
    img.src = getPosterOrPlaceholder(movie.Poster, movie.Title);
    img.alt = `${movie.Title} Poster`;
    img.addEventListener("click", () => openMovieDetails(movie));

    const info = document.createElement("div");
    info.className = "movie-info";

    const titleEl = document.createElement("h3");
    titleEl.className = "movie-title";
    titleEl.textContent = movie.Title || "Untitled";

    const ratingEl = document.createElement("p");
    ratingEl.className = "movie-rating";
    ratingEl.textContent = movie.imdbRating && movie.imdbRating !== "N/A"
      ? `⭐ ${movie.imdbRating} / 10`
      : "⭐ IMDb rating unavailable";

    const descEl = document.createElement("p");
    descEl.className = "movie-description";
    descEl.textContent = movie.Plot && movie.Plot !== "N/A"
      ? movie.Plot
      : "Plot not available.";

    info.appendChild(titleEl);
    info.appendChild(ratingEl);
    info.appendChild(descEl);

    card.appendChild(img);
    card.appendChild(info);

    grid.appendChild(card);
  });
}

async function loadFeaturedMoviesFromOmdb() {
  const grid = document.getElementById("featured-movies-grid");
  if (!grid) return;

  // Basic API key guard so the UI doesn't silently fail.
  if (!OMDB_API_KEY || OMDB_API_KEY === "PUT_YOUR_OMDB_API_KEY_HERE") {
    grid.innerHTML =
      '<p style="color:#9ca3af;font-size:0.9rem">Add your OMDb API key in <code>script.js</code> to load popular movies.</p>';
    return;
  }

  grid.innerHTML =
    '<p style="color:#9ca3af;font-size:0.9rem">Loading popular movies...</p>';

  const popularTitles = ["Inception", "Interstellar", "The Dark Knight"];

  const results = await Promise.allSettled(
    popularTitles.map((title) => fetchOmdbMovieByTitle(title))
  );

  const movies = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  if (movies.length === 0) {
    grid.innerHTML =
      '<p style="color:#9ca3af;font-size:0.9rem">Could not load movies from OMDb. Check your API key / network.</p>';
    return;
  }

  renderFeaturedMovies(movies);
}

async function fetchOmdbMovieByImdbId(imdbId) {
  const resp = await fetch(
    `${OMDB_BASE_URL}?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(
      OMDB_API_KEY
    )}&plot=short&r=json`
  );

  if (!resp.ok) {
    throw new Error(`OMDb request failed: ${resp.status}`);
  }

  const data = await resp.json();
  if (data && data.Response === "False") {
    throw new Error(data.Error || "OMDb: movie not found");
  }
  return data;
}

async function fetchOmdbMovieDetailsByImdbId(imdbId) {
  const resp = await fetch(
    `${OMDB_BASE_URL}?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(
      OMDB_API_KEY
    )}&plot=full&r=json`
  );

  if (!resp.ok) {
    throw new Error(`OMDb request failed: ${resp.status}`);
  }

  const data = await resp.json();
  if (data && data.Response === "False") {
    throw new Error(data.Error || "OMDb: movie not found");
  }
  return data;
}

function renderMovieDetails(movie) {
  if (!movieDetailsPoster || !movieDetailsMeta) return;

  const title = movie.Title || "Untitled";
  movieDetailsPoster.src = getPosterOrPlaceholder(movie.Poster, title);
  movieDetailsPoster.alt = `${title} Poster`;

  const imdbRating =
    movie.imdbRating && movie.imdbRating !== "N/A"
      ? `⭐ ${movie.imdbRating} / 10`
      : "IMDb rating unavailable";

  const year = movie.Year && movie.Year !== "N/A" ? movie.Year : "N/A";
  const rated = movie.Rated && movie.Rated !== "N/A" ? movie.Rated : "N/A";
  const runtime =
    movie.Runtime && movie.Runtime !== "N/A" ? movie.Runtime : "N/A";
  const genres = movie.Genre && movie.Genre !== "N/A" ? movie.Genre : "N/A";

  const director =
    movie.Director && movie.Director !== "N/A" ? movie.Director : "N/A";
  const actors = movie.Actors && movie.Actors !== "N/A" ? movie.Actors : "N/A";
  const language =
    movie.Language && movie.Language !== "N/A" ? movie.Language : "N/A";
  const awards = movie.Awards && movie.Awards !== "N/A" ? movie.Awards : "N/A";

  const plot =
    movie.Plot && movie.Plot !== "N/A" ? movie.Plot : "Plot not available.";

  // Build DOM nodes to avoid issues with special characters in OMDb fields.
  movieDetailsMeta.innerHTML = "";

  const titleEl = document.createElement("div");
  titleEl.className = "movie-details-title";
  titleEl.textContent = title;
  movieDetailsMeta.appendChild(titleEl);

  const addRow = (label, value) => {
    const row = document.createElement("div");
    row.className = "movie-details-row";

    const strong = document.createElement("strong");
    strong.textContent = label;
    row.appendChild(strong);

    row.appendChild(document.createTextNode(`: ${value}`));
    movieDetailsMeta.appendChild(row);
  };

  addRow("IMDb", imdbRating);
  addRow("Year", year);
  addRow("Rated", rated);
  addRow("Runtime", runtime);
  addRow("Genre", genres);
  addRow("Director", director);
  addRow("Actors", actors);
  addRow("Language", language);
  addRow("Awards", awards);

  const plotEl = document.createElement("div");
  plotEl.className = "movie-details-plot";

  const plotLabel = document.createElement("strong");
  plotLabel.textContent = "Plot";
  plotEl.appendChild(plotLabel);
  plotEl.appendChild(document.createTextNode(`: ${plot}`));

  movieDetailsMeta.appendChild(plotEl);
}

async function openMovieDetails(movie) {
  if (!movie || !movie.imdbID) return;
  openMovieDetailsModal();

  // Render fast details first, then load full plot.
  renderMovieDetails(movie);
  if (movieDetailsMeta) {
    movieDetailsMeta.innerHTML =
      '<div style="color:#9ca3af;font-size:0.95rem">Loading full details...</div>';
  }

  try {
    const details = await fetchOmdbMovieDetailsByImdbId(movie.imdbID);
    renderMovieDetails(details);
  } catch (err) {
    console.error(err);
    if (movieDetailsMeta) {
      movieDetailsMeta.innerHTML =
        '<div style="color:#9ca3af;font-size:0.95rem">Failed to load full details.</div>';
    }
  }
}

async function searchOmdbMovies(query) {
  const resp = await fetch(
    `${OMDB_BASE_URL}?s=${encodeURIComponent(query)}&apikey=${encodeURIComponent(
      OMDB_API_KEY
    )}&type=movie`
  );

  if (!resp.ok) {
    throw new Error(`OMDb request failed: ${resp.status}`);
  }

  const data = await resp.json();
  if (data && data.Response === "False") {
    throw new Error(data.Error || "OMDb: search failed");
  }

  const list = Array.isArray(data.Search) ? data.Search : [];
  const top = list.slice(0, 6);

  const results = await Promise.allSettled(
    top.map((item) => fetchOmdbMovieByImdbId(item.imdbID))
  );

  return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
}

async function handleMovieSearch() {
  const grid = document.getElementById("featured-movies-grid");
  if (!grid) return;

  if (!OMDB_API_KEY || OMDB_API_KEY === "PUT_YOUR_OMDB_API_KEY_HERE") {
    grid.innerHTML =
      '<p style="color:#9ca3af;font-size:0.9rem">Add your OMDb API key in <code>script.js</code> to search movies.</p>';
    if (searchStatus) {
      searchStatus.textContent = "";
    }
    return;
  }

  const q = (searchInput?.value || "").trim();
  if (!q) {
    if (searchStatus) searchStatus.textContent = "Type a movie title to search.";
    return;
  }

  if (searchStatus) searchStatus.textContent = `Searching "${q}"...`;
  grid.innerHTML =
    '<p style="color:#9ca3af;font-size:0.9rem">Loading results...</p>';

  try {
    const movies = await searchOmdbMovies(q);
    if (movies.length === 0) {
      grid.innerHTML =
        '<p style="color:#9ca3af;font-size:0.9rem">No results found.</p>';
      if (searchStatus) searchStatus.textContent = "";
      return;
    }

    renderFeaturedMovies(movies);
    if (searchStatus) searchStatus.textContent = "";
  } catch (err) {
    console.error(err);
    grid.innerHTML =
      '<p style="color:#9ca3af;font-size:0.9rem">Search failed. Check your API key / network.</p>';
    if (searchStatus) searchStatus.textContent = "";
  }
}

/* 
  When the page first loads, load featured movies and wire up search.
*/
function init() {
  loadFeaturedMoviesFromOmdb();

  // Search controls
  if (searchButton) {
    searchButton.addEventListener("click", handleMovieSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleMovieSearch();
    });
  }

  // Close movie details modal with ESC.
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMovieDetailsModal();
  });
}

init();