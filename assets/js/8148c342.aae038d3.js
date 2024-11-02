"use strict";(self.webpackChunkfmodel_ts_doc=self.webpackChunkfmodel_ts_doc||[]).push([[282],{7392:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>o,contentTitle:()=>d,default:()=>h,frontMatter:()=>i,metadata:()=>c,toc:()=>l});var r=t(4848),s=t(8453);const i={sidebar_position:1},d="Rust",c={id:"other/rust",title:"Rust",description:"Domain modeling, influenced by functional programming principles, aims to represent the business domain in the code accurately.",source:"@site/docs/other/rust.md",sourceDirName:"other",slug:"/other/rust",permalink:"/fmodel-ts/docs/other/rust",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Other Programming Languages",permalink:"/fmodel-ts/docs/category/other-programming-languages"},next:{title:"Kotlin (Multiplatform)",permalink:"/fmodel-ts/docs/other/type-script"}},o={},l=[{value:"Decide",id:"decide",level:2},{value:"Evolve",id:"evolve",level:2},{value:"Further reading",id:"further-reading",level:2}];function a(e){const n={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"rust",children:"Rust"})}),"\n",(0,r.jsxs)(n.p,{children:["Domain modeling, influenced by functional programming principles, aims to represent the business domain in the code accurately.\n",(0,r.jsx)(n.a,{href:"https://www.rust-lang.org/",children:"Rust"})," is ideal thanks to its ownership model and type system, which enforce correctness and reliability - enabling you to eliminate many classes of bugs at compile-time, guarantying memory-safety and thread-safety."]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["You can find the source code for the ",(0,r.jsx)(n.code,{children:"fmodel-rust"})," ",(0,r.jsx)(n.a,{href:"https://github.com/fraktalio/fmodel-rust",children:"here"})]}),"\n",(0,r.jsxs)(n.li,{children:["Publicly available at ",(0,r.jsx)(n.a,{href:"https://crates.io/crates/fmodel-rust",children:"crates.io"})," and"]}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"https://docs.rs/fmodel-rust/latest/fmodel_rust/",children:"docs.rs"})}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"decide",children:"Decide"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.code,{children:"type DecideFunction<'a, C, S, E> = Box<dyn Fn(&C, &S) -> Vec<E> + 'a + Send + Sync>"})}),"\n",(0,r.jsxs)(n.p,{children:["On a higher level of abstraction, any information system is responsible for handling the intent (",(0,r.jsx)(n.code,{children:"Command"}),") and based on\nthe current ",(0,r.jsx)(n.code,{children:"State"}),", produce new facts (",(0,r.jsx)(n.code,{children:"Events"}),"):"]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["given the current ",(0,r.jsx)(n.code,{children:"State/S"})," ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["when ",(0,r.jsx)(n.code,{children:"Command/C"})," is handled ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["expect ",(0,r.jsx)(n.code,{children:"Vec"})," of new ",(0,r.jsx)(n.code,{children:"Events/E"})," to be published/emitted ",(0,r.jsx)(n.em,{children:"on the output"})]}),"\n"]}),"\n",(0,r.jsx)(n.h2,{id:"evolve",children:"Evolve"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.code,{children:"type EvolveFunction<'a, S, E> = Box<dyn Fn(&S, &E) -> S + 'a + Send + Sync>"})}),"\n",(0,r.jsxs)(n.p,{children:["The new state is always evolved out of the current state ",(0,r.jsx)(n.code,{children:"S"})," and the current event ",(0,r.jsx)(n.code,{children:"E"}),":"]}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsxs)(n.li,{children:["given the current ",(0,r.jsx)(n.code,{children:"State/S"})," ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["when ",(0,r.jsx)(n.code,{children:"Event/E"})," is handled ",(0,r.jsx)(n.em,{children:"on the input"}),","]}),"\n",(0,r.jsxs)(n.li,{children:["expect new ",(0,r.jsx)(n.code,{children:"State/S"})," to be published ",(0,r.jsx)(n.em,{children:"on the output"})]}),"\n"]}),"\n",(0,r.jsx)(n.p,{children:"Two functions are wrapped in a datatype class (algebraic data structure), which is generalized with three generic\nparameters:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-rust",children:"pub struct Decider<'a, C: 'a, S: 'a, E: 'a> {\n    pub decide: DecideFunction<'a, C, S, E>,\n    pub evolve: EvolveFunction<'a, S, E>,\n    pub initial_state: InitialStateFunction<'a, S>,\n}\n"})}),"\n",(0,r.jsx)(n.h2,{id:"further-reading",children:"Further reading"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.a,{href:"https://docs.rs/fmodel-rust/latest/fmodel_rust/",children:(0,r.jsx)(n.strong,{children:"Read more"})})})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(a,{...e})}):a(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>d,x:()=>c});var r=t(6540);const s={},i=r.createContext(s);function d(e){const n=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:d(e.components),r.createElement(i.Provider,{value:n},e.children)}}}]);