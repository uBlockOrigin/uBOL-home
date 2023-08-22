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

// ruleset: annoyances-overlays

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_addEventListenerDefuser = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["DOMContentLoaded","admiral"],["load","Dislike intrusive ads"],["load","adblock_whitelist"],["DOMContentLoaded","replaceAdsWithFallbackImages"],["np.detect"],["load",".offsetHeight == 0"],["load","adBlock"],["/load|error/",".head.removeChild("],["scroll","scrollTop())+n-i>o/2"],["click","interstitial"],["mouseleave","scribd_ad"],["mouseleave"],["popstate","addEventProcessor"],["scroll","eventHandle.elem"],["wheel"],["scroll","documentElement.scrollTop"],["scroll","_onscroll"],["mouseout","#modalSair"],["scroll","showPopup"],["scroll",".open()"],["mouseout","event.dispatch.apply"],["ww-open-overlay","scrollTop"],["load","setVideoTop"],["load","newsletter"],["scroll","t.attemptLoad"],["load","event.dispatch.apply"],["/^(contextmenu|copy)$/"],["blur"],["copy"],["contextmenu"],["/^(?:contextmenu|copy|selectstart)$/"],["/^(?:contextmenu|copy)$/","preventDefault"],["/^(?:contextmenu|keydown)$/"],["mouseout"],["scroll"],["DOMContentLoaded",".js-popup-adblock"],["/^(contextmenu|keydown)$/"],["/^(?:contextmenu|copy|keydown)$/"],["mouseout","pop"],["/^(?:keyup|keydown)$/"],["keydown"],["keydown","disable_in_input"],["keydown","preventDefault"],["/contextmenu|keydown|keyup|copy/"],["copy","getSelection"],["","t.preventDefault"],["copy","replaceCopiedText"],["/^(contextmenu|copy|dragstart|selectstart)$/"],["","ads"],["/contextmenu|selectstart|copy/"],["/contextmenu|copy|keydown/"],["/contextmenu|select|copy/"],["contextmenu","a"],["/^(mouseout|mouseleave)$/"],["/contextmenu|selectstart/"],["dragstart|keydown/"],["/contextmenu|keydown|dragstart/"],["","_0x"],["contextmenu","preventDefault"],["copy","preventDefault"],["","adtoniq"],["/^(?:contextmenu|copy|keydown|mousedown)$/"],["/contextmenu|keydown/"],["devtoolschange"],["/contextmenu|copy/"],["","mdp"],["/blur|mousedown|mouseenter|mouseleave/"],["/contextmenu|cut|copy|paste/"],["/contextmenu|mousedown/"],["visibilitychange","pagehide"],["/contextmenu|copy|selectstart/"],["","0x"],["/^(?:contextmenu|dragstart|selectstart)$/"],["/^(?:contextmenu|copy)$/"],["/dragstart|keyup|keydown/"],["/keyup|keydown/","wpcc"],["/contextmenu|cut|copy|keydown/"],["","undefined"],["/contextmenu|selectstart|copy|dragstart/"],["/copy|dragstart/"],["/copy|contextmenu/"],["error"],["dragstart"],["","AdB"],["selectionchange","quill.emitter"],["/contextmenu|selectstart|select|copy|dragstart/"],["load","adLazy"],["copy","jQuery!==\"undefined\""],["copy","[native code]"],["/selectionchange|mousedown/","[native code]"],["selectstart"],["/^(?:copy|paste)$/","undefined"],["/copy|keydown/"],["/copy|cut|selectstart/"],["/keydown|keyup/","keyCode"],["keydown","disabledEvent"],["","Key"],["/copy|cut|paste|selectstart/"],["/contextmenu|dragstart|keydown/","event.dispatch.apply"],["beforepaste"],["","keyCode"],["DOMContentLoaded","rprw"],["","key"],["","ctrlKey"],["contextmenu","event.triggered"],["copy","pagelink"],["/keydown|mousedown/"],["copy","Source"],["","login"],["/contextmenu|copy|drag|dragstart/"],["/contextmenu|keydown|keypress|copy/"],["","blockFuckingEverything"],["mouseout","openLayer"],["/contextmenu|keydown/","preventDefault"],["mousedown","dispatch"],["/contextmenu|mousedown/","return\"undefined\""],["DOMContentLoaded","ready"],["keydown","disabledKeys"],["DOMContentLoaded","load"],["contextmenu","_0x"],["keydown","keyCode"]];

