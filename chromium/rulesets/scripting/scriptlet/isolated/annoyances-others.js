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

// ruleset: annoyances-others

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
    const scriptletHostnames = /* 123 */ ["bbc.com","cbr.com","cnn.com","r34.app","vox.com","branc.jp","kbtx.com","kptv.com","usni.org","wfaa.com","wkyc.com","deepl.com","nautil.us","on.orf.at","today.com","nypost.com","oceana.org","plough.com","redfin.com","rtings.com","rumble.com","zippia.com","cbsnews.com","chatgpt.com","inquinte.ca","nbcnews.com","pawread.com","politico.eu","reuters.com","science.org","semrush.com","thebump.com","thespec.com","thestar.com","theweek.com","climbing.com","collider.com","dutchnews.nl","gamerant.com","infowars.com","medscape.com","movieweb.com","politico.com","quillbot.com","statnews.com","thegamer.com","uploadvr.com","bloomberg.com","csmonitor.com","cyberdaily.au","howtogeek.com","inscribed.app","investing.com","irishnews.com","makeuseof.com","neilpatel.com","perplexity.ai","pocketnow.com","thejournal.ie","therecord.com","thetravel.com","allrecipes.com","lawinsider.com","nzherald.co.nz","screenrant.com","similarweb.com","techinasia.com","triathlete.com","firstthings.com","opensecrets.org","startribune.com","theguardian.com","democracynow.org","dualshockers.com","seekingalpha.com","theintercept.com","theolivepress.es","androidpolice.com","brusselstimes.com","independent.co.uk","spiked-online.com","theadviser.com.au","themonthly.com.au","wellandtribune.ca","bestrecipes.com.au","gmap-pedometer.com","nisanyansozluk.com","vaccineadvisor.com","vajiramandravi.com","xda-developers.com","clinicaladvisor.com","dailynewshungary.com","hartfordbusiness.com","lawyersweekly.com.au","neurologyadvisor.com","optometryadvisor.com","sleepwakeadvisor.com","defenceconnect.com.au","niagarafallsreview.ca","psychiatryadvisor.com","talkingpointsmemo.com","commonwealmagazine.org","dermatologyadvisor.com","pulmonologyadvisor.com","rarediseaseadvisor.com","accountantsdaily.com.au","clinicalpainadvisor.com","renalandurologynews.com","rheumatologyadvisor.com","stcatharinesstandard.ca","thesaturdaypaper.com.au","cancertherapyadvisor.com","endocrinologyadvisor.com","fantasyfootballhub.co.uk","oncologynurseadvisor.com","ophthalmologyadvisor.com","thecardiologyadvisor.com","realestatebusiness.com.au","sportsbusinessjournal.com","americanaffairsjournal.org","gastroenterologyadvisor.com","infectiousdiseaseadvisor.com","smartpropertyinvestment.com.au"];
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
        const arglistRefs = /* 123 */ ["51","4","19,20","12","13,14","81","76","76","62,63","79","79","72,73","22","16","78","51","74","48","46","23,24","64","5,6","80","54","32","78","45","51","21","70","1","10","52","52","25,26","51","4","40,41","4","39","53","4","51","68","51","4","36","17","71","69","4","49","57,58","21","4","33","34,35","4","15","52","4","75","7","29","4","2","43","51","50","30","60","8,9","44","4","37","67","47","4","51","75,77","11","69","51","52","3","31","38","56","61","4","56","18","55","69","56","56","56","69","52","56","27,28","59","56","56","56","69","56","56","56","52","51","56","56","66","56","56","56","69","42","65","56","56","69"];
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
    const arglists = /* 82 */ ["","15,0,1","9,2","9,3","9,4","9,5","5,6,7","9,8,9,10","5,11,7","5,12,7","8,13,14","5,15,7","5,16,1","5,17,7","5,18,7","5,19,20","13,21,22,23","5,24,7","5,25,1","5,26,7","5,27,7","5,28,7","9,29","9,30","9,31","5,32,7","5,33,7","9,34","9,35","8,36,37","13,38,39,23","8,40,14","13,41,22,23","13,42,43,23","15,44,37","15,45,14","5,46,14","5,47,48","5,49,14","15,50,14","8,51,1","8,52,1","9,53","9,54","8,55,14","5,56,7","13,57,43,23","9,58","9,59","5,60,14","8,61,1","9,62","9,63","9,64","15,65,14","9,66","9,67","9,68","9,69","9,70","9,71","8,72,14","9,73","9,74","8,75,1","9,76","15,77,14","1,78,79","5,80,7","5,81,7","9,82","5,83,7","5,84,7","5,85,7","8,86,1","13,87,43,23","13,88,43,23","13,89,43,23","13,90,43,23","13,91,43,23","13,92,43,23","8,93,1"];
    const args = /* 94 */ ["sem30_popup_shown","1","sgID","br_mc","articlesRead","_zippia-popup-s_t","gatedSignupTimerCounter","$remove$","tce","when","scroll","gu.history.dailyArticleCount","gu.history.weeklyArticleCount","registration_modal_dismissed","true","nudges","statistics-appOpenedCount","vox_article_readcount","vox_article_readcount_count","total_page_views","2","oon-scroll-lock","body","stay","history","wp_dark_mode_active","REG_WALL_METER","perm_cnn_regwall_v1","ArcP","arc","current-pageviews","product-previews","kiosq_article_reset","kiosq_article_url_ack","tpm_article_views","tpm_page_views","apv","false","js-no-scroll","html","patreonAnnouncementShown","blocked","mfp-popup-exit-quiz-v2","","shouldShowAuthBannerAfterQuery","signUpBannerDismissed","dismissedUpgradePrompt","__tp-gaAccount","disabled","newYeradlariWebsiteHidden","stream","dn_alert_homescreen_closed","dn_donation_count","sbj_archiveStatus","arts","campaign_seen_today","countChapterNum","stickyBanner","issuem_lp","ArticlePaywallList","hasVisitedBefore","pum_popup_14631_page_views","xbc","/^tncms:meter:/","first_article_visited","oai/apps/noAuthHasDismissedSoftRateLimitModal","meter_haystack","hmmet","lifetime_page_view_count","page_view_count","Drupal_visitor_paywall","client_id","GSAPR26","STYXKEY_nh_count","STYXKEY_pro_count","premium_popup","AAJPaywall","modalViewed","script","userData_","mode-quills","articleGateData","MAID","csm_unique_stories","LMT_freeUserUsageBlock","onboardingData","HideDonationLightbox","jw-flag-floating","powa-sticky","sticky","styles_stuck__gtILi","video__docker_state_docked","floating","inc_optin_never_see_again-popup-1"];
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
