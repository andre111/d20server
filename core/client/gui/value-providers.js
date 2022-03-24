// @ts-check
import { ValueProviderAttachment } from './value-provider-attachment.js';
import { ValueProviderProfile } from './value-provider-profile.js';
import { ValueProviderDefault } from './value-provider-default.js';
import { ValueProviderWithPath } from './value-provider-with-path.js';

export function getValueProvider(type) {
    switch (type) {
        case 'actor':
            return new ValueProviderWithPath('actor');
        case 'attachment':
            return new ValueProviderAttachment();
        case 'profile':
            return new ValueProviderProfile(false);
        case 'profile-with-status':
            return new ValueProviderProfile(true);
        case 'compendium':
            return new ValueProviderWithPath('compendium');
        default:
            return new ValueProviderDefault(type);
    }
}
