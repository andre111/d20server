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
    #toggleMic;
    #toggleCam;
    #reconnect;

    constructor(profileID, muted = false, localStream = null, reconnectCallback = null) {
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

        const name = document.createElement('p');
        name.innerText = ServerData.profiles.get(profileID).getUsername();
        this.#textContainer.appendChild(name);

        if (this.#localStream) {
            // controlls for local input
            this.#toggleMic = document.createElement('img');
            this.#toggleMic.src = '/modules/webrtc/files/img/mic-on.svg';
            this.#toggleMic.title = 'Toggle Microphone';
            this.#toggleMic.onclick = () => this.toggleMic();
            this.#textContainer.appendChild(this.#toggleMic);

            this.#toggleCam = document.createElement('img');
            this.#toggleCam.src = '/modules/webrtc/files/img/cam-on.svg';
            this.#toggleCam.title = 'Toggle Camera';
            this.#toggleCam.onclick = () => this.toggleCam();
            this.#textContainer.appendChild(this.#toggleCam);

            this.#reconnect = document.createElement('img');
            this.#reconnect.src = '/modules/webrtc/files/img/reconnect.svg';
            this.#reconnect.title = 'Reconnect';
            this.#reconnect.onclick = reconnectCallback;
            this.#textContainer.appendChild(this.#reconnect);
        } else {
            // controlls for remote stream
            const volumeDiv = document.createElement('div');
            volumeDiv.className = 'webrtc-volume';
            this.#textContainer.appendChild(volumeDiv);

            const volumeInput = document.createElement('input');
            volumeInput.type = 'range';
            volumeInput.value = 100;
            volumeInput.onchange = event => {
                this.#video.volume = volumeInput.value / 100;
            };
            volumeDiv.appendChild(volumeInput);

            const volumeIcon = document.createElement('img');
            volumeIcon.src = '/modules/webrtc/files/img/volume.svg';
            volumeDiv.appendChild(volumeIcon);
        }

        this.updateIcons();
    }

    updateIcons() {
        this.#icon.src = PROFILE_VALUE_PROVIDER.getIcon(PROFILE_VALUE_PROVIDER.getValue(this.#profileID));

        if (this.#localStream) {
            const audioTrack = this.#localStream.getAudioTracks()[0];
            this.#toggleMic.src = `/modules/webrtc/files/img/mic-${audioTrack && audioTrack.enabled ? 'on' : 'off'}.svg`;

            const videoTrack = this.#localStream.getVideoTracks()[0];
            this.#toggleCam.src = `/modules/webrtc/files/img/cam-${videoTrack && videoTrack.enabled ? 'on' : 'off'}.svg`;
        }
    }

    toggleMic() {
        const track = this.#localStream.getAudioTracks()[0];
        if (track) track.enabled = !track.enabled;
        this.updateIcons();
    }

    toggleCam() {
        const track = this.#localStream.getVideoTracks()[0];
        if (track) track.enabled = !track.enabled;
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
