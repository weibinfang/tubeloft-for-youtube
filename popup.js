// TubeLoft for YouTube — watch history popup.
// Copyright (c) 2026 vibinfang. Licensed under the MIT license.
//
// TubeLoft — watch history popup.
// Fetches youtube.com/feed/history with the browser's YouTube cookies
// (granted by host_permissions), parses the embedded ytInitialData JSON via a
// structure-agnostic recursive walk (immune to YouTube layout changes), and
// pages deeper items through the innertube browse API continuation.

const HISTORY_URL = "https://www.youtube.com/feed/history";

/* ── UI strings: follow YouTube's own language ───────────── */

const STRINGS = {
  en:     { title: "History", all: "All", count: (n) => `${n} items`, search: "Search loaded items…", more: "Show more", loading: "Loading…", empty: "No watch history", noMatch: "No matches in loaded items — try \"Show more\" first", signedOut: "Not signed in to YouTube<br>Please sign in to YouTube, then refresh", err: "Failed to load", retry: "Retry", refresh: "Refresh" },
  "zh-CN": { title: "观看记录", all: "全部", count: (n) => `${n} 条`, search: "搜索已加载的记录…", more: "加载更多", loading: "加载中…", empty: "没有观看记录", noMatch: "已加载的记录中没有匹配项，试试「加载更多」后搜索", signedOut: "未检测到 YouTube 登录状态<br>请先在浏览器中登录 YouTube，再点击刷新", err: "加载失败", retry: "重试", refresh: "刷新" },
  "zh-TW": { title: "觀看紀錄", all: "全部", count: (n) => `${n} 部`, search: "搜尋已載入的記錄…", more: "顯示更多", loading: "載入中…", empty: "沒有觀看紀錄", noMatch: "已載入的記錄中沒有相符項目，請試試「顯示更多」後再搜尋", signedOut: "未偵測到 YouTube 登入狀態<br>請先在瀏覽器中登入 YouTube，再重新整理", err: "載入失敗", retry: "重試", refresh: "重新整理" },
  ja:     { title: "履歴", all: "すべて", count: (n) => `${n} 件`, search: "読み込んだ履歴を検索…", more: "もっと見る", loading: "読み込み中…", empty: "視聴履歴がありません", noMatch: "読み込んだ履歴に一致するものはありません。「もっと見る」の後にもう一度お試しください", signedOut: "YouTube にログインしていません<br>ブラウザで YouTube にログインしてから再読み込みしてください", err: "読み込みに失敗しました", retry: "再試行", refresh: "再読み込み" },
  ko:     { title: "시청 기록", all: "전체", count: (n) => `${n}개`, search: "불러온 기록 검색…", more: "더보기", loading: "불러오는 중…", empty: "시청 기록이 없습니다", noMatch: "불러온 기록에 일치하는 항목이 없습니다. '더보기'를 누른 후 다시 검색해 보세요", signedOut: "YouTube 로그인 상태가 아닙니다<br>브라우저에서 YouTube에 로그인한 후 새로고침해 주세요", err: "불러오기 실패", retry: "다시 시도", refresh: "새로고침" },
  es:     { title: "Historial", all: "Todos", count: (n) => `${n} elementos`, search: "Buscar en lo cargado…", more: "Mostrar más", loading: "Cargando…", empty: "No hay historial de visualizaciones", noMatch: "Sin coincidencias en lo cargado: prueba «Mostrar más» y vuelve a buscar", signedOut: "No has iniciado sesión en YouTube<br>Inicia sesión en YouTube y actualiza", err: "Error al cargar", retry: "Reintentar", refresh: "Actualizar" },
  "es-419": { title: "Historial", all: "Todos", count: (n) => `${n} elementos`, search: "Buscar en lo cargado…", more: "Mostrar más", loading: "Cargando…", empty: "No hay historial de visualizaciones", noMatch: "Sin coincidencias en lo cargado: prueba «Mostrar más» y vuelve a buscar", signedOut: "No iniciaste sesión en YouTube<br>Inicia sesión en YouTube y vuelve a intentar", err: "Error al cargar", retry: "Reintentar", refresh: "Actualizar" },
  pt:     { title: "Histórico", all: "Todos", count: (n) => `${n} itens`, search: "Pesquisar no que foi carregado…", more: "Mostrar mais", loading: "Carregando…", empty: "Sem histórico de exibição", noMatch: "Sem correspondências no que foi carregado — tente «Mostrar mais» e pesquise de novo", signedOut: "Você não está conectado ao YouTube<br>Faça login no YouTube e atualize", err: "Falha ao carregar", retry: "Tentar novamente", refresh: "Atualizar" },
  "pt-PT": { title: "Histórico", all: "Todos", count: (n) => `${n} itens`, search: "Pesquisar no que foi carregado…", more: "Mostrar mais", loading: "A carregar…", empty: "Sem histórico de visualizações", noMatch: "Sem correspondências no que foi carregado — tente «Mostrar mais» e pesquise de novo", signedOut: "Não tem sessão iniciada no YouTube<br>Inicie sessão no YouTube e atualize", err: "Falha ao carregar", retry: "Tentar novamente", refresh: "Atualizar" },
  fr:     { title: "Historique", all: "Tous", count: (n) => `${n} éléments`, search: "Rechercher dans l’historique chargé…", more: "Afficher plus", loading: "Chargement…", empty: "Aucun historique des vidéos regardées", noMatch: "Aucun résultat dans l’historique chargé — essayez « Afficher plus », puis relancez la recherche", signedOut: "Aucune session YouTube détectée<br>Connectez-vous à YouTube, puis actualisez", err: "Échec du chargement", retry: "Réessayer", refresh: "Actualiser" },
  de:     { title: "Verlauf", all: "Alle", count: (n) => `${n} Einträge`, search: "Geladene Einträge durchsuchen…", more: "Mehr laden", loading: "Wird geladen…", empty: "Kein Wiedergabeverlauf", noMatch: "Keine Treffer in den geladenen Einträgen — lade mehr und versuche es erneut", signedOut: "Keine YouTube-Anmeldung erkannt<br>Melde dich im Browser bei YouTube an und aktualisiere", err: "Laden fehlgeschlagen", retry: "Erneut versuchen", refresh: "Aktualisieren" },
  it:     { title: "Cronologia", all: "Tutti", count: (n) => `${n} elementi`, search: "Cerca negli elementi caricati…", more: "Mostra altro", loading: "Caricamento…", empty: "Nessuna cronologia delle visualizzazioni", noMatch: "Nessuna corrispondenza negli elementi caricati: prova «Mostra altro» e riprova", signedOut: "Accesso a YouTube non rilevato<br>Accedi a YouTube e aggiorna", err: "Caricamento non riuscito", retry: "Riprova", refresh: "Aggiorna" },
  ru:     { title: "История", all: "Все", count: (n) => `${n} эл.`, search: "Поиск в загруженных записях…", more: "Показать ещё", loading: "Загрузка…", empty: "Нет истории просмотров", noMatch: "Совпадений нет. Нажмите «Показать ещё» и повторите поиск", signedOut: "Вы не вошли в YouTube<br>Войдите в YouTube в браузере и обновите", err: "Не удалось загрузить", retry: "Повторить", refresh: "Обновить" },
  uk:     { title: "Історія", all: "Усі", count: (n) => `${n} ел.`, search: "Пошук серед завантажених записів…", more: "Показати більше", loading: "Завантаження…", empty: "Немає історії переглядів", noMatch: "Збігів немає. Натисніть «Показати більше» та повторіть пошук", signedOut: "Виявлено вхід у YouTube відсутнім<br>Увійдіть в YouTube і оновіть", err: "Не вдалося завантажити", retry: "Повторити", refresh: "Оновити" },
  pl:     { title: "Historia", all: "Wszystkie", count: (n) => `${n} elem.`, search: "Szukaj w załadowanych…", more: "Pokaż więcej", loading: "Ładowanie…", empty: "Brak historii oglądania", noMatch: "Brak wyników wśród załadowanych — kliknij «Pokaż więcej» i spróbuj ponownie", signedOut: "Nie wykryto zalogowania do YouTube<br>Zaloguj się w YouTube i odśwież", err: "Nie udało się załadować", retry: "Spróbuj ponownie", refresh: "Odśwież" },
  nl:     { title: "Geschiedenis", all: "Alle", count: (n) => `${n} items`, search: "Zoeken in geladen items…", more: "Meer laden", loading: "Laden…", empty: "Geen kijkgeschiedenis", noMatch: "Geen overeenkomsten — laad meer en probeer opnieuw", signedOut: "Niet ingelogd op YouTube<br>Log in bij YouTube en vernieuw", err: "Laden mislukt", retry: "Opnieuw proberen", refresh: "Vernieuwen" },
  tr:     { title: "Geçmiş", all: "Tümü", count: (n) => `${n} öğe`, search: "Yüklenenlerde ara…", more: "Daha fazla göster", loading: "Yükleniyor…", empty: "İzleme geçmişi yok", noMatch: "Eşleşme yok. «Daha fazla göster»e tıklayıp tekrar deneyin", signedOut: "YouTube oturumu algılanmadı<br>Tarayıcıda YouTube'a giriş yapıp yenileyin", err: "Yüklenemedi", retry: "Tekrar dene", refresh: "Yenile" },
  ar:     { title: "السجلّ", all: "الكل", count: (n) => `${n} عنصرًا`, search: "البحث في العناصر المحمّلة…", more: "عرض المزيد", loading: "جارٍ التحميل…", empty: "لا يوجد سجلّ مشاهدة", noMatch: "لا نتائج مطابقة، جرّب «عرض المزيد» ثم ابحث مجددًا", signedOut: "لم يتم رصد تسجيل الدخول إلى YouTube<br>سجّل الدخول إلى YouTube ثم أعد التحميل", err: "فشل التحميل", retry: "إعادة المحاولة", refresh: "تحديث" },
  hi:     { title: "इतिहास", all: "सभी", count: (n) => `${n} आइटम`, search: "लोड किए गए आइटम खोजें…", more: "और दिखाएं", loading: "लोड हो रहा है…", empty: "कोई देखने का इतिहास नहीं", noMatch: "कोई मेल नहीं मिला — «और दिखाएं» पर क्लिक करके फिर खोजें", signedOut: "YouTube साइन-इन स्थिति नहीं मिली<br>ब्राउज़र में YouTube में साइन इन करके रीफ़्रेश करें", err: "लोड नहीं हो सका", retry: "फिर कोशिश करें", refresh: "रीफ़्रेश करें" },
  th:     { title: "ประวัติ", all: "ทั้งหมด", count: (n) => `${n} รายการ`, search: "ค้นหารายการที่โหลดแล้ว…", more: "แสดงเพิ่มเติม", loading: "กำลังโหลด…", empty: "ไม่มีประวัติการดู", noMatch: "ไม่พบรายการที่ตรงกัน ลองคลิก «แสดงเพิ่มเติม» แล้วค้นหาอีกครั้ง", signedOut: "ไม่พบการลงชื่อเข้าใช้ YouTube<br>กรุณาลงชื่อเข้าใช้ YouTube แล้วรีเฟรช", err: "โหลดไม่สำเร็จ", retry: "ลองอีกครั้ง", refresh: "รีเฟรช" },
  vi:     { title: "Nhật ký", all: "Tất cả", count: (n) => `${n} mục`, search: "Tìm trong các mục đã tải…", more: "Xem thêm", loading: "Đang tải…", empty: "Không có nhật ký xem", noMatch: "Không có kết quả phù hợp — thử «Xem thêm» rồi tìm lại", signedOut: "Chưa phát hiện đăng nhập YouTube<br>Hãy đăng nhập YouTube rồi tải lại", err: "Không tải được", retry: "Thử lại", refresh: "Tải lại" },
  id:     { title: "Histori", all: "Semua", count: (n) => `${n} item`, search: "Telusuri item yang dimuat…", more: "Tampilkan lainnya", loading: "Memuat…", empty: "Tidak ada histori tontonan", noMatch: "Tidak ada yang cocok — coba «Tampilkan lainnya» lalu cari lagi", signedOut: "Belum login ke YouTube<br>Login ke YouTube lalu muat ulang", err: "Gagal memuat", retry: "Coba lagi", refresh: "Muat ulang" },
  ms:     { title: "Sejarah", all: "Semua", count: (n) => `${n} item`, search: "Cari item yang dimuatkan…", more: "Tunjukkan lagi", loading: "Memuatkan…", empty: "Tiada sejarah tontonan", noMatch: "Tiada padanan — cuba «Tunjukkan lagi» dan cari semula", signedOut: "Tiada log masuk YouTube dikesan<br>Log masuk ke YouTube kemudian muat semula", err: "Gagal memuatkan", retry: "Cuba semula", refresh: "Muat semula" },
  "zh-HK": { title: "觀看記錄", all: "全部", count: (n) => `${n} 部影片`, search: "搜尋已載入的記錄…", more: "顯示更多", loading: "載入中…", empty: "沒有觀看記錄", noMatch: "已載入的記錄沒有相符項目，請按「顯示更多」後再試", signedOut: "未偵測到 YouTube 登入狀態<br>請先在瀏覽器登入 YouTube，然後重新整理", err: "載入失敗", retry: "重試", refresh: "重新整理" },
  "pt-BR": { title: "Histórico", all: "Todos", count: (n) => `${n} itens`, search: "Pesquisar no que foi carregado…", more: "Mostrar mais", loading: "Carregando…", empty: "Sem histórico de exibição", noMatch: "Sem correspondências no que foi carregado — tente «Mostrar mais» e pesquise de novo", signedOut: "Você não está conectado ao YouTube<br>Faça login no YouTube e atualize", err: "Falha ao carregar", retry: "Tentar novamente", refresh: "Atualizar" }
};

