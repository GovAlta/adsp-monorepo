import{r as c,j as a,cT as Q0,cU as Ft,cV as J,cW as re,cX as xe,cY as oe,cZ as Fe,c_ as _t,c$ as Wt,d0 as X0,d1 as J0,d2 as De,d3 as q1,d4 as P0,d5 as en,d6 as tn,d7 as Rt,d8 as G1,d9 as K1,da as Y1,db as nn,dc as A0,dd as on,de as Z1,df as ze,dg as an,dh as h,e as m,di as E,dj as Q1,dk as X1,dl as J1,dm as P1,dn as ie,dp as eo,dq as rn,dr as sn,ds as to,dt as cn,du as no,dv as oo,dw as ln,dx as ao,dy as dn,dz as ro,dA as so,dB as io,dC as co,dD as lo,dE as ho,dF as uo,dG as go,dH as fo,dI as mo,dJ as xo,dK as wo,dL as vo,dM as bo,dN as po,dO as $o,dP as Co,dQ as jo,dR as yo,dS as So,dT as It,dU as Ut,dV as At,dW as Mt,dX as Ro,dY as Io,dZ as Ao,d_ as Mo,d$ as To,e0 as Vo,e1 as hn,e2 as Eo,e3 as un,e4 as Lo,e5 as Ho,e6 as Bo,e7 as Do,e8 as zo,e9 as gn,ea as fn,eb as ko,ec as No,ed as Oo,ee as Fo,ef as _o,eg as Wo,eh as Uo,ei as qo,ej as Go,ek as Ko,el as Yo,em as Zo,en as Qo,eo as Xo,ep as Jo,eq as Po,er as ea,es as ta,et as na,eu as oa,ev as aa,ew as ra,ex as sa,ey as ia,ez as ca,eA as la,eB as mn,eC as da,eD as ha,eE as ua,eF as ga,eG as fa,eH as ma,eI as xa}from"./strapi-CZE0NOhr.js";function wa(e){const t=`${e}CollectionProvider`,[o,r]=P0(t),[n,s]=o(t,{collectionRef:{current:null},itemMap:new Map,listeners:new Set}),i=x=>{const{scope:v,children:b}=x,C=c.useRef(null),$=c.useRef(new Map).current,p=c.useRef(new Set).current;return a.jsx(n,{scope:v,itemMap:$,collectionRef:C,listeners:p,children:b})};i.displayName=t;const l=`${e}CollectionSlot`,d=c.forwardRef((x,v)=>{const{scope:b,children:C}=x,$=s(l,b),p=re(v,$.collectionRef);return a.jsx(Rt,{ref:p,children:C})});d.displayName=l;const f=`${e}CollectionItemSlot`,u="data-radix-collection-item",w=c.forwardRef((x,v)=>{const{scope:b,children:C,...$}=x,p=c.useRef(null),j=re(v,p),y=s(f,b);return c.useEffect(()=>{const S=Array.from(y.itemMap.values());return y.itemMap.set(p,{ref:p,...$}),y.listeners.forEach(I=>I(Array.from(y.itemMap.values()),S)),()=>{const I=Array.from(y.itemMap.values());y.itemMap.delete(p),y.listeners.forEach(R=>R(Array.from(y.itemMap.values()),I))}}),a.jsx(Rt,{[u]:"",ref:j,children:C})});w.displayName=f;function g(x){const v=s(`${e}CollectionConsumer`,x),b=c.useCallback(()=>{const $=v.collectionRef.current;if(!$)return[];const p=Array.from($.querySelectorAll(`[${u}]`));return Array.from(v.itemMap.values()).sort((S,I)=>p.indexOf(S.ref.current)-p.indexOf(I.ref.current))},[v.collectionRef,v.itemMap]),C=c.useCallback($=>(v.listeners.add($),()=>v.listeners.delete($)),[v.listeners]);return{getItems:b,subscribe:C}}return[{Provider:i,Slot:d,ItemSlot:w},g,r]}const jt=new Map;function va(e,t){const o=e+(t?Object.entries(t).sort((n,s)=>n[0]<s[0]?-1:1).join():"");if(jt.has(o))return jt.get(o);const r=new Intl.Collator(e,t);return jt.set(o,r),r}function qt(e,t){const o=va(e,{usage:"search",...t});return{startsWith(r,n){return n.length===0?!0:(r=r.normalize("NFC"),n=n.normalize("NFC"),o.compare(r.slice(0,n.length),n)===0)},endsWith(r,n){return n.length===0?!0:(r=r.normalize("NFC"),n=n.normalize("NFC"),o.compare(r.slice(-n.length),n)===0)},contains(r,n){if(n.length===0)return!0;r=r.normalize("NFC"),n=n.normalize("NFC");let s=0;const i=n.length;for(;s+i<=r.length;s++){const l=r.slice(s,s+i);if(o.compare(n,l)===0)return!0}return!1}}}const ba=e=>{const t=c.useRef();return c.useEffect(()=>{t.current=e}),t.current},pa=[" ","Enter","ArrowUp","ArrowDown"],$a=["Enter"],Ca=e=>!!(e.length===1&&e.match(/\S| /)),xn="Combobox",[ke,Je]=wa(xn),[ja,je]=nn(xn),ya=({children:e})=>a.jsx(an,{children:a.jsx(ke.Provider,{scope:void 0,children:e})}),Sa=e=>typeof e=="string"?e==="none"?{type:e,filter:void 0}:{type:e,filter:"startsWith"}:e,Ra=e=>{const{allowCustomValue:t=!1,autocomplete:o="none",children:r,open:n,defaultOpen:s,onOpenChange:i,value:l,defaultValue:d,onValueChange:f,disabled:u,required:w=!1,locale:g="en-EN",onTextValueChange:x,textValue:v,defaultTextValue:b,filterValue:C,defaultFilterValue:$,onFilterValueChange:p,isPrintableCharacter:j=Ca,visible:y=!1}=e,[S,I]=c.useState(null),[R,N]=c.useState(null),[H,z]=c.useState(null),[_,L]=c.useState(null),[V=!1,B]=ze({prop:n,defaultProp:s,onChange:i}),[U,K]=ze({prop:l,defaultProp:d,onChange:f}),[G,Y]=ze({prop:v,defaultProp:t&&!b?l:b,onChange:x}),[Z,te]=ze({prop:C,defaultProp:$,onChange:p}),Q=De(),se=c.useCallback((ae,ee)=>{const ue=ee.map(D=>D.ref.current),[T,...W]=ue,[X]=W.slice(-1),F=_??ee.find(D=>D.value===U)?.ref.current;for(const D of ae){if(D===F)return;if(D?.scrollIntoView({block:"nearest"}),D===T&&R&&(R.scrollTop=0),D===X&&R&&(R.scrollTop=R.scrollHeight),L(D),o==="both"){const q=ee.find(le=>le.ref.current===D);q&&Y(q.textValue)}if(D!==F)return}},[o,Y,R,_,U]),O=Sa(o);return c.useEffect(()=>{o!=="both"&&L(null)},[G,o]),c.useEffect(()=>{if(H&&S)return tn([H,S])},[H,S]),a.jsx(ya,{children:a.jsx(ja,{allowCustomValue:t,autocomplete:O,required:w,trigger:S,onTriggerChange:I,contentId:Q,value:U,onValueChange:K,open:V,onOpenChange:B,disabled:u,locale:g,focusFirst:se,textValue:G,onTextValueChange:Y,onViewportChange:N,onContentChange:z,visuallyFocussedItem:_,filterValue:Z,onFilterValueChange:te,onVisuallyFocussedItemChange:L,isPrintableCharacter:j,visible:y,children:r})})},wn="ComboboxTrigger",vn=c.forwardRef((e,t)=>{const{...o}=e,r=je(wn),n=()=>{r.disabled||r.onOpenChange(!0)};return a.jsx(Q0,{asChild:!0,children:a.jsx(Ft,{asChild:!0,trapped:r.open,onMountAutoFocus:s=>{s.preventDefault()},onUnmountAutoFocus:s=>{r.trigger?.focus({preventScroll:!0}),document.getSelection()?.empty(),s.preventDefault()},children:a.jsx("div",{ref:t,"data-disabled":r.disabled?"":void 0,...o,onClick:J(o.onClick,s=>{if(r.disabled){s.preventDefault();return}r.trigger?.focus()}),onPointerDown:J(o.onPointerDown,s=>{if(r.disabled){s.preventDefault();return}const i=s.target;i.hasPointerCapture(s.pointerId)&&i.releasePointerCapture(s.pointerId),(i.closest("button")??i.closest("div"))===s.currentTarget&&s.button===0&&s.ctrlKey===!1&&(n(),r.trigger?.focus())})})})})});vn.displayName=wn;const bn="ComboboxInput",pn=c.forwardRef((e,t)=>{const o=je(bn),r=c.useRef(null),{getItems:n}=Je(void 0),{startsWith:s}=qt(o.locale,{sensitivity:"base"}),i=o.disabled,l=re(r,t,o.onTriggerChange),d=()=>{i||o.onOpenChange(!0)},f=ba(o.filterValue);return xe(()=>{const u=setTimeout(()=>{if(o.textValue===""||o.textValue===void 0||o.filterValue===""||o.filterValue===void 0)return;const w=n().find(x=>x.type==="option"&&s(x.textValue,o.textValue)),g=Fa(f??"",o.filterValue);w&&!o.visuallyFocussedItem&&g===o.filterValue.length&&r.current?.setSelectionRange(o.filterValue.length,o.textValue.length)});return()=>clearTimeout(u)},[o.textValue,o.filterValue,s,o.visuallyFocussedItem,n,f]),a.jsx("input",{type:"text",role:"combobox","aria-controls":o.contentId,"aria-expanded":o.open,"aria-required":o.required,"aria-autocomplete":o.autocomplete.type,"data-state":o.open?"open":"closed","aria-disabled":i,"aria-activedescendant":o.visuallyFocussedItem?.id,disabled:i,"data-disabled":i?"":void 0,"data-placeholder":o.textValue===void 0?"":void 0,value:o.textValue??"",...e,ref:l,onKeyDown:J(e.onKeyDown,u=>{if(["ArrowUp","ArrowDown","Home","End"].includes(u.key))o.open||d(),setTimeout(()=>{let g=n().filter(x=>!x.disabled&&x.isVisible).map(x=>x.ref.current);if(["ArrowUp","End"].includes(u.key)&&(g=g.slice().reverse()),["ArrowUp","ArrowDown"].includes(u.key)){const x=o.visuallyFocussedItem??n().find(v=>v.value===o.value)?.ref.current;if(x){let v=g.indexOf(x);v===g.length-1&&(v=-1),g=g.slice(v+1)}}if(["ArrowDown"].includes(u.key)&&o.autocomplete.type==="both"&&g.length>1){const[x,...v]=g,b=n().find(C=>C.ref.current===x).textValue;o.textValue===b&&(g=v)}o.focusFirst(g,n())}),u.preventDefault();else if(["Tab"].includes(u.key)&&o.open)u.preventDefault();else if(["Escape"].includes(u.key))o.open?o.onOpenChange(!1):(o.onValueChange(void 0),o.onTextValueChange("")),u.preventDefault();else if($a.includes(u.key)){if(o.visuallyFocussedItem){const w=n().find(g=>g.ref.current===o.visuallyFocussedItem);w&&(o.onValueChange(w.value),o.onTextValueChange(w.textValue),o.autocomplete.type==="both"&&o.onFilterValueChange(w.textValue),w.ref.current?.click())}else{const w=n().find(g=>g.type==="option"&&!g.disabled&&g.textValue===o.textValue);w&&(o.onValueChange(w.value),o.onTextValueChange(w.textValue),o.autocomplete.type==="both"&&o.onFilterValueChange(w.textValue),w.ref.current?.click())}o.onOpenChange(!1),u.preventDefault()}else o.onVisuallyFocussedItemChange(null)}),onChange:J(e.onChange,u=>{o.onTextValueChange(u.currentTarget.value),o.autocomplete.type==="both"&&o.onFilterValueChange(u.currentTarget.value)}),onKeyUp:J(e.onKeyUp,u=>{if(!o.open&&(o.isPrintableCharacter(u.key)||["Backspace"].includes(u.key))&&d(),setTimeout(()=>{if(o.autocomplete.type==="both"&&o.isPrintableCharacter(u.key)&&o.filterValue!==void 0){const w=o.filterValue,g=n().find(x=>s(x.textValue,w));g&&o.onTextValueChange(g.textValue)}}),o.autocomplete.type==="none"&&o.isPrintableCharacter(u.key)){const w=o.textValue??"",g=n().find(x=>s(x.textValue,w));g&&(o.onVisuallyFocussedItemChange(g.ref.current),g.ref.current?.scrollIntoView())}}),onBlur:J(e.onBlur,()=>{if(o.open)return;o.onVisuallyFocussedItemChange(null);const[u]=n().filter(g=>g.textValue===o.textValue&&g.type==="option");if(u){o.onValueChange(u.value),o.autocomplete.type==="both"&&o.onFilterValueChange(u.textValue);return}if(o.allowCustomValue){o.onValueChange(o.textValue),o.autocomplete.type==="both"&&o.onFilterValueChange(o.textValue);return}const[w]=n().filter(g=>g.value===o.value&&g.type==="option");w&&o.textValue!==""?(o.onTextValueChange(w.textValue),o.autocomplete.type==="both"&&o.onFilterValueChange(w.textValue)):(o.onValueChange(void 0),o.onTextValueChange(""))})})});pn.displayName="ComboboxTextInput";const $n=c.forwardRef((e,t)=>{const{children:o,...r}=e,n=je(bn),s=n.disabled,i=()=>{s||(n.onOpenChange(!0),n.trigger?.focus())};return a.jsx(oe.button,{"aria-hidden":!0,type:"button","aria-disabled":s,"aria-controls":n.contentId,"aria-expanded":n.open,disabled:s,"data-disabled":s?"":void 0,...r,tabIndex:-1,ref:t,onClick:J(r.onClick,()=>{n.trigger?.focus()}),onPointerDown:J(r.onPointerDown,l=>{l.button===0&&l.ctrlKey===!1&&(i(),l.preventDefault())}),onKeyDown:J(r.onKeyDown,l=>{pa.includes(l.key)&&(i(),l.preventDefault())}),children:o||"▼"})});$n.displayName="ComboboxIcon";const Ia="ComboboxPortal",Cn=e=>a.jsx(on,{asChild:!0,...e});Cn.displayName=Ia;const Gt="ComboboxContent",jn=c.forwardRef((e,t)=>{const o=je(Gt),{getItems:r}=Je(void 0),[n,s]=c.useState();if(xe(()=>{s(new DocumentFragment)},[]),xe(()=>{o.open&&o.autocomplete.type==="none"&&setTimeout(()=>{r().find(l=>l.value===o.value)?.ref.current?.scrollIntoView({block:"nearest"})})},[r,o.autocomplete,o.value,o.open]),!o.open){const i=n;return i?Fe.createPortal(a.jsx(ke.Slot,{scope:void 0,children:a.jsx("div",{children:e.children})}),i):null}return a.jsx(yn,{...e,ref:t})});jn.displayName=Gt;const Aa=10,yn=c.forwardRef((e,t)=>{const{onEscapeKeyDown:o,onPointerDownOutside:r,...n}=e,s=je(Gt),i=re(t,d=>s.onContentChange(d)),{onOpenChange:l}=s;return _t(),c.useEffect(()=>{const d=()=>{l(!1)};return window.addEventListener("blur",d),window.addEventListener("resize",d),()=>{window.removeEventListener("blur",d),window.removeEventListener("resize",d)}},[l]),a.jsx(Wt,{allowPinchZoom:!0,children:a.jsx(X0,{asChild:!0,onEscapeKeyDown:o,onPointerDownOutside:r,onFocusOutside:d=>{d.preventDefault()},onDismiss:()=>{s.onOpenChange(!1),s.trigger?.focus({preventScroll:!0})},children:a.jsx(Sn,{role:"listbox",id:s.contentId,"data-state":s.open?"open":"closed",onContextMenu:d=>d.preventDefault(),...n,ref:i,style:{display:"flex",flexDirection:"column",outline:"none",...n.style}})})})});yn.displayName="ComboboxContentImpl";const Sn=c.forwardRef((e,t)=>{const{align:o="start",collisionPadding:r=Aa,...n}=e;return a.jsx(J0,{...n,ref:t,align:o,collisionPadding:r,style:{boxSizing:"border-box",...n.style,"--radix-combobox-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-combobox-content-available-width":"var(--radix-popper-available-width)","--radix-combobox-content-available-height":"var(--radix-popper-available-height)","--radix-combobox-trigger-width":"var(--radix-popper-anchor-width)","--radix-combobox-trigger-height":"var(--radix-popper-anchor-height)"}})});Sn.displayName="ComboboxPopperPosition";const Rn="ComboboxViewport",In=c.forwardRef((e,t)=>{const o=je(Rn),r=re(t,o.onViewportChange);return a.jsxs(a.Fragment,{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:"[data-radix-combobox-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-combobox-viewport]::-webkit-scrollbar{display:none}"}}),a.jsx(ke.Slot,{scope:void 0,children:a.jsx(oe.div,{"data-radix-combobox-viewport":"",role:"presentation",...e,ref:r,style:{position:"relative",flex:1,overflow:"auto",...e.style}})})]})});In.displayName=Rn;const dt="ComboboxItem",[M0,Kt]=nn(dt),Yt=c.forwardRef((e,t)=>{const{value:o,disabled:r=!1,textValue:n,...s}=e,[i,l]=c.useState();xe(()=>{l(new DocumentFragment)},[]);const{onTextValueChange:d,textValue:f,...u}=je(dt),w=De(),[g,x]=c.useState(n??""),v=u.value===o,{startsWith:b,contains:C}=qt(u.locale,{sensitivity:"base"}),$=c.useCallback(p=>{x(j=>j||(p?.textContent??"").trim())},[]);return c.useEffect(()=>{v&&f===void 0&&g!==""&&d(g)},[g,v,f,d]),u.autocomplete.type==="both"&&g&&u.filterValue&&!b(g,u.filterValue)||u.autocomplete.type==="list"&&u.autocomplete.filter==="startsWith"&&g&&f&&!b(g,f)||u.autocomplete.type==="list"&&u.autocomplete.filter==="contains"&&g&&f&&!C(g,f)?i?Fe.createPortal(a.jsx(M0,{textId:w,onTextValueChange:$,isSelected:v,textValue:g,children:a.jsx(ke.ItemSlot,{scope:void 0,value:o,textValue:g,disabled:r,type:"option",isVisible:!1,children:a.jsx(Tt,{ref:t,value:o,disabled:r,...s})})}),i):null:a.jsx(M0,{textId:w,onTextValueChange:$,isSelected:v,textValue:g,children:a.jsx(ke.ItemSlot,{scope:void 0,value:o,textValue:g,disabled:r,type:"option",isVisible:!0,children:a.jsx(Tt,{ref:t,value:o,disabled:r,...s})})})});Yt.displayName=dt;const An="ComboboxItemImpl",Tt=c.forwardRef((e,t)=>{const{value:o,disabled:r=!1,...n}=e,s=c.useRef(null),i=re(t,s),{getItems:l}=Je(void 0),{onTextValueChange:d,visuallyFocussedItem:f,...u}=je(dt),{isSelected:w,textValue:g,textId:x}=Kt(An),v=()=>{r||(u.onValueChange(o),d(g),u.onOpenChange(!1),u.autocomplete.type==="both"&&u.onFilterValueChange(g),u.trigger?.focus({preventScroll:!0}))},b=c.useMemo(()=>f===l().find($=>$.ref.current===s.current)?.ref.current,[l,f]),C=De();return a.jsx(oe.div,{role:"option","aria-labelledby":x,"data-highlighted":b?"":void 0,"aria-selected":w&&b,"data-state":w?"checked":"unchecked","aria-disabled":r||void 0,"data-disabled":r?"":void 0,tabIndex:r?void 0:-1,...n,id:C,ref:i,onPointerUp:J(n.onPointerUp,v)})});Tt.displayName=An;const Mn="ComboboxItemText",Tn=c.forwardRef((e,t)=>{const{className:o,style:r,...n}=e,s=Kt(Mn),i=re(t,s.onTextValueChange);return a.jsx(oe.span,{id:s.textId,...n,ref:i})});Tn.displayName=Mn;const Vn="ComboboxItemIndicator",En=c.forwardRef((e,t)=>{const{isSelected:o}=Kt(Vn);return o?a.jsx(oe.span,{"aria-hidden":!0,...e,ref:t}):null});En.displayName=Vn;const Zt="ComboboxNoValueFound",Ln=c.forwardRef((e,t)=>{const{textValue:o="",filterValue:r="",visible:n=!1,locale:s,autocomplete:i}=je(Zt),[l,d]=c.useState([]),{subscribe:f}=Je(void 0),{startsWith:u,contains:w}=qt(s,{sensitivity:"base"});return c.useEffect(()=>{const g=f(x=>{if(n){const v=x.filter(b=>b.type!=="create");d(v)}else d(x)});return()=>{g()}},[n,f]),i.type==="none"&&l.length>0||i.type==="list"&&i.filter==="startsWith"&&l.some(g=>u(g.textValue,o))||i.type==="both"&&l.some(g=>u(g.textValue,r))||i.type==="list"&&i.filter==="contains"&&l.some(g=>w(g.textValue,o))?null:a.jsx(oe.div,{...e,ref:t})});Ln.displayName=Zt;const Hn=c.forwardRef((e,t)=>{const{disabled:o=!1,...r}=e,n=je(Zt),{textValue:s,visuallyFocussedItem:i}=n,{getItems:l,subscribe:d}=Je(void 0),f=c.useRef(null),[u,w]=c.useState(!1),g=re(t,f),x=c.useMemo(()=>i===l().find(C=>C.ref.current===f.current)?.ref.current,[l,i]),v=De(),b=()=>{!o&&s&&(n.onValueChange(s),n.onTextValueChange(s),n.onOpenChange(!1),n.autocomplete.type==="both"&&n.onFilterValueChange(s),n.trigger?.focus({preventScroll:!0}))};return xe(()=>{const C=d($=>{w(!$.some(p=>p.textValue===s&&p.type!=="create"))});return l().length===0&&w(!0),()=>{C()}},[s,d,l]),(!s||!u)&&!n.visible?null:a.jsx(ke.ItemSlot,{scope:void 0,value:s??"",textValue:s??"",disabled:o,isVisible:!0,type:"create",children:a.jsx(oe.div,{role:"option",tabIndex:o?void 0:-1,"aria-disabled":o||void 0,"data-disabled":o?"":void 0,"data-highlighted":x?"":void 0,...r,id:v,ref:g,onPointerUp:J(r.onPointerUp,b)})})});Hn.displayName="ComboboxCreateItem";const Ma=Ra,Ta=vn,Va=pn,Ea=$n,La=Cn,Ha=jn,Ba=In,Da=Yt,za=Tn,ka=En,Na=Ln,Oa=Hn;function Fa(e,t){const o=Math.min(e.length,t.length);for(let r=0;r<o;r++)if(e[r]!==t[r])return r;return o}const ve=Object.freeze(Object.defineProperty({__proto__:null,ComboboxItem:Yt,Content:Ha,CreateItem:Oa,Icon:Ea,Item:Da,ItemIndicator:ka,ItemText:za,NoValueFound:Na,Portal:La,Root:Ma,TextInput:Va,Trigger:Ta,Viewport:Ba},Symbol.toStringTag,{value:"Module"}));function Qt(e){const t=c.useRef(e);return c.useEffect(()=>{t.current=e}),c.useMemo(()=>(...o)=>t.current?.(...o),[])}const _a=[" ","Enter","ArrowUp","ArrowDown"],Wa=[" ","Enter"],Pe="Select",[ht,et,Ua]=q1(Pe),[_e,qa]=P0(Pe,[Ua,en]),ut=en(),[Ga,Ie]=_e(Pe),[Ka,Ya]=_e(Pe),Xt=e=>{const{__scopeSelect:t,children:o,open:r,defaultOpen:n,onOpenChange:s,value:i,defaultValue:l,onValueChange:d,dir:f,disabled:u,required:w,multi:g=!1}=e,x=ut(t),[v,b]=c.useState(null),[C,$]=c.useState(null),[p,j]=c.useState(!1),y=Z1(f),[S=!1,I]=ze({prop:r,defaultProp:n,onChange:s}),[R,N]=ze({prop:i,defaultProp:l,onChange(L){d&&(Array.isArray(L),d(L))}}),H=c.useRef(null),[z,_]=c.useState(new Set);return a.jsx(an,{...x,children:a.jsx(Ga,{required:w,scope:t,trigger:v,onTriggerChange:b,valueNode:C,onValueNodeChange:$,valueNodeHasChildren:p,onValueNodeHasChildrenChange:j,contentId:De(),value:R,onValueChange:N,open:S,onOpenChange:I,dir:y,triggerPointerDownPosRef:H,disabled:u,multi:g,children:a.jsx(ht.Provider,{scope:t,children:a.jsx(Ka,{scope:e.__scopeSelect,onNativeOptionAdd:c.useCallback(L=>{_(V=>new Set(V).add(L))},[]),onNativeOptionRemove:c.useCallback(L=>{_(V=>{const B=new Set(V);return B.delete(L),B})},[]),children:o})})})})};Xt.displayName=Pe;const Bn="SelectTrigger",Jt=c.forwardRef((e,t)=>{const{__scopeSelect:o,...r}=e,n=ut(o),s=Ie(Bn,o),i=s.disabled,l=re(t,s.onTriggerChange),d=et(o),[f,u,w]=Un(x=>{const v=d().filter($=>!$.disabled),b=v.find($=>$.value===s.value),C=qn(v,x,b);if(C!==void 0&&!Array.isArray(C.value)){const $=s.multi?[C.value]:C.value;s.onValueChange($)}}),g=()=>{i||(s.onOpenChange(!0),w())};return a.jsx(Q0,{asChild:!0,...n,children:a.jsx(oe.div,{role:"combobox","aria-controls":s.contentId,"aria-expanded":s.open,"aria-required":s.required,"aria-autocomplete":"none",dir:s.dir,"data-state":s.open?"open":"closed","data-disabled":i?"":void 0,"data-placeholder":s.value===void 0?"":void 0,tabIndex:i?void 0:0,...r,ref:l,onClick:J(r.onClick,x=>{x.currentTarget.focus()}),onPointerDown:J(r.onPointerDown,x=>{const v=x.target;v.hasPointerCapture(x.pointerId)&&v.releasePointerCapture(x.pointerId),(v.closest("button")??v.closest("div"))===x.currentTarget&&x.button===0&&x.ctrlKey===!1&&(g(),s.triggerPointerDownPosRef.current={x:Math.round(x.pageX),y:Math.round(x.pageY)},x.preventDefault())}),onKeyDown:J(r.onKeyDown,x=>{const v=f.current!=="",b=x.ctrlKey||x.altKey||x.metaKey,C=x.target;(C.closest("button")??C.closest("div"))===x.currentTarget&&(!b&&x.key.length===1&&u(x.key),!(v&&x.key===" ")&&_a.includes(x.key)&&(g(),x.preventDefault()))})})})});Jt.displayName=Bn;const Dn="SelectValue",Pt=c.forwardRef((e,t)=>{const{__scopeSelect:o,children:r,placeholder:n,...s}=e,i=Ie(Dn,o),{onValueNodeHasChildrenChange:l}=i,d=r!==void 0,f=re(t,i.onValueNodeChange),[u,w]=c.useState([]),g=et(o);xe(()=>{l(d)},[l,d]),c.useLayoutEffect(()=>{if(Array.isArray(i.value)&&u.length!==i.value.length){const v=setTimeout(()=>{const b=g().filter(C=>Array.isArray(C.value)?!1:i.value?.includes(C.value));w(b)});return()=>{clearTimeout(v)}}},[i.value,g,u]);let x;if((i.value===void 0||i.value.length===0)&&n!==void 0)x=a.jsx("span",{children:n});else if(typeof r=="function")if(Array.isArray(i.value)){const v=i.value.map(b=>{const C=u.find($=>$.value===b);return C?r({value:b,textValue:C?.textValue}):null});x=v.every(b=>b===null)?n:v}else x=r(i.value);else x=r;return a.jsx(oe.span,{...s,ref:f,children:x||null})});Pt.displayName=Dn;const Za="SelectIcon",e0=c.forwardRef((e,t)=>{const{__scopeSelect:o,children:r,...n}=e;return a.jsx(oe.span,{"aria-hidden":!0,...n,ref:t,children:r||"▼"})});e0.displayName=Za;const Qa="SelectPortal",t0=e=>a.jsx(on,{asChild:!0,...e});t0.displayName=Qa;const Ee="SelectContent",n0=c.forwardRef((e,t)=>{const o=Ie(Ee,e.__scopeSelect),[r,n]=c.useState();if(xe(()=>{n(new DocumentFragment)},[]),!o.open){const s=r;return s?Fe.createPortal(a.jsx(zn,{scope:e.__scopeSelect,children:a.jsx(ht.Slot,{scope:e.__scopeSelect,children:a.jsx("div",{children:e.children})})}),s):null}return a.jsx(kn,{...e,ref:t})});n0.displayName=Ee;const Se=10,[zn,Ae]=_e(Ee),Xa="SelectContentImpl",kn=c.forwardRef((e,t)=>{const{__scopeSelect:o,position:r="item-aligned",onCloseAutoFocus:n,onEscapeKeyDown:s,onPointerDownOutside:i,side:l,sideOffset:d,align:f,alignOffset:u,arrowPadding:w,collisionBoundary:g,collisionPadding:x,sticky:v,hideWhenDetached:b,avoidCollisions:C,...$}=e,p=Ie(Ee,o),[j,y]=c.useState(null),[S,I]=c.useState(null),R=re(t,T=>y(T)),[N,H]=c.useState(null),[z,_]=c.useState(null),L=et(o),[V,B]=c.useState(!1),U=c.useRef(!1);c.useEffect(()=>{if(j)return tn(j)},[j]),_t();const K=c.useCallback(T=>{const[W,...X]=L().map(q=>q.ref.current),[F]=X.slice(-1),D=document.activeElement;for(const q of T)if(q===D||(q?.scrollIntoView({block:"nearest"}),q===W&&S&&(S.scrollTop=0),q===F&&S&&(S.scrollTop=S.scrollHeight),q?.focus(),document.activeElement!==D))return},[L,S]),G=c.useCallback(()=>K([N,j]),[K,N,j]);c.useEffect(()=>{V&&G()},[V,G]);const{onOpenChange:Y,triggerPointerDownPosRef:Z}=p;c.useEffect(()=>{if(j){let T={x:0,y:0};const W=F=>{T={x:Math.abs(Math.round(F.pageX)-(Z.current?.x??0)),y:Math.abs(Math.round(F.pageY)-(Z.current?.y??0))}},X=F=>{T.x<=10&&T.y<=10?F.preventDefault():j.contains(F.target)||Y(!1),document.removeEventListener("pointermove",W),Z.current=null};return Z.current!==null&&(document.addEventListener("pointermove",W),document.addEventListener("pointerup",X,{capture:!0,once:!0})),()=>{document.removeEventListener("pointermove",W),document.removeEventListener("pointerup",X,{capture:!0})}}},[j,Y,Z]),c.useEffect(()=>{const T=()=>Y(!1);return window.addEventListener("blur",T),window.addEventListener("resize",T),()=>{window.removeEventListener("blur",T),window.removeEventListener("resize",T)}},[Y]);const[te,Q]=Un(T=>{const W=L().filter(D=>!D.disabled),X=W.find(D=>D.ref.current===document.activeElement),F=qn(W,T,X);F&&setTimeout(()=>F.ref.current.focus())}),se=c.useCallback((T,W,X)=>{const F=!U.current&&!X;(p.value!==void 0&&p.value===W||F)&&(H(T),F&&(U.current=!0))},[p.value]),O=c.useCallback(()=>j?.focus(),[j]),ae=c.useCallback((T,W,X)=>{const F=!U.current&&!X;(p.value!==void 0&&(Array.isArray(W)?W.every(q=>p.value?.includes(q)):p.value===W)||F)&&_(T)},[p.value]),ee=r==="popper"?Vt:Nn,ue=ee===Vt?{side:l,sideOffset:d,align:f,alignOffset:u,arrowPadding:w,collisionBoundary:g,collisionPadding:x,sticky:v,hideWhenDetached:b,avoidCollisions:C}:{};return a.jsx(zn,{scope:o,content:j,viewport:S,onViewportChange:I,itemRefCallback:se,selectedItem:N,onItemLeave:O,itemTextRefCallback:ae,focusSelectedItem:G,selectedItemText:z,position:r,isPositioned:V,searchRef:te,children:a.jsx(Wt,{as:Rt,allowPinchZoom:!0,children:a.jsx(Ft,{asChild:!0,trapped:p.open,onMountAutoFocus:T=>{T.preventDefault()},onUnmountAutoFocus:J(n,T=>{p.trigger?.focus({preventScroll:!0}),document.getSelection()?.empty(),T.preventDefault()}),children:a.jsx(X0,{asChild:!0,disableOutsidePointerEvents:!0,onEscapeKeyDown:s,onPointerDownOutside:i,onFocusOutside:T=>T.preventDefault(),onDismiss:()=>p.onOpenChange(!1),children:a.jsx(ee,{role:"listbox",id:p.contentId,"data-state":p.open?"open":"closed","aria-multiselectable":p.multi?"true":void 0,dir:p.dir,onContextMenu:T=>T.preventDefault(),...$,...ue,onPlaced:()=>B(!0),ref:R,style:{display:"flex",flexDirection:"column",outline:"none",...$.style},onKeyDown:J($.onKeyDown,T=>{const W=T.ctrlKey||T.altKey||T.metaKey;if(T.key==="Tab"&&T.preventDefault(),!W&&T.key.length===1&&Q(T.key),["ArrowUp","ArrowDown","Home","End"].includes(T.key)){let F=L().filter(D=>!D.disabled).map(D=>D.ref.current);if(["ArrowUp","End"].includes(T.key)&&(F=F.slice().reverse()),["ArrowUp","ArrowDown"].includes(T.key)){const D=T.target,q=F.indexOf(D);F=F.slice(q+1)}setTimeout(()=>K(F)),T.preventDefault()}})})})})})})});kn.displayName=Xa;const Ja="SelectItemAlignedPosition",Nn=c.forwardRef((e,t)=>{const{__scopeSelect:o,onPlaced:r,...n}=e,s=Ie(Ee,o),i=Ae(Ee,o),[l,d]=c.useState(null),[f,u]=c.useState(null),w=re(t,R=>u(R)),g=et(o),x=c.useRef(!1),v=c.useRef(!0),{viewport:b,selectedItem:C,selectedItemText:$,focusSelectedItem:p}=i,j=c.useCallback(()=>{if(s.trigger&&s.valueNode&&l&&f&&b&&C&&$){const R=s.trigger.getBoundingClientRect(),N=f.getBoundingClientRect(),H=s.valueNode.getBoundingClientRect(),z=$.getBoundingClientRect();if(s.dir!=="rtl"){const D=z.left-N.left,q=H.left-D,le=R.left-q,de=R.width+le,P=Math.max(de,N.width),$e=window.innerWidth-Se,ye=A0(q,[Se,$e-P]);l.style.minWidth=`${de}px`,l.style.left=`${ye}px`}else{const D=N.right-z.right,q=window.innerWidth-H.right-D,le=window.innerWidth-R.right-q,de=R.width+le,P=Math.max(de,N.width),$e=window.innerWidth-Se,ye=A0(q,[Se,$e-P]);l.style.minWidth=`${de}px`,l.style.right=`${ye}px`}const _=g(),L=window.innerHeight-Se*2,V=b.scrollHeight,B=window.getComputedStyle(f),U=parseInt(B.borderTopWidth,10),K=parseInt(B.paddingTop,10),G=parseInt(B.borderBottomWidth,10),Y=parseInt(B.paddingBottom,10),Z=U+K+V+Y+G,te=Math.min(C.offsetHeight*5,Z),Q=window.getComputedStyle(b),se=parseInt(Q.paddingTop,10),O=parseInt(Q.paddingBottom,10),ae=R.top+R.height/2-Se,ee=L-ae,ue=C.offsetHeight/2,T=C.offsetTop+ue,W=U+K+T,X=Z-W;if(W<=ae){const D=C===_[_.length-1].ref.current;l.style.bottom="0px";const q=f.clientHeight-b.offsetTop-b.offsetHeight,le=Math.max(ee,ue+(D?O:0)+q+G),de=W+le;l.style.height=`${de}px`}else{const D=C===_[0].ref.current;l.style.top="0px";const le=Math.max(ae,U+b.offsetTop+(D?se:0)+ue)+X;l.style.height=`${le}px`,b.scrollTop=W-ae+b.offsetTop}l.style.margin=`${Se}px 0`,l.style.minHeight=`${te}px`,l.style.maxHeight=`${L}px`,r?.(),requestAnimationFrame(()=>x.current=!0)}},[g,s.trigger,s.valueNode,l,f,b,C,$,s.dir,r]);xe(()=>j(),[j]);const[y,S]=c.useState();xe(()=>{f&&S(window.getComputedStyle(f).zIndex)},[f]);const I=c.useCallback(R=>{R&&v.current===!0&&(j(),p?.(),v.current=!1)},[j,p]);return a.jsx(er,{scope:o,contentWrapper:l,shouldExpandOnScrollRef:x,onScrollButtonChange:I,children:a.jsx("div",{ref:d,style:{display:"flex",flexDirection:"column",position:"fixed",zIndex:y},children:a.jsx(oe.div,{...n,ref:w,style:{boxSizing:"border-box",maxHeight:"100%",...n.style}})})})});Nn.displayName=Ja;const Pa="SelectPopperPosition",Vt=c.forwardRef((e,t)=>{const{__scopeSelect:o,align:r="start",collisionPadding:n=Se,...s}=e,i=ut(o);return a.jsx(J0,{...i,...s,ref:t,align:r,collisionPadding:n,style:{boxSizing:"border-box",...s.style,"--radix-select-content-transform-origin":"var(--radix-popper-transform-origin)","--radix-select-content-available-width":"var(--radix-popper-available-width)","--radix-select-content-available-height":"var(--radix-popper-available-height)","--radix-select-trigger-width":"var(--radix-popper-anchor-width)","--radix-select-trigger-height":"var(--radix-popper-anchor-height)"}})});Vt.displayName=Pa;const[er,o0]=_e(Ee,{}),Et="SelectViewport",a0=c.forwardRef((e,t)=>{const{__scopeSelect:o,...r}=e,n=Ae(Et,o),s=o0(Et,o),i=re(t,n.onViewportChange),l=c.useRef(0);return a.jsxs(a.Fragment,{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:"[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}"}}),a.jsx(ht.Slot,{scope:o,children:a.jsx(oe.div,{"data-radix-select-viewport":"",role:"presentation",...r,ref:i,style:{position:"relative",flex:1,overflow:"auto",...r.style},onScroll:J(r.onScroll,d=>{const f=d.currentTarget,{contentWrapper:u,shouldExpandOnScrollRef:w}=s;if(w?.current&&u){const g=Math.abs(l.current-f.scrollTop);if(g>0){const x=window.innerHeight-Se*2,v=parseFloat(u.style.minHeight),b=parseFloat(u.style.height),C=Math.max(v,b);if(C<x){const $=C+g,p=Math.min(x,$),j=$-p;u.style.height=`${p}px`,u.style.bottom==="0px"&&(f.scrollTop=j>0?j:0,u.style.justifyContent="flex-end")}}}l.current=f.scrollTop})})})]})});a0.displayName=Et;const On="SelectGroup",[tr,nr]=_e(On),r0=c.forwardRef((e,t)=>{const{__scopeSelect:o,...r}=e,n=De();return a.jsx(tr,{scope:o,id:n,children:a.jsx(oe.div,{role:"group","aria-labelledby":n,...r,ref:t})})});r0.displayName=On;const Fn="SelectLabel",s0=c.forwardRef((e,t)=>{const{__scopeSelect:o,...r}=e,n=nr(Fn,o);return a.jsx(oe.div,{id:n.id,...r,ref:t})});s0.displayName=Fn;const ct="SelectItem",[or,_n]=_e(ct),i0=c.forwardRef((e,t)=>{const{__scopeSelect:o,value:r,disabled:n=!1,textValue:s,...i}=e,l=Ie(ct,o),d=Ae(ct,o),f=typeof r=="string"?Array.isArray(l.value)?l.value.includes(r):l.value===r:r.every(p=>l.value?.includes(p)),u=Array.isArray(l.value)&&Array.isArray(r)&&r.some(p=>l.value?.includes(p)),[w,g]=c.useState(s??""),[x,v]=c.useState(!1),b=re(t,p=>d.itemRefCallback?.(p,r,n)),C=De(),$=()=>{if(!n){let p=l.multi&&typeof r=="string"?[r]:r;u&&!f?l.onValueChange(p):Array.isArray(l.value)&&(p=Gn(r,l.value)),l.onValueChange(p),l.multi||l.onOpenChange(!1)}};if(!l.multi&&Array.isArray(r))throw new Error("You can only pass an array of values in multi selects");return a.jsx(or,{scope:o,value:r,disabled:n,textId:C,isSelected:f,isIntermediate:u,onItemTextChange:c.useCallback(p=>{g(j=>j||(p?.textContent??"").trim())},[]),children:a.jsx(ht.ItemSlot,{scope:o,value:r,disabled:n,textValue:w,children:a.jsx(oe.div,{role:"option","aria-labelledby":C,"data-highlighted":x?"":void 0,"aria-selected":l.multi?void 0:f&&x,"aria-checked":l.multi?f:void 0,"data-state":f?"checked":"unchecked","aria-disabled":n||void 0,"data-disabled":n?"":void 0,tabIndex:n?void 0:-1,...i,ref:b,onFocus:J(i.onFocus,()=>v(!0)),onBlur:J(i.onBlur,()=>v(!1)),onPointerUp:J(i.onPointerUp,$),onPointerMove:J(i.onPointerMove,p=>{n?d.onItemLeave?.():p.currentTarget.focus({preventScroll:!0})}),onPointerLeave:J(i.onPointerLeave,p=>{p.currentTarget===document.activeElement&&d.onItemLeave?.()}),onKeyDown:J(i.onKeyDown,p=>{d.searchRef?.current!==""&&p.key===" "||(Wa.includes(p.key)&&$(),p.key===" "&&p.preventDefault())})})})})});i0.displayName=ct;const Ye="SelectItemText",c0=c.forwardRef((e,t)=>{const{__scopeSelect:o,className:r,style:n,...s}=e,i=Ie(Ye,o),l=Ae(Ye,o),d=_n(Ye,o),f=Ya(Ye,o),[u,w]=c.useState(null),g=re(t,$=>w($),d.onItemTextChange,$=>l.itemTextRefCallback?.($,d.value,d.disabled)),x=u?.textContent,v=c.useMemo(()=>a.jsx("option",{value:d.value,disabled:d.disabled,children:x},Array.isArray(d.value)?d.value.join(";"):d.value),[d.disabled,d.value,x]),{onNativeOptionAdd:b,onNativeOptionRemove:C}=f;return xe(()=>(b(v),()=>C(v)),[b,C,v]),a.jsxs(a.Fragment,{children:[a.jsx(oe.span,{id:d.textId,...s,ref:g}),d.isSelected&&i.valueNode&&!i.valueNodeHasChildren?Fe.createPortal(s.children,i.valueNode):null]})});c0.displayName=Ye;const Wn="SelectItemIndicator",l0=c.forwardRef((e,t)=>{const{__scopeSelect:o,children:r,...n}=e,s=_n(Wn,o);return typeof r=="function"?a.jsx(oe.span,{"aria-hidden":!0,...n,ref:t,children:r({isSelected:s.isSelected,isIntermediate:s.isIntermediate})}):s.isSelected?a.jsx(oe.span,{"aria-hidden":!0,...n,ref:t,children:r}):null});l0.displayName=Wn;const Lt="SelectScrollUpButton",d0=c.forwardRef((e,t)=>{const o=Ae(Lt,e.__scopeSelect),r=o0(Lt,e.__scopeSelect),[n,s]=c.useState(!1),i=re(t,r.onScrollButtonChange);return xe(()=>{if(o.viewport&&o.isPositioned){const l=o.viewport,d=()=>{const f=l.scrollTop>0;s(f)};return d(),l.addEventListener("scroll",d),()=>l.removeEventListener("scroll",d)}},[o.viewport,o.isPositioned]),n?a.jsx(u0,{...e,ref:i,onAutoScroll:()=>{const{viewport:l,selectedItem:d}=o;l&&d&&(l.scrollTop-=d.offsetHeight)}}):null});d0.displayName=Lt;const Ht="SelectScrollDownButton",h0=c.forwardRef((e,t)=>{const o=Ae(Ht,e.__scopeSelect),r=o0(Ht,e.__scopeSelect),[n,s]=c.useState(!1),i=re(t,r.onScrollButtonChange);return xe(()=>{if(o.viewport&&o.isPositioned){const l=o.viewport,d=()=>{const f=l.scrollHeight-l.clientHeight,u=Math.ceil(l.scrollTop)<f;s(u)};return d(),l.addEventListener("scroll",d),()=>l.removeEventListener("scroll",d)}},[o.viewport,o.isPositioned]),n?a.jsx(u0,{...e,ref:i,onAutoScroll:()=>{const{viewport:l,selectedItem:d}=o;l&&d&&(l.scrollTop+=d.offsetHeight)}}):null});h0.displayName=Ht;const u0=c.forwardRef((e,t)=>{const{__scopeSelect:o,onAutoScroll:r,...n}=e,s=Ae("SelectScrollButton",o),i=c.useRef(null),l=et(o),d=c.useCallback(()=>{i.current!==null&&(window.clearInterval(i.current),i.current=null)},[]);return c.useEffect(()=>()=>d(),[d]),xe(()=>{l().find(u=>u.ref.current===document.activeElement)?.ref.current?.scrollIntoView({block:"nearest"})},[l]),a.jsx(oe.div,{"aria-hidden":!0,...n,ref:t,style:{flexShrink:0,...n.style},onPointerMove:J(n.onPointerMove,()=>{s.onItemLeave?.(),i.current===null&&(i.current=window.setInterval(r,50))}),onPointerLeave:J(n.onPointerLeave,()=>{d()})})});u0.displayName="SelectScrollButtonImpl";const ar="SelectSeparator",g0=c.forwardRef((e,t)=>{const{__scopeSelect:o,...r}=e;return a.jsx(oe.div,{"aria-hidden":!0,...r,ref:t})});g0.displayName=ar;const Bt="SelectArrow",f0=c.forwardRef((e,t)=>{const{__scopeSelect:o,...r}=e,n=ut(o),s=Ie(Bt,o),i=Ae(Bt,o);return s.open&&i.position==="popper"?a.jsx(G1,{...n,...r,ref:t}):null});f0.displayName=Bt;const rr="BubbleSelect",sr=c.forwardRef((e,t)=>{const{value:o,...r}=e,n=c.useRef(null),s=re(t,n),i=K1(o),l=Ie(rr,void 0);c.useEffect(()=>{const f=n.current,u=window.HTMLSelectElement.prototype,g=Object.getOwnPropertyDescriptor(u,"value").set;if(i!==o&&g){const x=new Event("change",{bubbles:!0});g.call(f,o),f.dispatchEvent(x)}},[i,o]);let d=o;return l.multi&&!Array.isArray(o)&&(d=[]),a.jsx(Y1,{asChild:!0,children:a.jsx("select",{...r,multiple:l.multi?!0:void 0,ref:s,defaultValue:d})})});sr.displayName="BubbleSelect";function Un(e){const t=Qt(e),o=c.useRef(""),r=c.useRef(0),n=c.useCallback(i=>{const l=o.current+i;t(l),function d(f){o.current=f,window.clearTimeout(r.current),f!==""&&(r.current=window.setTimeout(()=>d(""),1e3))}(l)},[t]),s=c.useCallback(()=>{o.current="",window.clearTimeout(r.current)},[]);return c.useEffect(()=>()=>window.clearTimeout(r.current),[]),[o,n,s]}function qn(e,t,o){const n=t.length>1&&Array.from(t).every(f=>f===t[0])?t[0]:t,s=o?e.indexOf(o):-1;let i=ir(e,Math.max(s,0));n.length===1&&(i=i.filter(f=>f!==o));const d=i.find(f=>f.textValue.toLowerCase().startsWith(n.toLowerCase()));return d!==o?d:void 0}function ir(e,t){return e.map((o,r)=>e[(t+r)%e.length])}const Gn=(e,t=[])=>{if(Array.isArray(e))return e.reduce((r,n)=>Gn(n,r),t);const o=t.indexOf(e);return o===-1?[...t,e]:[...t.slice(0,o),...t.slice(o+1)]},cr=Xt,lr=Jt,dr=Pt,hr=e0,ur=t0,gr=n0,fr=a0,mr=r0,xr=s0,wr=i0,vr=c0,br=l0,pr=d0,$r=h0,Cr=g0,jr=f0,be=Object.freeze(Object.defineProperty({__proto__:null,Arrow:jr,Content:gr,Group:mr,Icon:hr,Item:wr,ItemIndicator:br,ItemText:vr,Label:xr,Portal:ur,Root:cr,ScrollDownButton:$r,ScrollUpButton:pr,Select:Xt,SelectArrow:f0,SelectContent:n0,SelectGroup:r0,SelectIcon:e0,SelectItem:i0,SelectItemIndicator:l0,SelectItemText:c0,SelectLabel:s0,SelectPortal:t0,SelectScrollDownButton:h0,SelectScrollUpButton:d0,SelectSeparator:g0,SelectTrigger:Jt,SelectValue:Pt,SelectViewport:a0,Separator:Cr,Trigger:lr,Value:dr,Viewport:fr,createSelectScope:qa},Symbol.toStringTag,{value:"Module"}));function Ve(e,t,{checkForDefaultPrevented:o=!0}={}){return function(n){if(e?.(n),o===!1||!n.defaultPrevented)return t?.(n)}}const yr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 2A12.014 12.014 0 0 0 4 14c0 3 1.57 6.883 4.201 10.375C10.85 27.894 13.764 30 16 30s5.151-2.101 7.799-5.625C26.43 20.875 28 17 28 14A12.014 12.014 0 0 0 16 2M8 14.5A1.5 1.5 0 0 1 9.5 13a4.5 4.5 0 0 1 4.5 4.5 1.5 1.5 0 0 1-1.5 1.5A4.5 4.5 0 0 1 8 14.5M18 25h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 0 2m1.5-6a1.5 1.5 0 0 1-1.5-1.5 4.5 4.5 0 0 1 4.5-4.5 1.5 1.5 0 0 1 1.5 1.5 4.5 4.5 0 0 1-4.5 4.5"})})};c.forwardRef(yr);const Sr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 6H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2v11a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2m-9 12h-6a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2m9-7H4V8h24z"})})};c.forwardRef(Sr);const Rr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30.5 7v6a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1 0-3h2.137l-2.375-2.173-.047-.046a9.5 9.5 0 1 0-6.84 16.219H16a9.44 9.44 0 0 0 6.519-2.59 1.5 1.5 0 1 1 2.061 2.181A12.43 12.43 0 0 1 16 28.5h-.171a12.5 12.5 0 1 1 8.985-21.368L27.5 9.59V7a1.5 1.5 0 0 1 3 0"})})},Ir=c.forwardRef(Rr),ph=Ir,Ar=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m26.061 19.061-9 9a1.503 1.503 0 0 1-2.125 0l-9-9a1.503 1.503 0 1 1 2.125-2.125l6.439 6.439V5a1.5 1.5 0 1 1 3 0v18.375l6.439-6.44a1.502 1.502 0 1 1 2.125 2.125z"})})};c.forwardRef(Ar);const Mr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5H8.625l6.44 6.439a1.502 1.502 0 1 1-2.125 2.125l-9-9a1.5 1.5 0 0 1 0-2.125l9-9a1.503 1.503 0 0 1 2.125 2.125L8.625 14.5H27a1.5 1.5 0 0 1 1.5 1.5"})})};c.forwardRef(Mr);const Tr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,fill:s,viewBox:"0 0 16 16",stroke:i,ref:r,...o,children:a.jsx("path",{d:"M14.75 8a.75.75 0 0 1-.75.75H6.813l3.22 3.22a.751.751 0 1 1-1.063 1.062l-4.5-4.5a.75.75 0 0 1 0-1.063l4.5-4.5a.751.751 0 0 1 1.063 1.063L6.813 7.25H14a.75.75 0 0 1 .75.75M2.5 1.75a.75.75 0 0 0-.75.75v11a.75.75 0 0 0 1.5 0v-11a.75.75 0 0 0-.75-.75"})})};c.forwardRef(Tr);const Vr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,fill:s,viewBox:"0 0 16 16",stroke:i,ref:r,...o,children:a.jsx("path",{d:"M11.53 7.47a.75.75 0 0 1 0 1.062l-4.5 4.5a.751.751 0 1 1-1.062-1.063l3.22-3.219H2a.75.75 0 1 1 0-1.5h7.188L5.969 4.03a.751.751 0 1 1 1.063-1.062zm1.97-5.72a.75.75 0 0 0-.75.75v11a.75.75 0 0 0 1.5 0v-11a.75.75 0 0 0-.75-.75"})})};c.forwardRef(Vr);const Er=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m28.061 17.061-9 9a1.503 1.503 0 1 1-2.125-2.125l6.439-6.436H5a1.5 1.5 0 1 1 0-3h18.375l-6.436-6.44a1.503 1.503 0 0 1 2.125-2.125l9 9a1.5 1.5 0 0 1-.003 2.126"})})};c.forwardRef(Er);const Lr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26.061 15.061a1.5 1.5 0 0 1-2.125 0L17.5 8.625V27a1.5 1.5 0 1 1-3 0V8.625l-6.439 6.436a1.503 1.503 0 1 1-2.125-2.125l9-9a1.5 1.5 0 0 1 2.125 0l9 9a1.5 1.5 0 0 1 0 2.125"})})};c.forwardRef(Lr);const Hr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M11 13.5H5A1.5 1.5 0 0 1 3.5 12V6a1.5 1.5 0 0 1 3 0v1.733C8.581 5.683 11.786 3.5 16 3.5c5.558 0 8.92 3.299 9.061 3.439a1.5 1.5 0 0 1-2.117 2.125C22.889 9.01 20.25 6.5 16 6.5c-3.625 0-6.367 2.21-8 4h3a1.5 1.5 0 1 1 0 3m16 5h-6a1.5 1.5 0 1 0 0 3h3c-1.625 1.79-4.375 4-8 4-4.25 0-6.889-2.511-6.944-2.565A1.5 1.5 0 0 0 6.94 25.06c.141.141 3.504 3.44 9.061 3.44 4.214 0 7.419-2.183 9.5-4.233V26a1.5 1.5 0 1 0 3 0v-6a1.5 1.5 0 0 0-1.5-1.5"})})};c.forwardRef(Hr);const Br=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 256 256",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M220 48v48a12 12 0 0 1-24 0V77l-39.51 39.52a12 12 0 0 1-17-17L179 60h-19a12 12 0 0 1 0-24h48a12 12 0 0 1 12 12M99.51 139.51 60 179v-19a12 12 0 0 0-24 0v48a12 12 0 0 0 12 12h48a12 12 0 0 0 0-24H77l39.52-39.51a12 12 0 0 0-17-17Z"})})};c.forwardRef(Br);const Dr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27.725 21.993C27.031 20.798 26 17.416 26 13a10 10 0 0 0-20 0c0 4.418-1.032 7.797-1.726 8.993A2 2 0 0 0 6 25h5.101a5 5 0 0 0 9.798 0H26a2 2 0 0 0 1.725-3.008M16 27a3 3 0 0 1-2.828-2h5.656A3 3 0 0 1 16 27"})})};c.forwardRef(Dr);const zr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M22.135 14.308A6.001 6.001 0 0 0 17.5 4.5H9A1.5 1.5 0 0 0 7.5 6v19A1.5 1.5 0 0 0 9 26.5h10a6.5 6.5 0 0 0 3.135-12.192M10.5 7.5h7a3 3 0 0 1 0 6h-7zm8.5 16h-8.5v-7H19a3.5 3.5 0 1 1 0 7"})})};c.forwardRef(zr);const kr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 4v20a1 1 0 0 1-1 1H9a2 2 0 0 0-2 2h17a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1V7a4 4 0 0 1 4-4h17a1 1 0 0 1 1 1"})})};c.forwardRef(kr);const Nr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M19 14a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1m10-5v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1h5a2 2 0 0 1 2 2M12 7h8V6a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1zm15 7.201V9H5v5.201A23 23 0 0 0 16 17a23 23 0 0 0 11-2.799"})})};c.forwardRef(Nr);const Or=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M9.5 8A1.5 1.5 0 0 1 11 6.5h16a1.5 1.5 0 0 1 0 3H11A1.5 1.5 0 0 1 9.5 8M27 14.5H11a1.5 1.5 0 1 0 0 3h16a1.5 1.5 0 1 0 0-3m0 8H11a1.5 1.5 0 1 0 0 3h16a1.5 1.5 0 1 0 0-3M5.5 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4m0-8a2 2 0 1 0 0 4 2 2 0 0 0 0-4m0 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4"})})};c.forwardRef(Or);const Fr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26 4h-3V3a1 1 0 0 0-2 0v1H11V3a1 1 0 0 0-2 0v1H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 6H6V6h3v1a1 1 0 0 0 2 0V6h10v1a1 1 0 0 0 2 0V6h3z"})})},_r=c.forwardRef(Fr),Wr=_r,Ur=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30 14h-1.35l-3.472-7.812A2 2 0 0 0 23.35 5H8.65a2 2 0 0 0-1.828 1.188L3.35 14H2a1 1 0 0 0 0 2h1v10a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-2h12v2a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V16h1a1 1 0 0 0 0-2m-20 6H8a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2m12 0a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2z"})})};c.forwardRef(Ur);const qr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m26.708 12.708-10 10a1 1 0 0 1-1.415 0l-10-10A1 1 0 0 1 6 11h20a1 1 0 0 1 .707 1.707"})})},Gr=c.forwardRef(qr),Le=Gr,Kr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26.924 20.383A1 1 0 0 1 26 21H6a1 1 0 0 1-.708-1.707l10-10a1 1 0 0 1 1.415 0l10 10a1 1 0 0 1 .217 1.09"})})};c.forwardRef(Kr);const Yr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M7 26a1 1 0 1 1-2 0 1 1 0 0 0-1-1 1 1 0 0 1 0-2 3 3 0 0 1 3 3m-3-7a1 1 0 0 0 0 2 5 5 0 0 1 5 5 1 1 0 1 0 2 0 7.01 7.01 0 0 0-7-7m0-4a1 1 0 0 0 0 2 9.01 9.01 0 0 1 9 9 1 1 0 0 0 2 0A11.01 11.01 0 0 0 4 15M27 5H5a2 2 0 0 0-2 2v5a1 1 0 0 0 1 1 13.014 13.014 0 0 1 13 13 1 1 0 0 0 1 1h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2"})})};c.forwardRef(Yr);const Zr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M25 3h-1a2 2 0 0 0-2 2v2h-3.5V5a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2H10V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v5.586A1.98 1.98 0 0 0 5.586 12L7 13.414V27a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V13.414L26.414 12A1.98 1.98 0 0 0 27 10.586V5a2 2 0 0 0-2-2m-6 24h-6v-8a3 3 0 0 1 6 0z"})})};c.forwardRef(Zr);const Qr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 5H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m0 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m-5-2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m-3-5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M25 24H7a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v13h17a1 1 0 0 1 0 2"})})};c.forwardRef(Qr);const Xr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M3.094 14.443a12.8 12.8 0 0 1 2.914-6.72 2 2 0 0 1 2.953-.138l3.459 3.533a1.98 1.98 0 0 1 .211 2.56 3.2 3.2 0 0 0-.462.968.5.5 0 0 1-.478.354h-8.1a.5.5 0 0 1-.497-.557m14.08-11.435A2 2 0 0 0 15 5v5.084a1.98 1.98 0 0 0 1.656 1.97 4 4 0 0 1 .677 7.72.51.51 0 0 0-.333.476v8.154a.5.5 0 0 0 .558.5A13.04 13.04 0 0 0 29 16.185C29.094 9.4 23.899 3.61 17.174 3.008M14.656 19.77a4 4 0 0 1-2.425-2.427.51.51 0 0 0-.475-.343H3.59a.5.5 0 0 0-.5.556A13.01 13.01 0 0 0 14.443 28.91a.5.5 0 0 0 .556-.5V20.25a.51.51 0 0 0-.343-.48"})})};c.forwardRef(Xr);const Jr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m0 2a11 11 0 0 1 8.984 4.659L16 14.845zm0 22a11 11 0 0 1-8.984-4.659l18.97-10.951A11 11 0 0 1 16 27"})})};c.forwardRef(Jr);const Pr=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m29.061 10.061-16 16a1.5 1.5 0 0 1-2.125 0l-7-7a1.504 1.504 0 0 1 2.125-2.125L12 22.875 26.939 7.939a1.502 1.502 0 1 1 2.125 2.125z"})})},es=c.forwardRef(Pr),$h=es,ts=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m5.708 10.708-7 7a1 1 0 0 1-1.415 0l-3-3a1 1 0 0 1 1.415-1.415L14 18.586l6.293-6.293a1 1 0 0 1 1.415 1.415"})})};c.forwardRef(ts);const ns=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M176.49 95.51a12 12 0 0 1 0 17l-56 56a12 12 0 0 1-17 0l-24-24a12 12 0 1 1 17-17L112 143l47.51-47.52a12 12 0 0 1 16.98.03M236 128A108 108 0 1 1 128 20a108.12 108.12 0 0 1 108 108m-24 0a84 84 0 1 0-84 84 84.09 84.09 0 0 0 84-84"})})};c.forwardRef(ns);const os=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m27.061 13.061-10 10a1.503 1.503 0 0 1-2.125 0l-10-10a1.503 1.503 0 1 1 2.125-2.125L16 19.875l8.939-8.94a1.502 1.502 0 1 1 2.125 2.125z"})})};c.forwardRef(os);const as=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M21.061 24.939a1.503 1.503 0 0 1-2.125 2.125l-10-10a1.5 1.5 0 0 1 0-2.125l10-10a1.503 1.503 0 0 1 2.125 2.125L12.125 16z"})})},rs=c.forwardRef(as),Kn=rs,ss=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m23.061 17.061-10 10a1.503 1.503 0 0 1-2.125-2.125L19.875 16l-8.936-8.939a1.502 1.502 0 1 1 2.125-2.125l10 10a1.5 1.5 0 0 1-.003 2.125"})})},is=c.forwardRef(ss),m0=is,cs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27.061 21.061a1.503 1.503 0 0 1-2.125 0L16 12.125l-8.939 8.936a1.503 1.503 0 0 1-2.125-2.125l10-10a1.5 1.5 0 0 1 2.125 0l10 10a1.5 1.5 0 0 1 0 2.125"})})};c.forwardRef(cs);const ls=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m7 14h-7a1 1 0 0 1-1-1V9a1 1 0 0 1 2 0v6h6a1 1 0 0 1 0 2"})})},ds=c.forwardRef(ls),hs=ds,us=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 16a12 12 0 0 1-20.236 8.728 1.002 1.002 0 0 1 1.375-1.456 10 10 0 1 0-.21-14.343c-.441.446-.857.885-1.26 1.321l2.039 2.043A1 1 0 0 1 9 14H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1.707-.707L6.25 8.838c.402-.437.817-.875 1.258-1.32A12 12 0 0 1 28 16M16 9a1 1 0 0 0-1 1v6a1 1 0 0 0 .485.858l5 3a.999.999 0 0 0 1.486-1.1 1 1 0 0 0-.456-.616L17 15.434V10a1 1 0 0 0-1-1"})})};c.forwardRef(us);const gs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M20.008 5a11.01 11.01 0 0 0-9.847 6.084A10.9 10.9 0 0 0 9 15.966 1.023 1.023 0 0 1 8.071 17 1 1 0 0 1 7 16a13 13 0 0 1 .668-4.115.5.5 0 0 0-.594-.647A8.01 8.01 0 0 0 1 19c0 4.399 3.719 8 8.125 8H20a11.01 11.01 0 0 0 10.991-11.435C30.764 9.693 25.884 5 20.008 5"})})};c.forwardRef(gs);const fs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30.991 15.565C30.764 9.693 25.884 5 20.008 5a11.01 11.01 0 0 0-9.847 6.084A10.9 10.9 0 0 0 9 15.966 1.023 1.023 0 0 1 8.071 17 1 1 0 0 1 7 16a13 13 0 0 1 .668-4.115.5.5 0 0 0-.594-.647A8.01 8.01 0 0 0 1 19c0 4.399 3.719 8 8.125 8H20a11.01 11.01 0 0 0 10.991-11.435m-7.283 3.143a1 1 0 0 1-1.415 0L20 16.414V24a1 1 0 0 1-2 0v-7.586l-2.293 2.293a1 1 0 0 1-1.415-1.415l4-4a1 1 0 0 1 1.415 0l4 4a1 1 0 0 1 0 1.415"})})};c.forwardRef(fs);const ms=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M8.96 12.153 4.342 16l4.618 3.848a1.5 1.5 0 1 1-1.92 2.305l-6-5a1.5 1.5 0 0 1 0-2.305l6-5a1.5 1.5 0 0 1 1.92 2.304m22 2.694-6-5a1.5 1.5 0 1 0-1.92 2.306L27.658 16l-4.618 3.848a1.5 1.5 0 1 0 1.92 2.305l6-5a1.5 1.5 0 0 0 0-2.305M20.512 3.59a1.5 1.5 0 0 0-1.922.898l-8 22a1.5 1.5 0 0 0 2.82 1.024l8-22a1.5 1.5 0 0 0-.898-1.922"})})};c.forwardRef(ms);const xs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M200 40h-32a16 16 0 0 0-16-16H32a16 16 0 0 0-16 16v80a16 16 0 0 0 16 16h8v64a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16m-93.66 21.66a8 8 0 0 1 11.32-11.32l24 24a8 8 0 0 1 0 11.32l-24 24a8 8 0 0 1-11.32-11.32L124.69 80Zm-64 24a8 8 0 0 1 0-11.32l24-24a8 8 0 0 1 11.32 11.32L59.31 80l18.35 18.34a8 8 0 0 1-11.32 11.32ZM200 200H56v-64h96a16 16 0 0 0 16-16V56h32Z"})})};c.forwardRef(xs);const ws=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26 10H4a1 1 0 0 0-1 1v6a12.04 12.04 0 0 0 4.068 9H4a1 1 0 0 0 0 2h22a1 1 0 0 0 0-2h-3.067a12.1 12.1 0 0 0 3.375-5.011A5 5 0 0 0 31 16v-1a5 5 0 0 0-5-5m3 6a3 3 0 0 1-2.15 2.875Q27 17.944 27 17v-4.828A3 3 0 0 1 29 15zM14 7V3a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0m4 0V3a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0m-8 0V3a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0"})})};c.forwardRef(ws);const vs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29.743 13.401a1 1 0 0 0-.487-.675l-3.729-2.125-.015-4.202a1 1 0 0 0-.353-.76 14 14 0 0 0-4.59-2.584 1 1 0 0 0-.808.074L16 5.23l-3.765-2.106a1 1 0 0 0-.809-.075 14 14 0 0 0-4.585 2.594 1 1 0 0 0-.354.758L6.47 10.61 2.74 12.734a1 1 0 0 0-.486.675 13.3 13.3 0 0 0 0 5.195 1 1 0 0 0 .486.675l3.729 2.125.015 4.204a1 1 0 0 0 .353.76 14 14 0 0 0 4.59 2.583 1 1 0 0 0 .808-.073L16 26.768l3.765 2.107a1.013 1.013 0 0 0 .809.073 14 14 0 0 0 4.585-2.592 1 1 0 0 0 .354-.759l.018-4.206 3.729-2.125a1 1 0 0 0 .486-.675c.34-1.713.338-3.477-.003-5.19M16 21a5 5 0 1 1 0-10 5 5 0 0 1 0 10"})})},bs=c.forwardRef(vs),Ch=bs,ps=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M18.5 12V6a1.5 1.5 0 1 1 3 0v4.5H26a1.5 1.5 0 1 1 0 3h-6a1.5 1.5 0 0 1-1.5-1.5M12 18.5H6a1.5 1.5 0 1 0 0 3h4.5V26a1.5 1.5 0 1 0 3 0v-6a1.5 1.5 0 0 0-1.5-1.5m14 0h-6a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 1 0 3 0v-4.5H26a1.5 1.5 0 1 0 0-3m-14-14A1.5 1.5 0 0 0 10.5 6v4.5H6a1.5 1.5 0 1 0 0 3h6a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 12 4.5"})})};c.forwardRef(ps);const $s=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M22.5 17.5h-2v-3h2a5 5 0 1 0-5-5v2h-3v-2a5 5 0 1 0-5 5h2v3h-2a5 5 0 1 0 5 5v-2h3v2a5 5 0 1 0 5-5m-2-8a2 2 0 1 1 2 2h-2zm-13 0a2 2 0 0 1 4 0v2h-2a2 2 0 0 1-2-2m4 13a2 2 0 1 1-2-2h2zm3-8h3v3h-3zm8 10a2 2 0 0 1-2-2v-2h2a2 2 0 0 1 0 4"})})};c.forwardRef($s);const Cs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30.5 24a1.5 1.5 0 0 1-1.5 1.5h-3.5V29a1.5 1.5 0 1 1-3 0v-3.5H8A1.5 1.5 0 0 1 6.5 24V9.5H3a1.5 1.5 0 0 1 0-3h3.5V3a1.5 1.5 0 0 1 3 0v19.5H29a1.5 1.5 0 0 1 1.5 1.5M13 9.5h9.5V19a1.5 1.5 0 1 0 3 0V8A1.5 1.5 0 0 0 24 6.5H13a1.5 1.5 0 0 0 0 3"})})};c.forwardRef(Cs);const js=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26.061 23.939a1.503 1.503 0 0 1-2.125 2.125L16 18.125l-7.939 7.936a1.503 1.503 0 1 1-2.125-2.125L13.875 16 5.939 8.061a1.503 1.503 0 1 1 2.125-2.125L16 13.875l7.939-7.94a1.502 1.502 0 1 1 2.125 2.125L18.125 16z"})})},ys=c.forwardRef(js),We=ys,Ss=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m4.708 16.293a1 1 0 0 1-1.415 1.415L16 17.414l-3.293 3.293a1 1 0 0 1-1.415-1.415L14.587 16l-3.293-3.293a1 1 0 1 1 1.415-1.415L16 14.587l3.293-3.293a1 1 0 0 1 1.415 1.415L17.414 16z"})})};c.forwardRef(Ss);const Rs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30.48 9.524a1.51 1.51 0 0 0-1.668-.213l-6.276 3.125-5.24-8.704a1.514 1.514 0 0 0-2.592 0l-5.24 8.708L3.19 9.315a1.514 1.514 0 0 0-2.113 1.825l4.625 14.17a1 1 0 0 0 1.46.55C7.194 25.841 10.39 24 16 24s8.806 1.841 8.835 1.859a1 1 0 0 0 1.464-.549l4.625-14.166a1.51 1.51 0 0 0-.444-1.62M21.98 19.6a1 1 0 0 1-1.159.811 28.5 28.5 0 0 0-9.652 0 1 1 0 0 1-.348-1.97 30.6 30.6 0 0 1 10.348 0 1 1 0 0 1 .816 1.159z"})})};c.forwardRef(Rs);const Is=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27.414 24a2 2 0 0 1 0 2.829l-.585.585a2 2 0 0 1-2.829 0l-6.906-6.905-2.735 6.292A1.98 1.98 0 0 1 12.533 28h-.098a1.98 1.98 0 0 1-1.801-1.375L4.1 6.615A1.994 1.994 0 0 1 6.615 4.1l20.01 6.534a2 2 0 0 1 .176 3.725l-6.292 2.735z"})})};c.forwardRef(Is);const As=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3C9.271 3 4 6.075 4 10v12c0 3.925 5.271 7 12 7s12-3.075 12-7V10c0-3.925-5.271-7-12-7m10 13c0 1.203-.985 2.429-2.701 3.365C21.366 20.419 18.774 21 16 21s-5.366-.581-7.299-1.635C6.985 18.429 6 17.203 6 16v-2.08C8.133 15.795 11.779 17 16 17s7.868-1.21 10-3.08zm-2.701 9.365C21.366 26.419 18.774 27 16 27s-5.366-.581-7.299-1.635C6.985 24.429 6 23.203 6 22v-2.08C8.133 21.795 11.779 23 16 23s7.868-1.21 10-3.08V22c0 1.203-.985 2.429-2.701 3.365"})})};c.forwardRef(As);const Ms=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29 12a2 2 0 0 0-2-2h-4V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a1 1 0 0 0 1.625.777L9 19.25V23a2 2 0 0 0 2 2h11.699l4.676 3.778A1 1 0 0 0 29 28zm-5.319 11.223a1 1 0 0 0-.625-.223H11v-4h10a2 2 0 0 0 2-2v-5h4v13.906z"})})};c.forwardRef(Ms);const Ts=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 19v7a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 26v-7a1.5 1.5 0 0 1 3 0v6.5h19V19a1.5 1.5 0 1 1 3 0m-13.561 1.061a1.5 1.5 0 0 0 2.125 0l5-5a1.502 1.502 0 1 0-2.125-2.125L17.5 15.375V5a1.5 1.5 0 1 0-3 0v10.375l-2.439-2.436a1.502 1.502 0 1 0-2.125 2.125z"})})};c.forwardRef(Ts);const Vs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M13.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0m7 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4m-9 4.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4m9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-9 8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4m9 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4"})})};c.forwardRef(Vs);const Es=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 4H11a1 1 0 0 0-1 1v5H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5h5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1m-1 16h-4v-9a1 1 0 0 0-1-1h-9V6h14z"})})};c.forwardRef(Es);const Ls=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m11 13c.001 1.411-.27 2.81-.8 4.118l-5.587-3.437a2 2 0 0 0-.78-.279l-2.853-.385a2.01 2.01 0 0 0-2 .983h-1.09l-.475-.983a1.99 1.99 0 0 0-1.375-1.083l-1-.216.978-1.718h2.088c.338 0 .67-.087.966-.25l1.532-.845q.202-.113.375-.268l3.364-3.042a1.99 1.99 0 0 0 .407-2.458l-.045-.08A11.01 11.01 0 0 1 27 16M5 16a10.94 10.94 0 0 1 1.068-4.725l1.417 3.784a2 2 0 0 0 1.453 1.25l2.678.576.476.99a2.01 2.01 0 0 0 1.8 1.125h.186l-.904 2.029a2 2 0 0 0 .357 2.171l.018.018L16 25.742l-.242 1.25A11.014 11.014 0 0 1 5 16"})})};c.forwardRef(Ls);const Hs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:[a.jsx("path",{d:"M20.689 3.88A13 13 0 0 0 16 3a13 13 0 0 0-8.155 23.124l1.02-1.765A11 11 0 0 1 5 16a10.94 10.94 0 0 1 1.068-4.724l1.417 3.784a2 2 0 0 0 1.453 1.25l2.678.576.476.99q.113.226.275.418l1.169-2.025-.121-.25a1.99 1.99 0 0 0-1.375-1.084l-1-.217.978-1.717h2.088c.338 0 .67-.087.966-.25l.726-.4z"}),a.jsx("path",{fillRule:"evenodd",d:"m24 2.144 1.732 1-1.58 2.736q.54.435 1.036.932A13.01 13.01 0 0 1 29 16a13 13 0 0 1-17.69 12.124l-1.578 2.732-1.732-1zm-.86 5.49-4.936 8.549 1.628.22c.277.037.543.132.78.278l5.588 3.436c.53-1.308.801-2.706.8-4.117a11.01 11.01 0 0 0-3.86-8.367M13.92 23.6l-1.593 2.76a11 11 0 0 0 3.43.631l.242-1.25z",clipRule:"evenodd"})]})};c.forwardRef(Hs);const Bs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m-4.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m10.365 7.5C20.579 21.724 18.441 23 16 23s-4.579-1.275-5.865-3.5a1.001 1.001 0 0 1 1.477-1.31q.157.129.253.31C12.799 20.114 14.266 21 16 21s3.201-.887 4.135-2.5a1 1 0 1 1 1.73 1M20.5 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(Bs);const Ds=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m-4.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m10 10.865a1 1 0 0 1-1.365-.365C19.201 20.886 17.734 20 16 20s-3.201.887-4.135 2.5a1.001 1.001 0 1 1-1.73-1C11.421 19.276 13.559 18 16 18s4.579 1.275 5.865 3.5a1 1 0 0 1-.365 1.365M20.5 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(Ds);const zs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27.5 6v5a1.5 1.5 0 1 1-3 0V7.5H21a1.5 1.5 0 0 1 0-3h5A1.5 1.5 0 0 1 27.5 6M11 24.5H7.5V21a1.5 1.5 0 0 0-3 0v5A1.5 1.5 0 0 0 6 27.5h5a1.5 1.5 0 1 0 0-3m15-5a1.5 1.5 0 0 0-1.5 1.5v3.5H21a1.5 1.5 0 1 0 0 3h5a1.5 1.5 0 0 0 1.5-1.5v-5a1.5 1.5 0 0 0-1.5-1.5m-15-15H6A1.5 1.5 0 0 0 4.5 6v5a1.5 1.5 0 0 0 3 0V7.5H11a1.5 1.5 0 0 0 0-3"})})};c.forwardRef(zs);const ks=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 13a1.5 1.5 0 1 1-3 0V8.625l-7.439 7.439a1.503 1.503 0 1 1-2.125-2.125L23.375 6.5H19a1.5 1.5 0 0 1 0-3h8A1.5 1.5 0 0 1 28.5 5zM23 16a1.5 1.5 0 0 0-1.5 1.5v8h-15v-15h8a1.5 1.5 0 1 0 0-3H6A2.5 2.5 0 0 0 3.5 10v16A2.5 2.5 0 0 0 6 28.5h16a2.5 2.5 0 0 0 2.5-2.5v-8.5A1.5 1.5 0 0 0 23 16"})})},Ns=c.forwardRef(ks),Os=Ns,Fs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30.914 15.595c-.044-.099-1.103-2.447-3.457-4.801C24.322 7.657 20.36 6 16 6S7.679 7.657 4.542 10.794C2.19 13.148 1.125 15.5 1.086 15.595a1 1 0 0 0 0 .812c.044.1 1.103 2.447 3.456 4.8C7.68 24.344 11.64 26 16 26s8.321-1.657 11.458-4.792c2.353-2.354 3.412-4.702 3.456-4.8a1 1 0 0 0 0-.813M16 21a5 5 0 1 1 0-10 5 5 0 0 1 0 10"})})};c.forwardRef(Fs);const _s=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M6.74 4.328a1 1 0 1 0-1.48 1.345l2.405 2.646c-4.54 2.786-6.493 7.081-6.579 7.276a1 1 0 0 0 0 .813c.044.098 1.103 2.446 3.456 4.8C7.68 24.343 11.64 26 16 26c2.24.013 4.459-.448 6.509-1.354l2.75 3.027a1 1 0 1 0 1.48-1.345zm11.125 15.21a4 4 0 0 1-5.209-5.73zm13.049-3.13c-.053.117-1.319 2.92-4.17 5.475a1 1 0 0 1-1.408-.072L12.675 7.884a1 1 0 0 1 .575-1.66A17 17 0 0 1 16 6c4.36 0 8.321 1.658 11.458 4.794 2.353 2.354 3.412 4.702 3.456 4.801a1 1 0 0 1 0 .813"})})};c.forwardRef(_s);const Ws=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M17 15v12a1 1 0 0 1-2 0V15a1 1 0 0 1 2 0m8 9a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1m3-6h-2V5a1 1 0 0 0-2 0v13h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M7 20a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1m3-6H8V5a1 1 0 0 0-2 0v9H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1m9-6h-2V5a1 1 0 0 0-2 0v3h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1"})})};c.forwardRef(Ws);const Us=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m26.48 16.851-7.474 7.559a1.97 1.97 0 0 1-1.4.585H9.415l-3.707 3.712a1.001 1.001 0 0 1-1.415-1.415l2.823-2.822L15.588 16h10.537a.5.5 0 0 1 .355.851m.607-13.03a8 8 0 0 0-10.737.518l-1.2 1.185a.5.5 0 0 0-.15.351v7.875l6.875-6.875a1 1 0 0 1 1.414 1.414L17.589 14h11.047a.5.5 0 0 0 .445-.27 8.01 8.01 0 0 0-1.994-9.909M7.854 20.904 13 15.758V8.845a.5.5 0 0 0-.851-.355L7.586 13A1.99 1.99 0 0 0 7 14.414v6.136a.5.5 0 0 0 .854.354"})})};c.forwardRef(Us);const qs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m26.708 10.293-7-7A1 1 0 0 0 19 3H7a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V11a1 1 0 0 0-.293-.707M19 11V5.5l5.5 5.5z"})})};c.forwardRef(qs);const Gs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m213.66 82.34-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66M152 88V44l44 44ZM48 180c0 11 7.18 20 16 20a14.18 14.18 0 0 0 10.06-4.5 8.21 8.21 0 0 1 10.9-.91 8 8 0 0 1 .82 11.81A30.06 30.06 0 0 1 64 216c-17.64 0-32-16.15-32-36s14.36-36 32-36a30 30 0 0 1 21.39 9.19 8.26 8.26 0 0 1 .73 11.09 8 8 0 0 1-11.9.38A14.17 14.17 0 0 0 64 160c-8.82 0-16 9-16 20m103.81 16.31a20.82 20.82 0 0 1-9.19 15.23C137.43 215 131 216 125.13 216a61.1 61.1 0 0 1-15.13-2 8 8 0 1 1 4.3-15.41c4.38 1.2 14.95 2.7 19.55-.36.88-.59 1.83-1.52 2.14-3.93.35-2.67-.71-4.1-12.78-7.59-9.35-2.7-25-7.23-23-23.11a20.56 20.56 0 0 1 9-14.95c11.84-8 30.71-3.31 32.83-2.76a8 8 0 0 1-4.07 15.48c-4.49-1.17-15.23-2.56-19.83.56a4.54 4.54 0 0 0-2 3.67c-.12.9-.14 1.09 1.11 1.9 2.31 1.49 6.45 2.68 10.45 3.84 9.79 2.83 26.35 7.66 24.11 24.97M215.42 155l-19.89 55.68a8 8 0 0 1-15.06 0L160.58 155a8.21 8.21 0 0 1 4.5-10.45 8 8 0 0 1 10.45 4.76l12.47 34.9 12.47-34.9a8 8 0 0 1 10.45-4.76 8.23 8.23 0 0 1 4.5 10.45"})})};c.forwardRef(Gs);const Ks=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m26.708 10.293-7-7A1 1 0 0 0 19 3H7a2 2 0 0 0-2 2v22a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V11a1 1 0 0 0-.293-.707m-7 11a1 1 0 0 1-1.415 1.415L16 20.414l-2.293 2.293a1 1 0 0 1-1.415-1.415L14.587 19l-2.293-2.293a1 1 0 1 1 1.415-1.415L16 17.587l2.293-2.293a1 1 0 0 1 1.415 1.415L17.414 19zM19 11V5.5l5.5 5.5z"})})};c.forwardRef(Ks);const Ys=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M6 15h20a1 1 0 0 0 1-1v-3a1 1 0 0 0-.293-.707l-7-7A1 1 0 0 0 19 3H7a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1m13-9.5 5.5 5.5H19zM28 19a1 1 0 0 1-1 1h-3v2h2a1 1 0 0 1 0 2h-2v2a1 1 0 0 1-2 0v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1M8 18H6a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-1h1a3.5 3.5 0 1 0 0-7m0 5H7v-3h1a1.5 1.5 0 1 1 0 3m8-5h-2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2a4.5 4.5 0 1 0 0-9m0 7h-1v-5h1a2.5 2.5 0 0 1 0 5"})})};c.forwardRef(Ys);const Zs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M44 120h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4m108-76 44 44h-44Zm4 164.53a8.18 8.18 0 0 1-8.25 7.47H120a8 8 0 0 1-8-8v-55.73a8.18 8.18 0 0 1 7.47-8.25 8 8 0 0 1 8.53 8v48h20a8 8 0 0 1 8 8.51m-61.49-51.88L77.83 180l16.68 23.35a8 8 0 0 1-13 9.3L68 193.76l-13.49 18.89a8 8 0 1 1-13-9.3L58.17 180l-16.68-23.35a8 8 0 0 1 2.3-11.46 8.19 8.19 0 0 1 10.88 2.38L68 166.24l13.49-18.89a8 8 0 0 1 13 9.3Zm121.28 39.66a20.81 20.81 0 0 1-9.18 15.23c-5.19 3.46-11.67 4.46-17.49 4.46a60.6 60.6 0 0 1-15.19-2 8 8 0 0 1 4.31-15.41c4.38 1.21 14.94 2.71 19.54-.35.89-.6 1.84-1.52 2.15-3.93.34-2.67-.72-4.1-12.78-7.59-9.35-2.7-25-7.23-23-23.12a20.58 20.58 0 0 1 8.95-14.94c11.84-8 30.72-3.31 32.83-2.76a8 8 0 0 1-4.07 15.48c-4.48-1.17-15.22-2.56-19.82.56a4.54 4.54 0 0 0-2 3.67c-.11.9-.13 1.08 1.12 1.9 2.31 1.49 6.45 2.68 10.45 3.84 9.87 2.82 26.39 7.65 24.18 24.96"})})};c.forwardRef(Zs);const Qs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M184 144h-16a8 8 0 0 0-8 8v55.73a8.17 8.17 0 0 0 7.47 8.25 8 8 0 0 0 8.53-8v-8h7.4c15.24 0 28.14-11.92 28.59-27.15A28 28 0 0 0 184 144m-.35 40H176v-24h8a12 12 0 0 1 12 13.16A12.25 12.25 0 0 1 183.65 184M136 152v55.73a8.17 8.17 0 0 1-7.47 8.25 8 8 0 0 1-8.53-8v-55.71a8.17 8.17 0 0 1 7.47-8.25A8 8 0 0 1 136 152m-40 56.53a8.17 8.17 0 0 1-8.27 7.47h-31.5a8.27 8.27 0 0 1-6-2.5 8 8 0 0 1-1.18-9.5l25.16-44H56.27a8.17 8.17 0 0 1-8.27-7.47 8 8 0 0 1 8-8.53h31.77a8.27 8.27 0 0 1 6 2.5A8 8 0 0 1 95 156l-25.21 44H88a8 8 0 0 1 8 8.53M213.66 82.34l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66M152 88V44l44 44Z"})})};c.forwardRef(Qs);const Xs=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 17 16",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m13.687 4.146-2.5-2.5a.5.5 0 0 0-.354-.146h-5a1 1 0 0 0-1 1v1h-1a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1v-7a.5.5 0 0 0-.146-.354M8.833 12h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1m0-2h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 1 0 1m4 1.5h-1v-5a.5.5 0 0 0-.146-.354l-2.5-2.5a.5.5 0 0 0-.354-.146h-3v-1h4.793l2.207 2.207z"})})};c.forwardRef(Xs);const Js=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M25.5 16a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 1 1 0-3h16a1.5 1.5 0 0 1 1.5 1.5M29 8.5H3a1.5 1.5 0 0 0 0 3h26a1.5 1.5 0 1 0 0-3m-10 12h-6a1.5 1.5 0 1 0 0 3h6a1.5 1.5 0 1 0 0-3"})})};c.forwardRef(Js);const Ps=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 9H16.414L13 5.586A1.98 1.98 0 0 0 11.586 5H5a2 2 0 0 0-2 2v18.078A1.926 1.926 0 0 0 4.924 27H27.11A1.89 1.89 0 0 0 29 25.111V11a2 2 0 0 0-2-2M5 7h6.586l2 2H5z"})})};c.forwardRef(Ps);const ei=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 9h-4.385q.075-.06.146-.125A3.7 3.7 0 0 0 24 6.196 4.08 4.08 0 0 0 19.805 2a3.7 3.7 0 0 0-2.68 1.239A6.9 6.9 0 0 0 16 5.049a6.9 6.9 0 0 0-1.125-1.81A3.7 3.7 0 0 0 12.195 2 4.08 4.08 0 0 0 8 6.196a3.7 3.7 0 0 0 1.239 2.679q.072.06.146.125H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2v8a2 2 0 0 0 2 2h7.5a.5.5 0 0 0 .5-.5V15H5v-4h10v4h2v-4h10v4H17v11.5a.5.5 0 0 0 .5.5H25a2 2 0 0 0 2-2v-8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2M10.564 7.375A1.7 1.7 0 0 1 10 6.125 2.076 2.076 0 0 1 12.074 4h.061a1.71 1.71 0 0 1 1.25.563c1.049 1.185 1.419 3.15 1.549 4.365-1.22-.13-3.184-.5-4.37-1.553m10.875 0c-1.186 1.05-3.155 1.42-4.375 1.55.148-1.314.561-3.237 1.561-4.361A1.7 1.7 0 0 1 19.875 4h.061A2.077 2.077 0 0 1 22 6.135a1.7 1.7 0 0 1-.564 1.24z"})})};c.forwardRef(ei);const ti=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m9.796 8h-4.428a17.8 17.8 0 0 0-2.533-5.625A11.05 11.05 0 0 1 25.796 11M16 5.014c1.5 1.625 2.625 3.693 3.296 5.986h-6.592C13.375 8.707 14.5 6.641 16 5.014M12 16c0-1.005.084-2.009.25-3h7.5a18.2 18.2 0 0 1 0 6h-7.5a18 18 0 0 1-.25-3m.704 5h6.592c-.671 2.293-1.796 4.359-3.296 5.986-1.5-1.627-2.625-3.693-3.296-5.986m6.131 5.625A17.8 17.8 0 0 0 21.367 21h4.43a11.05 11.05 0 0 1-6.962 5.625M21.776 19a20.2 20.2 0 0 0 0-6h4.808a11 11 0 0 1 0 6z"})})};c.forwardRef(ti);const ni=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 17 16",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M13 9.5c-.357 0-.71.085-1.028.25l-1.337-1.04a2.2 2.2 0 0 0 .116-.67l.646-.214a2.25 2.25 0 1 0-.636-1.37l-.487.162A2.25 2.25 0 0 0 8.5 5.75c-.062 0-.117 0-.175.008l-.278-.625A2.25 2.25 0 1 0 6.5 5.75c.063 0 .118 0 .176-.008l.278.625a2.24 2.24 0 0 0-.537 2.482l-1.33 1.182a2.25 2.25 0 1 0 .997 1.12l1.33-1.182a2.25 2.25 0 0 0 2.3-.075l1.224.954A2.25 2.25 0 1 0 13.001 9.5m0-4A.75.75 0 1 1 13 7a.75.75 0 0 1 0-1.5m-7.25-2a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0M4 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5M7.75 8a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0M13 12.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5"})})};c.forwardRef(ni);const oi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M13.29 28.226 6.765 24.46a2.822 2.822 0 1 1-2.708-4.693v-7.532a2.824 2.824 0 1 1 2.708-4.693l6.525-3.767a2.824 2.824 0 1 1 5.42 0l6.524 3.766a2.822 2.822 0 1 1 2.71 4.693v7.533a2.824 2.824 0 1 1-2.71 4.694l-6.524 3.766A2.825 2.825 0 0 1 16 31.84a2.822 2.822 0 0 1-2.71-3.614M16 5.806q.413-.002.791-.113l8.531 14.776a2.8 2.8 0 0 0-.791 1.37H7.467a2.8 2.8 0 0 0-.79-1.369L15.21 5.693q.377.11.791.112M7.468 23.178l-.033.12 6.526 3.767A2.81 2.81 0 0 1 16 26.195c.802 0 1.526.334 2.04.871l6.523-3.766-.032-.121zM5.397 12.233a2.824 2.824 0 0 0 2.038-3.532l6.526-3.767q.043.045.088.088L5.517 19.8l-.12-.032zM26.482 19.8q.06-.018.121-.033v-7.532a2.824 2.824 0 0 1-2.04-3.534L18.04 4.934q-.045.045-.089.088z",clipRule:"evenodd"})})};c.forwardRef(oi);const ai=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 7v7.5a.5.5 0 0 1-.5.5H17V5.5a.5.5 0 0 1 .5-.5H25a2 2 0 0 1 2 2M14.5 5H7a2 2 0 0 0-2 2v7.5a.5.5 0 0 0 .5.5H15V5.5a.5.5 0 0 0-.5-.5m12 12H17v9.5a.5.5 0 0 0 .5.5H25a2 2 0 0 0 2-2v-7.5a.5.5 0 0 0-.5-.5M5 17.5V25a2 2 0 0 0 2 2h7.5a.5.5 0 0 0 .5-.5V17H5.5a.5.5 0 0 0-.5.5"})})};c.forwardRef(ai);const ri=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M10.5 6.5v5h-7A.5.5 0 0 1 3 11V8a2 2 0 0 1 2-2h5a.5.5 0 0 1 .5.5m2 19a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-5h-7zM3 21v3a2 2 0 0 0 2 2h5a.5.5 0 0 0 .5-.5v-5h-7a.5.5 0 0 0-.5.5m0-7v4a.5.5 0 0 0 .5.5h7v-5h-7a.5.5 0 0 0-.5.5m16-8h-6a.5.5 0 0 0-.5.5v5h7v-5A.5.5 0 0 0 19 6m9.5 7.5h-7v5h7a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5m-16 5h7v-5h-7zM27 6h-5a.5.5 0 0 0-.5.5v5h7a.5.5 0 0 0 .5-.5V8a2 2 0 0 0-2-2m1.5 14.5h-7v5a.5.5 0 0 0 .5.5h5a2 2 0 0 0 2-2v-3a.5.5 0 0 0-.5-.5"})})};c.forwardRef(ri);const si=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.791 17.633a3.04 3.04 0 0 0-2.326-.597C28.813 14.666 30 12.31 30 10c0-3.309-2.661-6-5.933-6A5.95 5.95 0 0 0 19.5 6.094 5.95 5.95 0 0 0 14.932 4C11.663 4 9 6.691 9 10c0 1.375.405 2.711 1.258 4.125a4 4 0 0 0-1.844 1.05L5.586 18H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h13q.123 0 .242-.03l8-2a1 1 0 0 0 .15-.05l4.858-2.067.055-.025a3.074 3.074 0 0 0 .491-5.195zm-1.362 3.393-4.75 2.023L14.875 25H7v-5.586l2.829-2.828A1.98 1.98 0 0 1 11.242 16H17.5a1.5 1.5 0 0 1 0 3H14a1 1 0 0 0 0 2h4q.113 0 .224-.025l8.375-1.926.038-.01a1.075 1.075 0 0 1 .788 1.987z"})})};c.forwardRef(si);const ii=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 10.5h-5.475l.951-5.231a1.5 1.5 0 1 0-2.952-.538L19.475 10.5h-4.95l.951-5.231a1.5 1.5 0 1 0-2.952-.538L11.475 10.5H6a1.5 1.5 0 0 0 0 3h4.93l-.909 5H4a1.5 1.5 0 0 0 0 3h5.475l-.951 5.231a1.5 1.5 0 0 0 1.207 1.75q.134.022.269.019a1.5 1.5 0 0 0 1.475-1.233l1.05-5.767h4.95l-.951 5.231a1.5 1.5 0 1 0 2.952.543l1.049-5.774H26a1.5 1.5 0 1 0 0-3h-4.93l.909-5H28a1.5 1.5 0 1 0 0-3m-9.979 8H13.07l.909-5h4.951z"})})};c.forwardRef(ii);const ci=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M31.5 22.5a5 5 0 0 1-5 5 4.94 4.94 0 0 1-3.571-1.45 1.5 1.5 0 0 1 2.142-2.1 1.94 1.94 0 0 0 1.429.55 2 2 0 0 0 0-4 1.94 1.94 0 0 0-1.429.55 1.5 1.5 0 0 1-2.551-1.3l1-6A1.5 1.5 0 0 1 25 12.5h5a1.5 1.5 0 1 1 0 3h-3.729l-.338 2.029q.283-.03.567-.029a5 5 0 0 1 5 5M18 5.5A1.5 1.5 0 0 0 16.5 7v6h-10V7a1.5 1.5 0 0 0-3 0v15a1.5 1.5 0 0 0 3 0v-6h10v6a1.5 1.5 0 1 0 3 0V7A1.5 1.5 0 0 0 18 5.5"})})};c.forwardRef(ci);const li=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M32 22a1.5 1.5 0 0 1-1.5 1.5V26a1.5 1.5 0 1 1-3 0v-2.5H23a1.5 1.5 0 0 1-1.422-1.974l3-9a1.5 1.5 0 0 1 2.845.948L25.08 20.5H27.5V18a1.5 1.5 0 1 1 3 0v2.5A1.5 1.5 0 0 1 32 22M18 5.5A1.5 1.5 0 0 0 16.5 7v6h-10V7a1.5 1.5 0 0 0-3 0v15a1.5 1.5 0 0 0 3 0v-6h10v6a1.5 1.5 0 1 0 3 0V7A1.5 1.5 0 0 0 18 5.5"})})};c.forwardRef(li);const di=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29.5 14v12a1.5 1.5 0 1 1-3 0v-9.198l-.668.448a1.503 1.503 0 0 1-1.665-2.5l3-2A1.5 1.5 0 0 1 29.5 14M18 5.5A1.5 1.5 0 0 0 16.5 7v6h-10V7a1.5 1.5 0 0 0-3 0v15a1.5 1.5 0 0 0 3 0v-6h10v6a1.5 1.5 0 1 0 3 0V7A1.5 1.5 0 0 0 18 5.5"})})};c.forwardRef(di);const hi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m27.133 17.541 1.655-2.772a1.5 1.5 0 1 0-2.576-1.538l-4.03 6.75q-.018.029-.032.059a5 5 0 1 0 4.983-2.5zM26.5 24.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4M19.5 7v15a1.5 1.5 0 1 1-3 0v-6h-10v6a1.5 1.5 0 0 1-3 0V7a1.5 1.5 0 0 1 3 0v6h10V7a1.5 1.5 0 1 1 3 0"})})};c.forwardRef(hi);const ui=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M31.5 22.5a5 5 0 0 1-8.571 3.5 1.5 1.5 0 1 1 2.142-2.099A2 2 0 1 0 26.5 20.5a1.5 1.5 0 0 1-1.229-2.36l1.854-2.64H24a1.5 1.5 0 1 1 0-3h6a1.5 1.5 0 0 1 1.229 2.36l-2.293 3.275A5 5 0 0 1 31.5 22.5M18 5.5A1.5 1.5 0 0 0 16.5 7v6h-10V7a1.5 1.5 0 0 0-3 0v15a1.5 1.5 0 0 0 3 0v-6h10v6a1.5 1.5 0 1 0 3 0V7A1.5 1.5 0 0 0 18 5.5"})})};c.forwardRef(ui);const gi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M19.5 7v15a1.5 1.5 0 1 1-3 0v-6h-10v6a1.5 1.5 0 0 1-3 0V7a1.5 1.5 0 0 1 3 0v6h10V7a1.5 1.5 0 1 1 3 0M30 24.5h-3l3.593-4.791a4.499 4.499 0 1 0-7.837-4.209 1.5 1.5 0 1 0 2.829 1q.076-.218.216-.402a1.5 1.5 0 1 1 2.394 1.807L22.8 25.1a1.5 1.5 0 0 0 1.2 2.4h6a1.5 1.5 0 1 0 0-3"})})};c.forwardRef(gi);const fi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29 17v7a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3h2.956A10.964 10.964 0 0 0 16.081 6H16A11 11 0 0 0 5.045 16H8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a13.014 13.014 0 0 1 22.236-9.167A12.93 12.93 0 0 1 29 17"})})};c.forwardRef(fi);const mi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30 11.75c0 8.75-12.974 15.833-13.526 16.125a1 1 0 0 1-.948 0C14.974 27.582 2 20.5 2 11.75A7.76 7.76 0 0 1 9.75 4c2.581 0 4.841 1.11 6.25 2.986C17.409 5.11 19.669 4 22.25 4A7.76 7.76 0 0 1 30 11.75"})})};c.forwardRef(mi);const xi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 14.444V26a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14.444a2 2 0 0 1 .646-1.473l10-9.435.014-.013a2 2 0 0 1 2.705.013l10 9.435A2 2 0 0 1 28 14.444"})})};c.forwardRef(xi);const wi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 5H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-7.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M5 25v-3.5l6.5-6.5 10 10zm22 0h-2.671l-4.5-4.5 2.5-2.5L27 22.672z"})})};c.forwardRef(wi);const vi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 5H9a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M23 25H5V11h2v10a2 2 0 0 0 2 2h14zm4-4H9v-4.5l4.5-4.5 6.208 6.208a1 1 0 0 0 1.413 0L24.33 15 27 17.672z"})})};c.forwardRef(vi);const bi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5H15a1.5 1.5 0 0 1 0-3h12a1.5 1.5 0 0 1 1.5 1.5M15 9.5h12a1.5 1.5 0 0 0 0-3H15a1.5 1.5 0 0 0 0 3m12 13H5a1.5 1.5 0 1 0 0 3h22a1.5 1.5 0 0 0 0-3m-18-4a1.5 1.5 0 0 0 1.061-2.561L6.125 12l3.936-3.94a1.503 1.503 0 1 0-2.125-2.125l-5 5a1.5 1.5 0 0 0 0 2.125l5 5A1.5 1.5 0 0 0 9 18.5"})})};c.forwardRef(bi);const pi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5H15a1.5 1.5 0 0 1 0-3h12a1.5 1.5 0 0 1 1.5 1.5M15 9.5h12a1.5 1.5 0 0 0 0-3H15a1.5 1.5 0 0 0 0 3m12 13H5a1.5 1.5 0 0 0 0 3h22a1.5 1.5 0 1 0 0-3M3.939 18.06a1.5 1.5 0 0 0 2.125 0l5-5a1.5 1.5 0 0 0 0-2.125l-5-5a1.503 1.503 0 0 0-2.125 2.125L7.875 12l-3.936 3.939a1.5 1.5 0 0 0 0 2.122"})})};c.forwardRef(pi);const $i=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m-.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M17 23a2 2 0 0 1-2-2v-5a1 1 0 0 1 0-2 2 2 0 0 1 2 2v5a1 1 0 0 1 0 2"})})};c.forwardRef($i);const Ci=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M25.5 7A1.5 1.5 0 0 1 24 8.5h-3.919l-5 15H18a1.5 1.5 0 1 1 0 3H8a1.5 1.5 0 1 1 0-3h3.919l5-15H14a1.5 1.5 0 0 1 0-3h10A1.5 1.5 0 0 1 25.5 7"})})};c.forwardRef(Ci);const ji=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M20 2a10.01 10.01 0 0 0-9.511 13.098l-7.196 7.195A1 1 0 0 0 3 23v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 .707-.293l1.195-1.196A10 10 0 1 0 20 2m2.5 9.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4"})})};c.forwardRef(ji);const yi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 5H5a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2M5 7h22v5H5zm22 18H14V14h13z"})})};c.forwardRef(yi);const Si=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M22 29a1 1 0 0 1-1 1H11a1 1 0 1 1 0-2h10a1 1 0 0 1 1 1m5-16a10.94 10.94 0 0 1-4.205 8.651A2.03 2.03 0 0 0 22 23.25V24a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-.75a2 2 0 0 0-.779-1.582A10.95 10.95 0 0 1 5 13.06C4.967 7.104 9.782 2.143 15.735 2A11 11 0 0 1 27 13m-4.014-1.168a7.2 7.2 0 0 0-5.82-5.818 1 1 0 1 0-.332 1.972c2.071.349 3.829 2.106 4.18 4.182a1 1 0 0 0 1.972-.335"})})};c.forwardRef(Si);const Ri=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m21.731 14.683-14 15a1 1 0 0 1-1.711-.875l1.832-9.167L.65 16.936a1 1 0 0 1-.375-1.625l14-15a1 1 0 0 1 1.71.875l-1.837 9.177 7.204 2.7a1 1 0 0 1 .375 1.62z"})})};c.forwardRef(Ri);const Ii=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M17.046 23.441a1.5 1.5 0 0 1 0 2.125l-.742.743a7.502 7.502 0 1 1-10.61-10.61l3.015-3.014A7.5 7.5 0 0 1 19 12.375a1.506 1.506 0 0 1-2 2.25 4.5 4.5 0 0 0-6.171.184l-3.013 3.01a4.5 4.5 0 0 0 6.365 6.365l.743-.743a1.5 1.5 0 0 1 2.122 0m9.26-17.75a7.51 7.51 0 0 0-10.61 0l-.742.743a1.503 1.503 0 1 0 2.125 2.125l.742-.743a4.5 4.5 0 0 1 6.365 6.365l-3.014 3.015a4.5 4.5 0 0 1-6.172.179 1.506 1.506 0 1 0-2 2.25 7.5 7.5 0 0 0 10.288-.304l3.014-3.014a7.51 7.51 0 0 0 .004-10.613z"})})};c.forwardRef(Ii);const Ai=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 1 1 0-3h22a1.5 1.5 0 0 1 1.5 1.5M5 9.5h22a1.5 1.5 0 0 0 0-3H5a1.5 1.5 0 0 0 0 3m22 13H5a1.5 1.5 0 1 0 0 3h22a1.5 1.5 0 1 0 0-3"})})};c.forwardRef(Ai);const Mi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M3.5 8A1.5 1.5 0 0 1 5 6.5h22a1.5 1.5 0 0 1 0 3H5A1.5 1.5 0 0 1 3.5 8M5 17.5h22a1.5 1.5 0 1 0 0-3H5a1.5 1.5 0 1 0 0 3m13 5H5a1.5 1.5 0 1 0 0 3h13a1.5 1.5 0 1 0 0-3m11 0h-1.5V21a1.5 1.5 0 1 0-3 0v1.5H23a1.5 1.5 0 1 0 0 3h1.5V27a1.5 1.5 0 1 0 3 0v-1.5H29a1.5 1.5 0 1 0 0-3"})})};c.forwardRef(Mi);const Ti=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 64a12 12 0 0 1 12-12h176a12 12 0 0 1 0 24H40a12 12 0 0 1-12-12m12 76h64a12 12 0 0 0 0-24H40a12 12 0 0 0 0 24m80 40H40a12 12 0 0 0 0 24h80a12 12 0 0 0 0-24m120.49 20.49a12 12 0 0 1-17 0l-18.08-18.08a44 44 0 1 1 17-17l18.08 18.07a12 12 0 0 1 0 17.01M184 164a20 20 0 1 0-20-20 20 20 0 0 0 20 20"})})};c.forwardRef(Ti);const Vi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M17.5 4v4a1.5 1.5 0 1 1-3 0V4a1.5 1.5 0 1 1 3 0m4.156 7.844a1.5 1.5 0 0 0 1.062-.44l2.828-2.829a1.503 1.503 0 1 0-2.125-2.125l-2.825 2.833a1.5 1.5 0 0 0 1.06 2.56M28 14.5h-4a1.5 1.5 0 1 0 0 3h4a1.5 1.5 0 1 0 0-3m-5.282 6.096a1.501 1.501 0 0 0-2.451 1.638c.075.182.186.348.326.487l2.828 2.829a1.503 1.503 0 0 0 2.125-2.125zM16 22.5a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 1 0 3 0v-4a1.5 1.5 0 0 0-1.5-1.5m-6.717-1.904-2.83 2.829A1.503 1.503 0 0 0 8.58 25.55l2.829-2.829a1.503 1.503 0 0 0-2.125-2.125M9.5 16A1.5 1.5 0 0 0 8 14.5H4a1.5 1.5 0 1 0 0 3h4A1.5 1.5 0 0 0 9.5 16m-.925-9.546A1.503 1.503 0 0 0 6.45 8.579l2.833 2.825a1.503 1.503 0 0 0 2.125-2.125z"})})},Ei=c.forwardRef(Vi),Yn=Ei,Li=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26 10h-4V7a6 6 0 1 0-12 0v3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2M16 20.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M20 10h-8V7a4 4 0 1 1 8 0z"})})};c.forwardRef(Li);const Hi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M31 19a1 1 0 0 1-1 1h-2v2a1 1 0 0 1-2 0v-2h-2a1 1 0 0 1 0-2h2v-2a1 1 0 1 1 2 0v2h2a1 1 0 0 1 1 1M7 9h2v2a1 1 0 1 0 2 0V9h2a1 1 0 0 0 0-2h-2V5a1 1 0 0 0-2 0v2H7a1 1 0 0 0 0 2m16 15h-1v-1a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 1 0 2 0v-1h1a1 1 0 0 0 0-2m4.414-14L10 27.414a2 2 0 0 1-2.828 0l-2.587-2.585a2 2 0 0 1 0-2.829L22 4.586a2 2 0 0 1 2.829 0l2.585 2.585a2 2 0 0 1 0 2.829M26 8.586 23.414 6l-4 4L22 12.586z"})})};c.forwardRef(Hi);const Bi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 6H4a1 1 0 0 0-1 1v17a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V7a1 1 0 0 0-1-1M12.339 16 5 22.726V9.274zm1.48 1.356 1.5 1.381a1 1 0 0 0 1.352 0l1.5-1.38L25.421 24H6.571zM19.66 16 27 9.273v13.455z"})})};c.forwardRef(Bi);const Di=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M11 7q0 .432-.088.838L16 10.382l5.088-2.544a4 4 0 1 1 .895 1.789L18.236 11.5l3.747 1.873a4 4 0 1 1 0 5.253L18.236 20.5l3.747 1.874a4 4 0 1 1-.895 1.788L16 21.618l-5.088 2.544Q11 24.567 11 25a4 4 0 1 1-.983-2.626l3.747-1.874-3.747-1.873a4 4 0 1 1 0-5.253l3.747-1.874-3.747-1.874A4 4 0 1 1 11 7M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0m2.236 8h9.528L16 12.618zM9 25a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-2-7a2 2 0 1 0 0-4 2 2 0 0 0 0 4M27 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-2 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4m2-11a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-11 3.382L20.764 17h-9.528z",clipRule:"evenodd"})})};c.forwardRef(Di);const zi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M14.8 8.254a4 4 0 1 0-1.082 1.682l7.483 4.81a4 4 0 0 0-.075.254H10.874A4.002 4.002 0 0 0 3 16a4 4 0 0 0 7.874 1h10.252q.033.128.075.254l-7.484 4.81a4 4 0 1 0 1.082 1.682l7.484-4.81a4 4 0 1 0 0-5.871zM11 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4m0 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4M9 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0m16 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4",clipRule:"evenodd"})})};c.forwardRef(zi);const ki=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M18.842 3.227a1 1 0 1 0-.445 1.95l1.747.399L9.6 12.959a4 4 0 1 0 0 6.081l10.546 7.385-1.748.399a1 1 0 1 0 .445 1.95l3.945-.9a1 1 0 0 0 .77-1.1l-.503-4.014a1 1 0 0 0-1.985.248l.223 1.779-10.545-7.384a4 4 0 0 0 .127-.403h14.712l-1.293 1.293a1 1 0 1 0 1.414 1.414l3-3a1 1 0 0 0 0-1.414l-3-3a1 1 0 0 0-1.414 1.414L25.586 15H10.874a4 4 0 0 0-.127-.403l10.544-7.383-.222 1.778a1 1 0 0 0 1.984.249l.503-4.015a1 1 0 0 0-.77-1.099zM9 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0",clipRule:"evenodd"})})};c.forwardRef(ki);const Ni=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 6H5a2 2 0 0 0-2 2v20a1.98 1.98 0 0 0 1.156 1.813 1.986 1.986 0 0 0 2.141-.299L10.312 26H27a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2M10.5 17.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(Ni);const Oi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M10 16V8a6 6 0 1 1 12 0v8a6 6 0 1 1-12 0m16 0a1 1 0 0 0-2 0 8 8 0 0 1-16 0 1 1 0 1 0-2 0 10.014 10.014 0 0 0 9 9.95V29a1 1 0 0 0 2 0v-3.05A10.014 10.014 0 0 0 26 16"})})};c.forwardRef(Oi);const Fi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 1 1 0-3h22a1.5 1.5 0 0 1 1.5 1.5"})})},_i=c.forwardRef(Fi),Wi=_i,Ui=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m5 14H11a1 1 0 0 1 0-2h10a1 1 0 0 1 0 2"})})};c.forwardRef(Ui);const qi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26 5H6a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3M20 27h-8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2"})})};c.forwardRef(qi);const Gi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29.443 18.776a13.1 13.1 0 0 1-4.626 6.614A13 13 0 0 1 4 15a12.9 12.9 0 0 1 2.61-7.815 13.1 13.1 0 0 1 6.614-4.625 1 1 0 0 1 1.25 1.25 11.01 11.01 0 0 0 13.725 13.725 1 1 0 0 1 1.25 1.25z"})})};c.forwardRef(Gi);const Ki=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M18 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0M7.5 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4m17 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4"})})};c.forwardRef(Ki);const Yi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M10.939 8.061a1.5 1.5 0 0 1 0-2.125l4-4a1.5 1.5 0 0 1 2.125 0l4 4a1.503 1.503 0 1 1-2.125 2.125L17.5 6.625V12a1.5 1.5 0 1 1-3 0V6.625l-1.439 1.436a1.5 1.5 0 0 1-2.122 0m8 15.875L17.5 25.375V20a1.5 1.5 0 1 0-3 0v5.375l-1.439-1.44a1.504 1.504 0 0 0-2.125 2.125l4 4a1.5 1.5 0 0 0 2.125 0l4-4a1.502 1.502 0 1 0-2.125-2.125zm11.125-9-4-4a1.503 1.503 0 0 0-2.125 2.125l1.436 1.439H20a1.5 1.5 0 0 0 0 3h5.375l-1.44 1.439a1.503 1.503 0 0 0 2.125 2.125l4-4a1.5 1.5 0 0 0 .001-2.125zM6.625 17.5H12a1.5 1.5 0 1 0 0-3H6.625l1.44-1.439a1.503 1.503 0 1 0-2.125-2.125l-4 4a1.5 1.5 0 0 0 0 2.125l4 4a1.503 1.503 0 0 0 2.125-2.125z"})})};c.forwardRef(Yi);const Zi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26.615 3.214a.99.99 0 0 0-.857-.183l-16 4a1 1 0 0 0-.758.97v13.762a4.5 4.5 0 1 0 2 3.737V13.781l14-3.5v7.482a4.5 4.5 0 1 0 2 3.737V4a1 1 0 0 0-.385-.786"})})};c.forwardRef(Zi);const Qi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5H14.5a1.5 1.5 0 1 1 0-3H27a1.5 1.5 0 0 1 1.5 1.5m-14-6.5H27a1.5 1.5 0 0 0 0-3H14.5a1.5 1.5 0 0 0 0 3m12.5 13H14.5a1.5 1.5 0 1 0 0 3H27a1.5 1.5 0 1 0 0-3M5.5 7.414V13a1.5 1.5 0 0 0 3 0V5a1.5 1.5 0 0 0-2.17-1.341l-2 1a1.5 1.5 0 0 0 1.17 2.75zm4.966 12.107a3.46 3.46 0 0 0-1.4-2.329 3.61 3.61 0 0 0-4.954.683 3.5 3.5 0 0 0-.52.942 1.5 1.5 0 0 0 2.818 1.027.5.5 0 0 1 .072-.125.6.6 0 0 1 .813-.103.48.48 0 0 1 .201.325.45.45 0 0 1-.096.347l-.016.02-3.585 4.794A1.5 1.5 0 0 0 5 27.5h4a1.5 1.5 0 1 0 0-3H8l1.785-2.389a3.43 3.43 0 0 0 .681-2.59"})})};c.forwardRef(Qi);const Xi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M17.2 8.254a4 4 0 1 1 1.082 1.682l-7.482 4.81q.04.125.074.254h10.252A4.002 4.002 0 0 1 29 16a4 4 0 0 1-7.874 1H10.874q-.033.128-.075.254l7.484 4.81a4 4 0 1 1-1.082 1.682l-7.484-4.81a4 4 0 1 1 0-5.871zM21 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4m0 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4m2-11a2 2 0 1 0 4 0 2 2 0 0 0-4 0M7 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4",clipRule:"evenodd"})})};c.forwardRef(Xi);const Ji=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M10.874 17A4.002 4.002 0 0 1 3 16a4 4 0 0 1 7.874-1h10.252A4.002 4.002 0 0 1 29 16a4 4 0 0 1-7.874 1zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4m18 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4",clipRule:"evenodd"})})};c.forwardRef(Ji);const Pi=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{fillRule:"evenodd",d:"M28.924 16.384c-.05.12-.124.231-.217.324l-4 4a1 1 0 0 1-1.632-.324 1 1 0 0 1 .217-1.09L25.585 17H10.875A4.002 4.002 0 0 1 3 16a4 4 0 0 1 7.874-1h14.712l-2.294-2.293a1 1 0 0 1 1.415-1.415l4 4a1 1 0 0 1 .217 1.09M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4",clipRule:"evenodd"})})};c.forwardRef(Pi);const ec=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29 4a1 1 0 0 0-1-1c-5.51 0-11.164 6.214-14.304 10.329A7.5 7.5 0 0 0 4 20.5c0 3.86-2.443 5.591-2.559 5.671A1 1 0 0 0 2 28h9.5a7.5 7.5 0 0 0 7.171-9.696C22.788 15.164 29 9.51 29 4M15.553 14.194a48 48 0 0 1 1.26-1.569 9.5 9.5 0 0 1 2.562 2.561q-.738.618-1.569 1.262a7.6 7.6 0 0 0-2.254-2.254m5.337-.335a11.6 11.6 0 0 0-2.75-2.75c3.973-4.316 6.969-5.625 8.738-5.989-.357 1.77-1.672 4.766-5.988 8.739"})})};c.forwardRef(ec);const tc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M31 13v6.25a2.01 2.01 0 0 1-1.45 1.922L17 24.75V29a1 1 0 0 1-2 0v-4.25a2.01 2.01 0 0 1 1.45-1.922L29 19.25V13h-2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3H2a1 1 0 0 1 0-2h2V8a2 2 0 0 1 2-2h19a2 2 0 0 1 2 2v3h2a2 2 0 0 1 2 2"})})};c.forwardRef(tc);const nc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M25.096 6.736A12.9 12.9 0 0 0 16 3h-.134A13 13 0 0 0 3 16c0 5.375 3.323 9.883 8.67 11.771A4 4 0 0 0 17 24a2 2 0 0 1 2-2h5.776a3.976 3.976 0 0 0 3.9-3.11c.224-.984.332-1.99.324-3a12.9 12.9 0 0 0-3.904-9.154M10.5 21a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m0-7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5.5-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(nc);const oc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.925 5.543v.018L21.65 29.554A1.985 1.985 0 0 1 19.728 31a1.98 1.98 0 0 1-1.803-1.144l-4.464-9.423a.5.5 0 0 1 .099-.568l7.158-7.159a1 1 0 0 0-1.414-1.413l-7.169 7.157a.5.5 0 0 1-.567.099l-9.376-4.441A2.05 2.05 0 0 1 1 12.17a1.99 1.99 0 0 1 1.446-1.815L26.44 3.08h.018a2 2 0 0 1 2.468 2.463"})})};c.forwardRef(oc);const ac=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m26.56 17.061-10.257 10.25a7.501 7.501 0 0 1-10.607-10.61l12.27-12.236a5 5 0 0 1 7.07 7.074l-.021.02L13.04 23.086a1.503 1.503 0 0 1-2.121-.041 1.5 1.5 0 0 1 .041-2.121L22.924 9.409a2 2 0 1 0-2.838-2.82L7.816 18.82a4.5 4.5 0 1 0 6.366 6.364l10.258-10.25a1.503 1.503 0 0 1 2.125 2.125z"})})};c.forwardRef(ac);const rc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M3.5 8A1.5 1.5 0 0 1 5 6.5h22a1.5 1.5 0 0 1 0 3H5A1.5 1.5 0 0 1 3.5 8M5 14.5h16a1.5 1.5 0 1 0 0-3H5a1.5 1.5 0 1 0 0 3m22 2H5a1.5 1.5 0 1 0 0 3h22a1.5 1.5 0 1 0 0-3m-6 5H5a1.5 1.5 0 1 0 0 3h16a1.5 1.5 0 1 0 0-3"})})};c.forwardRef(rc);const sc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m28.414 9.171-5.585-5.586a2 2 0 0 0-2.829 0L4.586 19A1.98 1.98 0 0 0 4 20.414V26a2 2 0 0 0 2 2h5.586A1.98 1.98 0 0 0 13 27.414L28.414 12a2 2 0 0 0 0-2.829M24 13.585 18.414 8l3-3L27 10.585z"})})},ic=c.forwardRef(sc),jh=ic,cc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.985 21.885A7.03 7.03 0 0 1 22 28c-9.925 0-18-8.075-18-18a7.03 7.03 0 0 1 6.115-6.985 2 2 0 0 1 2.078 1.19l2.64 5.894v.015a2 2 0 0 1-.16 1.886 1 1 0 0 1-.07.096L12 15.181c.936 1.903 2.926 3.875 4.854 4.814l3.042-2.589q.045-.037.094-.07a2 2 0 0 1 1.896-.175l.017.008 5.888 2.639a2 2 0 0 1 1.194 2.077"})})};c.forwardRef(cc);const lc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m29.416 13-6.683 6.706c.57 1.584.806 4.236-1.65 7.5a2 2 0 0 1-1.458.794h-.141a2 2 0 0 1-1.415-.586l-6.033-6.04-5.328 5.333a1 1 0 1 1-1.415-1.415l5.332-5.328-6.037-6.038a2 2 0 0 1 .162-2.972c3.178-2.564 6.219-2.06 7.55-1.643L19 2.587a2 2 0 0 1 2.829 0l7.586 7.585A2 2 0 0 1 29.416 13"})})};c.forwardRef(lc);const dc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 2A11.013 11.013 0 0 0 5 13c0 9.413 10 16.521 10.426 16.819a1 1 0 0 0 1.148 0C17 29.52 27 22.413 27 13A11.01 11.01 0 0 0 16 2m0 7a4 4 0 1 1 0 8 4 4 0 0 1 0-8"})})};c.forwardRef(dc);const hc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30 17v4a1 1 0 0 1-1.196.98L19.5 20.125v2.966l2.207 2.206A1 1 0 0 1 22 26v3a1 1 0 0 1-1.375.929L16 28.078l-4.625 1.85A1 1 0 0 1 10 29v-3a1 1 0 0 1 .293-.707l2.207-2.207v-2.961L3.196 21.98A1 1 0 0 1 2 21v-4a1 1 0 0 1 .553-.895l9.947-4.972V5.5a3.5 3.5 0 1 1 7 0v5.633l9.948 4.972A1 1 0 0 1 30 17"})})};c.forwardRef(hc);const uc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M25.676 18.884a7.6 7.6 0 0 1-3.978 1.107 9 9 0 0 1-3.42-.707A6.94 6.94 0 0 0 17 23.314V27a1 1 0 0 1-1.066 1A1.023 1.023 0 0 1 15 26.969v-1.555l-4.828-4.828A6.6 6.6 0 0 1 7.93 21a5.73 5.73 0 0 1-2.99-.834C2.216 18.511.75 14.702 1.034 9.974a1 1 0 0 1 .94-.94c4.728-.28 8.537 1.182 10.187 3.906a5.75 5.75 0 0 1 .806 3.56.5.5 0 0 1-.86.304l-2.4-2.513a1 1 0 0 0-1.415 1.414l6.736 6.906q.01-.146.026-.291a8.57 8.57 0 0 1 2.33-4.933l6.323-6.682a1 1 0 0 0-1.413-1.415l-6.125 6.477a.5.5 0 0 1-.848-.217c-.592-2.185-.331-4.36.8-6.228 2.233-3.685 7.428-5.657 13.898-5.277a1 1 0 0 1 .94.94c.375 6.471-1.598 11.666-5.283 13.899"})})};c.forwardRef(uc);const gc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30 16a1.97 1.97 0 0 1-.95 1.689L11.04 28.706a2 2 0 0 1-2.767-.688A2 2 0 0 1 8 27.016V4.984a1.98 1.98 0 0 1 1.015-1.728 2 2 0 0 1 2.025.038L29.05 14.31A1.97 1.97 0 0 1 30 16"})})};c.forwardRef(gc);const fc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5h-9.5V27a1.5 1.5 0 1 1-3 0v-9.5H5a1.5 1.5 0 1 1 0-3h9.5V5a1.5 1.5 0 1 1 3 0v9.5H27a1.5 1.5 0 0 1 1.5 1.5"})})},mc=c.forwardRef(fc),yh=mc,xc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.016 13.016 0 0 0 16 3m5 14h-4v4a1 1 0 0 1-2 0v-4h-4a1 1 0 0 1 0-2h4v-4a1 1 0 0 1 2 0v4h4a1 1 0 0 1 0 2"})})};c.forwardRef(xc);const wc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 5H17V3a1 1 0 0 0-2 0v2H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h4.92l-2.701 3.375a1 1 0 0 0 1.562 1.25L12.48 24h7.04l3.699 4.625a1 1 0 1 0 1.562-1.25L22.08 24H27a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2M13 18a1 1 0 0 1-2 0v-3a1 1 0 0 1 2 0zm4 0a1 1 0 0 1-2 0v-5a1 1 0 0 1 2 0zm4 0a1 1 0 0 1-2 0v-7a1 1 0 0 1 2 0z"})})};c.forwardRef(wc);const vc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M30.414 17 18 4.586A1.98 1.98 0 0 0 16.586 4H5a1 1 0 0 0-1 1v11.586A1.98 1.98 0 0 0 4.586 18L17 30.414a2 2 0 0 0 2.829 0l10.585-10.585a2 2 0 0 0 0-2.829M10.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(vc);const bc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M20.723 28H26a2 2 0 0 0 2-2v-4.706a1 1 0 0 0-1.383-.919 2.9 2.9 0 0 1-1.117.221c-1.654 0-3-1.387-3-3.091s1.346-3.091 3-3.091c.383 0 .763.075 1.117.221A1 1 0 0 0 28 13.706V9a2 2 0 0 0-2-2h-4.527a4.5 4.5 0 1 0-8.945 0H8a2 2 0 0 0-2 2v4.028a4.5 4.5 0 1 0 0 8.945V26a2 2 0 0 0 2 2h5.278"})})};c.forwardRef(bc);const pc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M18 22.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0M29.5 16A13.5 13.5 0 1 1 16 2.5 13.515 13.515 0 0 1 29.5 16m-3 0A10.5 10.5 0 1 0 16 26.5 10.51 10.51 0 0 0 26.5 16M16 8c-3.033 0-5.5 2.242-5.5 5v.5a1.5 1.5 0 1 0 3 0V13c0-1.102 1.125-2 2.5-2s2.5.898 2.5 2-1.125 2-2.5 2a1.5 1.5 0 0 0-1.5 1.5v1a1.5 1.5 0 0 0 2.966.32C19.79 17.235 21.5 15.296 21.5 13c0-2.758-2.468-5-5.5-5"})})};c.forwardRef(pc);const $c=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M14.5 9v11a6.006 6.006 0 0 1-6 6 1 1 0 0 1 0-2 4 4 0 0 0 4-4v-1H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2M27 7h-7.5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2H27v1a4 4 0 0 1-4 4 1 1 0 0 0 0 2 6.006 6.006 0 0 0 6-6V9a2 2 0 0 0-2-2"})})};c.forwardRef($c);const Cc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 5v23a1 1 0 0 1-2 0v-6h-6a1 1 0 0 1-1-1c.046-2.395.349-4.779.902-7.11 1.223-5.061 3.54-8.454 6.704-9.809a1 1 0 0 1 1.394.92m-12.014-.164a.999.999 0 1 0-1.972.33L13.986 11H11V5a1 1 0 0 0-2 0v6H6.014l.972-5.835a1 1 0 1 0-1.972-.329l-1 6A1 1 0 0 0 4 11a6.01 6.01 0 0 0 5 5.915V28a1 1 0 1 0 2 0V16.915A6.01 6.01 0 0 0 16 11q0-.083-.014-.164z"})})};c.forwardRef(Cc);const jc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M19 28a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1m8.953-8.521-1.546 6.954a2 2 0 0 1-3.188 1.138l-3.405-2.57h-7.625L8.78 27.57a2 2 0 0 1-3.189-1.138l-1.545-6.954a2.01 2.01 0 0 1 .415-1.714l3.57-4.282c.12-1.574.482-3.12 1.072-4.584 1.612-4.043 4.5-6.579 5.671-7.481a2 2 0 0 1 2.45 0c1.167.902 4.059 3.438 5.671 7.48.59 1.465.952 3.01 1.072 4.585l3.57 4.282a2.01 2.01 0 0 1 .415 1.714m-17.404 4.25q-2.014-3.666-2.445-7.209L6 19.045 7.545 26l.022-.016zM17.5 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0m8.5 6.545-2.104-2.525q-.428 3.535-2.445 7.211l2.982 2.25.022.017z"})})};c.forwardRef(jc);const yc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M19.716 14.141a1 1 0 0 1 .261-1.391l8.458-5.788a1 1 0 0 1 1.125 1.652L21.101 14.4a1 1 0 0 1-1.39-.261zm10.109 10.634a1 1 0 0 1-1.39.261L17 17.211l-5.315 3.636a4.5 4.5 0 1 1-1.125-1.65L15.229 16l-4.673-3.198a4.5 4.5 0 1 1 1.125-1.65l17.875 12.233a1 1 0 0 1 .269 1.39M9 22.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0m0-13a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"})})};c.forwardRef(yc);const Sc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:16,height:16,viewBox:"0 0 256 256",fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M225.86 102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28 23.51 138.44 16 128 16s-18.27 7.51-25.18 14.14c-3.94 3.77-8 7.67-11.57 9.14-3.25 1.36-8.69 1.44-13.94 1.52-9.76.15-20.82.31-28.51 8s-7.8 18.75-8 28.51c-.08 5.25-.16 10.67-1.52 13.94-1.47 3.56-5.37 7.63-9.14 11.57C23.51 109.72 16 117.56 16 128s7.51 18.27 14.14 25.18c3.77 3.94 7.67 8 9.14 11.57 1.36 3.27 1.44 8.69 1.52 13.94.15 9.76.31 20.82 8 28.51s18.75 7.85 28.51 8c5.25.08 10.67.16 13.94 1.52 3.56 1.47 7.63 5.37 11.57 9.14 6.9 6.63 14.74 14.14 25.18 14.14s18.27-7.51 25.18-14.14c3.94-3.77 8-7.67 11.57-9.14 3.27-1.36 8.69-1.44 13.94-1.52 9.76-.15 20.82-.31 28.51-8s7.85-18.75 8-28.51c.08-5.25.16-10.67 1.52-13.94 1.47-3.56 5.37-7.63 9.14-11.57 6.63-6.9 14.14-14.74 14.14-25.18s-7.51-18.27-14.14-25.18m-52.2 6.84-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32"})})};c.forwardRef(Sc);const Rc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29.061 26.939 23.125 21A11.515 11.515 0 1 0 21 23.125l5.941 5.942a1.503 1.503 0 0 0 2.125-2.125zM5.5 14a8.5 8.5 0 1 1 8.5 8.5A8.51 8.51 0 0 1 5.5 14"})})},Ic=c.forwardRef(Rc),Ac=Ic,Mc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26 5H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M26 17H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2m-3.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(Mc);const Tc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28 7v7.346c0 11.202-9.477 14.918-11.375 15.549a1.94 1.94 0 0 1-1.25 0C13.475 29.264 4 25.548 4 14.346V7a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2"})})};c.forwardRef(Tc);const Vc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m30.949 7.653-6.47-3.528A1 1 0 0 0 24 4h-4a1 1 0 0 0-1 1 3 3 0 0 1-6 0 1 1 0 0 0-1-1H8a1 1 0 0 0-.48.125L1.051 7.653a1.97 1.97 0 0 0-.824 2.657l2.41 4.601A2.05 2.05 0 0 0 4.458 16H7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V16h2.543a2.05 2.05 0 0 0 1.822-1.089l2.409-4.601a1.97 1.97 0 0 0-.825-2.658M4.459 14a.08.08 0 0 1-.051-.016L2.01 9.408 7 6.685V14zm23.134-.018a.07.07 0 0 1-.052.018H25V6.685l4.99 2.723z"})})};c.forwardRef(Vc);const Ec=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M12 27a2 2 0 1 1-4 0 2 2 0 0 1 4 0m11-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4m5.805-16.594A1 1 0 0 0 28 8H6.04L5.026 4.45A2.01 2.01 0 0 0 3.103 3H1a1 1 0 0 0 0 2h2.103l4.522 15.824A3.01 3.01 0 0 0 10.509 23h12.014a2.99 2.99 0 0 0 2.867-2.117l3.566-11.59a1 1 0 0 0-.151-.887"})})};c.forwardRef(Ec);const Lc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M14.5 27a1.5 1.5 0 0 1-1.5 1.5H6A2.5 2.5 0 0 1 3.5 26V6A2.5 2.5 0 0 1 6 3.5h7a1.5 1.5 0 0 1 0 3H6.5v19H13a1.5 1.5 0 0 1 1.5 1.5m13.561-12.061-5-5a1.503 1.503 0 0 0-2.125 2.125l2.439 2.436H13a1.5 1.5 0 1 0 0 3h10.375l-2.44 2.439a1.503 1.503 0 0 0 2.125 2.125l5-5a1.5 1.5 0 0 0 .001-2.125"})})};c.forwardRef(Lc);const Hc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M4 10a1 1 0 0 1 1-1h4.646a3.5 3.5 0 0 1 6.708 0H27a1 1 0 1 1 0 2H16.354a3.5 3.5 0 0 1-6.708 0H5a1 1 0 0 1-1-1m23 11h-2.646a3.5 3.5 0 0 0-6.708 0H5a1 1 0 0 0 0 2h12.646a3.5 3.5 0 0 0 6.708 0H27a1 1 0 1 0 0-2"})})};c.forwardRef(Hc);const Bc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M26 18a1.97 1.97 0 0 1-1.302 1.867l-6.457 2.375-2.375 6.452a1.99 1.99 0 0 1-3.735 0L9.75 22.25l-6.452-2.375a1.99 1.99 0 0 1 0-3.735l6.456-2.375 2.375-6.451a1.99 1.99 0 0 1 3.735 0l2.375 6.456 6.451 2.375A1.97 1.97 0 0 1 26 18M19 6h2v2a1 1 0 0 0 2 0V6h2a1 1 0 1 0 0-2h-2V2a1 1 0 1 0-2 0v2h-2a1 1 0 1 0 0 2m11 4h-1V9a1 1 0 1 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0-2"})})};c.forwardRef(Bc);const Dc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M15 7v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2m10-2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2M13 17H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2m12 0h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2"})})};c.forwardRef(Dc);const zc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:[a.jsx("path",{d:"M27.5 21.136 16 27.843 4.5 21.136a1 1 0 0 0-1 1.728l12 7a1 1 0 0 0 1.008 0l12-7a1 1 0 1 0-1.008-1.728"}),a.jsx("path",{d:"M27.5 15.136 16 21.843 4.5 15.136a1 1 0 0 0-1 1.728l12 7a1 1 0 0 0 1.008 0l12-7a1 1 0 1 0-1.008-1.728"}),a.jsx("path",{d:"m3.5 10.864 12 7a1 1 0 0 0 1.008 0l12-7a1 1 0 0 0 0-1.728l-12-7a1 1 0 0 0-1.008 0l-12 7a1 1 0 0 0 0 1.728"})]})};c.forwardRef(zc);const kc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m29.313 14.298-5.638 4.92 1.689 7.325a2 2 0 0 1-2.98 2.167l-6.389-3.875L9.62 28.71a2 2 0 0 1-2.98-2.168l1.686-7.317-5.638-4.928a2 2 0 0 1 1.138-3.507l7.433-.644 2.901-6.92a1.994 1.994 0 0 1 3.68 0l2.91 6.92 7.43.644a2 2 0 0 1 1.139 3.508z"})})};c.forwardRef(kc);const Nc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29 19a4 4 0 1 0-4.991 3.875A1 1 0 0 0 24 23a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4v-5.065c3.934-.5 7-3.934 7-8.039V5a2 2 0 0 0-2-2h-2a1 1 0 1 0 0 2h2v4.896c0 3.323-2.656 6.061-5.92 6.104A6 6 0 0 1 6 10V5h2a1 1 0 0 0 0-2H6a2 2 0 0 0-2 2v5a8 8 0 0 0 7 7.936V23a6.006 6.006 0 0 0 6 6h3a6.006 6.006 0 0 0 6-6 1 1 0 0 0-.009-.125A4 4 0 0 0 29 19m-4 1a1 1 0 1 1 0-2 1 1 0 0 1 0 2"})})};c.forwardRef(Nc);const Oc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 256 256",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M216 56v144a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V56a16 16 0 0 1 16-16h144a16 16 0 0 1 16 16"})})};c.forwardRef(Oc);const Fc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29 12a1 1 0 0 0-.038-.275L27.17 5.45A2.01 2.01 0 0 0 25.25 4H6.75a2.01 2.01 0 0 0-1.919 1.45L3.04 11.725A1 1 0 0 0 3 12v2a5 5 0 0 0 2 4v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-8a5 5 0 0 0 2-4zm-18 2a3 3 0 0 1-4.39 2.657 1 1 0 0 0-.228-.132A3 3 0 0 1 5 14v-1h6zm8 0a3 3 0 0 1-6 0v-1h6zm8 0a3 3 0 0 1-1.384 2.525q-.12.051-.225.131A3 3 0 0 1 21 14v-1h6z"})})};c.forwardRef(Fc);const _c=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 16a1.5 1.5 0 0 1-1.5 1.5h-3.767A5.19 5.19 0 0 1 24.5 21c0 1.806-.976 3.54-2.679 4.756C20.25 26.881 18.18 27.5 16 27.5s-4.25-.619-5.821-1.744C8.476 24.54 7.5 22.806 7.5 21a1.5 1.5 0 0 1 3 0c0 1.898 2.519 3.5 5.5 3.5s5.5-1.602 5.5-3.5c0-1.595-1.163-2.523-4.419-3.5H5a1.5 1.5 0 1 1 0-3h22a1.5 1.5 0 0 1 1.5 1.5M9.389 12.5a1.5 1.5 0 0 0 1.5-1.5c0-2 2.197-3.5 5.111-3.5 2.17 0 3.921.831 4.685 2.223a1.5 1.5 0 0 0 2.625-1.446C22.016 5.914 19.281 4.5 16 4.5c-4.625 0-8.111 2.794-8.111 6.5a1.5 1.5 0 0 0 1.5 1.5"})})};c.forwardRef(_c);const Wc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M15 5V2a1 1 0 0 1 2 0v3a1 1 0 0 1-2 0m1 3a8 8 0 1 0 8 8 8.01 8.01 0 0 0-8-8m-8.707.707a1 1 0 1 0 1.414-1.415l-2-2a1 1 0 1 0-1.414 1.415zm0 14.586-2 2a1 1 0 1 0 1.414 1.415l2-2a1 1 0 1 0-1.415-1.415M24 9a1 1 0 0 0 .707-.293l2-2a1 1 0 0 0-1.415-1.414l-2 2A1 1 0 0 0 24 9m.707 14.293a1 1 0 1 0-1.415 1.415l2 2a1 1 0 0 0 1.415-1.415zM6 16a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h3a1 1 0 0 0 1-1m10 10a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0v-3a1 1 0 0 0-1-1m14-11h-3a1 1 0 0 0 0 2h3a1 1 0 0 0 0-2"})})};c.forwardRef(Wc);const Uc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 8h-8.586l4.293-4.292a1 1 0 0 0-1.415-1.415L16 7.586l-5.292-5.293a1 1 0 1 0-1.415 1.415L13.586 8H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2m0 17h-7V10h7zm-2-10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"})})};c.forwardRef(Uc);const qc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m29.978 19.625-1.5-12A3 3 0 0 0 25.5 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5.383l4.722 9.448A1 1 0 0 0 15 30a5 5 0 0 0 5-5v-2h7a3 3 0 0 0 2.977-3.375M9 18H4V7h5z"})})};c.forwardRef(qc);const Gc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M29.25 10.015A3 3 0 0 0 27 9h-7V7a5 5 0 0 0-5-5 1 1 0 0 0-.895.553L9.383 12H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h21.5a3 3 0 0 0 2.977-2.625l1.5-12a3 3 0 0 0-.727-2.36M4 14h5v11H4z"})})};c.forwardRef(Gc);const Kc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M23 3H9a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h1l-1.8 2.4a1 1 0 0 0 1.6 1.2l2.7-3.6h7l2.7 3.6a1 1 0 0 0 1.6-1.2L22 27h1a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4M10.5 23a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m4.5-8H7v-5h8zm6.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m3.5-8h-8v-5h8z"})})};c.forwardRef(Kc);const Yc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M27 6h-5V5a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v1H5a1 1 0 0 0 0 2h1v18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h1a1 1 0 1 0 0-2M14 21a1 1 0 0 1-2 0v-8a1 1 0 0 1 2 0zm6 0a1 1 0 0 1-2 0v-8a1 1 0 0 1 2 0zm0-15h-8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"})})},Zc=c.forwardRef(Yc),Sh=Zc,Qc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 17 16",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M15.583 3.5v4a.75.75 0 1 1-1.5 0V5.313l-4.72 4.72a.75.75 0 0 1-1.062 0l-1.968-1.97-3.97 3.968a.751.751 0 1 1-1.062-1.063l4.5-4.5a.75.75 0 0 1 1.063 0l1.969 1.97 4.188-4.188h-2.188a.75.75 0 1 1 0-1.5h4a.75.75 0 0 1 .75.75"})})};c.forwardRef(Qc);const Xc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m23.54 2.267-3.711 3.377c1.7.52 3.298 1.397 4.653 2.631 4.684 4.266 4.684 11.184 0 15.45q-5.184 4.72-16.021 6.008l3.71-3.377a12.2 12.2 0 0 1-4.653-2.63c-4.684-4.267-4.712-11.16 0-15.45q5.184-4.721 16.021-6.01m-7.54 8.4c-3.314 0-6 2.388-6 5.333s2.686 5.333 6 5.333 6-2.387 6-5.333c0-2.945-2.686-5.333-6-5.333"})})};c.forwardRef(Xc);const Jc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M25.5 28a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 1 1 0-3h16a1.5 1.5 0 0 1 1.5 1.5M16 24.5a8.51 8.51 0 0 0 8.5-8.5V7a1.5 1.5 0 1 0-3 0v9a5.5 5.5 0 0 1-11 0V7a1.5 1.5 0 1 0-3 0v9a8.51 8.51 0 0 0 8.5 8.5"})})};c.forwardRef(Jc);const Pc=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.5 19v7a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 26v-7a1.5 1.5 0 0 1 3 0v6.5h19V19a1.5 1.5 0 1 1 3 0m-16.439-7.939L14.5 8.625V19a1.5 1.5 0 1 0 3 0V8.625l2.439 2.44a1.503 1.503 0 0 0 2.125-2.125l-5-5a1.5 1.5 0 0 0-2.125 0l-5 5a1.503 1.503 0 1 0 2.125 2.125z"})})};c.forwardRef(Pc);const e2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M28.866 27.5A1 1 0 0 1 28 28H4a1 1 0 0 1-.865-1.5c1.904-3.291 4.838-5.651 8.261-6.77a9 9 0 1 1 9.208 0c3.424 1.119 6.357 3.479 8.261 6.77a1 1 0 0 1 .001 1"})})};c.forwardRef(e2);const t2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M19.44 3.101a1 1 0 0 0-1.054.11L9.656 10H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5.656l8.73 6.789A1 1 0 0 0 20 28V4a1 1 0 0 0-.56-.899M28.414 16l2.293-2.292a1.001 1.001 0 0 0-1.415-1.415L27 14.586l-2.293-2.293a1 1 0 1 0-1.415 1.415L25.587 16l-2.293 2.293a1 1 0 0 0 1.415 1.415L27 17.414l2.293 2.294a1 1 0 0 0 1.415-1.415z"})})};c.forwardRef(t2);const n2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M19.439 3.101a1 1 0 0 0-1.053.11L9.656 10H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5.656l8.73 6.789A1.001 1.001 0 0 0 20 28V4a1 1 0 0 0-.561-.899M9 20H4v-8h5zm15.75-7.305a5 5 0 0 1 0 6.61 1 1 0 0 1-1.5-1.322 3 3 0 0 0 0-3.966 1 1 0 0 1 1.5-1.322M31 16a10 10 0 0 1-2.546 6.668 1 1 0 0 1-1.49-1.334 8 8 0 0 0 0-10.666.998.998 0 0 1 .407-1.624 1 1 0 0 1 1.083.29A9.98 9.98 0 0 1 31 16"})})};c.forwardRef(n2);const o2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M15 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0m11 11c-3.58 0-5.226-1.662-6.969-3.421a25 25 0 0 0-1.375-1.323C13.031 8.24 5.63 15.098 5.316 15.391a1 1 0 0 0 1.369 1.458 20.5 20.5 0 0 1 3.815-2.724c1.723-.922 3.174-1.279 4.338-1.072L8.082 28.6a1 1 0 0 0 1.835.798l4.2-9.659L18 22.515V29a1 1 0 1 0 2 0v-7a1 1 0 0 0-.419-.814l-4.65-3.321L16.61 14c.33.305.657.634 1 .98C19.381 16.774 21.586 19 26 19a1 1 0 0 0 0-2"})})};c.forwardRef(o2);const a2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M16 3a13 13 0 1 0 13 13A13.013 13.013 0 0 0 16 3m-1 7a1 1 0 0 1 2 0v7a1 1 0 0 1-2 0zm1 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"})})};c.forwardRef(a2);const r2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 17 16",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"M3.468 10 5.9 5.786l-.14-.243a3 3 0 1 1 5.316-2.76.51.51 0 0 1-.2.65.5.5 0 0 1-.71-.233 2 2 0 1 0-3.542 1.84l.864 1.496a.5.5 0 0 1 0 .5L5.2 11a1 1 0 0 1-1.731-1m8.812-2.5h-.771l-2.31-4a1 1 0 0 0-1.731 1l2.165 3.75a.5.5 0 0 0 .432.25h2.227c1.118 0 2.06.915 2.041 2.033a2 2 0 0 1-1.98 1.967.515.515 0 0 0-.518.458.5.5 0 0 0 .5.542 3.003 3.003 0 0 0 3-3.058c-.034-1.643-1.41-2.942-3.052-2.942zm1.053 2.952c-.025-.538-.489-.952-1.027-.952H7.51a.5.5 0 0 0-.433.25l-1.01 1.75a2 2 0 1 1-3.342-2.187.51.51 0 0 0-.058-.688.5.5 0 0 0-.732.073A3 3 0 1 0 6.93 12l.289-.5h5.114a1 1 0 0 0 1-1.048"})})};c.forwardRef(r2);const s2=({fill:e="currentColor",stroke:t,...o},r)=>{const{colors:n}=h(),s=e&&e in n?n[e]:e,i=t&&t in n?n[t]:t;return a.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 32 32",width:16,height:16,fill:s,stroke:i,ref:r,...o,children:a.jsx("path",{d:"m31.316 24.949-3 1a1 1 0 0 1-1.211-.5l-3.724-7.45H13a1 1 0 0 1-1-1v-3.707A7 7 0 0 0 14 27c3.239 0 6.261-2.256 7.031-5.25a1 1 0 1 1 1.938.5C21.96 26.162 18.19 29 14 29a9 9 0 0 1-2-17.774V8.851a3.5 3.5 0 1 1 2 0V11h7a1 1 0 0 1 0 2h-7v3h10a1 1 0 0 1 .894.552l3.612 7.225 2.178-.726a1 1 0 1 1 .632 1.898"})})};c.forwardRef(s2);const tt=(e,t)=>{const o=c.createContext(t),r=s=>{const{children:i,...l}=s,d=c.useMemo(()=>l,Object.values(l));return a.jsx(o.Provider,{value:d,children:i})};function n(s){const i=c.useContext(o);if(i)return i;if(t!==void 0)return t;throw new Error(`\`${s}\` must be used within \`${e}\``)}return r.displayName=`${e}Provider`,[r,n]};function i2(e,t){return typeof e=="string"?!1:t in e}function it(e,t,o){return e&&t&&i2(e,t)?e[t]:o}const T0={padding:["padding-block-start","padding-inline-end","padding-block-end","padding-inline-start"],paddingTop:"padding-block-start",paddingRight:"padding-inline-end",paddingBottom:"padding-block-end",paddingLeft:"padding-inline-start",margin:["margin-block-start","margin-inline-end","margin-block-end","margin-inline-start"],marginLeft:"margin-inline-start",marginRight:"margin-inline-end",marginTop:"margin-block-start",marginBottom:"margin-block-end",borderRadius:"border-radius",borderStyle:"border-style",borderWidth:"border-width",borderColor:"border-color",fontSize:"font-size",fontWeight:"font-weight",lineHeight:"line-height",zIndex:"z-index",boxShadow:"box-shadow",pointerEvents:"pointer-events",textAlign:"text-align",textTransform:"text-transform",textDecoration:"text-decoration",flexGrow:"flex-grow",flexShrink:"flex-shrink",flexBasis:"flex-basis",minWidth:"min-width",maxWidth:"max-width",minHeight:"min-height",maxHeight:"max-height",flexDirection:"flex-direction",flexWrap:"flex-wrap",justifyContent:"justify-content",alignItems:"align-items"},c2=e=>{const[t,o,r,n]=e,s=o??t;return[t,s,r??t,n??s]};function l2(e,t){switch(e){case"gap":case"padding":case"margin":case"paddingTop":case"paddingLeft":case"paddingRight":case"paddingBottom":case"marginTop":case"marginLeft":case"marginRight":case"marginBottom":case"left":case"right":case"top":case"bottom":case"width":case"maxWidth":case"minWidth":case"height":case"maxHeight":case"minHeight":case"borderRadius":case"borderWidth":return t.spaces;case"color":case"background":case"borderColor":return t.colors;case"fontSize":return t.fontSizes;case"fontWeight":return t.fontWeights;case"lineHeight":return t.lineHeights;case"zIndex":return t.zIndices;case"boxShadow":return t.shadows;default:return null}}const gt=(e,t)=>{const o=Object.entries(e).reduce((r,n)=>{const[s,i]=n,l=l2(s,t),d=Object.prototype.hasOwnProperty.call(T0,s)?T0[s]:s;return d&&(i||i===0)&&(typeof i=="object"&&!Array.isArray(i)?Object.entries(i).forEach(([f,u])=>{r[f]={...r[f],...V0(d,u,l)}}):r.initial={...r.initial,...V0(d,i,l)}),r},{initial:{},small:{},medium:{},large:{}});return Object.entries(o).reduce((r,[n,s])=>{if(s&&Object.keys(s).length>0){const i=Object.entries(s).reduce((l,[d,f])=>(l.push(`${d}: ${f};`),l),[]).join(`
`);n==="initial"?r.push(i):r.push(`${t.breakpoints[n]}{ ${i} }`)}return r},[]).join(`
`)},V0=(e,t,o)=>{if(Array.isArray(e)&&Array.isArray(t)){const r=c2(t);return e.reduce((n,s,i)=>(n[s]=it(o,r[i],r[i]),n),{})}else return Array.isArray(e)&&!Array.isArray(t)?e.reduce((r,n)=>(r[n]=it(o,t,t),r),{}):!Array.isArray(e)&&!Array.isArray(t)?{[e]:it(o,t,t)}:(console.warn("You've passed an array of values to a property that does not support it. Please check the property and value you're passing."),{})},he=c.forwardRef,M=he((e,t)=>{const{background:o,basis:r,borderColor:n,color:s,flex:i,fontSize:l,grow:d,hasRadius:f,padding:u,paddingBottom:w,paddingLeft:g,paddingRight:x,paddingTop:v,margin:b,marginLeft:C,marginBottom:$,marginRight:p,marginTop:j,shadow:y,shrink:S,lineHeight:I,fontWeight:R,width:N,minWidth:H,maxWidth:z,height:_,minHeight:L,maxHeight:V,top:B,left:U,bottom:K,right:G,borderRadius:Y,borderStyle:Z,borderWidth:te,tag:Q,pointerEvents:se,display:O,position:ae,zIndex:ee,overflow:ue,cursor:T,transition:W,transform:X,animation:F,textAlign:D,textTransform:q,...le}=e,de=Q||"div",P={$background:o,$basis:r,$borderColor:n,$color:s,$flex:i,$fontSize:l,$grow:d,$hasRadius:f,$padding:u,$paddingBottom:w,$paddingLeft:g,$paddingRight:x,$paddingTop:v,$margin:b,$marginLeft:C,$marginBottom:$,$marginRight:p,$marginTop:j,$shadow:y,$shrink:S,$lineHeight:I,$fontWeight:R,$width:N,$minWidth:H,$maxWidth:z,$height:_,$minHeight:L,$maxHeight:V,$top:B,$left:U,$bottom:K,$right:G,$borderRadius:Y,$borderStyle:Z,$borderWidth:te,$pointerEvents:se,$display:O,$position:ae,$zIndex:ee,$overflow:ue,$cursor:T,$transition:W,$transform:X,$animation:F,$textAlign:D,$textTransform:q};return a.jsx(d2,{as:de,ref:t,...P,...le})}),d2=m.div`
  ${({theme:e,...t})=>gt({padding:t.$padding,paddingTop:t.$paddingTop,paddingBottom:t.$paddingBottom,paddingLeft:t.$paddingLeft,paddingRight:t.$paddingRight,margin:t.$margin,marginTop:t.$marginTop,marginBottom:t.$marginBottom,marginLeft:t.$marginLeft,marginRight:t.$marginRight,top:t.$top,left:t.$left,bottom:t.$bottom,right:t.$right,width:t.$width,minWidth:t.$minWidth,maxWidth:t.$maxWidth,height:t.$height,minHeight:t.$minHeight,maxHeight:t.$maxHeight,color:t.$color,background:t.$background,fontSize:t.$fontSize,fontWeight:t.$fontWeight,lineHeight:t.$lineHeight,borderRadius:t.$hasRadius?e.borderRadius:t.$borderRadius,borderStyle:t.$borderColor&&!t.$borderStyle?"solid":t.$borderStyle,borderWidth:t.$borderColor&&!t.$borderWidth?"1px":t.$borderWidth,borderColor:t.$borderColor,zIndex:t.$zIndex,boxShadow:t.$shadow,display:t.$display,pointerEvents:t.$pointerEvents,cursor:t.$cursor,textAlign:t.$textAlign,textTransform:t.$textTransform,transition:t.$transition,transform:t.$transform,animation:t.$animation,position:t.$position,overflow:t.$overflow,flex:t.$flex,flexShrink:t.$shrink,flexGrow:t.$grow,flexBasis:t.$basis},e)};
`,A=he((e,t)=>{const{className:o,alignItems:r,direction:n,inline:s,gap:i,justifyContent:l,wrap:d,...f}=e,u={$alignItems:r,$direction:n,$gap:i,$justifyContent:l,$wrap:d,$inline:s};return a.jsx(h2,{className:o,ref:t,...u,...f})}),h2=m(M)`
  ${({theme:e,$display:t="flex",$alignItems:o="center",$direction:r="row",...n})=>gt({gap:n.$gap,alignItems:o,justifyContent:n.$justifyContent,flexWrap:n.$wrap,flexDirection:r,display:n.$inline?"inline-flex":t},e)};
`,u2="alpha",g2="beta",f2="delta",m2="epsilon",E0="omega",x2="pi",w2="sigma",Zn=E`
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`,v2=({$variant:e=E0,theme:t})=>{switch(e){case u2:return`
        font-weight: ${t.fontWeights.bold};
        font-size: ${t.fontSizes[5]};
        line-height: ${t.lineHeights[2]};
      `;case g2:return`
        font-weight: ${t.fontWeights.bold};
        font-size: ${t.fontSizes[4]};
        line-height: ${t.lineHeights[1]};
      `;case f2:return`
        font-weight: ${t.fontWeights.semiBold};
        font-size: ${t.fontSizes[3]};
        line-height: ${t.lineHeights[2]};
      `;case m2:return`
        font-size: ${t.fontSizes[3]};
        line-height: ${t.lineHeights[6]};
      `;case E0:return`
        font-size: ${t.fontSizes[2]};
        line-height: ${t.lineHeights[4]};
      `;case x2:return`
        font-size: ${t.fontSizes[1]};
        line-height: ${t.lineHeights[3]};
      `;case w2:return`
        font-weight: ${t.fontWeights.bold};
        font-size: ${t.fontSizes[0]};
        line-height: ${t.lineHeights[5]};
        text-transform: uppercase;
      `;default:return`
        font-size: ${t.fontSizes[2]};
      `}},k=he((e,t)=>{const{ellipsis:o,textColor:r="currentcolor",textDecoration:n,textTransform:s,variant:i,lineHeight:l,fontWeight:d,fontSize:f,...u}=e,w={$ellipsis:o,$textColor:r,$textDecoration:n,$textTransform:s,$variant:i,$lineHeight:l,$fontWeight:d,$fontSize:f};return a.jsx(b2,{ref:t,tag:"span",...w,...u})}),b2=m(M)`
  ${v2}
  ${({$ellipsis:e})=>e?Zn:""}

  ${({theme:e,...t})=>gt({color:t.$textColor,textDecoration:t.$textDecoration,textTransform:t.$textTransform,lineHeight:t.$lineHeight,fontWeight:t.$fontWeight,fontSize:t.$fontSize},e)}
`,[p2,x0]=tt("Accordion"),$2=c.forwardRef(({children:e,size:t="S",...o},r)=>a.jsx(C2,{ref:r,$size:t,collapsible:!0,...o,type:"single",children:a.jsx(p2,{size:t,children:e})})),C2=m(Q1)`
  background-color: ${e=>e.theme.colors.neutral0};

  ${e=>e.$size==="S"?E`
        border-radius: ${t=>t.theme.borderRadius};
        border: solid 1px ${t=>t.theme.colors.neutral200};
      `:E``}
`,j2=c.forwardRef((e,t)=>{const{size:o}=x0("Item");return a.jsx(y2,{$size:o,"data-size":o,ref:t,...e})}),y2=m(X1)`
  overflow: hidden;
  margin: 1px 0;

  &:first-child {
    border-top-left-radius: 0.3rem;
    border-top-right-radius: 0.3rem;
    margin-top: 0;
  }

  &:last-child {
    border-bottom-left-radius: 0.3rem;
    border-bottom-right-radius: 0.3rem;
    margin-bottom: 0;
  }

  &[data-size='S'] {
    & + & {
      border-top: solid 1px ${e=>e.theme.colors.neutral200};
    }
  }

  &[data-state='open'] {
    box-shadow: 0 0 0 1px ${e=>e.theme.colors.primary600};
  }

  &:not([data-disabled]):hover {
    box-shadow: 0 0 0 1px ${e=>e.theme.colors.primary600};
  }

  /* This applies our desired focus effect correctly. */
  &:focus-within {
    position: relative;
    z-index: 1;
    box-shadow: 0 0 0 1px ${e=>e.theme.colors.primary600};
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: box-shadow ${e=>e.theme.motion.timings[120]}
      ${e=>e.theme.motion.easings.easeOutQuad};
  }
`,S2=c.forwardRef(({caretPosition:e="left",description:t,icon:o,iconProps:r,children:n,...s},i)=>{const{size:l}=x0("Trigger");return a.jsxs(Xn,{$caretPosition:e,$size:l,ref:i,...s,children:[e==="left"?a.jsx(lt,{$size:l,children:a.jsx(Le,{width:l==="S"?"1.2rem":"1.6rem",height:l==="S"?"1.2rem":"1.6rem"})}):null,a.jsxs(A,{tag:"span",gap:2,overflow:"hidden",children:[o&&l==="S"?a.jsx(Qn,{children:a.jsx(o,{...r})}):null,a.jsxs(A,{alignItems:"flex-start",direction:"column",tag:"span",ref:i,overflow:"hidden",children:[a.jsx(k,{fontWeight:l==="S"?"bold":void 0,ellipsis:!0,variant:l==="M"?"delta":void 0,textAlign:"left",width:"100%",children:n}),t&&l==="M"?a.jsx(k,{textAlign:"left",children:t}):null]})]}),e==="right"?a.jsx(lt,{$size:l,children:a.jsx(Le,{width:l==="S"?"1.2rem":"1.6rem",height:l==="S"?"1.2rem":"1.6rem"})}):null]})}),Qn=m(M)`
  color: ${e=>e.theme.colors.neutral500};
  display: flex;

  @media (prefers-reduced-motion: no-preference) {
    transition: ${e=>e.theme.transitions.color};
  }
`,lt=m(A).attrs(e=>({...e,tag:"span"}))`
  background-color: ${e=>e.theme.colors.neutral200};
  width: ${e=>e.$size==="S"?"2.4rem":"3.2rem"};
  height: ${e=>e.$size==="S"?"2.4rem":"3.2rem"};
  flex: ${e=>e.$size==="S"?"0 0 2.4rem":"0 0 3.2rem"};
  border-radius: 50%;
  justify-content: center;

  @media (prefers-reduced-motion: no-preference) {
    transition:
      transform ${e=>e.theme.motion.timings[200]} ${e=>e.theme.motion.easings.authenticMotion},
      ${e=>e.theme.transitions.backgroundColor};
  }
`,Xn=m(J1)`
  display: flex;
  align-items: center;
  justify-content: ${e=>e.$caretPosition==="left"?"flex-start":"space-between"};
  width: 100%;
  gap: ${e=>e.theme.spaces[4]};
  padding-inline: ${e=>e.$size==="S"?e.theme.spaces[4]:e.theme.spaces[6]};
  padding-block: ${e=>e.$size==="S"?e.theme.spaces[3]:e.theme.spaces[6]};
  cursor: pointer;
  color: ${e=>e.theme.colors.neutral800};
  overflow: hidden;

  &[data-disabled] {
    cursor: default;
    color: ${e=>e.theme.colors.neutral600};
  }

  &[data-state='open'] > ${lt} {
    transform: rotate(180deg);
  }

  /* we remove the default focus because the entire item should have the focus style and the default would be hidden. */
  &:focus-visible {
    outline: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: ${e=>e.theme.transitions.color};
  }
`,R2=c.forwardRef((e,t)=>{const{size:o}=x0("Trigger");return a.jsx(Jn,{$size:o,...e,ref:t})}),Jn=m(A).attrs(e=>({...e,tag:"span"}))`
  padding-inline: ${e=>e.$size==="S"?e.theme.spaces[2]:e.theme.spaces[6]};
  padding-block: ${e=>e.$size==="S"?e.theme.spaces[2]:e.theme.spaces[6]};

  // Remove default IconButton styles so there are no backgrounds or borders.
  & > button {
    border: none;
    background: none;
    color: ${e=>e.theme.colors.neutral600};

    @media (prefers-reduced-motion: no-preference) {
      transition: ${e=>e.theme.transitions.color};
    }
  }
`,I2=c.forwardRef(({variant:e="primary",...t},o)=>a.jsx(A2,{$variant:e,ref:o,...t})),A2=m(P1)`
  display: flex;
  align-items: center;
  background-color: ${e=>e.$variant==="primary"?e.theme.colors.neutral0:e.theme.colors.neutral100};

  &[data-disabled] {
    background-color: ${e=>e.theme.colors.neutral150};
  }

  &:not([data-disabled]) {
    &:hover,
    &[data-state='open'] {
      background-color: ${e=>e.theme.colors.primary100};

      & > ${Xn} {
        color: ${e=>e.theme.colors.primary600};

        & ${Qn} {
          color: ${e=>e.theme.colors.primary600};
        }

        & ${lt} {
          background-color: ${e=>e.theme.colors.primary200};
        }
      }

      & > ${Jn} > button {
        color: ${e=>e.theme.colors.primary600};
      }
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: ${e=>e.theme.transitions.backgroundColor};
  }
`,M2=c.forwardRef((e,t)=>a.jsx(E2,{ref:t,...e})),T2=ie`
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
`,V2=ie`
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
`,E2=m(eo)`
  overflow: hidden;

  @media (prefers-reduced-motion: no-preference) {
    &[data-state='open'] {
      animation: ${T2} ${e=>e.theme.motion.timings[320]}
        ${e=>e.theme.motion.easings.authenticMotion};
    }

    &[data-state='closed'] {
      animation: ${V2} ${e=>e.theme.motion.timings[320]}
        ${e=>e.theme.motion.easings.authenticMotion};
    }
  }
`,Rh=Object.freeze(Object.defineProperty({__proto__:null,Actions:R2,Content:M2,Header:I2,Item:j2,Root:$2,Trigger:S2},Symbol.toStringTag,{value:"Module"})),ft=E`
  position: relative;
  outline: none;

  &:after {
    transition-property: all;
    transition-duration: 0.2s;
    border-radius: 8px;
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border: 2px solid transparent;
  }

  &:focus-visible {
    outline: none;

    &:after {
      border-radius: 8px;
      content: '';
      position: absolute;
      top: -5px;
      bottom: -5px;
      left: -5px;
      right: -5px;
      border: 2px solid ${e=>e.theme.colors.primary600};
    }
  }
`,Ue=({tag:e,...t})=>{const o=e||"span";return a.jsx(L2,{...t,as:o})},L2=m.span`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`,Qe=({children:e,label:t})=>{const o=c.Children.only(e);return a.jsxs(a.Fragment,{children:[c.cloneElement(o,{"aria-hidden":"true",focusable:"false"}),a.jsx(Ue,{children:t})]})};Qe.displayName="AccessibleIcon";const Dt=({theme:e,$variant:t})=>t==="danger"?e.colors.danger700:t==="success"?e.colors.success700:t==="warning"?e.colors.warning700:e.colors.primary700;m(M)`
  ${ft};
`;m(A)`
  svg {
    height: 100%;
    width: 100%;

    path {
      fill: ${Dt};
    }
  }
`;m(M)`
  & a > span {
    color: ${Dt};
  }

  svg path {
    fill: ${Dt};
  }
`;function Ce({prop:e,defaultProp:t,onChange:o=()=>{}}){const[r,n]=Pn({defaultProp:t,onChange:o}),s=e!==void 0,i=s?e:r,l=mn(o),d=c.useCallback(f=>{if(s){const w=typeof f=="function"?f(e):f;w!==e&&l(w)}else n(f)},[s,e,n,l]);return[i,d]}function Pn({defaultProp:e,onChange:t}){const o=c.useState(e),[r]=o,n=c.useRef(r),s=mn(t);return c.useEffect(()=>{n.current!==r&&(s(r),n.current=r)},[r,n,s]),o}const L0={easeInSine:"cubic-bezier(0.47, 0, 0.745, 0.715)",easeOutSine:"cubic-bezier(0.39, 0.575, 0.565, 1)",easeInOutSine:"cubic-bezier(0.39, 0.575, 0.565, 1)",easeInQuad:"cubic-bezier(0.55, 0.085, 0.68, 0.53)",easeOutQuad:"cubic-bezier(0.25, 0.46, 0.45, 0.94)",easeInOutQuad:"cubic-bezier(0.25, 0.46, 0.45, 0.94)",easeInCubic:"cubic-bezier(0.55, 0.055, 0.675, 0.19)",easeOutCubic:"cubic-bezier(0.215, 0.61, 0.355, 1)",easeInOutCubic:"cubic-bezier(0.215, 0.61, 0.355, 1)",easeInQuart:"cubic-bezier(0.895, 0.03, 0.685, 0.22)",easeOutQuart:"cubic-bezier(0.165, 0.84, 0.44, 1)",easeInOutQuart:"cubic-bezier(0.165, 0.84, 0.44, 1)",easeInQuint:"cubic-bezier(0.755, 0.05, 0.855, 0.06)",easeOutQuint:"cubic-bezier(0.23, 1, 0.32, 1)",easeInOutQuint:"cubic-bezier(0.23, 1, 0.32, 1)",easeInExpo:"cubic-bezier(0.95, 0.05, 0.795, 0.035)",easeOutExpo:"cubic-bezier(0.19, 1, 0.22, 1)",easeInOutExpo:"cubic-bezier(0.19, 1, 0.22, 1)",easeInCirc:"cubic-bezier(0.6, 0.04, 0.98, 0.335)",easeOutCirc:"cubic-bezier(0.075, 0.82, 0.165, 1)",easeInOutCirc:"cubic-bezier(0.075, 0.82, 0.165, 1)",easeInBack:"cubic-bezier(0.6, -0.28, 0.735, 0.045)",easeOutBack:"cubic-bezier(0.175, 0.885, 0.32, 1.275)",easeInOutBack:"cubic-bezier(0.68, -0.55, 0.265, 1.55)",easeInOutFast:"cubic-bezier(1,0,0,1)",authenticMotion:"cubic-bezier(.4,0,.2,1)"},H0={320:"320ms",200:"200ms",120:"120ms"};`${H0[120]}${L0.easeOutQuad}`,`${H0[120]}${L0.easeOutQuad}`;const ne={overlayFadeIn:ie`
    from {
      opacity: 0;
    }
    to {
      opacity: 0.2;
    }
  `,modalPopIn:ie`
    from {
      transform:translate(-50%, -50%)  scale(0.8);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  `,modalPopOut:ie`
    from {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    to {
      transform:translate(-50%, -50%)  scale(0.8);
      opacity: 0;
    }
  `,popIn:ie`
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  `,popOut:ie`
    from {
      transform: scale(1);
      opacity: 1;
    }
    to {
      transform: scale(0.8);
      opacity: 0;
    }
  `,slideDownIn:ie`
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,slideDownOut:ie`
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  `,slideUpIn:ie`
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,slideUpOut:ie`
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(10px);
    }
  `,fadeIn:ie`
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  `,fadeOut:ie`
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  `},Xe=32,B0=2;c.forwardRef(({onLoadingStatusChange:e,delayMs:t=600,src:o,alt:r,fallback:n,preview:s=!1,...i},l)=>{const[d,f]=Ce({onChange:e}),[u,w]=c.useState(!1),g=s&&d==="loaded",x=v=>{g&&w(v)};return a.jsxs(rn,{onOpenChange:x,children:[a.jsx(sn,{asChild:!0,children:a.jsxs(zt,{ref:l,...i,children:[g?a.jsx(H2,{width:"100%",height:"100%",position:"absolute",background:"neutral0",zIndex:"overlay",style:{opacity:u?.4:0}}):null,a.jsx(B2,{src:o,alt:r,onLoadingStatusChange:f}),a.jsx(to,{delayMs:t,children:a.jsx(k,{fontWeight:"bold",textTransform:"uppercase",children:n})})]})}),g?a.jsx(cn,{children:a.jsx(D2,{side:"top",sideOffset:4,children:a.jsx(z2,{src:o,alt:r})})}):null]})});const e1=E`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  overflow: hidden;
  user-select: none;
  overflow: hidden;
  border-radius: 50%;
`,t1=E`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
`,zt=m(no)`
  position: relative;
  z-index: 0;
  ${e1}
  width: ${Xe/10}rem;
  height: ${Xe/10}rem;
  /* TODO: we should get the user email & hash it to turn it into a hex-value so different emails can consistently get a different background */
  background-color: ${e=>e.theme.colors.primary600};
  color: ${e=>e.theme.colors.neutral0};
`,H2=m(M)`
  @media (prefers-reduced-motion: no-preference) {
    transition: opacity ${e=>e.theme.motion.timings[200]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`,B2=m(oo)`
  ${t1}
`,D2=m(ln)`
  ${e1}
  width: ${Xe*B0/10}rem;
  height: ${Xe*B0/10}rem;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${ne.fadeIn} ${e=>e.theme.motion.timings[200]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`,z2=m.img`
  ${t1}
`;c.forwardRef((e,t)=>a.jsx(k2,{...e,ref:t,tag:"div"}));const k2=m(A)`
  & > ${zt} + ${zt} {
    margin-left: -${Xe/10/2}rem;
  }
`,N2=({active:e=!1,size:t="M",textColor:o="neutral600",backgroundColor:r="neutral150",children:n,minWidth:s=5,...i})=>{const l=t==="S"?1:2;return a.jsx(O2,{inline:!0,alignItems:"center",justifyContent:"center",minWidth:s,paddingLeft:l,paddingRight:l,background:e?"primary200":r,$size:t,...i,children:a.jsx(k,{variant:"sigma",textColor:e?"primary600":o,lineHeight:"1rem",children:n})})},O2=m(A)`
  border-radius: ${({theme:e,$size:t})=>t==="S"?"2px":e.borderRadius};
  ${({$size:e,theme:t})=>e==="S"?E`
        padding-block: 0.3rem;
        padding-inline ${t.spaces[1]}
      `:E`
      padding-block: 0.7rem;
      padding-inline ${t.spaces[2]}
    `};
`,nt=he(({href:e,disabled:t=!1,isExternal:o=!1,...r},n)=>a.jsx(F2,{tag:"a",ref:n,target:o?"_blank":void 0,rel:o?"noreferrer noopener":void 0,href:e,tabIndex:t?-1:void 0,"aria-disabled":t,pointerEvents:t?"none":void 0,cursor:t?void 0:"pointer",...r})),F2=m(M)`
  text-decoration: none;

  &:visited {
    color: inherit;
  }
`,n1=()=>a.jsx(M,{"aria-hidden":!0,paddingLeft:1,paddingRight:1,children:a.jsx(k,{variant:"pi",textColor:"neutral500",children:"/"})});n1.displayName="Divider";const _2=m(A)`
  // CrumbLinks do have padding-x, because they need to have a
  // interaction effect, which mis-aligns the breadcrumbs on the left.
  // This normalizes the behavior by moving the first item to left by
  // the same amount it has inner padding
  & > *:first-child {
    margin-left: ${({theme:e})=>`calc(-1*${e.spaces[2]})`};
  }
`,W2=c.forwardRef(({label:e,children:t,...o},r)=>{const n=c.Children.toArray(t);return a.jsx(M,{"aria-label":e,tag:"nav",...o,ref:r,children:a.jsx(_2,{tag:"ol",children:c.Children.map(n,(s,i)=>{const l=n.length>1&&i+1<n.length;return a.jsxs(A,{inline:!0,tag:"li",children:[s,l&&a.jsx(n1,{})]})})})})});W2.displayName="Breadcrumbs";const U2=c.forwardRef(({children:e,isCurrent:t=!1,...o},r)=>a.jsx(M,{paddingLeft:2,paddingRight:2,paddingTop:1,paddingBottom:1,ref:r,children:a.jsx(k,{variant:"pi",textColor:"neutral800",fontWeight:t?"bold":"regular","aria-current":t,...o,children:e})}));U2.displayName="Crumb";const q2=m(nt)`
  border-radius: ${({theme:e})=>e.borderRadius};
  color: ${({theme:e})=>e.colors.neutral600};
  font-size: ${({theme:e})=>e.fontSizes[1]};
  line-height: ${({theme:e})=>e.lineHeights[4]};
  padding: ${({theme:e})=>`${e.spaces[1]} ${e.spaces[2]}`};
  text-decoration: none;

  :hover,
  :focus {
    background-color: ${({theme:e})=>e.colors.neutral200};
    color: ${({theme:e})=>e.colors.neutral700};
  }
`,G2=c.forwardRef(({children:e,...t},o)=>a.jsx(q2,{ref:o,...t,children:e}));G2.displayName="CrumbLink";const Ne=e=>e.replaceAll(":","");function K2(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}function o1(...e){return t=>e.forEach(o=>K2(o,t))}function ge(...e){return c.useCallback(o1(...e),e)}const Y2=()=>typeof window>"u"||!window.navigator||/ServerSideRendering|^Deno\//.test(window.navigator.userAgent),Oe=Y2()?c.useEffect:c.useLayoutEffect,Z2=ua.useId||(()=>{});let Q2=0;const pe=e=>{const[t,o]=c.useState(Z2());return Oe(()=>{e||o(r=>r??String(Q2++))},[e]),e?.toString()??(t||"")},ot=(e,t,{selectorToWatch:o,skipWhen:r=!1})=>{const n=Qt(t);c.useEffect(()=>{if(r||!e.current)return;const s={root:e.current,rootMargin:"0px"},i=f=>{f.forEach(u=>{u.isIntersecting&&e.current&&e.current.scrollHeight>e.current.clientHeight&&n(u)})},l=new IntersectionObserver(i,s),d=e.current.querySelector(o);return d&&l.observe(d),()=>{l.disconnect()}},[r,n,o,e])},w0="success-light",v0="danger-light",mt="default",at="tertiary",rt="secondary",a1="danger",r1="success",xt="ghost",b0=[w0,v0],X2=[mt,at,rt,a1,r1,xt,...b0],J2=["XS","S","M","L"],we=e=>e===w0||e===v0?`${e.substring(0,e.lastIndexOf("-"))}`:e===at?"neutral":e===mt||e===rt||X2.every(t=>t!==e)?"primary":`${e}`,s1=({theme:e})=>E`
    border: 1px solid ${e.colors.neutral200};
    background: ${e.colors.neutral150};
    color: ${e.colors.neutral600};
    cursor: default;
  `,i1=({theme:e,$variant:t})=>[...b0,rt].includes(t)?E`
      background-color: ${e.colors.neutral0};
    `:t===at?E`
      background-color: ${e.colors.neutral100};
    `:t===xt?E`
      background-color: ${e.colors.neutral100};
    `:t===mt?E`
      border: 1px solid ${e.colors.buttonPrimary500};
      background: ${e.colors.buttonPrimary500};
    `:E`
    border: 1px solid ${e.colors[`${we(t)}500`]};
    background: ${e.colors[`${we(t)}500`]};
  `,c1=({theme:e,$variant:t})=>[...b0,rt].includes(t)?E`
      background-color: ${e.colors.neutral0};
      border: 1px solid ${e.colors[`${we(t)}600`]};
      color: ${e.colors[`${we(t)}600`]};
    `:t===at||t===xt?E`
      background-color: ${e.colors.neutral150};
    `:E`
    border: 1px solid ${e.colors[`${we(t)}600`]};
    background: ${e.colors[`${we(t)}600`]};
  `,l1=({theme:e,$variant:t})=>{switch(t){case v0:case w0:case rt:return E`
        border: 1px solid ${e.colors[`${we(t)}200`]};
        background: ${e.colors[`${we(t)}100`]};
        color: ${e.colors[`${we(t)}700`]};
      `;case at:return E`
        border: 1px solid ${e.colors.neutral200};
        background: ${e.colors.neutral0};
        color: ${e.colors.neutral800};
      `;case xt:return E`
        border: 1px solid transparent;
        background: transparent;
        color: ${e.colors.neutral800};

        svg {
          fill: ${e.colors.neutral500};
        }
      `;case r1:case a1:return E`
        border: 1px solid ${e.colors[`${we(t)}600`]};
        background: ${e.colors[`${we(t)}600`]};
        color: ${e.colors.neutral0};
      `;default:return E`
        border: 1px solid ${e.colors.buttonPrimary600};
        background: ${e.colors.buttonPrimary600};
        color: ${e.colors.buttonNeutral0};
      `}},kt=he(({variant:e=mt,startIcon:t,endIcon:o,disabled:r=!1,children:n,onClick:s,size:i=J2[1],loading:l=!1,fullWidth:d=!1,...f},u)=>{const w=r||l,g=x=>{!w&&s&&s(x)};return a.jsxs(tl,{ref:u,"aria-disabled":w,disabled:w,$size:i,$variant:e,tag:"button",onClick:g,hasRadius:!0,gap:2,inline:!0,alignItems:"center",justifyContent:"center",width:d?"100%":void 0,paddingLeft:4,paddingRight:4,cursor:"pointer",...f,children:[(t||l)&&a.jsx(A,{tag:"span","aria-hidden":!0,children:l?a.jsx(el,{}):t}),a.jsx(k,{variant:i==="S"?"pi":void 0,fontWeight:"bold",children:n}),o&&a.jsx(A,{tag:"span","aria-hidden":!0,children:o})]})}),P2=ie`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`,el=m(Yn)`
  animation: ${P2} 2s infinite linear;
  will-change: transform;
