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
const uBOL_noSetTimeoutIf = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["mdp-deblocker"],["chkADB"],["adblock"],["$(\"ins\").css"],["/0===.\\.offsetHeight/"],["adBlockEnabled","3000"],["wpcom_ad_wrap"],["#rbm_block_active"],["/offsetHeight[\\s\\S]*?offsetWidth[\\s\\S]*?\\.parentNode\\.removeChild/"],["white-list us"],["blockerDetected"],["/function\\(\\)\\{var.[a-z]\\=[a-z]\\.getElementById/","3000"],["google_ads_frame"],["AdBlockerCheck"],["adsbygoogle"],["広告"],["test.offsetHeight"],["()=>","5000"],["if($(\"ins\").css"],[".offsetHeight === 0"],["\"none\"===window.getComputedStyle"],["comBlocked"],["showads","7000"],[".height() == 0"],["appendMessage"],["adblockNotif"],["testAdBlock"],["xdBlockEnabled","100"],["bottomad"],["/[a-w0-9]{12,}/"],["facebook","200"],["shownJoinInModal"],["/autoShow.*localStorage\\.setItem\\(.auto_login_show_count/"],[".login-modal-btn:eq(0)"],["initialisePopupModal"],["mfp_login-register"],["","15000"],["OpenModal(\"popup_warning_modal\")"],["pbAdBlockHooks"],["Cookie.get(\"contribute-modal"],["#modal-id"],["userVisited"],["#PatronModal"],["isshowmodal","3000"],["init_no_delay"],["modalOpen()"],["jQuery.colorbox"],["cd-user-modal"],["advice-popup"],["#send_enquery_popup_load"],["$('.spg-"],["newsletter_show()","2000"],["/nltrShow30minFlag|js_primetargeting_popup/"],["signupPopup"],["#sign-up-campaign"],["#FloaterModal"],["newsletterModalContent",""],["displayPopup()"],["#IdentifiedPopUpHTML"],["hhModal","5000"],["SignUPPopup_load","5000"],["setPopup"],["mweb_to_app_popup"],["popupObject"],["popup_create_subscribtion"],["newsletter"],["function(){return i(!0)}","3000"],["refreshCount()"],["#newsletter-dialog"],["adsbygoogle","2000"],["checkAdStatus","500"],["ads","2000"],["ThriveGlobal"],["[native code]","500"],["checkForAds"],["check","100"],["scan","500"],["onload_popup","8000"],["Adblocker","10000"],["()","2000"],["()","4000"],["()","1000"],["#advert-tracker","500"],["()","3000"],["w3ad","1000"],["()","1500"],["bioEp.showPopup"],["innerHTML"],["adsBlocked"],["showOverlay"],["NoAd","8000"],["loginModal","500"],["()","700"],["warning"],["__ext_loaded"],["increaserev"],["slideout"],["modal"],["check"],["offsetHeight"],["0x"],["","7000"],["body"],["null"],["","5000"],["[native code]"],["popup"],["adblocker"],["exit_popup","10000"],["show"],["test.remove"],["noscroll","3000"],["adsbygoogle","5000"],["google_jobrunner"],["bait"],["Delay"],["checkFeed","1000"],["samOverlay"],["adStillHere"],["adb"],["offsetHeight","100"],["adBlockDetected"],["premium"],["blocked","1000"],["blocker"],[".modal","1000"],["Zord.analytics.registerBeforeLeaveEvent","3000"],["myModal","3000"],["an_message","500"],["_0x"],["pipaId","0"],["pgblck"],["forceRefresh"],["pop"],["ads"],["head"],["&adslot"],["debugger"],["ai_"],["donation-modal"],["$"],["onscroll","5500"],["login","5000"],["devtoolIsOpening","100"],["abp"],["gnt_mol_oy"],["adsok"],["length","3000"],["devtools"],["popupScreen"],["support-jsfiddle"],["ad"],["_detectLoop"],["concertAds"],["whetherdo"],["Premium"],["||null"]];

