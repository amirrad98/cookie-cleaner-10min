# Cookie Cleaner Every 10 Minutes

A small Manifest V3 extension that automatically clears website cookies approximately every 10 minutes. Requires desktop Chromium or Google Chrome **111 or newer**.

## Install directly from the ZIP

**[Download cookie-cleaner-10min.zip](https://github.com/amirrad98/cookie-cleaner-10min/raw/refs/heads/main/cookie-cleaner-10min.zip)**

1. Save the ZIP linked above to your computer.
2. Open `chrome://extensions` in the browser profile you want to clean.
3. Turn on **Developer mode**.
4. Drag the downloaded **cookie-cleaner-10min.zip** file from Finder or File Explorer directly onto the Extensions page.
5. Leave the extension enabled. The first cleanup is scheduled for approximately 10 minutes after installation.

Chromium extracts the ZIP into its profile and loads the extension automatically. You do not need to unzip it yourself. Drag the saved file, not the download hyperlink. This installation method requires a browser that permits developer extensions.

The finished ZIP contains `manifest.json` and `background.js` directly at the top level. GitHub's automatic **Source code (zip)** and **Code > Download ZIP** downloads contain a wrapper folder, so use the finished ZIP linked above for direct installation.

### Loading a source folder

If you prefer to work with the source, clone or extract this repository, click **Load unpacked**, and select the folder with `manifest.json` directly inside it. Selecting your home folder (`~`), a parent folder, or a ZIP with this button causes a missing-manifest error.

No build or package installation is required.

## Version 1.0.0 behavior

- Clears website cookies of all ages in the regular browser profile where it is installed, including cookies for websites installed as hosted applications.
- Schedules another cleanup every 10 minutes using the browser's alarms API.
- Preserves the existing schedule when its background service worker wakes up. If the alarm is missing after a restart or reload, it creates a new schedule with a 10-minute delay.
- Leaves history, saved passwords, cache, local storage, and IndexedDB untouched.
- Does not run in Incognito mode or affect other browser profiles.

**Clearing login cookies can sign you out of websites and reset cookie-based preferences.** In Google Chrome, clearing the Sync account cookie can also pause Sync. Open websites can create new cookies immediately after a cleanup.

## Timing

Cleanup requires the browser to be running. Browser alarms can be delayed, so the interval is approximate. Alarms cannot wake a sleeping computer. After the computer wakes, a missed repeating alarm fires at most once and the interval resumes from that point.

## Stop or change the interval

To stop future cleanups, disable or remove the extension at `chrome://extensions`.

To change the interval, load a source folder as described above, edit `INTERVAL_MINUTES` in its `background.js`, save the file, and click the extension's **Reload** button at `chrome://extensions`. ZIP installation uses the browser's extracted copy.

## Privacy and permissions

The extension runs locally. It makes no network requests, includes no remote scripts or external packages, and does not collect or transmit cookie contents or browsing data.

| Permission | Purpose |
| --- | --- |
| `alarms` | Schedule recurring cleanups. |
| `browsingData` | Delete website cookies from the current profile. |

No host permissions are requested. The complete implementation is in `manifest.json` and `background.js`.

## Official documentation

- [Chromium ZIP installer](https://chromium.googlesource.com/chromium/src/+/HEAD/extensions/browser/zipfile_installer.cc)
- [Chromium extension drag-and-drop handler](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/resources/extensions/drag_and_drop_handler.ts)
- [Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Alarms API and timing behavior](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Browsing Data API and cookie removal](https://developer.chrome.com/docs/extensions/reference/api/browsingData)
- [Incognito manifest settings](https://developer.chrome.com/docs/extensions/reference/manifest/incognito)
