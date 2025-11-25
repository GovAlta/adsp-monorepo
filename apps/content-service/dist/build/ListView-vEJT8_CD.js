import{e as y,ke as p,j as e,i8 as O,a as A,kf as x,kg as v,kh as be,ki as L,r as R,kj as U,kk as je,kl as Ce,km as we,kn as Y,a9 as K,bn as V,ko as ke,kp as Q,kq as Te,kr as $e,c3 as ve,ks as De,kt as Me,b as ee,ku as Re,c4 as te,kv as B,cZ as Fe,$ as Se,B as Ae,kw as Ie,D as ne,bG as Ee,b1 as _,kx as Le}from"./strapi-CZE0NOhr.js";import{u as D,g as m,C as J,a as W,A as Oe,S as Ne,c as X,F as Ue}from"./index-D2OzFBlj.js";import{d as Be,e as Pe,D as Ze,f as ze,b as Ve,S as We,v as He,u as qe,C as Ge,P as _e}from"./sortable.esm-D2y55o4n.js";import"./groupBy-XlcpK7XU.js";import"./_baseEach-BupwFL9F.js";import"./sortBy-B4qcwP3a.js";import"./_baseMap-DwW8IPUQ.js";import"./index-CUG9Dncs.js";import"./index-BRVyLNfZ.js";import"./_arrayIncludesWith-BNzMLSv9.js";const Je=t=>{let{transform:n}=t;return{...n,x:0}},Xe=y(p)`
  position: absolute;
  left: -3.4rem;
  top: 0px;

  &:before {
    content: '';
    width: 0.4rem;
    height: 1.2rem;
    background: ${({theme:t,color:n})=>t.colors[n]};
    display: block;
  }
`,Ye=y.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({theme:t,color:n})=>t.colors[n]};
  }
`,Ke=t=>e.jsx(Xe,{...t,children:e.jsx(Ye,{width:"20",height:"23",viewBox:"0 0 20 23",fill:"none",xmlns:"http://www.w3.org/2000/svg",...t,children:e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z"})})}),Qe=t=>{let n;switch(t){case"date":case"datetime":case"time":case"timestamp":n="date";break;case"integer":case"biginteger":case"decimal":case"float":n="number";break;case"string":case"text":n="text";break;case"":n="relation";break;default:n=t}return n},oe=y(p)`
  &.component-row,
  &.dynamiczone-row {
    position: relative;

    > ul:first-of-type {
      padding: 0 0 0 104px;
      position: relative;

      &::before {
        content: '';
        width: 0.4rem;
        height: ${({$isFromDynamicZone:t})=>t?"calc(100% - 65px)":"calc(100%)"};
        position: absolute;
        left: 7rem;
        border-radius: 4px;

        ${({$isFromDynamicZone:t,$isChildOfDynamicZone:n,theme:o})=>n?`background-color: ${o.colors.primary200};`:t?`background-color: ${o.colors.primary200};`:`background: ${o.colors.neutral150};`}
      }
    }
  }

  &.dynamiczone-row > ul:first-of-type {
    padding: 0;
  }
`,ie=({component:t,isFromDynamicZone:n=!1,firstLoopComponentUid:o})=>{const{components:s}=D(),l=O(s,t);return e.jsx(oe,{$isChildOfDynamicZone:n,className:"component-row",children:e.jsx(de,{type:l,firstLoopComponentUid:o||t,isFromDynamicZone:n,isSub:!0,secondLoopComponentUid:o?t:null})})},et=({type:t,customField:n=null,repeatable:o=!1,multiple:s=!1})=>{const{formatMessage:l}=A();let a=t;return["integer","biginteger","float","decimal"].includes(t)?a="number":["string"].includes(t)&&(a="text"),n?l({id:m("attribute.customField"),defaultMessage:"Custom field"}):e.jsxs(e.Fragment,{children:[o&&l({id:m("component.repeatable"),defaultMessage:"Repeatable"}),s&&l({id:m("media.multiple"),defaultMessage:"Multiple"})," ",l({id:m(`attribute.${a}`),defaultMessage:t})]})},tt=({isActive:t=!1,icon:n="dashboard"})=>{const o=J[n]||J.dashboard;return e.jsx(x,{alignItems:"center",background:t?"primary200":"neutral200",justifyContent:"center",height:8,width:8,borderRadius:"50%",children:e.jsx(o,{height:"2rem",width:"2rem"})})},se=y(p)`
  position: absolute;
  display: none;
  top: 5px;
  right: 0.8rem;

  svg {
    width: 1rem;
    height: 1rem;

    path {
      fill: ${({theme:t})=>t.colors.primary600};
    }
  }
