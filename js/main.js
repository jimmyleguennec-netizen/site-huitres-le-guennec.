(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Année du pied de page ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Carte "Où nous trouver aujourd'hui ?" (Hero) ---------- */
  var heroMarketText = document.getElementById("hero-market-text");
  if (heroMarketText) {
    var heroMarketDot = document.getElementById("hero-market-dot");
    var heroMarketMessages = {
      0: { text: "Aujourd'hui : Marchés de Pluneret & Saint-Avé (7h–13h)", live: true },
      1: { text: "Prochain marché : Jeudi à Crac'h (7h–13h)", live: false },
      2: { text: "Prochain marché : Jeudi à Crac'h (7h–13h)", live: false },
      3: { text: "Prochain marché : Jeudi à Crac'h (7h–13h)", live: false },
      4: { text: "Aujourd'hui : Marché de Crac'h (7h–13h)", live: true },
      5: { text: "Aujourd'hui : Marché de Ploërmel (7h–13h)", live: true },
      6: { text: "Aujourd'hui : Marché de Rennes — Place des Lices (7h–13h)", live: true }
    };
    var todayInfo = heroMarketMessages[new Date().getDay()];
    heroMarketText.textContent = todayInfo.text;
    if (heroMarketDot) heroMarketDot.classList.toggle("is-live", todayInfo.live);
  }

  /* ---------- En-tête : fond au scroll ---------- */
  // Hysteresis (seuils différents pour activer/désactiver) pour éviter
  // que le header ne clignote quand le scroll oscille autour d'un seuil unique.
  var header = document.getElementById("site-header");
  function onScroll() {
    if (!header.classList.contains("is-scrolled") && window.scrollY > 32) {
      header.classList.add("is-scrolled");
    } else if (header.classList.contains("is-scrolled") && window.scrollY < 12) {
      header.classList.remove("is-scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var nav = document.getElementById("main-nav");
  var navToggle = document.getElementById("nav-toggle");
  var navClose = document.getElementById("nav-close");
  var navLinks = nav ? nav.querySelectorAll("a") : [];

  function openNav() {
    nav.classList.add("is-open");
    document.body.classList.add("nav-is-open");
    navToggle.setAttribute("aria-expanded", "true");
  }
  function closeNav() {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle) navToggle.addEventListener("click", openNav);
  if (navClose) navClose.addEventListener("click", closeNav);
  navLinks.forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* ---------- Révélation au défilement ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });

    // Filet de sécurité : si l'observateur ne se déclenche jamais
    // (navigateur capricieux, onglet non visible au chargement...),
    // on force l'affichage plutôt que de laisser du contenu invisible.
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }, 2500);
  }

  /* ---------- Carte des marchés (Leaflet) ---------- */
  var marches = [
    { id: "cracH", nom: "Marché de Crac'h", jour: "Jeudi", horaire: "7h – 13h", lat: 47.6181, lng: -3.0012, nouveau: true, note: "Nouveauté juin 2026 — Place de l'Église" },
    { id: "ploermel", nom: "Marché de Ploërmel", jour: "Vendredi", horaire: "7h – 13h", lat: 47.9322, lng: -2.3975, note: "Place du Marché, 56800 Ploërmel" },
    { id: "rennes", nom: "Marché de Rennes — Place des Lices", jour: "Samedi", horaire: "7h – 13h", lat: 48.1125, lng: -1.6836, note: "Place des Lices, 35000 Rennes" },
    { id: "pluneret", nom: "Marché de Pluneret", jour: "Dimanche", horaire: "7h – 13h", lat: 47.6742, lng: -2.9568, note: "Place de l'Église" },
    { id: "saintave", nom: "Marché de Saint-Avé", jour: "Dimanche", horaire: "7h – 13h", lat: 47.6883, lng: -2.7339, note: "Place de l'Église" }
  ];

  function pinIcon(isNew, isChantier) {
    var iconSvg = isChantier
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
    var cls = (isNew ? " is-new" : "") + (isChantier ? " is-chantier" : "");
    return L.divIcon({
      className: "",
      html: '<span class="map-pin' + cls + '">' + iconSvg + "</span>",
      iconSize: [34, 34],
      iconAnchor: [17, 32],
      popupAnchor: [0, -30]
    });
  }

  function initMap(elId, points, zoomLevel) {
    var el = document.getElementById(elId);
    if (!el || typeof L === "undefined") return null;
    el.innerHTML = "";

    var bounds = L.latLngBounds(points.map(function (p) { return [p.lat, p.lng]; }));
    var map = L.map(elId, {
      scrollWheelZoom: false,
      zoomControl: true
    }).fitBounds(bounds, { padding: [36, 36] });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    var markersById = {};
    points.forEach(function (p) {
      var marker = L.marker([p.lat, p.lng], { icon: pinIcon(p.nouveau, p.isChantier) }).addTo(map);
      marker.bindPopup(
        "<strong>" + p.nom + "</strong><br>" +
        p.jour + " — " + p.horaire +
        (p.note ? "<br><em>" + p.note + "</em>" : "")
      );
      if (p.id) markersById[p.id] = marker;
    });

    map.on("focus", function () { map.scrollWheelZoom.enable(); });
    map.on("blur", function () { map.scrollWheelZoom.disable(); });

    return { map: map, markersById: markersById };
  }

  var marcheMapInstance = null;
  if (document.getElementById("marche-map")) {
    marcheMapInstance = initMap("marche-map", marches);
  }
  if (document.getElementById("contact-map")) {
    initMap("contact-map", [{ nom: "Chantier Le Guennec", jour: "", horaire: "64 Hameau de Kersolard, 56950 Crac'h", lat: 47.600882594086414, lng: -3.0213585232685882, isChantier: true }]);
  }

  /* ---------- Cartes marché ↔ carte Leaflet (flyTo) ---------- */
  if (marcheMapInstance) {
    document.querySelectorAll(".marche-photocard[data-market-id]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest(".btn-marche-go-list")) return;
        var id = card.getAttribute("data-market-id");
        var marker = marcheMapInstance.markersById[id];
        if (!marker) return;
        marcheMapInstance.map.flyTo(marker.getLatLng(), 13, { duration: 0.9 });
        marker.openPopup();
      });
      card.style.cursor = "pointer";
    });
  }

  /* ---------- Retour en haut ---------- */
  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    function toggleBackToTop() {
      if (window.scrollY > 300) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    }
    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Lightbox (galerie d'archives + coupures de presse) ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lightboxImg = document.getElementById("lightbox-img");
    var lightboxCaption = document.getElementById("lightbox-caption");
    var lightboxClose = document.getElementById("lightbox-close");
    var lastFocused = null;

    function openLightbox(src, alt, caption) {
      lastFocused = document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      lightboxCaption.textContent = caption || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      lightboxClose.focus();
    }
    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll(".archive-card").forEach(function (card) {
      function trigger() {
        var img = card.querySelector("img");
        var caption = card.querySelector("figcaption");
        openLightbox(img.src, img.alt, caption ? caption.textContent : "");
      }
      card.addEventListener("click", trigger);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); }
      });
    });

    document.querySelectorAll("[data-lightbox-src]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLightbox(btn.getAttribute("data-lightbox-src"), btn.getAttribute("data-lightbox-caption") || "", btn.getAttribute("data-lightbox-caption") || "");
      });
    });

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  /* ---------- Marché du jour / à venir ---------- */
  var dayCards = document.querySelectorAll(".marche-photocard[data-day]");
  if (dayCards.length) {
    var today = new Date().getDay();
    var distances = Array.prototype.map.call(dayCards, function (card) {
      var d = parseInt(card.getAttribute("data-day"), 10);
      return (d - today + 7) % 7;
    });
    var minDistance = Math.min.apply(null, distances);
    dayCards.forEach(function (card, i) {
      var h4 = card.querySelector("h4");
      if (distances[i] === 0) {
        card.classList.add("is-today");
        var todayFlag = document.createElement("span");
        todayFlag.className = "today-flag";
        todayFlag.textContent = "Aujourd'hui";
        h4.appendChild(todayFlag);
      } else if (minDistance > 0 && distances[i] === minDistance) {
        var nextFlag = document.createElement("span");
        nextFlag.className = "today-flag";
        nextFlag.style.animation = "none";
        nextFlag.textContent = "Prochain marché";
        h4.appendChild(nextFlag);
      }
    });
  }

  /* ---------- FAQ : un seul panneau ouvert à la fois ---------- */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });
})();
