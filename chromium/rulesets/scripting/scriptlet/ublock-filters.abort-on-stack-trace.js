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

// ruleset: ublock-filters

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_abortOnStackTrace() {

/******************************************************************************/

function abortOnStackTrace(
    chain = '',
    needle = ''
) {
    if ( typeof chain !== 'string' ) { return; }
    const safe = safeSelf();
    const needleDetails = safe.initPattern(needle, { canNegate: true });
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    if ( needle === '' ) { extraArgs.log = 'all'; }
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            let v = owner[chain];
            Object.defineProperty(owner, chain, {
                get: function() {
                    const log = safe.logLevel > 1 ? 'all' : 'match';
                    if ( matchesStackTraceFn(needleDetails, log) ) {
                        throw new ReferenceError(getExceptionTokenFn());
                    }
                    return v;
                },
                set: function(a) {
                    const log = safe.logLevel > 1 ? 'all' : 'match';
                    if ( matchesStackTraceFn(needleDetails, log) ) {
                        throw new ReferenceError(getExceptionTokenFn());
                    }
                    v = a;
                },
            });
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    makeProxy(owner, chain);
}

function getExceptionTokenFn() {
    const token = getRandomTokenFn();
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
}

function matchesStackTraceFn(
    needleDetails,
    logLevel = ''
) {
    const safe = safeSelf();
    const exceptionToken = getExceptionTokenFn();
    const error = new safe.Error(exceptionToken);
    const docURL = new URL(self.location.href);
    docURL.hash = '';
    // Normalize stack trace
    const reLine = /(.*?@)?(\S+)(:\d+):\d+\)?$/;
    const lines = [];
    for ( let line of safe.String_split.call(error.stack, /[\n\r]+/) ) {
        if ( line.includes(exceptionToken) ) { continue; }
        line = line.trim();
        const match = safe.RegExp_exec.call(reLine, line);
        if ( match === null ) { continue; }
        let url = match[2];
        if ( url.startsWith('(') ) { url = url.slice(1); }
        if ( url === docURL.href ) {
            url = 'inlineScript';
        } else if ( url.startsWith('<anonymous>') ) {
            url = 'injectedScript';
        }
        let fn = match[1] !== undefined
            ? match[1].slice(0, -1)
            : line.slice(0, match.index).trim();
        if ( fn.startsWith('at') ) { fn = fn.slice(2).trim(); }
        let rowcol = match[3];
        lines.push(' ' + `${fn} ${url}${rowcol}:1`.trim());
    }
    lines[0] = `stackDepth:${lines.length-1}`;
    const stack = lines.join('\t');
    const r = needleDetails.matchAll !== true &&
        safe.testPattern(needleDetails, stack);
    if (
        logLevel === 'all' ||
        logLevel === 'match' && r ||
        logLevel === 'nomatch' && !r
    ) {
        safe.uboLog(stack.replace(/\t/g, '\n'));
    }
    return r;
}

