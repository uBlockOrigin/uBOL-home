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

// ruleset: jpn-1

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
    const scriptletHostnames = /* 69 */ ["ebbs.jp","icon.jp","game8.jp","aikru.com","o-dan.net","okwave.jp","aidoly.net","dvdrev.com","eromon.net","javcup.com","moez-m.com","rxlife.net","chimolog.co","famitsu.com","figsoku.net","gamewith.jp","livefans.jp","my-best.com","negisoku.com","phileweb.com","sinsimmd.com","ura-akiba.jp","ch-review.net","idol-blog.com","kimootoko.net","mantan-web.jp","okazurand.net","tapestry.work","yamiisoku.com","fm.sekkaku.net","geinoukame.com","hobbylabon.com","nailcolor.work","video.laxd.com","arty-matome.com","bridalgown.work","lifematome.blog","monhan-soku.com","rank1-media.com","resizer.myct.jp","www.yahoo.co.jp","blog.livedoor.jp","figure-times.com","genshin-soku.com","kabegami.jpn.org","kasegeru.blog.jp","nichepcgamer.com","studioglass.work","tcg-bloglife.com","teaceremony.work","vk.sportsbull.jp","weddinghall.work","ranky-ranking.net","ba-goods-search.com","betweenjpandkr.blog","contents-group.work","hayamimi-gunpla.com","seikeidouga.blog.jp","tyoieronews.blog.jp","nihon-bijo-zukan.com","ideal2ch.livedoor.biz","inkbrushpainting.work","liquidfoundation.work","lovelive-petitsoku.com","xn--gckdevd5myivf.site","heisei-housewarming.work","gametohkenranbu.sakuraweb.com","pretravel.kawasaki-create.com","safeframe.googlesyndication.com"];
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
        const arglistRefs = /* 69 */ ["28","20","26","15","6","32","15","10","29","14","29","3","26,27","26","24,25,26,27","30,31","27","22,26,27","15","16","19","29","15","29","29","23,24","29","4,5","1","11","33","24","4,5","13","15","4,5","12","1","15","15","18","8","20","1","15","7","27","4,5","15","4,5","35","4,5","15","20","9","4,5","20,26,27","15","21","29","15","4,5","4,5","17","1","4,5","15","2","34"];
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
    const arglists = /* 36 */ ["","1,0,1","1,0,2","1,0,3","8,4,5","8,6,5","13,7,8,9","1,10,11","1,0,12","1,10,13","1,10,14","1,10,15","1,10,16","13,17,18","8,19,20","1,10,21","13,22,23","1,10,24","11,25,26","1,10,27","11,28,29","1,10,30","11,31,32","11,33,34","11,35,36","11,37,38","11,39,40","11,41,42","7","11,43,36","20,44,45","13,46,47","20,48,45","1,10,49","11,50,51","13,52,53"];
    const args = /* 54 */ ["script","/adsby|console|data-ad|modal|requestAnimationFrame|srcdoc|tagName|text\\/html|userAgent|visibility|zucks|^[\\S\\s]{3200,}$|\\\\u00|ブロッカ/","detectAdBlocker","detectAdBlock","adset","off","adset2","visited","#oRslt li a.visited","stay","#text","/スポンサードリンク：?|楽天広告：/","selectRandomProduct","PR:","関連動画","【広告】","/\\[vkExUnit_ad area=(after|before)\\]/","with-ad","section.main","card-item","1","/スポンサード?リンク/","has-topbanner","body > header.has-topbanner","[PR]","a[href^=\"https://app.adjust.com/\"]","?redirect","/^PR\\s$/","a[href*=\"a8ejpredirect\"]","?a8ejpredirect","/^\\s*PR\\s*$/","a[href^=\"/link?fallback_url=\"]","?fallback_url","a[href^=\"https://af.moshimo.com/af/c/click?\"][href*=\"&url=\"]","?url","a[href^=\"https://al.dmm.com/?lurl=\"]","?lurl","a[href^=\"https://affiliate.suruga-ya.jp/modules/af/af_jump.php?\"]","?goods_url","a[href*=\"hb.afl.rakuten.co.jp/\"][href*=\"pc=\"]","?pc","a[href*=\"ck.jp.ap.valuecommerce.com/servlet/referral?\"][href*=\"&vc_url=\"]","?vc_url","a[href^=\"https://al.fanza.co.jp/?lurl=\"]","discarded-search-interstitial-cta-banner","true","is-collaboration-jack","body","okwave_rwd","/^\\s*PR$/","a[href^=\"https://adclick.g.doubleclick.net/\"][href*=\"adurl=\"]","?adurl","hidden-by-ima","#vid1_html5_api"];
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
