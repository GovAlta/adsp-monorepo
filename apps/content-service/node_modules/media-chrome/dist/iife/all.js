var MediaChrome=(()=>{var Ls=Object.defineProperty;var om=Object.getOwnPropertyDescriptor;var am=Object.getOwnPropertyNames;var lm=Object.prototype.hasOwnProperty;var ks=(i,t)=>{for(var e in t)Ls(i,e,{get:t[e],enumerable:!0})},dm=(i,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of am(t))!lm.call(i,r)&&r!==e&&Ls(i,r,{get:()=>t[r],enumerable:!(n=om(t,r))||n.enumerable});return i};var mm=i=>dm(Ls({},"__esModule",{value:!0}),i);var _s=(i,t,e)=>{if(!t.has(i))throw TypeError("Cannot "+e)};var o=(i,t,e)=>(_s(i,t,"read from private field"),e?e.call(i):t.get(i)),u=(i,t,e)=>{if(t.has(i))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(i):t.set(i,e)},h=(i,t,e,n)=>(_s(i,t,"write to private field"),n?n.call(i,e):t.set(i,e),e);var Xo=(i,t,e,n)=>({set _(r){h(i,t,r,e)},get _(){return o(i,t,n)}}),E=(i,t,e)=>(_s(i,t,"access private method"),e);var Yu={};ks(Yu,{AttrPart:()=>fe,AttrPartList:()=>Ts,ChildNodePart:()=>Rn,InnerTemplatePart:()=>ui,MediaAirplayButton:()=>qa,MediaAudioTrackMenu:()=>En,MediaAudioTrackMenuButton:()=>vn,MediaCaptionsButton:()=>Za,MediaCaptionsMenu:()=>si,MediaCaptionsMenuButton:()=>In,MediaCastButton:()=>el,MediaChromeButton:()=>Ka,MediaChromeDialog:()=>al,MediaChromeMenu:()=>W,MediaChromeMenuItem:()=>De,MediaChromeRange:()=>pl,MediaControlBar:()=>bl,MediaController:()=>Ba,MediaDurationDisplay:()=>fl,MediaFullscreenButton:()=>Al,MediaGestureReceiver:()=>Ea,MediaLiveButton:()=>yl,MediaLoadingIndicator:()=>_l,MediaMuteButton:()=>Dl,MediaPipButton:()=>Nl,MediaPlayButton:()=>$l,MediaPlaybackRateButton:()=>Hl,MediaPlaybackRateMenu:()=>Sn,MediaPlaybackRateMenuButton:()=>Mn,MediaPosterImage:()=>Vl,MediaPreviewChapterDisplay:()=>Gl,MediaPreviewThumbnail:()=>ql,MediaPreviewTimeDisplay:()=>Yl,MediaRenditionMenu:()=>Ln,MediaRenditionMenuButton:()=>_n,MediaSeekBackwardButton:()=>jl,MediaSeekForwardButton:()=>Zl,MediaSettingsMenu:()=>ii,MediaSettingsMenuButton:()=>pn,MediaSettingsMenuItem:()=>ni,MediaThemeElement:()=>ci,MediaTimeDisplay:()=>td,MediaTimeRange:()=>ad,MediaTooltip:()=>dd,MediaVolumeRange:()=>md,Part:()=>xn,TemplateInstance:()=>je,constants:()=>Bn,defaultProcessor:()=>Yd,labels:()=>ea,parse:()=>Eo,timeUtils:()=>Kn,tokenize:()=>po});var Bn={};ks(Bn,{AttributeToStateChangeEventMap:()=>xs,AvailabilityStates:()=>z,MediaStateChangeEvents:()=>ve,MediaStateReceiverAttributes:()=>I,MediaUIAttributes:()=>a,MediaUIEvents:()=>g,MediaUIProps:()=>On,PointerTypes:()=>Hn,ReadyStates:()=>hm,StateChangeEventToAttributeMap:()=>cm,StreamTypes:()=>ee,TextTrackKinds:()=>Y,TextTrackModes:()=>Le,VolumeLevels:()=>pm,WebkitPresentationModes:()=>Rs});var g={MEDIA_PLAY_REQUEST:"mediaplayrequest",MEDIA_PAUSE_REQUEST:"mediapauserequest",MEDIA_MUTE_REQUEST:"mediamuterequest",MEDIA_UNMUTE_REQUEST:"mediaunmuterequest",MEDIA_VOLUME_REQUEST:"mediavolumerequest",MEDIA_SEEK_REQUEST:"mediaseekrequest",MEDIA_AIRPLAY_REQUEST:"mediaairplayrequest",MEDIA_ENTER_FULLSCREEN_REQUEST:"mediaenterfullscreenrequest",MEDIA_EXIT_FULLSCREEN_REQUEST:"mediaexitfullscreenrequest",MEDIA_PREVIEW_REQUEST:"mediapreviewrequest",MEDIA_ENTER_PIP_REQUEST:"mediaenterpiprequest",MEDIA_EXIT_PIP_REQUEST:"mediaexitpiprequest",MEDIA_ENTER_CAST_REQUEST:"mediaentercastrequest",MEDIA_EXIT_CAST_REQUEST:"mediaexitcastrequest",MEDIA_SHOW_TEXT_TRACKS_REQUEST:"mediashowtexttracksrequest",MEDIA_HIDE_TEXT_TRACKS_REQUEST:"mediahidetexttracksrequest",MEDIA_SHOW_SUBTITLES_REQUEST:"mediashowsubtitlesrequest",MEDIA_DISABLE_SUBTITLES_REQUEST:"mediadisablesubtitlesrequest",MEDIA_TOGGLE_SUBTITLES_REQUEST:"mediatogglesubtitlesrequest",MEDIA_PLAYBACK_RATE_REQUEST:"mediaplaybackraterequest",MEDIA_RENDITION_REQUEST:"mediarenditionrequest",MEDIA_AUDIO_TRACK_REQUEST:"mediaaudiotrackrequest",MEDIA_SEEK_TO_LIVE_REQUEST:"mediaseektoliverequest",REGISTER_MEDIA_STATE_RECEIVER:"registermediastatereceiver",UNREGISTER_MEDIA_STATE_RECEIVER:"unregistermediastatereceiver"},I={MEDIA_CHROME_ATTRIBUTES:"mediachromeattributes",MEDIA_CONTROLLER:"mediacontroller"},On={MEDIA_AIRPLAY_UNAVAILABLE:"mediaAirplayUnavailable",MEDIA_FULLSCREEN_UNAVAILABLE:"mediaFullscreenUnavailable",MEDIA_PIP_UNAVAILABLE:"mediaPipUnavailable",MEDIA_CAST_UNAVAILABLE:"mediaCastUnavailable",MEDIA_RENDITION_UNAVAILABLE:"mediaRenditionUnavailable",MEDIA_AUDIO_TRACK_UNAVAILABLE:"mediaAudioTrackUnavailable",MEDIA_WIDTH:"mediaWidth",MEDIA_HEIGHT:"mediaHeight",MEDIA_PAUSED:"mediaPaused",MEDIA_HAS_PLAYED:"mediaHasPlayed",MEDIA_ENDED:"mediaEnded",MEDIA_MUTED:"mediaMuted",MEDIA_VOLUME_LEVEL:"mediaVolumeLevel",MEDIA_VOLUME:"mediaVolume",MEDIA_VOLUME_UNAVAILABLE:"mediaVolumeUnavailable",MEDIA_IS_PIP:"mediaIsPip",MEDIA_IS_CASTING:"mediaIsCasting",MEDIA_IS_AIRPLAYING:"mediaIsAirplaying",MEDIA_SUBTITLES_LIST:"mediaSubtitlesList",MEDIA_SUBTITLES_SHOWING:"mediaSubtitlesShowing",MEDIA_IS_FULLSCREEN:"mediaIsFullscreen",MEDIA_PLAYBACK_RATE:"mediaPlaybackRate",MEDIA_CURRENT_TIME:"mediaCurrentTime",MEDIA_DURATION:"mediaDuration",MEDIA_SEEKABLE:"mediaSeekable",MEDIA_PREVIEW_TIME:"mediaPreviewTime",MEDIA_PREVIEW_IMAGE:"mediaPreviewImage",MEDIA_PREVIEW_COORDS:"mediaPreviewCoords",MEDIA_PREVIEW_CHAPTER:"mediaPreviewChapter",MEDIA_LOADING:"mediaLoading",MEDIA_BUFFERED:"mediaBuffered",MEDIA_STREAM_TYPE:"mediaStreamType",MEDIA_TARGET_LIVE_WINDOW:"mediaTargetLiveWindow",MEDIA_TIME_IS_LIVE:"mediaTimeIsLive",MEDIA_RENDITION_LIST:"mediaRenditionList",MEDIA_RENDITION_SELECTED:"mediaRenditionSelected",MEDIA_AUDIO_TRACK_LIST:"mediaAudioTrackList",MEDIA_AUDIO_TRACK_ENABLED:"mediaAudioTrackEnabled",MEDIA_CHAPTERS_CUES:"mediaChaptersCues"},Jo=Object.entries(On),a=Jo.reduce((i,[t,e])=>(i[t]=e.toLowerCase(),i),{}),um={USER_INACTIVE:"userinactivechange",BREAKPOINTS_CHANGE:"breakpointchange",BREAKPOINTS_COMPUTED:"breakpointscomputed"},ve=Jo.reduce((i,[t,e])=>(i[t]=e.toLowerCase(),i),{...um}),cm=Object.entries(ve).reduce((i,[t,e])=>{let n=a[t];return n&&(i[e]=n),i},{userinactivechange:"userinactive"}),xs=Object.entries(a).reduce((i,[t,e])=>{let n=ve[t];return n&&(i[e]=n),i},{userinactive:"userinactivechange"}),Y={SUBTITLES:"subtitles",CAPTIONS:"captions",DESCRIPTIONS:"descriptions",CHAPTERS:"chapters",METADATA:"metadata"},Le={DISABLED:"disabled",HIDDEN:"hidden",SHOWING:"showing"},hm={HAVE_NOTHING:0,HAVE_METADATA:1,HAVE_CURRENT_DATA:2,HAVE_FUTURE_DATA:3,HAVE_ENOUGH_DATA:4},Hn={MOUSE:"mouse",PEN:"pen",TOUCH:"touch"},z={UNAVAILABLE:"unavailable",UNSUPPORTED:"unsupported"},ee={LIVE:"live",ON_DEMAND:"on-demand",UNKNOWN:"unknown"},pm={HIGH:"high",MEDIUM:"medium",LOW:"low",OFF:"off"},Rs={INLINE:"inline",FULLSCREEN:"fullscreen",PICTURE_IN_PICTURE:"picture-in-picture"};var y={ENTER_AIRPLAY:"Start airplay",EXIT_AIRPLAY:"Stop airplay",AUDIO_TRACK_MENU:"Audio",CAPTIONS:"Captions",ENABLE_CAPTIONS:"Enable captions",DISABLE_CAPTIONS:"Disable captions",START_CAST:"Start casting",STOP_CAST:"Stop casting",ENTER_FULLSCREEN:"Enter fullscreen mode",EXIT_FULLSCREEN:"Exit fullscreen mode",MUTE:"Mute",UNMUTE:"Unmute",ENTER_PIP:"Enter picture in picture mode",EXIT_PIP:"Enter picture in picture mode",PLAY:"Play",PAUSE:"Pause",PLAYBACK_RATE:"Playback rate",RENDITIONS:"Quality",SEEK_BACKWARD:"Seek backward",SEEK_FORWARD:"Seek forward",SETTINGS:"Settings"},B={AUDIO_PLAYER:()=>"audio player",VIDEO_PLAYER:()=>"video player",VOLUME:()=>"volume",SEEK:()=>"seek",CLOSED_CAPTIONS:()=>"closed captions",PLAYBACK_RATE:({playbackRate:i=1}={})=>`current playback rate ${i}`,PLAYBACK_TIME:()=>"playback time",MEDIA_LOADING:()=>"media loading",SETTINGS:()=>"settings",AUDIO_TRACKS:()=>"audio tracks",QUALITY:()=>"quality"},F={PLAY:()=>"play",PAUSE:()=>"pause",MUTE:()=>"mute",UNMUTE:()=>"unmute",ENTER_AIRPLAY:()=>"start airplay",EXIT_AIRPLAY:()=>"stop airplay",ENTER_CAST:()=>"start casting",EXIT_CAST:()=>"stop casting",ENTER_FULLSCREEN:()=>"enter fullscreen mode",EXIT_FULLSCREEN:()=>"exit fullscreen mode",ENTER_PIP:()=>"enter picture in picture mode",EXIT_PIP:()=>"exit picture in picture mode",SEEK_FORWARD_N_SECS:({seekOffset:i=30}={})=>`seek forward ${i} seconds`,SEEK_BACK_N_SECS:({seekOffset:i=30}={})=>`seek back ${i} seconds`,SEEK_LIVE:()=>"seek to live",PLAYING_LIVE:()=>"playing live"},ea={...B,...F};var Kn={};ks(Kn,{emptyTimeRanges:()=>aa,formatAsTimePhrase:()=>Oe,formatTime:()=>se,serializeTimeRanges:()=>Tm});function ta(i){return i==null?void 0:i.map(Em).join(" ")}function ia(i){return i==null?void 0:i.split(/\s+/).map(bm)}function Em(i){if(i){let{id:t,width:e,height:n}=i;return[t,e,n].filter(r=>r!=null).join(":")}}function bm(i){if(i){let[t,e,n]=i.split(":");return{id:t,width:+e,height:+n}}}function na(i){return i==null?void 0:i.map(gm).join(" ")}function ra(i){return i==null?void 0:i.split(/\s+/).map(fm)}function gm(i){if(i){let{id:t,kind:e,language:n,label:r}=i;return[t,e,n,r].filter(s=>s!=null).join(":")}}function fm(i){if(i){let[t,e,n,r]=i.split(":");return{id:t,kind:e,language:n,label:r}}}function sa(i){return i.replace(/[-_]([a-z])/g,(t,e)=>e.toUpperCase())}function Pt(i){return typeof i=="number"&&!Number.isNaN(i)&&Number.isFinite(i)}function Fn(i){return typeof i!="string"?!1:!isNaN(i)&&!isNaN(parseFloat(i))}var $n=i=>new Promise(t=>setTimeout(t,i));var oa=[{singular:"hour",plural:"hours"},{singular:"minute",plural:"minutes"},{singular:"second",plural:"seconds"}],vm=(i,t)=>{let e=i===1?oa[t].singular:oa[t].plural;return`${i} ${e}`},Oe=i=>{if(!Pt(i))return"";let t=Math.abs(i),e=t!==i,n=new Date(0,0,0,0,0,t,0);return`${[n.getHours(),n.getMinutes(),n.getSeconds()].map((d,c)=>d&&vm(d,c)).filter(d=>d).join(", ")}${e?" remaining":""}`};function se(i,t){let e=!1;i<0&&(e=!0,i=0-i),i=i<0?0:i;let n=Math.floor(i%60),r=Math.floor(i/60%60),s=Math.floor(i/3600),l=Math.floor(t/60%60),d=Math.floor(t/3600);return(isNaN(i)||i===1/0)&&(s=r=n="0"),s=s>0||d>0?s+":":"",r=((s||l>=10)&&r<10?"0"+r:r)+":",n=n<10?"0"+n:n,(e?"-":"")+s+r+n}var aa=Object.freeze({length:0,start(i){let t=i>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(i){let t=i>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0}});function Tm(i=aa){return Array.from(i).map((t,e)=>[Number(i.start(e).toFixed(3)),Number(i.end(e).toFixed(3))].join(":")).join(" ")}var Vn=class{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}},Gn=class extends Vn{},Wn=class extends Gn{constructor(){super(...arguments);this.role=null}},Cs=class{observe(){}unobserve(){}disconnect(){}},la={createElement:function(){return new Ei.HTMLElement},createElementNS:function(){return new Ei.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent(i){return!1}},Ei={ResizeObserver:Cs,document:la,Node:Gn,Element:Wn,HTMLElement:class extends Wn{constructor(){super(...arguments);this.innerHTML=""}get content(){return new Ei.DocumentFragment}},DocumentFragment:class extends Vn{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem(i){return null},setItem(i,t){},removeItem(i){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return""}},matchMedia(i){return{matches:!1,media:i}}},da=typeof window=="undefined"||typeof window.customElements=="undefined",ma=Object.keys(Ei).every(i=>i in globalThis),m=da&&!ma?Ei:globalThis,b=da&&!ma?la:globalThis.document;var ua=new WeakMap,Ds=i=>{let t=ua.get(i);return t||ua.set(i,t=new Set),t},ca=new m.ResizeObserver(i=>{for(let t of i)for(let e of Ds(t.target))e(t)});function ke(i,t){Ds(i).add(t),ca.observe(i)}function ze(i,t){let e=Ds(i);e.delete(t),e.size||ca.unobserve(i)}function K(i){var t;return(t=qn(i))!=null?t:Te(i,"media-controller")}function qn(i){var n;let{MEDIA_CONTROLLER:t}=I,e=i.getAttribute(t);if(e)return(n=Ze(i))==null?void 0:n.getElementById(e)}var Yn=(i,t,e=".value")=>{let n=i.querySelector(e);n&&(n.textContent=t)},Am=(i,t)=>{let e=`slot[name="${t}"]`,n=i.shadowRoot.querySelector(e);return n?n.children:[]},Qn=(i,t)=>Am(i,t)[0],Q=(i,t)=>!i||!t?!1:i!=null&&i.contains(t)?!0:Q(i,t.getRootNode().host),Te=(i,t)=>{if(!i)return null;let e=i.closest(t);return e||Te(i.getRootNode().host,t)};function bi(i=document){var e;let t=i==null?void 0:i.activeElement;return t?(e=bi(t.shadowRoot))!=null?e:t:null}function Ze(i){var e;let t=(e=i==null?void 0:i.getRootNode)==null?void 0:e.call(i);return t instanceof ShadowRoot||t instanceof Document?t:null}function jn(i,{depth:t=3,checkOpacity:e=!0,checkVisibilityCSS:n=!0}={}){if(i.checkVisibility)return i.checkVisibility({checkOpacity:e,checkVisibilityCSS:n});let r=i;for(;r&&t>0;){let s=getComputedStyle(r);if(e&&s.opacity==="0"||n&&s.visibility==="hidden"||s.display==="none")return!1;r=r.parentElement,t--}return!0}function ha(i,t,e,n){let r=ws(e,n),s=ws(e,{x:i,y:t}),l=ws(n,{x:i,y:t});return s>r||l>r?s>l?1:0:s/r}function ws(i,t){return Math.sqrt(Math.pow(t.x-i.x,2)+Math.pow(t.y-i.y,2))}function N(i,t){let e=Im(i,n=>n===t);return e||Ps(i,t)}function Im(i,t){var n,r;let e;for(e of(n=i.querySelectorAll("style:not([media])"))!=null?n:[]){let s;try{s=(r=e.sheet)==null?void 0:r.cssRules}catch{continue}for(let l of s!=null?s:[])if(t(l.selectorText))return l}}function Ps(i,t){var r,s;let e=(r=i.querySelectorAll("style:not([media])"))!=null?r:[],n=e==null?void 0:e[e.length-1];return n!=null&&n.sheet?(n==null||n.sheet.insertRule(`${t}{}`,n.sheet.cssRules.length),(s=n.sheet.cssRules)==null?void 0:s[n.sheet.cssRules.length-1]):(console.warn("Media Chrome: No style sheet found on style tag of",i),{style:{setProperty:()=>{},removeProperty:()=>"",getPropertyValue:()=>""}})}function k(i,t,e=Number.NaN){let n=i.getAttribute(t);return n!=null?+n:e}function C(i,t,e){let n=+e;if(e==null||Number.isNaN(n)){i.hasAttribute(t)&&i.removeAttribute(t);return}k(i,t,void 0)!==n&&i.setAttribute(t,`${n}`)}function U(i,t){return i.hasAttribute(t)}function P(i,t,e){if(e==null){i.hasAttribute(t)&&i.removeAttribute(t);return}U(i,t)!=e&&i.toggleAttribute(t,e)}function _(i,t,e=null){var n;return(n=i.getAttribute(t))!=null?n:e}function M(i,t,e){if(e==null){i.hasAttribute(t)&&i.removeAttribute(t);return}let n=`${e}`;_(i,t,void 0)!==n&&i.setAttribute(t,n)}var pa=b.createElement("template");pa.innerHTML=`
<style>
  :host {
    display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
    box-sizing: border-box;
  }
</style>
`;var j,zn=class extends m.HTMLElement{constructor(e={}){super();u(this,j,void 0);if(!this.shadowRoot){let n=this.attachShadow({mode:"open"}),r=pa.content.cloneNode(!0);this.nativeEl=r;let s=e.slotTemplate;s||(s=b.createElement("template"),s.innerHTML=`<slot>${e.defaultContent||""}</slot>`),this.nativeEl.appendChild(s.content.cloneNode(!0)),n.appendChild(r)}}static get observedAttributes(){return[I.MEDIA_CONTROLLER,a.MEDIA_PAUSED]}attributeChangedCallback(e,n,r){var s,l,d,c,p;e===I.MEDIA_CONTROLLER&&(n&&((l=(s=o(this,j))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,j,null)),r&&this.isConnected&&(h(this,j,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,j))==null?void 0:c.associateElement)==null||p.call(c,this)))}connectedCallback(){var e,n,r,s;this.tabIndex=-1,this.setAttribute("aria-hidden","true"),h(this,j,Sm(this)),this.getAttribute(I.MEDIA_CONTROLLER)&&((n=(e=o(this,j))==null?void 0:e.associateElement)==null||n.call(e,this)),(r=o(this,j))==null||r.addEventListener("pointerdown",this),(s=o(this,j))==null||s.addEventListener("click",this)}disconnectedCallback(){var e,n,r,s;this.getAttribute(I.MEDIA_CONTROLLER)&&((n=(e=o(this,j))==null?void 0:e.unassociateElement)==null||n.call(e,this)),(r=o(this,j))==null||r.removeEventListener("pointerdown",this),(s=o(this,j))==null||s.removeEventListener("click",this),h(this,j,null)}handleEvent(e){var s;let n=(s=e.composedPath())==null?void 0:s[0];if(["video","media-controller"].includes(n==null?void 0:n.localName)){if(e.type==="pointerdown")this._pointerType=e.pointerType;else if(e.type==="click"){let{clientX:l,clientY:d}=e,{left:c,top:p,width:f,height:A}=this.getBoundingClientRect(),T=l-c,v=d-p;if(T<0||v<0||T>f||v>A||f===0&&A===0)return;let{pointerType:x=this._pointerType}=e;if(this._pointerType=void 0,x===Hn.TOUCH){this.handleTap(e);return}else if(x===Hn.MOUSE){this.handleMouseClick(e);return}}}}get mediaPaused(){return U(this,a.MEDIA_PAUSED)}set mediaPaused(e){P(this,a.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){let n=this.mediaPaused?g.MEDIA_PLAY_REQUEST:g.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new m.CustomEvent(n,{composed:!0,bubbles:!0}))}};j=new WeakMap;function Sm(i){var e;let t=i.getAttribute(I.MEDIA_CONTROLLER);return t?(e=i.getRootNode())==null?void 0:e.getElementById(t):Te(i,"media-controller")}m.customElements.get("media-gesture-receiver")||m.customElements.define("media-gesture-receiver",zn);var Ea=zn;var w={AUDIO:"audio",AUTOHIDE:"autohide",BREAKPOINTS:"breakpoints",GESTURES_DISABLED:"gesturesdisabled",KEYBOARD_CONTROL:"keyboardcontrol",NO_AUTOHIDE:"noautohide",USER_INACTIVE:"userinactive"},ba=b.createElement("template");ba.innerHTML=`
  <style>
    
    :host([${a.MEDIA_IS_FULLSCREEN}]) ::slotted([slot=media]) {
      outline: none;
    }

    :host {
      box-sizing: border-box;
      position: relative;
      display: inline-block;
      line-height: 0;
      background-color: var(--media-background-color, #000);
    }

    :host(:not([${w.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
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

    
    :host([${w.AUDIO}]) slot[name=media] {
      display: var(--media-slot-display, none);
    }

    
    :host([${w.AUDIO}]) [part~=layer][part~=gesture-layer] {
      height: 0;
      display: block;
    }

    
    :host(:not([${w.AUDIO}])[${w.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
    :host(:not([${w.AUDIO}])[${w.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
      display: none;
    }

    
    ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([hidden])) {
      pointer-events: auto;
    }

    :host(:not([${w.AUDIO}])) *[part~=layer][part~=centered-layer] {
      align-items: center;
      justify-content: center;
    }

    :host(:not([${w.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
    :host(:not([${w.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
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

    
    :host(:not([${w.AUDIO}])) .spacer {
      flex-grow: 1;
    }

    
    :host(:-webkit-full-screen) {
      
      width: 100% !important;
      height: 100% !important;
    }

    
    ::slotted(:not([slot=media]):not([slot=poster]):not([${w.NO_AUTOHIDE}]):not([hidden])) {
      opacity: 1;
      transition: opacity 0.25s;
    }

    
    :host([${w.USER_INACTIVE}]:not([${a.MEDIA_PAUSED}]):not([${a.MEDIA_IS_AIRPLAYING}]):not([${a.MEDIA_IS_CASTING}]):not([${w.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${w.NO_AUTOHIDE}])) {
      opacity: 0;
      transition: opacity 1s;
    }

    :host([${w.USER_INACTIVE}]:not([${a.MEDIA_PAUSED}]):not([${a.MEDIA_IS_CASTING}]):not([${w.AUDIO}])) ::slotted([slot=media]) {
      cursor: none;
    }

    ::slotted(media-control-bar)  {
      align-self: stretch;
    }

    
    :host(:not([${w.AUDIO}])[${a.MEDIA_HAS_PLAYED}]) slot[name=poster] {
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
`;var ym=Object.values(a),Mm="sm:384 md:576 lg:768 xl:960";function Lm(i){km(i.target,i.contentRect.width)}function km(i,t){var l;if(!i.isConnected)return;let e=(l=i.getAttribute(w.BREAKPOINTS))!=null?l:Mm,n=_m(e),r=xm(n,t),s=!1;if(Object.keys(n).forEach(d=>{if(r.includes(d)){i.hasAttribute(`breakpoint${d}`)||(i.setAttribute(`breakpoint${d}`,""),s=!0);return}i.hasAttribute(`breakpoint${d}`)&&(i.removeAttribute(`breakpoint${d}`),s=!0)}),s){let d=new CustomEvent(ve.BREAKPOINTS_CHANGE,{detail:r});i.dispatchEvent(d)}}function _m(i){let t=i.split(/\s+/);return Object.fromEntries(t.map(e=>e.split(":")))}function xm(i,t){return Object.keys(i).filter(e=>t>=parseInt(i[e]))}var vi,Xe,Ut,Je,Xn,ga,Jn,fa,Nt,Zn,Ti,Us,et,gi,fi=class extends m.HTMLElement{constructor(){super();u(this,Xn);u(this,Jn);u(this,Nt);u(this,Ti);u(this,et);u(this,vi,0);u(this,Xe,null);u(this,Ut,null);u(this,Je,void 0);this.breakpointsComputed=!1;this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(ba.content.cloneNode(!0)));let e=d=>{let c=this.media;for(let p of d)p.type==="childList"&&(p.removedNodes.forEach(f=>{if(f.slot=="media"&&p.target==this){let A=p.previousSibling&&p.previousSibling.previousElementSibling;if(!A||!c)this.mediaUnsetCallback(f);else{let T=A.slot!=="media";for(;(A=A.previousSibling)!==null;)A.slot=="media"&&(T=!1);T&&this.mediaUnsetCallback(f)}}}),c&&p.addedNodes.forEach(f=>{f===c&&this.handleMediaUpdated(c)}))};new MutationObserver(e).observe(this,{childList:!0,subtree:!0});let r=!1;ke(this,d=>{r||(setTimeout(()=>{Lm(d),r=!1,this.breakpointsComputed||(this.breakpointsComputed=!0,this.dispatchEvent(new CustomEvent(ve.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))},0),r=!0)});let l=this.querySelector(":scope > slot[slot=media]");l&&l.addEventListener("slotchange",()=>{if(!l.assignedElements({flatten:!0}).length){o(this,Xe)&&this.mediaUnsetCallback(o(this,Xe));return}this.handleMediaUpdated(this.media)})}static get observedAttributes(){return[w.AUTOHIDE,w.GESTURES_DISABLED].concat(ym).filter(e=>![a.MEDIA_RENDITION_LIST,a.MEDIA_AUDIO_TRACK_LIST,a.MEDIA_CHAPTERS_CUES,a.MEDIA_WIDTH,a.MEDIA_HEIGHT].includes(e))}attributeChangedCallback(e,n,r){e.toLowerCase()==w.AUTOHIDE&&(this.autohide=r)}get media(){let e=this.querySelector(":scope > [slot=media]");return(e==null?void 0:e.nodeName)=="SLOT"&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(h(this,Xe,e),e.localName.includes("-")&&await m.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var r;let n=this.getAttribute(w.AUDIO)!=null?B.AUDIO_PLAYER():B.VIDEO_PLAYER();this.setAttribute("role","region"),this.setAttribute("aria-label",n),this.handleMediaUpdated(this.media),this.setAttribute(w.USER_INACTIVE,""),this.addEventListener("pointerdown",this),this.addEventListener("pointermove",this),this.addEventListener("pointerup",this),this.addEventListener("mouseleave",this),this.addEventListener("keyup",this),(r=m.window)==null||r.addEventListener("mouseup",this)}disconnectedCallback(){var e;this.media&&this.mediaUnsetCallback(this.media),(e=m.window)==null||e.removeEventListener("mouseup",this)}mediaSetCallback(e){}mediaUnsetCallback(e){h(this,Xe,null)}handleEvent(e){switch(e.type){case"pointerdown":h(this,vi,e.timeStamp);break;case"pointermove":E(this,Xn,ga).call(this,e);break;case"pointerup":E(this,Jn,fa).call(this,e);break;case"mouseleave":E(this,Nt,Zn).call(this);break;case"mouseup":this.removeAttribute(w.KEYBOARD_CONTROL);break;case"keyup":E(this,et,gi).call(this),this.setAttribute(w.KEYBOARD_CONTROL,"");break}}set autohide(e){let n=Number(e);h(this,Je,isNaN(n)?0:n)}get autohide(){return(o(this,Je)===void 0?2:o(this,Je)).toString()}};vi=new WeakMap,Xe=new WeakMap,Ut=new WeakMap,Je=new WeakMap,Xn=new WeakSet,ga=function(e){e.pointerType!=="mouse"&&e.timeStamp-o(this,vi)<250||(E(this,Ti,Us).call(this),clearTimeout(o(this,Ut)),[this,this.media].includes(e.target)&&E(this,et,gi).call(this))},Jn=new WeakSet,fa=function(e){if(e.pointerType==="touch"){let n=!this.hasAttribute(w.USER_INACTIVE);[this,this.media].includes(e.target)&&n?E(this,Nt,Zn).call(this):E(this,et,gi).call(this)}else e.composedPath().some(n=>["media-play-button","media-fullscreen-button"].includes(n==null?void 0:n.localName))&&E(this,et,gi).call(this)},Nt=new WeakSet,Zn=function(){if(o(this,Je)<0||this.hasAttribute(w.USER_INACTIVE))return;this.setAttribute(w.USER_INACTIVE,"");let e=new m.CustomEvent(ve.USER_INACTIVE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(e)},Ti=new WeakSet,Us=function(){if(!this.hasAttribute(w.USER_INACTIVE))return;this.removeAttribute(w.USER_INACTIVE);let e=new m.CustomEvent(ve.USER_INACTIVE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(e)},et=new WeakSet,gi=function(){E(this,Ti,Us).call(this),clearTimeout(o(this,Ut));let e=parseInt(this.autohide);e<0||h(this,Ut,setTimeout(()=>{E(this,Nt,Zn).call(this)},e*1e3))};m.customElements.get("media-container")||m.customElements.define("media-container",fi);var tt,it,Ai,Be,Ae,He,Ie=class{constructor(t,e,{defaultValue:n}={defaultValue:void 0}){u(this,Ae);u(this,tt,void 0);u(this,it,void 0);u(this,Ai,void 0);u(this,Be,new Set);h(this,tt,t),h(this,it,e),h(this,Ai,new Set(n))}[Symbol.iterator](){return o(this,Ae,He).values()}get length(){return o(this,Ae,He).size}get value(){var t;return(t=[...o(this,Ae,He)].join(" "))!=null?t:""}set value(t){var e;t!==this.value&&(h(this,Be,new Set),this.add(...(e=t==null?void 0:t.split(" "))!=null?e:[]))}toString(){return this.value}item(t){return[...o(this,Ae,He)][t]}values(){return o(this,Ae,He).values()}forEach(t,e){o(this,Ae,He).forEach(t,e)}add(...t){var e,n;t.forEach(r=>o(this,Be).add(r)),!(this.value===""&&!((e=o(this,tt))!=null&&e.hasAttribute(`${o(this,it)}`)))&&((n=o(this,tt))==null||n.setAttribute(`${o(this,it)}`,`${this.value}`))}remove(...t){var e;t.forEach(n=>o(this,Be).delete(n)),(e=o(this,tt))==null||e.setAttribute(`${o(this,it)}`,`${this.value}`)}contains(t){return o(this,Ae,He).has(t)}toggle(t,e){return typeof e!="undefined"?e?(this.add(t),!0):(this.remove(t),!1):this.contains(t)?(this.remove(t),!1):(this.add(t),!0)}replace(t,e){return this.remove(t),this.add(e),t===e}};tt=new WeakMap,it=new WeakMap,Ai=new WeakMap,Be=new WeakMap,Ae=new WeakSet,He=function(){return o(this,Be).size?o(this,Be):o(this,Ai)};var Rm=(i="")=>i.split(/\s+/),va=(i="")=>{let[t,e,n]=i.split(":"),r=n?decodeURIComponent(n):void 0;return{kind:t==="cc"?Y.CAPTIONS:Y.SUBTITLES,language:e,label:r}},nt=(i="",t={})=>Rm(i).map(e=>{let n=va(e);return{...t,...n}}),Ns=i=>i?Array.isArray(i)?i.map(t=>typeof t=="string"?va(t):t):typeof i=="string"?nt(i):[i]:[],er=({kind:i,label:t,language:e}={kind:"subtitles"})=>t?`${i==="captions"?"cc":"sb"}:${e}:${encodeURIComponent(t)}`:e,_e=(i=[])=>Array.prototype.map.call(i,er).join(" "),Cm=(i,t)=>e=>e[i]===t,Ta=i=>{let t=Object.entries(i).map(([e,n])=>Cm(e,n));return e=>t.every(n=>n(e))},rt=(i,t=[],e=[])=>{let n=Ns(e).map(Ta),r=s=>n.some(l=>l(s));Array.from(t).filter(r).forEach(s=>{s.mode=i})},st=(i,t=()=>!0)=>{if(!(i!=null&&i.textTracks))return[];let e=typeof t=="function"?t:Ta(t);return Array.from(i.textTracks).filter(e)},tr=i=>{var e;return!!((e=i.mediaSubtitlesShowing)!=null&&e.length)||i.hasAttribute(a.MEDIA_SUBTITLES_SHOWING)};var Ia=i=>{var r;let{media:t,fullscreenElement:e}=i,n=e&&"requestFullscreen"in e?"requestFullscreen":e&&"webkitRequestFullScreen"in e?"webkitRequestFullScreen":void 0;if(n){let s=(r=e[n])==null?void 0:r.call(e);if(s instanceof Promise)return s.catch(()=>{})}else t!=null&&t.webkitEnterFullscreen?t.webkitEnterFullscreen():t!=null&&t.requestFullscreen&&t.requestFullscreen()},Aa="exitFullscreen"in b?"exitFullscreen":"webkitExitFullscreen"in b?"webkitExitFullscreen":"webkitCancelFullScreen"in b?"webkitCancelFullScreen":void 0,Sa=i=>{var e;let{documentElement:t}=i;if(Aa){let n=(e=t==null?void 0:t[Aa])==null?void 0:e.call(t);if(n instanceof Promise)return n.catch(()=>{})}},Ii="fullscreenElement"in b?"fullscreenElement":"webkitFullscreenElement"in b?"webkitFullscreenElement":void 0,Dm=i=>{let{documentElement:t,media:e}=i,n=t==null?void 0:t[Ii];return!n&&"webkitDisplayingFullscreen"in e&&"webkitPresentationMode"in e&&e.webkitDisplayingFullscreen&&e.webkitPresentationMode===Rs.FULLSCREEN?e:n},ya=i=>{var s;let{media:t,documentElement:e,fullscreenElement:n=t}=i;if(!t||!e)return!1;let r=Dm(i);if(!r)return!1;if(r===n||r===t)return!0;if(r.localName.includes("-")){let l=r.shadowRoot;if(!(Ii in l))return Q(r,n);for(;l!=null&&l[Ii];){if(l[Ii]===n)return!0;l=(s=l[Ii])==null?void 0:s.shadowRoot}}return!1},wm="fullscreenEnabled"in b?"fullscreenEnabled":"webkitFullscreenEnabled"in b?"webkitFullscreenEnabled":void 0,Ma=i=>{let{documentElement:t,media:e}=i;return!!(t!=null&&t[wm])||e&&"webkitSupportsFullscreen"in e};var ir,Os=()=>{var i,t;return ir||(ir=(t=(i=b)==null?void 0:i.createElement)==null?void 0:t.call(i,"video"),ir)},La=async(i=Os())=>{if(!i)return!1;let t=i.volume;i.volume=t/2+.1;let e=new AbortController,n=await Promise.race([Pm(i,e.signal),Um(i,t)]);return e.abort(),n},Pm=(i,t)=>new Promise(e=>{i.addEventListener("volumechange",()=>e(!0),{signal:t})}),Um=async(i,t)=>{for(let e=0;e<10;e++){if(i.volume===t)return!1;await $n(10)}return i.volume!==t},Nm=/.*Version\/.*Safari\/.*/.test(m.navigator.userAgent),Hs=(i=Os())=>m.matchMedia("(display-mode: standalone)").matches&&Nm?!1:typeof(i==null?void 0:i.requestPictureInPicture)=="function",Bs=(i=Os())=>Ma({documentElement:b,media:i}),ka=Bs(),_a=Hs(),xa=!!m.WebKitPlaybackTargetAvailabilityEvent,Ra=!!m.chrome;var Ot=i=>st(i.media,t=>[Y.SUBTITLES,Y.CAPTIONS].includes(t.kind)).sort((t,e)=>t.kind>=e.kind?1:-1),Fs=i=>st(i.media,t=>t.mode===Le.SHOWING&&[Y.SUBTITLES,Y.CAPTIONS].includes(t.kind)),nr=(i,t)=>{let e=Ot(i),n=Fs(i),r=!!n.length;if(e.length){if(t===!1||r&&t!==!0)rt(Le.DISABLED,e,n);else if(t===!0||!r&&t!==!1){let s=e[0],{options:l}=i;if(!(l!=null&&l.noSubtitlesLangPref)){let f=globalThis.localStorage.getItem("media-chrome-pref-subtitles-lang"),A=f?[f,...globalThis.navigator.languages]:globalThis.navigator.languages,T=e.filter(v=>A.some(x=>v.language.toLowerCase().startsWith(x.split("-")[0]))).sort((v,x)=>{let S=A.findIndex(D=>v.language.toLowerCase().startsWith(D.split("-")[0])),L=A.findIndex(D=>x.language.toLowerCase().startsWith(D.split("-")[0]));return S-L});T[0]&&(s=T[0])}let{language:d,label:c,kind:p}=s;rt(Le.DISABLED,e,n),rt(Le.SHOWING,e,[{language:d,label:c,kind:p}])}}},rr=(i,t)=>i===t?!0:typeof i!=typeof t?!1:typeof i=="number"&&Number.isNaN(i)&&Number.isNaN(t)?!0:typeof i!="object"?!1:Array.isArray(i)?Om(i,t):Object.entries(i).every(([e,n])=>e in t&&rr(n,t[e])),Om=(i,t)=>{let e=Array.isArray(i),n=Array.isArray(t);return e!==n?!1:e||n?i.length!==t.length?!1:i.every((r,s)=>rr(r,t[s])):!0};var Hm=Object.values(ee),sr,Bm=La().then(i=>(sr=i,sr)),Ca=async(...i)=>{await Promise.all(i.filter(t=>t).map(async t=>{if(!("localName"in t&&t instanceof m.HTMLElement))return;let e=t.localName;if(!e.includes("-"))return;let n=m.customElements.get(e);n&&t instanceof n||(await m.customElements.whenDefined(e),m.customElements.upgrade(t))}))},Si={mediaWidth:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.videoWidth)!=null?e:0},mediaEvents:["resize"]},mediaHeight:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.videoHeight)!=null?e:0},mediaEvents:["resize"]},mediaPaused:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.paused)!=null?e:!0},set(i,t){var n;let{media:e}=t;e&&(i?e.pause():(n=e.play())==null||n.catch(()=>{}))},mediaEvents:["play","playing","pause","emptied"]},mediaHasPlayed:{get(i,t){let{media:e}=i;return e?t?t.type==="playing":!e.paused:!1},mediaEvents:["playing","emptied"]},mediaEnded:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.ended)!=null?e:!1},mediaEvents:["seeked","ended","emptied"]},mediaPlaybackRate:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.playbackRate)!=null?e:1},set(i,t){let{media:e}=t;e&&Number.isFinite(+i)&&(e.playbackRate=+i)},mediaEvents:["ratechange","loadstart"]},mediaMuted:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.muted)!=null?e:!1},set(i,t){let{media:e}=t;e&&(e.muted=i)},mediaEvents:["volumechange"]},mediaVolume:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.volume)!=null?e:1},set(i,t){let{media:e}=t;if(e){try{i==null?m.localStorage.removeItem("media-chrome-pref-volume"):m.localStorage.setItem("media-chrome-pref-volume",i.toString())}catch{}Number.isFinite(+i)&&(e.volume=+i)}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(i,t)=>{let{options:{noVolumePref:e}}=t;if(!e)try{let n=m.localStorage.getItem("media-chrome-pref-volume");if(n==null)return;Si.mediaVolume.set(+n,t),i(+n)}catch(n){console.debug("Error getting volume pref",n)}}]},mediaVolumeLevel:{get(i){let{media:t}=i;return typeof(t==null?void 0:t.volume)=="undefined"?"high":t.muted||t.volume===0?"off":t.volume<.5?"low":t.volume<.75?"medium":"high"},mediaEvents:["volumechange"]},mediaCurrentTime:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.currentTime)!=null?e:0},set(i,t){let{media:e}=t;!e||!Pt(i)||(e.currentTime=i)},mediaEvents:["timeupdate","loadedmetadata"]},mediaDuration:{get(i){let{media:t,options:{defaultDuration:e}={}}=i;return e&&(!t||!t.duration||Number.isNaN(t.duration)||!Number.isFinite(t.duration))?e:Number.isFinite(t==null?void 0:t.duration)?t.duration:Number.NaN},mediaEvents:["durationchange","loadedmetadata","emptied"]},mediaLoading:{get(i){let{media:t}=i;return(t==null?void 0:t.readyState)<3},mediaEvents:["waiting","playing","emptied"]},mediaSeekable:{get(i){var r;let{media:t}=i;if(!((r=t==null?void 0:t.seekable)!=null&&r.length))return;let e=t.seekable.start(0),n=t.seekable.end(t.seekable.length-1);if(!(!e&&!n))return[Number(e.toFixed(3)),Number(n.toFixed(3))]},mediaEvents:["loadedmetadata","emptied","progress","seekablechange"]},mediaBuffered:{get(i){var n;let{media:t}=i,e=(n=t==null?void 0:t.buffered)!=null?n:[];return Array.from(e).map((r,s)=>[Number(e.start(s).toFixed(3)),Number(e.end(s).toFixed(3))])},mediaEvents:["progress","emptied"]},mediaStreamType:{get(i){let{media:t,options:{defaultStreamType:e}={}}=i,n=[ee.LIVE,ee.ON_DEMAND].includes(e)?e:void 0;if(!t)return n;let{streamType:r}=t;if(Hm.includes(r))return r===ee.UNKNOWN?n:r;let s=t.duration;return s===1/0?ee.LIVE:Number.isFinite(s)?ee.ON_DEMAND:n},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange"]},mediaTargetLiveWindow:{get(i){let{media:t}=i;if(!t)return Number.NaN;let{targetLiveWindow:e}=t,n=Si.mediaStreamType.get(i);return(e==null||Number.isNaN(e))&&n===ee.LIVE?0:e},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange","targetlivewindowchange"]},mediaTimeIsLive:{get(i){let{media:t,options:{liveEdgeOffset:e=10}={}}=i;if(!t)return!1;if(typeof t.liveEdgeStart=="number")return Number.isNaN(t.liveEdgeStart)?!1:t.currentTime>=t.liveEdgeStart;if(!(Si.mediaStreamType.get(i)===ee.LIVE))return!1;let r=t.seekable;if(!r)return!0;if(!r.length)return!1;let s=r.end(r.length-1)-e;return t.currentTime>=s},mediaEvents:["playing","timeupdate","progress","waiting","emptied"]},mediaSubtitlesList:{get(i){return Ot(i).map(({kind:t,label:e,language:n})=>({kind:t,label:e,language:n}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack"]},mediaSubtitlesShowing:{get(i){return Fs(i).map(({kind:t,label:e,language:n})=>({kind:t,label:e,language:n}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(i,t)=>{var s,l;let{media:e,options:n}=t;if(!e)return;let r=d=>{var p;!n.defaultSubtitles||d&&![Y.CAPTIONS,Y.SUBTITLES].includes((p=d==null?void 0:d.track)==null?void 0:p.kind)||nr(t,!0)};return(s=e.textTracks)==null||s.addEventListener("addtrack",r),(l=e.textTracks)==null||l.addEventListener("removetrack",r),r(),()=>{var d,c;(d=e.textTracks)==null||d.removeEventListener("addtrack",r),(c=e.textTracks)==null||c.removeEventListener("removetrack",r)}}]},mediaChaptersCues:{get(i){var n;let{media:t}=i;if(!t)return[];let[e]=st(t,{kind:Y.CHAPTERS});return Array.from((n=e==null?void 0:e.cues)!=null?n:[]).map(({text:r,startTime:s,endTime:l})=>({text:r,startTime:s,endTime:l}))},mediaEvents:["loadstart","loadedmetadata"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(i,t)=>{var s;let{media:e}=t;if(!e)return;let n=e.querySelector('track[kind="chapters"][default][src]'),r=(s=e.shadowRoot)==null?void 0:s.querySelector(':is(video,audio) > track[kind="chapters"][default][src]');return n==null||n.addEventListener("load",i),r==null||r.addEventListener("load",i),()=>{n==null||n.removeEventListener("load",i),r==null||r.removeEventListener("load",i)}}]},mediaIsPip:{get(i){var n,r;let{media:t,documentElement:e}=i;if(!t||!e||!e.pictureInPictureElement)return!1;if(e.pictureInPictureElement===t)return!0;if(e.pictureInPictureElement instanceof HTMLMediaElement)return(n=t.localName)!=null&&n.includes("-")?Q(t,e.pictureInPictureElement):!1;if(e.pictureInPictureElement.localName.includes("-")){let s=e.pictureInPictureElement.shadowRoot;for(;s!=null&&s.pictureInPictureElement;){if(s.pictureInPictureElement===t)return!0;s=(r=s.pictureInPictureElement)==null?void 0:r.shadowRoot}}return!1},set(i,t){let{media:e}=t;if(e)if(i){if(!b.pictureInPictureEnabled){console.warn("MediaChrome: Picture-in-picture is not enabled");return}if(!e.requestPictureInPicture){console.warn("MediaChrome: The current media does not support picture-in-picture");return}let n=()=>{console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.")};e.requestPictureInPicture().catch(r=>{if(r.code===11){if(!e.src){console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a src set.");return}if(e.readyState===0&&e.preload==="none"){let s=()=>{e.removeEventListener("loadedmetadata",l),e.preload="none"},l=()=>{e.requestPictureInPicture().catch(n),s()};e.addEventListener("loadedmetadata",l),e.preload="metadata",setTimeout(()=>{e.readyState===0&&n(),s()},1e3)}else throw r}else throw r})}else b.pictureInPictureElement&&b.exitPictureInPicture()},mediaEvents:["enterpictureinpicture","leavepictureinpicture"]},mediaRenditionList:{get(i){var e;let{media:t}=i;return[...(e=t==null?void 0:t.videoRenditions)!=null?e:[]].map(n=>({...n}))},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaRenditionSelected:{get(i){var e,n,r;let{media:t}=i;return(r=(n=t==null?void 0:t.videoRenditions)==null?void 0:n[(e=t.videoRenditions)==null?void 0:e.selectedIndex])==null?void 0:r.id},set(i,t){let{media:e}=t;if(!(e!=null&&e.videoRenditions)){console.warn("MediaController: Rendition selection not supported by this media.");return}let n=i,r=Array.prototype.findIndex.call(e.videoRenditions,s=>s.id==n);e.videoRenditions.selectedIndex!=r&&(e.videoRenditions.selectedIndex=r)},mediaEvents:["emptied"],videoRenditionsEvents:["addrendition","removerendition","change"]},mediaAudioTrackList:{get(i){var e;let{media:t}=i;return[...(e=t==null?void 0:t.audioTracks)!=null?e:[]]},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaAudioTrackEnabled:{get(i){var e,n;let{media:t}=i;return(n=[...(e=t==null?void 0:t.audioTracks)!=null?e:[]].find(r=>r.enabled))==null?void 0:n.id},set(i,t){let{media:e}=t;if(!(e!=null&&e.audioTracks)){console.warn("MediaChrome: Audio track selection not supported by this media.");return}let n=i;for(let r of e.audioTracks)r.enabled=n==r.id},mediaEvents:["emptied"],audioTracksEvents:["addtrack","removetrack","change"]},mediaIsFullscreen:{get(i){return ya(i)},set(i,t){i?Ia(t):Sa(t)},rootEvents:["fullscreenchange","webkitfullscreenchange"],mediaEvents:["webkitbeginfullscreen","webkitendfullscreen","webkitpresentationmodechanged"]},mediaIsCasting:{get(i){var e;let{media:t}=i;return!(t!=null&&t.remote)||((e=t.remote)==null?void 0:e.state)==="disconnected"?!1:!!t.remote.state},set(i,t){var n,r;let{media:e}=t;if(e&&!(i&&((n=e.remote)==null?void 0:n.state)!=="disconnected")&&!(!i&&((r=e.remote)==null?void 0:r.state)!=="connected")){if(typeof e.remote.prompt!="function"){console.warn("MediaChrome: Casting is not supported in this environment");return}e.remote.prompt().catch(()=>{})}},remoteEvents:["connect","connecting","disconnect"]},mediaIsAirplaying:{get(){return!1},set(i,t){let{media:e}=t;if(e){if(!(e.webkitShowPlaybackTargetPicker&&m.WebKitPlaybackTargetAvailabilityEvent)){console.warn("MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment");return}e.webkitShowPlaybackTargetPicker()}},mediaEvents:["webkitcurrentplaybacktargetiswirelesschanged"]},mediaFullscreenUnavailable:{get(i){let{media:t}=i;if(!ka||!Bs(t))return z.UNSUPPORTED}},mediaPipUnavailable:{get(i){let{media:t}=i;if(!_a||!Hs(t))return z.UNSUPPORTED}},mediaVolumeUnavailable:{get(i){let{media:t}=i;if(sr===!1||(t==null?void 0:t.volume)==null)return z.UNSUPPORTED},stateOwnersUpdateHandlers:[i=>{sr==null&&Bm.then(t=>i(t?void 0:z.UNSUPPORTED))}]},mediaCastUnavailable:{get(i,{availability:t="not-available"}={}){var n;let{media:e}=i;if(!Ra||!((n=e==null?void 0:e.remote)!=null&&n.state))return z.UNSUPPORTED;if(!(t==null||t==="available"))return z.UNAVAILABLE},stateOwnersUpdateHandlers:[(i,t)=>{var r;let{media:e}=t;return e?(e.disableRemotePlayback||e.hasAttribute("disableremoteplayback")||(r=e==null?void 0:e.remote)==null||r.watchAvailability(s=>{i({availability:s?"available":"not-available"})}).catch(s=>{s.name==="NotSupportedError"?i({availability:null}):i({availability:"not-available"})}),()=>{var s;(s=e==null?void 0:e.remote)==null||s.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaAirplayUnavailable:{get(i,t){if(!xa)return z.UNSUPPORTED;if((t==null?void 0:t.availability)==="not-available")return z.UNAVAILABLE},mediaEvents:["webkitplaybacktargetavailabilitychanged"],stateOwnersUpdateHandlers:[(i,t)=>{var r;let{media:e}=t;return e?(e.disableRemotePlayback||e.hasAttribute("disableremoteplayback")||(r=e==null?void 0:e.remote)==null||r.watchAvailability(s=>{i({availability:s?"available":"not-available"})}).catch(s=>{s.name==="NotSupportedError"?i({availability:null}):i({availability:"not-available"})}),()=>{var s;(s=e==null?void 0:e.remote)==null||s.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaRenditionUnavailable:{get(i){var e;let{media:t}=i;if(!(t!=null&&t.videoRenditions))return z.UNSUPPORTED;if(!((e=t.videoRenditions)!=null&&e.length))return z.UNAVAILABLE},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaAudioTrackUnavailable:{get(i){var e,n;let{media:t}=i;if(!(t!=null&&t.audioTracks))return z.UNSUPPORTED;if(((n=(e=t.audioTracks)==null?void 0:e.length)!=null?n:0)<=1)return z.UNAVAILABLE},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]}};var Da={[g.MEDIA_PREVIEW_REQUEST](i,t,{detail:e}){var f,A,T;let{media:n}=t,r=e!=null?e:void 0,s,l;if(n&&r!=null){let[v]=st(n,{kind:Y.METADATA,label:"thumbnails"}),x=Array.prototype.find.call((f=v==null?void 0:v.cues)!=null?f:[],(S,L,D)=>L===0?S.endTime>r:L===D.length-1?S.startTime<=r:S.startTime<=r&&S.endTime>r);if(x){let S=/'^(?:[a-z]+:)?\/\//i.test(x.text)||(A=n==null?void 0:n.querySelector('track[label="thumbnails"]'))==null?void 0:A.src,L=new URL(x.text,S);l=new URLSearchParams(L.hash).get("#xywh").split(",").map(q=>+q),s=L.href}}let d=i.mediaDuration.get(t),p=(T=i.mediaChaptersCues.get(t).find((v,x,S)=>x===S.length-1&&d===v.endTime?v.startTime<=r&&v.endTime>=r:v.startTime<=r&&v.endTime>r))==null?void 0:T.text;return e!=null&&p==null&&(p=""),{mediaPreviewTime:r,mediaPreviewImage:s,mediaPreviewCoords:l,mediaPreviewChapter:p}},[g.MEDIA_PAUSE_REQUEST](i,t){i["mediaPaused"].set(!0,t)},[g.MEDIA_PLAY_REQUEST](i,t){var s;let e="mediaPaused";if(i.mediaStreamType.get(t)===ee.LIVE){let l=!(i.mediaTargetLiveWindow.get(t)>0),d=(s=i.mediaSeekable.get(t))==null?void 0:s[1];l&&d&&i.mediaCurrentTime.set(d,t)}i[e].set(!1,t)},[g.MEDIA_PLAYBACK_RATE_REQUEST](i,t,{detail:e}){let n="mediaPlaybackRate",r=e;i[n].set(r,t)},[g.MEDIA_MUTE_REQUEST](i,t){i["mediaMuted"].set(!0,t)},[g.MEDIA_UNMUTE_REQUEST](i,t){let e="mediaMuted";i.mediaVolume.get(t)||i.mediaVolume.set(.25,t),i[e].set(!1,t)},[g.MEDIA_VOLUME_REQUEST](i,t,{detail:e}){let n="mediaVolume",r=e;r&&i.mediaMuted.get(t)&&i.mediaMuted.set(!1,t),i[n].set(r,t)},[g.MEDIA_SEEK_REQUEST](i,t,{detail:e}){let n="mediaCurrentTime",r=e;i[n].set(r,t)},[g.MEDIA_SEEK_TO_LIVE_REQUEST](i,t){var r;let e="mediaCurrentTime",n=(r=i.mediaSeekable.get(t))==null?void 0:r[1];Number.isNaN(Number(n))||i[e].set(n,t)},[g.MEDIA_SHOW_SUBTITLES_REQUEST](i,t,{detail:e}){var d;let{options:n}=t,r=Ot(t),s=Ns(e),l=(d=s[0])==null?void 0:d.language;l&&!n.noSubtitlesLangPref&&m.localStorage.setItem("media-chrome-pref-subtitles-lang",l),rt(Le.SHOWING,r,s)},[g.MEDIA_DISABLE_SUBTITLES_REQUEST](i,t,{detail:e}){let n=Ot(t),r=e!=null?e:[];rt(Le.DISABLED,n,r)},[g.MEDIA_TOGGLE_SUBTITLES_REQUEST](i,t,{detail:e}){nr(t,e)},[g.MEDIA_RENDITION_REQUEST](i,t,{detail:e}){let n="mediaRenditionSelected",r=e;i[n].set(r,t)},[g.MEDIA_AUDIO_TRACK_REQUEST](i,t,{detail:e}){let n="mediaAudioTrackEnabled",r=e;i[n].set(r,t)},[g.MEDIA_ENTER_PIP_REQUEST](i,t){let e="mediaIsPip";i.mediaIsFullscreen.get(t)&&i.mediaIsFullscreen.set(!1,t),i[e].set(!0,t)},[g.MEDIA_EXIT_PIP_REQUEST](i,t){i["mediaIsPip"].set(!1,t)},[g.MEDIA_ENTER_FULLSCREEN_REQUEST](i,t){let e="mediaIsFullscreen";i.mediaIsPip.get(t)&&i.mediaIsPip.set(!1,t),i[e].set(!0,t)},[g.MEDIA_EXIT_FULLSCREEN_REQUEST](i,t){i["mediaIsFullscreen"].set(!1,t)},[g.MEDIA_ENTER_CAST_REQUEST](i,t){let e="mediaIsCasting";i.mediaIsFullscreen.get(t)&&i.mediaIsFullscreen.set(!1,t),i[e].set(!0,t)},[g.MEDIA_EXIT_CAST_REQUEST](i,t){i["mediaIsCasting"].set(!1,t)},[g.MEDIA_AIRPLAY_REQUEST](i,t){i["mediaIsAirplaying"].set(!0,t)}};var Fm=({media:i,fullscreenElement:t,documentElement:e,stateMediator:n=Si,requestMap:r=Da,options:s={},monitorStateOwnersOnlyWithSubscriptions:l=!0})=>{let d=[],c={options:{...s}},p=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0}),f=S=>{S!=null&&(rr(S,p)||(p=Object.freeze({...p,...S}),d.forEach(L=>L(p))))},A=()=>{let S=Object.entries(n).reduce((L,[D,{get:q}])=>(L[D]=q(c),L),{});f(S)},T={},v,x=async(S,L)=>{var Uo,No,Oo,Ho,Bo,Fo,$o,Ko,Vo,Go,Wo,qo,Yo,Qo,jo,zo;let D=!!v;if(v={...c,...v!=null?v:{},...S},D)return;await Ca(...Object.values(S));let q=d.length>0&&L===0&&l,Me=c.media!==v.media,Ne=((Uo=c.media)==null?void 0:Uo.textTracks)!==((No=v.media)==null?void 0:No.textTracks),hi=((Oo=c.media)==null?void 0:Oo.videoRenditions)!==((Ho=v.media)==null?void 0:Ho.videoRenditions),Dt=((Bo=c.media)==null?void 0:Bo.audioTracks)!==((Fo=v.media)==null?void 0:Fo.audioTracks),vo=(($o=c.media)==null?void 0:$o.remote)!==((Ko=v.media)==null?void 0:Ko.remote),To=c.documentElement!==v.documentElement,Ao=!!c.media&&(Me||q),Io=!!((Vo=c.media)!=null&&Vo.textTracks)&&(Ne||q),So=!!((Go=c.media)!=null&&Go.videoRenditions)&&(hi||q),yo=!!((Wo=c.media)!=null&&Wo.audioTracks)&&(Dt||q),Mo=!!((qo=c.media)!=null&&qo.remote)&&(vo||q),Lo=!!c.documentElement&&(To||q),ko=Ao||Io||So||yo||Mo||Lo,wt=d.length===0&&L===1&&l,_o=!!v.media&&(Me||wt),xo=!!((Yo=v.media)!=null&&Yo.textTracks)&&(Ne||wt),Ro=!!((Qo=v.media)!=null&&Qo.videoRenditions)&&(hi||wt),Co=!!((jo=v.media)!=null&&jo.audioTracks)&&(Dt||wt),Do=!!((zo=v.media)!=null&&zo.remote)&&(vo||wt),wo=!!v.documentElement&&(To||wt),Po=_o||xo||Ro||Co||Do||wo;if(!(ko||Po)){Object.entries(v).forEach(([H,pi])=>{c[H]=pi}),A(),v=void 0;return}Object.entries(n).forEach(([H,{get:pi,mediaEvents:Jd=[],textTracksEvents:em=[],videoRenditionsEvents:tm=[],audioTracksEvents:im=[],remoteEvents:nm=[],rootEvents:rm=[],stateOwnersUpdateHandlers:sm=[]}])=>{T[H]||(T[H]={});let Z=V=>{let X=pi(c,V);f({[H]:X})},G;G=T[H].mediaEvents,Jd.forEach(V=>{G&&Ao&&(c.media.removeEventListener(V,G),T[H].mediaEvents=void 0),_o&&(v.media.addEventListener(V,Z),T[H].mediaEvents=Z)}),G=T[H].textTracksEvents,em.forEach(V=>{var X,re;G&&Io&&((X=c.media.textTracks)==null||X.removeEventListener(V,G),T[H].textTracksEvents=void 0),xo&&((re=v.media.textTracks)==null||re.addEventListener(V,Z),T[H].textTracksEvents=Z)}),G=T[H].videoRenditionsEvents,tm.forEach(V=>{var X,re;G&&So&&((X=c.media.videoRenditions)==null||X.removeEventListener(V,G),T[H].videoRenditionsEvents=void 0),Ro&&((re=v.media.videoRenditions)==null||re.addEventListener(V,Z),T[H].videoRenditionsEvents=Z)}),G=T[H].audioTracksEvents,im.forEach(V=>{var X,re;G&&yo&&((X=c.media.audioTracks)==null||X.removeEventListener(V,G),T[H].audioTracksEvents=void 0),Co&&((re=v.media.audioTracks)==null||re.addEventListener(V,Z),T[H].audioTracksEvents=Z)}),G=T[H].remoteEvents,nm.forEach(V=>{var X,re;G&&Mo&&((X=c.media.remote)==null||X.removeEventListener(V,G),T[H].remoteEvents=void 0),Do&&((re=v.media.remote)==null||re.addEventListener(V,Z),T[H].remoteEvents=Z)}),G=T[H].rootEvents,rm.forEach(V=>{G&&Lo&&(c.documentElement.removeEventListener(V,G),T[H].rootEvents=void 0),wo&&(v.documentElement.addEventListener(V,Z),T[H].rootEvents=Z)});let Zo=T[H].stateOwnersUpdateHandlers;sm.forEach(V=>{Zo&&ko&&Zo(),Po&&(T[H].stateOwnersUpdateHandlers=V(Z,v))})}),Object.entries(v).forEach(([H,pi])=>{c[H]=pi}),A(),v=void 0};return x({media:i,fullscreenElement:t,documentElement:e,options:s}),{dispatch(S){let{type:L,detail:D}=S;if(r[L]){f(r[L](n,c,S));return}L==="mediaelementchangerequest"?x({media:D}):L==="fullscreenelementchangerequest"?x({fullscreenElement:D}):L==="documentelementchangerequest"?x({documentElement:D}):L==="optionschangerequest"&&Object.entries(D!=null?D:{}).forEach(([q,Me])=>{c.options[q]=Me})},getState(){return p},subscribe(S){return x({},d.length+1),d.push(S),S(p),()=>{let L=d.indexOf(S);L>=0&&(x({},d.length-1),d.splice(L,1))}}}},wa=Fm;var Pa=["ArrowLeft","ArrowRight","Enter"," ","f","m","k","c"],Ua=10,R={DEFAULT_SUBTITLES:"defaultsubtitles",DEFAULT_STREAM_TYPE:"defaultstreamtype",DEFAULT_DURATION:"defaultduration",FULLSCREEN_ELEMENT:"fullscreenelement",HOTKEYS:"hotkeys",KEYS_USED:"keysused",LIVE_EDGE_OFFSET:"liveedgeoffset",NO_AUTO_SEEK_TO_LIVE:"noautoseektolive",NO_HOTKEYS:"nohotkeys",NO_VOLUME_PREF:"novolumepref",NO_SUBTITLES_LANG_PREF:"nosubtitleslangpref",NO_DEFAULT_STORE:"nodefaultstore",KEYBOARD_FORWARD_SEEK_OFFSET:"keyboardforwardseekoffset",KEYBOARD_BACKWARD_SEEK_OFFSET:"keyboardbackwardseekoffset"},xe,Ht,$,Bt,oe,Mi,Li,Ks,at,yi,ki,Vs,or=class extends fi{constructor(){super();u(this,Li);u(this,at);u(this,ki);this.mediaStateReceivers=[];this.associatedElementSubscriptions=new Map;u(this,xe,new Ie(this,R.HOTKEYS));u(this,Ht,void 0);u(this,$,void 0);u(this,Bt,void 0);u(this,oe,void 0);u(this,Mi,e=>{var n;(n=o(this,$))==null||n.dispatch(e)});this.associateElement(this);let e={};h(this,Bt,n=>{Object.entries(n).forEach(([r,s])=>{if(r in e&&e[r]===s)return;this.propagateMediaState(r,s);let l=r.toLowerCase(),d=new m.CustomEvent(xs[l],{composed:!0,detail:s});this.dispatchEvent(d)}),e=n}),this.enableHotkeys()}static get observedAttributes(){return super.observedAttributes.concat(R.NO_HOTKEYS,R.HOTKEYS,R.DEFAULT_STREAM_TYPE,R.DEFAULT_SUBTITLES,R.DEFAULT_DURATION)}get mediaStore(){return o(this,$)}set mediaStore(e){var n,r;if(o(this,$)&&((n=o(this,oe))==null||n.call(this),h(this,oe,void 0)),h(this,$,e),!o(this,$)&&!this.hasAttribute(R.NO_DEFAULT_STORE)){E(this,Li,Ks).call(this);return}h(this,oe,(r=o(this,$))==null?void 0:r.subscribe(o(this,Bt)))}get fullscreenElement(){var e;return(e=o(this,Ht))!=null?e:this}set fullscreenElement(e){var n;this.hasAttribute(R.FULLSCREEN_ELEMENT)&&this.removeAttribute(R.FULLSCREEN_ELEMENT),h(this,Ht,e),(n=o(this,$))==null||n.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}attributeChangedCallback(e,n,r){var s,l,d,c,p,f;if(super.attributeChangedCallback(e,n,r),e===R.NO_HOTKEYS)r!==n&&r===""?(this.hasAttribute(R.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):r!==n&&r===null&&this.enableHotkeys();else if(e===R.HOTKEYS)o(this,xe).value=r;else if(e===R.DEFAULT_SUBTITLES&&r!==n)(s=o(this,$))==null||s.dispatch({type:"optionschangerequest",detail:{defaultSubtitles:this.hasAttribute(R.DEFAULT_SUBTITLES)}});else if(e===R.DEFAULT_STREAM_TYPE)(d=o(this,$))==null||d.dispatch({type:"optionschangerequest",detail:{defaultStreamType:(l=this.getAttribute(R.DEFAULT_STREAM_TYPE))!=null?l:void 0}});else if(e===R.LIVE_EDGE_OFFSET)(c=o(this,$))==null||c.dispatch({type:"optionschangerequest",detail:{liveEdgeOffset:this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0}});else if(e===R.FULLSCREEN_ELEMENT){let A=r?(p=this.getRootNode())==null?void 0:p.getElementById(r):void 0;h(this,Ht,A),(f=o(this,$))==null||f.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}}connectedCallback(){var e,n;!o(this,$)&&!this.hasAttribute(R.NO_DEFAULT_STORE)&&E(this,Li,Ks).call(this),(e=o(this,$))==null||e.dispatch({type:"documentelementchangerequest",detail:b}),super.connectedCallback(),o(this,$)&&!o(this,oe)&&h(this,oe,(n=o(this,$))==null?void 0:n.subscribe(o(this,Bt))),this.enableHotkeys()}disconnectedCallback(){var e,n,r,s;(e=super.disconnectedCallback)==null||e.call(this),o(this,$)&&((n=o(this,$))==null||n.dispatch({type:"documentelementchangerequest",detail:void 0}),(r=o(this,$))==null||r.dispatch({type:g.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})),o(this,oe)&&((s=o(this,oe))==null||s.call(this),h(this,oe,void 0))}mediaSetCallback(e){var n;super.mediaSetCallback(e),(n=o(this,$))==null||n.dispatch({type:"mediaelementchangerequest",detail:e}),e.hasAttribute("tabindex")||(e.tabIndex=-1)}mediaUnsetCallback(e){var n;super.mediaUnsetCallback(e),(n=o(this,$))==null||n.dispatch({type:"mediaelementchangerequest",detail:void 0})}propagateMediaState(e,n){Oa(this.mediaStateReceivers,e,n)}associateElement(e){if(!e)return;let{associatedElementSubscriptions:n}=this;if(n.has(e))return;let r=this.registerMediaStateReceiver.bind(this),s=this.unregisterMediaStateReceiver.bind(this),l=qm(e,r,s);Object.values(g).forEach(d=>{e.addEventListener(d,o(this,Mi))}),n.set(e,l)}unassociateElement(e){if(!e)return;let{associatedElementSubscriptions:n}=this;if(!n.has(e))return;n.get(e)(),n.delete(e),Object.values(g).forEach(s=>{e.removeEventListener(s,o(this,Mi))})}registerMediaStateReceiver(e){if(!e)return;let n=this.mediaStateReceivers;n.indexOf(e)>-1||(n.push(e),o(this,$)&&Object.entries(o(this,$).getState()).forEach(([s,l])=>{Oa([e],s,l)}))}unregisterMediaStateReceiver(e){let n=this.mediaStateReceivers,r=n.indexOf(e);r<0||n.splice(r,1)}enableHotkeys(){this.addEventListener("keydown",E(this,ki,Vs))}disableHotkeys(){this.removeEventListener("keydown",E(this,ki,Vs)),this.removeEventListener("keyup",E(this,at,yi))}get hotkeys(){return o(this,xe)}keyboardShortcutHandler(e){var c,p,f,A,T;let n=e.target;if(((f=(p=(c=n.getAttribute(R.KEYS_USED))==null?void 0:c.split(" "))!=null?p:n==null?void 0:n.keysUsed)!=null?f:[]).map(v=>v==="Space"?" ":v).filter(Boolean).includes(e.key))return;let s,l,d;if(!o(this,xe).contains(`no${e.key.toLowerCase()}`)&&!(e.key===" "&&o(this,xe).contains("nospace")))switch(e.key){case" ":case"k":s=o(this,$).getState().mediaPaused?g.MEDIA_PLAY_REQUEST:g.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new m.CustomEvent(s,{composed:!0,bubbles:!0}));break;case"m":s=this.mediaStore.getState().mediaVolumeLevel==="off"?g.MEDIA_UNMUTE_REQUEST:g.MEDIA_MUTE_REQUEST,this.dispatchEvent(new m.CustomEvent(s,{composed:!0,bubbles:!0}));break;case"f":s=this.mediaStore.getState().mediaIsFullscreen?g.MEDIA_EXIT_FULLSCREEN_REQUEST:g.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new m.CustomEvent(s,{composed:!0,bubbles:!0}));break;case"c":this.dispatchEvent(new m.CustomEvent(g.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case"ArrowLeft":{let v=this.hasAttribute(R.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(R.KEYBOARD_BACKWARD_SEEK_OFFSET):Ua;l=Math.max(((A=this.mediaStore.getState().mediaCurrentTime)!=null?A:0)-v,0),d=new m.CustomEvent(g.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:l}),this.dispatchEvent(d);break}case"ArrowRight":{let v=this.hasAttribute(R.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(R.KEYBOARD_FORWARD_SEEK_OFFSET):Ua;l=Math.max(((T=this.mediaStore.getState().mediaCurrentTime)!=null?T:0)+v,0),d=new m.CustomEvent(g.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:l}),this.dispatchEvent(d);break}default:break}}};xe=new WeakMap,Ht=new WeakMap,$=new WeakMap,Bt=new WeakMap,oe=new WeakMap,Mi=new WeakMap,Li=new WeakSet,Ks=function(){var e;this.mediaStore=wa({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(R.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(R.DEFAULT_DURATION)?+this.getAttribute(R.DEFAULT_DURATION):void 0,defaultStreamType:(e=this.getAttribute(R.DEFAULT_STREAM_TYPE))!=null?e:void 0,liveEdgeOffset:this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0,noVolumePref:this.hasAttribute(R.NO_VOLUME_PREF),noSubtitlesLangPref:this.hasAttribute(R.NO_SUBTITLES_LANG_PREF)}})},at=new WeakSet,yi=function(e){let{key:n}=e;if(!Pa.includes(n)){this.removeEventListener("keyup",E(this,at,yi));return}this.keyboardShortcutHandler(e)},ki=new WeakSet,Vs=function(e){let{metaKey:n,altKey:r,key:s}=e;if(n||r||!Pa.includes(s)){this.removeEventListener("keyup",E(this,at,yi));return}[" ","ArrowLeft","ArrowRight"].includes(s)&&!(o(this,xe).contains(`no${s.toLowerCase()}`)||s===" "&&o(this,xe).contains("nospace"))&&e.preventDefault(),this.addEventListener("keyup",E(this,at,yi),{once:!0})};var $m=Object.values(a),Km=Object.values(On),Ha=i=>{var n,r,s,l;let{observedAttributes:t}=i.constructor;!t&&((n=i.nodeName)!=null&&n.includes("-"))&&(m.customElements.upgrade(i),{observedAttributes:t}=i.constructor);let e=(l=(s=(r=i==null?void 0:i.getAttribute)==null?void 0:r.call(i,I.MEDIA_CHROME_ATTRIBUTES))==null?void 0:s.split)==null?void 0:l.call(s,/\s+/);return Array.isArray(t||e)?(t||e).filter(d=>$m.includes(d)):[]},Vm=i=>{var t,e;return(t=i.nodeName)!=null&&t.includes("-")&&m.customElements.get((e=i.nodeName)==null?void 0:e.toLowerCase())&&!(i instanceof m.customElements.get(i.nodeName.toLowerCase()))&&m.customElements.upgrade(i),Km.some(n=>n in i)},Gs=i=>Vm(i)||!!Ha(i).length,Na=i=>{var t;return(t=i==null?void 0:i.join)==null?void 0:t.call(i,":")},$s={[a.MEDIA_SUBTITLES_LIST]:_e,[a.MEDIA_SUBTITLES_SHOWING]:_e,[a.MEDIA_SEEKABLE]:Na,[a.MEDIA_BUFFERED]:i=>i==null?void 0:i.map(Na).join(" "),[a.MEDIA_PREVIEW_COORDS]:i=>i==null?void 0:i.join(" "),[a.MEDIA_RENDITION_LIST]:ta,[a.MEDIA_AUDIO_TRACK_LIST]:na},Gm=async(i,t,e)=>{var r,s;if(i.isConnected||await $n(0),typeof e=="boolean"||e==null)return P(i,t,e);if(typeof e=="number")return C(i,t,e);if(typeof e=="string")return M(i,t,e);if(Array.isArray(e)&&!e.length)return i.removeAttribute(t);let n=(s=(r=$s[t])==null?void 0:r.call($s,e))!=null?s:e;return i.setAttribute(t,n)},Wm=i=>{var t;return!!((t=i.closest)!=null&&t.call(i,'*[slot="media"]'))},ot=(i,t)=>{if(Wm(i))return;let e=(r,s)=>{var p,f;Gs(r)&&s(r);let{children:l=[]}=r!=null?r:{},d=(f=(p=r==null?void 0:r.shadowRoot)==null?void 0:p.children)!=null?f:[];[...l,...d].forEach(A=>ot(A,s))},n=i==null?void 0:i.nodeName.toLowerCase();if(n.includes("-")&&!Gs(i)){m.customElements.whenDefined(n).then(()=>{e(i,t)});return}e(i,t)},Oa=(i,t,e)=>{i.forEach(n=>{if(t in n){n[t]=e;return}let r=Ha(n),s=t.toLowerCase();r.includes(s)&&Gm(n,s,e)})},qm=(i,t,e)=>{ot(i,t);let n=f=>{var T;let A=(T=f==null?void 0:f.composedPath()[0])!=null?T:f.target;t(A)},r=f=>{var T;let A=(T=f==null?void 0:f.composedPath()[0])!=null?T:f.target;e(A)};i.addEventListener(g.REGISTER_MEDIA_STATE_RECEIVER,n),i.addEventListener(g.UNREGISTER_MEDIA_STATE_RECEIVER,r);let s=f=>{f.forEach(A=>{let{addedNodes:T=[],removedNodes:v=[],type:x,target:S,attributeName:L}=A;x==="childList"?(Array.prototype.forEach.call(T,D=>ot(D,t)),Array.prototype.forEach.call(v,D=>ot(D,e))):x==="attributes"&&L===I.MEDIA_CHROME_ATTRIBUTES&&(Gs(S)?t(S):e(S))})},l=[],d=f=>{let A=f.target;A.name!=="media"&&(l.forEach(T=>ot(T,e)),l=[...A.assignedElements({flatten:!0})],l.forEach(T=>ot(T,t)))};i.addEventListener("slotchange",d);let c=new MutationObserver(s);return c.observe(i,{childList:!0,attributes:!0,subtree:!0}),()=>{ot(i,e),i.removeEventListener("slotchange",d),c.disconnect(),i.removeEventListener(g.REGISTER_MEDIA_STATE_RECEIVER,n),i.removeEventListener(g.UNREGISTER_MEDIA_STATE_RECEIVER,r)}};m.customElements.get("media-controller")||m.customElements.define("media-controller",or);var Ba=or;var ar={TOOLTIP_PLACEMENT:"tooltipplacement"},Fa=b.createElement("template");Fa.innerHTML=`
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
`;var ae,lt,Re,dt,_i,lr,$a,O=class extends m.HTMLElement{constructor(e={}){var n;super();u(this,lr);u(this,ae,void 0);this.preventClick=!1;this.tooltipEl=null;this.tooltipContent="";u(this,lt,e=>{this.preventClick||this.handleClick(e),setTimeout(o(this,Re),0)});u(this,Re,()=>{var e,n;(n=(e=this.tooltipEl)==null?void 0:e.updateXOffset)==null||n.call(e)});u(this,dt,e=>{let{key:n}=e;if(!this.keysUsed.includes(n)){this.removeEventListener("keyup",o(this,dt));return}this.preventClick||this.handleClick(e)});u(this,_i,e=>{let{metaKey:n,altKey:r,key:s}=e;if(n||r||!this.keysUsed.includes(s)){this.removeEventListener("keyup",o(this,dt));return}this.addEventListener("keyup",o(this,dt),{once:!0})});if(!this.shadowRoot){this.attachShadow({mode:"open"});let r=Fa.content.cloneNode(!0);this.nativeEl=r;let s=e.slotTemplate;s||(s=b.createElement("template"),s.innerHTML=`<slot>${e.defaultContent||""}</slot>`),e.tooltipContent&&(r.querySelector('slot[name="tooltip-content"]').innerHTML=(n=e.tooltipContent)!=null?n:"",this.tooltipContent=e.tooltipContent),this.nativeEl.appendChild(s.content.cloneNode(!0)),this.shadowRoot.appendChild(r)}this.tooltipEl=this.shadowRoot.querySelector("media-tooltip")}static get observedAttributes(){return["disabled",ar.TOOLTIP_PLACEMENT,I.MEDIA_CONTROLLER]}enable(){this.addEventListener("click",o(this,lt)),this.addEventListener("keydown",o(this,_i)),this.tabIndex=0}disable(){this.removeEventListener("click",o(this,lt)),this.removeEventListener("keydown",o(this,_i)),this.removeEventListener("keyup",o(this,dt)),this.tabIndex=-1}attributeChangedCallback(e,n,r){var s,l,d,c,p;e===I.MEDIA_CONTROLLER?(n&&((l=(s=o(this,ae))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,ae,null)),r&&this.isConnected&&(h(this,ae,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,ae))==null?void 0:c.associateElement)==null||p.call(c,this))):e==="disabled"&&r!==n?r==null?this.enable():this.disable():e===ar.TOOLTIP_PLACEMENT&&this.tooltipEl&&r!==n&&(this.tooltipEl.placement=r),o(this,Re).call(this)}connectedCallback(){var r,s,l;let{style:e}=N(this.shadowRoot,":host");e.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","button");let n=this.getAttribute(I.MEDIA_CONTROLLER);n&&(h(this,ae,(r=this.getRootNode())==null?void 0:r.getElementById(n)),(l=(s=o(this,ae))==null?void 0:s.associateElement)==null||l.call(s,this)),m.customElements.whenDefined("media-tooltip").then(()=>E(this,lr,$a).call(this))}disconnectedCallback(){var e,n;this.disable(),(n=(e=o(this,ae))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,ae,null),this.removeEventListener("mouseenter",o(this,Re)),this.removeEventListener("focus",o(this,Re)),this.removeEventListener("click",o(this,lt))}get keysUsed(){return["Enter"," "]}get tooltipPlacement(){return _(this,ar.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){M(this,ar.TOOLTIP_PLACEMENT,e)}handleClick(e){}};ae=new WeakMap,lt=new WeakMap,Re=new WeakMap,dt=new WeakMap,_i=new WeakMap,lr=new WeakSet,$a=function(){this.addEventListener("mouseenter",o(this,Re)),this.addEventListener("focus",o(this,Re)),this.addEventListener("click",o(this,lt));let e=this.tooltipPlacement;e&&this.tooltipEl&&(this.tooltipEl.placement=e)};m.customElements.get("media-chrome-button")||m.customElements.define("media-chrome-button",O);var Ka=O;var Va=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`,Wa=b.createElement("template");Wa.innerHTML=`
  <style>
    :host([${a.MEDIA_IS_AIRPLAYING}]) slot[name=icon] slot:not([name=exit]) {
      display: none !important;
    }

    
    :host(:not([${a.MEDIA_IS_AIRPLAYING}])) slot[name=icon] slot:not([name=enter]) {
      display: none !important;
    }

    :host([${a.MEDIA_IS_AIRPLAYING}]) slot[name=tooltip-enter],
    :host(:not([${a.MEDIA_IS_AIRPLAYING}])) slot[name=tooltip-exit] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="enter">${Va}</slot>
    <slot name="exit">${Va}</slot>
  </slot>
`;var Ym=`
  <slot name="tooltip-enter">${y.ENTER_AIRPLAY}</slot>
  <slot name="tooltip-exit">${y.EXIT_AIRPLAY}</slot>
`,Ga=i=>{let t=i.mediaIsAirplaying?F.EXIT_AIRPLAY():F.ENTER_AIRPLAY();i.setAttribute("aria-label",t)},dr=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_IS_AIRPLAYING,a.MEDIA_AIRPLAY_UNAVAILABLE]}constructor(t={}){super({slotTemplate:Wa,tooltipContent:Ym,...t})}connectedCallback(){super.connectedCallback(),Ga(this)}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n),t===a.MEDIA_IS_AIRPLAYING&&Ga(this)}get mediaIsAirplaying(){return U(this,a.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(t){P(this,a.MEDIA_IS_AIRPLAYING,t)}get mediaAirplayUnavailable(){return _(this,a.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(t){M(this,a.MEDIA_AIRPLAY_UNAVAILABLE,t)}handleClick(){let t=new m.CustomEvent(g.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(t)}};m.customElements.get("media-airplay-button")||m.customElements.define("media-airplay-button",dr);var qa=dr;var Qm=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,jm=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,za=b.createElement("template");za.innerHTML=`
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
    <slot name="on">${Qm}</slot>
    <slot name="off">${jm}</slot>
  </slot>
`;var zm=`
  <slot name="tooltip-enable">${y.ENABLE_CAPTIONS}</slot>
  <slot name="tooltip-disable">${y.DISABLE_CAPTIONS}</slot>
`,Ya=i=>{i.setAttribute("aria-checked",tr(i).toString())},mr=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_SUBTITLES_LIST,a.MEDIA_SUBTITLES_SHOWING]}constructor(t={}){super({slotTemplate:za,tooltipContent:zm,...t}),this._captionsReady=!1}connectedCallback(){super.connectedCallback(),this.setAttribute("role","switch"),this.setAttribute("aria-label",B.CLOSED_CAPTIONS()),Ya(this)}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n),t===a.MEDIA_SUBTITLES_SHOWING&&Ya(this)}get mediaSubtitlesList(){return Qa(this,a.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(t){ja(this,a.MEDIA_SUBTITLES_LIST,t)}get mediaSubtitlesShowing(){return Qa(this,a.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(t){ja(this,a.MEDIA_SUBTITLES_SHOWING,t)}handleClick(){this.dispatchEvent(new m.CustomEvent(g.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}},Qa=(i,t)=>{let e=i.getAttribute(t);return e?nt(e):[]},ja=(i,t,e)=>{if(!(e!=null&&e.length)){i.removeAttribute(t);return}let n=_e(e);i.getAttribute(t)!==n&&i.setAttribute(t,n)};m.customElements.get("media-captions-button")||m.customElements.define("media-captions-button",mr);var Za=mr;var Zm='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg>',Xm='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg>',Ja=b.createElement("template");Ja.innerHTML=`
  <style>
  :host([${a.MEDIA_IS_CASTING}]) slot[name=icon] slot:not([name=exit]) {
    display: none !important;
  }

  
  :host(:not([${a.MEDIA_IS_CASTING}])) slot[name=icon] slot:not([name=enter]) {
    display: none !important;
  }

  :host([${a.MEDIA_IS_CASTING}]) slot[name=tooltip-enter],
    :host(:not([${a.MEDIA_IS_CASTING}])) slot[name=tooltip-exit] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="enter">${Zm}</slot>
    <slot name="exit">${Xm}</slot>
  </slot>
`;var Jm=`
  <slot name="tooltip-enter">${y.START_CAST}</slot>
  <slot name="tooltip-exit">${y.STOP_CAST}</slot>
`,Xa=i=>{let t=i.mediaIsCasting?F.EXIT_CAST():F.ENTER_CAST();i.setAttribute("aria-label",t)},ur=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_IS_CASTING,a.MEDIA_CAST_UNAVAILABLE]}constructor(t={}){super({slotTemplate:Ja,tooltipContent:Jm,...t})}connectedCallback(){super.connectedCallback(),Xa(this)}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n),t===a.MEDIA_IS_CASTING&&Xa(this)}get mediaIsCasting(){return U(this,a.MEDIA_IS_CASTING)}set mediaIsCasting(t){P(this,a.MEDIA_IS_CASTING,t)}get mediaCastUnavailable(){return _(this,a.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(t){M(this,a.MEDIA_CAST_UNAVAILABLE,t)}handleClick(){let t=this.mediaIsCasting?g.MEDIA_EXIT_CAST_REQUEST:g.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new m.CustomEvent(t,{composed:!0,bubbles:!0}))}};m.customElements.get("media-cast-button")||m.customElements.define("media-cast-button",ur);var el=ur;var tl=b.createElement("template");tl.innerHTML=`
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
`;var Ws={HIDDEN:"hidden",ANCHOR:"anchor"},Ft,Fe,cr,il,hr,nl,pr,rl,Er,sl,br,ol,xi=class extends m.HTMLElement{constructor(){super();u(this,cr);u(this,hr);u(this,pr);u(this,Er);u(this,br);u(this,Ft,null);u(this,Fe,null);this.shadowRoot||(this.attachShadow({mode:"open"}),this.nativeEl=this.constructor.template.content.cloneNode(!0),this.shadowRoot.append(this.nativeEl)),this.addEventListener("invoke",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this)}static get observedAttributes(){return[Ws.HIDDEN,Ws.ANCHOR]}handleEvent(e){switch(e.type){case"invoke":E(this,pr,rl).call(this,e);break;case"focusout":E(this,Er,sl).call(this,e);break;case"keydown":E(this,br,ol).call(this,e);break}}connectedCallback(){this.role||(this.role="dialog")}attributeChangedCallback(e,n,r){e===Ws.HIDDEN&&r!==n&&(this.hidden?E(this,hr,nl).call(this):E(this,cr,il).call(this))}focus(){h(this,Ft,bi());let e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');e==null||e.focus()}get keysUsed(){return["Escape","Tab"]}};Ft=new WeakMap,Fe=new WeakMap,cr=new WeakSet,il=function(){var e;(e=o(this,Fe))==null||e.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0})},hr=new WeakSet,nl=function(){var e;(e=o(this,Fe))==null||e.setAttribute("aria-expanded","false")},pr=new WeakSet,rl=function(e){h(this,Fe,e.relatedTarget),Q(this,e.relatedTarget)||(this.hidden=!this.hidden)},Er=new WeakSet,sl=function(e){var n;Q(this,e.relatedTarget)||((n=o(this,Ft))==null||n.focus(),o(this,Fe)&&o(this,Fe)!==e.relatedTarget&&!this.hidden&&(this.hidden=!0))},br=new WeakSet,ol=function(e){var d,c,p,f,A;let{key:n,ctrlKey:r,altKey:s,metaKey:l}=e;r||s||l||this.keysUsed.includes(n)&&(e.preventDefault(),e.stopPropagation(),n==="Tab"?(e.shiftKey?(c=(d=this.previousElementSibling)==null?void 0:d.focus)==null||c.call(d):(f=(p=this.nextElementSibling)==null?void 0:p.focus)==null||f.call(p),this.blur()):n==="Escape"&&((A=o(this,Ft))==null||A.focus(),this.hidden=!0))},xi.template=tl;m.customElements.get("media-chrome-dialog")||m.customElements.define("media-chrome-dialog",xi);var al=xi;var ll=b.createElement("template");ll.innerHTML=`
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
`;var le,Ri,Ci,Di,te,wi,Pi,Ui,Ni,gr,dl,Oi,qs,Hi,Ys,Bi,Qs,fr,ml,vr,ul,Tr,cl,Ar,hl,$e=class extends m.HTMLElement{constructor(){super();u(this,gr);u(this,Oi);u(this,Hi);u(this,Bi);u(this,fr);u(this,vr);u(this,Tr);u(this,Ar);u(this,le,void 0);u(this,Ri,void 0);u(this,Ci,void 0);u(this,Di,void 0);u(this,te,{});u(this,wi,[]);u(this,Pi,()=>{if(this.range.matches(":focus-visible")){let{style:e}=N(this.shadowRoot,":host");e.setProperty("--_focus-visible-box-shadow","var(--_focus-box-shadow)")}});u(this,Ui,()=>{let{style:e}=N(this.shadowRoot,":host");e.removeProperty("--_focus-visible-box-shadow")});u(this,Ni,()=>{let e=this.shadowRoot.querySelector("#segments-clipping");e&&e.parentNode.append(e)});this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(ll.content.cloneNode(!0))),this.container=this.shadowRoot.querySelector("#container"),h(this,Ci,this.shadowRoot.querySelector("#startpoint")),h(this,Di,this.shadowRoot.querySelector("#endpoint")),this.range=this.shadowRoot.querySelector("#range"),this.appearance=this.shadowRoot.querySelector("#appearance")}static get observedAttributes(){return["disabled","aria-disabled",I.MEDIA_CONTROLLER]}attributeChangedCallback(e,n,r){var s,l,d,c,p;e===I.MEDIA_CONTROLLER?(n&&((l=(s=o(this,le))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,le,null)),r&&this.isConnected&&(h(this,le,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,le))==null?void 0:c.associateElement)==null||p.call(c,this))):(e==="disabled"||e==="aria-disabled"&&n!==r)&&(r==null?(this.range.removeAttribute(e),E(this,Oi,qs).call(this)):(this.range.setAttribute(e,r),E(this,Hi,Ys).call(this)))}connectedCallback(){var r,s,l;let{style:e}=N(this.shadowRoot,":host");e.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),o(this,te).pointer=N(this.shadowRoot,"#pointer"),o(this,te).progress=N(this.shadowRoot,"#progress"),o(this,te).thumb=N(this.shadowRoot,"#thumb"),o(this,te).activeSegment=N(this.shadowRoot,"#segments-clipping rect:nth-child(0)");let n=this.getAttribute(I.MEDIA_CONTROLLER);n&&(h(this,le,(r=this.getRootNode())==null?void 0:r.getElementById(n)),(l=(s=o(this,le))==null?void 0:s.associateElement)==null||l.call(s,this)),this.updateBar(),this.shadowRoot.addEventListener("focusin",o(this,Pi)),this.shadowRoot.addEventListener("focusout",o(this,Ui)),E(this,Oi,qs).call(this),ke(this.container,o(this,Ni))}disconnectedCallback(){var e,n;E(this,Hi,Ys).call(this),(n=(e=o(this,le))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,le,null),this.shadowRoot.removeEventListener("focusin",o(this,Pi)),this.shadowRoot.removeEventListener("focusout",o(this,Ui)),ze(this.container,o(this,Ni))}updatePointerBar(e){var n;(n=o(this,te).pointer)==null||n.style.setProperty("width",`${this.getPointerRatio(e)*100}%`)}updateBar(){var n,r;let e=this.range.valueAsNumber*100;(n=o(this,te).progress)==null||n.style.setProperty("width",`${e}%`),(r=o(this,te).thumb)==null||r.style.setProperty("left",`${e}%`)}updateSegments(e){let n=this.shadowRoot.querySelector("#segments-clipping");if(n.textContent="",this.container.classList.toggle("segments",!!(e!=null&&e.length)),!(e!=null&&e.length))return;let r=[...new Set([+this.range.min,...e.flatMap(l=>[l.start,l.end]),+this.range.max])];h(this,wi,[...r]);let s=r.pop();for(let[l,d]of r.entries()){let[c,p]=[l===0,l===r.length-1],f=c?"calc(var(--segments-gap) / -1)":`${d*100}%`,T=`calc(${((p?s:r[l+1])-d)*100}%${c||p?"":" - var(--segments-gap)"})`,v=b.createElementNS("http://www.w3.org/2000/svg","rect"),x=N(this.shadowRoot,`#segments-clipping rect:nth-child(${l+1})`);x.style.setProperty("x",f),x.style.setProperty("width",T),n.append(v)}}getPointerRatio(e){let n=ha(e.clientX,e.clientY,o(this,Ci).getBoundingClientRect(),o(this,Di).getBoundingClientRect());return Math.max(0,Math.min(1,n))}get dragging(){return this.hasAttribute("dragging")}handleEvent(e){switch(e.type){case"pointermove":E(this,Ar,hl).call(this,e);break;case"input":this.updateBar();break;case"pointerenter":E(this,fr,ml).call(this,e);break;case"pointerdown":E(this,Bi,Qs).call(this,e);break;case"pointerup":E(this,vr,ul).call(this);break;case"pointerleave":E(this,Tr,cl).call(this);break}}get keysUsed(){return["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"]}};le=new WeakMap,Ri=new WeakMap,Ci=new WeakMap,Di=new WeakMap,te=new WeakMap,wi=new WeakMap,Pi=new WeakMap,Ui=new WeakMap,Ni=new WeakMap,gr=new WeakSet,dl=function(e){let n=o(this,te).activeSegment;if(!n)return;let r=this.getPointerRatio(e),l=`#segments-clipping rect:nth-child(${o(this,wi).findIndex((d,c,p)=>{let f=p[c+1];return f!=null&&r>=d&&r<=f})+1})`;(n.selectorText!=l||!n.style.transform)&&(n.selectorText=l,n.style.setProperty("transform","var(--media-range-segment-hover-transform, scaleY(2))"))},Oi=new WeakSet,qs=function(){this.hasAttribute("disabled")||(this.addEventListener("input",this),this.addEventListener("pointerdown",this),this.addEventListener("pointerenter",this))},Hi=new WeakSet,Ys=function(){var e,n;this.removeEventListener("input",this),this.removeEventListener("pointerdown",this),this.removeEventListener("pointerenter",this),(e=m.window)==null||e.removeEventListener("pointerup",this),(n=m.window)==null||n.removeEventListener("pointermove",this)},Bi=new WeakSet,Qs=function(e){var n;h(this,Ri,e.composedPath().includes(this.range)),(n=m.window)==null||n.addEventListener("pointerup",this)},fr=new WeakSet,ml=function(e){var n;e.pointerType!=="mouse"&&E(this,Bi,Qs).call(this,e),this.addEventListener("pointerleave",this),(n=m.window)==null||n.addEventListener("pointermove",this)},vr=new WeakSet,ul=function(){var e;(e=m.window)==null||e.removeEventListener("pointerup",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled")},Tr=new WeakSet,cl=function(){var e,n;this.removeEventListener("pointerleave",this),(e=m.window)==null||e.removeEventListener("pointermove",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled"),(n=o(this,te).activeSegment)==null||n.style.removeProperty("transform")},Ar=new WeakSet,hl=function(e){this.toggleAttribute("dragging",e.buttons===1||e.pointerType!=="mouse"),this.updatePointerBar(e),E(this,gr,dl).call(this,e),this.dragging&&(e.pointerType!=="mouse"||!o(this,Ri))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(e),this.range.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})))};m.customElements.get("media-chrome-range")||m.customElements.define("media-chrome-range",$e);var pl=$e;var El=b.createElement("template");El.innerHTML=`
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
`;var de,Ir=class extends m.HTMLElement{constructor(){super();u(this,de,void 0);this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(El.content.cloneNode(!0)))}static get observedAttributes(){return[I.MEDIA_CONTROLLER]}attributeChangedCallback(e,n,r){var s,l,d,c,p;e===I.MEDIA_CONTROLLER&&(n&&((l=(s=o(this,de))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,de,null)),r&&this.isConnected&&(h(this,de,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,de))==null?void 0:c.associateElement)==null||p.call(c,this)))}connectedCallback(){var n,r,s;let e=this.getAttribute(I.MEDIA_CONTROLLER);e&&(h(this,de,(n=this.getRootNode())==null?void 0:n.getElementById(e)),(s=(r=o(this,de))==null?void 0:r.associateElement)==null||s.call(r,this))}disconnectedCallback(){var e,n;(n=(e=o(this,de))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,de,null)}};de=new WeakMap;m.customElements.get("media-control-bar")||m.customElements.define("media-control-bar",Ir);var bl=Ir;var gl=b.createElement("template");gl.innerHTML=`
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
`;var me,ue=class extends m.HTMLElement{constructor(){super();u(this,me,void 0);this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(gl.content.cloneNode(!0)))}static get observedAttributes(){return[I.MEDIA_CONTROLLER]}attributeChangedCallback(e,n,r){var s,l,d,c,p;e===I.MEDIA_CONTROLLER&&(n&&((l=(s=o(this,me))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,me,null)),r&&this.isConnected&&(h(this,me,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,me))==null?void 0:c.associateElement)==null||p.call(c,this)))}connectedCallback(){var r,s,l;let{style:e}=N(this.shadowRoot,":host");e.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);let n=this.getAttribute(I.MEDIA_CONTROLLER);n&&(h(this,me,(r=this.getRootNode())==null?void 0:r.getElementById(n)),(l=(s=o(this,me))==null?void 0:s.associateElement)==null||l.call(s,this))}disconnectedCallback(){var e,n;(n=(e=o(this,me))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,me,null)}};me=new WeakMap;m.customElements.get("media-text-display")||m.customElements.define("media-text-display",ue);var $t,Sr=class extends ue{constructor(){super();u(this,$t,void 0);h(this,$t,this.shadowRoot.querySelector("slot")),o(this,$t).textContent=se(0)}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_DURATION]}attributeChangedCallback(e,n,r){e===a.MEDIA_DURATION&&(o(this,$t).textContent=se(+r)),super.attributeChangedCallback(e,n,r)}get mediaDuration(){return k(this,a.MEDIA_DURATION)}set mediaDuration(e){C(this,a.MEDIA_DURATION,e)}};$t=new WeakMap;m.customElements.get("media-duration-display")||m.customElements.define("media-duration-display",Sr);var fl=Sr;var eu=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,tu=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`,Tl=b.createElement("template");Tl.innerHTML=`
  <style>
    :host([${a.MEDIA_IS_FULLSCREEN}]) slot[name=icon] slot:not([name=exit]) {
      display: none !important;
    }

    
    :host(:not([${a.MEDIA_IS_FULLSCREEN}])) slot[name=icon] slot:not([name=enter]) {
      display: none !important;
    }

    :host([${a.MEDIA_IS_FULLSCREEN}]) slot[name=tooltip-enter],
    :host(:not([${a.MEDIA_IS_FULLSCREEN}])) slot[name=tooltip-exit] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="enter">${eu}</slot>
    <slot name="exit">${tu}</slot>
  </slot>
`;var iu=`
  <slot name="tooltip-enter">${y.ENTER_FULLSCREEN}</slot>
  <slot name="tooltip-exit">${y.EXIT_FULLSCREEN}</slot>
`,vl=i=>{let t=i.mediaIsFullscreen?F.EXIT_FULLSCREEN():F.ENTER_FULLSCREEN();i.setAttribute("aria-label",t)},yr=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_IS_FULLSCREEN,a.MEDIA_FULLSCREEN_UNAVAILABLE]}constructor(t={}){super({slotTemplate:Tl,tooltipContent:iu,...t})}connectedCallback(){super.connectedCallback(),vl(this)}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n),t===a.MEDIA_IS_FULLSCREEN&&vl(this)}get mediaFullscreenUnavailable(){return _(this,a.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(t){M(this,a.MEDIA_FULLSCREEN_UNAVAILABLE,t)}get mediaIsFullscreen(){return U(this,a.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(t){P(this,a.MEDIA_IS_FULLSCREEN,t)}handleClick(){let t=this.mediaIsFullscreen?g.MEDIA_EXIT_FULLSCREEN_REQUEST:g.MEDIA_ENTER_FULLSCREEN_REQUEST;this.dispatchEvent(new m.CustomEvent(t,{composed:!0,bubbles:!0}))}};m.customElements.get("media-fullscreen-button")||m.customElements.define("media-fullscreen-button",yr);var Al=yr;var{MEDIA_TIME_IS_LIVE:Mr,MEDIA_PAUSED:Fi}=a,{MEDIA_SEEK_TO_LIVE_REQUEST:nu,MEDIA_PLAY_REQUEST:ru}=g,su='<svg viewBox="0 0 6 12"><circle cx="3" cy="6" r="2"></circle></svg>',Sl=b.createElement("template");Sl.innerHTML=`
  <style>
  :host { --media-tooltip-display: none; }
  
  slot[name=indicator] > *,
  :host ::slotted([slot=indicator]) {
    
    min-width: auto;
    fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
    color: var(--media-live-button-icon-color, rgb(140, 140, 140));
  }

  :host([${Mr}]:not([${Fi}])) slot[name=indicator] > *,
  :host([${Mr}]:not([${Fi}])) ::slotted([slot=indicator]) {
    fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
    color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
  }

  :host([${Mr}]:not([${Fi}])) {
    cursor: not-allowed;
  }

  </style>

  <slot name="indicator">${su}</slot>
  
  <slot name="spacer">&nbsp;</slot><slot name="text">LIVE</slot>
`;var Il=i=>{let t=i.mediaPaused||!i.mediaTimeIsLive,e=t?F.SEEK_LIVE():F.PLAYING_LIVE();i.setAttribute("aria-label",e),t?i.removeAttribute("aria-disabled"):i.setAttribute("aria-disabled","true")},Lr=class extends O{static get observedAttributes(){return[...super.observedAttributes,Fi,Mr]}constructor(t={}){super({slotTemplate:Sl,...t})}connectedCallback(){Il(this),super.connectedCallback()}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n),Il(this)}get mediaPaused(){return U(this,a.MEDIA_PAUSED)}set mediaPaused(t){P(this,a.MEDIA_PAUSED,t)}get mediaTimeIsLive(){return U(this,a.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(t){P(this,a.MEDIA_TIME_IS_LIVE,t)}handleClick(){!this.mediaPaused&&this.mediaTimeIsLive||(this.dispatchEvent(new m.CustomEvent(nu,{composed:!0,bubbles:!0})),this.hasAttribute(Fi)&&this.dispatchEvent(new m.CustomEvent(ru,{composed:!0,bubbles:!0})))}};m.customElements.get("media-live-button")||m.customElements.define("media-live-button",Lr);var yl=Lr;var Ml={LOADING_DELAY:"loadingdelay"},Ll=500,kl=b.createElement("template"),ou=`
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
`;kl.innerHTML=`
<style>
:host {
  display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
  vertical-align: middle;
  box-sizing: border-box;
  --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, ${Ll}ms);
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

:host([${a.MEDIA_LOADING}]:not([${a.MEDIA_PAUSED}])) slot[name=icon] > *,
:host([${a.MEDIA_LOADING}]:not([${a.MEDIA_PAUSED}])) ::slotted([slot=icon]) {
  opacity: var(--media-loading-indicator-opacity, 1);
  transition: opacity 0.15s var(--_loading-indicator-delay);
}

:host #status {
  visibility: var(--media-loading-indicator-opacity, hidden);
  transition: visibility 0.15s;
}

:host([${a.MEDIA_LOADING}]:not([${a.MEDIA_PAUSED}])) #status {
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

<slot name="icon">${ou}</slot>
<div id="status" role="status" aria-live="polite">${B.MEDIA_LOADING()}</div>
`;var ce,$i,kr=class extends m.HTMLElement{constructor(){super();u(this,ce,void 0);u(this,$i,Ll);if(!this.shadowRoot){let e=this.attachShadow({mode:"open"}),n=kl.content.cloneNode(!0);e.appendChild(n)}}static get observedAttributes(){return[I.MEDIA_CONTROLLER,a.MEDIA_PAUSED,a.MEDIA_LOADING,Ml.LOADING_DELAY]}attributeChangedCallback(e,n,r){var s,l,d,c,p;e===Ml.LOADING_DELAY&&n!==r?this.loadingDelay=Number(r):e===I.MEDIA_CONTROLLER&&(n&&((l=(s=o(this,ce))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,ce,null)),r&&this.isConnected&&(h(this,ce,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,ce))==null?void 0:c.associateElement)==null||p.call(c,this)))}connectedCallback(){var n,r,s;let e=this.getAttribute(I.MEDIA_CONTROLLER);e&&(h(this,ce,(n=this.getRootNode())==null?void 0:n.getElementById(e)),(s=(r=o(this,ce))==null?void 0:r.associateElement)==null||s.call(r,this))}disconnectedCallback(){var e,n;(n=(e=o(this,ce))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,ce,null)}get loadingDelay(){return o(this,$i)}set loadingDelay(e){h(this,$i,e);let{style:n}=N(this.shadowRoot,":host");n.setProperty("--_loading-indicator-delay",`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return U(this,a.MEDIA_PAUSED)}set mediaPaused(e){P(this,a.MEDIA_PAUSED,e)}get mediaLoading(){return U(this,a.MEDIA_LOADING)}set mediaLoading(e){P(this,a.MEDIA_LOADING,e)}};ce=new WeakMap,$i=new WeakMap;m.customElements.get("media-loading-indicator")||m.customElements.define("media-loading-indicator",kr);var _l=kr;var{MEDIA_VOLUME_LEVEL:mt}=a,au=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,xl=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,lu=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`,Cl=b.createElement("template");Cl.innerHTML=`
  <style>
  
  :host(:not([${mt}])) slot[name=icon] slot:not([name=high]), 
  :host([${mt}=high]) slot[name=icon] slot:not([name=high]) {
    display: none !important;
  }

  :host([${mt}=off]) slot[name=icon] slot:not([name=off]) {
    display: none !important;
  }

  :host([${mt}=low]) slot[name=icon] slot:not([name=low]) {
    display: none !important;
  }

  :host([${mt}=medium]) slot[name=icon] slot:not([name=medium]) {
    display: none !important;
  }

  :host(:not([${mt}=off])) slot[name=tooltip-unmute],
  :host([${mt}=off]) slot[name=tooltip-mute] {
    display: none;
  }
  </style>

  <slot name="icon">
    <slot name="off">${au}</slot>
    <slot name="low">${xl}</slot>
    <slot name="medium">${xl}</slot>
    <slot name="high">${lu}</slot>
  </slot>
`;var du=`
  <slot name="tooltip-mute">${y.MUTE}</slot>
  <slot name="tooltip-unmute">${y.UNMUTE}</slot>
`,Rl=i=>{let e=i.mediaVolumeLevel==="off"?F.UNMUTE():F.MUTE();i.setAttribute("aria-label",e)},_r=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_VOLUME_LEVEL]}constructor(t={}){super({slotTemplate:Cl,tooltipContent:du,...t})}connectedCallback(){Rl(this),super.connectedCallback()}attributeChangedCallback(t,e,n){t===a.MEDIA_VOLUME_LEVEL&&Rl(this),super.attributeChangedCallback(t,e,n)}get mediaVolumeLevel(){return _(this,a.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(t){M(this,a.MEDIA_VOLUME_LEVEL,t)}handleClick(){let t=this.mediaVolumeLevel==="off"?g.MEDIA_UNMUTE_REQUEST:g.MEDIA_MUTE_REQUEST;this.dispatchEvent(new m.CustomEvent(t,{composed:!0,bubbles:!0}))}};m.customElements.get("media-mute-button")||m.customElements.define("media-mute-button",_r);var Dl=_r;var wl=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`,Ul=b.createElement("template");Ul.innerHTML=`
  <style>
  :host([${a.MEDIA_IS_PIP}]) slot[name=icon] slot:not([name=exit]) {
    display: none !important;
  }

  
  :host(:not([${a.MEDIA_IS_PIP}])) slot[name=icon] slot:not([name=enter]) {
    display: none !important;
  }

  :host([${a.MEDIA_IS_PIP}]) slot[name=tooltip-enter],
  :host(:not([${a.MEDIA_IS_PIP}])) slot[name=tooltip-exit] {
    display: none;
  }
  </style>

  <slot name="icon">
    <slot name="enter">${wl}</slot>
    <slot name="exit">${wl}</slot>
  </slot>
`;var mu=`
  <slot name="tooltip-enter">${y.ENTER_PIP}</slot>
  <slot name="tooltip-exit">${y.EXIT_PIP}</slot>
`,Pl=i=>{let t=i.mediaIsPip?F.EXIT_PIP():F.ENTER_PIP();i.setAttribute("aria-label",t)},xr=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_IS_PIP,a.MEDIA_PIP_UNAVAILABLE]}constructor(t={}){super({slotTemplate:Ul,tooltipContent:mu,...t})}connectedCallback(){Pl(this),super.connectedCallback()}attributeChangedCallback(t,e,n){t===a.MEDIA_IS_PIP&&Pl(this),super.attributeChangedCallback(t,e,n)}get mediaPipUnavailable(){return _(this,a.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(t){M(this,a.MEDIA_PIP_UNAVAILABLE,t)}get mediaIsPip(){return U(this,a.MEDIA_IS_PIP)}set mediaIsPip(t){P(this,a.MEDIA_IS_PIP,t)}handleClick(){let t=this.mediaIsPip?g.MEDIA_EXIT_PIP_REQUEST:g.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new m.CustomEvent(t,{composed:!0,bubbles:!0}))}};m.customElements.get("media-pip-button")||m.customElements.define("media-pip-button",xr);var Nl=xr;var js={RATES:"rates"},zs=[1,1.2,1.5,1.7,2],Kt=1,Ol=b.createElement("template");Ol.innerHTML=`
  <style>
    :host {
      min-width: 5ch;
      padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
    }
  </style>
  <slot name="icon"></slot>
`;var ut,Rr=class extends O{constructor(e={}){super({slotTemplate:Ol,tooltipContent:y.PLAYBACK_RATE,...e});u(this,ut,new Ie(this,js.RATES,{defaultValue:zs}));this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${Kt}x`}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PLAYBACK_RATE,js.RATES]}attributeChangedCallback(e,n,r){if(super.attributeChangedCallback(e,n,r),e===js.RATES&&(o(this,ut).value=r),e===a.MEDIA_PLAYBACK_RATE){let s=r?+r:Number.NaN,l=Number.isNaN(s)?Kt:s;this.container.innerHTML=`${l}x`,this.setAttribute("aria-label",B.PLAYBACK_RATE({playbackRate:l}))}}get rates(){return o(this,ut)}set rates(e){e?Array.isArray(e)&&(o(this,ut).value=e.join(" ")):o(this,ut).value=""}get mediaPlaybackRate(){return k(this,a.MEDIA_PLAYBACK_RATE,Kt)}set mediaPlaybackRate(e){C(this,a.MEDIA_PLAYBACK_RATE,e)}handleClick(){var s,l;let e=Array.from(this.rates.values(),d=>+d).sort((d,c)=>d-c),n=(l=(s=e.find(d=>d>this.mediaPlaybackRate))!=null?s:e[0])!=null?l:Kt,r=new m.CustomEvent(g.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:n});this.dispatchEvent(r)}};ut=new WeakMap;m.customElements.get("media-playback-rate-button")||m.customElements.define("media-playback-rate-button",Rr);var Hl=Rr;var uu=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,cu=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`,Fl=b.createElement("template");Fl.innerHTML=`
  <style>
    :host([${a.MEDIA_PAUSED}]) slot[name=pause],
    :host(:not([${a.MEDIA_PAUSED}])) slot[name=play] {
      display: none !important;
    }

    :host([${a.MEDIA_PAUSED}]) slot[name=tooltip-pause],
    :host(:not([${a.MEDIA_PAUSED}])) slot[name=tooltip-play] {
      display: none;
    }
  </style>

  <slot name="icon">
    <slot name="play">${uu}</slot>
    <slot name="pause">${cu}</slot>
  </slot>
