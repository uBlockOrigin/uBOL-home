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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["load","adBlock"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","pop"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["","popMagic"],["getexoloader"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["click","popMagic"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","shortener"],["DOMContentLoaded","adlinkfly"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["","click"],["canplay"],["click","trigger"],["mouseout","clientWidth"],["mouseout","[native code]"],["click"],["click","open"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["DOMContentLoaded","compupaste"],["keydown","keyCode"],["mousedown","!!{});"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["blur","focusOut"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["DOMContentLoaded","adblock"],["load","head"],["/error|load/","/onerror|showModal/"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["click","openSite"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["contextmenu"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["DOMContentLoaded","event"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["load","block"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["DOMContentLoaded","disableDeveloperTools"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["","[native code]"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["load","htmls"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["DOMContentLoaded","iframe"],["","Math"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["load","length"],["gtmloaderror"],["click","adobeModalTestABenabled"],["blur","console.log"],["blur","counter"],["","AdB"],["load","adSession"],["load","Ads"],["load","/abb|htmls|nextFunction/"],["","adsBlocked"],["load","goog"],["DOMContentLoaded","googlesyndication"],["DOMContentLoaded","redURL"],["np.evtdetect"],["load","AdBlock"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["DOMContentLoaded","adsbygoogle"],["click","popactive"],["load","doTest"],["message","adPoweredPluginInUse"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["click","alink"],["/adblock/i"],["","daadb"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["bild.de",5],["mediafire.com",[6,7]],["pinsystem.co.uk",8],["fembed.com",8],["ancensored.com",8],["o2tvseries.com",8],["mp3fiber.com",[8,19]],["xrivonet.info",8],["afreesms.com",9],["tio.ch",9],["lavanguardia.com",9],["eplayer.click",9],["kingofdown.com",10],["radiotormentamx.com",10],["quelleestladifference.fr",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["sna3talaflam.com",10],["agar.pro",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["drivebox.club",10],["interviewgig.com",10],["jobhunterplg.xyz",10],["javaguides.net",10],["almohtarif-tech.net",10],["hl-live.de",10],["forum.release-apk.com",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["primedeportes.es",10],["doujindesu.cc",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["greatanimation.it",10],["secretsdeepweb.blogspot.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["urdulibrarypk.blogspot.com",10],["zerotopay.com",10],["akw.to",10],["mawsueaa.com",10],["pornhd.com",11],["cnnamador.com",[11,38]],["cle0desktop.blogspot.com",11],["turkanime.co",11],["camclips.tv",[11,51]],["blackpornhq.com",11],["xsexpics.com",11],["ulsex.net",11],["wannafreeporn.com",11],["ytube2dl.com",11],["multiup.us",11],["protege-torrent.com",11],["bibme.org",15],["citationmachine.net",15],["easybib.com",16],["userupload.net",17],["vermangasporno.com",17],["imgtorrnt.in",17],["picbaron.com",[17,25]],["worldcupfootball.me",17],["letmejerk.com",17],["letmejerk3.com",17],["letmejerk4.com",17],["letmejerk5.com",17],["letmejerk6.com",17],["letmejerk7.com",17],["dlapk4all.com",17],["kropic.com",17],["kvador.com",17],["pdfindir.net",17],["brstej.com",17],["topwwnews.com",17],["xsanime.com",17],["vidlo.us",17],["put-locker.com",17],["moviesyug.net",17],["w4files.ws",17],["youx.xxx",17],["animeindo.asia",17],["masahub.net",17],["adclickersbot.com",17],["badtaste.it",18],["mage.si",19],["totaldebrid.org",19],["hesgoal.com",19],["neko-miku.com",19],["elsfile.org",19],["venstrike.jimdofree.com",19],["schrauben-normen.de",19],["avengerinator.blogspot.com",19],["link-to.net",19],["hanimesubth.com",19],["gsmturkey.net",19],["linkvertise.com",19],["adshrink.it",19],["presentation-ppt.com",19],["mangacanblog.com",19],["pekalongan-cits.blogspot.com",19],["4tymode.win",19],["reifenrechner.at",19],["tire-size-calculator.info",19],["kord-jadul.com",19],["linuxsecurity.com",19],["encodinghub.com",19],["readyssh.net",19],["itsguider.com",19],["cotravinh.blogspot.com",19],["itudong.com",19],["shortx.net",19],["comandotorrenthd.org",19],["turkdebrid.net",19],["lecturel.com",19],["comboforum.com",19],["bakai.org",19],["nar.k-ba.net",19],["gotporn.com",21],["freepornrocks.com",21],["tvhai.org",21],["simpcity.su",21],["realgfporn.com",[22,23]],["titsbox.com",22],["thisvid.com",23],["xvideos-downloader.net",23],["imgspice.com",24],["luscious.net",[25,92]],["6indianporn.com",25],["amateurebonypics.com",25],["amateuryoungpics.com",25],["cinemabg.net",25],["desimmshd.com",25],["givemeaporn.com",25],["jav-asia.top",25],["javf.net",25],["javideo.net",25],["kr18plus.com",25],["pilibook.com",25],["pornborne.com",25],["porngrey.com",25],["submilf.com",25],["subtaboo.com",25],["tktube.com",25],["xfrenchies.com",25],["frauporno.com",25],["qqxnxx.com",25],["sexvideos.host",25],["vikiporn.com",26],["tnaflix.com",26],["hentai2w.com",[26,33]],["yourlust.com",26],["hotpornfile.org",26],["jav789.com",26],["javbuz.com",26],["letfap.com",26],["watchfreexxx.net",26],["vintageporntubes.com",26],["angelgals.com",26],["babesexy.com",26],["porndaa.com",26],["ganstamovies.com",26],["youngleak.com",26],["porndollz.com",26],["xnxxvideo.pro",26],["xvideosxporn.com",26],["onlyhgames.com",26],["filmpornofrancais.fr",26],["pictoa.com",[26,49]],["javout.co",26],["adultasianporn.com",26],["nsfwmonster.com",26],["girlsofdesire.org",26],["gaytail.com",26],["fetish-bb.com",26],["rumporn.com",26],["soyoungteens.com",26],["zubby.com",26],["lesbian8.com",26],["gayforfans.com",26],["reifporn.de",26],["javtsunami.com",26],["18tube.sex",26],["xxxextreme.org",26],["amateurs-fuck.com",26],["sex-amateur-clips.com",26],["hentaiworld.tv",26],["dads-banging-teens.com",26],["home-xxx-videos.com",26],["mature-chicks.com",26],["teens-fucking-matures.com",26],["hqbang.com",26],["pussyspace.com",[27,28]],["pussyspace.net",[27,28]],["empflix.com",29],["cpmlink.net",30],["bdsmstreak.com",30],["cutpaid.com",30],["pornforrelax.com",30],["fatwhitebutt.com",30],["mavplay.xyz",30],["sunporno.com",[31,32,33]],["hentai2read.com",33],["pornblade.com",33],["pornfelix.com",33],["xanimeporn.com",33],["javtiful.com",33],["camarchive.tv",33],["ver-comics-porno.com",33],["ver-mangas-porno.com",33],["illink.net",33],["genpassword.top",33],["tubxporn.xxx",33],["m-hentai.net",33],["icyporno.com",33],["redwap.me",33],["redwap2.com",33],["redwap3.com",33],["freejav.guru",33],["pornxxxxtube.net",33],["zetporn.com",33],["crownimg.com",33],["xxxvideohd.net",33],["short.pe",34],["bs.to",36],["efukt.com",36],["kpopsea.com",36],["generacionretro.net",37],["nuevos-mu.ucoz.com",37],["micloudfiles.com",37],["mimaletamusical.blogspot.com",37],["visionias.net",37],["sslproxies24.top",37],["b3infoarena.in",37],["lurdchinexgist.blogspot.com",37],["thefreedommatrix.blogspot.com",37],["hentai-vl.blogspot.com",37],["projetomotog.blogspot.com",37],["ktmx.pro",37],["lirik3satu.blogspot.com",37],["marketmovers.it",37],["pharmaguideline.com",37],["safemaru.blogspot.com",37],["mixloads.com",37],["mangaromance.eu",37],["interssh.com",37],["freesoftpdfdownload.blogspot.com",37],["cirokun.blogspot.com",37],["myadslink.com",37],["blackavelic.com",37],["server.satunivers.tv",37],["eg-akw.com",37],["xn--mgba7fjn.cc",37],["flashingjungle.com",38],["ma-x.org",39],["lavozdegalicia.es",39],["btcbunch.com",39],["xmovies08.org",41],["globaldjmix.com",42],["zazzybabes.com",43],["haaretz.com",44],["slate.com",45],["peliculas1mega.com",46],["mega-mkv.com",[46,47]],["zona-leros.net",46],["megalinks.info",47],["megapastes.com",47],["mkv-pastes.com",47],["zpaste.net",47],["zlpaste.net",47],["9xlinks.site",47],["acortarm.xyz",48],["acortame.xyz",48],["cine.to",[49,178]],["hdstreamss.club",49],["kissasia.cc",49],["nzbstars.com",50],["digjav.com",51],["videoszoofiliahd.com",52],["xxxtubezoo.com",53],["zooredtube.com",53],["megacams.me",55],["rlslog.net",55],["porndoe.com",56],["acienciasgalilei.com",58],["playrust.io",59],["payskip.org",60],["short-url.link",61],["tubedupe.com",62],["fatgirlskinny.net",64],["polska-ie.com",64],["windowsmatters.com",64],["canaltdt.es",65],["masbrooo.com",65],["2ndrun.tv",65],["camclips.cc",[66,67]],["stfly.me",68],["oncehelp.com",68],["queenfaucet.website",68],["lewat.club",68],["popimed.com",68],["curto.win",68],["smallseotools.com",69],["plagiarismchecker.co",70],["porndex.com",71],["asianclub.tv",72],["justin.mp3quack.lol",72],["macwelt.de",74],["pcwelt.de",74],["capital.de",74],["geo.de",74],["allmomsex.com",75],["allnewindianporn.com",75],["analxxxvideo.com",75],["animalextremesex.com",75],["anime3d.xyz",75],["animefuckmovies.com",75],["animepornfilm.com",75],["animesexbar.com",75],["animesexclip.com",75],["animexxxsex.com",75],["animexxxfilms.com",75],["anysex.club",75],["apetube.asia",75],["asianfuckmovies.com",75],["asianfucktube.com",75],["asianporn.sexy",75],["asiansexcilps.com",75],["beeg.fund",75],["beegvideoz.com",75],["bestasiansex.pro",75],["bigsexhub.com",75],["bravotube.asia",75],["brutalanimalsfuck.com",75],["candyteenporn.com",75],["daddyfuckmovies.com",75],["desifuckonline.com",75],["exclusiveasianporn.com",75],["exteenporn.com",75],["fantasticporn.net",75],["fantasticyoungporn.com",75],["fineasiansex.com",75],["firstasianpussy.com",75],["freeindiansextube.com",75],["freepornasians.com",75],["freerealvideo.com",75],["fuck-beeg.com",75],["fuck-xnxx.com",75],["fuckasian.pro",75],["fuckfuq.com",75],["fuckundies.com",75],["fullasiantube.com",75],["gojapaneseporn.com",75],["golderotica.com",75],["goodyoungsex.com",75],["goyoungporn.com",75],["hardxxxmoms.com",75],["hdvintagetube.com",75],["hentaiporn.me",75],["hentaisexfilms.com",75],["hentaisexuality.com",75],["hot-teens-movies.mobi",75],["hotanimepornvideos.com",75],["hotanimevideos.com",75],["hotasianpussysex.com",75],["hotjapaneseshows.com",75],["hotmaturetube.com",75],["hotmilfs.pro",75],["hotorientalporn.com",75],["hotpornsexvideos.com",75],["hotpornyoung.com",75],["hotxxxjapanese.com",75],["hotxxxpussy.com",75],["indiafree.net",75],["indianpornvideo.online",75],["japanpornclip.com",75],["japanesetube.video",75],["japansex.me",75],["japanesexxxporn.com",75],["japansporno.com",75],["japanxxx.asia",75],["japanxxxworld.com",75],["keezmovies.surf",75],["lingeriefuckvideo.com",75],["liveanimalporn.zooo.club",75],["madhentaitube.com",75],["megahentaitube.com",75],["megajapanesesex.com",75],["megajapantube.com",75],["milfxxxpussy.com",75],["momsextube.pro",75],["momxxxass.com",75],["monkeyanimalporn.com",75],["moviexxx.mobi",75],["newanimeporn.com",75],["newjapanesexxx.com",75],["nicematureporn.com",75],["nudeplayboygirls.com",75],["openxxxporn.com",75],["originalindianporn.com",75],["originalteentube.com",75],["pig-fuck.com",75],["plainasianporn.com",75],["popularasianxxx.com",75],["pornanimetube.com",75],["pornasians.pro",75],["pornhat.asia",75],["pornheed.online",75],["pornjapanesesex.com",75],["pornomovies.asia",75],["pornvintage.tv",75],["primeanimesex.com",75],["realjapansex.com",75],["realmomsex.com",75],["redsexhub.com",75],["retroporn.world",75],["retrosexfilms.com",75],["sex-free-movies.com",75],["sexanimesex.com",75],["sexanimetube.com",75],["sexjapantube.com",75],["sexmomvideos.com",75],["sexteenxxxtube.com",75],["sexxxanimal.com",75],["sexyoungtube.com",75],["sexyvintageporn.com",75],["sopornmovies.com",75],["spicyvintageporn.com",75],["sunporno.club",75],["tabooanime.club",75],["teenextrem.com",75],["teenfucksex.com",75],["teenhost.net",75],["teensexass.com",75],["tnaflix.asia",75],["totalfuckmovies.com",75],["totalmaturefuck.com",75],["txxx.asia",75],["voyeurpornsex.com",75],["warmteensex.com",75],["wetasiancreampie.com",75],["wildhentaitube.com",75],["wowyoungsex.com",75],["xhamster-art.com",75],["xmovie.pro",75],["xnudevideos.com",75],["xnxxjapon.com",75],["xpics.me",75],["xvide.me",75],["xxxanimefuck.com",75],["xxxanimevideos.com",75],["xxxanimemovies.com",75],["xxxhentai.xyz",75],["xxxhentaimovies.com",75],["xxxhothub.com",75],["xxxjapaneseporntube.com",75],["xxxlargeporn.com",75],["xxxmomz.com",75],["xxxpornmilf.com",75],["xxxpussyclips.com",75],["xxxpussysextube.com",75],["xxxretrofuck.com",75],["xxxsex.pro",75],["xxxsexyjapanese.com",75],["xxxteenyporn.com",75],["xxxvideo.asia",75],["xxxvideos.ink",75],["xxxyoungtv.com",75],["youjizzz.club",75],["youngpussyfuck.com",75],["bayimg.com",76],["celeb.gate.cc",77],["eodev.com",78],["masterplayer.xyz",80],["pussy-hub.com",80],["compucalitv.com",81],["duden.de",85],["pennlive.com",87],["beautypageants.indiatimes.com",88],["01fmovies.com",89],["lnk2.cc",91],["fullhdxxx.com",92],["classicpornbest.com",92],["1youngteenporn.com",92],["www-daftarharga.blogspot.com",[92,162]],["miraculous.to",[92,170]],["vtube.to",92],["beritabaru.news",92],["solusi.cyou",92],["gosexpod.com",93],["tubepornclassic.com",94],["shemalez.com",94],["otakukan.com",95],["xcafe.com",96],["pornfd.com",96],["venusarchives.com",96],["imagehaha.com",97],["imagenpic.com",97],["imageshimage.com",97],["imagetwist.com",97],["deusasporno.com.br",98],["sambaporno2.com",98],["sexoamador.blog.br",98],["videospornozinhos.com",98],["videosexoquente.com",98],["xvideosf.com",98],["k1nk.co",98],["watchasians.cc",98],["alexsports.xyz",98],["web.de",99],["news18.com",100],["thelanb.com",101],["dropmms.com",101],["softdescargas.com",102],["softwaredescargas.com",102],["cracking-dz.com",103],["gazzetta.it",105],["alliptvlinks.com",106],["waterfall.money",106],["port.hu",108],["dziennikbaltycki.pl",109],["dzienniklodzki.pl",109],["dziennikpolski24.pl",109],["dziennikzachodni.pl",109],["echodnia.eu",109],["expressbydgoski.pl",109],["expressilustrowany.pl",109],["gazetakrakowska.pl",109],["gazetalubuska.pl",109],["gazetawroclawska.pl",109],["gk24.pl",109],["gloswielkopolski.pl",109],["gol24.pl",109],["gp24.pl",109],["gra.pl",109],["gs24.pl",109],["kurierlubelski.pl",109],["motofakty.pl",109],["naszemiasto.pl",109],["nowiny24.pl",109],["nowosci.com.pl",109],["nto.pl",109],["polskatimes.pl",109],["pomorska.pl",109],["poranny.pl",109],["sportowy24.pl",109],["strefaagro.pl",109],["strefabiznesu.pl",109],["stronakobiet.pl",109],["telemagazyn.pl",109],["to.com.pl",109],["wspolczesna.pl",109],["course9x.com",109],["courseclub.me",109],["azrom.net",109],["alttyab.net",109],["esopress.com",109],["nesiaku.my.id",109],["onemanhua.com",110],["freeindianporn.mobi",110],["dr-farfar.com",111],["boyfriendtv.com",112],["brandstofprijzen.info",113],["netfuck.net",114],["kisahdunia.com",114],["javsex.to",114],["nulljungle.com",114],["oyuncusoruyor.com",114],["pbarecap.ph",114],["sourds.net",114],["teknobalta.com",114],["tinyppt.com",114],["tvinternetowa.info",114],["sqlserveregitimleri.com",114],["tutcourse.com",114],["readytechflip.com",114],["novinhastop.com",114],["warddogs.com",114],["dotadostube.com",114],["dvdgayonline.com",114],["dvdgayporn.com",114],["hotxfans.com",114],["taradinhos.com",114],["iimanga.com",114],["tinhocdongthap.com",114],["thuocdangian.net",114],["tremamnon.com",114],["freedownloadvideo.net",114],["423down.com",114],["brizzynovel.com",114],["jugomobile.com",114],["freecodezilla.net",114],["movieslegacy.com",114],["animekhor.xyz",114],["iconmonstr.com",114],["gay-tubes.cc",114],["rbxscripts.net",114],["comentariodetexto.com",114],["wordpredia.com",114],["mdn.lol",114],["livsavr.co",114],["allfaucet.xyz",[114,190]],["replica-watch.info",114],["alludemycourses.com",114],["kayifamilytv.com",114],["blog24.me",[114,190]],["iir.ai",115],["gameofporn.com",117],["homeairquality.org",118],["qpython.club",119],["antifake-funko.fr",119],["e9china.net",120],["ac.ontools.net",120],["marketbeat.com",121],["hentaipornpics.net",122],["apps2app.com",123],["vulture.com",124],["megaplayer.bokracdn.run",125],["hentaistream.com",126],["siteunblocked.info",127],["parispi.net",128],["simkl.com",129],["sayrodigital.com",130],["paperzonevn.com",131],["dailyvideoreports.net",132],["lewd.ninja",133],["systemnews24.com",134],["incestvidz.com",135],["niusdiario.es",136],["playporngames.com",137],["movi.pk",[138,142]],["cutesexyteengirls.com",140],["asianembed.io",141],["gogoplay1.com",141],["0dramacool.net",142],["185.53.88.104",142],["185.53.88.204",142],["185.53.88.15",142],["123movies4k.net",142],["123moviesg.com",142],["1movieshd.com",142],["1rowsports.com",142],["4share-mp3.net",142],["6movies.net",142],["9animetv.to",142],["720pstream.me",142],["abysscdn.com",142],["adblockplustape.com",142],["ajkalerbarta.com",142],["akstream.xyz",142],["androidapks.biz",142],["androidsite.net",142],["animefenix.com",142],["animeonlinefree.org",142],["animesite.net",142],["animespank.com",142],["aniworld.to",142],["apkmody.io",142],["appsfree4u.com",142],["audioz.download",142],["bdnewszh.com",142],["beastlyprints.com",142],["bengalisite.com",142],["bestfullmoviesinhd.org",142],["betteranime.net",142],["blacktiesports.live",142],["buffsports.stream",142],["ch-play.com",142],["clickforhire.com",142],["cloudy.pk",142],["computercrack.com",142],["coolcast2.com",142],["crackedsoftware.biz",142],["crackfree.org",142],["cracksite.info",142],["cryptoblog24.info",142],["cuatrolatastv.blogspot.com",142],["cydiasources.net",142],["dirproxy.com",142],["dopebox.to",142],["downloadapk.info",142],["downloadapps.info",142],["downloadgames.info",142],["downloadmusic.info",142],["downloadsite.org",142],["downloadwella.com",142],["ebooksite.org",142],["educationtips213.blogspot.com",142],["egyup.live",142],["embed.meomeo.pw",142],["embed.scdn.to",142],["emulatorsite.com",142],["essaysharkwriting.club",142],["extrafreetv.com",142],["fakedetail.com",142],["fclecteur.com",142],["files.im",142],["flexyhit.com",142],["fmoviefree.net",142],["fmovies24.com",142],["footyhunter3.xyz",142],["freeflix.info",142],["freemoviesu4.com",142],["freeplayervideo.com",142],["freesoccer.net",142],["fseries.org",142],["gamefast.org",142],["gamesite.info",142],["gmanga.me",142],["gocast123.me",142],["gogohd.net",142],["gogoplay5.com",142],["gooplay.net",142],["gostreamon.net",142],["happy2hub.org",142],["harimanga.com",142],["healthnewsreel.com",142],["hexupload.net",142],["hinatasoul.com",142],["hindisite.net",142],["holymanga.net",142],["hxfile.co",142],["isosite.org",142],["iv-soft.com",142],["januflix.expert",142],["jewelry.com.my",142],["johnwardflighttraining.com",142],["kabarportal.com",142],["kstorymedia.com",142],["la123movies.org",142],["lespassionsdechinouk.com",142],["lilymanga.net",142],["linksdegrupos.com.br",142],["livestreamtv.pk",142],["macsite.info",142],["mangapt.com",142],["mangareader.to",142],["mangasite.org",142],["manhuascan.com",142],["megafilmeshdseries.com",142],["megamovies.org",142],["membed.net",142],["mgnetu.com",142],["moddroid.com",142],["moviefree2.com",142],["movies-watch.com.pk",142],["moviesite.app",142],["moviesonline.fm",142],["moviesx.org",142],["moviewatchonline.com.pk",142],["msmoviesbd.com",142],["musicsite.biz",142],["myfernweh.com",142],["myviid.com",142],["nazarickol.com",142],["newsrade.com",142],["noob4cast.com",142],["nsw2u.com",[142,238]],["oko.sh",142],["olympicstreams.me",142],["orangeink.pk",142],["owllink.net",142],["pahaplayers.click",142],["patchsite.net",142],["pdfsite.net",142],["play1002.com",142],["player-cdn.com",142],["productkeysite.com",142],["projectfreetv.one",142],["romsite.org",142],["rufiguta.com",142],["rytmp3.io",142],["send.cm",142],["seriesite.net",142],["seriezloaded.com.ng",142],["serijehaha.com",142],["shrugemojis.com",142],["siteapk.net",142],["siteflix.org",142],["sitegames.net",142],["sitekeys.net",142],["sitepdf.com",142],["sitetorrent.com",142],["softwaresite.net",142],["sportbar.live",142],["sportkart1.xyz",142],["ssyoutube.com",142],["stardima.com",142],["stream4free.live",142],["subdl.com",142],["superapk.org",142],["supermovies.org",142],["tainio-mania.online",142],["talaba.su",142],["tamilguns.org",142],["tatabrada.tv",142],["theflixer.tv",142],["thememypc.net",142],["thetechzone.online",142],["thripy.com",142],["tonnestreamz.xyz",142],["torrentdosfilmes.eu",142],["travelplanspro.com",142],["turcasmania.com",142],["tusfiles.com",142],["tvonlinesports.com",142],["ultramovies.org",142],["uploadbank.com",142],["urdubolo.pk",142],["vidspeeds.com",142],["vumoo.to",142],["warezsite.net",142],["watchmovies2.com",142],["watchmoviesforfree.org",142],["watchofree.com",142],["watchsite.net",142],["watchsouthpark.tv",142],["watchtvch.club",142],["web.livecricket.is",142],["webseries.club",142],["worldcupstream.pm",142],["y2mate.com",142],["youapk.net",142],["youtube4kdownloader.com",142],["yts-subs.com",142],["haho.moe",143],["nicy-spicy.pw",144],["fap-guru.cam",145],["novelmultiverse.com",146],["mylegalporno.com",147],["thecut.com",150],["novelism.jp",151],["alphapolis.co.jp",152],["okrzone.com",153],["momo-net.com",154],["maxgaming.fi",154],["guiasaude.info",154],["felizemforma.com",154],["game3rb.com",155],["javhub.net",155],["thotvids.com",156],["berklee.edu",157],["rawkuma.com",158],["imeteo.sk",159],["zive.cz",160],["youtubemp3donusturucu.net",161],["surfsees.com",163],["feyorra.top",164],["claimtrx.com",164],["vivo.st",[165,166]],["alueviesti.fi",168],["kiuruvesilehti.fi",168],["lempaala.ideapark.fi",168],["olutposti.fi",168],["urjalansanomat.fi",168],["joyhints.com",169],["tainhanhvn.com",171],["titantv.com",172],["3cinfo.net",173],["transportationlies.org",174],["cocomanga.com",175],["mcleaks.net",176],["explorecams.com",176],["chillx.top",177],["playerx.stream",177],["m.liputan6.com",179],["stardewids.com",[179,203]],["ingles.com",180],["spanishdict.com",180],["rureka.com",181],["bunkr.is",182],["amateur8.com",183],["freeporn8.com",183],["maturetubehere.com",183],["embedo.co",184],["corriere.it",185],["oggi.it",185],["2the.space",186],["apkcombo.com",188],["sponsorhunter.com",189],["coinscap.info",190],["cryptowidgets.net",190],["greenenez.com",190],["insurancegold.in",190],["webfreetools.net",190],["wiki-topia.com",190],["bitcotasks.com",190],["videolyrics.in",190],["manofadan.com",190],["cempakajaya.com",190],["carsmania.net",190],["carstopia.net",190],["coinsvalue.net",190],["cookinguide.net",190],["freeoseocheck.com",190],["makeupguide.net",190],["tagecoin.com",190],["doge25.in",190],["king-ptcs.com",190],["claimcoins.site",190],["cryptosh.pro",190],["cryptoearnfaucet.com",190],["coinsrev.com",190],["ohionowcast.info",190],["wiour.com",190],["go.freetrx.fun",190],["bitzite.com",190],["eftacrypto.com",190],["fescrypto.com",190],["appsbull.com",190],["diudemy.com",190],["maqal360.com",190],["soft98.ir",191],["novelssites.com",192],["haxina.com",193],["cryptofenz.xyz",193],["upshrink.com",194],["torrentmac.net",195],["moviezaddiction.icu",196],["dlpanda.com",197],["socialmediagirls.com",198],["einrichtungsbeispiele.de",199],["weadown.com",200],["molotov.tv",201],["freecoursesonline.me",202],["dropnudes.com",202],["ftuapps.dev",202],["onehack.us",202],["paste.bin.sx",202],["privatenudes.com",202],["commands.gg",203],["smgplaza.com",204],["autosport.com",[205,206]],["motorsport.com",[205,206]],["freepik.com",207],["filepress.lol",208],["pinloker.com",209],["sekilastekno.com",209],["diyphotography.net",210],["bitchesgirls.com",211],["shopforex.online",212],["ltc25.in",[213,214]],["yesmangas1.com",215],["programmingeeksclub.com",216],["hlspanel.xyz",217],["easymc.io",218],["shoot-yalla.tv",219],["diendancauduong.com",220],["parentcircle.com",221],["h-game18.xyz",222],["nopay.info",223],["wheelofgold.com",224],["shortlinks.tech",225],["recipahi.com",226],["mrproblogger.com",228],["themezon.net",228],["perchance.org",229],["skill4ltu.eu",230],["freepikdownloader.com",231],["freepasses.org",232],["iusedtobeaboss.com",233],["blogtruyenmoi.com",234],["repretel.com",235],["igay69.com",236],["cbc.ca",237]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",8],["ganool",8],["pirate",8],["piratebay",8],["pirateproxy",8],["proxytpb",8],["thepiratebay",8],["limetorrents",[10,17]],["king-pes",10],["depedlps",10],["komikcast",10],["idedroidsafelink",10],["links-url",10],["eikaiwamastery",10],["ak4eg",10],["xhamster",11],["xhamster1",11],["xhamster5",11],["xhamster7",11],["rexporn",11],["movies07",11],["pornocomics",11],["streanplay",12],["steanplay",12],["liferayiseasy",[13,14]],["pahe",17],["yts",17],["tube8",17],["topeuropix",17],["moviescounter",17],["torrent9",17],["desiremovies",17],["movs4u",17],["uwatchfree",17],["hydrax",17],["4movierulz",17],["projectfreetv",17],["arabseed",17],["btdb",[17,59]],["skymovieshd",17],["pagalmovies",17],["7starhd",[17,82]],["1jalshamoviez",17],["9xupload",17],["bdupload",17],["desiupload",17],["rdxhd1",17],["world4ufree",17],["streamsport",17],["rojadirectatvhd",17],["userload",17],["freecoursesonline",19],["lordpremium",19],["todovieneok",19],["novablogitalia",19],["anisubindo",19],["btvsports",19],["adyou",20],["fxporn69",22],["watchseries",25],["pornktube",25],["sexwebvideo",30],["pornomoll",30],["mejortorrent",33],["mejortorrento",33],["mejortorrents",33],["mejortorrents1",33],["mejortorrentt",33],["grantorrent",33],["gntai",33],["allcalidad",[33,49]],["gsurl",34],["mimaletadepeliculas",35],["burningseries",36],["dz4soft",37],["yoututosjeff",37],["ebookmed",37],["lanjutkeun",37],["novelasesp",37],["singingdalong",37],["doujindesu",37],["xmovies8",40],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",48],["newpelis",[49,57]],["pelix",[49,57]],["khatrimaza",49],["camwhores",51],["camwhorestv",51],["uproxy",51],["nekopoi",54],["mirrorace",63],["dbupload",71],["nuvid",72],["mixdrp",73],["asiansex",75],["japanfuck",75],["japanporn",75],["teensex",75],["vintagetube",75],["xxxmovies",75],["zooqle",79],["hdfull",83],["mangamanga",84],["streameast",86],["thestreameast",86],["vev",90],["vidop",90],["zone-telechargement",92],["megalink",98],["gmx",99],["mega1080p",104],["9hentai",107],["gaypornhdfree",114],["cinemakottaga",114],["privatemoviez",114],["apkmaven",114],["popcornstream",116],["moviessources",139],["goload",[141,142]],["0gomovie",142],["0gomovies",142],["123moviefree",142],["1kmovies",142],["1madrasdub",142],["1primewire",142],["2embed",142],["2madrasdub",142],["2umovies",142],["4anime",142],["9xmovies",142],["altadefinizione01",142],["anitube",142],["atomixhq",142],["beinmatch",142],["brmovies",142],["cima4u",142],["clicknupload",142],["cmovies",142],["couchtuner",142],["cricfree",142],["crichd",142],["databasegdriveplayer",142],["dood",142],["f1stream",142],["faselhd",142],["fbstream",142],["file4go",142],["filemoon",142],["filepress",142],["filmlinks4u",142],["filmpertutti",142],["filmyzilla",142],["fmovies",142],["french-stream",142],["fsapi",142],["fzlink",142],["gdriveplayer",142],["gofilms4u",142],["gogoanime",142],["gomoviefree",142],["gomoviz",142],["gowatchseries",142],["hdmoviefair",142],["hdmovies4u",142],["hdmovies50",142],["hdmoviesfair",142],["hh3dhay",142],["hindilinks4u",142],["hotmasti",142],["hurawatch",142],["klmanga",142],["klubsports",142],["libertestreamvf",142],["livetvon",142],["manga1000",142],["manga1001",142],["mangaraw",142],["mangarawjp",142],["mlbstream",142],["motogpstream",142],["movierulz",142],["movies123",142],["movies2watch",142],["moviesden",142],["moviezaddiction",142],["myflixer",142],["nbastream",142],["netcine",142],["nflstream",142],["nhlstream",142],["onlinewatchmoviespk",142],["pctfenix",142],["pctnew",142],["pksmovies",142],["plyjam",142],["plylive",142],["pogolinks",142],["popcorntime",142],["poscitech",142],["prmovies",142],["rugbystreams",142],["shahed4u",142],["sflix",142],["sitesunblocked",142],["socceronline",142],["solarmovies",142],["sportcast",142],["sportskart",142],["sports-stream",142],["streaming-french",142],["streamers",142],["streamingcommunity",142],["strikeout",142],["t20cup",142],["tennisstreams",142],["toonanime",142],["tvply",142],["ufcstream",142],["uptomega",142],["uqload",142],["vudeo",142],["vidoo",142],["vipbox",142],["vipboxtv",142],["vipleague",142],["viprow",142],["yesmovies",142],["yomovies",142],["yomovies1",142],["yt2mp3s",142],["kat",142],["katbay",142],["kickass",142],["kickasshydra",142],["kickasskat",142],["kickass2",142],["kickasstorrents",142],["kat2",142],["kattracker",142],["thekat",142],["thekickass",142],["kickassz",142],["kickasstorrents2",142],["topkickass",142],["kickassgo",142],["kkickass",142],["kkat",142],["kickasst",142],["kick4ss",142],["guardaserie",148],["cine-calidad",149],["milfnut",154],["videovard",167],["softonic",187],["bg-gledai",202],["gledaitv",202],["motchill",227]]);

const exceptionsMap = new Map([["mentor.duden.de",[85]],["forum.soft98.ir",[191]]]);

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const reType = safe.patternToRegex(type);
    const rePattern = safe.patternToRegex(pattern);
    const log = shouldLog(extraArgs);
    const debug = shouldDebug(extraArgs);
    const trapEddEventListeners = ( ) => {
        const eventListenerHandler = {
            apply: function(target, thisArg, args) {
                let type, handler;
                try {
                    type = String(args[0]);
                    handler = String(args[1]);
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
        'Error': self.Error,
        'Math_floor': Math.floor,
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

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
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
