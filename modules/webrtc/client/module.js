// @ts-check
import { ServerData } from '../../../core/client/server-data.js';
import { MessageService } from '../../../core/client/service/message-service.js';
import { Events } from '../../../core/common/events.js';
import { WebRTCMessage } from '../common/message/webrtc-message.js';
import { WebRTCEntry } from './webrtc-entry.js';

//TODO: config options (MOST IMPORTANT: choosing audio and video device)
//TODO: Verify if the stun server is even usable with the current setup (of port forwarding but not setting the externalIps property in the server)
//       seems like only IPv6 works, but not IPv4 (kind of as expected, there are no internal/external IPv6 addresses)
//TODO: As far as I understood stun needs two sepparate servers for full functionality? -> using public stuntman server for now
//TODO: Maybe replace with TURN server that can catch these cases as well
const peerConnectionConfig = {
    iceServers: [
        { 'urls': 'stun:' + location.hostname + ':3478' },
        //{ 'urls': 'turn:'+location.hostname+':3478' },
        //{ 'urls': 'stun:stun.stunprotocol.org:3478' }
    ]
};

const peerConnections = {};
var localStream;
var videoContainer;

const errorHandler = e => console.error(e);

function setupPeer(profileID, initCall = false) {
    profileID = String(profileID);

    removePeerConnection(profileID);

    const entry = new WebRTCEntry(Number(profileID));
    videoContainer.appendChild(entry.getContainer());

    peerConnections[profileID] = { entry: entry, pc: new RTCPeerConnection(peerConnectionConfig) };
    peerConnections[profileID].pc.onicecandidate = event => gotIceCandidate(event, profileID);
    peerConnections[profileID].pc.ontrack = event => gotRemoteStream(event, profileID);
    peerConnections[profileID].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, profileID);
    localStream.getTracks().forEach(track => peerConnections[profileID].pc.addTrack(track, localStream));

    if (initCall) {
        peerConnections[profileID].pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then(description => createdDescription(description, profileID)).catch(errorHandler);
    }
}

function onMessage(message) {
    const sender = message.sender;
    const dest = message.dest;

    // ignore our own messages
    if (sender == ServerData.localProfile.getID()) return;
    // ignore messages not targeted to us or broadcasted
    if (dest != ServerData.localProfile.getID() && dest != 'broadcast') return;

    if (message.type == 'joined') {
        setupPeer(sender);

        MessageService.send(new WebRTCMessage('existing', sender));
    } else if (message.type == 'existing') {
        setupPeer(sender, true);
    } else if (message.sdp) {
        peerConnections[String(sender)].pc.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
            // create answers to offers
            if (message.sdp.type == 'offer') {
                peerConnections[String(sender)].pc.createAnswer().then(description => createdDescription(description, String(sender))).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (message.ice) {
        peerConnections[String(sender)].pc.addIceCandidate(new RTCIceCandidate(message.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event, profileID) {
    if (event.candidate != null) {
        MessageService.send(new WebRTCMessage('ice', Number(profileID), null, event.candidate));
    }
}

function gotRemoteStream(event, profileID) {
    peerConnections[profileID].entry.setStreams(event.streams[0]);
}

function checkPeerDisconnect(event, profileID) {
    const state = peerConnections[profileID].pc.iceConnectionState;
    if (state == 'failed' || state == 'closed' || state == 'disconnected') {
        removePeerConnection(profileID);
    }
}

function createdDescription(description, profileID) {
    peerConnections[profileID].pc.setLocalDescription(description).then(() => {
        MessageService.send(new WebRTCMessage('sdp', Number(profileID), peerConnections[profileID].pc.localDescription));
    }).catch(errorHandler);
}

function removePeerConnection(profileID) {
    if (!peerConnections[profileID]) return;

    peerConnections[profileID].pc.onicecandidate = null;
    peerConnections[profileID].pc.ontrack = null;
    peerConnections[profileID].pc.oniceconnectionstatechange = null;

    peerConnections[profileID].entry.onDestroy();
    videoContainer.removeChild(peerConnections[profileID].entry.getContainer());

    delete peerConnections[profileID];
}

function reconnect() {
    // just sending a new joined message will begin a new connection process
    MessageService.send(new WebRTCMessage('joined', 'broadcast'));
}

// create event listeners (to startup local stream/messaging)
if (location.protocol == 'https:') {
    Events.on('enterMainState', event => {
        videoContainer = document.createElement('div');
        videoContainer.className = 'webrtc-container';
        document.body.appendChild(videoContainer);


        // stream camera and audio to it
        navigator.mediaDevices.enumerateDevices().then(devices => {
            // detect presence of camera and microphone
            var hasVideo = false;
            var hasAudio = false;
            devices.forEach(device => {
                if (device.kind == 'videoinput') hasVideo = true;
                if (device.kind == 'audioinput') hasAudio = true;
            });

            // create user media with determined constraints
            const videoConstraints = hasVideo ? { width: 320, height: 180, exposureMode: 'continous', focusMode: 'continuous', whiteBalanceMode: 'continuous' } : false;
            const audioConstraints = hasAudio ? { echoCancellation: true, autoGainControl: true, noiseSuppression: true } : false;
            navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints }).then(stream => {
                localStream = stream;

                const localEntry = new WebRTCEntry(ServerData.localProfile.getID(), true, localStream, () => reconnect());
                localEntry.setStreams(stream);
                videoContainer.appendChild(localEntry.getContainer());

                MessageService.send(new WebRTCMessage('joined', 'broadcast'));
            }).catch(errorHandler);
        }).catch(errorHandler);
    });

    Events.on('recievedMessage', event => {
        if (event.data.message instanceof WebRTCMessage) {
            onMessage(event.data.message);

            event.cancel();
        }
    });
} else {
    Events.on('recievedMessage', event => {
        if (event.data.message instanceof WebRTCMessage) {
            event.cancel();
        }
    });

    console.warn('Cannot enable WebRTC module because connection is not encrypted!');
}
