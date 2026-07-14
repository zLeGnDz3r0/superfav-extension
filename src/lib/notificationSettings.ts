export const NOTIF_SETTINGS_KEY = 'superfav_notif_settings';

export type NotificationSettings = {
  desktopEnabled: boolean;
  titleChangeEnabled: boolean;
};

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  desktopEnabled: true,
  titleChangeEnabled: true,
};

type RawNotificationSettings = Partial<NotificationSettings> & {
  /** @deprecated */
  enabled?: boolean;
  /** @deprecated */
  opacity?: number;
  /** @deprecated */
  sensitivity?: number;
};

export function normalizeNotificationSettings(
  raw: RawNotificationSettings | undefined,
): NotificationSettings {
  return {
    desktopEnabled: raw?.desktopEnabled ?? DEFAULT_NOTIF_SETTINGS.desktopEnabled,
    titleChangeEnabled: raw?.titleChangeEnabled ?? DEFAULT_NOTIF_SETTINGS.titleChangeEnabled,
  };
}
