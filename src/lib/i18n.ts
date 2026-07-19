export const LOCALE_KEY = 'superfav_locale';

export type LocaleId =
  | 'es'
  | 'en'
  | 'ca'
  | 'fr'
  | 'it'
  | 'de'
  | 'tr'
  | 'hi'
  | 'zh'
  | 'ja';

export type MessageKey =
  | 'gearBack'
  | 'gearManage'
  | 'gearTitle'
  | 'refresh'
  | 'refreshTitle'
  | 'liveCount'
  | 'desktopToggle'
  | 'desktopToggleAria'
  | 'titleToggle'
  | 'titleToggleAria'
  | 'noCategory'
  | 'language'
  | 'soundSection'
  | 'soundHint'
  | 'soundFallback'
  | 'previewSound'
  | 'previewTitle'
  | 'soundNone'
  | 'soundCricket'
  | 'soundBeep'
  | 'soundMeow'
  | 'soundAlert'
  | 'mySuperFavs'
  | 'channelCountOne'
  | 'channelCountMany'
  | 'channelPrefsHint'
  | 'noSuperFavsTitle'
  | 'noSuperFavsSettingsDesc'
  | 'liveLabel'
  | 'titleLabel'
  | 'liveAria'
  | 'titleAria'
  | 'hintLiveGlobalOff'
  | 'hintLiveNeedGlobal'
  | 'hintTitleGlobalOff'
  | 'hintTitleNeedGlobal'
  | 'searching'
  | 'emptyNoneLive'
  | 'emptyNoneLiveDesc'
  | 'emptyNoFavs'
  | 'emptyNoFavsDesc'
  | 'errorTitle'
  | 'errorDesc'
  | 'retry'
  | 'addSuperFav'
  | 'removeSuperFav'
  | 'notifLive'
  | 'notifTitleChange'
  | 'noTitle';

export type Messages = Record<MessageKey, string>;

export const LOCALE_OPTIONS: { id: LocaleId; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'ca', label: 'Català' },
  { id: 'fr', label: 'Français' },
  { id: 'it', label: 'Italiano' },
  { id: 'de', label: 'Deutsch' },
  { id: 'tr', label: 'Türkçe' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'zh', label: '中文' },
  { id: 'ja', label: '日本語' },
];

const es: Messages = {
  gearBack: 'Volver a directos',
  gearManage: 'Gestionar avisos por SuperFav',
  gearTitle: 'Gestionar SuperFavs',
  refresh: 'Actualizar directos',
  refreshTitle: 'Actualizar',
  liveCount: '{n} en directo',
  desktopToggle: 'Avisar en el escritorio (directo)',
  desktopToggleAria: 'Avisar en el escritorio cuando hay directo',
  titleToggle: 'Avisar si cambia el título',
  titleToggleAria: 'Avisar si cambia el título del canal',
  noCategory: 'Sin categoría',
  language: 'Idioma',
  soundSection: 'Sonido del aviso',
  soundHint: 'Se reproduce al lanzar el toast (~3 s). Pulsa ▶ para probar.',
  soundFallback: 'Sonido',
  previewSound: 'Probar {name}',
  previewTitle: 'Probar',
  soundNone: 'Sin sonido',
  soundCricket: 'Cricri',
  soundBeep: 'Pitido',
  soundMeow: 'Miau',
  soundAlert: 'Alert',
  mySuperFavs: 'Mis SuperFavs',
  channelCountOne: '1 canal',
  channelCountMany: '{n} canales',
  channelPrefsHint:
    'Desactiva avisos por canal. Los generales de arriba deben estar activos.',
  noSuperFavsTitle: 'Aún no tienes SuperFavs',
  noSuperFavsSettingsDesc:
    'Márcalos en Twitch con el diamante y podrás gestionar sus avisos aquí.',
  liveLabel: 'Directo',
  titleLabel: 'Título',
  liveAria: 'Avisar de directo de {name}',
  titleAria: 'Avisar de título de {name}',
  hintLiveGlobalOff:
    'Los avisos generales están desactivados. Activa “Avisar en el escritorio (directo)” arriba para poder habilitar avisos individuales de directo.',
  hintLiveNeedGlobal:
    'Activa primero el aviso general de directo para poder habilitarlo en este canal.',
  hintTitleGlobalOff:
    'Los avisos generales están desactivados. Activa “Avisar si cambia el título” arriba para poder habilitar avisos individuales de título.',
  hintTitleNeedGlobal:
    'Activa primero el aviso general de título para poder habilitarlo en este canal.',
  searching: 'Buscando tus directos…',
  emptyNoneLive: 'Ningún SuperFav en directo',
  emptyNoneLiveDesc: 'Tus streamers favoritos están descansando. Vuelve más tarde.',
  emptyNoFavs: 'Aún no tienes SuperFavs',
  emptyNoFavsDesc:
    'Marca streamers con el botón de SuperFav en sus canales de Twitch y aparecerán aquí cuando estén en directo.',
  errorTitle: 'No se pudo conectar',
  errorDesc: 'Comprueba que el servidor proxy esté activo e inténtalo de nuevo.',
  retry: 'Reintentar',
  addSuperFav: 'Añadir a SuperFav',
  removeSuperFav: 'Quitar de SuperFav',
  notifLive: '{name} está en directo',
  notifTitleChange: '{name} cambió el título',
  noTitle: '(sin título)',
};

