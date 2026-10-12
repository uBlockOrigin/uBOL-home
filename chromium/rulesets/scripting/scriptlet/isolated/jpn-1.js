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
    const scriptletHostnames = /* 68 */ ["ebbs.jp","icon.jp","game8.jp","aikru.com","o-dan.net","okwave.jp","aidoly.net","dvdrev.com","eromon.net","moez-m.com","rxlife.net","chimolog.co","famitsu.com","figsoku.net","gamewith.jp","livefans.jp","my-best.com","negisoku.com","phileweb.com","sinsimmd.com","ura-akiba.jp","ch-review.net","idol-blog.com","kimootoko.net","mantan-web.jp","okazurand.net","tapestry.work","yamiisoku.com","fm.sekkaku.net","geinoukame.com","hobbylabon.com","nailcolor.work","video.laxd.com","arty-matome.com","bridalgown.work","lifematome.blog","monhan-soku.com","rank1-media.com","resizer.myct.jp","www.yahoo.co.jp","blog.livedoor.jp","figure-times.com","genshin-soku.com","kabegami.jpn.org","kasegeru.blog.jp","nichepcgamer.com","studioglass.work","tcg-bloglife.com","teaceremony.work","vk.sportsbull.jp","weddinghall.work","ranky-ranking.net","ba-goods-search.com","betweenjpandkr.blog","contents-group.work","hayamimi-gunpla.com","seikeidouga.blog.jp","tyoieronews.blog.jp","nihon-bijo-zukan.com","ideal2ch.livedoor.biz","inkbrushpainting.work","liquidfoundation.work","lovelive-petitsoku.com","xn--gckdevd5myivf.site","heisei-housewarming.work","gametohkenranbu.sakuraweb.com","pretravel.kawasaki-create.com","safeframe.googlesyndication.com"];
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
        const arglistRefs = /* 68 */ ["27","19","25","14","6","31","14","10","28","28","3","25,26","25","23,24,25,26","29,30","26","21,25,26","14","15","18","28","14","28","28","22,23","28","4,5","1","11","32","23","4,5","13","14","4,5","12","1","14","14","17","8","19","1","14","7","26","4,5","14","4,5","34","4,5","14","19","9","4,5","19,25,26","14","20","28","14","4,5","4,5","16","1","4,5","14","2","33"];
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
    const arglists = /* 35 */ ["","1,0,1","1,0,2","1,0,3","8,4,5","8,6,5","13,7,8,9","1,10,11","1,0,12","1,10,13","1,10,14","1,10,15","1,10,16","13,17,18","1,10,19","13,20,21","1,10,22","11,23,24","1,10,25","11,26,27","1,10,28","11,29,30","11,31,32","11,33,34","11,35,36","11,37,38","11,39,40","7","11,41,34","20,42,43","13,44,45","20,46,43","1,10,47","11,48,49","13,50,51"];
    const args = /* 52 */ ["script","adsbygoogle","detectAdBlocker","detectAdBlock","adset","off","adset2","visited","#oRslt li a.visited","stay","#text","/スポンサードリンク：?|楽天広告：/","selectRandomProduct","PR:","関連動画","【広告】","/\\[vkExUnit_ad area=(after|before)\\]/","with-ad","section.main","/スポンサード?リンク/","has-topbanner","body > header.has-topbanner","[PR]","a[href^=\"https://app.adjust.com/\"]","?redirect","/^PR\\s$/","a[href*=\"a8ejpredirect\"]","?a8ejpredirect","/^\\s*PR\\s*$/","a[href^=\"/link?fallback_url=\"]","?fallback_url","a[href^=\"https://af.moshimo.com/af/c/click?\"][href*=\"&url=\"]","?url","a[href^=\"https://al.dmm.com/?lurl=\"]","?lurl","a[href^=\"https://affiliate.suruga-ya.jp/modules/af/af_jump.php?\"]","?goods_url","a[href*=\"hb.afl.rakuten.co.jp/\"][href*=\"pc=\"]","?pc","a[href*=\"ck.jp.ap.valuecommerce.com/servlet/referral?\"][href*=\"&vc_url=\"]","?vc_url","a[href^=\"https://al.fanza.co.jp/?lurl=\"]","discarded-search-interstitial-cta-banner","true","is-collaboration-jack","body","okwave_rwd","/^\\s*PR$/","a[href^=\"https://adclick.g.doubleclick.net/\"][href*=\"adurl=\"]","?adurl","hidden-by-ima","#vid1_html5_api"];
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
