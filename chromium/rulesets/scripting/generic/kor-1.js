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

// kor-1

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 10 */[[4701,".ad_wrapper"],[40898,"._popIn_recommend_article_ad"],[11467,"#admaru"],[20825,".revenue_unit_item.tenping,\n.revenue_unit_item.dable,\n.revenue_unit_item.adfit"],[168,"ins.viewus-ad"],[13297,"#livereAdWrapper"],[55498,"ins.fastview-ad"],[39000,"ins.adsbyadop"],[31619,"ins.adsbygoogle[data-ad-slot]"],[62657,"ins.kakao_ad_area"]]);
const highlyGeneric = /* 73 */"iframe[src*=\"//ad.imp.joins.com/\"],\namp-ad,\niframe[src*=\"//authanalysis.com/\"],\namp-embed,\niframe[src*=\"//ad.ad4989.co.kr/\"],\niframe[src*=\"//adad.z00.kr/\"],\niframe[src*=\"//burgeon.co.kr/mad/\"],\niframe[src*=\"//js.newsmobile.co.kr/\"],\niframe[src*=\"//api.linkmine.co.kr/\"],\niframe[src*=\"://ad.ad4989.co.kr/\"],\niframe[src*=\"//ad.planbplus.co.kr/\"],\niframe[src*=\"//displayad.zum.com/\"],\nins[data-aiinad-inv],\niframe[src*=\"//ads.mtgroup.kr/\"],\niframe[src*=\"//adv.imadrep.co.kr/\"],\niframe[src*=\"//io.smartmyd.com/\"],\ntenping[tenping-ad-display-type],\niframe[src*=\"//stt.pltapad.com/\"],\niframe[src*=\"//mediaindex.co.kr/DABanner.php\"],\nins[class^=\"MediaIndex_AD_\"],\niframe[src*=\"//www.mobwithad.com/\"],\niframe[src*=\"//ad.3dpop.kr/\"],\ndiv[id^=\"div-gpt-\"],\niframe[src*=\".clickmon.co.kr/\"],\na[href*=\"//ad.planbplus.co.kr/\"],\niframe[src*=\"//api.ezadsystem.com/\"],\niframe[src*=\"//ad.a-ads.com/\"],\niframe[src*=\"//www.mediabp.kr/\"],\niframe[src*=\"//shoppingbox.zum.com/\"],\niframe[src*=\"//ads.mobitree.co.kr/\"],\niframe[src*=\"//www.bodnara.co.kr/advert/advert.php\"],\ndiv[class^=\"__staxbn\"],\nimg[src*=\"//static.stax.kr/resource/banner/\"],\niframe[src*=\"//ad.phaserep.com/\"],\niframe[src*=\"/ad.bidrich.com/\"],\na[href*=\"//adv.imadrep.co.kr/\"],\niframe[src*=\"//www.kodcad.kr/\"],\niframe[src*=\"//ai.onepx.kr/\"],\na[href*=\"//ad-api.enuri.info/\"],\nimg[src*=\"//ad-api.enuri.info/\"],\n[id^=\"div-gpt-ad\"],\niframe[src*=\"//adsrv-up.mcrony.com/\"],\na[href*=\"//click.soonwe.com/\"],\niframe[src*=\"//coupa.ng/\"],\nimg[src^=\"/bannerpop/\"],\niframe[src*=\"//ads.priel.co.kr/\"],\nimg[src*=\"//ads.priel.co.kr/\"],\niframe[src*=\"//img.mrep.kr/\"],\niframe[src*=\"//ad.aceplanet.co.kr/\"],\niframe[src*=\"//ad.ajitad.co.kr/\"],\niframe[src*=\"//vod.shoppingcall.me/ad_shoppingCallme.php\"],\niframe[src*=\"//deepdive.zum.com/widget/\"],\niframe[src*=\"//minishop.linkprice.com/\"],\niframe[src*=\"//ad.linkprice.com/\"],\niframe[src*=\"//kitweb.tadapi.info/\"],\niframe[src^=\"https://was.livere.me/ad\"],\niframe[src*=\"//io1.innorame.com/\"],\niframe[src*=\"//cdn.interworksmedia.co.kr/\"],\niframe[src*=\"//adex.ednplus.com/\"],\niframe[src*=\"//adv.imadrep.co.kr/\"],\niframe[src*=\"https://media.adpnut.com/\"],\niframe[src*=\"veta.naver.com/fxshow?\"],\niframe[src*=\"//ad.adinc.kr/\"],\niframe[src^=\"https://api.dable.io/\"],\niframe[src*=\"//ad.reople.co.kr/\"],\niframe[src*=\".contentsfeed.com/RealMedia/ads/\"],\niframe[src*=\"//ads.mncmedia.co.kr/\"],\niframe[src^=\"https://realdsp.realclick.co.kr\"],\niframe[src^=\"https://googleads.g.doubleclick.net/\"],\niframe[src^=\"https://ads-partners.coupang.com/\"],\niframe[src*=\"//www.mediacategory.com/servlet/\"],\ndiv[id^=\"targetpushAd_\"],\niframe[src*=\"clickon.kr\"]";
const exceptions = /* 44 */["ins.adsbygoogle[data-ad-slot]",".googleAd","#gallery-advert","ins.adsbygoogle[data-ad-slot]",".ads\n#google_ads","ins.adsbygoogle[data-ad-slot]",".ad-btn",".ad_banner",".top-banners","#AdHeader\n#AD_Top\n#homead\n#ad-lead",".download_ad",".ads\n#google_ads","iframe[width=\"100%\"][height=\"120\"]",".ads\n#google_ads","iframe[width=\"100%\"][height=\"120\"]","iframe[width=\"100%\"][height=\"120\"]","#AdHeader\n#AD_Top\n#homead\n#ad-lead\n#rightAd","iframe[width=\"100%\"][height=\"90\"]",".googleAd\nins.adsbygoogle[data-ad-slot]\n.ad-body\n#googleAd","[data-ez-name]","iframe[width=\"100%\"][height=\"120\"]",".sponsor-btns\n#sponsorTab","#adContainer\nins.kakao_ad_area\n#adBlockPixelTag\n.banner_ad","img[src^=\"/bannerpop/\"]","ins.adsbygoogle[data-ad-slot]",".adinfo","ins.adsbygoogle[data-ad-slot]","ins.adsbygoogle[data-ad-slot]",".ad-unit:not(.textads)\n.ad-zone:not(.textads)","ins.adsbygoogle[data-ad-slot]",".left_bnr","#adContainer\nins.kakao_ad_area\n#adBlockPixelTag\n.banner_ad",".ad_bottom","ins.adsbygoogle[data-ad-slot]","#adContainer\nins.kakao_ad_area\n#adBlockPixelTag\n.banner_ad","ins.adsbygoogle[data-ad-slot]","[data-ez-name]",".ad_item","ins.adsbygoogle[data-ad-slot]\nins.adsbygoogle[data-ad-slot]",".topAD","ins.adsbygoogle[data-ad-slot]","ins.adsbygoogle[data-ad-slot]",".vertical-ads","ins.adsbygoogle[data-ad-slot]"];
const hostnames = /* 44 */["exey.io","meeco.kr","te31.com","teemo.gg","1412.live","aagag.com","avdbs.com","clien.net","grip.show","tabriz.kr","x86.co.kr","bera.world","iptime.org","sellas.ink","192.168.0.1","192.168.1.1","dicoall.com","kjwwang.com","remiz.co.kr","08dragon.com","ipdisk.co.kr","novelpia.com","tv.kakao.com","besteleven.com","ff14angler.com","mimacstudy.com","paraphraser.io","t.hi098123.com","vod.jtbc.co.kr","xtremestream.co","blackdesertm.com","kakaotv.daum.net","mnews.jtbc.co.kr","sekai-kabuka.com","play-tv.kakao.com","play.aidungeon.io","eoecare.cafe24.com","displayad.naver.com","uda1004.tistory.com","persnacons.tistory.com","tamrieltradecentre.com","downloads.descendant.me","somenotes247.blogspot.com","html5.gamedistribution.com"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
