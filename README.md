# Cookie Remover

A small Chromium extension that removes website cookies at an interval you choose. Requires desktop Chromium or Google Chrome **111 or newer**.

**[Download Cookie Remover](https://github.com/amirrad98/cookie-cleaner-10min/releases/latest/download/cookie-remover.zip)** · [Releases](https://github.com/amirrad98/cookie-cleaner-10min/releases)

## Install from the ZIP

1. Download **cookie-remover.zip**.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Drag the downloaded ZIP from Finder or File Explorer directly onto that page.
4. Open the browser's Extensions menu and click **Cookie Remover**. Pin it if you want the button on your toolbar.

Chromium handles extraction. Use the finished ZIP above, which has `manifest.json` at its root. GitHub's automatic source archive has an extra folder and is intended for source browsing or manual extraction.

### Upgrading from the earlier cleaner

Disable or remove **Cookie Cleaner Every 10 Minutes** before installing this ZIP. A ZIP installation can create a separate extension, and leaving the earlier copy enabled would keep its old timer running.

For an existing source-folder installation, replace the source files and click **Reload** at `chrome://extensions`. An in-place update preserves the existing extension identity and saved settings.

## Choose the cleanup interval

1. Click **Cookie Remover** in the Extensions menu or toolbar.
2. Enter a whole number from **1 to 1,440 minutes** (up to 24 hours).
3. Click **Save interval**.

The default is **10 minutes**. Saving starts a fresh countdown using your chosen interval. The popup shows the approximate next cleanup time and confirms when your setting has been saved.

The setting is stored locally and survives browser restarts and worker shutdowns. Opening the popup leaves a matching timer unchanged. If the browser loses the alarm, Cookie Remover restores it using your saved interval. Uninstalling the extension removes its saved settings.

## Behavior

- Removes website cookies of all ages in the regular profile where it is installed, including cookies belonging to installed hosted website apps.
- Preserves browser history, saved passwords, cache, local storage, and IndexedDB.
- Does not operate in Incognito or other browser profiles.
- Runs approximately at the chosen interval while the browser is running. Sleep and browser scheduling can delay a cleanup.
- To stop future cleanups, disable the extension at `chrome://extensions`.

**Removing login cookies can sign you out of websites and reset cookie-based preferences.** In Google Chrome, removing the Sync account cookie can also pause Sync. Open websites may immediately set new cookies.

## Privacy and permissions

Cookie Remover runs locally. It makes no network requests and does not collect or transmit cookie contents or browsing data.

| Permission | Purpose |
| --- | --- |
| `alarms` | Schedule recurring cleanups. |
| `browsingData` | Remove website cookies from the current profile. |
| `storage` | Remember your chosen interval on this device. |

No host permissions, remote scripts, or external runtime packages are used.

## Development and packaging

The extension has no build dependencies. To load the source, select the repository folder using **Load unpacked** at `chrome://extensions`.

Run the behavioral tests with `npm test`. Build the ZIP with `npm run package`. The packaging script produces a ZIP with the extension files at its root and maintains the earlier ZIP filename for existing repository download links.

The release workflow checks the behavior and package contents, creates the versioned release when needed, and attaches **cookie-remover.zip**. Existing release tags are checked before a package can be replaced.

## Official references

- [Chromium ZIP installer](https://chromium.googlesource.com/chromium/src/+/HEAD/extensions/browser/zipfile_installer.cc)
- [Alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Browsing Data API](https://developer.chrome.com/docs/extensions/reference/api/browsingData)
- [Extension message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
