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

/* eslint-disable indent */

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_replaceNodeText = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["script","\"adBlockWallEnabled\":true","\"adBlockWallEnabled\":false"],["script","/vastURL:.*?',/","vastURL: '',"],["script","/url:.*?',/","url: '',"],["script","popunder","p"],["script","/\\$.*embed.*.appendTo.*;/","","condition","appendTo"],["script","setInterval"],["script","/\\\"homad\\\",/"],["script","/\\\"homad\\\":\\{\\\"state\\\":\\\"enabled\\\"\\}/","\"homad\":{\"state\":\"disabled\"}"],["script","\"isAdBlockerEnabled\":true","\"isAdBlockerEnabled\":false"],["script","(isNoAds)","(true)"],["script","popunder","","condition","popunder","stay","1"],["script","\"}};","\"}}; jQuery(document).ready(function(t){let e=document.createElement(\"link\");e.setAttribute(\"rel\",\"stylesheet\"),e.setAttribute(\"media\",\"all\"),e.setAttribute(\"href\",\"https://dragontea.ink/wp-content/cache/autoptimize/css/autoptimize_5bd1c33b717b78702e18c3923e8fa4f0.css\"),document.head.appendChild(e),t(\".dmpvazRKNzBib1IxNjh0T0cwUUUxekEyY3F6Wm5QYzJDWGZqdXFnRzZ0TT0nuobc\").parent().prev().prev().prev();var a=1,n=16,r=11,i=\"08\",g=\"\",c=\"\",d=0,o=2,p=3,s=0,h=100;s++,s*=2,h/=2,h/=2;var $=3,u=20;function b(){let e=t(\".entry-header.header\"),a=parseInt(e.attr(\"data-id\"));return a}function m(t,e,a,n,r){return CryptoJSAesJson.decrypt(t,e+a+n+r)}function f(t,e){return CryptoJSAesJson.decrypt(t,e)}function l(t,e){return parseInt(t.toString()+e.toString())}function k(t,e,a){return t.toString()+e.toString()+a.toString()}$*=2,u=u-2-2,i=\"03\",o++,r++,n=n/4-2,a++,a*=4,n++,n++,n++,a-=5,r++,i=\"07\",t(\".reading-content .page-break img\").each(function(){var e,g=t(this),c=f(g.attr(\"id\").toString(),(e=parseInt((b()+l(r,i))*a-t(\".reading-content .page-break img\").length),e=l(2*n+1,e)).toString());g.attr(\"id\",c)}),r=0,n=0,a=0,i=0,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=parseInt(e.attr(\"id\").replace(/image-(\\d+)[a-z]+/i,\"$1\"));t(\".reading-content .page-break\").eq(a).append(e)}),t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"id\");g+=e.substr(-1),t(this).attr(\"id\",e.slice(0,-1))}),d++,$++,$++,u/=4,u*=2,o*=2,p-=3,p++,t(\".reading-content .page-break img\").each(function(){var e,a=t(this),n=f(a.attr(\"dta\").toString(),(e=parseInt((b()+l($,u))*(2*d)-t(\".reading-content .page-break img\").length-(4*d+1)),e=k(2*o+p+p+1,g,e)).toString());a.attr(\"dta\",n)}),d=0,$=0,u=0,o=0,p=0,t(\".reading-content .page-break img\").each(function(){var e=t(this).attr(\"dta\").substr(-2);c+=e,t(this).removeAttr(\"dta\")}),s*=s,s++,h-=25,h++,h++,t(\".reading-content .page-break img\").each(function(){var e=t(this),a=f(e.attr(\"data-src\").toString(),(b(),k(b()+4*s,c,t(\".reading-content .page-break img\").length*(2*h))).toString());e.attr(\"data-src\",a)}),s=0,h=0,t(\".reading-content .page-break img\").each(function(){t(this).addClass(\"wp-manga-chapter-img img-responsive lazyload effect-fade\")}),_0xabe6x4d=!0});"],["script","scri12pts && ifra2mes && coo1kies","true"],["script","(scri12pts && ifra2mes)","(true)"],["script","/catch[\\s\\S]*?}/","","condition","fetch"],["script","/(function playVideo\\(\\) \\{[\\s\\S]*?\\.remove\\(\\);[\\s\\S]*?\\})/","$1 playVideo();"],["script","video_urls.length != activeItem","!1"],["script","adblockDetected = true","adblockDetected = false"],["script","!seen","false"],["script","/if.*includes.*;/"],["script","this.ads.length > this.ads_start","1==2"],["script","/\\$\\(['\"]\\.play-overlay['\"]\\)\\.click.+/s","document.getElementById(\"mainvideo\").src=srclink;player.currentTrack=0;})})","condition","srclink"],["script","200===r.status","0===r.status","condition","getNextDownloadPageLink"],["script","return r.responseText","return `a.getAttribute(\"data-ad-client\")||\"\"`","condition","getNextDownloadPageLink"],["script","const ad_slot_","(()=>{window.addEventListener(\"load\",(()=>{document.querySelectorAll(\"ins.adsbygoogle\").forEach((element=>element.dataset.adsbygoogleStatus=\"done\"))}))})();const ad_slot_","sedCount","1"],["script","window.dataLayer =","(()=>{const time=parseInt(document.querySelector(\"meta[http-equiv=\\\"refresh\\\"]\").content.split(\";\")[0])*1000+1000;setTimeout(()=>{document.body.innerHTML=document.body.innerHTML},time)})();window.dataLayer =","sedCount","1"],["script","/^([^{])/","document.addEventListener('DOMContentLoaded',()=>{const i=document.createElement('iframe');i.style='height:0;width:0;border:0';i.id='aswift_0';document.body.appendChild(i);i.focus();const f=document.createElement('div');f.id='9JJFp';document.body.appendChild(f);});$1","sedCount","2"],["script","/^window\\.location\\.href.*\\'$/gms"],["script","= false;","= true;","condition","innerHTML"],["script","'IFRAME'","'BODY'"],["script","typeof cdo == 'undefined' || document.querySelector('div.textads.banner-ads.banner_ads.ad-unit.ad-zone.ad-space.adsbox') == undefined","false"],["script","/window\\.location\\.href='.*';/","","condition","openLink"],["script","});","});var iframe = document.createElement('iframe');iframe.style.height = '0';iframe.style.width = '0';iframe.style.border = '0';document.body.appendChild(iframe);iframe.focus();","condition","googletag","sedCount","1"],["script","var seconde = 10;","var seconde = 0;"],["script","_blank","_self"],["script","return!![];","return![];"],["script",";return;","","condition","_0x"],["script","/return Array[^;]+/","return true"],["script","function sutounlock_0x","//function sutounlock_0x"],["script","event.message);","event.message); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/"],["script","/element\\.contains\\(document\\.activeElement\\)|document\\.hidden && !timeCounted/g","true"],["script","!seen && ad","false"],["script","vastTag","v"],["script","/protect_block.*?,/"],["script","break;case $."],["script","/\\(window\\.show[^\\)]+\\)/","(true)","condition","classList.add"],["script","redirectToErrorPage"],["script","(isAdblock)","(false)"],["style","visibility: visible !important;","display: none !important;"],["script","/.*adConfig.*frequency_period.*/","(async () => {const a=location.href;if(!a.includes(\"/download?link=\"))return;const b=new URL(a),c=b.searchParams.get(\"link\");try{location.assign(`${location.protocol}//${c}`)}catch(a){}} )();"],["script","added=false;","added=false;if (typeof localStorage !== 'undefined' && typeof JSON.parse(localStorage._ppp)['0_uid'] === 'undefined') {const originalvisualViewport=window.visualViewport; Object.defineProperty(window, 'visualViewport', {value: new Proxy(originalvisualViewport, {get(target,property) {if (property === 'width') {return document.documentElement.offsetWidth+320} return target[property]}}), configurable:true});}"],["script","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/common/css/etoday.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer ="],["script","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css_renew/pc/common.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer ="],["script","_paq.push","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/pc/ecn_common.min.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/_paq.push"],["script","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/wp-content/themes/hts_v2/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer ="],["script","window.dataLayer =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/_css/css.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/window.dataLayer ="],["script","document.getElementById(\"divRecentQuotes\")","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/css/so-clean.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/document.getElementById(\"divRecentQuotes\")"],["script","var _paq =","/*start*/(function(){let link=document.createElement(\"link\");link.rel=\"stylesheet\";link.href=\"/Content/css/style.css\";document.head.appendChild(link)})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var _paq =","sedCount","1"],["script","var localize =","/*start*/(function(){document.querySelectorAll(\"script[wp-data]\").forEach(element=>{const html=new DOMParser().parseFromString(atob(element.getAttribute(\"wp-data\")),\"text/html\");html.querySelectorAll(\"link:not([as])\").forEach(linkEl=>{element.after(linkEl)});element.parentElement.removeChild(element);})})();document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/var localize =","sedCount","1"],["script","\"adsDisabled\":false","\"adsDisabled\":true"],["style","::after{content:\" \";display:table;box-sizing:border-box}","{display: none !important;}","condition","text-decoration:none;vertical-align:middle"],["script","/openNewTab\\(\".*?\"\\)/g","null"],["script","window.dataLayer =","window.HTMLAnchorElement.prototype.click=new Proxy(window.HTMLAnchorElement.prototype.click,{apply:(target,thisArg,args)=>{if(thisArg&&!thisArg.href.includes(\"streamsilk.com\"))return;return Reflect.apply(target,thisArg,args)}});window.dataLayer =","sedCount","1"],["script","({});","({}); function showHideElements(t,e){$(t).hide(),$(e).show()}function disableBtnclc(){let t=document.querySelector(\".submit-captcha\");t.disabled=!0,t.innerHTML=\"Loading...\"}function refreshButton(){$(\".refresh-capthca-btn\").addClass(\"disabled\")}function copyInput(){let t=document.querySelectorAll(\".copy-input\");t.forEach(t=>{navigator.clipboard.writeText(t.value)}),Materialize.toast(\"Copied!\",2e3)}function imgOnError(){$(\".ua-check\").html(window.atob(\"PGRpdiBjbGFzcz0idGV4dC1kYW5nZXIgZm9udC13ZWlnaHQtYm9sZCBoNSBtdC0xIj5DYXB0Y2hhIGltYWdlIGZhaWxlZCB0byBsb2FkLjxicj48YSBvbmNsaWNrPSJsb2NhdGlvbi5yZWxvYWQoKSIgc3R5bGU9ImNvbG9yOiM2MjcwZGE7Y3Vyc29yOnBvaW50ZXIiIGNsYXNzPSJ0ZXh0LWRlY29yYXRpb25lLW5vbmUiPlBsZWFzZSByZWZyZXNoIHRoZSBwYWdlLiA8aSBjbGFzcz0iZmEgZmEtcmVmcmVzaCI+PC9pPjwvYT48L2Rpdj4=\"))}$(window).on(\"load\",function(){$(\"body\").addClass(\"loaded\")}),window.history.replaceState&&window.history.replaceState(null,null,window.location.href),$(\".remove-spaces\").on(\"input\",function(){this.value=this.value.replace(/\\s/g,\"\")}),$(document).on(\"click\",\"#toast-container .toast\",function(){$(this).fadeOut(function(){$(this).remove()})}),$(\".tktemizle\").on(\"input propertychange\",function(){let t=$(this).val().match(\"access_token=(.*?)&\");t&&$(\".tktemizle\").val(t[1])}),$(document).ready(function(){let t=[{button:$(\".t-followers-button\"),menu:$(\".t-followers-menu\")},{button:$(\".t-hearts-button\"),menu:$(\".t-hearts-menu\")},{button:$(\".t-chearts-button\"),menu:$(\".t-chearts-menu\")},{button:$(\".t-views-button\"),menu:$(\".t-views-menu\")},{button:$(\".t-shares-button\"),menu:$(\".t-shares-menu\")},{button:$(\".t-favorites-button\"),menu:$(\".t-favorites-menu\")},{button:$(\".t-livestream-button\"),menu:$(\".t-livestream-menu\")},{button:$(\".ig-followers-button\"),menu:$(\".ig-followers-menu\")},{button:$(\".ig-likes-button\"),menu:$(\".ig-likes-menu\")}];$.each(t,function(t,e){e.button.click(function(){$(\".colsmenu\").addClass(\"nonec\"),e.menu.removeClass(\"nonec\")})})});"],["script","/devtoolsDetector\\.launch\\(\\)\\;/"],["script","self.location.href;","self.location.href; document.addEventListener('DOMContentLoaded',()=>{const button=document.querySelector('form > input#method_free');if(button){button.click()}});","sedCount","1"],["script","//$('#btn_download').click();","$('#btn_download').click();","sedCount","1"],["script","/reymit_ads_for_categories\\.length>0|reymit_ads_for_streams\\.length>0/g","false"],["script","/data: \\[.*\\],/","data: [],","condition","ads_num"],["script","/try.*finally.*?}/"],["script","rek","r","condition","preroll"],["script","adv_","","condition","flashvars"],["script","typeof window.loadtwo","typeof window.loadtwo === true"],["script","(window.loadtwo","(window.loadtwo === undefined || true || window.googlescriptloaded"],["script","/if \\(api && url\\).+/s","window.location.href = url","condition","quick-link"],["script","= getSetTimeout()","= function newTimeout(func, timer) {func()}"],["script","IFRAME","BODY"],["script","(hasBlocker)","(false)"],["P","/\\.[^.]+(1Password password manager|download 1Password)[^.]+/"],["script","startTime: '5'","startTime: '0'"],["script","/(function downloadHD\\(obj\\) {)[\\s\\S]*?(datahref.*)[\\s\\S]*?(window.location.href = datahref;)[\\s\\S]*/","$1$2$3}"],["script","buton.setAttribute","location.href=urldes;buton.setAttribute"],["script","clickCount === numberOfAdsBeforeCopy","numberOfAdsBeforeCopy >= clickCount"],["script","video_urls.length != activeItem+1","video_urls.length === activeItem+1"],["script","/if\\(.&&.\\.target\\)/","if(false)"],["script","(document.hasFocus())","(false)"],["script","outboundUrl","outbound"],["script","(function($)","(function(){const a=document.createElement(\"div\");document.documentElement.appendChild(a),setTimeout(()=>{a&&a.remove()},100)})(); (function($)"],["script","/window\\.dataLayer.+?(location\\.replace\\(\\S+?\\)).*/","$1"],["script","WB.defer","window.wbads={public:{getDailymotionAdsParamsForScript:function(a,b){b(\"\")},setTargetingOnPosition:function(a,b){return}}};WB.defer","condition","wbads.public.setTargetingOnPosition"],["script","var ISMLIB","!function(){const o={apply:(o,n,r)=>(new Error).stack.includes(\"refreshad\")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();var ISMLIB"],["script","(function serverContract()","/*START*/\"YOUTUBE_PREMIUM_LOGO\"!==ytInitialData?.topbar?.desktopTopbarRenderer?.logo?.topbarLogoRenderer?.iconImage?.iconType&&(location.href.startsWith(\"https://www.youtube.com/tv#/\")||location.href.startsWith(\"https://www.youtube.com/embed/\")||document.addEventListener(\"DOMContentLoaded\",(function(){const t=()=>{const t=document.getElementById(\"movie_player\");if(!t)return;if(!t.getStatsForNerds?.()?.debug_info?.startsWith?.(\"SSAP, AD\"))return;const e=t.getProgressState?.();e&&e.duration>0&&(e.loaded<e.duration||e.duration-e.current>1)&&t.seekTo?.(e.duration)};t(),new MutationObserver((()=>{t()})).observe(document,{childList:!0,subtree:!0})})));(function serverContract()","sedCount","1"],["script","/null,\"category_sensitive\"[^\\n]+?,\"__typename\":\"SponsoredData\"[^\\n]+\"cursor\":\"[^\"]+\"\\}/g","null}"],["script","G-7QRHP3YRVD');","G-7QRHP3YRVD'); /*start*/ !function(){\"use strict\";let t={log:window.console.log.bind(console),getPropertyValue:CSSStyleDeclaration.prototype.getPropertyValue,setAttribute:Element.prototype.setAttribute,getAttribute:Element.prototype.getAttribute,appendChild:Element.prototype.appendChild,remove:Element.prototype.remove,cloneNode:Element.prototype.cloneNode,Element_attributes:Object.getOwnPropertyDescriptor(Element.prototype,\"attributes\").get,Array_splice:Array.prototype.splice,Array_join:Array.prototype.join,createElement:document.createElement,getComputedStyle:window.getComputedStyle,Reflect:Reflect,Proxy:Proxy,crypto:window.crypto,Uint8Array:Uint8Array,Object_defineProperty:Object.defineProperty.bind(Object),Object_getOwnPropertyDescriptor:Object.getOwnPropertyDescriptor.bind(Object),String_replace:String.prototype.replace},e=t.crypto.getRandomValues.bind(t.crypto),r=function(e,r,l){return\"toString\"===r?e.toString.bind(e):t.Reflect.get(e,r,l)},l=function(r){let o=function(t){return t.toString(16).padStart(2,\"0\")},p=new t.Uint8Array((r||40)/2);e(p);let n=t.String_replace.call(t.Array_join.call(Array.from(p,o),\"\"),/^\\d+/g,\"\");return n.length<3?l(r):n},o=l(15);window.MutationObserver=new t.Proxy(window.MutationObserver,{construct:function(e,r){let l=r[0],p=function(e,r){for(let p=e.length,n=p-1;n>=0;--n){let c=e[n];if(\"childList\"===c.type&&c.addedNodes.length>0){let i=c.addedNodes;for(let a=0,y=i.length;a<y;++a){let u=i[a];if(u.localName===o){t.Array_splice.call(e,n,1);break}}}}0!==e.length&&l(e,r)};r[0]=p;let n=t.Reflect.construct(e,r);return n},get:r}),window.getComputedStyle=new t.Proxy(window.getComputedStyle,{apply(e,l,p){let n=t.Reflect.apply(e,l,p);if(\"none\"===t.getPropertyValue.call(n,\"clip-path\"))return n;let c=p[0],i=t.createElement.call(document,o);t.setAttribute.call(i,\"class\",t.getAttribute.call(c,\"class\")),t.setAttribute.call(i,\"id\",t.getAttribute.call(c,\"id\")),t.setAttribute.call(i,\"style\",t.getAttribute.call(c,\"style\")),t.appendChild.call(document.body,i);let a=t.getPropertyValue.call(t.getComputedStyle.call(window,i),\"clip-path\");return t.remove.call(i),t.Object_defineProperty(n,\"clipPath\",{get:(()=>a).bind(null)}),n.getPropertyValue=new t.Proxy(n.getPropertyValue,{apply:(e,r,l)=>\"clip-path\"!==l[0]?t.Reflect.apply(e,r,l):a,get:r}),n},get:r})}(); document.currentScript.textContent=document.currentScript.textContent.replace(/\\/\\*start\\*\\/(.*)\\/\\*end\\*\\//g,\"\");/*end*/"],["script","'G-1B4LC0KT6C');","'G-1B4LC0KT6C'); window.setTimeout(function(){blockPing()},200);"],["script","/for\\s*\\(\\s*(const|let|var).*?\\)\\;return\\;\\}_/g","_","condition","attribute"],["script","/['\"]h.*?\\.o.*?v.*?\\.c.*?\\/a.*?js/","$1(function() {'use strict'; const handler = {apply: (target, thisArg, argumentsList) => {const e = argumentsList; if (e[0] && e[0].html?.detected === null && typeof e[0].html?.instance?.start === 'function' && typeof e[0].env?.instance?.start === 'function' && typeof e[0].http?.instance?.start === 'function') {const resetBooleans = function() {Object.keys(this).forEach(key => {if (typeof this[key] === 'boolean') {this[key] = false;}});}; ['html', 'env', 'http'].forEach(name => {e[0][name].instance.start = resetBooleans;});} return Reflect.apply(target, thisArg, argumentsList);}}; window.Object.keys = new Proxy(Object.keys, handler);})();"],["script","/\\(xhr\\) \\{\\s*\\(function\\(\\){var [a-zA-Z]{8}=atob\\(\\'.*?\\)\\;\\}\\)\\(\\);/","(xhr) {"],["script","(RLQ=window.RLQ","const shuffleArray=e=>e.sort((()=>Math.random()-Math.random()));function fetchComments(e){const t=new XMLHttpRequest;let n;t.onreadystatechange=()=>{4===t.readyState&&200===t.status&&(n=JSON.parse(t.responseText),renderComments(n))},t.open(\"GET\",\"/comments/comments.php?article_id=\"+RLCONF.wgArticleId+\"&cursor=\"+e,!0),t.send()}function fetchMore(e){fetchComments(e.target.dataset.cursor)}function renderComments(e){const t=document.querySelector(\"#comments\"),n=document.querySelector(\"#comments-contents\"),o=document.querySelector(\"#comments-loading\"),c=document.querySelector(\"#comments-more\"),m=document.querySelector(\"#comments-recent\");if(o&&o.remove(),c&&c.remove(),e.comments.forEach((e=>{const n=window.comments.template.querySelector(\"#comment\").cloneNode(!0);n.id=\"comment-\"+e.number,n.dataset.commentId=e.comment_id,n.querySelector(\".comment-author\").innerHTML=e.author,n.querySelector(\".comment-timestamp\").innerHTML=e.created_at,n.querySelector(\".comment-body\").innerHTML=e.comment,t.appendChild(n)})),e.cursor>0){const t=window.comments.template.querySelector(\"#comments-more\").cloneNode(!0);t.dataset.cursor=e.cursor,t.addEventListener(\"click\",fetchMore),n.appendChild(t)}const r=document.createElement(\"ul\");e.recent=shuffleArray(e.recent),e.recent.forEach((e=>{const t=document.createElement(\"li\"),n=document.createElement(\"a\");n.href=\"/w/index.php?curid=\"+e.article_id,e.comment.length>70&&(e.comment=e.comment.substring(0,70)+\"&hellip;\"),n.innerHTML=e.comment,t.appendChild(n),r.appendChild(t)})),m.appendChild(r.cloneNode(!0)),m.appendChild(r.cloneNode(!0)),\"#comments-section\"==location.hash&&(location.hash=\"\",location.hash=\"#comments-section\")}function submitComment(e){const t=document.querySelector('#comment-editor input[name=\"author\"]'),n=document.querySelector(\"#comment-editor textarea\");if(\"\"==n.value)return void mw.notify(\"（本文が）ないです\");e.target.disabled=!0,e.target.innerHTML=\"送信中…\";const o={article_id:RLCONF.wgArticleId,author:t.value,comment:n.value},c=[];for(const[e,t]of Object.entries(o))c.push(`${encodeURIComponent(e)}=${encodeURIComponent(t)}`);const m=new XMLHttpRequest;m.onreadystatechange=()=>{4===m.readyState&&(e.target.disabled=!1,e.target.innerHTML=\"投稿する\",200===m.status?(mw.notify(\"投稿しました\"),t.value=\"\",n.value=\"\",document.querySelector(\"#comments\").innerHTML=\"\",document.querySelector(\"#comments-recent\").innerHTML=\"\",setTimeout((()=>{fetchComments(0)}),\"100\")):403===m.status?mw.notify(\"（フリーWi-Fiからは書け）ないです\"):429===m.status?mw.notify(\"書きすぎィ！ちょっと待って、どうぞ！\"):mw.notify(\"投稿できませんでした…\"))},m.open(\"POST\",\"/comments/comments.php\"),m.setRequestHeader(\"Content-Type\",\"application/x-www-form-urlencoded\"),m.send(c.join(\"&\").replace(/%20/g,\"+\"))}window.addEventListener(\"load\",(()=>{if(0==RLCONF.wgNamespaceNumber&&\"view\"==RLCONF.wgAction&&0!=RLCONF.wgArticleId&&!RLCONF.wgIsRedirect&&RLCONF.wgRevisionId==RLCONF.wgCurRevisionId){\"#comments-section\"==location.hash&&window.scroll(0,document.documentElement.scrollHeight-document.documentElement.clientHeight),window.comments={};const e=new XMLHttpRequest;e.onreadystatechange=()=>{4===e.readyState&&200===e.status&&(window.comments.template=(new DOMParser).parseFromString(e.responseText,\"text/html\").body,document.querySelector(\"#bodyContent\").appendChild(window.comments.template.querySelector(\"#comments-section\")),document.querySelector(\"#comment-submit\").addEventListener(\"click\",submitComment),fetchComments(0))},e.open(\"GET\",\"/comments/assets/template.html\",!0),e.send()}}));function copyToClipboad(e){navigator.clipboard.writeText(this.caller.dataset.text).then((()=>{mw.notify(\"クリップボードにコピーしました\"),gtag(\"event\",\"clipboard\",{wgTitle:RLCONF.wgTitle,clipboard_status:\"done\"})}),(()=>{mw.notify(\"クリップボードにコピーできませんでした…\"),gtag(\"event\",\"clipboard\",{wgTitle:RLCONF.wgTitle,clipboard_status:\"failed\"})}))}function searchProduct(e){var t=\"\";if(\"FANZA\"===this.caller.dataset.asp){{const e=\"https://www.dmm.co.jp/digital/videoa/-/list/search/=/?searchstr=\"+encodeURI(RLCONF.wgPageName);t=\"https://al.dmm.co.jp/?lurl=\"+encodeURI(e)+\"&af_id=takayama-001&ch=toolbar&ch_id=link\"}window.open(t,\"_blank\"),gtag(\"event\",\"search_products\",{wgTitle:RLCONF.wgTitle,asp:this.caller.dataset.asp})}}function sfw(e){this.caller.classList.remove(\"nsfw\"),gtag(\"event\",\"nsfw\",{wgTitle:RLCONF.wgTitle})}document.querySelectorAll(\".copy_to_clipboard\").forEach((e=>{e.addEventListener(\"click\",{caller:e,handleEvent:copyToClipboad})})),document.querySelectorAll(\".search_products\").forEach((e=>{e.addEventListener(\"click\",{caller:e,handleEvent:searchProduct})})),document.querySelectorAll(\".share_button\").forEach((e=>{e.addEventListener(\"click\",(async e=>{const t={title:RLCONF.wgTitle+\" - 真夏の夜の淫夢Wiki\",text:RLCONF.wgTitle+\" - 真夏の夜の淫夢Wiki\",url:getAbsolutePath(\"/wiki/\"+encodeURI(RLCONF.wgPageName))};if(navigator.canShare&&navigator.canShare(t))try{await navigator.share(t),mw.notify(\"シェアしました\"),gtag(\"event\",\"share\",{wgTitle:RLCONF.wgTitle,share_type:\"share\",share_status:\"done\"})}catch(e){mw.notify(\"シェアできませんでした…\"),gtag(\"event\",\"share\",{wgTitle:RLCONF.wgTitle,share_type:\"share\",share_status:\"cancelled\"})}else navigator.clipboard.writeText(t.text+\" \"+t.url).then((()=>{mw.notify(\"クリップボードにコピーしました\"),gtag(\"event\",\"share\",{wgTitle:RLCONF.wgTitle,share_type:\"clipboard\",share_status:\"done\"})}),(()=>{mw.notify(\"クリップボードにコピーできませんでした…\"),gtag(\"event\",\"share\",{wgTitle:RLCONF.wgTitle,share_type:\"clipboard\",share_status:\"failed\"})}))}))})),document.querySelectorAll(\".nsfw\").forEach((e=>{e.addEventListener(\"click\",{caller:e,handleEvent:sfw})}));(RLQ=window.RLQ"],["script","var CBSNEWS =","navigator.serviceWorker.getRegistrations().then((registrations=>{for(const registration of registrations){if(registration.scope.includes(\"cbsnews.com\")){registration.unregister()}}}));var CBSNEWS ="]];

