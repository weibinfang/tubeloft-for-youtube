// Background service worker: provides the extension context-menu entry that
// replaces the userscript's GM_registerMenuCommand("Setting", ...) feature.
// Clicking it sends a message to the content script, which looks up and runs
// the callback registered under the same command name.

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "yti-setting",
      title: "VideoDeck – Settings",
      contexts: ["page", "video"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "yti-setting") return;
  if (!tab || typeof tab.id !== "number") return;
  chrome.tabs
    .sendMessage(tab.id, { type: "yti-menu-command", name: "Setting" })
    .catch(() => {
      // Content script not present on this tab (e.g. non-YouTube page) — ignore.
    });
});

// --- Reinjection fallback -------------------------------------------------
// Known Chrome quirk: after the extension is disabled/re-enabled, updated, or
// the browser restarts with session restore, existing tabs can go through
// their NEXT navigation without receiving the declared content scripts — the
// first load then runs with no sidebar at all (native comments under the
// video). We cannot prevent it, so we heal it: verify each finished YouTube
// navigation and programmatically inject whichever layer is missing, in
// several rounds (both target scripts carry reinjection guards, so injecting
// over an already-running instance is a no-op).

const isYouTubeUrl = (url) => typeof url === "string" && /^https?:\/\/([a-z0-9-]+\.)*youtube\.com\//i.test(url);

// Reports from content.js: MAIN-world engine failed to initialise.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "vd-engine-missing") return;
  const tabId = sender.tab && sender.tab.id;
  if (typeof tabId !== "number" || !isYouTubeUrl(sender.tab.url)) return;
  chrome.scripting
    .executeScript({ target: { tabId }, files: ["tabview-main.js"], world: "MAIN" })
    .catch(() => {});
});

// Verify one tab and (re)inject whatever is missing.
//   ping unanswered            -> both layers gone      -> inject both
//   ping answered, engine=false-> content layer alive   -> inject engine only
// Rounds re-run every 4s (max 3) so a page that was mid-navigation during an
// earlier attempt still converges to a healthy state.
const healTab = async (tabId, round) => {
  if (round >= 3) return;
  let tab = null;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (e) {
    return; // tab closed
  }
  if (!tab || !isYouTubeUrl(tab.url)) return;
  let resp = null;
  try {
    resp = await chrome.tabs.sendMessage(tabId, { type: "vd-heartbeat-ping" });
  } catch (e) {
    resp = null;
  }
  if (resp && resp.ok && resp.engine) return; // healthy
  try {
    if (!resp || !resp.ok) {
      await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    }
    await chrome.scripting.executeScript({ target: { tabId }, files: ["tabview-main.js"], world: "MAIN" });
  } catch (e) {
    // Tab closed or navigated away mid-injection — the next round (or the
    // next navigation's heal) covers it.
  }
  setTimeout(() => healTab(tabId, round + 1), 4000);
};

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0 || !isYouTubeUrl(details.url)) return;
  setTimeout(() => healTab(details.tabId, 0), 1500);
});

// Extension (re)enabled / browser started: heal YouTube tabs that loaded
// while the extension could not inject into them.
const healOpenTabs = () => {
  chrome.tabs
    .query({ url: ["*://*.youtube.com/*"] })
    .then((tabs) => {
      for (const t of tabs) healTab(t.id, 0);
    })
    .catch(() => {});
};
chrome.runtime.onInstalled.addListener(healOpenTabs);
chrome.runtime.onStartup.addListener(healOpenTabs);
