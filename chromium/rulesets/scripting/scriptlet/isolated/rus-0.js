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
        const arglistRefs = /* 300 */ ["132","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","130","92","130","62","102","86","130","132","2,100","132","130","15,31,68,101,103","9,124","13,14","45,114","130","130","130","130","130","15,68,101,103","130","69,73","9,124","94","58","10,97","130","121","130","62","94","2","131","130","132","130","84","104","130","132","94","24,112","0","107","132","2,77,87","94","83,132","132","94","130","130","130","130","130","44","114","108","4","76","132","3","7,17,30,33,37,-122,122,123","132","57","94","132","59","113","22,47,63,112,133","130","132","93","130","125,126","47,63,112,133","108","24,32,53","34","130","35","0","54,64","132","22","21,23","1","132","132","132","72","109,110","70,71,112","11","62","132","132","94","94","125,126","120,-122","78","82","82","46","0","16","16","94","19,29","75","49","25","112","132","132","-122","127","9","125,126","55","-122","81","80","132","43","115,116,117","132","132","62","25","132","125,126","-122","94","82","125,126","36","2","91","22","61","0","130","-122","127","132","39","55","-122","-122","125,126","125,126","-122","80","89","98","47,63,112,133","94","-122","-122","94","-122","-122","-122","40","41","95,112","109,110","-122","56","132","-122","132","132","47,63,133","47,63,133","47,63,133","94","5","125,126","50","130","28","27,65","-122","-122","94","-122","111","-122","80","132","-122","75","11","24,26","118,119","132","42","-122","128,129","90,99","132","52","8","-122","55","132","132","94","109,110","111","132","132","85","-122","51,132","20","127","1","7,17,30,33,37","1","67","-122","12","48","132","-122","0","21","79","2","-122","125,126","-122","-122","60","127","18","38","88","7,17,30,33,37","132","-117,-118","74","47,63,112,133","109,110","130","2","-122","130","-122","130","132","132","132","-122","44","1","7,17,30,33,37,-122,122,123","1","105","96","106","-122","2","96","132","132","66","0","-122","132","0","-122","132","6"];
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
    const arglists = /* 134 */ ["","16","9,0","9,1","9,2","9,3","11,4,5","11,6,7","11,8,9","11,10,11","11,12,13","11,14,15","11,16,17","11,18,19","11,18,20","11,21,13","11,22,13","11,23,24","11,25,26","11,27,28","11,29,30","11,31,15","11,32,33","11,34,13","11,35,36","11,37,38","11,39,15","11,40,41","11,42,43","11,44,28","11,45,46","11,47,48","11,49,7","11,50,26","11,51,52","11,53,13","11,54","11,55,13","11,56,13","11,57,58","13,59,60","13,61,62","1,63,64","1,63,65","1,63,66","1,67,68","1,69,70","1,69,71","1,69,72","1,69,73","1,69,74","1,69,75","1,69,76","1,69,77","1,69,78","1,69,79","1,69,80","1,69,81","1,69,82","1,69,83","1,69,84","1,69,85","1,69,86","1,87,88","1,87,89","1,87,90","1,91,92","6,93,87,94","6,95,96,97","6,98,99,97","6,100,101,102","6,103,99,97","6,104,101,102","6,105,99,97","6,106,101,102","6,107,108,97","6,109,108,97","8,110,111","8,112,97","8,113,111","8,114,97","8,115,97","8,116,117,94,118,111","8,119,97","8,120,111","8,121,122","8,123,124,125,126,111","8,127,97","8,128,129","8,130,97","8,131,97","8,132,97","8,133,111","8,134,135","8,136,111,94,118,111","8,137,97","5,138,139","5,140,141","5,142,111","5,143,144","5,145,141","5,146,139","5,147,139","5,148,149","16,150","16,151","16,152","16,153","16,154","1,69,155","20,156,111","13,157,158,159","11,160,26","6,161,162,163","1,69,164","11,165,28","1,69,166","1,69,167,168,169","11,170,26","11,171,7","11,172,7","1,69,173","11,174","6,175,99,97","6,176,177,97","11,178,179","6,180,181","8,182,183,94,118,111","5,184,149","5,185,149","6,186,108,97","6,187,108,97","1,69,188","1,69,189"];
    const args = /* 190 */ ["/^bda|^bltsr/","hurricane","isab","shedevrum-aab","a[href*=\"&link=https://\"]","?link","a[href*=\".mck\"][href*=\".ru/c/\"]","?u","a[href*=\".php?go=\"]","?go","a[href*=\"/away.php?\"]","?to -uricomponent","a[href*=\"/away?\"]","?to","a[href*=\"/bitrix/rk.php?goto=https\"]","?goto","a[href*=\"/redir.php?r=\"]","?r","a[href*=\"/redir/\"]","?exturl","?vzurl","a[href*=\"/redirect?to=\"]","a[href*=\"://click.opennet.ru/cgi-bin/\"]","a[href*=\"://opros.mosreg.ru/callback/survey\"][href*=\"/direct_url/?redirect=\"]","?redirect","a[href*=\"?action=redirect&url=\"]","?url","a[href*=\"?utm_\"][data-main-link]","+https","a[href*=\"deeplink=\"]","?deeplink","a[href*=\"goto=https\"]","a[href*=\"to=aHR0c\"]","?to -base64","a[href*=\"to=https\"]","a[href*=\"ulp=\"][target=\"_blank\"]","?ulp","a[href*=\"url=aHR0c\"]","?url -base64","a[href][rel*=\"sponsored\"][target=\"_blank\"]","a[href^=\"//www.ixbt.com/click/?c=\"]","[title]","a[href^=\"/engine/dwn\"]","?xf","a[href^=\"http:\"][aria-label^=\"Перейти на страницу источника\"]","a[href^=\"https://click.email4customers.com/Link?\"]","?args","a[href^=\"https://go.2038.pro/\"][href*=\"?dl=\"]","?dl","a[href^=\"https://pikabu.ru/\"][href*=\"?u=http\"]","a[href^=\"https://robot.mos.ru/\"]","a[href^=\"https://rutube.ru/api/routing/\"][href*=\"away?target\"]","?target","a[href^=\"https://soft2u.ru/url.php?to=\"]","a[href^=\"https://www.google.com/url?q=\"]","a[href^=\"https://www.gosuslugi.ru/ref?t=\"]","a[href^=\"https://www.livejournal.com/away?to=\"]","a[href^=\"https://www.youtube.com/redirect?event=\"][href*=\"&q=http\"]","?q","b-global-branding","html","noscroll","body","#text","РЕКЛАМНЫЙ БЛОК:","Реклама","Реклама:","a","/Установите Яндекс Браузер|Установить поиск Яндекса/","script","decodeURIComponent(escape","/A.d.b.|Adb-|A-d-b-|-Gua|dGua|dblo|tick|Адгу-/","/adserverDomain|popundersPerIP|right-click/","/checkAds|initAdblockCheck/","/document.head.appendChild|document.referrer/","/gtag\\('event'/","MsgNoAD","addPlaceholder","checkAdBlock","clickedOnContent","error-report.com","getComputedStyle","isAdBlock","message_ads","nidclick","right_click","showBanner","style","epom-brend","lb-banner-height","rose.ixbt.com/banner/","title","Adblock","._1z_ ._21_","",".comment-media .andropov-video video","loop","true",".content-custom [href*=\"?from=\"]:not([href*=\"utm\"])","target",".cycle-carousel-wrap > a.bottom_slide__item > img","src","[data-src]",".drag_element a[href*=\".html\"]",".owl-item > a > img","a[href*=\"?from=newsfeed\"][data-role=\"title-link\"]","img[src=\"https://overclockers.ru/assets/logo_gray_stub.gif\"]","video","controls","video[controls=\"controls\"]","KUF_SUGGESTER_SHOW_2_ITERATION","1","adBlockModal","age_confirmed","auth-required-win","callToRegisterClosed","clear","ok","reload","cookieAccepted","cookie_consent_shown","cookie_policy_accepted","110","geoid","32767","/","dontOverwrite","kuf_agr","lk-hasConsent","True","mose-banner","pg_SuggestGameFollow","promo-toast-tg","purchase_invite_shown","telegram_popup","Y","unity_pause_sso","yandexFull","__videoboxActive","false","browser-switch-trap-ts","{}","headerBannerShownAt","pg_GPbackVideo","on","rekl_modal_shown","video-autoplay","vipler.player.live.play","visits-count:plus-promotion","$remove$","/acestream/i","/dispatch","/p/?q=","utm","/adtag|creative_id/","/initTeasers|initVads/","is_age_verified","has-fullscreen-banner|has-right-direct",".public__root","stay","[href*=\"url=https\"]","#progress-value","data-timer","25","/DistributionLinkBro|-masonry-feed-/","a[href=\"http://static.fastpic.ru/fpuploader/FPUploader.exe\"]","/__BIM__|box-shadow/","getElementById","includes","referrer","[href^=\"https://checklink.mail.ru/proxy?\"]","[href^=\"https://click.mail.ru/redir?u=\"]","[href^=\"https://clicker.mail.ru/redir?u=\"]","violatedDirective","[data-cke-saved-href^=\"https://checklink.mail.ru/proxy?\"]",".html-fishing a","html[lang]","href-sanitizer",".specialcontdown > a[href^=\"/download?downloadlink=\"]","?downloadlink",".specialcontdown > a","download","is_mobile","no","rwDemo","rws","[class^=\"articleBlockVideo_\"] video[src*=\"hsmedia.ru/\"]","video[class*=\"HLSPlayback_player\"]","\"Shadow","/agl007|blockPage/"];
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
})("eb67c4fa-700a-4c20-bf4f-852ab9b7ca91");

void 0;
