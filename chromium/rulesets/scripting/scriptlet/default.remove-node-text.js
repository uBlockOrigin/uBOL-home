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

/* eslint-disable indent */

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_removeNodeText = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","/==undefined.*body/"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","/adbl/i"],["script","Reflect"],["script","document.write"],["script","deblocker"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","exdynsrv"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","/\\badblock\\b/"],["script","/block-adb|-0x|ad block|alert/"],["script","myreadCookie"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","popUnderUrl"],["script","Adblock"],["script","alert"],["script","/adb/i"],["script","/ABDetected|navigator.brave|fetch/"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","/popup/i"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script",";break;case $."],["script","adb_detected"],["script","window.open"],["script","/aclib|break;|zoneNativeSett/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","/FingerprintJS|openPopup/"],["script","/event\\.keyCode|DisableDevtool/"],["script","/WebAssembly|forceunder/"],["script","popundersPerIP"],["script","wpadmngr.com"],["script","/adb|offsetWidth/i"],["script","contextmenu"],["script","/adblock|var Data.*];/"],["script","replace"],["script",";}}};break;case $."],["script","globalThis;break;case"],["script","{delete window["],["style","text-decoration"],["script","/break;case|FingerprintJS/"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","googlesyndication"],["script","blockAdBlock"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","error-report.com"],["script","KCgpPT57bGV0IGU"],["script","adShield"],["script","Ad-Shield"],["script","adrecover.com"],["script","html-load.com"],["script",".slice(-2);return decodeURIComponent"],["script","AdblockRegixFinder"],["script","/adScript|adsBlocked/"],["script","serve"],["script","?metric=transit.counter&key=fail_redirect&tags="],["script","/pushAdTag|link_click|getAds/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["style","body:not(.ownlist)"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","/decodeURIComponent\\(escape|fairAdblock/"],["script","/ai_|googletag|adb/"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","AdBlock"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","insertAdjacentHTML"],["script","popUnder"],["script","adb"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","navigator.brave"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","app_checkext"],["script","clientHeight"],["script","await"],["script","!window.adngin"],["script","axios"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","\"\").split(\",\")[4]"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","AaDetector"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","/document\\.head\\.appendChild|window\\.open/"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","detect"],["script","fetch"],["script","document.createTextNode"],["script","/h=decodeURIComponent|popundersPerIP|adserverDomain/"],["script","/shown_at|WebAssembly/"],["script","style"],["script","shown_at"],["script","adsSrc"],["script","/adblock|popunder|openedPop|WebAssembly/"],["script","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/"],["script","window.warn"],["script","adBlock"],["script","adBlockDetected"],["script","/fetch|adb/i"],["script","location"],["script","adblockimg"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","displayAdsV3"],["script","adblocker"],["script","break;case"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","/adserverDomain|\\);break;case /"],["script","initializeInterstitial"],["script","popupBackground"],["script","Math.floor"],["script","m9-ad-modal"],["script","Anzeige"],["script","blocking"],["script","adBlockNotice"],["script","advads"],["script","document.cookie"],["script","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/"],["script","/_0x|brave|onerror/"],["script","kmtAdsData"],["script","wpadmngr"],["script","navigator.userAgent"],["script","minBid"],["script","WebAssembly"],["script","checkAdBlock"],["script","detectedAdblock"],["script","setADBFlag"],["script","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/"],["script","/wpadmngr|adserverDomain/"],["script","/account_ad_blocker|tmaAB/"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/^Function\\(\\\"/"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","adBlockEnabled"],["script","/ \\=\\=\\= [0-9]{1","2}\\) \\{ \\}/"],["script","\"data-adm-url\""],["script","NREUM"]];

