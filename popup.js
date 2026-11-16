import {
  DEFAULT_INTERVAL_MINUTES,
  MIN_INTERVAL_MINUTES,
  MAX_INTERVAL_MINUTES,
  isValidInterval
} from "./settings.js";

const form = document.querySelector("#interval-form");
const controls = document.querySelector("#interval-controls");
const intervalInput = document.querySelector("#interval");
const saveButton = document.querySelector("#save-button");
const feedback = document.querySelector("#feedback");
const nextRun = document.querySelector("#next-run");
const minuteFormatter = new Intl.NumberFormat();
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit"
});

let busy = false;
let savedInterval;

intervalInput.min = String(MIN_INTERVAL_MINUTES);
intervalInput.max = String(MAX_INTERVAL_MINUTES);
intervalInput.value = String(DEFAULT_INTERVAL_MINUTES);

function setBusy(value, saving = false) {
  busy = value;
  controls.disabled = value;
  form.setAttribute("aria-busy", String(value));
  saveButton.textContent = saving ? "Saving…" : "Save interval";
}

function setFeedback(message, state = "") {
  feedback.textContent = message;
  feedback.dataset.state = state;
}

function describeInterval(minutes) {
  return `${minuteFormatter.format(minutes)} ${minutes === 1 ? "minute" : "minutes"}`;
}

function renderSettings(settings) {
  savedInterval = settings.intervalMinutes;
  intervalInput.value = String(savedInterval);
  intervalInput.removeAttribute("aria-invalid");

  const nextDate = new Date(settings.nextRunAt);
  if (typeof settings.nextRunAt === "number" && Number.isFinite(nextDate.getTime())) {
    nextRun.dateTime = nextDate.toISOString();
    nextRun.textContent = timeFormatter.format(nextDate);
    nextRun.title = nextDate.toLocaleString();
  } else {
    nextRun.textContent = "Unavailable";
    nextRun.removeAttribute("datetime");
    nextRun.removeAttribute("title");
  }
}

async function requestSettings(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    throw new Error(response?.error || "Could not connect to Cookie Remover. Try again.");
  }
  if (!isValidInterval(response.intervalMinutes)) {
    throw new Error("The saved interval could not be read. Please choose a time and save it.");
  }
  return response;
}

intervalInput.addEventListener("input", () => {
  intervalInput.removeAttribute("aria-invalid");
  if (savedInterval !== undefined && intervalInput.valueAsNumber === savedInterval) {
    setFeedback(`Currently every ${describeInterval(savedInterval)}.`);
  } else {
    setFeedback("Save to apply this interval and restart the timer.");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;

  const intervalMinutes = intervalInput.valueAsNumber;
  if (!isValidInterval(intervalMinutes)) {
    intervalInput.setAttribute("aria-invalid", "true");
    setFeedback(
      `Enter a whole number from ${minuteFormatter.format(MIN_INTERVAL_MINUTES)} to ${minuteFormatter.format(MAX_INTERVAL_MINUTES)} minutes.`,
      "error"
    );
    intervalInput.focus();
    return;
  }

  setBusy(true, true);
  setFeedback("Saving your interval…");

  try {
    const settings = await requestSettings({ type: "set-interval", intervalMinutes });
    renderSettings(settings);
    setFeedback(`Saved. Cookies will be cleared every ${describeInterval(settings.intervalMinutes)}.`, "saved");
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : "Could not save the interval. Try again.", "error");
  } finally {
    setBusy(false);
  }
});

async function loadSettings() {
  setBusy(true);
  try {
    const settings = await requestSettings({ type: "get-settings" });
    renderSettings(settings);
    setFeedback(`Currently every ${describeInterval(settings.intervalMinutes)}.`);
  } catch (error) {
    nextRun.textContent = "Unavailable";
    setFeedback(error instanceof Error ? error.message : "Could not load your interval. Try saving it again.", "error");
  } finally {
    setBusy(false);
  }
}

loadSettings();