`,nt=y(x)`
  width: 14rem;
  height: 8rem;
  position: relative;
  border: 1px solid ${({theme:t})=>t.colors.neutral200};
  background: ${({theme:t})=>t.colors.neutral100};
  border-radius: ${({theme:t})=>t.borderRadius};
  max-width: 100%;

  &.active,
  &:focus,
  &:hover {
    border: 1px solid ${({theme:t})=>t.colors.primary200};
    background: ${({theme:t})=>t.colors.primary100};
    color: ${({theme:t})=>t.colors.primary600};

    ${se} {
      display: block;
    }

    /* > ComponentIcon */
    > div:first-child {
      background: ${({theme:t})=>t.colors.primary200};
      color: ${({theme:t})=>t.colors.primary600};

      svg {
        path {
          fill: ${({theme:t})=>t.colors.primary600};
        }
      }
    }
  }
`,ot=({component:t,dzName:n,index:o,isActive:s=!1,isInDevelopmentMode:l=!1,onClick:a,forTarget:i,targetUid:c,disabled:f})=>{const{components:b,removeComponentFromDynamicZone:$}=D(),r=O(b,t),{icon:d,displayName:u}=r?.info||{},w=k=>{k.stopPropagation(),$({forTarget:i,targetUid:c,dzName:n,componentToRemoveIndex:o})};return e.jsxs(nt,{alignItems:"center",direction:"column",className:s?"active":"",borderRadius:"borderRadius",justifyContent:"center",paddingLeft:4,paddingRight:4,shrink:0,onClick:a,role:"tab",tabIndex:s?0:-1,cursor:"pointer","aria-selected":s,"aria-controls":`dz-${n}-panel-${o}`,id:`dz-${n}-tab-${o}`,children:[e.jsx(tt,{icon:d,isActive:s}),e.jsx(p,{marginTop:1,maxWidth:"100%",children:e.jsx(v,{variant:"pi",fontWeight:"bold",ellipsis:!0,children:u})}),l&&!f&&e.jsx(se,{cursor:"pointer",tag:"button",onClick:w,children:e.jsx(be,{})})]})},it=y(L)`
  width: 3.2rem;
  height: 3.2rem;
  padding: 0.9rem;
  border-radius: 6.4rem;
  background: ${({theme:t,disabled:n})=>n?t.colors.neutral100:t.colors.primary100};
  path {
    fill: ${({theme:t,disabled:n})=>n?t.colors.neutral600:t.colors.primary600};
  }
`,st=y(x)`
  flex-shrink: 0;
  width: 14rem;
  height: 8rem;
  justify-content: center;
  align-items: center;
`,rt=({components:t=[],addComponent:n,name:o,forTarget:s,targetUid:l,disabled:a=!1})=>{const{isInDevelopmentMode:i}=D(),[c,f]=R.useState(0),{formatMessage:b}=A(),$=d=>{c!==d&&f(d)},r=()=>{n(o)};return e.jsx(oe,{className:"dynamiczone-row",$isFromDynamicZone:!0,children:e.jsxs(p,{children:[e.jsx(p,{padding:2,paddingLeft:"104px",children:e.jsxs(x,{role:"tablist",gap:2,wrap:"wrap",children:[i&&e.jsx("button",{type:"button",onClick:r,disabled:a,style:{cursor:a?"not-allowed":"pointer"},children:e.jsxs(st,{direction:"column",alignItems:"stretch",gap:1,children:[e.jsx(it,{disabled:a}),e.jsx(v,{variant:"pi",fontWeight:"bold",textColor:a?"neutral600":"primary600",children:b({id:m("button.component.add"),defaultMessage:"Add a component"})})]})}),t.map((d,u)=>e.jsx(ot,{dzName:o||"",index:u,component:d,isActive:c===u,isInDevelopmentMode:i,onClick:()=>$(u),forTarget:s,targetUid:l,disabled:a},d))]})}),e.jsx(p,{children:t.map((d,u)=>e.jsx(p,{id:`dz-${o}-panel-${u}`,role:"tabpanel","aria-labelledby":`dz-${o}-tab-${u}`,style:{display:c===u?"block":"none"},children:e.jsx(ie,{isFromDynamicZone:!0,component:d},d)},d))})]})})},at=y(x)`
  justify-content: space-between;

  border-top: ${({theme:t,$isOverlay:n})=>n?"none":`1px solid ${t.colors.neutral150}`};

  padding-top: ${({theme:t})=>t.spaces[4]};
  padding-bottom: ${({theme:t})=>t.spaces[4]};

  opacity: ${({$isDragging:t})=>t?0:1};
  align-items: center;
