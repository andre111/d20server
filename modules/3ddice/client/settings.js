// @ts-check
import { SettingsEntryNumberRange } from '../../../core/client/settings/settings-entry-number-range.js';
import { SettingsEntryToggle } from '../../../core/client/settings/settings-entry-toggle.js';
import { Settings } from '../../../core/client/settings/settings.js';

export const SETTING_3DDICE_ENABLE = new SettingsEntryToggle('settings.3ddice.enabled', 'Enabled', true);
export const SETTING_3DDICE_VOLUME = new SettingsEntryNumberRange('settings.3ddice.volume', 'Volume', 100, 0, 100);
export const SETTING_PAGE_3DDICE = Settings.createPage('3ddice', '3D Dice');
SETTING_PAGE_3DDICE.addEntry('enable', SETTING_3DDICE_ENABLE);
SETTING_PAGE_3DDICE.addEntry('volume', SETTING_3DDICE_VOLUME);