const en: Messages = {
  gearBack: 'Back to live',
  gearManage: 'Manage SuperFav alerts',
  gearTitle: 'Manage SuperFavs',
  refresh: 'Refresh live streams',
  refreshTitle: 'Refresh',
  liveCount: '{n} live',
  desktopToggle: 'Desktop alerts (live)',
  desktopToggleAria: 'Notify on desktop when a stream goes live',
  titleToggle: 'Alert on title change',
  titleToggleAria: 'Notify when a channel title changes',
  noCategory: 'No category',
  language: 'Language',
  soundSection: 'Alert sound',
  soundHint: 'Plays when a toast appears (~3 s). Press ▶ to preview.',
  soundFallback: 'Sound',
  previewSound: 'Preview {name}',
  previewTitle: 'Preview',
  soundNone: 'No sound',
  soundCricket: 'Cricket',
  soundBeep: 'Beep',
  soundMeow: 'Meow',
  soundAlert: 'Alert',
  mySuperFavs: 'My SuperFavs',
  channelCountOne: '1 channel',
  channelCountMany: '{n} channels',
  channelPrefsHint: 'Mute per channel. Global toggles above must be on.',
  noSuperFavsTitle: 'No SuperFavs yet',
  noSuperFavsSettingsDesc: 'Mark them on Twitch with the diamond to manage alerts here.',
  liveLabel: 'Live',
  titleLabel: 'Title',
  liveAria: 'Live alerts for {name}',
  titleAria: 'Title alerts for {name}',
  hintLiveGlobalOff:
    'Global alerts are off. Enable “Desktop alerts (live)” above to turn on per-channel live alerts.',
  hintLiveNeedGlobal: 'Enable the global live alert first for this channel.',
  hintTitleGlobalOff:
    'Global alerts are off. Enable “Alert on title change” above to turn on per-channel title alerts.',
  hintTitleNeedGlobal: 'Enable the global title alert first for this channel.',
  searching: 'Looking for your live streams…',
  emptyNoneLive: 'No SuperFavs live',
  emptyNoneLiveDesc: 'Your favorites are offline. Check back later.',
  emptyNoFavs: 'No SuperFavs yet',
  emptyNoFavsDesc:
    'Mark streamers with the SuperFav button on Twitch and they will show up here when live.',
  errorTitle: 'Could not connect',
  errorDesc: 'Check that the proxy server is up and try again.',
  retry: 'Retry',
  addSuperFav: 'Add to SuperFav',
  removeSuperFav: 'Remove from SuperFav',
  notifLive: '{name} is live',
  notifTitleChange: '{name} changed the title',
  noTitle: '(no title)',
};

