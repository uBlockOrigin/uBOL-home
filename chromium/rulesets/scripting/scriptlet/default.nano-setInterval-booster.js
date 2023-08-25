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
const uBOL_nanoSetIntervalBooster = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [[],["","1200","0"],["generalTimeLeft","*","0.02"],["myTimer","1500"],["countdown","2000"],["downloadTimer"],["","","0"],["counter","2000"],["","1800"],["yuidea-","*"],["timeLeft"],["time"],["time","2500"],["clearInterval","*"],["seconds"],["","","0.02"],["time.html","1000"],["inner"],["circle_animation"],["timer","1000","0.6"],["countdown"],["web_counter"],["video_counter"],["/SplashScreen|BannerAd/"],["i--"],["","*","0"],["curAd"],["js-btn-skip","1000"],["clearInterval"],["timer","*"],["timer"],["gotolink"],["show_download_links"],["","800"],["counter","*"],["countDown"],["runDownload"],["","100","0"],["timer","1500"],["","","0.3"],["sec--"],["#timer"],["timer","1100"],["time","","0"],["counter"],["secs"],["download"],["_0x"],["timer.remove"],["downloadButton"],["timePassed"],["timeleft"],["counter--"],["(i-1)"],["skipOptions"],["countDown","1150","0.5"],["btn-success"],["timercounter"],["count","*"],["temp"],["sec"],["counter","","0.02"],["timePassed","1300"],["timer","1800"],["download_delay"],["countc"],["distance"],["count"],["contador"],["display"],["timer","*","0.02"],["second"],["updatePercentage","100","0.02"],["current()"],["l","","0"],["timeSec","*"],["/verify_text|isCompleted/","*"],["countdown","*","0.02"],["time","","0.02"],["wait"],["downloadToken"],["updateProgress","*"],["current-=1"],["scrollIncrement","*"],["skipAdSeconds","","0.02"]];