/* matches YouTube's own hl codes, including variants like "en-IN", "fr-CA" */
const pickStrings = (hl) => {
  const h = (hl || "").toLowerCase();
  const direct = Object.keys(STRINGS).find((k) => k.toLowerCase() === h);
  if (direct) return STRINGS[direct];
  const base = h.split("-")[0];
  const byBase = Object.keys(STRINGS).find(
    (k) => k.toLowerCase().split("-")[0] === base
  );
  return STRINGS[byBase] || STRINGS.en;
};

/* default = English; swapped in once YouTube's real hl is known */
let t = STRINGS.en;

/* YouTube's <html lang> uses script subtags (zh-Hans-CN / zh-Hant-TW) — map
   them onto the hl codes our string table keys on; everything else passes. */
const normalizeSiteLang = (lang) => {
  const l = String(lang || "").toLowerCase();
  if (l.startsWith("zh-hans")) return "zh-CN";
  if (l.startsWith("zh-hant")) return "zh-TW";
  return lang || "";
};

const saveSiteLang = (hl) => {
  try {
    chrome.storage.local.set({ vdSiteLang: hl }, () => void chrome.runtime.lastError);
  } catch (e) { /* storage unavailable */ }
};

/* Apply the language cached from the last visited YouTube page so the popup
   opens already localized, before the history fetch resolves. Never calls
   render(): while items are still loading the state area shows the skeleton. */