const hostnamesMap = new Map([["wpnull7.com",0],["xdarom.com",0],["printablecreative.com",1],["strategium.ru",2],["bitcompiler.com",2],["penize.cz",2],["tvfeed.in",2],["libgen.rocks",3],["thecrimson.com",4],["tumblr.com",[5,155]],["ghxi.com",6],["andrialive.it",7],["lavocedimanduria.it",7],["gioialive.it",7],["terlizzilive.it",7],["as.com",8],["foxnews.com",8],["foxbusiness.com",8],["babycenter.com",9],["cnbeta.com",10],["daz3d.ru",11],["dragcave.net",[12,69]],["dumpert.nl",13],["erfahrungen.com",14],["howjsay.com",[14,85]],["reviewmeta.com",[14,87]],["testserver.pro",14],["fnbrjp.com",15],["imtranslator.net",16],["psychic.de",16],["keybr.com",[17,104,105]],["libgen.lc",18],["maidenhead-advertiser.co.uk",19],["mainpost.de",20],["mapa-turystyczna.pl",21],["mc-at.org",22],["motoroids.com",23],["ogznet.com",24],["postimees.ee",25],["salidzini.lv",26],["seomagnifier.com",27],["whatfontis.com",28],["online-fix.me",29],["latestdeals.co.uk",30],["workspacetips.io",31],["haokan.baidu.com",32],["geeksforgeeks.org",[33,141,142]],["pianistmagazine.com",34],["forvo.com",35],["perfecthealthclinic.com",36],["linkneverdie.net",37],["desktopnexus.com",38],["themoscowtimes.com",39],["bilety24.uk",40],["oneesports.vn",41],["koronawirusunas.pl",42],["webukatu.com",43],["1000.menu",44],["arcserve.com",45],["cdotrends.com",46],["mondaq.com",47],["princetonreview.com",48],["medsurgeindia.com",49],["vegasslotsonline.com",50],["doorofperception.com",51],["economictimes.indiatimes.com",52],["edutopia.org",53],["plugin-alliance.com",54],["arbeitsrecht.org",55],["villeroy-boch.de",56],["downloadfreecourse.com",57],["indiamart.com",58],["afitness.ru",59],["dreamstime.com",60],["rzetelnafirma.pl",61],["tiki.vn",62],["g-school.co.kr",63],["zumub.com",64],["aritzia.com",65],["goal.com",66],["letpub.com.cn",67],["mecze.com",68],["relyonhorror.com",70],["evworld.com",71],["columbiaspectator.com",71],["99bitcoins.com",72],["wyff4.com",73],["myfxbook.com",74],["hqq.tv",75],["mediafire.com",76],["webcodegeeks.com",77],["books-world.net",78],["pc3mag.com",78],["opedge.com",79],["bronze-bravery.com",79],["ultimate-bravery.net",79],["htmlreference.io",79],["short-story.net",79],["sbenny.com",79],["fabricjs.com",80],["wildstarlogs.com",81],["boerse-express.com",81],["bucketpages.com",82],["steptalk.org",83],["numberempire.com",84],["cagesideseats.com",85],["vpnmentor.com",86],["tomshw.it",86],["wizcase.com",86],["portableapps.com",87],["heroesneverdie.com",88],["curbed.com",88],["eater.com",88],["funnyordie.com",88],["mmafighting.com",88],["mmamania.com",88],["polygon.com",88],["racked.com",88],["riftherald.com",88],["sbnation.com",88],["theverge.com",88],["vox.com",88],["twinkietown.com",88],["addons.opera.com",89],["ruwix.com",90],["zulily.com",91],["rp5.by",92],["turbolab.it",93],["9xbuddy.com",14],["zerogpt.net",14],["lookmovie.ag",94],["heidisql.com",95],["lifo.gr",96],["xe.gr",97],["typing-speed.net",98],["online2pdf.com",98],["liverpool.no",99],["fotor.com",99],["playbill.com",99],["xxxonlinegames.com",99],["olarila.com",99],["fairyabc.com",2],["mobilarena.hu",100],["aniwave.to",[100,156]],["bflix.io",[100,156]],["f2movies.ru",[100,156]],["movies2watch.ru",[100,156]],["putlockernew.vc",[100,156]],["swatchseries.ru",[100,156]],["vidstream.pro",100],["mcloud.to",100],["gamepod.hu",101],["itcafe.hu",101],["prohardver.hu",101],["minecraftforge.net",102],["theherald-news.com",103],["searchenginejournal.com",106],["mocospace.com",107],["karamellstore.com.br",108],["mdlinx.com",109],["infoplease.com",109],["htforum.net",109],["underconsideration.com",110],["foreignaffairs.com",111],["dxmaps.com",112],["photoshop-online.biz",113],["ukworkshop.co.uk",113],["endorfinese.com.br",113],["segnidalcielo.it",113],["2iptv.com",113],["deezer.com",114],["handball-world.news",115],["mobiflip.de",115],["titanic-magazin.de",115],["mimikama.org",115],["langweiledich.net",115],["der-postillon.com",115],["perlentaucher.de",115],["lwlies.com",115],["serieslyawesome.tv",115],["critic.de",115],["mediotejo.net",115],["nahrungsmittel-intoleranz.com",115],["madeinbocholt.de",115],["zwei-euro.com",115],["affiliate.fc2.com",116],["4x4earth.com",117],["diffchecker.com",118],["malekal.com",119],["audiostereo.pl",119],["guides4gamers.com",120],["polyflore.net",121],["icy-veins.com",122],["cpuid.com",123],["webcamtaxi.com",124],["megapixl.com",125],["cissamagazine.com.br",126],["utour.me",127],["fosspost.org",128],["2embed.ru",129],["theepochtimes.com",130],["xtv.cz",131],["drawasaurus.org",132],["katholisches.info",133],["hollywoodmask.com",133],["streaminglearningcenter.com",134],["prepostseo.com",135],["tiermaker.com",136],["hqq.to",137],["zefoy.com",137],["shopomo.co.uk",138],["techus.website",138],["criticalthinking.org",139],["elitepvpers.com",140],["moviepl.xyz",143],["leekduck.com",144],["aberdeennews.com",145],["alamogordonews.com",145],["amarillo.com",145],["amestrib.com",145],["app.com",145],["argusleader.com",145],["augustachronicle.com",145],["azcentral.com",145],["battlecreekenquirer.com",145],["beaconjournal.com",145],["blueridgenow.com",145],["buckscountycouriertimes.com",145],["bucyrustelegraphforum.com",145],["burlingtoncountytimes.com",145],["burlingtonfreepress.com",145],["caller.com",145],["cantondailyledger.com",145],["cantonrep.com",145],["capecodtimes.com",145],["cheboygannews.com",145],["chieftain.com",145],["chillicothegazette.com",145],["cincinnati.com",145],["citizen-times.com",145],["cjonline.com",145],["clarionledger.com",145],["coloradoan.com",145],["columbiadailyherald.com",145],["columbiatribune.com",145],["commercialappeal.com",145],["coshoctontribune.com",145],["courier-journal.com",145],["courier-tribune.com",145],["courierpostonline.com",145],["courierpress.com",145],["currentargus.com",145],["daily-jeff.com",145],["daily-times.com",145],["dailyamerican.com",145],["dailycomet.com",145],["dailycommercial.com",145],["dailyrecord.com",145],["dailyworld.com",145],["delawareonline.com",145],["delmarvanow.com",145],["demingheadlight.com",145],["democratandchronicle.com",145],["desertsun.com",145],["desmoinesregister.com",145],["devilslakejournal.com",145],["dispatch.com",145],["dnj.com",145],["ellwoodcityledger.com",145],["elpasotimes.com",145],["enterprisenews.com",145],["eveningsun.com",145],["eveningtribune.com",145],["examiner-enterprise.com",145],["fayobserver.com",145],["fdlreporter.com",145],["floridatoday.com",145],["fosters.com",145],["freep.com",145],["gadsdentimes.com",145],["gainesville.com",145],["galesburg.com",145],["gastongazette.com",145],["goerie.com",145],["gosanangelo.com",145],["goupstate.com",145],["greatfallstribune.com",145],["greenbaypressgazette.com",145],["greenvilleonline.com",145],["hattiesburgamerican.com",145],["heraldmailmedia.com",145],["heraldnews.com",145],["heraldtribune.com",145],["hillsdale.net",145],["hollandsentinel.com",145],["hoosiertimes.com",145],["houmatoday.com",145],["htrnews.com",145],["hutchnews.com",145],["indeonline.com",145],["independentmail.com",145],["indystar.com",145],["ithacajournal.com",145],["jacksonsun.com",145],["jacksonville.com",145],["jconline.com",145],["jdnews.com",145],["journalstandard.com",145],["jsonline.com",145],["kinston.com",145],["kitsapsun.com",145],["knoxnews.com",145],["lancastereaglegazette.com",145],["lansingstatejournal.com",145],["lcsun-news.com",145],["ldnews.com",145],["lenconnect.com",145],["lincolncourier.com",145],["livingstondaily.com",145],["lohud.com",145],["lubbockonline.com",145],["mansfieldnewsjournal.com",145],["marionstar.com",145],["marshfieldnewsherald.com",145],["mcdonoughvoice.com",145],["metrowestdailynews.com",145],["milforddailynews.com",145],["monroenews.com",145],["montgomeryadvertiser.com",145],["mpnnow.com",145],["mycentraljersey.com",145],["naplesnews.com",145],["newarkadvocate.com",145],["newbernsj.com",145],["newportri.com",145],["news-journalonline.com",145],["news-leader.com",145],["news-press.com",145],["newschief.com",145],["newsherald.com",145],["newsleader.com",145],["njherald.com",145],["northjersey.com",145],["norwichbulletin.com",145],["nwfdailynews.com",145],["oakridger.com",145],["ocala.com",145],["oklahoman.com",145],["onlineathens.com",145],["pal-item.com",145],["palmbeachdailynews.com",145],["palmbeachpost.com",145],["patriotledger.com",145],["pekintimes.com",145],["petoskeynews.com",145],["pjstar.com",145],["pnj.com",145],["poconorecord.com",145],["pontiacdailyleader.com",145],["portclintonnewsherald.com",145],["postcrescent.com",145],["poughkeepsiejournal.com",145],["press-citizen.com",145],["pressconnects.com",145],["progress-index.com",145],["providencejournal.com",145],["publicopiniononline.com",145],["record-courier.com",145],["recordnet.com",145],["recordonline.com",145],["redding.com",145],["registerguard.com",145],["reporter-times.com",145],["reporternews.com",145],["rgj.com",145],["rrstar.com",145],["ruidosonews.com",145],["salina.com",145],["savannahnow.com",145],["scsun-news.com",145],["sctimes.com",145],["seacoastonline.com",145],["sheboyganpress.com",145],["shelbystar.com",145],["shreveporttimes.com",145],["sj-r.com",145],["sooeveningnews.com",145],["southbendtribune.com",145],["southcoasttoday.com",145],["starcourier.com",145],["stargazette.com",145],["starnewsonline.com",145],["statesman.com",145],["statesmanjournal.com",145],["staugustine.com",145],["stevenspointjournal.com",145],["sturgisjournal.com",145],["swtimes.com",145],["tallahassee.com",145],["tauntongazette.com",145],["tcpalm.com",145],["telegram.com",145],["tennessean.com",145],["the-daily-record.com",145],["the-dispatch.com",145],["the-leader.com",145],["the-review.com",145],["theadvertiser.com",145],["thecalifornian.com",145],["thedailyjournal.com",145],["thedailyreporter.com",145],["thegardnernews.com",145],["thegleaner.com",145],["thehawkeye.com",145],["theintell.com",145],["theleafchronicle.com",145],["theledger.com",145],["thenews-messenger.com",145],["thenewsstar.com",145],["thenorthwestern.com",145],["thepublicopinion.com",145],["therecordherald.com",145],["thespectrum.com",145],["thestarpress.com",145],["thetimesherald.com",145],["thetimesnews.com",145],["thetowntalk.com",145],["times-gazette.com",145],["timesonline.com",145],["timesrecordnews.com",145],["timesreporter.com",145],["timestelegram.com",145],["tmnews.com",145],["tricountyindependent.com",145],["tuscaloosanews.com",145],["usatoday.com",145],["uticaod.com",145],["vcstar.com",145],["visaliatimesdelta.com",145],["vvdailypress.com",145],["wausaudailyherald.com",145],["wisconsinrapidstribune.com",145],["ydr.com",145],["zanesvilletimesrecorder.com",145],["craftpip.github.io",146],["pixwox.com",147],["sflix.to",148],["thizissam.in",149],["jsfiddle.net",150],["ikorektor.pl",151],["telenovelas-turcas.com.es",152],["goldenstateofmind.com",153],["neoseeker.com",154]]);

