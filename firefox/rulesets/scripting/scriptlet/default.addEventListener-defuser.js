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

const scriptletGlobals = {}; // jshint ignore: line

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["load","adBlock"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","pop"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","iframe"],["mouseup","_blank"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","handleClick"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["blur","counter"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["load","length"],["gtmloaderror"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","adsSrc"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["blur","event.triggered"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["bild.de",5],["mediafire.com",[6,7]],["pinsystem.co.uk",8],["fembed.com",8],["ancensored.com",8],["o2tvseries.com",8],["mp3fiber.com",[8,19]],["xrivonet.info",8],["afreesms.com",9],["tio.ch",9],["lavanguardia.com",9],["eplayer.click",9],["kingofdown.com",10],["radiotormentamx.com",10],["quelleestladifference.fr",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["sna3talaflam.com",10],["agar.pro",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["interviewgig.com",10],["javaguides.net",10],["almohtarif-tech.net",10],["forum.release-apk.com",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["primedeportes.es",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["secretsdeepweb.blogspot.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["urdulibrarypk.blogspot.com",10],["zerotopay.com",10],["akw.to",10],["mawsueaa.com",10],["hesgoal-live.io",10],["king-shoot.io",10],["pornhd.com",11],["cnnamador.com",[11,38]],["cle0desktop.blogspot.com",11],["turkanime.co",11],["camclips.tv",[11,51]],["blackpornhq.com",11],["xsexpics.com",11],["ulsex.net",11],["wannafreeporn.com",11],["ytube2dl.com",11],["multiup.us",11],["protege-torrent.com",11],["bibme.org",15],["citationmachine.net",15],["easybib.com",16],["vermangasporno.com",17],["imgtorrnt.in",17],["picbaron.com",[17,128]],["worldcupfootball.me",17],["letmejerk.com",17],["letmejerk2.com",17],["letmejerk3.com",17],["letmejerk4.com",17],["letmejerk5.com",17],["letmejerk6.com",17],["letmejerk7.com",17],["dlapk4all.com",17],["kropic.com",17],["kvador.com",17],["pdfindir.net",17],["brstej.com",17],["topwwnews.com",17],["xsanime.com",17],["vidlo.us",17],["put-locker.com",17],["youx.xxx",17],["animeindo.asia",17],["masahub.net",17],["adclickersbot.com",17],["badtaste.it",18],["mage.si",19],["totaldebrid.org",19],["neko-miku.com",19],["elsfile.org",19],["venstrike.jimdofree.com",19],["schrauben-normen.de",19],["avengerinator.blogspot.com",19],["link-to.net",19],["hanimesubth.com",19],["gsmturkey.net",19],["adshrink.it",19],["presentation-ppt.com",19],["mangacanblog.com",19],["pekalongan-cits.blogspot.com",19],["4tymode.win",19],["linkvertise.com",19],["reifenrechner.at",19],["tire-size-calculator.info",19],["linuxsecurity.com",19],["encodinghub.com",19],["itsguider.com",19],["cotravinh.blogspot.com",19],["itudong.com",19],["shortx.net",19],["comandotorrenthd.org",19],["turkdebrid.net",19],["lecturel.com",19],["bakai.org",19],["nar.k-ba.net",19],["tiroalpalo.org",19],["shemalez.com",21],["tubepornclassic.com",21],["gotporn.com",22],["freepornrocks.com",22],["tvhai.org",22],["simpcity.su",22],["realgfporn.com",[23,24]],["titsbox.com",23],["thisvid.com",24],["xvideos-downloader.net",24],["imgspice.com",25],["vikiporn.com",26],["tnaflix.com",26],["hentai2w.com",[26,180]],["yourlust.com",26],["hotpornfile.org",26],["jav789.com",26],["javbuz.com",26],["letfap.com",26],["watchfreexxx.net",26],["vintageporntubes.com",26],["angelgals.com",26],["babesexy.com",26],["porndaa.com",26],["ganstamovies.com",26],["youngleak.com",26],["porndollz.com",26],["xnxxvideo.pro",26],["xvideosxporn.com",26],["onlyhgames.com",26],["filmpornofrancais.fr",26],["pictoa.com",[26,49]],["adultasianporn.com",26],["nsfwmonster.com",26],["girlsofdesire.org",26],["gaytail.com",26],["fetish-bb.com",26],["rumporn.com",26],["soyoungteens.com",26],["zubby.com",26],["lesbian8.com",26],["gayforfans.com",26],["reifporn.de",26],["javtsunami.com",26],["18tube.sex",26],["xxxextreme.org",26],["amateurs-fuck.com",26],["sex-amateur-clips.com",26],["hentaiworld.tv",26],["dads-banging-teens.com",26],["home-xxx-videos.com",26],["mature-chicks.com",26],["teens-fucking-matures.com",26],["hqbang.com",26],["darknessporn.com",26],["familyporner.com",26],["freepublicporn.com",26],["pisshamster.com",26],["punishworld.com",26],["xanimu.com",26],["pussyspace.com",[27,28]],["pussyspace.net",[27,28]],["empflix.com",29],["cpmlink.net",30],["bdsmstreak.com",30],["cutpaid.com",30],["pornforrelax.com",30],["fatwhitebutt.com",30],["mavplay.xyz",30],["sunporno.com",[31,32,180]],["short.pe",33],["bs.to",36],["efukt.com",36],["kpopsea.com",36],["generacionretro.net",37],["nuevos-mu.ucoz.com",37],["micloudfiles.com",37],["mimaletamusical.blogspot.com",37],["visionias.net",37],["b3infoarena.in",37],["lurdchinexgist.blogspot.com",37],["thefreedommatrix.blogspot.com",37],["hentai-vl.blogspot.com",37],["projetomotog.blogspot.com",37],["ktmx.pro",37],["lirik3satu.blogspot.com",37],["marketmovers.it",37],["pharmaguideline.com",37],["safemaru.blogspot.com",37],["mixloads.com",37],["mangaromance.eu",37],["interssh.com",37],["freesoftpdfdownload.blogspot.com",37],["cirokun.blogspot.com",37],["myadslink.com",37],["blackavelic.com",37],["server.satunivers.tv",37],["eg-akw.com",37],["xn--mgba7fjn.cc",37],["flashingjungle.com",38],["ma-x.org",39],["lavozdegalicia.es",39],["xmovies08.org",41],["globaldjmix.com",42],["zazzybabes.com",43],["haaretz.co.il",44],["haaretz.com",44],["slate.com",45],["megalinks.info",46],["megapastes.com",46],["mega-mkv.com",[46,47]],["mkv-pastes.com",46],["zpaste.net",46],["zlpaste.net",46],["9xlinks.site",46],["zona-leros.net",47],["acortarm.xyz",48],["acortame.xyz",48],["cine.to",[49,184]],["kissasia.cc",49],["nzbstars.com",50],["digjav.com",51],["videoszoofiliahd.com",52],["xxxtubezoo.com",53],["zooredtube.com",53],["megacams.me",55],["rlslog.net",55],["porndoe.com",56],["acienciasgalilei.com",58],["playrust.io",59],["payskip.org",60],["short-url.link",61],["tubedupe.com",62],["fatgirlskinny.net",64],["polska-ie.com",64],["windowsmatters.com",64],["canaltdt.es",65],["masbrooo.com",65],["2ndrun.tv",65],["stfly.me",66],["oncehelp.com",66],["queenfaucet.website",66],["curto.win",66],["smallseotools.com",67],["macwelt.de",69],["pcwelt.de",69],["capital.de",69],["geo.de",69],["allmomsex.com",70],["allnewindianporn.com",70],["analxxxvideo.com",70],["animalextremesex.com",70],["anime3d.xyz",70],["animefuckmovies.com",70],["animepornfilm.com",70],["animesexbar.com",70],["animesexclip.com",70],["animexxxsex.com",70],["animexxxfilms.com",70],["anysex.club",70],["apetube.asia",70],["asianfuckmovies.com",70],["asianfucktube.com",70],["asianporn.sexy",70],["asiansexcilps.com",70],["beeg.fund",70],["beegvideoz.com",70],["bestasiansex.pro",70],["bigsexhub.com",70],["bravotube.asia",70],["brutalanimalsfuck.com",70],["candyteenporn.com",70],["daddyfuckmovies.com",70],["desifuckonline.com",70],["exclusiveasianporn.com",70],["exteenporn.com",70],["fantasticporn.net",70],["fantasticyoungporn.com",70],["fineasiansex.com",70],["firstasianpussy.com",70],["freeindiansextube.com",70],["freepornasians.com",70],["freerealvideo.com",70],["fuck-beeg.com",70],["fuck-xnxx.com",70],["fuckasian.pro",70],["fuckfuq.com",70],["fuckundies.com",70],["fullasiantube.com",70],["gojapaneseporn.com",70],["golderotica.com",70],["goodyoungsex.com",70],["goyoungporn.com",70],["hardxxxmoms.com",70],["hdvintagetube.com",70],["hentaiporn.me",70],["hentaisexfilms.com",70],["hentaisexuality.com",70],["hot-teens-movies.mobi",70],["hotanimepornvideos.com",70],["hotanimevideos.com",70],["hotasianpussysex.com",70],["hotjapaneseshows.com",70],["hotmaturetube.com",70],["hotmilfs.pro",70],["hotorientalporn.com",70],["hotpornsexvideos.com",70],["hotpornyoung.com",70],["hotxxxjapanese.com",70],["hotxxxpussy.com",70],["indiafree.net",70],["indianpornvideo.online",70],["japanpornclip.com",70],["japanesetube.video",70],["japansex.me",70],["japanesexxxporn.com",70],["japansporno.com",70],["japanxxx.asia",70],["japanxxxworld.com",70],["keezmovies.surf",70],["lingeriefuckvideo.com",70],["liveanimalporn.zooo.club",70],["madhentaitube.com",70],["megahentaitube.com",70],["megajapanesesex.com",70],["megajapantube.com",70],["milfxxxpussy.com",70],["momsextube.pro",70],["momxxxass.com",70],["monkeyanimalporn.com",70],["moviexxx.mobi",70],["newanimeporn.com",70],["newjapanesexxx.com",70],["nicematureporn.com",70],["nudeplayboygirls.com",70],["openxxxporn.com",70],["originalindianporn.com",70],["originalteentube.com",70],["pig-fuck.com",70],["plainasianporn.com",70],["popularasianxxx.com",70],["pornanimetube.com",70],["pornasians.pro",70],["pornhat.asia",70],["pornheed.online",70],["pornjapanesesex.com",70],["pornomovies.asia",70],["pornvintage.tv",70],["primeanimesex.com",70],["realjapansex.com",70],["realmomsex.com",70],["redsexhub.com",70],["retroporn.world",70],["retrosexfilms.com",70],["sex-free-movies.com",70],["sexanimesex.com",70],["sexanimetube.com",70],["sexjapantube.com",70],["sexmomvideos.com",70],["sexteenxxxtube.com",70],["sexxxanimal.com",70],["sexyoungtube.com",70],["sexyvintageporn.com",70],["sopornmovies.com",70],["spicyvintageporn.com",70],["sunporno.club",70],["tabooanime.club",70],["teenextrem.com",70],["teenfucksex.com",70],["teenhost.net",70],["teensexass.com",70],["tnaflix.asia",70],["totalfuckmovies.com",70],["totalmaturefuck.com",70],["txxx.asia",70],["voyeurpornsex.com",70],["warmteensex.com",70],["wetasiancreampie.com",70],["wildhentaitube.com",70],["wowyoungsex.com",70],["xhamster-art.com",70],["xmovie.pro",70],["xnudevideos.com",70],["xnxxjapon.com",70],["xpics.me",70],["xvide.me",70],["xxxanimefuck.com",70],["xxxanimevideos.com",70],["xxxanimemovies.com",70],["xxxhentaimovies.com",70],["xxxhothub.com",70],["xxxjapaneseporntube.com",70],["xxxlargeporn.com",70],["xxxmomz.com",70],["xxxpornmilf.com",70],["xxxpussyclips.com",70],["xxxpussysextube.com",70],["xxxretrofuck.com",70],["xxxsex.pro",70],["xxxsexyjapanese.com",70],["xxxteenyporn.com",70],["xxxvideo.asia",70],["xxxvideos.ink",70],["xxxyoungtv.com",70],["youjizzz.club",70],["youngpussyfuck.com",70],["bayimg.com",71],["celeb.gate.cc",72],["eodev.com",73],["masterplayer.xyz",75],["pussy-hub.com",75],["porndex.com",76],["compucalitv.com",77],["diariodenavarra.es",79],["duden.de",81],["pennlive.com",83],["beautypageants.indiatimes.com",84],["01fmovies.com",85],["lnk2.cc",87],["fullhdxxx.com",88],["luscious.net",[88,128]],["classicpornbest.com",88],["1youngteenporn.com",88],["www-daftarharga.blogspot.com",[88,169]],["miraculous.to",[88,175]],["vtube.to",88],["gosexpod.com",89],["otakukan.com",90],["xcafe.com",91],["pornfd.com",91],["venusarchives.com",91],["imagehaha.com",92],["imagenpic.com",92],["imageshimage.com",92],["imagetwist.com",92],["k1nk.co",93],["watchasians.cc",93],["alexsports.xyz",93],["lulustream.com",93],["luluvdo.com",93],["web.de",94],["news18.com",95],["thelanb.com",96],["dropmms.com",96],["softwaredescargas.com",97],["cracking-dz.com",98],["anitube.ninja",99],["gazzetta.it",100],["alliptvlinks.com",101],["waterfall.money",101],["port.hu",103],["dziennikbaltycki.pl",104],["dzienniklodzki.pl",104],["dziennikpolski24.pl",104],["dziennikzachodni.pl",104],["echodnia.eu",104],["expressbydgoski.pl",104],["expressilustrowany.pl",104],["gazetakrakowska.pl",104],["gazetalubuska.pl",104],["gazetawroclawska.pl",104],["gk24.pl",104],["gloswielkopolski.pl",104],["gol24.pl",104],["gp24.pl",104],["gra.pl",104],["gs24.pl",104],["kurierlubelski.pl",104],["motofakty.pl",104],["naszemiasto.pl",104],["nowiny24.pl",104],["nowosci.com.pl",104],["nto.pl",104],["polskatimes.pl",104],["pomorska.pl",104],["poranny.pl",104],["sportowy24.pl",104],["strefaagro.pl",104],["strefabiznesu.pl",104],["stronakobiet.pl",104],["telemagazyn.pl",104],["to.com.pl",104],["wspolczesna.pl",104],["course9x.com",104],["courseclub.me",104],["azrom.net",104],["alttyab.net",104],["esopress.com",104],["nesiaku.my.id",104],["onemanhua.com",105],["freeindianporn.mobi",105],["dr-farfar.com",106],["boyfriendtv.com",107],["brandstofprijzen.info",108],["netfuck.net",109],["blog24.me",[109,123]],["kisahdunia.com",109],["javsex.to",109],["nulljungle.com",109],["oyuncusoruyor.com",109],["pbarecap.ph",109],["sourds.net",109],["teknobalta.com",109],["tvinternetowa.info",109],["sqlserveregitimleri.com",109],["tutcourse.com",109],["readytechflip.com",109],["novinhastop.com",109],["warddogs.com",109],["dvdgayporn.com",109],["iimanga.com",109],["tinhocdongthap.com",109],["tremamnon.com",109],["423down.com",109],["brizzynovel.com",109],["jugomobile.com",109],["freecodezilla.net",109],["movieslegacy.com",109],["animekhor.xyz",109],["iconmonstr.com",109],["gay-tubes.cc",109],["rbxscripts.net",109],["comentariodetexto.com",109],["wordpredia.com",109],["livsavr.co",109],["allfaucet.xyz",[109,123]],["titbytz.tk",109],["replica-watch.info",109],["alludemycourses.com",109],["kayifamilytv.com",109],["iir.ai",110],["gameofporn.com",112],["qpython.club",113],["antifake-funko.fr",113],["e9china.net",114],["ac.ontools.net",114],["marketbeat.com",115],["hentaipornpics.net",116],["apps2app.com",117],["tubereader.me",118],["repretel.com",118],["dagensnytt.com",119],["mrproblogger.com",119],["themezon.net",119],["upshrink.com",120],["loaninsurehub.com",121],["fc-lc.xyz",122],["ohionowcast.info",123],["wiour.com",123],["bitzite.com",[123,126,127]],["appsbull.com",123],["diudemy.com",123],["maqal360.com",123],["bitcotasks.com",[123,238]],["videolyrics.in",123],["manofadan.com",123],["cempakajaya.com",123],["tagecoin.com",123],["doge25.in",123],["king-ptcs.com",123],["naijafav.top",123],["ourcoincash.xyz",123],["sh.techsamir.com",123],["claimcoins.site",123],["cryptosh.pro",123],["cryptoearnfaucet.com",123],["coinsrev.com",123],["go.freetrx.fun",123],["eftacrypto.com",123],["fescrypto.com",123],["earnhub.net",123],["kiddyshort.com",123],["tronxminer.com",123],["homeairquality.org",124],["exego.app",125],["cutlink.net",125],["cutsy.net",125],["cutyurls.com",125],["cutty.app",125],["aiimgvlog.fun",128],["6indianporn.com",128],["amateurebonypics.com",128],["amateuryoungpics.com",128],["cinemabg.net",128],["desimmshd.com",128],["frauporno.com",128],["givemeaporn.com",128],["jav-asia.top",128],["javf.net",128],["javideo.net",128],["kr18plus.com",128],["pilibook.com",128],["pornborne.com",128],["porngrey.com",128],["qqxnxx.com",128],["sexvideos.host",128],["submilf.com",128],["subtaboo.com",128],["tktube.com",128],["xfrenchies.com",128],["coingraph.us",129],["momo-net.com",129],["maxgaming.fi",129],["travel.vebma.com",130],["cloud.majalahhewan.com",130],["pinloker.com",130],["sekilastekno.com",130],["vulture.com",131],["megaplayer.bokracdn.run",132],["hentaistream.com",133],["siteunblocked.info",134],["larvelfaucet.com",135],["feyorra.top",135],["claimtrx.com",135],["moviesyug.net",136],["w4files.ws",136],["parispi.net",137],["simkl.com",138],["paperzonevn.com",139],["dailyvideoreports.net",140],["lewd.ninja",141],["systemnews24.com",142],["incestvidz.com",143],["niusdiario.es",144],["playporngames.com",145],["movi.pk",[146,151]],["justin.mp3quack.lol",148],["cutesexyteengirls.com",149],["asianembed.io",150],["0dramacool.net",151],["185.53.88.104",151],["185.53.88.204",151],["185.53.88.15",151],["123movies4k.net",151],["1movieshd.com",151],["1rowsports.com",151],["4share-mp3.net",151],["6movies.net",151],["9animetv.to",151],["720pstream.me",151],["aagmaal.com",151],["abysscdn.com",151],["adblockplustape.com",151],["ajkalerbarta.com",151],["akstream.xyz",151],["androidapks.biz",151],["androidsite.net",151],["animefenix.com",151],["animeonlinefree.org",151],["animesite.net",151],["animespank.com",151],["aniworld.to",151],["apkmody.io",151],["appsfree4u.com",151],["audioz.download",151],["bdnewszh.com",151],["beastlyprints.com",151],["bengalisite.com",151],["bestfullmoviesinhd.org",151],["betteranime.net",151],["blacktiesports.live",151],["buffsports.stream",151],["ch-play.com",151],["clickforhire.com",151],["cloudy.pk",151],["computercrack.com",151],["coolcast2.com",151],["crackedsoftware.biz",151],["crackfree.org",151],["cracksite.info",151],["cryptoblog24.info",151],["cuatrolatastv.blogspot.com",151],["cydiasources.net",151],["dirproxy.com",151],["dopebox.to",151],["downloadapk.info",151],["downloadapps.info",151],["downloadgames.info",151],["downloadmusic.info",151],["downloadsite.org",151],["downloadwella.com",151],["ebooksite.org",151],["educationtips213.blogspot.com",151],["egyup.live",151],["embed.meomeo.pw",151],["embed.scdn.to",151],["emulatorsite.com",151],["essaysharkwriting.club",151],["extrafreetv.com",151],["fakedetail.com",151],["fclecteur.com",151],["files.im",151],["flexyhit.com",151],["fmoviefree.net",151],["fmovies24.com",151],["footyhunter3.xyz",151],["freeflix.info",151],["freemoviesu4.com",151],["freeplayervideo.com",151],["freesoccer.net",151],["fseries.org",151],["gamefast.org",151],["gamesite.info",151],["gmanga.me",151],["gocast123.me",151],["gogohd.net",151],["gogoplay5.com",151],["gooplay.net",151],["gostreamon.net",151],["happy2hub.org",151],["harimanga.com",151],["healthnewsreel.com",151],["hexupload.net",151],["hinatasoul.com",151],["hindisite.net",151],["holymanga.net",151],["hxfile.co",151],["isosite.org",151],["iv-soft.com",151],["januflix.expert",151],["jewelry.com.my",151],["johnwardflighttraining.com",151],["kabarportal.com",151],["kstorymedia.com",151],["la123movies.org",151],["lespassionsdechinouk.com",151],["lilymanga.net",151],["linksdegrupos.com.br",151],["livestreamtv.pk",151],["macsite.info",151],["mangapt.com",151],["mangareader.to",151],["mangasite.org",151],["manhuascan.com",151],["megafilmeshdseries.com",151],["megamovies.org",151],["membed.net",151],["mgnetu.com",151],["moddroid.com",151],["moviefree2.com",151],["movies-watch.com.pk",151],["moviesite.app",151],["moviesonline.fm",151],["moviesx.org",151],["moviewatchonline.com.pk",151],["msmoviesbd.com",151],["musicsite.biz",151],["myfernweh.com",151],["myviid.com",151],["nazarickol.com",151],["newsrade.com",151],["noob4cast.com",151],["nsw2u.com",[151,239]],["oko.sh",151],["olympicstreams.me",151],["orangeink.pk",151],["owllink.net",151],["pahaplayers.click",151],["patchsite.net",151],["pdfsite.net",151],["play1002.com",151],["player-cdn.com",151],["productkeysite.com",151],["projectfreetv.one",151],["romsite.org",151],["rufiguta.com",151],["rytmp3.io",151],["send.cm",151],["seriesite.net",151],["seriezloaded.com.ng",151],["serijehaha.com",151],["shrugemojis.com",151],["siteapk.net",151],["siteflix.org",151],["sitegames.net",151],["sitekeys.net",151],["sitepdf.com",151],["sitetorrent.com",151],["softwaresite.net",151],["sportbar.live",151],["sportkart1.xyz",151],["ssyoutube.com",151],["stardima.com",151],["stream4free.live",151],["superapk.org",151],["supermovies.org",151],["tainio-mania.online",151],["talaba.su",151],["tamilguns.org",151],["tatabrada.tv",151],["theflixer.tv",151],["thememypc.net",151],["thetechzone.online",151],["thripy.com",151],["tonnestreamz.xyz",151],["travelplanspro.com",151],["turcasmania.com",151],["tusfiles.com",151],["tvonlinesports.com",151],["ultramovies.org",151],["uploadbank.com",151],["urdubolo.pk",151],["vidspeeds.com",151],["vumoo.to",151],["warezsite.net",151],["watchmovies2.com",151],["watchmoviesforfree.org",151],["watchofree.com",151],["watchsite.net",151],["watchsouthpark.tv",151],["watchtvch.club",151],["web.livecricket.is",151],["webseries.club",151],["worldcupstream.pm",151],["y2mate.com",151],["youapk.net",151],["youtube4kdownloader.com",151],["yts-subs.com",151],["haho.moe",152],["nicy-spicy.pw",153],["novelmultiverse.com",154],["mylegalporno.com",155],["thecut.com",158],["novelism.jp",159],["alphapolis.co.jp",160],["okrzone.com",161],["game3rb.com",162],["javhub.net",162],["thotvids.com",163],["berklee.edu",164],["rawkuma.com",[165,166]],["moviesjoyhd.to",166],["imeteo.sk",167],["youtubemp3donusturucu.net",168],["surfsees.com",170],["vivo.st",[171,172]],["alueviesti.fi",174],["kiuruvesilehti.fi",174],["lempaala.ideapark.fi",174],["olutposti.fi",174],["urjalansanomat.fi",174],["tainhanhvn.com",176],["titantv.com",177],["3cinfo.net",178],["transportationlies.org",179],["camarchive.tv",180],["crownimg.com",180],["freejav.guru",180],["hentai2read.com",180],["icyporno.com",180],["illink.net",180],["javtiful.com",180],["m-hentai.net",180],["pornblade.com",180],["pornfelix.com",180],["pornxxxxtube.net",180],["redwap.me",180],["redwap2.com",180],["redwap3.com",180],["tubxporn.xxx",180],["ver-comics-porno.com",180],["ver-mangas-porno.com",180],["xanimeporn.com",180],["xxxvideohd.net",180],["zetporn.com",180],["cocomanga.com",181],["mcleaks.net",182],["explorecams.com",182],["minecraft.buzz",182],["chillx.top",183],["playerx.stream",183],["m.liputan6.com",185],["stardewids.com",[185,207]],["ingles.com",186],["spanishdict.com",186],["rureka.com",187],["bunkr.is",188],["amateur8.com",189],["freeporn8.com",189],["maturetubehere.com",189],["embedo.co",190],["corriere.it",191],["oggi.it",191],["2the.space",192],["apkcombo.com",193],["sponsorhunter.com",194],["soft98.ir",195],["novelssites.com",196],["haxina.com",197],["cryptofenz.xyz",197],["torrentmac.net",198],["udvl.com",199],["moviezaddiction.icu",200],["dlpanda.com",201],["socialmediagirls.com",202],["einrichtungsbeispiele.de",203],["weadown.com",204],["molotov.tv",205],["freecoursesonline.me",206],["adelsfun.com",206],["advantien.com",206],["bailbondsfinder.com",206],["bigpiecreative.com",206],["childrenslibrarylady.com",206],["classifarms.com",206],["comtasq.ca",206],["crone.es",206],["ctrmarketingsolutions.com",206],["dropnudes.com",206],["ftuapps.dev",206],["genzsport.com",206],["ghscanner.com",206],["grsprotection.com",206],["gruporafa.com.br",206],["inmatefindcalifornia.com",206],["inmatesearchidaho.com",206],["itsonsitetv.com",206],["mfmfinancials.com",206],["myproplugins.com",206],["onehack.us",206],["ovester.com",206],["paste.bin.sx",206],["privatenudes.com",206],["renoconcrete.ca",206],["richieashbeck.com",206],["sat.technology",206],["short1ink.com",206],["stpm.co.uk",206],["wegotcookies.co",206],["mathcrave.com",206],["commands.gg",207],["smgplaza.com",208],["autosport.com",[209,210]],["motorsport.com",[209,210]],["freepik.com",211],["diyphotography.net",213],["bitchesgirls.com",214],["shopforex.online",215],["programmingeeksclub.com",217],["easymc.io",218],["diendancauduong.com",219],["parentcircle.com",220],["h-game18.xyz",221],["nopay.info",222],["wheelofgold.com",223],["shortlinks.tech",224],["davescomputertips.com",225],["skill4ltu.eu",227],["freepikdownloader.com",228],["freepasses.org",229],["iusedtobeaboss.com",230],["androidpolice.com",231],["cbr.com",231],["dualshockers.com",231],["gamerant.com",231],["thegamer.com",231],["blogtruyenmoi.com",232],["igay69.com",233],["graphicget.com",234],["qiwi.gg",235],["netcine2.la",236],["cbc.ca",237]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",8],["ganool",8],["pirate",8],["piratebay",8],["pirateproxy",8],["proxytpb",8],["thepiratebay",8],["limetorrents",[10,17]],["king-pes",10],["depedlps",10],["komikcast",10],["idedroidsafelink",10],["links-url",10],["eikaiwamastery",10],["ak4eg",10],["xhamster",11],["xhamster1",11],["xhamster5",11],["xhamster7",11],["rexporn",11],["movies07",11],["pornocomics",11],["streanplay",12],["steanplay",12],["liferayiseasy",[13,14]],["userupload",17],["pahe",17],["yts",17],["tube8",17],["topeuropix",17],["moviescounter",17],["torrent9",17],["desiremovies",17],["movs4u",17],["uwatchfree",17],["hydrax",17],["4movierulz",17],["projectfreetv",17],["arabseed",17],["btdb",[17,59]],["skymovieshd",17],["world4ufree",17],["streamsport",17],["rojadirectatvhd",17],["userload",17],["freecoursesonline",19],["lordpremium",19],["todovieneok",19],["novablogitalia",19],["anisubindo",19],["btvsports",19],["adyou",20],["fxporn69",23],["sexwebvideo",30],["pornomoll",30],["gsurl",33],["mimaletadepeliculas",34],["readcomiconline",35],["burningseries",36],["dz4soft",37],["yoututosjeff",37],["ebookmed",37],["lanjutkeun",37],["novelasesp",37],["singingdalong",37],["doujindesu",37],["xmovies8",40],["mega-dvdrip",47],["peliculas-dvdrip",47],["desbloqueador",48],["newpelis",[49,57]],["pelix",[49,57]],["allcalidad",[49,180]],["khatrimaza",49],["camwhores",51],["camwhorestv",51],["uproxy",51],["nekopoi",54],["mirrorace",63],["mixdrp",68],["asiansex",70],["japanfuck",70],["japanporn",70],["teensex",70],["vintagetube",70],["xxxmovies",70],["zooqle",74],["hdfull",78],["mangamanga",80],["streameast",82],["thestreameast",82],["vev",86],["vidop",86],["zone-telechargement",88],["megalink",93],["gmx",94],["mega1080p",99],["9hentai",102],["gaypornhdfree",109],["cinemakottaga",109],["privatemoviez",109],["apkmaven",109],["popcornstream",111],["pornktube",128],["watchseries",128],["milfnut",129],["pagalmovies",136],["7starhd",136],["jalshamoviez",136],["9xupload",136],["bdupload",136],["desiupload",136],["rdxhd1",136],["moviessources",147],["nuvid",148],["goload",[150,151]],["0gomovie",151],["0gomovies",151],["123moviefree",151],["1kmovies",151],["1madrasdub",151],["1primewire",151],["2embed",151],["2madrasdub",151],["2umovies",151],["4anime",151],["9xmovies",151],["altadefinizione01",151],["anitube",151],["atomixhq",151],["beinmatch",151],["brmovies",151],["cima4u",151],["clicknupload",151],["cmovies",151],["couchtuner",151],["cricfree",151],["crichd",151],["databasegdriveplayer",151],["dood",151],["f1stream",151],["faselhd",151],["fbstream",151],["file4go",151],["filemoon",151],["filepress",[151,212]],["filmlinks4u",151],["filmpertutti",151],["filmyzilla",151],["fmovies",151],["french-stream",151],["fsapi",151],["fzlink",151],["gdriveplayer",151],["gofilms4u",151],["gogoanime",151],["gomoviefree",151],["gomoviz",151],["gowatchseries",151],["hdmoviefair",151],["hdmovies4u",151],["hdmovies50",151],["hdmoviesfair",151],["hh3dhay",151],["hindilinks4u",151],["hotmasti",151],["hurawatch",151],["klmanga",151],["klubsports",151],["libertestreamvf",151],["livetvon",151],["manga1000",151],["manga1001",151],["mangaraw",151],["mangarawjp",151],["mlbstream",151],["motogpstream",151],["movierulz",151],["movies123",151],["movies2watch",151],["moviesden",151],["moviezaddiction",151],["myflixer",151],["nbastream",151],["netcine",151],["nflstream",151],["nhlstream",151],["onlinewatchmoviespk",151],["pctfenix",151],["pctnew",151],["pksmovies",151],["plyjam",151],["plylive",151],["pogolinks",151],["popcorntime",151],["poscitech",151],["prmovies",151],["rugbystreams",151],["shahed4u",151],["sflix",151],["sitesunblocked",151],["socceronline",151],["solarmovies",151],["sportcast",151],["sportskart",151],["sports-stream",151],["streaming-french",151],["streamers",151],["streamingcommunity",151],["strikeout",151],["t20cup",151],["tennisstreams",151],["torrentdosfilmes",151],["toonanime",151],["tvply",151],["ufcstream",151],["uptomega",151],["uqload",151],["vudeo",151],["vidoo",151],["vipbox",151],["vipboxtv",151],["vipleague",151],["viprow",151],["yesmovies",151],["yomovies",151],["yomovies1",151],["yt2mp3s",151],["kat",151],["katbay",151],["kickass",151],["kickasshydra",151],["kickasskat",151],["kickass2",151],["kickasstorrents",151],["kat2",151],["kattracker",151],["thekat",151],["thekickass",151],["kickassz",151],["kickasstorrents2",151],["topkickass",151],["kickassgo",151],["kkickass",151],["kkat",151],["kickasst",151],["kick4ss",151],["guardaserie",156],["cine-calidad",157],["videovard",173],["gntai",180],["grantorrent",180],["mejortorrent",180],["mejortorrento",180],["mejortorrents",180],["mejortorrents1",180],["mejortorrentt",180],["bg-gledai",206],["gledaitv",206],["shineads",216],["motchill",226]]);

const exceptionsMap = new Map([["mentor.duden.de",[81]],["forum.soft98.ir",[195]]]);

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-addEventListener', type, pattern);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const debug = shouldDebug(extraArgs);
    const targetSelector = extraArgs.elements || undefined;
    const shouldPrevent = (thisArg, type, handler) => {
        if ( targetSelector !== undefined ) {
            const elems = Array.from(document.querySelectorAll(targetSelector));
            if ( elems.includes(thisArg) === false ) { return false; }
        }
        const matchesType = safe.RegExp_test.call(reType, type);
        const matchesHandler = safe.RegExp_test.call(rePattern, handler);
        const matchesEither = matchesType || matchesHandler;
        const matchesBoth = matchesType && matchesHandler;
        if ( debug === 1 && matchesBoth || debug === 2 && matchesEither ) {
            debugger; // jshint ignore:line
        }
        return matchesBoth;
    };
    const trapEddEventListeners = ( ) => {
        const eventListenerHandler = {
            apply: function(target, thisArg, args) {
                let t, h;
                try {
                    t = String(args[0]);
                    h = args[1] instanceof Function
                        ? String(safe.Function_toString(args[1]))
                        : String(args[1]);
                } catch(ex) {
                }
                if ( type === '' && pattern === '' ) {
                    safe.uboLog(logPrefix, `Called: ${t}\n${h}`);
                } else if ( shouldPrevent(thisArg, t, h) ) {
                    return safe.uboLog(logPrefix, `Prevented: ${t}\n${h}`);
                }
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
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
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
            return this.Object_fromEntries(entries);
        },
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
    let bcBuffer = [];
    safe.logLevel = scriptletGlobals.logLevel || 1;
    safe.sendToLogger = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
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
    return safe;
}

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
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
