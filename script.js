(() => {
  const BOOKING_URL = "https://www.booking.com/hotel/pl/home-sweet-home-mszana-dolna.pl.html";
  const AIRBNB_URL = "https://www.airbnb.pl/rooms/1710311984842002623";

  document.querySelectorAll("img.brand-logo").forEach((logo) => {
    const hideBrokenLogo = () => { logo.hidden = true; };
    logo.addEventListener("error", hideBrokenLogo);
    if (logo.complete && !logo.naturalWidth) hideBrokenLogo();
  });

  const imageFrameSelector = ".hero-art, .page-hero-photo, .preview-photo, .neighborhood-image, .gallery-tile, .area-hero, .area-card-image, .room-photo, .area-note-photo, .lightbox figure";
  document.querySelectorAll("img:not(.brand-logo)").forEach((image) => {
    image.decoding = "async";
    const frame = image.closest(imageFrameSelector) || image.parentElement;
    if (!frame) return;
    frame.classList.add("image-frame");

    const clearFallback = () => {
      image.classList.remove("image-unavailable");
      frame.querySelectorAll(":scope > .image-fallback").forEach((fallback) => fallback.remove());
    };
    const showFallback = () => {
      if (frame.querySelector(":scope > .image-fallback")) return;
      const description = image.alt.trim() || "Zdjęcie obiektu Home Sweet Home";
      image.classList.add("image-unavailable");
      const fallback = document.createElement("span");
      fallback.className = "image-fallback";
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", `Zdjęcie niedostępne: ${description}`);
      const heading = document.createElement("strong");
      heading.textContent = "Zdjęcie niedostępne";
      const caption = document.createElement("span");
      caption.textContent = description;
      fallback.append(heading, caption);
      frame.append(fallback);
    };

    image.addEventListener("error", showFallback);
    image.addEventListener("load", clearFallback);
    if (image.getAttribute("src") && image.complete && image.naturalWidth === 0) showFallback();
  });

  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });

  const menuButton = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuButton && mainNav) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Otwórz menu" : "Zamknij menu");
      mainNav.classList.toggle("open", !isOpen);
    });
    mainNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        mainNav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Otwórz menu");
      }
    });
  }

  const form = document.querySelector("#booking-form");
  if (form) {
    const arrival = document.querySelector("#checkin");
    const departure = document.querySelector("#checkout");
    const results = document.querySelector("#booking-results");
    const message = document.querySelector("#booking-message");
    const bookingChoice = document.querySelector("#booking-choice");
    const airbnbChoice = document.querySelector("#airbnb-choice");

    const dateOnly = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const addDays = (date, amount) => {
      const copy = new Date(date);
      copy.setDate(copy.getDate() + amount);
      return copy;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    arrival.min = dateOnly(today);
    departure.min = dateOnly(addDays(today, 1));
    arrival.value = dateOnly(addDays(today, 1));
    departure.value = dateOnly(addDays(today, 2));

    arrival.addEventListener("change", () => {
      if (!arrival.value) return;
      const nextDay = new Date(`${arrival.value}T12:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      departure.min = dateOnly(nextDay);
      if (!departure.value || departure.value <= arrival.value) departure.value = dateOnly(nextDay);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const guests = document.querySelector("#guest-count").value;
      if (!arrival.value || !departure.value || departure.value <= arrival.value) {
        departure.setCustomValidity("Wybierz datę wyjazdu późniejszą niż data przyjazdu.");
        departure.reportValidity();
        departure.setCustomValidity("");
        return;
      }
      const booking = new URL(BOOKING_URL);
      booking.searchParams.set("checkin", arrival.value);
      booking.searchParams.set("checkout", departure.value);
      booking.searchParams.set("group_adults", guests);
      booking.searchParams.set("no_rooms", "1");
      bookingChoice.href = booking.toString();

      const airbnb = new URL(AIRBNB_URL);
      airbnb.searchParams.set("checkin", arrival.value);
      airbnb.searchParams.set("checkout", departure.value);
      airbnb.searchParams.set("adults", guests);
      airbnbChoice.href = airbnb.toString();

      const formatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
      const stay = `${formatter.format(new Date(`${arrival.value}T12:00:00`))}–${formatter.format(new Date(`${departure.value}T12:00:00`))}`;
      message.textContent = `Termin ${stay} · ${guests} ${Number(guests) === 1 ? "osoba" : "osoby"}. Wybierz serwis, aby przejść do rezerwacji:`;
      results.hidden = false;
      results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const photoButtons = [...document.querySelectorAll("[data-photo-index]")];
  const lightbox = document.querySelector("#lightbox");
  if (photoButtons.length && lightbox) {
    const images = photoButtons.map((button) => {
      const image = button.querySelector("img");
      return { src: image.currentSrc || image.src, alt: image.alt };
    });
    const imageView = document.querySelector("#lightbox-image");
    const caption = document.querySelector("#lightbox-caption");
    const position = document.querySelector("#lightbox-position");
    let current = 0;
    const showImage = (index) => {
      current = (index + images.length) % images.length;
      imageView.src = images[current].src;
      imageView.alt = images[current].alt;
      caption.textContent = images[current].alt;
      position.textContent = `${current + 1} / ${images.length}`;
    };
    photoButtons.forEach((button) => button.addEventListener("click", () => {
      showImage(Number(button.dataset.photoIndex));
      lightbox.showModal();
    }));
    document.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
    document.querySelector(".lightbox-prev").addEventListener("click", () => showImage(current - 1));
    document.querySelector(".lightbox-next").addEventListener("click", () => showImage(current + 1));
    lightbox.addEventListener("click", (event) => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") showImage(current - 1);
      if (event.key === "ArrowRight") showImage(current + 1);
    });
  }
})();
