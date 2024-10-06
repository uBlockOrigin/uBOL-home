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
/* global cloneInto */

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setConstant = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["oeo","noopFunc"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["console.clear","trueFunc"],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["console.clear","noopFunc"],["console.log","noopFunc"],["String.prototype.charCodeAt","trueFunc"],["attachEvent","trueFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["flashvars.adv_pause_html",""],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["Object.prototype.adReinsertion","noopFunc"],["Object.prototype.disableAds","true"],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["adBlock","false"],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["spoof","noopFunc"],["adBlockerDetected","undefined"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["Object.prototype.run","undefined"],["isAdblock","false"],["CaptchmeState.adb","undefined"],["bb","false"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["dvsize","51"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["testerli","false"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["show_ads_gr8_lite","true"],["doads","true"],["jsUnda","noopFunc"],["abp","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["getHomadConfig","noopFunc"],["adsbygoogle.loaded","true"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["cRAds","true"],["app.addonIsInstalled","trueFunc"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["CustomEvent","noopFunc"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["ulp_noadb","true"],["timeSec","0"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["hasAdBlocker","false"],["document.ontouchend","null"],["document.onclick","null"],["initials.yld-pdpopunder",""],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["DHAntiAdBlocker","true"],["adsConfigs","{}"],["adsConfigs.0","{}"],["adsConfigs.0.enabled","0"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["adSettings","[]"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["protection","noopFunc"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["checkAdsStatus","noopFunc"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["Object.prototype.ads.nopreroll_","true"],["checkAdBlocker","noopFunc"],["adBlockerDetected","false"],["univresalP","noopFunc"],["EASYFUN_ADS_CAN_RUN","true"],["navigator.brave","undefined"],["adsbygoogle_ama_fc_has_run","true"],["document.hasFocus","trueFunc"],["detectAdBlock","noopFunc"],["document.hidden","false"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["private","false"],["Math.random","1","as","function"],["showadas","true"],["iktimer","0"],["aSl.gcd","0"],["delayClick","false"],["counter","10"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["showada","true"],["showax","true"],["p18","undefined"],["asc","2"],["google_tag_manager","{}"],["ADBLOCKED","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["adsHeight","11"],["checkCap","0"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["isadb","false"],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["D4zz","noopFunc"],["ad_link",""],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["count","1"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["stop","noopFunc"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["objAd.loadAdShield","noopFunc"],["aLoad","noopFunc"],["mtCanRunAdsSoItCanStillBeOnTheWeb","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["Overlayer","{}"],["pop3getcookie","undefined"],["pop3setcookie1","undefined"],["pop3setCookie2","undefined"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["Object.prototype.adBlockerDetected","falseFunc"],["Object.prototype.adBlocker","false"],["Object.prototype.tomatoDetected","falseFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["window.runningAdsAllowed","true"],["tOS1","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["playerConfigs.rek","{}"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["admiral","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["confirm","noopFunc"],["checkAdBlockeraz","noopFunc"],["segundos","0"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["flashvars.event_reporting",""],["Visitor","{}"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["yt.config_.EXPERIMENT_FLAGS.web_bind_fetch","false"],["fapit.check","noopFunc"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];

const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3,659]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["kicker.de",[4,597]],["t-online.de",5],["whatfinger.com",6],["timesofindia.indiatimes.com",7],["economictimes.indiatimes.com",8],["userscloud.com",9],["motherless.com",10],["sueddeutsche.de",11],["watchanimesub.net",12],["wco.tv",12],["wcoanimesub.tv",12],["wcoforever.net",12],["freeviewmovies.com",12],["filehorse.com",12],["guidetnt.com",12],["sp-today.com",12],["linkvertise.com",12],["textbin.net",12],["eropaste.net",12],["pastebr.xyz",12],["getpaste.link",12],["sharetext.me",12],["note.sieuthuthuat.com",12],["elcriticodelatele.com",[12,257]],["gadgets.es",[12,257]],["amateurporn.co",[12,116]],["wiwo.de",13],["masteranime.tv",14],["alphaporno.com",[15,454]],["porngem.com",15],["uploadbank.com",[15,89]],["shortit.pw",[15,100]],["familyporn.tv",15],["cloudemb.com",[15,372]],["sbplay1.com",15],["id45.cyou",15],["85tube.com",[15,81]],["k1nk.co",15],["watchasians.cc",15],["soltoshindo.com",15],["dronedj.com",17],["nolive.me",18],["sankakucomplex.com",19],["player.glomex.com",20],["merkur.de",20],["tz.de",20],["hotpornfile.org",23],["player.tabooporns.com",23],["x69.ovh",23],["wiztube.xyz",23],["netu.frembed.fun",23],["multiup.us",23],["rpdrlatino.live",23],["peliculas8k.com",[23,24]],["video.q34r.org",23],["69x.online",23],["czxxx.org",23],["vtplayer.online",23],["netu.ac",23],["dirtyvideo.fun",24],["adbull.org",25],["mitly.us",25],["linkrex.net",25],["linx.cc",25],["oke.io",25],["dz4link.com",25],["linclik.com",25],["shrt10.com",25],["loptelink.com",25],["cut-fly.com",25],["linkfinal.com",25],["payskip.org",25],["cutpaid.com",25],["forexmab.com",25],["linkjust.com",25],["linkszia.co",25],["leechpremium.link",25],["icutlink.com",[25,121]],["oncehelp.com",25],["rgl.vn",25],["reqlinks.net",25],["bitlk.com",25],["qlinks.eu",25],["link.3dmili.com",25],["short-fly.com",25],["foxseotools.com",25],["pngit.live",25],["link.turkdown.com",25],["urlty.com",25],["7r6.com",25],["oko.sh",25],["ckk.ai",25],["fc.lc",25],["fstore.biz",25],["cuts-url.com",25],["eio.io",25],["exe.app",25],["exee.io",25],["exey.io",25],["skincarie.com",25],["exeo.app",25],["coinlyhub.com",[25,199]],["adsafelink.com",25],["aii.sh",25],["cybertechng.com",[25,212]],["owllink.net",25],["cutdl.xyz",25],["iir.ai",25],["shorteet.com",[25,230]],["sekilastekno.com",25],["smoner.com",25],["gyanlight.com",25],["xpshort.com",25],["upshrink.com",25],["enit.in",[25,226]],["ez4short.com",25],["easysky.in",25],["veganab.co",25],["adrinolinks.in",25],["go.bloggingaro.com",25],["go.gyanitheme.com",25],["go.theforyou.in",25],["go.hipsonyc.com",25],["birdurls.com",25],["vipurl.in",25],["try2link.com",25],["jameeltips.us",25],["gainl.ink",25],["promo-visits.site",25],["satoshi-win.xyz",[25,297]],["shorterall.com",25],["encurtandourl.com",25],["forextrader.site",25],["postazap.com",25],["cety.app",25],["exego.app",[25,292]],["cutlink.net",25],["cutsy.net",25],["cutyurls.com",25],["cutty.app",25],["cutnet.net",25],["tinys.click",[25,212]],["cpm.icu",25],["panyshort.link",25],["enagato.com",25],["pandaznetwork.com",25],["tvi.la",25],["iir.la",25],["tii.la",25],["oei.la",25],["lnbz.la",[25,226]],["oii.la",25],["tpi.li",25],["recipestutorials.com",25],["shrinkforearn.in",25],["techyuth.xyz",25],["oii.io",25],["du-link.in",25],["atglinks.com",25],["thotpacks.xyz",25],["megaurl.in",25],["megafly.in",25],["simana.online",25],["fooak.com",25],["joktop.com",25],["evernia.site",25],["link.paid4link.com",[25,305]],["exalink.fun",25],["indiamaja.com",25],["newshuta.in",25],["shortxlinks.com",25],["linksly.co",25],["pkr.pw",25],["imagenesderopaparaperros.com",25],["shortenbuddy.com",25],["gibit.xyz",25],["apksvip.com",25],["4cash.me",25],["namaidani.com",25],["teknomuda.com",25],["illink.net",25],["miuiku.com",25],["yourtechnology.online",25],["savelink.site",25],["apkshrt.com",25],["srts.me",25],["kutmoney.com",25],["kutt.io",25],["sanoybonito.club",25],["samaa-pro.com",25],["miklpro.com",25],["modapk.link",25],["1shorten.com",25],["ccurl.net",25],["st23q.com",25],["beautyram.info",25],["viraloc.com",25],["galaxy-link.space",25],["linkpoi.me",25],["usdshort.com",25],["bitcoinly.in",25],["menjelajahi.com",25],["pewgame.com",25],["yxoshort.com",25],["1link.vip",25],["haonguyen.top",25],["claimfreebits.com",25],["crazyblog.in",25],["gtlink.co",25],["link.tokenoto.com",25],["cutearn.net",25],["rshrt.com",25],["short.palmeratv.com",25],["filezipa.com",25],["dz-linkk.com",25],["theblissempire.com",25],["finanzas-vida.com",25],["adurly.cc",25],["pix4link.com",25],["paid4.link",25],["link.asiaon.top",25],["go.gets4link.com",25],["download.sharenulled.net",25],["beingtek.com",25],["shorturl.unityassets4free.com",25],["disheye.com",25],["techymedies.com",25],["techysuccess.com",25],["za.gl",[25,139]],["download.baominh.tech",25],["bblink.com",25],["linkbr.xyz",25],["myad.biz",25],["swzz.xyz",25],["vevioz.com",25],["charexempire.com",25],["clk.asia",25],["egfly.xyz",25],["linka.click",25],["sturls.com",25],["myshrinker.com",25],["go.adinsurance.xyz",25],["dash-free.com",[25,212]],["snowurl.com",[25,212]],["netfile.cc",25],["link.insurglobal.xyz",25],["theconomy.me",25],["rocklink.in",25],["adinsurance.xyz",25],["insurglobal.xyz",25],["techgeek.digital",25],["download3s.net",25],["shortx.net",25],["musicc.xyz",25],["shortawy.com",25],["tlin.me",25],["apprepack.com",25],["up-load.one",25],["zuba.link",25],["news.speedynews.xyz",25],["golink.xaydungplus.com",25],["bestcash2020.com",25],["hoxiin.com",25],["technemo.xyz",25],["go.linkbnao.com",25],["link-yz.com",25],["paylinnk.com",25],["thizissam.in",25],["ier.ai",25],["bloggertheme.xyz",25],["adslink.pw",25],["novelssites.com",25],["links.medipost.org",25],["faucetcrypto.net",25],["short.freeltc.top",25],["trxking.xyz",25],["weadown.com",25],["m.bloggingguidance.com",25],["blog.onroid.com",25],["link.codevn.net",25],["upfilesurls.com",25],["shareus.site",25],["link4rev.site",25],["bloginguru.xyz",25],["celinks.net",25],["c2g.at",25],["shortzu.icu",25],["bitcosite.com",[25,467]],["cryptosh.pro",25],["sigmalinks.in",25],["link68.net",25],["traffic123.net",25],["windowslite.net",[25,212]],["coinsl.click",25],["viewfr.com",25],["cl1ca.com",25],["4br.me",25],["fir3.net",25],["kiddyshort.com",25],["watchmygf.me",[26,51]],["camwhorez.tv",[26,37,80,81]],["cambay.tv",[26,53,80,113,115,116,117,118]],["fpo.xxx",[26,53]],["sexemix.com",26],["heavyfetish.com",[26,532]],["you-porn.com",28],["youporngay.com",28],["youpornru.com",28],["9908ww.com",28],["adelaidepawnbroker.com",28],["bztube.com",28],["hotovs.com",28],["insuredhome.org",28],["nudegista.com",28],["pornluck.com",28],["vidd.se",28],["pornhub.com",28],["pornerbros.com",29],["freep.com",29],["porn.com",32],["tune.pk",33],["noticias.gospelmais.com.br",34],["techperiod.com",34],["viki.com",[35,36]],["sleazyneasy.com",[37,38,39]],["smutr.com",[37,195]],["watchdirty.to",[37,81,82,116]],["yourporngod.com",[37,38]],["javbangers.com",[37,342]],["camfox.com",37],["camthots.tv",[37,113]],["shegotass.info",37],["amateur8.com",37],["bigtitslust.com",37],["ebony8.com",37],["freeporn8.com",37],["lesbian8.com",37],["maturetubehere.com",37],["sortporn.com",37],["webcamvau.com",37],["motherporno.com",[37,38,53,115]],["tktube.com",37],["theporngod.com",[37,38]],["pornsocket.com",40],["luxuretv.com",41],["porndig.com",[42,43]],["webcheats.com.br",44],["ceesty.com",[45,46]],["gestyy.com",[45,46]],["corneey.com",46],["destyy.com",46],["festyy.com",46],["sh.st",46],["mitaku.net",46],["angrybirdsnest.com",47],["zrozz.com",47],["clix4btc.com",47],["4tests.com",47],["planet-explorers-isos.com",47],["business-standard.com",47],["goltelevision.com",47],["news-und-nachrichten.de",47],["laradiobbs.net",47],["urlaubspartner.net",47],["produktion.de",47],["cinemaxxl.de",47],["bladesalvador.com",47],["tempr.email",47],["katfile.com",47],["trust.zone",47],["cshort.org",47],["friendproject.net",47],["covrhub.com",47],["planetsuzy.org",48],["empflix.com",49],["freeplayervideo.com",50],["nazarickol.com",50],["player-cdn.com",50],["playhydrax.com",[50,242,243]],["alleneconomicmatter.com",50],["apinchcaseation.com",50],["bethshouldercan.com",50],["bigclatterhomesguideservice.com",50],["bradleyviewdoctor.com",50],["brookethoughi.com",50],["brucevotewithin.com",50],["cindyeyefinal.com",50],["denisegrowthwide.com",50],["donaldlineelse.com",50],["edwardarriveoften.com",50],["erikcoldperson.com",50],["evelynthankregion.com",50],["graceaddresscommunity.com",50],["heatherdiscussionwhen.com",50],["housecardsummerbutton.com",50],["jamesstartstudent.com",50],["jamiesamewalk.com",50],["jasminetesttry.com",50],["jasonresponsemeasure.com",50],["jayservicestuff.com",50],["jessicaglassauthor.com",50],["johntryopen.com",50],["josephseveralconcern.com",50],["kennethofficialitem.com",50],["lisatrialidea.com",50],["lorimuchbenefit.com",50],["loriwithinfamily.com",50],["lukecomparetwo.com",50],["markstyleall.com",50],["michaelapplysome.com",50],["morganoperationface.com",50],["nectareousoverelate.com",50],["paulkitchendark.com",50],["rebeccaneverbase.com",50],["roberteachfinal.com",50],["robertplacespace.com",50],["ryanagoinvolve.com",50],["sandrataxeight.com",50],["seanshowcould.com",50],["sethniceletter.com",50],["shannonpersonalcost.com",50],["sharonwhiledemocratic.com",50],["stevenimaginelittle.com",50],["strawberriesporail.com",50],["susanhavekeep.com",50],["timberwoodanotia.com",50],["tinycat-voe-fashion.com",50],["troyyourlead.com",50],["uptodatefinishconference.com",50],["uptodatefinishconferenceroom.com",50],["vincentincludesuccessful.com",50],["voe.sx",50],["motphimtv.com",50],["rabbitstream.net",50],["projectfreetv.one",50],["thomasalthoughhear.com",50],["transparentcalifornia.com",51],["deepbrid.com",52],["submityourflicks.com",53],["3movs.com",53],["bravoerotica.net",[53,115]],["youx.xxx",53],["camclips.tv",[53,195]],["camflow.tv",[53,115,116,160,233]],["camhoes.tv",[53,113,115,116,160,233]],["xmegadrive.com",53],["xxxymovies.com",53],["xxxshake.com",53],["gayck.com",53],["xhand.com",[53,115]],["analdin.com",[53,115]],["webnovel.com",54],["videosgay.me",[55,56]],["oneupload.to",56],["oneupload.online",56],["wishfast.top",56],["schwaebische.de",57],["8tracks.com",58],["revealname.com",59],["golfchannel.com",61],["telemundodeportes.com",61],["stream.nbcsports.com",61],["mathdf.com",61],["gamcore.com",62],["porcore.com",62],["69games.xxx",62],["javmix.app",62],["tecknity.com",63],["haaretz.co.il",64],["haaretz.com",64],["hungama.com",64],["a-o.ninja",64],["anime-odcinki.pl",64],["kumpulmanga.org",64],["shortgoo.blogspot.com",64],["tonanmedia.my.id",[64,488]],["yurasu.xyz",64],["isekaipalace.com",64],["vikistream.com",65],["eplayer.click",[65,66]],["mega4upload.com",[66,72]],["ennovelas.com",[66,72]],["n-tv.de",67],["brigitte.de",68],["stern.de",68],["foxsports.com.au",69],["canberratimes.com.au",69],["thesimsresource.com",70],["bdnewszh.com",72],["streamservicehd.click",72],["timeforbitco.in",73],["worldofbitco.in",[73,83]],["weatherx.co.in",[73,83]],["getyourbitco.in",73],["sunbtc.space",73],["ctrl.blog",74],["sportlife.es",75],["finofilipino.org",76],["acortarm.xyz",77],["mysflink.blogspot.com",78],["assia.tv",79],["assia4.com",79],["assia24.com",79],["cwtvembeds.com",[81,114]],["xmateur.com",[81,82,116]],["camlovers.tv",81],["porntn.com",81],["pornissimo.org",81],["sexcams-24.com",[81,116]],["watchporn.to",[81,116]],["camwhorez.video",81],["multi.xxx",82],["footstockings.com",[82,116]],["sbs.com.au",84],["ojogos.com.br",86],["powforums.com",87],["supforums.com",87],["studybullet.com",87],["usgamer.net",88],["recordonline.com",88],["freebitcoin.win",91],["e-monsite.com",91],["coindice.win",91],["sport-tv-guide.live",92],["temp-mails.com",93],["freiepresse.de",94],["investing.com",95],["mp3fiber.com",97],["chicoer.com",98],["dailybreeze.com",98],["dailybulletin.com",98],["dailynews.com",98],["delcotimes.com",98],["eastbaytimes.com",98],["macombdaily.com",98],["ocregister.com",98],["pasadenastarnews.com",98],["pe.com",98],["presstelegram.com",98],["redlandsdailyfacts.com",98],["reviewjournal.com",98],["santacruzsentinel.com",98],["saratogian.com",98],["sentinelandenterprise.com",98],["sgvtribune.com",98],["tampabay.com",98],["times-standard.com",98],["theoaklandpress.com",98],["trentonian.com",98],["twincities.com",98],["whittierdailynews.com",98],["bostonherald.com",98],["dailycamera.com",98],["sbsun.com",98],["dailydemocrat.com",98],["montereyherald.com",98],["orovillemr.com",98],["record-bee.com",98],["redbluffdailynews.com",98],["reporterherald.com",98],["thereporter.com",98],["timescall.com",98],["timesheraldonline.com",98],["ukiahdailyjournal.com",98],["dailylocal.com",98],["mercurynews.com",98],["suedkurier.de",99],["anysex.com",101],["vlist.se",102],["pornve.com",103],["coolrom.com.au",104],["pornohirsch.net",105],["marie-claire.es",106],["gamezhero.com",106],["flashgirlgames.com",106],["onlinesudoku.games",106],["mpg.football",106],["sssam.com",106],["globalnews.ca",107],["drinksmixer.com",108],["leitesculinaria.com",108],["fupa.net",109],["browardpalmbeach.com",110],["dallasobserver.com",110],["houstonpress.com",110],["miaminewtimes.com",110],["phoenixnewtimes.com",110],["westword.com",110],["nhentai.net",111],["nowtv.com.tr",112],["caminspector.net",113],["camwhoreshd.com",113],["camgoddess.tv",113],["gay4porn.com",115],["mypornhere.com",115],["camhub.cc",116],["sexwebvideo.com",116],["sexwebvideo.net",116],["love4porn.com",116],["thotvids.com",116],["watchmdh.to",116],["celebwhore.com",116],["cluset.com",116],["4kporn.xxx",116],["xhomealone.com",116],["lusttaboo.com",[116,414]],["hentai-moon.com",116],["mediapason.it",119],["linkspaid.com",119],["tuotromedico.com",119],["neoteo.com",119],["phoneswiki.com",119],["celebmix.com",119],["myneobuxportal.com",119],["oyungibi.com",119],["25yearslatersite.com",119],["jeshoots.com",120],["techhx.com",120],["karanapk.com",120],["flashplayer.fullstacks.net",122],["cloudapps.herokuapp.com",122],["texteditor.nsspot.net",122],["youfiles.herokuapp.com",122],["temp-mail.org",123],["javhdporn.net",124],["javstream.top",124],["comnuan.com",125],["veedi.com",126],["battleboats.io",126],["fruitlab.com",127],["acetack.com",127],["androidquest.com",127],["apklox.com",127],["chhaprawap.in",127],["gujarativyakaran.com",127],["kashmirstudentsinformation.in",127],["kisantime.com",127],["shetkaritoday.in",127],["pastescript.com",127],["trimorspacks.com",127],["updrop.link",127],["haddoz.net",127],["garoetpos.com",127],["stiletv.it",128],["hqtv.biz",130],["liveuamap.com",131],["muvibg.com",131],["audycje.tokfm.pl",132],["hulu.com",[133,134,135]],["shush.se",136],["emurom.net",137],["allkpop.com",138],["pickcrackpasswords.blogspot.com",140],["kfrfansub.com",141],["thuglink.com",141],["voipreview.org",141],["illicoporno.com",142],["lavoixdux.com",142],["tonpornodujour.com",142],["jacquieetmichel.net",142],["jacquieetmicheltv.net",[142,251,252]],["swame.com",142],["vosfemmes.com",142],["voyeurfrance.net",142],["hanime.tv",143],["pogo.com",144],["cloudvideo.tv",145],["legionjuegos.org",146],["legionpeliculas.org",146],["legionprogramas.org",146],["16honeys.com",147],["elespanol.com",148],["remodelista.com",149],["coolmathgames.com",[150,151,152,550]],["audiofanzine.com",153],["hitokin.net",155],["developerinsider.co",156],["ilprimatonazionale.it",157],["hotabis.com",157],["root-nation.com",157],["italpress.com",157],["airsoftmilsimnews.com",157],["artribune.com",157],["thehindu.com",158],["cambro.tv",[159,160]],["nibelungen-kurier.de",161],["adfoc.us",163],["techyember.com",163],["remixbass.com",163],["techipop.com",163],["quickimageconverter.com",163],["mastharyana.com",163],["tea-coffee.net",163],["spatsify.com",163],["newedutopics.com",163],["getviralreach.in",163],["edukaroo.com",163],["funkeypagali.com",163],["careersides.com",163],["nayisahara.com",163],["wikifilmia.com",163],["infinityskull.com",163],["viewmyknowledge.com",163],["iisfvirtual.in",163],["starxinvestor.com",163],["jkssbalerts.com",163],["myprivatejobs.com",[163,293]],["wikitraveltips.com",[163,293]],["amritadrino.com",[163,293]],["sahlmarketing.net",163],["filmypoints.in",163],["fitnessholic.net",163],["moderngyan.com",163],["sattakingcharts.in",163],["freshbhojpuri.com",163],["bgmi32bitapk.in",163],["bankshiksha.in",163],["earn.mpscstudyhub.com",163],["earn.quotesopia.com",163],["money.quotesopia.com",163],["best-mobilegames.com",163],["learn.moderngyan.com",163],["bharatsarkarijobalert.com",163],["techacode.com",163],["trickms.com",163],["ielts-isa.edu.vn",163],["sptfy.be",163],["mcafee-com.com",[163,292]],["pianetamountainbike.it",164],["barchart.com",165],["modelisme.com",166],["parasportontario.ca",166],["prescottenews.com",166],["nrj-play.fr",167],["oeffentlicher-dienst.info",168],["hackingwithreact.com",169],["gutekueche.at",170],["eplfootballmatch.com",171],["peekvids.com",172],["playvids.com",172],["pornflip.com",172],["redensarten-index.de",173],["vw-page.com",174],["viz.com",[175,176]],["queenfaucet.website",177],["0rechner.de",178],["configspc.com",179],["xopenload.me",179],["uptobox.com",179],["uptostream.com",179],["onepiece-tube.com",180],["japgay.com",181],["mega-debrid.eu",182],["dreamdth.com",183],["diaridegirona.cat",185],["diariodeibiza.es",185],["diariodemallorca.es",185],["diarioinformacion.com",185],["eldia.es",185],["emporda.info",185],["farodevigo.es",185],["laopinioncoruna.es",185],["laopiniondemalaga.es",185],["laopiniondemurcia.es",185],["laopiniondezamora.es",185],["laprovincia.es",185],["levante-emv.com",185],["mallorcazeitung.es",185],["regio7.cat",185],["superdeporte.es",185],["playpaste.com",186],["player.rtl2.de",187],["freetutorialsus.com",188],["vidlii.com",[188,204]],["iammagnus.com",188],["dailyvideoreports.net",188],["unityassets4free.com",188],["cnbc.com",189],["puzzles.msn.com",190],["metro.us",190],["newsobserver.com",190],["arkadiumhosted.com",190],["firefaucet.win",192],["55k.io",193],["filelions.online",193],["stmruby.com",193],["direct-link.net",194],["direkt-wissen.com",194],["link-to.net",194],["fullhdxxx.com",196],["pornclassic.tube",197],["tubepornclassic.com",197],["etonline.com",198],["creatur.io",198],["drphil.com",198],["urbanmilwaukee.com",198],["ontiva.com",198],["hideandseek.world",198],["myabandonware.com",198],["kendam.com",198],["wttw.com",198],["synonyms.com",198],["definitions.net",198],["hostmath.com",198],["camvideoshub.com",198],["minhaconexao.com.br",198],["home-made-videos.com",200],["pxrnxx.xyz",200],["amateur-couples.com",200],["slutdump.com",200],["produsat.com",202],["12thman.com",204],["acusports.com",204],["atlantic10.com",204],["auburntigers.com",204],["baylorbears.com",204],["bceagles.com",204],["bgsufalcons.com",204],["big12sports.com",204],["bigten.org",204],["bradleybraves.com",204],["butlersports.com",204],["cmumavericks.com",204],["conferenceusa.com",204],["cyclones.com",204],["dartmouthsports.com",204],["daytonflyers.com",204],["dbupatriots.com",204],["dbusports.com",204],["denverpioneers.com",204],["fduknights.com",204],["fgcuathletics.com",204],["fightinghawks.com",204],["fightingillini.com",204],["floridagators.com",204],["friars.com",204],["friscofighters.com",204],["gamecocksonline.com",204],["goarmywestpoint.com",204],["gobison.com",204],["goblueraiders.com",204],["gobobcats.com",204],["gocards.com",204],["gocreighton.com",204],["godeacs.com",204],["goexplorers.com",204],["goetbutigers.com",204],["gofrogs.com",204],["gogriffs.com",204],["gogriz.com",204],["golobos.com",204],["gomarquette.com",204],["gopack.com",204],["gophersports.com",204],["goprincetontigers.com",204],["gopsusports.com",204],["goracers.com",204],["goshockers.com",204],["goterriers.com",204],["gotigersgo.com",204],["gousfbulls.com",204],["govandals.com",204],["gowyo.com",204],["goxavier.com",204],["gozags.com",204],["gozips.com",204],["griffinathletics.com",204],["guhoyas.com",204],["gwusports.com",204],["hailstate.com",204],["hamptonpirates.com",204],["hawaiiathletics.com",204],["hokiesports.com",204],["huskers.com",204],["icgaels.com",204],["iuhoosiers.com",204],["jsugamecocksports.com",204],["longbeachstate.com",204],["loyolaramblers.com",204],["lrtrojans.com",204],["lsusports.net",204],["morrisvillemustangs.com",204],["msuspartans.com",204],["muleriderathletics.com",204],["mutigers.com",204],["navysports.com",204],["nevadawolfpack.com",204],["niuhuskies.com",204],["nkunorse.com",204],["nuhuskies.com",204],["nusports.com",204],["okstate.com",204],["olemisssports.com",204],["omavs.com",204],["ovcsports.com",204],["owlsports.com",204],["purduesports.com",204],["redstormsports.com",204],["richmondspiders.com",204],["sfajacks.com",204],["shupirates.com",204],["siusalukis.com",204],["smcgaels.com",204],["smumustangs.com",204],["soconsports.com",204],["soonersports.com",204],["themw.com",204],["tulsahurricane.com",204],["txst.com",204],["txstatebobcats.com",204],["ubbulls.com",204],["ucfknights.com",204],["ucirvinesports.com",204],["uconnhuskies.com",204],["uhcougars.com",204],["uicflames.com",204],["umterps.com",204],["uncwsports.com",204],["unipanthers.com",204],["unlvrebels.com",204],["uoflsports.com",204],["usdtoreros.com",204],["utahstateaggies.com",204],["utepathletics.com",204],["utrockets.com",204],["uvmathletics.com",204],["uwbadgers.com",204],["villanova.com",204],["wkusports.com",204],["wmubroncos.com",204],["woffordterriers.com",204],["1pack1goal.com",204],["bcuathletics.com",204],["bubraves.com",204],["goblackbears.com",204],["golightsgo.com",204],["gomcpanthers.com",204],["goutsa.com",204],["mercerbears.com",204],["pirateblue.com",204],["pirateblue.net",204],["pirateblue.org",204],["quinnipiacbobcats.com",204],["towsontigers.com",204],["tribeathletics.com",204],["tribeclub.com",204],["utepminermaniacs.com",204],["utepminers.com",204],["wkutickets.com",204],["aopathletics.org",204],["atlantichockeyonline.com",204],["bigsouthnetwork.com",204],["bigsouthsports.com",204],["chawomenshockey.com",204],["dbupatriots.org",204],["drakerelays.org",204],["ecac.org",204],["ecacsports.com",204],["emueagles.com",204],["emugameday.com",204],["gculopes.com",204],["godrakebulldog.com",204],["godrakebulldogs.com",204],["godrakebulldogs.net",204],["goeags.com",204],["goislander.com",204],["goislanders.com",204],["gojacks.com",204],["gomacsports.com",204],["gseagles.com",204],["hubison.com",204],["iowaconference.com",204],["ksuowls.com",204],["lonestarconference.org",204],["mascac.org",204],["midwestconference.org",204],["mountaineast.org",204],["niu-pack.com",204],["nulakers.ca",204],["oswegolakers.com",204],["ovcdigitalnetwork.com",204],["pacersports.com",204],["rmacsports.org",204],["rollrivers.com",204],["samfordsports.com",204],["uncpbraves.com",204],["usfdons.com",204],["wiacsports.com",204],["alaskananooks.com",204],["broncathleticfund.com",204],["cameronaggies.com",204],["columbiacougars.com",204],["etownbluejays.com",204],["gobadgers.ca",204],["golancers.ca",204],["gometrostate.com",204],["gothunderbirds.ca",204],["kentstatesports.com",204],["lehighsports.com",204],["lopers.com",204],["lycoathletics.com",204],["lycomingathletics.com",204],["maraudersports.com",204],["mauiinvitational.com",204],["msumavericks.com",204],["nauathletics.com",204],["nueagles.com",204],["nwusports.com",204],["oceanbreezenyc.org",204],["patriotathleticfund.com",204],["pittband.com",204],["principiaathletics.com",204],["roadrunnersathletics.com",204],["sidearmsocial.com",204],["snhupenmen.com",204],["stablerarena.com",204],["stoutbluedevils.com",204],["uwlathletics.com",204],["yumacs.com",204],["collegefootballplayoff.com",204],["csurams.com",204],["cubuffs.com",204],["gobearcats.com",204],["gohuskies.com",204],["mgoblue.com",204],["osubeavers.com",204],["pittsburghpanthers.com",204],["rolltide.com",204],["texassports.com",204],["thesundevils.com",204],["uclabruins.com",204],["wvuathletics.com",204],["wvusports.com",204],["arizonawildcats.com",204],["calbears.com",204],["cuse.com",204],["georgiadogs.com",204],["goducks.com",204],["goheels.com",204],["gostanford.com",204],["insidekstatesports.com",204],["insidekstatesports.info",204],["insidekstatesports.net",204],["insidekstatesports.org",204],["k-stateathletics.com",204],["k-statefootball.net",204],["k-statefootball.org",204],["k-statesports.com",204],["k-statesports.net",204],["k-statesports.org",204],["k-statewomenshoops.com",204],["k-statewomenshoops.net",204],["k-statewomenshoops.org",204],["kstateathletics.com",204],["kstatefootball.net",204],["kstatefootball.org",204],["kstatesports.com",204],["kstatewomenshoops.com",204],["kstatewomenshoops.net",204],["kstatewomenshoops.org",204],["ksuathletics.com",204],["ksusports.com",204],["scarletknights.com",204],["showdownforrelief.com",204],["syracusecrunch.com",204],["texastech.com",204],["theacc.com",204],["ukathletics.com",204],["usctrojans.com",204],["utahutes.com",204],["utsports.com",204],["wsucougars.com",204],["tricksplit.io",204],["fangraphs.com",205],["4players.de",[206,287]],["buffed.de",206],["gamesaktuell.de",206],["gamezone.de",206],["pcgames.de",206],["videogameszone.de",206],["tvspielfilm.de",[207,208,209,210]],["tvtoday.de",[207,208,209,210]],["chip.de",[207,208,209,210]],["focus.de",[207,208,209,210]],["planetaminecraft.com",211],["cravesandflames.com",212],["codesnse.com",212],["link.paid4file.com",212],["flyad.vip",212],["lapresse.ca",213],["kolyoom.com",214],["ilovephd.com",214],["negumo.com",215],["games.wkb.jp",[216,217]],["fandom.com",[218,567,568]],["kenshi.fandom.com",219],["hausbau-forum.de",220],["homeairquality.org",220],["faucettronn.click",220],["fake-it.ws",221],["laksa19.github.io",222],["1shortlink.com",223],["nesia.my.id",224],["u-s-news.com",225],["makemoneywithurl.com",226],["junkyponk.com",226],["healthfirstweb.com",226],["vocalley.com",226],["yogablogfit.com",226],["howifx.com",[226,449]],["en.financerites.com",226],["mythvista.com",226],["livenewsflix.com",226],["cureclues.com",226],["apekite.com",226],["host-buzz.com",226],["insmyst.com",226],["wp2host.com",226],["blogtechh.com",226],["techbixby.com",226],["blogmyst.com",226],["resetoff.pl",227],["sexodi.com",227],["cdn77.org",228],["howtofixwindows.com",229],["3sexporn.com",230],["momxxxsex.com",230],["myfreevintageporn.com",230],["penisbuyutucum.net",230],["ujszo.com",231],["newsmax.com",232],["bobs-tube.com",233],["nadidetarifler.com",234],["siz.tv",234],["suzylu.co.uk",[235,236]],["onworks.net",237],["yabiladi.com",237],["downloadsoft.net",238],["pixsera.net",239],["testlanguages.com",240],["newsinlevels.com",240],["videosinlevels.com",240],["cbs.com",241],["paramountplus.com",241],["abysscdn.com",[242,243]],["buktube.com",244],["fullxh.com",244],["galleryxh.site",244],["megaxh.com",244],["movingxh.world",244],["seexh.com",244],["unlockxh4.com",244],["valuexh.life",244],["xhaccess.com",244],["xhadult2.com",244],["xhadult3.com",244],["xhadult4.com",244],["xhadult5.com",244],["xhamster46.com",244],["xhamsterporno.mx",244],["xhbig.com",244],["xhbranch5.com",244],["xhchannel.com",244],["xhchannel2.com",244],["xhdate.world",244],["xhday.com",244],["xhday1.com",244],["xhlease.world",244],["xhmoon5.com",244],["xhofficial.com",244],["xhopen.com",244],["xhplanet1.com",244],["xhplanet2.com",244],["xhreal2.com",244],["xhreal3.com",244],["xhspot.com",244],["xhtab2.com",244],["xhtab4.com",244],["xhtotal.com",244],["xhtree.com",244],["xhvictory.com",244],["xhwebsite.com",244],["xhwebsite2.com",244],["xhwebsite5.com",244],["xhwide1.com",244],["xhwide2.com",244],["xhwide5.com",244],["xhxh3.xyz",244],["lightnovelworld.com",245],["megadescarga.net",[246,247,248,249]],["megadescargas.net",[246,247,248,249]],["hentaihaven.xxx",250],["jacquieetmicheltv2.net",252],["fcportables.com",[254,255]],["ultimate-guitar.com",256],["teachmemicro.com",257],["willcycle.com",257],["2ndrun.tv",257],["rackusreads.com",257],["xyzsports111.xyz",[258,259,260]],["xyzsports112.xyz",[258,259,260]],["xyzsports113.xyz",[258,259,260]],["xyzsports114.xyz",[258,259,260]],["xyzsprtsfrmr1.site",[258,259,260]],["xyzsprtsfrmr2.site",[258,259,260]],["claimbits.net",261],["sexyscope.net",262],["recherche-ebook.fr",264],["easymc.io",264],["zonebourse.com",265],["pink-sluts.net",266],["madoohd.com",267],["andhrafriends.com",268],["benzinpreis.de",269],["turtleviplay.xyz",270],["defenseone.com",271],["govexec.com",271],["nextgov.com",271],["route-fifty.com",271],["sharing.wtf",272],["wetter3.de",273],["arahdrive.com",274],["aiimgvlog.fun",[274,292]],["esportivos.fun",275],["cosmonova-broadcast.tv",276],["soccerinhd.com",277],["techedubyte.com",277],["hartvannederland.nl",278],["shownieuws.nl",278],["vandaaginside.nl",278],["rock.porn",[279,280]],["videzz.net",[281,282]],["ezaudiobookforsoul.com",283],["club386.com",284],["androidpolice.com",285],["cbr.com",285],["collider.com",285],["dualshockers.com",285],["gamerant.com",285],["howtogeek.com",285],["makeuseof.com",285],["movieweb.com",285],["screenrant.com",285],["thegamer.com",285],["xda-developers.com",285],["banned.video",285],["madmaxworld.tv",285],["wheelofgold.com",286],["ozulmanga.com",286],["onlinesoccermanager.com",287],["njav.tv",288],["netfapx.com",288],["easyfun.gg",289],["uploadmall.com",290],["rapid-cloud.co",290],["smailpro.com",291],["starkroboticsfrc.com",292],["sinonimos.de",292],["antonimos.de",292],["quesignifi.ca",292],["tiktokrealtime.com",292],["tiktokcounter.net",292],["tpayr.xyz",292],["poqzn.xyz",292],["ashrfd.xyz",292],["rezsx.xyz",292],["tryzt.xyz",292],["ashrff.xyz",292],["rezst.xyz",292],["dawenet.com",292],["erzar.xyz",292],["waezm.xyz",292],["waezg.xyz",292],["blackwoodacademy.org",292],["cryptednews.space",292],["vivuq.com",292],["swgop.com",292],["vbnmll.com",292],["telcoinfo.online",292],["dshytb.com",292],["fitdynamos.com",[292,294]],["btcbitco.in",[292,296]],["btcsatoshi.net",292],["cempakajaya.com",292],["crypto4yu.com",292],["readbitcoin.org",292],["wiour.com",292],["finish.addurl.biz",292],["laweducationinfo.com",[292,300]],["savemoneyinfo.com",[292,300]],["worldaffairinfo.com",[292,300]],["godstoryinfo.com",[292,300]],["successstoryinfo.com",[292,300]],["cxissuegk.com",[292,300]],["learnmarketinfo.com",[292,300]],["bhugolinfo.com",[292,300]],["armypowerinfo.com",[292,300]],["rsadnetworkinfo.com",[292,300]],["rsinsuranceinfo.com",[292,300]],["rsfinanceinfo.com",[292,300]],["rsgamer.app",[292,300]],["rssoftwareinfo.com",[292,300]],["rshostinginfo.com",[292,300]],["rseducationinfo.com",[292,300]],["phonereviewinfo.com",[292,300]],["makeincomeinfo.com",[292,300]],["gknutshell.com",[292,300]],["vichitrainfo.com",[292,300]],["workproductivityinfo.com",[292,300]],["advertisingexcel.com",292],["allcryptoz.net",292],["batmanfactor.com",292],["beautifulfashionnailart.com",292],["crewbase.net",292],["documentaryplanet.xyz",292],["crewus.net",292],["gametechreviewer.com",292],["midebalonu.net",292],["misterio.ro",292],["phineypet.com",292],["seory.xyz",292],["shinbhu.net",292],["shinchu.net",292],["substitutefor.com",292],["talkforfitness.com",292],["thefitbrit.co.uk",292],["thumb8.net",292],["thumb9.net",292],["topcryptoz.net",292],["uniqueten.net",292],["ultraten.net",292],["exactpay.online",292],["kiddyearner.com",292],["luckydice.net",293],["adarima.org",293],["tieutietkiem.com",293],["weatherwx.com",293],["sattaguess.com",293],["winshell.de",293],["rosasidan.ws",293],["modmakers.xyz",293],["gamepure.in",293],["warrenrahul.in",293],["austiblox.net",293],["upiapi.in",293],["myownguess.in",293],["networkhint.com",293],["watchhentai.net",293],["thichcode.net",293],["texturecan.com",293],["tikmate.app",[293,523]],["4funbox.com",295],["nephobox.com",295],["1024tera.com",295],["blog.cryptowidgets.net",296],["blog.insurancegold.in",296],["blog.wiki-topia.com",296],["blog.coinsvalue.net",296],["blog.cookinguide.net",296],["blog.freeoseocheck.com",296],["blog24.me",296],["bildirim.link",298],["appsbull.com",299],["diudemy.com",299],["maqal360.com",299],["lifesurance.info",301],["infokeeda.xyz",302],["webzeni.com",302],["dl.apkmoddone.com",303],["phongroblox.com",303],["apkmodvn.com",304],["arcai.com",306],["my-code4you.blogspot.com",307],["flickr.com",308],["firefile.cc",309],["pestleanalysis.com",309],["kochamjp.pl",309],["tutorialforlinux.com",309],["whatsaero.com",309],["animeblkom.net",[309,325]],["blkom.com",309],["globes.co.il",[310,311]],["jardiner-malin.fr",312],["tw-calc.net",313],["ohmybrush.com",314],["talkceltic.net",315],["mentalfloss.com",316],["uprafa.com",317],["cube365.net",318],["nightfallnews.com",[319,320]],["wwwfotografgotlin.blogspot.com",321],["freelistenonline.com",321],["badassdownloader.com",322],["quickporn.net",323],["yellowbridge.com",324],["aosmark.com",326],["atozmath.com",[328,329,330,331,332,333,334]],["newyorker.com",335],["brighteon.com",336],["more.tv",337],["video1tube.com",338],["alohatube.xyz",338],["fshost.me",339],["link.cgtips.org",340],["hentaicloud.com",341],["paperzonevn.com",343],["hentaienglish.com",344],["hentaiporno.xxx",344],["venge.io",[345,346]],["btcbux.io",347],["its.porn",[348,349]],["atv.at",350],["kusonime.com",[351,352]],["jetpunk.com",[354,355]],["imgur.com",356],["hentai-party.com",357],["hentaicomics.pro",357],["xxx-comics.pro",357],["genshinimpactcalculator.com",360],["mysexgames.com",361],["embed.indavideo.hu",364],["coinurl.net",[365,366]],["gdr-online.com",367],["mmm.dk",368],["iqiyi.com",[369,370,515]],["m.iqiyi.com",371],["japopav.tv",372],["lvturbo.com",372],["nbcolympics.com",373],["apkhex.com",374],["indiansexstories2.net",375],["issstories.xyz",375],["1340kbbr.com",376],["gorgeradio.com",376],["kduk.com",376],["kedoam.com",376],["kejoam.com",376],["kelaam.com",376],["khsn1230.com",376],["kjmx.rocks",376],["kloo.com",376],["klooam.com",376],["klykradio.com",376],["kmed.com",376],["kmnt.com",376],["kool991.com",376],["kpnw.com",376],["kppk983.com",376],["krktcountry.com",376],["ktee.com",376],["kwro.com",376],["kxbxfm.com",376],["thevalley.fm",376],["quizlet.com",377],["dsocker1234.blogspot.com",378],["schoolcheats.net",[379,380]],["mgnet.xyz",381],["designtagebuch.de",382],["pixroute.com",383],["uploady.io",384],["calculator-online.net",385],["porngames.club",386],["sexgames.xxx",386],["111.90.159.132",387],["battleplan.news",387],["mobile-tracker-free.com",388],["pfps.gg",389],["ac-illust.com",[390,391]],["photo-ac.com",[390,391]],["vlxxs.net",392],["rapelust.com",392],["vtube.to",392],["vtplay.net",392],["desitelugusex.com",392],["xvideos-downloader.net",392],["xxxvideotube.net",392],["sdefx.cloud",392],["nozomi.la",392],["moviesonlinefree.net",392],["social-unlock.com",393],["ninja.io",394],["sourceforge.net",395],["samfirms.com",396],["huffpost.com",397],["ingles.com",398],["spanishdict.com",398],["surfline.com",[399,400]],["play.tv3.ee",401],["play.tv3.lt",401],["play.tv3.lv",401],["tv3play.skaties.lv",401],["trendyoum.com",402],["bulbagarden.net",403],["moviestars.to",404],["hollywoodlife.com",405],["mat6tube.com",406],["textstudio.co",407],["newtumbl.com",408],["aruble.net",410],["nevcoins.club",411],["mail.com",412],["oggi.it",[415,416]],["manoramamax.com",415],["video.gazzetta.it",[415,416]],["mangakita.id",417],["mangakita.net",417],["poscishd.online",418],["avpgalaxy.net",419],["mhma12.tech",420],["panda-novel.com",421],["zebranovel.com",421],["lightsnovel.com",421],["eaglesnovel.com",421],["pandasnovel.com",421],["zadfaucet.com",422],["ewrc-results.com",423],["kizi.com",424],["cyberscoop.com",425],["fedscoop.com",425],["canale.live",426],["indiatimes.com",427],["mafiatown.pl",[428,429]],["jeep-cj.com",430],["sponsorhunter.com",431],["cloudcomputingtopics.net",432],["likecs.com",433],["tiscali.it",434],["linkspy.cc",435],["tutelehd3.xyz",436],["dirty.pink",[437,438,439]],["adshnk.com",440],["chattanoogan.com",441],["adsy.pw",442],["playstore.pw",442],["socialmediagirls.com",443],["windowspro.de",444],["snapinsta.app",445],["tvtv.ca",446],["tvtv.us",446],["mydaddy.cc",447],["roadtrippin.fr",448],["vavada5com.com",449],["redketchup.io",[450,451,452]],["streamsilk.com",453],["anyporn.com",[454,469]],["bravoporn.com",454],["bravoteens.com",454],["crocotube.com",454],["hellmoms.com",454],["hellporno.com",454],["sex3.com",454],["tubewolf.com",454],["xbabe.com",454],["xcum.com",454],["zedporn.com",454],["imagetotext.info",455],["infokik.com",456],["freepik.com",457],["ddwloclawek.pl",[458,459]],["deezer.com",460],["my-subs.co",461],["plaion.com",462],["slideshare.net",[463,464]],["ustreasuryyieldcurve.com",465],["businesssoftwarehere.com",466],["goo.st",466],["freevpshere.com",466],["softwaresolutionshere.com",466],["staige.tv",470],["in-jpn.com",471],["oninet.ne.jp",471],["xth.jp",471],["androidadult.com",472],["streamvid.net",473],["watchtv24.com",474],["cellmapper.net",475],["medscape.com",476],["newscon.org",[477,478]],["arkadium.com",479],["bembed.net",480],["elbailedeltroleo.site",480],["embedv.net",480],["fslinks.org",480],["listeamed.net",480],["v6embed.xyz",480],["vgplayer.xyz",480],["vid-guard.com",480],["vidguard.online",480],["app.blubank.com",481],["mobileweb.bankmellat.ir",481],["sportdeutschland.tv",482],["kcra.com",482],["wcvb.com",482],["ccthesims.com",489],["chromeready.com",489],["coursedrive.org",489],["dtbps3games.com",489],["illustratemagazine.com",489],["uknip.co.uk",489],["vod.pl",490],["megadrive-emulator.com",491],["animesaga.in",494],["moviesapi.club",494],["bestx.stream",494],["watchx.top",494],["digimanie.cz",495],["svethardware.cz",495],["srvy.ninja",496],["drawer-opportunity-i-243.site",497],["tchatche.com",498],["cnn.com",[499,500,501]],["edmdls.com",502],["freshremix.net",502],["scenedl.org",502],["trakt.tv",503],["shroomers.app",504],["classicalradio.com",505],["di.fm",505],["jazzradio.com",505],["radiotunes.com",505],["rockradio.com",505],["zenradio.com",505],["pc-builds.com",506],["qtoptens.com",506],["reuters.com",506],["today.com",506],["videogamer.com",506],["wrestlinginc.com",506],["gbatemp.net",506],["movie-th.tv",507],["iwanttfc.com",508],["nutraingredients-asia.com",509],["nutraingredients-latam.com",509],["nutraingredients-usa.com",509],["nutraingredients.com",509],["mavenarts.in",510],["ozulscansen.com",511],["fitnessbr.click",512],["minhareceita.xyz",512],["doomied.monster",513],["lookmovie2.to",513],["royalroad.com",514],["biletomat.pl",516],["hextank.io",[517,518]],["filmizlehdfilm.com",[519,520,521,522]],["fullfilmizle.cc",[519,520,521,522]],["sagewater.com",524],["redlion.net",524],["satdl.com",525],["vidstreaming.xyz",526],["everand.com",527],["myradioonline.pl",528],["tacobell.com",530],["zefoy.com",531],["natgeotv.com",533],["br.de",534],["indeed.com",535],["pasteboard.co",536],["clickhole.com",537],["deadspin.com",537],["gizmodo.com",537],["jalopnik.com",537],["jezebel.com",537],["kotaku.com",537],["lifehacker.com",537],["splinternews.com",537],["theinventory.com",537],["theonion.com",537],["theroot.com",537],["thetakeout.com",537],["pewresearch.org",537],["los40.com",[538,539]],["as.com",539],["telegraph.co.uk",[540,541]],["poweredbycovermore.com",[540,590]],["lumens.com",[540,590]],["verizon.com",542],["humanbenchmark.com",543],["politico.com",544],["officedepot.co.cr",[545,546]],["usnews.com",549],["factable.com",551],["zee5.com",552],["gala.fr",553],["geo.fr",553],["voici.fr",553],["gloucestershirelive.co.uk",554],["arsiv.mackolik.com",555],["jacksonguitars.com",556],["scandichotels.com",557],["stylist.co.uk",558],["nettiauto.com",559],["thaiairways.com",[560,561]],["cerbahealthcare.it",[562,563]],["futura-sciences.com",[562,579]],["tiendaenlinea.claro.com.ni",[564,565]],["tieba.baidu.com",566],["grasshopper.com",[569,570]],["epson.com.cn",[571,572,573,574]],["oe24.at",[575,576]],["szbz.de",575],["platform.autods.com",[577,578]],["wikihow.com",580],["citibank.com.sg",581],["uol.com.br",[582,583,584,585,586]],["gazzetta.gr",587],["digicol.dpm.org.cn",[588,589]],["virginmediatelevision.ie",591],["larazon.es",[592,593]],["waitrosecellar.com",[594,595,596]],["sharpen-free-design-generator.netlify.app",[598,599]],["help.cashctrl.com",[600,601]],["gry-online.pl",602],["vidaextra.com",603],["commande.rhinov.pro",[604,605]],["ecom.wixapps.net",[604,605]],["tipranks.com",[606,607]],["iceland.co.uk",[608,609,610]],["socket.pearsoned.com",611],["tntdrama.com",[612,613]],["mobile.de",[614,615]],["ioe.vn",[616,617]],["geiriadur.ac.uk",[616,620]],["welsh-dictionary.ac.uk",[616,620]],["bikeportland.org",[618,619]],["biologianet.com",[583,584,585]],["10play.com.au",[621,622]],["sunshine-live.de",[623,624]],["whatismyip.com",[625,626]],["myfitnesspal.com",627],["netoff.co.jp",[628,629]],["clickjogos.com.br",632],["bristan.com",[633,634]],["zillow.com",635],["share.hntv.tv",[636,637,638,639]],["forum.dji.com",[636,639]],["optimum.net",[640,641]],["investor-web.hdfcfund.com",642],["user.guancha.cn",[643,644]],["sosovalue.com",645],["bandyforbundet.no",[646,647]],["tatacommunications.com",648],["suamusica.com.br",[649,650,651]],["macrotrends.net",[652,653]],["code.world",654],["topgear.com",655],["eservice.directauto.com",[656,657]],["nbcsports.com",658],["poophq.com",660],["veev.to",660],["uber.com",[661,662]],["jdsports.com",[661,662]],["engadget.com",[661,662]],["yahoo.com",[661,662]],["techcrunch.com",[661,662]],["rivals.com",[661,662]],["kkrt.com",[661,662]],["crunchyroll.com",[661,662]],["dnb.com",[661,662]],["dnb.co.uk",[661,662]],["weather.com",[661,662]],["ubereats.com",[661,662]],["usatoday.com",663]]);

const entitiesMap = new Map([["watch-series",9],["watchseries",9],["vev",9],["vidop",9],["vidup",9],["starmusiq",12],["wcofun",12],["kissasian",14],["gogoanime",[14,50]],["1movies",[14,17]],["xmovies8",14],["0123movies",14],["gostream",14],["gomovies",14],["primewire",15],["streanplay",[15,16]],["sbplay",15],["milfnut",15],["sxyprn",21],["hqq",[22,23]],["waaw",[23,24]],["younetu",23],["vvtplayer",23],["123link",25],["adshort",25],["linkshorts",25],["adsrt",25],["vinaurl",25],["adfloz",25],["dutchycorp",25],["shortearn",25],["pingit",25],["shrink",25],["tmearn",25],["megalink",25],["miniurl",25],["gplinks",25],["clk",25],["pureshort",25],["shrinke",25],["shrinkme",25],["pcprogramasymas",25],["link1s",25],["shortzzy",25],["shorttey",[25,198]],["lite-link",25],["adcorto",25],["zshort",25],["upfiles",25],["linkfly",25],["wplink",25],["seulink",25],["encurtalink",25],["camwhores",[26,37,80,81,82]],["tube8",[27,28]],["youporn",28],["redtube",28],["pornhub",[28,184]],["upornia",[30,31]],["fmovies",50],["xtits",[53,115]],["streamwish",[55,56]],["pouvideo",60],["povvideo",60],["povw1deo",60],["povwideo",60],["powv1deo",60],["powvibeo",60],["powvideo",60],["powvldeo",60],["plyjam",[65,66]],["fxporn69",71],["vipbox",72],["viprow",72],["desbloqueador",77],["xberuang",78],["teknorizen",78],["subtorrents",85],["subtorrents1",85],["newpelis",85],["pelix",85],["allcalidad",85],["infomaniakos",85],["filecrypt",90],["tornadomovies",96],["icdrama",102],["mangasail",102],["file4go",104],["mangovideo",116],["asianclub",124],["anitube",127],["streamingcommunity",127],["mixdrop",129],["uploadev",154],["ver-pelis-online",162],["ancient-origins",171],["spankbang",191],["lookcam",198],["lootlinks",198],["dpstream",201],["bluemediafiles",203],["docer",227],["hamsterix",244],["xhamster",244],["xhamster1",244],["xhamster10",244],["xhamster11",244],["xhamster12",244],["xhamster13",244],["xhamster14",244],["xhamster15",244],["xhamster16",244],["xhamster17",244],["xhamster18",244],["xhamster19",244],["xhamster20",244],["xhamster2",244],["xhamster3",244],["xhamster4",244],["xhamster42",244],["xhamster5",244],["xhamster7",244],["xhamster8",244],["acortalo",[246,247,248,249]],["acortar",[246,247,248,249]],["a2zapk",253],["kickassanime",263],["doomovie-hd",267],["drakecomic",286],["terabox",295],["ctrlv",327],["123movieshd",353],["uproxy",358],["animesa",359],["cinecalidad",[362,363]],["dvdplay",392],["apkmaven",409],["gmx",413],["gamereactor",468],["vembed",480],["empire-anime",[483,484,485,486,487]],["empire-stream",[483,484,485]],["empire-streaming",[483,484,485]],["empire-streamz",[483,484,485]],["tvhay",[492,493]],["lookmovie",513],["filmizletv",[519,520,521,522]],["www.google",529],["officedepot",[547,548]],["foundit",[630,631]]]);

const exceptionsMap = new Map([["pingit.com",[25]],["pingit.me",[25]],["lookmovie.studio",[513]]]);

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
    const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
    let bcBuffer = [];
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.sendToLogger = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
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
    } else if ( raw === 'throwFunc' ) {
        value = function(){ throw ''; };
    } else if ( /^-?\d+$/.test(raw) ) {
        value = parseInt(raw);
        if ( isNaN(raw) ) { return; }
        if ( Math.abs(raw) > 0x7FFF ) { return; }
    } else if ( trusted ) {
        if ( raw.startsWith('json:') ) {
            try { value = safe.JSON_parse(raw.slice(5)); } catch(ex) { return; }
        } else if ( raw.startsWith('{') && raw.endsWith('}') ) {
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
