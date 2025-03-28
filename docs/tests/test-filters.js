/*******************************************************************************

    uBlock Origin - a comprehensive, efficient content blocker
    Copyright (C) 2025-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock

*/

const qs$ = s => document.querySelector(s);
const hide = s => { qs$(s).style.display = 'none'; }
const jobs = [];

/******************************************************************************/

jobs.push(function bnf1() {
    if ( window.bnf1Sentinel !== undefined ) { return; }
    hide('#bnf1 .fail');
});

jobs.push(function bnf2() {
    const img = qs$('#bnf2 img');
    img.decode().then(( ) => {
        if ( img.naturalWidth === 1 ) { return; }
        hide('#bnf2 .fail');
    }).catch(( ) => {
        hide('#bnf2 .fail');
    });
});

jobs.push(function bnf3() {
    if ( window.bnf3Sentinel === true ) { return; }
    hide('#bnf3 .fail');
});

// This just tests whether the filtering engine can deal with a very long URL
jobs.push(function bnf4() {
    const looongURL = `/${'a-'.repeat(16384)}bnf4.gif`;
    fetch(looongURL).then(response => response.text()).catch(( ) => { });
});

jobs.push(function pcf18() {
    self.setTimeout(( ) => {
        qs$('.watchattr1 .pass > .pass').className = 'fail';
        qs$('.watchattr1 .pass > .fail b.ok').className = 'notok';
    }, 100);
});

jobs.push(function sf1() {
    if ( self.sf1Sentinel === true ) { return; }
    hide('#sf1 .fail');
});

jobs.push(function sf2() {
    const check = ( ) => {
        if ( self.sf2Sentinel === true ) { return; }
        hide('#sf2 .fail');
    };
    setTimeout(( ) => { check(); }, 100);
});

jobs.push(function anf1() {
    const img = qs$('#anf1 img');
    img.decode().then(( ) => {
        if ( img.naturalWidth !== 32 ) { return; }
        hide('#anf1 .fail');
    });
});

jobs.push(function anf2() {
    if ( qs$('#anf2 iframe').contentWindow.anf2Sentinel === true ) { return; }
    hide('#anf2 .fail');
});

jobs.push(function sf3() {
    if ( self.sf3Sentinel === undefined ) { return; }
    if ( qs$('#sf3 iframe').contentWindow.sf3Sentinel === true ) { return; }
    hide('#sf3 .fail');
});

jobs.push(function sf4() {
    self.sf4Sentinel.then(result => {
        if ( Array.isArray(result) === false ) { return; }
        if ( result.length !== 3 ) { return; }
        if ( result[0].a !== 1 ) { return; }
        if ( result[1].b !== undefined ) { return; }
        if ( result[2].c !== 'foo' ) { return; }
        hide('#sf4 .fail');
    });
});

jobs.push(function sf5() {
    self.sf5Sentinel.then(result => {
        if ( Array.isArray(result) === false ) { return; }
        if ( result.length !== 3 ) { return; }
        if ( result[0].a !== 1 ) { return; }
        if ( result[1].b !== undefined ) { return; }
        if ( result[2].c !== 'foo' ) { return; }
        hide('#sf5 .fail');
    });
});

jobs.push(function sf6() {
    if ( self.sf6Sentinel === undefined ) { return; }
    if ( self.sf6Sentinel.getElementsByTagName !== document.body.getElementsByTagName ) { return; }
    hide('#sf6 .fail');
});

jobs.push(async function x() {
    const obj = await self.ffubo1Sentinel;
    if ( obj instanceof Object === false ) { return; }
    if ( obj.store.book[0].price !== 0 ) { return; }
    if ( obj.store.book[1].price !== 0 ) { return; }
    if ( obj.store.book[2].price !== 0 ) { return; }
    if ( obj.store.book[3].price !== 0 ) { return; }
    if ( obj.store.bicycle.price !== 0 ) { return; }
    hide('#ffubo1 .fail');
});

jobs.push(( ) => {
    qs$('#toggleFilters').onclick = ( ) => {
        document.body.classList.toggle('showFilters');
    };
});

/******************************************************************************/

self.addEventListener('load', ( ) => {
    while ( jobs.length !== 0 ) {
        const job = jobs.shift();
        try { job(); } catch { }
    }
}, { once: true });