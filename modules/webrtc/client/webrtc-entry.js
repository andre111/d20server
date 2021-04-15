import { ValueProviderProfile } from '../../../core/client/gui/value-provider-profile.js';
import { ServerData } from '../../../core/client/server-data.js';
import { Events } from '../../../core/common/events.js';

const PROFILE_VALUE_PROVIDER = new ValueProviderProfile();

export class WebRTCEntry {
    #profileID;
    #listener;
    #localStream;

    #container;
    #video;

    #textContainer;
    #icon;
    #name;
    #toggleMic;
    #toggleCam;

    constructor(profileID, muted = false, localStream = null) {
        this.#profileID = profileID;
        this.#listener = Events.on('profileListChange', event => this.updateIcons());
        this.#localStream = localStream;

        this.#container = document.createElement('div');
        this.#container.className = 'webrtc-entry';

        this.#video = document.createElement('video');
        this.#video.autoplay = true;
        this.#video.muted = muted;
        this.#container.appendChild(this.#video);

        this.#textContainer = document.createElement('div');
        this.#container.appendChild(this.#textContainer);

        this.#icon = document.createElement('img');
        this.#textContainer.appendChild(this.#icon);
        
        this.#name = document.createElement('p');
        this.#name.innerText = ServerData.profiles.get(profileID).getUsername();
        this.#textContainer.appendChild(this.#name);

        if(this.#localStream) {
            this.#toggleMic = document.createElement('img');
            this.#toggleMic.src = '/modules/webrtc/files/img/mic-on.svg';
            this.#toggleMic.onclick = event => this.toggleMic();
            this.#textContainer.appendChild(this.#toggleMic);
            
            this.#toggleCam = document.createElement('img');
            this.#toggleCam.src = '/modules/webrtc/files/img/cam-on.svg';
            this.#toggleCam.onclick = event => this.toggleCam();
            this.#textContainer.appendChild(this.#toggleCam);
        }

        this.updateIcons();
    }

    updateIcons() {
        this.#icon.src = PROFILE_VALUE_PROVIDER.getIcon(PROFILE_VALUE_PROVIDER.getValue(this.#profileID));
        
        if(this.#localStream) {
            const audioTrack = this.#localStream.getAudioTracks()[0];
            this.#toggleMic.src = `/modules/webrtc/files/img/mic-${audioTrack && audioTrack.enabled ? 'on' : 'off'}.svg`;
            
            const videoTrack = this.#localStream.getVideoTracks()[0];
            this.#toggleCam.src = `/modules/webrtc/files/img/cam-${videoTrack && videoTrack.enabled ? 'on' : 'off'}.svg`;
        }
    }

    toggleMic() {
        const track = this.#localStream.getAudioTracks()[0];
        if(track) track.enabled = !track.enabled;
        this.updateIcons();
    }

    toggleCam() {
        const track = this.#localStream.getVideoTracks()[0];
        if(track) track.enabled = !track.enabled;
        this.updateIcons();
    }

    getContainer() {
        return this.#container;
    }

    setStreams(streams) {
        this.#video.srcObject = streams;
    }

    onDestroy() {
        Events.remove('profileListChange', this.#listener);
    }
}