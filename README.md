# VideoDeck for YouTube

A Chrome extension (Manifest V3) that gives YouTube's watch page a modern,
theme-aware upgrade layer.

> 声明：本项目基于 MIT 许可的开源项目 [Tabview-Youtube](https://github.com/tabview-youtube/Tabview-Youtube)
> 及 "YouTube Improvements – Layout & Video Enhancer" userscript 衍生而来，
> 衍生部分遵循 MIT 许可证保留原作者（Thalrien.vx, CY Fung）版权声明。

## Features

- **Tabbed sidebar** — video description (info), comments and related videos
  move into tabs beside the player, instead of a long single column
- **Playback speed control** — quick speed menu (0.5× – 3.0×) in the player,
  remembered across videos
- **Screenshot** — capture the current video frame and save it as PNG
- **Loop** — one-click loop toggle for the current video
- **Picture-in-picture** — quick PiP button
- **Light / dark aware UI** — all extension UI uses YouTube's own CSS
  variables, so it follows the site theme automatically
- **Ad marking** — visually marks known ad placements on the page

## Architecture

```
extension/
├── manifest.json      # MV3 manifest (Chrome 111+)
├── tabview-main.js    # TabView engine — MAIN world content script
│                      #   (runs in page context, not subject to page CSP)
├── content.js         # Toolbox / speed control / settings — ISOLATED
│                      #   content script + GM_* API polyfills
├── background.js      # Service worker (context-menu "Settings" entry)
└── icons/             # Extension icons
```

The dual-world split is deliberate: the TabView engine needs to hook YouTube's
Polymer internals (`yt-navigate-finish`, custom-element lifecycle), which is
only possible from the page's main world, injected as a declared
`"world": "MAIN"` content script.

## Install (unpacked)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select the `extension/` directory

## Install (Chrome Web Store)

Pending review.

## License

MIT — see [LICENSE](./LICENSE). Includes code originally copyrighted by
Thalrien.vx and CY Fung (Tabview-Youtube), used and redistributed under the
terms of the MIT license.
