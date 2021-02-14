import { SETTING_GLOBAL_VOLUME } from '../app.js';

export class SettingsUtils {
    static getVolume(volumeSetting) {
        return (SETTING_GLOBAL_VOLUME.value / 100) * (volumeSetting.value / 100);
    }

    static addVolumeSettingListener(volumeSetting, listener) {
        volumeSetting.addListener(listener);
        SETTING_GLOBAL_VOLUME.addListener(listener);
    }
}