function safeSelf() {
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'Object_hasOwn': Object.hasOwn.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String': self.String,
        'String_fromCharCode': String.fromCharCode,
        'String_split': String.prototype.split,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true, expect: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
            }
            catch {
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
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            if ( bcBuffer === undefined ) {
                return bc.postMessage({ what: 'messageToLogger', type, text });
            }
            bcBuffer.push({ type, text });
        };
        bc.onmessage = ev => {
            const msg = ev.data;
            switch ( msg ) {
            case 'iamready!':
                if ( bcBuffer === undefined ) { break; }
                bcBuffer.forEach(({ type, text }) =>
                    bc.postMessage({ what: 'messageToLogger', type, text })
                );
                bcBuffer = undefined;
                break;
            case 'setScriptletLogLevelToOne':
                safe.logLevel = 1;
                break;
            case 'setScriptletLogLevelToTwo':
                safe.logLevel = 2;
                break;
            }
        };
        bc.postMessage('areyouready?');
    } catch {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["History","/(^(?!.*(Function|HTMLDocument).*))/"],["String.prototype.charCodeAt","ai_"],["onload","inlineScript"],["navigator.userAgent","pushiserve"],["document.createElement","rollexzone"],["document.querySelector","detect"],["document.cookie","https"],["String.fromCharCode","stackDepth:3"],["Math.round","inlineScript"],["document.createElement","inlineScript"],["atob","inlineScript"],["Math","inlineScript"],["document.getElementById","onLoadEvent"],["Object","mark"],["console.log","/blob|injectedScript/"],["setTimeout","onload"],["encodeURIComponent","inlineScript"],["setTimeout","adsBlocked"],["document.querySelector","suaads"],["navigator.userAgent","checkBrowser"],["document.getElementById","adsBlocked"],["document.getElementsByTagName","adsBlocked"],["Math","onerror"],["Math.random","/injectedScript.*inlineScript/"],["Math.random","/(?=.*onerror)(?=^(?!.*(https)))/"],["Math.random","/injectedScript|blob/"],["Math.random","/\\st\\.[a-zA-Z]*\\s/"],["Object","/(?=^(?!.*(https)))/"],["Object","inlineScript"],["Math.random","/\\st\\.[a-zA-Z]*\\sinlineScript/"],["XMLHttpRequest","/inlineScript|stackDepth:1/"],["XMLHttpRequest","inlineScript"],["btoa","/https|stackDepth:3/"],["document.querySelectorAll","/(?=^(?!.*(https|injectedScript)))/"],["document.getElementById","fairAdblock"],["HTMLElement.prototype.click","_0x"],["$","/(?=^(?!.*(https)))/"],["$ado","/ado/i"],["document.createElement","app.js"],["Math","showModal"],["Math.random","t.pt"],["String.prototype.charCodeAt","_0x"],["EventTarget.prototype.addEventListener","/(?=^(?!.*(challenge-platform|jquery|challenges\\.cloudflare\\.com|jwplayer)))/"],["Math.random","/(?=^(?!.*(/akismet-frontend\\.js|gstatic|jquery/)))/"],["Math.random",""],["jQuery","ai_adb"],["JSON.parse","computed"],["localStorage","inlineScript"],["_pop","_init"],["Math.floor",""],["Math.floor","randStr"],["Math.round","onload"],["Math","ai_"],["document.createElement","make_rand_div"],["_pop"],["foreverJQ","/document.createElement|stackDepth:2/"],["Math",""],["Math.random","computed"],["$","inlineScript"],["Math","https"],["setTimeout","ads"],["Math.random","inlineScript"],["Element.prototype.matches","litespeed"],["HTMLSelectElement","Object"],["String.prototype.charCodeAt","https"],["fetch","inlineScript"],["console","onload"],["document.createElement","onerror"],["fetch","https"],["Math","_0x"],["onload","/app.js"],["document.createElement","create_ad"],["String.prototype.charCodeAt","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/"],["document.createElement","/(?=^(?!.*(https)))/"],["document.createElement","/(?=^(?!.*(http)))/"],["Date.now","afScript"],["document.querySelectorAll","/(?=^(?!.*(https|Parse|Image)))/"],["document.body.appendChild"],["$","openAdsModal"],["document.createElement","notify"],["document.addEventListener","litespeed"],["HTMLIFrameElement","inlineScript"],["parseInt","adsBlocked"],["document.querySelector","showModal"],["atob","/zefoy\\.com\\S+:3:1/"],["document.querySelector","/showModal|chooseAction|doAction|callbackAdsBlocked/"],["setTimeout","dontask"],["Object.getPrototypeOf","plugins"],["Error","/stackDepth:1\\s/"],["localStorage","tryShowVideoAdAsync"],["localStorage","window.onload"],["document.createElement","adsBlocked"],["decodeURIComponent","autoptimize"],["String.prototype.charCodeAt","$"],["document.createElement","detect"],["onload","bodyElement.removeChild"],["setTimeout","data"],["document.querySelector","/(?=^(?!.*(cdn-cgi)))/"],["document.createElement","createDecoy"],["atob","injectedScript"],["jQuery","removeDLElements"],["document.createElement","pda"],["document.addEventListener","blocker"],["fetch","HTMLDocument"],["Object.defineProperty","https"],["document.createElement","openNewTab"],["document.getElementById","/(?=^(?!.*(orchestrate|cloudflare)))/"],["localStorage","tag.min.js"],["Object","Pop"],["document.createElement","yes.onclick"],["document.getElementById","inlineScript"],["clearTimeout","/\\b[a-z] inlineScript:/"],["document.readyState","drama-online"],["document.createElement","Object.init"],["document.createElement","onload"],["XMLHttpRequest","/(?=^(?!.*(_next)))/"],["Array.prototype.includes","adblockTrigger"],["Promise","HTMLDocument"],["atob","/HTMLDocument|blob/"],["btoa","send"],["window.screen.height","setTimeout"],["Math.sqrt","update"]];
