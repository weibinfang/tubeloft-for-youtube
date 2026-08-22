// VideoDeck — watch history popup.
// Fetches youtube.com/feed/history with the browser's YouTube cookies
// (granted by host_permissions), parses the embedded ytInitialData JSON via a
// structure-agnostic recursive walk (immune to YouTube layout changes), and
// pages deeper items through the innertube browse API continuation.

const HISTORY_URL = "https://www.youtube.com/feed/history";

const els = {
  list: document.getElementById("vd-list"),
  state: document.getElementById("vd-state"),
  count: document.getElementById("vd-count"),
  moreWrap: document.getElementById("vd-more-wrap"),
  more: document.getElementById("vd-more"),
  refresh: document.getElementById("vd-refresh"),
  search: document.getElementById("vd-search-input"),
  avatar: document.getElementById("vd-avatar"),
  account: document.getElementById("vd-account"),
  fallbackDot: document.getElementById("vd-fallback-dot")
};

const state = {
  items: [],
  seen: new Set(),
  continuation: null,
  apiKey: "",
  clientVersion: "2.20240101.00.00",
  query: "",
  loading: false,
  signedOut: false,
  account: { name: "", avatar: "", email: "" }
};

/* ── structure-agnostic JSON walkers ─────────────────────── */

const collectVideoRenderers = (node, out) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collectVideoRenderers(n, out);
    return;
  }
  if (node.videoRenderer && node.videoRenderer.videoId) out.push(node.videoRenderer);
  // 2025+ view-model variant (lockupViewModel) as a fallback shape
  if (node.lockupViewModel && node.lockupViewModel.contentId && !node.lockupViewModel.__vdDone) {
    out.push({ __lockup: node.lockupViewModel });
  }
  for (const k of Object.keys(node)) collectVideoRenderers(node[k], out);
};

const findContinuationToken = (node) => {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const t = findContinuationToken(n);
      if (t) return t;
    }
    return null;
  }
  const token =
    (node.continuationItemRenderer && node.continuationItemRenderer.continuationEndpoint &&
      node.continuationItemRenderer.continuationEndpoint.continuationCommand &&
      node.continuationItemRenderer.continuationEndpoint.continuationCommand.token) ||
    (node.continuationEndpoint && node.continuationEndpoint.continuationCommand &&
      node.continuationEndpoint.continuationCommand.token) ||
    null;
  if (token) return token;
  for (const k of Object.keys(node)) {
    const t = findContinuationToken(node[k]);
    if (t) return t;
  }
  return null;
};

const findFirstByKey = (node, key) => {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findFirstByKey(n, key);
      if (r) return r;
    }
    return null;
  }
  if (node[key]) return node[key];
  for (const k of Object.keys(node)) {
    const r = findFirstByKey(node[k], key);
    if (r) return r;
  }
  return null;
};

const findSignedOut = (node) => {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) {
    for (const n of node) { if (findSignedOut(n)) return true; }
    return false;
  }
  if (node.messageRenderer) {
    const msg = node.messageRenderer.text?.runs?.[0]?.text || "";
    if (/账号|sign in|登录|觀看記錄|watch history/i.test(msg)) return true;
  }
  for (const k of Object.keys(node)) { if (findSignedOut(node[k])) return true; }
  return false;
};

/* ── item extraction ─────────────────────────────────────── */

const fromVideoRenderer = (vr) => {
  const videoId = vr.videoId;
  const title =
    vr.title?.runs?.map((r) => r.text).join("") ||
    vr.title?.simpleText || "";
  const channel =
    vr.longBylineText?.runs?.[0]?.text ||
    vr.ownerText?.runs?.[0]?.text || "";
  const views =
    vr.shortViewCountText?.simpleText ||
    vr.viewCountText?.simpleText || "";
  const duration = vr.lengthText?.simpleText || "";
  const when =
    vr.publishedTimeText?.simpleText ||
    vr.videoInfoText?.runs?.map((r) => r.text).join(" ") || "";
  return { videoId, title, channel, views, duration, when };
};

