var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var labels_exports = {};
__export(labels_exports, {
  default: () => labels_default,
  nouns: () => nouns,
  tooltipLabels: () => tooltipLabels,
  verbs: () => verbs
});
module.exports = __toCommonJS(labels_exports);
const tooltipLabels = {
  ENTER_AIRPLAY: "Start airplay",
  EXIT_AIRPLAY: "Stop airplay",
  AUDIO_TRACK_MENU: "Audio",
  CAPTIONS: "Captions",
  ENABLE_CAPTIONS: "Enable captions",
  DISABLE_CAPTIONS: "Disable captions",
  START_CAST: "Start casting",
  STOP_CAST: "Stop casting",
  ENTER_FULLSCREEN: "Enter fullscreen mode",
  EXIT_FULLSCREEN: "Exit fullscreen mode",
  MUTE: "Mute",
  UNMUTE: "Unmute",
  ENTER_PIP: "Enter picture in picture mode",
  EXIT_PIP: "Enter picture in picture mode",
  PLAY: "Play",
  PAUSE: "Pause",
  PLAYBACK_RATE: "Playback rate",
  RENDITIONS: "Quality",
  SEEK_BACKWARD: "Seek backward",
  SEEK_FORWARD: "Seek forward",
  SETTINGS: "Settings"
};
const nouns = {
  AUDIO_PLAYER: () => "audio player",
  VIDEO_PLAYER: () => "video player",
  VOLUME: () => "volume",
  SEEK: () => "seek",
  CLOSED_CAPTIONS: () => "closed captions",
  PLAYBACK_RATE: ({ playbackRate = 1 } = {}) => `current playback rate ${playbackRate}`,
  PLAYBACK_TIME: () => `playback time`,
  MEDIA_LOADING: () => `media loading`,
  SETTINGS: () => `settings`,
  AUDIO_TRACKS: () => `audio tracks`,
  QUALITY: () => `quality`
};
const verbs = {
  PLAY: () => "play",
  PAUSE: () => "pause",
  MUTE: () => "mute",
  UNMUTE: () => "unmute",
  ENTER_AIRPLAY: () => "start airplay",
  EXIT_AIRPLAY: () => "stop airplay",
  ENTER_CAST: () => "start casting",
  EXIT_CAST: () => "stop casting",
  ENTER_FULLSCREEN: () => "enter fullscreen mode",
  EXIT_FULLSCREEN: () => "exit fullscreen mode",
  ENTER_PIP: () => "enter picture in picture mode",
  EXIT_PIP: () => "exit picture in picture mode",
  SEEK_FORWARD_N_SECS: ({ seekOffset = 30 } = {}) => `seek forward ${seekOffset} seconds`,
  SEEK_BACK_N_SECS: ({ seekOffset = 30 } = {}) => `seek back ${seekOffset} seconds`,
  SEEK_LIVE: () => "seek to live",
  PLAYING_LIVE: () => "playing live"
};
var labels_default = {
  ...nouns,
  ...verbs
};