`;var hu=`
  <slot name="tooltip-play">${y.PLAY}</slot>
  <slot name="tooltip-pause">${y.PAUSE}</slot>
`,Bl=i=>{let t=i.mediaPaused?F.PLAY():F.PAUSE();i.setAttribute("aria-label",t)},Cr=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PAUSED,a.MEDIA_ENDED]}constructor(t={}){super({slotTemplate:Fl,tooltipContent:hu,...t})}connectedCallback(){Bl(this),super.connectedCallback()}attributeChangedCallback(t,e,n){t===a.MEDIA_PAUSED&&Bl(this),super.attributeChangedCallback(t,e,n)}get mediaPaused(){return U(this,a.MEDIA_PAUSED)}set mediaPaused(t){P(this,a.MEDIA_PAUSED,t)}handleClick(){let t=this.mediaPaused?g.MEDIA_PLAY_REQUEST:g.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new m.CustomEvent(t,{composed:!0,bubbles:!0}))}};m.customElements.get("media-play-button")||m.customElements.define("media-play-button",Cr);var $l=Cr;var Se={PLACEHOLDER_SRC:"placeholdersrc",SRC:"src"},Kl=b.createElement("template");Kl.innerHTML=`
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
`;var pu=i=>{i.style.removeProperty("background-image")},Eu=(i,t)=>{i.style["background-image"]=`url('${t}')`},Dr=class extends m.HTMLElement{static get observedAttributes(){return[Se.PLACEHOLDER_SRC,Se.SRC]}constructor(){super(),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Kl.content.cloneNode(!0))),this.image=this.shadowRoot.querySelector("#image")}attributeChangedCallback(t,e,n){t===Se.SRC&&(n==null?this.image.removeAttribute(Se.SRC):this.image.setAttribute(Se.SRC,n)),t===Se.PLACEHOLDER_SRC&&(n==null?pu(this.image):Eu(this.image,n))}get placeholderSrc(){return _(this,Se.PLACEHOLDER_SRC)}set placeholderSrc(t){M(this,Se.SRC,t)}get src(){return _(this,Se.SRC)}set src(t){M(this,Se.SRC,t)}};m.customElements.get("media-poster-image")||m.customElements.define("media-poster-image",Dr);var Vl=Dr;var Ki,wr=class extends ue{constructor(){super();u(this,Ki,void 0);h(this,Ki,this.shadowRoot.querySelector("slot"))}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PREVIEW_CHAPTER]}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_PREVIEW_CHAPTER&&r!==n&&r!=null&&(o(this,Ki).textContent=r,r!==""?this.setAttribute("aria-valuetext",`chapter: ${r}`):this.removeAttribute("aria-valuetext"))}get mediaPreviewChapter(){return _(this,a.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){M(this,a.MEDIA_PREVIEW_CHAPTER,e)}};Ki=new WeakMap;m.customElements.get("media-preview-chapter-display")||m.customElements.define("media-preview-chapter-display",wr);var Gl=wr;var Wl=b.createElement("template");Wl.innerHTML=`
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
`;var he,Pr=class extends m.HTMLElement{constructor(){super();u(this,he,void 0);this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Wl.content.cloneNode(!0)))}static get observedAttributes(){return[I.MEDIA_CONTROLLER,a.MEDIA_PREVIEW_IMAGE,a.MEDIA_PREVIEW_COORDS]}connectedCallback(){var n,r,s;let e=this.getAttribute(I.MEDIA_CONTROLLER);e&&(h(this,he,(n=this.getRootNode())==null?void 0:n.getElementById(e)),(s=(r=o(this,he))==null?void 0:r.associateElement)==null||s.call(r,this))}disconnectedCallback(){var e,n;(n=(e=o(this,he))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,he,null)}attributeChangedCallback(e,n,r){var s,l,d,c,p;[a.MEDIA_PREVIEW_IMAGE,a.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===I.MEDIA_CONTROLLER&&(n&&((l=(s=o(this,he))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,he,null)),r&&this.isConnected&&(h(this,he,(d=this.getRootNode())==null?void 0:d.getElementById(r)),(p=(c=o(this,he))==null?void 0:c.associateElement)==null||p.call(c,this)))}get mediaPreviewImage(){return _(this,a.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){M(this,a.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){let e=this.getAttribute(a.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(n=>+n)}set mediaPreviewCoords(e){if(!e){this.removeAttribute(a.MEDIA_PREVIEW_COORDS);return}this.setAttribute(a.MEDIA_PREVIEW_COORDS,e.join(" "))}update(){let e=this.mediaPreviewCoords,n=this.mediaPreviewImage;if(!(e&&n))return;let[r,s,l,d]=e,c=n.split("#")[0],p=getComputedStyle(this),{maxWidth:f,maxHeight:A,minWidth:T,minHeight:v}=p,x=Math.min(parseInt(f)/l,parseInt(A)/d),S=Math.max(parseInt(T)/l,parseInt(v)/d),L=x<1,D=L?x:S>1?S:1,{style:q}=N(this.shadowRoot,":host"),Me=N(this.shadowRoot,"img").style,Ne=this.shadowRoot.querySelector("img"),hi=L?"min":"max";q.setProperty(`${hi}-width`,"initial","important"),q.setProperty(`${hi}-height`,"initial","important"),q.width=`${l*D}px`,q.height=`${d*D}px`;let Dt=()=>{Me.width=`${this.imgWidth*D}px`,Me.height=`${this.imgHeight*D}px`,Me.display="block"};Ne.src!==c&&(Ne.onload=()=>{this.imgWidth=Ne.naturalWidth,this.imgHeight=Ne.naturalHeight,Dt()},Ne.src=c,Dt()),Dt(),Me.transform=`translate(-${r*D}px, -${s*D}px)`}};he=new WeakMap;m.customElements.get("media-preview-thumbnail")||m.customElements.define("media-preview-thumbnail",Pr);var ql=Pr;var Vt,Ur=class extends ue{constructor(){super();u(this,Vt,void 0);h(this,Vt,this.shadowRoot.querySelector("slot")),o(this,Vt).textContent=se(0)}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_PREVIEW_TIME&&r!=null&&(o(this,Vt).textContent=se(parseFloat(r)))}get mediaPreviewTime(){return k(this,a.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){C(this,a.MEDIA_PREVIEW_TIME,e)}};Vt=new WeakMap;m.customElements.get("media-preview-time-display")||m.customElements.define("media-preview-time-display",Ur);var Yl=Ur;var Gt={SEEK_OFFSET:"seekoffset"},Nr=30,bu=`<svg aria-hidden="true" viewBox="0 0 20 24"><defs><style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style></defs><text class="text value" transform="translate(2.18 19.87)">${Nr}</text><path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/></svg>`,Ql=b.createElement("template");Ql.innerHTML=`
  <slot name="icon">${bu}</slot>
