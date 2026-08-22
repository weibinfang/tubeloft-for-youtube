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
