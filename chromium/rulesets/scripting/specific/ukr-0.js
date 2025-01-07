/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2019-present Raymond Hill

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

/* jshint esversion:11 */

'use strict';

// ruleset: ukr-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = ["script[onload*=\"html-load.com\"]","div:has(> ins.adsbygoogle)","div:has(> div > ins.adsbygoogle)","app-ads-teaser,\napp-block-widget-banner,\napp-shared-top-companies,\napp-shift-widget-banner,\napp-special-link,\napp-widget-banner,\ndiv[data-current-banner-id]","div[class^=\"banner\"]","div.articleHeaderAdv,\ndiv.banner-catfish,\ndiv.idealMedia,\ndiv.post__partners,\ndiv[class*=\"-adv\"],\ndiv[class*=\"__adv\"],\ndiv[class^=\"sidebar-banners\"]","div[class^=\"banner\"]:has(div[id^=\"div-gpt-ad-\"])","div[class^=\"playlist-player-branding\"]","app-custom-adv-label,\napp-default-publications:has(> h5 > a[href*=\"24tv.ua/partnerki_tag\"]),\napp-main-page-adv-block","div.video-dv-wrapper","#block-reklamnyybanner",".sb-projects,\n.sidebar > div[style=\"height: 10px;\"],\ndiv.header-special","div.header-banner","div[class$=\"-banner\"]","div[id^=\"adpartner-\"]","div[id^=\"bn-\"]","#custom_html-5","div.home_bottom > div > div:nth-child(3),\ndiv.partners_block","div[class$=\"banner\"]:has(div[id^=\"div-gpt-ad-\"])","#pwebbox234,\n#sp-breadcrumb,\ndiv.remote_ads","div.live__wallper","div[class*=\"banner\"]","div[class^=\"baner-\"]","#g-fullwidth:has(div.platform-content:nth-of-type(-1n+4)),\n#g-header,\n#pwebbox272,\ndiv[class^=\"adv_\"]","div.header__banner-wrap",".fixedBlock,\na[href^=\"/\"][target=\"_blank\"]","div.header__banner,\ndiv.widget:has(> div > div[id^=\"admixer_\"])",":is(main, div.article-content__widgets) > article.widget:has(ul.widget__header_tags > li > :is(a[href$=\"/promo/\"], a[href$=\"/special/\"])),\ndiv.article-content__widgets > article.widget:has(a.widget__header_author[href=\"/author/advbot/\"]),\ndiv.branding-top,\ndiv[class^=\"adsense-\"]","div#main > .vc_row:nth-of-type(2) > div.wpb_column:not(:has(figure > a[href$=\"facebook.com/71brigade\"])),\ndiv.standard_blog + div + div","div.market-btn--advertising",".advertinline,\n.bnr,\n.newscomp",".ai_widget,\ndiv.code-block:has(> div#ai-block)","aside.c-subs-box.c-subs-social",".sb-partners",".sidebar > .sb-slider1,\n.sidebar > div[style^=\"margin-top:\"]","div.rekBlock","#turnkey-credit","div.ads","div.r-tram_wrap","div.ad",".banner","noindex:has(div > ins.adsbygoogle)","div.bottom-card-wrapper > div.banner,\ndiv.container_banner,\nnoindex:has(> div > div.advert-banner)","body.access div[id^=\"access-au\"],\ndiv[data-ad=\"active\"]","div#top-line,\ndiv.rec","#vedomosti_block:has(div[id^=\"phoenix\"], div[id^=\"adpartner-\"]),\naside.l-main-rightcol > br,\ndiv[data-sender=\"go2net\"],\ndiv[id^=\"admixer_\"]",".right-sidebar div[style^=\"width: 300px; \"],\ndiv.container.d-print-none:has(script[src^=\"//a4.censor.net/js/\"]),\ndiv.row.d-print-none:has(script[src^=\"//a4.censor.net/js/\"])","[class$=\"_banner\"]","div.section_news_adv","div[class*=\"_banner_\"]","div[onload^=\"viewAds\"]","div.side-content-wrapper,\ndiv.top-content-wrapper,\ndiv[class*=\"__fanner\"],\ndiv[class*=\"fanner__\"]","div.banner-promotions-wrapper,\ndiv.widget_media_image:has(figure.wp-block-image > a[href*=\"boosteroid.com/go/\"]),\ndiv.widget_media_image:has(figure.wp-block-image > a[href*=\"ukrline.com.ua/?ref=\"])","div.banner","#atlanta,\ndiv.atlanta,\ndiv.bot_r,\ndiv.tops_r,\ndiv:has(> a[target=\"_blank\"] > img[src*=\"comments.ua/adv_img/\"])","div.page-rkl","#custom_html-8","a:has(> img[class*=\"advert-box\"]),\ndiv.row.top-post-box,\nhr.base-post-divider + a",".rightBanner,\ndiv[id^=\"google_banner\"]",".share-news,\ndiv.content > br:nth-of-type(-1n+2),\ndiv.content > hr:nth-of-type(-1n+2),\nsection[class^=\"banner\"]","a.s-content__subscribe","div[data-banner]","div[data-sender=\"admixer\"]","div.banner_brend,\ndiv.md_banner_zone","div.afterheader-widget,\ndiv.island:has(> div.island__body > div[data-sender=\"admixer\"]),\ndiv.partners-wrapper","div.news-content-ad",".promobar,\ndiv#max-header-adv-id:has(a[href^=\"https://dou.ua/goto/?id=\"]),\ndiv#topinfo,\ndiv.b-adv-events,\ndiv.b-dou-vacancies,\ndiv.b-sponsors,\nli.mini-header:has(a[rel=\"nofollow\"][target=\"_blank\"])","div[class^=\"banner-\"]","div[class^=\"b-r b-r--\"]","div[data-widget-id=\"201\"] > div > a[href$=\"obmin.info?f=informator\"],\ndiv[data-widget-id=\"201\"] > div > div > picture","div.home-main-ad,\ndiv:has(> div[data-banner]),\ndiv[id^=\"adpartner\"],\nli.c-feed__list-item:has(> div > div > div[data-banner])","div.box-banner","#right-specprojects-placeholder,\ndiv.specprojects-widget","div#tops,\ndiv.hideprint,\ndiv[style=\"background:#fff;\"]:has(a.ad),\nnoindex","div.advertisement","div#corpMagnet,\ndiv.content-banner,\ndiv[id=\"admixer_\"]","#js__header-banner,\n.poster-place,\n.widget-poster,\ndiv.page-section ~ section.page-section:nth-of-type(-1n+2)","div.partner-articles,\ndiv.sb__section:has(> div.sb-partners)","div.banner-topline,\ndiv.bot-brand,\ndiv:has(> a[href*=\"Nadavi_banner\"])",".leader-wrap-out","div.ad_300x600,\ndiv.ad_article > hr,\ndiv.ad_top,\ndiv.reklama,\ndiv.tizers","aside:has(> iframe[src$=\"/sinoptik.html\"])","div[class^=\"advtext\"]","div[class*=\"adv_\"]","div[class*=\"banner_\"]","body > a[href$=\"&utm_medium=anons\"][target=\"_blank\"]:has(picture, img),\nbody > a[href$=\"&utm_medium=banner\"][target=\"_blank\"]:has(picture, img),\nbody > a[href$=\"&utm_medium=branding\"][target=\"_blank\"]:has(picture, img),\nbody > a[href^=\"https://cutt.ly/\"][target=\"_blank\"]:has(picture, img),\ndiv.article.article_story_grid:has(> div > div > div > span.article_section_adv),\ndiv.article.article_story_grid:has(> div > div > span.article_section_adv),\ndiv.article_advertising,\ndiv.section_topic.section_topic_adv","div.jeg_ad","[class$=\"-banner\"]","a[href=\"https://www.ukr.net/\"]","div.code-block:has(div[id^=\"admixer-\"]),\ndiv.kompreno","div.right > div:first-of-type","div.hide-mobile:has(div.adaptive-iframe-wrapper[style=\"background: black;\"]),\ndiv[class^=\"promo-layer\"]","div.pip-video-wrapper","div.ads-block-top","#sticky-wrapper:has(div[id^=\"div-gpt-ad-\"]),\n[data-vr-zone=\"block special projects list\"],\ndiv.bottom_banner,\ndiv.minfin-banner,\ndiv[class^=\"Advertising\"],\ndiv[data-vr-zone=\"block featured product list\"],\ndiv[id^=\"banner-zone\"],\ntd.h-adv","[class*=\"advert\"]","div.DonateBanner,\ndiv.feed-layout__item-holder:has(button[data-event-action=\"new_building_ads\"]),\ndiv.feed-layout__item-holder:has(div.bird-select-advertisement)","div.o-block,\ndiv.u-d-h-600:has(div[id*=\"ScriptRoot\"]),\ndiv[data-ad-title]","div[class$=\"-ad\"]",".banner ~ .separator","div[id^=\"zone_\"]","[class*=\"adv_\"],\na[rel*=\"sponsored\"],\naside + p:has(> img),\naside.adv-insert + div.media_embed,\naside.adv-insert + p:empty + div.responsive-embed,\naside.adv-insert + p:has(img),\ndiv.mobileBrandingPlace,\ndiv[id^=\"desktopBranding\"],\ndiv[style=\"min-height: 600px;\"]:has(div[id^=\"div-gpt-ad-\"]),\np:has(> a[href^=\"https://tds.favbet.ua/\"][target=\"_blank\"]),\np:has(> a[rel*=\"sponsored\"][target=\"_blank\"] > strong),\np:has(> strong > a[rel*=\"sponsored\"][target=\"_blank\"])","[class*=\"adv-\"]","[id*=\"AdvWrapper\"]","div[class^=\"ads-container\"]","div.c-post-additional:has(> div > div > div.c-magazine),\ndiv.c-post-subscribe,\ndiv.l-container.u-mb:has(> div.c-magazine)","div.boxWidgetBanner",".ads,\ndiv.col-sm-6.col-md-12 > div.l-container:has(> div > div > div > div[id^=\"gagadget_sidebar_premium\"]),\ndiv.l-container:has(> div > div > div[data-gpt-index]),\ndiv.l-container:has(> div > div.friends-holder),\ndiv.toplink-container,\ndiv[class^=\"row-ban-\"],\nli.js-r-menu-item_friends","[id^=\"bannplace\"],\n[id^=\"candyplace\"],\nspan.i728","div.widget:has(> section.baner-widget)","div.widget_custom_html:has(> div > div#SinoptikInformer),\ndiv.widget_jnews_module_element_ads",".informer","div.topbar-wrap,\ndiv.widget_custom_html:has(> div > a[target=\"_blank\"])","#left-sidebar > .widget_text,\n.widget_media_image,\ndiv[style=\"text-align: center\"] > [href][target=\"_blank\"]","div.textwidget:has(a[href*=\"myblogshop.top\"][rel=\"nofollow\"]),\ndiv.textwidget:has(script)","[data-action=\"banners\"]","div.bnr-block","div.bnr-block--gray,\ndiv.main-partners","div.partner-news","div:has(> div.card > div > div > a > h4 > span.mark-ad)","aside:has(> aside > i.fa-rectangle-ad)","div[class^=\"advertising\"]","div[data-action=\"banners\"]","div.banner-place","#text-html-widget-2","div[class^=\"adsbygoogle-\"]","a[style=\"z-index: 0; position: fixed; top: 0px; left: 0px; width: 100%; height: 100%;\"],\ndiv.attn_block","div.adv","div.top-banner","div.abox","#section-id-1496826235107,\n#sp-top-banners,\n#sppb-addon-wrapper-1496985206652","[class^=\"partners\"]","div.mobile-hide,\ndiv.mobile-show,\ndiv:has(> img[src*=\"/images/banners/\"]),\ndiv[class^=\"course-widget-\"]","p.intro[style*=\"background: linear-gradient\"]","div.banner-advertising","div.banner-block,\ndiv.banner-block-mb,\ndiv[class^=\"ModalBanner\"]","div.subscription-under-article","#Premium,\n.baner,\n.clear.logo_container,\n.news_premium_item,\n.partner_links","section.widget:has(img[src$=\"banner_300x300.jpg\"])",".top-banner-airdrops,\ndiv[class^=\"top-banner-\"],\nsection.widget_text:has(> div > div.incrypted-banner)","#brandlink,\n#premban,\n#vipbottombanner",".advert,\n.dw_focus_widget_news_ticker","div:has(> script[src*=\"/js/frontend/ad-loaders/\"])","div.clear_40:empty","div.article-widget-section:has(div.MIXADVERT_NET),\ndiv.banner2,\ndiv.left-ban,\ndiv.top-ban,\ndiv[id^=\"adex-jsunit-\"]",".rowBan,\na.stickybl","[data-course],\na:has(> img.vote-image),\ndiv.about-noa:has(> a[href$=\"/vidklyuchyty-reklamu/\"]),\ndiv.featured-in-new > div.row,\ndiv.featured-statti:has(a.oglyadi-partneriv),\ndiv.hidden-sm:has(div[id*=\"-banner-\"]),\ndiv.hidden-sm:has(img[src*=\"/images/banners/\"]),\ndiv.jobs-vacancy,\ndiv.popup-bottom:has(script),\ndiv.post-txt > p.intro:has(> a[href$=\"-kryptobum-2025/\"]),\ndiv.post-txt > p.intro:has(> a[href$=\"/?r=zcA3y4iWZOb\"]),\ndiv.post-txt > p:has(> a > img[src*=\"/images/banners/\"]),\ndiv.post.block-in-loop.category-partnerskij-proekt,\ndiv.sponsor,\ndiv.visible-sm:has(div[id*=\"-banner-\"]),\ndiv.widget-spec-projects,\ndiv[class*=\"widget-partners-blogs\"],\ndiv[class^=\"hidden-sm\"],\ndiv[class^=\"visible-sm\"],\nli.widget-container:has(.jobs-vacancy),\nli.widget-container:has(.partner-blog),\nli.widget-sticky:has(div[id^=\"div-gpt-ad-\"]),\nli[class*=\"widget_execphp\"],\nli[id^=\"partner-posts\"],\np.intro:has(a[href*=\"?utm_source=itc.ua&utm_medium=branding\"])","div.xjo:has(> div[data-type=\"custom_code\"])",".adwrapper","[class*=\"banner\"]","div.mc-banner-placeholder,\ndiv.mc-top-banner","a > img[src^=\"/sites/default/files/inline/\"],\nimg[src^=\"/sites/default/files/inline/\"]","#partners,\ndiv:has(> a > img[src^=\"/uimgs/banners/\"])","a.link-main-image-wrap.fixed,\ndiv[class^=\"adpartner-\"],\ndiv[class^=\"promo\"]","#KFheader-adtop,\na:has(> img.brandtopimg),\naside:has(> div#banner),\naside:has(> ins.adsbygoogle),\niframe[title=\"FPV\"]","a[href$=\"oki.com/ua/printing\"],\nbody > a[target=\"_blank\"][style*=\"height: 100%\"],\ndiv.content > p:has(> strong > a[style=\"color: #d00;\"]),\ndiv.gbg > center:has(> a[target=\"_blank\"] > img[src^=\"/files/region_banners/\"]),\ndiv.pad + p,\ndiv.pad:has(> ul.sponsors),\ntable.container > tbody > tr > td.left-column,\ntable.container > tbody > tr > td.right-column,\ntd.layout_right_column > p:has(> a[target=\"_blank\"] > img)","div.row:has(> div > div + script),\ndiv.row:has(> div > div.premium-banner),\ndiv.row:has(> div > iframe),\ndiv.row:has(> div > script)","div[class^=\"bookmaker\"]",".article:has(em.advertising),\n.unit-side-informer","div.slide-in-wg,\ndiv.wsw__embed:has(div.promo)","div.decor-banner:has(a[href*=\"ktc.ua/edilo__\"])","#catfishWrap,\ndiv:not(div#bottomWrap).advertising","div[class$=\"-adv-item\"],\ndiv[id*=\"banner-\"],\nsection.google-news","div.grafiati-link","div.bottomPopupBanner,\niframe[data-engage-slug^=\"popupjoinus\"]","div.col-xl-2.d-xl-block:has(> a > img[alt=\"Kador Group\"]),\ndiv[class^=\"ad-wrapper\"]","[class^=\"adv-banner\"],\ndiv.cookie-info,\ndiv.layout-anons",".partners-section,\ndiv.magazine-banner","#addBlockModal,\na.social-widget,\na[class^=\"top-banner\"],\narticle.is-partners,\ndiv.article-footer__widget.b-blocks,\ndiv.article-footer__widget.b-subs,\ndiv.section-default__col--right-sidebar:has(> div > div.ad)","div.banner_placeholder,\ndiv.item_withrekl,\ndiv.promoblock,\ndiv.rekl_block,\ndiv.texts,\nsection.actualsinglepage_promo_product,\nsection.jurist_firm_sidebar_block,\nsection.promo_block_placeholder","div.sidebar-inner > div:nth-child(-1n+3):nth-child(1n+2),\ndiv.sidebar-inner > div:nth-child(1n+5),\ndiv[data-elementor-type=\"wp-post\"]:has(> section > div > div > div > div[data-widget_type=\"foxiz-ad-script.default\"]),\ndiv[data-widget_type^=\"foxiz-ad-\"],\ndiv[data-widget_type^=\"foxiz-banner\"]","#mobileBrandingPlace,\ndiv.adv-container,\ndiv.partner-recomendation","[data-coursestyle],\narticle[data-io-article-url] > div.text-center-block:has(> div.widget-spec-projects),\ndiv.company-slider,\ndiv.lenta-item:has(> span.cat-label > a[href$=\"/category/spetsproyekti/\"]),\ndiv.mobile-hide:not(.widget-popular, .widget-popular-title),\ndiv.widget-vacancy","#meta_banner_center,\n[class^=\"banner\"],\n[class^=\"bookmaker\"],\ndiv.banner-zone,\ndiv.main__banner-bottom,\ndiv.sidebar__ads,\ndiv.subscriptions","div.placeholder.h1:has(div[id^=\"div-gpt-ad-\"]),\nsection.section-media:has(div[id^=\"div-gpt-ad-\"]),\nsection.section-rss","div[id^=\"mp_banner_\"]",".block-novyny-partneriv,\ndiv:has(> a.banner-link)","#promo-catfish,\ndiv.b-info-block__content > div > div:has(> div > a[href$=\"/ad\"]),\ndiv[class*=\"_banner\"]","#special-product-offer,\ndiv.aside-pull-right-block:has(> div[id^=\"premium-\"]),\ndiv[data-bn-slot],\nsection.special-offers","div.elementor-element:has(> div > p > a[href=\"mailto:redaction@moviegram.com.ua\"]),\nsection.elementor-section:has(> div > div > div > div.elementor-widget-wp-widget-advads_ad_widget)",".promotion_link,\ndiv.sidebar-block.news-companies","#text-4","div.style_poster__MF3pg:has(.style_content__3CPKg)","div.code-block:has(> div > center > a[href*=\"peredplata.ukrposhta.ua/index.php?\"]),\ndiv[class*=\"td-a-rec-id-\"]","aside.widget_text:has(> div.textwidget > p > img.aligncenter),\naside:has(> div > div.reklammma),\ndiv.entry-content > p:empty,\ndiv.entry-content > p:has(> img.size-full.aligncenter),\ndiv.entry-content > p:has(ins.adsbygoogle)","div#sticky-ads,\ndiv.ads-catfish-container,\ndiv.ads-sidebar","div:has(> div#mt_promo_wghot)","div.section-charter_promo",".header-baner","[data-type=\"advertising\"],\ndiv.feed-item:has(> div + a[href*=\"&utm_campaign=promosite\"]),\ndiv.remp-banner",".headerBiding,\n.videoOfDay,\naside.asideBanner.--left,\naside.asideBanner.--right,\naside.headerBiding:has(div[class*=\"_970\"]),\ndiv.recommendation,\ndiv[id^=\"carouselLast-slide\"]:has(article.newsImg > div.banner),\ndiv[id^=\"carouselmostViewed-slide\"]:has(article.newsImg > div.banner)","div.classified-top-banner,\ndiv.list-header-banner,\ndiv.other-classifieds-banner","div.code-block,\ndiv[class*=\"adrotate\"]","div.mt20,\ndiv:has(> div.bl-item > script)","aside#odb-open-in-app","div:has(> div.ad56)","div.page-wrapper.hide-mob:has(div.container.page-container),\ndiv.press-reliz,\ndiv[id^=\"banner-\"]","div.article__advertising,\ndiv.banners-groups,\ndiv:has(> div.blosk-advertising-google),\ndiv[class^=\"baners-\"]","div[class^=\"ad_slot\"]","div:has(> a[href$=\"&utm_campaign=parta\"][target=\"_blank\"]),\ndiv[style^=\"border:1px solid \"]:has(img[src^=\"/edu_image/\"])","#sidebar_banner","#sidebar","div[id^=\"admixer_\"] + script","div.col-lg-4.col-md-6:has(> div.card > div.card-body > a[href$=\"/category/blogy/offers\"]),\ndiv.col-lg-4:has(> div > div > ins.adsbygoogle)","a[class*=\"banner-\"],\nimg[class*=\"banner-\"]","div[class*=\"-advert\"],\ndiv[class*=\"a_dvert\"],\ndiv[class*=\"google-ad\"]","div:has(> a[href^=\"/click/br/\"])","div.ai-placement","div[id^=\"wonderpluginslider-container-\"]",".unit_sp_place,\narticle.article_pr,\ndiv.article.article_story_grid:has(> div > div.article_content > span.article_label_adv),\ndiv.article.article_view_sm:has(> div > div > div > span.article_label_adv),\ndiv.container_special,\ndiv.promoted_article,\ndiv.section_articles:has(> div > div > h3 > a[href$=\"/projects/\"]),\ndiv.ym-video--wrapper","div.views-code:has(> div[id^=\"newsAd\"])","div[style=\"height:550px; weight:auto;\"]:empty","div.ads-widget-block","section.widget_block:has(ins.adsbygoogle)","div[style*=\"cloud-cgi/static/catalog-ui/js/build/portal-portable/maskWeb-5Wgei.png\"]","div.modal_cont:has(> div.streag_close_btn_cont),\ndiv[class^=\"baner_\"]","div[class*=\"-banner\"],\nsection.psm-header-baner-container,\nsection[class*=\"-banner\"]","div#ads","div[class^=\"advertising_slider\"]","div.body-typical__slider",".vidverto-wrapper,\n[id^=\"admixer-\"],\n[id^=\"bn_\"]","div.advertising","div.r22207","a.a_d_v,\naside.content__aside.content-1__aside:not(:has(div.list-wrapper))","main > div.container > div.info","a.info[target=\"_blank\"],\naside > a[target=\"_blank\"],\naside > p:empty,\ndiv.header-info,\ndiv.r23243","div.backstretch,\ndiv.tdc-row:has(div[class*=\"rn-desktop-top-banner\"]),\ndiv.tdc-row:has(div[class*=\"rn-mobile-branding\"]),\ndiv.vc_row_inner:has(center > ins.adsbygoogle)","div.single-page__banners,\ndiv.single-page__social,\ndiv[class*=\"advertisment\"],\ndiv[style=\"padding: 0 0 30px\"]","a.branding__link","div.informerTop","div[class^=\"specific-content_\"]","section[class^=\"section-ad\"]","div.branding-main,\ndiv.compare-banner","div.adv-block_catfish","div[x-lazyload*=\"adsbygoogle\"]","div.max-w-material-l:has(h3.socials__title)","div.sadse,\ndiv.widgetBestBookmakers","div#footer__text,\ndiv.best_bookies,\ndiv.news-promo-feed,\ndiv.wrap > center:has(div[id^=\"zone_\"])","app-adv-between-news,\napp-default-news:has(app-adv-news-label),\np:has(> a[href^=\"https://www.favbet.ua/\"][target=\"_blank\"])","div.fb_iframe_widget","[data-partner]","#sidebar > div:nth-child(1n+2),\ndiv[class^=\"ads-\"]","sq-ad-banners","aside.banner,\naside.videoOfDay,\ndiv.idealmedia","div.share,\ndiv.widget:not([class$=\"hidden-xs\"])","div.banner_wrapper","div.b-sidebar-adv","#aside-poster > div.sb-element.media[style^=\"padding:0\"]","div.adunit,\ndiv.col:has(> aside > div.tabletki-adunit),\ndiv.col:has(> div.card > aside > div.tabletki-adunit),\ndiv.filter-advert,\ndiv.row:has(> aside > div.tabletki-adunit)",".alko,\n.background-video[data-video-urls*=\"legend-transcode\"],\n.koz-box,\n.kr-loo-box,\ndiv.layout_split_sidebar:has(.article_pr + .article_pr + .article_pr + .article_pr + .article_pr + .article_pr)","[data-text=\"Реклама\"],\ndiv.c-r:has([data-text=\"Реклама\"]),\ndiv.s-content__ratio:has(script[id^=\"_vidverto-\"]),\ndiv[data-text=\"Новини партнерів\"]","#pp,\n#pp-bg,\ndiv.block.bmod:has(a.blockonelink > img[alt^=\"Реєстрація в Casino\"]),\ndiv.rek760,\ndiv.rekinfoblock1top,\ndiv.rekinfoblock2top,\ndiv:has(> div.rek),\ndiv:has(> div.reklamatop)",".ad-banner-aside","div.news-list__item:has(div[class*=\"news-tag company_news\"]),\ndiv.news-list__item:has(div[class*=\"news-tag partner_material\"])","div.partner-news + div,\ndiv.partner-news + div + div","#sidebar > div.side-widget:has(> a > img[src^=\"/advertise/\"]),\n#sidebar > div.twitter,\n#stream + div.side-widget","div.card__content > div:has(div[class*=\"Alternative_banner__\"]),\ndiv.card__postscript-banners,\ndiv[class*=\"_ads_\"],\ndiv[class*=\"_ideal-media\"],\ndiv[class^=\"CommonLayout_common-layout__right-column_\"]:has(div[class*=\"Alternative_banner__\"]),\ndiv[class^=\"Home_home-page__right-column_\"] > div:nth-of-type(-1n+3),\ndiv[class^=\"Main_main-layout__empty-block_\"]:has(> div[class*=\"_banner_\"]),\ndiv[data-test=\"bookie-widget\"]","div.categories__category:has(.okadvertisement),\ndiv.okadv__block,\ndiv.okadvertisement,\ndiv.twitter",".c-aside__port,\naside.u-divider--t:has(iframe[src*=\"/banners/partner-news\"]),\ndiv.l-row.l-flex > div.l-col.l-col--sm.l-gap:has(aside.c-aside__port),\ndiv.l-row.l-flex.u-fx--nowrap > div.l-gap.l-col.l-col--sm:has(aside.c-aside__port),\ndiv[class*=\"-sidebar__gap\"]:has(iframe[src=\"https://tsn.ua/banners/sidebar\"])","div.page__big-banner","div.ukrnetlinks,\ndiv[id^=\"bannplace_\"]:has(script)","#jarvis-banner","a.new-baner,\ndiv.gr",".asside:has(div.topBook),\ndiv.adl_cmp_consent-dialog-module_backdrop,\ndiv.bonuses,\nli.dropdown.header-bonus,\nli.gray-block.promo-btn__item","div:has(> div > b > a[href=\"/paket-vip\"])","div.elementor-widget-container:has(> figure > a[href*=\"myblogshop.top\"])","aside[class^=\"promo\"]","div.container.header-container > div > div:nth-of-type(2),\ndiv.widget_block:has(> script[src*=\"jsc.idealmedia.io/\"])","div.int","div.sidebar__item:has(div.adv__exam)","div[data-elementor-post-type=\"elementor_library\"]",".fixed-block > div[class] ~ div,\ndiv.advertisement-block,\ndiv.placeholder",".mailing-block,\nnoindex:has(.ad),\nnoindex:has(.advertising)","section.widget:has(script[src*=\"//jsc.mgid.com\"])",".saduf:has(iframe)","section.best_game_sec","[id*=\"banner\"],\ndiv[data-name=\"int_scroll\"],\ndiv[id*=\"adex-branding-\"]","div.supertext2","div.adsgoogle,\ndiv.sample-posts",".newsfeed__banner,\n.partner-news","a.support-unian,\ndiv.newsfeed-box.banner,\ndiv:has(> div[data-ad] + ins),\ndiv:not([class]):has(> span.newsfeed__ad)","div[class^=\"informer_informer_\"],\ndiv[id^=\"ads-sidebar\"]","section:has(> p > ins.adsbygoogle)","p:has(> script[src*=\"//jsc.idealmedia.io\"]),\np:has(> script[src*=\"//jsc.mgid.com\"])","div.donate-item_articles,\ndiv.pum-overlay","#article-content > header > h1 + div,\ndiv.content-editor > ins:has(> div[data-name=\"post-in-text\"]),\ndiv.ova-comments + div,\ndiv.tags + div",".banner-container","div.page-promo","#brxe-hzqccr,\n#brxe-tdxgce,\n#brxe-uxwofz,\n#brxe-zckfha > div + a,\ndiv.fb-sidebar__main > a:has(> img),\nnav[aria-label=\"Post navigation\"] + a:has(> img)","div.middle_banner","div.col-lg-4:has(> div > div > div > div > span.mark-ad),\ndiv.col-lg-4:has(> div[data-action=\"banners\"]),\ndiv.reclama,\nsection.ad-up","script[src*=\"mediabrama.com/shop/\"] + div","div[class^=\"promo-\"]",".post-additions","div.advertising-card","div.widget_media_image","div.main-content > div.section-3:has(> div > a[href$=\"/special\"]),\ndiv.sb-tabs,\nsection.article-partners","div.box__bnr,\ndiv.timer_block","a.bg-banner,\ndiv.gpt-main","#custom_html-2,\naside#sidebar > div > div[id^=\"media_image-\"],\ndiv.main-box.vce-related-box:has(> div > div.MIXADVERT_NET),\ndiv.main-box.vce-related-box:has(> script[src*=\"goods.redtram.com\"])",".view_back_margin,\ndiv[data-view-id],\nspan.view_back","a.vseosago,\ndiv.center_container","div.wpb_single_image:has(> figure > div > img.vc_single_image-img)","#react-video-player,\ndiv.hidden-print:has(> a[onclick=\"openReactVideoPlayer()\"]),\niframe + div.h-exception,\niframe[src*=\"/b.php?bid=\"]","div:has(> a[href*=\"peredplata.ukrposhta.ua\"]),\ndiv[class*=\"uk-visible@m\"]:has(> img[aria-hidden=\"true\"])","div.detail-news__text-holder > hr,\ndiv.page-section__element:has(> div[class^=\"bookmaker\"]),\ndiv.page-section__element:not(:has(div)),\np:has(> a[href^=\"https://ggbet.ua/\"]),\np:has(> b + a[href^=\"https://ggbet.ua/\"]),\np:has(> b + a[href^=\"https://ggbet.ua/\"]) + b","aside.widget-area","app-adv-placeholder",".banner-more,\n.banner-new-seo,\n.banner-register,\n.banner-yc","#weather,\ndiv:has(> a > img[src^=\"/_adv/\"]:not(img[src=\"/_adv/20220308233032.jpg\"])),\ndiv:has(> img[src^=\"/_adv/\"])","div.mh-home-sidebar > div.widget_block:has(> figure > a),\ndiv.mh-home-sidebar > div.widget_block:has(> figure > figure > a),\ndiv.widget_block:has(> h4 + div#SinoptikInformer)",".news-list-col > .news-list,\n.rek,\ndiv#header_advt-wrapper,\ndiv.archive_page > div.video-wrapper,\ndiv[id^=\"slot300x\"],\ndiv[id^=\"slotPromoinformer\"]","div.sidebar-home-link:has(img[alt=\"Найкращі онлайн казино України\"])","div.textwidget:has(> a[href*=\"myblogshop.top\"]),\ndiv[data-elementor-type=\"section\"]:has(div.elementor-widget-container > a[href*=\"myblogshop.top\"])","a[href=\"https://www.work.ua/\"],\ndiv.footer-partners,\ndiv.partner-news-content,\ndiv.sponsors-holder,\ndiv[style=\"height:15px;\"] + div.unit-rubric__head","aside.content__news > div.news-support,\naside.content__news > div.news-support + div.content-title,\naside.content__news > div.social-box,\naside.content__news > div.social-box + div.content-title,\naside.content__news > div.youtube-news,\ndiv.after-material-wrap-banners,\ndiv.content-news__item.blue_stream:has(.tg_ico_fixed),\ndiv.recent-events:has(img[data-src$=\"telegram_.svg\"]),\ndiv[class^=\"banner_\"],\nsection.archive-main",".c-press-release,\ndiv.b-popular-article,\ndiv.subscribe-in-article","a#bg-commercial",".advads-ad-counters,\n.advads-widget","div#SinoptikInformer","div.elementor-element:has(> div > div#SinoptikInformer)","div.weather","#custom_html-16","aside.widget_text:has(> div > div#SinoptikInformer)","center:has(script[src^=\"https://pogodnik.com/uk/content/js/\"])"];

