"use strict";(self.webpackChunkfmodel_ts_doc=self.webpackChunkfmodel_ts_doc||[]).push([[427],{5580:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>s,metadata:()=>d,toc:()=>l});var r=t(4848),i=t(8453);const s={sidebar_position:2},o="Kotlin (Multiplatform)",d={id:"other/type-script",title:"Kotlin (Multiplatform)",description:"Kotlin is ideal thanks to its language features and type system, which enforce correctness and reduce the likelihood of bugs.",source:"@site/docs/other/type-script.md",sourceDirName:"other",slug:"/other/type-script",permalink:"/fmodel-ts/docs/other/type-script",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/other/type-script.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Rust",permalink:"/fmodel-ts/docs/other/rust"}},c={},l=[{value:"Decide",id:"decide",level:2},{value:"Evolve",id:"evolve",level:2},{value:"Further reading",id:"further-reading",level:2}];function a(e){const n={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"kotlin-multiplatform",children:"Kotlin (Multiplatform)"})}),"\n",(0,r.jsx)(n.p,{children:"Kotlin is ideal thanks to its language features and type system, which enforce correctness and reduce the likelihood of bugs.\nBy modeling the domain accurately, we aim to use the Kotlin compiler to catch errors early and prevent them from propagating to runtime."}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["You can find the source code for the ",(0,r.jsx)(n.code,{children:"fmodel"})," ",(0,r.jsx)(n.a,{href:"https://fraktalio.com/fmodel/",children:"here"})]}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"decide",children:"Decide"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.code,{children:"decide: (C, S) -> Flow<E>"})}),"\n",(0,r.jsxs)(n.p,{children:["On a higher level of abstraction, any information system is responsible for handling the intent (",(0,r.jsx)(n.code,{children:"Command"}),") and based on\nthe current ",(0,r.jsx)(n.code,{children:"State"}),", produce new facts (",(0,r.jsx)(n.code,{children:"Events"}),"):"]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["given the current ",(0,r.jsx)(n.code,{children:"State/S"})," ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["when ",(0,r.jsx)(n.code,{children:"Command/C"})," is handled ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["expect ",(0,r.jsx)(n.code,{children:"list"})," of new ",(0,r.jsx)(n.code,{children:"Events/E"})," to be published/emitted ",(0,r.jsx)(n.em,{children:"on the output"})]}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"evolve",children:"Evolve"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.code,{children:"evolve: (S, E) -> S"})}),"\n",(0,r.jsxs)(n.p,{children:["The new state is always evolved out of the current state ",(0,r.jsx)(n.code,{children:"S"})," and the current event ",(0,r.jsx)(n.code,{children:"E"}),":"]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["given the current ",(0,r.jsx)(n.code,{children:"State/S"})," ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["when ",(0,r.jsx)(n.code,{children:"Event/E"})," is handled ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["expect new ",(0,r.jsx)(n.code,{children:"State/S"})," to be published ",(0,r.jsx)(n.em,{children:"on the output"})]}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:"Two functions are wrapped in a datatype class (algebraic data structure), which is generalized with three generic\nparameters:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-kotlin",children:"data class Decider<in C, S, E>(\n    override val decide: (C, S) -> Flow<E>,\n    override val evolve: (S, E) -> S,\n    override val initialState: S\n) : IDecider<C, S, E> \n"})}),"\n",(0,r.jsx)(n.h2,{id:"further-reading",children:"Further reading"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.a,{href:"https://fraktalio.com/fmodel/",children:(0,r.jsx)(n.strong,{children:"Read more"})})})]})}function h(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(a,{...e})}):a(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>o,x:()=>d});var r=t(6540);const i={},s=r.createContext(i);function o(e){const n=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),r.createElement(s.Provider,{value:n},e.children)}}}]);