const applyCachedLanguage = () => {
  try {
    chrome.storage.local.get("vdSiteLang", (stored) => {
      if (chrome.runtime.lastError || state.hl) return; // fetch already won
      const hl = normalizeSiteLang(stored && stored.vdSiteLang);
      if (!hl) return;
      state.hl = hl;
      t = pickStrings(hl);
      applyStrings();
    });
  } catch (e) { /* storage unavailable */ }
};

const applyStrings = () => {
  document.documentElement.lang = state.hl || "en";
  document.title = `TubeLoft · ${t.title}`;
  const titleEl = document.getElementById("vd-title");
  if (titleEl) titleEl.textContent = state.historyLabel || t.title;
  els.refresh.title = t.refresh;
  els.search.placeholder = t.search;
};

/* pull YouTube's own localized "History" label out of the page data */
const findHistoryLabel = (node) => {
  const re = /hist|记录|紀錄|履歴|시청/i;
  const mf = node.microformat?.pageMicroformatRenderer?.title?.simpleText;
  if (mf && re.test(mf)) return mf;
  const br = findFirstByKey(node, "browseEndpoint");
  const bt = br?.browseEndpointSupportedMetadataRenderer?.title?.simpleText;
  if (bt && re.test(bt)) return bt;
  const tab = findFirstByKey(node, "tabRenderer");
  if (tab && tab.title && re.test(String(tab.title))) return tab.title;
  return "";
};