`,lt=y(p)`
  list-style: none;
  list-style-type: none;
`,re=R.forwardRef((t,n)=>{const{style:o,...s}=t;return e.jsx(lt,{tag:"li",ref:n,...t.attributes,style:o,background:"neutral0",shadow:t.isOverlay?"filterShadow":"none","aria-label":t.item.name,children:e.jsx(dt,{...s})})}),dt=R.memo(t=>{const{item:n,firstLoopComponentUid:o,isFromDynamicZone:s,addComponentToDZ:l,secondLoopComponentUid:a,type:i,isDragging:c,isOverlay:f,handleRef:b,listeners:$}=t,r=f||c,[d,u]=R.useState(!0),w=i.status==="REMOVED",{contentTypes:k,removeAttribute:F,isInDevelopmentMode:M}=D(),{onOpenModalEditField:I,onOpenModalEditCustomField:S}=W(),{formatMessage:g}=A(),[h,j]=R.useState(!1),C=n.status==="REMOVED",P=n.type==="relation"&&n.relation.includes("morph"),ce=["integer","biginteger","float","decimal"].includes(n.type)?"number":n.type,E=n.type==="relation"?O(k,n.target):null,H=O(E,"plugin"),ue="target"in n&&n.target?"relation":ce,pe=T=>{T.stopPropagation(),X(k,n.name).length>0?j(!0):F({forTarget:i.modelType,targetUid:i.uid,attributeToRemoveName:n.name})},ge=()=>{F({forTarget:i.modelType,targetUid:i.uid,attributeToRemoveName:n.name}),j(!1)},me=()=>{j(!1)},q=()=>{if(!P&&n.configurable!==!1){const T=a||o||i.uid,Z=Qe(n.type),ye=n.type==="component"?"2":null;n.customField?S({forTarget:i.modelType,targetUid:T,attributeName:n.name,attributeType:Z,customFieldUid:n.customField}):I({forTarget:i.modelType,targetUid:T,attributeName:n.name,attributeType:Z,step:ye})}};let N;a&&o?N=2:o?N=1:N=0;const G=!w&&!C,fe=!w&&!C,he=w||C?"not-allowed":"move",xe=M&&n.configurable!==!1&&!P&&G;return e.jsxs(e.Fragment,{children:[e.jsxs(at,{$isOverlay:f,$isDragging:c,onClick:xe?q:void 0,paddingLeft:4,paddingRight:4,children:[e.jsxs(x,{alignItems:"center",overflow:"hidden",gap:2,children:[N!==0&&!f&&e.jsx(Ke,{color:s?"primary200":"neutral150"}),M&&e.jsx(U,{cursor:he,role:"Handle",ref:b,...$,variant:"ghost",withTooltip:!1,label:`${g({id:"app.utils.drag",defaultMessage:"Drag"})} ${n.name}`,disabled:w||C,children:e.jsx(je,{})}),e.jsxs(x,{gap:4,children:[e.jsxs(x,{gap:4,alignItems:"center",children:[e.jsx(Oe,{type:ue,customField:n.customField}),e.jsxs(v,{textColor:"neutral800",fontWeight:"bold",textDecoration:C?"line-through":"none",ellipsis:!0,overflow:"hidden",children:[n.name,"required"in n&&n.required&&e.jsx(v,{textColor:"danger600",children:"* "})]})]}),e.jsx(x,{children:e.jsxs(v,{textColor:"neutral600",children:[e.jsx(et,{type:n.type,customField:n.customField,repeatable:"repeatable"in n&&n.repeatable,multiple:"multiple"in n&&n.multiple}),"conditions"in n&&n.conditions&&Object.keys(n.conditions).length>0&&e.jsx(Ce,{margin:4,children:"conditional"}),n.type==="relation"&&e.jsxs(e.Fragment,{children:[" (",we(n.relation,n.targetAttribute),") ",E&&g({id:m("modelPage.attribute.with"),defaultMessage:"with"})," ",E&&e.jsx(Y,{onClick:T=>T.stopPropagation(),tag:K,to:`/plugins/content-type-builder/content-types/${E.uid}`,children:V(E.info.displayName)}),H&&`(${g({id:m("from"),defaultMessage:"from"})}: ${H})`]}),n.type==="component"&&e.jsx(ut,{uid:n.component})]})})]})]}),e.jsx(p,{children:e.jsx(x,{justifyContent:"flex-end",gap:1,onClick:T=>T.stopPropagation(),children:e.jsxs(e.Fragment,{children:[e.jsx(p,{children:n.status&&e.jsx(Ne,{status:n.status})}),["component","dynamiczone"].includes(n.type)&&e.jsx(U,{onClick:T=>{T.preventDefault(),T.stopPropagation(),u(!d)},"aria-expanded":d,label:g({id:"app.utils.toggle",defaultMessage:"Toggle"}),variant:"ghost",withTooltip:!1,children:e.jsx(ke,{"aria-hidden":!0,fill:"neutral500",style:{transform:`rotate(${d?"0deg":"-90deg"})`,transition:"transform 0.5s"}})}),M&&n.configurable!==!1?e.jsxs(e.Fragment,{children:[!P&&e.jsx(U,{onClick:q,label:`${g({id:"app.utils.edit",defaultMessage:"Edit"})} ${n.name}`,variant:"ghost",disabled:!G,children:e.jsx(Q,{})}),e.jsx(U,{onClick:pe,label:`${g({id:"global.delete",defaultMessage:"Delete"})} ${n.name}`,variant:"ghost",disabled:!fe,children:e.jsx(Te,{})}),e.jsx($e.Root,{open:h,onOpenChange:j,children:e.jsx(ve,{onConfirm:ge,onCancel:me,children:e.jsx(p,{children:e.jsxs(v,{children:[g({id:m("popUpWarning.bodyMessage.delete-attribute-with-conditions"),defaultMessage:"The following fields have conditions that depend on this field: "}),e.jsx(v,{fontWeight:"bold",children:X(k,n.name).map(({attribute:T})=>T).join(", ")}),g({id:m("popUpWarning.bodyMessage.delete-attribute-with-conditions-end"),defaultMessage:". Are you sure you want to delete it?"})]})})})})]}):e.jsx(x,{padding:2,children:e.jsx(De,{fill:"neutral500"})})]})})})]}),e.jsxs(ct,{$shouldHideNestedInfos:r,$isOpen:d,children:[n.type==="component"&&e.jsx(ie,{...n,isFromDynamicZone:s,firstLoopComponentUid:o}),n.type==="dynamiczone"&&e.jsx(rt,{...n,disabled:w||n.status==="REMOVED",addComponent:l,forTarget:i.modelType,targetUid:i.uid})]})]})}),ct=y(p)`
  display: ${({$shouldHideNestedInfos:t})=>t?"none":"block"};
  max-height: ${({$isOpen:t})=>t?"9999px":"0px"};
  overflow: hidden;

  transition: ${({$isOpen:t})=>t?"max-height 1s ease-in-out":"max-height 0.5s cubic-bezier(0, 1, 0, 1)"};
