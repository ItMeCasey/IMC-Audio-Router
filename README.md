# IMC Audio Router

A browser extension (Chrome / Edge and Firefox) that sends one tab's sound to a chosen audio device. Made to go with [IMC-Stream](https://github.com/ItMeCasey/IMC-Stream), but it works on its own.

Sends one tab's (or page's) sound to a chosen audio device. With Voicemeeter that means: put a YouTube tab on **Voicemeeter AUX Input** and it is heard by you but kept out of the stream recording (VOD), because the app's Voicemeeter setup keeps the AUX input off OBS's VOD track.

**Chrome / Edge:** click the speaker icon in the toolbar (pin it from the puzzle-piece menu), then choose a device under **Reroute audio to...** (the first entry, *Normal output*, undoes it). It works on the tab you are on. A ♪ badge on the icon shows that the tab's sound is being sent somewhere.
**Firefox:** a small speaker glyph appears in the bottom-left corner of a page once it has video or audio; it opens the menu (Firefox's device picker needs a click on the page itself).

## Build and install

```bash
node build.js          # makes dist/chrome and dist/firefox
node build.js --zip    # also makes a zip of each
node test.js           # checks the logic, manifests and files
```

- **Chrome / Edge:** `chrome://extensions` (or `edge://extensions`), turn on *Developer mode*, *Load unpacked*, choose `dist/chrome`. Pin the speaker icon from the puzzle-piece menu.
- **Firefox:** `about:debugging` > *This Firefox* > *Load Temporary Add-on*, choose `dist/firefox/manifest.json` (temporary: it goes away when Firefox closes). A permanent install needs the zip signed by Mozilla.

## How it works

| | Chrome / Edge (116+) | Firefox (128+) |
|---|---|---|
| Method | Captures the tab's sound (`tabCapture`) and plays it through a hidden page on the chosen device (`setSinkId`) | Points the page's `<video>` / `<audio>` elements at the chosen device (`setSinkId`) |
| Select box | Toolbar popup (Chrome only allows capture after you click the extension) | The glyph's menu, then Firefox's own device picker |
| Covers | Everything the tab plays, including Web Audio, and frames | Plain media elements in the top page only |
| Remembered | The tab, until it is closed or you press *Back to normal* | The device per site |

While a Chrome tab is captured it stops playing on your normal output, so the sound only comes out where you sent it.

### Device names

Browsers show "Audio output 1, 2, 3" until the extension page may read device names. The popup then offers **Show device names**, which asks for the microphone once and lets go of it at once. Nothing is recorded or sent anywhere.

## Privacy and permissions

- Chrome: `tabCapture`, `offscreen`, `storage`, `activeTab`. Nothing runs inside your pages.
- Firefox: `storage` only, https pages.
- No network access, no analytics, no data leaves the browser.

## Known limits

- After a browser restart, Chrome tabs have to be routed again.
- Firefox: Web Audio sound (some games and web players) and media in other sites' frames are not covered, and each site asks for permission once.
- Browser pages (`chrome://`, the Web Store, Firefox's own pages) cannot be captured.

## Using it with IMC-Stream

IMC-Stream's Voicemeeter setup keeps music and alerts out of your VOD. Install this extension, then route a tab (a YouTube video, a music site) to **Voicemeeter AUX Input** so you hear it and the recording does not.
`imc-stream-integration/` holds the code IMC-Stream used to offer these files from its Setup page (finding the browsers and opening their extensions page). IMC-Stream no longer includes it; it is kept here in case it is useful.
