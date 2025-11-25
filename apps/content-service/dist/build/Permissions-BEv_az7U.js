import{db as Ie,ck as Be,kD as He,kE as Ge,ct as Ve,cp as We,kF as Ke,kG as Xe,kH as Ye,kI as qe,kJ as ze,cr as Qe,eQ as Ze,kK as he,kL as N,jk as Q,kM as Je,kN as U,kO as Oe,e as T,p as y,j as t,ae as O,a as P,bZ as R,s as E,kP as Ue,di as es,r as k,i8 as A,bb as oe,kA as ss,fr as F,fs as ts,ft as ns,bn as is,kQ as os,kR as ce,cR as $e,kS as rs,kT as as,ky as q,bl as ge,gT as H,kU as ie,eO as L}from"./strapi-CZE0NOhr.js";import{g as re}from"./groupBy-XlcpK7XU.js";const[ls,cs]=Ie("PermissionsDataManager"),Y=()=>cs("usePermissionsDataManager");var ds=He,ps=Ge,us=Ve,hs=We,gs=Ke,ms=Qe,fs=Xe,xs=Ye,Cs=qe,bs=ze;function js(e,s,i){var n=ms(e),r=n||fs(e)||bs(e);if(s=hs(s),i==null){var a=e&&e.constructor;r?i=n?new a:[]:Cs(e)?i=xs(a)?ps(gs(e)):{}:i={}}return(r?ds:us)(e,function(c,o,l){return s(i,c,o,l)}),i}var ys=js;const ks=Be(ys);function me(e,s){function i(n,r){return ks(n,(a,c,o)=>(Ze(c,r[o])||(a[o]=he(c)&&he(r[o])?i(c,r[o]):c),a))}return i(e,s)}const Te=e=>Array.isArray(e)?e.reduce((s,i)=>(Array.isArray(i)?s.push(...Te(i)):s.push(i),s),[]):[],G=e=>N(e)?Te(Object.values(e).map(s=>N(s)?G(s):s)):[],ve=(e,s,i)=>e.find(n=>n.action===s&&n.subject===i),As=e=>{const s=fe(e.plugins),i=fe(e.settings),n=xe(e.collectionTypes),r=xe(e.singleTypes);return[...s,...i,...n,...r]},fe=e=>Object.values(e).reduce((s,i)=>{const n=Object.values(i).reduce((r,a)=>{const c=Object.entries(a).reduce((o,[l,{conditions:d,properties:{enabled:p}}])=>(p&&o.push({action:l,subject:null,conditions:ae(d),properties:{}}),o),[]);return[...r,...c]},[]);return[...s,...n]},[]),xe=e=>Object.entries(e).reduce((i,n)=>{const[r,a]=n,c=Object.entries(a).reduce((o,l)=>{const[d,p]=l;if(!G(p).some(h=>h))return o;if(!p?.properties?.enabled){const h=Object.entries(p.properties).reduce((C,f)=>{const[u,m]=f;return C.properties[u]=Me(m),C},{action:d,subject:r,conditions:ae(p.conditions),properties:{}});return[...o,h]}return p.properties.enabled&&o.push({action:d,subject:r,properties:{},conditions:ae(p.conditions)}),o},[]);return[...i,...c]},[]),Me=(e,s="")=>Object.entries(e).reduce((i,n)=>{const[r,a]=n;return N(a)?[...i,...Me(a,`${s}${r}.`)]:(a&&!N(a)&&i.push(`${s}${r}`),i)},[]),ae=e=>Object.entries(e).filter(([,s])=>s).map(([s])=>s),we=(e,s=[])=>e.reduce((i,n)=>(i[n.id]=s.indexOf(n.id)!==-1,i),{}),Ce=(e,s,i=[])=>e.reduce((n,{categoryId:r,childrenForm:a})=>{const c=a.reduce((o,l)=>(o[l.subCategoryId]=l.actions.reduce((d,p)=>{const g=ve(i,p.action,null);return d[p.action]={properties:{enabled:g!==void 0},conditions:we(s,g?.conditions??[])},d},{}),o),{});return n[r]=c,n},{}),Ss=(e,s,i)=>{const n=({children:r=[]},a,c="")=>r.reduce((o,l)=>{if(l.children)return{...o,[l.value]:n(l,a,`${c}${l.value}.`)};const d=a.indexOf(`${c}${l.value}`)!==-1;return o[l.value]=d,o},{});return e.reduce((r,a)=>{const c=s.properties.find(({value:o})=>o===a);if(c){const o=i?.properties[c.value]??[],l=n(c,o);r.properties[a]=l}return r},{properties:{}})},be=({subjects:e,actions:s=[]},i,n=[])=>s.reduce((r,a)=>{const c=a.subjects.reduce((l,d)=>{const p=e.find(({uid:g})=>g===d)||null;return p&&(l[d]=p),l},{});if(Q(c))return r;const o=Object.keys(c).reduce((l,d)=>{const{actionId:p,applyToProperties:g}=a,f=c[d].properties.map(({value:x})=>x).every(x=>(g||[]).indexOf(x)===-1),u=ve(n,p,d),m=we(i,u?.conditions??[]);if(l[d]||(l[d]={}),Q(g)||f)return l[d][p]={properties:{enabled:u!==void 0},conditions:m},l;const b=Ss(g,c[d],u);return l[d][p]={...b,conditions:m},l},{});return Je(r,o)},{}),je=(e,s)=>Object.entries(re(e,s)).map(([i,n])=>({category:i,categoryId:i.split(" ").join("-"),childrenForm:Object.entries(re(n,"subCategory")).map(([r,a])=>({subCategoryName:r,subCategoryId:r.split(" ").join("-"),actions:a}))})),J=e=>Object.keys(e).reduce((s,i)=>{const n=e[i];if(N(n)&&!U(n,"conditions"))return{...s,[i]:J(n)};if(N(n)&&U(n,"conditions")&&!G(Oe(n,"conditions")).some(a=>a)){const a=Object.keys(n.conditions).reduce((c,o)=>(c[o]=!1,c),{});return{...s,[i]:{...n,conditions:a}}}return s[i]=n,s},{}),z=(e,s,i=!1)=>Object.keys(e).reduce((n,r)=>{const a=e[r];return r==="conditions"&&!i?(n[r]=a,n):N(a)?{...n,[r]:z(a,s,r==="fields")}:(n[r]=s,n)},{}),D="12rem",de="20rem",se="5.3rem",pe=e=>e?Object.entries(e).reduce((s,[i,n])=>(i!=="conditions"&&(s[i]=n),s),{}):null,V=e=>{const s=pe(e),i=G(s);if(!i.length)return{hasAllActionsSelected:!1,hasSomeActionsSelected:!1};const n=i.every(a=>a),r=i.some(a=>a)&&!n;return{hasAllActionsSelected:n,hasSomeActionsSelected:r}},Pe=T(y)`
  padding-right: ${({theme:e})=>e.spaces[2]};
  overflow: hidden;
  flex: 1;
  ${({$isCollapsable:e})=>e&&"cursor: pointer;"}
`,ue=T.div`
  width: ${D};
`,_e=()=>t.jsx(O,{color:"danger700",paddingLeft:1,children:"*"}),Ee=({checkboxName:e="",children:s,isActive:i=!1,isCollapsable:n=!1,isFormDisabled:r=!1,label:a,onChange:c,onClick:o,someChecked:l=!1,value:d})=>{const{formatMessage:p}=P(),g={title:a,alignItems:"center",$isCollapsable:n};return n&&Object.assign(g,{onClick:o,"aria-expanded":i,onKeyDown({key:h}){(h==="Enter"||h===" ")&&o()},tabIndex:0,role:"button"}),t.jsxs(y,{alignItems:"center",paddingLeft:6,width:de,shrink:0,children:[t.jsx(O,{paddingRight:2,children:t.jsx(R,{name:e,"aria-label":p({id:"Settings.permissions.select-all-by-permission",defaultMessage:"Select all {label} permissions"},{label:a}),disabled:r,onCheckedChange:h=>c({target:{name:e,value:!!h}}),checked:l?"indeterminate":d})}),t.jsxs(Pe,{...g,children:[t.jsx(E,{ellipsis:!0,children:a}),s]})]})},Os=({availableActions:e=[],childrenForm:s=[],isFormDisabled:i,label:n,pathToData:r,propertyName:a})=>{const c=k.useMemo(()=>e.map(o=>{const l=Array.isArray(o.applyToProperties)&&o.applyToProperties.indexOf(a)!==-1&&o.isDisplayed;return{label:o.label,actionId:o.actionId,isActionRelatedToCurrentProperty:l}}),[e,a]);return t.jsxs(y,{display:"inline-flex",direction:"column",alignItems:"stretch",minWidth:0,children:[t.jsx(Ls,{label:n,headers:c}),t.jsx(O,{children:s.map(({children:o,label:l,value:d,required:p},g)=>t.jsx($s,{childrenForm:o,label:l,isFormDisabled:i,name:d,required:p,propertyActions:c,pathToData:r,propertyName:a,isOdd:g%2===0},d))})]})},$s=({childrenForm:e=[],label:s,isFormDisabled:i=!1,name:n,required:r=!1,pathToData:a,propertyActions:c,propertyName:o,isOdd:l=!1})=>{const{formatMessage:d}=P(),[p,g]=k.useState(null),{modifiedData:h,onChangeCollectionTypeLeftActionRowCheckbox:C,onChangeParentCheckbox:f,onChangeSimpleCheckbox:u}=Y(),m=p===n,b=k.useMemo(()=>Array.isArray(e)?e:[],[e]),x=b.length>0,j=k.useCallback(()=>{x&&g(S=>S===n?null:n)},[x,n]),$=({target:{value:S}})=>{C(a,o,n,S)},{hasAllActionsSelected:M,hasSomeActionsSelected:w}=k.useMemo(()=>Ts(c,h,a,o,n),[c,h,a,o,n]);return t.jsxs(t.Fragment,{children:[t.jsx(vs,{alignItems:"center",$isCollapsable:x,$isActive:m,background:l?"neutral100":"neutral0",children:t.jsxs(y,{children:[t.jsxs(Ee,{onChange:$,onClick:j,isCollapsable:x,isFormDisabled:i,label:s,someChecked:w,value:M,isActive:m,children:[r&&t.jsx(_e,{}),t.jsx(Z,{$isActive:m})]}),t.jsx(y,{children:c.map(({label:S,isActionRelatedToCurrentProperty:_,actionId:W})=>{if(!_)return t.jsx(ue,{},S);const v=[...a.split(".."),W,"properties",o,n];if(!x){const B=A(h,v,!1);return t.jsx(y,{width:D,position:"relative",justifyContent:"center",alignItems:"center",children:t.jsx(R,{disabled:i,name:v.join(".."),"aria-label":d({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${n} ${S}`}),onCheckedChange:Ne=>{u({target:{name:v.join(".."),value:!!Ne}})},checked:B})},W)}const K=A(h,v,{}),{hasAllActionsSelected:I,hasSomeActionsSelected:ne}=V(K);return t.jsx(y,{width:D,position:"relative",justifyContent:"center",alignItems:"center",children:t.jsx(R,{disabled:i,name:v.join(".."),onCheckedChange:B=>{f({target:{name:v.join(".."),value:!!B}})},"aria-label":d({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${n} ${S}`}),checked:ne?"indeterminate":I})},S)})})]})}),m&&t.jsx(Re,{childrenForm:b,isFormDisabled:i,parentName:n,pathToDataFromActionRow:a,propertyName:o,propertyActions:c,recursiveLevel:0})]})},Ts=(e,s,i,n,r)=>{const c=e.reduce((o,l)=>(l.isActionRelatedToCurrentProperty&&o.push(l.actionId),o),[]).reduce((o,l)=>{const d=A(s,[...i.split(".."),l,"properties",n,r],!1);return o[l]=d,o},{});return V(c)},vs=T(y)`
  height: ${se};
  flex: 1;

  &:hover {
    ${({$isCollapsable:e,theme:s})=>e&&ee(s)}
  }

  ${({$isCollapsable:e})=>e&&`
      ${Z} {
        display: flex;
      }
  `}
  ${({$isActive:e,theme:s})=>e&&ee(s)};
`,Z=T(Ue)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({theme:e})=>e.colors.neutral200};
  }

  transform: rotate(${({$isActive:e})=>e?"180":"0"}deg);
  margin-left: ${({theme:e})=>e.spaces[2]};
