import { ValueProviderAttachment } from './value-provider-attachment.js';
import { ValueProviderImage } from './value-provider-image.js';
import { ValueProviderProfile } from './value-provider-profile.js';
import { ValueProviderDefault } from './value-provider-default.js';
import { ValueProviderActor } from './value-provider-actor.js';

export function getValueProvider(type) {
    switch(type) {
    case 'actor':
        return new ValueProviderActor();
    case 'attachment':
        return new ValueProviderAttachment();
    case 'image':
        return new ValueProviderImage();
    case 'profile':
        return new ValueProviderProfile(false);
    case 'profile-with-status':
        return new ValueProviderProfile(true);
    default:
        return new ValueProviderDefault(type);
    }
}
