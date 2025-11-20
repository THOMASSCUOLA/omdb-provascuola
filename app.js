const API_KEY = "c00ac79a";
const API_URL = "https://www.omdbapi.com/";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsDiv = document.getElementById("results");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageNumber = document.getElementById("pageNumber");
const movieDetail = document.getElementById("movieDetail");
const overlay = document.getElementById("overlay");


let currentPage = 1;
let currentQuery = "";
// Funzione per tradurre un testo in italiano usando MyMemory
// Traduzione di testi lunghi suddividendo in blocchi
async function translateToItalian(text) {
  const maxLength = 450; // lunghezza massima per richiesta
  const chunks = [];

  // Suddivido il testo in blocchi
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }

  const translatedChunks = [];

  for (const chunk of chunks) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|it`);
      const data = await res.json();
      translatedChunks.push(data.responseData.translatedText || chunk);
    } catch (e) {
      console.error("Errore traduzione:", e);
      translatedChunks.push(chunk); // fallback
    }
  }

  // Riassemblo i blocchi tradotti
  return translatedChunks.join(" ");
}


// Funzione di ricerca
async function searchMovies(page = 1) {
  const query = currentQuery.trim();
  if (!query) return;

  resultsDiv.innerHTML = "<p>🔎 Caricamento...</p>";
  movieDetail.classList.add("hidden");

  try {
    const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${query}&page=${page}`);
    const data = await response.json();

    if (data.Response === "True") {
      displayResults(data.Search);
      updatePagination(page, data.totalResults);
    } else {
      resultsDiv.innerHTML = `<p>Nessun risultato trovato per "<b>${query}</b>"</p>`;
      prevPageBtn.disabled = true;
      nextPageBtn.disabled = true;
    }
  } catch (error) {
    console.error("Errore:", error);
    resultsDiv.innerHTML = "<p>Errore nel recupero dei dati.</p>";
  }
}

// Mostra i risultati
function displayResults(movies) {
  resultsDiv.classList.remove("shrink");
  resultsDiv.innerHTML = "";
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie-card");

    card.innerHTML = `
      <img class="movie-poster"
     src="${movie.Poster !== 'N/A' ? movie.Poster : 'img/NONTROVATA.png'}"
     onerror="this.onerror=null; this.src='img/NONTROVATA.png';"
     alt="${movie.Poster !== 'N/A' ? movie.Title : 'IMMAGINE NON DISPONIBILE'}">

${movie.Poster === "N/A" ? "<p class='no-image-text'>IMMAGINE NON DISPONIBILE</p>" : ""}

      <h3>${movie.Title} (${movie.Year})</h3>
    `;

    card.addEventListener("click", () => showMovieDetails(movie.imdbID));
    resultsDiv.appendChild(card);
  });
}

// Mostra i dettagli del film
async function showMovieDetails(imdbID) {
  try {
    const res = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
    const movie = await res.json();

    if (movie.Response === "True") {
      resultsDiv.classList.add("shrink");

      // 🔸 Traduce la trama in italiano prima di mostrarla
      const tramaTradotta = await translateToItalian(movie.Plot);

      movieDetail.innerHTML = `
        <button class="close-btn" onclick="closeDetail()">✖</button>
        <img class="movie-poster-large"
     src="${movie.Poster !== 'N/A' ? movie.Poster : 'img/NONTROVATA.png'}"
     onerror="this.onerror=null; this.src='img/NONTROVATA.png';"
     alt="${movie.Poster !== 'N/A' ? movie.Title : 'IMMAGINE NON DISPONIBILE'}">

${movie.Poster === "N/A" ? "<p class='no-image-text'>IMMAGINE NON DISPONIBILE</p>" : ""}

        <div class="movie-info">
          <h2>${movie.Title}</h2>
          <p><b>Anno:</b> ${movie.Year}</p>
          <p><b>Genere:</b> ${movie.Genre}</p>
          <p><b>Regista:</b> ${movie.Director}</p>
          <p><b>Attori:</b> ${movie.Actors}</p>
          <p><b>Trama:</b> ${tramaTradotta}</p>
          <p><b>Voto IMDb:</b> ${movie.imdbRating}</p>
        </div>
      `;

      movieDetail.classList.remove("hidden");
      overlay.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Errore nel caricamento dettagli:", error);
  }
}



// Chiudi il dettaglio
function closeDetail() {
  movieDetail.classList.add("hidden");
  overlay.classList.add("hidden");
  resultsDiv.classList.remove("shrink");
}
overlay.addEventListener("click", closeDetail);


// Paginazione
function updatePagination(page, totalResults) {
  currentPage = page;
  pageNumber.textContent = `Pagina ${page}`;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page * 10 >= totalResults;
}

// Eventi
searchButton.addEventListener("click", () => {
  currentQuery = searchInput.value;
  currentPage = 1;
  searchMovies(currentPage);
});

searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    currentQuery = searchInput.value;
    currentPage = 1;
    searchMovies(currentPage);
  }
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) searchMovies(currentPage - 1);
});

nextPageBtn.addEventListener("click", () => {
  searchMovies(currentPage + 1);
});
