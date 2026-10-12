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

// ruleset: easyprivacy

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
    const scriptletHostnames = /* 253 */ ["x.com","al.com","nj.com","rd.com","aol.com","cbr.com","dnb.com","ijr.com","kgw.com","mwed.jp","wnd.com","wwd.com","10tv.com","cbs19.tv","cbs8.com","cwtv.com","espn.com","khou.com","kkrt.com","krem.com","ktvb.com","kvue.com","money.it","omg.blog","uber.com","usaa.com","vibe.com","wbir.com","wcnc.com","wfaa.com","wgrz.com","wkyc.com","wltx.com","wnep.com","wqad.com","wral.com","wthr.com","wtol.com","wtsp.com","9news.com","abc10.com","chime.com","delta.com","dnb.co.uk","fox43.com","fox61.com","freep.com","kens5.com","king5.com","mlive.com","pcwelt.de","qobuz.com","thv11.com","tidal.com","vimeo.com","wusa9.com","wwltv.com","12news.com","13wmaz.com","apnews.com","boston.com","costco.com","deezer.com","driving.ca","filson.com","futbin.com","hopwtr.com","kare11.com","kcentv.com","kiiitv.com","macwelt.de","norton.com","nypost.com","ranker.com","rivals.com","silive.com","subway.com","whas11.com","wzzm13.com","11alive.com","artnews.com","bolighub.dk","capezio.com","cattime.com","dogtime.com","gamepur.com","gbatemp.net","geizhals.de","lfpress.com","nbcnews.com","neopets.com","news.com.au","pandora.com","porsche.com","queerty.com","reuters.com","sherdog.com","sporcle.com","spotify.com","titantv.com","twitter.com","variety.com","visible.com","weather.com","artforum.com","collider.com","deadline.com","dpreview.com","engadget.com","formula1.com","gamerant.com","grabify.link","gulflive.com","hemmings.com","inquirer.net","jdsports.com","komonews.com","madewell.com","masslive.com","mazdausa.com","michaels.com","movieweb.com","news8000.com","nicovideo.jp","pennlive.com","sidereel.com","syracuse.com","thegamer.com","tirerack.com","topspeed.com","ubereats.com","usatoday.com","webmail.wiki","12newsnow.com","13newsnow.com","247sports.com","aliexpress.ru","aliexpress.us","billboard.com","cbssports.com","cleveland.com","fresnobee.com","goldderby.com","hancinema.net","howtogeek.com","indiewire.com","magesypro.pro","makeuseof.com","myfoxzone.com","nbcsports.com","newswest9.com","newyorker.com","ottawasun.com","pwinsider.com","savvytime.com","thelayoff.com","weareiowa.com","wfmynews2.com","www.yahoo.com","aliexpress.com","calgarysun.com","cheatsheet.com","comingsoon.net","eventbrite.com","gameskinny.com","golfdigest.com","mail.yahoo.com","milesplit.live","oregonlive.com","primagames.com","robbreport.com","screenrant.com","siliconera.com","soundcloud.com","techcrunch.com","thebeenews.com","thehealthy.com","themarysue.com","ticketmaster.*","torontosun.com","twinfinite.net","videogamer.com","5newsonline.com","accuweather.com","acmemarkets.com","arstechnica.com","crunchyroll.com","destructoid.com","edmontonsun.com","flyfrontier.com","lgbtqnation.com","mensjournal.com","order-order.com","payment.nba.com","tasteofhome.com","techlicious.com","technicpack.net","theprovince.com","windsorstar.com","wrestlezone.com","esportstales.com","knowyourmeme.com","lenscrafters.com","localmemphis.com","motorbiscuit.com","nationalpost.com","ncbi.nlm.nih.gov","nofilmschool.com","rollingstone.com","simpleflying.com","thenerdstash.com","touchtapplay.com","vancouversun.com","wrestlinginc.com","wunderground.com","calgaryherald.com","dollargeneral.com","financialpost.com","harborfreight.com","monsterenergy.com","ottawacitizen.com","progameguides.com","superherohype.com","birdsandblooms.com","bringmethenews.com","crooksandliars.com","familyhandyman.com","firstcoastnews.com","insider-gaming.com","nationalreview.com","thefashionspot.com","xda-developers.com","edmontonjournal.com","forums.hfboards.com","gamerjournalist.com","lehighvalleylivecom","newscentermaine.com","portlandtribune.com","stealthoptional.com","thedraftnetwork.com","lehighvalleylive.com","search.rakuten.co.jp","theoutlookonline.com","wegotthiscovered.com","attackofthefanboy.com","hollywoodreporter.com","informazionefiscale.it","beavertonvalleytimes.com","gladiatorgarageworks.com","livewithkellyandmark.com","playstationlifestyle.net","worldpopulationreview.com","aiskillsnavigator.microsoft.com"];
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
        const arglistRefs = /* 253 */ ["1,2,17","4,5,8","5,8","5","5","4","1,2","4","5","12","4","5","5","5","5","4","1,2","5","1,2","5","5","5","4","4","1,2","1,2","5","5","5","5","5","5","5","5","5","4","5","5","5","5","5","1,2","1,2","1,2","5","5","4","5","5","4,5,8","4,8","1,2","5","1,2","1,2","5","5","5","5","5","1,2","1,2","1,2","5","1,2","5","1,2","5","5","5","8","1,2","4","6","1,2","8","1,2","5","5","5","5","3","1,2","4","4","8","4,10","1,2","5","4","4","5","1,2","1,2","8","7","5","4,8","1,2","4","1,2","5","1,2","1,2,5","5","4","5","5","1,2","1,2","4","4","5","4","4","1,2","5","1,2","5,8","1,2","1,2","4","8","13,14","4,8","5","5","4","1,2","4","1,2","10,11","4","5","5","4","18,19","18,19","5","10","5","4","5","4","4","5","4","4","5","5","5","1,2","5","4","4","4","5","5","1,2","18,19","5","4","4","1,2","8","4,5","1,2","1,2","4,5,7,8","8","5","4","4,8","1,2","1,2,5,8","8","5","8","1,2","5","4,5","4","5","1,2","1,2","4","1,2","8","5","1,2","8","9","4","1,2","5","4","4","4","5","4","4","4","1,2","5","4","5","15,16","4","5","4","4","8","5","4","1,2","5","1,2","5","1,2","1,2","5","8","5","5","4","4,5","5","5","4","4","4","4","5","4","8","8","5","8","4","4","5,8","20","8","8","8","5","4","8","1,2","1,2","4","4","1,2"];
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
    const arglists = /* 21 */ ["","11,0,1","11,2,1","12,3,4","12,5,6","12,3,7","23,8,9","23,6,10","23,11,12","8,13","11,6,14","11,15,16","12,5,17","15,18","13,18","11,19,20","11,21,14","13,22","11,23,24","11,25,24","22,26,27"];
    const args = /* 28 */ ["Navigator.prototype.globalPrivacyControl","false","navigator.globalPrivacyControl","document.getElementsByTagName","gtm.js","document.createElement","admiral",".pubads","HTMLElement.prototype.insertBefore","/[A-Z] .+chunks\\/\\d{4}\\./",".js?","decodeURI","/(?=^(?!.*\\.js))/","..props.children.*[?.key==\"admiral-script\"]","noopFunc","gnt.x.adm","","keen-tracking","stella","ncbi.sg","{}","ncbi.sg.ping","/i/api/1.1/flow/viewer.json","OfflineAudioContext","undefined","navigator.bluetooth","mouseup","sendClickEvent"];
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