const hostnamesMap = new Map([["gamerevolution.com",0],["onmsft.com",0],["timeanddate.com",[1,16]],["slideshare.net",[2,10]],["warcraftlogs.com",3],["nwdb.info",4],["explorecams.com",4],["tiermaker.com",4],["freeforumzone.com",5],["megogo.sport",6],["megogo.ru",6],["ynet.co.il",7],["infobae.com",7],["abcnyheter.no",7],["sme.sk",7],["yourdictionary.com",7],["foxnews.com",7],["blog.csdn.net",[8,59]],["boyfriendtv.com",9],["milenio.com",[11,28]],["jakiwniosek.pl",11],["hikakaku.com",12],["wacul-ai.com",13],["qodeinteractive.com",14],["digitalvidya.com",14],["bbc.co.uk",15],["imovelguide.com.br",17],["facebook.com",18],["facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd.onion",18],["cnyfertility.com",19],["da-direkt.de",20],["westwing.de",21],["tv.golfnetwork.co.jp",22],["posterxxl.de",23],["bijutsutecho.com",24],["try-it.jp",25],["s0urce.io",26],["filefox.cc",27],["uol.com.br",28],["gazetadopovo.com.br",28],["gazetaonline.com.br",28],["indiatimes.com",28],["odiario.com",28],["otempo.com.br",28],["estadao.com.br",28],["bacaan.id",28],["ofuxico.com.br",28],["pentruea.com",28],["ciberduvidas.iscte-iul.pt",28],["globo.com",28],["citas.in",28],["blitzrechner.de",28],["emailfake.com",28],["lyrical-nonsense.com",28],["mediafax.ro",28],["economica.net",28],["polsatnews.pl",28],["novagente.pt",28],["arlinadzgn.com",28],["time.geekbang.org",[28,89]],["nowcoder.com",28],["libertatea.ro",28],["erinsakura.com",28],["yuque.com",28],["deepl.com",28],["digi24.ro",28],["onna.kr",28],["ziare.com",28],["agrointel.ro",28],["skyozora.com",28],["veneto.info",28],["peliculas24.me",29],["roztoczanskipn.pl",29],["economictimes.indiatimes.com",[29,33]],["dzwignice.info",29],["script-stack.com",[29,65]],["mio.to",29],["husseinezzat.com",[29,40]],["taxo-acc.pl",29],["portalwrc.pl",29],["lublin.eu",29],["onlystream.tv",29],["dddance.party",29],["kapiert.de",29],["hitcena.pl",29],["tv-asahi.co.jp",29],["digitalfernsehen.de",29],["suzylu.co.uk",29],["music.apple.com",29],["skidrowcodex.net",29],["vsco.co",29],["nationalgeographic.com",29],["festival-cannes.com",29],["strcloud.in",29],["ufret.jp",29],["thenekodark.com",29],["artesacro.org",29],["poli-vsp.ru",29],["polyvsp.ru",29],["ananweb.jp",29],["daimangajiten.com",29],["digital.lasegunda.com",29],["hibiki-radio.jp",29],["garyfeinbergphotography.com",29],["clubulbebelusilor.ro",29],["gplinks.co",29],["ifdreamscametrue.com",29],["marksandspencer.com",29],["stowarzyszenie-impuls.eu",29],["viveretenerife.com",29],["oferty.dsautomobiles.pl",29],["wzamrani.com",29],["citroen.pl",29],["peugeot.pl",29],["wirtualnyspac3r.pl",29],["sporizle1.pw",29],["antena3.com",29],["lasexta.com",29],["pashplus.jp",29],["upvideo.to",29],["kpopsea.com",29],["cnki.net",29],["wpchen.net",29],["hongxiu.com",29],["readnovel.com",29],["uihtm.com",29],["uslsoftware.com",29],["rule34hentai.net",29],["cloudemb.com",29],["news24.jp",29],["gaminplay.com",29],["njjzxl.net",29],["voe.sx",[29,94]],["voe-unblock.com",[29,94]],["scrolller.com",29],["cocomanga.com",29],["nusantararom.org",[29,100]],["virpe.cc",29],["pobre.tv",[29,100]],["ukrainashop.com",29],["celtadigital.com",29],["matzoo.pl",29],["asia2tv.cn",29],["labs.j-novel.club",29],["turbo1.co",29],["futbollatam.com",29],["read.amazon.com",29],["box-manga.com",29],["the-masters-voice.com",29],["hemas.pl",29],["accgroup.vn",29],["btvnovinite.bg",29],["allcryptoz.net",29],["crewbase.net",29],["crewus.net",29],["shinbhu.net",29],["shinchu.net",29],["thumb8.net",29],["thumb9.net",29],["topcryptoz.net",29],["uniqueten.net",29],["ultraten.net",29],["cloudcomputingtopics.net",29],["bianity.net",29],["coinsparty.com",29],["postype.com",29],["lofter.com",[29,108]],["hentaihaven.xxx",29],["espn.com",29],["4media.com",29],["przegladpiaseczynski.pl",29],["freewaysintl.com",29],["cool-etv.net",29],["j91.asia",29],["knshow.com",30],["jusbrasil.com.br",31],["promobit.com.br",33],["techjunkie.com",33],["zerohedge.com",33],["1mg.com",33],["khou.com",33],["10tv.com",33],["artsy.net",34],["boards.net",34],["freeforums.net",34],["proboards.com",34],["tastycookery.com",35],["animeshouse.net",36],["free-mp3-download.net",36],["tepat.id",36],["techsupportall.com",37],["lugarcerto.com.br",38],["satcesc.com",39],["animatedshows.to",39],["miraculous.to",[39,58]],["jootc.com",40],["hikarinoakari.com",40],["operatorsekolahdbn.com",40],["wawlist.com",40],["statelibrary.us",41],["bigulnews.tv",43],["news.chosun.com",44],["androidweblog.com",45],["cronista.com",46],["fcportables.com",47],["venea.net",48],["uta-net.com",49],["downloadtutorials.net",[49,65]],["blog.naver.com",49],["myschool-eng.com",50],["orangespotlight.com",51],["th-world.com",[51,71]],["itvn.pl",52],["itvnextra.pl",52],["kuchniaplus.pl",52],["miniminiplus.pl",52],["player.pl",52],["ttv.pl",52],["tvn.pl",52],["tvn24.pl",52],["tvn24bis.pl",52],["tvn7.pl",52],["tvnfabula.pl",52],["tvnstyle.pl",52],["tvnturbo.pl",52],["x-link.pl",52],["x-news.pl",52],["kickante.com.br",11],["thestar.com.my",11],["corriereadriatico.it",11],["scribd.com",53],["thehouseofportable.com",54],["ntvspor.net",54],["book.zhulang.com",54],["tadu.com",54],["selfstudyhistory.com",55],["lokercirebon.com",56],["avdelphi.com",57],["maxstream.video",58],["wpb.shueisha.co.jp",58],["tiktok.com",[58,69]],["vedantu.com",58],["zsti.zsti.civ.pl",58],["chromotypic.com",[58,95]],["gamoneinterrupted.com",[58,95]],["metagnathtuggers.com",[58,95]],["wolfdyslectic.com",[58,95]],["rationalityaloelike.com",[58,95]],["sizyreelingly.com",[58,95]],["simpulumlamerop.com",[58,95]],["urochsunloath.com",[58,95]],["monorhinouscassaba.com",[58,95]],["counterclockwisejacky.com",[58,95]],["35volitantplimsoles5.com",[58,95]],["scatch176duplicities.com",[58,95]],["antecoxalbobbing1010.com",[58,95]],["boonlessbestselling244.com",[58,95]],["cyamidpulverulence530.com",[58,95]],["guidon40hyporadius9.com",[58,95]],["449unceremoniousnasoseptal.com",[58,95]],["19turanosephantasia.com",[58,95]],["30sensualizeexpression.com",[58,95]],["321naturelikefurfuroid.com",[58,95]],["745mingiestblissfully.com",[58,95]],["availedsmallest.com",[58,95]],["greaseball6eventual20.com",[58,95]],["toxitabellaeatrebates306.com",[58,95]],["20demidistance9elongations.com",[58,95]],["audaciousdefaulthouse.com",[58,95]],["fittingcentermondaysunday.com",[58,95]],["fraudclatterflyingcar.com",[58,95]],["launchreliantcleaverriver.com",[58,95]],["matriculant401merited.com",[58,95]],["realfinanceblogcenter.com",[58,95]],["reputationsheriffkennethsand.com",[58,95]],["telyn610zoanthropy.com",[58,95]],["tubelessceliolymph.com",[58,95]],["tummulerviolableness.com",[58,95]],["un-block-voe.net",[58,95]],["v-o-e-unblock.com",[58,95]],["voe-un-block.com",[58,95]],["voeun-block.net",[58,95]],["voeunbl0ck.com",[58,95]],["voeunblck.com",[58,95]],["voeunblk.com",[58,95]],["voeunblock3.com",[58,95]],["audiotools.pro",58],["magesy.blog",58],["magesypro.pro",58],["audioztools.com",58],["www.ntv.co.jp",58],["faptiti.com",58],["wormate.io",58],["selfstudys.com",58],["adslink.pw",58],["jpopsingles.eu",58],["vinstartheme.com",[58,117]],["leakedzone.com",[58,120]],["fjordd.com",58],["alphapolis.co.jp",59],["juejin.cn",59],["sweetslyrics.com",59],["thegatewaypundit.com",60],["thegearhunt.com",61],["jfdb.jp",62],["loginhit.com.ng",62],["charbelnemnom.com",62],["bphimmoi.net",62],["goodhub.xyz",62],["edailybuzz.com",64],["zhihu.com",64],["qidian.com",64],["invado.pl",64],["webnovel.com",64],["bajecnavareska.sk",65],["lunas.pro",65],["onlinefreecourse.net",65],["pisr.org",65],["uplod.net",65],["thewpclub.net",65],["thememazing.com",65],["themebanks.com",65],["mesquitaonline.com",65],["skandynawiainfo.pl",65],["onlinecoursebay.com",65],["magnet-novels.com",66],["dreamsfriend.com",67],["trakteer.id",68],["699pic.com",68],["kutub3lpdf.com",70],["sklep-agroland.pl",72],["polagriparts.pl",73],["nordkorea-info.de",74],["geotips.net",75],["hardcoregames.ca",76],["lataifas.ro",77],["toppremiumpro.com",78],["wattpad.com",79],["starbene.it",80],["fauxid.com",81],["androidtvbox.eu",82],["nicematin.com",83],["bilibili.com",84],["yamibo.com",85],["fimfiction.net",86],["moegirl.org.cn",87],["bbs.mihoyo.com",88],["jianshu.com",88],["leetcode-cn.com",88],["peekme.cc",90],["ihbarweb.org.tr",91],["baixedetudo.net.br",92],["gardenia.net",93],["wpking.in",96],["hollywoodmask.com",97],["mbalib.com",97],["wenku.baidu.com",98],["mooc.chaoxing.com",99],["www-daftarharga.blogspot.com",100],["realpython.com",101],["linkmate.xyz",102],["cristelageorgescu.ro",103],["novelpia.com",104],["privivkainfo.ru",105],["frameboxxindore.com",105],["descargatepelis.com",106],["vercalendario.info",107],["poipiku.com",109],["postcourier.com.pg",110],["gmx.co.uk",112],["gmx.com",112],["likey.me",113],["wallpaperaccess.com",114],["shortform.com",115],["joysound.com",116],["colors.sonicthehedgehog.com",118],["senpa.io",119],["txori.com",119]]);

