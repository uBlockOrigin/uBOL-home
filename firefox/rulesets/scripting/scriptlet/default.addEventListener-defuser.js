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
const uBOL_addEventListenerDefuser = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["load","adBlock"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","pop"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["","popMagic"],["getexoloader"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["click","popMagic"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","shortener"],["DOMContentLoaded","adlinkfly"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["","click"],["canplay"],["click","trigger"],["mouseout","clientWidth"],["click"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["DOMContentLoaded","compupaste"],["keydown","keyCode"],["mousedown","!!{});"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["blur","focusOut"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["","loadScripts"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["/error|load/","/onerror|showModal/"],["load","doTest"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["click","openSite"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["contextmenu"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["load","block"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["DOMContentLoaded","disableDeveloperTools"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["DOMContentLoaded","iframe"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["","[native code]"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["load","htmls"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["load","length"],["gtmloaderror"],["DOMContentLoaded","canRunAds"],["click","adobeModalTestABenabled"],["blur","console.log"],["blur","counter"],["","AdB"],["load","adSession"],["load","Ads"],["load","/abb|htmls|nextFunction/"],["","adsBlocked"],["load","goog"],["DOMContentLoaded","googlesyndication"],["DOMContentLoaded","redURL"],["np.evtdetect"],["load","AdBlock"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["DOMContentLoaded","adsbygoogle"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["click","alink"],["/adblock/i"],["","daadb"],["click","handleClick"],["load","google-analytics"],["","sessionStorage"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["bild.de",5],["mediafire.com",[6,7]],["pinsystem.co.uk",8],["fembed.com",8],["ancensored.com",8],["o2tvseries.com",8],["mp3fiber.com",[8,19]],["xrivonet.info",8],["afreesms.com",9],["tio.ch",9],["lavanguardia.com",9],["eplayer.click",9],["kingofdown.com",10],["radiotormentamx.com",10],["quelleestladifference.fr",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["sna3talaflam.com",10],["agar.pro",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["drivebox.club",10],["interviewgig.com",10],["jobhunterplg.xyz",10],["javaguides.net",10],["almohtarif-tech.net",10],["hl-live.de",10],["forum.release-apk.com",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["primedeportes.es",10],["doujindesu.cc",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["greatanimation.it",10],["secretsdeepweb.blogspot.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["urdulibrarypk.blogspot.com",10],["zerotopay.com",10],["akw.to",10],["mawsueaa.com",10],["hesgoal-live.io",10],["pornhd.com",11],["cnnamador.com",[11,38]],["cle0desktop.blogspot.com",11],["turkanime.co",11],["camclips.tv",[11,51]],["blackpornhq.com",11],["xsexpics.com",11],["ulsex.net",11],["wannafreeporn.com",11],["ytube2dl.com",11],["multiup.us",11],["protege-torrent.com",11],["bibme.org",15],["citationmachine.net",15],["easybib.com",16],["userupload.net",17],["vermangasporno.com",17],["imgtorrnt.in",17],["picbaron.com",[17,25]],["worldcupfootball.me",17],["letmejerk.com",17],["letmejerk3.com",17],["letmejerk4.com",17],["letmejerk5.com",17],["letmejerk6.com",17],["letmejerk7.com",17],["dlapk4all.com",17],["kropic.com",17],["kvador.com",17],["pdfindir.net",17],["brstej.com",17],["topwwnews.com",17],["xsanime.com",17],["vidlo.us",17],["put-locker.com",17],["youx.xxx",17],["animeindo.asia",17],["masahub.net",17],["adclickersbot.com",17],["badtaste.it",18],["mage.si",19],["totaldebrid.org",19],["hesgoal.com",19],["neko-miku.com",19],["elsfile.org",19],["venstrike.jimdofree.com",19],["schrauben-normen.de",19],["avengerinator.blogspot.com",19],["link-to.net",19],["hanimesubth.com",19],["gsmturkey.net",19],["adshrink.it",19],["presentation-ppt.com",19],["mangacanblog.com",19],["pekalongan-cits.blogspot.com",19],["4tymode.win",19],["reifenrechner.at",19],["tire-size-calculator.info",19],["kord-jadul.com",19],["linuxsecurity.com",19],["encodinghub.com",19],["readyssh.net",19],["itsguider.com",19],["cotravinh.blogspot.com",19],["itudong.com",19],["shortx.net",19],["comandotorrenthd.org",19],["turkdebrid.net",19],["linkvertise.com",19],["lecturel.com",19],["comboforum.com",19],["bakai.org",19],["nar.k-ba.net",19],["tiroalpalo.org",19],["gotporn.com",21],["freepornrocks.com",21],["tvhai.org",21],["simpcity.su",21],["realgfporn.com",[22,23]],["titsbox.com",22],["thisvid.com",23],["xvideos-downloader.net",23],["imgspice.com",24],["luscious.net",[25,90]],["6indianporn.com",25],["amateurebonypics.com",25],["amateuryoungpics.com",25],["cinemabg.net",25],["desimmshd.com",25],["givemeaporn.com",25],["jav-asia.top",25],["javf.net",25],["javideo.net",25],["kr18plus.com",25],["pilibook.com",25],["pornborne.com",25],["porngrey.com",25],["submilf.com",25],["subtaboo.com",25],["tktube.com",25],["xfrenchies.com",25],["frauporno.com",25],["qqxnxx.com",25],["sexvideos.host",25],["aiimgvlog.fun",25],["vikiporn.com",26],["tnaflix.com",26],["hentai2w.com",[26,33]],["yourlust.com",26],["hotpornfile.org",26],["jav789.com",26],["javbuz.com",26],["letfap.com",26],["watchfreexxx.net",26],["vintageporntubes.com",26],["angelgals.com",26],["babesexy.com",26],["porndaa.com",26],["ganstamovies.com",26],["youngleak.com",26],["porndollz.com",26],["xnxxvideo.pro",26],["xvideosxporn.com",26],["onlyhgames.com",26],["filmpornofrancais.fr",26],["pictoa.com",[26,49]],["javout.co",26],["adultasianporn.com",26],["nsfwmonster.com",26],["girlsofdesire.org",26],["gaytail.com",26],["fetish-bb.com",26],["rumporn.com",26],["soyoungteens.com",26],["zubby.com",26],["lesbian8.com",26],["gayforfans.com",26],["reifporn.de",26],["javtsunami.com",26],["18tube.sex",26],["xxxextreme.org",26],["amateurs-fuck.com",26],["sex-amateur-clips.com",26],["hentaiworld.tv",26],["dads-banging-teens.com",26],["home-xxx-videos.com",26],["mature-chicks.com",26],["teens-fucking-matures.com",26],["hqbang.com",26],["darknessporn.com",26],["familyporner.com",26],["freepublicporn.com",26],["pisshamster.com",26],["punishworld.com",26],["xanimu.com",26],["pussyspace.com",[27,28]],["pussyspace.net",[27,28]],["empflix.com",29],["cpmlink.net",30],["bdsmstreak.com",30],["cutpaid.com",30],["pornforrelax.com",30],["fatwhitebutt.com",30],["mavplay.xyz",30],["sunporno.com",[31,32,33]],["hentai2read.com",33],["pornblade.com",33],["pornfelix.com",33],["xanimeporn.com",33],["javtiful.com",33],["camarchive.tv",33],["ver-comics-porno.com",33],["ver-mangas-porno.com",33],["illink.net",33],["tubxporn.xxx",33],["m-hentai.net",33],["icyporno.com",33],["redwap.me",33],["redwap2.com",33],["redwap3.com",33],["freejav.guru",33],["pornxxxxtube.net",33],["zetporn.com",33],["crownimg.com",33],["xxxvideohd.net",33],["short.pe",34],["bs.to",36],["efukt.com",36],["kpopsea.com",36],["generacionretro.net",37],["nuevos-mu.ucoz.com",37],["micloudfiles.com",37],["mimaletamusical.blogspot.com",37],["visionias.net",37],["sslproxies24.top",37],["b3infoarena.in",37],["lurdchinexgist.blogspot.com",37],["thefreedommatrix.blogspot.com",37],["hentai-vl.blogspot.com",37],["projetomotog.blogspot.com",37],["ktmx.pro",37],["lirik3satu.blogspot.com",37],["marketmovers.it",37],["pharmaguideline.com",37],["safemaru.blogspot.com",37],["mixloads.com",37],["mangaromance.eu",37],["interssh.com",37],["freesoftpdfdownload.blogspot.com",37],["cirokun.blogspot.com",37],["myadslink.com",37],["blackavelic.com",37],["server.satunivers.tv",37],["eg-akw.com",37],["xn--mgba7fjn.cc",37],["flashingjungle.com",38],["ma-x.org",39],["lavozdegalicia.es",39],["xmovies08.org",41],["globaldjmix.com",42],["zazzybabes.com",43],["haaretz.co.il",44],["haaretz.com",44],["slate.com",45],["peliculas1mega.com",46],["mega-mkv.com",[46,47]],["zona-leros.net",46],["megalinks.info",47],["megapastes.com",47],["mkv-pastes.com",47],["zpaste.net",47],["zlpaste.net",47],["9xlinks.site",47],["acortarm.xyz",48],["acortame.xyz",48],["cine.to",[49,180]],["hdstreamss.club",49],["kissasia.cc",49],["nzbstars.com",50],["digjav.com",51],["videoszoofiliahd.com",52],["xxxtubezoo.com",53],["zooredtube.com",53],["megacams.me",55],["rlslog.net",55],["porndoe.com",56],["acienciasgalilei.com",58],["playrust.io",59],["payskip.org",60],["short-url.link",61],["tubedupe.com",62],["fatgirlskinny.net",64],["polska-ie.com",64],["windowsmatters.com",64],["canaltdt.es",65],["masbrooo.com",65],["2ndrun.tv",65],["camclips.cc",[66,67]],["stfly.me",68],["oncehelp.com",68],["queenfaucet.website",68],["lewat.club",68],["curto.win",68],["smallseotools.com",69],["porndex.com",70],["macwelt.de",72],["pcwelt.de",72],["capital.de",72],["geo.de",72],["allmomsex.com",73],["allnewindianporn.com",73],["analxxxvideo.com",73],["animalextremesex.com",73],["anime3d.xyz",73],["animefuckmovies.com",73],["animepornfilm.com",73],["animesexbar.com",73],["animesexclip.com",73],["animexxxsex.com",73],["animexxxfilms.com",73],["anysex.club",73],["apetube.asia",73],["asianfuckmovies.com",73],["asianfucktube.com",73],["asianporn.sexy",73],["asiansexcilps.com",73],["beeg.fund",73],["beegvideoz.com",73],["bestasiansex.pro",73],["bigsexhub.com",73],["bravotube.asia",73],["brutalanimalsfuck.com",73],["candyteenporn.com",73],["daddyfuckmovies.com",73],["desifuckonline.com",73],["exclusiveasianporn.com",73],["exteenporn.com",73],["fantasticporn.net",73],["fantasticyoungporn.com",73],["fineasiansex.com",73],["firstasianpussy.com",73],["freeindiansextube.com",73],["freepornasians.com",73],["freerealvideo.com",73],["fuck-beeg.com",73],["fuck-xnxx.com",73],["fuckasian.pro",73],["fuckfuq.com",73],["fuckundies.com",73],["fullasiantube.com",73],["gojapaneseporn.com",73],["golderotica.com",73],["goodyoungsex.com",73],["goyoungporn.com",73],["hardxxxmoms.com",73],["hdvintagetube.com",73],["hentaiporn.me",73],["hentaisexfilms.com",73],["hentaisexuality.com",73],["hot-teens-movies.mobi",73],["hotanimepornvideos.com",73],["hotanimevideos.com",73],["hotasianpussysex.com",73],["hotjapaneseshows.com",73],["hotmaturetube.com",73],["hotmilfs.pro",73],["hotorientalporn.com",73],["hotpornsexvideos.com",73],["hotpornyoung.com",73],["hotxxxjapanese.com",73],["hotxxxpussy.com",73],["indiafree.net",73],["indianpornvideo.online",73],["japanpornclip.com",73],["japanesetube.video",73],["japansex.me",73],["japanesexxxporn.com",73],["japansporno.com",73],["japanxxx.asia",73],["japanxxxworld.com",73],["keezmovies.surf",73],["lingeriefuckvideo.com",73],["liveanimalporn.zooo.club",73],["madhentaitube.com",73],["megahentaitube.com",73],["megajapanesesex.com",73],["megajapantube.com",73],["milfxxxpussy.com",73],["momsextube.pro",73],["momxxxass.com",73],["monkeyanimalporn.com",73],["moviexxx.mobi",73],["newanimeporn.com",73],["newjapanesexxx.com",73],["nicematureporn.com",73],["nudeplayboygirls.com",73],["openxxxporn.com",73],["originalindianporn.com",73],["originalteentube.com",73],["pig-fuck.com",73],["plainasianporn.com",73],["popularasianxxx.com",73],["pornanimetube.com",73],["pornasians.pro",73],["pornhat.asia",73],["pornheed.online",73],["pornjapanesesex.com",73],["pornomovies.asia",73],["pornvintage.tv",73],["primeanimesex.com",73],["realjapansex.com",73],["realmomsex.com",73],["redsexhub.com",73],["retroporn.world",73],["retrosexfilms.com",73],["sex-free-movies.com",73],["sexanimesex.com",73],["sexanimetube.com",73],["sexjapantube.com",73],["sexmomvideos.com",73],["sexteenxxxtube.com",73],["sexxxanimal.com",73],["sexyoungtube.com",73],["sexyvintageporn.com",73],["sopornmovies.com",73],["spicyvintageporn.com",73],["sunporno.club",73],["tabooanime.club",73],["teenextrem.com",73],["teenfucksex.com",73],["teenhost.net",73],["teensexass.com",73],["tnaflix.asia",73],["totalfuckmovies.com",73],["totalmaturefuck.com",73],["txxx.asia",73],["voyeurpornsex.com",73],["warmteensex.com",73],["wetasiancreampie.com",73],["wildhentaitube.com",73],["wowyoungsex.com",73],["xhamster-art.com",73],["xmovie.pro",73],["xnudevideos.com",73],["xnxxjapon.com",73],["xpics.me",73],["xvide.me",73],["xxxanimefuck.com",73],["xxxanimevideos.com",73],["xxxanimemovies.com",73],["xxxhentai.xyz",73],["xxxhentaimovies.com",73],["xxxhothub.com",73],["xxxjapaneseporntube.com",73],["xxxlargeporn.com",73],["xxxmomz.com",73],["xxxpornmilf.com",73],["xxxpussyclips.com",73],["xxxpussysextube.com",73],["xxxretrofuck.com",73],["xxxsex.pro",73],["xxxsexyjapanese.com",73],["xxxteenyporn.com",73],["xxxvideo.asia",73],["xxxvideos.ink",73],["xxxyoungtv.com",73],["youjizzz.club",73],["youngpussyfuck.com",73],["bayimg.com",74],["celeb.gate.cc",75],["eodev.com",76],["masterplayer.xyz",78],["pussy-hub.com",78],["compucalitv.com",79],["duden.de",83],["pennlive.com",85],["beautypageants.indiatimes.com",86],["01fmovies.com",87],["lnk2.cc",89],["fullhdxxx.com",90],["classicpornbest.com",90],["1youngteenporn.com",90],["www-daftarharga.blogspot.com",[90,163]],["miraculous.to",[90,171]],["vtube.to",90],["gosexpod.com",91],["tubepornclassic.com",92],["shemalez.com",92],["otakukan.com",93],["xcafe.com",94],["pornfd.com",94],["venusarchives.com",94],["imagehaha.com",95],["imagenpic.com",95],["imageshimage.com",95],["imagetwist.com",95],["deusasporno.com.br",96],["sambaporno2.com",96],["sexoamador.blog.br",96],["videospornozinhos.com",96],["videosexoquente.com",96],["xvideosf.com",96],["k1nk.co",96],["watchasians.cc",96],["alexsports.xyz",96],["lulustream.com",96],["luluvdo.com",96],["web.de",97],["news18.com",98],["thelanb.com",99],["dropmms.com",99],["softdescargas.com",100],["softwaredescargas.com",100],["cracking-dz.com",101],["gazzetta.it",103],["alliptvlinks.com",104],["waterfall.money",104],["port.hu",106],["dziennikbaltycki.pl",107],["dzienniklodzki.pl",107],["dziennikpolski24.pl",107],["dziennikzachodni.pl",107],["echodnia.eu",107],["expressbydgoski.pl",107],["expressilustrowany.pl",107],["gazetakrakowska.pl",107],["gazetalubuska.pl",107],["gazetawroclawska.pl",107],["gk24.pl",107],["gloswielkopolski.pl",107],["gol24.pl",107],["gp24.pl",107],["gra.pl",107],["gs24.pl",107],["kurierlubelski.pl",107],["motofakty.pl",107],["naszemiasto.pl",107],["nowiny24.pl",107],["nowosci.com.pl",107],["nto.pl",107],["polskatimes.pl",107],["pomorska.pl",107],["poranny.pl",107],["sportowy24.pl",107],["strefaagro.pl",107],["strefabiznesu.pl",107],["stronakobiet.pl",107],["telemagazyn.pl",107],["to.com.pl",107],["wspolczesna.pl",107],["course9x.com",107],["courseclub.me",107],["azrom.net",107],["alttyab.net",107],["esopress.com",107],["nesiaku.my.id",107],["onemanhua.com",108],["freeindianporn.mobi",108],["dr-farfar.com",109],["boyfriendtv.com",110],["brandstofprijzen.info",111],["netfuck.net",112],["kisahdunia.com",112],["javsex.to",112],["nulljungle.com",112],["oyuncusoruyor.com",112],["pbarecap.ph",112],["sourds.net",112],["teknobalta.com",112],["tinyppt.com",112],["tvinternetowa.info",112],["sqlserveregitimleri.com",112],["tutcourse.com",112],["readytechflip.com",112],["novinhastop.com",112],["warddogs.com",112],["dvdgayporn.com",112],["iimanga.com",112],["tinhocdongthap.com",112],["tremamnon.com",112],["freedownloadvideo.net",112],["423down.com",112],["brizzynovel.com",112],["jugomobile.com",112],["freecodezilla.net",112],["movieslegacy.com",112],["animekhor.xyz",112],["iconmonstr.com",112],["gay-tubes.cc",112],["rbxscripts.net",112],["comentariodetexto.com",112],["wordpredia.com",112],["livsavr.co",112],["allfaucet.xyz",[112,192]],["replica-watch.info",112],["alludemycourses.com",112],["kayifamilytv.com",112],["blog24.me",[112,192]],["iir.ai",113],["gameofporn.com",115],["homeairquality.org",116],["qpython.club",117],["antifake-funko.fr",117],["e9china.net",118],["ac.ontools.net",118],["marketbeat.com",119],["hentaipornpics.net",120],["apps2app.com",121],["vulture.com",123],["megaplayer.bokracdn.run",124],["hentaistream.com",125],["siteunblocked.info",126],["moviesyug.net",127],["w4files.ws",127],["parispi.net",128],["simkl.com",129],["sayrodigital.com",130],["mrproblogger.com",131],["themezon.net",131],["paperzonevn.com",132],["dailyvideoreports.net",133],["lewd.ninja",134],["systemnews24.com",135],["incestvidz.com",136],["niusdiario.es",137],["playporngames.com",138],["movi.pk",[139,144]],["justin.mp3quack.lol",141],["cutesexyteengirls.com",142],["asianembed.io",143],["0dramacool.net",144],["185.53.88.104",144],["185.53.88.204",144],["185.53.88.15",144],["123movies4k.net",144],["123moviesg.com",144],["1movieshd.com",144],["1rowsports.com",144],["4share-mp3.net",144],["6movies.net",144],["9animetv.to",144],["720pstream.me",144],["abysscdn.com",144],["adblockplustape.com",144],["ajkalerbarta.com",144],["akstream.xyz",144],["androidapks.biz",144],["androidsite.net",144],["animefenix.com",144],["animeonlinefree.org",144],["animesite.net",144],["animespank.com",144],["aniworld.to",144],["apkmody.io",144],["appsfree4u.com",144],["audioz.download",144],["bdnewszh.com",144],["beastlyprints.com",144],["bengalisite.com",144],["bestfullmoviesinhd.org",144],["betteranime.net",144],["blacktiesports.live",144],["buffsports.stream",144],["ch-play.com",144],["clickforhire.com",144],["cloudy.pk",144],["computercrack.com",144],["coolcast2.com",144],["crackedsoftware.biz",144],["crackfree.org",144],["cracksite.info",144],["cryptoblog24.info",144],["cuatrolatastv.blogspot.com",144],["cydiasources.net",144],["dirproxy.com",144],["dopebox.to",144],["downloadapk.info",144],["downloadapps.info",144],["downloadgames.info",144],["downloadmusic.info",144],["downloadsite.org",144],["downloadwella.com",144],["ebooksite.org",144],["educationtips213.blogspot.com",144],["egyup.live",144],["embed.meomeo.pw",144],["embed.scdn.to",144],["emulatorsite.com",144],["essaysharkwriting.club",144],["extrafreetv.com",144],["fakedetail.com",144],["fclecteur.com",144],["files.im",144],["flexyhit.com",144],["fmoviefree.net",144],["fmovies24.com",144],["footyhunter3.xyz",144],["freeflix.info",144],["freemoviesu4.com",144],["freeplayervideo.com",144],["freesoccer.net",144],["fseries.org",144],["gamefast.org",144],["gamesite.info",144],["gmanga.me",144],["gocast123.me",144],["gogohd.net",144],["gogoplay5.com",144],["gooplay.net",144],["gostreamon.net",144],["happy2hub.org",144],["harimanga.com",144],["healthnewsreel.com",144],["hexupload.net",144],["hinatasoul.com",144],["hindisite.net",144],["holymanga.net",144],["hxfile.co",144],["isosite.org",144],["iv-soft.com",144],["januflix.expert",144],["jewelry.com.my",144],["johnwardflighttraining.com",144],["kabarportal.com",144],["kstorymedia.com",144],["la123movies.org",144],["lespassionsdechinouk.com",144],["lilymanga.net",144],["linksdegrupos.com.br",144],["livestreamtv.pk",144],["macsite.info",144],["mangapt.com",144],["mangareader.to",144],["mangasite.org",144],["manhuascan.com",144],["megafilmeshdseries.com",144],["megamovies.org",144],["membed.net",144],["mgnetu.com",144],["moddroid.com",144],["moviefree2.com",144],["movies-watch.com.pk",144],["moviesite.app",144],["moviesonline.fm",144],["moviesx.org",144],["moviewatchonline.com.pk",144],["msmoviesbd.com",144],["musicsite.biz",144],["myfernweh.com",144],["myviid.com",144],["nazarickol.com",144],["newsrade.com",144],["noob4cast.com",144],["nsw2u.com",[144,241]],["oko.sh",144],["olympicstreams.me",144],["orangeink.pk",144],["owllink.net",144],["pahaplayers.click",144],["patchsite.net",144],["pdfsite.net",144],["play1002.com",144],["player-cdn.com",144],["productkeysite.com",144],["projectfreetv.one",144],["romsite.org",144],["rufiguta.com",144],["rytmp3.io",144],["send.cm",144],["seriesite.net",144],["seriezloaded.com.ng",144],["serijehaha.com",144],["shrugemojis.com",144],["siteapk.net",144],["siteflix.org",144],["sitegames.net",144],["sitekeys.net",144],["sitepdf.com",144],["sitetorrent.com",144],["softwaresite.net",144],["sportbar.live",144],["sportkart1.xyz",144],["ssyoutube.com",144],["stardima.com",144],["stream4free.live",144],["superapk.org",144],["supermovies.org",144],["tainio-mania.online",144],["talaba.su",144],["tamilguns.org",144],["tatabrada.tv",144],["theflixer.tv",144],["thememypc.net",144],["thetechzone.online",144],["thripy.com",144],["tonnestreamz.xyz",144],["travelplanspro.com",144],["turcasmania.com",144],["tusfiles.com",144],["tvonlinesports.com",144],["ultramovies.org",144],["uploadbank.com",144],["urdubolo.pk",144],["vidspeeds.com",144],["vumoo.to",144],["warezsite.net",144],["watchmovies2.com",144],["watchmoviesforfree.org",144],["watchofree.com",144],["watchsite.net",144],["watchsouthpark.tv",144],["watchtvch.club",144],["web.livecricket.is",144],["webseries.club",144],["worldcupstream.pm",144],["y2mate.com",144],["youapk.net",144],["youtube4kdownloader.com",144],["yts-subs.com",144],["haho.moe",145],["nicy-spicy.pw",146],["fap-guru.cam",147],["novelmultiverse.com",148],["mylegalporno.com",149],["thecut.com",152],["novelism.jp",153],["alphapolis.co.jp",154],["okrzone.com",155],["momo-net.com",156],["maxgaming.fi",156],["guiasaude.info",156],["felizemforma.com",156],["financasdeouro.com",156],["game3rb.com",157],["javhub.net",157],["thotvids.com",158],["berklee.edu",159],["rawkuma.com",160],["imeteo.sk",161],["youtubemp3donusturucu.net",162],["surfsees.com",164],["feyorra.top",165],["claimtrx.com",165],["vivo.st",[166,167]],["alueviesti.fi",169],["kiuruvesilehti.fi",169],["lempaala.ideapark.fi",169],["olutposti.fi",169],["urjalansanomat.fi",169],["joyhints.com",170],["tainhanhvn.com",172],["titantv.com",173],["3cinfo.net",174],["transportationlies.org",175],["upshrink.com",176],["cocomanga.com",177],["mcleaks.net",178],["explorecams.com",178],["minecraft.buzz",178],["chillx.top",179],["playerx.stream",179],["m.liputan6.com",181],["stardewids.com",[181,204]],["ingles.com",182],["spanishdict.com",182],["rureka.com",183],["bunkr.is",184],["amateur8.com",185],["freeporn8.com",185],["maturetubehere.com",185],["embedo.co",186],["corriere.it",187],["oggi.it",187],["2the.space",188],["apkcombo.com",190],["sponsorhunter.com",191],["coinscap.info",192],["cryptowidgets.net",192],["greenenez.com",192],["insurancegold.in",192],["webfreetools.net",192],["wiki-topia.com",192],["bitcotasks.com",192],["videolyrics.in",192],["manofadan.com",192],["cempakajaya.com",192],["carsmania.net",192],["carstopia.net",192],["coinsvalue.net",192],["cookinguide.net",192],["freeoseocheck.com",192],["makeupguide.net",192],["tagecoin.com",192],["doge25.in",192],["king-ptcs.com",192],["naijafav.top",192],["ourcoincash.xyz",192],["sh.techsamir.com",192],["claimcoins.site",192],["cryptosh.pro",192],["cryptoearnfaucet.com",192],["coinsrev.com",192],["ohionowcast.info",192],["wiour.com",192],["go.freetrx.fun",192],["bitzite.com",192],["eftacrypto.com",192],["fescrypto.com",192],["appsbull.com",192],["diudemy.com",192],["maqal360.com",192],["earnhub.net",192],["kiddyshort.com",192],["tronxminer.com",192],["soft98.ir",193],["novelssites.com",194],["haxina.com",195],["cryptofenz.xyz",195],["torrentmac.net",196],["moviezaddiction.icu",197],["dlpanda.com",198],["socialmediagirls.com",199],["einrichtungsbeispiele.de",200],["weadown.com",201],["molotov.tv",202],["freecoursesonline.me",203],["dropnudes.com",203],["ftuapps.dev",203],["onehack.us",203],["paste.bin.sx",203],["privatenudes.com",203],["mathcrave.com",203],["commands.gg",204],["smgplaza.com",205],["autosport.com",[206,207]],["motorsport.com",[206,207]],["bravedown.com",208],["freepik.com",209],["pinloker.com",211],["sekilastekno.com",211],["diyphotography.net",212],["bitchesgirls.com",213],["shopforex.online",214],["ltc25.in",[215,216]],["yesmangas1.com",217],["programmingeeksclub.com",218],["hlspanel.xyz",219],["easymc.io",220],["shoot-yalla.tv",221],["diendancauduong.com",222],["parentcircle.com",223],["h-game18.xyz",224],["nopay.info",225],["wheelofgold.com",226],["shortlinks.tech",227],["recipahi.com",228],["skill4ltu.eu",230],["freepikdownloader.com",231],["freepasses.org",232],["iusedtobeaboss.com",233],["blogtruyenmoi.com",234],["repretel.com",235],["igay69.com",236],["cutlink.net",237],["cutsy.net",237],["cutyurls.com",237],["cutty.app",237],["graphicget.com",238],["qiwi.gg",239],["cbc.ca",240]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",8],["ganool",8],["pirate",8],["piratebay",8],["pirateproxy",8],["proxytpb",8],["thepiratebay",8],["limetorrents",[10,17]],["king-pes",10],["depedlps",10],["komikcast",10],["idedroidsafelink",10],["links-url",10],["eikaiwamastery",10],["ak4eg",10],["xhamster",11],["xhamster1",11],["xhamster5",11],["xhamster7",11],["rexporn",11],["movies07",11],["pornocomics",11],["streanplay",12],["steanplay",12],["liferayiseasy",[13,14]],["pahe",17],["yts",17],["tube8",17],["topeuropix",17],["moviescounter",17],["torrent9",17],["desiremovies",17],["movs4u",17],["uwatchfree",17],["hydrax",17],["4movierulz",17],["projectfreetv",17],["arabseed",17],["btdb",[17,59]],["skymovieshd",17],["world4ufree",17],["streamsport",17],["rojadirectatvhd",17],["userload",17],["freecoursesonline",19],["lordpremium",19],["todovieneok",19],["novablogitalia",19],["anisubindo",19],["btvsports",19],["adyou",20],["fxporn69",22],["watchseries",25],["pornktube",25],["sexwebvideo",30],["pornomoll",30],["mejortorrent",33],["mejortorrento",33],["mejortorrents",33],["mejortorrents1",33],["mejortorrentt",33],["grantorrent",33],["gntai",33],["allcalidad",[33,49]],["gsurl",34],["mimaletadepeliculas",35],["burningseries",36],["dz4soft",37],["yoututosjeff",37],["ebookmed",37],["lanjutkeun",37],["novelasesp",37],["singingdalong",37],["doujindesu",37],["xmovies8",40],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",48],["newpelis",[49,57]],["pelix",[49,57]],["khatrimaza",49],["camwhores",51],["camwhorestv",51],["uproxy",51],["nekopoi",54],["mirrorace",63],["dbupload",70],["mixdrp",71],["asiansex",73],["japanfuck",73],["japanporn",73],["teensex",73],["vintagetube",73],["xxxmovies",73],["zooqle",77],["7starhd",[80,127]],["hdfull",81],["mangamanga",82],["streameast",84],["thestreameast",84],["vev",88],["vidop",88],["zone-telechargement",90],["megalink",96],["gmx",97],["mega1080p",102],["9hentai",105],["gaypornhdfree",112],["cinemakottaga",112],["privatemoviez",112],["apkmaven",112],["popcornstream",114],["dropgalaxy",122],["pagalmovies",127],["jalshamoviez",127],["9xupload",127],["bdupload",127],["desiupload",127],["rdxhd1",127],["moviessources",140],["nuvid",141],["goload",[143,144]],["0gomovie",144],["0gomovies",144],["123moviefree",144],["1kmovies",144],["1madrasdub",144],["1primewire",144],["2embed",144],["2madrasdub",144],["2umovies",144],["4anime",144],["9xmovies",144],["altadefinizione01",144],["anitube",144],["atomixhq",144],["beinmatch",144],["brmovies",144],["cima4u",144],["clicknupload",144],["cmovies",144],["couchtuner",144],["cricfree",144],["crichd",144],["databasegdriveplayer",144],["dood",144],["f1stream",144],["faselhd",144],["fbstream",144],["file4go",144],["filemoon",144],["filepress",[144,210]],["filmlinks4u",144],["filmpertutti",144],["filmyzilla",144],["fmovies",144],["french-stream",144],["fsapi",144],["fzlink",144],["gdriveplayer",144],["gofilms4u",144],["gogoanime",144],["gomoviefree",144],["gomoviz",144],["gowatchseries",144],["hdmoviefair",144],["hdmovies4u",144],["hdmovies50",144],["hdmoviesfair",144],["hh3dhay",144],["hindilinks4u",144],["hotmasti",144],["hurawatch",144],["klmanga",144],["klubsports",144],["libertestreamvf",144],["livetvon",144],["manga1000",144],["manga1001",144],["mangaraw",144],["mangarawjp",144],["mlbstream",144],["motogpstream",144],["movierulz",144],["movies123",144],["movies2watch",144],["moviesden",144],["moviezaddiction",144],["myflixer",144],["nbastream",144],["netcine",144],["nflstream",144],["nhlstream",144],["onlinewatchmoviespk",144],["pctfenix",144],["pctnew",144],["pksmovies",144],["plyjam",144],["plylive",144],["pogolinks",144],["popcorntime",144],["poscitech",144],["prmovies",144],["rugbystreams",144],["shahed4u",144],["sflix",144],["sitesunblocked",144],["socceronline",144],["solarmovies",144],["sportcast",144],["sportskart",144],["sports-stream",144],["streaming-french",144],["streamers",144],["streamingcommunity",144],["strikeout",144],["t20cup",144],["tennisstreams",144],["torrentdosfilmes",144],["toonanime",144],["tvply",144],["ufcstream",144],["uptomega",144],["uqload",144],["vudeo",144],["vidoo",144],["vipbox",144],["vipboxtv",144],["vipleague",144],["viprow",144],["yesmovies",144],["yomovies",144],["yomovies1",144],["yt2mp3s",144],["kat",144],["katbay",144],["kickass",144],["kickasshydra",144],["kickasskat",144],["kickass2",144],["kickasstorrents",144],["kat2",144],["kattracker",144],["thekat",144],["thekickass",144],["kickassz",144],["kickasstorrents2",144],["topkickass",144],["kickassgo",144],["kkickass",144],["kkat",144],["kickasst",144],["kick4ss",144],["guardaserie",150],["cine-calidad",151],["milfnut",156],["videovard",168],["softonic",189],["bg-gledai",203],["gledaitv",203],["motchill",229]]);

const exceptionsMap = new Map([["mentor.duden.de",[83]],["forum.soft98.ir",[193]]]);

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
