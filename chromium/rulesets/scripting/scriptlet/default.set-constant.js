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

const scriptletGlobals = {}; // jshint ignore: line

const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["oeo","noopFunc"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["console.clear","trueFunc"],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["console.clear","noopFunc"],["console.log","noopFunc"],["String.prototype.charCodeAt","trueFunc"],["attachEvent","trueFunc"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["is_adblocked","false"],["showPopunder","noopFunc"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["fuckAdBlock","false"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["flashvars.adv_pause_html",""],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["$.fx.off","true"],["adsClasses","undefined"],["gsecs","0"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["Object.prototype.adReinsertion","noopFunc"],["Object.prototype.disableAds","true"],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["adBlock","false"],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["isBlocked","false"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["spoof","noopFunc"],["adBlockerDetected","undefined"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["isAdblock","false"],["CaptchmeState.adb","undefined"],["bb","false"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["flashvars.popunder_url",""],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["dvsize","51"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["adblockDetector","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["testerli","false"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["show_ads_gr8_lite","true"],["doads","true"],["jsUnda","noopFunc"],["abp","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["getHomadConfig","noopFunc"],["adsbygoogle.loaded","true"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["cRAds","true"],["app.addonIsInstalled","trueFunc"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["CustomEvent","noopFunc"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["ai_dummy","true"],["ulp_noadb","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["timeSec","0"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["DHAntiAdBlocker","true"],["adsConfigs","{}"],["adsConfigs.0","{}"],["adsConfigs.0.enabled","0"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["adSettings","[]"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["karte3","18"],["protection","noopFunc"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["checkAdsStatus","noopFunc"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["document.hasFocus","trueFunc"],["detectAdBlock","noopFunc"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["private","false"],["showadas","true"],["iktimer","0"],["aSl.gcd","0"],["counter","10"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["showada","true"],["showax","true"],["p18","undefined"],["asc","2"],["ADBLOCKED","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["adsHeight","11"],["checkCap","0"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["isadb","false"],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["Object.prototype.isAdDisabled","true"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["D4zz","noopFunc"],["ad_link",""],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["count","1"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["stop","noopFunc"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["aLoad","noopFunc"],["mtCanRunAdsSoItCanStillBeOnTheWeb","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["Overlayer","{}"],["pop3getcookie","undefined"],["pop3setcookie1","undefined"],["pop3setCookie2","undefined"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["Object.prototype.adBlockerDetected","falseFunc"],["Object.prototype.adBlocker","false"],["Object.prototype.tomatoDetected","falseFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["navigator.brave","undefined"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["window.runningAdsAllowed","true"],["tOS1","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["checkAdBlocker","noopFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["playerConfigs.rek","{}"],["feedBack.showAffilaePromo","noopFunc"],["loadpagecheck","noopFunc"],["hucksterInit","trueFunc"],["artemisDisplays","[]"],["artemisItemNames","[]"],["isAdBlockerActive","noopFunc"],["di.VAST.XHRURLHandler","noopFunc"],["di.app.WebplayerApp.Ads.Supervisor.eligibleForPreroll","trueFunc"],["di.app.WebplayerApp.Ads.Supervisor.eligibleForMidroll","trueFunc"],["admiral","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["confirm","noopFunc"],["checkAdBlockeraz","noopFunc"],["segundos","0"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["flashvars.event_reporting",""],["Visitor","{}"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["DD_LOGS","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["SalesforceInteractions","{}"],["SalesforceInteractions.CatalogObjectInteractionName"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];

const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["kicker.de",[4,585]],["t-online.de",5],["whatfinger.com",6],["timesofindia.indiatimes.com",7],["economictimes.indiatimes.com",8],["userscloud.com",9],["motherless.com",10],["sueddeutsche.de",11],["watchanimesub.net",12],["wco.tv",12],["wcoanimesub.tv",12],["wcoforever.net",12],["freeviewmovies.com",12],["filehorse.com",12],["guidetnt.com",12],["sp-today.com",12],["linkvertise.com",12],["textbin.net",12],["eropaste.net",12],["pastebr.xyz",12],["getpaste.link",12],["sharetext.me",12],["note.sieuthuthuat.com",12],["elcriticodelatele.com",[12,255]],["gadgets.es",[12,255]],["amateurporn.co",[12,101]],["wiwo.de",13],["masteranime.tv",14],["alphaporno.com",[15,440]],["porngem.com",15],["uploadbank.com",15],["shortit.pw",[15,105]],["familyporn.tv",15],["cloudemb.com",[15,362]],["sbplay1.com",15],["id45.cyou",15],["85tube.com",[15,86]],["k1nk.co",15],["watchasians.cc",15],["soltoshindo.com",15],["dronedj.com",17],["nolive.me",18],["player.glomex.com",19],["merkur.de",19],["tz.de",19],["hotpornfile.org",22],["player.tabooporns.com",22],["x69.ovh",22],["wiztube.xyz",22],["netu.frembed.fun",22],["multiup.us",22],["rpdrlatino.live",22],["peliculas8k.com",[22,23]],["video.q34r.org",22],["69x.online",22],["czxxx.org",22],["netu.ac",22],["dirtyvideo.fun",23],["adbull.org",24],["mitly.us",24],["linkrex.net",24],["linx.cc",24],["oke.io",24],["dz4link.com",24],["linclik.com",24],["shrt10.com",24],["loptelink.com",24],["cut-fly.com",24],["linkfinal.com",24],["payskip.org",24],["cutpaid.com",24],["forexmab.com",24],["linkjust.com",24],["linkszia.co",24],["leechpremium.link",24],["icutlink.com",[24,125]],["stfly.me",24],["oncehelp.com",24],["rgl.vn",24],["reqlinks.net",24],["bitlk.com",24],["qlinks.eu",24],["link.3dmili.com",24],["short-fly.com",24],["foxseotools.com",24],["pngit.live",24],["link.turkdown.com",24],["urlty.com",24],["7r6.com",24],["oko.sh",24],["ckk.ai",24],["fc.lc",24],["fstore.biz",24],["cuts-url.com",24],["eio.io",24],["exe.app",24],["exee.io",24],["exey.io",24],["skincarie.com",24],["exeo.app",24],["coinlyhub.com",[24,203]],["adsafelink.com",24],["aii.sh",24],["cybertechng.com",[24,216]],["owllink.net",24],["cutdl.xyz",24],["iir.ai",24],["shorteet.com",[24,235]],["sekilastekno.com",24],["smoner.com",24],["xpshort.com",24],["upshrink.com",24],["enit.in",[24,231]],["ez4short.com",24],["easysky.in",24],["veganab.co",24],["adrinolinks.in",24],["go.bloggingaro.com",24],["go.gyanitheme.com",24],["go.theforyou.in",24],["go.hipsonyc.com",24],["birdurls.com",24],["try2link.com",24],["jameeltips.us",24],["gainl.ink",24],["promo-visits.site",24],["satoshi-win.xyz",[24,288]],["shorterall.com",24],["encurtandourl.com",24],["forextrader.site",24],["postazap.com",24],["cety.app",24],["exego.app",[24,284]],["cutlink.net",24],["cutsy.net",24],["cutyurls.com",24],["cutty.app",24],["cutnet.net",24],["tinys.click",[24,216]],["cpm.icu",24],["panyshort.link",24],["enagato.com",24],["pandaznetwork.com",24],["tvi.la",24],["iir.la",24],["tii.la",24],["oei.la",24],["lnbz.la",[24,231]],["recipestutorials.com",24],["shrinkforearn.in",24],["techyuth.xyz",24],["oii.io",24],["du-link.in",24],["atglinks.com",24],["thotpacks.xyz",24],["megaurl.in",24],["megafly.in",24],["simana.online",24],["link.paid4link.com",[24,294]],["exalink.fun",24],["indiamaja.com",24],["newshuta.in",24],["linksly.co",24],["pkr.pw",24],["imagenesderopaparaperros.com",24],["shortenbuddy.com",24],["gibit.xyz",24],["apksvip.com",24],["4cash.me",24],["namaidani.com",24],["teknomuda.com",24],["illink.net",24],["miuiku.com",24],["yourtechnology.online",24],["savelink.site",24],["apkshrt.com",24],["srts.me",24],["kutmoney.com",24],["kutt.io",24],["sanoybonito.club",24],["samaa-pro.com",24],["miklpro.com",24],["modapk.link",24],["1shorten.com",24],["ccurl.net",24],["st23q.com",24],["beautyram.info",24],["viraloc.com",24],["galaxy-link.space",24],["linkpoi.me",24],["usdshort.com",24],["bitcoinly.in",24],["menjelajahi.com",24],["pewgame.com",24],["yxoshort.com",24],["1link.vip",24],["haonguyen.top",24],["claimfreebits.com",24],["crazyblog.in",24],["gtlink.co",24],["link.tokenoto.com",24],["cutearn.net",24],["rshrt.com",24],["short.palmeratv.com",24],["filezipa.com",24],["dz-linkk.com",24],["theblissempire.com",24],["finanzas-vida.com",24],["adurly.cc",24],["pix4link.com",24],["paid4.link",24],["link.asiaon.top",24],["go.gets4link.com",24],["download.sharenulled.net",24],["beingtek.com",24],["shorturl.unityassets4free.com",24],["disheye.com",24],["techymedies.com",24],["techysuccess.com",24],["za.gl",[24,143]],["download.baominh.tech",24],["bblink.com",24],["linkbr.xyz",24],["myad.biz",24],["swzz.xyz",24],["vevioz.com",24],["charexempire.com",24],["clk.asia",24],["egfly.xyz",24],["linka.click",24],["sturls.com",24],["myshrinker.com",24],["go.adinsurance.xyz",24],["dash-free.com",[24,216]],["snowurl.com",[24,216]],["netfile.cc",24],["link.insurglobal.xyz",24],["theconomy.me",24],["rocklink.in",24],["adinsurance.xyz",24],["insurglobal.xyz",24],["techgeek.digital",24],["download3s.net",24],["shortx.net",24],["musicc.xyz",24],["shortawy.com",24],["tlin.me",24],["apprepack.com",24],["up-load.one",24],["zuba.link",24],["news.speedynews.xyz",24],["golink.xaydungplus.com",24],["bestcash2020.com",24],["hoxiin.com",24],["technemo.xyz",24],["go.linkbnao.com",24],["link-yz.com",24],["paylinnk.com",24],["thizissam.in",24],["ier.ai",24],["bloggertheme.xyz",24],["adslink.pw",24],["novelssites.com",24],["links.medipost.org",24],["faucetcrypto.net",24],["short.freeltc.top",24],["trxking.xyz",24],["weadown.com",24],["m.bloggingguidance.com",24],["blog.onroid.com",24],["link.codevn.net",24],["upfilesurls.com",24],["shareus.site",24],["link4rev.site",24],["bloginguru.xyz",24],["celinks.net",24],["c2g.at",24],["shortzu.icu",24],["bitcosite.com",[24,454]],["cryptosh.pro",24],["sigmalinks.in",24],["link68.net",24],["traffic123.net",24],["windowslite.net",[24,216]],["coinsl.click",24],["viewfr.com",24],["cl1ca.com",24],["4br.me",24],["fir3.net",24],["kiddyshort.com",24],["watchmygf.me",[25,53]],["camwhorez.tv",[25,38,85,86]],["cambay.tv",[25,55,85,101,118,120,121,122]],["fpo.xxx",[25,55]],["sexemix.com",25],["heavyfetish.com",[25,519]],["you-porn.com",27],["youporngay.com",27],["youpornru.com",27],["9908ww.com",27],["adelaidepawnbroker.com",27],["bztube.com",27],["hotovs.com",27],["insuredhome.org",27],["nudegista.com",27],["pornluck.com",27],["vidd.se",27],["pornhub.com",27],["pornerbros.com",28],["freep.com",28],["porn.com",31],["tune.pk",32],["noticias.gospelmais.com.br",33],["techperiod.com",33],["jacquieetmicheltv.net",[34,35]],["illicoporno.com",34],["lavoixdux.com",34],["tonpornodujour.com",34],["jacquieetmichel.net",34],["swame.com",34],["vosfemmes.com",34],["voyeurfrance.net",34],["viki.com",[36,37]],["sleazyneasy.com",[38,39,40]],["smutr.com",[38,199]],["watchdirty.to",[38,86,87,101]],["yourporngod.com",[38,39]],["javbangers.com",[38,332]],["camfox.com",38],["camthots.tv",[38,118]],["shegotass.info",38],["amateur8.com",38],["bigtitslust.com",38],["ebony8.com",38],["freeporn8.com",38],["lesbian8.com",38],["maturetubehere.com",38],["sortporn.com",38],["webcamvau.com",38],["motherporno.com",[38,39,55,120]],["tktube.com",38],["theporngod.com",[38,39]],["pornsocket.com",41],["luxuretv.com",42],["porndig.com",[43,44]],["webcheats.com.br",45],["ceesty.com",[46,47]],["gestyy.com",[46,47]],["corneey.com",47],["destyy.com",47],["festyy.com",47],["sh.st",47],["mitaku.net",47],["angrybirdsnest.com",48],["zrozz.com",48],["clix4btc.com",48],["4tests.com",48],["planet-explorers-isos.com",48],["business-standard.com",48],["goltelevision.com",48],["news-und-nachrichten.de",48],["laradiobbs.net",48],["urlaubspartner.net",48],["produktion.de",48],["cinemaxxl.de",48],["bladesalvador.com",48],["tempr.email",48],["katfile.com",48],["trust.zone",48],["cshort.org",48],["friendproject.net",48],["covrhub.com",48],["planetsuzy.org",49],["empflix.com",50],["freeplayervideo.com",51],["nazarickol.com",51],["player-cdn.com",51],["playhydrax.com",51],["alleneconomicmatter.com",51],["apinchcaseation.com",51],["bigclatterhomesguideservice.com",51],["bradleyviewdoctor.com",51],["brookethoughi.com",51],["brucevotewithin.com",51],["cindyeyefinal.com",51],["denisegrowthwide.com",51],["edwardarriveoften.com",51],["erikcoldperson.com",51],["graceaddresscommunity.com",51],["heatherdiscussionwhen.com",51],["housecardsummerbutton.com",51],["jamesstartstudent.com",51],["jamiesamewalk.com",51],["jasminetesttry.com",51],["jasonresponsemeasure.com",51],["jayservicestuff.com",51],["johntryopen.com",51],["kennethofficialitem.com",51],["loriwithinfamily.com",51],["lukecomparetwo.com",51],["markstyleall.com",51],["michaelapplysome.com",51],["morganoperationface.com",51],["nectareousoverelate.com",51],["paulkitchendark.com",51],["rebeccaneverbase.com",51],["roberteachfinal.com",51],["robertplacespace.com",51],["ryanagoinvolve.com",51],["sandrataxeight.com",51],["seanshowcould.com",51],["sethniceletter.com",51],["shannonpersonalcost.com",51],["sharonwhiledemocratic.com",51],["stevenimaginelittle.com",51],["strawberriesporail.com",51],["timberwoodanotia.com",51],["tinycat-voe-fashion.com",51],["troyyourlead.com",51],["uptodatefinishconference.com",51],["uptodatefinishconferenceroom.com",51],["vincentincludesuccessful.com",51],["voe.sx",51],["motphimtv.com",51],["rabbitstream.net",51],["projectfreetv.one",51],["filespace.com",52],["transparentcalifornia.com",53],["deepbrid.com",54],["submityourflicks.com",55],["3movs.com",55],["bravoerotica.net",[55,120]],["youx.xxx",55],["camclips.tv",[55,199]],["camflow.tv",[55,101,120,164,238]],["camhoes.tv",[55,101,118,120,164,238]],["xmegadrive.com",55],["xxxymovies.com",55],["xxxshake.com",55],["gayck.com",55],["xhand.com",[55,120]],["analdin.com",[55,120]],["webnovel.com",56],["videosgay.me",[57,58]],["oneupload.to",58],["wishfast.top",58],["schwaebische.de",59],["8tracks.com",60],["revealname.com",61],["fcportables.com",[62,63]],["kimcartoon.li",64],["kc.linksgen.com",64],["kisscartoon.se",64],["golfchannel.com",65],["telemundodeportes.com",65],["stream.nbcsports.com",65],["mathdf.com",65],["gamcore.com",66],["porcore.com",66],["69games.xxx",66],["javmix.app",66],["tecknity.com",67],["haaretz.co.il",68],["haaretz.com",68],["hungama.com",68],["a-o.ninja",68],["anime-odcinki.pl",68],["kumpulmanga.org",68],["shortgoo.blogspot.com",68],["tonanmedia.my.id",[68,474]],["yurasu.xyz",68],["isekaipalace.com",68],["vikistream.com",69],["eplayer.click",[69,70]],["mega4upload.com",[70,76]],["ennovelas.com",[70,76]],["n-tv.de",71],["brigitte.de",72],["stern.de",72],["foxsports.com.au",73],["canberratimes.com.au",73],["thesimsresource.com",74],["bdnewszh.com",76],["streamservicehd.click",76],["timeforbitco.in",77],["worldofbitco.in",[77,88]],["weatherx.co.in",[77,88]],["getyourbitco.in",77],["sunbtc.space",77],["ctrl.blog",78],["sportlife.es",79],["finofilipino.org",80],["acortarm.xyz",81],["speedtest.net",82],["mysflink.blogspot.com",83],["assia.tv",84],["assia4.com",84],["assia24.com",84],["cwtvembeds.com",[86,119]],["xmateur.com",[86,87,101]],["camlovers.tv",86],["porntn.com",86],["pornissimo.org",86],["sexcams-24.com",[86,101]],["watchporn.to",[86,101]],["camwhorez.video",86],["footstockings.com",[87,101]],["sbs.com.au",89],["ojogos.com.br",91],["powforums.com",92],["supforums.com",92],["studybullet.com",92],["usgamer.net",93],["recordonline.com",93],["freebitcoin.win",95],["e-monsite.com",95],["coindice.win",95],["sport-tv-guide.live",96],["temp-mails.com",97],["freiepresse.de",98],["investing.com",99],["camhub.cc",101],["love4porn.com",101],["thotvids.com",101],["watchmdh.to",101],["celebwhore.com",101],["cluset.com",101],["4kporn.xxx",101],["xhomealone.com",101],["lusttaboo.com",[101,403]],["hentai-moon.com",101],["mp3fiber.com",102],["chicoer.com",103],["dailybreeze.com",103],["dailybulletin.com",103],["dailynews.com",103],["delcotimes.com",103],["eastbaytimes.com",103],["macombdaily.com",103],["ocregister.com",103],["pasadenastarnews.com",103],["pe.com",103],["presstelegram.com",103],["redlandsdailyfacts.com",103],["reviewjournal.com",103],["santacruzsentinel.com",103],["saratogian.com",103],["sentinelandenterprise.com",103],["sgvtribune.com",103],["tampabay.com",103],["times-standard.com",103],["theoaklandpress.com",103],["trentonian.com",103],["twincities.com",103],["whittierdailynews.com",103],["bostonherald.com",103],["dailycamera.com",103],["sbsun.com",103],["dailydemocrat.com",103],["montereyherald.com",103],["orovillemr.com",103],["record-bee.com",103],["redbluffdailynews.com",103],["reporterherald.com",103],["thereporter.com",103],["timescall.com",103],["timesheraldonline.com",103],["ukiahdailyjournal.com",103],["dailylocal.com",103],["mercurynews.com",103],["suedkurier.de",104],["anysex.com",106],["vlist.se",107],["pornve.com",108],["coolrom.com.au",109],["pornohirsch.net",110],["marie-claire.es",111],["gamezhero.com",111],["flashgirlgames.com",111],["onlinesudoku.games",111],["mpg.football",111],["sssam.com",111],["globalnews.ca",112],["drinksmixer.com",113],["leitesculinaria.com",113],["fupa.net",114],["browardpalmbeach.com",115],["dallasobserver.com",115],["houstonpress.com",115],["miaminewtimes.com",115],["phoenixnewtimes.com",115],["westword.com",115],["nhentai.net",116],["nowtv.com.tr",117],["caminspector.net",118],["camwhoreshd.com",118],["camgoddess.tv",118],["gay4porn.com",120],["mypornhere.com",120],["mediapason.it",123],["linkspaid.com",123],["tuotromedico.com",123],["neoteo.com",123],["phoneswiki.com",123],["celebmix.com",123],["myneobuxportal.com",123],["oyungibi.com",123],["25yearslatersite.com",123],["jeshoots.com",124],["techhx.com",124],["karanapk.com",124],["flashplayer.fullstacks.net",126],["cloudapps.herokuapp.com",126],["texteditor.nsspot.net",126],["youfiles.herokuapp.com",126],["temp-mail.org",127],["playembed.xyz",128],["javhdporn.net",128],["javstream.top",128],["comnuan.com",129],["veedi.com",130],["battleboats.io",130],["fruitlab.com",131],["haddoz.net",131],["garoetpos.com",131],["stiletv.it",132],["hqtv.biz",134],["liveuamap.com",135],["muvibg.com",135],["audycje.tokfm.pl",136],["hulu.com",[137,138,139]],["shush.se",140],["emurom.net",141],["allkpop.com",142],["pickcrackpasswords.blogspot.com",144],["kfrfansub.com",145],["thuglink.com",145],["voipreview.org",145],["hanime.tv",146],["pogo.com",147],["cloudvideo.tv",148],["legionjuegos.org",149],["legionpeliculas.org",149],["legionprogramas.org",149],["16honeys.com",150],["elespanol.com",151],["remodelista.com",152],["coolmathgames.com",[153,154,155,537]],["audiofanzine.com",156],["noweconomy.live",158],["howifx.com",[158,231]],["vavada5com.com",158],["hitokin.net",159],["developerinsider.co",160],["ilprimatonazionale.it",161],["hotabis.com",161],["root-nation.com",161],["italpress.com",161],["airsoftmilsimnews.com",161],["artribune.com",161],["thehindu.com",162],["cambro.tv",[163,164]],["nibelungen-kurier.de",165],["adfoc.us",167],["remixxodia.com",167],["djratanmamatamix.com",167],["loan70.com",167],["djprincemusic.com",167],["shikkharalo.in",167],["upgraminyojana.in",167],["biharstudyfamily.in",167],["aijankari.com",167],["techybattle.com",167],["ringtonsmp3.in",167],["doggyclothes.store",167],["fort-myers-airport.org",167],["rjmraju.com",167],["veteranautoinc.com",167],["sipplanhindi.in",167],["taporibass.com",167],["bmkmafiya.com",167],["bgmiipadview.com",167],["dheerajrock.com",167],["djbarmanmusic.com",167],["babamp3.in",167],["syllabusdownload.com",167],["tmtaz.com",167],["mytastyrecipe.in",167],["techglobo.com",167],["jobsparky.com",167],["sarkisozleri.pro",167],["pharmastudyaid.com",167],["sololevelinghindi.online",167],["120fpsconfig.com",167],["djrachit.com",167],["rajgarhsamachar.com",167],["odisharemix.link",167],["freegadgets24.com",167],["oriyaremix.com",167],["funkeykida.com",167],["puresports.pro",167],["morestate.pro",167],["filmfliqz.com",167],["recipenames.com",167],["insurelist.online",167],["odiaalbumsong.com",167],["decidewhy.com",167],["apkeclipse.com",167],["cmsarkariyojana.com",167],["djrkmusicjaunpur.in",167],["techreviewhere.com",167],["spatsify.com",167],["funkeypagali.com",167],["careersides.com",167],["nayisahara.com",167],["wikifilmia.com",167],["infinityskull.com",167],["viewmyknowledge.com",167],["iisfvirtual.in",167],["starxinvestor.com",167],["myprivatejobs.com",[167,285]],["wikitraveltips.com",[167,285]],["amritadrino.com",[167,285]],["sahlmarketing.net",167],["filmypoints.in",167],["fitnessholic.net",167],["moderngyan.com",167],["sattakingcharts.in",167],["freshbhojpuri.com",167],["bgmi32bitapk.in",167],["bankshiksha.in",167],["earn.mpscstudyhub.com",167],["earn.quotesopia.com",167],["money.quotesopia.com",167],["best-mobilegames.com",167],["learn.moderngyan.com",167],["bharatsarkarijobalert.com",167],["techacode.com",167],["trickms.com",167],["ielts-isa.edu.vn",167],["sptfy.be",167],["mcafee-com.com",[167,284]],["pianetamountainbike.it",168],["barchart.com",169],["modelisme.com",170],["parasportontario.ca",170],["prescottenews.com",170],["nrj-play.fr",171],["oeffentlicher-dienst.info",172],["hackingwithreact.com",173],["gutekueche.at",174],["eplfootballmatch.com",175],["peekvids.com",176],["playvids.com",176],["pornflip.com",176],["redensarten-index.de",177],["vw-page.com",178],["viz.com",[179,180]],["queenfaucet.website",181],["0rechner.de",182],["configspc.com",183],["xopenload.me",183],["uptobox.com",183],["uptostream.com",183],["onepiece-tube.com",184],["japgay.com",185],["mega-debrid.eu",186],["dreamdth.com",187],["diaridegirona.cat",189],["diariodeibiza.es",189],["diariodemallorca.es",189],["diarioinformacion.com",189],["eldia.es",189],["emporda.info",189],["farodevigo.es",189],["laopinioncoruna.es",189],["laopiniondemalaga.es",189],["laopiniondemurcia.es",189],["laopiniondezamora.es",189],["laprovincia.es",189],["levante-emv.com",189],["mallorcazeitung.es",189],["regio7.cat",189],["superdeporte.es",189],["playpaste.com",190],["player.rtl2.de",191],["freetutorialsus.com",192],["vidlii.com",[192,208]],["iammagnus.com",192],["dailyvideoreports.net",192],["unityassets4free.com",192],["cnbc.com",193],["puzzles.msn.com",194],["metro.us",194],["newsobserver.com",194],["arkadiumhosted.com",194],["firefaucet.win",196],["55k.io",197],["filelions.online",197],["stmruby.com",197],["direct-link.net",198],["direkt-wissen.com",198],["link-to.net",198],["fullhdxxx.com",200],["pornclassic.tube",201],["tubepornclassic.com",201],["etonline.com",202],["creatur.io",202],["drphil.com",202],["urbanmilwaukee.com",202],["ontiva.com",202],["hideandseek.world",202],["myabandonware.com",202],["kendam.com",202],["wttw.com",202],["synonyms.com",202],["definitions.net",202],["hostmath.com",202],["camvideoshub.com",202],["minhaconexao.com.br",202],["home-made-videos.com",204],["pxrnxx.xyz",204],["amateur-couples.com",204],["slutdump.com",204],["produsat.com",206],["12thman.com",208],["acusports.com",208],["atlantic10.com",208],["auburntigers.com",208],["baylorbears.com",208],["bceagles.com",208],["bgsufalcons.com",208],["big12sports.com",208],["bigten.org",208],["bradleybraves.com",208],["butlersports.com",208],["cmumavericks.com",208],["conferenceusa.com",208],["cyclones.com",208],["dartmouthsports.com",208],["daytonflyers.com",208],["dbupatriots.com",208],["dbusports.com",208],["denverpioneers.com",208],["fduknights.com",208],["fgcuathletics.com",208],["fightinghawks.com",208],["fightingillini.com",208],["floridagators.com",208],["friars.com",208],["friscofighters.com",208],["gamecocksonline.com",208],["goarmywestpoint.com",208],["gobison.com",208],["goblueraiders.com",208],["gobobcats.com",208],["gocards.com",208],["gocreighton.com",208],["godeacs.com",208],["goexplorers.com",208],["goetbutigers.com",208],["gofrogs.com",208],["gogriffs.com",208],["gogriz.com",208],["golobos.com",208],["gomarquette.com",208],["gopack.com",208],["gophersports.com",208],["goprincetontigers.com",208],["gopsusports.com",208],["goracers.com",208],["goshockers.com",208],["goterriers.com",208],["gotigersgo.com",208],["gousfbulls.com",208],["govandals.com",208],["gowyo.com",208],["goxavier.com",208],["gozags.com",208],["gozips.com",208],["griffinathletics.com",208],["guhoyas.com",208],["gwusports.com",208],["hailstate.com",208],["hamptonpirates.com",208],["hawaiiathletics.com",208],["hokiesports.com",208],["huskers.com",208],["icgaels.com",208],["iuhoosiers.com",208],["jsugamecocksports.com",208],["longbeachstate.com",208],["loyolaramblers.com",208],["lrtrojans.com",208],["lsusports.net",208],["morrisvillemustangs.com",208],["msuspartans.com",208],["muleriderathletics.com",208],["mutigers.com",208],["navysports.com",208],["nevadawolfpack.com",208],["niuhuskies.com",208],["nkunorse.com",208],["nuhuskies.com",208],["nusports.com",208],["okstate.com",208],["olemisssports.com",208],["omavs.com",208],["ovcsports.com",208],["owlsports.com",208],["purduesports.com",208],["redstormsports.com",208],["richmondspiders.com",208],["sfajacks.com",208],["shupirates.com",208],["siusalukis.com",208],["smcgaels.com",208],["smumustangs.com",208],["soconsports.com",208],["soonersports.com",208],["themw.com",208],["tulsahurricane.com",208],["txst.com",208],["txstatebobcats.com",208],["ubbulls.com",208],["ucfknights.com",208],["ucirvinesports.com",208],["uconnhuskies.com",208],["uhcougars.com",208],["uicflames.com",208],["umterps.com",208],["uncwsports.com",208],["unipanthers.com",208],["unlvrebels.com",208],["uoflsports.com",208],["usdtoreros.com",208],["utahstateaggies.com",208],["utepathletics.com",208],["utrockets.com",208],["uvmathletics.com",208],["uwbadgers.com",208],["villanova.com",208],["wkusports.com",208],["wmubroncos.com",208],["woffordterriers.com",208],["1pack1goal.com",208],["bcuathletics.com",208],["bubraves.com",208],["goblackbears.com",208],["golightsgo.com",208],["gomcpanthers.com",208],["goutsa.com",208],["mercerbears.com",208],["pirateblue.com",208],["pirateblue.net",208],["pirateblue.org",208],["quinnipiacbobcats.com",208],["towsontigers.com",208],["tribeathletics.com",208],["tribeclub.com",208],["utepminermaniacs.com",208],["utepminers.com",208],["wkutickets.com",208],["aopathletics.org",208],["atlantichockeyonline.com",208],["bigsouthnetwork.com",208],["bigsouthsports.com",208],["chawomenshockey.com",208],["dbupatriots.org",208],["drakerelays.org",208],["ecac.org",208],["ecacsports.com",208],["emueagles.com",208],["emugameday.com",208],["gculopes.com",208],["godrakebulldog.com",208],["godrakebulldogs.com",208],["godrakebulldogs.net",208],["goeags.com",208],["goislander.com",208],["goislanders.com",208],["gojacks.com",208],["gomacsports.com",208],["gseagles.com",208],["hubison.com",208],["iowaconference.com",208],["ksuowls.com",208],["lonestarconference.org",208],["mascac.org",208],["midwestconference.org",208],["mountaineast.org",208],["niu-pack.com",208],["nulakers.ca",208],["oswegolakers.com",208],["ovcdigitalnetwork.com",208],["pacersports.com",208],["rmacsports.org",208],["rollrivers.com",208],["samfordsports.com",208],["uncpbraves.com",208],["usfdons.com",208],["wiacsports.com",208],["alaskananooks.com",208],["broncathleticfund.com",208],["cameronaggies.com",208],["columbiacougars.com",208],["etownbluejays.com",208],["gobadgers.ca",208],["golancers.ca",208],["gometrostate.com",208],["gothunderbirds.ca",208],["kentstatesports.com",208],["lehighsports.com",208],["lopers.com",208],["lycoathletics.com",208],["lycomingathletics.com",208],["maraudersports.com",208],["mauiinvitational.com",208],["msumavericks.com",208],["nauathletics.com",208],["nueagles.com",208],["nwusports.com",208],["oceanbreezenyc.org",208],["patriotathleticfund.com",208],["pittband.com",208],["principiaathletics.com",208],["roadrunnersathletics.com",208],["sidearmsocial.com",208],["snhupenmen.com",208],["stablerarena.com",208],["stoutbluedevils.com",208],["uwlathletics.com",208],["yumacs.com",208],["collegefootballplayoff.com",208],["csurams.com",208],["cubuffs.com",208],["gobearcats.com",208],["gohuskies.com",208],["mgoblue.com",208],["osubeavers.com",208],["pittsburghpanthers.com",208],["rolltide.com",208],["texassports.com",208],["thesundevils.com",208],["uclabruins.com",208],["wvuathletics.com",208],["wvusports.com",208],["arizonawildcats.com",208],["calbears.com",208],["cuse.com",208],["georgiadogs.com",208],["goducks.com",208],["goheels.com",208],["gostanford.com",208],["insidekstatesports.com",208],["insidekstatesports.info",208],["insidekstatesports.net",208],["insidekstatesports.org",208],["k-stateathletics.com",208],["k-statefootball.net",208],["k-statefootball.org",208],["k-statesports.com",208],["k-statesports.net",208],["k-statesports.org",208],["k-statewomenshoops.com",208],["k-statewomenshoops.net",208],["k-statewomenshoops.org",208],["kstateathletics.com",208],["kstatefootball.net",208],["kstatefootball.org",208],["kstatesports.com",208],["kstatewomenshoops.com",208],["kstatewomenshoops.net",208],["kstatewomenshoops.org",208],["ksuathletics.com",208],["ksusports.com",208],["scarletknights.com",208],["showdownforrelief.com",208],["syracusecrunch.com",208],["texastech.com",208],["theacc.com",208],["ukathletics.com",208],["usctrojans.com",208],["utahutes.com",208],["utsports.com",208],["wsucougars.com",208],["tricksplit.io",208],["fangraphs.com",209],["4players.de",[210,328]],["buffed.de",210],["gamesaktuell.de",210],["gamezone.de",210],["pcgames.de",210],["videogameszone.de",210],["tvspielfilm.de",[211,212,213,214]],["tvtoday.de",[211,212,213,214]],["chip.de",[211,212,213,214]],["focus.de",[211,212,213,214]],["planetaminecraft.com",215],["cravesandflames.com",216],["codesnse.com",216],["link.paid4file.com",216],["flyad.vip",216],["lapresse.ca",217],["kolyoom.com",218],["ilovephd.com",218],["negumo.com",219],["games.wkb.jp",[220,221]],["channelmyanmar.org",[222,223]],["u-s-news.com",223],["fandom.com",[224,555,556]],["kenshi.fandom.com",225],["hausbau-forum.de",226],["homeairquality.org",226],["faucettronn.click",226],["ticketmaster.sg",226],["fake-it.ws",227],["laksa19.github.io",228],["1shortlink.com",229],["nesia.my.id",230],["makemoneywithurl.com",231],["junkyponk.com",231],["healthfirstweb.com",231],["vocalley.com",231],["yogablogfit.com",231],["en.financerites.com",231],["mythvista.com",231],["livenewsflix.com",231],["cureclues.com",231],["apekite.com",231],["insmyst.com",231],["wp2host.com",231],["blogtechh.com",231],["techbixby.com",231],["blogmyst.com",231],["resetoff.pl",232],["sexodi.com",232],["cdn77.org",233],["howtofixwindows.com",234],["3sexporn.com",235],["momxxxsex.com",235],["myfreevintageporn.com",235],["penisbuyutucum.net",235],["ujszo.com",236],["newsmax.com",237],["bobs-tube.com",238],["nadidetarifler.com",239],["siz.tv",239],["suzylu.co.uk",[240,241]],["onworks.net",242],["yabiladi.com",242],["downloadsoft.net",243],["pixsera.net",244],["testlanguages.com",245],["newsinlevels.com",245],["videosinlevels.com",245],["cbs.com",246],["paramountplus.com",246],["buktube.com",247],["fullxh.com",247],["galleryxh.site",247],["megaxh.com",247],["movingxh.world",247],["seexh.com",247],["taoxh.life",247],["unlockxh4.com",247],["xhaccess.com",247],["xhadult2.com",247],["xhadult3.com",247],["xhadult4.com",247],["xhadult5.com",247],["xhamster46.com",247],["xhbig.com",247],["xhbranch5.com",247],["xhday.com",247],["xhday1.com",247],["xhmoon5.com",247],["xhplanet1.com",247],["xhplanet2.com",247],["xhreal2.com",247],["xhreal3.com",247],["xhtab2.com",247],["xhtab4.com",247],["xhtree.com",247],["xhvictory.com",247],["xhwebsite.com",247],["xhwebsite2.com",247],["xhwide1.com",247],["lightnovelworld.com",248],["megadescarga.net",[249,250,251,252]],["megadescargas.net",[249,250,251,252]],["hentaihaven.xxx",253],["ultimate-guitar.com",254],["teachmemicro.com",255],["willcycle.com",255],["2ndrun.tv",255],["rackusreads.com",255],["xyzsports111.xyz",[256,257,258]],["xyzsports112.xyz",[256,257,258]],["xyzsports113.xyz",[256,257,258]],["xyzsports114.xyz",[256,257,258]],["xyzsprtsfrmr1.site",[256,257,258]],["xyzsprtsfrmr2.site",[256,257,258]],["claimbits.net",259],["sexyscope.net",260],["recherche-ebook.fr",262],["easymc.io",262],["zonebourse.com",263],["pink-sluts.net",264],["madoohd.com",265],["andhrafriends.com",266],["benzinpreis.de",267],["defenseone.com",268],["govexec.com",268],["nextgov.com",268],["route-fifty.com",268],["sharing.wtf",269],["th.gl",[270,271]],["wetter3.de",272],["arahdrive.com",273],["aiimgvlog.fun",[273,284]],["esportivos.fun",274],["cosmonova-broadcast.tv",275],["soccerinhd.com",276],["techedubyte.com",276],["hartvannederland.nl",277],["vandaaginside.nl",277],["rock.porn",[278,279]],["videzz.net",[280,281]],["ezaudiobookforsoul.com",282],["club386.com",283],["starkroboticsfrc.com",284],["sinonimos.de",284],["antonimos.de",284],["quesignifi.ca",284],["tiktokrealtime.com",284],["tiktokcounter.net",284],["tpayr.xyz",284],["poqzn.xyz",284],["ashrfd.xyz",284],["rezsx.xyz",284],["tryzt.xyz",284],["ashrff.xyz",284],["rezst.xyz",284],["dawenet.com",284],["erzar.xyz",284],["waezm.xyz",284],["waezg.xyz",284],["blackwoodacademy.org",284],["cryptednews.space",284],["vivuq.com",284],["swgop.com",284],["vbnmll.com",284],["telcoinfo.online",284],["dshytb.com",284],["btcbitco.in",[284,287]],["btcsatoshi.net",284],["cempakajaya.com",284],["crypto4yu.com",284],["readbitcoin.org",284],["wiour.com",284],["finish.addurl.biz",284],["laweducationinfo.com",284],["savemoneyinfo.com",284],["worldaffairinfo.com",284],["godstoryinfo.com",284],["successstoryinfo.com",284],["learnmarketinfo.com",284],["bhugolinfo.com",284],["armypowerinfo.com",284],["rsadnetworkinfo.com",284],["rsinsuranceinfo.com",284],["rsfinanceinfo.com",284],["rsgamer.app",284],["rssoftwareinfo.com",284],["rshostinginfo.com",284],["rseducationinfo.com",284],["advertisingexcel.com",284],["allcryptoz.net",284],["batmanfactor.com",284],["beautifulfashionnailart.com",284],["crewbase.net",284],["documentaryplanet.xyz",284],["crewus.net",284],["gametechreviewer.com",284],["midebalonu.net",284],["misterio.ro",284],["phineypet.com",284],["seory.xyz",284],["shinbhu.net",284],["shinchu.net",284],["substitutefor.com",284],["talkforfitness.com",284],["thefitbrit.co.uk",284],["thumb8.net",284],["thumb9.net",284],["topcryptoz.net",284],["uniqueten.net",284],["ultraten.net",284],["exactpay.online",284],["kiddyearner.com",284],["luckydice.net",285],["adarima.org",285],["tieutietkiem.com",285],["weatherwx.com",285],["sattaguess.com",285],["winshell.de",285],["rosasidan.ws",285],["modmakers.xyz",285],["gamepure.in",285],["warrenrahul.in",285],["austiblox.net",285],["upiapi.in",285],["myownguess.in",285],["networkhint.com",285],["watchhentai.net",285],["thichcode.net",285],["texturecan.com",285],["tikmate.app",[285,510]],["4funbox.com",286],["nephobox.com",286],["1024tera.com",286],["blog.cryptowidgets.net",287],["blog.insurancegold.in",287],["blog.wiki-topia.com",287],["blog.coinsvalue.net",287],["blog.cookinguide.net",287],["blog.freeoseocheck.com",287],["blog24.me",287],["bildirim.link",289],["appsbull.com",290],["diudemy.com",290],["maqal360.com",290],["lifesurance.info",291],["infokeeda.xyz",292],["webzeni.com",292],["dl.apkmoddone.com",293],["arcai.com",295],["my-code4you.blogspot.com",296],["flickr.com",297],["firefile.cc",298],["pestleanalysis.com",298],["kochamjp.pl",298],["tutorialforlinux.com",298],["whatsaero.com",298],["animeblkom.net",[298,314]],["blkom.com",298],["globes.co.il",[299,300]],["jardiner-malin.fr",301],["tw-calc.net",302],["ohmybrush.com",303],["talkceltic.net",304],["mentalfloss.com",305],["uprafa.com",306],["cube365.net",307],["nightfallnews.com",[308,309]],["wwwfotografgotlin.blogspot.com",310],["freelistenonline.com",310],["badassdownloader.com",311],["quickporn.net",312],["yellowbridge.com",313],["aosmark.com",315],["atozmath.com",[317,318,319,320,321,322,323]],["newyorker.com",324],["brighteon.com",325],["more.tv",326],["video1tube.com",327],["alohatube.xyz",327],["fshost.me",329],["link.cgtips.org",330],["hentaicloud.com",331],["netfapx.com",333],["paperzonevn.com",334],["hentaienglish.com",335],["hentaiporno.xxx",335],["venge.io",[336,337]],["btcbux.io",338],["its.porn",[339,340]],["atv.at",341],["kusonime.com",[342,343]],["jetpunk.com",345],["imgur.com",346],["hentai-party.com",347],["hentaicomics.pro",347],["xxx-comics.pro",347],["genshinimpactcalculator.com",350],["mysexgames.com",351],["embed.indavideo.hu",354],["coinurl.net",[355,356]],["gdr-online.com",357],["mmm.dk",358],["iqiyi.com",[359,360,502]],["m.iqiyi.com",361],["japopav.tv",362],["lvturbo.com",362],["nbcolympics.com",363],["apkhex.com",364],["indiansexstories2.net",365],["issstories.xyz",365],["1340kbbr.com",366],["gorgeradio.com",366],["kduk.com",366],["kedoam.com",366],["kejoam.com",366],["kelaam.com",366],["khsn1230.com",366],["kjmx.rocks",366],["kloo.com",366],["klooam.com",366],["klykradio.com",366],["kmed.com",366],["kmnt.com",366],["kool991.com",366],["kpnw.com",366],["kppk983.com",366],["krktcountry.com",366],["ktee.com",366],["kwro.com",366],["kxbxfm.com",366],["thevalley.fm",366],["quizlet.com",367],["dsocker1234.blogspot.com",368],["blick.ch",369],["mgnet.xyz",370],["designtagebuch.de",371],["pixroute.com",372],["uploady.io",373],["calculator-online.net",374],["porngames.club",375],["sexgames.xxx",375],["111.90.159.132",376],["battleplan.news",376],["mobile-tracker-free.com",377],["pfps.gg",378],["ac-illust.com",[379,380]],["photo-ac.com",[379,380]],["vlxxs.net",381],["rapelust.com",381],["vtube.to",381],["vtplay.net",381],["desitelugusex.com",381],["xvideos-downloader.net",381],["xxxvideotube.net",381],["sdefx.cloud",381],["nozomi.la",381],["moviesonlinefree.net",381],["social-unlock.com",382],["ninja.io",383],["sourceforge.net",384],["samfirms.com",385],["banned.video",386],["madmaxworld.tv",386],["huffpost.com",387],["ingles.com",388],["spanishdict.com",388],["surfline.com",[389,390]],["play.tv3.ee",391],["play.tv3.lt",391],["play.tv3.lv",391],["tv3play.skaties.lv",391],["trendyoum.com",392],["bulbagarden.net",393],["moviestars.to",394],["hollywoodlife.com",395],["mat6tube.com",396],["textstudio.co",397],["newtumbl.com",398],["nevcoins.club",400],["mail.com",401],["oggi.it",[404,405]],["manoramamax.com",404],["video.gazzetta.it",[404,405]],["mangakita.id",406],["mangakita.net",406],["poscishd.online",407],["avpgalaxy.net",408],["mhma12.tech",409],["panda-novel.com",410],["zebranovel.com",410],["lightsnovel.com",410],["eaglesnovel.com",410],["pandasnovel.com",410],["zadfaucet.com",411],["ewrc-results.com",412],["kizi.com",413],["cyberscoop.com",414],["fedscoop.com",414],["canale.live",415],["mafiatown.pl",[416,417]],["jeep-cj.com",418],["sponsorhunter.com",419],["cloudcomputingtopics.net",420],["likecs.com",421],["tiscali.it",422],["linkspy.cc",423],["tutelehd3.xyz",424],["dirty.pink",[425,426,427]],["adshnk.com",428],["chattanoogan.com",429],["adsy.pw",430],["playstore.pw",430],["socialmediagirls.com",431],["windowspro.de",432],["snapinsta.app",433],["tvtv.ca",434],["tvtv.us",434],["mydaddy.cc",435],["roadtrippin.fr",436],["redketchup.io",[437,438,439]],["anyporn.com",[440,456]],["bravoporn.com",440],["bravoteens.com",440],["crocotube.com",440],["hellmoms.com",440],["hellporno.com",440],["sex3.com",440],["tubewolf.com",440],["xbabe.com",440],["xcum.com",440],["zedporn.com",440],["imagetotext.info",441],["infokik.com",442],["freepik.com",443],["ddwloclawek.pl",[444,445]],["deezer.com",446],["my-subs.co",447],["plaion.com",448],["rapid-cloud.co",449],["slideshare.net",[450,451]],["ustreasuryyieldcurve.com",452],["businesssoftwarehere.com",453],["goo.st",453],["freevpshere.com",453],["softwaresolutionshere.com",453],["staige.tv",457],["in-jpn.com",458],["oninet.ne.jp",458],["xth.jp",458],["androidadult.com",459],["streamvid.net",460],["watchtv24.com",461],["cellmapper.net",462],["medscape.com",463],["newscon.org",[464,465]],["arkadium.com",466],["wheelofgold.com",467],["ozulmanga.com",467],["bembed.net",468],["elbailedeltroleo.site",468],["embedv.net",468],["fslinks.org",468],["listeamed.net",468],["v6embed.xyz",468],["vgplayer.xyz",468],["vid-guard.com",468],["app.blubank.com",469],["mobileweb.bankmellat.ir",469],["sportdeutschland.tv",470],["kcra.com",470],["wcvb.com",470],["ccthesims.com",475],["chromeready.com",475],["coursedrive.org",475],["dtbps3games.com",475],["illustratemagazine.com",475],["uknip.co.uk",475],["vod.pl",476],["megadrive-emulator.com",477],["animesaga.in",480],["moviesapi.club",480],["bestx.stream",480],["watchx.top",480],["digimanie.cz",481],["svethardware.cz",481],["srvy.ninja",482],["drawer-opportunity-i-243.site",483],["tchatche.com",484],["edmdls.com",485],["freshremix.net",485],["scenedl.org",485],["trakt.tv",[486,487,488]],["shroomers.app",489],["classicalradio.com",[490,491,492]],["di.fm",[490,491,492]],["jazzradio.com",[490,491,492]],["radiotunes.com",[490,491,492]],["rockradio.com",[490,491,492]],["zenradio.com",[490,491,492]],["pc-builds.com",493],["qtoptens.com",493],["reuters.com",493],["today.com",493],["videogamer.com",493],["wrestlinginc.com",493],["gbatemp.net",493],["movie-th.tv",494],["iwanttfc.com",495],["nutraingredients-asia.com",496],["nutraingredients-latam.com",496],["nutraingredients-usa.com",496],["nutraingredients.com",496],["livesportsclub.me",497],["rogstream.fun",497],["ozulscansen.com",498],["fitnessbr.click",499],["minhareceita.xyz",499],["doomied.monster",500],["lookmovie2.to",500],["royalroad.com",501],["biletomat.pl",503],["hextank.io",[504,505]],["filmizlehdfilm.com",[506,507,508,509]],["fullfilmizle.cc",[506,507,508,509]],["sagewater.com",511],["redlion.net",511],["satdl.com",512],["vidstreaming.xyz",513],["everand.com",514],["myradioonline.pl",515],["tacobell.com",517],["zefoy.com",518],["natgeotv.com",520],["br.de",521],["indeed.com",522],["pasteboard.co",523],["clickhole.com",524],["deadspin.com",524],["gizmodo.com",524],["jalopnik.com",524],["jezebel.com",524],["kotaku.com",524],["lifehacker.com",524],["splinternews.com",524],["theinventory.com",524],["theonion.com",524],["theroot.com",524],["thetakeout.com",524],["pewresearch.org",524],["los40.com",[525,526]],["as.com",526],["telegraph.co.uk",[527,528]],["poweredbycovermore.com",[527,578]],["lumens.com",[527,578]],["verizon.com",529],["humanbenchmark.com",530],["politico.com",531],["officedepot.co.cr",[532,533]],["usnews.com",536],["factable.com",538],["zee5.com",539],["gala.fr",540],["geo.fr",540],["voici.fr",540],["gloucestershirelive.co.uk",541],["arsiv.mackolik.com",542],["jacksonguitars.com",543],["scandichotels.com",544],["stylist.co.uk",545],["nettiauto.com",546],["thaiairways.com",[547,548]],["cerbahealthcare.it",[549,550]],["futura-sciences.com",[549,567]],["tiendaenlinea.claro.com.ni",[551,552]],["tieba.baidu.com",553],["linktr.ee",554],["grasshopper.com",[557,558]],["epson.com.cn",[559,560,561,562]],["oe24.at",[563,564]],["szbz.de",563],["platform.autods.com",[565,566]],["wikihow.com",568],["citibank.com.sg",569],["uol.com.br",[570,571,572,573,574]],["gazzetta.gr",575],["digicol.dpm.org.cn",[576,577]],["virginmediatelevision.ie",579],["larazon.es",[580,581]],["waitrosecellar.com",[582,583,584]],["sharpen-free-design-generator.netlify.app",[586,587]],["help.cashctrl.com",[588,589]],["commande.rhinov.pro",[590,591]],["ecom.wixapps.net",[590,591]],["tipranks.com",[592,593]],["iceland.co.uk",[594,595,596]],["socket.pearsoned.com",597],["tntdrama.com",[598,599]],["mobile.de",[600,601]],["ioe.vn",[602,603]],["geiriadur.ac.uk",[602,606]],["welsh-dictionary.ac.uk",[602,606]],["bikeportland.org",[604,605]],["biologianet.com",[571,572,573]],["10play.com.au",[607,608]],["sunshine-live.de",[609,610]],["whatismyip.com",[611,612]],["myfitnesspal.com",613],["netoff.co.jp",[614,615]],["clickjogos.com.br",618],["bristan.com",[619,620]],["zillow.com",621],["share.hntv.tv",[622,623,624,625]],["optimum.net",[626,627]],["pvrcinemas.com",[628,629]],["investor-web.hdfcfund.com",630],["user.guancha.cn",[631,632]],["sosovalue.com",633],["bandyforbundet.no",[634,635]],["tatacommunications.com",636],["weather.com",[637,638]],["ubereats.com",[637,638]],["usatoday.com",639]]);

const entitiesMap = new Map([["watch-series",9],["watchseries",9],["vev",9],["vidop",9],["vidup",9],["starmusiq",12],["wcofun",12],["kissasian",14],["gogoanime",[14,51]],["1movies",[14,17]],["xmovies8",14],["animeheaven",14],["0123movies",14],["gostream",14],["gomovies",14],["primewire",15],["streanplay",[15,16]],["sbplay",15],["milfnut",15],["sxyprn",20],["hqq",[21,22]],["waaw",[22,23]],["younetu",22],["vvtplayer",22],["123link",24],["adshort",24],["linkshorts",24],["adsrt",24],["vinaurl",24],["adfloz",24],["dutchycorp",24],["shortearn",24],["pingit",24],["shrink",24],["tmearn",24],["megalink",24],["miniurl",24],["gplinks",24],["clk",24],["pureshort",24],["shrinke",24],["shrinkme",24],["pcprogramasymas",24],["link1s",24],["shortzzy",24],["shorttey",[24,202]],["lite-link",24],["adcorto",24],["zshort",24],["upfiles",24],["linkfly",24],["wplink",24],["seulink",24],["encurtalink",24],["camwhores",[25,38,85,86,87]],["tube8",[26,27]],["youporn",27],["redtube",27],["pornhub",[27,188]],["upornia",[29,30]],["fmovies",51],["xtits",[55,120]],["streamwish",[57,58]],["pouvideo",64],["povvideo",64],["povw1deo",64],["povwideo",64],["powv1deo",64],["powvibeo",64],["powvideo",64],["powvldeo",64],["plyjam",[69,70]],["fxporn69",75],["vipbox",76],["viprow",76],["desbloqueador",81],["xberuang",83],["teknorizen",83],["subtorrents",90],["subtorrents1",90],["newpelis",90],["pelix",90],["allcalidad",90],["infomaniakos",90],["filecrypt",94],["tornadomovies",100],["sexwebvideo",101],["mangovideo",101],["icdrama",107],["mangasail",107],["file4go",109],["asianclub",128],["anitube",131],["mixdrop",133],["uploadev",157],["ver-pelis-online",166],["ancient-origins",175],["spankbang",195],["lookcam",202],["lootlinks",202],["dpstream",205],["bluemediafiles",207],["docer",232],["hamsterix",247],["xhamster",247],["xhamster1",247],["xhamster10",247],["xhamster11",247],["xhamster12",247],["xhamster13",247],["xhamster14",247],["xhamster15",247],["xhamster16",247],["xhamster17",247],["xhamster18",247],["xhamster19",247],["xhamster20",247],["xhamster2",247],["xhamster3",247],["xhamster4",247],["xhamster42",247],["xhamster5",247],["xhamster7",247],["xhamster8",247],["acortalo",[249,250,251,252]],["acortar",[249,250,251,252]],["kickassanime",261],["doomovie-hd",265],["terabox",286],["ctrlv",316],["123movieshd",344],["uproxy",348],["animesa",349],["cinecalidad",[352,353]],["dvdplay",381],["apkmaven",399],["gmx",402],["gamereactor",455],["vembed",468],["empire-stream",[471,472,473]],["empire-streaming",[471,472,473]],["empire-streamz",[471,472,473]],["tvhay",[478,479]],["lookmovie",500],["filmizletv",[506,507,508,509]],["www.google",516],["officedepot",[534,535]],["foundit",[616,617]]]);

const exceptionsMap = new Map([["pingit.com",[24]],["pingit.me",[24]],["lookmovie.studio",[500]]]);

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantFn(false, ...args);
}

function setConstantFn(
    trusted = false,
    chain = '',
    rawValue = ''
) {
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-constant', chain, rawValue);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    function setConstant(chain, rawValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            return new Proxy(fn, {
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
        };
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        let normalValue = validateConstantFn(trusted, rawValue, extraArgs);
        if ( rawValue === 'noopFunc' || rawValue === 'trueFunc' || rawValue === 'falseFunc' ) {
            normalValue = cloakFunc(normalValue);
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (normalValue !== undefined && normalValue !== null) &&
                (typeof v !== typeof normalValue);
            if ( aborted ) {
                safe.uboLog(logPrefix, `Aborted because value set to ${v}`);
            }
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : normalValue) === false ) { return; }
            const odesc = safe.Object_getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof safe.Object ) {
                owner[prop] = normalValue;
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
                        return handler.getter();
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
                safe.uboLog(logPrefix, 'Trap installed');
            } catch(ex) {
                safe.uboErr(logPrefix, ex);
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
                        if ( document.currentScript === thisScript ) {
                            return this.v;
                        }
                        safe.uboLog(logPrefix, 'Property read');
                        return normalValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        normalValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof safe.Object || typeof v === 'object' && v !== null ) {
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
                    if ( a instanceof safe.Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, rawValue);
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
                return { matchAll: true };
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
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
    let bcBuffer = [];
    safe.logLevel = scriptletGlobals.logLevel || 1;
    safe.sendToLogger = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
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
    return safe;
}

function validateConstantFn(trusted, raw, extraArgs = {}) {
    const safe = safeSelf();
    let value;
    if ( raw === 'undefined' ) {
        value = undefined;
    } else if ( raw === 'false' ) {
        value = false;
    } else if ( raw === 'true' ) {
        value = true;
    } else if ( raw === 'null' ) {
        value = null;
    } else if ( raw === "''" || raw === '' ) {
        value = '';
    } else if ( raw === '[]' || raw === 'emptyArr' ) {
        value = [];
    } else if ( raw === '{}' || raw === 'emptyObj' ) {
        value = {};
    } else if ( raw === 'noopFunc' ) {
        value = function(){};
    } else if ( raw === 'trueFunc' ) {
        value = function(){ return true; };
    } else if ( raw === 'falseFunc' ) {
        value = function(){ return false; };
    } else if ( /^-?\d+$/.test(raw) ) {
        value = parseInt(raw);
        if ( isNaN(raw) ) { return; }
        if ( Math.abs(raw) > 0x7FFF ) { return; }
    } else if ( trusted ) {
        if ( raw.startsWith('{') && raw.endsWith('}') ) {
            try { value = safe.JSON_parse(raw).value; } catch(ex) { return; }
        }
    } else {
        return;
    }
    if ( extraArgs.as !== undefined ) {
        if ( extraArgs.as === 'function' ) {
            return ( ) => value;
        } else if ( extraArgs.as === 'callback' ) {
            return ( ) => (( ) => value);
        } else if ( extraArgs.as === 'resolved' ) {
            return Promise.resolve(value);
        } else if ( extraArgs.as === 'rejected' ) {
            return Promise.reject(value);
        }
    }
    return value;
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

const targetWorld = 'MAIN';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
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