const hostnamesMap = new Map([["cadenadial.com",0],["iptvbin.com",1],["gaypornmasters.com",1],["gaypornwave.com",1],["scubidu.eu",1],["amyscans.com",1],["thesukan.net",1],["adrianoluis.net",1],["altevolkstrachten.de",1],["animecast.net",1],["armyranger.com",1],["articletz.com",1],["boxylucha.com",1],["chibchat.com",1],["duniailkom.com",1],["enciclopediaonline.com",1],["entano.jp",1],["eyalo.com",1],["fosslovers.com",1],["fotopixel.es",1],["hairstylesthatwork.com",1],["hello-e1.com",1],["ichberlin.com",1],["ireez.com",1],["keepkoding.com",1],["latribunadeautomocion.es",1],["linemarlin.com",1],["lumpiastudio.com",1],["miaandme.org",1],["mobility.com.ng",1],["mygardening411.com",1],["newstvonline.com",1],["organismes.org",1],["papagiovannipaoloii.altervista.org",1],["playlists.rocks",1],["relatosdesexo.xxx",1],["rencah.com",1],["riverdesdelatribuna.com.ar",1],["sarkarinaukry.com",1],["seamanmemories.com",1],["socialmediaverve.com",1],["theorie-musik.de",1],["topperpoint.com",1],["travel-the-states.com",1],["vozz.vn",1],["jootc.com",1],["gaydelicious.com",1],["exbulletin.com",1],["game-owl.com",1],["javnow.net",1],["world4.eu",1],["gadgetguideonline.com",1],["therootdroid.com",1],["lazytranslations.com",1],["mettablog.com",1],["webdeyazilim.com",1],["freebulksmsonline.com",1],["buydekhke.com",1],["isekaisubs.web.id",1],["javhoho.com",1],["udoyoshi.com",1],["ilifehacks.com",1],["gamingsym.in",1],["riotbits.com",1],["burakgoc.com",1],["systopedia.com",1],["googledrivelinks.com",1],["lacuevadeguns.com",2],["pussyspace.com",[3,4]],["pussyspace.net",[3,4]],["videos.porndig.com",5],["zootube1.com",6],["hdvid.*",7],["camwhorescloud.com",8],["123moviess.*",9],["cryptonor.xyz",9],["watchkobestreams.info",10],["imgdawgknuttz.com",10],["gameshdlive.net",10],["thefmovies.*",11],["pcgamez-download.com",11],["fifaultimateteam.it",11],["gametop.com",12],["artribune.com",13],["laksa19.github.io",14],["fontyukle.net",15],["programmiedovetrovarli.it",16],["biopills.net",16],["graphicuv.com",17],["kisahdunia.com",17],["freedownloadvideo.net",17],["firmwarex.net",17],["filmisub.cc",17],["hscprojects.com",17],["graphicgoogle.com",17],["freemockupzone.com",17],["postermockup.com",17],["forexwikitrading.com",17],["mockupplanet.com",17],["tojimanhwas.com",17],["suaurl.com",18],["laweducationinfo.com",19],["savemoneyinfo.com",19],["worldaffairinfo.com",19],["godstoryinfo.com",19],["successstoryinfo.com",19],["cxissuegk.com",19],["learnmarketinfo.com",19],["bhugolinfo.com",19],["armypowerinfo.com",19],["rsadnetworkinfo.com",19],["rsinsuranceinfo.com",19],["rsfinanceinfo.com",19],["rsgamer.app",19],["rssoftwareinfo.com",19],["rshostinginfo.com",19],["rseducationinfo.com",19],["phonereviewinfo.com",19],["makeincomeinfo.com",19],["gknutshell.com",19],["vichitrainfo.com",19],["workproductivityinfo.com",19],["dopomininfo.com",19],["hostingdetailer.com",19],["fitnesssguide.com",19],["tradingfact4u.com",19],["cryptofactss.com",19],["softwaredetail.com",19],["artoffocas.com",19],["insurancesfact.com",19],["travellingdetail.com",19],["geniussolutions.co",20],["skillheadlines.in",20],["portable4pc.com",20],["superpsx.com",20],["magicgameworld.com",20],["e-player-stream.app",20],["bethaniebu.com",20],["filmi7.net",20],["trancehost.com",20],["arenascan.com",20],["resetscan.com",20],["mtcremix.com",21],["classicoder.com",21],["iconmonstr.com",21],["cybermania.ws",[21,43]],["karanpc.com",21],["an1me.*",21],["xerifetech.com",21],["donghuaworld.com",21],["zealtyro.com",21],["zxi.mytechroad.com",21],["savegame.pro",21],["drivers.plus",21],["dcdirtylaundry.com",22],["ipatriot.com",22],["newser.com",22],["telexplorer.com.ar",23],["designbump.com",24],["thedesigninspiration.com",24],["appteka.store",25],["filmypur.*",26],["kmo.to",26],["nuroflix.*",26],["onifile.com",26],["oxanime.com",26],["pelis28.*",26],["pelisplusgo.*",26],["pelisplusxd.*",26],["pewgame.com",26],["piraproxy.app",26],["repelisgoo.*",26],["repelisgooo.*",26],["repelisgt.*",26],["repelisxd.*",26],["severeporn.com",26],["sexphimhd.net",26],["theproxy.*",26],["tvply.*",26],["vidlox.*",26],["voirseries.io",26],["watchfree.*",26],["songspk.*",27],["shahiid-anime.net",27],["isaimini.*",28],["goku.sx",28],["bitfly.io",29],["pelisplus.*",29],["pelisplus2.*",29],["moviespapa.*",30],["kuttymovies.*",31],["manhwalist.com",32],["emperorscan.com",33],["makotoichikawa.net",33],["telephone-soudan.com",33],["hentaiseason.com",34],["showflix.*",34],["abysscdn.com",35],["fullfreeimage.com",35],["hihihaha1.xyz",35],["hihihaha2.xyz",35],["hydraxcdn.biz",35],["imagelovers.com",35],["player-cdn.com",35],["playermeow.com",35],["playhydrax.com",35],["rufiiguta.com",35],["myuploadedpremium.de",36],["sms24.*",[37,38]],["freewebcart.com",39],["shorttey.*",40],["wawacity.*",41],["xcloud.*",42],["unblocked.name",44],["vibehubs.com",45],["speedostream.*",46],["thothub.*",47],["thethothub.com",47],["anonymz.com",48],["naijaray.com.ng",49],["uproxy2.*",49],["deutschsex.mobi",50],["1milf.com",50],["influencersgonewild.com",51],["freeiphone.fr",52],["pcbeta.com",53],["notformembersonly.com",54],["4everproxy.com",55],["dirproxy.com",56],["mp3juices.*",57],["fapguru.com",58],["pornpapa.com",58],["videojav.com",58],["toxicwap.us",59],["dvdgayonline.com",60],["cctvwiki.com",60],["freepornsex.net",60],["cinepiroca.com",60],["dvd-flix.com",60],["sonixgvn.net",60],["chicksonright.com",61],["coloredmanga.com",61],["gotxx.*",62],["mmsbee.*",62],["xozilla.xxx",63],["dragontranslation.com",64],["yt5s.com",64],["aniwave.uk",64],["downloadfreecourse.com",65],["publicflashing.me",66],["sanet.st",67],["dlhd.sx",67],["hdmoviefair.*",67],["shorttrick.in",68],["boombj.com",69],["stream.bunkr.ru",69],["jav.re",70],["coromon.wiki.gg",71],["filepress.*",72],["sexemix.com",73],["movierulzhd.*",74],["pahaplayers.click",75],["imageupscaler.com",76],["picyield.com",77],["snaptik.app",78],["nilesoft.org",79],["smgplaza.com",80],["novinky.cz",81],["tuxnews.it",82],["comedyshow.to",83],["zefoy.com",84],["gamedrive.org",85],["sexvideos.host",86],["corrector.app",87],["cgaa.org",88],["screenflash.io",89],["streamporn.co.uk",90],["jeniusplay.com",91],["teknisitv.com",92],["paylaterin.com",92],["torrentgalaxy.*",93],["thestar.com",94],["earnhub.net",95],["gplastra.com",96],["cimanow.cc",97],["freex2line.online",97],["qiwi.gg",98],["jpopsingles.eu",99],["emurom.net",100],["im9.eu",101],["elamigosedition.com",102],["mhdsports.*",103],["mhdtvmax.*",103],["lulacloud.com",104],["turtleviplay.xyz",105],["limiteddollqjc.shop",106],["rgshows.me",107],["olympicstreams.ru",108],["javfc2.xyz",109],["secondhandsongs.com",110],["xbaaz.com",111],["drama-online.tv",112],["porno-365.*",113],["vidfast.pro",[114,115]],["moviemaniak.com",116],["streambolt.tv",117],["strmbolt.com",117],["gaypornhot.com",118],["tweakers.net",119],["perplexity.ai",120],["deviantart.com",121]]);
const exceptionsMap = new Map([["xcloud.eu",[42]],["xcloud.host",[42]]]);
const hasEntities = true;
const hasAncestors = false;

