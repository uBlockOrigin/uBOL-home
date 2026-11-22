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
    const scriptletHostnames = /* 266 */ ["x.com","al.com","nj.com","rd.com","aol.com","cbr.com","dnb.com","ijr.com","kgw.com","mwed.jp","tj.news","wnd.com","wwd.com","10tv.com","cbs19.tv","cbs8.com","cwtv.com","espn.com","khou.com","kkrt.com","krem.com","ktvb.com","kvue.com","money.it","omg.blog","uber.com","usaa.com","vibe.com","wbir.com","wcnc.com","wfaa.com","wgrz.com","wkyc.com","wltx.com","wnep.com","wqad.com","wral.com","wthr.com","wtol.com","wtsp.com","9news.com","abc10.com","chime.com","delta.com","dnb.co.uk","fox43.com","fox61.com","freep.com","kens5.com","king5.com","mlive.com","pcwelt.de","qobuz.com","thv11.com","tidal.com","vimeo.com","wusa9.com","wwltv.com","12news.com","13wmaz.com","apnews.com","boston.com","costco.com","deezer.com","driving.ca","filson.com","futbin.com","hopwtr.com","kare11.com","kcentv.com","kiiitv.com","macwelt.de","motor1.com","norton.com","nypost.com","ranker.com","rivals.com","silive.com","subway.com","weartv.com","whas11.com","wzzm13.com","11alive.com","artnews.com","bolighub.dk","capezio.com","cattime.com","dogtime.com","foxnews.com","gamepur.com","gbatemp.net","geizhals.de","lfpress.com","nbcnews.com","neopets.com","news.com.au","pandora.com","pcworld.com","porsche.com","queerty.com","reuters.com","sherdog.com","sporcle.com","spotify.com","titantv.com","twitter.com","variety.com","visible.com","weather.com","wowhead.com","artforum.com","collider.com","deadline.com","dpreview.com","engadget.com","formula1.com","gamerant.com","grabify.link","gulflive.com","hemmings.com","inquirer.net","jdsports.com","komonews.com","madewell.com","masslive.com","mazdausa.com","michaels.com","movieweb.com","news8000.com","nicovideo.jp","pennlive.com","sidereel.com","sportico.com","syracuse.com","thegamer.com","tirerack.com","topspeed.com","ubereats.com","usatoday.com","webmail.wiki","12newsnow.com","13newsnow.com","247sports.com","aliexpress.ru","aliexpress.us","billboard.com","cbssports.com","cleveland.com","fresnobee.com","goldderby.com","hancinema.net","howtogeek.com","indiewire.com","magesypro.pro","makeuseof.com","myfoxzone.com","nbcsports.com","newswest9.com","newyorker.com","ottawasun.com","pwinsider.com","savvytime.com","thelayoff.com","weareiowa.com","wfmynews2.com","www.yahoo.com","aliexpress.com","calgarysun.com","cheatsheet.com","comingsoon.net","eventbrite.com","gameskinny.com","golfdigest.com","mail.yahoo.com","milesplit.live","oregonlive.com","primagames.com","robbreport.com","screenrant.com","siliconera.com","soundcloud.com","techcrunch.com","thebeenews.com","thehealthy.com","themarysue.com","ticketmaster.*","torontosun.com","twinfinite.net","videogamer.com","5newsonline.com","accuweather.com","acmemarkets.com","arstechnica.com","crunchyroll.com","destructoid.com","edmontonsun.com","flyfrontier.com","fox11online.com","foxbusiness.com","lgbtqnation.com","mensjournal.com","nydailynews.com","order-order.com","payment.nba.com","tasteofhome.com","techlicious.com","technicpack.net","theprovince.com","windsorstar.com","wrestlezone.com","esportstales.com","knowyourmeme.com","lenscrafters.com","localmemphis.com","motorbiscuit.com","nationalpost.com","ncbi.nlm.nih.gov","nofilmschool.com","rollingstone.com","simpleflying.com","thenerdstash.com","touchtapplay.com","vancouversun.com","wrestlinginc.com","wunderground.com","calgaryherald.com","chattanoogacw.com","dollargeneral.com","financialpost.com","harborfreight.com","iphoneincanada.ca","monsterenergy.com","ottawacitizen.com","progameguides.com","superherohype.com","birdsandblooms.com","bringmethenews.com","crooksandliars.com","familyhandyman.com","firstcoastnews.com","insider-gaming.com","nationalreview.com","thefashionspot.com","xda-developers.com","edmontonjournal.com","forums.hfboards.com","gamerjournalist.com","lehighvalleylivecom","newscentermaine.com","portlandtribune.com","stealthoptional.com","thedraftnetwork.com","bellinghamherald.com","lehighvalleylive.com","search.rakuten.co.jp","theoutlookonline.com","wegotthiscovered.com","attackofthefanboy.com","hollywoodreporter.com","informazionefiscale.it","beavertonvalleytimes.com","gladiatorgarageworks.com","livewithkellyandmark.com","playstationlifestyle.net","worldpopulationreview.com","aiskillsnavigator.microsoft.com"];
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
        const arglistRefs = /* 266 */ ["1,2,21","5,6,10","6","6","6","5","1,2","5","6","16","6","5","6","6","6","6","5,6","1,2","6","1,2","6","6","6","5","5","1,2","1,2","6","6","6","6","6","6","6","6","6","5","6","6","6","6","6","1,2","1,2","1,2","6","6","5","6","6","5,6,10","5,10","1,2","6","1,2","1,2","6","6","6","6","6","1,2","1,2","1,2","6","1,2","6","1,2","6","6","6","10","6","1,2","5","8","1,2","6,10","1,2","9","6","6","6","6","3","1,2","5","5","7,12,15","10","5,13","1,2","6","5","5","6,13","1,2","6,13","1,2","10","9","6","5,10","1,2","5","1,2","6","1,2","1,2,6","6","6","5","6","6","1,2","1,2","5","5","6","5","5","1,2","6","1,2","6,10","1,2","1,2","5","10","17,18","5,6,10","6","6","6","5","1,2","5","1,2","13,14","5","6","6","5","22,23","22,23","6","13","6,9","5","6","5","5","6","5","5","6","6","6","1,2","6","5","5","5","6","6","1,2","22,23","6","5","5","1,2","10","5,6","1,2","1,2","5,6,9,10","10","6","5","5,10","1,2","1,2,6,10","10","6","10","1,2","6","5,6","5","6","1,2","1,2","5","1,2","10","6","1,2","9","7,12","10","11","6","5","1,2","6","5","5","5","6","5","5","5","1,2","6","5","6","19,20","5","6","5","5","10","6","5","1,2","6","6","1,2","6","1,2","4","1,2","6","10","6","6","5","5,6","6","6","5","5","5","5","6","5","10","10","6","10","5","5","6","6,10","24","10","10","10","6","5","10","1,2","1,2","5","5","1,2"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 0 */ [];
    const { hns, path } = scriptletGlobals.origins[0];
    for ( let i = 0, n = scriptletFromRegexes.length; i < n; i += 2 ) {
        const { needle, hn, pn } = scriptletFromRegexes[i+0];
        let rehn, repn;
        for ( const target of hns ) {
            if ( target.includes(needle) === false ) { continue; }
            if ( rehn === undefined ) { rehn = new RegExp(hn); }
            if ( rehn.test(target) === false ) { continue; }
            if ( pn && path ) {
                if ( repn === undefined ) { repn = new RegExp(pn); }
                if ( repn.test(path) === false ) { continue; }
            }
            for ( const ref of JSON.parse(`[${scriptletFromRegexes[i+1]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

// Execute scriptlets
if ( todo.size && todo.has(0) === false ) {
    const arglists = /* 25 */ ["","11,0,1","11,2,1","12,3,4","12,5,6","12,5,7","12,3,8","22,9,10","23,11,12","23,7,13","23,14,15","8,16","14,10","11,7,17","11,18,19","11,20,21","12,5,22","15,23","13,23","11,24,25","11,26,17","13,27","11,28,29","11,30,29","22,31,32"];
    const args = /* 33 */ ["Navigator.prototype.globalPrivacyControl","false","navigator.globalPrivacyControl","document.getElementsByTagName","gtm.js","document.createElement","__apNoHold","admiral",".pubads","/load|error/",",G=null),clearTimeout(K),!","HTMLElement.prototype.insertBefore","/[A-Z] .+chunks\\/\\d{4}\\./",".js?","decodeURI","/(?=^(?!.*\\.js))/","..props.children.*[?.key==\"admiral-script\"]","noopFunc","gnt.x.adm","","admrlWpJsonP","emptyObj","keen-tracking","stella","ncbi.sg","{}","ncbi.sg.ping","/i/api/1.1/flow/viewer.json","OfflineAudioContext","undefined","navigator.bluetooth","mouseup","sendClickEvent"];
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
})("28049053-2f06-4210-9323-9d4634fd8974");

void 0;
