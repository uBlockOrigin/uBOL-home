/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_noXhrIf = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["request=adb"],["doubleclick"],["adsbygoogle"],["homad-global-configs"],["/enthusiastgaming|googleoptimize|googletagmanager/"],["/doubleclick|googlesyndication/"],["/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/"],["ad_"],["/\\/ad\\/g\\/1/"],["ads"],["/googlesyndication|adpushup|adrecover/"],["svonm"],["/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/"],["inklinkor.com"],["googlesyndication"],["damoh"],["/youboranqs01|spotx|springserve/"],["/a-mo\\.net|adnxs\\.com|prebid|creativecdn\\.com|e-planning\\.net|quantumdex\\.io/"],["pop"],["/^/"],["/ad"],["prebid"],["wpadmngr"],["/ads"],["pub.network"],["url:googlesyndication"],["/analytics|livestats/"],["mahimeta"],["notifier"],["/ad-"],["/coinzillatag|czilladx/"],["czilladx"],["php"],["/googlesyndication|doubleclick/"],["popunder"],["adx"],["cls_report?"],["method:HEAD"],["adswizz.com"],["tag"],["/pagead2\\.googlesyndication\\.com|inklinkor\\.com/"],["googletagmanager"],["pagead2.googlesyndication.com"],["time-events"],["method:POST url:/logImpressions"],["method:POST"],["utreon.com/pl/api/event method:POST"],["log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST"],["mobileanalytics"],["cloudflare.com/cdn-cgi/trace"],["amazonaws"],["/recommendations."],["/api/analytics"],["api"],["lr-ingest.io"],["/gtm.js"],["ip-api"]];

const hostnamesMap = new Map([["handelsblatt.com",0],["moviepilot.de",1],["sbs.com.au",1],["minhaconexao.com.br",1],["videolyrics.in",1],["sportshub.to",1],["topsporter.net",1],["meteoetradar.com",1],["gala.fr",1],["geo.fr",1],["voici.fr",1],["pinsystem.co.uk",2],["texture-packs.com",2],["manyakan.com",2],["persianhive.com",2],["boainformacao.com.br",2],["privatenewz.com",2],["gcertificationcourse.com",2],["portaliz.site",2],["ghior.com",2],["tech-story.net",2],["visalist.io",2],["gyanitheme.com",2],["hipsonyc.com",2],["litecoin.host",2],["wetter.de",3],["thesimsresource.com",4],["gnomio.com",5],["techhelpbd.com",5],["tuxnews.it",5],["frkn64modding.com",7],["channel4.com",8],["duplichecker.com",9],["gearingcommander.com",9],["novelmultiverse.com",9],["taming.io",9],["snlookup.com",9],["globfone.com",9],["chimicamo.org",9],["webforefront.com",9],["apkmagic.com.ar",9],["reaperscans.id",9],["short1.site",9],["telewizja-streamer.xyz",9],["searchenginereports.net",10],["plagiarismdetector.net",10],["vox.de",11],["vip.de",11],["rtl.de",11],["fitforfun.de",11],["desired.de",11],["kino.de",11],["cinema.de",11],["nationalgeographic.fr",12],["oko.sh",13],["freegogpcgames.com",14],["informaxonline.com",[14,20]],["cambb.xxx",14],["gaminplay.com",14],["blisseyhusband.in",14],["routech.ro",14],["rontechtips.com",14],["homeairquality.org",14],["techtrim.tech",14],["pigeonburger.xyz",14],["freedownloadvideo.net",14],["askpaccosi.com",14],["crypto4tun.com",14],["fusedgt.com",14],["apkowner.org",14],["appsmodz.com",14],["bingotingo.com",14],["superpsx.com",14],["financeflix.in",14],["technoflip.in",14],["stringreveals.com",14],["fox.com",14],["obutecodanet.ig.com.br",14],["firmwarex.net",14],["softwaretotal.net",14],["freecodezilla.net",14],["movieslegacy.com",14],["iconmonstr.com",14],["rbxscripts.net",14],["adslink.pw",14],["comentariodetexto.com",14],["wordpredia.com",14],["karanpc.com",14],["livsavr.co",14],["gsmhamza.com",14],["hlspanel.xyz",14],["webmatrices.com",14],["dropnudes.com",14],["ftuapps.dev",14],["onehack.us",14],["paste.bin.sx",14],["privatenudes.com",14],["fordownloader.com",14],["golem.de",15],["rakuten.tv",16],["djxmaza.in",17],["thecubexguide.com",17],["zdam.xyz",18],["pasend.link",19],["freewp.io",19],["hiraethtranslation.com",20],["jetpunk.com",21],["mcrypto.club",22],["coinsparty.com",22],["simplebits.io",23],["flightsim.to",24],["stardeos.com",25],["goduke.com",26],["1apple.xyz",27],["lavanguardia.com",28],["foodsdictionary.co.il",29],["freesolana.top",30],["faucetclub.net",31],["claim.fun",31],["faucetcrypto.net",31],["btc25.org",31],["doge25.in",31],["cashbux.work",31],["farescd.com",32],["getintoway.com",33],["freebinance.top",34],["freelitecoin.top",35],["freetron.top",35],["earncrypto.co.in",35],["citi.com",36],["filmi7.com",37],["hotfm.audio",38],["luffytra.xyz",39],["tii.la",40],["maxt.church",41],["history.com",43],["docs.google.com",44],["endbasic.dev",45],["jmmv.dev",45],["fingerprint.com",45],["utreon.com",46],["zhihu.com",47],["viu.com",48],["myair2.resmed.com",49],["travelerdoor.com",49],["bestiefy.com",50],["azby.fmworld.net",51],["unrealengine.com",52],["wco.tv",53],["dark-gaming.com",54],["securegames.iwin.com",55],["neilpatel.com",56]]);

