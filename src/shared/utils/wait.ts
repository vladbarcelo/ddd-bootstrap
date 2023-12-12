/* eslint-disable no-await-in-loop, no-promise-executor-return */
export async function waitUntil(
  checkerFn: () => Promise<boolean>,
  maxTries = 0,
  waitDurationMs = 50,
  timeoutMs = 5000,
): Promise<void> {
  let loopActive = true;

  while (loopActive) {
    let tries = 0;
    const isReady = await checkerFn();

    if (
      // is ready
      isReady
      // tries exhausted
      || (maxTries !== 0 && tries >= maxTries)
      // total time exceeded timeout
      || tries * waitDurationMs >= timeoutMs
    ) {
      loopActive = false;
    } else {
      await new Promise((r) => setTimeout(r, waitDurationMs));
      tries += 1;
    }
  }
}
