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

const argsList = [["__toppy_consent","1"],["_u123_cc","yes"],["ga-disable","true"],["GDPR","9"],["cookie-consent","false"],["cs_viewed_cookie_policy","yes"],["cookies","false"],["cookies_accepted","0"],["cookies_informed","true"],["cookies-agreed","1"],["cookies-analytical","0"],["gls-cookie-policy","accepted"],["localConsent","true"],["pum-13751","true"],["CONSENT","1"],["cm_level","0"],["st-cookie-token","true"],["functionalCookie","true"],["agreed_cookie_policy","1"],["hasMadeConsentSelection","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelection","true","","","domain",".imola.motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".imola.motorsportreg.com"],["gdprPGA","true"],["xn_cookieconsent","false","","reload","1"],["taunton_user_consent_submitted","true"],["taunton_user_consent_advertising","false"],["taunton_user_consent_analytics","false"],["cookie_consent_closed","1"],["__cookie_consent","false"],["dsgvo-stat","yes"],["dsgvo-mark","no"],["cookieSettings","11","","reload","1"],["google-tagmanager","false"],["decline","true","","","reload","1"],["cookieTermsDismissed","true"],["cookieConsentDismissed","true"],["cookienotification","1"],["kraftwerkCookiePolicyState","1"],["privacyPolicyAccept","1","","reload","1"],["CookieConsent","necessary"],["analyticsStatus","false"],["socialMediaStatus","false"],["cookiesAccepted","1"],["airTRFX_cookies","accepted"],["cookie_consent_accept","true"],["agree","true"],["vw_mms_hide_cookie_dialog","1"],["solo_opt_in","false"],["POMELO_COOKIES","1"],["AcceptUseCookie","Accept"],["sbrf.pers_notice","1"],["closedCookieBanner","true"],["yoyocookieconsent_viewed","true"],["privacy_policy_agreement","6","","reload","1"],["kinemaster-cookieconstent","1"],["cookie_acceptance","1"],["jazzfm-privacy","true"],["show_msg_cookies","false"],["CookieConsent","true","","reload","1"],["FunctionalCookie","true"],["AnalyticalCookie","false"],[".YourApp.ConsentCookie","yes","","reload","1"],["gdpr","deny"],["agreesWithCookies","true"],["rm-first-time-modal-welcome","1"],["cookieConsent-2023-03","false"],["CookieDisclaimer","1"],["twtr_pixel_opt_in","N"],["RBCookie-Alert","1"],["CookieConsentV4","false"],["cookieconsent_status","allow"],["cookies_analytics_enabled","0","","reload","1"],["xf_notice_dismiss","1"],["rcl_consent_given","true"],["rcl_preferences_consent","true"],["rcl_marketing_consent","false"],["confirmed-cookies","1","","reload","1"],["cb_validCookies","1"],["cb_accepted","1"],["ws-cookie-Techniques","true"],["cookie-agreed","2"],["cookie_consent","yes"],["cookie_consent_options","3"],["consentIsSetByUser","true","","reload","1"],["isSiteCookieReviewed","0","","reload","1"],["phpbb3_4zn6j_ca","true"],["cookieBar-cookies-accepted","true"],["cookie_consent_user_accepted","true"],["__gitbook_cookie_granted","no"],["user_cookie_consent","false","","reload","1"],["cookies-marketing","N"],["gatsby-gdpr-google-tagmanager","false"],["uuAppCookiesAgreement","true"],["_cookies-consent","yes"],["RCI_APP_LEGAL_DISCLAIMER_COOKIE","false"],["hs_cookieconsent","true"],["cookiergpdjnz","1"],["__radicalMotorsport.ac","true"],["cookies_message_bar_hidden","true"],["acceptsCookies","false"],["accept_cookies","accepted"],["consent_seen","1"],["_gdpr_playbalatro","1"],["consentAll","0"],["cookiewarning","1","","reload","1"],["cookieBarSeen","true"],["cookie_consent_given","true"],["cuvva.app.website.cookie-policy.consent","1"],["custom-cookies-accepted","1","","reload","1"],["AnalyticsAcceptancePopOver","false"],["cookiecookie","1"],["disclaimer-overlay","true"],["complianceCookie","true"],["KeebSupplyCookieConsent","true"],["cookie_policy_agreement","true"],["kt_tcookie","1"],["splash_Page_Accepted","true"],["gdpr-analytics-enabled","false"],["privacy_status","1"],["privacy_settings","1"],["config","1","","reload","1"],["hideCookieNotification","true","","reload","1"],["CookieNotification","1"],["has_accepted_gdpr","1"],["app-cookie-consents","1"],["analitics_cookies","0"],["tachyon-accepted-cookie-notice","true"],["defra-cookie-banner-dismissed","true","","reload","1"],["myAwesomeCookieName3","true"],["cookie-notification","ACCEPTED","","reload","1"],["loader","1"],["enableAnalyticsCookies","denied"],["acknowledgeCookieBanner","true"],["enableTargetingAdvertisingCookies","denied"],["cookiePolicy","1"],["cookie-agreed","0"],["crtmcookiesProtDatos","1","","reload","1"],["NADevGDPRCookieConsent_portal_2","1"],["handledCookieMessage","1"],["targeting","false"],["functionality","false"],["performance","false"],["cookie_info","1","","reload","1"],["bannerDissmissal","true","","reload","1"],["allowCookies","true"],["COOKIE-POLICY-ACCEPT","true"],["gdpr","accept"],["essentialCookie","Y"],["checkCookie","Y"],["analyticsCookie","N"],["marketingCookie","N"],["thirdCookie","N"],["paydirektCookieAllowed","false"],["hdcab","true"],["synapse-cookie-preferences-set","true"],["confirm_cookies","1"],["endgame-accept-policy","true"],["sc-privacy-settings","true"],["accept_cookies2","true","","reload","1"],["cf_consent","false"],["privacyCookie","1","","reload","1"],["cookieChoice","0"],["lgpdConsent","true"],["shareloft_cookie_decision","1"],["privacy_marketing","false"],["privacy_comodidade","false"],["acceptAnalyticsCookies","false"],["acceptFunctionalCookies","true"],["cookiePolicyConfirmed","true","","reload","1"],["PostAnalytics","0"],["gatsby-gdpr","false"],["functionalCookiesAccepted","true"],["necessaryCookies","true"],["comfortCookiesAccepted","false"],["statisticsCookiesAccepted","false"],["gdpr-google-analytics","false"],["cookie_policy","true"],["cookieModalAccept","no"],["AcceptFunctionalCookies","true"],["AcceptAnalyticsCookies","false"],["AcceptNonFunctionalCookies","false"],["forced-cookies-modal","2"],["cookiebar","1"],["cookieconsent_status","true"],["longines-cookiesstatus-analytics","false"],["longines-cookiesstatus-functional","false"],["longines-cookiesstatus-necessary","true"],["longines-cookiesstatus-social","false"],["pz_cookie_consent","true"],["_cb","1","","reload","1"],["consent-status","1"],["HANA-RGPD","accepted"],["cookie-optin","true"],["msg_cookie_CEX","true"],["OptanonAlertBoxClosed","ok"],["OptanonAlertBoxClosed","true"],["cookie-bar","0"],["cookieBannerHidden","true"],["isReadCookiePolicyDNT","true"],["isReadCookiePolicyDNTAa","false"],["coookieaccept","ok"],["consentTrackingVerified","true"],["consent","0"],["allowGetPrivacyInfo","true"],["cookiebanner","0"],["_tv_cookie_consent","y"],["_tv_cookie_choice","1"],["eika_consent_set","true"],["eika_consent_marketing","false"],["ew_cookieconsent","1"],["ew_cookieconsent_optin_b","true"],["ew_cookieconsent_optin_a","true"],["gdpr-agree-cookie","1","","reload","1"],["gdpr-consent-cookie-level3","1"],["gdpr-consent-cookie-level2","1"],["ck-cp","accepted"],["cookieConsent","1"],["consent-cookie","1"],["show_gdpr_cookie_message_388801234_cz","no"],["gsbbanner","0"],["__adblocker","false","","reload","1"],["cookies_marketing_ok","false"],["cookies_ok","true"],["acceptCookies","0"],["marketingCookies","false"],["CookieLaw_statistik 0"],["CookieLaw_komfort","0"],["CookieLaw_personalisierung","0"],["CookieLaw","on"],["wtr_cookie_consent","1"],["wtr_cookies_advertising","0"],["wtr_cookies_functional","0"],["wtr_cookies_analytics","0"],["allowTrackingCookiesKvK","0"],["cookieLevelCodeKVK","1"],["allowAnalyticsCookiesKvK","0"],["macfarlanes-necessary-cookies","accepted"],["TC_PRIVACY_CENTER","0"],["AllowCookies","false","","reload","1"],["consented","false"],["cookie_tou","1","","reload","1"],["blukit_novo","true"],["cr","true"],["gdpr_check_cookie","accepted","","reload","1"],["accept-cookies","accepted"],["dvag_cookies2023","1"],["consent_cookie","1"],["permissionExperience","false"],["permissionPerformance","false"],["permissionMarketing","false"],["consent_analytics","false"],["consent_received","true"],["cookieModal","false"],["user-accepted-AEPD-cookies","1"],["personalization-cookies-consent","0","","reload","1"],["analitics-cookies-consent","0"],["sscm_consent_widget","1"],["texthelp_cookie_consent_in_eu","0"],["texthelp_cookie_consent","yes"],["nc_cookies","accepted"],["nc_analytics","rejected"],["nc_marketing","rejected"],[".AspNet.Consent","yes","","reload","1"],[".AspNet.Consent","no","","reload","1"],["user_gave_consent","1"],["user_gave_consent_new","1"],["rt-cb-approve","true"],["CookieLayerDismissed","true"],["RODOclosed","true"],["cookieDeclined","1"],["cookieModal","true"],["oph-mandatory-cookies-accepted","true"],["cookies-accept","1"],["dw_is_new_consent","true"],["accept_political","1"],["konicaminolta.us","1"],["cookiesAnalyticsApproved","0"],["hasConfiguredCookies","1"],["cookiesPubliApproved","0"],["cookieAuth","1"],["kscookies","true"],["cookie-policy","true"],["cookie-use-accept","false"],["ga-disable-UA-xxxxxxxx-x","true"],["consent","1"],["acceptCookies","1"],["cookie-bar","no"],["CookiesAccepted","no"],["essential","true"],["cookieConfirm","true"],["trackingConfirm","false"],["cookie_consent","false"],["cookie_consent","true"],["gtm-disable-GTM-NLVRXX8","true"],["uce-cookie","N"],["tarteaucitron","false"],["cookiePolicies","true"],["cookie_optin_q","false"],["ce-cookie","N"],["NTCookies","0"],["alertCookie","1","","reload","1"],["gdpr","1"],["hideCookieBanner","true"],["obligatory","true"],["marketing","false"],["analytics","false"],["cookieControl","true"],["plosCookieConsentStatus","false"],["user_accepted_cookies","1"],["analyticsAccepted","false"],["cookieAccepted","true"],["hide-gdpr-bar","true"],["promptCookies","1"],["_cDaB","1"],["_aCan_analytical","0"],["_aGaB","1"],["surbma-gpga","no"],["elrowCookiePolicy","yes"],["ownit_cookie_data_permissions","1"],["Cookies_Preferences","accepted"],["Cookies_Preferences_Analytics","declined"],["privacyPolicyAccepted","true"],["Cookies-Accepted","true"],["cc-accepted","2"],["cc-item-google","false"],["featureConsent","false","","reload","1"],["accept-cookie","no"],["consent","0","","reload","1"],["cookiePrivacyPreferenceBannerProduction","accepted"],["cookiesConsent","false"],["2x1cookies","1"],["firstPartyDataPrefSet","true"],["cookies-required","1","","reload","1"],["kh_cookie_level4","false"],["kh_cookie_level3","false"],["kh_cookie_level1","true"],["cookie_agreement","1","","reload","1"],["MSC_Cookiebanner","false"],["cookieConsent_marketing","false"],["Fitnessing21-15-9","0"],["cookies_popup","yes"],["cookieConsent_required","true","","reload","1"],["sa_enable","off"],["acceptcookietermCookieBanner","true"],["cookie_status","1","","reload","1"],["FTCookieCompliance","1"],["cookiePopupAccepted","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_ADS_OPTOUT","true"],["UBI_PRIVACY_POLICY_ACCEPTED","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["jocookie","false"],["cookieNotification.shown","1"],["localConsent","false"],["oai-allow-ne","false"],["consent","rejected"],["allow-cookie","1"],["cookie-functional","1"],["hulkCookieBarClick","1"],["CookieConsent","1"],["zoommer-cookie_agreed","true"],["accepted_cookie_policy","true"],["gdpr_cookie_token","1"],["_consent_personalization","denied"],["_consent_analytics","denied"],["_consent_marketing","denied"],["cookieWall","1"],["no_cookies","1"],["hidecookiesbanner","1"],["CookienatorConsent","false"],["cookieWallOptIn","0"],["analyticsCookiesAccepted","false"],["cf4212_cn","1"],["mediaCookiesAccepted","false"],["mandatoryCookiesAccepted","true"],["gtag","true"],["BokadirektCookiePreferencesMP","1"],["cookieAcknowledged","true"],["data-privacy-statement","true"],["cookie_privacy_level","required"],["accepted_cookies","true","","reload","1"],["MATOMO_CONSENT_GIVEN","0"],["BABY_MARKETING_COOKIES_CONSENTED","false"],["BABY_PERFORMANCE_COOKIES_CONSENTED","false"],["BABY_NECESSARY_COOKIES_CONSENTED","true"],["consent_essential","allow"],["cookieshown","1"],["warn","true"],["optinCookieSetting","1"],["privacy-shown","true"],["slimstat_optout_tracking","true"],["npp_analytical","0"],["inshopCookiesSet","true"],["adsCookies","false"],["performanceCookies","false"],["sa_demo","false"],["animated_drawings","true"],["cookieStatus","true"],["swgCookie","false"],["cookieConsentPreferencesGranted","1"],["cookieConsentMarketingGranted","0"],["cookieConsentGranted","1"],["cookies-rejected","true"],["NL_COOKIE_KOMFORT","false"],["NL_COOKIE_MEMORY","true","","reload","1"],["NL_COOKIE_STATS","false"],["pws_gdrp_accept","1"],["have18","1"],["pelm_cstate","1"],["pelm_consent","1"],["accept-cookies","true"],["accept-analytical-cookies","false"],["accept-marketing-cookies","false"],["cookie-level-v4","0"],["analytics_consent","yes"],["sei-ccpa-banner","true"],["awx_cookie_consent","true"],["cookie_warning","1"],["allowCookies","0"],["cookiePolicyAccepted","true"],["codecamps.cookiesConsent","true"],["cookiesConsent","true"],["consent_updated","true"],["acsr","1"],["__hs_gpc_banner_dismiss","true"],["cookieyes-necessary","yes"],["cookieyes-other","no"],["cky-action","yes"],["cookieyes-functional","no"],["has-declined-cookies","true","","reload","1"],["has-agreed-to-cookies","false"],["essential","Y"],["analytics","N"],["functional","N"],["gradeproof_shown_cookie_warning","true"],["sber.pers_notice_en","1"],["cookies_consented","yes"],["cookies_consent","true"],["cookies_consent","false"],["anal-opt-in","false"],["accepted","1"],["CB393_DONOTREOPEN","true"],["AYTO_CORUNA_COOKIES","1","","reload","1"],["I6IISCOOKIECONSENT0","n","","reload","1"],["htg_consent","0"],["cookie_oldal","1"],["cookie_marketing","0"],["cookie_jog","1"],["cp_cc_ads","0"],["cp_cc_stats","0"],["cp_cc_required","1"],["ae-cookiebanner","true"],["ae-esential","true"],["ae-statistics","false"],["ccs-supplierconnect","ACCEPTED"],["accepted_cookies","yes"],["note","1"],["cookieConsent","required"],["cookieConsent","accepted"],["pd_cc","1"],["gdpr_ok","necessary"],["allowTracking","false"],["varmafi_mandatory","true"],["VyosCookies","Accepted"],["analyticsConsent","false"],["adsConsent","false"],["te_cookie_ok","1"],["amcookie_policy_restriction","allowed"],["cookieConsent","allowed"],["dw_cookies_accepted","1"],["acceptConverseCookiePolicy","0"],["gdpr-banner","1"],["privacySettings","1"],["are_essential_consents_given","1"],["is_personalized_content_consent_given","1"],["acepta_cookies_funcionales","1"],["acepta_cookies_obligatorias","1"],["acepta_cookies_personalizacion","1"],["cookiepolicyinfo_new","true"],["acceptCookie","true"],["ee-hj","n"],["ee-ca","y","","reload","1"],["ee-yt","y"],["cookie_analytics","false"],["et_cookie_consent","true"],["cookieBasic","true"],["cookieMold","true"],["ytprefs_gdpr_consent","1"],["efile-cookiename-","1"],["plg_system_djcookiemonster_informed","1","","reload","1"],["cvc","true"],["cookieConsent3","true"],["acris_cookie_acc","1","","reload","1"],["termsfeed_pc1_notice_banner_hidden","true"],["cmplz_marketing","allowed"],["cmplz_marketing","allow"],["acknowledged","true"],["ccpaaccept","true"],["gdpr_shield_notice_dismissed","yes"],["luci_gaConsent_95973f7b-6dbc-4dac-a916-ab2cf3b4af11","false"],["luci_CookieConsent","true"],["ng-cc-necessary","1"],["ng-cc-accepted","accepted"],["PrivacyPolicyOptOut","yes"],["consentAnalytics","false"],["consentAdvertising","false"],["consentPersonalization","false"],["privacyExpiration","1"],["cookieconsent_status","deny"],["lr_cookies_tecnicas","accepted"],["cookies_surestao","accepted","","reload","1"],["hide-cookie-banner","1"],["fjallravenCookie","1"],["accept_cookie_policy","true"],["_marketing","0"],["_performance","0"],["RgpdBanner","1"],["seen_cookie_message","accepted"],["complianceCookie","on"],["cookie-consent","1","","reload","1"],["cookie-consent","0"],["ecologi_cookie_consent_20220224","false"],["appBannerPopUpRulesCookie","true"],["eurac_cookie_consent","true"],["akasaairCookie","accepted"],["rittalCC","1"],["ckies_facebook_pixel","deny"],["ckies_google_analytics","deny"],["ckies_youtube","allow"],["ckies_cloudflare","allow"],["ckies_paypal","allow"],["ckies_web_store_state","allow"],["hasPolicy","Y"],["modalPolicyCookieNotAccepted","notaccepted"],["MANA_CONSENT","true"],["_ul_cookie_consent","allow"],["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["trackingCookies","off"],["acceptanalytics","no"],["acceptadvertising","no"],["acceptfunctional","yes"],["consent18","0","","reload","1"],["ATA.gdpr.popup","true"],["AIREUROPA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["privacyNoticeExpireDate","1"],["privacyNoticeAccepted","true"],["policy_accepted","1"],["stampen-cookies-hide-information","yes"],["dominos_cookies_accepted","1"],["deva_accepted","yes"],["cookies_consent","1"],["cookies_modal","true"],["cookie_notice","1"],["cookiesPopup","1"],["digibestCookieInfo","true"],["cookiesettings_status","allow"],["_duet_gdpr_acknowledged","1"],["daimant_collective","accept","","reload","1"],["cookies-notice","1","","reload","1"],["banner","2","","reload","1"],["privacy-policy-2023","accept"],["user_cookie_consent","false"],["cookiePolicy","4"],["standard_gdpr_consent","true"],["cookie_accept","true"],["cookieBanner","true"],["tncookieinfo","1","","reload","1"],["agree_with_cookies","1"],["cookie-accepted","true"],["cookie-accepted","yes"],["consentAll","1"],["hide_cookies_consent","1"],["nicequest_optIn","1"],["shb-consent-cookies","false"],["cookies-accepted","true","","reload","1"],["cpaccepted","true"],["cookieMessageDismissed","1"],["LG_COOKIE_CONSENT","0"],["CookieConsent","true"],["CookieConsent","false"],["gatsby-plugin-google-tagmanager","false"],["wtr_cookies_functional","1"],["cookie-m-personalization","0"],["cookie-m-marketing","0"],["cookie-m-analytics","0"],["cookies","true"],["ctc_rejected","1"],["_cookies_v2","1"],["AcceptedCookieCategories","1"],["cookie_policy_acknowledgement","true"],["allowCookies","yes"],["cookieNotification","true"],["privacy","true"],["euconsent-bypass","1"],["cookie_usage","yes"],["dismissCookieBanner","true"],["switchCookies","1"],["cbChecked","true"],["infoCookieUses","true"],["consent-data-v2","0"],["ACCEPTED_COOKIES","true"],["EMR-CookieConsent-Analytical","0","","reload","1"],["gem_cookies_usage_production","1"],["cookie_level","2"],["toutv_cookies_usage_production","1"],["_evidon_suppress_notification_cookie","1"],["EMR-CookieConsent-Advertising","0"],["acceptCookies","true"],["COOKIES_NEWACCEPTED","1"],["es_cookie_settings_closed","1"],["cookie-banner-acceptance-state","true"],["cookie_consent_seen","1"],["cookies_allowed","yes"],["tracking","0"],["valamis_cookie_message","true","","reload","1"],["valamis_cookie_marketing","false"],["valamis_cookie_analytics","false"],["approvedcookies","no","","reload","1"],["psd-google-ads-enabled","0"],["psd-gtm-activated","1"],["wishlist-enabled","1"],["consentInteract","true"],["cookie-byte-consent-essentials","true"],["cookie-byte-consent-showed","true"],["cookie-byte-consent-statistics","false"],["bm_acknowledge","yes"],["genovaPrivacyOptions","1","","reload","1"],["kali-cc-agreed","true"],["cookiesAccepted","true"],["allowMarketingCookies","false"],["allowAnalyticalCookies","false"],["privacyLevel","2","","reload","1"],["AcceptedCookies","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["privacyLevel","flagmajob_ads_shown","1","","reload","1"],["userCookies","true"],["privacy-policy-accepted","1"],["precmp","1","","reload","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["statistik","0"],["cookies-informer-close","true"],["gdpr","0"],["required","1"],["rodo-reminder-displayed","1"],["rodo-modal-displayed","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["bvkcookie","true"],["cookie-preference","1","","reload","1"],["cookie-preference-v3","1"],["consent","true"],["cookies_accepted","yes"],["cookies_accepted","false"],["CM_BANNER","false"],["set-cookie","cookieAccess","1"],["hife_eu_cookie_consent","1"],["cookie-consent","accepted"],["permission_marketing_cookies","0"],["permission_statistic_cookies","0"],["permission_funktional_cookies","1"],["cookieconsent","1"],["cookieconsent","true"],["cookieconsent","deny"],["epole_cookies_settings","true"],["dopt_consent","false"],["privacy-statement-accepted","true","","reload","1"],["cookie_locales","true"],["ooe_cookie_policy_accepted","no"],["accept_cookie","1"],["cookieconsent_status_new","1"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-accepted","false"],["isReadCookiePolicyDNTAa","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["cookie_accepted","1"],["cookie_accepted","false","","reload","1"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["allow_cookie","false"],["3LM-Cookie","false"],["i_sc_a","false"],["i_cm_a","false"],["i_c_a","true"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["cookieconsent_statistics","no"],["cookieconsent_essential","yes"],["cookie_preference","1"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie-preferences-technical","yes"],["tracking_cookie","1"],["cookie_consent_group_technical","1"],["cookie-preference_renew10","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["cookie_accepted","true"],["hasSeenCookieDisclosure","true"],["RY_COOKIE_CONSENT","true"],["COOKIE_CONSENT","1","","reload","1"],["COOKIE_STATIC","false"],["COOKIE_MARKETING","false"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookie_consent","1"],["ff_cookie_notice","1"],["allris-cookie-msg","1"],["gdpr__google__analytics","false"],["gdpr__facebook__social","false"],["gdpr__depop__functional","true"],["cookie_consent","1","","reload","1"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["cookie-consent","true"],["abz_seo_choosen","1"],["privacyAccepted","true"],["cok","1","","reload","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["CookieConsentV2","YES"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["cookie_consent_user_accepted","false"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Marketing","0"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Analytics","0"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","0"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree_0124","1"],["cookiesPolicy20211101","1"],["sc-cookies-accepted","true"],["marketing_cookie_akkoord","0"],["site_cookie_akkoord","1"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["analytics_cookies","0"],["cookies_accepted","1","","reload","1"],["tracking_cookies","0"],["advertisement-age-show-alcohol","false"],["advertisement-age-show-gamble","false"],["ibe.acceptedCookie","true"],["acceptedPolicy","true"],["cookieConsentClosed","true"],["cookiesPrivacy","false"],["_tvsPrivacy","true"],["epCookieConsent","0","","reload","1"],["royaloakTermsCookie","1"],["is_allowed_client_traking_niezbedne","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["cpaccpted","true"],["AllowCookies","true"],["cookiesAccepted","3"],["optOutsTouched","true"],["optOutAccepted","true"],["gdpr_dismissal","true"],["analyticsCookieAccepted","0"],["cookieAccepted","0"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["use_cookie","1"],["figshareCookiesAccepted","true"],["bitso_cc","1"],["eg_asked","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookie_analytcs","false","","reload","1"],["dhl-webapp-track","allowed"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["ofdb_werbung","Y","","reload","1"],["user_cookie_consent","1"],["STAgreement","1"],["tc:dismissexitintentpopup","true"],["functionalCookies","true"],["contentPersonalisationCookies","false"],["statisticalCookies","false"],["consents","essential"],["viewed_cookie_policy","yes","","reload","1"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["cookielawinfo-checkbox-non-necessary","no"],["cookielawinfo-checkbox-advertisement","no"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-analytics","no"],["cookielawinfo-checkbox-performance","no"],["cookielawinfo-checkbox-markkinointi","no"],["cookielawinfo-checkbox-tilastointi","no"],["cookie_accept","1"],["hide_cookieoverlay_v2","1","","reload","1"],["socialmedia-cookies_allowed_v2","0"],["performance-cookies_allowed_v2","0"],["mrm_gdpr","1"],["necessary_consent","accepted"],["jour_cookies","1"],["jour_functional","true"],["jour_analytics","false"],["jour_marketing","false"],["gdpr_opt_in","1"],["ad_storage","denied"],["stickyCookiesSet","true"],["analytics_storage","denied"],["user_experience_cookie_consent","false"],["marketing_cookie_consent","false"],["cookie_notice_dismissed","yes"],["cookie_analytics_allow","no"],["mer_cc_dim_rem_allow","no"],["num_times_cookie_consent_banner_shown","1"],["cookie_consent_banner_shown_last_time","1"],["privacy_hint","1"],["cookiesConsent","1"],["cookiesStatistics","0"],["cookiesPreferences","0"],["gpc_v","1"],["gpc_ad","0"],["gpc_analytic","0"],["gpc_audience","0"],["gpc_func","0"],["OptanonAlertBoxClosed","1"],["vkicookieconsent","0"],["cookie_policy_agreement","3"],["CA_DT_V2","0","","reload","1"],["CA_DT_V3","0"],["internalCookies","false"],["essentialsCookies","true"],["TESCOBANK_ENSIGHTEN_PRIVACY_Advertising","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Experience","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Measurement","0"],["viewed_cookie_policy","yes"],["cookielawinfo-checkbox-toiminnalliset-evasteet","yes"],["am-sub","1"],["allow-marketing","false"],["allow-analytics","false"],["cc_analytics","0"],["cc_essential","1"],["__consent","%5B%22required%22%5D"],["veriff_cookie_consent_completed","true"],["external-data-googlemaps-is-enabled","true"],["external-data-youtube-is-enabled","true"],["external-data-spotify-is-enabled","true"],["notion_check_cookie_consent","true"],["vl-cookie-consent-cookie-consent","true"],["vl-cookie-consent-functional","true"],["amcookie_allowed","0"],["euconsent-v2-addtl","0"],["dummy","1","","reload","1"],["acepta_cookie","acepta"],["3sat_cmp_configuration","true"],["privacyConsent_version","1","","reload","1"],["privacyConsent","false"],["DDCookiePolicy-consent-functional","false"],["DDCookiePolicy-consent-tracking","false"],["DDCookiePolicy-consent-statistics","false"],["CookieNotificationSeen","1","","reload","1"],["cookie-management-preferences-set","true"],["cookie-management-version","1"],["show-cookie-banner","1"],["mml-cookie-agreed","2"]];

const hostnamesMap = new Map([["toppy.be",0],["uhrzeit123.de",[1,2]],["marinelink.com",3],["thegraph.com",4],["followalice.com",[4,761]],["raspberrypi.dk",5],["ocean.io",6],["waves.is",7],["tesa.com",8],["gls-group.eu",11],["copaamerica.com",12],["cooleygo.com",13],["map.blitzortung.org",14],["northumbriasport.com",15],["clearspend.natwest.com",16],["cellcolabsclinical.com",17],["producthunt.com",18],["motorsportreg.com",[19,20]],["imola.motorsportreg.com",[21,22]],["pga.com",23],["portal.payment.eltax.lta.go.jp",24],["greenbuildingadvisor.com",[25,26,27]],["finewoodworking.com",[25,26,27]],["privatekeys.pw",28],["telli.dpd.ee",29],["youthforum.org",29],["votegroup.de",[30,31]],["pharmahall.gr",32],["x-team.com",33],["reservations.helveticmotion.ch",34],["endclothing.com",[35,36]],["arning-bau.de",37],["kraftwerk.co.at",38],["fhr.biz",39],["srf.nu",40],["jn.fo",[41,42]],["rovia.es",43],["airnewzealand.co.nz",44],["viu.com",45],["dinamalar.com",46],["volkswagen-group.com",47],["solo.io",48],["pomelo.la",49],["ibuypower.com",50],["sberbank.com",[51,436]],["swissmilk.ch",52],["gamemaker.io",53],["pixiv.net",54],["kinemaster.com",55],["sp32bb.pl",56],["jazz.fm",57],["juntadeandalucia.es",58],["melee.gg",[59,60,61]],["chemocare.com",62],["mobiliteit.nl",63],["xledger.net",64],["reviewmeta.com",65],["guide-bordeaux-gironde.com",66],["travelinsured.com",67],["gdpr.twitter.com",68],["mora.hu",69],["confused.com",70],["physikinstrumente.de",71],["karlknauer.de",71],["schoeck.com",71],["resonate.coop",71],["northgatevehiclehire.ie",71],["badhall.at",71],["cic.ch",71],["ilsaggiatore.com",72],["forum.digitalfernsehen.de",73],["bitscrunch.com",[74,75,76]],["hannahgraaf.com",77],["shop.elbers-hof.de",[78,79]],["woolsocks.eu",80],["uza.be",81],["5asec.ch",81],["wizards.com",81],["kitepackaging.co.uk",[82,83]],["parkenflughafen.de",84],["radyofenomen.com",85],["elsate.com",86],["hume.ai",87],["lotusantwerp.wacs.online",88],["gitbook.io",89],["gitbook.com",89],["thehacker.recipes",89],["docs.dyrector.io",89],["makeresearchpay.com",90],["tandartsenpraktijk-simons.tandartsennet.nl",91],["huisartsenpraktijkdoorn.nl",91],["bcorporation.net",92],["knime.com",[92,136]],["quebueno.es",92],["edookit.com",93],["trixonline.be",94],["radio-canada.ca",95],["heysummit.com",96],["puromarketing.com",97],["radicalmotorsport.com",98],["biurobox.pl",99],["cycling74.com",100],["triviacreator.com",101],["freshis.com",101],["anker.com",101],["computacenter.com",102],["playbalatro.com",103],["kastner-oehler.de",104],["kastner-oehler.at",104],["kastner-oehler.ch",104],["twenga.it",105],["twenga.fr",105],["twenga.co.uk",105],["twenga.de",105],["twenga.es",105],["twenga.pl",105],["twenga.nl",105],["twenga.se",105],["olx.kz",106],["efl.com",107],["wst.tv",107],["cuvva.com",108],["vitbikes.de",109],["gourmetfoodstore.com",110],["schulfahrt.de",111],["deutsche-finanzagentur.de",112],["thejazzcafelondon.com",113],["keeb.supply",114],["spb.hh.ru",115],["kaluga.hh.ru",115],["school.hh.ru",115],["rating.hh.ru",115],["novgorod.hh.ru",115],["xxxshemaleporn.com",[116,117]],["gayhits.com",[116,117]],["gaypornvideos.xxx",[116,117]],["sextubespot.com",[116,117]],["wewantjusticedao.org",118],["godbolt.org",119],["projectenglish.com.pl",[120,126]],["ledenicheur.fr",120],["pricespy.co.uk",120],["pricespy.co.nz",120],["sae.fsc.ccoo.es",121],["piusx-college.nl",122],["forgeofempires.com",123],["yoomoney.ru",124],["vod.warszawa.pl",125],["m.twitch.tv",127],["environment.data.gov.uk",128],["playtesting.games",129],["portal.by.aok.de",130],["umlandscout.de",131],["atombank.co.uk",[132,133,134]],["showtv.com.tr",135],["seventhgeneration.com",136],["press.princeton.edu",136],["ldz.lv",136],["crtm.es",137],["airastana.com",138],["vkf-renzel.nl",139],["booking.reederei-zingst.de",[140,141,142]],["booking.weisse-flotte.de",[140,141,142]],["booking2.reederei-hiddensee.de",[140,141,142]],["sanswiss.pl",143],["galaxy.com",144],["petdesk.com",145],["ivyexec.com",146],["railtech.com",147],["lottehotel.com",[148,149,150,151,152]],["paydirekt.de",153],["kijiji.ca",154],["posterstore.fr",155],["posterstore.eu",155],["posterstore.be",155],["posterstore.de",155],["posterstore.hu",155],["posterstore.ie",155],["posterstore.it",155],["posterstore.no",155],["posterstore.nl",155],["posterstore.pl",155],["posterstore.com",155],["posterstore.ae",155],["posterstore.ca",155],["posterstore.nz",155],["posterstore.es",155],["posterstore.kr",155],["posterstore.jp",155],["posterstore.dk",155],["posterstore.se",155],["posterstore.ch",155],["posterstore.at",155],["myriadicity.net",156],["dgsf.org",156],["endgame.id",157],["cashback-cards.ch",158],["swisscard.ch",158],["ahorn24.de",159],["blockdyor.com",160],["ticket.io",161],["omega-nuernberg.servicebund.com",162],["lojaboschferramentas.com.br",[163,165,166]],["shareloft.com",164],["fineartsmuseum.recreatex.be",[167,168,169]],["jaapeden.nl",[167,168,169]],["eboo.lu",170],["lasmallagency.com",171],["lhsystems.com",[172,173,174,175]],["twomates.de",176],["intergiro.com",177],["healthygamer.gg",178],["telepizza.es",[179,180,181]],["telepizza.pt",[179,180,181]],["frisco.pl",182],["tyleenslang.nl",183],["schrikdraad.net",183],["kruiwagen.net",183],["pvcvoordeel.nl",183],["pvcbuis.com",183],["drainagebuizen.nl",183],["likewise.com",184],["longines.com",[185,186,187,188]],["vater-it.de",189],["biano.hu",190],["nadia.gov.gr",191],["hana-book.fr",192],["kzvb.de",193],["correosexpress.com",194],["cexpr.es",194],["rte.ie",195],["smart.com",196],["gry.pl",196],["gamesgames.com",196],["games.co.uk",196],["jetztspielen.de",196],["ourgames.ru",196],["permainan.co.id",196],["gioco.it",196],["jeux.fr",196],["juegos.com",196],["ojogos.com.br",196],["oyunskor.com",196],["spela.se",196],["spelletjes.nl",196],["agame.com",196],["spielen.com",196],["flashgames.ru",196],["games.co.id",196],["giochi.it",196],["jeu.fr",196],["spel.nl",196],["sartor-stoffe.de",197],["rockpoint.cz",197],["rockpoint.sk",197],["parfum-zentrum.de",197],["candy-store.cz",197],["tridge.com",198],["asus.com",[199,200]],["drinksking.sk",201],["neuhauschocolates.com",202],["commandsuite.it",203],["oktea.tw",204],["bafin.de",205],["materna.de",205],["bamf.de",205],["tenvinilo-argentina.com",[206,207]],["eikaforsikring.no",[208,209]],["eurowings.com",[210,211,212]],["newpharma.be",[213,214,215]],["newpharma.fr",[213,214,215]],["newpharma.de",[213,214,215]],["newpharma.at",[213,214,215]],["newpharma.nl",[213,214,215]],["kapoorwatch.com",216],["instantoffices.com",217],["paf.se",217],["citibank.pl",217],["citibankonline.pl",217],["azertyfactor.be",218],["zelezodum.cz",219],["thw.de",220],["bafa.de",220],["bka.de",220],["bmbf.de",220],["weather.com",221],["bolist.se",[222,223]],["project529.com",223],["evivanlanschot.nl",224],["prenatal.nl",225],["onnibus.com",[225,863,864,865]],["kyoceradocumentsolutions.us",[225,912,913]],["kyoceradocumentsolutions.ch",[225,912,913]],["kyoceradocumentsolutions.co.uk",[225,912,913]],["kyoceradocumentsolutions.de",[225,912,913]],["kyoceradocumentsolutions.es",[225,912,913]],["kyoceradocumentsolutions.eu",[225,912,913]],["kyoceradocumentsolutions.fr",[225,912,913]],["kyoceradocumentsolutions.it",[225,912,913]],["kyoceradocumentsolutions.ru",[225,912,913]],["kyoceradocumentsolutions.mx",[225,912,913]],["kyoceradocumentsolutions.cl",[225,912,913]],["kyoceradocumentsolutions.com.br",[225,912,913]],["wagner-tuning.com",[226,227,228,229]],["waitrosecellar.com",[230,231,232,233]],["waitrose.com",[230,584]],["kvk.nl",[234,235,236]],["macfarlanes.com",237],["pole-emploi.fr",238],["gardenmediaguild.co.uk",239],["samplerite.com",240],["samplerite.cn",240],["sororedit.com",241],["blukit.com.br",242],["biegnaszczyt.pl",243],["staff-gallery.com",244],["itv.com",245],["dvag.de",246],["premierinn.com",[247,248,249,250]],["whitbreadinns.co.uk",[247,248,249,250]],["barandblock.co.uk",[247,248,249,250]],["tabletable.co.uk",[247,248,249,250]],["brewersfayre.co.uk",[247,248,249,250]],["beefeater.co.uk",[247,248,249,250]],["allstarssportsbars.co.uk",[251,252]],["babiesrus.ca",253],["toysrus.ca",253],["roomsandspaces.ca",253],["athletic-club.eus",[254,255,256]],["wattoo.dk",257],["wattoo.no",257],["texthelp.com",[258,259]],["courierexchange.co.uk",[260,261,262]],["haulageexchange.co.uk",[260,261,262]],["ecaytrade.com",263],["powerball.com",264],["tlaciarik.sk",264],["tiskarik.cz",264],["sseriga.edu",[265,266]],["rt.com",267],["swrng.de",268],["crfop.gdos.gov.pl",269],["nurgutes.de",270],["kpcen-torun.edu.pl",271],["opintopolku.fi",272],["app.erevie.pl",273],["debenhams.com",274],["archiwumalle.pl",275],["konicaminolta.ca",276],["konicaminolta.us",276],["deutschebank-dbdirect.com",[277,278,279]],["dbonline.deutsche-bank.es",[277,278,279]],["deutsche-bank.es",[277,278,279]],["hipotecaonline.db.com",280],["kangasalansanomat.fi",281],["eif.org",282],["tunnelmb.net",282],["sugi-net.jp",283],["understandingsociety.ac.uk",284],["leibniz.com",285],["horecaworld.biz",[285,553]],["horecaworld.be",[285,553]],["bettertires.com",285],["electroprecio.com",285],["autohero.com",285],["computerbase.de",[285,907]],["sistemacomponentes.com.br",286],["bargaintown.ie",287],["tui.nl",288],["doppelmayr.com",289],["case-score.com",[290,291]],["cote.co.uk",292],["finimize.com",292],["k-einbruch.de",[293,294]],["blxxded.com",293],["rtu.lv",295],["sysdream.com",296],["cinemarkca.com",297],["neander-zahn.de",298],["theadelphileeds.co.uk",299],["tobycarvery.co.uk",299],["carsupermarket.com",299],["viajesatodotren.com",300],["ticketingcine.fr",301],["agenziavista.it",302],["e-chladiva.cz",302],["bitecode.dev",303],["mjob.si",[304,305,306]],["airportrentacar.gr",307],["mobile-fueling.de",307],["plos.org",308],["autohaus24.de",309],["sixt-neuwagen.de",309],["gadis.es",[310,311]],["dom.ru",311],["ford-kimmerle-reutlingen.de",312],["autohaus-reitermayer.de",312],["autohaus-diefenbach-waldbrunn.de",312],["autohaus-diefenbach.de",312],["autohaus-musberg.de",312],["ford-ah-im-hunsrueck-simmern.de",312],["ford-arndt-goerlitz.de",312],["ford-autogalerie-alfeld.de",312],["ford-bacher-schrobenhausen.de",312],["ford-bathauer-bad-harzburg.de",312],["ford-behrend-waren.de",312],["ford-bergland-frankfurt-oder.de",312],["ford-bergland-wipperfuerth.de",312],["ford-besico-glauchau.de",312],["ford-besico-nuernberg.de",312],["ford-bischoff-neumuenster.de",312],["ford-bodach-borgentreich.de",312],["ford-bunk-saarbruecken.de",312],["ford-bunk-voelklingen.de",312],["ford-busch-kirchberg.de",312],["ford-diermeier-muenchen.de",312],["ford-dinnebier-leipzig.de",312],["ford-duennes-regensburg.de",312],["ford-fischer-bochum.de",312],["ford-fischer-muenster.de",312],["ford-foerster-koblenz.de",312],["ford-fuchs-uffenheim.de",312],["ford-geberzahn-koeln.de",312],["ford-gerstmann-duesseldorf.de",312],["ford-haefner-und-strunk-kassel.de",312],["ford-hartmann-kempten.de",312],["ford-hartmann-rastatt.de",312],["ford-hatzner-karlsruhe.de",312],["ford-heine-hoexter.de",312],["ford-hentschel-hildesheim.de",312],["ford-hessengarage-dreieich.de",312],["ford-hessengarage-frankfurt.de",312],["ford-hga-windeck.de",312],["ford-hommert-coburg.de",312],["ford-horstmann-rastede.de",312],["ford-janssen-sonsbeck.de",312],["ford-jochem-stingbert.de",312],["ford-jungmann-wuppertal.de",312],["ford-kestel-marktzeuln.de",312],["ford-klaiber-bad-friedrichshall.de",312],["ford-koenig-eschwege.de",312],["ford-kohlhoff-mannheim.de",312],["ford-kt-automobile-coesfeld.de",312],["ford-lackermann-wesel.de",312],["ford-ludewig-delligsen.de",312],["ford-maiwald-linsengericht.de",312],["ford-mertens-beckum.de",312],["ford-meyer-bad-oeynhausen.de",312],["ford-mgs-bayreuth.de",312],["ford-mgs-radebeul.de",312],["ford-muecke-berlin.de",312],["ford-norren-weissenthurm.de",312],["ford-nrw-garage-duesseldorf.de",312],["ford-nrw-garage-handweiser.de",312],["ford-nuding-remshalden.de",312],["ford-ohm-rendsburg.de",312],["ford-reinicke-muecheln.de",312],["ford-rennig.de",312],["ford-roerentrop-luenen.de",312],["ford-schankola-dudweiler.de",312],["ford-sg-goeppingen.de",312],["ford-sg-leonberg.de",312],["ford-sg-neu-ulm.de",312],["ford-sg-pforzheim.de",312],["ford-sg-waiblingen.de",312],["ford-storz-st-georgen.de",312],["ford-strunk-koeln.de",312],["ford-tobaben-hamburg.de",312],["ford-toenjes-zetel.de",312],["ford-wagner-mayen.de",312],["ford-wahl-fritzlar.de",312],["ford-wahl-siegen.de",312],["ford-weege-bad-salzuflen.de",312],["ford-westhoff-hamm.de",312],["ford-wieland-hasbergen.de",312],["renault-autocenterprignitz-pritzwalk.de",312],["renault-spenrath-juelich.de",312],["vitalllit.com",313],["fincaparera.com",313],["dbnetbcn.com",313],["viba.barcelona",313],["anafaustinoatelier.com",313],["lamparasherrero.com",313],["calteixidor.cat",313],["argentos.barcelona",313],["anmarlube.com",313],["anynouxines.barcelona",313],["crearunapaginaweb.cat",313],["cualesmiip.com",313],["porndoe.com",[314,315,316]],["thinkingaustralia.com",317],["elrow.com",318],["ownit.se",319],["velo-antwerpen.be",[320,321]],["wwnorton.com",322],["pc-canada.com",323],["mullgs.se",324],["1a-sehen.de",325],["feature.fm",326],["comte.com",327],["baltic-watches.com",328],["np-brijuni.hr",328],["vilgain.com",328],["tradingview.com",329],["wevolver.com",330],["experienciasfree.com",331],["freemans.com",332],["kivikangas.fi",333],["lumingerie.com",333],["melkkobrew.fi",333],["kh.hu",[334,335,336]],["aplgo.com",337],["securityconference.org",338],["aha.or.at",[339,342]],["fantasyfitnessing.com",340],["chocolateemporium.com",341],["account.samsung.com",343],["crushwineco.com",344],["levi.pt",345],["fertagus.pt",346],["smiggle.co.uk",347],["ubisoft.com",[348,349,350,351]],["store.ubisoft.com",[348,351,790,791]],["thulb.uni-jena.de",352],["splityourticket.co.uk",353],["eramba.org",354],["openai.com",[355,356]],["kupbilecik.com",[357,358]],["kupbilecik.de",[357,358]],["kupbilecik.pl",[357,358]],["shopilya.com",359],["arera.it",360],["haustier-berater.de",360],["hfm-frankfurt.de",360],["zoommer.ge",361],["studentapan.se",362],["petcity.lt",[363,364,365,366]],["tobroco.com",[367,371]],["tobroco.nl",[367,371]],["tobroco-giant.com",[367,371]],["geosfreiberg.de",[368,369]],["eapvic.org",370],["bassolsenergia.com",370],["bammusic.com",[372,374,375]],["green-24.de",373],["phish-test.de",376],["bokadirekt.se",377],["ford.lt",378],["ford.pt",378],["ford.fr",378],["ford.de",378],["ford.dk",378],["ford.pl",378],["ford.se",378],["ford.nl",378],["ford.no",378],["ford.fi",378],["ford.gr",378],["ford.it",378],["data-media.gr",379],["e-food.gr",[380,381]],["bvmed.de",382],["babyshop.com",[383,384,385]],["griffbereit24.de",386],["checkwx.com",387],["calendardate.com",388],["wefashion.ch",389],["wefashion.fr",389],["wefashion.lu",389],["wefashion.be",389],["wefashion.de",389],["wefashion.nl",389],["brettspiel-angebote.de",[390,391]],["nio.com",392],["kancelarskepotreby.net",[393,394,395]],["segment-anything.com",396],["sketch.metademolab.com",397],["cambridgebs.co.uk",398],["freizeitbad-greifswald.de",399],["giuseppezanotti.com",[400,401,402]],["xcen.se",402],["biggreenegg.co.uk",403],["skihuette-oberbeuren.de",[404,405,406]],["pwsweather.com",407],["xfree.com",408],["theweathernetwork.com",[409,410]],["monese.com",[411,412,413]],["assos.com",411],["helmut-fischer.com",414],["myscience.org",415],["7-eleven.com",416],["airwallex.com",417],["streema.com",418],["gov.lv",419],["tise.com",420],["codecamps.com",421],["avell.com.br",422],["moneyfarm.com",423],["app.moneyfarm.com",423],["simpl.rent",424],["hubspot.com",425],["prodyna.com",[426,427,428,429]],["zutobi.com",[426,427,428,429]],["calm.com",[430,431]],["pubgesports.com",[432,433,434]],["outwrite.com",435],["sbermarket.ru",437],["atani.com",[438,439,440]],["croisieresendirect.com",441],["bgextras.co.uk",442],["sede.coruna.gal",443],["czech-server.cz",444],["hitech-gamer.com",445],["bialettikave.hu",[446,447,448]],["canalplus.com",[449,450,451]],["mader.bz.it",[452,453,454]],["supply.amazon.co.uk",455],["bhaptics.com",456],["cleverbot.com",457],["watchaut.film",458],["tuffaloy.com",459],["fanvue.com",459],["electronoobs.com",460],["xn--lkylen-vxa.se",461],["tiefenthaler-landtechnik.at",462],["tiefenthaler-landtechnik.ch",462],["tiefenthaler-landtechnik.de",462],["varma.fi",463],["vyos.io",464],["digimobil.es",[465,466]],["teenage.engineering",467],["merrell.pl",[468,731]],["converse.pl",468],["shop.wf-education.com",[468,731]],["werkenbijaswatson.nl",469],["converse.com",[470,471]],["buyandapply.nexus.org.uk",472],["img.ly",473],["halonen.fi",[473,505,506,507,508]],["carlson.fi",[473,505,506,507,508]],["cams.ashemaletube.com",[474,475]],["electronicacerler.com",[476,477,478]],["okpoznan.pl",[479,484]],["ielts.idp.com",480],["ielts.co.nz",480],["ielts.com.au",480],["einfach-einreichen.de",[481,482,483]],["endlesstools.io",485],["mbhszepkartya.hu",486],["casellimoveis.com.br",487],["embedplus.com",488],["e-file.pl",489],["sp215.info",490],["empik.com",491],["senda.pl",492],["befestigungsfuchs.de",493],["cut-tec.co.uk",494],["gaytimes.co.uk",495],["statisticsanddata.org",496],["hello.one",497],["paychex.com",498],["wildcat-koeln.de",499],["libraries.merton.gov.uk",[500,501]],["tommy.hr",[502,503]],["usit.uio.no",504],["demo-digital-twin.r-stahl.com",509],["la31devalladolid.com",[510,511]],["mx.com",512],["foxtrail.fjallraven.com",513],["dotwatcher.cc",514],["bazarchic.com",[515,516,517]],["seedrs.com",518],["mypensiontracker.co.uk",519],["praxisplan.at",[519,540]],["esimplus.me",520],["cineplanet.com.pe",521],["ecologi.com",522],["wamba.com",523],["eurac.edu",524],["akasaair.com",525],["rittal.com",526],["worstbassist.com",[527,528,529,530,531,532]],["zs-watch.com",533],["crown.com",534],["mesanalyses.fr",535],["teket.jp",536],["fish.shimano.com",[537,538,539]],["simsherpa.com",[541,542,543]],["translit.ru",544],["aruba.com",545],["aireuropa.com",546],["skfbearingselect.com",[547,548]],["scanrenovation.com",549],["ttela.se",550],["dominospizza.pl",551],["devagroup.pl",552],["secondsol.com",553],["angelifybeauty.com",554],["cotopaxi.com",555],["justjoin.it",556],["digibest.pt",557],["two-notes.com",558],["theverge.com",559],["daimant.co",560],["secularism.org.uk",561],["karriere-hamburg.de",562],["musicmap.info",563],["gasspisen.se",564],["medtube.pl",565],["medtube.es",565],["medtube.fr",565],["medtube.net",565],["standard.sk",566],["linmot.com",567],["larian.com",[567,853]],["s-court.me",567],["containerandpackaging.com",568],["top-yp.de",569],["termania.net",570],["account.nowpayments.io",571],["fizjobaza.pl",572],["gigasport.at",573],["gigasport.de",573],["gigasport.ch",573],["velleahome.gr",574],["nicequest.com",575],["handelsbanken.no",576],["handelsbanken.com",576],["handelsbanken.co.uk",576],["handelsbanken.se",[576,657]],["handelsbanken.dk",576],["handelsbanken.fi",576],["ilarahealth.com",577],["songtradr.com",[578,837]],["logo.pt",[579,580]],["flexwhere.co.uk",[581,583]],["flexwhere.de",[581,583]],["pricewise.nl",581],["getunleash.io",581],["dentmania.de",581],["free.navalny.com",581],["latoken.com",581],["empathy.com",582],["labs.epi2me.io",582],["campusbrno.cz",[585,586,587]],["secrid.com",588],["etsy.com",589],["careers.cloud.com",589],["blablacar.rs",590],["blablacar.ru",590],["blablacar.com.tr",590],["blablacar.com.ua",590],["blablacar.com.br",590],["seb.se",591],["sebgroup.com",591],["deps.dev",592],["buf.build",593],["starofservice.com",594],["ytcomment.kmcat.uk",595],["gmx.com",596],["gmx.fr",596],["karofilm.ru",597],["octopusenergy.it",598],["octopusenergy.es",[598,599]],["justanswer.es",600],["justanswer.de",600],["justanswer.com",600],["justanswer.co.uk",600],["citilink.ru",601],["huutokaupat.com",602],["kaggle.com",603],["emr.ch",[604,609]],["gem.cbc.ca",605],["pumatools.hu",606],["ici.tou.tv",607],["crunchyroll.com",608],["mayflex.com",610],["clipchamp.com",610],["trouwenbijfletcher.nl",610],["fletcher.nl",610],["fletcherzakelijk.nl",610],["intermatic.com",610],["ebikelohr.de",611],["eurosender.com",612],["melectronics.ch",613],["guard.io",614],["nokportalen.se",615],["dokiliko.com",616],["valamis.com",[617,618,619]],["sverigesingenjorer.se",620],["shop.almawin.de",[621,622,623,660]],["zeitzurtrauer.de",624],["skaling.de",[625,626,627]],["bringmeister.de",628],["gdx.net",629],["clearblue.com",630],["drewag.de",[631,632,633]],["enso.de",[631,632,633]],["buidlbox.io",631],["helitransair.com",634],["more.com",635],["nwslsoccer.com",635],["climatecentral.org",636],["resolution.de",637],["flagma.by",638],["eatsalad.com",639],["pacstall.dev",640],["web2.0calc.fr",641],["de-appletradein.likewize.com",642],["swissborg.com",643],["qwice.com",644],["canalpluskuchnia.pl",[645,646]],["uizard.io",647],["stmas.bayern.de",[648,651]],["novayagazeta.eu",649],["kinopoisk.ru",650],["yandex.ru",650],["go.netia.pl",[652,653]],["polsatboxgo.pl",[652,653]],["ing.it",[654,655]],["ing.nl",656],["youcom.com.br",658],["rule34.paheal.net",659],["deep-shine.de",660],["shop.ac-zaun-center.de",660],["kellermann-online.com",660],["kletterkogel.de",660],["pnel.de",660],["korodrogerie.de",660],["der-puten-shop.de",660],["katapult-shop.de",660],["evocsports.com",660],["esm-computer.de",660],["calmwaters.de",660],["mellerud.de",660],["akustik-projekt.at",660],["vansprint.de",660],["0815.at",660],["0815.eu",660],["ojskate.com",660],["der-schweighofer.de",660],["tz-bedarf.de",660],["zeinpharma.de",660],["weicon.com",660],["dagvandewebshop.be",660],["thiele-tee.de",660],["carbox.de",660],["riapsport.de",660],["trendpet.de",660],["eheizung24.de",660],["seemueller.com",660],["vivande.de",660],["heidegrill.com",660],["gladiator-fightwear.com",660],["h-andreas.com",660],["pp-parts.com",660],["natuerlich-holzschuhe.de",660],["massivart.de",660],["malermeister-shop.de",660],["imping-confiserie.de",660],["lenox-trading.at",660],["cklenk.de",660],["catolet.de",660],["drinkitnow.de",660],["patisserie-m.de",660],["storm-proof.com",660],["balance-fahrradladen.de",660],["magicpos.shop",660],["zeinpharma.com",660],["sps-handel.net",660],["novagenics.com",660],["butterfly-circus.de",660],["holzhof24.de",660],["w6-wertarbeit.de",660],["fleurop.de",660],["leki.com",660],["extremeaudio.de",660],["taste-market.de",660],["delker-optik.de",660],["stuhl24-shop.de",660],["g-nestle.de",660],["alpine-hygiene.ch",660],["fluidmaster.it",660],["cordon.de",660],["belisse-beauty.de",660],["belisse-beauty.co.uk",660],["wpc-shop24.de",660],["liv.si",660],["maybach-luxury.com",660],["leiternprofi24.de",660],["hela-shop.eu",660],["hitado.de",660],["j-koenig.de",660],["armedangels.com",[660,738,739]],["bvk-beamtenversorgung.de",661],["hofer-kerzen.at",662],["karls-shop.de",663],["luvly.care",664],["firmen.wko.at",664],["byggern.no",665],["donauauen.at",666],["woltair.cz",667],["rostics.ru",668],["hife.es",669],["lilcat.com",670],["hot.si",[671,672,673,674]],["crenolibre.fr",675],["monarchmoney.com",676],["e-pole.pl",677],["dopt.com",678],["keb-automation.com",679],["bonduelle.ru",680],["oxfordonlineenglish.com",681],["pccomponentes.fr",682],["pccomponentes.com",682],["pccomponentes.pt",682],["grants.at",683],["africa-uninet.at",683],["rqb.at",683],["youngscience.at",683],["oead.at",683],["innovationsstiftung-bildung.at",683],["etwinning.at",683],["arqa-vet.at",683],["zentrumfuercitizenscience.at",683],["vorstudienlehrgang.at",683],["erasmusplus.at",683],["jeger.pl",684],["bo.de",685],["thegamingwatcher.com",686],["norlysplay.dk",687],["plusujemy.pl",688],["asus.com.cn",[689,691]],["zentalk.asus.com",[689,691]],["mubi.com",690],["59northwheels.se",692],["photospecialist.co.uk",693],["foto-gregor.de",693],["kamera-express.de",693],["kamera-express.be",693],["kamera-express.nl",693],["kamera-express.fr",693],["kamera-express.lu",693],["dhbbank.com",694],["dhbbank.de",694],["dhbbank.be",694],["dhbbank.nl",694],["login.ingbank.pl",695],["fabrykacukiernika.pl",[696,697]],["peaks.com",698],["3landesmuseen-braunschweig.de",699],["unifachbuch.de",[700,701,702]],["playlumi.com",[703,704,705]],["chatfuel.com",706],["studio3t.com",[707,708,709,710]],["realgap.co.uk",[711,712,713,714]],["hotelborgia.com",[715,716]],["sweet24.de",717],["zwembaddekouter.be",718],["flixclassic.pl",719],["jobtoday.com",720],["deltatre.com",[721,722,736]],["withings.com",[723,724,725]],["blista.de",[726,727]],["hashop.nl",728],["gift.be",[729,730]],["elevator.de",731],["foryouehealth.de",731],["animaze.us",731],["penn-elcom.com",731],["curantus.de",731],["mtbmarket.de",731],["spanienweinonline.ch",731],["novap.fr",731],["bizkaia.eus",[732,733,734]],["sinparty.com",735],["mantel.com",737],["e-dojus.lv",740],["burnesspaull.com",741],["oncosur.org",742],["photobooth.online",743],["epidemicsound.com",744],["ryanair.com",745],["refurbished.at",[746,747,748]],["refurbished.nl",[746,747,748]],["refurbished.be",[746,747,748]],["refurbishedstore.de",[746,747,748]],["bayernportal.de",[749,750,751]],["ayudatpymes.com",752],["zipjob.com",752],["shoutcast.com",752],["plastischechirurgie-muenchen.info",753],["bonn.sitzung-online.de",754],["depop.com",[755,756,757]],["thenounproject.com",758],["pricehubble.com",759],["ilmotorsport.de",760],["karate.com",761],["psbank.ru",761],["myriad.social",761],["exeedme.com",761],["aqua-store.fr",762],["voila.ca",763],["anastore.com",764],["app.arzt-direkt.de",765],["dasfutterhaus.at",766],["e-pity.pl",767],["fillup.pl",768],["dailymotion.com",769],["barcawelt.de",770],["lueneburger-heide.de",771],["polizei.bayern.de",[772,774]],["ourworldofpixels.com",773],["jku.at",775],["matkahuolto.fi",776],["backmarket.de",[777,778,779]],["backmarket.co.uk",[777,778,779]],["backmarket.es",[777,778,779]],["backmarket.be",[777,778,779]],["backmarket.at",[777,778,779]],["backmarket.fr",[777,778,779]],["backmarket.gr",[777,778,779]],["backmarket.fi",[777,778,779]],["backmarket.ie",[777,778,779]],["backmarket.it",[777,778,779]],["backmarket.nl",[777,778,779]],["backmarket.pt",[777,778,779]],["backmarket.se",[777,778,779]],["backmarket.sk",[777,778,779]],["backmarket.com",[777,778,779]],["eleven-sportswear.cz",[780,781,782]],["silvini.com",[780,781,782]],["silvini.de",[780,781,782]],["purefiji.cz",[780,781,782]],["voda-zdarma.cz",[780,781,782]],["lesgarconsfaciles.com",[780,781,782]],["ulevapronohy.cz",[780,781,782]],["vitalvibe.eu",[780,781,782]],["plavte.cz",[780,781,782]],["mo-tools.cz",[780,781,782]],["flamantonlineshop.cz",[780,781,782]],["sandratex.cz",[780,781,782]],["norwayshop.cz",[780,781,782]],["3d-foto.cz",[780,781,782]],["neviditelnepradlo.cz",[780,781,782]],["nutrimedium.com",[780,781,782]],["silvini.cz",[780,781,782]],["karel.cz",[780,781,782]],["silvini.sk",[780,781,782]],["book-n-drive.de",783],["cotswoldoutdoor.com",784],["cotswoldoutdoor.ie",784],["cam.start.canon",785],["usnews.com",786],["researchaffiliates.com",787],["singkinderlieder.de",788],["stiegeler.com",789],["ba.com",[792,793,794,795,796,797,798]],["britishairways.com",[792,793,794,795,796,797,798]],["cineman.pl",[799,800,801]],["tv-trwam.pl",[799,800,801,802]],["qatarairways.com",[803,804,805,806,807]],["wedding.pl",808],["vivaldi.com",809],["emuia1.gugik.gov.pl",810],["nike.com",811],["adidas.at",812],["adidas.be",812],["adidas.ca",812],["adidas.ch",812],["adidas.cl",812],["adidas.co",812],["adidas.co.in",812],["adidas.co.kr",812],["adidas.co.nz",812],["adidas.co.th",812],["adidas.co.uk",812],["adidas.com",812],["adidas.com.ar",812],["adidas.com.au",812],["adidas.com.br",812],["adidas.com.my",812],["adidas.com.ph",812],["adidas.com.vn",812],["adidas.cz",812],["adidas.de",812],["adidas.dk",812],["adidas.es",812],["adidas.fi",812],["adidas.fr",812],["adidas.gr",812],["adidas.ie",812],["adidas.it",812],["adidas.mx",812],["adidas.nl",812],["adidas.no",812],["adidas.pe",812],["adidas.pl",812],["adidas.pt",812],["adidas.ru",812],["adidas.se",812],["adidas.sk",812],["colourbox.com",813],["ebilet.pl",814],["myeventeo.com",815],["snap.com",816],["louwman.nl",[817,818]],["ratemyprofessors.com",819],["filen.io",820],["leotrippi.com",821],["restaurantclub.pl",821],["context.news",821],["queisser.de",821],["grandprixradio.dk",[822,823,824,825,826]],["grandprixradio.nl",[822,823,824,825,826]],["grandprixradio.be",[822,823,824,825,826]],["businessclass.com",827],["quantamagazine.org",828],["hellotv.nl",829],["jisc.ac.uk",830],["lasestrellas.tv",831],["xn--digitaler-notenstnder-m2b.com",832],["schoonmaakgroothandelemmen.nl",832],["nanuko.de",832],["hair-body-24.de",832],["shopforyou47.de",832],["kreativverliebt.de",832],["anderweltverlag.com",832],["octavio-shop.com",832],["forcetools-kepmar.eu",832],["fantecshop.de",832],["hexen-werkstatt.shop",832],["shop-naturstrom.de",832],["biona-shop.de",832],["camokoenig.de",832],["bikepro.de",832],["kaffeediscount.com",832],["vamos-skateshop.com",832],["holland-shop.com",832],["avonika.com",832],["royal-oak.org",833],["hurton.pl",834],["officesuite.com",835],["fups.com",[836,838]],["scienceopen.com",839],["moebel-mahler-siebenlehn.de",[840,841]],["calendly.com",842],["batesenvironmental.co.uk",[843,844]],["ubereats.com",845],["101internet.ru",846],["bein.com",847],["beinsports.com",847],["figshare.com",848],["bitso.com",849],["gallmeister.fr",850],["eco-toimistotarvikkeet.fi",851],["proficient.fi",851],["developer.ing.com",852],["webtrack.dhlglobalmail.com",854],["webtrack.dhlecs.com",854],["ehealth.gov.gr",855],["calvinklein.se",[856,857,858]],["calvinklein.fi",[856,857,858]],["calvinklein.sk",[856,857,858]],["calvinklein.si",[856,857,858]],["calvinklein.ch",[856,857,858]],["calvinklein.ru",[856,857,858]],["calvinklein.com",[856,857,858]],["calvinklein.pt",[856,857,858]],["calvinklein.pl",[856,857,858]],["calvinklein.at",[856,857,858]],["calvinklein.nl",[856,857,858]],["calvinklein.hu",[856,857,858]],["calvinklein.lu",[856,857,858]],["calvinklein.lt",[856,857,858]],["calvinklein.lv",[856,857,858]],["calvinklein.it",[856,857,858]],["calvinklein.ie",[856,857,858]],["calvinklein.hr",[856,857,858]],["calvinklein.fr",[856,857,858]],["calvinklein.es",[856,857,858]],["calvinklein.ee",[856,857,858]],["calvinklein.de",[856,857,858]],["calvinklein.dk",[856,857,858]],["calvinklein.cz",[856,857,858]],["calvinklein.bg",[856,857,858]],["calvinklein.be",[856,857,858]],["calvinklein.co.uk",[856,857,858]],["ofdb.de",859],["dtksoft.com",860],["serverstoplist.com",861],["truecaller.com",862],["fruugo.fi",866],["worldcupchampionships.com",867],["arturofuente.com",[867,869,870]],["protos.com",[867,869,870]],["timhortons.co.th",[867,868,869,871,873,874]],["toyota.co.uk",[867,868,869,872,873,874]],["businessaccountingbasics.co.uk",[867,868,869,871,873,874]],["flickr.org",[867,868,869,871,873,874]],["espacocasa.com",867],["altraeta.it",867],["centrooceano.it",867],["allstoresdigital.com",867],["cultarm3d.de",867],["soulbounce.com",867],["fluidtopics.com",867],["uvetgbt.com",867],["malcorentacar.com",867],["emondo.de",867],["maspero.it",867],["kelkay.com",867],["underground-england.com",867],["vert.eco",867],["turcolegal.com",867],["magnet4blogging.net",867],["moovly.com",867],["automationafrica.co.za",867],["jornaldoalgarve.pt",867],["keravanenergia.fi",867],["kuopas.fi",867],["frag-machiavelli.de",867],["healthera.co.uk",867],["mobeleader.com",867],["powerup-gaming.com",867],["developer-blog.net",867],["medical.edu.mt",867],["deh.mt",867],["bluebell-railway.com",867],["ribescasals.com",867],["javea.com",867],["chinaimportal.com",867],["inds.co.uk",867],["raoul-follereau.org",867],["serramenti-milano.it",867],["cosasdemujer.com",867],["luz-blanca.info",867],["cosasdeviajes.com",867],["safehaven.io",867],["havocpoint.it",867],["motofocus.pl",867],["nomanssky.com",867],["drei-franken-info.de",867],["clausnehring.com",867],["alttab.net",867],["kinderleicht.berlin",867],["kiakkoradio.fi",867],["cosasdelcaribe.es",867],["de-sjove-jokes.dk",867],["serverprofis.de",867],["biographyonline.net",867],["iziconfort.com",867],["sportinnederland.com",867],["natureatblog.com",867],["wtsenergy.com",867],["cosasdesalud.es",867],["internetpasoapaso.com",867],["zurzeit.at",867],["contaspoupanca.pt",867],["steamdeckhq.com",[867,868,869,871,873,874]],["ipouritinc.com",[867,869,871]],["hemglass.se",[867,869,871,873,874]],["sumsub.com",[867,868,869]],["atman.pl",[867,868,869]],["fabriziovanmarciano.com",[867,868,869]],["nationalrail.com",[867,868,869]],["eett.gr",[867,868,869]],["funkypotato.com",[867,868,869]],["equalexchange.co.uk",[867,868,869]],["swnsdigital.com",[867,868,869]],["gogolf.fi",[867,871]],["hanse-haus-greifswald.de",867],["tampereenratikka.fi",[867,869,875,876]],["kymppikatsastus.fi",[869,873,921,922]],["brasiltec.ind.br",877],["doka.com",[878,879,880]],["abi.de",[881,882]],["studienwahl.de",[881,882]],["journal.hr",[883,884,885,886]],["howstuffworks.com",887],["stickypassword.com",[888,889,890]],["conversion-rate-experts.com",[891,892]],["merkur.si",[893,894,895]],["petitionenligne.com",[896,897]],["petitionenligne.be",[896,897]],["petitionenligne.fr",[896,897]],["petitionenligne.re",[896,897]],["petitionenligne.ch",[896,897]],["skrivunder.net",[896,897]],["petitiononline.uk",[896,897]],["petitions.nz",[896,897]],["petizioni.com",[896,897]],["peticao.online",[896,897]],["skrivunder.com",[896,897]],["peticiones.ar",[896,897]],["petities.com",[896,897]],["petitionen.com",[896,897]],["petice.com",[896,897]],["opprop.net",[896,897]],["peticiok.com",[896,897]],["peticiones.net",[896,897]],["peticion.es",[896,897]],["peticiones.pe",[896,897]],["peticiones.mx",[896,897]],["peticiones.cl",[896,897]],["peticije.online",[896,897]],["peticiones.co",[896,897]],["mediathek.lfv-bayern.de",898],["aluypvc.es",[899,900,901]],["pracuj.pl",[902,903,904,905,906]],["vki.at",908],["konsument.at",908],["chollometro.com",909],["dealabs.com",909],["hotukdeals.com",909],["pepper.it",909],["pepper.pl",909],["preisjaeger.at",909],["mydealz.de",909],["220.lv",[910,911]],["pigu.lt",[910,911]],["kaup24.ee",[910,911]],["hansapost.ee",[910,911]],["hobbyhall.fi",[910,911]],["direct.travelinsurance.tescobank.com",[914,915,916,917,918,919,920,921]],["mediaite.com",923],["easyfind.ch",[924,925]],["e-shop.leonidas.com",[926,927]],["lastmile.lt",928],["veriff.com",929],["constantin.film",[930,931,932]],["notion.so",933],["omgevingsloketinzage.omgeving.vlaanderen.be",[934,935]],["primor.eu",936],["tameteo.com",937],["tempo.pt",937],["yourweather.co.uk",937],["meteored.cl",937],["meteored.mx",937],["tempo.com",937],["ilmeteo.net",937],["meteored.com.ar",937],["daswetter.com",937],["myprivacy.dpgmediagroup.net",938],["algarvevacation.net",939],["3sat.de",940],["oxxio.nl",[941,942]],["butterflyshop.dk",[943,944,945]],["praxis.nl",946],["brico.be",946],["kent.gov.uk",[947,948]],["pohjanmaanhyvinvointi.fi",949],["maanmittauslaitos.fi",950]]);

const entitiesMap = new Map([["top4mobile",[9,10]]]);

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
        'dismiss', 'dismissed',
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