const entitiesMap = new Map([["an1me",5],["einthusan",6],["khatrimaza",9],["moviegan",9],["writedroid",9],["nsw2u",14],["cinemakottaga",14],["asiaon",14],["apkmaven",14],["bg-gledai",14],["gledaitv",14],["dropgalaxy",17],["zone-telechargement",19],["empire-stream",42]]);

const exceptionsMap = new Map([["dev.fingerprint.com",[45]]]);

/******************************************************************************/

function noXhrIf(
    propsToMatch = '',
    directive = ''
) {
    if ( typeof propsToMatch !== 'string' ) { return; }
    const xhrInstances = new WeakMap();
    const propNeedles = parsePropertiesToMatch(propsToMatch, 'url');
    const log = propNeedles.size === 0 ? console.log.bind(console) : undefined;
    const warOrigin = scriptletGlobals.get('warOrigin');
    const generateRandomString = len => {
            let s = '';
            do { s += Math.random().toString(36).slice(2); }
            while ( s.length < 10 );
            return s.slice(0, len);
    };
    const generateContent = async directive => {
        if ( directive === 'true' ) {
            return generateRandomString(10);
        }
        if ( directive.startsWith('war:') ) {
            if ( warOrigin === undefined ) { return ''; }
            return new Promise(resolve => {
                const warName = directive.slice(4);
                const fullpath = [ warOrigin, '/', warName ];
                const warSecret = scriptletGlobals.get('warSecret');
                if ( warSecret !== undefined ) {
                    fullpath.push('?secret=', warSecret);
                }
                const warXHR = new XMLHttpRequest();
                warXHR.responseType = 'text';
                warXHR.onloadend = ev => {
                    resolve(ev.target.responseText || '');
                };
                warXHR.open('GET', fullpath.join(''));
                warXHR.send();
            });
        }
        return '';
    };
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(method, url, ...args) {
            if ( log !== undefined ) {
                log(`uBO: xhr.open(${method}, ${url}, ${args.join(', ')})`);
                return super.open(method, url, ...args);
            }
            if ( warOrigin !== undefined && url.startsWith(warOrigin) ) {
                return super.open(method, url, ...args);
            }
            const haystack = { method, url };
            if ( matchObjectProperties(propNeedles, haystack) ) {
                xhrInstances.set(this, haystack);
            }
            return super.open(method, url, ...args);
        }
        send(...args) {
            const haystack = xhrInstances.get(this);
            if ( haystack === undefined ) {
                return super.send(...args);
            }
            let promise = Promise.resolve({
                xhr: this,
                directive,
                props: {
                    readyState: { value: 4 },
                    response: { value: '' },
                    responseText: { value: '' },
                    responseXML: { value: null },
                    responseURL: { value: haystack.url },
                    status: { value: 200 },
                    statusText: { value: 'OK' },
                },
            });
            switch ( this.responseType ) {
                case 'arraybuffer':
                    promise = promise.then(details => {
                        details.props.response.value = new ArrayBuffer(0);
                        return details;
                    });
                    break;
                case 'blob':
                    promise = promise.then(details => {
                        details.props.response.value = new Blob([]);
                        return details;
                    });
                    break;
                case 'document': {
                    promise = promise.then(details => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString('', 'text/html');
                        details.props.response.value = doc;
                        details.props.responseXML.value = doc;
                        return details;
                    });
                    break;
                }
                case 'json':
                    promise = promise.then(details => {
                        details.props.response.value = {};
                        details.props.responseText.value = '{}';
                        return details;
                    });
                    break;
                default:
                    if ( directive === '' ) { break; }
                    promise = promise.then(details => {
                        return generateContent(details.directive).then(text => {
                            details.props.response.value = text;
                            details.props.responseText.value = text;
                            return details;
                        });
                    });
                    break;
            }
            promise.then(details => {
                Object.defineProperties(details.xhr, details.props);
                details.xhr.dispatchEvent(new Event('readystatechange'));
                details.xhr.dispatchEvent(new Event('load'));
                details.xhr.dispatchEvent(new Event('loadend'));
            });
        }
    };
}

