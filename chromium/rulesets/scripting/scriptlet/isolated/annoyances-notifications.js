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

// ruleset: annoyances-notifications

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
    const scriptletHostnames = /* 46 */ ["gq.co.za","ktoo.org","vrbo.com","audius.co","deepl.com","google.com","noovo.info","onedio.com","reddit.com","shufoo.net","tiktok.com","tubitv.com","tunein.com","belstad.com","bestbuy.com","deribit.com","m.twitch.tv","thestar.com","threads.com","threads.net","facebook.com","fogaonet.com","tvtropes.org","food.ndtv.com","goodreads.com","instagram.com","perplexity.ai","s.tabelog.com","sammobile.com","sigmalive.com","crunchbase.com","foundit.com.ph","inews.hket.com","m.kaskus.co.id","similarweb.com","app.uniswap.org","mydramalist.com","wunderground.com","crealitycloud.com","flightradar24.com","jp-m.banggood.com","mypenndentist.org","shop-apotheke.com","themonthly.com.au","livesportsontv.com","m.economictimes.com"];
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
        const arglistRefs = /* 46 */ ["7","5","48","29","42","19","1","51","9,10,11,12","52","14","27","24,25","45","18","47","15","30","2","2","13","39","40,41","43","8","3,4","16","46","44","28","22","36","31","35","49","17","50","26","33,34","37","32","21","38","23","6","20"];
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
    const arglists = /* 53 */ ["","8,0,1","15,2,3","15,4,3","15,5,3","8,6,3","5,7,3","8,8,1","8,9,1","13,10,11,12","5,13,3","13,14,11,12","13,15,11,12","13,16,11,12","15,17,3","15,18,1","15,19,1","15,20,1","5,21,3","5,22,3","15,23,1","8,24,3","5,25,26","5,27,26","8,28,1","8,29,1","13,30,11,12","5,31,3","5,32,33","13,34,35,12","13,36,35,12","13,37,38,12","13,39,35,12","5,40,3","5,41,3","15,42,3","15,43,1","8,44,3","15,45,1","8,46,3","8,47,3","8,48,1","15,49,1","8,50,33","5,51,3","5,52,1","8,53,1","5,54,1","13,55,11,12","13,56,11,12","13,57,11","8,58,3","13,59,11"];
    const args = /* 60 */ ["pushNotifications_popup_displayed_v2","true","barcelona_mobile_upsell_state","1","lodum","loggedOutCTAIsShown","modalDismissed","promotion-popup-closed","PromptLater","blocking_sign_in_interstitial","scroll-disabled","body","stay","xpromo-consolidation","rpl-scroll-lock","scroll-is-blocked","prevent-scrolling","webapp_first_open_cta","twilight.custom-smart-banner-dismissed","appDownloadBannerDismissed","hideMobileAppPromoBanner","smartBannerDismissed","mapslitepromosdismissed","nudgeStickyBannerHide","undefinedpopup-pdfpcouponoffer","entity-limiter-views","$remove$","rn","hideMacDesktopDialog","navBasedDialogManager","enable-sda","windows_prompt_shown_v3","push-notifications","no","scrollLock","","kumulos-background-mask-blur","no-scroll","html","show-app-bar","closeGuideRegisterTime","permission_open_push","open_in_browser","isDownloadAppBannerClosed","map_new_features_new_flightradar24_com_label_options","ErxModal","fn_cookie_whatsapp_alert","app-announcement-banner-count-guest","app-announcement-banner-guest","LMT_browserExtensionPromo.displayed","ndtvfood_isSubscribed_elex_v1","request-permission-modal","is_announcement_closed","ignore_language_guide","appCardSeen","has-uitk-sheet","app-banner-parent","smartbanner-active","o-push-alert","is-hidden"];
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
