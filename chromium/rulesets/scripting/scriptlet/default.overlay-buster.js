/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2014-present Raymond Hill

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

/* eslint-disable indent */

// ruleset: default

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_overlayBuster = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [[]];

const hostnamesMap = new Map([["cimanow.cc",0],["cimanow.online",0]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function overlayBuster() {
    if ( window !== window.top ) { return; }
    var tstart;
    var ttl = 30000;
    var delay = 0;
    var delayStep = 50;
    var buster = function() {
        var docEl = document.documentElement,
            bodyEl = document.body,
            vw = Math.min(docEl.clientWidth, window.innerWidth),
            vh = Math.min(docEl.clientHeight, window.innerHeight),
            tol = Math.min(vw, vh) * 0.05,
            el = document.elementFromPoint(vw/2, vh/2),
            style, rect;
        for (;;) {
            if ( el === null || el.parentNode === null || el === bodyEl ) {
                break;
            }
            style = window.getComputedStyle(el);
            if ( parseInt(style.zIndex, 10) >= 1000 || style.position === 'fixed' ) {
                rect = el.getBoundingClientRect();
                if ( rect.left <= tol && rect.top <= tol && (vw - rect.right) <= tol && (vh - rect.bottom) < tol ) {
                    el.parentNode.removeChild(el);
                    tstart = Date.now();
                    el = document.elementFromPoint(vw/2, vh/2);
                    bodyEl.style.setProperty('overflow', 'auto', 'important');
                    docEl.style.setProperty('overflow', 'auto', 'important');
                    continue;
                }
            }
            el = el.parentNode;
        }
        if ( (Date.now() - tstart) < ttl ) {
            delay = Math.min(delay + delayStep, 1000);
            setTimeout(buster, delay);
        }
    };
    var domReady = function(ev) {
        if ( ev ) {
            document.removeEventListener(ev.type, domReady);
        }
        tstart = Date.now();
        setTimeout(buster, delay);
    };
    if ( document.readyState === 'loading' ) {
        document.addEventListener('DOMContentLoaded', domReady);
    } else {
        domReady();
    }
}

/******************************************************************************/

const hnParts = [];
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
} catch {
}
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { overlayBuster(...argsList[i]); }
    catch { }
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

uBOL_overlayBuster();

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
