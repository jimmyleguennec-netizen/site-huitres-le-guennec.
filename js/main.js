(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Année du pied de page ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Heure de Paris (fuseau du commerce, quel que soit le visiteur) ---------- */
  var JOURS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  function parseHoraireStr(str) {
    var m = str && str.match(/(\d{1,2})\s*h\s*(\d{2})?\s*[–-]\s*(\d{1,2})\s*h\s*(\d{2})?/);
    if (!m) return null;
    return {
      start: parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0),
      end: parseInt(m[3], 10) * 60 + (m[4] ? parseInt(m[4], 10) : 0)
    };
  }
  function getParisNow() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Paris",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var hour = parseInt(map.hour, 10) % 24;
    var minute = parseInt(map.minute, 10);
    return { day: weekdayMap[map.weekday], minutes: hour * 60 + minute };
  }

  /* ---------- Carte "Où nous trouver aujourd'hui ?" (Hero) ---------- */
  var heroMarketText = document.getElementById("hero-market-text");
  if (heroMarketText) {
    var heroMarketDot = document.getElementById("hero-market-dot");
    /* Grille hebdomadaire : un seul créneau par jour. */
    var heroCreneaux = [
      { day: 1, lieu: "Chantier", start: "8h30", end: "18h" },
      { day: 2, lieu: "Chantier", start: "8h30", end: "18h" },
      { day: 3, lieu: "Chantier", start: "8h30", end: "18h" },
      { day: 4, lieu: "Marché de Crac'h", start: "8h30", end: "13h" },
      { day: 5, lieu: "Marché de Ploërmel", start: "8h30", end: "13h" },
      { day: 6, lieu: "Marché de Rennes", start: "8h30", end: "13h" },
      { day: 0, lieu: "Marchés de Pluneret & Saint-Avé", start: "8h30", end: "13h" }
    ];
    function heureToMinutes(str) {
      var m = str.match(/(\d{1,2})h(\d{2})?/);
      return parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0);
    }
    var parisNow = getParisNow();
    var today = heroCreneaux.filter(function (c) { return c.day === parisNow.day; })[0];
    var isOpen = today && parisNow.minutes >= heureToMinutes(today.start) && parisNow.minutes < heureToMinutes(today.end);
    if (isOpen) {
      heroMarketText.textContent = "Aujourd'hui : " + today.lieu + " (ouvert jusqu'à " + today.end + ")";
      if (heroMarketDot) heroMarketDot.classList.add("is-live");
    } else {
      var next = null;
      for (var offset = 0; offset < 7 && !next; offset++) {
        var d = (parisNow.day + offset) % 7;
        var c = heroCreneaux.filter(function (item) { return item.day === d; })[0];
        if (!c) continue;
        if (offset === 0 && heureToMinutes(c.start) <= parisNow.minutes) continue;
        next = { c: c, day: d };
      }
      heroMarketText.textContent = "Aujourd'hui : Fermé";
      var heroMarketNext = document.getElementById("hero-market-next");
      if (heroMarketNext && next) {
        heroMarketNext.textContent = "Prochaine ouverture : " + next.c.lieu + " (" + JOURS_FR[next.day] + " de " + next.c.start + " à " + next.c.end + ")";
        heroMarketNext.hidden = false;
      }
      if (heroMarketDot) heroMarketDot.classList.remove("is-live");
    }
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

  /* ---------- Menu mobile (tiroir + fond assombri) ---------- */
  var nav = document.getElementById("main-nav");
  var navToggle = document.getElementById("nav-toggle");
  var navClose = document.getElementById("nav-close");
  var navOverlay = document.getElementById("nav-overlay");
  var navLinks = nav ? nav.querySelectorAll("a") : [];
  var navFocusable = nav ? nav.querySelectorAll("a, button") : [];

  function openNav() {
    nav.classList.add("is-open");
    if (navOverlay) navOverlay.classList.add("is-open");
    document.body.classList.add("nav-is-open");
    document.documentElement.classList.add("nav-is-open");
    navToggle.setAttribute("aria-expanded", "true");
    if (navClose) navClose.focus();
  }
  function closeNav() {
    nav.classList.remove("is-open");
    if (navOverlay) navOverlay.classList.remove("is-open");
    document.body.classList.remove("nav-is-open");
    document.documentElement.classList.remove("nav-is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.focus();
  }
  if (navToggle) navToggle.addEventListener("click", openNav);
  if (navClose) navClose.addEventListener("click", closeNav);
  if (navOverlay) navOverlay.addEventListener("click", closeNav);
  navLinks.forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* ---------- Menu d'appel (bouton "Appeler / Commander") ---------- */
  var callMenu = document.getElementById("call-menu");
  var callMenuToggle = document.getElementById("call-menu-toggle");
  var callMenuPanel = document.getElementById("call-menu-panel");
  function openCallMenu() {
    callMenuPanel.classList.add("is-open");
    callMenuPanel.setAttribute("aria-hidden", "false");
    callMenuToggle.setAttribute("aria-expanded", "true");
  }
  function closeCallMenu(focusToggle) {
    callMenuPanel.classList.remove("is-open");
    callMenuPanel.setAttribute("aria-hidden", "true");
    callMenuToggle.setAttribute("aria-expanded", "false");
    if (focusToggle) callMenuToggle.focus();
  }
  if (callMenu && callMenuToggle && callMenuPanel) {
    callMenuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (callMenuPanel.classList.contains("is-open")) {
        closeCallMenu(false);
      } else {
        openCallMenu();
        if (nav && nav.classList.contains("is-open")) closeNav();
      }
    });
    document.addEventListener("click", function (e) {
      if (callMenuPanel.classList.contains("is-open") && !callMenu.contains(e.target)) {
        closeCallMenu(false);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && callMenuPanel.classList.contains("is-open")) {
        closeCallMenu(true);
      }
    });
    if (navToggle) navToggle.addEventListener("click", function () { closeCallMenu(false); });
    callMenuPanel.querySelectorAll(".call-menu-link").forEach(function (link) {
      link.addEventListener("click", function () { closeCallMenu(false); });
    });
  }

  /* Echap pour fermer + piege du focus tant que le menu est ouvert */
  document.addEventListener("keydown", function (e) {
    if (!nav || !nav.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      closeNav();
      return;
    }
    if (e.key === "Tab" && navFocusable.length) {
      var first = navFocusable[0];
      var last = navFocusable[navFocusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
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
    { id: "cracH", nom: "Marché de Crac'h", jour: "Jeudi", horaire: "7 h 30 – 13 h", lat: 47.6181, lng: -3.0012, nouveau: true, note: "Nouveauté juin 2026 — Place de l'Église" },
    { id: "ploermel", nom: "Marché de Ploërmel", jour: "Vendredi", horaire: "7 h – 13 h", lat: 47.9322, lng: -2.3975, note: "Place du Marché, 56800 Ploërmel" },
    { id: "rennes", nom: "Marché de Rennes — Place des Lices", jour: "Samedi", horaire: "5 h – 13 h 30", lat: 48.1125, lng: -1.6836, note: "Place des Lices, 35000 Rennes" },
    { id: "pluneret", nom: "Marché de Pluneret", jour: "Dimanche", horaire: "7 h – 13 h", lat: 47.6742, lng: -2.9568, note: "Place de la Mairie" },
    { id: "saintave", nom: "Marché de Saint-Avé", jour: "Dimanche", horaire: "7 h – 13 h", lat: 47.6883, lng: -2.7339, note: "Place de la Mairie" }
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
    initMap("contact-map", [{ nom: "Chantier Le Guennec", jour: "", horaire: "64 Kersolard, 56950 Crac'h", lat: 47.600882594086414, lng: -3.0213585232685882, isChantier: true }]);
  }

  /* ---------- Cartes marché -> carte Leaflet (flyTo) ---------- */
  /* Action explicite et accessible (bouton reel, clavier + tactile) plutot
     qu'un clic sur toute la carte, qui contient deja un lien. */
  if (marcheMapInstance) {
    document.querySelectorAll(".btn-marche-map-focus[data-market-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-market-id");
        var marker = marcheMapInstance.markersById[id];
        if (!marker) return;
        marcheMapInstance.map.flyTo(marker.getLatLng(), 13, { duration: 0.9 });
        marker.openPopup();
      });
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

  /* ---------- Badge flottant Avis Google ---------- */
  var googleBadge = document.querySelector(".google-float-badge");
  if (googleBadge) {
    function toggleGoogleBadge() {
      if (window.scrollY > 300) {
        googleBadge.classList.add("is-visible");
      } else {
        googleBadge.classList.remove("is-visible");
      }
    }
    toggleGoogleBadge();
    window.addEventListener("scroll", toggleGoogleBadge, { passive: true });

    /* Note et nombre d'avis charges depuis data/google-reviews.json.
       Aucune valeur en dur ici : si le fichier est absent, invalide ou
       ne contient pas encore de note reelle (rating/reviews = null), le
       badge garde son etat neutre "Avis Google / Voir nos avis" deja
       present en HTML. */
    /* API Google Places (New) : cle restreinte au domaine huitres-leguennec.com.
       Resultat garde 24 h dans localStorage ; repli sur data/google-reviews.json. */
    var G_API_KEY = "AIzaSyBXrBVT5YOoRvzvZEMcCTr6Q9Zc4U2Diks";
    var PLACE_ID = "ChIJIz6FBgATEEgRqZ0kA19k9WM";
    var G_REVIEW_URL = "https://g.page/r/CamdJANfZPVjEAE/review";
    var G_QUERY = "Huîtres et coquillages Le Guennec Crac'h";
    var REVIEWS_CACHE_KEY = "google_reviews_v2";
    var PLACE_ID_KEY = "google_reviews_v2_place";
    var REVIEWS_FAIL_KEY = "google_reviews_v2_fail";
    try { ["gReviewsCache", "gPlaceId", "gReviewsFail"].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { /* ignore */ }
    var REVIEWS_TTL = 24 * 60 * 60 * 1000;
    var REVIEWS_RETRY = 60 * 60 * 1000;
    function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
    function getPlaceId(forceSearch) {
      var stored = lsGet(PLACE_ID_KEY);
      if (!forceSearch) return Promise.resolve(stored || PLACE_ID);
      return fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": G_API_KEY, "X-Goog-FieldMask": "places.id" },
        body: JSON.stringify({ textQuery: G_QUERY, languageCode: "fr" })
      }).then(function (r) { if (!r.ok) throw new Error("places search " + r.status); return r.json(); })
        .then(function (d) {
          var id = d.places && d.places[0] && d.places[0].id;
          if (!id) throw new Error("place introuvable");
          lsSet(PLACE_ID_KEY, id);
          return id;
        });
    }
    function placeDetails(id) {
      return fetch("https://places.googleapis.com/v1/places/" + encodeURIComponent(id), {
        headers: { "X-Goog-Api-Key": G_API_KEY, "X-Goog-FieldMask": "rating,userRatingCount" }
      });
    }
    function fetchFromPlaces() {
      return getPlaceId().then(placeDetails).then(function (r) {
        if (r.status === 404) {
          /* Place ID perime : on le retrouve par recherche textuelle */
          try { localStorage.removeItem(PLACE_ID_KEY); } catch (e) { /* ignore */ }
          return getPlaceId(true).then(placeDetails);
        }
        return r;
      }).then(function (r) { if (!r.ok) throw new Error("places details " + r.status); return r.json(); })
        .then(function (d) {
          if (typeof d.rating !== "number" || typeof d.userRatingCount !== "number") throw new Error("reponse incomplete");
          return { rating: d.rating, reviews: d.userRatingCount };
        });
    }
    function fetchFromJson() {
      return fetch("data/google-reviews.json", { cache: "no-store" })
        .then(function (res) { return res.ok ? res.json() : null; });
    }
    function loadReviews() {
      var cached = lsGet(REVIEWS_CACHE_KEY);
      if (cached && cached.data && Date.now() - cached.time < REVIEWS_TTL) return Promise.resolve(cached.data);
      var failedAt = lsGet(REVIEWS_FAIL_KEY);
      var apiPromise = (failedAt && Date.now() - failedAt < REVIEWS_RETRY)
        ? Promise.reject(new Error("api en pause"))
        : fetchFromPlaces();
      return apiPromise.then(function (data) {
        lsSet(REVIEWS_CACHE_KEY, { time: Date.now(), data: data });
        return data;
      }).catch(function () {
        lsSet(REVIEWS_FAIL_KEY, Date.now());
        return fetchFromJson();
      });
    }
    loadReviews()
      .then(function (data) {
        if (!data || typeof data.rating !== "number" || typeof data.reviews !== "number") return;
        var titleEl = document.getElementById("google-badge-title");
        var subEl = document.getElementById("google-badge-sub");
        if (!titleEl || !subEl) return;
        var rating = Math.max(0, Math.min(5, data.rating));
        var ratingStr = rating.toFixed(1);
        var count = data.reviews >= 10 ? (Math.floor(data.reviews / 10) * 10) + "+" : String(data.reviews);
        titleEl.textContent = "★ " + ratingStr;
        subEl.textContent = "(" + count + " avis)";
        googleBadge.href = G_REVIEW_URL;
      })
      .catch(function () { /* pas de connexion / JSON absent : etat neutre conserve */ });
  }

  /* ---------- Lightbox (galerie d'archives + coupures de presse) ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lightboxImg = document.getElementById("lightbox-img");
    var lightboxCaption = document.getElementById("lightbox-caption");
    var lightboxClose = document.getElementById("lightbox-close");
    var lastFocused = null;

    function getFocusable(container) {
      return Array.prototype.filter.call(
        container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null; }
      );
    }
    function trapTabKey(e) {
      if (e.key !== "Tab") return;
      var focusable = getFocusable(lightbox);
      if (!focusable.length) { e.preventDefault(); return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    function setBackgroundInert(state) {
      Array.prototype.forEach.call(document.body.children, function (el) {
        if (el === lightbox || el.tagName === "SCRIPT") return;
        if (state) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
      });
    }

    function openLightbox(src, alt, caption) {
      lastFocused = document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      lightboxCaption.textContent = caption || "";
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      setBackgroundInert(true);
      lightbox.addEventListener("keydown", trapTabKey);
      lightboxClose.focus();
    }
    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.body.style.overflow = "";
      setBackgroundInert(false);
      lightbox.removeEventListener("keydown", trapTabKey);
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

    /* Loupe au survol (produits, marchés, doyenne, sites d'élevage) : réutilise la même lightbox */
    document.querySelectorAll(".produit-row-media:not(.is-icon), .marche-photocard-media, .doyenne-carousel .step-carousel-slide, .site-card-media").forEach(function (el) {
      var img = el.querySelector("img");
      if (!img) return;
      el.classList.add("zoomable");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", "Agrandir la photo");
      function trigger(e) {
        e.stopPropagation();
        openLightbox(img.src, img.alt, img.alt);
      }
      el.addEventListener("click", trigger);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(e); }
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
    var parisNowPdv = getParisNow();
    var today = parisNowPdv.day;
    var nowMinutes = parisNowPdv.minutes;
    var parseHoraire = parseHoraireStr;

    var cardsInfo = Array.prototype.map.call(dayCards, function (card) {
      var d = parseInt(card.getAttribute("data-day"), 10);
      var market = marches.filter(function (m) { return m.id === card.getAttribute("data-market-id"); })[0];
      var hours = market ? parseHoraire(market.horaire) : null;
      var isToday = d === today;
      var isOpenNow = !!(isToday && hours && nowMinutes >= hours.start && nowMinutes < hours.end);
      var hasPassedToday = !!(isToday && hours && nowMinutes >= hours.end);
      var daysUntilNext = (d - today + 7) % 7;
      if (daysUntilNext === 0 && hasPassedToday) daysUntilNext = 7;
      return { card: card, market: market, hours: hours, isToday: isToday, isOpenNow: isOpenNow, daysUntilNext: daysUntilNext };
    });

    var minDistance = Math.min.apply(null, cardsInfo.map(function (c) { return c.daysUntilNext; }));

    cardsInfo.forEach(function (info) {
      var h4 = info.card.querySelector("h4");

      if (info.isOpenNow) {
        info.card.classList.add("is-today");
        var openFlag = document.createElement("span");
        openFlag.className = "today-flag is-open";
        openFlag.textContent = "Ouvert actuellement";
        h4.appendChild(openFlag);
      } else if (info.isToday && info.hours) {
        info.card.classList.add("is-today");
        var closedFlag = document.createElement("span");
        closedFlag.className = "today-flag is-closed";
        closedFlag.textContent = "Fermé actuellement";
        h4.appendChild(closedFlag);
      }

      if (!info.isOpenNow && info.daysUntilNext === minDistance) {
        var nextFlag = document.createElement("span");
        nextFlag.className = "today-flag";
        nextFlag.style.animation = "none";
        var label = info.market ? info.market.jour + (info.market.horaire ? " " + info.market.horaire : "") : "";
        nextFlag.textContent = "Prochain marché : " + label;
        h4.appendChild(nextFlag);
      }
    });
  }

  /* ---------- Mini-carrousels des étapes du savoir-faire ---------- */
  document.querySelectorAll(".step-carousel").forEach(function (carousel) {
    var track = carousel.querySelector(".step-carousel-track");
    var slides = carousel.querySelectorAll(".step-carousel-slide");
    var prevBtn = carousel.querySelector(".step-carousel-arrow.prev");
    var nextBtn = carousel.querySelector(".step-carousel-arrow.next");
    var dots = carousel.querySelectorAll(".step-carousel-dot");
    var dotsWrap = carousel.querySelector(".step-carousel-dots");
    var index = 0;

    if (slides.length <= 1) {
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (dotsWrap) dotsWrap.hidden = true;
      return;
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach(function (dot, di) { dot.classList.toggle("is-active", di === index); });
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });
    dots.forEach(function (dot, di) {
      dot.addEventListener("click", function () { goTo(di); });
    });

    goTo(0);
  });

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
