# Cookie Cleaner Every 10 Minutes

A small Manifest V3 extension that automatically clears website cookies approximately every 10 minutes. Requires desktop Chromium or Google Chrome **111 or newer**.

## Install

1. Download the extension ZIP from the [latest release](https://github.com/amirrad98/cookie-cleaner-10min/releases/latest).
2. Extract the ZIP into a folder you will keep on your computer.
3. Open `chrome://extensions` in the browser profile you want to clean.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
6. Leave the extension enabled. The first cleanup is scheduled for approximately 10 minutes after installation.

You can also download or clone this repository and load its root folder using the same steps. No build or package installation is required.

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

To change the interval, edit `INTERVAL_MINUTES` in `background.js`, save the file, and click the extension's **Reload** button at `chrome://extensions`.

## Privacy and permissions

The extension runs locally. It makes no network requests, includes no remote scripts or external packages, and does not collect or transmit cookie contents or browsing data.

| Permission | Purpose |
| --- | --- |
| `alarms` | Schedule recurring cleanups. |
| `browsingData` | Delete website cookies from the current profile. |

No host permissions are requested. The complete implementation is in `manifest.json` and `background.js`.

## Official documentation

- [Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- [Alarms API and timing behavior](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Browsing Data API and cookie removal](https://developer.chrome.com/docs/extensions/reference/api/browsingData)
- [Incognito manifest settings](https://developer.chrome.com/docs/extensions/reference/manifest/incognito)
