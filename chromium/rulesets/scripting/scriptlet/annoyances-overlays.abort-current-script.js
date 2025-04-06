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

// ruleset: annoyances-overlays

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_abortCurrentScript() {

/******************************************************************************/

function abortCurrentScript(...args) {
    runAtHtmlElementFn(( ) => {
        abortCurrentScriptCore(...args);
    });
}

function abortCurrentScriptCore(
    target = '',
    needle = '',
    context = ''
) {
    if ( typeof target !== 'string' ) { return; }
    if ( target === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('abort-current-script', target, needle, context);
    const reNeedle = safe.patternToRegex(needle);
    const reContext = safe.patternToRegex(context);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const thisScript = document.currentScript;
    const chain = safe.String_split.call(target, '.');
    let owner = window;
    let prop;
    for (;;) {
        prop = chain.shift();
        if ( chain.length === 0 ) { break; }
        if ( prop in owner === false ) { break; }
        owner = owner[prop];
        if ( owner instanceof Object === false ) { return; }
    }
    let value;
    let desc = Object.getOwnPropertyDescriptor(owner, prop);
    if (
        desc instanceof Object === false ||
        desc.get instanceof Function === false
    ) {
        value = owner[prop];
        desc = undefined;
    }
    const debug = shouldDebug(extraArgs);
    const exceptionToken = getExceptionTokenFn();
    const scriptTexts = new WeakMap();
    const getScriptText = elem => {
        let text = elem.textContent;
        if ( text.trim() !== '' ) { return text; }
        if ( scriptTexts.has(elem) ) { return scriptTexts.get(elem); }
        const [ , mime, content ] =
            /^data:([^,]*),(.+)$/.exec(elem.src.trim()) ||
            [ '', '', '' ];
        try {
            switch ( true ) {
            case mime.endsWith(';base64'):
                text = self.atob(content);
                break;
            default:
                text = self.decodeURIComponent(content);
                break;
            }
        } catch {
        }
        scriptTexts.set(elem, text);
        return text;
    };
    const validate = ( ) => {
        const e = document.currentScript;
        if ( e instanceof HTMLScriptElement === false ) { return; }
        if ( e === thisScript ) { return; }
        if ( context !== '' && reContext.test(e.src) === false ) {
            // eslint-disable-next-line no-debugger
            if ( debug === 'nomatch' || debug === 'all' ) { debugger; }
            return;
        }
        if ( safe.logLevel > 1 && context !== '' ) {
            safe.uboLog(logPrefix, `Matched src\n${e.src}`);
        }
        const scriptText = getScriptText(e);
        if ( reNeedle.test(scriptText) === false ) {
            // eslint-disable-next-line no-debugger
            if ( debug === 'nomatch' || debug === 'all' ) { debugger; }
            return;
        }
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Matched text\n${scriptText}`);
        }
        // eslint-disable-next-line no-debugger
        if ( debug === 'match' || debug === 'all' ) { debugger; }
        safe.uboLog(logPrefix, 'Aborted');
        throw new ReferenceError(exceptionToken);
    };
    // eslint-disable-next-line no-debugger
    if ( debug === 'install' ) { debugger; }
    try {
        Object.defineProperty(owner, prop, {
            get: function() {
                validate();
                return desc instanceof Object
                    ? desc.get.call(owner)
                    : value;
            },
            set: function(a) {
                validate();
                if ( desc instanceof Object ) {
                    desc.set.call(owner, a);
                } else {
                    value = a;
                }
            }
        });
    } catch(ex) {
        safe.uboErr(logPrefix, `Error: ${ex}`);
    }
}

function runAtHtmlElementFn(fn) {
    if ( document.documentElement ) {
        fn();
        return;
    }
    const observer = new MutationObserver(( ) => {
        observer.disconnect();
        fn();
    });
    observer.observe(document, { childList: true });
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
}

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["document.onselectstart"],["$","contextmenu"],["disableselect","reEnable"],["addEventListener","/disable_|wccp/"],["document.onkeydown"],["document.addEventListener","contextmenu"],["document.oncontextmenu"],["document.oncontextmenu","preventDefault"],["nocontextmenu"],["document.getElementById","advert-tester"],["$","AdBlock"],["document.getElementById","ad-blocker"],["document.getElementById",".ab_detected"],["jQuery","tweaker"],["jQuery","undefined"],["jQuery","ads"],["document.getElementById","block"],["document.getElementById","undefined"],["$","load"],["eval","abd"],["jQuery","ai_adb"],["$","undefined"],["document.createElement","adblock"],["$","offsetHeight"],["jQuery","ai_check"],["document.getElementById","adblockerdetected"],["$","juicyads"],["$","btoa"],["$","Adblock"],["eval","isNaN"],["event","stopPropagation"],["$",".height"],["addEventListener","adsbygoogle.length"],["$","adBlock"],["String.prototype.charCodeAt","ai_"],["jQuery","preventDefault"],["document.querySelector","adblock"],["$","test"],["$","Promise"],["ab_tests"],["RegExp","googlebot"],["document.querySelectorAll","adblock"],["checkAdblockBait"],["document.createElement","adm*","xhamster8.*","xhamsterporno.mx","xhbig.com","xhbranch5.com","xhchannel.com","xhdate.world","xhday.com","xhday1.com","xhlease.world","xhmoon5.com","xhofficial.com","xhopen.com","xhplanet1.com","xhplanet2.com","xhreal2.com","xhreal3.com","xhspot.com","xhtotal.com","xhtree.com","xhvictory.com","xhwebsite.com","xhwebsite2.com","xhwebsite5.com","xhwide1.com","xhwide2.com","xhwide5.com##+js(set","initials.layout.layoutPromoProps.promoMessagesWrapperProps.shouldDisplayAdblockMessage","false"],["document.oncopy"],["jQuery","#sign-up-popup"],["jQuery","overlay"],["document.addEventListener","alert"],["document.ondragstart","document.oncontextmenu"],["jQuery","document"],["jQuery","restriction"],["document.oncontextmenu","document.onselectstart"],["message","clickIE"],["preventSelection"],["jQuery","contextmenu"],["jQuery","Drupal"],["$","blur"],["reEnable","killcopy"],["document.getElementsByTagName","null"],["document.getElementById","none"],["document.addEventListener"],["document.oncontextmenu","key"],["addEventListener","which"],["window.addEventListener","ctrlKey"],["document.getElementById","banner"],["jQuery","disable_hot_keys"],["onload"],["disableSelection"],["document.getElementById","adblock"],["onload","contextmenu"],["document.ondragstart"],["$","copy"],["$","showEmailNewsletterModal"],["disableSelection","reEnable"],["document.addEventListener","contribute"],["addEventListener","ctrlKey"],["setTimeout","newsletterPopup"],["document.onmousedown"],["soclInit"],["document.addEventListener","preventDefault"],["disable_copy"],["disable_hot_keys"],["jQuery","copy"],["check","debugger"],["document.addEventListener","document.onselectstart"],["matchMedia"],["jQuery","keydown"],["jQuery","oncontextmenu"],["$","/getScript|error:/"],["addEventListener","keydown"],["document.getElementById","cookie"],["document.getElementById","isMoz"],["console.clear"],["oncontextmenu","keydown"],["document.oncontextmenu","nocontextmenu"],["document.onselectstart","disableselect"],["$","\"input\""],["jQuery","stopPropagation"],["update_visit_count"],["showAdblockerModal"],["stopPrntScr"],["console.clear","contextmenu"],["shortcut"],["console.log","document.referer"],["document.addEventListener","onkeydown"],["disableEnterKey"],["document.getElementsByTagName","unselectable"],["document.onkeypress"],["wccp_pro_iscontenteditable"],["document.body.oncontextmenu"],["attachToDom","ad-fallback"],["nocontext"],["runPageBugger"],["eval","contextmenu"],["jQuery","userAgent"],["reEnable"],["jQuery","wccp_pro"],["clear_body_at_all_for_extentions"],["document.addEventListener","copy"],["document.addEventListener","keydown"],["RegExp","debugger"],["oncontextmenu"],["navigator","devtools"],["setInterval","stateObject"],["setTimeout","debugger"],["jQuery","keyCode"],["$","debugger"],["jQuery","devtool"],["RegExp","contextmenu"],["AudiosL10n"],["jQuery","hmwp_is_devtool"],["RegExp.prototype.toString",".join(\"\")"],["document.onmousedown","disableclick"],["RegExp","disableRightClick"],["RegExp","console"],["$","devtoolsDetector"],["Object.defineProperty","DisableDevtool"],["addEventListener","ays_tooltip"],["document.onkeydown","disableCTRL"]];
const hostnamesMap = new Map([["mimaletadepeliculas.blogspot.com",0],["clk.sh",[0,6]],["shrinkearn.com",[0,6]],["luoghidavedere.it",0],["practicetestgeeks.com",[0,6]],["gagetmatome.com",0],["verdadeiroolhar.pt",0],["librospreuniversitariospdf.blogspot.com",[0,1,4,66]],["mt-milcom.blogspot.com",[0,6]],["interviewgig.com",0],["artesacro.org",0],["dailynewsview.com",0],["dailynews.us.com",0],["e-sushi.fr",0],["evasion-online.com",0],["exclusifvoyages.com",0],["naukridisha.in",0],["nydailyquote.com",0],["ouasafat.com",0],["reflectim.fr",[0,6]],["top.howfn.com",0],["kangmartho.com",0],["gnt24365.net",[0,6]],["tvstreampf.xyz",[0,70]],["pvstreams.com",[0,4,6,54]],["7misr4day.com",[0,6]],["evz.ro",1],["visionias.net",1],["mangaku.*",1],["dramaqu.*",1],["safetxt.net",1],["javbest.xyz",1],["javbix.com",1],["javgrab.com",1],["goalup.live",1],["hatsukimanga.com",1],["47news.jp",1],["japanxxxmovie.com",1],["sexpox.com",1],["ibomma.pw",1],["aepos.ap.gov.in",1],["ssphim.net",[1,4]],["10000recipe.com",1],["edurev.in",1],["javjavhd.com",1],["mcocguideblog.com",2],["singingdalong.blogspot.com",2],["runningnews.gr",[2,6]],["tecnotutoshd.net",2],["psychologiazycia.com",[2,6]],["kolnovel.org",3],["up4stream.com",4],["sabishiidesu.com",4],["europixhd.*",[4,6]],["topeuropix.*",[4,6]],["banglainsider.com",[4,57]],["kusonime.com",[4,6,62]],["animesanka.com",4],["lendagames.com",4],["vinaurl.blogspot.com",[4,85]],["utorrentgamesps2.blogspot.com",4],["articlesmania.me",4],["aksensei.com",4],["wawlist.com",[4,6]],["koszalincity.pl",[4,6]],["allcryptoz.net",4],["crewbase.net",4],["crewus.net",4],["shinbhu.net",4],["shinchu.net",4],["thumb8.net",4],["thumb9.net",4],["topcryptoz.net",4],["uniqueten.net",4],["ultraten.net",4],["indianhealthyrecipes.com",[4,6]],["krunkercentral.com",4],["desijugar.net",4],["adslink.pw",4],["jpopsingles.eu",[4,6,54,119]],["genesistls.com",[4,70]],["senpaiediciones.com",[4,70]],["guiasaude.info",4],["felizemforma.com",4],["icourse163.org",4],["abstream.to",4],["kursnacukrzyce.pl",5],["fucktube4k.com",5],["knightnoscanlation.com",5],["blog.cryptowidgets.net",5],["blog.insurancegold.in",5],["blog.wiki-topia.com",5],["blog.coinsvalue.net",5],["blog.cookinguide.net",5],["blog.freeoseocheck.com",5],["whoisnovel.com",6],["fmhikayeleri.com",6],["tinyppt.com",6],["hindi-gk.com",6],["androidmtk.com",6],["badayak.com",6],["kirannewsagency.com",6],["starsunfolded.com",6],["satcesc.com",6],["them4ufree.info",6],["yeane.org",6],["mtbtutoriales.com",6],["answersafrica.com",6],["felico.pl",6],["legionprogramas.org",6],["serwis-zamkow.com",6],["hebrew4christians.com",6],["otakudesu.org",[6,63]],["androidmakale.com",6],["mongri.net",6],["download.ipeenk.com",6],["doranobi-fansub.id",[6,65]],["alexeiportableapp.blogspot.com",6],["oparana.com.br",6],["lolle21.com",6],["mangaid.click",6],["manianomikata.com",6],["tfp.is",6],["dassen-azara4.com",6],["dramacute.*",[6,67]],["pentruea.com",6],["depedlps.*",6],["neyrologos.gr",6],["freerapidleechlist.blogspot.com",6],["ggeguide.com",6],["tanya-tanya.com",[6,73]],["mangatoon.*",6],["lalawin.com",6],["audioreview.m1001.coreserver.jp",[6,73]],["seikatsu-hyakka.com",6],["elizabeth-mitchell.org",[6,75]],["blasianluvforever.com",6],["movieston.com",[6,54]],["eduardo-monica.com",6],["msubplix.com",6],["upstream.to",6],["ilclubdellericette.it",6],["daum.net",6],["123movies.*",[6,73]],["newsforbolly.org",6],["gomovies.*",6],["dztechphone.com",6],["funivie.org",6],["goodbakery.ru",[6,54]],["ifdreamscametrue.com",[6,82]],["juegosdetiempolibre.org",6],["musicindustryhowto.com",[6,60,70]],["sdelatotoplenie.ru",[6,44]],["sachonthi.com",6],["zdravenportal.eu",[6,84]],["thezealots.org",6],["deportealdia.live",6],["fmovies.*",[6,73]],["hulnews.top",6],["otakudesu.*",6],["truyenbanquyen.com",[6,115,116,117]],["globaledu.jp",6],["lataifas.ro",[6,87]],["blisseyhusband.in",[6,54]],["openfinanza.it",[6,70]],["followmikewynn.com",6],["starbene.it",6],["bimiacg.net",6],["diaforetiko.gr",6],["tchadcarriere.com",6],["info-beihilfe.de",6],["zgywyd.cn",6],["mercenaryenrollment.com",6],["cristelageorgescu.ro",6],["crunchyscan.fr",6],["www-daftarharga.blogspot.com",6],["theghostinmymachine.com",6],["ilovevaldinon.it",6],["aileen-novel.online",[6,81]],["bumigemilang.com",[6,81]],["bingotingo.com",6],["stream.bunkr.is",6],["blueraindrops.com",6],["sekaikomik.live",6],["privivkainfo.ru",6],["apps2app.com",6],["bestjavporn.com",6],["mm9841.cc",6],["myoplay.club",6],["bpcj.or.jp",6],["cdramalove.com",6],["outidesigoto.com",6],["xemphimaz.com",6],["gourmetscans.net",[6,108]],["awebstories.com",6],["zgbk.com",6],["clujust.ro",[6,70]],["stockpokeronline.com",6],["stiridinromania.ro",6],["kooora4lives.net",6],["kooora4livs.com",6],["piklodz.pl",[6,115,116,117]],["secondlifetranslations.com",[6,115,116,117]],["ferroviando.com.br",[6,115,116,117]],["counciloflove.com",[6,115,116,117]],["infokik.com",[6,115,116,117]],["kulinarnastronamocy.pl",[6,115,116,117]],["jafekri.com",[6,115,116,117]],["ezmanga.net",[6,115,116,117]],["reborntrans.com",[6,115,116,117]],["paidiatreio.gr",[6,118]],["workhouses.org.uk",6],["dollarvr.com",[6,70]],["newsme.gr",[6,70]],["daily-tohoku.news",[6,67]],["descopera.ro",6],["velicu.eu",6],["arenavalceana.ro",[6,54]],["firmwarefile.com",6],["asianexpress.co.uk",6],["best4hack.blogspot.com",6],["certificationexamanswers.890m.com",6],["cookhero.gr",6],["creative-chemistry.org.uk",6],["deutschaj.com",6],["divineyogaschool.blogspot.com",6],["fabioambrosi.it",6],["flory4all.com",6],["fv2freegifts.org",6],["geniusjw.com",6],["ideas0419.com",6],["jeyran.net",6],["ktm2day.com",6],["letsdownloads.com",6],["limametti.com",6],["luyenthithukhoa.vn",6],["otakukan.com",6],["ribbelmonster.de",6],["untitle.org",6],["uptimeside.webnode.gr",6],["usmleexperiences.review",6],["yoyofilmeys.*",6],["zoommastory.com",6],["urbanbrush.net",6],["audiotools.in",6],["raindropteamfan.com",6],["manhwahentai.me",6],["ontools.net",6],["scarysymptoms.com",[6,108]],["musicallyvideos.com",6],["geeksoncoffee.com",6],["guidingliterature.com",[6,70]],["mostrodifirenze.com",6],["3xyaoi.com",6],["tinyhouse-baluchon.fr",6],["torontosom.ca",7],["samurai.wordoco.com",8],["appofmirror.com",8],["eca-anime.net",9],["flyertalk.com",10],["lcpdfr.com",10],["kashmirobserver.net",11],["cathouseonthekings.com",12],["winaero.com",13],["centrumher.eu",14],["japancamerahunter.com",15],["airlinercafe.com",15],["thegraillords.net",16],["worldscientific.com",16],["videohelp.com",16],["siliconinvestor.com",17],["space-engineers.de",17],["coffeeforums.co.uk",17],["anime2you.de",17],["playonlinux.com",18],["bold.dk",19],["pureinfotech.com",20],["almasdarnews.com",20],["casertace.net",20],["civildigital.com",20],["lesmoutonsenrages.fr",20],["venusarchives.com",20],["verpornocomic.com",20],["molineuxmix.co.uk",21],["yaledailynews.com",21],["forum.nlmod.net",22],["mt07-forum.de",23],["auto-treff.com",23],["telefon-treff.de",23],["dodge-forum.eu",23],["hearthstone-decks.net",24],["masrawy.com",25],["milfzr.com",26],["smokingmeatforums.com",27],["broncoshq.com",27],["abola.pt",28],["unixhow.com",29],["ohmygirl.ml",30],["moneyguru.co",31],["sharree.com",31],["kitguru.net",32],["whatfontis.com",33],["lowkeytech.com",34],["ubuntudde.com",34],["techsini.com",35],["ssuathletics.com",36],["grandoldteam.com",37],["gamingsinners.com",37],["elitepvpers.com",38],["slideshare.net",39],["memoryhackers.org",40],["steamcollector.com",41],["mgsm.pl",42],["boston.com",43],["britannica.com",43],["cattime.com",43],["dogtime.com",43],["download.mokeedev.com",43],["freep.com",43],["ijr.com",43],["inquirer.net",43],["knowyourmeme.com",43],["nationalreview.com",43],["nofilmschool.com",43],["order-order.com",43],["savvytime.com",43],["techlicious.com",43],["technicpack.net",43],["thedraftnetwork.com",43],["wrestlezone.com",43],["xda-developers.com",43],["braziljournal.com",44],["nekopoi.web.id",44],["world4.eu",[44,80,81]],["searchenginewatch.com",45],["oggiscuola.com",46],["upsrtconline.co.in",47],["qualityfilehosting.com",48],["booksmedicos.org",49],["jobsbotswana.info",50],["npnews24.com",51],["fordogtrainers.pl",[52,53]],["polskacanada.com",54],["fantricks.com",54],["blog.kwick.de",54],["selfstudyhistory.com",[54,70]],["yeuphimmoik.com",54],["repack-games.com",54],["delicateseliterare.ro",54],["wpplugins.tips",54],["verselemzes.hu",[54,125]],["sqlserveregitimleri.com",54],["gezimanya.com",55],["athletic.net",56],["bitblokes.de",58],["balticlivecam.com",59],["canondrivers.org",[60,61]],["includehelp.com",64],["routenote.com",66],["themosvagas.com.br",[66,89]],["altranotizia.it",67],["full-anime.fr",68],["klsescreener.com",68],["nonton78.com",69],["tvzingvn.*",69],["zingtvhd.*",69],["zingvntv.*",69],["sbfast.com",69],["sbflix.*",69],["vupload.com",69],["opportunitydesk.org",70],["selfstudyanthro.com",70],["renditepassive.net",70],["androidtvbox.eu",70],["flinsetyadi.com",[70,73]],["rawneix.in",[70,105,106]],["the-masters-voice.com",[70,73]],["activationkeys.co",70],["pandurul.ro",71],["phrasemix.com",72],["celebzcircle.com",73],["sertracen.com.pa",73],["pitesti24.ro",73],["samsungtechwin.com",73],["cours-de-droit.net",73],["iptv4best.com",73],["blogvisaodemercado.pt",73],["kapitalis.com",73],["tiempo.hn",73],["winmeen.com",73],["ibps.in",73],["visse.com.br",73],["javsubtitle.co",73],["learninsta.com",73],["licensekeys.org",73],["mediahiburan.my",73],["tipssehatcantik.com",73],["anime-drama.jp",73],["jbjbgame.com",73],["viatasisanatate.com",73],["ziarulargesul.ro",73],["globaldefensecorp.com",73],["gossipnextdoor.com",73],["coffeeapps.ir",73],["media.framu.world",73],["immobiliaremia.com",73],["colegiosconcertados.info",73],["bigdatauni.com",73],["riwyat.com",73],["rukim.id",73],["visefierbinti.ro",73],["cyberkrafttraining.com",73],["theaircurrent.com",73],["ncert-solutions.com",73],["ncertsolutions.guru",73],["nocturnetls.net",73],["clockks.com",73],["ananda-yoga.ro",73],["poolpiscina.com",73],["infodifesa.it",73],["getective.com",73],["flashdumpfiles.com",73],["formatatmak.com",73],["drkrok.com",73],["alphagirlreviews.com",73],["kitchennovel.com",73],["voxvalachorum.ro",73],["cracksone.com",73],["day-hoc.org",73],["onlineonderdelenshop.nl",73],["primicia.com.ve",73],["tech-recipes.com",73],["postcourier.com.pg",73],["afrikmag.com",73],["maduras.vip",73],["aprendeinglessila.com",73],["kicknews.today",73],["koalasplayground.com",73],["hellokpop.com",73],["hayatbilgileri.com",73],["moneyexcel.com",73],["placementstore.com",73],["neuroteam-metz.de",73],["codedosa.com",73],["liveyourmaths.com",73],["newspao.gr",73],["ieltsliz.com",73],["programasvirtualespc.net",73],["tempatwisataseru.com",73],["wikiofcelebs.com",73],["jornaljoca.com.br",73],["arcanescans.com",73],["filmzone.com",73],["hiraethtranslation.com",73],["kaystls.site",73],["home.novel-gate.com",73],["plural.jor.br",73],["evreporter.com",73],["sinhasannews.com",73],["viewsofgreece.gr",73],["rozbor-dila.cz",73],["kritichno.bg",73],["csiplearninghub.com",73],["medeberiya.site",73],["wikihow.com",74],["analizy.pl",76],["zeeebatch.blogspot.com",77],["sokolow-mlp.pl",77],["japan-fans.com",77],["cissamagazine.com.br",78],["observatoriodocinema.uol.com.br",79],["portalcriatividade.com.br",[80,111]],["lvturbo.com",83],["sbbrisk.com",83],["sbface.com",83],["sbspeed.com",83],["streamsb.net",83],["itscybertech.com",83],["tritinia.com",86],["sportnews.to",[86,91]],["psihologiadeazi.ro",86],["dubznetwork.com",[86,107]],["allmovie.com",88],["sidereel.com",88],["developpez.com",90],["scatch176duplicities.com",92],["voe-unblock.com",92],["phimdinhcao.com",93],["picallow.com",94],["brooklyneagle.com",94],["techgyd.com",94],["karsaz-law.com",94],["links.extralinks.casa",95],["theasianparent.com",95],["titulky.com",96],["dongphimmoiz.com",97],["investorvillage.com",98],["geeksforgeeks.org",99],["acupoffrench.com",100],["novelza.com",100],["viewsb.com",101],["nsfwzone.xyz",101],["dlmovies.link",101],["top1iq.com",102],["unlimitedfiles.xyz",103],["aztravels.net",104],["downfile.site",104],["memangbau.com",104],["trangchu.news",104],["revenue.land",105],["eplayer.click",107],["olacast.live",107],["ntuplay.xyz",107],["maxstream.video",109],["esologs.com",110],["fflogs.com",110],["swtorlogs.com",110],["warcraftlogs.com",110],["wildstarlogs.com",110],["smokelearned.net",112],["nhentaihaven.org",113],["hidemywp.co",114],["camcaps.to",120],["vtplayer.net",120],["phimlongtieng.net",[121,122,123,124]],["weakstream.org",126],["jk-market.com",127],["vtbe.to",128],["vtube.network",128],["film4e.com",129],["zamundatv.com",129],["firescans.xyz",130],["vidsrc.*",131],["radartest.com",132],["daya-jewelry.com",133],["veev.to",134],["anime3s.com",[135,136]],["animet1.net",[135,136]],["japonhentai.com",137],["cyberalert.gr",138]]);
const exceptionsMap = new Map([]);
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
    try { abortCurrentScript(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