const ca: Messages = {
  gearBack: 'Tornar als directes',
  gearManage: 'Gestionar avisos per SuperFav',
  gearTitle: 'Gestionar SuperFavs',
  refresh: 'Actualitzar directes',
  refreshTitle: 'Actualitzar',
  liveCount: '{n} en directe',
  desktopToggle: 'Avisar a l’escriptori (directe)',
  desktopToggleAria: 'Avisar a l’escriptori quan hi ha directe',
  titleToggle: 'Avisar si canvia el títol',
  titleToggleAria: 'Avisar si canvia el títol del canal',
  noCategory: 'Sense categoria',
  language: 'Idioma',
  soundSection: 'So de l’avís',
  soundHint: 'Es reprodueix en llançar el toast (~3 s). Prem ▶ per provar.',
  soundFallback: 'So',
  previewSound: 'Provar {name}',
  previewTitle: 'Provar',
  soundNone: 'Sense so',
  soundCricket: 'Cricri',
  soundBeep: 'Pit',
  soundMeow: 'Miau',
  soundAlert: 'Alert',
  mySuperFavs: 'Els meus SuperFavs',
  channelCountOne: '1 canal',
  channelCountMany: '{n} canals',
  channelPrefsHint: 'Desactiva avisos per canal. Els generals de dalt han d’estar actius.',
  noSuperFavsTitle: 'Encara no tens SuperFavs',
  noSuperFavsSettingsDesc: 'Marca’ls a Twitch amb el diamant i gestiona’n els avisos aquí.',
  liveLabel: 'Directe',
  titleLabel: 'Títol',
  liveAria: 'Avisar de directe de {name}',
  titleAria: 'Avisar de títol de {name}',
  hintLiveGlobalOff:
    'Els avisos generals estan desactivats. Activa “Avisar a l’escriptori (directe)” a dalt per habilitar avisos individuals de directe.',
  hintLiveNeedGlobal: 'Activa primer l’avís general de directe per a aquest canal.',
  hintTitleGlobalOff:
    'Els avisos generals estan desactivats. Activa “Avisar si canvia el títol” a dalt per habilitar avisos individuals de títol.',
  hintTitleNeedGlobal: 'Activa primer l’avís general de títol per a aquest canal.',
  searching: 'Buscant els teus directes…',
  emptyNoneLive: 'Cap SuperFav en directe',
  emptyNoneLiveDesc: 'Els teus streamers preferits descansen. Torna més tard.',
  emptyNoFavs: 'Encara no tens SuperFavs',
  emptyNoFavsDesc:
    'Marca streamers amb el botó SuperFav als seus canals de Twitch i apareixeran aquí quan estiguin en directe.',
  errorTitle: 'No s’ha pogut connectar',
  errorDesc: 'Comprova que el servidor proxy estigui actiu i torna-ho a provar.',
  retry: 'Tornar-ho a provar',
  addSuperFav: 'Afegir a SuperFav',
  removeSuperFav: 'Treure de SuperFav',
  notifLive: '{name} està en directe',
  notifTitleChange: '{name} ha canviat el títol',
  noTitle: '(sense títol)',
};

const fr: Messages = {
  gearBack: 'Retour aux directs',
  gearManage: 'Gérer les alertes SuperFav',
  gearTitle: 'Gérer les SuperFavs',
  refresh: 'Actualiser les directs',
  refreshTitle: 'Actualiser',
  liveCount: '{n} en direct',
  desktopToggle: 'Alertes bureau (direct)',
  desktopToggleAria: 'Notifier sur le bureau lors d’un direct',
  titleToggle: 'Alerte si le titre change',
  titleToggleAria: 'Notifier si le titre de la chaîne change',
  noCategory: 'Sans catégorie',
  language: 'Langue',
  soundSection: 'Son de l’alerte',
  soundHint: 'Joué à l’apparition du toast (~3 s). Appuyez sur ▶ pour tester.',
  soundFallback: 'Son',
  previewSound: 'Tester {name}',
  previewTitle: 'Tester',
  soundNone: 'Sans son',
  soundCricket: 'Cri-cri',
  soundBeep: 'Bip',
  soundMeow: 'Miaou',
  soundAlert: 'Alert',
  mySuperFavs: 'Mes SuperFavs',
  channelCountOne: '1 chaîne',
  channelCountMany: '{n} chaînes',
  channelPrefsHint: 'Coupez les alertes par chaîne. Les options globales ci-dessus doivent être actives.',
  noSuperFavsTitle: 'Pas encore de SuperFavs',
  noSuperFavsSettingsDesc: 'Marquez-les sur Twitch avec le diamant pour gérer les alertes ici.',
  liveLabel: 'Direct',
  titleLabel: 'Titre',
  liveAria: 'Alertes direct pour {name}',
  titleAria: 'Alertes titre pour {name}',
  hintLiveGlobalOff:
    'Les alertes globales sont désactivées. Activez « Alertes bureau (direct) » ci-dessus pour les alertes par chaîne.',
  hintLiveNeedGlobal: 'Activez d’abord l’alerte directe globale pour cette chaîne.',
  hintTitleGlobalOff:
    'Les alertes globales sont désactivées. Activez « Alerte si le titre change » ci-dessus pour les alertes par chaîne.',
  hintTitleNeedGlobal: 'Activez d’abord l’alerte titre globale pour cette chaîne.',
  searching: 'Recherche de vos directs…',
  emptyNoneLive: 'Aucun SuperFav en direct',
  emptyNoneLiveDesc: 'Vos streamers préférés sont hors ligne. Revenez plus tard.',
  emptyNoFavs: 'Pas encore de SuperFavs',
  emptyNoFavsDesc:
    'Marquez des streamers avec le bouton SuperFav sur Twitch ; ils apparaîtront ici en direct.',
  errorTitle: 'Connexion impossible',
  errorDesc: 'Vérifiez que le serveur proxy est actif et réessayez.',
  retry: 'Réessayer',
  addSuperFav: 'Ajouter à SuperFav',
  removeSuperFav: 'Retirer de SuperFav',
  notifLive: '{name} est en direct',
  notifTitleChange: '{name} a changé le titre',
  noTitle: '(sans titre)',
};