const fromLockup = (lu) => {
  const meta = lu.metadata?.lockupMetadataViewModel || {};
  const rows =
    meta.metadata?.contentMetadataViewModel?.metadataRows || [];
  const parts = [];
  for (const row of rows) {
    for (const p of row.metadataParts || []) {
      const t = p.text?.content;
      if (t) parts.push(t);
    }
  }
  return {
    videoId: lu.contentId,
    title: meta.title?.content || "",
    channel: parts[0] || "",
    views: parts.find((p) => /观看|view/i.test(p)) || "",
    duration: "",
    when: parts.find((p) => /前|ago/i.test(p)) || parts[parts.length - 1] || ""
  };
};

const pushItems = (renderers) => {
  let added = 0;
  for (const vr of renderers) {
    const item = vr.__lockup ? fromLockup(vr.__lockup) : fromVideoRenderer(vr);
    if (!item.videoId || !item.title) continue;
    if (state.seen.has(item.videoId)) continue;
    state.seen.add(item.videoId);
    state.items.push(item);
    added++;
  }
  return added;
};

/* ── network ─────────────────────────────────────────────── */

const extractJson = (html, re) => {
  const m = html.match(re);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (_) { return null; }
};

const loadInitial = async () => {
  const res = await fetch(HISTORY_URL, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  state.apiKey = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1] || state.apiKey;
  state.clientVersion =
    (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) || [])[1] || state.clientVersion;

  const data =
    extractJson(html, /var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/) ||
    extractJson(html, /window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});/);

  if (!data) {
    // page structure changed entirely
    state.continuation = null;
    if (findSignedOutFromHtml(html)) { state.signedOut = true; return 0; }
    throw new Error("无法从页面提取数据（ytInitialData 缺失）");
  }

  const renderers = [];
  collectVideoRenderers(data, renderers);
  state.signedOut = renderers.length === 0 && findSignedOut(data);
  state.continuation = findContinuationToken(data);
  // topbar avatar as a fallback when the account_menu endpoint is unavailable
  const avatarBtn = findFirstByKey(data, "avatarButtonViewModel");
  const topbarAvatar = avatarBtn?.avatar?.sources?.slice(-1)[0]?.url || "";
  if (topbarAvatar) state.account.avatar = topbarAvatar;
  return pushItems(renderers);
};

/* account name + avatar via the signed-in account menu endpoint */
const loadAccount = async () => {
  try {
    const url =
      "https://www.youtube.com/youtubei/v1/account/account_menu?key=" +
      encodeURIComponent(state.apiKey) +
      "&prettyPrint=false";
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: state.clientVersion,
            hl: "zh-CN",
            gl: "TW"
          }
        },
        deviceTheme: "DEVICE_THEME_PRESET",
        userInterfaceTheme: "USER_INTERFACE_THEME_DARK"
      })
    });
    if (!res.ok) return;
    const data = await res.json();
    const hdr = findFirstByKey(data, "activeAccountHeaderRenderer");
    if (!hdr) return;
    const name =
      hdr.accountName?.simpleText ||
      hdr.accountName?.runs?.map((r) => r.text).join("") || "";
    const avatar = hdr.accountPhoto?.thumbnails?.slice(-1)[0]?.url || "";
    const email = hdr.email?.simpleText || "";
    if (name) state.account.name = name;
    if (avatar) state.account.avatar = avatar;
    if (email) state.account.email = email;
  } catch (err) {
    console.warn("[VideoDeck] account_menu failed:", err);
  }
};

const renderAccount = () => {
  const { name, avatar, email } = state.account;
  if (avatar) {
    els.avatar.src = avatar;
    els.avatar.classList.remove("hidden");
    els.fallbackDot.classList.add("hidden");
    if (email) els.avatar.title = email;
  }
  if (name) {
    els.account.textContent = name;
    els.account.classList.remove("hidden");
  }
};

const findSignedOutFromHtml = (html) =>
  /无法查看观看记录|观看记录已关闭|sign in to view your watch history/i.test(html);

const loadMore = async () => {
  if (!state.continuation || !state.apiKey) return 0;
  const url =
    "https://www.youtube.com/youtubei/v1/browse?key=" +
    encodeURIComponent(state.apiKey) +
    "&prettyPrint=false";
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: state.clientVersion,
          hl: "zh-CN",
          gl: "TW"
        }
      },
      continuation: state.continuation
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const renderers = [];
  collectVideoRenderers(data, renderers);
  state.continuation = findContinuationToken(data);
  return pushItems(renderers);
};

