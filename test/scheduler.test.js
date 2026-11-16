import assert from "node:assert/strict";
import test from "node:test";
import { createScheduler } from "../scheduler.js";
import { ALARM_NAME } from "../settings.js";

const MINUTE = 60_000;
const START_TIME = 1_800_000_000_000;

function event() {
  const listeners = [];
  return { listeners, addListener: (listener) => listeners.push(listener) };
}

function fakeChrome({ intervalMinutes, alarm, now = START_TIME } = {}) {
  const stored = intervalMinutes === undefined ? {} : { intervalMinutes };
  const scheduled = new Map(alarm ? [[ALARM_NAME, { name: ALARM_NAME, ...alarm }]] : []);
  const created = [];
  const cookieRemovals = [];
  let currentTime = now;
  let nextAlarmError;
  let blockedRead;

  const api = {
    storage: {
      local: {
        async get(keys) {
          const requested = Array.isArray(keys) ? keys : [keys];
          const snapshot = Object.fromEntries(requested
            .filter((key) => Object.hasOwn(stored, key))
            .map((key) => [key, stored[key]]));
          const block = blockedRead;
          blockedRead = undefined;
          if (block) {
            block.entered();
            await block.wait;
          }
          return structuredClone(snapshot);
        },
        async set(values) {
          Object.assign(stored, structuredClone(values));
        },
        async remove(key) {
          delete stored[key];
        }
      }
    },
    alarms: {
      async get(name) {
        return structuredClone(scheduled.get(name));
      },
      async create(name, options) {
        if (nextAlarmError) {
          const error = nextAlarmError;
          nextAlarmError = undefined;
          throw error;
        }
        created.push({ name, ...structuredClone(options) });
        scheduled.set(name, {
          name,
          periodInMinutes: options.periodInMinutes,
          scheduledTime: currentTime + options.delayInMinutes * MINUTE
        });
      },
      onAlarm: event()
    },
    runtime: {
      onInstalled: event(),
      onStartup: event(),
      onMessage: event()
    },
    browsingData: {
      async removeCookies(options) {
        cookieRemovals.push(structuredClone(options));
      }
    }
  };

  return {
    api,
    stored,
    created,
    cookieRemovals,
    advance: (minutes) => { currentTime += minutes * MINUTE; },
    removeAlarm: () => scheduled.delete(ALARM_NAME),
    alarm: () => structuredClone(scheduled.get(ALARM_NAME)),
    failNextAlarm: (error) => { nextAlarmError = error; },
    holdNextStorageRead() {
      let release;
      let entered;
      const wait = new Promise((resolve) => { release = resolve; });
      const started = new Promise((resolve) => { entered = resolve; });
      blockedRead = { wait, entered };
      return { release, started };
    }
  };
}

test("a new installation starts a 10-minute countdown without clearing cookies", async () => {
  const browser = fakeChrome();
  const settings = await createScheduler(browser.api).getSettings();

  assert.deepEqual(settings, {
    intervalMinutes: 10,
    nextRunAt: START_TIME + 10 * MINUTE
  });
  assert.equal(browser.stored.intervalMinutes, 10);
  assert.equal(browser.alarm().periodInMinutes, 10);
  assert.equal(browser.cookieRemovals.length, 0);
});

test("the saved interval survives a new worker and restores an alarm lost on restart", async () => {
  const browser = fakeChrome();
  const firstWorker = createScheduler(browser.api);
  await firstWorker.setInterval(45);
  const originalTime = browser.alarm().scheduledTime;

  browser.advance(7);
  const secondWorker = createScheduler(browser.api);
  assert.equal((await secondWorker.getSettings()).nextRunAt, originalTime);
  assert.equal(browser.created.length, 1);

  browser.removeAlarm();
  const restartedWorker = createScheduler(browser.api);
  assert.deepEqual(await restartedWorker.getSettings(), {
    intervalMinutes: 45,
    nextRunAt: START_TIME + (7 + 45) * MINUTE
  });
  assert.equal(browser.stored.intervalMinutes, 45);
});

