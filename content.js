/*!
 * TubeLoft for YouTube — content script (isolated world).
 * Copyright (c) 2026 vibinfang. Licensed under the MIT license.
 *
 * GM_* API polyfill — lets the unmodified userscript body run as a Chrome
 * MV3 content script (isolated world).
 *   - Storage  -> localStorage with prefix (synchronous, like GM_getValue)
 *   - Open tab -> window.open
 *   - Menu cmd -> in-memory registry, triggered from the extension context
 *                 menu via background.js messages
 *   - GM_addStyle / GM_addElement -> plain DOM helpers
 * APIs granted by the userscript header but never called in its body
 * (GM_xmlhttpRequest, GM_download, GM_setClipboard) are intentionally omitted.
 */
var GM_getValue = function (key, defaultValue) {
  var raw;
  try {
    raw = localStorage.getItem("yti:gm:" + key);
  } catch (e) {
    return defaultValue;
  }
  if (raw === null) return defaultValue;
  try {
    var parsed = JSON.parse(raw);
    return parsed === undefined ? defaultValue : parsed;
  } catch (e) {
    return defaultValue;
  }
};
var GM_setValue = function (key, value) {
  try {
    localStorage.setItem("yti:gm:" + key, JSON.stringify(value));
  } catch (e) {
    console.warn("[YTI] GM_setValue failed:", e);
  }
};
var GM_deleteValue = function (key) {
  try {
    localStorage.removeItem("yti:gm:" + key);
  } catch (e) { /* ignore */ }
};
var GM_addStyle = function (css) {
  var style = document.createElement("style");
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  return style;
};
var GM_openInTab = function (url, options) {
  return window.open(url, "_blank", "noopener");
};
var GM = {
  openInTab: function (url, options) {
    return GM_openInTab(url, options);
  }
};
var GM_addElement = function (parent, tagName, attrs) {
  var el = document.createElement(tagName);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === "textContent") {
        el.textContent = attrs[k];
      } else {
        el.setAttribute(k, attrs[k]);
      }
    });
  }
  (parent || document.head || document.documentElement).appendChild(el);
  return el;
};
var __gmMenuCommands = new Map();
var GM_registerMenuCommand = function (name, fn) {
  if (typeof fn === "function") __gmMenuCommands.set(name, fn);
};
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg && msg.type === "yti-menu-command") {
      var fn = __gmMenuCommands.get(msg.name);
      if (typeof fn === "function") {
        try {
          fn();
        } catch (e) {
          console.warn("[YTI] menu command failed:", e);
        }
      }
    } else if (msg && msg.type === "vd-heartbeat-ping") {
      // Background worker verifies both layers on this tab (fallback for
      // tabs that lost their content scripts after an extension toggle or
      // browser restart). Report the MAIN-world engine state as well.
      try {
        sendResponse({ ok: true, engine: document.documentElement.hasAttribute("tabview-loaded") });
      } catch (e) { /* ignore */ }
    }
  });
}

// Record YouTube's interface language so the history popup can render its
// UI in the same language instantly, without waiting for its own fetch.
// YouTube reloads the whole page on language switches, so one read per page
// load stays current.
(function recordSiteLanguage() {
  var save = function () {
    var lang = document.documentElement && document.documentElement.lang;
    if (!lang) return;
    try {
      chrome.storage.local.get("vdSiteLang", function (stored) {
        if (chrome.runtime.lastError) return;
        if (stored && stored.vdSiteLang === lang) return;
        chrome.storage.local.set({ vdSiteLang: lang }, function () {
          void chrome.runtime.lastError;
        });
      });
    } catch (e) { /* storage unavailable */ }
  };
  save();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", save, { once: true });
  }
})();