const collectArgIndices = (hn, map, out) => {
    let argsIndices = map.get(hn);
    if ( argsIndices === undefined ) { return; }
    if ( typeof argsIndices !== 'number' ) {
        for ( const argsIndex of argsIndices ) {
            out.add(argsIndex);
        }
    } else {
        out.add(argsIndices);
    }
};

const indicesFromHostname = (hostname, suffix = '') => {
    const hnParts = hostname.split('.');
    const hnpartslen = hnParts.length;
    if ( hnpartslen === 0 ) { return; }
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = `${hnParts.slice(i).join('.')}${suffix}`;
        collectArgIndices(hn, hostnamesMap, todoIndices);
        collectArgIndices(hn, exceptionsMap, tonotdoIndices);
    }
    if ( hasEntities ) {
        const n = hnpartslen - 1;
        for ( let i = 0; i < n; i++ ) {
            for ( let j = n; j > i; j-- ) {
                const en = `${hnParts.slice(i,j).join('.')}.*${suffix}`;
                collectArgIndices(en, hostnamesMap, todoIndices);
                collectArgIndices(en, exceptionsMap, tonotdoIndices);
            }
        }
    }
};

const entries = (( ) => {
    const docloc = document.location;
    const origins = [ docloc.origin ];
    if ( docloc.ancestorOrigins ) {
        origins.push(...docloc.ancestorOrigins);
    }
    return origins.map((origin, i) => {
        const beg = origin.lastIndexOf('://');
        if ( beg === -1 ) { return; }
        const hn = origin.slice(beg+3)
        const end = hn.indexOf(':');
        return { hn: end === -1 ? hn : hn.slice(0, end), i };
    }).filter(a => a !== undefined);
})();
if ( entries.length === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = new Set();

indicesFromHostname(entries[0].hn);
if ( hasAncestors ) {
    for ( const entry of entries ) {
        if ( entry.i === 0 ) { continue; }
        indicesFromHostname(entry.hn, '>>');
    }
}

// Apply scriplets
for ( const i of todoIndices ) {
    if ( tonotdoIndices.has(i) ) { continue; }
    try { abortOnStackTrace(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