`,ut=({uid:t})=>{const{components:n}=D(),o=O(n,t);return e.jsxs(e.Fragment,{children:[" (",e.jsx(Y,{onClick:s=>s.stopPropagation(),tag:K,to:`/plugins/content-type-builder/component-categories/${o.category}/${o.uid}`,children:V(o.info.displayName)}),")"]})},ae=y(p)`
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
    fill: ${({theme:t,color:n})=>t.colors[`${n}600`]};
  }
`,le=y(p)`
  border-radius: 0 0 ${({theme:t})=>t.borderRadius} ${({theme:t})=>t.borderRadius};
  display: block;
  width: 100%;
  border: none;
  position: relative;
`,pt=({children:t,icon:n,color:o,...s})=>e.jsx(le,{paddingBottom:4,paddingTop:4,paddingLeft:"6rem",tag:"button",type:"button",...s,children:e.jsxs(x,{children:[e.jsx(ae,{color:o,"aria-hidden":!0,background:`${o}200`,children:n}),e.jsx(p,{paddingLeft:3,children:e.jsx(v,{variant:"pi",fontWeight:"bold",textColor:`${o}600`,children:t})})]})}),gt=({children:t,icon:n,color:o,...s})=>e.jsxs("div",{children:[e.jsx(Me,{}),e.jsx(le,{tag:"button",background:`${o}100`,padding:5,...s,children:e.jsxs(x,{children:[e.jsx(ae,{color:o,"aria-hidden":!0,background:`${o}200`,children:n}),e.jsx(p,{paddingLeft:3,children:e.jsx(v,{variant:"pi",fontWeight:"bold",textColor:`${o}600`,children:t})})]})})]}),mt=y(p)`
  white-space: nowrap;
  list-style: none;
  list-style-type: none;
