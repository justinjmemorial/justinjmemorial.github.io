const page = document.body.dataset.page;

function renderMessages() {
  const target = document.querySelector("[data-messages]");
  if (!target || !Array.isArray(window.__MEMORY_MESSAGES__)) {
    return;
  }

  target.innerHTML = window.__MEMORY_MESSAGES__
    .map(
      (message) => `
        <article class="message-card">
          <div class="message-meta">
            <h2 class="message-title">${message.title}</h2>
            <span class="message-author">${message.author}</span>
            <span>${message.date}</span>
          </div>
          <div class="message-content">${message.contentHtml}</div>
        </article>
      `
    )
    .join("");
}

function renderVideos() {
  const target = document.querySelector("[data-videos]");
  if (!target || !Array.isArray(window.__MEMORY_VIDEOS__)) {
    return;
  }

  target.innerHTML = window.__MEMORY_VIDEOS__
    .map(
      (video) => `
        <article class="video-card">
          <div class="video-meta">
            <h2 class="video-title">${video.title}</h2>
            <span>${video.source}</span>
            <span>${video.year}</span>
          </div>
          <a class="video-link" href="${video.url}" target="_blank" rel="noreferrer">查看外链</a>
        </article>
      `
    )
    .join("");
}

function renderGallery() {
  const target = document.querySelector("[data-gallery]");
  const dialog = document.querySelector("[data-lightbox]");
  if (!target || !dialog || !Array.isArray(window.__MEMORY_GALLERY__)) {
    return;
  }

  const allEntries = [];

  target.innerHTML = window.__MEMORY_GALLERY__
    .map((section) => {
      const cards = section.entries
        .map((entry) => {
          const index = allEntries.push(entry) - 1;
          return `
            <button class="gallery-card" type="button" data-lightbox-index="${index}">
              <img src="${entry.image}" alt="${entry.title}" loading="lazy" />
              <span>${entry.title}</span>
            </button>
          `;
        })
        .join("");

      return `
        <section class="gallery-section" id="${section.slug}">
          <div class="section-head">
            <h2 class="section-title">${section.title}</h2>
            <div class="section-copy">${section.description}</div>
          </div>
          <div class="gallery-grid">${cards}</div>
        </section>
      `;
    })
    .join("");

  const image = dialog.querySelector("img");
  const title = dialog.querySelector("[data-lightbox-title]");
  const close = dialog.querySelector("[data-lightbox-close]");

  target.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-lightbox-index]");
    if (!trigger) {
      return;
    }

    const entry = allEntries[Number(trigger.dataset.lightboxIndex)];
    if (!entry) {
      return;
    }

    image.src = entry.image;
    image.alt = entry.title;
    title.textContent = `${entry.title} · ${entry.caption}`;
    dialog.showModal();
  });

  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

if (page === "wishes") {
  renderMessages();
}

if (page === "videos") {
  renderVideos();
}

if (page === "gallery") {
  renderGallery();
}
