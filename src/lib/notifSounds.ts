export type NotifSoundId =
  | 'none'
  | 'cricket'
  | 'beep'
  | 'meow'
  | 'alert';

export type SoundOption = {
  id: NotifSoundId;
  label: string;
  file: string | null;
};

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'none', label: 'Sin sonido', file: null },
  { id: 'cricket', label: 'Cricri', file: 'sounds/cricket.wav' },
  { id: 'beep', label: 'Pitido', file: 'sounds/beep.wav' },
  { id: 'meow', label: 'Miau', file: 'sounds/meow.wav' },
  { id: 'alert', label: 'Alert', file: 'sounds/alert.wav' },
];

export const DEFAULT_SOUND_ID: NotifSoundId = 'alert';

const SOUND_IDS = new Set(SOUND_OPTIONS.map((o) => o.id));

export function normalizeSoundId(raw: unknown): NotifSoundId {
  // Migrate removed / renamed preferences
  if (raw === 'dinkdonk' || raw === 'alarm') return 'alert';
  if (typeof raw === 'string' && SOUND_IDS.has(raw as NotifSoundId)) {
    return raw as NotifSoundId;
  }
  return DEFAULT_SOUND_ID;
}

export function soundFileFor(id: NotifSoundId): string | null {
  return SOUND_OPTIONS.find((o) => o.id === id)?.file ?? null;
}