`,Re=({childrenForm:e=[],isFormDisabled:s,recursiveLevel:i,pathToDataFromActionRow:n,propertyActions:r,parentName:a,propertyName:c})=>{const{formatMessage:o}=P(),{modifiedData:l,onChangeParentCheckbox:d,onChangeSimpleCheckbox:p}=Y(),[g,h]=k.useState(null),C=u=>{h(m=>m===u?null:u)},f=k.useMemo(()=>g?e.find(({value:u})=>u===g):null,[g,e]);return t.jsxs(O,{paddingLeft:"3.2rem",children:[t.jsx(_s,{}),e.map(({label:u,value:m,required:b,children:x},j)=>{const $=j+1<e.length,M=Array.isArray(x),w=g===m;return t.jsxs(Ms,{$isVisible:$,children:[t.jsxs(y,{height:se,children:[t.jsx(Es,{children:t.jsx(Rs,{width:"20",height:"23",viewBox:"0 0 20 23",fill:"none",xmlns:"http://www.w3.org/2000/svg",$color:"primary200",children:t.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z",fill:"#D9D8FF"})})}),t.jsxs(y,{style:{flex:1},children:[t.jsx(ws,{$level:i,$isActive:w,$isCollapsable:M,children:t.jsxs(Pe,{alignItems:"center",$isCollapsable:M,...M&&{onClick:()=>C(m),"aria-expanded":w,onKeyDown:({key:S})=>(S==="Enter"||S===" ")&&C(m),tabIndex:0,role:"button"},title:u,children:[t.jsx(Ps,{ellipsis:!0,children:u}),b&&t.jsx(_e,{}),t.jsx(Z,{$isActive:w})]})}),t.jsx(y,{style:{flex:1},children:r.map(({actionId:S,label:_,isActionRelatedToCurrentProperty:W})=>{if(!W)return t.jsx(ue,{},S);const v=[...n.split(".."),S,"properties",c,...a.split(".."),m],K=A(l,v,!1);if(!x)return t.jsx(y,{position:"relative",width:D,justifyContent:"center",alignItems:"center",children:t.jsx(R,{disabled:s,name:v.join(".."),"aria-label":o({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${a} ${u} ${_}`}),onCheckedChange:B=>{p({target:{name:v.join(".."),value:!!B}})},checked:K})},_);const{hasAllActionsSelected:I,hasSomeActionsSelected:ne}=V(K);return t.jsx(y,{position:"relative",width:D,justifyContent:"center",alignItems:"center",children:t.jsx(R,{disabled:s,name:v.join(".."),"aria-label":o({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${a} ${u} ${_}`}),onCheckedChange:B=>{d({target:{name:v.join(".."),value:!!B}})},checked:ne?"indeterminate":I},_)},_)})})]})]}),f&&w&&t.jsx(O,{paddingBottom:2,children:t.jsx(Re,{isFormDisabled:s,parentName:`${a}..${m}`,pathToDataFromActionRow:n,propertyActions:r,propertyName:c,recursiveLevel:i+1,childrenForm:f.children})})]},m)})]})},Ms=T(O)`
  border-left: ${({$isVisible:e,theme:s})=>e?`4px solid ${s.colors.primary200}`:"4px solid transparent"};
`,ws=T(y)`
  padding-left: ${({theme:e})=>e.spaces[4]};
  width: ${({$level:e})=>145-e*36}px;

  &:hover {
    ${({$isCollapsable:e,theme:s})=>e&&ee(s)}
  }

  ${({$isCollapsable:e})=>e&&`
      ${Z} {
        display: flex;
      }
  `}
  ${({$isActive:e,theme:s})=>e&&ee(s)};
`,Ps=T(E)``,_s=T.div`
  padding-top: ${({theme:e})=>e.spaces[2]};
  margin-top: ${({theme:e})=>e.spaces[2]};
  width: 0.4rem;
  background-color: ${({theme:e})=>e.colors.primary200};
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
`,Es=T(O)`
  transform: translate(-4px, -12px);

  &:before {
    content: '';
    width: 0.4rem;
    height: 1.2rem;
    background: ${({theme:e})=>e.colors.primary200};
    display: block;
  }
`,Rs=T.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({theme:e,$color:s})=>e.colors[s]};
  }
`,Ls=({headers:e=[],label:s})=>{const{formatMessage:i}=P();return t.jsxs(y,{children:[t.jsx(y,{width:de,height:se,shrink:0,alignItems:"center",paddingLeft:6,children:t.jsx(E,{variant:"sigma",textColor:"neutral500",children:i({id:"Settings.roles.form.permission.property-label",defaultMessage:"{label} permissions"},{label:s})})}),e.map(n=>n.isActionRelatedToCurrentProperty?t.jsx(y,{width:D,shrink:0,justifyContent:"center",children:t.jsx(E,{variant:"sigma",textColor:"neutral500",children:i({id:`Settings.roles.form.permissions.${n.label.toLowerCase()}`,defaultMessage:n.label})})},n.label):t.jsx(y,{width:D,shrink:0},n.label))]})},ee=e=>es`
  color: ${e.colors.primary600};
  font-weight: ${e.fontWeights.bold};

  ${Z} {
    path {
      fill: ${e.colors.primary600};
    }
  }
`,Ds=k.forwardRef(({onClick:e,className:s,hasConditions:i=!1,variant:n="tertiary"},r)=>{const{formatMessage:a}=P();return t.jsx(Fs,{$hasConditions:i,className:s,children:t.jsx(oe,{variant:n,startIcon:t.jsx(ss,{}),onClick:e,ref:r,type:"button",children:a({id:"global.settings",defaultMessage:"Settings"})})})}),Fs=T(O)`
  ${({$hasConditions:e,theme:s})=>e&&`
    &:before {
      content: '';
      position: absolute;
      top: -3px;
      left: -10px;
      width: 6px;
      height: 6px;
      border-radius: 2rem;
      background: ${s.colors.primary600};
    }
  `}
`,te=T(Ds)``,Le=({actions:e=[],headerBreadCrumbs:s=[],isFormDisabled:i,onClose:n})=>{const{formatMessage:r}=P(),{availableConditions:a,modifiedData:c,onChangeConditions:o}=Y(),l=k.useMemo(()=>Object.entries(re(a,"category")),[a]),d=e.filter(({isDisplayed:u,hasSomeActionsSelected:m,hasAllActionsSelected:b})=>u&&!!(m||b)),[p,g]=k.useState(ye(d,c,l)),h=(u,m)=>{g($e(b=>{b[u]||(b[u]={}),b[u].default||(b[u].default={}),b[u].default=m}))},C=()=>{const u=Object.entries(p).reduce((m,b)=>{const[x,j]=b,$=Object.values(j).reduce((M,w)=>({...M,...w}),{});return m[x]=$,m},{});o(u),n&&n()},f=()=>{g(ye(d,c,l)),n&&n()};return t.jsxs(F.Content,{children:[t.jsx(F.Header,{children:t.jsx(ts,{id:"condition-modal-breadcrumbs",label:s.join(", "),children:s.map((u,m,b)=>t.jsx(ns,{isCurrent:m===b.length-1,children:is(r({id:u,defaultMessage:u}))},u))})}),t.jsxs(F.Body,{children:[d.length===0&&t.jsx(E,{children:r({id:"Settings.permissions.conditions.no-actions",defaultMessage:"You first need to select actions (create, read, update, ...) before defining conditions on them."})}),t.jsx("ul",{children:d.map(({actionId:u,label:m,pathToConditionsObject:b},x)=>{const j=b.join("..");return t.jsx(Ns,{arrayOfOptionsGroupedByCategory:l,label:m,isFormDisabled:i,isGrey:x%2===0,name:j,onChange:h,value:A(p,j,{})},u)})})]}),t.jsxs(F.Footer,{children:[t.jsx(oe,{variant:"tertiary",onClick:()=>f(),children:r({id:"app.components.Button.cancel",defaultMessage:"Cancel"})}),t.jsx(oe,{onClick:C,children:r({id:"Settings.permissions.conditions.apply",defaultMessage:"Apply"})})]})]})},ye=(e,s,i)=>e.reduce((n,r)=>{const a=A(s,[...r.pathToConditionsObject,"conditions"],{}),c=i.reduce((o,l)=>{const[d,p]=l,g=p.reduce((h,C)=>(h[C.id]=A(a,C.id,!1),h),{});return o[d]=g,o},{});return n[r.pathToConditionsObject.join("..")]=c,n},{}),Ns=({arrayOfOptionsGroupedByCategory:e,isFormDisabled:s=!1,isGrey:i=!1,label:n,name:r,onChange:a,value:c})=>{const{formatMessage:o}=P(),l=d=>{a&&a(r,Hs(e,d))};return t.jsxs(y,{tag:"li",background:i?"neutral100":"neutral0",paddingBottom:3,paddingTop:3,justifyContent:"space-evenly",children:[t.jsxs(y,{style:{width:180},children:[t.jsxs(E,{variant:"sigma",textColor:"neutral600",children:[o({id:"Settings.permissions.conditions.can",defaultMessage:"Can"})," "]}),t.jsx(E,{variant:"sigma",title:n,textColor:"primary600",ellipsis:!0,children:o({id:`Settings.roles.form.permissions.${n.toLowerCase()}`,defaultMessage:n})}),t.jsxs(E,{variant:"sigma",textColor:"neutral600",children:[" ",o({id:"Settings.permissions.conditions.when",defaultMessage:"When"})]})]}),t.jsx(O,{style:{maxWidth:430,width:"100%"},children:t.jsx(os,{id:r,customizeContent:(d=[])=>`${d.length} currently selected`,onChange:l,value:Is(c),options:Bs(e),disabled:s})})]})},Is=e=>Object.values(e).map(s=>Object.entries(s).filter(([,i])=>i).map(([i])=>i)).flat(),Bs=e=>e.reduce((s,[i,n])=>(s.push({label:ce(i),children:n.map(r=>({label:r.displayName,value:r.id}))}),s),[]),Hs=(e,s)=>e.map(([,i])=>i).flat().reduce((i,n)=>({[n.id]:s.includes(n.id),...i}),{}),Gs=({actions:e=[],isFormDisabled:s,pathToData:i,subjects:n=[]})=>{const[r,a]=k.useState(null),c=o=>()=>{a(r===o?null:o)};return t.jsx(t.Fragment,{children:n.map(({uid:o,label:l,properties:d},p)=>{const g=r===o,h=e.map(C=>({...C,isDisplayed:Array.isArray(C.subjects)&&C.subjects.indexOf(o)!==-1}));return t.jsxs(y,{direction:"column",display:"inline-flex",alignItems:"stretch",minWidth:"100%",borderColor:g?"primary600":void 0,children:[t.jsx(Vs,{availableActions:h,isActive:g,isGrey:p%2===0,isFormDisabled:s,label:l,onClickToggle:c(o),pathToData:[i,o].join("..")}),g&&d.map(({label:C,value:f,children:u})=>t.jsx(Os,{availableActions:h,childrenForm:u,isFormDisabled:s,label:C,pathToData:[i,o].join(".."),propertyName:f},f))]},o)})})},Vs=({availableActions:e=[],isActive:s=!1,isGrey:i=!1,isFormDisabled:n=!1,label:r,onClickToggle:a,pathToData:c})=>{const{formatMessage:o}=P(),{modifiedData:l,onChangeParentCheckbox:d,onChangeSimpleCheckbox:p}=Y(),[g,h]=k.useState(!1),C=A(l,c.split(".."),{}),f=k.useMemo(()=>Object.keys(C).reduce((j,$)=>(j[$]=Oe(C[$],"conditions"),j),{}),[C]),{hasAllActionsSelected:u,hasSomeActionsSelected:m}=V(f),b=k.useMemo(()=>Ws(e,l,c),[e,l,c]),x=b.some(j=>j.hasConditions);return t.jsxs(Ks,{$isActive:s,children:[t.jsxs(De,{height:se,flex:1,alignItems:"center",background:i?"neutral100":"neutral0",children:[t.jsx(Ee,{isCollapsable:!0,isFormDisabled:n,label:ce(r),checkboxName:c,onChange:d,onClick:a,someChecked:m,value:u,isActive:s,children:t.jsx(Fe,{paddingLeft:2,children:s?t.jsx(rs,{}):t.jsx(as,{})})}),t.jsx(y,{style:{flex:1},children:b.map(({actionId:j,hasSomeActionsSelected:$,isDisplayed:M,...w})=>{if(!M)return t.jsx(ue,{},j);const{hasConditions:S,hasAllActionsSelected:_,isParentCheckbox:W,checkboxName:v,label:K}=w;return W?t.jsxs(ke,{justifyContent:"center",alignItems:"center",children:[S&&t.jsx(O,{tag:"span",position:"absolute",top:"-6px",left:"37px",width:"6px",height:"6px",borderRadius:"20px",background:"primary600"}),t.jsx(R,{disabled:n,name:v,"aria-label":o({id:"Settings.permissions.select-by-permission",defaultMessage:"Select {label} permission"},{label:`${K} ${r}`}),onCheckedChange:I=>{d({target:{name:v,value:!!I}})},checked:$?"indeterminate":_})]},j):t.jsxs(ke,{justifyContent:"center",alignItems:"center",children:[S&&t.jsx(O,{tag:"span",position:"absolute",top:"-6px",left:"37px",width:"6px",height:"6px",borderRadius:"20px",background:"primary600"}),t.jsx(R,{disabled:n,name:v,onCheckedChange:I=>{p({target:{name:v,value:!!I}})},checked:S?"indeterminate":_})]},j)})})]}),t.jsx(O,{bottom:"10px",right:"9px",position:"absolute",children:t.jsxs(F.Root,{open:g,onOpenChange:()=>{h(j=>!j)},children:[t.jsx(F.Trigger,{children:t.jsx(te,{hasConditions:x})}),t.jsx(Le,{headerBreadCrumbs:[r,"Settings.permissions.conditions.conditions"],actions:b,isFormDisabled:n,onClose:()=>{h(!1)}})]})})]})},Ws=(e,s,i)=>e.map(({actionId:n,isDisplayed:r,applyToProperties:a,label:c})=>{if(!r)return{actionId:n,hasSomeActionsSelected:!1,isDisplayed:r};const o=[...i.split(".."),n],l=Q(a)?[...o,"properties","enabled"]:o,d=A(s,[...o,"conditions"],null),p={actionId:n,checkboxName:l.join(".."),hasConditions:G(d).some(f=>f),isDisplayed:r,label:c,pathToConditionsObject:o};if(Q(a)){const f=A(s,l,!1);return{...p,hasAllActionsSelected:f,hasSomeActionsSelected:f,isParentCheckbox:!1}}const g=A(s,l,null),{hasAllActionsSelected:h,hasSomeActionsSelected:C}=V(g);return{...p,hasAllActionsSelected:h,hasSomeActionsSelected:C,isParentCheckbox:!0}}),le=(e,s)=>`
  ${De} {
    background-color: ${e.colors.primary100};
    color: ${e.colors.primary600};
    border-radius: ${s?"2px 2px 0 0":"2px"};
    font-weight: ${e.fontWeights.bold};
  }

  ${Fe} {
    display: flex;
  }
  ${te} {
    display: block;
  }

  &:focus-within {
    ${()=>le(e,s)}
  }
`,De=T(y)`
  border: 1px solid transparent;
`,Ks=T.div`
  display: inline-flex;
  min-width: 100%;
  position: relative;

  ${te} {
    display: none;
  }

  ${({$isActive:e,theme:s})=>e&&le(s,e)}

  &:hover {
    ${({theme:e,$isActive:s})=>le(e,s)}
  }
`,ke=T(y)`
  width: ${D};
  position: relative;
`,Fe=T(O)`
  display: none;

  svg {
    width: 1.4rem;
  }

  path {
    fill: ${({theme:e})=>e.colors.primary600};
  }
`,Xs=({actions:e=[],isFormDisabled:s,kind:i})=>{const{formatMessage:n}=P(),{modifiedData:r,onChangeCollectionTypeGlobalActionCheckbox:a}=Y(),c=e.filter(({subjects:l})=>l&&l.length),o=k.useMemo(()=>{const l=c.map(({actionId:h})=>h),d=r[i],p=l.reduce((h,C)=>(Object.keys(d).forEach(f=>{const u=A(d,[f,C]),m={[f]:pe(u)};h[C]?h[C]={...h[C],...m}:h[C]=m}),h),{});return Object.keys(p).reduce((h,C)=>(h[C]=V(p[C]),h),{})},[r,c,i]);return t.jsx(O,{paddingBottom:4,paddingTop:6,style:{paddingLeft:de},children:t.jsx(y,{gap:0,children:c.map(({label:l,actionId:d})=>t.jsxs(y,{shrink:0,width:D,direction:"column",alignItems:"center",justifyContent:"center",gap:3,children:[t.jsx(E,{variant:"sigma",textColor:"neutral500",children:n({id:`Settings.roles.form.permissions.${l.toLowerCase()}`,defaultMessage:l})}),t.jsx(R,{disabled:s,onCheckedChange:p=>{a(i,d,!!p)},name:d,"aria-label":n({id:"Settings.permissions.select-all-by-permission",defaultMessage:"Select all {label} permissions"},{label:n({id:`Settings.roles.form.permissions.${l.toLowerCase()}`,defaultMessage:l})}),checked:A(o,[d,"hasSomeActionsSelected"],!1)?"indeterminate":A(o,[d,"hasAllActionsSelected"],!1)})]},d))})})},Ae=({isFormDisabled:e,kind:s,layout:{actions:i,subjects:n}})=>{const r=[...n].sort((a,c)=>a.label.localeCompare(c.label));return t.jsxs(O,{background:"neutral0",children:[t.jsx(Xs,{actions:i,kind:s,isFormDisabled:e}),t.jsx(Gs,{actions:i,isFormDisabled:e,pathToData:s,subjects:r})]})},Se=({layout:e,...s})=>t.jsx(O,{padding:6,background:"neutral0",children:t.jsx(q.Root,{size:"M",children:e.map(({category:i,categoryId:n,childrenForm:r},a)=>t.jsx(Ys,{childrenForm:r,variant:a%2===1?"primary":"secondary",name:i,pathToData:[s.kind,n],...s},i))})}),Ys=({childrenForm:e,kind:s,name:i,isFormDisabled:n=!1,variant:r,pathToData:a})=>{const{formatMessage:c}=P(),o=i.split("::").pop()??"",l=o==="upload"?"Media Library":ce(o.replace(/-/g," "));return t.jsxs(q.Item,{value:i,children:[t.jsx(q.Header,{variant:r,children:t.jsx(q.Trigger,{caretPosition:"right",description:`${c({id:"Settings.permissions.category",defaultMessage:o},{category:o})} ${s==="plugins"?"plugin":s}`,children:l})}),t.jsx(q.Content,{children:t.jsx(O,{padding:6,children:e.map(({actions:d,subCategoryName:p,subCategoryId:g})=>t.jsx(qs,{actions:d,categoryName:o,isFormDisabled:n,subCategoryName:p,pathToData:[...a,g]},p))})})]})},qs=({actions:e=[],categoryName:s,isFormDisabled:i,subCategoryName:n,pathToData:r})=>{const{modifiedData:a,onChangeParentCheckbox:c,onChangeSimpleCheckbox:o}=Y(),[l,d]=k.useState(!1),{formatMessage:p}=P(),g=A(a,r,{}),h=k.useMemo(()=>Object.keys(g).reduce((x,j)=>(x[j]=pe(g[j]),x),{}),[g]),{hasAllActionsSelected:C,hasSomeActionsSelected:f}=V(h),u=k.useMemo(()=>e.map(x=>{const j=[...r,x.action,"properties","enabled"],$=A(a,j,!1),M=A(a,[...r,x.action,"conditions"],{}),w=G(M).some(S=>S);return{...x,isDisplayed:$,checkboxName:j.join(".."),hasSomeActionsSelected:$,value:$,hasConditions:w,label:x.displayName,actionId:x.action,pathToConditionsObject:[...r,x.action]}}),[e,a,r]),m=A(a,[...r],{}),b=G(Object.entries(m).reduce((x,j)=>{const[$,{conditions:M}]=j;return x[$]=M,x},{})).some(x=>x);return t.jsx(t.Fragment,{children:t.jsxs(O,{children:[t.jsxs(y,{justifyContent:"space-between",alignItems:"center",children:[t.jsx(O,{paddingRight:4,children:t.jsx(E,{variant:"sigma",textColor:"neutral600",children:n})}),t.jsx(zs,{flex:1}),t.jsx(O,{paddingLeft:4,children:t.jsx(R,{name:r.join(".."),disabled:i,onCheckedChange:x=>{c({target:{name:r.join(".."),value:!!x}})},checked:f?"indeterminate":C,children:p({id:"app.utils.select-all",defaultMessage:"Select all"})})})]}),t.jsxs(y,{paddingTop:6,paddingBottom:6,children:[t.jsx(ge.Root,{gap:2,style:{flex:1},children:u.map(({checkboxName:x,value:j,action:$,displayName:M,hasConditions:w})=>t.jsx(ge.Item,{col:3,direction:"column",alignItems:"start",children:t.jsx(Qs,{$disabled:i,$hasConditions:w,children:t.jsx(R,{name:x,disabled:i,onCheckedChange:S=>{o({target:{name:x,value:!!S}})},checked:j,children:M})})},$))}),t.jsxs(F.Root,{open:l,onOpenChange:()=>{d(x=>!x)},children:[t.jsx(F.Trigger,{children:t.jsx(te,{hasConditions:b})}),t.jsx(Le,{headerBreadCrumbs:[s,n],actions:u,isFormDisabled:i,onClose:()=>{d(!1)}})]})]})]})})},zs=T(O)`
  align-self: center;
  border-top: 1px solid ${({theme:e})=>e.colors.neutral150};
`,Qs=T.div`
  position: relative;
  word-break: keep-all;
  ${({$hasConditions:e,$disabled:s,theme:i})=>e&&`
    &:before {
      content: '';
      position: absolute;
      top: -0.4rem;
      left: -0.8rem;
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 2rem;
      background: ${s?i.colors.neutral100:i.colors.primary600};
    }
  `}
`,X=[{labelId:"app.components.LeftMenuLinkContainer.collectionTypes",defaultMessage:"Collection Types",id:"collectionTypes"},{labelId:"app.components.LeftMenuLinkContainer.singleTypes",id:"singleTypes",defaultMessage:"Single Types"},{labelId:"app.components.LeftMenuLinkContainer.plugins",defaultMessage:"Plugins",id:"plugins"},{labelId:"app.components.LeftMenuLinkContainer.settings",defaultMessage:"Settings",id:"settings"}],tt=k.forwardRef(({layout:e,isFormDisabled:s,permissions:i=[]},n)=>{const[{initialData:r,layouts:a,modifiedData:c},o]=k.useReducer(Js,Zs,()=>Us(e,i)),{formatMessage:l}=P();k.useImperativeHandle(n,()=>({getPermissions(){const f=me(r.collectionTypes,c.collectionTypes),u=me(r.singleTypes,c.singleTypes),m={...f,...u};let b;return Q(m)?b=!1:b=Object.values(m).some((x={})=>Object.values(x).some(j=>U(j,"conditions"))),{permissionsToSend:As(c),didUpdateConditions:b}},resetForm(){o({type:"RESET_FORM"})},setFormAfterSubmit(){o({type:"SET_FORM_AFTER_SUBMIT"})}}));const d=(f,u,m,b)=>{o({type:"ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX",pathToCollectionType:f,propertyName:u,rowName:m,value:b})},p=(f,u,m)=>{o({type:"ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX",collectionTypeKind:f,actionId:u,value:m})},g=f=>{o({type:"ON_CHANGE_CONDITIONS",conditions:f})},h=k.useCallback(({target:{name:f,value:u}})=>{o({type:"ON_CHANGE_SIMPLE_CHECKBOX",keys:f,value:u})},[]),C=k.useCallback(({target:{name:f,value:u}})=>{o({type:"ON_CHANGE_TOGGLE_PARENT_CHECKBOX",keys:f,value:u})},[]);return t.jsx(ls,{availableConditions:e.conditions,modifiedData:c,onChangeConditions:g,onChangeSimpleCheckbox:h,onChangeParentCheckbox:C,onChangeCollectionTypeLeftActionRowCheckbox:d,onChangeCollectionTypeGlobalActionCheckbox:p,children:t.jsxs(H.Root,{defaultValue:X[0].id,children:[t.jsx(H.List,{"aria-label":l({id:"Settings.permissions.users.tabs.label",defaultMessage:"Tabs Permissions"}),children:X.map(f=>t.jsx(H.Trigger,{value:f.id,children:l({id:f.labelId,defaultMessage:f.defaultMessage})},f.id))}),t.jsx(H.Content,{value:X[0].id,children:t.jsx(Ae,{layout:a.collectionTypes,kind:"collectionTypes",isFormDisabled:s})}),t.jsx(H.Content,{value:X[1].id,children:t.jsx(Ae,{layout:a.singleTypes,kind:"singleTypes",isFormDisabled:s})}),t.jsx(H.Content,{value:X[2].id,children:t.jsx(Se,{layout:a.plugins,kind:"plugins",isFormDisabled:s})}),t.jsx(H.Content,{value:X[3].id,children:t.jsx(Se,{layout:a.settings,kind:"settings",isFormDisabled:s})})]})})}),Zs={initialData:{},modifiedData:{},layouts:{}},Js=(e,s)=>$e(e,i=>{switch(s.type){case"ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX":{const{collectionTypeKind:n,actionId:r,value:a}=s,c=["modifiedData",n];Object.keys(A(e,c)).forEach(o=>{const l=A(e,[...c,o,r],void 0);if(l){let d=z(l,a);if(!a&&d.conditions){const p=z(d.conditions,!1);d={...d,conditions:p}}L(i,[...c,o,r],d)}});break}case"ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX":{const{pathToCollectionType:n,propertyName:r,rowName:a,value:c}=s;let o=ie(e.modifiedData);const l=n.split(".."),d=A(o,l,{});Object.keys(d).forEach(p=>{if(U(d[p],`properties.${r}`)){const g=A(d,[p,"properties",r,a]),h=[...l,p,"properties",r,a];if(!N(g))L(o,h,c);else{const C=z(g,c);L(o,h,C)}}}),c||(o=J(o)),L(i,"modifiedData",o);break}case"ON_CHANGE_CONDITIONS":{Object.entries(s.conditions).forEach(n=>{const[r,a]=n;L(i,["modifiedData",...r.split(".."),"conditions"],a)});break}case"ON_CHANGE_SIMPLE_CHECKBOX":{let n=ie(e.modifiedData);L(n,[...s.keys.split("..")],s.value),s.value||(n=J(n)),L(i,"modifiedData",n);break}case"ON_CHANGE_TOGGLE_PARENT_CHECKBOX":{const{keys:n,value:r}=s,a=[...n.split("..")];let c=ie(e.modifiedData);const o=A(c,a,{}),l=z(o,r);L(c,a,l),r||(c=J(c)),L(i,["modifiedData"],c);break}case"RESET_FORM":{i.modifiedData=e.initialData;break}case"SET_FORM_AFTER_SUBMIT":{i.initialData=e.modifiedData;break}default:return i}}),Us=(e,s)=>{const{conditions:i,sections:{collectionTypes:n,singleTypes:r,plugins:a,settings:c}}=e,o={collectionTypes:n,singleTypes:r,plugins:je(a,"plugin"),settings:je(c,"category")},l={collectionTypes:be(n,i,s),singleTypes:be(r,i,s),plugins:Ce(o.plugins,i,s),settings:Ce(o.settings,i,s)};return{initialData:l,modifiedData:l,layouts:o}};export{tt as P};
