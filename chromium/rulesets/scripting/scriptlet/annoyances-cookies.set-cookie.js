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

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setCookie = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["__toppy_consent","1"],["_u123_cc","yes"],["ga-disable","true"],["GDPR","9"],["dad_consent","true"],["essential_cookies_enabled","true"],["google_cookies_enabled","false"],["cookiepolicyinfo_new2","true"],["camra_experience_cookie_consent","1"],["valCookie1","1"],["third-party","required","","reload","1"],["COOKIES_ACCEPTED","true"],["cookienotification","1"],["_cookieconsentv2","1"],["cconsent","1"],["cookies-info","true"],["cookies_and_content_security_policy","false"],["cookies_consent_disclaimer","false"],["intramuros-cookie-consent","true"],["intramuros-analytics","false"],["website_cookies_bar","true"],["CF_GDPR_COOKIE_CONSENT_VIEWED","1"],["cookie-confirm","1"],["cookie_preferences_set","true"],["S_COOKIES_ACCEPTED","true"],["isCookieLegalBannerSelected","true"],["cc","1"],["doSomethingOnlyOnce","true"],["tos_consent","allow"],["fn_cookie_banner","1"],["adult_confirm","1"],["atl-gdpr-consent","0010000"],["cookies-allowance","true"],["_acceptsEssential","true"],["informedConsent","1"],["EnableABTest","false"],["EnableFacebook","false"],["EnableGA","false"],["cookie-consent","false"],["consent-state","true"],["was_cookie_consent","no"],["ytprefs_gdpr_consent","1","","reload","1"],["cconsent","1000"],["CONSENT","15"],["nCookieVisible","2"],["CookieConsent","false"],["cookie_consent","necessary"],["suzuki-accept-cookie","true"],["cookieHidden","true"],["terms_agreement_popup_agreed","true","","reload","1"],["consent_panel","1"],["user_allowed_save_cookie","true"],["AcceptCookie","yes"],["cookieConsent","0"],["cookieConsent","rejected"],["smile_allow_cookies","true"],["cookie_alert","true"],["cb-enabled","accepted"],["AgreeCookies","true"],["AreCookiesSet","true"],["chcCookieHint","1","","reload","1"],["accept-selected-cookies","true","","reload","1"],["cookiePreferences","true"],["necessary","true"],["has_accepted_cookies","true"],["cs_viewed_cookie_policy","yes"],["cookies","false"],["cookies_accepted","0"],["cookies_informed","true"],["has-seen-cookie-notice","true","","reload","1"],["cookies-agreed","1"],["cookies-analytical","0"],["gls-cookie-policy","accepted"],["cookies-configured","1"],["consent","true"],["localConsent","true"],["pum-13751","true"],["CONSENT","1"],["cm_level","0"],["st-cookie-token","true"],["functionalCookie","true"],["agreed_cookie_policy","1"],["hasMadeConsentSelection","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelection","true","","","domain",".imola.motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".imola.motorsportreg.com"],["gdprPGA","true"],["xn_cookieconsent","false","","reload","1"],["taunton_user_consent_submitted","true"],["taunton_user_consent_advertising","false"],["taunton_user_consent_analytics","false"],["cookie_consent_closed","1"],["__cookie_consent","false"],["dsgvo-stat","yes"],["dsgvo-mark","no"],["cookieSettings","11","","reload","1"],["google-tagmanager","false"],["decline","true","","","reload","1"],["cookieTermsDismissed","true"],["cookieConsentDismissed","true"],["kraftwerkCookiePolicyState","1"],["privacyPolicyAccept","1","","reload","1"],["CookieConsent","necessary"],["analyticsStatus","false"],["socialMediaStatus","false"],["cookiesAccepted","","reload","1"],["required","1"],["pmStorage","1"],["user_cookie_prefs","1"],["_coo_seen","1"],["airTRFX_cookies","accepted"],["cookie_consent_accept","true"],["agree","true"],["vw_mms_hide_cookie_dialog","1"],["solo_opt_in","false"],["POMELO_COOKIES","1"],["AcceptUseCookie","Accept"],["sbrf.pers_notice","1"],["closedCookieBanner","true"],["yoyocookieconsent_viewed","true"],["privacy_policy_agreement","6","","reload","1"],["kinemaster-cookieconstent","1"],["cookie_acceptance","1"],["jazzfm-privacy","true"],["show_msg_cookies","false"],["CookieConsent","true","","reload","1"],["FunctionalCookie","true"],["AnalyticalCookie","false"],[".YourApp.ConsentCookie","yes","","reload","1"],["gdpr","deny"],["VAA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["VAA_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["VAA_ENSIGHTEN_PRIVACY_Marketing","0"],["VAA_ENSIGHTEN_PRIVACY_Functional","0"],["VAA_ENSIGHTEN_PRIVACY_Analytics","0"],["agreesWithCookies","true"],["gaCookies","false"],["cookiesApproved20231","true"],["rm-first-time-modal-welcome","1"],["cookieConsent-2023-03","false"],["CookieDisclaimer","1"],["twtr_pixel_opt_in","N"],["RBCookie-Alert","1"],["CookieConsentV4","false"],["cookieconsent_status","allow"],["cookieconsent_status","dismiss"],["cookies_analytics_enabled","0","","reload","1"],["xf_notice_dismiss","1"],["rcl_consent_given","true"],["rcl_preferences_consent","true"],["rcl_marketing_consent","false"],["confirmed-cookies","1","","reload","1"],["cb_validCookies","1"],["cb_accepted","1"],["ws-cookie-Techniques","true"],["cookie-agreed","2"],["cookie_consent","yes"],["cookie_consent_options","3"],["consentIsSetByUser","true","","reload","1"],["isSiteCookieReviewed","0","","reload","1"],["phpbb3_4zn6j_ca","true"],["cookieBar-cookies-accepted","true"],["cookie_consent_user_accepted","true"],["__gitbook_cookie_granted","no"],["user_cookie_consent","false","","reload","1"],["cookies-marketing","N"],["gatsby-gdpr-google-tagmanager","false"],["uuAppCookiesAgreement","true"],["_cookies-consent","yes"],["RCI_APP_LEGAL_DISCLAIMER_COOKIE","false"],["hs_cookieconsent","true"],["cookiergpdjnz","1"],["__radicalMotorsport.ac","true"],["cookies_message_bar_hidden","true"],["acceptsCookies","false"],["accept_cookies","accepted"],["consent_seen","1"],["_gdpr_playbalatro","1"],["consentAll","0"],["cookiewarning","1","","reload","1"],["cookieBarSeen","true"],["cookie_consent_given","true"],["cuvva.app.website.cookie-policy.consent","1"],["custom-cookies-accepted","1","","reload","1"],["AnalyticsAcceptancePopOver","false"],["cookiecookie","1"],["disclaimer-overlay","true"],["complianceCookie","true"],["KeebSupplyCookieConsent","true"],["cookie_policy_agreement","true"],["kt_tcookie","1"],["splash_Page_Accepted","true"],["gdpr-analytics-enabled","false"],["privacy_status","1"],["privacy_settings","1"],["config","1","","reload","1"],["hideCookieNotification","true","","reload","1"],["CookieNotification","1"],["has_accepted_gdpr","1"],["app-cookie-consents","1"],["analitics_cookies","0"],["tachyon-accepted-cookie-notice","true"],["defra-cookie-banner-dismissed","true","","reload","1"],["myAwesomeCookieName3","true"],["cookie-notification","ACCEPTED","","reload","1"],["loader","1"],["enableAnalyticsCookies","denied"],["acknowledgeCookieBanner","true"],["enableTargetingAdvertisingCookies","denied"],["cookiePolicy","1"],["cookie-agreed","0"],["crtmcookiesProtDatos","1","","reload","1"],["NADevGDPRCookieConsent_portal_2","1"],["handledCookieMessage","1"],["targeting","false"],["functionality","false"],["performance","false"],["cookie_info","1","","reload","1"],["bannerDissmissal","true","","reload","1"],["allowCookies","true"],["COOKIE-POLICY-ACCEPT","true"],["gdpr","accept"],["essentialCookie","Y"],["checkCookie","Y"],["analyticsCookie","N"],["marketingCookie","N"],["thirdCookie","N"],["paydirektCookieAllowed","false"],["hdcab","true"],["synapse-cookie-preferences-set","true"],["confirm_cookies","1"],["endgame-accept-policy","true"],["sc-privacy-settings","true"],["accept_cookies2","true","","reload","1"],["cf_consent","false"],["privacyCookie","1","","reload","1"],["cookieChoice","0"],["lgpdConsent","true"],["shareloft_cookie_decision","1"],["privacy_marketing","false"],["privacy_comodidade","false"],["acceptAnalyticsCookies","false"],["acceptFunctionalCookies","true"],["cookiePolicyConfirmed","true","","reload","1"],["PostAnalytics","0"],["gatsby-gdpr","false"],["functionalCookiesAccepted","true"],["necessaryCookies","true"],["comfortCookiesAccepted","false"],["statisticsCookiesAccepted","false"],["gdpr-google-analytics","false"],["cookie_policy","true"],["cookieModalAccept","no"],["AcceptFunctionalCookies","true"],["AcceptAnalyticsCookies","false"],["AcceptNonFunctionalCookies","false"],["forced-cookies-modal","2"],["cookiebar","1"],["cookieconsent_status","true"],["longines-cookiesstatus-analytics","false"],["longines-cookiesstatus-functional","false"],["longines-cookiesstatus-necessary","true"],["longines-cookiesstatus-social","false"],["pz_cookie_consent","true"],["_cb","1","","reload","1"],["consent-status","1"],["HANA-RGPD","accepted"],["cookie-optin","true"],["msg_cookie_CEX","true"],["OptanonAlertBoxClosed","ok"],["OptanonAlertBoxClosed","true"],["cookieBannerHidden","true"],["isReadCookiePolicyDNT","true"],["isReadCookiePolicyDNTAa","false"],["coookieaccept","ok"],["consentTrackingVerified","true"],["consent","0"],["allowGetPrivacyInfo","true"],["cookiebanner","0"],["_tv_cookie_consent","y"],["_tv_cookie_choice","1"],["eika_consent_set","true"],["eika_consent_marketing","false"],["ew_cookieconsent","1"],["ew_cookieconsent_optin_b","true"],["ew_cookieconsent_optin_a","true"],["gdpr-agree-cookie","1","","reload","1"],["gdpr-consent-cookie-level3","1"],["gdpr-consent-cookie-level2","1"],["ck-cp","accepted"],["cookieConsent","1"],["consent-cookie","1"],["show_gdpr_cookie_message_388801234_cz","no"],["gsbbanner","0"],["__adblocker","false","","reload","1"],["cookies_marketing_ok","false"],["cookies_ok","true"],["acceptCookies","0"],["acceptCookie","1"],["marketingCookies","false"],["CookieLaw_statistik 0"],["CookieLaw_komfort","0"],["CookieLaw_personalisierung","0"],["CookieLaw","on"],["wtr_cookie_consent","1"],["wtr_cookies_advertising","0"],["wtr_cookies_functional","0"],["wtr_cookies_analytics","0"],["allowTrackingCookiesKvK","0"],["cookieLevelCodeKVK","1"],["allowAnalyticsCookiesKvK","0"],["macfarlanes-necessary-cookies","accepted"],["TC_PRIVACY_CENTER","0"],["AllowCookies","false","","reload","1"],["consented","false"],["cookie_tou","1","","reload","1"],["blukit_novo","true"],["cr","true"],["gdpr_check_cookie","accepted","","reload","1"],["accept-cookies","accepted"],["dvag_cookies2023","1"],["consent_cookie","1"],["permissionExperience","false"],["permissionPerformance","false"],["permissionMarketing","false"],["consent_analytics","false"],["consent_received","true"],["cookieModal","false"],["user-accepted-AEPD-cookies","1"],["personalization-cookies-consent","0","","reload","1"],["analitics-cookies-consent","0"],["sscm_consent_widget","1"],["texthelp_cookie_consent_in_eu","0"],["texthelp_cookie_consent","yes"],["nc_cookies","accepted"],["nc_analytics","rejected"],["nc_marketing","rejected"],[".AspNet.Consent","yes","","reload","1"],[".AspNet.Consent","no","","reload","1"],["user_gave_consent","1"],["user_gave_consent_new","1"],["rt-cb-approve","true"],["CookieLayerDismissed","true"],["RODOclosed","true"],["cookieDeclined","1"],["cookieModal","true"],["oph-mandatory-cookies-accepted","true"],["cookies-accept","1"],["dw_is_new_consent","true"],["accept_political","1"],["konicaminolta.us","1"],["cookiesAnalyticsApproved","0"],["hasConfiguredCookies","1"],["cookiesPubliApproved","0"],["cookieAuth","1"],["kscookies","true"],["cookie-policy","true"],["cookie-use-accept","false"],["ga-disable-UA-xxxxxxxx-x","true"],["consent","1"],["acceptCookies","1"],["cookie-bar","no"],["CookiesAccepted","no"],["essential","true"],["cookieConfirm","true"],["trackingConfirm","false"],["cookie_consent","false"],["cookie_consent","true"],["gtm-disable-GTM-NLVRXX8","true"],["uce-cookie","N"],["tarteaucitron","false"],["cookiePolicies","true"],["cookie_optin_q","false"],["ce-cookie","N"],["NTCookies","0"],["CookieConsentFT","1"],["alertCookie","1","","reload","1"],["gdpr","1"],["hideCookieBanner","true"],["obligatory","true"],["marketing","false"],["analytics","false"],["cookieControl","true"],["plosCookieConsentStatus","false"],["user_accepted_cookies","1"],["analyticsAccepted","false"],["cookieAccepted","true"],["hide-gdpr-bar","true"],["promptCookies","1"],["_cDaB","1"],["_aCan_analytical","0"],["_aGaB","1"],["surbma-gpga","no"],["elrowCookiePolicy","yes"],["ownit_cookie_data_permissions","1"],["Cookies_Preferences","accepted"],["Cookies_Preferences_Analytics","declined"],["privacyPolicyAccepted","true"],["Cookies-Accepted","true"],["cc-accepted","2"],["cc-item-google","false"],["featureConsent","false","","reload","1"],["accept-cookie","no"],["consent","0","","reload","1"],["cookiePrivacyPreferenceBannerProduction","accepted"],["cookiesConsent","false"],["2x1cookies","1"],["firstPartyDataPrefSet","true"],["cookies-required","1","","reload","1"],["kh_cookie_level4","false"],["kh_cookie_level3","false"],["kh_cookie_level1","true"],["cookie_agreement","1","","reload","1"],["MSC_Cookiebanner","false"],["cookieConsent_marketing","false"],["Fitnessing21-15-9","0"],["cookies_popup","yes"],["cookieConsent_required","true","","reload","1"],["sa_enable","off"],["acceptcookietermCookieBanner","true"],["cookie_status","1","","reload","1"],["FTCookieCompliance","1"],["cookie-bar","0"],["cookiePopupAccepted","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_ADS_OPTOUT","true"],["UBI_PRIVACY_POLICY_ACCEPTED","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["jocookie","false"],["cookieNotification.shown","1"],["localConsent","false"],["oai-allow-ne","false"],["consent","rejected"],["allow-cookie","1"],["cookie-functional","1"],["hulkCookieBarClick","1"],["CookieConsent","1"],["zoommer-cookie_agreed","true"],["accepted_cookie_policy","true"],["gdpr_cookie_token","1"],["_consent_personalization","denied"],["_consent_analytics","denied"],["_consent_marketing","denied"],["cookieWall","1"],["no_cookies","1"],["hidecookiesbanner","1"],["CookienatorConsent","false"],["cookieWallOptIn","0"],["analyticsCookiesAccepted","false"],["cf4212_cn","1"],["mediaCookiesAccepted","false"],["mandatoryCookiesAccepted","true"],["gtag","true"],["BokadirektCookiePreferencesMP","1"],["cookieAcknowledged","true"],["data-privacy-statement","true"],["cookie_privacy_level","required"],["accepted_cookies","true","","reload","1"],["MATOMO_CONSENT_GIVEN","0"],["BABY_MARKETING_COOKIES_CONSENTED","false"],["BABY_PERFORMANCE_COOKIES_CONSENTED","false"],["BABY_NECESSARY_COOKIES_CONSENTED","true"],["consent_essential","allow"],["cookieshown","1"],["warn","true"],["optinCookieSetting","1"],["privacy-shown","true"],["slimstat_optout_tracking","true"],["npp_analytical","0"],["inshopCookiesSet","true"],["adsCookies","false"],["performanceCookies","false"],["sa_demo","false"],["animated_drawings","true"],["cookieStatus","true"],["swgCookie","false"],["cookieConsentPreferencesGranted","1"],["cookieConsentMarketingGranted","0"],["cookieConsentGranted","1"],["cookies-rejected","true"],["NL_COOKIE_KOMFORT","false"],["NL_COOKIE_MEMORY","true","","reload","1"],["NL_COOKIE_STATS","false"],["pws_gdrp_accept","1"],["have18","1"],["pelm_cstate","1"],["pelm_consent","1"],["accept-cookies","true"],["accept-analytical-cookies","false"],["accept-marketing-cookies","false"],["cookie-level-v4","0"],["analytics_consent","yes"],["sei-ccpa-banner","true"],["awx_cookie_consent","true"],["cookie_warning","1"],["allowCookies","0"],["cookiePolicyAccepted","true"],["codecamps.cookiesConsent","true"],["cookiesConsent","true"],["consent_updated","true"],["acsr","1"],["__hs_gpc_banner_dismiss","true"],["cookieyes-necessary","yes"],["cookieyes-other","no"],["cky-action","yes"],["cookieyes-functional","no"],["has-declined-cookies","true","","reload","1"],["has-agreed-to-cookies","false"],["essential","Y"],["analytics","N"],["functional","N"],["gradeproof_shown_cookie_warning","true"],["sber.pers_notice_en","1"],["cookies_consented","yes"],["cookies_consent","true"],["cookies_consent","false"],["anal-opt-in","false"],["accepted","1"],["CB393_DONOTREOPEN","true"],["AYTO_CORUNA_COOKIES","1","","reload","1"],["I6IISCOOKIECONSENT0","n","","reload","1"],["htg_consent","0"],["cookie_oldal","1"],["cookie_marketing","0"],["cookie_jog","1"],["cp_cc_ads","0"],["cp_cc_stats","0"],["cp_cc_required","1"],["ae-cookiebanner","true"],["ae-esential","true"],["ae-statistics","false"],["ccs-supplierconnect","ACCEPTED"],["accepted_cookies","yes"],["note","1"],["cookieConsent","required"],["cookieConsent","accepted"],["pd_cc","1"],["gdpr_ok","necessary"],["allowTracking","false"],["varmafi_mandatory","true"],["VyosCookies","Accepted"],["analyticsConsent","false"],["adsConsent","false"],["te_cookie_ok","1"],["amcookie_policy_restriction","allowed"],["cookieConsent","allowed"],["dw_cookies_accepted","1"],["acceptConverseCookiePolicy","0"],["gdpr-banner","1"],["privacySettings","1"],["are_essential_consents_given","1"],["is_personalized_content_consent_given","1"],["acepta_cookies_funcionales","1"],["acepta_cookies_obligatorias","1"],["acepta_cookies_personalizacion","1"],["cookiepolicyinfo_new","true"],["acceptCookie","true"],["ee-hj","n"],["ee-ca","y","","reload","1"],["ee-yt","y"],["cookie_analytics","false"],["et_cookie_consent","true"],["cookieBasic","true"],["cookieMold","true"],["ytprefs_gdpr_consent","1"],["efile-cookiename-","1"],["plg_system_djcookiemonster_informed","1","","reload","1"],["cvc","true"],["cookieConsent3","true"],["acris_cookie_acc","1","","reload","1"],["termsfeed_pc1_notice_banner_hidden","true"],["cmplz_marketing","allowed"],["cmplz_marketing","allow"],["acknowledged","true"],["ccpaaccept","true"],["gdpr_shield_notice_dismissed","yes"],["luci_gaConsent_95973f7b-6dbc-4dac-a916-ab2cf3b4af11","false"],["luci_CookieConsent","true"],["ng-cc-necessary","1"],["ng-cc-accepted","accepted"],["PrivacyPolicyOptOut","yes"],["consentAnalytics","false"],["consentAdvertising","false"],["consentPersonalization","false"],["privacyExpiration","1"],["cookieconsent_status","deny"],["lr_cookies_tecnicas","accepted"],["cookies_surestao","accepted","","reload","1"],["hide-cookie-banner","1"],["fjallravenCookie","1"],["accept_cookie_policy","true"],["_marketing","0"],["_performance","0"],["RgpdBanner","1"],["seen_cookie_message","accepted"],["complianceCookie","on"],["cookie-consent","1","","reload","1"],["cookie-consent","0"],["ecologi_cookie_consent_20220224","false"],["appBannerPopUpRulesCookie","true"],["eurac_cookie_consent","true"],["akasaairCookie","accepted"],["rittalCC","1"],["ckies_facebook_pixel","deny"],["ckies_google_analytics","deny"],["ckies_youtube","allow"],["ckies_cloudflare","allow"],["ckies_paypal","allow"],["ckies_web_store_state","allow"],["hasPolicy","Y"],["modalPolicyCookieNotAccepted","notaccepted"],["MANA_CONSENT","true"],["_ul_cookie_consent","allow"],["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["trackingCookies","off"],["acceptanalytics","no"],["acceptadvertising","no"],["acceptfunctional","yes"],["consent18","0","","reload","1"],["ATA.gdpr.popup","true"],["AIREUROPA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["privacyNoticeExpireDate","1"],["privacyNoticeAccepted","true"],["policy_accepted","1"],["stampen-cookies-hide-information","yes"],["dominos_cookies_accepted","1"],["deva_accepted","yes"],["cookies_consent","1"],["cookies_modal","true"],["cookie_notice","1"],["cookiesPopup","1"],["digibestCookieInfo","true"],["cookiesettings_status","allow"],["_duet_gdpr_acknowledged","1"],["daimant_collective","accept","","reload","1"],["cookies-notice","1","","reload","1"],["banner","2","","reload","1"],["privacy-policy-2023","accept"],["user_cookie_consent","false"],["cookiePolicy","4"],["standard_gdpr_consent","true"],["cookie_accept","true"],["cookieBanner","true"],["tncookieinfo","1","","reload","1"],["agree_with_cookies","1"],["cookie-accepted","true"],["cookie-accepted","yes"],["consentAll","1"],["hide_cookies_consent","1"],["nicequest_optIn","1"],["shb-consent-cookies","false"],["cookies-accepted","true","","reload","1"],["cpaccepted","true"],["cookieMessageDismissed","1"],["LG_COOKIE_CONSENT","0"],["CookieConsent","true"],["gatsby-plugin-google-tagmanager","false"],["wtr_cookies_functional","1"],["cookie-m-personalization","0"],["cookie-m-marketing","0"],["cookie-m-analytics","0"],["cookies","true"],["ctc_rejected","1"],["_cookies_v2","1"],["AcceptedCookieCategories","1"],["cookie_policy_acknowledgement","true"],["allowCookies","yes"],["cookieNotification","true"],["privacy","true"],["euconsent-bypass","1"],["cookie_usage","yes"],["dismissCookieBanner","true"],["switchCookies","1"],["cbChecked","true"],["infoCookieUses","true"],["consent-data-v2","0"],["ACCEPTED_COOKIES","true"],["EMR-CookieConsent-Analytical","0","","reload","1"],["gem_cookies_usage_production","1"],["cookie_level","2"],["toutv_cookies_usage_production","1"],["_evidon_suppress_notification_cookie","1"],["EMR-CookieConsent-Advertising","0"],["acceptCookies","true"],["br-lgpd-cookie-notice-agreement-v1","1"],["privacy_mv","1"],["COOKIES_NEWACCEPTED","1"],["es_cookie_settings_closed","1"],["cookie-banner-acceptance-state","true"],["cookie_consent_seen","1"],["cookies_allowed","yes"],["tracking","0"],["valamis_cookie_message","true","","reload","1"],["valamis_cookie_marketing","false"],["valamis_cookie_analytics","false"],["approvedcookies","no","","reload","1"],["psd-google-ads-enabled","0"],["psd-gtm-activated","1"],["wishlist-enabled","1"],["consentInteract","true"],["cookie-byte-consent-essentials","true"],["cookie-byte-consent-showed","true"],["cookie-byte-consent-statistics","false"],["bm_acknowledge","yes"],["genovaPrivacyOptions","1","","reload","1"],["kali-cc-agreed","true"],["cookiesAccepted","true"],["allowMarketingCookies","false"],["allowAnalyticalCookies","false"],["privacyLevel","2","","reload","1"],["AcceptedCookies","1"],["gcp","1","","reload","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["privacyLevel","flagmajob_ads_shown","1","","reload","1"],["userCookies","true"],["privacy-policy-accepted","1"],["precmp","1","","reload","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["statistik","0"],["cookies-informer-close","true"],["gdpr","0"],["rodo-reminder-displayed","1"],["rodo-modal-displayed","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["bvkcookie","true"],["cookie-preference","1","","reload","1"],["cookie-preference-v3","1"],["cookies_accepted","yes"],["cookies_accepted","false"],["CM_BANNER","false"],["set-cookie","cookieAccess","1"],["hife_eu_cookie_consent","1"],["cookie-consent","accepted"],["permission_marketing_cookies","0"],["permission_statistic_cookies","0"],["permission_funktional_cookies","1"],["cookieconsent","1"],["cookieconsent","true"],["cookieconsent","deny"],["epole_cookies_settings","true"],["dopt_consent","false"],["privacy-statement-accepted","true","","reload","1"],["cookie_locales","true"],["ooe_cookie_policy_accepted","no"],["accept_cookie","1"],["cookieconsent_status_new","1"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-accepted","false"],["isReadCookiePolicyDNTAa","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["cookie_accepted","1"],["cookie_accepted","false","","reload","1"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["allow_cookie","false"],["3LM-Cookie","false"],["i_sc_a","false"],["i_cm_a","false"],["i_c_a","true"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["cookieconsent_statistics","no"],["cookieconsent_essential","yes"],["cookie_preference","1"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie-preferences-technical","yes"],["tracking_cookie","1"],["cookie_consent_group_technical","1"],["cookie-preference_renew10","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["cookie_accepted","true"],["hasSeenCookieDisclosure","true"],["RY_COOKIE_CONSENT","true"],["COOKIE_CONSENT","1","","reload","1"],["COOKIE_STATIC","false"],["COOKIE_MARKETING","false"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookie_consent","1"],["ff_cookie_notice","1"],["allris-cookie-msg","1"],["gdpr__google__analytics","false"],["gdpr__facebook__social","false"],["gdpr__depop__functional","true"],["cookie_consent","1","","reload","1"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["cookie-consent","true"],["cookie-consent","denied"],["COOKIECONSENT","false"],["tibber_cc_essential","approved","","reload","1"],["abz_seo_choosen","1"],["privacyAccepted","true"],["cok","1","","reload","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["CookieConsentV2","YES"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["cookie_consent_user_accepted","false"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Marketing","0"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Analytics","0"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","0"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree_0124","1"],["cookiesPolicy20211101","1"],["sc-cookies-accepted","true"],["marketing_cookie_akkoord","0"],["site_cookie_akkoord","1"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["analytics_cookies","0"],["cookies_accepted","1","","reload","1"],["tracking_cookies","0"],["advertisement-age-show-alcohol","false"],["advertisement-age-show-gamble","false"],["ibe.acceptedCookie","true"],["acceptedPolicy","true"],["cookieConsentClosed","true"],["cookiesPrivacy","false"],["_tvsPrivacy","true"],["epCookieConsent","0","","reload","1"],["royaloakTermsCookie","1"],["is_allowed_client_traking_niezbedne","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["kevin-user-has-accepted-ad-cookies","false"],["kevin-user-has-accepted-analytics-cookies","false"],["kevin-user-has-interacted-with-cookies","true"],["cpaccpted","true"],["AllowCookies","true"],["cookiesAccepted","3"],["optOutsTouched","true"],["optOutAccepted","true"],["gdpr_dismissal","true"],["analyticsCookieAccepted","0"],["cookieAccepted","0"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["use_cookie","1"],["figshareCookiesAccepted","true"],["bitso_cc","1"],["eg_asked","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookie_analytcs","false","","reload","1"],["dhl-webapp-track","allowed"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["ofdb_werbung","Y","","reload","1"],["user_cookie_consent","1"],["STAgreement","1"],["tc:dismissexitintentpopup","true"],["functionalCookies","true"],["contentPersonalisationCookies","false"],["statisticalCookies","false"],["consents","essential"],["viewed_cookie_policy","yes","","reload","1"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["cookielawinfo-checkbox-non-necessary","no"],["cookielawinfo-checkbox-advertisement","no"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-analytics","no"],["cookielawinfo-checkbox-performance","no"],["cookielawinfo-checkbox-markkinointi","no"],["cookielawinfo-checkbox-tilastointi","no"],["cookie_preferences","10"],["cookie_consent_status","allow"],["cookie_accept","1"],["hide_cookieoverlay_v2","1","","reload","1"],["socialmedia-cookies_allowed_v2","0"],["performance-cookies_allowed_v2","0"],["mrm_gdpr","1"],["necessary_consent","accepted"],["jour_cookies","1"],["jour_functional","true"],["jour_analytics","false"],["jour_marketing","false"],["gdpr_opt_in","1"],["ad_storage","denied"],["stickyCookiesSet","true"],["analytics_storage","denied"],["user_experience_cookie_consent","false"],["marketing_cookie_consent","false"],["cookie_notice_dismissed","yes"],["cookie_analytics_allow","no"],["mer_cc_dim_rem_allow","no"],["num_times_cookie_consent_banner_shown","1"],["cookie_consent_banner_shown_last_time","1"],["privacy_hint","1"],["cookiesConsent","1"],["cookiesStatistics","0"],["cookiesPreferences","0"],["gpc_v","1"],["gpc_ad","0"],["gpc_analytic","0"],["gpc_audience","0"],["gpc_func","0"],["OptanonAlertBoxClosed","1"],["vkicookieconsent","0"],["cookie_policy_agreement","3"],["CA_DT_V2","0","","reload","1"],["CA_DT_V3","0"],["internalCookies","false"],["essentialsCookies","true"],["TESCOBANK_ENSIGHTEN_PRIVACY_Advertising","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Experience","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Measurement","0"],["viewed_cookie_policy","yes"],["cookielawinfo-checkbox-toiminnalliset-evasteet","yes"],["am-sub","1"],["allow-marketing","false"],["allow-analytics","false"],["cc_analytics","0"],["cc_essential","1"],["__consent","%5B%22required%22%5D"],["veriff_cookie_consent_completed","true"],["TVPtcs22ver","66"],["cookieBasicConsent","accepted"],["cookieVer","1","","reload","1"],["external-data-googlemaps-is-enabled","true"],["external-data-youtube-is-enabled","true"],["external-data-spotify-is-enabled","true"],["notion_check_cookie_consent","true"],["vl-cookie-consent-cookie-consent","true"],["vl-cookie-consent-functional","true"],["amcookie_allowed","0"],["euconsent-v2-addtl","0"],["dummy","1","","reload","1"],["acepta_cookie","acepta"],["3sat_cmp_configuration","true"],["privacyConsent_version","1","","reload","1"],["privacyConsent","false"],["DDCookiePolicy-consent-functional","false"],["DDCookiePolicy-consent-tracking","false"],["DDCookiePolicy-consent-statistics","false"],["CookieNotificationSeen","1","","reload","1"],["cookie-management-preferences-set","true"],["cookie-management-version","1"],["show-cookie-banner","1"],["mml-cookie-agreed","2"]];

const hostnamesMap = new Map([["toppy.be",0],["uhrzeit123.de",[1,2]],["marinelink.com",3],["againstdata.com",4],["spuntinoheathrow.com",[5,6]],["pzw.org.pl",7],["camra.org.uk",[8,949]],["parkguellonline.cat",9],["stroga-festival.de",10],["queensfishandchipsgloucester.co.uk",11],["ieq-systems.de",12],["arning-bau.de",12],["startrescue.co.uk",13],["eneba.com",14],["eltiempo.com",15],["galaxykayaks.ro",16],["mywot.com",17],["intramuros.org",[18,19]],["nucom.odoo.dev",20],["cyberfolks.pl",21],["cyberfolks.ro",21],["okko.tv",22],["immersivelabs.online",23],["serasa.com.br",24],["falabella.com.pe",25],["falabella.com",25],["falabella.com.co",25],["przegladpiaseczynski.pl",26],["cloud.aeolservice.es",27],["nuevoloquo.ch",28],["fogaonet.com",29],["zbiornik.com",30],["bitbucket.io",31],["ton.org",32],["sutterhealth.org",33],["antpool.com",34],["thegraph.com",38],["followalice.com",[38,837]],["headout.com",39],["london-tickets.co.uk",39],["kosmas.cz",40],["blog.documentfoundation.org",41],["my.eneba.com",42],["blitzortung.org",43],["esim.redteago.com",44],["tester.userbrain.com",45],["empathy.com",45],["labs.epi2me.io",45],["fydeos.io",46],["autos.suzuki.com.mx",47],["stonly.com",48],["camp-fire.jp",49],["my2n.com",50],["vandalism-sounds.com",51],["oocl.com",52],["brazzersnetwork.com",53],["safaricom.co.ke",54],["smile.io",55],["hiermitherz.de",56],["uk2.net",57],["aeromexico.com",[58,59]],["easywintergarten.de",60],["vinothekwaespi.ch",[61,62,63]],["graphy.com",64],["raspberrypi.dk",65],["ocean.io",66],["waves.is",67],["tesa.com",68],["repair.wd40.com",69],["gls-group.eu",72],["chipsaway.co.uk",73],["heatstore.eu",74],["luvly.care",74],["firmen.wko.at",74],["copaamerica.com",75],["apunyalometre.cat",75],["cooleygo.com",76],["map.blitzortung.org",77],["northumbriasport.com",78],["clearspend.natwest.com",79],["cellcolabsclinical.com",80],["producthunt.com",81],["motorsportreg.com",[82,83]],["imola.motorsportreg.com",[84,85]],["pga.com",86],["portal.payment.eltax.lta.go.jp",87],["greenbuildingadvisor.com",[88,89,90]],["finewoodworking.com",[88,89,90]],["privatekeys.pw",91],["telli.dpd.ee",92],["youthforum.org",92],["votegroup.de",[93,94]],["pharmahall.gr",95],["x-team.com",96],["reservations.helveticmotion.ch",97],["endclothing.com",[98,99]],["kraftwerk.co.at",100],["fhr.biz",101],["srf.nu",102],["jn.fo",[103,104]],["rovia.es",105],["platforma.eb2b.com.pl",105],["schwanger-in-bayern.de",106],["stmas.bayern.de",[106,726]],["bayern-gegen-gewalt.de",106],["verfwebwinkel.be",107],["wayfair.co.uk",108],["wayfair.de",108],["wayfair.ie",108],["physiotherapie-naurod.de",109],["airnewzealand.co.nz",110],["viu.com",111],["dinamalar.com",112],["volkswagen-group.com",113],["solo.io",114],["pomelo.la",115],["ibuypower.com",116],["sberbank.com",[117,512]],["swissmilk.ch",118],["gamemaker.io",119],["pixiv.net",120],["kinemaster.com",121],["sp32bb.pl",122],["jazz.fm",123],["juntadeandalucia.es",124],["melee.gg",[125,126,127]],["chemocare.com",128],["mobiliteit.nl",129],["virginatlantic.com",[130,131,132,133,134]],["xledger.net",135],["legalteam.hu",136],["mediately.co",137],["reviewmeta.com",138],["guide-bordeaux-gironde.com",139],["travelinsured.com",140],["gdpr.twitter.com",141],["mora.hu",142],["confused.com",143],["physikinstrumente.de",144],["karlknauer.de",144],["schoeck.com",144],["resonate.coop",144],["northgatevehiclehire.ie",144],["badhall.at",144],["cic.ch",144],["tryhackme.com",145],["ilsaggiatore.com",146],["forum.digitalfernsehen.de",147],["bitscrunch.com",[148,149,150]],["hannahgraaf.com",151],["shop.elbers-hof.de",[152,153]],["woolsocks.eu",154],["uza.be",155],["5asec.ch",155],["wizards.com",155],["kitepackaging.co.uk",[156,157]],["parkenflughafen.de",158],["radyofenomen.com",159],["elsate.com",160],["hume.ai",161],["lotusantwerp.wacs.online",162],["gitbook.io",163],["gitbook.com",163],["thehacker.recipes",163],["docs.dyrector.io",163],["docs.webstudio.is",163],["docs.chartbeat.com",163],["docs.civic.com",163],["makeresearchpay.com",164],["tandartsenpraktijk-simons.tandartsennet.nl",165],["huisartsenpraktijkdoorn.nl",165],["bcorporation.net",166],["knime.com",[166,210]],["quebueno.es",166],["edookit.com",167],["trixonline.be",168],["radio-canada.ca",169],["heysummit.com",170],["puromarketing.com",171],["radicalmotorsport.com",172],["biurobox.pl",173],["cycling74.com",174],["triviacreator.com",175],["reforge.com",175],["freshis.com",175],["anker.com",175],["computacenter.com",176],["playbalatro.com",177],["kastner-oehler.de",178],["kastner-oehler.at",178],["kastner-oehler.ch",178],["twenga.it",179],["twenga.fr",179],["twenga.co.uk",179],["twenga.de",179],["twenga.es",179],["twenga.pl",179],["twenga.nl",179],["twenga.se",179],["olx.kz",180],["olx.uz",180],["efl.com",181],["wst.tv",181],["cuvva.com",182],["vitbikes.de",183],["gourmetfoodstore.com",184],["schulfahrt.de",185],["deutsche-finanzagentur.de",186],["thejazzcafelondon.com",187],["keeb.supply",188],["spb.hh.ru",189],["kaluga.hh.ru",189],["school.hh.ru",189],["rating.hh.ru",189],["novgorod.hh.ru",189],["xxxshemaleporn.com",[190,191]],["gayhits.com",[190,191]],["gaypornvideos.xxx",[190,191]],["sextubespot.com",[190,191]],["wewantjusticedao.org",192],["godbolt.org",193],["projectenglish.com.pl",[194,200]],["ledenicheur.fr",194],["pricespy.co.uk",194],["pricespy.co.nz",194],["sae.fsc.ccoo.es",195],["piusx-college.nl",196],["forgeofempires.com",197],["yoomoney.ru",198],["vod.warszawa.pl",199],["m.twitch.tv",201],["environment.data.gov.uk",202],["playtesting.games",203],["portal.by.aok.de",204],["umlandscout.de",205],["atombank.co.uk",[206,207,208]],["showtv.com.tr",209],["seventhgeneration.com",210],["press.princeton.edu",210],["ldz.lv",210],["crtm.es",211],["airastana.com",212],["vkf-renzel.nl",213],["booking.reederei-zingst.de",[214,215,216]],["booking.weisse-flotte.de",[214,215,216]],["booking2.reederei-hiddensee.de",[214,215,216]],["sanswiss.pl",217],["galaxy.com",218],["petdesk.com",219],["ivyexec.com",220],["railtech.com",221],["lottehotel.com",[222,223,224,225,226]],["paydirekt.de",227],["kijiji.ca",228],["posterstore.fr",229],["posterstore.eu",229],["posterstore.be",229],["posterstore.de",229],["posterstore.hu",229],["posterstore.ie",229],["posterstore.it",229],["posterstore.no",229],["posterstore.nl",229],["posterstore.pl",229],["posterstore.com",229],["posterstore.ae",229],["posterstore.ca",229],["posterstore.nz",229],["posterstore.es",229],["posterstore.kr",229],["posterstore.jp",229],["posterstore.dk",229],["posterstore.se",229],["posterstore.ch",229],["posterstore.at",229],["myriadicity.net",230],["dgsf.org",230],["endgame.id",231],["cashback-cards.ch",232],["swisscard.ch",232],["ahorn24.de",233],["blockdyor.com",234],["ticket.io",235],["omega-nuernberg.servicebund.com",236],["lojaboschferramentas.com.br",[237,239,240]],["shareloft.com",238],["fineartsmuseum.recreatex.be",[241,242,243]],["jaapeden.nl",[241,242,243]],["eboo.lu",244],["lasmallagency.com",245],["lhsystems.com",[246,247,248,249]],["twomates.de",250],["intergiro.com",251],["healthygamer.gg",252],["telepizza.es",[253,254,255]],["telepizza.pt",[253,254,255]],["frisco.pl",256],["tyleenslang.nl",257],["schrikdraad.net",257],["kruiwagen.net",257],["pvcvoordeel.nl",257],["pvcbuis.com",257],["drainagebuizen.nl",257],["likewise.com",258],["longines.com",[259,260,261,262]],["vater-it.de",263],["biano.hu",264],["nadia.gov.gr",265],["hana-book.fr",266],["kzvb.de",267],["correosexpress.com",268],["cexpr.es",268],["rte.ie",269],["smart.com",270],["gry.pl",270],["gamesgames.com",270],["games.co.uk",270],["jetztspielen.de",270],["ourgames.ru",270],["permainan.co.id",270],["gioco.it",270],["jeux.fr",270],["juegos.com",270],["ojogos.com.br",270],["oyunskor.com",270],["spela.se",270],["spelletjes.nl",270],["agame.com",270],["spielen.com",270],["flashgames.ru",270],["games.co.id",270],["giochi.it",270],["jeu.fr",270],["spel.nl",270],["tridge.com",271],["asus.com",[272,273]],["drinksking.sk",274],["neuhauschocolates.com",275],["commandsuite.it",276],["designmynight.com",276],["oktea.tw",277],["1028loveu.com.tw",277],["airbubu.com",277],["amai.tw",277],["anns.tw",277],["as.estore.armarpot.com",277],["as-eweb.com",277],["asf.com.tw",277],["asics.com.hk",277],["asics.com.tw",277],["ausupreme.com",277],["basiik.com",277],["bearboss.com",277],["beast-kingdom.com.tw",277],["beldora.com.tw",277],["benefitcosmetics.com.tw",277],["bns.com.tw",277],["byhue-official.com",277],["candybox.com.tw",277],["columbiasportswear.com.tw",277],["concerto.com.tw",277],["countess.tw",277],["cuapp.com",277],["daima.asia",277],["dettol-store.com.tw",277],["dickies.com.tw",277],["doga.com.tw",277],["dot-st.tw",277],["dr-douxi.tw",277],["durex-store.com.tw",277],["echome.com.hk",277],["eding.com.tw",277],["e-hilltop.com",277],["faduobra.com",277],["fairlady.com.tw",277],["fbshop.com.tw",277],["freshdays-shop.com",277],["hh-taiwan.com.tw",277],["iqueen.com.tw",277],["jjfish.com.tw",277],["jpmed.com.tw",277],["jsstore.com.tw",277],["kipling.com.tw",277],["kuaiche.com.tw",277],["lanew.com.tw",277],["leejeans.com.tw",277],["levis.com.tw",277],["ludeya.com",277],["lulus.tw",277],["makeupforever.com.tw",277],["mart.family.com.tw",277],["meinlcoffee.com.tw",277],["metroasis.com.tw",277],["minervababy.com.tw",277],["miss21.estore.asgroup.com.tw",277],["miu-star.com.tw",277],["mkup.tw",277],["mlb-korea.com.hk",277],["mollifix.com",277],["naruko.com.tw",277],["newweb.renoirpuzzle.com.tw",277],["nikokids.com.tw",277],["nisoro.com",277],["odout.com",277],["ouiorganic.com",277],["pandababy.com.tw",277],["peachy.com.tw",277],["poyabuy.com.tw",277],["premierfood.com.hk",277],["rachelwine.com.tw",277],["risal.com.tw",277],["sasa.com.hk",277],["schiff-store.com.tw",277],["sexylook.com.tw",277],["sfn.com.tw",277],["shingfangpastry.com",277],["shop.3m.com.tw",277],["shop.5soap.com",277],["shop.atunas.com.tw",277],["shop.bosscat.com.tw",277],["shop.conas.com.tw",277],["shop.cosmed.com.tw",277],["shop.coville.com.tw",277],["shop.euyansang.com.hk",277],["shop.kbc.com.tw",277],["shop.kemei.com.tw",277],["shop.kky.com.tw",277],["shop.norns.com.tw",277],["shop.okogreen.com.tw",277],["shop.skechers-twn.com",277],["shop.s3.com.tw",277],["shop.teascovery.com",277],["shop.wacoal.com.tw",277],["shop.wumajia.com.tw",277],["shopping.dradvice.asia",277],["shop0315.com.tw",277],["sky-blue.com.tw",277],["snowpeak.com.tw",277],["songbeam.com.tw",277],["so-nice.com.tw",277],["store-philips.tw",277],["tcsb.com.tw",277],["thenorthface.com.tw",277],["timberland.com.tw",277],["tokuyo.com.tw",277],["triumphshop.com.tw",277],["trygogo.com",277],["tupiens-foodie.com",277],["tw.istayreal.com",277],["tw.puma.com",277],["vans.com.tw",277],["vemar.com.tw",277],["vigill.com.tw",277],["vilson.com",277],["vincentsworld.com.tw",277],["wealthshop888.com",277],["yamazaki.com.tw",277],["bafin.de",278],["materna.de",278],["bamf.de",278],["tenvinilo-argentina.com",[279,280]],["eikaforsikring.no",[281,282]],["eurowings.com",[283,284,285]],["newpharma.be",[286,287,288]],["newpharma.fr",[286,287,288]],["newpharma.de",[286,287,288]],["newpharma.at",[286,287,288]],["newpharma.nl",[286,287,288]],["kapoorwatch.com",289],["instantoffices.com",290],["paf.se",290],["citibank.pl",290],["citibankonline.pl",290],["azertyfactor.be",291],["zelezodum.cz",292],["thw.de",293],["bafa.de",293],["bka.de",293],["bmbf.de",293],["weather.com",294],["bolist.se",[295,296]],["project529.com",296],["evivanlanschot.nl",297],["alohabrowser.com",298],["prenatal.nl",299],["onnibus.com",[299,945,946,947]],["kyoceradocumentsolutions.us",[299,996,997]],["kyoceradocumentsolutions.ch",[299,996,997]],["kyoceradocumentsolutions.co.uk",[299,996,997]],["kyoceradocumentsolutions.de",[299,996,997]],["kyoceradocumentsolutions.es",[299,996,997]],["kyoceradocumentsolutions.eu",[299,996,997]],["kyoceradocumentsolutions.fr",[299,996,997]],["kyoceradocumentsolutions.it",[299,996,997]],["kyoceradocumentsolutions.ru",[299,996,997]],["kyoceradocumentsolutions.mx",[299,996,997]],["kyoceradocumentsolutions.cl",[299,996,997]],["kyoceradocumentsolutions.com.br",[299,996,997]],["wagner-tuning.com",[300,301,302,303]],["waitrosecellar.com",[304,305,306,307]],["waitrose.com",[304,659]],["kvk.nl",[308,309,310]],["macfarlanes.com",311],["pole-emploi.fr",312],["gardenmediaguild.co.uk",313],["samplerite.com",314],["samplerite.cn",314],["sororedit.com",315],["blukit.com.br",316],["biegnaszczyt.pl",317],["staff-gallery.com",318],["itv.com",319],["dvag.de",320],["premierinn.com",[321,322,323,324]],["whitbreadinns.co.uk",[321,322,323,324]],["barandblock.co.uk",[321,322,323,324]],["tabletable.co.uk",[321,322,323,324]],["brewersfayre.co.uk",[321,322,323,324]],["beefeater.co.uk",[321,322,323,324]],["allstarssportsbars.co.uk",[325,326]],["babiesrus.ca",327],["toysrus.ca",327],["roomsandspaces.ca",327],["athletic-club.eus",[328,329,330]],["wattoo.dk",331],["wattoo.no",331],["texthelp.com",[332,333]],["courierexchange.co.uk",[334,335,336]],["haulageexchange.co.uk",[334,335,336]],["ecaytrade.com",337],["unka.bilecik.edu.tr",337],["powerball.com",338],["tlaciarik.sk",338],["tiskarik.cz",338],["sseriga.edu",[339,340]],["rt.com",341],["swrng.de",342],["crfop.gdos.gov.pl",343],["nurgutes.de",344],["kpcen-torun.edu.pl",345],["opintopolku.fi",346],["app.erevie.pl",347],["debenhams.com",348],["archiwumalle.pl",349],["konicaminolta.ca",350],["konicaminolta.us",350],["deutschebank-dbdirect.com",[351,352,353]],["dbonline.deutsche-bank.es",[351,352,353]],["deutsche-bank.es",[351,352,353]],["hipotecaonline.db.com",354],["kangasalansanomat.fi",355],["eif.org",356],["tunnelmb.net",356],["sugi-net.jp",357],["understandingsociety.ac.uk",358],["leibniz.com",359],["horecaworld.biz",[359,629]],["horecaworld.be",[359,629]],["bettertires.com",359],["electroprecio.com",359],["autohero.com",359],["computerbase.de",[359,991]],["sistemacomponentes.com.br",360],["bargaintown.ie",361],["tui.nl",362],["doppelmayr.com",363],["case-score.com",[364,365]],["cote.co.uk",366],["finimize.com",366],["unsplash.com",366],["k-einbruch.de",[367,368]],["blxxded.com",367],["rtu.lv",369],["sysdream.com",370],["cinemarkca.com",371],["neander-zahn.de",372],["thespaniardshampstead.co.uk",373],["carsupermarket.com",373],["theadelphileeds.co.uk",373],["tobycarvery.co.uk",373],["harvester.co.uk",373],["stonehouserestaurants.co.uk",373],["millerandcarter.co.uk",373],["browns-restaurants.co.uk",373],["thechampionpub.co.uk",373],["therocketeustonroad.co.uk",373],["thesheepheidedinburgh.co.uk",373],["thejerichooxford.co.uk",373],["hartsboatyard.co.uk",373],["thesalisburyarmsedinburgh.co.uk",373],["thelambchiswick.co.uk",373],["barntgreeninn.co.uk",373],["the-albany.co.uk",373],["sonofsteak.co.uk",373],["thewashingtonhampstead.co.uk",373],["princessofwalespub.co.uk",373],["harrycookcheltenham.co.uk",373],["thegreenmantrumpington.com",373],["queenandcastlekenilworth.co.uk",373],["whitehorseradlett.co.uk",373],["woolpackstokemandeville.co.uk",373],["thewhitehartpirbright.co.uk",373],["castleportobello.co.uk",373],["theswanbroadway.co.uk",373],["thederbyarmsepsom.co.uk",373],["thedewdropinnoxford.co.uk",373],["thejunctionharborne.co.uk",373],["therailwayblackheath.co.uk",373],["whitehartbrasted.co.uk",373],["thewarrenwokingham.co.uk",373],["thedukesheadcrawley.co.uk",373],["thewhitehartse19.co.uk",373],["thesunclapham.co.uk",373],["thevolunteernw1.co.uk",373],["theramsheaddisley.co.uk",373],["thepalaceleeds.co.uk",373],["edinborocastlepub.co.uk",373],["arnosarms.co.uk",373],["dehemspub.co.uk",373],["dukeofdevonshireeastbourne.co.uk",373],["flanagansappleliverpool.co.uk",373],["fontbrighton.co.uk",373],["hawkinsforge.co.uk",373],["hopeandbearreading.co.uk",373],["ploughandharrowaldridge.co.uk",373],["radicalsandvictuallers.co.uk",373],["redlionhandcross.co.uk",373],["stgeorgeanddragon.co.uk",373],["theanchorinnirby.co.uk",373],["thearkley.co.uk",373],["theappletreegerrardscross.co.uk",373],["theashtonbristol.co.uk",373],["thebankplymouth.co.uk",373],["thebathamptonmill.co.uk",373],["theblackbullyarm.co.uk",373],["thebotanistbristol.co.uk",373],["thebootmappleboroughgreen.co.uk",373],["thebullislington.co.uk",373],["thecavershamrosereading.co.uk",373],["thecliffcanfordcliffs.co.uk",373],["thecockinncockfosters.co.uk",373],["theencorestratford.co.uk",373],["theferry.co.uk",373],["viajesatodotren.com",374],["firsttable.co.uk",375],["ticketingcine.fr",376],["agenziavista.it",377],["e-chladiva.cz",377],["bitecode.dev",378],["mjob.si",[379,380,381]],["airportrentacar.gr",382],["mobile-fueling.de",382],["plos.org",383],["autohaus24.de",384],["sixt-neuwagen.de",384],["gadis.es",[385,386]],["dom.ru",386],["ford-kimmerle-reutlingen.de",387],["autohaus-reitermayer.de",387],["autohaus-diefenbach-waldbrunn.de",387],["autohaus-diefenbach.de",387],["autohaus-musberg.de",387],["ford-ah-im-hunsrueck-simmern.de",387],["ford-arndt-goerlitz.de",387],["ford-autogalerie-alfeld.de",387],["ford-bacher-schrobenhausen.de",387],["ford-bathauer-bad-harzburg.de",387],["ford-behrend-waren.de",387],["ford-bergland-frankfurt-oder.de",387],["ford-bergland-wipperfuerth.de",387],["ford-besico-glauchau.de",387],["ford-besico-nuernberg.de",387],["ford-bischoff-neumuenster.de",387],["ford-bodach-borgentreich.de",387],["ford-bunk-saarbruecken.de",387],["ford-bunk-voelklingen.de",387],["ford-busch-kirchberg.de",387],["ford-diermeier-muenchen.de",387],["ford-dinnebier-leipzig.de",387],["ford-duennes-regensburg.de",387],["ford-fischer-bochum.de",387],["ford-fischer-muenster.de",387],["ford-foerster-koblenz.de",387],["ford-fuchs-uffenheim.de",387],["ford-geberzahn-koeln.de",387],["ford-gerstmann-duesseldorf.de",387],["ford-haefner-und-strunk-kassel.de",387],["ford-hartmann-kempten.de",387],["ford-hartmann-rastatt.de",387],["ford-hatzner-karlsruhe.de",387],["ford-heine-hoexter.de",387],["ford-hentschel-hildesheim.de",387],["ford-hessengarage-dreieich.de",387],["ford-hessengarage-frankfurt.de",387],["ford-hga-windeck.de",387],["ford-hommert-coburg.de",387],["ford-horstmann-rastede.de",387],["ford-janssen-sonsbeck.de",387],["ford-jochem-stingbert.de",387],["ford-jungmann-wuppertal.de",387],["ford-kestel-marktzeuln.de",387],["ford-klaiber-bad-friedrichshall.de",387],["ford-koenig-eschwege.de",387],["ford-kohlhoff-mannheim.de",387],["ford-kt-automobile-coesfeld.de",387],["ford-lackermann-wesel.de",387],["ford-ludewig-delligsen.de",387],["ford-maiwald-linsengericht.de",387],["ford-mertens-beckum.de",387],["ford-meyer-bad-oeynhausen.de",387],["ford-mgs-bayreuth.de",387],["ford-mgs-radebeul.de",387],["ford-muecke-berlin.de",387],["ford-norren-weissenthurm.de",387],["ford-nrw-garage-duesseldorf.de",387],["ford-nrw-garage-handweiser.de",387],["ford-nuding-remshalden.de",387],["ford-ohm-rendsburg.de",387],["ford-reinicke-muecheln.de",387],["ford-rennig.de",387],["ford-roerentrop-luenen.de",387],["ford-schankola-dudweiler.de",387],["ford-sg-goeppingen.de",387],["ford-sg-leonberg.de",387],["ford-sg-neu-ulm.de",387],["ford-sg-pforzheim.de",387],["ford-sg-waiblingen.de",387],["ford-storz-st-georgen.de",387],["ford-strunk-koeln.de",387],["ford-tobaben-hamburg.de",387],["ford-toenjes-zetel.de",387],["ford-wagner-mayen.de",387],["ford-wahl-fritzlar.de",387],["ford-wahl-siegen.de",387],["ford-weege-bad-salzuflen.de",387],["ford-westhoff-hamm.de",387],["ford-wieland-hasbergen.de",387],["renault-autocenterprignitz-pritzwalk.de",387],["renault-spenrath-juelich.de",387],["vitalllit.com",388],["fincaparera.com",388],["dbnetbcn.com",388],["viba.barcelona",388],["anafaustinoatelier.com",388],["lamparasherrero.com",388],["calteixidor.cat",388],["argentos.barcelona",388],["anmarlube.com",388],["anynouxines.barcelona",388],["crearunapaginaweb.cat",388],["cualesmiip.com",388],["porndoe.com",[389,390,391]],["thinkingaustralia.com",392],["elrow.com",393],["ownit.se",394],["velo-antwerpen.be",[395,396]],["wwnorton.com",397],["pc-canada.com",398],["mullgs.se",399],["1a-sehen.de",400],["feature.fm",401],["comte.com",402],["baltic-watches.com",403],["np-brijuni.hr",403],["vilgain.com",403],["tradingview.com",404],["wevolver.com",405],["experienciasfree.com",406],["freemans.com",407],["kivikangas.fi",408],["lumingerie.com",408],["melkkobrew.fi",408],["kh.hu",[409,410,411]],["aplgo.com",412],["securityconference.org",413],["aha.or.at",[414,417]],["fantasyfitnessing.com",415],["chocolateemporium.com",416],["account.samsung.com",418],["crushwineco.com",419],["levi.pt",420],["fertagus.pt",421],["snowboardel.es",422],["bagosport.cz",422],["akumo.cz",422],["snowboardel.cz",422],["pompo.cz",422],["oveckarna.cz",422],["rockpoint.cz",422],["rockpoint.sk",422],["parfum-zentrum.de",422],["candy-store.cz",422],["vivobarefoot.cz",422],["sartor-stoffe.de",422],["smiggle.co.uk",423],["ubisoft.com",[424,425,426,427]],["store.ubisoft.com",[424,427,869,870]],["thulb.uni-jena.de",428],["splityourticket.co.uk",429],["eramba.org",430],["openai.com",[431,432]],["kupbilecik.com",[433,434]],["kupbilecik.de",[433,434]],["kupbilecik.pl",[433,434]],["shopilya.com",435],["arera.it",436],["haustier-berater.de",436],["hfm-frankfurt.de",436],["zoommer.ge",437],["studentapan.se",438],["petcity.lt",[439,440,441,442]],["tobroco.com",[443,447]],["tobroco.nl",[443,447]],["tobroco-giant.com",[443,447]],["geosfreiberg.de",[444,445]],["eapvic.org",446],["bassolsenergia.com",446],["bammusic.com",[448,450,451]],["green-24.de",449],["phish-test.de",452],["bokadirekt.se",453],["ford.lt",454],["ford.pt",454],["ford.fr",454],["ford.de",454],["ford.dk",454],["ford.pl",454],["ford.se",454],["ford.nl",454],["ford.no",454],["ford.fi",454],["ford.gr",454],["ford.it",454],["data-media.gr",455],["e-food.gr",[456,457]],["bvmed.de",458],["babyshop.com",[459,460,461]],["griffbereit24.de",462],["checkwx.com",463],["calendardate.com",464],["wefashion.ch",465],["wefashion.fr",465],["wefashion.lu",465],["wefashion.be",465],["wefashion.de",465],["wefashion.nl",465],["brettspiel-angebote.de",[466,467]],["nio.com",468],["kancelarskepotreby.net",[469,470,471]],["segment-anything.com",472],["sketch.metademolab.com",473],["cambridgebs.co.uk",474],["freizeitbad-greifswald.de",475],["giuseppezanotti.com",[476,477,478]],["xcen.se",478],["biggreenegg.co.uk",479],["skihuette-oberbeuren.de",[480,481,482]],["pwsweather.com",483],["xfree.com",484],["theweathernetwork.com",[485,486]],["monese.com",[487,488,489]],["assos.com",487],["helmut-fischer.com",490],["myscience.org",491],["7-eleven.com",492],["airwallex.com",493],["streema.com",494],["gov.lv",495],["tise.com",496],["codecamps.com",497],["avell.com.br",498],["moneyfarm.com",499],["app.moneyfarm.com",499],["simpl.rent",500],["hubspot.com",501],["prodyna.com",[502,503,504,505]],["zutobi.com",[502,503,504,505]],["calm.com",[506,507]],["pubgesports.com",[508,509,510]],["outwrite.com",511],["sbermarket.ru",513],["atani.com",[514,515,516]],["croisieresendirect.com",517],["bgextras.co.uk",518],["sede.coruna.gal",519],["czech-server.cz",520],["hitech-gamer.com",521],["bialettikave.hu",[522,523,524]],["canalplus.com",[525,526,527]],["mader.bz.it",[528,529,530]],["supply.amazon.co.uk",531],["bhaptics.com",532],["cleverbot.com",533],["watchaut.film",534],["tuffaloy.com",535],["fanvue.com",535],["electronoobs.com",536],["xn--lkylen-vxa.se",537],["tiefenthaler-landtechnik.at",538],["tiefenthaler-landtechnik.ch",538],["tiefenthaler-landtechnik.de",538],["varma.fi",539],["vyos.io",540],["digimobil.es",[541,542]],["teenage.engineering",543],["merrell.pl",[544,807]],["converse.pl",544],["shop.wf-education.com",[544,807]],["werkenbijaswatson.nl",545],["converse.com",[546,547]],["buyandapply.nexus.org.uk",548],["img.ly",549],["halonen.fi",[549,581,582,583,584]],["carlson.fi",[549,581,582,583,584]],["cams.ashemaletube.com",[550,551]],["electronicacerler.com",[552,553,554]],["okpoznan.pl",[555,560]],["ielts.idp.com",556],["ielts.co.nz",556],["ielts.com.au",556],["einfach-einreichen.de",[557,558,559]],["endlesstools.io",561],["mbhszepkartya.hu",562],["casellimoveis.com.br",563],["embedplus.com",564],["e-file.pl",565],["sp215.info",566],["empik.com",567],["senda.pl",568],["united-camera.at",569],["befestigungsfuchs.de",569],["cut-tec.co.uk",570],["gaytimes.co.uk",571],["statisticsanddata.org",572],["hello.one",573],["paychex.com",574],["wildcat-koeln.de",575],["libraries.merton.gov.uk",[576,577]],["tommy.hr",[578,579]],["usit.uio.no",580],["demo-digital-twin.r-stahl.com",585],["la31devalladolid.com",[586,587]],["mx.com",588],["foxtrail.fjallraven.com",589],["dotwatcher.cc",590],["bazarchic.com",[591,592,593]],["seedrs.com",594],["mypensiontracker.co.uk",595],["praxisplan.at",[595,616]],["esimplus.me",596],["cineplanet.com.pe",597],["ecologi.com",598],["wamba.com",599],["eurac.edu",600],["akasaair.com",601],["rittal.com",602],["worstbassist.com",[603,604,605,606,607,608]],["zs-watch.com",609],["crown.com",610],["mesanalyses.fr",611],["teket.jp",612],["fish.shimano.com",[613,614,615]],["simsherpa.com",[617,618,619]],["translit.ru",620],["aruba.com",621],["aireuropa.com",622],["skfbearingselect.com",[623,624]],["scanrenovation.com",625],["ttela.se",626],["dominospizza.pl",627],["devagroup.pl",628],["secondsol.com",629],["angelifybeauty.com",630],["cotopaxi.com",631],["justjoin.it",632],["digibest.pt",633],["two-notes.com",634],["theverge.com",635],["daimant.co",636],["secularism.org.uk",637],["karriere-hamburg.de",638],["musicmap.info",639],["gasspisen.se",640],["medtube.pl",641],["medtube.es",641],["medtube.fr",641],["medtube.net",641],["standard.sk",642],["linmot.com",643],["larian.com",[643,935]],["s-court.me",643],["containerandpackaging.com",644],["top-yp.de",645],["termania.net",646],["account.nowpayments.io",647],["fizjobaza.pl",648],["gigasport.at",649],["gigasport.de",649],["gigasport.ch",649],["velleahome.gr",650],["nicequest.com",651],["handelsbanken.no",652],["handelsbanken.com",652],["handelsbanken.co.uk",652],["handelsbanken.se",[652,734]],["handelsbanken.dk",652],["handelsbanken.fi",652],["ilarahealth.com",653],["songtradr.com",[654,919]],["logo.pt",[655,656]],["app.zasta.de",657],["softlist.com.ua",657],["flexwhere.co.uk",[657,658]],["flexwhere.de",[657,658]],["pricewise.nl",657],["getunleash.io",657],["dentmania.de",657],["free.navalny.com",657],["latoken.com",657],["campusbrno.cz",[660,661,662]],["secrid.com",663],["etsy.com",664],["careers.cloud.com",664],["blablacar.rs",665],["blablacar.ru",665],["blablacar.com.tr",665],["blablacar.com.ua",665],["blablacar.com.br",665],["seb.se",666],["sebgroup.com",666],["deps.dev",667],["buf.build",668],["starofservice.com",669],["ytcomment.kmcat.uk",670],["gmx.com",671],["gmx.fr",671],["karofilm.ru",672],["octopusenergy.it",673],["octopusenergy.es",[673,674]],["justanswer.es",675],["justanswer.de",675],["justanswer.com",675],["justanswer.co.uk",675],["citilink.ru",676],["huutokaupat.com",677],["kaggle.com",678],["emr.ch",[679,684]],["gem.cbc.ca",680],["pumatools.hu",681],["ici.tou.tv",682],["crunchyroll.com",683],["mayflex.com",685],["clipchamp.com",685],["gdemoideti.ru",685],["trouwenbijfletcher.nl",685],["fletcher.nl",685],["fletcherzakelijk.nl",685],["intermatic.com",685],["jusbrasil.com.br",686],["mobilevikings.be",687],["ebikelohr.de",688],["eurosender.com",689],["melectronics.ch",690],["guard.io",691],["nokportalen.se",692],["dokiliko.com",693],["valamis.com",[694,695,696]],["sverigesingenjorer.se",697],["shop.almawin.de",[698,699,700,737]],["zeitzurtrauer.de",701],["skaling.de",[702,703,704]],["bringmeister.de",705],["gdx.net",706],["clearblue.com",707],["drewag.de",[708,709,710]],["enso.de",[708,709,710]],["buidlbox.io",708],["helitransair.com",711],["more.com",712],["nwslsoccer.com",712],["watch.sonlifetv.com",713],["climatecentral.org",714],["resolution.de",715],["flagma.by",716],["eatsalad.com",717],["pacstall.dev",718],["web2.0calc.fr",719],["de-appletradein.likewize.com",720],["swissborg.com",721],["qwice.com",722],["canalpluskuchnia.pl",[723,724]],["uizard.io",725],["novayagazeta.eu",727],["kinopoisk.ru",728],["yandex.ru",728],["go.netia.pl",[729,730]],["polsatboxgo.pl",[729,730]],["ing.it",[731,732]],["ing.nl",733],["youcom.com.br",735],["rule34.paheal.net",736],["deep-shine.de",737],["shop.ac-zaun-center.de",737],["kellermann-online.com",737],["kletterkogel.de",737],["pnel.de",737],["korodrogerie.de",737],["der-puten-shop.de",737],["katapult-shop.de",737],["evocsports.com",737],["esm-computer.de",737],["calmwaters.de",737],["mellerud.de",737],["akustik-projekt.at",737],["vansprint.de",737],["0815.at",737],["0815.eu",737],["ojskate.com",737],["der-schweighofer.de",737],["tz-bedarf.de",737],["zeinpharma.de",737],["weicon.com",737],["dagvandewebshop.be",737],["thiele-tee.de",737],["carbox.de",737],["riapsport.de",737],["trendpet.de",737],["eheizung24.de",737],["seemueller.com",737],["vivande.de",737],["heidegrill.com",737],["gladiator-fightwear.com",737],["h-andreas.com",737],["pp-parts.com",737],["natuerlich-holzschuhe.de",737],["massivart.de",737],["malermeister-shop.de",737],["imping-confiserie.de",737],["lenox-trading.at",737],["cklenk.de",737],["catolet.de",737],["drinkitnow.de",737],["patisserie-m.de",737],["storm-proof.com",737],["balance-fahrradladen.de",737],["magicpos.shop",737],["zeinpharma.com",737],["sps-handel.net",737],["novagenics.com",737],["butterfly-circus.de",737],["holzhof24.de",737],["w6-wertarbeit.de",737],["fleurop.de",737],["leki.com",737],["extremeaudio.de",737],["taste-market.de",737],["delker-optik.de",737],["stuhl24-shop.de",737],["g-nestle.de",737],["alpine-hygiene.ch",737],["fluidmaster.it",737],["cordon.de",737],["belisse-beauty.de",737],["belisse-beauty.co.uk",737],["wpc-shop24.de",737],["liv.si",737],["maybach-luxury.com",737],["leiternprofi24.de",737],["hela-shop.eu",737],["hitado.de",737],["j-koenig.de",737],["gameseal.com",737],["armedangels.com",[737,814,815]],["bvk-beamtenversorgung.de",738],["hofer-kerzen.at",739],["dosenmatrosen.de",739],["karls-shop.de",740],["byggern.no",741],["donauauen.at",742],["woltair.cz",743],["rostics.ru",744],["hife.es",745],["lilcat.com",746],["hot.si",[747,748,749,750]],["crenolibre.fr",751],["monarchmoney.com",752],["e-pole.pl",753],["dopt.com",754],["keb-automation.com",755],["bonduelle.ru",756],["oxfordonlineenglish.com",757],["pccomponentes.fr",758],["pccomponentes.com",758],["pccomponentes.pt",758],["grants.at",759],["africa-uninet.at",759],["rqb.at",759],["youngscience.at",759],["oead.at",759],["innovationsstiftung-bildung.at",759],["etwinning.at",759],["arqa-vet.at",759],["zentrumfuercitizenscience.at",759],["vorstudienlehrgang.at",759],["erasmusplus.at",759],["jeger.pl",760],["bo.de",761],["thegamingwatcher.com",762],["norlysplay.dk",763],["plusujemy.pl",764],["asus.com.cn",[765,767]],["zentalk.asus.com",[765,767]],["mubi.com",766],["59northwheels.se",768],["photospecialist.co.uk",769],["foto-gregor.de",769],["kamera-express.de",769],["kamera-express.be",769],["kamera-express.nl",769],["kamera-express.fr",769],["kamera-express.lu",769],["dhbbank.com",770],["dhbbank.de",770],["dhbbank.be",770],["dhbbank.nl",770],["login.ingbank.pl",771],["fabrykacukiernika.pl",[772,773]],["peaks.com",774],["3landesmuseen-braunschweig.de",775],["unifachbuch.de",[776,777,778]],["playlumi.com",[779,780,781]],["chatfuel.com",782],["studio3t.com",[783,784,785,786]],["realgap.co.uk",[787,788,789,790]],["hotelborgia.com",[791,792]],["sweet24.de",793],["zwembaddekouter.be",794],["flixclassic.pl",795],["jobtoday.com",796],["deltatre.com",[797,798,812]],["withings.com",[799,800,801]],["blista.de",[802,803]],["hashop.nl",804],["gift.be",[805,806]],["elevator.de",807],["foryouehealth.de",807],["animaze.us",807],["penn-elcom.com",807],["curantus.de",807],["mtbmarket.de",807],["spanienweinonline.ch",807],["novap.fr",807],["bizkaia.eus",[808,809,810]],["sinparty.com",811],["mantel.com",813],["e-dojus.lv",816],["burnesspaull.com",817],["oncosur.org",818],["photobooth.online",819],["epidemicsound.com",820],["ryanair.com",821],["refurbished.at",[822,823,824]],["refurbished.nl",[822,823,824]],["refurbished.be",[822,823,824]],["refurbishedstore.de",[822,823,824]],["bayernportal.de",[825,826,827]],["ayudatpymes.com",828],["zipjob.com",828],["shoutcast.com",828],["plastischechirurgie-muenchen.info",829],["bonn.sitzung-online.de",830],["depop.com",[831,832,833]],["thenounproject.com",834],["pricehubble.com",835],["ilmotorsport.de",836],["karate.com",837],["psbank.ru",837],["myriad.social",837],["exeedme.com",837],["dndbeyond.com",838],["news.samsung.com",839],["tibber.com",840],["aqua-store.fr",841],["voila.ca",842],["anastore.com",843],["app.arzt-direkt.de",844],["dasfutterhaus.at",845],["e-pity.pl",846],["fillup.pl",847],["dailymotion.com",848],["barcawelt.de",849],["lueneburger-heide.de",850],["polizei.bayern.de",[851,853]],["ourworldofpixels.com",852],["jku.at",854],["matkahuolto.fi",855],["backmarket.de",[856,857,858]],["backmarket.co.uk",[856,857,858]],["backmarket.es",[856,857,858]],["backmarket.be",[856,857,858]],["backmarket.at",[856,857,858]],["backmarket.fr",[856,857,858]],["backmarket.gr",[856,857,858]],["backmarket.fi",[856,857,858]],["backmarket.ie",[856,857,858]],["backmarket.it",[856,857,858]],["backmarket.nl",[856,857,858]],["backmarket.pt",[856,857,858]],["backmarket.se",[856,857,858]],["backmarket.sk",[856,857,858]],["backmarket.com",[856,857,858]],["eleven-sportswear.cz",[859,860,861]],["silvini.com",[859,860,861]],["silvini.de",[859,860,861]],["purefiji.cz",[859,860,861]],["voda-zdarma.cz",[859,860,861]],["lesgarconsfaciles.com",[859,860,861]],["ulevapronohy.cz",[859,860,861]],["vitalvibe.eu",[859,860,861]],["plavte.cz",[859,860,861]],["mo-tools.cz",[859,860,861]],["flamantonlineshop.cz",[859,860,861]],["sandratex.cz",[859,860,861]],["norwayshop.cz",[859,860,861]],["3d-foto.cz",[859,860,861]],["neviditelnepradlo.cz",[859,860,861]],["nutrimedium.com",[859,860,861]],["silvini.cz",[859,860,861]],["karel.cz",[859,860,861]],["silvini.sk",[859,860,861]],["book-n-drive.de",862],["cotswoldoutdoor.com",863],["cotswoldoutdoor.ie",863],["cam.start.canon",864],["usnews.com",865],["researchaffiliates.com",866],["singkinderlieder.de",867],["stiegeler.com",868],["ba.com",[871,872,873,874,875,876,877]],["britishairways.com",[871,872,873,874,875,876,877]],["cineman.pl",[878,879,880]],["tv-trwam.pl",[878,879,880,881]],["qatarairways.com",[882,883,884,885,886]],["wedding.pl",887],["vivaldi.com",888],["emuia1.gugik.gov.pl",889],["nike.com",890],["adidas.at",891],["adidas.be",891],["adidas.ca",891],["adidas.ch",891],["adidas.cl",891],["adidas.co",891],["adidas.co.in",891],["adidas.co.kr",891],["adidas.co.nz",891],["adidas.co.th",891],["adidas.co.uk",891],["adidas.com",891],["adidas.com.ar",891],["adidas.com.au",891],["adidas.com.br",891],["adidas.com.my",891],["adidas.com.ph",891],["adidas.com.vn",891],["adidas.cz",891],["adidas.de",891],["adidas.dk",891],["adidas.es",891],["adidas.fi",891],["adidas.fr",891],["adidas.gr",891],["adidas.ie",891],["adidas.it",891],["adidas.mx",891],["adidas.nl",891],["adidas.no",891],["adidas.pe",891],["adidas.pl",891],["adidas.pt",891],["adidas.ru",891],["adidas.se",891],["adidas.sk",891],["colourbox.com",892],["ebilet.pl",893],["myeventeo.com",894],["snap.com",895],["louwman.nl",[896,897]],["ratemyprofessors.com",898],["filen.io",899],["leotrippi.com",900],["restaurantclub.pl",900],["context.news",900],["queisser.de",900],["grandprixradio.dk",[901,902,903,904,905]],["grandprixradio.nl",[901,902,903,904,905]],["grandprixradio.be",[901,902,903,904,905]],["businessclass.com",906],["quantamagazine.org",907],["hellotv.nl",908],["jisc.ac.uk",909],["lasestrellas.tv",910],["xn--digitaler-notenstnder-m2b.com",911],["schoonmaakgroothandelemmen.nl",911],["nanuko.de",911],["hair-body-24.de",911],["shopforyou47.de",911],["kreativverliebt.de",911],["anderweltverlag.com",911],["octavio-shop.com",911],["forcetools-kepmar.eu",911],["fantecshop.de",911],["hexen-werkstatt.shop",911],["shop-naturstrom.de",911],["biona-shop.de",911],["camokoenig.de",911],["bikepro.de",911],["kaffeediscount.com",911],["vamos-skateshop.com",911],["holland-shop.com",911],["avonika.com",911],["royal-oak.org",912],["hurton.pl",913],["officesuite.com",914],["fups.com",[915,920]],["kevin.eu",[916,917,918]],["scienceopen.com",921],["moebel-mahler-siebenlehn.de",[922,923]],["calendly.com",924],["batesenvironmental.co.uk",[925,926]],["ubereats.com",927],["101internet.ru",928],["bein.com",929],["beinsports.com",929],["figshare.com",930],["bitso.com",931],["gallmeister.fr",932],["eco-toimistotarvikkeet.fi",933],["proficient.fi",933],["developer.ing.com",934],["webtrack.dhlglobalmail.com",936],["webtrack.dhlecs.com",936],["ehealth.gov.gr",937],["calvinklein.se",[938,939,940]],["calvinklein.fi",[938,939,940]],["calvinklein.sk",[938,939,940]],["calvinklein.si",[938,939,940]],["calvinklein.ch",[938,939,940]],["calvinklein.ru",[938,939,940]],["calvinklein.com",[938,939,940]],["calvinklein.pt",[938,939,940]],["calvinklein.pl",[938,939,940]],["calvinklein.at",[938,939,940]],["calvinklein.nl",[938,939,940]],["calvinklein.hu",[938,939,940]],["calvinklein.lu",[938,939,940]],["calvinklein.lt",[938,939,940]],["calvinklein.lv",[938,939,940]],["calvinklein.it",[938,939,940]],["calvinklein.ie",[938,939,940]],["calvinklein.hr",[938,939,940]],["calvinklein.fr",[938,939,940]],["calvinklein.es",[938,939,940]],["calvinklein.ee",[938,939,940]],["calvinklein.de",[938,939,940]],["calvinklein.dk",[938,939,940]],["calvinklein.cz",[938,939,940]],["calvinklein.bg",[938,939,940]],["calvinklein.be",[938,939,940]],["calvinklein.co.uk",[938,939,940]],["ofdb.de",941],["dtksoft.com",942],["serverstoplist.com",943],["truecaller.com",944],["fruugo.fi",948],["ukbrewerytours.com",949],["sk-nic.sk",949],["worldcupchampionships.com",949],["arturofuente.com",[949,951,952]],["protos.com",[949,951,952]],["timhortons.co.th",[949,950,951,953,955,956]],["toyota.co.uk",[949,950,951,954,955,956]],["businessaccountingbasics.co.uk",[949,950,951,953,955,956]],["flickr.org",[949,950,951,953,955,956]],["espacocasa.com",949],["altraeta.it",949],["centrooceano.it",949],["allstoresdigital.com",949],["cultarm3d.de",949],["soulbounce.com",949],["fluidtopics.com",949],["uvetgbt.com",949],["malcorentacar.com",949],["emondo.de",949],["maspero.it",949],["kelkay.com",949],["underground-england.com",949],["vert.eco",949],["turcolegal.com",949],["magnet4blogging.net",949],["moovly.com",949],["automationafrica.co.za",949],["jornaldoalgarve.pt",949],["keravanenergia.fi",949],["kuopas.fi",949],["frag-machiavelli.de",949],["healthera.co.uk",949],["mobeleader.com",949],["powerup-gaming.com",949],["developer-blog.net",949],["medical.edu.mt",949],["deh.mt",949],["bluebell-railway.com",949],["ribescasals.com",949],["javea.com",949],["chinaimportal.com",949],["inds.co.uk",949],["raoul-follereau.org",949],["serramenti-milano.it",949],["cosasdemujer.com",949],["luz-blanca.info",949],["cosasdeviajes.com",949],["safehaven.io",949],["havocpoint.it",949],["motofocus.pl",949],["nomanssky.com",949],["drei-franken-info.de",949],["clausnehring.com",949],["alttab.net",949],["kinderleicht.berlin",949],["kiakkoradio.fi",949],["cosasdelcaribe.es",949],["de-sjove-jokes.dk",949],["serverprofis.de",949],["biographyonline.net",949],["iziconfort.com",949],["sportinnederland.com",949],["natureatblog.com",949],["wtsenergy.com",949],["cosasdesalud.es",949],["internetpasoapaso.com",949],["zurzeit.at",949],["contaspoupanca.pt",949],["steamdeckhq.com",[949,950,951,953,955,956]],["ipouritinc.com",[949,951,953]],["hemglass.se",[949,951,953,955,956]],["sumsub.com",[949,950,951]],["atman.pl",[949,950,951]],["fabriziovanmarciano.com",[949,950,951]],["nationalrail.com",[949,950,951]],["eett.gr",[949,950,951]],["funkypotato.com",[949,950,951]],["equalexchange.co.uk",[949,950,951]],["swnsdigital.com",[949,950,951]],["gogolf.fi",[949,953]],["hanse-haus-greifswald.de",949],["tampereenratikka.fi",[949,951,957,958]],["kymppikatsastus.fi",[951,955,1005,1006]],["santander.rewardgateway.co.uk",[959,960]],["brasiltec.ind.br",961],["xhaccess.com",961],["seexh.com",961],["valuexh.life",961],["xham.live",961],["xhamster.com",961],["xhamster.desi",961],["xhamster1.desi",961],["xhamster19.com",961],["xhamster2.com",961],["xhamster3.com",961],["xhamster42.desi",961],["xhamsterlive.com",961],["xhchannel.com",961],["xhchannel2.com",961],["xhdate.world",961],["xhopen.com",961],["xhspot.com",961],["xhtab4.com",961],["xhwebsite5.com",961],["xhwide5.com",961],["doka.com",[962,963,964]],["abi.de",[965,966]],["studienwahl.de",[965,966]],["journal.hr",[967,968,969,970]],["howstuffworks.com",971],["stickypassword.com",[972,973,974]],["conversion-rate-experts.com",[975,976]],["merkur.si",[977,978,979]],["petitionenligne.com",[980,981]],["petitionenligne.be",[980,981]],["petitionenligne.fr",[980,981]],["petitionenligne.re",[980,981]],["petitionenligne.ch",[980,981]],["skrivunder.net",[980,981]],["petitiononline.uk",[980,981]],["petitions.nz",[980,981]],["petizioni.com",[980,981]],["peticao.online",[980,981]],["skrivunder.com",[980,981]],["peticiones.ar",[980,981]],["petities.com",[980,981]],["petitionen.com",[980,981]],["petice.com",[980,981]],["opprop.net",[980,981]],["peticiok.com",[980,981]],["peticiones.net",[980,981]],["peticion.es",[980,981]],["peticiones.pe",[980,981]],["peticiones.mx",[980,981]],["peticiones.cl",[980,981]],["peticije.online",[980,981]],["peticiones.co",[980,981]],["mediathek.lfv-bayern.de",982],["aluypvc.es",[983,984,985]],["pracuj.pl",[986,987,988,989,990]],["vki.at",992],["konsument.at",992],["chollometro.com",993],["dealabs.com",993],["hotukdeals.com",993],["pepper.it",993],["pepper.pl",993],["preisjaeger.at",993],["mydealz.de",993],["220.lv",[994,995]],["pigu.lt",[994,995]],["kaup24.ee",[994,995]],["hansapost.ee",[994,995]],["hobbyhall.fi",[994,995]],["direct.travelinsurance.tescobank.com",[998,999,1000,1001,1002,1003,1004,1005]],["mediaite.com",1007],["easyfind.ch",[1008,1009]],["e-shop.leonidas.com",[1010,1011]],["lastmile.lt",1012],["veriff.com",1013],["tvpworld.com",1014],["vm.co.mz",1015],["gamearena.pl",1016],["constantin.film",[1017,1018,1019]],["notion.so",1020],["omgevingsloketinzage.omgeving.vlaanderen.be",[1021,1022]],["primor.eu",1023],["tameteo.com",1024],["tempo.pt",1024],["yourweather.co.uk",1024],["meteored.cl",1024],["meteored.mx",1024],["tempo.com",1024],["ilmeteo.net",1024],["meteored.com.ar",1024],["daswetter.com",1024],["myprivacy.dpgmedia.nl",1025],["myprivacy.dpgmediagroup.net",1025],["algarvevacation.net",1026],["3sat.de",1027],["oxxio.nl",[1028,1029]],["butterflyshop.dk",[1030,1031,1032]],["praxis.nl",1033],["brico.be",1033],["kent.gov.uk",[1034,1035]],["pohjanmaanhyvinvointi.fi",1036],["maanmittauslaitos.fi",1037]]);

const entitiesMap = new Map([["airchina",[35,36,37]],["top4mobile",[70,71]]]);

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
    const normalized = value.toLowerCase();
    const match = /^("?)(.+)\1$/.exec(normalized);
    const unquoted = match && match[2] || normalized;
    const validValues = getSafeCookieValuesFn();
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

function getSafeCookieValuesFn() {
    return [
        'accept', 'reject',
        'accepted', 'rejected', 'notaccepted',
        'allow', 'disallow', 'deny',
        'allowed', 'denied',
        'approved', 'disapproved',
        'checked', 'unchecked',
        'dismiss', 'dismissed',
        'enable', 'disable',
        'enabled', 'disabled',
        'essential', 'nonessential',
        'hide', 'hidden',
        'necessary', 'required',
        'ok',
        'on', 'off',
        'true', 't', 'false', 'f',
        'yes', 'y', 'no', 'n',
    ];
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
