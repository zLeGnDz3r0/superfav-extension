// Offscreen document: plays notification WAVs for the service worker.

let current = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'superfav-play-sound') return false;

  const file = typeof message.file === 'string' ? message.file : null;
  if (!file) {
    sendResponse({ ok: true, skipped: true });
    return false;
  }

  try {
    if (current) {
      try {
        current.pause();
        current.removeAttribute('src');
        current.load();
      } catch {
        // ignore
      }
      current = null;
    }

    const audio = new Audio(chrome.runtime.getURL(file));
    audio.volume = 1;
    current = audio;

    audio
      .play()
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));

    return true;
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
    return false;
  }
});
