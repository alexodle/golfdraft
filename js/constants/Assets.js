'use strict';

// HACKHACK - CDN url is just placed on window for us
var cdnUrl = window.golfDraftSeed.CDN_URL;

module.exports = {
  MY_TURN_SOUND: cdnUrl + '/assets/airplane_chime.wav',
  PICK_MADE_SOUND: cdnUrl + '/assets/bleep1.wav',
  NEW_CHAT_MESSAGE_SOUND: cdnUrl + '/assets/tone1.wav'
};
