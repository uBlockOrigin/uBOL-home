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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["load","adBlock"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","pop"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["","popMagic"],["getexoloader"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["click","popMagic"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["","click"],["canplay"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["blur","focusOut"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","htmls"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["/error|load/","/onerror|showModal/"],["load","doTest"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["click","openSite"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["contextmenu"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["DOMContentLoaded","disableDeveloperTools"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["DOMContentLoaded","iframe"],["DOMContentLoaded","handler"],["","loadScripts"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["","[native code]"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["load","length"],["gtmloaderror"],["DOMContentLoaded","canRunAds"],["mouseup","_blank"],["click","adobeModalTestABenabled"],["blur","console.log"],["blur","counter"],["","AdB"],["load","adSession"],["load","Ads"],["load","goog"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["DOMContentLoaded","adsbygoogle"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["click","alink"],["/adblock/i"],["","/_blank/i"],["","daadb"],["click","handleClick"],["load","google-analytics"],["","sessionStorage"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["bild.de",5],["mediafire.com",[6,7]],["pinsystem.co.uk",8],["fembed.com",8],["ancensored.com",8],["o2tvseries.com",8],["mp3fiber.com",[8,19]],["xrivonet.info",8],["afreesms.com",9],["tio.ch",9],["lavanguardia.com",9],["eplayer.click",9],["kingofdown.com",10],["radiotormentamx.com",10],["quelleestladifference.fr",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["sna3talaflam.com",10],["agar.pro",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["interviewgig.com",10],["javaguides.net",10],["almohtarif-tech.net",10],["hl-live.de",10],["forum.release-apk.com",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["primedeportes.es",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["secretsdeepweb.blogspot.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["urdulibrarypk.blogspot.com",10],["zerotopay.com",10],["akw.to",10],["mawsueaa.com",10],["hesgoal-live.io",10],["king-shoot.io",10],["pornhd.com",11],["cnnamador.com",[11,39]],["cle0desktop.blogspot.com",11],["turkanime.co",11],["camclips.tv",[11,52]],["blackpornhq.com",11],["xsexpics.com",11],["ulsex.net",11],["wannafreeporn.com",11],["ytube2dl.com",11],["multiup.us",11],["protege-torrent.com",11],["bibme.org",15],["citationmachine.net",15],["easybib.com",16],["userupload.net",17],["vermangasporno.com",17],["imgtorrnt.in",17],["picbaron.com",[17,25]],["worldcupfootball.me",17],["letmejerk.com",17],["letmejerk3.com",17],["letmejerk4.com",17],["letmejerk5.com",17],["letmejerk6.com",17],["letmejerk7.com",17],["dlapk4all.com",17],["kropic.com",17],["kvador.com",17],["pdfindir.net",17],["brstej.com",17],["topwwnews.com",17],["xsanime.com",17],["vidlo.us",17],["put-locker.com",17],["youx.xxx",17],["animeindo.asia",17],["masahub.net",17],["adclickersbot.com",17],["badtaste.it",18],["mage.si",19],["totaldebrid.org",19],["hesgoal.com",19],["neko-miku.com",19],["elsfile.org",19],["venstrike.jimdofree.com",19],["schrauben-normen.de",19],["avengerinator.blogspot.com",19],["link-to.net",19],["hanimesubth.com",19],["gsmturkey.net",19],["adshrink.it",19],["presentation-ppt.com",19],["mangacanblog.com",19],["pekalongan-cits.blogspot.com",19],["4tymode.win",19],["reifenrechner.at",19],["tire-size-calculator.info",19],["kord-jadul.com",19],["linuxsecurity.com",19],["encodinghub.com",19],["readyssh.net",19],["itsguider.com",19],["cotravinh.blogspot.com",19],["itudong.com",19],["shortx.net",19],["comandotorrenthd.org",19],["turkdebrid.net",19],["linkvertise.com",19],["lecturel.com",19],["bakai.org",19],["nar.k-ba.net",19],["tiroalpalo.org",19],["gotporn.com",21],["freepornrocks.com",21],["tvhai.org",21],["simpcity.su",21],["realgfporn.com",[22,23]],["titsbox.com",22],["thisvid.com",23],["xvideos-downloader.net",23],["imgspice.com",24],["luscious.net",[25,90]],["6indianporn.com",25],["amateurebonypics.com",25],["amateuryoungpics.com",25],["cinemabg.net",25],["desimmshd.com",25],["givemeaporn.com",25],["jav-asia.top",25],["javf.net",25],["javideo.net",25],["kr18plus.com",25],["pilibook.com",25],["pornborne.com",25],["porngrey.com",25],["submilf.com",25],["subtaboo.com",25],["tktube.com",25],["xfrenchies.com",25],["frauporno.com",25],["qqxnxx.com",25],["sexvideos.host",25],["aiimgvlog.fun",25],["vikiporn.com",26],["tnaflix.com",26],["hentai2w.com",[26,33]],["yourlust.com",26],["hotpornfile.org",26],["jav789.com",26],["javbuz.com",26],["letfap.com",26],["watchfreexxx.net",26],["vintageporntubes.com",26],["angelgals.com",26],["babesexy.com",26],["porndaa.com",26],["ganstamovies.com",26],["youngleak.com",26],["porndollz.com",26],["xnxxvideo.pro",26],["xvideosxporn.com",26],["onlyhgames.com",26],["filmpornofrancais.fr",26],["pictoa.com",[26,50]],["javout.co",26],["adultasianporn.com",26],["nsfwmonster.com",26],["girlsofdesire.org",26],["gaytail.com",26],["fetish-bb.com",26],["rumporn.com",26],["soyoungteens.com",26],["zubby.com",26],["lesbian8.com",26],["gayforfans.com",26],["reifporn.de",26],["javtsunami.com",26],["18tube.sex",26],["xxxextreme.org",26],["amateurs-fuck.com",26],["sex-amateur-clips.com",26],["hentaiworld.tv",26],["dads-banging-teens.com",26],["home-xxx-videos.com",26],["mature-chicks.com",26],["teens-fucking-matures.com",26],["hqbang.com",26],["darknessporn.com",26],["familyporner.com",26],["freepublicporn.com",26],["pisshamster.com",26],["punishworld.com",26],["xanimu.com",26],["pussyspace.com",[27,28]],["pussyspace.net",[27,28]],["empflix.com",29],["cpmlink.net",30],["bdsmstreak.com",30],["cutpaid.com",30],["pornforrelax.com",30],["fatwhitebutt.com",30],["mavplay.xyz",30],["sunporno.com",[31,32,33]],["hentai2read.com",33],["pornblade.com",33],["pornfelix.com",33],["xanimeporn.com",33],["javtiful.com",33],["camarchive.tv",33],["ver-comics-porno.com",33],["ver-mangas-porno.com",33],["illink.net",33],["tubxporn.xxx",33],["m-hentai.net",33],["icyporno.com",33],["redwap.me",33],["redwap2.com",33],["redwap3.com",33],["freejav.guru",33],["pornxxxxtube.net",33],["zetporn.com",33],["crownimg.com",33],["xxxvideohd.net",33],["short.pe",34],["bs.to",37],["efukt.com",37],["kpopsea.com",37],["generacionretro.net",38],["nuevos-mu.ucoz.com",38],["micloudfiles.com",38],["mimaletamusical.blogspot.com",38],["visionias.net",38],["b3infoarena.in",38],["lurdchinexgist.blogspot.com",38],["thefreedommatrix.blogspot.com",38],["hentai-vl.blogspot.com",38],["projetomotog.blogspot.com",38],["ktmx.pro",38],["lirik3satu.blogspot.com",38],["marketmovers.it",38],["pharmaguideline.com",38],["safemaru.blogspot.com",38],["mixloads.com",38],["mangaromance.eu",38],["interssh.com",38],["freesoftpdfdownload.blogspot.com",38],["cirokun.blogspot.com",38],["myadslink.com",38],["blackavelic.com",38],["server.satunivers.tv",38],["eg-akw.com",38],["xn--mgba7fjn.cc",38],["flashingjungle.com",39],["ma-x.org",40],["lavozdegalicia.es",40],["xmovies08.org",42],["globaldjmix.com",43],["zazzybabes.com",44],["haaretz.co.il",45],["haaretz.com",45],["slate.com",46],["megalinks.info",47],["megapastes.com",47],["mega-mkv.com",[47,48]],["mkv-pastes.com",47],["zpaste.net",47],["zlpaste.net",47],["9xlinks.site",47],["zona-leros.net",48],["acortarm.xyz",49],["acortame.xyz",49],["cine.to",[50,182]],["hdstreamss.club",50],["kissasia.cc",50],["nzbstars.com",51],["digjav.com",52],["videoszoofiliahd.com",53],["xxxtubezoo.com",54],["zooredtube.com",54],["megacams.me",56],["rlslog.net",56],["porndoe.com",57],["acienciasgalilei.com",59],["playrust.io",60],["payskip.org",61],["short-url.link",62],["tubedupe.com",63],["fatgirlskinny.net",65],["polska-ie.com",65],["windowsmatters.com",65],["canaltdt.es",66],["masbrooo.com",66],["2ndrun.tv",66],["camclips.cc",[67,68]],["stfly.me",69],["oncehelp.com",69],["queenfaucet.website",69],["curto.win",69],["smallseotools.com",70],["macwelt.de",72],["pcwelt.de",72],["capital.de",72],["geo.de",72],["allmomsex.com",73],["allnewindianporn.com",73],["analxxxvideo.com",73],["animalextremesex.com",73],["anime3d.xyz",73],["animefuckmovies.com",73],["animepornfilm.com",73],["animesexbar.com",73],["animesexclip.com",73],["animexxxsex.com",73],["animexxxfilms.com",73],["anysex.club",73],["apetube.asia",73],["asianfuckmovies.com",73],["asianfucktube.com",73],["asianporn.sexy",73],["asiansexcilps.com",73],["beeg.fund",73],["beegvideoz.com",73],["bestasiansex.pro",73],["bigsexhub.com",73],["bravotube.asia",73],["brutalanimalsfuck.com",73],["candyteenporn.com",73],["daddyfuckmovies.com",73],["desifuckonline.com",73],["exclusiveasianporn.com",73],["exteenporn.com",73],["fantasticporn.net",73],["fantasticyoungporn.com",73],["fineasiansex.com",73],["firstasianpussy.com",73],["freeindiansextube.com",73],["freepornasians.com",73],["freerealvideo.com",73],["fuck-beeg.com",73],["fuck-xnxx.com",73],["fuckasian.pro",73],["fuckfuq.com",73],["fuckundies.com",73],["fullasiantube.com",73],["gojapaneseporn.com",73],["golderotica.com",73],["goodyoungsex.com",73],["goyoungporn.com",73],["hardxxxmoms.com",73],["hdvintagetube.com",73],["hentaiporn.me",73],["hentaisexfilms.com",73],["hentaisexuality.com",73],["hot-teens-movies.mobi",73],["hotanimepornvideos.com",73],["hotanimevideos.com",73],["hotasianpussysex.com",73],["hotjapaneseshows.com",73],["hotmaturetube.com",73],["hotmilfs.pro",73],["hotorientalporn.com",73],["hotpornsexvideos.com",73],["hotpornyoung.com",73],["hotxxxjapanese.com",73],["hotxxxpussy.com",73],["indiafree.net",73],["indianpornvideo.online",73],["japanpornclip.com",73],["japanesetube.video",73],["japansex.me",73],["japanesexxxporn.com",73],["japansporno.com",73],["japanxxx.asia",73],["japanxxxworld.com",73],["keezmovies.surf",73],["lingeriefuckvideo.com",73],["liveanimalporn.zooo.club",73],["madhentaitube.com",73],["megahentaitube.com",73],["megajapanesesex.com",73],["megajapantube.com",73],["milfxxxpussy.com",73],["momsextube.pro",73],["momxxxass.com",73],["monkeyanimalporn.com",73],["moviexxx.mobi",73],["newanimeporn.com",73],["newjapanesexxx.com",73],["nicematureporn.com",73],["nudeplayboygirls.com",73],["openxxxporn.com",73],["originalindianporn.com",73],["originalteentube.com",73],["pig-fuck.com",73],["plainasianporn.com",73],["popularasianxxx.com",73],["pornanimetube.com",73],["pornasians.pro",73],["pornhat.asia",73],["pornheed.online",73],["pornjapanesesex.com",73],["pornomovies.asia",73],["pornvintage.tv",73],["primeanimesex.com",73],["realjapansex.com",73],["realmomsex.com",73],["redsexhub.com",73],["retroporn.world",73],["retrosexfilms.com",73],["sex-free-movies.com",73],["sexanimesex.com",73],["sexanimetube.com",73],["sexjapantube.com",73],["sexmomvideos.com",73],["sexteenxxxtube.com",73],["sexxxanimal.com",73],["sexyoungtube.com",73],["sexyvintageporn.com",73],["sopornmovies.com",73],["spicyvintageporn.com",73],["sunporno.club",73],["tabooanime.club",73],["teenextrem.com",73],["teenfucksex.com",73],["teenhost.net",73],["teensexass.com",73],["tnaflix.asia",73],["totalfuckmovies.com",73],["totalmaturefuck.com",73],["txxx.asia",73],["voyeurpornsex.com",73],["warmteensex.com",73],["wetasiancreampie.com",73],["wildhentaitube.com",73],["wowyoungsex.com",73],["xhamster-art.com",73],["xmovie.pro",73],["xnudevideos.com",73],["xnxxjapon.com",73],["xpics.me",73],["xvide.me",73],["xxxanimefuck.com",73],["xxxanimevideos.com",73],["xxxanimemovies.com",73],["xxxhentaimovies.com",73],["xxxhothub.com",73],["xxxjapaneseporntube.com",73],["xxxlargeporn.com",73],["xxxmomz.com",73],["xxxpornmilf.com",73],["xxxpussyclips.com",73],["xxxpussysextube.com",73],["xxxretrofuck.com",73],["xxxsex.pro",73],["xxxsexyjapanese.com",73],["xxxteenyporn.com",73],["xxxvideo.asia",73],["xxxvideos.ink",73],["xxxyoungtv.com",73],["youjizzz.club",73],["youngpussyfuck.com",73],["bayimg.com",74],["celeb.gate.cc",75],["eodev.com",76],["masterplayer.xyz",78],["pussy-hub.com",78],["porndex.com",79],["compucalitv.com",80],["duden.de",83],["pennlive.com",85],["beautypageants.indiatimes.com",86],["01fmovies.com",87],["lnk2.cc",89],["fullhdxxx.com",90],["classicpornbest.com",90],["1youngteenporn.com",90],["www-daftarharga.blogspot.com",[90,164]],["miraculous.to",[90,171]],["vtube.to",90],["gosexpod.com",91],["tubepornclassic.com",92],["shemalez.com",92],["otakukan.com",93],["xcafe.com",94],["pornfd.com",94],["venusarchives.com",94],["imagehaha.com",95],["imagenpic.com",95],["imageshimage.com",95],["imagetwist.com",95],["deusasporno.com.br",96],["sambaporno2.com",96],["sexoamador.blog.br",96],["videospornozinhos.com",96],["videosexoquente.com",96],["xvideosf.com",96],["k1nk.co",96],["watchasians.cc",96],["alexsports.xyz",96],["lulustream.com",96],["luluvdo.com",96],["web.de",97],["news18.com",98],["thelanb.com",99],["dropmms.com",99],["softwaredescargas.com",100],["cracking-dz.com",101],["anitube.ninja",102],["gazzetta.it",103],["alliptvlinks.com",104],["waterfall.money",104],["port.hu",106],["dziennikbaltycki.pl",107],["dzienniklodzki.pl",107],["dziennikpolski24.pl",107],["dziennikzachodni.pl",107],["echodnia.eu",107],["expressbydgoski.pl",107],["expressilustrowany.pl",107],["gazetakrakowska.pl",107],["gazetalubuska.pl",107],["gazetawroclawska.pl",107],["gk24.pl",107],["gloswielkopolski.pl",107],["gol24.pl",107],["gp24.pl",107],["gra.pl",107],["gs24.pl",107],["kurierlubelski.pl",107],["motofakty.pl",107],["naszemiasto.pl",107],["nowiny24.pl",107],["nowosci.com.pl",107],["nto.pl",107],["polskatimes.pl",107],["pomorska.pl",107],["poranny.pl",107],["sportowy24.pl",107],["strefaagro.pl",107],["strefabiznesu.pl",107],["stronakobiet.pl",107],["telemagazyn.pl",107],["to.com.pl",107],["wspolczesna.pl",107],["course9x.com",107],["courseclub.me",107],["azrom.net",107],["alttyab.net",107],["esopress.com",107],["nesiaku.my.id",107],["onemanhua.com",108],["freeindianporn.mobi",108],["dr-farfar.com",109],["boyfriendtv.com",110],["brandstofprijzen.info",111],["netfuck.net",112],["kisahdunia.com",112],["javsex.to",112],["nulljungle.com",112],["oyuncusoruyor.com",112],["pbarecap.ph",112],["sourds.net",112],["teknobalta.com",112],["tvinternetowa.info",112],["sqlserveregitimleri.com",112],["tutcourse.com",112],["readytechflip.com",112],["novinhastop.com",112],["warddogs.com",112],["dvdgayporn.com",112],["iimanga.com",112],["tinhocdongthap.com",112],["tremamnon.com",112],["freedownloadvideo.net",112],["423down.com",112],["brizzynovel.com",112],["jugomobile.com",112],["freecodezilla.net",112],["movieslegacy.com",112],["animekhor.xyz",112],["iconmonstr.com",112],["gay-tubes.cc",112],["rbxscripts.net",112],["comentariodetexto.com",112],["wordpredia.com",112],["livsavr.co",112],["allfaucet.xyz",[112,122]],["replica-watch.info",112],["alludemycourses.com",112],["kayifamilytv.com",112],["blog24.me",[112,122]],["iir.ai",113],["gameofporn.com",115],["homeairquality.org",116],["qpython.club",117],["antifake-funko.fr",117],["e9china.net",118],["ac.ontools.net",118],["marketbeat.com",119],["hentaipornpics.net",120],["apps2app.com",121],["ohionowcast.info",122],["wiour.com",122],["carsmania.net",122],["carstopia.net",122],["coinsvalue.net",122],["cookinguide.net",122],["freeoseocheck.com",122],["makeupguide.net",122],["coinscap.info",122],["cryptowidgets.net",122],["greenenez.com",122],["insurancegold.in",122],["webfreetools.net",122],["wiki-topia.com",122],["bitcotasks.com",122],["videolyrics.in",122],["manofadan.com",122],["cempakajaya.com",122],["tagecoin.com",122],["doge25.in",122],["king-ptcs.com",122],["naijafav.top",122],["ourcoincash.xyz",122],["sh.techsamir.com",122],["claimcoins.site",122],["cryptosh.pro",122],["cryptoearnfaucet.com",122],["coinsrev.com",122],["go.freetrx.fun",122],["bitzite.com",122],["eftacrypto.com",122],["fescrypto.com",122],["appsbull.com",122],["diudemy.com",122],["maqal360.com",122],["earnhub.net",122],["kiddyshort.com",122],["tronxminer.com",122],["vulture.com",123],["megaplayer.bokracdn.run",124],["hentaistream.com",125],["siteunblocked.info",126],["larvelfaucet.com",127],["feyorra.top",127],["claimtrx.com",127],["moviesyug.net",128],["w4files.ws",128],["parispi.net",129],["simkl.com",130],["sayrodigital.com",131],["mrproblogger.com",132],["themezon.net",132],["paperzonevn.com",133],["dailyvideoreports.net",134],["lewd.ninja",135],["systemnews24.com",136],["incestvidz.com",137],["niusdiario.es",138],["playporngames.com",139],["movi.pk",[140,145]],["justin.mp3quack.lol",142],["cutesexyteengirls.com",143],["asianembed.io",144],["0dramacool.net",145],["185.53.88.104",145],["185.53.88.204",145],["185.53.88.15",145],["123movies4k.net",145],["1movieshd.com",145],["1rowsports.com",145],["4share-mp3.net",145],["6movies.net",145],["9animetv.to",145],["720pstream.me",145],["abysscdn.com",145],["adblockplustape.com",145],["ajkalerbarta.com",145],["akstream.xyz",145],["androidapks.biz",145],["androidsite.net",145],["animefenix.com",145],["animeonlinefree.org",145],["animesite.net",145],["animespank.com",145],["aniworld.to",145],["apkmody.io",145],["appsfree4u.com",145],["audioz.download",145],["bdnewszh.com",145],["beastlyprints.com",145],["bengalisite.com",145],["bestfullmoviesinhd.org",145],["betteranime.net",145],["blacktiesports.live",145],["buffsports.stream",145],["ch-play.com",145],["clickforhire.com",145],["cloudy.pk",145],["computercrack.com",145],["coolcast2.com",145],["crackedsoftware.biz",145],["crackfree.org",145],["cracksite.info",145],["cryptoblog24.info",145],["cuatrolatastv.blogspot.com",145],["cydiasources.net",145],["dirproxy.com",145],["dopebox.to",145],["downloadapk.info",145],["downloadapps.info",145],["downloadgames.info",145],["downloadmusic.info",145],["downloadsite.org",145],["downloadwella.com",145],["ebooksite.org",145],["educationtips213.blogspot.com",145],["egyup.live",145],["embed.meomeo.pw",145],["embed.scdn.to",145],["emulatorsite.com",145],["essaysharkwriting.club",145],["extrafreetv.com",145],["fakedetail.com",145],["fclecteur.com",145],["files.im",145],["flexyhit.com",145],["fmoviefree.net",145],["fmovies24.com",145],["footyhunter3.xyz",145],["freeflix.info",145],["freemoviesu4.com",145],["freeplayervideo.com",145],["freesoccer.net",145],["fseries.org",145],["gamefast.org",145],["gamesite.info",145],["gmanga.me",145],["gocast123.me",145],["gogohd.net",145],["gogoplay5.com",145],["gooplay.net",145],["gostreamon.net",145],["happy2hub.org",145],["harimanga.com",145],["healthnewsreel.com",145],["hexupload.net",145],["hinatasoul.com",145],["hindisite.net",145],["holymanga.net",145],["hxfile.co",145],["isosite.org",145],["iv-soft.com",145],["januflix.expert",145],["jewelry.com.my",145],["johnwardflighttraining.com",145],["kabarportal.com",145],["kstorymedia.com",145],["la123movies.org",145],["lespassionsdechinouk.com",145],["lilymanga.net",145],["linksdegrupos.com.br",145],["livestreamtv.pk",145],["macsite.info",145],["mangapt.com",145],["mangareader.to",145],["mangasite.org",145],["manhuascan.com",145],["megafilmeshdseries.com",145],["megamovies.org",145],["membed.net",145],["mgnetu.com",145],["moddroid.com",145],["moviefree2.com",145],["movies-watch.com.pk",145],["moviesite.app",145],["moviesonline.fm",145],["moviesx.org",145],["moviewatchonline.com.pk",145],["msmoviesbd.com",145],["musicsite.biz",145],["myfernweh.com",145],["myviid.com",145],["nazarickol.com",145],["newsrade.com",145],["noob4cast.com",145],["nsw2u.com",[145,241]],["oko.sh",145],["olympicstreams.me",145],["orangeink.pk",145],["owllink.net",145],["pahaplayers.click",145],["patchsite.net",145],["pdfsite.net",145],["play1002.com",145],["player-cdn.com",145],["productkeysite.com",145],["projectfreetv.one",145],["romsite.org",145],["rufiguta.com",145],["rytmp3.io",145],["send.cm",145],["seriesite.net",145],["seriezloaded.com.ng",145],["serijehaha.com",145],["shrugemojis.com",145],["siteapk.net",145],["siteflix.org",145],["sitegames.net",145],["sitekeys.net",145],["sitepdf.com",145],["sitetorrent.com",145],["softwaresite.net",145],["sportbar.live",145],["sportkart1.xyz",145],["ssyoutube.com",145],["stardima.com",145],["stream4free.live",145],["superapk.org",145],["supermovies.org",145],["tainio-mania.online",145],["talaba.su",145],["tamilguns.org",145],["tatabrada.tv",145],["theflixer.tv",145],["thememypc.net",145],["thetechzone.online",145],["thripy.com",145],["tonnestreamz.xyz",145],["travelplanspro.com",145],["turcasmania.com",145],["tusfiles.com",145],["tvonlinesports.com",145],["ultramovies.org",145],["uploadbank.com",145],["urdubolo.pk",145],["vidspeeds.com",145],["vumoo.to",145],["warezsite.net",145],["watchmovies2.com",145],["watchmoviesforfree.org",145],["watchofree.com",145],["watchsite.net",145],["watchsouthpark.tv",145],["watchtvch.club",145],["web.livecricket.is",145],["webseries.club",145],["worldcupstream.pm",145],["y2mate.com",145],["youapk.net",145],["youtube4kdownloader.com",145],["yts-subs.com",145],["haho.moe",146],["nicy-spicy.pw",147],["fap-guru.cam",148],["novelmultiverse.com",149],["mylegalporno.com",150],["thecut.com",153],["novelism.jp",154],["alphapolis.co.jp",155],["okrzone.com",156],["momo-net.com",157],["maxgaming.fi",157],["game3rb.com",158],["javhub.net",158],["thotvids.com",159],["berklee.edu",160],["rawkuma.com",161],["imeteo.sk",162],["youtubemp3donusturucu.net",163],["surfsees.com",165],["vivo.st",[166,167]],["alueviesti.fi",169],["kiuruvesilehti.fi",169],["lempaala.ideapark.fi",169],["olutposti.fi",169],["urjalansanomat.fi",169],["joyhints.com",170],["tainhanhvn.com",172],["titantv.com",173],["3cinfo.net",174],["transportationlies.org",175],["upshrink.com",176],["cocomanga.com",179],["mcleaks.net",180],["explorecams.com",180],["minecraft.buzz",180],["chillx.top",181],["playerx.stream",181],["m.liputan6.com",183],["stardewids.com",[183,205]],["ingles.com",184],["spanishdict.com",184],["rureka.com",185],["bunkr.is",186],["amateur8.com",187],["freeporn8.com",187],["maturetubehere.com",187],["embedo.co",188],["corriere.it",189],["oggi.it",189],["2the.space",190],["apkcombo.com",192],["sponsorhunter.com",193],["soft98.ir",194],["novelssites.com",195],["haxina.com",196],["cryptofenz.xyz",196],["torrentmac.net",197],["moviezaddiction.icu",198],["dlpanda.com",199],["socialmediagirls.com",200],["einrichtungsbeispiele.de",201],["weadown.com",202],["molotov.tv",203],["freecoursesonline.me",204],["adelsfun.com",204],["advantien.com",204],["bailbondsfinder.com",204],["bigpiecreative.com",204],["childrenslibrarylady.com",204],["classifarms.com",204],["dropnudes.com",204],["ftuapps.dev",204],["genzsport.com",204],["ghscanner.com",204],["gruporafa.com.br",204],["inmatefindcalifornia.com",204],["inmatesearchidaho.com",204],["itsonsitetv.com",204],["onehack.us",204],["ovester.com",204],["paste.bin.sx",204],["privatenudes.com",204],["renoconcrete.ca",204],["richieashbeck.com",204],["sat.technology",204],["short1ink.com",204],["mathcrave.com",204],["commands.gg",205],["smgplaza.com",206],["autosport.com",[207,208]],["motorsport.com",[207,208]],["bravedown.com",209],["loaninsurehub.com",210],["freepik.com",211],["pinloker.com",213],["sekilastekno.com",213],["diyphotography.net",214],["bitchesgirls.com",215],["shopforex.online",216],["yesmangas1.com",217],["programmingeeksclub.com",218],["easymc.io",219],["diendancauduong.com",220],["parentcircle.com",221],["h-game18.xyz",222],["nopay.info",223],["wheelofgold.com",224],["shortlinks.tech",225],["recipahi.com",226],["davescomputertips.com",227],["skill4ltu.eu",229],["freepikdownloader.com",230],["freepasses.org",231],["iusedtobeaboss.com",232],["blogtruyenmoi.com",233],["repretel.com",234],["fc-lc.xyz",235],["igay69.com",236],["cutlink.net",237],["cutsy.net",237],["cutyurls.com",237],["cutty.app",237],["graphicget.com",238],["qiwi.gg",239],["cbc.ca",240]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",8],["ganool",8],["pirate",8],["piratebay",8],["pirateproxy",8],["proxytpb",8],["thepiratebay",8],["limetorrents",[10,17]],["king-pes",10],["depedlps",10],["komikcast",10],["idedroidsafelink",10],["links-url",10],["eikaiwamastery",10],["ak4eg",10],["xhamster",11],["xhamster1",11],["xhamster5",11],["xhamster7",11],["rexporn",11],["movies07",11],["pornocomics",11],["streanplay",12],["steanplay",12],["liferayiseasy",[13,14]],["pahe",17],["yts",17],["tube8",17],["topeuropix",17],["moviescounter",17],["torrent9",17],["desiremovies",17],["movs4u",17],["uwatchfree",17],["hydrax",17],["4movierulz",17],["projectfreetv",17],["arabseed",17],["btdb",[17,60]],["skymovieshd",17],["world4ufree",17],["streamsport",17],["rojadirectatvhd",17],["userload",17],["freecoursesonline",19],["lordpremium",19],["todovieneok",19],["novablogitalia",19],["anisubindo",19],["btvsports",19],["adyou",20],["fxporn69",22],["watchseries",25],["pornktube",25],["sexwebvideo",30],["pornomoll",30],["mejortorrent",33],["mejortorrento",33],["mejortorrents",33],["mejortorrents1",33],["mejortorrentt",33],["grantorrent",33],["gntai",33],["allcalidad",[33,50]],["gsurl",34],["mimaletadepeliculas",35],["readcomiconline",36],["burningseries",37],["dz4soft",38],["yoututosjeff",38],["ebookmed",38],["lanjutkeun",38],["novelasesp",38],["singingdalong",38],["doujindesu",38],["xmovies8",41],["mega-dvdrip",48],["peliculas-dvdrip",48],["desbloqueador",49],["newpelis",[50,58]],["pelix",[50,58]],["khatrimaza",50],["camwhores",52],["camwhorestv",52],["uproxy",52],["nekopoi",55],["mirrorace",64],["mixdrp",71],["asiansex",73],["japanfuck",73],["japanporn",73],["teensex",73],["vintagetube",73],["xxxmovies",73],["zooqle",77],["hdfull",81],["mangamanga",82],["streameast",84],["thestreameast",84],["vev",88],["vidop",88],["zone-telechargement",90],["megalink",96],["gmx",97],["mega1080p",102],["9hentai",105],["gaypornhdfree",112],["cinemakottaga",112],["privatemoviez",112],["apkmaven",112],["popcornstream",114],["pagalmovies",128],["7starhd",128],["jalshamoviez",128],["9xupload",128],["bdupload",128],["desiupload",128],["rdxhd1",128],["moviessources",141],["nuvid",142],["goload",[144,145]],["0gomovie",145],["0gomovies",145],["123moviefree",145],["1kmovies",145],["1madrasdub",145],["1primewire",145],["2embed",145],["2madrasdub",145],["2umovies",145],["4anime",145],["9xmovies",145],["altadefinizione01",145],["anitube",145],["atomixhq",145],["beinmatch",145],["brmovies",145],["cima4u",145],["clicknupload",145],["cmovies",145],["couchtuner",145],["cricfree",145],["crichd",145],["databasegdriveplayer",145],["dood",145],["f1stream",145],["faselhd",145],["fbstream",145],["file4go",145],["filemoon",145],["filepress",[145,212]],["filmlinks4u",145],["filmpertutti",145],["filmyzilla",145],["fmovies",145],["french-stream",145],["fsapi",145],["fzlink",145],["gdriveplayer",145],["gofilms4u",145],["gogoanime",145],["gomoviefree",145],["gomoviz",145],["gowatchseries",145],["hdmoviefair",145],["hdmovies4u",145],["hdmovies50",145],["hdmoviesfair",145],["hh3dhay",145],["hindilinks4u",145],["hotmasti",145],["hurawatch",145],["klmanga",145],["klubsports",145],["libertestreamvf",145],["livetvon",145],["manga1000",145],["manga1001",145],["mangaraw",145],["mangarawjp",145],["mlbstream",145],["motogpstream",145],["movierulz",145],["movies123",145],["movies2watch",145],["moviesden",145],["moviezaddiction",145],["myflixer",145],["nbastream",145],["netcine",145],["nflstream",145],["nhlstream",145],["onlinewatchmoviespk",145],["pctfenix",145],["pctnew",145],["pksmovies",145],["plyjam",145],["plylive",145],["pogolinks",145],["popcorntime",145],["poscitech",145],["prmovies",145],["rugbystreams",145],["shahed4u",145],["sflix",145],["sitesunblocked",145],["socceronline",145],["solarmovies",145],["sportcast",145],["sportskart",145],["sports-stream",145],["streaming-french",145],["streamers",145],["streamingcommunity",145],["strikeout",145],["t20cup",145],["tennisstreams",145],["torrentdosfilmes",145],["toonanime",145],["tvply",145],["ufcstream",145],["uptomega",145],["uqload",145],["vudeo",145],["vidoo",145],["vipbox",145],["vipboxtv",145],["vipleague",145],["viprow",145],["yesmovies",145],["yomovies",145],["yomovies1",145],["yt2mp3s",145],["kat",145],["katbay",145],["kickass",145],["kickasshydra",145],["kickasskat",145],["kickass2",145],["kickasstorrents",145],["kat2",145],["kattracker",145],["thekat",145],["thekickass",145],["kickassz",145],["kickasstorrents2",145],["topkickass",145],["kickassgo",145],["kkickass",145],["kkat",145],["kickasst",145],["kick4ss",145],["guardaserie",151],["cine-calidad",152],["milfnut",157],["videovard",168],["dropgalaxy",[177,178]],["softonic",191],["bg-gledai",204],["gledaitv",204],["motchill",228]]);

const exceptionsMap = new Map([["mentor.duden.de",[83]],["forum.soft98.ir",[194]]]);

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
