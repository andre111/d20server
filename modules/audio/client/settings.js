// @ts-check
import { SettingsEntryNumberRange } from '../../../core/client/settings/settings-entry-number-range.js';
import { SETTING_PAGE_AUDIO } from '../../../core/client/settings/settings.js';

export const SETTING_AMBIENT_VOLUME = new SettingsEntryNumberRange('settings.volume.ambient', 'Ambient Volume', 100, 0, 100);
export const SETTING_MUSIC_VOLUME = new SettingsEntryNumberRange('settings.volume.music', 'Music Volume', 25, 0, 100);
SETTING_PAGE_AUDIO.addEntry('ambient_volume', SETTING_AMBIENT_VOLUME);
SETTING_PAGE_AUDIO.addEntry('music_volume', SETTING_MUSIC_VOLUME);
