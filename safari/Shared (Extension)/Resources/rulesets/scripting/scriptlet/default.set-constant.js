/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setConstant = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["abp","false"],["oeo","noopFunc"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["console.clear","trueFunc"],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["initials.yld-pdpopunder",""],["xRds","false"],["tRds","true"],["console.clear","noopFunc"],["String.fromCharCode","noopFunc"],["console.log","noopFunc"],["String.prototype.charCodeAt","trueFunc"],["console.clear","undefined"],["attachEvent","trueFunc"],["hasAdBlocker","false"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["sadbl","false"],["adblockcheck","false"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["is_adblocked","false"],["showPopunder","noopFunc"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["fuckAdBlock","false"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["flashvars.adv_pause_html",""],["adblockSuspected","false"],["disasterpingu","false"],["CnnXt.Event.fire","noopFunc"],["App.views.adsView.adblock","false"],["$.fx.off","true"],["adsClasses","undefined"],["gsecs","0"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["detectAdBlock","noopFunc"],["attr","{}"],["scriptSrc",""],["Object.prototype.adReinsertion","noopFunc"],["Object.prototype.disableAds","true"],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["adBlock","false"],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["isBlocked","false"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["ifmax","true"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["isAdblock","false"],["atob","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["flashvars.popunder_url",""],["_pop","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["isAdsDisplayed","true"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["ad_permission","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["ads_js_was_loaded","true"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["jQuery.adblock","false"],["google_jobrunner","true"],["clientSide.adbDetect","noopFunc"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["checkdom","0"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["counter","0"],["window_focus","true"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["daganKwarta","true"],["dvsize","51"],["isal","true"],["count","0"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["Global.adv","undefined"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["adblockDetector","noopFunc"],["loadingAds","true"],["ads_blocked","0"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["nozNoAdBlock","true"],["decodeURIComponent","trueFunc"],["process","noopFunc"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["testerli","false"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["show_ads_gr8_lite","true"],["doads","true"],["jsUnda","noopFunc"],["abp","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["HTMLElement.prototype.attachShadow","null"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["getHomadConfig","noopFunc"],["adsbygoogle.loaded","true"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["app.addonIsInstalled","trueFunc"],["flashvars.popunder_url","undefined"],["adv","true"],["pqdxwidthqt","false"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["CustomEvent","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["cRAds","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["ai_dummy","true"],["ulp_noadb","true"],["wgAffiliateEnabled","false"],["ads","null"],["checkAdsBlocked","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["AdBlockerDetected","noopFunc"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["timeSec","0"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["importFAB","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["fouty","true"],["detectAdblock","noopFunc"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["Object.prototype.m_nLastTimeAdBlock","undefined"],["config.pauseInspect","false"],["D4zz","noopFunc"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["sems","noopFunc"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["runAdblock","noopFunc"],["$tieE3","true"],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["adblock","0"],["db.onerror","noopFunc"],["p18","undefined"],["asc","1"],["ADBLOCKED","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["adsHeight","11"],["checkCap","0"],["waitTime","0"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["isadb","false"],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["new_config.timedown","0"],["timedisplay","0"],["Object.prototype.isAdDisabled","true"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["ad_link",""],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["Object.prototype.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["adSettings","[]"],["count","1"],["Object.prototype.enableInterstitial","false"],["check","noopFunc"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["tiPopAction","noopFunc"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["document.hasFocus","trueFunc"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["dable","{}"],["aLoad","noopFunc"],["mtCanRunAdsSoItCanStillBeOnTheWeb","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["navigator.brave","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["Overlayer","{}"],["pop3getcookie","undefined"],["pop3setcookie1","undefined"],["pop3setCookie2","undefined"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["ubactive","0"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["Object.prototype.adBlockerDetected","falseFunc"],["Object.prototype.adBlocker","false"],["Object.prototype.tomatoDetected","falseFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adblockEnabled","noopFunc"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["makeMoney","true"],["chp_adblock_browser","noopFunc"],["hadeh_ads","false"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["Object.prototype.isAllAdClose","true"],["navigator.standalone","true"],["showAdss","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["window.showAds","true"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["playerConfigs.rek","{}"],["feedBack.showAffilaePromo","noopFunc"],["checkAdBlocker","noopFunc"],["loadpagecheck","noopFunc"],["hucksterInit","trueFunc"],["isAdBlockerActive","noopFunc"],["BetterJsPop","undefined"],["di.VAST.XHRURLHandler","noopFunc"],["di.app.WebplayerApp.Ads.Supervisor.eligibleForPreroll","trueFunc"],["di.app.WebplayerApp.Ads.Supervisor.eligibleForMidroll","trueFunc"],["admiral","noopFunc"],["$.tstracker","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["ccsrv",""],["lcs_SerName",""],["flashvars.event_reporting",""],["firebase.analytics","noopFunc"],["Visitor","{}"],["akamaiDisableServerIpLookup","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["DD_LOGS","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT","{}"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["eyshy_start","false"]];

const hostnamesMap = new Map([["youtube.com",[0,1,2,3]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["t-online.de",4],["whatfinger.com",5],["timesofindia.indiatimes.com",6],["economictimes.indiatimes.com",7],["userscloud.com",8],["motherless.com",9],["sueddeutsche.de",10],["watson.de",10],["watchanimesub.net",11],["wco.tv",11],["wcoanimesub.tv",11],["wcoforever.net",11],["filehorse.com",11],["guidetnt.com",11],["sp-today.com",11],["linkvertise.com",11],["textbin.net",11],["eropaste.com",11],["pastebr.xyz",11],["getpaste.link",11],["sharetext.me",11],["note.sieuthuthuat.com",11],["elcriticodelatele.com",[11,306]],["gadgets.es",[11,306]],["amateurporn.co",[11,104]],["wiwo.de",12],["masteranime.es",13],["fullxh.com",14],["megaxh.com",14],["unlockxh4.com",14],["xhadult2.com",14],["xhadult3.com",14],["xhadult4.com",14],["xhadult5.com",14],["xhamster46.com",14],["xhday.com",14],["xhday1.com",14],["xhmoon5.com",14],["xhplanet1.com",14],["xhplanet2.com",14],["xhreal2.com",14],["xhreal3.com",14],["xhtab2.com",14],["xhvictory.com",14],["xhwebsite.com",14],["xhwebsite2.com",14],["xhwide1.com",14],["xhwide8.com",14],["alphaporno.com",[17,408]],["porngem.com",17],["uploadbank.com",17],["shortit.pw",[17,107]],["familyporn.tv",17],["cloudemb.com",[17,328]],["sbplay1.com",17],["swatchseries.ru",17],["id45.cyou",17],["85tube.com",[17,90]],["pobre.tv",17],["k1nk.co",17],["watchasians.cc",17],["photopea.com",17],["imsdb.pw",[17,26]],["soltoshindo.com",17],["techtimes.com",18],["dronedj.com",20],["freeplayervideo.com",21],["nazarickol.com",21],["player-cdn.com",21],["voe.sx",21],["housecardsummerbutton.com",21],["bigclatterhomesguideservice.com",21],["uptodatefinishconference.com",21],["uptodatefinishconferenceroom.com",21],["tinycat-voe-fashion.com",21],["motphimtv.com",21],["rabbitstream.net",21],["streamlare.com",21],["projectfreetv.one",21],["nolive.me",22],["cbs.com",23],["paramountplus.com",23],["player.glomex.com",24],["merkur.de",24],["tz.de",24],["hotpornfile.org",26],["chillicams.net",26],["rpdrlatino.live",26],["video.q34r.org",26],["adbull.org",27],["mitly.us",27],["linkrex.net",27],["linx.cc",27],["oke.io",27],["dz4link.com",27],["linclik.com",27],["shrt10.com",27],["loptelink.com",27],["cut-fly.com",27],["linkfinal.com",27],["payskip.org",27],["cutpaid.com",27],["forexmab.com",27],["linkjust.com",27],["linkszia.co",27],["leechpremium.link",27],["icutlink.com",[27,129]],["stfly.me",27],["oncehelp.com",27],["bit-url.com",27],["rgl.vn",27],["reqlinks.net",27],["wu8.in",27],["bitlk.com",27],["qlinks.eu",27],["link.3dmili.com",27],["short-fly.com",27],["foxseotools.com",27],["pngit.live",27],["link.turkdown.com",27],["slink.bid",[27,72]],["earnwithshortlink.com",27],["7r6.com",27],["enrt.eu",27],["oko.sh",27],["shortpaid.com",27],["ckk.ai",27],["fc.lc",27],["fstore.biz",27],["cuts-url.com",27],["eio.io",27],["exe.app",27],["exee.io",27],["exey.io",27],["srek.net",27],["skincarie.com",27],["exeo.app",27],["clk.ink",27],["birdurls.com",27],["coinlyhub.com",[27,214]],["adsafelink.com",27],["aii.sh",27],["shrinkurl.org",27],["adsh.cc",27],["cybertechng.com",[27,223]],["owllink.net",27],["fir3.net",27],["cutdl.xyz",27],["gplinks.co",27],["loan2host.com",27],["tei.ai",27],["tii.ai",27],["iir.ai",27],["shorteet.com",[27,244]],["sekilastekno.com",27],["promo-visits.site",27],["satoshi-win.xyz",[27,253]],["shorterall.com",27],["smoner.com",27],["bitlinks.pw",27],["linkad.in",27],["linkshrnk.com",27],["popimed.com",27],["linksly.co",27],["ur-ly.xyz",27],["shrinkme.in",27],["rodjulian.com",27],["pkr.pw",27],["shrinke.me",27],["imagenesderopaparaperros.com",27],["shortenbuddy.com",27],["gibit.xyz",27],["apksvip.com",27],["cashurl.in",27],["4cash.me",27],["namaidani.com",27],["bitfly.io",27],["teknomuda.com",27],["illink.net",27],["miuiku.com",27],["yourtechnology.online",27],["savelink.site",27],["fxlap.com",27],["earnfasts.com",27],["absolutesmmpanel.com",27],["myhiddentech.com",27],["tawiia.com",27],["droplink.co",27],["recipestutorials.com",27],["ashort1a.xyz",27],["2shrt.com",27],["apkshrt.com",27],["genpassword.top",27],["srts.me",27],["cuturl.in",27],["lyricsbot.pw",27],["short88.com",27],["cashearn.cc",27],["kutmoney.com",27],["kutt.io",27],["sanoybonito.club",27],["samaa-pro.com",27],["miklpro.com",27],["modapk.link",27],["shrinkforearn.in",27],["1shorten.com",27],["ccurl.net",27],["st23q.com",27],["beautyram.info",27],["gonety.com",27],["viraloc.com",27],["clickscoin.com",27],["forex-trnd.com",27],["kiiw.icu",27],["vshort.link",27],["link.ltc24.com",27],["galaxy-link.space",27],["linkpoi.me",27],["usdshort.com",27],["bitcoinly.in",27],["menjelajahi.com",27],["pewgame.com",27],["yxoshort.com",27],["1link.vip",27],["linkcc.pro",27],["haonguyen.top",27],["jameeltips.us",27],["claimfreebits.com",27],["mfk-shorter.com",27],["crazyblog.in",27],["gtlink.co",27],["link.tokenoto.com",27],["cutearn.net",27],["rshrt.com",27],["jp88.xyz",27],["short.palmeratv.com",27],["filezipa.com",27],["arab-chat.club",27],["dz-linkk.com",27],["theblissempire.com",27],["shortlink.prz.pw",27],["zipurls.com",27],["finanzas-vida.com",27],["skiplink.org",27],["techmyhub.com",27],["adurly.cc",27],["pix4link.com",27],["paid4.link",27],["ez4short.com",27],["link.asiaon.top",27],["go.gets4link.com",27],["download.sharenulled.net",27],["enagato.com",27],["linkres.in",27],["webo.one",27],["automotur.club",27],["pandarticles.com",27],["beingtek.com",27],["katflys.com",27],["shorturl.unityassets4free.com",27],["disheye.com",27],["techymedies.com",27],["techysuccess.com",27],["toptap.website",[27,334]],["za.gl",[27,151]],["newsalret.com",27],["download.baominh.tech",27],["bblink.com",27],["abre.click",27],["linkbr.xyz",27],["myad.biz",27],["go.netfile.cc",27],["try2link.com",27],["swzz.xyz",27],["vevioz.com",27],["charexempire.com",27],["clk.asia",27],["rancah.com",27],["egfly.xyz",27],["linka.click",27],["sturls.com",27],["myshrinker.com",27],["upshrink.com",27],["go.adinsurance.xyz",27],["aylink.info",27],["dash-free.com",[27,223]],["rainurl.com",[27,223]],["snowurl.com",[27,223]],["netfile.cc",27],["link.insurance-space.xyz",27],["link.insurglobal.xyz",27],["theconomy.me",27],["rajsayt.xyz",27],["rocklink.in",27],["linkshortify.site",27],["adinsurance.xyz",27],["insurglobal.xyz",27],["techgeek.digital",27],["download3s.net",27],["shortx.net",27],["musicc.xyz",27],["cutx.me",27],["btcwalk.com",27],["cryptoon.xyz",27],["easysky.in",27],["veganab.co",27],["shortawy.com",27],["tlin.me",27],["apprepack.com",27],["post.nites-tv.xyz",27],["sh2rt.com",27],["up-load.one",27],["zuba.link",27],["pandaznetwork.com",27],["du-link.in",27],["linksfy.co",27],["news.speedynews.xyz",27],["adrinolinks.in",27],["golink.xaydungplus.com",27],["bestcash2020.com",27],["cut-y.net",27],["hoxiin.com",27],["technemo.xyz",27],["baicho.xyz",27],["go.linkbnao.com",27],["link-yz.com",27],["paylinnk.com",27],["thizissam.in",27],["ier.ai",27],["bloggertheme.xyz",27],["adslink.pw",27],["enit.in",[27,240]],["oii.io",27],["novelssites.com",27],["links.medipost.org",27],["faucetcrypto.net",27],["short.freeltc.top",27],["trxking.xyz",27],["weadown.com",27],["cookdov.com",27],["xpshort.com",27],["bdnewsx.com",27],["m.bloggingguidance.com",27],["blog.onroid.com",27],["cutty.app",27],["link.codevn.net",27],["upfilesurls.com",27],["shareus.site",27],["link4rev.site",27],["bloginguru.xyz",27],["tii.la",27],["celinks.net",27],["c2g.at",27],["atglinks.com",27],["shortzu.icu",27],["bitcosite.com",27],["cryptosh.pro",27],["sigmalinks.in",27],["link68.net",27],["traffic123.net",27],["gainl.ink",27],["windowslite.net",[27,223]],["coinsl.click",27],["exalink.fun",27],["short2url.xyz",27],["exego.app",27],["panyshort.link",27],["watchmygf.me",[28,53]],["fpo.xxx",[28,55]],["sexemix.com",28],["heavyfetish.com",[28,461]],["you-porn.com",30],["youporngay.com",30],["youpornru.com",30],["9908ww.com",30],["adelaidepawnbroker.com",30],["bztube.com",30],["hotovs.com",30],["insuredhome.org",30],["nudegista.com",30],["pornluck.com",30],["vidd.se",30],["pornhub.com",30],["pornerbros.com",31],["freep.com",31],["porn.com",32],["tune.pk",33],["noticias.gospelmais.com.br",34],["techperiod.com",34],["jacquieetmicheltv.net",[35,36]],["illicoporno.com",35],["lavoixdux.com",35],["tonpornodujour.com",35],["jacquieetmichel.net",35],["swame.com",35],["vosfemmes.com",35],["voyeurfrance.net",35],["viki.com",[37,38]],["sleazyneasy.com",[39,40,41]],["smutr.com",[39,210]],["yourporngod.com",[39,40]],["javbangers.com",[39,294]],["camfox.com",39],["camthots.tv",[39,123]],["shegotass.info",39],["amateur8.com",39],["bigtitslust.com",39],["ebony8.com",39],["freeporn8.com",39],["lesbian8.com",39],["maturetubehere.com",39],["sortporn.com",39],["webcamvau.com",39],["motherporno.com",[39,40,55,125]],["theporngod.com",[39,40]],["pornsocket.com",42],["luxuretv.com",43],["porndig.com",[44,45]],["webcheats.com.br",46],["ceesty.com",[47,48]],["gestyy.com",[47,48]],["corneey.com",48],["destyy.com",48],["festyy.com",48],["sh.st",48],["angrybirdsnest.com",49],["zrozz.com",49],["clix4btc.com",49],["katfile.com",49],["4tests.com",49],["planet-explorers-isos.com",49],["business-standard.com",49],["goltelevision.com",49],["news-und-nachrichten.de",49],["laradiobbs.net",49],["urlaubspartner.net",49],["produktion.de",49],["cinemaxxl.de",49],["bladesalvador.com",49],["tempr.email",49],["cshort.org",49],["friendproject.net",49],["covrhub.com",49],["planetsuzy.org",50],["empflix.com",51],["filespace.com",52],["transparentcalifornia.com",53],["deepbrid.com",54],["submityourflicks.com",55],["3movs.com",55],["cambay.tv",[55,104,123,125]],["bravoerotica.net",[55,125]],["youx.xxx",55],["camclips.tv",[55,210]],["camflow.tv",[55,104,125,174,248]],["camhoes.tv",[55,104,123,125,174,248]],["xmegadrive.com",55],["xxxymovies.com",55],["xxxshake.com",55],["gayck.com",55],["xhand.com",[55,125]],["analdin.com",[55,125]],["webnovel.com",56],["schwaebische.de",57],["mercurynews.com",58],["chicoer.com",58],["dailybreeze.com",58],["dailybulletin.com",58],["dailynews.com",58],["delcotimes.com",58],["eastbaytimes.com",58],["macombdaily.com",58],["ocregister.com",58],["pasadenastarnews.com",58],["pe.com",58],["presstelegram.com",58],["redlandsdailyfacts.com",58],["reviewjournal.com",58],["santacruzsentinel.com",58],["saratogian.com",58],["sentinelandenterprise.com",58],["sgvtribune.com",58],["tampabay.com",58],["times-standard.com",58],["theoaklandpress.com",58],["trentonian.com",58],["twincities.com",58],["whittierdailynews.com",58],["bostonherald.com",58],["dailycamera.com",58],["sbsun.com",58],["dailydemocrat.com",58],["montereyherald.com",58],["orovillemr.com",58],["record-bee.com",58],["redbluffdailynews.com",58],["reporterherald.com",58],["thereporter.com",58],["timescall.com",58],["timesheraldonline.com",58],["ukiahdailyjournal.com",58],["dailylocal.com",58],["8tracks.com",59],["revealname.com",60],["fcportables.com",[61,62]],["golfchannel.com",64],["telemundodeportes.com",64],["stream.nbcsports.com",64],["gamcore.com",65],["porcore.com",65],["69games.xxx",65],["javmix.app",65],["tecknity.com",66],["haaretz.com",67],["hungama.com",67],["a-o.ninja",67],["anime-odcinki.pl",67],["kumpulmanga.org",67],["shortgoo.blogspot.com",67],["tonanmedia.my.id",[67,436]],["yurasu.xyz",67],["isekaipalace.com",67],["megadescarga.net",[68,69,70,71]],["megadescargas.net",[68,69,70,71]],["audioz.cc",72],["audioz.es",72],["luckydice.net",72],["adarima.org",72],["tieutietkiem.com",72],["weatherwx.com",72],["sattaguess.com",72],["winshell.de",72],["rosasidan.ws",72],["modmakers.xyz",72],["gamepure.in",72],["warrenrahul.in",72],["austiblox.net",72],["upiapi.in",72],["myownguess.in",72],["watchhentai.net",72],["thichcode.net",72],["texturecan.com",72],["vikistream.com",73],["eplayer.click",[73,74]],["mega4upload.com",[74,80]],["ennovelas.com",[74,80]],["n-tv.de",75],["brigitte.de",76],["stern.de",76],["foxsports.com.au",77],["canberratimes.com.au",77],["thesimsresource.com",78],["bdnewszh.com",80],["streamservicehd.click",80],["timeforbitco.in",81],["worldofbitco.in",[81,93]],["weatherx.co.in",[81,93]],["getyourbitco.in",81],["sunbtc.space",81],["ctrl.blog",82],["sportlife.es",83],["tubitv.com",83],["finofilipino.org",84],["acortarm.xyz",85],["acortame.xyz",85],["speedtest.net",86],["mysflink.blogspot.com",87],["assia.tv",88],["assia4.com",88],["assia24.com",88],["cwtvembeds.com",[90,124]],["camlovers.tv",90],["porntn.com",90],["pornissimo.org",90],["sexcams-24.com",[90,104]],["watchporn.to",[90,104]],["camwhorez.video",90],["ojogos.com.br",95],["powforums.com",96],["supforums.com",96],["studybullet.com",96],["usgamer.net",97],["recordonline.com",97],["123tvseries.co",99],["freebitcoin.win",100],["e-monsite.com",100],["coindice.win",100],["temp-mails.com",101],["freiepresse.de",102],["investing.com",103],["camhub.cc",104],["love4porn.com",104],["thotvids.com",104],["celebwhore.com",104],["cluset.com",104],["4kporn.xxx",104],["xhomealone.com",104],["lusttaboo.com",[104,368]],["mp3fiber.com",105],["suedkurier.de",106],["anysex.com",108],["gomiblog.com",109],["iptvtools.net",109],["vlist.se",110],["pornve.com",111],["coolrom.com.au",112],["bitcotasks.com",112],["pornohirsch.net",113],["marie-claire.es",114],["gamezhero.com",114],["flashgirlgames.com",114],["onlinesudoku.games",114],["mpg.football",114],["sssam.com",114],["globalnews.ca",115],["videotekaime.net",116],["drinksmixer.com",117],["leitesculinaria.com",117],["fupa.net",118],["ge-map-overlays.appspot.com",119],["browardpalmbeach.com",120],["dallasobserver.com",120],["houstonpress.com",120],["miaminewtimes.com",120],["phoenixnewtimes.com",120],["westword.com",120],["nhentai.net",121],["fox.com.tr",122],["caminspector.net",123],["camwhoreshd.com",123],["camgoddess.tv",123],["gay4porn.com",125],["mypornhere.com",125],["mediapason.it",126],["linkspaid.com",126],["tuotromedico.com",126],["neoteo.com",126],["phoneswiki.com",126],["celebmix.com",126],["myneobuxportal.com",126],["oyungibi.com",126],["25yearslatersite.com",126],["jeshoots.com",127],["techhx.com",127],["karanapk.com",127],["videogreen.xyz",128],["sypl.xyz",128],["playembed.xyz",128],["javhdporn.net",128],["redanimedatabase.cloud",128],["javstream.top",128],["flashplayer.fullstacks.net",130],["cloudapps.herokuapp.com",130],["youfiles.herokuapp.com",130],["temp-mail.org",131],["comnuan.com",132],["veedi.com",133],["battleboats.io",133],["fruitlab.com",134],["haddoz.net",134],["garoetpos.com",134],["stiletv.it",135],["hpav.tv",136],["hpjav.tv",136],["hqtv.biz",138],["liveuamap.com",139],["filmiseriali.com",139],["muvibg.com",139],["linksht.com",[140,141]],["audycje.tokfm.pl",142],["hulu.com",[143,144,145]],["shush.se",146],["aniwatcher.com",147],["emurom.net",148],["allkpop.com",149],["azmath.info",150],["downfile.site",150],["downphanmem.com",150],["expertvn.com",150],["memangbau.com",150],["scratch247.info",150],["trangchu.news",150],["adfoc.us",150],["mynewsmedia.co",[150,237]],["sptfy.be",150],["streamcheck.link",150],["pickcrackpasswords.blogspot.com",152],["kfrfansub.com",153],["thuglink.com",153],["voipreview.org",153],["audiotag.info",154],["hanime.tv",155],["pogo.com",156],["cloudvideo.tv",157],["legionjuegos.org",158],["legionpeliculas.org",158],["legionprogramas.org",158],["16honeys.com",159],["elespanol.com",160],["remodelista.com",161],["coolmathgames.com",[162,163,164,475]],["audiofanzine.com",165],["noweconomy.live",167],["howifx.com",167],["vavada5com.com",167],["hitokin.net",168],["elil.cc",169],["developerinsider.co",170],["ilprimatonazionale.it",171],["hotabis.com",171],["root-nation.com",171],["italpress.com",171],["airsoftmilsimnews.com",171],["artribune.com",171],["thehindu.com",172],["cambro.tv",[173,174]],["nibelungen-kurier.de",175],["noz.de",176],["earthgarage.com",178],["pianetamountainbike.it",179],["barchart.com",180],["modelisme.com",181],["parasportontario.ca",181],["prescottenews.com",181],["nrj-play.fr",182],["oeffentlicher-dienst.info",183],["hackingwithreact.com",184],["gutekueche.at",185],["eplfootballmatch.com",186],["peekvids.com",187],["playvids.com",187],["pornflip.com",187],["redensarten-index.de",188],["vw-page.com",189],["viz.com",[190,191]],["queenfaucet.website",192],["0rechner.de",193],["configspc.com",194],["xopenload.me",194],["uptobox.com",194],["uptostream.com",194],["onepiece-tube.com",195],["japgay.com",196],["mega-debrid.eu",197],["dreamdth.com",198],["pijanitvor.com",198],["diaridegirona.cat",201],["diariodeibiza.es",201],["diariodemallorca.es",201],["diarioinformacion.com",201],["eldia.es",201],["emporda.info",201],["farodevigo.es",201],["laopinioncoruna.es",201],["laopiniondemalaga.es",201],["laopiniondemurcia.es",201],["laopiniondezamora.es",201],["laprovincia.es",201],["levante-emv.com",201],["mallorcazeitung.es",201],["regio7.cat",201],["superdeporte.es",201],["playpaste.com",202],["player.rtl2.de",203],["freetutorialsus.com",204],["vidlii.com",[204,219]],["iammagnus.com",204],["dailyvideoreports.net",204],["unityassets4free.com",204],["cnbc.com",205],["puzzles.msn.com",206],["metro.us",206],["newsobserver.com",206],["arkadiumhosted.com",206],["spankbang.com",207],["firefaucet.win",208],["direct-link.net",209],["direkt-wissen.com",209],["link-to.net",209],["fullhdxxx.com",211],["getintopc.com",212],["unique-tutorials.info",212],["etonline.com",213],["creatur.io",213],["drphil.com",213],["urbanmilwaukee.com",213],["ontiva.com",213],["hideandseek.world",213],["myabandonware.com",213],["mangaalarab.com",213],["kendam.com",213],["wttw.com",213],["synonyms.com",213],["definitions.net",213],["hostmath.com",213],["camvideoshub.com",213],["minhaconexao.com.br",213],["bravedown.com",213],["home-made-videos.com",215],["pxrnxx.xyz",215],["amateur-couples.com",215],["slutdump.com",215],["produsat.com",217],["12thman.com",219],["acusports.com",219],["atlantic10.com",219],["auburntigers.com",219],["baylorbears.com",219],["bceagles.com",219],["bgsufalcons.com",219],["big12sports.com",219],["bigten.org",219],["bradleybraves.com",219],["butlersports.com",219],["cmumavericks.com",219],["conferenceusa.com",219],["cyclones.com",219],["dartmouthsports.com",219],["daytonflyers.com",219],["dbupatriots.com",219],["dbusports.com",219],["denverpioneers.com",219],["fduknights.com",219],["fgcuathletics.com",219],["fightinghawks.com",219],["fightingillini.com",219],["floridagators.com",219],["friars.com",219],["friscofighters.com",219],["gamecocksonline.com",219],["goarmywestpoint.com",219],["gobison.com",219],["goblueraiders.com",219],["gobobcats.com",219],["gocards.com",219],["gocreighton.com",219],["godeacs.com",219],["goexplorers.com",219],["goetbutigers.com",219],["gofrogs.com",219],["gogriffs.com",219],["gogriz.com",219],["golobos.com",219],["gomarquette.com",219],["gopack.com",219],["gophersports.com",219],["goprincetontigers.com",219],["gopsusports.com",219],["goracers.com",219],["goshockers.com",219],["goterriers.com",219],["gotigersgo.com",219],["gousfbulls.com",219],["govandals.com",219],["gowyo.com",219],["goxavier.com",219],["gozags.com",219],["gozips.com",219],["griffinathletics.com",219],["guhoyas.com",219],["gwusports.com",219],["hailstate.com",219],["hamptonpirates.com",219],["hawaiiathletics.com",219],["hokiesports.com",219],["huskers.com",219],["icgaels.com",219],["iuhoosiers.com",219],["jsugamecocksports.com",219],["longbeachstate.com",219],["loyolaramblers.com",219],["lrtrojans.com",219],["lsusports.net",219],["morrisvillemustangs.com",219],["msuspartans.com",219],["muleriderathletics.com",219],["mutigers.com",219],["navysports.com",219],["nevadawolfpack.com",219],["niuhuskies.com",219],["nkunorse.com",219],["nuhuskies.com",219],["nusports.com",219],["okstate.com",219],["olemisssports.com",219],["omavs.com",219],["ovcsports.com",219],["owlsports.com",219],["purduesports.com",219],["redstormsports.com",219],["richmondspiders.com",219],["sfajacks.com",219],["shupirates.com",219],["siusalukis.com",219],["smcgaels.com",219],["smumustangs.com",219],["soconsports.com",219],["soonersports.com",219],["themw.com",219],["tulsahurricane.com",219],["txst.com",219],["txstatebobcats.com",219],["ubbulls.com",219],["ucfknights.com",219],["ucirvinesports.com",219],["uconnhuskies.com",219],["uhcougars.com",219],["uicflames.com",219],["umterps.com",219],["uncwsports.com",219],["unipanthers.com",219],["unlvrebels.com",219],["uoflsports.com",219],["usdtoreros.com",219],["utahstateaggies.com",219],["utepathletics.com",219],["utrockets.com",219],["uvmathletics.com",219],["uwbadgers.com",219],["villanova.com",219],["wkusports.com",219],["wmubroncos.com",219],["woffordterriers.com",219],["1pack1goal.com",219],["bcuathletics.com",219],["bubraves.com",219],["goblackbears.com",219],["golightsgo.com",219],["gomcpanthers.com",219],["goutsa.com",219],["mercerbears.com",219],["pirateblue.com",219],["pirateblue.net",219],["pirateblue.org",219],["quinnipiacbobcats.com",219],["towsontigers.com",219],["tribeathletics.com",219],["tribeclub.com",219],["utepminermaniacs.com",219],["utepminers.com",219],["wkutickets.com",219],["aopathletics.org",219],["atlantichockeyonline.com",219],["bigsouthnetwork.com",219],["bigsouthsports.com",219],["chawomenshockey.com",219],["dbupatriots.org",219],["drakerelays.org",219],["ecac.org",219],["ecacsports.com",219],["emueagles.com",219],["emugameday.com",219],["gculopes.com",219],["godrakebulldog.com",219],["godrakebulldogs.com",219],["godrakebulldogs.net",219],["goeags.com",219],["goislander.com",219],["goislanders.com",219],["gojacks.com",219],["gomacsports.com",219],["gseagles.com",219],["hubison.com",219],["iowaconference.com",219],["ksuowls.com",219],["lonestarconference.org",219],["mascac.org",219],["midwestconference.org",219],["mountaineast.org",219],["niu-pack.com",219],["nulakers.ca",219],["oswegolakers.com",219],["ovcdigitalnetwork.com",219],["pacersports.com",219],["rmacsports.org",219],["rollrivers.com",219],["samfordsports.com",219],["uncpbraves.com",219],["usfdons.com",219],["wiacsports.com",219],["alaskananooks.com",219],["broncathleticfund.com",219],["cameronaggies.com",219],["columbiacougars.com",219],["etownbluejays.com",219],["gobadgers.ca",219],["golancers.ca",219],["gometrostate.com",219],["gothunderbirds.ca",219],["kentstatesports.com",219],["lehighsports.com",219],["lopers.com",219],["lycoathletics.com",219],["lycomingathletics.com",219],["maraudersports.com",219],["mauiinvitational.com",219],["msumavericks.com",219],["nauathletics.com",219],["nueagles.com",219],["nwusports.com",219],["oceanbreezenyc.org",219],["patriotathleticfund.com",219],["pittband.com",219],["principiaathletics.com",219],["roadrunnersathletics.com",219],["sidearmsocial.com",219],["snhupenmen.com",219],["stablerarena.com",219],["stoutbluedevils.com",219],["uwlathletics.com",219],["yumacs.com",219],["collegefootballplayoff.com",219],["csurams.com",219],["cubuffs.com",219],["gobearcats.com",219],["gohuskies.com",219],["mgoblue.com",219],["osubeavers.com",219],["pittsburghpanthers.com",219],["rolltide.com",219],["texassports.com",219],["thesundevils.com",219],["uclabruins.com",219],["wvuathletics.com",219],["wvusports.com",219],["arizonawildcats.com",219],["calbears.com",219],["cuse.com",219],["georgiadogs.com",219],["goducks.com",219],["goheels.com",219],["gostanford.com",219],["insidekstatesports.com",219],["insidekstatesports.info",219],["insidekstatesports.net",219],["insidekstatesports.org",219],["k-stateathletics.com",219],["k-statefootball.net",219],["k-statefootball.org",219],["k-statesports.com",219],["k-statesports.net",219],["k-statesports.org",219],["k-statewomenshoops.com",219],["k-statewomenshoops.net",219],["k-statewomenshoops.org",219],["kstateathletics.com",219],["kstatefootball.net",219],["kstatefootball.org",219],["kstatesports.com",219],["kstatewomenshoops.com",219],["kstatewomenshoops.net",219],["kstatewomenshoops.org",219],["ksuathletics.com",219],["ksusports.com",219],["scarletknights.com",219],["showdownforrelief.com",219],["syracusecrunch.com",219],["texastech.com",219],["theacc.com",219],["ukathletics.com",219],["usctrojans.com",219],["utahutes.com",219],["utsports.com",219],["wsucougars.com",219],["mangadods.com",219],["tricksplit.io",219],["litecoinads.com",219],["template.city",219],["fangraphs.com",220],["4players.de",[221,291]],["buffed.de",221],["gamesaktuell.de",221],["gamezone.de",221],["pcgames.de",221],["videogameszone.de",221],["planetaminecraft.com",222],["flyad.vip",223],["lapresse.ca",224],["kolyoom.com",225],["ilovephd.com",225],["upstream.to",226],["negumo.com",227],["games.wkb.jp",[228,229]],["channelmyanmar.org",[230,231]],["u-s-news.com",231],["fandom.com",[232,493,494]],["kenshi.fandom.com",233],["hausbau-forum.de",234],["fake-it.ws",235],["laksa19.github.io",236],["revadvert.com",237],["1shortlink.com",238],["nesia.my.id",239],["makemoneywithurl.com",240],["resetoff.pl",241],["sexodi.com",241],["cdn77.org",242],["howtofixwindows.com",243],["3sexporn.com",244],["momxxxsex.com",244],["myfreevintageporn.com",244],["penisbuyutucum.net",244],["lightnovelworld.com",245],["ujszo.com",246],["newsmax.com",247],["bobs-tube.com",248],["nadidetarifler.com",249],["siz.tv",249],["suzylu.co.uk",[250,251]],["onworks.net",252],["yabiladi.com",252],["homeairquality.org",254],["faucettronn.click",254],["downloadsoft.net",255],["imgair.net",256],["imgblaze.net",256],["imgfrost.net",256],["pixsera.net",256],["vestimage.site",256],["imgwia.buzz",256],["testlanguages.com",257],["newsinlevels.com",257],["videosinlevels.com",257],["arcai.com",258],["my-code4you.blogspot.com",259],["vlxxs.net",260],["rapelust.com",260],["vtube.to",260],["vtplay.net",260],["desitelugusex.com",260],["xvideos-downloader.net",260],["xxxvideotube.net",260],["sdefx.cloud",260],["nozomi.la",260],["moviesonlinefree.net",260],["flickr.com",261],["firefile.cc",262],["pestleanalysis.com",262],["kochamjp.pl",262],["tutorialforlinux.com",262],["724indir.com",262],["whatsaero.com",262],["animeblkom.net",[262,278]],["blkom.com",262],["globes.co.il",[263,264]],["jardiner-malin.fr",265],["tw-calc.net",266],["ohmybrush.com",267],["talkceltic.net",268],["zdam.xyz",269],["mentalfloss.com",270],["uprafa.com",271],["cube365.net",272],["nightfallnews.com",[273,274]],["wwwfotografgotlin.blogspot.com",275],["freelistenonline.com",275],["badassdownloader.com",276],["quickporn.net",277],["aosmark.com",279],["theappstore.org",279],["atozmath.com",[280,281,282,283,284,285,286]],["newyorker.com",287],["brighteon.com",288],["more.tv",289],["video1tube.com",290],["alohatube.xyz",290],["link.cgtips.org",292],["hentaicloud.com",293],["netfapx.com",295],["androidtvbox.eu",297],["madeinvilnius.lt",297],["paperzonevn.com",298],["hentaienglish.com",299],["hentaiporno.xxx",299],["venge.io",[300,301]],["btcbux.io",302],["its.porn",[303,304]],["atv.at",305],["2ndrun.tv",306],["rackusreads.com",306],["exerror.com",306],["toppixxx.com",307],["temp-phone-number.com",308],["jetpunk.com",310],["imgur.com",311],["hentai-party.com",312],["hentaicomics.pro",312],["xxx-comics.pro",312],["genshinimpactcalculator.com",315],["mysexgames.com",316],["embed.indavideo.hu",319],["coinurl.net",[320,321]],["mdn.rest",322],["gdr-online.com",323],["mmm.dk",324],["iqiyi.com",[325,326]],["m.iqiyi.com",327],["japopav.tv",328],["lvturbo.com",328],["nbcolympics.com",329],["apkhex.com",330],["indiansexstories2.net",331],["issstories.xyz",331],["1340kbbr.com",332],["gorgeradio.com",332],["kduk.com",332],["kedoam.com",332],["kejoam.com",332],["kelaam.com",332],["khsn1230.com",332],["kjmx.rocks",332],["kloo.com",332],["klooam.com",332],["klykradio.com",332],["kmed.com",332],["kmnt.com",332],["kool991.com",332],["kpnw.com",332],["kppk983.com",332],["krktcountry.com",332],["ktee.com",332],["kwro.com",332],["kxbxfm.com",332],["thevalley.fm",332],["dsocker1234.blogspot.com",333],["blick.ch",335],["mgnet.xyz",336],["designtagebuch.de",337],["pixroute.com",338],["calculator-online.net",339],["porngames.club",340],["sexgames.xxx",340],["111.90.159.132",341],["battleplan.news",341],["mobile-tracker-free.com",342],["pfps.gg",343],["ac-illust.com",[344,345]],["photo-ac.com",[344,345]],["social-unlock.com",346],["ninja.io",347],["sourceforge.net",348],["samfirms.com",349],["banned.video",350],["conspiracyfact.info",350],["freeworldnews.tv",350],["madmaxworld.tv",350],["huffpost.com",351],["ingles.com",352],["surfline.com",353],["play.tv3.ee",354],["trendyoum.com",355],["bulbagarden.net",356],["doomovie-hd.com",357],["madoohd.com",357],["moviestars.to",358],["hollywoodlife.com",359],["searchresults.cc",360],["mat6tube.com",361],["textstudio.co",362],["newtumbl.com",363],["nevcoins.club",365],["mail.com",366],["erome.com",369],["oggi.it",[370,371]],["video.gazzetta.it",[370,371]],["mangakita.net",372],["allcryptoz.net",373],["crewbase.net",373],["phineypet.com",373],["shinbhu.net",373],["talkforfitness.com",373],["mdn.lol",373],["carsmania.net",373],["carstopia.net",373],["coinsvalue.net",373],["cookinguide.net",373],["freeoseocheck.com",373],["makeupguide.net",373],["btcbitco.in",373],["btcsatoshi.net",373],["cempakajaya.com",373],["crypto4yu.com",373],["readbitcoin.org",373],["wiour.com",373],["exactpay.online",373],["avpgalaxy.net",374],["mhma12.tech",375],["panda-novel.com",376],["zebranovel.com",376],["lightsnovel.com",376],["eaglesnovel.com",376],["pandasnovel.com",376],["zadfaucet.com",377],["ewrc-results.com",378],["kizi.com",379],["cyberscoop.com",380],["fedscoop.com",380],["canale.live",381],["loawa.com",382],["ygosu.com",382],["sportalkorea.com",382],["algumon.com",382],["hancinema.net",382],["enetnews.co.kr",382],["edaily.co.kr",382],["economist.co.kr",382],["etoday.co.kr",382],["hankyung.com",382],["isplus.com",382],["hometownstation.com",382],["kagit.kr",382],["inven.co.kr",382],["mafiatown.pl",[383,384]],["jeep-cj.com",385],["sponsorhunter.com",386],["coinscap.info",387],["cryptowidgets.net",387],["greenenez.com",387],["insurancegold.in",387],["webfreetools.net",387],["wiki-topia.com",387],["rapid-cloud.co",387],["cloudcomputingtopics.net",388],["likecs.com",389],["tiscali.it",390],["linkspy.cc",391],["tutelehd3.xyz",392],["dirty.pink",[393,394,395]],["adshnk.com",396],["chattanoogan.com",397],["socialmediagirls.com",398],["windowspro.de",399],["snapinsta.app",400],["chip.de",401],["tvtv.ca",402],["tvtv.us",402],["mydaddy.cc",403],["roadtrippin.fr",404],["redketchup.io",[405,406,407]],["anyporn.com",[408,422]],["bravoporn.com",408],["bravoteens.com",408],["crocotube.com",408],["hellmoms.com",408],["hellporno.com",408],["sex3.com",408],["tubewolf.com",408],["xbabe.com",408],["xcum.com",408],["zedporn.com",[408,451]],["imagetotext.info",409],["infokik.com",410],["freepik.com",411],["ddwloclawek.pl",[412,413]],["deezer.com",414],["my-subs.co",415],["plaion.com",416],["slideshare.net",[417,418]],["ustreasuryyieldcurve.com",419],["goo.st",420],["freevpshere.com",420],["softwaresolutionshere.com",420],["staige.tv",423],["bondagevalley.cc",424],["androidadult.com",425],["sharer.pm",426],["watchtv24.com",427],["cellmapper.net",428],["medscape.com",429],["arkadium.com",430],["app.blubank.com",432],["lifesurance.info",433],["sportdeutschland.tv",434],["kcra.com",434],["wcvb.com",434],["kusonime.com",435],["coursedrive.org",437],["dtbps3games.com",437],["vod.pl",438],["megadrive-emulator.com",439],["animesaga.in",442],["bestx.stream",442],["moviesapi.club",442],["digimanie.cz",443],["svethardware.cz",443],["srvy.ninja",444],["drawer-opportunity-i-243.site",445],["tchatche.com",446],["ozulmanga.com",447],["edmdls.com",448],["freshremix.net",448],["scenedl.org",448],["trakt.tv",449],["shroomers.app",450],["di.fm",[452,453,454]],["qtoptens.com",455],["videogamer.com",455],["wrestlinginc.com",455],["teamskeet.com",456],["tacobell.com",458],["webtoons.com",[459,460]],["zefoy.com",462],["natgeotv.com",463],["br.de",464],["pasteboard.co",465],["avclub.com",466],["clickhole.com",466],["deadspin.com",466],["gizmodo.com",466],["jalopnik.com",466],["jezebel.com",466],["kotaku.com",466],["lifehacker.com",466],["splinternews.com",466],["theinventory.com",466],["theonion.com",466],["theroot.com",466],["thetakeout.com",466],["pewresearch.org",466],["los40.com",[467,468]],["verizon.com",469],["humanbenchmark.com",470],["politico.com",471],["officedepot.co.cr",[472,473]],["usnews.com",474],["factable.com",476],["zee5.com",477],["gala.fr",478],["geo.fr",478],["voici.fr",478],["gloucestershirelive.co.uk",479],["arsiv.mackolik.com",480],["jacksonguitars.com",481],["scandichotels.com",482],["stylist.co.uk",483],["nettiauto.com",484],["thaiairways.com",[485,486]],["cerbahealthcare.it",[487,488]],["futura-sciences.com",[487,503]],["tiendaenlinea.claro.com.ni",[489,490]],["tieba.baidu.com",491],["linktr.ee",492],["grasshopper.com",[495,496]],["epson.com.cn",[497,498]],["oe24.at",[499,500]],["szbz.de",499],["platform.autods.com",[501,502]],["wikihow.com",504],["citibank.com.sg",505],["uol.com.br",[506,507,508,509]],["smallseotools.com",510]]);

const entitiesMap = new Map([["vidsrc",8],["watch-series",8],["watchseries",8],["vev",8],["vidop",8],["vidup",8],["starmusiq",11],["wcofun",11],["kissasian",13],["gogoanime",[13,21]],["1movies",[13,20]],["xmovies8",13],["animeheaven",13],["0123movies",13],["gostream",13],["gomovies",13],["hamsterix",14],["xhamster",14],["xhamster1",14],["xhamster10",14],["xhamster11",14],["xhamster12",14],["xhamster13",14],["xhamster14",14],["xhamster15",14],["xhamster16",14],["xhamster17",14],["xhamster18",14],["xhamster19",14],["xhamster20",14],["xhamster2",14],["xhamster3",14],["xhamster4",14],["xhamster5",14],["xhamster7",14],["xhamster8",14],["vidlox",[15,16]],["primewire",17],["streanplay",[17,19]],["sbplay",17],["milfnut",17],["fmovies",21],["hqq",[25,26]],["waaw",26],["123link",27],["adshort",27],["linkshorts",27],["adsrt",27],["vinaurl",27],["adfloz",27],["dutchycorp",27],["shortearn",27],["pingit",27],["urlty",27],["seulink",27],["shrink",27],["tmearn",27],["megalink",27],["linkviet",27],["miniurl",27],["pcprogramasymas",27],["link1s",27],["shortzzy",27],["shorttey",[27,213]],["lite-link",27],["pureshort",27],["adcorto",27],["dulinks",27],["zshort",27],["upfiles",27],["linkfly",27],["wplink",27],["financerites",27],["camwhores",[28,39,89,90,91]],["tube8",[29,30]],["youporn",30],["redtube",30],["pornhub",[30,199,200]],["xtits",[55,125]],["pouvideo",63],["povvideo",63],["povw1deo",63],["povwideo",63],["powv1deo",63],["powvibeo",63],["powvideo",63],["powvldeo",63],["acortalo",[68,69,70,71]],["acortar",[68,69,70,71]],["plyjam",[73,74]],["fxporn69",79],["vipbox",80],["viprow",80],["desbloqueador",85],["xberuang",87],["teknorizen",87],["linkberuang",87],["kickassanime",92],["subtorrents",94],["subtorrents1",94],["newpelis",94],["pelix",94],["allcalidad",94],["infomaniakos",94],["filecrypt",98],["tornadomovies",99],["sexwebvideo",104],["mangovideo",104],["icdrama",110],["mangasail",110],["file4go",112],["asianclub",128],["anitube",134],["mixdrop",137],["azsoft",150],["uploadev",166],["ver-pelis-online",177],["ancient-origins",186],["lookcam",213],["lootlinks",213],["dpstream",216],["bluemediafiles",218],["docer",241],["pixlev",256],["skymovieshd",260],["dvdplay",260],["crackstreams",296],["123movieshd",309],["uproxy",313],["animesa",314],["cinecalidad",[317,318]],["apkmaven",364],["gmx",367],["oneesports",382],["gamereactor",421],["terabox",431],["tvhay",[440,441]],["www.google",457]]);

const exceptionsMap = new Map([["pingit.com",[27]],["pingit.me",[27]]]);

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantCore(false, ...args);
}

function setConstantCore(
    trusted = false,
    chain = '',
    cValue = ''
) {
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    function setConstant(chain, cValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            const proxy = new Proxy(fn, {
                defineProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.defineProperty(...arguments);
                    }
                    return true;
                },
                deleteProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.deleteProperty(...arguments);
                    }
                    return true;
                },
                get(target, prop) {
                    if ( prop === 'toString' ) {
                        return function() {
                            return `function ${trappedProp}() { [native code] }`;
                        }.bind(null);
                    }
                    return Reflect.get(...arguments);
                },
            });
            return proxy;
        };
        if ( cValue === 'undefined' ) {
            cValue = undefined;
        } else if ( cValue === 'false' ) {
            cValue = false;
        } else if ( cValue === 'true' ) {
            cValue = true;
        } else if ( cValue === 'null' ) {
            cValue = null;
        } else if ( cValue === "''" || cValue === '' ) {
            cValue = '';
        } else if ( cValue === '[]' ) {
            cValue = [];
        } else if ( cValue === '{}' ) {
            cValue = {};
        } else if ( cValue === 'noopFunc' ) {
            cValue = cloakFunc(function(){});
        } else if ( cValue === 'trueFunc' ) {
            cValue = cloakFunc(function(){ return true; });
        } else if ( cValue === 'falseFunc' ) {
            cValue = cloakFunc(function(){ return false; });
        } else if ( /^-?\d+$/.test(cValue) ) {
            cValue = parseInt(cValue);
            if ( isNaN(cValue) ) { return; }
            if ( Math.abs(cValue) > 0x7FFF ) { return; }
        } else if ( trusted ) {
            if ( cValue.startsWith('{') && cValue.endsWith('}') ) {
                try { cValue = safe.jsonParse(cValue).value; } catch(ex) { return; }
            }
        } else {
            return;
        }
        if ( extraArgs.as !== undefined ) {
            if ( extraArgs.as === 'function' ) {
                cValue = ( ) => cValue;
            } else if ( extraArgs.as === 'callback' ) {
                cValue = ( ) => (( ) => cValue);
            } else if ( extraArgs.as === 'resolved' ) {
                cValue = Promise.resolve(cValue);
            } else if ( extraArgs.as === 'rejected' ) {
                cValue = Promise.reject(cValue);
            }
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (cValue !== undefined && cValue !== null) &&
                (typeof v !== typeof cValue);
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : cValue) === false ) { return; }
            const odesc = Object.getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof Object ) {
                owner[prop] = cValue;
                if ( odesc.get instanceof Function ) {
                    prevGetter = odesc.get;
                }
                if ( odesc.set instanceof Function ) {
                    prevSetter = odesc.set;
                }
            }
            try {
                safe.Object_defineProperty(owner, prop, {
                    configurable,
                    get() {
                        if ( prevGetter !== undefined ) {
                            prevGetter();
                        }
                        return handler.getter(); // cValue
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
            } catch(ex) {
            }
        };
        const trapChain = function(owner, chain) {
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                trapProp(owner, chain, false, {
                    v: undefined,
                    init: function(v) {
                        if ( mustAbort(v) ) { return false; }
                        this.v = v;
                        return true;
                    },
                    getter: function() {
                        return document.currentScript === thisScript
                            ? this.v
                            : cValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        cValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof Object || typeof v === 'object' && v !== null ) {
                trapChain(v, chain);
                return;
            }
            trapProp(owner, prop, true, {
                v: undefined,
                init: function(v) {
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return this.v;
                },
                setter: function(a) {
                    this.v = a;
                    if ( a instanceof Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, cValue);
    }, extraArgs.runAt);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1,
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
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
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
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
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
    try { setConstant(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_setConstant();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_setConstant = cloneInto([
            [ '(', uBOL_setConstant.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_setConstant);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_setConstant;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