const it: Messages = {
  gearBack: 'Torna ai live',
  gearManage: 'Gestisci avvisi SuperFav',
  gearTitle: 'Gestisci SuperFavs',
  refresh: 'Aggiorna live',
  refreshTitle: 'Aggiorna',
  liveCount: '{n} in diretta',
  desktopToggle: 'Avvisi desktop (live)',
  desktopToggleAria: 'Notifica sul desktop quando c’è un live',
  titleToggle: 'Avvisa se cambia il titolo',
  titleToggleAria: 'Notifica se cambia il titolo del canale',
  noCategory: 'Nessuna categoria',
  language: 'Lingua',
  soundSection: 'Suono dell’avviso',
  soundHint: 'Si riproduce con il toast (~3 s). Premi ▶ per provare.',
  soundFallback: 'Suono',
  previewSound: 'Prova {name}',
  previewTitle: 'Prova',
  soundNone: 'Nessun suono',
  soundCricket: 'Cri-cri',
  soundBeep: 'Beep',
  soundMeow: 'Miao',
  soundAlert: 'Alert',
  mySuperFavs: 'I miei SuperFavs',
  channelCountOne: '1 canale',
  channelCountMany: '{n} canali',
  channelPrefsHint: 'Disattiva avvisi per canale. Quelli globali sopra devono essere attivi.',
  noSuperFavsTitle: 'Non hai ancora SuperFavs',
  noSuperFavsSettingsDesc: 'Segnali su Twitch con il diamante e gestisci gli avvisi qui.',
  liveLabel: 'Live',
  titleLabel: 'Titolo',
  liveAria: 'Avvisi live di {name}',
  titleAria: 'Avvisi titolo di {name}',
  hintLiveGlobalOff:
    'Gli avvisi globali sono disattivati. Attiva « Avvisi desktop (live) » sopra per gli avvisi per canale.',
  hintLiveNeedGlobal: 'Attiva prima l’avviso live globale per questo canale.',
  hintTitleGlobalOff:
    'Gli avvisi globali sono disattivati. Attiva « Avvisa se cambia il titolo » sopra per gli avvisi per canale.',
  hintTitleNeedGlobal: 'Attiva prima l’avviso titolo globale per questo canale.',
  searching: 'Cerco i tuoi live…',
  emptyNoneLive: 'Nessun SuperFav in diretta',
  emptyNoneLiveDesc: 'I tuoi streamer preferiti sono offline. Torna più tardi.',
  emptyNoFavs: 'Non hai ancora SuperFavs',
  emptyNoFavsDesc:
    'Segna gli streamer con il pulsante SuperFav su Twitch e compariranno qui quando sono live.',
  errorTitle: 'Connessione non riuscita',
  errorDesc: 'Verifica che il server proxy sia attivo e riprova.',
  retry: 'Riprova',
  addSuperFav: 'Aggiungi a SuperFav',
  removeSuperFav: 'Rimuovi da SuperFav',
  notifLive: '{name} è in diretta',
  notifTitleChange: '{name} ha cambiato il titolo',
  noTitle: '(senza titolo)',
};

