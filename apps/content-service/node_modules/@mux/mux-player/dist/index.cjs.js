"use strict";var lh=Object.create;var Tr=Object.defineProperty;var dh=Object.getOwnPropertyDescriptor;var uh=Object.getOwnPropertyNames;var ch=Object.getPrototypeOf,mh=Object.prototype.hasOwnProperty;var hh=(i,e)=>{for(var t in e)Tr(i,t,{get:e[t],enumerable:!0})},kd=(i,e,t,a)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of uh(e))!mh.call(i,r)&&r!==t&&Tr(i,r,{get:()=>e[r],enumerable:!(a=dh(e,r))||a.enumerable});return i};var ph=(i,e,t)=>(t=i!=null?lh(ch(i)):{},kd(e||!i||!i.__esModule?Tr(t,"default",{value:i,enumerable:!0}):t,i)),vh=i=>kd(Tr({},"__esModule",{value:!0}),i);var Oo=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)};var R=(i,e,t)=>(Oo(i,e,"read from private field"),t?t.call(i):e.get(i)),X=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Se=(i,e,t,a)=>(Oo(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t);var j=(i,e,t)=>(Oo(i,e,"access private method"),t);var df={};hh(df,{MediaError:()=>E.MediaError,default:()=>lf,getVideoAttribute:()=>Ut});module.exports=vh(df);var fi=class{addEventListener(){}removeEventListener(){}dispatchEvent(e){return!0}};if(typeof DocumentFragment=="undefined"){class i extends fi{}globalThis.DocumentFragment=i}var va=class extends fi{},No=class extends fi{},fh={get(i){},define(i,e,t){},getName(i){return null},upgrade(i){},whenDefined(i){return Promise.resolve(va)}},fa,Po=class{constructor(e,t={}){X(this,fa,void 0);Se(this,fa,t==null?void 0:t.detail)}get detail(){return R(this,fa)}initCustomEvent(){}};fa=new WeakMap;function Eh(i,e){return new va}var Sd={document:{createElement:Eh},DocumentFragment,customElements:fh,CustomEvent:Po,EventTarget:fi,HTMLElement:va,HTMLVideoElement:No},Id=typeof window=="undefined"||typeof globalThis.customElements=="undefined",Q=Id?Sd:globalThis,Ae=Id?Sd.document:globalThis.document;var p={MEDIA_PLAY_REQUEST:"mediaplayrequest",MEDIA_PAUSE_REQUEST:"mediapauserequest",MEDIA_MUTE_REQUEST:"mediamuterequest",MEDIA_UNMUTE_REQUEST:"mediaunmuterequest",MEDIA_VOLUME_REQUEST:"mediavolumerequest",MEDIA_SEEK_REQUEST:"mediaseekrequest",MEDIA_AIRPLAY_REQUEST:"mediaairplayrequest",MEDIA_ENTER_FULLSCREEN_REQUEST:"mediaenterfullscreenrequest",MEDIA_EXIT_FULLSCREEN_REQUEST:"mediaexitfullscreenrequest",MEDIA_PREVIEW_REQUEST:"mediapreviewrequest",MEDIA_ENTER_PIP_REQUEST:"mediaenterpiprequest",MEDIA_EXIT_PIP_REQUEST:"mediaexitpiprequest",MEDIA_ENTER_CAST_REQUEST:"mediaentercastrequest",MEDIA_EXIT_CAST_REQUEST:"mediaexitcastrequest",MEDIA_SHOW_TEXT_TRACKS_REQUEST:"mediashowtexttracksrequest",MEDIA_HIDE_TEXT_TRACKS_REQUEST:"mediahidetexttracksrequest",MEDIA_SHOW_SUBTITLES_REQUEST:"mediashowsubtitlesrequest",MEDIA_DISABLE_SUBTITLES_REQUEST:"mediadisablesubtitlesrequest",MEDIA_TOGGLE_SUBTITLES_REQUEST:"mediatogglesubtitlesrequest",MEDIA_PLAYBACK_RATE_REQUEST:"mediaplaybackraterequest",MEDIA_RENDITION_REQUEST:"mediarenditionrequest",MEDIA_AUDIO_TRACK_REQUEST:"mediaaudiotrackrequest",MEDIA_SEEK_TO_LIVE_REQUEST:"mediaseektoliverequest",REGISTER_MEDIA_STATE_RECEIVER:"registermediastatereceiver",UNREGISTER_MEDIA_STATE_RECEIVER:"unregistermediastatereceiver"},k={MEDIA_CHROME_ATTRIBUTES:"mediachromeattributes",MEDIA_CONTROLLER:"mediacontroller"},Uo={MEDIA_AIRPLAY_UNAVAILABLE:"mediaAirplayUnavailable",MEDIA_FULLSCREEN_UNAVAILABLE:"mediaFullscreenUnavailable",MEDIA_PIP_UNAVAILABLE:"mediaPipUnavailable",MEDIA_CAST_UNAVAILABLE:"mediaCastUnavailable",MEDIA_RENDITION_UNAVAILABLE:"mediaRenditionUnavailable",MEDIA_AUDIO_TRACK_UNAVAILABLE:"mediaAudioTrackUnavailable",MEDIA_WIDTH:"mediaWidth",MEDIA_HEIGHT:"mediaHeight",MEDIA_PAUSED:"mediaPaused",MEDIA_HAS_PLAYED:"mediaHasPlayed",MEDIA_ENDED:"mediaEnded",MEDIA_MUTED:"mediaMuted",MEDIA_VOLUME_LEVEL:"mediaVolumeLevel",MEDIA_VOLUME:"mediaVolume",MEDIA_VOLUME_UNAVAILABLE:"mediaVolumeUnavailable",MEDIA_IS_PIP:"mediaIsPip",MEDIA_IS_CASTING:"mediaIsCasting",MEDIA_IS_AIRPLAYING:"mediaIsAirplaying",MEDIA_SUBTITLES_LIST:"mediaSubtitlesList",MEDIA_SUBTITLES_SHOWING:"mediaSubtitlesShowing",MEDIA_IS_FULLSCREEN:"mediaIsFullscreen",MEDIA_PLAYBACK_RATE:"mediaPlaybackRate",MEDIA_CURRENT_TIME:"mediaCurrentTime",MEDIA_DURATION:"mediaDuration",MEDIA_SEEKABLE:"mediaSeekable",MEDIA_PREVIEW_TIME:"mediaPreviewTime",MEDIA_PREVIEW_IMAGE:"mediaPreviewImage",MEDIA_PREVIEW_COORDS:"mediaPreviewCoords",MEDIA_PREVIEW_CHAPTER:"mediaPreviewChapter",MEDIA_LOADING:"mediaLoading",MEDIA_BUFFERED:"mediaBuffered",MEDIA_STREAM_TYPE:"mediaStreamType",MEDIA_TARGET_LIVE_WINDOW:"mediaTargetLiveWindow",MEDIA_TIME_IS_LIVE:"mediaTimeIsLive",MEDIA_RENDITION_LIST:"mediaRenditionList",MEDIA_RENDITION_SELECTED:"mediaRenditionSelected",MEDIA_AUDIO_TRACK_LIST:"mediaAudioTrackList",MEDIA_AUDIO_TRACK_ENABLED:"mediaAudioTrackEnabled",MEDIA_CHAPTERS_CUES:"mediaChaptersCues"},Cd=Object.entries(Uo),o=Cd.reduce((i,[e,t])=>(i[e]=t.toLowerCase(),i),{}),bh={USER_INACTIVE:"userinactivechange",BREAKPOINTS_CHANGE:"breakpointchange",BREAKPOINTS_COMPUTED:"breakpointscomputed"},ot=Cd.reduce((i,[e,t])=>(i[e]=t.toLowerCase(),i),{...bh}),pf=Object.entries(ot).reduce((i,[e,t])=>{let a=o[e];return a&&(i[t]=a),i},{userinactivechange:"userinactive"}),Md=Object.entries(o).reduce((i,[e,t])=>{let a=ot[e];return a&&(i[t]=a),i},{userinactive:"userinactivechange"}),pe={SUBTITLES:"subtitles",CAPTIONS:"captions",DESCRIPTIONS:"descriptions",CHAPTERS:"chapters",METADATA:"metadata"},_t={DISABLED:"disabled",HIDDEN:"hidden",SHOWING:"showing"};var Bo={MOUSE:"mouse",PEN:"pen",TOUCH:"touch"},Te={UNAVAILABLE:"unavailable",UNSUPPORTED:"unsupported"},Me={LIVE:"live",ON_DEMAND:"on-demand",UNKNOWN:"unknown"};var Ld={INLINE:"inline",FULLSCREEN:"fullscreen",PICTURE_IN_PICTURE:"picture-in-picture"};var I={ENTER_AIRPLAY:"Start airplay",EXIT_AIRPLAY:"Stop airplay",AUDIO_TRACK_MENU:"Audio",CAPTIONS:"Captions",ENABLE_CAPTIONS:"Enable captions",DISABLE_CAPTIONS:"Disable captions",START_CAST:"Start casting",STOP_CAST:"Stop casting",ENTER_FULLSCREEN:"Enter fullscreen mode",EXIT_FULLSCREEN:"Exit fullscreen mode",MUTE:"Mute",UNMUTE:"Unmute",ENTER_PIP:"Enter picture in picture mode",EXIT_PIP:"Enter picture in picture mode",PLAY:"Play",PAUSE:"Pause",PLAYBACK_RATE:"Playback rate",RENDITIONS:"Quality",SEEK_BACKWARD:"Seek backward",SEEK_FORWARD:"Seek forward",SETTINGS:"Settings"},V={AUDIO_PLAYER:()=>"audio player",VIDEO_PLAYER:()=>"video player",VOLUME:()=>"volume",SEEK:()=>"seek",CLOSED_CAPTIONS:()=>"closed captions",PLAYBACK_RATE:({playbackRate:i=1}={})=>`current playback rate ${i}`,PLAYBACK_TIME:()=>"playback time",MEDIA_LOADING:()=>"media loading",SETTINGS:()=>"settings",AUDIO_TRACKS:()=>"audio tracks",QUALITY:()=>"quality"},Y={PLAY:()=>"play",PAUSE:()=>"pause",MUTE:()=>"mute",UNMUTE:()=>"unmute",ENTER_AIRPLAY:()=>"start airplay",EXIT_AIRPLAY:()=>"stop airplay",ENTER_CAST:()=>"start casting",EXIT_CAST:()=>"stop casting",ENTER_FULLSCREEN:()=>"enter fullscreen mode",EXIT_FULLSCREEN:()=>"exit fullscreen mode",ENTER_PIP:()=>"enter picture in picture mode",EXIT_PIP:()=>"exit picture in picture mode",SEEK_FORWARD_N_SECS:({seekOffset:i=30}={})=>`seek forward ${i} seconds`,SEEK_BACK_N_SECS:({seekOffset:i=30}={})=>`seek back ${i} seconds`,SEEK_LIVE:()=>"seek to live",PLAYING_LIVE:()=>"playing live"},_h={...V,...Y};function Rd(i){return i==null?void 0:i.map(Ah).join(" ")}function wd(i){return i==null?void 0:i.split(/\s+/).map(Th)}function Ah(i){if(i){let{id:e,width:t,height:a}=i;return[e,t,a].filter(r=>r!=null).join(":")}}function Th(i){if(i){let[e,t,a]=i.split(":");return{id:e,width:+t,height:+a}}}function xd(i){return i==null?void 0:i.map(yh).join(" ")}function Dd(i){return i==null?void 0:i.split(/\s+/).map(kh)}function yh(i){if(i){let{id:e,kind:t,language:a,label:r}=i;return[e,t,a,r].filter(n=>n!=null).join(":")}}function kh(i){if(i){let[e,t,a,r]=i.split(":");return{id:e,kind:t,language:a,label:r}}}function Od(i){return i.replace(/[-_]([a-z])/g,(e,t)=>t.toUpperCase())}function Ei(i){return typeof i=="number"&&!Number.isNaN(i)&&Number.isFinite(i)}function yr(i){return typeof i!="string"?!1:!isNaN(i)&&!isNaN(parseFloat(i))}var kr=i=>new Promise(e=>setTimeout(e,i));var Nd=[{singular:"hour",plural:"hours"},{singular:"minute",plural:"minutes"},{singular:"second",plural:"seconds"}],Sh=(i,e)=>{let t=i===1?Nd[e].singular:Nd[e].plural;return`${i} ${t}`},Ht=i=>{if(!Ei(i))return"";let e=Math.abs(i),t=e!==i,a=new Date(0,0,0,0,0,e,0);return`${[a.getHours(),a.getMinutes(),a.getSeconds()].map((l,u)=>l&&Sh(l,u)).filter(l=>l).join(", ")}${t?" remaining":""}`};function Pe(i,e){let t=!1;i<0&&(t=!0,i=0-i),i=i<0?0:i;let a=Math.floor(i%60),r=Math.floor(i/60%60),n=Math.floor(i/3600),s=Math.floor(e/60%60),l=Math.floor(e/3600);return(isNaN(i)||i===1/0)&&(n=r=a="0"),n=n>0||l>0?n+":":"",r=((n||s>=10)&&r<10?"0"+r:r)+":",a=a<10?"0"+a:a,(t?"-":"")+n+r+a}var bf=Object.freeze({length:0,start(i){let e=i>>>0;if(e>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${e}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(i){let e=i>>>0;if(e>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${e}) is greater than or equal to the maximum bound (${this.length}).`);return 0}});var Sr=class{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}},Ir=class extends Sr{},Cr=class extends Ir{constructor(){super(...arguments),this.role=null}},Ho=class{observe(){}unobserve(){}disconnect(){}},Pd={createElement:function(){return new Ea.HTMLElement},createElementNS:function(){return new Ea.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent(i){return!1}},Ea={ResizeObserver:Ho,document:Pd,Node:Ir,Element:Cr,HTMLElement:class extends Cr{constructor(){super(...arguments),this.innerHTML=""}get content(){return new Ea.DocumentFragment}},DocumentFragment:class extends Sr{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem(i){return null},setItem(i,e){},removeItem(i){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return""}},matchMedia(i){return{matches:!1,media:i}}},Ud=typeof window=="undefined"||typeof window.customElements=="undefined",Bd=Object.keys(Ea).every(i=>i in globalThis),d=Ud&&!Bd?Ea:globalThis,m=Ud&&!Bd?Pd:globalThis.document;var Hd=new WeakMap,Wo=i=>{let e=Hd.get(i);return e||Hd.set(i,e=new Set),e},Wd=new d.ResizeObserver(i=>{for(let e of i)for(let t of Wo(e.target))t(e)});function st(i,e){Wo(i).add(e),Wd.observe(i)}function Wt(i,e){let t=Wo(i);t.delete(e),t.size||Wd.unobserve(i)}function Z(i){var e;return(e=Mr(i))!=null?e:Ue(i,"media-controller")}function Mr(i){var e;let{MEDIA_CONTROLLER:t}=k,a=i.getAttribute(t);if(a)return(e=$t(i))==null?void 0:e.getElementById(a)}var Lr=(i,e,t=".value")=>{let a=i.querySelector(t);a&&(a.textContent=e)},Ch=(i,e)=>{let t=`slot[name="${e}"]`,a=i.shadowRoot.querySelector(t);return a?a.children:[]},Rr=(i,e)=>Ch(i,e)[0],ce=(i,e)=>!i||!e?!1:i!=null&&i.contains(e)?!0:ce(i,e.getRootNode().host),Ue=(i,e)=>{if(!i)return null;let t=i.closest(e);return t||Ue(i.getRootNode().host,e)};function ba(i=document){var e;let t=i==null?void 0:i.activeElement;return t?(e=ba(t.shadowRoot))!=null?e:t:null}function $t(i){var e;let t=(e=i==null?void 0:i.getRootNode)==null?void 0:e.call(i);return t instanceof ShadowRoot||t instanceof Document?t:null}function $d(i,e=3){if(i.checkVisibility)return i.checkVisibility({checkOpacity:!0,checkVisibilityCSS:!0});let t=i;for(;t&&e>0;){let a=getComputedStyle(t);if(a.opacity==="0"||a.visibility==="hidden"||a.display==="none")return!1;t=t.parentElement,e--}return!0}function Fd(i,e,t,a){let r=$o(t,a),n=$o(t,{x:i,y:e}),s=$o(a,{x:i,y:e});return n>r||s>r?n>s?1:0:n/r}function $o(i,e){return Math.sqrt(Math.pow(e.x-i.x,2)+Math.pow(e.y-i.y,2))}function W(i,e){let t=Mh(i,a=>a===e);return t||Fo(i,e)}function Mh(i,e){var t,a;let r;for(r of(t=i.querySelectorAll("style:not([media])"))!=null?t:[]){let n;try{n=(a=r.sheet)==null?void 0:a.cssRules}catch{continue}for(let s of n!=null?n:[])if(e(s.selectorText))return s}}function Fo(i,e){var t,a;let r=(t=i.querySelectorAll("style:not([media])"))!=null?t:[],n=r==null?void 0:r[r.length-1];return n!=null&&n.sheet?(n==null||n.sheet.insertRule(`${e}{}`,n.sheet.cssRules.length),(a=n.sheet.cssRules)==null?void 0:a[n.sheet.cssRules.length-1]):(console.warn("Media Chrome: No style sheet found on style tag of",i),{style:{setProperty:()=>{},removeProperty:()=>"",getPropertyValue:()=>""}})}function w(i,e,t=Number.NaN){let a=i.getAttribute(e);return a!=null?+a:t}function P(i,e,t){let a=+t;if(t==null||Number.isNaN(a)){i.hasAttribute(e)&&i.removeAttribute(e);return}w(i,e,void 0)!==a&&i.setAttribute(e,`${a}`)}function H(i,e){return i.hasAttribute(e)}function B(i,e,t){if(t==null){i.hasAttribute(e)&&i.removeAttribute(e);return}H(i,e)!=t&&i.toggleAttribute(e,t)}function x(i,e,t=null){var a;return(a=i.getAttribute(e))!=null?a:t}function M(i,e,t){if(t==null){i.hasAttribute(e)&&i.removeAttribute(e);return}let a=`${t}`;x(i,e,void 0)!==a&&i.setAttribute(e,a)}var Kd=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},At=(i,e,t)=>(Kd(i,e,"read from private field"),t?t.call(i):e.get(i)),Lh=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},wr=(i,e,t,a)=>(Kd(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),ve,Vd=m.createElement("template");Vd.innerHTML=`
<style>
  :host {
    display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
    box-sizing: border-box;
  }
</style>
`;var Ko=class extends d.HTMLElement{constructor(e={}){if(super(),Lh(this,ve,void 0),!this.shadowRoot){let t=this.attachShadow({mode:"open"}),a=Vd.content.cloneNode(!0);this.nativeEl=a;let r=e.slotTemplate;r||(r=m.createElement("template"),r.innerHTML=`<slot>${e.defaultContent||""}</slot>`),this.nativeEl.appendChild(r.content.cloneNode(!0)),t.appendChild(a)}}static get observedAttributes(){return[k.MEDIA_CONTROLLER,o.MEDIA_PAUSED]}attributeChangedCallback(e,t,a){var r,n,s,l,u;e===k.MEDIA_CONTROLLER&&(t&&((n=(r=At(this,ve))==null?void 0:r.unassociateElement)==null||n.call(r,this),wr(this,ve,null)),a&&this.isConnected&&(wr(this,ve,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=At(this,ve))==null?void 0:l.associateElement)==null||u.call(l,this)))}connectedCallback(){var e,t,a,r;this.tabIndex=-1,this.setAttribute("aria-hidden","true"),wr(this,ve,Rh(this)),this.getAttribute(k.MEDIA_CONTROLLER)&&((t=(e=At(this,ve))==null?void 0:e.associateElement)==null||t.call(e,this)),(a=At(this,ve))==null||a.addEventListener("pointerdown",this),(r=At(this,ve))==null||r.addEventListener("click",this)}disconnectedCallback(){var e,t,a,r;this.getAttribute(k.MEDIA_CONTROLLER)&&((t=(e=At(this,ve))==null?void 0:e.unassociateElement)==null||t.call(e,this)),(a=At(this,ve))==null||a.removeEventListener("pointerdown",this),(r=At(this,ve))==null||r.removeEventListener("click",this),wr(this,ve,null)}handleEvent(e){var t;let a=(t=e.composedPath())==null?void 0:t[0];if(["video","media-controller"].includes(a==null?void 0:a.localName)){if(e.type==="pointerdown")this._pointerType=e.pointerType;else if(e.type==="click"){let{clientX:n,clientY:s}=e,{left:l,top:u,width:c,height:b}=this.getBoundingClientRect(),g=n-l,v=s-u;if(g<0||v<0||g>c||v>b||c===0&&b===0)return;let{pointerType:f=this._pointerType}=e;if(this._pointerType=void 0,f===Bo.TOUCH){this.handleTap(e);return}else if(f===Bo.MOUSE){this.handleMouseClick(e);return}}}}get mediaPaused(){return H(this,o.MEDIA_PAUSED)}set mediaPaused(e){B(this,o.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){let t=this.mediaPaused?p.MEDIA_PLAY_REQUEST:p.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new d.CustomEvent(t,{composed:!0,bubbles:!0}))}};ve=new WeakMap;function Rh(i){var e;let t=i.getAttribute(k.MEDIA_CONTROLLER);return t?(e=i.getRootNode())==null?void 0:e.getElementById(t):Ue(i,"media-controller")}d.customElements.get("media-gesture-receiver")||d.customElements.define("media-gesture-receiver",Ko);var Go=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Tt=(i,e,t)=>(Go(i,e,"read from private field"),t?t.call(i):e.get(i)),lt=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},ga=(i,e,t,a)=>(Go(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Le=(i,e,t)=>(Go(i,e,"access private method"),t),xr,bi,_a,gi,Vo,Yd,Yo,Gd,Aa,Dr,Or,qo,_i,Ta,D={AUDIO:"audio",AUTOHIDE:"autohide",BREAKPOINTS:"breakpoints",GESTURES_DISABLED:"gesturesdisabled",KEYBOARD_CONTROL:"keyboardcontrol",NO_AUTOHIDE:"noautohide",USER_INACTIVE:"userinactive"},qd=m.createElement("template");qd.innerHTML=`
  <style>
    
    :host([${o.MEDIA_IS_FULLSCREEN}]) ::slotted([slot=media]) {
      outline: none;
    }

    :host {
      box-sizing: border-box;
      position: relative;
      display: inline-block;
      line-height: 0;
      background-color: var(--media-background-color, #000);
    }

    :host(:not([${D.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      display: flex;
      flex-flow: column nowrap;
      align-items: start;
      pointer-events: none;
      background: none;
    }

    slot[name=media] {
      display: var(--media-slot-display, contents);
    }

    
    :host([${D.AUDIO}]) slot[name=media] {
      display: var(--media-slot-display, none);
    }

    
    :host([${D.AUDIO}]) [part~=layer][part~=gesture-layer] {
      height: 0;
      display: block;
    }

    
    :host(:not([${D.AUDIO}])[${D.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
    :host(:not([${D.AUDIO}])[${D.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
      display: none;
    }

    
    ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([hidden])) {
      pointer-events: auto;
    }

    :host(:not([${D.AUDIO}])) *[part~=layer][part~=centered-layer] {
      align-items: center;
      justify-content: center;
    }

    :host(:not([${D.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
    :host(:not([${D.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
      align-self: stretch;
      flex-grow: 1;
    }

    slot[name=middle-chrome] {
      display: inline;
      flex-grow: 1;
      pointer-events: none;
      background: none;
    }

    
    ::slotted([slot=media]),
    ::slotted([slot=poster]) {
      width: 100%;
      height: 100%;
    }

    
    :host(:not([${D.AUDIO}])) .spacer {
      flex-grow: 1;
    }

    
    :host(:-webkit-full-screen) {
      
      width: 100% !important;
      height: 100% !important;
    }

    
    ::slotted(:not([slot=media]):not([slot=poster]):not([${D.NO_AUTOHIDE}]):not([hidden])) {
      opacity: 1;
      transition: opacity 0.25s;
    }

    
    :host([${D.USER_INACTIVE}]:not([${o.MEDIA_PAUSED}]):not([${o.MEDIA_IS_AIRPLAYING}]):not([${o.MEDIA_IS_CASTING}]):not([${D.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${D.NO_AUTOHIDE}])) {
      opacity: 0;
      transition: opacity 1s;
    }

    :host([${D.USER_INACTIVE}]:not([${o.MEDIA_PAUSED}]):not([${o.MEDIA_IS_CASTING}]):not([${D.AUDIO}])) ::slotted([slot=media]) {
      cursor: none;
    }

    ::slotted(media-control-bar)  {
      align-self: stretch;
    }

    
    :host(:not([${D.AUDIO}])[${o.MEDIA_HAS_PLAYED}]) slot[name=poster] {
      display: none;
    }

    ::slotted([role="menu"]) {
      align-self: end;
    }

    ::slotted([role="dialog"]) {
      align-self: center;
    }
  </style>

  <slot name="media" part="layer media-layer"></slot>
  <slot name="poster" part="layer poster-layer"></slot>
  <slot name="gestures-chrome" part="layer gesture-layer">
    <media-gesture-receiver slot="gestures-chrome"></media-gesture-receiver>
  </slot>
  <span part="layer vertical-layer">
    <slot name="top-chrome" part="top chrome"></slot>
    <slot name="middle-chrome" part="middle chrome"></slot>
    <slot name="centered-chrome" part="layer centered-layer center centered chrome"></slot>
    
    <slot part="bottom chrome"></slot>
  </span>
`;var wh=Object.values(o),xh="sm:384 md:576 lg:768 xl:960";function Dh(i){Oh(i.target,i.contentRect.width)}function Oh(i,e){var t;if(!i.isConnected)return;let a=(t=i.getAttribute(D.BREAKPOINTS))!=null?t:xh,r=Nh(a),n=Ph(r,e),s=!1;if(Object.keys(r).forEach(l=>{if(n.includes(l)){i.hasAttribute(`breakpoint${l}`)||(i.setAttribute(`breakpoint${l}`,""),s=!0);return}i.hasAttribute(`breakpoint${l}`)&&(i.removeAttribute(`breakpoint${l}`),s=!0)}),s){let l=new CustomEvent(ot.BREAKPOINTS_CHANGE,{detail:n});i.dispatchEvent(l)}}function Nh(i){let e=i.split(/\s+/);return Object.fromEntries(e.map(t=>t.split(":")))}function Ph(i,e){return Object.keys(i).filter(t=>e>=parseInt(i[t]))}var ya=class extends d.HTMLElement{constructor(){super(),lt(this,Vo),lt(this,Yo),lt(this,Aa),lt(this,Or),lt(this,_i),lt(this,xr,0),lt(this,bi,null),lt(this,_a,null),lt(this,gi,void 0),this.breakpointsComputed=!1,this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(qd.content.cloneNode(!0)));let e=s=>{let l=this.media;for(let u of s)u.type==="childList"&&(u.removedNodes.forEach(c=>{if(c.slot=="media"&&u.target==this){let b=u.previousSibling&&u.previousSibling.previousElementSibling;if(!b||!l)this.mediaUnsetCallback(c);else{let g=b.slot!=="media";for(;(b=b.previousSibling)!==null;)b.slot=="media"&&(g=!1);g&&this.mediaUnsetCallback(c)}}}),l&&u.addedNodes.forEach(c=>{c===l&&this.handleMediaUpdated(l)}))};new MutationObserver(e).observe(this,{childList:!0,subtree:!0});let a=!1;st(this,s=>{a||(setTimeout(()=>{Dh(s),a=!1,this.breakpointsComputed||(this.breakpointsComputed=!0,this.dispatchEvent(new CustomEvent(ot.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))},0),a=!0)});let n=this.querySelector(":scope > slot[slot=media]");n&&n.addEventListener("slotchange",()=>{if(!n.assignedElements({flatten:!0}).length){Tt(this,bi)&&this.mediaUnsetCallback(Tt(this,bi));return}this.handleMediaUpdated(this.media)})}static get observedAttributes(){return[D.AUTOHIDE,D.GESTURES_DISABLED].concat(wh).filter(e=>![o.MEDIA_RENDITION_LIST,o.MEDIA_AUDIO_TRACK_LIST,o.MEDIA_CHAPTERS_CUES,o.MEDIA_WIDTH,o.MEDIA_HEIGHT].includes(e))}attributeChangedCallback(e,t,a){e.toLowerCase()==D.AUTOHIDE&&(this.autohide=a)}get media(){let e=this.querySelector(":scope > [slot=media]");return(e==null?void 0:e.nodeName)=="SLOT"&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(ga(this,bi,e),e.localName.includes("-")&&await d.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var e;let a=this.getAttribute(D.AUDIO)!=null?V.AUDIO_PLAYER():V.VIDEO_PLAYER();this.setAttribute("role","region"),this.setAttribute("aria-label",a),this.handleMediaUpdated(this.media),this.setAttribute(D.USER_INACTIVE,""),this.addEventListener("pointerdown",this),this.addEventListener("pointermove",this),this.addEventListener("pointerup",this),this.addEventListener("mouseleave",this),this.addEventListener("keyup",this),(e=d.window)==null||e.addEventListener("mouseup",this)}disconnectedCallback(){var e;this.media&&this.mediaUnsetCallback(this.media),(e=d.window)==null||e.removeEventListener("mouseup",this)}mediaSetCallback(e){}mediaUnsetCallback(e){ga(this,bi,null)}handleEvent(e){switch(e.type){case"pointerdown":ga(this,xr,e.timeStamp);break;case"pointermove":Le(this,Vo,Yd).call(this,e);break;case"pointerup":Le(this,Yo,Gd).call(this,e);break;case"mouseleave":Le(this,Aa,Dr).call(this);break;case"mouseup":this.removeAttribute(D.KEYBOARD_CONTROL);break;case"keyup":Le(this,_i,Ta).call(this),this.setAttribute(D.KEYBOARD_CONTROL,"");break}}set autohide(e){let t=Number(e);ga(this,gi,isNaN(t)?0:t)}get autohide(){return(Tt(this,gi)===void 0?2:Tt(this,gi)).toString()}};xr=new WeakMap;bi=new WeakMap;_a=new WeakMap;gi=new WeakMap;Vo=new WeakSet;Yd=function(i){i.pointerType!=="mouse"&&i.timeStamp-Tt(this,xr)<250||(Le(this,Or,qo).call(this),clearTimeout(Tt(this,_a)),[this,this.media].includes(i.target)&&Le(this,_i,Ta).call(this))};Yo=new WeakSet;Gd=function(i){if(i.pointerType==="touch"){let e=!this.hasAttribute(D.USER_INACTIVE);[this,this.media].includes(i.target)&&e?Le(this,Aa,Dr).call(this):Le(this,_i,Ta).call(this)}else i.composedPath().some(e=>["media-play-button","media-fullscreen-button"].includes(e==null?void 0:e.localName))&&Le(this,_i,Ta).call(this)};Aa=new WeakSet;Dr=function(){if(Tt(this,gi)<0||this.hasAttribute(D.USER_INACTIVE))return;this.setAttribute(D.USER_INACTIVE,"");let i=new d.CustomEvent(ot.USER_INACTIVE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(i)};Or=new WeakSet;qo=function(){if(!this.hasAttribute(D.USER_INACTIVE))return;this.removeAttribute(D.USER_INACTIVE);let i=new d.CustomEvent(ot.USER_INACTIVE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(i)};_i=new WeakSet;Ta=function(){Le(this,Or,qo).call(this),clearTimeout(Tt(this,_a));let i=parseInt(this.autohide);i<0||ga(this,_a,setTimeout(()=>{Le(this,Aa,Dr).call(this)},i*1e3))};d.customElements.get("media-container")||d.customElements.define("media-container",ya);var Zd=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},re=(i,e,t)=>(Zd(i,e,"read from private field"),t?t.call(i):e.get(i)),ka=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Nr=(i,e,t,a)=>(Zd(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Ai,Ti,Pr,Ft,dt,yt,Be=class{constructor(e,t,{defaultValue:a}={defaultValue:void 0}){ka(this,dt),ka(this,Ai,void 0),ka(this,Ti,void 0),ka(this,Pr,void 0),ka(this,Ft,new Set),Nr(this,Ai,e),Nr(this,Ti,t),Nr(this,Pr,new Set(a))}[Symbol.iterator](){return re(this,dt,yt).values()}get length(){return re(this,dt,yt).size}get value(){var e;return(e=[...re(this,dt,yt)].join(" "))!=null?e:""}set value(e){var t;e!==this.value&&(Nr(this,Ft,new Set),this.add(...(t=e==null?void 0:e.split(" "))!=null?t:[]))}toString(){return this.value}item(e){return[...re(this,dt,yt)][e]}values(){return re(this,dt,yt).values()}forEach(e,t){re(this,dt,yt).forEach(e,t)}add(...e){var t,a;e.forEach(r=>re(this,Ft).add(r)),!(this.value===""&&!((t=re(this,Ai))!=null&&t.hasAttribute(`${re(this,Ti)}`)))&&((a=re(this,Ai))==null||a.setAttribute(`${re(this,Ti)}`,`${this.value}`))}remove(...e){var t;e.forEach(a=>re(this,Ft).delete(a)),(t=re(this,Ai))==null||t.setAttribute(`${re(this,Ti)}`,`${this.value}`)}contains(e){return re(this,dt,yt).has(e)}toggle(e,t){return typeof t!="undefined"?t?(this.add(e),!0):(this.remove(e),!1):this.contains(e)?(this.remove(e),!1):(this.add(e),!0)}replace(e,t){return this.remove(e),this.add(t),e===t}};Ai=new WeakMap;Ti=new WeakMap;Pr=new WeakMap;Ft=new WeakMap;dt=new WeakSet;yt=function(){return re(this,Ft).size?re(this,Ft):re(this,Pr)};var Uh=(i="")=>i.split(/\s+/),Qd=(i="")=>{let[e,t,a]=i.split(":"),r=a?decodeURIComponent(a):void 0;return{kind:e==="cc"?pe.CAPTIONS:pe.SUBTITLES,language:t,label:r}},Kt=(i="",e={})=>Uh(i).map(t=>{let a=Qd(t);return{...e,...a}}),Zo=i=>i?Array.isArray(i)?i.map(e=>typeof e=="string"?Qd(e):e):typeof i=="string"?Kt(i):[i]:[],Ur=({kind:i,label:e,language:t}={kind:"subtitles"})=>e?`${i==="captions"?"cc":"sb"}:${t}:${encodeURIComponent(e)}`:t,ut=(i=[])=>Array.prototype.map.call(i,Ur).join(" "),Bh=(i,e)=>t=>t[i]===e,zd=i=>{let e=Object.entries(i).map(([t,a])=>Bh(t,a));return t=>e.every(a=>a(t))},Vt=(i,e=[],t=[])=>{let a=Zo(t).map(zd),r=n=>a.some(s=>s(n));Array.from(e).filter(r).forEach(n=>{n.mode=i})},Yt=(i,e=()=>!0)=>{if(!(i!=null&&i.textTracks))return[];let t=typeof e=="function"?e:zd(e);return Array.from(i.textTracks).filter(t)},Br=i=>{var e;return!!((e=i.mediaSubtitlesShowing)!=null&&e.length)||i.hasAttribute(o.MEDIA_SUBTITLES_SHOWING)};var Jd=i=>{var e;let{media:t,fullscreenElement:a}=i,r=a&&"requestFullscreen"in a?"requestFullscreen":a&&"webkitRequestFullScreen"in a?"webkitRequestFullScreen":void 0;if(r){let n=(e=a[r])==null?void 0:e.call(a);if(n instanceof Promise)return n.catch(()=>{})}else t!=null&&t.webkitEnterFullscreen?t.webkitEnterFullscreen():t!=null&&t.requestFullscreen&&t.requestFullscreen()},Xd="exitFullscreen"in m?"exitFullscreen":"webkitExitFullscreen"in m?"webkitExitFullscreen":"webkitCancelFullScreen"in m?"webkitCancelFullScreen":void 0,jd=i=>{var e;let{documentElement:t}=i;if(Xd){let a=(e=t==null?void 0:t[Xd])==null?void 0:e.call(t);if(a instanceof Promise)return a.catch(()=>{})}},Sa="fullscreenElement"in m?"fullscreenElement":"webkitFullscreenElement"in m?"webkitFullscreenElement":void 0,Hh=i=>{let{documentElement:e,media:t}=i,a=e==null?void 0:e[Sa];return!a&&"webkitDisplayingFullscreen"in t&&"webkitPresentationMode"in t&&t.webkitDisplayingFullscreen&&t.webkitPresentationMode===Ld.FULLSCREEN?t:a},eu=i=>{var e;let{media:t,documentElement:a,fullscreenElement:r=t}=i;if(!t||!a)return!1;let n=Hh(i);if(!n)return!1;if(n===r||n===t)return!0;if(n.localName.includes("-")){let s=n.shadowRoot;if(!(Sa in s))return ce(n,r);for(;s!=null&&s[Sa];){if(s[Sa]===r)return!0;s=(e=s[Sa])==null?void 0:e.shadowRoot}}return!1},Wh="fullscreenEnabled"in m?"fullscreenEnabled":"webkitFullscreenEnabled"in m?"webkitFullscreenEnabled":void 0,tu=i=>{let{documentElement:e,media:t}=i;return!!(e!=null&&e[Wh])||t&&"webkitSupportsFullscreen"in t};var Hr,Qo=()=>{var i,e;return Hr||(Hr=(e=(i=m)==null?void 0:i.createElement)==null?void 0:e.call(i,"video"),Hr)},iu=async(i=Qo())=>{if(!i)return!1;let e=i.volume;return i.volume=e/2+.1,await kr(0),i.volume!==e},$h=/.*Version\/.*Safari\/.*/.test(d.navigator.userAgent),zo=(i=Qo())=>d.matchMedia("(display-mode: standalone)").matches&&$h?!1:typeof(i==null?void 0:i.requestPictureInPicture)=="function",Xo=(i=Qo())=>tu({documentElement:m,media:i}),au=Xo(),ru=zo(),nu=!!d.WebKitPlaybackTargetAvailabilityEvent,ou=!!d.chrome;var yi=i=>Yt(i.media,e=>[pe.SUBTITLES,pe.CAPTIONS].includes(e.kind)).sort((e,t)=>e.kind>=t.kind?1:-1),Jo=i=>Yt(i.media,e=>e.mode===_t.SHOWING&&[pe.SUBTITLES,pe.CAPTIONS].includes(e.kind)),Wr=(i,e)=>{let t=yi(i),a=Jo(i),r=!!a.length;if(t.length){if(e===!1||r&&e!==!0)Vt(_t.DISABLED,t,a);else if(e===!0||!r&&e!==!1){let n=t[0],{options:s}=i;if(!(s!=null&&s.noSubtitlesLangPref)){let b=globalThis.localStorage.getItem("media-chrome-pref-subtitles-lang"),g=b?[b,...globalThis.navigator.languages]:globalThis.navigator.languages,v=t.filter(f=>g.some(L=>f.language.toLowerCase().startsWith(L.split("-")[0]))).sort((f,L)=>{let A=g.findIndex(N=>f.language.toLowerCase().startsWith(N.split("-")[0])),T=g.findIndex(N=>L.language.toLowerCase().startsWith(N.split("-")[0]));return A-T});v[0]&&(n=v[0])}let{language:l,label:u,kind:c}=n;Vt(_t.DISABLED,t,a),Vt(_t.SHOWING,t,[{language:l,label:u,kind:c}])}}},$r=(i,e)=>i===e?!0:typeof i!=typeof e?!1:typeof i=="number"&&Number.isNaN(i)&&Number.isNaN(e)?!0:typeof i!="object"?!1:Array.isArray(i)?Fh(i,e):Object.entries(i).every(([t,a])=>t in e&&$r(a,e[t])),Fh=(i,e)=>{let t=Array.isArray(i),a=Array.isArray(e);return t!==a?!1:t||a?i.length!==e.length?!1:i.every((r,n)=>$r(r,e[n])):!0};var Kh=Object.values(Me),Fr,Vh=iu().then(i=>(Fr=i,Fr)),su=async(...i)=>{await Promise.all(i.filter(e=>e).map(async e=>{if(!("localName"in e&&e instanceof d.HTMLElement))return;let t=e.localName;if(!t.includes("-"))return;let a=d.customElements.get(t);a&&e instanceof a||(await d.customElements.whenDefined(t),d.customElements.upgrade(e))}))},Ia={mediaWidth:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.videoWidth)!=null?e:0},mediaEvents:["resize"]},mediaHeight:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.videoHeight)!=null?e:0},mediaEvents:["resize"]},mediaPaused:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.paused)!=null?e:!0},set(i,e){var t;let{media:a}=e;a&&(i?a.pause():(t=a.play())==null||t.catch(()=>{}))},mediaEvents:["play","playing","pause","emptied"]},mediaHasPlayed:{get(i,e){let{media:t}=i;return t?e?e.type==="playing":!t.paused:!1},mediaEvents:["playing","emptied"]},mediaEnded:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.ended)!=null?e:!1},mediaEvents:["seeked","ended","emptied"]},mediaPlaybackRate:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.playbackRate)!=null?e:1},set(i,e){let{media:t}=e;t&&Number.isFinite(+i)&&(t.playbackRate=+i)},mediaEvents:["ratechange","loadstart"]},mediaMuted:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.muted)!=null?e:!1},set(i,e){let{media:t}=e;t&&(t.muted=i)},mediaEvents:["volumechange"]},mediaVolume:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.volume)!=null?e:1},set(i,e){let{media:t}=e;if(t){try{i==null?d.localStorage.removeItem("media-chrome-pref-volume"):d.localStorage.setItem("media-chrome-pref-volume",i.toString())}catch{}Number.isFinite(+i)&&(t.volume=+i)}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(i,e)=>{let{options:{noVolumePref:t}}=e;if(!t)try{let a=d.localStorage.getItem("media-chrome-pref-volume");if(a==null)return;Ia.mediaVolume.set(+a,e),i(+a)}catch(a){console.debug("Error getting volume pref",a)}}]},mediaVolumeLevel:{get(i){let{media:e}=i;return typeof(e==null?void 0:e.volume)=="undefined"?"high":e.muted||e.volume===0?"off":e.volume<.5?"low":e.volume<.75?"medium":"high"},mediaEvents:["volumechange"]},mediaCurrentTime:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.currentTime)!=null?e:0},set(i,e){let{media:t}=e;!t||!Ei(i)||(t.currentTime=i)},mediaEvents:["timeupdate","loadedmetadata"]},mediaDuration:{get(i){let{media:e,options:{defaultDuration:t}={}}=i;return t&&(!e||!e.duration||Number.isNaN(e.duration)||!Number.isFinite(e.duration))?t:Number.isFinite(e==null?void 0:e.duration)?e.duration:Number.NaN},mediaEvents:["durationchange","loadedmetadata","emptied"]},mediaLoading:{get(i){let{media:e}=i;return(e==null?void 0:e.readyState)<3},mediaEvents:["waiting","playing","emptied"]},mediaSeekable:{get(i){var e;let{media:t}=i;if(!((e=t==null?void 0:t.seekable)!=null&&e.length))return;let a=t.seekable.start(0),r=t.seekable.end(t.seekable.length-1);if(!(!a&&!r))return[Number(a.toFixed(3)),Number(r.toFixed(3))]},mediaEvents:["loadedmetadata","emptied","progress","seekablechange"]},mediaBuffered:{get(i){var e;let{media:t}=i,a=(e=t==null?void 0:t.buffered)!=null?e:[];return Array.from(a).map((r,n)=>[Number(a.start(n).toFixed(3)),Number(a.end(n).toFixed(3))])},mediaEvents:["progress","emptied"]},mediaStreamType:{get(i){let{media:e,options:{defaultStreamType:t}={}}=i,a=[Me.LIVE,Me.ON_DEMAND].includes(t)?t:void 0;if(!e)return a;let{streamType:r}=e;if(Kh.includes(r))return r===Me.UNKNOWN?a:r;let n=e.duration;return n===1/0?Me.LIVE:Number.isFinite(n)?Me.ON_DEMAND:a},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange"]},mediaTargetLiveWindow:{get(i){let{media:e}=i;if(!e)return Number.NaN;let{targetLiveWindow:t}=e,a=Ia.mediaStreamType.get(i);return(t==null||Number.isNaN(t))&&a===Me.LIVE?0:t},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange","targetlivewindowchange"]},mediaTimeIsLive:{get(i){let{media:e,options:{liveEdgeOffset:t=10}={}}=i;if(!e)return!1;if(typeof e.liveEdgeStart=="number")return Number.isNaN(e.liveEdgeStart)?!1:e.currentTime>=e.liveEdgeStart;if(!(Ia.mediaStreamType.get(i)===Me.LIVE))return!1;let r=e.seekable;if(!r)return!0;if(!r.length)return!1;let n=r.end(r.length-1)-t;return e.currentTime>=n},mediaEvents:["playing","timeupdate","progress","waiting","emptied"]},mediaSubtitlesList:{get(i){return yi(i).map(({kind:e,label:t,language:a})=>({kind:e,label:t,language:a}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack"]},mediaSubtitlesShowing:{get(i){return Jo(i).map(({kind:e,label:t,language:a})=>({kind:e,label:t,language:a}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(i,e)=>{var t,a;let{media:r,options:n}=e;if(!r)return;let s=l=>{var u;!n.defaultSubtitles||l&&![pe.CAPTIONS,pe.SUBTITLES].includes((u=l==null?void 0:l.track)==null?void 0:u.kind)||Wr(e,!0)};return(t=r.textTracks)==null||t.addEventListener("addtrack",s),(a=r.textTracks)==null||a.addEventListener("removetrack",s),s(),()=>{var l,u;(l=r.textTracks)==null||l.removeEventListener("addtrack",s),(u=r.textTracks)==null||u.removeEventListener("removetrack",s)}}]},mediaChaptersCues:{get(i){var e;let{media:t}=i;if(!t)return[];let[a]=Yt(t,{kind:pe.CHAPTERS});return Array.from((e=a==null?void 0:a.cues)!=null?e:[]).map(({text:r,startTime:n,endTime:s})=>({text:r,startTime:n,endTime:s}))},mediaEvents:["loadstart","loadedmetadata"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(i,e)=>{var t;let{media:a}=e;if(!a)return;let r=a.querySelector('track[kind="chapters"][default][src]'),n=(t=a.shadowRoot)==null?void 0:t.querySelector(':is(video,audio) > track[kind="chapters"][default][src]');return r==null||r.addEventListener("load",i),n==null||n.addEventListener("load",i),()=>{r==null||r.removeEventListener("load",i),n==null||n.removeEventListener("load",i)}}]},mediaIsPip:{get(i){var e,t;let{media:a,documentElement:r}=i;if(!a||!r||!r.pictureInPictureElement)return!1;if(r.pictureInPictureElement===a)return!0;if(r.pictureInPictureElement instanceof HTMLMediaElement)return(e=a.localName)!=null&&e.includes("-")?ce(a,r.pictureInPictureElement):!1;if(r.pictureInPictureElement.localName.includes("-")){let n=r.pictureInPictureElement.shadowRoot;for(;n!=null&&n.pictureInPictureElement;){if(n.pictureInPictureElement===a)return!0;n=(t=n.pictureInPictureElement)==null?void 0:t.shadowRoot}}return!1},set(i,e){let{media:t}=e;if(t)if(i){if(!m.pictureInPictureEnabled){console.warn("MediaChrome: Picture-in-picture is not enabled");return}if(!t.requestPictureInPicture){console.warn("MediaChrome: The current media does not support picture-in-picture");return}let a=()=>{console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.")};t.requestPictureInPicture().catch(r=>{if(r.code===11){if(!t.src){console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a src set.");return}if(t.readyState===0&&t.preload==="none"){let n=()=>{t.removeEventListener("loadedmetadata",s),t.preload="none"},s=()=>{t.requestPictureInPicture().catch(a),n()};t.addEventListener("loadedmetadata",s),t.preload="metadata",setTimeout(()=>{t.readyState===0&&a(),n()},1e3)}else throw r}else throw r})}else m.pictureInPictureElement&&m.exitPictureInPicture()},mediaEvents:["enterpictureinpicture","leavepictureinpicture"]},mediaRenditionList:{get(i){var e;let{media:t}=i;return[...(e=t==null?void 0:t.videoRenditions)!=null?e:[]].map(a=>({...a}))},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaRenditionSelected:{get(i){var e,t,a;let{media:r}=i;return(a=(t=r==null?void 0:r.videoRenditions)==null?void 0:t[(e=r.videoRenditions)==null?void 0:e.selectedIndex])==null?void 0:a.id},set(i,e){let{media:t}=e;if(!(t!=null&&t.videoRenditions)){console.warn("MediaController: Rendition selection not supported by this media.");return}let a=i,r=Array.prototype.findIndex.call(t.videoRenditions,n=>n.id==a);t.videoRenditions.selectedIndex!=r&&(t.videoRenditions.selectedIndex=r)},mediaEvents:["emptied"],videoRenditionsEvents:["addrendition","removerendition","change"]},mediaAudioTrackList:{get(i){var e;let{media:t}=i;return[...(e=t==null?void 0:t.audioTracks)!=null?e:[]]},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaAudioTrackEnabled:{get(i){var e,t;let{media:a}=i;return(t=[...(e=a==null?void 0:a.audioTracks)!=null?e:[]].find(r=>r.enabled))==null?void 0:t.id},set(i,e){let{media:t}=e;if(!(t!=null&&t.audioTracks)){console.warn("MediaChrome: Audio track selection not supported by this media.");return}let a=i;for(let r of t.audioTracks)r.enabled=a==r.id},mediaEvents:["emptied"],audioTracksEvents:["addtrack","removetrack","change"]},mediaIsFullscreen:{get(i){return eu(i)},set(i,e){i?Jd(e):jd(e)},rootEvents:["fullscreenchange","webkitfullscreenchange"],mediaEvents:["webkitbeginfullscreen","webkitendfullscreen","webkitpresentationmodechanged"]},mediaIsCasting:{get(i){var e;let{media:t}=i;return!(t!=null&&t.remote)||((e=t.remote)==null?void 0:e.state)==="disconnected"?!1:!!t.remote.state},set(i,e){var t,a;let{media:r}=e;if(r&&!(i&&((t=r.remote)==null?void 0:t.state)!=="disconnected")&&!(!i&&((a=r.remote)==null?void 0:a.state)!=="connected")){if(typeof r.remote.prompt!="function"){console.warn("MediaChrome: Casting is not supported in this environment");return}r.remote.prompt().catch(()=>{})}},remoteEvents:["connect","connecting","disconnect"]},mediaIsAirplaying:{get(){return!1},set(i,e){let{media:t}=e;if(t){if(!(t.webkitShowPlaybackTargetPicker&&d.WebKitPlaybackTargetAvailabilityEvent)){console.warn("MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment");return}t.webkitShowPlaybackTargetPicker()}},mediaEvents:["webkitcurrentplaybacktargetiswirelesschanged"]},mediaFullscreenUnavailable:{get(i){let{media:e}=i;if(!au||!Xo(e))return Te.UNSUPPORTED}},mediaPipUnavailable:{get(i){let{media:e}=i;if(!ru||!zo(e))return Te.UNSUPPORTED}},mediaVolumeUnavailable:{get(i){let{media:e}=i;if(Fr===!1||(e==null?void 0:e.volume)==null)return Te.UNSUPPORTED},stateOwnersUpdateHandlers:[i=>{Fr==null&&Vh.then(e=>i(e?void 0:Te.UNSUPPORTED))}]},mediaCastUnavailable:{get(i,{availability:e="not-available"}={}){var t;let{media:a}=i;if(!ou||!((t=a==null?void 0:a.remote)!=null&&t.state))return Te.UNSUPPORTED;if(!(e==null||e==="available"))return Te.UNAVAILABLE},stateOwnersUpdateHandlers:[(i,e)=>{var t;let{media:a}=e;return a?(a.disableRemotePlayback||a.hasAttribute("disableremoteplayback")||(t=a==null?void 0:a.remote)==null||t.watchAvailability(n=>{i({availability:n?"available":"not-available"})}).catch(n=>{n.name==="NotSupportedError"?i({availability:null}):i({availability:"not-available"})}),()=>{var n;(n=a==null?void 0:a.remote)==null||n.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaAirplayUnavailable:{get(i,e){if(!nu)return Te.UNSUPPORTED;if((e==null?void 0:e.availability)==="not-available")return Te.UNAVAILABLE},mediaEvents:["webkitplaybacktargetavailabilitychanged"],stateOwnersUpdateHandlers:[(i,e)=>{var t;let{media:a}=e;return a?(a.disableRemotePlayback||a.hasAttribute("disableremoteplayback")||(t=a==null?void 0:a.remote)==null||t.watchAvailability(n=>{i({availability:n?"available":"not-available"})}).catch(n=>{n.name==="NotSupportedError"?i({availability:null}):i({availability:"not-available"})}),()=>{var n;(n=a==null?void 0:a.remote)==null||n.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaRenditionUnavailable:{get(i){var e;let{media:t}=i;if(!(t!=null&&t.videoRenditions))return Te.UNSUPPORTED;if(!((e=t.videoRenditions)!=null&&e.length))return Te.UNAVAILABLE},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaAudioTrackUnavailable:{get(i){var e,t;let{media:a}=i;if(!(a!=null&&a.audioTracks))return Te.UNSUPPORTED;if(((t=(e=a.audioTracks)==null?void 0:e.length)!=null?t:0)<=1)return Te.UNAVAILABLE},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]}};var lu={[p.MEDIA_PREVIEW_REQUEST](i,e,{detail:t}){var a,r,n;let{media:s}=e,l=t!=null?t:void 0,u,c;if(s&&l!=null){let[f]=Yt(s,{kind:pe.METADATA,label:"thumbnails"}),L=Array.prototype.find.call((a=f==null?void 0:f.cues)!=null?a:[],(A,T,N)=>T===0?A.endTime>l:T===N.length-1?A.startTime<=l:A.startTime<=l&&A.endTime>l);if(L){let A=/'^(?:[a-z]+:)?\/\//i.test(L.text)||(r=s==null?void 0:s.querySelector('track[label="thumbnails"]'))==null?void 0:r.src,T=new URL(L.text,A);c=new URLSearchParams(T.hash).get("#xywh").split(",").map(te=>+te),u=T.href}}let b=i.mediaDuration.get(e),v=(n=i.mediaChaptersCues.get(e).find((f,L,A)=>L===A.length-1&&b===f.endTime?f.startTime<=l&&f.endTime>=l:f.startTime<=l&&f.endTime>l))==null?void 0:n.text;return t!=null&&v==null&&(v=""),{mediaPreviewTime:l,mediaPreviewImage:u,mediaPreviewCoords:c,mediaPreviewChapter:v}},[p.MEDIA_PAUSE_REQUEST](i,e){i["mediaPaused"].set(!0,e)},[p.MEDIA_PLAY_REQUEST](i,e){var t;let a="mediaPaused";if(i.mediaStreamType.get(e)===Me.LIVE){let s=!(i.mediaTargetLiveWindow.get(e)>0),l=(t=i.mediaSeekable.get(e))==null?void 0:t[1];s&&l&&i.mediaCurrentTime.set(l,e)}i[a].set(!1,e)},[p.MEDIA_PLAYBACK_RATE_REQUEST](i,e,{detail:t}){let a="mediaPlaybackRate",r=t;i[a].set(r,e)},[p.MEDIA_MUTE_REQUEST](i,e){i["mediaMuted"].set(!0,e)},[p.MEDIA_UNMUTE_REQUEST](i,e){let t="mediaMuted";i.mediaVolume.get(e)||i.mediaVolume.set(.25,e),i[t].set(!1,e)},[p.MEDIA_VOLUME_REQUEST](i,e,{detail:t}){let a="mediaVolume",r=t;r&&i.mediaMuted.get(e)&&i.mediaMuted.set(!1,e),i[a].set(r,e)},[p.MEDIA_SEEK_REQUEST](i,e,{detail:t}){let a="mediaCurrentTime",r=t;i[a].set(r,e)},[p.MEDIA_SEEK_TO_LIVE_REQUEST](i,e){var t;let a="mediaCurrentTime",r=(t=i.mediaSeekable.get(e))==null?void 0:t[1];Number.isNaN(Number(r))||i[a].set(r,e)},[p.MEDIA_SHOW_SUBTITLES_REQUEST](i,e,{detail:t}){var a;let{options:r}=e,n=yi(e),s=Zo(t),l=(a=s[0])==null?void 0:a.language;l&&!r.noSubtitlesLangPref&&d.localStorage.setItem("media-chrome-pref-subtitles-lang",l),Vt(_t.SHOWING,n,s)},[p.MEDIA_DISABLE_SUBTITLES_REQUEST](i,e,{detail:t}){let a=yi(e),r=t!=null?t:[];Vt(_t.DISABLED,a,r)},[p.MEDIA_TOGGLE_SUBTITLES_REQUEST](i,e,{detail:t}){Wr(e,t)},[p.MEDIA_RENDITION_REQUEST](i,e,{detail:t}){let a="mediaRenditionSelected",r=t;i[a].set(r,e)},[p.MEDIA_AUDIO_TRACK_REQUEST](i,e,{detail:t}){let a="mediaAudioTrackEnabled",r=t;i[a].set(r,e)},[p.MEDIA_ENTER_PIP_REQUEST](i,e){let t="mediaIsPip";i.mediaIsFullscreen.get(e)&&i.mediaIsFullscreen.set(!1,e),i[t].set(!0,e)},[p.MEDIA_EXIT_PIP_REQUEST](i,e){i["mediaIsPip"].set(!1,e)},[p.MEDIA_ENTER_FULLSCREEN_REQUEST](i,e){let t="mediaIsFullscreen";i.mediaIsPip.get(e)&&i.mediaIsPip.set(!1,e),i[t].set(!0,e)},[p.MEDIA_EXIT_FULLSCREEN_REQUEST](i,e){i["mediaIsFullscreen"].set(!1,e)},[p.MEDIA_ENTER_CAST_REQUEST](i,e){let t="mediaIsCasting";i.mediaIsFullscreen.get(e)&&i.mediaIsFullscreen.set(!1,e),i[t].set(!0,e)},[p.MEDIA_EXIT_CAST_REQUEST](i,e){i["mediaIsCasting"].set(!1,e)},[p.MEDIA_AIRPLAY_REQUEST](i,e){i["mediaIsAirplaying"].set(!0,e)}};var Yh=({media:i,fullscreenElement:e,documentElement:t,stateMediator:a=Ia,requestMap:r=lu,options:n={},monitorStateOwnersOnlyWithSubscriptions:s=!0})=>{let l=[],u={options:{...n}},c=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0}),b=A=>{A!=null&&($r(A,c)||(c=Object.freeze({...c,...A}),l.forEach(T=>T(c))))},g=()=>{let A=Object.entries(a).reduce((T,[N,{get:te}])=>(T[N]=te(u),T),{});b(A)},v={},f,L=async(A,T)=>{var N,te,be,gt,rt,ji,ea,ta,ia,aa,ra,na,oa,sa,la,da;let Ar=!!f;if(f={...u,...f!=null?f:{},...A},Ar)return;await su(...Object.values(A));let nt=l.length>0&&T===0&&s,ua=u.media!==f.media,ca=((N=u.media)==null?void 0:N.textTracks)!==((te=f.media)==null?void 0:te.textTracks),ma=((be=u.media)==null?void 0:be.videoRenditions)!==((gt=f.media)==null?void 0:gt.videoRenditions),ha=((rt=u.media)==null?void 0:rt.audioTracks)!==((ji=f.media)==null?void 0:ji.audioTracks),sd=((ea=u.media)==null?void 0:ea.remote)!==((ta=f.media)==null?void 0:ta.remote),ld=u.documentElement!==f.documentElement,dd=!!u.media&&(ua||nt),ud=!!((ia=u.media)!=null&&ia.textTracks)&&(ca||nt),cd=!!((aa=u.media)!=null&&aa.videoRenditions)&&(ma||nt),md=!!((ra=u.media)!=null&&ra.audioTracks)&&(ha||nt),hd=!!((na=u.media)!=null&&na.remote)&&(sd||nt),pd=!!u.documentElement&&(ld||nt),vd=dd||ud||cd||md||hd||pd,vi=l.length===0&&T===1&&s,fd=!!f.media&&(ua||vi),Ed=!!((oa=f.media)!=null&&oa.textTracks)&&(ca||vi),bd=!!((sa=f.media)!=null&&sa.videoRenditions)&&(ma||vi),gd=!!((la=f.media)!=null&&la.audioTracks)&&(ha||vi),_d=!!((da=f.media)!=null&&da.remote)&&(sd||vi),Ad=!!f.documentElement&&(ld||vi),Td=fd||Ed||bd||gd||_d||Ad;if(!(vd||Td)){Object.entries(f).forEach(([$,pa])=>{u[$]=pa}),g(),f=void 0;return}Object.entries(a).forEach(([$,{get:pa,mediaEvents:th=[],textTracksEvents:ih=[],videoRenditionsEvents:ah=[],audioTracksEvents:rh=[],remoteEvents:nh=[],rootEvents:oh=[],stateOwnersUpdateHandlers:sh=[]}])=>{v[$]||(v[$]={});let ge=J=>{let _e=pa(u,J);b({[$]:_e})},ae;ae=v[$].mediaEvents,th.forEach(J=>{ae&&dd&&(u.media.removeEventListener(J,ae),v[$].mediaEvents=void 0),fd&&(f.media.addEventListener(J,ge),v[$].mediaEvents=ge)}),ae=v[$].textTracksEvents,ih.forEach(J=>{var _e,Ce;ae&&ud&&((_e=u.media.textTracks)==null||_e.removeEventListener(J,ae),v[$].textTracksEvents=void 0),Ed&&((Ce=f.media.textTracks)==null||Ce.addEventListener(J,ge),v[$].textTracksEvents=ge)}),ae=v[$].videoRenditionsEvents,ah.forEach(J=>{var _e,Ce;ae&&cd&&((_e=u.media.videoRenditions)==null||_e.removeEventListener(J,ae),v[$].videoRenditionsEvents=void 0),bd&&((Ce=f.media.videoRenditions)==null||Ce.addEventListener(J,ge),v[$].videoRenditionsEvents=ge)}),ae=v[$].audioTracksEvents,rh.forEach(J=>{var _e,Ce;ae&&md&&((_e=u.media.audioTracks)==null||_e.removeEventListener(J,ae),v[$].audioTracksEvents=void 0),gd&&((Ce=f.media.audioTracks)==null||Ce.addEventListener(J,ge),v[$].audioTracksEvents=ge)}),ae=v[$].remoteEvents,nh.forEach(J=>{var _e,Ce;ae&&hd&&((_e=u.media.remote)==null||_e.removeEventListener(J,ae),v[$].remoteEvents=void 0),_d&&((Ce=f.media.remote)==null||Ce.addEventListener(J,ge),v[$].remoteEvents=ge)}),ae=v[$].rootEvents,oh.forEach(J=>{ae&&pd&&(u.documentElement.removeEventListener(J,ae),v[$].rootEvents=void 0),Ad&&(f.documentElement.addEventListener(J,ge),v[$].rootEvents=ge)});let yd=v[$].stateOwnersUpdateHandlers;sh.forEach(J=>{yd&&vd&&yd(),Td&&(v[$].stateOwnersUpdateHandlers=J(ge,f))})}),Object.entries(f).forEach(([$,pa])=>{u[$]=pa}),g(),f=void 0};return L({media:i,fullscreenElement:e,documentElement:t,options:n}),{dispatch(A){let{type:T,detail:N}=A;if(r[T]){b(r[T](a,u,A));return}T==="mediaelementchangerequest"?L({media:N}):T==="fullscreenelementchangerequest"?L({fullscreenElement:N}):T==="documentelementchangerequest"?L({documentElement:N}):T==="optionschangerequest"&&Object.entries(N!=null?N:{}).forEach(([te,be])=>{u.options[te]=be})},getState(){return c},subscribe(A){return L({},l.length+1),l.push(A),A(c),()=>{let T=l.indexOf(A);T>=0&&(L({},l.length-1),l.splice(T,1))}}}},du=Yh;var is=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},C=(i,e,t)=>(is(i,e,"read from private field"),t?t.call(i):e.get(i)),ct=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},kt=(i,e,t,a)=>(is(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),St=(i,e,t)=>(is(i,e,"access private method"),t),It,Ca,q,Ma,He,Kr,Vr,jo,ki,La,Yr,es,pu=["ArrowLeft","ArrowRight","Enter"," ","f","m","k","c"],uu=10,O={DEFAULT_SUBTITLES:"defaultsubtitles",DEFAULT_STREAM_TYPE:"defaultstreamtype",DEFAULT_DURATION:"defaultduration",FULLSCREEN_ELEMENT:"fullscreenelement",HOTKEYS:"hotkeys",KEYS_USED:"keysused",LIVE_EDGE_OFFSET:"liveedgeoffset",NO_AUTO_SEEK_TO_LIVE:"noautoseektolive",NO_HOTKEYS:"nohotkeys",NO_VOLUME_PREF:"novolumepref",NO_SUBTITLES_LANG_PREF:"nosubtitleslangpref",NO_DEFAULT_STORE:"nodefaultstore",KEYBOARD_FORWARD_SEEK_OFFSET:"keyboardforwardseekoffset",KEYBOARD_BACKWARD_SEEK_OFFSET:"keyboardbackwardseekoffset"},Gr=class extends ya{constructor(){super(),ct(this,Vr),ct(this,ki),ct(this,Yr),this.mediaStateReceivers=[],this.associatedElementSubscriptions=new Map,ct(this,It,new Be(this,O.HOTKEYS)),ct(this,Ca,void 0),ct(this,q,void 0),ct(this,Ma,void 0),ct(this,He,void 0),ct(this,Kr,t=>{var a;(a=C(this,q))==null||a.dispatch(t)}),this.associateElement(this);let e={};kt(this,Ma,t=>{Object.entries(t).forEach(([a,r])=>{if(a in e&&e[a]===r)return;this.propagateMediaState(a,r);let n=a.toLowerCase(),s=new d.CustomEvent(Md[n],{composed:!0,detail:r});this.dispatchEvent(s)}),e=t}),this.enableHotkeys()}static get observedAttributes(){return super.observedAttributes.concat(O.NO_HOTKEYS,O.HOTKEYS,O.DEFAULT_STREAM_TYPE,O.DEFAULT_SUBTITLES,O.DEFAULT_DURATION)}get mediaStore(){return C(this,q)}set mediaStore(e){var t,a;if(C(this,q)&&((t=C(this,He))==null||t.call(this),kt(this,He,void 0)),kt(this,q,e),!C(this,q)&&!this.hasAttribute(O.NO_DEFAULT_STORE)){St(this,Vr,jo).call(this);return}kt(this,He,(a=C(this,q))==null?void 0:a.subscribe(C(this,Ma)))}get fullscreenElement(){var e;return(e=C(this,Ca))!=null?e:this}set fullscreenElement(e){var t;this.hasAttribute(O.FULLSCREEN_ELEMENT)&&this.removeAttribute(O.FULLSCREEN_ELEMENT),kt(this,Ca,e),(t=C(this,q))==null||t.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}attributeChangedCallback(e,t,a){var r,n,s,l,u,c;if(super.attributeChangedCallback(e,t,a),e===O.NO_HOTKEYS)a!==t&&a===""?(this.hasAttribute(O.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):a!==t&&a===null&&this.enableHotkeys();else if(e===O.HOTKEYS)C(this,It).value=a;else if(e===O.DEFAULT_SUBTITLES&&a!==t)(r=C(this,q))==null||r.dispatch({type:"optionschangerequest",detail:{defaultSubtitles:this.hasAttribute(O.DEFAULT_SUBTITLES)}});else if(e===O.DEFAULT_STREAM_TYPE)(s=C(this,q))==null||s.dispatch({type:"optionschangerequest",detail:{defaultStreamType:(n=this.getAttribute(O.DEFAULT_STREAM_TYPE))!=null?n:void 0}});else if(e===O.LIVE_EDGE_OFFSET)(l=C(this,q))==null||l.dispatch({type:"optionschangerequest",detail:{liveEdgeOffset:this.hasAttribute(O.LIVE_EDGE_OFFSET)?+this.getAttribute(O.LIVE_EDGE_OFFSET):void 0}});else if(e===O.FULLSCREEN_ELEMENT){let b=a?(u=this.getRootNode())==null?void 0:u.getElementById(a):void 0;kt(this,Ca,b),(c=C(this,q))==null||c.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}}connectedCallback(){var e,t;!C(this,q)&&!this.hasAttribute(O.NO_DEFAULT_STORE)&&St(this,Vr,jo).call(this),(e=C(this,q))==null||e.dispatch({type:"documentelementchangerequest",detail:m}),super.connectedCallback(),C(this,q)&&!C(this,He)&&kt(this,He,(t=C(this,q))==null?void 0:t.subscribe(C(this,Ma))),this.enableHotkeys()}disconnectedCallback(){var e,t,a,r;(e=super.disconnectedCallback)==null||e.call(this),C(this,q)&&((t=C(this,q))==null||t.dispatch({type:"documentelementchangerequest",detail:void 0}),(a=C(this,q))==null||a.dispatch({type:p.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})),C(this,He)&&((r=C(this,He))==null||r.call(this),kt(this,He,void 0))}mediaSetCallback(e){var t;super.mediaSetCallback(e),(t=C(this,q))==null||t.dispatch({type:"mediaelementchangerequest",detail:e}),e.hasAttribute("tabindex")||(e.tabIndex=-1)}mediaUnsetCallback(e){var t;super.mediaUnsetCallback(e),(t=C(this,q))==null||t.dispatch({type:"mediaelementchangerequest",detail:void 0})}propagateMediaState(e,t){hu(this.mediaStateReceivers,e,t)}associateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;if(t.has(e))return;let a=this.registerMediaStateReceiver.bind(this),r=this.unregisterMediaStateReceiver.bind(this),n=Xh(e,a,r);Object.values(p).forEach(s=>{e.addEventListener(s,C(this,Kr))}),t.set(e,n)}unassociateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;if(!t.has(e))return;t.get(e)(),t.delete(e),Object.values(p).forEach(r=>{e.removeEventListener(r,C(this,Kr))})}registerMediaStateReceiver(e){if(!e)return;let t=this.mediaStateReceivers;t.indexOf(e)>-1||(t.push(e),C(this,q)&&Object.entries(C(this,q).getState()).forEach(([r,n])=>{hu([e],r,n)}))}unregisterMediaStateReceiver(e){let t=this.mediaStateReceivers,a=t.indexOf(e);a<0||t.splice(a,1)}enableHotkeys(){this.addEventListener("keydown",St(this,Yr,es))}disableHotkeys(){this.removeEventListener("keydown",St(this,Yr,es)),this.removeEventListener("keyup",St(this,ki,La))}get hotkeys(){return C(this,It)}keyboardShortcutHandler(e){var t,a,r,n,s;let l=e.target;if(((r=(a=(t=l.getAttribute(O.KEYS_USED))==null?void 0:t.split(" "))!=null?a:l==null?void 0:l.keysUsed)!=null?r:[]).map(v=>v==="Space"?" ":v).filter(Boolean).includes(e.key))return;let c,b,g;if(!C(this,It).contains(`no${e.key.toLowerCase()}`)&&!(e.key===" "&&C(this,It).contains("nospace")))switch(e.key){case" ":case"k":c=C(this,q).getState().mediaPaused?p.MEDIA_PLAY_REQUEST:p.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new d.CustomEvent(c,{composed:!0,bubbles:!0}));break;case"m":c=this.mediaStore.getState().mediaVolumeLevel==="off"?p.MEDIA_UNMUTE_REQUEST:p.MEDIA_MUTE_REQUEST,this.dispatchEvent(new d.CustomEvent(c,{composed:!0,bubbles:!0}));break;case"f":c=this.mediaStore.getState().mediaIsFullscreen?p.MEDIA_EXIT_FULLSCREEN_REQUEST:p.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new d.CustomEvent(c,{composed:!0,bubbles:!0}));break;case"c":this.dispatchEvent(new d.CustomEvent(p.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case"ArrowLeft":{let v=this.hasAttribute(O.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(O.KEYBOARD_BACKWARD_SEEK_OFFSET):uu;b=Math.max(((n=this.mediaStore.getState().mediaCurrentTime)!=null?n:0)-v,0),g=new d.CustomEvent(p.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:b}),this.dispatchEvent(g);break}case"ArrowRight":{let v=this.hasAttribute(O.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(O.KEYBOARD_FORWARD_SEEK_OFFSET):uu;b=Math.max(((s=this.mediaStore.getState().mediaCurrentTime)!=null?s:0)+v,0),g=new d.CustomEvent(p.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:b}),this.dispatchEvent(g);break}default:break}}};It=new WeakMap;Ca=new WeakMap;q=new WeakMap;Ma=new WeakMap;He=new WeakMap;Kr=new WeakMap;Vr=new WeakSet;jo=function(){var i;this.mediaStore=du({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(O.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(O.DEFAULT_DURATION)?+this.getAttribute(O.DEFAULT_DURATION):void 0,defaultStreamType:(i=this.getAttribute(O.DEFAULT_STREAM_TYPE))!=null?i:void 0,liveEdgeOffset:this.hasAttribute(O.LIVE_EDGE_OFFSET)?+this.getAttribute(O.LIVE_EDGE_OFFSET):void 0,noVolumePref:this.hasAttribute(O.NO_VOLUME_PREF),noSubtitlesLangPref:this.hasAttribute(O.NO_SUBTITLES_LANG_PREF)}})};ki=new WeakSet;La=function(i){let{key:e}=i;if(!pu.includes(e)){this.removeEventListener("keyup",St(this,ki,La));return}this.keyboardShortcutHandler(i)};Yr=new WeakSet;es=function(i){let{metaKey:e,altKey:t,key:a}=i;if(e||t||!pu.includes(a)){this.removeEventListener("keyup",St(this,ki,La));return}[" ","ArrowLeft","ArrowRight"].includes(a)&&!(C(this,It).contains(`no${a.toLowerCase()}`)||a===" "&&C(this,It).contains("nospace"))&&i.preventDefault(),this.addEventListener("keyup",St(this,ki,La),{once:!0})};var Gh=Object.values(o),qh=Object.values(Uo),vu=i=>{var e,t,a,r;let{observedAttributes:n}=i.constructor;!n&&((e=i.nodeName)!=null&&e.includes("-"))&&(d.customElements.upgrade(i),{observedAttributes:n}=i.constructor);let s=(r=(a=(t=i==null?void 0:i.getAttribute)==null?void 0:t.call(i,k.MEDIA_CHROME_ATTRIBUTES))==null?void 0:a.split)==null?void 0:r.call(a,/\s+/);return Array.isArray(n||s)?(n||s).filter(l=>Gh.includes(l)):[]},Zh=i=>{var e,t;return(e=i.nodeName)!=null&&e.includes("-")&&d.customElements.get((t=i.nodeName)==null?void 0:t.toLowerCase())&&!(i instanceof d.customElements.get(i.nodeName.toLowerCase()))&&d.customElements.upgrade(i),qh.some(a=>a in i)},ts=i=>Zh(i)||!!vu(i).length,cu=i=>{var e;return(e=i==null?void 0:i.join)==null?void 0:e.call(i,":")},mu={[o.MEDIA_SUBTITLES_LIST]:ut,[o.MEDIA_SUBTITLES_SHOWING]:ut,[o.MEDIA_SEEKABLE]:cu,[o.MEDIA_BUFFERED]:i=>i==null?void 0:i.map(cu).join(" "),[o.MEDIA_PREVIEW_COORDS]:i=>i==null?void 0:i.join(" "),[o.MEDIA_RENDITION_LIST]:Rd,[o.MEDIA_AUDIO_TRACK_LIST]:xd},Qh=async(i,e,t)=>{var a,r;if(i.isConnected||await kr(0),typeof t=="boolean"||t==null)return B(i,e,t);if(typeof t=="number")return P(i,e,t);if(typeof t=="string")return M(i,e,t);if(Array.isArray(t)&&!t.length)return i.removeAttribute(e);let n=(r=(a=mu[e])==null?void 0:a.call(mu,t))!=null?r:t;return i.setAttribute(e,n)},zh=i=>{var e;return!!((e=i.closest)!=null&&e.call(i,'*[slot="media"]'))},Gt=(i,e)=>{if(zh(i))return;let t=(r,n)=>{var s,l;ts(r)&&n(r);let{children:u=[]}=r!=null?r:{},c=(l=(s=r==null?void 0:r.shadowRoot)==null?void 0:s.children)!=null?l:[];[...u,...c].forEach(g=>Gt(g,n))},a=i==null?void 0:i.nodeName.toLowerCase();if(a.includes("-")&&!ts(i)){d.customElements.whenDefined(a).then(()=>{t(i,e)});return}t(i,e)},hu=(i,e,t)=>{i.forEach(a=>{if(e in a){a[e]=t;return}let r=vu(a),n=e.toLowerCase();r.includes(n)&&Qh(a,n,t)})},Xh=(i,e,t)=>{Gt(i,e);let a=b=>{var g;let v=(g=b==null?void 0:b.composedPath()[0])!=null?g:b.target;e(v)},r=b=>{var g;let v=(g=b==null?void 0:b.composedPath()[0])!=null?g:b.target;t(v)};i.addEventListener(p.REGISTER_MEDIA_STATE_RECEIVER,a),i.addEventListener(p.UNREGISTER_MEDIA_STATE_RECEIVER,r);let n=b=>{b.forEach(g=>{let{addedNodes:v=[],removedNodes:f=[],type:L,target:A,attributeName:T}=g;L==="childList"?(Array.prototype.forEach.call(v,N=>Gt(N,e)),Array.prototype.forEach.call(f,N=>Gt(N,t))):L==="attributes"&&T===k.MEDIA_CHROME_ATTRIBUTES&&(ts(A)?e(A):t(A))})},s=[],l=b=>{let g=b.target;g.name!=="media"&&(s.forEach(v=>Gt(v,t)),s=[...g.assignedElements({flatten:!0})],s.forEach(v=>Gt(v,e)))};i.addEventListener("slotchange",l);let u=new MutationObserver(n);return u.observe(i,{childList:!0,attributes:!0,subtree:!0}),()=>{Gt(i,t),i.removeEventListener("slotchange",l),u.disconnect(),i.removeEventListener(p.REGISTER_MEDIA_STATE_RECEIVER,a),i.removeEventListener(p.UNREGISTER_MEDIA_STATE_RECEIVER,r)}};d.customElements.get("media-controller")||d.customElements.define("media-controller",Gr);var as=Gr;var ns=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},ee=(i,e,t)=>(ns(i,e,"read from private field"),t?t.call(i):e.get(i)),Si=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},qr=(i,e,t,a)=>(ns(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Jh=(i,e,t)=>(ns(i,e,"access private method"),t),We,Ci,Ct,Ii,Qr,rs,fu,Zr={TOOLTIP_PLACEMENT:"tooltipplacement"},Eu=m.createElement("template");Eu.innerHTML=`
<style>
  :host {
    position: relative;
    font: var(--media-font,
      var(--media-font-weight, bold)
      var(--media-font-size, 14px) /
      var(--media-text-content-height, var(--media-control-height, 24px))
      var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
    color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
    background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
    padding: var(--media-button-padding, var(--media-control-padding, 10px));
    justify-content: var(--media-button-justify-content, center);
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    box-sizing: border-box;
    transition: background .15s linear;
    pointer-events: auto;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  
  :host(:focus-visible) {
    box-shadow: inset 0 0 0 2px rgb(27 127 204 / .9);
    outline: 0;
  }
  
  :host(:where(:focus)) {
    box-shadow: none;
    outline: 0;
  }

  :host(:hover) {
    background: var(--media-control-hover-background, rgba(50 50 70 / .7));
  }

  svg, img, ::slotted(svg), ::slotted(img) {
    width: var(--media-button-icon-width);
    height: var(--media-button-icon-height, var(--media-control-height, 24px));
    transform: var(--media-button-icon-transform);
    transition: var(--media-button-icon-transition);
    fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
    vertical-align: middle;
    max-width: 100%;
    max-height: 100%;
    min-width: 100%;
  }

  media-tooltip {
    
    max-width: 0;
    overflow-x: clip;
    opacity: 0;
    transition: opacity .3s, max-width 0s 9s;
  }

  :host(:hover) media-tooltip,
  :host(:focus-visible) media-tooltip {
    max-width: 100vw;
    opacity: 1;
    transition: opacity .3s;
  }

  :host([notooltip]) slot[name="tooltip"] {
    display: none;
  }
</style>

<slot name="tooltip">
  <media-tooltip part="tooltip" aria-hidden="true">
    <slot name="tooltip-content"></slot>
  </media-tooltip>
</slot>
`;var F=class extends d.HTMLElement{constructor(e={}){var t;if(super(),Si(this,rs),Si(this,We,void 0),this.preventClick=!1,this.tooltipEl=null,this.tooltipContent="",Si(this,Ci,a=>{this.preventClick||this.handleClick(a),setTimeout(ee(this,Ct),0)}),Si(this,Ct,()=>{var a,r;(r=(a=this.tooltipEl)==null?void 0:a.updateXOffset)==null||r.call(a)}),Si(this,Ii,a=>{let{key:r}=a;if(!this.keysUsed.includes(r)){this.removeEventListener("keyup",ee(this,Ii));return}this.preventClick||this.handleClick(a)}),Si(this,Qr,a=>{let{metaKey:r,altKey:n,key:s}=a;if(r||n||!this.keysUsed.includes(s)){this.removeEventListener("keyup",ee(this,Ii));return}this.addEventListener("keyup",ee(this,Ii),{once:!0})}),!this.shadowRoot){this.attachShadow({mode:"open"});let a=Eu.content.cloneNode(!0);this.nativeEl=a;let r=e.slotTemplate;r||(r=m.createElement("template"),r.innerHTML=`<slot>${e.defaultContent||""}</slot>`),e.tooltipContent&&(a.querySelector('slot[name="tooltip-content"]').innerHTML=(t=e.tooltipContent)!=null?t:"",this.tooltipContent=e.tooltipContent),this.nativeEl.appendChild(r.content.cloneNode(!0)),this.shadowRoot.appendChild(a)}this.tooltipEl=this.shadowRoot.querySelector("media-tooltip")}static get observedAttributes(){return["disabled",Zr.TOOLTIP_PLACEMENT,k.MEDIA_CONTROLLER]}enable(){this.addEventListener("click",ee(this,Ci)),this.addEventListener("keydown",ee(this,Qr)),this.tabIndex=0}disable(){this.removeEventListener("click",ee(this,Ci)),this.removeEventListener("keydown",ee(this,Qr)),this.removeEventListener("keyup",ee(this,Ii)),this.tabIndex=-1}attributeChangedCallback(e,t,a){var r,n,s,l,u;e===k.MEDIA_CONTROLLER?(t&&((n=(r=ee(this,We))==null?void 0:r.unassociateElement)==null||n.call(r,this),qr(this,We,null)),a&&this.isConnected&&(qr(this,We,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=ee(this,We))==null?void 0:l.associateElement)==null||u.call(l,this))):e==="disabled"&&a!==t?a==null?this.enable():this.disable():e===Zr.TOOLTIP_PLACEMENT&&this.tooltipEl&&a!==t&&(this.tooltipEl.placement=a),ee(this,Ct).call(this)}connectedCallback(){var e,t,a;let{style:r}=W(this.shadowRoot,":host");r.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","button");let n=this.getAttribute(k.MEDIA_CONTROLLER);n&&(qr(this,We,(e=this.getRootNode())==null?void 0:e.getElementById(n)),(a=(t=ee(this,We))==null?void 0:t.associateElement)==null||a.call(t,this)),d.customElements.whenDefined("media-tooltip").then(()=>Jh(this,rs,fu).call(this))}disconnectedCallback(){var e,t;this.disable(),(t=(e=ee(this,We))==null?void 0:e.unassociateElement)==null||t.call(e,this),qr(this,We,null),this.removeEventListener("mouseenter",ee(this,Ct)),this.removeEventListener("focus",ee(this,Ct)),this.removeEventListener("click",ee(this,Ci))}get keysUsed(){return["Enter"," "]}get tooltipPlacement(){return x(this,Zr.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){M(this,Zr.TOOLTIP_PLACEMENT,e)}handleClick(e){}};We=new WeakMap;Ci=new WeakMap;Ct=new WeakMap;Ii=new WeakMap;Qr=new WeakMap;rs=new WeakSet;fu=function(){this.addEventListener("mouseenter",ee(this,Ct)),this.addEventListener("focus",ee(this,Ct)),this.addEventListener("click",ee(this,Ci));let i=this.tooltipPlacement;i&&this.tooltipEl&&(this.tooltipEl.placement=i)};d.customElements.get("media-chrome-button")||d.customElements.define("media-chrome-button",F);var bu=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`,_u=m.createElement("template");_u.innerHTML=`
  <style>
    :host([${o.MEDIA_IS_AIRPLAYING}]) slot[name=icon] slot:not([name=exit]) {
      display: none !important;
    }

    
    :host(:not([${o.MEDIA_IS_AIRPLAYING}])) slot[name=icon] slot:not([name=enter]) {
      display: none !important;
    }

    :host([${o.MEDIA_IS_AIRPLAYING}]) slot[name=tooltip-enter],
    :host(:not([${o.MEDIA_IS_AIRPLAYING}])) slot[name=tooltip-exit] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="enter">${bu}</slot>
    <slot name="exit">${bu}</slot>
  </slot>
`;var jh=`
  <slot name="tooltip-enter">${I.ENTER_AIRPLAY}</slot>
  <slot name="tooltip-exit">${I.EXIT_AIRPLAY}</slot>
`,gu=i=>{let e=i.mediaIsAirplaying?Y.EXIT_AIRPLAY():Y.ENTER_AIRPLAY();i.setAttribute("aria-label",e)},os=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_AIRPLAYING,o.MEDIA_AIRPLAY_UNAVAILABLE]}constructor(e={}){super({slotTemplate:_u,tooltipContent:jh,...e})}connectedCallback(){super.connectedCallback(),gu(this)}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_IS_AIRPLAYING&&gu(this)}get mediaIsAirplaying(){return H(this,o.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(e){B(this,o.MEDIA_IS_AIRPLAYING,e)}get mediaAirplayUnavailable(){return x(this,o.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(e){M(this,o.MEDIA_AIRPLAY_UNAVAILABLE,e)}handleClick(){let e=new d.CustomEvent(p.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(e)}};d.customElements.get("media-airplay-button")||d.customElements.define("media-airplay-button",os);var ep=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,tp=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,ku=m.createElement("template");ku.innerHTML=`
  <style>
    :host([aria-checked="true"]) slot[name=off] {
      display: none !important;
    }

    
    :host(:not([aria-checked="true"])) slot[name=on] {
      display: none !important;
    }

    :host([aria-checked="true"]) slot[name=tooltip-enable],
    :host(:not([aria-checked="true"])) slot[name=tooltip-disable] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="on">${ep}</slot>
    <slot name="off">${tp}</slot>
  </slot>
`;var ip=`
  <slot name="tooltip-enable">${I.ENABLE_CAPTIONS}</slot>
  <slot name="tooltip-disable">${I.DISABLE_CAPTIONS}</slot>
`,Au=i=>{i.setAttribute("aria-checked",Br(i).toString())},ss=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_SUBTITLES_LIST,o.MEDIA_SUBTITLES_SHOWING]}constructor(e={}){super({slotTemplate:ku,tooltipContent:ip,...e}),this._captionsReady=!1}connectedCallback(){super.connectedCallback(),this.setAttribute("role","switch"),this.setAttribute("aria-label",V.CLOSED_CAPTIONS()),Au(this)}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_SUBTITLES_SHOWING&&Au(this)}get mediaSubtitlesList(){return Tu(this,o.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){yu(this,o.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Tu(this,o.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){yu(this,o.MEDIA_SUBTITLES_SHOWING,e)}handleClick(){this.dispatchEvent(new d.CustomEvent(p.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}},Tu=(i,e)=>{let t=i.getAttribute(e);return t?Kt(t):[]},yu=(i,e,t)=>{if(!(t!=null&&t.length)){i.removeAttribute(e);return}let a=ut(t);i.getAttribute(e)!==a&&i.setAttribute(e,a)};d.customElements.get("media-captions-button")||d.customElements.define("media-captions-button",ss);var ap='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg>',rp='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg>',Iu=m.createElement("template");Iu.innerHTML=`
  <style>
  :host([${o.MEDIA_IS_CASTING}]) slot[name=icon] slot:not([name=exit]) {
    display: none !important;
  }

  
  :host(:not([${o.MEDIA_IS_CASTING}])) slot[name=icon] slot:not([name=enter]) {
    display: none !important;
  }

  :host([${o.MEDIA_IS_CASTING}]) slot[name=tooltip-enter],
    :host(:not([${o.MEDIA_IS_CASTING}])) slot[name=tooltip-exit] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="enter">${ap}</slot>
    <slot name="exit">${rp}</slot>
  </slot>
`;var np=`
  <slot name="tooltip-enter">${I.START_CAST}</slot>
  <slot name="tooltip-exit">${I.STOP_CAST}</slot>
`,Su=i=>{let e=i.mediaIsCasting?Y.EXIT_CAST():Y.ENTER_CAST();i.setAttribute("aria-label",e)},ls=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_CASTING,o.MEDIA_CAST_UNAVAILABLE]}constructor(e={}){super({slotTemplate:Iu,tooltipContent:np,...e})}connectedCallback(){super.connectedCallback(),Su(this)}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_IS_CASTING&&Su(this)}get mediaIsCasting(){return H(this,o.MEDIA_IS_CASTING)}set mediaIsCasting(e){B(this,o.MEDIA_IS_CASTING,e)}get mediaCastUnavailable(){return x(this,o.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(e){M(this,o.MEDIA_CAST_UNAVAILABLE,e)}handleClick(){let e=this.mediaIsCasting?p.MEDIA_EXIT_CAST_REQUEST:p.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new d.CustomEvent(e,{composed:!0,bubbles:!0}))}};d.customElements.get("media-cast-button")||d.customElements.define("media-cast-button",ls);var vs=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Mi=(i,e,t)=>(vs(i,e,"read from private field"),t?t.call(i):e.get(i)),qt=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Cu=(i,e,t,a)=>(vs(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Ra=(i,e,t)=>(vs(i,e,"access private method"),t),wa,Zt,us,Mu,cs,Lu,ms,Ru,hs,wu,ps,xu,Du=m.createElement("template");Du.innerHTML=`
  <style>
    :host {
      font: var(--media-font,
        var(--media-font-weight, normal)
        var(--media-font-size, 14px) /
        var(--media-text-content-height, var(--media-control-height, 24px))
        var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
      color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
      background: var(--media-dialog-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .8))));
      border-radius: var(--media-dialog-border-radius);
      border: var(--media-dialog-border, none);
      display: var(--media-dialog-display, inline-flex);
      transition: var(--media-dialog-transition-in,
        visibility 0s,
        opacity .2s ease-out,
        transform .15s ease-out
      ) !important;
      
      visibility: var(--media-dialog-visibility, visible);
      opacity: var(--media-dialog-opacity, 1);
      transform: var(--media-dialog-transform-in, translateY(0) scale(1));
    }

    :host([hidden]) {
      transition: var(--media-dialog-transition-out,
        visibility .15s ease-in,
        opacity .15s ease-in,
        transform .15s ease-in
      ) !important;
      visibility: var(--media-dialog-hidden-visibility, hidden);
      opacity: var(--media-dialog-hidden-opacity, 0);
      transform: var(--media-dialog-transform-out, translateY(2px) scale(.99));
      pointer-events: none;
    }
  </style>
  <slot></slot>
`;var ds={HIDDEN:"hidden",ANCHOR:"anchor"},zr=class extends d.HTMLElement{constructor(){super(),qt(this,us),qt(this,cs),qt(this,ms),qt(this,hs),qt(this,ps),qt(this,wa,null),qt(this,Zt,null),this.shadowRoot||(this.attachShadow({mode:"open"}),this.nativeEl=this.constructor.template.content.cloneNode(!0),this.shadowRoot.append(this.nativeEl)),this.addEventListener("invoke",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this)}static get observedAttributes(){return[ds.HIDDEN,ds.ANCHOR]}handleEvent(e){switch(e.type){case"invoke":Ra(this,ms,Ru).call(this,e);break;case"focusout":Ra(this,hs,wu).call(this,e);break;case"keydown":Ra(this,ps,xu).call(this,e);break}}connectedCallback(){this.role||(this.role="dialog")}attributeChangedCallback(e,t,a){e===ds.HIDDEN&&a!==t&&(this.hidden?Ra(this,cs,Lu).call(this):Ra(this,us,Mu).call(this))}focus(){Cu(this,wa,ba());let e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');e==null||e.focus()}get keysUsed(){return["Escape","Tab"]}};wa=new WeakMap;Zt=new WeakMap;us=new WeakSet;Mu=function(){var i;(i=Mi(this,Zt))==null||i.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0})};cs=new WeakSet;Lu=function(){var i;(i=Mi(this,Zt))==null||i.setAttribute("aria-expanded","false")};ms=new WeakSet;Ru=function(i){Cu(this,Zt,i.relatedTarget),ce(this,i.relatedTarget)||(this.hidden=!this.hidden)};hs=new WeakSet;wu=function(i){var e;ce(this,i.relatedTarget)||((e=Mi(this,wa))==null||e.focus(),Mi(this,Zt)&&Mi(this,Zt)!==i.relatedTarget&&!this.hidden&&(this.hidden=!0))};ps=new WeakSet;xu=function(i){var e,t,a,r,n;let{key:s,ctrlKey:l,altKey:u,metaKey:c}=i;l||u||c||this.keysUsed.includes(s)&&(i.preventDefault(),i.stopPropagation(),s==="Tab"?(i.shiftKey?(t=(e=this.previousElementSibling)==null?void 0:e.focus)==null||t.call(e):(r=(a=this.nextElementSibling)==null?void 0:a.focus)==null||r.call(a),this.blur()):s==="Escape"&&((n=Mi(this,wa))==null||n.focus(),this.hidden=!0))};zr.template=Du;d.customElements.get("media-chrome-dialog")||d.customElements.define("media-chrome-dialog",zr);var Ts=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},z=(i,e,t)=>(Ts(i,e,"read from private field"),t?t.call(i):e.get(i)),se=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Mt=(i,e,t,a)=>(Ts(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Re=(i,e,t)=>(Ts(i,e,"access private method"),t),$e,sn,Xr,Jr,we,nn,jr,en,tn,ys,Ou,an,fs,rn,Es,on,ks,bs,Nu,gs,Pu,_s,Uu,As,Bu,Hu=m.createElement("template");Hu.innerHTML=`
  <style>
    :host {
      --_focus-box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
      --_media-range-padding: var(--media-range-padding, var(--media-control-padding, 10px));

      box-shadow: var(--_focus-visible-box-shadow, none);
      background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
      height: calc(var(--media-control-height, 24px) + 2 * var(--_media-range-padding));
      display: inline-flex;
      align-items: center;
      
      vertical-align: middle;
      box-sizing: border-box;
      position: relative;
      width: 100px;
      transition: background .15s linear;
      cursor: pointer;
      pointer-events: auto;
      touch-action: none; 
      z-index: 1; 
    }

    
    input[type=range]:focus {
      outline: 0;
    }
    input[type=range]:focus::-webkit-slider-runnable-track {
      outline: 0;
    }

    :host(:hover) {
      background: var(--media-control-hover-background, rgb(50 50 70 / .7));
    }

    #leftgap {
      padding-left: var(--media-range-padding-left, var(--_media-range-padding));
    }

    #rightgap {
      padding-right: var(--media-range-padding-right, var(--_media-range-padding));
    }

    #startpoint,
    #endpoint {
      position: absolute;
    }

    #endpoint {
      right: 0;
    }

    #container {
      
      width: var(--media-range-track-width, 100%);
      transform: translate(var(--media-range-track-translate-x, 0px), var(--media-range-track-translate-y, 0px));
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      min-width: 40px;
    }

    #range {
      
      display: var(--media-time-range-hover-display, block);
      bottom: var(--media-time-range-hover-bottom, -7px);
      height: var(--media-time-range-hover-height, max(100% + 7px, 25px));
      width: 100%;
      position: absolute;
      cursor: pointer;

      -webkit-appearance: none; 
      -webkit-tap-highlight-color: transparent;
      background: transparent; 
      margin: 0;
      z-index: 1;
    }

    @media (hover: hover) {
      #range {
        bottom: var(--media-time-range-hover-bottom, -5px);
        height: var(--media-time-range-hover-height, max(100% + 5px, 20px));
      }
    }

    
    
    #range::-webkit-slider-thumb {
      -webkit-appearance: none;
      background: transparent;
      width: .1px;
      height: .1px;
    }

    
    #range::-moz-range-thumb {
      background: transparent;
      border: transparent;
      width: .1px;
      height: .1px;
    }

    #appearance {
      height: var(--media-range-track-height, 4px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      position: absolute;
      
      will-change: transform;
    }

    #track {
      background: var(--media-range-track-background, rgb(255 255 255 / .2));
      border-radius: var(--media-range-track-border-radius, 1px);
      border: var(--media-range-track-border, none);
      outline: var(--media-range-track-outline);
      outline-offset: var(--media-range-track-outline-offset);
      backdrop-filter: var(--media-range-track-backdrop-filter);
      -webkit-backdrop-filter: var(--media-range-track-backdrop-filter);
      box-shadow: var(--media-range-track-box-shadow, none);
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    #progress,
    #pointer {
      position: absolute;
      height: 100%;
      will-change: width;
    }

    #progress {
      background: var(--media-range-bar-color, var(--media-primary-color, rgb(238 238 238)));
      transition: var(--media-range-track-transition);
    }

    #pointer {
      background: var(--media-range-track-pointer-background);
      border-right: var(--media-range-track-pointer-border-right);
      transition: visibility .25s, opacity .25s;
      visibility: hidden;
      opacity: 0;
    }

    @media (hover: hover) {
      :host(:hover) #pointer {
        transition: visibility .5s, opacity .5s;
        visibility: visible;
        opacity: 1;
      }
    }

    #thumb {
      width: var(--media-range-thumb-width, 10px);
      height: var(--media-range-thumb-height, 10px);
      margin-left: calc(var(--media-range-thumb-width, 10px) / -2);
      border: var(--media-range-thumb-border, none);
      border-radius: var(--media-range-thumb-border-radius, 10px);
      background: var(--media-range-thumb-background, var(--media-primary-color, rgb(238 238 238)));
      box-shadow: var(--media-range-thumb-box-shadow, 1px 1px 1px transparent);
      transition: var(--media-range-thumb-transition);
      transform: var(--media-range-thumb-transform, none);
      opacity: var(--media-range-thumb-opacity, 1);
      position: absolute;
      left: 0;
      cursor: pointer;
    }

    :host([disabled]) #thumb {
      background-color: #777;
    }

    .segments #appearance {
      height: var(--media-range-segment-hover-height, 7px);
    }

    #track {
      clip-path: url(#segments-clipping);
    }

    #segments {
      --segments-gap: var(--media-range-segments-gap, 2px);
      position: absolute;
      width: 100%;
      height: 100%;
    }

    #segments-clipping {
      transform: translateX(calc(var(--segments-gap) / 2));
    }

    #segments-clipping:empty {
      display: none;
    }

    #segments-clipping rect {
      height: var(--media-range-track-height, 4px);
      y: calc((var(--media-range-segment-hover-height, 7px) - var(--media-range-track-height, 4px)) / 2);
      transition: var(--media-range-segment-transition, transform .1s ease-in-out);
      transform: var(--media-range-segment-transform, scaleY(1));
      transform-origin: center;
    }
  </style>
  <div id="leftgap"></div>
  <div id="container">
    <div id="startpoint"></div>
    <div id="endpoint"></div>
    <div id="appearance">
      <div id="track" part="track">
        <div id="pointer"></div>
        <div id="progress" part="progress"></div>
      </div>
      <div id="thumb" part="thumb"></div>
      <svg id="segments"><clipPath id="segments-clipping"></clipPath></svg>
    </div>
    <input id="range" type="range" min="0" max="1" step="any" value="0">
  </div>
  <div id="rightgap"></div>
`;var Qt=class extends d.HTMLElement{constructor(){super(),se(this,ys),se(this,an),se(this,rn),se(this,on),se(this,bs),se(this,gs),se(this,_s),se(this,As),se(this,$e,void 0),se(this,sn,void 0),se(this,Xr,void 0),se(this,Jr,void 0),se(this,we,{}),se(this,nn,[]),se(this,jr,()=>{if(this.range.matches(":focus-visible")){let{style:e}=W(this.shadowRoot,":host");e.setProperty("--_focus-visible-box-shadow","var(--_focus-box-shadow)")}}),se(this,en,()=>{let{style:e}=W(this.shadowRoot,":host");e.removeProperty("--_focus-visible-box-shadow")}),se(this,tn,()=>{let e=this.shadowRoot.querySelector("#segments-clipping");e&&e.parentNode.append(e)}),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Hu.content.cloneNode(!0))),this.container=this.shadowRoot.querySelector("#container"),Mt(this,Xr,this.shadowRoot.querySelector("#startpoint")),Mt(this,Jr,this.shadowRoot.querySelector("#endpoint")),this.range=this.shadowRoot.querySelector("#range"),this.appearance=this.shadowRoot.querySelector("#appearance")}static get observedAttributes(){return["disabled","aria-disabled",k.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,a){var r,n,s,l,u;e===k.MEDIA_CONTROLLER?(t&&((n=(r=z(this,$e))==null?void 0:r.unassociateElement)==null||n.call(r,this),Mt(this,$e,null)),a&&this.isConnected&&(Mt(this,$e,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=z(this,$e))==null?void 0:l.associateElement)==null||u.call(l,this))):(e==="disabled"||e==="aria-disabled"&&t!==a)&&(a==null?(this.range.removeAttribute(e),Re(this,an,fs).call(this)):(this.range.setAttribute(e,a),Re(this,rn,Es).call(this)))}connectedCallback(){var e,t,a;let{style:r}=W(this.shadowRoot,":host");r.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),z(this,we).pointer=W(this.shadowRoot,"#pointer"),z(this,we).progress=W(this.shadowRoot,"#progress"),z(this,we).thumb=W(this.shadowRoot,"#thumb"),z(this,we).activeSegment=W(this.shadowRoot,"#segments-clipping rect:nth-child(0)");let n=this.getAttribute(k.MEDIA_CONTROLLER);n&&(Mt(this,$e,(e=this.getRootNode())==null?void 0:e.getElementById(n)),(a=(t=z(this,$e))==null?void 0:t.associateElement)==null||a.call(t,this)),this.updateBar(),this.shadowRoot.addEventListener("focusin",z(this,jr)),this.shadowRoot.addEventListener("focusout",z(this,en)),Re(this,an,fs).call(this),st(this.container,z(this,tn))}disconnectedCallback(){var e,t;Re(this,rn,Es).call(this),(t=(e=z(this,$e))==null?void 0:e.unassociateElement)==null||t.call(e,this),Mt(this,$e,null),this.shadowRoot.removeEventListener("focusin",z(this,jr)),this.shadowRoot.removeEventListener("focusout",z(this,en)),Wt(this.container,z(this,tn))}updatePointerBar(e){var t;(t=z(this,we).pointer)==null||t.style.setProperty("width",`${this.getPointerRatio(e)*100}%`)}updateBar(){var e,t;let a=this.range.valueAsNumber*100;(e=z(this,we).progress)==null||e.style.setProperty("width",`${a}%`),(t=z(this,we).thumb)==null||t.style.setProperty("left",`${a}%`)}updateSegments(e){let t=this.shadowRoot.querySelector("#segments-clipping");if(t.textContent="",this.container.classList.toggle("segments",!!(e!=null&&e.length)),!(e!=null&&e.length))return;let a=[...new Set([+this.range.min,...e.flatMap(n=>[n.start,n.end]),+this.range.max])];Mt(this,nn,[...a]);let r=a.pop();for(let[n,s]of a.entries()){let[l,u]=[n===0,n===a.length-1],c=l?"calc(var(--segments-gap) / -1)":`${s*100}%`,g=`calc(${((u?r:a[n+1])-s)*100}%${l||u?"":" - var(--segments-gap)"})`,v=m.createElementNS("http://www.w3.org/2000/svg","rect"),f=W(this.shadowRoot,`#segments-clipping rect:nth-child(${n+1})`);f.style.setProperty("x",c),f.style.setProperty("width",g),t.append(v)}}getPointerRatio(e){let t=Fd(e.clientX,e.clientY,z(this,Xr).getBoundingClientRect(),z(this,Jr).getBoundingClientRect());return Math.max(0,Math.min(1,t))}get dragging(){return this.hasAttribute("dragging")}handleEvent(e){switch(e.type){case"pointermove":Re(this,As,Bu).call(this,e);break;case"input":this.updateBar();break;case"pointerenter":Re(this,bs,Nu).call(this,e);break;case"pointerdown":Re(this,on,ks).call(this,e);break;case"pointerup":Re(this,gs,Pu).call(this);break;case"pointerleave":Re(this,_s,Uu).call(this);break}}get keysUsed(){return["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"]}};$e=new WeakMap;sn=new WeakMap;Xr=new WeakMap;Jr=new WeakMap;we=new WeakMap;nn=new WeakMap;jr=new WeakMap;en=new WeakMap;tn=new WeakMap;ys=new WeakSet;Ou=function(i){let e=z(this,we).activeSegment;if(!e)return;let t=this.getPointerRatio(i),r=`#segments-clipping rect:nth-child(${z(this,nn).findIndex((n,s,l)=>{let u=l[s+1];return u!=null&&t>=n&&t<=u})+1})`;(e.selectorText!=r||!e.style.transform)&&(e.selectorText=r,e.style.setProperty("transform","var(--media-range-segment-hover-transform, scaleY(2))"))};an=new WeakSet;fs=function(){this.hasAttribute("disabled")||(this.addEventListener("input",this),this.addEventListener("pointerdown",this),this.addEventListener("pointerenter",this))};rn=new WeakSet;Es=function(){var i,e;this.removeEventListener("input",this),this.removeEventListener("pointerdown",this),this.removeEventListener("pointerenter",this),(i=d.window)==null||i.removeEventListener("pointerup",this),(e=d.window)==null||e.removeEventListener("pointermove",this)};on=new WeakSet;ks=function(i){var e;Mt(this,sn,i.composedPath().includes(this.range)),(e=d.window)==null||e.addEventListener("pointerup",this)};bs=new WeakSet;Nu=function(i){var e;i.pointerType!=="mouse"&&Re(this,on,ks).call(this,i),this.addEventListener("pointerleave",this),(e=d.window)==null||e.addEventListener("pointermove",this)};gs=new WeakSet;Pu=function(){var i;(i=d.window)==null||i.removeEventListener("pointerup",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled")};_s=new WeakSet;Uu=function(){var i,e;this.removeEventListener("pointerleave",this),(i=d.window)==null||i.removeEventListener("pointermove",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled"),(e=z(this,we).activeSegment)==null||e.style.removeProperty("transform")};As=new WeakSet;Bu=function(i){this.toggleAttribute("dragging",i.buttons===1||i.pointerType!=="mouse"),this.updatePointerBar(i),Re(this,ys,Ou).call(this,i),this.dragging&&(i.pointerType!=="mouse"||!z(this,sn))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(i),this.range.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})))};d.customElements.get("media-chrome-range")||d.customElements.define("media-chrome-range",Qt);var Wu=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},ln=(i,e,t)=>(Wu(i,e,"read from private field"),t?t.call(i):e.get(i)),op=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},dn=(i,e,t,a)=>(Wu(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Fe,$u=m.createElement("template");$u.innerHTML=`
  <style>
    :host {
      
      box-sizing: border-box;
      display: var(--media-control-display, var(--media-control-bar-display, inline-flex));
      color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
      --media-loading-indicator-icon-height: 44px;
    }

    ::slotted(media-time-range),
    ::slotted(media-volume-range) {
      min-height: 100%;
    }

    ::slotted(media-time-range),
    ::slotted(media-clip-selector) {
      flex-grow: 1;
    }

    ::slotted([role="menu"]) {
      position: absolute;
    }
  </style>

  <slot></slot>
`;var Ss=class extends d.HTMLElement{constructor(){super(),op(this,Fe,void 0),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild($u.content.cloneNode(!0)))}static get observedAttributes(){return[k.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,a){var r,n,s,l,u;e===k.MEDIA_CONTROLLER&&(t&&((n=(r=ln(this,Fe))==null?void 0:r.unassociateElement)==null||n.call(r,this),dn(this,Fe,null)),a&&this.isConnected&&(dn(this,Fe,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=ln(this,Fe))==null?void 0:l.associateElement)==null||u.call(l,this)))}connectedCallback(){var e,t,a;let r=this.getAttribute(k.MEDIA_CONTROLLER);r&&(dn(this,Fe,(e=this.getRootNode())==null?void 0:e.getElementById(r)),(a=(t=ln(this,Fe))==null?void 0:t.associateElement)==null||a.call(t,this))}disconnectedCallback(){var e,t;(t=(e=ln(this,Fe))==null?void 0:e.unassociateElement)==null||t.call(e,this),dn(this,Fe,null)}};Fe=new WeakMap;d.customElements.get("media-control-bar")||d.customElements.define("media-control-bar",Ss);var Fu=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},un=(i,e,t)=>(Fu(i,e,"read from private field"),t?t.call(i):e.get(i)),sp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},cn=(i,e,t,a)=>(Fu(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Ke,Ku=m.createElement("template");Ku.innerHTML=`
  <style>
    :host {
      font: var(--media-font,
        var(--media-font-weight, normal)
        var(--media-font-size, 14px) /
        var(--media-text-content-height, var(--media-control-height, 24px))
        var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
      color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
      background: var(--media-text-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7))));
      padding: var(--media-control-padding, 10px);
      display: inline-flex;
      justify-content: center;
      align-items: center;
      vertical-align: middle;
      box-sizing: border-box;
      text-align: center;
      pointer-events: auto;
    }

    
    :host(:focus-visible) {
      box-shadow: inset 0 0 0 2px rgb(27 127 204 / .9);
      outline: 0;
    }

    
    :host(:where(:focus)) {
      box-shadow: none;
      outline: 0;
    }
  </style>
  <slot></slot>
`;var xe=class extends d.HTMLElement{constructor(){super(),sp(this,Ke,void 0),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Ku.content.cloneNode(!0)))}static get observedAttributes(){return[k.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,a){var r,n,s,l,u;e===k.MEDIA_CONTROLLER&&(t&&((n=(r=un(this,Ke))==null?void 0:r.unassociateElement)==null||n.call(r,this),cn(this,Ke,null)),a&&this.isConnected&&(cn(this,Ke,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=un(this,Ke))==null?void 0:l.associateElement)==null||u.call(l,this)))}connectedCallback(){var e,t,a;let{style:r}=W(this.shadowRoot,":host");r.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);let n=this.getAttribute(k.MEDIA_CONTROLLER);n&&(cn(this,Ke,(e=this.getRootNode())==null?void 0:e.getElementById(n)),(a=(t=un(this,Ke))==null?void 0:t.associateElement)==null||a.call(t,this))}disconnectedCallback(){var e,t;(t=(e=un(this,Ke))==null?void 0:e.unassociateElement)==null||t.call(e,this),cn(this,Ke,null)}};Ke=new WeakMap;d.customElements.get("media-text-display")||d.customElements.define("media-text-display",xe);var Yu=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Vu=(i,e,t)=>(Yu(i,e,"read from private field"),t?t.call(i):e.get(i)),lp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},dp=(i,e,t,a)=>(Yu(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),xa,Is=class extends xe{constructor(){super(),lp(this,xa,void 0),dp(this,xa,this.shadowRoot.querySelector("slot")),Vu(this,xa).textContent=Pe(0)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_DURATION]}attributeChangedCallback(e,t,a){e===o.MEDIA_DURATION&&(Vu(this,xa).textContent=Pe(+a)),super.attributeChangedCallback(e,t,a)}get mediaDuration(){return w(this,o.MEDIA_DURATION)}set mediaDuration(e){P(this,o.MEDIA_DURATION,e)}};xa=new WeakMap;d.customElements.get("media-duration-display")||d.customElements.define("media-duration-display",Is);var up=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,cp=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`,qu=m.createElement("template");qu.innerHTML=`
  <style>
    :host([${o.MEDIA_IS_FULLSCREEN}]) slot[name=icon] slot:not([name=exit]) {
      display: none !important;
    }

    
    :host(:not([${o.MEDIA_IS_FULLSCREEN}])) slot[name=icon] slot:not([name=enter]) {
      display: none !important;
    }

    :host([${o.MEDIA_IS_FULLSCREEN}]) slot[name=tooltip-enter],
    :host(:not([${o.MEDIA_IS_FULLSCREEN}])) slot[name=tooltip-exit] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="enter">${up}</slot>
    <slot name="exit">${cp}</slot>
  </slot>
`;var mp=`
  <slot name="tooltip-enter">${I.ENTER_FULLSCREEN}</slot>
  <slot name="tooltip-exit">${I.EXIT_FULLSCREEN}</slot>
`,Gu=i=>{let e=i.mediaIsFullscreen?Y.EXIT_FULLSCREEN():Y.ENTER_FULLSCREEN();i.setAttribute("aria-label",e)},Cs=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_FULLSCREEN,o.MEDIA_FULLSCREEN_UNAVAILABLE]}constructor(e={}){super({slotTemplate:qu,tooltipContent:mp,...e})}connectedCallback(){super.connectedCallback(),Gu(this)}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_IS_FULLSCREEN&&Gu(this)}get mediaFullscreenUnavailable(){return x(this,o.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(e){M(this,o.MEDIA_FULLSCREEN_UNAVAILABLE,e)}get mediaIsFullscreen(){return H(this,o.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(e){B(this,o.MEDIA_IS_FULLSCREEN,e)}handleClick(){let e=this.mediaIsFullscreen?p.MEDIA_EXIT_FULLSCREEN_REQUEST:p.MEDIA_ENTER_FULLSCREEN_REQUEST;this.dispatchEvent(new d.CustomEvent(e,{composed:!0,bubbles:!0}))}};d.customElements.get("media-fullscreen-button")||d.customElements.define("media-fullscreen-button",Cs);var{MEDIA_TIME_IS_LIVE:mn,MEDIA_PAUSED:Da}=o,{MEDIA_SEEK_TO_LIVE_REQUEST:hp,MEDIA_PLAY_REQUEST:pp}=p,vp='<svg viewBox="0 0 6 12"><circle cx="3" cy="6" r="2"></circle></svg>',Qu=m.createElement("template");Qu.innerHTML=`
  <style>
  :host { --media-tooltip-display: none; }
  
  slot[name=indicator] > *,
  :host ::slotted([slot=indicator]) {
    
    min-width: auto;
    fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
    color: var(--media-live-button-icon-color, rgb(140, 140, 140));
  }

  :host([${mn}]:not([${Da}])) slot[name=indicator] > *,
  :host([${mn}]:not([${Da}])) ::slotted([slot=indicator]) {
    fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
    color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
  }

  :host([${mn}]:not([${Da}])) {
    cursor: not-allowed;
  }

  </style>

  <slot name="indicator">${vp}</slot>
  
  <slot name="spacer">&nbsp;</slot><slot name="text">LIVE</slot>
`;var Zu=i=>{let e=i.mediaPaused||!i.mediaTimeIsLive,t=e?Y.SEEK_LIVE():Y.PLAYING_LIVE();i.setAttribute("aria-label",t),e?i.removeAttribute("aria-disabled"):i.setAttribute("aria-disabled","true")},Ms=class extends F{static get observedAttributes(){return[...super.observedAttributes,Da,mn]}constructor(e={}){super({slotTemplate:Qu,...e})}connectedCallback(){Zu(this),super.connectedCallback()}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),Zu(this)}get mediaPaused(){return H(this,o.MEDIA_PAUSED)}set mediaPaused(e){B(this,o.MEDIA_PAUSED,e)}get mediaTimeIsLive(){return H(this,o.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(e){B(this,o.MEDIA_TIME_IS_LIVE,e)}handleClick(){!this.mediaPaused&&this.mediaTimeIsLive||(this.dispatchEvent(new d.CustomEvent(hp,{composed:!0,bubbles:!0})),this.hasAttribute(Da)&&this.dispatchEvent(new d.CustomEvent(pp,{composed:!0,bubbles:!0})))}};d.customElements.get("media-live-button")||d.customElements.define("media-live-button",Ms);var Ju=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Oa=(i,e,t)=>(Ju(i,e,"read from private field"),t?t.call(i):e.get(i)),zu=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Na=(i,e,t,a)=>(Ju(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Ve,hn,Xu={LOADING_DELAY:"loadingdelay"},ju=500,ec=m.createElement("template"),fp=`
<svg aria-hidden="true" viewBox="0 0 100 100">
  <path d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
    <animateTransform
       attributeName="transform"
       attributeType="XML"
       type="rotate"
       dur="1s"
       from="0 50 50"
       to="360 50 50"
       repeatCount="indefinite" />
  </path>
</svg>
`;ec.innerHTML=`
<style>
:host {
  display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
  vertical-align: middle;
  box-sizing: border-box;
  --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, ${ju}ms);
}

#status {
  color: rgba(0,0,0,0);
  width: 0px;
  height: 0px;
}

:host slot[name=icon] > *,
:host ::slotted([slot=icon]) {
  opacity: var(--media-loading-indicator-opacity, 0);
  transition: opacity 0.15s;
}

:host([${o.MEDIA_LOADING}]:not([${o.MEDIA_PAUSED}])) slot[name=icon] > *,
:host([${o.MEDIA_LOADING}]:not([${o.MEDIA_PAUSED}])) ::slotted([slot=icon]) {
  opacity: var(--media-loading-indicator-opacity, 1);
  transition: opacity 0.15s var(--_loading-indicator-delay);
}

:host #status {
  visibility: var(--media-loading-indicator-opacity, hidden);
  transition: visibility 0.15s;
}

:host([${o.MEDIA_LOADING}]:not([${o.MEDIA_PAUSED}])) #status {
  visibility: var(--media-loading-indicator-opacity, visible);
  transition: visibility 0.15s var(--_loading-indicator-delay);
}

svg, img, ::slotted(svg), ::slotted(img) {
  width: var(--media-loading-indicator-icon-width);
  height: var(--media-loading-indicator-icon-height, 100px);
  fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
  vertical-align: middle;
}
</style>

<slot name="icon">${fp}</slot>
<div id="status" role="status" aria-live="polite">${V.MEDIA_LOADING()}</div>
`;var Ls=class extends d.HTMLElement{constructor(){if(super(),zu(this,Ve,void 0),zu(this,hn,ju),!this.shadowRoot){let e=this.attachShadow({mode:"open"}),t=ec.content.cloneNode(!0);e.appendChild(t)}}static get observedAttributes(){return[k.MEDIA_CONTROLLER,o.MEDIA_PAUSED,o.MEDIA_LOADING,Xu.LOADING_DELAY]}attributeChangedCallback(e,t,a){var r,n,s,l,u;e===Xu.LOADING_DELAY&&t!==a?this.loadingDelay=Number(a):e===k.MEDIA_CONTROLLER&&(t&&((n=(r=Oa(this,Ve))==null?void 0:r.unassociateElement)==null||n.call(r,this),Na(this,Ve,null)),a&&this.isConnected&&(Na(this,Ve,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=Oa(this,Ve))==null?void 0:l.associateElement)==null||u.call(l,this)))}connectedCallback(){var e,t,a;let r=this.getAttribute(k.MEDIA_CONTROLLER);r&&(Na(this,Ve,(e=this.getRootNode())==null?void 0:e.getElementById(r)),(a=(t=Oa(this,Ve))==null?void 0:t.associateElement)==null||a.call(t,this))}disconnectedCallback(){var e,t;(t=(e=Oa(this,Ve))==null?void 0:e.unassociateElement)==null||t.call(e,this),Na(this,Ve,null)}get loadingDelay(){return Oa(this,hn)}set loadingDelay(e){Na(this,hn,e);let{style:t}=W(this.shadowRoot,":host");t.setProperty("--_loading-indicator-delay",`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return H(this,o.MEDIA_PAUSED)}set mediaPaused(e){B(this,o.MEDIA_PAUSED,e)}get mediaLoading(){return H(this,o.MEDIA_LOADING)}set mediaLoading(e){B(this,o.MEDIA_LOADING,e)}};Ve=new WeakMap;hn=new WeakMap;d.customElements.get("media-loading-indicator")||d.customElements.define("media-loading-indicator",Ls);var{MEDIA_VOLUME_LEVEL:zt}=o,Ep=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,tc=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,bp=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`,ac=m.createElement("template");ac.innerHTML=`
  <style>
  
  :host(:not([${zt}])) slot[name=icon] slot:not([name=high]), 
  :host([${zt}=high]) slot[name=icon] slot:not([name=high]) {
    display: none !important;
  }

  :host([${zt}=off]) slot[name=icon] slot:not([name=off]) {
    display: none !important;
  }

  :host([${zt}=low]) slot[name=icon] slot:not([name=low]) {
    display: none !important;
  }

  :host([${zt}=medium]) slot[name=icon] slot:not([name=medium]) {
    display: none !important;
  }

  :host(:not([${zt}=off])) slot[name=tooltip-unmute],
  :host([${zt}=off]) slot[name=tooltip-mute] {
    display: none;
  }
  </style>

  <slot name="icon">
    <slot name="off">${Ep}</slot>
    <slot name="low">${tc}</slot>
    <slot name="medium">${tc}</slot>
    <slot name="high">${bp}</slot>
  </slot>
`;var gp=`
  <slot name="tooltip-mute">${I.MUTE}</slot>
  <slot name="tooltip-unmute">${I.UNMUTE}</slot>
`,ic=i=>{let t=i.mediaVolumeLevel==="off"?Y.UNMUTE():Y.MUTE();i.setAttribute("aria-label",t)},Rs=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_VOLUME_LEVEL]}constructor(e={}){super({slotTemplate:ac,tooltipContent:gp,...e})}connectedCallback(){ic(this),super.connectedCallback()}attributeChangedCallback(e,t,a){e===o.MEDIA_VOLUME_LEVEL&&ic(this),super.attributeChangedCallback(e,t,a)}get mediaVolumeLevel(){return x(this,o.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(e){M(this,o.MEDIA_VOLUME_LEVEL,e)}handleClick(){let e=this.mediaVolumeLevel==="off"?p.MEDIA_UNMUTE_REQUEST:p.MEDIA_MUTE_REQUEST;this.dispatchEvent(new d.CustomEvent(e,{composed:!0,bubbles:!0}))}};d.customElements.get("media-mute-button")||d.customElements.define("media-mute-button",Rs);var rc=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`,oc=m.createElement("template");oc.innerHTML=`
  <style>
  :host([${o.MEDIA_IS_PIP}]) slot[name=icon] slot:not([name=exit]) {
    display: none !important;
  }

  
  :host(:not([${o.MEDIA_IS_PIP}])) slot[name=icon] slot:not([name=enter]) {
    display: none !important;
  }

  :host([${o.MEDIA_IS_PIP}]) slot[name=tooltip-enter],
  :host(:not([${o.MEDIA_IS_PIP}])) slot[name=tooltip-exit] {
    display: none;
  }
  </style>

  <slot name="icon">
    <slot name="enter">${rc}</slot>
    <slot name="exit">${rc}</slot>
  </slot>
`;var _p=`
  <slot name="tooltip-enter">${I.ENTER_PIP}</slot>
  <slot name="tooltip-exit">${I.EXIT_PIP}</slot>
`,nc=i=>{let e=i.mediaIsPip?Y.EXIT_PIP():Y.ENTER_PIP();i.setAttribute("aria-label",e)},ws=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_PIP,o.MEDIA_PIP_UNAVAILABLE]}constructor(e={}){super({slotTemplate:oc,tooltipContent:_p,...e})}connectedCallback(){nc(this),super.connectedCallback()}attributeChangedCallback(e,t,a){e===o.MEDIA_IS_PIP&&nc(this),super.attributeChangedCallback(e,t,a)}get mediaPipUnavailable(){return x(this,o.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(e){M(this,o.MEDIA_PIP_UNAVAILABLE,e)}get mediaIsPip(){return H(this,o.MEDIA_IS_PIP)}set mediaIsPip(e){B(this,o.MEDIA_IS_PIP,e)}handleClick(){let e=this.mediaIsPip?p.MEDIA_EXIT_PIP_REQUEST:p.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new d.CustomEvent(e,{composed:!0,bubbles:!0}))}};d.customElements.get("media-pip-button")||d.customElements.define("media-pip-button",ws);var Ap=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},pn=(i,e,t)=>(Ap(i,e,"read from private field"),t?t.call(i):e.get(i)),Tp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Li,xs={RATES:"rates"},Os=[1,1.2,1.5,1.7,2],Ri=1,sc=m.createElement("template");sc.innerHTML=`
  <style>
    :host {
      min-width: 5ch;
      padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
    }
  </style>
  <slot name="icon"></slot>
`;var Ds=class extends F{constructor(e={}){super({slotTemplate:sc,tooltipContent:I.PLAYBACK_RATE,...e}),Tp(this,Li,new Be(this,xs.RATES,{defaultValue:Os})),this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${Ri}x`}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PLAYBACK_RATE,xs.RATES]}attributeChangedCallback(e,t,a){if(super.attributeChangedCallback(e,t,a),e===xs.RATES&&(pn(this,Li).value=a),e===o.MEDIA_PLAYBACK_RATE){let r=a?+a:Number.NaN,n=Number.isNaN(r)?Ri:r;this.container.innerHTML=`${n}x`,this.setAttribute("aria-label",V.PLAYBACK_RATE({playbackRate:n}))}}get rates(){return pn(this,Li)}set rates(e){e?Array.isArray(e)&&(pn(this,Li).value=e.join(" ")):pn(this,Li).value=""}get mediaPlaybackRate(){return w(this,o.MEDIA_PLAYBACK_RATE,Ri)}set mediaPlaybackRate(e){P(this,o.MEDIA_PLAYBACK_RATE,e)}handleClick(){var e,t;let a=Array.from(this.rates.values(),s=>+s).sort((s,l)=>s-l),r=(t=(e=a.find(s=>s>this.mediaPlaybackRate))!=null?e:a[0])!=null?t:Ri,n=new d.CustomEvent(p.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r});this.dispatchEvent(n)}};Li=new WeakMap;d.customElements.get("media-playback-rate-button")||d.customElements.define("media-playback-rate-button",Ds);var yp=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,kp=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`,dc=m.createElement("template");dc.innerHTML=`
  <style>
    :host([${o.MEDIA_PAUSED}]) slot[name=pause],
    :host(:not([${o.MEDIA_PAUSED}])) slot[name=play] {
      display: none !important;
    }

    :host([${o.MEDIA_PAUSED}]) slot[name=tooltip-pause],
    :host(:not([${o.MEDIA_PAUSED}])) slot[name=tooltip-play] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="play">${yp}</slot>
    <slot name="pause">${kp}</slot>
  </slot>
`;var Sp=`
  <slot name="tooltip-play">${I.PLAY}</slot>
  <slot name="tooltip-pause">${I.PAUSE}</slot>
`,lc=i=>{let e=i.mediaPaused?Y.PLAY():Y.PAUSE();i.setAttribute("aria-label",e)},Ns=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PAUSED,o.MEDIA_ENDED]}constructor(e={}){super({slotTemplate:dc,tooltipContent:Sp,...e})}connectedCallback(){lc(this),super.connectedCallback()}attributeChangedCallback(e,t,a){e===o.MEDIA_PAUSED&&lc(this),super.attributeChangedCallback(e,t,a)}get mediaPaused(){return H(this,o.MEDIA_PAUSED)}set mediaPaused(e){B(this,o.MEDIA_PAUSED,e)}handleClick(){let e=this.mediaPaused?p.MEDIA_PLAY_REQUEST:p.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new d.CustomEvent(e,{composed:!0,bubbles:!0}))}};d.customElements.get("media-play-button")||d.customElements.define("media-play-button",Ns);var Ye={PLACEHOLDER_SRC:"placeholdersrc",SRC:"src"},uc=m.createElement("template");uc.innerHTML=`
  <style>
    :host {
      pointer-events: none;
      display: var(--media-poster-image-display, inline-block);
      box-sizing: border-box;
    }

    img {
      max-width: 100%;
      max-height: 100%;
      min-width: 100%;
      min-height: 100%;
      background-repeat: no-repeat;
      background-position: var(--media-poster-image-background-position, var(--media-object-position, center));
      background-size: var(--media-poster-image-background-size, var(--media-object-fit, contain));
      object-fit: var(--media-object-fit, contain);
      object-position: var(--media-object-position, center);
    }
  </style>

  <img part="poster img" aria-hidden="true" id="image"/>
`;var Ip=i=>{i.style.removeProperty("background-image")},Cp=(i,e)=>{i.style["background-image"]=`url('${e}')`},Ps=class extends d.HTMLElement{static get observedAttributes(){return[Ye.PLACEHOLDER_SRC,Ye.SRC]}constructor(){super(),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(uc.content.cloneNode(!0))),this.image=this.shadowRoot.querySelector("#image")}attributeChangedCallback(e,t,a){e===Ye.SRC&&(a==null?this.image.removeAttribute(Ye.SRC):this.image.setAttribute(Ye.SRC,a)),e===Ye.PLACEHOLDER_SRC&&(a==null?Ip(this.image):Cp(this.image,a))}get placeholderSrc(){return x(this,Ye.PLACEHOLDER_SRC)}set placeholderSrc(e){M(this,Ye.SRC,e)}get src(){return x(this,Ye.SRC)}set src(e){M(this,Ye.SRC,e)}};d.customElements.get("media-poster-image")||d.customElements.define("media-poster-image",Ps);var cc=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Mp=(i,e,t)=>(cc(i,e,"read from private field"),t?t.call(i):e.get(i)),Lp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Rp=(i,e,t,a)=>(cc(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),vn,Us=class extends xe{constructor(){super(),Lp(this,vn,void 0),Rp(this,vn,this.shadowRoot.querySelector("slot"))}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PREVIEW_CHAPTER]}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_PREVIEW_CHAPTER&&a!==t&&a!=null&&(Mp(this,vn).textContent=a,a!==""?this.setAttribute("aria-valuetext",`chapter: ${a}`):this.removeAttribute("aria-valuetext"))}get mediaPreviewChapter(){return x(this,o.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){M(this,o.MEDIA_PREVIEW_CHAPTER,e)}};vn=new WeakMap;d.customElements.get("media-preview-chapter-display")||d.customElements.define("media-preview-chapter-display",Us);var mc=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},fn=(i,e,t)=>(mc(i,e,"read from private field"),t?t.call(i):e.get(i)),wp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},En=(i,e,t,a)=>(mc(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Ge,hc=m.createElement("template");hc.innerHTML=`
  <style>
    :host {
      box-sizing: border-box;
      display: var(--media-control-display, var(--media-preview-thumbnail-display, inline-block));
      overflow: hidden;
    }

    img {
      display: none;
      position: relative;
    }
  </style>
  <img crossorigin loading="eager" decoding="async">
`;var Bs=class extends d.HTMLElement{constructor(){super(),wp(this,Ge,void 0),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(hc.content.cloneNode(!0)))}static get observedAttributes(){return[k.MEDIA_CONTROLLER,o.MEDIA_PREVIEW_IMAGE,o.MEDIA_PREVIEW_COORDS]}connectedCallback(){var e,t,a;let r=this.getAttribute(k.MEDIA_CONTROLLER);r&&(En(this,Ge,(e=this.getRootNode())==null?void 0:e.getElementById(r)),(a=(t=fn(this,Ge))==null?void 0:t.associateElement)==null||a.call(t,this))}disconnectedCallback(){var e,t;(t=(e=fn(this,Ge))==null?void 0:e.unassociateElement)==null||t.call(e,this),En(this,Ge,null)}attributeChangedCallback(e,t,a){var r,n,s,l,u;[o.MEDIA_PREVIEW_IMAGE,o.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===k.MEDIA_CONTROLLER&&(t&&((n=(r=fn(this,Ge))==null?void 0:r.unassociateElement)==null||n.call(r,this),En(this,Ge,null)),a&&this.isConnected&&(En(this,Ge,(s=this.getRootNode())==null?void 0:s.getElementById(a)),(u=(l=fn(this,Ge))==null?void 0:l.associateElement)==null||u.call(l,this)))}get mediaPreviewImage(){return x(this,o.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){M(this,o.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){let e=this.getAttribute(o.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(t=>+t)}set mediaPreviewCoords(e){if(!e){this.removeAttribute(o.MEDIA_PREVIEW_COORDS);return}this.setAttribute(o.MEDIA_PREVIEW_COORDS,e.join(" "))}update(){let e=this.mediaPreviewCoords,t=this.mediaPreviewImage;if(!(e&&t))return;let[a,r,n,s]=e,l=t.split("#")[0],u=getComputedStyle(this),{maxWidth:c,maxHeight:b,minWidth:g,minHeight:v}=u,f=Math.min(parseInt(c)/n,parseInt(b)/s),L=Math.max(parseInt(g)/n,parseInt(v)/s),A=f<1,T=A?f:L>1?L:1,{style:N}=W(this.shadowRoot,":host"),te=W(this.shadowRoot,"img").style,be=this.shadowRoot.querySelector("img"),gt=A?"min":"max";N.setProperty(`${gt}-width`,"initial","important"),N.setProperty(`${gt}-height`,"initial","important"),N.width=`${n*T}px`,N.height=`${s*T}px`;let rt=()=>{te.width=`${this.imgWidth*T}px`,te.height=`${this.imgHeight*T}px`,te.display="block"};be.src!==l&&(be.onload=()=>{this.imgWidth=be.naturalWidth,this.imgHeight=be.naturalHeight,rt()},be.src=l,rt()),rt(),te.transform=`translate(-${a*T}px, -${r*T}px)`}};Ge=new WeakMap;d.customElements.get("media-preview-thumbnail")||d.customElements.define("media-preview-thumbnail",Bs);var vc=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},pc=(i,e,t)=>(vc(i,e,"read from private field"),t?t.call(i):e.get(i)),xp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Dp=(i,e,t,a)=>(vc(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Pa,Hs=class extends xe{constructor(){super(),xp(this,Pa,void 0),Dp(this,Pa,this.shadowRoot.querySelector("slot")),pc(this,Pa).textContent=Pe(0)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_PREVIEW_TIME&&a!=null&&(pc(this,Pa).textContent=Pe(parseFloat(a)))}get mediaPreviewTime(){return w(this,o.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){P(this,o.MEDIA_PREVIEW_TIME,e)}};Pa=new WeakMap;d.customElements.get("media-preview-time-display")||d.customElements.define("media-preview-time-display",Hs);var wi={SEEK_OFFSET:"seekoffset"},bn=30,Op=`<svg aria-hidden="true" viewBox="0 0 20 24"><defs><style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style></defs><text class="text value" transform="translate(2.18 19.87)">${bn}</text><path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/></svg>`,fc=m.createElement("template");fc.innerHTML=`
  <slot name="icon">${Op}</slot>
`;var Np=0,Ws=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_CURRENT_TIME,wi.SEEK_OFFSET]}constructor(e={}){super({slotTemplate:fc,tooltipContent:I.SEEK_BACKWARD,...e})}connectedCallback(){this.seekOffset=w(this,wi.SEEK_OFFSET,bn),super.connectedCallback()}attributeChangedCallback(e,t,a){e===wi.SEEK_OFFSET&&(this.seekOffset=w(this,wi.SEEK_OFFSET,bn)),super.attributeChangedCallback(e,t,a)}get seekOffset(){return w(this,wi.SEEK_OFFSET,bn)}set seekOffset(e){P(this,wi.SEEK_OFFSET,e),this.setAttribute("aria-label",Y.SEEK_BACK_N_SECS({seekOffset:this.seekOffset})),Lr(Rr(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return w(this,o.MEDIA_CURRENT_TIME,Np)}set mediaCurrentTime(e){P(this,o.MEDIA_CURRENT_TIME,e)}handleClick(){let e=Math.max(this.mediaCurrentTime-this.seekOffset,0),t=new d.CustomEvent(p.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};d.customElements.get("media-seek-backward-button")||d.customElements.define("media-seek-backward-button",Ws);var xi={SEEK_OFFSET:"seekoffset"},gn=30,Pp=`<svg aria-hidden="true" viewBox="0 0 20 24"><defs><style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style></defs><text class="text value" transform="translate(8.9 19.87)">${gn}</text><path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/></svg>`,Ec=m.createElement("template");Ec.innerHTML=`
  <slot name="icon">${Pp}</slot>
`;var Up=0,$s=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_CURRENT_TIME,xi.SEEK_OFFSET]}constructor(e={}){super({slotTemplate:Ec,tooltipContent:I.SEEK_FORWARD,...e})}connectedCallback(){this.seekOffset=w(this,xi.SEEK_OFFSET,gn),super.connectedCallback()}attributeChangedCallback(e,t,a){e===xi.SEEK_OFFSET&&(this.seekOffset=w(this,xi.SEEK_OFFSET,gn)),super.attributeChangedCallback(e,t,a)}get seekOffset(){return w(this,xi.SEEK_OFFSET,gn)}set seekOffset(e){P(this,xi.SEEK_OFFSET,e),this.setAttribute("aria-label",Y.SEEK_FORWARD_N_SECS({seekOffset:this.seekOffset})),Lr(Rr(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return w(this,o.MEDIA_CURRENT_TIME,Up)}set mediaCurrentTime(e){P(this,o.MEDIA_CURRENT_TIME,e)}handleClick(){let e=this.mediaCurrentTime+this.seekOffset,t=new d.CustomEvent(p.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};d.customElements.get("media-seek-forward-button")||d.customElements.define("media-seek-forward-button",$s);var Ac=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Fs=(i,e,t)=>(Ac(i,e,"read from private field"),t?t.call(i):e.get(i)),Bp=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Hp=(i,e,t,a)=>(Ac(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Di,De={REMAINING:"remaining",SHOW_DURATION:"showduration",NO_TOGGLE:"notoggle"},bc=[...Object.values(De),o.MEDIA_CURRENT_TIME,o.MEDIA_DURATION,o.MEDIA_SEEKABLE],gc=["Enter"," "],Wp="&nbsp;/&nbsp;",_c=(i,{timesSep:e=Wp}={})=>{var t,a;let r=i.hasAttribute(De.REMAINING),n=i.hasAttribute(De.SHOW_DURATION),s=(t=i.mediaCurrentTime)!=null?t:0,[,l]=(a=i.mediaSeekable)!=null?a:[],u=0;Number.isFinite(i.mediaDuration)?u=i.mediaDuration:Number.isFinite(l)&&(u=l);let c=r?Pe(0-(u-s)):Pe(s);return n?`${c}${e}${Pe(u)}`:c},$p="video not loaded, unknown time.",Fp=i=>{var e;let t=i.mediaCurrentTime,[,a]=(e=i.mediaSeekable)!=null?e:[],r=null;if(Number.isFinite(i.mediaDuration)?r=i.mediaDuration:Number.isFinite(a)&&(r=a),t==null||r===null){i.setAttribute("aria-valuetext",$p);return}let n=i.hasAttribute(De.REMAINING),s=i.hasAttribute(De.SHOW_DURATION),l=n?Ht(0-(r-t)):Ht(t);if(!s){i.setAttribute("aria-valuetext",l);return}let u=Ht(r),c=`${l} of ${u}`;i.setAttribute("aria-valuetext",c)},Ks=class extends xe{constructor(){super(),Bp(this,Di,void 0),Hp(this,Di,this.shadowRoot.querySelector("slot")),Fs(this,Di).innerHTML=`${_c(this)}`}static get observedAttributes(){return[...super.observedAttributes,...bc,"disabled"]}connectedCallback(){let{style:e}=W(this.shadowRoot,":host(:hover:not([notoggle]))");e.setProperty("cursor","pointer"),e.setProperty("background","var(--media-control-hover-background, rgba(50 50 70 / .7))"),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","progressbar"),this.setAttribute("aria-label",V.PLAYBACK_TIME());let t=a=>{let{key:r}=a;if(!gc.includes(r)){this.removeEventListener("keyup",t);return}this.toggleTimeDisplay()};this.addEventListener("keydown",a=>{let{metaKey:r,altKey:n,key:s}=a;if(r||n||!gc.includes(s)){this.removeEventListener("keyup",t);return}this.addEventListener("keyup",t)}),this.addEventListener("click",this.toggleTimeDisplay),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute("remaining")?this.removeAttribute("remaining"):this.setAttribute("remaining",""))}disconnectedCallback(){this.disable(),super.disconnectedCallback()}attributeChangedCallback(e,t,a){bc.includes(e)?this.update():e==="disabled"&&a!==t&&(a==null?this.enable():this.disable()),super.attributeChangedCallback(e,t,a)}enable(){this.tabIndex=0}disable(){this.tabIndex=-1}get remaining(){return H(this,De.REMAINING)}set remaining(e){B(this,De.REMAINING,e)}get showDuration(){return H(this,De.SHOW_DURATION)}set showDuration(e){B(this,De.SHOW_DURATION,e)}get noToggle(){return H(this,De.NO_TOGGLE)}set noToggle(e){B(this,De.NO_TOGGLE,e)}get mediaDuration(){return w(this,o.MEDIA_DURATION)}set mediaDuration(e){P(this,o.MEDIA_DURATION,e)}get mediaCurrentTime(){return w(this,o.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){P(this,o.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){let e=this.getAttribute(o.MEDIA_SEEKABLE);if(e)return e.split(":").map(t=>+t)}set mediaSeekable(e){if(e==null){this.removeAttribute(o.MEDIA_SEEKABLE);return}this.setAttribute(o.MEDIA_SEEKABLE,e.join(":"))}update(){let e=_c(this);Fp(this),e!==Fs(this,Di).innerHTML&&(Fs(this,Di).innerHTML=e)}};Di=new WeakMap;d.customElements.get("media-time-display")||d.customElements.define("media-time-display",Ks);var Tc=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},ne=(i,e,t)=>(Tc(i,e,"read from private field"),t?t.call(i):e.get(i)),qe=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},ye=(i,e,t,a)=>(Tc(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Kp=(i,e,t,a)=>({set _(r){ye(i,e,r,t)},get _(){return ne(i,e,a)}}),Oi,_n,Ni,Ua,An,Tn,yn,Pi,Xt,kn,Sn=class{constructor(e,t,a){qe(this,Oi,void 0),qe(this,_n,void 0),qe(this,Ni,void 0),qe(this,Ua,void 0),qe(this,An,void 0),qe(this,Tn,void 0),qe(this,yn,void 0),qe(this,Pi,void 0),qe(this,Xt,0),qe(this,kn,(r=performance.now())=>{ye(this,Xt,requestAnimationFrame(ne(this,kn))),ye(this,Ua,performance.now()-ne(this,Ni));let n=1e3/this.fps;if(ne(this,Ua)>n){ye(this,Ni,r-ne(this,Ua)%n);let s=1e3/((r-ne(this,_n))/++Kp(this,An)._),l=(r-ne(this,Tn))/1e3/this.duration,u=ne(this,yn)+l*this.playbackRate;u-ne(this,Oi).valueAsNumber>0?ye(this,Pi,this.playbackRate/this.duration/s):(ye(this,Pi,.995*ne(this,Pi)),u=ne(this,Oi).valueAsNumber+ne(this,Pi)),this.callback(u)}}),ye(this,Oi,e),this.callback=t,this.fps=a}start(){ne(this,Xt)===0&&(ye(this,Ni,performance.now()),ye(this,_n,ne(this,Ni)),ye(this,An,0),ne(this,kn).call(this))}stop(){ne(this,Xt)!==0&&(cancelAnimationFrame(ne(this,Xt)),ye(this,Xt,0))}update({start:e,duration:t,playbackRate:a}){let r=e-ne(this,Oi).valueAsNumber,n=Math.abs(t-this.duration);(r>0||r<-.03||n>=.5)&&this.callback(e),ye(this,yn,e),ye(this,Tn,performance.now()),this.duration=t,this.playbackRate=a}};Oi=new WeakMap;_n=new WeakMap;Ni=new WeakMap;Ua=new WeakMap;An=new WeakMap;Tn=new WeakMap;yn=new WeakMap;Pi=new WeakMap;Xt=new WeakMap;kn=new WeakMap;var Zs=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},ie=(i,e,t)=>(Zs(i,e,"read from private field"),t?t.call(i):e.get(i)),oe=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Ze=(i,e,t,a)=>(Zs(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),de=(i,e,t)=>(Zs(i,e,"access private method"),t),Ui,Jt,Mn,Ha,Ln,Cn,Wa,$a,Bi,Hi,Ba,Qs,yc,Vs,Rn,zs,wn,Xs,xn,Js,Ys,kc,Fa,Dn,Gs,Sc,Vp="video not loaded, unknown time.",Yp=i=>{let e=i.range,t=Ht(+Cc(i)),a=Ht(+i.mediaSeekableEnd),r=t&&a?`${t} of ${a}`:Vp;e.setAttribute("aria-valuetext",r)},Ic=m.createElement("template");Ic.innerHTML=`
  <style>
    :host {
      --media-box-border-radius: 4px;
      --media-box-padding-left: 10px;
      --media-box-padding-right: 10px;
      --media-preview-border-radius: var(--media-box-border-radius);
      --media-box-arrow-offset: var(--media-box-border-radius);
      --_control-background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
      --_preview-background: var(--media-preview-background, var(--_control-background));

      
      contain: layout;
    }

    #buffered {
      background: var(--media-time-range-buffered-color, rgb(255 255 255 / .4));
      position: absolute;
      height: 100%;
      will-change: width;
    }

    #preview-rail,
    #current-rail {
      width: 100%;
      position: absolute;
      left: 0;
      bottom: 100%;
      pointer-events: none;
      will-change: transform;
    }

    [part~="box"] {
      width: min-content;
      
      position: absolute;
      bottom: 100%;
      flex-direction: column;
      align-items: center;
      transform: translateX(-50%);
    }

    [part~="current-box"] {
      display: var(--media-current-box-display, var(--media-box-display, flex));
      margin: var(--media-current-box-margin, var(--media-box-margin, 0 0 5px));
      visibility: hidden;
    }

    [part~="preview-box"] {
      display: var(--media-preview-box-display, var(--media-box-display, flex));
      margin: var(--media-preview-box-margin, var(--media-box-margin, 0 0 5px));
      transition-property: var(--media-preview-transition-property, visibility, opacity);
      transition-duration: var(--media-preview-transition-duration-out, .25s);
      transition-delay: var(--media-preview-transition-delay-out, 0s);
      visibility: hidden;
      opacity: 0;
    }

    :host(:is([${o.MEDIA_PREVIEW_IMAGE}], [${o.MEDIA_PREVIEW_TIME}])[dragging]) [part~="preview-box"] {
      transition-duration: var(--media-preview-transition-duration-in, .5s);
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      visibility: visible;
      opacity: 1;
    }

    @media (hover: hover) {
      :host(:is([${o.MEDIA_PREVIEW_IMAGE}], [${o.MEDIA_PREVIEW_TIME}]):hover) [part~="preview-box"] {
        transition-duration: var(--media-preview-transition-duration-in, .5s);
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
        opacity: 1;
      }
    }

    media-preview-thumbnail,
    ::slotted(media-preview-thumbnail) {
      visibility: hidden;
      
      transition: visibility 0s .25s;
      transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
      background: var(--media-preview-thumbnail-background, var(--_preview-background));
      box-shadow: var(--media-preview-thumbnail-box-shadow, 0 0 4px rgb(0 0 0 / .2));
      max-width: var(--media-preview-thumbnail-max-width, 180px);
      max-height: var(--media-preview-thumbnail-max-height, 160px);
      min-width: var(--media-preview-thumbnail-min-width, 120px);
      min-height: var(--media-preview-thumbnail-min-height, 80px);
      border: var(--media-preview-thumbnail-border);
      border-radius: var(--media-preview-thumbnail-border-radius,
        var(--media-preview-border-radius) var(--media-preview-border-radius) 0 0);
    }

    :host([${o.MEDIA_PREVIEW_IMAGE}][dragging]) media-preview-thumbnail,
    :host([${o.MEDIA_PREVIEW_IMAGE}][dragging]) ::slotted(media-preview-thumbnail) {
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      visibility: visible;
    }

    @media (hover: hover) {
      :host([${o.MEDIA_PREVIEW_IMAGE}]:hover) media-preview-thumbnail,
      :host([${o.MEDIA_PREVIEW_IMAGE}]:hover) ::slotted(media-preview-thumbnail) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
      }

      :host([${o.MEDIA_PREVIEW_TIME}]:hover) {
        --media-time-range-hover-display: block;
      }
    }

    media-preview-chapter-display,
    ::slotted(media-preview-chapter-display) {
      font-size: var(--media-font-size, 13px);
      line-height: 17px;
      min-width: 0;
      visibility: hidden;
      
      transition: min-width 0s, border-radius 0s, margin 0s, padding 0s, visibility 0s;
      transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
      background: var(--media-preview-chapter-background, var(--_preview-background));
      border-radius: var(--media-preview-chapter-border-radius,
        var(--media-preview-border-radius) var(--media-preview-border-radius)
        var(--media-preview-border-radius) var(--media-preview-border-radius));
      padding: var(--media-preview-chapter-padding, 3.5px 9px);
      margin: var(--media-preview-chapter-margin, 0 0 5px);
      text-shadow: var(--media-preview-chapter-text-shadow, 0 0 4px rgb(0 0 0 / .75));
    }

    :host([${o.MEDIA_PREVIEW_IMAGE}]) media-preview-chapter-display,
    :host([${o.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-chapter-display) {
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      border-radius: var(--media-preview-chapter-border-radius, 0);
      padding: var(--media-preview-chapter-padding, 3.5px 9px 0);
      margin: var(--media-preview-chapter-margin, 0);
      min-width: 100%;
    }

    media-preview-chapter-display[${o.MEDIA_PREVIEW_CHAPTER}],
    ::slotted(media-preview-chapter-display[${o.MEDIA_PREVIEW_CHAPTER}]) {
      visibility: visible;
    }

    media-preview-chapter-display:not([aria-valuetext]),
    ::slotted(media-preview-chapter-display:not([aria-valuetext])) {
      display: none;
    }

    media-preview-time-display,
    ::slotted(media-preview-time-display),
    media-time-display,
    ::slotted(media-time-display) {
      font-size: var(--media-font-size, 13px);
      line-height: 17px;
      min-width: 0;
      
      transition: min-width 0s, border-radius 0s;
      transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
      background: var(--media-preview-time-background, var(--_preview-background));
      border-radius: var(--media-preview-time-border-radius,
        var(--media-preview-border-radius) var(--media-preview-border-radius)
        var(--media-preview-border-radius) var(--media-preview-border-radius));
      padding: var(--media-preview-time-padding, 3.5px 9px);
      margin: var(--media-preview-time-margin, 0);
      text-shadow: var(--media-preview-time-text-shadow, 0 0 4px rgb(0 0 0 / .75));
      transform: translateX(min(
        max(calc(50% - var(--_box-width) / 2),
        calc(var(--_box-shift, 0))),
        calc(var(--_box-width) / 2 - 50%)
      ));
    }

    :host([${o.MEDIA_PREVIEW_IMAGE}]) media-preview-time-display,
    :host([${o.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-time-display) {
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      border-radius: var(--media-preview-time-border-radius,
        0 0 var(--media-preview-border-radius) var(--media-preview-border-radius));
      min-width: 100%;
    }

    :host([${o.MEDIA_PREVIEW_TIME}]:hover) {
      --media-time-range-hover-display: block;
    }

    [part~="arrow"],
    ::slotted([part~="arrow"]) {
      display: var(--media-box-arrow-display, inline-block);
      transform: translateX(min(
        max(calc(50% - var(--_box-width) / 2 + var(--media-box-arrow-offset)),
        calc(var(--_box-shift, 0))),
        calc(var(--_box-width) / 2 - 50% - var(--media-box-arrow-offset))
      ));
      
      border-color: transparent;
      border-top-color: var(--media-box-arrow-background, var(--_control-background));
      border-width: var(--media-box-arrow-border-width,
        var(--media-box-arrow-height, 5px) var(--media-box-arrow-width, 6px) 0);
      border-style: solid;
      justify-content: center;
      height: 0;
    }
  </style>
  <div id="preview-rail">
    <slot name="preview" part="box preview-box">
      <media-preview-thumbnail></media-preview-thumbnail>
      <media-preview-chapter-display></media-preview-chapter-display>
      <media-preview-time-display></media-preview-time-display>
      <slot name="preview-arrow"><div part="arrow"></div></slot>
    </slot>
  </div>
  <div id="current-rail">
    <slot name="current" part="box current-box">
      
    </slot>
  </div>
`;var In=(i,e=i.mediaCurrentTime)=>{let t=Number.isFinite(i.mediaSeekableStart)?i.mediaSeekableStart:0,a=Number.isFinite(i.mediaDuration)?i.mediaDuration:i.mediaSeekableEnd;if(Number.isNaN(a))return 0;let r=(e-t)/(a-t);return Math.max(0,Math.min(r,1))},Cc=(i,e=i.range.valueAsNumber)=>{let t=Number.isFinite(i.mediaSeekableStart)?i.mediaSeekableStart:0,a=Number.isFinite(i.mediaDuration)?i.mediaDuration:i.mediaSeekableEnd;return Number.isNaN(a)?0:e*(a-t)+t},qs=class extends Qt{constructor(){super(),oe(this,Hi),oe(this,Qs),oe(this,Rn),oe(this,wn),oe(this,xn),oe(this,Ys),oe(this,Fa),oe(this,Gs),oe(this,Ui,void 0),oe(this,Jt,void 0),oe(this,Mn,void 0),oe(this,Ha,void 0),oe(this,Ln,void 0),oe(this,Cn,void 0),oe(this,Wa,void 0),oe(this,$a,void 0),oe(this,Bi,void 0),oe(this,Vs,a=>{this.dragging||(Ei(a)&&(this.range.valueAsNumber=a),this.updateBar())}),this.container.appendChild(Ic.content.cloneNode(!0)),this.shadowRoot.querySelector("#track").insertAdjacentHTML("afterbegin",'<div id="buffered" part="buffered"></div>'),Ze(this,Mn,this.shadowRoot.querySelectorAll('[part~="box"]')),Ze(this,Ln,this.shadowRoot.querySelector('[part~="preview-box"]')),Ze(this,Cn,this.shadowRoot.querySelector('[part~="current-box"]'));let t=getComputedStyle(this);Ze(this,Wa,parseInt(t.getPropertyValue("--media-box-padding-left"))),Ze(this,$a,parseInt(t.getPropertyValue("--media-box-padding-right"))),Ze(this,Jt,new Sn(this.range,ie(this,Vs),60))}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PAUSED,o.MEDIA_DURATION,o.MEDIA_SEEKABLE,o.MEDIA_CURRENT_TIME,o.MEDIA_PREVIEW_IMAGE,o.MEDIA_PREVIEW_TIME,o.MEDIA_PREVIEW_CHAPTER,o.MEDIA_BUFFERED,o.MEDIA_PLAYBACK_RATE,o.MEDIA_LOADING,o.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute("aria-label",V.SEEK()),de(this,Hi,Ba).call(this),Ze(this,Ui,this.getRootNode()),(e=ie(this,Ui))==null||e.addEventListener("transitionstart",this)}disconnectedCallback(){var e;super.disconnectedCallback(),de(this,Hi,Ba).call(this),(e=ie(this,Ui))==null||e.removeEventListener("transitionstart",this),Ze(this,Ui,null)}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),t!=a&&(e===o.MEDIA_CURRENT_TIME||e===o.MEDIA_PAUSED||e===o.MEDIA_ENDED||e===o.MEDIA_LOADING||e===o.MEDIA_DURATION||e===o.MEDIA_SEEKABLE?(ie(this,Jt).update({start:In(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),de(this,Hi,Ba).call(this),Yp(this)):e===o.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===o.MEDIA_DURATION||e===o.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=ie(this,Bi),this.updateBar()))}get mediaChaptersCues(){return ie(this,Bi)}set mediaChaptersCues(e){var t;Ze(this,Bi,e),this.updateSegments((t=ie(this,Bi))==null?void 0:t.map(a=>({start:In(this,a.startTime),end:In(this,a.endTime)})))}get mediaPaused(){return H(this,o.MEDIA_PAUSED)}set mediaPaused(e){B(this,o.MEDIA_PAUSED,e)}get mediaLoading(){return H(this,o.MEDIA_LOADING)}set mediaLoading(e){B(this,o.MEDIA_LOADING,e)}get mediaDuration(){return w(this,o.MEDIA_DURATION)}set mediaDuration(e){P(this,o.MEDIA_DURATION,e)}get mediaCurrentTime(){return w(this,o.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){P(this,o.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return w(this,o.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){P(this,o.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){let e=this.getAttribute(o.MEDIA_BUFFERED);return e?e.split(" ").map(t=>t.split(":").map(a=>+a)):[]}set mediaBuffered(e){if(!e){this.removeAttribute(o.MEDIA_BUFFERED);return}let t=e.map(a=>a.join(":")).join(" ");this.setAttribute(o.MEDIA_BUFFERED,t)}get mediaSeekable(){let e=this.getAttribute(o.MEDIA_SEEKABLE);if(e)return e.split(":").map(t=>+t)}set mediaSeekable(e){if(e==null){this.removeAttribute(o.MEDIA_SEEKABLE);return}this.setAttribute(o.MEDIA_SEEKABLE,e.join(":"))}get mediaSeekableEnd(){var e;let[,t=this.mediaDuration]=(e=this.mediaSeekable)!=null?e:[];return t}get mediaSeekableStart(){var e;let[t=0]=(e=this.mediaSeekable)!=null?e:[];return t}get mediaPreviewImage(){return x(this,o.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){M(this,o.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return w(this,o.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){P(this,o.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return H(this,o.MEDIA_ENDED)}set mediaEnded(e){B(this,o.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){var e;let t=this.mediaBuffered;if(!t.length)return;let a;if(this.mediaEnded)a=1;else{let n=this.mediaCurrentTime,[,s=this.mediaSeekableStart]=(e=t.find(([l,u])=>l<=n&&n<=u))!=null?e:[];a=In(this,s)}let{style:r}=W(this.shadowRoot,"#buffered");r.setProperty("width",`${a*100}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector('slot[name="current"]').assignedElements().length)return;let t=W(this.shadowRoot,"#current-rail"),a=W(this.shadowRoot,'[part~="current-box"]'),r=de(this,Rn,zs).call(this,ie(this,Cn)),n=de(this,wn,Xs).call(this,r,this.range.valueAsNumber),s=de(this,xn,Js).call(this,r,this.range.valueAsNumber);t.style.transform=`translateX(${n})`,t.style.setProperty("--_range-width",`${r.range.width}`),a.style.setProperty("--_box-shift",`${s}`),a.style.setProperty("--_box-width",`${r.box.width}px`),a.style.setProperty("visibility","initial")}handleEvent(e){switch(super.handleEvent(e),e.type){case"input":de(this,Gs,Sc).call(this);break;case"pointermove":de(this,Ys,kc).call(this,e);break;case"pointerup":case"pointerleave":de(this,Fa,Dn).call(this,null);break;case"transitionstart":ce(e.target,this)&&setTimeout(()=>de(this,Hi,Ba).call(this),0);break}}};Ui=new WeakMap;Jt=new WeakMap;Mn=new WeakMap;Ha=new WeakMap;Ln=new WeakMap;Cn=new WeakMap;Wa=new WeakMap;$a=new WeakMap;Bi=new WeakMap;Hi=new WeakSet;Ba=function(){de(this,Qs,yc).call(this)?ie(this,Jt).start():ie(this,Jt).stop()};Qs=new WeakSet;yc=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&$d(this)};Vs=new WeakMap;Rn=new WeakSet;zs=function(i){var e;let a=((e=this.getAttribute("bounds")?Ue(this,`#${this.getAttribute("bounds")}`):this.parentElement)!=null?e:this).getBoundingClientRect(),r=this.range.getBoundingClientRect(),n=i.offsetWidth,s=-(r.left-a.left-n/2),l=a.right-r.left-n/2;return{box:{width:n,min:s,max:l},bounds:a,range:r}};wn=new WeakSet;Xs=function(i,e){let t=`${e*100}%`,{width:a,min:r,max:n}=i.box;if(!a)return t;if(Number.isNaN(r)||(t=`max(${`calc(1 / var(--_range-width) * 100 * ${r}% + var(--media-box-padding-left))`}, ${t})`),!Number.isNaN(n)){let l=`calc(1 / var(--_range-width) * 100 * ${n}% - var(--media-box-padding-right))`;t=`min(${t}, ${l})`}return t};xn=new WeakSet;Js=function(i,e){let{width:t,min:a,max:r}=i.box,n=e*i.range.width;if(n<a+ie(this,Wa)){let s=i.range.left-i.bounds.left-ie(this,Wa);return`${n-t/2+s}px`}if(n>r-ie(this,$a)){let s=i.bounds.right-i.range.right-ie(this,$a);return`${n+t/2-s-i.range.width}px`}return 0};Ys=new WeakSet;kc=function(i){let e=[...ie(this,Mn)].some(b=>i.composedPath().includes(b));if(!this.dragging&&(e||!i.composedPath().includes(this))){de(this,Fa,Dn).call(this,null);return}let t=this.mediaSeekableEnd;if(!t)return;let a=W(this.shadowRoot,"#preview-rail"),r=W(this.shadowRoot,'[part~="preview-box"]'),n=de(this,Rn,zs).call(this,ie(this,Ln)),s=(i.clientX-n.range.left)/n.range.width;s=Math.max(0,Math.min(1,s));let l=de(this,wn,Xs).call(this,n,s),u=de(this,xn,Js).call(this,n,s);a.style.transform=`translateX(${l})`,a.style.setProperty("--_range-width",`${n.range.width}`),r.style.setProperty("--_box-shift",`${u}`),r.style.setProperty("--_box-width",`${n.box.width}px`);let c=Math.round(ie(this,Ha))-Math.round(s*t);Math.abs(c)<1&&s>.01&&s<.99||(Ze(this,Ha,s*t),de(this,Fa,Dn).call(this,ie(this,Ha)))};Fa=new WeakSet;Dn=function(i){this.dispatchEvent(new d.CustomEvent(p.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:i}))};Gs=new WeakSet;Sc=function(){ie(this,Jt).stop();let i=Cc(this);this.dispatchEvent(new d.CustomEvent(p.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:i}))};d.customElements.get("media-time-range")||d.customElements.define("media-time-range",qs);var Wi={PLACEMENT:"placement",BOUNDS:"bounds"},Mc=m.createElement("template");Mc.innerHTML=`
  <style>
    :host {
      --_tooltip-background-color: var(--media-tooltip-background-color, var(--media-secondary-color, rgba(20, 20, 30, .7)));
      --_tooltip-background: var(--media-tooltip-background, var(--_tooltip-background-color));
      --_tooltip-arrow-half-width: calc(var(--media-tooltip-arrow-width, 12px) / 2);
      --_tooltip-arrow-height: var(--media-tooltip-arrow-height, 5px);
      --_tooltip-arrow-background: var(--media-tooltip-arrow-color, var(--_tooltip-background-color));
      position: relative;
      pointer-events: none;
      display: var(--media-tooltip-display, inline-flex);
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      z-index: var(--media-tooltip-z-index, 1);
      background: var(--_tooltip-background);
      color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
      font: var(--media-font,
        var(--media-font-weight, 400)
        var(--media-font-size, 13px) /
        var(--media-text-content-height, var(--media-control-height, 18px))
        var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
      padding: var(--media-tooltip-padding, .35em .7em);
      border: var(--media-tooltip-border, none);
      border-radius: var(--media-tooltip-border-radius, 5px);
      filter: var(--media-tooltip-filter, drop-shadow(0 0 4px rgba(0, 0, 0, .2)));
      white-space: var(--media-tooltip-white-space, nowrap);
    }

    :host([hidden]) {
      display: none;
    }

    img, svg {
      display: inline-block;
    }

    #arrow {
      position: absolute;
      width: 0px;
      height: 0px;
      border-style: solid;
      display: var(--media-tooltip-arrow-display, block);
    }

    :host(:not([placement])),
    :host([placement="top"]) {
      position: absolute;
      bottom: calc(100% + var(--media-tooltip-distance, 12px));
      left: 50%;
      transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
    }
    :host(:not([placement])) #arrow,
    :host([placement="top"]) #arrow {
      top: 100%;
      left: 50%;
      border-width: var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width);
      border-color: var(--_tooltip-arrow-background) transparent transparent transparent;
      transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
    }

    :host([placement="right"]) {
      position: absolute;
      left: calc(100% + var(--media-tooltip-distance, 12px));
      top: 50%;
      transform: translate(0, -50%);
    }
    :host([placement="right"]) #arrow {
      top: 50%;
      right: 100%;
      border-width: var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0;
      border-color: transparent var(--_tooltip-arrow-background) transparent transparent;
      transform: translate(0, -50%);
    }

    :host([placement="bottom"]) {
      position: absolute;
      top: calc(100% + var(--media-tooltip-distance, 12px));
      left: 50%;
      transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
    }
    :host([placement="bottom"]) #arrow {
      bottom: 100%;
      left: 50%;
      border-width: 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width);
      border-color: transparent transparent var(--_tooltip-arrow-background) transparent;
      transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
    }

    :host([placement="left"]) {
      position: absolute;
      right: calc(100% + var(--media-tooltip-distance, 12px));
      top: 50%;
      transform: translate(0, -50%);
    }
    :host([placement="left"]) #arrow {
      top: 50%;
      left: 100%;
      border-width: var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height);
      border-color: transparent transparent transparent var(--_tooltip-arrow-background);
      transform: translate(0, -50%);
    }
    
    :host([placement="none"]) #arrow {
      display: none;
    }

  </style>
  <slot></slot>
  <div id="arrow"></div>
`;var js=class extends d.HTMLElement{constructor(){if(super(),this.updateXOffset=()=>{var e;let t=this.placement;if(t==="left"||t==="right"){this.style.removeProperty("--media-tooltip-offset-x");return}let a=getComputedStyle(this),r=(e=Ue(this,"#"+this.bounds))!=null?e:Z(this);if(!r)return;let{x:n,width:s}=r.getBoundingClientRect(),{x:l,width:u}=this.getBoundingClientRect(),c=l+u,b=n+s,g=a.getPropertyValue("--media-tooltip-offset-x"),v=g?parseFloat(g.replace("px","")):0,f=a.getPropertyValue("--media-tooltip-container-margin"),L=f?parseFloat(f.replace("px","")):0,A=l-n+v-L,T=c-b+v+L;if(A<0){this.style.setProperty("--media-tooltip-offset-x",`${A}px`);return}if(T>0){this.style.setProperty("--media-tooltip-offset-x",`${T}px`);return}this.style.removeProperty("--media-tooltip-offset-x")},this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Mc.content.cloneNode(!0))),this.arrowEl=this.shadowRoot.querySelector("#arrow"),Object.prototype.hasOwnProperty.call(this,"placement")){let e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[Wi.PLACEMENT,Wi.BOUNDS]}get placement(){return x(this,Wi.PLACEMENT)}set placement(e){M(this,Wi.PLACEMENT,e)}get bounds(){return x(this,Wi.BOUNDS)}set bounds(e){M(this,Wi.BOUNDS,e)}};d.customElements.get("media-tooltip")||d.customElements.define("media-tooltip",js);var Gp=1,qp=i=>i.mediaMuted?0:i.mediaVolume,Zp=i=>`${Math.round(i*100)}%`,el=class extends Qt{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_VOLUME,o.MEDIA_MUTED,o.MEDIA_VOLUME_UNAVAILABLE]}constructor(){super(),this.range.addEventListener("input",()=>{let e=this.range.value,t=new d.CustomEvent(p.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)})}connectedCallback(){super.connectedCallback(),this.range.setAttribute("aria-label",V.VOLUME())}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),(e===o.MEDIA_VOLUME||e===o.MEDIA_MUTED)&&(this.range.valueAsNumber=qp(this),this.range.setAttribute("aria-valuetext",Zp(this.range.valueAsNumber)),this.updateBar())}get mediaVolume(){return w(this,o.MEDIA_VOLUME,Gp)}set mediaVolume(e){P(this,o.MEDIA_VOLUME,e)}get mediaMuted(){return H(this,o.MEDIA_MUTED)}set mediaMuted(e){B(this,o.MEDIA_MUTED,e)}get mediaVolumeUnavailable(){return x(this,o.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(e){M(this,o.MEDIA_VOLUME_UNAVAILABLE,e)}};d.customElements.get("media-volume-range")||d.customElements.define("media-volume-range",el);var E=ph(require("@mux/mux-video")),S=require("@mux/playback-core");var Hc=require("@mux/mux-video");var Oc=require("@mux/playback-core");var ti=require("@mux/playback-core");function Lc(i){let e="";return Object.entries(i).forEach(([t,a])=>{a!=null&&(e+=`${On(t)}: ${a}; `)}),e?e.trim():void 0}function On(i){return i.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}function Nn(i){return i.replace(/[-_]([a-z])/g,(e,t)=>t.toUpperCase())}function fe(i){if(i==null)return;let e=+i;return Number.isNaN(e)?void 0:e}function tl(i){let e=Qp(i).toString();return e?"?"+e:""}function Qp(i){let e={};for(let t in i)i[t]!=null&&(e[t]=i[t]);return new URLSearchParams(e)}var il=(i,e)=>!i||!e?!1:i.contains(e)?!0:il(i,e.getRootNode().host);var Rc="mux.com",zp=()=>{try{return"3.1.0"}catch{}return"UNKNOWN"},Xp=zp(),Un=()=>Xp,wc=(i,{token:e,customDomain:t=Rc,thumbnailTime:a,programTime:r}={})=>{var l;let n=e==null?a:void 0,{aud:s}=(l=(0,ti.parseJwt)(e))!=null?l:{};if(!(e&&s!=="t"))return`https://image.${t}/${i}/thumbnail.webp${tl({token:e,time:n,program_time:r})}`},xc=(i,{token:e,customDomain:t=Rc,programStartTime:a,programEndTime:r}={})=>{var s;let{aud:n}=(s=(0,ti.parseJwt)(e))!=null?s:{};if(!(e&&n!=="s"))return`https://image.${t}/${i}/storyboard.vtt${tl({token:e,format:"webp",program_start_time:a,program_end_time:r})}`},Ka=i=>{if(i){if([ti.StreamTypes.LIVE,ti.StreamTypes.ON_DEMAND].includes(i))return i;if(i!=null&&i.includes("live"))return ti.StreamTypes.LIVE}};var Jp={crossorigin:"crossOrigin",playsinline:"playsInline"};function Dc(i){var e;return(e=Jp[i])!=null?e:Nn(i)}var jt,ei,me,Pn=class{constructor(e,t){X(this,jt,void 0);X(this,ei,void 0);X(this,me,[]);Se(this,jt,e),Se(this,ei,t)}[Symbol.iterator](){return R(this,me).values()}get length(){return R(this,me).length}get value(){var e;return(e=R(this,me).join(" "))!=null?e:""}set value(e){var t;e!==this.value&&(Se(this,me,[]),this.add(...(t=e==null?void 0:e.split(" "))!=null?t:[]))}toString(){return this.value}item(e){return R(this,me)[e]}values(){return R(this,me).values()}keys(){return R(this,me).keys()}forEach(e){R(this,me).forEach(e)}add(...e){var t,a;e.forEach(r=>{this.contains(r)||R(this,me).push(r)}),!(this.value===""&&!((t=R(this,jt))!=null&&t.hasAttribute(`${R(this,ei)}`)))&&((a=R(this,jt))==null||a.setAttribute(`${R(this,ei)}`,`${this.value}`))}remove(...e){var t;e.forEach(a=>{R(this,me).splice(R(this,me).indexOf(a),1)}),(t=R(this,jt))==null||t.setAttribute(`${R(this,ei)}`,`${this.value}`)}contains(e){return R(this,me).includes(e)}toggle(e,t){return typeof t!="undefined"?t?(this.add(e),!0):(this.remove(e),!1):this.contains(e)?(this.remove(e),!1):(this.add(e),!0)}replace(e,t){this.remove(e),this.add(t)}};jt=new WeakMap,ei=new WeakMap,me=new WeakMap;var Nc=`[mux-player ${Un()}]`;function Qe(...i){console.warn(Nc,...i)}function Ee(...i){console.error(Nc,...i)}function al(i){var t;let e=(t=i.message)!=null?t:"";i.context&&(e+=` ${i.context}`),i.file&&(e+=` ${(0,Oc.i18n)("Read more: ")}
https://github.com/muxinc/elements/blob/main/errors/${i.file}`),Qe(e)}var ue={AUTOPLAY:"autoplay",CROSSORIGIN:"crossorigin",LOOP:"loop",MUTED:"muted",PLAYSINLINE:"playsinline",PRELOAD:"preload"},ii={VOLUME:"volume",PLAYBACKRATE:"playbackrate",MUTED:"muted"},Uc=Object.freeze({length:0,start(i){let e=i>>>0;if(e>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${e}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(i){let e=i>>>0;if(e>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${e}) is greater than or equal to the maximum bound (${this.length}).`);return 0}}),jp=Hc.VideoEvents.filter(i=>i!=="error"),ev=Object.values(ue).filter(i=>![ue.PLAYSINLINE].includes(i)),tv=Object.values(ii),$i,rl=class extends Q.HTMLElement{constructor(){super();X(this,$i,new WeakMap);let t=r=>{for(let n of r)n.type==="childList"&&(n.removedNodes.forEach(s=>{var l;(l=R(this,$i).get(s))==null||l.remove()}),n.addedNodes.forEach(s=>{var u;let l=s;l!=null&&l.slot||(u=this.media)==null||u.append(Bc(R(this,$i),s))}))};new MutationObserver(t).observe(this,{childList:!0,subtree:!0})}static get observedAttributes(){return[...ev,...tv]}init(){this.querySelectorAll(":scope > :not([slot])").forEach(t=>{var a;(a=this.media)==null||a.append(Bc(R(this,$i),t))}),jp.forEach(t=>{var a;(a=this.media)==null||a.addEventListener(t,r=>{this.dispatchEvent(new Event(r.type))})})}attributeChangedCallback(t,a,r){var n,s;switch(t){case ii.MUTED:{this.media&&(this.media.muted=r!=null,this.media.defaultMuted=r!=null);return}case ii.VOLUME:{let l=(n=fe(r))!=null?n:1;this.media&&(this.media.volume=l);return}case ii.PLAYBACKRATE:{let l=(s=fe(r))!=null?s:1;this.media&&(this.media.playbackRate=l,this.media.defaultPlaybackRate=l);return}}}play(){var t,a;return(a=(t=this.media)==null?void 0:t.play())!=null?a:Promise.reject()}pause(){var t;(t=this.media)==null||t.pause()}load(){var t;(t=this.media)==null||t.load()}requestCast(t){var a;return(a=this.media)==null?void 0:a.requestCast(t)}get media(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("mux-video")}get audioTracks(){return this.media.audioTracks}get videoTracks(){return this.media.videoTracks}get audioRenditions(){return this.media.audioRenditions}get videoRenditions(){return this.media.videoRenditions}get paused(){var t,a;return(a=(t=this.media)==null?void 0:t.paused)!=null?a:!0}get duration(){var t,a;return(a=(t=this.media)==null?void 0:t.duration)!=null?a:NaN}get ended(){var t,a;return(a=(t=this.media)==null?void 0:t.ended)!=null?a:!1}get buffered(){var t,a;return(a=(t=this.media)==null?void 0:t.buffered)!=null?a:Uc}get seekable(){var t,a;return(a=(t=this.media)==null?void 0:t.seekable)!=null?a:Uc}get readyState(){var t,a;return(a=(t=this.media)==null?void 0:t.readyState)!=null?a:0}get videoWidth(){var t,a;return(a=(t=this.media)==null?void 0:t.videoWidth)!=null?a:0}get videoHeight(){var t,a;return(a=(t=this.media)==null?void 0:t.videoHeight)!=null?a:0}get currentSrc(){var t,a;return(a=(t=this.media)==null?void 0:t.currentSrc)!=null?a:""}get currentTime(){var t,a;return(a=(t=this.media)==null?void 0:t.currentTime)!=null?a:0}set currentTime(t){this.media&&(this.media.currentTime=Number(t))}get volume(){var t,a;return(a=(t=this.media)==null?void 0:t.volume)!=null?a:1}set volume(t){this.media&&(this.media.volume=Number(t))}get playbackRate(){var t,a;return(a=(t=this.media)==null?void 0:t.playbackRate)!=null?a:1}set playbackRate(t){this.media&&(this.media.playbackRate=Number(t))}get defaultPlaybackRate(){var t;return(t=fe(this.getAttribute(ii.PLAYBACKRATE)))!=null?t:1}set defaultPlaybackRate(t){t!=null?this.setAttribute(ii.PLAYBACKRATE,`${t}`):this.removeAttribute(ii.PLAYBACKRATE)}get crossOrigin(){return Va(this,ue.CROSSORIGIN)}set crossOrigin(t){this.setAttribute(ue.CROSSORIGIN,`${t}`)}get autoplay(){return Va(this,ue.AUTOPLAY)!=null}set autoplay(t){t?this.setAttribute(ue.AUTOPLAY,typeof t=="string"?t:""):this.removeAttribute(ue.AUTOPLAY)}get loop(){return Va(this,ue.LOOP)!=null}set loop(t){t?this.setAttribute(ue.LOOP,""):this.removeAttribute(ue.LOOP)}get muted(){var t,a;return(a=(t=this.media)==null?void 0:t.muted)!=null?a:!1}set muted(t){this.media&&(this.media.muted=!!t)}get defaultMuted(){return Va(this,ue.MUTED)!=null}set defaultMuted(t){t?this.setAttribute(ue.MUTED,""):this.removeAttribute(ue.MUTED)}get playsInline(){return Va(this,ue.PLAYSINLINE)!=null}set playsInline(t){Ee("playsInline is set to true by default and is not currently supported as a setter.")}get preload(){return this.media?this.media.preload:this.getAttribute("preload")}set preload(t){["","none","metadata","auto"].includes(t)?this.setAttribute(ue.PRELOAD,t):this.removeAttribute(ue.PRELOAD)}};$i=new WeakMap;function Va(i,e){return i.media?i.media.getAttribute(e):i.getAttribute(e)}function Bc(i,e){let t=i.get(e);return t||(t=e.cloneNode(),i.set(e,t)),t}var nl=rl;var Vc=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},y=(i,e,t)=>(Vc(i,e,"read from private field"),t?t.call(i):e.get(i)),ze=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},mt=(i,e,t,a)=>(Vc(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Fi,Bn,ai,Ya,Lt,Rt,wt,ri,Ki,Hn,Oe,Wc=1,$c=0,iv=1,av={processCallback(i,e,t){if(t){for(let[a,r]of e)if(a in t){let n=t[a];typeof n=="boolean"&&r instanceof he&&typeof r.element[r.attributeName]=="boolean"?r.booleanValue=n:typeof n=="function"&&r instanceof he?r.element[r.attributeName]=n:r.value=n}}}},ht=class extends d.DocumentFragment{constructor(e,t,a=av){var r;super(),ze(this,Fi,void 0),ze(this,Bn,void 0),this.append(e.content.cloneNode(!0)),mt(this,Fi,Yc(this)),mt(this,Bn,a),(r=a.createCallback)==null||r.call(a,this,y(this,Fi),t),a.processCallback(this,y(this,Fi),t)}update(e){y(this,Bn).processCallback(this,y(this,Fi),e)}};Fi=new WeakMap;Bn=new WeakMap;var Yc=(i,e=[])=>{let t,a;for(let r of i.attributes||[])if(r.value.includes("{{")){let n=new ol;for([t,a]of Kc(r.value))if(!t)n.append(a);else{let s=new he(i,r.name,r.namespaceURI);n.append(s),e.push([a,s])}r.value=n.toString()}for(let r of i.childNodes)if(r.nodeType===Wc&&!(r instanceof HTMLTemplateElement))Yc(r,e);else{let n=r.data;if(r.nodeType===Wc||n.includes("{{")){let s=[];if(n)for([t,a]of Kc(n))if(!t)s.push(new Text(a));else{let l=new pt(i);s.push(l),e.push([a,l])}else if(r instanceof HTMLTemplateElement){let l=new Ga(i,r);s.push(l),e.push([l.expression,l])}r.replaceWith(...s.flatMap(l=>l.replacementNodes||[l]))}}return e},Fc={},Kc=i=>{let e="",t=0,a=Fc[i],r=0,n;if(a)return a;for(a=[];n=i[r];r++)n==="{"&&i[r+1]==="{"&&i[r-1]!=="\\"&&i[r+2]&&++t==1?(e&&a.push([$c,e]),e="",r++):n==="}"&&i[r+1]==="}"&&i[r-1]!=="\\"&&!--t?(a.push([iv,e.trim()]),e="",r++):e+=n||"";return e&&a.push([$c,(t>0?"{{":"")+e]),Fc[i]=a},rv=11,Wn=class{get value(){return""}set value(e){}toString(){return this.value}},Gc=new WeakMap,ol=class{constructor(){ze(this,ai,[])}[Symbol.iterator](){return y(this,ai).values()}get length(){return y(this,ai).length}item(e){return y(this,ai)[e]}append(...e){for(let t of e)t instanceof he&&Gc.set(t,this),y(this,ai).push(t)}toString(){return y(this,ai).join("")}};ai=new WeakMap;var he=class extends Wn{constructor(e,t,a){super(),ze(this,ri),ze(this,Ya,""),ze(this,Lt,void 0),ze(this,Rt,void 0),ze(this,wt,void 0),mt(this,Lt,e),mt(this,Rt,t),mt(this,wt,a)}get attributeName(){return y(this,Rt)}get attributeNamespace(){return y(this,wt)}get element(){return y(this,Lt)}get value(){return y(this,Ya)}set value(e){y(this,Ya)!==e&&(mt(this,Ya,e),!y(this,ri,Ki)||y(this,ri,Ki).length===1?e==null?y(this,Lt).removeAttributeNS(y(this,wt),y(this,Rt)):y(this,Lt).setAttributeNS(y(this,wt),y(this,Rt),e):y(this,Lt).setAttributeNS(y(this,wt),y(this,Rt),y(this,ri,Ki).toString()))}get booleanValue(){return y(this,Lt).hasAttributeNS(y(this,wt),y(this,Rt))}set booleanValue(e){if(!y(this,ri,Ki)||y(this,ri,Ki).length===1)this.value=e?"":null;else throw new DOMException("Value is not fully templatized")}};Ya=new WeakMap;Lt=new WeakMap;Rt=new WeakMap;wt=new WeakMap;ri=new WeakSet;Ki=function(){return Gc.get(this)};var pt=class extends Wn{constructor(e,t){super(),ze(this,Hn,void 0),ze(this,Oe,void 0),mt(this,Hn,e),mt(this,Oe,t?[...t]:[new Text])}get replacementNodes(){return y(this,Oe)}get parentNode(){return y(this,Hn)}get nextSibling(){return y(this,Oe)[y(this,Oe).length-1].nextSibling}get previousSibling(){return y(this,Oe)[0].previousSibling}get value(){return y(this,Oe).map(e=>e.textContent).join("")}set value(e){this.replace(e)}replace(...e){let t=e.flat().flatMap(a=>a==null?[new Text]:a.forEach?[...a]:a.nodeType===rv?[...a.childNodes]:a.nodeType?[a]:[new Text(a)]);t.length||t.push(new Text),mt(this,Oe,nv(y(this,Oe)[0].parentNode,y(this,Oe),t,this.nextSibling))}};Hn=new WeakMap;Oe=new WeakMap;var Ga=class extends pt{constructor(e,t){let a=t.getAttribute("directive")||t.getAttribute("type"),r=t.getAttribute("expression")||t.getAttribute(a)||"";r.startsWith("{{")&&(r=r.trim().slice(2,-2).trim()),super(e),this.expression=r,this.template=t,this.directive=a}};function nv(i,e,t,a=null){let r=0,n,s,l,u=t.length,c=e.length;for(;r<u&&r<c&&e[r]==t[r];)r++;for(;r<u&&r<c&&t[u-1]==e[c-1];)a=t[--c,--u];if(r==c)for(;r<u;)i.insertBefore(t[r++],a);if(r==u)for(;r<c;)i.removeChild(e[r++]);else{for(n=e[r];r<u;)l=t[r++],s=n?n.nextSibling:a,n==l?n=s:r<u&&t[r]==s?(i.replaceChild(l,n),n=s):i.insertBefore(l,n);for(;n!=a;)s=n.nextSibling,i.removeChild(n),n=s}return t}var qc={string:i=>String(i)},Fn=class{constructor(e){this.template=e,this.state=void 0}},ni=new WeakMap,oi=new WeakMap,sl={partial:(i,e)=>{e[i.expression]=new Fn(i.template)},if:(i,e)=>{var t;if(Qc(i.expression,e))if(ni.get(i)!==i.template){ni.set(i,i.template);let a=new ht(i.template,e,Kn);i.replace(a),oi.set(i,a)}else(t=oi.get(i))==null||t.update(e);else i.replace(""),ni.delete(i),oi.delete(i)}},ov=Object.keys(sl),Kn={processCallback(i,e,t){var a,r;if(t)for(let[n,s]of e){if(s instanceof Ga){if(!s.directive){let u=ov.find(c=>s.template.hasAttribute(c));u&&(s.directive=u,s.expression=s.template.getAttribute(u))}(a=sl[s.directive])==null||a.call(sl,s,t);continue}let l=Qc(n,t);if(l instanceof Fn){ni.get(s)!==l.template?(ni.set(s,l.template),l=new ht(l.template,l.state,Kn),s.value=l,oi.set(s,l)):(r=oi.get(s))==null||r.update(l.state);continue}l?(s instanceof he&&s.attributeName.startsWith("aria-")&&(l=String(l)),s instanceof he?typeof l=="boolean"?s.booleanValue=l:typeof l=="function"?s.element[s.attributeName]=l:s.value=l:(s.value=l,ni.delete(s),oi.delete(s))):s instanceof he?s.value=void 0:(s.value=void 0,ni.delete(s),oi.delete(s))}}},Zc={"!":i=>!i,"!!":i=>!!i,"==":(i,e)=>i==e,"!=":(i,e)=>i!=e,">":(i,e)=>i>e,">=":(i,e)=>i>=e,"<":(i,e)=>i<e,"<=":(i,e)=>i<=e,"??":(i,e)=>i!=null?i:e,"|":(i,e)=>{var t;return(t=qc[e])==null?void 0:t.call(qc,i)}};function sv(i){return lv(i,{boolean:/true|false/,number:/-?\d+\.?\d*/,string:/(["'])((?:\\.|[^\\])*?)\1/,operator:/[!=><][=!]?|\?\?|\|/,ws:/\s+/,param:/[$a-z_][$\w]*/i}).filter(({type:e})=>e!=="ws")}function Qc(i,e={}){var t,a,r,n,s,l,u;let c=sv(i);if(c.length===0||c.some(({type:b})=>!b))return qa(i);if(((t=c[0])==null?void 0:t.token)===">"){let b=e[(a=c[1])==null?void 0:a.token];if(!b)return qa(i);let g={...e};b.state=g;let v=c.slice(2);for(let f=0;f<v.length;f+=3){let L=(r=v[f])==null?void 0:r.token,A=(n=v[f+1])==null?void 0:n.token,T=(s=v[f+2])==null?void 0:s.token;L&&A==="="&&(g[L]=Za(T,e))}return b}if(c.length===1)return $n(c[0])?Za(c[0].token,e):qa(i);if(c.length===2){let b=(l=c[0])==null?void 0:l.token,g=Zc[b];if(!g||!$n(c[1]))return qa(i);let v=Za(c[1].token,e);return g(v)}if(c.length===3){let b=(u=c[1])==null?void 0:u.token,g=Zc[b];if(!g||!$n(c[0])||!$n(c[2]))return qa(i);let v=Za(c[0].token,e);if(b==="|")return g(v,c[2].token);let f=Za(c[2].token,e);return g(v,f)}}function qa(i){return console.warn(`Warning: invalid expression \`${i}\``),!1}function $n({type:i}){return["number","boolean","string","param"].includes(i)}function Za(i,e){let t=i[0],a=i.slice(-1);return i==="true"||i==="false"?i==="true":t===a&&["'",'"'].includes(t)?i.slice(1,-1):yr(i)?parseFloat(i):e[i]}function lv(i,e){let t,a,r,n=[];for(;i;){r=null,t=i.length;for(let s in e)a=e[s].exec(i),a&&a.index<t&&(r={token:a[0],type:s,matches:a.slice(1)},t=a.index);t&&n.push({token:i.substr(0,t),type:void 0}),r&&n.push(r),i=i.substr(t+(r?r.token.length:0))}return n}var hl=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},ul=(i,e,t)=>(hl(i,e,"read from private field"),t?t.call(i):e.get(i)),Qa=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},si=(i,e,t,a)=>(hl(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),ll=(i,e,t)=>(hl(i,e,"access private method"),t),Vi,Vn,Yi,cl,zc,Yn,ml,dl={mediatargetlivewindow:"targetlivewindow",mediastreamtype:"streamtype"},Xc=m.createElement("template");Xc.innerHTML=`
  <style>
    :host {
      display: inline-block;
      line-height: 0;

      /* Hide theme element until the breakpoints are available to avoid flicker. */
      visibility: hidden;
    }

    media-controller {
      width: 100%;
      height: 100%;
    }

    media-captions-button:not([mediasubtitleslist]),
    media-captions-menu:not([mediasubtitleslist]),
    media-captions-menu-button:not([mediasubtitleslist]),
    media-audio-track-menu[mediaaudiotrackunavailable],
    media-audio-track-menu-button[mediaaudiotrackunavailable],
    media-rendition-menu[mediarenditionunavailable],
    media-rendition-menu-button[mediarenditionunavailable],
    media-volume-range[mediavolumeunavailable],
    media-airplay-button[mediaairplayunavailable],
    media-fullscreen-button[mediafullscreenunavailable],
    media-cast-button[mediacastunavailable],
    media-pip-button[mediapipunavailable] {
      display: none;
    }
  </style>
`;var li=class extends d.HTMLElement{constructor(){super(),Qa(this,cl),Qa(this,Yn),Qa(this,Vi,void 0),Qa(this,Vn,void 0),Qa(this,Yi,void 0),this.shadowRoot?this.renderRoot=this.shadowRoot:(this.renderRoot=this.attachShadow({mode:"open"}),this.createRenderer());let e=new MutationObserver(t=>{var a;this.mediaController&&!((a=this.mediaController)!=null&&a.breakpointsComputed)||t.some(r=>{let n=r.target;return n===this?!0:n.localName!=="media-controller"?!1:!!(dl[r.attributeName]||r.attributeName.startsWith("breakpoint"))})&&this.render()});e.observe(this,{attributes:!0}),e.observe(this.renderRoot,{attributes:!0,subtree:!0}),this.addEventListener(ot.BREAKPOINTS_COMPUTED,this.render),ll(this,cl,zc).call(this,"template")}get mediaController(){return this.renderRoot.querySelector("media-controller")}get template(){var e;return(e=ul(this,Vi))!=null?e:this.constructor.template}set template(e){si(this,Yi,null),si(this,Vi,e),this.createRenderer()}get props(){var e,t,a;let r=[...Array.from((t=(e=this.mediaController)==null?void 0:e.attributes)!=null?t:[]).filter(({name:s})=>dl[s]||s.startsWith("breakpoint")),...Array.from(this.attributes)],n={};for(let s of r){let l=(a=dl[s.name])!=null?a:Od(s.name),{value:u}=s;u!=null?(yr(u)&&(u=parseFloat(u)),n[l]=u===""?!0:u):n[l]=!1}return n}attributeChangedCallback(e,t,a){e==="template"&&t!=a&&ll(this,Yn,ml).call(this)}connectedCallback(){ll(this,Yn,ml).call(this)}createRenderer(){this.template&&this.template!==ul(this,Vn)&&(si(this,Vn,this.template),this.renderer=new ht(this.template,this.props,this.constructor.processor),this.renderRoot.textContent="",this.renderRoot.append(Xc.content.cloneNode(!0),this.renderer))}render(){var e;if((e=this.renderer)==null||e.update(this.props),this.renderRoot.isConnected){let{style:t}=W(this.renderRoot,":host");t.visibility==="hidden"&&t.removeProperty("visibility")}}};Vi=new WeakMap;Vn=new WeakMap;Yi=new WeakMap;cl=new WeakSet;zc=function(i){if(Object.prototype.hasOwnProperty.call(this,i)){let e=this[i];delete this[i],this[i]=e}};Yn=new WeakSet;ml=function(){var i;let e=this.getAttribute("template");if(!e||e===ul(this,Yi))return;let t=this.getRootNode(),a=(i=t==null?void 0:t.getElementById)==null?void 0:i.call(t,e);if(a){si(this,Yi,e),si(this,Vi,a),this.createRenderer();return}dv(e)&&(si(this,Yi,e),uv(e).then(r=>{let n=m.createElement("template");n.innerHTML=r,si(this,Vi,n),this.createRenderer()}).catch(console.error))};li.observedAttributes=["template"];li.processor=Kn;function dv(i){if(!/^(\/|\.\/|https?:\/\/)/.test(i))return!1;let e=/^https?:\/\//.test(i)?void 0:location.origin;try{new URL(i,e)}catch{return!1}return!0}async function uv(i){let e=await fetch(i);if(e.status!==200)throw new Error(`Failed to load resource: the server responded with a status of ${e.status}`);return e.text()}d.customElements.get("media-theme")||d.customElements.define("media-theme",li);var Jc=`:host {
  --media-control-display: var(--controls);
  --media-loading-indicator-display: var(--loading-indicator);
  --media-dialog-display: var(--dialog);
  --media-play-button-display: var(--play-button);
  --media-live-button-display: var(--live-button);
  --media-seek-backward-button-display: var(--seek-backward-button);
  --media-seek-forward-button-display: var(--seek-forward-button);
  --media-mute-button-display: var(--mute-button);
  --media-captions-button-display: var(--captions-button);
  --media-captions-menu-button-display: var(--captions-menu-button, var(--media-captions-button-display));
  --media-rendition-menu-button-display: var(--rendition-menu-button);
  --media-audio-track-menu-button-display: var(--audio-track-menu-button);
  --media-airplay-button-display: var(--airplay-button);
  --media-pip-button-display: var(--pip-button);
  --media-fullscreen-button-display: var(--fullscreen-button);
  --media-cast-button-display: var(--cast-button, var(--_cast-button-drm-display));
  --media-playback-rate-button-display: var(--playback-rate-button);
  --media-playback-rate-menu-button-display: var(--playback-rate-menu-button);
  --media-volume-range-display: var(--volume-range);
  --media-time-range-display: var(--time-range);
  --media-time-display-display: var(--time-display);
  --media-duration-display-display: var(--duration-display);
  --media-title-display-display: var(--title-display);

  display: inline-block;
  width: 100%;
  line-height: 0;
}

/* Hide custom elements that are not defined yet */
:not(:defined) {
  display: none;
}

a {
  color: #fff;
  font-size: 0.9em;
  text-decoration: underline;
}

media-theme {
  width: 100%;
  height: 100%;
  direction: ltr;
}

media-poster-image {
  width: 100%;
  height: 100%;
}

media-poster-image:not([src]):not([placeholdersrc]) {
  display: none;
}

::part(top),
[part~='top'] {
  --media-control-display: var(--controls, var(--top-controls));
  --media-play-button-display: var(--play-button, var(--top-play-button));
  --media-live-button-display: var(--live-button, var(--top-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--top-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--top-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--top-mute-button));
  --media-captions-button-display: var(--captions-button, var(--top-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--top-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--top-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--top-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--top-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--top-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--top-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--top-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--top-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --captions-menu-button,
    var(--media-playback-rate-button-display, var(--top-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--top-volume-range));
  --media-time-range-display: var(--time-range, var(--top-time-range));
  --media-time-display-display: var(--time-display, var(--top-time-display));
  --media-duration-display-display: var(--duration-display, var(--top-duration-display));
  --media-title-display-display: var(--title-display, var(--top-title-display));
}

::part(center),
[part~='center'] {
  --media-control-display: var(--controls, var(--center-controls));
  --media-play-button-display: var(--play-button, var(--center-play-button));
  --media-live-button-display: var(--live-button, var(--center-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--center-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--center-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--center-mute-button));
  --media-captions-button-display: var(--captions-button, var(--center-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--center-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--center-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--center-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--center-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--center-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--center-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--center-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--center-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --playback-rate-menu-button,
    var(--media-playback-rate-button-display, var(--center-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--center-volume-range));
  --media-time-range-display: var(--time-range, var(--center-time-range));
  --media-time-display-display: var(--time-display, var(--center-time-display));
  --media-duration-display-display: var(--duration-display, var(--center-duration-display));
}

::part(bottom),
[part~='bottom'] {
  --media-control-display: var(--controls, var(--bottom-controls));
  --media-play-button-display: var(--play-button, var(--bottom-play-button));
  --media-live-button-display: var(--live-button, var(--bottom-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--bottom-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--bottom-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--bottom-mute-button));
  --media-captions-button-display: var(--captions-button, var(--bottom-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--bottom-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--bottom-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--bottom-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--bottom-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--bottom-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--bottom-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--bottom-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--bottom-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --playback-rate-menu-button,
    var(--media-playback-rate-button-display, var(--bottom-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--bottom-volume-range));
  --media-time-range-display: var(--time-range, var(--bottom-time-range));
  --media-time-display-display: var(--time-display, var(--bottom-time-display));
  --media-duration-display-display: var(--duration-display, var(--bottom-duration-display));
  --media-title-display-display: var(--title-display, var(--bottom-title-display));
}

:host([no-tooltips]) {
  --media-tooltip-display: none;
}
`;var em=`
  :host {
    z-index: 100;
    display: var(--media-dialog-display, flex);
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    color: #fff;
    line-height: 18px;
    font-family: Arial, sans-serif;
    padding: var(--media-dialog-backdrop-padding, 0);
    background: var(--media-dialog-backdrop-background,
      linear-gradient(to bottom, rgba(20, 20, 30, 0.7) 50%, rgba(20, 20, 30, 0.9))
    );
    /* Needs to use !important to prevent overwrite of media-chrome */
    transition: var(--media-dialog-transition-open, visibility .2s, opacity .2s) !important;
    transform: var(--media-dialog-transform-open, none) !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  :host(:not([open])) {
    /* Needs to use !important to prevent overwrite of media-chrome */
    transition: var(--media-dialog-transition-close, visibility .1s, opacity .1s) !important;
    transform: var(--media-dialog-transform-close, none) !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  :focus-visible {
    box-shadow: 0 0 0 2px rgba(27, 127, 204, 0.9);
  }

  .dialog {
    position: relative;
    box-sizing: border-box;
    background: var(--media-dialog-background, none);
    padding: var(--media-dialog-padding, 10px);
    width: min(320px, 100%);
    word-wrap: break-word;
    max-height: 100%;
    overflow: auto;
    text-align: center;
    line-height: 1.4;
  }
`,tm=Ae.createElement("template");tm.innerHTML=`
  <style>
    ${em}
  </style>

  <div class="dialog">
    <slot></slot>
  </div>
`;var xt=class extends Q.HTMLElement{constructor(){var e;super(),this.attachShadow({mode:"open"}),(e=this.shadowRoot)==null||e.appendChild(this.constructor.template.content.cloneNode(!0))}show(){this.setAttribute("open",""),this.dispatchEvent(new CustomEvent("open",{composed:!0,bubbles:!0})),jc(this)}close(){this.hasAttribute("open")&&(this.removeAttribute("open"),this.dispatchEvent(new CustomEvent("close",{composed:!0,bubbles:!0})),mv(this))}attributeChangedCallback(e,t,a){e==="open"&&t!==a&&(a!=null?this.show():this.close())}connectedCallback(){this.hasAttribute("role")||this.setAttribute("role","dialog"),this.hasAttribute("open")&&jc(this)}};xt.styles=em,xt.template=tm,xt.observedAttributes=["open"];function jc(i){let e=new CustomEvent("initfocus",{composed:!0,bubbles:!0,cancelable:!0});if(i.dispatchEvent(e),e.defaultPrevented)return;let t=i.querySelector("[autofocus]:not([disabled])");!t&&i.tabIndex>=0&&(t=i),t||(t=im(i.shadowRoot)),i._previouslyFocusedElement=Ae.activeElement,Ae.activeElement instanceof HTMLElement&&Ae.activeElement.blur(),i.addEventListener("transitionend",()=>{t instanceof HTMLElement&&t.focus({preventScroll:!0})},{once:!0})}function im(i){let t=["button","input","keygen","select","textarea"].map(function(r){return r+":not([disabled])"});t.push('[tabindex]:not([disabled]):not([tabindex=""])');let a=i==null?void 0:i.querySelector(t.join(", "));if(!a&&"attachShadow"in Element.prototype){let r=(i==null?void 0:i.querySelectorAll("*"))||[];for(let n=0;n<r.length&&!(r[n].tagName&&r[n].shadowRoot&&(a=im(r[n].shadowRoot),a));n++);}return a}function mv(i){i._previouslyFocusedElement instanceof HTMLElement&&i._previouslyFocusedElement.focus()}Q.customElements.get("media-dialog")||(Q.customElements.define("media-dialog",xt),Q.MediaDialog=xt);var pl=xt;var am=Ae.createElement("template");am.innerHTML=`
  <style>
    ${pl.styles}

    .close {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      outline: inherit;
      width: 28px;
      height: 28px;
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
  </style>

  <div class="dialog">
    <slot></slot>
  </div>

  <slot name="close">
    <button class="close" tabindex="0">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </slot>
`;var za=class extends pl{constructor(){var e,t;super(),(t=(e=this.shadowRoot)==null?void 0:e.querySelector(".close"))==null||t.addEventListener("click",()=>{this.close()})}};za.template=am;Q.customElements.get("mxp-dialog")||(Q.customElements.define("mxp-dialog",za),Q.MxpDialog=za);var Xa=new WeakMap,fl=class i{constructor(e,t){this.element=e;this.type=t;this.element.addEventListener(this.type,this);let a=Xa.get(this.element);a&&a.set(this.type,this)}set(e){if(typeof e=="function")this.handleEvent=e.bind(this.element);else if(typeof e=="object"&&typeof e.handleEvent=="function")this.handleEvent=e.handleEvent.bind(e);else{this.element.removeEventListener(this.type,this);let t=Xa.get(this.element);t&&t.delete(this.type)}}static for(e){Xa.has(e.element)||Xa.set(e.element,new Map);let t=e.attributeName.slice(2),a=Xa.get(e.element);return a&&a.has(t)?a.get(t):new i(e.element,t)}};function hv(i,e){return i instanceof he&&i.attributeName.startsWith("on")?(fl.for(i).set(e),i.element.removeAttributeNS(i.attributeNamespace,i.attributeName),!0):!1}function pv(i,e){return e instanceof Gn&&i instanceof pt?(e.renderInto(i),!0):!1}function vv(i,e){return e instanceof DocumentFragment&&i instanceof pt?(e.childNodes.length&&i.replace(...e.childNodes),!0):!1}function fv(i,e){if(i instanceof he){let t=i.attributeNamespace,a=i.element.getAttributeNS(t,i.attributeName);return String(e)!==a&&(i.value=String(e)),!0}return i.value=String(e),!0}function Ev(i,e){if(i instanceof he&&e instanceof Element){let t=i.element;return t[i.attributeName]!==e&&(i.element.removeAttributeNS(i.attributeNamespace,i.attributeName),t[i.attributeName]=e),!0}return!1}function bv(i,e){if(typeof e=="boolean"&&i instanceof he){let t=i.attributeNamespace,a=i.element.hasAttributeNS(t,i.attributeName);return e!==a&&(i.booleanValue=e),!0}return!1}function gv(i,e){return e===!1&&i instanceof pt?(i.replace(""),!0):!1}function _v(i,e){Ev(i,e)||bv(i,e)||hv(i,e)||gv(i,e)||pv(i,e)||vv(i,e)||fv(i,e)}var vl=new Map,rm=new WeakMap,nm=new WeakMap,Gn=class{constructor(e,t,a){this.strings=e;this.values=t;this.processor=a;this.stringsKey=this.strings.join("")}get template(){if(vl.has(this.stringsKey))return vl.get(this.stringsKey);{let e=Ae.createElement("template"),t=this.strings.length-1;return e.innerHTML=this.strings.reduce((a,r,n)=>a+r+(n<t?`{{ ${n} }}`:""),""),vl.set(this.stringsKey,e),e}}renderInto(e){var r;let t=this.template;if(rm.get(e)!==t){rm.set(e,t);let n=new ht(t,this.values,this.processor);nm.set(e,n),e instanceof pt?e.replace(...n.children):e.appendChild(n);return}let a=nm.get(e);(r=a==null?void 0:a.update)==null||r.call(a,this.values)}},Av={processCallback(i,e,t){var a;if(t){for(let[r,n]of e)if(r in t){let s=(a=t[r])!=null?a:"";_v(n,s)}}}};function vt(i,...e){return new Gn(i,e,Av)}function om(i,e){i.renderInto(e)}var di=require("@mux/playback-core"),Tv=i=>{let{tokens:e}=i;return e.drm?":host { --_cast-button-drm-display: none; }":""},sm=i=>vt`
  <style>
    ${Tv(i)}
    ${Jc}
  </style>
  ${Iv(i)}
`,yv=i=>{let e=i.hotKeys?`${i.hotKeys}`:"";return Ka(i.streamType)==="live"&&(e+=" noarrowleft noarrowright"),e},kv={TOP:"top",CENTER:"center",BOTTOM:"bottom",LAYER:"layer",MEDIA_LAYER:"media-layer",POSTER_LAYER:"poster-layer",VERTICAL_LAYER:"vertical-layer",CENTERED_LAYER:"centered-layer",GESTURE_LAYER:"gesture-layer",CONTROLLER_LAYER:"controller",BUTTON:"button",RANGE:"range",DISPLAY:"display",CONTROL_BAR:"control-bar",MENU_BUTTON:"menu-button",LISTBOX:"listbox",OPTION:"option",POSTER:"poster",LIVE:"live",PLAY:"play",PRE_PLAY:"pre-play",SEEK_BACKWARD:"seek-backward",SEEK_FORWARD:"seek-forward",MUTE:"mute",CAPTIONS:"captions",AIRPLAY:"airplay",PIP:"pip",FULLSCREEN:"fullscreen",CAST:"cast",PLAYBACK_RATE:"playback-rate",VOLUME:"volume",TIME:"time",TITLE:"title",AUDIO_TRACK:"audio-track",RENDITION:"rendition"},Sv=Object.values(kv).join(", "),Iv=i=>{var e,t,a,r,n,s,l,u,c,b,g,v,f,L,A,T,N,te,be,gt,rt,ji,ea,ta,ia,aa,ra,na,oa,sa,la,da,Ar,nt,ua,ca,ma,ha;return vt`
  <media-theme
    template="${i.themeTemplate||!1}"
    defaultstreamtype="${(e=i.defaultStreamType)!=null?e:!1}"
    hotkeys="${yv(i)||!1}"
    nohotkeys="${i.noHotKeys||!i.hasSrc||i.isDialogOpen||!1}"
    noautoseektolive="${!!((t=i.streamType)!=null&&t.includes(di.StreamTypes.LIVE))&&i.targetLiveWindow!==0}"
    novolumepref="${i.novolumepref||!1}"
    disabled="${!i.hasSrc||i.isDialogOpen}"
    audio="${(a=i.audio)!=null?a:!1}"
    style="${(r=Lc({"--media-primary-color":i.primaryColor,"--media-secondary-color":i.secondaryColor,"--media-accent-color":i.accentColor}))!=null?r:!1}"
    defaultsubtitles="${!i.defaultHiddenCaptions}"
    forwardseekoffset="${(n=i.forwardSeekOffset)!=null?n:!1}"
    backwardseekoffset="${(s=i.backwardSeekOffset)!=null?s:!1}"
    playbackrates="${(l=i.playbackRates)!=null?l:!1}"
    defaultshowremainingtime="${(u=i.defaultShowRemainingTime)!=null?u:!1}"
    defaultduration="${(c=i.defaultDuration)!=null?c:!1}"
    hideduration="${(b=i.hideDuration)!=null?b:!1}"
    title="${(g=i.title)!=null?g:!1}"
    exportparts="${Sv}"
  >
    <mux-video
      slot="media"
      target-live-window="${(v=i.targetLiveWindow)!=null?v:!1}"
      stream-type="${(f=Ka(i.streamType))!=null?f:!1}"
      crossorigin="${(L=i.crossOrigin)!=null?L:""}"
      playsinline
      autoplay="${(A=i.autoplay)!=null?A:!1}"
      muted="${(T=i.muted)!=null?T:!1}"
      loop="${(N=i.loop)!=null?N:!1}"
      preload="${(te=i.preload)!=null?te:!1}"
      debug="${(be=i.debug)!=null?be:!1}"
      prefer-cmcd="${(gt=i.preferCmcd)!=null?gt:!1}"
      disable-tracking="${(rt=i.disableTracking)!=null?rt:!1}"
      disable-cookies="${(ji=i.disableCookies)!=null?ji:!1}"
      prefer-playback="${(ea=i.preferPlayback)!=null?ea:!1}"
      start-time="${i.startTime!=null?i.startTime:!1}"
      beacon-collection-domain="${(ta=i.beaconCollectionDomain)!=null?ta:!1}"
      player-software-name="${(ia=i.playerSoftwareName)!=null?ia:!1}"
      player-software-version="${(aa=i.playerSoftwareVersion)!=null?aa:!1}"
      env-key="${(ra=i.envKey)!=null?ra:!1}"
      custom-domain="${(na=i.customDomain)!=null?na:!1}"
      src="${i.src?i.src:i.playbackId?(0,di.toMuxVideoURL)(i):!1}"
      cast-src="${i.src?i.src:i.playbackId?(0,di.toMuxVideoURL)(i):!1}"
      cast-receiver="${(oa=i.castReceiver)!=null?oa:!1}"
      drm-token="${(la=(sa=i.tokens)==null?void 0:sa.drm)!=null?la:!1}"
      exportparts="video"
    >
      ${i.storyboard?vt`<track label="thumbnails" default kind="metadata" src="${i.storyboard}" />`:vt``}
    </mux-video>
    <slot name="poster" slot="poster">
      <media-poster-image
        part="poster"
        exportparts="poster, img"
        src="${i.poster?i.poster:!1}"
        placeholdersrc="${(da=i.placeholder)!=null?da:!1}"
      ></media-poster-image>
    </slot>
    <mxp-dialog
      no-auto-hide
      open="${(Ar=i.isDialogOpen)!=null?Ar:!1}"
      onclose="${i.onCloseErrorDialog}"
      oninitfocus="${i.onInitFocusDialog}"
    >
      ${(nt=i.dialog)!=null&&nt.title?vt`<h3>${i.dialog.title}</h3>`:vt``}
      <p>
        ${(ua=i.dialog)==null?void 0:ua.message}
        ${(ca=i.dialog)!=null&&ca.linkUrl?vt`<a
              href="${i.dialog.linkUrl}"
              target="_blank"
              rel="external noopener"
              aria-label="${(ma=i.dialog.linkText)!=null?ma:""} ${(0,di.i18n)("(opens in a new window)")}"
              >${(ha=i.dialog.linkText)!=null?ha:i.dialog.linkUrl}</a
            >`:vt``}
      </p>
    </mxp-dialog>
  </media-theme>
`};var _=require("@mux/playback-core"),lm=i=>i.charAt(0).toUpperCase()+i.slice(1),Cv=(i,e=!1)=>{var t,a;if(i.muxCode){let r=lm((t=i.errorCategory)!=null?t:"video"),n=(0,_.errorCategoryToTokenNameOrPrefix)((a=i.errorCategory)!=null?a:_.MuxErrorCategory.VIDEO);if(i.muxCode===_.MuxErrorCode.NETWORK_OFFLINE)return(0,_.i18n)("Your device appears to be offline",e);if(i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_EXPIRED)return(0,_.i18n)("{category} URL has expired",e).format({category:r});if([_.MuxErrorCode.NETWORK_TOKEN_SUB_MISMATCH,_.MuxErrorCode.NETWORK_TOKEN_AUD_MISMATCH,_.MuxErrorCode.NETWORK_TOKEN_AUD_MISSING,_.MuxErrorCode.NETWORK_TOKEN_MALFORMED].includes(i.muxCode))return(0,_.i18n)("{category} URL is formatted incorrectly",e).format({category:r});if(i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_MISSING)return(0,_.i18n)("Invalid {categoryName} URL",e).format({categoryName:n});if(i.muxCode===_.MuxErrorCode.NETWORK_NOT_FOUND)return(0,_.i18n)("{category} does not exist",e).format({category:r});if(i.muxCode===_.MuxErrorCode.NETWORK_NOT_READY)return(0,_.i18n)("{category} is not currently available",e).format({category:r})}if(i.code){if(i.code===_.MediaError.MEDIA_ERR_NETWORK)return(0,_.i18n)("Network Error",e);if(i.code===_.MediaError.MEDIA_ERR_DECODE)return(0,_.i18n)("Media Error",e);if(i.code===_.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)return(0,_.i18n)("Source Not Supported",e)}return(0,_.i18n)("Error",e)},Mv=(i,e=!1)=>{var t,a;if(i.muxCode){let r=lm((t=i.errorCategory)!=null?t:"video"),n=(0,_.errorCategoryToTokenNameOrPrefix)((a=i.errorCategory)!=null?a:_.MuxErrorCategory.VIDEO);return i.muxCode===_.MuxErrorCode.NETWORK_OFFLINE?(0,_.i18n)("Check your internet connection and try reloading this video.",e):i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_EXPIRED?(0,_.i18n)("The video\u2019s secured {tokenNamePrefix}-token has expired.",e).format({tokenNamePrefix:n}):i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_SUB_MISMATCH?(0,_.i18n)("The video\u2019s playback ID does not match the one encoded in the {tokenNamePrefix}-token.",e).format({tokenNamePrefix:n}):i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_MALFORMED?(0,_.i18n)("{category} URL is formatted incorrectly",e).format({category:r}):[_.MuxErrorCode.NETWORK_TOKEN_AUD_MISMATCH,_.MuxErrorCode.NETWORK_TOKEN_AUD_MISSING].includes(i.muxCode)?(0,_.i18n)("The {tokenNamePrefix}-token is formatted with incorrect information.",e).format({tokenNamePrefix:n}):[_.MuxErrorCode.NETWORK_TOKEN_MISSING,_.MuxErrorCode.NETWORK_INVALID_URL].includes(i.muxCode)?(0,_.i18n)("The video URL or {tokenNamePrefix}-token are formatted with incorrect or incomplete information.",e).format({tokenNamePrefix:n}):i.muxCode===_.MuxErrorCode.NETWORK_NOT_FOUND?"":i.muxCode===_.MuxErrorCode.NETWORK_NOT_READY?(0,_.i18n)("The live stream or video file are not yet ready.",e):i.message}return i.code&&(i.code===_.MediaError.MEDIA_ERR_NETWORK||i.code===_.MediaError.MEDIA_ERR_DECODE||i.code===_.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED),i.message},Lv=(i,e=!1)=>{let t=Cv(i,e),a=Mv(i,e);return{title:t,message:a}},Rv=i=>{if(i.muxCode){if(i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_EXPIRED)return"403-expired-token.md";if(i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_MALFORMED)return"403-malformatted-token.md";if([_.MuxErrorCode.NETWORK_TOKEN_AUD_MISMATCH,_.MuxErrorCode.NETWORK_TOKEN_AUD_MISSING].includes(i.muxCode))return"403-incorrect-aud-value.md";if(i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_SUB_MISMATCH)return"403-playback-id-mismatch.md";if(i.muxCode===_.MuxErrorCode.NETWORK_TOKEN_MISSING)return"missing-signed-tokens.md";if(i.muxCode===_.MuxErrorCode.NETWORK_NOT_FOUND)return"404-not-found.md";if(i.muxCode===_.MuxErrorCode.NETWORK_NOT_READY)return"412-not-playable.md"}if(i.code){if(i.code===_.MediaError.MEDIA_ERR_NETWORK)return"";if(i.code===_.MediaError.MEDIA_ERR_DECODE)return"media-decode-error.md";if(i.code===_.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)return"media-src-not-supported.md"}return""},wv=(i,e)=>{let t=Rv(i);return{message:i.message,context:i.context,file:t}};function El(i,e=!1){let t=Lv(i,e),a=wv(i,e);return{dialog:t,devlog:a}}var dm=`<template id="media-theme-gerwig">
  <style>
    @keyframes pre-play-hide {
      0% {
        transform: scale(1);
        opacity: 1;
      }

      30% {
        transform: scale(0.7);
      }

      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    :host {
      --_primary-color: var(--media-primary-color, #fff);
      --_secondary-color: var(--media-secondary-color, transparent);
      --_accent-color: var(--media-accent-color, #fa50b5);
      --_text-color: var(--media-text-color, #000);

      --media-icon-color: var(--_primary-color);
      --media-control-background: var(--_secondary-color);
      --media-control-hover-background: var(--_accent-color);
      --media-time-buffered-color: rgba(255, 255, 255, 0.4);
      --media-preview-time-text-shadow: none;
      --media-control-height: 14px;
      --media-control-padding: 6px;
      --media-tooltip-container-margin: 6px;
      --media-tooltip-distance: 18px;

      color: var(--_primary-color);
      display: inline-block;
      width: 100%;
      height: 100%;
    }

    :host([audio]) {
      --_secondary-color: var(--media-secondary-color, black);
      --media-preview-time-text-shadow: none;
    }

    :host([audio]) ::slotted([slot='media']) {
      height: 0px;
    }

    :host([audio]) media-loading-indicator {
      display: none;
    }

    :host([audio]) media-controller {
      background: transparent;
    }

    :host([audio]) media-controller::part(vertical-layer) {
      background: transparent;
    }

    :host([audio]) media-control-bar {
      width: 100%;
      background-color: var(--media-control-background);
    }

    /*
     * 0.433s is the transition duration for VTT Regions.
     * Borrowed here, so the captions don't move too fast.
     */
    media-controller {
      --media-webkit-text-track-transform: translateY(0) scale(0.98);
      --media-webkit-text-track-transition: transform 0.433s ease-out 0.3s;
    }
    media-controller:is([mediapaused], :not([userinactive])) {
      --media-webkit-text-track-transform: translateY(-50px) scale(0.98);
      --media-webkit-text-track-transition: transform 0.15s ease;
    }

    /*
     * CSS specific to iOS devices.
     * See: https://stackoverflow.com/questions/30102792/css-media-query-to-target-only-ios-devices/60220757#60220757
     */
    @supports (-webkit-touch-callout: none) {
      /* Disable subtitle adjusting for iOS Safari */
      media-controller[mediaisfullscreen] {
        --media-webkit-text-track-transform: unset;
        --media-webkit-text-track-transition: unset;
      }
    }

    media-time-range {
      --media-box-padding-left: 6px;
      --media-box-padding-right: 6px;
      --media-range-bar-color: var(--_accent-color);
      --media-time-range-buffered-color: var(--_primary-color);
      --media-range-track-color: transparent;
      --media-range-track-background: rgba(255, 255, 255, 0.4);
      --media-range-thumb-background: radial-gradient(
        circle,
        #000 0%,
        #000 25%,
        var(--_accent-color) 25%,
        var(--_accent-color)
      );
      --media-range-thumb-width: 12px;
      --media-range-thumb-height: 12px;
      --media-range-thumb-transform: scale(0);
      --media-range-thumb-transition: transform 0.3s;
      --media-range-thumb-opacity: 1;
      --media-preview-background: var(--_primary-color);
      --media-box-arrow-background: var(--_primary-color);
      --media-preview-thumbnail-border: 5px solid var(--_primary-color);
      --media-preview-border-radius: 5px;
      --media-text-color: var(--_text-color);
      --media-control-hover-background: transparent;
      --media-preview-chapter-text-shadow: none;
      color: var(--_accent-color);
      padding: 0 6px;
    }

    :host([audio]) media-time-range {
      --media-preview-time-padding: 1.5px 6px;
      --media-preview-box-margin: 0 0 -5px;
    }

    media-time-range:hover {
      --media-range-thumb-transform: scale(1);
    }

    media-preview-thumbnail {
      border-bottom-width: 0;
    }

    [part~='menu'] {
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      bottom: 50px;
      padding: 2.5px 10px;
    }

    [part~='menu']::part(indicator) {
      fill: var(--_accent-color);
    }

    [part~='menu']::part(menu-item) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 6px 10px;
      min-height: 34px;
    }

    [part~='menu']::part(checked) {
      font-weight: 700;
    }

    media-captions-menu,
    media-rendition-menu,
    media-audio-track-menu,
    media-playback-rate-menu {
      position: absolute; /* ensure they don't take up space in DOM on load */
      --media-menu-background: var(--_primary-color);
      --media-menu-item-checked-background: transparent;
      --media-text-color: var(--_text-color);
      --media-menu-item-hover-background: transparent;
      --media-menu-item-hover-outline: var(--_accent-color) solid 1px;
    }

    /* The icon is a circle so make it 16px high instead of 14px for more balance. */
    media-audio-track-menu-button {
      --media-control-padding: 5px;
      --media-control-height: 16px;
    }

    media-playback-rate-menu-button {
      --media-control-padding: 6px 3px;
      min-width: 4.4ch;
    }

    media-playback-rate-menu {
      --media-menu-flex-direction: row;
      --media-menu-item-checked-background: var(--_accent-color);
      --media-menu-item-checked-indicator-display: none;
      margin-right: 6px;
      padding: 0;
      --media-menu-gap: 0.25em;
    }

    media-playback-rate-menu[part~='menu']::part(menu-item) {
      padding: 6px 6px 6px 8px;
    }

    media-playback-rate-menu[part~='menu']::part(checked) {
      color: #fff;
    }

    :host(:not([audio])) media-time-range {
      /* Adding px is required here for calc() */
      --media-range-padding: 0px;
      background: transparent;
      z-index: 10;
      height: 10px;
      bottom: -3px;
      width: 100%;
    }

    media-control-bar :is([role='button'], [role='switch'], button) {
      line-height: 0;
    }

    media-control-bar :is([part*='button'], [part*='range'], [part*='display']) {
      border-radius: 3px;
    }

    .spacer {
      flex-grow: 1;
      background-color: var(--media-control-background, rgba(20, 20, 30, 0.7));
    }

    media-control-bar[slot~='top-chrome'] {
      min-height: 42px;
      pointer-events: none;
    }

    media-control-bar {
      --gradient-steps: hsl(0 0% 0% / 0) 0%, hsl(0 0% 0% / 0.013) 8.1%, hsl(0 0% 0% / 0.049) 15.5%,
        hsl(0 0% 0% / 0.104) 22.5%, hsl(0 0% 0% / 0.175) 29%, hsl(0 0% 0% / 0.259) 35.3%, hsl(0 0% 0% / 0.352) 41.2%,
        hsl(0 0% 0% / 0.45) 47.1%, hsl(0 0% 0% / 0.55) 52.9%, hsl(0 0% 0% / 0.648) 58.8%, hsl(0 0% 0% / 0.741) 64.7%,
        hsl(0 0% 0% / 0.825) 71%, hsl(0 0% 0% / 0.896) 77.5%, hsl(0 0% 0% / 0.951) 84.5%, hsl(0 0% 0% / 0.987) 91.9%,
        hsl(0 0% 0%) 100%;
    }

    :host([title]:not([audio])) media-control-bar[slot='top-chrome']::before {
      content: '';
      position: absolute;
      width: 100%;
      padding-bottom: min(100px, 25%);
      background: linear-gradient(to top, var(--gradient-steps));
      opacity: 0.8;
      pointer-events: none;
    }

    :host(:not([audio])) media-control-bar[part~='bottom']::before {
      content: '';
      position: absolute;
      width: 100%;
      bottom: 0;
      left: 0;
      padding-bottom: min(100px, 25%);
      background: linear-gradient(to bottom, var(--gradient-steps));
      opacity: 0.8;
      z-index: 1;
      pointer-events: none;
    }

    media-control-bar[part~='bottom'] > * {
      z-index: 20;
    }

    media-control-bar[part~='bottom'] {
      padding: 6px 6px;
    }

    media-control-bar[slot~='top-chrome'] > * {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      position: relative;
    }

    media-controller::part(vertical-layer) {
      transition: background-color 1s;
    }

    media-controller:is([mediapaused], :not([userinactive]))::part(vertical-layer) {
      background-color: var(--controls-backdrop-color, var(--controls, transparent));
      transition: background-color 0.25s;
    }

    .center-controls {
      --media-button-icon-width: 100%;
      --media-button-icon-height: auto;
      --media-tooltip-display: none;
      pointer-events: none;
      width: 100%;
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.25)) drop-shadow(0 0 6px rgb(0 0 0 / 0.25));
      paint-order: stroke;
      stroke: rgba(102, 102, 102, 1);
      stroke-width: 0.3px;
      text-shadow:
        0 0 2px rgb(0 0 0 / 0.25),
        0 0 6px rgb(0 0 0 / 0.25);
    }

    .center-controls media-play-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      --media-control-padding: 0;
      width: 40px;
    }

    [breakpointsm] .center-controls media-play-button {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      transition: background 0.4s;
      padding: 24px;
      --media-control-background: #000;
      --media-control-hover-background: var(--_accent-color);
    }

    .center-controls media-seek-backward-button,
    .center-controls media-seek-forward-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      padding: 0;
      margin: 0 20px;
      width: max(33px, min(8%, 40px));
    }

    [breakpointsm]:not([audio]) .center-controls.pre-playback {
      display: grid;
      align-items: initial;
      justify-content: initial;
      height: 100%;
      overflow: hidden;
    }

    [breakpointsm]:not([audio]) .center-controls.pre-playback media-play-button {
      place-self: var(--_pre-playback-place, center);
      grid-area: 1 / 1;
      margin: 16px;
    }

    /* Show and hide controls or pre-playback state */

    [breakpointsm]:is([mediahasplayed], :not([mediapaused])):not([audio])
      .center-controls.pre-playback
      media-play-button {
      /* Using \`forwards\` would lead to a laggy UI after the animation got in the end state */
      animation: 0.3s linear pre-play-hide;
      opacity: 0;
      pointer-events: none;
    }

    .autoplay-unmute {
      --media-control-hover-background: transparent;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.25)) drop-shadow(0 0 6px rgb(0 0 0 / 0.25));
    }

    .autoplay-unmute-btn {
      --media-control-height: 16px;
      border-radius: 8px;
      background: #000;
      color: var(--_primary-color);
      display: flex;
      align-items: center;
      padding: 8px 16px;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
    }

    .autoplay-unmute-btn:hover {
      background: var(--_accent-color);
    }

    [breakpointsm] .autoplay-unmute-btn {
      --media-control-height: 30px;
      padding: 14px 24px;
      font-size: 26px;
    }

    .autoplay-unmute-btn svg {
      margin: 0 6px 0 0;
    }

    [breakpointsm] .autoplay-unmute-btn svg {
      margin: 0 10px 0 0;
    }

    media-controller:not([audio]):not([mediahasplayed]) *:is(media-control-bar, media-time-range) {
      display: none;
    }

    media-loading-indicator {
      --media-loading-icon-width: 100%;
      --media-button-icon-height: auto;
      display: var(--media-control-display, var(--media-loading-indicator-display, flex));
      pointer-events: none;
      position: absolute;
      width: min(15%, 150px);
      flex-flow: row;
      align-items: center;
      justify-content: center;
    }

    /* Intentionally don't target the div for transition but the children
     of the div. Prevents messing with media-chrome's autohide feature. */
    media-loading-indicator + div * {
      transition: opacity 0.15s;
      opacity: 1;
    }

    media-loading-indicator[medialoading]:not([mediapaused]) ~ div > * {
      opacity: 0;
      transition-delay: 400ms;
    }

    media-volume-range {
      width: min(100%, 100px);
      --media-range-padding-left: 10px;
      --media-range-padding-right: 10px;
      --media-range-thumb-width: 12px;
      --media-range-thumb-height: 12px;
      --media-range-thumb-background: radial-gradient(
        circle,
        #000 0%,
        #000 25%,
        var(--_primary-color) 25%,
        var(--_primary-color)
      );
      --media-control-hover-background: none;
    }

    media-time-display {
      white-space: nowrap;
    }

    /* Generic style for explicitly disabled controls */
    media-control-bar[part~='bottom'] [disabled],
    media-control-bar[part~='bottom'] [aria-disabled='true'] {
      opacity: 60%;
      cursor: not-allowed;
    }

    media-text-display {
      --media-font-size: 16px;
      --media-control-padding: 14px;
      font-weight: 500;
    }

    media-play-button.animated *:is(g, path) {
      transition: all 0.3s;
    }

    media-play-button.animated[mediapaused] .pause-icon-pt1 {
      opacity: 0;
    }

    media-play-button.animated[mediapaused] .pause-icon-pt2 {
      transform-origin: center center;
      transform: scaleY(0);
    }

    media-play-button.animated[mediapaused] .play-icon {
      clip-path: inset(0 0 0 0);
    }

    media-play-button.animated:not([mediapaused]) .play-icon {
      clip-path: inset(0 0 0 100%);
    }

    media-seek-forward-button,
    media-seek-backward-button {
      --media-font-weight: 400;
    }

    .mute-icon {
      display: inline-block;
    }

    .mute-icon :is(path, g) {
      transition: opacity 0.5s;
    }

    .muted {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='low'] :is(.volume-medium, .volume-high),
    media-mute-button[mediavolumelevel='medium'] :is(.volume-high) {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='off'] .unmuted {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='off'] .muted {
      opacity: 1;
    }

    /**
     * Our defaults for these buttons are to hide them at small sizes
     * users can override this with CSS
     */
    media-controller:not([breakpointsm]):not([audio]) {
      --bottom-play-button: none;
      --bottom-seek-backward-button: none;
      --bottom-seek-forward-button: none;
      --bottom-time-display: none;
      --bottom-playback-rate-menu-button: none;
      --bottom-pip-button: none;
    }
  </style>

  <template partial="TitleDisplay">
    <template if="title">
      <media-text-display part="top title display" class="title-display">{{title}}</media-text-display>
    </template>
  </template>

  <template partial="PlayButton">
    <media-play-button
      part="{{section ?? 'bottom'}} play button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      class="animated"
    >
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="icon">
        <g class="play-icon">
          <path
            d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z"
          />
        </g>
        <g class="pause-icon">
          <path
            class="pause-icon-pt1"
            d="M5.90709 0H2.96889C2.46857 0 2.06299 0.405585 2.06299 0.9059V13.0941C2.06299 13.5944 2.46857 14 2.96889 14H5.90709C6.4074 14 6.81299 13.5944 6.81299 13.0941V0.9059C6.81299 0.405585 6.4074 0 5.90709 0Z"
          />
          <path
            class="pause-icon-pt2"
            d="M15.1571 0H12.2189C11.7186 0 11.313 0.405585 11.313 0.9059V13.0941C11.313 13.5944 11.7186 14 12.2189 14H15.1571C15.6574 14 16.063 13.5944 16.063 13.0941V0.9059C16.063 0.405585 15.6574 0 15.1571 0Z"
          />
        </g>
      </svg>
    </media-play-button>
  </template>

  <template partial="PrePlayButton">
    <media-play-button
      part="{{section ?? 'center'}} play button pre-play"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="icon" style="transform: translate(3px, 0)">
        <path
          d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z"
        />
      </svg>
    </media-play-button>
  </template>

  <template partial="SeekBackwardButton">
    <media-seek-backward-button
      seekoffset="{{backwardseekoffset}}"
      part="{{section ?? 'bottom'}} seek-backward button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg viewBox="0 0 22 14" aria-hidden="true" slot="icon">
        <path
          d="M3.65 2.07888L0.0864 6.7279C-0.0288 6.87812 -0.0288 7.12188 0.0864 7.2721L3.65 11.9211C3.7792 12.0896 4 11.9703 4 11.7321V2.26787C4 2.02968 3.7792 1.9104 3.65 2.07888Z"
        />
        <text transform="translate(6 12)" style="font-size: 14px; font-family: 'ArialMT', 'Arial'">
          {{backwardseekoffset}}
        </text>
      </svg>
    </media-seek-backward-button>
  </template>

  <template partial="SeekForwardButton">
    <media-seek-forward-button
      seekoffset="{{forwardseekoffset}}"
      part="{{section ?? 'bottom'}} seek-forward button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg viewBox="0 0 22 14" aria-hidden="true" slot="icon">
        <g>
          <text transform="translate(-1 12)" style="font-size: 14px; font-family: 'ArialMT', 'Arial'">
            {{forwardseekoffset}}
          </text>
          <path
            d="M18.35 11.9211L21.9136 7.2721C22.0288 7.12188 22.0288 6.87812 21.9136 6.7279L18.35 2.07888C18.2208 1.91041 18 2.02968 18 2.26787V11.7321C18 11.9703 18.2208 12.0896 18.35 11.9211Z"
          />
        </g>
      </svg>
    </media-seek-forward-button>
  </template>

  <template partial="MuteButton">
    <media-mute-button part="bottom mute button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" slot="icon" class="mute-icon" aria-hidden="true">
        <g class="unmuted">
          <path
            d="M6.76786 1.21233L3.98606 3.98924H1.19937C0.593146 3.98924 0.101743 4.51375 0.101743 5.1607V6.96412L0 6.99998L0.101743 7.03583V8.83926C0.101743 9.48633 0.593146 10.0108 1.19937 10.0108H3.98606L6.76773 12.7877C7.23561 13.2547 8 12.9007 8 12.2171V1.78301C8 1.09925 7.23574 0.745258 6.76786 1.21233Z"
          />
          <path
            class="volume-low"
            d="M10 3.54781C10.7452 4.55141 11.1393 5.74511 11.1393 6.99991C11.1393 8.25471 10.7453 9.44791 10 10.4515L10.7988 11.0496C11.6734 9.87201 12.1356 8.47161 12.1356 6.99991C12.1356 5.52821 11.6735 4.12731 10.7988 2.94971L10 3.54781Z"
          />
          <path
            class="volume-medium"
            d="M12.3778 2.40086C13.2709 3.76756 13.7428 5.35806 13.7428 7.00026C13.7428 8.64246 13.2709 10.233 12.3778 11.5992L13.2106 12.1484C14.2107 10.6185 14.739 8.83796 14.739 7.00016C14.739 5.16236 14.2107 3.38236 13.2106 1.85156L12.3778 2.40086Z"
          />
          <path
            class="volume-high"
            d="M15.5981 0.75L14.7478 1.2719C15.7937 2.9919 16.3468 4.9723 16.3468 7C16.3468 9.0277 15.7937 11.0082 14.7478 12.7281L15.5981 13.25C16.7398 11.3722 17.343 9.211 17.343 7C17.343 4.789 16.7398 2.6268 15.5981 0.75Z"
          />
        </g>
        <g class="muted">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M4.39976 4.98924H1.19937C1.19429 4.98924 1.17777 4.98961 1.15296 5.01609C1.1271 5.04369 1.10174 5.09245 1.10174 5.1607V8.83926C1.10174 8.90761 1.12714 8.95641 1.15299 8.984C1.17779 9.01047 1.1943 9.01084 1.19937 9.01084H4.39977L7 11.6066V2.39357L4.39976 4.98924ZM7.47434 1.92006C7.4743 1.9201 7.47439 1.92002 7.47434 1.92006V1.92006ZM6.76773 12.7877L3.98606 10.0108H1.19937C0.593146 10.0108 0.101743 9.48633 0.101743 8.83926V7.03583L0 6.99998L0.101743 6.96412V5.1607C0.101743 4.51375 0.593146 3.98924 1.19937 3.98924H3.98606L6.76786 1.21233C7.23574 0.745258 8 1.09925 8 1.78301V12.2171C8 12.9007 7.23561 13.2547 6.76773 12.7877Z"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15.2677 9.30323C15.463 9.49849 15.7796 9.49849 15.9749 9.30323C16.1701 9.10796 16.1701 8.79138 15.9749 8.59612L14.2071 6.82841L15.9749 5.06066C16.1702 4.8654 16.1702 4.54882 15.9749 4.35355C15.7796 4.15829 15.4631 4.15829 15.2678 4.35355L13.5 6.1213L11.7322 4.35348C11.537 4.15822 11.2204 4.15822 11.0251 4.35348C10.8298 4.54874 10.8298 4.86532 11.0251 5.06058L12.7929 6.82841L11.0251 8.59619C10.8299 8.79146 10.8299 9.10804 11.0251 9.3033C11.2204 9.49856 11.537 9.49856 11.7323 9.3033L13.5 7.53552L15.2677 9.30323Z"
          />
        </g>
      </svg>
    </media-mute-button>
  </template>

  <template partial="PipButton">
    <media-pip-button part="bottom pip button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="icon">
        <path
          d="M15.9891 0H2.011C0.9004 0 0 0.9003 0 2.0109V11.989C0 13.0996 0.9004 14 2.011 14H15.9891C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.9891 0ZM17 11.9891C17 12.5465 16.5465 13 15.9891 13H2.011C1.4536 13 1.0001 12.5465 1.0001 11.9891V2.0109C1.0001 1.4535 1.4536 0.9999 2.011 0.9999H15.9891C16.5465 0.9999 17 1.4535 17 2.0109V11.9891Z"
        />
        <path
          d="M15.356 5.67822H8.19523C8.03253 5.67822 7.90063 5.81012 7.90063 5.97282V11.3836C7.90063 11.5463 8.03253 11.6782 8.19523 11.6782H15.356C15.5187 11.6782 15.6506 11.5463 15.6506 11.3836V5.97282C15.6506 5.81012 15.5187 5.67822 15.356 5.67822Z"
        />
      </svg>
    </media-pip-button>
  </template>

  <template partial="CaptionsMenu">
    <media-captions-menu-button part="bottom captions button">
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="on">
        <path
          d="M15.989 0H2.011C0.9004 0 0 0.9003 0 2.0109V11.9891C0 13.0997 0.9004 14 2.011 14H15.989C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.989 0ZM4.2292 8.7639C4.5954 9.1902 5.0935 9.4031 5.7233 9.4031C6.1852 9.4031 6.5544 9.301 6.8302 9.0969C7.1061 8.8933 7.2863 8.614 7.3702 8.26H8.4322C8.3062 8.884 8.0093 9.3733 7.5411 9.7273C7.0733 10.0813 6.4703 10.2581 5.732 10.2581C5.108 10.2581 4.5699 10.1219 4.1168 9.8489C3.6637 9.5759 3.3141 9.1946 3.0685 8.7058C2.8224 8.2165 2.6994 7.6511 2.6994 7.009C2.6994 6.3611 2.8224 5.7927 3.0685 5.3034C3.3141 4.8146 3.6637 4.4323 4.1168 4.1559C4.5699 3.88 5.108 3.7418 5.732 3.7418C6.4703 3.7418 7.0733 3.922 7.5411 4.2818C8.0094 4.6422 8.3062 5.1461 8.4322 5.794H7.3702C7.2862 5.4283 7.106 5.1368 6.8302 4.921C6.5544 4.7052 6.1852 4.5968 5.7233 4.5968C5.0934 4.5968 4.5954 4.8116 4.2292 5.2404C3.8635 5.6696 3.6804 6.259 3.6804 7.009C3.6804 7.7531 3.8635 8.3381 4.2292 8.7639ZM11.0974 8.7639C11.4636 9.1902 11.9617 9.4031 12.5915 9.4031C13.0534 9.4031 13.4226 9.301 13.6984 9.0969C13.9743 8.8933 14.1545 8.614 14.2384 8.26H15.3004C15.1744 8.884 14.8775 9.3733 14.4093 9.7273C13.9415 10.0813 13.3385 10.2581 12.6002 10.2581C11.9762 10.2581 11.4381 10.1219 10.985 9.8489C10.5319 9.5759 10.1823 9.1946 9.9367 8.7058C9.6906 8.2165 9.5676 7.6511 9.5676 7.009C9.5676 6.3611 9.6906 5.7927 9.9367 5.3034C10.1823 4.8146 10.5319 4.4323 10.985 4.1559C11.4381 3.88 11.9762 3.7418 12.6002 3.7418C13.3385 3.7418 13.9415 3.922 14.4093 4.2818C14.8776 4.6422 15.1744 5.1461 15.3004 5.794H14.2384C14.1544 5.4283 13.9742 5.1368 13.6984 4.921C13.4226 4.7052 13.0534 4.5968 12.5915 4.5968C11.9616 4.5968 11.4636 4.8116 11.0974 5.2404C10.7317 5.6696 10.5486 6.259 10.5486 7.009C10.5486 7.7531 10.7317 8.3381 11.0974 8.7639Z"
        />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="off">
        <path
          d="M5.73219 10.258C5.10819 10.258 4.57009 10.1218 4.11699 9.8488C3.66389 9.5758 3.31429 9.1945 3.06869 8.7057C2.82259 8.2164 2.69958 7.651 2.69958 7.0089C2.69958 6.361 2.82259 5.7926 3.06869 5.3033C3.31429 4.8145 3.66389 4.4322 4.11699 4.1558C4.57009 3.8799 5.10819 3.7417 5.73219 3.7417C6.47049 3.7417 7.07348 3.9219 7.54128 4.2817C8.00958 4.6421 8.30638 5.146 8.43238 5.7939H7.37039C7.28639 5.4282 7.10618 5.1367 6.83039 4.9209C6.55459 4.7051 6.18538 4.5967 5.72348 4.5967C5.09358 4.5967 4.59559 4.8115 4.22939 5.2403C3.86369 5.6695 3.68058 6.2589 3.68058 7.0089C3.68058 7.753 3.86369 8.338 4.22939 8.7638C4.59559 9.1901 5.09368 9.403 5.72348 9.403C6.18538 9.403 6.55459 9.3009 6.83039 9.0968C7.10629 8.8932 7.28649 8.6139 7.37039 8.2599H8.43238C8.30638 8.8839 8.00948 9.3732 7.54128 9.7272C7.07348 10.0812 6.47049 10.258 5.73219 10.258Z"
        />
        <path
          d="M12.6003 10.258C11.9763 10.258 11.4382 10.1218 10.9851 9.8488C10.532 9.5758 10.1824 9.1945 9.93685 8.7057C9.69075 8.2164 9.56775 7.651 9.56775 7.0089C9.56775 6.361 9.69075 5.7926 9.93685 5.3033C10.1824 4.8145 10.532 4.4322 10.9851 4.1558C11.4382 3.8799 11.9763 3.7417 12.6003 3.7417C13.3386 3.7417 13.9416 3.9219 14.4094 4.2817C14.8777 4.6421 15.1745 5.146 15.3005 5.7939H14.2385C14.1545 5.4282 13.9743 5.1367 13.6985 4.9209C13.4227 4.7051 13.0535 4.5967 12.5916 4.5967C11.9617 4.5967 11.4637 4.8115 11.0975 5.2403C10.7318 5.6695 10.5487 6.2589 10.5487 7.0089C10.5487 7.753 10.7318 8.338 11.0975 8.7638C11.4637 9.1901 11.9618 9.403 12.5916 9.403C13.0535 9.403 13.4227 9.3009 13.6985 9.0968C13.9744 8.8932 14.1546 8.6139 14.2385 8.2599H15.3005C15.1745 8.8839 14.8776 9.3732 14.4094 9.7272C13.9416 10.0812 13.3386 10.258 12.6003 10.258Z"
        />
        <path
          d="M15.9891 1C16.5465 1 17 1.4535 17 2.011V11.9891C17 12.5465 16.5465 13 15.9891 13H2.0109C1.4535 13 1 12.5465 1 11.9891V2.0109C1 1.4535 1.4535 0.9999 2.0109 0.9999L15.9891 1ZM15.9891 0H2.0109C0.9003 0 0 0.9003 0 2.0109V11.9891C0 13.0997 0.9003 14 2.0109 14H15.9891C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.9891 0Z"
        />
      </svg>
    </media-captions-menu-button>
    <media-captions-menu
      hidden
      anchor="auto"
      part="bottom captions menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      exportparts="menu-item"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg></div
    ></media-captions-menu>
  </template>

  <template partial="AirplayButton">
    <media-airplay-button part="bottom airplay button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="icon">
        <path
          d="M16.1383 0H1.8618C0.8335 0 0 0.8335 0 1.8617V10.1382C0 11.1664 0.8335 12 1.8618 12H3.076C3.1204 11.9433 3.1503 11.8785 3.2012 11.826L4.004 11H1.8618C1.3866 11 1 10.6134 1 10.1382V1.8617C1 1.3865 1.3866 0.9999 1.8618 0.9999H16.1383C16.6135 0.9999 17.0001 1.3865 17.0001 1.8617V10.1382C17.0001 10.6134 16.6135 11 16.1383 11H13.9961L14.7989 11.826C14.8499 11.8785 14.8798 11.9432 14.9241 12H16.1383C17.1665 12 18.0001 11.1664 18.0001 10.1382V1.8617C18 0.8335 17.1665 0 16.1383 0Z"
        />
        <path
          d="M9.55061 8.21903C9.39981 8.06383 9.20001 7.98633 9.00011 7.98633C8.80021 7.98633 8.60031 8.06383 8.44951 8.21903L4.09771 12.697C3.62471 13.1838 3.96961 13.9998 4.64831 13.9998H13.3518C14.0304 13.9998 14.3754 13.1838 13.9023 12.697L9.55061 8.21903Z"
        />
      </svg>
    </media-airplay-button>
  </template>

  <template partial="FullscreenButton">
    <media-fullscreen-button part="bottom fullscreen button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="enter">
        <path
          d="M1.00745 4.39539L1.01445 1.98789C1.01605 1.43049 1.47085 0.978289 2.02835 0.979989L6.39375 0.992589L6.39665 -0.007411L2.03125 -0.020011C0.920646 -0.023211 0.0176463 0.874489 0.0144463 1.98509L0.00744629 4.39539H1.00745Z"
        />
        <path
          d="M17.0144 2.03431L17.0076 4.39541H18.0076L18.0144 2.03721C18.0176 0.926712 17.1199 0.0237125 16.0093 0.0205125L11.6439 0.0078125L11.641 1.00781L16.0064 1.02041C16.5638 1.02201 17.016 1.47681 17.0144 2.03431Z"
        />
        <path
          d="M16.9925 9.60498L16.9855 12.0124C16.9839 12.5698 16.5291 13.022 15.9717 13.0204L11.6063 13.0078L11.6034 14.0078L15.9688 14.0204C17.0794 14.0236 17.9823 13.1259 17.9855 12.0153L17.9925 9.60498H16.9925Z"
        />
        <path
          d="M0.985626 11.9661L0.992426 9.60498H-0.0074737L-0.0142737 11.9632C-0.0174737 13.0738 0.880226 13.9767 1.99083 13.98L6.35623 13.9926L6.35913 12.9926L1.99373 12.98C1.43633 12.9784 0.983926 12.5236 0.985626 11.9661Z"
        />
      </svg>
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="exit">
        <path
          d="M5.39655 -0.0200195L5.38955 2.38748C5.38795 2.94488 4.93315 3.39708 4.37565 3.39538L0.0103463 3.38278L0.00744629 4.38278L4.37285 4.39538C5.48345 4.39858 6.38635 3.50088 6.38965 2.39028L6.39665 -0.0200195H5.39655Z"
        />
        <path
          d="M12.6411 2.36891L12.6479 0.0078125H11.6479L11.6411 2.36601C11.6379 3.47651 12.5356 4.37951 13.6462 4.38271L18.0116 4.39531L18.0145 3.39531L13.6491 3.38271C13.0917 3.38111 12.6395 2.92641 12.6411 2.36891Z"
        />
        <path
          d="M12.6034 14.0204L12.6104 11.613C12.612 11.0556 13.0668 10.6034 13.6242 10.605L17.9896 10.6176L17.9925 9.61759L13.6271 9.60499C12.5165 9.60179 11.6136 10.4995 11.6104 11.6101L11.6034 14.0204H12.6034Z"
        />
        <path
          d="M5.359 11.6315L5.3522 13.9926H6.3522L6.359 11.6344C6.3622 10.5238 5.4645 9.62088 4.3539 9.61758L-0.0115043 9.60498L-0.0144043 10.605L4.351 10.6176C4.9084 10.6192 5.3607 11.074 5.359 11.6315Z"
        />
      </svg>
    </media-fullscreen-button>
  </template>

  <template partial="CastButton">
    <media-cast-button part="bottom cast button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="enter">
        <path
          d="M16.0072 0H2.0291C0.9185 0 0.0181 0.9003 0.0181 2.011V5.5009C0.357 5.5016 0.6895 5.5275 1.0181 5.5669V2.011C1.0181 1.4536 1.4716 1 2.029 1H16.0072C16.5646 1 17.0181 1.4536 17.0181 2.011V11.9891C17.0181 12.5465 16.5646 13 16.0072 13H8.4358C8.4746 13.3286 8.4999 13.6611 8.4999 13.9999H16.0071C17.1177 13.9999 18.018 13.0996 18.018 11.989V2.011C18.0181 0.9003 17.1178 0 16.0072 0ZM0 6.4999V7.4999C3.584 7.4999 6.5 10.4159 6.5 13.9999H7.5C7.5 9.8642 4.1357 6.4999 0 6.4999ZM0 8.7499V9.7499C2.3433 9.7499 4.25 11.6566 4.25 13.9999H5.25C5.25 11.1049 2.895 8.7499 0 8.7499ZM0.0181 11V14H3.0181C3.0181 12.3431 1.675 11 0.0181 11Z"
        />
      </svg>
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="exit">
        <path
          d="M15.9891 0H2.01103C0.900434 0 3.35947e-05 0.9003 3.35947e-05 2.011V5.5009C0.338934 5.5016 0.671434 5.5275 1.00003 5.5669V2.011C1.00003 1.4536 1.45353 1 2.01093 1H15.9891C16.5465 1 17 1.4536 17 2.011V11.9891C17 12.5465 16.5465 13 15.9891 13H8.41773C8.45653 13.3286 8.48183 13.6611 8.48183 13.9999H15.989C17.0996 13.9999 17.9999 13.0996 17.9999 11.989V2.011C18 0.9003 17.0997 0 15.9891 0ZM-0.0180664 6.4999V7.4999C3.56593 7.4999 6.48193 10.4159 6.48193 13.9999H7.48193C7.48193 9.8642 4.11763 6.4999 -0.0180664 6.4999ZM-0.0180664 8.7499V9.7499C2.32523 9.7499 4.23193 11.6566 4.23193 13.9999H5.23193C5.23193 11.1049 2.87693 8.7499 -0.0180664 8.7499ZM3.35947e-05 11V14H3.00003C3.00003 12.3431 1.65693 11 3.35947e-05 11Z"
        />
        <path d="M2.15002 5.634C5.18352 6.4207 7.57252 8.8151 8.35282 11.8499H15.8501V2.1499H2.15002V5.634Z" />
      </svg>
    </media-cast-button>
  </template>

  <template partial="LiveButton">
    <media-live-button part="{{section ?? 'top'}} live button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <span slot="text">Live</span>
    </media-live-button>
  </template>

  <template partial="PlaybackRateMenu">
    <media-playback-rate-menu-button part="bottom playback-rate button"></media-playback-rate-menu-button>
    <media-playback-rate-menu
      hidden
      anchor="auto"
      rates="{{playbackrates}}"
      exportparts="menu-item"
      part="bottom playback-rate menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-playback-rate-menu>
  </template>

  <template partial="VolumeRange">
    <media-volume-range
      part="bottom volume range"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-volume-range>
  </template>

  <template partial="TimeDisplay">
    <media-time-display
      remaining="{{defaultshowremainingtime}}"
      showduration="{{!hideduration}}"
      part="bottom time display"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-time-display>
  </template>

  <template partial="TimeRange">
    <media-time-range part="bottom time range" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <media-preview-thumbnail slot="preview"></media-preview-thumbnail>
      <media-preview-chapter-display slot="preview"></media-preview-chapter-display>
      <media-preview-time-display slot="preview"></media-preview-time-display>
      <div slot="preview" part="arrow"></div>
    </media-time-range>
  </template>

  <template partial="AudioTrackMenu">
    <media-audio-track-menu-button part="bottom audio-track button">
      <svg aria-hidden="true" slot="icon" viewBox="0 0 18 16">
        <path d="M9 15A7 7 0 1 1 9 1a7 7 0 0 1 0 14Zm0 1A8 8 0 1 0 9 0a8 8 0 0 0 0 16Z" />
        <path
          d="M5.2 6.3a.5.5 0 0 1 .5.5v2.4a.5.5 0 1 1-1 0V6.8a.5.5 0 0 1 .5-.5Zm2.4-2.4a.5.5 0 0 1 .5.5v7.2a.5.5 0 0 1-1 0V4.4a.5.5 0 0 1 .5-.5ZM10 5.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.4-.8a.5.5 0 0 1 .5.5v5.6a.5.5 0 0 1-1 0V5.2a.5.5 0 0 1 .5-.5Z"
        />
      </svg>
    </media-audio-track-menu-button>
    <media-audio-track-menu
      hidden
      anchor="auto"
      part="bottom audio-track menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      exportparts="menu-item"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg>
      </div>
    </media-audio-track-menu>
  </template>

  <template partial="RenditionMenu">
    <media-rendition-menu-button part="bottom rendition button">
      <svg aria-hidden="true" slot="icon" viewBox="0 0 18 14">
        <path
          d="M2.25 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.75 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        />
      </svg>
    </media-rendition-menu-button>
    <media-rendition-menu
      hidden
      anchor="auto"
      part="bottom rendition menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg>
      </div>
    </media-rendition-menu>
  </template>

  <media-controller
    part="controller"
    defaultstreamtype="{{defaultstreamtype ?? 'on-demand'}}"
    breakpoints="sm:470"
    gesturesdisabled="{{disabled}}"
    hotkeys="{{hotkeys}}"
    nohotkeys="{{nohotkeys}}"
    novolumepref="{{novolumepref}}"
    audio="{{audio}}"
    noautoseektolive="{{noautoseektolive}}"
    defaultsubtitles="{{defaultsubtitles}}"
    defaultduration="{{defaultduration ?? false}}"
    keyboardforwardseekoffset="{{forwardseekoffset}}"
    keyboardbackwardseekoffset="{{backwardseekoffset}}"
    exportparts="layer, media-layer, poster-layer, vertical-layer, centered-layer, gesture-layer"
    style="--_pre-playback-place:{{preplaybackplace ?? 'center'}}"
  >
    <slot name="media" slot="media"></slot>
    <slot name="poster" slot="poster"></slot>

    <media-loading-indicator slot="centered-chrome" noautohide></media-loading-indicator>

    <template if="!audio">
      <!-- Pre-playback UI -->
      <!-- same for both on-demand and live -->
      <div slot="centered-chrome" class="center-controls pre-playback">
        <template if="!breakpointsm">{{>PlayButton section="center"}}</template>
        <template if="breakpointsm">{{>PrePlayButton section="center"}}</template>
      </div>

      <!-- Autoplay centered unmute button -->
      <!--
        todo: figure out how show this with available state variables
        needs to show when:
        - autoplay is enabled
        - playback has been successful
        - audio is muted
        - in place / instead of the pre-plaback play button
        - not to show again after user has interacted with this button
          - OR user has interacted with the mute button in the control bar
      -->
      <!--
        There should be a >MuteButton to the left of the "Unmute" text, but a templating bug
        makes it appear even if commented out in the markup, add it back when code is un-commented
      -->
      <!-- <div slot="centered-chrome" class="autoplay-unmute">
        <div role="button" class="autoplay-unmute-btn">Unmute</div>
      </div> -->

      <template if="streamtype == 'on-demand'">
        <template if="breakpointsm">
          <media-control-bar part="control-bar top" slot="top-chrome">{{>TitleDisplay}} </media-control-bar>
        </template>
        {{>TimeRange}}
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}} {{>SeekBackwardButton}} {{>SeekForwardButton}} {{>TimeDisplay}} {{>MuteButton}}
          {{>VolumeRange}}
          <div class="spacer"></div>
          {{>RenditionMenu}} {{>PlaybackRateMenu}} {{>AudioTrackMenu}} {{>CaptionsMenu}} {{>AirplayButton}}
          {{>CastButton}} {{>PipButton}} {{>FullscreenButton}}
        </media-control-bar>
      </template>

      <template if="streamtype == 'live'">
        <media-control-bar part="control-bar top" slot="top-chrome">
          {{>LiveButton}}
          <template if="breakpointsm"> {{>TitleDisplay}} </template>
        </media-control-bar>
        <template if="targetlivewindow > 0">{{>TimeRange}}</template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}}
          <template if="targetlivewindow > 0">{{>SeekBackwardButton}} {{>SeekForwardButton}}</template>
          {{>MuteButton}} {{>VolumeRange}}
          <div class="spacer"></div>
          {{>RenditionMenu}} {{>AudioTrackMenu}} {{>CaptionsMenu}} {{>AirplayButton}} {{>CastButton}} {{>PipButton}}
          {{>FullscreenButton}}
        </media-control-bar>
      </template>
    </template>

    <template if="audio">
      <template if="streamtype == 'on-demand'">
        <template if="title">
          <media-control-bar part="control-bar top">{{>TitleDisplay}}</media-control-bar>
        </template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}}
          <template if="breakpointsm"> {{>SeekBackwardButton}} {{>SeekForwardButton}} </template>
          {{>MuteButton}}
          <template if="breakpointsm">{{>VolumeRange}}</template>
          {{>TimeDisplay}} {{>TimeRange}}
          <template if="breakpointsm">{{>PlaybackRateMenu}}</template>
          {{>AirplayButton}} {{>CastButton}}
        </media-control-bar>
      </template>

      <template if="streamtype == 'live'">
        <template if="title">
          <media-control-bar part="control-bar top">{{>TitleDisplay}}</media-control-bar>
        </template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}} {{>LiveButton section="bottom"}} {{>MuteButton}}
          <template if="breakpointsm">
            {{>VolumeRange}}
            <template if="targetlivewindow > 0"> {{>SeekBackwardButton}} {{>SeekForwardButton}} </template>
          </template>
          <template if="targetlivewindow > 0"> {{>TimeDisplay}} {{>TimeRange}} </template>
          <template if="!targetlivewindow"><div class="spacer"></div></template>
          {{>AirplayButton}} {{>CastButton}}
        </media-control-bar>
      </template>
    </template>

    <slot></slot>
  </media-controller>
</template>
`;function um({anchor:i,floating:e,placement:t}){let a=Dv({anchor:i,floating:e}),{x:r,y:n}=Nv(a,t);return{x:r,y:n}}function Dv({anchor:i,floating:e}){return{anchor:Ov(i,e.offsetParent),floating:{x:0,y:0,width:e.offsetWidth,height:e.offsetHeight}}}function Ov(i,e){var t;let a=i.getBoundingClientRect(),r=(t=e==null?void 0:e.getBoundingClientRect())!=null?t:{x:0,y:0};return{x:a.x-r.x,y:a.y-r.y,width:a.width,height:a.height}}function Nv({anchor:i,floating:e},t){let a=Pv(t)==="x"?"y":"x",r=a==="y"?"height":"width",n=cm(t),s=i.x+i.width/2-e.width/2,l=i.y+i.height/2-e.height/2,u=i[r]/2-e[r]/2,c;switch(n){case"top":c={x:s,y:i.y-e.height};break;case"bottom":c={x:s,y:i.y+i.height};break;case"right":c={x:i.x+i.width,y:l};break;case"left":c={x:i.x-e.width,y:l};break;default:c={x:i.x,y:i.y}}switch(t.split("-")[1]){case"start":c[a]-=u;break;case"end":c[a]+=u;break}return c}function cm(i){return i.split("-")[0]}function Pv(i){return["top","bottom"].includes(cm(i))?"y":"x"}var Dt=class extends Event{constructor({action:e="auto",relatedTarget:t,...a}){super("invoke",a),this.action=e,this.relatedTarget=t}},qn=class extends Event{constructor({newState:e,oldState:t,...a}){super("toggle",a),this.newState=e,this.oldState=t}};var Ll=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},U=(i,e,t)=>(Ll(i,e,"read from private field"),t?t.call(i):e.get(i)),K=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Xe=(i,e,t,a)=>(Ll(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),G=(i,e,t)=>(Ll(i,e,"access private method"),t),Je,ci,Ot,Zn,Qn,mi,er,bl,mm,Jn,zn,gl,_l,hm,Al,pm,Tl,vm,Gi,qi,Zi,tr,jn,Rl,yl,fm,wl,Em,kl,bm,xl,gm,Sl,_m,Il,Am,Ja,eo,Cl,Tm,ja,to,Xn,Ml;function je({type:i,text:e,value:t,checked:a}){let r=m.createElement("media-chrome-menu-item");r.type=i!=null?i:"",r.part.add("menu-item"),i&&r.part.add(i),r.value=t,r.checked=a;let n=m.createElement("span");return n.textContent=e,r.append(n),r}function Ne(i,e){let t=i.querySelector(`:scope > [slot="${e}"]`);if((t==null?void 0:t.nodeName)=="SLOT"&&(t=t.assignedElements({flatten:!0})[0]),t)return t=t.cloneNode(!0),t;let a=i.shadowRoot.querySelector(`[name="${e}"] > svg`);return a?a.cloneNode(!0):""}var ym=m.createElement("template");ym.innerHTML=`
  <style>
    :host {
      font: var(--media-font,
        var(--media-font-weight, normal)
        var(--media-font-size, 14px) /
        var(--media-text-content-height, var(--media-control-height, 24px))
        var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
      color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
      background: var(--media-menu-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .8))));
      border-radius: var(--media-menu-border-radius);
      border: var(--media-menu-border, none);
      display: var(--media-menu-display, inline-flex);
      transition: var(--media-menu-transition-in,
        visibility 0s,
        opacity .2s ease-out,
        transform .15s ease-out,
        left .2s ease-in-out,
        min-width .2s ease-in-out,
        min-height .2s ease-in-out
      ) !important;
      
      visibility: var(--media-menu-visibility, visible);
      opacity: var(--media-menu-opacity, 1);
      max-height: var(--media-menu-max-height, var(--_menu-max-height, 300px));
      transform: var(--media-menu-transform-in, translateY(0) scale(1));
      flex-direction: column;
      
      min-height: 0;
      position: relative;
      bottom: var(--_menu-bottom);
      box-sizing: border-box;
    }

    :host([hidden]) {
      transition: var(--media-menu-transition-out,
        visibility .15s ease-in,
        opacity .15s ease-in,
        transform .15s ease-in
      ) !important;
      visibility: var(--media-menu-hidden-visibility, hidden);
      opacity: var(--media-menu-hidden-opacity, 0);
      max-height: var(--media-menu-hidden-max-height,
        var(--media-menu-max-height, var(--_menu-max-height, 300px)));
      transform: var(--media-menu-transform-out, translateY(2px) scale(.99));
      pointer-events: none;
    }

    :host([slot="submenu"]) {
      background: none;
      width: 100%;
      min-height: 100%;
      position: absolute;
      bottom: 0;
      right: -100%;
    }

    #container {
      display: flex;
      flex-direction: column;
      min-height: 0;
      transition: transform .2s ease-out;
      transform: translate(0, 0);
    }

    #container.has-expanded {
      transition: transform .2s ease-in;
      transform: translate(-100%, 0);
    }

    button {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      outline: inherit;
      display: inline-flex;
      align-items: center;
    }

    slot[name="header"][hidden] {
      display: none;
    }

    slot[name="header"] > *,
    slot[name="header"]::slotted(*) {
      padding: .4em .7em;
      border-bottom: 1px solid rgb(255 255 255 / .25);
      cursor: default;
    }

    slot[name="header"] > button[part~="back"],
    slot[name="header"]::slotted(button[part~="back"]) {
      cursor: pointer;
    }

    svg[part~="back"] {
      height: var(--media-menu-icon-height, var(--media-control-height, 24px));
      fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
      display: block;
      margin-right: .5ch;
    }

    slot:not([name]) {
      gap: var(--media-menu-gap);
      flex-direction: var(--media-menu-flex-direction, column);
      overflow: var(--media-menu-overflow, hidden auto);
      display: flex;
      min-height: 0;
    }

    :host([role="menu"]) slot:not([name]) {
      padding-block: .4em;
    }

    slot:not([name])::slotted([role="menu"]) {
      background: none;
    }

    media-chrome-menu-item > span {
      margin-right: .5ch;
      max-width: var(--media-menu-item-max-width);
      text-overflow: ellipsis;
      overflow: hidden;
    }
  </style>
  <style id="layout-row" media="width:0">

    slot[name="header"] > *,
    slot[name="header"]::slotted(*) {
      padding: .4em .5em;
    }

    slot:not([name]) {
      gap: var(--media-menu-gap, .25em);
      flex-direction: var(--media-menu-flex-direction, row);
      padding-inline: .5em;
    }

    media-chrome-menu-item {
      padding: .3em .5em;
    }

    media-chrome-menu-item[aria-checked="true"] {
      background: var(--media-menu-item-checked-background, rgb(255 255 255 / .2));
    }

    
    media-chrome-menu-item::part(checked-indicator) {
      display: var(--media-menu-item-checked-indicator-display, none);
    }
  </style>
  <div id="container">
    <slot name="header" hidden>
      <button part="back button" aria-label="Back to previous menu">
        <slot name="back-icon">
          <svg aria-hidden="true" viewBox="0 0 20 24" part="back indicator">
            <path d="m11.88 17.585.742-.669-4.2-4.665 4.2-4.666-.743-.669-4.803 5.335 4.803 5.334Z"/>
          </svg>
        </slot>
        <slot name="title"></slot>
      </button>
    </slot>
    <slot></slot>
  </div>
  <slot name="checked-indicator" hidden></slot>
`;var ui={STYLE:"style",HIDDEN:"hidden",DISABLED:"disabled",ANCHOR:"anchor"},le=class extends d.HTMLElement{constructor(){super(),K(this,bl),K(this,zn),K(this,_l),K(this,Al),K(this,Tl),K(this,Zi),K(this,jn),K(this,yl),K(this,wl),K(this,kl),K(this,xl),K(this,Sl),K(this,Il),K(this,Ja),K(this,Cl),K(this,ja),K(this,Xn),K(this,Je,null),K(this,ci,null),K(this,Ot,null),K(this,Zn,new Set),K(this,Qn,void 0),K(this,mi,!1),K(this,er,null),K(this,Jn,()=>{let e=U(this,Zn),t=new Set(this.items);for(let a of e)t.has(a)||this.dispatchEvent(new CustomEvent("removemenuitem",{detail:a}));for(let a of t)e.has(a)||this.dispatchEvent(new CustomEvent("addmenuitem",{detail:a}));Xe(this,Zn,t)}),K(this,Gi,()=>{G(this,Zi,tr).call(this),G(this,jn,Rl).call(this,!1)}),K(this,qi,()=>{G(this,Zi,tr).call(this)}),this.shadowRoot||(this.attachShadow({mode:"open"}),this.nativeEl=this.constructor.template.content.cloneNode(!0),this.shadowRoot.append(this.nativeEl)),this.container=this.shadowRoot.querySelector("#container"),this.defaultSlot=this.shadowRoot.querySelector("slot:not([name])"),this.shadowRoot.addEventListener("slotchange",this),Xe(this,Qn,new MutationObserver(U(this,Jn))),U(this,Qn).observe(this.defaultSlot,{childList:!0})}static get observedAttributes(){return[ui.DISABLED,ui.HIDDEN,ui.STYLE,ui.ANCHOR,k.MEDIA_CONTROLLER]}static formatMenuItemText(e){return e}enable(){this.addEventListener("click",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this),this.addEventListener("invoke",this),this.addEventListener("toggle",this)}disable(){this.removeEventListener("click",this),this.removeEventListener("focusout",this),this.removeEventListener("keyup",this),this.removeEventListener("invoke",this),this.removeEventListener("toggle",this)}handleEvent(e){switch(e.type){case"slotchange":G(this,bl,mm).call(this,e);break;case"invoke":G(this,_l,hm).call(this,e);break;case"click":G(this,yl,fm).call(this,e);break;case"toggle":G(this,kl,bm).call(this,e);break;case"focusout":G(this,Sl,_m).call(this,e);break;case"keydown":G(this,Il,Am).call(this,e);break}}connectedCallback(){var e,t;Xe(this,er,Fo(this.shadowRoot,":host")),G(this,zn,gl).call(this),this.hasAttribute("disabled")||this.enable(),this.role||(this.role="menu"),Xe(this,Je,Mr(this)),(t=(e=U(this,Je))==null?void 0:e.associateElement)==null||t.call(e,this),this.hidden||(st(ir(this),U(this,Gi)),st(this,U(this,qi)))}disconnectedCallback(){var e,t;Wt(ir(this),U(this,Gi)),Wt(this,U(this,qi)),this.disable(),(t=(e=U(this,Je))==null?void 0:e.unassociateElement)==null||t.call(e,this),Xe(this,Je,null)}attributeChangedCallback(e,t,a){var r,n,s,l;e===ui.HIDDEN&&a!==t?(U(this,mi)||Xe(this,mi,!0),this.hidden?G(this,Tl,vm).call(this):G(this,Al,pm).call(this),this.dispatchEvent(new qn({oldState:this.hidden?"open":"closed",newState:this.hidden?"closed":"open",bubbles:!0}))):e===k.MEDIA_CONTROLLER?(t&&((n=(r=U(this,Je))==null?void 0:r.unassociateElement)==null||n.call(r,this),Xe(this,Je,null)),a&&this.isConnected&&(Xe(this,Je,Mr(this)),(l=(s=U(this,Je))==null?void 0:s.associateElement)==null||l.call(s,this))):e===ui.DISABLED&&a!==t?a==null?this.enable():this.disable():e===ui.STYLE&&a!==t&&G(this,zn,gl).call(this)}formatMenuItemText(e,t){return this.constructor.formatMenuItemText(e,t)}get anchor(){return this.getAttribute("anchor")}set anchor(e){this.setAttribute("anchor",`${e}`)}get anchorElement(){var e;return this.anchor?(e=$t(this))==null?void 0:e.querySelector(`#${this.anchor}`):null}get items(){return this.defaultSlot.assignedElements({flatten:!0}).filter(Uv)}get radioGroupItems(){return this.items.filter(e=>e.role==="menuitemradio")}get checkedItems(){return this.items.filter(e=>e.checked)}get value(){var e,t;return(t=(e=this.checkedItems[0])==null?void 0:e.value)!=null?t:""}set value(e){let t=this.items.find(a=>a.value===e);t&&G(this,Xn,Ml).call(this,t)}focus(){if(Xe(this,ci,ba()),this.items.length){G(this,ja,to).call(this,this.items[0]),this.items[0].focus();return}let e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');e==null||e.focus()}handleSelect(e){var t;let a=G(this,Ja,eo).call(this,e);a&&(G(this,Xn,Ml).call(this,a,a.type==="checkbox"),U(this,Ot)&&!this.hidden&&((t=U(this,ci))==null||t.focus(),this.hidden=!0))}get keysUsed(){return["Enter","Escape","Tab"," ","ArrowDown","ArrowUp","Home","End"]}handleMove(e){var t,a;let{key:r}=e,n=this.items,s=(a=(t=G(this,Ja,eo).call(this,e))!=null?t:G(this,Cl,Tm).call(this))!=null?a:n[0],l=n.indexOf(s),u=Math.max(0,l);r==="ArrowDown"?u++:r==="ArrowUp"?u--:e.key==="Home"?u=0:e.key==="End"&&(u=n.length-1),u<0&&(u=n.length-1),u>n.length-1&&(u=0),G(this,ja,to).call(this,n[u]),n[u].focus()}};Je=new WeakMap;ci=new WeakMap;Ot=new WeakMap;Zn=new WeakMap;Qn=new WeakMap;mi=new WeakMap;er=new WeakMap;bl=new WeakSet;mm=function(i){let e=i.target;for(let t of e.assignedNodes({flatten:!0}))t.nodeType===3&&t.textContent.trim()===""&&t.remove();if(["header","title"].includes(e.name)){let t=this.shadowRoot.querySelector('slot[name="header"]');t.hidden=e.assignedNodes().length===0}e.name||U(this,Jn).call(this)};Jn=new WeakMap;zn=new WeakSet;gl=function(){var i;let e=this.shadowRoot.querySelector("#layout-row"),t=(i=getComputedStyle(this).getPropertyValue("--media-menu-layout"))==null?void 0:i.trim();e.setAttribute("media",t==="row"?"":"width:0")};_l=new WeakSet;hm=function(i){Xe(this,Ot,i.relatedTarget),ce(this,i.relatedTarget)||(this.hidden=!this.hidden)};Al=new WeakSet;pm=function(){var i;(i=U(this,Ot))==null||i.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0}),st(ir(this),U(this,Gi)),st(this,U(this,qi))};Tl=new WeakSet;vm=function(){var i;(i=U(this,Ot))==null||i.setAttribute("aria-expanded","false"),Wt(ir(this),U(this,Gi)),Wt(this,U(this,qi))};Gi=new WeakMap;qi=new WeakMap;Zi=new WeakSet;tr=function(i){if(this.hasAttribute("mediacontroller")&&!this.anchor||this.hidden||!this.anchorElement)return;let{x:e,y:t}=um({anchor:this.anchorElement,floating:this,placement:"top-start"});i!=null||(i=this.offsetWidth);let r=ir(this).getBoundingClientRect(),n=r.width-e-i,s=r.height-t-this.offsetHeight,{style:l}=U(this,er);l.setProperty("position","absolute"),l.setProperty("right",`${Math.max(0,n)}px`),l.setProperty("--_menu-bottom",`${s}px`);let u=getComputedStyle(this),b=l.getPropertyValue("--_menu-bottom")===u.bottom?s:parseFloat(u.bottom),g=r.height-b-parseFloat(u.marginBottom);this.style.setProperty("--_menu-max-height",`${g}px`)};jn=new WeakSet;Rl=function(i){let e=this.querySelector('[role="menuitem"][aria-haspopup][aria-expanded="true"]'),t=e==null?void 0:e.querySelector('[role="menu"]'),{style:a}=U(this,er);if(i||a.setProperty("--media-menu-transition-in","none"),t){let r=t.offsetHeight,n=Math.max(t.offsetWidth,e.offsetWidth);this.style.setProperty("min-width",`${n}px`),this.style.setProperty("min-height",`${r}px`),G(this,Zi,tr).call(this,n)}else this.style.removeProperty("min-width"),this.style.removeProperty("min-height"),G(this,Zi,tr).call(this);a.removeProperty("--media-menu-transition-in")};yl=new WeakSet;fm=function(i){var e;if(i.stopPropagation(),i.composedPath().includes(U(this,wl,Em))){(e=U(this,ci))==null||e.focus(),this.hidden=!0;return}let t=G(this,Ja,eo).call(this,i);!t||t.hasAttribute("disabled")||(G(this,ja,to).call(this,t),this.handleSelect(i))};wl=new WeakSet;Em=function(){var i;return(i=this.shadowRoot.querySelector('slot[name="header"]').assignedElements({flatten:!0}))==null?void 0:i.find(t=>t.matches('button[part~="back"]'))};kl=new WeakSet;bm=function(i){if(i.target===this)return;G(this,xl,gm).call(this);let e=Array.from(this.querySelectorAll('[role="menuitem"][aria-haspopup]'));for(let t of e)t.invokeTargetElement!=i.target&&i.newState=="open"&&t.getAttribute("aria-expanded")=="true"&&!t.invokeTargetElement.hidden&&t.invokeTargetElement.dispatchEvent(new Dt({relatedTarget:t}));for(let t of e)t.setAttribute("aria-expanded",`${!t.submenuElement.hidden}`);G(this,jn,Rl).call(this,!0)};xl=new WeakSet;gm=function(){let e=this.querySelector('[role="menuitem"] > [role="menu"]:not([hidden])');this.container.classList.toggle("has-expanded",!!e)};Sl=new WeakSet;_m=function(i){var e;ce(this,i.relatedTarget)||(U(this,mi)&&((e=U(this,ci))==null||e.focus()),U(this,Ot)&&U(this,Ot)!==i.relatedTarget&&!this.hidden&&(this.hidden=!0))};Il=new WeakSet;Am=function(i){var e,t,a,r,n;let{key:s,ctrlKey:l,altKey:u,metaKey:c}=i;if(!(l||u||c)&&this.keysUsed.includes(s))if(i.preventDefault(),i.stopPropagation(),s==="Tab"){if(U(this,mi)){this.hidden=!0;return}i.shiftKey?(t=(e=this.previousElementSibling)==null?void 0:e.focus)==null||t.call(e):(r=(a=this.nextElementSibling)==null?void 0:a.focus)==null||r.call(a),this.blur()}else s==="Escape"?((n=U(this,ci))==null||n.focus(),U(this,mi)&&(this.hidden=!0)):s==="Enter"||s===" "?this.handleSelect(i):this.handleMove(i)};Ja=new WeakSet;eo=function(i){return i.composedPath().find(e=>["menuitemradio","menuitemcheckbox"].includes(e.role))};Cl=new WeakSet;Tm=function(){return this.items.find(i=>i.tabIndex===0)};ja=new WeakSet;to=function(i){for(let e of this.items)e.tabIndex=e===i?0:-1};Xn=new WeakSet;Ml=function(i,e){let t=[...this.checkedItems];i.type==="radio"&&this.radioGroupItems.forEach(a=>a.checked=!1),e?i.checked=!i.checked:i.checked=!0,this.checkedItems.some((a,r)=>a!=t[r])&&this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))};le.template=ym;function Uv(i){return["menuitem","menuitemradio","menuitemcheckbox"].includes(i==null?void 0:i.role)}function ir(i){var e;return(e=i.getAttribute("bounds")?Ue(i,`#${i.getAttribute("bounds")}`):Z(i)||i.parentElement)!=null?e:i}d.customElements.get("media-chrome-menu")||d.customElements.define("media-chrome-menu",le);var Bl=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},tt=(i,e,t)=>(Bl(i,e,"read from private field"),t?t.call(i):e.get(i)),ft=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Dl=(i,e,t,a)=>(Bl(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),et=(i,e,t)=>(Bl(i,e,"access private method"),t),io,rr,Ol,km,Hl,Sm,Wl,Im,it,Qi,nr,Nl,Cm,ao,Pl,Mm=m.createElement("template");Mm.innerHTML=`
  <style>
    :host {
      transition: var(--media-menu-item-transition,
        background .15s linear,
        opacity .2s ease-in-out
      );
      outline: var(--media-menu-item-outline, 0);
      outline-offset: var(--media-menu-item-outline-offset, -1px);
      cursor: pointer;
      display: flex;
      align-items: center;
      align-self: stretch;
      justify-self: stretch;
      white-space: nowrap;
      white-space-collapse: collapse;
      text-wrap: nowrap;
      padding: .4em .8em .4em 1em;
    }

    :host(:focus-visible) {
      box-shadow: var(--media-menu-item-focus-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
      outline: var(--media-menu-item-hover-outline, 0);
      outline-offset: var(--media-menu-item-hover-outline-offset,  var(--media-menu-item-outline-offset, -1px));
    }

    :host(:hover) {
      cursor: pointer;
      background: var(--media-menu-item-hover-background, rgb(92 92 102 / .5));
      outline: var(--media-menu-item-hover-outline);
      outline-offset: var(--media-menu-item-hover-outline-offset,  var(--media-menu-item-outline-offset, -1px));
    }

    :host([aria-checked="true"]) {
      background: var(--media-menu-item-checked-background);
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      pointer-events: none;
      color: rgba(255, 255, 255, .3);
    }

    slot:not([name]) {
      width: 100%;
    }

    slot:not([name="submenu"]) {
      display: inline-flex;
      align-items: center;
      transition: inherit;
      opacity: var(--media-menu-item-opacity, 1);
    }

    slot[name="description"] {
      justify-content: end;
    }

    slot[name="description"] > span {
      display: inline-block;
      margin-inline: 1em .2em;
      max-width: var(--media-menu-item-description-max-width, 100px);
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: .8em;
      font-weight: 400;
      text-align: right;
      position: relative;
      top: .04em;
    }

    slot[name="checked-indicator"] {
      display: none;
    }

    :host(:is([role="menuitemradio"],[role="menuitemcheckbox"])) slot[name="checked-indicator"] {
      display: var(--media-menu-item-checked-indicator-display, inline-block);
    }

    
    svg, img, ::slotted(svg), ::slotted(img) {
      height: var(--media-menu-item-icon-height, var(--media-control-height, 24px));
      fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
      display: block;
    }

    
    [part~="indicator"],
    ::slotted([part~="indicator"]) {
      fill: var(--media-menu-item-indicator-fill,
        var(--media-icon-color, var(--media-primary-color, rgb(238 238 238))));
      height: var(--media-menu-item-indicator-height, 1.25em);
      margin-right: .5ch;
    }

    [part~="checked-indicator"] {
      visibility: hidden;
    }

    :host([aria-checked="true"]) [part~="checked-indicator"] {
      visibility: visible;
    }
  </style>
  <slot name="checked-indicator">
    <svg aria-hidden="true" viewBox="0 1 24 24" part="checked-indicator indicator">
      <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z"/>
    </svg>
  </slot>
  <slot name="prefix"></slot>
  <slot></slot>
  <slot name="description"></slot>
  <slot name="suffix"></slot>
  <slot name="submenu"></slot>
`;var Ie={TYPE:"type",VALUE:"value",CHECKED:"checked",DISABLED:"disabled"},Nt=class extends d.HTMLElement{constructor(){super(),ft(this,Ol),ft(this,Hl),ft(this,Wl),ft(this,Qi),ft(this,Nl),ft(this,ao),ft(this,io,!1),ft(this,rr,void 0),ft(this,it,()=>{var e,t;this.setAttribute("submenusize",`${this.submenuElement.items.length}`);let a=this.shadowRoot.querySelector('slot[name="description"]'),r=(e=this.submenuElement.checkedItems)==null?void 0:e[0],n=(t=r==null?void 0:r.dataset.description)!=null?t:r==null?void 0:r.text,s=m.createElement("span");s.textContent=n!=null?n:"",a.replaceChildren(s)}),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.append(this.constructor.template.content.cloneNode(!0))),this.shadowRoot.addEventListener("slotchange",this)}static get observedAttributes(){return[Ie.TYPE,Ie.DISABLED,Ie.CHECKED,Ie.VALUE]}enable(){this.hasAttribute("tabindex")||this.setAttribute("tabindex","-1"),ar(this)&&!this.hasAttribute("aria-checked")&&this.setAttribute("aria-checked","false"),this.addEventListener("click",this),this.addEventListener("keydown",this)}disable(){this.removeAttribute("tabindex"),this.removeEventListener("click",this),this.removeEventListener("keydown",this),this.removeEventListener("keyup",this)}handleEvent(e){switch(e.type){case"slotchange":et(this,Ol,km).call(this,e);break;case"click":this.handleClick(e);break;case"keydown":et(this,Nl,Cm).call(this,e);break;case"keyup":et(this,Qi,nr).call(this,e);break}}attributeChangedCallback(e,t,a){e===Ie.CHECKED&&ar(this)&&!tt(this,io)?this.setAttribute("aria-checked",a!=null?"true":"false"):e===Ie.TYPE&&a!==t?this.role="menuitem"+a:e===Ie.DISABLED&&a!==t&&(a==null?this.enable():this.disable())}connectedCallback(){this.hasAttribute(Ie.DISABLED)||this.enable(),this.role="menuitem"+this.type,Dl(this,rr,Ul(this,this.parentNode)),et(this,ao,Pl).call(this)}disconnectedCallback(){this.disable(),et(this,ao,Pl).call(this),Dl(this,rr,null)}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?(e=$t(this))==null?void 0:e.querySelector(`#${this.invokeTarget}`):this.submenuElement}get submenuElement(){return this.shadowRoot.querySelector('slot[name="submenu"]').assignedElements({flatten:!0})[0]}get type(){var e;return(e=this.getAttribute(Ie.TYPE))!=null?e:""}set type(e){this.setAttribute(Ie.TYPE,`${e}`)}get value(){var e;return(e=this.getAttribute(Ie.VALUE))!=null?e:this.text}set value(e){this.setAttribute(Ie.VALUE,e)}get text(){var e;return((e=this.textContent)!=null?e:"").trim()}get checked(){if(ar(this))return this.getAttribute("aria-checked")==="true"}set checked(e){ar(this)&&(Dl(this,io,!0),this.setAttribute("aria-checked",e?"true":"false"),e?this.part.add("checked"):this.part.remove("checked"))}handleClick(e){ar(this)||this.invokeTargetElement&&ce(this,e.target)&&this.invokeTargetElement.dispatchEvent(new Dt({relatedTarget:this}))}get keysUsed(){return["Enter"," "]}};io=new WeakMap;rr=new WeakMap;Ol=new WeakSet;km=function(i){let e=i.target;if(!(e!=null&&e.name))for(let a of e.assignedNodes({flatten:!0}))a instanceof Text&&a.textContent.trim()===""&&a.remove();e.name==="submenu"&&(this.submenuElement?et(this,Hl,Sm).call(this):et(this,Wl,Im).call(this))};Hl=new WeakSet;Sm=async function(){this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",`${!this.submenuElement.hidden}`),this.submenuElement.addEventListener("change",tt(this,it)),this.submenuElement.addEventListener("addmenuitem",tt(this,it)),this.submenuElement.addEventListener("removemenuitem",tt(this,it)),tt(this,it).call(this)};Wl=new WeakSet;Im=function(){this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"),this.submenuElement.removeEventListener("change",tt(this,it)),this.submenuElement.removeEventListener("addmenuitem",tt(this,it)),this.submenuElement.removeEventListener("removemenuitem",tt(this,it)),tt(this,it).call(this)};it=new WeakMap;Qi=new WeakSet;nr=function(i){let{key:e}=i;if(!this.keysUsed.includes(e)){this.removeEventListener("keyup",et(this,Qi,nr));return}this.handleClick(i)};Nl=new WeakSet;Cm=function(i){let{metaKey:e,altKey:t,key:a}=i;if(e||t||!this.keysUsed.includes(a)){this.removeEventListener("keyup",et(this,Qi,nr));return}this.addEventListener("keyup",et(this,Qi,nr),{once:!0})};ao=new WeakSet;Pl=function(){var i;let e=(i=tt(this,rr))==null?void 0:i.radioGroupItems;if(!e)return;let t=e.filter(a=>a.getAttribute("aria-checked")==="true").pop();t||(t=e[0]);for(let a of e)a.setAttribute("aria-checked","false");t==null||t.setAttribute("aria-checked","true")};Nt.template=Mm;function ar(i){return i.type==="radio"||i.type==="checkbox"}function Ul(i,e){if(!i)return null;let{host:t}=i.getRootNode();return!e&&t?Ul(i,t):e!=null&&e.items?e:Ul(e,e==null?void 0:e.parentNode)}d.customElements.get("media-chrome-menu-item")||d.customElements.define("media-chrome-menu-item",Nt);var Lm=m.createElement("template");Lm.innerHTML=le.template.innerHTML+`
  <style>
    :host {
      background: var(--media-settings-menu-background,
        var(--media-menu-background,
        var(--media-control-background,
        var(--media-secondary-color, rgb(20 20 30 / .8)))));
      min-width: var(--media-settings-menu-min-width, 170px);
      border-radius: 2px 2px 0 0;
      overflow: hidden;
    }

    :host([role="menu"]) {
      
      justify-content: end;
    }

    slot:not([name]) {
      justify-content: var(--media-settings-menu-justify-content);
      flex-direction: var(--media-settings-menu-flex-direction, column);
      overflow: visible;
    }

    #container.has-expanded {
      --media-settings-menu-item-opacity: 0;
    }
  </style>
`;var or=class extends le{get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Z(this).querySelector("media-settings-menu-button")}};or.template=Lm;d.customElements.get("media-settings-menu")||d.customElements.define("media-settings-menu",or);var Rm,ro=m.createElement("template");ro.innerHTML=Nt.template.innerHTML+`
  <style>
    slot:not([name="submenu"]) {
      opacity: var(--media-settings-menu-item-opacity, var(--media-menu-item-opacity));
    }

    :host([aria-expanded="true"]:hover) {
      background: transparent;
    }
  </style>
`;(Rm=ro.content)!=null&&Rm.querySelector&&(ro.content.querySelector('slot[name="suffix"]').innerHTML=`
    <svg aria-hidden="true" viewBox="0 0 20 24">
      <path d="m8.12 17.585-.742-.669 4.2-4.665-4.2-4.666.743-.669 4.803 5.335-4.803 5.334Z"/>
    </svg>
  `);var sr=class extends Nt{};sr.template=ro;d.customElements.get("media-settings-menu-item")||d.customElements.define("media-settings-menu-item",sr);var ke=class extends F{connectedCallback(){super.connectedCallback(),this.invokeTargetElement&&this.setAttribute("aria-haspopup","menu")}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?(e=$t(this))==null?void 0:e.querySelector(`#${this.invokeTarget}`):null}handleClick(){var e;(e=this.invokeTargetElement)==null||e.dispatchEvent(new Dt({relatedTarget:this}))}};d.customElements.get("media-chrome-menu-button")||d.customElements.define("media-chrome-menu-button",ke);var wm=m.createElement("template");wm.innerHTML=`
  <style>
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon">
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4.5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
    </svg>
  </slot>
`;var no=class extends ke{static get observedAttributes(){return[...super.observedAttributes,"target"]}constructor(){super({slotTemplate:wm,tooltipContent:I.SETTINGS})}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",V.SETTINGS())}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:Z(this).querySelector("media-settings-menu")}};d.customElements.get("media-settings-menu-button")||d.customElements.define("media-settings-menu-button",no);var Vl=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},xm=(i,e,t)=>(Vl(i,e,"read from private field"),t?t.call(i):e.get(i)),oo=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},$l=(i,e,t,a)=>(Vl(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),so=(i,e,t)=>(Vl(i,e,"access private method"),t),lr,co,lo,Fl,uo,Kl,mo=class extends le{constructor(){super(...arguments),oo(this,lo),oo(this,uo),oo(this,lr,[]),oo(this,co,void 0)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_AUDIO_TRACK_LIST,o.MEDIA_AUDIO_TRACK_ENABLED,o.MEDIA_AUDIO_TRACK_UNAVAILABLE]}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_AUDIO_TRACK_ENABLED&&t!==a?this.value=a:e===o.MEDIA_AUDIO_TRACK_LIST&&t!==a&&($l(this,lr,Dd(a!=null?a:"")),so(this,lo,Fl).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",so(this,uo,Kl))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",so(this,uo,Kl))}get anchorElement(){var e;return this.anchor!=="auto"?super.anchorElement:(e=Z(this))==null?void 0:e.querySelector("media-audio-track-menu-button")}get mediaAudioTrackList(){return xm(this,lr)}set mediaAudioTrackList(e){$l(this,lr,e),so(this,lo,Fl).call(this)}get mediaAudioTrackEnabled(){var e;return(e=x(this,o.MEDIA_AUDIO_TRACK_ENABLED))!=null?e:""}set mediaAudioTrackEnabled(e){M(this,o.MEDIA_AUDIO_TRACK_ENABLED,e)}};lr=new WeakMap;co=new WeakMap;lo=new WeakSet;Fl=function(){if(xm(this,co)===JSON.stringify(this.mediaAudioTrackList))return;$l(this,co,JSON.stringify(this.mediaAudioTrackList));let i=this.mediaAudioTrackList;this.defaultSlot.textContent="";for(let e of i){let t=this.formatMenuItemText(e.label,e),a=je({type:"radio",text:t,value:`${e.id}`,checked:e.enabled});a.prepend(Ne(this,"checked-indicator")),this.defaultSlot.append(a)}};uo=new WeakSet;Kl=function(){if(this.value==null)return;let i=new d.CustomEvent(p.MEDIA_AUDIO_TRACK_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(i)};d.customElements.get("media-audio-track-menu")||d.customElements.define("media-audio-track-menu",mo);var Bv=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M11 17H9.5V7H11v10Zm-3-3H6.5v-4H8v4Zm6-5h-1.5v6H14V9Zm3 7h-1.5V8H17v8Z"/>
  <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-2 0a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z"/>
</svg>`,Dm=m.createElement("template");Dm.innerHTML=`
  <style>
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon">${Bv}</slot>
`;var ho=class extends ke{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_AUDIO_TRACK_ENABLED,o.MEDIA_AUDIO_TRACK_UNAVAILABLE]}constructor(){super({slotTemplate:Dm,tooltipContent:I.AUDIO_TRACK_MENU})}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",V.AUDIO_TRACKS())}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a)}get invokeTargetElement(){var e;return this.invokeTarget!=null?super.invokeTargetElement:(e=Z(this))==null?void 0:e.querySelector("media-audio-track-menu")}get mediaAudioTrackEnabled(){var e;return(e=x(this,o.MEDIA_AUDIO_TRACK_ENABLED))!=null?e:""}set mediaAudioTrackEnabled(e){M(this,o.MEDIA_AUDIO_TRACK_ENABLED,e)}};d.customElements.get("media-audio-track-menu-button")||d.customElements.define("media-audio-track-menu-button",ho);var Ql=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Hv=(i,e,t)=>(Ql(i,e,"read from private field"),t?t.call(i):e.get(i)),Yl=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Wv=(i,e,t,a)=>(Ql(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),Gl=(i,e,t)=>(Ql(i,e,"access private method"),t),vo,ql,Pm,po,Zl,$v=`
  <svg aria-hidden="true" viewBox="0 0 26 24" part="captions-indicator indicator">
    <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
  </svg>`,Um=m.createElement("template");Um.innerHTML=le.template.innerHTML+`
  <slot name="captions-indicator" hidden>${$v}</slot>`;var dr=class extends le{constructor(){super(...arguments),Yl(this,ql),Yl(this,po),Yl(this,vo,void 0)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_SUBTITLES_LIST,o.MEDIA_SUBTITLES_SHOWING]}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_SUBTITLES_LIST&&t!==a?Gl(this,ql,Pm).call(this):e===o.MEDIA_SUBTITLES_SHOWING&&t!==a&&(this.value=a)}connectedCallback(){super.connectedCallback(),this.addEventListener("change",Gl(this,po,Zl))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",Gl(this,po,Zl))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Z(this).querySelector("media-captions-menu-button")}get mediaSubtitlesList(){return Om(this,o.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Nm(this,o.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Om(this,o.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Nm(this,o.MEDIA_SUBTITLES_SHOWING,e)}};vo=new WeakMap;ql=new WeakSet;Pm=function(){var i;if(Hv(this,vo)===JSON.stringify(this.mediaSubtitlesList))return;Wv(this,vo,JSON.stringify(this.mediaSubtitlesList)),this.defaultSlot.textContent="";let e=!this.value,t=je({type:"radio",text:this.formatMenuItemText("Off"),value:"off",checked:e});t.prepend(Ne(this,"checked-indicator")),this.defaultSlot.append(t);let a=this.mediaSubtitlesList;for(let r of a){let n=je({type:"radio",text:this.formatMenuItemText(r.label,r),value:Ur(r),checked:this.value==Ur(r)});n.prepend(Ne(this,"checked-indicator")),((i=r.kind)!=null?i:"subs")==="captions"&&n.append(Ne(this,"captions-indicator")),this.defaultSlot.append(n)}};po=new WeakSet;Zl=function(){let i=this.mediaSubtitlesShowing,e=this.getAttribute(o.MEDIA_SUBTITLES_SHOWING),t=this.value!==e;if(i!=null&&i.length&&t&&this.dispatchEvent(new d.CustomEvent(p.MEDIA_DISABLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:i})),!this.value||!t)return;let a=new d.CustomEvent(p.MEDIA_SHOW_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(a)};dr.template=Um;var Om=(i,e)=>{let t=i.getAttribute(e);return t?Kt(t):[]},Nm=(i,e,t)=>{if(!(t!=null&&t.length)){i.removeAttribute(e);return}let a=ut(t);i.getAttribute(e)!==a&&i.setAttribute(e,a)};d.customElements.get("media-captions-menu")||d.customElements.define("media-captions-menu",dr);var Fv=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Kv=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Vv=(i,e,t,a)=>(Fv(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),zl,Yv=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,Gv=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,$m=m.createElement("template");$m.innerHTML=`
  <style>
    :host([aria-checked="true"]) slot[name=off] {
      display: none !important;
    }

    
    :host(:not([aria-checked="true"])) slot[name=on] {
      display: none !important;
    }

    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="on">${Yv}</slot>
    <slot name="off">${Gv}</slot>
  </slot>
`;var Bm=i=>{i.setAttribute("aria-checked",Br(i).toString())},fo=class extends ke{constructor(e={}){super({slotTemplate:$m,tooltipContent:I.CAPTIONS,...e}),Kv(this,zl,void 0),Vv(this,zl,!1)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_SUBTITLES_LIST,o.MEDIA_SUBTITLES_SHOWING]}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",V.CLOSED_CAPTIONS()),Bm(this)}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_SUBTITLES_SHOWING&&Bm(this)}get invokeTargetElement(){var e;return this.invokeTarget!=null?super.invokeTargetElement:(e=Z(this))==null?void 0:e.querySelector("media-captions-menu")}get mediaSubtitlesList(){return Hm(this,o.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Wm(this,o.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Hm(this,o.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Wm(this,o.MEDIA_SUBTITLES_SHOWING,e)}};zl=new WeakMap;var Hm=(i,e)=>{let t=i.getAttribute(e);return t?Kt(t):[]},Wm=(i,e,t)=>{if(!(t!=null&&t.length)){i.removeAttribute(e);return}let a=ut(t);i.getAttribute(e)!==a&&i.setAttribute(e,a)};d.customElements.get("media-captions-menu-button")||d.customElements.define("media-captions-menu-button",fo);var Fm=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Eo=(i,e,t)=>(Fm(i,e,"read from private field"),t?t.call(i):e.get(i)),Xl=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},ur=(i,e,t)=>(Fm(i,e,"access private method"),t),zi,cr,bo,go,jl,Jl={RATES:"rates"},_o=class extends le{constructor(){super(),Xl(this,cr),Xl(this,go),Xl(this,zi,new Be(this,Jl.RATES,{defaultValue:Os})),ur(this,cr,bo).call(this)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PLAYBACK_RATE,Jl.RATES]}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_PLAYBACK_RATE&&t!=a?this.value=a:e===Jl.RATES&&t!=a&&(Eo(this,zi).value=a,ur(this,cr,bo).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",ur(this,go,jl))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",ur(this,go,jl))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Z(this).querySelector("media-playback-rate-menu-button")}get rates(){return Eo(this,zi)}set rates(e){e?Array.isArray(e)&&(Eo(this,zi).value=e.join(" ")):Eo(this,zi).value="",ur(this,cr,bo).call(this)}get mediaPlaybackRate(){return w(this,o.MEDIA_PLAYBACK_RATE,Ri)}set mediaPlaybackRate(e){P(this,o.MEDIA_PLAYBACK_RATE,e)}};zi=new WeakMap;cr=new WeakSet;bo=function(){this.defaultSlot.textContent="";for(let i of this.rates){let e=je({type:"radio",text:this.formatMenuItemText(`${i}x`,i),value:i,checked:this.mediaPlaybackRate==i});e.prepend(Ne(this,"checked-indicator")),this.defaultSlot.append(e)}};go=new WeakSet;jl=function(){if(!this.value)return;let i=new d.CustomEvent(p.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(i)};d.customElements.get("media-playback-rate-menu")||d.customElements.define("media-playback-rate-menu",_o);var qv=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},Ao=(i,e,t)=>(qv(i,e,"read from private field"),t?t.call(i):e.get(i)),Zv=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Xi,ed={RATES:"rates"},Qv=[1,1.2,1.5,1.7,2],td=1,Km=m.createElement("template");Km.innerHTML=`
  <style>
    :host {
      min-width: 5ch;
      padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
    }
    
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon"></slot>
`;var To=class extends ke{constructor(e={}){super({slotTemplate:Km,tooltipContent:I.PLAYBACK_RATE,...e}),Zv(this,Xi,new Be(this,ed.RATES,{defaultValue:Qv})),this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${td}x`}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PLAYBACK_RATE,ed.RATES]}attributeChangedCallback(e,t,a){if(super.attributeChangedCallback(e,t,a),e===ed.RATES&&(Ao(this,Xi).value=a),e===o.MEDIA_PLAYBACK_RATE){let r=a?+a:Number.NaN,n=Number.isNaN(r)?td:r;this.container.innerHTML=`${n}x`,this.setAttribute("aria-label",V.PLAYBACK_RATE({playbackRate:n}))}}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:Z(this).querySelector("media-playback-rate-menu")}get rates(){return Ao(this,Xi)}set rates(e){e?Array.isArray(e)&&(Ao(this,Xi).value=e.join(" ")):Ao(this,Xi).value=""}get mediaPlaybackRate(){return w(this,o.MEDIA_PLAYBACK_RATE,td)}set mediaPlaybackRate(e){P(this,o.MEDIA_PLAYBACK_RATE,e)}};Xi=new WeakMap;d.customElements.get("media-playback-rate-menu-button")||d.customElements.define("media-playback-rate-menu-button",To);var ad=(i,e,t)=>{if(!e.has(i))throw TypeError("Cannot "+t)},hr=(i,e,t)=>(ad(i,e,"read from private field"),t?t.call(i):e.get(i)),yo=(i,e,t)=>{if(e.has(i))throw TypeError("Cannot add the same private member more than once");e instanceof WeakSet?e.add(i):e.set(i,t)},Vm=(i,e,t,a)=>(ad(i,e,"write to private field"),a?a.call(i,t):e.set(i,t),t),mr=(i,e,t)=>(ad(i,e,"access private method"),t),pr,Ji,vr,ko,So,id,Io=class extends le{constructor(){super(...arguments),yo(this,vr),yo(this,So),yo(this,pr,[]),yo(this,Ji,{})}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_RENDITION_LIST,o.MEDIA_RENDITION_SELECTED,o.MEDIA_RENDITION_UNAVAILABLE,o.MEDIA_HEIGHT]}attributeChangedCallback(e,t,a){super.attributeChangedCallback(e,t,a),e===o.MEDIA_RENDITION_SELECTED&&t!==a?this.value=a!=null?a:"auto":e===o.MEDIA_RENDITION_LIST&&t!==a?(Vm(this,pr,wd(a)),mr(this,vr,ko).call(this)):e===o.MEDIA_HEIGHT&&t!==a&&mr(this,vr,ko).call(this)}connectedCallback(){super.connectedCallback(),this.addEventListener("change",mr(this,So,id))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",mr(this,So,id))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:Z(this).querySelector("media-rendition-menu-button")}get mediaRenditionList(){return hr(this,pr)}set mediaRenditionList(e){Vm(this,pr,e),mr(this,vr,ko).call(this)}get mediaRenditionSelected(){return x(this,o.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){M(this,o.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return w(this,o.MEDIA_HEIGHT)}set mediaHeight(e){P(this,o.MEDIA_HEIGHT,e)}};pr=new WeakMap;Ji=new WeakMap;vr=new WeakSet;ko=function(){if(hr(this,Ji).mediaRenditionList===JSON.stringify(this.mediaRenditionList)&&hr(this,Ji).mediaHeight===this.mediaHeight)return;hr(this,Ji).mediaRenditionList=JSON.stringify(this.mediaRenditionList),hr(this,Ji).mediaHeight=this.mediaHeight;let i=this.mediaRenditionList.sort((r,n)=>n.height-r.height);for(let r of i)r.selected=r.id===this.mediaRenditionSelected;this.defaultSlot.textContent="";let e=!this.mediaRenditionSelected;for(let r of i){let n=this.formatMenuItemText(`${Math.min(r.width,r.height)}p`,r),s=je({type:"radio",text:n,value:`${r.id}`,checked:r.selected&&!e});s.prepend(Ne(this,"checked-indicator")),this.defaultSlot.append(s)}let t=je({type:"radio",text:this.formatMenuItemText("Auto"),value:"auto",checked:e}),a=this.mediaHeight>0?`Auto (${this.mediaHeight}p)`:"Auto";t.dataset.description=a,t.prepend(Ne(this,"checked-indicator")),this.defaultSlot.append(t)};So=new WeakSet;id=function(){if(this.value==null)return;let i=new d.CustomEvent(p.MEDIA_RENDITION_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(i)};d.customElements.get("media-rendition-menu")||d.customElements.define("media-rendition-menu",Io);var zv=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M13.5 2.5h2v6h-2v-2h-11v-2h11v-2Zm4 2h4v2h-4v-2Zm-12 4h2v6h-2v-2h-3v-2h3v-2Zm4 2h12v2h-12v-2Zm1 4h2v6h-2v-2h-8v-2h8v-2Zm4 2h7v2h-7v-2Z" />
</svg>`,Ym=m.createElement("template");Ym.innerHTML=`
  <style>
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon">${zv}</slot>
`;var Co=class extends ke{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_RENDITION_SELECTED,o.MEDIA_RENDITION_UNAVAILABLE,o.MEDIA_HEIGHT]}constructor(){super({slotTemplate:Ym,tooltipContent:I.RENDITIONS})}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",V.QUALITY())}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:Z(this).querySelector("media-rendition-menu")}get mediaRenditionSelected(){return x(this,o.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){M(this,o.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return w(this,o.MEDIA_HEIGHT)}set mediaHeight(e){P(this,o.MEDIA_HEIGHT,e)}};d.customElements.get("media-rendition-menu-button")||d.customElements.define("media-rendition-menu-button",Co);var rd=Ae.createElement("template");"innerHTML"in rd&&(rd.innerHTML=dm);var Gm,qm,Mo=class extends li{};Mo.template=(qm=(Gm=rd.content)==null?void 0:Gm.children)==null?void 0:qm[0];Q.customElements.get("media-theme-gerwig")||Q.customElements.define("media-theme-gerwig",Mo);var Xv="gerwig";var Et={SRC:"src",POSTER:"poster"},h={STYLE:"style",DEFAULT_HIDDEN_CAPTIONS:"default-hidden-captions",PRIMARY_COLOR:"primary-color",SECONDARY_COLOR:"secondary-color",ACCENT_COLOR:"accent-color",FORWARD_SEEK_OFFSET:"forward-seek-offset",BACKWARD_SEEK_OFFSET:"backward-seek-offset",PLAYBACK_TOKEN:"playback-token",THUMBNAIL_TOKEN:"thumbnail-token",STORYBOARD_TOKEN:"storyboard-token",DRM_TOKEN:"drm-token",STORYBOARD_SRC:"storyboard-src",THUMBNAIL_TIME:"thumbnail-time",AUDIO:"audio",NOHOTKEYS:"nohotkeys",HOTKEYS:"hotkeys",PLAYBACK_RATES:"playbackrates",DEFAULT_SHOW_REMAINING_TIME:"default-show-remaining-time",DEFAULT_DURATION:"default-duration",TITLE:"title",PLACEHOLDER:"placeholder",THEME:"theme",DEFAULT_STREAM_TYPE:"default-stream-type",TARGET_LIVE_WINDOW:"target-live-window",EXTRA_SOURCE_PARAMS:"extra-source-params",NO_VOLUME_PREF:"no-volume-pref",CAST_RECEIVER:"cast-receiver",NO_TOOLTIPS:"no-tooltips"},nd=["audio","backwardseekoffset","defaultduration","defaultshowremainingtime","defaultsubtitles","noautoseektolive","disabled","exportparts","forwardseekoffset","hideduration","hotkeys","nohotkeys","playbackrates","defaultstreamtype","streamtype","style","targetlivewindow","template","title","novolumepref"];function Jv(i,e){var a;return{src:!i.playbackId&&i.src,playbackId:i.playbackId,hasSrc:!!i.playbackId||!!i.src||!!i.currentSrc,poster:i.poster,storyboard:i.storyboard,storyboardSrc:i.getAttribute(h.STORYBOARD_SRC),placeholder:i.getAttribute("placeholder"),themeTemplate:jv(i),thumbnailTime:!i.tokens.thumbnail&&i.thumbnailTime,autoplay:i.autoplay,crossOrigin:i.crossOrigin,loop:i.loop,noHotKeys:i.hasAttribute(h.NOHOTKEYS),hotKeys:i.getAttribute(h.HOTKEYS),muted:i.muted,paused:i.paused,preload:i.preload,envKey:i.envKey,preferCmcd:i.preferCmcd,debug:i.debug,disableTracking:i.disableTracking,disableCookies:i.disableCookies,tokens:i.tokens,beaconCollectionDomain:i.beaconCollectionDomain,maxResolution:i.maxResolution,minResolution:i.minResolution,programStartTime:i.programStartTime,programEndTime:i.programEndTime,assetStartTime:i.assetStartTime,assetEndTime:i.assetEndTime,renditionOrder:i.renditionOrder,metadata:i.metadata,playerSoftwareName:i.playerSoftwareName,playerSoftwareVersion:i.playerSoftwareVersion,startTime:i.startTime,preferPlayback:i.preferPlayback,audio:i.audio,defaultStreamType:i.defaultStreamType,targetLiveWindow:i.getAttribute(E.Attributes.TARGET_LIVE_WINDOW),streamType:Ka(i.getAttribute(E.Attributes.STREAM_TYPE)),primaryColor:i.getAttribute(h.PRIMARY_COLOR),secondaryColor:i.getAttribute(h.SECONDARY_COLOR),accentColor:i.getAttribute(h.ACCENT_COLOR),forwardSeekOffset:i.forwardSeekOffset,backwardSeekOffset:i.backwardSeekOffset,defaultHiddenCaptions:i.defaultHiddenCaptions,defaultDuration:i.defaultDuration,defaultShowRemainingTime:i.defaultShowRemainingTime,hideDuration:ef(i),playbackRates:i.getAttribute(h.PLAYBACK_RATES),customDomain:(a=i.getAttribute(E.Attributes.CUSTOM_DOMAIN))!=null?a:void 0,title:i.getAttribute(h.TITLE),novolumepref:i.hasAttribute(h.NO_VOLUME_PREF),castReceiver:i.castReceiver,...e,extraSourceParams:i.extraSourceParams}}function jv(i){var t,a;let e=i.theme;if(e){let r=(a=(t=i.getRootNode())==null?void 0:t.getElementById)==null?void 0:a.call(t,e);if(r&&r instanceof HTMLTemplateElement)return r;e.startsWith("media-theme-")||(e=`media-theme-${e}`);let n=Q.customElements.get(e);if(n!=null&&n.template)return n.template}}function ef(i){var t;let e=(t=i.mediaController)==null?void 0:t.querySelector("media-time-display");return e&&getComputedStyle(e).getPropertyValue("--media-duration-display-display").trim()==="none"}function Zm(i){let e=i.hasAttribute(h.TITLE)?{video_title:i.getAttribute(h.TITLE)}:{};return i.getAttributeNames().filter(t=>t.startsWith("metadata-")).reduce((t,a)=>{let r=i.getAttribute(a);return r!==null&&(t[a.replace(/^metadata-/,"").replace(/-/g,"_")]=r),t},e)}var tf=Object.values(E.Attributes),af=Object.values(Et),rf=Object.values(h),nf=Un(),of="mux-player",Qm={dialog:void 0,isDialogOpen:!1},sf={redundant_streams:!0},Er,br,Bt,gr,pi,at,Pt,Lo,zm,_r,od,bt,hi,Ro,Xm,wo,Jm,xo,jm,Do,eh,fr=class extends nl{constructor(){super();X(this,at);X(this,Lo);X(this,_r);X(this,bt);X(this,Ro);X(this,wo);X(this,xo);X(this,Do);X(this,Er,!1);X(this,br,{});X(this,Bt,!0);X(this,gr,new Pn(this,"hotkeys"));X(this,pi,{...Qm,onCloseErrorDialog:()=>j(this,_r,od).call(this,{dialog:void 0,isDialogOpen:!1}),onInitFocusDialog:t=>{il(this,Ae.activeElement)||t.preventDefault()}});this.attachShadow({mode:"open"}),j(this,Lo,zm).call(this),this.isConnected&&j(this,at,Pt).call(this)}static get observedAttributes(){var t;return[...(t=nl.observedAttributes)!=null?t:[],...af,...tf,...rf]}get mediaTheme(){var t;return(t=this.shadowRoot)==null?void 0:t.querySelector("media-theme")}get mediaController(){var t,a;return(a=(t=this.mediaTheme)==null?void 0:t.shadowRoot)==null?void 0:a.querySelector("media-controller")}connectedCallback(){var a;let t=(a=this.shadowRoot)==null?void 0:a.querySelector("mux-video");t&&(t.metadata=Zm(this))}attributeChangedCallback(t,a,r){switch(j(this,at,Pt).call(this),super.attributeChangedCallback(t,a,r),t){case h.HOTKEYS:R(this,gr).value=r;break;case h.THUMBNAIL_TIME:{r!=null&&this.tokens.thumbnail&&Qe((0,S.i18n)("Use of thumbnail-time with thumbnail-token is currently unsupported. Ignore thumbnail-time."));break}case h.THUMBNAIL_TOKEN:{if(r){let s=(0,S.parseJwt)(r);if(s){let{aud:l}=s,u=S.MuxJWTAud.THUMBNAIL;l!==u&&Qe((0,S.i18n)("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:l,expectedAud:u,tokenNamePrefix:"thumbnail"}))}}break}case h.STORYBOARD_TOKEN:{if(r){let s=(0,S.parseJwt)(r);if(s){let{aud:l}=s,u=S.MuxJWTAud.STORYBOARD;l!==u&&Qe((0,S.i18n)("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:l,expectedAud:u,tokenNamePrefix:"storyboard"}))}}break}case h.DRM_TOKEN:{if(r){let s=(0,S.parseJwt)(r);if(s){let{aud:l}=s,u=S.MuxJWTAud.DRM;l!==u&&Qe((0,S.i18n)("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:l,expectedAud:u,tokenNamePrefix:"drm"}))}}break}case E.Attributes.PLAYBACK_ID:{r!=null&&r.includes("?token")&&Ee((0,S.i18n)("The specificed playback ID {playbackId} contains a token which must be provided via the playback-token attribute.").format({playbackId:r}));break}case E.Attributes.STREAM_TYPE:r&&![S.StreamTypes.LIVE,S.StreamTypes.ON_DEMAND,S.StreamTypes.UNKNOWN].includes(r)?["ll-live","live:dvr","ll-live:dvr"].includes(this.streamType)?this.targetLiveWindow=r.includes("dvr")?Number.POSITIVE_INFINITY:0:al({file:"invalid-stream-type.md",message:(0,S.i18n)("Invalid stream-type value supplied: `{streamType}`. Please provide stream-type as either: `on-demand` or `live`").format({streamType:this.streamType})}):r===S.StreamTypes.LIVE?this.getAttribute(h.TARGET_LIVE_WINDOW)==null&&(this.targetLiveWindow=0):this.targetLiveWindow=Number.NaN}[E.Attributes.PLAYBACK_ID,Et.SRC,h.PLAYBACK_TOKEN].includes(t)&&a!==r&&Se(this,pi,{...R(this,pi),...Qm}),j(this,bt,hi).call(this,{[Dc(t)]:r})}get preferCmcd(){var t;return(t=this.getAttribute(E.Attributes.PREFER_CMCD))!=null?t:void 0}set preferCmcd(t){t!==this.preferCmcd&&(t?S.CmcdTypeValues.includes(t)?this.setAttribute(E.Attributes.PREFER_CMCD,t):Qe(`Invalid value for preferCmcd. Must be one of ${S.CmcdTypeValues.join()}`):this.removeAttribute(E.Attributes.PREFER_CMCD))}get hasPlayed(){var t,a;return(a=(t=this.mediaController)==null?void 0:t.hasAttribute(o.MEDIA_HAS_PLAYED))!=null?a:!1}get inLiveWindow(){var t;return(t=this.mediaController)==null?void 0:t.hasAttribute(o.MEDIA_TIME_IS_LIVE)}get _hls(){var t;return(t=this.media)==null?void 0:t._hls}get mux(){var t;return(t=this.media)==null?void 0:t.mux}get theme(){var t;return(t=this.getAttribute(h.THEME))!=null?t:Xv}set theme(t){this.setAttribute(h.THEME,`${t}`)}get themeProps(){let t=this.mediaTheme;if(!t)return;let a={};for(let r of t.getAttributeNames()){if(nd.includes(r))continue;let n=t.getAttribute(r);a[Nn(r)]=n===""?!0:n}return a}set themeProps(t){var r,n;j(this,at,Pt).call(this);let a={...this.themeProps,...t};for(let s in a){if(nd.includes(s))continue;let l=t==null?void 0:t[s];typeof l=="boolean"||l==null?(r=this.mediaTheme)==null||r.toggleAttribute(On(s),!!l):(n=this.mediaTheme)==null||n.setAttribute(On(s),l)}}get playbackId(){var t;return(t=this.getAttribute(E.Attributes.PLAYBACK_ID))!=null?t:void 0}set playbackId(t){t?this.setAttribute(E.Attributes.PLAYBACK_ID,t):this.removeAttribute(E.Attributes.PLAYBACK_ID)}get src(){var t,a;return this.playbackId?(t=Ut(this,Et.SRC))!=null?t:void 0:(a=this.getAttribute(Et.SRC))!=null?a:void 0}set src(t){t?this.setAttribute(Et.SRC,t):this.removeAttribute(Et.SRC)}get poster(){var r;let t=this.getAttribute(Et.POSTER);if(t!=null)return t;let{tokens:a}=this;if(a.playback&&!a.thumbnail){Qe("Missing expected thumbnail token. No poster image will be shown");return}if(this.playbackId&&!this.audio)return wc(this.playbackId,{customDomain:this.customDomain,thumbnailTime:(r=this.thumbnailTime)!=null?r:this.startTime,programTime:this.programStartTime,token:a.thumbnail})}set poster(t){t||t===""?this.setAttribute(Et.POSTER,t):this.removeAttribute(Et.POSTER)}get storyboardSrc(){var t;return(t=this.getAttribute(h.STORYBOARD_SRC))!=null?t:void 0}set storyboardSrc(t){t?this.setAttribute(h.STORYBOARD_SRC,t):this.removeAttribute(h.STORYBOARD_SRC)}get storyboard(){let{tokens:t}=this;if(this.storyboardSrc&&!t.storyboard)return this.storyboardSrc;if(!(this.audio||!this.playbackId||!this.streamType||[S.StreamTypes.LIVE,S.StreamTypes.UNKNOWN].includes(this.streamType)||t.playback&&!t.storyboard))return xc(this.playbackId,{customDomain:this.customDomain,token:t.storyboard,programStartTime:this.programStartTime,programEndTime:this.programEndTime})}get audio(){return this.hasAttribute(h.AUDIO)}set audio(t){if(!t){this.removeAttribute(h.AUDIO);return}this.setAttribute(h.AUDIO,"")}get hotkeys(){return R(this,gr)}get nohotkeys(){return this.hasAttribute(h.NOHOTKEYS)}set nohotkeys(t){if(!t){this.removeAttribute(h.NOHOTKEYS);return}this.setAttribute(h.NOHOTKEYS,"")}get thumbnailTime(){return fe(this.getAttribute(h.THUMBNAIL_TIME))}set thumbnailTime(t){this.setAttribute(h.THUMBNAIL_TIME,`${t}`)}get title(){var t;return(t=this.getAttribute(h.TITLE))!=null?t:""}set title(t){t!==this.title&&(t?this.setAttribute(h.TITLE,t):this.removeAttribute("title"),super.title=t)}get placeholder(){var t;return(t=Ut(this,h.PLACEHOLDER))!=null?t:""}set placeholder(t){this.setAttribute(h.PLACEHOLDER,`${t}`)}get primaryColor(){var a,r;let t=this.getAttribute(h.PRIMARY_COLOR);if(t!=null||this.mediaTheme&&(t=(r=(a=Q.getComputedStyle(this.mediaTheme))==null?void 0:a.getPropertyValue("--_primary-color"))==null?void 0:r.trim(),t))return t}set primaryColor(t){this.setAttribute(h.PRIMARY_COLOR,`${t}`)}get secondaryColor(){var a,r;let t=this.getAttribute(h.SECONDARY_COLOR);if(t!=null||this.mediaTheme&&(t=(r=(a=Q.getComputedStyle(this.mediaTheme))==null?void 0:a.getPropertyValue("--_secondary-color"))==null?void 0:r.trim(),t))return t}set secondaryColor(t){this.setAttribute(h.SECONDARY_COLOR,`${t}`)}get accentColor(){var a,r;let t=this.getAttribute(h.ACCENT_COLOR);if(t!=null||this.mediaTheme&&(t=(r=(a=Q.getComputedStyle(this.mediaTheme))==null?void 0:a.getPropertyValue("--_accent-color"))==null?void 0:r.trim(),t))return t}set accentColor(t){this.setAttribute(h.ACCENT_COLOR,`${t}`)}get defaultShowRemainingTime(){return this.hasAttribute(h.DEFAULT_SHOW_REMAINING_TIME)}set defaultShowRemainingTime(t){t?this.setAttribute(h.DEFAULT_SHOW_REMAINING_TIME,""):this.removeAttribute(h.DEFAULT_SHOW_REMAINING_TIME)}get playbackRates(){if(this.hasAttribute(h.PLAYBACK_RATES))return this.getAttribute(h.PLAYBACK_RATES).trim().split(/\s*,?\s+/).map(t=>Number(t)).filter(t=>!Number.isNaN(t)).sort((t,a)=>t-a)}set playbackRates(t){if(!t){this.removeAttribute(h.PLAYBACK_RATES);return}this.setAttribute(h.PLAYBACK_RATES,t.join(" "))}get forwardSeekOffset(){var t;return(t=fe(this.getAttribute(h.FORWARD_SEEK_OFFSET)))!=null?t:10}set forwardSeekOffset(t){this.setAttribute(h.FORWARD_SEEK_OFFSET,`${t}`)}get backwardSeekOffset(){var t;return(t=fe(this.getAttribute(h.BACKWARD_SEEK_OFFSET)))!=null?t:10}set backwardSeekOffset(t){this.setAttribute(h.BACKWARD_SEEK_OFFSET,`${t}`)}get defaultHiddenCaptions(){return this.hasAttribute(h.DEFAULT_HIDDEN_CAPTIONS)}set defaultHiddenCaptions(t){t?this.setAttribute(h.DEFAULT_HIDDEN_CAPTIONS,""):this.removeAttribute(h.DEFAULT_HIDDEN_CAPTIONS)}get defaultDuration(){return fe(this.getAttribute(h.DEFAULT_DURATION))}set defaultDuration(t){t==null?this.removeAttribute(h.DEFAULT_DURATION):this.setAttribute(h.DEFAULT_DURATION,`${t}`)}get playerSoftwareName(){var t;return(t=this.getAttribute(E.Attributes.PLAYER_SOFTWARE_NAME))!=null?t:of}get playerSoftwareVersion(){var t;return(t=this.getAttribute(E.Attributes.PLAYER_SOFTWARE_VERSION))!=null?t:nf}get beaconCollectionDomain(){var t;return(t=this.getAttribute(E.Attributes.BEACON_COLLECTION_DOMAIN))!=null?t:void 0}set beaconCollectionDomain(t){t!==this.beaconCollectionDomain&&(t?this.setAttribute(E.Attributes.BEACON_COLLECTION_DOMAIN,t):this.removeAttribute(E.Attributes.BEACON_COLLECTION_DOMAIN))}get maxResolution(){var t;return(t=this.getAttribute(E.Attributes.MAX_RESOLUTION))!=null?t:void 0}set maxResolution(t){t!==this.maxResolution&&(t?this.setAttribute(E.Attributes.MAX_RESOLUTION,t):this.removeAttribute(E.Attributes.MAX_RESOLUTION))}get minResolution(){var t;return(t=this.getAttribute(E.Attributes.MIN_RESOLUTION))!=null?t:void 0}set minResolution(t){t!==this.minResolution&&(t?this.setAttribute(E.Attributes.MIN_RESOLUTION,t):this.removeAttribute(E.Attributes.MIN_RESOLUTION))}get renditionOrder(){var t;return(t=this.getAttribute(E.Attributes.RENDITION_ORDER))!=null?t:void 0}set renditionOrder(t){t!==this.renditionOrder&&(t?this.setAttribute(E.Attributes.RENDITION_ORDER,t):this.removeAttribute(E.Attributes.RENDITION_ORDER))}get programStartTime(){return fe(this.getAttribute(E.Attributes.PROGRAM_START_TIME))}set programStartTime(t){t==null?this.removeAttribute(E.Attributes.PROGRAM_START_TIME):this.setAttribute(E.Attributes.PROGRAM_START_TIME,`${t}`)}get programEndTime(){return fe(this.getAttribute(E.Attributes.PROGRAM_END_TIME))}set programEndTime(t){t==null?this.removeAttribute(E.Attributes.PROGRAM_END_TIME):this.setAttribute(E.Attributes.PROGRAM_END_TIME,`${t}`)}get assetStartTime(){return fe(this.getAttribute(E.Attributes.ASSET_START_TIME))}set assetStartTime(t){t==null?this.removeAttribute(E.Attributes.ASSET_START_TIME):this.setAttribute(E.Attributes.ASSET_START_TIME,`${t}`)}get assetEndTime(){return fe(this.getAttribute(E.Attributes.ASSET_END_TIME))}set assetEndTime(t){t==null?this.removeAttribute(E.Attributes.ASSET_END_TIME):this.setAttribute(E.Attributes.ASSET_END_TIME,`${t}`)}get extraSourceParams(){return this.hasAttribute(h.EXTRA_SOURCE_PARAMS)?[...new URLSearchParams(this.getAttribute(h.EXTRA_SOURCE_PARAMS)).entries()].reduce((t,[a,r])=>(t[a]=r,t),{}):sf}set extraSourceParams(t){t==null?this.removeAttribute(h.EXTRA_SOURCE_PARAMS):this.setAttribute(h.EXTRA_SOURCE_PARAMS,new URLSearchParams(t).toString())}get customDomain(){var t;return(t=this.getAttribute(E.Attributes.CUSTOM_DOMAIN))!=null?t:void 0}set customDomain(t){t!==this.customDomain&&(t?this.setAttribute(E.Attributes.CUSTOM_DOMAIN,t):this.removeAttribute(E.Attributes.CUSTOM_DOMAIN))}get envKey(){var t;return(t=Ut(this,E.Attributes.ENV_KEY))!=null?t:void 0}set envKey(t){this.setAttribute(E.Attributes.ENV_KEY,`${t}`)}get noVolumePref(){return this.hasAttribute(h.NO_VOLUME_PREF)}set noVolumePref(t){t?this.setAttribute(h.NO_VOLUME_PREF,""):this.removeAttribute(h.NO_VOLUME_PREF)}get debug(){return Ut(this,E.Attributes.DEBUG)!=null}set debug(t){t?this.setAttribute(E.Attributes.DEBUG,""):this.removeAttribute(E.Attributes.DEBUG)}get disableTracking(){return Ut(this,E.Attributes.DISABLE_TRACKING)!=null}set disableTracking(t){this.toggleAttribute(E.Attributes.DISABLE_TRACKING,!!t)}get disableCookies(){return Ut(this,E.Attributes.DISABLE_COOKIES)!=null}set disableCookies(t){t?this.setAttribute(E.Attributes.DISABLE_COOKIES,""):this.removeAttribute(E.Attributes.DISABLE_COOKIES)}get streamType(){var t,a,r;return(r=(a=this.getAttribute(E.Attributes.STREAM_TYPE))!=null?a:(t=this.media)==null?void 0:t.streamType)!=null?r:S.StreamTypes.UNKNOWN}set streamType(t){this.setAttribute(E.Attributes.STREAM_TYPE,`${t}`)}get defaultStreamType(){var t,a,r;return(r=(a=this.getAttribute(h.DEFAULT_STREAM_TYPE))!=null?a:(t=this.mediaController)==null?void 0:t.getAttribute(h.DEFAULT_STREAM_TYPE))!=null?r:S.StreamTypes.ON_DEMAND}set defaultStreamType(t){t?this.setAttribute(h.DEFAULT_STREAM_TYPE,t):this.removeAttribute(h.DEFAULT_STREAM_TYPE)}get targetLiveWindow(){var t,a;return this.hasAttribute(h.TARGET_LIVE_WINDOW)?+this.getAttribute(h.TARGET_LIVE_WINDOW):(a=(t=this.media)==null?void 0:t.targetLiveWindow)!=null?a:Number.NaN}set targetLiveWindow(t){t==this.targetLiveWindow||Number.isNaN(t)&&Number.isNaN(this.targetLiveWindow)||(t==null?this.removeAttribute(h.TARGET_LIVE_WINDOW):this.setAttribute(h.TARGET_LIVE_WINDOW,`${+t}`))}get liveEdgeStart(){var t;return(t=this.media)==null?void 0:t.liveEdgeStart}get startTime(){return fe(Ut(this,E.Attributes.START_TIME))}set startTime(t){this.setAttribute(E.Attributes.START_TIME,`${t}`)}get preferPlayback(){let t=this.getAttribute(E.Attributes.PREFER_PLAYBACK);if(t===S.PlaybackTypes.MSE||t===S.PlaybackTypes.NATIVE)return t}set preferPlayback(t){t!==this.preferPlayback&&(t===S.PlaybackTypes.MSE||t===S.PlaybackTypes.NATIVE?this.setAttribute(E.Attributes.PREFER_PLAYBACK,t):this.removeAttribute(E.Attributes.PREFER_PLAYBACK))}get metadata(){var t;return(t=this.media)==null?void 0:t.metadata}set metadata(t){if(j(this,at,Pt).call(this),!this.media){Ee("underlying media element missing when trying to set metadata. metadata will not be set.");return}this.media.metadata={...Zm(this),...t}}get _hlsConfig(){var t;return(t=this.media)==null?void 0:t._hlsConfig}set _hlsConfig(t){if(j(this,at,Pt).call(this),!this.media){Ee("underlying media element missing when trying to set _hlsConfig. _hlsConfig will not be set.");return}this.media._hlsConfig=t}async addCuePoints(t){var a;if(j(this,at,Pt).call(this),!this.media){Ee("underlying media element missing when trying to addCuePoints. cuePoints will not be added.");return}return(a=this.media)==null?void 0:a.addCuePoints(t)}get activeCuePoint(){var t;return(t=this.media)==null?void 0:t.activeCuePoint}get cuePoints(){var t,a;return(a=(t=this.media)==null?void 0:t.cuePoints)!=null?a:[]}addChapters(t){var a;if(j(this,at,Pt).call(this),!this.media){Ee("underlying media element missing when trying to addChapters. chapters will not be added.");return}return(a=this.media)==null?void 0:a.addChapters(t)}get activeChapter(){var t;return(t=this.media)==null?void 0:t.activeChapter}get chapters(){var t,a;return(a=(t=this.media)==null?void 0:t.chapters)!=null?a:[]}getStartDate(){var t;return(t=this.media)==null?void 0:t.getStartDate()}get currentPdt(){var t;return(t=this.media)==null?void 0:t.currentPdt}get tokens(){let t=this.getAttribute(h.PLAYBACK_TOKEN),a=this.getAttribute(h.DRM_TOKEN),r=this.getAttribute(h.THUMBNAIL_TOKEN),n=this.getAttribute(h.STORYBOARD_TOKEN);return{...R(this,br),...t!=null?{playback:t}:{},...a!=null?{drm:a}:{},...r!=null?{thumbnail:r}:{},...n!=null?{storyboard:n}:{}}}set tokens(t){Se(this,br,t!=null?t:{})}get playbackToken(){var t;return(t=this.getAttribute(h.PLAYBACK_TOKEN))!=null?t:void 0}set playbackToken(t){this.setAttribute(h.PLAYBACK_TOKEN,`${t}`)}get drmToken(){var t;return(t=this.getAttribute(h.DRM_TOKEN))!=null?t:void 0}set drmToken(t){this.setAttribute(h.DRM_TOKEN,`${t}`)}get thumbnailToken(){var t;return(t=this.getAttribute(h.THUMBNAIL_TOKEN))!=null?t:void 0}set thumbnailToken(t){this.setAttribute(h.THUMBNAIL_TOKEN,`${t}`)}get storyboardToken(){var t;return(t=this.getAttribute(h.STORYBOARD_TOKEN))!=null?t:void 0}set storyboardToken(t){this.setAttribute(h.STORYBOARD_TOKEN,`${t}`)}addTextTrack(t,a,r,n){var l;let s=(l=this.media)==null?void 0:l.nativeEl;if(s)return(0,S.addTextTrack)(s,t,a,r,n)}removeTextTrack(t){var r;let a=(r=this.media)==null?void 0:r.nativeEl;if(a)return(0,S.removeTextTrack)(a,t)}get textTracks(){var t;return(t=this.media)==null?void 0:t.textTracks}get castReceiver(){var t;return(t=this.getAttribute(h.CAST_RECEIVER))!=null?t:void 0}set castReceiver(t){t!==this.castReceiver&&(t?this.setAttribute(h.CAST_RECEIVER,t):this.removeAttribute(h.CAST_RECEIVER))}get castCustomData(){var t;return(t=this.media)==null?void 0:t.castCustomData}set castCustomData(t){if(!this.media){Ee("underlying media element missing when trying to set castCustomData. castCustomData will not be set.");return}this.media.castCustomData=t}get noTooltips(){return this.hasAttribute(h.NO_TOOLTIPS)}set noTooltips(t){if(!t){this.removeAttribute(h.NO_TOOLTIPS);return}this.setAttribute(h.NO_TOOLTIPS,"")}};Er=new WeakMap,br=new WeakMap,Bt=new WeakMap,gr=new WeakMap,pi=new WeakMap,at=new WeakSet,Pt=function(){var t,a,r,n;if(!R(this,Er)){Se(this,Er,!0),j(this,bt,hi).call(this);try{if(customElements.upgrade(this.mediaTheme),!(this.mediaTheme instanceof Q.HTMLElement))throw""}catch{Ee("<media-theme> failed to upgrade!")}try{if(customElements.upgrade(this.media),!(this.media instanceof E.default))throw""}catch{Ee("<mux-video> failed to upgrade!")}try{if(customElements.upgrade(this.mediaController),!(this.mediaController instanceof as))throw""}catch{Ee("<media-controller> failed to upgrade!")}this.init(),j(this,Ro,Xm).call(this),j(this,wo,Jm).call(this),j(this,xo,jm).call(this),Se(this,Bt,(a=(t=this.mediaController)==null?void 0:t.hasAttribute(D.USER_INACTIVE))!=null?a:!0),j(this,Do,eh).call(this),(r=this.media)==null||r.addEventListener("streamtypechange",()=>j(this,bt,hi).call(this)),(n=this.media)==null||n.addEventListener("loadstart",()=>j(this,bt,hi).call(this))}},Lo=new WeakSet,zm=function(){var t,a;try{(t=window==null?void 0:window.CSS)==null||t.registerProperty({name:"--media-primary-color",syntax:"<color>",inherits:!0}),(a=window==null?void 0:window.CSS)==null||a.registerProperty({name:"--media-secondary-color",syntax:"<color>",inherits:!0})}catch{}},_r=new WeakSet,od=function(t){Object.assign(R(this,pi),t),j(this,bt,hi).call(this)},bt=new WeakSet,hi=function(t={}){om(sm(Jv(this,{...R(this,pi),...t})),this.shadowRoot)},Ro=new WeakSet,Xm=function(){let t=r=>{var l,u;if(!(r!=null&&r.startsWith("theme-")))return;let n=r.replace(/^theme-/,"");if(nd.includes(n))return;let s=this.getAttribute(r);s!=null?(l=this.mediaTheme)==null||l.setAttribute(n,s):(u=this.mediaTheme)==null||u.removeAttribute(n)};new MutationObserver(r=>{for(let{attributeName:n}of r)t(n)}).observe(this,{attributes:!0}),this.getAttributeNames().forEach(t)},wo=new WeakSet,Jm=function(){var a;let t=r=>{let{detail:n}=r;if(n instanceof E.MediaError||(n=new E.MediaError(n.message,n.code,n.fatal)),!(n!=null&&n.fatal)){Qe(n),n.data&&Qe(`${n.name} data:`,n.data);return}let{dialog:s,devlog:l}=El(n,!1);l.message&&al(l),Ee(n),n.data&&Ee(`${n.name} data:`,n.data),j(this,_r,od).call(this,{isDialogOpen:!0,dialog:s})};this.addEventListener("error",t),this.media&&(this.media.errorTranslator=(r={})=>{var s,l,u;if(!(((s=this.media)==null?void 0:s.error)instanceof E.MediaError))return r;let{devlog:n}=El((l=this.media)==null?void 0:l.error,!1);return{player_error_code:(u=this.media)==null?void 0:u.error.code,player_error_message:n.message?String(n.message):r.player_error_message,player_error_context:n.context?String(n.context):r.player_error_context}}),(a=this.media)==null||a.addEventListener("error",r=>{var s,l;let{detail:n}=r;if(!n){let{message:u,code:c}=(l=(s=this.media)==null?void 0:s.error)!=null?l:{};n=new E.MediaError(u,c)}n!=null&&n.fatal&&this.dispatchEvent(new CustomEvent("error",{detail:n}))})},xo=new WeakSet,jm=function(){var a,r,n,s;let t=()=>j(this,bt,hi).call(this);(r=(a=this.media)==null?void 0:a.textTracks)==null||r.addEventListener("addtrack",t),(s=(n=this.media)==null?void 0:n.textTracks)==null||s.addEventListener("removetrack",t)},Do=new WeakSet,eh=function(){var c,b;if(!/Firefox/i.test(navigator.userAgent))return;let a,r=new WeakMap,n=()=>this.streamType===S.StreamTypes.LIVE&&!this.secondaryColor&&this.offsetWidth>=800,s=(g,v,f=!1)=>{if(n())return;Array.from(g&&g.activeCues||[]).forEach(A=>{if(!(!A.snapToLines||A.line<-5||A.line>=0&&A.line<10))if(!v||this.paused){let T=A.text.split(`
`).length,N=-3;this.streamType===S.StreamTypes.LIVE&&(N=-2);let te=N-T;if(A.line===te&&!f)return;r.has(A)||r.set(A,A.line),A.line=te}else setTimeout(()=>{A.line=r.get(A)||"auto"},500)})},l=()=>{var g,v;s(a,(v=(g=this.mediaController)==null?void 0:g.hasAttribute(D.USER_INACTIVE))!=null?v:!1)},u=()=>{var f,L;let v=Array.from(((L=(f=this.mediaController)==null?void 0:f.media)==null?void 0:L.textTracks)||[]).filter(A=>["subtitles","captions"].includes(A.kind)&&A.mode==="showing")[0];v!==a&&(a==null||a.removeEventListener("cuechange",l)),a=v,a==null||a.addEventListener("cuechange",l),s(a,R(this,Bt))};u(),(c=this.textTracks)==null||c.addEventListener("change",u),(b=this.textTracks)==null||b.addEventListener("addtrack",u),this.addEventListener("userinactivechange",()=>{var v,f;let g=(f=(v=this.mediaController)==null?void 0:v.hasAttribute(D.USER_INACTIVE))!=null?f:!0;R(this,Bt)!==g&&(Se(this,Bt,g),s(a,R(this,Bt)))})};function Ut(i,e){return i.media?i.media.getAttribute(e):i.getAttribute(e)}Q.customElements.get("mux-player")||(Q.customElements.define("mux-player",fr),Q.MuxPlayerElement=fr);var lf=fr;
