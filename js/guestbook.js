/**
 * Sổ lời nhắn TIX3 — đọc/gửi qua Google Apps Script (scripts/guestbook.gs), sổ "tix3".
 * Cùng cách hiển thị với phần "Lời chúc" của thiệp cưới (nhánh doanh-luyen):
 * lời nhắn thành thiệp nhỏ bay lên trong khung, lần lượt theo làn, lặp lại.
 * Chỉ hiện và cho gửi khi script trả về đúng sổ tix3.
 */
(() => {
  const GUESTBOOK_URL =
    "https://script.google.com/macros/s/AKfycbxXsm3MP-BT5DhXkPrrADvfqhKBt4tMNXfrl_etVDLKcpe3S33ot00J_3xs528L9KYs/exec";
  const BOOK = "tix3";
  const AVATAR_SRC = "images/avatar-96.webp";
  const MAX_MSG = 300;
  const STATIC_LIMIT = 12; // giảm chuyển động: số lời nhắn hiện trong lưới tĩnh
  const RELOAD_MS = 60000;
  const BAD_WORDS = ["địt", "đụ", "lồn", "buồi", "cặc", "đéo", "đĩ", "đm", "dm", "dcm", "đcm", "vcl", "vkl", "vl", "cc", "clm", "cl", "cmm", "dmm", "đmm", "fuck", "shit", "bitch"];
  const TEXT = {
    loading: "Đang tải lời nhắn…",
    notReady: "Sổ lời nhắn đang được chuẩn bị, bạn quay lại sau ít phút nhé.",
    loadFail: "Chưa tải được lời nhắn. Bạn kiểm tra mạng rồi tải lại trang nhé.",
    missing: "Bạn nhập tên và lời nhắn giúp nhé.",
    bad: "Lời nhắn có từ chưa phù hợp, bạn sửa lại giúp nhé.",
    slow: "Bạn vừa gửi rồi, đợi một chút rồi gửi tiếp nhé.",
    sending: "Đang gửi…",
    sent: "Đã gửi lời nhắn. Cảm ơn bạn!",
    sendFail: "Chưa gửi được, bạn thử lại sau ít phút nhé.",
    offline: "Chưa gửi được, bạn kiểm tra mạng rồi thử lại nhé.",
  };

  const stage = document.getElementById("wishStage");
  const empty = document.getElementById("wishEmpty");
  const form = document.getElementById("wishForm");
  const status = document.getElementById("wishStatus");
  const send = document.getElementById("wishSend");
  const left = document.getElementById("wishLeft");
  if (!stage || !form) return;
  const msgEl = form.elements.msg;
  const nameEl = form.elements.name;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isBad = (text) =>
    text.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).some((w) => BAD_WORDS.includes(w));
  const isValidItem = (it) =>
    it && typeof it.name === "string" && typeof it.msg === "string" && it.name !== "" && it.msg !== "";

  let items = [];
  let queue = [];
  let timer = null;
  let visible = false;
  let lane = 0;
  let isReady = false; // sổ tix3 đã sẵn sàng nhận lời nhắn

  const lanes = () => (innerWidth < 600 ? 2 : innerWidth < 1100 ? 3 : 4);

  function makeCard(it, mine) {
    const card = document.createElement("figure");
    card.className = "wish" + (mine ? " is-mine" : "");
    const quote = document.createElement("blockquote");
    quote.textContent = it.msg; // textContent: không chèn HTML từ lời nhắn
    const caption = document.createElement("figcaption");
    const avatar = document.createElement("img");
    avatar.className = "wish__avatar";
    avatar.src = AVATAR_SRC;
    avatar.width = 28;
    avatar.height = 28;
    avatar.alt = "";
    avatar.decoding = "async";
    const name = document.createElement("span");
    name.textContent = it.name;
    caption.append(avatar, name);
    card.append(caption, quote); // tên + avatar ở trên, lời nhắn bên dưới
    return card;
  }

  function spawn(it, mine = false) {
    if (!it) return;
    const n = lanes();
    const k = lane++ % n;
    const card = makeCard(it, mine);
    card.style.setProperty("--x", `${((k + 0.5) / n) * 100}%`);
    card.style.setProperty("--sway", `${(k % 2 ? 1 : -1) * (8 + Math.random() * 14)}px`);
    card.style.setProperty("--tilt", `${(Math.random() * 4 - 2).toFixed(1)}deg`);
    card.style.setProperty("--dur", `${(15 + Math.random() * 5).toFixed(1)}s`);
    card.style.setProperty("--h", `${stage.clientHeight}px`);
    card.addEventListener("animationend", () => card.remove());
    stage.appendChild(card);
  }

  function nextFromQueue() {
    if (!items.length) return;
    if (!queue.length) queue = [...items].sort(() => Math.random() - 0.5);
    spawn(queue.shift());
  }

  function start() {
    if (timer || !items.length || reduceMotion) return;
    nextFromQueue();
    timer = setInterval(nextFromQueue, innerWidth < 600 ? 3600 : 2600);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function renderStatic() {
    stage.classList.add("is-static");
    stage.querySelectorAll(".wish").forEach((x) => x.remove());
    [...items].slice(-STATIC_LIMIT).reverse().forEach((it) => stage.appendChild(makeCard(it)));
  }

  function setItems(list) {
    items = list.filter((it) => isValidItem(it) && !isBad(`${it.name} ${it.msg}`));
    empty.hidden = items.length > 0;
    if (reduceMotion) renderStatic();
    else if (visible) start();
  }

  // Ô nhập luôn gõ được; chỉ nút Gửi chờ đến khi sổ sẵn sàng
  function setReady(ready, message) {
    isReady = ready;
    send.disabled = !ready;
    if (message !== undefined) status.textContent = message;
  }

  function load(isFirst) {
    if (isFirst) setReady(false, TEXT.loading);
    fetch(`${GUESTBOOK_URL}?book=${BOOK}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok || d.book !== BOOK) {
          setReady(false, TEXT.notReady); // script chưa có sổ tix3: không hiện lời chúc của sổ khác
          return;
        }
        if (isFirst) setReady(true, "");
        setItems(Array.isArray(d.items) ? d.items : []);
      })
      .catch(() => {
        if (isFirst) setReady(false, TEXT.loadFail);
      });
  }

  load(true);
  setInterval(() => {
    if (visible && isReady) load(false);
  }, RELOAD_MS);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          visible = e.isIntersecting;
          if (visible) start();
          else stop();
        }),
      { threshold: 0.15 },
    ).observe(stage);
  } else {
    visible = true;
  }

  // Cuộn mượt (trừ khi người xem chọn giảm chuyển động)
  const scrollBehavior = reduceMotion ? "auto" : "smooth";

  // Gợi ý "Gửi lời nhắn cho Bức Tường" ở cuối màn hình poster: ẩn khi poster đã cuộn khỏi phần lớn màn hình
  const cue = document.getElementById("scrollCue");
  const posterStage = document.querySelector(".stage");
  const section = document.getElementById("guestbook");
  if (cue && posterStage && section) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => cue.classList.toggle("is-hidden", e.intersectionRatio < 0.6), {
        threshold: [0, 0.6, 1],
      }).observe(posterStage);
    }
    cue.addEventListener("click", (e) => {
      e.preventDefault();
      cue.classList.add("is-hidden");
      section.scrollIntoView({ behavior: scrollBehavior, block: "start" });
    });
  }

  // "Viết lời nhắn của bạn": cuộn xuống ô nhập rồi đặt con trỏ vào ô tên
  const cta = document.querySelector(".wishes__cta");
  if (cta) {
    cta.addEventListener("click", (e) => {
      e.preventDefault();
      form.scrollIntoView({ behavior: scrollBehavior, block: "center" });
      nameEl.focus({ preventScroll: true });
    });
  }

  msgEl.addEventListener("input", () => {
    left.textContent = String(MAX_MSG - msgEl.value.length);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isReady) return; // phím Enter khi nút Gửi đang khoá
    const name = nameEl.value.trim();
    const msg = msgEl.value.trim();
    const hp = form.elements.hp.value;
    if (!name || !msg) {
      status.textContent = TEXT.missing;
      (name ? msgEl : nameEl).focus();
      return;
    }
    if (isBad(`${name} ${msg}`)) {
      status.textContent = TEXT.bad;
      msgEl.focus();
      return;
    }
    send.disabled = true;
    status.textContent = TEXT.sending;
    fetch(GUESTBOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // text/plain: không cần preflight CORS
      body: JSON.stringify({ book: BOOK, name, msg, hp }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.ok && d.book === BOOK) {
          const it = { name, msg, t: Date.now() };
          items = [...items, it];
          empty.hidden = true;
          if (reduceMotion) renderStatic();
          else {
            spawn(it, true);
            start();
          }
          form.reset();
          left.textContent = String(MAX_MSG);
          status.textContent = TEXT.sent;
          return;
        }
        status.textContent =
          d && d.error === "bad" ? TEXT.bad : d && d.error === "slow" ? TEXT.slow : TEXT.sendFail;
      })
      .catch(() => {
        status.textContent = TEXT.offline;
      })
      .finally(() => {
        send.disabled = !isReady;
      });
  });
})();
