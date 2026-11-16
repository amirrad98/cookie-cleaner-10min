## Cookie Remover v1.1.0

The extension is now named **Cookie Remover**, with a popup for choosing when cookies are removed.

### What's changed

- Set any whole-minute interval from **1 minute to 24 hours**.
- Keep the **10-minute default** or save a custom interval.
- See the approximate next cleanup time.
- Remember the selected interval after browser restarts.
- Save a new interval to start a fresh countdown.
- Validate invalid values and show clear save confirmations and errors.
- Support light and dark popup themes.

### Install

Download **cookie-remover.zip** from **Assets**, open `chrome://extensions`, enable **Developer mode**, and drag the downloaded ZIP onto that page. Chromium handles extraction.

Open **Cookie Remover** from the Extensions menu, enter an interval in minutes, and click **Save interval**.

### Upgrading

Disable or remove the earlier **Cookie Cleaner Every 10 Minutes** before installing this ZIP, so its old timer does not keep running alongside the new extension. In-place source-folder updates can be reloaded and retain their saved settings.

Requires Chromium or Chrome 111 or newer. Cleanup remains limited to website cookies in the regular profile. Cookie removal can sign you out of websites, and browser sleep can delay the timer.
