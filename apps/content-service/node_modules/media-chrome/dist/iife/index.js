var MediaChrome=(()=>{var ur=Object.defineProperty;var $o=Object.getOwnPropertyDescriptor;var Vo=Object.getOwnPropertyNames;var Ko=Object.prototype.hasOwnProperty;var pr=(i,t)=>{for(var e in t)ur(i,e,{get:t[e],enumerable:!0})},Go=(i,t,e,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of Vo(t))!Ko.call(i,n)&&n!==e&&ur(i,n,{get:()=>t[n],enumerable:!(r=$o(t,n))||r.enumerable});return i};var Wo=i=>Go(ur({},"__esModule",{value:!0}),i);var hr=(i,t,e)=>{if(!t.has(i))throw TypeError("Cannot "+e)};var s=(i,t,e)=>(hr(i,t,"read from private field"),e?e.call(i):t.get(i)),u=(i,t,e)=>{if(t.has(i))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(i):t.set(i,e)},p=(i,t,e,r)=>(hr(i,t,"write to private field"),r?r.call(i,e):t.set(i,e),e);var An=(i,t,e,r)=>({set _(n){p(i,t,n,e)},get _(){return s(i,t,r)}}),v=(i,t,e)=>(hr(i,t,"access private method"),e);var ul={};pr(ul,{MediaAirplayButton:()=>ha,MediaCaptionsButton:()=>va,MediaCastButton:()=>Ia,MediaChromeButton:()=>ma,MediaChromeDialog:()=>ka,MediaChromeRange:()=>Na,MediaControlBar:()=>Ha,MediaController:()=>sa,MediaDurationDisplay:()=>Ba,MediaFullscreenButton:()=>Ka,MediaGestureReceiver:()=>Nn,MediaLiveButton:()=>qa,MediaLoadingIndicator:()=>za,MediaMuteButton:()=>eo,MediaPipButton:()=>no,MediaPlayButton:()=>mo,MediaPlaybackRateButton:()=>oo,MediaPosterImage:()=>uo,MediaPreviewChapterDisplay:()=>po,MediaPreviewThumbnail:()=>Eo,MediaPreviewTimeDisplay:()=>bo,MediaSeekBackwardButton:()=>fo,MediaSeekForwardButton:()=>Ao,MediaTimeDisplay:()=>yo,MediaTimeRange:()=>Co,MediaTooltip:()=>Do,MediaVolumeRange:()=>wo,constants:()=>ii,labels:()=>In,timeUtils:()=>ni});var ii={};pr(ii,{AttributeToStateChangeEventMap:()=>Er,AvailabilityStates:()=>Y,MediaStateChangeEvents:()=>ge,MediaStateReceiverAttributes:()=>S,MediaUIAttributes:()=>o,MediaUIEvents:()=>E,MediaUIProps:()=>ei,PointerTypes:()=>ti,ReadyStates:()=>Qo,StateChangeEventToAttributeMap:()=>Yo,StreamTypes:()=>z,TextTrackKinds:()=>W,TextTrackModes:()=>pe,VolumeLevels:()=>jo,WebkitPresentationModes:()=>br});var E={MEDIA_PLAY_REQUEST:"mediaplayrequest",MEDIA_PAUSE_REQUEST:"mediapauserequest",MEDIA_MUTE_REQUEST:"mediamuterequest",MEDIA_UNMUTE_REQUEST:"mediaunmuterequest",MEDIA_VOLUME_REQUEST:"mediavolumerequest",MEDIA_SEEK_REQUEST:"mediaseekrequest",MEDIA_AIRPLAY_REQUEST:"mediaairplayrequest",MEDIA_ENTER_FULLSCREEN_REQUEST:"mediaenterfullscreenrequest",MEDIA_EXIT_FULLSCREEN_REQUEST:"mediaexitfullscreenrequest",MEDIA_PREVIEW_REQUEST:"mediapreviewrequest",MEDIA_ENTER_PIP_REQUEST:"mediaenterpiprequest",MEDIA_EXIT_PIP_REQUEST:"mediaexitpiprequest",MEDIA_ENTER_CAST_REQUEST:"mediaentercastrequest",MEDIA_EXIT_CAST_REQUEST:"mediaexitcastrequest",MEDIA_SHOW_TEXT_TRACKS_REQUEST:"mediashowtexttracksrequest",MEDIA_HIDE_TEXT_TRACKS_REQUEST:"mediahidetexttracksrequest",MEDIA_SHOW_SUBTITLES_REQUEST:"mediashowsubtitlesrequest",MEDIA_DISABLE_SUBTITLES_REQUEST:"mediadisablesubtitlesrequest",MEDIA_TOGGLE_SUBTITLES_REQUEST:"mediatogglesubtitlesrequest",MEDIA_PLAYBACK_RATE_REQUEST:"mediaplaybackraterequest",MEDIA_RENDITION_REQUEST:"mediarenditionrequest",MEDIA_AUDIO_TRACK_REQUEST:"mediaaudiotrackrequest",MEDIA_SEEK_TO_LIVE_REQUEST:"mediaseektoliverequest",REGISTER_MEDIA_STATE_RECEIVER:"registermediastatereceiver",UNREGISTER_MEDIA_STATE_RECEIVER:"unregistermediastatereceiver"},S={MEDIA_CHROME_ATTRIBUTES:"mediachromeattributes",MEDIA_CONTROLLER:"mediacontroller"},ei={MEDIA_AIRPLAY_UNAVAILABLE:"mediaAirplayUnavailable",MEDIA_FULLSCREEN_UNAVAILABLE:"mediaFullscreenUnavailable",MEDIA_PIP_UNAVAILABLE:"mediaPipUnavailable",MEDIA_CAST_UNAVAILABLE:"mediaCastUnavailable",MEDIA_RENDITION_UNAVAILABLE:"mediaRenditionUnavailable",MEDIA_AUDIO_TRACK_UNAVAILABLE:"mediaAudioTrackUnavailable",MEDIA_WIDTH:"mediaWidth",MEDIA_HEIGHT:"mediaHeight",MEDIA_PAUSED:"mediaPaused",MEDIA_HAS_PLAYED:"mediaHasPlayed",MEDIA_ENDED:"mediaEnded",MEDIA_MUTED:"mediaMuted",MEDIA_VOLUME_LEVEL:"mediaVolumeLevel",MEDIA_VOLUME:"mediaVolume",MEDIA_VOLUME_UNAVAILABLE:"mediaVolumeUnavailable",MEDIA_IS_PIP:"mediaIsPip",MEDIA_IS_CASTING:"mediaIsCasting",MEDIA_IS_AIRPLAYING:"mediaIsAirplaying",MEDIA_SUBTITLES_LIST:"mediaSubtitlesList",MEDIA_SUBTITLES_SHOWING:"mediaSubtitlesShowing",MEDIA_IS_FULLSCREEN:"mediaIsFullscreen",MEDIA_PLAYBACK_RATE:"mediaPlaybackRate",MEDIA_CURRENT_TIME:"mediaCurrentTime",MEDIA_DURATION:"mediaDuration",MEDIA_SEEKABLE:"mediaSeekable",MEDIA_PREVIEW_TIME:"mediaPreviewTime",MEDIA_PREVIEW_IMAGE:"mediaPreviewImage",MEDIA_PREVIEW_COORDS:"mediaPreviewCoords",MEDIA_PREVIEW_CHAPTER:"mediaPreviewChapter",MEDIA_LOADING:"mediaLoading",MEDIA_BUFFERED:"mediaBuffered",MEDIA_STREAM_TYPE:"mediaStreamType",MEDIA_TARGET_LIVE_WINDOW:"mediaTargetLiveWindow",MEDIA_TIME_IS_LIVE:"mediaTimeIsLive",MEDIA_RENDITION_LIST:"mediaRenditionList",MEDIA_RENDITION_SELECTED:"mediaRenditionSelected",MEDIA_AUDIO_TRACK_LIST:"mediaAudioTrackList",MEDIA_AUDIO_TRACK_ENABLED:"mediaAudioTrackEnabled",MEDIA_CHAPTERS_CUES:"mediaChaptersCues"},Tn=Object.entries(ei),o=Tn.reduce((i,[t,e])=>(i[t]=e.toLowerCase(),i),{}),qo={USER_INACTIVE:"userinactivechange",BREAKPOINTS_CHANGE:"breakpointchange",BREAKPOINTS_COMPUTED:"breakpointscomputed"},ge=Tn.reduce((i,[t,e])=>(i[t]=e.toLowerCase(),i),{...qo}),Yo=Object.entries(ge).reduce((i,[t,e])=>{let r=o[t];return r&&(i[e]=r),i},{userinactivechange:"userinactive"}),Er=Object.entries(o).reduce((i,[t,e])=>{let r=ge[t];return r&&(i[e]=r),i},{userinactive:"userinactivechange"}),W={SUBTITLES:"subtitles",CAPTIONS:"captions",DESCRIPTIONS:"descriptions",CHAPTERS:"chapters",METADATA:"metadata"},pe={DISABLED:"disabled",HIDDEN:"hidden",SHOWING:"showing"},Qo={HAVE_NOTHING:0,HAVE_METADATA:1,HAVE_CURRENT_DATA:2,HAVE_FUTURE_DATA:3,HAVE_ENOUGH_DATA:4},ti={MOUSE:"mouse",PEN:"pen",TOUCH:"touch"},Y={UNAVAILABLE:"unavailable",UNSUPPORTED:"unsupported"},z={LIVE:"live",ON_DEMAND:"on-demand",UNKNOWN:"unknown"},jo={HIGH:"high",MEDIUM:"medium",LOW:"low",OFF:"off"},br={INLINE:"inline",FULLSCREEN:"fullscreen",PICTURE_IN_PICTURE:"picture-in-picture"};var w={ENTER_AIRPLAY:"Start airplay",EXIT_AIRPLAY:"Stop airplay",AUDIO_TRACK_MENU:"Audio",CAPTIONS:"Captions",ENABLE_CAPTIONS:"Enable captions",DISABLE_CAPTIONS:"Disable captions",START_CAST:"Start casting",STOP_CAST:"Stop casting",ENTER_FULLSCREEN:"Enter fullscreen mode",EXIT_FULLSCREEN:"Exit fullscreen mode",MUTE:"Mute",UNMUTE:"Unmute",ENTER_PIP:"Enter picture in picture mode",EXIT_PIP:"Enter picture in picture mode",PLAY:"Play",PAUSE:"Pause",PLAYBACK_RATE:"Playback rate",RENDITIONS:"Quality",SEEK_BACKWARD:"Seek backward",SEEK_FORWARD:"Seek forward",SETTINGS:"Settings"},G={AUDIO_PLAYER:()=>"audio player",VIDEO_PLAYER:()=>"video player",VOLUME:()=>"volume",SEEK:()=>"seek",CLOSED_CAPTIONS:()=>"closed captions",PLAYBACK_RATE:({playbackRate:i=1}={})=>`current playback rate ${i}`,PLAYBACK_TIME:()=>"playback time",MEDIA_LOADING:()=>"media loading",SETTINGS:()=>"settings",AUDIO_TRACKS:()=>"audio tracks",QUALITY:()=>"quality"},N={PLAY:()=>"play",PAUSE:()=>"pause",MUTE:()=>"mute",UNMUTE:()=>"unmute",ENTER_AIRPLAY:()=>"start airplay",EXIT_AIRPLAY:()=>"stop airplay",ENTER_CAST:()=>"start casting",EXIT_CAST:()=>"stop casting",ENTER_FULLSCREEN:()=>"enter fullscreen mode",EXIT_FULLSCREEN:()=>"exit fullscreen mode",ENTER_PIP:()=>"enter picture in picture mode",EXIT_PIP:()=>"exit picture in picture mode",SEEK_FORWARD_N_SECS:({seekOffset:i=30}={})=>`seek forward ${i} seconds`,SEEK_BACK_N_SECS:({seekOffset:i=30}={})=>`seek back ${i} seconds`,SEEK_LIVE:()=>"seek to live",PLAYING_LIVE:()=>"playing live"},In={...G,...N};var ni={};pr(ni,{emptyTimeRanges:()=>_n,formatAsTimePhrase:()=>fe,formatTime:()=>J,serializeTimeRanges:()=>Jo});function Sn(i){return i==null?void 0:i.map(zo).join(" ")}function zo(i){if(i){let{id:t,width:e,height:r}=i;return[t,e,r].filter(n=>n!=null).join(":")}}function yn(i){return i==null?void 0:i.map(Xo).join(" ")}function Xo(i){if(i){let{id:t,kind:e,language:r,label:n}=i;return[t,e,r,n].filter(a=>a!=null).join(":")}}function Qe(i){return typeof i=="number"&&!Number.isNaN(i)&&Number.isFinite(i)}var ri=i=>new Promise(t=>setTimeout(t,i));var Mn=[{singular:"hour",plural:"hours"},{singular:"minute",plural:"minutes"},{singular:"second",plural:"seconds"}],Zo=(i,t)=>{let e=i===1?Mn[t].singular:Mn[t].plural;return`${i} ${e}`},fe=i=>{if(!Qe(i))return"";let t=Math.abs(i),e=t!==i,r=new Date(0,0,0,0,0,t,0);return`${[r.getHours(),r.getMinutes(),r.getSeconds()].map((m,c)=>m&&Zo(m,c)).filter(m=>m).join(", ")}${e?" remaining":""}`};function J(i,t){let e=!1;i<0&&(e=!0,i=0-i),i=i<0?0:i;let r=Math.floor(i%60),n=Math.floor(i/60%60),a=Math.floor(i/3600),l=Math.floor(t/60%60),m=Math.floor(t/3600);return(isNaN(i)||i===1/0)&&(a=n=r="0"),a=a>0||m>0?a+":":"",n=((a||l>=10)&&n<10?"0"+n:n)+":",r=r<10?"0"+r:r,(e?"-":"")+a+n+r}var _n=Object.freeze({length:0,start(i){let t=i>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(i){let t=i>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0}});function Jo(i=_n){return Array.from(i).map((t,e)=>[Number(i.start(e).toFixed(3)),Number(i.end(e).toFixed(3))].join(":")).join(" ")}var ai=class{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}},oi=class extends ai{},si=class extends oi{constructor(){super(...arguments);this.role=null}},gr=class{observe(){}unobserve(){}disconnect(){}},Ln={createElement:function(){return new ht.HTMLElement},createElementNS:function(){return new ht.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent(i){return!1}},ht={ResizeObserver:gr,document:Ln,Node:oi,Element:si,HTMLElement:class extends si{constructor(){super(...arguments);this.innerHTML=""}get content(){return new ht.DocumentFragment}},DocumentFragment:class extends ai{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem(i){return null},setItem(i,t){},removeItem(i){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return""}},matchMedia(i){return{matches:!1,media:i}}},Rn=typeof window=="undefined"||typeof window.customElements=="undefined",kn=Object.keys(ht).every(i=>i in globalThis),d=Rn&&!kn?ht:globalThis,b=Rn&&!kn?Ln:globalThis.document;var Cn=new WeakMap,fr=i=>{let t=Cn.get(i);return t||Cn.set(i,t=new Set),t},xn=new d.ResizeObserver(i=>{for(let t of i)for(let e of fr(t.target))e(t)});function li(i,t){fr(i).add(t),xn.observe(i)}function Dn(i,t){let e=fr(i);e.delete(t),e.size||xn.unobserve(i)}function wn(i){var t;return(t=es(i))!=null?t:ve(i,"media-controller")}function es(i){var r;let{MEDIA_CONTROLLER:t}=S,e=i.getAttribute(t);if(e)return(r=is(i))==null?void 0:r.getElementById(e)}var di=(i,t,e=".value")=>{let r=i.querySelector(e);r&&(r.textContent=t)},ts=(i,t)=>{let e=`slot[name="${t}"]`,r=i.shadowRoot.querySelector(e);return r?r.children:[]},mi=(i,t)=>ts(i,t)[0],de=(i,t)=>!i||!t?!1:i!=null&&i.contains(t)?!0:de(i,t.getRootNode().host),ve=(i,t)=>{if(!i)return null;let e=i.closest(t);return e||ve(i.getRootNode().host,t)};function Ar(i=document){var e;let t=i==null?void 0:i.activeElement;return t?(e=Ar(t.shadowRoot))!=null?e:t:null}function is(i){var e;let t=(e=i==null?void 0:i.getRootNode)==null?void 0:e.call(i);return t instanceof ShadowRoot||t instanceof Document?t:null}function ci(i,{depth:t=3,checkOpacity:e=!0,checkVisibilityCSS:r=!0}={}){if(i.checkVisibility)return i.checkVisibility({checkOpacity:e,checkVisibilityCSS:r});let n=i;for(;n&&t>0;){let a=getComputedStyle(n);if(e&&a.opacity==="0"||r&&a.visibility==="hidden"||a.display==="none")return!1;n=n.parentElement,t--}return!0}function Pn(i,t,e,r){let n=vr(e,r),a=vr(e,{x:i,y:t}),l=vr(r,{x:i,y:t});return a>n||l>n?a>l?1:0:a/n}function vr(i,t){return Math.sqrt(Math.pow(t.x-i.x,2)+Math.pow(t.y-i.y,2))}function O(i,t){let e=rs(i,r=>r===t);return e||ns(i,t)}function rs(i,t){var r,n;let e;for(e of(r=i.querySelectorAll("style:not([media])"))!=null?r:[]){let a;try{a=(n=e.sheet)==null?void 0:n.cssRules}catch{continue}for(let l of a!=null?a:[])if(t(l.selectorText))return l}}function ns(i,t){var n,a;let e=(n=i.querySelectorAll("style:not([media])"))!=null?n:[],r=e==null?void 0:e[e.length-1];return r!=null&&r.sheet?(r==null||r.sheet.insertRule(`${t}{}`,r.sheet.cssRules.length),(a=r.sheet.cssRules)==null?void 0:a[r.sheet.cssRules.length-1]):(console.warn("Media Chrome: No style sheet found on style tag of",i),{style:{setProperty:()=>{},removeProperty:()=>"",getPropertyValue:()=>""}})}function P(i,t,e=Number.NaN){let r=i.getAttribute(t);return r!=null?+r:e}function B(i,t,e){let r=+e;if(e==null||Number.isNaN(r)){i.hasAttribute(t)&&i.removeAttribute(t);return}P(i,t,void 0)!==r&&i.setAttribute(t,`${r}`)}function C(i,t){return i.hasAttribute(t)}function k(i,t,e){if(e==null){i.hasAttribute(t)&&i.removeAttribute(t);return}C(i,t)!=e&&i.toggleAttribute(t,e)}function U(i,t,e=null){var r;return(r=i.getAttribute(t))!=null?r:e}function x(i,t,e){if(e==null){i.hasAttribute(t)&&i.removeAttribute(t);return}let r=`${e}`;U(i,t,void 0)!==r&&i.setAttribute(t,r)}var Un=b.createElement("template");Un.innerHTML=`
<style>
  :host {
    display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
    box-sizing: border-box;
  }
</style>
`;var q,ui=class extends d.HTMLElement{constructor(e={}){super();u(this,q,void 0);if(!this.shadowRoot){let r=this.attachShadow({mode:"open"}),n=Un.content.cloneNode(!0);this.nativeEl=n;let a=e.slotTemplate;a||(a=b.createElement("template"),a.innerHTML=`<slot>${e.defaultContent||""}</slot>`),this.nativeEl.appendChild(a.content.cloneNode(!0)),r.appendChild(n)}}static get observedAttributes(){return[S.MEDIA_CONTROLLER,o.MEDIA_PAUSED]}attributeChangedCallback(e,r,n){var a,l,m,c,h;e===S.MEDIA_CONTROLLER&&(r&&((l=(a=s(this,q))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,q,null)),n&&this.isConnected&&(p(this,q,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,q))==null?void 0:c.associateElement)==null||h.call(c,this)))}connectedCallback(){var e,r,n,a;this.tabIndex=-1,this.setAttribute("aria-hidden","true"),p(this,q,as(this)),this.getAttribute(S.MEDIA_CONTROLLER)&&((r=(e=s(this,q))==null?void 0:e.associateElement)==null||r.call(e,this)),(n=s(this,q))==null||n.addEventListener("pointerdown",this),(a=s(this,q))==null||a.addEventListener("click",this)}disconnectedCallback(){var e,r,n,a;this.getAttribute(S.MEDIA_CONTROLLER)&&((r=(e=s(this,q))==null?void 0:e.unassociateElement)==null||r.call(e,this)),(n=s(this,q))==null||n.removeEventListener("pointerdown",this),(a=s(this,q))==null||a.removeEventListener("click",this),p(this,q,null)}handleEvent(e){var a;let r=(a=e.composedPath())==null?void 0:a[0];if(["video","media-controller"].includes(r==null?void 0:r.localName)){if(e.type==="pointerdown")this._pointerType=e.pointerType;else if(e.type==="click"){let{clientX:l,clientY:m}=e,{left:c,top:h,width:A,height:T}=this.getBoundingClientRect(),f=l-c,g=m-h;if(f<0||g<0||f>A||g>T||A===0&&T===0)return;let{pointerType:_=this._pointerType}=e;if(this._pointerType=void 0,_===ti.TOUCH){this.handleTap(e);return}else if(_===ti.MOUSE){this.handleMouseClick(e);return}}}}get mediaPaused(){return C(this,o.MEDIA_PAUSED)}set mediaPaused(e){k(this,o.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){let r=this.mediaPaused?E.MEDIA_PLAY_REQUEST:E.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new d.CustomEvent(r,{composed:!0,bubbles:!0}))}};q=new WeakMap;function as(i){var e;let t=i.getAttribute(S.MEDIA_CONTROLLER);return t?(e=i.getRootNode())==null?void 0:e.getElementById(t):ve(i,"media-controller")}d.customElements.get("media-gesture-receiver")||d.customElements.define("media-gesture-receiver",ui);var Nn=ui;var R={AUDIO:"audio",AUTOHIDE:"autohide",BREAKPOINTS:"breakpoints",GESTURES_DISABLED:"gesturesdisabled",KEYBOARD_CONTROL:"keyboardcontrol",NO_AUTOHIDE:"noautohide",USER_INACTIVE:"userinactive"},On=b.createElement("template");On.innerHTML=`
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

    :host(:not([${R.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
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

    
    :host([${R.AUDIO}]) slot[name=media] {
      display: var(--media-slot-display, none);
    }

    
    :host([${R.AUDIO}]) [part~=layer][part~=gesture-layer] {
      height: 0;
      display: block;
    }

    
    :host(:not([${R.AUDIO}])[${R.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
    :host(:not([${R.AUDIO}])[${R.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
      display: none;
    }

    
    ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([hidden])) {
      pointer-events: auto;
    }

    :host(:not([${R.AUDIO}])) *[part~=layer][part~=centered-layer] {
      align-items: center;
      justify-content: center;
    }

    :host(:not([${R.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
    :host(:not([${R.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
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

    
    :host(:not([${R.AUDIO}])) .spacer {
      flex-grow: 1;
    }

    
    :host(:-webkit-full-screen) {
      
      width: 100% !important;
      height: 100% !important;
    }

    
    ::slotted(:not([slot=media]):not([slot=poster]):not([${R.NO_AUTOHIDE}]):not([hidden])) {
      opacity: 1;
      transition: opacity 0.25s;
    }

    
    :host([${R.USER_INACTIVE}]:not([${o.MEDIA_PAUSED}]):not([${o.MEDIA_IS_AIRPLAYING}]):not([${o.MEDIA_IS_CASTING}]):not([${R.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${R.NO_AUTOHIDE}])) {
      opacity: 0;
      transition: opacity 1s;
    }

    :host([${R.USER_INACTIVE}]:not([${o.MEDIA_PAUSED}]):not([${o.MEDIA_IS_CASTING}]):not([${R.AUDIO}])) ::slotted([slot=media]) {
      cursor: none;
    }

    ::slotted(media-control-bar)  {
      align-self: stretch;
    }

    
    :host(:not([${R.AUDIO}])[${o.MEDIA_HAS_PLAYED}]) slot[name=poster] {
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
`;var os=Object.values(o),ss="sm:384 md:576 lg:768 xl:960";function ls(i){ds(i.target,i.contentRect.width)}function ds(i,t){var l;if(!i.isConnected)return;let e=(l=i.getAttribute(R.BREAKPOINTS))!=null?l:ss,r=ms(e),n=cs(r,t),a=!1;if(Object.keys(r).forEach(m=>{if(n.includes(m)){i.hasAttribute(`breakpoint${m}`)||(i.setAttribute(`breakpoint${m}`,""),a=!0);return}i.hasAttribute(`breakpoint${m}`)&&(i.removeAttribute(`breakpoint${m}`),a=!0)}),a){let m=new CustomEvent(ge.BREAKPOINTS_CHANGE,{detail:n});i.dispatchEvent(m)}}function ms(i){let t=i.split(/\s+/);return Object.fromEntries(t.map(e=>e.split(":")))}function cs(i,t){return Object.keys(i).filter(e=>t>=parseInt(i[e]))}var gt,_e,je,Le,hi,Hn,Ei,Fn,ze,pi,ft,Tr,Re,Et,bt=class extends d.HTMLElement{constructor(){super();u(this,hi);u(this,Ei);u(this,ze);u(this,ft);u(this,Re);u(this,gt,0);u(this,_e,null);u(this,je,null);u(this,Le,void 0);this.breakpointsComputed=!1;this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(On.content.cloneNode(!0)));let e=m=>{let c=this.media;for(let h of m)h.type==="childList"&&(h.removedNodes.forEach(A=>{if(A.slot=="media"&&h.target==this){let T=h.previousSibling&&h.previousSibling.previousElementSibling;if(!T||!c)this.mediaUnsetCallback(A);else{let f=T.slot!=="media";for(;(T=T.previousSibling)!==null;)T.slot=="media"&&(f=!1);f&&this.mediaUnsetCallback(A)}}}),c&&h.addedNodes.forEach(A=>{A===c&&this.handleMediaUpdated(c)}))};new MutationObserver(e).observe(this,{childList:!0,subtree:!0});let n=!1;li(this,m=>{n||(setTimeout(()=>{ls(m),n=!1,this.breakpointsComputed||(this.breakpointsComputed=!0,this.dispatchEvent(new CustomEvent(ge.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))},0),n=!0)});let l=this.querySelector(":scope > slot[slot=media]");l&&l.addEventListener("slotchange",()=>{if(!l.assignedElements({flatten:!0}).length){s(this,_e)&&this.mediaUnsetCallback(s(this,_e));return}this.handleMediaUpdated(this.media)})}static get observedAttributes(){return[R.AUTOHIDE,R.GESTURES_DISABLED].concat(os).filter(e=>![o.MEDIA_RENDITION_LIST,o.MEDIA_AUDIO_TRACK_LIST,o.MEDIA_CHAPTERS_CUES,o.MEDIA_WIDTH,o.MEDIA_HEIGHT].includes(e))}attributeChangedCallback(e,r,n){e.toLowerCase()==R.AUTOHIDE&&(this.autohide=n)}get media(){let e=this.querySelector(":scope > [slot=media]");return(e==null?void 0:e.nodeName)=="SLOT"&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(p(this,_e,e),e.localName.includes("-")&&await d.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var n;let r=this.getAttribute(R.AUDIO)!=null?G.AUDIO_PLAYER():G.VIDEO_PLAYER();this.setAttribute("role","region"),this.setAttribute("aria-label",r),this.handleMediaUpdated(this.media),this.setAttribute(R.USER_INACTIVE,""),this.addEventListener("pointerdown",this),this.addEventListener("pointermove",this),this.addEventListener("pointerup",this),this.addEventListener("mouseleave",this),this.addEventListener("keyup",this),(n=d.window)==null||n.addEventListener("mouseup",this)}disconnectedCallback(){var e;this.media&&this.mediaUnsetCallback(this.media),(e=d.window)==null||e.removeEventListener("mouseup",this)}mediaSetCallback(e){}mediaUnsetCallback(e){p(this,_e,null)}handleEvent(e){switch(e.type){case"pointerdown":p(this,gt,e.timeStamp);break;case"pointermove":v(this,hi,Hn).call(this,e);break;case"pointerup":v(this,Ei,Fn).call(this,e);break;case"mouseleave":v(this,ze,pi).call(this);break;case"mouseup":this.removeAttribute(R.KEYBOARD_CONTROL);break;case"keyup":v(this,Re,Et).call(this),this.setAttribute(R.KEYBOARD_CONTROL,"");break}}set autohide(e){let r=Number(e);p(this,Le,isNaN(r)?0:r)}get autohide(){return(s(this,Le)===void 0?2:s(this,Le)).toString()}};gt=new WeakMap,_e=new WeakMap,je=new WeakMap,Le=new WeakMap,hi=new WeakSet,Hn=function(e){e.pointerType!=="mouse"&&e.timeStamp-s(this,gt)<250||(v(this,ft,Tr).call(this),clearTimeout(s(this,je)),[this,this.media].includes(e.target)&&v(this,Re,Et).call(this))},Ei=new WeakSet,Fn=function(e){if(e.pointerType==="touch"){let r=!this.hasAttribute(R.USER_INACTIVE);[this,this.media].includes(e.target)&&r?v(this,ze,pi).call(this):v(this,Re,Et).call(this)}else e.composedPath().some(r=>["media-play-button","media-fullscreen-button"].includes(r==null?void 0:r.localName))&&v(this,Re,Et).call(this)},ze=new WeakSet,pi=function(){if(s(this,Le)<0||this.hasAttribute(R.USER_INACTIVE))return;this.setAttribute(R.USER_INACTIVE,"");let e=new d.CustomEvent(ge.USER_INACTIVE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(e)},ft=new WeakSet,Tr=function(){if(!this.hasAttribute(R.USER_INACTIVE))return;this.removeAttribute(R.USER_INACTIVE);let e=new d.CustomEvent(ge.USER_INACTIVE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(e)},Re=new WeakSet,Et=function(){v(this,ft,Tr).call(this),clearTimeout(s(this,je));let e=parseInt(this.autohide);e<0||p(this,je,setTimeout(()=>{v(this,ze,pi).call(this)},e*1e3))};d.customElements.get("media-container")||d.customElements.define("media-container",bt);var ke,Ce,vt,Te,me,Ae,Xe=class{constructor(t,e,{defaultValue:r}={defaultValue:void 0}){u(this,me);u(this,ke,void 0);u(this,Ce,void 0);u(this,vt,void 0);u(this,Te,new Set);p(this,ke,t),p(this,Ce,e),p(this,vt,new Set(r))}[Symbol.iterator](){return s(this,me,Ae).values()}get length(){return s(this,me,Ae).size}get value(){var t;return(t=[...s(this,me,Ae)].join(" "))!=null?t:""}set value(t){var e;t!==this.value&&(p(this,Te,new Set),this.add(...(e=t==null?void 0:t.split(" "))!=null?e:[]))}toString(){return this.value}item(t){return[...s(this,me,Ae)][t]}values(){return s(this,me,Ae).values()}forEach(t,e){s(this,me,Ae).forEach(t,e)}add(...t){var e,r;t.forEach(n=>s(this,Te).add(n)),!(this.value===""&&!((e=s(this,ke))!=null&&e.hasAttribute(`${s(this,Ce)}`)))&&((r=s(this,ke))==null||r.setAttribute(`${s(this,Ce)}`,`${this.value}`))}remove(...t){var e;t.forEach(r=>s(this,Te).delete(r)),(e=s(this,ke))==null||e.setAttribute(`${s(this,Ce)}`,`${this.value}`)}contains(t){return s(this,me,Ae).has(t)}toggle(t,e){return typeof e!="undefined"?e?(this.add(t),!0):(this.remove(t),!1):this.contains(t)?(this.remove(t),!1):(this.add(t),!0)}replace(t,e){return this.remove(t),this.add(e),t===e}};ke=new WeakMap,Ce=new WeakMap,vt=new WeakMap,Te=new WeakMap,me=new WeakSet,Ae=function(){return s(this,Te).size?s(this,Te):s(this,vt)};var us=(i="")=>i.split(/\s+/),Bn=(i="")=>{let[t,e,r]=i.split(":"),n=r?decodeURIComponent(r):void 0;return{kind:t==="cc"?W.CAPTIONS:W.SUBTITLES,language:e,label:n}},Ir=(i="",t={})=>us(i).map(e=>{let r=Bn(e);return{...t,...r}}),Sr=i=>i?Array.isArray(i)?i.map(t=>typeof t=="string"?Bn(t):t):typeof i=="string"?Ir(i):[i]:[],ps=({kind:i,label:t,language:e}={kind:"subtitles"})=>t?`${i==="captions"?"cc":"sb"}:${e}:${encodeURIComponent(t)}`:e,At=(i=[])=>Array.prototype.map.call(i,ps).join(" "),hs=(i,t)=>e=>e[i]===t,$n=i=>{let t=Object.entries(i).map(([e,r])=>hs(e,r));return e=>t.every(r=>r(e))},xe=(i,t=[],e=[])=>{let r=Sr(e).map($n),n=a=>r.some(l=>l(a));Array.from(t).filter(n).forEach(a=>{a.mode=i})},De=(i,t=()=>!0)=>{if(!(i!=null&&i.textTracks))return[];let e=typeof t=="function"?t:$n(t);return Array.from(i.textTracks).filter(e)},Vn=i=>{var e;return!!((e=i.mediaSubtitlesShowing)!=null&&e.length)||i.hasAttribute(o.MEDIA_SUBTITLES_SHOWING)};var Gn=i=>{var n;let{media:t,fullscreenElement:e}=i,r=e&&"requestFullscreen"in e?"requestFullscreen":e&&"webkitRequestFullScreen"in e?"webkitRequestFullScreen":void 0;if(r){let a=(n=e[r])==null?void 0:n.call(e);if(a instanceof Promise)return a.catch(()=>{})}else t!=null&&t.webkitEnterFullscreen?t.webkitEnterFullscreen():t!=null&&t.requestFullscreen&&t.requestFullscreen()},Kn="exitFullscreen"in b?"exitFullscreen":"webkitExitFullscreen"in b?"webkitExitFullscreen":"webkitCancelFullScreen"in b?"webkitCancelFullScreen":void 0,Wn=i=>{var e;let{documentElement:t}=i;if(Kn){let r=(e=t==null?void 0:t[Kn])==null?void 0:e.call(t);if(r instanceof Promise)return r.catch(()=>{})}},Tt="fullscreenElement"in b?"fullscreenElement":"webkitFullscreenElement"in b?"webkitFullscreenElement":void 0,Es=i=>{let{documentElement:t,media:e}=i,r=t==null?void 0:t[Tt];return!r&&"webkitDisplayingFullscreen"in e&&"webkitPresentationMode"in e&&e.webkitDisplayingFullscreen&&e.webkitPresentationMode===br.FULLSCREEN?e:r},qn=i=>{var a;let{media:t,documentElement:e,fullscreenElement:r=t}=i;if(!t||!e)return!1;let n=Es(i);if(!n)return!1;if(n===r||n===t)return!0;if(n.localName.includes("-")){let l=n.shadowRoot;if(!(Tt in l))return de(n,r);for(;l!=null&&l[Tt];){if(l[Tt]===r)return!0;l=(a=l[Tt])==null?void 0:a.shadowRoot}}return!1},bs="fullscreenEnabled"in b?"fullscreenEnabled":"webkitFullscreenEnabled"in b?"webkitFullscreenEnabled":void 0,Yn=i=>{let{documentElement:t,media:e}=i;return!!(t!=null&&t[bs])||e&&"webkitSupportsFullscreen"in e};var bi,yr=()=>{var i,t;return bi||(bi=(t=(i=b)==null?void 0:i.createElement)==null?void 0:t.call(i,"video"),bi)},Qn=async(i=yr())=>{if(!i)return!1;let t=i.volume;i.volume=t/2+.1;let e=new AbortController,r=await Promise.race([gs(i,e.signal),fs(i,t)]);return e.abort(),r},gs=(i,t)=>new Promise(e=>{i.addEventListener("volumechange",()=>e(!0),{signal:t})}),fs=async(i,t)=>{for(let e=0;e<10;e++){if(i.volume===t)return!1;await ri(10)}return i.volume!==t},vs=/.*Version\/.*Safari\/.*/.test(d.navigator.userAgent),Mr=(i=yr())=>d.matchMedia("(display-mode: standalone)").matches&&vs?!1:typeof(i==null?void 0:i.requestPictureInPicture)=="function",_r=(i=yr())=>Yn({documentElement:b,media:i}),jn=_r(),zn=Mr(),Xn=!!d.WebKitPlaybackTargetAvailabilityEvent,Zn=!!d.chrome;var Ze=i=>De(i.media,t=>[W.SUBTITLES,W.CAPTIONS].includes(t.kind)).sort((t,e)=>t.kind>=e.kind?1:-1),Lr=i=>De(i.media,t=>t.mode===pe.SHOWING&&[W.SUBTITLES,W.CAPTIONS].includes(t.kind)),gi=(i,t)=>{let e=Ze(i),r=Lr(i),n=!!r.length;if(e.length){if(t===!1||n&&t!==!0)xe(pe.DISABLED,e,r);else if(t===!0||!n&&t!==!1){let a=e[0],{options:l}=i;if(!(l!=null&&l.noSubtitlesLangPref)){let A=globalThis.localStorage.getItem("media-chrome-pref-subtitles-lang"),T=A?[A,...globalThis.navigator.languages]:globalThis.navigator.languages,f=e.filter(g=>T.some(_=>g.language.toLowerCase().startsWith(_.split("-")[0]))).sort((g,_)=>{let I=T.findIndex(L=>g.language.toLowerCase().startsWith(L.split("-")[0])),M=T.findIndex(L=>_.language.toLowerCase().startsWith(L.split("-")[0]));return I-M});f[0]&&(a=f[0])}let{language:m,label:c,kind:h}=a;xe(pe.DISABLED,e,r),xe(pe.SHOWING,e,[{language:m,label:c,kind:h}])}}},fi=(i,t)=>i===t?!0:typeof i!=typeof t?!1:typeof i=="number"&&Number.isNaN(i)&&Number.isNaN(t)?!0:typeof i!="object"?!1:Array.isArray(i)?As(i,t):Object.entries(i).every(([e,r])=>e in t&&fi(r,t[e])),As=(i,t)=>{let e=Array.isArray(i),r=Array.isArray(t);return e!==r?!1:e||r?i.length!==t.length?!1:i.every((n,a)=>fi(n,t[a])):!0};var Ts=Object.values(z),vi,Is=Qn().then(i=>(vi=i,vi)),Jn=async(...i)=>{await Promise.all(i.filter(t=>t).map(async t=>{if(!("localName"in t&&t instanceof d.HTMLElement))return;let e=t.localName;if(!e.includes("-"))return;let r=d.customElements.get(e);r&&t instanceof r||(await d.customElements.whenDefined(e),d.customElements.upgrade(t))}))},It={mediaWidth:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.videoWidth)!=null?e:0},mediaEvents:["resize"]},mediaHeight:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.videoHeight)!=null?e:0},mediaEvents:["resize"]},mediaPaused:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.paused)!=null?e:!0},set(i,t){var r;let{media:e}=t;e&&(i?e.pause():(r=e.play())==null||r.catch(()=>{}))},mediaEvents:["play","playing","pause","emptied"]},mediaHasPlayed:{get(i,t){let{media:e}=i;return e?t?t.type==="playing":!e.paused:!1},mediaEvents:["playing","emptied"]},mediaEnded:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.ended)!=null?e:!1},mediaEvents:["seeked","ended","emptied"]},mediaPlaybackRate:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.playbackRate)!=null?e:1},set(i,t){let{media:e}=t;e&&Number.isFinite(+i)&&(e.playbackRate=+i)},mediaEvents:["ratechange","loadstart"]},mediaMuted:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.muted)!=null?e:!1},set(i,t){let{media:e}=t;e&&(e.muted=i)},mediaEvents:["volumechange"]},mediaVolume:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.volume)!=null?e:1},set(i,t){let{media:e}=t;if(e){try{i==null?d.localStorage.removeItem("media-chrome-pref-volume"):d.localStorage.setItem("media-chrome-pref-volume",i.toString())}catch{}Number.isFinite(+i)&&(e.volume=+i)}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(i,t)=>{let{options:{noVolumePref:e}}=t;if(!e)try{let r=d.localStorage.getItem("media-chrome-pref-volume");if(r==null)return;It.mediaVolume.set(+r,t),i(+r)}catch(r){console.debug("Error getting volume pref",r)}}]},mediaVolumeLevel:{get(i){let{media:t}=i;return typeof(t==null?void 0:t.volume)=="undefined"?"high":t.muted||t.volume===0?"off":t.volume<.5?"low":t.volume<.75?"medium":"high"},mediaEvents:["volumechange"]},mediaCurrentTime:{get(i){var e;let{media:t}=i;return(e=t==null?void 0:t.currentTime)!=null?e:0},set(i,t){let{media:e}=t;!e||!Qe(i)||(e.currentTime=i)},mediaEvents:["timeupdate","loadedmetadata"]},mediaDuration:{get(i){let{media:t,options:{defaultDuration:e}={}}=i;return e&&(!t||!t.duration||Number.isNaN(t.duration)||!Number.isFinite(t.duration))?e:Number.isFinite(t==null?void 0:t.duration)?t.duration:Number.NaN},mediaEvents:["durationchange","loadedmetadata","emptied"]},mediaLoading:{get(i){let{media:t}=i;return(t==null?void 0:t.readyState)<3},mediaEvents:["waiting","playing","emptied"]},mediaSeekable:{get(i){var n;let{media:t}=i;if(!((n=t==null?void 0:t.seekable)!=null&&n.length))return;let e=t.seekable.start(0),r=t.seekable.end(t.seekable.length-1);if(!(!e&&!r))return[Number(e.toFixed(3)),Number(r.toFixed(3))]},mediaEvents:["loadedmetadata","emptied","progress","seekablechange"]},mediaBuffered:{get(i){var r;let{media:t}=i,e=(r=t==null?void 0:t.buffered)!=null?r:[];return Array.from(e).map((n,a)=>[Number(e.start(a).toFixed(3)),Number(e.end(a).toFixed(3))])},mediaEvents:["progress","emptied"]},mediaStreamType:{get(i){let{media:t,options:{defaultStreamType:e}={}}=i,r=[z.LIVE,z.ON_DEMAND].includes(e)?e:void 0;if(!t)return r;let{streamType:n}=t;if(Ts.includes(n))return n===z.UNKNOWN?r:n;let a=t.duration;return a===1/0?z.LIVE:Number.isFinite(a)?z.ON_DEMAND:r},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange"]},mediaTargetLiveWindow:{get(i){let{media:t}=i;if(!t)return Number.NaN;let{targetLiveWindow:e}=t,r=It.mediaStreamType.get(i);return(e==null||Number.isNaN(e))&&r===z.LIVE?0:e},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange","targetlivewindowchange"]},mediaTimeIsLive:{get(i){let{media:t,options:{liveEdgeOffset:e=10}={}}=i;if(!t)return!1;if(typeof t.liveEdgeStart=="number")return Number.isNaN(t.liveEdgeStart)?!1:t.currentTime>=t.liveEdgeStart;if(!(It.mediaStreamType.get(i)===z.LIVE))return!1;let n=t.seekable;if(!n)return!0;if(!n.length)return!1;let a=n.end(n.length-1)-e;return t.currentTime>=a},mediaEvents:["playing","timeupdate","progress","waiting","emptied"]},mediaSubtitlesList:{get(i){return Ze(i).map(({kind:t,label:e,language:r})=>({kind:t,label:e,language:r}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack"]},mediaSubtitlesShowing:{get(i){return Lr(i).map(({kind:t,label:e,language:r})=>({kind:t,label:e,language:r}))},mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(i,t)=>{var a,l;let{media:e,options:r}=t;if(!e)return;let n=m=>{var h;!r.defaultSubtitles||m&&![W.CAPTIONS,W.SUBTITLES].includes((h=m==null?void 0:m.track)==null?void 0:h.kind)||gi(t,!0)};return(a=e.textTracks)==null||a.addEventListener("addtrack",n),(l=e.textTracks)==null||l.addEventListener("removetrack",n),n(),()=>{var m,c;(m=e.textTracks)==null||m.removeEventListener("addtrack",n),(c=e.textTracks)==null||c.removeEventListener("removetrack",n)}}]},mediaChaptersCues:{get(i){var r;let{media:t}=i;if(!t)return[];let[e]=De(t,{kind:W.CHAPTERS});return Array.from((r=e==null?void 0:e.cues)!=null?r:[]).map(({text:n,startTime:a,endTime:l})=>({text:n,startTime:a,endTime:l}))},mediaEvents:["loadstart","loadedmetadata"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(i,t)=>{var a;let{media:e}=t;if(!e)return;let r=e.querySelector('track[kind="chapters"][default][src]'),n=(a=e.shadowRoot)==null?void 0:a.querySelector(':is(video,audio) > track[kind="chapters"][default][src]');return r==null||r.addEventListener("load",i),n==null||n.addEventListener("load",i),()=>{r==null||r.removeEventListener("load",i),n==null||n.removeEventListener("load",i)}}]},mediaIsPip:{get(i){var r,n;let{media:t,documentElement:e}=i;if(!t||!e||!e.pictureInPictureElement)return!1;if(e.pictureInPictureElement===t)return!0;if(e.pictureInPictureElement instanceof HTMLMediaElement)return(r=t.localName)!=null&&r.includes("-")?de(t,e.pictureInPictureElement):!1;if(e.pictureInPictureElement.localName.includes("-")){let a=e.pictureInPictureElement.shadowRoot;for(;a!=null&&a.pictureInPictureElement;){if(a.pictureInPictureElement===t)return!0;a=(n=a.pictureInPictureElement)==null?void 0:n.shadowRoot}}return!1},set(i,t){let{media:e}=t;if(e)if(i){if(!b.pictureInPictureEnabled){console.warn("MediaChrome: Picture-in-picture is not enabled");return}if(!e.requestPictureInPicture){console.warn("MediaChrome: The current media does not support picture-in-picture");return}let r=()=>{console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.")};e.requestPictureInPicture().catch(n=>{if(n.code===11){if(!e.src){console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a src set.");return}if(e.readyState===0&&e.preload==="none"){let a=()=>{e.removeEventListener("loadedmetadata",l),e.preload="none"},l=()=>{e.requestPictureInPicture().catch(r),a()};e.addEventListener("loadedmetadata",l),e.preload="metadata",setTimeout(()=>{e.readyState===0&&r(),a()},1e3)}else throw n}else throw n})}else b.pictureInPictureElement&&b.exitPictureInPicture()},mediaEvents:["enterpictureinpicture","leavepictureinpicture"]},mediaRenditionList:{get(i){var e;let{media:t}=i;return[...(e=t==null?void 0:t.videoRenditions)!=null?e:[]].map(r=>({...r}))},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaRenditionSelected:{get(i){var e,r,n;let{media:t}=i;return(n=(r=t==null?void 0:t.videoRenditions)==null?void 0:r[(e=t.videoRenditions)==null?void 0:e.selectedIndex])==null?void 0:n.id},set(i,t){let{media:e}=t;if(!(e!=null&&e.videoRenditions)){console.warn("MediaController: Rendition selection not supported by this media.");return}let r=i,n=Array.prototype.findIndex.call(e.videoRenditions,a=>a.id==r);e.videoRenditions.selectedIndex!=n&&(e.videoRenditions.selectedIndex=n)},mediaEvents:["emptied"],videoRenditionsEvents:["addrendition","removerendition","change"]},mediaAudioTrackList:{get(i){var e;let{media:t}=i;return[...(e=t==null?void 0:t.audioTracks)!=null?e:[]]},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaAudioTrackEnabled:{get(i){var e,r;let{media:t}=i;return(r=[...(e=t==null?void 0:t.audioTracks)!=null?e:[]].find(n=>n.enabled))==null?void 0:r.id},set(i,t){let{media:e}=t;if(!(e!=null&&e.audioTracks)){console.warn("MediaChrome: Audio track selection not supported by this media.");return}let r=i;for(let n of e.audioTracks)n.enabled=r==n.id},mediaEvents:["emptied"],audioTracksEvents:["addtrack","removetrack","change"]},mediaIsFullscreen:{get(i){return qn(i)},set(i,t){i?Gn(t):Wn(t)},rootEvents:["fullscreenchange","webkitfullscreenchange"],mediaEvents:["webkitbeginfullscreen","webkitendfullscreen","webkitpresentationmodechanged"]},mediaIsCasting:{get(i){var e;let{media:t}=i;return!(t!=null&&t.remote)||((e=t.remote)==null?void 0:e.state)==="disconnected"?!1:!!t.remote.state},set(i,t){var r,n;let{media:e}=t;if(e&&!(i&&((r=e.remote)==null?void 0:r.state)!=="disconnected")&&!(!i&&((n=e.remote)==null?void 0:n.state)!=="connected")){if(typeof e.remote.prompt!="function"){console.warn("MediaChrome: Casting is not supported in this environment");return}e.remote.prompt().catch(()=>{})}},remoteEvents:["connect","connecting","disconnect"]},mediaIsAirplaying:{get(){return!1},set(i,t){let{media:e}=t;if(e){if(!(e.webkitShowPlaybackTargetPicker&&d.WebKitPlaybackTargetAvailabilityEvent)){console.warn("MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment");return}e.webkitShowPlaybackTargetPicker()}},mediaEvents:["webkitcurrentplaybacktargetiswirelesschanged"]},mediaFullscreenUnavailable:{get(i){let{media:t}=i;if(!jn||!_r(t))return Y.UNSUPPORTED}},mediaPipUnavailable:{get(i){let{media:t}=i;if(!zn||!Mr(t))return Y.UNSUPPORTED}},mediaVolumeUnavailable:{get(i){let{media:t}=i;if(vi===!1||(t==null?void 0:t.volume)==null)return Y.UNSUPPORTED},stateOwnersUpdateHandlers:[i=>{vi==null&&Is.then(t=>i(t?void 0:Y.UNSUPPORTED))}]},mediaCastUnavailable:{get(i,{availability:t="not-available"}={}){var r;let{media:e}=i;if(!Zn||!((r=e==null?void 0:e.remote)!=null&&r.state))return Y.UNSUPPORTED;if(!(t==null||t==="available"))return Y.UNAVAILABLE},stateOwnersUpdateHandlers:[(i,t)=>{var n;let{media:e}=t;return e?(e.disableRemotePlayback||e.hasAttribute("disableremoteplayback")||(n=e==null?void 0:e.remote)==null||n.watchAvailability(a=>{i({availability:a?"available":"not-available"})}).catch(a=>{a.name==="NotSupportedError"?i({availability:null}):i({availability:"not-available"})}),()=>{var a;(a=e==null?void 0:e.remote)==null||a.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaAirplayUnavailable:{get(i,t){if(!Xn)return Y.UNSUPPORTED;if((t==null?void 0:t.availability)==="not-available")return Y.UNAVAILABLE},mediaEvents:["webkitplaybacktargetavailabilitychanged"],stateOwnersUpdateHandlers:[(i,t)=>{var n;let{media:e}=t;return e?(e.disableRemotePlayback||e.hasAttribute("disableremoteplayback")||(n=e==null?void 0:e.remote)==null||n.watchAvailability(a=>{i({availability:a?"available":"not-available"})}).catch(a=>{a.name==="NotSupportedError"?i({availability:null}):i({availability:"not-available"})}),()=>{var a;(a=e==null?void 0:e.remote)==null||a.cancelWatchAvailability().catch(()=>{})}):void 0}]},mediaRenditionUnavailable:{get(i){var e;let{media:t}=i;if(!(t!=null&&t.videoRenditions))return Y.UNSUPPORTED;if(!((e=t.videoRenditions)!=null&&e.length))return Y.UNAVAILABLE},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaAudioTrackUnavailable:{get(i){var e,r;let{media:t}=i;if(!(t!=null&&t.audioTracks))return Y.UNSUPPORTED;if(((r=(e=t.audioTracks)==null?void 0:e.length)!=null?r:0)<=1)return Y.UNAVAILABLE},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]}};var ea={[E.MEDIA_PREVIEW_REQUEST](i,t,{detail:e}){var A,T,f;let{media:r}=t,n=e!=null?e:void 0,a,l;if(r&&n!=null){let[g]=De(r,{kind:W.METADATA,label:"thumbnails"}),_=Array.prototype.find.call((A=g==null?void 0:g.cues)!=null?A:[],(I,M,L)=>M===0?I.endTime>n:M===L.length-1?I.startTime<=n:I.startTime<=n&&I.endTime>n);if(_){let I=/'^(?:[a-z]+:)?\/\//i.test(_.text)||(T=r==null?void 0:r.querySelector('track[label="thumbnails"]'))==null?void 0:T.src,M=new URL(_.text,I);l=new URLSearchParams(M.hash).get("#xywh").split(",").map(K=>+K),a=M.href}}let m=i.mediaDuration.get(t),h=(f=i.mediaChaptersCues.get(t).find((g,_,I)=>_===I.length-1&&m===g.endTime?g.startTime<=n&&g.endTime>=n:g.startTime<=n&&g.endTime>n))==null?void 0:f.text;return e!=null&&h==null&&(h=""),{mediaPreviewTime:n,mediaPreviewImage:a,mediaPreviewCoords:l,mediaPreviewChapter:h}},[E.MEDIA_PAUSE_REQUEST](i,t){i["mediaPaused"].set(!0,t)},[E.MEDIA_PLAY_REQUEST](i,t){var a;let e="mediaPaused";if(i.mediaStreamType.get(t)===z.LIVE){let l=!(i.mediaTargetLiveWindow.get(t)>0),m=(a=i.mediaSeekable.get(t))==null?void 0:a[1];l&&m&&i.mediaCurrentTime.set(m,t)}i[e].set(!1,t)},[E.MEDIA_PLAYBACK_RATE_REQUEST](i,t,{detail:e}){let r="mediaPlaybackRate",n=e;i[r].set(n,t)},[E.MEDIA_MUTE_REQUEST](i,t){i["mediaMuted"].set(!0,t)},[E.MEDIA_UNMUTE_REQUEST](i,t){let e="mediaMuted";i.mediaVolume.get(t)||i.mediaVolume.set(.25,t),i[e].set(!1,t)},[E.MEDIA_VOLUME_REQUEST](i,t,{detail:e}){let r="mediaVolume",n=e;n&&i.mediaMuted.get(t)&&i.mediaMuted.set(!1,t),i[r].set(n,t)},[E.MEDIA_SEEK_REQUEST](i,t,{detail:e}){let r="mediaCurrentTime",n=e;i[r].set(n,t)},[E.MEDIA_SEEK_TO_LIVE_REQUEST](i,t){var n;let e="mediaCurrentTime",r=(n=i.mediaSeekable.get(t))==null?void 0:n[1];Number.isNaN(Number(r))||i[e].set(r,t)},[E.MEDIA_SHOW_SUBTITLES_REQUEST](i,t,{detail:e}){var m;let{options:r}=t,n=Ze(t),a=Sr(e),l=(m=a[0])==null?void 0:m.language;l&&!r.noSubtitlesLangPref&&d.localStorage.setItem("media-chrome-pref-subtitles-lang",l),xe(pe.SHOWING,n,a)},[E.MEDIA_DISABLE_SUBTITLES_REQUEST](i,t,{detail:e}){let r=Ze(t),n=e!=null?e:[];xe(pe.DISABLED,r,n)},[E.MEDIA_TOGGLE_SUBTITLES_REQUEST](i,t,{detail:e}){gi(t,e)},[E.MEDIA_RENDITION_REQUEST](i,t,{detail:e}){let r="mediaRenditionSelected",n=e;i[r].set(n,t)},[E.MEDIA_AUDIO_TRACK_REQUEST](i,t,{detail:e}){let r="mediaAudioTrackEnabled",n=e;i[r].set(n,t)},[E.MEDIA_ENTER_PIP_REQUEST](i,t){let e="mediaIsPip";i.mediaIsFullscreen.get(t)&&i.mediaIsFullscreen.set(!1,t),i[e].set(!0,t)},[E.MEDIA_EXIT_PIP_REQUEST](i,t){i["mediaIsPip"].set(!1,t)},[E.MEDIA_ENTER_FULLSCREEN_REQUEST](i,t){let e="mediaIsFullscreen";i.mediaIsPip.get(t)&&i.mediaIsPip.set(!1,t),i[e].set(!0,t)},[E.MEDIA_EXIT_FULLSCREEN_REQUEST](i,t){i["mediaIsFullscreen"].set(!1,t)},[E.MEDIA_ENTER_CAST_REQUEST](i,t){let e="mediaIsCasting";i.mediaIsFullscreen.get(t)&&i.mediaIsFullscreen.set(!1,t),i[e].set(!0,t)},[E.MEDIA_EXIT_CAST_REQUEST](i,t){i["mediaIsCasting"].set(!1,t)},[E.MEDIA_AIRPLAY_REQUEST](i,t){i["mediaIsAirplaying"].set(!0,t)}};var Ss=({media:i,fullscreenElement:t,documentElement:e,stateMediator:r=It,requestMap:n=ea,options:a={},monitorStateOwnersOnlyWithSubscriptions:l=!0})=>{let m=[],c={options:{...a}},h=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0}),A=I=>{I!=null&&(fi(I,h)||(h=Object.freeze({...h,...I}),m.forEach(M=>M(h))))},T=()=>{let I=Object.entries(r).reduce((M,[L,{get:K}])=>(M[L]=K(c),M),{});A(I)},f={},g,_=async(I,M)=>{var rn,nn,an,on,sn,ln,dn,mn,cn,un,pn,hn,En,bn,gn,fn;let L=!!g;if(g={...c,...g!=null?g:{},...I},L)return;await Jn(...Object.values(I));let K=m.length>0&&M===0&&l,ue=c.media!==g.media,be=((rn=c.media)==null?void 0:rn.textTracks)!==((nn=g.media)==null?void 0:nn.textTracks),ut=((an=c.media)==null?void 0:an.videoRenditions)!==((on=g.media)==null?void 0:on.videoRenditions),qe=((sn=c.media)==null?void 0:sn.audioTracks)!==((ln=g.media)==null?void 0:ln.audioTracks),Br=((dn=c.media)==null?void 0:dn.remote)!==((mn=g.media)==null?void 0:mn.remote),$r=c.documentElement!==g.documentElement,Vr=!!c.media&&(ue||K),Kr=!!((cn=c.media)!=null&&cn.textTracks)&&(be||K),Gr=!!((un=c.media)!=null&&un.videoRenditions)&&(ut||K),Wr=!!((pn=c.media)!=null&&pn.audioTracks)&&(qe||K),qr=!!((hn=c.media)!=null&&hn.remote)&&(Br||K),Yr=!!c.documentElement&&($r||K),Qr=Vr||Kr||Gr||Wr||qr||Yr,Ye=m.length===0&&M===1&&l,jr=!!g.media&&(ue||Ye),zr=!!((En=g.media)!=null&&En.textTracks)&&(be||Ye),Xr=!!((bn=g.media)!=null&&bn.videoRenditions)&&(ut||Ye),Zr=!!((gn=g.media)!=null&&gn.audioTracks)&&(qe||Ye),Jr=!!((fn=g.media)!=null&&fn.remote)&&(Br||Ye),en=!!g.documentElement&&($r||Ye),tn=jr||zr||Xr||Zr||Jr||en;if(!(Qr||tn)){Object.entries(g).forEach(([D,pt])=>{c[D]=pt}),T(),g=void 0;return}Object.entries(r).forEach(([D,{get:pt,mediaEvents:Po=[],textTracksEvents:Uo=[],videoRenditionsEvents:No=[],audioTracksEvents:Oo=[],remoteEvents:Ho=[],rootEvents:Fo=[],stateOwnersUpdateHandlers:Bo=[]}])=>{f[D]||(f[D]={});let Q=$=>{let j=pt(c,$);A({[D]:j})},V;V=f[D].mediaEvents,Po.forEach($=>{V&&Vr&&(c.media.removeEventListener($,V),f[D].mediaEvents=void 0),jr&&(g.media.addEventListener($,Q),f[D].mediaEvents=Q)}),V=f[D].textTracksEvents,Uo.forEach($=>{var j,Z;V&&Kr&&((j=c.media.textTracks)==null||j.removeEventListener($,V),f[D].textTracksEvents=void 0),zr&&((Z=g.media.textTracks)==null||Z.addEventListener($,Q),f[D].textTracksEvents=Q)}),V=f[D].videoRenditionsEvents,No.forEach($=>{var j,Z;V&&Gr&&((j=c.media.videoRenditions)==null||j.removeEventListener($,V),f[D].videoRenditionsEvents=void 0),Xr&&((Z=g.media.videoRenditions)==null||Z.addEventListener($,Q),f[D].videoRenditionsEvents=Q)}),V=f[D].audioTracksEvents,Oo.forEach($=>{var j,Z;V&&Wr&&((j=c.media.audioTracks)==null||j.removeEventListener($,V),f[D].audioTracksEvents=void 0),Zr&&((Z=g.media.audioTracks)==null||Z.addEventListener($,Q),f[D].audioTracksEvents=Q)}),V=f[D].remoteEvents,Ho.forEach($=>{var j,Z;V&&qr&&((j=c.media.remote)==null||j.removeEventListener($,V),f[D].remoteEvents=void 0),Jr&&((Z=g.media.remote)==null||Z.addEventListener($,Q),f[D].remoteEvents=Q)}),V=f[D].rootEvents,Fo.forEach($=>{V&&Yr&&(c.documentElement.removeEventListener($,V),f[D].rootEvents=void 0),en&&(g.documentElement.addEventListener($,Q),f[D].rootEvents=Q)});let vn=f[D].stateOwnersUpdateHandlers;Bo.forEach($=>{vn&&Qr&&vn(),tn&&(f[D].stateOwnersUpdateHandlers=$(Q,g))})}),Object.entries(g).forEach(([D,pt])=>{c[D]=pt}),T(),g=void 0};return _({media:i,fullscreenElement:t,documentElement:e,options:a}),{dispatch(I){let{type:M,detail:L}=I;if(n[M]){A(n[M](r,c,I));return}M==="mediaelementchangerequest"?_({media:L}):M==="fullscreenelementchangerequest"?_({fullscreenElement:L}):M==="documentelementchangerequest"?_({documentElement:L}):M==="optionschangerequest"&&Object.entries(L!=null?L:{}).forEach(([K,ue])=>{c.options[K]=ue})},getState(){return h},subscribe(I){return _({},m.length+1),m.push(I),I(h),()=>{let M=m.indexOf(I);M>=0&&(_({},m.length-1),m.splice(M,1))}}}},ta=Ss;var ia=["ArrowLeft","ArrowRight","Enter"," ","f","m","k","c"],ra=10,y={DEFAULT_SUBTITLES:"defaultsubtitles",DEFAULT_STREAM_TYPE:"defaultstreamtype",DEFAULT_DURATION:"defaultduration",FULLSCREEN_ELEMENT:"fullscreenelement",HOTKEYS:"hotkeys",KEYS_USED:"keysused",LIVE_EDGE_OFFSET:"liveedgeoffset",NO_AUTO_SEEK_TO_LIVE:"noautoseektolive",NO_HOTKEYS:"nohotkeys",NO_VOLUME_PREF:"novolumepref",NO_SUBTITLES_LANG_PREF:"nosubtitleslangpref",NO_DEFAULT_STORE:"nodefaultstore",KEYBOARD_FORWARD_SEEK_OFFSET:"keyboardforwardseekoffset",KEYBOARD_BACKWARD_SEEK_OFFSET:"keyboardbackwardseekoffset"},he,Je,H,et,ee,yt,Mt,kr,Pe,St,_t,Cr,Ai=class extends bt{constructor(){super();u(this,Mt);u(this,Pe);u(this,_t);this.mediaStateReceivers=[];this.associatedElementSubscriptions=new Map;u(this,he,new Xe(this,y.HOTKEYS));u(this,Je,void 0);u(this,H,void 0);u(this,et,void 0);u(this,ee,void 0);u(this,yt,e=>{var r;(r=s(this,H))==null||r.dispatch(e)});this.associateElement(this);let e={};p(this,et,r=>{Object.entries(r).forEach(([n,a])=>{if(n in e&&e[n]===a)return;this.propagateMediaState(n,a);let l=n.toLowerCase(),m=new d.CustomEvent(Er[l],{composed:!0,detail:a});this.dispatchEvent(m)}),e=r}),this.enableHotkeys()}static get observedAttributes(){return super.observedAttributes.concat(y.NO_HOTKEYS,y.HOTKEYS,y.DEFAULT_STREAM_TYPE,y.DEFAULT_SUBTITLES,y.DEFAULT_DURATION)}get mediaStore(){return s(this,H)}set mediaStore(e){var r,n;if(s(this,H)&&((r=s(this,ee))==null||r.call(this),p(this,ee,void 0)),p(this,H,e),!s(this,H)&&!this.hasAttribute(y.NO_DEFAULT_STORE)){v(this,Mt,kr).call(this);return}p(this,ee,(n=s(this,H))==null?void 0:n.subscribe(s(this,et)))}get fullscreenElement(){var e;return(e=s(this,Je))!=null?e:this}set fullscreenElement(e){var r;this.hasAttribute(y.FULLSCREEN_ELEMENT)&&this.removeAttribute(y.FULLSCREEN_ELEMENT),p(this,Je,e),(r=s(this,H))==null||r.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}attributeChangedCallback(e,r,n){var a,l,m,c,h,A;if(super.attributeChangedCallback(e,r,n),e===y.NO_HOTKEYS)n!==r&&n===""?(this.hasAttribute(y.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):n!==r&&n===null&&this.enableHotkeys();else if(e===y.HOTKEYS)s(this,he).value=n;else if(e===y.DEFAULT_SUBTITLES&&n!==r)(a=s(this,H))==null||a.dispatch({type:"optionschangerequest",detail:{defaultSubtitles:this.hasAttribute(y.DEFAULT_SUBTITLES)}});else if(e===y.DEFAULT_STREAM_TYPE)(m=s(this,H))==null||m.dispatch({type:"optionschangerequest",detail:{defaultStreamType:(l=this.getAttribute(y.DEFAULT_STREAM_TYPE))!=null?l:void 0}});else if(e===y.LIVE_EDGE_OFFSET)(c=s(this,H))==null||c.dispatch({type:"optionschangerequest",detail:{liveEdgeOffset:this.hasAttribute(y.LIVE_EDGE_OFFSET)?+this.getAttribute(y.LIVE_EDGE_OFFSET):void 0}});else if(e===y.FULLSCREEN_ELEMENT){let T=n?(h=this.getRootNode())==null?void 0:h.getElementById(n):void 0;p(this,Je,T),(A=s(this,H))==null||A.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}}connectedCallback(){var e,r;!s(this,H)&&!this.hasAttribute(y.NO_DEFAULT_STORE)&&v(this,Mt,kr).call(this),(e=s(this,H))==null||e.dispatch({type:"documentelementchangerequest",detail:b}),super.connectedCallback(),s(this,H)&&!s(this,ee)&&p(this,ee,(r=s(this,H))==null?void 0:r.subscribe(s(this,et))),this.enableHotkeys()}disconnectedCallback(){var e,r,n,a;(e=super.disconnectedCallback)==null||e.call(this),s(this,H)&&((r=s(this,H))==null||r.dispatch({type:"documentelementchangerequest",detail:void 0}),(n=s(this,H))==null||n.dispatch({type:E.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})),s(this,ee)&&((a=s(this,ee))==null||a.call(this),p(this,ee,void 0))}mediaSetCallback(e){var r;super.mediaSetCallback(e),(r=s(this,H))==null||r.dispatch({type:"mediaelementchangerequest",detail:e}),e.hasAttribute("tabindex")||(e.tabIndex=-1)}mediaUnsetCallback(e){var r;super.mediaUnsetCallback(e),(r=s(this,H))==null||r.dispatch({type:"mediaelementchangerequest",detail:void 0})}propagateMediaState(e,r){aa(this.mediaStateReceivers,e,r)}associateElement(e){if(!e)return;let{associatedElementSubscriptions:r}=this;if(r.has(e))return;let n=this.registerMediaStateReceiver.bind(this),a=this.unregisterMediaStateReceiver.bind(this),l=ks(e,n,a);Object.values(E).forEach(m=>{e.addEventListener(m,s(this,yt))}),r.set(e,l)}unassociateElement(e){if(!e)return;let{associatedElementSubscriptions:r}=this;if(!r.has(e))return;r.get(e)(),r.delete(e),Object.values(E).forEach(a=>{e.removeEventListener(a,s(this,yt))})}registerMediaStateReceiver(e){if(!e)return;let r=this.mediaStateReceivers;r.indexOf(e)>-1||(r.push(e),s(this,H)&&Object.entries(s(this,H).getState()).forEach(([a,l])=>{aa([e],a,l)}))}unregisterMediaStateReceiver(e){let r=this.mediaStateReceivers,n=r.indexOf(e);n<0||r.splice(n,1)}enableHotkeys(){this.addEventListener("keydown",v(this,_t,Cr))}disableHotkeys(){this.removeEventListener("keydown",v(this,_t,Cr)),this.removeEventListener("keyup",v(this,Pe,St))}get hotkeys(){return s(this,he)}keyboardShortcutHandler(e){var c,h,A,T,f;let r=e.target;if(((A=(h=(c=r.getAttribute(y.KEYS_USED))==null?void 0:c.split(" "))!=null?h:r==null?void 0:r.keysUsed)!=null?A:[]).map(g=>g==="Space"?" ":g).filter(Boolean).includes(e.key))return;let a,l,m;if(!s(this,he).contains(`no${e.key.toLowerCase()}`)&&!(e.key===" "&&s(this,he).contains("nospace")))switch(e.key){case" ":case"k":a=s(this,H).getState().mediaPaused?E.MEDIA_PLAY_REQUEST:E.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new d.CustomEvent(a,{composed:!0,bubbles:!0}));break;case"m":a=this.mediaStore.getState().mediaVolumeLevel==="off"?E.MEDIA_UNMUTE_REQUEST:E.MEDIA_MUTE_REQUEST,this.dispatchEvent(new d.CustomEvent(a,{composed:!0,bubbles:!0}));break;case"f":a=this.mediaStore.getState().mediaIsFullscreen?E.MEDIA_EXIT_FULLSCREEN_REQUEST:E.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new d.CustomEvent(a,{composed:!0,bubbles:!0}));break;case"c":this.dispatchEvent(new d.CustomEvent(E.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case"ArrowLeft":{let g=this.hasAttribute(y.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(y.KEYBOARD_BACKWARD_SEEK_OFFSET):ra;l=Math.max(((T=this.mediaStore.getState().mediaCurrentTime)!=null?T:0)-g,0),m=new d.CustomEvent(E.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:l}),this.dispatchEvent(m);break}case"ArrowRight":{let g=this.hasAttribute(y.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(y.KEYBOARD_FORWARD_SEEK_OFFSET):ra;l=Math.max(((f=this.mediaStore.getState().mediaCurrentTime)!=null?f:0)+g,0),m=new d.CustomEvent(E.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:l}),this.dispatchEvent(m);break}default:break}}};he=new WeakMap,Je=new WeakMap,H=new WeakMap,et=new WeakMap,ee=new WeakMap,yt=new WeakMap,Mt=new WeakSet,kr=function(){var e;this.mediaStore=ta({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(y.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(y.DEFAULT_DURATION)?+this.getAttribute(y.DEFAULT_DURATION):void 0,defaultStreamType:(e=this.getAttribute(y.DEFAULT_STREAM_TYPE))!=null?e:void 0,liveEdgeOffset:this.hasAttribute(y.LIVE_EDGE_OFFSET)?+this.getAttribute(y.LIVE_EDGE_OFFSET):void 0,noVolumePref:this.hasAttribute(y.NO_VOLUME_PREF),noSubtitlesLangPref:this.hasAttribute(y.NO_SUBTITLES_LANG_PREF)}})},Pe=new WeakSet,St=function(e){let{key:r}=e;if(!ia.includes(r)){this.removeEventListener("keyup",v(this,Pe,St));return}this.keyboardShortcutHandler(e)},_t=new WeakSet,Cr=function(e){let{metaKey:r,altKey:n,key:a}=e;if(r||n||!ia.includes(a)){this.removeEventListener("keyup",v(this,Pe,St));return}[" ","ArrowLeft","ArrowRight"].includes(a)&&!(s(this,he).contains(`no${a.toLowerCase()}`)||a===" "&&s(this,he).contains("nospace"))&&e.preventDefault(),this.addEventListener("keyup",v(this,Pe,St),{once:!0})};var ys=Object.values(o),Ms=Object.values(ei),oa=i=>{var r,n,a,l;let{observedAttributes:t}=i.constructor;!t&&((r=i.nodeName)!=null&&r.includes("-"))&&(d.customElements.upgrade(i),{observedAttributes:t}=i.constructor);let e=(l=(a=(n=i==null?void 0:i.getAttribute)==null?void 0:n.call(i,S.MEDIA_CHROME_ATTRIBUTES))==null?void 0:a.split)==null?void 0:l.call(a,/\s+/);return Array.isArray(t||e)?(t||e).filter(m=>ys.includes(m)):[]},_s=i=>{var t,e;return(t=i.nodeName)!=null&&t.includes("-")&&d.customElements.get((e=i.nodeName)==null?void 0:e.toLowerCase())&&!(i instanceof d.customElements.get(i.nodeName.toLowerCase()))&&d.customElements.upgrade(i),Ms.some(r=>r in i)},xr=i=>_s(i)||!!oa(i).length,na=i=>{var t;return(t=i==null?void 0:i.join)==null?void 0:t.call(i,":")},Rr={[o.MEDIA_SUBTITLES_LIST]:At,[o.MEDIA_SUBTITLES_SHOWING]:At,[o.MEDIA_SEEKABLE]:na,[o.MEDIA_BUFFERED]:i=>i==null?void 0:i.map(na).join(" "),[o.MEDIA_PREVIEW_COORDS]:i=>i==null?void 0:i.join(" "),[o.MEDIA_RENDITION_LIST]:Sn,[o.MEDIA_AUDIO_TRACK_LIST]:yn},Ls=async(i,t,e)=>{var n,a;if(i.isConnected||await ri(0),typeof e=="boolean"||e==null)return k(i,t,e);if(typeof e=="number")return B(i,t,e);if(typeof e=="string")return x(i,t,e);if(Array.isArray(e)&&!e.length)return i.removeAttribute(t);let r=(a=(n=Rr[t])==null?void 0:n.call(Rr,e))!=null?a:e;return i.setAttribute(t,r)},Rs=i=>{var t;return!!((t=i.closest)!=null&&t.call(i,'*[slot="media"]'))},we=(i,t)=>{if(Rs(i))return;let e=(n,a)=>{var h,A;xr(n)&&a(n);let{children:l=[]}=n!=null?n:{},m=(A=(h=n==null?void 0:n.shadowRoot)==null?void 0:h.children)!=null?A:[];[...l,...m].forEach(T=>we(T,a))},r=i==null?void 0:i.nodeName.toLowerCase();if(r.includes("-")&&!xr(i)){d.customElements.whenDefined(r).then(()=>{e(i,t)});return}e(i,t)},aa=(i,t,e)=>{i.forEach(r=>{if(t in r){r[t]=e;return}let n=oa(r),a=t.toLowerCase();n.includes(a)&&Ls(r,a,e)})},ks=(i,t,e)=>{we(i,t);let r=A=>{var f;let T=(f=A==null?void 0:A.composedPath()[0])!=null?f:A.target;t(T)},n=A=>{var f;let T=(f=A==null?void 0:A.composedPath()[0])!=null?f:A.target;e(T)};i.addEventListener(E.REGISTER_MEDIA_STATE_RECEIVER,r),i.addEventListener(E.UNREGISTER_MEDIA_STATE_RECEIVER,n);let a=A=>{A.forEach(T=>{let{addedNodes:f=[],removedNodes:g=[],type:_,target:I,attributeName:M}=T;_==="childList"?(Array.prototype.forEach.call(f,L=>we(L,t)),Array.prototype.forEach.call(g,L=>we(L,e))):_==="attributes"&&M===S.MEDIA_CHROME_ATTRIBUTES&&(xr(I)?t(I):e(I))})},l=[],m=A=>{let T=A.target;T.name!=="media"&&(l.forEach(f=>we(f,e)),l=[...T.assignedElements({flatten:!0})],l.forEach(f=>we(f,t)))};i.addEventListener("slotchange",m);let c=new MutationObserver(a);return c.observe(i,{childList:!0,attributes:!0,subtree:!0}),()=>{we(i,e),i.removeEventListener("slotchange",m),c.disconnect(),i.removeEventListener(E.REGISTER_MEDIA_STATE_RECEIVER,r),i.removeEventListener(E.UNREGISTER_MEDIA_STATE_RECEIVER,n)}};d.customElements.get("media-controller")||d.customElements.define("media-controller",Ai);var sa=Ai;var Ti={TOOLTIP_PLACEMENT:"tooltipplacement"},la=b.createElement("template");la.innerHTML=`
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
`;var te,Ue,Ee,Ne,Lt,Ii,da,F=class extends d.HTMLElement{constructor(e={}){var r;super();u(this,Ii);u(this,te,void 0);this.preventClick=!1;this.tooltipEl=null;this.tooltipContent="";u(this,Ue,e=>{this.preventClick||this.handleClick(e),setTimeout(s(this,Ee),0)});u(this,Ee,()=>{var e,r;(r=(e=this.tooltipEl)==null?void 0:e.updateXOffset)==null||r.call(e)});u(this,Ne,e=>{let{key:r}=e;if(!this.keysUsed.includes(r)){this.removeEventListener("keyup",s(this,Ne));return}this.preventClick||this.handleClick(e)});u(this,Lt,e=>{let{metaKey:r,altKey:n,key:a}=e;if(r||n||!this.keysUsed.includes(a)){this.removeEventListener("keyup",s(this,Ne));return}this.addEventListener("keyup",s(this,Ne),{once:!0})});if(!this.shadowRoot){this.attachShadow({mode:"open"});let n=la.content.cloneNode(!0);this.nativeEl=n;let a=e.slotTemplate;a||(a=b.createElement("template"),a.innerHTML=`<slot>${e.defaultContent||""}</slot>`),e.tooltipContent&&(n.querySelector('slot[name="tooltip-content"]').innerHTML=(r=e.tooltipContent)!=null?r:"",this.tooltipContent=e.tooltipContent),this.nativeEl.appendChild(a.content.cloneNode(!0)),this.shadowRoot.appendChild(n)}this.tooltipEl=this.shadowRoot.querySelector("media-tooltip")}static get observedAttributes(){return["disabled",Ti.TOOLTIP_PLACEMENT,S.MEDIA_CONTROLLER]}enable(){this.addEventListener("click",s(this,Ue)),this.addEventListener("keydown",s(this,Lt)),this.tabIndex=0}disable(){this.removeEventListener("click",s(this,Ue)),this.removeEventListener("keydown",s(this,Lt)),this.removeEventListener("keyup",s(this,Ne)),this.tabIndex=-1}attributeChangedCallback(e,r,n){var a,l,m,c,h;e===S.MEDIA_CONTROLLER?(r&&((l=(a=s(this,te))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,te,null)),n&&this.isConnected&&(p(this,te,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,te))==null?void 0:c.associateElement)==null||h.call(c,this))):e==="disabled"&&n!==r?n==null?this.enable():this.disable():e===Ti.TOOLTIP_PLACEMENT&&this.tooltipEl&&n!==r&&(this.tooltipEl.placement=n),s(this,Ee).call(this)}connectedCallback(){var n,a,l;let{style:e}=O(this.shadowRoot,":host");e.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","button");let r=this.getAttribute(S.MEDIA_CONTROLLER);r&&(p(this,te,(n=this.getRootNode())==null?void 0:n.getElementById(r)),(l=(a=s(this,te))==null?void 0:a.associateElement)==null||l.call(a,this)),d.customElements.whenDefined("media-tooltip").then(()=>v(this,Ii,da).call(this))}disconnectedCallback(){var e,r;this.disable(),(r=(e=s(this,te))==null?void 0:e.unassociateElement)==null||r.call(e,this),p(this,te,null),this.removeEventListener("mouseenter",s(this,Ee)),this.removeEventListener("focus",s(this,Ee)),this.removeEventListener("click",s(this,Ue))}get keysUsed(){return["Enter"," "]}get tooltipPlacement(){return U(this,Ti.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){x(this,Ti.TOOLTIP_PLACEMENT,e)}handleClick(e){}};te=new WeakMap,Ue=new WeakMap,Ee=new WeakMap,Ne=new WeakMap,Lt=new WeakMap,Ii=new WeakSet,da=function(){this.addEventListener("mouseenter",s(this,Ee)),this.addEventListener("focus",s(this,Ee)),this.addEventListener("click",s(this,Ue));let e=this.tooltipPlacement;e&&this.tooltipEl&&(this.tooltipEl.placement=e)};d.customElements.get("media-chrome-button")||d.customElements.define("media-chrome-button",F);var ma=F;var ca=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`,pa=b.createElement("template");pa.innerHTML=`
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
    <slot name="enter">${ca}</slot>
    <slot name="exit">${ca}</slot>
  </slot>
`;var Cs=`
  <slot name="tooltip-enter">${w.ENTER_AIRPLAY}</slot>
  <slot name="tooltip-exit">${w.EXIT_AIRPLAY}</slot>
`,ua=i=>{let t=i.mediaIsAirplaying?N.EXIT_AIRPLAY():N.ENTER_AIRPLAY();i.setAttribute("aria-label",t)},Si=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_AIRPLAYING,o.MEDIA_AIRPLAY_UNAVAILABLE]}constructor(t={}){super({slotTemplate:pa,tooltipContent:Cs,...t})}connectedCallback(){super.connectedCallback(),ua(this)}attributeChangedCallback(t,e,r){super.attributeChangedCallback(t,e,r),t===o.MEDIA_IS_AIRPLAYING&&ua(this)}get mediaIsAirplaying(){return C(this,o.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(t){k(this,o.MEDIA_IS_AIRPLAYING,t)}get mediaAirplayUnavailable(){return U(this,o.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(t){x(this,o.MEDIA_AIRPLAY_UNAVAILABLE,t)}handleClick(){let t=new d.CustomEvent(E.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(t)}};d.customElements.get("media-airplay-button")||d.customElements.define("media-airplay-button",Si);var ha=Si;var xs=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,Ds=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,fa=b.createElement("template");fa.innerHTML=`
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
    <slot name="on">${xs}</slot>
    <slot name="off">${Ds}</slot>
  </slot>
`;var ws=`
  <slot name="tooltip-enable">${w.ENABLE_CAPTIONS}</slot>
  <slot name="tooltip-disable">${w.DISABLE_CAPTIONS}</slot>
`,Ea=i=>{i.setAttribute("aria-checked",Vn(i).toString())},yi=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_SUBTITLES_LIST,o.MEDIA_SUBTITLES_SHOWING]}constructor(t={}){super({slotTemplate:fa,tooltipContent:ws,...t}),this._captionsReady=!1}connectedCallback(){super.connectedCallback(),this.setAttribute("role","switch"),this.setAttribute("aria-label",G.CLOSED_CAPTIONS()),Ea(this)}attributeChangedCallback(t,e,r){super.attributeChangedCallback(t,e,r),t===o.MEDIA_SUBTITLES_SHOWING&&Ea(this)}get mediaSubtitlesList(){return ba(this,o.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(t){ga(this,o.MEDIA_SUBTITLES_LIST,t)}get mediaSubtitlesShowing(){return ba(this,o.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(t){ga(this,o.MEDIA_SUBTITLES_SHOWING,t)}handleClick(){this.dispatchEvent(new d.CustomEvent(E.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}},ba=(i,t)=>{let e=i.getAttribute(t);return e?Ir(e):[]},ga=(i,t,e)=>{if(!(e!=null&&e.length)){i.removeAttribute(t);return}let r=At(e);i.getAttribute(t)!==r&&i.setAttribute(t,r)};d.customElements.get("media-captions-button")||d.customElements.define("media-captions-button",yi);var va=yi;var Ps='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg>',Us='<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg>',Ta=b.createElement("template");Ta.innerHTML=`
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
    <slot name="enter">${Ps}</slot>
    <slot name="exit">${Us}</slot>
  </slot>
`;var Ns=`
  <slot name="tooltip-enter">${w.START_CAST}</slot>
  <slot name="tooltip-exit">${w.STOP_CAST}</slot>
`,Aa=i=>{let t=i.mediaIsCasting?N.EXIT_CAST():N.ENTER_CAST();i.setAttribute("aria-label",t)},Mi=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_CASTING,o.MEDIA_CAST_UNAVAILABLE]}constructor(t={}){super({slotTemplate:Ta,tooltipContent:Ns,...t})}connectedCallback(){super.connectedCallback(),Aa(this)}attributeChangedCallback(t,e,r){super.attributeChangedCallback(t,e,r),t===o.MEDIA_IS_CASTING&&Aa(this)}get mediaIsCasting(){return C(this,o.MEDIA_IS_CASTING)}set mediaIsCasting(t){k(this,o.MEDIA_IS_CASTING,t)}get mediaCastUnavailable(){return U(this,o.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(t){x(this,o.MEDIA_CAST_UNAVAILABLE,t)}handleClick(){let t=this.mediaIsCasting?E.MEDIA_EXIT_CAST_REQUEST:E.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new d.CustomEvent(t,{composed:!0,bubbles:!0}))}};d.customElements.get("media-cast-button")||d.customElements.define("media-cast-button",Mi);var Ia=Mi;var Sa=b.createElement("template");Sa.innerHTML=`
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
`;var Dr={HIDDEN:"hidden",ANCHOR:"anchor"},tt,Ie,_i,ya,Li,Ma,Ri,_a,ki,La,Ci,Ra,Rt=class extends d.HTMLElement{constructor(){super();u(this,_i);u(this,Li);u(this,Ri);u(this,ki);u(this,Ci);u(this,tt,null);u(this,Ie,null);this.shadowRoot||(this.attachShadow({mode:"open"}),this.nativeEl=this.constructor.template.content.cloneNode(!0),this.shadowRoot.append(this.nativeEl)),this.addEventListener("invoke",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this)}static get observedAttributes(){return[Dr.HIDDEN,Dr.ANCHOR]}handleEvent(e){switch(e.type){case"invoke":v(this,Ri,_a).call(this,e);break;case"focusout":v(this,ki,La).call(this,e);break;case"keydown":v(this,Ci,Ra).call(this,e);break}}connectedCallback(){this.role||(this.role="dialog")}attributeChangedCallback(e,r,n){e===Dr.HIDDEN&&n!==r&&(this.hidden?v(this,Li,Ma).call(this):v(this,_i,ya).call(this))}focus(){p(this,tt,Ar());let e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');e==null||e.focus()}get keysUsed(){return["Escape","Tab"]}};tt=new WeakMap,Ie=new WeakMap,_i=new WeakSet,ya=function(){var e;(e=s(this,Ie))==null||e.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0})},Li=new WeakSet,Ma=function(){var e;(e=s(this,Ie))==null||e.setAttribute("aria-expanded","false")},Ri=new WeakSet,_a=function(e){p(this,Ie,e.relatedTarget),de(this,e.relatedTarget)||(this.hidden=!this.hidden)},ki=new WeakSet,La=function(e){var r;de(this,e.relatedTarget)||((r=s(this,tt))==null||r.focus(),s(this,Ie)&&s(this,Ie)!==e.relatedTarget&&!this.hidden&&(this.hidden=!0))},Ci=new WeakSet,Ra=function(e){var m,c,h,A,T;let{key:r,ctrlKey:n,altKey:a,metaKey:l}=e;n||a||l||this.keysUsed.includes(r)&&(e.preventDefault(),e.stopPropagation(),r==="Tab"?(e.shiftKey?(c=(m=this.previousElementSibling)==null?void 0:m.focus)==null||c.call(m):(A=(h=this.nextElementSibling)==null?void 0:h.focus)==null||A.call(h),this.blur()):r==="Escape"&&((T=s(this,tt))==null||T.focus(),this.hidden=!0))},Rt.template=Sa;d.customElements.get("media-chrome-dialog")||d.customElements.define("media-chrome-dialog",Rt);var ka=Rt;var Ca=b.createElement("template");Ca.innerHTML=`
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
`;var ie,kt,Ct,xt,X,Dt,wt,Pt,Ut,xi,xa,Nt,wr,Ot,Pr,Ht,Ur,Di,Da,wi,wa,Pi,Pa,Ui,Ua,Se=class extends d.HTMLElement{constructor(){super();u(this,xi);u(this,Nt);u(this,Ot);u(this,Ht);u(this,Di);u(this,wi);u(this,Pi);u(this,Ui);u(this,ie,void 0);u(this,kt,void 0);u(this,Ct,void 0);u(this,xt,void 0);u(this,X,{});u(this,Dt,[]);u(this,wt,()=>{if(this.range.matches(":focus-visible")){let{style:e}=O(this.shadowRoot,":host");e.setProperty("--_focus-visible-box-shadow","var(--_focus-box-shadow)")}});u(this,Pt,()=>{let{style:e}=O(this.shadowRoot,":host");e.removeProperty("--_focus-visible-box-shadow")});u(this,Ut,()=>{let e=this.shadowRoot.querySelector("#segments-clipping");e&&e.parentNode.append(e)});this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Ca.content.cloneNode(!0))),this.container=this.shadowRoot.querySelector("#container"),p(this,Ct,this.shadowRoot.querySelector("#startpoint")),p(this,xt,this.shadowRoot.querySelector("#endpoint")),this.range=this.shadowRoot.querySelector("#range"),this.appearance=this.shadowRoot.querySelector("#appearance")}static get observedAttributes(){return["disabled","aria-disabled",S.MEDIA_CONTROLLER]}attributeChangedCallback(e,r,n){var a,l,m,c,h;e===S.MEDIA_CONTROLLER?(r&&((l=(a=s(this,ie))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,ie,null)),n&&this.isConnected&&(p(this,ie,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,ie))==null?void 0:c.associateElement)==null||h.call(c,this))):(e==="disabled"||e==="aria-disabled"&&r!==n)&&(n==null?(this.range.removeAttribute(e),v(this,Nt,wr).call(this)):(this.range.setAttribute(e,n),v(this,Ot,Pr).call(this)))}connectedCallback(){var n,a,l;let{style:e}=O(this.shadowRoot,":host");e.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),s(this,X).pointer=O(this.shadowRoot,"#pointer"),s(this,X).progress=O(this.shadowRoot,"#progress"),s(this,X).thumb=O(this.shadowRoot,"#thumb"),s(this,X).activeSegment=O(this.shadowRoot,"#segments-clipping rect:nth-child(0)");let r=this.getAttribute(S.MEDIA_CONTROLLER);r&&(p(this,ie,(n=this.getRootNode())==null?void 0:n.getElementById(r)),(l=(a=s(this,ie))==null?void 0:a.associateElement)==null||l.call(a,this)),this.updateBar(),this.shadowRoot.addEventListener("focusin",s(this,wt)),this.shadowRoot.addEventListener("focusout",s(this,Pt)),v(this,Nt,wr).call(this),li(this.container,s(this,Ut))}disconnectedCallback(){var e,r;v(this,Ot,Pr).call(this),(r=(e=s(this,ie))==null?void 0:e.unassociateElement)==null||r.call(e,this),p(this,ie,null),this.shadowRoot.removeEventListener("focusin",s(this,wt)),this.shadowRoot.removeEventListener("focusout",s(this,Pt)),Dn(this.container,s(this,Ut))}updatePointerBar(e){var r;(r=s(this,X).pointer)==null||r.style.setProperty("width",`${this.getPointerRatio(e)*100}%`)}updateBar(){var r,n;let e=this.range.valueAsNumber*100;(r=s(this,X).progress)==null||r.style.setProperty("width",`${e}%`),(n=s(this,X).thumb)==null||n.style.setProperty("left",`${e}%`)}updateSegments(e){let r=this.shadowRoot.querySelector("#segments-clipping");if(r.textContent="",this.container.classList.toggle("segments",!!(e!=null&&e.length)),!(e!=null&&e.length))return;let n=[...new Set([+this.range.min,...e.flatMap(l=>[l.start,l.end]),+this.range.max])];p(this,Dt,[...n]);let a=n.pop();for(let[l,m]of n.entries()){let[c,h]=[l===0,l===n.length-1],A=c?"calc(var(--segments-gap) / -1)":`${m*100}%`,f=`calc(${((h?a:n[l+1])-m)*100}%${c||h?"":" - var(--segments-gap)"})`,g=b.createElementNS("http://www.w3.org/2000/svg","rect"),_=O(this.shadowRoot,`#segments-clipping rect:nth-child(${l+1})`);_.style.setProperty("x",A),_.style.setProperty("width",f),r.append(g)}}getPointerRatio(e){let r=Pn(e.clientX,e.clientY,s(this,Ct).getBoundingClientRect(),s(this,xt).getBoundingClientRect());return Math.max(0,Math.min(1,r))}get dragging(){return this.hasAttribute("dragging")}handleEvent(e){switch(e.type){case"pointermove":v(this,Ui,Ua).call(this,e);break;case"input":this.updateBar();break;case"pointerenter":v(this,Di,Da).call(this,e);break;case"pointerdown":v(this,Ht,Ur).call(this,e);break;case"pointerup":v(this,wi,wa).call(this);break;case"pointerleave":v(this,Pi,Pa).call(this);break}}get keysUsed(){return["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"]}};ie=new WeakMap,kt=new WeakMap,Ct=new WeakMap,xt=new WeakMap,X=new WeakMap,Dt=new WeakMap,wt=new WeakMap,Pt=new WeakMap,Ut=new WeakMap,xi=new WeakSet,xa=function(e){let r=s(this,X).activeSegment;if(!r)return;let n=this.getPointerRatio(e),l=`#segments-clipping rect:nth-child(${s(this,Dt).findIndex((m,c,h)=>{let A=h[c+1];return A!=null&&n>=m&&n<=A})+1})`;(r.selectorText!=l||!r.style.transform)&&(r.selectorText=l,r.style.setProperty("transform","var(--media-range-segment-hover-transform, scaleY(2))"))},Nt=new WeakSet,wr=function(){this.hasAttribute("disabled")||(this.addEventListener("input",this),this.addEventListener("pointerdown",this),this.addEventListener("pointerenter",this))},Ot=new WeakSet,Pr=function(){var e,r;this.removeEventListener("input",this),this.removeEventListener("pointerdown",this),this.removeEventListener("pointerenter",this),(e=d.window)==null||e.removeEventListener("pointerup",this),(r=d.window)==null||r.removeEventListener("pointermove",this)},Ht=new WeakSet,Ur=function(e){var r;p(this,kt,e.composedPath().includes(this.range)),(r=d.window)==null||r.addEventListener("pointerup",this)},Di=new WeakSet,Da=function(e){var r;e.pointerType!=="mouse"&&v(this,Ht,Ur).call(this,e),this.addEventListener("pointerleave",this),(r=d.window)==null||r.addEventListener("pointermove",this)},wi=new WeakSet,wa=function(){var e;(e=d.window)==null||e.removeEventListener("pointerup",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled")},Pi=new WeakSet,Pa=function(){var e,r;this.removeEventListener("pointerleave",this),(e=d.window)==null||e.removeEventListener("pointermove",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled"),(r=s(this,X).activeSegment)==null||r.style.removeProperty("transform")},Ui=new WeakSet,Ua=function(e){this.toggleAttribute("dragging",e.buttons===1||e.pointerType!=="mouse"),this.updatePointerBar(e),v(this,xi,xa).call(this,e),this.dragging&&(e.pointerType!=="mouse"||!s(this,kt))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(e),this.range.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})))};d.customElements.get("media-chrome-range")||d.customElements.define("media-chrome-range",Se);var Na=Se;var Oa=b.createElement("template");Oa.innerHTML=`
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
`;var re,Ni=class extends d.HTMLElement{constructor(){super();u(this,re,void 0);this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Oa.content.cloneNode(!0)))}static get observedAttributes(){return[S.MEDIA_CONTROLLER]}attributeChangedCallback(e,r,n){var a,l,m,c,h;e===S.MEDIA_CONTROLLER&&(r&&((l=(a=s(this,re))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,re,null)),n&&this.isConnected&&(p(this,re,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,re))==null?void 0:c.associateElement)==null||h.call(c,this)))}connectedCallback(){var r,n,a;let e=this.getAttribute(S.MEDIA_CONTROLLER);e&&(p(this,re,(r=this.getRootNode())==null?void 0:r.getElementById(e)),(a=(n=s(this,re))==null?void 0:n.associateElement)==null||a.call(n,this))}disconnectedCallback(){var e,r;(r=(e=s(this,re))==null?void 0:e.unassociateElement)==null||r.call(e,this),p(this,re,null)}};re=new WeakMap;d.customElements.get("media-control-bar")||d.customElements.define("media-control-bar",Ni);var Ha=Ni;var Fa=b.createElement("template");Fa.innerHTML=`
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
`;var ne,ae=class extends d.HTMLElement{constructor(){super();u(this,ne,void 0);this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(Fa.content.cloneNode(!0)))}static get observedAttributes(){return[S.MEDIA_CONTROLLER]}attributeChangedCallback(e,r,n){var a,l,m,c,h;e===S.MEDIA_CONTROLLER&&(r&&((l=(a=s(this,ne))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,ne,null)),n&&this.isConnected&&(p(this,ne,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,ne))==null?void 0:c.associateElement)==null||h.call(c,this)))}connectedCallback(){var n,a,l;let{style:e}=O(this.shadowRoot,":host");e.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);let r=this.getAttribute(S.MEDIA_CONTROLLER);r&&(p(this,ne,(n=this.getRootNode())==null?void 0:n.getElementById(r)),(l=(a=s(this,ne))==null?void 0:a.associateElement)==null||l.call(a,this))}disconnectedCallback(){var e,r;(r=(e=s(this,ne))==null?void 0:e.unassociateElement)==null||r.call(e,this),p(this,ne,null)}};ne=new WeakMap;d.customElements.get("media-text-display")||d.customElements.define("media-text-display",ae);var it,Oi=class extends ae{constructor(){super();u(this,it,void 0);p(this,it,this.shadowRoot.querySelector("slot")),s(this,it).textContent=J(0)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_DURATION]}attributeChangedCallback(e,r,n){e===o.MEDIA_DURATION&&(s(this,it).textContent=J(+n)),super.attributeChangedCallback(e,r,n)}get mediaDuration(){return P(this,o.MEDIA_DURATION)}set mediaDuration(e){B(this,o.MEDIA_DURATION,e)}};it=new WeakMap;d.customElements.get("media-duration-display")||d.customElements.define("media-duration-display",Oi);var Ba=Oi;var Os=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,Hs=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`,Va=b.createElement("template");Va.innerHTML=`
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
    <slot name="enter">${Os}</slot>
    <slot name="exit">${Hs}</slot>
  </slot>
`;var Fs=`
  <slot name="tooltip-enter">${w.ENTER_FULLSCREEN}</slot>
  <slot name="tooltip-exit">${w.EXIT_FULLSCREEN}</slot>
`,$a=i=>{let t=i.mediaIsFullscreen?N.EXIT_FULLSCREEN():N.ENTER_FULLSCREEN();i.setAttribute("aria-label",t)},Hi=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_FULLSCREEN,o.MEDIA_FULLSCREEN_UNAVAILABLE]}constructor(t={}){super({slotTemplate:Va,tooltipContent:Fs,...t})}connectedCallback(){super.connectedCallback(),$a(this)}attributeChangedCallback(t,e,r){super.attributeChangedCallback(t,e,r),t===o.MEDIA_IS_FULLSCREEN&&$a(this)}get mediaFullscreenUnavailable(){return U(this,o.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(t){x(this,o.MEDIA_FULLSCREEN_UNAVAILABLE,t)}get mediaIsFullscreen(){return C(this,o.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(t){k(this,o.MEDIA_IS_FULLSCREEN,t)}handleClick(){let t=this.mediaIsFullscreen?E.MEDIA_EXIT_FULLSCREEN_REQUEST:E.MEDIA_ENTER_FULLSCREEN_REQUEST;this.dispatchEvent(new d.CustomEvent(t,{composed:!0,bubbles:!0}))}};d.customElements.get("media-fullscreen-button")||d.customElements.define("media-fullscreen-button",Hi);var Ka=Hi;var{MEDIA_TIME_IS_LIVE:Fi,MEDIA_PAUSED:Ft}=o,{MEDIA_SEEK_TO_LIVE_REQUEST:Bs,MEDIA_PLAY_REQUEST:$s}=E,Vs='<svg viewBox="0 0 6 12"><circle cx="3" cy="6" r="2"></circle></svg>',Wa=b.createElement("template");Wa.innerHTML=`
  <style>
  :host { --media-tooltip-display: none; }
  
  slot[name=indicator] > *,
  :host ::slotted([slot=indicator]) {
    
    min-width: auto;
    fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
    color: var(--media-live-button-icon-color, rgb(140, 140, 140));
  }

  :host([${Fi}]:not([${Ft}])) slot[name=indicator] > *,
  :host([${Fi}]:not([${Ft}])) ::slotted([slot=indicator]) {
    fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
    color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
  }

  :host([${Fi}]:not([${Ft}])) {
    cursor: not-allowed;
  }

  </style>

  <slot name="indicator">${Vs}</slot>
  
  <slot name="spacer">&nbsp;</slot><slot name="text">LIVE</slot>
`;var Ga=i=>{let t=i.mediaPaused||!i.mediaTimeIsLive,e=t?N.SEEK_LIVE():N.PLAYING_LIVE();i.setAttribute("aria-label",e),t?i.removeAttribute("aria-disabled"):i.setAttribute("aria-disabled","true")},Bi=class extends F{static get observedAttributes(){return[...super.observedAttributes,Ft,Fi]}constructor(t={}){super({slotTemplate:Wa,...t})}connectedCallback(){Ga(this),super.connectedCallback()}attributeChangedCallback(t,e,r){super.attributeChangedCallback(t,e,r),Ga(this)}get mediaPaused(){return C(this,o.MEDIA_PAUSED)}set mediaPaused(t){k(this,o.MEDIA_PAUSED,t)}get mediaTimeIsLive(){return C(this,o.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(t){k(this,o.MEDIA_TIME_IS_LIVE,t)}handleClick(){!this.mediaPaused&&this.mediaTimeIsLive||(this.dispatchEvent(new d.CustomEvent(Bs,{composed:!0,bubbles:!0})),this.hasAttribute(Ft)&&this.dispatchEvent(new d.CustomEvent($s,{composed:!0,bubbles:!0})))}};d.customElements.get("media-live-button")||d.customElements.define("media-live-button",Bi);var qa=Bi;var Ya={LOADING_DELAY:"loadingdelay"},Qa=500,ja=b.createElement("template"),Ks=`
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
`;ja.innerHTML=`
<style>
:host {
  display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
  vertical-align: middle;
  box-sizing: border-box;
  --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, ${Qa}ms);
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

<slot name="icon">${Ks}</slot>
<div id="status" role="status" aria-live="polite">${G.MEDIA_LOADING()}</div>
`;var oe,Bt,$i=class extends d.HTMLElement{constructor(){super();u(this,oe,void 0);u(this,Bt,Qa);if(!this.shadowRoot){let e=this.attachShadow({mode:"open"}),r=ja.content.cloneNode(!0);e.appendChild(r)}}static get observedAttributes(){return[S.MEDIA_CONTROLLER,o.MEDIA_PAUSED,o.MEDIA_LOADING,Ya.LOADING_DELAY]}attributeChangedCallback(e,r,n){var a,l,m,c,h;e===Ya.LOADING_DELAY&&r!==n?this.loadingDelay=Number(n):e===S.MEDIA_CONTROLLER&&(r&&((l=(a=s(this,oe))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,oe,null)),n&&this.isConnected&&(p(this,oe,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,oe))==null?void 0:c.associateElement)==null||h.call(c,this)))}connectedCallback(){var r,n,a;let e=this.getAttribute(S.MEDIA_CONTROLLER);e&&(p(this,oe,(r=this.getRootNode())==null?void 0:r.getElementById(e)),(a=(n=s(this,oe))==null?void 0:n.associateElement)==null||a.call(n,this))}disconnectedCallback(){var e,r;(r=(e=s(this,oe))==null?void 0:e.unassociateElement)==null||r.call(e,this),p(this,oe,null)}get loadingDelay(){return s(this,Bt)}set loadingDelay(e){p(this,Bt,e);let{style:r}=O(this.shadowRoot,":host");r.setProperty("--_loading-indicator-delay",`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return C(this,o.MEDIA_PAUSED)}set mediaPaused(e){k(this,o.MEDIA_PAUSED,e)}get mediaLoading(){return C(this,o.MEDIA_LOADING)}set mediaLoading(e){k(this,o.MEDIA_LOADING,e)}};oe=new WeakMap,Bt=new WeakMap;d.customElements.get("media-loading-indicator")||d.customElements.define("media-loading-indicator",$i);var za=$i;var{MEDIA_VOLUME_LEVEL:Oe}=o,Gs=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,Xa=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,Ws=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`,Ja=b.createElement("template");Ja.innerHTML=`
  <style>
  
  :host(:not([${Oe}])) slot[name=icon] slot:not([name=high]), 
  :host([${Oe}=high]) slot[name=icon] slot:not([name=high]) {
    display: none !important;
  }

  :host([${Oe}=off]) slot[name=icon] slot:not([name=off]) {
    display: none !important;
  }

  :host([${Oe}=low]) slot[name=icon] slot:not([name=low]) {
    display: none !important;
  }

  :host([${Oe}=medium]) slot[name=icon] slot:not([name=medium]) {
    display: none !important;
  }

  :host(:not([${Oe}=off])) slot[name=tooltip-unmute],
  :host([${Oe}=off]) slot[name=tooltip-mute] {
    display: none;
  }
  </style>

  <slot name="icon">
    <slot name="off">${Gs}</slot>
    <slot name="low">${Xa}</slot>
    <slot name="medium">${Xa}</slot>
    <slot name="high">${Ws}</slot>
  </slot>
`;var qs=`
  <slot name="tooltip-mute">${w.MUTE}</slot>
  <slot name="tooltip-unmute">${w.UNMUTE}</slot>
`,Za=i=>{let e=i.mediaVolumeLevel==="off"?N.UNMUTE():N.MUTE();i.setAttribute("aria-label",e)},Vi=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_VOLUME_LEVEL]}constructor(t={}){super({slotTemplate:Ja,tooltipContent:qs,...t})}connectedCallback(){Za(this),super.connectedCallback()}attributeChangedCallback(t,e,r){t===o.MEDIA_VOLUME_LEVEL&&Za(this),super.attributeChangedCallback(t,e,r)}get mediaVolumeLevel(){return U(this,o.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(t){x(this,o.MEDIA_VOLUME_LEVEL,t)}handleClick(){let t=this.mediaVolumeLevel==="off"?E.MEDIA_UNMUTE_REQUEST:E.MEDIA_MUTE_REQUEST;this.dispatchEvent(new d.CustomEvent(t,{composed:!0,bubbles:!0}))}};d.customElements.get("media-mute-button")||d.customElements.define("media-mute-button",Vi);var eo=Vi;var to=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`,ro=b.createElement("template");ro.innerHTML=`
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
    <slot name="enter">${to}</slot>
    <slot name="exit">${to}</slot>
  </slot>
`;var Ys=`
  <slot name="tooltip-enter">${w.ENTER_PIP}</slot>
  <slot name="tooltip-exit">${w.EXIT_PIP}</slot>
`,io=i=>{let t=i.mediaIsPip?N.EXIT_PIP():N.ENTER_PIP();i.setAttribute("aria-label",t)},Ki=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_IS_PIP,o.MEDIA_PIP_UNAVAILABLE]}constructor(t={}){super({slotTemplate:ro,tooltipContent:Ys,...t})}connectedCallback(){io(this),super.connectedCallback()}attributeChangedCallback(t,e,r){t===o.MEDIA_IS_PIP&&io(this),super.attributeChangedCallback(t,e,r)}get mediaPipUnavailable(){return U(this,o.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(t){x(this,o.MEDIA_PIP_UNAVAILABLE,t)}get mediaIsPip(){return C(this,o.MEDIA_IS_PIP)}set mediaIsPip(t){k(this,o.MEDIA_IS_PIP,t)}handleClick(){let t=this.mediaIsPip?E.MEDIA_EXIT_PIP_REQUEST:E.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new d.CustomEvent(t,{composed:!0,bubbles:!0}))}};d.customElements.get("media-pip-button")||d.customElements.define("media-pip-button",Ki);var no=Ki;var Nr={RATES:"rates"},Qs=[1,1.2,1.5,1.7,2],Gi=1,ao=b.createElement("template");ao.innerHTML=`
  <style>
    :host {
      min-width: 5ch;
      padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
    }
  </style>
  <slot name="icon"></slot>
`;var He,Wi=class extends F{constructor(e={}){super({slotTemplate:ao,tooltipContent:w.PLAYBACK_RATE,...e});u(this,He,new Xe(this,Nr.RATES,{defaultValue:Qs}));this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${Gi}x`}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PLAYBACK_RATE,Nr.RATES]}attributeChangedCallback(e,r,n){if(super.attributeChangedCallback(e,r,n),e===Nr.RATES&&(s(this,He).value=n),e===o.MEDIA_PLAYBACK_RATE){let a=n?+n:Number.NaN,l=Number.isNaN(a)?Gi:a;this.container.innerHTML=`${l}x`,this.setAttribute("aria-label",G.PLAYBACK_RATE({playbackRate:l}))}}get rates(){return s(this,He)}set rates(e){e?Array.isArray(e)&&(s(this,He).value=e.join(" ")):s(this,He).value=""}get mediaPlaybackRate(){return P(this,o.MEDIA_PLAYBACK_RATE,Gi)}set mediaPlaybackRate(e){B(this,o.MEDIA_PLAYBACK_RATE,e)}handleClick(){var a,l;let e=Array.from(this.rates.values(),m=>+m).sort((m,c)=>m-c),r=(l=(a=e.find(m=>m>this.mediaPlaybackRate))!=null?a:e[0])!=null?l:Gi,n=new d.CustomEvent(E.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r});this.dispatchEvent(n)}};He=new WeakMap;d.customElements.get("media-playback-rate-button")||d.customElements.define("media-playback-rate-button",Wi);var oo=Wi;var js=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,zs=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`,lo=b.createElement("template");lo.innerHTML=`
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
    <slot name="play">${js}</slot>
    <slot name="pause">${zs}</slot>
  </slot>
`;var Xs=`
  <slot name="tooltip-play">${w.PLAY}</slot>
  <slot name="tooltip-pause">${w.PAUSE}</slot>
`,so=i=>{let t=i.mediaPaused?N.PLAY():N.PAUSE();i.setAttribute("aria-label",t)},qi=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PAUSED,o.MEDIA_ENDED]}constructor(t={}){super({slotTemplate:lo,tooltipContent:Xs,...t})}connectedCallback(){so(this),super.connectedCallback()}attributeChangedCallback(t,e,r){t===o.MEDIA_PAUSED&&so(this),super.attributeChangedCallback(t,e,r)}get mediaPaused(){return C(this,o.MEDIA_PAUSED)}set mediaPaused(t){k(this,o.MEDIA_PAUSED,t)}handleClick(){let t=this.mediaPaused?E.MEDIA_PLAY_REQUEST:E.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new d.CustomEvent(t,{composed:!0,bubbles:!0}))}};d.customElements.get("media-play-button")||d.customElements.define("media-play-button",qi);var mo=qi;var ce={PLACEHOLDER_SRC:"placeholdersrc",SRC:"src"},co=b.createElement("template");co.innerHTML=`
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
`;var Zs=i=>{i.style.removeProperty("background-image")},Js=(i,t)=>{i.style["background-image"]=`url('${t}')`},Yi=class extends d.HTMLElement{static get observedAttributes(){return[ce.PLACEHOLDER_SRC,ce.SRC]}constructor(){super(),this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(co.content.cloneNode(!0))),this.image=this.shadowRoot.querySelector("#image")}attributeChangedCallback(t,e,r){t===ce.SRC&&(r==null?this.image.removeAttribute(ce.SRC):this.image.setAttribute(ce.SRC,r)),t===ce.PLACEHOLDER_SRC&&(r==null?Zs(this.image):Js(this.image,r))}get placeholderSrc(){return U(this,ce.PLACEHOLDER_SRC)}set placeholderSrc(t){x(this,ce.SRC,t)}get src(){return U(this,ce.SRC)}set src(t){x(this,ce.SRC,t)}};d.customElements.get("media-poster-image")||d.customElements.define("media-poster-image",Yi);var uo=Yi;var $t,Qi=class extends ae{constructor(){super();u(this,$t,void 0);p(this,$t,this.shadowRoot.querySelector("slot"))}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PREVIEW_CHAPTER]}attributeChangedCallback(e,r,n){super.attributeChangedCallback(e,r,n),e===o.MEDIA_PREVIEW_CHAPTER&&n!==r&&n!=null&&(s(this,$t).textContent=n,n!==""?this.setAttribute("aria-valuetext",`chapter: ${n}`):this.removeAttribute("aria-valuetext"))}get mediaPreviewChapter(){return U(this,o.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){x(this,o.MEDIA_PREVIEW_CHAPTER,e)}};$t=new WeakMap;d.customElements.get("media-preview-chapter-display")||d.customElements.define("media-preview-chapter-display",Qi);var po=Qi;var ho=b.createElement("template");ho.innerHTML=`
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
`;var se,ji=class extends d.HTMLElement{constructor(){super();u(this,se,void 0);this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(ho.content.cloneNode(!0)))}static get observedAttributes(){return[S.MEDIA_CONTROLLER,o.MEDIA_PREVIEW_IMAGE,o.MEDIA_PREVIEW_COORDS]}connectedCallback(){var r,n,a;let e=this.getAttribute(S.MEDIA_CONTROLLER);e&&(p(this,se,(r=this.getRootNode())==null?void 0:r.getElementById(e)),(a=(n=s(this,se))==null?void 0:n.associateElement)==null||a.call(n,this))}disconnectedCallback(){var e,r;(r=(e=s(this,se))==null?void 0:e.unassociateElement)==null||r.call(e,this),p(this,se,null)}attributeChangedCallback(e,r,n){var a,l,m,c,h;[o.MEDIA_PREVIEW_IMAGE,o.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===S.MEDIA_CONTROLLER&&(r&&((l=(a=s(this,se))==null?void 0:a.unassociateElement)==null||l.call(a,this),p(this,se,null)),n&&this.isConnected&&(p(this,se,(m=this.getRootNode())==null?void 0:m.getElementById(n)),(h=(c=s(this,se))==null?void 0:c.associateElement)==null||h.call(c,this)))}get mediaPreviewImage(){return U(this,o.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){x(this,o.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){let e=this.getAttribute(o.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(r=>+r)}set mediaPreviewCoords(e){if(!e){this.removeAttribute(o.MEDIA_PREVIEW_COORDS);return}this.setAttribute(o.MEDIA_PREVIEW_COORDS,e.join(" "))}update(){let e=this.mediaPreviewCoords,r=this.mediaPreviewImage;if(!(e&&r))return;let[n,a,l,m]=e,c=r.split("#")[0],h=getComputedStyle(this),{maxWidth:A,maxHeight:T,minWidth:f,minHeight:g}=h,_=Math.min(parseInt(A)/l,parseInt(T)/m),I=Math.max(parseInt(f)/l,parseInt(g)/m),M=_<1,L=M?_:I>1?I:1,{style:K}=O(this.shadowRoot,":host"),ue=O(this.shadowRoot,"img").style,be=this.shadowRoot.querySelector("img"),ut=M?"min":"max";K.setProperty(`${ut}-width`,"initial","important"),K.setProperty(`${ut}-height`,"initial","important"),K.width=`${l*L}px`,K.height=`${m*L}px`;let qe=()=>{ue.width=`${this.imgWidth*L}px`,ue.height=`${this.imgHeight*L}px`,ue.display="block"};be.src!==c&&(be.onload=()=>{this.imgWidth=be.naturalWidth,this.imgHeight=be.naturalHeight,qe()},be.src=c,qe()),qe(),ue.transform=`translate(-${n*L}px, -${a*L}px)`}};se=new WeakMap;d.customElements.get("media-preview-thumbnail")||d.customElements.define("media-preview-thumbnail",ji);var Eo=ji;var rt,zi=class extends ae{constructor(){super();u(this,rt,void 0);p(this,rt,this.shadowRoot.querySelector("slot")),s(this,rt).textContent=J(0)}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,r,n){super.attributeChangedCallback(e,r,n),e===o.MEDIA_PREVIEW_TIME&&n!=null&&(s(this,rt).textContent=J(parseFloat(n)))}get mediaPreviewTime(){return P(this,o.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){B(this,o.MEDIA_PREVIEW_TIME,e)}};rt=new WeakMap;d.customElements.get("media-preview-time-display")||d.customElements.define("media-preview-time-display",zi);var bo=zi;var nt={SEEK_OFFSET:"seekoffset"},Xi=30,el=`<svg aria-hidden="true" viewBox="0 0 20 24"><defs><style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style></defs><text class="text value" transform="translate(2.18 19.87)">${Xi}</text><path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/></svg>`,go=b.createElement("template");go.innerHTML=`
  <slot name="icon">${el}</slot>
`;var tl=0,Zi=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_CURRENT_TIME,nt.SEEK_OFFSET]}constructor(t={}){super({slotTemplate:go,tooltipContent:w.SEEK_BACKWARD,...t})}connectedCallback(){this.seekOffset=P(this,nt.SEEK_OFFSET,Xi),super.connectedCallback()}attributeChangedCallback(t,e,r){t===nt.SEEK_OFFSET&&(this.seekOffset=P(this,nt.SEEK_OFFSET,Xi)),super.attributeChangedCallback(t,e,r)}get seekOffset(){return P(this,nt.SEEK_OFFSET,Xi)}set seekOffset(t){B(this,nt.SEEK_OFFSET,t),this.setAttribute("aria-label",N.SEEK_BACK_N_SECS({seekOffset:this.seekOffset})),di(mi(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return P(this,o.MEDIA_CURRENT_TIME,tl)}set mediaCurrentTime(t){B(this,o.MEDIA_CURRENT_TIME,t)}handleClick(){let t=Math.max(this.mediaCurrentTime-this.seekOffset,0),e=new d.CustomEvent(E.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(e)}};d.customElements.get("media-seek-backward-button")||d.customElements.define("media-seek-backward-button",Zi);var fo=Zi;var at={SEEK_OFFSET:"seekoffset"},Ji=30,il=`<svg aria-hidden="true" viewBox="0 0 20 24"><defs><style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style></defs><text class="text value" transform="translate(8.9 19.87)">${Ji}</text><path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/></svg>`,vo=b.createElement("template");vo.innerHTML=`
  <slot name="icon">${il}</slot>
`;var rl=0,er=class extends F{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_CURRENT_TIME,at.SEEK_OFFSET]}constructor(t={}){super({slotTemplate:vo,tooltipContent:w.SEEK_FORWARD,...t})}connectedCallback(){this.seekOffset=P(this,at.SEEK_OFFSET,Ji),super.connectedCallback()}attributeChangedCallback(t,e,r){t===at.SEEK_OFFSET&&(this.seekOffset=P(this,at.SEEK_OFFSET,Ji)),super.attributeChangedCallback(t,e,r)}get seekOffset(){return P(this,at.SEEK_OFFSET,Ji)}set seekOffset(t){B(this,at.SEEK_OFFSET,t),this.setAttribute("aria-label",N.SEEK_FORWARD_N_SECS({seekOffset:this.seekOffset})),di(mi(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return P(this,o.MEDIA_CURRENT_TIME,rl)}set mediaCurrentTime(t){B(this,o.MEDIA_CURRENT_TIME,t)}handleClick(){let t=this.mediaCurrentTime+this.seekOffset,e=new d.CustomEvent(E.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(e)}};d.customElements.get("media-seek-forward-button")||d.customElements.define("media-seek-forward-button",er);var Ao=er;var le={REMAINING:"remaining",SHOW_DURATION:"showduration",NO_TOGGLE:"notoggle"},To=[...Object.values(le),o.MEDIA_CURRENT_TIME,o.MEDIA_DURATION,o.MEDIA_SEEKABLE],Io=["Enter"," "],nl="&nbsp;/&nbsp;",So=(i,{timesSep:t=nl}={})=>{var c,h;let e=i.hasAttribute(le.REMAINING),r=i.hasAttribute(le.SHOW_DURATION),n=(c=i.mediaCurrentTime)!=null?c:0,[,a]=(h=i.mediaSeekable)!=null?h:[],l=0;Number.isFinite(i.mediaDuration)?l=i.mediaDuration:Number.isFinite(a)&&(l=a);let m=e?J(0-(l-n)):J(n);return r?`${m}${t}${J(l)}`:m},al="video not loaded, unknown time.",ol=i=>{var h;let t=i.mediaCurrentTime,[,e]=(h=i.mediaSeekable)!=null?h:[],r=null;if(Number.isFinite(i.mediaDuration)?r=i.mediaDuration:Number.isFinite(e)&&(r=e),t==null||r===null){i.setAttribute("aria-valuetext",al);return}let n=i.hasAttribute(le.REMAINING),a=i.hasAttribute(le.SHOW_DURATION),l=n?fe(0-(r-t)):fe(t);if(!a){i.setAttribute("aria-valuetext",l);return}let m=fe(r),c=`${l} of ${m}`;i.setAttribute("aria-valuetext",c)},Fe,tr=class extends ae{constructor(){super();u(this,Fe,void 0);p(this,Fe,this.shadowRoot.querySelector("slot")),s(this,Fe).innerHTML=`${So(this)}`}static get observedAttributes(){return[...super.observedAttributes,...To,"disabled"]}connectedCallback(){let{style:e}=O(this.shadowRoot,":host(:hover:not([notoggle]))");e.setProperty("cursor","pointer"),e.setProperty("background","var(--media-control-hover-background, rgba(50 50 70 / .7))"),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","progressbar"),this.setAttribute("aria-label",G.PLAYBACK_TIME());let r=n=>{let{key:a}=n;if(!Io.includes(a)){this.removeEventListener("keyup",r);return}this.toggleTimeDisplay()};this.addEventListener("keydown",n=>{let{metaKey:a,altKey:l,key:m}=n;if(a||l||!Io.includes(m)){this.removeEventListener("keyup",r);return}this.addEventListener("keyup",r)}),this.addEventListener("click",this.toggleTimeDisplay),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute("remaining")?this.removeAttribute("remaining"):this.setAttribute("remaining",""))}disconnectedCallback(){this.disable(),super.disconnectedCallback()}attributeChangedCallback(e,r,n){To.includes(e)?this.update():e==="disabled"&&n!==r&&(n==null?this.enable():this.disable()),super.attributeChangedCallback(e,r,n)}enable(){this.tabIndex=0}disable(){this.tabIndex=-1}get remaining(){return C(this,le.REMAINING)}set remaining(e){k(this,le.REMAINING,e)}get showDuration(){return C(this,le.SHOW_DURATION)}set showDuration(e){k(this,le.SHOW_DURATION,e)}get noToggle(){return C(this,le.NO_TOGGLE)}set noToggle(e){k(this,le.NO_TOGGLE,e)}get mediaDuration(){return P(this,o.MEDIA_DURATION)}set mediaDuration(e){B(this,o.MEDIA_DURATION,e)}get mediaCurrentTime(){return P(this,o.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){B(this,o.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){let e=this.getAttribute(o.MEDIA_SEEKABLE);if(e)return e.split(":").map(r=>+r)}set mediaSeekable(e){if(e==null){this.removeAttribute(o.MEDIA_SEEKABLE);return}this.setAttribute(o.MEDIA_SEEKABLE,e.join(":"))}update(){let e=So(this);ol(this),e!==s(this,Fe).innerHTML&&(s(this,Fe).innerHTML=e)}};Fe=new WeakMap;d.customElements.get("media-time-display")||d.customElements.define("media-time-display",tr);var yo=tr;var Be,Vt,$e,ot,Kt,Gt,Wt,Ve,ye,qt,ir=class{constructor(t,e,r){u(this,Be,void 0);u(this,Vt,void 0);u(this,$e,void 0);u(this,ot,void 0);u(this,Kt,void 0);u(this,Gt,void 0);u(this,Wt,void 0);u(this,Ve,void 0);u(this,ye,0);u(this,qt,(t=performance.now())=>{p(this,ye,requestAnimationFrame(s(this,qt))),p(this,ot,performance.now()-s(this,$e));let e=1e3/this.fps;if(s(this,ot)>e){p(this,$e,t-s(this,ot)%e);let r=1e3/((t-s(this,Vt))/++An(this,Kt)._),n=(t-s(this,Gt))/1e3/this.duration,a=s(this,Wt)+n*this.playbackRate;a-s(this,Be).valueAsNumber>0?p(this,Ve,this.playbackRate/this.duration/r):(p(this,Ve,.995*s(this,Ve)),a=s(this,Be).valueAsNumber+s(this,Ve)),this.callback(a)}});p(this,Be,t),this.callback=e,this.fps=r}start(){s(this,ye)===0&&(p(this,$e,performance.now()),p(this,Vt,s(this,$e)),p(this,Kt,0),s(this,qt).call(this))}stop(){s(this,ye)!==0&&(cancelAnimationFrame(s(this,ye)),p(this,ye,0))}update({start:t,duration:e,playbackRate:r}){let n=t-s(this,Be).valueAsNumber,a=Math.abs(e-this.duration);(n>0||n<-.03||a>=.5)&&this.callback(t),p(this,Wt,t),p(this,Gt,performance.now()),this.duration=e,this.playbackRate=r}};Be=new WeakMap,Vt=new WeakMap,$e=new WeakMap,ot=new WeakMap,Kt=new WeakMap,Gt=new WeakMap,Wt=new WeakMap,Ve=new WeakMap,ye=new WeakMap,qt=new WeakMap;var sl="video not loaded, unknown time.",ll=i=>{let t=i.range,e=fe(+_o(i)),r=fe(+i.mediaSeekableEnd),n=e&&r?`${e} of ${r}`:sl;t.setAttribute("aria-valuetext",n)},Mo=b.createElement("template");Mo.innerHTML=`
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
`;var rr=(i,t=i.mediaCurrentTime)=>{let e=Number.isFinite(i.mediaSeekableStart)?i.mediaSeekableStart:0,r=Number.isFinite(i.mediaDuration)?i.mediaDuration:i.mediaSeekableEnd;if(Number.isNaN(r))return 0;let n=(t-e)/(r-e);return Math.max(0,Math.min(n,1))},_o=(i,t=i.range.valueAsNumber)=>{let e=Number.isFinite(i.mediaSeekableStart)?i.mediaSeekableStart:0,r=Number.isFinite(i.mediaDuration)?i.mediaDuration:i.mediaSeekableEnd;return Number.isNaN(r)?0:t*(r-e)+e},Ke,Me,Qt,st,jt,zt,lt,dt,Ge,We,Yt,or,Lo,sr,Xt,Or,Zt,Hr,Jt,Fr,lr,Ro,mt,nr,dr,ko,ar=class extends Se{constructor(){super();u(this,We);u(this,or);u(this,Xt);u(this,Zt);u(this,Jt);u(this,lr);u(this,mt);u(this,dr);u(this,Ke,void 0);u(this,Me,void 0);u(this,Qt,void 0);u(this,st,void 0);u(this,jt,void 0);u(this,zt,void 0);u(this,lt,void 0);u(this,dt,void 0);u(this,Ge,void 0);u(this,sr,e=>{this.dragging||(Qe(e)&&(this.range.valueAsNumber=e),this.updateBar())});this.container.appendChild(Mo.content.cloneNode(!0)),this.shadowRoot.querySelector("#track").insertAdjacentHTML("afterbegin",'<div id="buffered" part="buffered"></div>'),p(this,Qt,this.shadowRoot.querySelectorAll('[part~="box"]')),p(this,jt,this.shadowRoot.querySelector('[part~="preview-box"]')),p(this,zt,this.shadowRoot.querySelector('[part~="current-box"]'));let r=getComputedStyle(this);p(this,lt,parseInt(r.getPropertyValue("--media-box-padding-left"))),p(this,dt,parseInt(r.getPropertyValue("--media-box-padding-right"))),p(this,Me,new ir(this.range,s(this,sr),60))}static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_PAUSED,o.MEDIA_DURATION,o.MEDIA_SEEKABLE,o.MEDIA_CURRENT_TIME,o.MEDIA_PREVIEW_IMAGE,o.MEDIA_PREVIEW_TIME,o.MEDIA_PREVIEW_CHAPTER,o.MEDIA_BUFFERED,o.MEDIA_PLAYBACK_RATE,o.MEDIA_LOADING,o.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute("aria-label",G.SEEK()),v(this,We,Yt).call(this),p(this,Ke,this.getRootNode()),(e=s(this,Ke))==null||e.addEventListener("transitionstart",this)}disconnectedCallback(){var e;super.disconnectedCallback(),v(this,We,Yt).call(this),(e=s(this,Ke))==null||e.removeEventListener("transitionstart",this),p(this,Ke,null)}attributeChangedCallback(e,r,n){super.attributeChangedCallback(e,r,n),r!=n&&(e===o.MEDIA_CURRENT_TIME||e===o.MEDIA_PAUSED||e===o.MEDIA_ENDED||e===o.MEDIA_LOADING||e===o.MEDIA_DURATION||e===o.MEDIA_SEEKABLE?(s(this,Me).update({start:rr(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),v(this,We,Yt).call(this),ll(this)):e===o.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===o.MEDIA_DURATION||e===o.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=s(this,Ge),this.updateBar()))}get mediaChaptersCues(){return s(this,Ge)}set mediaChaptersCues(e){var r;p(this,Ge,e),this.updateSegments((r=s(this,Ge))==null?void 0:r.map(n=>({start:rr(this,n.startTime),end:rr(this,n.endTime)})))}get mediaPaused(){return C(this,o.MEDIA_PAUSED)}set mediaPaused(e){k(this,o.MEDIA_PAUSED,e)}get mediaLoading(){return C(this,o.MEDIA_LOADING)}set mediaLoading(e){k(this,o.MEDIA_LOADING,e)}get mediaDuration(){return P(this,o.MEDIA_DURATION)}set mediaDuration(e){B(this,o.MEDIA_DURATION,e)}get mediaCurrentTime(){return P(this,o.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){B(this,o.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return P(this,o.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){B(this,o.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){let e=this.getAttribute(o.MEDIA_BUFFERED);return e?e.split(" ").map(r=>r.split(":").map(n=>+n)):[]}set mediaBuffered(e){if(!e){this.removeAttribute(o.MEDIA_BUFFERED);return}let r=e.map(n=>n.join(":")).join(" ");this.setAttribute(o.MEDIA_BUFFERED,r)}get mediaSeekable(){let e=this.getAttribute(o.MEDIA_SEEKABLE);if(e)return e.split(":").map(r=>+r)}set mediaSeekable(e){if(e==null){this.removeAttribute(o.MEDIA_SEEKABLE);return}this.setAttribute(o.MEDIA_SEEKABLE,e.join(":"))}get mediaSeekableEnd(){var r;let[,e=this.mediaDuration]=(r=this.mediaSeekable)!=null?r:[];return e}get mediaSeekableStart(){var r;let[e=0]=(r=this.mediaSeekable)!=null?r:[];return e}get mediaPreviewImage(){return U(this,o.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){x(this,o.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return P(this,o.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){B(this,o.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return C(this,o.MEDIA_ENDED)}set mediaEnded(e){k(this,o.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){var a;let e=this.mediaBuffered;if(!e.length)return;let r;if(this.mediaEnded)r=1;else{let l=this.mediaCurrentTime,[,m=this.mediaSeekableStart]=(a=e.find(([c,h])=>c<=l&&l<=h))!=null?a:[];r=rr(this,m)}let{style:n}=O(this.shadowRoot,"#buffered");n.setProperty("width",`${r*100}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector('slot[name="current"]').assignedElements().length)return;let r=O(this.shadowRoot,"#current-rail"),n=O(this.shadowRoot,'[part~="current-box"]'),a=v(this,Xt,Or).call(this,s(this,zt)),l=v(this,Zt,Hr).call(this,a,this.range.valueAsNumber),m=v(this,Jt,Fr).call(this,a,this.range.valueAsNumber);r.style.transform=`translateX(${l})`,r.style.setProperty("--_range-width",`${a.range.width}`),n.style.setProperty("--_box-shift",`${m}`),n.style.setProperty("--_box-width",`${a.box.width}px`),n.style.setProperty("visibility","initial")}handleEvent(e){switch(super.handleEvent(e),e.type){case"input":v(this,dr,ko).call(this);break;case"pointermove":v(this,lr,Ro).call(this,e);break;case"pointerup":case"pointerleave":v(this,mt,nr).call(this,null);break;case"transitionstart":de(e.target,this)&&setTimeout(()=>v(this,We,Yt).call(this),0);break}}};Ke=new WeakMap,Me=new WeakMap,Qt=new WeakMap,st=new WeakMap,jt=new WeakMap,zt=new WeakMap,lt=new WeakMap,dt=new WeakMap,Ge=new WeakMap,We=new WeakSet,Yt=function(){v(this,or,Lo).call(this)?s(this,Me).start():s(this,Me).stop()},or=new WeakSet,Lo=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&ci(this)},sr=new WeakMap,Xt=new WeakSet,Or=function(e){var h;let n=((h=this.getAttribute("bounds")?ve(this,`#${this.getAttribute("bounds")}`):this.parentElement)!=null?h:this).getBoundingClientRect(),a=this.range.getBoundingClientRect(),l=e.offsetWidth,m=-(a.left-n.left-l/2),c=n.right-a.left-l/2;return{box:{width:l,min:m,max:c},bounds:n,range:a}},Zt=new WeakSet,Hr=function(e,r){let n=`${r*100}%`,{width:a,min:l,max:m}=e.box;if(!a)return n;if(Number.isNaN(l)||(n=`max(${`calc(1 / var(--_range-width) * 100 * ${l}% + var(--media-box-padding-left))`}, ${n})`),!Number.isNaN(m)){let h=`calc(1 / var(--_range-width) * 100 * ${m}% - var(--media-box-padding-right))`;n=`min(${n}, ${h})`}return n},Jt=new WeakSet,Fr=function(e,r){let{width:n,min:a,max:l}=e.box,m=r*e.range.width;if(m<a+s(this,lt)){let c=e.range.left-e.bounds.left-s(this,lt);return`${m-n/2+c}px`}if(m>l-s(this,dt)){let c=e.bounds.right-e.range.right-s(this,dt);return`${m+n/2-c-e.range.width}px`}return 0},lr=new WeakSet,Ro=function(e){let r=[...s(this,Qt)].some(f=>e.composedPath().includes(f));if(!this.dragging&&(r||!e.composedPath().includes(this))){v(this,mt,nr).call(this,null);return}let n=this.mediaSeekableEnd;if(!n)return;let a=O(this.shadowRoot,"#preview-rail"),l=O(this.shadowRoot,'[part~="preview-box"]'),m=v(this,Xt,Or).call(this,s(this,jt)),c=(e.clientX-m.range.left)/m.range.width;c=Math.max(0,Math.min(1,c));let h=v(this,Zt,Hr).call(this,m,c),A=v(this,Jt,Fr).call(this,m,c);a.style.transform=`translateX(${h})`,a.style.setProperty("--_range-width",`${m.range.width}`),l.style.setProperty("--_box-shift",`${A}`),l.style.setProperty("--_box-width",`${m.box.width}px`);let T=Math.round(s(this,st))-Math.round(c*n);Math.abs(T)<1&&c>.01&&c<.99||(p(this,st,c*n),v(this,mt,nr).call(this,s(this,st)))},mt=new WeakSet,nr=function(e){this.dispatchEvent(new d.CustomEvent(E.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:e}))},dr=new WeakSet,ko=function(){s(this,Me).stop();let e=_o(this);this.dispatchEvent(new d.CustomEvent(E.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e}))};d.customElements.get("media-time-range")||d.customElements.define("media-time-range",ar);var Co=ar;var ct={PLACEMENT:"placement",BOUNDS:"bounds"},xo=b.createElement("template");xo.innerHTML=`
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
`;var mr=class extends d.HTMLElement{constructor(){super();this.updateXOffset=()=>{var L;if(!ci(this,{checkOpacity:!1,checkVisibilityCSS:!1}))return;let e=this.placement;if(e==="left"||e==="right"){this.style.removeProperty("--media-tooltip-offset-x");return}let r=getComputedStyle(this),n=(L=ve(this,"#"+this.bounds))!=null?L:wn(this);if(!n)return;let{x:a,width:l}=n.getBoundingClientRect(),{x:m,width:c}=this.getBoundingClientRect(),h=m+c,A=a+l,T=r.getPropertyValue("--media-tooltip-offset-x"),f=T?parseFloat(T.replace("px","")):0,g=r.getPropertyValue("--media-tooltip-container-margin"),_=g?parseFloat(g.replace("px","")):0,I=m-a+f-_,M=h-A+f+_;if(I<0){this.style.setProperty("--media-tooltip-offset-x",`${I}px`);return}if(M>0){this.style.setProperty("--media-tooltip-offset-x",`${M}px`);return}this.style.removeProperty("--media-tooltip-offset-x")};if(this.shadowRoot||(this.attachShadow({mode:"open"}),this.shadowRoot.appendChild(xo.content.cloneNode(!0))),this.arrowEl=this.shadowRoot.querySelector("#arrow"),Object.prototype.hasOwnProperty.call(this,"placement")){let e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[ct.PLACEMENT,ct.BOUNDS]}get placement(){return U(this,ct.PLACEMENT)}set placement(e){x(this,ct.PLACEMENT,e)}get bounds(){return U(this,ct.BOUNDS)}set bounds(e){x(this,ct.BOUNDS,e)}};d.customElements.get("media-tooltip")||d.customElements.define("media-tooltip",mr);var Do=mr;var dl=1,ml=i=>i.mediaMuted?0:i.mediaVolume,cl=i=>`${Math.round(i*100)}%`,cr=class extends Se{static get observedAttributes(){return[...super.observedAttributes,o.MEDIA_VOLUME,o.MEDIA_MUTED,o.MEDIA_VOLUME_UNAVAILABLE]}constructor(){super(),this.range.addEventListener("input",()=>{let t=this.range.value,e=new d.CustomEvent(E.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(e)})}connectedCallback(){super.connectedCallback(),this.range.setAttribute("aria-label",G.VOLUME())}attributeChangedCallback(t,e,r){super.attributeChangedCallback(t,e,r),(t===o.MEDIA_VOLUME||t===o.MEDIA_MUTED)&&(this.range.valueAsNumber=ml(this),this.range.setAttribute("aria-valuetext",cl(this.range.valueAsNumber)),this.updateBar())}get mediaVolume(){return P(this,o.MEDIA_VOLUME,dl)}set mediaVolume(t){B(this,o.MEDIA_VOLUME,t)}get mediaMuted(){return C(this,o.MEDIA_MUTED)}set mediaMuted(t){k(this,o.MEDIA_MUTED,t)}get mediaVolumeUnavailable(){return U(this,o.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(t){x(this,o.MEDIA_VOLUME_UNAVAILABLE,t)}};d.customElements.get("media-volume-range")||d.customElements.define("media-volume-range",cr);var wo=cr;return Wo(ul);})();
//# sourceMappingURL=index.js.map
