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
(function uBOL_abortOnPropertyWrite() {

/******************************************************************************/

function abortOnPropertyWrite(
    prop = ''
) {
    if ( typeof prop !== 'string' ) { return; }
    if ( prop === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('abort-on-property-write', prop);
    const exceptionToken = getExceptionTokenFn();
    let owner = window;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        owner = owner[prop.slice(0, pos)];
        if ( owner instanceof Object === false ) { return; }
        prop = prop.slice(pos + 1);
    }
    delete owner[prop];
    Object.defineProperty(owner, prop, {
        set: function() {
            safe.uboLog(logPrefix, 'Aborted');
            throw new ReferenceError(exceptionToken);
        }
    });
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

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["SZAdBlockDetection"],["_sp_"],["yafaIt"],["Fingerprint2"],["adcashMacros"],["open"],["openLity"],["ad_abblock_ad"],["Adcash"],["cticodes"],["imgadbpops"],["IS_ADBLOCK"],["__NA"],["ads_priv"],["ab_detected"],["t4PP"],["sc_adv_out"],["pURL"],["AdBlockDetectorWorkaround"],["__htapop"],["atOptions"],["popzone"],["encodeURIComponent"],["stagedPopUnder"],["closeMyAd"],["smrtSP"],["tiPopAction"],["ExoLoader"],["adv_pre_duration"],["adv_post_duration"],["hidekeep"],["ShowAdbblock"],["smrtSB"],["EPeventFire"],["adBlockDetected"],["segs_pop"],["$getWin"],["xhr.prototype.realSend"],["popUpUrl"],["btoa"],["decodeURIComponent"],["adsHeight"],["adsBlocked"],["SubmitDownload1"],["getIfc"],["adBlockRunning"],["I833"],["Aloader"],["bindall"],["KillAdBlock"],["checkAdBlocker"],["deployads"],["close_screen"],["mockingbird"],["checkAds"],["check"],["decodeURI"],["downloadJSAtOnload"],["ReactAds"],["phtData"],["killAdBlock"],["adBlocker"],["Ha"],["spot"],["block_detected"],["document.getElementsByClassName"],["ABD"],["mfbDetect"],["ab_cl"],["ai_adb_overlay"],["showMsgAb"],["wutimeBotPattern"],["popup_ads"],["adblockerpopup"],["adblockCheck"],["cancelAdBlocker"],["adblock"],["ExoSupport"],["mobilePop"],["base64_decode"],["mdp_deblocker"],["showModal"],["daCheckManager"],["backgroundBanner"],["AdBDetected"],["onScriptError"],["AdbModel"],["window.onload"],["_pop"],["displayCache"],["SpecialUp"],["ai_front"],["DoodPop"],["tmnramp"],["onpopstate"],["__C"],["HTMLElement.prototype.insertAdjacentHTML"],["__aaZoneid"],["app_advert"],["puShown"],["ospen"],["afScript"],["b2a"],["_chjeuHenj"],["bullads"],["detector_launch"],["afStorage"],["adBlocked"],["u_cfg"],["p$00a"],["c325"],["akadb"],["BetterJsPop"],["DOMAssistant"],["rotator"],["Script_Manager"],["NREUM"],["pbjs"],["detectAdblocker"],["document.ready"],["auto_safelink"],["counter"],["adBlckActive"],["infoey"],["popName"],["checkAdsStatus"],["protection"],["uBlockActive"],["HTMLScriptElement.prototype.onerror"],["canRunAds"],["probeScript"],["detectedAdblock"],["showADBOverlay"],["adbEnableForPage"],["Fingerprent2"],["opopnso"],["c0ZZ"],["lifeOnwer"],["checkForAdBlocker"],["ADMITAD"],["ftr__startScriptLoad"],["CoinNebula"]];
const hostnamesMap = new Map([["sueddeutsche.de",0],["autobytel.com",1],["cesoirtv.com",1],["huffingtonpost.co.uk",1],["huffingtonpost.com",1],["moviefone.com",1],["playboy.de",1],["car.com",1],["codeproject.com",1],["familyhandyman.com",1],["goldderby.com",1],["headlinepolitics.com",1],["html.net",1],["indiewire.com",1],["marmiton.org",1],["mymotherlode.com",1],["nypost.com",1],["realgm.com",1],["tvline.com",1],["wwd.com",1],["bordertelegraph.com",1],["bournemouthecho.co.uk",1],["dailyecho.co.uk",1],["dorsetecho.co.uk",1],["eveningtimes.co.uk",1],["guardian-series.co.uk",1],["heraldscotland.com",1],["iwcp.co.uk",1],["lancashiretelegraph.co.uk",1],["oxfordmail.co.uk",1],["salisburyjournal.co.uk",1],["theargus.co.uk",1],["thetelegraphandargus.co.uk",1],["yorkpress.co.uk",1],["wunderground.com",1],["lapresse.ca",1],["eurogamer.net",2],["rockpapershotgun.com",2],["vg247.com",2],["dfiles.eu",3],["downsub.com",3],["j.gs",3],["macserial.com",3],["microify.com",3],["minecraft-forum.net",3],["onmovies.*",3],["pirateproxy.*",3],["psarips.*",3],["solidfiles.com",3],["thepiratebay.org",3],["uptobox.com",3],["steamplay.*",[3,4,141]],["adshort.*",3],["pic-upload.de",3],["oke.io",3],["dz4link.com",3],["imgdew.*",3],["imgmaze.*",3],["imgoutlet.*",3],["imgtown.*",3],["imgview.*",3],["imgclick.net",3],["adsrt.*",3],["mp3guild.*",3],["mp3clan.*",3],["downloadpirate.com",3],["grantorrent.*",3],["grantorrent1.*",3],["ddlvalley.*",3],["inkapelis.*",[3,25,32]],["pnd.*",3],["spycock.com",3],["ausfile.com",[3,43]],["xrivonet.info",3],["imgrock.*",3],["hdvid.*",[3,20,32]],["onvid.*",[3,32]],["ovid.*",[3,32]],["vidhd.*",[3,32]],["crohasit.*",3],["streamingworld.*",3],["putlocker9.*",3],["kstreaming.*",3],["pingit.*",3],["tusfiles.com",3],["hexupload.net",3],["yggtorrent.*",3],["iir.ai",3],["souqsky.net",3],["racaty.*",3],["miraculous.to",3],["movie123.*",3],["file-upload.*",3],["pouvideo.*",[3,4,134]],["povvideo.*",[3,4,134]],["povvldeo.*",3],["povw1deo.*",[3,4,134]],["povwideo.*",[3,4,134]],["powv1deo.*",[3,4,134]],["powvibeo.*",[3,4,134]],["powvideo.*",[3,4,134]],["powvldeo.*",[3,4,134]],["putlocker.*",[4,5]],["mp4upload.com",4],["mitly.us",[4,20]],["pelisplus.*",[4,25,32]],["pelisplushd.*",4],["shrt10.com",4],["pelix.*",[4,25,32]],["atomixhq.*",4],["pctfenix.*",4],["pctnew.*",4],["fembed.*",4],["mavplay.*",4],["videobb.*",4],["ebook3000.com",4],["longfiles.com",4],["shorttey.*",4],["elitetorrent.*",4],["estrenosflix.*",4],["estrenosflux.*",4],["estrenosgo.*",4],["tormalayalam.*",4],["ytanime.tv",4],["cine-calidad.*",4],["extratorrents.*",4],["glotorrents.fr-proxy.com",[4,56]],["rmdown.com",5],["xopenload.me",5],["at.wetter.com",6],["powerthesaurus.org",7],["yts.*",8],["embedstreams.top",8],["gogoanime.co.in",8],["icelz.to",8],["streamtp1.com",8],["flstv.online",8],["mmastreams.me",8],["mylivestream.pro",8],["streambtw.com",8],["tennisonline.me",8],["voodc.com",8],["sportsonline.so",8],["onloop.pro",8],["anarchy-stream.com",8],["olalivehdplay.ru",8],["pawastreams.info",8],["vidlink.pro",8],["wooflix.tv",8],["imgadult.com",[9,10]],["imgdrive.net",[9,10]],["imgtaxi.com",[9,10]],["imgwallet.com",[9,10]],["tube8.*",11],["hdpornt.com",12],["4tube.com",13],["pornerbros.com",13],["perfectgirls.*",13],["perfektdamen.*",13],["uflash.tv",13],["mp3cut.net",14],["mcfucker.com",15],["taroot-rangi.com",16],["mangoporn.net",17],["xiaopan.co",18],["parents.at",18],["realgfporn.com",19],["linkrex.net",19],["alotporn.com",19],["payskip.org",20],["imgdawgknuttz.com",20],["shorterall.com",20],["descarga.xyz",[20,32]],["adcorto.*",20],["ukrainesmodels.com",20],["sexuhot.com",20],["messitv.net",20],["empflix.com",21],["freeviewmovies.com",22],["badjojo.com",22],["boysfood.com",22],["pornhost.com",22],["sextingforum.net",23],["rojadirecta.*",[24,25]],["tarjetarojatvonline.*",[24,25]],["rojadirectatv.*",25],["aquipelis.*",[25,32]],["newpelis.*",[25,32]],["legionprogramas.org",[25,32]],["befap.com",26],["erome.com",26],["pictoa.com",26],["cumlouder.com",27],["chyoa.com",27],["cnnamador.com",[28,29]],["arlinadzgn.com",30],["idntheme.com",30],["problogbooster.com",30],["pronpic.org",31],["ciberdvd.*",32],["pelisgratis.*",32],["peliculas24.*",32],["voirfilms.*",32],["pastepvp.org",32],["programasvirtualespc.net",32],["cinetux.*",32],["thevidhd.*",32],["allcalidad.*",32],["awdescargas.com",32],["megawarez.org",32],["eporner.com",33],["theralphretort.com",34],["yoututosjeff.*",34],["androidaba.*",34],["vidcloud.*",34],["seselah.com",34],["descarga-animex.*",34],["bollywoodshaadis.com",34],["practicequiz.com",34],["wapkiz.com",34],["pianokafe.com",34],["apritos.com",34],["bsierad.com",34],["diminimalis.com",34],["eksporimpor.com",34],["jadijuara.com",34],["kicaunews.com",34],["palapanews.com",34],["ridvanmau.com",34],["yeutienganh.com",34],["telecharger-igli4.*",34],["aalah.me",34],["academiadelmotor.es",34],["aiailah.com",34],["almursi.com",34],["altebwsneno.blogspot.com",34],["ambonkita.com",34],["androidspill.com",34],["aplus.my.id",34],["arrisalah-jakarta.com",34],["babyjimaditya.com",34],["bbyhaber.com",34],["beritabangka.com",34],["beritasulteng.com",34],["bestsellerforaday.com",34],["bintangplus.com",34],["bitco.world",34],["br.nacaodamusica.com",34],["bracontece.com.br",34],["dicariguru.com",34],["fairforexbrokers.com",34],["foguinhogames.net",34],["formasyonhaber.net",34],["fullvoyeur.com",34],["healbot.dpm15.net",34],["indofirmware.site",34],["hagalil.com",34],["latribunadelpaisvasco.com",34],["line-stickers.com",34],["luxurydreamhomes.net",34],["m5g.it",34],["miltonfriedmancores.org",34],["minutolivre.com",34],["oportaln10.com.br",34],["pedroinnecco.com",34],["philippinenmagazin.de",34],["piazzagallura.org",34],["pornflixhd.com",34],["safehomefarm.com",34],["synoniemboek.com",34],["techacrobat.com",34],["elizabeth-mitchell.org",34],["mongri.net",34],["svapo.it",34],["papalah.com",34],["pipocamoderna.com.br",34],["space.tribuntekno.com",34],["lampungway.com",34],["notiziemusica.it",34],["peliculasmx.net",35],["geo.fr",36],["cbc.ca",37],["cuevana3.*",38],["igg-games.com",39],["foumovies.*",40],["holavid.com",40],["downloadming.*",40],["tasma.ru",40],["vinaurl.*",41],["zigforums.com",42],["hotpornfile.org",44],["donnaglamour.it",45],["elixx.*",46],["pornvideospass.com",[47,48]],["svipvids.com",49],["jnovels.com",49],["chd4.com",50],["forum.cstalking.tv",50],["namemc.com",51],["hawtcelebs.com",52],["canadianunderwriter.ca",53],["creativebusybee.com",54],["ohorse.com",55],["myegy.*",56],["freepornhdonlinegay.com",56],["gsm1x.xyz",57],["softwarecrackguru.com",57],["hotgameplus.com",57],["mrdeepfakes.com",[58,59]],["donk69.com",59],["hotdreamsxxx.com",59],["puzzlefry.com",60],["theglobeandmail.com",61],["mtlblog.com",62],["narcity.com",62],["thepiratebay.*",63],["thepiratebay10.org",63],["jizzbunker.com",63],["xxxdan.com",63],["mtsproducoes.*",64],["moonquill.com",65],["macrotrends.net",66],["investmentwatchblog.com",66],["myfreeblack.com",67],["notebookcheck.*",68],["mysostech.com",69],["medihelp.life",69],["camchickscaps.com",69],["filesharing.io",70],["dreamdth.com",71],["acefile.co",72],["beautypackaging.com",73],["puhutv.com",74],["oranhightech.com",75],["mad4wheels.com",76],["allporncomic.com",77],["m.viptube.com",78],["kingsofteens.com",79],["godmods.com",80],["winit.heatworld.com",81],["shop123.com.tw",82],["boyfriendtv.com",83],["procinehub.com",84],["bookmystrip.com",84],["bitzite.com",85],["aiimgvlog.fun",86],["laweducationinfo.com",87],["savemoneyinfo.com",87],["worldaffairinfo.com",87],["godstoryinfo.com",87],["successstoryinfo.com",87],["cxissuegk.com",87],["learnmarketinfo.com",87],["bhugolinfo.com",87],["armypowerinfo.com",87],["rsgamer.app",87],["phonereviewinfo.com",87],["makeincomeinfo.com",87],["gknutshell.com",87],["vichitrainfo.com",87],["workproductivityinfo.com",87],["dopomininfo.com",87],["hostingdetailer.com",87],["fitnesssguide.com",87],["tradingfact4u.com",87],["cryptofactss.com",87],["softwaredetail.com",87],["artoffocas.com",87],["insurancesfact.com",87],["travellingdetail.com",87],["pngitem.com",87],["canna.to",88],["flexy.stream",88],["fsx.monster",88],["pak-mcqs.net",88],["tubev.sex",89],["xnxx-sexfilme.com",90],["mc-hacks.net",91],["meicho.marcsimz.com",91],["wristreview.com",91],["dood.*",92],["doods.*",92],["dooodster.com",92],["dooood.*",92],["ds2play.com",92],["tomshardware.*",93],["hentaifreak.org",94],["moviesnation.*",94],["animepahe.*",95],["th-cam.com",96],["jocooks.com",96],["streamhub.*",97],["nozomi.la",97],["nudostar.com",97],["slutmesh.net",97],["azel.info",97],["clip-sex.biz",97],["justpicsplease.com",97],["klmanga.*",97],["lucagrassetti.com",97],["manga1001.*",97],["mangaraw.*",97],["mangarawjp.*",97],["mihand.ir",97],["nudecelebsimages.com",97],["overwatchporn.xxx",97],["pornium.net",97],["xnxxw.net",97],["xxxymovies.com",97],["yurineko.net",97],["tokyomotion.com",97],["sxyprn.*",97],["kusonime.com",98],["movies4u.*",98],["anime7.download",98],["hotscopes.*",99],["kat.*",100],["katbay.*",100],["kickass.*",100],["kickasshydra.*",100],["kickasskat.*",100],["kickass2.*",100],["kickasstorrents.*",100],["kat2.*",100],["kattracker.*",100],["thekat.*",100],["thekickass.*",100],["kickassz.*",100],["kickasstorrents2.*",100],["topkickass.*",100],["kickassgo.*",100],["kkickass.*",100],["kkat.*",100],["kickasst.*",100],["kick4ss.*",100],["akwam.*",101],["khsm.io",101],["ubuntudde.com",102],["depvailon.com",103],["gload.to",104],["agrarwetter.net",105],["extratorrent.*",106],["torrentstatus.*",106],["yts2.*",106],["y2mate.*",106],["leaknud.com",106],["daddylive.*",106],["archpaper.com",107],["livetvon.*",108],["daddylivehd.*",108],["worldstreams.click",108],["dlhd.sx",108],["hdmoviesflix.*",109],["pornkai.com",110],["tubesafari.com",110],["writedroid.*",111],["zedporn.com",112],["diendancauduong.com",[113,114]],["hanime.xxx",115],["hentaihaven.xxx",115],["thetimes.co.uk",116],["newscon.org",117],["true-gaming.net",118],["manga1000.*",119],["batchkun.com",120],["yify-subtitles.org",121],["chat.tchatche.com",122],["cryptoearns.com",123],["pureleaks.net",124],["starzunion.com",125],["androidecuatoriano.xyz",125],["satdl.com",126],["osuskinner.com",127],["osuskins.net",127],["tekkenmods.com",128],["kiddyearner.com",129],["overtake.gg",130],["popcdn.day",131],["rubystm.com",132],["rubyvid.com",132],["rubyvidhub.com",132],["stmruby.com",132],["streamruby.com",132],["savefiles.com",132],["ragnarokscanlation.opchapters.com",133],["powcloud.org",[135,136]],["op.gg",137],["premierfantasytools.com",138],["frogogo.ru",139],["mediamarkt.de",140]]);
const exceptionsMap = new Map([["pingit.com",[3]]]);
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
    try { abortOnPropertyWrite(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