`,ft=t=>{const{isInDevelopmentMode:n}=D(),{isDragging:o,attributes:s,listeners:l,setNodeRef:a,transform:i,transition:c,setActivatorNodeRef:f}=qe({disabled:!n||t.item.status==="REMOVED"||t.type.status==="REMOVED",id:t.item.id,data:{index:t.item.index}}),b={transform:Ge.Transform.toString({x:i?.x??0,y:i?.y??0,scaleX:1,scaleY:1}),transition:c};return e.jsx(re,{ref:a,handleRef:f,isDragging:o,attributes:s,listeners:l,style:b,...t})},de=({addComponentToDZ:t,firstLoopComponentUid:n,isFromDynamicZone:o=!1,isMain:s=!1,isSub:l=!1,secondLoopComponentUid:a,type:i})=>{const{formatMessage:c}=A(),{trackUsage:f}=ee(),{isInDevelopmentMode:b,moveAttribute:$}=D(),{onOpenModalAddField:r}=W(),d=i?.attributes.map((h,j)=>({id:`${i.uid}_${h.name}`,index:j,...h})),[u,w]=R.useState(null),k=i?.status==="REMOVED",F=Be(Pe(_e));function M({active:h}){h&&w(h.id)}function I(h){const{active:j,over:C}=h;w(null),C&&j.id!==C.id&&$({forTarget:i.modelType,targetUid:i.uid,from:j.data.current.index,to:C.data.current.index})}const S=d.find(h=>h.id===u),g=()=>{k||(f("hasClickedCTBAddFieldBanner"),r({forTarget:i?.modelType,targetUid:i.uid}))};return i?.attributes.length===0&&s?e.jsx(Re,{action:e.jsx(te.contentTypeBuilder.AddFields,{children:e.jsx(B,{onClick:g,size:"L",startIcon:e.jsx(L,{}),variant:"secondary",children:c({id:m("table.button.no-fields"),defaultMessage:"Add new field"})})}),content:c(i.modelType==="contentType"?{id:m("table.content.no-fields.collection-type"),defaultMessage:"Add your first field to this Collection-Type"}:{id:m("table.content.no-fields.component"),defaultMessage:"Add your first field to this component"}),hasRadius:!0,icon:e.jsx(Ue,{width:"16rem"})}):e.jsxs(Ze,{sensors:F,collisionDetection:ze,onDragEnd:I,onDragStart:M,onDragCancel:()=>w(null),modifiers:[Je],children:[e.jsxs(mt,{tag:"ul",children:[Fe.createPortal(e.jsx(Ve,{zIndex:10,children:S&&e.jsx(re,{isOverlay:!0,item:S,firstLoopComponentUid:n,isFromDynamicZone:o,secondLoopComponentUid:a,type:i,addComponentToDZ:t})}),document.body),e.jsx(We,{items:d,strategy:He,children:d.map(h=>e.jsx(ft,{item:h,firstLoopComponentUid:n,isFromDynamicZone:o,secondLoopComponentUid:a,type:i,addComponentToDZ:t},h.id))})]}),s&&b&&e.jsx(gt,{cursor:k?"normal":"pointer",icon:e.jsx(L,{}),onClick:g,color:k?"neutral":"primary",children:c({id:m(`form.button.add.field.to.${i.modelType==="component"?"component":i.kind}`),defaultMessage:"Add another field"})}),l&&b&&e.jsx(pt,{cursor:k?"normal":"pointer",icon:e.jsx(L,{}),onClick:g,color:o&&!k?"primary":"neutral",children:c({id:m("form.button.add.field.to.component"),defaultMessage:"Add another field"})})]})},z={collectionTypesConfigurations:[{action:"plugin::content-manager.collection-types.configure-view",subject:null}],componentsConfigurations:[{action:"plugin::content-manager.components.configure-layout",subject:null}],singleTypesConfigurations:[{action:"plugin::content-manager.single-types.configure-view",subject:null}]},ht=t=>t.modelType==="contentType"?t.kind==="singleType"?z.singleTypesConfigurations:z.collectionTypesConfigurations:z.componentsConfigurations,xt=t=>{switch(t.modelType){case"contentType":switch(t.kind){case"singleType":return`/content-manager/single-types/${t.uid}/configurations/edit`;case"collectionType":return`/content-manager/collection-types/${t.uid}/configurations/edit`}case"component":return`/content-manager/components/${t.uid}/configurations/edit`}},yt=y(B)`
  white-space: nowrap;