function matchObjectProperties(propNeedles, ...objs) {
    if ( matchObjectProperties.extractProperties === undefined ) {
        matchObjectProperties.extractProperties = (src, des, props) => {
            for ( const p of props ) {
                const v = src[p];
                if ( v === undefined ) { continue; }
                des[p] = src[p];
            }
        };
    }
    const safe = safeSelf();
    const haystack = {};
    const props = Array.from(propNeedles.keys());
    for ( const obj of objs ) {
        if ( obj instanceof Object === false ) { continue; }
        matchObjectProperties.extractProperties(obj, haystack, props);
    }
    for ( const [ prop, details ] of propNeedles ) {
        let value = haystack[prop];
        if ( value === undefined ) { continue; }
        if ( typeof value !== 'string' ) {
            try { value = JSON.stringify(value); }
            catch(ex) { }
            if ( typeof value !== 'string' ) { continue; }
        }
        if ( safe.testPattern(details, value) ) { continue; }
        return false;
    }
    return true;
}

function parsePropertiesToMatch(propsToMatch, implicit = '') {
    const safe = safeSelf();
    const needles = new Map();
    if ( propsToMatch === undefined || propsToMatch === '' ) { return needles; }
    const options = { canNegate: true };
    for ( const needle of propsToMatch.split(/\s+/) ) {
        const [ prop, pattern ] = needle.split(':');
        if ( prop === '' ) { continue; }
        if ( pattern !== undefined ) {
            needles.set(prop, safe.initPattern(pattern, options));
        } else if ( implicit !== '' ) {
            needles.set(implicit, safe.initPattern(prop, options));
        }
    }
    return needles;
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
            }
            catch(ex) {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
catch(ex) { }
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
    try { noXhrIf(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_noXhrIf();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_noXhrIf = cloneInto([
            [ '(', uBOL_noXhrIf.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_noXhrIf);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_noXhrIf;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
