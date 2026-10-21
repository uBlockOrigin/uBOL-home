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

// ruleset: rus-0

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets($SECRET_ID$) {

/******************************************************************************/

const scriptletGlobals = self[$SECRET_ID$];

if ( scriptletGlobals.origins.length === 0 ) { return; }

/******************************************************************************/

const $hasHostnames$ = true;
const $hasEntities$ = true;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 300 */ ["i.ua","14.ru","26.ru","29.ru","35.ru","43.ru","45.ru","48.ru","51.ru","53.ru","56.ru","59.ru","60.ru","63.ru","68.ru","71.ru","72.ru","74.ru","76.ru","86.ru","89.ru","93.ru","d3.ru","e1.ru","eg.ru","iz.ru","kp.ru","nn.ru","nv.ua","rg.ru","tv.ua","v1.ru","vc.ru","vk.ru","vz.ru","ya.ru","116.ru","161.ru","164.ru","173.ru","178.ru","dtf.ru","ngs.ru","rbc.ru","vk.com","wmj.ru","ahen.me","dzen.ru","izh1.ru","mail.ru","msk1.ru","ng72.ru","quto.ru","sm.news","tass.ru","ufa1.ru","viva.ua","ya62.ru","avito.ru","beton.ua","chita.ru","dengi.ua","ferra.ru","hot.game","id.vk.ru","infox.sg","ivona.ua","kufar.by","lenta.ru","liga.net","meteo.ua","motor.ru","ngs22.ru","ngs24.ru","ngs42.ru","ngs55.ru","ngs70.ru","utorr.cc","yandex.*","24parik.*","24smi.org","3dnews.ru","ditey.com","drive2.ru","e.mail.ru","factor.ua","fapvdo.ru","gazeta.ru","gazeta.ua","gsm.in.ua","howdyho.*","innal.top","ircity.ru","isport.ua","kinotv.ru","mgorsk.ru","my-lib.ru","naylo.top","parik24.*","pikabu.ru","rutube.ru","sochi1.ru","soft2u.ru","sso.ya.ru","uwupad.me","vsetv.com","zannn.top","znayka.cc","aj2738.top","bigmir.net","bilshe.com","censor.net","eneyida.tv","fap-guru.*","fishki.net","freehat.cc","gorodvo.ru","hvylya.net","kolobok.ua","lenta.news","letidor.ru","litruso.ru","my.mail.ru","myshows.me","nnmclub.ro","nnmclub.to","nullcms.ru","o2.mail.ru","opennet.me","opennet.ru","passion.ru","rambler.ru","reactor.cc","ritsatv.ru","rsload.net","rustorka.*","stravy.net","tochka.net","tv.mail.ru","vgtimes.ru","vkvideo.ru","x-libri.ru","agronews.ua","biz.mail.ru","direct.farm","doramatv.ru","facenews.ua","farposst.ru","fastpic.org","glianec.com","gorod.dp.ua","gorodche.ru","kichkas.biz","kriminal.tv","lit-web.net","mcs.mail.ru","moslenta.ru","nnm-club.me","novkniga.ru","nsportal.ru","relax-fm.ru","remanga.org","seedoff.net","sichnews.ua","sso.dzen.ru","tolyatty.ru","top.mail.ru","vgtimes.com","www.ukr.net","youtube.com","agroweek.com","auto.mail.ru","blog.mail.ru","bookdream.ru","booksreed.ru","deti.mail.ru","doramatv.one","findanime.me","finuslugi.ru","game4you.top","gazeta.press","help.mail.ru","horo.mail.ru","indicator.ru","kino.mail.ru","lady.mail.ru","love.mail.ru","mag.relax.by","motorpage.ru","mp3party.net","mult-porno.*","news.mail.ru","newsyou.info","panno4ka.net","pets.mail.ru","pogodaua.com","real-vin.com","rustorka.com","rustorka.net","rustorka.top","secretmag.ru","shedevrum.ai","skanbooks.ru","tapochek.net","voronezh1.ru","wotspeak.org","www.ixbt.com","bonus.mail.ru","calls.mail.ru","championat.ru","cloud.mail.ru","disk.yandex.*","dobro.mail.ru","doramatv.live","football24.ua","gibdd.mail.ru","joyreactor.cc","lalapaluza.ru","lifehacker.ru","light.mail.ru","nnovosti.info","online-fix.me","otvet.mail.ru","patephone.com","playground.ru","pravda.com.ua","questtime.net","softoroom.org","touch.mail.ru","agroreview.com","avtovod.com.ua","businessua.com","championat.com","cosplay-porn.*","disk.yandex.ru","epravda.com.ua","f1analytic.com","forum.ixbt.com","health.mail.ru","inforesist.org","kluchikipro.ru","libertycity.ru","lust-girls.com","mail.yandex.ru","ouraidream.com","playvillage.ru","pogoda.mail.ru","stalkermods.ru","streame.center","24boxing.com.ua","3igames.mail.ru","account.mail.ru","appleinsider.ru","champion.com.ua","comedy-radio.ru","connect.mail.ru","electrobooks.ru","finance.mail.ru","hi-tech.mail.ru","kriminal.net.ua","libertycity.net","liveinternet.ru","livejournal.com","lk.emias.mos.ru","mail.rambler.ru","meteofor.com.ua","new.fastpic.org","overclockers.ru","rustorkacom.lib","sex-studentki.*","sterlitamak1.ru","veseloeradio.ru","vfokuse.mail.ru","vladivostok1.ru","widgets.mail.ru","www.fontanka.ru","zdorovia.com.ua","buhgalter.com.ua","buhgalter911.com","calendar.mail.ru","filmitorrent.net","goddess-game.com","octavius.mail.ru","proceedflow.info","silvercube12.xyz","sport-express.ru","tv.acestream.org","minigames.mail.ru","radioromantika.ru","sport-express.net","sportanalytic.com","footballgazeta.com","link.softoroom.org","passport.yandex.ru","okminigames.mail.ru","football-ukraine.com","captcha-api.yandex.ru","player-smotri.mail.ru","footballtransfer.com.ua","portalvirtualreality.ru"];
    const collectArglistRefIndices = (out, hn, r) => {
        let l = 0, i = 0, d = 0;
        let candidate = '';
        while ( l < r ) {
            i = l + r >>> 1;
            candidate = scriptletHostnames[i];
            d = hn.length - candidate.length;
            if ( d === 0 ) {
                if ( hn === candidate ) {
                    out.add(i); break;
                }
                d = hn < candidate ? -1 : 1;
            }
            if ( d < 0 ) {
                r = i;
            } else {
                l = i + 1;
            }
        }
        return i + 1;
    };
    const indicesFromHostname = (out, hnDetails, suffix = '') => {
        if ( hnDetails.hns.length === 0 ) { return; }
        let r = scriptletHostnames.length;
        for ( const hn of hnDetails.hns ) {
            r = collectArglistRefIndices(out, `${hn}${suffix}`, r);
        }
        if ( $hasEntities$ ) {
            let r = scriptletHostnames.length;
            for ( const en of hnDetails.ens ) {
                r = collectArglistRefIndices(out, `${en}${suffix}`, r);
            }
        }
    };
    const todoIndices = new Set();
    indicesFromHostname(todoIndices, scriptletGlobals.origins[0]);
    if ( $hasAncestors$ ) {
        for ( const entry of scriptletGlobals.origins ) {
            if ( entry.i === 0 ) { continue; }
            indicesFromHostname(todoIndices, entry, '>>');
        }
    }
    // Collect arglist references
    if ( todoIndices.size ) {
        const arglistRefs = /* 300 */ ["133","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","131","93","131","63","103","87","131","133","2,101","133","131","16,32,69,102,104","10,125","14,15","46,115","131","131","131","131","131","16,69,102,104","131","70,74","10,125","95","59","11,98","131","122","131","63","95","2","132","131","133","131","85","105","131","133","95","25,113","0","108","133","2,78,88","95","84,133","133","95","131","131","131","131","131","45","115","109","4","77","133","3","8,18,31,34,38,-123,123,124","133","58","95","133","60","114","23,48,64,113,134","131","133","94","131","126,127","48,64,113,134","109","25,33,54","35","131","36","0","55,65","133","23","22,24","1","133","133","133","73","110,111","6,71,72,113","12","63","133","133","95","95","126,127","121,-123","79","83","83","47","0","17","17","95","20,30","76","50","26","113","133","133","-123","128","10","126,127","56","-123","82","81","133","44","116,117,118","133","133","63","26","133","126,127","-123","95","83","126,127","37","2","92","23","62","0","131","-123","128","133","40","56","-123","-123","126,127","126,127","-123","81","90","99","48,64,113,134","95","-123","-123","95","-123","-123","-123","41","42","96,113","110,111","-123","57","133","-123","133","133","48,64,134","48,64,134","48,64,134","95","5","126,127","51","131","29","28,66","-123","-123","95","-123","112","-123","81","133","-123","76","12","25,27","119,120","133","43","-123","129,130","91,100","133","53","9","-123","56","133","133","95","110,111","112","133","133","86","-123","52,133","21","128","1","8,18,31,34,38","1","68","-123","13","49","133","-123","0","22","80","2","-123","126,127","-123","-123","61","128","19","39","89","8,18,31,34,38","133","-118,-119","75","48,64,113,134","110,111","131","2","-123","131","-123","131","133","133","133","-123","45","1","8,18,31,34,38,-123,123,124","1","106","97","107","-123","2","97","133","133","67","0","-123","133","0","-123","133","7"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 0 */ [];
    const { hns } = scriptletGlobals.origins[0];
    for ( let i = 0, n = scriptletFromRegexes.length; i < n; i += 3 ) {
        const needle = scriptletFromRegexes[i+0];
        let regex;
        for ( const hn of hns ) {
            if ( hn.includes(needle) === false ) { continue; }
            if ( regex === undefined ) {
                regex = new RegExp(scriptletFromRegexes[i+1]);
            }
            if ( regex.test(hn) === false ) { continue; }
            for ( const ref of JSON.parse(`[${scriptletFromRegexes[i+2]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

// Execute scriptlets
if ( todo.size && todo.has(0) === false ) {
    const arglists = /* 135 */ ["","16","9,0","9,1","9,2","9,3","9,4","11,5,6","11,7,8","11,9,10","11,11,12","11,13,14","11,15,16","11,17,18","11,19,20","11,19,21","11,22,14","11,23,14","11,24,25","11,26,27","11,28,29","11,30,31","11,32,16","11,33,34","11,35,14","11,36,37","11,38,39","11,40,16","11,41,42","11,43,44","11,45,29","11,46,47","11,48,49","11,50,8","11,51,27","11,52,53","11,54,14","11,55","11,56,14","11,57,14","11,58,59","13,60,61","13,62,63","1,64,65","1,64,66","1,64,67","1,68,69","1,70,71","1,70,72","1,70,73","1,70,74","1,70,75","1,70,76","1,70,77","1,70,78","1,70,79","1,70,80","1,70,81","1,70,82","1,70,83","1,70,84","1,70,85","1,70,86","1,70,87","1,88,89","1,88,90","1,88,91","1,92,93","6,94,88,95","6,96,97,98","6,99,100,98","6,101,102,103","6,104,100,98","6,105,102,103","6,106,100,98","6,107,102,103","6,108,109,98","6,110,109,98","8,111,112","8,113,98","8,114,112","8,115,98","8,116,98","8,117,118,95,119,112","8,120,98","8,121,112","8,122,123","8,124,125,126,127,112","8,128,98","8,129,130","8,131,98","8,132,98","8,133,98","8,134,112","8,135,136","8,137,112,95,119,112","8,138,98","5,139,140","5,141,142","5,143,112","5,144,145","5,146,142","5,147,140","5,148,140","5,149,150","16,151","16,152","16,153","16,154","16,155","1,70,156","20,157,112","13,158,159,160","11,161,27","6,162,163,164","1,70,165","11,166,29","1,70,167","1,70,168,169,170","11,171,27","11,172,8","11,173,8","1,70,174","11,175","6,176,100,98","6,177,178,98","11,179,180","6,181,182","8,183,184,95,119,112","5,185,150","5,186,150","6,187,109,98","6,188,109,98","1,70,189","1,70,190"];
    const args = /* 191 */ ["/^bda|^bltsr/","hurricane","isab","shedevrum-aab","video_autoplay_off","a[href*=\"&link=https://\"]","?link","a[href*=\".mck\"][href*=\".ru/c/\"]","?u","a[href*=\".php?go=\"]","?go","a[href*=\"/away.php?\"]","?to -uricomponent","a[href*=\"/away?\"]","?to","a[href*=\"/bitrix/rk.php?goto=https\"]","?goto","a[href*=\"/redir.php?r=\"]","?r","a[href*=\"/redir/\"]","?exturl","?vzurl","a[href*=\"/redirect?to=\"]","a[href*=\"://click.opennet.ru/cgi-bin/\"]","a[href*=\"://opros.mosreg.ru/callback/survey\"][href*=\"/direct_url/?redirect=\"]","?redirect","a[href*=\"?action=redirect&url=\"]","?url","a[href*=\"?utm_\"][data-main-link]","+https","a[href*=\"deeplink=\"]","?deeplink","a[href*=\"goto=https\"]","a[href*=\"to=aHR0c\"]","?to -base64","a[href*=\"to=https\"]","a[href*=\"ulp=\"][target=\"_blank\"]","?ulp","a[href*=\"url=aHR0c\"]","?url -base64","a[href][rel*=\"sponsored\"][target=\"_blank\"]","a[href^=\"//www.ixbt.com/click/?c=\"]","[title]","a[href^=\"/engine/dwn\"]","?xf","a[href^=\"http:\"][aria-label^=\"Перейти на страницу источника\"]","a[href^=\"https://click.email4customers.com/Link?\"]","?args","a[href^=\"https://go.2038.pro/\"][href*=\"?dl=\"]","?dl","a[href^=\"https://pikabu.ru/\"][href*=\"?u=http\"]","a[href^=\"https://robot.mos.ru/\"]","a[href^=\"https://rutube.ru/api/routing/\"][href*=\"away?target\"]","?target","a[href^=\"https://soft2u.ru/url.php?to=\"]","a[href^=\"https://www.google.com/url?q=\"]","a[href^=\"https://www.gosuslugi.ru/ref?t=\"]","a[href^=\"https://www.livejournal.com/away?to=\"]","a[href^=\"https://www.youtube.com/redirect?event=\"][href*=\"&q=http\"]","?q","b-global-branding","html","noscroll","body","#text","РЕКЛАМНЫЙ БЛОК:","Реклама","Реклама:","a","/Установите Яндекс Браузер|Установить поиск Яндекса/","script","decodeURIComponent(escape","/A.d.b.|Adb-|A-d-b-|-Gua|dblo|detected|dGua|tick|Адгу-/","/adserverDomain|popundersPerIP|right-click/","/checkAds|initAdblockCheck/","/document.head.appendChild|document.referrer/","/gtag\\('event'/","MsgNoAD","addPlaceholder","checkAdBlock","clickedOnContent","error-report.com","getComputedStyle","isAdBlock","message_ads","nidclick","right_click","showBanner","style","epom-brend","lb-banner-height","rose.ixbt.com/banner/","title","Adblock","._1z_ ._21_","",".comment-media .andropov-video video","loop","true",".content-custom [href*=\"?from=\"]:not([href*=\"utm\"])","target",".cycle-carousel-wrap > a.bottom_slide__item > img","src","[data-src]",".drag_element a[href*=\".html\"]",".owl-item > a > img","a[href*=\"?from=newsfeed\"][data-role=\"title-link\"]","img[src=\"https://overclockers.ru/assets/logo_gray_stub.gif\"]","video","controls","video[controls=\"controls\"]","KUF_SUGGESTER_SHOW_2_ITERATION","1","adBlockModal","age_confirmed","auth-required-win","callToRegisterClosed","clear","ok","reload","cookieAccepted","cookie_consent_shown","cookie_policy_accepted","110","geoid","32767","/","dontOverwrite","kuf_agr","lk-hasConsent","True","mose-banner","pg_SuggestGameFollow","promo-toast-tg","purchase_invite_shown","telegram_popup","Y","unity_pause_sso","yandexFull","__videoboxActive","false","browser-switch-trap-ts","{}","headerBannerShownAt","pg_GPbackVideo","on","rekl_modal_shown","video-autoplay","vipler.player.live.play","visits-count:plus-promotion","$remove$","/acestream/i","/dispatch","/p/?q=","utm","/adtag|creative_id/","/initTeasers|initVads/","is_age_verified","has-fullscreen-banner|has-right-direct",".public__root","stay","[href*=\"url=https\"]","#progress-value","data-timer","25","/DistributionLinkBro|-masonry-feed-/","a[href=\"http://static.fastpic.ru/fpuploader/FPUploader.exe\"]","/__BIM__|box-shadow/","getElementById","includes","referrer","[href^=\"https://checklink.mail.ru/proxy?\"]","[href^=\"https://click.mail.ru/redir?u=\"]","[href^=\"https://clicker.mail.ru/redir?u=\"]","violatedDirective","[data-cke-saved-href^=\"https://checklink.mail.ru/proxy?\"]",".html-fishing a","html[lang]","href-sanitizer",".specialcontdown > a[href^=\"/download?downloadlink=\"]","?downloadlink",".specialcontdown > a","download","is_mobile","no","rwDemo","rws","[class^=\"articleBlockVideo_\"] video[src*=\"hsmedia.ru/\"]","video[class*=\"HLSPlayback_player\"]","\"Shadow","/agl007|blockPage/"];
    const { functionRefs } = scriptletGlobals;
    for ( const ref of todo ) {
        if ( ref < 0 ) { continue; }
        if ( todo.has(~ref) ) { continue; }
        const arglist = JSON.parse(`[${arglists[ref]}]`);
        const fn = functionRefs[arglist[0]];
        try { fn(...arglist.slice(1).map(a => args[a])); }
        catch { }
    }
}

/******************************************************************************/

// End of local scope
})("18a6405d-4634-4b3a-ae38-e2d275e6b586");

void 0;
