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

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setCookie = function() {

const scriptletGlobals = {}; // jshint ignore: line

const argsList = [["__toppy_consent","1"],["_u123_cc","yes"],["ga-disable","true"],["cookies","false"],["gls-cookie-policy","accepted"],["localConsent","true"],["pum-13751","true"],["CONSENT","1"],["cm_level","0"],["st-cookie-token","true"],["functionalCookie","true"],["agreed_cookie_policy","1"],["hasMadeConsentSelection","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelection","true","","","domain",".imola.motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".imola.motorsportreg.com"],["gdprPGA","true"],["xn_cookieconsent","false","","reload","1"],["taunton_user_consent_submitted","true"],["taunton_user_consent_advertising","false"],["taunton_user_consent_analytics","false"],["cookie_consent_closed","1"],["__cookie_consent","false"],["dsgvo-stat","yes"],["dsgvo-mark","no"],["cookieSettings","11","","reload","1"],["google-tagmanager","false"],["decline","true","","","reload","1"],["cookieTermsDismissed","true"],["cookieConsentDismissed","true"],["cookienotification","1"],["kraftwerkCookiePolicyState","1"],["privacyPolicyAccept","1","","reload","1"],["CookieConsent","necessary"],["analyticsStatus","false"],["socialMediaStatus","false"],["cookiesAccepted","1"],["airTRFX_cookies","accepted"],["cookie_consent_accept","true"],["agree","true"],["vw_mms_hide_cookie_dialog","1"],["solo_opt_in","false"],["POMELO_COOKIES","1"],["AcceptUseCookie","Accept"],["sbrf.pers_notice","1"],["closedCookieBanner","true"],["yoyocookieconsent_viewed","true"],["privacy_policy_agreement","6","","reload","1"],["kinemaster-cookieconstent","1"],["cookie_acceptance","1"],["jazzfm-privacy","true"],["show_msg_cookies","false"],["CookieConsent","true","","reload","1"],["FunctionalCookie","true"],["AnalyticalCookie","false"],[".YourApp.ConsentCookie","yes","","reload","1"],["gdpr","deny"],["agreesWithCookies","true"],["rm-first-time-modal-welcome","1"],["cookieConsent-2023-03","false"],["CookieDisclaimer","1"],["twtr_pixel_opt_in","N"],["RBCookie-Alert","1"],["CookieConsentV4","false"],["cookieconsent_status","allow"],["cookies_analytics_enabled","0","","reload","1"],["xf_notice_dismiss","1"],["rcl_consent_given","true"],["rcl_preferences_consent","true"],["rcl_marketing_consent","false"],["confirmed-cookies","1","","reload","1"],["cb_validCookies","1"],["cb_accepted","1"],["ws-cookie-Techniques","true"],["cookie-agreed","2"],["cookie_consent","yes"],["cookie_consent_options","3"],["consentIsSetByUser","true","","reload","1"],["isSiteCookieReviewed","0","","reload","1"],["phpbb3_4zn6j_ca","true"],["cookieBar-cookies-accepted","true"],["cookie_consent_user_accepted","true"],["__gitbook_cookie_granted","no"],["user_cookie_consent","false","","reload","1"],["cookies-marketing","N"],["gatsby-gdpr-google-tagmanager","false"],["uuAppCookiesAgreement","true"],["_cookies-consent","yes"],["RCI_APP_LEGAL_DISCLAIMER_COOKIE","false"],["hs_cookieconsent","true"],["cookiergpdjnz","1"],["__radicalMotorsport.ac","true"],["cookies_message_bar_hidden","true"],["acceptsCookies","false"],["accept_cookies","accepted"],["consent_seen","1"],["_gdpr_playbalatro","1"],["consentAll","0"],["cookiewarning","1","","reload","1"],["cookieBarSeen","true"],["cookie_consent_given","true"],["cuvva.app.website.cookie-policy.consent","1"],["custom-cookies-accepted","1","","reload","1"],["AnalyticsAcceptancePopOver","false"],["cookiecookie","1"],["disclaimer-overlay","true"],["complianceCookie","true"],["KeebSupplyCookieConsent","true"],["cookie_policy_agreement","true"],["kt_tcookie","1"],["splash_Page_Accepted","true"],["gdpr-analytics-enabled","false"],["privacy_status","1"],["privacy_settings","1"],["config","1","","reload","1"],["hideCookieNotification","true","","reload","1"],["has_accepted_gdpr","1"],["app-cookie-consents","1"],["analitics_cookies","0"],["tachyon-accepted-cookie-notice","true"],["defra-cookie-banner-dismissed","true","","reload","1"],["myAwesomeCookieName3","true"],["cookie-notification","ACCEPTED","","reload","1"],["loader","1"],["enableAnalyticsCookies","denied"],["acknowledgeCookieBanner","true"],["enableTargetingAdvertisingCookies","denied"],["cookiePolicy","1"],["cookie-agreed","0"],["crtmcookiesProtDatos","1","","reload","1"],["NADevGDPRCookieConsent_portal_2","1"],["handledCookieMessage","1"],["targeting","false"],["functionality","false"],["performance","false"],["cookie_info","1","","reload","1"],["bannerDissmissal","true","","reload","1"],["allowCookies","true"],["COOKIE-POLICY-ACCEPT","true"],["gdpr","accept"],["essentialCookie","Y"],["checkCookie","Y"],["analyticsCookie","N"],["marketingCookie","N"],["thirdCookie","N"],["paydirektCookieAllowed","false"],["hdcab","true"],["synapse-cookie-preferences-set","true"],["confirm_cookies","1"],["endgame-accept-policy","true"],["sc-privacy-settings","true"],["accept_cookies2","true","","reload","1"],["cf_consent","false"],["privacyCookie","1","","reload","1"],["cookieChoice","0"],["lgpdConsent","true"],["shareloft_cookie_decision","1"],["privacy_marketing","false"],["privacy_comodidade","false"],["acceptAnalyticsCookies","false"],["acceptFunctionalCookies","true"],["cookiePolicyConfirmed","true","","reload","1"],["PostAnalytics","0"],["gatsby-gdpr","false"],["functionalCookiesAccepted","true"],["necessaryCookies","true"],["comfortCookiesAccepted","false"],["statisticsCookiesAccepted","false"],["gdpr-google-analytics","false"],["cookie_policy","true"],["cookieModalAccept","no"],["AcceptFunctionalCookies","true"],["AcceptAnalyticsCookies","false"],["AcceptNonFunctionalCookies","false"],["forced-cookies-modal","2"],["cookiebar","1"],["cookieconsent_status","true"],["longines-cookiesstatus-analytics","false"],["longines-cookiesstatus-functional","false"],["longines-cookiesstatus-necessary","true"],["longines-cookiesstatus-social","false"],["pz_cookie_consent","true"],["_cb","1","","reload","1"],["consent-status","1"],["HANA-RGPD","accepted"],["cookie-optin","true"],["msg_cookie_CEX","true"],["OptanonAlertBoxClosed","ok"],["OptanonAlertBoxClosed","true"],["cookie-bar","0"],["cookieBannerHidden","true"],["isReadCookiePolicyDNT","true"],["isReadCookiePolicyDNTAa","false"],["coookieaccept","ok"],["consentTrackingVerified","true"],["consent","0"],["allowGetPrivacyInfo","true"],["cookiebanner","0"],["_tv_cookie_consent","y"],["_tv_cookie_choice","1"],["eika_consent_set","true"],["eika_consent_marketing","false"],["ew_cookieconsent","1"],["ew_cookieconsent_optin_b","true"],["ew_cookieconsent_optin_a","true"],["gdpr-agree-cookie","1","","reload","1"],["gdpr-consent-cookie-level3","1"],["gdpr-consent-cookie-level2","1"],["ck-cp","accepted"],["cookieConsent","1"],["consent-cookie","1"],["show_gdpr_cookie_message_388801234_cz","no"],["gsbbanner","0"],["__adblocker","false","","reload","1"],["cookies_marketing_ok","false"],["cookies_ok","true"],["acceptCookies","0"],["marketingCookies","false"],["CookieLaw_statistik 0"],["CookieLaw_komfort","0"],["CookieLaw_personalisierung","0"],["CookieLaw","on"],["wtr_cookie_consent","1"],["wtr_cookies_advertising","0"],["wtr_cookies_functional","0"],["wtr_cookies_analytics","0"],["allowTrackingCookiesKvK","0"],["cookieLevelCodeKVK","1"],["allowAnalyticsCookiesKvK","0"],["macfarlanes-necessary-cookies","accepted"],["TC_PRIVACY_CENTER","0"],["AllowCookies","false","","reload","1"],["consented","false"],["cookie_tou","1","","reload","1"],["blukit_novo","true"],["cr","true"],["gdpr_check_cookie","accepted","","reload","1"],["accept-cookies","accepted"],["dvag_cookies2023","1"],["consent_cookie","1"],["permissionExperience","false"],["permissionPerformance","false"],["permissionMarketing","false"],["consent_analytics","false"],["consent_received","true"],["cookieModal","false"],["user-accepted-AEPD-cookies","1"],["personalization-cookies-consent","0","","reload","1"],["analitics-cookies-consent","0"],["sscm_consent_widget","1"],["texthelp_cookie_consent_in_eu","0"],["texthelp_cookie_consent","yes"],["nc_cookies","accepted"],["nc_analytics","rejected"],["nc_marketing","rejected"],[".AspNet.Consent","yes","","reload","1"],[".AspNet.Consent","no","","reload","1"],["user_gave_consent","1"],["user_gave_consent_new","1"],["rt-cb-approve","true"],["CookieLayerDismissed","true"],["RODOclosed","true"],["cookieDeclined","1"],["cookieModal","true"],["oph-mandatory-cookies-accepted","true"],["cookies-accept","1"],["dw_is_new_consent","true"],["accept_political","1"],["konicaminolta.us","1"],["cookiesAnalyticsApproved","0"],["hasConfiguredCookies","1"],["cookiesPubliApproved","0"],["cookieAuth","1"],["kscookies","true"],["cookie-policy","true"],["cookie-use-accept","false"],["ga-disable-UA-xxxxxxxx-x","true"],["consent","1"],["acceptCookies","1"],["cookie-bar","no"],["CookiesAccepted","no"],["essential","true"],["cookieConfirm","true"],["trackingConfirm","false"],["cookie_consent","false"],["cookie_consent","true"],["gtm-disable-GTM-NLVRXX8","true"],["uce-cookie","N"],["tarteaucitron","false"],["cookiePolicies","true"],["cookie_optin_q","false"],["ce-cookie","N"],["NTCookies","0"],["alertCookie","1","","reload","1"],["gdpr","1"],["hideCookieBanner","true"],["obligatory","true"],["marketing","false"],["analytics","false"],["cookieControl","true"],["plosCookieConsentStatus","false"],["user_accepted_cookies","1"],["analyticsAccepted","false"],["cookieAccepted","true"],["hide-gdpr-bar","true"],["promptCookies","1"],["_cDaB","1"],["_aCan_analytical","0"],["_aGaB","1"],["surbma-gpga","no"],["elrowCookiePolicy","yes"],["ownit_cookie_data_permissions","1"],["Cookies_Preferences","accepted"],["Cookies_Preferences_Analytics","declined"],["privacyPolicyAccepted","true"],["Cookies-Accepted","true"],["cc-accepted","2"],["cc-item-google","false"],["featureConsent","false","","reload","1"],["accept-cookie","no"],["consent","0","","reload","1"],["cookiePrivacyPreferenceBannerProduction","accepted"],["cookiesConsent","false"],["2x1cookies","1"],["firstPartyDataPrefSet","true"],["cookies-required","1","","reload","1"],["kh_cookie_level4","false"],["kh_cookie_level3","false"],["kh_cookie_level1","true"],["cookie_agreement","1","","reload","1"],["MSC_Cookiebanner","false"],["cookieConsent_marketing","false"],["Fitnessing21-15-9","0"],["cookies_popup","yes"],["cookieConsent_required","true","","reload","1"],["sa_enable","off"],["acceptcookietermCookieBanner","true"],["cookie_status","1","","reload","1"],["FTCookieCompliance","1"],["cookiePopupAccepted","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_ADS_OPTOUT","true"],["UBI_PRIVACY_POLICY_ACCEPTED","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["jocookie","false"],["cookieNotification.shown","1"],["localConsent","false"],["oai-allow-ne","false"],["consent","rejected"],["allow-cookie","1"],["cookie-functional","1"],["hulkCookieBarClick","1"],["CookieConsent","1"],["zoommer-cookie_agreed","true"],["accepted_cookie_policy","true"],["gdpr_cookie_token","1"],["_consent_personalization","denied"],["_consent_analytics","denied"],["_consent_marketing","denied"],["cookieWall","1"],["no_cookies","1"],["hidecookiesbanner","1"],["CookienatorConsent","false"],["cookieWallOptIn","0"],["analyticsCookiesAccepted","false"],["cf4212_cn","1"],["mediaCookiesAccepted","false"],["mandatoryCookiesAccepted","true"],["gtag","true"],["BokadirektCookiePreferencesMP","1"],["cookieAcknowledged","true"],["data-privacy-statement","true"],["cookie_privacy_level","required"],["accepted_cookies","true","","reload","1"],["MATOMO_CONSENT_GIVEN","0"],["BABY_MARKETING_COOKIES_CONSENTED","false"],["BABY_PERFORMANCE_COOKIES_CONSENTED","false"],["BABY_NECESSARY_COOKIES_CONSENTED","true"],["consent_essential","allow"],["cookieshown","1"],["warn","true"],["optinCookieSetting","1"],["privacy-shown","true"],["slimstat_optout_tracking","true"],["npp_analytical","0"],["inshopCookiesSet","true"],["adsCookies","false"],["performanceCookies","false"],["sa_demo","false"],["animated_drawings","true"],["cookieStatus","true"],["swgCookie","false"],["cookieConsentPreferencesGranted","1"],["cookieConsentMarketingGranted","0"],["cookieConsentGranted","1"],["cookies-rejected","true"],["NL_COOKIE_KOMFORT","false"],["NL_COOKIE_MEMORY","true","","reload","1"],["NL_COOKIE_STATS","false"],["pws_gdrp_accept","1"],["have18","1"],["pelm_cstate","1"],["pelm_consent","1"],["accept-cookies","true"],["accept-analytical-cookies","false"],["accept-marketing-cookies","false"],["cookie-level-v4","0"],["analytics_consent","yes"],["sei-ccpa-banner","true"],["awx_cookie_consent","true"],["cookie_warning","1"],["allowCookies","0"],["cookiePolicyAccepted","true"],["codecamps.cookiesConsent","true"],["cookiesConsent","true"],["consent_updated","true"],["acsr","1"],["__hs_gpc_banner_dismiss","true"],["cookieyes-necessary","yes"],["cookieyes-other","no"],["cky-action","yes"],["cookieyes-functional","no"],["has-declined-cookies","true","","reload","1"],["has-agreed-to-cookies","false"],["essential","Y"],["analytics","N"],["functional","N"],["gradeproof_shown_cookie_warning","true"],["sber.pers_notice_en","1"],["cookies_consented","yes"],["cookies_consent","true"],["cookies_consent","false"],["anal-opt-in","false"],["accepted","1"],["CB393_DONOTREOPEN","true"],["AYTO_CORUNA_COOKIES","1","","reload","1"],["I6IISCOOKIECONSENT0","n","","reload","1"],["htg_consent","0"],["cookie_oldal","1"],["cookie_marketing","0"],["cookie_jog","1"],["cp_cc_ads","0"],["cp_cc_stats","0"],["cp_cc_required","1"],["ae-cookiebanner","true"],["ae-esential","true"],["ae-statistics","false"],["ccs-supplierconnect","ACCEPTED"],["accepted_cookies","yes"],["note","1"],["cookieConsent","required"],["cookieConsent","accepted"],["pd_cc","1"],["gdpr_ok","necessary"],["allowTracking","false"],["varmafi_mandatory","true"],["VyosCookies","Accepted"],["analyticsConsent","false"],["adsConsent","false"],["te_cookie_ok","1"],["amcookie_policy_restriction","allowed"],["cookieConsent","allowed"],["dw_cookies_accepted","1"],["acceptConverseCookiePolicy","0"],["gdpr-banner","1"],["privacySettings","1"],["are_essential_consents_given","1"],["is_personalized_content_consent_given","1"],["acepta_cookies_funcionales","1"],["acepta_cookies_obligatorias","1"],["acepta_cookies_personalizacion","1"],["cookiepolicyinfo_new","true"],["acceptCookie","true"],["ee-hj","n"],["ee-ca","y","","reload","1"],["ee-yt","y"],["cookie_analytics","false"],["et_cookie_consent","true"],["cookieBasic","true"],["cookieMold","true"],["ytprefs_gdpr_consent","1"],["efile-cookiename-","1"],["plg_system_djcookiemonster_informed","1","","reload","1"],["cvc","true"],["cookieConsent3","true"],["acris_cookie_acc","1","","reload","1"],["termsfeed_pc1_notice_banner_hidden","true"],["cmplz_marketing","allowed"],["cmplz_marketing","allow"],["acknowledged","true"],["ccpaaccept","true"],["gdpr_shield_notice_dismissed","yes"],["luci_gaConsent_95973f7b-6dbc-4dac-a916-ab2cf3b4af11","false"],["luci_CookieConsent","true"],["ng-cc-necessary","1"],["ng-cc-accepted","accepted"],["PrivacyPolicyOptOut","yes"],["consentAnalytics","false"],["consentAdvertising","false"],["consentPersonalization","false"],["privacyExpiration","1"],["cookieconsent_status","deny"],["lr_cookies_tecnicas","accepted"],["cookies_surestao","accepted","","reload","1"],["hide-cookie-banner","1"],["fjallravenCookie","1"],["accept_cookie_policy","true"],["_marketing","0"],["_performance","0"],["RgpdBanner","1"],["seen_cookie_message","accepted"],["complianceCookie","on"],["cookie-consent","1","","reload","1"],["cookie-consent","0"],["ecologi_cookie_consent_20220224","false"],["appBannerPopUpRulesCookie","true"],["eurac_cookie_consent","true"],["akasaairCookie","accepted"],["rittalCC","1"],["ckies_facebook_pixel","deny"],["ckies_google_analytics","deny"],["ckies_youtube","allow"],["ckies_cloudflare","allow"],["ckies_paypal","allow"],["ckies_web_store_state","allow"],["hasPolicy","Y"],["modalPolicyCookieNotAccepted","notaccepted"],["MANA_CONSENT","true"],["_ul_cookie_consent","allow"],["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["trackingCookies","off"],["acceptanalytics","no"],["acceptadvertising","no"],["acceptfunctional","yes"],["consent18","0","","reload","1"],["ATA.gdpr.popup","true"],["AIREUROPA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["privacyNoticeExpireDate","1"],["privacyNoticeAccepted","true"],["policy_accepted","1"],["stampen-cookies-hide-information","yes"],["dominos_cookies_accepted","1"],["deva_accepted","yes"],["cookies_consent","1"],["cookies_modal","true"],["cookie_notice","1"],["cookiesPopup","1"],["digibestCookieInfo","true"],["cookiesettings_status","allow"],["_duet_gdpr_acknowledged","1"],["daimant_collective","accept","","reload","1"],["cookies-notice","1","","reload","1"],["banner","2","","reload","1"],["privacy-policy-2023","accept"],["user_cookie_consent","false"],["cookiePolicy","4"],["standard_gdpr_consent","true"],["cookie_accept","true"],["cookieBanner","true"],["tncookieinfo","1","","reload","1"],["agree_with_cookies","1"],["cookie-accepted","true"],["cookie-accepted","yes"],["consentAll","1"],["hide_cookies_consent","1"],["nicequest_optIn","1"],["shb-consent-cookies","false"],["cookies-accepted","true","","reload","1"],["cpaccepted","true"],["cookieMessageDismissed","1"],["LG_COOKIE_CONSENT","0"],["CookieConsent","true"],["CookieConsent","false"],["gatsby-plugin-google-tagmanager","false"],["wtr_cookies_functional","1"],["cookie-m-personalization","0"],["cookie-m-marketing","0"],["cookie-m-analytics","0"],["cookies","true"],["ctc_rejected","1"],["_cookies_v2","1"],["AcceptedCookieCategories","1"],["cookie_policy_acknowledgement","true"],["allowCookies","yes"],["cookieNotification","true"],["privacy","true"],["euconsent-bypass","1"],["cookie_usage","yes"],["dismissCookieBanner","true"],["switchCookies","1"],["cbChecked","true"],["infoCookieUses","true"],["consent-data-v2","0"],["ACCEPTED_COOKIES","true"],["EMR-CookieConsent-Analytical","0","","reload","1"],["gem_cookies_usage_production","1"],["cookie_level","2"],["toutv_cookies_usage_production","1"],["_evidon_suppress_notification_cookie","1"],["EMR-CookieConsent-Advertising","0"],["acceptCookies","true"],["COOKIES_NEWACCEPTED","1"],["es_cookie_settings_closed","1"],["cookie-banner-acceptance-state","true"],["cookie_consent_seen","1"],["cookies_allowed","yes"],["tracking","0"],["valamis_cookie_message","true","","reload","1"],["valamis_cookie_marketing","false"],["valamis_cookie_analytics","false"],["approvedcookies","no","","reload","1"],["psd-google-ads-enabled","0"],["psd-gtm-activated","1"],["wishlist-enabled","1"],["consentInteract","true"],["cookie-byte-consent-essentials","true"],["cookie-byte-consent-showed","true"],["cookie-byte-consent-statistics","false"],["bm_acknowledge","yes"],["genovaPrivacyOptions","1","","reload","1"],["kali-cc-agreed","true"],["cookiesAccepted","true"],["allowMarketingCookies","false"],["allowAnalyticalCookies","false"],["privacyLevel","2","","reload","1"],["AcceptedCookies","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["privacyLevel","flagmajob_ads_shown","1","","reload","1"],["userCookies","true"],["privacy-policy-accepted","1"],["precmp","1","","reload","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["statistik","0"],["cookies-informer-close","true"],["gdpr","0"],["required","1"],["rodo-reminder-displayed","1"],["rodo-modal-displayed","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["bvkcookie","true"],["cookie-preference","1","","reload","1"],["cookie-preference-v3","1"],["consent","true"],["cookies_accepted","yes"],["cookies_accepted","false"],["CM_BANNER","false"],["set-cookie","cookieAccess","1"],["hife_eu_cookie_consent","1"],["cookie-consent","accepted"],["permission_marketing_cookies","0"],["permission_statistic_cookies","0"],["permission_funktional_cookies","1"],["cookieconsent","1"],["cookieconsent","true"],["epole_cookies_settings","true"],["dopt_consent","false"],["privacy-statement-accepted","true","","reload","1"],["cookie_locales","true"],["ooe_cookie_policy_accepted","no"],["accept_cookie","1"],["cookieconsent_status_new","1"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-accepted","false"],["isReadCookiePolicyDNTAa","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["cookie_accepted","1"],["cookie_accepted","false","","reload","1"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["allow_cookie","false"],["3LM-Cookie","false"],["i_sc_a","false"],["i_cm_a","false"],["i_c_a","true"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["cookieconsent_statistics","no"],["cookieconsent_essential","yes"],["cookie_preference","1"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie-preferences-technical","yes"],["tracking_cookie","1"],["cookie_consent_group_technical","1"],["cookie-preference_renew10","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["cookie_accepted","true"],["hasSeenCookieDisclosure","true"],["RY_COOKIE_CONSENT","true"],["COOKIE_CONSENT","1","","reload","1"],["COOKIE_STATIC","false"],["COOKIE_MARKETING","false"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookie_consent","1"],["ff_cookie_notice","1"],["allris-cookie-msg","1"],["gdpr__google__analytics","false"],["gdpr__facebook__social","false"],["gdpr__depop__functional","true"],["cookie_consent","1","","reload","1"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["cookie-consent","true"],["abz_seo_choosen","1"],["privacyAccepted","true"],["cok","1","","reload","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["CookieConsentV2","YES"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["cookie_consent_user_accepted","false"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Marketing","0"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Analytics","0"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","0"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree_0124","1"],["cookiesPolicy20211101","1"],["sc-cookies-accepted","true"],["marketing_cookie_akkoord","0"],["site_cookie_akkoord","1"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["analytics_cookies","0"],["cookies_accepted","1","","reload","1"],["tracking_cookies","0"],["advertisement-age-show-alcohol","false"],["advertisement-age-show-gamble","false"],["ibe.acceptedCookie","true"],["acceptedPolicy","true"],["cookie-consent","false"],["cookieConsentClosed","true"],["cookiesPrivacy","false"],["_tvsPrivacy","true"],["epCookieConsent","0","","reload","1"],["royaloakTermsCookie","1"],["is_allowed_client_traking_niezbedne","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["cpaccpted","true"],["AllowCookies","true"],["cookiesAccepted","3"],["optOutsTouched","true"],["optOutAccepted","true"],["gdpr_dismissal","true"],["analyticsCookieAccepted","0"],["cookieAccepted","0"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["use_cookie","1"],["figshareCookiesAccepted","true"],["bitso_cc","1"],["eg_asked","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookie_analytcs","false","","reload","1"],["dhl-webapp-track","allowed"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["ofdb_werbung","Y","","reload","1"],["user_cookie_consent","1"],["STAgreement","1"],["tc:dismissexitintentpopup","true"],["functionalCookies","true"],["contentPersonalisationCookies","false"],["statisticalCookies","false"],["viewed_cookie_policy","yes","","reload","1"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["cookielawinfo-checkbox-non-necessary","no"],["cookielawinfo-checkbox-advertisement","no"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-analytics","no"],["cookielawinfo-checkbox-performance","no"],["cookielawinfo-checkbox-markkinointi","no"],["cookielawinfo-checkbox-tilastointi","no"],["cookie_accept","1"],["hide_cookieoverlay_v2","1","","reload","1"],["socialmedia-cookies_allowed_v2","0"],["performance-cookies_allowed_v2","0"],["mrm_gdpr","1"],["necessary_consent","accepted"],["jour_cookies","1"],["jour_functional","true"],["jour_analytics","false"],["jour_marketing","false"],["gdpr_opt_in","1"],["ad_storage","denied"],["stickyCookiesSet","true"],["analytics_storage","denied"],["user_experience_cookie_consent","false"],["marketing_cookie_consent","false"],["cookie_notice_dismissed","yes"],["cookie_analytics_allow","no"],["mer_cc_dim_rem_allow","no"],["num_times_cookie_consent_banner_shown","1"],["cookie_consent_banner_shown_last_time","1"],["privacy_hint","1"],["cookiesConsent","1"],["cookiesStatistics","0"],["cookiesPreferences","0"],["gpc_v","1"],["gpc_ad","0"],["gpc_analytic","0"],["gpc_audience","0"],["gpc_func","0"],["OptanonAlertBoxClosed","1"],["vkicookieconsent","0"],["cookie_policy_agreement","3"],["internalCookies","false"],["essentialsCookies","true"],["TESCOBANK_ENSIGHTEN_PRIVACY_Advertising","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Experience","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Measurement","0"],["viewed_cookie_policy","yes"],["cookielawinfo-checkbox-toiminnalliset-evasteet","yes"],["am-sub","1"],["allow-marketing","false"],["allow-analytics","false"],["cc_analytics","0"],["cc_essential","1"],["__consent","%5B%22required%22%5D"],["veriff_cookie_consent_completed","true"],["external-data-googlemaps-is-enabled","true"],["external-data-youtube-is-enabled","true"],["external-data-spotify-is-enabled","true"],["notion_check_cookie_consent","true"],["vl-cookie-consent-cookie-consent","true"],["vl-cookie-consent-functional","true"],["amcookie_allowed","0"],["euconsent-v2-addtl","0"],["dummy","1","","reload","1"],["acepta_cookie","acepta"],["3sat_cmp_configuration","true"],["privacyConsent_version","1","","reload","1"],["privacyConsent","false"],["DDCookiePolicy-consent-functional","false"],["DDCookiePolicy-consent-tracking","false"],["DDCookiePolicy-consent-statistics","false"],["CookieNotificationSeen","1","","reload","1"],["cookie-management-preferences-set","true"],["cookie-management-version","1"],["show-cookie-banner","1"],["mml-cookie-agreed","2"]];

const hostnamesMap = new Map([["toppy.be",0],["uhrzeit123.de",[1,2]],["ocean.io",3],["gls-group.eu",4],["copaamerica.com",5],["cooleygo.com",6],["map.blitzortung.org",7],["northumbriasport.com",8],["clearspend.natwest.com",9],["cellcolabsclinical.com",10],["producthunt.com",11],["motorsportreg.com",[12,13]],["imola.motorsportreg.com",[14,15]],["pga.com",16],["portal.payment.eltax.lta.go.jp",17],["greenbuildingadvisor.com",[18,19,20]],["finewoodworking.com",[18,19,20]],["privatekeys.pw",21],["telli.dpd.ee",22],["youthforum.org",22],["votegroup.de",[23,24]],["pharmahall.gr",25],["x-team.com",26],["reservations.helveticmotion.ch",27],["endclothing.com",[28,29]],["arning-bau.de",30],["kraftwerk.co.at",31],["fhr.biz",32],["srf.nu",33],["jn.fo",[34,35]],["rovia.es",36],["airnewzealand.co.nz",37],["viu.com",38],["dinamalar.com",39],["volkswagen-group.com",40],["solo.io",41],["pomelo.la",42],["ibuypower.com",43],["sberbank.com",[44,428]],["swissmilk.ch",45],["gamemaker.io",46],["pixiv.net",47],["kinemaster.com",48],["sp32bb.pl",49],["jazz.fm",50],["juntadeandalucia.es",51],["melee.gg",[52,53,54]],["chemocare.com",55],["mobiliteit.nl",56],["xledger.net",57],["reviewmeta.com",58],["guide-bordeaux-gironde.com",59],["travelinsured.com",60],["gdpr.twitter.com",61],["mora.hu",62],["confused.com",63],["physikinstrumente.de",64],["karlknauer.de",64],["schoeck.com",64],["resonate.coop",64],["northgatevehiclehire.ie",64],["badhall.at",64],["cic.ch",64],["ilsaggiatore.com",65],["forum.digitalfernsehen.de",66],["bitscrunch.com",[67,68,69]],["hannahgraaf.com",70],["shop.elbers-hof.de",[71,72]],["woolsocks.eu",73],["uza.be",74],["5asec.ch",74],["wizards.com",74],["kitepackaging.co.uk",[75,76]],["parkenflughafen.de",77],["radyofenomen.com",78],["elsate.com",79],["hume.ai",80],["lotusantwerp.wacs.online",81],["gitbook.io",82],["gitbook.com",82],["thehacker.recipes",82],["docs.dyrector.io",82],["makeresearchpay.com",83],["tandartsenpraktijk-simons.tandartsennet.nl",84],["huisartsenpraktijkdoorn.nl",84],["bcorporation.net",85],["knime.com",[85,128]],["quebueno.es",85],["edookit.com",86],["trixonline.be",87],["radio-canada.ca",88],["heysummit.com",89],["puromarketing.com",90],["radicalmotorsport.com",91],["biurobox.pl",92],["cycling74.com",93],["triviacreator.com",94],["freshis.com",94],["anker.com",94],["computacenter.com",95],["playbalatro.com",96],["kastner-oehler.de",97],["kastner-oehler.at",97],["kastner-oehler.ch",97],["twenga.it",98],["twenga.fr",98],["twenga.co.uk",98],["twenga.de",98],["twenga.es",98],["twenga.pl",98],["twenga.nl",98],["twenga.se",98],["olx.kz",99],["efl.com",100],["wst.tv",100],["cuvva.com",101],["vitbikes.de",102],["gourmetfoodstore.com",103],["schulfahrt.de",104],["deutsche-finanzagentur.de",105],["thejazzcafelondon.com",106],["keeb.supply",107],["spb.hh.ru",108],["kaluga.hh.ru",108],["school.hh.ru",108],["rating.hh.ru",108],["novgorod.hh.ru",108],["xxxshemaleporn.com",[109,110]],["gayhits.com",[109,110]],["gaypornvideos.xxx",[109,110]],["sextubespot.com",[109,110]],["wewantjusticedao.org",111],["godbolt.org",112],["projectenglish.com.pl",[113,118]],["ledenicheur.fr",113],["pricespy.co.uk",113],["pricespy.co.nz",113],["sae.fsc.ccoo.es",114],["piusx-college.nl",115],["yoomoney.ru",116],["vod.warszawa.pl",117],["m.twitch.tv",119],["environment.data.gov.uk",120],["playtesting.games",121],["portal.by.aok.de",122],["umlandscout.de",123],["atombank.co.uk",[124,125,126]],["showtv.com.tr",127],["seventhgeneration.com",128],["press.princeton.edu",128],["ldz.lv",128],["crtm.es",129],["airastana.com",130],["vkf-renzel.nl",131],["booking.reederei-zingst.de",[132,133,134]],["booking.weisse-flotte.de",[132,133,134]],["booking2.reederei-hiddensee.de",[132,133,134]],["sanswiss.pl",135],["galaxy.com",136],["petdesk.com",137],["ivyexec.com",138],["railtech.com",139],["lottehotel.com",[140,141,142,143,144]],["paydirekt.de",145],["kijiji.ca",146],["posterstore.fr",147],["posterstore.eu",147],["posterstore.be",147],["posterstore.de",147],["posterstore.hu",147],["posterstore.ie",147],["posterstore.it",147],["posterstore.no",147],["posterstore.nl",147],["posterstore.pl",147],["posterstore.com",147],["posterstore.ae",147],["posterstore.ca",147],["posterstore.nz",147],["posterstore.es",147],["posterstore.kr",147],["posterstore.jp",147],["posterstore.dk",147],["posterstore.se",147],["posterstore.ch",147],["posterstore.at",147],["myriadicity.net",148],["dgsf.org",148],["endgame.id",149],["cashback-cards.ch",150],["swisscard.ch",150],["ahorn24.de",151],["blockdyor.com",152],["ticket.io",153],["omega-nuernberg.servicebund.com",154],["lojaboschferramentas.com.br",[155,157,158]],["shareloft.com",156],["fineartsmuseum.recreatex.be",[159,160,161]],["jaapeden.nl",[159,160,161]],["eboo.lu",162],["lasmallagency.com",163],["lhsystems.com",[164,165,166,167]],["twomates.de",168],["intergiro.com",169],["healthygamer.gg",170],["telepizza.es",[171,172,173]],["telepizza.pt",[171,172,173]],["frisco.pl",174],["tyleenslang.nl",175],["schrikdraad.net",175],["kruiwagen.net",175],["pvcvoordeel.nl",175],["pvcbuis.com",175],["drainagebuizen.nl",175],["likewise.com",176],["longines.com",[177,178,179,180]],["vater-it.de",181],["biano.hu",182],["nadia.gov.gr",183],["hana-book.fr",184],["kzvb.de",185],["correosexpress.com",186],["cexpr.es",186],["rte.ie",187],["smart.com",188],["gry.pl",188],["gamesgames.com",188],["games.co.uk",188],["jetztspielen.de",188],["ourgames.ru",188],["permainan.co.id",188],["gioco.it",188],["jeux.fr",188],["juegos.com",188],["ojogos.com.br",188],["oyunskor.com",188],["spela.se",188],["spelletjes.nl",188],["agame.com",188],["spielen.com",188],["flashgames.ru",188],["games.co.id",188],["giochi.it",188],["jeu.fr",188],["spel.nl",188],["sartor-stoffe.de",189],["rockpoint.cz",189],["rockpoint.sk",189],["parfum-zentrum.de",189],["candy-store.cz",189],["tridge.com",190],["asus.com",[191,192]],["drinksking.sk",193],["neuhauschocolates.com",194],["commandsuite.it",195],["oktea.tw",196],["bafin.de",197],["materna.de",197],["bamf.de",197],["tenvinilo-argentina.com",[198,199]],["eikaforsikring.no",[200,201]],["eurowings.com",[202,203,204]],["newpharma.be",[205,206,207]],["newpharma.fr",[205,206,207]],["newpharma.de",[205,206,207]],["newpharma.at",[205,206,207]],["newpharma.nl",[205,206,207]],["kapoorwatch.com",208],["instantoffices.com",209],["paf.se",209],["citibank.pl",209],["citibankonline.pl",209],["azertyfactor.be",210],["zelezodum.cz",211],["thw.de",212],["bafa.de",212],["bka.de",212],["bmbf.de",212],["weather.com",213],["bolist.se",[214,215]],["project529.com",215],["evivanlanschot.nl",216],["prenatal.nl",217],["onnibus.com",[217,855,856,857]],["kyoceradocumentsolutions.us",[217,901,902]],["kyoceradocumentsolutions.ch",[217,901,902]],["kyoceradocumentsolutions.co.uk",[217,901,902]],["kyoceradocumentsolutions.de",[217,901,902]],["kyoceradocumentsolutions.es",[217,901,902]],["kyoceradocumentsolutions.eu",[217,901,902]],["kyoceradocumentsolutions.fr",[217,901,902]],["kyoceradocumentsolutions.it",[217,901,902]],["kyoceradocumentsolutions.ru",[217,901,902]],["kyoceradocumentsolutions.mx",[217,901,902]],["kyoceradocumentsolutions.cl",[217,901,902]],["kyoceradocumentsolutions.com.br",[217,901,902]],["wagner-tuning.com",[218,219,220,221]],["waitrosecellar.com",[222,223,224,225]],["waitrose.com",[222,576]],["kvk.nl",[226,227,228]],["macfarlanes.com",229],["pole-emploi.fr",230],["gardenmediaguild.co.uk",231],["samplerite.com",232],["samplerite.cn",232],["sororedit.com",233],["blukit.com.br",234],["biegnaszczyt.pl",235],["staff-gallery.com",236],["itv.com",237],["dvag.de",238],["premierinn.com",[239,240,241,242]],["whitbreadinns.co.uk",[239,240,241,242]],["barandblock.co.uk",[239,240,241,242]],["tabletable.co.uk",[239,240,241,242]],["brewersfayre.co.uk",[239,240,241,242]],["beefeater.co.uk",[239,240,241,242]],["allstarssportsbars.co.uk",[243,244]],["babiesrus.ca",245],["toysrus.ca",245],["roomsandspaces.ca",245],["athletic-club.eus",[246,247,248]],["wattoo.dk",249],["wattoo.no",249],["texthelp.com",[250,251]],["courierexchange.co.uk",[252,253,254]],["haulageexchange.co.uk",[252,253,254]],["ecaytrade.com",255],["powerball.com",256],["tlaciarik.sk",256],["tiskarik.cz",256],["sseriga.edu",[257,258]],["rt.com",259],["swrng.de",260],["crfop.gdos.gov.pl",261],["nurgutes.de",262],["kpcen-torun.edu.pl",263],["opintopolku.fi",264],["app.erevie.pl",265],["debenhams.com",266],["archiwumalle.pl",267],["konicaminolta.ca",268],["konicaminolta.us",268],["deutschebank-dbdirect.com",[269,270,271]],["dbonline.deutsche-bank.es",[269,270,271]],["deutsche-bank.es",[269,270,271]],["hipotecaonline.db.com",272],["kangasalansanomat.fi",273],["eif.org",274],["tunnelmb.net",274],["sugi-net.jp",275],["understandingsociety.ac.uk",276],["leibniz.com",277],["horecaworld.biz",[277,545]],["horecaworld.be",[277,545]],["bettertires.com",277],["electroprecio.com",277],["autohero.com",277],["computerbase.de",[277,898]],["sistemacomponentes.com.br",278],["bargaintown.ie",279],["tui.nl",280],["doppelmayr.com",281],["case-score.com",[282,283]],["cote.co.uk",284],["finimize.com",284],["k-einbruch.de",[285,286]],["blxxded.com",285],["rtu.lv",287],["sysdream.com",288],["cinemarkca.com",289],["neander-zahn.de",290],["theadelphileeds.co.uk",291],["tobycarvery.co.uk",291],["carsupermarket.com",291],["viajesatodotren.com",292],["ticketingcine.fr",293],["agenziavista.it",294],["e-chladiva.cz",294],["bitecode.dev",295],["mjob.si",[296,297,298]],["airportrentacar.gr",299],["mobile-fueling.de",299],["plos.org",300],["autohaus24.de",301],["sixt-neuwagen.de",301],["gadis.es",[302,303]],["dom.ru",303],["ford-kimmerle-reutlingen.de",304],["autohaus-reitermayer.de",304],["autohaus-diefenbach-waldbrunn.de",304],["autohaus-diefenbach.de",304],["autohaus-musberg.de",304],["ford-ah-im-hunsrueck-simmern.de",304],["ford-arndt-goerlitz.de",304],["ford-autogalerie-alfeld.de",304],["ford-bacher-schrobenhausen.de",304],["ford-bathauer-bad-harzburg.de",304],["ford-behrend-waren.de",304],["ford-bergland-frankfurt-oder.de",304],["ford-bergland-wipperfuerth.de",304],["ford-besico-glauchau.de",304],["ford-besico-nuernberg.de",304],["ford-bischoff-neumuenster.de",304],["ford-bodach-borgentreich.de",304],["ford-bunk-saarbruecken.de",304],["ford-bunk-voelklingen.de",304],["ford-busch-kirchberg.de",304],["ford-diermeier-muenchen.de",304],["ford-dinnebier-leipzig.de",304],["ford-duennes-regensburg.de",304],["ford-fischer-bochum.de",304],["ford-fischer-muenster.de",304],["ford-foerster-koblenz.de",304],["ford-fuchs-uffenheim.de",304],["ford-geberzahn-koeln.de",304],["ford-gerstmann-duesseldorf.de",304],["ford-haefner-und-strunk-kassel.de",304],["ford-hartmann-kempten.de",304],["ford-hartmann-rastatt.de",304],["ford-hatzner-karlsruhe.de",304],["ford-heine-hoexter.de",304],["ford-hentschel-hildesheim.de",304],["ford-hessengarage-dreieich.de",304],["ford-hessengarage-frankfurt.de",304],["ford-hga-windeck.de",304],["ford-hommert-coburg.de",304],["ford-horstmann-rastede.de",304],["ford-janssen-sonsbeck.de",304],["ford-jochem-stingbert.de",304],["ford-jungmann-wuppertal.de",304],["ford-kestel-marktzeuln.de",304],["ford-klaiber-bad-friedrichshall.de",304],["ford-koenig-eschwege.de",304],["ford-kohlhoff-mannheim.de",304],["ford-kt-automobile-coesfeld.de",304],["ford-lackermann-wesel.de",304],["ford-ludewig-delligsen.de",304],["ford-maiwald-linsengericht.de",304],["ford-mertens-beckum.de",304],["ford-meyer-bad-oeynhausen.de",304],["ford-mgs-bayreuth.de",304],["ford-mgs-radebeul.de",304],["ford-muecke-berlin.de",304],["ford-norren-weissenthurm.de",304],["ford-nrw-garage-duesseldorf.de",304],["ford-nrw-garage-handweiser.de",304],["ford-nuding-remshalden.de",304],["ford-ohm-rendsburg.de",304],["ford-reinicke-muecheln.de",304],["ford-rennig.de",304],["ford-roerentrop-luenen.de",304],["ford-schankola-dudweiler.de",304],["ford-sg-goeppingen.de",304],["ford-sg-leonberg.de",304],["ford-sg-neu-ulm.de",304],["ford-sg-pforzheim.de",304],["ford-sg-waiblingen.de",304],["ford-storz-st-georgen.de",304],["ford-strunk-koeln.de",304],["ford-tobaben-hamburg.de",304],["ford-toenjes-zetel.de",304],["ford-wagner-mayen.de",304],["ford-wahl-fritzlar.de",304],["ford-wahl-siegen.de",304],["ford-weege-bad-salzuflen.de",304],["ford-westhoff-hamm.de",304],["ford-wieland-hasbergen.de",304],["renault-autocenterprignitz-pritzwalk.de",304],["renault-spenrath-juelich.de",304],["vitalllit.com",305],["fincaparera.com",305],["dbnetbcn.com",305],["viba.barcelona",305],["anafaustinoatelier.com",305],["lamparasherrero.com",305],["calteixidor.cat",305],["argentos.barcelona",305],["anmarlube.com",305],["anynouxines.barcelona",305],["crearunapaginaweb.cat",305],["cualesmiip.com",305],["porndoe.com",[306,307,308]],["thinkingaustralia.com",309],["elrow.com",310],["ownit.se",311],["velo-antwerpen.be",[312,313]],["wwnorton.com",314],["pc-canada.com",315],["mullgs.se",316],["1a-sehen.de",317],["feature.fm",318],["comte.com",319],["baltic-watches.com",320],["np-brijuni.hr",320],["vilgain.com",320],["tradingview.com",321],["wevolver.com",322],["experienciasfree.com",323],["freemans.com",324],["kivikangas.fi",325],["lumingerie.com",325],["melkkobrew.fi",325],["kh.hu",[326,327,328]],["aplgo.com",329],["securityconference.org",330],["aha.or.at",[331,334]],["fantasyfitnessing.com",332],["chocolateemporium.com",333],["account.samsung.com",335],["crushwineco.com",336],["levi.pt",337],["fertagus.pt",338],["smiggle.co.uk",339],["ubisoft.com",[340,341,342,343]],["store.ubisoft.com",[340,343,781,782]],["thulb.uni-jena.de",344],["splityourticket.co.uk",345],["eramba.org",346],["openai.com",[347,348]],["kupbilecik.com",[349,350]],["kupbilecik.de",[349,350]],["kupbilecik.pl",[349,350]],["shopilya.com",351],["arera.it",352],["haustier-berater.de",352],["hfm-frankfurt.de",352],["zoommer.ge",353],["studentapan.se",354],["petcity.lt",[355,356,357,358]],["tobroco.com",[359,363]],["tobroco.nl",[359,363]],["tobroco-giant.com",[359,363]],["geosfreiberg.de",[360,361]],["eapvic.org",362],["bassolsenergia.com",362],["bammusic.com",[364,366,367]],["green-24.de",365],["phish-test.de",368],["bokadirekt.se",369],["ford.lt",370],["ford.pt",370],["ford.fr",370],["ford.de",370],["ford.dk",370],["ford.pl",370],["ford.se",370],["ford.nl",370],["ford.no",370],["ford.fi",370],["ford.gr",370],["ford.it",370],["data-media.gr",371],["e-food.gr",[372,373]],["bvmed.de",374],["babyshop.com",[375,376,377]],["griffbereit24.de",378],["checkwx.com",379],["calendardate.com",380],["wefashion.ch",381],["wefashion.fr",381],["wefashion.lu",381],["wefashion.be",381],["wefashion.de",381],["wefashion.nl",381],["brettspiel-angebote.de",[382,383]],["nio.com",384],["kancelarskepotreby.net",[385,386,387]],["segment-anything.com",388],["sketch.metademolab.com",389],["cambridgebs.co.uk",390],["freizeitbad-greifswald.de",391],["giuseppezanotti.com",[392,393,394]],["xcen.se",394],["biggreenegg.co.uk",395],["skihuette-oberbeuren.de",[396,397,398]],["pwsweather.com",399],["xfree.com",400],["theweathernetwork.com",[401,402]],["monese.com",[403,404,405]],["assos.com",403],["helmut-fischer.com",406],["myscience.org",407],["7-eleven.com",408],["airwallex.com",409],["streema.com",410],["gov.lv",411],["tise.com",412],["codecamps.com",413],["avell.com.br",414],["moneyfarm.com",415],["app.moneyfarm.com",415],["simpl.rent",416],["hubspot.com",417],["prodyna.com",[418,419,420,421]],["zutobi.com",[418,419,420,421]],["calm.com",[422,423]],["pubgesports.com",[424,425,426]],["outwrite.com",427],["sbermarket.ru",429],["atani.com",[430,431,432]],["croisieresendirect.com",433],["bgextras.co.uk",434],["sede.coruna.gal",435],["czech-server.cz",436],["hitech-gamer.com",437],["bialettikave.hu",[438,439,440]],["canalplus.com",[441,442,443]],["mader.bz.it",[444,445,446]],["supply.amazon.co.uk",447],["bhaptics.com",448],["cleverbot.com",449],["watchaut.film",450],["tuffaloy.com",451],["fanvue.com",451],["electronoobs.com",452],["xn--lkylen-vxa.se",453],["tiefenthaler-landtechnik.at",454],["tiefenthaler-landtechnik.ch",454],["tiefenthaler-landtechnik.de",454],["varma.fi",455],["vyos.io",456],["digimobil.es",[457,458]],["teenage.engineering",459],["merrell.pl",[460,722]],["converse.pl",460],["shop.wf-education.com",[460,722]],["werkenbijaswatson.nl",461],["converse.com",[462,463]],["buyandapply.nexus.org.uk",464],["img.ly",465],["halonen.fi",[465,497,498,499,500]],["carlson.fi",[465,497,498,499,500]],["cams.ashemaletube.com",[466,467]],["electronicacerler.com",[468,469,470]],["okpoznan.pl",[471,476]],["ielts.idp.com",472],["ielts.co.nz",472],["ielts.com.au",472],["einfach-einreichen.de",[473,474,475]],["endlesstools.io",477],["mbhszepkartya.hu",478],["casellimoveis.com.br",479],["embedplus.com",480],["e-file.pl",481],["sp215.info",482],["empik.com",483],["senda.pl",484],["befestigungsfuchs.de",485],["cut-tec.co.uk",486],["gaytimes.co.uk",487],["statisticsanddata.org",488],["hello.one",489],["paychex.com",490],["wildcat-koeln.de",491],["libraries.merton.gov.uk",[492,493]],["tommy.hr",[494,495]],["usit.uio.no",496],["demo-digital-twin.r-stahl.com",501],["la31devalladolid.com",[502,503]],["mx.com",504],["foxtrail.fjallraven.com",505],["dotwatcher.cc",506],["bazarchic.com",[507,508,509]],["seedrs.com",510],["mypensiontracker.co.uk",511],["praxisplan.at",[511,532]],["esimplus.me",512],["cineplanet.com.pe",513],["ecologi.com",514],["wamba.com",515],["eurac.edu",516],["akasaair.com",517],["rittal.com",518],["worstbassist.com",[519,520,521,522,523,524]],["zs-watch.com",525],["crown.com",526],["mesanalyses.fr",527],["teket.jp",528],["fish.shimano.com",[529,530,531]],["simsherpa.com",[533,534,535]],["translit.ru",536],["aruba.com",537],["aireuropa.com",538],["skfbearingselect.com",[539,540]],["scanrenovation.com",541],["ttela.se",542],["dominospizza.pl",543],["devagroup.pl",544],["secondsol.com",545],["angelifybeauty.com",546],["cotopaxi.com",547],["justjoin.it",548],["digibest.pt",549],["two-notes.com",550],["theverge.com",551],["daimant.co",552],["secularism.org.uk",553],["karriere-hamburg.de",554],["musicmap.info",555],["gasspisen.se",556],["medtube.pl",557],["medtube.es",557],["medtube.fr",557],["medtube.net",557],["standard.sk",558],["linmot.com",559],["larian.com",[559,845]],["s-court.me",559],["containerandpackaging.com",560],["top-yp.de",561],["termania.net",562],["account.nowpayments.io",563],["fizjobaza.pl",564],["gigasport.at",565],["gigasport.de",565],["gigasport.ch",565],["velleahome.gr",566],["nicequest.com",567],["handelsbanken.no",568],["handelsbanken.com",568],["handelsbanken.co.uk",568],["handelsbanken.se",[568,649]],["handelsbanken.dk",568],["handelsbanken.fi",568],["ilarahealth.com",569],["songtradr.com",[570,829]],["logo.pt",[571,572]],["flexwhere.co.uk",[573,575]],["flexwhere.de",[573,575]],["pricewise.nl",573],["getunleash.io",573],["dentmania.de",573],["free.navalny.com",573],["latoken.com",573],["empathy.com",574],["labs.epi2me.io",574],["campusbrno.cz",[577,578,579]],["secrid.com",580],["etsy.com",581],["careers.cloud.com",581],["blablacar.rs",582],["blablacar.ru",582],["blablacar.com.tr",582],["blablacar.com.ua",582],["blablacar.com.br",582],["seb.se",583],["sebgroup.com",583],["deps.dev",584],["buf.build",585],["starofservice.com",586],["ytcomment.kmcat.uk",587],["gmx.com",588],["gmx.fr",588],["karofilm.ru",589],["octopusenergy.it",590],["octopusenergy.es",[590,591]],["justanswer.es",592],["justanswer.de",592],["justanswer.com",592],["justanswer.co.uk",592],["citilink.ru",593],["huutokaupat.com",594],["kaggle.com",595],["emr.ch",[596,601]],["gem.cbc.ca",597],["pumatools.hu",598],["ici.tou.tv",599],["crunchyroll.com",600],["mayflex.com",602],["clipchamp.com",602],["trouwenbijfletcher.nl",602],["fletcher.nl",602],["fletcherzakelijk.nl",602],["intermatic.com",602],["ebikelohr.de",603],["eurosender.com",604],["melectronics.ch",605],["guard.io",606],["nokportalen.se",607],["dokiliko.com",608],["valamis.com",[609,610,611]],["sverigesingenjorer.se",612],["shop.almawin.de",[613,614,615,652]],["zeitzurtrauer.de",616],["skaling.de",[617,618,619]],["bringmeister.de",620],["gdx.net",621],["clearblue.com",622],["drewag.de",[623,624,625]],["enso.de",[623,624,625]],["buidlbox.io",623],["helitransair.com",626],["more.com",627],["nwslsoccer.com",627],["climatecentral.org",628],["resolution.de",629],["flagma.by",630],["eatsalad.com",631],["pacstall.dev",632],["web2.0calc.fr",633],["de-appletradein.likewize.com",634],["swissborg.com",635],["qwice.com",636],["canalpluskuchnia.pl",[637,638]],["uizard.io",639],["stmas.bayern.de",[640,643]],["novayagazeta.eu",641],["kinopoisk.ru",642],["yandex.ru",642],["go.netia.pl",[644,645]],["polsatboxgo.pl",[644,645]],["ing.it",[646,647]],["ing.nl",648],["youcom.com.br",650],["rule34.paheal.net",651],["deep-shine.de",652],["shop.ac-zaun-center.de",652],["kellermann-online.com",652],["kletterkogel.de",652],["pnel.de",652],["korodrogerie.de",652],["der-puten-shop.de",652],["katapult-shop.de",652],["evocsports.com",652],["esm-computer.de",652],["calmwaters.de",652],["mellerud.de",652],["akustik-projekt.at",652],["vansprint.de",652],["0815.at",652],["0815.eu",652],["ojskate.com",652],["der-schweighofer.de",652],["tz-bedarf.de",652],["zeinpharma.de",652],["weicon.com",652],["dagvandewebshop.be",652],["thiele-tee.de",652],["carbox.de",652],["riapsport.de",652],["trendpet.de",652],["eheizung24.de",652],["seemueller.com",652],["vivande.de",652],["heidegrill.com",652],["gladiator-fightwear.com",652],["h-andreas.com",652],["pp-parts.com",652],["natuerlich-holzschuhe.de",652],["massivart.de",652],["malermeister-shop.de",652],["imping-confiserie.de",652],["lenox-trading.at",652],["cklenk.de",652],["catolet.de",652],["drinkitnow.de",652],["patisserie-m.de",652],["storm-proof.com",652],["balance-fahrradladen.de",652],["magicpos.shop",652],["zeinpharma.com",652],["sps-handel.net",652],["novagenics.com",652],["butterfly-circus.de",652],["holzhof24.de",652],["w6-wertarbeit.de",652],["fleurop.de",652],["leki.com",652],["extremeaudio.de",652],["taste-market.de",652],["delker-optik.de",652],["stuhl24-shop.de",652],["g-nestle.de",652],["alpine-hygiene.ch",652],["fluidmaster.it",652],["cordon.de",652],["belisse-beauty.de",652],["belisse-beauty.co.uk",652],["wpc-shop24.de",652],["liv.si",652],["maybach-luxury.com",652],["leiternprofi24.de",652],["hela-shop.eu",652],["hitado.de",652],["j-koenig.de",652],["armedangels.com",[652,729,730]],["bvk-beamtenversorgung.de",653],["hofer-kerzen.at",654],["karls-shop.de",655],["luvly.care",656],["firmen.wko.at",656],["byggern.no",657],["donauauen.at",658],["woltair.cz",659],["rostics.ru",660],["hife.es",661],["lilcat.com",662],["hot.si",[663,664,665,666]],["crenolibre.fr",667],["e-pole.pl",668],["dopt.com",669],["keb-automation.com",670],["bonduelle.ru",671],["oxfordonlineenglish.com",672],["pccomponentes.fr",673],["pccomponentes.com",673],["pccomponentes.pt",673],["grants.at",674],["africa-uninet.at",674],["rqb.at",674],["youngscience.at",674],["oead.at",674],["innovationsstiftung-bildung.at",674],["etwinning.at",674],["arqa-vet.at",674],["zentrumfuercitizenscience.at",674],["vorstudienlehrgang.at",674],["erasmusplus.at",674],["jeger.pl",675],["bo.de",676],["thegamingwatcher.com",677],["norlysplay.dk",678],["plusujemy.pl",679],["asus.com.cn",[680,682]],["zentalk.asus.com",[680,682]],["mubi.com",681],["59northwheels.se",683],["photospecialist.co.uk",684],["foto-gregor.de",684],["kamera-express.de",684],["kamera-express.be",684],["kamera-express.nl",684],["kamera-express.fr",684],["kamera-express.lu",684],["dhbbank.com",685],["dhbbank.de",685],["dhbbank.be",685],["dhbbank.nl",685],["login.ingbank.pl",686],["fabrykacukiernika.pl",[687,688]],["peaks.com",689],["3landesmuseen-braunschweig.de",690],["unifachbuch.de",[691,692,693]],["playlumi.com",[694,695,696]],["chatfuel.com",697],["studio3t.com",[698,699,700,701]],["realgap.co.uk",[702,703,704,705]],["hotelborgia.com",[706,707]],["sweet24.de",708],["zwembaddekouter.be",709],["flixclassic.pl",710],["jobtoday.com",711],["deltatre.com",[712,713,727]],["withings.com",[714,715,716]],["blista.de",[717,718]],["hashop.nl",719],["gift.be",[720,721]],["elevator.de",722],["foryouehealth.de",722],["animaze.us",722],["penn-elcom.com",722],["curantus.de",722],["mtbmarket.de",722],["spanienweinonline.ch",722],["novap.fr",722],["bizkaia.eus",[723,724,725]],["sinparty.com",726],["mantel.com",728],["e-dojus.lv",731],["burnesspaull.com",732],["oncosur.org",733],["photobooth.online",734],["epidemicsound.com",735],["ryanair.com",736],["refurbished.at",[737,738,739]],["refurbished.nl",[737,738,739]],["refurbished.be",[737,738,739]],["refurbishedstore.de",[737,738,739]],["bayernportal.de",[740,741,742]],["ayudatpymes.com",743],["zipjob.com",743],["shoutcast.com",743],["plastischechirurgie-muenchen.info",744],["bonn.sitzung-online.de",745],["depop.com",[746,747,748]],["thenounproject.com",749],["pricehubble.com",750],["ilmotorsport.de",751],["karate.com",752],["psbank.ru",752],["myriad.social",752],["exeedme.com",752],["followalice.com",[752,820]],["aqua-store.fr",753],["voila.ca",754],["anastore.com",755],["app.arzt-direkt.de",756],["dasfutterhaus.at",757],["e-pity.pl",758],["fillup.pl",759],["dailymotion.com",760],["barcawelt.de",761],["lueneburger-heide.de",762],["polizei.bayern.de",[763,765]],["ourworldofpixels.com",764],["jku.at",766],["matkahuolto.fi",767],["backmarket.de",[768,769,770]],["backmarket.co.uk",[768,769,770]],["backmarket.es",[768,769,770]],["backmarket.be",[768,769,770]],["backmarket.at",[768,769,770]],["backmarket.fr",[768,769,770]],["backmarket.gr",[768,769,770]],["backmarket.fi",[768,769,770]],["backmarket.ie",[768,769,770]],["backmarket.it",[768,769,770]],["backmarket.nl",[768,769,770]],["backmarket.pt",[768,769,770]],["backmarket.se",[768,769,770]],["backmarket.sk",[768,769,770]],["backmarket.com",[768,769,770]],["eleven-sportswear.cz",[771,772,773]],["silvini.com",[771,772,773]],["silvini.de",[771,772,773]],["purefiji.cz",[771,772,773]],["voda-zdarma.cz",[771,772,773]],["lesgarconsfaciles.com",[771,772,773]],["ulevapronohy.cz",[771,772,773]],["vitalvibe.eu",[771,772,773]],["plavte.cz",[771,772,773]],["mo-tools.cz",[771,772,773]],["flamantonlineshop.cz",[771,772,773]],["sandratex.cz",[771,772,773]],["norwayshop.cz",[771,772,773]],["3d-foto.cz",[771,772,773]],["neviditelnepradlo.cz",[771,772,773]],["nutrimedium.com",[771,772,773]],["silvini.cz",[771,772,773]],["karel.cz",[771,772,773]],["silvini.sk",[771,772,773]],["book-n-drive.de",774],["cotswoldoutdoor.com",775],["cotswoldoutdoor.ie",775],["cam.start.canon",776],["usnews.com",777],["researchaffiliates.com",778],["singkinderlieder.de",779],["stiegeler.com",780],["ba.com",[783,784,785,786,787,788,789]],["britishairways.com",[783,784,785,786,787,788,789]],["cineman.pl",[790,791,792]],["tv-trwam.pl",[790,791,792,793]],["qatarairways.com",[794,795,796,797,798]],["wedding.pl",799],["vivaldi.com",800],["emuia1.gugik.gov.pl",801],["nike.com",802],["adidas.at",803],["adidas.be",803],["adidas.ca",803],["adidas.ch",803],["adidas.cl",803],["adidas.co",803],["adidas.co.in",803],["adidas.co.kr",803],["adidas.co.nz",803],["adidas.co.th",803],["adidas.co.uk",803],["adidas.com",803],["adidas.com.ar",803],["adidas.com.au",803],["adidas.com.br",803],["adidas.com.my",803],["adidas.com.ph",803],["adidas.com.vn",803],["adidas.cz",803],["adidas.de",803],["adidas.dk",803],["adidas.es",803],["adidas.fi",803],["adidas.fr",803],["adidas.gr",803],["adidas.ie",803],["adidas.it",803],["adidas.mx",803],["adidas.nl",803],["adidas.no",803],["adidas.pe",803],["adidas.pl",803],["adidas.pt",803],["adidas.ru",803],["adidas.se",803],["adidas.sk",803],["colourbox.com",804],["ebilet.pl",805],["myeventeo.com",806],["snap.com",807],["louwman.nl",[808,809]],["ratemyprofessors.com",810],["filen.io",811],["leotrippi.com",812],["restaurantclub.pl",812],["context.news",812],["queisser.de",812],["grandprixradio.dk",[813,814,815,816,817]],["grandprixradio.nl",[813,814,815,816,817]],["grandprixradio.be",[813,814,815,816,817]],["businessclass.com",818],["quantamagazine.org",819],["hellotv.nl",821],["jisc.ac.uk",822],["lasestrellas.tv",823],["xn--digitaler-notenstnder-m2b.com",824],["schoonmaakgroothandelemmen.nl",824],["nanuko.de",824],["hair-body-24.de",824],["shopforyou47.de",824],["kreativverliebt.de",824],["anderweltverlag.com",824],["octavio-shop.com",824],["forcetools-kepmar.eu",824],["fantecshop.de",824],["hexen-werkstatt.shop",824],["shop-naturstrom.de",824],["biona-shop.de",824],["camokoenig.de",824],["bikepro.de",824],["kaffeediscount.com",824],["vamos-skateshop.com",824],["holland-shop.com",824],["avonika.com",824],["royal-oak.org",825],["hurton.pl",826],["officesuite.com",827],["fups.com",[828,830]],["scienceopen.com",831],["moebel-mahler-siebenlehn.de",[832,833]],["calendly.com",834],["batesenvironmental.co.uk",[835,836]],["ubereats.com",837],["101internet.ru",838],["bein.com",839],["beinsports.com",839],["figshare.com",840],["bitso.com",841],["gallmeister.fr",842],["eco-toimistotarvikkeet.fi",843],["proficient.fi",843],["developer.ing.com",844],["webtrack.dhlglobalmail.com",846],["webtrack.dhlecs.com",846],["ehealth.gov.gr",847],["calvinklein.se",[848,849,850]],["calvinklein.fi",[848,849,850]],["calvinklein.sk",[848,849,850]],["calvinklein.si",[848,849,850]],["calvinklein.ch",[848,849,850]],["calvinklein.ru",[848,849,850]],["calvinklein.com",[848,849,850]],["calvinklein.pt",[848,849,850]],["calvinklein.pl",[848,849,850]],["calvinklein.at",[848,849,850]],["calvinklein.nl",[848,849,850]],["calvinklein.hu",[848,849,850]],["calvinklein.lu",[848,849,850]],["calvinklein.lt",[848,849,850]],["calvinklein.lv",[848,849,850]],["calvinklein.it",[848,849,850]],["calvinklein.ie",[848,849,850]],["calvinklein.hr",[848,849,850]],["calvinklein.fr",[848,849,850]],["calvinklein.es",[848,849,850]],["calvinklein.ee",[848,849,850]],["calvinklein.de",[848,849,850]],["calvinklein.dk",[848,849,850]],["calvinklein.cz",[848,849,850]],["calvinklein.bg",[848,849,850]],["calvinklein.be",[848,849,850]],["calvinklein.co.uk",[848,849,850]],["ofdb.de",851],["dtksoft.com",852],["serverstoplist.com",853],["truecaller.com",854],["arturofuente.com",[858,860,861]],["protos.com",[858,860,861]],["timhortons.co.th",[858,859,860,862,864,865]],["toyota.co.uk",[858,859,860,863,864,865]],["businessaccountingbasics.co.uk",[858,859,860,862,864,865]],["flickr.org",[858,859,860,862,864,865]],["espacocasa.com",858],["altraeta.it",858],["centrooceano.it",858],["allstoresdigital.com",858],["cultarm3d.de",858],["soulbounce.com",858],["fluidtopics.com",858],["uvetgbt.com",858],["malcorentacar.com",858],["emondo.de",858],["maspero.it",858],["kelkay.com",858],["underground-england.com",858],["vert.eco",858],["turcolegal.com",858],["magnet4blogging.net",858],["moovly.com",858],["automationafrica.co.za",858],["jornaldoalgarve.pt",858],["keravanenergia.fi",858],["kuopas.fi",858],["frag-machiavelli.de",858],["healthera.co.uk",858],["mobeleader.com",858],["powerup-gaming.com",858],["developer-blog.net",858],["medical.edu.mt",858],["deh.mt",858],["bluebell-railway.com",858],["ribescasals.com",858],["javea.com",858],["chinaimportal.com",858],["inds.co.uk",858],["raoul-follereau.org",858],["serramenti-milano.it",858],["cosasdemujer.com",858],["luz-blanca.info",858],["cosasdeviajes.com",858],["safehaven.io",858],["havocpoint.it",858],["motofocus.pl",858],["nomanssky.com",858],["drei-franken-info.de",858],["clausnehring.com",858],["alttab.net",858],["kinderleicht.berlin",858],["kiakkoradio.fi",858],["cosasdelcaribe.es",858],["de-sjove-jokes.dk",858],["serverprofis.de",858],["biographyonline.net",858],["iziconfort.com",858],["sportinnederland.com",858],["natureatblog.com",858],["wtsenergy.com",858],["cosasdesalud.es",858],["internetpasoapaso.com",858],["zurzeit.at",858],["contaspoupanca.pt",858],["steamdeckhq.com",[858,859,860,862,864,865]],["ipouritinc.com",[858,860,862]],["hemglass.se",[858,860,862,864,865]],["sumsub.com",[858,859,860]],["atman.pl",[858,859,860]],["fabriziovanmarciano.com",[858,859,860]],["nationalrail.com",[858,859,860]],["eett.gr",[858,859,860]],["funkypotato.com",[858,859,860]],["equalexchange.co.uk",[858,859,860]],["swnsdigital.com",[858,859,860]],["gogolf.fi",[858,862]],["hanse-haus-greifswald.de",858],["tampereenratikka.fi",[858,860,866,867]],["kymppikatsastus.fi",[860,864,910,911]],["brasiltec.ind.br",868],["doka.com",[869,870,871]],["abi.de",[872,873]],["studienwahl.de",[872,873]],["journal.hr",[874,875,876,877]],["howstuffworks.com",878],["stickypassword.com",[879,880,881]],["conversion-rate-experts.com",[882,883]],["merkur.si",[884,885,886]],["petitionenligne.com",[887,888]],["petitionenligne.be",[887,888]],["petitionenligne.fr",[887,888]],["petitionenligne.re",[887,888]],["petitionenligne.ch",[887,888]],["skrivunder.net",[887,888]],["petitiononline.uk",[887,888]],["petitions.nz",[887,888]],["petizioni.com",[887,888]],["peticao.online",[887,888]],["skrivunder.com",[887,888]],["peticiones.ar",[887,888]],["petities.com",[887,888]],["petitionen.com",[887,888]],["petice.com",[887,888]],["opprop.net",[887,888]],["peticiok.com",[887,888]],["peticiones.net",[887,888]],["peticion.es",[887,888]],["peticiones.pe",[887,888]],["peticiones.mx",[887,888]],["peticiones.cl",[887,888]],["peticije.online",[887,888]],["peticiones.co",[887,888]],["mediathek.lfv-bayern.de",889],["aluypvc.es",[890,891,892]],["pracuj.pl",[893,894,895,896,897]],["vki.at",899],["konsument.at",899],["chollometro.com",900],["dealabs.com",900],["hotukdeals.com",900],["pepper.it",900],["pepper.pl",900],["preisjaeger.at",900],["mydealz.de",900],["direct.travelinsurance.tescobank.com",[903,904,905,906,907,908,909,910]],["mediaite.com",912],["easyfind.ch",[913,914]],["e-shop.leonidas.com",[915,916]],["lastmile.lt",917],["veriff.com",918],["constantin.film",[919,920,921]],["notion.so",922],["omgevingsloketinzage.omgeving.vlaanderen.be",[923,924]],["primor.eu",925],["tameteo.com",926],["tempo.pt",926],["yourweather.co.uk",926],["meteored.cl",926],["meteored.mx",926],["tempo.com",926],["ilmeteo.net",926],["meteored.com.ar",926],["daswetter.com",926],["myprivacy.dpgmediagroup.net",927],["algarvevacation.net",928],["3sat.de",929],["oxxio.nl",[930,931]],["butterflyshop.dk",[932,933,934]],["praxis.nl",935],["brico.be",935],["kent.gov.uk",[936,937]],["pohjanmaanhyvinvointi.fi",938],["maanmittauslaitos.fi",939]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function setCookie(
    name = '',
    value = '',
    path = ''
) {
    if ( name === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-cookie', name, value, path);

    const validValues = [
        'accept', 'reject',
        'accepted', 'rejected', 'notaccepted',
        'allow', 'deny',
        'allowed', 'disallow',
        'enable', 'disable',
        'enabled', 'disabled',
        'ok',
        'on', 'off',
        'true', 't', 'false', 'f',
        'yes', 'y', 'no', 'n',
        'necessary', 'required',
        'approved', 'disapproved',
        'hide', 'hidden',
        'essential', 'nonessential',
    ];
    const normalized = value.toLowerCase();
    const match = /^("?)(.+)\1$/.exec(normalized);
    const unquoted = match && match[2] || normalized;
    if ( validValues.includes(unquoted) === false ) {
        if ( /^\d+$/.test(unquoted) === false ) { return; }
        const n = parseInt(value, 10);
        if ( n > 32767 ) { return; }
    }

    const done = setCookieFn(
        false,
        name,
        value,
        '',
        path,
        safe.getExtraArgs(Array.from(arguments), 3)
    );

    if ( done ) {
        safe.uboLog(logPrefix, 'Done');
    }
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

function setCookieFn(
    trusted = false,
    name = '',
    value = '',
    expires = '',
    path = '',
    options = {},
) {
    // https://datatracker.ietf.org/doc/html/rfc2616#section-2.2
    // https://github.com/uBlockOrigin/uBlock-issues/issues/2777
    if ( trusted === false && /[^!#$%&'*+\-.0-9A-Z[\]^_`a-z|~]/.test(name) ) {
        name = encodeURIComponent(name);
    }
    // https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.1
    // The characters [",] are given a pass from the RFC requirements because
    // apparently browsers do not follow the RFC to the letter.
    if ( /[^ -:<-[\]-~]/.test(value) ) {
        value = encodeURIComponent(value);
    }

    const cookieBefore = getCookieFn(name);
    if ( cookieBefore !== undefined && options.dontOverwrite ) { return; }
    if ( cookieBefore === value && options.reload ) { return; }

    const cookieParts = [ name, '=', value ];
    if ( expires !== '' ) {
        cookieParts.push('; expires=', expires);
    }

    if ( path === '' ) { path = '/'; }
    else if ( path === 'none' ) { path = ''; }
    if ( path !== '' && path !== '/' ) { return; }
    if ( path === '/' ) {
        cookieParts.push('; path=/');
    }

    if ( trusted ) {
        if ( options.domain ) {
            cookieParts.push(`; domain=${options.domain}`);
        }
        cookieParts.push('; Secure');
    } else if ( /^__(Host|Secure)-/.test(name) ) {
        cookieParts.push('; Secure');
    }

    try {
        document.cookie = cookieParts.join('');
    } catch(_) {
    }

    const done = getCookieFn(name) === value;
    if ( done && options.reload ) {
        window.location.reload();
    }

    return done;
}

function getCookieFn(
    name = ''
) {
    for ( const s of document.cookie.split(/\s*;\s*/) ) {
        const pos = s.indexOf('=');
        if ( pos === -1 ) { continue; }
        if ( s.slice(0, pos) !== name ) { continue; }
        return s.slice(pos+1).trim();
    }
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
    try { setCookie(...argsList[i]); }
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

const targetWorld = 'ISOLATED';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
    return uBOL_setCookie();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_setCookie = cloneInto([
            [ '(', uBOL_setCookie.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_setCookie);
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
    delete page.uBOL_setCookie;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