const els = {
  list: document.getElementById("vd-list"),
  state: document.getElementById("vd-state"),
  count: document.getElementById("vd-count"),
  moreWrap: document.getElementById("vd-more-wrap"),
  more: document.getElementById("vd-more"),
  refresh: document.getElementById("vd-refresh"),
  search: document.getElementById("vd-search-input"),
  chips: document.getElementById("vd-chips"),
  chipsWrap: document.getElementById("vd-chips-wrap"),
  chipsPrev: document.getElementById("vd-chips-prev"),
  chipsNext: document.getElementById("vd-chips-next"),
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
  hl: "",
  gl: "",
  historyLabel: "",
  query: "",
  channel: "",
  chipsKey: "",
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
    if (/账号|登录|觀看記錄|观看记录|觀看紀錄|視聴履歴|시청 기록|hist|verlauf|cronolog|histor|istòr|geçmiş|sign in|iniciar sesi|anmelden|se connecter|ログイン|로그인|войти|зайти|accedi|log in/i.test(msg)) return true;
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
    // language-agnostic split: time units → timestamp, other numeric parts → view count
    views: parts.find((p) => /\d/.test(p) && !/[年月天日時分秒]|\b(ago|day|days|week|weeks|month|months|year|years|hour|hours|minute|minutes|second|seconds|sec|min)\b/i.test(p)) || "",
    duration: "",
    when: parts.find((p) => /[年月天日時分秒]|\b(ago|day|days|week|weeks|month|months|year|years|hour|hours|minute|minutes|second|seconds)\b/i.test(p)) || parts[parts.length - 1] || ""
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
  // the page itself is served in the visitor's YouTube language — reuse it
  const newHl = (html.match(/"hl":"([^"]+)"/) || [])[1] || "";
  const newGl = (html.match(/"gl":"([^"]+)"/) || [])[1] || "";
  if (newHl) {
    state.hl = newHl;
    state.gl = newGl;
    t = pickStrings(newHl);
    saveSiteLang(newHl);
  }

  const data =
    extractJson(html, /var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/) ||
    extractJson(html, /window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});/);

  if (!data) {
    // page structure changed entirely
    state.continuation = null;
    if (findSignedOutFromHtml(html)) { state.signedOut = true; return 0; }
    throw new Error("ytInitialData missing");
  }

  const renderers = [];
  collectVideoRenderers(data, renderers);
  state.signedOut = renderers.length === 0 && findSignedOut(data);
  state.continuation = findContinuationToken(data);
  state.historyLabel = findHistoryLabel(data) || state.historyLabel;
  // topbar avatar as a fallback when the account_menu endpoint is unavailable
  const avatarBtn = findFirstByKey(data, "avatarButtonViewModel");
  if (avatarBtn) {
    const topbarAvatar = findAvatarUrl(avatarBtn) || findAvatarUrl(data.topbar);
    if (topbarAvatar) state.account.avatar = topbarAvatar;
  } else {
    const topbarAvatar = findAvatarUrl(data.topbar);
    if (topbarAvatar) state.account.avatar = topbarAvatar;
  }
  return pushItems(renderers);
};

