(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Année du pied de page ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- En-tête : fond au scroll ---------- */
  var header = document.getElementById("site-header");
  function onScroll() {
    if (window.scrollY > 24) {
      header.classList.add("is-scrolled");
    } else {
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
    { nom: "Chantier de Crac'h", jour: "Lundi – Jeudi", horaire: "8h30 – 18h", lat: 47.6014, lng: -2.9528, note: "64 Hameau de Kersolard" },
    { nom: "Marché de Crac'h", jour: "Jeudi", horaire: "7h – 13h", lat: 47.6014, lng: -2.9528, nouveau: true, note: "Nouveauté juin 2026" },
    { nom: "Marché de Ploërmel", jour: "Vendredi", horaire: "7h – 13h", lat: 47.9333, lng: -2.4000 },
    { nom: "Marché de Rennes — Place des Lices", jour: "Samedi", horaire: "7h – 13h", lat: 48.1119, lng: -1.6832 },
    { nom: "Marché de Pluneret", jour: "Dimanche", horaire: "7h – 13h", lat: 47.6497, lng: -2.9308 },
    { nom: "Marché de Saint-Avé", jour: "Dimanche", horaire: "7h – 13h", lat: 47.6733, lng: -2.7594 }
  ];

  function pinIcon(isNew) {
    return L.divIcon({
      className: "",
      html:
        '<span class="map-pin' + (isNew ? " is-new" : "") + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' +
        "</span>",
      iconSize: [34, 34],
      iconAnchor: [17, 32],
      popupAnchor: [0, -30]
    });
  }

  function initMap(elId, points, zoomLevel) {
    var el = document.getElementById(elId);
    if (!el || typeof L === "undefined") return;
    el.innerHTML = "";

    var bounds = L.latLngBounds(points.map(function (p) { return [p.lat, p.lng]; }));
    var map = L.map(elId, {
      scrollWheelZoom: false,
      zoomControl: true
    }).fitBounds(bounds, { padding: [36, 36] });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18
    }).addTo(map);

    points.forEach(function (p) {
      var marker = L.marker([p.lat, p.lng], { icon: pinIcon(p.nouveau) }).addTo(map);
      marker.bindPopup(
        "<strong>" + p.nom + "</strong><br>" +
        p.jour + " — " + p.horaire +
        (p.note ? "<br><em>" + p.note + "</em>" : "")
      );
    });

    map.on("focus", function () { map.scrollWheelZoom.enable(); });
    map.on("blur", function () { map.scrollWheelZoom.disable(); });
  }

  if (document.getElementById("marche-map")) {
    initMap("marche-map", marches);
  }
  if (document.getElementById("contact-map")) {
    initMap("contact-map", [{ nom: "Chantier Le Guennec", jour: "", horaire: "64 Hameau de Kersolard, Crac'h", lat: 47.6014, lng: -2.9528 }]);
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