`,bt=R.memo(({disabled:t,type:n})=>{const{formatMessage:o}=A(),s=Se(),l=ht(n),a=o({id:"content-type-builder.form.button.configure-view",defaultMessage:"Configure the view"}),i=()=>{if(t)return!1;const b=xt(n);return s(b),!1},{isLoading:c,allowedActions:f}=Ae(l);return c||!f.canConfigureView&&!f.canConfigureLayout?null:e.jsx(yt,{startIcon:e.jsx(Ie,{}),variant:"tertiary",onClick:i,disabled:t,children:a})}),jt=y(ne.Header)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,St=()=>{const{isInDevelopmentMode:t,contentTypes:n,components:o,isLoading:s}=D(),{formatMessage:l}=A(),{trackUsage:a}=ee(),{contentTypeUid:i,componentUid:c}=Ee(),{onOpenModalAddComponentsToDZ:f,onOpenModalAddField:b,onOpenModalEditSchema:$}=W(),r=i?n[i]:c?o[c]:null;if(s)return null;if(!r){const j=Object.values(n).filter(C=>C.visible===!0&&!C.plugin).map(C=>C.uid).sort();return j.length>0?e.jsx(_,{to:`/plugins/content-type-builder/content-types/${j[0]}`}):e.jsx(_,{to:"/plugins/content-type-builder/content-types/create-content-type"})}const d="plugin"in r&&r?.plugin!==void 0,u=i?"contentType":"component",w=r?.info?.displayName??"",k=t&&!d,F=j=>{f({dynamicZoneTarget:j,targetUid:r.uid})},M=()=>{if("kind"in r){r?.kind==="collectionType"&&a("willEditNameOfContentType"),r?.kind==="singleType"&&a("willEditNameOfSingleType"),$({modalType:u,forTarget:u,targetUid:r.uid,kind:r?.kind});return}$({modalType:u,forTarget:u,targetUid:r.uid})},I=l({id:m("table.button.no-fields"),defaultMessage:"Add new field"}),S=l({id:m("button.attributes.add.another"),defaultMessage:"Add another field"}),g=r.status==="REMOVED",h=t&&e.jsxs(x,{gap:2,children:[e.jsx(bt,{type:r,disabled:r.status==="NEW"||g},"link-to-cm-settings-view"),e.jsx(B,{startIcon:e.jsx(Q,{}),variant:"tertiary",onClick:M,disabled:!k||g,children:l({id:"app.utils.edit",defaultMessage:"Edit"})}),e.jsx(B,{startIcon:e.jsx(L,{}),variant:"secondary",minWidth:"max-content",onClick:()=>{b({forTarget:u,targetUid:r.uid})},disabled:g,children:r.attributes.length===0?I:S})]});return e.jsxs(e.Fragment,{children:[e.jsx(te.contentTypeBuilder.Introduction,{children:e.jsx(p,{})}),g&&e.jsx(x,{background:"danger100",justifyContent:"center",padding:4,children:e.jsxs(x,{gap:2,children:[e.jsx(Le,{fill:"danger600",height:"2rem",width:"2rem"}),e.jsx(v,{children:l({id:m("table.warning.deleted"),defaultMessage:"This {kind} has been deleted"},{kind:r.modelType==="contentType"?"Content Type":"Component"})})]})}),e.jsx(jt,{id:"title",primaryAction:h,title:V(w)}),e.jsx(ne.Content,{children:e.jsx(p,{background:"neutral0",shadow:"filterShadow",hasRadius:!0,overflow:"auto",borderColor:"neutral150",children:e.jsx(de,{type:r,addComponentToDZ:F,isMain:!0})})})]})};export{St as default};
