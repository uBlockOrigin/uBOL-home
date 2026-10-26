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

// ruleset: ublock-experimental

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
    const scriptletHostnames = /* 1 */ ["www.youtube.com"];
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
        const arglistRefs = /* 1 */ ["-2,-3,3"];
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
    const arglists = /* 4 */ ["","0,0,1,2,3,4,5,6,7,8","0,0,1,9,3,4,5,6,7,8","0,0,1,10,3,4,5,6,7,8"];
    const args = /* 11 */ ["script","/(\\(function serverContract\\(\\)|^if \\(window\\.ytcsi)/","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===window.ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||\"YOUTUBE_PREMIUM_LOGO\"===document.getElementById(\"masthead\").attributes[\"logo-type\"].value||location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\"))return;const e=window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent,t=[\"channel\",\"lactmilli\",\"instream\",\"yahi\"];let r=!1,o=t;const a=t=>{if(t){let r=e?.match?.(/Mozilla\\/5\\.0 \\([^)]+/)?.[0];window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=r?e.replace?.(r,r+\"; \"+t):e}else window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=e},n=()=>{let e=document.getElementById(\"movie_player\");return{player:e,response:e?.getPlayerResponse?.(),stats:e?.getStatsForNerds?.(),progress:e?.getProgressState?.(),buffer:e?.getPlayerStateObject?.()?.isBuffering}},s=(e,t,r)=>e&&\"0.00 s\"===t?.buffer_health_seconds&&\"0x0\"===t?.resolution&&r.length>0,l=()=>{let{player:e,response:t,stats:a,buffer:l}=n();e&&s(l,a,o)&&(t?.playbackTracking?.videostatsPlaybackUrl?.baseUrl?.includes?.(\"reloadxhr\")&&(o=o.slice(1)),r=!0)};document.addEventListener(\"DOMContentLoaded\",(function(){const e=()=>{let e,l,{player:i,response:d,stats:c,progress:p,buffer:y}=n();if(i&&window.location.href.includes(\"/watch?\")){if(p&&p.duration>0&&(p.loaded<p.duration||p.duration-p.current>1)||d?.videoDetails?.isLive){if(!c?.debug_info?.startsWith?.(\"SSAP, AD\")){const t=new URLSearchParams(window.location.search),n=d.videoDetails?.videoId,u=d.playerConfig?.playbackStartConfig?.startSeconds||parseInt(t.get(\"t\"),10)||0,g=d.playabilityStatus?.errorScreen,w=JSON.stringify(g?.playerErrorMessageRenderer?.subreason?.runs||g?.playerInterstitialRenderer?.content?.interstitialViewModel?.description?.commandRuns);return void(\"UNPLAYABLE\"===d?.playabilityStatus?.status&&!g?.playerErrorMessageRenderer?.playerCaptchaViewModel&&w?.includes?.(\"WEB_PAGE_TYPE_UNKNOWN\")&&w?.includes?.(\"https://support.google.com/youtube/answer/3037019\")?(o=o.slice(1),o.length>0?a(o[0]):a(\"\"),r=!1,i.loadVideoById(n,u)):0===o.length?(r=!1,a(\"\")):s(y,c,o)&&r?(a(o[0]),r=!1,i.loadVideoById(n,u)):!r&&p.current-u>.1&&p.current-u<5&&location.href.includes(\"&list=\")&&null===i.getPlaylistId?.()&&(e=document.querySelector(\"yt-playlist-manager\"),l=e?.getPlaylistData?.(),l&&(e.setPlaylistData?.(l),e.setPlayerPlaybackControlData?.({playlistPanelRenderer:l}))))}p.duration>0&&i.seekTo?.(p.duration)}}else o=t};e(),new MutationObserver((()=>{e()})).observe(document,{childList:!0,subtree:!0})})),window.Map.prototype.has=new Proxy(window.Map.prototype.has,{apply:(e,t,o)=>(\"onSnackbarMessage\"!==o?.[0]||r||l(),Reflect.apply(e,t,o))}),window.Array.prototype.push=new Proxy(window.Array.prototype.push,{apply:(e,t,r)=>{let o=r?.[0];return!o||\"object\"!=typeof o||\"Uint8Array\"!==o.constructor.name||o.buffer?.byteLength!==o.length||105!==o.length&&104!==o.length||l(),Reflect.apply(e,t,r)}});const i={apply:(e,t,r)=>{const o=r[0];return\"function\"==typeof o&&o.toString().includes(\"onAbnormalityDetected\")&&(r[0]=function(){}),Reflect.apply(e,t,r)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,i)})();$1","sedCount","1","excludes","MutationObserver","condition","/serverContract|js_ld/","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===window.ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||\"YOUTUBE_PREMIUM_LOGO\"===document.getElementById(\"masthead\")?.attributes?.[\"logo-type\"]?.value||location.href.startsWith(\"https://www.youtube.com/tv#/\"))return;const e=window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent,t=[\"channel\",\"lactmilli\",\"inline\",\"yahi\"];let r=!1,o=t;const n=t=>{if(t){let r=e?.match?.(/Mozilla\\/5\\.0 \\([^)]+/)?.[0];window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=r?e.replace?.(r,r+\"; \"+t):e}else window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=e},a=()=>{let e=document.getElementById(\"movie_player\");return{player:e,response:e?.getPlayerResponse?.(),stats:e?.getStatsForNerds?.(),progress:e?.getProgressState?.(),buffer:e?.getPlayerStateObject?.()?.isBuffering}},l=(e,t,r)=>e&&\"0.00 s\"===t?.buffer_health_seconds&&\"0x0\"===t?.resolution&&r.length>0,s=()=>{let{player:e,response:t,stats:n,buffer:s}=a();e&&l(s,n,o)&&(t?.playbackTracking?.videostatsPlaybackUrl?.baseUrl?.includes?.(\"reloadxhr\")&&(o=o.slice(1)),r=!0)};document.addEventListener(\"DOMContentLoaded\",(function(){const e=()=>{let e,s,{player:i,response:d,stats:c,progress:p,buffer:y}=a();if(i&&(window.location.href.includes(\"/watch?\")||window.location.href.includes(\"/embed/\"))){if(p&&p.duration>0&&(p.loaded<p.duration||p.duration-p.current>1)||d?.videoDetails?.isLive){if(c&&!c?.debug_info?.startsWith?.(\"SSAP, AD\")){const t=new URLSearchParams(window.location.search),a=d.videoDetails?.videoId,u=d.playerConfig?.playbackStartConfig?.startSeconds||parseInt(t.get(\"t\"),10)||0,g=d.playabilityStatus?.errorScreen,w=JSON.stringify(g?.playerErrorMessageRenderer?.subreason?.runs||g?.playerInterstitialRenderer?.content?.interstitialViewModel?.description?.commandRuns);return void(\"UNPLAYABLE\"===d?.playabilityStatus?.status&&!g?.playerErrorMessageRenderer?.playerCaptchaViewModel&&w?.includes?.(\"WEB_PAGE_TYPE_UNKNOWN\")&&w?.includes?.(\"https://support.google.com/youtube/answer/3037019\")?(o=o.slice(1),o.length>0?n(o[0]):n(\"\"),r=!1,i.loadVideoById(a,u)):0===o.length?(r=!1,n(\"\")):l(y,c,o)&&r?(n(o[0]),r=!1,i.loadVideoById(a,u)):!r&&p.current-u>.1&&p.current-u<5&&location.href.includes(\"&list=\")&&null===i.getPlaylistId?.()&&(e=document.querySelector(\"yt-playlist-manager\"),s=e?.getPlaylistData?.(),s&&(e.setPlaylistData?.(s),e.setPlayerPlaybackControlData?.({playlistPanelRenderer:s}))))}c&&p.duration>0&&i.seekTo?.(p.duration)}}else o=t};e(),new MutationObserver((()=>{e()})).observe(document,{childList:!0,subtree:!0})})),window.Map.prototype.has=new Proxy(window.Map.prototype.has,{apply:(e,t,o)=>(\"onSnackbarMessage\"!==o?.[0]||r||s(),Reflect.apply(e,t,o))}),window.Array.prototype.push=new Proxy(window.Array.prototype.push,{apply:(e,t,r)=>{let o=r?.[0];return!o||\"object\"!=typeof o||\"Uint8Array\"!==o.constructor.name||o.buffer?.byteLength!==o.length||105!==o.length&&104!==o.length||(console.log(o),s()),Reflect.apply(e,t,r)}});const i={apply:(e,t,r)=>{const o=r[0];return\"function\"==typeof o&&o.toString().includes(\"onAbnormalityDetected\")&&(r[0]=function(){}),Reflect.apply(e,t,r)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,i)})();$1","(()=>{if(\"YOUTUBE_PREMIUM_LOGO\"===window.ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType||\"YOUTUBE_PREMIUM_LOGO\"===document.getElementById(\"masthead\")?.attributes?.[\"logo-type\"]?.value||location.href.startsWith(\"https://www.youtube.com/tv#/\"))return;const e=window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent,t=[\"channel\",\"lactmilli\",\"yahi\",\"instream\",\"adunit\",\"inline\",\"eafg\"];let r=!1,o=t;const n=t=>{if(t){let r=e?.match?.(/Mozilla\\/5\\.0 \\([^)]+/)?.[0];window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=r?e.replace?.(r,r+\"; \"+t):e}else window.ytcfg.data_.INNERTUBE_CONTEXT.client.userAgent=e},a=()=>{let e=document.getElementById(\"movie_player\");return{player:e,response:e?.getPlayerResponse?.(),stats:e?.getStatsForNerds?.(),progress:e?.getProgressState?.(),buffer:e?.getPlayerStateObject?.()?.isBuffering}},l=(e,t,r)=>e&&\"0.00 s\"===t?.buffer_health_seconds&&\"0x0\"===t?.resolution&&r.length>0,s=()=>{let{player:e,response:t,stats:n,buffer:s}=a();e&&l(s,n,o)&&(t?.playbackTracking?.videostatsPlaybackUrl?.baseUrl?.includes?.(\"reloadxhr\")&&(o=o.slice(1)),r=!0)};document.addEventListener(\"DOMContentLoaded\",(function(){const e=()=>{let e,s,{player:i,response:d,stats:c,progress:p,buffer:y}=a();if(i&&(window.location.href.includes(\"/watch?\")||window.location.href.includes(\"/embed/\"))){if(p&&p.duration>0&&(p.loaded<p.duration||p.duration-p.current>1)||d?.videoDetails?.isLive){if(c&&!c?.debug_info?.startsWith?.(\"SSAP, AD\")){const t=new URLSearchParams(window.location.search),a=d.videoDetails?.videoId,u=d.playerConfig?.playbackStartConfig?.startSeconds||parseInt(t.get(\"t\"),10)||0,g=d.playabilityStatus?.errorScreen,w=JSON.stringify(g?.playerErrorMessageRenderer?.subreason?.runs||g?.playerInterstitialRenderer?.content?.interstitialViewModel?.description?.commandRuns);return void(\"UNPLAYABLE\"===d?.playabilityStatus?.status&&!g?.playerErrorMessageRenderer?.playerCaptchaViewModel&&w?.includes?.(\"WEB_PAGE_TYPE_UNKNOWN\")&&w?.includes?.(\"https://support.google.com/youtube/answer/3037019\")?(o=o.slice(1),o.length>0?n(o[0]):n(\"\"),r=!1,i.loadVideoById(a,u)):0===o.length?(r=!1,n(\"\")):l(y,c,o)&&r?(n(o[0]),r=!1,i.loadVideoById(a,u)):!r&&p.current-u>.1&&p.current-u<5&&location.href.includes(\"&list=\")&&null===i.getPlaylistId?.()&&(e=document.querySelector(\"yt-playlist-manager\"),s=e?.getPlaylistData?.(),s&&(e.setPlaylistData?.(s),e.setPlayerPlaybackControlData?.({playlistPanelRenderer:s}))))}c&&p.duration>0&&i.seekTo?.(p.duration)}}else o=t};e(),new MutationObserver((()=>{e()})).observe(document,{childList:!0,subtree:!0})})),window.Map.prototype.has=new Proxy(window.Map.prototype.has,{apply:(e,t,o)=>(\"onSnackbarMessage\"!==o?.[0]||r||s(),Reflect.apply(e,t,o))}),window.Array.prototype.push=new Proxy(window.Array.prototype.push,{apply:(e,t,r)=>{let o=r?.[0];return!o||\"object\"!=typeof o||\"Uint8Array\"!==o.constructor.name||o.buffer?.byteLength!==o.length||105!==o.length&&104!==o.length||(console.log(o),s()),Reflect.apply(e,t,r)}});const i={apply:(e,t,r)=>{const o=r[0];return\"function\"==typeof o&&o.toString().includes(\"onAbnormalityDetected\")&&(r[0]=function(){}),Reflect.apply(e,t,r)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,i)})();$1"];
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