const hostnamesMap = new Map([["bild.de",0],["ashemaletube.com",[1,2]],["nhentai.net",3],["jizzbunker.com",4],["multiup.io",5],["giga.de",6],["kino.de",6],["spieletipps.de",6],["t-online.de",7],["games.metro.us",8],["arcade.dailygazette.com",8],["games.dailymail.co.uk",8],["playhydrax.com",9],["buktube.com",10],["fullxh.com",10],["galleryxh.site",10],["megaxh.com",10],["movingxh.world",10],["seexh.com",10],["unlockxh4.com",10],["valuexh.life",10],["xhaccess.com",10],["xhadult2.com",10],["xhadult3.com",10],["xhadult4.com",10],["xhadult5.com",10],["xhamster46.com",10],["xhamsterporno.mx",10],["xhbig.com",10],["xhbranch5.com",10],["xhchannel.com",10],["xhchannel2.com",10],["xhdate.world",10],["xhday.com",10],["xhday1.com",10],["xhlease.world",10],["xhmoon5.com",10],["xhofficial.com",10],["xhopen.com",10],["xhplanet1.com",10],["xhplanet2.com",10],["xhreal2.com",10],["xhreal3.com",10],["xhspot.com",10],["xhtab2.com",10],["xhtab4.com",10],["xhtotal.com",10],["xhtree.com",10],["xhvictory.com",10],["xhwebsite.com",10],["xhwebsite2.com",10],["xhwebsite5.com",10],["xhwide1.com",10],["xhwide2.com",10],["xhwide5.com",10],["xhxh3.xyz",10],["dragontea.ink",11],["perchance.org",[12,13]],["cheater.ninja",14],["dizikral.com",[15,16]],["dizikral1.pro",15],["dizikral2.pro",15],["dizikral3.pro",15],["dizikral4.pro",15],["dizikral5.pro",15],["soccerinhd.com",17],["streamcaster.live",17],["hidan.sh",18],["authenticateme.xyz",19],["filmizlehdizle.com",20],["fullfilmizlesene.net",20],["koramaup.com",[22,23]],["1cloudfile.com",[22,23]],["tempmail.ninja",24],["filmy4wap.co.in",25],["starkroboticsfrc.com",26],["sinonimos.de",26],["antonimos.de",26],["quesignifi.ca",26],["tiktokrealtime.com",26],["tiktokcounter.net",26],["tpayr.xyz",26],["poqzn.xyz",26],["ashrfd.xyz",26],["rezsx.xyz",26],["tryzt.xyz",26],["ashrff.xyz",26],["rezst.xyz",26],["dawenet.com",26],["erzar.xyz",26],["waezm.xyz",26],["waezg.xyz",26],["blackwoodacademy.org",26],["cryptednews.space",26],["vivuq.com",26],["swgop.com",26],["vbnmll.com",26],["telcoinfo.online",26],["dshytb.com",26],["hipsonyc.com",27],["theforyou.in",27],["gyanitheme.com",27],["hostadviser.net",27],["bloggingaro.com",27],["blog.cryptowidgets.net",[28,29]],["blog.insurancegold.in",[28,29]],["blog.wiki-topia.com",[28,29]],["blog.coinsvalue.net",[28,29]],["blog.cookinguide.net",[28,29]],["blog.freeoseocheck.com",[28,29]],["blog.coinsrise.net",29],["blog.makeupguide.net",29],["blog.carstopia.net",29],["blog.carsmania.net",29],["bitzite.com",29],["appsbull.com",29],["diudemy.com",29],["maqal360.com",29],["advertisingexcel.com",29],["allcryptoz.net",29],["batmanfactor.com",29],["beautifulfashionnailart.com",29],["crewbase.net",29],["crewus.net",29],["documentaryplanet.xyz",29],["gametechreviewer.com",29],["midebalonu.net",29],["misterio.ro",29],["phineypet.com",29],["seory.xyz",29],["shinbhu.net",29],["shinchu.net",29],["substitutefor.com",29],["talkforfitness.com",29],["thefitbrit.co.uk",29],["thumb8.net",29],["thumb9.net",29],["topcryptoz.net",29],["uniqueten.net",29],["ultraten.net",29],["exactpay.online",29],["suaurl.com",30],["mamahawa.com",31],["laweducationinfo.com",32],["savemoneyinfo.com",32],["worldaffairinfo.com",32],["godstoryinfo.com",32],["successstoryinfo.com",32],["cxissuegk.com",32],["learnmarketinfo.com",32],["bhugolinfo.com",32],["armypowerinfo.com",32],["rsadnetworkinfo.com",32],["rsinsuranceinfo.com",32],["rsfinanceinfo.com",32],["rsgamer.app",32],["rssoftwareinfo.com",32],["rshostinginfo.com",32],["rseducationinfo.com",32],["phonereviewinfo.com",32],["makeincomeinfo.com",32],["gknutshell.com",32],["vichitrainfo.com",32],["workproductivityinfo.com",32],["dopomininfo.com",32],["hostingdetailer.com",32],["fitnesssguide.com",32],["tradingfact4u.com",32],["cryptofactss.com",32],["softwaredetail.com",32],["artoffocas.com",32],["insurancesfact.com",32],["dlink2.net",33],["viralsbaba1.blogspot.com",34],["dl.apkmoddone.com",35],["phongroblox.com",35],["www.apkmoddone.com",[36,37]],["apkmodvn.com",38],["financemonk.net",39],["dailytech-news.eu",40],["fuckingfast.co",41],["eroasmr.com",42],["bussyhunter.com",43],["kusonime.com",45],["mcrypto.club",46],["codingnepalweb.com",47],["demonoid.is",48],["jpvhub.com",49],["photopea.com",50],["etoday.co.kr",51],["isplus.com",52],["economist.co.kr",53],["hometownstation.com",54],["sportalkorea.com",55],["thestockmarketwatch.com",56],["m.edaily.co.kr",57],["honkailab.com",58],["derstandard.at",59],["derstandard.de",59],["www.chip.de",60],["emturbovid.com",61],["findjav.com",61],["javggvideo.xyz",61],["mmtv01.xyz",61],["stbturbo.xyz",61],["streamsilk.com",[61,62]],["zefoy.com",63],["idoitmyself.xyz",64],["uploadboy.com",[65,66]],["reymit.ir",67],["foodxor.com",69],["drawer-opportunity-i-243.site",70],["adultdeepfakes.com",71],["client.falixnodes.net",[72,73]],["linkshortify.com",74],["nexusmods.com",75],["comidacaseira.me",76],["tvbanywherena.com",77],["haveibeenpwned.com",78],["trainerscity.com",79],["tikmate.app",80],["sonixgvn.net",81],["paste-drop.com",82],["dizipal730.com",83],["filext.com",84],["kiddyearner.com",85],["www.reddit.com",86],["9to5google.com",87],["9to5mac.com",87],["api.dock.agacad.com",88],["ozap.com",89],["jprime.jp",90],["www.youtube.com",91],["web.facebook.com",92],["www.facebook.com",92],["japscan.lol",93],["panel.freemcserver.net",94],["download.megaup.net",95],["poophq.com",96],["veev.to",96],["infinityscans.xyz",97],["infinityscans.net",97],["wiki.yjsnpi.nu",98],["cbsnews.com",99]]);