`;var gu=0,Or=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_CURRENT_TIME,Gt.SEEK_OFFSET]}constructor(t={}){super({slotTemplate:Ql,tooltipContent:y.SEEK_BACKWARD,...t})}connectedCallback(){this.seekOffset=k(this,Gt.SEEK_OFFSET,Nr),super.connectedCallback()}attributeChangedCallback(t,e,n){t===Gt.SEEK_OFFSET&&(this.seekOffset=k(this,Gt.SEEK_OFFSET,Nr)),super.attributeChangedCallback(t,e,n)}get seekOffset(){return k(this,Gt.SEEK_OFFSET,Nr)}set seekOffset(t){C(this,Gt.SEEK_OFFSET,t),this.setAttribute("aria-label",F.SEEK_BACK_N_SECS({seekOffset:this.seekOffset})),Yn(Qn(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return k(this,a.MEDIA_CURRENT_TIME,gu)}set mediaCurrentTime(t){C(this,a.MEDIA_CURRENT_TIME,t)}handleClick(){let t=Math.max(this.mediaCurrentTime-this.seekOffset,0),e=new m.CustomEvent(g.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(e)}};m.customElements.get("media-seek-backward-button")||m.customElements.define("media-seek-backward-button",Or);var jl=Or;var Wt={SEEK_OFFSET:"seekoffset"},Hr=30,fu=`<svg aria-hidden="true" viewBox="0 0 20 24"><defs><style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style></defs><text class="text value" transform="translate(8.9 19.87)">${Hr}</text><path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/></svg>`,zl=b.createElement("template");zl.innerHTML=`
  <slot name="icon">${fu}</slot>
