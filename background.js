import { createScheduler } from "./scheduler.js";
import { ALARM_NAME } from "./settings.js";

const scheduler = createScheduler(chrome);

function maintainSchedule() {
  scheduler.getSettings().catch((error) => {
    console.error("Cookie Remover could not restore its schedule:", error);
  });
}

// Register listeners synchronously so service-worker wakeups cannot miss them.
chrome.runtime.onInstalled.addListener(maintainSchedule);
chrome.runtime.onStartup.addListener(maintainSchedule);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "get-settings" && message?.type !== "set-interval") {
    return false;
  }

  const operation = message.type === "get-settings"
    ? scheduler.getSettings()
    : scheduler.setInterval(message.intervalMinutes);

  operation.then(
    (settings) => sendResponse({ ok: true, ...settings }),
    (error) => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Could not save your interval. Please try again."
    })
  );

  // Chrome 111 requires the callback form for asynchronous message responses.
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  chrome.browsingData.removeCookies({
    since: 0,
    originTypes: {
      unprotectedWeb: true,
      protectedWeb: true
    }
  }).catch((error) => {
    console.error("Cookie Remover could not remove cookies:", error);
  });
});

maintainSchedule();
