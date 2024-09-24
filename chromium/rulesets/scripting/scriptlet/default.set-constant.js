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

const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["oeo","noopFunc"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["console.clear","trueFunc"],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["console.clear","noopFunc"],["console.log","noopFunc"],["String.prototype.charCodeAt","trueFunc"],["attachEvent","trueFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["flashvars.adv_pause_html",""],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["Object.prototype.adReinsertion","noopFunc"],["Object.prototype.disableAds","true"],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["adBlock","false"],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["spoof","noopFunc"],["adBlockerDetected","undefined"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["Object.prototype.run","undefined"],["isAdblock","false"],["CaptchmeState.adb","undefined"],["bb","false"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["dvsize","51"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["testerli","false"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["show_ads_gr8_lite","true"],["doads","true"],["jsUnda","noopFunc"],["abp","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["getHomadConfig","noopFunc"],["adsbygoogle.loaded","true"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["cRAds","true"],["app.addonIsInstalled","trueFunc"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["CustomEvent","noopFunc"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["ulp_noadb","true"],["timeSec","0"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["hasAdBlocker","false"],["document.ontouchend","null"],["document.onclick","null"],["initials.yld-pdpopunder",""],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["DHAntiAdBlocker","true"],["adsConfigs","{}"],["adsConfigs.0","{}"],["adsConfigs.0.enabled","0"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["adSettings","[]"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["protection","noopFunc"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["checkAdsStatus","noopFunc"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["Object.prototype.ads.nopreroll_","true"],["checkAdBlocker","noopFunc"],["adBlockerDetected","false"],["univresalP","noopFunc"],["EASYFUN_ADS_CAN_RUN","true"],["document.hasFocus","trueFunc"],["detectAdBlock","noopFunc"],["document.hidden","false"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["private","false"],["showadas","true"],["iktimer","0"],["aSl.gcd","0"],["delayClick","false"],["counter","10"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["showada","true"],["showax","true"],["p18","undefined"],["asc","2"],["google_tag_manager","{}"],["ADBLOCKED","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["adsHeight","11"],["checkCap","0"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["isadb","false"],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["D4zz","noopFunc"],["ad_link",""],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["count","1"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["stop","noopFunc"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["objAd.loadAdShield","noopFunc"],["aLoad","noopFunc"],["mtCanRunAdsSoItCanStillBeOnTheWeb","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["Overlayer","{}"],["pop3getcookie","undefined"],["pop3setcookie1","undefined"],["pop3setCookie2","undefined"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["Object.prototype.adBlockerDetected","falseFunc"],["Object.prototype.adBlocker","false"],["Object.prototype.tomatoDetected","falseFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["navigator.brave","undefined"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["window.runningAdsAllowed","true"],["tOS1","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["playerConfigs.rek","{}"],["feedBack.showAffilaePromo","noopFunc"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["admiral","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["confirm","noopFunc"],["checkAdBlockeraz","noopFunc"],["segundos","0"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["flashvars.event_reporting",""],["Visitor","{}"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["fapit.check","noopFunc"],["use","false"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];

const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["kicker.de",[4,590]],["t-online.de",5],["whatfinger.com",6],["timesofindia.indiatimes.com",7],["economictimes.indiatimes.com",8],["userscloud.com",9],["motherless.com",10],["sueddeutsche.de",11],["watchanimesub.net",12],["wco.tv",12],["wcoanimesub.tv",12],["wcoforever.net",12],["freeviewmovies.com",12],["filehorse.com",12],["guidetnt.com",12],["sp-today.com",12],["linkvertise.com",12],["textbin.net",12],["eropaste.net",12],["pastebr.xyz",12],["getpaste.link",12],["sharetext.me",12],["note.sieuthuthuat.com",12],["elcriticodelatele.com",[12,257]],["gadgets.es",[12,257]],["amateurporn.co",[12,116]],["wiwo.de",13],["masteranime.tv",14],["alphaporno.com",[15,449]],["porngem.com",15],["uploadbank.com",[15,89]],["shortit.pw",[15,100]],["familyporn.tv",15],["cloudemb.com",[15,368]],["sbplay1.com",15],["id45.cyou",15],["85tube.com",[15,81]],["k1nk.co",15],["watchasians.cc",15],["soltoshindo.com",15],["dronedj.com",17],["nolive.me",18],["sankakucomplex.com",19],["player.glomex.com",20],["merkur.de",20],["tz.de",20],["hotpornfile.org",23],["player.tabooporns.com",23],["x69.ovh",23],["wiztube.xyz",23],["netu.frembed.fun",23],["multiup.us",23],["rpdrlatino.live",23],["peliculas8k.com",[23,24]],["video.q34r.org",23],["69x.online",23],["czxxx.org",23],["vtplayer.online",23],["netu.ac",23],["dirtyvideo.fun",24],["adbull.org",25],["mitly.us",25],["linkrex.net",25],["linx.cc",25],["oke.io",25],["dz4link.com",25],["linclik.com",25],["shrt10.com",25],["loptelink.com",25],["cut-fly.com",25],["linkfinal.com",25],["payskip.org",25],["cutpaid.com",25],["forexmab.com",25],["linkjust.com",25],["linkszia.co",25],["leechpremium.link",25],["icutlink.com",[25,121]],["oncehelp.com",25],["rgl.vn",25],["reqlinks.net",25],["bitlk.com",25],["qlinks.eu",25],["link.3dmili.com",25],["short-fly.com",25],["foxseotools.com",25],["pngit.live",25],["link.turkdown.com",25],["urlty.com",25],["7r6.com",25],["oko.sh",25],["ckk.ai",25],["fc.lc",25],["fstore.biz",25],["cuts-url.com",25],["eio.io",25],["exe.app",25],["exee.io",25],["exey.io",25],["skincarie.com",25],["exeo.app",25],["coinlyhub.com",[25,199]],["adsafelink.com",25],["aii.sh",25],["cybertechng.com",[25,212]],["owllink.net",25],["cutdl.xyz",25],["iir.ai",25],["shorteet.com",[25,230]],["sekilastekno.com",25],["smoner.com",25],["gyanlight.com",25],["xpshort.com",25],["upshrink.com",25],["enit.in",[25,226]],["ez4short.com",25],["easysky.in",25],["veganab.co",25],["adrinolinks.in",25],["go.bloggingaro.com",25],["go.gyanitheme.com",25],["go.theforyou.in",25],["go.hipsonyc.com",25],["birdurls.com",25],["vipurl.in",25],["try2link.com",25],["jameeltips.us",25],["gainl.ink",25],["promo-visits.site",25],["satoshi-win.xyz",[25,294]],["shorterall.com",25],["encurtandourl.com",25],["forextrader.site",25],["postazap.com",25],["cety.app",25],["exego.app",[25,289]],["cutlink.net",25],["cutsy.net",25],["cutyurls.com",25],["cutty.app",25],["cutnet.net",25],["tinys.click",[25,212]],["cpm.icu",25],["panyshort.link",25],["enagato.com",25],["pandaznetwork.com",25],["tvi.la",25],["iir.la",25],["tii.la",25],["oei.la",25],["lnbz.la",[25,226]],["oii.la",25],["tpi.li",25],["recipestutorials.com",25],["shrinkforearn.in",25],["techyuth.xyz",25],["oii.io",25],["du-link.in",25],["atglinks.com",25],["thotpacks.xyz",25],["megaurl.in",25],["megafly.in",25],["simana.online",25],["fooak.com",25],["joktop.com",25],["evernia.site",25],["link.paid4link.com",[25,301]],["exalink.fun",25],["indiamaja.com",25],["newshuta.in",25],["shortxlinks.com",25],["linksly.co",25],["pkr.pw",25],["imagenesderopaparaperros.com",25],["shortenbuddy.com",25],["gibit.xyz",25],["apksvip.com",25],["4cash.me",25],["namaidani.com",25],["teknomuda.com",25],["illink.net",25],["miuiku.com",25],["yourtechnology.online",25],["savelink.site",25],["apkshrt.com",25],["srts.me",25],["kutmoney.com",25],["kutt.io",25],["sanoybonito.club",25],["samaa-pro.com",25],["miklpro.com",25],["modapk.link",25],["1shorten.com",25],["ccurl.net",25],["st23q.com",25],["beautyram.info",25],["viraloc.com",25],["galaxy-link.space",25],["linkpoi.me",25],["usdshort.com",25],["bitcoinly.in",25],["menjelajahi.com",25],["pewgame.com",25],["yxoshort.com",25],["1link.vip",25],["haonguyen.top",25],["claimfreebits.com",25],["crazyblog.in",25],["gtlink.co",25],["link.tokenoto.com",25],["cutearn.net",25],["rshrt.com",25],["short.palmeratv.com",25],["filezipa.com",25],["dz-linkk.com",25],["theblissempire.com",25],["finanzas-vida.com",25],["adurly.cc",25],["pix4link.com",25],["paid4.link",25],["link.asiaon.top",25],["go.gets4link.com",25],["download.sharenulled.net",25],["beingtek.com",25],["shorturl.unityassets4free.com",25],["disheye.com",25],["techymedies.com",25],["techysuccess.com",25],["za.gl",[25,139]],["download.baominh.tech",25],["bblink.com",25],["linkbr.xyz",25],["myad.biz",25],["swzz.xyz",25],["vevioz.com",25],["charexempire.com",25],["clk.asia",25],["egfly.xyz",25],["linka.click",25],["sturls.com",25],["myshrinker.com",25],["go.adinsurance.xyz",25],["dash-free.com",[25,212]],["snowurl.com",[25,212]],["netfile.cc",25],["link.insurglobal.xyz",25],["theconomy.me",25],["rocklink.in",25],["adinsurance.xyz",25],["insurglobal.xyz",25],["techgeek.digital",25],["download3s.net",25],["shortx.net",25],["musicc.xyz",25],["shortawy.com",25],["tlin.me",25],["apprepack.com",25],["up-load.one",25],["zuba.link",25],["news.speedynews.xyz",25],["golink.xaydungplus.com",25],["bestcash2020.com",25],["hoxiin.com",25],["technemo.xyz",25],["go.linkbnao.com",25],["link-yz.com",25],["paylinnk.com",25],["thizissam.in",25],["ier.ai",25],["bloggertheme.xyz",25],["adslink.pw",25],["novelssites.com",25],["links.medipost.org",25],["faucetcrypto.net",25],["short.freeltc.top",25],["trxking.xyz",25],["weadown.com",25],["m.bloggingguidance.com",25],["blog.onroid.com",25],["link.codevn.net",25],["upfilesurls.com",25],["shareus.site",25],["link4rev.site",25],["bloginguru.xyz",25],["celinks.net",25],["c2g.at",25],["shortzu.icu",25],["bitcosite.com",[25,463]],["cryptosh.pro",25],["sigmalinks.in",25],["link68.net",25],["traffic123.net",25],["windowslite.net",[25,212]],["coinsl.click",25],["viewfr.com",25],["cl1ca.com",25],["4br.me",25],["fir3.net",25],["kiddyshort.com",25],["watchmygf.me",[26,51]],["camwhorez.tv",[26,37,80,81]],["cambay.tv",[26,53,80,113,115,116,117,118]],["fpo.xxx",[26,53]],["sexemix.com",26],["heavyfetish.com",[26,525]],["you-porn.com",28],["youporngay.com",28],["youpornru.com",28],["9908ww.com",28],["adelaidepawnbroker.com",28],["bztube.com",28],["hotovs.com",28],["insuredhome.org",28],["nudegista.com",28],["pornluck.com",28],["vidd.se",28],["pornhub.com",28],["pornerbros.com",29],["freep.com",29],["porn.com",32],["tune.pk",33],["noticias.gospelmais.com.br",34],["techperiod.com",34],["viki.com",[35,36]],["sleazyneasy.com",[37,38,39]],["smutr.com",[37,195]],["watchdirty.to",[37,81,82,116]],["yourporngod.com",[37,38]],["javbangers.com",[37,338]],["camfox.com",37],["camthots.tv",[37,113]],["shegotass.info",37],["amateur8.com",37],["bigtitslust.com",37],["ebony8.com",37],["freeporn8.com",37],["lesbian8.com",37],["maturetubehere.com",37],["sortporn.com",37],["webcamvau.com",37],["motherporno.com",[37,38,53,115]],["tktube.com",37],["theporngod.com",[37,38]],["pornsocket.com",40],["luxuretv.com",41],["porndig.com",[42,43]],["webcheats.com.br",44],["ceesty.com",[45,46]],["gestyy.com",[45,46]],["corneey.com",46],["destyy.com",46],["festyy.com",46],["sh.st",46],["mitaku.net",46],["angrybirdsnest.com",47],["zrozz.com",47],["clix4btc.com",47],["4tests.com",47],["planet-explorers-isos.com",47],["business-standard.com",47],["goltelevision.com",47],["news-und-nachrichten.de",47],["laradiobbs.net",47],["urlaubspartner.net",47],["produktion.de",47],["cinemaxxl.de",47],["bladesalvador.com",47],["tempr.email",47],["katfile.com",47],["trust.zone",47],["cshort.org",47],["friendproject.net",47],["covrhub.com",47],["planetsuzy.org",48],["empflix.com",49],["freeplayervideo.com",50],["nazarickol.com",50],["player-cdn.com",50],["playhydrax.com",[50,242,243]],["alleneconomicmatter.com",50],["apinchcaseation.com",50],["bethshouldercan.com",50],["bigclatterhomesguideservice.com",50],["bradleyviewdoctor.com",50],["brookethoughi.com",50],["brucevotewithin.com",50],["cindyeyefinal.com",50],["denisegrowthwide.com",50],["donaldlineelse.com",50],["edwardarriveoften.com",50],["erikcoldperson.com",50],["graceaddresscommunity.com",50],["heatherdiscussionwhen.com",50],["housecardsummerbutton.com",50],["jamesstartstudent.com",50],["jamiesamewalk.com",50],["jasminetesttry.com",50],["jasonresponsemeasure.com",50],["jayservicestuff.com",50],["jessicaglassauthor.com",50],["johntryopen.com",50],["josephseveralconcern.com",50],["kennethofficialitem.com",50],["lisatrialidea.com",50],["loriwithinfamily.com",50],["lukecomparetwo.com",50],["markstyleall.com",50],["michaelapplysome.com",50],["morganoperationface.com",50],["nectareousoverelate.com",50],["paulkitchendark.com",50],["rebeccaneverbase.com",50],["roberteachfinal.com",50],["robertplacespace.com",50],["ryanagoinvolve.com",50],["sandrataxeight.com",50],["seanshowcould.com",50],["sethniceletter.com",50],["shannonpersonalcost.com",50],["sharonwhiledemocratic.com",50],["stevenimaginelittle.com",50],["strawberriesporail.com",50],["timberwoodanotia.com",50],["tinycat-voe-fashion.com",50],["troyyourlead.com",50],["uptodatefinishconference.com",50],["uptodatefinishconferenceroom.com",50],["vincentincludesuccessful.com",50],["voe.sx",50],["motphimtv.com",50],["rabbitstream.net",50],["projectfreetv.one",50],["evelynthankregion.com",50],["lorimuchbenefit.com",50],["transparentcalifornia.com",51],["deepbrid.com",52],["submityourflicks.com",53],["3movs.com",53],["bravoerotica.net",[53,115]],["youx.xxx",53],["camclips.tv",[53,195]],["camflow.tv",[53,115,116,160,233]],["camhoes.tv",[53,113,115,116,160,233]],["xmegadrive.com",53],["xxxymovies.com",53],["xxxshake.com",53],["gayck.com",53],["xhand.com",[53,115]],["analdin.com",[53,115]],["webnovel.com",54],["videosgay.me",[55,56]],["oneupload.to",56],["oneupload.online",56],["wishfast.top",56],["schwaebische.de",57],["8tracks.com",58],["revealname.com",59],["golfchannel.com",61],["telemundodeportes.com",61],["stream.nbcsports.com",61],["mathdf.com",61],["gamcore.com",62],["porcore.com",62],["69games.xxx",62],["javmix.app",62],["tecknity.com",63],["haaretz.co.il",64],["haaretz.com",64],["hungama.com",64],["a-o.ninja",64],["anime-odcinki.pl",64],["kumpulmanga.org",64],["shortgoo.blogspot.com",64],["tonanmedia.my.id",[64,484]],["yurasu.xyz",64],["isekaipalace.com",64],["vikistream.com",65],["eplayer.click",[65,66]],["mega4upload.com",[66,72]],["ennovelas.com",[66,72]],["n-tv.de",67],["brigitte.de",68],["stern.de",68],["foxsports.com.au",69],["canberratimes.com.au",69],["thesimsresource.com",70],["bdnewszh.com",72],["streamservicehd.click",72],["timeforbitco.in",73],["worldofbitco.in",[73,83]],["weatherx.co.in",[73,83]],["getyourbitco.in",73],["sunbtc.space",73],["ctrl.blog",74],["sportlife.es",75],["finofilipino.org",76],["acortarm.xyz",77],["mysflink.blogspot.com",78],["assia.tv",79],["assia4.com",79],["assia24.com",79],["cwtvembeds.com",[81,114]],["xmateur.com",[81,82,116]],["camlovers.tv",81],["porntn.com",81],["pornissimo.org",81],["sexcams-24.com",[81,116]],["watchporn.to",[81,116]],["camwhorez.video",81],["multi.xxx",82],["footstockings.com",[82,116]],["sbs.com.au",84],["ojogos.com.br",86],["powforums.com",87],["supforums.com",87],["studybullet.com",87],["usgamer.net",88],["recordonline.com",88],["freebitcoin.win",91],["e-monsite.com",91],["coindice.win",91],["sport-tv-guide.live",92],["temp-mails.com",93],["freiepresse.de",94],["investing.com",95],["mp3fiber.com",97],["chicoer.com",98],["dailybreeze.com",98],["dailybulletin.com",98],["dailynews.com",98],["delcotimes.com",98],["eastbaytimes.com",98],["macombdaily.com",98],["ocregister.com",98],["pasadenastarnews.com",98],["pe.com",98],["presstelegram.com",98],["redlandsdailyfacts.com",98],["reviewjournal.com",98],["santacruzsentinel.com",98],["saratogian.com",98],["sentinelandenterprise.com",98],["sgvtribune.com",98],["tampabay.com",98],["times-standard.com",98],["theoaklandpress.com",98],["trentonian.com",98],["twincities.com",98],["whittierdailynews.com",98],["bostonherald.com",98],["dailycamera.com",98],["sbsun.com",98],["dailydemocrat.com",98],["montereyherald.com",98],["orovillemr.com",98],["record-bee.com",98],["redbluffdailynews.com",98],["reporterherald.com",98],["thereporter.com",98],["timescall.com",98],["timesheraldonline.com",98],["ukiahdailyjournal.com",98],["dailylocal.com",98],["mercurynews.com",98],["suedkurier.de",99],["anysex.com",101],["vlist.se",102],["pornve.com",103],["coolrom.com.au",104],["pornohirsch.net",105],["marie-claire.es",106],["gamezhero.com",106],["flashgirlgames.com",106],["onlinesudoku.games",106],["mpg.football",106],["sssam.com",106],["globalnews.ca",107],["drinksmixer.com",108],["leitesculinaria.com",108],["fupa.net",109],["browardpalmbeach.com",110],["dallasobserver.com",110],["houstonpress.com",110],["miaminewtimes.com",110],["phoenixnewtimes.com",110],["westword.com",110],["nhentai.net",111],["nowtv.com.tr",112],["caminspector.net",113],["camwhoreshd.com",113],["camgoddess.tv",113],["gay4porn.com",115],["mypornhere.com",115],["camhub.cc",116],["sexwebvideo.com",116],["sexwebvideo.net",116],["love4porn.com",116],["thotvids.com",116],["watchmdh.to",116],["celebwhore.com",116],["cluset.com",116],["4kporn.xxx",116],["xhomealone.com",116],["lusttaboo.com",[116,410]],["hentai-moon.com",116],["mediapason.it",119],["linkspaid.com",119],["tuotromedico.com",119],["neoteo.com",119],["phoneswiki.com",119],["celebmix.com",119],["myneobuxportal.com",119],["oyungibi.com",119],["25yearslatersite.com",119],["jeshoots.com",120],["techhx.com",120],["karanapk.com",120],["flashplayer.fullstacks.net",122],["cloudapps.herokuapp.com",122],["texteditor.nsspot.net",122],["youfiles.herokuapp.com",122],["temp-mail.org",123],["javhdporn.net",124],["javstream.top",124],["comnuan.com",125],["veedi.com",126],["battleboats.io",126],["fruitlab.com",127],["acetack.com",127],["androidquest.com",127],["apklox.com",127],["chhaprawap.in",127],["gujarativyakaran.com",127],["kashmirstudentsinformation.in",127],["kisantime.com",127],["shetkaritoday.in",127],["pastescript.com",127],["trimorspacks.com",127],["updrop.link",127],["haddoz.net",127],["garoetpos.com",127],["stiletv.it",128],["hqtv.biz",130],["liveuamap.com",131],["muvibg.com",131],["audycje.tokfm.pl",132],["hulu.com",[133,134,135]],["shush.se",136],["emurom.net",137],["allkpop.com",138],["pickcrackpasswords.blogspot.com",140],["kfrfansub.com",141],["thuglink.com",141],["voipreview.org",141],["illicoporno.com",142],["lavoixdux.com",142],["tonpornodujour.com",142],["jacquieetmichel.net",142],["jacquieetmicheltv.net",[142,251,252]],["swame.com",142],["vosfemmes.com",142],["voyeurfrance.net",142],["hanime.tv",143],["pogo.com",144],["cloudvideo.tv",145],["legionjuegos.org",146],["legionpeliculas.org",146],["legionprogramas.org",146],["16honeys.com",147],["elespanol.com",148],["remodelista.com",149],["coolmathgames.com",[150,151,152,543]],["audiofanzine.com",153],["hitokin.net",155],["developerinsider.co",156],["ilprimatonazionale.it",157],["hotabis.com",157],["root-nation.com",157],["italpress.com",157],["airsoftmilsimnews.com",157],["artribune.com",157],["thehindu.com",158],["cambro.tv",[159,160]],["nibelungen-kurier.de",161],["adfoc.us",163],["techyember.com",163],["remixbass.com",163],["techipop.com",163],["quickimageconverter.com",163],["mastharyana.com",163],["tea-coffee.net",163],["spatsify.com",163],["newedutopics.com",163],["getviralreach.in",163],["edukaroo.com",163],["funkeypagali.com",163],["careersides.com",163],["nayisahara.com",163],["wikifilmia.com",163],["infinityskull.com",163],["viewmyknowledge.com",163],["iisfvirtual.in",163],["starxinvestor.com",163],["jkssbalerts.com",163],["myprivatejobs.com",[163,290]],["wikitraveltips.com",[163,290]],["amritadrino.com",[163,290]],["sahlmarketing.net",163],["filmypoints.in",163],["fitnessholic.net",163],["moderngyan.com",163],["sattakingcharts.in",163],["freshbhojpuri.com",163],["bgmi32bitapk.in",163],["bankshiksha.in",163],["earn.mpscstudyhub.com",163],["earn.quotesopia.com",163],["money.quotesopia.com",163],["best-mobilegames.com",163],["learn.moderngyan.com",163],["bharatsarkarijobalert.com",163],["techacode.com",163],["trickms.com",163],["ielts-isa.edu.vn",163],["sptfy.be",163],["mcafee-com.com",[163,289]],["pianetamountainbike.it",164],["barchart.com",165],["modelisme.com",166],["parasportontario.ca",166],["prescottenews.com",166],["nrj-play.fr",167],["oeffentlicher-dienst.info",168],["hackingwithreact.com",169],["gutekueche.at",170],["eplfootballmatch.com",171],["peekvids.com",172],["playvids.com",172],["pornflip.com",172],["redensarten-index.de",173],["vw-page.com",174],["viz.com",[175,176]],["queenfaucet.website",177],["0rechner.de",178],["configspc.com",179],["xopenload.me",179],["uptobox.com",179],["uptostream.com",179],["onepiece-tube.com",180],["japgay.com",181],["mega-debrid.eu",182],["dreamdth.com",183],["diaridegirona.cat",185],["diariodeibiza.es",185],["diariodemallorca.es",185],["diarioinformacion.com",185],["eldia.es",185],["emporda.info",185],["farodevigo.es",185],["laopinioncoruna.es",185],["laopiniondemalaga.es",185],["laopiniondemurcia.es",185],["laopiniondezamora.es",185],["laprovincia.es",185],["levante-emv.com",185],["mallorcazeitung.es",185],["regio7.cat",185],["superdeporte.es",185],["playpaste.com",186],["player.rtl2.de",187],["freetutorialsus.com",188],["vidlii.com",[188,204]],["iammagnus.com",188],["dailyvideoreports.net",188],["unityassets4free.com",188],["cnbc.com",189],["puzzles.msn.com",190],["metro.us",190],["newsobserver.com",190],["arkadiumhosted.com",190],["firefaucet.win",192],["55k.io",193],["filelions.online",193],["stmruby.com",193],["direct-link.net",194],["direkt-wissen.com",194],["link-to.net",194],["fullhdxxx.com",196],["pornclassic.tube",197],["tubepornclassic.com",197],["etonline.com",198],["creatur.io",198],["drphil.com",198],["urbanmilwaukee.com",198],["ontiva.com",198],["hideandseek.world",198],["myabandonware.com",198],["kendam.com",198],["wttw.com",198],["synonyms.com",198],["definitions.net",198],["hostmath.com",198],["camvideoshub.com",198],["minhaconexao.com.br",198],["home-made-videos.com",200],["pxrnxx.xyz",200],["amateur-couples.com",200],["slutdump.com",200],["produsat.com",202],["12thman.com",204],["acusports.com",204],["atlantic10.com",204],["auburntigers.com",204],["baylorbears.com",204],["bceagles.com",204],["bgsufalcons.com",204],["big12sports.com",204],["bigten.org",204],["bradleybraves.com",204],["butlersports.com",204],["cmumavericks.com",204],["conferenceusa.com",204],["cyclones.com",204],["dartmouthsports.com",204],["daytonflyers.com",204],["dbupatriots.com",204],["dbusports.com",204],["denverpioneers.com",204],["fduknights.com",204],["fgcuathletics.com",204],["fightinghawks.com",204],["fightingillini.com",204],["floridagators.com",204],["friars.com",204],["friscofighters.com",204],["gamecocksonline.com",204],["goarmywestpoint.com",204],["gobison.com",204],["goblueraiders.com",204],["gobobcats.com",204],["gocards.com",204],["gocreighton.com",204],["godeacs.com",204],["goexplorers.com",204],["goetbutigers.com",204],["gofrogs.com",204],["gogriffs.com",204],["gogriz.com",204],["golobos.com",204],["gomarquette.com",204],["gopack.com",204],["gophersports.com",204],["goprincetontigers.com",204],["gopsusports.com",204],["goracers.com",204],["goshockers.com",204],["goterriers.com",204],["gotigersgo.com",204],["gousfbulls.com",204],["govandals.com",204],["gowyo.com",204],["goxavier.com",204],["gozags.com",204],["gozips.com",204],["griffinathletics.com",204],["guhoyas.com",204],["gwusports.com",204],["hailstate.com",204],["hamptonpirates.com",204],["hawaiiathletics.com",204],["hokiesports.com",204],["huskers.com",204],["icgaels.com",204],["iuhoosiers.com",204],["jsugamecocksports.com",204],["longbeachstate.com",204],["loyolaramblers.com",204],["lrtrojans.com",204],["lsusports.net",204],["morrisvillemustangs.com",204],["msuspartans.com",204],["muleriderathletics.com",204],["mutigers.com",204],["navysports.com",204],["nevadawolfpack.com",204],["niuhuskies.com",204],["nkunorse.com",204],["nuhuskies.com",204],["nusports.com",204],["okstate.com",204],["olemisssports.com",204],["omavs.com",204],["ovcsports.com",204],["owlsports.com",204],["purduesports.com",204],["redstormsports.com",204],["richmondspiders.com",204],["sfajacks.com",204],["shupirates.com",204],["siusalukis.com",204],["smcgaels.com",204],["smumustangs.com",204],["soconsports.com",204],["soonersports.com",204],["themw.com",204],["tulsahurricane.com",204],["txst.com",204],["txstatebobcats.com",204],["ubbulls.com",204],["ucfknights.com",204],["ucirvinesports.com",204],["uconnhuskies.com",204],["uhcougars.com",204],["uicflames.com",204],["umterps.com",204],["uncwsports.com",204],["unipanthers.com",204],["unlvrebels.com",204],["uoflsports.com",204],["usdtoreros.com",204],["utahstateaggies.com",204],["utepathletics.com",204],["utrockets.com",204],["uvmathletics.com",204],["uwbadgers.com",204],["villanova.com",204],["wkusports.com",204],["wmubroncos.com",204],["woffordterriers.com",204],["1pack1goal.com",204],["bcuathletics.com",204],["bubraves.com",204],["goblackbears.com",204],["golightsgo.com",204],["gomcpanthers.com",204],["goutsa.com",204],["mercerbears.com",204],["pirateblue.com",204],["pirateblue.net",204],["pirateblue.org",204],["quinnipiacbobcats.com",204],["towsontigers.com",204],["tribeathletics.com",204],["tribeclub.com",204],["utepminermaniacs.com",204],["utepminers.com",204],["wkutickets.com",204],["aopathletics.org",204],["atlantichockeyonline.com",204],["bigsouthnetwork.com",204],["bigsouthsports.com",204],["chawomenshockey.com",204],["dbupatriots.org",204],["drakerelays.org",204],["ecac.org",204],["ecacsports.com",204],["emueagles.com",204],["emugameday.com",204],["gculopes.com",204],["godrakebulldog.com",204],["godrakebulldogs.com",204],["godrakebulldogs.net",204],["goeags.com",204],["goislander.com",204],["goislanders.com",204],["gojacks.com",204],["gomacsports.com",204],["gseagles.com",204],["hubison.com",204],["iowaconference.com",204],["ksuowls.com",204],["lonestarconference.org",204],["mascac.org",204],["midwestconference.org",204],["mountaineast.org",204],["niu-pack.com",204],["nulakers.ca",204],["oswegolakers.com",204],["ovcdigitalnetwork.com",204],["pacersports.com",204],["rmacsports.org",204],["rollrivers.com",204],["samfordsports.com",204],["uncpbraves.com",204],["usfdons.com",204],["wiacsports.com",204],["alaskananooks.com",204],["broncathleticfund.com",204],["cameronaggies.com",204],["columbiacougars.com",204],["etownbluejays.com",204],["gobadgers.ca",204],["golancers.ca",204],["gometrostate.com",204],["gothunderbirds.ca",204],["kentstatesports.com",204],["lehighsports.com",204],["lopers.com",204],["lycoathletics.com",204],["lycomingathletics.com",204],["maraudersports.com",204],["mauiinvitational.com",204],["msumavericks.com",204],["nauathletics.com",204],["nueagles.com",204],["nwusports.com",204],["oceanbreezenyc.org",204],["patriotathleticfund.com",204],["pittband.com",204],["principiaathletics.com",204],["roadrunnersathletics.com",204],["sidearmsocial.com",204],["snhupenmen.com",204],["stablerarena.com",204],["stoutbluedevils.com",204],["uwlathletics.com",204],["yumacs.com",204],["collegefootballplayoff.com",204],["csurams.com",204],["cubuffs.com",204],["gobearcats.com",204],["gohuskies.com",204],["mgoblue.com",204],["osubeavers.com",204],["pittsburghpanthers.com",204],["rolltide.com",204],["texassports.com",204],["thesundevils.com",204],["uclabruins.com",204],["wvuathletics.com",204],["wvusports.com",204],["arizonawildcats.com",204],["calbears.com",204],["cuse.com",204],["georgiadogs.com",204],["goducks.com",204],["goheels.com",204],["gostanford.com",204],["insidekstatesports.com",204],["insidekstatesports.info",204],["insidekstatesports.net",204],["insidekstatesports.org",204],["k-stateathletics.com",204],["k-statefootball.net",204],["k-statefootball.org",204],["k-statesports.com",204],["k-statesports.net",204],["k-statesports.org",204],["k-statewomenshoops.com",204],["k-statewomenshoops.net",204],["k-statewomenshoops.org",204],["kstateathletics.com",204],["kstatefootball.net",204],["kstatefootball.org",204],["kstatesports.com",204],["kstatewomenshoops.com",204],["kstatewomenshoops.net",204],["kstatewomenshoops.org",204],["ksuathletics.com",204],["ksusports.com",204],["scarletknights.com",204],["showdownforrelief.com",204],["syracusecrunch.com",204],["texastech.com",204],["theacc.com",204],["ukathletics.com",204],["usctrojans.com",204],["utahutes.com",204],["utsports.com",204],["wsucougars.com",204],["tricksplit.io",204],["fangraphs.com",205],["4players.de",[206,286]],["buffed.de",206],["gamesaktuell.de",206],["gamezone.de",206],["pcgames.de",206],["videogameszone.de",206],["tvspielfilm.de",[207,208,209,210]],["tvtoday.de",[207,208,209,210]],["chip.de",[207,208,209,210]],["focus.de",[207,208,209,210]],["planetaminecraft.com",211],["cravesandflames.com",212],["codesnse.com",212],["link.paid4file.com",212],["flyad.vip",212],["lapresse.ca",213],["kolyoom.com",214],["ilovephd.com",214],["negumo.com",215],["games.wkb.jp",[216,217]],["fandom.com",[218,560,561]],["kenshi.fandom.com",219],["hausbau-forum.de",220],["homeairquality.org",220],["faucettronn.click",220],["fake-it.ws",221],["laksa19.github.io",222],["1shortlink.com",223],["nesia.my.id",224],["u-s-news.com",225],["makemoneywithurl.com",226],["junkyponk.com",226],["healthfirstweb.com",226],["vocalley.com",226],["yogablogfit.com",226],["howifx.com",[226,445]],["en.financerites.com",226],["mythvista.com",226],["livenewsflix.com",226],["cureclues.com",226],["apekite.com",226],["host-buzz.com",226],["insmyst.com",226],["wp2host.com",226],["blogtechh.com",226],["techbixby.com",226],["blogmyst.com",226],["resetoff.pl",227],["sexodi.com",227],["cdn77.org",228],["howtofixwindows.com",229],["3sexporn.com",230],["momxxxsex.com",230],["myfreevintageporn.com",230],["penisbuyutucum.net",230],["ujszo.com",231],["newsmax.com",232],["bobs-tube.com",233],["nadidetarifler.com",234],["siz.tv",234],["suzylu.co.uk",[235,236]],["onworks.net",237],["yabiladi.com",237],["downloadsoft.net",238],["pixsera.net",239],["testlanguages.com",240],["newsinlevels.com",240],["videosinlevels.com",240],["cbs.com",241],["paramountplus.com",241],["abysscdn.com",[242,243]],["buktube.com",244],["fullxh.com",244],["galleryxh.site",244],["megaxh.com",244],["movingxh.world",244],["seexh.com",244],["taoxh.life",244],["unlockxh4.com",244],["valuexh.life",244],["xhaccess.com",244],["xhadult2.com",244],["xhadult3.com",244],["xhadult4.com",244],["xhadult5.com",244],["xhamster46.com",244],["xhamsterporno.mx",244],["xhbig.com",244],["xhbranch5.com",244],["xhchannel.com",244],["xhchannel2.com",244],["xhdate.world",244],["xhday.com",244],["xhday1.com",244],["xhlease.world",244],["xhmoon5.com",244],["xhofficial.com",244],["xhopen.com",244],["xhplanet1.com",244],["xhplanet2.com",244],["xhreal2.com",244],["xhreal3.com",244],["xhspot.com",244],["xhtab2.com",244],["xhtab4.com",244],["xhtotal.com",244],["xhtree.com",244],["xhvictory.com",244],["xhwebsite.com",244],["xhwebsite2.com",244],["xhwebsite5.com",244],["xhwide1.com",244],["xhwide2.com",244],["xhwide5.com",244],["xhxh3.xyz",244],["lightnovelworld.com",245],["megadescarga.net",[246,247,248,249]],["megadescargas.net",[246,247,248,249]],["hentaihaven.xxx",250],["jacquieetmicheltv2.net",252],["fcportables.com",[254,255]],["ultimate-guitar.com",256],["teachmemicro.com",257],["willcycle.com",257],["2ndrun.tv",257],["rackusreads.com",257],["xyzsports111.xyz",[258,259,260]],["xyzsports112.xyz",[258,259,260]],["xyzsports113.xyz",[258,259,260]],["xyzsports114.xyz",[258,259,260]],["xyzsprtsfrmr1.site",[258,259,260]],["xyzsprtsfrmr2.site",[258,259,260]],["claimbits.net",261],["sexyscope.net",262],["recherche-ebook.fr",264],["easymc.io",264],["zonebourse.com",265],["pink-sluts.net",266],["madoohd.com",267],["andhrafriends.com",268],["benzinpreis.de",269],["defenseone.com",270],["govexec.com",270],["nextgov.com",270],["route-fifty.com",270],["sharing.wtf",271],["wetter3.de",272],["arahdrive.com",273],["aiimgvlog.fun",[273,289]],["esportivos.fun",274],["cosmonova-broadcast.tv",275],["soccerinhd.com",276],["techedubyte.com",276],["hartvannederland.nl",277],["shownieuws.nl",277],["vandaaginside.nl",277],["rock.porn",[278,279]],["videzz.net",[280,281]],["ezaudiobookforsoul.com",282],["club386.com",283],["androidpolice.com",284],["cbr.com",284],["collider.com",284],["dualshockers.com",284],["gamerant.com",284],["howtogeek.com",284],["makeuseof.com",284],["movieweb.com",284],["screenrant.com",284],["thegamer.com",284],["xda-developers.com",284],["banned.video",284],["madmaxworld.tv",284],["wheelofgold.com",285],["ozulmanga.com",285],["onlinesoccermanager.com",286],["njav.tv",287],["netfapx.com",287],["easyfun.gg",288],["starkroboticsfrc.com",289],["sinonimos.de",289],["antonimos.de",289],["quesignifi.ca",289],["tiktokrealtime.com",289],["tiktokcounter.net",289],["tpayr.xyz",289],["poqzn.xyz",289],["ashrfd.xyz",289],["rezsx.xyz",289],["tryzt.xyz",289],["ashrff.xyz",289],["rezst.xyz",289],["dawenet.com",289],["erzar.xyz",289],["waezm.xyz",289],["waezg.xyz",289],["blackwoodacademy.org",289],["cryptednews.space",289],["vivuq.com",289],["swgop.com",289],["vbnmll.com",289],["telcoinfo.online",289],["dshytb.com",289],["fitdynamos.com",[289,291]],["btcbitco.in",[289,293]],["btcsatoshi.net",289],["cempakajaya.com",289],["crypto4yu.com",289],["readbitcoin.org",289],["wiour.com",289],["finish.addurl.biz",289],["laweducationinfo.com",289],["savemoneyinfo.com",289],["worldaffairinfo.com",289],["godstoryinfo.com",289],["successstoryinfo.com",289],["learnmarketinfo.com",289],["bhugolinfo.com",289],["armypowerinfo.com",289],["rsadnetworkinfo.com",289],["rsinsuranceinfo.com",289],["rsfinanceinfo.com",289],["rsgamer.app",289],["rssoftwareinfo.com",289],["rshostinginfo.com",289],["rseducationinfo.com",289],["advertisingexcel.com",289],["allcryptoz.net",289],["batmanfactor.com",289],["beautifulfashionnailart.com",289],["crewbase.net",289],["documentaryplanet.xyz",289],["crewus.net",289],["gametechreviewer.com",289],["midebalonu.net",289],["misterio.ro",289],["phineypet.com",289],["seory.xyz",289],["shinbhu.net",289],["shinchu.net",289],["substitutefor.com",289],["talkforfitness.com",289],["thefitbrit.co.uk",289],["thumb8.net",289],["thumb9.net",289],["topcryptoz.net",289],["uniqueten.net",289],["ultraten.net",289],["exactpay.online",289],["kiddyearner.com",289],["luckydice.net",290],["adarima.org",290],["tieutietkiem.com",290],["weatherwx.com",290],["sattaguess.com",290],["winshell.de",290],["rosasidan.ws",290],["modmakers.xyz",290],["gamepure.in",290],["warrenrahul.in",290],["austiblox.net",290],["upiapi.in",290],["myownguess.in",290],["networkhint.com",290],["watchhentai.net",290],["thichcode.net",290],["texturecan.com",290],["tikmate.app",[290,516]],["4funbox.com",292],["nephobox.com",292],["1024tera.com",292],["blog.cryptowidgets.net",293],["blog.insurancegold.in",293],["blog.wiki-topia.com",293],["blog.coinsvalue.net",293],["blog.cookinguide.net",293],["blog.freeoseocheck.com",293],["blog24.me",293],["bildirim.link",295],["appsbull.com",296],["diudemy.com",296],["maqal360.com",296],["lifesurance.info",297],["infokeeda.xyz",298],["webzeni.com",298],["dl.apkmoddone.com",299],["phongroblox.com",299],["apkmodvn.com",300],["arcai.com",302],["my-code4you.blogspot.com",303],["flickr.com",304],["firefile.cc",305],["pestleanalysis.com",305],["kochamjp.pl",305],["tutorialforlinux.com",305],["whatsaero.com",305],["animeblkom.net",[305,321]],["blkom.com",305],["globes.co.il",[306,307]],["jardiner-malin.fr",308],["tw-calc.net",309],["ohmybrush.com",310],["talkceltic.net",311],["mentalfloss.com",312],["uprafa.com",313],["cube365.net",314],["nightfallnews.com",[315,316]],["wwwfotografgotlin.blogspot.com",317],["freelistenonline.com",317],["badassdownloader.com",318],["quickporn.net",319],["yellowbridge.com",320],["aosmark.com",322],["atozmath.com",[324,325,326,327,328,329,330]],["newyorker.com",331],["brighteon.com",332],["more.tv",333],["video1tube.com",334],["alohatube.xyz",334],["fshost.me",335],["link.cgtips.org",336],["hentaicloud.com",337],["paperzonevn.com",339],["hentaienglish.com",340],["hentaiporno.xxx",340],["venge.io",[341,342]],["btcbux.io",343],["its.porn",[344,345]],["atv.at",346],["kusonime.com",[347,348]],["jetpunk.com",[350,351]],["imgur.com",352],["hentai-party.com",353],["hentaicomics.pro",353],["xxx-comics.pro",353],["genshinimpactcalculator.com",356],["mysexgames.com",357],["embed.indavideo.hu",360],["coinurl.net",[361,362]],["gdr-online.com",363],["mmm.dk",364],["iqiyi.com",[365,366,508]],["m.iqiyi.com",367],["japopav.tv",368],["lvturbo.com",368],["nbcolympics.com",369],["apkhex.com",370],["indiansexstories2.net",371],["issstories.xyz",371],["1340kbbr.com",372],["gorgeradio.com",372],["kduk.com",372],["kedoam.com",372],["kejoam.com",372],["kelaam.com",372],["khsn1230.com",372],["kjmx.rocks",372],["kloo.com",372],["klooam.com",372],["klykradio.com",372],["kmed.com",372],["kmnt.com",372],["kool991.com",372],["kpnw.com",372],["kppk983.com",372],["krktcountry.com",372],["ktee.com",372],["kwro.com",372],["kxbxfm.com",372],["thevalley.fm",372],["quizlet.com",373],["dsocker1234.blogspot.com",374],["schoolcheats.net",[375,376]],["mgnet.xyz",377],["designtagebuch.de",378],["pixroute.com",379],["uploady.io",380],["calculator-online.net",381],["porngames.club",382],["sexgames.xxx",382],["111.90.159.132",383],["battleplan.news",383],["mobile-tracker-free.com",384],["pfps.gg",385],["ac-illust.com",[386,387]],["photo-ac.com",[386,387]],["vlxxs.net",388],["rapelust.com",388],["vtube.to",388],["vtplay.net",388],["desitelugusex.com",388],["xvideos-downloader.net",388],["xxxvideotube.net",388],["sdefx.cloud",388],["nozomi.la",388],["moviesonlinefree.net",388],["social-unlock.com",389],["ninja.io",390],["sourceforge.net",391],["samfirms.com",392],["huffpost.com",393],["ingles.com",394],["spanishdict.com",394],["surfline.com",[395,396]],["play.tv3.ee",397],["play.tv3.lt",397],["play.tv3.lv",397],["tv3play.skaties.lv",397],["trendyoum.com",398],["bulbagarden.net",399],["moviestars.to",400],["hollywoodlife.com",401],["mat6tube.com",402],["textstudio.co",403],["newtumbl.com",404],["aruble.net",406],["nevcoins.club",407],["mail.com",408],["oggi.it",[411,412]],["manoramamax.com",411],["video.gazzetta.it",[411,412]],["mangakita.id",413],["mangakita.net",413],["poscishd.online",414],["avpgalaxy.net",415],["mhma12.tech",416],["panda-novel.com",417],["zebranovel.com",417],["lightsnovel.com",417],["eaglesnovel.com",417],["pandasnovel.com",417],["zadfaucet.com",418],["ewrc-results.com",419],["kizi.com",420],["cyberscoop.com",421],["fedscoop.com",421],["canale.live",422],["indiatimes.com",423],["mafiatown.pl",[424,425]],["jeep-cj.com",426],["sponsorhunter.com",427],["cloudcomputingtopics.net",428],["likecs.com",429],["tiscali.it",430],["linkspy.cc",431],["tutelehd3.xyz",432],["dirty.pink",[433,434,435]],["adshnk.com",436],["chattanoogan.com",437],["adsy.pw",438],["playstore.pw",438],["socialmediagirls.com",439],["windowspro.de",440],["snapinsta.app",441],["tvtv.ca",442],["tvtv.us",442],["mydaddy.cc",443],["roadtrippin.fr",444],["vavada5com.com",445],["redketchup.io",[446,447,448]],["anyporn.com",[449,465]],["bravoporn.com",449],["bravoteens.com",449],["crocotube.com",449],["hellmoms.com",449],["hellporno.com",449],["sex3.com",449],["tubewolf.com",449],["xbabe.com",449],["xcum.com",449],["zedporn.com",449],["imagetotext.info",450],["infokik.com",451],["freepik.com",452],["ddwloclawek.pl",[453,454]],["deezer.com",455],["my-subs.co",456],["plaion.com",457],["rapid-cloud.co",458],["slideshare.net",[459,460]],["ustreasuryyieldcurve.com",461],["businesssoftwarehere.com",462],["goo.st",462],["freevpshere.com",462],["softwaresolutionshere.com",462],["staige.tv",466],["in-jpn.com",467],["oninet.ne.jp",467],["xth.jp",467],["androidadult.com",468],["streamvid.net",469],["watchtv24.com",470],["cellmapper.net",471],["medscape.com",472],["newscon.org",[473,474]],["arkadium.com",475],["bembed.net",476],["elbailedeltroleo.site",476],["embedv.net",476],["fslinks.org",476],["listeamed.net",476],["v6embed.xyz",476],["vgplayer.xyz",476],["vid-guard.com",476],["vidguard.online",476],["app.blubank.com",477],["mobileweb.bankmellat.ir",477],["sportdeutschland.tv",478],["kcra.com",478],["wcvb.com",478],["ccthesims.com",485],["chromeready.com",485],["coursedrive.org",485],["dtbps3games.com",485],["illustratemagazine.com",485],["uknip.co.uk",485],["vod.pl",486],["megadrive-emulator.com",487],["animesaga.in",490],["moviesapi.club",490],["bestx.stream",490],["watchx.top",490],["digimanie.cz",491],["svethardware.cz",491],["srvy.ninja",492],["drawer-opportunity-i-243.site",493],["tchatche.com",494],["edmdls.com",495],["freshremix.net",495],["scenedl.org",495],["trakt.tv",496],["shroomers.app",497],["classicalradio.com",498],["di.fm",498],["jazzradio.com",498],["radiotunes.com",498],["rockradio.com",498],["zenradio.com",498],["pc-builds.com",499],["qtoptens.com",499],["reuters.com",499],["today.com",499],["videogamer.com",499],["wrestlinginc.com",499],["gbatemp.net",499],["movie-th.tv",500],["iwanttfc.com",501],["nutraingredients-asia.com",502],["nutraingredients-latam.com",502],["nutraingredients-usa.com",502],["nutraingredients.com",502],["mavenarts.in",503],["ozulscansen.com",504],["fitnessbr.click",505],["minhareceita.xyz",505],["doomied.monster",506],["lookmovie2.to",506],["royalroad.com",507],["biletomat.pl",509],["hextank.io",[510,511]],["filmizlehdfilm.com",[512,513,514,515]],["fullfilmizle.cc",[512,513,514,515]],["sagewater.com",517],["redlion.net",517],["satdl.com",518],["vidstreaming.xyz",519],["everand.com",520],["myradioonline.pl",521],["tacobell.com",523],["zefoy.com",524],["natgeotv.com",526],["br.de",527],["indeed.com",528],["pasteboard.co",529],["clickhole.com",530],["deadspin.com",530],["gizmodo.com",530],["jalopnik.com",530],["jezebel.com",530],["kotaku.com",530],["lifehacker.com",530],["splinternews.com",530],["theinventory.com",530],["theonion.com",530],["theroot.com",530],["thetakeout.com",530],["pewresearch.org",530],["los40.com",[531,532]],["as.com",532],["telegraph.co.uk",[533,534]],["poweredbycovermore.com",[533,583]],["lumens.com",[533,583]],["verizon.com",535],["humanbenchmark.com",536],["politico.com",537],["officedepot.co.cr",[538,539]],["usnews.com",542],["factable.com",544],["zee5.com",545],["gala.fr",546],["geo.fr",546],["voici.fr",546],["gloucestershirelive.co.uk",547],["arsiv.mackolik.com",548],["jacksonguitars.com",549],["scandichotels.com",550],["stylist.co.uk",551],["nettiauto.com",552],["thaiairways.com",[553,554]],["cerbahealthcare.it",[555,556]],["futura-sciences.com",[555,572]],["tiendaenlinea.claro.com.ni",[557,558]],["tieba.baidu.com",559],["grasshopper.com",[562,563]],["epson.com.cn",[564,565,566,567]],["oe24.at",[568,569]],["szbz.de",568],["platform.autods.com",[570,571]],["wikihow.com",573],["citibank.com.sg",574],["uol.com.br",[575,576,577,578,579]],["gazzetta.gr",580],["digicol.dpm.org.cn",[581,582]],["virginmediatelevision.ie",584],["larazon.es",[585,586]],["waitrosecellar.com",[587,588,589]],["sharpen-free-design-generator.netlify.app",[591,592]],["help.cashctrl.com",[593,594]],["commande.rhinov.pro",[595,596]],["ecom.wixapps.net",[595,596]],["tipranks.com",[597,598]],["iceland.co.uk",[599,600,601]],["socket.pearsoned.com",602],["tntdrama.com",[603,604]],["mobile.de",[605,606]],["ioe.vn",[607,608]],["geiriadur.ac.uk",[607,611]],["welsh-dictionary.ac.uk",[607,611]],["bikeportland.org",[609,610]],["biologianet.com",[576,577,578]],["10play.com.au",[612,613]],["sunshine-live.de",[614,615]],["whatismyip.com",[616,617]],["myfitnesspal.com",618],["netoff.co.jp",[619,620]],["clickjogos.com.br",623],["bristan.com",[624,625]],["zillow.com",626],["share.hntv.tv",[627,628,629,630]],["forum.dji.com",[627,630]],["optimum.net",[631,632]],["investor-web.hdfcfund.com",633],["user.guancha.cn",[634,635]],["sosovalue.com",636],["bandyforbundet.no",[637,638]],["tatacommunications.com",639],["suamusica.com.br",[640,641,642]],["macrotrends.net",[643,644]],["code.world",645],["topgear.com",646],["eservice.directauto.com",[647,648]],["poophq.com",649],["veev.to",649],["0115765.com",650],["uber.com",[651,652]],["jdsports.com",[651,652]],["engadget.com",[651,652]],["yahoo.com",[651,652]],["techcrunch.com",[651,652]],["rivals.com",[651,652]],["kkrt.com",[651,652]],["crunchyroll.com",[651,652]],["dnb.com",[651,652]],["dnb.co.uk",[651,652]],["weather.com",[651,652]],["ubereats.com",[651,652]],["usatoday.com",653]]);

const entitiesMap = new Map([["watch-series",9],["watchseries",9],["vev",9],["vidop",9],["vidup",9],["starmusiq",12],["wcofun",12],["kissasian",14],["gogoanime",[14,50]],["1movies",[14,17]],["xmovies8",14],["animeheaven",14],["0123movies",14],["gostream",14],["gomovies",14],["primewire",15],["streanplay",[15,16]],["sbplay",15],["milfnut",15],["sxyprn",21],["hqq",[22,23]],["waaw",[23,24]],["younetu",23],["vvtplayer",23],["123link",25],["adshort",25],["linkshorts",25],["adsrt",25],["vinaurl",25],["adfloz",25],["dutchycorp",25],["shortearn",25],["pingit",25],["shrink",25],["tmearn",25],["megalink",25],["miniurl",25],["gplinks",25],["clk",25],["pureshort",25],["shrinke",25],["shrinkme",25],["pcprogramasymas",25],["link1s",25],["shortzzy",25],["shorttey",[25,198]],["lite-link",25],["adcorto",25],["zshort",25],["upfiles",25],["linkfly",25],["wplink",25],["seulink",25],["encurtalink",25],["camwhores",[26,37,80,81,82]],["tube8",[27,28]],["youporn",28],["redtube",28],["pornhub",[28,184]],["upornia",[30,31]],["fmovies",50],["xtits",[53,115]],["streamwish",[55,56]],["pouvideo",60],["povvideo",60],["povw1deo",60],["povwideo",60],["powv1deo",60],["powvibeo",60],["powvideo",60],["powvldeo",60],["plyjam",[65,66]],["fxporn69",71],["vipbox",72],["viprow",72],["desbloqueador",77],["xberuang",78],["teknorizen",78],["subtorrents",85],["subtorrents1",85],["newpelis",85],["pelix",85],["allcalidad",85],["infomaniakos",85],["filecrypt",90],["tornadomovies",96],["icdrama",102],["mangasail",102],["file4go",104],["mangovideo",116],["asianclub",124],["anitube",127],["mixdrop",129],["uploadev",154],["ver-pelis-online",162],["ancient-origins",171],["spankbang",191],["lookcam",198],["lootlinks",198],["dpstream",201],["bluemediafiles",203],["docer",227],["hamsterix",244],["xhamster",244],["xhamster1",244],["xhamster10",244],["xhamster11",244],["xhamster12",244],["xhamster13",244],["xhamster14",244],["xhamster15",244],["xhamster16",244],["xhamster17",244],["xhamster18",244],["xhamster19",244],["xhamster20",244],["xhamster2",244],["xhamster3",244],["xhamster4",244],["xhamster42",244],["xhamster5",244],["xhamster7",244],["xhamster8",244],["acortalo",[246,247,248,249]],["acortar",[246,247,248,249]],["a2zapk",253],["kickassanime",263],["doomovie-hd",267],["drakecomic",285],["terabox",292],["ctrlv",323],["123movieshd",349],["uproxy",354],["animesa",355],["cinecalidad",[358,359]],["dvdplay",388],["apkmaven",405],["gmx",409],["gamereactor",464],["vembed",476],["empire-anime",[479,480,481,482,483]],["empire-stream",[479,480,481]],["empire-streaming",[479,480,481]],["empire-streamz",[479,480,481]],["tvhay",[488,489]],["lookmovie",506],["filmizletv",[512,513,514,515]],["www.google",522],["officedepot",[540,541]],["foundit",[621,622]]]);

const exceptionsMap = new Map([["pingit.com",[25]],["pingit.me",[25]],["lookmovie.studio",[506]]]);

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