const entitiesMap = new Map([["fmovies",[100,156]],["libgen",24],["123movies",129],["flixhq",156]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function noSetTimeoutIf(
    needle = '',
    delay = ''
) {
    if ( typeof needle !== 'string' ) { return; }
    const safe = safeSelf();
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    if ( delay === '' ) { delay = undefined; }
    let delayNot = false;
    if ( delay !== undefined ) {
        delayNot = delay.charAt(0) === '!';
        if ( delayNot ) { delay = delay.slice(1); }
        delay = parseInt(delay, 10);
    }
    const log = needleNot === false && needle === '' && delay === undefined
        ? console.log
        : undefined;
    const reNeedle = safe.patternToRegex(needle);
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const a = String(args[0]);
            const b = args[1];
            if ( log !== undefined ) {
                log('uBO: setTimeout("%s", %s)', a, b);
            } else {
                let defuse;
                if ( needle !== '' ) {
                    defuse = reNeedle.test(a) !== needleNot;
                }
                if ( defuse !== false && delay !== undefined ) {
                    defuse = (b === delay || isNaN(b) && isNaN(delay) ) !== delayNot;
                }
                if ( defuse ) {
                    args[0] = function(){};
                }
            }
            return Reflect.apply(target, thisArg, args);
        },
        get(target, prop, receiver) {
            if ( prop === 'toString' ) {
                return target.toString.bind(target);
            }
            return Reflect.get(target, prop, receiver);
        },
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
    try { noSetTimeoutIf(...argsList[i]); }
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
    return uBOL_noSetTimeoutIf();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_noSetTimeoutIf = cloneInto([
            [ '(', uBOL_noSetTimeoutIf.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_noSetTimeoutIf);
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
    delete page.uBOL_noSetTimeoutIf;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