`,tl=m(A)`
  height: ${({theme:e,$size:t})=>e.sizes.button[t]};
  text-decoration: none;
  ${l1}

  &:hover {
    ${i1}
  }

  &:active {
    ${c1}
  }

  &[aria-disabled='true'] {
    ${s1}
  }

  @media (prefers-reduced-motion: no-preference) {
    transition:
      ${e=>e.theme.transitions.backgroundColor},
      ${e=>e.theme.transitions.color},
      border-color ${e=>e.theme.motion.timings[200]} ${e=>e.theme.motion.easings.easeOutQuad};
  }
`,d1=c.forwardRef(({children:e,description:t,label:o,defaultOpen:r,open:n,onOpenChange:s,delayDuration:i=500,disableHoverableContent:l,...d},f)=>!o&&!t?e:a.jsxs(rn,{defaultOpen:r,open:n,onOpenChange:s,delayDuration:i,disableHoverableContent:l,children:[a.jsx(sn,{asChild:!0,children:e}),a.jsx(cn,{children:a.jsx(nl,{ref:f,sideOffset:8,...d,children:a.jsx(k,{variant:"pi",fontWeight:"bold",children:o||t})})})]})),nl=m(ln)`
  background-color: ${e=>e.theme.colors.neutral900};
  color: ${e=>e.theme.colors.neutral0};
  padding-inline: ${e=>e.theme.spaces[2]};
  padding-block: ${e=>e.theme.spaces[2]};
  border-radius: ${e=>e.theme.borderRadius};
  z-index: ${e=>e.theme.zIndices.tooltip};
  will-change: opacity;
  transform-origin: var(--radix-tooltip-content-transform-origin);

  @media (prefers-reduced-motion: no-preference) {
    animation: ${ne.fadeIn} ${e=>e.theme.motion.timings[200]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`,He=he(({label:e,background:t,children:o,disabled:r=!1,onClick:n,size:s="S",variant:i="tertiary",withTooltip:l=!0,...d},f)=>{const u=g=>{!r&&n&&n(g)},w=a.jsx(Ze,{"aria-disabled":r,background:r?"neutral150":t,tag:"button",display:"inline-flex",justifyContent:"center",hasRadius:!0,cursor:"pointer",...d,ref:f,$size:s,onClick:u,$variant:i,children:a.jsx(Qe,{label:e,children:o})});return l?a.jsx(d1,{label:e,children:w}):w}),Ze=m(A)`
  text-decoration: none;

  ${e=>{switch(e.$size){case"XS":return E`
          padding-block: 0.2rem;
          padding-inline: 0.2rem;
        `;case"S":return E`
          padding-block: 0.7rem;
          padding-inline: 0.7rem;
        `;case"M":return E`
          padding-block: 0.9rem;
          padding-inline: 0.9rem;
        `;case"L":return E`
          padding-block: 1.1rem;
          padding-inline: 1.1rem;
        `}}}
  ${l1}
  ${e=>e.$variant==="tertiary"?E`
          color: ${e.theme.colors.neutral500};
        `:""}

  &:hover {
    ${i1}
    ${e=>e.$variant==="tertiary"?E`
            color: ${e.theme.colors.neutral600};
          `:""}
  }

  &:active {
    ${c1}
  }

  &[aria-disabled='true'] {
    ${s1}
  }

  @media (prefers-reduced-motion: no-preference) {
    transition:
      ${e=>e.theme.transitions.backgroundColor},
      ${e=>e.theme.transitions.color},
      border-color ${e=>e.theme.motion.timings[200]} ${e=>e.theme.motion.easings.easeOutQuad};
  }
`;m(A)`
  & ${Ze}:first-child {
    border-radius: ${({theme:e})=>`${e.borderRadius} 0 0 ${e.borderRadius}`};
  }

  & ${Ze}:last-child {
    border-radius: ${({theme:e})=>`0 ${e.borderRadius} ${e.borderRadius} 0`};
  }

  & ${Ze} {
    border-radius: 0;

    & + ${Ze} {
      border-left: none;
    }
  }
`;const ol=he(({children:e,href:t,disabled:o=!1,startIcon:r,endIcon:n,isExternal:s=!1,...i},l)=>a.jsxs(al,{ref:l,href:t,disabled:o,isExternal:s,...i,children:[r,a.jsx(k,{textColor:o?"neutral600":"primary600",children:e}),n,t&&!n&&s&&a.jsx(Os,{})]})),al=m(nt)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  gap: ${({theme:e})=>e.spaces[2]};
  pointer-events: ${({disabled:e})=>e?"none":void 0};

  svg {
    font-size: 1rem;

    path {
      fill: ${({disabled:e,theme:t})=>e?t.colors.neutral600:t.colors.primary600};
    }
  }

  &:hover {
    & > span {
      color: ${({theme:e})=>e.colors.primary500};
    }

    svg path {
      fill: ${({theme:e})=>e.colors.primary500};
    }
  }

  &:active {
    color: ${({theme:e})=>e.colors.primary700};
  }

  ${ft};
`,rl=e=>{switch(e){case"danger":return"danger100";default:return"primary100"}},sl=ga,il=c.forwardRef(({label:e,endIcon:t=a.jsx(Le,{width:"1.2rem",height:"1.2rem","aria-hidden":!0}),tag:o=kt,icon:r,...n},s)=>{const i={...n,ref:s,type:"button"};return a.jsx(ao,{asChild:!0,disabled:i.disabled,children:o===He?a.jsx(He,{label:e,variant:"tertiary",...i,children:r}):a.jsx(kt,{endIcon:t,variant:"ghost",...i})})}),cl=c.forwardRef(({children:e,intersectionId:t,onCloseAutoFocus:o,popoverPlacement:r="bottom-start",...n},s)=>{const[i,l]=r.split("-");return a.jsx(dn,{children:a.jsx(ll,{align:l,side:i,loop:!0,onCloseAutoFocus:o,asChild:!0,children:a.jsxs(h1,{ref:s,direction:"column",borderColor:"neutral150",hasRadius:!0,background:"neutral0",shadow:"filterShadow",maxHeight:"15rem",padding:1,marginTop:1,marginBottom:1,alignItems:"flex-start",position:"relative",overflow:"auto",...n,children:[e,a.jsx(M,{id:t,width:"100%",height:"1px"})]})})})}),h1=m(A)`
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  z-index: ${e=>e.theme.zIndices.popover};

  &::-webkit-scrollbar {
    display: none;
  }
`,ll=m(ro)`
  @media (prefers-reduced-motion: no-preference) {
    animation-duration: ${e=>e.theme.motion.timings[200]};

    &[data-state='open'] {
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};

      &[data-side='top'] {
        animation-name: ${ne.slideUpIn};
      }

      &[data-side='bottom'] {
        animation-name: ${ne.slideDownIn};
      }
    }
  }
`,u1=({theme:e,$variant:t})=>E`
  text-align: left;
  width: 100%;
  border-radius: ${e.borderRadius};
  padding: ${e.spaces[2]} ${e.spaces[4]};

  &[aria-disabled='true'] {
    cursor: not-allowed;
  }

  &[data-highlighted] {
    background-color: ${e.colors[rl(t)]};
  }

  &:focus-visible {
    outline: none;

    &:after {
      content: none;
    }
  }
`,dl=m(A)`
  ${({theme:e,$variant:t})=>u1({theme:e,$variant:t})}
`;m(ol)`
  /* We include this here again because typically when people use OptionLink they provide an as prop which cancels the Box props */
  color: ${({theme:e,color:t})=>it(e.colors,t,void 0)};
  text-decoration: none;

  &:hover {
    color: unset;
  }

  /* TODO: do we need this? */
  svg > path,
  &:focus-visible svg > path {
    fill: currentColor;
  }

  ${({theme:e,$variant:t})=>u1({theme:e,$variant:t})}
`;const hl=m(M)`
  /* Negative horizontal margin to compensate Menu.Content's padding */
  margin: ${({theme:e})=>e.spaces[1]} -${({theme:e})=>e.spaces[1]};
  width: calc(100% + ${({theme:e})=>e.spaces[2]});
  /* Hide separator if there's nothing above in the menu */
  &:first-child {
    display: none;
  }
`;c.forwardRef((e,t)=>a.jsx(so,{...e,asChild:!0,children:a.jsx(hl,{height:"1px",shrink:0,background:"neutral150",ref:t})}));c.forwardRef((e,t)=>a.jsx(io,{asChild:!0,children:a.jsx(ul,{ref:t,variant:"sigma",textColor:"neutral600",...e})}));const ul=m(k)`
  padding: ${({theme:e})=>e.spaces[2]} ${({theme:e})=>e.spaces[4]};
`;c.forwardRef(({disabled:e=!1,...t},o)=>a.jsx(co,{asChild:!0,disabled:e,children:a.jsxs(gl,{ref:o,color:"neutral800",tag:"button",type:"button",background:"transparent",borderStyle:"none",gap:5,...t,children:[a.jsx(k,{children:t.children}),a.jsx(m0,{fill:"neutral500",height:"1.2rem",width:"1.2rem"})]})}));const gl=m(dl)`
  &[data-state='open'] {
    background-color: ${({theme:e})=>e.colors.primary100};
  }
`;c.forwardRef((e,t)=>a.jsx(dn,{children:a.jsx(lo,{sideOffset:8,asChild:!0,children:a.jsx(h1,{ref:t,direction:"column",borderStyle:"solid",borderWidth:"1px",borderColor:"neutral150",hasRadius:!0,background:"neutral0",shadow:"filterShadow",maxHeight:"15rem",padding:1,alignItems:"flex-start",overflow:"auto",...e})})}));const fl=sl,ml=il,xl=cl,wl=c.forwardRef(({children:e,onOpen:t,onClose:o,popoverPlacement:r,onReachEnd:n,...s},i)=>{const l=c.useRef(null),d=ge(i,l),f=c.useRef(null),[u,w]=c.useState(!1),g=C=>{n&&n(C)},x=C=>{C&&typeof t=="function"?t():!C&&typeof o=="function"&&o(),w(C)},v=pe(),b=`intersection-${Ne(v)}`;return ot(f,g,{selectorToWatch:`#${b}`,skipWhen:!u}),a.jsxs(fl,{onOpenChange:x,children:[a.jsx(ml,{ref:d,...s,children:s.label}),a.jsx(xl,{ref:f,intersectionId:b,popoverPlacement:r,children:e})]})}),vl=m(wl)`
  padding: ${({theme:e})=>`${e.spaces[1]} ${e.spaces[2]}`};
  height: unset;

  :hover,
  :focus {
    background-color: ${({theme:e})=>e.colors.neutral200};
  }
`,bl=c.forwardRef(({children:e,...t},o)=>a.jsx(vl,{ref:o,endIcon:null,size:"S",...t,children:e}));bl.displayName="CrumbSimpleMenu";const g1=c.createContext({id:""}),pl=()=>c.useContext(g1);c.forwardRef(({id:e,...t},o)=>{const r=pe(e),n=c.useMemo(()=>({id:r}),[r]);return a.jsx(g1.Provider,{value:n,children:a.jsx(M,{ref:o,id:e,tabIndex:0,hasRadius:!0,background:"neutral0",borderStyle:"solid",borderWidth:"1px",borderColor:"neutral150",shadow:"tableShadow",tag:"article","aria-labelledby":`${r}-title`,...t})})});const $l=c.forwardRef(({position:e,...t},o)=>a.jsx(Cl,{ref:o,$position:e,...t,direction:"row",gap:2})),Cl=m(A)`
  position: absolute;
  top: ${({theme:e})=>e.spaces[3]};
  right: ${({$position:e,theme:t})=>{if(e==="end")return t.spaces[3]}};
  left: ${({$position:e,theme:t})=>{if(e==="start")return t.spaces[3]}};
`;m.img`
  // inline flows is based on typography and displays an extra white space below the image
  // switch to block is required in order to make the img stick the bottom of the container
  // addition infos: https://stackoverflow.com/questions/5804256/image-inside-div-has-extra-space-below-the-image
  margin: 0;
  padding: 0;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
`;m.div`
  display: flex;
  justify-content: center;
  height: ${({$size:e})=>e==="S"?"8.8rem":"16.4rem"};
  width: 100%;
  background: repeating-conic-gradient(${({theme:e})=>e.colors.neutral100} 0% 25%, transparent 0% 50%) 50% / 20px
    20px;
  border-top-left-radius: ${({theme:e})=>e.borderRadius};
  border-top-right-radius: ${({theme:e})=>e.borderRadius};
`;m.div`
  margin-left: auto;
  flex-shrink: 0;
`;m(N2)`
  margin-left: ${({theme:e})=>e.spaces[1]};
`;const jl=({fill:e,...t})=>{const{colors:o}=h();return a.jsx(M,{tag:"svg",viewBox:"0 0 32 32",xmlns:"http://www.w3.org/2000/svg",fill:e?o[e]:void 0,...t,children:a.jsx("path",{d:"M29.0613 10.0613L13.0613 26.0613C12.9219 26.2011 12.7563 26.3121 12.574 26.3878C12.3917 26.4635 12.1962 26.5024 11.9988 26.5024C11.8013 26.5024 11.6059 26.4635 11.4235 26.3878C11.2412 26.3121 11.0756 26.2011 10.9363 26.0613L3.93626 19.0613C3.79673 18.9217 3.68605 18.7561 3.61053 18.5738C3.53502 18.3915 3.49615 18.1961 3.49615 17.9988C3.49615 17.8014 3.53502 17.606 3.61053 17.4237C3.68605 17.2414 3.79673 17.0758 3.93626 16.9363C4.07579 16.7967 4.24143 16.686 4.42374 16.6105C4.60604 16.535 4.80143 16.4962 4.99876 16.4962C5.19608 16.4962 5.39147 16.535 5.57378 16.6105C5.75608 16.686 5.92173 16.7967 6.06126 16.9363L12 22.875L26.9388 7.93876C27.2205 7.65697 27.6027 7.49866 28.0013 7.49866C28.3998 7.49866 28.782 7.65697 29.0638 7.93876C29.3455 8.22055 29.5039 8.60274 29.5039 9.00126C29.5039 9.39977 29.3455 9.78197 29.0638 10.0638L29.0613 10.0613Z"})})},D0=c.forwardRef(({defaultChecked:e,checked:t,onCheckedChange:o,...r},n)=>{const s=c.useRef(null),[i,l]=Ce({defaultProp:e,prop:t,onChange:o}),d=ge(s,n);return a.jsx(yl,{ref:d,checked:i,onCheckedChange:l,...r,children:a.jsxs(Sl,{forceMount:!0,children:[i===!0?a.jsx(jl,{width:"1.6rem",fill:"neutral0"}):null,i==="indeterminate"?a.jsx(Wi,{fill:"neutral0"}):null]})})}),yl=m(ho)`
  background: ${e=>e.theme.colors.neutral0};
  width: 2rem;
  height: 2rem;
  border-radius: ${e=>e.theme.borderRadius};
  border: 1px solid ${e=>e.theme.colors.neutral300};
  position: relative;
  z-index: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  // this ensures the checkbox is always a square even in flex-containers.
  flex: 0 0 2rem;

  &[data-state='checked']:not([data-disabled]),
  &[data-state='indeterminate']:not([data-disabled]) {
    border: 1px solid ${e=>e.theme.colors.primary600};
    background-color: ${e=>e.theme.colors.primary600};
  }

  &[data-disabled] {
    background-color: ${e=>e.theme.colors.neutral200};
  }

  /* increase target size for touch devices https://www.w3.org/WAI/WCAG21/Understanding/target-size.html */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    z-index: -1;
    min-width: 44px;
    min-height: 44px;
  }
`,Sl=m(uo)`
  display: inline-flex;
  pointer-events: auto !important;
  width: 100%;
  height: 100%;
  cursor: pointer;
  justify-content: center;
  align-items: center;

  &[data-disabled] {
    cursor: not-allowed;
  }
`,p0=c.forwardRef(({children:e,...t},o)=>{const r=pe(t.id);return e?a.jsxs(A,{gap:2,children:[a.jsx(D0,{id:r,...t}),a.jsx(k,{tag:"label",textColor:"neutral800",htmlFor:r,children:e})]}):a.jsx(D0,{ref:o,...t})});c.forwardRef((e,t)=>{const{id:o}=pl();return a.jsx($l,{position:"start",children:a.jsx(p0,{"aria-labelledby":`${o}-title`,...e,ref:t})})});m(M)`
  word-break: break-all;
`;m(A)`
  border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};
`;const ce={DOWN:"ArrowDown",UP:"ArrowUp",RIGHT:"ArrowRight",LEFT:"ArrowLeft",ESCAPE:"Escape",ENTER:"Enter",SPACE:" ",TAB:"Tab",END:"End",HOME:"Home",DELETE:"Delete",PAGE_UP:"PageUp",PAGE_DOWN:"PageDown",BACKSPACE:"Backspace",CLEAR:"Clear"},Rl=m(M)`
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'startAction slides endAction';
`,Il=m(A)`
  grid-area: slides;
`,z0=m(M)`
  grid-area: ${({$area:e})=>e};

  &:focus svg path,
  &:hover svg path {
    fill: ${({theme:e})=>e.colors.neutral900};
  }
`,Al=c.forwardRef(({actions:e,children:t,label:o,nextLabel:r,onNext:n,onPrevious:s,previousLabel:i,secondaryLabel:l,selectedSlide:d,...f},u)=>{const w=c.useRef(null),g=c.useRef(null),x=c.Children.map(t,(b,C)=>c.cloneElement(b,{selected:C===d})),v=b=>{switch(b.key){case ce.RIGHT:{b.preventDefault(),g?.current&&g.current.focus(),n&&n();break}case ce.LEFT:{b.preventDefault(),w?.current&&w.current.focus(),s&&s();break}}};return a.jsx(M,{ref:u,...f,onKeyDown:v,children:a.jsxs(M,{padding:2,borderColor:"neutral200",hasRadius:!0,background:"neutral100",children:[a.jsxs(Rl,{tag:"section","aria-roledescription":"carousel","aria-label":o,display:"grid",position:"relative",children:[x&&x.length>1&&a.jsxs(a.Fragment,{children:[a.jsx(z0,{tag:"button",onClick:s,$area:"startAction",ref:w,type:"button",children:a.jsx(Qe,{label:i,children:a.jsx(Kn,{width:"1.6rem",height:"1.6rem",fill:"neutral600"})})}),a.jsx(z0,{tag:"button",onClick:n,$area:"endAction",ref:g,type:"button",children:a.jsx(Qe,{label:r,children:a.jsx(m0,{width:"1.6rem",height:"1.6rem",fill:"neutral600"})})})]}),a.jsx(Il,{"aria-live":"polite",paddingLeft:2,paddingRight:2,width:"100%",overflow:"hidden",children:x}),e]}),l&&a.jsx(M,{paddingTop:2,paddingLeft:4,paddingRight:4,children:a.jsx(d1,{label:l,children:a.jsx(A,{justifyContent:"center",children:a.jsx(k,{variant:"pi",textColor:"neutral600",ellipsis:!0,children:l})})})})]})})}),Me=(e="&")=>({theme:t,$hasError:o=!1})=>E`
    outline: none;
    box-shadow: none;
    transition-property: border-color, box-shadow, fill;
    transition-duration: 0.2s;

    ${e}:focus-within {
      border: 1px solid ${o?t.colors.danger600:t.colors.primary600};
      box-shadow: ${o?t.colors.danger600:t.colors.primary600} 0px 0px 0px 2px;
    }
  `,[Ml,fe]=tt("Field",{}),Be=c.forwardRef(({children:e,name:t,error:o=!1,hint:r,id:n,required:s=!1,...i},l)=>{const d=pe(n),[f,u]=c.useState();return a.jsx(Ml,{name:t,id:d,error:o,hint:r,required:s,labelNode:f,setLabelNode:u,children:a.jsx(A,{direction:"column",alignItems:"stretch",gap:1,ref:l,...i,children:e})})}),$0=c.forwardRef(({children:e,action:t,...o},r)=>{const{id:n,required:s,setLabelNode:i}=fe("Label"),l=ge(r,i);return e?a.jsxs(Tl,{ref:l,variant:"pi",textColor:"neutral800",fontWeight:"bold",...o,id:`${n}-label`,htmlFor:n,tag:"label",ellipsis:!0,children:[e,s&&a.jsx(k,{"aria-hidden":!0,lineHeight:"1em",textColor:"danger600",children:"*"}),t&&a.jsx(Vl,{marginLeft:1,children:t})]}):null}),Tl=m(k)`
  display: flex;
`,Vl=m(A)`
  line-height: 0;
  color: ${({theme:e})=>e.colors.neutral500};
`,wt=c.forwardRef(({endAction:e,startAction:t,disabled:o=!1,onChange:r,hasError:n,required:s,className:i,size:l="M",...d},f)=>{const{id:u,error:w,hint:g,name:x,required:v}=fe("Input");let b;w?b=`${u}-error`:g&&(b=`${u}-hint`);const C=!!w,$=c.useRef(null),p=c.useRef(null),j=ge(p,f),y=S=>{!o&&r&&r(S)};return c.useLayoutEffect(()=>{if($.current&&p.current){const S=$.current.offsetWidth,I=p.current;if(I){const R=S+8+16;I.style.paddingRight=`${R}px`}}},[e]),a.jsxs(Hl,{gap:2,justifyContent:"space-between",$hasError:C||n,$disabled:o,$size:l,$hasLeftAction:!!t,$hasRightAction:!!e,className:i,children:[t,a.jsx(El,{id:u,name:x,ref:j,$size:l,"aria-describedby":b,"aria-invalid":C||n,"aria-disabled":o,disabled:o,"data-disabled":o?"":void 0,onChange:y,"aria-required":v||s,$hasLeftAction:!!t,$hasRightAction:!!e,...d}),e&&a.jsx(Ll,{ref:$,children:e})]})}),El=m.input`
  border: none;
  border-radius: ${({theme:e})=>e.borderRadius};
  cursor: ${e=>e["aria-disabled"]?"not-allowed":void 0};

  color: ${({theme:e})=>e.colors.neutral800};
  font-weight: 400;
  font-size: ${e=>e.theme.fontSizes[2]};
  line-height: 2.2rem;
  display: block;
  width: 100%;
  background: inherit;

  &::placeholder {
    color: ${({theme:e})=>e.colors.neutral600};
    opacity: 1;
  }

  &[aria-disabled='true'] {
    color: inherit;
  }

  //focus managed by InputWrapper
  &:focus {
    outline: none;
    box-shadow: none;
  }

  ${e=>{switch(e.$size){case"S":return E`
          padding-inline-start: ${e.$hasLeftAction?0:e.theme.spaces[4]};
          padding-inline-end: ${e.$hasRightAction?0:e.theme.spaces[4]};
          padding-block: ${e.theme.spaces[1]};
        `;default:return E`
          padding-inline-start: ${e.$hasLeftAction?0:e.theme.spaces[4]};
          padding-inline-end: ${e.$hasRightAction?0:e.theme.spaces[4]};
          padding-block: ${e.theme.spaces[2]};
        `}}}
`,Ll=m(A)`
  position: absolute;
  right: ${({theme:e})=>e.spaces[4]};
  top: 50%;
  transform: translateY(-50%);
`,Hl=m(A)`
  border: 1px solid ${({theme:e,$hasError:t})=>t?e.colors.danger600:e.colors.neutral200};
  border-radius: ${({theme:e})=>e.borderRadius};
  background: ${({theme:e})=>e.colors.neutral0};
  padding-inline-start: ${({$hasLeftAction:e,theme:t})=>e?t.spaces[4]:0};
  position: relative;

  ${Me()}
  ${({theme:e,$disabled:t})=>t?E`
          color: ${e.colors.neutral600};
          background: ${e.colors.neutral150};
        `:void 0};
`,f1=()=>{const{id:e,hint:t,error:o}=fe("Hint");return!t||o?null:a.jsx(k,{variant:"pi",tag:"p",id:`${e}-hint`,textColor:"neutral600",children:t})},m1=()=>{const{id:e,error:t}=fe("Error");return!t||typeof t!="string"?null:a.jsx(k,{variant:"pi",tag:"p",id:`${e}-error`,textColor:"danger600","data-strapi-field-error":!0,children:t})},Bl=c.forwardRef(({label:e,children:t,...o},r)=>a.jsx(Dl,{justifyContent:"unset",background:"transparent",borderStyle:"none",...o,type:"button",tag:"button",ref:r,children:a.jsx(Qe,{label:e,children:t})})),Dl=m(A)`
  font-size: 1.6rem;
  padding: 0;
`,Ih=Object.freeze(Object.defineProperty({__proto__:null,Action:Bl,Error:m1,Hint:f1,Input:wt,Label:$0,Root:Be,useField:fe},Symbol.toStringTag,{value:"Module"}));c.forwardRef(({actions:e,children:t,error:o,hint:r,label:n,labelAction:s,nextLabel:i,onNext:l,onPrevious:d,previousLabel:f,required:u,secondaryLabel:w,selectedSlide:g,id:x,...v},b)=>{const C=pe(x);return a.jsx(Be,{hint:r,error:o,id:C,required:u,children:a.jsxs(A,{direction:"column",alignItems:"stretch",gap:1,children:[n&&a.jsx($0,{action:s,children:n}),a.jsx(Al,{ref:b,actions:e,label:n,nextLabel:i,onNext:l,onPrevious:d,previousLabel:f,secondaryLabel:w,selectedSlide:g,id:C,...v,children:t}),a.jsx(f1,{}),a.jsx(m1,{})]})})});m(M)`
  ${Zn}
`;m(A)`
  display: ${({$selected:e})=>e?"flex":"none"};
`;const vt=c.forwardRef(({children:e,viewportRef:t,...o},r)=>a.jsxs(zl,{ref:r,...o,children:[a.jsx(kl,{ref:t,children:e}),a.jsx(k0,{orientation:"vertical",children:a.jsx(N0,{})}),a.jsx(k0,{orientation:"horizontal",children:a.jsx(N0,{})})]})),zl=m(go)`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
`,kl=m(fo)`
  min-width: 100%;
`,k0=m(mo)`
  display: flex;
  /* ensures no selection */
  user-select: none;
  /* disable browser handling of all panning and zooming gestures on touch devices */
  touch-action: none;

  &[data-orientation='vertical'] {
    width: 0.4rem;
    margin: 0.4rem;
  }

  &[data-orientation='horizontal'] {
    flex-direction: column;
    height: 0.4rem;
    margin: 0.4rem;
  }
`,N0=m(xo)`
  position: relative;
  flex: 1;
  background-color: ${e=>e.theme.colors.neutral150};
  border-radius: 0.4rem;

  /* increase target size for touch devices https://www.w3.org/WAI/WCAG21/Understanding/target-size.html */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    min-width: 44px;
    min-height: 44px;
  }
`,Nl="data:image/svg+xml,%3csvg%20width='63'%20height='63'%20viewBox='0%200%2063%2063'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M42.5563%2011.9816C39.484%2010.3071%2035.8575%209.29097%2032.3354%209.13521C28.6443%208.92888%2024.8295%209.72318%2021.3336%2011.4129C20.9123%2011.5901%2020.5376%2011.8101%2020.1722%2012.0249L20.0108%2012.1179C19.8774%2012.1951%2019.7441%2012.2724%2019.608%2012.3536C19.3253%2012.5146%2019.0492%2012.6744%2018.7544%2012.8792C18.5463%2013.0329%2018.3395%2013.1759%2018.1301%2013.323C17.5658%2013.7208%2016.9868%2014.1317%2016.4983%2014.5979C14.8476%2015.9524%2013.5571%2017.6075%2012.6071%2018.9214C10.4365%2022.1566%209.08622%2025.9567%208.80702%2029.6143L8.7764%2030.1588C8.73328%2030.9196%208.68476%2031.7057%208.75353%2032.4555C8.76648%2032.6084%208.7661%2032.7638%208.77506%2032.914C8.78895%2033.229%208.80152%2033.5373%208.846%2033.8672L9.07396%2035.4221C9.09756%2035.5764%209.1198%2035.7413%209.1633%2035.9263L9.65919%2037.9272L10.138%2039.2823C10.2729%2039.6673%2010.4158%2040.0751%2010.6%2040.43C12.0292%2043.637%2014.1425%2046.4578%2016.7063%2048.585C19.0508%2050.5296%2021.824%2052.0023%2024.7491%2052.8452L26.2371%2053.2376C26.3781%2053.2693%2026.4926%2053.2889%2026.6031%2053.3058L26.7775%2053.3311C27.0052%2053.3636%2027.2195%2053.3986%2027.4445%2053.435C27.8598%2053.5076%2028.2672%2053.5748%2028.7079%2053.6183L30.5641%2053.7229C30.9516%2053.7249%2031.3352%2053.7068%2031.7081%2053.6874C31.9039%2053.681%2032.0984%2053.6681%2032.3288%2053.662C34.5253%2053.4772%2036.5106%2053.0634%2038.0516%2052.4652C38.1769%2052.4171%2038.3008%2052.3796%2038.4234%2052.3355C38.6727%2052.2499%2038.9259%2052.167%2039.1432%2052.0599L40.8591%2051.2626L42.5702%2050.266C42.9009%2050.0682%2043.0205%2049.6414%2042.8282%2049.2984C42.632%2048.9526%2042.2034%2048.8308%2041.8634%2049.0166L40.1792%2049.9218L38.4995%2050.6224C38.3169%2050.6953%2038.121%2050.7534%2037.9224%2050.8155C37.7838%2050.8489%2037.6518%2050.8983%2037.5012%2050.9408C36.0711%2051.435%2034.2445%2051.7425%2032.244%2051.8346C32.0442%2051.8383%2031.8471%2051.8379%2031.654%2051.8403C31.3051%2051.8414%2030.9602%2051.8451%2030.6392%2051.8305L28.9177%2051.6725C28.5476%2051.619%2028.1695%2051.5427%2027.7848%2051.4678C27.5639%2051.4167%2027.3376%2051.3737%2027.1299%2051.3374L26.9529%2051.2987C26.8704%2051.2834%2026.7772%2051.2667%2026.7333%2051.2543L25.3466%2050.8322C22.7651%2049.9789%2020.33%2048.5729%2018.2942%2046.7557C16.1056%2044.7951%2014.3339%2042.2335%2013.1742%2039.3582C12.0276%2036.6013%2011.5988%2033.2792%2011.9716%2030.0076C12.3145%2027.0213%2013.3948%2024.1635%2015.1858%2021.5083C15.3034%2021.3339%2015.421%2021.1596%2015.5212%2021.0196C16.4309%2019.8688%2017.5408%2018.5589%2018.9483%2017.496C19.3367%2017.1525%2019.7862%2016.856%2020.2611%2016.5478C20.4878%2016.4009%2020.7079%2016.2553%2020.8907%2016.1306C21.0974%2016.0048%2021.3188%2015.8831%2021.5348%2015.7694C21.6761%2015.6975%2021.8162%2015.619%2021.9388%2015.5576L22.1002%2015.4646C22.4002%2015.3037%2022.6749%2015.1546%2022.9908%2015.039L24.1186%2014.5715C24.3399%2014.4844%2024.5718%2014.4159%2024.7997%2014.3447C24.953%2014.2982%2025.0982%2014.2635%2025.2635%2014.2078C25.786%2014.0182%2026.3283%2013.9112%2026.9105%2013.7965C27.117%2013.7571%2027.3302%2013.7163%2027.5608%2013.6585C27.7553%2013.611%2027.9737%2013.5969%2028.2082%2013.5762C28.364%2013.5603%2028.5172%2013.5483%2028.6318%2013.5333C28.7876%2013.5173%2028.9342%2013.5066%2029.0927%2013.4867C29.3285%2013.4555%2029.5456%2013.4347%2029.7494%2013.4337C30.0237%2013.44%2030.2994%2013.4357%2030.5777%2013.4274C31.0811%2013.421%2031.5579%2013.4197%2032.0318%2013.4914C34.9664%2013.7352%2037.7144%2014.6085%2040.2052%2016.0868C42.3489%2017.3655%2044.2716%2019.1525%2045.7607%2021.264C47.0255%2023.0628%2047.9756%2025.0528%2048.4928%2027.0393C48.572%2027.3176%2048.6299%2027.5931%2048.6839%2027.8659C48.7154%2028.0428%2048.7563%2028.2145%2048.7892%2028.3636C48.8037%2028.4541%2048.8208%2028.5406%2048.8445%2028.6258C48.8749%2028.7443%2048.8986%2028.864%2048.9116%2028.9651L48.9793%2029.6047C48.9922%2029.7748%2049.0132%2029.9331%2049.0301%2030.0887C49.0668%2030.3268%2049.0889%2030.5608%2049.0964%2030.7561L49.1083%2031.9001C49.1312%2032.3307%2049.089%2032.7116%2049.0522%2033.0673C49.0384%2033.2598%2049.0126%2033.4443%2049.0123%2033.5824C48.9961%2033.6926%2048.9918%2033.7935%2048.9836%2033.8917C48.9753%2034.0072%2048.9724%2034.1148%2048.9414%2034.2554L48.5449%2036.3059C48.3134%2037.8623%2049.3793%2039.3365%2050.9488%2039.5822C52.0417%2039.7601%2053.1536%2039.2819%2053.7711%2038.3664C54.0063%2038.0176%2054.1604%2037.6257%2054.2227%2037.2064L54.5217%2035.2574C54.5514%2035.0756%2054.572%2034.83%2054.5846%2034.5791L54.6028%2034.2338C54.6098%2034.0598%2054.6223%2033.8779%2054.6347%2033.6788C54.6734%2033.1052%2054.7163%2032.4479%2054.6619%2031.8058L54.5867%2030.4289C54.5622%2030.0952%2054.5097%2029.76%2054.4559%2029.4181C54.431%2029.2572%2054.4048%2029.0896%2054.3826%2028.9074L54.2687%2028.104C54.2332%2027.9244%2054.1804%2027.7273%2054.1329%2027.5396L54.0643%2027.2454C54.0195%2027.071%2053.9773%2026.8927%2053.9338%2026.7076C53.8455%2026.3309%2053.7479%2025.9422%2053.613%2025.5571C52.84%2023.0292%2051.5383%2020.5194%2049.8338%2018.2799C47.8544%2015.682%2045.3333%2013.5087%2042.5563%2011.9816Z'%20fill='%234945FF'/%3e%3c/svg%3e",Ol=c.forwardRef(({children:e,small:t=!1,...o},r)=>a.jsxs("div",{role:"alert","aria-live":"assertive",ref:r,...o,children:[a.jsx(Ue,{children:e}),a.jsx(_l,{src:Nl,"aria-hidden":!0,$small:t})]})),Fl=ie`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`,_l=m.img`
  animation: ${Fl} 1s infinite linear;
  will-change: transform;
  ${({$small:e,theme:t})=>e&&`width: ${t.spaces[6]}; height: ${t.spaces[6]};`}
`,Wl=c.forwardRef(({allowCustomValue:e,autocomplete:t,children:o,className:r,clearLabel:n="Clear",creatable:s=!1,creatableDisabled:i=!1,creatableStartIcon:l,createMessage:d=O=>`Create "${O}"`,defaultFilterValue:f,defaultTextValue:u,defaultOpen:w=!1,open:g,onOpenChange:x,disabled:v=!1,hasError:b,id:C,filterValue:$,hasMoreItems:p=!1,isPrintableCharacter:j,loading:y=!1,loadingMessage:S="Loading content...",name:I,noOptionsMessage:R=()=>"No results found",onChange:N,onClear:H,onCreateOption:z,onFilterValueChange:_,onInputChange:L,onTextValueChange:V,onLoadMore:B,placeholder:U="Select or enter a value",required:K=!1,size:G="M",startIcon:Y,textValue:Z,value:te,...Q},se)=>{const[O,ae]=Ce({prop:g,defaultProp:w,onChange:x}),[ee,ue]=Ce({prop:Z,defaultProp:e&&!u?te:u,onChange:V}),[T,W]=Ce({prop:$,defaultProp:f,onChange:_}),X=c.useRef(null),F=c.useRef(null),D=ge(F,se),q=c.useRef(null),le=me=>{H&&!v&&(ue(""),W(""),H(me),F.current.focus())},de=me=>{ae(me)},P=me=>{ue(me)},$e=me=>{W(me)},ye=me=>{L&&L(me)},N1=me=>{N&&N(me)},O1=me=>{B&&p&&!y&&B(me)},R0=()=>{z&&ee&&s!=="visible"?z(ee):z&&s==="visible"&&(z(),ae(!1))},F1=pe(),I0=`intersection-${Ne(F1)}`;ot(X,O1,{selectorToWatch:`#${I0}`,skipWhen:!O});const{error:pt,...st}=fe("Combobox"),_1=!!pt||b,$t=st.id??C,W1=st.name??I,U1=st.required||K;let Ct;return pt?Ct=`${$t}-error`:st.hint&&(Ct=`${$t}-hint`),a.jsxs(ve.Root,{autocomplete:t||(s===!0?"list":"both"),onOpenChange:de,open:O,onTextValueChange:P,textValue:ee,allowCustomValue:!!s||e,disabled:v,required:U1,value:te,onValueChange:N1,filterValue:T,onFilterValueChange:$e,isPrintableCharacter:j,visible:s==="visible",children:[a.jsxs(Ul,{$hasError:_1,$size:G,className:r,children:[a.jsxs(A,{flex:"1",tag:"span",gap:3,children:[Y?a.jsx(A,{flex:"0 0 1.6rem",tag:"span","aria-hidden":!0,children:Y}):null,a.jsx(ql,{placeholder:U,id:$t,"aria-invalid":!!pt,onChange:ye,ref:D,name:W1,"aria-describedby":Ct,...Q})]}),a.jsxs(A,{tag:"span",gap:3,children:[ee&&H?a.jsx(He,{size:"XS",variant:"ghost",onClick:le,"aria-disabled":v,"aria-label":n,label:n,ref:q,children:a.jsx(We,{})}):null,a.jsx(Gl,{children:a.jsx(Le,{fill:"neutral500"})})]})]}),a.jsx(ve.Portal,{children:a.jsx(Kl,{sideOffset:4,children:a.jsxs(ve.Viewport,{ref:X,children:[a.jsxs(Zl,{children:[o,s!==!0&&!y?a.jsx(ve.NoValueFound,{asChild:!0,children:a.jsx(Nt,{$hasHover:!1,children:a.jsx(k,{children:R(ee??"")})})}):null,y?a.jsx(A,{justifyContent:"center",alignItems:"center",paddingTop:2,paddingBottom:2,children:a.jsx(Ol,{small:!0,children:S})}):null,a.jsx(M,{id:I0,width:"100%",height:"1px"})]}),s?a.jsx(Yl,{onPointerUp:R0,onClick:R0,disabled:i,asChild:!0,children:a.jsx(Nt,{children:a.jsxs(A,{gap:2,children:[l&&a.jsx(M,{tag:"span","aria-hidden":!0,display:"inline-flex",children:l}),a.jsx(k,{children:d(ee??"")})]})})}):null]})})})]})}),Ul=m(ve.Trigger)`
  position: relative;
  border: 1px solid ${({theme:e,$hasError:t})=>t?e.colors.danger600:e.colors.neutral200};
  border-radius: ${({theme:e})=>e.borderRadius};
  background: ${({theme:e})=>e.colors.neutral0};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({theme:e})=>e.spaces[4]};

  ${e=>{switch(e.$size){case"S":return E`
          padding-inline-start: ${({theme:t})=>t.spaces[4]};
          padding-inline-end: ${({theme:t})=>t.spaces[3]};
          padding-block: ${({theme:t})=>t.spaces[1]};
        `;default:return E`
          padding-inline-start: ${({theme:t})=>t.spaces[4]};
          padding-inline-end: ${({theme:t})=>t.spaces[3]};
          padding-block: ${({theme:t})=>t.spaces[2]};
        `}}}

  &[data-disabled] {
    color: ${({theme:e})=>e.colors.neutral600};
    background: ${({theme:e})=>e.colors.neutral150};
    cursor: not-allowed;
  }

  /* Required to ensure the below inputFocusStyles are adhered too */
  &:focus-visible {
    outline: none;
  }

  ${({theme:e,$hasError:t})=>Me()({theme:e,$hasError:t})};
`,ql=m(ve.TextInput)`
  width: 100%;
  font-size: 1.4rem;
  line-height: 2.2rem;
  color: ${({theme:e})=>e.colors.neutral800};
  padding: 0;
  border: none;
  background-color: transparent;

  &:focus-visible {
    outline: none;
  }

  &::placeholder {
    color: ${({theme:e})=>e.colors.neutral600};
    opacity: 1;
  }

  &[aria-disabled='true'] {
    cursor: inherit;
  }
`,Gl=m(ve.Icon)`
  border: none;
  background: transparent;
  padding: 0;
  color: ${({theme:e})=>e.colors.neutral600};
  display: flex;

  &[aria-disabled='true'] {
    cursor: inherit;
  }
`,Kl=m(ve.Content)`
  background: ${({theme:e})=>e.colors.neutral0};
  box-shadow: ${({theme:e})=>e.shadows.filterShadow};
  border: 1px solid ${({theme:e})=>e.colors.neutral150};
  border-radius: ${({theme:e})=>e.borderRadius};
  width: var(--radix-combobox-trigger-width);
  /* This is from the design-system figma file. */
  max-height: 15rem;
  z-index: ${({theme:e})=>e.zIndices.popover};

  &:focus-visible {
    outline: ${({theme:e})=>`2px solid ${e.colors.primary600}`};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: no-preference) {
    animation-duration: ${e=>e.theme.motion.timings[200]};

    /* The select can't animate out yet, watch https://github.com/radix-ui/primitives/issues/1893, or take a look and solve it yourself. */
    &[data-state='open'] {
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};

      &[data-side='top'] {
        animation-name: ${ne.slideUpIn};
      }

      &[data-side='bottom'] {
        animation-name: ${ne.slideDownIn};
      }
    }
  }
`,Yl=m(ve.CreateItem)`
  && {
    border-top: 1px solid ${({theme:e})=>e.colors.neutral150};
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    background: ${({theme:e})=>e.colors.neutral0};
    cursor: pointer;
    padding: ${({theme:e})=>e.spaces[1]};
    position: sticky;
    bottom: 0;
    left: 0;
  }
  &&:hover,
  &&[data-highlighted] {
    background: ${({theme:e})=>e.colors.neutral0};
  }
  &&[data-disabled] {
    color: ${({theme:e})=>e.colors.neutral600};
    cursor: not-allowed;
  }
  &&[data-disabled] svg {
    fill: ${({theme:e})=>e.colors.neutral300};
  }
  && > div {
    padding: ${({theme:e})=>e.spaces[2]} ${({theme:e})=>e.spaces[4]};
  }
  && > div:hover,
  &&[data-highlighted] > div {
    background-color: ${({theme:e})=>e.colors.primary100};
    border-radius: ${({theme:e})=>e.borderRadius};
  }
  &&[data-disabled] > div {
    background-color: inherit;
  }
`,Zl=m(vt)`
  padding: ${({theme:e})=>e.spaces[1]};
`,Ql=c.forwardRef(({children:e,value:t,disabled:o,textValue:r,...n},s)=>a.jsx(ve.ComboboxItem,{asChild:!0,value:t,disabled:o,textValue:r,children:a.jsx(Nt,{ref:s,...n,children:a.jsx(ve.ItemText,{asChild:!0,children:a.jsx(k,{children:e})})})})),Nt=m.div`
  width: 100%;
  border: none;
  text-align: left;
  outline-offset: -3px;
  padding: ${({theme:e})=>e.spaces[2]} ${({theme:e})=>e.spaces[4]};
  background-color: ${({theme:e})=>e.colors.neutral0};
  border-radius: ${({theme:e})=>e.borderRadius};
  user-select: none;

  &[data-state='checked'] {
    background-color: ${({theme:e})=>e.colors.primary100};
    color: ${({theme:e})=>e.colors.primary600};
    font-weight: bold;
  }

  &:hover,
  &[data-highlighted] {
    outline: none;
    background-color: ${({theme:e,$hasHover:t=!0})=>t?e.colors.primary100:e.colors.neutral0};
  }

  &[data-highlighted] {
    color: ${({theme:e})=>e.colors.primary600};
    font-weight: bold;
  }
`,x1=(e,t)=>`${e}${Math.floor(t*255).toString(16).padStart(2,"0")}`,Xl=ma,Jl=c.forwardRef((e,t)=>a.jsx(wo,{...e,asChild:!0,ref:t})),Pl=c.forwardRef((e,t)=>a.jsx(vo,{children:a.jsx(ed,{children:a.jsx(td,{ref:t,...e})})})),ed=m(bo)`
  background: ${e=>x1(e.theme.colors.neutral800,.2)};
  position: fixed;
  inset: 0;
  z-index: ${e=>e.theme.zIndices.overlay};
  will-change: opacity;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${ne.overlayFadeIn} ${e=>e.theme.motion.timings[200]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`,td=m(po)`
  max-width: 42rem;
  height: min-content;
  width: 100%;
  overflow: hidden;
  margin: 0 auto;
  display: flex;
  flex-direction: column;

  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  border-radius: ${e=>e.theme.borderRadius};
  background-color: ${e=>e.theme.colors.neutral0};
  box-shadow: ${e=>e.theme.shadows.popupShadow};
  z-index: ${e=>e.theme.zIndices.modal};

  @media (prefers-reduced-motion: no-preference) {
    &[data-state='open'] {
      animation-duration: ${e=>e.theme.motion.timings[200]};
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};
      animation-name: ${ne.modalPopIn};
    }

    &[data-state='closed'] {
      animation-duration: ${e=>e.theme.motion.timings[120]};
      animation-timing-function: ${e=>e.theme.motion.easings.easeOutQuad};
      animation-name: ${ne.modalPopOut};
    }
  }
`,nd=c.forwardRef(({children:e,...t},o)=>a.jsx($o,{asChild:!0,children:a.jsx(od,{tag:"h2",variant:"beta",ref:o,padding:6,fontWeight:"bold",...t,children:e})})),od=m(k)`
  display: flex;
  justify-content: center;
  border-bottom: solid 1px ${e=>e.theme.colors.neutral150};
`,ad=c.forwardRef(({children:e,icon:t,...o},r)=>a.jsx(A,{ref:r,gap:2,direction:"column",paddingTop:8,paddingBottom:8,paddingLeft:6,paddingRight:6,...o,children:typeof e=="string"?a.jsxs(a.Fragment,{children:[t?c.cloneElement(t,{width:24,height:24}):null,a.jsx(w1,{children:e})]}):e})),w1=c.forwardRef((e,t)=>a.jsx(Co,{asChild:!0,children:a.jsx(k,{ref:t,variant:"omega",...e,tag:"p"})})),rd=c.forwardRef((e,t)=>a.jsx(sd,{ref:t,gap:2,padding:4,justifyContent:"space-between",...e,tag:"footer"})),sd=m(A)`
  border-top: solid 1px ${e=>e.theme.colors.neutral150};
  flex: 1;
`,id=c.forwardRef((e,t)=>a.jsx(jo,{...e,asChild:!0,ref:t})),cd=c.forwardRef((e,t)=>a.jsx(yo,{...e,asChild:!0,ref:t})),Ah=Object.freeze(Object.defineProperty({__proto__:null,Action:cd,Body:ad,Cancel:id,Content:Pl,Description:w1,Footer:rd,Header:nd,Root:Xl,Trigger:Jl},Symbol.toStringTag,{value:"Module"}));function Re(e,t){const o=c.useRef(null);return t&&o.current&&ld(t,o.current)&&(t=o.current),o.current=t??null,c.useMemo(()=>new da(e,t),[e,t])}function ld(e,t){if(e===t)return!0;const o=Object.keys(e),r=Object.keys(t);if(o.length!==r.length)return!1;for(const n of o)if(t[n]!==e[n])return!1;return!0}const C0={Log:"live-region-log",Status:"live-region-status",Alert:"live-region-alert"},O0=e=>{const t=document.querySelector(`#${C0.Log}`);t&&(t.innerText=e)},F0=e=>{const t=document.querySelector(`#${C0.Status}`);t&&(t.innerText=e)},_0=e=>{const t=document.querySelector(`#${C0.Alert}`);t&&(t.innerText=e)},Mh=()=>(c.useEffect(()=>()=>{O0(""),_0(""),F0("")},[]),{notifyLog:O0,notifyAlert:_0,notifyStatus:F0});So`
${E`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
  }

  html {
    /* Sets 1rem === 10px */
    font-size: 62.5%;
  }

  body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    color: ${({theme:e})=>e.colors.neutral800};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  img,
  picture,
  video,
  canvas {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    padding: 0;
    font: inherit;
  }

  button {
    border: unset;
    background: unset;
    padding: unset;
    margin: unset;
  }

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
    font: unset;
  }

  #root {
    isolation: isolate;
  }

  ol,
  ul {
    list-style: none;
    padding: unset;
    margin: unset;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  *:focus-visible {
    outline: 2px solid ${({theme:e})=>e.colors.primary600};
    outline-offset: 2px;
  }

  *:has(> :disabled:not(button)) {
    cursor: not-allowed !important;
  }

  [aria-disabled='true']:not(button) {
    cursor: not-allowed !important;
  }

  /* Focusing the button with a mouse, touch, or stylus will show a subtle drop shadow. */
  *:focus:not(:focus-visible) {
    outline: none;
  }

  .lock-body-scroll {
    height: 100vh;
    overflow-y: hidden;
  }
`}
`;const W0="en-EN",dd=()=>typeof navigator>"u"?W0:navigator.language?navigator.language:W0,[Th,bt]=tt("StrapiDesignSystem",{locale:dd()}),hd=ha,v1=c.forwardRef(({container:e=globalThis?.document?.body,...t},o)=>e?Fe.createPortal(a.jsx(M,{ref:o,...t}),e):null);v1.displayName="Portal";const ud=c.forwardRef(({onClear:e,clearLabel:t="Clear",startIcon:o,disabled:r,hasError:n,children:s,id:i,size:l="M",withTags:d,...f},u)=>{const w=c.useRef(null),g=b=>{e&&!r&&(e(b),w.current.focus())},{labelNode:x}=fe("SelectTrigger"),v=ge(w,u);return a.jsx(be.Trigger,{asChild:!0,children:a.jsxs(gd,{"aria-disabled":r,$hasError:n,ref:v,alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden",hasRadius:!0,background:r?"neutral150":"neutral0",gap:4,cursor:"default","aria-labelledby":x?`${i}-label`:void 0,$size:l,$withTags:d,...f,children:[a.jsxs(A,{flex:"1",tag:"span",gap:3,children:[o&&a.jsx(A,{tag:"span","aria-hidden":!0,children:o}),s]}),a.jsxs(A,{tag:"span",gap:3,children:[e?a.jsx(He,{size:"XS",variant:"ghost",onClick:g,"aria-disabled":r,"aria-label":t,label:t,children:a.jsx(We,{})}):null,a.jsx(fd,{children:a.jsx(Le,{})})]})]})})}),gd=m(A)`
  border: 1px solid ${({theme:e,$hasError:t})=>t?e.colors.danger600:e.colors.neutral200};
  ${e=>{switch(e.$size){case"S":return E`
          padding-block: ${e.theme.spaces[1]};
          padding-inline-start: ${e.$withTags?e.theme.spaces[1]:e.theme.spaces[4]};
          padding-inline-end: ${e.theme.spaces[3]};
        `;default:return E`
          padding-block: ${e.$withTags?"0.3rem":e.theme.spaces[2]};
          padding-inline-start: ${e.$withTags?e.theme.spaces[1]:e.theme.spaces[4]};
          padding-inline-end: ${e.theme.spaces[3]};
        `}}}
  cursor: pointer;

  &[aria-disabled='true'] {
    color: ${e=>e.theme.colors.neutral500};
  }

  /* Required to ensure the below inputFocusStyles are adhered too */
  &:focus-visible {
    outline: none;
  }

  ${({theme:e,$hasError:t})=>Me()({theme:e,$hasError:t})};
`,fd=m(be.Icon)`
  display: flex;
  & > svg {
    fill: ${({theme:e})=>e.colors.neutral500};
  }
`,md=c.forwardRef(({children:e,placeholder:t,...o},r)=>a.jsx(xd,{ref:r,ellipsis:!0,...o,children:a.jsx(wd,{placeholder:t,children:e})})),xd=m(k)`
  flex: 1;
  font-size: 1.4rem;
  line-height: 2.2rem;
  min-height: 2.2rem;
`,wd=m(be.Value)`
  display: flex;
  gap: ${({theme:e})=>e.spaces[1]};
  flex-wrap: wrap;
`,vd=c.forwardRef((e,t)=>a.jsx(bd,{ref:t,...e,children:a.jsx(vt,{children:e.children})})),bd=m(be.Content)`
  background: ${({theme:e})=>e.colors.neutral0};
  box-shadow: ${({theme:e})=>e.shadows.filterShadow};
  border: 1px solid ${({theme:e})=>e.colors.neutral150};
  border-radius: ${({theme:e})=>e.borderRadius};
  min-width: var(--radix-select-trigger-width);
  max-height: 15.6rem;
  z-index: ${({theme:e})=>e.zIndices.popover};

  @media (prefers-reduced-motion: no-preference) {
    animation-duration: ${e=>e.theme.motion.timings[200]};

    /* The select can't animate out yet, watch https://github.com/radix-ui/primitives/issues/1893, or take a look and solve it yourself. */
    &[data-state='open'] {
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};

      &[data-side='top'] {
        animation-name: ${ne.slideUpIn};
      }

      &[data-side='bottom'] {
        animation-name: ${ne.slideDownIn};
      }
    }
  }
`,pd=m(be.Viewport)`
  padding: ${({theme:e})=>e.spaces[1]};
`,$d=c.forwardRef((e,t)=>a.jsx(jd,{ref:t,...e})),Cd=E`
  width: 100%;
  border: none;
  text-align: left;
  outline-offset: -3px;
  border-radius: ${e=>e.theme.borderRadius};
  padding: ${e=>`${e.theme.spaces[2]} ${e.theme.spaces[4]}`};
  padding-left: ${({theme:e})=>e.spaces[4]};
  background-color: ${({theme:e})=>e.colors.neutral0};
  display: flex;
  align-items: center;
  gap: ${({theme:e})=>e.spaces[2]};
  white-space: nowrap;
  user-select: none;
  color: ${({theme:e})=>e.colors.neutral800};

  &:focus-visible {
    outline: none;
    background-color: ${({theme:e})=>e.colors.primary100};
    cursor: pointer;
  }
`,jd=m(be.Item)`
  ${Cd}

  &:hover {
    background-color: ${({theme:e})=>e.colors.primary100};
    cursor: pointer;
  }
`,b1=be.Root,p1=ud,$1=md,C1=be.Portal,j1=vd,y1=pd,j0=$d,S1=be.ItemIndicator,R1=be.ItemText,yd=be.Group,U0=c.forwardRef(({children:e,clearLabel:t="Clear",customizeContent:o,disabled:r,hasError:n,id:s,name:i,onChange:l,onClear:d,onCloseAutoFocus:f,onReachEnd:u,placeholder:w,required:g,size:x,startIcon:v,value:b,...C},$)=>{const[p,j]=c.useState(),[y,S]=c.useState(!1),I=Q=>{S(Q)},R=Q=>{d&&d(Q),l||j("")},N=Q=>{l?l(typeof b=="number"?Number(Q):Q):j(Q)},H=c.useRef(null),z=pe(),_=`intersection-${Ne(z)}`;ot(H,Q=>{u&&u(Q)},{selectorToWatch:`#${_}`,skipWhen:!y});const{error:V,required:B,...U}=fe("SingleSelect"),K=!!V||n,G=U.id??s,Y=U.name??i;let Z;V?Z=`${G}-error`:U.hint&&(Z=`${G}-hint`);const te=(typeof b<"u"&&b!==null?b.toString():p)??"";return a.jsxs(b1,{onOpenChange:I,disabled:r,required:B??g,onValueChange:N,value:te,...C,children:[a.jsx(p1,{ref:$,id:G,name:Y,startIcon:v,hasError:K,disabled:r,clearLabel:t,onClear:te&&d?R:void 0,"aria-label":C["aria-label"],"aria-describedby":Z??C["aria-describedby"],size:x,children:a.jsx($1,{placeholder:w,textColor:te?"neutral800":"neutral600",children:te&&o?o(te):void 0})}),a.jsx(C1,{children:a.jsx(j1,{position:"popper",sideOffset:4,onCloseAutoFocus:f,children:a.jsxs(y1,{ref:H,children:[e,a.jsx(M,{id:_,width:"100%",height:"1px"})]})})})]})}),q0=c.forwardRef(({value:e,startIcon:t,children:o,...r},n)=>a.jsxs(j0,{ref:n,value:e.toString(),...r,children:[t&&a.jsx(A,{tag:"span","aria-hidden":!0,children:t}),a.jsx(k,{lineHeight:"20px",width:"100%",children:a.jsx(R1,{children:o})})]})),Sd=200,G0=15,[Rd,qe]=tt("DatePicker"),Id=c.forwardRef(({calendarLabel:e,className:t,initialDate:o,locale:r,maxDate:n,minDate:s,monthSelectLabel:i="Month",onChange:l,value:d,yearSelectLabel:f="Year",hasError:u,id:w,name:g,disabled:x=!1,required:v=!1,onClear:b,clearLabel:C="Clear",size:$="M",...p},j)=>{const y=It(),S=bt("DatePicker"),I=r??S.locale,R=Re(I,{day:"2-digit",month:"2-digit",year:"numeric"}),[N,H]=c.useState(!1),[z,_]=c.useState(null),[L,V]=c.useState(null),[B,U]=c.useState(null),[K,G]=c.useState(),[Y,Z]=Ce({defaultProp:o?Te(o):void 0,prop:d?Te(d):void 0,onChange(P){l&&l(P?.toDate(y))}}),[te,Q]=c.useMemo(()=>{const P=o?Te(o):Ut("UTC"),$e=s?Te(s):P.set({day:1,month:1,year:P.year-Sd});let ye=n?Te(n):P.set({day:31,month:12,year:P.year+G0});return ye.compare($e)<0&&(ye=$e.set({day:31,month:12,year:$e.year+G0})),[$e,ye]},[s,n,o]),[se,O]=c.useState(Ad({currentValue:Y,minDate:te,maxDate:Q})),ae=pe(),ee=c.useRef(null),ue=P=>{b&&!x&&(G(""),Z(void 0),b(P),L?.focus())},T=c.useCallback(P=>{P&&Y&&O(Y),H(P)},[Y]);Oe(()=>{if(d){const P=Te(d);G(R.format(P.toDate(y))),O(P)}else G("")},[d,R,y]),Oe(()=>{if(o&&K===void 0){const P=Te(o);G(R.format(P.toDate(y)))}},[o,K,R,y]);const{error:W,...X}=fe("Combobox"),F=!!W||u,D=X.id??w,q=X.name??g,le=X.required||v;let de;return W?de=`${D}-error`:X.hint&&(de=`${D}-hint`),a.jsxs(Rd,{calendarDate:se,content:B,contentId:ae,disabled:x,locale:I,minDate:te,maxDate:Q,open:N,onCalendarDateChange:O,onContentChange:U,onOpenChange:T,onTextInputChange:V,onTextValueChange:G,onTriggerChange:_,onValueChange:Z,onClear:b,required:le,textInput:L,textValue:K,timeZone:y,trigger:z,value:Y,children:[a.jsxs(Td,{className:t,hasError:F,size:$,children:[a.jsx(Wr,{fill:"neutral500","aria-hidden":!0}),a.jsx(Ld,{ref:j,"aria-describedby":de,id:D,name:q,...p}),K&&b?a.jsx(He,{size:"XS",variant:"ghost",onClick:ue,"aria-disabled":x,"aria-label":C,label:C,ref:ee,children:a.jsx(We,{})}):null]}),a.jsx(v1,{children:a.jsx(zd,{label:e,children:a.jsx(_d,{monthSelectLabel:i,yearSelectLabel:f})})})]})}),K0=e=>!!e.match(/^[^a-zA-Z]*$/),Ad=({currentValue:e,minDate:t,maxDate:o})=>{const r=Ut("UTC");return e||(At(t,r)===t&&Mt(o,r)===o?r:At(t,r)===r?t:Mt(o,r)===r?o:r)},Md="DatePickerTrigger",Td=c.forwardRef(({hasError:e,size:t,...o},r)=>{const n=qe(Md),s=ge(r,l=>n.onTriggerChange(l)),i=()=>{n.disabled||n.onOpenChange(!0)};return a.jsx(Ft,{asChild:!0,trapped:n.open,onMountAutoFocus:l=>{l.preventDefault()},onUnmountAutoFocus:l=>{document.getSelection()?.empty(),l.preventDefault()},children:a.jsx(Vd,{ref:s,$hasError:e,$size:t,$hasOnClear:!!n.onClear,...o,hasRadius:!0,gap:3,overflow:"hidden",background:n.disabled?"neutral150":"neutral0",onClick:Ve(o.onClick,()=>{n.textInput?.focus()}),onPointerDown:Ve(o.onPointerDown,l=>{const d=l.target;d.hasPointerCapture(l.pointerId)&&d.releasePointerCapture(l.pointerId),(d.closest("button")??d.closest("div"))===l.currentTarget&&l.button===0&&l.ctrlKey===!1&&(i(),n.textInput?.focus())})})})}),Vd=m(A)`
  min-width: ${({$hasOnClear:e})=>e?"160px":"130px"};
  border: 1px solid ${({theme:e,$hasError:t})=>t?e.colors.danger600:e.colors.neutral200};
  ${e=>{switch(e.$size){case"S":return E`
          padding-block: ${e.theme.spaces[1]};
          padding-inline: ${e.theme.spaces[3]};
        `;default:return E`
          padding-block: ${e.theme.spaces[2]};
          padding-inline: ${e.theme.spaces[3]};
        `}}}

  & > svg {
    flex: 1 0 auto;
  }

  &[data-disabled] {
    color: ${({theme:e})=>e.colors.neutral600};
    background: ${({theme:e})=>e.colors.neutral150};
    cursor: not-allowed;
  }

  /* Required to ensure the below inputFocusStyles are adhered too */
  &:focus-visible {
    outline: none;
  }

  ${({theme:e,$hasError:t})=>Me()({theme:e,$hasError:t})};
`,Ed="DatePickerTextInput",Ld=c.forwardRef(({placeholder:e,...t},o)=>{const r=qe(Ed),{onTextValueChange:n,textValue:s,onTextInputChange:i,onOpenChange:l,disabled:d,locale:f}=r,u=ge(o,$=>i($)),w=()=>{d||l(!0)},g=Re(f,{year:"numeric",month:"2-digit",day:"2-digit"}),[x,v,b]=c.useMemo(()=>{const $=g.formatToParts(new Date),p=$.filter(S=>S.type==="year"||S.type==="month"||S.type==="day"),j=p.map(S=>{switch(S.type){case"day":return"DD";case"month":return"MM";case"year":return"YYYY";default:return""}}),y=$.find(S=>S.type==="literal")?.value??"";return[j,y,p]},[g]),C=x.map($=>`\\d{${$.length}}`).join(`\\${v}`);return a.jsx(Bd,{role:"combobox",type:"text",inputMode:"numeric",ref:u,"aria-autocomplete":"none","aria-controls":r.contentId,"aria-disabled":r.disabled,"aria-expanded":r.open,"aria-required":r.required,"aria-haspopup":"dialog","data-state":r.open?"open":"closed",disabled:d,"data-disabled":d?"":void 0,pattern:C,placeholder:e??x.join(v),...t,value:s??"",onBlur:Ve(t.onBlur,()=>{if(!r.textValue){r.onValueChange(void 0);return}r.onTextValueChange(g.format(r.calendarDate.toDate(r.timeZone))),r.onValueChange(r.calendarDate)}),onChange:Ve(t.onChange,$=>{if(K0($.target.value)){const p=$.target.value.split(v),[j,y,S]=b.map((V,B)=>{const U=p[B];return{...V,value:U}}).sort((V,B)=>V.type==="year"?1:B.type==="year"?-1:V.type==="month"?1:B.type==="month"?-1:0).map(V=>V.value),I=r.calendarDate.year;let R=r.calendarDate.year;if(S){const V=S.length===1?`0${S}`:S;R=S.length<3?Number(`${I}`.slice(0,4-V.length)+V):Number(V)}S&&S.length<3&&R>r.maxDate.year&&(R-=100);const N=r.calendarDate.set({year:R}),H=N.calendar.getMonthsInYear(N),z=N.set({month:y&&Number(y)<=H?Number(y):void 0}),_=z.calendar.getDaysInMonth(z),L=z.set({day:j&&Number(j)<=_?Number(j):void 0});r.onCalendarDateChange(Hd(L,r.minDate,r.maxDate)),r.onTextValueChange($.target.value)}}),onKeyDown:Ve(t.onKeyDown,$=>{if(!r.open&&(K0($.key)||["ArrowDown","Backspace"].includes($.key)))w();else if(["Tab"].includes($.key)&&r.open)$.preventDefault();else if(["Escape"].includes($.key))r.open?r.onOpenChange(!1):(r.onValueChange(void 0),r.onTextValueChange("")),$.preventDefault();else if(r.open&&["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes($.key))switch($.preventDefault(),$.key){case"ArrowDown":{const p=r.calendarDate.add({weeks:1});if(r.maxDate&&p.compare(r.maxDate)>0)return;r.onCalendarDateChange(p);return}case"ArrowRight":{const p=r.calendarDate.add({days:1});if(r.maxDate&&p.compare(r.maxDate)>0)return;r.onCalendarDateChange(p);return}case"ArrowUp":{const p=r.calendarDate.subtract({weeks:1});if(r.minDate&&p.compare(r.minDate)<0)return;r.onCalendarDateChange(p);return}case"ArrowLeft":{const p=r.calendarDate.subtract({days:1});if(r.minDate&&p.compare(r.minDate)<0)return;r.onCalendarDateChange(p)}}else r.open&&["Enter"].includes($.key)&&($.preventDefault(),n(g.format(r.calendarDate.toDate(r.timeZone))),r.onValueChange(r.calendarDate),r.onOpenChange(!1))})})});function Hd(e,t,o){return t&&(e=Mt(e,t)),o&&(e=At(e,o)),e}const Bd=m.input`
  width: 100%;
  font-size: 1.4rem;
  line-height: 2.2rem;
  color: ${({theme:e})=>e.colors.neutral800};
  border: none;
  background-color: transparent;

  &:focus-visible {
    outline: none;
  }

  &::placeholder {
    color: ${({theme:e})=>e.colors.neutral600};
    opacity: 1;
  }

  &[aria-disabled='true'] {
    cursor: inherit;
  }
`,Dd="DatePickerContent",zd=c.forwardRef((e,t)=>{const[o,r]=c.useState(),n=qe(Dd);if(Oe(()=>{r(new DocumentFragment)},[]),!n.open){const s=o;return s?Fe.createPortal(a.jsx("div",{children:e.children}),s):null}return a.jsx(Nd,{...e,ref:t})}),kd="DatePickerContent",Nd=c.forwardRef((e,t)=>{const{label:o="Choose date",...r}=e,{onOpenChange:n,...s}=qe(kd),{x:i,y:l,refs:d,strategy:f,placement:u}=Ro({strategy:"fixed",placement:"bottom-start",middleware:[Io({mainAxis:4}),Ao(),Mo()],elements:{reference:s.trigger},whileElementsMounted:To});c.useEffect(()=>{const g=()=>{n(!1)};return window.addEventListener("blur",g),window.addEventListener("resize",g),()=>{window.removeEventListener("blur",g),window.removeEventListener("resize",g)}},[n]);const w=ge(t,g=>s.onContentChange(g),d.setFloating);return _t(),a.jsx(Wt,{allowPinchZoom:!0,children:a.jsx(hd,{asChild:!0,onFocusOutside:g=>{g.preventDefault()},onDismiss:()=>{n(!1)},children:a.jsx(Od,{ref:w,"data-state":s.open?"open":"closed","data-side":u.includes("top")?"top":"bottom",onContextMenu:g=>g.preventDefault(),id:s.contentId,role:"dialog","aria-modal":"true","aria-label":o,style:{left:i,top:l,position:f},hasRadius:!0,background:"neutral0",padding:1,...r})})})}),Od=m(M)`
  box-shadow: ${({theme:e})=>e.shadows.filterShadow};
  z-index: ${({theme:e})=>e.zIndices.popover};
  border: 1px solid ${({theme:e})=>e.colors.neutral150};

  @media (prefers-reduced-motion: no-preference) {
    animation-duration: ${e=>e.theme.motion.timings[200]};

    &[data-state='open'] {
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};

      &[data-side='top'] {
        animation-name: ${ne.slideUpIn};
      }

      &[data-side='bottom'] {
        animation-name: ${ne.slideDownIn};
      }
    }
  }
`,Fd="DatePickerCalendar",_d=c.forwardRef(({monthSelectLabel:e,yearSelectLabel:t,...o},r)=>{const{locale:n,timeZone:s,minDate:i,maxDate:l,calendarDate:d,onCalendarDateChange:f}=qe(Fd),u=Vo(d),w=c.useMemo(()=>{const j=i.year,y=l.year;return[...Array(y-j+1).keys()].map(S=>(j+S).toString())},[i,l]),g=Re(n,{month:"long"}),x=c.useMemo(()=>[...Array(d.calendar.getMonthsInYear(d)).keys()].map(j=>g.format(d.set({month:j+1}).toDate(s))),[d,g,s]),v=Re(n,{weekday:"short"}),b=c.useMemo(()=>{const j=hn(Ut(s),n);return[...new Array(7).keys()].map(y=>{const I=j.add({days:y}).toDate(s);return v.format(I)})},[s,n,v]),C=j=>{if(typeof j=="number")return;const y=d.set({month:x.indexOf(j)+1});f(y)},$=j=>{if(typeof j=="number")return;const y=d.set({year:parseInt(j,10)});f(y)},p=Wd(u,n);return a.jsxs(A,{ref:r,direction:"column",alignItems:"stretch",padding:4,...o,children:[a.jsxs(Ud,{justifyContent:"flex-start",paddingBottom:4,paddingLeft:2,paddingRight:2,gap:2,children:[a.jsx(Be,{children:a.jsx(U0,{"aria-label":e,value:x[d.month-1],onChange:C,children:x.map(j=>a.jsx(q0,{value:j,children:j},j))})}),a.jsx(Be,{children:a.jsx(U0,{value:d.year.toString(),"aria-label":t,onChange:$,children:w.map(j=>a.jsx(q0,{value:j,children:j},j))})})]}),a.jsxs("table",{role:"grid",children:[a.jsx("thead",{"aria-hidden":!0,children:a.jsx("tr",{"aria-rowindex":0,children:b.map((j,y)=>a.jsx(qd,{"aria-colindex":y,children:j},j))})}),a.jsx("tbody",{children:[...new Array(6).keys()].map(j=>a.jsx("tr",{"aria-rowindex":j+2,children:p(j).map((y,S)=>y?a.jsx(Yd,{"aria-colindex":S+1,date:y,startDate:u,disabled:i.compare(y)>0||y.compare(l)>0},y.toString()):a.jsx(I1,{"aria-colindex":S+1},S+1))},j))})]})]})}),Wd=(e,t)=>o=>{let r=e.add({weeks:o});const n=[];r=hn(r,t);const s=Eo(r,t);for(let i=0;i<s;i++)n.push(null);for(;n.length<7;){n.push(r);const i=r.add({days:1});if(un(r,i))break;r=i}for(;n.length<7;)n.push(null);return n},Ud=m(A)`
  div[role='combobox'] {
    border: 1px solid transparent;
    background: transparent;
    font-weight: ${e=>e.theme.fontWeights.bold};

    svg {
      fill: ${({theme:e})=>e.colors.neutral500};
    }

    &:hover {
      background-color: ${({theme:e})=>e.colors.neutral100};
    }
  }
`,qd=c.forwardRef(({children:e,...t},o)=>a.jsx(Gd,{tag:"th",role:"gridcell",ref:o,...t,height:"2.4rem",width:"3.2rem",children:a.jsx(k,{variant:"pi",fontWeight:"bold",color:"neutral800",children:e.slice(0,2)})})),Gd=m(M)`
  border-radius: ${({theme:e})=>e.borderRadius};
  text-transform: capitalize;
`,Kd="DatePickerCalendarCell",Yd=c.forwardRef(({date:e,startDate:t,disabled:o,...r},n)=>{const{timeZone:s,locale:i,calendarDate:l,onValueChange:d,onOpenChange:f,onTextValueChange:u,onCalendarDateChange:w}=qe(Kd),g=un(l,e),x=Re(i,{weekday:"long",day:"numeric",month:"long",year:"numeric"}),v=c.useMemo(()=>x.format(e.toDate(s)),[x,e,s]),b=Re(i,{day:"numeric",calendar:e.calendar.identifier}),C=c.useMemo(()=>b.formatToParts(e.toDate(s)).find(S=>S.type==="day").value,[b,e,s]),$=Re(i,{day:"2-digit",month:"2-digit",year:"numeric"}),p=Lo(t),j=e.compare(t)<0||e.compare(p)>0;let y="neutral900";return g?y="primary600":j&&(y="neutral600"),a.jsx(I1,{tag:"td",role:"gridcell",ref:n,"aria-selected":g,...r,hasRadius:!0,"aria-label":v,tabIndex:g?0:-1,background:g?"primary100":"neutral0",cursor:"pointer",onPointerDown:Ve(r.onPointerDown,S=>{S.preventDefault(),w(e),d(e),u($.format(e.toDate(s))),f(!1)}),"aria-disabled":o,children:a.jsx(k,{variant:"pi",textColor:y,children:C})})}),I1=m(M)`
  text-align: center;
  padding: 0.7rem;
  // Trick to prevent the outline from overflowing because of the general outline-offset
  outline-offset: -2px !important;
  &[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.5;
  }

  &[aria-disabled='false'] {
    &:hover {
      background: ${({theme:e})=>e.colors.primary100};
      color: ${({theme:e})=>e.colors.primary600};
    }
  }
`,Te=e=>{const t=e.toISOString(),o=Ho(t,"UTC");return Bo(o)},yt=e=>!!e.match(/^[^a-zA-Z]*$/);function Zd(e=""){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}const Qd=m(Wl)`
  min-width: ${({onClear:e})=>e?"160px":"130px"};
`,Xd=c.forwardRef(({step:e=15,value:t,defaultValue:o,onChange:r,...n},s)=>{const i=bt("TimePicker"),[l,d]=c.useState(""),[f,u]=Ce({prop:t,defaultProp:o,onChange:r}),w=Re(i.locale,{hour:"2-digit",minute:"2-digit",hour12:!1}),g=c.useMemo(()=>{const y=w.formatToParts(new Date),{value:S}=y.find(I=>I.type==="literal");return S},[w]),x=c.useMemo(()=>{const y=60/e;return[...Array(24).keys()].flatMap(S=>[...Array(y).keys()].map(I=>w.format(new Date(0,0,0,S,I*e))))},[e,w]),v=y=>{(!y||yt(y))&&d(y)},b=y=>{const[S,I]=y.split(g);if(!S&&!I)return;const R=Number(S??"0"),N=Number(I??"0");if(!(R>23||N>59))return w.format(new Date(0,0,0,R,N))},C=y=>{const S=b(y.target.value);S?(d(S),u(S)):d(f)},$=y=>{if(typeof y<"u"){const S=b(y);u(S)}else u(y)};c.useEffect(()=>{const y=typeof t>"u"?"":t;yt(y)&&d(y)},[t,d]);const j=`\\d{2}${Zd(g)}\\d{2}`;return a.jsx(Qd,{...n,ref:s,value:f,onChange:$,isPrintableCharacter:yt,allowCustomValue:!0,placeholder:`--${g}--`,autocomplete:"none",startIcon:a.jsx(hs,{fill:"neutral500"}),inputMode:"numeric",pattern:j,textValue:l,onTextValueChange:v,onBlur:C,children:x.map(y=>a.jsx(Ql,{value:y,children:y},y))})});c.forwardRef(({clearLabel:e="clear",dateLabel:t="Choose date",timeLabel:o="Choose time",disabled:r=!1,hasError:n,onChange:s,onClear:i,required:l=!1,step:d,value:f,initialDate:u,size:w,...g},x)=>{const v=c.useRef(null),[b,C]=Ce({defaultProp:u?Ge(u,!1):void 0,prop:f?Ge(f,!1):f??void 0,onChange(V){s&&s(V?.toDate(It()))}}),$=bt("DateTimePicker"),p=Re($.locale,{hour:"2-digit",minute:"2-digit",hour12:!1}),j=b?p.format(b.toDate(It())):"",y=V=>{let B=V?Ge(V):void 0;if(!(B&&b&&B.compare(b)===0)){if(j&&B){const[U,K]=j.split(":");B=B.set({hour:parseInt(U,10),minute:parseInt(K,10)})}C(B)}},S=V=>{if(!V)return;const[B,U]=V.split(":"),K=b?b.set({hour:parseInt(B,10),minute:parseInt(U,10)}):Ge(new Date).set({hour:parseInt(B,10),minute:parseInt(U,10)});C(K)},I=V=>{C(void 0),i&&i(V)},R=()=>{const V=b?b.set({hour:0,minute:0}):Ge(new Date);C(V)},N=ge(v,x),{error:H,id:z,labelNode:_}=fe("DateTimePicker"),L=!!H||n;return a.jsxs(A,{"aria-labelledby":_?`${z}-label`:void 0,role:"group",flex:"1",gap:1,wrap:"wrap",children:[a.jsx(Be,{flex:"1",children:a.jsx(Id,{...g,size:w,value:b?.toDate("UTC"),onChange:y,required:l,onClear:i?I:void 0,clearLabel:`${e} date`,disabled:r,ref:N,"aria-label":t})}),a.jsx(Be,{flex:"1",children:a.jsx(Xd,{size:w,hasError:L,value:j,onChange:S,onClear:i&&j!==void 0&&j!=="00:00"?R:void 0,clearLabel:`${e} time`,required:l,disabled:r,step:d,"aria-label":o})})]})});const Ge=(e,t=!0)=>{const o=e.toISOString();let r=Do(o);return t&&(r=r.set({hour:0,minute:0})),zo(r)},Jd=c.forwardRef((e,t)=>a.jsx(Pd,{ref:t,background:"neutral150",...e,"data-orientation":"horizontal",role:"separator",tag:"div"})),Pd=m(M)`
  height: 1px;
  border: none;
  /* If contained in a Flex parent we want to prevent the Divider to shink */
  flex-shrink: 0;
`,e5=m(M)`
  svg {
    height: 8.8rem;
  }
`,Vh=c.forwardRef(({icon:e,content:t,action:o,hasRadius:r=!0,shadow:n="tableShadow"},s)=>a.jsxs(A,{ref:s,alignItems:"center",direction:"column",padding:11,background:"neutral0",hasRadius:r,shadow:n,children:[e?a.jsx(e5,{paddingBottom:6,"aria-hidden":!0,children:e}):null,a.jsx(M,{paddingBottom:4,children:a.jsx(k,{variant:"delta",tag:"p",textAlign:"center",textColor:"neutral600",children:t})}),o]})),A1=gn.define(),M1=gn.define(),t5=fn.mark({attributes:{style:"background-color: yellow; color: black"}}),n5=ko.define({create(){return fn.none},update(e,t){return e=e.map(t.changes),t.effects.forEach(o=>{o.is(A1)?e=e.update({add:o.value,sort:!0}):o.is(M1)&&(e=e.update({filter:o.value}))}),e},provide:e=>No.decorations.from(e)});c.forwardRef(({hasError:e,required:t,id:o,value:r="",disabled:n=!1,onChange:s=()=>null,...i},l)=>{const d=c.useRef(),f=c.useRef(),u=c.useRef(),{error:w,...g}=fe("JsonInput"),x=!!w||e,v=g.id??o,b=g.required||t;let C;w?C=`${v}-error`:g.hint&&(C=`${v}-hint`);const $=H=>{const z=f.current?.doc;if(z){const{text:_,to:L}=z.line(H),V=L-_.trimStart().length;L>V&&u.current?.dispatch({effects:A1.of([t5.range(V,L)])})}},p=()=>{const H=f.current?.doc;if(H){const z=H.length||0;u.current?.dispatch({effects:M1.of((_,L)=>L<=0||_>=z)})}},j=({state:H,view:z})=>{u.current=z,f.current=H,p();const L=xa()(z);L.length&&$(H.doc.lineAt(L[0].from).number)},y=(H,z)=>{j(z),s(H)},S=(H,z)=>{u.current=H,f.current=z,j({view:H,state:z})},{setContainer:I,view:R}=Oo({value:r,onCreateEditor:S,container:d.current,editable:!n,extensions:[Fo(),n5],onChange:y,theme:"dark",basicSetup:{lineNumbers:!0,bracketMatching:!0,closeBrackets:!0,indentOnInput:!0,syntaxHighlighting:!0,highlightSelectionMatches:!0,tabSize:2}}),N=ge(d,I);return c.useImperativeHandle(l,()=>({...R?.dom,focus(){R&&R.focus()},scrollIntoView(H){R&&R.dom.scrollIntoView(H)}}),[R]),a.jsx(o5,{ref:N,$disabled:n,$hasError:x,alignItems:"stretch",fontSize:2,hasRadius:!0,"aria-required":b,id:v,"aria-describedby":C,...i})});const o5=m(A)`
  line-height: ${({theme:e})=>e.lineHeights[2]};

  .cm-editor {
    /** 
     * Hard coded since the color is the same between themes,
     * theme.colors.neutral800 changes between themes 
     */
    background-color: #32324d;
    width: 100%;
    outline: none;
    cursor: ${({$disabled:e})=>e?"not-allowed":"text"};
  }

  .cm-scroller {
    border: 1px solid ${({theme:e,$hasError:t})=>t?e.colors.danger600:e.colors.neutral200};
    /* inputFocusStyle will receive hasError prop */
    ${Me()}
  }

  .cm-editor,
  .cm-scroller {
    border-radius: ${({theme:e})=>e.borderRadius};
  }

  .cm-gutters,
  .cm-activeLineGutter {
    /** 
     * Hard coded since the color is the same between themes,
     * theme.colors.neutral700 changes between themes 
     */
    background-color: #4a4a6a;
  }
`,Eh=he(({disabled:e,...t},o)=>a.jsx(kt,{ref:o,tag:nt,tabIndex:e?-1:void 0,disabled:e,...t})),a5=m(M)`
  // To prevent global outline on focus visible to force an outline when Main is focused
  &:focus-visible {
    outline: none;
  }
`,Lh=({labelledBy:e="main-content-title",...t})=>a.jsx(a5,{"aria-labelledby":e,tag:"main",id:"main-content",tabIndex:-1,...t});m(M)`
  text-decoration: none;

  &:focus {
    left: ${({theme:e})=>e.spaces[3]};
    top: ${({theme:e})=>e.spaces[3]};
  }
`;const r5=fa,s5=c.forwardRef((e,t)=>a.jsx(_o,{...e,asChild:!0,ref:t})),i5=c.forwardRef((e,t)=>a.jsx(Wo,{children:a.jsx(c5,{children:a.jsx(l5,{ref:t,...e})})})),c5=m(Uo)`
  background: ${e=>x1(e.theme.colors.neutral800,.2)};
  position: fixed;
  inset: 0;
  z-index: ${e=>e.theme.zIndices.overlay};
  will-change: opacity;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${ne.overlayFadeIn} ${e=>e.theme.motion.timings[200]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`,l5=m(qo)`
  max-width: 83rem;
  max-height: 90vh;
  height: auto;
  width: 60%;
  overflow: hidden;
  margin: 0 auto;
  display: flex;
  flex-direction: column;

  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  border-radius: ${e=>e.theme.borderRadius};
  background-color: ${e=>e.theme.colors.neutral0};
  box-shadow: ${e=>e.theme.shadows.popupShadow};
  z-index: ${e=>e.theme.zIndices.modal};

  > form {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  @media (prefers-reduced-motion: no-preference) {
    &[data-state='open'] {
      animation-duration: ${e=>e.theme.motion.timings[200]};
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};
      animation-name: ${ne.modalPopIn};
    }

    &[data-state='closed'] {
      animation-duration: ${e=>e.theme.motion.timings[120]};
      animation-timing-function: ${e=>e.theme.motion.easings.easeOutQuad};
      animation-name: ${ne.modalPopOut};
    }
  }
`,T1=c.forwardRef((e,t)=>a.jsx(Go,{...e,asChild:!0,ref:t})),d5=c.forwardRef(({children:e,closeLabel:t="Close modal",...o},r)=>a.jsxs(h5,{ref:r,padding:4,paddingLeft:5,paddingRight:5,background:"neutral100",justifyContent:"space-between",...o,tag:"header",children:[e,a.jsx(T1,{children:a.jsx(He,{withTooltip:!1,label:t,children:a.jsx(We,{})})})]})),h5=m(A)`
  border-bottom: solid 1px ${e=>e.theme.colors.neutral150};
`,u5=c.forwardRef((e,t)=>a.jsx(Ko,{asChild:!0,children:a.jsx(k,{tag:"h2",variant:"omega",fontWeight:"bold",ref:t,...e})})),g5=c.forwardRef(({children:e,...t},o)=>a.jsx(f5,{ref:o,...t,children:e})),f5=m(vt)`
  padding-inline: ${e=>e.theme.spaces[7]};

  & > div {
    padding-block: ${e=>e.theme.spaces[8]};
    /* Add negative margin and padding to avoid cropping the box shadow when the inputs are focused */
    margin: 0 -2px 0 -2px;
    padding-left: 2px;
    padding-right: 2px;

    & > div {
      // the scroll area component applies a display: table to the child, which we don't want.
      display: block !important;
    }
  }
`,m5=c.forwardRef((e,t)=>a.jsx(x5,{ref:t,padding:4,paddingLeft:5,paddingRight:5,background:"neutral100",justifyContent:"space-between",...e,tag:"footer"})),x5=m(A)`
  border-top: solid 1px ${e=>e.theme.colors.neutral150};
  flex: 1;
`,Hh=Object.freeze(Object.defineProperty({__proto__:null,Body:g5,Close:T1,Content:i5,Footer:m5,Header:d5,Root:r5,Title:u5,Trigger:s5},Symbol.toStringTag,{value:"Module"})),w5="";c.forwardRef(({startAction:e,locale:t,onValueChange:o,value:r,step:n=1,disabled:s=!1,...i},l)=>{const d=bt("NumberInput"),f=t||d.locale,u=c.useRef(new Yo(f,{style:"decimal"})),w=c.useRef(new Zo(f,{maximumFractionDigits:20})),[g,x]=v5({prop(I){const R=String(r);return isNaN(Number(R))||R!==I&&I!==""?I:w.current.format(Number(r))},defaultProp:w5,onChange(I){const R=u.current.parse(I??"");o(isNaN(R)?void 0:R)}}),v=I=>{x(String(I))},b=({target:{value:I}})=>{u.current.isValidPartialNumber(I)&&v(I)},$=(I=>{const R=I.toString();return R.includes(".")?R.split(".")[1].length:0})(n),p=()=>{if(!g){v(n);return}const I=u.current.parse(g),R=isNaN(I)?n:I+n,N=parseFloat(R.toFixed($));v(w.current.format(N))},j=()=>{if(!g){v(-n);return}const I=u.current.parse(g),R=isNaN(I)?-n:I-n,N=parseFloat(R.toFixed($));v(w.current.format(N))},y=I=>{if(!s)switch(I.key){case ce.DOWN:{I.preventDefault(),j();break}case ce.UP:{I.preventDefault(),p();break}}},S=()=>{if(g){const I=u.current.parse(g),R=isNaN(I)?"":w.current.format(I);v(R)}};return a.jsx(wt,{ref:l,startAction:e,disabled:s,type:"text",inputMode:"decimal",onChange:b,onKeyDown:y,onBlur:S,value:g,endAction:a.jsxs(A,{direction:"column",children:[a.jsx(Y0,{disabled:s,"aria-hidden":!0,$reverse:!0,onClick:p,tabIndex:-1,type:"button","data-testid":"ArrowUp",children:a.jsx(Le,{fill:"neutral500"})}),a.jsx(Y0,{disabled:s,"aria-hidden":!0,onClick:j,tabIndex:-1,type:"button","data-testid":"ArrowDown",children:a.jsx(Le,{fill:"neutral500"})})]}),...i})});const Y0=m.button`
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateY(${({$reverse:e})=>e?"-2px":"2px"});
  cursor: ${({disabled:e})=>e?"not-allowed":void 0};
  height: 1.1rem;

  svg {
    width: 1.2rem;
    transform: ${({$reverse:e})=>e?"rotateX(180deg)":void 0};
  }
`;function v5({prop:e,defaultProp:t,onChange:o=()=>{}}){const[r,n]=Pn({defaultProp:t,onChange:o}),s=e!==void 0,i=e instanceof Function?e(r):e,l=s?i:r,d=Qt(o),f=c.useCallback(u=>{if(s){const g=typeof u=="function"?u(i):u;g!==i&&(d(g),n(u))}else n(u)},[s,i,n,d]);return[l,f]}const b5=c.createContext({activePage:1,pageCount:1}),y0=()=>c.useContext(b5);he(({children:e,...t},o)=>{const{activePage:r}=y0(),n=r===1;return a.jsxs(E1,{ref:o,"aria-disabled":n,tabIndex:n?-1:void 0,...t,children:[a.jsx(Ue,{children:e}),a.jsx(Kn,{"aria-hidden":!0})]})});he(({children:e,...t},o)=>{const{activePage:r,pageCount:n}=y0(),s=r===n;return a.jsxs(E1,{ref:o,"aria-disabled":s,tabIndex:s?-1:void 0,...t,children:[a.jsx(Ue,{children:e}),a.jsx(m0,{"aria-hidden":!0})]})});const V1=m(nt)`
  padding: ${({theme:e})=>e.spaces[3]};
  border-radius: ${({theme:e})=>e.borderRadius};
  box-shadow: ${({$active:e,theme:t})=>e?t.shadows.filterShadow:void 0};
  text-decoration: none;
  display: flex;

  ${ft}
`,E1=m(V1)`
  font-size: 1.1rem;

  svg path {
    fill: ${e=>e["aria-disabled"]?e.theme.colors.neutral300:e.theme.colors.neutral600};
  }

  &:focus,
  &:hover {
    svg path {
      fill: ${e=>e["aria-disabled"]?e.theme.colors.neutral300:e.theme.colors.neutral700};
    }
  }

  ${e=>e["aria-disabled"]?`
  pointer-events: none;
    `:void 0}
`;he(({number:e,children:t,...o},r)=>{const{activePage:n}=y0(),s=n===e;return a.jsxs(p5,{ref:r,...o,"aria-current":s,$active:s,children:[a.jsx(Ue,{children:t}),a.jsx(k,{"aria-hidden":!0,fontWeight:s?"bold":void 0,lineHeight:"revert",variant:"pi",children:e})]})});const p5=m(V1)`
  color: ${({theme:e,$active:t})=>t?e.colors.primary700:e.colors.neutral800};
  background: ${({theme:e,$active:t})=>t?e.colors.neutral0:void 0};

  &:hover {
    box-shadow: ${({theme:e})=>e.shadows.filterShadow};
  }
`;c.forwardRef((e,t)=>a.jsx(Qo,{...e,asChild:!0,ref:t}));c.forwardRef((e,t)=>a.jsx(Xo,{children:a.jsx($5,{sideOffset:4,side:"bottom",align:"start",...e,ref:t})}));const $5=m(Jo)`
  box-shadow: ${({theme:e})=>e.shadows.filterShadow};
  z-index: ${({theme:e})=>e.zIndices.popover};
  background-color: ${e=>e.theme.colors.neutral0};
  border: 1px solid ${({theme:e})=>e.colors.neutral150};
  border-radius: ${({theme:e})=>e.borderRadius};

  @media (prefers-reduced-motion: no-preference) {
    animation-duration: ${e=>e.theme.motion.timings[200]};

    &[data-state='open'] {
      animation-timing-function: ${e=>e.theme.motion.easings.authenticMotion};

      &[data-side='top'] {
        animation-name: ${ne.slideUpIn};
      }

      &[data-side='bottom'] {
        animation-name: ${ne.slideDownIn};
      }
    }

    &[data-state='closed'] {
      animation-timing-function: ${e=>e.theme.motion.easings.easeOutQuad};

      &[data-side='top'] {
        animation-name: ${ne.slideUpOut};
      }

      &[data-side='bottom'] {
        animation-name: ${ne.slideDownOut};
      }
    }
  }
`;c.forwardRef(({children:e,intersectionId:t,onReachEnd:o,...r},n)=>{const s=c.useRef(null),i=ge(s,n),l=pe();return ot(s,o??(()=>{}),{selectorToWatch:`#${Ne(l)}`,skipWhen:!t||!o}),a.jsxs(C5,{ref:i,...r,children:[e,t&&o&&a.jsx(M,{id:Ne(l),width:"100%",height:"1px"})]})});const C5=m(vt)`
  height: 20rem;
`;c.forwardRef(({size:e="M",value:t,...o},r)=>a.jsx(j5,{ref:r,$size:e,...o,children:a.jsx(y5,{style:{transform:`translate3D(-${100-(t??0)}%, 0, 0)`}})}));const j5=m(Po)`
  position: relative;
  overflow: hidden;
  width: ${e=>e.$size==="S"?"7.8rem":"10.2rem"};
  height: ${e=>e.$size==="S"?"0.4rem":"0.8rem"};
  background-color: ${e=>e.theme.colors.neutral600};
  border-radius: ${e=>e.theme.borderRadius};

  /* Fix overflow clipping in Safari */
  /* https://gist.github.com/domske/b66047671c780a238b51c51ffde8d3a0 */
  transform: translateZ(0);
`,y5=m(ea)`
  background-color: ${({theme:e})=>e.colors.neutral0};
  border-radius: ${({theme:e})=>e.borderRadius};
  width: 100%;
  height: 100%;

  @media (prefers-reduced-motion: no-preference) {
    transition: transform ${e=>e.theme.motion.timings[320]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`;c.forwardRef((e,t)=>a.jsx(S5,{ref:t,...e}));const S5=m(ta)`
  display: flex;
  flex-direction: column;
  gap: ${e=>e.theme.spaces[3]};
`;c.forwardRef(({children:e,id:t,...o},r)=>{const n=pe(t);return a.jsxs(A,{gap:2,children:[a.jsx(R5,{id:n,ref:r,...o,children:a.jsx(I5,{})}),a.jsx(k,{tag:"label",htmlFor:n,children:e})]})});const R5=m(na)`
  background: ${e=>e.theme.colors.neutral0};
  width: 2rem;
  height: 2rem;
  flex: 0 0 2rem;
  border-radius: 50%;
  border: 1px solid ${e=>e.theme.colors.neutral300};
  position: relative;
  cursor: pointer;
  z-index: 0;

  @media (prefers-reduced-motion: no-preference) {
    transition: border-color ${e=>e.theme.motion.timings[120]}
      ${e=>e.theme.motion.easings.easeOutQuad};
  }

  &[data-state='checked'] {
    border: 1px solid ${e=>e.theme.colors.primary600};
  }

  &[data-disabled] {
    cursor: not-allowed;
    background-color: ${e=>e.theme.colors.neutral200};
  }

  /* increase target size for touch devices https://www.w3.org/WAI/WCAG21/Understanding/target-size.html */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    min-width: 44px;
    min-height: 44px;
  }
`,I5=m(oa)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;

  &[data-state='checked'] {
    @media (prefers-reduced-motion: no-preference) {
      animation: ${ne.popIn} ${e=>e.theme.motion.timings[200]};
    }
  }

  &::after {
    content: '';
    display: block;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: ${e=>e.theme.colors.primary600};
  }
`,A5=e=>{const t=e.querySelector('[tabindex="0"]');t&&t.focus()},L1=c.createContext({rowIndex:0,colIndex:0,setTableValues(){throw new Error("setTableValues must be initialized via the RawTableContext.Provider")}}),M5=()=>c.useContext(L1),T5=c.forwardRef(({colCount:e,rowCount:t,jumpStep:o=3,initialCol:r=0,initialRow:n=0,...s},i)=>{const l=c.useRef(null),d=c.useRef(!1),f=ge(l,i),[u,w]=c.useState(n),[g,x]=c.useState(r),v=c.useCallback(({colIndex:$,rowIndex:p})=>{x($),w(p)},[]);c.useEffect(()=>{d.current&&A5(l.current),d.current||(d.current=!0)},[g,u]);const b=$=>{switch($.key){case ce.RIGHT:{$.preventDefault(),x(p=>p<e-1?p+1:p);break}case ce.LEFT:{$.preventDefault(),x(p=>p>0?p-1:p);break}case ce.UP:{$.preventDefault(),w(p=>p>0?p-1:p);break}case ce.DOWN:{$.preventDefault(),w(p=>p<t-1?p+1:p);break}case ce.HOME:{$.preventDefault(),$.ctrlKey&&w(0),x(0);break}case ce.END:{$.preventDefault(),$.ctrlKey&&w(t-1),x(e-1);break}case ce.PAGE_DOWN:{$.preventDefault(),w(p=>p+o<t?p+o:t-1);break}case ce.PAGE_UP:{$.preventDefault(),w(p=>p-o>0?p-o:0);break}}},C=c.useMemo(()=>({rowIndex:u,colIndex:g,setTableValues:v}),[g,u,v]);return a.jsx(L1.Provider,{value:C,children:a.jsx("table",{role:"grid",ref:f,"aria-rowcount":t,"aria-colcount":e,onKeyDown:b,...s})})}),Ke=(e,t)=>[...e.querySelectorAll('a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])')].filter(n=>!n.hasAttribute("disabled")),St=e=>e.filter(t=>t.tagName==="INPUT"?t.type!=="checkbox"&&t.type!=="radio":!1),H1=c.forwardRef(({coords:e={col:0,row:0},tag:t="td",...o},r)=>{const n=c.useRef(null),s=ge(r,n),{rowIndex:i,colIndex:l,setTableValues:d}=M5(),[f,u]=c.useState(!1),w=v=>{const b=Ke(n.current);if(b.length===0||b.length===1&&St(b).length===0)return;if(b.length>1&&!b.find($=>$.tagName!=="BUTTON")){v.preventDefault();const $=b.findIndex(p=>p===document.activeElement);if(v.key===ce.RIGHT){const p=b[$+1];p&&(v.stopPropagation(),p.focus())}else if(v.key===ce.LEFT){const p=b[$-1];p&&(v.stopPropagation(),p.focus())}return}const C=v.key===ce.ENTER;if(C&&!f)u(!0);else if((v.key===ce.ESCAPE||C)&&f){if(C&&document.activeElement?.tagName==="A")return;u(!1),n.current.focus()}else f&&v.stopPropagation()},g=i===e.row-1&&l===e.col-1;Oe(()=>{const v=Ke(n.current);v.length===0||v.length===1&&St(v).length!==0||v.length>1&&v.find(b=>b.tagName!=="BUTTON")?(n.current.setAttribute("tabIndex",!f&&g?"0":"-1"),v.forEach((b,C)=>{b.setAttribute("tabIndex",f?"0":"-1"),f&&C===0&&b.focus()})):v.forEach(b=>{b.setAttribute("tabIndex",g?"0":"-1")})},[f,g]);const x=c.useCallback(()=>{const v=Ke(n.current);v.length>=1&&(St(v).length!==0||!v.find(b=>b.tagName!=="BUTTON"))&&u(!0),d({rowIndex:e.row-1,colIndex:e.col-1})},[e,d]);return Oe(()=>{const v=n.current;return Ke(v).forEach(C=>{C.addEventListener("focus",x)}),()=>{Ke(v).forEach($=>{$.removeEventListener("focus",x)})}},[x]),a.jsx(M,{role:"gridcell",tag:t,ref:s,onKeyDown:w,...o})}),V5=e=>a.jsx(H1,{...e,tag:"th"}),E5=({children:e,...t})=>{const o=c.Children.toArray(e).map(r=>c.isValidElement(r)?c.cloneElement(r,{"aria-rowindex":1}):r);return a.jsx("thead",{...t,children:o})},L5=({children:e,...t})=>{const o=c.Children.toArray(e).map((r,n)=>c.isValidElement(r)?c.cloneElement(r,{"aria-rowindex":n+2}):r);return a.jsx("tbody",{...t,children:o})},H5=({children:e,...t})=>{const o=c.Children.toArray(e).map((r,n)=>c.isValidElement(r)?c.cloneElement(r,{"aria-colindex":n+1,coords:{col:n+1,row:t["aria-rowindex"]}}):r);return a.jsx(M,{tag:"tr",...t,children:o})},B5=m(We)`
  font-size: 0.5rem;
  path {
    fill: ${({theme:e})=>e.colors.neutral500};
  }
`,B1=m(Ac)`
  font-size: 1rem;
  path {
    fill: ${({theme:e})=>e.colors.neutral500};
  }
`,D5=m.div`
  border-radius: ${({theme:e})=>e.borderRadius};
  border: 1px solid ${({theme:e})=>e.colors.neutral150}

  &:focus-within {
    ${B1} {
      fill: ${({theme:e})=>e.colors.primary600};
    }
  }
`,z5=m(wt)`
  border: 1px solid ${({theme:e})=>e.colors.neutral150}
  height: 16px;
  padding: 0 0 0 8px;
  color: ${({theme:e})=>e.colors.neutral800};
  
  &:hover {
    button {
      cursor: pointer;
    }
  }

  ${Me()}
`;c.forwardRef(({name:e,children:t,value:o="",onClear:r,clearLabel:n="Clear",...s},i)=>{const l=c.useRef(null),d=o.length>0,f=w=>{r(w),l.current.focus()},u=o1(i,l);return a.jsx(D5,{children:a.jsxs(Be,{name:e,children:[a.jsx(Ue,{children:a.jsx($0,{children:t})}),a.jsx(z5,{size:"S",ref:u,value:o,startAction:a.jsx(B1,{"aria-hidden":!0}),endAction:d?a.jsx(He,{onClick:f,onMouseDown:w=>{w.preventDefault()},label:n,size:"XS",variant:"ghost",type:"button",children:a.jsx(B5,{})}):void 0,...s})]})})});const k5=m(M)`
  display: inline-flex;
  border: none;

  & > svg {
    height: 1.2rem;
    width: 1.2rem;
  }

  & > svg path {
    fill: ${({theme:e,...t})=>t["aria-disabled"]?e.colors.neutral600:e.colors.primary600};
  }

  &:hover {
    cursor: ${({$iconAction:e})=>e?"pointer":"initial"};
  }
`,N5=({children:e,icon:t,label:o,disabled:r=!1,onClick:n,...s})=>{const i=l=>{r||!n||n(l)};return a.jsxs(A,{inline:!0,background:r?"neutral200":"primary100",color:r?"neutral700":"primary600",paddingLeft:3,paddingRight:1,borderColor:r?"neutral300":"primary200",hasRadius:!0,height:"3.2rem",...s,children:[a.jsx(O5,{$disabled:r,variant:"pi",fontWeight:"bold",children:e}),a.jsx(k5,{tag:"button",disabled:r,"aria-disabled":r,"aria-label":o,padding:2,onClick:i,$iconAction:!!n,children:t})]})},O5=m(k)`
  color: inherit;
  border-right: 1px solid ${({theme:e,$disabled:t})=>t?e.colors.neutral300:e.colors.primary200};
  padding-right: ${({theme:e})=>e.spaces[2]};
`;c.forwardRef(({children:e,clearLabel:t="Clear",customizeContent:o,disabled:r,hasError:n,id:s,name:i,onChange:l,onClear:d,onCloseAutoFocus:f,onReachEnd:u,placeholder:w,required:g,size:x,startIcon:v,value:b,withTags:C,...$},p)=>{const j=c.useRef(null),[y,S]=c.useState(),[I,R]=c.useState(!1),N=O=>{l?l(O):S(O)},H=O=>()=>{const ae=Array.isArray(b)?b.filter(ee=>ee!==O):(y??[]).filter(ee=>ee!==O);l?l(ae):S(ae)},z=O=>{R(O)},_=pe(),L=`intersection-${Ne(_)}`;ot(j,O=>{u&&u(O)},{selectorToWatch:`#${L}`,skipWhen:!I});const B=typeof b<"u"&&b!==null?b:y,U=O=>O&&typeof O=="object"&&O.value?a.jsx(N5,{tabIndex:-1,disabled:r,icon:a.jsx(We,{width:`${14/16}rem`,height:`${14/16}rem`}),onClick:H(O.value),children:O.textValue},O.value):null,{error:K,...G}=fe("MultiSelect"),Y=!!K||n,Z=G.id??s,te=G.name??i,Q=G.required??g;let se;return K?se=`${Z}-error`:G.hint&&(se=`${Z}-hint`),a.jsxs(b1,{onOpenChange:z,disabled:r,required:Q,onValueChange:N,value:B,...$,multi:!0,children:[a.jsx(p1,{ref:p,id:Z,name:te,"aria-label":$["aria-label"],"aria-describedby":se??$["aria-describedby"],startIcon:v,hasError:Y,disabled:r,clearLabel:t,onClear:B?.length?d:void 0,withTags:!!(C&&(B?.length??!1)),size:x,children:a.jsx($1,{placeholder:w,textColor:B?.length?"neutral800":"neutral600",children:B?.length?C?U:o?o(B):void 0:void 0})}),a.jsx(C1,{children:a.jsx(j1,{position:"popper",sideOffset:4,onCloseAutoFocus:f,children:a.jsxs(y1,{ref:j,children:[e,a.jsx(M,{id:L,width:"100%",height:"1px"})]})})})]})});const F5=c.forwardRef(({value:e,children:t,startIcon:o,...r},n)=>a.jsxs(j0,{ref:n,value:e.toString(),...r,children:[o&&a.jsx(M,{tag:"span","aria-hidden":!0,children:o}),a.jsx(S1,{children:({isSelected:s,isIntermediate:i})=>a.jsx(p0,{checked:i?"indeterminate":s})}),a.jsx(k,{children:a.jsx(R1,{children:t})})]}));c.forwardRef(({children:e,label:t,startIcon:o,values:r=[],...n},s)=>a.jsxs(yd,{ref:s,children:[a.jsxs(j0,{value:r,...n,children:[o&&a.jsx(M,{tag:"span","aria-hidden":!0,children:o}),a.jsx(S1,{children:({isSelected:i,isIntermediate:l})=>a.jsx(p0,{checked:l?"indeterminate":i})}),a.jsx(k,{children:t})]}),e]}));m(F5)`
  padding-left: ${({theme:e})=>e.spaces[7]};
`;const _5="23.2rem";c.forwardRef(({...e},t)=>a.jsx(W5,{ref:t,...e,tag:"nav"}));const W5=m(M)`
  width: ${_5};
  background: ${({theme:e})=>e.colors.neutral100};
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid ${({theme:e})=>e.colors.neutral200};
  z-index: 1;
`;m(Jd)`
  width: 2.4rem;
  background-color: ${({theme:e})=>e.colors.neutral200};
`;he(({active:e,children:t,icon:o=null,withBullet:r=!1,isSubSectionChild:n=!1,...s},i)=>a.jsxs(U5,{background:"neutral100",paddingLeft:n?9:7,paddingBottom:2,paddingTop:2,ref:i,...s,children:[a.jsxs(A,{children:[o?a.jsx(q5,{children:o}):a.jsx(Ot,{$active:e}),a.jsx(k,{paddingLeft:2,children:t})]}),r&&a.jsx(A,{paddingRight:4,children:a.jsx(Ot,{$active:!0})})]}));const Ot=m.span`
  width: 0.4rem;
  height: 0.4rem;
  background-color: ${({theme:e,$active:t})=>t?e.colors.primary600:e.colors.neutral600};
  border-radius: 50%;
`,U5=m(nt)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: ${({theme:e})=>e.colors.neutral800};
  svg > * {
    fill: ${({theme:e})=>e.colors.neutral600};
  }

  &.active {
    ${({theme:e})=>E`
        background-color: ${e.colors.primary100};
        border-right: 2px solid ${e.colors.primary600};
        color: ${e.colors.primary700};
        font-weight: 500;
      `}

    ${Ot} {
      background-color: ${({theme:e})=>e.colors.primary600};
    }
  }

  &:focus-visible {
    outline-offset: -2px;
  }
`,q5=m.div`
  svg {
    height: 1.6rem;
    width: 1.6rem;
  }
`;m.button`
  border: none;
  padding: 0;
  background: transparent;
  display: flex;
  align-items: center;
`;m(M)`
  & > svg {
    height: 0.4rem;
    fill: ${({theme:e})=>e.colors.neutral500};
  }
`;c.forwardRef(({visibleLabels:e,onLabel:t="On",offLabel:o="Off",onCheckedChange:r,checked:n,defaultChecked:s,disabled:i,...l},d)=>{const[f,u]=Ce({prop:n,defaultProp:s}),w=g=>{u(g)};return a.jsxs(A,{gap:3,children:[a.jsx(G5,{ref:d,onCheckedChange:Ve(r,w),checked:f,disabled:i,...l,children:a.jsx(K5,{})}),e?a.jsx(Y5,{"aria-hidden":!0,"data-disabled":i,"data-state":f?"checked":"unchecked",children:f?t:o}):null]})});const G5=m(aa)`
  width: 4rem;
  height: 2.4rem;
  border-radius: 1.2rem;
  background-color: ${({theme:e})=>e.colors.danger500};

  &[data-state='checked'] {
    background-color: ${({theme:e})=>e.colors.success500};
  }

  &[data-disabled] {
    background-color: ${({theme:e})=>e.colors.neutral300};
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: ${e=>e.theme.transitions.backgroundColor};
  }
`,K5=m(ra)`
  display: block;
  height: 1.6rem;
  width: 1.6rem;
  border-radius: 50%;
  background-color: ${({theme:e})=>e.colors.neutral0};
  transform: translateX(4px);

  &[data-state='checked'] {
    transform: translateX(20px);
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: transform ${e=>e.theme.motion.timings[120]}
      ${e=>e.theme.motion.easings.authenticMotion};
  }
`,Y5=m(k)`
  color: ${e=>e.theme.colors.danger600};

  &[data-state='checked'] {
    color: ${e=>e.theme.colors.success600};
  }

  &[data-disabled='true'] {
    color: ${({theme:e})=>e.colors.neutral500};
  }
`,[Z5,S0]=tt("Tabs");c.forwardRef(({disabled:e=!1,variant:t="regular",hasError:o,...r},n)=>a.jsx(Z5,{disabled:e,hasError:o,variant:t,children:a.jsx(Q5,{ref:n,...r})}));const Q5=m(sa)`
  width: 100%;
  position: relative;
`;c.forwardRef((e,t)=>{const{variant:o}=S0("List");return a.jsx(X5,{ref:t,...e,$variant:o})});const X5=m(ia)`
  display: flex;
  align-items: ${e=>e.$variant==="regular"?"flex-end":"unset"};
  position: relative;
  z-index: 0;
`;c.forwardRef(({children:e,disabled:t,...o},r)=>{const{disabled:n,variant:s,hasError:i}=S0("Trigger"),l=n===!0||n===o.value||t,d=i===o.value;return a.jsxs(J5,{ref:r,...o,$hasError:d,$variant:s,disabled:l,children:[a.jsx(z1,{fontWeight:"bold",variant:s==="simple"?"sigma":void 0,children:e}),s==="simple"?a.jsx(D1,{}):null]})});const D1=m.span`
  display: block;
  width: 100%;
  background-color: currentColor;
  position: absolute;
  bottom: 0;
  left: 0;
  opacity: 0;
  height: 0.2rem;
`,z1=m(k)``,J5=m(ca)`
  position: relative;
  color: ${e=>e.$hasError?e.theme.colors.danger600:e.theme.colors.neutral600};
  cursor: pointer;
  z-index: 0;

  ${e=>e.$variant==="simple"?E`
        padding-block: ${t=>t.theme.spaces[4]};
        padding-inline: ${t=>t.theme.spaces[4]};

        & > ${z1} {
          line-height: 1.2rem;
        }

        &[data-state='active'] {
          color: ${e.$hasError?e.theme.colors.danger600:e.theme.colors.primary700};

          & > ${D1} {
            opacity: 1;
          }
        }
      `:E`
        padding-block: ${t=>t.theme.spaces[3]};
        padding-inline: ${t=>t.theme.spaces[3]};
        flex: 1;
        background-color: ${t=>t.theme.colors.neutral100};
        border-bottom: solid 1px ${t=>t.theme.colors.neutral150};

        &:not([data-state='active']) + &:not([data-state='active']) {
          border-left: solid 1px ${t=>t.theme.colors.neutral150};
        }

        &[data-state='active'] {
          padding-block: ${t=>t.theme.spaces[4]};
          padding-inline: ${t=>t.theme.spaces[4]};
          color: ${e.$hasError?e.theme.colors.danger600:e.theme.colors.primary700};
          border-top-right-radius: ${t=>t.theme.borderRadius};
          border-top-left-radius: ${t=>t.theme.borderRadius};
          background-color: ${t=>t.theme.colors.neutral0};
          border-bottom: solid 1px ${t=>t.theme.colors.neutral0};
          box-shadow: ${e.theme.shadows.tableShadow};
          z-index: 1;
        }
      `}

  &[data-disabled] {
    cursor: not-allowed;
    color: ${e=>e.theme.colors.neutral400};
  }
`;c.forwardRef((e,t)=>{const{variant:o}=S0("Content");return a.jsx(P5,{$variant:o,ref:t,...e})});const P5=m(la)`
  ${e=>e.$variant==="simple"?E``:E`
        position: relative;
        z-index: 1;
        background-color: ${t=>t.theme.colors.neutral0};
      `}
`,eh=m(M)`
  overflow: hidden;
  border: 1px solid ${({theme:e})=>e.colors.neutral150};
`,th=m(T5)`
  width: 100%;
  white-space: nowrap;
`,nh=m(M)`
  &:before {
    // TODO: make sure to add a token for this weird stuff
    background: linear-gradient(90deg, #c0c0cf 0%, rgba(0, 0, 0, 0) 100%);
    opacity: 0.2;
    position: absolute;
    height: 100%;
    content: ${({$overflowing:e})=>e==="both"||e==="left"?"''":void 0};
    box-shadow: ${({theme:e})=>e.shadows.tableShadow};
    width: ${({theme:e})=>e.spaces[2]};
    left: 0;
  }

  &:after {
    // TODO: make sure to add a token for this weird stuff
    background: linear-gradient(270deg, #c0c0cf 0%, rgba(0, 0, 0, 0) 100%);
    opacity: 0.2;
    position: absolute;
    height: 100%;
    content: ${({$overflowing:e})=>e==="both"||e==="right"?"''":void 0};
    box-shadow: ${({theme:e})=>e.shadows.tableShadow};
    width: ${({theme:e})=>e.spaces[2]};
    right: 0;
    top: 0;
  }
`,oh=m(M)`
  overflow-x: auto;
`,Bh=c.forwardRef(({footer:e,...t},o)=>{const r=c.useRef(null),[n,s]=c.useState(),i=l=>{const d=l.target.scrollWidth-l.target.clientWidth;if(l.target.scrollLeft===0){s("right");return}if(l.target.scrollLeft===d){s("left");return}l.target.scrollLeft>0&&s("both")};return c.useEffect(()=>{r.current.scrollWidth>r.current.clientWidth&&s("right")},[]),a.jsxs(eh,{shadow:"tableShadow",hasRadius:!0,background:"neutral0",children:[a.jsx(nh,{$overflowing:n,position:"relative",children:a.jsx(oh,{ref:r,onScroll:i,paddingLeft:6,paddingRight:6,children:a.jsx(th,{ref:o,...t})})}),e]})}),ah=m(L5)`
  & tr:last-of-type {
    border-bottom: none;
  }
`,Dh=({children:e,...t})=>a.jsx(ah,{...t,children:e}),rh=m(E5)`
  border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};
`,zh=({children:e,...t})=>a.jsx(rh,{...t,children:e}),sh=m(H5)`
  border-bottom: 1px solid ${({theme:e})=>e.colors.neutral150};

  & td,
  & th {
    padding: ${({theme:e})=>e.spaces[4]};
  }

  & td:first-of-type,
  & th:first-of-type {
    padding: 0 ${({theme:e})=>e.spaces[1]};
  }

  // Resetting padding values and fixing a height
  th {
    padding-top: 0;
    padding-bottom: 0;
    height: 5.6rem;
  }
`,kh=e=>a.jsx(sh,{...e}),k1=m(H1)`
  vertical-align: middle;
  text-align: left;
  outline-offset: -4px;

  /**
  * Hack to make sure the checkbox looks aligned
  */
  input {
    vertical-align: sub;
  }
`,Nh=c.forwardRef(({children:e,action:t,...o},r)=>a.jsx(k1,{color:"neutral600",as:V5,ref:r,...o,children:a.jsxs(A,{children:[e,t]})})),Oh=c.forwardRef(({children:e,...t},o)=>a.jsx(k1,{color:"neutral800",ref:o,...t,children:e}));m(M)`
  height: 2.4rem;
  width: 2.4rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: 1rem;
    width: 1rem;
  }

  svg path {
    fill: ${({theme:e})=>e.colors.primary600};
  }
`;m(M)`
  border-radius: 0 0 ${({theme:e})=>e.borderRadius} ${({theme:e})=>e.borderRadius};
  display: block;
  width: 100%;
  border: none;
`;he(({children:e,startIcon:t,endIcon:o,disabled:r=!1,loading:n=!1,...s},i)=>{const l=r||n;return a.jsxs(lh,{ref:i,disabled:l,"aria-disabled":l,tag:"button",type:"button",gap:2,...s,children:[n?a.jsx(ch,{"aria-hidden":!0,children:a.jsx(Yn,{})}):t,a.jsx(k,{variant:"pi",children:e}),o]})});const ih=ie`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`,ch=m.span`
  display: flex;
  animation: ${ih} 2s infinite linear;
  will-change: transform;
`,lh=m(A)`
  border: none;
  background-color: transparent;
  color: ${e=>e.theme.colors.primary600};
  cursor: pointer;

  &[aria-disabled='true'] {
    pointer-events: none;
    color: ${e=>e.theme.colors.neutral600};
  }

  ${ft}
`,dh=c.forwardRef((e,t)=>a.jsx(wt,{ref:t,...e}));dh.displayName="TextInput";const Fh=c.forwardRef(({disabled:e,hasError:t,id:o,name:r,required:n,...s},i)=>{const{error:l,...d}=fe("Textarea"),f=!!l||t,u=d.id??o,w=d.name??r,g=d.required||n;let x;return l?x=`${u}-error`:d.hint&&(x=`${u}-hint`),a.jsx(hh,{borderColor:f?"danger600":"neutral200",$hasError:f,hasRadius:!0,children:a.jsx(uh,{"aria-invalid":f,"aria-required":g,tag:"textarea",background:e?"neutral150":"neutral0",color:e?"neutral600":"neutral800",disabled:e,fontSize:2,hasRadius:!0,ref:i,lineHeight:4,padding:4,width:"100%",height:"100%",id:u,name:w,"aria-describedby":x,...s})})}),hh=m(M)`
  height: 10.5rem;
  ${Me()}
`,uh=m(M)`
  border: none;
  resize: none;

  &::placeholder {
    color: ${({theme:e})=>e.colors.neutral600};
    font-size: ${({theme:e})=>e.fontSizes[2]};
    opacity: 1;
  }

  &:focus-within {
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
  }
`,_h=c.forwardRef(({offLabel:e,onLabel:t,disabled:o,hasError:r,required:n,id:s,name:i,checked:l,onChange:d,...f},u)=>{const[w=!1,g]=Ce({prop:l}),x=w!==null&&!w,{error:v,...b}=fe("Toggle"),C=!!v||r,$=b.id??s,p=b.name??i,j=b.required||n;let y;return v?y=`${$}-error`:b.hint&&(y=`${$}-hint`),a.jsxs(gh,{position:"relative",hasRadius:!0,padding:1,background:o?"neutral150":"neutral100",borderStyle:"solid",borderWidth:"1px",borderColor:"neutral200",wrap:"wrap",cursor:o?"not-allowed":"pointer",$hasError:C,children:[a.jsx(Z0,{hasRadius:!0,flex:"1 1 50%",paddingTop:2,paddingBottom:2,paddingLeft:3,paddingRight:3,justifyContent:"center",background:o&&x?"neutral200":x?"neutral0":"transparent",borderColor:o&&x?"neutral300":x?"neutral200":o?"neutral150":"neutral100",children:a.jsx(k,{variant:"pi",fontWeight:"bold",textTransform:"uppercase",textColor:o?"neutral700":x?"danger700":"neutral600",children:e})}),a.jsx(Z0,{hasRadius:!0,flex:"1 1 50%",paddingLeft:3,paddingRight:3,justifyContent:"center",background:o&&w?"neutral200":w?"neutral0":"transparent",borderColor:o&&w?"neutral300":w?"neutral200":o?"neutral150":"neutral100",children:a.jsx(k,{variant:"pi",fontWeight:"bold",textTransform:"uppercase",textColor:o?"neutral700":w?"primary600":"neutral600",children:t})}),a.jsx(fh,{...f,id:$,name:p,ref:u,onChange:S=>{g(S.currentTarget.checked),d?.(S)},type:"checkbox","aria-required":j,disabled:o,"aria-disabled":o,checked:!!w,"aria-describedby":y})]})}),gh=m(A)`
  ${Me()}
`,Z0=m(A)`
  padding-block: 0.6rem;
`,fh=m.input`
  height: 100%;
  left: 0;
  opacity: 0;
  position: absolute;
  top: 0;
  z-index: 0;
  width: 100%;
`,mh=he((e,t)=>{const{gap:o=0,gridCols:r=12,...n}=e;return a.jsx(xh,{ref:t,$gap:o,$gridCols:r,...n})}),xh=m(M)`
  display: grid;
  grid-template-columns: repeat(${({$gridCols:e})=>e}, 1fr);
  ${({theme:e,$gap:t})=>gt({gap:t},e)}
`,wh=he(({col:e,s:t,xs:o,m:r,...n},s)=>a.jsx(vh,{ref:s,$col:e,$s:t,$xs:o,$m:r,...n})),vh=m(A)`
  grid-column: span ${({$xs:e})=>e??12};
  max-width: 100%;

  ${({theme:e})=>e.breakpoints.small} {
    grid-column: span ${({$s:e,$xs:t})=>e??t??12};
  }

  ${({theme:e})=>e.breakpoints.medium} {
    grid-column: span ${({$m:e,$s:t,$xs:o})=>e??t??o??12};
  }

  ${({theme:e})=>e.breakpoints.large} {
    grid-column: span ${({$col:e,$m:t,$s:o,$xs:r})=>e??t??o??r??12};
  }
`,Wh=Object.freeze(Object.defineProperty({__proto__:null,Item:wh,Root:mh},Symbol.toStringTag,{value:"Module"}));export{Rh as A,kt as B,U2 as C,Ah as D,Vh as E,$h as F,Wh as G,He as I,ol as L,Hh as M,k as T,Ue as V,M as a,A as b,Ih as c,_h as d,dh as e,W2 as f,va as g,Bh as h,zh as i,kh as j,Nh as k,Dh as l,Oh as m,jh as n,ph as o,p0 as p,Ch as q,Lh as r,Fh as s,Sh as t,Mh as u,qt as v,Eh as w,yh as x};
