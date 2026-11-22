/* =========================================================
   프랑스로 들여다본 유럽사회 — main.js
   1) 스크롤 등장 효과 (타임라인 카드 / 찢긴 종이 / 대화)
   2) 타임라인 현재 위치 표시 (회색 → 빨간색)
   3) 유럽 지도 마커 클릭 → 카드·연결선 표시
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. 스크롤 등장 효과 ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target); // 한 번 나타나면 그대로 유지
        }
      });
    }, { rootMargin: "0px 0px -18% 0px", threshold: 0.15 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-revealed"); });
  }

  /* ---------- 1-2. 첫 화면: 사진이 종이처럼 찢기며 등장 ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var heroImgs = hero.querySelectorAll(".hero__arc, .hero__riot img");
    var pending = heroImgs.length;
    var started = false;
    var startTear = function () {
      if (started) return;
      started = true;
      hero.classList.add("is-torn");
      // 사진이 다 찢겨 나온 뒤에 인용문이 나오도록
      setTimeout(function () { hero.classList.add("tear-done"); }, 1900);
    };
    var done = function () { if (--pending <= 0) requestAnimationFrame(startTear); };
    heroImgs.forEach(function (img) {
      if (img.complete) done();
      else { img.addEventListener("load", done); img.addEventListener("error", done); }
    });
    setTimeout(startTear, 2500); // 이미지가 늦어도 2.5초 뒤에는 시작
  }

  /* ---------- 2. 타임라인: 지금 지나고 있는 날짜만 빨간색 ---------- */
  var tlItems = Array.prototype.slice.call(document.querySelectorAll(".tl-item"));
  var ticking = false;

  function updateTimeline() {
    ticking = false;
    var trigger = window.innerHeight * 0.55; // 화면 위에서 55% 지점을 기준선으로
    var active = -1;

    tlItems.forEach(function (item, i) {
      var dot = item.querySelector(".tl-dot");
      if (dot.getBoundingClientRect().top < trigger) active = i;
    });

    // 타임라인 선 끝을 완전히 지나 섹션을 벗어나면 모두 회색으로
    var line = document.querySelector(".tl__line");
    if (line && line.getBoundingClientRect().bottom < window.innerHeight * 0.2) active = -1;

    tlItems.forEach(function (item, i) {
      item.classList.toggle("is-active", i === active);
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateTimeline);
    }
  }

  if (tlItems.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateTimeline();
  }

  /* ---------- 3. 유럽 지도 ---------- */
  var markers = document.querySelectorAll(".marker");
  var desktop = window.matchMedia("(min-width: 1024px)");

  // 파동 원 3겹을 각 마커에 추가
  markers.forEach(function (m) {
    ["wave", "wave2", "wave3"].forEach(function (cls) {
      var s = document.createElement("span");
      s.className = cls;
      s.setAttribute("aria-hidden", "true");
      m.appendChild(s);
    });
  });

  function setOpen(code, open) {
    var marker = document.querySelector('.marker[data-country="' + code + '"]');
    var card = document.querySelector('[data-card="' + code + '"]');
    var line = document.querySelector('[data-line="' + code + '"]');
    if (!marker || !card) return;
    marker.classList.toggle("is-open", open);
    marker.setAttribute("aria-expanded", open ? "true" : "false");
    card.classList.toggle("is-open", open);
    if (line) line.classList.toggle("is-open", open);
  }

  markers.forEach(function (m) {
    var code = m.getAttribute("data-country");
    if (!code) return; // 카드가 없는 장식용 마커(이탈리아)

    m.addEventListener("click", function () {
      var willOpen = !m.classList.contains("is-open");

      // 모바일: 카드가 지도 아래 한 자리에 나오므로 한 번에 하나만
      if (!desktop.matches) {
        markers.forEach(function (other) {
          var c = other.getAttribute("data-country");
          if (c && c !== code) setOpen(c, false);
        });
      }

      setOpen(code, willOpen);

      // 모바일에서는 열린 카드가 보이도록 살짝 스크롤
      if (willOpen && !desktop.matches) {
        var card = document.querySelector('[data-card="' + code + '"]');
        var rect = card.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
          card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });
  });

  // 화면 크기가 모바일 ↔ 데스크탑으로 바뀌면 열린 카드 정리
  function onModeChange() {
    if (desktop.matches) return;
    var opened = document.querySelectorAll(".marker.is-open");
    for (var i = 0; i < opened.length - 1; i++) {
      setOpen(opened[i].getAttribute("data-country"), false);
    }
  }
  if (desktop.addEventListener) desktop.addEventListener("change", onModeChange);
})();
