/*!
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
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.type === "yti-menu-command") {
      var fn = __gmMenuCommands.get(msg.name);
      if (typeof fn === "function") {
        try {
          fn();
        } catch (e) {
          console.warn("[YTI] menu command failed:", e);
        }
      }
    }
  });
}

// ==UserScript==
// @name        YouTube Improvements – Layout & Video Enhancer
// @name:zh-CN  YouTube 改进 – 布局与视频增强
// @name:zh-TW  YouTube 改進 – 版面與影片增強
// @name:ar     تحسينات YouTube – تحسين التخطيط والفيديو
// @name:bg     Подобрения за YouTube – Оформление и видео подобрения
// @name:cs     Vylepšení YouTube – Rozvržení a vylepšení videa
// @name:da     YouTube-forbedringer – Layout- og videoforbedring
// @name:de     YouTube-Verbesserungen – Layout- und Video-Optimierung
// @name:el     Βελτιώσεις YouTube – Διάταξη και ενίσχυση βίντεο
// @name:en     YouTube Improvements – Layout & Video Enhancer
// @name:eo     YouTube-Plibonigoj – Aranĝo kaj Video-Plibonigilo
// @name:es     Mejoras de YouTube – Diseño y mejora de video
// @name:es-419 Mejoras de YouTube – Diseño y mejora de video
// @name:fi     YouTube-parannukset – Asettelu ja videon tehostus
// @name:fr     Améliorations YouTube – Mise en page et amélioration vidéo
// @name:fr-CA  Améliorations YouTube – Mise en page et amélioration vidéo
// @name:he     שיפורי YouTube – פריסה ושיפור וידאו
// @name:hr     YouTube poboljšanja – Izgled i poboljšanje videa
// @name:hu     YouTube fejlesztések – Elrendezés és videó javítása
// @name:id     Peningkatan YouTube – Tata letak & peningkat video
// @name:it     Miglioramenti di YouTube – Layout e potenziamento video
// @name:ja     YouTube 改善 – レイアウトと動画強化
// @name:ka     YouTube-ის გაუმჯობესებები – განლაგება და ვიდეოს გაძლიერება
// @name:ko     YouTube 개선 – 레이아웃 및 동영상 향상
// @name:nb     YouTube-forbedringer – Layout og videoforbedring
// @name:nl     YouTube-verbeteringen – Lay-out en videoverbetering
// @name:pl     Ulepszenia YouTube – Układ i ulepszanie wideo
// @name:pt-BR  Melhorias do YouTube – Layout e aprimoramento de vídeo
// @name:ro     Îmbunătățiri YouTube – Aspect și îmbunătățire video
// @name:ru     Улучшения YouTube – Макет и улучшение видео
// @name:sv     YouTube-förbättringar – Layout och videoförbättring
// @name:th     การปรับปรุง YouTube – เลย์เอาต์และการเพิ่มประสิทธิภาพวิดีโอ
// @name:tr     YouTube İyileştirmeleri – Düzen ve video geliştirme
// @name:uk     Покращення YouTube – Макет і покращення відео
// @name:ug     YouTube ياخشىلىنىشى – ئورۇنلاشتۇرۇش ۋە سىن كۈچەيتىش
// @name:vi     Cải tiến YouTube – Bố cục và tăng cường video
// @description       A userscript that enhances YouTube with multiple useful features: optimized video details layout, video downloading, screenshot capture, dark/light theme toggle, fast-forward controls, and more.
// @description:zh-CN 一个用于增强 YouTube 的用户脚本，提供多项实用功能，包括：优化的视频详情页布局、视频下载、视频截图、深色/浅色主题切换、视频快进控制等。
// @description:zh-TW 一個用於強化 YouTube 的使用者腳本，提供多項實用功能，包括：優化的影片詳細頁面配置、影片下載、影片截圖、深色／淺色主題切換、影片快轉控制等。
// @description:ar    سكريبت مستخدم يعزز تجربة YouTube من خلال عدة ميزات مفيدة، بما في ذلك: تخطيط محسّن لصفحة تفاصيل الفيديو، تنزيل الفيديو، التقاط لقطات شاشة، التبديل بين الوضع الداكن والفاتح، التحكم في التقديم السريع، والمزيد.
// @description:bg    Потребителски скрипт, който подобрява YouTube с множество полезни функции, включително: оптимизиран изглед на страницата с детайли на видеото, изтегляне на видеа, екранни снимки, превключване между тъмен и светъл режим, бързо превъртане и други.
// @description:cs    Uživatelský skript, který vylepšuje YouTube pomocí řady užitečných funkcí, včetně: optimalizovaného rozvržení stránky s podrobnostmi o videu, stahování videí, snímků obrazovky, přepínání tmavého/světlého režimu, ovládání rychlého přetáčení a dalších.
// @description:da    Et brugerscript, der forbedrer YouTube med flere nyttige funktioner, herunder: optimeret layout af videoens detaljeside, videonedlastning, skærmbilleder, skift mellem mørkt/lyst tema, hurtig fremadspoling og mere.
// @description:de    Ein Userskript, das YouTube mit mehreren nützlichen Funktionen erweitert, darunter: optimiertes Layout der Videodetailseite, Videodownloads, Screenshot-Erfassung, Umschaltung zwischen Dunkel- und Hellmodus, Schnellvorlauf-Steuerung und mehr.
// @description:el    Ένα userscript που βελτιώνει το YouTube με πολλές χρήσιμες λειτουργίες, όπως: βελτιστοποιημένη διάταξη σελίδας λεπτομερειών βίντεο, λήψη βίντεο, στιγμιότυπα οθόνης, εναλλαγή σκοτεινού/φωτεινού θέματος, έλεγχος γρήγορης προώθησης και άλλα.
// @description:eo    Uzantskripto kiu plibonigas YouTube per pluraj utilaj funkcioj, inkluzive de: optimumigita aranĝo de la videodetala paĝo, elŝuto de videoj, ekranfotoj, ŝanĝo inter malhela/luma temo, rapida antaŭeniro kaj pli.
// @description:es    Un script de usuario que mejora YouTube con múltiples funciones útiles, incluyendo: diseño optimizado de la página de detalles del vídeo, descarga de vídeos, capturas de pantalla, cambio entre tema oscuro/claro, controles de avance rápido y más.
// @description:fi    Käyttäjäskripti, joka parantaa YouTubea useilla hyödyllisillä ominaisuuksilla, mukaan lukien: optimoitu videon tietosivun asettelu, videon lataus, kuvakaappaukset, tumman/vaalean teeman vaihto, pikakelaus ja muuta.
// @description:fr    Un script utilisateur qui améliore YouTube avec de nombreuses fonctionnalités utiles, notamment : mise en page optimisée de la page de détails vidéo, téléchargement de vidéos, captures d’écran, bascule entre thème sombre/clair, contrôles d’avance rapide, et plus encore.
// @description:fr-CA Un script utilisateur qui améliore YouTube grâce à plusieurs fonctionnalités utiles, dont : une mise en page optimisée de la page des détails vidéo, le téléchargement de vidéos, des captures d’écran, le mode sombre/clair, le contrôle de l’avance rapide, et plus.
// @description:he    סקריפט משתמש שמשפר את YouTube באמצעות מגוון תכונות שימושיות, כולל: פריסת דף פרטי וידאו מותאמת, הורדת וידאו, צילום מסך, מעבר בין מצב כהה/בהיר, שליטה בהאצה קדימה ועוד.
// @description:hr    Korisnički skript koji poboljšava YouTube s više korisnih značajki, uključujući: optimizirani izgled stranice s detaljima videa, preuzimanje videa, snimke zaslona, prebacivanje između tamne/svijetle teme, brzo premotavanje i više.
// @description:hu    Egy felhasználói szkript, amely számos hasznos funkcióval bővíti a YouTube-ot, beleértve: az optimalizált videórészletek oldalelrendezést, videóletöltést, képernyőképeket, sötét/világos téma váltást, gyors előretekerést és egyebeket.
// @description:id    Script pengguna yang meningkatkan YouTube dengan berbagai fitur berguna, termasuk: tata letak halaman detail video yang dioptimalkan, unduhan video, tangkapan layar, pengalihan tema gelap/terang, kontrol percepatan, dan lainnya.
// @description:it    Uno script utente che migliora YouTube con diverse funzionalità utili, tra cui: layout ottimizzato della pagina dei dettagli del video, download dei video, acquisizione di screenshot, cambio tema scuro/chiaro, controlli di avanzamento rapido e altro.
// @description:ja    YouTube を強化するユーザースクリプトで、動画詳細ページの最適化されたレイアウト、動画のダウンロード、スクリーンショット取得、ダーク／ライトテーマ切替、早送り操作などの便利な機能を提供します。
// @description:ka    მომხმარებლის სკრიპტი, რომელიც YouTube-ს აუმჯობესებს მრავალ სასარგებლო ფუნქციით, მათ შორის: ვიდეოს დეტალების გვერდის ოპტიმიზებული განლაგება, ვიდეოების ჩამოტვირთვა, ეკრანის გადაღება, ღია/ბნელი თემის გადართვა, სწრაფი წინ წაწევის კონტროლი და სხვა.
// @description:ko    YouTube를 다양한 유용한 기능으로 개선하는 사용자 스크립트로, 최적화된 비디오 상세 페이지 레이아웃, 비디오 다운로드, 스크린샷 캡처, 다크/라이트 테마 전환, 빠른 앞으로 감기 제어 등을 제공합니다.
// @description:nb    Et brukerskript som forbedrer YouTube med flere nyttige funksjoner, inkludert: optimalisert layout for videodetaljsiden, videonedlasting, skjermbilder, bytte mellom mørkt/lyst tema, hurtigspoling og mer.
// @description:nl    Een gebruikersscript dat YouTube verbetert met meerdere nuttige functies, waaronder: een geoptimaliseerde lay-out van de videodetailpagina, videodownloads, screenshots, schakelen tussen donker/licht thema, snel vooruitspoelen en meer.
// @description:pl    Skrypt użytkownika, który usprawnia YouTube dzięki wielu przydatnym funkcjom, w tym: zoptymalizowanemu układowi strony szczegółów wideo, pobieraniu filmów, zrzutom ekranu, przełączaniu trybu ciemnego/jasnego, szybkiemu przewijaniu i innym.
// @description:pt-BR Um script de usuário que aprimora o YouTube com vários recursos úteis, incluindo: layout otimizado da página de detalhes do vídeo, download de vídeos, captura de telas, alternância entre tema escuro/claro, controles de avanço rápido e muito mais.
// @description:ro    Un script de utilizator care îmbunătățește YouTube cu mai multe funcții utile, inclusiv: un layout optimizat al paginii cu detalii video, descărcare video, capturi de ecran, comutare temă întunecată/luminoasă, control de derulare rapidă și altele.
// @description:ru    Пользовательский скрипт, расширяющий возможности YouTube с помощью множества полезных функций, включая: оптимизированный макет страницы с деталями видео, загрузку видео, создание скриншотов, переключение тёмной/светлой темы, управление быстрой перемоткой и многое другое.
// @description:sv    Ett användarskript som förbättrar YouTube med flera användbara funktioner, inklusive: optimerad layout för videodetaljsidan, videonedladdning, skärmbilder, växling mellan mörkt/ljust tema, snabbspolningskontroller och mer.
// @description:th    สคริปต์ผู้ใช้ที่ช่วยปรับปรุง YouTube ด้วยฟีเจอร์ที่มีประโยชน์หลายรายการ ได้แก่ เลย์เอาต์หน้ารายละเอียดวิดีโอที่ปรับให้เหมาะสม การดาวน์โหลดวิดีโอ การจับภาพหน้าจอ การสลับธีมมืด/สว่าง การควบคุมการกรอไปข้างหน้า และอื่นๆ
// @description:tr    YouTube'u birden fazla faydalı özellikle geliştiren bir kullanıcı betiği: optimize edilmiş video detay sayfası düzeni, video indirme, ekran görüntüsü alma, karanlık/açık tema geçişi, hızlı ileri sarma kontrolleri ve daha fazlası.
// @description:uk    Користувацький скрипт, що покращує YouTube за допомогою багатьох корисних функцій, зокрема: оптимізованого макета сторінки з деталями відео, завантаження відео, знімків екрана, перемикання темної/світлої теми, керування швидким перемотуванням та іншого.
// @description:ug    YouTube نى كۆپلىگەن پايدىلىق ئىقتىدارلار بىلەن كۈچەيتىدىغان ئىشلەتكۈچى سكرىپتى، بۇلار: ۋىدىئو تەپسىلات بەتنىڭ ئوپتىماللاشتۇرۇلغان تۈزۈلىشى، ۋىدىئو چۈشۈرۈش، سكرىنشات ئېلىش، قارا/ئاق تېما ئالماشتۇرۇش، تېز ئالغا سۈرۈش كونتروللىرى ۋە باشقىلار.
// @description:vi    Một userscript giúp nâng cao YouTube với nhiều tính năng hữu ích, bao gồm: bố cục trang chi tiết video được tối ưu hóa, tải video, chụp ảnh màn hình, chuyển đổi chủ đề tối/sáng, điều khiển tua nhanh và nhiều tính năng khác.
// @namespace   open_source_thalrien_youtube
// @version     1.1.5
// @author      Thalrien.vx,CY Fung
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAgCAYAAACLmoEDAAABo0lEQVR4AdSXAZKDIBAEiR878zL1Zbmf5aY3txaWpqKyWCS1I4jotiMi6VLh75lSv1eFqdIKNks8qv7I9FR9JQE89mrr/KzNc5HXpOsuYgGrE0cd9eSD6n0mVauG5yKvCR7kWWdYNSoSnfxYCyU8g8C4kdcw0A6OtgD3jgHoF6x62I7KVsNe4k6umsWtUmZcA2P2W2DnYZDdQLPVHmd/AvB+A67x8RLAfuy0o8N0S0mRplTxFwVriKJlCqwGDGzoCwawpIh3GVhzJXoj2lFSxEFXg/WbF60PjeLhUR0WaICR6kXAl8AK0oMpDvn+ofISWD7pki89T7/Q1WEFyZgF9DSk218NFkhJEbdGBvb0GPI7zkvRsZzDyfBlJ7B5rtP1DBLQ4ke+BRIFi4vVIB08CvaQk578aAls0UR9NGFJf2BLzr/y3KnTZzB0NqhJ7842PxRk6miwVORIyw6bmQYr0CTgu0prVNlKYOBdbHyyl/9uaZQUCWhEZ3QFPHlc5AYS0Wb5Z2dt738jWlb5iM7opraV1J2ncVhb11IbeVzkniGVx+IPAAD///H503IAAAAGSURBVAMApvWIs8xfbPkAAAAASUVORK5CYII=
// @include     *://*.youtube.com/**
// @exclude     /^https?://\w+\.youtube\.com\/live_chat.*$/
// @exclude     /^https?://\S+\.(txt|png|jpg|jpeg|gif|xml|svg|manifest|log|ini)[^\/]*$/
// @antifeature referral-link
// @noframes
// @license     MIT
// @run-at      document-start
// @grant       GM_registerMenuCommand
// @grant       GM_openInTab
// @grant       GM.openInTab
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @grant       GM_download
// @grant       GM_setClipboard
// @grant       GM_addElement
// @downloadURL https://update.greasyfork.org/scripts/560618/YouTube%20Improvements%20%E2%80%93%20Layout%20%20Video%20Enhancer.user.js
// @updateURL https://update.greasyfork.org/scripts/560618/YouTube%20Improvements%20%E2%80%93%20Layout%20%20Video%20Enhancer.meta.js
// ==/UserScript==
(function () {
  'use strict';

  
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

  // VideoDeck: animated sidebar tab bar. A JS-driven sliding pill indicator
  // (see the controller near the bottom of this file) moves between tabs with
  // a spring easing; the container is a glass chip and tab content fades in.
  const css_vd_tabs = `
    [tyt-tab] #right-tabs #material-tabs,
    #right-tabs #material-tabs {
      border: 1px solid rgba(127, 127, 127, 0.15) !important;
      border-radius: 999px !important;
      background: var(--yt-spec-badge-chip-background, rgba(127, 127, 127, 0.12));
      backdrop-filter: blur(12px) saturate(1.5);
      -webkit-backdrop-filter: blur(12px) saturate(1.5);
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
      color: var(--yt-spec-text-secondary, #aaa) !important;
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
    ytd-watch-flexy #right-tabs .tab-btn[tyt-tab-content]:not(.active):hover {
      color: var(--yt-spec-text-primary, #f1f1f1) !important;
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
      color: var(--yt-spec-text-disabled, #909090) !important;
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
    /* ── VideoDeck neon progress bar ───────────────────────────── */
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

  const Theme = {
    setTheme: function(theme = "light", isReload = true) {
      if (theme === "light") {
        this.setLight(isReload);
      } else if (theme === "dark") {
        this.setDark(isReload);
      } else {
        this.setLight(isReload);
      }
    },
    setDark: function(isReload) {
      this.isDarkTheme(true, isReload);
    },
    setLight: function(isReload) {
      this.isDarkTheme(false, isReload);
    },
    reloadYouTube: function() {
      location.reload();
    },
    isDarkTheme: function(enabled, isReload) {
      const cookies = document.cookie.split("; ");
      let prefCookie = cookies.find((cookie) => cookie.startsWith("PREF="));
      let prefValue = prefCookie ? prefCookie.split("=")[1] : "f6=400";
      prefValue = prefValue.replace(/&f6=\d+/, "").replace(/f6=\d+/, "");
      const prefix = prefValue ? "&" : "";
      if (enabled) {
        prefValue += prefix + "f6=400";
      } else {
        prefValue += prefix + "f6=80000";
      }
      document.cookie = `PREF=${prefValue}; path=/; domain=.youtube.com; secure`;
      if (isReload) {
        this.reloadYouTube();
      }
    }
  };

  const Screenshot = {
    start: function() {
      var SF_Codhemeu = "png";
      var extension = "png";
      var appendixTitle = "screenshot." + extension;
      var title;
      var headerEls = document.querySelectorAll(
        "h1.title.ytd-video-primary-info-renderer"
      );
      function SetTitle() {
        if (headerEls.length > 0) {
          title = headerEls[0].innerText.trim();
          return true;
        } else {
          return false;
        }
      }
      if (SetTitle() == false) {
        headerEls = document.querySelectorAll("h1.watch-title-container");
        if (SetTitle() == false)
          title = "";
      }
      var player = document.getElementsByClassName("video-stream")[0];
      var time = player.currentTime;
      title += " ";
      let minutes = Math.floor(time / 60);
      time = Math.floor(time - minutes * 60);
      if (minutes > 60) {
        let hours = Math.floor(minutes / 60);
        minutes -= hours * 60;
        title += hours + "-";
      }
      title += minutes + "-" + time;
      title += " " + appendixTitle;
      var canvas = document.createElement("canvas");
      canvas.width = player.videoWidth;
      canvas.height = player.videoHeight;
      canvas.getContext("2d").drawImage(player, 0, 0, canvas.width, canvas.height);
      var downloadLink = document.createElement("a");
      downloadLink.download = title;
      function DownloadBlob(blob) {
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.click();
      }
      {
        canvas.toBlob(async function(blob) {
          DownloadBlob(blob);
        }, "image/" + SF_Codhemeu);
      }
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
          "function_is_youtube_downloading_open": "Enable YouTube video downloading.",
          "download_confirm_message": "Downloading YouTube videos will redirect to third-party websites, which may contain ads. If you don't need this download feature, you can disable it in the settings.",
          "download_enter_text": "OK",
          "download_cancel_text": "Cancel"
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
          "download_confirm_message": "YouTube動画のダウンロードはサードパーティのウェブサイトにリダイレクトされ、広告が含まれている可能性があります。このダウンロード機能が不要な場合は、設定で無効にできます。",
          "download_enter_text": "OK",
          "download_cancel_text": "キャンセル"
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
          "download_confirm_message": "YouTube 동영상을 다운로드하면 제3자 웹사이트로 리디렉션되며, 광고가 포함될 수 있습니다. 이 다운로드 기능이 필요하지 않은 경우 설정에서 비활성화할 수 있습니다.",
          "download_enter_text": "확인",
          "download_cancel_text": "취소"
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
          "function_is_youtube_downloading_open": "Включить загрузку видео с YouTube.",
          "download_confirm_message": "Загрузка видео с YouTube перенаправит вас на сторонние сайты, которые могут содержать рекламу. Если вам не нужна эта функция загрузки, вы можете отключить её в настройках.",
          "download_enter_text": "ОК",
          "download_cancel_text": "Отмена"
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
          "function_is_youtube_downloading_open": "Aktifkan pengunduhan video YouTube.",
          "download_confirm_message": "Mengunduh video YouTube akan mengarahkan ke situs web pihak ketiga yang mungkin berisi iklan. Jika Anda tidak memerlukan fitur unduhan ini, Anda dapat menonaktifkannya di pengaturan.",
          "download_enter_text": "OK",
          "download_cancel_text": "Batal"
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
          "function_is_youtube_downloading_open": "Activer le téléchargement de vidéos YouTube.",
          "download_confirm_message": "Le téléchargement de vidéos YouTube redirigera vers des sites tiers pouvant contenir des publicités. Si vous n'avez pas besoin de cette fonctionnalité, vous pouvez la désactiver dans les paramètres.",
          "download_enter_text": "OK",
          "download_cancel_text": "Annuler"
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
          "function_is_youtube_downloading_open": "Ativar o download de vídeos do YouTube.",
          "download_confirm_message": "O download de vídeos do YouTube redirecionará para sites de terceiros, que podem conter anúncios. Se você não precisar desse recurso, poderá desativá-lo nas configurações.",
          "download_enter_text": "OK",
          "download_cancel_text": "Cancelar"
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
          "function_is_youtube_downloading_open": "YouTube video indirmeyi etkinleştir.",
          "download_confirm_message": "YouTube videolarını indirmek, reklam içerebilecek üçüncü taraf sitelere yönlendirme yapacaktır. Bu indirme özelliğine ihtiyacınız yoksa, ayarlardan devre dışı bırakabilirsiniz.",
          "download_enter_text": "Tamam",
          "download_cancel_text": "İptal"
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
          "function_is_youtube_downloading_open": "启用YouTube视频下载。",
          "download_confirm_message": "下载YouTube视频将跳转到第三方网站，这些网站可能包含广告。如果您不需要此下载功能，可以在设置中禁用它。",
          "download_enter_text": "确定",
          "download_cancel_text": "取消"
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
          "function_is_youtube_downloading_open": "啟用YouTube影片下載。",
          "download_confirm_message": "下載YouTube影片將跳轉到第三方網站，這些網站可能包含廣告。如果您不需要此下載功能，可以在設定中禁用它。",
          "download_enter_text": "確定",
          "download_cancel_text": "取消"
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
    getFunctionState: function() {
      return StorageUtil.getValue(
        StorageUtil.keys.youtube.functionState,
        StorageUtil.getDefaultFunctionState()
      );
    },
    insertStyle: function() {
      const toolboxStyles = `
        .vd-toolbox{
          position:absolute!important;
          background:var(--yt-spec-static-overlay-background-heavy,rgba(19,19,19,.92))!important;
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
          color:#fff!important;
          border-radius:14px!important;
          border:1px solid rgba(255,255,255,.08);
          box-shadow:0 8px 28px rgba(0,0,0,.4)!important;
          box-sizing:border-box!important;
          z-index:999999999999!important;
          display:none;
          padding:8px!important;
        }
        .vd-toolbox .vd-toolbox-grid{
          display:grid!important;
          grid-template-columns:repeat(3,1fr)!important;
          gap:4px!important;
        }
        .vd-toolbox .vd-tool-btn{
          width:34px!important;
          height:34px!important;
          background:transparent!important;
          border:none!important;
          cursor:pointer!important;
          color:#fff!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          border-radius:9px!important;
          transition:background .15s ease;
        }
        .vd-toolbox .vd-tool-btn:hover{
          background:rgba(255,255,255,.14)!important;
        }
      `;
      commonUtil.addStyle(toolboxStyles);
    },
    vdIcon: function(parts, options = {}) {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", options.viewBox || "0 0 24 24");
      svg.setAttribute("width", options.size || 20);
      svg.setAttribute("height", options.size || 20);
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", options.color || "currentColor");
      svg.setAttribute("stroke-width", options.strokeWidth || 2);
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      parts.forEach((part) => {
        if (typeof part === "string") {
          const path = document.createElementNS(svgNS, "path");
          path.setAttribute("d", part);
          svg.appendChild(path);
        } else if (part && Array.isArray(part.circle)) {
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", part.circle[0]);
          circle.setAttribute("cy", part.circle[1]);
          circle.setAttribute("r", part.circle[2]);
          svg.appendChild(circle);
        }
      });
      return svg;
    },
    genrateSettingSvg: function() {
      return this.vdIcon([
        "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
        { circle: [12, 12, 3] }
      ]);
    },
    genrateToolSvg: function() {
      return this.vdIcon([
        "M12 2 2 7l10 5 10-5z",
        "m2 12 10 5 10-5",
        "m2 17 10 5 10-5"
      ], { size: 22, color: "#fff" });
    },
    genrateScreenshotSvg: function() {
      return this.vdIcon([
        "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z",
        { circle: [12, 13, 3] }
      ]);
    },
    genrateSwitchThemeSvg: function() {
      return this.vdIcon(["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"]);
    },
    genratePictureToPictureSvg: function() {
      return this.vdIcon([
        "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z",
        "M12 12h7v5h-7z"
      ]);
    },
    genrateLoopSvg: function() {
      return this.vdIcon([
        "m17 2 4 4-4 4",
        "M3 11v-1a4 4 0 0 1 4-4h14",
        "m7 22-4-4 4-4",
        "M21 13v1a4 4 0 0 1-4 4H3"
      ]);
    },
    genrateNotLoopSvg: function() {
      return this.vdIcon([
        "m17 2 4 4-4 4",
        "M3 11v-1a4 4 0 0 1 4-4h14",
        "m7 22-4-4 4-4",
        "M21 13v1a4 4 0 0 1-4 4H3",
        "m2 2 20 20"
      ]);
    },
    genrateTools: function(parent) {
      const loopElementId = "_loop_" + Math.ceil(Math.random() * 1e8);
      this.getFunctionState();
      const switchTheme = () => {
        let currentTheme = StorageUtil.getValue(StorageUtil.keys.youtube.theme, null);
        if (currentTheme == "light" || !currentTheme) {
          currentTheme = "dark";
        } else {
          currentTheme = "light";
        }
        StorageUtil.setValue(StorageUtil.keys.youtube.theme, currentTheme);
        Theme.setTheme(currentTheme, true);
      };
      const screenshot = () => {
        Screenshot.start();
      };
      const showSettingDialog = () => {
        this.showSettingDialog();
      };
      const pictureToPicture = () => {
        const video = document.querySelector("video");
        if ("pictureInPictureEnabled" in document) {
          if (!document.pictureInPictureElement) {
            video.requestPictureInPicture().then(() => {
            }).catch((error) => {
            });
          }
        }
      };
      let videoLoopSate = StorageUtil.getValue(StorageUtil.keys.youtube.videoLoop, false);
      let videoLoopInterval = null;
      const videoLoopEvent = () => {
        if (videoLoopInterval) {
          clearInterval(videoLoopInterval);
          videoLoopInterval = null;
        }
        const videoFull = document.querySelector("#movie_player > div.html5-video-container > video");
        if (videoFull != void 0) {
          videoLoopInterval = setInterval(() => {
            if (videoLoopSate) {
              document.querySelector("#movie_player > div.html5-video-container > video").setAttribute("loop", "true");
            } else {
              document.querySelector("#movie_player > div.html5-video-container > video").removeAttribute("loop");
            }
          }, 1e3);
        }
      };
      const videoLoop = () => {
        const target = document.querySelector("#" + loopElementId);
        let svg = null;
        if (videoLoopSate) {
          videoLoopSate = false;
          svg = this.genrateNotLoopSvg();
        } else {
          videoLoopSate = true;
          svg = this.genrateLoopSvg();
        }
        target.replaceChildren(svg);
        StorageUtil.setValue(StorageUtil.keys.youtube.videoLoop, videoLoopSate);
        videoLoopEvent();
      };
      videoLoopEvent();
      const btns = [
        {
          "tagName": "div",
          "title": "Settings",
          "classname": "vd-tool-btn",
          "onclick": showSettingDialog,
          "icon": this.genrateSettingSvg()
        },
        {
          "tagName": "div",
          "title": "Toggle light / dark theme",
          "classname": "vd-tool-btn",
          "onclick": switchTheme,
          "icon": this.genrateSwitchThemeSvg()
        },
        {
          "tagName": "div",
          "title": "Screenshot",
          "classname": "vd-tool-btn",
          "onclick": screenshot,
          "icon": this.genrateScreenshotSvg()
        },
        {
          "tagName": "div",
          "title": "Picture-in-picture",
          "classname": "vd-tool-btn",
          "onclick": pictureToPicture,
          "icon": this.genratePictureToPictureSvg()
        },
        {
          "tagName": "div",
          "title": "Loop",
          "classname": "vd-tool-btn",
          "id": loopElementId,
          "onclick": videoLoop,
          "icon": videoLoopSate ? this.genrateLoopSvg() : this.genrateNotLoopSvg()
        }
      ];
      for (let i = 0; i < btns.length; i++) {
        let item = btns[i];
        const element = document.createElement(item.tagName);
        element.className = item.classname;
        element.setAttribute("title", item.title);
        if (item.hasOwnProperty("icon")) {
          element.appendChild(item.icon);
        }
        if (item.hasOwnProperty("id")) {
          element.id = item.id;
        }
        if (item.hasOwnProperty("onclick")) {
          element.onclick = item.onclick;
        }
        if (item.hasOwnProperty("style")) {
          element.setAttribute("style", item.style);
        }
        parent.appendChild(element);
      }
    },
    genrateBoxContainer: function(button, player) {
      const toolBoxContainer = document.createElement("div");
      toolBoxContainer.id = "videodeck-toolbox";
      toolBoxContainer.className = "vd-toolbox";
      const tools = document.createElement("div");
      tools.className = "vd-toolbox-grid";
      this.genrateTools(tools);
      toolBoxContainer.appendChild(tools);
      player.appendChild(toolBoxContainer);
      let isHovering = false;
      button.addEventListener("mouseenter", () => {
        toolBoxContainer.style.display = "block";
        var containerRect = player.getBoundingClientRect();
        var buttonRect = button.getBoundingClientRect();
        var toolBoxContainerRect = toolBoxContainer.getBoundingClientRect();
        var left = buttonRect.left - containerRect.left - toolBoxContainerRect.width / 2 + buttonRect.width / 2;
        var top = buttonRect.top - containerRect.top - toolBoxContainer.clientHeight;
        toolBoxContainer.style.left = `${left}px`;
        toolBoxContainer.style.top = `${top}px`;
      });
      button.addEventListener("mouseleave", () => {
        isHovering = false;
        setTimeout(() => {
          if (!isHovering) {
            toolBoxContainer.style.display = "none";
          }
        }, 100);
      });
      toolBoxContainer.addEventListener("mouseenter", () => {
        isHovering = true;
      });
      toolBoxContainer.addEventListener("mouseleave", () => {
        isHovering = false;
        toolBoxContainer.style.display = "none";
      });
    },
    genrateBox: function() {
      return new Promise((resolve) => {
        const buttonId = "videodeck-trigger";
        const boxContainer = document.createElement("div");
        boxContainer.className = "ytp-button";
        boxContainer.id = buttonId;
        boxContainer.setAttribute("style", `position: relative;display: inline-block;width: 48px;height: 100%;`);
        const boxInner = document.createElement("div");
        boxInner.setAttribute("style", `position: absolute;width: 100%;height: 100%;	`);
        const boxActiveButton = document.createElement("button");
        boxActiveButton.setAttribute("style", `background-color: transparent;width: 100%;height: 100%;outline: none;flex: 1 1 0%;display: flex;-webkit-box-align: center;align-items: center;-webkit-box-pack: center;justify-content: center;border: none;padding: 0px;cursor: pointer;`);
        boxContainer.appendChild(boxInner);
        boxInner.appendChild(boxActiveButton);
        boxActiveButton.appendChild(this.genrateToolSvg());
        const genrateHtml = () => {
          const player = document.querySelector("#movie_player");
          if (player) {
            const rightControls = player.querySelector(".ytp-right-controls");
            if (rightControls) {
              rightControls.prepend(boxContainer);
              this.genrateBoxContainer(boxContainer, player);
            }
          }
        };
        const interval = setInterval(() => {
          if (!document.querySelector("#" + buttonId)) {
            genrateHtml();
          } else {
            resolve();
            clearInterval(interval);
          }
        }, 500);
      });
    },
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
          commonUtil.onPageLoad(async () => {
            const theme = StorageUtil.getValue(StorageUtil.keys.youtube.theme, null);
            if (theme) {
              Theme.setTheme(theme, false);
            }
            this.insertStyle();
            await this.genrateBox();
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

  // VideoDeck: sliding pill indicator for the sidebar tab bar. The TabView
  // engine toggles `.active` on the tab buttons; this controller mirrors that
  // state onto a single floating pill inside #material-tabs and animates it
  // between tabs (spring easing handled by the #vd-tab-indicator CSS).
  (() => {
    // 2026 YouTube no longer sets html[dark], so light/dark is detected by
    // sampling the computed --yt-spec-text-primary luminance instead.
    const detectTheme = () => {
      let v = getComputedStyle(document.documentElement).getPropertyValue("--yt-spec-text-primary").trim();
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

}());
