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

// ruleset: annoyances-others

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setConstant = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["Object.prototype.stickyEnabled","false"],["document.hasStorageAccess","undefined"],["dtkPlayer.infos.visible_plus","0"],["$.cookie","trueFunc"],["Object.prototype.enable_floating","false"],["Nickles.Consent.show","noopFunc"],["Object.prototype.adPlayerId",""],["QiyiPlayerProphetData.a.data.originRes.adSlots","{}"],["QiyiPlayerProphetData.a.data.showResponse.slots","{}"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.startShow","noopFunc"],["Makeup.subscribePopup","undefined"],["floatingPlayer.isFloatingEnabled","false"],["Object.prototype.isFloatingEnabled","false"],["paywall","noopFunc"],["AdGlare","{}"],["aax_getad_mpb","false"],["document.hasFocus","trueFunc"],["count","0"],["timer","0"],["Object.prototype.embedPlayer.autoplay","false"],["Object.prototype.minPlayingVisibleHeight",""],["counter","-1"],["segundos","0"],["waitTime","0"],["Notification","undefined"],["timeSec","0"],["valid","1"],["isGGSurvey","true"],["enable_dl_after_countdown","true"],["Object.prototype.IS_CHECK_REGISTRATION","false"],["wt","-1"],["app.window.isVisible","trueFunc"],["counter","0"],["window_focus","true"],["sec","0"],["Object.prototype.autoPlay","noopFunc"],["gsecs","0"],["seconde","-1"],["timeleft","0"],["waitSeconds","0"],["document.hidden","false"],["countdown","0"],["blurred","false"],["scrollTo","noopFunc"],["tempo2","0"],["snow","undefined"],["setblur","noopFunc"],["youtube","1"],["time","0"],["fiveSecs","0"],["ONTVminiatureBlocked","trueFunc"],["gazeta_pl.Player.FloatingPlayer.floatPlayer","noopFunc"],["width","100"],["waiting_time","0"],["Time_Start","0"],["document.oncontextmenu","null"],["document.onselectstart","null"],["document.ondragstart","null"],["disableEnterKey","noopFunc"],["disable_copy","noopFunc"],["disable_copy_ie","noopFunc"],["noCopy","noopFunc"],["addLink","noopFunc"],["rightClickOpenYn","false"],["autoSourcingYn","false"],["vidcheck","1"],["NewsSource.addSource","noopFunc"],["linkback.l","true"],["var7","0"],["window.B.Article.preventSelection","noopFunc"],["mug.viewer.protectPost","noopFunc"],["disableclick","noopFunc"],["document.onkeypress","null"],["document.onkeydown","null"],["document.onmousedown","null"],["mouseClickRight","noopFunc"],["document.oncopy","undefined"],["Object.prototype.getFooterText","undefined"],["wrbm_gb.copyAlert","undefined"],["disableSelection","noopFunc"],["nocontext","noopFunc"],["onload","null"],["document.oncontextmenu","{}"],["MdpAppender","undefined"],["window.disableselect","noopFunc"],["document.onpaste","undefined"],["document.oncontextmenu","undefined"],["document.onselectstart","undefined"],["oncontextmenu","undefined"]];

const hostnamesMap = new Map([["zeberka.pl",0],["kozaczek.pl",0],["papilot.pl",0],["k2s.cc",1],["tezfiles.com",1],["fboom.me",1],["ultimedia.com",2],["hpplus.jp",3],["reuters.com",4],["nickles.de",5],["sports.iqiyi.com",6],["m.iqiyi.com",6],["iqiyi.com",[7,8,9,10]],["igeeksblog.com",11],["makeup.ru",12],["auto-swiat.pl",13],["przegladsportowy.onet.pl",13],["komputerswiat.pl",13],["businessinsider.com.pl",14],["fakt.pl",14],["plejada.pl",14],["medonet.pl",14],["onet.pl",14],["nextmgz.com",15],["nextmag.com.tw",15],["appledaily.com",15],["findamasters.com",16],["phoronix.com",17],["blog.carstopia.net",18],["blog.coinsvalue.net",18],["blog.cookinguide.net",18],["blog.freeoseocheck.com",18],["blog.makeupguide.net",18],["exactpay.online",18],["btcbitco.in",18],["btcsatoshi.net",18],["cempakajaya.com",18],["crypto4yu.com",18],["readbitcoin.org",18],["wiour.com",18],["mdn.lol",18],["app.trangchu.news",19],["adfoc.us",19],["ffworld.xyz",19],["x86.co.kr",19],["kolaykisalt.com",19],["surfsees.com",19],["kisalt.xyz",19],["m4cut.com",20],["pickhopes.com",20],["manga2day.com",20],["sport4you.net",20],["shardnat.tech",20],["dynamo.kiev.ua",21],["vp.rambler.ru",[22,37]],["tech24us.com",23],["udemycourses.me",23],["psychpoint.com",23],["goodssh.com",23],["criarjogosandroid.com",24],["mdn.rest",25],["makemoneywithurl.com",27],["shortit.pw",28],["ac-illust.com",[29,30]],["photo-ac.com",[29,30]],["player.vgtrk.com",31],["ebookmela.co.in",32],["destyy.com",33],["gestyy.com",33],["linksht.com",[34,35]],["icutlink.com",36],["fcportables.com",38],["mylink1.biz",39],["mylinks.xyz",39],["drosbraift.com",40],["anonymous-links.com",41],["sundryfiles.com",42],["cgtips.org",43],["rewayatcafe.com",44],["link4earn.com",44],["safelink.asia",44],["cravesandflames.com",44],["xpshort.com",44],["exalink.fun",44],["infotamizhan.xyz",44],["novelsapps.com",44],["cybertechng.com",44],["animerigel.com",44],["gainl.ink",44],["megaurl.in",44],["megafly.in",44],["linx.cc",44],["bitlk.com",44],["reqlinks.net",44],["rgl.vn",44],["youlink.ga",44],["wu8.in",44],["qlinks.eu",44],["upfilesurls.com",44],["mgnetu.com",44],["shorturl.unityassets4free.com",44],["financerites.in",44],["paid4file.com",44],["atglinks.com",44],["tii.la",44],["techsguy.com",44],["exeo.app",44],["smallinfo.in",44],["cutty.app",44],["adrinolinks.in",44],["shareus.site",44],["cut-y.co",44],["disheye.com",44],["enit.in",44],["veganab.co",44],["mdisklink.link",44],["kinemaster.cc",44],["short.freeltc.top",44],["faucetcrypto.net",44],["download.windowslite.net",44],["dlsite.win",44],["oko.sh",44],["ckk.ai",44],["ovlinks.com",44],["ier.ai",44],["links.medipost.org",44],["forex-trnd.com",44],["paylinnk.com",44],["adpps.com",44],["go.linkbnao.com",44],["baicho.xyz",44],["technemo.xyz",44],["adshorti.co",44],["loptelink.com",44],["crt.im",44],["mshort.top",44],["link-yz.com",44],["cut-y.net",44],["short2fly.xyz",44],["adslink.pw",44],["shortx.net",44],["du-link.in",44],["mozlink.net",44],["haonguyen.top",44],["pandaznetwork.com",44],["bestcash2020.com",44],["dash-free.com",44],["cekip.xyz",44],["cryptoon.xyz",44],["btcwalk.com",44],["vhorizads.com",44],["theconomy.me",44],["wealthystyle.online",44],["zlink.tk",44],["easysky.in",44],["techgeek.digital",44],["csd.xmod.in",44],["link.tokenoto.com",44],["skincarie.com",44],["shortie.link",44],["defaultfreeshort.in",44],["adsafelink.com",44],["linkshortify.site",44],["kolotoken.site",44],["powerclicks.xyz",44],["akashort.com",44],["rocklink.in",44],["insurance-space.xyz",44],["rajsayt.xyz",44],["insurglobal.xyz",44],["linkszia.co",44],["usanewstoday.club",44],["earnforclick.online",44],["tlin.me",44],["adlinkfly.wartakilat.com",44],["shorthero.site",44],["cutp.in",44],["clk.asia",44],["cookdov.com",44],["aylink.info",44],["adinsurance.xyz",44],["usdshort.com",44],["onroid.com",44],["filmyzilla-in.xyz",44],["sohexo.org",44],["zirof.com",44],["katflys.com",44],["samaa-pro.com",44],["earnme.club",44],["myshrinker.com",44],["seulink.online",44],["encurta.eu",44],["adurly.cc",44],["shorte.anxcinema.com",44],["nini08.com",44],["linkjust.com",44],["download.freestudyweb.com",44],["ultraten.net",44],["vrlinks.xyz",44],["crazyblog.in",44],["shortlink.prz.pw",44],["swzz.xyz",44],["mixfaucet.com",44],["getlink.tienichmaytinh.net",44],["adly.fun",44],["try2link.com",44],["go.netfile.cc",44],["fameen.xyz",44],["gameen.xyz",44],["yameen.xyz",44],["abre.click",44],["adcripto.com",44],["linkbr.xyz",44],["meulynk.com",44],["myad.biz",44],["baominh.tech",44],["bblink.com",44],["shortz.one",44],["newsalret.com",44],["clickscoin.com",44],["za.uy",44],["toptap.website",44],["gtlink.co",44],["upshrink.com",44],["gir.ist",44],["upfiles.io",44],["link.turkdown.com",44],["beingtek.com",44],["automotur.club",44],["insuranceblog.xyz",44],["coinadfly.com",44],["linkres.in",44],["link1s.com",44],["fire-link.net",44],["enagato.com",44],["dl.tech-story.net",44],["cpm10.org",44],["123link.biz",44],["rancah.com",44],["shrtvip.com",44],["linkerhub.tk",44],["kingurls.com",44],["download.sharenulled.net",44],["go.gets4link.com",44],["lucidcam.com",44],["clikern.com",44],["musicc.xyz",44],["pix4link.com",44],["zipurls.com",44],["theblissempire.com",44],["linkadshield.xyz",44],["xfiles.io",44],["upfiles.com",44],["zshort.cc",44],["filezipa.com",44],["arab-chat.club",44],["dz-linkk.com",44],["newshour.pw",44],["paidthe.site",44],["cslink.in",44],["jp88.xyz",44],["shortenmm.cf",44],["shrink.icu",44],["bevru.club",44],["bitlinks.pw",44],["hoastie.com",44],["arurio.club",44],["fclcc.com",44],["ptc.wtf",44],["tei.ai",44],["url4cut.xyz",44],["birdurls.com",44],["claimfreebits.com",44],["allcryptoz.net",44],["shrlink.top",44],["webshort.in",44],["coinsparty.mcrypto.club",44],["zshort.io",44],["eririo.club",44],["nerdy.vn",44],["jameeltips.us",44],["payskip.org",44],["freshi.site",44],["yxoshort.com",44],["pewgame.com",44],["sanos.xyz",44],["shrinkzzy.link",44],["srek.net",44],["shrinke.me",44],["foxseotools.com",44],["oncehelp.com",44],["earnwithshortlink.com",44],["enrt.eu",44],["tui.click",44],["adfloz.co",44],["shrx.in",44],["short.food-royal.com",44],["adpop.me",44],["galaxy-link.space",44],["link.ltc24.com",44],["kiiw.icu",44],["vshort.link",44],["adnit.xyz",44],["fwarycash.moviestar.fun",44],["linkebr.com",44],["bloggingguidance.com",44],["smoner.com",44],["charexempire.com",44],["cut-fly.com",44],["gplinks.co",44],["mynewshub.in",44],["adomainscan.com",44],["bitmos.co.in",44],["cuts-url.com",44],["gainbtc.click",44],["profitlink.info",44],["artipedia.id",44],["gonety.com",44],["viraloc.com",44],["beautyram.info",44],["cashearn.cc",44],["go2.surf",44],["cryptoads.space",44],["adcorto.me",44],["modapk.link",44],["holaurl.com",44],["adbl.live",44],["miklpro.com",44],["kutt.io",44],["sanoybonito.club",44],["afly.pro",44],["cutlink.link",44],["short88.com",44],["pngit.live",44],["exe.app",44],["adsrt.click",44],["adcorto.xyz",44],["shortbled.com",44],["cuturl.in",44],["womenhaircolors.review",44],["srts.me",44],["paidtomoney.com",44],["lite-link.xyz",44],["apkshrt.com",44],["linkshorts.me",44],["androidnougatapk.com",44],["pureshort.link",44],["recipestutorials.com",44],["droplink.co",44],["tawiia.com",44],["exy.ai",44],["lite-link.com",44],["bdnewsx.com",44],["eio.io",44],["mealip.com",44],["earnfasts.com",44],["linksfire.co",44],["giscr.ac.th",44],["internewstv.com",44],["ivn3.com",44],["pslfive.com",44],["linksly.co",44],["illink.net",44],["coin.mg",44],["trinddz.com",44],["ilinks.in",44],["techupme.com",44],["bitfly.io",44],["earnguap.com",44],["news.techrfour.com",44],["shortzzy.in",44],["asiashort.link",44],["imagenesderopaparaperros.com",44],["c-ut.com",44],["toroox.com",44],["saungfirmware.id",44],["shrinkme.in",44],["fir3.net",44],["softairbay.com",44],["link1s.net",44],["cashurl.in",44],["doctor-groups.com",44],["bitcoinly.in",44],["clk.ink",44],["abdeo8.com",44],["apksvip.com",44],["gibit.xyz",44],["claimcrypto.cc",44],["btcdot.xyz",44],["pkr.pw",44],["shrinkbtc.cc",44],["todaynewspk.win",44],["manikusa.com",44],["try2link.net",44],["stfly.me",44],["dz4win.com",44],["real-sky.com",44],["bolssc.com",44],["short2.cash",44],["fx4vip.com",44],["cutdl.xyz",44],["shrinkurl.org",44],["mediumarticles.com",44],["asupload.com",44],["exee.io",44],["srt.leechpremium.link",44],["adsrt.live",44],["cheappath.com",44],["fcc.lc",44],["shorthitz.com",44],["savelink.site",44],["linkshorten.xyz",44],["tmearn.com",44],["samapro.me",44],["adsy.pw",44],["owllink.net",44],["mondainai.moe",44],["2ota.com",44],["popimed.com",44],["aii.sh",44],["sekilastekno.com",44],["miuiku.com",44],["articlix.com",44],["intothelink.com",44],["pingit.link",44],["slink.bid",44],["7r6.com",44],["loptelink.vip",44],["iir.ai",44],["biroads.com",44],["win10.vn",[44,51]],["mitly.us",44],["adsrt.net",44],["afly.us",44],["tii.ai",44],["linkviet.xyz",44],["coredp.com",44],["linkrex.net",44],["bit-url.com",44],["adsrt.org",44],["bestearnonline.com",44],["gamesrs.com",44],["shorten.sh",44],["ouofly.com",44],["clicksbee.com",44],["shorterall.com",44],["dutchycorp.space",44],["linkshrnk.com",44],["linkad.in",44],["fc.lc",44],["adslinkfly.online",44],["shrinkme.io",44],["imgqec.online",45],["imgwbfh.online",45],["imgyer.store",45],["imgxuh.cfd",45],["imgngc.sbs",45],["imgezx.sbs",45],["imgxza.store",45],["imgwqr.online",45],["tr3fit.xyz",46],["daz3d.ru",47],["translit.net",48],["translit.ru",48],["cheatsquad.gg",49],["file4go.com",50],["file4go.net",50],["bankier.pl",52],["claudia.pl",52],["dyskusje24.pl",52],["edziecko.pl",52],["haps.pl",52],["infozdrowie24.pl",52],["kobieta.pl",52],["moto.pl",52],["gazeta.pl",52],["tokfm.pl",[52,53]],["sport.pl",52],["plotek.pl",52],["cocoleech.com",54],["prem.link",55],["dl.pcgamestorrents.org",56],["get-url.com",56],["interface31.ru",[57,58]],["ktv.jp",57],["releasewitch.com",[57,60]],["news.ntv.co.jp",57],["novatoscans.top",57],["7days2die.info",[57,59]],["flying-lines.com",[57,58]],["fssp.gov.ru",[57,58]],["ilife97.com",[57,59]],["rdsong.com",[57,58]],["lubedk.com",[57,58,74,75]],["itempage3.auction.co.kr",57],["cdramalove.com",57],["10000recipe.com",57],["nike.com",[57,58]],["a2zapk.com",[57,59,60]],["fully-fundedscholarships.com",[57,59,60]],["shoneekapoor.com",57],["cda-hd.cc",[57,58,75]],["studysolve.online",[57,59,81]],["animeindia.in",[57,59,81]],["bufftoon.plaync.com",57],["studyguideindia.com",[57,76]],["codedosa.com",[57,59,60,61,62,81]],["newslibrary.naver.com",57],["insight.co.kr",[57,58,59]],["gamefinity.id",[57,59,83]],["cafe.naver.com",[57,58,59]],["half-musiq.blogspot.com",[58,76]],["novelpia.com",[58,59,73]],["tistory.com",[58,77,86]],["gradium.co.kr",[59,60,61,62,82]],["javsubtitle.co",60],["programasvirtualespc.net",60],["legionscans.com",60],["flinsetyadi.com",60],["theaircurrent.com",60],["now.rememberapp.co.kr",60],["semesters.in",[60,61,62,81,82]],["dora-guide.com",[61,62,82]],["uta-net.com",63],["lyricsondemand.com",64],["blog.naver.com",[65,66]],["dizilab9.com",67],["sedaily.com",68],["khan.co.kr",69],["hani.co.kr",69],["fmkorea.com",70],["brunch.co.kr",71],["post.naver.com",72],["fishki.net",78],["city-data.com",78],["patrika.com",[78,87]],["ogznet.com",78],["deepl.com",79],["foodnavigator.com",80],["digitalsynopsis.com",82],["electricalvoice.com",82],["nordkorea-info.de",84],["tunovelaligera.com",85],["runningnews.gr",86],["gaypornmasters.com",[88,89]],["gaypornwave.com",88],["sporx.com",88],["muharebetarihi.com",90]]);

const entitiesMap = new Map([["bildirim",26],["wplink",44],["adshort",44],["linkfly",44],["exey",44],["linkshorts",44],["bluemediafile",56],["bluemediafiles",56]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantCore(false, ...args);
}

function setConstantCore(
    trusted = false,
    arg1 = '',
    arg2 = '',
    arg3 = ''
) {
    const details = typeof arg1 !== 'object'
        ? { prop: arg1, value: arg2 }
        : arg1;
    if ( arg3 !== '' ) {
        if ( /^\d$/.test(arg3) ) {
            details.options = [ arg3 ];
        } else {
            details.options = Array.from(arguments).slice(3);
        }
    }
    const { prop: chain = '', value: cValue = '' } = details;
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const options = details.options || [];
    const safe = safeSelf();
    function setConstant(chain, cValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            const proxy = new Proxy(fn, {
                defineProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.defineProperty(...arguments);
                    }
                    return true;
                },
                deleteProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.deleteProperty(...arguments);
                    }
                    return true;
                },
                get(target, prop) {
                    if ( prop === 'toString' ) {
                        return function() {
                            return `function ${trappedProp}() { [native code] }`;
                        }.bind(null);
                    }
                    return Reflect.get(...arguments);
                },
            });
            return proxy;
        };
        if ( cValue === 'undefined' ) {
            cValue = undefined;
        } else if ( cValue === 'false' ) {
            cValue = false;
        } else if ( cValue === 'true' ) {
            cValue = true;
        } else if ( cValue === 'null' ) {
            cValue = null;
        } else if ( cValue === "''" || cValue === '' ) {
            cValue = '';
        } else if ( cValue === '[]' ) {
            cValue = [];
        } else if ( cValue === '{}' ) {
            cValue = {};
        } else if ( cValue === 'noopFunc' ) {
            cValue = cloakFunc(function(){});
        } else if ( cValue === 'trueFunc' ) {
            cValue = cloakFunc(function(){ return true; });
        } else if ( cValue === 'falseFunc' ) {
            cValue = cloakFunc(function(){ return false; });
        } else if ( /^-?\d+$/.test(cValue) ) {
            cValue = parseInt(cValue);
            if ( isNaN(cValue) ) { return; }
            if ( Math.abs(cValue) > 0x7FFF ) { return; }
        } else if ( trusted ) {
            if ( cValue.startsWith('{') && cValue.endsWith('}') ) {
                try { cValue = safe.jsonParse(cValue).value; } catch(ex) { return; }
            }
        } else {
            return;
        }
        if ( options.includes('asFunction') ) {
            cValue = ( ) => cValue;
        } else if ( options.includes('asCallback') ) {
            cValue = ( ) => (( ) => cValue);
        } else if ( options.includes('asResolved') ) {
            cValue = Promise.resolve(cValue);
        } else if ( options.includes('asRejected') ) {
            cValue = Promise.reject(cValue);
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (cValue !== undefined && cValue !== null) &&
                (typeof v !== typeof cValue);
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : cValue) === false ) { return; }
            const odesc = Object.getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof Object ) {
                owner[prop] = cValue;
                if ( odesc.get instanceof Function ) {
                    prevGetter = odesc.get;
                }
                if ( odesc.set instanceof Function ) {
                    prevSetter = odesc.set;
                }
            }
            try {
                safe.Object_defineProperty(owner, prop, {
                    configurable,
                    get() {
                        if ( prevGetter !== undefined ) {
                            prevGetter();
                        }
                        return handler.getter(); // cValue
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
            } catch(ex) {
            }
        };
        const trapChain = function(owner, chain) {
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                trapProp(owner, chain, false, {
                    v: undefined,
                    init: function(v) {
                        if ( mustAbort(v) ) { return false; }
                        this.v = v;
                        return true;
                    },
                    getter: function() {
                        return document.currentScript === thisScript
                            ? this.v
                            : cValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        cValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof Object || typeof v === 'object' && v !== null ) {
                trapChain(v, chain);
                return;
            }
            trapProp(owner, prop, true, {
                v: undefined,
                init: function(v) {
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return this.v;
                },
                setter: function(a) {
                    this.v = a;
                    if ( a instanceof Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, cValue);
    }, options);
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
    try { setConstant(...argsList[i]); }
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
    return uBOL_setConstant();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_setConstant = cloneInto([
            [ '(', uBOL_setConstant.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_setConstant);
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
    delete page.uBOL_setConstant;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