/* ── rendering ───────────────────────────────────────────── */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const itemHtml = (it) => `
  <div class="vd-item" data-v="${esc(it.videoId)}" title="${esc(it.title)}">
    <div class="vd-thumb">
      <img loading="lazy" src="https://i.ytimg.com/vi/${esc(it.videoId)}/mqdefault.jpg" alt="" />
      ${it.duration ? `<span class="vd-dur">${esc(it.duration)}</span>` : ""}
    </div>
    <div class="vd-meta">
      <div class="vd-title">${esc(it.title)}</div>
      <div class="vd-sub">${esc(it.channel)}${it.views ? " · " + esc(it.views) : ""}</div>
      ${it.when ? `<div class="vd-sub vd-when">${esc(it.when)}</div>` : ""}
    </div>
  </div>`;

const skeleton = (n) =>
  Array.from({ length: n }, () => `
    <div class="vd-skel">
      <div class="bar b-thumb"></div>
      <div class="b-lines"><div class="bar b-line"></div><div class="bar b-line short"></div></div>
    </div>`).join("");

const render = () => {
  const q = state.query.trim().toLowerCase();
  const visible = q
    ? state.items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.channel.toLowerCase().includes(q)
      )
    : state.items;

  els.count.textContent = state.items.length ? `${state.items.length} 条` : "";

  if (state.items.length === 0) {
    els.list.innerHTML = "";
    els.moreWrap.classList.add("hidden");
    if (state.signedOut) {
      els.state.innerHTML =
        '未检测到 YouTube 登录状态<br>请先在浏览器中登录 YouTube，再点击刷新';
    } else {
      els.state.textContent = "没有观看记录";
    }
    return;
  }

  els.state.textContent = "";
  els.list.innerHTML = visible.map(itemHtml).join("");
  if (q && visible.length === 0) {
    els.state.textContent = "已加载的记录中没有匹配项，试试「加载更多」后搜索";
  }

  const moreWrap = els.moreWrap;
  if (state.continuation) {
    moreWrap.classList.remove("hidden");
    els.more.disabled = state.loading;
    els.more.textContent = state.loading ? "加载中…" : "加载更多";
  } else {
    moreWrap.classList.add("hidden");
  }
};

const setLoading = (on) => {
  state.loading = on;
  els.refresh.classList.toggle("spin", on);
  if (on && state.items.length === 0) {
    els.state.innerHTML = skeleton(4);
    els.state.classList.remove("hidden");
  } else if (!on) {
    els.state.innerHTML = "";
  }
};

/* ── events ──────────────────────────────────────────────── */

els.list.addEventListener("click", (e) => {
  const item = e.target.closest(".vd-item");
  if (!item) return;
  const url = "https://www.youtube.com/watch?v=" + item.dataset.v;
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, "_blank");
  }
  window.close();
});

els.more.addEventListener("click", async () => {
  if (state.loading) return;
  setLoading(true);
  els.more.textContent = "加载中…";
  try {
    await loadMore();
  } catch (err) {
    console.warn("[VideoDeck] loadMore failed:", err);
  } finally {
    setLoading(false);
    render();
  }
});

els.refresh.addEventListener("click", () => init(true));

let searchTimer = 0;
els.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = els.search.value;
    render();
  }, 120);
});

/* ── boot ────────────────────────────────────────────────── */

const init = async (isRefresh) => {
  if (state.loading) return;
  if (isRefresh) {
    state.items = [];
    state.seen = new Set();
    state.continuation = null;
    state.signedOut = false;
  }
  setLoading(true);
  try {
    await loadInitial();
  } catch (err) {
    console.warn("[VideoDeck] history fetch failed:", err);
    els.state.innerHTML =
      `<span class="vd-err">加载失败：${esc(err.message)}</span><br>` +
      "请检查网络或 YouTube 登录状态<button>重试</button>";
    els.state.querySelector("button").addEventListener("click", () => init(true));
    els.list.innerHTML = "";
    els.moreWrap.classList.add("hidden");
    els.count.textContent = "";
    setLoading(false);
    return;
  }
  setLoading(false);
  render();
  loadAccount().then(renderAccount);
};

init(false);
