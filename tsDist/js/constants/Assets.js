"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// HACKHACK - CDN url is just placed on window for us
const cdnUrl = window.golfDraftSeed.CDN_URL;
exports.default = {
    MY_TURN_SOUND: cdnUrl + '/assets/airplane_chime.wav',
    PICK_MADE_SOUND: cdnUrl + '/assets/bleep1.wav',
    NEW_CHAT_MESSAGE_SOUND: cdnUrl + '/assets/tone1.wav',
    // TODO: Pick new sounds
    PICK_WARNING_SOUND: cdnUrl + '/assets/bleep1.wav'
};