const entitiesMap = new Map([["mangaku",29],["dood",29],["streamtape",29],["asiatv",29],["descarga-animex",32],["tabonitobrasil",42],["anisubindo",42],["wstream",58],["voe-unblock",[58,95]],["pobre",[58,111]],["bmovies",63]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const reType = safe.patternToRegex(type);
    const rePattern = safe.patternToRegex(pattern);
    const log = shouldLog(extraArgs);
    const debug = shouldDebug(extraArgs);
    const trapEddEventListeners = ( ) => {
        const eventListenerHandler = {
            apply: function(target, thisArg, args) {
                let type, handler;
                try {
                    type = String(args[0]);
                    handler = String(args[1]);
                } catch(ex) {
                }
                const matchesType = safe.RegExp_test.call(reType, type);
                const matchesHandler = safe.RegExp_test.call(rePattern, handler);
                const matchesEither = matchesType || matchesHandler;
                const matchesBoth = matchesType && matchesHandler;
                if ( log === 1 && matchesBoth || log === 2 && matchesEither || log === 3 ) {
                    safe.uboLog(`addEventListener('${type}', ${handler})`);
                }
                if ( debug === 1 && matchesBoth || debug === 2 && matchesEither ) {
                    debugger; // jshint ignore:line
                }
                if ( matchesBoth ) { return; }
                return Reflect.apply(target, thisArg, args);
            },
            get(target, prop, receiver) {
                if ( prop === 'toString' ) {
                    return target.toString.bind(target);
                }
                return Reflect.get(target, prop, receiver);
            },
        };
        self.EventTarget.prototype.addEventListener = new Proxy(
            self.EventTarget.prototype.addEventListener,
            eventListenerHandler
        );
    };
    runAt(( ) => {
        trapEddEventListeners();
    }, extraArgs.runAt);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.has('canDebug') && details.debug;
}

function shouldLog(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.has('canDebug') && details.log;
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
    try { addEventListenerDefuser(...argsList[i]); }
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
    return uBOL_addEventListenerDefuser();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_addEventListenerDefuser = cloneInto([
            [ '(', uBOL_addEventListenerDefuser.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_addEventListenerDefuser);
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
    delete page.uBOL_addEventListenerDefuser;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