const de: Messages = {
  gearBack: 'Zurück zu Live',
  gearManage: 'SuperFav-Benachrichtigungen verwalten',
  gearTitle: 'SuperFavs verwalten',
  refresh: 'Lives aktualisieren',
  refreshTitle: 'Aktualisieren',
  liveCount: '{n} live',
  desktopToggle: 'Desktop-Hinweise (Live)',
  desktopToggleAria: 'Am Desktop benachrichtigen, wenn ein Stream live geht',
  titleToggle: 'Bei Titeländerung benachrichtigen',
  titleToggleAria: 'Benachrichtigen, wenn sich der Kanaltitel ändert',
  noCategory: 'Keine Kategorie',
  language: 'Sprache',
  soundSection: 'Hinweiston',
  soundHint: 'Wird beim Toast abgespielt (~3 s). ▶ zum Testen.',
  soundFallback: 'Ton',
  previewSound: '{name} testen',
  previewTitle: 'Testen',
  soundNone: 'Kein Ton',
  soundCricket: 'Zirkus',
  soundBeep: 'Piep',
  soundMeow: 'Miau',
  soundAlert: 'Alert',
  mySuperFavs: 'Meine SuperFavs',
  channelCountOne: '1 Kanal',
  channelCountMany: '{n} Kanäle',
  channelPrefsHint: 'Hinweise pro Kanal aus. Globale Schalter oben müssen an sein.',
  noSuperFavsTitle: 'Noch keine SuperFavs',
  noSuperFavsSettingsDesc: 'Markiere sie auf Twitch mit dem Diamanten und verwalte Hinweise hier.',
  liveLabel: 'Live',
  titleLabel: 'Titel',
  liveAria: 'Live-Hinweise für {name}',
  titleAria: 'Titel-Hinweise für {name}',
  hintLiveGlobalOff:
    'Globale Hinweise sind aus. Aktiviere oben „Desktop-Hinweise (Live)“ für kanalweise Live-Hinweise.',
  hintLiveNeedGlobal: 'Aktiviere zuerst den globalen Live-Hinweis für diesen Kanal.',
  hintTitleGlobalOff:
    'Globale Hinweise sind aus. Aktiviere oben „Bei Titeländerung benachrichtigen“ für kanalweise Titel-Hinweise.',
  hintTitleNeedGlobal: 'Aktiviere zuerst den globalen Titel-Hinweis für diesen Kanal.',
  searching: 'Suche deine Lives…',
  emptyNoneLive: 'Kein SuperFav live',
  emptyNoneLiveDesc: 'Deine Favoriten sind offline. Schau später wieder vorbei.',
  emptyNoFavs: 'Noch keine SuperFavs',
  emptyNoFavsDesc:
    'Markiere Streamer mit dem SuperFav-Button auf Twitch – sie erscheinen hier, wenn sie live sind.',
  errorTitle: 'Verbindung fehlgeschlagen',
  errorDesc: 'Prüfe, ob der Proxy-Server läuft, und versuche es erneut.',
  retry: 'Erneut versuchen',
  addSuperFav: 'Zu SuperFav hinzufügen',
  removeSuperFav: 'Von SuperFav entfernen',
  notifLive: '{name} ist live',
  notifTitleChange: '{name} hat den Titel geändert',
  noTitle: '(kein Titel)',
};

