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
    if ( window.corp1Analytics === true ) { return; }
    hide('#bnf1 .fail');
});

jobs.push(function bnf2() {
    const img = qs$('#bnf2 img');
    if ( img.naturalWidth === 1 ) { return; }
    hide('#bnf2 .fail');
});

jobs.push(function sf1() {
    if ( self.corp3Tracker === true ) { return; }
    hide('#sf1 .fail');
});

jobs.push(function sf2() {
    const check = ( ) => {
        if ( self.corp4AdblockDetected === true ) { return; }
        hide('#sf2 .fail');
    };
    setTimeout(( ) => { check(); }, 100);
});

/******************************************************************************/

self.addEventListener('load', ev => {
    while ( jobs.length !== 0 ) {
        const job = jobs.shift();
        job();
    }
}, { once: true });