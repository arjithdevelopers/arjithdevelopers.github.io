/* =====================================================================
   Arjith Property Developers — interactions, analytics & lead capture
   ===================================================================== */
(function () {
  "use strict";

  /* ---- GA4 safe event helper (no-ops if gtag not loaded/blocked) ---- */
  function track(name, params) {
    try { if (typeof window.gtag === "function") window.gtag("event", name, params || {}); }
    catch (e) { /* never let analytics break the page */ }
  }
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------- footer year ----------------------------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* --------------------------- header scroll state --------------------------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 10); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------ mobile menu ------------------------------ */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = false;                 // allow CSS class to govern visibility
    menu.classList.toggle("is-open", open);
    if (!open) { setTimeout(function () { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 0); }
  }
  if (toggle && menu) {
    setMenu(false);
    toggle.addEventListener("click", function () { setMenu(toggle.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1040) setMenu(false); });
  }

  /* --------------------------- scroll reveal (safe) --------------------------- */
  /* Hidden state is gated on .reveal-ready, which we add ONLY when we can
     observe — so content is never hidden if this script fails to run. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reveals.length && "IntersectionObserver" in window && !prefersReduced) {
    document.documentElement.classList.add("reveal-ready");
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ------------------------ per-project interest (GA4) ------------------------ */
  var tracked = document.querySelectorAll("[data-project-track]");
  if (tracked.length && "IntersectionObserver" in window) {
    var seen = {};
    var viewObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, name = el.getAttribute("data-project");
        if (name && !seen[name]) {
          seen[name] = true;
          track("view_project", { project_name: name, project_status: el.getAttribute("data-status") || "" });
        }
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(tracked, function (el) { viewObs.observe(el); });
  }

  /* ----------------------- WhatsApp / Call click events ----------------------- */
  document.addEventListener("click", function (e) {
    var wa = e.target.closest("[data-wa]");
    if (wa) track("cta_whatsapp_click", { project_name: wa.getAttribute("data-project") || "General", location: wa.dataset.project || "" });
    var call = e.target.closest("[data-call]");
    if (call) track("cta_call_click", { project_name: call.getAttribute("data-project") || "General" });
  });

  /* --------------------------- enquiry pre-fill --------------------------- */
  var projectSelect = document.getElementById("f-project");
  var nameInput = document.getElementById("f-name");
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-enquire]");
    if (!trigger) return;
    var wanted = trigger.getAttribute("data-enquire");
    if (wanted && projectSelect) {
      Array.prototype.forEach.call(projectSelect.options, function (opt) {
        if (opt.text.toLowerCase().indexOf(wanted.toLowerCase()) === 0) projectSelect.value = opt.value;
      });
      track("select_project", { project_name: wanted });
    }
    if (nameInput) setTimeout(function () { try { nameInput.focus({ preventScroll: true }); } catch (x) {} }, 600);
  });

  /* ------------------------------- lightbox ------------------------------- */
  var lb = document.querySelector("[data-lightbox]");
  var lbImg = document.querySelector("[data-lightbox-img]");
  var lbCap = document.querySelector("[data-lightbox-cap]");
  var lbClose = document.querySelector("[data-lightbox-close]");
  function openLightbox(src, alt, cap, project) {
    if (!lb || !lbImg) return;
    lbImg.src = src; lbImg.alt = alt || cap || "Project image";
    if (lbCap) lbCap.textContent = cap || "";
    if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    track("open_gallery", { project_name: project || cap || "" });
  }
  function closeLightbox() { if (!lb) return; if (typeof lb.close === "function") lb.close(); else lb.removeAttribute("open"); }
  if (lb) {
    document.querySelectorAll("[data-gallery]").forEach(function (el) {
      // make non-button triggers (e.g. the hero <figure>) keyboard-accessible
      if (el.tagName !== "BUTTON") { el.setAttribute("role", "button"); el.tabIndex = 0; }
      var fire = function () {
        var owner = el.closest("[data-project]");
        openLightbox(el.getAttribute("data-full"), (el.querySelector("img") || {}).alt, el.getAttribute("data-caption"), owner && owner.getAttribute("data-project"));
      };
      el.addEventListener("click", fire);
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } });
    });
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); }); // click backdrop
    lb.addEventListener("close", function () { if (lbImg) lbImg.src = ""; });
  }

  /* ------------------------- enquiry form (Web3Forms) ------------------------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var statusEl = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector("[data-submit]");
    var started = false;
    form.addEventListener("focusin", function () {
      if (started) return; started = true;
      track("enquiry_form_start", { project_name: projectSelect ? projectSelect.value : "" });
    });

    function setStatus(msg, kind) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.classList.remove("is-ok", "is-err");
      if (kind) statusEl.classList.add(kind);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.botcheck && form.botcheck.checked) return;            // honeypot tripped
      if (!form.reportValidity()) return;                            // native validation

      var data = Object.fromEntries(new FormData(form).entries());
      var key = data.access_key || "";
      var project = data.project || "";

      if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = "Sending…"; }
      setStatus("");

      // If the access key hasn't been set yet, fail gracefully to WhatsApp/call.
      if (!key || key.indexOf("YOUR_") === 0) {
        setStatus("Form isn't connected yet — please WhatsApp or call us and we'll respond right away.", "is-err");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || "Send enquiry"; }
        track("enquiry_submit", { project_name: project, transport: "unconfigured" });
        return;
      }

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.success) {
            setStatus("Thank you — your enquiry has reached us. We'll be in touch shortly.", "is-ok");
            track("enquiry_submit", { project_name: project, transport: "web3forms" });
            form.reset();
          } else {
            setStatus("Sorry, that didn't go through. Please WhatsApp or call us — we'll respond right away.", "is-err");
          }
        })
        .catch(function () {
          setStatus("Network error. Please WhatsApp or call us and we'll respond right away.", "is-err");
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || "Send enquiry"; }
        });
    });
  }

  /* ----------------------------- project filter ----------------------------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var projects = document.querySelectorAll(".proj[data-loc]");
  if (chips.length && projects.length) {
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-selected", String(on));
        });
        Array.prototype.forEach.call(projects, function (p) {
          p.classList.toggle("is-hidden", f !== "all" && p.getAttribute("data-loc") !== f);
        });
        track("filter_projects", { filter: f });
      });
    });
  }
})();