const tr: Messages = {
  gearBack: 'Canlılara dön',
  gearManage: 'SuperFav bildirimlerini yönet',
  gearTitle: 'SuperFavs yönet',
  refresh: 'Canlıları yenile',
  refreshTitle: 'Yenile',
  liveCount: '{n} canlı',
  desktopToggle: 'Masaüstü bildirimi (canlı)',
  desktopToggleAria: 'Canlıya geçince masaüstünde bildir',
  titleToggle: 'Başlık değişince bildir',
  titleToggleAria: 'Kanal başlığı değişince bildir',
  noCategory: 'Kategori yok',
  language: 'Dil',
  soundSection: 'Bildirim sesi',
  soundHint: 'Toast gelince çalar (~3 sn). Denemek için ▶.',
  soundFallback: 'Ses',
  previewSound: '{name} dene',
  previewTitle: 'Dene',
  soundNone: 'Ses yok',
  soundCricket: 'Cırcır',
  soundBeep: 'Bip',
  soundMeow: 'Miyav',
  soundAlert: 'Alert',
  mySuperFavs: 'SuperFav’larım',
  channelCountOne: '1 kanal',
  channelCountMany: '{n} kanal',
  channelPrefsHint: 'Kanal bazında kapat. Yukarıdaki genel anahtarlar açık olmalı.',
  noSuperFavsTitle: 'Henüz SuperFav yok',
  noSuperFavsSettingsDesc: 'Twitch’te elmasla işaretle; bildirimleri burada yönet.',
  liveLabel: 'Canlı',
  titleLabel: 'Başlık',
  liveAria: '{name} canlı bildirimi',
  titleAria: '{name} başlık bildirimi',
  hintLiveGlobalOff:
    'Genel bildirimler kapalı. Kanal canlı bildirimi için yukarıdan “Masaüstü bildirimi (canlı)”yı aç.',
  hintLiveNeedGlobal: 'Bu kanal için önce genel canlı bildirimini aç.',
  hintTitleGlobalOff:
    'Genel bildirimler kapalı. Kanal başlık bildirimi için yukarıdan “Başlık değişince bildir”i aç.',
  hintTitleNeedGlobal: 'Bu kanal için önce genel başlık bildirimini aç.',
  searching: 'Canlıların aranıyor…',
  emptyNoneLive: 'Canlı SuperFav yok',
  emptyNoneLiveDesc: 'Favorilerin çevrimdışı. Daha sonra bak.',
  emptyNoFavs: 'Henüz SuperFav yok',
  emptyNoFavsDesc:
    'Twitch’te SuperFav düğmesiyle işaretle; canlı olunca burada görünürler.',
  errorTitle: 'Bağlantı kurulamadı',
  errorDesc: 'Proxy sunucusunun açık olduğunu kontrol edip yeniden dene.',
  retry: 'Yeniden dene',
  addSuperFav: 'SuperFav’a ekle',
  removeSuperFav: 'SuperFav’dan kaldır',
  notifLive: '{name} canlıda',
  notifTitleChange: '{name} başlığı değiştirdi',
  noTitle: '(başlık yok)',
};

const hi: Messages = {
  gearBack: 'लाइव पर वापस',
  gearManage: 'SuperFav अलर्ट प्रबंधित करें',
  gearTitle: 'SuperFavs प्रबंधित करें',
  refresh: 'लाइव रीफ़्रेश करें',
  refreshTitle: 'रीफ़्रेश',
  liveCount: '{n} लाइव',
  desktopToggle: 'डेस्कटॉप अलर्ट (लाइव)',
  desktopToggleAria: 'लाइव होने पर डेस्कटॉप पर सूचित करें',
  titleToggle: 'शीर्षक बदलने पर अलर्ट',
  titleToggleAria: 'चैनल शीर्षक बदलने पर सूचित करें',
  noCategory: 'कोई श्रेणी नहीं',
  language: 'भाषा',
  soundSection: 'अलर्ट ध्वनि',
  soundHint: 'टोस्ट आने पर बजती है (~3 सेकंड)। ▶ से सुनें।',
  soundFallback: 'ध्वनि',
  previewSound: '{name} आज़माएँ',
  previewTitle: 'आज़माएँ',
  soundNone: 'कोई ध्वनि नहीं',
  soundCricket: 'झींगुर',
  soundBeep: 'बीप',
  soundMeow: 'म्याऊँ',
  soundAlert: 'Alert',
  mySuperFavs: 'मेरे SuperFavs',
  channelCountOne: '1 चैनल',
  channelCountMany: '{n} चैनल',
  channelPrefsHint: 'प्रति चैनल बंद करें। ऊपर के वैश्विक टॉगल चालू होने चाहिए।',
  noSuperFavsTitle: 'अभी कोई SuperFav नहीं',
  noSuperFavsSettingsDesc: 'Twitch पर हीरे से चिह्नित करें और यहाँ अलर्ट प्रबंधित करें।',
  liveLabel: 'लाइव',
  titleLabel: 'शीर्षक',
  liveAria: '{name} का लाइव अलर्ट',
  titleAria: '{name} का शीर्षक अलर्ट',
  hintLiveGlobalOff:
    'वैश्विक अलर्ट बंद हैं। प्रति-चैनल लाइव के लिए ऊपर “डेस्कटॉप अलर्ट (लाइव)” चालू करें।',
  hintLiveNeedGlobal: 'इस चैनल के लिए पहले वैश्विक लाइव अलर्ट चालू करें।',
  hintTitleGlobalOff:
    'वैश्विक अलर्ट बंद हैं। प्रति-चैनल शीर्षक के लिए ऊपर “शीर्षक बदलने पर अलर्ट” चालू करें।',
  hintTitleNeedGlobal: 'इस चैनल के लिए पहले वैश्विक शीर्षक अलर्ट चालू करें।',
  searching: 'आपके लाइव खोजे जा रहे हैं…',
  emptyNoneLive: 'कोई SuperFav लाइव नहीं',
  emptyNoneLiveDesc: 'आपके पसंदीदा ऑफ़लाइन हैं। बाद में देखें।',
  emptyNoFavs: 'अभी कोई SuperFav नहीं',
  emptyNoFavsDesc:
    'Twitch पर SuperFav बटन से चिह्नित करें; लाइव होने पर यहाँ दिखेंगे।',
  errorTitle: 'कनेक्ट नहीं हो सका',
  errorDesc: 'प्रॉक्सी सर्वर चालू है या नहीं जाँचें और फिर कोशिश करें।',
  retry: 'फिर कोशिश करें',
  addSuperFav: 'SuperFav में जोड़ें',
  removeSuperFav: 'SuperFav से हटाएँ',
  notifLive: '{name} लाइव है',
  notifTitleChange: '{name} ने शीर्षक बदला',
  noTitle: '(कोई शीर्षक नहीं)',
};

