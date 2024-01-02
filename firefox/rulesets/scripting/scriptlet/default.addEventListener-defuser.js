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
const uBOL_addEventListenerDefuser = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["load","adBlock"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","pop"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["","click"],["canplay"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["DOMContentLoaded","iframe"],["mouseup","_blank"],["load","htmls"],["blur","focusOut"],["","/_blank/i"],["click","handleClick"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["/error|load/","/onerror|showModal/"],["load","doTest"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["click","openSite"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["DOMContentLoaded","disableDeveloperTools"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["","[native code]"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["load","length"],["gtmloaderror"],["click","adobeModalTestABenabled"],["blur","console.log"],["blur","counter"],["","AdB"],["load","adSession"],["load","Ads"],["load","goog"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["DOMContentLoaded","adsbygoogle"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["/adblock/i"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["DOMContentLoaded","adblocker"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["bild.de",5],["mediafire.com",[6,7]],["pinsystem.co.uk",8],["fembed.com",8],["ancensored.com",8],["o2tvseries.com",8],["mp3fiber.com",[8,19]],["xrivonet.info",8],["afreesms.com",9],["tio.ch",9],["lavanguardia.com",9],["eplayer.click",9],["kingofdown.com",10],["radiotormentamx.com",10],["quelleestladifference.fr",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["sna3talaflam.com",10],["agar.pro",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["interviewgig.com",10],["javaguides.net",10],["almohtarif-tech.net",10],["hl-live.de",10],["forum.release-apk.com",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["primedeportes.es",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["secretsdeepweb.blogspot.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["urdulibrarypk.blogspot.com",10],["zerotopay.com",10],["akw.to",10],["mawsueaa.com",10],["hesgoal-live.io",10],["king-shoot.io",10],["pornhd.com",11],["cnnamador.com",[11,37]],["cle0desktop.blogspot.com",11],["turkanime.co",11],["camclips.tv",[11,50]],["blackpornhq.com",11],["xsexpics.com",11],["ulsex.net",11],["wannafreeporn.com",11],["ytube2dl.com",11],["multiup.us",11],["protege-torrent.com",11],["bibme.org",15],["citationmachine.net",15],["easybib.com",16],["userupload.net",17],["vermangasporno.com",17],["imgtorrnt.in",17],["picbaron.com",[17,127]],["worldcupfootball.me",17],["letmejerk.com",17],["letmejerk3.com",17],["letmejerk4.com",17],["letmejerk5.com",17],["letmejerk6.com",17],["letmejerk7.com",17],["dlapk4all.com",17],["kropic.com",17],["kvador.com",17],["pdfindir.net",17],["brstej.com",17],["topwwnews.com",17],["xsanime.com",17],["vidlo.us",17],["put-locker.com",17],["youx.xxx",17],["animeindo.asia",17],["masahub.net",17],["adclickersbot.com",17],["badtaste.it",18],["mage.si",19],["totaldebrid.org",19],["neko-miku.com",19],["elsfile.org",19],["venstrike.jimdofree.com",19],["schrauben-normen.de",19],["avengerinator.blogspot.com",19],["link-to.net",19],["hanimesubth.com",19],["gsmturkey.net",19],["adshrink.it",19],["presentation-ppt.com",19],["mangacanblog.com",19],["pekalongan-cits.blogspot.com",19],["4tymode.win",19],["linkvertise.com",19],["reifenrechner.at",19],["tire-size-calculator.info",19],["kord-jadul.com",19],["linuxsecurity.com",19],["encodinghub.com",19],["readyssh.net",19],["itsguider.com",19],["cotravinh.blogspot.com",19],["itudong.com",19],["shortx.net",19],["comandotorrenthd.org",19],["turkdebrid.net",19],["lecturel.com",19],["bakai.org",19],["nar.k-ba.net",19],["tiroalpalo.org",19],["gotporn.com",21],["freepornrocks.com",21],["tvhai.org",21],["simpcity.su",21],["realgfporn.com",[22,23]],["titsbox.com",22],["thisvid.com",23],["xvideos-downloader.net",23],["imgspice.com",24],["vikiporn.com",25],["tnaflix.com",25],["hentai2w.com",[25,182]],["yourlust.com",25],["hotpornfile.org",25],["jav789.com",25],["javbuz.com",25],["letfap.com",25],["watchfreexxx.net",25],["vintageporntubes.com",25],["angelgals.com",25],["babesexy.com",25],["porndaa.com",25],["ganstamovies.com",25],["youngleak.com",25],["porndollz.com",25],["xnxxvideo.pro",25],["xvideosxporn.com",25],["onlyhgames.com",25],["filmpornofrancais.fr",25],["pictoa.com",[25,48]],["javout.co",25],["adultasianporn.com",25],["nsfwmonster.com",25],["girlsofdesire.org",25],["gaytail.com",25],["fetish-bb.com",25],["rumporn.com",25],["soyoungteens.com",25],["zubby.com",25],["lesbian8.com",25],["gayforfans.com",25],["reifporn.de",25],["javtsunami.com",25],["18tube.sex",25],["xxxextreme.org",25],["amateurs-fuck.com",25],["sex-amateur-clips.com",25],["hentaiworld.tv",25],["dads-banging-teens.com",25],["home-xxx-videos.com",25],["mature-chicks.com",25],["teens-fucking-matures.com",25],["hqbang.com",25],["darknessporn.com",25],["familyporner.com",25],["freepublicporn.com",25],["pisshamster.com",25],["punishworld.com",25],["xanimu.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,182]],["short.pe",32],["bs.to",35],["efukt.com",35],["kpopsea.com",35],["generacionretro.net",36],["nuevos-mu.ucoz.com",36],["micloudfiles.com",36],["mimaletamusical.blogspot.com",36],["visionias.net",36],["b3infoarena.in",36],["lurdchinexgist.blogspot.com",36],["thefreedommatrix.blogspot.com",36],["hentai-vl.blogspot.com",36],["projetomotog.blogspot.com",36],["ktmx.pro",36],["lirik3satu.blogspot.com",36],["marketmovers.it",36],["pharmaguideline.com",36],["safemaru.blogspot.com",36],["mixloads.com",36],["mangaromance.eu",36],["interssh.com",36],["freesoftpdfdownload.blogspot.com",36],["cirokun.blogspot.com",36],["myadslink.com",36],["blackavelic.com",36],["server.satunivers.tv",36],["eg-akw.com",36],["xn--mgba7fjn.cc",36],["flashingjungle.com",37],["ma-x.org",38],["lavozdegalicia.es",38],["xmovies08.org",40],["globaldjmix.com",41],["zazzybabes.com",42],["haaretz.co.il",43],["haaretz.com",43],["slate.com",44],["megalinks.info",45],["megapastes.com",45],["mega-mkv.com",[45,46]],["mkv-pastes.com",45],["zpaste.net",45],["zlpaste.net",45],["9xlinks.site",45],["zona-leros.net",46],["acortarm.xyz",47],["acortame.xyz",47],["cine.to",[48,186]],["hdstreamss.club",48],["kissasia.cc",48],["nzbstars.com",49],["digjav.com",50],["videoszoofiliahd.com",51],["xxxtubezoo.com",52],["zooredtube.com",52],["megacams.me",54],["rlslog.net",54],["porndoe.com",55],["acienciasgalilei.com",57],["playrust.io",58],["payskip.org",59],["short-url.link",60],["tubedupe.com",61],["fatgirlskinny.net",63],["polska-ie.com",63],["windowsmatters.com",63],["canaltdt.es",64],["masbrooo.com",64],["2ndrun.tv",64],["camclips.cc",[65,66]],["stfly.me",67],["oncehelp.com",67],["queenfaucet.website",67],["curto.win",67],["smallseotools.com",68],["macwelt.de",70],["pcwelt.de",70],["capital.de",70],["geo.de",70],["allmomsex.com",71],["allnewindianporn.com",71],["analxxxvideo.com",71],["animalextremesex.com",71],["anime3d.xyz",71],["animefuckmovies.com",71],["animepornfilm.com",71],["animesexbar.com",71],["animesexclip.com",71],["animexxxsex.com",71],["animexxxfilms.com",71],["anysex.club",71],["apetube.asia",71],["asianfuckmovies.com",71],["asianfucktube.com",71],["asianporn.sexy",71],["asiansexcilps.com",71],["beeg.fund",71],["beegvideoz.com",71],["bestasiansex.pro",71],["bigsexhub.com",71],["bravotube.asia",71],["brutalanimalsfuck.com",71],["candyteenporn.com",71],["daddyfuckmovies.com",71],["desifuckonline.com",71],["exclusiveasianporn.com",71],["exteenporn.com",71],["fantasticporn.net",71],["fantasticyoungporn.com",71],["fineasiansex.com",71],["firstasianpussy.com",71],["freeindiansextube.com",71],["freepornasians.com",71],["freerealvideo.com",71],["fuck-beeg.com",71],["fuck-xnxx.com",71],["fuckasian.pro",71],["fuckfuq.com",71],["fuckundies.com",71],["fullasiantube.com",71],["gojapaneseporn.com",71],["golderotica.com",71],["goodyoungsex.com",71],["goyoungporn.com",71],["hardxxxmoms.com",71],["hdvintagetube.com",71],["hentaiporn.me",71],["hentaisexfilms.com",71],["hentaisexuality.com",71],["hot-teens-movies.mobi",71],["hotanimepornvideos.com",71],["hotanimevideos.com",71],["hotasianpussysex.com",71],["hotjapaneseshows.com",71],["hotmaturetube.com",71],["hotmilfs.pro",71],["hotorientalporn.com",71],["hotpornsexvideos.com",71],["hotpornyoung.com",71],["hotxxxjapanese.com",71],["hotxxxpussy.com",71],["indiafree.net",71],["indianpornvideo.online",71],["japanpornclip.com",71],["japanesetube.video",71],["japansex.me",71],["japanesexxxporn.com",71],["japansporno.com",71],["japanxxx.asia",71],["japanxxxworld.com",71],["keezmovies.surf",71],["lingeriefuckvideo.com",71],["liveanimalporn.zooo.club",71],["madhentaitube.com",71],["megahentaitube.com",71],["megajapanesesex.com",71],["megajapantube.com",71],["milfxxxpussy.com",71],["momsextube.pro",71],["momxxxass.com",71],["monkeyanimalporn.com",71],["moviexxx.mobi",71],["newanimeporn.com",71],["newjapanesexxx.com",71],["nicematureporn.com",71],["nudeplayboygirls.com",71],["openxxxporn.com",71],["originalindianporn.com",71],["originalteentube.com",71],["pig-fuck.com",71],["plainasianporn.com",71],["popularasianxxx.com",71],["pornanimetube.com",71],["pornasians.pro",71],["pornhat.asia",71],["pornheed.online",71],["pornjapanesesex.com",71],["pornomovies.asia",71],["pornvintage.tv",71],["primeanimesex.com",71],["realjapansex.com",71],["realmomsex.com",71],["redsexhub.com",71],["retroporn.world",71],["retrosexfilms.com",71],["sex-free-movies.com",71],["sexanimesex.com",71],["sexanimetube.com",71],["sexjapantube.com",71],["sexmomvideos.com",71],["sexteenxxxtube.com",71],["sexxxanimal.com",71],["sexyoungtube.com",71],["sexyvintageporn.com",71],["sopornmovies.com",71],["spicyvintageporn.com",71],["sunporno.club",71],["tabooanime.club",71],["teenextrem.com",71],["teenfucksex.com",71],["teenhost.net",71],["teensexass.com",71],["tnaflix.asia",71],["totalfuckmovies.com",71],["totalmaturefuck.com",71],["txxx.asia",71],["voyeurpornsex.com",71],["warmteensex.com",71],["wetasiancreampie.com",71],["wildhentaitube.com",71],["wowyoungsex.com",71],["xhamster-art.com",71],["xmovie.pro",71],["xnudevideos.com",71],["xnxxjapon.com",71],["xpics.me",71],["xvide.me",71],["xxxanimefuck.com",71],["xxxanimevideos.com",71],["xxxanimemovies.com",71],["xxxhentaimovies.com",71],["xxxhothub.com",71],["xxxjapaneseporntube.com",71],["xxxlargeporn.com",71],["xxxmomz.com",71],["xxxpornmilf.com",71],["xxxpussyclips.com",71],["xxxpussysextube.com",71],["xxxretrofuck.com",71],["xxxsex.pro",71],["xxxsexyjapanese.com",71],["xxxteenyporn.com",71],["xxxvideo.asia",71],["xxxvideos.ink",71],["xxxyoungtv.com",71],["youjizzz.club",71],["youngpussyfuck.com",71],["bayimg.com",72],["celeb.gate.cc",73],["eodev.com",74],["masterplayer.xyz",76],["pussy-hub.com",76],["porndex.com",77],["compucalitv.com",78],["duden.de",81],["pennlive.com",83],["beautypageants.indiatimes.com",84],["01fmovies.com",85],["lnk2.cc",87],["fullhdxxx.com",88],["luscious.net",[88,127]],["classicpornbest.com",88],["1youngteenporn.com",88],["www-daftarharga.blogspot.com",[88,170]],["miraculous.to",[88,177]],["vtube.to",88],["gosexpod.com",89],["tubepornclassic.com",90],["shemalez.com",90],["otakukan.com",91],["xcafe.com",92],["pornfd.com",92],["venusarchives.com",92],["imagehaha.com",93],["imagenpic.com",93],["imageshimage.com",93],["imagetwist.com",93],["deusasporno.com.br",94],["sambaporno2.com",94],["sexoamador.blog.br",94],["videospornozinhos.com",94],["videosexoquente.com",94],["xvideosf.com",94],["k1nk.co",94],["watchasians.cc",94],["alexsports.xyz",94],["lulustream.com",94],["luluvdo.com",94],["web.de",95],["news18.com",96],["thelanb.com",97],["dropmms.com",97],["softwaredescargas.com",98],["cracking-dz.com",99],["anitube.ninja",100],["gazzetta.it",101],["alliptvlinks.com",102],["waterfall.money",102],["port.hu",104],["dziennikbaltycki.pl",105],["dzienniklodzki.pl",105],["dziennikpolski24.pl",105],["dziennikzachodni.pl",105],["echodnia.eu",105],["expressbydgoski.pl",105],["expressilustrowany.pl",105],["gazetakrakowska.pl",105],["gazetalubuska.pl",105],["gazetawroclawska.pl",105],["gk24.pl",105],["gloswielkopolski.pl",105],["gol24.pl",105],["gp24.pl",105],["gra.pl",105],["gs24.pl",105],["kurierlubelski.pl",105],["motofakty.pl",105],["naszemiasto.pl",105],["nowiny24.pl",105],["nowosci.com.pl",105],["nto.pl",105],["polskatimes.pl",105],["pomorska.pl",105],["poranny.pl",105],["sportowy24.pl",105],["strefaagro.pl",105],["strefabiznesu.pl",105],["stronakobiet.pl",105],["telemagazyn.pl",105],["to.com.pl",105],["wspolczesna.pl",105],["course9x.com",105],["courseclub.me",105],["azrom.net",105],["alttyab.net",105],["esopress.com",105],["nesiaku.my.id",105],["onemanhua.com",106],["freeindianporn.mobi",106],["dr-farfar.com",107],["boyfriendtv.com",108],["brandstofprijzen.info",109],["netfuck.net",110],["blog24.me",[110,121]],["kisahdunia.com",110],["javsex.to",110],["nulljungle.com",110],["oyuncusoruyor.com",110],["pbarecap.ph",110],["sourds.net",110],["teknobalta.com",110],["tvinternetowa.info",110],["sqlserveregitimleri.com",110],["tutcourse.com",110],["readytechflip.com",110],["novinhastop.com",110],["warddogs.com",110],["dvdgayporn.com",110],["iimanga.com",110],["tinhocdongthap.com",110],["tremamnon.com",110],["freedownloadvideo.net",110],["423down.com",110],["brizzynovel.com",110],["jugomobile.com",110],["freecodezilla.net",110],["movieslegacy.com",110],["animekhor.xyz",110],["iconmonstr.com",110],["gay-tubes.cc",110],["rbxscripts.net",110],["comentariodetexto.com",110],["wordpredia.com",110],["livsavr.co",110],["allfaucet.xyz",[110,121]],["titbytz.tk",110],["replica-watch.info",110],["alludemycourses.com",110],["kayifamilytv.com",110],["iir.ai",111],["gameofporn.com",113],["qpython.club",114],["antifake-funko.fr",114],["e9china.net",115],["ac.ontools.net",115],["marketbeat.com",116],["hentaipornpics.net",117],["apps2app.com",118],["upshrink.com",119],["loaninsurehub.com",120],["ohionowcast.info",121],["wiour.com",121],["bitzite.com",[121,125,126]],["appsbull.com",121],["diudemy.com",121],["maqal360.com",121],["bitcotasks.com",121],["videolyrics.in",121],["manofadan.com",121],["cempakajaya.com",121],["tagecoin.com",121],["doge25.in",121],["king-ptcs.com",121],["naijafav.top",121],["ourcoincash.xyz",121],["sh.techsamir.com",121],["claimcoins.site",121],["cryptosh.pro",121],["cryptoearnfaucet.com",121],["coinsrev.com",121],["go.freetrx.fun",121],["eftacrypto.com",121],["fescrypto.com",121],["earnhub.net",121],["kiddyshort.com",121],["tronxminer.com",121],["homeairquality.org",122],["fc-lc.xyz",123],["cutlink.net",124],["cutsy.net",124],["cutyurls.com",124],["cutty.app",124],["aiimgvlog.fun",127],["6indianporn.com",127],["amateurebonypics.com",127],["amateuryoungpics.com",127],["cinemabg.net",127],["desimmshd.com",127],["frauporno.com",127],["givemeaporn.com",127],["jav-asia.top",127],["javf.net",127],["javideo.net",127],["kr18plus.com",127],["pilibook.com",127],["pornborne.com",127],["porngrey.com",127],["qqxnxx.com",127],["sexvideos.host",127],["submilf.com",127],["subtaboo.com",127],["tktube.com",127],["xfrenchies.com",127],["coingraph.us",128],["momo-net.com",128],["maxgaming.fi",128],["vulture.com",129],["megaplayer.bokracdn.run",130],["hentaistream.com",131],["siteunblocked.info",132],["larvelfaucet.com",133],["feyorra.top",133],["claimtrx.com",133],["moviesyug.net",134],["w4files.ws",134],["parispi.net",135],["simkl.com",136],["sayrodigital.com",137],["mrproblogger.com",138],["themezon.net",138],["paperzonevn.com",139],["dailyvideoreports.net",140],["lewd.ninja",141],["systemnews24.com",142],["incestvidz.com",143],["niusdiario.es",144],["playporngames.com",145],["movi.pk",[146,151]],["justin.mp3quack.lol",148],["cutesexyteengirls.com",149],["asianembed.io",150],["0dramacool.net",151],["185.53.88.104",151],["185.53.88.204",151],["185.53.88.15",151],["123movies4k.net",151],["1movieshd.com",151],["1rowsports.com",151],["4share-mp3.net",151],["6movies.net",151],["9animetv.to",151],["720pstream.me",151],["aagmaal.com",151],["abysscdn.com",151],["adblockplustape.com",151],["ajkalerbarta.com",151],["akstream.xyz",151],["androidapks.biz",151],["androidsite.net",151],["animefenix.com",151],["animeonlinefree.org",151],["animesite.net",151],["animespank.com",151],["aniworld.to",151],["apkmody.io",151],["appsfree4u.com",151],["audioz.download",151],["bdnewszh.com",151],["beastlyprints.com",151],["bengalisite.com",151],["bestfullmoviesinhd.org",151],["betteranime.net",151],["blacktiesports.live",151],["buffsports.stream",151],["ch-play.com",151],["clickforhire.com",151],["cloudy.pk",151],["computercrack.com",151],["coolcast2.com",151],["crackedsoftware.biz",151],["crackfree.org",151],["cracksite.info",151],["cryptoblog24.info",151],["cuatrolatastv.blogspot.com",151],["cydiasources.net",151],["dirproxy.com",151],["dopebox.to",151],["downloadapk.info",151],["downloadapps.info",151],["downloadgames.info",151],["downloadmusic.info",151],["downloadsite.org",151],["downloadwella.com",151],["ebooksite.org",151],["educationtips213.blogspot.com",151],["egyup.live",151],["embed.meomeo.pw",151],["embed.scdn.to",151],["emulatorsite.com",151],["essaysharkwriting.club",151],["extrafreetv.com",151],["fakedetail.com",151],["fclecteur.com",151],["files.im",151],["flexyhit.com",151],["fmoviefree.net",151],["fmovies24.com",151],["footyhunter3.xyz",151],["freeflix.info",151],["freemoviesu4.com",151],["freeplayervideo.com",151],["freesoccer.net",151],["fseries.org",151],["gamefast.org",151],["gamesite.info",151],["gmanga.me",151],["gocast123.me",151],["gogohd.net",151],["gogoplay5.com",151],["gooplay.net",151],["gostreamon.net",151],["happy2hub.org",151],["harimanga.com",151],["healthnewsreel.com",151],["hexupload.net",151],["hinatasoul.com",151],["hindisite.net",151],["holymanga.net",151],["hxfile.co",151],["isosite.org",151],["iv-soft.com",151],["januflix.expert",151],["jewelry.com.my",151],["johnwardflighttraining.com",151],["kabarportal.com",151],["kstorymedia.com",151],["la123movies.org",151],["lespassionsdechinouk.com",151],["lilymanga.net",151],["linksdegrupos.com.br",151],["livestreamtv.pk",151],["macsite.info",151],["mangapt.com",151],["mangareader.to",151],["mangasite.org",151],["manhuascan.com",151],["megafilmeshdseries.com",151],["megamovies.org",151],["membed.net",151],["mgnetu.com",151],["moddroid.com",151],["moviefree2.com",151],["movies-watch.com.pk",151],["moviesite.app",151],["moviesonline.fm",151],["moviesx.org",151],["moviewatchonline.com.pk",151],["msmoviesbd.com",151],["musicsite.biz",151],["myfernweh.com",151],["myviid.com",151],["nazarickol.com",151],["newsrade.com",151],["noob4cast.com",151],["nsw2u.com",[151,244]],["oko.sh",151],["olympicstreams.me",151],["orangeink.pk",151],["owllink.net",151],["pahaplayers.click",151],["patchsite.net",151],["pdfsite.net",151],["play1002.com",151],["player-cdn.com",151],["productkeysite.com",151],["projectfreetv.one",151],["romsite.org",151],["rufiguta.com",151],["rytmp3.io",151],["send.cm",151],["seriesite.net",151],["seriezloaded.com.ng",151],["serijehaha.com",151],["shrugemojis.com",151],["siteapk.net",151],["siteflix.org",151],["sitegames.net",151],["sitekeys.net",151],["sitepdf.com",151],["sitetorrent.com",151],["softwaresite.net",151],["sportbar.live",151],["sportkart1.xyz",151],["ssyoutube.com",151],["stardima.com",151],["stream4free.live",151],["superapk.org",151],["supermovies.org",151],["tainio-mania.online",151],["talaba.su",151],["tamilguns.org",151],["tatabrada.tv",151],["theflixer.tv",151],["thememypc.net",151],["thetechzone.online",151],["thripy.com",151],["tonnestreamz.xyz",151],["travelplanspro.com",151],["turcasmania.com",151],["tusfiles.com",151],["tvonlinesports.com",151],["ultramovies.org",151],["uploadbank.com",151],["urdubolo.pk",151],["vidspeeds.com",151],["vumoo.to",151],["warezsite.net",151],["watchmovies2.com",151],["watchmoviesforfree.org",151],["watchofree.com",151],["watchsite.net",151],["watchsouthpark.tv",151],["watchtvch.club",151],["web.livecricket.is",151],["webseries.club",151],["worldcupstream.pm",151],["y2mate.com",151],["youapk.net",151],["youtube4kdownloader.com",151],["yts-subs.com",151],["haho.moe",152],["nicy-spicy.pw",153],["fap-guru.cam",154],["novelmultiverse.com",155],["mylegalporno.com",156],["thecut.com",159],["novelism.jp",160],["alphapolis.co.jp",161],["okrzone.com",162],["game3rb.com",163],["javhub.net",163],["thotvids.com",164],["berklee.edu",165],["rawkuma.com",[166,167]],["moviesjoyhd.to",167],["imeteo.sk",168],["youtubemp3donusturucu.net",169],["surfsees.com",171],["vivo.st",[172,173]],["alueviesti.fi",175],["kiuruvesilehti.fi",175],["lempaala.ideapark.fi",175],["olutposti.fi",175],["urjalansanomat.fi",175],["joyhints.com",176],["tainhanhvn.com",178],["titantv.com",179],["3cinfo.net",180],["transportationlies.org",181],["camarchive.tv",182],["crownimg.com",182],["freejav.guru",182],["hentai2read.com",182],["icyporno.com",182],["illink.net",182],["javtiful.com",182],["m-hentai.net",182],["pornblade.com",182],["pornfelix.com",182],["pornxxxxtube.net",182],["redwap.me",182],["redwap2.com",182],["redwap3.com",182],["tubxporn.xxx",182],["ver-comics-porno.com",182],["ver-mangas-porno.com",182],["xanimeporn.com",182],["xxxvideohd.net",182],["zetporn.com",182],["cocomanga.com",183],["mcleaks.net",184],["explorecams.com",184],["minecraft.buzz",184],["chillx.top",185],["playerx.stream",185],["m.liputan6.com",187],["stardewids.com",[187,209]],["ingles.com",188],["spanishdict.com",188],["rureka.com",189],["bunkr.is",190],["amateur8.com",191],["freeporn8.com",191],["maturetubehere.com",191],["embedo.co",192],["corriere.it",193],["oggi.it",193],["2the.space",194],["apkcombo.com",196],["sponsorhunter.com",197],["soft98.ir",198],["novelssites.com",199],["haxina.com",200],["cryptofenz.xyz",200],["torrentmac.net",201],["moviezaddiction.icu",202],["dlpanda.com",203],["socialmediagirls.com",204],["einrichtungsbeispiele.de",205],["weadown.com",206],["molotov.tv",207],["freecoursesonline.me",208],["adelsfun.com",208],["advantien.com",208],["bailbondsfinder.com",208],["bigpiecreative.com",208],["childrenslibrarylady.com",208],["classifarms.com",208],["comtasq.ca",208],["crone.es",208],["ctrmarketingsolutions.com",208],["dropnudes.com",208],["ftuapps.dev",208],["genzsport.com",208],["ghscanner.com",208],["grsprotection.com",208],["gruporafa.com.br",208],["inmatefindcalifornia.com",208],["inmatesearchidaho.com",208],["itsonsitetv.com",208],["mfmfinancials.com",208],["myproplugins.com",208],["onehack.us",208],["ovester.com",208],["paste.bin.sx",208],["privatenudes.com",208],["renoconcrete.ca",208],["richieashbeck.com",208],["sat.technology",208],["short1ink.com",208],["stpm.co.uk",208],["wegotcookies.co",208],["mathcrave.com",208],["commands.gg",209],["smgplaza.com",210],["autosport.com",[211,212]],["motorsport.com",[211,212]],["freepik.com",213],["pinloker.com",215],["sekilastekno.com",215],["diyphotography.net",216],["bitchesgirls.com",217],["shopforex.online",218],["yesmangas1.com",219],["programmingeeksclub.com",220],["easymc.io",221],["diendancauduong.com",222],["parentcircle.com",223],["h-game18.xyz",224],["nopay.info",225],["wheelofgold.com",226],["shortlinks.tech",227],["recipahi.com",228],["davescomputertips.com",229],["skill4ltu.eu",231],["freepikdownloader.com",232],["freepasses.org",233],["iusedtobeaboss.com",234],["gamerant.com",235],["thegamer.com",235],["blogtruyenmoi.com",236],["repretel.com",237],["igay69.com",238],["graphicget.com",239],["qiwi.gg",240],["netcine2.la",241],["isthischannelmonetized.com",242],["cbc.ca",243]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",8],["ganool",8],["pirate",8],["piratebay",8],["pirateproxy",8],["proxytpb",8],["thepiratebay",8],["limetorrents",[10,17]],["king-pes",10],["depedlps",10],["komikcast",10],["idedroidsafelink",10],["links-url",10],["eikaiwamastery",10],["ak4eg",10],["xhamster",11],["xhamster1",11],["xhamster5",11],["xhamster7",11],["rexporn",11],["movies07",11],["pornocomics",11],["streanplay",12],["steanplay",12],["liferayiseasy",[13,14]],["pahe",17],["yts",17],["tube8",17],["topeuropix",17],["moviescounter",17],["torrent9",17],["desiremovies",17],["movs4u",17],["uwatchfree",17],["hydrax",17],["4movierulz",17],["projectfreetv",17],["arabseed",17],["btdb",[17,58]],["skymovieshd",17],["world4ufree",17],["streamsport",17],["rojadirectatvhd",17],["userload",17],["freecoursesonline",19],["lordpremium",19],["todovieneok",19],["novablogitalia",19],["anisubindo",19],["btvsports",19],["adyou",20],["fxporn69",22],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["readcomiconline",34],["burningseries",35],["dz4soft",36],["yoututosjeff",36],["ebookmed",36],["lanjutkeun",36],["novelasesp",36],["singingdalong",36],["doujindesu",36],["xmovies8",39],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",47],["newpelis",[48,56]],["pelix",[48,56]],["allcalidad",[48,182]],["khatrimaza",48],["camwhores",50],["camwhorestv",50],["uproxy",50],["nekopoi",53],["mirrorace",62],["mixdrp",69],["asiansex",71],["japanfuck",71],["japanporn",71],["teensex",71],["vintagetube",71],["xxxmovies",71],["zooqle",75],["hdfull",79],["mangamanga",80],["streameast",82],["thestreameast",82],["vev",86],["vidop",86],["zone-telechargement",88],["megalink",94],["gmx",95],["mega1080p",100],["9hentai",103],["gaypornhdfree",110],["cinemakottaga",110],["privatemoviez",110],["apkmaven",110],["popcornstream",112],["pornktube",127],["watchseries",127],["milfnut",128],["pagalmovies",134],["7starhd",134],["jalshamoviez",134],["9xupload",134],["bdupload",134],["desiupload",134],["rdxhd1",134],["moviessources",147],["nuvid",148],["goload",[150,151]],["0gomovie",151],["0gomovies",151],["123moviefree",151],["1kmovies",151],["1madrasdub",151],["1primewire",151],["2embed",151],["2madrasdub",151],["2umovies",151],["4anime",151],["9xmovies",151],["altadefinizione01",151],["anitube",151],["atomixhq",151],["beinmatch",151],["brmovies",151],["cima4u",151],["clicknupload",151],["cmovies",151],["couchtuner",151],["cricfree",151],["crichd",151],["databasegdriveplayer",151],["dood",151],["f1stream",151],["faselhd",151],["fbstream",151],["file4go",151],["filemoon",151],["filepress",[151,214]],["filmlinks4u",151],["filmpertutti",151],["filmyzilla",151],["fmovies",151],["french-stream",151],["fsapi",151],["fzlink",151],["gdriveplayer",151],["gofilms4u",151],["gogoanime",151],["gomoviefree",151],["gomoviz",151],["gowatchseries",151],["hdmoviefair",151],["hdmovies4u",151],["hdmovies50",151],["hdmoviesfair",151],["hh3dhay",151],["hindilinks4u",151],["hotmasti",151],["hurawatch",151],["klmanga",151],["klubsports",151],["libertestreamvf",151],["livetvon",151],["manga1000",151],["manga1001",151],["mangaraw",151],["mangarawjp",151],["mlbstream",151],["motogpstream",151],["movierulz",151],["movies123",151],["movies2watch",151],["moviesden",151],["moviezaddiction",151],["myflixer",151],["nbastream",151],["netcine",151],["nflstream",151],["nhlstream",151],["onlinewatchmoviespk",151],["pctfenix",151],["pctnew",151],["pksmovies",151],["plyjam",151],["plylive",151],["pogolinks",151],["popcorntime",151],["poscitech",151],["prmovies",151],["rugbystreams",151],["shahed4u",151],["sflix",151],["sitesunblocked",151],["socceronline",151],["solarmovies",151],["sportcast",151],["sportskart",151],["sports-stream",151],["streaming-french",151],["streamers",151],["streamingcommunity",151],["strikeout",151],["t20cup",151],["tennisstreams",151],["torrentdosfilmes",151],["toonanime",151],["tvply",151],["ufcstream",151],["uptomega",151],["uqload",151],["vudeo",151],["vidoo",151],["vipbox",151],["vipboxtv",151],["vipleague",151],["viprow",151],["yesmovies",151],["yomovies",151],["yomovies1",151],["yt2mp3s",151],["kat",151],["katbay",151],["kickass",151],["kickasshydra",151],["kickasskat",151],["kickass2",151],["kickasstorrents",151],["kat2",151],["kattracker",151],["thekat",151],["thekickass",151],["kickassz",151],["kickasstorrents2",151],["topkickass",151],["kickassgo",151],["kkickass",151],["kkat",151],["kickasst",151],["kick4ss",151],["guardaserie",157],["cine-calidad",158],["videovard",174],["gntai",182],["grantorrent",182],["mejortorrent",182],["mejortorrento",182],["mejortorrents",182],["mejortorrents1",182],["mejortorrentt",182],["softonic",195],["bg-gledai",208],["gledaitv",208],["motchill",230]]);

const exceptionsMap = new Map([["mentor.duden.de",[81]],["forum.soft98.ir",[198]]]);

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const log = shouldLog(extraArgs);
    const debug = shouldDebug(extraArgs);
    const trapEddEventListeners = ( ) => {
        const eventListenerHandler = {
            apply: function(target, thisArg, args) {
                let type, handler;
                try {
                    type = String(args[0]);
                    handler = args[1] instanceof Function
                        ? String(safe.Function_toString(args[1]))
                        : String(args[1]);
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
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
        uboLog(...args) {
            if ( scriptletGlobals.has('canDebug') === false ) { return; }
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
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
                    re: new this.RegExp(pattern.replace(
                        /[.*+?^${}()|[\]\\]/g, '\\$&'),
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
                const reStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
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
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

const targetWorld = 'MAIN';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
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
