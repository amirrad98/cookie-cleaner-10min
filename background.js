const ALARM_NAME = "clear-all-website-cookies";
const INTERVAL_MINUTES = 10;

async function ensureAlarm() {
  const alarm = await chrome.alarms.get(ALARM_NAME);

  // Keep an existing schedule when the service worker wakes up.
  if (!alarm || alarm.periodInMinutes !== INTERVAL_MINUTES) {
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: INTERVAL_MINUTES,
      periodInMinutes: INTERVAL_MINUTES
    });
  }
}

function startSchedule() {
  ensureAlarm().catch((error) => {
    console.error("Could not schedule cookie clearing:", error);
  });
}

chrome.runtime.onInstalled.addListener(startSchedule);
chrome.runtime.onStartup.addListener(startSchedule);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  chrome.browsingData.removeCookies({
    since: 0,
    originTypes: {
      unprotectedWeb: true,
      protectedWeb: true
    }
  }).catch((error) => {
    console.error("Could not clear cookies:", error);
  });
});

// Recreate the alarm if a browser restart or extension reload removed it.
startSchedule();
