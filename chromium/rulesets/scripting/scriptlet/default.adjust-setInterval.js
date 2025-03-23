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

// ruleset: default

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_adjustSetInterval() {

/******************************************************************************/

function adjustSetInterval(
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
        ? Math.min(Math.max(boost, 0.001), 50)
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["","1200","0"],[],["stop()"],["clearInterval"],["myTimer","1500"],["countdown","2000"],["counter","2000"],["","1800"],["","","0"],["yuidea-","*"],["timeLeft"],["","","0.001"],["time"],["time","2500"],["clearInterval","*"],["seconds"],["","","0.02"],["time.html","1000"],["/SplashScreen|BannerAd/"],["i--"],["","*","0"],["js-btn-skip","1000"],["countdown","*","0.001"],["timer"],["gotolink"],["/.?/","*","0.002"],["/.?/","*","0.02"],["counter","*","0.02"],["/wpsafe|wait/","*","0.001"],["timer","*","0.02"],["timer","*"],["/.?/","*","0.001"],["tid","*","0.02"],["timeLeft","*","0.001"],["timer","*","0.001"],["counter","*","0.001"],["timer","1000","0.001"],["timer","1600","0.001"],["count","*","0.001"],["counter"],["/counter|wait/","*","0.001"],["interval","*"],["sec--","*","0.001"],["","*","0.02"],["countdown"],["show_download_links"],["counter","*"],["countDown"],["downloadTimer"],["","","0.3"],["time","","0"],["sec--"],["secs"],["_0x"],["timer.remove"],["downloadButton"],["timePassed"],["timeleft"],["counter--"],["(i-1)"],["skipOptions"],["countDown","1150","0.5"],["timercounter"],["count","*"],["#timer"],["temp"],["counter","","0.02"],["timer","1800"],["distance"],["count"],["contador"],["display"],["second"],["timer","1500"],["updatePercentage","100","0.02"],["current()"],["l","","0"],["countdown","*","0.02"],["time","","0.02"],["wait"],["downloadToken"],["updateProgress","*"],["current-=1","*","0.001"],["_0x","*","0.001"],["counter","1000","0.001"],["scrollIncrement","*"],["","*","0.001"],["saniye"],["","1000","0.001"],["generalTimeLeft","*","0.001"],["invoke","1000"],["download","*","0.02"],["countdown","*"],["/count|verify|isCompleted/","","0.001"],["circle_animation"],["skipAdSeconds","","0.02"],["adv","*"]];
const hostnamesMap = new Map([["deportealdia.live",0],["noticiasesports.live",0],["123link.*",1],["platinmods.*",1],["al.ly",1],["bbf.lt",1],["cpmlink.net",1],["cut-urls.com",1],["eg4link.*",1],["idlelivelink.*",1],["igram.*",1],["iiv.pl",1],["ur.ly",1],["url.gem-flash.com",1],["zeiz.me",1],["1ink.cc",1],["lin-ks.*",1],["xberuang.*",1],["soft112.com",1],["short-url.link",1],["4download.net",1],["s.sseluxx.com",1],["onifile.com",1],["topflix.*",1],["coolmathgames.com",1],["link-to.net",1],["telepisodes.org",1],["onle.co",1],["fstore.biz",1],["deltabit.co",1],["puzzles.msn.com",1],["leechall.*",1],["sfile.mobi",1],["upfile.us",1],["game-kentang.blogspot.com",1],["shortgoo.blogspot.com",1],["bde4.*",1],["indavideo.hu",1],["sfirmware.com",1],["mobilelegends.shop",1],["ockles.com",1],["urlpay.net",1],["underhentai.net",1],["suanoticia.online",1],["linkconfig.com",1],["lg-firmwares.com",1],["aylink.co",1],["gitizle.vip",1],["shtms.co",1],["cryptokinews.com",1],["cpmlink.pro",1],["policiesreview.com",1],["speedynews.xyz",[1,74]],["infokeeda.xyz",1],["webzeni.com",1],["tutwuri.id",1],["khaddavi.net",1],["lokerwfh.net",1],["mysflink.blogspot.com",1],["runmods.com",1],["anomize.xyz",1],["bondibeachau.com",1],["konstantinova.net",1],["kangkimin.com",1],["iklandb.com",1],["thingiverse.com",1],["ufreegames.com",1],["bdlink.pw",1],["fairyanime.com",1],["lootlinks.*",1],["7misr4day.com",1],["sama-pro.com",1],["otomi-games.com",1],["curseforge.com",1],["mobitaak.com",1],["arhplyrics.in",1],["telenord.it",1],["raky.in",1],["desiflixindia.com",1],["diglink.blogspot.com",1],["vkprime.com",1],["i-polls.com",1],["freecoursesonline.me",1],["yesdownloader.com",1],["games.metv.com",1],["arkadium.com",1],["tonanmedia.my.id",1],["skiplink.me",1],["yurasu.xyz",1],["isekaipalace.com",1],["mitedrive.com",1],["miteblog.com",1],["games.dailymail.co.uk",1],["fullhd4k.com",1],["juegos.eleconomista.es",1],["filmizlehdfilm.com",1],["filmizletv.*",1],["fullfilmizle.cc",1],["gofilmizle.net",1],["easybib.com",1],["modcombo.com",1],["wallpaperaccess.com",1],["ouo.*",2],["indi-share.com",3],["premid.app",3],["cheatcloud.cc",3],["cheater.ninja",3],["cheatermad.com",3],["cheatsquad.gg",3],["freepdf-books.com",4],["themeslide.com",5],["thememypc.net",6],["rezence.com",[6,46]],["mikl4forex.com",6],["gawbne.com",6],["forex-trnd.com",6],["link.tl",7],["lnk.news",8],["lnk.parts",8],["fssquad.com",8],["easylinkref.com",8],["acortalo.*",8],["acortar.*",8],["megadescarga.net",8],["megadescargas.net",8],["gamelopte.com",9],["goto.com.np",10],["vrcmods.com",10],["consoleroms.com",10],["romspedia.com",10],["forexlap.com",11],["forexmab.com",11],["forexwaw.club",11],["forex-articles.com",11],["fx4vip.com",11],["forexrw7.com",[11,42]],["3rabsports.com",11],["fx-22.com",[11,42]],["gold-24.net",[11,42]],["icutlink.com",12],["android-apk.org",12],["zegtrends.com",13],["simsdom.com",14],["fansonlinehub.com",14],["hotmediahub.com",14],["terabox.fun",14],["teralink.me",14],["terashare.me",14],["teraearn.com",14],["fautsy.com",15],["multifaucet.org",15],["coinlyhub.com",15],["i-bits.io",15],["claimbits.io",15],["mundotec.pro",15],["filemoon.*",15],["legionjuegos.org",16],["legionpeliculas.org",16],["legionprogramas.org",16],["so1.asia",16],["dutchycorp.*",17],["gamearter.com",18],["bluemediafiles.*",19],["ayobelajarbareng.com",20],["semawur.com",20],["doofree88.com",21],["acdriftingpro.com",22],["pixsera.net",23],["imgair.net",23],["imgblaze.net",23],["imgfrost.net",23],["vestimage.site",23],["pixlev.*",23],["imgyer.store",23],["pixqbngg.shop",23],["pixqwet.shop",23],["pixmos.shop",23],["imgtgd.shop",23],["imgcsxx.shop",23],["imgqklw.shop",23],["pixqkhgrt.shop",23],["imgcssd.shop",23],["imguwjsd.sbs",23],["pictbbf.shop",23],["pixbryexa.sbs",23],["picbqqa.sbs",23],["pixbkghxa.sbs",23],["imgmgf.sbs",23],["picbcxvxa.sbs",23],["imguee.sbs",23],["imgmffmv.sbs",23],["imgbqb.sbs",23],["imgbyrev.sbs",23],["imgbncvnv.sbs",23],["pixtryab.shop",23],["imggune.shop",23],["pictryhab.shop",23],["pixbnab.shop",23],["imgbnwe.shop",23],["imgbbnhi.shop",23],["imgnbii.shop",23],["imghqqbg.shop",23],["imgyhq.shop",23],["pixnbrqwg.sbs",23],["pixnbrqw.sbs",23],["picmsh.sbs",23],["imgpke.sbs",23],["picuenr.sbs",23],["imgolemn.sbs",23],["imgoebn.sbs",23],["picnwqez.sbs",23],["imgjajhe.sbs",23],["pixjnwe.sbs",23],["pixkfjtrkf.shop",23],["pixkfkf.shop",23],["pixdfdjkkr.shop",23],["pixdfdj.shop",23],["picnft.shop",23],["pixrqqz.shop",23],["picngt.shop",23],["picjgfjet.shop",23],["picjbet.shop",23],["imgkkabm.shop",23],["imgxabm.shop",23],["imgthbm.shop",23],["imgmyqbm.shop",23],["imgwwqbm.shop",23],["imgjvmbbm.shop",23],["imgjbxzjv.shop",23],["imgjmgfgm.shop",23],["picxnkjkhdf.sbs",23],["imgxxbdf.sbs",23],["imgnngr.sbs",23],["imgjjtr.sbs",23],["imgqbbds.sbs",23],["imgbvdf.sbs",23],["imgqnnnebrf.sbs",23],["imgnnnvbrf.sbs",23],["takez.co",23],["cararegistrasi.com",23],["ipa-apps.me",23],["imslp.org",23],["michaelemad.com",23],["chooyomi.com",23],["libertycity.net",23],["apps2app.com",24],["call-bomber.info",25],["kajernews.com",25],["vyaapaarguru.in",25],["tech5s.co",26],["game5s.com",26],["yalifin.xyz",26],["lrncook.xyz",26],["gadgetsreview27.com",26],["newsbawa.com",26],["acetack.com",26],["androidquest.com",26],["apklox.com",26],["chhaprawap.in",26],["gujarativyakaran.com",26],["kashmirstudentsinformation.in",26],["kisantime.com",26],["shetkaritoday.in",26],["pastescript.com",26],["trimorspacks.com",26],["updrop.link",26],["fx-gd.net",26],["healthy4pepole.com",26],["hightrip.net",26],["to-travel.net",26],["tech24us.com",27],["freethemesy.com",27],["veganab.co",28],["camdigest.com",28],["nichapk.com",29],["easyworldbusiness.com",29],["riveh.com",29],["bookszone.in",30],["uptechnologys.com",31],["sevenjournals.com",31],["labgame.io",32],["overgal.com",33],["10short.*",34],["mamahawa.com",34],["lollty.pro",34],["postazap.com",34],["financeyogi.net",34],["finclub.in",34],["easywithcode.tech",34],["letest25.co",34],["truevpnlover.com",34],["financebolo.com",34],["rphost.in",34],["vedamdigi.tech",34],["cancelguider.online",34],["bigdata.rawlazy.si",35],["codesnse.com",35],["filmypoints.in",36],["flightsim.to",36],["freethailottery.live",37],["progfu.com",37],["currentrecruitment.com",38],["investorveda.com",38],["computerpedia.in",38],["edukaroo.com",38],["advicefunda.com",38],["bestloanoffer.net",38],["techconnection.in",38],["itscybertech.com",39],["filessrc.com",39],["srcimdb.com",39],["droidmirror.com",39],["infokik.com",39],["arealgamer.org",39],["gamingbeasts.com",39],["uploadbeast.com",39],["travel.vebma.com",40],["cloud.majalahhewan.com",40],["crm.cekresi.me",40],["ai.tempatwisata.pro",40],["cinedesi.in",41],["thevouz.in",41],["tejtime24.com",41],["techishant.in",41],["whatgame.xyz",42],["mooonten.com",42],["msic.site",42],["rfiql.com",43],["gujjukhabar.in",43],["smartfeecalculator.com",43],["djxmaza.in",43],["thecubexguide.com",43],["jytechs.in",43],["aman-dn.blogspot.com",44],["ipalibrary.me",44],["hieunguyenphoto.com",44],["apkmb.com",45],["apkhihe.com",45],["aemenstore.com",46],["byboe.com",46],["cazzette.com",46],["dreamcheeky.com",46],["fidlarmusic.com",46],["hookeaudio.com",46],["jncojeans.com",46],["kiemlua.com",46],["kingsleynyc.com",46],["lucidcam.com",46],["nguyenvanbao.com",46],["nousdecor.com",46],["pennbookcenter.com",46],["publicananker.com",46],["restorbio.com",46],["staaker.com",46],["samapkstore.com",47],["5ggyan.com",47],["brotherfox91.shop",47],["currentcolorq2dv.shop",47],["customsfencei3.shop",47],["fencethoughgdrt.shop",47],["fencethroughout642.shop",47],["foxwent6ot.shop",47],["havingmovementu8x.shop",47],["homebasis4d.shop",47],["includingbreath5ku.shop",47],["ironwinter6m.shop",47],["leadmorning4ivn.shop",47],["linelocatemfsn.shop",47],["littlesound6c.shop",47],["mindmotion93y8.shop",47],["mightbadly4f.shop",47],["monkeynecktj4w.shop",47],["neighbormajorkex.shop",47],["nervousdoctor9bx.shop",47],["pantogether6jpi.shop",47],["quietlywheat23.shop",47],["saddletopg3tk.shop",47],["soldrubber5xrp.shop",47],["somehowrockyng.shop",47],["strangernervousql.shop",47],["superabbit.shop",47],["supportrightufd.shop",47],["studyinghuman6js.shop",47],["wholecommonrrvp.shop",47],["wintertold7nq.shop",47],["shortenbuddy.com",48],["jpopsingles.eu",48],["vanillatweaks.net",48],["emulatorgames.net",49],["menjelajahi.com",50],["luckydice.net",51],["unityassetcollection.com",52],["rethmic.com",53],["romhustler.org",54],["filmyhitlink.xyz",55],["cinemakottaga.*",56],["allwpworld.com",57],["trzpro.com",58],["techhelpbd.com",58],["zedge.net",59],["send-anywhere.com",60],["upstore.net",61],["rincondelsazon.com",62],["tattoosbeauty.com",62],["disheye.com",63],["yifysub.net",64],["mp3juices.icu",65],["bingotingo.com",66],["thizissam.in",66],["techyreviewx.com",67],["redirect.dafontvn.com",68],["cue-vana.com",69],["crdroid.net",69],["rlxtech.tech",69],["privatemoviez.*",69],["sonixgvn.net",69],["descargatepelis.com",70],["edufileshare.com",71],["wowroms.com",72],["mhma12.tech",73],["play.aidungeon.io",75],["whatsappmods.net",76],["adshnk.com",77],["blogmado.com",78],["pinloker.com",79],["sekilastekno.com",79],["web1s.asia",79],["fikper.com",80],["tralhasvarias.blogspot.com",81],["busuu.com",82],["newscon.org",83],["recipahi.com",84],["thestar.com",85],["obaianinho.com",86],["punkrust.net",87],["apkprime.org",88],["arcade.buzzrtv.com",89],["arcade.lemonde.fr",89],["arena.gamesforthebrain.com",89],["bestpuzzlesandgames.com",89],["cointiply.arkadiumarena.com",89],["gamelab.com",89],["games.abqjournal.com",89],["games.amny.com",89],["games.bellinghamherald.com",89],["games.besthealthmag.ca",89],["games.bnd.com",89],["games.boston.com",89],["games.bostonglobe.com",89],["games.bradenton.com",89],["games.centredaily.com",89],["games.charlotteobserver.com",89],["games.cnhinews.com",89],["games.crosswordgiant.com",89],["games.dallasnews.com",89],["games.daytondailynews.com",89],["games.denverpost.com",89],["games.everythingzoomer.com",89],["games.fresnobee.com",89],["games.gameshownetwork.com",89],["games.get.tv",89],["games.greatergood.com",89],["games.heraldonline.com",89],["games.heraldsun.com",89],["games.idahostatesman.com",89],["games.insp.com",89],["games.islandpacket.com",89],["games.journal-news.com",89],["games.kansas.com",89],["games.kansascity.com",89],["games.kentucky.com",89],["games.lancasteronline.com",89],["games.ledger-enquirer.com",89],["games.macon.com",89],["games.mashable.com",89],["games.mercedsunstar.com",89],["games.miamiherald.com",89],["games.modbee.com",89],["games.moviestvnetwork.com",89],["games.myrtlebeachonline.com",89],["games.nationalreview.com",89],["games.newsobserver.com",89],["games.parade.com",89],["games.pressdemocrat.com",89],["games.puzzlebaron.com",89],["games.puzzler.com",89],["games.puzzles.ca",89],["games.qns.com",89],["games.readersdigest.ca",89],["games.sacbee.com",89],["games.sanluisobispo.com",89],["games.sixtyandme.com",89],["games.sltrib.com",89],["games.springfieldnewssun.com",89],["games.star-telegram.com",89],["games.startribune.com",89],["games.sunherald.com",89],["games.theadvocate.com",89],["games.thenewstribune.com",89],["games.theolympian.com",89],["games.theportugalnews.com",89],["games.thestar.com",89],["games.thestate.com",89],["games.tri-cityherald.com",89],["games.triviatoday.com",89],["games.usnews.com",89],["games.word.tips",89],["games.wordgenius.com",89],["games.wtop.com",89],["jeux.meteocity.com",89],["juegos.as.com",89],["juegos.elnuevoherald.com",89],["juegos.elpais.com",89],["philly.arkadiumarena.com",89],["play.dictionary.com",89],["puzzles.bestforpuzzles.com",89],["puzzles.centralmaine.com",89],["puzzles.crosswordsolver.org",89],["puzzles.independent.co.uk",89],["puzzles.nola.com",89],["puzzles.pressherald.com",89],["puzzles.standard.co.uk",89],["puzzles.sunjournal.com",89],["restegourmet.de",90],["getmodsapk.com",91],["5play.*",92],["tech.unblockedgames.world",93],["lewdzone.com",94],["novelgames.com",95],["3bmeteo.com",96]]);
const exceptionsMap = new Map([["go.skiplink.me",[1]],["encurtador.postazap.com",[34]]]);
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
    try { adjustSetInterval(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