const zh: Messages = {
  gearBack: '返回直播',
  gearManage: '管理 SuperFav 提醒',
  gearTitle: '管理 SuperFavs',
  refresh: '刷新直播',
  refreshTitle: '刷新',
  liveCount: '{n} 个直播中',
  desktopToggle: '桌面提醒（开播）',
  desktopToggleAria: '开播时在桌面通知',
  titleToggle: '标题变更时提醒',
  titleToggleAria: '频道标题变更时通知',
  noCategory: '无分类',
  language: '语言',
  soundSection: '提醒声音',
  soundHint: '弹出提示时播放（约 3 秒）。按 ▶ 试听。',
  soundFallback: '声音',
  previewSound: '试听 {name}',
  previewTitle: '试听',
  soundNone: '无声音',
  soundCricket: '蟋蟀',
  soundBeep: '提示音',
  soundMeow: '喵',
  soundAlert: 'Alert',
  mySuperFavs: '我的 SuperFavs',
  channelCountOne: '1 个频道',
  channelCountMany: '{n} 个频道',
  channelPrefsHint: '可按频道关闭。上方全局开关需开启。',
  noSuperFavsTitle: '还没有 SuperFavs',
  noSuperFavsSettingsDesc: '在 Twitch 用钻石标记，即可在此管理提醒。',
  liveLabel: '开播',
  titleLabel: '标题',
  liveAria: '{name} 的开播提醒',
  titleAria: '{name} 的标题提醒',
  hintLiveGlobalOff: '全局提醒已关闭。请先开启上方“桌面提醒（开播）”以启用单频道开播提醒。',
  hintLiveNeedGlobal: '请先为此频道开启全局开播提醒。',
  hintTitleGlobalOff: '全局提醒已关闭。请先开启上方“标题变更时提醒”以启用单频道标题提醒。',
  hintTitleNeedGlobal: '请先为此频道开启全局标题提醒。',
  searching: '正在查找你的直播…',
  emptyNoneLive: '没有 SuperFav 在直播',
  emptyNoneLiveDesc: '你的收藏主播暂未开播，稍后再来。',
  emptyNoFavs: '还没有 SuperFavs',
  emptyNoFavsDesc: '在 Twitch 用 SuperFav 按钮标记主播，开播后会显示在这里。',
  errorTitle: '无法连接',
  errorDesc: '请确认代理服务器已启动后重试。',
  retry: '重试',
  addSuperFav: '添加到 SuperFav',
  removeSuperFav: '从 SuperFav 移除',
  notifLive: '{name} 正在直播',
  notifTitleChange: '{name} 更改了标题',
  noTitle: '（无标题）',
};

