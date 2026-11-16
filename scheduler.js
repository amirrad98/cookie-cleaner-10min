import {
  ALARM_NAME,
  DEFAULT_INTERVAL_MINUTES,
  isValidInterval,
  validateInterval
} from "./settings.js";

export function createScheduler(api) {
  let pending = Promise.resolve();

  // A worker startup and a popup save may arrive together. Apply them in order.
  function enqueue(operation) {
    const result = pending.then(operation);
    pending = result.catch(() => {});
    return result;
  }

  async function createAlarm(intervalMinutes) {
    await api.alarms.create(ALARM_NAME, {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes
    });
  }

  function describe(intervalMinutes, alarm) {
    if (!alarm || !Number.isFinite(alarm.scheduledTime)) {
      throw new Error("The cleanup schedule is unavailable. Please try again.");
    }
    return { intervalMinutes, nextRunAt: alarm.scheduledTime };
  }

  async function reconcileSchedule() {
    const saved = await api.storage.local.get("intervalMinutes");
    let alarm = await api.alarms.get(ALARM_NAME);
    let intervalMinutes = saved.intervalMinutes;

    if (!isValidInterval(intervalMinutes)) {
      // Preserve a valid custom schedule from the earlier version on upgrade.
      intervalMinutes = saved.intervalMinutes === undefined
        && isValidInterval(alarm?.periodInMinutes)
        ? alarm.periodInMinutes
        : DEFAULT_INTERVAL_MINUTES;
      await api.storage.local.set({ intervalMinutes });
    }

    if (!alarm || alarm.periodInMinutes !== intervalMinutes) {
      await createAlarm(intervalMinutes);
      alarm = await api.alarms.get(ALARM_NAME);
    }

    return describe(intervalMinutes, alarm);
  }

  function getSettings() {
    return enqueue(reconcileSchedule);
  }

  async function setInterval(intervalMinutes) {
    validateInterval(intervalMinutes);

    return enqueue(async () => {
      const previous = await api.storage.local.get("intervalMinutes");
      await api.storage.local.set({ intervalMinutes });

      try {
        // Saving deliberately starts a fresh countdown without removing cookies.
        await createAlarm(intervalMinutes);
      } catch (error) {
        if (previous.intervalMinutes === undefined) {
          await api.storage.local.remove("intervalMinutes");
        } else {
          await api.storage.local.set(previous);
        }
        throw error;
      }

      return describe(intervalMinutes, await api.alarms.get(ALARM_NAME));
    });
  }

  return { getSettings, setInterval };
}
