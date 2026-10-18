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

// ruleset: irn-0

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
    const scriptletHostnames = /* 106 */ ["ac.ir","1da.ir","1ea.ir","2ad.ir","fam.ir","iwo.ir","tmk.ir","anaj.ir","blog.ir","lenz.ir","oila.tj","up44.ir","bizma.ir","mopon.ir","opizo.me","rebec.ir","farnet.io","my.mci.ir","subf2m.ir","tabnak.ir","vakil.net","alaatv.com","fidibo.com","filmnet.ir","jeyran.net","karbord.io","musichi.ir","noorlib.ir","pwa.mci.ir","sclinic.ir","subkade.ir","tak3da.com","themez.top","tinroid.ir","uptrack.ir","uupload.ir","appiroid.ir","binanews.ir","digiform.ir","fontyab.com","jafekri.com","msbmusic.ir","musicdel.ir","musictag.ir","takmili.com","tamasha.com","targoman.ir","zeemusic.ir","animelist.tv","fileboro.com","hamkelasi.ir","iranstar.com","itarfand.com","jobvision.ir","khabarpu.com","najiremix.ir","naslmusic.ir","netgasht.com","saednews.com","texahang.org","artmusics.top","barcanews.org","behtaraneh.ir","coffeeapps.ir","elmefarda.com","getandroid.ir","gold-team.org","likeemusic.ir","musiceman.net","musicpars3.ir","myhastidl.cam","nab-music.com","p30konkor.com","searchline.ir","takhfifan.com","tarfandha.org","app.snapp.taxi","autosafkar.com","bandmoviez.one","dailymobile.ir","downloadha.com","iran-music.com","ketabesabz.com","lahzeakhar.com","musickhone.com","play.namava.ir","power-music.ir","s-moshaver.com","shahanmusic.ir","skyroom.online","tabanmusic.com","tigatravel.com","up.20script.ir","androidparsi.ir","androidtime.com","app.blubank.com","ganjipakhsh.com","musicguitars.ir","mybia4music.com","salamatnews.com","androidgozar.com","javan-musics.com","hamisheonline.com","anesthesianotes.ir","play.radiojavan.com","player.telewebion.com"];
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
        const arglistRefs = /* 106 */ ["10","20","20","20","23","38","71","3,4,5","2","47","88","87","16","52","59","61","32","29,30,31,50,51","1","83","41","92,93,94,95,96,97","29,30,31","26","41","44","1","55","29,30,31,50,51","6,7","62","72","20","70","1","38","1","19","90,91","27,28","40,41,42,43","53","49","1","41,76,77,78,79,80,81","73,74,75","69","1","9","24,25","62","35,36","37","39","45","1","1","53","67,68","13,14","1","15","13,14","6,7","22","1","38","1","14","1","53","56","6,7","41","85,86","11","66","8","18","11","21","13,14","46","48","1","57,58","1","22,64","63","65","13,14","82","89","11","1","17","33","1","54","3,4,5","12","13,14","34","6,7","60","84"];
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
    const arglists = /* 98 */ ["","10","11,0,1","11,2,3","11,4,5","11,6,5","19,7","12,8,9","22,10,11","26,12,13,14","11,15,16","12,17","11,18,19","22,20,21","17,22,23","11,24,16","22,25,11","22,21,26","12,27,28","11,29,30","11,31,19","22,32,33","22,21","7,34","12,35,36","31,37","7,38","11,39,40","11,41,40","11,42,1","11,43,1","11,44,1","12,45","22,1,46","12,27,47","17,48,23","12,49,50","12,49,21","26","13,51","12,9","12,52","12,49,53","12,54","15,55","1,56,13,57","11,58,30","22,21,26,59,60","11,61,30","11,62,19","11,63,40","11,64,40","22,65,66","11,67,40","12,68","22,69,70","19,17","7,71","13,72","11,73,40","11,74,75","22,76,11","26,77","19,78","11,8,30","7,79","7,80","22,32,81","19,82","14,83","19,84","7,85,86","19,87","11,88,5","11,89,19","11,90,91","11,92,30","11,93,30","11,94,30","11,95,30","11,96,30","17,97,1,98","23,99,100","12,101,102","7,103","11,104,91","11,105,30","26,1,1,40","19,106","1,107","17,108,23,109","22,110,111","11,112,3","11,113,30","11,114,30","11,115,3","11,116,3","11,117,30"];
    const args = /* 118 */ ["constant.copyText","","jscd","{}","document.URL","undefined","document.referrer","nocontext","disableSelection","reEnable","scroll","return\"undefined\"","timeLeft","*","0.02","chromeOS","true","vc_url","ShowPopUp","false","load","contextmenu","onmousedown|onselectstart","body","adsShow","/contextmenu|copy|cut/","preventDefault","document.onclick","checkCookie","openTelegram","noopFunc","blurred","DOMContentLoaded","ajax_tptn_tracker","props.children.[].props.children.[].props.children.props.advertisment","document.onselectstart","killCopy","document.oncopy","trace data.vast_url data.ads","time1","0","time30","navigator.userAgent","navigator.appVersion","navigator.appName","eif","t.preventDefault","Hamisheonlinepaps","onselectstart|oncopy|oncontextmenu","jQuery","Drupal","candidatelogapi method:POST","document.oncontextmenu","wccp_pro","clear_body_at_all_for_extentions","SearchiaClick","document.getElementById","0.01","KetabrahPopup","elements","div#rmpPlayer","customnotify","runScript","window.screen.width","window.screen.height","click","720","needpop","pa_vc_url","copy","throw","result.commercialUrl result.watermark","PlayReports","count","appConfig.skips_limit","60000","/contextmenu|keydown|dragstart|mousemove/","countdown","show_wpcp_message","result.adsText result.adsLink","data.geocampaigns","videojs.ads","fixedPostGroups","updateAdContents","tinPa","data","data.vast data.content data.ad_id","SGPB_POPUP_PARAMS","socketUrl","VASTEnabled","vastURL","[]","disable_copy","disable_drag_text","disable_hot_keys","disable_drag_images","dealWithPrintScrKey","draggable","stay","document.createElement","join_telegram","document.write","renderAds","body.productStatus","_paq","_paq.push","window.LOCO_DATA.copyrightTranslation","tick","oncopy|oncut|onpaste","complete","/pageshow|focus|blur|visibilitychange|resume|freeze/","logStateChange","Metrix","Metrix.deauthorizeUser","Metrix.init","zebline","zebline.event","zebline.event.track"];
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
})("74f9600a-13a3-47bc-b856-40c6da158b89");

void 0;