const ja: Messages = {
  gearBack: '配信一覧に戻る',
  gearManage: 'SuperFav 通知を管理',
  gearTitle: 'SuperFavs を管理',
  refresh: '配信を更新',
  refreshTitle: '更新',
  liveCount: '{n} 配信中',
  desktopToggle: 'デスクトップ通知（配信）',
  desktopToggleAria: '配信開始時にデスクトップへ通知',
  titleToggle: 'タイトル変更を通知',
  titleToggleAria: 'チャンネルタイトル変更時に通知',
  noCategory: 'カテゴリなし',
  language: '言語',
  soundSection: '通知音',
  soundHint: 'トースト表示時に再生（約 3 秒）。▶ で試聴。',
  soundFallback: 'サウンド',
  previewSound: '{name} を試す',
  previewTitle: '試す',
  soundNone: '音なし',
  soundCricket: 'コオロギ',
  soundBeep: 'ビープ',
  soundMeow: 'ニャー',
  soundAlert: 'Alert',
  mySuperFavs: 'マイ SuperFavs',
  channelCountOne: '1 チャンネル',
  channelCountMany: '{n} チャンネル',
  channelPrefsHint: 'チャンネルごとにオフにできます。上の全体スイッチがオンである必要があります。',
  noSuperFavsTitle: 'まだ SuperFav がありません',
  noSuperFavsSettingsDesc: 'Twitch でダイヤを押して登録し、ここで通知を管理できます。',
  liveLabel: '配信',
  titleLabel: 'タイトル',
  liveAria: '{name} の配信通知',
  titleAria: '{name} のタイトル通知',
  hintLiveGlobalOff:
    '全体通知がオフです。チャンネル別の配信通知には、上の「デスクトップ通知（配信）」をオンにしてください。',
  hintLiveNeedGlobal: 'このチャンネルでは先に全体の配信通知をオンにしてください。',
  hintTitleGlobalOff:
    '全体通知がオフです。チャンネル別のタイトル通知には、上の「タイトル変更を通知」をオンにしてください。',
  hintTitleNeedGlobal: 'このチャンネルでは先に全体のタイトル通知をオンにしてください。',
  searching: '配信を探しています…',
  emptyNoneLive: '配信中の SuperFav はありません',
  emptyNoneLiveDesc: 'お気に入りはオフラインです。あとでまた確認してください。',
  emptyNoFavs: 'まだ SuperFav がありません',
  emptyNoFavsDesc:
    'Twitch の SuperFav ボタンで登録すると、配信中にここに表示されます。',
  errorTitle: '接続できませんでした',
  errorDesc: 'プロキシサーバーが起動しているか確認して、もう一度お試しください。',
  retry: '再試行',
  addSuperFav: 'SuperFav に追加',
  removeSuperFav: 'SuperFav から削除',
  notifLive: '{name} が配信中',
  notifTitleChange: '{name} がタイトルを変更しました',
  noTitle: '（タイトルなし）',
};

const ALL: Record<LocaleId, Messages> = {
  es,
  en,
  ca,
  fr,
  it,
  de,
  tr,
  hi,
  zh,
  ja,
};

export function isLocaleId(raw: unknown): raw is LocaleId {
  return typeof raw === 'string' && raw in ALL;
}

export function detectBrowserLocale(): LocaleId {
  try {
    const raw = chrome.i18n.getUILanguage().toLowerCase();
    const primary = raw.split('-')[0] ?? raw;
    if (isLocaleId(primary)) return primary;
    if (raw.startsWith('zh')) return 'zh';
  } catch {
    /* ignore */
  }
  return 'es';
}

export function normalizeLocale(raw: unknown): LocaleId {
  if (isLocaleId(raw)) return raw;
  return detectBrowserLocale();
}

export function getMessages(locale: LocaleId): Messages {
  return ALL[locale] ?? es;
}

export function t(
  locale: LocaleId,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let s = getMessages(locale)[key] ?? es[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

export async function loadStoredLocale(): Promise<LocaleId> {
  const res = await chrome.storage.sync.get([LOCALE_KEY]);
  if (isLocaleId(res[LOCALE_KEY])) return res[LOCALE_KEY];
  return detectBrowserLocale();
}

export async function saveLocale(locale: LocaleId): Promise<void> {
  await chrome.storage.sync.set({ [LOCALE_KEY]: locale });
}

export function soundLabelKey(id: string): MessageKey {
  switch (id) {
    case 'none':
      return 'soundNone';
    case 'cricket':
      return 'soundCricket';
    case 'beep':
      return 'soundBeep';
    case 'meow':
      return 'soundMeow';
    case 'alert':
      return 'soundAlert';
    default:
      return 'soundFallback';
  }
}