`;var vu=0,Br=class extends O{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_CURRENT_TIME,Wt.SEEK_OFFSET]}constructor(t={}){super({slotTemplate:zl,tooltipContent:y.SEEK_FORWARD,...t})}connectedCallback(){this.seekOffset=k(this,Wt.SEEK_OFFSET,Hr),super.connectedCallback()}attributeChangedCallback(t,e,n){t===Wt.SEEK_OFFSET&&(this.seekOffset=k(this,Wt.SEEK_OFFSET,Hr)),super.attributeChangedCallback(t,e,n)}get seekOffset(){return k(this,Wt.SEEK_OFFSET,Hr)}set seekOffset(t){C(this,Wt.SEEK_OFFSET,t),this.setAttribute("aria-label",F.SEEK_FORWARD_N_SECS({seekOffset:this.seekOffset})),Yn(Qn(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return k(this,a.MEDIA_CURRENT_TIME,vu)}set mediaCurrentTime(t){C(this,a.MEDIA_CURRENT_TIME,t)}handleClick(){let t=this.mediaCurrentTime+this.seekOffset,e=new m.CustomEvent(g.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(e)}};m.customElements.get("media-seek-forward-button")||m.customElements.define("media-seek-forward-button",Br);var Zl=Br;var pe={REMAINING:"remaining",SHOW_DURATION:"showduration",NO_TOGGLE:"notoggle"},Xl=[...Object.values(pe),a.MEDIA_CURRENT_TIME,a.MEDIA_DURATION,a.MEDIA_SEEKABLE],Jl=["Enter"," "],Tu="&nbsp;/&nbsp;",ed=(i,{timesSep:t=Tu}={})=>{var c,p;let e=i.hasAttribute(pe.REMAINING),n=i.hasAttribute(pe.SHOW_DURATION),r=(c=i.mediaCurrentTime)!=null?c:0,[,s]=(p=i.mediaSeekable)!=null?p:[],l=0;Number.isFinite(i.mediaDuration)?l=i.mediaDuration:Number.isFinite(s)&&(l=s);let d=e?se(0-(l-r)):se(r);return n?`${d}${t}${se(l)}`:d},Au="video not loaded, unknown time.",Iu=i=>{var p;let t=i.mediaCurrentTime,[,e]=(p=i.mediaSeekable)!=null?p:[],n=null;if(Number.isFinite(i.mediaDuration)?n=i.mediaDuration:Number.isFinite(e)&&(n=e),t==null||n===null){i.setAttribute("aria-valuetext",Au);return}let r=i.hasAttribute(pe.REMAINING),s=i.hasAttribute(pe.SHOW_DURATION),l=r?Oe(0-(n-t)):Oe(t);if(!s){i.setAttribute("aria-valuetext",l);return}let d=Oe(n),c=`${l} of ${d}`;i.setAttribute("aria-valuetext",c)},ct,Fr=class extends ue{constructor(){super();u(this,ct,void 0);h(this,ct,this.shadowRoot.querySelector("slot")),o(this,ct).innerHTML=`${ed(this)}`}static get observedAttributes(){return[...super.observedAttributes,...Xl,"disabled"]}connectedCallback(){let{style:e}=N(this.shadowRoot,":host(:hover:not([notoggle]))");e.setProperty("cursor","pointer"),e.setProperty("background","var(--media-control-hover-background, rgba(50 50 70 / .7))"),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","progressbar"),this.setAttribute("aria-label",B.PLAYBACK_TIME());let n=r=>{let{key:s}=r;if(!Jl.includes(s)){this.removeEventListener("keyup",n);return}this.toggleTimeDisplay()};this.addEventListener("keydown",r=>{let{metaKey:s,altKey:l,key:d}=r;if(s||l||!Jl.includes(d)){this.removeEventListener("keyup",n);return}this.addEventListener("keyup",n)}),this.addEventListener("click",this.toggleTimeDisplay),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute("remaining")?this.removeAttribute("remaining"):this.setAttribute("remaining",""))}disconnectedCallback(){this.disable(),super.disconnectedCallback()}attributeChangedCallback(e,n,r){Xl.includes(e)?this.update():e==="disabled"&&r!==n&&(r==null?this.enable():this.disable()),super.attributeChangedCallback(e,n,r)}enable(){this.tabIndex=0}disable(){this.tabIndex=-1}get remaining(){return U(this,pe.REMAINING)}set remaining(e){P(this,pe.REMAINING,e)}get showDuration(){return U(this,pe.SHOW_DURATION)}set showDuration(e){P(this,pe.SHOW_DURATION,e)}get noToggle(){return U(this,pe.NO_TOGGLE)}set noToggle(e){P(this,pe.NO_TOGGLE,e)}get mediaDuration(){return k(this,a.MEDIA_DURATION)}set mediaDuration(e){C(this,a.MEDIA_DURATION,e)}get mediaCurrentTime(){return k(this,a.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){C(this,a.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){let e=this.getAttribute(a.MEDIA_SEEKABLE);if(e)return e.split(":").map(n=>+n)}set mediaSeekable(e){if(e==null){this.removeAttribute(a.MEDIA_SEEKABLE);return}this.setAttribute(a.MEDIA_SEEKABLE,e.join(":"))}update(){let e=ed(this);Iu(this),e!==o(this,ct).innerHTML&&(o(this,ct).innerHTML=e)}};ct=new WeakMap;m.customElements.get("media-time-display")||m.customElements.define("media-time-display",Fr);var td=Fr;var ht,Vi,pt,qt,Gi,Wi,qi,Et,Ke,Yi,$r=class{constructor(t,e,n){u(this,ht,void 0);u(this,Vi,void 0);u(this,pt,void 0);u(this,qt,void 0);u(this,Gi,void 0);u(this,Wi,void 0);u(this,qi,void 0);u(this,Et,void 0);u(this,Ke,0);u(this,Yi,(t=performance.now())=>{h(this,Ke,requestAnimationFrame(o(this,Yi))),h(this,qt,performance.now()-o(this,pt));let e=1e3/this.fps;if(o(this,qt)>e){h(this,pt,t-o(this,qt)%e);let n=1e3/((t-o(this,Vi))/++Xo(this,Gi)._),r=(t-o(this,Wi))/1e3/this.duration,s=o(this,qi)+r*this.playbackRate;s-o(this,ht).valueAsNumber>0?h(this,Et,this.playbackRate/this.duration/n):(h(this,Et,.995*o(this,Et)),s=o(this,ht).valueAsNumber+o(this,Et)),this.callback(s)}});h(this,ht,t),this.callback=e,this.fps=n}start(){o(this,Ke)===0&&(h(this,pt,performance.now()),h(this,Vi,o(this,pt)),h(this,Gi,0),o(this,Yi).call(this))}stop(){o(this,Ke)!==0&&(cancelAnimationFrame(o(this,Ke)),h(this,Ke,0))}update({start:t,duration:e,playbackRate:n}){let r=t-o(this,ht).valueAsNumber,s=Math.abs(e-this.duration);(r>0||r<-.03||s>=.5)&&this.callback(t),h(this,qi,t),h(this,Wi,performance.now()),this.duration=e,this.playbackRate=n}};ht=new WeakMap,Vi=new WeakMap,pt=new WeakMap,qt=new WeakMap,Gi=new WeakMap,Wi=new WeakMap,qi=new WeakMap,Et=new WeakMap,Ke=new WeakMap,Yi=new WeakMap;var Su="video not loaded, unknown time.",yu=i=>{let t=i.range,e=Oe(+nd(i)),n=Oe(+i.mediaSeekableEnd),r=e&&n?`${e} of ${n}`:Su;t.setAttribute("aria-valuetext",r)},id=b.createElement("template");id.innerHTML=`
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

    :host(:is([${a.MEDIA_PREVIEW_IMAGE}], [${a.MEDIA_PREVIEW_TIME}])[dragging]) [part~="preview-box"] {
      transition-duration: var(--media-preview-transition-duration-in, .5s);
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      visibility: visible;
      opacity: 1;
    }

    @media (hover: hover) {
      :host(:is([${a.MEDIA_PREVIEW_IMAGE}], [${a.MEDIA_PREVIEW_TIME}]):hover) [part~="preview-box"] {
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

    :host([${a.MEDIA_PREVIEW_IMAGE}][dragging]) media-preview-thumbnail,
    :host([${a.MEDIA_PREVIEW_IMAGE}][dragging]) ::slotted(media-preview-thumbnail) {
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      visibility: visible;
    }

    @media (hover: hover) {
      :host([${a.MEDIA_PREVIEW_IMAGE}]:hover) media-preview-thumbnail,
      :host([${a.MEDIA_PREVIEW_IMAGE}]:hover) ::slotted(media-preview-thumbnail) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
      }

      :host([${a.MEDIA_PREVIEW_TIME}]:hover) {
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

    :host([${a.MEDIA_PREVIEW_IMAGE}]) media-preview-chapter-display,
    :host([${a.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-chapter-display) {
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      border-radius: var(--media-preview-chapter-border-radius, 0);
      padding: var(--media-preview-chapter-padding, 3.5px 9px 0);
      margin: var(--media-preview-chapter-margin, 0);
      min-width: 100%;
    }

    media-preview-chapter-display[${a.MEDIA_PREVIEW_CHAPTER}],
    ::slotted(media-preview-chapter-display[${a.MEDIA_PREVIEW_CHAPTER}]) {
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

    :host([${a.MEDIA_PREVIEW_IMAGE}]) media-preview-time-display,
    :host([${a.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-time-display) {
      transition-delay: var(--media-preview-transition-delay-in, .25s);
      border-radius: var(--media-preview-time-border-radius,
        0 0 var(--media-preview-border-radius) var(--media-preview-border-radius));
      min-width: 100%;
    }

    :host([${a.MEDIA_PREVIEW_TIME}]:hover) {
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
`;var Kr=(i,t=i.mediaCurrentTime)=>{let e=Number.isFinite(i.mediaSeekableStart)?i.mediaSeekableStart:0,n=Number.isFinite(i.mediaDuration)?i.mediaDuration:i.mediaSeekableEnd;if(Number.isNaN(n))return 0;let r=(t-e)/(n-e);return Math.max(0,Math.min(r,1))},nd=(i,t=i.range.valueAsNumber)=>{let e=Number.isFinite(i.mediaSeekableStart)?i.mediaSeekableStart:0,n=Number.isFinite(i.mediaDuration)?i.mediaDuration:i.mediaSeekableEnd;return Number.isNaN(n)?0:t*(n-e)+e},bt,Ve,ji,Yt,zi,Zi,Qt,jt,gt,ft,Qi,Wr,rd,qr,Xi,Zs,Ji,Xs,en,Js,Yr,sd,zt,Vr,Qr,od,Gr=class extends $e{constructor(){super();u(this,ft);u(this,Wr);u(this,Xi);u(this,Ji);u(this,en);u(this,Yr);u(this,zt);u(this,Qr);u(this,bt,void 0);u(this,Ve,void 0);u(this,ji,void 0);u(this,Yt,void 0);u(this,zi,void 0);u(this,Zi,void 0);u(this,Qt,void 0);u(this,jt,void 0);u(this,gt,void 0);u(this,qr,e=>{this.dragging||(Pt(e)&&(this.range.valueAsNumber=e),this.updateBar())});this.container.appendChild(id.content.cloneNode(!0)),this.shadowRoot.querySelector("#track").insertAdjacentHTML("afterbegin",'<div id="buffered" part="buffered"></div>'),h(this,ji,this.shadowRoot.querySelectorAll('[part~="box"]')),h(this,zi,this.shadowRoot.querySelector('[part~="preview-box"]')),h(this,Zi,this.shadowRoot.querySelector('[part~="current-box"]'));let n=getComputedStyle(this);h(this,Qt,parseInt(n.getPropertyValue("--media-box-padding-left"))),h(this,jt,parseInt(n.getPropertyValue("--media-box-padding-right"))),h(this,Ve,new $r(this.range,o(this,qr),60))}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PAUSED,a.MEDIA_DURATION,a.MEDIA_SEEKABLE,a.MEDIA_CURRENT_TIME,a.MEDIA_PREVIEW_IMAGE,a.MEDIA_PREVIEW_TIME,a.MEDIA_PREVIEW_CHAPTER,a.MEDIA_BUFFERED,a.MEDIA_PLAYBACK_RATE,a.MEDIA_LOADING,a.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute("aria-label",B.SEEK()),E(this,ft,Qi).call(this),h(this,bt,this.getRootNode()),(e=o(this,bt))==null||e.addEventListener("transitionstart",this)}disconnectedCallback(){var e;super.disconnectedCallback(),E(this,ft,Qi).call(this),(e=o(this,bt))==null||e.removeEventListener("transitionstart",this),h(this,bt,null)}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),n!=r&&(e===a.MEDIA_CURRENT_TIME||e===a.MEDIA_PAUSED||e===a.MEDIA_ENDED||e===a.MEDIA_LOADING||e===a.MEDIA_DURATION||e===a.MEDIA_SEEKABLE?(o(this,Ve).update({start:Kr(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),E(this,ft,Qi).call(this),yu(this)):e===a.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===a.MEDIA_DURATION||e===a.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=o(this,gt),this.updateBar()))}get mediaChaptersCues(){return o(this,gt)}set mediaChaptersCues(e){var n;h(this,gt,e),this.updateSegments((n=o(this,gt))==null?void 0:n.map(r=>({start:Kr(this,r.startTime),end:Kr(this,r.endTime)})))}get mediaPaused(){return U(this,a.MEDIA_PAUSED)}set mediaPaused(e){P(this,a.MEDIA_PAUSED,e)}get mediaLoading(){return U(this,a.MEDIA_LOADING)}set mediaLoading(e){P(this,a.MEDIA_LOADING,e)}get mediaDuration(){return k(this,a.MEDIA_DURATION)}set mediaDuration(e){C(this,a.MEDIA_DURATION,e)}get mediaCurrentTime(){return k(this,a.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){C(this,a.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return k(this,a.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){C(this,a.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){let e=this.getAttribute(a.MEDIA_BUFFERED);return e?e.split(" ").map(n=>n.split(":").map(r=>+r)):[]}set mediaBuffered(e){if(!e){this.removeAttribute(a.MEDIA_BUFFERED);return}let n=e.map(r=>r.join(":")).join(" ");this.setAttribute(a.MEDIA_BUFFERED,n)}get mediaSeekable(){let e=this.getAttribute(a.MEDIA_SEEKABLE);if(e)return e.split(":").map(n=>+n)}set mediaSeekable(e){if(e==null){this.removeAttribute(a.MEDIA_SEEKABLE);return}this.setAttribute(a.MEDIA_SEEKABLE,e.join(":"))}get mediaSeekableEnd(){var n;let[,e=this.mediaDuration]=(n=this.mediaSeekable)!=null?n:[];return e}get mediaSeekableStart(){var n;let[e=0]=(n=this.mediaSeekable)!=null?n:[];return e}get mediaPreviewImage(){return _(this,a.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){M(this,a.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return k(this,a.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){C(this,a.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return U(this,a.MEDIA_ENDED)}set mediaEnded(e){P(this,a.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){var s;let e=this.mediaBuffered;if(!e.length)return;let n;if(this.mediaEnded)n=1;else{let l=this.mediaCurrentTime,[,d=this.mediaSeekableStart]=(s=e.find(([c,p])=>c<=l&&l<=p))!=null?s:[];n=Kr(this,d)}let{style:r}=N(this.shadowRoot,"#buffered");r.setProperty("width",`${n*100}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector('slot[name="current"]').assignedElements().length)return;let n=N(this.shadowRoot,"#current-rail"),r=N(this.shadowRoot,'[part~="current-box"]'),s=E(this,Xi,Zs).call(this,o(this,Zi)),l=E(this,Ji,Xs).call(this,s,this.range.valueAsNumber),d=E(this,en,Js).call(this,s,this.range.valueAsNumber);n.style.transform=`translateX(${l})`,n.style.setProperty("--_range-width",`${s.range.width}`),r.style.setProperty("--_box-shift",`${d}`),r.style.setProperty("--_box-width",`${s.box.width}px`),r.style.setProperty("visibility","initial")}handleEvent(e){switch(super.handleEvent(e),e.type){case"input":E(this,Qr,od).call(this);break;case"pointermove":E(this,Yr,sd).call(this,e);break;case"pointerup":case"pointerleave":E(this,zt,Vr).call(this,null);break;case"transitionstart":Q(e.target,this)&&setTimeout(()=>E(this,ft,Qi).call(this),0);break}}};bt=new WeakMap,Ve=new WeakMap,ji=new WeakMap,Yt=new WeakMap,zi=new WeakMap,Zi=new WeakMap,Qt=new WeakMap,jt=new WeakMap,gt=new WeakMap,ft=new WeakSet,Qi=function(){E(this,Wr,rd).call(this)?o(this,Ve).start():o(this,Ve).stop()},Wr=new WeakSet,rd=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&jn(this)},qr=new WeakMap,Xi=new WeakSet,Zs=function(e){var p;let r=((p=this.getAttribute("bounds")?Te(this,`#${this.getAttribute("bounds")}`):this.parentElement)!=null?p:this).getBoundingClientRect(),s=this.range.getBoundingClientRect(),l=e.offsetWidth,d=-(s.left-r.left-l/2),c=r.right-s.left-l/2;return{box:{width:l,min:d,max:c},bounds:r,range:s}},Ji=new WeakSet,Xs=function(e,n){let r=`${n*100}%`,{width:s,min:l,max:d}=e.box;if(!s)return r;if(Number.isNaN(l)||(r=`max(${`calc(1 / var(--_range-width) * 100 * ${l}% + var(--media-box-padding-left))`}, ${r})`),!Number.isNaN(d)){let p=`calc(1 / var(--_range-width) * 100 * ${d}% - var(--media-box-padding-right))`;r=`min(${r}, ${p})`}return r},en=new WeakSet,Js=function(e,n){let{width:r,min:s,max:l}=e.box,d=n*e.range.width;if(d<s+o(this,Qt)){let c=e.range.left-e.bounds.left-o(this,Qt);return`${d-r/2+c}px`}if(d>l-o(this,jt)){let c=e.bounds.right-e.range.right-o(this,jt);return`${d+r/2-c-e.range.width}px`}return 0},Yr=new WeakSet,sd=function(e){let n=[...o(this,ji)].some(T=>e.composedPath().includes(T));if(!this.dragging&&(n||!e.composedPath().includes(this))){E(this,zt,Vr).call(this,null);return}let r=this.mediaSeekableEnd;if(!r)return;let s=N(this.shadowRoot,"#preview-rail"),l=N(this.shadowRoot,'[part~="preview-box"]'),d=E(this,Xi,Zs).call(this,o(this,zi)),c=(e.clientX-d.range.left)/d.range.width;c=Math.max(0,Math.min(1,c));let p=E(this,Ji,Xs).call(this,d,c),f=E(this,en,Js).call(this,d,c);s.style.transform=`translateX(${p})`,s.style.setProperty("--_range-width",`${d.range.width}`),l.style.setProperty("--_box-shift",`${f}`),l.style.setProperty("--_box-width",`${d.box.width}px`);let A=Math.round(o(this,Yt))-Math.round(c*r);Math.abs(A)<1&&c>.01&&c<.99||(h(this,Yt,c*r),E(this,zt,Vr).call(this,o(this,Yt)))},zt=new WeakSet,Vr=function(e){this.dispatchEvent(new m.CustomEvent(g.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:e}))},Qr=new WeakSet,od=function(){o(this,Ve).stop();let e=nd(this);this.dispatchEvent(new m.CustomEvent(g.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e}))};m.customElements.get("media-time-range")||m.customElements.define("media-time-range",Gr);var ad=Gr;var Zt={PLACEMENT:"placement",BOUNDS:"bounds"},ld=b.createElement("template");ld.innerHTML=`
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
`;var jr=class extends m.HTMLElement{constructor(){super();this.updateXOffset=()=>{var D;if(!jn(this,{checkOpacity:!1,checkVisibilityCSS:!1}))return;let e=this.placement;if(e==="left"||e==="right"){this.style.removeProperty("--media-tooltip-offset-x");return}let n=getComputedStyle(this),r=(D=Te(this,"#"+this.bounds))!=null?D:K(this);if(!r)return;let{x:s,width:l}=r.getBoundingClientRect(),{x:d,width:c}=this.getBoundingClientRect(),p=d+c,f=s+l,A=n.getPropertyValue("--media-tooltip-offset-x"),T=A?parseFloat(A.replace("px","")):0,v=n.getPropertyValue("--media-tooltip-container-margin"),x=v?parseFloat(v.replace("px","")):0,S=d-s+T-x,L=p-f+T+x;if(S<0){this.style.setProperty("--media-tooltip-offset-x",`${S}px`);return}if(L>0){this.style.setProperty("--media-tooltip-offset-x",`${L}px`);return}this.style.removeProperty("--media-tooltip-offset-x")};if(this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(ld.content.cloneNode(!0))),this.arrowEl=this.shadowRoot.querySelector("#arrow"),Object.prototype.hasOwnProperty.call(this,"placement")){let e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[Zt.PLACEMENT,Zt.BOUNDS]}get placement(){return _(this,Zt.PLACEMENT)}set placement(e){M(this,Zt.PLACEMENT,e)}get bounds(){return _(this,Zt.BOUNDS)}set bounds(e){M(this,Zt.BOUNDS,e)}};m.customElements.get("media-tooltip")||m.customElements.define("media-tooltip",jr);var dd=jr;var Mu=1,Lu=i=>i.mediaMuted?0:i.mediaVolume,ku=i=>`${Math.round(i*100)}%`,zr=class extends $e{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_VOLUME,a.MEDIA_MUTED,a.MEDIA_VOLUME_UNAVAILABLE]}constructor(){super(),this.range.addEventListener("input",()=>{let t=this.range.value,e=new m.CustomEvent(g.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(e)})}connectedCallback(){super.connectedCallback(),this.range.setAttribute("aria-label",B.VOLUME())}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n),(t===a.MEDIA_VOLUME||t===a.MEDIA_MUTED)&&(this.range.valueAsNumber=Lu(this),this.range.setAttribute("aria-valuetext",ku(this.range.valueAsNumber)),this.updateBar())}get mediaVolume(){return k(this,a.MEDIA_VOLUME,Mu)}set mediaVolume(t){C(this,a.MEDIA_VOLUME,t)}get mediaMuted(){return U(this,a.MEDIA_MUTED)}set mediaMuted(t){P(this,a.MEDIA_MUTED,t)}get mediaVolumeUnavailable(){return _(this,a.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(t){M(this,a.MEDIA_VOLUME_UNAVAILABLE,t)}};m.customElements.get("media-volume-range")||m.customElements.define("media-volume-range",zr);var md=zr;function ud({anchor:i,floating:t,placement:e}){let n=_u({anchor:i,floating:t}),{x:r,y:s}=Ru(n,e);return{x:r,y:s}}function _u({anchor:i,floating:t}){return{anchor:xu(i,t.offsetParent),floating:{x:0,y:0,width:t.offsetWidth,height:t.offsetHeight}}}function xu(i,t){var r;let e=i.getBoundingClientRect(),n=(r=t==null?void 0:t.getBoundingClientRect())!=null?r:{x:0,y:0};return{x:e.x-n.x,y:e.y-n.y,width:e.width,height:e.height}}function Ru({anchor:i,floating:t},e){let n=Cu(e)==="x"?"y":"x",r=n==="y"?"height":"width",s=cd(e),l=i.x+i.width/2-t.width/2,d=i.y+i.height/2-t.height/2,c=i[r]/2-t[r]/2,p;switch(s){case"top":p={x:l,y:i.y-t.height};break;case"bottom":p={x:l,y:i.y+i.height};break;case"right":p={x:i.x+i.width,y:d};break;case"left":p={x:i.x-t.width,y:d};break;default:p={x:i.x,y:i.y}}switch(e.split("-")[1]){case"start":p[n]-=c;break;case"end":p[n]+=c;break}return p}function cd(i){return i.split("-")[0]}function Cu(i){return["top","bottom"].includes(cd(i))?"y":"x"}var Ge=class extends Event{constructor({action:t="auto",relatedTarget:e,...n}){super("invoke",n),this.action=t,this.relatedTarget=e}},Zr=class extends Event{constructor({newState:t,oldState:e,...n}){super("toggle",n),this.newState=t,this.oldState=e}};function ye({type:i,text:t,value:e,checked:n}){let r=b.createElement("media-chrome-menu-item");r.type=i!=null?i:"",r.part.add("menu-item"),i&&r.part.add(i),r.value=e,r.checked=n;let s=b.createElement("span");return s.textContent=t,r.append(s),r}function be(i,t){let e=i.querySelector(`:scope > [slot="${t}"]`);if((e==null?void 0:e.nodeName)=="SLOT"&&(e=e.assignedElements({flatten:!0})[0]),e)return e=e.cloneNode(!0),e;let n=i.shadowRoot.querySelector(`[name="${t}"] > svg`);return n?n.cloneNode(!0):""}var hd=b.createElement("template");hd.innerHTML=`
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
`;var vt={STYLE:"style",HIDDEN:"hidden",DISABLED:"disabled",ANCHOR:"anchor"},Ee,We,Ce,rn,sn,qe,Xt,es,pd,on,an,eo,ts,Ed,is,bd,ns,gd,Tt,At,It,nn,ln,to,rs,fd,ss,vd,os,Td,as,Ad,ls,Id,ds,Sd,Jt,Xr,ms,yd,ei,Jr,dn,io,W=class extends m.HTMLElement{constructor(){super();u(this,es);u(this,an);u(this,ts);u(this,is);u(this,ns);u(this,It);u(this,ln);u(this,rs);u(this,ss);u(this,os);u(this,as);u(this,ls);u(this,ds);u(this,Jt);u(this,ms);u(this,ei);u(this,dn);u(this,Ee,null);u(this,We,null);u(this,Ce,null);u(this,rn,new Set);u(this,sn,void 0);u(this,qe,!1);u(this,Xt,null);u(this,on,()=>{let e=o(this,rn),n=new Set(this.items);for(let r of e)n.has(r)||this.dispatchEvent(new CustomEvent("removemenuitem",{detail:r}));for(let r of n)e.has(r)||this.dispatchEvent(new CustomEvent("addmenuitem",{detail:r}));h(this,rn,n)});u(this,Tt,()=>{E(this,It,nn).call(this),E(this,ln,to).call(this,!1)});u(this,At,()=>{E(this,It,nn).call(this)});this.shadowRoot||(this.attachShadow({mode:"open"}),this.nativeEl=this.constructor.template.content.cloneNode(!0),this.shadowRoot.append(this.nativeEl)),this.container=this.shadowRoot.querySelector("#container"),this.defaultSlot=this.shadowRoot.querySelector("slot:not([name])"),this.shadowRoot.addEventListener("slotchange",this),h(this,sn,new MutationObserver(o(this,on))),o(this,sn).observe(this.defaultSlot,{childList:!0})}static get observedAttributes(){return[vt.DISABLED,vt.HIDDEN,vt.STYLE,vt.ANCHOR,I.MEDIA_CONTROLLER]}static formatMenuItemText(e){return e}enable(){this.addEventListener("click",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this),this.addEventListener("invoke",this),this.addEventListener("toggle",this)}disable(){this.removeEventListener("click",this),this.removeEventListener("focusout",this),this.removeEventListener("keyup",this),this.removeEventListener("invoke",this),this.removeEventListener("toggle",this)}handleEvent(e){switch(e.type){case"slotchange":E(this,es,pd).call(this,e);break;case"invoke":E(this,ts,Ed).call(this,e);break;case"click":E(this,rs,fd).call(this,e);break;case"toggle":E(this,os,Td).call(this,e);break;case"focusout":E(this,ls,Id).call(this,e);break;case"keydown":E(this,ds,Sd).call(this,e);break}}connectedCallback(){var e,n;h(this,Xt,Ps(this.shadowRoot,":host")),E(this,an,eo).call(this),this.hasAttribute("disabled")||this.enable(),this.role||(this.role="menu"),h(this,Ee,qn(this)),(n=(e=o(this,Ee))==null?void 0:e.associateElement)==null||n.call(e,this),this.hidden||(ke(tn(this),o(this,Tt)),ke(this,o(this,At)))}disconnectedCallback(){var e,n;ze(tn(this),o(this,Tt)),ze(this,o(this,At)),this.disable(),(n=(e=o(this,Ee))==null?void 0:e.unassociateElement)==null||n.call(e,this),h(this,Ee,null)}attributeChangedCallback(e,n,r){var s,l,d,c;e===vt.HIDDEN&&r!==n?(o(this,qe)||h(this,qe,!0),this.hidden?E(this,ns,gd).call(this):E(this,is,bd).call(this),this.dispatchEvent(new Zr({oldState:this.hidden?"open":"closed",newState:this.hidden?"closed":"open",bubbles:!0}))):e===I.MEDIA_CONTROLLER?(n&&((l=(s=o(this,Ee))==null?void 0:s.unassociateElement)==null||l.call(s,this),h(this,Ee,null)),r&&this.isConnected&&(h(this,Ee,qn(this)),(c=(d=o(this,Ee))==null?void 0:d.associateElement)==null||c.call(d,this))):e===vt.DISABLED&&r!==n?r==null?this.enable():this.disable():e===vt.STYLE&&r!==n&&E(this,an,eo).call(this)}formatMenuItemText(e,n){return this.constructor.formatMenuItemText(e,n)}get anchor(){return this.getAttribute("anchor")}set anchor(e){this.setAttribute("anchor",`${e}`)}get anchorElement(){var e;return this.anchor?(e=Ze(this))==null?void 0:e.querySelector(`#${this.anchor}`):null}get items(){return this.defaultSlot.assignedElements({flatten:!0}).filter(Du)}get radioGroupItems(){return this.items.filter(e=>e.role==="menuitemradio")}get checkedItems(){return this.items.filter(e=>e.checked)}get value(){var e,n;return(n=(e=this.checkedItems[0])==null?void 0:e.value)!=null?n:""}set value(e){let n=this.items.find(r=>r.value===e);n&&E(this,dn,io).call(this,n)}focus(){if(h(this,We,bi()),this.items.length){E(this,ei,Jr).call(this,this.items[0]),this.items[0].focus();return}let e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');e==null||e.focus()}handleSelect(e){var r;let n=E(this,Jt,Xr).call(this,e);n&&(E(this,dn,io).call(this,n,n.type==="checkbox"),o(this,Ce)&&!this.hidden&&((r=o(this,We))==null||r.focus(),this.hidden=!0))}get keysUsed(){return["Enter","Escape","Tab"," ","ArrowDown","ArrowUp","Home","End"]}handleMove(e){var c,p;let{key:n}=e,r=this.items,s=(p=(c=E(this,Jt,Xr).call(this,e))!=null?c:E(this,ms,yd).call(this))!=null?p:r[0],l=r.indexOf(s),d=Math.max(0,l);n==="ArrowDown"?d++:n==="ArrowUp"?d--:e.key==="Home"?d=0:e.key==="End"&&(d=r.length-1),d<0&&(d=r.length-1),d>r.length-1&&(d=0),E(this,ei,Jr).call(this,r[d]),r[d].focus()}};Ee=new WeakMap,We=new WeakMap,Ce=new WeakMap,rn=new WeakMap,sn=new WeakMap,qe=new WeakMap,Xt=new WeakMap,es=new WeakSet,pd=function(e){let n=e.target;for(let r of n.assignedNodes({flatten:!0}))r.nodeType===3&&r.textContent.trim()===""&&r.remove();if(["header","title"].includes(n.name)){let r=this.shadowRoot.querySelector('slot[name="header"]');r.hidden=n.assignedNodes().length===0}n.name||o(this,on).call(this)},on=new WeakMap,an=new WeakSet,eo=function(){var r;let e=this.shadowRoot.querySelector("#layout-row"),n=(r=getComputedStyle(this).getPropertyValue("--media-menu-layout"))==null?void 0:r.trim();e.setAttribute("media",n==="row"?"":"width:0")},ts=new WeakSet,Ed=function(e){h(this,Ce,e.relatedTarget),Q(this,e.relatedTarget)||(this.hidden=!this.hidden)},is=new WeakSet,bd=function(){var e;(e=o(this,Ce))==null||e.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0}),ke(tn(this),o(this,Tt)),ke(this,o(this,At))},ns=new WeakSet,gd=function(){var e;(e=o(this,Ce))==null||e.setAttribute("aria-expanded","false"),ze(tn(this),o(this,Tt)),ze(this,o(this,At))},Tt=new WeakMap,At=new WeakMap,It=new WeakSet,nn=function(e){if(this.hasAttribute("mediacontroller")&&!this.anchor||this.hidden||!this.anchorElement)return;let{x:n,y:r}=ud({anchor:this.anchorElement,floating:this,placement:"top-start"});e!=null||(e=this.offsetWidth);let l=tn(this).getBoundingClientRect(),d=l.width-n-e,c=l.height-r-this.offsetHeight,{style:p}=o(this,Xt);p.setProperty("position","absolute"),p.setProperty("right",`${Math.max(0,d)}px`),p.setProperty("--_menu-bottom",`${c}px`);let f=getComputedStyle(this),T=p.getPropertyValue("--_menu-bottom")===f.bottom?c:parseFloat(f.bottom),v=l.height-T-parseFloat(f.marginBottom);this.style.setProperty("--_menu-max-height",`${v}px`)},ln=new WeakSet,to=function(e){let n=this.querySelector('[role="menuitem"][aria-haspopup][aria-expanded="true"]'),r=n==null?void 0:n.querySelector('[role="menu"]'),{style:s}=o(this,Xt);if(e||s.setProperty("--media-menu-transition-in","none"),r){let l=r.offsetHeight,d=Math.max(r.offsetWidth,n.offsetWidth);this.style.setProperty("min-width",`${d}px`),this.style.setProperty("min-height",`${l}px`),E(this,It,nn).call(this,d)}else this.style.removeProperty("min-width"),this.style.removeProperty("min-height"),E(this,It,nn).call(this);s.removeProperty("--media-menu-transition-in")},rs=new WeakSet,fd=function(e){var r;if(e.stopPropagation(),e.composedPath().includes(o(this,ss,vd))){(r=o(this,We))==null||r.focus(),this.hidden=!0;return}let n=E(this,Jt,Xr).call(this,e);!n||n.hasAttribute("disabled")||(E(this,ei,Jr).call(this,n),this.handleSelect(e))},ss=new WeakSet,vd=function(){var n;return(n=this.shadowRoot.querySelector('slot[name="header"]').assignedElements({flatten:!0}))==null?void 0:n.find(r=>r.matches('button[part~="back"]'))},os=new WeakSet,Td=function(e){if(e.target===this)return;E(this,as,Ad).call(this);let n=Array.from(this.querySelectorAll('[role="menuitem"][aria-haspopup]'));for(let r of n)r.invokeTargetElement!=e.target&&e.newState=="open"&&r.getAttribute("aria-expanded")=="true"&&!r.invokeTargetElement.hidden&&r.invokeTargetElement.dispatchEvent(new Ge({relatedTarget:r}));for(let r of n)r.setAttribute("aria-expanded",`${!r.submenuElement.hidden}`);E(this,ln,to).call(this,!0)},as=new WeakSet,Ad=function(){let n=this.querySelector('[role="menuitem"] > [role="menu"]:not([hidden])');this.container.classList.toggle("has-expanded",!!n)},ls=new WeakSet,Id=function(e){var n;Q(this,e.relatedTarget)||(o(this,qe)&&((n=o(this,We))==null||n.focus()),o(this,Ce)&&o(this,Ce)!==e.relatedTarget&&!this.hidden&&(this.hidden=!0))},ds=new WeakSet,Sd=function(e){var d,c,p,f,A;let{key:n,ctrlKey:r,altKey:s,metaKey:l}=e;if(!(r||s||l)&&this.keysUsed.includes(n))if(e.preventDefault(),e.stopPropagation(),n==="Tab"){if(o(this,qe)){this.hidden=!0;return}e.shiftKey?(c=(d=this.previousElementSibling)==null?void 0:d.focus)==null||c.call(d):(f=(p=this.nextElementSibling)==null?void 0:p.focus)==null||f.call(p),this.blur()}else n==="Escape"?((A=o(this,We))==null||A.focus(),o(this,qe)&&(this.hidden=!0)):n==="Enter"||n===" "?this.handleSelect(e):this.handleMove(e)},Jt=new WeakSet,Xr=function(e){return e.composedPath().find(n=>["menuitemradio","menuitemcheckbox"].includes(n.role))},ms=new WeakSet,yd=function(){return this.items.find(e=>e.tabIndex===0)},ei=new WeakSet,Jr=function(e){for(let n of this.items)n.tabIndex=n===e?0:-1},dn=new WeakSet,io=function(e,n){let r=[...this.checkedItems];e.type==="radio"&&this.radioGroupItems.forEach(s=>s.checked=!1),n?e.checked=!e.checked:e.checked=!0,this.checkedItems.some((s,l)=>s!=r[l])&&this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))},W.template=hd;function Du(i){return["menuitem","menuitemradio","menuitemcheckbox"].includes(i==null?void 0:i.role)}function tn(i){var t;return(t=i.getAttribute("bounds")?Te(i,`#${i.getAttribute("bounds")}`):K(i)||i.parentElement)!=null?t:i}m.customElements.get("media-chrome-menu")||m.customElements.define("media-chrome-menu",W);var Md=b.createElement("template");Md.innerHTML=`
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
`;var ie={TYPE:"type",VALUE:"value",CHECKED:"checked",DISABLED:"disabled"},cn,ti,us,Ld,cs,kd,hs,_d,ge,St,un,ps,xd,hn,no,De=class extends m.HTMLElement{constructor(){super();u(this,us);u(this,cs);u(this,hs);u(this,St);u(this,ps);u(this,hn);u(this,cn,!1);u(this,ti,void 0);u(this,ge,()=>{var l,d;this.setAttribute("submenusize",`${this.submenuElement.items.length}`);let e=this.shadowRoot.querySelector('slot[name="description"]'),n=(l=this.submenuElement.checkedItems)==null?void 0:l[0],r=(d=n==null?void 0:n.dataset.description)!=null?d:n==null?void 0:n.text,s=b.createElement("span");s.textContent=r!=null?r:"",e.replaceChildren(s)});this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.append(this.constructor.template.content.cloneNode(!0))),this.shadowRoot.addEventListener("slotchange",this)}static get observedAttributes(){return[ie.TYPE,ie.DISABLED,ie.CHECKED,ie.VALUE]}enable(){this.hasAttribute("tabindex")||this.setAttribute("tabindex","-1"),mn(this)&&!this.hasAttribute("aria-checked")&&this.setAttribute("aria-checked","false"),this.addEventListener("click",this),this.addEventListener("keydown",this)}disable(){this.removeAttribute("tabindex"),this.removeEventListener("click",this),this.removeEventListener("keydown",this),this.removeEventListener("keyup",this)}handleEvent(e){switch(e.type){case"slotchange":E(this,us,Ld).call(this,e);break;case"click":this.handleClick(e);break;case"keydown":E(this,ps,xd).call(this,e);break;case"keyup":E(this,St,un).call(this,e);break}}attributeChangedCallback(e,n,r){e===ie.CHECKED&&mn(this)&&!o(this,cn)?this.setAttribute("aria-checked",r!=null?"true":"false"):e===ie.TYPE&&r!==n?this.role="menuitem"+r:e===ie.DISABLED&&r!==n&&(r==null?this.enable():this.disable())}connectedCallback(){this.hasAttribute(ie.DISABLED)||this.enable(),this.role="menuitem"+this.type,h(this,ti,ro(this,this.parentNode)),E(this,hn,no).call(this)}disconnectedCallback(){this.disable(),E(this,hn,no).call(this),h(this,ti,null)}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?(e=Ze(this))==null?void 0:e.querySelector(`#${this.invokeTarget}`):this.submenuElement}get submenuElement(){return this.shadowRoot.querySelector('slot[name="submenu"]').assignedElements({flatten:!0})[0]}get type(){var e;return(e=this.getAttribute(ie.TYPE))!=null?e:""}set type(e){this.setAttribute(ie.TYPE,`${e}`)}get value(){var e;return(e=this.getAttribute(ie.VALUE))!=null?e:this.text}set value(e){this.setAttribute(ie.VALUE,e)}get text(){var e;return((e=this.textContent)!=null?e:"").trim()}get checked(){if(mn(this))return this.getAttribute("aria-checked")==="true"}set checked(e){mn(this)&&(h(this,cn,!0),this.setAttribute("aria-checked",e?"true":"false"),e?this.part.add("checked"):this.part.remove("checked"))}handleClick(e){mn(this)||this.invokeTargetElement&&Q(this,e.target)&&this.invokeTargetElement.dispatchEvent(new Ge({relatedTarget:this}))}get keysUsed(){return["Enter"," "]}};cn=new WeakMap,ti=new WeakMap,us=new WeakSet,Ld=function(e){let n=e.target;if(!(n!=null&&n.name))for(let s of n.assignedNodes({flatten:!0}))s instanceof Text&&s.textContent.trim()===""&&s.remove();n.name==="submenu"&&(this.submenuElement?E(this,cs,kd).call(this):E(this,hs,_d).call(this))},cs=new WeakSet,kd=async function(){this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",`${!this.submenuElement.hidden}`),this.submenuElement.addEventListener("change",o(this,ge)),this.submenuElement.addEventListener("addmenuitem",o(this,ge)),this.submenuElement.addEventListener("removemenuitem",o(this,ge)),o(this,ge).call(this)},hs=new WeakSet,_d=function(){this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"),this.submenuElement.removeEventListener("change",o(this,ge)),this.submenuElement.removeEventListener("addmenuitem",o(this,ge)),this.submenuElement.removeEventListener("removemenuitem",o(this,ge)),o(this,ge).call(this)},ge=new WeakMap,St=new WeakSet,un=function(e){let{key:n}=e;if(!this.keysUsed.includes(n)){this.removeEventListener("keyup",E(this,St,un));return}this.handleClick(e)},ps=new WeakSet,xd=function(e){let{metaKey:n,altKey:r,key:s}=e;if(n||r||!this.keysUsed.includes(s)){this.removeEventListener("keyup",E(this,St,un));return}this.addEventListener("keyup",E(this,St,un),{once:!0})},hn=new WeakSet,no=function(){var r;let e=(r=o(this,ti))==null?void 0:r.radioGroupItems;if(!e)return;let n=e.filter(s=>s.getAttribute("aria-checked")==="true").pop();n||(n=e[0]);for(let s of e)s.setAttribute("aria-checked","false");n==null||n.setAttribute("aria-checked","true")},De.template=Md;function mn(i){return i.type==="radio"||i.type==="checkbox"}function ro(i,t){if(!i)return null;let{host:e}=i.getRootNode();return!t&&e?ro(i,e):t!=null&&t.items?t:ro(t,t==null?void 0:t.parentNode)}m.customElements.get("media-chrome-menu-item")||m.customElements.define("media-chrome-menu-item",De);var Rd=b.createElement("template");Rd.innerHTML=W.template.innerHTML+`
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
`;var ii=class extends W{get anchorElement(){return this.anchor!=="auto"?super.anchorElement:K(this).querySelector("media-settings-menu-button")}};ii.template=Rd;m.customElements.get("media-settings-menu")||m.customElements.define("media-settings-menu",ii);var Es=b.createElement("template");Es.innerHTML=De.template.innerHTML+`
  <style>
    slot:not([name="submenu"]) {
      opacity: var(--media-settings-menu-item-opacity, var(--media-menu-item-opacity));
    }

    :host([aria-expanded="true"]:hover) {
      background: transparent;
    }
  </style>
`;var Cd;(Cd=Es.content)!=null&&Cd.querySelector&&(Es.content.querySelector('slot[name="suffix"]').innerHTML=`
    <svg aria-hidden="true" viewBox="0 0 20 24">
      <path d="m8.12 17.585-.742-.669 4.2-4.665-4.2-4.666.743-.669 4.803 5.335-4.803 5.334Z"/>
    </svg>
  `);var ni=class extends De{};ni.template=Es;m.customElements.get("media-settings-menu-item")||m.customElements.define("media-settings-menu-item",ni);var J=class extends O{connectedCallback(){super.connectedCallback(),this.invokeTargetElement&&this.setAttribute("aria-haspopup","menu")}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(t){this.setAttribute("invoketarget",`${t}`)}get invokeTargetElement(){var t;return this.invokeTarget?(t=Ze(this))==null?void 0:t.querySelector(`#${this.invokeTarget}`):null}handleClick(){var t;(t=this.invokeTargetElement)==null||t.dispatchEvent(new Ge({relatedTarget:this}))}};m.customElements.get("media-chrome-menu-button")||m.customElements.define("media-chrome-menu-button",J);var Dd=b.createElement("template");Dd.innerHTML=`
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
`;var pn=class extends J{static get observedAttributes(){return[...super.observedAttributes,"target"]}constructor(){super({slotTemplate:Dd,tooltipContent:y.SETTINGS})}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",B.SETTINGS())}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:K(this).querySelector("media-settings-menu")}};m.customElements.get("media-settings-menu-button")||m.customElements.define("media-settings-menu-button",pn);var ri,bn,gn,so,fn,oo,En=class extends W{constructor(){super(...arguments);u(this,gn);u(this,fn);u(this,ri,[]);u(this,bn,void 0)}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_AUDIO_TRACK_LIST,a.MEDIA_AUDIO_TRACK_ENABLED,a.MEDIA_AUDIO_TRACK_UNAVAILABLE]}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_AUDIO_TRACK_ENABLED&&n!==r?this.value=r:e===a.MEDIA_AUDIO_TRACK_LIST&&n!==r&&(h(this,ri,ra(r!=null?r:"")),E(this,gn,so).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",E(this,fn,oo))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",E(this,fn,oo))}get anchorElement(){var e;return this.anchor!=="auto"?super.anchorElement:(e=K(this))==null?void 0:e.querySelector("media-audio-track-menu-button")}get mediaAudioTrackList(){return o(this,ri)}set mediaAudioTrackList(e){h(this,ri,e),E(this,gn,so).call(this)}get mediaAudioTrackEnabled(){var e;return(e=_(this,a.MEDIA_AUDIO_TRACK_ENABLED))!=null?e:""}set mediaAudioTrackEnabled(e){M(this,a.MEDIA_AUDIO_TRACK_ENABLED,e)}};ri=new WeakMap,bn=new WeakMap,gn=new WeakSet,so=function(){if(o(this,bn)===JSON.stringify(this.mediaAudioTrackList))return;h(this,bn,JSON.stringify(this.mediaAudioTrackList));let e=this.mediaAudioTrackList;this.defaultSlot.textContent="";for(let n of e){let r=this.formatMenuItemText(n.label,n),s=ye({type:"radio",text:r,value:`${n.id}`,checked:n.enabled});s.prepend(be(this,"checked-indicator")),this.defaultSlot.append(s)}},fn=new WeakSet,oo=function(){if(this.value==null)return;let e=new m.CustomEvent(g.MEDIA_AUDIO_TRACK_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(e)};m.customElements.get("media-audio-track-menu")||m.customElements.define("media-audio-track-menu",En);var wu=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M11 17H9.5V7H11v10Zm-3-3H6.5v-4H8v4Zm6-5h-1.5v6H14V9Zm3 7h-1.5V8H17v8Z"/>
  <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-2 0a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z"/>
</svg>`,wd=b.createElement("template");wd.innerHTML=`
  <style>
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon">${wu}</slot>
`;var vn=class extends J{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_AUDIO_TRACK_ENABLED,a.MEDIA_AUDIO_TRACK_UNAVAILABLE]}constructor(){super({slotTemplate:wd,tooltipContent:y.AUDIO_TRACK_MENU})}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",B.AUDIO_TRACKS())}attributeChangedCallback(t,e,n){super.attributeChangedCallback(t,e,n)}get invokeTargetElement(){var t;return this.invokeTarget!=null?super.invokeTargetElement:(t=K(this))==null?void 0:t.querySelector("media-audio-track-menu")}get mediaAudioTrackEnabled(){var t;return(t=_(this,a.MEDIA_AUDIO_TRACK_ENABLED))!=null?t:""}set mediaAudioTrackEnabled(t){M(this,a.MEDIA_AUDIO_TRACK_ENABLED,t)}};m.customElements.get("media-audio-track-menu-button")||m.customElements.define("media-audio-track-menu-button",vn);var Pu=`
  <svg aria-hidden="true" viewBox="0 0 26 24" part="captions-indicator indicator">
    <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
  </svg>`,Nd=b.createElement("template");Nd.innerHTML=W.template.innerHTML+`
  <slot name="captions-indicator" hidden>${Pu}</slot>`;var Tn,bs,Od,An,ao,si=class extends W{constructor(){super(...arguments);u(this,bs);u(this,An);u(this,Tn,void 0)}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_SUBTITLES_LIST,a.MEDIA_SUBTITLES_SHOWING]}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_SUBTITLES_LIST&&n!==r?E(this,bs,Od).call(this):e===a.MEDIA_SUBTITLES_SHOWING&&n!==r&&(this.value=r)}connectedCallback(){super.connectedCallback(),this.addEventListener("change",E(this,An,ao))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",E(this,An,ao))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:K(this).querySelector("media-captions-menu-button")}get mediaSubtitlesList(){return Pd(this,a.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Ud(this,a.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Pd(this,a.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Ud(this,a.MEDIA_SUBTITLES_SHOWING,e)}};Tn=new WeakMap,bs=new WeakSet,Od=function(){var s;if(o(this,Tn)===JSON.stringify(this.mediaSubtitlesList))return;h(this,Tn,JSON.stringify(this.mediaSubtitlesList)),this.defaultSlot.textContent="";let e=!this.value,n=ye({type:"radio",text:this.formatMenuItemText("Off"),value:"off",checked:e});n.prepend(be(this,"checked-indicator")),this.defaultSlot.append(n);let r=this.mediaSubtitlesList;for(let l of r){let d=ye({type:"radio",text:this.formatMenuItemText(l.label,l),value:er(l),checked:this.value==er(l)});d.prepend(be(this,"checked-indicator")),((s=l.kind)!=null?s:"subs")==="captions"&&d.append(be(this,"captions-indicator")),this.defaultSlot.append(d)}},An=new WeakSet,ao=function(){let e=this.mediaSubtitlesShowing,n=this.getAttribute(a.MEDIA_SUBTITLES_SHOWING),r=this.value!==n;if(e!=null&&e.length&&r&&this.dispatchEvent(new m.CustomEvent(g.MEDIA_DISABLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:e})),!this.value||!r)return;let s=new m.CustomEvent(g.MEDIA_SHOW_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(s)},si.template=Nd;var Pd=(i,t)=>{let e=i.getAttribute(t);return e?nt(e):[]},Ud=(i,t,e)=>{if(!(e!=null&&e.length)){i.removeAttribute(t);return}let n=_e(e);i.getAttribute(t)!==n&&i.setAttribute(t,n)};m.customElements.get("media-captions-menu")||m.customElements.define("media-captions-menu",si);var Uu=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,Nu=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,$d=b.createElement("template");$d.innerHTML=`
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
    <slot name="on">${Uu}</slot>
    <slot name="off">${Nu}</slot>
  </slot>
`;var Hd=i=>{i.setAttribute("aria-checked",tr(i).toString())},gs,In=class extends J{constructor(e={}){super({slotTemplate:$d,tooltipContent:y.CAPTIONS,...e});u(this,gs,void 0);h(this,gs,!1)}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_SUBTITLES_LIST,a.MEDIA_SUBTITLES_SHOWING]}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",B.CLOSED_CAPTIONS()),Hd(this)}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_SUBTITLES_SHOWING&&Hd(this)}get invokeTargetElement(){var e;return this.invokeTarget!=null?super.invokeTargetElement:(e=K(this))==null?void 0:e.querySelector("media-captions-menu")}get mediaSubtitlesList(){return Bd(this,a.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Fd(this,a.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Bd(this,a.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Fd(this,a.MEDIA_SUBTITLES_SHOWING,e)}};gs=new WeakMap;var Bd=(i,t)=>{let e=i.getAttribute(t);return e?nt(e):[]},Fd=(i,t,e)=>{if(!(e!=null&&e.length)){i.removeAttribute(t);return}let n=_e(e);i.getAttribute(t)!==n&&i.setAttribute(t,n)};m.customElements.get("media-captions-menu-button")||m.customElements.define("media-captions-menu-button",In);var lo={RATES:"rates"},yt,oi,fs,yn,mo,Sn=class extends W{constructor(){super();u(this,oi);u(this,yn);u(this,yt,new Ie(this,lo.RATES,{defaultValue:zs}));E(this,oi,fs).call(this)}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PLAYBACK_RATE,lo.RATES]}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_PLAYBACK_RATE&&n!=r?this.value=r:e===lo.RATES&&n!=r&&(o(this,yt).value=r,E(this,oi,fs).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",E(this,yn,mo))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",E(this,yn,mo))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:K(this).querySelector("media-playback-rate-menu-button")}get rates(){return o(this,yt)}set rates(e){e?Array.isArray(e)&&(o(this,yt).value=e.join(" ")):o(this,yt).value="",E(this,oi,fs).call(this)}get mediaPlaybackRate(){return k(this,a.MEDIA_PLAYBACK_RATE,Kt)}set mediaPlaybackRate(e){C(this,a.MEDIA_PLAYBACK_RATE,e)}};yt=new WeakMap,oi=new WeakSet,fs=function(){this.defaultSlot.textContent="";for(let e of this.rates){let n=ye({type:"radio",text:this.formatMenuItemText(`${e}x`,e),value:e,checked:this.mediaPlaybackRate==e});n.prepend(be(this,"checked-indicator")),this.defaultSlot.append(n)}},yn=new WeakSet,mo=function(){if(!this.value)return;let e=new m.CustomEvent(g.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(e)};m.customElements.get("media-playback-rate-menu")||m.customElements.define("media-playback-rate-menu",Sn);var uo={RATES:"rates"},Ou=[1,1.2,1.5,1.7,2],co=1,Kd=b.createElement("template");Kd.innerHTML=`
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
`;var Mt,Mn=class extends J{constructor(e={}){super({slotTemplate:Kd,tooltipContent:y.PLAYBACK_RATE,...e});u(this,Mt,new Ie(this,uo.RATES,{defaultValue:Ou}));this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${co}x`}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_PLAYBACK_RATE,uo.RATES]}attributeChangedCallback(e,n,r){if(super.attributeChangedCallback(e,n,r),e===uo.RATES&&(o(this,Mt).value=r),e===a.MEDIA_PLAYBACK_RATE){let s=r?+r:Number.NaN,l=Number.isNaN(s)?co:s;this.container.innerHTML=`${l}x`,this.setAttribute("aria-label",B.PLAYBACK_RATE({playbackRate:l}))}}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:K(this).querySelector("media-playback-rate-menu")}get rates(){return o(this,Mt)}set rates(e){e?Array.isArray(e)&&(o(this,Mt).value=e.join(" ")):o(this,Mt).value=""}get mediaPlaybackRate(){return k(this,a.MEDIA_PLAYBACK_RATE,co)}set mediaPlaybackRate(e){C(this,a.MEDIA_PLAYBACK_RATE,e)}};Mt=new WeakMap;m.customElements.get("media-playback-rate-menu-button")||m.customElements.define("media-playback-rate-menu-button",Mn);var ai,Lt,li,vs,kn,ho,Ln=class extends W{constructor(){super(...arguments);u(this,li);u(this,kn);u(this,ai,[]);u(this,Lt,{})}static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_RENDITION_LIST,a.MEDIA_RENDITION_SELECTED,a.MEDIA_RENDITION_UNAVAILABLE,a.MEDIA_HEIGHT]}attributeChangedCallback(e,n,r){super.attributeChangedCallback(e,n,r),e===a.MEDIA_RENDITION_SELECTED&&n!==r?this.value=r!=null?r:"auto":e===a.MEDIA_RENDITION_LIST&&n!==r?(h(this,ai,ia(r)),E(this,li,vs).call(this)):e===a.MEDIA_HEIGHT&&n!==r&&E(this,li,vs).call(this)}connectedCallback(){super.connectedCallback(),this.addEventListener("change",E(this,kn,ho))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",E(this,kn,ho))}get anchorElement(){return this.anchor!=="auto"?super.anchorElement:K(this).querySelector("media-rendition-menu-button")}get mediaRenditionList(){return o(this,ai)}set mediaRenditionList(e){h(this,ai,e),E(this,li,vs).call(this)}get mediaRenditionSelected(){return _(this,a.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){M(this,a.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return k(this,a.MEDIA_HEIGHT)}set mediaHeight(e){C(this,a.MEDIA_HEIGHT,e)}};ai=new WeakMap,Lt=new WeakMap,li=new WeakSet,vs=function(){if(o(this,Lt).mediaRenditionList===JSON.stringify(this.mediaRenditionList)&&o(this,Lt).mediaHeight===this.mediaHeight)return;o(this,Lt).mediaRenditionList=JSON.stringify(this.mediaRenditionList),o(this,Lt).mediaHeight=this.mediaHeight;let e=this.mediaRenditionList.sort((l,d)=>d.height-l.height);for(let l of e)l.selected=l.id===this.mediaRenditionSelected;this.defaultSlot.textContent="";let n=!this.mediaRenditionSelected;for(let l of e){let d=this.formatMenuItemText(`${Math.min(l.width,l.height)}p`,l),c=ye({type:"radio",text:d,value:`${l.id}`,checked:l.selected&&!n});c.prepend(be(this,"checked-indicator")),this.defaultSlot.append(c)}let r=ye({type:"radio",text:this.formatMenuItemText("Auto"),value:"auto",checked:n}),s=this.mediaHeight>0?`Auto (${this.mediaHeight}p)`:"Auto";r.dataset.description=s,r.prepend(be(this,"checked-indicator")),this.defaultSlot.append(r)},kn=new WeakSet,ho=function(){if(this.value==null)return;let e=new m.CustomEvent(g.MEDIA_RENDITION_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(e)};m.customElements.get("media-rendition-menu")||m.customElements.define("media-rendition-menu",Ln);var Hu=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M13.5 2.5h2v6h-2v-2h-11v-2h11v-2Zm4 2h4v2h-4v-2Zm-12 4h2v6h-2v-2h-3v-2h3v-2Zm4 2h12v2h-12v-2Zm1 4h2v6h-2v-2h-8v-2h8v-2Zm4 2h7v2h-7v-2Z" />
</svg>`,Vd=b.createElement("template");Vd.innerHTML=`
  <style>
    :host([aria-expanded="true"]) slot[name=tooltip] {
      display: none;
    }
  </style>
  <slot name="icon">${Hu}</slot>
`;var _n=class extends J{static get observedAttributes(){return[...super.observedAttributes,a.MEDIA_RENDITION_SELECTED,a.MEDIA_RENDITION_UNAVAILABLE,a.MEDIA_HEIGHT]}constructor(){super({slotTemplate:Vd,tooltipContent:y.RENDITIONS})}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",B.QUALITY())}get invokeTargetElement(){return this.invokeTarget!=null?super.invokeTargetElement:K(this).querySelector("media-rendition-menu")}get mediaRenditionSelected(){return _(this,a.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(t){M(this,a.MEDIA_RENDITION_SELECTED,t)}get mediaHeight(){return k(this,a.MEDIA_HEIGHT)}set mediaHeight(t){C(this,a.MEDIA_HEIGHT,t)}};m.customElements.get("media-rendition-menu-button")||m.customElements.define("media-rendition-menu-button",_n);var Gd=1,Wd=0,Bu=1,Yd={processCallback(i,t,e){if(e){for(let[n,r]of t)if(n in e){let s=e[n];typeof s=="boolean"&&r instanceof fe&&typeof r.element[r.attributeName]=="boolean"?r.booleanValue=s:typeof s=="function"&&r instanceof fe?r.element[r.attributeName]=s:r.value=s}}}},kt,Cn,je=class extends m.DocumentFragment{constructor(e,n,r=Yd){var s;super();u(this,kt,void 0);u(this,Cn,void 0);this.append(e.content.cloneNode(!0)),h(this,kt,Eo(this)),h(this,Cn,r),(s=r.createCallback)==null||s.call(r,this,o(this,kt),n),r.processCallback(this,o(this,kt),n)}update(e){o(this,Cn).processCallback(this,o(this,kt),e)}};kt=new WeakMap,Cn=new WeakMap;var Eo=(i,t=[])=>{let e,n;for(let r of i.attributes||[])if(r.value.includes("{{")){let s=new Ts;for([e,n]of po(r.value))if(!e)s.append(n);else{let l=new fe(i,r.name,r.namespaceURI);s.append(l),t.push([n,l])}r.value=s.toString()}for(let r of i.childNodes)if(r.nodeType===Gd&&!(r instanceof HTMLTemplateElement))Eo(r,t);else{let s=r.data;if(r.nodeType===Gd||s.includes("{{")){let l=[];if(s)for([e,n]of po(s))if(!e)l.push(new Text(n));else{let d=new Rn(i);l.push(d),t.push([n,d])}else if(r instanceof HTMLTemplateElement){let d=new ui(i,r);l.push(d),t.push([d.expression,d])}r.replaceWith(...l.flatMap(d=>d.replacementNodes||[d]))}}return t},qd={},po=i=>{let t="",e=0,n=qd[i],r=0,s;if(n)return n;for(n=[];s=i[r];r++)s==="{"&&i[r+1]==="{"&&i[r-1]!=="\\"&&i[r+2]&&++e==1?(t&&n.push([Wd,t]),t="",r++):s==="}"&&i[r+1]==="}"&&i[r-1]!=="\\"&&!--e?(n.push([Bu,t.trim()]),t="",r++):t+=s||"";return t&&n.push([Wd,(e>0?"{{":"")+t]),qd[i]=n},Fu=11,xn=class{get value(){return""}set value(t){}toString(){return this.value}},Qd=new WeakMap,Ye,Ts=class{constructor(){u(this,Ye,[])}[Symbol.iterator](){return o(this,Ye).values()}get length(){return o(this,Ye).length}item(t){return o(this,Ye)[t]}append(...t){for(let e of t)e instanceof fe&&Qd.set(e,this),o(this,Ye).push(e)}toString(){return o(this,Ye).join("")}};Ye=new WeakMap;var mi,we,Pe,Ue,Qe,di,fe=class extends xn{constructor(e,n,r){super();u(this,Qe);u(this,mi,"");u(this,we,void 0);u(this,Pe,void 0);u(this,Ue,void 0);h(this,we,e),h(this,Pe,n),h(this,Ue,r)}get attributeName(){return o(this,Pe)}get attributeNamespace(){return o(this,Ue)}get element(){return o(this,we)}get value(){return o(this,mi)}set value(e){o(this,mi)!==e&&(h(this,mi,e),!o(this,Qe,di)||o(this,Qe,di).length===1?e==null?o(this,we).removeAttributeNS(o(this,Ue),o(this,Pe)):o(this,we).setAttributeNS(o(this,Ue),o(this,Pe),e):o(this,we).setAttributeNS(o(this,Ue),o(this,Pe),o(this,Qe,di).toString()))}get booleanValue(){return o(this,we).hasAttributeNS(o(this,Ue),o(this,Pe))}set booleanValue(e){if(!o(this,Qe,di)||o(this,Qe,di).length===1)this.value=e?"":null;else throw new DOMException("Value is not fully templatized")}};mi=new WeakMap,we=new WeakMap,Pe=new WeakMap,Ue=new WeakMap,Qe=new WeakSet,di=function(){return Qd.get(this)};var Dn,ne,Rn=class extends xn{constructor(e,n){super();u(this,Dn,void 0);u(this,ne,void 0);h(this,Dn,e),h(this,ne,n?[...n]:[new Text])}get replacementNodes(){return o(this,ne)}get parentNode(){return o(this,Dn)}get nextSibling(){return o(this,ne)[o(this,ne).length-1].nextSibling}get previousSibling(){return o(this,ne)[0].previousSibling}get value(){return o(this,ne).map(e=>e.textContent).join("")}set value(e){this.replace(e)}replace(...e){let n=e.flat().flatMap(r=>r==null?[new Text]:r.forEach?[...r]:r.nodeType===Fu?[...r.childNodes]:r.nodeType?[r]:[new Text(r)]);n.length||n.push(new Text),h(this,ne,$u(o(this,ne)[0].parentNode,o(this,ne),n,this.nextSibling))}};Dn=new WeakMap,ne=new WeakMap;var ui=class extends Rn{constructor(t,e){let n=e.getAttribute("directive")||e.getAttribute("type"),r=e.getAttribute("expression")||e.getAttribute(n)||"";r.startsWith("{{")&&(r=r.trim().slice(2,-2).trim()),super(t),this.expression=r,this.template=e,this.directive=n}};function $u(i,t,e,n=null){let r=0,s,l,d,c=e.length,p=t.length;for(;r<c&&r<p&&t[r]==e[r];)r++;for(;r<c&&r<p&&e[c-1]==t[p-1];)n=e[--p,--c];if(r==p)for(;r<c;)i.insertBefore(e[r++],n);if(r==c)for(;r<p;)i.removeChild(t[r++]);else{for(s=t[r];r<c;)d=e[r++],l=s?s.nextSibling:n,s==d?s=l:r<c&&e[r]==l?(i.replaceChild(d,s),s=l):i.insertBefore(d,s);for(;s!=n;)l=s.nextSibling,i.removeChild(s),s=l}return e}var bo={string:i=>String(i)},Ss=class{constructor(t){this.template=t,this.state=void 0}},_t=new WeakMap,xt=new WeakMap,Is={partial:(i,t)=>{t[i.expression]=new Ss(i.template)},if:(i,t)=>{var e;if(zd(i.expression,t))if(_t.get(i)!==i.template){_t.set(i,i.template);let n=new je(i.template,t,ys);i.replace(n),xt.set(i,n)}else(e=xt.get(i))==null||e.update(t);else i.replace(""),_t.delete(i),xt.delete(i)}},Ku=Object.keys(Is),ys={processCallback(i,t,e){var n,r;if(e)for(let[s,l]of t){if(l instanceof ui){if(!l.directive){let c=Ku.find(p=>l.template.hasAttribute(p));c&&(l.directive=c,l.expression=l.template.getAttribute(c))}(n=Is[l.directive])==null||n.call(Is,l,e);continue}let d=zd(s,e);if(d instanceof Ss){_t.get(l)!==d.template?(_t.set(l,d.template),d=new je(d.template,d.state,ys),l.value=d,xt.set(l,d)):(r=xt.get(l))==null||r.update(d.state);continue}d?(l instanceof fe&&l.attributeName.startsWith("aria-")&&(d=String(d)),l instanceof fe?typeof d=="boolean"?l.booleanValue=d:typeof d=="function"?l.element[l.attributeName]=d:l.value=d:(l.value=d,_t.delete(l),xt.delete(l))):l instanceof fe?l.value=void 0:(l.value=void 0,_t.delete(l),xt.delete(l))}}},jd={"!":i=>!i,"!!":i=>!!i,"==":(i,t)=>i==t,"!=":(i,t)=>i!=t,">":(i,t)=>i>t,">=":(i,t)=>i>=t,"<":(i,t)=>i<t,"<=":(i,t)=>i<=t,"??":(i,t)=>i!=null?i:t,"|":(i,t)=>{var e;return(e=bo[t])==null?void 0:e.call(bo,i)}};function Vu(i){return Gu(i,{boolean:/true|false/,number:/-?\d+\.?\d*/,string:/(["'])((?:\\.|[^\\])*?)\1/,operator:/[!=><][=!]?|\?\?|\|/,ws:/\s+/,param:/[$a-z_][$\w]*/i}).filter(({type:t})=>t!=="ws")}function zd(i,t={}){var n,r,s,l,d,c,p;let e=Vu(i);if(e.length===0||e.some(({type:f})=>!f))return wn(i);if(((n=e[0])==null?void 0:n.token)===">"){let f=t[(r=e[1])==null?void 0:r.token];if(!f)return wn(i);let A={...t};f.state=A;let T=e.slice(2);for(let v=0;v<T.length;v+=3){let x=(s=T[v])==null?void 0:s.token,S=(l=T[v+1])==null?void 0:l.token,L=(d=T[v+2])==null?void 0:d.token;x&&S==="="&&(A[x]=Pn(L,t))}return f}if(e.length===1)return As(e[0])?Pn(e[0].token,t):wn(i);if(e.length===2){let f=(c=e[0])==null?void 0:c.token,A=jd[f];if(!A||!As(e[1]))return wn(i);let T=Pn(e[1].token,t);return A(T)}if(e.length===3){let f=(p=e[1])==null?void 0:p.token,A=jd[f];if(!A||!As(e[0])||!As(e[2]))return wn(i);let T=Pn(e[0].token,t);if(f==="|")return A(T,e[2].token);let v=Pn(e[2].token,t);return A(T,v)}}function wn(i){return console.warn(`Warning: invalid expression \`${i}\``),!1}function As({type:i}){return["number","boolean","string","param"].includes(i)}function Pn(i,t){let e=i[0],n=i.slice(-1);return i==="true"||i==="false"?i==="true":e===n&&["'",'"'].includes(e)?i.slice(1,-1):Fn(i)?parseFloat(i):t[i]}function Gu(i,t){let e,n,r,s=[];for(;i;){r=null,e=i.length;for(let l in t)n=t[l].exec(i),n&&n.index<e&&(r={token:n[0],type:l,matches:n.slice(1)},e=n.index);e&&s.push({token:i.substr(0,e),type:void 0}),r&&s.push(r),i=i.substr(e+(r?r.token.length:0))}return s}var go={mediatargetlivewindow:"targetlivewindow",mediastreamtype:"streamtype"},Zd=b.createElement("template");Zd.innerHTML=`
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
`;var Rt,Un,Ct,Ms,Xd,Nn,fo,ci=class extends m.HTMLElement{constructor(){super();u(this,Ms);u(this,Nn);u(this,Rt,void 0);u(this,Un,void 0);u(this,Ct,void 0);this.shadowRoot?this.renderRoot=this.shadowRoot:(this.renderRoot=this.attachShadow({mode:"open"}),this.createRenderer());let e=new MutationObserver(n=>{var r;this.mediaController&&!((r=this.mediaController)!=null&&r.breakpointsComputed)||n.some(s=>{let l=s.target;return l===this?!0:l.localName!=="media-controller"?!1:!!(go[s.attributeName]||s.attributeName.startsWith("breakpoint"))})&&this.render()});e.observe(this,{attributes:!0}),e.observe(this.renderRoot,{attributes:!0,subtree:!0}),this.addEventListener(ve.BREAKPOINTS_COMPUTED,this.render),E(this,Ms,Xd).call(this,"template")}get mediaController(){return this.renderRoot.querySelector("media-controller")}get template(){var e;return(e=o(this,Rt))!=null?e:this.constructor.template}set template(e){h(this,Ct,null),h(this,Rt,e),this.createRenderer()}get props(){var r,s,l;let e=[...Array.from((s=(r=this.mediaController)==null?void 0:r.attributes)!=null?s:[]).filter(({name:d})=>go[d]||d.startsWith("breakpoint")),...Array.from(this.attributes)],n={};for(let d of e){let c=(l=go[d.name])!=null?l:sa(d.name),{value:p}=d;p!=null?(Fn(p)&&(p=parseFloat(p)),n[c]=p===""?!0:p):n[c]=!1}return n}attributeChangedCallback(e,n,r){e==="template"&&n!=r&&E(this,Nn,fo).call(this)}connectedCallback(){E(this,Nn,fo).call(this)}createRenderer(){this.template&&this.template!==o(this,Un)&&(h(this,Un,this.template),this.renderer=new je(this.template,this.props,this.constructor.processor),this.renderRoot.textContent="",this.renderRoot.append(Zd.content.cloneNode(!0),this.renderer))}render(){var e;if((e=this.renderer)==null||e.update(this.props),this.renderRoot.isConnected){let{style:n}=N(this.renderRoot,":host");n.visibility==="hidden"&&n.removeProperty("visibility")}}};Rt=new WeakMap,Un=new WeakMap,Ct=new WeakMap,Ms=new WeakSet,Xd=function(e){if(Object.prototype.hasOwnProperty.call(this,e)){let n=this[e];delete this[e],this[e]=n}},Nn=new WeakSet,fo=function(){var s;let e=this.getAttribute("template");if(!e||e===o(this,Ct))return;let n=this.getRootNode(),r=(s=n==null?void 0:n.getElementById)==null?void 0:s.call(n,e);if(r){h(this,Ct,e),h(this,Rt,r),this.createRenderer();return}Wu(e)&&(h(this,Ct,e),qu(e).then(l=>{let d=b.createElement("template");d.innerHTML=l,h(this,Rt,d),this.createRenderer()}).catch(console.error))},ci.observedAttributes=["template"],ci.processor=ys;function Wu(i){if(!/^(\/|\.\/|https?:\/\/)/.test(i))return!1;let t=/^https?:\/\//.test(i)?void 0:location.origin;try{new URL(i,t)}catch{return!1}return!0}async function qu(i){let t=await fetch(i);if(t.status!==200)throw new Error(`Failed to load resource: the server responded with a status of ${t.status}`);return t.text()}m.customElements.get("media-theme")||m.customElements.define("media-theme",ci);return mm(Yu);})();
//# sourceMappingURL=all.js.map