test("opening settings repeatedly does not postpone the next cleanup", async () => {
  const browser = fakeChrome();
  const scheduler = createScheduler(browser.api);
  const first = await scheduler.getSettings();

  browser.advance(8);
  assert.deepEqual(await scheduler.getSettings(), first);
  assert.deepEqual(await scheduler.getSettings(), first);
  assert.equal(browser.created.length, 1);
});

test("saving a different interval persists it and starts a fresh countdown", async () => {
  const browser = fakeChrome();
  const scheduler = createScheduler(browser.api);
  await scheduler.getSettings();
  browser.advance(4);

  assert.deepEqual(await scheduler.setInterval(30), {
    intervalMinutes: 30,
    nextRunAt: START_TIME + (4 + 30) * MINUTE
  });
  assert.equal(browser.stored.intervalMinutes, 30);
  assert.equal(browser.alarm().periodInMinutes, 30);
  assert.equal(browser.cookieRemovals.length, 0);
});

test("both supported interval endpoints can be saved", async () => {
  const browser = fakeChrome();
  const scheduler = createScheduler(browser.api);

  assert.equal((await scheduler.setInterval(1)).intervalMinutes, 1);
  assert.equal((await scheduler.setInterval(1440)).intervalMinutes, 1440);
  assert.equal(browser.alarm().scheduledTime, START_TIME + 1440 * MINUTE);
});

test("invalid input cannot change either settings or the running schedule", async () => {
  const browser = fakeChrome();
  const scheduler = createScheduler(browser.api);
  const before = await scheduler.setInterval(20);
  const invalidValues = [0, -1, 0.5, 1.5, 1441, NaN, Infinity, "10", null, undefined];

  for (const value of invalidValues) {
    await assert.rejects(scheduler.setInterval(value), RangeError);
  }

  assert.deepEqual(await scheduler.getSettings(), before);
  assert.equal(browser.stored.intervalMinutes, 20);
  assert.equal(browser.created.length, 1);
});

test("a delayed startup read cannot overwrite a simultaneous popup save", { timeout: 2000 }, async () => {
  const browser = fakeChrome({
    intervalMinutes: 10,
    alarm: { periodInMinutes: 10, scheduledTime: START_TIME + 10 * MINUTE }
  });
  const scheduler = createScheduler(browser.api);
  const block = browser.holdNextStorageRead();
  const startup = scheduler.getSettings();
  await block.started;

  const saving = scheduler.setInterval(60);
  const reading = scheduler.getSettings();
  await new Promise((resolve) => setImmediate(resolve));
  block.release();
  const [, saved, read] = await Promise.all([startup, saving, reading]);

  assert.equal(saved.intervalMinutes, 60);
  assert.deepEqual(read, saved);
  assert.equal(browser.stored.intervalMinutes, 60);
  assert.equal(browser.alarm().periodInMinutes, 60);
});

test("saved preferences take precedence over an outdated alarm", async () => {
  const browser = fakeChrome({
    intervalMinutes: 60,
    alarm: { periodInMinutes: 10, scheduledTime: START_TIME + MINUTE }
  });

  assert.deepEqual(await createScheduler(browser.api).getSettings(), {
    intervalMinutes: 60,
    nextRunAt: START_TIME + 60 * MINUTE
  });
  assert.equal(browser.alarm().periodInMinutes, 60);
});

test("upgrading a valid legacy custom alarm preserves its time and interval", async () => {
  const originalTime = START_TIME + 3 * MINUTE;
  const browser = fakeChrome({
    alarm: { periodInMinutes: 25, scheduledTime: originalTime }
  });

  assert.deepEqual(await createScheduler(browser.api).getSettings(), {
    intervalMinutes: 25,
    nextRunAt: originalTime
  });
  assert.equal(browser.stored.intervalMinutes, 25);
  assert.equal(browser.created.length, 0);
});

