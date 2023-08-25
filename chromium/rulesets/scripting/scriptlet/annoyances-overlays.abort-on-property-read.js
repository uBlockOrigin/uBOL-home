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
const uBOL_abortOnPropertyRead = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["Object.prototype.YaAdtuneFeedbackType"],["Object.prototype.renderDirect"],["Object.prototype.RenderMarks"],["Object.prototype.RtbLoadDone"],["Object.prototype.RtbBlockRenderStart"],["Object.prototype.storage"],["Object.prototype.DataLoaded"],["Object.prototype.getAdditionalBanners"],["Object.prototype.Rtb"],["Object.prototype.AdChosen"],["mdpDeBlockerDestroyer"],["ai_run_scripts"],["_sp_.mms.startMsg"],["anOptions"],["antiadblockCallback"],["eazy_ad_unblocker_dialog_opener"],["adbd"],["ad_block_test"],["window.adblockDiv"],["adsBlocked"],["cX"],["FuckAdBlock"],["adbh"],["closeBlockerModal"],["adBlockDetected"],["adsbygoogle"],["GoogleContributor"],["isAdBlockActive"],["setNptTechAdblockerCookie"],["ad_nodes"],["globalAuthLoginPopupCounter"],["show30SecSingupPopupFlag"],["Object.prototype.video_player_floating"],["notifyMe"],["webPushPublicKey"],["document.oncontextmenu"],["oncontextmenu"],["document.onselectstart"],["_sp_._networkListenerData"],["hasAdblock"],["getSelection"],["__cmpGdprAppliesGlobally"],["app_vars.force_disable_adblock"],["disableSelection"],["uxGuid"],["ads"],["blazemedia_adBlock"],["addLink"],["abde"],["onbeforeunload"],["fuckAdBlock"],["ABDSettings"],["googletag"],["intsFequencyCap"],["document.ondragstart"],["document.onmousedown"],["Date.prototype.toUTCString"],["oSpPOptions"],["a1lck"],["plusonet"],["document.documentElement.oncopy"],["mdp_appender"],["can_i_run_ads"],["bizpanda"],["disableselect"],["RL.licenseman.init"],["abStyle"],["ga_ExitPopup3339"],["document.onkeydown"],["alert"],["alerte_declanchee"],["ABD"],["document.body.setAttribute"],["adtoniq"],["disable_copy"],["locdau"],["document.body.oncopy"],["onload"],["HTMLIFrameElement"],["tjQuery"],["disable_hot_keys"],["nd_shtml"],["canRunAds"],["clickNS"],["_0xfff1"],["admrlWpJsonP"],["document.oncopy"],["document.onclick"],["document.onkeypress"],["disableEnterKey"],["document.write"],["shortcut"],["append_link"],["carbonLoaded"],["initAdBlockerPanel"],["cpp_loc"],["nocontextmenu"],["_0x1a4c"],["addCopyright"],["copy_div_id"],["LBF.define"],["b2a"],["debugchange"],["devtoolsDetector"],["nocontext"],["contentprotector"],["kan_vars.adblock"],["onAdScriptFailure"],["sneakerGoogleTag"],["wccp_pro_iscontenteditable"],["devtoolsDetector.addListener"]];