const entitiesMap = new Map([["hamsterix",10],["xhamster",10],["xhamster1",10],["xhamster10",10],["xhamster11",10],["xhamster12",10],["xhamster13",10],["xhamster14",10],["xhamster15",10],["xhamster16",10],["xhamster17",10],["xhamster18",10],["xhamster19",10],["xhamster20",10],["xhamster2",10],["xhamster3",10],["xhamster4",10],["xhamster42",10],["xhamster5",10],["xhamster7",10],["xhamster8",10],["streamtape",21],["dropgalaxy",39],["aagmaal",44],["empire-anime",68],["empire-stream",68],["empire-streaming",68],["empire-streamz",68]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function replaceNodeText(
    nodeName,
    pattern,
    replacement,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, pattern, replacement, ...extraArgs);
}

function replaceNodeTextFn(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-node-text.fn', ...Array.from(arguments));
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const reIncludes = extraArgs.includes || extraArgs.condition
        ? safe.patternToRegex(extraArgs.includes || extraArgs.condition, 'ms')
        : null;
    const reExcludes = extraArgs.excludes
        ? safe.patternToRegex(extraArgs.excludes, 'ms')
        : null;
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Quitting');
        }
    };
    const textContentFactory = (( ) => {
        const out = { createScript: s => s };
        const { trustedTypes: tt } = self;
        if ( tt instanceof Object ) {
            if ( typeof tt.getPropertyType === 'function' ) {
                if ( tt.getPropertyType('script', 'textContent') === 'TrustedScript' ) {
                    return tt.createPolicy(getRandomToken(), out);
                }
            }
        }
        return out;
    })();
    let sedCount = extraArgs.sedCount || 0;
    const handleNode = node => {
        const before = node.textContent;
        if ( reIncludes ) {
            reIncludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reIncludes, before) === false ) { return true; }
        }
        if ( reExcludes ) {
            reExcludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reExcludes, before) ) { return true; }
        }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        rePattern.lastIndex = 0;
        const after = pattern !== ''
            ? before.replace(rePattern, replacement)
            : replacement;
        node.textContent = node.nodeName === 'SCRIPT'
            ? textContentFactory.createScript(after)
            : after;
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Text before:\n${before.trim()}`);
        }
        safe.uboLog(logPrefix, `Text after:\n${after.trim()}`);
        return sedCount === 0 || (sedCount -= 1) !== 0;
    };
    const handleMutations = mutations => {
        for ( const mutation of mutations ) {
            for ( const node of mutation.addedNodes ) {
                if ( reNodeName.test(node.nodeName) === false ) { continue; }
                if ( handleNode(node) ) { continue; }
                stop(false); return;
            }
        }
    };
    const observer = new MutationObserver(handleMutations);
    observer.observe(document, { childList: true, subtree: true });
    if ( document.documentElement ) {
        const treeWalker = document.createTreeWalker(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let count = 0;
        for (;;) {
            const node = treeWalker.nextNode();
            count += 1;
            if ( node === null ) { break; }
            if ( reNodeName.test(node.nodeName) === false ) { continue; }
            if ( node === document.currentScript ) { continue; }
            if ( handleNode(node) ) { continue; }
            stop(); break;
        }
        safe.uboLog(logPrefix, `${count} nodes present before installing mutation observer`);
    }
    if ( extraArgs.stay ) { return; }
    runAt(( ) => {
        const quitAfter = extraArgs.quitAfter || 0;
        if ( quitAfter !== 0 ) {
            setTimeout(( ) => { stop(); }, quitAfter);
        } else {
            stop();
        }
    }, 'interactive');
}

function getRandomToken() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
}

function safeSelf() {
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String_fromCharCode': String.fromCharCode,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true, expect: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
            }
            catch(ex) {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            if ( bcBuffer === undefined ) {
                return bc.postMessage({ what: 'messageToLogger', type, text });
            }
            bcBuffer.push({ type, text });
        };
        bc.onmessage = ev => {
            const msg = ev.data;
            switch ( msg ) {
            case 'iamready!':
                if ( bcBuffer === undefined ) { break; }
                bcBuffer.forEach(({ type, text }) =>
                    bc.postMessage({ what: 'messageToLogger', type, text })
                );
                bcBuffer = undefined;
                break;
            case 'setScriptletLogLevelToOne':
                safe.logLevel = 1;
                break;
            case 'setScriptletLogLevelToTwo':
                safe.logLevel = 2;
                break;
            }
        };
        bc.postMessage('areyouready?');
    } catch(_) {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

/******************************************************************************/

const hnParts = [];
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
}
catch(ex) { }
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { replaceNodeText(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

uBOL_replaceNodeText();

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
