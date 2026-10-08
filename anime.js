let anime = [];
let searchController = null;
const API_URL = "https://graphql.anilist.co";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".anime__search--input");
  const searchButton = document.querySelector(".anime__search--btn");
  const ratingSlider = document.querySelector(".anime__filter--range");

  searchButton.addEventListener("click", searchAnime);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchAnime();
    }
  });

  ratingSlider.addEventListener("input", filterAnime);
  renderAnime();
});

async function renderAnime(search = "") {
  const animeWrapper = document.querySelector(".anime");
  if (searchController) {
    searchController.abort();
  }

  searchController = new AbortController();
  const controller = searchController;
  animeWrapper.classList.add("anime__loading");
  animeWrapper.innerHTML = `<i class="fa-solid fa-yin-yang anime__loading--spinner"></i>`;

  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 24) {
        media(
          type: ANIME
          search: $search
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          id
          title {
            english
            romaji
          }
          coverImage {
            extraLarge
            large
          }
          averageScore
          description(asHtml: false)
          genres
        }
      }
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: {
          search: search || null,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    anime = data.data.Page.media;
    animeWrapper.classList.remove("anime__loading");
    filterAnime();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Failed to fetch anime:", error);
    animeWrapper.classList.remove("anime__loading");

    animeWrapper.innerHTML = `<p class="anime__message">Unable to load anime. Please try again.</p>`;
  }
}

function searchAnime() {
  const searchInput = document.querySelector(".anime__search--input");
  const search = searchInput.value.trim();
  renderAnime(search);
}

function filterAnime() {
  const ratingSlider = document.querySelector(".anime__filter--range");
  const ratingText = document.querySelector(".anime__filter--title .orange");
  const minRating = Number(ratingSlider.value);

  ratingText.textContent = `${minRating.toFixed(1)} to 10`;
  const filteredAnime = anime.filter((show) => {
    if (show.averageScore === null) {
      return minRating === 0;
    }

    const rating = show.averageScore / 10;
    return rating >= minRating;
  });

  displayAnime(filteredAnime);
}

function displayAnime(animeList) {
  const animeWrapper = document.querySelector(".anime");
  if (animeList.length === 0) {
    animeWrapper.innerHTML = ` <p class="anime__message">No anime found.</p>`;
    return;
  }

  animeWrapper.innerHTML = "";
  animeList.forEach((show) => {
    const card = document.createElement("div");
    card.className = "anime__card";

    const container = document.createElement("div");
    container.className = "anime__card--container";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "anime__img--wrapper";

    const image = document.createElement("img");
    image.className = "anime__img";
    image.src = show.coverImage?.extraLarge || show.coverImage?.large || "";
    image.alt = show.title.english || show.title.romaji;
    image.loading = "lazy";

    imageWrapper.appendChild(image);

    const body = document.createElement("div");
    body.className = "anime__card--body";

    const title = document.createElement("h3");
    title.className = "anime__title";
    title.textContent = show.title.english || show.title.romaji;

    const ratings = document.createElement("div");
    ratings.className = "anime__ratings";

    const star = document.createElement("i");
    star.className = "fa-solid fa-star";

    const score = document.createElement("span");
    score.textContent =
      show.averageScore !== null
        ? `${(show.averageScore / 10).toFixed(1)} / 10`
        : "Not rated";

    ratings.append(star, score);
    const description = document.createElement("p");
    description.className = "anime__description";

    const temp = document.createElement("div");
    temp.innerHTML = show.description || "";
    description.textContent = temp.textContent || "No description available.";

    body.append(title, ratings, description);
    container.append(imageWrapper, body);
    card.appendChild(container);

    animeWrapper.appendChild(card);
  });
}
