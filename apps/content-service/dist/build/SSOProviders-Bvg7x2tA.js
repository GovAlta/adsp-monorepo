import{e as a,p as d,a as h,j as t,bl as i,bF as c,a9 as m,s as x}from"./strapi-CZE0NOhr.js";const p=({providers:e,displayAllProviders:r})=>{const{formatMessage:o}=h();return r?t.jsx(i.Root,{gap:4,children:e.map(s=>t.jsx(i.Item,{col:4,direction:"column",alignItems:"stretch",children:t.jsx(n,{provider:s})},s.uid))}):e.length>2&&!r?t.jsxs(i.Root,{gap:4,children:[e.slice(0,2).map(s=>t.jsx(i.Item,{col:4,direction:"column",alignItems:"stretch",children:t.jsx(n,{provider:s})},s.uid)),t.jsx(i.Item,{col:4,direction:"column",alignItems:"stretch",children:t.jsx(c,{label:o({id:"global.see-more"}),children:t.jsx(l,{as:m,to:"/auth/providers",children:t.jsx("span",{"aria-hidden":!0,children:"•••"})})})})]}):t.jsx(u,{justifyContent:"center",children:e.map(s=>t.jsx(n,{provider:s},s.uid))})},u=a(d)`
  & a:not(:first-child):not(:last-child) {
    margin: 0 ${({theme:e})=>e.spaces[2]};
  }
  & a:first-child {
    margin-right: ${({theme:e})=>e.spaces[2]};
  }
  & a:last-child {
    margin-left: ${({theme:e})=>e.spaces[2]};
  }
`,n=({provider:e})=>t.jsx(c,{label:e.displayName,children:t.jsx(l,{href:`${window.strapi.backendURL}/admin/connect/${e.uid}`,children:e.icon?t.jsx("img",{src:e.icon,"aria-hidden":!0,alt:"",height:"32px"}):t.jsx(x,{children:e.displayName})})}),l=a.a`
  width: 13.6rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4.8rem;
  border: 1px solid ${({theme:e})=>e.colors.neutral150};
  border-radius: ${({theme:e})=>e.borderRadius};
  text-decoration: inherit;
  &:link {
    text-decoration: none;
  }
  color: ${({theme:e})=>e.colors.neutral600};
`;export{p as S};