const hostnamesMap = new Map([["relax-fm.ru",1],["irecommend.ru",1],["auto.ru",2],["sm.news",2],["amedia.online",2],["sdamgia.ru",2],["otzovik.com",[3,4]],["liveinternet.ru",[5,6]],["gismeteo.ru",7],["gismeteo.by",7],["gismeteo.md",7],["gismeteo.kz",7],["kakprosto.ru",8],["drive2.ru",9],["texture-packs.com",10],["virtualpiano.net",11],["apkmos.com",11],["cee-trust.org",11],["udemydl.com",11],["cyclingnews.com",12],["pcgamer.com",12],["eurogamer.pt",12],["bikeperfect.com",12],["loudersound.com",[12,38]],["guitarworld.com",12],["creativebloq.com",12],["musicradar.com",12],["fosspost.org",13],["portalvirtualreality.ru",13],["pingvin.pro",13],["bonobono.com",13],["curbsideclassic.com",13],["wpgutenberg.top",13],["3dmodelshare.org",13],["turkishfoodchef.com",13],["itechua.com",13],["blowxtube.com",13],["orhanbhr.com",13],["testosterontr.com",13],["criptomonedaseico.com",13],["downloadsachmienphi.com",13],["fimico.de",13],["manhuaplus.com",13],["canyoublockit.com",13],["freeallcourse.com",13],["congressoemfoco.uol.com.br",13],["dogalvadi.com",13],["kompukter.ru",13],["paragezegeni.com",13],["gatevidyalay.com",13],["corgit.xyz",13],["freefincal.com",13],["dsogaming.com",13],["bordoklavyeli.net",13],["newonce.net",13],["gpcoder.com",13],["androidexplained.com",13],["borodavsem.ru",13],["czechavfree.com",13],["karaokes.com.ar",13],["kulturalnemedia.pl",13],["magazeta.com",13],["mur.tv",13],["o365info.com",13],["proswift.ru",13],["sovetolog.com",13],["tehnobzor.ru",13],["thelongdark.ru",13],["thewindowsclub.thewindowsclubco.netdna-cdn.com",13],["xiaomitech.net",13],["sports.ru",14],["ruyashoujo.com",15],["askdifference.com",16],["cartoonbrew.com",17],["gamemag.ru",18],["germancarforum.com",19],["unknowncheats.me",19],["lavoz.com.ar",20],["lcpdfr.com",21],["moregameslike.com",22],["parasportontario.ca",23],["macapp.org.cn",24],["picmix.com",24],["poedb.tw",24],["seo-visit.com",25],["sme.sk",26],["yenigolcuk.com",27],["hedefgazetesi.com.tr",27],["eldedemokrasi.com",27],["afyonhaberturk.com",27],["nehaberankara.com",27],["mansetburdur.com",27],["bolgesellig.com",27],["telgrafgazetesi.com",27],["burokratika.com",27],["balikesirartihaber.com",27],["ajansbalikligol.com",27],["karar67.com",27],["gazetemalatya.com",27],["vansesigazetesi.com",27],["kocaelisabah.com",27],["antalyadanhaberler.com",27],["aydinyeniufuk.com.tr",27],["yerelvanhaber.com",27],["a2teker.com",27],["kibrishakikat.com",27],["izmirtime35.com",27],["sancakplus.com",27],["marasfisilti.com",27],["burdurgazetesi.com",27],["zeytinburnuhaber.org",27],["denizli20haber.com",27],["akdenizdeyeniyuzyil.net",27],["ulakci.com",27],["egegundem.com.tr",27],["isdunyasindakadin.com",27],["haberimizvar.net",27],["weather.com",[28,38]],["vsthouse.ru",29],["primpogoda.ru",29],["gitjournal.tech",29],["ok.ru",30],["capital.com",31],["cableav.tv",32],["indiatoday.in",33],["filmweb.pl",34],["mimaletadepeliculas.blogspot.com",35],["megapastes.com",[35,37]],["programegratuitepc.com",[35,43]],["digitalsynopsis.com",[35,43]],["gaypornmasters.com",35],["knshow.com",35],["malybelgrad.pl",35],["descargacineclasico.com",[35,37,54,55]],["demolandia.net",35],["statelibrary.us",35],["coag.pl",35],["quicksleeper.pl",35],["m4ufree.tv",35],["lexlog.pl",[35,37,55]],["mainframestechhelp.com",35],["gamershit.altervista.org",35],["gagetmatome.com",35],["virpe.com",35],["feel-the-darkness.rocks",[35,43,55]],["bricksrus.com",35],["jacquieetmichel.net",35],["ahzaa.net",35],["karyawanesia.com",35],["langitmovie.com",35],["oceanof-games.com",[35,37,43,68]],["ponselharian.com",[35,37,43]],["holakikou.com",[35,43]],["hotpornfile.org",[35,37,68,88]],["e-sushi.fr",35],["evasion-online.com",35],["exclusifvoyages.com",35],["payeer-gift.ru",35],["pcso-lottoresults.com",35],["iovivoatenerife.it",[35,43]],["tritinia.com",[35,74]],["battle-one.com",[35,43]],["wjx.cn",[35,37,97]],["masuit.com",35],["book.zongheng.com",35],["ciweimao.com",35],["360doc.com",35],["dushu.qq.com",[35,37,86]],["qiangwaikan.com",[35,43]],["7fyd.com",35],["unikampus.net",35],["atlas-geografic.net",35],["filmpornoitaliano.org",[35,37,55]],["cafe.naver.com",[35,37,54]],["cinemakottaga.top",35],["ytv.co.jp",35],["flashplayer.org.ua",[35,43,68]],["canale.live",35],["rightnonel.com",[35,43,55]],["viafarmaciaonline.it",35],["postcourier.com.pg",[35,104]],["freestreams-live1.tv",35],["saikai.com.br",35],["verselemzes.hu",[35,37,54,68,88]],["cine.to",36],["filmesonlinex.co",37],["badzjeszczelepszy.pl",[37,55,67]],["hebrew4christians.com",37],["techieway.blogspot.com",37],["69translations.blogspot.com",[37,55,87]],["cyberspace.world",37],["dailynewsview.com",37],["youmath.it",37],["operatorsekolahdbn.com",37],["brownsboys.com",37],["greenocktelegraph.co.uk",38],["med1.de",38],["tomsguide.com",38],["pushsquare.com",38],["wings.io",39],["dicionariocriativo.com.br",40],["bloombergquint.com",40],["bibliacatolica.com.br",40],["mongri.net",40],["al.com",41],["allkpop.com",41],["calendarpedia.co.uk",41],["ccn.com",41],["cleveland.com",41],["comicsands.com",41],["duffelblog.com",41],["gamepur.com",41],["gamerevolution.com",41],["interestingengineering.com",41],["keengamer.com",41],["listenonrepeat.com",41],["mandatory.com",41],["mlive.com",41],["musicfeeds.com.au",41],["newatlas.com",41],["pgatour.com",41],["readlightnovel.org",41],["secondnexus.com",41],["sevenforums.com",41],["sport24.co.za",41],["superherohype.com",41],["thefashionspot.com",41],["theodysseyonline.com",41],["totalbeauty.com",41],["westernjournal.com",41],["cinemablend.com",41],["windows101tricks.com",41],["skip.li",42],["gay69.stream",43],["raccontivietati.com",43],["neyrologos.gr",43],["ggeguide.com",43],["elizabeth-mitchell.org",43],["blasianluvforever.com",43],["autophorie.de",43],["fruit01.xyz",43],["experciencia.com",43],["ifdreamscametrue.com",43],["juegosdetiempolibre.org",43],["naijagists.com",43],["chessimprover.com",43],["diaforetiko.gr",43],["tchadcarriere.com",43],["shaamtv.com",43],["totemat.pl",43],["wawlist.com",43],["cristelageorgescu.ro",[43,68,86]],["ilovevaldinon.it",43],["dialectsarchive.com",43],["sportsnet.ca",44],["gisclub.tv",45],["punto-informatico.it",46],["emol.com",47],["springfieldspringfield.co.uk",47],["infomoney.com.br",47],["otvfoco.com.br",47],["portalportuario.cl",47],["adevarul.ro",47],["city-data.com",47],["mixmods.com.br",48],["deezer.com",49],["gota.io",50],["xnxx.com",50],["allafinedelpalo.it",51],["heypoorplayer.com",51],["majorgeeks.com",52],["harvardmagazine.com",52],["mangainn.net",52],["dotesports.com",52],["sherdog.com",52],["aboutchromebooks.com",52],["comingsoon.net",52],["gearjunkie.com",52],["winhelponline.com",52],["ancient.eu",52],["lgbtqnation.com",52],["statesman.com",52],["medievalists.net",52],["tvguide.com",52],["edn.com",52],["daysoftheyear.com",52],["economictimes.indiatimes.com",53],["satcesc.com",54],["template.city",54],["djelfa.info",55],["fin24.com",56],["stocktwits.com",56],["motogon.ru",57],["ctrl.blog",58],["descargasnsn.com",59],["priberam.org",60],["tunovelaligera.com",61],["zdnet.de",62],["putlockerfun.com",63],["chimica-online.it",64],["blog.kwick.de",[64,68]],["texte.work",64],["neowin.net",12],["laptopmag.com",12],["livescience.com",12],["digitalcameraworld.com",12],["keighleynews.co.uk",12],["t3.com",12],["recantodasletras.com.br",65],["lesoir.be",66],["yusepjaelani.blogspot.com",68],["ideaberita.com",68],["my-code4you.blogspot.com",68],["polagriparts.pl",68],["followmikewynn.com",68],["dreamlandresort.com",69],["live.b-c-e.us",69],["tecmundo.net",69],["disheye.com",69],["impotsurlerevenu.org",70],["insidermonkey.com",71],["kurosave.com",72],["gamebanana.com",24],["trojmiasto.pl",24],["good-football.org",24],["theregister.co.uk",73],["doranobi-fansub.id",74],["opportunitydesk.org",74],["jootc.com",[74,80]],["selfstudyanthro.com",74],["relet365.com",74],["wikibious.com",74],["koreanaddict.net",74],["generationamiga.com",74],["psihologiadeazi.ro",[74,104]],["flinsetyadi.com",74],["projektowanie-wnetrz-online.pl",74],["easyayurveda.com",[74,80,104,109]],["sharktankblog.com",[74,80,104,109]],["m4uhd.net",75],["quotev.com",76],["maxstream.video",77],["renditepassive.net",77],["52bdys.com",77],["earth.com",78],["digitaltrends.com",78],["nwherald.com",78],["lalawin.com",79],["ufret.jp",81],["motortrader.com.my",82],["2219.net",83],["upstream.to",84],["progameguides.com",85],["jpnn.com",86],["farm-ro.desigusxpro.com",86],["accgroup.vn",86],["empregoestagios.com",89],["elektrikmen.com",89],["hitproversion.com",89],["jobskaro.com",89],["appd.at",89],["apk1s.com",89],["audiobookcup.com",89],["elijahwood.altervista.org",90],["vinaurl.blogspot.com",91],["comprerural.com",92],["cssreference.io",93],["revistavanityfair.es",94],["toppremiumpro.com",95],["androidtvbox.eu",96],["dollarvr.com",96],["newsme.gr",96],["seffafbelediyecilik.com",27],["imooc.com",98],["commandlinux.com",99],["hongxiu.com",100],["readnovel.com",100],["c4ddownload.com",101],["the-scorpions.com",101],["animatedshows.to",102],["miraculous.to",102],["phimdinhcao.com",103],["beastx.top",103],["chillx.top",103],["playerx.stream",103],["phimlongtieng.net",103],["revenue.land",104],["pitesti24.ro",104],["samsungtechwin.com",104],["cours-de-droit.net",104],["iptv4best.com",104],["blogvisaodemercado.pt",104],["kapitalis.com",104],["tiempo.hn",104],["winmeen.com",104],["ibps.in",104],["visse.com.br",104],["javsubtitle.co",104],["licensekeys.org",104],["mediahiburan.my",104],["tipssehatcantik.com",104],["anime-drama.jp",104],["jbjbgame.com",104],["viatasisanatate.com",104],["ziarulargesul.ro",104],["globaldefensecorp.com",104],["gossipnextdoor.com",104],["coffeeapps.ir",104],["media.framu.world",104],["immobiliaremia.com",104],["colegiosconcertados.info",104],["bigdatauni.com",104],["rukim.id",104],["visefierbinti.ro",104],["cyberkrafttraining.com",104],["theaircurrent.com",104],["nocturnetls.net",104],["clockks.com",104],["ananda-yoga.ro",104],["poolpiscina.com",104],["infodifesa.it",104],["getective.com",104],["formatatmak.com",104],["drkrok.com",104],["alphagirlreviews.com",104],["kitchennovel.com",104],["voxvalachorum.ro",104],["cracksone.com",104],["day-hoc.org",104],["onlineonderdelenshop.nl",104],["primicia.com.ve",104],["tech-recipes.com",104],["afrikmag.com",104],["maduras.vip",104],["aprendeinglessila.com",104],["kicknews.today",104],["koalasplayground.com",104],["hellokpop.com",104],["hayatbilgileri.com",104],["moneyexcel.com",104],["placementstore.com",104],["neuroteam-metz.de",104],["codedosa.com",104],["liveyourmaths.com",104],["newspao.gr",104],["ieltsliz.com",104],["programasvirtualespc.net",104],["tempatwisataseru.com",104],["yhocdata.com",105],["iskandinavya.com",106],["warcraftlogs.com",107],["sneakernews.com",108],["forplayx.ink",110]]);

const entitiesMap = new Map([["docviewer.yandex",0],["tv.yandex",1],["desbloqueador",35],["voirfilms",[35,37]],["anisubindo",[35,68]],["tabonitobrasil",43],["fmovies",54],["wstream",77]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function abortOnPropertyRead(
    chain = ''
) {
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const exceptionToken = getExceptionToken();
    const abort = function() {
        throw new ReferenceError(exceptionToken);
    };
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            const desc = Object.getOwnPropertyDescriptor(owner, chain);
            if ( !desc || desc.get !== abort ) {
                Object.defineProperty(owner, chain, {
                    get: abort,
                    set: function(){}
                });
            }
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

function getExceptionToken() {
    const token =
        String.fromCharCode(Date.now() % 26 + 97) +
        Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
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
    try { abortOnPropertyRead(...argsList[i]); }
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
    return uBOL_abortOnPropertyRead();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_abortOnPropertyRead = cloneInto([
            [ '(', uBOL_abortOnPropertyRead.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_abortOnPropertyRead);
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
    delete page.uBOL_abortOnPropertyRead;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