// ---------------------------------------------------------------------------
// Attribution: the code below derives from the MIT-licensed userscript
// "YouTube Improvements – Layout & Video Enhancer" v1.1.5 by Thalrien.vx
// and CY Fung (https://github.com/tabview-youtube/Tabview-Youtube).
// The original userscript metadata block (==UserScript== header) has been
// removed: its auto-update URLs, download-feature descriptions and referral
// features do not apply to this Chrome extension and were deliberately
// stripped for Chrome Web Store compliance.
// ---------------------------------------------------------------------------
(function () {
  'use strict';

  // Reinjection guard: background.js may re-inject this file as a fallback
  // after a browser restart; never run the toolbox/UI layer twice.
  if (document.documentElement.hasAttribute("vd-content-loaded")) return;
  document.documentElement.setAttribute("vd-content-loaded", "1");

  
  /*!
   * Before using this script, please make sure to read the information provided
   * in the @description section, which includes an overview of the script’s
   * features and the privacy notice. By continuing to use this script, you
   * acknowledge that you have read and understood the relevant content.
   * If you do not agree, please stop using the script immediately.
   *
   * 
   * Copyright (c) 2024 - 2026, Thalrien.vx,CY Fung.
   * All rights reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */


  var css_248z$2 = "@keyframes relatedElementProvided{0%{background-position-x:3px}to{background-position-x:4px}}html[tabview-loaded=icp] #related.ytd-watch-flexy{animation:relatedElementProvided 1ms linear 0s 1 normal forwards}html[tabview-loaded=icp] #right-tabs #related.ytd-watch-flexy,html[tabview-loaded=icp] #right-tabs ytd-expander#expander,html[tabview-loaded=icp] [hidden] #related.ytd-watch-flexy,html[tabview-loaded=icp] [hidden] ytd-expander#expander,html[tabview-loaded=icp] ytd-comments ytd-expander#expander{animation:initial}#secondary.ytd-watch-flexy{position:relative}#secondary-inner.style-scope.ytd-watch-flexy{height:100%}ytd-watch-flexy #secondary{--tyt-secondary-mt:var(--ytd-margin-6x);--tyt-secondary-mb:var(--ytd-margin-6x);--tyt-secondary-mr:var(--ytd-margin-6x)}ytd-watch-flexy[reduced-top-margin] #secondary{--tyt-secondary-mt:var(--ytd-margin-3x);--tyt-secondary-mb:var(--ytd-margin-3x)}secondary-wrapper{border:0;box-sizing:border-box;contain:size style;flex-wrap:nowrap;height:100%;left:0;max-height:calc(100vh - var(--ytd-toolbar-height, 56px));padding:0;padding-bottom:var(--tyt-secondary-mb);padding-right:var(--tyt-secondary-mr);padding-top:var(--tyt-secondary-mt);position:absolute;right:0;top:0}#right-tabs,secondary-wrapper{display:flex;flex-direction:column;margin:0}#right-tabs{flex-grow:1;padding:0;position:relative}[tyt-tab=\"\"] #right-tabs{flex-grow:0}[tyt-tab=\"\"] #right-tabs .tab-content{border:0}#right-tabs .tab-content{flex-grow:1}ytd-watch-flexy[hide-default-text-inline-expander] #primary.style-scope.ytd-watch-flexy ytd-text-inline-expander{display:none}ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden{--comment-pre-load-sizing:90px;border:0;contain:strict;display:block!important;height:var(--comment-pre-load-sizing)!important;left:2px;margin:0;overflow:hidden;padding:0;pointer-events:none!important;position:fixed!important;top:2px;visibility:collapse;width:var(--comment-pre-load-sizing)!important;z-index:-1}ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden ytd-comments#comments>ytd-item-section-renderer#sections{border:0;contain:strict;display:block!important;height:var(--comment-pre-load-sizing);margin:0;overflow:hidden;padding:0;width:var(--comment-pre-load-sizing)}ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden ytd-comments#comments>ytd-item-section-renderer#sections>#contents{border:0;contain:strict;display:flex!important;flex-direction:row;gap:60px;height:var(--comment-pre-load-sizing);margin:0;overflow:hidden;padding:0;width:var(--comment-pre-load-sizing)}ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden ytd-comments#comments #contents{--comment-pre-load-display:none}ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden ytd-comments#comments #contents>:last-child,ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden ytd-comments#comments #contents>:only-of-type{--comment-pre-load-display:block}ytd-watch-flexy:not([keep-comments-scroller]) #tab-comments.tab-content-hidden ytd-comments#comments #contents>*{display:var(--comment-pre-load-display)!important}#right-tabs #material-tabs{border:1px solid var(--ytd-searchbox-legacy-border-color);display:flex;overflow:hidden;padding:0;position:relative}[tyt-tab] #right-tabs #material-tabs{border-radius:var(--tyt-rounded-a1) var(--tyt-rounded-a1) var(--tyt-rounded-a1) var(--tyt-rounded-a1)}[tyt-tab^=\"#\"] #right-tabs #material-tabs{border-radius:var(--tyt-rounded-a1) var(--tyt-rounded-a1) 0 0}ytd-watch-flexy:not([is-two-columns_]) #right-tabs #material-tabs{outline:0}#right-tabs #material-tabs a.tab-btn[tyt-tab-content]>*{pointer-events:none}#right-tabs #material-tabs a.tab-btn[tyt-tab-content]>.font-size-right{display:none;pointer-events:auto}ytd-watch-flexy #right-tabs .tab-content{border:1px solid var(--ytd-searchbox-legacy-border-color);border-radius:0 0 var(--tyt-rounded-a1) var(--tyt-rounded-a1);border-top:0;box-sizing:border-box;display:block;display:flex;flex-direction:row;overflow:hidden;padding:0;position:relative;top:0}ytd-watch-flexy:not([is-two-columns_]) #right-tabs .tab-content{height:100%}ytd-watch-flexy #right-tabs .tab-content-cld{--tab-content-padding:var(--ytd-margin-4x);box-sizing:border-box;contain:layout paint;display:block;overflow:auto;padding:var(--tab-content-padding);position:relative;width:100%}#right-tabs,.tab-content,.tab-content-cld{animation:none;transition:none}#right-tabs #emojis.ytd-commentbox{inset:auto 0 auto 0;width:auto}ytd-watch-flexy[is-two-columns_] #right-tabs .tab-content-cld{contain:size style;height:100%;position:absolute;width:100%}ytd-watch-flexy #right-tabs .tab-content-cld.tab-content-hidden{contain:size layout paint style;display:none;width:100%}@supports (color:var(--tabview-tab-btn-define )){ytd-watch-flexy #right-tabs .tab-btn{background:var(--yt-spec-general-background-a)}html{--tyt-tab-btn-flex-grow:1;--tyt-tab-btn-flex-basis:0%;--tyt-tab-bar-color-1-def:#ff4533;--tyt-tab-bar-color-2-def:var(--yt-sys-color-baseline--genai-4,var(--yt-sys-color-baseline--static-brand-red,var(--accent-color,var(--yt-brand-light-red))));--tyt-tab-bar-color-1:var(--main-color,var(--tyt-tab-bar-color-1-def));--tyt-tab-bar-color-2:var(--main-color,var(--tyt-tab-bar-color-2-def));--tyt-tab-text-primary:var(--yt-sys-color-baseline--text-primary,var(--yt-spec-text-primary));--tyt-tab-text-secondary:var(--yt-sys-color-baseline--text-secondary,var(--yt-spec-text-secondary))}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]{--tyt-tab-btn-color:var(--tyt-tab-text-secondary);background-color:var(--ytd-searchbox-legacy-button-color);border:0;border-bottom:4px solid transparent;color:var(--tyt-tab-btn-color);cursor:pointer;display:inline-block;flex-basis:0%;flex-basis:var(--tyt-tab-btn-flex-basis);flex-grow:1;flex-grow:var(--tyt-tab-btn-flex-grow);flex-shrink:1;font-size:12px;font-weight:500;line-height:18px;overflow:hidden;padding:14px 8px 10px;position:relative;text-align:center;text-decoration:none;text-overflow:clip;text-transform:uppercase;text-transform:var(--yt-button-text-transform,inherit);transition:border .2s linear .1s;white-space:nowrap}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]>svg{fill:var(--iron-icon-fill-color,currentcolor);stroke:var(--iron-icon-stroke-color,none);color:var(--yt-button-color,inherit);height:18px;margin-right:0;opacity:.5;padding-right:0;vertical-align:bottom}ytd-watch-flexy #right-tabs .tab-btn{--tabview-btn-txt-ml:8px}ytd-watch-flexy[tyt-comment-disabled] #right-tabs .tab-btn[tyt-tab-content=\"#tab-comments\"]{--tabview-btn-txt-ml:0px}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]>svg+span{margin-left:var(--tabview-btn-txt-ml)}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content] svg{pointer-events:none}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content].active{--tyt-tab-btn-color:var(--tyt-tab-text-primary);background-color:var(--ytd-searchbox-legacy-button-focus-color);border-bottom-color:var(--tyt-tab-bar-color-1);border-bottom:2px solid var(--tyt-tab-bar-color-2);font-weight:500;outline:0}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content].active svg{opacity:.9}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]:not(.active):hover{--tyt-tab-btn-color:var(--tyt-tab-text-primary);background-color:var(--ytd-searchbox-legacy-button-hover-color)}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]:not(.active):hover svg{opacity:.9}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]{user-select:none!important}ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content].tab-btn-hidden{display:none}ytd-watch-flexy[tyt-comment-disabled] #right-tabs .tab-btn[tyt-tab-content=\"#tab-comments\"],ytd-watch-flexy[tyt-comment-disabled] #right-tabs .tab-btn[tyt-tab-content=\"#tab-comments\"]:hover{--tyt-tab-btn-color:var(--yt-sys-color-baseline--text-disabled,var(--yt-spec-text-disabled))}ytd-watch-flexy[tyt-comment-disabled] #right-tabs .tab-btn[tyt-tab-content=\"#tab-comments\"] span#tyt-cm-count:empty{display:none}ytd-watch-flexy #right-tabs .tab-btn span#tyt-cm-count:empty:after{color:currentColor;display:inline-block;font-size:inherit;text-align:left;transform:scaleX(.8);width:4em}}@supports (color:var(--tyt-cm-count-define )){ytd-watch-flexy{--tyt-x-loading-content-letter-spacing:2px}html{--tabview-text-loading:\"Loading\";--tabview-text-fetching:\"Fetching\";--tabview-panel-loading:var(--tabview-text-loading)}html:lang(ja){--tabview-text-loading:\"読み込み中\";--tabview-text-fetching:\"フェッチ..\"}html:lang(ko){--tabview-text-loading:\"로딩..\";--tabview-text-fetching:\"가져오기..\"}html:lang(zh-Hant){--tabview-text-loading:\"載入中\";--tabview-text-fetching:\"擷取中\"}html:lang(zh-Hans){--tabview-text-loading:\"加载中\";--tabview-text-fetching:\"抓取中\"}html:lang(ru){--tabview-text-loading:\"Загрузка\";--tabview-text-fetching:\"Получение\"}ytd-watch-flexy #right-tabs .tab-btn span#tyt-cm-count:empty:after{content:var(--tabview-text-loading);letter-spacing:var(--tyt-x-loading-content-letter-spacing)}}@supports (color:var(--tabview-font-size-btn-define )){.font-size-right{align-content:space-evenly;bottom:0;display:inline-flex;flex-direction:column;justify-content:space-evenly;padding:4px 0;pointer-events:none;position:absolute;right:0;top:0;width:16px}html body ytd-watch-flexy.style-scope .font-size-btn{user-select:none!important}.font-size-btn{--tyt-font-size-btn-display:none;background-color:var(--yt-spec-badge-chip-background);box-sizing:border-box;color:var(--tyt-tab-text-secondary);cursor:pointer;display:var(--tyt-font-size-btn-display,none);font-family:Menlo,Lucida Console,Monaco,Consolas,monospace;font-weight:900;height:12px;line-height:100%;margin:0;padding:0;pointer-events:all;position:relative;transform-origin:left top;transition:background-color 90ms linear,color 90ms linear;width:12px}.font-size-btn:hover{background-color:var(--tyt-tab-text-primary);color:var(--yt-spec-general-background-a)}@supports (zoom:0.5){.tab-btn .font-size-btn{--tyt-font-size-btn-display:none}.tab-btn.active:hover .font-size-btn{--tyt-font-size-btn-display:inline-block}}}body ytd-watch-flexy:not([is-two-columns_]) #columns.ytd-watch-flexy{flex-direction:column}body ytd-watch-flexy:not([is-two-columns_]) #secondary.ytd-watch-flexy{box-sizing:border-box;display:block;width:100%}body ytd-watch-flexy:not([is-two-columns_]) #secondary.ytd-watch-flexy secondary-wrapper{contain:content;height:auto;padding-left:var(--ytd-margin-6x)}body ytd-watch-flexy:not([is-two-columns_]) #secondary.ytd-watch-flexy secondary-wrapper #right-tabs{overflow:auto}[tyt-chat=\"+\"]{--tyt-chat-grow:1}[tyt-chat=\"+\"] secondary-wrapper>[tyt-chat-container]{display:flex;flex-direction:column;flex-grow:var(--tyt-chat-grow);flex-shrink:0}[tyt-chat=\"+\"] secondary-wrapper>[tyt-chat-container]>#chat{flex-grow:var(--tyt-chat-grow)}ytd-watch-flexy[is-two-columns_]:not([theater]) #columns.style-scope.ytd-watch-flexy{min-height:calc(100vh - var(--ytd-toolbar-height, 56px))}ytd-watch-flexy[is-two-columns_]:not([full-bleed-player]) ytd-live-chat-frame#chat{height:auto!important;min-height:auto!important}ytd-watch-flexy[tyt-tab^=\"#\"]:not([is-two-columns_]):not([tyt-chat=\"+\"]) #right-tabs{min-height:var(--ytd-watch-flexy-chat-max-height)}body ytd-watch-flexy:not([is-two-columns_]) #chat.ytd-watch-flexy{margin-top:0}body ytd-watch-flexy:not([is-two-columns_]) ytd-watch-metadata.ytd-watch-flexy{margin-bottom:0}ytd-watch-metadata.ytd-watch-flexy ytd-metadata-row-container-renderer{display:none}#tab-info [show-expand-button] #expand-sizer.ytd-text-inline-expander{visibility:initial}#tab-info #collapse.button.ytd-text-inline-expander{display:none}#tab-info #social-links.style-scope.ytd-video-description-infocards-section-renderer>#left-arrow-container.ytd-video-description-infocards-section-renderer>#left-arrow,#tab-info #social-links.style-scope.ytd-video-description-infocards-section-renderer>#right-arrow-container.ytd-video-description-infocards-section-renderer>#right-arrow{border:6px solid transparent;opacity:.65}#tab-info #social-links.style-scope.ytd-video-description-infocards-section-renderer>#left-arrow-container.ytd-video-description-infocards-section-renderer>#left-arrow:hover,#tab-info #social-links.style-scope.ytd-video-description-infocards-section-renderer>#right-arrow-container.ytd-video-description-infocards-section-renderer>#right-arrow:hover{opacity:1}#tab-info #social-links.style-scope.ytd-video-description-infocards-section-renderer>div#left-arrow-container:before{background:transparent;content:\"\";display:block;height:40px;left:-20px;position:absolute;top:0;width:40px;z-index:-1}#tab-info #social-links.style-scope.ytd-video-description-infocards-section-renderer>div#right-arrow-container:before{background:transparent;content:\"\";display:block;height:40px;position:absolute;right:-20px;top:0;width:40px;z-index:-1}body ytd-watch-flexy[is-two-columns_][tyt-egm-panel_] #columns.style-scope.ytd-watch-flexy #panels.style-scope.ytd-watch-flexy{display:flex;flex-direction:column;flex-grow:1;flex-shrink:0}body ytd-watch-flexy[is-two-columns_][tyt-egm-panel_] #columns.style-scope.ytd-watch-flexy #panels.style-scope.ytd-watch-flexy ytd-engagement-panel-section-list-renderer[target-id][visibility=ENGAGEMENT_PANEL_VISIBILITY_EXPANDED]{display:flex;flex-direction:column;flex-grow:1;flex-shrink:0;height:0;max-height:none;min-height:auto}secondary-wrapper [visibility=ENGAGEMENT_PANEL_VISIBILITY_EXPANDED] #body.ytd-transcript-renderer:not(:empty),secondary-wrapper [visibility=ENGAGEMENT_PANEL_VISIBILITY_EXPANDED] #content.ytd-transcript-renderer:not(:empty),secondary-wrapper [visibility=ENGAGEMENT_PANEL_VISIBILITY_EXPANDED] ytd-transcript-renderer:not(:empty){flex-grow:1;height:auto;max-height:none;min-height:auto}secondary-wrapper #content.ytd-engagement-panel-section-list-renderer{position:relative}secondary-wrapper #content.ytd-engagement-panel-section-list-renderer>[panel-target-id]:only-child{contain:style size}secondary-wrapper #content.ytd-engagement-panel-section-list-renderer ytd-transcript-segment-list-renderer.ytd-transcript-search-panel-renderer{contain:strict;flex-grow:1}secondary-wrapper #content.ytd-engagement-panel-section-list-renderer ytd-transcript-segment-renderer.style-scope.ytd-transcript-segment-list-renderer,secondary-wrapper #content.ytd-engagement-panel-section-list-renderer ytd-transcript-segment-renderer.style-scope.ytd-transcript-segment-list-renderer>.segment{contain:layout paint style}body ytd-watch-flexy[theater] #secondary.ytd-watch-flexy{margin-top:var(--ytd-margin-3x);padding-top:0}body ytd-watch-flexy[theater] secondary-wrapper{margin-top:0;padding-top:0}body ytd-watch-flexy[theater] #chat.ytd-watch-flexy{margin-bottom:var(--ytd-margin-2x)}#tab-comments ytd-comments#comments [field-of-cm-count]{margin-top:0}#tab-info>ytd-expandable-video-description-body-renderer{margin-bottom:var(--ytd-margin-3x)}#tab-info [class]:last-child{margin-bottom:0;padding-bottom:0}#tab-info ytd-rich-metadata-row-renderer ytd-rich-metadata-renderer{max-width:none}ytd-watch-flexy[is-two-columns_] secondary-wrapper #chat.ytd-watch-flexy{margin-bottom:var(--ytd-margin-3x)}ytd-watch-flexy[tyt-tab] tp-yt-paper-tooltip{contain:content;white-space:nowrap}ytd-watch-info-text tp-yt-paper-tooltip.style-scope.ytd-watch-info-text{margin-bottom:-300px;margin-top:-96px}[hide-default-text-inline-expander] #bottom-row #description.ytd-watch-metadata{font-size:1.2rem;line-height:1.8rem}[hide-default-text-inline-expander] #bottom-row #description.ytd-watch-metadata yt-animated-rolling-number{font-size:inherit}[hide-default-text-inline-expander] #bottom-row #description.ytd-watch-metadata #info-container.style-scope.ytd-watch-info-text{align-items:center}ytd-watch-flexy[hide-default-text-inline-expander]{--tyt-bottom-watch-metadata-margin:6px}[hide-default-text-inline-expander] #bottom-row #description.ytd-watch-metadata>#description-inner.ytd-watch-metadata{margin:6px 12px}[hide-default-text-inline-expander] ytd-watch-metadata[title-headline-xs] h1.ytd-watch-metadata{font-size:1.8rem}ytd-watch-flexy[is-two-columns_][hide-default-text-inline-expander] #below.style-scope.ytd-watch-flexy ytd-merch-shelf-renderer{border:0;margin:0;padding:0}ytd-watch-flexy[is-two-columns_][hide-default-text-inline-expander] #below.style-scope.ytd-watch-flexy ytd-watch-metadata.ytd-watch-flexy{margin-bottom:6px}#tab-info yt-video-attribute-view-model .yt-video-attribute-view-model--horizontal .yt-video-attribute-view-model__link-container .yt-video-attribute-view-model__hero-section{flex-shrink:0}#tab-info yt-video-attribute-view-model .yt-video-attribute-view-model__overflow-menu{background:var(--yt-emoji-picker-category-background-color);border-radius:99px}#tab-info yt-video-attribute-view-model .yt-video-attribute-view-model--image-square.yt-video-attribute-view-model--image-large .yt-video-attribute-view-model__hero-section{max-height:128px}#tab-info yt-video-attribute-view-model .yt-video-attribute-view-model--image-large .yt-video-attribute-view-model__hero-section{max-width:128px}#tab-info ytd-reel-shelf-renderer #items.yt-horizontal-list-renderer ytd-reel-item-renderer.yt-horizontal-list-renderer{max-width:142px}ytd-watch-info-text#ytd-watch-info-text.style-scope.ytd-watch-metadata #date-text.style-scope.ytd-watch-info-text,ytd-watch-info-text#ytd-watch-info-text.style-scope.ytd-watch-metadata #view-count.style-scope.ytd-watch-info-text{align-items:center}ytd-watch-info-text:not([detailed]) #info.ytd-watch-info-text a.yt-simple-endpoint.yt-formatted-string{pointer-events:none}body ytd-app>ytd-popup-container>tp-yt-iron-dropdown>#contentWrapper>[slot=dropdown-content]{backdrop-filter:none}#tab-info [tyt-clone-refresh-count]{overflow:visible!important}#tab-info #items.ytd-horizontal-card-list-renderer yt-video-attribute-view-model.ytd-horizontal-card-list-renderer{contain:layout}#tab-info #thumbnail-container.ytd-structured-description-channel-lockup-renderer,#tab-info ytd-media-lockup-renderer[is-compact] #thumbnail-container.ytd-media-lockup-renderer{flex-shrink:0}secondary-wrapper ytd-donation-unavailable-renderer{--ytd-margin-6x:var(--ytd-margin-2x);--ytd-margin-5x:var(--ytd-margin-2x);--ytd-margin-4x:var(--ytd-margin-2x);--ytd-margin-3x:var(--ytd-margin-2x)}[tyt-no-less-btn] #less{display:none}.tyt-metadata-hover-resized #analytics-button,.tyt-metadata-hover-resized #purchase-button,.tyt-metadata-hover-resized #sponsor-button,.tyt-metadata-hover-resized #subscribe-button{display:none!important}.tyt-metadata-hover #upload-info{flex-basis:100vw;flex-shrink:0;max-width:max-content;min-width:max-content}#tab-info ytd-structured-description-playlist-lockup-renderer[collections] #playlist-thumbnail.style-scope.ytd-structured-description-playlist-lockup-renderer{max-width:100%}#tab-info ytd-structured-description-playlist-lockup-renderer[collections] #lockup-container.ytd-structured-description-playlist-lockup-renderer{padding:1px}#tab-info ytd-structured-description-playlist-lockup-renderer[collections] #thumbnail.ytd-structured-description-playlist-lockup-renderer{outline:1px solid hsla(0,0%,50%,.5)}ytd-live-chat-frame#chat[collapsed] ytd-message-renderer~#show-hide-button.ytd-live-chat-frame>ytd-toggle-button-renderer.ytd-live-chat-frame{padding:0}.tyt-info-invisible{display:none}[tyt-playlist-expanded] secondary-wrapper>ytd-playlist-panel-renderer#playlist{flex-grow:1;flex-shrink:1;max-height:unset!important;overflow:auto}[tyt-playlist-expanded] secondary-wrapper>ytd-playlist-panel-renderer#playlist>#container{max-height:unset!important}secondary-wrapper ytd-playlist-panel-renderer{--ytd-margin-6x:var(--ytd-margin-3x)}ytd-watch-flexy[theater] ytd-playlist-panel-renderer[collapsible][collapsed] .header.ytd-playlist-panel-renderer{padding:6px 8px}ytd-watch-flexy[theater] #playlist.ytd-watch-flexy{margin-bottom:var(--ytd-margin-2x)}ytd-watch-flexy[theater] #right-tabs .tab-btn[tyt-tab-content]{border-bottom:0 solid transparent;padding:8px 4px 6px}ytd-watch-flexy{--tyt-bottom-watch-metadata-margin:12px}ytd-watch-flexy[rounded-info-panel],ytd-watch-flexy[rounded-player-large]{--tyt-rounded-a1:${VAL_ROUNDED_A1}px}#bottom-row.style-scope.ytd-watch-metadata .item.ytd-watch-metadata{margin-right:var(--tyt-bottom-watch-metadata-margin,12px);margin-top:var(--tyt-bottom-watch-metadata-margin,12px)}#cinematics{contain:layout style size}body[data-ytlstm-theater-mode] #secondary-inner[class]>secondary-wrapper[class]:not(#chat-container):not(#chat){display:flex!important}body[data-ytlstm-theater-mode] secondary-wrapper{all:unset;height:100vh}body[data-ytlstm-theater-mode] #right-tabs{display:none}body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] [tyt-chat=\"+\"]{--tyt-chat-grow:unset}body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] #chat-container.style-scope,body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] #columns.style-scope.ytd-watch-flexy,body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] #secondary-inner.style-scope.ytd-watch-flexy,body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] #secondary.style-scope.ytd-watch-flexy,body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] [tyt-chat-container].style-scope,body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] secondary-wrapper{pointer-events:none}body[data-ytlstm-theater-mode] [data-ytlstm-chat-over-video] #chat[class]{pointer-events:auto}@supports (color:var(--tyt-fix-20251124 )){#below ytd-watch-metadata .ytTextCarouselItemViewModelImageType{height:16px;width:16px}#below ytd-watch-metadata yt-text-carousel-item-view-model{column-gap:6px}#below ytd-watch-metadata ytd-watch-info-text#ytd-watch-info-text{font-size:inherit;line-height:inherit}}";

  var css_248z$1 = "[tyt-tab] #right-tabs #material-tabs,[tyt-tab^=\"#\"] #right-tabs #material-tabs{border-radius:12px 12px 0 0!important}ytd-watch-flexy #right-tabs .tab-content{border-radius:0 0 12px 12px!important}ytd-watch-flexy[is-two-columns_] #right-tabs .tab-content-cld{scrollbar-color:rgba(0,0,0,.25) transparent;scrollbar-width:thin}ytd-watch-flexy[is-two-columns_] #right-tabs .tab-content-cld::-webkit-scrollbar{width:4px}ytd-watch-flexy[is-two-columns_] #right-tabs .tab-content-cld::-webkit-scrollbar-thumb{background-color:rgba(0,0,0,.25);border-radius:4px}ytd-watch-flexy[is-two-columns_] #right-tabs .tab-content-cld::-webkit-scrollbar-track{background:transparent}";

  // TubeLoft: animated sidebar tab bar. A JS-driven sliding pill indicator
  // (see the controller near the bottom of this file) moves between tabs with
  // a spring easing; the container is a glass chip and tab content fades in.
  const css_vd_tabs = `
    [tyt-tab] #right-tabs #material-tabs,
    #right-tabs #material-tabs {
      border: 1px solid rgba(127, 127, 127, 0.15) !important;
      border-radius: 999px !important;
      background: var(--yt-spec-badge-chip-background, rgba(127, 127, 127, 0.12));
      /* No backdrop-filter here: when any overlay (tooltip, sort dropdown)
         appears, Chrome resamples backdrop-filter surfaces from stale frames
         and paints ghost shadow streaks along the capsule edges. */
      padding: 4px !important;
      gap: 2px;
    }
    #right-tabs #material-tabs[data-vd-theme="dark"] {
      border-color: rgba(255, 255, 255, 0.08) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 10px rgba(0, 0, 0, 0.25) !important;
    }
    #right-tabs #material-tabs[data-vd-theme="light"] {
      border-color: rgba(0, 0, 0, 0.08) !important;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 10px rgba(0, 0, 0, 0.08) !important;
    }
    #vd-tab-indicator {
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 0;
      border-radius: 999px;
      transform: translateX(0);
      transition: transform 0.38s cubic-bezier(0.34, 1.3, 0.4, 1), width 0.38s cubic-bezier(0.34, 1.3, 0.4, 1);
      will-change: transform, width;
      z-index: 0;
      pointer-events: none;
    }
    #right-tabs #material-tabs[data-vd-theme="dark"] #vd-tab-indicator {
      background: #f1f1f1;
      box-shadow: 0 2px 14px rgba(255, 255, 255, 0.25), 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    #right-tabs #material-tabs[data-vd-theme="light"] #vd-tab-indicator {
      background: #272727;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.22), 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content] {
      position: relative;
      z-index: 1;
      border: 0 !important;
      border-bottom: 0 !important;
      border-radius: 999px !important;
      background-color: transparent !important;
      color: var(--yt-sys-color-baseline--text-secondary, var(--yt-spec-text-secondary, #aaa)) !important;
      text-transform: none !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      line-height: 20px !important;
      letter-spacing: normal !important;
      padding: 8px 14px !important;
      transition: color 0.2s ease !important;
    }
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content] > svg {
      height: 16px !important;
      width: 16px !important;
      opacity: 0.7 !important;
      transition: transform 0.3s cubic-bezier(0.34, 1.5, 0.5, 1), opacity 0.2s ease !important;
    }
    /* Hover text follows the page's primary text token. 2026 YouTube removed
       the --yt-spec-* palette entirely, so a bare var(--yt-spec-text-primary,
       #f1f1f1) always fell back to near-white — invisible on the light theme
       ("comment label turns transparent on hover"). Chain the new baseline
       token first so both themes resolve to a contrasting color. */
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]:not(.active):hover {
      color: var(--yt-sys-color-baseline--text-primary, var(--yt-spec-text-primary, #f1f1f1)) !important;
    }
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]:not(.active):hover > svg {
      opacity: 0.95 !important;
    }
    ytd-watch-flexy #right-tabs #material-tabs[data-vd-theme="dark"] .tab-btn[tyt-tab-content].active {
      color: #0f0f0f !important;
    }
    ytd-watch-flexy #right-tabs #material-tabs[data-vd-theme="light"] .tab-btn[tyt-tab-content].active {
      color: #ffffff !important;
    }
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content].active {
      font-weight: 600 !important;
    }
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content].active > svg {
      opacity: 1 !important;
      transform: scale(1.15) !important;
    }
    ytd-watch-flexy[tyt-comment-disabled] #right-tabs .tab-btn[tyt-tab-content="#tab-comments"] {
      color: var(--yt-sys-color-baseline--text-disabled, var(--yt-spec-text-disabled, #909090)) !important;
    }
    ytd-watch-flexy #right-tabs .tab-content {
      border: 0 !important;
      border-radius: 12px !important;
      margin-top: 8px;
    }
    ytd-watch-flexy #right-tabs .tab-content-cld:not(.tab-content-hidden) {
      animation: vdTabFadeUp 0.28s ease;
    }
    @keyframes vdTabFadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* ── Queue ("接下来播放") panel inside the sidebar ─────────────────
       The panel lives as a flex sibling of #right-tabs in secondary-wrapper.
       In the narrowed sidebar its header rows wrap CJK text per character
       ("接下来播放:" stacks vertically). Force the panel to full width and
       make the header rows nowrap + ellipsis so both the collapsed bar and
       the expanded list stay readable. */
    secondary-wrapper > ytd-playlist-panel-renderer#playlist {
      align-self: stretch !important;
      max-width: 100% !important;
      min-width: 0 !important;
      width: 100% !important;
    }
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #container,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist .header,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #header-contents,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #header-top-row,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #header-description,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #publisher-container {
      min-width: 0 !important;
    }
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #header-top-row,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #header-description,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #next-video-title,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #publisher-container {
      display: flex !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
    }
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #next-video-title {
      min-width: 0 !important;
    }
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #next-label {
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
    secondary-wrapper > ytd-playlist-panel-renderer#playlist #next-video-title yt-formatted-string,
    secondary-wrapper > ytd-playlist-panel-renderer#playlist .byline-title {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      min-width: 0 !important;
    }
    secondary-wrapper > ytd-playlist-panel-renderer#playlist .byline-title {
      flex-shrink: 0 !important;
    }
    /* ── Miniplayer "展开" tooltip stacking vertically ─────────────────
       The visible label is the expand button's player tooltip
       (#movie_player .ytp-tooltip → .ytp-tooltip-text). YouTube's own JS
       stamps an inline max-width:0px on it and this tooltip variant has
       no white-space:nowrap rule, so the two CJK characters stack. Force a
       single line inside the miniplayer. */
    ytd-miniplayer #movie_player .ytp-tooltip,
    .ytdMiniplayerComponentHost #movie_player .ytp-tooltip,
    ytd-miniplayer-player-container #movie_player .ytp-tooltip {
      max-width: none !important;
    }
    ytd-miniplayer #movie_player .ytp-tooltip .ytp-tooltip-text,
    ytd-miniplayer #movie_player .ytp-tooltip .ytp-tooltip-bottom-text,
    ytd-miniplayer #movie_player .ytp-tooltip .ytp-tooltip-text-wrapper,
    .ytdMiniplayerComponentHost #movie_player .ytp-tooltip .ytp-tooltip-text,
    .ytdMiniplayerComponentHost #movie_player .ytp-tooltip .ytp-tooltip-bottom-text,
    .ytdMiniplayerComponentHost #movie_player .ytp-tooltip .ytp-tooltip-text-wrapper,
    ytd-miniplayer-player-container #movie_player .ytp-tooltip .ytp-tooltip-text,
    ytd-miniplayer-player-container #movie_player .ytp-tooltip .ytp-tooltip-bottom-text,
    ytd-miniplayer-player-container #movie_player .ytp-tooltip .ytp-tooltip-text-wrapper {
      white-space: nowrap !important;
    }
    /* Belt and braces: if a future player build renames the miniplayer
       wrapper, keep at least the tooltip text itself non-wrapping when it
       sits in the miniplayer's top-left control area. */
    #movie_player .ytp-miniplayer-ui ~ .ytp-tooltip .ytp-tooltip-text {
      white-space: nowrap !important;
    }
    /* ── Sort-menu tooltip collapses into a black hairline ─────────────────
       The engine applies contain:content to every paper-tooltip while the
       tab layout is active ([tyt-tab]); containment stops the bubble's
       content from sizing its wrapper, so the dark bubble renders as a thin
       vertical line when hovering "排序方式". Undo the containment here
       (later cascade, same specificity — no !important needed). */
    ytd-watch-flexy[tyt-tab] #right-tabs tp-yt-paper-tooltip,
    ytd-watch-flexy[tyt-tab] secondary-wrapper tp-yt-paper-tooltip {
      contain: none;
    }
  `;

  const VAL_ROUNDED_A1 = 12;
  const styles = {
    main: css_248z$2.replace("${VAL_ROUNDED_A1}", VAL_ROUNDED_A1) + css_248z$1 + css_vd_tabs
  };

  const StorageUtil = {
    keys: {
      youtube: {
        videoPlaySpeed: "yt/videoPlaySpeed",
        functionState: "yt/functionState_01",
        videoLoop: "py/videoLoop",
        theme: "yt/theme"
      }
    },
    getDefaultFunctionState: function() {
      return {
        isOpenCommentTable: true,
        isOpenThemeProgressBar: true,
        isOpenSpeedControl: true,
        isOpenMarkOrRemoveAd: true
      };
    },
    getValue: function(key, defaultValue) {
      return GM_getValue(key, defaultValue);
    },
    setValue: function(key, value) {
      GM_setValue(key, value);
    }
  };

  // [extension port] `executionScript` (Tabview-Youtube core, lines 170-3673 of
  // the original userscript) has been moved verbatim to tabview-main.js, which
  // runs in the page (MAIN) world as a declared content script.

  var css_248z = `
    /* ── TubeLoft neon progress bar ───────────────────────────── */
    .html5-progress-list,
    .ytp-progress-list,
    .video-ads .html5-progress-list,
    .video-ads .ytp-progress-list {
      height: 4px !important;
      border-radius: 2px !important;
    }
    .html5-progress-bar,
    .ytp-progress-bar {
      margin-top: 0 !important;
      border-radius: 2px !important;
    }
    /* played fill: flowing neon gradient (2 seamless cycles, loops left) */
    .html5-play-progress,
    .ytp-play-progress {
      background: linear-gradient(90deg,
          #22d3ee 0%, #8b5cf6 16.66%, #ec4899 33.33%,
          #22d3ee 50%, #8b5cf6 66.66%, #ec4899 83.33%, #22d3ee 100%) !important;
      background-size: 200% 100% !important;
      border-radius: 2px !important;
      animation: vdNeonFlow 5s linear infinite !important;
      box-shadow: 0 0 8px rgba(139, 92, 246, 0.55), 0 0 16px rgba(34, 211, 238, 0.3);
    }
    @keyframes vdNeonFlow {
      from { background-position-x: 0%; }
      to   { background-position-x: 100%; }
    }
    /* buffered */
    .html5-load-progress,
    .ytp-load-progress {
      background: rgba(255, 255, 255, 0.32) !important;
      border-radius: 2px !important;
    }
    /* hover preview segment */
    .ytp-hover-progress {
      background: rgba(255, 255, 255, 0.16) !important;
      border-radius: 2px !important;
    }
    /* playhead: subtle glowing dot, enlarges on hover */
    .html5-scrubber-button,
    .ytp-scrubber-button {
      background: #ffffff !important;
      border: none !important;
      border-radius: 50% !important;
      width: 13px !important;
      height: 13px !important;
      margin-left: -6px !important;
      margin-top: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      image-rendering: auto !important;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85),
        0 0 9px rgba(139, 92, 246, 0.85),
        0 0 18px rgba(34, 211, 238, 0.5);
      transition: transform 0.16s ease, box-shadow 0.16s ease;
    }
    .ytp-progress-bar-container:hover .html5-scrubber-button,
    .ytp-progress-bar-container:hover .ytp-scrubber-button {
      transform: translateY(-50%) scale(1.4) !important;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 1),
        0 0 14px rgba(236, 72, 153, 0.9),
        0 0 26px rgba(34, 211, 238, 0.7);
    }
    /* subtle halo on the whole track while hovering */
    .ytp-progress-bar-container:hover .ytp-progress-list {
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
    }
    /* keep the pixelated look gone */
    .ytp-progress-bar-container:hover .ytp-load-progress,
    .ytp-progress-bar-container:hover .ytp-scrubber-button {
      image-rendering: auto !important;
    }
    /* live dot + volume track, neutral */
    .ytp-progress-linear-live-header {
      border-radius: 50% !important;
    }
    .ytp-volume-slider-track {
      background: rgba(255, 255, 255, 0.28) !important;
    }
  `;

  const ThemeProgressbar = {
    start: function() {
      if (!/youtube\.com/.test(window.location.host)) {
        return;
      }
      GM_addStyle(css_248z);
    }
  };

  const commonUtil = {
    onPageLoad: function(callback) {
      if (document.readyState === "complete") {
        callback();
      } else {
        window.addEventListener("DOMContentLoaded", callback, { once: true });
        window.addEventListener("load", callback, { once: true });
      }
    },
    addStyle: function(style) {
      GM_addStyle(style);
    },
    waitForElementByInterval: function(selector, target = document.body, allowEmpty = true, delay = 10, maxDelay = 10 * 1e3) {
      return new Promise((resolve, reject) => {
        let totalDelay = 0;
        let element = target.querySelector(selector);
        let result = allowEmpty ? !!element : !!element && !!element.innerHTML;
        if (result) {
          resolve(element);
        }
        const elementInterval = setInterval(() => {
          if (totalDelay >= maxDelay) {
            clearInterval(elementInterval);
            resolve(null);
          }
          element = target.querySelector(selector);
          result = allowEmpty ? !!element : !!element && !!element.innerHTML;
          if (result) {
            clearInterval(elementInterval);
            resolve(element);
          } else {
            totalDelay += delay;
          }
        }, delay);
      });
    }
  };

  const SpeedControl = {
    currentSpeed: 1,
    activeAnimationId: null,
    run: function() {
      if (!/youtube\.com/.test(window.location.host)) {
        return new Promise((resolve) => {
          resolve();
        });
      }
      return new Promise((resolve) => {
        const speedControl = StorageUtil.getValue(StorageUtil.keys.youtube.functionState.speedControl, true);
        if (!speedControl) {
          resolve();
          return;
        }
        const storageSpeed = StorageUtil.getValue(StorageUtil.keys.youtube.videoPlaySpeed, 1);
        this.currentSpeed = parseFloat(storageSpeed);
        this.insertStyle();
        commonUtil.onPageLoad(async () => {
          await this.genrate();
          this.setVideoRate(storageSpeed);
          this.videoObserver();
          resolve();
        });
      });
    },
    insertStyle: function() {
      const speedStyles = `
        .vd-speed-btn{
          width:auto!important;
          min-width:3.4em;
          padding:0 .35em!important;
          float:left;
          text-align:center!important;
          display:flex!important;
          justify-content:center!important;
          align-items:center!important;
          border-radius:6px!important;
          font-size:13px!important;
          font-weight:600!important;
        }
        .vd-speed-btn:hover{
          color:#fff!important;
        }
        #vd-speed-overlay{
          position:absolute!important;
          margin:auto!important;
          top:0!important;
          right:0!important;
          bottom:0!important;
          left:0!important;
          border-radius:50%!important;
          background:rgba(0,0,0,.55)!important;
          backdrop-filter:blur(4px);
          -webkit-backdrop-filter:blur(4px);
          font-size:26px!important;
          font-weight:600!important;
          color:#fff!important;
          z-index:99999999999!important;
          opacity:.9!important;
          width:84px!important;
          height:84px!important;
          line-height:84px!important;
          text-align:center!important;
          padding:0!important;
        }
        .vd-speed-menu{
          position:absolute!important;
          background:var(--yt-spec-static-overlay-background-heavy,rgba(19,19,19,.95))!important;
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
          color:#fff!important;
          border-radius:10px!important;
          border:1px solid rgba(255,255,255,.08);
          box-sizing:border-box!important;
          box-shadow:0 8px 28px rgba(0,0,0,.4)!important;
          z-index:999999999999!important;
          display:none;
          padding:6px!important;
          font-weight:600!important;
        }
        .vd-speed-menu .vd-speed-item{
          cursor:pointer!important;
          min-width:56px;
          padding:5px 14px!important;
          border-radius:6px!important;
          font-size:12.5px!important;
          text-align:center!important;
          transition:background .15s ease;
        }
        .vd-speed-menu .vd-speed-item:hover{
          background:rgba(255,255,255,.12)!important;
        }
        .vd-speed-menu .vd-speed-item.vd-active{
          color:#ff0033!important;
        }
      `;
      commonUtil.addStyle(speedStyles);
    },
    genrate: async function() {
      const speedControlBtn = document.createElement("div");
      speedControlBtn.className = "ytp-button vd-speed-btn";
      const speedText = document.createElement("span");
      speedText.textContent = "" + this.currentSpeed + "×";
      speedControlBtn.appendChild(speedText);
      const player = await commonUtil.waitForElementByInterval("#movie_player");
      if (player) {
        const rightControls = player.querySelector(".ytp-right-controls");
        const existingSpeedBtn = document.querySelector(".vd-speed-btn");
        if (rightControls && !existingSpeedBtn) {
          rightControls.prepend(speedControlBtn);
          this.genrateOptions(speedControlBtn, player);
        }
      }
    },
    genrateOptions: function(button, player) {
      const speedOptions = document.createElement("div");
      speedOptions.id = "vd-speed-menu";
      speedOptions.className = "vd-speed-menu";
      const speeds = ["0.5", "0.75", "1.0", "1.25", "1.5", "2.0", "3.0"];
      speeds.forEach((speed) => {
        const option = document.createElement("div");
        option.className = "vd-speed-item";
        option.textContent = `${speed}x`;
        option.dataset.speed = speed;
        if (parseFloat(speed) === this.currentSpeed) {
          option.classList.add("vd-active");
        }
        speedOptions.appendChild(option);
        option.addEventListener("click", (event) => {
          const speedValue = parseFloat(speed);
          this.speedDisplayText("" + speedValue + "×");
          this.setVideoRate(speedValue);
          this.currentSpeed = speedValue;
          this.updateVideoPlaySpeedStorage(speedValue);
          button.querySelector("span").textContent = "" + speedValue + "×";
          speedOptions.querySelectorAll(".vd-speed-item").forEach((element) => {
            element.classList.remove("vd-active");
          });
          event.target.classList.add("vd-active");
        });
      });
      player.appendChild(speedOptions);
      let isHovering = false;
      button.addEventListener("mouseenter", () => {
        speedOptions.style.display = "block";
        var containerRect = player.getBoundingClientRect();
        var buttonRect = button.getBoundingClientRect();
        var speedOptionsRect = speedOptions.getBoundingClientRect();
        var left = buttonRect.left - containerRect.left - speedOptionsRect.width / 2 + buttonRect.width / 2;
        var top = buttonRect.top - containerRect.top - speedOptions.clientHeight;
        speedOptions.style.left = `${left}px`;
        speedOptions.style.top = `${top}px`;
      });
      button.addEventListener("mouseleave", () => {
        isHovering = false;
        setTimeout(() => {
          if (!isHovering) {
            speedOptions.style.display = "none";
          }
        }, 100);
      });
      speedOptions.addEventListener("mouseenter", () => {
        isHovering = true;
      });
      speedOptions.addEventListener("mouseleave", () => {
        isHovering = false;
        speedOptions.style.display = "none";
      });
    },
    updateVideoPlaySpeedStorage: function(speedValue) {
      StorageUtil.setValue(StorageUtil.keys.youtube.videoPlaySpeed, speedValue);
    },
    speedDisplayText: function(speedText) {
      let elementId = "vd-speed-overlay";
      let element = document.getElementById(elementId);
      if (!element) {
        let mediaElement = document.getElementById("movie_player");
        mediaElement.insertAdjacentHTML("afterbegin", `<div id="${elementId}">${speedText}</div>`);
        element = document.getElementById(elementId);
      } else {
        element.textContent = speedText;
      }
      element.style.display = "block";
      element.style.opacity = 0.8;
      element.style.filter = `alpha(opacity=${0.8 * 100})`;
      this.startFadeoutAnimation(element);
    },
    startFadeoutAnimation: function(element, startOpacity = 0.9, duration = 1500) {
      let opacity = startOpacity;
      const startTime = performance.now();
      if (this.activeAnimationId) {
        cancelAnimationFrame(this.activeAnimationId);
      }
      const fadeStep = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        opacity = startOpacity * (1 - progress);
        element.style.opacity = opacity;
        element.style.filter = `alpha(opacity=${opacity * 100})`;
        if (progress < 1) {
          this.activeAnimationId = requestAnimationFrame(fadeStep);
        } else {
          element.style.display = "none";
          this.activeAnimationId = null;
        }
      };
      this.activeAnimationId = requestAnimationFrame(fadeStep);
    },
    setVideoRate: function(speed) {
      const videoElement = document.querySelector("video");
      if (!videoElement)
        return;
      videoElement.playbackRate = speed;
    },
    videoObserver: function() {
      const checkVideoInterval = setInterval(() => {
        const videoElement = document.querySelector("video");
        if (videoElement) {
          clearInterval(checkVideoInterval);
          const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
              if (mutation.type === "attributes" && mutation.attributeName === "src") {
                videoElement.playbackRate = this.currentSpeed;
              }
            }
          });
          observer.observe(videoElement, {
            attributes: true
          });
        }
      }, 1500);
    }
  };

  const MarkOrRemoveAd = {
    generateRemoveAdElementId: "removeADHTMLElement_" + Math.ceil(Math.random() * 1e8),
    markADHTMLElement: function() {
      if (document.querySelector(this.generateRemoveAdElementId)) {
        return;
      }
      let cssMarkSelectorArr = [
        `#masthead-ad`,
        `ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer)`,
        `.video-ads.ytp-ad-module`,
        `tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)`,
        `ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]`,
        `#related #player-ads`,
        `#related ytd-ad-slot-renderer`,
        `ytd-ad-slot-renderer`,
        `yt-mealbar-promo-renderer`,
        `ytd-popup-container:has(a[href="/premium"])`,
        `ad-slot-renderer`,
        `ytm-companion-ad-renderer`
      ];
      cssMarkSelectorArr.forEach((selector, index) => {
        cssMarkSelectorArr[index] = `${selector} *{text-decoration:line-through!important;text-decoration-thickness:2px!important;}`;
      });
      const cssText = cssMarkSelectorArr.join(" ");
      const style = document.createElement(`style`);
      style.id = this.generateRemoveAdElementId;
      (document.head || document.body).appendChild(style);
      style.appendChild(document.createTextNode(cssText));
    },
    run: function() {
      if (!/youtube\.com/.test(window.location.host)) {
        return;
      }
      commonUtil.onPageLoad(() => {
        this.markADHTMLElement();
      });
    }
  };

  const Dialog = function() {
    const dialogBaseStyle = `
      .vd-mask{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999999999999;animation:vd-fadein .15s ease}
      .vd-dialog{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:400px;width:90%;background:var(--yt-spec-general-background-a,#fff);color:var(--yt-spec-text-primary,#0f0f0f);border:1px solid var(--yt-spec-10-percent-layer,rgba(0,0,0,.1));border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);overflow:hidden;font-family:Roboto,Arial,sans-serif;animation:vd-pop .18s cubic-bezier(.2,.8,.3,1)}
      .vd-dialog-title{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;font-size:16px;font-weight:500;background:var(--yt-spec-brand-background-solid,#fff);border-bottom:1px solid var(--yt-spec-10-percent-layer,rgba(0,0,0,.08))}
      .vd-dialog-close{cursor:pointer;font-size:22px;line-height:1;opacity:.7;user-select:none;padding:0 4px}
      .vd-dialog-close:hover{opacity:1}
      .vd-dialog-body{padding:16px 20px;max-height:60vh;overflow:auto}
      @keyframes vd-fadein{from{opacity:0}to{opacity:1}}
      @keyframes vd-pop{from{opacity:0;transform:translate(-50%,-46%) scale(.96)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    `;
    class Dialog2 {
      constructor() {
        this.mask = document.createElement("div");
        this.dialogStyle = document.createElement("style");
        this.dialogStyle.textContent = dialogBaseStyle;
        this.mask.className = "vd-mask";
        this.content = document.createElement("div");
        this.content.className = "vd-dialog";
        this.mask.appendChild(this.content);
      }
      middleBox(param) {
        this.content.innerHTML = "";
        if (param.hasOwnProperty("direction")) {
          this.content.setAttribute("data-extension-direction", param.direction);
        }
        let title = "";
        if ({}.toString.call(param) === "[object String]") {
          title = param;
        } else if ({}.toString.call(param) === "[object Object]") {
          title = param.title;
        }
        document.body.appendChild(this.mask);
        this.title = document.createElement("div");
        this.title.className = "vd-dialog-title";
        const span = document.createElement("span");
        span.innerText = title;
        span.setAttribute("langue-extension-text", "setting_modal_title");
        this.title.appendChild(span);
        this.closeBtn = document.createElement("span");
        this.closeBtn.className = "vd-dialog-close";
        this.closeBtn.innerText = "\u00d7";
        this.title.appendChild(this.closeBtn);
        this.content.appendChild(this.title);
        this.closeBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.close();
          if (param.onClose) {
            param.onClose();
          }
        };
      }
      showMake(param) {
        this.dialogStyle.textContent = dialogBaseStyle + (param.styleSheet || "");
        document.querySelector("head").appendChild(this.dialogStyle);
        this.middleBox(param);
        this.dialogContent = document.createElement("div");
        this.dialogContent.className = "vd-dialog-body";
        this.dialogContent.innerHTML = param.content;
        this.content.appendChild(this.dialogContent);
        param.onContentReady(this);
      }
      updateTitle(title) {
        if (this.title) {
          this.title.innerText = title;
        }
      }
      close() {
        document.body.removeChild(this.mask);
        document.querySelector("head").removeChild(this.dialogStyle);
      }
      setStyle(ele, styleObj) {
        for (let attr in styleObj) {
          ele.style[attr] = styleObj[attr];
        }
      }
    }
    let dialog = null;
    return function() {
      if (!dialog) {
        dialog = new Dialog2();
      }
      return dialog;
    }();
  };

  const LangueUtil = {
    language: {
      "en": {
        direction: "ltr",
        content: {
          "function_setting_title": "Setting",
          "function_is_comment_table_open": "Enable video details page interface optimization.",
          "function_is_theme_progress_bar_open": "Enable video playback progress bar beautification.",
          "function_is_speed_control_open": "Enable video fast forward (playback speed selectable).",
          "function_is_mark_or_remove_ad_open": "Enable page ad labeling.",
        }
      },
      "ja": {
        direction: "ltr",
        content: {
          "function_setting_title": "設定",
          "function_is_comment_table_open": "動画詳細ページのインターフェース最適化を有効にする。",
          "function_is_theme_progress_bar_open": "動画再生の進行状況バーの装飾を有効にする。",
          "function_is_speed_control_open": "動画の早送り（再生速度選択可能）を有効にする。",
          "function_is_mark_or_remove_ad_open": "ページ広告のラベリングを有効にする。",
        }
      },
      "ko": {
        direction: "ltr",
        content: {
          "function_setting_title": "설정",
          "function_is_comment_table_open": "동영상 상세 페이지 인터페이스 최적화 활성화.",
          "function_is_theme_progress_bar_open": "동영상 재생 진행 바 장식 활성화.",
          "function_is_speed_control_open": "동영상 빨리감기(재생 속도 선택 가능) 활성화.",
          "function_is_mark_or_remove_ad_open": "페이지 광고 라벨링 활성화.",
        }
      },
      "ru": {
        direction: "ltr",
        content: {
          "function_setting_title": "Настройки",
          "function_is_comment_table_open": "Включить оптимизацию интерфейса страницы деталей видео.",
          "function_is_theme_progress_bar_open": "Включить улучшение панели прогресса воспроизведения видео.",
          "function_is_speed_control_open": "Включить перемотку видео (выбор скорости воспроизведения).",
          "function_is_mark_or_remove_ad_open": "Включить маркировку рекламы на странице.",
        }
      },
      "id": {
        direction: "ltr",
        content: {
          "function_setting_title": "Pengaturan",
          "function_is_comment_table_open": "Aktifkan pengoptimalan antarmuka halaman detail video.",
          "function_is_theme_progress_bar_open": "Aktifkan pempercantik bilah progres pemutaran video.",
          "function_is_speed_control_open": "Aktifkan percepatan video (kecepatan pemutaran dapat dipilih).",
          "function_is_mark_or_remove_ad_open": "Aktifkan pelabelan iklan di halaman.",
        }
      },
      "fr": {
        direction: "ltr",
        content: {
          "function_setting_title": "Paramètres",
          "function_is_comment_table_open": "Activer l’optimisation de l’interface de la page de détails de la vidéo.",
          "function_is_theme_progress_bar_open": "Activer l’embellissement de la barre de progression de la vidéo.",
          "function_is_speed_control_open": "Activer l’avance rapide de la vidéo (vitesse de lecture sélectionnable).",
          "function_is_mark_or_remove_ad_open": "Activer l’étiquetage des publicités sur la page.",
        }
      },
      "pt": {
        direction: "ltr",
        content: {
          "function_setting_title": "Configurações",
          "function_is_comment_table_open": "Ativar otimização da interface da página de detalhes do vídeo.",
          "function_is_theme_progress_bar_open": "Ativar embelezamento da barra de progresso do vídeo.",
          "function_is_speed_control_open": "Ativar avanço rápido do vídeo (velocidade de reprodução selecionável).",
          "function_is_mark_or_remove_ad_open": "Ativar rotulagem de anúncios na página.",
        }
      },
      "tr": {
        direction: "ltr",
        content: {
          "function_setting_title": "Ayarlar",
          "function_is_comment_table_open": "Video detay sayfası arayüz optimizasyonunu etkinleştir.",
          "function_is_theme_progress_bar_open": "Video oynatma ilerleme çubuğu güzelleştirmesini etkinleştir.",
          "function_is_speed_control_open": "Video hızlı oynatmayı etkinleştir (oynatma hızı seçilebilir).",
          "function_is_mark_or_remove_ad_open": "Sayfadaki reklam etiketlemesini etkinleştir.",
        }
      },
      "zh-CN": {
        direction: "ltr",
        content: {
          "function_setting_title": "设置",
          "function_is_comment_table_open": "启用视频详情页面界面优化。",
          "function_is_theme_progress_bar_open": "启用视频播放进度条美化。",
          "function_is_speed_control_open": "启用视频快进（播放速度可选择）。",
          "function_is_mark_or_remove_ad_open": "启用页面广告标记。",
        }
      },
      "zh-TW": {
        direction: "ltr",
        content: {
          "function_setting_title": "設定",
          "function_is_comment_table_open": "啟用影片詳情頁面介面優化。",
          "function_is_theme_progress_bar_open": "啟用影片播放進度條美化。",
          "function_is_speed_control_open": "啟用影片快轉（播放速度可選擇）。",
          "function_is_mark_or_remove_ad_open": "啟用頁面廣告標記。",
        }
      }
    },
    getLang: function() {
      const lang = navigator.language || navigator.userLanguage;
      const supportedLanguages = {
        "en": "en",
        "es": "es",
        "fr": "fr",
        "pt": "pt",
        "ru": "ru",
        "ja": "ja",
        "de": "de",
        "ko": "ko",
        "it": "it",
        "id": "id",
        "tr": "tr",
        "pl": "pl",
        "uk": "uk",
        "nl": "nl",
        "vi": "vi",
        "th": "th",
        "ar": "ar",
        "fa": "fa",
        "hi": "hi",
        "ms": "ms",
        "zh-CN": "zh-CN",
        "zh-TW": "zh-TW"
      };
      const langCode = lang.split("-")[0];
      if (langCode === "zh") {
        return lang === "zh-CN" ? "zh-CN" : "zh-TW";
      }
      return supportedLanguages[langCode] || "en";
    },
    getLanguage: function() {
      const lang = this.getLang();
      return this.language[lang] ?? this.language.en;
    }
  };
  const ToolBox = {
    showSettingDialog: function() {
      const functionState = StorageUtil.getValue(StorageUtil.keys.youtube.functionState, {
        isOpenCommentTable: true,
        isOpenThemeProgressBar: true,
        isOpenSpeedControl: true,
        isOpenMarkOrRemoveAd: true
      });
      const language = LangueUtil.getLanguage();
      const styleSheet = `
        .vd-setting-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:12px;background:var(--yt-spec-badge-chip-background,rgba(0,0,0,.05));margin-bottom:10px}
        .vd-setting-row:last-child{margin-bottom:0}
        .vd-setting-name{flex:1;text-align:left;font-size:13px}
        .vd-toggle{width:44px;height:24px;background:var(--yt-spec-text-secondary,#909090);border-radius:12px;position:relative;cursor:pointer;transition:background-color .2s;display:inline-block;flex-shrink:0}
        .vd-toggle:before{content:'';position:absolute;width:20px;height:20px;background:#fff;border-radius:50%;top:2px;left:2px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
        .vd-dialog input[type=checkbox]{display:none}
        .vd-dialog input:checked + .vd-toggle{background:var(--yt-spec-static-brand-red,#ff0033)}
        .vd-dialog input:checked + .vd-toggle:before{transform:translateX(20px)}
      `;
      const content = `
        <div class="vd-setting-row">
          <div class="vd-setting-name" data-i18n="function_is_comment_table_open"></div>
          <div class="setting-switch">
            <input type="checkbox" id="isCommentTableOpen" /><label class="vd-toggle" for="isCommentTableOpen"></label>
          </div>
        </div>
        <div class="vd-setting-row">
          <div class="vd-setting-name" data-i18n="function_is_theme_progress_bar_open"></div>
          <div class="setting-switch">
            <input type="checkbox" id="isThemeProgressBarOpen" /><label class="vd-toggle" for="isThemeProgressBarOpen"></label>
          </div>
        </div>
        <div class="vd-setting-row">
          <div class="vd-setting-name" data-i18n="function_is_speed_control_open"></div>
          <div class="setting-switch">
            <input type="checkbox" id="isSpeedControlOpen" /><label class="vd-toggle" for="isSpeedControlOpen"></label>
          </div>
        </div>
        <div class="vd-setting-row">
          <div class="vd-setting-name" data-i18n="function_is_mark_or_remove_ad_open"></div>
          <div class="setting-switch">
            <input type="checkbox" id="isMarkOrRemoveAdOpen" /><label class="vd-toggle" for="isMarkOrRemoveAdOpen"></label>
          </div>
        </div>
      `;
      Dialog.showMake({
        title: language.content.function_setting_title,
        content,
        styleSheet,
        direction: language.direction,
        onContentReady: function($that) {
          const commentTable = $that.dialogContent.querySelector("#isCommentTableOpen");
          const themeProgressBar = $that.dialogContent.querySelector("#isThemeProgressBarOpen");
          const speedControl = $that.dialogContent.querySelector("#isSpeedControlOpen");
          const markOrRemoveAd = $that.dialogContent.querySelector("#isMarkOrRemoveAdOpen");
          $that.dialogContent.querySelectorAll(".vd-setting-name").forEach((element) => {
            element.textContent = language.content[element.getAttribute("data-i18n")];
          });
          commentTable.checked = functionState.isOpenCommentTable;
          themeProgressBar.checked = functionState.isOpenThemeProgressBar;
          speedControl.checked = functionState.isOpenSpeedControl;
          markOrRemoveAd.checked = functionState.isOpenMarkOrRemoveAd;
          commentTable.addEventListener("change", (e) => {
            functionState.isOpenCommentTable = e.target.checked;
            StorageUtil.setValue(StorageUtil.keys.youtube.functionState, functionState);
          });
          themeProgressBar.addEventListener("change", (e) => {
            functionState.isOpenThemeProgressBar = e.target.checked;
            StorageUtil.setValue(StorageUtil.keys.youtube.functionState, functionState);
          });
          speedControl.addEventListener("change", (e) => {
            functionState.isOpenSpeedControl = e.target.checked;
            StorageUtil.setValue(StorageUtil.keys.youtube.functionState, functionState);
          });
          markOrRemoveAd.addEventListener("change", (e) => {
            functionState.isOpenMarkOrRemoveAd = e.target.checked;
            StorageUtil.setValue(StorageUtil.keys.youtube.functionState, functionState);
          });
        },
        onClose: function() {
          location.reload();
        }
      });
    },
    run: function() {
      return new Promise((resolve) => {
        if (/youtube\.com/.test(window.location.host)) {
          GM_registerMenuCommand("Setting", () => {
            this.showSettingDialog();
          });
          commonUtil.onPageLoad(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
  };

  const {
    isOpenCommentTable,
    isOpenThemeProgressBar,
    isOpenSpeedControl,
    isOpenMarkOrRemoveAd
  } = StorageUtil.getValue(StorageUtil.keys.youtube.functionState, StorageUtil.getDefaultFunctionState());
  /*!
   * credit to Benjamin Philipp
   * MIT
   * original source: https://greasyfork.org/en/scripts/433051-trusted-types-helper
   */
  const overwrite_default = false;
  const passThroughFunc = function(string, sink) {
    return string;
  };
  var TTPName = "passthrough";
  var TTP_default, TTP = { createHTML: passThroughFunc, createScript: passThroughFunc, createScriptURL: passThroughFunc };
  var needsTrustedHTML = false;
  !window.TTP && (() => {
    try {
      if (typeof window.isSecureContext !== "undefined" && window.isSecureContext) {
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
          needsTrustedHTML = true;
          if (trustedTypes.defaultPolicy) {
            if (overwrite_default) ; else {
              TTP = window.trustedTypes.createPolicy(TTPName, TTP);
            }
            TTP_default = trustedTypes.defaultPolicy;
          } else {
            TTP_default = TTP = window.trustedTypes.createPolicy(
              "default",
              TTP
            );
          }
        }
      }
    } catch (e) {
    } finally {
      window.TTP = TTP;
    }
  })();
  // [extension port] The original block here injected `executionScript` into the
  // page via GM_addElement. In the extension the TabView core runs as a declared
  // MAIN-world content script (tabview-main.js), so only the main stylesheet
  // injection remains.
  (async () => {
    if (!/youtube\.com/.test(window.location.host)) {
      return;
    }
    if (!isOpenCommentTable) {
      return;
    }
    const Promise = (async () => {
    })().constructor;
    while (!document.documentElement) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    let style = document.createElement("style");
    const sourceURLMainCSS = "debug://tabview-youtube/tabview.main.css";
    style.textContent = `${styles["main"].trim()}${"\n\n"}/*# sourceURL=${sourceURLMainCSS} */${"\n"}`;
    document.documentElement.appendChild(style);
  })();

  // TubeLoft: sliding pill indicator for the sidebar tab bar. The TabView
  // engine toggles `.active` on the tab buttons; this controller mirrors that
  // state onto a single floating pill inside #material-tabs and animates it
  // between tabs (spring easing handled by the #vd-tab-indicator CSS).
  (() => {
    // 2026 YouTube no longer sets html[dark] and also dropped the whole
    // --yt-spec-* palette, so light/dark is detected by sampling the computed
    // text-primary luminance — new baseline token first, legacy spec fallback.
    const detectTheme = () => {
      const htmlCs = getComputedStyle(document.documentElement);
      let v = htmlCs.getPropertyValue("--yt-sys-color-baseline--text-primary").trim();
      if (!v) v = htmlCs.getPropertyValue("--yt-spec-text-primary").trim();
      if (!v) v = getComputedStyle(document.body).color || "";
      let m = v.match(/#([0-9a-f]{6})/i) || v.match(/#([0-9a-f]{3})/i);
      let r = -1, g = -1, b = -1;
      if (m) {
        const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
      } else {
        m = v.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (m) {
          r = +m[1]; g = +m[2]; b = +m[3];
        }
      }
      if (r < 0) return "dark";
      // bright text-primary means dark theme
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5 ? "dark" : "light";
    };
    const setupTabIndicator = () => {
      const tabs = document.querySelector("#right-tabs #material-tabs");
      if (!tabs) return false;
      if (document.getElementById("vd-tab-indicator")) return true;
      tabs.setAttribute("data-vd-theme", detectTheme());
      const indicator = document.createElement("div");
      indicator.id = "vd-tab-indicator";
      tabs.appendChild(indicator);
      const position = (animate) => {
        const active = tabs.querySelector(".tab-btn.active:not(.tab-btn-hidden)");
        const target = active || tabs.querySelector(".tab-btn:not(.tab-btn-hidden)");
        if (!target) return;
        const tr = target.getBoundingClientRect();
        if (!tr.width) return;
        const cr = tabs.getBoundingClientRect();
        if (animate === false) indicator.style.transition = "none";
        indicator.style.width = `${tr.width}px`;
        indicator.style.transform = `translateX(${tr.left - cr.left - tabs.clientLeft}px)`;
        if (animate === false) {
          requestAnimationFrame(() => {
            indicator.style.transition = "";
          });
        }
      };
      position(false);
      new MutationObserver(() => position()).observe(tabs, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class"]
      });
      window.addEventListener("resize", () => position(), { passive: true });
      return true;
    };
    setInterval(() => {
      const tabs = document.querySelector("#right-tabs #material-tabs");
      if (!tabs) return;
      if (!document.getElementById("vd-tab-indicator")) {
        setupTabIndicator();
        return;
      }
      const theme = detectTheme();
      if (tabs.getAttribute("data-vd-theme") !== theme) {
        tabs.setAttribute("data-vd-theme", theme);
      }
    }, 600);
  })();

  // Back-to-top button. YouTube has no native way to jump back up after
  // scrolling deep into a feed, so add a floating button. Default spot is
  // the page's bottom-right corner; when the miniplayer is up it parks
  // directly above it instead. Hidden near the top of the page.
  (() => {
    if (!/youtube\.com/.test(window.location.host)) return;
    GM_addStyle(`
      #vd-backtop {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2200;
        border: 1px solid var(--yt-sys-color-baseline--outline, var(--yt-spec-10-percent-layer, rgba(128, 128, 128, .25)));
        background: var(--yt-sys-color-baseline--raised-background, var(--yt-spec-raised-background, #ffffff));
        color: var(--yt-sys-color-baseline--text-primary, var(--yt-spec-text-primary, #0f0f0f));
        box-shadow: 0 2px 10px rgba(0, 0, 0, .18);
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
        transition: opacity .22s ease, transform .22s ease, background-color .2s ease;
      }
      #vd-backtop.vd-show { opacity: .92; transform: translateY(0); pointer-events: auto; }
      #vd-backtop.vd-show:hover { opacity: 1; transform: translateY(-2px); }
      #vd-backtop svg { width: 22px; height: 22px; fill: currentColor; }
    `);
    const btn = document.createElement("div");
    btn.id = "vd-backtop";
    btn.setAttribute("role", "button");
    const titles = { zh: "回到顶部", ja: "一番上へ戻る", ko: "맨 위로" };
    const base = (document.documentElement.lang || navigator.language || "").toLowerCase().split("-")[0];
    btn.title = titles[base] || "Back to top";
    btn.setAttribute("aria-label", btn.title);
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5 4.5 12l1.41 1.41L11 8.33V19.5h2V8.33l5.09 5.08L19.5 12 12 4.5z"/></svg>';
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    const miniplayerRect = () => {
      const mp = document.querySelector(".ytdMiniplayerComponentHost, ytd-miniplayer");
      if (!mp || mp.hasAttribute("hidden")) return null;
      const r = mp.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? r : null;
    };
    const update = () => {
      if (!btn.isConnected) return;
      const show = (window.scrollY || document.documentElement.scrollTop) > 400;
      btn.classList.toggle("vd-show", show);
      const r = show ? miniplayerRect() : null;
      if (r) {
        // park just above the miniplayer, right-aligned with it
        btn.style.right = Math.max(8, window.innerWidth - r.right) + "px";
        btn.style.bottom = Math.max(8, window.innerHeight - r.top + 12) + "px";
      } else {
        btn.style.right = "24px";
        btn.style.bottom = "24px";
      }
    };
    const mount = () => {
      (document.body || document.documentElement).appendChild(btn);
      update();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
    } else {
      mount();
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    // miniplayer show/hide is not a scroll/resize event — keep polling
    setInterval(update, 800);
  })();

  (async () => {
    if (isOpenThemeProgressBar) {
      ThemeProgressbar.start();
    }
    await ToolBox.run();
    if (isOpenSpeedControl) {
      await SpeedControl.run();
    }
    if (isOpenMarkOrRemoveAd) {
      MarkOrRemoveAd.run();
    }
  })();

  // Engine heartbeat: the MAIN-world layout engine stamps `tabview-loaded`
  // on <html> as soon as it initialises. On rare cold loads — most notably
  // right after toggling the extension or a browser restart — the declared
  // MAIN-world script may never run, leaving the page without the info/video
  // tabs. Keep asking the background worker to re-inject it (throttled)
  // until the stamp appears; a one-shot report could miss a racing tab.
  (() => {
    const ENGINE_DEADLINE_MS = 6000;
    const RESEND_GAP_MS = 10000;
    const start = Date.now();
    let lastSent = 0;
    setInterval(() => {
      if (document.documentElement.hasAttribute("tabview-loaded")) return;
      if (Date.now() - start < ENGINE_DEADLINE_MS || document.readyState !== "complete") return;
      if (Date.now() - lastSent < RESEND_GAP_MS) return;
      lastSent = Date.now();
      try {
        chrome.runtime.sendMessage({ type: "vd-engine-missing", url: location.href });
      } catch (e) { /* extension context invalidated — nothing to do */ }
    }, 2000);
  })();

  // Post-update self-heal. When Chrome auto-updates (or toggles) the
  // extension, content scripts in already-open tabs keep running but lose
  // their extension context (chrome.runtime.id drops to undefined and every
  // message channel dies). In that stale state this layer cannot be healed
  // in place: background re-injection is bounced by the reinjection guards,
  // so the page keeps limping on mismatched code — the classic "first video
  // opened after an update shows a blank info tab" scenario. Detect the
  // dead context and reload the page once (rate-limited) so the updated
  // scripts attach to a fresh document; if the declared injection is missed
  // even on the reload, background healTab covers it.
  (() => {
    const RELOAD_KEY = "vd-ctx-reload-ts";
    const RELOAD_COOLDOWN_MS = 180000;
    setInterval(() => {
      try {
        // Healthy context: runtime.id is a defined extension id.
        if (chrome && chrome.runtime && chrome.runtime.id !== undefined) return;
      } catch (e) {
        return;
      }
      // Never interrupt active playback — defer until the player is paused.
      try {
        const v = document.querySelector("video");
        if (v && !v.paused) return;
      } catch (e) { /* ignore */ }
      let last = 0;
      try { last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0; } catch (e) { /* ignore */ }
      if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
      try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      location.reload();
    }, 2000);
  })();

}());