/* shape-proof avatar URL finder: first googleusercontent / yt3 image URL in a subtree */
const findAvatarUrl = (node) => {
  if (!node || typeof node === "object") {
    if (Array.isArray(node)) {
      for (const n of node) {
        const u = findAvatarUrl(n);
        if (u) return u;
      }
      return "";
    }
    for (const k of Object.keys(node)) {
      const u = findAvatarUrl(node[k]);
      if (u) return u;
    }
    return "";
  }
  if (typeof node !== "string") return "";
  const s = node.replace(/^\/\//, "https://");
  return /https:\/\/(yt3|lh\d|\w+-\w+)?\.?(ggpht|googleusercontent)\.com\//.test(s) && !/=s(\d+)-c-k-no$/.test(s.split("?")[0]) ? s : "";
};

/* account name + avatar via the signed-in account menu endpoints */
const loadAccount = async () => {
  const context = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: state.clientVersion,
        hl: state.hl || undefined,
        gl: state.gl || undefined
      }
    },
    deviceTheme: "DEVICE_THEME_PRESET",
    userInterfaceTheme: "USER_INTERFACE_THEME_DARK"
  };
  const endpoints = [
    "https://www.youtube.com/youtubei/v1/account/get_account_menu",
    "https://www.youtube.com/youtubei/v1/account/account_menu"
  ];
  for (const base of endpoints) {
    try {
      const res = await fetch(
        base + "?key=" + encodeURIComponent(state.apiKey) + "&prettyPrint=false",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context)
        }
      );
      if (!res.ok) {
        console.warn("[TubeLoft] account endpoint", base, "HTTP", res.status);
        continue;
      }
      const data = await res.json();
      // modern header block
      let hdr = findFirstByKey(data, "activeAccountHeaderRenderer");
      // account switcher items also carry name + photo
      if (!hdr) hdr = findFirstByKey(data, "accountItemRenderer");
      if (!hdr) {
        console.warn("[TubeLoft] account response had no known header keys:",
          Object.keys(data).slice(0, 10));
        continue;
      }
      const nameObj = hdr.accountName || hdr.title || {};
      const name =
        nameObj.simpleText ||
        nameObj.runs?.map((r) => r.text).join("") ||
        "";
      const avatar = findAvatarUrl(hdr.accountPhoto || hdr);
      const email = hdr.email?.simpleText || "";
      if (name) state.account.name = name;
      if (avatar) state.account.avatar = avatar;
      if (email) state.account.email = email;
      console.info("[TubeLoft] account loaded from", base.split("/").pop());
      return;
    } catch (err) {
      console.warn("[TubeLoft] account endpoint", base, "failed:", err.message);
    }
  }
  console.warn("[TubeLoft] account endpoints all failed; topbar avatar =", state.account.avatar || "none");
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
  /无法查看观看记录|觀看紀錄已關閉|观看记录已关闭|no watch history|sign in to (view|verify).*watch history|inicia sesi\u00f3n para ver tu historial|melde dich an, um deinen verlauf/i.test(html);

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
          hl: state.hl || undefined,
          gl: state.gl || undefined
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

