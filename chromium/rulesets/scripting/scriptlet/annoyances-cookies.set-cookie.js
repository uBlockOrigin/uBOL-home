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

const argsList = [["__toppy_consent","1"],["_u123_cc","yes"],["ga-disable","true"],["GDPR","9"],["cookie-consent","false"],["user_allowed_save_cookie","true"],["cookie_alert","true"],["AgreeCookies","true"],["AreCookiesSet","true"],["chcCookieHint","1","","reload","1"],["accept-selected-cookies","true","","reload","1"],["cookiePreferences","true"],["necessary","true"],["has_accepted_cookies","true"],["cs_viewed_cookie_policy","yes"],["cookies","false"],["cookies_accepted","0"],["cookies_informed","true"],["has-seen-cookie-notice","true","","reload","1"],["cookies-agreed","1"],["cookies-analytical","0"],["gls-cookie-policy","accepted"],["cookies-configured","1"],["consent","true"],["localConsent","true"],["pum-13751","true"],["CONSENT","1"],["cm_level","0"],["st-cookie-token","true"],["functionalCookie","true"],["agreed_cookie_policy","1"],["hasMadeConsentSelection","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelection","true","","","domain",".imola.motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".imola.motorsportreg.com"],["gdprPGA","true"],["xn_cookieconsent","false","","reload","1"],["taunton_user_consent_submitted","true"],["taunton_user_consent_advertising","false"],["taunton_user_consent_analytics","false"],["cookie_consent_closed","1"],["__cookie_consent","false"],["dsgvo-stat","yes"],["dsgvo-mark","no"],["cookieSettings","11","","reload","1"],["google-tagmanager","false"],["decline","true","","","reload","1"],["cookieTermsDismissed","true"],["cookieConsentDismissed","true"],["cookienotification","1"],["kraftwerkCookiePolicyState","1"],["privacyPolicyAccept","1","","reload","1"],["CookieConsent","necessary"],["analyticsStatus","false"],["socialMediaStatus","false"],["cookiesAccepted","1"],["airTRFX_cookies","accepted"],["cookie_consent_accept","true"],["agree","true"],["vw_mms_hide_cookie_dialog","1"],["solo_opt_in","false"],["POMELO_COOKIES","1"],["AcceptUseCookie","Accept"],["sbrf.pers_notice","1"],["closedCookieBanner","true"],["yoyocookieconsent_viewed","true"],["privacy_policy_agreement","6","","reload","1"],["kinemaster-cookieconstent","1"],["cookie_acceptance","1"],["jazzfm-privacy","true"],["show_msg_cookies","false"],["CookieConsent","true","","reload","1"],["FunctionalCookie","true"],["AnalyticalCookie","false"],[".YourApp.ConsentCookie","yes","","reload","1"],["gdpr","deny"],["agreesWithCookies","true"],["rm-first-time-modal-welcome","1"],["cookieConsent-2023-03","false"],["CookieDisclaimer","1"],["twtr_pixel_opt_in","N"],["RBCookie-Alert","1"],["CookieConsentV4","false"],["cookieconsent_status","allow"],["cookies_analytics_enabled","0","","reload","1"],["xf_notice_dismiss","1"],["rcl_consent_given","true"],["rcl_preferences_consent","true"],["rcl_marketing_consent","false"],["confirmed-cookies","1","","reload","1"],["cb_validCookies","1"],["cb_accepted","1"],["ws-cookie-Techniques","true"],["cookie-agreed","2"],["cookie_consent","yes"],["cookie_consent_options","3"],["consentIsSetByUser","true","","reload","1"],["isSiteCookieReviewed","0","","reload","1"],["phpbb3_4zn6j_ca","true"],["cookieBar-cookies-accepted","true"],["cookie_consent_user_accepted","true"],["__gitbook_cookie_granted","no"],["user_cookie_consent","false","","reload","1"],["cookies-marketing","N"],["gatsby-gdpr-google-tagmanager","false"],["uuAppCookiesAgreement","true"],["_cookies-consent","yes"],["RCI_APP_LEGAL_DISCLAIMER_COOKIE","false"],["hs_cookieconsent","true"],["cookiergpdjnz","1"],["__radicalMotorsport.ac","true"],["cookies_message_bar_hidden","true"],["acceptsCookies","false"],["accept_cookies","accepted"],["consent_seen","1"],["_gdpr_playbalatro","1"],["consentAll","0"],["cookiewarning","1","","reload","1"],["cookieBarSeen","true"],["cookie_consent_given","true"],["cuvva.app.website.cookie-policy.consent","1"],["custom-cookies-accepted","1","","reload","1"],["AnalyticsAcceptancePopOver","false"],["cookiecookie","1"],["disclaimer-overlay","true"],["complianceCookie","true"],["KeebSupplyCookieConsent","true"],["cookie_policy_agreement","true"],["kt_tcookie","1"],["splash_Page_Accepted","true"],["gdpr-analytics-enabled","false"],["privacy_status","1"],["privacy_settings","1"],["config","1","","reload","1"],["hideCookieNotification","true","","reload","1"],["CookieNotification","1"],["has_accepted_gdpr","1"],["app-cookie-consents","1"],["analitics_cookies","0"],["tachyon-accepted-cookie-notice","true"],["defra-cookie-banner-dismissed","true","","reload","1"],["myAwesomeCookieName3","true"],["cookie-notification","ACCEPTED","","reload","1"],["loader","1"],["enableAnalyticsCookies","denied"],["acknowledgeCookieBanner","true"],["enableTargetingAdvertisingCookies","denied"],["cookiePolicy","1"],["cookie-agreed","0"],["crtmcookiesProtDatos","1","","reload","1"],["NADevGDPRCookieConsent_portal_2","1"],["handledCookieMessage","1"],["targeting","false"],["functionality","false"],["performance","false"],["cookie_info","1","","reload","1"],["bannerDissmissal","true","","reload","1"],["allowCookies","true"],["COOKIE-POLICY-ACCEPT","true"],["gdpr","accept"],["essentialCookie","Y"],["checkCookie","Y"],["analyticsCookie","N"],["marketingCookie","N"],["thirdCookie","N"],["paydirektCookieAllowed","false"],["hdcab","true"],["synapse-cookie-preferences-set","true"],["confirm_cookies","1"],["endgame-accept-policy","true"],["sc-privacy-settings","true"],["accept_cookies2","true","","reload","1"],["cf_consent","false"],["privacyCookie","1","","reload","1"],["cookieChoice","0"],["lgpdConsent","true"],["shareloft_cookie_decision","1"],["privacy_marketing","false"],["privacy_comodidade","false"],["acceptAnalyticsCookies","false"],["acceptFunctionalCookies","true"],["cookiePolicyConfirmed","true","","reload","1"],["PostAnalytics","0"],["gatsby-gdpr","false"],["functionalCookiesAccepted","true"],["necessaryCookies","true"],["comfortCookiesAccepted","false"],["statisticsCookiesAccepted","false"],["gdpr-google-analytics","false"],["cookie_policy","true"],["cookieModalAccept","no"],["AcceptFunctionalCookies","true"],["AcceptAnalyticsCookies","false"],["AcceptNonFunctionalCookies","false"],["forced-cookies-modal","2"],["cookiebar","1"],["cookieconsent_status","true"],["longines-cookiesstatus-analytics","false"],["longines-cookiesstatus-functional","false"],["longines-cookiesstatus-necessary","true"],["longines-cookiesstatus-social","false"],["pz_cookie_consent","true"],["_cb","1","","reload","1"],["consent-status","1"],["HANA-RGPD","accepted"],["cookie-optin","true"],["msg_cookie_CEX","true"],["OptanonAlertBoxClosed","ok"],["OptanonAlertBoxClosed","true"],["cookie-bar","0"],["cookieBannerHidden","true"],["isReadCookiePolicyDNT","true"],["isReadCookiePolicyDNTAa","false"],["coookieaccept","ok"],["consentTrackingVerified","true"],["consent","0"],["allowGetPrivacyInfo","true"],["cookiebanner","0"],["_tv_cookie_consent","y"],["_tv_cookie_choice","1"],["eika_consent_set","true"],["eika_consent_marketing","false"],["ew_cookieconsent","1"],["ew_cookieconsent_optin_b","true"],["ew_cookieconsent_optin_a","true"],["gdpr-agree-cookie","1","","reload","1"],["gdpr-consent-cookie-level3","1"],["gdpr-consent-cookie-level2","1"],["ck-cp","accepted"],["cookieConsent","1"],["consent-cookie","1"],["show_gdpr_cookie_message_388801234_cz","no"],["gsbbanner","0"],["__adblocker","false","","reload","1"],["cookies_marketing_ok","false"],["cookies_ok","true"],["acceptCookies","0"],["marketingCookies","false"],["CookieLaw_statistik 0"],["CookieLaw_komfort","0"],["CookieLaw_personalisierung","0"],["CookieLaw","on"],["wtr_cookie_consent","1"],["wtr_cookies_advertising","0"],["wtr_cookies_functional","0"],["wtr_cookies_analytics","0"],["allowTrackingCookiesKvK","0"],["cookieLevelCodeKVK","1"],["allowAnalyticsCookiesKvK","0"],["macfarlanes-necessary-cookies","accepted"],["TC_PRIVACY_CENTER","0"],["AllowCookies","false","","reload","1"],["consented","false"],["cookie_tou","1","","reload","1"],["blukit_novo","true"],["cr","true"],["gdpr_check_cookie","accepted","","reload","1"],["accept-cookies","accepted"],["dvag_cookies2023","1"],["consent_cookie","1"],["permissionExperience","false"],["permissionPerformance","false"],["permissionMarketing","false"],["consent_analytics","false"],["consent_received","true"],["cookieModal","false"],["user-accepted-AEPD-cookies","1"],["personalization-cookies-consent","0","","reload","1"],["analitics-cookies-consent","0"],["sscm_consent_widget","1"],["texthelp_cookie_consent_in_eu","0"],["texthelp_cookie_consent","yes"],["nc_cookies","accepted"],["nc_analytics","rejected"],["nc_marketing","rejected"],[".AspNet.Consent","yes","","reload","1"],[".AspNet.Consent","no","","reload","1"],["user_gave_consent","1"],["user_gave_consent_new","1"],["rt-cb-approve","true"],["CookieLayerDismissed","true"],["RODOclosed","true"],["cookieDeclined","1"],["cookieModal","true"],["oph-mandatory-cookies-accepted","true"],["cookies-accept","1"],["dw_is_new_consent","true"],["accept_political","1"],["konicaminolta.us","1"],["cookiesAnalyticsApproved","0"],["hasConfiguredCookies","1"],["cookiesPubliApproved","0"],["cookieAuth","1"],["kscookies","true"],["cookie-policy","true"],["cookie-use-accept","false"],["ga-disable-UA-xxxxxxxx-x","true"],["consent","1"],["acceptCookies","1"],["cookie-bar","no"],["CookiesAccepted","no"],["essential","true"],["cookieConfirm","true"],["trackingConfirm","false"],["cookie_consent","false"],["cookie_consent","true"],["gtm-disable-GTM-NLVRXX8","true"],["uce-cookie","N"],["tarteaucitron","false"],["cookiePolicies","true"],["cookie_optin_q","false"],["ce-cookie","N"],["NTCookies","0"],["alertCookie","1","","reload","1"],["gdpr","1"],["hideCookieBanner","true"],["obligatory","true"],["marketing","false"],["analytics","false"],["cookieControl","true"],["plosCookieConsentStatus","false"],["user_accepted_cookies","1"],["analyticsAccepted","false"],["cookieAccepted","true"],["hide-gdpr-bar","true"],["promptCookies","1"],["_cDaB","1"],["_aCan_analytical","0"],["_aGaB","1"],["surbma-gpga","no"],["elrowCookiePolicy","yes"],["ownit_cookie_data_permissions","1"],["Cookies_Preferences","accepted"],["Cookies_Preferences_Analytics","declined"],["privacyPolicyAccepted","true"],["Cookies-Accepted","true"],["cc-accepted","2"],["cc-item-google","false"],["featureConsent","false","","reload","1"],["accept-cookie","no"],["consent","0","","reload","1"],["cookiePrivacyPreferenceBannerProduction","accepted"],["cookiesConsent","false"],["2x1cookies","1"],["firstPartyDataPrefSet","true"],["cookies-required","1","","reload","1"],["kh_cookie_level4","false"],["kh_cookie_level3","false"],["kh_cookie_level1","true"],["cookie_agreement","1","","reload","1"],["MSC_Cookiebanner","false"],["cookieConsent_marketing","false"],["Fitnessing21-15-9","0"],["cookies_popup","yes"],["cookieConsent_required","true","","reload","1"],["sa_enable","off"],["acceptcookietermCookieBanner","true"],["cookie_status","1","","reload","1"],["FTCookieCompliance","1"],["cookiePopupAccepted","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_ADS_OPTOUT","true"],["UBI_PRIVACY_POLICY_ACCEPTED","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["jocookie","false"],["cookieNotification.shown","1"],["localConsent","false"],["oai-allow-ne","false"],["consent","rejected"],["allow-cookie","1"],["cookie-functional","1"],["hulkCookieBarClick","1"],["CookieConsent","1"],["zoommer-cookie_agreed","true"],["accepted_cookie_policy","true"],["gdpr_cookie_token","1"],["_consent_personalization","denied"],["_consent_analytics","denied"],["_consent_marketing","denied"],["cookieWall","1"],["no_cookies","1"],["hidecookiesbanner","1"],["CookienatorConsent","false"],["cookieWallOptIn","0"],["analyticsCookiesAccepted","false"],["cf4212_cn","1"],["mediaCookiesAccepted","false"],["mandatoryCookiesAccepted","true"],["gtag","true"],["BokadirektCookiePreferencesMP","1"],["cookieAcknowledged","true"],["data-privacy-statement","true"],["cookie_privacy_level","required"],["accepted_cookies","true","","reload","1"],["MATOMO_CONSENT_GIVEN","0"],["BABY_MARKETING_COOKIES_CONSENTED","false"],["BABY_PERFORMANCE_COOKIES_CONSENTED","false"],["BABY_NECESSARY_COOKIES_CONSENTED","true"],["consent_essential","allow"],["cookieshown","1"],["warn","true"],["optinCookieSetting","1"],["privacy-shown","true"],["slimstat_optout_tracking","true"],["npp_analytical","0"],["inshopCookiesSet","true"],["adsCookies","false"],["performanceCookies","false"],["sa_demo","false"],["animated_drawings","true"],["cookieStatus","true"],["swgCookie","false"],["cookieConsentPreferencesGranted","1"],["cookieConsentMarketingGranted","0"],["cookieConsentGranted","1"],["cookies-rejected","true"],["NL_COOKIE_KOMFORT","false"],["NL_COOKIE_MEMORY","true","","reload","1"],["NL_COOKIE_STATS","false"],["pws_gdrp_accept","1"],["have18","1"],["pelm_cstate","1"],["pelm_consent","1"],["accept-cookies","true"],["accept-analytical-cookies","false"],["accept-marketing-cookies","false"],["cookie-level-v4","0"],["analytics_consent","yes"],["sei-ccpa-banner","true"],["awx_cookie_consent","true"],["cookie_warning","1"],["allowCookies","0"],["cookiePolicyAccepted","true"],["codecamps.cookiesConsent","true"],["cookiesConsent","true"],["consent_updated","true"],["acsr","1"],["__hs_gpc_banner_dismiss","true"],["cookieyes-necessary","yes"],["cookieyes-other","no"],["cky-action","yes"],["cookieyes-functional","no"],["has-declined-cookies","true","","reload","1"],["has-agreed-to-cookies","false"],["essential","Y"],["analytics","N"],["functional","N"],["gradeproof_shown_cookie_warning","true"],["sber.pers_notice_en","1"],["cookies_consented","yes"],["cookies_consent","true"],["cookies_consent","false"],["anal-opt-in","false"],["accepted","1"],["CB393_DONOTREOPEN","true"],["AYTO_CORUNA_COOKIES","1","","reload","1"],["I6IISCOOKIECONSENT0","n","","reload","1"],["htg_consent","0"],["cookie_oldal","1"],["cookie_marketing","0"],["cookie_jog","1"],["cp_cc_ads","0"],["cp_cc_stats","0"],["cp_cc_required","1"],["ae-cookiebanner","true"],["ae-esential","true"],["ae-statistics","false"],["ccs-supplierconnect","ACCEPTED"],["accepted_cookies","yes"],["note","1"],["cookieConsent","required"],["cookieConsent","accepted"],["pd_cc","1"],["gdpr_ok","necessary"],["allowTracking","false"],["varmafi_mandatory","true"],["VyosCookies","Accepted"],["analyticsConsent","false"],["adsConsent","false"],["te_cookie_ok","1"],["amcookie_policy_restriction","allowed"],["cookieConsent","allowed"],["dw_cookies_accepted","1"],["acceptConverseCookiePolicy","0"],["gdpr-banner","1"],["privacySettings","1"],["are_essential_consents_given","1"],["is_personalized_content_consent_given","1"],["acepta_cookies_funcionales","1"],["acepta_cookies_obligatorias","1"],["acepta_cookies_personalizacion","1"],["cookiepolicyinfo_new","true"],["acceptCookie","true"],["ee-hj","n"],["ee-ca","y","","reload","1"],["ee-yt","y"],["cookie_analytics","false"],["et_cookie_consent","true"],["cookieBasic","true"],["cookieMold","true"],["ytprefs_gdpr_consent","1"],["efile-cookiename-","1"],["plg_system_djcookiemonster_informed","1","","reload","1"],["cvc","true"],["cookieConsent3","true"],["acris_cookie_acc","1","","reload","1"],["termsfeed_pc1_notice_banner_hidden","true"],["cmplz_marketing","allowed"],["cmplz_marketing","allow"],["acknowledged","true"],["ccpaaccept","true"],["gdpr_shield_notice_dismissed","yes"],["luci_gaConsent_95973f7b-6dbc-4dac-a916-ab2cf3b4af11","false"],["luci_CookieConsent","true"],["ng-cc-necessary","1"],["ng-cc-accepted","accepted"],["PrivacyPolicyOptOut","yes"],["consentAnalytics","false"],["consentAdvertising","false"],["consentPersonalization","false"],["privacyExpiration","1"],["cookieconsent_status","deny"],["lr_cookies_tecnicas","accepted"],["cookies_surestao","accepted","","reload","1"],["hide-cookie-banner","1"],["fjallravenCookie","1"],["accept_cookie_policy","true"],["_marketing","0"],["_performance","0"],["RgpdBanner","1"],["seen_cookie_message","accepted"],["complianceCookie","on"],["cookie-consent","1","","reload","1"],["cookie-consent","0"],["ecologi_cookie_consent_20220224","false"],["appBannerPopUpRulesCookie","true"],["eurac_cookie_consent","true"],["akasaairCookie","accepted"],["rittalCC","1"],["ckies_facebook_pixel","deny"],["ckies_google_analytics","deny"],["ckies_youtube","allow"],["ckies_cloudflare","allow"],["ckies_paypal","allow"],["ckies_web_store_state","allow"],["hasPolicy","Y"],["modalPolicyCookieNotAccepted","notaccepted"],["MANA_CONSENT","true"],["_ul_cookie_consent","allow"],["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["trackingCookies","off"],["acceptanalytics","no"],["acceptadvertising","no"],["acceptfunctional","yes"],["consent18","0","","reload","1"],["ATA.gdpr.popup","true"],["AIREUROPA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["privacyNoticeExpireDate","1"],["privacyNoticeAccepted","true"],["policy_accepted","1"],["stampen-cookies-hide-information","yes"],["dominos_cookies_accepted","1"],["deva_accepted","yes"],["cookies_consent","1"],["cookies_modal","true"],["cookie_notice","1"],["cookiesPopup","1"],["digibestCookieInfo","true"],["cookiesettings_status","allow"],["_duet_gdpr_acknowledged","1"],["daimant_collective","accept","","reload","1"],["cookies-notice","1","","reload","1"],["banner","2","","reload","1"],["privacy-policy-2023","accept"],["user_cookie_consent","false"],["cookiePolicy","4"],["standard_gdpr_consent","true"],["cookie_accept","true"],["cookieBanner","true"],["tncookieinfo","1","","reload","1"],["agree_with_cookies","1"],["cookie-accepted","true"],["cookie-accepted","yes"],["consentAll","1"],["hide_cookies_consent","1"],["nicequest_optIn","1"],["shb-consent-cookies","false"],["cookies-accepted","true","","reload","1"],["cpaccepted","true"],["cookieMessageDismissed","1"],["LG_COOKIE_CONSENT","0"],["CookieConsent","true"],["CookieConsent","false"],["gatsby-plugin-google-tagmanager","false"],["wtr_cookies_functional","1"],["cookie-m-personalization","0"],["cookie-m-marketing","0"],["cookie-m-analytics","0"],["cookies","true"],["ctc_rejected","1"],["_cookies_v2","1"],["AcceptedCookieCategories","1"],["cookie_policy_acknowledgement","true"],["allowCookies","yes"],["cookieNotification","true"],["privacy","true"],["euconsent-bypass","1"],["cookie_usage","yes"],["dismissCookieBanner","true"],["switchCookies","1"],["cbChecked","true"],["infoCookieUses","true"],["consent-data-v2","0"],["ACCEPTED_COOKIES","true"],["EMR-CookieConsent-Analytical","0","","reload","1"],["gem_cookies_usage_production","1"],["cookie_level","2"],["toutv_cookies_usage_production","1"],["_evidon_suppress_notification_cookie","1"],["EMR-CookieConsent-Advertising","0"],["acceptCookies","true"],["COOKIES_NEWACCEPTED","1"],["es_cookie_settings_closed","1"],["cookie-banner-acceptance-state","true"],["cookie_consent_seen","1"],["cookies_allowed","yes"],["tracking","0"],["valamis_cookie_message","true","","reload","1"],["valamis_cookie_marketing","false"],["valamis_cookie_analytics","false"],["approvedcookies","no","","reload","1"],["psd-google-ads-enabled","0"],["psd-gtm-activated","1"],["wishlist-enabled","1"],["consentInteract","true"],["cookie-byte-consent-essentials","true"],["cookie-byte-consent-showed","true"],["cookie-byte-consent-statistics","false"],["bm_acknowledge","yes"],["genovaPrivacyOptions","1","","reload","1"],["kali-cc-agreed","true"],["cookiesAccepted","true"],["allowMarketingCookies","false"],["allowAnalyticalCookies","false"],["privacyLevel","2","","reload","1"],["AcceptedCookies","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["privacyLevel","flagmajob_ads_shown","1","","reload","1"],["userCookies","true"],["privacy-policy-accepted","1"],["precmp","1","","reload","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["statistik","0"],["cookies-informer-close","true"],["gdpr","0"],["required","1"],["rodo-reminder-displayed","1"],["rodo-modal-displayed","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["bvkcookie","true"],["cookie-preference","1","","reload","1"],["cookie-preference-v3","1"],["cookies_accepted","yes"],["cookies_accepted","false"],["CM_BANNER","false"],["set-cookie","cookieAccess","1"],["hife_eu_cookie_consent","1"],["cookie-consent","accepted"],["permission_marketing_cookies","0"],["permission_statistic_cookies","0"],["permission_funktional_cookies","1"],["cookieconsent","1"],["cookieconsent","true"],["cookieconsent","deny"],["epole_cookies_settings","true"],["dopt_consent","false"],["privacy-statement-accepted","true","","reload","1"],["cookie_locales","true"],["ooe_cookie_policy_accepted","no"],["accept_cookie","1"],["cookieconsent_status_new","1"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-accepted","false"],["isReadCookiePolicyDNTAa","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["cookie_accepted","1"],["cookie_accepted","false","","reload","1"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["allow_cookie","false"],["3LM-Cookie","false"],["i_sc_a","false"],["i_cm_a","false"],["i_c_a","true"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["cookieconsent_statistics","no"],["cookieconsent_essential","yes"],["cookie_preference","1"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie-preferences-technical","yes"],["tracking_cookie","1"],["cookie_consent_group_technical","1"],["cookie-preference_renew10","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["cookie_accepted","true"],["hasSeenCookieDisclosure","true"],["RY_COOKIE_CONSENT","true"],["COOKIE_CONSENT","1","","reload","1"],["COOKIE_STATIC","false"],["COOKIE_MARKETING","false"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookie_consent","1"],["ff_cookie_notice","1"],["allris-cookie-msg","1"],["gdpr__google__analytics","false"],["gdpr__facebook__social","false"],["gdpr__depop__functional","true"],["cookie_consent","1","","reload","1"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["cookie-consent","true"],["abz_seo_choosen","1"],["privacyAccepted","true"],["cok","1","","reload","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["CookieConsentV2","YES"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["cookie_consent_user_accepted","false"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Marketing","0"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Analytics","0"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","0"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree_0124","1"],["cookiesPolicy20211101","1"],["sc-cookies-accepted","true"],["marketing_cookie_akkoord","0"],["site_cookie_akkoord","1"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["analytics_cookies","0"],["cookies_accepted","1","","reload","1"],["tracking_cookies","0"],["advertisement-age-show-alcohol","false"],["advertisement-age-show-gamble","false"],["ibe.acceptedCookie","true"],["acceptedPolicy","true"],["cookieConsentClosed","true"],["cookiesPrivacy","false"],["_tvsPrivacy","true"],["epCookieConsent","0","","reload","1"],["royaloakTermsCookie","1"],["is_allowed_client_traking_niezbedne","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["cpaccpted","true"],["AllowCookies","true"],["cookiesAccepted","3"],["optOutsTouched","true"],["optOutAccepted","true"],["gdpr_dismissal","true"],["analyticsCookieAccepted","0"],["cookieAccepted","0"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["use_cookie","1"],["figshareCookiesAccepted","true"],["bitso_cc","1"],["eg_asked","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookie_analytcs","false","","reload","1"],["dhl-webapp-track","allowed"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["ofdb_werbung","Y","","reload","1"],["user_cookie_consent","1"],["STAgreement","1"],["tc:dismissexitintentpopup","true"],["functionalCookies","true"],["contentPersonalisationCookies","false"],["statisticalCookies","false"],["consents","essential"],["viewed_cookie_policy","yes","","reload","1"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["cookielawinfo-checkbox-non-necessary","no"],["cookielawinfo-checkbox-advertisement","no"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-analytics","no"],["cookielawinfo-checkbox-performance","no"],["cookielawinfo-checkbox-markkinointi","no"],["cookielawinfo-checkbox-tilastointi","no"],["cookie_preferences","10"],["uninavIsAgreeCookie","true"],["cookie_consent_status","allow"],["cookie_accept","1"],["hide_cookieoverlay_v2","1","","reload","1"],["socialmedia-cookies_allowed_v2","0"],["performance-cookies_allowed_v2","0"],["mrm_gdpr","1"],["necessary_consent","accepted"],["jour_cookies","1"],["jour_functional","true"],["jour_analytics","false"],["jour_marketing","false"],["gdpr_opt_in","1"],["ad_storage","denied"],["stickyCookiesSet","true"],["analytics_storage","denied"],["user_experience_cookie_consent","false"],["marketing_cookie_consent","false"],["cookie_notice_dismissed","yes"],["cookie_analytics_allow","no"],["mer_cc_dim_rem_allow","no"],["num_times_cookie_consent_banner_shown","1"],["cookie_consent_banner_shown_last_time","1"],["privacy_hint","1"],["cookiesConsent","1"],["cookiesStatistics","0"],["cookiesPreferences","0"],["gpc_v","1"],["gpc_ad","0"],["gpc_analytic","0"],["gpc_audience","0"],["gpc_func","0"],["OptanonAlertBoxClosed","1"],["vkicookieconsent","0"],["cookie_policy_agreement","3"],["CA_DT_V2","0","","reload","1"],["CA_DT_V3","0"],["internalCookies","false"],["essentialsCookies","true"],["TESCOBANK_ENSIGHTEN_PRIVACY_Advertising","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Experience","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Measurement","0"],["viewed_cookie_policy","yes"],["cookielawinfo-checkbox-toiminnalliset-evasteet","yes"],["am-sub","1"],["allow-marketing","false"],["allow-analytics","false"],["cc_analytics","0"],["cc_essential","1"],["__consent","%5B%22required%22%5D"],["veriff_cookie_consent_completed","true"],["external-data-googlemaps-is-enabled","true"],["external-data-youtube-is-enabled","true"],["external-data-spotify-is-enabled","true"],["notion_check_cookie_consent","true"],["vl-cookie-consent-cookie-consent","true"],["vl-cookie-consent-functional","true"],["amcookie_allowed","0"],["euconsent-v2-addtl","0"],["dummy","1","","reload","1"],["acepta_cookie","acepta"],["3sat_cmp_configuration","true"],["privacyConsent_version","1","","reload","1"],["privacyConsent","false"],["DDCookiePolicy-consent-functional","false"],["DDCookiePolicy-consent-tracking","false"],["DDCookiePolicy-consent-statistics","false"],["CookieNotificationSeen","1","","reload","1"],["cookie-management-preferences-set","true"],["cookie-management-version","1"],["show-cookie-banner","1"],["mml-cookie-agreed","2"],["TVPtcs22ver","64"]];

const hostnamesMap = new Map([["toppy.be",0],["uhrzeit123.de",[1,2]],["marinelink.com",3],["thegraph.com",4],["followalice.com",[4,772]],["vandalism-sounds.com",5],["hiermitherz.de",6],["aeromexico.com",[7,8]],["easywintergarten.de",9],["vinothekwaespi.ch",[10,11,12]],["graphy.com",13],["raspberrypi.dk",14],["ocean.io",15],["waves.is",16],["tesa.com",17],["repair.wd40.com",18],["gls-group.eu",21],["chipsaway.co.uk",22],["heatstore.eu",23],["luvly.care",23],["firmen.wko.at",23],["copaamerica.com",24],["cooleygo.com",25],["map.blitzortung.org",26],["northumbriasport.com",27],["clearspend.natwest.com",28],["cellcolabsclinical.com",29],["producthunt.com",30],["motorsportreg.com",[31,32]],["imola.motorsportreg.com",[33,34]],["pga.com",35],["portal.payment.eltax.lta.go.jp",36],["greenbuildingadvisor.com",[37,38,39]],["finewoodworking.com",[37,38,39]],["privatekeys.pw",40],["telli.dpd.ee",41],["youthforum.org",41],["votegroup.de",[42,43]],["pharmahall.gr",44],["x-team.com",45],["reservations.helveticmotion.ch",46],["endclothing.com",[47,48]],["arning-bau.de",49],["kraftwerk.co.at",50],["fhr.biz",51],["srf.nu",52],["jn.fo",[53,54]],["rovia.es",55],["airnewzealand.co.nz",56],["viu.com",57],["dinamalar.com",58],["volkswagen-group.com",59],["solo.io",60],["pomelo.la",61],["ibuypower.com",62],["sberbank.com",[63,448]],["swissmilk.ch",64],["gamemaker.io",65],["pixiv.net",66],["kinemaster.com",67],["sp32bb.pl",68],["jazz.fm",69],["juntadeandalucia.es",70],["melee.gg",[71,72,73]],["chemocare.com",74],["mobiliteit.nl",75],["xledger.net",76],["reviewmeta.com",77],["guide-bordeaux-gironde.com",78],["travelinsured.com",79],["gdpr.twitter.com",80],["mora.hu",81],["confused.com",82],["physikinstrumente.de",83],["karlknauer.de",83],["schoeck.com",83],["resonate.coop",83],["northgatevehiclehire.ie",83],["badhall.at",83],["cic.ch",83],["ilsaggiatore.com",84],["forum.digitalfernsehen.de",85],["bitscrunch.com",[86,87,88]],["hannahgraaf.com",89],["shop.elbers-hof.de",[90,91]],["woolsocks.eu",92],["uza.be",93],["5asec.ch",93],["wizards.com",93],["kitepackaging.co.uk",[94,95]],["parkenflughafen.de",96],["radyofenomen.com",97],["elsate.com",98],["hume.ai",99],["lotusantwerp.wacs.online",100],["gitbook.io",101],["gitbook.com",101],["thehacker.recipes",101],["docs.dyrector.io",101],["docs.webstudio.is",101],["makeresearchpay.com",102],["tandartsenpraktijk-simons.tandartsennet.nl",103],["huisartsenpraktijkdoorn.nl",103],["bcorporation.net",104],["knime.com",[104,148]],["quebueno.es",104],["edookit.com",105],["trixonline.be",106],["radio-canada.ca",107],["heysummit.com",108],["puromarketing.com",109],["radicalmotorsport.com",110],["biurobox.pl",111],["cycling74.com",112],["triviacreator.com",113],["freshis.com",113],["anker.com",113],["computacenter.com",114],["playbalatro.com",115],["kastner-oehler.de",116],["kastner-oehler.at",116],["kastner-oehler.ch",116],["twenga.it",117],["twenga.fr",117],["twenga.co.uk",117],["twenga.de",117],["twenga.es",117],["twenga.pl",117],["twenga.nl",117],["twenga.se",117],["olx.kz",118],["efl.com",119],["wst.tv",119],["cuvva.com",120],["vitbikes.de",121],["gourmetfoodstore.com",122],["schulfahrt.de",123],["deutsche-finanzagentur.de",124],["thejazzcafelondon.com",125],["keeb.supply",126],["spb.hh.ru",127],["kaluga.hh.ru",127],["school.hh.ru",127],["rating.hh.ru",127],["novgorod.hh.ru",127],["xxxshemaleporn.com",[128,129]],["gayhits.com",[128,129]],["gaypornvideos.xxx",[128,129]],["sextubespot.com",[128,129]],["wewantjusticedao.org",130],["godbolt.org",131],["projectenglish.com.pl",[132,138]],["ledenicheur.fr",132],["pricespy.co.uk",132],["pricespy.co.nz",132],["sae.fsc.ccoo.es",133],["piusx-college.nl",134],["forgeofempires.com",135],["yoomoney.ru",136],["vod.warszawa.pl",137],["m.twitch.tv",139],["environment.data.gov.uk",140],["playtesting.games",141],["portal.by.aok.de",142],["umlandscout.de",143],["atombank.co.uk",[144,145,146]],["showtv.com.tr",147],["seventhgeneration.com",148],["press.princeton.edu",148],["ldz.lv",148],["crtm.es",149],["airastana.com",150],["vkf-renzel.nl",151],["booking.reederei-zingst.de",[152,153,154]],["booking.weisse-flotte.de",[152,153,154]],["booking2.reederei-hiddensee.de",[152,153,154]],["sanswiss.pl",155],["galaxy.com",156],["petdesk.com",157],["ivyexec.com",158],["railtech.com",159],["lottehotel.com",[160,161,162,163,164]],["paydirekt.de",165],["kijiji.ca",166],["posterstore.fr",167],["posterstore.eu",167],["posterstore.be",167],["posterstore.de",167],["posterstore.hu",167],["posterstore.ie",167],["posterstore.it",167],["posterstore.no",167],["posterstore.nl",167],["posterstore.pl",167],["posterstore.com",167],["posterstore.ae",167],["posterstore.ca",167],["posterstore.nz",167],["posterstore.es",167],["posterstore.kr",167],["posterstore.jp",167],["posterstore.dk",167],["posterstore.se",167],["posterstore.ch",167],["posterstore.at",167],["myriadicity.net",168],["dgsf.org",168],["endgame.id",169],["cashback-cards.ch",170],["swisscard.ch",170],["ahorn24.de",171],["blockdyor.com",172],["ticket.io",173],["omega-nuernberg.servicebund.com",174],["lojaboschferramentas.com.br",[175,177,178]],["shareloft.com",176],["fineartsmuseum.recreatex.be",[179,180,181]],["jaapeden.nl",[179,180,181]],["eboo.lu",182],["lasmallagency.com",183],["lhsystems.com",[184,185,186,187]],["twomates.de",188],["intergiro.com",189],["healthygamer.gg",190],["telepizza.es",[191,192,193]],["telepizza.pt",[191,192,193]],["frisco.pl",194],["tyleenslang.nl",195],["schrikdraad.net",195],["kruiwagen.net",195],["pvcvoordeel.nl",195],["pvcbuis.com",195],["drainagebuizen.nl",195],["likewise.com",196],["longines.com",[197,198,199,200]],["vater-it.de",201],["biano.hu",202],["nadia.gov.gr",203],["hana-book.fr",204],["kzvb.de",205],["correosexpress.com",206],["cexpr.es",206],["rte.ie",207],["smart.com",208],["gry.pl",208],["gamesgames.com",208],["games.co.uk",208],["jetztspielen.de",208],["ourgames.ru",208],["permainan.co.id",208],["gioco.it",208],["jeux.fr",208],["juegos.com",208],["ojogos.com.br",208],["oyunskor.com",208],["spela.se",208],["spelletjes.nl",208],["agame.com",208],["spielen.com",208],["flashgames.ru",208],["games.co.id",208],["giochi.it",208],["jeu.fr",208],["spel.nl",208],["sartor-stoffe.de",209],["rockpoint.cz",209],["rockpoint.sk",209],["parfum-zentrum.de",209],["candy-store.cz",209],["tridge.com",210],["asus.com",[211,212]],["drinksking.sk",213],["neuhauschocolates.com",214],["commandsuite.it",215],["oktea.tw",216],["bafin.de",217],["materna.de",217],["bamf.de",217],["tenvinilo-argentina.com",[218,219]],["eikaforsikring.no",[220,221]],["eurowings.com",[222,223,224]],["newpharma.be",[225,226,227]],["newpharma.fr",[225,226,227]],["newpharma.de",[225,226,227]],["newpharma.at",[225,226,227]],["newpharma.nl",[225,226,227]],["kapoorwatch.com",228],["instantoffices.com",229],["paf.se",229],["citibank.pl",229],["citibankonline.pl",229],["azertyfactor.be",230],["zelezodum.cz",231],["thw.de",232],["bafa.de",232],["bka.de",232],["bmbf.de",232],["weather.com",233],["bolist.se",[234,235]],["project529.com",235],["evivanlanschot.nl",236],["prenatal.nl",237],["onnibus.com",[237,874,875,876]],["kyoceradocumentsolutions.us",[237,926,927]],["kyoceradocumentsolutions.ch",[237,926,927]],["kyoceradocumentsolutions.co.uk",[237,926,927]],["kyoceradocumentsolutions.de",[237,926,927]],["kyoceradocumentsolutions.es",[237,926,927]],["kyoceradocumentsolutions.eu",[237,926,927]],["kyoceradocumentsolutions.fr",[237,926,927]],["kyoceradocumentsolutions.it",[237,926,927]],["kyoceradocumentsolutions.ru",[237,926,927]],["kyoceradocumentsolutions.mx",[237,926,927]],["kyoceradocumentsolutions.cl",[237,926,927]],["kyoceradocumentsolutions.com.br",[237,926,927]],["wagner-tuning.com",[238,239,240,241]],["waitrosecellar.com",[242,243,244,245]],["waitrose.com",[242,596]],["kvk.nl",[246,247,248]],["macfarlanes.com",249],["pole-emploi.fr",250],["gardenmediaguild.co.uk",251],["samplerite.com",252],["samplerite.cn",252],["sororedit.com",253],["blukit.com.br",254],["biegnaszczyt.pl",255],["staff-gallery.com",256],["itv.com",257],["dvag.de",258],["premierinn.com",[259,260,261,262]],["whitbreadinns.co.uk",[259,260,261,262]],["barandblock.co.uk",[259,260,261,262]],["tabletable.co.uk",[259,260,261,262]],["brewersfayre.co.uk",[259,260,261,262]],["beefeater.co.uk",[259,260,261,262]],["allstarssportsbars.co.uk",[263,264]],["babiesrus.ca",265],["toysrus.ca",265],["roomsandspaces.ca",265],["athletic-club.eus",[266,267,268]],["wattoo.dk",269],["wattoo.no",269],["texthelp.com",[270,271]],["courierexchange.co.uk",[272,273,274]],["haulageexchange.co.uk",[272,273,274]],["ecaytrade.com",275],["powerball.com",276],["tlaciarik.sk",276],["tiskarik.cz",276],["sseriga.edu",[277,278]],["rt.com",279],["swrng.de",280],["crfop.gdos.gov.pl",281],["nurgutes.de",282],["kpcen-torun.edu.pl",283],["opintopolku.fi",284],["app.erevie.pl",285],["debenhams.com",286],["archiwumalle.pl",287],["konicaminolta.ca",288],["konicaminolta.us",288],["deutschebank-dbdirect.com",[289,290,291]],["dbonline.deutsche-bank.es",[289,290,291]],["deutsche-bank.es",[289,290,291]],["hipotecaonline.db.com",292],["kangasalansanomat.fi",293],["eif.org",294],["tunnelmb.net",294],["sugi-net.jp",295],["understandingsociety.ac.uk",296],["leibniz.com",297],["horecaworld.biz",[297,565]],["horecaworld.be",[297,565]],["bettertires.com",297],["electroprecio.com",297],["autohero.com",297],["computerbase.de",[297,921]],["sistemacomponentes.com.br",298],["bargaintown.ie",299],["tui.nl",300],["doppelmayr.com",301],["case-score.com",[302,303]],["cote.co.uk",304],["finimize.com",304],["k-einbruch.de",[305,306]],["blxxded.com",305],["rtu.lv",307],["sysdream.com",308],["cinemarkca.com",309],["neander-zahn.de",310],["theadelphileeds.co.uk",311],["tobycarvery.co.uk",311],["carsupermarket.com",311],["viajesatodotren.com",312],["ticketingcine.fr",313],["agenziavista.it",314],["e-chladiva.cz",314],["bitecode.dev",315],["mjob.si",[316,317,318]],["airportrentacar.gr",319],["mobile-fueling.de",319],["plos.org",320],["autohaus24.de",321],["sixt-neuwagen.de",321],["gadis.es",[322,323]],["dom.ru",323],["ford-kimmerle-reutlingen.de",324],["autohaus-reitermayer.de",324],["autohaus-diefenbach-waldbrunn.de",324],["autohaus-diefenbach.de",324],["autohaus-musberg.de",324],["ford-ah-im-hunsrueck-simmern.de",324],["ford-arndt-goerlitz.de",324],["ford-autogalerie-alfeld.de",324],["ford-bacher-schrobenhausen.de",324],["ford-bathauer-bad-harzburg.de",324],["ford-behrend-waren.de",324],["ford-bergland-frankfurt-oder.de",324],["ford-bergland-wipperfuerth.de",324],["ford-besico-glauchau.de",324],["ford-besico-nuernberg.de",324],["ford-bischoff-neumuenster.de",324],["ford-bodach-borgentreich.de",324],["ford-bunk-saarbruecken.de",324],["ford-bunk-voelklingen.de",324],["ford-busch-kirchberg.de",324],["ford-diermeier-muenchen.de",324],["ford-dinnebier-leipzig.de",324],["ford-duennes-regensburg.de",324],["ford-fischer-bochum.de",324],["ford-fischer-muenster.de",324],["ford-foerster-koblenz.de",324],["ford-fuchs-uffenheim.de",324],["ford-geberzahn-koeln.de",324],["ford-gerstmann-duesseldorf.de",324],["ford-haefner-und-strunk-kassel.de",324],["ford-hartmann-kempten.de",324],["ford-hartmann-rastatt.de",324],["ford-hatzner-karlsruhe.de",324],["ford-heine-hoexter.de",324],["ford-hentschel-hildesheim.de",324],["ford-hessengarage-dreieich.de",324],["ford-hessengarage-frankfurt.de",324],["ford-hga-windeck.de",324],["ford-hommert-coburg.de",324],["ford-horstmann-rastede.de",324],["ford-janssen-sonsbeck.de",324],["ford-jochem-stingbert.de",324],["ford-jungmann-wuppertal.de",324],["ford-kestel-marktzeuln.de",324],["ford-klaiber-bad-friedrichshall.de",324],["ford-koenig-eschwege.de",324],["ford-kohlhoff-mannheim.de",324],["ford-kt-automobile-coesfeld.de",324],["ford-lackermann-wesel.de",324],["ford-ludewig-delligsen.de",324],["ford-maiwald-linsengericht.de",324],["ford-mertens-beckum.de",324],["ford-meyer-bad-oeynhausen.de",324],["ford-mgs-bayreuth.de",324],["ford-mgs-radebeul.de",324],["ford-muecke-berlin.de",324],["ford-norren-weissenthurm.de",324],["ford-nrw-garage-duesseldorf.de",324],["ford-nrw-garage-handweiser.de",324],["ford-nuding-remshalden.de",324],["ford-ohm-rendsburg.de",324],["ford-reinicke-muecheln.de",324],["ford-rennig.de",324],["ford-roerentrop-luenen.de",324],["ford-schankola-dudweiler.de",324],["ford-sg-goeppingen.de",324],["ford-sg-leonberg.de",324],["ford-sg-neu-ulm.de",324],["ford-sg-pforzheim.de",324],["ford-sg-waiblingen.de",324],["ford-storz-st-georgen.de",324],["ford-strunk-koeln.de",324],["ford-tobaben-hamburg.de",324],["ford-toenjes-zetel.de",324],["ford-wagner-mayen.de",324],["ford-wahl-fritzlar.de",324],["ford-wahl-siegen.de",324],["ford-weege-bad-salzuflen.de",324],["ford-westhoff-hamm.de",324],["ford-wieland-hasbergen.de",324],["renault-autocenterprignitz-pritzwalk.de",324],["renault-spenrath-juelich.de",324],["vitalllit.com",325],["fincaparera.com",325],["dbnetbcn.com",325],["viba.barcelona",325],["anafaustinoatelier.com",325],["lamparasherrero.com",325],["calteixidor.cat",325],["argentos.barcelona",325],["anmarlube.com",325],["anynouxines.barcelona",325],["crearunapaginaweb.cat",325],["cualesmiip.com",325],["porndoe.com",[326,327,328]],["thinkingaustralia.com",329],["elrow.com",330],["ownit.se",331],["velo-antwerpen.be",[332,333]],["wwnorton.com",334],["pc-canada.com",335],["mullgs.se",336],["1a-sehen.de",337],["feature.fm",338],["comte.com",339],["baltic-watches.com",340],["np-brijuni.hr",340],["vilgain.com",340],["tradingview.com",341],["wevolver.com",342],["experienciasfree.com",343],["freemans.com",344],["kivikangas.fi",345],["lumingerie.com",345],["melkkobrew.fi",345],["kh.hu",[346,347,348]],["aplgo.com",349],["securityconference.org",350],["aha.or.at",[351,354]],["fantasyfitnessing.com",352],["chocolateemporium.com",353],["account.samsung.com",355],["crushwineco.com",356],["levi.pt",357],["fertagus.pt",358],["smiggle.co.uk",359],["ubisoft.com",[360,361,362,363]],["store.ubisoft.com",[360,363,801,802]],["thulb.uni-jena.de",364],["splityourticket.co.uk",365],["eramba.org",366],["openai.com",[367,368]],["kupbilecik.com",[369,370]],["kupbilecik.de",[369,370]],["kupbilecik.pl",[369,370]],["shopilya.com",371],["arera.it",372],["haustier-berater.de",372],["hfm-frankfurt.de",372],["zoommer.ge",373],["studentapan.se",374],["petcity.lt",[375,376,377,378]],["tobroco.com",[379,383]],["tobroco.nl",[379,383]],["tobroco-giant.com",[379,383]],["geosfreiberg.de",[380,381]],["eapvic.org",382],["bassolsenergia.com",382],["bammusic.com",[384,386,387]],["green-24.de",385],["phish-test.de",388],["bokadirekt.se",389],["ford.lt",390],["ford.pt",390],["ford.fr",390],["ford.de",390],["ford.dk",390],["ford.pl",390],["ford.se",390],["ford.nl",390],["ford.no",390],["ford.fi",390],["ford.gr",390],["ford.it",390],["data-media.gr",391],["e-food.gr",[392,393]],["bvmed.de",394],["babyshop.com",[395,396,397]],["griffbereit24.de",398],["checkwx.com",399],["calendardate.com",400],["wefashion.ch",401],["wefashion.fr",401],["wefashion.lu",401],["wefashion.be",401],["wefashion.de",401],["wefashion.nl",401],["brettspiel-angebote.de",[402,403]],["nio.com",404],["kancelarskepotreby.net",[405,406,407]],["segment-anything.com",408],["sketch.metademolab.com",409],["cambridgebs.co.uk",410],["freizeitbad-greifswald.de",411],["giuseppezanotti.com",[412,413,414]],["xcen.se",414],["biggreenegg.co.uk",415],["skihuette-oberbeuren.de",[416,417,418]],["pwsweather.com",419],["xfree.com",420],["theweathernetwork.com",[421,422]],["monese.com",[423,424,425]],["assos.com",423],["helmut-fischer.com",426],["myscience.org",427],["7-eleven.com",428],["airwallex.com",429],["streema.com",430],["gov.lv",431],["tise.com",432],["codecamps.com",433],["avell.com.br",434],["moneyfarm.com",435],["app.moneyfarm.com",435],["simpl.rent",436],["hubspot.com",437],["prodyna.com",[438,439,440,441]],["zutobi.com",[438,439,440,441]],["calm.com",[442,443]],["pubgesports.com",[444,445,446]],["outwrite.com",447],["sbermarket.ru",449],["atani.com",[450,451,452]],["croisieresendirect.com",453],["bgextras.co.uk",454],["sede.coruna.gal",455],["czech-server.cz",456],["hitech-gamer.com",457],["bialettikave.hu",[458,459,460]],["canalplus.com",[461,462,463]],["mader.bz.it",[464,465,466]],["supply.amazon.co.uk",467],["bhaptics.com",468],["cleverbot.com",469],["watchaut.film",470],["tuffaloy.com",471],["fanvue.com",471],["electronoobs.com",472],["xn--lkylen-vxa.se",473],["tiefenthaler-landtechnik.at",474],["tiefenthaler-landtechnik.ch",474],["tiefenthaler-landtechnik.de",474],["varma.fi",475],["vyos.io",476],["digimobil.es",[477,478]],["teenage.engineering",479],["merrell.pl",[480,742]],["converse.pl",480],["shop.wf-education.com",[480,742]],["werkenbijaswatson.nl",481],["converse.com",[482,483]],["buyandapply.nexus.org.uk",484],["img.ly",485],["halonen.fi",[485,517,518,519,520]],["carlson.fi",[485,517,518,519,520]],["cams.ashemaletube.com",[486,487]],["electronicacerler.com",[488,489,490]],["okpoznan.pl",[491,496]],["ielts.idp.com",492],["ielts.co.nz",492],["ielts.com.au",492],["einfach-einreichen.de",[493,494,495]],["endlesstools.io",497],["mbhszepkartya.hu",498],["casellimoveis.com.br",499],["embedplus.com",500],["e-file.pl",501],["sp215.info",502],["empik.com",503],["senda.pl",504],["united-camera.at",505],["befestigungsfuchs.de",505],["cut-tec.co.uk",506],["gaytimes.co.uk",507],["statisticsanddata.org",508],["hello.one",509],["paychex.com",510],["wildcat-koeln.de",511],["libraries.merton.gov.uk",[512,513]],["tommy.hr",[514,515]],["usit.uio.no",516],["demo-digital-twin.r-stahl.com",521],["la31devalladolid.com",[522,523]],["mx.com",524],["foxtrail.fjallraven.com",525],["dotwatcher.cc",526],["bazarchic.com",[527,528,529]],["seedrs.com",530],["mypensiontracker.co.uk",531],["praxisplan.at",[531,552]],["esimplus.me",532],["cineplanet.com.pe",533],["ecologi.com",534],["wamba.com",535],["eurac.edu",536],["akasaair.com",537],["rittal.com",538],["worstbassist.com",[539,540,541,542,543,544]],["zs-watch.com",545],["crown.com",546],["mesanalyses.fr",547],["teket.jp",548],["fish.shimano.com",[549,550,551]],["simsherpa.com",[553,554,555]],["translit.ru",556],["aruba.com",557],["aireuropa.com",558],["skfbearingselect.com",[559,560]],["scanrenovation.com",561],["ttela.se",562],["dominospizza.pl",563],["devagroup.pl",564],["secondsol.com",565],["angelifybeauty.com",566],["cotopaxi.com",567],["justjoin.it",568],["digibest.pt",569],["two-notes.com",570],["theverge.com",571],["daimant.co",572],["secularism.org.uk",573],["karriere-hamburg.de",574],["musicmap.info",575],["gasspisen.se",576],["medtube.pl",577],["medtube.es",577],["medtube.fr",577],["medtube.net",577],["standard.sk",578],["linmot.com",579],["larian.com",[579,864]],["s-court.me",579],["containerandpackaging.com",580],["top-yp.de",581],["termania.net",582],["account.nowpayments.io",583],["fizjobaza.pl",584],["gigasport.at",585],["gigasport.de",585],["gigasport.ch",585],["velleahome.gr",586],["nicequest.com",587],["handelsbanken.no",588],["handelsbanken.com",588],["handelsbanken.co.uk",588],["handelsbanken.se",[588,669]],["handelsbanken.dk",588],["handelsbanken.fi",588],["ilarahealth.com",589],["songtradr.com",[590,848]],["logo.pt",[591,592]],["flexwhere.co.uk",[593,595]],["flexwhere.de",[593,595]],["pricewise.nl",593],["getunleash.io",593],["dentmania.de",593],["free.navalny.com",593],["latoken.com",593],["empathy.com",594],["labs.epi2me.io",594],["campusbrno.cz",[597,598,599]],["secrid.com",600],["etsy.com",601],["careers.cloud.com",601],["blablacar.rs",602],["blablacar.ru",602],["blablacar.com.tr",602],["blablacar.com.ua",602],["blablacar.com.br",602],["seb.se",603],["sebgroup.com",603],["deps.dev",604],["buf.build",605],["starofservice.com",606],["ytcomment.kmcat.uk",607],["gmx.com",608],["gmx.fr",608],["karofilm.ru",609],["octopusenergy.it",610],["octopusenergy.es",[610,611]],["justanswer.es",612],["justanswer.de",612],["justanswer.com",612],["justanswer.co.uk",612],["citilink.ru",613],["huutokaupat.com",614],["kaggle.com",615],["emr.ch",[616,621]],["gem.cbc.ca",617],["pumatools.hu",618],["ici.tou.tv",619],["crunchyroll.com",620],["mayflex.com",622],["clipchamp.com",622],["trouwenbijfletcher.nl",622],["fletcher.nl",622],["fletcherzakelijk.nl",622],["intermatic.com",622],["ebikelohr.de",623],["eurosender.com",624],["melectronics.ch",625],["guard.io",626],["nokportalen.se",627],["dokiliko.com",628],["valamis.com",[629,630,631]],["sverigesingenjorer.se",632],["shop.almawin.de",[633,634,635,672]],["zeitzurtrauer.de",636],["skaling.de",[637,638,639]],["bringmeister.de",640],["gdx.net",641],["clearblue.com",642],["drewag.de",[643,644,645]],["enso.de",[643,644,645]],["buidlbox.io",643],["helitransair.com",646],["more.com",647],["nwslsoccer.com",647],["climatecentral.org",648],["resolution.de",649],["flagma.by",650],["eatsalad.com",651],["pacstall.dev",652],["web2.0calc.fr",653],["de-appletradein.likewize.com",654],["swissborg.com",655],["qwice.com",656],["canalpluskuchnia.pl",[657,658]],["uizard.io",659],["stmas.bayern.de",[660,663]],["novayagazeta.eu",661],["kinopoisk.ru",662],["yandex.ru",662],["go.netia.pl",[664,665]],["polsatboxgo.pl",[664,665]],["ing.it",[666,667]],["ing.nl",668],["youcom.com.br",670],["rule34.paheal.net",671],["deep-shine.de",672],["shop.ac-zaun-center.de",672],["kellermann-online.com",672],["kletterkogel.de",672],["pnel.de",672],["korodrogerie.de",672],["der-puten-shop.de",672],["katapult-shop.de",672],["evocsports.com",672],["esm-computer.de",672],["calmwaters.de",672],["mellerud.de",672],["akustik-projekt.at",672],["vansprint.de",672],["0815.at",672],["0815.eu",672],["ojskate.com",672],["der-schweighofer.de",672],["tz-bedarf.de",672],["zeinpharma.de",672],["weicon.com",672],["dagvandewebshop.be",672],["thiele-tee.de",672],["carbox.de",672],["riapsport.de",672],["trendpet.de",672],["eheizung24.de",672],["seemueller.com",672],["vivande.de",672],["heidegrill.com",672],["gladiator-fightwear.com",672],["h-andreas.com",672],["pp-parts.com",672],["natuerlich-holzschuhe.de",672],["massivart.de",672],["malermeister-shop.de",672],["imping-confiserie.de",672],["lenox-trading.at",672],["cklenk.de",672],["catolet.de",672],["drinkitnow.de",672],["patisserie-m.de",672],["storm-proof.com",672],["balance-fahrradladen.de",672],["magicpos.shop",672],["zeinpharma.com",672],["sps-handel.net",672],["novagenics.com",672],["butterfly-circus.de",672],["holzhof24.de",672],["w6-wertarbeit.de",672],["fleurop.de",672],["leki.com",672],["extremeaudio.de",672],["taste-market.de",672],["delker-optik.de",672],["stuhl24-shop.de",672],["g-nestle.de",672],["alpine-hygiene.ch",672],["fluidmaster.it",672],["cordon.de",672],["belisse-beauty.de",672],["belisse-beauty.co.uk",672],["wpc-shop24.de",672],["liv.si",672],["maybach-luxury.com",672],["leiternprofi24.de",672],["hela-shop.eu",672],["hitado.de",672],["j-koenig.de",672],["armedangels.com",[672,749,750]],["bvk-beamtenversorgung.de",673],["hofer-kerzen.at",674],["karls-shop.de",675],["byggern.no",676],["donauauen.at",677],["woltair.cz",678],["rostics.ru",679],["hife.es",680],["lilcat.com",681],["hot.si",[682,683,684,685]],["crenolibre.fr",686],["monarchmoney.com",687],["e-pole.pl",688],["dopt.com",689],["keb-automation.com",690],["bonduelle.ru",691],["oxfordonlineenglish.com",692],["pccomponentes.fr",693],["pccomponentes.com",693],["pccomponentes.pt",693],["grants.at",694],["africa-uninet.at",694],["rqb.at",694],["youngscience.at",694],["oead.at",694],["innovationsstiftung-bildung.at",694],["etwinning.at",694],["arqa-vet.at",694],["zentrumfuercitizenscience.at",694],["vorstudienlehrgang.at",694],["erasmusplus.at",694],["jeger.pl",695],["bo.de",696],["thegamingwatcher.com",697],["norlysplay.dk",698],["plusujemy.pl",699],["asus.com.cn",[700,702]],["zentalk.asus.com",[700,702]],["mubi.com",701],["59northwheels.se",703],["photospecialist.co.uk",704],["foto-gregor.de",704],["kamera-express.de",704],["kamera-express.be",704],["kamera-express.nl",704],["kamera-express.fr",704],["kamera-express.lu",704],["dhbbank.com",705],["dhbbank.de",705],["dhbbank.be",705],["dhbbank.nl",705],["login.ingbank.pl",706],["fabrykacukiernika.pl",[707,708]],["peaks.com",709],["3landesmuseen-braunschweig.de",710],["unifachbuch.de",[711,712,713]],["playlumi.com",[714,715,716]],["chatfuel.com",717],["studio3t.com",[718,719,720,721]],["realgap.co.uk",[722,723,724,725]],["hotelborgia.com",[726,727]],["sweet24.de",728],["zwembaddekouter.be",729],["flixclassic.pl",730],["jobtoday.com",731],["deltatre.com",[732,733,747]],["withings.com",[734,735,736]],["blista.de",[737,738]],["hashop.nl",739],["gift.be",[740,741]],["elevator.de",742],["foryouehealth.de",742],["animaze.us",742],["penn-elcom.com",742],["curantus.de",742],["mtbmarket.de",742],["spanienweinonline.ch",742],["novap.fr",742],["bizkaia.eus",[743,744,745]],["sinparty.com",746],["mantel.com",748],["e-dojus.lv",751],["burnesspaull.com",752],["oncosur.org",753],["photobooth.online",754],["epidemicsound.com",755],["ryanair.com",756],["refurbished.at",[757,758,759]],["refurbished.nl",[757,758,759]],["refurbished.be",[757,758,759]],["refurbishedstore.de",[757,758,759]],["bayernportal.de",[760,761,762]],["ayudatpymes.com",763],["zipjob.com",763],["shoutcast.com",763],["plastischechirurgie-muenchen.info",764],["bonn.sitzung-online.de",765],["depop.com",[766,767,768]],["thenounproject.com",769],["pricehubble.com",770],["ilmotorsport.de",771],["karate.com",772],["psbank.ru",772],["myriad.social",772],["exeedme.com",772],["aqua-store.fr",773],["voila.ca",774],["anastore.com",775],["app.arzt-direkt.de",776],["dasfutterhaus.at",777],["e-pity.pl",778],["fillup.pl",779],["dailymotion.com",780],["barcawelt.de",781],["lueneburger-heide.de",782],["polizei.bayern.de",[783,785]],["ourworldofpixels.com",784],["jku.at",786],["matkahuolto.fi",787],["backmarket.de",[788,789,790]],["backmarket.co.uk",[788,789,790]],["backmarket.es",[788,789,790]],["backmarket.be",[788,789,790]],["backmarket.at",[788,789,790]],["backmarket.fr",[788,789,790]],["backmarket.gr",[788,789,790]],["backmarket.fi",[788,789,790]],["backmarket.ie",[788,789,790]],["backmarket.it",[788,789,790]],["backmarket.nl",[788,789,790]],["backmarket.pt",[788,789,790]],["backmarket.se",[788,789,790]],["backmarket.sk",[788,789,790]],["backmarket.com",[788,789,790]],["eleven-sportswear.cz",[791,792,793]],["silvini.com",[791,792,793]],["silvini.de",[791,792,793]],["purefiji.cz",[791,792,793]],["voda-zdarma.cz",[791,792,793]],["lesgarconsfaciles.com",[791,792,793]],["ulevapronohy.cz",[791,792,793]],["vitalvibe.eu",[791,792,793]],["plavte.cz",[791,792,793]],["mo-tools.cz",[791,792,793]],["flamantonlineshop.cz",[791,792,793]],["sandratex.cz",[791,792,793]],["norwayshop.cz",[791,792,793]],["3d-foto.cz",[791,792,793]],["neviditelnepradlo.cz",[791,792,793]],["nutrimedium.com",[791,792,793]],["silvini.cz",[791,792,793]],["karel.cz",[791,792,793]],["silvini.sk",[791,792,793]],["book-n-drive.de",794],["cotswoldoutdoor.com",795],["cotswoldoutdoor.ie",795],["cam.start.canon",796],["usnews.com",797],["researchaffiliates.com",798],["singkinderlieder.de",799],["stiegeler.com",800],["ba.com",[803,804,805,806,807,808,809]],["britishairways.com",[803,804,805,806,807,808,809]],["cineman.pl",[810,811,812]],["tv-trwam.pl",[810,811,812,813]],["qatarairways.com",[814,815,816,817,818]],["wedding.pl",819],["vivaldi.com",820],["emuia1.gugik.gov.pl",821],["nike.com",822],["adidas.at",823],["adidas.be",823],["adidas.ca",823],["adidas.ch",823],["adidas.cl",823],["adidas.co",823],["adidas.co.in",823],["adidas.co.kr",823],["adidas.co.nz",823],["adidas.co.th",823],["adidas.co.uk",823],["adidas.com",823],["adidas.com.ar",823],["adidas.com.au",823],["adidas.com.br",823],["adidas.com.my",823],["adidas.com.ph",823],["adidas.com.vn",823],["adidas.cz",823],["adidas.de",823],["adidas.dk",823],["adidas.es",823],["adidas.fi",823],["adidas.fr",823],["adidas.gr",823],["adidas.ie",823],["adidas.it",823],["adidas.mx",823],["adidas.nl",823],["adidas.no",823],["adidas.pe",823],["adidas.pl",823],["adidas.pt",823],["adidas.ru",823],["adidas.se",823],["adidas.sk",823],["colourbox.com",824],["ebilet.pl",825],["myeventeo.com",826],["snap.com",827],["louwman.nl",[828,829]],["ratemyprofessors.com",830],["filen.io",831],["leotrippi.com",832],["restaurantclub.pl",832],["context.news",832],["queisser.de",832],["grandprixradio.dk",[833,834,835,836,837]],["grandprixradio.nl",[833,834,835,836,837]],["grandprixradio.be",[833,834,835,836,837]],["businessclass.com",838],["quantamagazine.org",839],["hellotv.nl",840],["jisc.ac.uk",841],["lasestrellas.tv",842],["xn--digitaler-notenstnder-m2b.com",843],["schoonmaakgroothandelemmen.nl",843],["nanuko.de",843],["hair-body-24.de",843],["shopforyou47.de",843],["kreativverliebt.de",843],["anderweltverlag.com",843],["octavio-shop.com",843],["forcetools-kepmar.eu",843],["fantecshop.de",843],["hexen-werkstatt.shop",843],["shop-naturstrom.de",843],["biona-shop.de",843],["camokoenig.de",843],["bikepro.de",843],["kaffeediscount.com",843],["vamos-skateshop.com",843],["holland-shop.com",843],["avonika.com",843],["royal-oak.org",844],["hurton.pl",845],["officesuite.com",846],["fups.com",[847,849]],["scienceopen.com",850],["moebel-mahler-siebenlehn.de",[851,852]],["calendly.com",853],["batesenvironmental.co.uk",[854,855]],["ubereats.com",856],["101internet.ru",857],["bein.com",858],["beinsports.com",858],["figshare.com",859],["bitso.com",860],["gallmeister.fr",861],["eco-toimistotarvikkeet.fi",862],["proficient.fi",862],["developer.ing.com",863],["webtrack.dhlglobalmail.com",865],["webtrack.dhlecs.com",865],["ehealth.gov.gr",866],["calvinklein.se",[867,868,869]],["calvinklein.fi",[867,868,869]],["calvinklein.sk",[867,868,869]],["calvinklein.si",[867,868,869]],["calvinklein.ch",[867,868,869]],["calvinklein.ru",[867,868,869]],["calvinklein.com",[867,868,869]],["calvinklein.pt",[867,868,869]],["calvinklein.pl",[867,868,869]],["calvinklein.at",[867,868,869]],["calvinklein.nl",[867,868,869]],["calvinklein.hu",[867,868,869]],["calvinklein.lu",[867,868,869]],["calvinklein.lt",[867,868,869]],["calvinklein.lv",[867,868,869]],["calvinklein.it",[867,868,869]],["calvinklein.ie",[867,868,869]],["calvinklein.hr",[867,868,869]],["calvinklein.fr",[867,868,869]],["calvinklein.es",[867,868,869]],["calvinklein.ee",[867,868,869]],["calvinklein.de",[867,868,869]],["calvinklein.dk",[867,868,869]],["calvinklein.cz",[867,868,869]],["calvinklein.bg",[867,868,869]],["calvinklein.be",[867,868,869]],["calvinklein.co.uk",[867,868,869]],["ofdb.de",870],["dtksoft.com",871],["serverstoplist.com",872],["truecaller.com",873],["fruugo.fi",877],["worldcupchampionships.com",878],["arturofuente.com",[878,880,881]],["protos.com",[878,880,881]],["timhortons.co.th",[878,879,880,882,884,885]],["toyota.co.uk",[878,879,880,883,884,885]],["businessaccountingbasics.co.uk",[878,879,880,882,884,885]],["flickr.org",[878,879,880,882,884,885]],["espacocasa.com",878],["altraeta.it",878],["centrooceano.it",878],["allstoresdigital.com",878],["cultarm3d.de",878],["soulbounce.com",878],["fluidtopics.com",878],["uvetgbt.com",878],["malcorentacar.com",878],["emondo.de",878],["maspero.it",878],["kelkay.com",878],["underground-england.com",878],["vert.eco",878],["turcolegal.com",878],["magnet4blogging.net",878],["moovly.com",878],["automationafrica.co.za",878],["jornaldoalgarve.pt",878],["keravanenergia.fi",878],["kuopas.fi",878],["frag-machiavelli.de",878],["healthera.co.uk",878],["mobeleader.com",878],["powerup-gaming.com",878],["developer-blog.net",878],["medical.edu.mt",878],["deh.mt",878],["bluebell-railway.com",878],["ribescasals.com",878],["javea.com",878],["chinaimportal.com",878],["inds.co.uk",878],["raoul-follereau.org",878],["serramenti-milano.it",878],["cosasdemujer.com",878],["luz-blanca.info",878],["cosasdeviajes.com",878],["safehaven.io",878],["havocpoint.it",878],["motofocus.pl",878],["nomanssky.com",878],["drei-franken-info.de",878],["clausnehring.com",878],["alttab.net",878],["kinderleicht.berlin",878],["kiakkoradio.fi",878],["cosasdelcaribe.es",878],["de-sjove-jokes.dk",878],["serverprofis.de",878],["biographyonline.net",878],["iziconfort.com",878],["sportinnederland.com",878],["natureatblog.com",878],["wtsenergy.com",878],["cosasdesalud.es",878],["internetpasoapaso.com",878],["zurzeit.at",878],["contaspoupanca.pt",878],["steamdeckhq.com",[878,879,880,882,884,885]],["ipouritinc.com",[878,880,882]],["hemglass.se",[878,880,882,884,885]],["sumsub.com",[878,879,880]],["atman.pl",[878,879,880]],["fabriziovanmarciano.com",[878,879,880]],["nationalrail.com",[878,879,880]],["eett.gr",[878,879,880]],["funkypotato.com",[878,879,880]],["equalexchange.co.uk",[878,879,880]],["swnsdigital.com",[878,879,880]],["gogolf.fi",[878,882]],["hanse-haus-greifswald.de",878],["tampereenratikka.fi",[878,880,886,887]],["kymppikatsastus.fi",[880,884,935,936]],["santander.rewardgateway.co.uk",[888,890]],["news.abs-cbn.com",889],["brasiltec.ind.br",891],["doka.com",[892,893,894]],["abi.de",[895,896]],["studienwahl.de",[895,896]],["journal.hr",[897,898,899,900]],["howstuffworks.com",901],["stickypassword.com",[902,903,904]],["conversion-rate-experts.com",[905,906]],["merkur.si",[907,908,909]],["petitionenligne.com",[910,911]],["petitionenligne.be",[910,911]],["petitionenligne.fr",[910,911]],["petitionenligne.re",[910,911]],["petitionenligne.ch",[910,911]],["skrivunder.net",[910,911]],["petitiononline.uk",[910,911]],["petitions.nz",[910,911]],["petizioni.com",[910,911]],["peticao.online",[910,911]],["skrivunder.com",[910,911]],["peticiones.ar",[910,911]],["petities.com",[910,911]],["petitionen.com",[910,911]],["petice.com",[910,911]],["opprop.net",[910,911]],["peticiok.com",[910,911]],["peticiones.net",[910,911]],["peticion.es",[910,911]],["peticiones.pe",[910,911]],["peticiones.mx",[910,911]],["peticiones.cl",[910,911]],["peticije.online",[910,911]],["peticiones.co",[910,911]],["mediathek.lfv-bayern.de",912],["aluypvc.es",[913,914,915]],["pracuj.pl",[916,917,918,919,920]],["vki.at",922],["konsument.at",922],["chollometro.com",923],["dealabs.com",923],["hotukdeals.com",923],["pepper.it",923],["pepper.pl",923],["preisjaeger.at",923],["mydealz.de",923],["220.lv",[924,925]],["pigu.lt",[924,925]],["kaup24.ee",[924,925]],["hansapost.ee",[924,925]],["hobbyhall.fi",[924,925]],["direct.travelinsurance.tescobank.com",[928,929,930,931,932,933,934,935]],["mediaite.com",937],["easyfind.ch",[938,939]],["e-shop.leonidas.com",[940,941]],["lastmile.lt",942],["veriff.com",943],["constantin.film",[944,945,946]],["notion.so",947],["omgevingsloketinzage.omgeving.vlaanderen.be",[948,949]],["primor.eu",950],["tameteo.com",951],["tempo.pt",951],["yourweather.co.uk",951],["meteored.cl",951],["meteored.mx",951],["tempo.com",951],["ilmeteo.net",951],["meteored.com.ar",951],["daswetter.com",951],["myprivacy.dpgmediagroup.net",952],["algarvevacation.net",953],["3sat.de",954],["oxxio.nl",[955,956]],["butterflyshop.dk",[957,958,959]],["praxis.nl",960],["brico.be",960],["kent.gov.uk",[961,962]],["pohjanmaanhyvinvointi.fi",963],["maanmittauslaitos.fi",964],["tvpworld.com",965]]);

const entitiesMap = new Map([["top4mobile",[19,20]]]);

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
