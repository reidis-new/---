/* Сайт ОКБ Сухого — логика интерфейса */

(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Тема ---------- */
  var themeToggle = $("#themeToggle");
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      themeToggle.setAttribute("aria-label", theme === "light" ? "Включить тёмную тему" : "Включить светлую тему");
    }
  }
  try {
    var saved = localStorage.getItem("sukhoi-theme");
    applyTheme(saved === "light" ? "light" : "dark");
  } catch (e) { applyTheme("dark"); }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      try { localStorage.setItem("sukhoi-theme", next); } catch (e) {}
      applyTheme(next);
    });
  }

  /* ---------- Шапка: фон при скролле + прогресс ---------- */
  var header = $("#header");
  var progress = $("#scrollProgress");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
    if (progress) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var val = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.querySelector("span").style.width = val + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  function closeNav() { if (nav) nav.classList.remove("is-open"); if (burger) burger.classList.remove("is-open"); }
  if (burger) burger.addEventListener("click", function () {
    var open = nav ? nav.classList.toggle("is-open") : false;
    burger.classList.toggle("is-open", !!open);
    burger.setAttribute("aria-expanded", nav && nav.classList.contains("is-open") ? "true" : "false");
    burger.setAttribute("aria-label", nav && nav.classList.contains("is-open") ? "Закрыть меню" : "Открыть меню");
  });
  if (nav) {
    nav.addEventListener("click", function (e) {
      if (e.target && e.target.tagName === "A") closeNav();
    });
  }

  /* ---------- Появление блоков при скролле (повторяемая анимация) ---------- */
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Счётчики ---------- */
  var counterEls = $$("[data-count]");
  function setCounterFinal(el) {
    var target = parseInt(el.getAttribute("data-count") || "0", 10) || 0;
    el.textContent = target + (el.getAttribute("data-suffix") || "");
  }
  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        counterObserver.unobserve(el);
        var target = parseInt(el.getAttribute("data-count") || "0", 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1400, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counterEls.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counterEls.forEach(setCounterFinal);
  }

  /* ---------- Текущий год ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Навигация: подсветка активного раздела ---------- */
  function currentPage() {
    var path = location.pathname.split("/").pop() || "index.html";
    return path;
  }
  function setActiveNav() {
    var page = currentPage();
    var isIndex = page === "index.html" || page === "";
    $$(".nav a, .footer__nav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var parts = href.split("#");
      var target = parts[0];
      var hash = parts[1] ? "#" + parts[1] : "";
      var active = isIndex
        ? (target === "" || target === "index.html") && (hash === "" || hash === "#top")
        : target === page && hash === "";
      a.classList.toggle("is-active", active);
    });
  }
  setActiveNav();

  /* ---------- Наверх ---------- */
  var toTop = $("#toTop");
  function onScrollTop() {
    if (!toTop) return;
    toTop.classList.toggle("is-visible", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScrollTop, { passive: true });
  onScrollTop();

  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---------- Сравнение самолётов ---------- */
  var compareA = $("#compareA");
  var compareB = $("#compareB");
  var swapBtn = $("#swapCompare");
  var cardA = $("#compareCardA");
  var cardB = $("#compareCardB");
  var summary = $("#compareSummary");

  function fillSelects() {
    if (!compareA && !compareB) return;
    AIRCRAFT.forEach(function (a) {
      [compareA, compareB].forEach(function (sel) {
        if (!sel) return;
        var opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = a.name;
        sel.appendChild(opt);
      });
    });
  }

  function renderDuel() {
    if (!cardA || !cardB || !summary) return;
    var a = AIRCRAFT.find(function (x) { return x.id === (compareA && compareA.value); }) || AIRCRAFT[0];
    var b = AIRCRAFT.find(function (x) { return x.id === (compareB && compareB.value); }) || AIRCRAFT[0];

    var winsA = 0, winsB = 0, winners = [];
    COMPARE_ATTRS.forEach(function (attr) {
      var va = a.compare ? a.compare[attr.key] : 0;
      var vb = b.compare ? b.compare[attr.key] : 0;
      var better = va > vb ? a : (vb > va ? b : null);
      if (better) {
        if (better.id === a.id) winsA++; else winsB++;
        winners.push(attr.label + ": победил " + better.code);
      }
    });

    function cardHtml(ac) {
      var rows = COMPARE_ATTRS.map(function (attr) {
        var v = ac.compare ? ac.compare[attr.key] : 0;
        return "<dt>" + attr.label + "</dt><dd>" + attr.format(v) + (attr.unit ? " " + attr.unit : "") + "</dd>";
      }).join("");
      return '<h3>' + ac.code + " <span style='color:var(--muted);font-size:14px;font-family:var(--font-body)'>— " + (ac.name.split(" ")[1] || ac.name) + "</span></h3>" +
        '<div class="compare__role">' + ac.role + "</div>" +
        '<dl>' + rows + "</dl>";
    }

    cardA.innerHTML = cardHtml(a);
    cardB.innerHTML = cardHtml(b);
    cardA.classList.toggle("compare__card--winner", winsA > winsB && winsA > 0);
    cardB.classList.toggle("compare__card--winner", winsB > winsA && winsB > 0);

    summary.textContent = "Итог сравнения: " + (winners.length ? winners.join(" · ") + "." : "Пара близка по ключевым параметрам.");
  }

  function syncSwap() {
    if (swapBtn) {
      swapBtn.addEventListener("click", function () {
        if (compareA && compareB) {
          var tmp = compareA.value; compareA.value = compareB.value; compareB.value = tmp;
          renderDuel();
        }
      });
    }
    if (compareA) compareA.addEventListener("change", renderDuel);
    if (compareB) compareB.addEventListener("change", renderDuel);
  }

  fillSelects();
  if (compareA) compareA.value = "su-27";
  if (compareB) compareB.value = "su-57";
  renderDuel();
  syncSwap();

  /* ---------- Линейка прокрутки справа (0-100) ---------- */
  (function () {
    var ruler = document.createElement('div');
    ruler.className = 'scroll-ruler';
    ruler.innerHTML =
      '<div class="scroll-ruler__marks" aria-hidden="true"></div>' +
      '<div class="scroll-ruler__thumb" role="scrollbar" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>';
    document.body.appendChild(ruler);

    var marksWrap = ruler.querySelector('.scroll-ruler__marks');
    var thumb = ruler.querySelector('.scroll-ruler__thumb');
    var h = document.documentElement;
    var dragging = false;
    var hovered = false;
    var dragStartY = 0;
    var dragStartScrollY = 0;

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function getClientY(e) {
      if (e.touches && e.touches.length) return e.touches[0].clientY;
      if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
      return e.clientY;
    }

    function scrollInstant(y) {
      var root = document.documentElement;
      var previous = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      try {
        window.scrollTo({ top: y, left: 0, behavior: "instant" });
      } catch (err) {
        window.scrollTo(0, y);
      }
      root.style.scrollBehavior = previous;
    }

    function createMarks() {
      marksWrap.innerHTML = '';
      for (var i = 0; i <= 100; i++) {
        var mark = document.createElement('div');
        mark.className = 'scroll-ruler__mark';
        mark.style.top = i + '%';
        if (i % 5 === 0) {
          mark.classList.add('label');
          mark.textContent = String(i);
        } else {
          mark.classList.add('tick');
        }
        marksWrap.appendChild(mark);
      }
    }

    function syncThumb() {
      var scrollY = window.pageYOffset || h.scrollTop;
      var maxScroll = h.scrollHeight - h.clientHeight;
      var pct = maxScroll > 0 ? scrollY / maxScroll : 0;
      thumb.style.top = (pct * 100) + '%';
      thumb.setAttribute('aria-valuenow', Math.round(pct * 100));
    }

    function updateRulerSize() {
      var scrollY = window.pageYOffset || h.scrollTop;
      if (hovered) {
        ruler.style.top = '0px';
        ruler.style.height = h.clientHeight + 'px';
      } else {
        ruler.style.top = (-scrollY) + 'px';
        ruler.style.height = h.scrollHeight + 'px';
      }
      syncThumb();
    }

    function startRulerAnimation() {
      ruler.classList.add('is-animating');
      // заставляем браузер зафиксировать стартовую геометрию до смены target-значений
      ruler.getBoundingClientRect();
    }

    function stopRulerAnimation() {
      ruler.classList.remove('is-animating');
    }

    function finishRulerAnimation(e) {
      if (e && e.propertyName !== 'height') return;
      stopRulerAnimation();
      updateRulerSize();
    }

    ruler.addEventListener('transitionend', finishRulerAnimation);

    function startDrag(e) {
      stopRulerAnimation();
      dragging = true;
      ruler.classList.add('is-dragging');
      e.preventDefault();
      e.stopPropagation();
      if (!hovered) {
        hovered = true;
        ruler.classList.add('hovered');
        updateRulerSize();
      }
      dragStartY = getClientY(e);
      dragStartScrollY = window.pageYOffset || h.scrollTop;
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      ruler.classList.remove('is-dragging');
      if (!ruler.matches(':hover')) {
        hovered = false;
        ruler.classList.remove('hovered');
        startRulerAnimation();
        updateRulerSize();
      }
    }

    function doDrag(e) {
      if (!dragging) return;
      var clientY = getClientY(e);
      if (typeof clientY !== "number") return;
      var deltaY = clientY - dragStartY;
      var maxScroll = h.scrollHeight - h.clientHeight;
      var rulerHeight = ruler.getBoundingClientRect().height || h.clientHeight;
      var scale = rulerHeight > 0 ? maxScroll / rulerHeight : 1;
      var newScrollY = dragStartScrollY + deltaY * scale;
      newScrollY = Math.max(0, Math.min(maxScroll, newScrollY));
      scrollInstant(newScrollY);
      syncThumb();
    }

    createMarks();

    thumb.addEventListener('mousedown', startDrag);
    thumb.addEventListener('touchstart', startDrag, { passive: false });

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('touchmove', function (e) {
      if (dragging) { doDrag(e); e.preventDefault(); }
    }, { passive: false });

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    window.addEventListener('scroll', updateRulerSize, { passive: true });
    window.addEventListener('resize', updateRulerSize);

    // Клик или зажатие в любом месте линейки — переход на процент и режим перетаскивания
    function beginTrackDrag(e) {
      if (dragging) return;
      if (e.type === 'mousedown' && e.button !== 0) return;
      var clientY = getClientY(e);
      if (typeof clientY !== "number") return;
      e.preventDefault();
      // сначала фиксируем линейку в её конечном (сжатом) положении,
      // чтобы ползунок встал ровно под курсор, а не в начало шкалы
      stopRulerAnimation();
      if (!hovered) {
        hovered = true;
        ruler.classList.add('hovered');
      }
      updateRulerSize();
      var rect = ruler.getBoundingClientRect();
      var pct = clamp((clientY - rect.top) / rect.height, 0, 1);
      var newScrollY = pct * (h.scrollHeight - h.clientHeight);
      scrollInstant(newScrollY);
      dragging = true;
      ruler.classList.add('is-dragging');
      dragStartY = clientY;
      dragStartScrollY = newScrollY;
      syncThumb();
    }

    ruler.addEventListener('mousedown', beginTrackDrag);
    ruler.addEventListener('touchstart', beginTrackDrag, { passive: false });

    // Наведение — линейка плавно собирается под высоту экрана, ползунок появляется
    ruler.addEventListener('mouseenter', function () {
      hovered = true;
      ruler.classList.add('hovered');
      startRulerAnimation();
      updateRulerSize();
    });
    ruler.addEventListener('mouseleave', function () {
      if (dragging) return;
      hovered = false;
      ruler.classList.remove('hovered');
      startRulerAnimation();
      updateRulerSize();
    });

    // Движение мыши над линейкой — ползунок следует за курсором (визуально)
    ruler.addEventListener('mousemove', function (e) {
      if (!hovered || dragging) return;
      var rect = ruler.getBoundingClientRect();
      var pct = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      thumb.style.top = (pct * 100) + '%';
    });

    updateRulerSize();
  })();

  window.sukhoiData = { AIRCRAFT: AIRCRAFT, COMPARE_ATTRS: COMPARE_ATTRS, getAircraft: getAircraft };
})();