/* show edge fade + arrows only when the chip row actually overflows */
const CHIP_SLACK = 24; /* px of scroll slack before the back-arrow appears */
const updateChipsNav = () => {
  if (els.chips.classList.contains("hidden")) {
    els.chipsWrap.classList.remove("has-more");
    els.chipsPrev.classList.add("hidden");
    els.chipsNext.classList.add("hidden");
    return;
  }
  const max = els.chips.scrollWidth - els.chips.clientWidth;
  const over = max > 4;
  els.chipsWrap.classList.toggle("has-more", over && els.chips.scrollLeft < max - 4);
  els.chipsPrev.classList.toggle("hidden", els.chips.scrollLeft <= CHIP_SLACK);
  els.chipsNext.classList.toggle("hidden", !over || els.chips.scrollLeft >= max - CHIP_SLACK);
};

/* horizontal channel filter chips, rebuilt only when the item set changes */
const renderChips = () => {
  const counts = new Map();
  for (const it of state.items) {
    if (it.channel) counts.set(it.channel, (counts.get(it.channel) || 0) + 1);
  }
  const key = [...counts.entries()].map(([c, n]) => c + "\0" + n).join("\1");
  if (key === state.chipsKey) {
    // same item set: just sync the selected state (e.g. after chip clicks)
    for (const el of els.chips.querySelectorAll(".vd-chip")) {
      el.classList.toggle("on", (el.dataset.c || "") === state.channel);
    }
    return;
  }
  state.chipsKey = key;
  if (counts.size < 2) {
    els.chips.innerHTML = "";
    els.chips.classList.add("hidden");
    state.channel = "";
    updateChipsNav();
    return;
  }
  // most-watched channels first, capped so the chip row stays manageable
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24);
  if (state.channel && !counts.has(state.channel)) state.channel = "";
  els.chips.innerHTML =
    `<button class="vd-chip${state.channel ? "" : " on"}" data-c="">${esc(t.all)}</button>` +
    top.map(([c, n]) =>
      `<button class="vd-chip${state.channel === c ? " on" : ""}" data-c="${esc(c)}" title="${esc(c)}">${esc(c)} <span class="vd-chip-n">${n}</span></button>`
    ).join("");
  els.chips.classList.remove("hidden");
  requestAnimationFrame(updateChipsNav);
};