const hostnamesMap = new Map([["eurointegration.com.ua",[0,47,82,87,88]],["pravda.com.ua",[0,47,82,83,84,87,209]],["1kr.ua",1],["animal.in.ua",1],["bibliotech.com.ua",1],["blogchain.com.ua",1],["daytoday.ua",1],["defence-ua.com",[1,4,59]],["dev.ua",[1,64]],["druzy.com.ua",1],["dynamo.kiev.ua",[1,75]],["esc.lviv.ua",[1,86]],["gsminfo.com.ua",[1,2,124]],["gurman.co.ua",1],["itsider.com.ua",[1,147]],["learn-english.net.ua",1],["meteo.ua",1],["meteopost.com",1],["mezha.net",1],["mind.ua",[1,177]],["mobanking.com.ua",1],["monobankinfo.com.ua",1],["moyaosvita.com.ua",1],["museumkiev.org",1],["mykniga.com.ua",1],["napensii.ua",[1,183]],["one.ua",1],["osvita.ua",[1,197]],["pingvin.pro",[1,203]],["pogliad.ua",1],["predmety.in.ua",[1,211]],["psm7.com",[1,216]],["rayon.in.ua",[1,219]],["sat.net.ua",1],["sharkus.top",1],["slovoidilo.ua",[1,232]],["sportnews.com.ua",[1,241]],["synonimy.info",1],["teg.com.ua",1],["tribun.com.ua",1],["tsikavi-fakty.com.ua",1],["uagolos.com",[1,267]],["uahistory.co",1],["uman24.org.ua",[1,2,278]],["wz.lviv.ua",[1,304]],["yak-zrobyty.in.ua",[1,306]],["forex.ua",2],["marketer.ua",2],["032.ua",[3,4]],["048.ua",[3,4]],["056.ua",[3,4]],["057.ua",[3,4]],["champion.com.ua",[4,47,48,49]],["chytomo.com",4],["football.ua",[4,87,99,100]],["glavcom.ua",[4,115]],["ivona.ua",[4,100]],["konkurent.ua",[4,157]],["portal.lviv.ua",[4,208]],["ukurier.gov.ua",4],["unian.ua",[4,116,279,280]],["village.com.ua",[4,293]],["zn.ua",[4,115,121,315]],["1plus1.ua",[5,6]],["5.ua",[6,18]],["1plus1.video",7],["24tv.ua",[8,9]],["sport24.ua",[9,102,238]],["2day.kh.ua",10],["4mama.ua",[11,12,13,14,15]],["pisni.ua",12],["apk-inform.com",[13,29]],["beauty.ua",[13,14,15,33,34]],["edyna.media",[13,14,77]],["ukr.net",[13,271]],["viva.ua",[13,14,33,296]],["businessua.com",[14,45]],["forbes.ua",[14,105]],["4studio.com.ua",[16,17,319]],["gazeta-misto.te.ua",[16,86,110,319]],["agro-business.com.ua",[19,20]],["agronomy.com.ua",[20,23]],["agronews.ua",[21,22]],["novosti-n.org",21],["agropolit.com",24],["agroportal.ua",25],["agrotimes.ua",26],["ain.ua",27],["akzent.zp.ua",28],["apostrophe.ua",30],["atn.ua",31],["babel.ua",32],["bessarabia.ua",35],["bigkyiv.com.ua",[36,37]],["interfax.com.ua",[37,39]],["mil.in.ua",37],["bihus.info",38],["blackseanews.net",[39,319]],["liga.net",[39,53,168]],["radiotrek.rv.ua",[39,217]],["blitz.if.ua",[40,319]],["youcontrol.com.ua",[40,308]],["board.if.ua",41],["bon.ua",42],["buhgalter.com.ua",[43,44]],["buhgalter911.com",43],["censor.net",46],["epravda.com.ua",[47,82,83,84,85]],["istpravda.com.ua",[47,87]],["tribuna.com",[49,256]],["charivne.info",50],["chasdiy.org",51],["cloudgaminghub.net.ua",52],["cntime.cn.ua",53],["dengi.ua",53],["dialog.ua",[53,65]],["internetua.com",[53,144,319]],["vgoru.org",[53,291]],["zi.ua",[53,314]],["comments.ua",54],["crimezone.in.ua",55],["cripo.com.ua",[56,319]],["cvnews.cv.ua",[57,319]],["lvnews.org.ua",[57,319]],["uanews.org.ua",[57,319]],["dailylviv.com",58],["delo.ua",[60,61,62]],["dsnews.ua",[61,70]],["kinofilms.ua",[62,154]],["vogue.ua",[62,297]],["detector.media",63],["dou.ua",[66,67]],["ostro.org",[67,196]],["dovidka.biz.ua",68],["dp.informator.ua",69],["dtkt.ua",71],["dumka.media",72],["dumskaya.net",73],["dw.com",74],["expres.online",[74,319]],["dyvys.info",76],["ek.ua",78],["elitexpert.ua",79],["elle.ua",80],["epochtimes.com.ua",81],["fakty.ua",[84,319]],["inshe.tv",86],["proslav.info",86],["hromadske.radio",[87,135]],["korrespondent.net",[87,158]],["euromaidanpress.com",89],["exo.in.ua",90],["fakty.com.ua",[91,92]],["vikna.tv",[92,292]],["fco.com.ua",93],["finance.ua",94],["firtka.if.ua",95],["flatfy.ua",96],["lun.ua",96],["focus.ua",97],["football-ukraine.com",[98,319]],["football24.ua",[100,101,102,103]],["zaxid.net",[102,103,311,319]],["footballhub.ua",104],["founder.ua",106],["gagadget.com",107],["galinfo.com.ua",[108,319]],["galka.if.ua",109],["gazeta.ua",111],["gazetapo.lviv.ua",112],["gk-press.if.ua",[113,319]],["glamour.kyiv.ua",114],["kp.ua",[115,149]],["glavred.net",[116,117,118]],["ictv.ua",118],["tochka.net",[118,254]],["gloss.ua",119],["goloskarpat.info",120],["gordonua.com",[121,122]],["vgorode.ua",[122,290]],["weukraine.tv",122],["greenforest.com.ua",123],["guide.in.ua",125],["happymonday.ua",[126,127,128]],["varosh.com.ua",127],["v-variant.com.ua",[128,284]],["healthinfo.ua",129],["hi.dn.ua",130],["highload.today",[131,132,133]],["inforesist.org",[131,141]],["itc.ua",[131,133,146]],["sport.ua",[131,237]],["xsport.ua",[131,305]],["hotline.ua",134],["hvylya.net",136],["i.ua",137],["imena.ua",138],["incrypted.com",139],["infocar.ua",140],["informator.ua",142],["inter.ua",143],["it-rating.ua",145],["itvua.tv",[148,149]],["minfin.com.ua",[149,178]],["ukrinform.ua",[149,276]],["kagarlyk.city",150],["kg.ua",151],["kino-butterfly.com.ua",152],["kinoafisha.ua",153],["ko.com.ua",155],["kolobok.ua",156],["tv.ua",156],["krymr.com",159],["ktc.ua",160],["kurs.com.ua",161],["kyiv24.news",[162,319]],["kyivdictionary.com",163],["kyivindependent.com",164],["kyivpost.com",165],["lb.ua",166],["ldaily.ua",167],["ligazakon.net",169],["malimista.in.ua",170],["maximum.fm",171],["mc.today",172],["meta.ua",173],["meteofor.com.ua",174],["meteoprog.com",175],["mezha.media",176],["moviegram.com.ua",179],["mykharkov.info",[180,181,319]],["nezhatin.com.ua",[181,184]],["nachasi.com",182],["novy.tv",185],["novynarnia.com",186],["novyny.live",187],["noworries.news",188],["nv.ua",189],["obozrevatel.com",190],["obyava.ua",191],["odessa-life.od.ua",192],["okino.ua",193],["opendatabot.ua",194],["opentalk.org.ua",195],["overclockers.ua",198],["parta.com.ua",199],["patient-docs.com",200],["pidruchnyk.com.ua",[201,202]],["uapress.kyiv.ua",[201,270]],["players.com.ua",204],["playua.net",205],["pn.com.ua",206],["politeka.net",207],["znaj.ua",[207,316]],["pravdatutnews.com",210],["proidei.com",212],["prolinux.pp.ua",213],["prom.ua",214],["protocol.ua",215],["rau.ua",218],["rbc.ua",[220,319]],["realist.online",221],["risu.ua",222],["rivne.media",223],["rivne1.tv",224],["rivnepost.rv.ua",[225,319]],["root-nation.com",226],["rubryka.com",227],["rud.ua",228],["sinoptik.ua",229],["slk.kh.ua",230],["slovnyk.ua",231],["smachno.ua",233],["socportal.info",234],["speka.media",235],["sport-express.ua",236],["sportanalytic.com",239],["sportarena.com",240],["sq.com.ua",[242,319]],["stopcor.org",243],["storinka.com.ua",244],["subota.online",245],["sud.ua",246],["sumypost.com",247],["tabletki.ua",248],["tabloid.pravda.com.ua",249],["telegraf.com.ua",250],["ternopoliany.te.ua",251],["texty.org.ua",252],["thepage.ua",253],["transkarpatia.net",255],["trueua.info",257],["tsn.ua",258],["ttt.ua",259],["tvoemisto.tv",[260,319]],["tydyvy.com",261],["tyzhden.ua",262],["ua-football.com",263],["ua-region.com.ua",264],["ua-vestnik.com",265],["ua.news",266],["uanews.kharkiv.ua",268],["uapetrol.com",269],["ukranews.com",272],["ukrdz.in.ua",273],["ukrfootball.ua",[274,275]],["zbirna.com",[275,312]],["ukrlib.com.ua",277],["unian.info",279],["unian.net",279],["unn.ua",281],["urok.in.ua",282],["uspih.in.ua",283],["varta1.com.ua",285],["vctr.media",286],["vechirniy.kyiv.ua",287],["versii.if.ua",288],["vezha.ua",289],["vinnitsa.info",294],["visnyk-irpin.com.ua",295],["volyn.com.ua",298],["volyninfa.com.ua",[299,319]],["volynnews.com",300],["vseazs.com",301],["vynnyky-visnyk.com.ua",302],["work.ua",303],["yesport.com.ua",307],["zakarpattya.net.ua",309],["zakarpattya24.com",[310,319]],["zhenskiy.kyiv.ua",313],["znoclub.com",317],["zz.te.ua",318],["kharkiv.ua",319],["kontrakty.ua",319],["magnolia-tv.com",319],["newformat.info",319],["region.dp.ua",[319,322]],["sfera-tv.com.ua",319],["times.zt.ua",319],["zib.com.ua",319],["brovary.net.ua",320],["gorod.dp.ua",321],["zora-irpin.info",323],["real-vin.com",324]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