const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",0],["unsere-helden.com",0],["weltfussball.at",0],["watson.de",0],["moviepilot.de",[0,4]],["mactechnews.de",0],["sport1.de",0],["welt.de",0],["aupetitparieur.com",1],["allthingsvegas.com",1],["100percentfedup.com",1],["beforeitsnews.com",1],["concomber.com",1],["conservativebrief.com",1],["conservativefiringline.com",1],["dailylol.com",1],["funnyand.com",1],["letocard.fr",1],["mamieastuce.com",1],["meilleurpronostic.fr",1],["patriotnationpress.com",1],["toptenz.net",1],["vitamiiin.com",1],["writerscafe.org",1],["populist.press",1],["dailytruthreport.com",1],["livinggospeldaily.com",1],["first-names-meanings.com",1],["welovetrump.com",1],["thehayride.com",1],["thelibertydaily.com",1],["thepoke.co.uk",1],["thepolitistick.com",1],["theblacksphere.net",1],["shark-tank.com",1],["naturalblaze.com",1],["greatamericanrepublic.com",1],["dailysurge.com",1],["truthlion.com",1],["flagandcross.com",1],["westword.com",1],["republicbrief.com",1],["freedomfirstnetwork.com",1],["phoenixnewtimes.com",1],["designbump.com",1],["clashdaily.com",1],["madworldnews.com",1],["reviveusa.com",1],["sonsoflibertymedia.com",1],["thedesigninspiration.com",1],["videogamesblogger.com",1],["protrumpnews.com",1],["thepalmierireport.com",1],["kresy.pl",1],["thepatriotjournal.com",1],["gellerreport.com",1],["thegatewaypundit.com",1],["wltreport.com",1],["miaminewtimes.com",1],["politicalsignal.com",1],["rightwingnews.com",1],["bigleaguepolitics.com",1],["comicallyincorrect.com",1],["web.de",2],["skidrowreloaded.com",[3,14]],["embedsports.me",[3,62]],["embedstream.me",[3,13,14,58,62]],["jumbtv.com",[3,62]],["reliabletv.me",[3,62]],["topembed.pw",[3,60,200]],["crackstreamer.net",3],["methstreamer.com",3],["rnbastreams.com",3],["1stream.eu",3],["4kwebplay.xyz",3],["antennasports.ru",3],["buffsports.me",[3,58]],["buffstreams.app",3],["claplivehdplay.ru",[3,200]],["cracksports.me",[3,13]],["euro2024direct.ru",3],["ext.to",3],["eztv.tf",3],["eztvx.to",3],["kenitv.me",[3,13,14]],["lewblivehdplay.ru",[3,200]],["mlbbite.net",3],["mlbstreams.ai",3],["qatarstreams.me",[3,13]],["qqwebplay.xyz",[3,200]],["soccerworldcup.me",[3,13]],["topstreams.info",3],["totalsportek.to",3],["viwlivehdplay.ru",3],["vidco.pro",[3,58]],["cinedesi.in",5],["intro-hd.net",5],["monacomatin.mc",5],["nodo313.net",5],["hesgoal-tv.io",5],["hesgoal-vip.io",5],["yts.mx",7],["magesypro.com",8],["pinsystem.co.uk",8],["elrellano.com",8],["tinyppt.com",8],["veganab.co",8],["camdigest.com",8],["learnmany.in",8],["amanguides.com",[8,34]],["highkeyfinance.com",[8,34]],["appkamods.com",8],["techacode.com",8],["djqunjab.in",8],["downfile.site",8],["expertvn.com",8],["trangchu.news",8],["3dmodelshare.org",8],["nulleb.com",8],["asiaon.top",8],["coursesghar.com",8],["thecustomrom.com",8],["snlookup.com",8],["bingotingo.com",8],["ghior.com",8],["3dmili.com",8],["karanpc.com",8],["plc247.com",8],["apkdelisi.net",8],["javindo.eu.org",8],["chindohot.site",8],["freepasses.org",8],["tomarnarede.pt",8],["basketballbuzz.ca",8],["dribbblegraphics.com",8],["kemiox.com",8],["checkersmenu.us",8],["teksnologi.com",8],["bharathwick.com",8],["descargaspcpro.net",8],["dx-tv.com",8],["rt3dmodels.com",8],["plc4me.com",8],["blisseyhusbands.com",8],["madaradex.org",8],["trigonevo.com",8],["franceprefecture.fr",8],["jazbaat.in",8],["aipebel.com",8],["audiotools.blog",8],["embdproxy.xyz",8],["upornia.com",10],["germancarforum.com",12],["cybercityhelp.in",12],["innateblogger.com",12],["streamnoads.com",[13,14,51,58]],["bowfile.com",13],["cloudvideo.tv",[13,58]],["coloredmanga.com",13],["exeo.app",13],["hiphopa.net",[13,14]],["megaup.net",13],["olympicstreams.co",[13,58]],["tv247.us",[13,14]],["uploadhaven.com",13],["userscloud.com",[13,58]],["mlbbox.me",13],["neodrive.xyz",13],["mdfx9dc8n.net",14],["mdzsmutpcvykb.net",14],["mixdrop21.net",14],["mixdropjmk.pw",14],["141jav.com",14],["1bit.space",14],["1bitspace.com",14],["345movies.com",14],["3dporndude.com",14],["4archive.org",14],["4horlover.com",14],["560pmovie.com",14],["60fps.xyz",14],["85tube.com",14],["85videos.com",14],["aazzz.xyz",14],["acefile.co",14],["actusports.eu",14],["adclickersbot.com",14],["adricami.com",14],["adslink.pw",14],["adultstvlive.com",14],["adz7short.space",14],["aeblender.com",14],["ahdafnews.blogspot.com",14],["ak47sports.com",14],["akuma.moe",14],["allplayer.tk",14],["allstreaming.online",14],["amadoras.cf",14],["amadorasdanet.shop",14],["amateurblog.tv",14],["androidadult.com",14],["anhsexjav.xyz",14],["anidl.org",14],["anime-loads.org",14],["animeblkom.net",14],["animefire.plus",14],["animelek.me",14],["animespire.net",14],["animestotais.xyz",14],["animeyt.es",14],["anroll.net",14],["anymoviess.xyz",14],["aotonline.org",14],["asenshu.com",14],["asialiveaction.com",14],["asianclipdedhd.net",14],["askim-bg.com",14],["asumsikedaishop.com",14],["avcrempie.com",14],["avseesee.com",14],["gettapeads.com",[14,51]],["backfirstwo.com",14],["bajarjuegospcgratis.com",14],["balkanportal.net",14],["balkanteka.net",14],["bdnewszh.com",[14,58]],["belowporn.com",14],["bestclaimtrx.xyz",14],["bestgirlsexy.com",14],["bestnhl.com",14],["bestporn4free.com",14],["bestporncomix.com",14],["bet36.es",14],["bikinitryon.net",14],["birdurls.com",14],["bitsearch.to",14],["blackcockadventure.com",14],["blackcockchurch.org",14],["blackporncrazy.com",14],["blizzboygames.net",14],["blizzpaste.com",14],["blkom.com",14],["blog-peliculas.com",14],["blogtrabalhista.com",14],["bobsvagene.club",14],["bolly4umovies.click",14],["bonusharian.pro",14],["brilian-news.id",14],["brupload.net",14],["bucitana.com",14],["cablegratis.online",14],["camchickscaps.com",14],["camgirlcum.com",14],["camgirls.casa",14],["cashurl.in",14],["castingx.net",14],["ccurl.net",[14,58]],["celebrity-leaks.net",14],["cgpelis.net",14],["charexempire.com",14],["choosingnothing.com",14],["clasico.tv",14],["clik.pw",14],["coin-free.com",[14,31]],["coins100s.fun",14],["comicsmanics.com",14],["compucalitv.com",14],["coolcast2.com",14],["cosplaytab.com",14],["countylocalnews.com",14],["cpmlink.net",14],["crackstreamshd.click",14],["crespomods.com",14],["crisanimex.com",14],["crunchyscan.fr",14],["cuevana3.fan",14],["cuevana3hd.com",14],["cumception.com",14],["cutpaid.com",14],["cypherscans.xyz",[14,58]],["dailyuploads.net",14],["datawav.club",14],["daughtertraining.com",14],["deepgoretube.site",14],["deltabit.co",14],["deporte-libre.top",14],["depvailon.com",14],["derleta.com",14],["desivdo.com",14],["desixx.net",14],["detikkebumen.com",14],["deutschepornos.me",14],["diasoft.xyz",14],["directupload.net",14],["diskusscan.com",14],["dixva.com",14],["doctormalay.com",14],["dofusports.xyz",14],["dogemate.com",14],["doods.cam",14],["doodskin.lat",14],["downloadrips.com",14],["downvod.com",14],["dphunters.mom",14],["dragontranslation.com",14],["duddes.xyz",14],["dvdfullestrenos.com",14],["easylinks.in",14],["ebookbb.com",14],["ebookhunter.net",14],["egyanime.com",14],["egygost.com",14],["egyshare.cc",14],["ekasiwap.com",14],["electro-torrent.pl",14],["elil.cc",14],["embed4u.xyz",14],["eplayer.click",14],["erovoice.us",14],["eroxxx.us",14],["estrenosdoramas.net",14],["everia.club",14],["everythinginherenet.blogspot.com",14],["extrafreetv.com",14],["extremotvplay.com",14],["fapinporn.com",14],["fapptime.com",14],["fashionblog.tv",14],["fastreams.live",14],["faucethero.com",14],["fembed.com",14],["femdom-joi.com",14],["fileone.tv",14],["film1k.com",14],["filmeonline2023.net",14],["filmesonlinex.org",14],["filmesonlinexhd.biz",[14,58]],["filmovitica.com",14],["filmymaza.blogspot.com",14],["filthy.family",14],["firstmovies.to",14],["fixfinder.click",14],["flostreams.xyz",14],["flyfaucet.com",14],["footyhunter.lol",14],["footyhunter3.xyz",[14,58]],["forex-trnd.com",14],["forumchat.club",14],["forumlovers.club",14],["freemoviesonline.biz",14],["freeomovie.co.in",14],["freeomovie.to",14],["freeporncomic.net",14],["freepornhdonlinegay.com",14],["freeproxy.io",14],["freeuse.me",14],["freeusexporn.com",14],["fsicomics.com",14],["gambarbogel.xyz",14],["gamepcfull.com",14],["gameronix.com",14],["gamesfullx.com",14],["gameshdlive.net",14],["gameshdlive.xyz",14],["gamesmountain.com",14],["gamesrepacks.com",14],["gamingguru.fr",14],["gamovideo.com",14],["garota.cf",14],["gaydelicious.com",14],["gaypornmasters.com",14],["gaysex69.net",14],["gemstreams.com",14],["get-to.link",14],["girlscanner.org",14],["giurgiuveanul.ro",14],["gledajcrtace.xyz",14],["gocast2.com",14],["gomo.to",14],["gostosa.cf",14],["gtlink.co",14],["gwiazdypornosow.pl",14],["haho.moe",14],["hatsukimanga.com",14],["hayhd.net",14],["hdsaprevodom.com",14],["hdstreamss.club",14],["hentais.tube",14],["hentaistream.co",14],["hentaitk.net",14],["hentaitube.online",14],["hentaiworld.tv",14],["hesgoal.tv",14],["hexupload.net",14],["hhkungfu.tv",14],["highlanderhelp.com",14],["hindimean.com",14],["hindimovies.to",[14,58]],["hiperdex.com",14],["hispasexy.org",14],["hitprn.com",14],["hoca4u.com",14],["hollymoviehd.cc",14],["hoodsite.com",14],["hopepaste.download",14],["hornylips.com",14],["hotgranny.live",14],["hotmama.live",14],["hqcelebcorner.net",14],["huren.best",14],["hwnaturkya.com",[14,58]],["hxfile.co",[14,58]],["igfap.com",14],["ihdstreams.xyz",14],["iklandb.com",14],["illink.net",14],["imgkings.com",14],["imgsex.xyz",14],["imx.to",14],["influencersgonewild.org",14],["infosgj.free.fr",14],["investnewsbrazil.com",14],["itdmusics.com",14],["itsuseful.site",14],["itunesfre.com",14],["iwatchfriendsonline.net",[14,117]],["jackstreams.com",14],["jatimupdate24.com",14],["jav-fun.cc",14],["jav-noni.cc",14],["jav-scvp.com",14],["javcl.com",14],["javf.net",14],["javhay.net",14],["javhoho.com",14],["javhun.com",14],["javleak.com",14],["javporn.best",14],["javsek.net",14],["javsex.to",14],["javtiful.com",[14,28]],["jimdofree.com",14],["jiofiles.org",14],["jorpetz.com",14],["journalyc.online",14],["jp-films.com",14],["jpop80ss3.blogspot.com",14],["jpopsingles.eu",[14,176]],["kantotflix.net",14],["kantotinyo.com",14],["kaoskrew.org",14],["kaplog.com",14],["keralatvbox.com",14],["kickassanimes.io",14],["kimochi.info",14],["kimochi.tv",14],["kinemania.tv",14],["konstantinova.net",14],["koora-online.live",14],["kunmanga.com",14],["kutmoney.com",14],["kwithsub.com",14],["ladangreceh.xyz",14],["lat69.me",14],["latinblog.tv",14],["latinomegahd.net",14],["lazyfaucet.com",14],["leechpremium.link",14],["legendas.dev",14],["legendei.net",14],["lightdlmovies.blogspot.com",14],["lighterlegend.com",14],["linclik.com",14],["linkebr.com",14],["linkrex.net",14],["links.worldfree4u-lol.online",14],["linksfy.co",14],["lody.ink",14],["lovesomecommunity.com",14],["lulu.st",14],["lulustream.com",[14,60]],["luluvdo.com",14],["luzcameraeacao.shop",14],["manga-oni.com",14],["mangaboat.com",14],["mangagenki.me",14],["mangahere.onl",14],["mangaweb.xyz",14],["mangoporn.net",14],["manhwahentai.me",14],["masahub.com",14],["masahub.net",14],["maturegrannyfuck.com",14],["mdy48tn97.com",14],["mediapemersatubangsa.com",14],["mega-mkv.com",14],["megapastes.com",14],["megapornpics.com",14],["messitv.net",14],["meusanimes.net",14],["milfmoza.com",14],["milfzr.com",14],["millionscast.com",14],["mimaletamusical.blogspot.com",14],["mitly.us",14],["mkv-pastes.com",14],["modb.xyz",14],["monaskuliner.ac.id",14],["moredesi.com",14],["movgotv.net",14],["movi.pk",14],["movierr.online",14],["movieswbb.com",14],["moviewatch.com.pk",14],["mp4upload.com",14],["mrskin.live",14],["multicanaistv.com",14],["mundowuxia.com",14],["myeasymusic.ir",14],["myonvideo.com",14],["myyouporn.com",14],["narutoget.info",14],["naughtypiss.com",14],["nerdiess.com",14],["new-fs.eu",14],["newtorrentgame.com",14],["nflstreams.me",14],["niaomea.me",[14,58]],["nicekkk.com",14],["nicesss.com",14],["nlegs.com",14],["nolive.me",[14,58]],["notformembersonly.com",14],["novamovie.net",14],["novelpdf.xyz",14],["novelssites.com",[14,58]],["novelup.top",14],["nsfwr34.com",14],["nu6i-bg-net.com",14],["nudebabesin3d.com",14],["nukedfans.com",14],["nuoga.eu",14],["nzbstars.com",14],["ohjav.com",14],["ojearnovelas.com",14],["okanime.xyz",14],["olarixas.xyz",14],["oldbox.cloud",14],["olweb.tv",14],["olympicstreams.me",14],["on9.stream",14],["oncast.xyz",14],["onepiece-mangaonline.com",14],["onifile.com",14],["onionstream.live",14],["onlinesaprevodom.net",14],["onlyfullporn.video",14],["onplustv.live",14],["originporn.com",14],["ovagames.com",14],["ovamusic.com",14],["packsporn.com",14],["pahaplayers.click",14],["palimas.org",14],["pandafiles.com",14],["papahd.club",14],["papahd1.xyz",14],["password69.com",14],["pastemytxt.com",14],["payskip.org",14],["peeplink.in",14],["peliculasmx.net",14],["pervertgirlsvideos.com",14],["pervyvideos.com",14],["phim12h.com",14],["picdollar.com",14],["pickteenz.com",14],["pics4you.net",14],["picsxxxporn.com",14],["pinayscandalz.com",14],["pinkueiga.net",14],["piratefast.xyz",14],["piratehaven.xyz",14],["pirateiro.com",14],["pirlotvonline.org",14],["playtube.co.za",14],["plugintorrent.com",14],["pmvzone.com",14],["porndish.com",14],["pornez.net",14],["pornfetishbdsm.com",14],["pornfits.com",14],["pornhd720p.com",14],["pornobr.club",14],["pornobr.ninja",14],["pornodominicano.net",14],["pornofaps.com",14],["pornoflux.com",14],["pornotorrent.com.br",14],["pornredit.com",14],["pornstarsyfamosas.es",14],["pornstreams.co",14],["porntn.com",14],["pornxbit.com",14],["pornxday.com",14],["portaldasnovinhas.shop",14],["portugues-fcr.blogspot.com",14],["poscishd.online",14],["poscitesch.com",[14,58]],["poseyoung.com",14],["pover.org",14],["proxyninja.org",14],["pubfilmz.com",14],["publicsexamateurs.com",14],["punanihub.com",14],["putlocker5movies.org",14],["pxxbay.com",14],["r18.best",14],["ragnaru.net",14],["rapbeh.net",14],["rapelust.com",14],["rapload.org",14],["read-onepiece.net",14],["retro-fucking.com",14],["retrotv.org",14],["robaldowns.com",14],["rockdilla.com",14],["rojadirectatvenvivo.com",14],["rojitadirecta.blogspot.com",14],["romancetv.site",14],["rsoccerlink.site",14],["rule34.club",14],["rule34hentai.net",14],["rumahbokep-id.com",14],["safego.cc",14],["safestream.cc",14],["sakurafile.com",14],["satoshi-win.xyz",14],["scat.gold",14],["scatfap.com",14],["scatkings.com",14],["scnlog.me",14],["scripts-webmasters.net",14],["serie-turche.com",14],["serijefilmovi.com",14],["sexcomics.me",14],["sexdicted.com",14],["sexgay18.com",14],["sexofilm.co",14],["sextgem.com",14],["sextubebbw.com",14],["sgpics.net",14],["shadowrangers.live",14],["shahee4u.cam",14],["shahiid-anime.net",14],["shemale6.com",14],["shinden.pl",14],["short.es",14],["showmanga.blog.fc2.com",14],["shrt10.com",14],["shurt.pw",14],["sideplusleaks.net",14],["silverblog.tv",14],["silverpic.com",14],["sinhalasub.life",14],["sinsitio.site",14],["sinvida.me",14],["skidrowcpy.com",14],["skidrowfull.com",14],["slut.mom",14],["smallencode.me",14],["smoner.com",14],["smplace.com",14],["soccerinhd.com",[14,58]],["socceron.name",14],["softairbay.com",14],["sokobj.com",14],["songsio.com",14],["souexatasmais.com",14],["sportbar.live",14],["sportea.online",14],["sportskart.xyz",14],["sportstream1.cfd",14],["srt.am",14],["srts.me",14],["stakes100.xyz",14],["stbemuiptv.com",14],["stockingfetishvideo.com",14],["stream.crichd.vip",14],["stream.lc",14],["stream25.xyz",14],["streambee.to",14],["streamcenter.pro",14],["streamers.watch",14],["streamgo.to",14],["streamkiste.tv",14],["streamoporn.xyz",14],["streamoupload.xyz",14],["streamservicehd.click",14],["streamvid.net",[14,23]],["subtitleporn.com",14],["subtitles.cam",14],["suicidepics.com",14],["supertelevisionhd.com",14],["supexfeeds.com",14],["swiftload.io",14],["swzz.xyz",14],["sxnaar.com",14],["tabooporns.com",14],["taboosex.club",14],["tapeantiads.com",[14,51]],["tapeblocker.com",[14,51]],["tapenoads.com",[14,51]],["tapewithadblock.org",[14,51,226]],["teamos.xyz",14],["teen-wave.com",14],["teenporncrazy.com",14],["telegramgroups.xyz",14],["telenovelasweb.com",14],["tensei-shitara-slime-datta-ken.com",14],["tfp.is",14],["tgo-tv.co",[14,58]],["thaihotmodels.com",14],["theblueclit.com",14],["thebussybandit.com",14],["thedaddy.to",[14,198]],["theicongenerator.com",14],["thelastdisaster.vip",14],["thepiratebay0.org",14],["thepiratebay10.info",14],["thesexcloud.com",14],["thothub.today",14],["tightsexteens.com",14],["tojav.net",14],["tokyoblog.tv",14],["tonnestreamz.xyz",14],["top16.net",14],["topvideosgay.com",14],["torrage.info",14],["torrents.vip",14],["torrsexvid.com",14],["tpb-proxy.xyz",14],["trannyteca.com",14],["trendytalker.com",14],["tumanga.net",14],["turbogvideos.com",14],["turbovid.me",14],["turkishseriestv.org",14],["turksub24.net",14],["tutele.sx",14],["tutelehd3.xyz",14],["tvglobe.me",14],["tvpclive.com",14],["tvs-widget.com",14],["tvseries.video",14],["ucptt.com",14],["ufaucet.online",14],["ufcfight.online",14],["uhdgames.xyz",14],["ultrahorny.com",14],["ultraten.net",14],["unblockweb.me",14],["underhentai.net",14],["uniqueten.net",14],["upbaam.com",14],["upstream.to",14],["valeriabelen.com",14],["verdragonball.online",14],["vfxmed.com",14],["video.az",14],["videostreaming.rocks",14],["videowood.tv",14],["vidorg.net",14],["vidtapes.com",14],["vidz7.com",14],["vikistream.com",14],["vikv.net",14],["virpe.cc",14],["visifilmai.org",14],["viveseries.com",14],["vladrustov.sx",14],["volokit2.com",[14,198]],["vstorrent.org",14],["w-hentai.com",14],["watchaccordingtojimonline.com",14],["watchbrooklynnine-nine.com",14],["watchdowntonabbeyonline.com",14],["watchelementaryonline.com",14],["watcheronline.net",14],["watchgleeonline.com",14],["watchhowimetyourmother.online",14],["watchkobestreams.info",14],["watchlostonline.net",14],["watchlouieonline.com",14],["watchjavidol.com",14],["watchmadmenonline.com",14],["watchmonkonline.com",14],["watchonceuponatimeonline.com",14],["watchparksandrecreation.net",14],["watchprettylittleliarsonline.com",14],["watchrulesofengagementonline.com",14],["watchthekingofqueens.com",14],["watchthemiddleonline.com",14],["watchtvchh.xyz",14],["webcamrips.com",14],["wickedspot.org",14],["wincest.xyz",14],["witanime.best",14],["wolverdon.fun",14],["wolverdonx.com",14],["wordcounter.icu",14],["worldcupstream.pm",14],["worldmovies.store",14],["worldstreams.click",14],["wpdeployit.com",14],["wqstreams.tk",14],["wwwsct.com",14],["xanimeporn.com",14],["xblog.tv",14],["xn--verseriesespaollatino-obc.online",14],["xn--xvideos-espaol-1nb.com",14],["xpornium.net",14],["xsober.com",14],["xvip.lat",14],["xxgasm.com",14],["xxvideoss.org",14],["xxx18.uno",14],["xxxdominicana.com",14],["xxxfree.watch",14],["xxxmax.net",14],["xxxwebdlxxx.top",14],["xxxxvideo.uno",14],["y2b.wiki",14],["yabai.si",14],["yadixv.com",14],["yayanimes.net",14],["yeshd.net",14],["yodbox.com",14],["youjax.com",14],["youpits.xyz",14],["yourdailypornvideos.ws",14],["yourupload.com",14],["ytstv.me",14],["ytstvmovies.co",14],["ytstvmovies.xyz",14],["ytsyify.co",14],["ytsyifymovie.com",14],["zerion.cc",14],["zerocoin.top",14],["zitss.xyz",14],["zpaste.net",14],["zplayer.live",14],["1337x.ninjaproxy1.com",14],["y2tube.pro",14],["freeshot.live",14],["fastreams.com",14],["redittsports.com",14],["sky-sports.store",14],["streamsoccer.site",14],["tntsports.store",14],["wowstreams.co",14],["zdsptv.com",14],["faucet.ovh",15],["oko.sh",[16,43,44]],["variety.com",17],["gameskinny.com",17],["deadline.com",17],["washingtonpost.com",18],["bigbtc.win",19],["cryptofun.space",19],["gosexpod.com",20],["sexo5k.com",21],["truyen-hentai.com",21],["theshedend.com",23],["zeroupload.com",23],["securenetsystems.net",23],["miniwebtool.com",23],["bchtechnologies.com",23],["eracast.cc",23],["spiegel.de",24],["jacquieetmichel.net",25],["hausbau-forum.de",26],["kiemlua.com",26],["appnee.com",27],["tea-coffee.net",29],["spatsify.com",29],["newedutopics.com",29],["getviralreach.in",29],["edukaroo.com",29],["funkeypagali.com",29],["careersides.com",29],["nayisahara.com",29],["wikifilmia.com",29],["infinityskull.com",29],["viewmyknowledge.com",29],["iisfvirtual.in",29],["starxinvestor.com",29],["jkssbalerts.com",29],["kenzo-flowertag.com",30],["mdn.lol",30],["btcbitco.in",31],["btcsatoshi.net",31],["cempakajaya.com",31],["crypto4yu.com",31],["gainl.ink",31],["manofadan.com",31],["readbitcoin.org",31],["wiour.com",31],["tremamnon.com",31],["btc25.org",31],["bitsmagic.fun",31],["ourcoincash.xyz",31],["hynews.biz",31],["blog.cryptowidgets.net",32],["blog.insurancegold.in",32],["blog.wiki-topia.com",32],["blog.coinsvalue.net",32],["blog.cookinguide.net",32],["blog.freeoseocheck.com",32],["aylink.co",33],["sugarona.com",34],["nishankhatri.xyz",34],["cety.app",35],["exego.app",35],["cutlink.net",35],["cutsy.net",35],["cutyurls.com",35],["cutty.app",35],["cutnet.net",35],["tinys.click",36],["answerpython.com",36],["formyanime.com",36],["gsm-solution.com",36],["h-donghua.com",36],["hindisubbedacademy.com",36],["linksdramas2.blogspot.com",36],["pkgovjobz.com",36],["ripexbooster.xyz",36],["serial4.com",36],["serial412.blogspot.com",36],["sigmalinks.in",36],["tutorgaming.com",36],["everydaytechvams.com",36],["dipsnp.com",36],["cccam4sat.com",36],["zeemoontv-24.blogspot.com",36],["stitichsports.com",36],["aiimgvlog.fun",37],["appsbull.com",38],["diudemy.com",38],["maqal360.com",38],["mphealth.online",38],["makefreecallsonline.com",38],["androjungle.com",38],["bookszone.in",38],["drakescans.com",38],["shortix.co",38],["msonglyrics.com",38],["app-sorteos.com",38],["bokugents.com",38],["client.pylexnodes.net",38],["btvplus.bg",38],["blog24.me",[39,40]],["coingraph.us",41],["impact24.us",41],["iconicblogger.com",42],["auto-crypto.click",42],["tvi.la",[43,44]],["iir.la",[43,44]],["tii.la",[43,44]],["ckk.ai",[43,44]],["oei.la",[43,44]],["lnbz.la",[43,44]],["oii.la",[43,44]],["tpi.li",[43,44]],["smutty.com",45],["e-sushi.fr",45],["freeadultcomix.com",45],["down.dataaps.com",45],["filmweb.pl",45],["safetxt.net",45],["atglinks.com",46],["kbconlinegame.com",47],["hamrojaagir.com",47],["odijob.com",47],["blogesque.net",48],["bookbucketlyst.com",48],["explorosity.net",48],["optimizepics.com",48],["torovalley.net",48],["travize.net",48],["trekcheck.net",48],["metoza.net",48],["techlike.net",48],["snaplessons.net",48],["atravan.net",48],["transoa.net",48],["techmize.net",48],["crenue.net",48],["simana.online",49],["fooak.com",49],["joktop.com",49],["evernia.site",49],["falpus.com",49],["financemonk.net",50],["advertisertape.com",51],["tapeadsenjoyer.com",[51,58]],["tapeadvertisement.com",51],["tapelovesads.org",51],["watchadsontape.com",51],["neymartv.net",52],["streamhd247.info",52],["hindimoviestv.com",52],["nowlive1.me",52],["buzter.xyz",52],["gamehdlive.online",52],["hdfungamezz.xyz",52],["kingstreamz.lol",52],["masterpro.club",52],["papahd.co",52],["sportos.co",52],["valhallas.click",52],["cuervotv.me",[52,58]],["aliezstream.pro",52],["daddy-stream.xyz",52],["instream.pro",52],["mylivestream.pro",52],["powerover.online",52],["sportea.link",52],["sportsurge.stream",52],["ufckhabib.com",52],["ustream.pro",52],["papa4k.online",52],["animeshqip.site",52],["apkship.shop",52],["buzter.pro",52],["enjoysports.bond",52],["filedot.to",52],["foreverquote.xyz",52],["hdstream.one",52],["kingstreamz.site",52],["live.fastsports.store",52],["livesnow.me",52],["livesports4u.pw",52],["masterpro.click",52],["nuxhallas.click",52],["papahd.info",52],["rgshows.me",52],["sportmargin.live",52],["sportmargin.online",52],["sportsloverz.xyz",52],["sportzlive.shop",52],["supertipzz.online",52],["totalfhdsport.xyz",52],["ultrastreamlinks.xyz",52],["usgate.xyz",52],["webmaal.cfd",52],["wizistreamz.xyz",52],["worldstreamz.shop",52],["g-porno.com",52],["g-streaming.com",52],["giga-streaming.com",52],["educ4m.com",52],["fromwatch.com",52],["visualnewshub.com",52],["rahim-soft.com",53],["x-video.tube",53],["rubystm.com",53],["streamruby.com",53],["poophd.cc",53],["hyundaitucson.info",54],["exambd.net",55],["cgtips.org",56],["emuenzen.de",57],["adsh.cc",58],["afilmyhouse.blogspot.com",58],["ak.sv",58],["animesultra.com",58],["api.webs.moe",58],["apkmody.io",58],["attvideo.com",58],["backfirstwo.site",[58,145]],["crazyblog.in",58],["divicast.com",58],["dlhd.so",58],["embed.meomeo.pw",58],["filmeserialeonline.org",58],["flexyhit.com",58],["foreverwallpapers.com",58],["french-streams.cc",58],["fslinks.org",58],["hdtoday.to",58],["hinatasoul.com",58],["igg-games.com",58],["infinityscans.net",58],["infinityscans.xyz",58],["mangareader.to",58],["membed.net",58],["mgnetu.com",58],["mp3juice.info",58],["mp3juices.cc",58],["myflixerz.to",58],["nowmetv.net",58],["nowsportstv.com",58],["nxbrew.com",58],["oii.io",58],["paidshitforfree.com",58],["pepperlive.info",58],["playertv.net",58],["putlocker68.com",58],["roystream.com",58],["rssing.com",58],["s.to",58],["share.filesh.site",58],["sharkfish.xyz",58],["skidrowcodex.net",58],["smartermuver.com",58],["sports-stream.site",58],["stream4free.live",58],["tamilmobilemovies.in",58],["thewatchseries.live",58],["tnmusic.in",58],["travelplanspro.com",58],["tusfiles.com",58],["tutlehd4.com",58],["twstalker.com",58],["vid-guard.com",58],["video-leech.xyz",58],["vidsaver.net",58],["vidspeeds.com",58],["viralitytoday.com",58],["voiranime.stream",58],["watchdoctorwhoonline.com",58],["watchserie.online",58],["webhostingpost.com",58],["woxikon.in",58],["www-y2mate.com",58],["ylink.bid",58],["ytix.xyz",58],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",58],["buffshub.stream",60],["cinego.tv",60],["ev01.to",60],["fstream365.com",60],["minoplres.xyz",60],["mostream.us",60],["s3embtaku.pro",60],["sportshub.stream",60],["topcinema.cam",60],["unblocked.id",63],["listendata.com",64],["7xm.xyz",64],["fastupload.io",64],["azmath.info",64],["wouterplanet.com",65],["androidacy.com",66],["pillowcase.su",67],["veryfreeporn.com",68],["theporngod.com",68],["besthdgayporn.com",69],["drivenime.com",69],["javup.org",69],["shemaleup.net",69],["freeroms.com",70],["soap2day-online.com",70],["andhrafriends.com",70],["beatsnoop.com",71],["fetchpik.com",71],["hackerranksolution.in",71],["camsrip.com",71],["help.sakarnewz.com",71],["austiblox.net",73],["btcbunch.com",74],["teachoo.com",75],["automobile-catalog.com",[76,77]],["motorbikecatalog.com",[76,77]],["apkmirror.com",[76,171]],["blog.esuteru.com",76],["blog.livedoor.jp",76],["itainews.com",76],["jin115.com",76],["allthetests.com",76],["javatpoint.com",76],["globalrph.com",76],["carscoops.com",76],["crosswordsolver.com",76],["cruciverba.it",76],["dnevno.hr",76],["dziennik.pl",[76,82]],["ff14net.2chblog.jp",76],["heureka.cz",76],["indiatimes.com",76],["lacuarta.com",[76,81]],["laleggepertutti.it",76],["meeco.kr",76],["mirrored.to",76],["motscroises.fr",76],["news4vip.livedoor.biz",76],["oeffnungszeitenbuch.de",76],["onecall2ch.com",76],["oraridiapertura24.it",76],["palabr.as",76],["petitfute.com",76],["rabitsokuhou.2chblog.jp",76],["rostercon.com",76],["slashdot.org",76],["sourceforge.net",76],["suzusoku.blog.jp",76],["the-crossword-solver.com",76],["thestockmarketwatch.com",76],["wfmz.com",76],["word-grabber.com",76],["wort-suchen.de",76],["yutura.net",76],["zagreb.info",76],["freemcserver.net",76],["golf-live.at",76],["kreuzwortraetsel.de",76],["raetsel-hilfe.de",76],["verkaufsoffener-sonntag.com",76],["horairesdouverture24.fr",76],["nyitvatartas24.hu",76],["modhub.us",76],["yugioh-starlight.com",76],["winfuture.de",76],["talkwithstranger.com",76],["topstarnews.net",76],["islamicfinder.org",76],["secure-signup.net",76],["dramabeans.com",76],["manta.com",76],["tportal.hr",76],["tvtropes.org",76],["wouldurather.io",76],["convertcase.net",76],["interfootball.co.kr",77],["a-ha.io",77],["cboard.net",77],["jjang0u.com",77],["joongdo.co.kr",77],["viva100.com",77],["gamingdeputy.com",77],["thesaurus.net",77],["alle-tests.nl",77],["maketecheasier.com",77],["allthekingz.com",77],["tweaksforgeeks.com",77],["m.inven.co.kr",77],["mlbpark.donga.com",77],["meconomynews.com",77],["brandbrief.co.kr",77],["motorgraph.com",77],["worldhistory.org",78],["lovelive-petitsoku.com",79],["pravda.com.ua",79],["ap7am.com",80],["cinema.com.my",80],["dolldivine.com",80],["giornalone.it",80],["iplocation.net",80],["jutarnji.hr",80],["mediaindonesia.com",80],["slobodnadalmacija.hr",80],["persoenlich.com",81],["syosetu.com",81],["autoby.jp",82],["daily.co.jp",82],["powerpyx.com",82],["webdesignledger.com",82],["wetteronline.de",82],["bitcotasks.com",83],["hilites.today",84],["udvl.com",85],["www.chip.de",[86,87,228]],["topsporter.net",88],["sportshub.to",88],["streamcheck.link",89],["myanimelist.net",90],["unofficialtwrp.com",91],["codec.kyiv.ua",91],["kimcilonlyofc.com",91],["bitcosite.com",92],["bitzite.com",92],["celebzcircle.com",93],["bi-girl.net",93],["hentaiseason.com",93],["hoodtrendspredict.com",93],["osteusfilmestuga.online",93],["ragnarokscanlation.opchapters.com",93],["sampledrive.org",93],["tvappapk.com",93],["twobluescans.com",[93,94]],["varnascan.xyz",93],["hacoos.com",96],["watchhentai.net",97],["hes-goals.io",97],["pkbiosfix.com",97],["casi3.xyz",97],["bondagevalley.cc",98],["zefoy.com",99],["mailgen.biz",100],["tempinbox.xyz",100],["vidello.net",101],["newscon.org",102],["yunjiema.top",102],["pcgeeks-games.com",102],["resizer.myct.jp",103],["gametohkenranbu.sakuraweb.com",104],["jisakuhibi.jp",105],["rank1-media.com",105],["lifematome.blog",106],["fm.sekkaku.net",107],["free-avx.jp",108],["dvdrev.com",109],["betweenjpandkr.blog",110],["nft-media.net",111],["ghacks.net",112],["leak.sx",113],["paste.bin.sx",113],["pornleaks.in",113],["songspk2.info",114],["truyentranhfull.net",115],["fcportables.com",115],["repack-games.com",115],["pawastreams.info",115],["ibooks.to",115],["zoechip.com",116],["nohost.one",116],["nectareousoverelate.com",118],["khoaiphim.com",119],["haafedk2.com",120],["fordownloader.com",120],["jovemnerd.com.br",121],["totalcsgo.com",122],["vivamax.asia",123],["manysex.com",124],["gaminginfos.com",125],["tinxahoivn.com",126],["automoto.it",127],["codelivly.com",128],["lordchannel.com",129],["client.falixnodes.net",130],["novelhall.com",131],["abc17news.com",132],["bailiwickexpress.com",132],["barnsleychronicle.com",132],["chaptercheats.com",132],["commercialobserver.com",132],["competentedigitale.ro",132],["freeconvert.com",132],["imgur.com",132],["kion546.com",132],["lehighvalleylive.com",132],["lettyskitchen.com",132],["lifeinleggings.com",132],["liveandletsfly.com",132],["lizzieinlace.com",132],["localnews8.com",132],["lonestarlive.com",132],["madeeveryday.com",132],["maidenhead-advertiser.co.uk",132],["makeuseof.com",132],["mardomreport.net",132],["melangery.com",132],["milestomemories.com",132],["modernmom.com",132],["momtastic.com",132],["mostlymorgan.com",132],["motherwellmag.com",132],["movieweb.com",132],["muddybootsanddiamonds.com",132],["musicfeeds.com.au",132],["mylifefromhome.com",132],["nationalreview.com",132],["neoskosmos.com",132],["nordot.app",132],["nothingbutnewcastle.com",132],["nsjonline.com",132],["oakvillenews.org",132],["observer.com",132],["ourlittlesliceofheaven.com",132],["palachinkablog.com",132],["patheos.com",132],["pinkonthecheek.com",132],["politicususa.com",132],["predic.ro",132],["puckermom.com",132],["qtoptens.com",132],["realgm.com",132],["reelmama.com",132],["robbreport.com",132],["royalmailchat.co.uk",132],["samchui.com",132],["sandrarose.com",132],["screenrant.com",132],["sherdog.com",132],["sidereel.com",132],["silive.com",132],["simpleflying.com",132],["sloughexpress.co.uk",132],["spacenews.com",132],["sportsgamblingpodcast.com",132],["spotofteadesigns.com",132],["stacysrandomthoughts.com",132],["ssnewstelegram.com",132],["superherohype.com",132],["tablelifeblog.com",132],["thebeautysection.com",132],["thecelticblog.com",132],["thecurvyfashionista.com",132],["thefashionspot.com",132],["thegamer.com",132],["thegamescabin.com",132],["thenerdyme.com",132],["thenonconsumeradvocate.com",132],["theprudentgarden.com",132],["thethings.com",132],["timesnews.net",132],["topspeed.com",132],["toyotaklub.org.pl",132],["travelingformiles.com",132],["tutsnode.org",132],["viralviralvideos.com",132],["wannacomewith.com",132],["wimp.com",[132,134]],["windsorexpress.co.uk",132],["woojr.com",132],["worldoftravelswithkids.com",132],["worldsurfleague.com",132],["xda-developers.com",132],["adoredbyalex.com",132],["agrodigital.com",[132,134]],["al.com",[132,134]],["aliontherunblog.com",[132,134]],["allaboutthetea.com",[132,134]],["allmovie.com",[132,134]],["allmusic.com",[132,134]],["allthingsthrifty.com",[132,134]],["amessagewithabottle.com",[132,134]],["androidpolice.com",132],["antyradio.pl",132],["artforum.com",[132,134]],["artnews.com",[132,134]],["awkward.com",[132,134]],["awkwardmom.com",[132,134]],["becomingpeculiar.com",132],["bethcakes.com",[132,134]],["blogher.com",[132,134]],["bluegraygal.com",[132,134]],["briefeguru.de",[132,134]],["carmagazine.co.uk",132],["cattime.com",132],["cbr.com",132],["cleveland.com",[132,134]],["collider.com",132],["comingsoon.net",132],["crafty.house",132],["dailyvoice.com",[132,134]],["decider.com",[132,134]],["didyouknowfacts.com",[132,134]],["dogtime.com",[132,134]],["dualshockers.com",132],["dustyoldthing.com",132],["faithhub.net",132],["femestella.com",[132,134]],["footwearnews.com",[132,134]],["frogsandsnailsandpuppydogtail.com",[132,134]],["fsm-media.com",132],["funtasticlife.com",[132,134]],["fwmadebycarli.com",[132,134]],["gamerant.com",132],["gfinityesports.com",132],["givemesport.com",132],["gulflive.com",[132,134]],["helloflo.com",132],["homeglowdesign.com",[132,134]],["honeygirlsworld.com",[132,134]],["hotcars.com",132],["howtogeek.com",132],["insider-gaming.com",132],["insurancejournal.com",132],["jasminemaria.com",[132,134]],["masslive.com",[132,134,229]],["mlive.com",[132,134]],["nj.com",[132,134]],["oregonlive.com",[132,134]],["pagesix.com",[132,134,229]],["pennlive.com",[132,134,229]],["sheknows.com",[132,134]],["syracuse.com",[132,134,229]],["tvline.com",[132,134]],["cheatsheet.com",133],["pwinsider.com",133],["baeldung.com",133],["mensjournal.com",133],["15min.lt",134],["247sports.com",[134,229]],["betweenenglandandiowa.com",134],["bgr.com",134],["blu-ray.com",134],["brobible.com",134],["cagesideseats.com",134],["cbsnews.com",[134,229]],["cbssports.com",[134,229]],["celiacandthebeast.com",134],["dailykos.com",134],["eater.com",134],["eldiariony.com",134],["free-power-point-templates.com",134],["golfdigest.com",134],["ibtimes.co.in",134],["inc.com",134],["indiewire.com",[134,229]],["inquisitr.com",134],["intouchweekly.com",134],["kcrg.com",134],["kentucky.com",134],["knowyourmeme.com",134],["last.fm",134],["lifeandstylemag.com",134],["mandatory.com",134],["nbcsports.com",134],["news.com.au",134],["nypost.com",[134,229]],["rollingstone.com",134],["sbnation.com",134],["sneakernews.com",134],["sport-fm.gr",134],["stylecaster.com",134],["tastingtable.com",134],["thecw.com",134],["thedailymeal.com",134],["theflowspace.com",134],["themarysue.com",134],["torontosun.com",134],["usmagazine.com",134],["wallup.net",134],["yourcountdown.to",134],["bagi.co.in",135],["keran.co",135],["biblestudytools.com",136],["christianheadlines.com",136],["ibelieve.com",136],["kuponigo.com",137],["kimcilonly.site",138],["kimcilonly.link",138],["cryptoearns.com",139],["inxxx.com",140],["ipaspot.app",141],["embedwish.com",142],["filelions.live",142],["leakslove.net",142],["jenismac.com",143],["vxetable.cn",144],["jewelavid.com",145],["nizarstream.com",145],["snapwordz.com",146],["toolxox.com",146],["rl6mans.com",146],["idol69.net",146],["plumbersforums.net",147],["123movies57.online",148],["gulio.site",149],["mediaset.es",150],["updatewallah.in",150],["izlekolik.net",151],["donghuaworld.com",152],["letsdopuzzles.com",153],["rediff.com",154],["dzapk.com",155],["darknessporn.com",156],["familyporner.com",156],["freepublicporn.com",156],["pisshamster.com",156],["punishworld.com",156],["xanimu.com",156],["pig69.com",157],["cosplay18.pics",157],["sexwebvideo.com",157],["sexwebvideo.net",157],["tainio-mania.online",158],["javhdo.net",159],["eroticmoviesonline.me",160],["teleclub.xyz",161],["ecamrips.com",162],["showcamrips.com",162],["tucinehd.com",163],["9animetv.to",164],["qiwi.gg",165],["jornadaperfecta.com",166],["loseart.com",167],["sousou-no-frieren.com",168],["unite-guide.com",169],["thebullspen.com",170],["streambucket.net",172],["nontongo.win",172],["player.smashy.stream",173],["player.smashystream.com",173],["cineb.rs",175],["hiraethtranslation.com",176],["d0000d.com",177],["d000d.com",177],["d0o0d.com",177],["do0od.com",177],["doods.pro",177],["ds2play.com",177],["ds2video.com",177],["xfreehd.com",178],["freethesaurus.com",179],["thefreedictionary.com",179],["dexterclearance.com",180],["x86.co.kr",181],["onlyfaucet.com",182],["x-x-x.tube",183],["visionpapers.org",184],["fdownloader.net",185],["thehackernews.com",186],["mielec.pl",187],["treasl.com",188],["mrbenne.com",189],["cnpics.org",190],["ovabee.com",190],["porn4f.com",190],["cnxx.me",190],["ai18.pics",190],["sportsonline.si",191],["fiuxy2.co",192],["animeunity.to",193],["tokopedia.com",194],["remixsearch.net",195],["remixsearch.es",195],["onlineweb.tools",195],["sharing.wtf",195],["2024tv.ru",196],["xnxxcom.xyz",197],["sportsurge.net",198],["joyousplay.xyz",198],["quest4play.xyz",[198,200]],["generalpill.net",198],["moneycontrol.com",199],["cookiewebplay.xyz",200],["ilovetoplay.xyz",200],["streamcaster.live",200],["weblivehdplay.ru",200],["oaaxpgp3.xyz",201],["m9.news",202],["callofwar.com",203],["secondhandsongs.com",204],["nudezzers.org",205],["3rooodnews.net",206],["xxxbfvideo.net",207],["filmy4wap.co.in",208],["filmy4waps.org",208],["gameshop4u.com",209],["regenzi.site",209],["handirect.fr",210],["animefenix.tv",211],["fsiblog3.club",212],["kamababa.desi",212],["favoyeurtube.net",213],["atlasstudiousa.com",214],["getfiles.co.uk",215],["genelify.com",216],["dhtpre.com",217],["xbaaz.com",218],["lineupexperts.com",220],["botcomics.com",221],["cefirates.com",221],["chandlerorchards.com",221],["comicleaks.com",221],["marketdata.app",221],["monumentmetals.com",221],["tapmyback.com",221],["ping.gg",221],["revistaferramental.com.br",221],["hawpar.com",221],["alpacafinance.org",[221,222]],["nookgaming.com",221],["enkeleksamen.no",221],["kvest.ee",221],["creatordrop.com",221],["panpots.com",221],["cybernetman.com",221],["bitdomain.biz",221],["gerardbosch.xyz",221],["fort-shop.kiev.ua",221],["accuretawealth.com",221],["resourceya.com",221],["tracktheta.com",221],["camberlion.com",221],["replai.io",221],["trybawaryjny.pl",221],["segops.madisonspecs.com",221],["tt.live",222],["future-fortune.com",222],["adventuretix.com",222],["bolighub.dk",222],["panprices.com",223],["intercity.technology",223],["freelancer.taxmachine.be",223],["adria.gg",223],["fjlaboratories.com",223],["emanualonline.com",223],["abhijith.page",223],["helpmonks.com",223],["dataunlocker.com",224],["proboards.com",225],["winclassic.net",225],["pandadoc.com",227],["abema.tv",230]]);

