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

const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["playerResponse.adPlacements","undefined"],["abp","false"],["oeo","noopFunc"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["console.clear","trueFunc"],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["initials.yld-pdpopunder",""],["xRds","false"],["tRds","true"],["console.clear","noopFunc"],["String.fromCharCode","noopFunc"],["console.log","noopFunc"],["String.prototype.charCodeAt","trueFunc"],["console.clear","undefined"],["attachEvent","trueFunc"],["hasAdBlocker","false"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["sadbl","false"],["adblockcheck","false"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["is_adblocked","false"],["showPopunder","noopFunc"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["fuckAdBlock","false"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["flashvars.adv_pause_html",""],["adblockSuspected","false"],["disasterpingu","false"],["CnnXt.Event.fire","noopFunc"],["App.views.adsView.adblock","false"],["$.fx.off","true"],["adsClasses","undefined"],["gsecs","0"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["detectAdBlock","noopFunc"],["attr","{}"],["scriptSrc",""],["Object.prototype.adReinsertion","noopFunc"],["Object.prototype.disableAds","true"],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["adBlock","false"],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["publd.noads","true"],["caca","noopFunc"],["Ok","true"],["isBlocked","false"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["ifmax","true"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["isAdblock","false"],["atob","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["flashvars.popunder_url",""],["_pop","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["isAdsDisplayed","true"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["ad_permission","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["ads_js_was_loaded","true"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["jQuery.adblock","false"],["google_jobrunner","true"],["clientSide.adbDetect","noopFunc"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["di.VAST.XHRURLHandler","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["checkdom","0"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["counter","0"],["window_focus","true"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["daganKwarta","true"],["dvsize","51"],["isal","true"],["count","0"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["Global.adv","undefined"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["adblockDetector","noopFunc"],["loadingAds","true"],["ads_blocked","0"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["nozNoAdBlock","true"],["decodeURIComponent","trueFunc"],["process","noopFunc"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["testerli","false"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["show_ads_gr8_lite","true"],["doads","true"],["jsUnda","noopFunc"],["abp","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["HTMLElement.prototype.attachShadow","null"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["getHomadConfig","noopFunc"],["adsbygoogle.loaded","true"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["app.addonIsInstalled","trueFunc"],["flashvars.popunder_url","undefined"],["adv","true"],["pqdxwidthqt","false"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["CustomEvent","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["cRAds","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["ai_dummy","true"],["ulp_noadb","true"],["wgAffiliateEnabled","false"],["ads","null"],["checkAdsBlocked","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["AdBlockerDetected","noopFunc"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["timeSec","0"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["importFAB","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["fouty","true"],["detectAdblock","noopFunc"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["Object.prototype.m_nLastTimeAdBlock","undefined"],["config.pauseInspect","false"],["D4zz","noopFunc"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["sems","noopFunc"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["runAdblock","noopFunc"],["$tieE3","true"],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["adblock","0"],["db.onerror","noopFunc"],["p18","undefined"],["asc","1"],["ADBLOCKED","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["adsHeight","11"],["checkCap","0"],["waitTime","0"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["isadb","false"],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["new_config.timedown","0"],["timedisplay","0"],["Object.prototype.isAdDisabled","true"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["ad_link",""],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["Object.prototype.nopreroll_","true"],["ublocked","false"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["adSettings","[]"],["count","1"],["Object.prototype.enableInterstitial","false"],["check","noopFunc"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["tiPopAction","noopFunc"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["document.hasFocus","trueFunc"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["dable","{}"],["aLoad","noopFunc"],["mtCanRunAdsSoItCanStillBeOnTheWeb","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["navigator.brave","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["Overlayer","{}"],["pop3getcookie","undefined"],["pop3setcookie1","undefined"],["pop3setCookie2","undefined"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["Object.prototype.adBlockerDetected","falseFunc"],["Object.prototype.adBlocker","false"],["Object.prototype.tomatoDetected","falseFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["admiral","noopFunc"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adblockEnabled","noopFunc"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["makeMoney","true"],["chp_adblock_browser","noopFunc"],["hadeh_ads","false"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["Object.prototype.isAllAdClose","true"],["navigator.standalone","true"],["showAdss","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["window.showAds","true"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["playerConfigs.rek","{}"],["feedBack.showAffilaePromo","noopFunc"],["checkAdBlocker","noopFunc"],["loadpagecheck","noopFunc"],["$.tstracker","noopFunc"],["bmak.js_post","false"],["ccsrv",""],["lcs_SerName",""],["flashvars.event_reporting",""],["firebase.analytics","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["DD_LOGS","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["eyshy_start","false"],["ubactive","0"]];

const hostnamesMap = new Map([["youtube.com",[0,1,2]],["youtubekids.com",[0,1,2]],["youtube-nocookie.com",[0,1,2]],["t-online.de",3],["whatfinger.com",4],["timesofindia.indiatimes.com",5],["economictimes.indiatimes.com",6],["userscloud.com",7],["motherless.com",8],["sueddeutsche.de",9],["watson.de",9],["watchanimesub.net",10],["wco.tv",10],["wcoanimesub.tv",10],["wcoforever.net",10],["filehorse.com",10],["guidetnt.com",10],["sp-today.com",10],["linkvertise.com",10],["textbin.net",10],["eropaste.com",10],["pastebr.xyz",10],["getpaste.link",10],["sharetext.me",10],["note.sieuthuthuat.com",10],["elcriticodelatele.com",[10,307]],["gadgets.es",[10,307]],["wiwo.de",11],["masteranime.es",12],["9anime.vip",12],["fullxh.com",13],["megaxh.com",13],["unlockxh4.com",13],["xhadult2.com",13],["xhadult3.com",13],["xhadult4.com",13],["xhadult5.com",13],["xhamster46.com",13],["xhday.com",13],["xhday1.com",13],["xhmoon5.com",13],["xhplanet1.com",13],["xhplanet2.com",13],["xhreal2.com",13],["xhreal3.com",13],["xhtab2.com",13],["xhvictory.com",13],["xhwebsite.com",13],["xhwebsite2.com",13],["xhwide1.com",13],["xhwide8.com",13],["alphaporno.com",[16,408]],["porngem.com",16],["uploadbank.com",16],["shortit.pw",[16,107]],["familyporn.tv",16],["cloudemb.com",[16,329]],["sbplay1.com",16],["swatchseries.ru",16],["id45.cyou",16],["85tube.com",[16,90]],["pobre.tv",16],["k1nk.co",16],["watchasians.cc",16],["photopea.com",16],["imsdb.pw",[16,25]],["soltoshindo.com",16],["techtimes.com",17],["dronedj.com",19],["freeplayervideo.com",20],["nazarickol.com",20],["player-cdn.com",20],["voe.sx",20],["housecardsummerbutton.com",20],["bigclatterhomesguideservice.com",20],["uptodatefinishconference.com",20],["uptodatefinishconferenceroom.com",20],["tinycat-voe-fashion.com",20],["motphimtv.com",20],["rabbitstream.net",20],["streamlare.com",20],["projectfreetv.one",20],["nolive.me",21],["cbs.com",22],["paramountplus.com",22],["player.glomex.com",23],["merkur.de",23],["tz.de",23],["hotpornfile.org",25],["chillicams.net",25],["rpdrlatino.live",25],["adbull.org",26],["mitly.us",26],["linkrex.net",26],["linx.cc",26],["oke.io",26],["dz4link.com",26],["linclik.com",26],["shrt10.com",26],["loptelink.com",26],["cut-fly.com",26],["linkfinal.com",26],["payskip.org",26],["cutpaid.com",26],["forexmab.com",26],["linkjust.com",26],["linkszia.co",26],["leechpremium.link",26],["icutlink.com",[26,129]],["stfly.me",26],["oncehelp.com",26],["bit-url.com",26],["rgl.vn",26],["reqlinks.net",26],["wu8.in",26],["bitlk.com",26],["qlinks.eu",26],["link.3dmili.com",26],["short-fly.com",26],["foxseotools.com",26],["pngit.live",26],["link.turkdown.com",26],["slink.bid",[26,71]],["earnwithshortlink.com",26],["7r6.com",26],["enrt.eu",26],["oko.sh",26],["shortpaid.com",26],["ckk.ai",26],["fc.lc",26],["fstore.biz",26],["cuts-url.com",26],["eio.io",26],["exe.app",26],["exee.io",26],["exey.io",26],["srek.net",26],["skincarie.com",26],["exeo.app",26],["clk.ink",26],["birdurls.com",26],["coinlyhub.com",[26,215]],["adsafelink.com",26],["aii.sh",26],["shrinkurl.org",26],["adsh.cc",26],["cybertechng.com",[26,224]],["owllink.net",26],["fir3.net",26],["cutdl.xyz",26],["gplinks.co",26],["loan2host.com",26],["tei.ai",26],["tii.ai",26],["iir.ai",26],["shorteet.com",[26,245]],["sekilastekno.com",26],["promo-visits.site",26],["satoshi-win.xyz",[26,254]],["shorterall.com",26],["smoner.com",26],["bitlinks.pw",26],["linkad.in",26],["linkshrnk.com",26],["popimed.com",26],["linksly.co",26],["ur-ly.xyz",26],["shrinkme.in",26],["rodjulian.com",26],["pkr.pw",26],["shrinke.me",26],["imagenesderopaparaperros.com",26],["shortenbuddy.com",26],["gibit.xyz",26],["apksvip.com",26],["cashurl.in",26],["4cash.me",26],["namaidani.com",26],["bitfly.io",26],["teknomuda.com",26],["illink.net",26],["miuiku.com",26],["yourtechnology.online",26],["savelink.site",26],["fxlap.com",26],["earnfasts.com",26],["absolutesmmpanel.com",26],["myhiddentech.com",26],["tawiia.com",26],["droplink.co",26],["recipestutorials.com",26],["ashort1a.xyz",26],["2shrt.com",26],["apkshrt.com",26],["genpassword.top",26],["srts.me",26],["cuturl.in",26],["lyricsbot.pw",26],["short88.com",26],["cashearn.cc",26],["kutmoney.com",26],["kutt.io",26],["sanoybonito.club",26],["samaa-pro.com",26],["miklpro.com",26],["modapk.link",26],["shrinkforearn.in",26],["1shorten.com",26],["ccurl.net",26],["st23q.com",26],["beautyram.info",26],["gonety.com",26],["viraloc.com",26],["clickscoin.com",26],["forex-trnd.com",26],["kiiw.icu",26],["vshort.link",26],["link.ltc24.com",26],["galaxy-link.space",26],["linkpoi.me",26],["usdshort.com",26],["bitcoinly.in",26],["menjelajahi.com",26],["pewgame.com",26],["yxoshort.com",26],["1link.vip",26],["linkcc.pro",26],["haonguyen.top",26],["jameeltips.us",26],["claimfreebits.com",26],["mfk-shorter.com",26],["crazyblog.in",26],["gtlink.co",26],["link.tokenoto.com",26],["cutearn.net",26],["rshrt.com",26],["jp88.xyz",26],["short.palmeratv.com",26],["filezipa.com",26],["arab-chat.club",26],["dz-linkk.com",26],["theblissempire.com",26],["shortlink.prz.pw",26],["zipurls.com",26],["finanzas-vida.com",26],["skiplink.org",26],["techmyhub.com",26],["adurly.cc",26],["pix4link.com",26],["paid4.link",26],["ez4short.com",26],["link.asiaon.top",26],["go.gets4link.com",26],["download.sharenulled.net",26],["enagato.com",26],["linkres.in",26],["webo.one",26],["automotur.club",26],["pandarticles.com",26],["beingtek.com",26],["katflys.com",26],["shorturl.unityassets4free.com",26],["disheye.com",26],["techymedies.com",26],["techysuccess.com",26],["toptap.website",[26,335]],["za.gl",[26,152]],["newsalret.com",26],["download.baominh.tech",26],["bblink.com",26],["abre.click",26],["linkbr.xyz",26],["myad.biz",26],["go.netfile.cc",26],["try2link.com",26],["swzz.xyz",26],["vevioz.com",26],["charexempire.com",26],["clk.asia",26],["rancah.com",26],["egfly.xyz",26],["linka.click",26],["sturls.com",26],["myshrinker.com",26],["upshrink.com",26],["go.adinsurance.xyz",26],["aylink.info",26],["dash-free.com",[26,224]],["rainurl.com",[26,224]],["snowurl.com",[26,224]],["netfile.cc",26],["link.insurance-space.xyz",26],["link.insurglobal.xyz",26],["theconomy.me",26],["rajsayt.xyz",26],["rocklink.in",26],["linkshortify.site",26],["adinsurance.xyz",26],["insurglobal.xyz",26],["techgeek.digital",26],["download3s.net",26],["shortx.net",26],["musicc.xyz",26],["cutx.me",26],["btcwalk.com",26],["cryptoon.xyz",26],["easysky.in",26],["veganab.co",26],["shortawy.com",26],["tlin.me",26],["apprepack.com",26],["post.nites-tv.xyz",26],["sh2rt.com",26],["up-load.one",26],["zuba.link",26],["pandaznetwork.com",26],["du-link.in",26],["linksfy.co",26],["adrinolinks.in",26],["golink.xaydungplus.com",26],["bestcash2020.com",26],["cut-y.net",26],["hoxiin.com",26],["technemo.xyz",26],["baicho.xyz",26],["go.linkbnao.com",26],["link-yz.com",26],["paylinnk.com",26],["thizissam.in",26],["ier.ai",26],["bloggertheme.xyz",26],["adslink.pw",26],["enit.in",[26,241]],["oii.io",26],["novelssites.com",26],["links.medipost.org",26],["faucetcrypto.net",26],["short.freeltc.top",26],["trxking.xyz",26],["weadown.com",26],["cookdov.com",26],["xpshort.com",26],["bdnewsx.com",26],["m.bloggingguidance.com",26],["blog.onroid.com",26],["cutty.app",26],["link.codevn.net",26],["upfilesurls.com",26],["shareus.site",26],["link4rev.site",26],["bloginguru.xyz",26],["tii.la",26],["celinks.net",26],["c2g.at",26],["atglinks.com",26],["shortzu.icu",26],["bitcosite.com",26],["cryptosh.pro",26],["sigmalinks.in",26],["link68.net",26],["traffic123.net",26],["gainl.ink",26],["windowslite.net",[26,224]],["coinsl.click",26],["exalink.fun",26],["watchmygf.me",[27,52]],["fpo.xxx",[27,54]],["sexemix.com",27],["heavyfetish.com",[27,454]],["you-porn.com",29],["youporngay.com",29],["youpornru.com",29],["9908ww.com",29],["adelaidepawnbroker.com",29],["bztube.com",29],["hotovs.com",29],["insuredhome.org",29],["nudegista.com",29],["pornluck.com",29],["vidd.se",29],["pornhub.com",29],["pornerbros.com",30],["freep.com",30],["porn.com",31],["tune.pk",32],["noticias.gospelmais.com.br",33],["techperiod.com",33],["jacquieetmicheltv.net",[34,35]],["illicoporno.com",34],["lavoixdux.com",34],["tonpornodujour.com",34],["jacquieetmichel.net",34],["swame.com",34],["vosfemmes.com",34],["voyeurfrance.net",34],["viki.com",[36,37]],["sleazyneasy.com",[38,39,40]],["smutr.com",[38,211]],["yourporngod.com",[38,39]],["javbangers.com",[38,295]],["camfox.com",38],["camthots.tv",[38,123]],["shegotass.info",38],["amateur8.com",38],["bigtitslust.com",38],["ebony8.com",38],["freeporn8.com",38],["lesbian8.com",38],["maturetubehere.com",38],["sortporn.com",38],["webcamvau.com",38],["motherporno.com",[38,39,54,125]],["theporngod.com",[38,39]],["pornsocket.com",41],["luxuretv.com",42],["porndig.com",[43,44]],["webcheats.com.br",45],["ceesty.com",[46,47]],["gestyy.com",[46,47]],["corneey.com",47],["destyy.com",47],["festyy.com",47],["sh.st",47],["angrybirdsnest.com",48],["zrozz.com",48],["clix4btc.com",48],["katfile.com",48],["4tests.com",48],["planet-explorers-isos.com",48],["business-standard.com",48],["goltelevision.com",48],["news-und-nachrichten.de",48],["laradiobbs.net",48],["urlaubspartner.net",48],["produktion.de",48],["cinemaxxl.de",48],["bladesalvador.com",48],["tempr.email",48],["cshort.org",48],["friendproject.net",48],["covrhub.com",48],["planetsuzy.org",49],["empflix.com",50],["filespace.com",51],["transparentcalifornia.com",52],["deepbrid.com",53],["submityourflicks.com",54],["3movs.com",54],["cambay.tv",[54,104,123,125]],["bravoerotica.net",[54,125]],["youx.xxx",54],["camclips.tv",[54,211]],["camflow.tv",[54,104,125,175,249]],["camhoes.tv",[54,104,123,125,175,249]],["xmegadrive.com",54],["xxxymovies.com",54],["xxxshake.com",54],["gayck.com",54],["xhand.com",[54,125]],["analdin.com",[54,125]],["webnovel.com",55],["schwaebische.de",56],["mercurynews.com",57],["chicoer.com",57],["dailybreeze.com",57],["dailybulletin.com",57],["dailynews.com",57],["delcotimes.com",57],["eastbaytimes.com",57],["macombdaily.com",57],["ocregister.com",57],["pasadenastarnews.com",57],["pe.com",57],["presstelegram.com",57],["redlandsdailyfacts.com",57],["reviewjournal.com",57],["santacruzsentinel.com",57],["saratogian.com",57],["sentinelandenterprise.com",57],["sgvtribune.com",57],["tampabay.com",57],["times-standard.com",57],["theoaklandpress.com",57],["trentonian.com",57],["twincities.com",57],["whittierdailynews.com",57],["bostonherald.com",57],["dailycamera.com",57],["sbsun.com",57],["dailydemocrat.com",57],["montereyherald.com",57],["orovillemr.com",57],["record-bee.com",57],["redbluffdailynews.com",57],["reporterherald.com",57],["thereporter.com",57],["timescall.com",57],["timesheraldonline.com",57],["ukiahdailyjournal.com",57],["dailylocal.com",57],["8tracks.com",58],["revealname.com",59],["fcportables.com",[60,61]],["golfchannel.com",63],["telemundodeportes.com",63],["stream.nbcsports.com",63],["gamcore.com",64],["porcore.com",64],["69games.xxx",64],["javmix.app",64],["tecknity.com",65],["haaretz.com",66],["hungama.com",66],["a-o.ninja",66],["anime-odcinki.pl",66],["kumpulmanga.org",66],["shortgoo.blogspot.com",66],["tonanmedia.my.id",[66,437]],["yurasu.xyz",66],["isekaipalace.com",66],["megadescarga.net",[67,68,69,70]],["megadescargas.net",[67,68,69,70]],["audioz.cc",71],["audioz.es",71],["luckydice.net",71],["adarima.org",71],["tieutietkiem.com",71],["weatherwx.com",71],["sattaguess.com",71],["winshell.de",71],["rosasidan.ws",71],["modmakers.xyz",71],["gamepure.in",71],["warrenrahul.in",71],["austiblox.net",71],["upiapi.in",71],["myownguess.in",71],["watchhentai.net",71],["thichcode.net",71],["texturecan.com",71],["vikistream.com",72],["eplayer.click",[72,73]],["mega4upload.com",[73,79]],["ennovelas.com",[73,79]],["n-tv.de",74],["brigitte.de",75],["stern.de",75],["foxsports.com.au",76],["canberratimes.com.au",76],["thesimsresource.com",77],["bdnewszh.com",79],["streamservicehd.click",79],["timeforbitco.in",80],["worldofbitco.in",[80,93]],["weatherx.co.in",[80,93]],["getyourbitco.in",80],["sunbtc.space",80],["ctrl.blog",81],["sportlife.es",82],["tubitv.com",82],["libertaddigital.com",83],["finofilipino.org",84],["acortarm.xyz",85],["acortame.xyz",85],["speedtest.net",86],["mysflink.blogspot.com",87],["assia.tv",88],["assia4.com",88],["assia24.com",88],["cwtvembeds.com",[90,124]],["camlovers.tv",90],["porntn.com",90],["pornissimo.org",90],["sexcams-24.com",[90,104]],["watchporn.to",[90,104]],["camwhorez.video",90],["ojogos.com.br",95],["powforums.com",96],["supforums.com",96],["studybullet.com",96],["usgamer.net",97],["recordonline.com",97],["123tvseries.co",99],["freebitcoin.win",100],["e-monsite.com",100],["coindice.win",100],["temp-mails.com",101],["freiepresse.de",102],["investing.com",103],["camhub.cc",104],["love4porn.com",104],["thotvids.com",104],["celebwhore.com",104],["cluset.com",104],["4kporn.xxx",104],["xhomealone.com",104],["lusttaboo.com",[104,370]],["mp3fiber.com",105],["suedkurier.de",106],["anysex.com",108],["gomiblog.com",109],["iptvtools.net",109],["vlist.se",110],["pornve.com",111],["coolrom.com.au",112],["bitcotasks.com",112],["pornohirsch.net",113],["marie-claire.es",114],["gamezhero.com",114],["flashgirlgames.com",114],["onlinesudoku.games",114],["mpg.football",114],["sssam.com",114],["globalnews.ca",115],["videotekaime.net",116],["drinksmixer.com",117],["leitesculinaria.com",117],["fupa.net",118],["ge-map-overlays.appspot.com",119],["browardpalmbeach.com",120],["dallasobserver.com",120],["houstonpress.com",120],["miaminewtimes.com",120],["phoenixnewtimes.com",120],["westword.com",120],["nhentai.net",121],["fox.com.tr",122],["caminspector.net",123],["camwhoreshd.com",123],["camgoddess.tv",123],["gay4porn.com",125],["mypornhere.com",125],["mediapason.it",126],["linkspaid.com",126],["tuotromedico.com",126],["neoteo.com",126],["phoneswiki.com",126],["celebmix.com",126],["myneobuxportal.com",126],["oyungibi.com",126],["25yearslatersite.com",126],["jeshoots.com",127],["techhx.com",127],["karanapk.com",127],["videogreen.xyz",128],["sypl.xyz",128],["playembed.xyz",128],["javhdporn.net",128],["redanimedatabase.cloud",128],["javstream.top",128],["flashplayer.fullstacks.net",130],["cloudapps.herokuapp.com",130],["youfiles.herokuapp.com",130],["temp-mail.org",131],["di.fm",132],["comnuan.com",133],["veedi.com",134],["battleboats.io",134],["fruitlab.com",135],["haddoz.net",135],["garoetpos.com",135],["stiletv.it",136],["hpav.tv",137],["hpjav.tv",137],["hqtv.biz",139],["liveuamap.com",140],["filmiseriali.com",140],["muvibg.com",140],["linksht.com",[141,142]],["audycje.tokfm.pl",143],["hulu.com",[144,145,146]],["shush.se",147],["aniwatcher.com",148],["emurom.net",149],["allkpop.com",150],["azmath.info",151],["downfile.site",151],["downphanmem.com",151],["expertvn.com",151],["memangbau.com",151],["scratch247.info",151],["trangchu.news",151],["adfoc.us",151],["mynewsmedia.co",[151,238]],["sptfy.be",151],["streamcheck.link",151],["pickcrackpasswords.blogspot.com",153],["kfrfansub.com",154],["thuglink.com",154],["voipreview.org",154],["audiotag.info",155],["hanime.tv",156],["pogo.com",157],["cloudvideo.tv",158],["legionjuegos.org",159],["legionpeliculas.org",159],["legionprogramas.org",159],["16honeys.com",160],["elespanol.com",161],["remodelista.com",162],["coolmathgames.com",[163,164,165,467]],["audiofanzine.com",166],["noweconomy.live",168],["howifx.com",168],["vavada5com.com",168],["hitokin.net",169],["elil.cc",170],["developerinsider.co",171],["ilprimatonazionale.it",172],["hotabis.com",172],["root-nation.com",172],["italpress.com",172],["airsoftmilsimnews.com",172],["artribune.com",172],["thehindu.com",173],["cambro.tv",[174,175]],["nibelungen-kurier.de",176],["noz.de",177],["earthgarage.com",179],["pianetamountainbike.it",180],["barchart.com",181],["modelisme.com",182],["parasportontario.ca",182],["prescottenews.com",182],["nrj-play.fr",183],["oeffentlicher-dienst.info",184],["hackingwithreact.com",185],["gutekueche.at",186],["eplfootballmatch.com",187],["peekvids.com",188],["playvids.com",188],["pornflip.com",188],["redensarten-index.de",189],["vw-page.com",190],["viz.com",[191,192]],["queenfaucet.website",193],["0rechner.de",194],["configspc.com",195],["xopenload.me",195],["uptobox.com",195],["uptostream.com",195],["onepiece-tube.com",196],["japgay.com",197],["mega-debrid.eu",198],["dreamdth.com",199],["pijanitvor.com",199],["diaridegirona.cat",202],["diariodeibiza.es",202],["diariodemallorca.es",202],["diarioinformacion.com",202],["eldia.es",202],["emporda.info",202],["farodevigo.es",202],["laopinioncoruna.es",202],["laopiniondemalaga.es",202],["laopiniondemurcia.es",202],["laopiniondezamora.es",202],["laprovincia.es",202],["levante-emv.com",202],["mallorcazeitung.es",202],["regio7.cat",202],["superdeporte.es",202],["playpaste.com",203],["player.rtl2.de",204],["freetutorialsus.com",205],["vidlii.com",[205,220]],["iammagnus.com",205],["dailyvideoreports.net",205],["unityassets4free.com",205],["cnbc.com",206],["puzzles.msn.com",207],["metro.us",207],["newsobserver.com",207],["arkadiumhosted.com",207],["spankbang.com",208],["firefaucet.win",209],["direct-link.net",210],["direkt-wissen.com",210],["link-to.net",210],["fullhdxxx.com",212],["getintopc.com",213],["unique-tutorials.info",213],["etonline.com",214],["creatur.io",214],["drphil.com",214],["urbanmilwaukee.com",214],["ontiva.com",214],["hideandseek.world",214],["myabandonware.com",214],["mangaalarab.com",214],["kendam.com",214],["wttw.com",214],["synonyms.com",214],["definitions.net",214],["hostmath.com",214],["camvideoshub.com",214],["minhaconexao.com.br",214],["bravedown.com",214],["home-made-videos.com",216],["pxrnxx.xyz",216],["amateur-couples.com",216],["slutdump.com",216],["produsat.com",218],["12thman.com",220],["acusports.com",220],["atlantic10.com",220],["auburntigers.com",220],["baylorbears.com",220],["bceagles.com",220],["bgsufalcons.com",220],["big12sports.com",220],["bigten.org",220],["bradleybraves.com",220],["butlersports.com",220],["cmumavericks.com",220],["conferenceusa.com",220],["cyclones.com",220],["dartmouthsports.com",220],["daytonflyers.com",220],["dbupatriots.com",220],["dbusports.com",220],["denverpioneers.com",220],["fduknights.com",220],["fgcuathletics.com",220],["fightinghawks.com",220],["fightingillini.com",220],["floridagators.com",220],["friars.com",220],["friscofighters.com",220],["gamecocksonline.com",220],["goarmywestpoint.com",220],["gobison.com",220],["goblueraiders.com",220],["gobobcats.com",220],["gocards.com",220],["gocreighton.com",220],["godeacs.com",220],["goexplorers.com",220],["goetbutigers.com",220],["gofrogs.com",220],["gogriffs.com",220],["gogriz.com",220],["golobos.com",220],["gomarquette.com",220],["gopack.com",220],["gophersports.com",220],["goprincetontigers.com",220],["gopsusports.com",220],["goracers.com",220],["goshockers.com",220],["goterriers.com",220],["gotigersgo.com",220],["gousfbulls.com",220],["govandals.com",220],["gowyo.com",220],["goxavier.com",220],["gozags.com",220],["gozips.com",220],["griffinathletics.com",220],["guhoyas.com",220],["gwusports.com",220],["hailstate.com",220],["hamptonpirates.com",220],["hawaiiathletics.com",220],["hokiesports.com",220],["huskers.com",220],["icgaels.com",220],["iuhoosiers.com",220],["jsugamecocksports.com",220],["longbeachstate.com",220],["loyolaramblers.com",220],["lrtrojans.com",220],["lsusports.net",220],["morrisvillemustangs.com",220],["msuspartans.com",220],["muleriderathletics.com",220],["mutigers.com",220],["navysports.com",220],["nevadawolfpack.com",220],["niuhuskies.com",220],["nkunorse.com",220],["nuhuskies.com",220],["nusports.com",220],["okstate.com",220],["olemisssports.com",220],["omavs.com",220],["ovcsports.com",220],["owlsports.com",220],["purduesports.com",220],["redstormsports.com",220],["richmondspiders.com",220],["sfajacks.com",220],["shupirates.com",220],["siusalukis.com",220],["smcgaels.com",220],["smumustangs.com",220],["soconsports.com",220],["soonersports.com",220],["themw.com",220],["tulsahurricane.com",220],["txst.com",220],["txstatebobcats.com",220],["ubbulls.com",220],["ucfknights.com",220],["ucirvinesports.com",220],["uconnhuskies.com",220],["uhcougars.com",220],["uicflames.com",220],["umterps.com",220],["uncwsports.com",220],["unipanthers.com",220],["unlvrebels.com",220],["uoflsports.com",220],["usdtoreros.com",220],["utahstateaggies.com",220],["utepathletics.com",220],["utrockets.com",220],["uvmathletics.com",220],["uwbadgers.com",220],["villanova.com",220],["wkusports.com",220],["wmubroncos.com",220],["woffordterriers.com",220],["1pack1goal.com",220],["bcuathletics.com",220],["bubraves.com",220],["goblackbears.com",220],["golightsgo.com",220],["gomcpanthers.com",220],["goutsa.com",220],["mercerbears.com",220],["pirateblue.com",220],["pirateblue.net",220],["pirateblue.org",220],["quinnipiacbobcats.com",220],["towsontigers.com",220],["tribeathletics.com",220],["tribeclub.com",220],["utepminermaniacs.com",220],["utepminers.com",220],["wkutickets.com",220],["aopathletics.org",220],["atlantichockeyonline.com",220],["bigsouthnetwork.com",220],["bigsouthsports.com",220],["chawomenshockey.com",220],["dbupatriots.org",220],["drakerelays.org",220],["ecac.org",220],["ecacsports.com",220],["emueagles.com",220],["emugameday.com",220],["gculopes.com",220],["godrakebulldog.com",220],["godrakebulldogs.com",220],["godrakebulldogs.net",220],["goeags.com",220],["goislander.com",220],["goislanders.com",220],["gojacks.com",220],["gomacsports.com",220],["gseagles.com",220],["hubison.com",220],["iowaconference.com",220],["ksuowls.com",220],["lonestarconference.org",220],["mascac.org",220],["midwestconference.org",220],["mountaineast.org",220],["niu-pack.com",220],["nulakers.ca",220],["oswegolakers.com",220],["ovcdigitalnetwork.com",220],["pacersports.com",220],["rmacsports.org",220],["rollrivers.com",220],["samfordsports.com",220],["uncpbraves.com",220],["usfdons.com",220],["wiacsports.com",220],["alaskananooks.com",220],["broncathleticfund.com",220],["cameronaggies.com",220],["columbiacougars.com",220],["etownbluejays.com",220],["gobadgers.ca",220],["golancers.ca",220],["gometrostate.com",220],["gothunderbirds.ca",220],["kentstatesports.com",220],["lehighsports.com",220],["lopers.com",220],["lycoathletics.com",220],["lycomingathletics.com",220],["maraudersports.com",220],["mauiinvitational.com",220],["msumavericks.com",220],["nauathletics.com",220],["nueagles.com",220],["nwusports.com",220],["oceanbreezenyc.org",220],["patriotathleticfund.com",220],["pittband.com",220],["principiaathletics.com",220],["roadrunnersathletics.com",220],["sidearmsocial.com",220],["snhupenmen.com",220],["stablerarena.com",220],["stoutbluedevils.com",220],["uwlathletics.com",220],["yumacs.com",220],["collegefootballplayoff.com",220],["csurams.com",220],["cubuffs.com",220],["gobearcats.com",220],["gohuskies.com",220],["mgoblue.com",220],["osubeavers.com",220],["pittsburghpanthers.com",220],["rolltide.com",220],["texassports.com",220],["thesundevils.com",220],["uclabruins.com",220],["wvuathletics.com",220],["wvusports.com",220],["arizonawildcats.com",220],["calbears.com",220],["cuse.com",220],["georgiadogs.com",220],["goducks.com",220],["goheels.com",220],["gostanford.com",220],["insidekstatesports.com",220],["insidekstatesports.info",220],["insidekstatesports.net",220],["insidekstatesports.org",220],["k-stateathletics.com",220],["k-statefootball.net",220],["k-statefootball.org",220],["k-statesports.com",220],["k-statesports.net",220],["k-statesports.org",220],["k-statewomenshoops.com",220],["k-statewomenshoops.net",220],["k-statewomenshoops.org",220],["kstateathletics.com",220],["kstatefootball.net",220],["kstatefootball.org",220],["kstatesports.com",220],["kstatewomenshoops.com",220],["kstatewomenshoops.net",220],["kstatewomenshoops.org",220],["ksuathletics.com",220],["ksusports.com",220],["scarletknights.com",220],["showdownforrelief.com",220],["syracusecrunch.com",220],["texastech.com",220],["theacc.com",220],["ukathletics.com",220],["usctrojans.com",220],["utahutes.com",220],["utsports.com",220],["wsucougars.com",220],["mangadods.com",220],["tricksplit.io",220],["litecoinads.com",220],["template.city",220],["fangraphs.com",221],["4players.de",[222,292]],["buffed.de",222],["gamesaktuell.de",222],["gamezone.de",222],["pcgames.de",222],["player.pcgameshardware.de",222],["videogameszone.de",222],["spieletipps.de",222],["planetaminecraft.com",223],["flyad.vip",224],["lapresse.ca",225],["kolyoom.com",226],["ilovephd.com",226],["upstream.to",227],["negumo.com",228],["games.wkb.jp",[229,230]],["channelmyanmar.org",[231,232]],["u-s-news.com",232],["fandom.com",[233,485,486]],["kenshi.fandom.com",234],["hausbau-forum.de",235],["fake-it.ws",236],["laksa19.github.io",237],["revadvert.com",238],["1shortlink.com",239],["nesia.my.id",240],["makemoneywithurl.com",241],["resetoff.pl",242],["sexodi.com",242],["cdn77.org",243],["howtofixwindows.com",244],["3sexporn.com",245],["momxxxsex.com",245],["myfreevintageporn.com",245],["penisbuyutucum.net",245],["lightnovelworld.com",246],["ujszo.com",247],["newsmax.com",248],["bobs-tube.com",249],["nadidetarifler.com",250],["siz.tv",250],["suzylu.co.uk",[251,252]],["onworks.net",253],["yabiladi.com",253],["homeairquality.org",255],["faucettronn.click",255],["downloadsoft.net",256],["imgair.net",257],["imgblaze.net",257],["imgfrost.net",257],["pixsera.net",257],["vestimage.site",257],["imgwia.buzz",257],["testlanguages.com",258],["newsinlevels.com",258],["videosinlevels.com",258],["arcai.com",259],["my-code4you.blogspot.com",260],["vlxxs.net",261],["rapelust.com",261],["vtube.to",261],["vtplay.net",261],["desitelugusex.com",261],["xvideos-downloader.net",261],["xxxvideotube.net",261],["sdefx.cloud",261],["nozomi.la",261],["moviesonlinefree.net",261],["flickr.com",262],["firefile.cc",263],["pestleanalysis.com",263],["kochamjp.pl",263],["tutorialforlinux.com",263],["724indir.com",263],["whatsaero.com",263],["animeblkom.net",[263,279]],["blkom.com",263],["globes.co.il",[264,265]],["jardiner-malin.fr",266],["tw-calc.net",267],["ohmybrush.com",268],["talkceltic.net",269],["zdam.xyz",270],["mentalfloss.com",271],["uprafa.com",272],["cube365.net",273],["nightfallnews.com",[274,275]],["wwwfotografgotlin.blogspot.com",276],["freelistenonline.com",276],["badassdownloader.com",277],["quickporn.net",278],["aosmark.com",280],["theappstore.org",280],["atozmath.com",[281,282,283,284,285,286,287]],["newyorker.com",288],["brighteon.com",289],["more.tv",290],["video1tube.com",291],["alohatube.xyz",291],["link.cgtips.org",293],["hentaicloud.com",294],["netfapx.com",296],["androidtvbox.eu",298],["madeinvilnius.lt",298],["paperzonevn.com",299],["hentaienglish.com",300],["hentaiporno.xxx",300],["venge.io",[301,302]],["btcbux.io",303],["its.porn",[304,305]],["atv.at",306],["2ndrun.tv",307],["rackusreads.com",307],["exerror.com",307],["toppixxx.com",308],["temp-phone-number.com",309],["jetpunk.com",311],["imgur.com",312],["hentai-party.com",313],["hentaicomics.pro",313],["xxx-comics.pro",313],["genshinimpactcalculator.com",316],["mysexgames.com",317],["embed.indavideo.hu",320],["coinurl.net",[321,322]],["mdn.rest",323],["gdr-online.com",324],["mmm.dk",325],["iqiyi.com",[326,327]],["m.iqiyi.com",328],["japopav.tv",329],["lvturbo.com",329],["nbcolympics.com",330],["apkhex.com",331],["indiansexstories2.net",332],["issstories.xyz",332],["1340kbbr.com",333],["gorgeradio.com",333],["kduk.com",333],["kedoam.com",333],["kejoam.com",333],["kelaam.com",333],["khsn1230.com",333],["kjmx.rocks",333],["kloo.com",333],["klooam.com",333],["klykradio.com",333],["kmed.com",333],["kmnt.com",333],["kool991.com",333],["kpnw.com",333],["kppk983.com",333],["krktcountry.com",333],["ktee.com",333],["kwro.com",333],["kxbxfm.com",333],["thevalley.fm",333],["dsocker1234.blogspot.com",334],["blick.ch",336],["mgnet.xyz",337],["designtagebuch.de",338],["pixroute.com",339],["calculator-online.net",340],["porngames.club",341],["sexgames.xxx",341],["111.90.159.132",342],["battleplan.news",342],["mobile-tracker-free.com",343],["pfps.gg",344],["ac-illust.com",[345,346]],["photo-ac.com",[345,346]],["social-unlock.com",347],["ninja.io",348],["sourceforge.net",349],["samfirms.com",350],["banned.video",351],["conspiracyfact.info",351],["freeworldnews.tv",351],["madmaxworld.tv",351],["h-flash.com",352],["huffpost.com",353],["ingles.com",354],["surfline.com",355],["play.tv3.ee",356],["trendyoum.com",357],["bulbagarden.net",358],["doomovie-hd.com",359],["madoohd.com",359],["moviestars.to",360],["hollywoodlife.com",361],["searchresults.cc",362],["mat6tube.com",363],["textstudio.co",364],["newtumbl.com",365],["nevcoins.club",367],["mail.com",368],["erome.com",371],["oggi.it",[372,373]],["video.gazzetta.it",[372,373]],["mangakita.net",374],["allcryptoz.net",375],["crewbase.net",375],["phineypet.com",375],["shinbhu.net",375],["talkforfitness.com",375],["mdn.lol",375],["carsmania.net",375],["carstopia.net",375],["coinsvalue.net",375],["cookinguide.net",375],["freeoseocheck.com",375],["makeupguide.net",375],["btcbitco.in",375],["btcsatoshi.net",375],["cempakajaya.com",375],["crypto4yu.com",375],["readbitcoin.org",375],["wiour.com",375],["exactpay.online",375],["avpgalaxy.net",376],["mhma12.tech",377],["panda-novel.com",378],["zebranovel.com",378],["lightsnovel.com",378],["eaglesnovel.com",378],["pandasnovel.com",378],["zadfaucet.com",379],["ewrc-results.com",380],["kizi.com",381],["cyberscoop.com",382],["fedscoop.com",382],["canale.live",383],["loawa.com",384],["ygosu.com",384],["sportalkorea.com",384],["algumon.com",384],["hancinema.net",384],["enetnews.co.kr",384],["edaily.co.kr",384],["economist.co.kr",384],["etoday.co.kr",384],["hankyung.com",384],["isplus.com",384],["hometownstation.com",384],["mafiatown.pl",[385,386]],["jeep-cj.com",387],["sponsorhunter.com",388],["coinscap.info",389],["cryptowidgets.net",389],["greenenez.com",389],["insurancegold.in",389],["webfreetools.net",389],["wiki-topia.com",389],["rapid-cloud.co",389],["cloudcomputingtopics.net",390],["likecs.com",391],["tiscali.it",392],["linkspy.cc",393],["tutelehd3.xyz",394],["dirty.pink",[395,396,397]],["adshnk.com",398],["chattanoogan.com",399],["socialmediagirls.com",400],["windowspro.de",401],["snapinsta.app",402],["mydaddy.cc",403],["roadtrippin.fr",404],["redketchup.io",[405,406,407]],["anyporn.com",[408,423]],["bravoporn.com",408],["bravoteens.com",408],["crocotube.com",408],["hellmoms.com",408],["hellporno.com",408],["sex3.com",408],["tubewolf.com",408],["xbabe.com",408],["xcum.com",408],["zedporn.com",408],["imagetotext.info",409],["infokik.com",410],["freepik.com",411],["ddwloclawek.pl",[412,413]],["videogamer.com",414],["wrestlinginc.com",414],["qtoptens.com",414],["deezer.com",415],["my-subs.co",416],["plaion.com",417],["slideshare.net",[418,419]],["ustreasuryyieldcurve.com",420],["goo.st",421],["freevpshere.com",421],["softwaresolutionshere.com",421],["staige.tv",424],["bondagevalley.cc",425],["androidadult.com",426],["sharer.pm",427],["watchtv24.com",428],["cellmapper.net",429],["medscape.com",430],["arkadium.com",431],["app.blubank.com",433],["lifesurance.info",434],["sportdeutschland.tv",435],["kcra.com",435],["wcvb.com",435],["kusonime.com",436],["coursedrive.org",438],["dtbps3games.com",438],["vod.pl",439],["megadrive-emulator.com",440],["animesaga.in",443],["bestx.stream",443],["moviesapi.club",443],["digimanie.cz",444],["svethardware.cz",444],["srvy.ninja",445],["drawer-opportunity-i-243.site",446],["tchatche.com",447],["ozulmanga.com",448],["edmdls.com",449],["freshremix.net",449],["scenedl.org",449],["teamskeet.com",450],["tacobell.com",451],["webtoons.com",[452,453]],["zefoy.com",455],["br.de",456],["pasteboard.co",457],["avclub.com",458],["clickhole.com",458],["deadspin.com",458],["gizmodo.com",458],["jalopnik.com",458],["jezebel.com",458],["kotaku.com",458],["lifehacker.com",458],["splinternews.com",458],["theinventory.com",458],["theonion.com",458],["theroot.com",458],["thetakeout.com",458],["pewresearch.org",458],["los40.com",[459,460]],["verizon.com",461],["humanbenchmark.com",462],["politico.com",463],["officedepot.co.cr",[464,465]],["usnews.com",466],["factable.com",468],["zee5.com",469],["gala.fr",470],["geo.fr",470],["voici.fr",470],["gloucestershirelive.co.uk",471],["arsiv.mackolik.com",472],["jacksonguitars.com",473],["scandichotels.com",474],["stylist.co.uk",475],["nettiauto.com",476],["thaiairways.com",[477,478]],["cerbahealthcare.it",[479,480]],["futura-sciences.com",[479,495]],["tiendaenlinea.claro.com.ni",[481,482]],["tieba.baidu.com",483],["linktr.ee",484],["grasshopper.com",[487,488]],["epson.com.cn",[489,490]],["oe24.at",[491,492]],["szbz.de",491],["platform.autods.com",[493,494]],["wikihow.com",496],["citibank.com.sg",497],["smallseotools.com",498],["chip.de",499]]);

const entitiesMap = new Map([["vidsrc",7],["watch-series",7],["watchseries",7],["vev",7],["vidop",7],["vidup",7],["starmusiq",10],["wcofun",10],["kissasian",12],["gogoanime",[12,20]],["1movies",[12,19]],["xmovies8",12],["animeheaven",12],["0123movies",12],["gostream",12],["gomovies",12],["hamsterix",13],["xhamster",13],["xhamster1",13],["xhamster10",13],["xhamster11",13],["xhamster12",13],["xhamster13",13],["xhamster14",13],["xhamster15",13],["xhamster16",13],["xhamster17",13],["xhamster18",13],["xhamster19",13],["xhamster20",13],["xhamster2",13],["xhamster3",13],["xhamster4",13],["xhamster5",13],["xhamster7",13],["xhamster8",13],["vidlox",[14,15]],["primewire",16],["streanplay",[16,18]],["sbplay",16],["milfnut",16],["fmovies",20],["9anime",20],["hqq",[24,25]],["waaw",25],["123link",26],["adshort",26],["linkshorts",26],["adsrt",26],["vinaurl",26],["adfloz",26],["dutchycorp",26],["shortearn",26],["pingit",26],["urlty",26],["seulink",26],["shrink",26],["tmearn",26],["megalink",26],["linkviet",26],["miniurl",26],["pcprogramasymas",26],["link1s",26],["shortzzy",26],["shorttey",[26,214]],["lite-link",26],["pureshort",26],["adcorto",26],["dulinks",26],["zshort",26],["upfiles",26],["linkfly",26],["wplink",26],["financerites",26],["camwhores",[27,38,89,90,91]],["tube8",[28,29]],["youporn",29],["redtube",29],["pornhub",[29,200,201]],["xtits",[54,125]],["pouvideo",62],["povvideo",62],["povw1deo",62],["povwideo",62],["powv1deo",62],["powvibeo",62],["powvideo",62],["powvldeo",62],["acortalo",[67,68,69,70]],["acortar",[67,68,69,70]],["plyjam",[72,73]],["fxporn69",78],["vipbox",79],["viprow",79],["desbloqueador",85],["xberuang",87],["teknorizen",87],["linkberuang",87],["kickassanime",92],["subtorrents",94],["subtorrents1",94],["newpelis",94],["pelix",94],["allcalidad",94],["infomaniakos",94],["filecrypt",98],["tornadomovies",99],["sexwebvideo",104],["mangovideo",104],["icdrama",110],["mangasail",110],["file4go",112],["asianclub",128],["anitube",135],["mixdrop",138],["azsoft",151],["uploadev",167],["ver-pelis-online",178],["ancient-origins",187],["lookcam",214],["lootlinks",214],["dpstream",217],["bluemediafiles",219],["docer",242],["pixlev",257],["skymovieshd",261],["dvdplay",261],["crackstreams",297],["123movieshd",310],["uproxy",314],["animesa",315],["cinecalidad",[318,319]],["apkmaven",366],["gmx",369],["gamereactor",422],["terabox",432],["tvhay",[441,442]]]);

const exceptionsMap = new Map([["pingit.com",[26]],["pingit.me",[26]]]);

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantCore(false, ...args);
}

function setConstantCore(
    trusted = false,
    arg1 = '',
    arg2 = '',
    arg3 = ''
) {
    const details = typeof arg1 !== 'object'
        ? { prop: arg1, value: arg2 }
        : arg1;
    if ( arg3 !== '' ) {
        if ( /^\d$/.test(arg3) ) {
            details.options = [ arg3 ];
        } else {
            details.options = Array.from(arguments).slice(3);
        }
    }
    const { prop: chain = '', value: cValue = '' } = details;
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const options = details.options || [];
    const safe = safeSelf();
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
        if ( options.includes('asFunction') ) {
            cValue = ( ) => cValue;
        } else if ( options.includes('asCallback') ) {
            cValue = ( ) => (( ) => cValue);
        } else if ( options.includes('asResolved') ) {
            cValue = Promise.resolve(cValue);
        } else if ( options.includes('asRejected') ) {
            cValue = Promise.reject(cValue);
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
    }, options);
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
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
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
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

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
