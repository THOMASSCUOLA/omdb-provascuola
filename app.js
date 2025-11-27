const CHIAVE_API = "c00ac79a";
const URL_API = "https://www.omdbapi.com/";

const inputRicerca = document.getElementById("searchInput");
const bottoneRicerca = document.getElementById("searchButton");
const homeButton = document.getElementById("homeButton");

const risultatiDiv = document.getElementById("results");
const btnPaginaPrecedente = document.getElementById("prevPage");
const btnPaginaSuccessiva = document.getElementById("nextPage");
const numeroPagina = document.getElementById("pageNumber");
const dettaglioFilm = document.getElementById("movieDetail");
const sfondoOscurato = document.getElementById("overlay");

let paginaCorrente = 1;
let testoRicerca = "";

// 🟦 Funzione per tradurre in italiano la trama
async function traduciInItaliano(testo) {
  const maxLength = 450;
  const parti = [];

  for (let i = 0; i < testo.length; i += maxLength) {
    parti.push(testo.slice(i, i + maxLength));
  }

  const partiTradotte = [];

  for (const blocco of parti) {
    try {
      const risposta = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(blocco)}&langpair=en|it`
      );
      const dati = await risposta.json();
      partiTradotte.push(dati.responseData.translatedText || blocco);
    } catch (e) {
      console.error("Errore nella traduzione:", e);
      partiTradotte.push(blocco);
    }
  }

  return partiTradotte.join(" ");
}


// 🟥 Ricerca film
async function cercaFilm(pagina = 1) {
  const query = testoRicerca.trim();
  if (!query) return;

  risultatiDiv.innerHTML = "<p>🔎 Caricamento...</p>";
  dettaglioFilm.classList.add("hidden");

  try {
    const risposta = await fetch(`${URL_API}?apikey=${CHIAVE_API}&s=${query}&page=${pagina}`);
    const dati = await risposta.json();

    if (dati.Response === "True") {
      mostraRisultati(dati.Search);
      aggiornaPaginazione(pagina, dati.totalResults);
    } else {
      risultatiDiv.innerHTML = `<p>Nessun risultato trovato per "<b>${query}</b>"</p>`;
      btnPaginaPrecedente.disabled = true;
      btnPaginaSuccessiva.disabled = true;
    }
  } catch (errore) {
    console.error("Errore:", errore);
    risultatiDiv.innerHTML = "<p>Errore nel recupero dei dati.</p>";
  }
}


// 🟩 Mostra i risultati
function mostraRisultati(filmTrovati) {
  risultatiDiv.classList.remove("shrink");
  risultatiDiv.innerHTML = "";

  filmTrovati.forEach(film => {
    const scheda = document.createElement("div");
    scheda.classList.add("movie-card");

    scheda.innerHTML = `
    <div class="poster-wrapper">
      <img class="movie-poster"
           src="${film.Poster !== 'N/A' ? film.Poster : 'img/nontrovata2.jpg'}"
           alt="${film.Title}"
           onerror="this.src='img/nontrovata2.jpg'; this.closest('.poster-wrapper').querySelector('.no-image-text').style.display='block'">
  
      <p class='no-image-text' style="display: ${film.Poster === 'N/A' ? 'block' : 'none'};">
         IMMAGINE NON DISPONIBILE
      </p>
    </div>
  
    <h3>${film.Title} (${film.Year})</h3>
  `;
  

    scheda.addEventListener("click", () => mostraDettagliFilm(film.imdbID));
    risultatiDiv.appendChild(scheda);
  });
}


// 🟨 Mostra i dettagli di un film
async function mostraDettagliFilm(idIMDb) {
  try {
    const risposta = await fetch(`${URL_API}?apikey=${CHIAVE_API}&i=${idIMDb}&plot=full`);
    const film = await risposta.json();

    if (film.Response === "True") {
      risultatiDiv.classList.add("shrink");

      const tramaTradotta = await traduciInItaliano(film.Plot);

      dettaglioFilm.innerHTML = `
        <button class="close-btn" onclick="chiudiDettaglio()">✖</button>

          <div class="poster-wrapper">
    <img class="movie-poster-large"
         src="${film.Poster !== 'N/A' ? film.Poster : 'img/nontrovata2.jpg'}"
         alt="${film.Title}"
         onerror="this.src='img/nontrovata2.jpg'; this.closest('.poster-wrapper').querySelector('.no-image-text').style.display='block'">

    <p class='no-image-text' style="display: ${film.Poster === 'N/A' ? 'block' : 'none'};">
       IMMAGINE NON DISPONIBILE
    </p>
  </div>
        ${film.Poster === "N/A" ? "<p class='no-image-text'>IMMAGINE NON DISPONIBILE</p>" : ""}

        <div class="movie-info">
          <h2>${film.Title}</h2>
          <p><b>Anno:</b> ${film.Year}</p>
          <p><b>Genere:</b> ${film.Genre}</p>
          <p><b>Regista:</b> ${film.Director}</p>
          <p><b>Attori:</b> ${film.Actors}</p>
          <p><b>Trama:</b> ${tramaTradotta}</p>
          <p><b>Voto IMDb:</b> ${film.imdbRating}</p>
        </div>
      `;

      dettaglioFilm.classList.remove("hidden");
      sfondoOscurato.classList.remove("hidden");
    }
  } catch (errore) {
    console.error("Errore caricamento dettagli:", errore);
  }
}


// ❌ Chiudi dettaglio
function chiudiDettaglio() {
  dettaglioFilm.classList.add("hidden");
  sfondoOscurato.classList.add("hidden");
  risultatiDiv.classList.remove("shrink");
}

sfondoOscurato.addEventListener("click", chiudiDettaglio);


// 🔢 Gestione pagine
function aggiornaPaginazione(pagina, totaleRisultati) {
  paginaCorrente = pagina;
  numeroPagina.textContent = `Pagina ${pagina}`;
  btnPaginaPrecedente.disabled = pagina <= 1;
  btnPaginaSuccessiva.disabled = pagina * 10 >= totaleRisultati;
}
homeButton.addEventListener("click", () => {
  window.location.reload();
});

// 🖱️ Eventi
bottoneRicerca.addEventListener("click", () => {
  testoRicerca = inputRicerca.value;
  paginaCorrente = 1;
  cercaFilm(paginaCorrente);
});

inputRicerca.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    testoRicerca = inputRicerca.value;
    paginaCorrente = 1;
    cercaFilm(paginaCorrente);
  }
});

btnPaginaPrecedente.addEventListener("click", () => {
  if (paginaCorrente > 1) cercaFilm(paginaCorrente - 1);
});

btnPaginaSuccessiva.addEventListener("click", () => {
  cercaFilm(paginaCorrente + 1);
});