const render = () => {
  const q = state.query.trim().toLowerCase();
  let visible = state.channel
    ? state.items.filter((it) => it.channel === state.channel)
    : state.items;
  if (q) {
    visible = visible.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.channel.toLowerCase().includes(q)
    );
  }

  const filtered = q || state.channel;
  els.count.textContent = state.items.length
    ? filtered
      ? `${visible.length} / ${state.items.length}`
      : t.count(state.items.length)
    : "";

  if (state.items.length === 0) {
    els.chips.innerHTML = "";
    els.chips.classList.add("hidden");
    state.chipsKey = "";
    els.list.innerHTML = "";
    els.moreWrap.classList.add("hidden");
    if (state.signedOut) {
      els.state.innerHTML = t.signedOut;
    } else {
      els.state.textContent = t.empty;
    }
    return;
  }

  renderChips();
  els.state.textContent = "";
  els.list.innerHTML = visible.map(itemHtml).join("");
  if (filtered && visible.length === 0) {
    els.state.textContent = t.noMatch;
  }

  const moreWrap = els.moreWrap;
  if (state.continuation) {
    moreWrap.classList.remove("hidden");
    els.more.disabled = state.loading;
    els.more.textContent = state.loading ? t.loading : t.more;
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

els.chips.addEventListener("click", (e) => {
  const chip = e.target.closest(".vd-chip");
  if (!chip) return;
  state.channel = chip.dataset.c || "";
  render();
  chip.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
});
els.chips.addEventListener("scroll", updateChipsNav, { passive: true });
/* vertical mouse wheel scrolls the chip row horizontally */
els.chips.addEventListener("wheel", (e) => {
  if (els.chips.scrollWidth <= els.chips.clientWidth) return;
  e.preventDefault();
  const d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
  els.chips.scrollLeft += d + e.deltaX;
  updateChipsNav();
}, { passive: false });
els.chipsPrev.addEventListener("click", () => els.chips.scrollBy({ left: -220, behavior: "smooth" }));
els.chipsNext.addEventListener("click", () => els.chips.scrollBy({ left: 220, behavior: "smooth" }));

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
  els.more.textContent = t.loading;
  try {
    await loadMore();
  } catch (err) {
    console.warn("[TubeLoft] loadMore failed:", err);
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
    state.channel = "";
    state.chipsKey = "";
  }
  setLoading(true);
  try {
    await loadInitial();
  } catch (err) {
    console.warn("[TubeLoft] history fetch failed:", err);
    els.state.innerHTML =
      `<span class="vd-err">${t.err}: ${esc(err.message)}</span><br>` +
      `<button>${t.retry}</button>`;
    els.state.querySelector("button").addEventListener("click", () => init(true));
    els.list.innerHTML = "";
    els.moreWrap.classList.add("hidden");
    els.count.textContent = "";
    setLoading(false);
    return;
  }
  setLoading(false);
  render();
  applyStrings();
  loadAccount().then(renderAccount);
};

init(false);
applyCachedLanguage();
