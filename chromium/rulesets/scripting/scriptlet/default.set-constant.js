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

const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["oeo","noopFunc"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["console.clear","trueFunc"],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["console.clear","noopFunc"],["console.log","noopFunc"],["String.prototype.charCodeAt","trueFunc"],["attachEvent","trueFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["Object.prototype.adReinsertion","noopFunc"],["Object.prototype.disableAds","true"],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["adBlockerDetected","undefined"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["Object.prototype.run","undefined"],["isAdblock","false"],["CaptchmeState.adb","undefined"],["bb","false"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["abp","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["getHomadConfig","noopFunc"],["adsbygoogle.loaded","true"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["cRAds","true"],["app.addonIsInstalled","trueFunc"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["CustomEvent","noopFunc"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["ulp_noadb","true"],["timeSec","0"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["hasAdBlocker","false"],["document.ontouchend","null"],["document.onclick","null"],["initials.yld-pdpopunder",""],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["DHAntiAdBlocker","true"],["adsConfigs","{}"],["adsConfigs.0","{}"],["adsConfigs.0.enabled","0"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["adSettings","[]"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["protection","noopFunc"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["checkAdsStatus","noopFunc"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["Object.prototype.ads.nopreroll_","true"],["checkAdBlocker","noopFunc"],["ADS.isBannersEnabled","false"],["adBlockerDetected","false"],["univresalP","noopFunc"],["EASYFUN_ADS_CAN_RUN","true"],["navigator.brave","undefined"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["document.hasFocus","trueFunc"],["detectAdBlock","noopFunc"],["document.hidden","false"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["private","false"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["delayClick","false"],["counter","10"],["google_srt","1"],["sensorsDataAnalytic201505","{}"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["showada","true"],["showax","true"],["p18","undefined"],["asc","2"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["isadb","false"],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["D4zz","noopFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["count","1"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["stop","noopFunc"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["aLoad","noopFunc"],["mtCanRunAdsSoItCanStillBeOnTheWeb","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["Overlayer","{}"],["pop3getcookie","undefined"],["pop3setcookie1","undefined"],["pop3setCookie2","undefined"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["showBlackout","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["Object.prototype.adBlockerDetected","falseFunc"],["Object.prototype.adBlocker","false"],["Object.prototype.tomatoDetected","falseFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","undefined"],["tOS2","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["playerConfigs.rek","{}"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["admiral","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["confirm","noopFunc"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["segundos","0"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["navigator.sendBeacon","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["ga.sendGaEvent","noopFunc"],["yt.config_.EXPERIMENT_FLAGS.web_bind_fetch","false"],["fapit.check","noopFunc"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];

const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3,681]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["kicker.de",[4,616]],["t-online.de",5],["whatfinger.com",6],["timesofindia.indiatimes.com",7],["economictimes.indiatimes.com",8],["userscloud.com",9],["motherless.com",10],["sueddeutsche.de",11],["watchanimesub.net",12],["wco.tv",12],["wcoanimesub.tv",12],["wcoforever.net",12],["freeviewmovies.com",12],["filehorse.com",12],["guidetnt.com",12],["sp-today.com",12],["linkvertise.com",12],["textbin.net",12],["eropaste.net",12],["pastebr.xyz",12],["getpaste.link",12],["sharetext.me",12],["note.sieuthuthuat.com",12],["elcriticodelatele.com",[12,258]],["gadgets.es",[12,258]],["amateurporn.co",[12,116]],["wiwo.de",13],["masteranime.tv",14],["alphaporno.com",[15,465]],["porngem.com",15],["uploadbank.com",[15,89]],["shortit.pw",[15,100]],["familyporn.tv",15],["cloudemb.com",[15,381]],["sbplay1.com",15],["id45.cyou",15],["85tube.com",[15,80]],["k1nk.co",15],["watchasians.cc",15],["soltoshindo.com",15],["dronedj.com",17],["nolive.me",18],["sankakucomplex.com",19],["player.glomex.com",20],["merkur.de",20],["tz.de",20],["hotpornfile.org",23],["player.tabooporns.com",23],["x69.ovh",23],["wiztube.xyz",23],["netu.frembed.fun",23],["multiup.us",23],["rpdrlatino.live",23],["peliculas8k.com",[23,24]],["video.q34r.org",23],["69x.online",23],["czxxx.org",23],["vtplayer.online",23],["netu.ac",23],["dirtyvideo.fun",24],["adbull.org",25],["mitly.us",25],["linkrex.net",25],["linx.cc",25],["oke.io",25],["dz4link.com",25],["linclik.com",25],["shrt10.com",25],["loptelink.com",25],["cut-fly.com",25],["linkfinal.com",25],["payskip.org",25],["cutpaid.com",25],["forexmab.com",25],["linkjust.com",25],["linkszia.co",25],["leechpremium.link",25],["icutlink.com",[25,121]],["oncehelp.com",25],["rgl.vn",25],["reqlinks.net",25],["bitlk.com",25],["qlinks.eu",25],["link.3dmili.com",25],["short-fly.com",25],["foxseotools.com",25],["pngit.live",25],["link.turkdown.com",25],["urlty.com",25],["7r6.com",25],["oko.sh",25],["ckk.ai",25],["fc.lc",25],["fstore.biz",25],["cuts-url.com",25],["eio.io",25],["exe.app",25],["exee.io",25],["exey.io",25],["skincarie.com",25],["exeo.app",25],["coinlyhub.com",[25,196]],["adsafelink.com",25],["aii.sh",25],["cybertechng.com",[25,209]],["cutdl.xyz",25],["iir.ai",25],["shorteet.com",[25,227]],["smoner.com",25],["gyanlight.com",25],["xpshort.com",25],["upshrink.com",25],["enit.in",[25,223]],["ez4short.com",25],["easysky.in",25],["veganab.co",25],["adrinolinks.in",25],["go.bloggingaro.com",25],["go.gyanitheme.com",25],["go.theforyou.in",25],["go.hipsonyc.com",25],["birdurls.com",25],["vipurl.in",25],["try2link.com",25],["jameeltips.us",25],["gainl.ink",25],["promo-visits.site",25],["satoshi-win.xyz",[25,306]],["shorterall.com",25],["encurtandourl.com",25],["forextrader.site",25],["postazap.com",25],["cety.app",25],["exego.app",[25,301]],["cutlink.net",25],["cutsy.net",25],["cutyurls.com",25],["cutty.app",25],["cutnet.net",25],["tinys.click",[25,209]],["cpm.icu",25],["panyshort.link",25],["enagato.com",25],["pandaznetwork.com",25],["tvi.la",25],["iir.la",25],["tii.la",25],["oei.la",25],["lnbz.la",[25,223]],["oii.la",25],["tpi.li",25],["recipestutorials.com",25],["shrinkforearn.in",25],["techyuth.xyz",25],["oii.io",25],["du-link.in",25],["atglinks.com",25],["thotpacks.xyz",25],["megaurl.in",25],["megafly.in",25],["simana.online",25],["fooak.com",25],["joktop.com",25],["evernia.site",25],["falpus.com",25],["link.paid4link.com",[25,314]],["exalink.fun",25],["indiamaja.com",25],["newshuta.in",25],["shortxlinks.com",25],["linksly.co",25],["pkr.pw",25],["imagenesderopaparaperros.com",25],["shortenbuddy.com",25],["apksvip.com",25],["4cash.me",25],["namaidani.com",25],["teknomuda.com",25],["miuiku.com",25],["savelink.site",25],["samaa-pro.com",25],["miklpro.com",25],["modapk.link",25],["1shorten.com",25],["ccurl.net",25],["linkpoi.me",25],["menjelajahi.com",25],["pewgame.com",25],["1link.vip",25],["haonguyen.top",25],["crazyblog.in",25],["gtlink.co",25],["link.tokenoto.com",25],["cutearn.net",25],["rshrt.com",25],["filezipa.com",25],["dz-linkk.com",25],["theblissempire.com",25],["finanzas-vida.com",25],["adurly.cc",25],["pix4link.com",25],["paid4.link",25],["link.asiaon.top",25],["go.gets4link.com",25],["download.sharenulled.net",25],["beingtek.com",25],["shorturl.unityassets4free.com",25],["disheye.com",25],["techymedies.com",25],["techysuccess.com",25],["za.gl",[25,138]],["bblink.com",25],["myad.biz",25],["swzz.xyz",25],["vevioz.com",25],["charexempire.com",25],["clk.asia",25],["egfly.xyz",25],["linka.click",25],["sturls.com",25],["myshrinker.com",25],["go.adinsurance.xyz",25],["snowurl.com",[25,209]],["netfile.cc",25],["link.insurglobal.xyz",25],["theconomy.me",25],["rocklink.in",25],["adinsurance.xyz",25],["insurglobal.xyz",25],["techgeek.digital",25],["download3s.net",25],["shortx.net",25],["musicc.xyz",25],["shortawy.com",25],["tlin.me",25],["apprepack.com",25],["up-load.one",25],["zuba.link",25],["news.speedynews.xyz",25],["golink.xaydungplus.com",25],["bestcash2020.com",25],["hoxiin.com",25],["technemo.xyz",25],["go.linkbnao.com",25],["link-yz.com",25],["paylinnk.com",25],["thizissam.in",25],["ier.ai",25],["bloggertheme.xyz",25],["adslink.pw",25],["novelssites.com",25],["links.medipost.org",25],["faucetcrypto.net",25],["short.freeltc.top",25],["trxking.xyz",25],["weadown.com",25],["m.bloggingguidance.com",25],["blog.onroid.com",25],["link.codevn.net",25],["upfilesurls.com",25],["shareus.site",25],["link4rev.site",25],["bloginguru.xyz",25],["celinks.net",25],["c2g.at",25],["shortzu.icu",25],["bitcosite.com",[25,478]],["cryptosh.pro",25],["sigmalinks.in",25],["link68.net",25],["traffic123.net",25],["windowslite.net",[25,209]],["viewfr.com",25],["cl1ca.com",25],["4br.me",25],["fir3.net",25],["kiddyshort.com",25],["watchmygf.me",[26,51]],["camwhorez.tv",[26,37,79,80]],["cambay.tv",[26,58,79,113,115,116,117,118]],["thotcity.su",26],["fpo.xxx",[26,58]],["sexemix.com",26],["heavyfetish.com",[26,547]],["you-porn.com",28],["youporngay.com",28],["youpornru.com",28],["9908ww.com",28],["adelaidepawnbroker.com",28],["bztube.com",28],["hotovs.com",28],["insuredhome.org",28],["nudegista.com",28],["pornluck.com",28],["vidd.se",28],["pornhub.com",28],["pornerbros.com",29],["freep.com",29],["porn.com",32],["tune.pk",33],["noticias.gospelmais.com.br",34],["techperiod.com",34],["viki.com",[35,36]],["sleazyneasy.com",[37,38,39]],["smutr.com",[37,192]],["watchdirty.to",[37,80,81,116]],["yourporngod.com",[37,38]],["javbangers.com",[37,353]],["camfox.com",37],["camthots.tv",[37,113]],["shegotass.info",37],["amateur8.com",37],["bigtitslust.com",37],["ebony8.com",37],["freeporn8.com",37],["lesbian8.com",37],["maturetubehere.com",37],["sortporn.com",37],["webcamvau.com",37],["motherporno.com",[37,38,58,115]],["tktube.com",37],["theporngod.com",[37,38]],["pornsocket.com",40],["luxuretv.com",41],["porndig.com",[42,43]],["webcheats.com.br",44],["ceesty.com",[45,46]],["gestyy.com",[45,46]],["corneey.com",46],["destyy.com",46],["festyy.com",46],["sh.st",46],["mitaku.net",46],["angrybirdsnest.com",47],["zrozz.com",47],["clix4btc.com",47],["4tests.com",47],["planet-explorers-isos.com",47],["business-standard.com",47],["goltelevision.com",47],["news-und-nachrichten.de",47],["laradiobbs.net",47],["urlaubspartner.net",47],["produktion.de",47],["cinemaxxl.de",47],["bladesalvador.com",47],["tempr.email",47],["katfile.com",47],["trust.zone",47],["cshort.org",47],["friendproject.net",47],["covrhub.com",47],["planetsuzy.org",48],["empflix.com",49],["freeplayervideo.com",50],["nazarickol.com",50],["player-cdn.com",50],["playhydrax.com",[50,239,240]],["alleneconomicmatter.com",50],["apinchcaseation.com",50],["bethshouldercan.com",50],["bigclatterhomesguideservice.com",50],["bradleyviewdoctor.com",50],["brookethoughi.com",50],["brucevotewithin.com",50],["cindyeyefinal.com",50],["denisegrowthwide.com",50],["donaldlineelse.com",50],["edwardarriveoften.com",50],["erikcoldperson.com",50],["evelynthankregion.com",50],["graceaddresscommunity.com",50],["heatherdiscussionwhen.com",50],["housecardsummerbutton.com",50],["jamessoundcost.com",50],["jamesstartstudent.com",50],["jamiesamewalk.com",50],["jasminetesttry.com",50],["jasonresponsemeasure.com",50],["jayservicestuff.com",50],["jessicaglassauthor.com",50],["johntryopen.com",50],["josephseveralconcern.com",50],["kennethofficialitem.com",50],["lisatrialidea.com",50],["lorimuchbenefit.com",50],["loriwithinfamily.com",50],["lukecomparetwo.com",50],["markstyleall.com",50],["michaelapplysome.com",50],["morganoperationface.com",50],["nectareousoverelate.com",50],["paulkitchendark.com",50],["rebeccaneverbase.com",50],["roberteachfinal.com",50],["robertplacespace.com",50],["ryanagoinvolve.com",50],["sandrataxeight.com",50],["seanshowcould.com",50],["sethniceletter.com",50],["shannonpersonalcost.com",50],["sharonwhiledemocratic.com",50],["stevenimaginelittle.com",50],["strawberriesporail.com",50],["susanhavekeep.com",50],["timberwoodanotia.com",50],["tinycat-voe-fashion.com",50],["toddpartneranimal.com",50],["troyyourlead.com",50],["uptodatefinishconference.com",50],["uptodatefinishconferenceroom.com",50],["vincentincludesuccessful.com",50],["voe.sx",50],["motphimtv.com",50],["rabbitstream.net",50],["projectfreetv.one",50],["transparentcalifornia.com",51],["deepbrid.com",52],["webnovel.com",53],["videosgay.me",[54,55]],["oneupload.to",55],["oneupload.online",55],["wishfast.top",55],["schwaebische.de",56],["8tracks.com",57],["3movs.com",58],["bravoerotica.net",[58,115]],["youx.xxx",58],["camclips.tv",[58,192]],["camflow.tv",[58,115,116,159,230]],["camhoes.tv",[58,113,115,116,159,230]],["xmegadrive.com",58],["xxxymovies.com",58],["xxxshake.com",58],["gayck.com",58],["xhand.com",[58,115]],["analdin.com",[58,115]],["revealname.com",59],["golfchannel.com",61],["telemundodeportes.com",61],["stream.nbcsports.com",61],["mathdf.com",61],["gamcore.com",62],["porcore.com",62],["69games.xxx",62],["javmix.app",62],["tecknity.com",63],["haaretz.co.il",64],["haaretz.com",64],["hungama.com",64],["a-o.ninja",64],["anime-odcinki.pl",64],["kumpulmanga.org",64],["shortgoo.blogspot.com",64],["tonanmedia.my.id",[64,500]],["yurasu.xyz",64],["isekaipalace.com",64],["vikistream.com",65],["eplayer.click",[65,66]],["mega4upload.com",[66,72]],["ennovelas.com",[66,72]],["n-tv.de",67],["brigitte.de",68],["stern.de",68],["foxsports.com.au",69],["canberratimes.com.au",69],["thesimsresource.com",70],["bdnewszh.com",72],["streamservicehd.click",72],["ctrl.blog",73],["sportlife.es",74],["finofilipino.org",75],["acortarm.xyz",76],["mysflink.blogspot.com",77],["assia.tv",78],["assia4.com",78],["assia24.com",78],["cwtvembeds.com",[80,114]],["xmateur.com",[80,81,116]],["camlovers.tv",80],["porntn.com",80],["pornissimo.org",80],["sexcams-24.com",[80,116]],["watchporn.to",[80,116]],["camwhorez.video",80],["footstockings.com",[80,81,116]],["multi.xxx",81],["worldofbitco.in",[82,83]],["weatherx.co.in",[82,83]],["getyourbitco.in",82],["sunbtc.space",82],["sbs.com.au",84],["ojogos.com.br",86],["powforums.com",87],["supforums.com",87],["studybullet.com",87],["usgamer.net",88],["recordonline.com",88],["freebitcoin.win",91],["e-monsite.com",91],["coindice.win",91],["sport-tv-guide.live",92],["temp-mails.com",93],["freiepresse.de",94],["investing.com",95],["mp3fiber.com",97],["chicoer.com",98],["dailybreeze.com",98],["dailybulletin.com",98],["dailynews.com",98],["delcotimes.com",98],["eastbaytimes.com",98],["macombdaily.com",98],["ocregister.com",98],["pasadenastarnews.com",98],["pe.com",98],["presstelegram.com",98],["redlandsdailyfacts.com",98],["reviewjournal.com",98],["santacruzsentinel.com",98],["saratogian.com",98],["sentinelandenterprise.com",98],["sgvtribune.com",98],["tampabay.com",98],["times-standard.com",98],["theoaklandpress.com",98],["trentonian.com",98],["twincities.com",98],["whittierdailynews.com",98],["bostonherald.com",98],["dailycamera.com",98],["sbsun.com",98],["dailydemocrat.com",98],["montereyherald.com",98],["orovillemr.com",98],["record-bee.com",98],["redbluffdailynews.com",98],["reporterherald.com",98],["thereporter.com",98],["timescall.com",98],["timesheraldonline.com",98],["ukiahdailyjournal.com",98],["dailylocal.com",98],["mercurynews.com",98],["suedkurier.de",99],["anysex.com",101],["vlist.se",102],["pornve.com",103],["coolrom.com.au",104],["pornohirsch.net",105],["marie-claire.es",106],["gamezhero.com",106],["flashgirlgames.com",106],["onlinesudoku.games",106],["mpg.football",106],["sssam.com",106],["globalnews.ca",107],["drinksmixer.com",108],["leitesculinaria.com",108],["fupa.net",109],["browardpalmbeach.com",110],["dallasobserver.com",110],["houstonpress.com",110],["miaminewtimes.com",110],["phoenixnewtimes.com",110],["westword.com",110],["nhentai.net",111],["nowtv.com.tr",112],["caminspector.net",113],["camwhoreshd.com",113],["camgoddess.tv",113],["gay4porn.com",115],["mypornhere.com",115],["camhub.cc",116],["sexwebvideo.com",116],["sexwebvideo.net",116],["love4porn.com",116],["thotvids.com",116],["watchmdh.to",116],["celebwhore.com",116],["cluset.com",116],["4kporn.xxx",116],["xhomealone.com",116],["lusttaboo.com",[116,424]],["hentai-moon.com",116],["mediapason.it",119],["linkspaid.com",119],["tuotromedico.com",119],["neoteo.com",119],["phoneswiki.com",119],["celebmix.com",119],["myneobuxportal.com",119],["oyungibi.com",119],["25yearslatersite.com",119],["jeshoots.com",120],["techhx.com",120],["karanapk.com",120],["flashplayer.fullstacks.net",122],["cloudapps.herokuapp.com",122],["texteditor.nsspot.net",122],["youfiles.herokuapp.com",122],["temp-mail.org",123],["javhdporn.net",124],["javstream.top",124],["comnuan.com",125],["veedi.com",126],["battleboats.io",126],["fruitlab.com",127],["acetack.com",127],["androidquest.com",127],["apklox.com",127],["chhaprawap.in",127],["gujarativyakaran.com",127],["kashmirstudentsinformation.in",127],["kisantime.com",127],["shetkaritoday.in",127],["pastescript.com",127],["trimorspacks.com",127],["updrop.link",127],["haddoz.net",127],["garoetpos.com",127],["stiletv.it",128],["hqtv.biz",130],["liveuamap.com",131],["muvibg.com",131],["audycje.tokfm.pl",132],["hulu.com",[133,134,135]],["shush.se",136],["allkpop.com",137],["pickcrackpasswords.blogspot.com",139],["kfrfansub.com",140],["thuglink.com",140],["voipreview.org",140],["illicoporno.com",141],["lavoixdux.com",141],["tonpornodujour.com",141],["jacquieetmichel.net",141],["jacquieetmicheltv.net",[141,248,249]],["swame.com",141],["vosfemmes.com",141],["voyeurfrance.net",141],["hanime.tv",142],["pogo.com",143],["cloudvideo.tv",144],["legionjuegos.org",145],["legionpeliculas.org",145],["legionprogramas.org",145],["16honeys.com",146],["elespanol.com",147],["remodelista.com",148],["coolmathgames.com",[149,150,151,569]],["audiofanzine.com",152],["hitokin.net",154],["developerinsider.co",155],["ilprimatonazionale.it",156],["hotabis.com",156],["root-nation.com",156],["italpress.com",156],["airsoftmilsimnews.com",156],["artribune.com",156],["thehindu.com",157],["cambro.tv",[158,159]],["nibelungen-kurier.de",160],["adfoc.us",162],["techyember.com",162],["remixbass.com",162],["techipop.com",162],["quickimageconverter.com",162],["mastharyana.com",162],["tea-coffee.net",162],["spatsify.com",162],["newedutopics.com",162],["getviralreach.in",162],["edukaroo.com",162],["funkeypagali.com",162],["careersides.com",162],["nayisahara.com",162],["wikifilmia.com",162],["infinityskull.com",162],["viewmyknowledge.com",162],["iisfvirtual.in",162],["starxinvestor.com",162],["jkssbalerts.com",162],["myprivatejobs.com",[162,302]],["wikitraveltips.com",[162,302]],["amritadrino.com",[162,302]],["sahlmarketing.net",162],["filmypoints.in",162],["fitnessholic.net",162],["moderngyan.com",162],["sattakingcharts.in",162],["freshbhojpuri.com",162],["bgmi32bitapk.in",162],["bankshiksha.in",162],["earn.mpscstudyhub.com",162],["earn.quotesopia.com",162],["money.quotesopia.com",162],["best-mobilegames.com",162],["learn.moderngyan.com",162],["bharatsarkarijobalert.com",162],["quotesopia.com",162],["creditsgoal.com",162],["techacode.com",162],["trickms.com",162],["ielts-isa.edu.vn",162],["sptfy.be",162],["mcafee-com.com",[162,301]],["pianetamountainbike.it",163],["barchart.com",164],["modelisme.com",165],["parasportontario.ca",165],["prescottenews.com",165],["nrj-play.fr",166],["hackingwithreact.com",167],["gutekueche.at",168],["eplfootballmatch.com",169],["peekvids.com",170],["playvids.com",170],["pornflip.com",170],["redensarten-index.de",171],["vw-page.com",172],["viz.com",[173,174]],["0rechner.de",175],["configspc.com",176],["xopenload.me",176],["uptobox.com",176],["uptostream.com",176],["onepiece-tube.com",177],["japgay.com",178],["mega-debrid.eu",179],["dreamdth.com",180],["diaridegirona.cat",182],["diariodeibiza.es",182],["diariodemallorca.es",182],["diarioinformacion.com",182],["eldia.es",182],["emporda.info",182],["farodevigo.es",182],["laopinioncoruna.es",182],["laopiniondemalaga.es",182],["laopiniondemurcia.es",182],["laopiniondezamora.es",182],["laprovincia.es",182],["levante-emv.com",182],["mallorcazeitung.es",182],["regio7.cat",182],["superdeporte.es",182],["playpaste.com",183],["player.rtl2.de",184],["freetutorialsus.com",185],["vidlii.com",[185,201]],["iammagnus.com",185],["dailyvideoreports.net",185],["unityassets4free.com",185],["cnbc.com",186],["puzzles.msn.com",187],["metro.us",187],["newsobserver.com",187],["arkadiumhosted.com",187],["firefaucet.win",189],["55k.io",190],["filelions.online",190],["stmruby.com",190],["direct-link.net",191],["direkt-wissen.com",191],["link-to.net",191],["fullhdxxx.com",193],["pornclassic.tube",194],["tubepornclassic.com",194],["etonline.com",195],["creatur.io",195],["drphil.com",195],["urbanmilwaukee.com",195],["ontiva.com",195],["hideandseek.world",195],["myabandonware.com",195],["kendam.com",195],["wttw.com",195],["synonyms.com",195],["definitions.net",195],["hostmath.com",195],["camvideoshub.com",195],["minhaconexao.com.br",195],["home-made-videos.com",197],["pxrnxx.xyz",197],["amateur-couples.com",197],["slutdump.com",197],["produsat.com",199],["12thman.com",201],["acusports.com",201],["atlantic10.com",201],["auburntigers.com",201],["baylorbears.com",201],["bceagles.com",201],["bgsufalcons.com",201],["big12sports.com",201],["bigten.org",201],["bradleybraves.com",201],["butlersports.com",201],["cmumavericks.com",201],["conferenceusa.com",201],["cyclones.com",201],["dartmouthsports.com",201],["daytonflyers.com",201],["dbupatriots.com",201],["dbusports.com",201],["denverpioneers.com",201],["fduknights.com",201],["fgcuathletics.com",201],["fightinghawks.com",201],["fightingillini.com",201],["floridagators.com",201],["friars.com",201],["friscofighters.com",201],["gamecocksonline.com",201],["goarmywestpoint.com",201],["gobison.com",201],["goblueraiders.com",201],["gobobcats.com",201],["gocards.com",201],["gocreighton.com",201],["godeacs.com",201],["goexplorers.com",201],["goetbutigers.com",201],["gofrogs.com",201],["gogriffs.com",201],["gogriz.com",201],["golobos.com",201],["gomarquette.com",201],["gopack.com",201],["gophersports.com",201],["goprincetontigers.com",201],["gopsusports.com",201],["goracers.com",201],["goshockers.com",201],["goterriers.com",201],["gotigersgo.com",201],["gousfbulls.com",201],["govandals.com",201],["gowyo.com",201],["goxavier.com",201],["gozags.com",201],["gozips.com",201],["griffinathletics.com",201],["guhoyas.com",201],["gwusports.com",201],["hailstate.com",201],["hamptonpirates.com",201],["hawaiiathletics.com",201],["hokiesports.com",201],["huskers.com",201],["icgaels.com",201],["iuhoosiers.com",201],["jsugamecocksports.com",201],["longbeachstate.com",201],["loyolaramblers.com",201],["lrtrojans.com",201],["lsusports.net",201],["morrisvillemustangs.com",201],["msuspartans.com",201],["muleriderathletics.com",201],["mutigers.com",201],["navysports.com",201],["nevadawolfpack.com",201],["niuhuskies.com",201],["nkunorse.com",201],["nuhuskies.com",201],["nusports.com",201],["okstate.com",201],["olemisssports.com",201],["omavs.com",201],["ovcsports.com",201],["owlsports.com",201],["purduesports.com",201],["redstormsports.com",201],["richmondspiders.com",201],["sfajacks.com",201],["shupirates.com",201],["siusalukis.com",201],["smcgaels.com",201],["smumustangs.com",201],["soconsports.com",201],["soonersports.com",201],["themw.com",201],["tulsahurricane.com",201],["txst.com",201],["txstatebobcats.com",201],["ubbulls.com",201],["ucfknights.com",201],["ucirvinesports.com",201],["uconnhuskies.com",201],["uhcougars.com",201],["uicflames.com",201],["umterps.com",201],["uncwsports.com",201],["unipanthers.com",201],["unlvrebels.com",201],["uoflsports.com",201],["usdtoreros.com",201],["utahstateaggies.com",201],["utepathletics.com",201],["utrockets.com",201],["uvmathletics.com",201],["uwbadgers.com",201],["villanova.com",201],["wkusports.com",201],["wmubroncos.com",201],["woffordterriers.com",201],["1pack1goal.com",201],["bcuathletics.com",201],["bubraves.com",201],["goblackbears.com",201],["golightsgo.com",201],["gomcpanthers.com",201],["goutsa.com",201],["mercerbears.com",201],["pirateblue.com",201],["pirateblue.net",201],["pirateblue.org",201],["quinnipiacbobcats.com",201],["towsontigers.com",201],["tribeathletics.com",201],["tribeclub.com",201],["utepminermaniacs.com",201],["utepminers.com",201],["wkutickets.com",201],["aopathletics.org",201],["atlantichockeyonline.com",201],["bigsouthnetwork.com",201],["bigsouthsports.com",201],["chawomenshockey.com",201],["dbupatriots.org",201],["drakerelays.org",201],["ecac.org",201],["ecacsports.com",201],["emueagles.com",201],["emugameday.com",201],["gculopes.com",201],["godrakebulldog.com",201],["godrakebulldogs.com",201],["godrakebulldogs.net",201],["goeags.com",201],["goislander.com",201],["goislanders.com",201],["gojacks.com",201],["gomacsports.com",201],["gseagles.com",201],["hubison.com",201],["iowaconference.com",201],["ksuowls.com",201],["lonestarconference.org",201],["mascac.org",201],["midwestconference.org",201],["mountaineast.org",201],["niu-pack.com",201],["nulakers.ca",201],["oswegolakers.com",201],["ovcdigitalnetwork.com",201],["pacersports.com",201],["rmacsports.org",201],["rollrivers.com",201],["samfordsports.com",201],["uncpbraves.com",201],["usfdons.com",201],["wiacsports.com",201],["alaskananooks.com",201],["broncathleticfund.com",201],["cameronaggies.com",201],["columbiacougars.com",201],["etownbluejays.com",201],["gobadgers.ca",201],["golancers.ca",201],["gometrostate.com",201],["gothunderbirds.ca",201],["kentstatesports.com",201],["lehighsports.com",201],["lopers.com",201],["lycoathletics.com",201],["lycomingathletics.com",201],["maraudersports.com",201],["mauiinvitational.com",201],["msumavericks.com",201],["nauathletics.com",201],["nueagles.com",201],["nwusports.com",201],["oceanbreezenyc.org",201],["patriotathleticfund.com",201],["pittband.com",201],["principiaathletics.com",201],["roadrunnersathletics.com",201],["sidearmsocial.com",201],["snhupenmen.com",201],["stablerarena.com",201],["stoutbluedevils.com",201],["uwlathletics.com",201],["yumacs.com",201],["collegefootballplayoff.com",201],["csurams.com",201],["cubuffs.com",201],["gobearcats.com",201],["gohuskies.com",201],["mgoblue.com",201],["osubeavers.com",201],["pittsburghpanthers.com",201],["rolltide.com",201],["texassports.com",201],["thesundevils.com",201],["uclabruins.com",201],["wvuathletics.com",201],["wvusports.com",201],["arizonawildcats.com",201],["calbears.com",201],["cuse.com",201],["georgiadogs.com",201],["goducks.com",201],["goheels.com",201],["gostanford.com",201],["insidekstatesports.com",201],["insidekstatesports.info",201],["insidekstatesports.net",201],["insidekstatesports.org",201],["k-stateathletics.com",201],["k-statefootball.net",201],["k-statefootball.org",201],["k-statesports.com",201],["k-statesports.net",201],["k-statesports.org",201],["k-statewomenshoops.com",201],["k-statewomenshoops.net",201],["k-statewomenshoops.org",201],["kstateathletics.com",201],["kstatefootball.net",201],["kstatefootball.org",201],["kstatesports.com",201],["kstatewomenshoops.com",201],["kstatewomenshoops.net",201],["kstatewomenshoops.org",201],["ksuathletics.com",201],["ksusports.com",201],["scarletknights.com",201],["showdownforrelief.com",201],["syracusecrunch.com",201],["texastech.com",201],["theacc.com",201],["ukathletics.com",201],["usctrojans.com",201],["utahutes.com",201],["utsports.com",201],["wsucougars.com",201],["tricksplit.io",201],["fangraphs.com",202],["4players.de",[203,289]],["buffed.de",203],["gamesaktuell.de",203],["gamezone.de",203],["pcgames.de",203],["videogameszone.de",203],["tvspielfilm.de",[204,205,206,207]],["tvtoday.de",[204,205,206,207]],["chip.de",[204,205,206,207]],["focus.de",[204,205,206,207]],["planetaminecraft.com",208],["cravesandflames.com",209],["codesnse.com",209],["link.paid4file.com",209],["flyad.vip",209],["lapresse.ca",210],["kolyoom.com",211],["ilovephd.com",211],["negumo.com",212],["games.wkb.jp",[213,214]],["fandom.com",[215,586,587]],["kenshi.fandom.com",216],["hausbau-forum.de",217],["homeairquality.org",217],["faucettronn.click",217],["fake-it.ws",218],["laksa19.github.io",219],["1shortlink.com",220],["nesia.my.id",221],["u-s-news.com",222],["makemoneywithurl.com",223],["junkyponk.com",223],["healthfirstweb.com",223],["vocalley.com",223],["yogablogfit.com",223],["howifx.com",[223,461]],["en.financerites.com",223],["mythvista.com",223],["livenewsflix.com",223],["cureclues.com",223],["apekite.com",223],["host-buzz.com",223],["insmyst.com",223],["wp2host.com",223],["blogtechh.com",223],["techbixby.com",223],["blogmyst.com",223],["resetoff.pl",224],["sexodi.com",224],["cdn77.org",225],["howtofixwindows.com",226],["3sexporn.com",227],["momxxxsex.com",227],["myfreevintageporn.com",227],["penisbuyutucum.net",227],["ujszo.com",228],["newsmax.com",229],["bobs-tube.com",230],["nadidetarifler.com",231],["siz.tv",231],["suzylu.co.uk",[232,233]],["onworks.net",234],["yabiladi.com",234],["downloadsoft.net",235],["pixsera.net",236],["testlanguages.com",237],["newsinlevels.com",237],["videosinlevels.com",237],["cbs.com",238],["paramountplus.com",238],["abysscdn.com",[239,240]],["buktube.com",241],["fullxh.com",241],["galleryxh.site",241],["megaxh.com",241],["movingxh.world",241],["seexh.com",241],["unlockxh4.com",241],["valuexh.life",241],["xhaccess.com",241],["xhadult2.com",241],["xhadult3.com",241],["xhadult4.com",241],["xhadult5.com",241],["xhamster46.com",241],["xhamsterporno.mx",241],["xhbig.com",241],["xhbranch5.com",241],["xhchannel.com",241],["xhchannel2.com",241],["xhdate.world",241],["xhday.com",241],["xhday1.com",241],["xhlease.world",241],["xhmoon5.com",241],["xhofficial.com",241],["xhopen.com",241],["xhplanet1.com",241],["xhplanet2.com",241],["xhreal2.com",241],["xhreal3.com",241],["xhspot.com",241],["xhtab2.com",241],["xhtab4.com",241],["xhtotal.com",241],["xhtree.com",241],["xhvictory.com",241],["xhwebsite.com",241],["xhwebsite2.com",241],["xhwebsite5.com",241],["xhwide1.com",241],["xhwide2.com",241],["xhwide5.com",241],["xhxh3.xyz",241],["lightnovelworld.com",242],["megadescarga.net",[243,244,245,246]],["megadescargas.net",[243,244,245,246]],["hentaihaven.xxx",247],["jacquieetmicheltv2.net",249],["fcportables.com",[251,252]],["emurom.net",253],["freethesaurus.com",[254,255]],["thefreedictionary.com",[254,255]],["oeffentlicher-dienst.info",256],["ultimate-guitar.com",257],["teachmemicro.com",258],["willcycle.com",258],["2ndrun.tv",258],["rackusreads.com",258],["xyzsports111.xyz",[259,260,261]],["xyzsports112.xyz",[259,260,261]],["xyzsports113.xyz",[259,260,261]],["xyzsports114.xyz",[259,260,261]],["xyzsprtsfrmr1.site",[259,260,261]],["xyzsprtsfrmr2.site",[259,260,261]],["claimbits.net",262],["sexyscope.net",263],["recherche-ebook.fr",265],["easymc.io",265],["zonebourse.com",266],["pink-sluts.net",267],["madoohd.com",268],["andhrafriends.com",269],["benzinpreis.de",270],["turtleviplay.xyz",271],["defenseone.com",272],["govexec.com",272],["nextgov.com",272],["route-fifty.com",272],["sharing.wtf",273],["wetter3.de",274],["arahdrive.com",275],["aiimgvlog.fun",[275,301]],["esportivos.fun",276],["cosmonova-broadcast.tv",277],["soccerinhd.com",278],["techedubyte.com",278],["hartvannederland.nl",279],["shownieuws.nl",279],["vandaaginside.nl",279],["rock.porn",[280,281]],["videzz.net",[282,283]],["ezaudiobookforsoul.com",284],["club386.com",285],["androidpolice.com",286],["cbr.com",286],["collider.com",286],["dualshockers.com",286],["gamerant.com",286],["howtogeek.com",286],["makeuseof.com",286],["movieweb.com",286],["screenrant.com",286],["thegamer.com",286],["xda-developers.com",286],["banned.video",286],["madmaxworld.tv",286],["wheelofgold.com",287],["littlebigsnake.com",288],["onlinesoccermanager.com",289],["njav.tv",290],["netfapx.com",290],["easyfun.gg",291],["uploadmall.com",292],["jiocinema.com",292],["rapid-cloud.co",292],["smailpro.com",293],["ilgazzettino.it",294],["ilmessaggero.it",294],["3bmeteo.com",[295,296]],["mconverter.eu",297],["lover937.net",298],["10gb.vn",299],["pes6.es",300],["starkroboticsfrc.com",301],["sinonimos.de",301],["antonimos.de",301],["quesignifi.ca",301],["tiktokrealtime.com",301],["tiktokcounter.net",301],["tpayr.xyz",301],["poqzn.xyz",301],["ashrfd.xyz",301],["rezsx.xyz",301],["tryzt.xyz",301],["ashrff.xyz",301],["rezst.xyz",301],["dawenet.com",301],["erzar.xyz",301],["waezm.xyz",301],["waezg.xyz",301],["blackwoodacademy.org",301],["cryptednews.space",301],["vivuq.com",301],["swgop.com",301],["vbnmll.com",301],["telcoinfo.online",301],["dshytb.com",301],["fitdynamos.com",[301,303]],["btcbitco.in",[301,305]],["btcsatoshi.net",301],["cempakajaya.com",301],["crypto4yu.com",301],["readbitcoin.org",301],["wiour.com",301],["finish.addurl.biz",301],["laweducationinfo.com",301],["savemoneyinfo.com",301],["worldaffairinfo.com",301],["godstoryinfo.com",301],["successstoryinfo.com",301],["cxissuegk.com",301],["learnmarketinfo.com",301],["bhugolinfo.com",301],["armypowerinfo.com",301],["rsadnetworkinfo.com",301],["rsinsuranceinfo.com",301],["rsfinanceinfo.com",301],["rsgamer.app",301],["rssoftwareinfo.com",301],["rshostinginfo.com",301],["rseducationinfo.com",301],["phonereviewinfo.com",301],["makeincomeinfo.com",301],["gknutshell.com",301],["vichitrainfo.com",301],["workproductivityinfo.com",301],["dopomininfo.com",301],["hostingdetailer.com",301],["fitnesssguide.com",301],["tradingfact4u.com",301],["cryptofactss.com",301],["softwaredetail.com",301],["artoffocas.com",301],["insurancesfact.com",301],["advertisingexcel.com",301],["allcryptoz.net",301],["batmanfactor.com",301],["beautifulfashionnailart.com",301],["crewbase.net",301],["documentaryplanet.xyz",301],["crewus.net",301],["gametechreviewer.com",301],["midebalonu.net",301],["misterio.ro",301],["phineypet.com",301],["seory.xyz",301],["shinbhu.net",301],["shinchu.net",301],["substitutefor.com",301],["talkforfitness.com",301],["thefitbrit.co.uk",301],["thumb8.net",301],["thumb9.net",301],["topcryptoz.net",301],["uniqueten.net",301],["ultraten.net",301],["exactpay.online",301],["kiddyearner.com",301],["luckydice.net",302],["adarima.org",302],["tieutietkiem.com",302],["weatherwx.com",302],["sattaguess.com",302],["winshell.de",302],["rosasidan.ws",302],["modmakers.xyz",302],["gamepure.in",302],["warrenrahul.in",302],["austiblox.net",302],["upiapi.in",302],["myownguess.in",302],["networkhint.com",302],["watchhentai.net",302],["thichcode.net",302],["texturecan.com",302],["tikmate.app",[302,537]],["4funbox.com",304],["nephobox.com",304],["1024tera.com",304],["blog.cryptowidgets.net",305],["blog.insurancegold.in",305],["blog.wiki-topia.com",305],["blog.coinsvalue.net",305],["blog.cookinguide.net",305],["blog.freeoseocheck.com",305],["blog24.me",305],["bildirim.link",307],["appsbull.com",308],["diudemy.com",308],["maqal360.com",308],["lifesurance.info",309],["akcartoons.in",310],["cybercityhelp.in",310],["infokeeda.xyz",311],["webzeni.com",311],["dl.apkmoddone.com",312],["phongroblox.com",312],["apkmodvn.com",313],["streamelements.com",[315,316]],["share.hntv.tv",[316,655,656,657]],["forum.dji.com",[316,657]],["unionpayintl.com",[316,656]],["arcai.com",317],["my-code4you.blogspot.com",318],["flickr.com",319],["firefile.cc",320],["pestleanalysis.com",320],["kochamjp.pl",320],["tutorialforlinux.com",320],["whatsaero.com",320],["animeblkom.net",[320,336]],["blkom.com",320],["globes.co.il",[321,322]],["jardiner-malin.fr",323],["tw-calc.net",324],["ohmybrush.com",325],["talkceltic.net",326],["mentalfloss.com",327],["uprafa.com",328],["cube365.net",329],["nightfallnews.com",[330,331]],["wwwfotografgotlin.blogspot.com",332],["freelistenonline.com",332],["badassdownloader.com",333],["quickporn.net",334],["yellowbridge.com",335],["aosmark.com",337],["atozmath.com",[339,340,341,342,343,344,345]],["newyorker.com",346],["brighteon.com",347],["more.tv",348],["video1tube.com",349],["alohatube.xyz",349],["fshost.me",350],["link.cgtips.org",351],["hentaicloud.com",352],["paperzonevn.com",354],["hentaienglish.com",355],["hentaiporno.xxx",355],["venge.io",[356,357]],["btcbux.io",358],["its.porn",[359,360]],["atv.at",361],["kusonime.com",[362,363]],["jetpunk.com",365],["imgur.com",[366,367,548]],["hentai-party.com",368],["hentaicomics.pro",368],["xxx-comics.pro",368],["genshinimpactcalculator.com",371],["mysexgames.com",372],["embed.indavideo.hu",375],["gdr-online.com",376],["mmm.dk",377],["iqiyi.com",[378,379,529]],["m.iqiyi.com",380],["japopav.tv",381],["lvturbo.com",381],["nbcolympics.com",382],["apkhex.com",383],["indiansexstories2.net",384],["issstories.xyz",384],["1340kbbr.com",385],["gorgeradio.com",385],["kduk.com",385],["kedoam.com",385],["kejoam.com",385],["kelaam.com",385],["khsn1230.com",385],["kjmx.rocks",385],["kloo.com",385],["klooam.com",385],["klykradio.com",385],["kmed.com",385],["kmnt.com",385],["kool991.com",385],["kpnw.com",385],["kppk983.com",385],["krktcountry.com",385],["ktee.com",385],["kwro.com",385],["kxbxfm.com",385],["thevalley.fm",385],["quizlet.com",386],["dsocker1234.blogspot.com",387],["schoolcheats.net",[388,389]],["mgnet.xyz",390],["designtagebuch.de",391],["pixroute.com",392],["uploady.io",393],["calculator-online.net",394],["porngames.club",395],["sexgames.xxx",395],["111.90.159.132",396],["battleplan.news",396],["mobile-tracker-free.com",397],["pfps.gg",398],["ac-illust.com",[399,400]],["photo-ac.com",[399,400]],["vlxxs.net",401],["rapelust.com",401],["vtube.to",401],["vtplay.net",401],["desitelugusex.com",401],["xvideos-downloader.net",401],["xxxvideotube.net",401],["sdefx.cloud",401],["nozomi.la",401],["moviesonlinefree.net",401],["social-unlock.com",402],["superpsx.com",403],["ninja.io",404],["sourceforge.net",405],["samfirms.com",406],["huffpost.com",407],["ingles.com",408],["spanishdict.com",408],["surfline.com",[409,410]],["play.tv3.ee",411],["play.tv3.lt",411],["play.tv3.lv",411],["tv3play.skaties.lv",411],["trendyoum.com",412],["bulbagarden.net",413],["moviestars.to",414],["hollywoodlife.com",415],["mat6tube.com",416],["textstudio.co",417],["newtumbl.com",418],["aruble.net",420],["nevcoins.club",421],["mail.com",422],["oggi.it",[425,426]],["manoramamax.com",425],["video.gazzetta.it",[425,426]],["mangakita.id",427],["mangakita.net",427],["poscishd.online",428],["avpgalaxy.net",429],["mhma12.tech",430],["panda-novel.com",431],["zebranovel.com",431],["lightsnovel.com",431],["eaglesnovel.com",431],["pandasnovel.com",431],["zadfaucet.com",432],["ewrc-results.com",433],["kizi.com",434],["cyberscoop.com",435],["fedscoop.com",435],["canale.live",436],["indiatimes.com",437],["netzwelt.de",438],["mafiatown.pl",[439,440]],["jeep-cj.com",441],["sponsorhunter.com",442],["cloudcomputingtopics.net",443],["likecs.com",444],["tiscali.it",445],["linkspy.cc",446],["tutelehd3.xyz",447],["dirty.pink",[448,449,450]],["adshnk.com",451],["chattanoogan.com",452],["adsy.pw",453],["playstore.pw",453],["socialmediagirls.com",454],["windowspro.de",455],["snapinsta.app",456],["tvtv.ca",457],["tvtv.us",457],["ipalibrary.me",458],["mydaddy.cc",459],["roadtrippin.fr",460],["vavada5com.com",461],["redketchup.io",[462,463,464]],["anyporn.com",[465,480]],["bravoporn.com",465],["bravoteens.com",465],["crocotube.com",465],["hellmoms.com",465],["hellporno.com",465],["sex3.com",465],["tubewolf.com",465],["xbabe.com",465],["xcum.com",465],["zedporn.com",465],["imagetotext.info",466],["infokik.com",467],["freepik.com",468],["ddwloclawek.pl",[469,470]],["deezer.com",471],["my-subs.co",472],["plaion.com",473],["slideshare.net",[474,475]],["ustreasuryyieldcurve.com",476],["businesssoftwarehere.com",477],["goo.st",477],["freevpshere.com",477],["softwaresolutionshere.com",477],["staige.tv",481],["in-jpn.com",482],["oninet.ne.jp",482],["xth.jp",482],["androidadult.com",483],["streamvid.net",484],["watchtv24.com",485],["cellmapper.net",486],["medscape.com",487],["newscon.org",[488,489]],["arkadium.com",490],["bembed.net",491],["elbailedeltroleo.site",491],["embedv.net",491],["fslinks.org",491],["listeamed.net",491],["v6embed.xyz",491],["vgplayer.xyz",491],["vid-guard.com",491],["vidguard.online",491],["app.blubank.com",492],["mobileweb.bankmellat.ir",492],["sportdeutschland.tv",493],["kcra.com",493],["wcvb.com",493],["chat.nrj.fr",494],["ccthesims.com",501],["chromeready.com",501],["coursedrive.org",501],["dtbps3games.com",501],["illustratemagazine.com",501],["uknip.co.uk",501],["vod.pl",502],["megadrive-emulator.com",503],["animesaga.in",506],["moviesapi.club",506],["bestx.stream",506],["watchx.top",506],["digimanie.cz",507],["svethardware.cz",507],["srvy.ninja",508],["drawer-opportunity-i-243.site",509],["tchatche.com",510],["cnn.com",[511,512,513]],["edmdls.com",514],["freshremix.net",514],["scenedl.org",514],["trakt.tv",515],["client.falixnodes.net",516],["shroomers.app",517],["classicalradio.com",518],["di.fm",518],["jazzradio.com",518],["radiotunes.com",518],["rockradio.com",518],["zenradio.com",518],["pc-builds.com",519],["qtoptens.com",519],["reuters.com",519],["today.com",519],["videogamer.com",519],["wrestlinginc.com",519],["gbatemp.net",519],["movie-th.tv",520],["iwanttfc.com",521],["nutraingredients-asia.com",522],["nutraingredients-latam.com",522],["nutraingredients-usa.com",522],["nutraingredients.com",522],["mavenarts.in",523],["ozulscansen.com",524],["nexusmods.com",525],["fitnessbr.click",526],["minhareceita.xyz",526],["doomied.monster",527],["lookmovie2.to",527],["royalroad.com",528],["biletomat.pl",530],["hextank.io",[531,532]],["filmizlehdfilm.com",[533,534,535,536]],["fullfilmizle.cc",[533,534,535,536]],["sagewater.com",538],["redlion.net",538],["satdl.com",539],["vidstreaming.xyz",540],["everand.com",541],["myradioonline.pl",542],["tacobell.com",544],["zefoy.com",545],["cnet.com",546],["natgeotv.com",549],["spankbang.com",550],["globo.com",551],["wayfair.com",552],["br.de",553],["indeed.com",554],["pasteboard.co",555],["clickhole.com",556],["deadspin.com",556],["gizmodo.com",556],["jalopnik.com",556],["jezebel.com",556],["kotaku.com",556],["lifehacker.com",556],["splinternews.com",556],["theinventory.com",556],["theonion.com",556],["theroot.com",556],["thetakeout.com",556],["pewresearch.org",556],["los40.com",[557,558]],["as.com",558],["telegraph.co.uk",[559,560]],["poweredbycovermore.com",[559,609]],["lumens.com",[559,609]],["verizon.com",561],["humanbenchmark.com",562],["politico.com",563],["officedepot.co.cr",[564,565]],["usnews.com",568],["factable.com",570],["zee5.com",571],["gala.fr",572],["geo.fr",572],["voici.fr",572],["gloucestershirelive.co.uk",573],["arsiv.mackolik.com",574],["jacksonguitars.com",575],["scandichotels.com",576],["stylist.co.uk",577],["nettiauto.com",578],["thaiairways.com",[579,580]],["cerbahealthcare.it",[581,582]],["futura-sciences.com",[581,598]],["tiendaenlinea.claro.com.ni",[583,584]],["tieba.baidu.com",585],["grasshopper.com",[588,589]],["epson.com.cn",[590,591,592,593]],["oe24.at",[594,595]],["szbz.de",594],["platform.autods.com",[596,597]],["wikihow.com",599],["citibank.com.sg",600],["uol.com.br",[601,602,603,604,605]],["gazzetta.gr",606],["digicol.dpm.org.cn",[607,608]],["virginmediatelevision.ie",610],["larazon.es",[611,612]],["waitrosecellar.com",[613,614,615]],["sharpen-free-design-generator.netlify.app",[617,618]],["help.cashctrl.com",[619,620]],["gry-online.pl",621],["vidaextra.com",622],["commande.rhinov.pro",[623,624]],["ecom.wixapps.net",[623,624]],["tipranks.com",[625,626]],["iceland.co.uk",[627,628,629]],["socket.pearsoned.com",630],["tntdrama.com",[631,632]],["mobile.de",[633,634]],["ioe.vn",[635,636]],["geiriadur.ac.uk",[635,639]],["welsh-dictionary.ac.uk",[635,639]],["bikeportland.org",[637,638]],["biologianet.com",[602,603,604]],["10play.com.au",[640,641]],["sunshine-live.de",[642,643]],["whatismyip.com",[644,645]],["myfitnesspal.com",646],["netoff.co.jp",[647,648]],["clickjogos.com.br",651],["bristan.com",[652,653]],["zillow.com",654],["optimum.net",[658,659]],["investor-web.hdfcfund.com",660],["user.guancha.cn",[661,662]],["sosovalue.com",663],["bandyforbundet.no",[664,665]],["tatacommunications.com",666],["suamusica.com.br",[667,668,669]],["macrotrends.net",[670,671]],["code.world",672],["smartcharts.net",672],["topgear.com",673],["eservice.directauto.com",[674,675]],["nbcsports.com",676],["standard.co.uk",677],["pruefernavi.de",[678,679]],["17track.net",680],["poophq.com",682],["veev.to",682],["uber.com",[683,684]],["jdsports.com",[683,684]],["engadget.com",[683,684]],["yahoo.com",[683,684]],["techcrunch.com",[683,684]],["rivals.com",[683,684]],["kkrt.com",[683,684]],["crunchyroll.com",[683,684]],["dnb.com",[683,684]],["dnb.co.uk",[683,684]],["weather.com",[683,684]],["ubereats.com",[683,684]],["usatoday.com",685]]);

const entitiesMap = new Map([["watch-series",9],["watchseries",9],["vev",9],["vidop",9],["vidup",9],["starmusiq",12],["wcofun",12],["kissasian",14],["gogoanime",[14,50]],["1movies",[14,17]],["xmovies8",14],["0123movies",14],["gostream",14],["gomovies",14],["primewire",15],["streanplay",[15,16]],["sbplay",15],["milfnut",15],["sxyprn",21],["hqq",[22,23]],["waaw",[23,24]],["younetu",23],["vvtplayer",23],["123link",25],["adshort",25],["linkshorts",25],["adsrt",25],["vinaurl",25],["adfloz",25],["dutchycorp",25],["shortearn",25],["pingit",25],["shrink",25],["tmearn",25],["megalink",25],["miniurl",25],["gplinks",25],["clk",25],["pureshort",25],["shrinke",25],["shrinkme",25],["link1s",25],["shortzzy",25],["shorttey",[25,195]],["lite-link",25],["adcorto",25],["zshort",25],["upfiles",25],["linkfly",25],["wplink",25],["seulink",25],["encurtalink",25],["camwhores",[26,37,79,80,81]],["tube8",[27,28]],["youporn",28],["redtube",28],["pornhub",[28,181]],["upornia",[30,31]],["fmovies",50],["streamwish",[54,55]],["xtits",[58,115]],["pouvideo",60],["povvideo",60],["povw1deo",60],["povwideo",60],["powv1deo",60],["powvibeo",60],["powvideo",60],["powvldeo",60],["plyjam",[65,66]],["fxporn69",71],["vipbox",72],["viprow",72],["desbloqueador",76],["xberuang",77],["teknorizen",77],["subtorrents",85],["subtorrents1",85],["newpelis",85],["pelix",85],["allcalidad",85],["infomaniakos",85],["filecrypt",90],["tornadomovies",96],["icdrama",102],["mangasail",102],["file4go",104],["mangovideo",116],["asianclub",124],["anitube",127],["streamingcommunity",127],["mixdrop",129],["uploadev",153],["ver-pelis-online",161],["ancient-origins",169],["spankbang",188],["lookcam",195],["lootlinks",195],["dpstream",198],["bluemediafiles",200],["docer",224],["hamsterix",241],["xhamster",241],["xhamster1",241],["xhamster10",241],["xhamster11",241],["xhamster12",241],["xhamster13",241],["xhamster14",241],["xhamster15",241],["xhamster16",241],["xhamster17",241],["xhamster18",241],["xhamster19",241],["xhamster20",241],["xhamster2",241],["xhamster3",241],["xhamster4",241],["xhamster42",241],["xhamster5",241],["xhamster7",241],["xhamster8",241],["acortalo",[243,244,245,246]],["acortar",[243,244,245,246]],["a2zapk",250],["kickassanime",264],["doomovie-hd",268],["drakecomic",287],["terabox",304],["ctrlv",338],["123movieshd",364],["uproxy",369],["animesa",370],["cinecalidad",[373,374]],["dvdplay",401],["apkmaven",419],["gmx",423],["gamereactor",479],["vembed",491],["empire-anime",[495,496,497,498,499]],["empire-stream",[495,496,497]],["empire-streaming",[495,496,497]],["empire-streamz",[495,496,497]],["tvhay",[504,505]],["lookmovie",527],["filmizletv",[533,534,535,536]],["www.google",543],["officedepot",[566,567]],["foundit",[649,650]]]);

const exceptionsMap = new Map([["pingit.com",[25]],["pingit.me",[25]],["lookmovie.studio",[527]]]);

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
