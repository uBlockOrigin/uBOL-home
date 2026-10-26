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

// ruleset: ukr-0

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets($SECRET_ID$) {

/******************************************************************************/

const scriptletGlobals = self[$SECRET_ID$];

if ( scriptletGlobals.origins.length === 0 ) { return; }

/******************************************************************************/

const $hasHostnames$ = true;
const $hasEntities$ = false;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 164 */ ["at.ua","do.am","ain.ua","moy.su","my1.ru","ogo.ua","sud.ua","zik.ua","azku.ru","bouw.ru","clan.su","elle.ua","grad.ua","silf.ua","tele.ru","viva.ua","womo.ua","4mama.ua","d-mod.ru","dengi.ua","diwis.ru","fakty.ua","narod.ru","vlast.kz","www.i.ua","13idei.ru","colady.ru","ex-fs.net","iklife.ru","isport.ua","ixtira.tv","jetvis.ru","kinogo.eu","kubik3.ru","kursiv.kz","molbuk.ua","oblcit.ru","toysew.ru","aniqit.com","anisima.ru","bagnet.org","cbn.com.ua","glavnoe.ua","hvylya.net","kopomko.ru","lumpics.ru","mirknig.su","newsua.one","nnmclub.to","nr2.com.ua","rub.org.ua","rusjev.net","sibkray.ru","unn.com.ua","usatiki.ru","zikua.news","3witcher.ru","agronews.ua","comments.ua","dooralei.ru","golos.te.ua","igrul-ka.ru","it-doc.info","kurs.com.ua","megomult.ru","menstois.ru","mydizajn.ru","pingvin.pro","selezen.net","sinoptik.ua","staroetv.su","teren.in.ua","times.km.ua","womanel.com","1plus1.video","baragozik.ru","brjunetka.ru","catfishes.ru","doramakun.ru","enovosty.com","ethnoboho.ru","freerutor.me","glavpost.com","idealsad.com","kulikavto.ru","newsoneua.tv","paravozik.tv","plus-plus.tv","provce.ck.ua","rusadmin.biz","subsidii.net","tapochek.net","tverigrad.ru","versii.if.ua","altyn-orda.kz","cikavosti.com","fainaidea.com","glav-dacha.ru","greenflash.su","guitarrist.ru","livekavkaz.ru","play-force.ru","procherk.info","rainbowsky.ru","rugraphics.ru","sam-sdelay.ru","sdelaicomp.ru","telefongid.ru","tenews.org.ua","viborprost.ru","vsviti.com.ua","zakonguru.com","4studio.com.ua","agroreview.com","antirodinka.ru","cheline.com.ua","dv-gazeta.info","info-effect.ru","kapital-rus.ru","kino-hd720.net","love-mother.ru","marieclaire.ua","megabitcomp.ru","mignews.com.ua","otvetnavse.com","plitkar.com.ua","portal.lviv.ua","pro-zakupki.ru","proagro.com.ua","prozoro.net.ua","redpost.com.ua","samelectrik.ru","snow-motion.ru","sprintotvet.ru","tehnika.expert","telegraf.in.ua","windowstune.ru","fanofnfs.3dn.ru","fitnavigator.ru","historynotes.ru","news.dks.com.ua","privivkainfo.ru","rivnepost.rv.ua","root-nation.com","russkiiyazyk.ru","serviceyard.net","tc-image.3dn.ru","elektronika56.ru","gorodkiev.com.ua","kino-fs.ucoz.net","kino-torrent.net","rivnenews.com.ua","selfmadetrip.com","svoimi-rykami.ru","volyninfa.com.ua","pokatushki-pmr.ru","legion-rus.clan.su","politnavigator.net","classicalmusicnews.ru","prichernomorie.com.ua","ustroim-prazdnik.info","cosmonova-broadcast.tv","sekreti-domovodstva.ru","programdownloadfree.com"];
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
        const arglistRefs = /* 164 */ ["8,10","8","6,16","8","8","12","12","12","24","24","8","12","12","15","12","12","12","12","24","4","24","12","8,10","12","19","24","24","4","24","20","24","8","11","8","12","12","24","24","5","24","12","12","12","4","24","24","4","12","11","12","8","12","12","12","24","12","24","7,25","12,21,22","24","12","8","24","18","8","24","24","12","8","1","8","12","12","12","2","24","24","24","11","12","24","23","12","24","24","12","8","2","12","24","24","9","12","12","12","12","12","24","8","24","12","8","12","24","24","24","24","24","12","24","12","24","12","7,25","24","12","12","24","12","4","24","12","24","12","12","12","12","8","17","3","12","24","24","24","24","12","24","8,9","24","24","12","24","12","14","24","24","8","8","12","4","8","12","24","24","12","8","8","12","7","12","24","13","24","24"];
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
    const arglists = /* 26 */ ["","19,0","15,1","19,2","12,3,4","7,5","12,6,7","19,8","19,9","19,10","12,9","19,11","12,12,13","11,14,15","11,16,17","19,18","10,19","17,20,21","12,22,23","12,3,24","12,25,26","12,27,28","12,29,30","12,31","31,32","22,33,34"];
    const args = /* 35 */ ["SIN.AdsLoader","pagead2.googlesyndication.com","adsBlocked","String.fromCharCode","/\\/\\*[0-9a-f]{40}\\*\\//","vast","jQuery","link_br","wpsite_clickable_data","u_global_data","ads_script","utarget_script","document.createElement","/загрузка/","amodule.data","[]","td_ad_background_click_link","undefined","parent.window.opener","/\\/special\\//","href",".ban_head","document.currentScript","admitad","/Function\\('return/","decodeURIComponent","delete window","script.onerror","eval","document.getElementsByTagName","html_brain_link","MarketGidJSON","fpm_adbDetect","DOMContentLoaded","/linkUrl|loadBanner/"];
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
})("fb7f2f86-ef87-4c15-a912-62a035b1c974");

void 0;