const entitiesMap = new Map([["wawacity",3],["720pstream",[3,58]],["vidsrc",[3,13,58]],["extreme-down",3],["flix-wave",3],["mixdrop",[3,14]],["sanet",3],["sportshd",3],["userupload",5],["pahe",[6,14]],["soap2day",6],["reset-scans",8],["poplinks",[8,38]],["mhdsports",8],["mhdsportstv",8],["mhdtvsports",8],["mhdtvworld",8],["mhdtvmax",8],["mhdstream",8],["hqq",9],["waaw",9],["pixhost",11],["viprow",[13,14,58]],["bluemediadownload",13],["bluemediafile",13],["bluemedialink",13],["bluemediastorage",13],["bluemediaurls",13],["urlbluemedia",13],["cloudvideotv",[13,58]],["123-movies",14],["123movieshd",14],["123movieshub",14],["123moviesme",14],["1337x",[14,174]],["1stream",14],["1tamilmv",14],["2ddl",14],["2umovies",14],["3hiidude",14],["4stream",14],["5movies",14],["7hitmovies",14],["9xmovie",14],["9xlinks",14],["aagmaal",[14,58]],["adblockeronstape",[14,51]],["adblockeronstreamtape",14],["adblockplustape",[14,51]],["adblockstreamtape",[14,51]],["adblockstrtape",[14,51]],["adblockstrtech",[14,51]],["adblocktape",[14,51]],["adcorto",14],["alexsports",14],["alexsportss",14],["alexsportz",14],["animepahe",14],["animesanka",14],["animixplay",14],["aniplay",14],["antiadtape",[14,51]],["asianclub",14],["ask4movie",14],["atomixhq",[14,58]],["atomohd",14],["beinmatch",[14,22]],["bhaai",14],["blurayufr",14],["buffstreams",14],["canalesportivo",14],["clickndownload",14],["clicknupload",14],["daddylive",[14,58]],["daddylivehd",[14,58]],["ddrmovies",14],["desiremovies",14],["devlib",14],["divxtotal",14],["divxtotal1",14],["dlhd",14],["dvdplay",[14,58]],["elixx",14],["enjoy4k",14],["estrenosflix",14],["estrenosflux",14],["estrenosgo",14],["f1stream",14],["fbstream",14],["file4go",14],["filmymeet",14],["filmyzilla",[14,58]],["findav",14],["findporn",14],["flixmaza",14],["flizmovies",14],["freetvsports",14],["fullymaza",14],["g3g",14],["gotxx",14],["grantorrent",14],["hdmoviesfair",[14,58]],["hdmoviesflix",14],["hiidudemoviez",14],["imgsen",14],["imgsto",14],["incest",14],["incestflix",14],["itopmusic",14],["javmost",14],["keeplinks",14],["keepvid",14],["keralahd",14],["khatrimazaful",14],["khatrimazafull",14],["leechall",14],["linkshorts",14],["mangovideo",14],["masaporn",14],["miniurl",14],["mirrorace",14],["mixdroop",14],["mkvcage",14],["mlbstream",14],["mlsbd",14],["mmsbee",14],["motogpstream",14],["movieplex",14],["movierulzlink",14],["movies123",14],["moviesflix",14],["moviesmeta",14],["moviessources",14],["moviesverse",14],["moviezwaphd",14],["mrunblock",14],["nbastream",14],["newmovierulz",14],["nflstream",14],["nhlstream",14],["noblocktape",[14,51]],["nocensor",14],["onlyfams",14],["ouo",14],["pctfenix",[14,58]],["pctnew",[14,58]],["peliculas24",14],["pelisplus",14],["piratebay",14],["plyjam",14],["plylive",14],["plyvdo",14],["pornhoarder",[14,219]],["prbay",14],["projectfreetv",14],["proxybit",14],["psarips",14],["racaty",14],["remaxhd",14],["rintor",14],["rnbxclusive",14],["rnbxclusive0",14],["rnbxclusive1",14],["rojadirecta",14],["rojadirectaenvivo",14],["rugbystreams",14],["sadisflix",14],["safetxt",14],["shadowrangers",14],["shahi4u",14],["shahid4u1",14],["shahid4uu",14],["shavetape",14],["shortearn",14],["shorten",14],["shorttey",14],["shortzzy",14],["skymovieshd",14],["socceronline",[14,58]],["softarchive",14],["sports-stream",14],["sporttuna",14],["sshhaa",14],["stapadblockuser",[14,51]],["stape",[14,51]],["stapewithadblock",14],["starmusiq",14],["strcloud",[14,51]],["streamadblocker",[14,51,58]],["streamadblockplus",[14,51]],["streamcdn",14],["streamhub",14],["streamsport",14],["streamta",[14,51]],["streamtape",[14,51]],["streamtapeadblockuser",[14,51]],["strikeout",14],["strtape",[14,51]],["strtapeadblock",[14,51]],["strtapeadblocker",[14,51]],["strtapewithadblock",14],["strtpe",[14,51]],["swatchseries",14],["tabooflix",14],["tennisstreams",14],["themoviesflix",14],["thepiratebay",14],["thisav",14],["tmearn",14],["toonanime",14],["torlock",14],["tormalayalam",14],["torrentz2eu",14],["tutelehd",14],["tvply",14],["u4m",14],["ufcstream",14],["unblocknow",14],["uploadbuzz",14],["usagoals",14],["vexmoviex",14],["vidclouds",14],["vidlox",14],["vipbox",[14,58]],["vipboxtv",[14,58]],["vipleague",14],["watch-series",14],["watchseries",14],["xclusivejams",14],["xmoviesforyou",14],["youdbox",14],["ytmp3eu",14],["yts-subs",14],["yts",14],["zooqle",14],["dutchycorp",15],["mydverse",36],["shrinke",45],["shrinkme",45],["livecamrips",45],["stfly",48],["stly",48],["dropgalaxy",50],["bollyflix",52],["daddylive1",52],["esportivos",52],["poscitechs",52],["nekopoi",53],["123movies",58],["123moviesla",58],["123movieweb",58],["2embed",58],["9xmovies",58],["adshort",58],["allmovieshub",58],["asianplay",58],["atishmkv",58],["bflix",58],["cricstream",58],["crictime",58],["databasegdriveplayer",58],["dood",[58,177]],["dooood",[58,177]],["extramovies",58],["faselhd",58],["faselhds",58],["filemoon",58],["filmy",58],["filmyhit",58],["filmywap",58],["fmovies",58],["gdplayer",58],["goku",58],["gomovies",58],["gowatchseries",58],["hdfungamezz",58],["hindilinks4u",58],["hurawatch",58],["jalshamoviezhd",58],["livecricket",58],["mhdsport",58],["mkvcinemas",[58,175]],["movies2watch",58],["moviespapa",58],["mp4moviez",58],["mydownloadtube",58],["nuroflix",58],["o2tvseries",58],["o2tvseriesz",58],["pirlotv",58],["poscitech",58],["primewire",58],["redecanais",58],["serienstream",58],["sflix",58],["shahed4u",58],["shaheed4u",58],["speedostream",58],["sportcast",58],["sportskart",58],["streamingcommunity",[58,60,72]],["tamilarasan",58],["tamilfreemp3songs",58],["tamilprinthd",58],["torrentdosfilmes",58],["tubemate",58],["uploadrar",58],["uqload",58],["vidcloud9",58],["vido",58],["vidoo",58],["vudeo",58],["vumoo",58],["watchomovies",[58,70]],["yesmovies",58],["kickassanime",59],["11xmovies",60],["fzmovies",60],["prmovies",60],["streamblasters",60],["kickass",61],["cine-calidad",68],["woxikon",76],["ftuapps",93],["showflix",93],["teluguflix",95],["actvid",116],["torrentdownload",175],["doodstream",177]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeNodeText(
    nodeName,
    includes,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'includes', includes || '', ...extraArgs);
}

function replaceNodeTextFn(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-node-text.fn', ...Array.from(arguments));
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const reIncludes = extraArgs.includes || extraArgs.condition
        ? safe.patternToRegex(extraArgs.includes || extraArgs.condition, 'ms')
        : null;
    const reExcludes = extraArgs.excludes
        ? safe.patternToRegex(extraArgs.excludes, 'ms')
        : null;
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Quitting');
        }
    };
    const textContentFactory = (( ) => {
        const out = { createScript: s => s };
        const { trustedTypes: tt } = self;
        if ( tt instanceof Object ) {
            if ( typeof tt.getPropertyType === 'function' ) {
                if ( tt.getPropertyType('script', 'textContent') === 'TrustedScript' ) {
                    return tt.createPolicy(getRandomToken(), out);
                }
            }
        }
        return out;
    })();
    let sedCount = extraArgs.sedCount || 0;
    const handleNode = node => {
        const before = node.textContent;
        if ( reIncludes ) {
            reIncludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reIncludes, before) === false ) { return true; }
        }
        if ( reExcludes ) {
            reExcludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reExcludes, before) ) { return true; }
        }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        rePattern.lastIndex = 0;
        const after = pattern !== ''
            ? before.replace(rePattern, replacement)
            : replacement;
        node.textContent = node.nodeName === 'SCRIPT'
            ? textContentFactory.createScript(after)
            : after;
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Text before:\n${before.trim()}`);
        }
        safe.uboLog(logPrefix, `Text after:\n${after.trim()}`);
        return sedCount === 0 || (sedCount -= 1) !== 0;
    };
    const handleMutations = mutations => {
        for ( const mutation of mutations ) {
            for ( const node of mutation.addedNodes ) {
                if ( reNodeName.test(node.nodeName) === false ) { continue; }
                if ( handleNode(node) ) { continue; }
                stop(false); return;
            }
        }
    };
    const observer = new MutationObserver(handleMutations);
    observer.observe(document, { childList: true, subtree: true });
    if ( document.documentElement ) {
        const treeWalker = document.createTreeWalker(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let count = 0;
        for (;;) {
            const node = treeWalker.nextNode();
            count += 1;
            if ( node === null ) { break; }
            if ( reNodeName.test(node.nodeName) === false ) { continue; }
            if ( node === document.currentScript ) { continue; }
            if ( handleNode(node) ) { continue; }
            stop(); break;
        }
        safe.uboLog(logPrefix, `${count} nodes present before installing mutation observer`);
    }
    if ( extraArgs.stay ) { return; }
    runAt(( ) => {
        const quitAfter = extraArgs.quitAfter || 0;
        if ( quitAfter !== 0 ) {
            setTimeout(( ) => { stop(); }, quitAfter);
        } else {
            stop();
        }
    }, 'interactive');
}

function getRandomToken() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
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
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
    } catch(_) {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

/******************************************************************************/

const hnParts = [];
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
}
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
    try { removeNodeText(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

uBOL_removeNodeText();

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
