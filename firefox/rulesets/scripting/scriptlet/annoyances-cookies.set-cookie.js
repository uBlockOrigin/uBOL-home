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

const argsList = [["xn_cookieconsent","false","","reload","1"],["taunton_user_consent_submitted","true"],["taunton_user_consent_advertising","false"],["taunton_user_consent_analytics","false"],["cookie_consent_closed","1"],["CookieConsent","necessary"],["airTRFX_cookies","accepted"],["cookie_consent_accept","true"],["agree","true"],["vw_mms_hide_cookie_dialog","1"],["solo_opt_in","false"],["POMELO_COOKIES","1"],["AcceptUseCookie","Accept"],["sbrf.pers_notice","1"],["closedCookieBanner","true"],["yoyocookieconsent_viewed","true"],["privacy_policy_agreement","6","","reload","1"],["kinemaster-cookieconstent","1"],["cookie_acceptance","1"],["jazzfm-privacy","true"],["show_msg_cookies","false"],["CookieConsent","true","","reload","1"],["FunctionalCookie","true"],["AnalyticalCookie","false"],[".YourApp.ConsentCookie","yes","","reload","1"],["gdpr","deny"],["agreesWithCookies","true"],["rm-first-time-modal-welcome","1"],["cookieConsent-2023-03","false"],["CookieDisclaimer","1"],["twtr_pixel_opt_in","N"],["RBCookie-Alert","1"],["CookieConsentV4","false"],["cookieconsent_status","allow"],["cookies_analytics_enabled","0","","reload","1"],["xf_notice_dismiss","1"],["rcl_consent_given","true"],["rcl_preferences_consent","true"],["rcl_marketing_consent","false"],["confirmed-cookies","1","","reload","1"],["cb_validCookies","1"],["cb_accepted","1"],["ws-cookie-Techniques","true"],["cookie-agreed","2"],["consentIsSetByUser","true","","reload","1"],["isSiteCookieReviewed","0","","reload","1"],["phpbb3_4zn6j_ca","true"],["cookieBar-cookies-accepted","true"],["cookie_consent_user_accepted","true"],["__gitbook_cookie_granted","no"],["user_cookie_consent","false","","reload","1"],["cookies-marketing","N"],["gatsby-gdpr-google-tagmanager","false"],["uuAppCookiesAgreement","true"],["_cookies-consent","yes"],["RCI_APP_LEGAL_DISCLAIMER_COOKIE","false"],["hs_cookieconsent","true"],["cookiergpdjnz","1"],["__radicalMotorsport.ac","true"],["cookies_message_bar_hidden","true"],["acceptsCookies","false"],["accept_cookies","accepted"],["consent_seen","1"],["_gdpr_playbalatro","1"],["consentAll","0"],["cookiewarning","1","","reload","1"],["cookieBarSeen","true"],["cookie_consent_given","true"],["cuvva.app.website.cookie-policy.consent","1"],["custom-cookies-accepted","1","","reload","1"],["AnalyticsAcceptancePopOver","false"],["cookiecookie","1"],["disclaimer-overlay","true"],["complianceCookie","true"],["KeebSupplyCookieConsent","true"],["cookie_policy_agreement","true"],["kt_tcookie","1"],["splash_Page_Accepted","true"],["gdpr-analytics-enabled","false"],["privacy_status","1"],["privacy_settings","1"],["config","1","","reload","1"],["hideCookieNotification","true","","reload","1"],["has_accepted_gdpr","1"],["app-cookie-consents","1"],["analitics_cookies","0"],["tachyon-accepted-cookie-notice","true"],["defra-cookie-banner-dismissed","true","","reload","1"],["myAwesomeCookieName3","true"],["cookie-notification","ACCEPTED","","reload","1"],["loader","1"],["enableAnalyticsCookies","denied"],["acknowledgeCookieBanner","true"],["enableTargetingAdvertisingCookies","denied"],["cookiePolicy","1"],["cookie-agreed","0"],["crtmcookiesProtDatos","1","","reload","1"],["NADevGDPRCookieConsent_portal_2","1"],["handledCookieMessage","1"],["targeting","false"],["functionality","false"],["performance","false"],["cookie_info","1","","reload","1"],["bannerDissmissal","true","","reload","1"],["allowCookies","true"],["COOKIE-POLICY-ACCEPT","true"],["gdpr","accept"],["essentialCookie","Y"],["checkCookie","Y"],["analyticsCookie","N"],["marketingCookie","N"],["thirdCookie","N"],["paydirektCookieAllowed","false"],["hdcab","true"],["synapse-cookie-preferences-set","true"],["confirm_cookies","1"],["endgame-accept-policy","true"],["sc-privacy-settings","true"],["accept_cookies2","true","","reload","1"],["cf_consent","false"],["privacyCookie","1","","reload","1"],["cookieChoice","0"],["lgpdConsent","true"],["shareloft_cookie_decision","1"],["privacy_marketing","false"],["privacy_comodidade","false"],["acceptAnalyticsCookies","false"],["acceptFunctionalCookies","true"],["cookiePolicyConfirmed","true","","reload","1"],["PostAnalytics","0"],["gatsby-gdpr","false"],["functionalCookiesAccepted","true"],["necessaryCookies","true"],["comfortCookiesAccepted","false"],["statisticsCookiesAccepted","false"],["gdpr-google-analytics","false"],["cookie_policy","true"],["cookieModalAccept","no"],["AcceptFunctionalCookies","true"],["AcceptAnalyticsCookies","false"],["AcceptNonFunctionalCookies","false"],["forced-cookies-modal","2"],["cookiebar","1"],["cookieconsent_status","true"],["longines-cookiesstatus-analytics","false"],["longines-cookiesstatus-functional","false"],["longines-cookiesstatus-necessary","true"],["longines-cookiesstatus-social","false"],["pz_cookie_consent","true"],["_cb","1","","reload","1"],["consent-status","1"],["HANA-RGPD","accepted"],["cookie-optin","true"],["msg_cookie_CEX","true"],["OptanonAlertBoxClosed","ok"],["OptanonAlertBoxClosed","true"],["cookie-bar","0"],["cookieBannerHidden","true"],["isReadCookiePolicyDNT","true"],["isReadCookiePolicyDNTAa","false"],["coookieaccept","ok"],["consentTrackingVerified","true"],["consent","0"],["allowGetPrivacyInfo","true"],["cookiebanner","0"],["_tv_cookie_consent","y"],["_tv_cookie_choice","1"],["eika_consent_set","true"],["eika_consent_marketing","false"],["ew_cookieconsent","1"],["ew_cookieconsent_optin_b","true"],["ew_cookieconsent_optin_a","true"],["gdpr-agree-cookie","1","","reload","1"],["gdpr-consent-cookie-level3","1"],["gdpr-consent-cookie-level2","1"],["ck-cp","accepted"],["cookieConsent","1"],["consent-cookie","1"],["show_gdpr_cookie_message_388801234_cz","no"],["gsbbanner","0"],["__adblocker","false","","reload","1"],["cookies_marketing_ok","false"],["cookies_ok","true"],["acceptCookies","0"],["marketingCookies","false"],["CookieLaw_statistik 0"],["CookieLaw_komfort","0"],["CookieLaw_personalisierung","0"],["CookieLaw","on"],["wtr_cookie_consent","1"],["wtr_cookies_advertising","0"],["wtr_cookies_functional","0"],["wtr_cookies_analytics","0"],["allowTrackingCookiesKvK","0"],["cookieLevelCodeKVK","1"],["allowAnalyticsCookiesKvK","0"],["macfarlanes-necessary-cookies","accepted"],["TC_PRIVACY_CENTER","0"],["AllowCookies","false","","reload","1"],["consented","false"],["cookie_tou","1","","reload","1"],["blukit_novo","true"],["cr","true"],["gdpr_check_cookie","accepted","","reload","1"],["accept-cookies","accepted"],["dvag_cookies2023","1"],["consent_cookie","1"],["permissionExperience","false"],["permissionPerformance","false"],["permissionMarketing","false"],["consent_analytics","false"],["consent_received","true"],["cookieModal","false"],["user-accepted-AEPD-cookies","1"],["personalization-cookies-consent","0","","reload","1"],["analitics-cookies-consent","0"],["sscm_consent_widget","1"],["texthelp_cookie_consent_in_eu","0"],["texthelp_cookie_consent","yes"],["nc_cookies","accepted"],["nc_analytics","rejected"],["nc_marketing","rejected"],[".AspNet.Consent","yes","","reload","1"],[".AspNet.Consent","no","","reload","1"],["user_gave_consent","1"],["user_gave_consent_new","1"],["rt-cb-approve","true"],["CookieLayerDismissed","true"],["RODOclosed","true"],["cookieDeclined","1"],["cookieModal","true"],["oph-mandatory-cookies-accepted","true"],["cookies-accept","1"],["dw_is_new_consent","true"],["accept_political","1"],["konicaminolta.us","1"],["cookiesAnalyticsApproved","0"],["hasConfiguredCookies","1"],["cookiesPubliApproved","0"],["cookieAuth","1"],["kscookies","true"],["cookie-policy","true"],["cookie-use-accept","false"],["ga-disable-UA-xxxxxxxx-x","true"],["consent","1"],["acceptCookies","1"],["cookie-bar","no"],["CookiesAccepted","no"],["essential","true"],["cookieConfirm","true"],["trackingConfirm","false"],["cookie_consent","false"],["cookie_consent","true"],["uce-cookie","N"],["tarteaucitron","false"],["cookiePolicies","true"],["cookie_optin_q","false"],["ce-cookie","N"],["NTCookies","0"],["alertCookie","1","","reload","1"],["gdpr","1"],["hideCookieBanner","true"],["obligatory","true"],["marketing","false"],["analytics","false"],["cookieControl","true"],["plosCookieConsentStatus","false"],["user_accepted_cookies","1"],["analyticsAccepted","false"],["cookieAccepted","true"],["hide-gdpr-bar","true"],["promptCookies","1"],["_cDaB","1"],["_aCan_analytical","0"],["_aGaB","1"],["surbma-gpga","no"],["elrowCookiePolicy","yes"],["ownit_cookie_data_permissions","1"],["Cookies_Preferences","accepted"],["Cookies_Preferences_Analytics","declined"],["privacyPolicyAccepted","true"],["Cookies-Accepted","true"],["cc-accepted","2"],["cc-item-google","false"],["featureConsent","false","","reload","1"],["accept-cookie","no"],["consent","0","","reload","1"],["cookiePrivacyPreferenceBannerProduction","accepted"],["cookiesConsent","false"],["2x1cookies","1"],["firstPartyDataPrefSet","true"],["cookies-required","1","","reload","1"],["kh_cookie_level4","false"],["kh_cookie_level3","false"],["kh_cookie_level1","true"],["cookie_agreement","1","","reload","1"],["MSC_Cookiebanner","false"],["cookieConsent_marketing","false"],["Fitnessing21-15-9","0"],["cookies_popup","yes"],["cookieConsent_required","true","","reload","1"],["sa_enable","off"],["acceptcookietermCookieBanner","true"],["cookie_status","1","","reload","1"],["FTCookieCompliance","1"],["cookiePopupAccepted","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_ADS_OPTOUT","true"],["UBI_PRIVACY_POLICY_ACCEPTED","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["jocookie","false"],["cookieNotification.shown","1"],["localConsent","false"],["oai-allow-ne","false"],["consent","rejected"],["allow-cookie","1"],["cookie-functional","1"],["hulkCookieBarClick","1"],["CookieConsent","1"],["zoommer-cookie_agreed","true"],["accepted_cookie_policy","true"],["gdpr_cookie_token","1"],["_consent_personalization","denied"],["_consent_analytics","denied"],["_consent_marketing","denied"],["cookieWall","1"],["no_cookies","1"],["hidecookiesbanner","1"],["CookienatorConsent","false"],["cookieWallOptIn","0"],["analyticsCookiesAccepted","false"],["cf4212_cn","1"],["mediaCookiesAccepted","false"],["mandatoryCookiesAccepted","true"],["gtag","true"],["BokadirektCookiePreferencesMP","1"],["cookieAcknowledged","true"],["data-privacy-statement","true"],["cookie_privacy_level","required"],["accepted_cookies","true","","reload","1"],["MATOMO_CONSENT_GIVEN","0"],["BABY_MARKETING_COOKIES_CONSENTED","false"],["BABY_PERFORMANCE_COOKIES_CONSENTED","false"],["BABY_NECESSARY_COOKIES_CONSENTED","true"],["consent_essential","allow"],["cookieshown","1"],["warn","true"],["optinCookieSetting","1"],["privacy-shown","true"],["slimstat_optout_tracking","true"],["npp_analytical","0"],["inshopCookiesSet","true"],["adsCookies","false"],["performanceCookies","false"],["sa_demo","false"],["animated_drawings","true"],["cookieStatus","true"],["swgCookie","false"],["cookieConsentPreferencesGranted","1"],["cookieConsentMarketingGranted","0"],["cookieConsentGranted","1"],["cookies-rejected","true"],["NL_COOKIE_KOMFORT","false"],["NL_COOKIE_MEMORY","true","","reload","1"],["NL_COOKIE_STATS","false"],["pws_gdrp_accept","1"],["have18","1"],["pelm_cstate","1"],["pelm_consent","1"],["accept-cookies","true"],["accept-analytical-cookies","false"],["accept-marketing-cookies","false"],["cookie-level-v4","0"],["analytics_consent","yes"],["sei-ccpa-banner","true"],["awx_cookie_consent","true"],["cookie_warning","1"],["allowCookies","0"],["cookiePolicyAccepted","true"],["codecamps.cookiesConsent","true"],["cookiesConsent","true"],["consent_updated","true"],["acsr","1"],["__hs_gpc_banner_dismiss","true"],["cookieyes-necessary","yes"],["cookieyes-other","no"],["cky-action","yes"],["cookieyes-functional","no"],["has-declined-cookies","true","","reload","1"],["has-agreed-to-cookies","false"],["essential","Y"],["analytics","N"],["functional","N"],["gradeproof_shown_cookie_warning","true"],["sber.pers_notice_en","1"],["cookies_consented","yes"],["cookies_consent","true"],["cookies_consent","false"],["anal-opt-in","false"],["accepted","1"],["CB393_DONOTREOPEN","true"],["AYTO_CORUNA_COOKIES","1","","reload","1"],["I6IISCOOKIECONSENT0","n","","reload","1"],["htg_consent","0"],["cookie_oldal","1"],["cookie_marketing","0"],["cookie_jog","1"],["cp_cc_ads","0"],["cp_cc_stats","0"],["cp_cc_required","1"],["ae-cookiebanner","true"],["ae-esential","true"],["ae-statistics","false"],["ccs-supplierconnect","ACCEPTED"],["accepted_cookies","yes"],["note","1"],["cookieConsent","required"],["cookieConsent","accepted"],["pd_cc","1"],["gdpr_ok","necessary"],["allowTracking","false"],["varmafi_mandatory","true"],["VyosCookies","Accepted"],["analyticsConsent","false"],["adsConsent","false"],["te_cookie_ok","1"],["amcookie_policy_restriction","allowed"],["cookieConsent","allowed"],["dw_cookies_accepted","1"],["acceptConverseCookiePolicy","0"],["gdpr-banner","1"],["privacySettings","1"],["are_essential_consents_given","1"],["is_personalized_content_consent_given","1"],["acepta_cookies_funcionales","1"],["acepta_cookies_obligatorias","1"],["acepta_cookies_personalizacion","1"],["cookiepolicyinfo_new","true"],["acceptCookie","true"],["ee-hj","n"],["ee-ca","y","","reload","1"],["ee-yt","y"],["cookie_analytics","false"],["et_cookie_consent","true"],["cookieBasic","true"],["cookieMold","true"],["ytprefs_gdpr_consent","1"],["efile-cookiename-","1"],["plg_system_djcookiemonster_informed","1","","reload","1"],["cvc","true"],["cookieConsent3","true"],["acris_cookie_acc","1","","reload","1"],["termsfeed_pc1_notice_banner_hidden","true"],["cmplz_marketing","allowed"],["cmplz_marketing","allow"],["acknowledged","true"],["ccpaaccept","true"],["gdpr_shield_notice_dismissed","yes"],["luci_gaConsent_95973f7b-6dbc-4dac-a916-ab2cf3b4af11","false"],["luci_CookieConsent","true"],["ng-cc-necessary","1"],["ng-cc-accepted","accepted"],["PrivacyPolicyOptOut","yes"],["consentAnalytics","false"],["consentAdvertising","false"],["consentPersonalization","false"],["privacyExpiration","1"],["cookieconsent_status","deny"],["lr_cookies_tecnicas","accepted"],["cookies_surestao","accepted","","reload","1"],["hide-cookie-banner","1"],["fjallravenCookie","1"],["accept_cookie_policy","true"],["_marketing","0"],["_performance","0"],["RgpdBanner","1"],["seen_cookie_message","accepted"],["complianceCookie","on"],["cookieTermsDismissed","true"],["cookie-consent","1","","reload","1"],["cookie-consent","0"],["ecologi_cookie_consent_20220224","false"],["appBannerPopUpRulesCookie","true"],["eurac_cookie_consent","true"],["akasaairCookie","accepted"],["rittalCC","1"],["ckies_facebook_pixel","deny"],["ckies_google_analytics","deny"],["ckies_youtube","allow"],["ckies_cloudflare","allow"],["ckies_paypal","allow"],["ckies_web_store_state","allow"],["hasPolicy","Y"],["modalPolicyCookieNotAccepted","notaccepted"],["MANA_CONSENT","true"],["_ul_cookie_consent","allow"],["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["trackingCookies","off"],["acceptanalytics","no"],["acceptadvertising","no"],["acceptfunctional","yes"],["consent18","0","","reload","1"],["ATA.gdpr.popup","true"],["AIREUROPA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["privacyNoticeExpireDate","1"],["privacyNoticeAccepted","true"],["policy_accepted","1"],["stampen-cookies-hide-information","yes"],["dominos_cookies_accepted","1"],["deva_accepted","yes"],["cookies_consent","1"],["cookies_modal","true"],["cookie_notice","1"],["cookiesPopup","1"],["digibestCookieInfo","true"],["cookiesettings_status","allow"],["_duet_gdpr_acknowledged","1"],["daimant_collective","accept","","reload","1"],["cookies-notice","1","","reload","1"],["banner","2","","reload","1"],["privacy-policy-2023","accept"],["user_cookie_consent","false"],["cookiePolicy","4"],["standard_gdpr_consent","true"],["cookie_accept","true"],["cookieBanner","true"],["tncookieinfo","1","","reload","1"],["agree_with_cookies","1"],["cookie-accepted","true"],["cookie-accepted","yes"],["consentAll","1"],["hide_cookies_consent","1"],["nicequest_optIn","1"],["shb-consent-cookies","false"],["cookies-accepted","true","","reload","1"],["cpaccepted","true"],["cookieMessageDismissed","1"],["LG_COOKIE_CONSENT","0"],["CookieConsent","true"],["CookieConsent","false"],["gatsby-plugin-google-tagmanager","false"],["wtr_cookies_functional","1"],["cookie-m-personalization","0"],["cookie-m-marketing","0"],["cookie-m-analytics","0"],["cookies","true"],["ctc_rejected","1"],["_cookies_v2","1"],["AcceptedCookieCategories","1"],["cookie_policy_acknowledgement","true"],["allowCookies","yes"],["cookieNotification","true"],["privacy","true"],["euconsent-bypass","1"],["cookie_usage","yes"],["dismissCookieBanner","true"],["switchCookies","1"],["cbChecked","true"],["infoCookieUses","true"],["consent-data-v2","0"],["ACCEPTED_COOKIES","true"],["EMR-CookieConsent-Analytical","0","","reload","1"],["gem_cookies_usage_production","1"],["cookie_level","2"],["toutv_cookies_usage_production","1"],["_evidon_suppress_notification_cookie","1"],["EMR-CookieConsent-Advertising","0"],["acceptCookies","true"],["COOKIES_NEWACCEPTED","1"],["es_cookie_settings_closed","1"],["cookie-banner-acceptance-state","true"],["cookie_consent_seen","1"],["cookies_allowed","yes"],["tracking","0"],["valamis_cookie_message","true","","reload","1"],["valamis_cookie_marketing","false"],["valamis_cookie_analytics","false"],["approvedcookies","no","","reload","1"],["psd-google-ads-enabled","0"],["psd-gtm-activated","1"],["wishlist-enabled","1"],["consentInteract","true"],["cookie-byte-consent-essentials","true"],["cookie-byte-consent-showed","true"],["cookie-byte-consent-statistics","false"],["bm_acknowledge","yes"],["genovaPrivacyOptions","1","","reload","1"],["kali-cc-agreed","true"],["cookiesAccepted","true"],["allowMarketingCookies","false"],["allowAnalyticalCookies","false"],["privacyLevel","2","","reload","1"],["AcceptedCookies","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["privacyLevel","flagmajob_ads_shown","1","","reload","1"],["userCookies","true"],["privacy-policy-accepted","1"],["precmp","1","","reload","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["statistik","0"],["cookies-informer-close","true"],["gdpr","0"],["required","1"],["rodo-reminder-displayed","1"],["rodo-modal-displayed","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["cookie-preference","1","","reload","1"],["cookie-preference-v3","1"],["consent","true"],["cookies_accepted","yes"],["cookies_accepted","false"],["CM_BANNER","false"],["set-cookie","cookieAccess","1"],["hife_eu_cookie_consent","1"],["cookie-consent","accepted"],["permission_marketing_cookies","0"],["permission_statistic_cookies","0"],["permission_funktional_cookies","1"],["cookieconsent","1"],["cookieconsent","true"],["epole_cookies_settings","true"],["dopt_consent","false"],["privacy-statement-accepted","true","","reload","1"],["cookie_locales","true"],["ooe_cookie_policy_accepted","no"],["accept_cookie","1"],["cookieconsent_status_new","1"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-accepted","false"],["isReadCookiePolicyDNTAa","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["cookie_accepted","1"],["cookie_accepted","false","","reload","1"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["allow_cookie","false"],["3LM-Cookie","false"],["i_sc_a","false"],["i_cm_a","false"],["i_c_a","true"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["cookieconsent_statistics","no"],["cookieconsent_essential","yes"],["cookie_preference","1"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie-preferences-technical","yes"],["tracking_cookie","1"],["cookie_consent_group_technical","1"],["cookie-preference_renew10","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["cookie_accepted","true"],["hasSeenCookieDisclosure","true"],["RY_COOKIE_CONSENT","true"],["COOKIE_CONSENT","1","","reload","1"],["COOKIE_STATIC","false"],["COOKIE_MARKETING","false"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookie_consent","1"],["ff_cookie_notice","1"],["allris-cookie-msg","1"],["gdpr__google__analytics","false"],["gdpr__facebook__social","false"],["gdpr__depop__functional","true"],["cookie_consent","1","","reload","1"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["cookie-consent","true"],["abz_seo_choosen","1"],["privacyAccepted","true"],["cok","1","","reload","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["CookieConsentV2","YES"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["cookie_consent_user_accepted","false"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Marketing","0"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Analytics","0"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","0"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree_0124","1"],["cookiesPolicy20211101","1"],["sc-cookies-accepted","true"],["marketing_cookie_akkoord","0"],["site_cookie_akkoord","1"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["analytics_cookies","0"],["cookies_accepted","1","","reload","1"],["tracking_cookies","0"],["advertisement-age-show-alcohol","false"],["advertisement-age-show-gamble","false"],["ibe.acceptedCookie","true"],["acceptedPolicy","true"],["cookie-consent","false"],["cookieConsentClosed","true"],["cookiesPrivacy","false"],["_tvsPrivacy","true"],["epCookieConsent","0","","reload","1"],["royaloakTermsCookie","1"],["is_allowed_client_traking_niezbedne","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["cpaccpted","true"],["AllowCookies","true"],["cookiesAccepted","3"],["optOutsTouched","true"],["optOutAccepted","true"],["gdpr_dismissal","true"],["analyticsCookieAccepted","0"],["cookieAccepted","0"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["use_cookie","1"],["figshareCookiesAccepted","true"],["bitso_cc","1"],["eg_asked","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookie_analytcs","false","","reload","1"],["dhl-webapp-track","allowed"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["ofdb_werbung","Y","","reload","1"],["user_cookie_consent","1"],["STAgreement","1"],["tc:dismissexitintentpopup","true"],["functionalCookies","true"],["contentPersonalisationCookies","false"],["statisticalCookies","false"],["viewed_cookie_policy","yes","","reload","1"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["cookielawinfo-checkbox-non-necessary","no"],["cookielawinfo-checkbox-advertisement","no"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-analytics","no"],["cookielawinfo-checkbox-performance","no"],["cookielawinfo-checkbox-markkinointi","no"],["cookielawinfo-checkbox-tilastointi","no"],["cookie_accept","1"],["hide_cookieoverlay_v2","1","","reload","1"],["socialmedia-cookies_allowed_v2","0"],["performance-cookies_allowed_v2","0"],["mrm_gdpr","1"],["necessary_consent","accepted"],["__cookie_consent","false"],["jour_cookies","1"],["jour_functional","true"],["jour_analytics","false"],["jour_marketing","false"],["gdpr_opt_in","1"],["ad_storage","denied"],["stickyCookiesSet","true"],["analytics_storage","denied"],["user_experience_cookie_consent","false"],["marketing_cookie_consent","false"],["cookie_notice_dismissed","yes"],["cookie_analytics_allow","no"],["mer_cc_dim_rem_allow","no"],["num_times_cookie_consent_banner_shown","1"],["cookie_consent_banner_shown_last_time","1"],["privacy_hint","1"],["cookiesConsent","1"],["cookiesStatistics","0"],["cookiesPreferences","0"],["gpc_v","1"],["gpc_ad","0"],["gpc_analytic","0"],["gpc_audience","0"],["gpc_func","0"],["OptanonAlertBoxClosed","1"],["vkicookieconsent","0"],["cookie_policy_agreement","3"],["internalCookies","false"],["essentialsCookies","true"],["TESCOBANK_ENSIGHTEN_PRIVACY_Advertising","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Experience","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Measurement","0"],["viewed_cookie_policy","yes"],["cookielawinfo-checkbox-toiminnalliset-evasteet","yes"],["allow-marketing","false"],["allow-analytics","false"],["cc_analytics","0"],["cc_essential","1"],["__consent","%5B%22required%22%5D"],["veriff_cookie_consent_completed","true"],["external-data-googlemaps-is-enabled","true"],["external-data-youtube-is-enabled","true"],["external-data-spotify-is-enabled","true"],["notion_check_cookie_consent","true"],["vl-cookie-consent-cookie-consent","true"],["vl-cookie-consent-functional","true"],["amcookie_allowed","0"],["euconsent-v2-addtl","0"],["dummy","1","","reload","1"],["acepta_cookie","acepta"],["3sat_cmp_configuration","true"],["privacyConsent_version","1","","reload","1"],["privacyConsent","false"],["DDCookiePolicy-consent-functional","false"],["DDCookiePolicy-consent-tracking","false"],["DDCookiePolicy-consent-statistics","false"],["CookieNotificationSeen","1","","reload","1"],["cookie-management-preferences-set","true"],["cookie-management-version","1"],["show-cookie-banner","1"],["mml-cookie-agreed","2"]];

const hostnamesMap = new Map([["portal.payment.eltax.lta.go.jp",0],["greenbuildingadvisor.com",[1,2,3]],["finewoodworking.com",[1,2,3]],["privatekeys.pw",4],["srf.nu",5],["airnewzealand.co.nz",6],["viu.com",7],["dinamalar.com",8],["volkswagen-group.com",9],["solo.io",10],["pomelo.la",11],["ibuypower.com",12],["sberbank.com",[13,394]],["swissmilk.ch",14],["gamemaker.io",15],["pixiv.net",16],["kinemaster.com",17],["sp32bb.pl",18],["jazz.fm",19],["juntadeandalucia.es",20],["melee.gg",[21,22,23]],["chemocare.com",24],["mobiliteit.nl",25],["xledger.net",26],["reviewmeta.com",27],["guide-bordeaux-gironde.com",28],["travelinsured.com",29],["gdpr.twitter.com",30],["mora.hu",31],["confused.com",32],["physikinstrumente.de",33],["karlknauer.de",33],["schoeck.com",33],["resonate.coop",33],["northgatevehiclehire.ie",33],["badhall.at",33],["cic.ch",33],["ilsaggiatore.com",34],["forum.digitalfernsehen.de",35],["bitscrunch.com",[36,37,38]],["hannahgraaf.com",39],["shop.elbers-hof.de",[40,41]],["woolsocks.eu",42],["uza.be",43],["5asec.ch",43],["wizards.com",43],["parkenflughafen.de",44],["radyofenomen.com",45],["elsate.com",46],["hume.ai",47],["lotusantwerp.wacs.online",48],["simeononsecurity.gitbook.io",49],["thehacker.recipes",49],["docs.dyrector.io",49],["makeresearchpay.com",50],["tandartsenpraktijk-simons.tandartsennet.nl",51],["huisartsenpraktijkdoorn.nl",51],["bcorporation.net",52],["knime.com",[52,95]],["quebueno.es",52],["edookit.com",53],["trixonline.be",54],["radio-canada.ca",55],["heysummit.com",56],["puromarketing.com",57],["radicalmotorsport.com",58],["biurobox.pl",59],["cycling74.com",60],["triviacreator.com",61],["freshis.com",61],["anker.com",61],["computacenter.com",62],["playbalatro.com",63],["kastner-oehler.de",64],["kastner-oehler.at",64],["kastner-oehler.ch",64],["twenga.it",65],["twenga.fr",65],["twenga.co.uk",65],["twenga.de",65],["twenga.es",65],["twenga.pl",65],["twenga.nl",65],["twenga.se",65],["olx.kz",66],["efl.com",67],["wst.tv",67],["cuvva.com",68],["vitbikes.de",69],["gourmetfoodstore.com",70],["schulfahrt.de",71],["deutsche-finanzagentur.de",72],["thejazzcafelondon.com",73],["keeb.supply",74],["spb.hh.ru",75],["kaluga.hh.ru",75],["school.hh.ru",75],["rating.hh.ru",75],["novgorod.hh.ru",75],["xxxshemaleporn.com",[76,77]],["gayhits.com",[76,77]],["gaypornvideos.xxx",[76,77]],["sextubespot.com",[76,77]],["wewantjusticedao.org",78],["godbolt.org",79],["projectenglish.com.pl",[80,85]],["ledenicheur.fr",80],["pricespy.co.uk",80],["pricespy.co.nz",80],["sae.fsc.ccoo.es",81],["piusx-college.nl",82],["yoomoney.ru",83],["vod.warszawa.pl",84],["m.twitch.tv",86],["environment.data.gov.uk",87],["playtesting.games",88],["portal.by.aok.de",89],["umlandscout.de",90],["atombank.co.uk",[91,92,93]],["showtv.com.tr",94],["seventhgeneration.com",95],["press.princeton.edu",95],["ldz.lv",95],["crtm.es",96],["airastana.com",97],["vkf-renzel.nl",98],["booking.reederei-zingst.de",[99,100,101]],["booking.weisse-flotte.de",[99,100,101]],["booking2.reederei-hiddensee.de",[99,100,101]],["sanswiss.pl",102],["galaxy.com",103],["petdesk.com",104],["ivyexec.com",105],["railtech.com",106],["lottehotel.com",[107,108,109,110,111]],["paydirekt.de",112],["kijiji.ca",113],["posterstore.fr",114],["posterstore.eu",114],["posterstore.be",114],["posterstore.de",114],["posterstore.hu",114],["posterstore.ie",114],["posterstore.it",114],["posterstore.no",114],["posterstore.nl",114],["posterstore.pl",114],["posterstore.com",114],["posterstore.ae",114],["posterstore.ca",114],["posterstore.nz",114],["posterstore.es",114],["posterstore.kr",114],["posterstore.jp",114],["posterstore.dk",114],["posterstore.se",114],["posterstore.ch",114],["posterstore.at",114],["myriadicity.net",115],["dgsf.org",115],["endgame.id",116],["cashback-cards.ch",117],["swisscard.ch",117],["ahorn24.de",118],["blockdyor.com",119],["ticket.io",120],["omega-nuernberg.servicebund.com",121],["lojaboschferramentas.com.br",[122,124,125]],["shareloft.com",123],["fineartsmuseum.recreatex.be",[126,127,128]],["jaapeden.nl",[126,127,128]],["eboo.lu",129],["lasmallagency.com",130],["lhsystems.com",[131,132,133,134]],["twomates.de",135],["intergiro.com",136],["healthygamer.gg",137],["telepizza.es",[138,139,140]],["telepizza.pt",[138,139,140]],["frisco.pl",141],["tyleenslang.nl",142],["schrikdraad.net",142],["kruiwagen.net",142],["pvcvoordeel.nl",142],["pvcbuis.com",142],["drainagebuizen.nl",142],["likewise.com",143],["longines.com",[144,145,146,147]],["vater-it.de",148],["biano.hu",149],["nadia.gov.gr",150],["hana-book.fr",151],["kzvb.de",152],["correosexpress.com",153],["cexpr.es",153],["rte.ie",154],["smart.com",155],["gry.pl",155],["gamesgames.com",155],["games.co.uk",155],["jetztspielen.de",155],["ourgames.ru",155],["permainan.co.id",155],["gioco.it",155],["jeux.fr",155],["juegos.com",155],["ojogos.com.br",155],["oyunskor.com",155],["spela.se",155],["spelletjes.nl",155],["agame.com",155],["spielen.com",155],["flashgames.ru",155],["games.co.id",155],["giochi.it",155],["jeu.fr",155],["spel.nl",155],["sartor-stoffe.de",156],["rockpoint.cz",156],["rockpoint.sk",156],["parfum-zentrum.de",156],["candy-store.cz",156],["tridge.com",157],["asus.com",[158,159]],["drinksking.sk",160],["neuhauschocolates.com",161],["commandsuite.it",162],["oktea.tw",163],["bafin.de",164],["materna.de",164],["bamf.de",164],["tenvinilo-argentina.com",[165,166]],["eikaforsikring.no",[167,168]],["eurowings.com",[169,170,171]],["newpharma.be",[172,173,174]],["newpharma.fr",[172,173,174]],["newpharma.de",[172,173,174]],["newpharma.at",[172,173,174]],["newpharma.nl",[172,173,174]],["kapoorwatch.com",175],["instantoffices.com",176],["paf.se",176],["citibank.pl",176],["citibankonline.pl",176],["azertyfactor.be",177],["zelezodum.cz",178],["thw.de",179],["bafa.de",179],["bka.de",179],["bmbf.de",179],["weather.com",180],["bolist.se",[181,182]],["project529.com",182],["evivanlanschot.nl",183],["prenatal.nl",184],["onnibus.com",[184,821,822,823]],["kyoceradocumentsolutions.us",[184,868,869]],["kyoceradocumentsolutions.ch",[184,868,869]],["kyoceradocumentsolutions.co.uk",[184,868,869]],["kyoceradocumentsolutions.de",[184,868,869]],["kyoceradocumentsolutions.es",[184,868,869]],["kyoceradocumentsolutions.eu",[184,868,869]],["kyoceradocumentsolutions.fr",[184,868,869]],["kyoceradocumentsolutions.it",[184,868,869]],["kyoceradocumentsolutions.ru",[184,868,869]],["kyoceradocumentsolutions.mx",[184,868,869]],["kyoceradocumentsolutions.cl",[184,868,869]],["kyoceradocumentsolutions.com.br",[184,868,869]],["wagner-tuning.com",[185,186,187,188]],["waitrosecellar.com",[189,190,191,192]],["waitrose.com",[189,543]],["kvk.nl",[193,194,195]],["macfarlanes.com",196],["pole-emploi.fr",197],["gardenmediaguild.co.uk",198],["samplerite.com",199],["samplerite.cn",199],["sororedit.com",200],["blukit.com.br",201],["biegnaszczyt.pl",202],["staff-gallery.com",203],["itv.com",204],["dvag.de",205],["premierinn.com",[206,207,208,209]],["whitbreadinns.co.uk",[206,207,208,209]],["barandblock.co.uk",[206,207,208,209]],["tabletable.co.uk",[206,207,208,209]],["brewersfayre.co.uk",[206,207,208,209]],["beefeater.co.uk",[206,207,208,209]],["allstarssportsbars.co.uk",[210,211]],["babiesrus.ca",212],["toysrus.ca",212],["roomsandspaces.ca",212],["athletic-club.eus",[213,214,215]],["wattoo.dk",216],["wattoo.no",216],["texthelp.com",[217,218]],["courierexchange.co.uk",[219,220,221]],["haulageexchange.co.uk",[219,220,221]],["ecaytrade.com",222],["powerball.com",223],["tlaciarik.sk",223],["tiskarik.cz",223],["sseriga.edu",[224,225]],["rt.com",226],["swrng.de",227],["crfop.gdos.gov.pl",228],["nurgutes.de",229],["kpcen-torun.edu.pl",230],["opintopolku.fi",231],["app.erevie.pl",232],["debenhams.com",233],["archiwumalle.pl",234],["konicaminolta.ca",235],["konicaminolta.us",235],["deutschebank-dbdirect.com",[236,237,238]],["dbonline.deutsche-bank.es",[236,237,238]],["deutsche-bank.es",[236,237,238]],["hipotecaonline.db.com",239],["kangasalansanomat.fi",240],["eif.org",241],["tunnelmb.net",241],["sugi-net.jp",242],["understandingsociety.ac.uk",243],["leibniz.com",244],["horecaworld.biz",[244,512]],["horecaworld.be",[244,512]],["bettertires.com",244],["electroprecio.com",244],["autohero.com",244],["computerbase.de",[244,865]],["sistemacomponentes.com.br",245],["bargaintown.ie",246],["tui.nl",247],["doppelmayr.com",248],["case-score.com",[249,250]],["cote.co.uk",251],["finimize.com",251],["blxxded.com",252],["rtu.lv",253],["sysdream.com",254],["cinemarkca.com",255],["neander-zahn.de",256],["theadelphileeds.co.uk",257],["tobycarvery.co.uk",257],["carsupermarket.com",257],["viajesatodotren.com",258],["ticketingcine.fr",259],["agenziavista.it",260],["e-chladiva.cz",260],["bitecode.dev",261],["mjob.si",[262,263,264]],["airportrentacar.gr",265],["mobile-fueling.de",265],["plos.org",266],["autohaus24.de",267],["sixt-neuwagen.de",267],["gadis.es",[268,269]],["dom.ru",269],["ford-kimmerle-reutlingen.de",270],["autohaus-reitermayer.de",270],["autohaus-diefenbach-waldbrunn.de",270],["autohaus-diefenbach.de",270],["autohaus-musberg.de",270],["ford-ah-im-hunsrueck-simmern.de",270],["ford-arndt-goerlitz.de",270],["ford-autogalerie-alfeld.de",270],["ford-bacher-schrobenhausen.de",270],["ford-bathauer-bad-harzburg.de",270],["ford-behrend-waren.de",270],["ford-bergland-frankfurt-oder.de",270],["ford-bergland-wipperfuerth.de",270],["ford-besico-glauchau.de",270],["ford-besico-nuernberg.de",270],["ford-bischoff-neumuenster.de",270],["ford-bodach-borgentreich.de",270],["ford-bunk-saarbruecken.de",270],["ford-bunk-voelklingen.de",270],["ford-busch-kirchberg.de",270],["ford-diermeier-muenchen.de",270],["ford-dinnebier-leipzig.de",270],["ford-duennes-regensburg.de",270],["ford-fischer-bochum.de",270],["ford-fischer-muenster.de",270],["ford-foerster-koblenz.de",270],["ford-fuchs-uffenheim.de",270],["ford-geberzahn-koeln.de",270],["ford-gerstmann-duesseldorf.de",270],["ford-haefner-und-strunk-kassel.de",270],["ford-hartmann-kempten.de",270],["ford-hartmann-rastatt.de",270],["ford-hatzner-karlsruhe.de",270],["ford-heine-hoexter.de",270],["ford-hentschel-hildesheim.de",270],["ford-hessengarage-dreieich.de",270],["ford-hessengarage-frankfurt.de",270],["ford-hga-windeck.de",270],["ford-hommert-coburg.de",270],["ford-horstmann-rastede.de",270],["ford-janssen-sonsbeck.de",270],["ford-jochem-stingbert.de",270],["ford-jungmann-wuppertal.de",270],["ford-kestel-marktzeuln.de",270],["ford-klaiber-bad-friedrichshall.de",270],["ford-koenig-eschwege.de",270],["ford-kohlhoff-mannheim.de",270],["ford-kt-automobile-coesfeld.de",270],["ford-lackermann-wesel.de",270],["ford-ludewig-delligsen.de",270],["ford-maiwald-linsengericht.de",270],["ford-mertens-beckum.de",270],["ford-meyer-bad-oeynhausen.de",270],["ford-mgs-bayreuth.de",270],["ford-mgs-radebeul.de",270],["ford-muecke-berlin.de",270],["ford-norren-weissenthurm.de",270],["ford-nrw-garage-duesseldorf.de",270],["ford-nrw-garage-handweiser.de",270],["ford-nuding-remshalden.de",270],["ford-ohm-rendsburg.de",270],["ford-reinicke-muecheln.de",270],["ford-rennig.de",270],["ford-roerentrop-luenen.de",270],["ford-schankola-dudweiler.de",270],["ford-sg-goeppingen.de",270],["ford-sg-leonberg.de",270],["ford-sg-neu-ulm.de",270],["ford-sg-pforzheim.de",270],["ford-sg-waiblingen.de",270],["ford-storz-st-georgen.de",270],["ford-strunk-koeln.de",270],["ford-tobaben-hamburg.de",270],["ford-toenjes-zetel.de",270],["ford-wagner-mayen.de",270],["ford-wahl-fritzlar.de",270],["ford-wahl-siegen.de",270],["ford-weege-bad-salzuflen.de",270],["ford-westhoff-hamm.de",270],["ford-wieland-hasbergen.de",270],["renault-autocenterprignitz-pritzwalk.de",270],["renault-spenrath-juelich.de",270],["vitalllit.com",271],["fincaparera.com",271],["dbnetbcn.com",271],["viba.barcelona",271],["anafaustinoatelier.com",271],["lamparasherrero.com",271],["calteixidor.cat",271],["argentos.barcelona",271],["anmarlube.com",271],["anynouxines.barcelona",271],["crearunapaginaweb.cat",271],["cualesmiip.com",271],["porndoe.com",[272,273,274]],["thinkingaustralia.com",275],["elrow.com",276],["ownit.se",277],["velo-antwerpen.be",[278,279]],["wwnorton.com",280],["pc-canada.com",281],["mullgs.se",282],["1a-sehen.de",283],["feature.fm",284],["comte.com",285],["baltic-watches.com",286],["np-brijuni.hr",286],["vilgain.com",286],["tradingview.com",287],["wevolver.com",288],["experienciasfree.com",289],["freemans.com",290],["kivikangas.fi",291],["lumingerie.com",291],["melkkobrew.fi",291],["kh.hu",[292,293,294]],["aplgo.com",295],["securityconference.org",296],["aha.or.at",[297,300]],["fantasyfitnessing.com",298],["chocolateemporium.com",299],["account.samsung.com",301],["crushwineco.com",302],["levi.pt",303],["fertagus.pt",304],["smiggle.co.uk",305],["ubisoft.com",[306,307,308,309]],["store.ubisoft.com",[306,309,747,748]],["thulb.uni-jena.de",310],["splityourticket.co.uk",311],["eramba.org",312],["openai.com",[313,314]],["kupbilecik.com",[315,316]],["kupbilecik.de",[315,316]],["kupbilecik.pl",[315,316]],["shopilya.com",317],["arera.it",318],["haustier-berater.de",318],["hfm-frankfurt.de",318],["zoommer.ge",319],["studentapan.se",320],["petcity.lt",[321,322,323,324]],["tobroco.com",[325,329]],["tobroco.nl",[325,329]],["tobroco-giant.com",[325,329]],["geosfreiberg.de",[326,327]],["eapvic.org",328],["bassolsenergia.com",328],["bammusic.com",[330,332,333]],["green-24.de",331],["phish-test.de",334],["bokadirekt.se",335],["ford.lt",336],["ford.pt",336],["ford.fr",336],["ford.de",336],["ford.dk",336],["ford.pl",336],["ford.se",336],["ford.nl",336],["ford.no",336],["ford.fi",336],["ford.gr",336],["ford.it",336],["data-media.gr",337],["e-food.gr",[338,339]],["bvmed.de",340],["babyshop.com",[341,342,343]],["griffbereit24.de",344],["checkwx.com",345],["calendardate.com",346],["wefashion.ch",347],["wefashion.fr",347],["wefashion.lu",347],["wefashion.be",347],["wefashion.de",347],["wefashion.nl",347],["brettspiel-angebote.de",[348,349]],["nio.com",350],["kancelarskepotreby.net",[351,352,353]],["segment-anything.com",354],["sketch.metademolab.com",355],["cambridgebs.co.uk",356],["freizeitbad-greifswald.de",357],["giuseppezanotti.com",[358,359,360]],["xcen.se",360],["biggreenegg.co.uk",361],["skihuette-oberbeuren.de",[362,363,364]],["pwsweather.com",365],["xfree.com",366],["theweathernetwork.com",[367,368]],["monese.com",[369,370,371]],["assos.com",369],["helmut-fischer.com",372],["myscience.org",373],["7-eleven.com",374],["airwallex.com",375],["streema.com",376],["gov.lv",377],["tise.com",378],["codecamps.com",379],["avell.com.br",380],["moneyfarm.com",381],["app.moneyfarm.com",381],["simpl.rent",382],["hubspot.com",383],["prodyna.com",[384,385,386,387]],["zutobi.com",[384,385,386,387]],["calm.com",[388,389]],["pubgesports.com",[390,391,392]],["outwrite.com",393],["sbermarket.ru",395],["atani.com",[396,397,398]],["croisieresendirect.com",399],["bgextras.co.uk",400],["sede.coruna.gal",401],["czech-server.cz",402],["hitech-gamer.com",403],["bialettikave.hu",[404,405,406]],["canalplus.com",[407,408,409]],["mader.bz.it",[410,411,412]],["supply.amazon.co.uk",413],["bhaptics.com",414],["cleverbot.com",415],["watchaut.film",416],["tuffaloy.com",417],["fanvue.com",417],["electronoobs.com",418],["xn--lkylen-vxa.se",419],["tiefenthaler-landtechnik.at",420],["tiefenthaler-landtechnik.ch",420],["tiefenthaler-landtechnik.de",420],["varma.fi",421],["vyos.io",422],["digimobil.es",[423,424]],["teenage.engineering",425],["merrell.pl",[426,688]],["converse.pl",426],["shop.wf-education.com",[426,688]],["werkenbijaswatson.nl",427],["converse.com",[428,429]],["buyandapply.nexus.org.uk",430],["img.ly",431],["halonen.fi",[431,463,464,465,466]],["carlson.fi",[431,463,464,465,466]],["cams.ashemaletube.com",[432,433]],["electronicacerler.com",[434,435,436]],["okpoznan.pl",[437,442]],["ielts.idp.com",438],["ielts.co.nz",438],["ielts.com.au",438],["einfach-einreichen.de",[439,440,441]],["endlesstools.io",443],["mbhszepkartya.hu",444],["casellimoveis.com.br",445],["embedplus.com",446],["e-file.pl",447],["sp215.info",448],["empik.com",449],["senda.pl",450],["befestigungsfuchs.de",451],["cut-tec.co.uk",452],["gaytimes.co.uk",453],["statisticsanddata.org",454],["hello.one",455],["paychex.com",456],["wildcat-koeln.de",457],["libraries.merton.gov.uk",[458,459]],["tommy.hr",[460,461]],["usit.uio.no",462],["demo-digital-twin.r-stahl.com",467],["la31devalladolid.com",[468,469]],["mx.com",470],["foxtrail.fjallraven.com",471],["dotwatcher.cc",472],["bazarchic.com",[473,474,475]],["seedrs.com",476],["mypensiontracker.co.uk",477],["praxisplan.at",[477,499]],["endclothing.com",478],["esimplus.me",479],["cineplanet.com.pe",480],["ecologi.com",481],["wamba.com",482],["eurac.edu",483],["akasaair.com",484],["rittal.com",485],["worstbassist.com",[486,487,488,489,490,491]],["zs-watch.com",492],["crown.com",493],["mesanalyses.fr",494],["teket.jp",495],["fish.shimano.com",[496,497,498]],["simsherpa.com",[500,501,502]],["translit.ru",503],["aruba.com",504],["aireuropa.com",505],["skfbearingselect.com",[506,507]],["scanrenovation.com",508],["ttela.se",509],["dominospizza.pl",510],["devagroup.pl",511],["secondsol.com",512],["angelifybeauty.com",513],["cotopaxi.com",514],["justjoin.it",515],["digibest.pt",516],["two-notes.com",517],["theverge.com",518],["daimant.co",519],["secularism.org.uk",520],["karriere-hamburg.de",521],["musicmap.info",522],["gasspisen.se",523],["medtube.pl",524],["medtube.es",524],["medtube.fr",524],["medtube.net",524],["standard.sk",525],["linmot.com",526],["larian.com",[526,811]],["s-court.me",526],["containerandpackaging.com",527],["top-yp.de",528],["termania.net",529],["account.nowpayments.io",530],["fizjobaza.pl",531],["gigasport.at",532],["gigasport.de",532],["gigasport.ch",532],["velleahome.gr",533],["nicequest.com",534],["handelsbanken.no",535],["handelsbanken.com",535],["handelsbanken.co.uk",535],["handelsbanken.se",[535,616]],["handelsbanken.dk",535],["handelsbanken.fi",535],["ilarahealth.com",536],["songtradr.com",[537,795]],["logo.pt",[538,539]],["flexwhere.co.uk",[540,542]],["flexwhere.de",[540,542]],["pricewise.nl",540],["getunleash.io",540],["dentmania.de",540],["free.navalny.com",540],["latoken.com",540],["empathy.com",541],["labs.epi2me.io",541],["campusbrno.cz",[544,545,546]],["secrid.com",547],["etsy.com",548],["careers.cloud.com",548],["blablacar.rs",549],["blablacar.ru",549],["blablacar.com.tr",549],["blablacar.com.ua",549],["blablacar.com.br",549],["seb.se",550],["sebgroup.com",550],["deps.dev",551],["buf.build",552],["starofservice.com",553],["ytcomment.kmcat.uk",554],["gmx.com",555],["gmx.fr",555],["karofilm.ru",556],["octopusenergy.it",557],["octopusenergy.es",[557,558]],["justanswer.es",559],["justanswer.de",559],["justanswer.com",559],["justanswer.co.uk",559],["citilink.ru",560],["huutokaupat.com",561],["kaggle.com",562],["emr.ch",[563,568]],["gem.cbc.ca",564],["pumatools.hu",565],["ici.tou.tv",566],["crunchyroll.com",567],["mayflex.com",569],["clipchamp.com",569],["trouwenbijfletcher.nl",569],["fletcher.nl",569],["fletcherzakelijk.nl",569],["intermatic.com",569],["ebikelohr.de",570],["eurosender.com",571],["melectronics.ch",572],["guard.io",573],["nokportalen.se",574],["dokiliko.com",575],["valamis.com",[576,577,578]],["sverigesingenjorer.se",579],["shop.almawin.de",[580,581,582,619]],["zeitzurtrauer.de",583],["skaling.de",[584,585,586]],["bringmeister.de",587],["gdx.net",588],["clearblue.com",589],["drewag.de",[590,591,592]],["enso.de",[590,591,592]],["buidlbox.io",590],["helitransair.com",593],["more.com",594],["nwslsoccer.com",594],["climatecentral.org",595],["resolution.de",596],["flagma.by",597],["eatsalad.com",598],["pacstall.dev",599],["web2.0calc.fr",600],["de-appletradein.likewize.com",601],["swissborg.com",602],["qwice.com",603],["canalpluskuchnia.pl",[604,605]],["uizard.io",606],["stmas.bayern.de",[607,610]],["novayagazeta.eu",608],["kinopoisk.ru",609],["yandex.ru",609],["go.netia.pl",[611,612]],["polsatboxgo.pl",[611,612]],["ing.it",[613,614]],["ing.nl",615],["youcom.com.br",617],["rule34.paheal.net",618],["deep-shine.de",619],["shop.ac-zaun-center.de",619],["kellermann-online.com",619],["kletterkogel.de",619],["pnel.de",619],["korodrogerie.de",619],["der-puten-shop.de",619],["katapult-shop.de",619],["evocsports.com",619],["esm-computer.de",619],["calmwaters.de",619],["mellerud.de",619],["akustik-projekt.at",619],["vansprint.de",619],["0815.at",619],["0815.eu",619],["ojskate.com",619],["der-schweighofer.de",619],["tz-bedarf.de",619],["zeinpharma.de",619],["weicon.com",619],["dagvandewebshop.be",619],["thiele-tee.de",619],["carbox.de",619],["riapsport.de",619],["trendpet.de",619],["eheizung24.de",619],["seemueller.com",619],["vivande.de",619],["heidegrill.com",619],["gladiator-fightwear.com",619],["h-andreas.com",619],["pp-parts.com",619],["natuerlich-holzschuhe.de",619],["massivart.de",619],["malermeister-shop.de",619],["imping-confiserie.de",619],["lenox-trading.at",619],["cklenk.de",619],["catolet.de",619],["drinkitnow.de",619],["patisserie-m.de",619],["storm-proof.com",619],["balance-fahrradladen.de",619],["magicpos.shop",619],["zeinpharma.com",619],["sps-handel.net",619],["novagenics.com",619],["butterfly-circus.de",619],["holzhof24.de",619],["w6-wertarbeit.de",619],["fleurop.de",619],["leki.com",619],["extremeaudio.de",619],["taste-market.de",619],["delker-optik.de",619],["stuhl24-shop.de",619],["g-nestle.de",619],["alpine-hygiene.ch",619],["fluidmaster.it",619],["cordon.de",619],["belisse-beauty.de",619],["belisse-beauty.co.uk",619],["wpc-shop24.de",619],["liv.si",619],["maybach-luxury.com",619],["leiternprofi24.de",619],["hela-shop.eu",619],["hitado.de",619],["armedangels.com",[619,695,696]],["hofer-kerzen.at",620],["karls-shop.de",621],["luvly.care",622],["firmen.wko.at",622],["byggern.no",623],["donauauen.at",624],["woltair.cz",625],["rostics.ru",626],["hife.es",627],["lilcat.com",628],["hot.si",[629,630,631,632]],["crenolibre.fr",633],["e-pole.pl",634],["dopt.com",635],["keb-automation.com",636],["bonduelle.ru",637],["oxfordonlineenglish.com",638],["pccomponentes.fr",639],["pccomponentes.com",639],["pccomponentes.pt",639],["grants.at",640],["africa-uninet.at",640],["rqb.at",640],["youngscience.at",640],["oead.at",640],["innovationsstiftung-bildung.at",640],["etwinning.at",640],["arqa-vet.at",640],["zentrumfuercitizenscience.at",640],["vorstudienlehrgang.at",640],["erasmusplus.at",640],["jeger.pl",641],["bo.de",642],["thegamingwatcher.com",643],["norlysplay.dk",644],["plusujemy.pl",645],["asus.com.cn",[646,648]],["zentalk.asus.com",[646,648]],["mubi.com",647],["59northwheels.se",649],["photospecialist.co.uk",650],["foto-gregor.de",650],["kamera-express.de",650],["kamera-express.be",650],["kamera-express.nl",650],["kamera-express.fr",650],["kamera-express.lu",650],["dhbbank.com",651],["dhbbank.de",651],["dhbbank.be",651],["dhbbank.nl",651],["login.ingbank.pl",652],["fabrykacukiernika.pl",[653,654]],["peaks.com",655],["3landesmuseen-braunschweig.de",656],["unifachbuch.de",[657,658,659]],["playlumi.com",[660,661,662]],["chatfuel.com",663],["studio3t.com",[664,665,666,667]],["realgap.co.uk",[668,669,670,671]],["hotelborgia.com",[672,673]],["sweet24.de",674],["zwembaddekouter.be",675],["flixclassic.pl",676],["jobtoday.com",677],["deltatre.com",[678,679,693]],["withings.com",[680,681,682]],["blista.de",[683,684]],["hashop.nl",685],["gift.be",[686,687]],["elevator.de",688],["foryouehealth.de",688],["animaze.us",688],["penn-elcom.com",688],["curantus.de",688],["mtbmarket.de",688],["spanienweinonline.ch",688],["novap.fr",688],["bizkaia.eus",[689,690,691]],["sinparty.com",692],["mantel.com",694],["e-dojus.lv",697],["burnesspaull.com",698],["oncosur.org",699],["photobooth.online",700],["epidemicsound.com",701],["ryanair.com",702],["refurbished.at",[703,704,705]],["refurbished.nl",[703,704,705]],["refurbished.be",[703,704,705]],["refurbishedstore.de",[703,704,705]],["bayernportal.de",[706,707,708]],["ayudatpymes.com",709],["zipjob.com",709],["shoutcast.com",709],["plastischechirurgie-muenchen.info",710],["bonn.sitzung-online.de",711],["depop.com",[712,713,714]],["thenounproject.com",715],["pricehubble.com",716],["ilmotorsport.de",717],["karate.com",718],["psbank.ru",718],["myriad.social",718],["exeedme.com",718],["followalice.com",[718,786]],["aqua-store.fr",719],["voila.ca",720],["anastore.com",721],["app.arzt-direkt.de",722],["dasfutterhaus.at",723],["e-pity.pl",724],["fillup.pl",725],["dailymotion.com",726],["barcawelt.de",727],["lueneburger-heide.de",728],["polizei.bayern.de",[729,731]],["ourworldofpixels.com",730],["jku.at",732],["matkahuolto.fi",733],["backmarket.de",[734,735,736]],["backmarket.co.uk",[734,735,736]],["backmarket.es",[734,735,736]],["backmarket.be",[734,735,736]],["backmarket.at",[734,735,736]],["backmarket.fr",[734,735,736]],["backmarket.gr",[734,735,736]],["backmarket.fi",[734,735,736]],["backmarket.ie",[734,735,736]],["backmarket.it",[734,735,736]],["backmarket.nl",[734,735,736]],["backmarket.pt",[734,735,736]],["backmarket.se",[734,735,736]],["backmarket.sk",[734,735,736]],["backmarket.com",[734,735,736]],["eleven-sportswear.cz",[737,738,739]],["silvini.com",[737,738,739]],["silvini.de",[737,738,739]],["purefiji.cz",[737,738,739]],["voda-zdarma.cz",[737,738,739]],["lesgarconsfaciles.com",[737,738,739]],["ulevapronohy.cz",[737,738,739]],["vitalvibe.eu",[737,738,739]],["plavte.cz",[737,738,739]],["mo-tools.cz",[737,738,739]],["flamantonlineshop.cz",[737,738,739]],["sandratex.cz",[737,738,739]],["norwayshop.cz",[737,738,739]],["3d-foto.cz",[737,738,739]],["neviditelnepradlo.cz",[737,738,739]],["nutrimedium.com",[737,738,739]],["silvini.cz",[737,738,739]],["karel.cz",[737,738,739]],["silvini.sk",[737,738,739]],["book-n-drive.de",740],["cotswoldoutdoor.com",741],["cotswoldoutdoor.ie",741],["cam.start.canon",742],["usnews.com",743],["researchaffiliates.com",744],["singkinderlieder.de",745],["stiegeler.com",746],["ba.com",[749,750,751,752,753,754,755]],["britishairways.com",[749,750,751,752,753,754,755]],["cineman.pl",[756,757,758]],["tv-trwam.pl",[756,757,758,759]],["qatarairways.com",[760,761,762,763,764]],["wedding.pl",765],["vivaldi.com",766],["emuia1.gugik.gov.pl",767],["nike.com",768],["adidas.at",769],["adidas.be",769],["adidas.ca",769],["adidas.ch",769],["adidas.cl",769],["adidas.co",769],["adidas.co.in",769],["adidas.co.kr",769],["adidas.co.nz",769],["adidas.co.th",769],["adidas.co.uk",769],["adidas.com",769],["adidas.com.ar",769],["adidas.com.au",769],["adidas.com.br",769],["adidas.com.my",769],["adidas.com.ph",769],["adidas.com.vn",769],["adidas.cz",769],["adidas.de",769],["adidas.dk",769],["adidas.es",769],["adidas.fi",769],["adidas.fr",769],["adidas.gr",769],["adidas.ie",769],["adidas.it",769],["adidas.mx",769],["adidas.nl",769],["adidas.no",769],["adidas.pe",769],["adidas.pl",769],["adidas.pt",769],["adidas.ru",769],["adidas.se",769],["adidas.sk",769],["colourbox.com",770],["ebilet.pl",771],["myeventeo.com",772],["snap.com",773],["louwman.nl",[774,775]],["ratemyprofessors.com",776],["filen.io",777],["leotrippi.com",778],["restaurantclub.pl",778],["context.news",778],["queisser.de",778],["grandprixradio.dk",[779,780,781,782,783]],["grandprixradio.nl",[779,780,781,782,783]],["grandprixradio.be",[779,780,781,782,783]],["businessclass.com",784],["quantamagazine.org",785],["hellotv.nl",787],["jisc.ac.uk",788],["lasestrellas.tv",789],["xn--digitaler-notenstnder-m2b.com",790],["schoonmaakgroothandelemmen.nl",790],["nanuko.de",790],["hair-body-24.de",790],["shopforyou47.de",790],["kreativverliebt.de",790],["anderweltverlag.com",790],["octavio-shop.com",790],["forcetools-kepmar.eu",790],["fantecshop.de",790],["hexen-werkstatt.shop",790],["shop-naturstrom.de",790],["biona-shop.de",790],["camokoenig.de",790],["bikepro.de",790],["kaffeediscount.com",790],["vamos-skateshop.com",790],["holland-shop.com",790],["avonika.com",790],["royal-oak.org",791],["hurton.pl",792],["officesuite.com",793],["fups.com",[794,796]],["scienceopen.com",797],["moebel-mahler-siebenlehn.de",[798,799]],["calendly.com",800],["batesenvironmental.co.uk",[801,802]],["ubereats.com",803],["101internet.ru",804],["bein.com",805],["beinsports.com",805],["figshare.com",806],["bitso.com",807],["gallmeister.fr",808],["eco-toimistotarvikkeet.fi",809],["proficient.fi",809],["developer.ing.com",810],["webtrack.dhlglobalmail.com",812],["webtrack.dhlecs.com",812],["ehealth.gov.gr",813],["calvinklein.se",[814,815,816]],["calvinklein.fi",[814,815,816]],["calvinklein.sk",[814,815,816]],["calvinklein.si",[814,815,816]],["calvinklein.ch",[814,815,816]],["calvinklein.ru",[814,815,816]],["calvinklein.com",[814,815,816]],["calvinklein.pt",[814,815,816]],["calvinklein.pl",[814,815,816]],["calvinklein.at",[814,815,816]],["calvinklein.nl",[814,815,816]],["calvinklein.hu",[814,815,816]],["calvinklein.lu",[814,815,816]],["calvinklein.lt",[814,815,816]],["calvinklein.lv",[814,815,816]],["calvinklein.it",[814,815,816]],["calvinklein.ie",[814,815,816]],["calvinklein.hr",[814,815,816]],["calvinklein.fr",[814,815,816]],["calvinklein.es",[814,815,816]],["calvinklein.ee",[814,815,816]],["calvinklein.de",[814,815,816]],["calvinklein.dk",[814,815,816]],["calvinklein.cz",[814,815,816]],["calvinklein.bg",[814,815,816]],["calvinklein.be",[814,815,816]],["calvinklein.co.uk",[814,815,816]],["ofdb.de",817],["dtksoft.com",818],["serverstoplist.com",819],["truecaller.com",820],["arturofuente.com",[824,826,827]],["protos.com",[824,826,827]],["timhortons.co.th",[824,825,826,828,830,831]],["toyota.co.uk",[824,825,826,829,830,831]],["businessaccountingbasics.co.uk",[824,825,826,828,830,831]],["flickr.org",[824,825,826,828,830,831]],["espacocasa.com",824],["altraeta.it",824],["centrooceano.it",824],["allstoresdigital.com",824],["cultarm3d.de",824],["soulbounce.com",824],["fluidtopics.com",824],["uvetgbt.com",824],["malcorentacar.com",824],["emondo.de",824],["maspero.it",824],["kelkay.com",824],["underground-england.com",824],["vert.eco",824],["turcolegal.com",824],["magnet4blogging.net",824],["moovly.com",824],["automationafrica.co.za",824],["jornaldoalgarve.pt",824],["keravanenergia.fi",824],["kuopas.fi",824],["frag-machiavelli.de",824],["healthera.co.uk",824],["mobeleader.com",824],["powerup-gaming.com",824],["developer-blog.net",824],["medical.edu.mt",824],["deh.mt",824],["bluebell-railway.com",824],["ribescasals.com",824],["javea.com",824],["chinaimportal.com",824],["inds.co.uk",824],["raoul-follereau.org",824],["serramenti-milano.it",824],["cosasdemujer.com",824],["luz-blanca.info",824],["cosasdeviajes.com",824],["safehaven.io",824],["havocpoint.it",824],["motofocus.pl",824],["nomanssky.com",824],["drei-franken-info.de",824],["clausnehring.com",824],["alttab.net",824],["kinderleicht.berlin",824],["kiakkoradio.fi",824],["cosasdelcaribe.es",824],["de-sjove-jokes.dk",824],["serverprofis.de",824],["biographyonline.net",824],["iziconfort.com",824],["sportinnederland.com",824],["natureatblog.com",824],["wtsenergy.com",824],["cosasdesalud.es",824],["internetpasoapaso.com",824],["zurzeit.at",824],["contaspoupanca.pt",824],["steamdeckhq.com",[824,825,826,828,830,831]],["ipouritinc.com",[824,826,828]],["hemglass.se",[824,826,828,830,831]],["sumsub.com",[824,825,826]],["atman.pl",[824,825,826]],["fabriziovanmarciano.com",[824,825,826]],["nationalrail.com",[824,825,826]],["eett.gr",[824,825,826]],["funkypotato.com",[824,825,826]],["equalexchange.co.uk",[824,825,826]],["swnsdigital.com",[824,825,826]],["gogolf.fi",[824,828]],["hanse-haus-greifswald.de",824],["tampereenratikka.fi",[824,826,832,833]],["kymppikatsastus.fi",[826,830,877,878]],["brasiltec.ind.br",834],["doka.com",[835,836,837]],["abi.de",[838,839]],["studienwahl.de",[838,839]],["youthforum.org",840],["journal.hr",[841,842,843,844]],["howstuffworks.com",845],["stickypassword.com",[846,847,848]],["conversion-rate-experts.com",[849,850]],["merkur.si",[851,852,853]],["petitionenligne.com",[854,855]],["petitionenligne.be",[854,855]],["petitionenligne.fr",[854,855]],["petitionenligne.re",[854,855]],["petitionenligne.ch",[854,855]],["skrivunder.net",[854,855]],["petitiononline.uk",[854,855]],["petitions.nz",[854,855]],["petizioni.com",[854,855]],["peticao.online",[854,855]],["skrivunder.com",[854,855]],["peticiones.ar",[854,855]],["petities.com",[854,855]],["petitionen.com",[854,855]],["petice.com",[854,855]],["opprop.net",[854,855]],["peticiok.com",[854,855]],["peticiones.net",[854,855]],["peticion.es",[854,855]],["peticiones.pe",[854,855]],["peticiones.mx",[854,855]],["peticiones.cl",[854,855]],["peticije.online",[854,855]],["peticiones.co",[854,855]],["mediathek.lfv-bayern.de",856],["aluypvc.es",[857,858,859]],["pracuj.pl",[860,861,862,863,864]],["vki.at",866],["konsument.at",866],["chollometro.com",867],["dealabs.com",867],["hotukdeals.com",867],["pepper.it",867],["pepper.pl",867],["preisjaeger.at",867],["mydealz.de",867],["direct.travelinsurance.tescobank.com",[870,871,872,873,874,875,876,877]],["easyfind.ch",[879,880]],["e-shop.leonidas.com",[881,882]],["lastmile.lt",883],["veriff.com",884],["constantin.film",[885,886,887]],["notion.so",888],["omgevingsloketinzage.omgeving.vlaanderen.be",[889,890]],["primor.eu",891],["tameteo.com",892],["tempo.pt",892],["yourweather.co.uk",892],["meteored.cl",892],["meteored.mx",892],["tempo.com",892],["ilmeteo.net",892],["meteored.com.ar",892],["daswetter.com",892],["myprivacy.dpgmediagroup.net",893],["algarvevacation.net",894],["3sat.de",895],["oxxio.nl",[896,897]],["butterflyshop.dk",[898,899,900]],["praxis.nl",901],["brico.be",901],["kent.gov.uk",[902,903]],["pohjanmaanhyvinvointi.fi",904],["maanmittauslaitos.fi",905]]);

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