test("invalid persisted settings recover to the default interval", async () => {
  const browser = fakeChrome({
    intervalMinutes: -5,
    alarm: { periodInMinutes: 30, scheduledTime: START_TIME + 30 * MINUTE }
  });

  const settings = await createScheduler(browser.api).getSettings();
  assert.equal(settings.intervalMinutes, 10);
  assert.equal(browser.stored.intervalMinutes, 10);
  assert.equal(browser.alarm().periodInMinutes, 10);
});

test("an alarm failure restores the previous setting and does not poison later saves", async () => {
  const browser = fakeChrome();
  const scheduler = createScheduler(browser.api);
  const previous = await scheduler.setInterval(20);
  browser.failNextAlarm(new Error("Alarm creation failed"));

  await assert.rejects(scheduler.setInterval(30), /Alarm creation failed/);
  assert.equal(browser.stored.intervalMinutes, 20);
  assert.equal(browser.alarm().scheduledTime, previous.nextRunAt);
  assert.equal(browser.alarm().periodInMinutes, 20);

  assert.equal((await scheduler.setInterval(40)).intervalMinutes, 40);
  assert.equal((await scheduler.getSettings()).intervalMinutes, 40);
});

test("a failed first save leaves no new preference behind", async () => {
  const browser = fakeChrome();
  browser.failNextAlarm(new Error("Alarm creation failed"));
  const scheduler = createScheduler(browser.api);

  await assert.rejects(scheduler.setInterval(30), /Alarm creation failed/);
  assert.equal(Object.hasOwn(browser.stored, "intervalMinutes"), false);
  assert.equal(browser.alarm(), undefined);
  assert.equal((await scheduler.getSettings()).intervalMinutes, 10);
});

test("the background worker replies asynchronously and only clears on its own alarm", { timeout: 2000 }, async () => {
  const browser = fakeChrome();
  const originalChrome = globalThis.chrome;
  globalThis.chrome = browser.api;

  try {
    await import(new URL("../background.js?messaging-test", import.meta.url));
    assert.equal(browser.api.runtime.onMessage.listeners.length, 1);
    assert.equal(browser.api.runtime.onInstalled.listeners.length, 1);
    assert.equal(browser.api.runtime.onStartup.listeners.length, 1);
    const listener = browser.api.runtime.onMessage.listeners[0];

    function request(message) {
      let reply;
      const response = new Promise((resolve) => { reply = resolve; });
      assert.equal(listener(message, {}, reply), true);
      return response;
    }

    const initial = await request({ type: "get-settings" });
    assert.equal(initial.ok, true);
    assert.equal(initial.intervalMinutes, 10);

    const saved = await request({ type: "set-interval", intervalMinutes: 25 });
    assert.equal(saved.ok, true);
    assert.equal(saved.intervalMinutes, 25);
    assert.equal(browser.cookieRemovals.length, 0);

    const rejected = await request({ type: "set-interval", intervalMinutes: 0 });
    assert.equal(rejected.ok, false);
    assert.match(rejected.error, /whole number/);
    assert.equal(browser.stored.intervalMinutes, 25);

    let unrelatedReply = false;
    assert.equal(listener({ type: "unrelated" }, {}, () => { unrelatedReply = true; }), false);
    assert.equal(unrelatedReply, false);

    browser.removeAlarm();
    browser.api.runtime.onStartup.listeners[0]();
    assert.equal((await request({ type: "get-settings" })).intervalMinutes, 25);
    assert.equal(browser.alarm().periodInMinutes, 25);

    const onAlarm = browser.api.alarms.onAlarm.listeners[0];
    onAlarm({ name: "another-extension-task" });
    assert.equal(browser.cookieRemovals.length, 0);
    onAlarm({ name: ALARM_NAME });
    assert.deepEqual(browser.cookieRemovals, [{
      since: 0,
      originTypes: { unprotectedWeb: true, protectedWeb: true }
    }]);
  } finally {
    if (originalChrome === undefined) delete globalThis.chrome;
    else globalThis.chrome = originalChrome;
  }
});
