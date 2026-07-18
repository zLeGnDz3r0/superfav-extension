// Offscreen document: plays notification WAVs for the service worker.

let current: HTMLAudioElement | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'superfav-play-sound') return;

  const file = typeof message.file === 'string' ? message.file : null;
  if (!file) {
    sendResponse?.({ ok: true, skipped: true });
    return false;
  }

  try {
    if (current) {
      current.pause();
      current.src = '';
      current = null;
    }
    const audio = new Audio(chrome.runtime.getURL(file));
    current = audio;
    void audio.play().then(
      () => sendResponse?.({ ok: true }),
      (err) => sendResponse?.({ ok: false, error: String(err) }),
    );
  } catch (err) {
    sendResponse?.({ ok: false, error: String(err) });
  }

  return true;
});