const hostnamesMap = new Map([["shrink-service.it",0],["mage.si",0],["kanqite.com",0],["al.ly",0],["bbf.lt",0],["cpmlink.net",0],["cut-urls.com",0],["iiv.pl",0],["shink.me",0],["ur.ly",0],["url.gem-flash.com",0],["zeiz.me",0],["1ink.cc",0],["azlink.xyz",0],["likn.xyz",0],["soft112.com",0],["short-url.link",0],["4download.net",0],["s.sseluxx.com",0],["onifile.com",0],["coolmathgames.com",0],["link-to.net",[0,20,21,22]],["telepisodes.org",0],["onle.co",0],["freeupload.info",0],["fstore.biz",0],["uploadfree.info",0],["deltabit.co",0],["puzzles.msn.com",0],["shon.xyz",0],["keisekaikuy.blogspot.com",0],["opensubtitles.org",0],["linkvertise.com",0],["sfile.mobi",0],["upfile.us",0],["game-kentang.blogspot.com",0],["shortgoo.blogspot.com",0],["indavideo.hu",0],["sfirmware.com",0],["claim4.fun",0],["mobilelegends.shop",0],["ockles.com",0],["urlpay.net",0],["underhentai.net",0],["customercareal.com",0],["faupto.com",0],["freelitecoin.vip",0],["suanoticia.online",0],["linkconfig.com",0],["lg-firmwares.com",0],["mysflink.blogspot.com",0],["runmods.com",0],["anomize.xyz",0],["bondibeachau.com",0],["konstantinova.net",0],["kangkimin.com",0],["iklandb.com",0],["onepiecex.xyz",0],["thingiverse.com",0],["ufreegames.com",0],["saungfirmware.id",0],["aylink.co",0],["gitizle.vip",0],["shtms.co",0],["kpopstan.com",0],["bdlink.pw",0],["fairyanime.com",0],["speedynews.xyz",[0,72]],["7misr4day.com",0],["sama-pro.com",0],["otomi-games.com",0],["coinunit.ashortstory.in",0],["seowebnews.com",0],["curseforge.com",0],["gamalk-sehetk.com",0],["healdad.com",0],["mobitaak.com",0],["arhplyrics.in",0],["techmart4u.in",0],["telenord.it",0],["raky.in",0],["desiflixindia.com",0],["insurance.iptvsetupguide.com",0],["javguru.top",0],["diglink.blogspot.com",0],["vkprime.com",0],["i-polls.com",0],["freecoursesonline.me",0],["yesdownloader.com",0],["games.metv.com",0],["arkadium.com",0],["tonanmedia.my.id",0],["skiplink.me",0],["vebma.com",0],["yurasu.xyz",0],["isekaipalace.com",0],["khaddavi.net",0],["jrtekno.com",0],["mitedrive.com",0],["miteblog.com",0],["games.dailymail.co.uk",0],["wallpaperaccess.com",0],["deportealdia.live",1],["noticiasesports.live",1],["noweconomy.live",1],["puzzles.standard.co.uk",2],["puzzles.independent.co.uk",2],["puzzles.bestforpuzzles.com",2],["arkadiumarena.com",2],["games.charlotteobserver.com",2],["games.miamiherald.com",2],["games.startribune.com",2],["games.word.tips",2],["freepdf-books.com",3],["themeslide.com",4],["jpopsingles.eu",5],["shortenbuddy.com",5],["megadescarga.net",6],["megadescargas.net",6],["lnk.news",6],["lnk.parts",6],["forexlap.com",6],["forexmab.com",6],["forexwaw.club",6],["forex-articles.com",6],["fx4vip.com",6],["fssquad.com",6],["easylinkref.com",6],["thememypc.net",7],["sanoybonito.club",7],["dreamcheeky.com",[7,34]],["fidlarmusic.com",[7,34]],["publicananker.com",[7,34]],["rezence.com",[7,34]],["rodjulian.com",[7,34]],["mikl4forex.com",7],["gawbne.com",7],["forex-golds.com",7],["forex-trnd.com",[7,30]],["link.tl",8],["gamelopte.com",9],["goto.com.np",10],["vrcmods.com",10],["bitefaucet.com",10],["dramaworldhd.co",10],["edummm.xyz",10],["consoleroms.com",10],["romspedia.com",10],["shortlinks.tech",10],["icutlink.com",11],["android-apk.org",11],["zegtrends.com",12],["simsdom.com",13],["hotmediahub.com",13],["terabox.fun",13],["fautsy.com",14],["multifaucet.org",14],["coinlyhub.com",14],["i-bits.io",14],["claimbits.io",14],["dogeatm.com",14],["mundotec.pro",14],["legionjuegos.org",15],["legionpeliculas.org",15],["legionprogramas.org",15],["so1.asia",15],["recipesdelite.com",17],["lewdzone.com",18],["elil.cc",19],["direct-link.net",[20,21,22]],["direkt-wissen.com",[20,21,22]],["py.md",20],["mohammedkhc.com",20],["ipalibrary.me",20],["gamearter.com",23],["onlyhgames.com",24],["ayobelajarbareng.com",25],["semawur.com",25],["yoshare.net",25],["techmody.io",25],["ez4mods.com",25],["series-d.com",26],["doofree88.com",27],["cheatcloud.cc",28],["cheater.ninja",28],["cheatermad.com",28],["cheatsquad.gg",28],["premid.app",28],["mynewsmedia.co",29],["revadvert.com",29],["imgair.net",30],["imgblaze.net",30],["imgfrost.net",30],["pixsera.net",30],["vestimage.site",30],["imgwia.buzz",30],["imgkaka.xyz",30],["imgux.buzz",30],["imgewe.buzz",30],["imguebr.buzz",30],["imgbew.buzz",30],["imgxxxx.buzz",30],["imgeza.buzz",30],["imgzzzz.buzz",30],["imgxhfr.buzz",30],["imgqwt.buzz",30],["imgtwq.buzz",30],["imgbjryy.buzz",30],["imgjetr.buzz",30],["imgxelz.buzz",30],["imgytreq.buzz",30],["mrlzqoe.buzz",30],["utinwpqqui.buzz",30],["pyotinle.buzz",30],["velnibug.buzz",30],["optiye.buzz",30],["imgbeaw.buzz",30],["imgnfg.buzz",30],["imguqkt.buzz",30],["imgxhgh.buzz",30],["imgwelz.buzz",30],["pixnbvj.buzz",30],["imgxkhm.buzz",30],["imagepuitr.buzz",30],["imagent.buzz",30],["imgjtuq.buzz",30],["imgkixx.buzz",30],["im1.buzz",30],["imgkux.buzz",30],["imgpiluka.website",30],["imgxhtue.website",30],["imgpuloki.online",30],["imgmilu.store",30],["picliume.store",30],["pixmela.online",30],["imgpukrr.site",30],["picuekr.site",30],["pixotor.cfd",30],["imgmgh.site",30],["imgnefl.site",30],["imglekw.site",30],["imgsdi.site",30],["imgneor.store",30],["imgsdi.store",30],["imgpukxxr.site",30],["imgsdi.website",30],["imgsxo.site",30],["imgxto.store",30],["imgutkr.store",30],["imghhr.online",30],["imglaiw.store",30],["imgotw.store",30],["imgpai.online",30],["imgqyrew.store",30],["imgutkr.online",30],["imgvue.online",30],["imgxgf.store",30],["imgxqy.online",30],["imgbibam.online",30],["imgngf.online",30],["imgqaz.online",30],["imgulur.online",30],["imgurj.online",30],["imgurt.online",30],["imgwtz.online",30],["imgwxr.online",30],["imgwzr.online",30],["imgyre.online",30],["imgbak.store",30],["imgbek.store",30],["picler.store",30],["piclerx.store",30],["piclerz.store",30],["pixlev.store",30],["pixmax.store",30],["pixmex.store",30],["imgbaex.store",30],["imgbah.online",30],["imgbaie.online",30],["imgbango.store",30],["imgbier.store",30],["imgbimn.store",30],["imgbqw.store",30],["imgbuba.online",30],["imgbwe.store",30],["imgbxs.online",30],["imgcao.store",30],["imgnwe.online",30],["imgqge.store",30],["imgqxb.online",30],["imgteq.online",30],["imgtex.online",30],["imgtuta.online",30],["imgwqr.online",30],["imgwww.store",30],["imgxza.store",30],["imgezx.sbs",30],["imgbcxsb.store",30],["imgbcxs.store",30],["imgbake.cfd",30],["imgmffg.sbs",30],["imgmffgtr.sbs",30],["imgnbg.sbs",30],["imgngc.sbs",30],["imgnmh.cfd",30],["imgqte.sbs",30],["imguthes.sbs",30],["imgwag.cfd",30],["imgwang.cfd",30],["imgwety.sbs",30],["imgxuh.cfd",30],["imgxytw.cfd",30],["imgycgey.sbs",30],["imgyruy.cfd",30],["imgyusa.cfd",30],["imgyyqey.sbs",30],["imgyer.store",30],["imgxhs.store",30],["imgwekr.online",30],["imgwbfh.online",30],["imgwak.online",30],["imgutry.online",30],["nightfallnews.com",30],["cararegistrasi.com",30],["ipa-apps.me",30],["theicongenerator.com",30],["zentum.club",30],["flightsim.to",30],["imslp.org",30],["michaelemad.com",30],["world-trips.net",30],["financeflix.in",30],["technoflip.in",30],["chooyomi.com",30],["freebrightsoft.com",30],["takez.co",30],["go.freetrx.fun",30],["imgutiyu.online",30],["imgutbbn.online",30],["imgubfd.online",30],["imgrei.online",30],["imgqec.online",30],["imgpaiou.online",30],["imgpaiki.online",30],["imgmjj.store",30],["imgfa.store",30],["imgbutrt.store",30],["imgbty.store",30],["imgbdl.store",30],["imgngh.sbs",30],["imgbbfg.pics",30],["imgjhrjjr.pics",30],["apps2app.com",31],["apkmb.com",32],["apkhihe.com",32],["moalm-qudwa.blogspot.com",33],["aemenstore.com",34],["alogum.com",34],["anhdep24.com",34],["byboe.com",34],["cazzette.com",34],["hookeaudio.com",34],["jncojeans.com",34],["kiemlua.com",34],["kingsleynyc.com",34],["lucidcam.com",34],["nguyenvanbao.com",34],["nousdecor.com",34],["pennbookcenter.com",34],["restorbio.com",34],["staaker.com",34],["uebnews.online",34],["thegoneapp.com",34],["techus.website",34],["ptjobsz.xyz",34],["tech24us.com",34],["samapkstore.com",35],["5ggyan.com",35],["hipsonyc.com",35],["nulleb.com",36],["janusnotes.com",37],["absolutesmmpanel.com",38],["myhiddentech.com",38],["mhma12.tech",38],["emulatorgames.net",39],["doctor-groups.com",40],["luckydice.net",40],["crypto-faucet.xyz",40],["cashearn.cc",41],["yifysub.net",41],["ohyeah1080.site",42],["menjelajahi.com",43],["thaitrieuvi.live",44],["forexeen.us",44],["health-and.me",44],["filessrc.com",44],["srcimdb.com",44],["droidmirror.com",44],["infokik.com",44],["itscybertech.com",44],["arealgamer.org",44],["unityassetcollection.com",45],["romadd.com",46],["rethmic.com",47],["romhustler.org",48],["filmyhitlink.xyz",49],["allwpworld.com",51],["forex-gold.net",51],["trzpro.com",52],["techhelpbd.com",52],["zedge.net",53],["send-anywhere.com",54],["upstore.net",55],["maxurlz.com",56],["rincondelsazon.com",57],["tattoosbeauty.com",57],["disheye.com",58],["computerpedia.in",58],["mp3juices.icu",59],["watchdoge.xyz",60],["bingotingo.com",61],["thizissam.in",61],["proviralhost.com",62],["urbharat.xyz",62],["techyreviewx.com",63],["jojo-themes.net",64],["privatemoviez.fun",65],["redirect.dafontvn.com",66],["cue-vana.com",67],["crdroid.net",67],["rlxtech.tech",67],["privatemoviez.best",67],["descargatepelis.com",68],["edufileshare.com",69],["wowroms.com",71],["play.aidungeon.io",73],["whatsappmods.net",74],["vocalley.com",75],["hashhackers.com",76],["katdrive.net",76],["newsongs.co.in",76],["adshnk.com",77],["blogmado.com",78],["pinloker.com",79],["sekilastekno.com",79],["fikper.com",80],["tralhasvarias.blogspot.com",81],["busuu.com",82],["thestar.com",83],["novelgames.com",84]]);

const entitiesMap = new Map([["123link",0],["platinmods",0],["eg4link",0],["idlelivelink",0],["igram",0],["lin-ks",0],["xberuang",0],["topflix",0],["leechall",0],["bde4",0],["lootlinks",0],["acortalo",6],["acortar",6],["filemoon",14],["dutchycorp",16],["bluemediafiles",24],["pixlev",30],["cinemakottaga",50],["technicalatg",70]]);

const exceptionsMap = new Map([["go.skiplink.me",[0]]]);

/******************************************************************************/

function nanoSetIntervalBooster(
    needleArg = '',
    delayArg = '',
    boostArg = ''
) {
    if ( typeof needleArg !== 'string' ) { return; }
    const safe = safeSelf();
    const reNeedle = safe.patternToRegex(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.02), 50)
        : 0.05;
    self.setInterval = new Proxy(self.setInterval, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
        }
    });
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
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
    try { nanoSetIntervalBooster(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_nanoSetIntervalBooster();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_nanoSetIntervalBooster = cloneInto([
            [ '(', uBOL_nanoSetIntervalBooster.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_nanoSetIntervalBooster);
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
    delete page.uBOL_nanoSetIntervalBooster;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
