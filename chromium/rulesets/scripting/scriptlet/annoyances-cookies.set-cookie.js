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

const argsList = [["__toppy_consent","1"],["_u123_cc","yes"],["ga-disable","true"],["ga_consentement","0"],["eu_cookies_acknowledged","true"],["funnycase_cookie_policy_v2","1","","reload","1"],["VMAKE_COOKIE_POLICY","0"],["fmalertcookies","true"],["wikiwand.cookies.consent","true"],["accepted_cookie_policy","false"],["GDPR","9"],["dad_consent","true"],["agreedToCookiesanon","1"],["pum-937","true"],["essential_cookies_enabled","true"],["google_cookies_enabled","false"],["cookiepolicyinfo_new2","true"],["livedoor-blog-gdpr-agreed","1"],["camra_experience_cookie_consent","1"],["valCookie1","1"],["third-party","required","","reload","1"],["COOKIES_ACCEPTED","true"],["cookienotification","1"],["_cookieconsentv2","1"],["cconsent","1"],["cookies-info","true"],["cookies_and_content_security_policy","false"],["cookies_consent_disclaimer","false"],["intramuros-cookie-consent","true"],["intramuros-analytics","false"],["website_cookies_bar","true"],["CF_GDPR_COOKIE_CONSENT_VIEWED","1"],["cookie-confirm","1"],["cookie_preferences_set","true"],["S_COOKIES_ACCEPTED","true"],["isCookieLegalBannerSelected","true"],["cc","1"],["doSomethingOnlyOnce","true"],["tos_consent","allow"],["fn_cookie_banner","1"],["adult_confirm","1"],["atl-gdpr-consent","0010000"],["cookies-allowance","true"],["_acceptsEssential","true"],["informedConsent","1"],["EnableABTest","false"],["EnableFacebook","false"],["EnableGA","false"],["cookie-consent","false"],["consent-state","true"],["was_cookie_consent","no"],["ytprefs_gdpr_consent","1","","reload","1"],["cconsent","1000"],["CONSENT","15"],["nCookieVisible","2"],["CookieConsent","false"],["cookie_consent","necessary"],["suzuki-accept-cookie","true"],["cookieHidden","true"],["terms_agreement_popup_agreed","true","","reload","1"],["consent_panel","1"],["user_allowed_save_cookie","true"],["AcceptCookie","yes"],["cookieConsent","0"],["cookieConsent","rejected"],["smile_allow_cookies","true"],["cookie_alert","true"],["cb-enabled","accepted"],["AgreeCookies","true"],["AreCookiesSet","true"],["chcCookieHint","1","","reload","1"],["accept-selected-cookies","true","","reload","1"],["cookiePreferences","true"],["necessary","true"],["has_accepted_cookies","true"],["cs_viewed_cookie_policy","yes"],["cookies","false"],["cookies_accepted","0"],["cookies_informed","true"],["has-seen-cookie-notice","true","","reload","1"],["cookies-agreed","1"],["cookies-analytical","0"],["gls-cookie-policy","accepted"],["cookies-configured","1"],["consent","true"],["localConsent","true"],["pum-13751","true"],["CONSENT","1"],["cm_level","0"],["st-cookie-token","true"],["functionalCookie","true"],["agreed_cookie_policy","1"],["hasMadeConsentSelection","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".motorsportreg.com"],["hasMadeConsentSelection","true","","","domain",".imola.motorsportreg.com"],["hasMadeConsentSelectionGPC","true","","","domain",".imola.motorsportreg.com"],["gdprPGA","true"],["xn_cookieconsent","false","","reload","1"],["taunton_user_consent_submitted","true"],["taunton_user_consent_advertising","false"],["taunton_user_consent_analytics","false"],["cookie_consent_closed","1"],["__cookie_consent","false"],["dsgvo-stat","yes"],["dsgvo-mark","no"],["cookieSettings","11","","reload","1"],["google-tagmanager","false"],["decline","true","","","reload","1"],["cookieTermsDismissed","true"],["cookieConsentDismissed","true"],["kraftwerkCookiePolicyState","1"],["privacyPolicyAccept","1","","reload","1"],["CookieConsent","necessary"],["analyticsStatus","false"],["socialMediaStatus","false"],["cookiesAccepted","","reload","1"],["required","1"],["pmStorage","1"],["user_cookie_prefs","1"],["_coo_seen","1"],["airTRFX_cookies","accepted"],["cookie_consent_accept","true"],["agree","true"],["vw_mms_hide_cookie_dialog","1"],["solo_opt_in","false"],["POMELO_COOKIES","1"],["AcceptUseCookie","Accept"],["sbrf.pers_notice","1"],["closedCookieBanner","true"],["yoyocookieconsent_viewed","true"],["privacy_policy_agreement","6","","reload","1"],["kinemaster-cookieconstent","1"],["cookie_acceptance","1"],["jazzfm-privacy","true"],["show_msg_cookies","false"],["CookieConsent","true","","reload","1"],["FunctionalCookie","true"],["AnalyticalCookie","false"],[".YourApp.ConsentCookie","yes","","reload","1"],["gdpr","deny"],["VAA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["VAA_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["VAA_ENSIGHTEN_PRIVACY_Marketing","0"],["VAA_ENSIGHTEN_PRIVACY_Functional","0"],["VAA_ENSIGHTEN_PRIVACY_Analytics","0"],["agreesWithCookies","true"],["gaCookies","false"],["cookiesApproved20231","true"],["rm-first-time-modal-welcome","1"],["cookieConsent-2023-03","false"],["CookieDisclaimer","1"],["twtr_pixel_opt_in","N"],["RBCookie-Alert","1"],["CookieConsentV4","false"],["cookieconsent_status","allow"],["cookieconsent_status","dismiss"],["cookies_analytics_enabled","0","","reload","1"],["xf_notice_dismiss","1"],["rcl_consent_given","true"],["rcl_preferences_consent","true"],["rcl_marketing_consent","false"],["confirmed-cookies","1","","reload","1"],["cb_validCookies","1"],["cb_accepted","1"],["ws-cookie-Techniques","true"],["cookie-agreed","2"],["cookie_consent","yes"],["cookie_consent_options","3"],["consentIsSetByUser","true","","reload","1"],["isSiteCookieReviewed","0","","reload","1"],["phpbb3_4zn6j_ca","true"],["cookieBar-cookies-accepted","true"],["cookie_consent_user_accepted","true"],["__gitbook_cookie_granted","no"],["WB_CookieNotification","1"],["cookieConfirmation","true"],["gdpr2_required","true"],["gdpr2","true"],["DmCookiesAccepted","true"],["DmCookiesAnalytics","false"],["DmCookiesMarketing","false"],["cookie_accepted","1"],["user_cookie_consent","false","","reload","1"],["cookies-marketing","N"],["gatsby-gdpr-google-tagmanager","false"],["uuAppCookiesAgreement","true"],["_cookies-consent","yes"],["RCI_APP_LEGAL_DISCLAIMER_COOKIE","false"],["hs_cookieconsent","true"],["cookiergpdjnz","1"],["__radicalMotorsport.ac","true"],["cookies_message_bar_hidden","true"],["acceptsCookies","false"],["accept_cookies","accepted"],["consent_seen","1"],["_gdpr_playbalatro","1"],["consentAll","0"],["cookiewarning","1","","reload","1"],["cookieBarSeen","true"],["cookie_consent_given","true"],["cuvva.app.website.cookie-policy.consent","1"],["custom-cookies-accepted","1","","reload","1"],["AnalyticsAcceptancePopOver","false"],["cookiecookie","1"],["disclaimer-overlay","true"],["complianceCookie","true"],["KeebSupplyCookieConsent","true"],["cookie_policy_agreement","true"],["kt_tcookie","1"],["splash_Page_Accepted","true"],["gdpr-analytics-enabled","false"],["privacy_status","1"],["privacy_settings","1"],["config","1","","reload","1"],["hideCookieNotification","true","","reload","1"],["CookieNotification","1"],["has_accepted_gdpr","1"],["app-cookie-consents","1"],["analitics_cookies","0"],["accept_cookies","yes","","reload","1"],["tachyon-accepted-cookie-notice","true"],["defra-cookie-banner-dismissed","true","","reload","1"],["myAwesomeCookieName3","true"],["cookie-notification","ACCEPTED","","reload","1"],["loader","1"],["enableAnalyticsCookies","denied"],["acknowledgeCookieBanner","true"],["enableTargetingAdvertisingCookies","denied"],["cookiePolicy","1"],["cookie-agreed","0"],["crtmcookiesProtDatos","1","","reload","1"],["NADevGDPRCookieConsent_portal_2","1"],["handledCookieMessage","1"],["targeting","false"],["functionality","false"],["performance","false"],["cookie_info","1","","reload","1"],["bannerDissmissal","true","","reload","1"],["allowCookies","true"],["COOKIE-POLICY-ACCEPT","true"],["gdpr","accept"],["essentialCookie","Y"],["checkCookie","Y"],["analyticsCookie","N"],["marketingCookie","N"],["thirdCookie","N"],["paydirektCookieAllowed","false"],["hdcab","true"],["synapse-cookie-preferences-set","true"],["confirm_cookies","1"],["endgame-accept-policy","true"],["sc-privacy-settings","true"],["accept_cookies2","true","","reload","1"],["cf_consent","false"],["privacyCookie","1","","reload","1"],["cookieChoice","0"],["lgpdConsent","true"],["shareloft_cookie_decision","1"],["privacy_marketing","false"],["privacy_comodidade","false"],["acceptAnalyticsCookies","false"],["acceptFunctionalCookies","true"],["cookiePolicyConfirmed","true","","reload","1"],["PostAnalytics","0"],["gatsby-gdpr","false"],["functionalCookiesAccepted","true"],["necessaryCookies","true"],["comfortCookiesAccepted","false"],["statisticsCookiesAccepted","false"],["gdpr-google-analytics","false"],["cookie_policy","true"],["cookieModalAccept","no"],["AcceptFunctionalCookies","true"],["AcceptAnalyticsCookies","false"],["AcceptNonFunctionalCookies","false"],["forced-cookies-modal","2"],["cookiebar","1"],["cookieconsent_status","true"],["longines-cookiesstatus-analytics","false"],["longines-cookiesstatus-functional","false"],["longines-cookiesstatus-necessary","true"],["longines-cookiesstatus-social","false"],["pz_cookie_consent","true"],["_cb","1","","reload","1"],["consent-status","1"],["HANA-RGPD","accepted"],["cookie-optin","true"],["msg_cookie_CEX","true"],["OptanonAlertBoxClosed","ok"],["OptanonAlertBoxClosed","true"],["cookieBannerHidden","true"],["isReadCookiePolicyDNT","true"],["isReadCookiePolicyDNTAa","false"],["coookieaccept","ok"],["consentTrackingVerified","true"],["consent","0"],["allowGetPrivacyInfo","true"],["cookiebanner","0"],["_tv_cookie_consent","y"],["_tv_cookie_choice","1"],["eika_consent_set","true"],["eika_consent_marketing","false"],["ew_cookieconsent","1"],["ew_cookieconsent_optin_b","true"],["ew_cookieconsent_optin_a","true"],["gdpr-agree-cookie","1","","reload","1"],["gdpr-consent-cookie-level3","1"],["gdpr-consent-cookie-level2","1"],["ck-cp","accepted"],["cookieConsent","1"],["consent-cookie","1"],["show_gdpr_cookie_message_388801234_cz","no"],["gsbbanner","0"],["__adblocker","false","","reload","1"],["cookies_marketing_ok","false"],["cookies_ok","true"],["acceptCookies","0"],["acceptCookie","1"],["marketingCookies","false"],["CookieLaw_statistik 0"],["CookieLaw_komfort","0"],["CookieLaw_personalisierung","0"],["CookieLaw","on"],["wtr_cookie_consent","1"],["wtr_cookies_advertising","0"],["wtr_cookies_functional","0"],["wtr_cookies_analytics","0"],["allowTrackingCookiesKvK","0"],["cookieLevelCodeKVK","1"],["allowAnalyticsCookiesKvK","0"],["macfarlanes-necessary-cookies","accepted"],["TC_PRIVACY_CENTER","0"],["AllowCookies","false","","reload","1"],["consented","false"],["cookie_tou","1","","reload","1"],["blukit_novo","true"],["cr","true"],["gdpr_check_cookie","accepted","","reload","1"],["accept-cookies","accepted"],["dvag_cookies2023","1"],["consent_cookie","1"],["permissionExperience","false"],["permissionPerformance","false"],["permissionMarketing","false"],["consent_analytics","false"],["consent_received","true"],["cookieModal","false"],["user-accepted-AEPD-cookies","1"],["personalization-cookies-consent","0","","reload","1"],["analitics-cookies-consent","0"],["sscm_consent_widget","1"],["texthelp_cookie_consent_in_eu","0"],["texthelp_cookie_consent","yes"],["nc_cookies","accepted"],["nc_analytics","rejected"],["nc_marketing","rejected"],[".AspNet.Consent","yes","","reload","1"],[".AspNet.Consent","no","","reload","1"],["user_gave_consent","1"],["user_gave_consent_new","1"],["rt-cb-approve","true"],["CookieLayerDismissed","true"],["RODOclosed","true"],["cookieDeclined","1"],["cookieModal","true"],["oph-mandatory-cookies-accepted","true"],["cookies-accept","1"],["dw_is_new_consent","true"],["accept_political","1"],["konicaminolta.us","1"],["cookiesAnalyticsApproved","0"],["hasConfiguredCookies","1"],["cookiesPubliApproved","0"],["cookieAuth","1"],["kscookies","true"],["cookie-policy","true"],["cookie-use-accept","false"],["ga-disable-UA-xxxxxxxx-x","true"],["consent","1"],["acceptCookies","1"],["cookie-bar","no"],["CookiesAccepted","no"],["essential","true"],["cookieConfirm","true"],["trackingConfirm","false"],["cookie_consent","false"],["cookie_consent","true"],["gtm-disable-GTM-NLVRXX8","true"],["uce-cookie","N"],["tarteaucitron","false"],["cookiePolicies","true"],["cookie_optin_q","false"],["ce-cookie","N"],["NTCookies","0"],["CookieConsentFT","1"],["alertCookie","1","","reload","1"],["gdpr","1"],["hideCookieBanner","true"],["obligatory","true"],["marketing","false"],["analytics","false"],["cookieControl","true"],["plosCookieConsentStatus","false"],["user_accepted_cookies","1"],["analyticsAccepted","false"],["cookieAccepted","true"],["hide-gdpr-bar","true"],["promptCookies","1"],["_cDaB","1"],["_aCan_analytical","0"],["_aGaB","1"],["surbma-gpga","no"],["elrowCookiePolicy","yes"],["ownit_cookie_data_permissions","1"],["Cookies_Preferences","accepted"],["Cookies_Preferences_Analytics","declined"],["privacyPolicyAccepted","true"],["Cookies-Accepted","true"],["cc-accepted","2"],["cc-item-google","false"],["featureConsent","false","","reload","1"],["accept-cookie","no"],["consent","0","","reload","1"],["cookiePrivacyPreferenceBannerProduction","accepted"],["cookiesConsent","false"],["2x1cookies","1"],["firstPartyDataPrefSet","true"],["cookies-required","1","","reload","1"],["kh_cookie_level4","false"],["kh_cookie_level3","false"],["kh_cookie_level1","true"],["cookie_agreement","1","","reload","1"],["MSC_Cookiebanner","false"],["cookieConsent_marketing","false"],["Fitnessing21-15-9","0"],["cookies_popup","yes"],["cookieConsent_required","true","","reload","1"],["sa_enable","off"],["acceptcookietermCookieBanner","true"],["cookie_status","1","","reload","1"],["FTCookieCompliance","1"],["cookie-bar","0"],["cookiePopupAccepted","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_ADS_OPTOUT","true"],["UBI_PRIVACY_POLICY_ACCEPTED","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["cookieNotification.shown","1"],["localConsent","false"],["oai-allow-ne","false"],["consent","rejected"],["allow-cookie","1"],["cookie-functional","1"],["hulkCookieBarClick","1"],["CookieConsent","1"],["zoommer-cookie_agreed","true"],["accepted_cookie_policy","true"],["gdpr_cookie_token","1"],["_consent_personalization","denied"],["_consent_analytics","denied"],["_consent_marketing","denied"],["cookieWall","1"],["no_cookies","1"],["hidecookiesbanner","1"],["CookienatorConsent","false"],["cookieWallOptIn","0"],["analyticsCookiesAccepted","false"],["cf4212_cn","1"],["mediaCookiesAccepted","false"],["mandatoryCookiesAccepted","true"],["gtag","true"],["BokadirektCookiePreferencesMP","1"],["cookieAcknowledged","true"],["data-privacy-statement","true"],["cookie_privacy_level","required"],["accepted_cookies","true","","reload","1"],["MATOMO_CONSENT_GIVEN","0"],["BABY_MARKETING_COOKIES_CONSENTED","false"],["BABY_PERFORMANCE_COOKIES_CONSENTED","false"],["BABY_NECESSARY_COOKIES_CONSENTED","true"],["consent_essential","allow"],["cookieshown","1"],["warn","true"],["optinCookieSetting","1"],["privacy-shown","true"],["slimstat_optout_tracking","true"],["npp_analytical","0"],["inshopCookiesSet","true"],["adsCookies","false"],["performanceCookies","false"],["sa_demo","false"],["animated_drawings","true"],["cookieStatus","true"],["swgCookie","false"],["cookieConsentPreferencesGranted","1"],["cookieConsentMarketingGranted","0"],["cookieConsentGranted","1"],["cookies-rejected","true"],["NL_COOKIE_KOMFORT","false"],["NL_COOKIE_MEMORY","true","","reload","1"],["NL_COOKIE_STATS","false"],["pws_gdrp_accept","1"],["have18","1"],["pelm_cstate","1"],["pelm_consent","1"],["accept-cookies","true"],["accept-analytical-cookies","false"],["accept-marketing-cookies","false"],["cookie-level-v4","0"],["analytics_consent","yes"],["sei-ccpa-banner","true"],["awx_cookie_consent","true"],["cookie_warning","1"],["allowCookies","0"],["cookiePolicyAccepted","true"],["codecamps.cookiesConsent","true"],["cookiesConsent","true"],["consent_updated","true"],["acsr","1"],["__hs_gpc_banner_dismiss","true"],["cookieyes-necessary","yes"],["cookieyes-other","no"],["cky-action","yes"],["cookieyes-functional","no"],["has-declined-cookies","true","","reload","1"],["has-agreed-to-cookies","false"],["essential","Y"],["analytics","N"],["functional","N"],["gradeproof_shown_cookie_warning","true"],["sber.pers_notice_en","1"],["cookies_consented","yes"],["cookies_consent","true"],["cookies_consent","false"],["anal-opt-in","false"],["accepted","1"],["CB393_DONOTREOPEN","true"],["AYTO_CORUNA_COOKIES","1","","reload","1"],["I6IISCOOKIECONSENT0","n","","reload","1"],["htg_consent","0"],["cookie_oldal","1"],["cookie_marketing","0"],["cookie_jog","1"],["cp_cc_ads","0"],["cp_cc_stats","0"],["cp_cc_required","1"],["ae-cookiebanner","true"],["ae-esential","true"],["ae-statistics","false"],["ccs-supplierconnect","ACCEPTED"],["accepted_cookies","yes"],["note","1"],["cookieConsent","required"],["cookieConsent","accepted"],["pd_cc","1"],["gdpr_ok","necessary"],["allowTracking","false"],["varmafi_mandatory","true"],["VyosCookies","Accepted"],["analyticsConsent","false"],["adsConsent","false"],["te_cookie_ok","1"],["amcookie_policy_restriction","allowed"],["cookieConsent","allowed"],["dw_cookies_accepted","1"],["acceptConverseCookiePolicy","0"],["gdpr-banner","1"],["privacySettings","1"],["are_essential_consents_given","1"],["is_personalized_content_consent_given","1"],["acepta_cookies_funcionales","1"],["acepta_cookies_obligatorias","1"],["acepta_cookies_personalizacion","1"],["cookiepolicyinfo_new","true"],["acceptCookie","true"],["ee-hj","n"],["ee-ca","y","","reload","1"],["ee-yt","y"],["cookie_analytics","false"],["et_cookie_consent","true"],["cookieBasic","true"],["cookieMold","true"],["ytprefs_gdpr_consent","1"],["efile-cookiename-","1"],["plg_system_djcookiemonster_informed","1","","reload","1"],["cvc","true"],["cookieConsent3","true"],["acris_cookie_acc","1","","reload","1"],["termsfeed_pc1_notice_banner_hidden","true"],["cmplz_marketing","allowed"],["cmplz_marketing","allow"],["acknowledged","true"],["ccpaaccept","true"],["gdpr_shield_notice_dismissed","yes"],["luci_gaConsent_95973f7b-6dbc-4dac-a916-ab2cf3b4af11","false"],["luci_CookieConsent","true"],["ng-cc-necessary","1"],["ng-cc-accepted","accepted"],["PrivacyPolicyOptOut","yes"],["consentAnalytics","false"],["consentAdvertising","false"],["consentPersonalization","false"],["privacyExpiration","1"],["cookieconsent_status","deny"],["lr_cookies_tecnicas","accepted"],["cookies_surestao","accepted","","reload","1"],["hide-cookie-banner","1"],["fjallravenCookie","1"],["accept_cookie_policy","true"],["_marketing","0"],["_performance","0"],["RgpdBanner","1"],["seen_cookie_message","accepted"],["complianceCookie","on"],["cookie-consent","1","","reload","1"],["cookie-consent","0"],["ecologi_cookie_consent_20220224","false"],["appBannerPopUpRulesCookie","true"],["eurac_cookie_consent","true"],["akasaairCookie","accepted"],["rittalCC","1"],["ckies_facebook_pixel","deny"],["ckies_google_analytics","deny"],["ckies_youtube","allow"],["ckies_cloudflare","allow"],["ckies_paypal","allow"],["ckies_web_store_state","allow"],["hasPolicy","Y"],["modalPolicyCookieNotAccepted","notaccepted"],["MANA_CONSENT","true"],["_ul_cookie_consent","allow"],["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["trackingCookies","off"],["acceptanalytics","no"],["acceptadvertising","no"],["acceptfunctional","yes"],["consent18","0","","reload","1"],["ATA.gdpr.popup","true"],["AIREUROPA_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["privacyNoticeExpireDate","1"],["privacyNoticeAccepted","true"],["policy_accepted","1"],["stampen-cookies-hide-information","yes"],["dominos_cookies_accepted","1"],["deva_accepted","yes"],["cookies_consent","1"],["cookies_modal","true"],["cookie_notice","1"],["cookiesPopup","1"],["digibestCookieInfo","true"],["cookiesettings_status","allow"],["_duet_gdpr_acknowledged","1"],["daimant_collective","accept","","reload","1"],["cookies-notice","1","","reload","1"],["banner","2","","reload","1"],["privacy-policy-2023","accept"],["user_cookie_consent","false"],["cookiePolicy","4"],["standard_gdpr_consent","true"],["cookie_accept","true"],["cookieBanner","true"],["tncookieinfo","1","","reload","1"],["agree_with_cookies","1"],["cookie-accepted","true"],["cookie-accepted","yes"],["acceptsAdvertisingCookies","false"],["consentAll","1"],["hide_cookies_consent","1"],["nicequest_optIn","1"],["shb-consent-cookies","false"],["cookies-accepted","true","","reload","1"],["cpaccepted","true"],["cookieMessageDismissed","1"],["LG_COOKIE_CONSENT","0"],["CookieConsent","true"],["gatsby-plugin-google-tagmanager","false"],["wtr_cookies_functional","1"],["cookie-m-personalization","0"],["cookie-m-marketing","0"],["cookie-m-analytics","0"],["cookies","true"],["ctc_rejected","1"],["_cookies_v2","1"],["AcceptedCookieCategories","1"],["cookie_policy_acknowledgement","true"],["allowCookies","yes"],["cookieNotification","true"],["privacy","true"],["euconsent-bypass","1"],["cookie_usage","yes"],["dismissCookieBanner","true"],["switchCookies","1"],["cbChecked","true"],["infoCookieUses","true"],["consent-data-v2","0"],["ACCEPTED_COOKIES","true"],["EMR-CookieConsent-Analytical","0","","reload","1"],["gem_cookies_usage_production","1"],["cookie_level","2"],["toutv_cookies_usage_production","1"],["_evidon_suppress_notification_cookie","1"],["EMR-CookieConsent-Advertising","0"],["acceptCookies","true"],["br-lgpd-cookie-notice-agreement-v1","1"],["privacy_mv","1"],["COOKIES_NEWACCEPTED","1"],["es_cookie_settings_closed","1"],["cookie-banner-acceptance-state","true"],["cookie_consent_seen","1"],["cookies_allowed","yes"],["tracking","0"],["valamis_cookie_message","true","","reload","1"],["valamis_cookie_marketing","false"],["valamis_cookie_analytics","false"],["approvedcookies","no","","reload","1"],["psd-google-ads-enabled","0"],["psd-gtm-activated","1"],["wishlist-enabled","1"],["consentInteract","true"],["cookie-byte-consent-essentials","true"],["cookie-byte-consent-showed","true"],["cookie-byte-consent-statistics","false"],["bm_acknowledge","yes"],["genovaPrivacyOptions","1","","reload","1"],["kali-cc-agreed","true"],["cookiesAccepted","true"],["allowMarketingCookies","false"],["allowAnalyticalCookies","false"],["privacyLevel","2","","reload","1"],["AcceptedCookies","1"],["gcp","1","","reload","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["privacyLevel","flagmajob_ads_shown","1","","reload","1"],["userCookies","true"],["privacy-policy-accepted","1"],["precmp","1","","reload","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["statistik","0"],["cookies-informer-close","true"],["gdpr","0"],["rodo-reminder-displayed","1"],["rodo-modal-displayed","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["bvkcookie","true"],["cookie-preference","1","","reload","1"],["cookie-preference-v3","1"],["cookies_accepted","yes"],["cookies_accepted","false"],["CM_BANNER","false"],["set-cookie","cookieAccess","1"],["hife_eu_cookie_consent","1"],["cookie-consent","accepted"],["permission_marketing_cookies","0"],["permission_statistic_cookies","0"],["permission_funktional_cookies","1"],["cookieconsent","1"],["cookieconsent","true"],["cookieconsent","deny"],["epole_cookies_settings","true"],["dopt_consent","false"],["privacy-statement-accepted","true","","reload","1"],["cookie_locales","true"],["ooe_cookie_policy_accepted","no"],["accept_cookie","1"],["cookieconsent_status_new","1"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-accepted","false"],["isReadCookiePolicyDNTAa","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["cookie_accepted","false","","reload","1"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["allow_cookie","false"],["3LM-Cookie","false"],["i_sc_a","false"],["i_cm_a","false"],["i_c_a","true"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["cookieconsent_statistics","no"],["cookieconsent_essential","yes"],["cookie_preference","1"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie-preferences-technical","yes"],["tracking_cookie","1"],["cookie_consent_group_technical","1"],["cookie-preference_renew10","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["cookie_accepted","true"],["hasSeenCookieDisclosure","true"],["RY_COOKIE_CONSENT","true"],["COOKIE_CONSENT","1","","reload","1"],["COOKIE_STATIC","false"],["COOKIE_MARKETING","false"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookie_consent","1"],["ff_cookie_notice","1"],["allris-cookie-msg","1"],["gdpr__google__analytics","false"],["gdpr__facebook__social","false"],["gdpr__depop__functional","true"],["cookie_consent","1","","reload","1"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["cookie-consent","true"],["cookie-consent","denied"],["COOKIECONSENT","false"],["tibber_cc_essential","approved","","reload","1"],["abz_seo_choosen","1"],["privacyAccepted","true"],["cok","1","","reload","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["CookieConsentV2","YES"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["cookie_consent_user_accepted","false"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Marketing","0"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Analytics","0"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","0"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree_0124","1"],["cookiesPolicy20211101","1"],["sc-cookies-accepted","true"],["marketing_cookie_akkoord","0"],["site_cookie_akkoord","1"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["analytics_cookies","0"],["cookies_accepted","1","","reload","1"],["tracking_cookies","0"],["advertisement-age-show-alcohol","false"],["advertisement-age-show-gamble","false"],["ibe.acceptedCookie","true"],["acceptedPolicy","true"],["cookieConsentClosed","true"],["cookiesPrivacy","false"],["_tvsPrivacy","true"],["epCookieConsent","0","","reload","1"],["royaloakTermsCookie","1"],["is_allowed_client_traking_niezbedne","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["kevin-user-has-accepted-ad-cookies","false"],["kevin-user-has-accepted-analytics-cookies","false"],["kevin-user-has-interacted-with-cookies","true"],["cpaccpted","true"],["AllowCookies","true"],["cookiesAccepted","3"],["optOutsTouched","true"],["optOutAccepted","true"],["gdpr_dismissal","true"],["analyticsCookieAccepted","0"],["cookieAccepted","0"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["use_cookie","1"],["figshareCookiesAccepted","true"],["bitso_cc","1"],["eg_asked","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookie_analytcs","false","","reload","1"],["dhl-webapp-track","allowed"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["ofdb_werbung","Y","","reload","1"],["user_cookie_consent","1"],["STAgreement","1"],["tc:dismissexitintentpopup","true"],["functionalCookies","true"],["contentPersonalisationCookies","false"],["statisticalCookies","false"],["consents","essential"],["viewed_cookie_policy","yes","","reload","1"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["cookielawinfo-checkbox-non-necessary","no"],["cookielawinfo-checkbox-advertisement","no"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-analytics","no"],["cookielawinfo-checkbox-performance","no"],["cookielawinfo-checkbox-markkinointi","no"],["cookielawinfo-checkbox-tilastointi","no"],["cookie_preferences","10"],["cookie_consent_status","allow"],["cookie_accept","1"],["hide_cookieoverlay_v2","1","","reload","1"],["socialmedia-cookies_allowed_v2","0"],["performance-cookies_allowed_v2","0"],["mrm_gdpr","1"],["necessary_consent","accepted"],["ckies_google_analytics","deny","","reload","1"],["ckies_stripe","allow"],["ckies_facebook_post","deny"],["ckies_itunes","deny"],["ckies_google_ads_ct","deny"],["ckies_tiktok_post","deny"],["ckies_youtube_video","allow"],["jour_cookies","1"],["jour_functional","true"],["jour_analytics","false"],["jour_marketing","false"],["gdpr_opt_in","1"],["ad_storage","denied"],["stickyCookiesSet","true"],["analytics_storage","denied"],["user_experience_cookie_consent","false"],["marketing_cookie_consent","false"],["cookie_notice_dismissed","yes"],["cookie_analytics_allow","no"],["mer_cc_dim_rem_allow","no"],["num_times_cookie_consent_banner_shown","1"],["cookie_consent_banner_shown_last_time","1"],["privacy_hint","1"],["cookiesConsent","1"],["cookiesStatistics","0"],["cookiesPreferences","0"],["gpc_v","1"],["gpc_ad","0"],["gpc_analytic","0"],["gpc_audience","0"],["gpc_func","0"],["OptanonAlertBoxClosed","1"],["vkicookieconsent","0"],["cookie_policy_agreement","3"],["CA_DT_V2","0","","reload","1"],["CA_DT_V3","0"],["internalCookies","false"],["essentialsCookies","true"],["TESCOBANK_ENSIGHTEN_PRIVACY_Advertising","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Experience","0"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_LOADED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_MODAL_VIEWED","1"],["TESCOBANK_ENSIGHTEN_PRIVACY_Measurement","0"],["viewed_cookie_policy","yes"],["cookielawinfo-checkbox-toiminnalliset-evasteet","yes"],["am-sub","1"],["allow-marketing","false"],["allow-analytics","false"],["cc_analytics","0"],["cc_essential","1"],["__consent","%5B%22required%22%5D"],["veriff_cookie_consent_completed","true"],["TVPtcs22ver","66"],["cookieBasicConsent","accepted"],["cookieVer","1","","reload","1"],["external-data-googlemaps-is-enabled","true"],["external-data-youtube-is-enabled","true"],["external-data-spotify-is-enabled","true"],["notion_check_cookie_consent","true"],["vl-cookie-consent-cookie-consent","true"],["vl-cookie-consent-functional","true"],["amcookie_allowed","0"],["euconsent-v2-addtl","0"],["dummy","1","","reload","1"],["acepta_cookie","acepta"],["3sat_cmp_configuration","true"],["privacyConsent_version","1","","reload","1"],["privacyConsent","false"],["DDCookiePolicy-consent-functional","false"],["DDCookiePolicy-consent-tracking","false"],["DDCookiePolicy-consent-statistics","false"],["CookieNotificationSeen","1","","reload","1"],["cookie-management-preferences-set","true"],["cookie-management-version","1"],["show-cookie-banner","1"],["mml-cookie-agreed","2"]];

const hostnamesMap = new Map([["toppy.be",0],["uhrzeit123.de",[1,2]],["billetterie.auditorium-lyon.com",3],["shopify.dev",4],["funnycase.pl",5],["vmake.ai",6],["gmr-foto.at",7],["wikiwand.com",8],["athleticsreg.ca",9],["marinelink.com",10],["againstdata.com",11],["inspections.vcha.ca",12],["floodlit.org",13],["spuntinoheathrow.com",[14,15]],["pzw.org.pl",16],["livedoor.biz",17],["camra.org.uk",[18,965]],["parkguellonline.cat",19],["stroga-festival.de",20],["queensfishandchipsgloucester.co.uk",21],["ieq-systems.de",22],["arning-bau.de",22],["startrescue.co.uk",23],["eneba.com",24],["eltiempo.com",25],["galaxykayaks.ro",26],["mywot.com",27],["intramuros.org",[28,29]],["nucom.odoo.dev",30],["cyberfolks.pl",31],["cyberfolks.ro",31],["okko.tv",32],["immersivelabs.online",33],["serasa.com.br",34],["falabella.com.pe",35],["falabella.com",35],["falabella.com.co",35],["przegladpiaseczynski.pl",36],["cloud.aeolservice.es",37],["nuevoloquo.ch",38],["fogaonet.com",39],["zbiornik.com",40],["bitbucket.io",41],["ton.org",42],["sutterhealth.org",43],["antpool.com",44],["thegraph.com",48],["followalice.com",[48,855]],["headout.com",49],["london-tickets.co.uk",49],["kosmas.cz",50],["blog.documentfoundation.org",51],["my.eneba.com",52],["blitzortung.org",53],["esim.redteago.com",54],["tester.userbrain.com",55],["empathy.com",55],["labs.epi2me.io",55],["fydeos.io",56],["autos.suzuki.com.mx",57],["stonly.com",58],["camp-fire.jp",59],["my2n.com",60],["vandalism-sounds.com",61],["oocl.com",62],["brazzersnetwork.com",63],["safaricom.co.ke",64],["smile.io",65],["hiermitherz.de",66],["uk2.net",67],["aeromexico.com",[68,69]],["easywintergarten.de",70],["vinothekwaespi.ch",[71,72,73]],["graphy.com",74],["raspberrypi.dk",75],["ocean.io",76],["waves.is",77],["tesa.com",78],["repair.wd40.com",79],["gls-group.eu",82],["chipsaway.co.uk",83],["heatstore.eu",84],["luvly.care",84],["firmen.wko.at",84],["copaamerica.com",85],["apunyalometre.cat",85],["cooleygo.com",86],["map.blitzortung.org",87],["northumbriasport.com",88],["clearspend.natwest.com",89],["cellcolabsclinical.com",90],["producthunt.com",91],["motorsportreg.com",[92,93]],["imola.motorsportreg.com",[94,95]],["pga.com",96],["portal.payment.eltax.lta.go.jp",97],["greenbuildingadvisor.com",[98,99,100]],["finewoodworking.com",[98,99,100]],["privatekeys.pw",101],["telli.dpd.ee",102],["youthforum.org",102],["votegroup.de",[103,104]],["pharmahall.gr",105],["x-team.com",106],["reservations.helveticmotion.ch",107],["endclothing.com",[108,109]],["kraftwerk.co.at",110],["fhr.biz",111],["srf.nu",112],["jn.fo",[113,114]],["rovia.es",115],["platforma.eb2b.com.pl",115],["schwanger-in-bayern.de",116],["stmas.bayern.de",[116,745]],["bayern-gegen-gewalt.de",116],["verfwebwinkel.be",117],["wayfair.co.uk",118],["wayfair.de",118],["wayfair.ie",118],["physiotherapie-naurod.de",119],["airnewzealand.co.nz",120],["viu.com",121],["dinamalar.com",122],["volkswagen-group.com",123],["solo.io",124],["pomelo.la",125],["ibuypower.com",126],["sberbank.com",[127,530]],["swissmilk.ch",128],["gamemaker.io",129],["pixiv.net",130],["kinemaster.com",131],["sp32bb.pl",132],["jazz.fm",133],["juntadeandalucia.es",134],["melee.gg",[135,136,137]],["chemocare.com",138],["mobiliteit.nl",139],["virginatlantic.com",[140,141,142,143,144]],["xledger.net",145],["legalteam.hu",146],["mediately.co",147],["reviewmeta.com",148],["guide-bordeaux-gironde.com",149],["travelinsured.com",150],["gdpr.twitter.com",151],["mora.hu",152],["confused.com",153],["physikinstrumente.de",154],["karlknauer.de",154],["schoeck.com",154],["resonate.coop",154],["northgatevehiclehire.ie",154],["badhall.at",154],["cic.ch",154],["tryhackme.com",155],["ilsaggiatore.com",156],["forum.digitalfernsehen.de",157],["bitscrunch.com",[158,159,160]],["hannahgraaf.com",161],["shop.elbers-hof.de",[162,163]],["woolsocks.eu",164],["uza.be",165],["5asec.ch",165],["wizards.com",165],["kitepackaging.co.uk",[166,167]],["parkenflughafen.de",168],["radyofenomen.com",169],["elsate.com",170],["hume.ai",171],["lotusantwerp.wacs.online",172],["docs.yagpdb.xyz",173],["gitbook.io",173],["gitbook.com",173],["thehacker.recipes",173],["docs.dyrector.io",173],["docs.webstudio.is",173],["docs.chartbeat.com",173],["docs.civic.com",173],["weatherbug.com",174],["saleor.io",175],["publibike.ch",[176,177]],["onlinelekarna.cz",[178,179,180]],["eleven-sportswear.cz",[179,180,877]],["silvini.com",[179,180,877]],["silvini.de",[179,180,877]],["purefiji.cz",[179,180,877]],["voda-zdarma.cz",[179,180,877]],["lesgarconsfaciles.com",[179,180,877]],["ulevapronohy.cz",[179,180,877]],["vitalvibe.eu",[179,180,877]],["plavte.cz",[179,180,877]],["mo-tools.cz",[179,180,877]],["flamantonlineshop.cz",[179,180,877]],["sandratex.cz",[179,180,877]],["norwayshop.cz",[179,180,877]],["3d-foto.cz",[179,180,877]],["neviditelnepradlo.cz",[179,180,877]],["nutrimedium.com",[179,180,877]],["silvini.cz",[179,180,877]],["karel.cz",[179,180,877]],["silvini.sk",[179,180,877]],["shop.humle.se",181],["59northwheels.se",181],["makeresearchpay.com",182],["tandartsenpraktijk-simons.tandartsennet.nl",183],["huisartsenpraktijkdoorn.nl",183],["bcorporation.net",184],["knime.com",[184,229]],["quebueno.es",184],["edookit.com",185],["trixonline.be",186],["radio-canada.ca",187],["heysummit.com",188],["puromarketing.com",189],["radicalmotorsport.com",190],["biurobox.pl",191],["cycling74.com",192],["triviacreator.com",193],["reforge.com",193],["freshis.com",193],["anker.com",193],["computacenter.com",194],["playbalatro.com",195],["kastner-oehler.de",196],["kastner-oehler.at",196],["kastner-oehler.ch",196],["twenga.it",197],["twenga.fr",197],["twenga.co.uk",197],["twenga.de",197],["twenga.es",197],["twenga.pl",197],["twenga.nl",197],["twenga.se",197],["olx.kz",198],["olx.uz",198],["efl.com",199],["wst.tv",199],["cuvva.com",200],["vitbikes.de",201],["gourmetfoodstore.com",202],["schulfahrt.de",203],["deutsche-finanzagentur.de",204],["thejazzcafelondon.com",205],["keeb.supply",206],["spb.hh.ru",207],["kaluga.hh.ru",207],["school.hh.ru",207],["rating.hh.ru",207],["novgorod.hh.ru",207],["xxxshemaleporn.com",[208,209]],["gayhits.com",[208,209]],["gaypornvideos.xxx",[208,209]],["sextubespot.com",[208,209]],["wewantjusticedao.org",210],["godbolt.org",211],["projectenglish.com.pl",[212,218]],["ledenicheur.fr",212],["pricespy.co.uk",212],["pricespy.co.nz",212],["sae.fsc.ccoo.es",213],["piusx-college.nl",214],["forgeofempires.com",215],["yoomoney.ru",216],["vod.warszawa.pl",217],["bio-hoflieferant.de",219],["m.twitch.tv",220],["environment.data.gov.uk",221],["playtesting.games",222],["portal.by.aok.de",223],["umlandscout.de",224],["atombank.co.uk",[225,226,227]],["showtv.com.tr",228],["seventhgeneration.com",229],["press.princeton.edu",229],["ldz.lv",229],["crtm.es",230],["airastana.com",231],["vkf-renzel.nl",232],["booking.reederei-zingst.de",[233,234,235]],["booking.weisse-flotte.de",[233,234,235]],["booking2.reederei-hiddensee.de",[233,234,235]],["sanswiss.pl",236],["galaxy.com",237],["petdesk.com",238],["ivyexec.com",239],["railtech.com",240],["lottehotel.com",[241,242,243,244,245]],["paydirekt.de",246],["kijiji.ca",247],["posterstore.fr",248],["posterstore.eu",248],["posterstore.be",248],["posterstore.de",248],["posterstore.hu",248],["posterstore.ie",248],["posterstore.it",248],["posterstore.no",248],["posterstore.nl",248],["posterstore.pl",248],["posterstore.com",248],["posterstore.ae",248],["posterstore.ca",248],["posterstore.nz",248],["posterstore.es",248],["posterstore.kr",248],["posterstore.jp",248],["posterstore.dk",248],["posterstore.se",248],["posterstore.ch",248],["posterstore.at",248],["myriadicity.net",249],["dgsf.org",249],["endgame.id",250],["cashback-cards.ch",251],["swisscard.ch",251],["ahorn24.de",252],["blockdyor.com",253],["ticket.io",254],["omega-nuernberg.servicebund.com",255],["lojaboschferramentas.com.br",[256,258,259]],["shareloft.com",257],["fineartsmuseum.recreatex.be",[260,261,262]],["jaapeden.nl",[260,261,262]],["eboo.lu",263],["lasmallagency.com",264],["lhsystems.com",[265,266,267,268]],["twomates.de",269],["intergiro.com",270],["healthygamer.gg",271],["telepizza.es",[272,273,274]],["telepizza.pt",[272,273,274]],["frisco.pl",275],["tyleenslang.nl",276],["schrikdraad.net",276],["kruiwagen.net",276],["pvcvoordeel.nl",276],["pvcbuis.com",276],["drainagebuizen.nl",276],["likewise.com",277],["longines.com",[278,279,280,281]],["vater-it.de",282],["biano.hu",283],["nadia.gov.gr",284],["hana-book.fr",285],["kzvb.de",286],["correosexpress.com",287],["cexpr.es",287],["rte.ie",288],["smart.com",289],["gry.pl",289],["gamesgames.com",289],["games.co.uk",289],["jetztspielen.de",289],["ourgames.ru",289],["permainan.co.id",289],["gioco.it",289],["jeux.fr",289],["juegos.com",289],["ojogos.com.br",289],["oyunskor.com",289],["spela.se",289],["spelletjes.nl",289],["agame.com",289],["spielen.com",289],["flashgames.ru",289],["games.co.id",289],["giochi.it",289],["jeu.fr",289],["spel.nl",289],["tridge.com",290],["asus.com",[291,292]],["drinksking.sk",293],["neuhauschocolates.com",294],["commandsuite.it",295],["designmynight.com",295],["oktea.tw",296],["1028loveu.com.tw",296],["airbubu.com",296],["amai.tw",296],["anns.tw",296],["as-eweb.com",296],["asf.com.tw",296],["asics.com.hk",296],["asics.com.tw",296],["ausupreme.com",296],["basiik.com",296],["bearboss.com",296],["beast-kingdom.com.tw",296],["beldora.com.tw",296],["benefitcosmetics.com.tw",296],["bns.com.tw",296],["byhue-official.com",296],["candybox.com.tw",296],["columbiasportswear.com.tw",296],["concerto.com.tw",296],["countess.tw",296],["cuapp.com",296],["daima.asia",296],["dettol-store.com.tw",296],["dickies.com.tw",296],["doga.com.tw",296],["dot-st.tw",296],["dr-douxi.tw",296],["durex-store.com.tw",296],["echome.com.hk",296],["eding.com.tw",296],["e-hilltop.com",296],["faduobra.com",296],["fairlady.com.tw",296],["fbshop.com.tw",296],["freshdays-shop.com",296],["hh-taiwan.com.tw",296],["iqueen.com.tw",296],["jjfish.com.tw",296],["jpmed.com.tw",296],["jsstore.com.tw",296],["kipling.com.tw",296],["kuaiche.com.tw",296],["lanew.com.tw",296],["leejeans.com.tw",296],["levis.com.tw",296],["ludeya.com",296],["lulus.tw",296],["makeupforever.com.tw",296],["mart.family.com.tw",296],["meinlcoffee.com.tw",296],["metroasis.com.tw",296],["minervababy.com.tw",296],["miss21.estore.asgroup.com.tw",296],["miu-star.com.tw",296],["mkup.tw",296],["mlb-korea.com.hk",296],["mollifix.com",296],["naruko.com.tw",296],["newweb.renoirpuzzle.com.tw",296],["nikokids.com.tw",296],["nisoro.com",296],["odout.com",296],["ouiorganic.com",296],["pandababy.com.tw",296],["peachy.com.tw",296],["poyabuy.com.tw",296],["premierfood.com.hk",296],["rachelwine.com.tw",296],["risal.com.tw",296],["sasa.com.hk",296],["schiff-store.com.tw",296],["sexylook.com.tw",296],["sfn.com.tw",296],["shingfangpastry.com",296],["shop.3m.com.tw",296],["shop.5soap.com",296],["shop.atunas.com.tw",296],["shop.bosscat.com.tw",296],["shop.conas.com.tw",296],["shop.cosmed.com.tw",296],["shop.coville.com.tw",296],["shop.euyansang.com.hk",296],["shop.kbc.com.tw",296],["shop.kemei.com.tw",296],["shop.kky.com.tw",296],["shop.norns.com.tw",296],["shop.okogreen.com.tw",296],["shop.skechers-twn.com",296],["shop.s3.com.tw",296],["shop.teascovery.com",296],["shop.wacoal.com.tw",296],["shop.wumajia.com.tw",296],["shopping.dradvice.asia",296],["shop0315.com.tw",296],["sky-blue.com.tw",296],["snowpeak.com.tw",296],["songbeam.com.tw",296],["so-nice.com.tw",296],["store-philips.tw",296],["tcsb.com.tw",296],["thenorthface.com.tw",296],["timberland.com.tw",296],["tokuyo.com.tw",296],["triumphshop.com.tw",296],["trygogo.com",296],["tupiens-foodie.com",296],["tw.istayreal.com",296],["tw.puma.com",296],["vans.com.tw",296],["vemar.com.tw",296],["vigill.com.tw",296],["vilson.com",296],["vincentsworld.com.tw",296],["wealthshop888.com",296],["yamazaki.com.tw",296],["bafin.de",297],["materna.de",297],["bamf.de",297],["tenvinilo-argentina.com",[298,299]],["eikaforsikring.no",[300,301]],["eurowings.com",[302,303,304]],["newpharma.be",[305,306,307]],["newpharma.fr",[305,306,307]],["newpharma.de",[305,306,307]],["newpharma.at",[305,306,307]],["newpharma.nl",[305,306,307]],["kapoorwatch.com",308],["instantoffices.com",309],["paf.se",309],["citibank.pl",309],["citibankonline.pl",309],["azertyfactor.be",310],["zelezodum.cz",311],["thw.de",312],["bafa.de",312],["bka.de",312],["bmbf.de",312],["weather.com",313],["bolist.se",[314,315]],["project529.com",315],["evivanlanschot.nl",316],["alohabrowser.com",317],["prenatal.nl",318],["onnibus.com",[318,961,962,963]],["kyoceradocumentsolutions.us",[318,1019,1020]],["kyoceradocumentsolutions.ch",[318,1019,1020]],["kyoceradocumentsolutions.co.uk",[318,1019,1020]],["kyoceradocumentsolutions.de",[318,1019,1020]],["kyoceradocumentsolutions.es",[318,1019,1020]],["kyoceradocumentsolutions.eu",[318,1019,1020]],["kyoceradocumentsolutions.fr",[318,1019,1020]],["kyoceradocumentsolutions.it",[318,1019,1020]],["kyoceradocumentsolutions.ru",[318,1019,1020]],["kyoceradocumentsolutions.mx",[318,1019,1020]],["kyoceradocumentsolutions.cl",[318,1019,1020]],["kyoceradocumentsolutions.com.br",[318,1019,1020]],["wagner-tuning.com",[319,320,321,322]],["waitrosecellar.com",[323,324,325,326]],["waitrose.com",[323,678]],["kvk.nl",[327,328,329]],["macfarlanes.com",330],["pole-emploi.fr",331],["gardenmediaguild.co.uk",332],["samplerite.com",333],["samplerite.cn",333],["sororedit.com",334],["blukit.com.br",335],["biegnaszczyt.pl",336],["staff-gallery.com",337],["itv.com",338],["dvag.de",339],["premierinn.com",[340,341,342,343]],["whitbreadinns.co.uk",[340,341,342,343]],["barandblock.co.uk",[340,341,342,343]],["tabletable.co.uk",[340,341,342,343]],["brewersfayre.co.uk",[340,341,342,343]],["beefeater.co.uk",[340,341,342,343]],["allstarssportsbars.co.uk",[344,345]],["babiesrus.ca",346],["toysrus.ca",346],["roomsandspaces.ca",346],["athletic-club.eus",[347,348,349]],["wattoo.dk",350],["wattoo.no",350],["texthelp.com",[351,352]],["courierexchange.co.uk",[353,354,355]],["haulageexchange.co.uk",[353,354,355]],["ecaytrade.com",356],["unka.bilecik.edu.tr",356],["powerball.com",357],["tlaciarik.sk",357],["tiskarik.cz",357],["sseriga.edu",[358,359]],["rt.com",360],["swrng.de",361],["crfop.gdos.gov.pl",362],["nurgutes.de",363],["kpcen-torun.edu.pl",364],["opintopolku.fi",365],["app.erevie.pl",366],["debenhams.com",367],["archiwumalle.pl",368],["konicaminolta.ca",369],["konicaminolta.us",369],["deutschebank-dbdirect.com",[370,371,372]],["dbonline.deutsche-bank.es",[370,371,372]],["deutsche-bank.es",[370,371,372]],["hipotecaonline.db.com",373],["kangasalansanomat.fi",374],["eif.org",375],["tunnelmb.net",375],["sugi-net.jp",376],["understandingsociety.ac.uk",377],["leibniz.com",378],["horecaworld.biz",[378,647]],["horecaworld.be",[378,647]],["bettertires.com",378],["electroprecio.com",378],["autohero.com",378],["computerbase.de",[378,1014]],["sistemacomponentes.com.br",379],["bargaintown.ie",380],["tui.nl",381],["doppelmayr.com",382],["case-score.com",[383,384]],["cote.co.uk",385],["finimize.com",385],["unsplash.com",385],["k-einbruch.de",[386,387]],["blxxded.com",386],["rtu.lv",388],["sysdream.com",389],["cinemarkca.com",390],["neander-zahn.de",391],["thespaniardshampstead.co.uk",392],["carsupermarket.com",392],["theadelphileeds.co.uk",392],["tobycarvery.co.uk",392],["harvester.co.uk",392],["stonehouserestaurants.co.uk",392],["millerandcarter.co.uk",392],["browns-restaurants.co.uk",392],["thechampionpub.co.uk",392],["therocketeustonroad.co.uk",392],["thesheepheidedinburgh.co.uk",392],["thejerichooxford.co.uk",392],["hartsboatyard.co.uk",392],["thesalisburyarmsedinburgh.co.uk",392],["thelambchiswick.co.uk",392],["barntgreeninn.co.uk",392],["the-albany.co.uk",392],["sonofsteak.co.uk",392],["thewashingtonhampstead.co.uk",392],["princessofwalespub.co.uk",392],["harrycookcheltenham.co.uk",392],["thegreenmantrumpington.com",392],["queenandcastlekenilworth.co.uk",392],["whitehorseradlett.co.uk",392],["woolpackstokemandeville.co.uk",392],["thewhitehartpirbright.co.uk",392],["castleportobello.co.uk",392],["theswanbroadway.co.uk",392],["thederbyarmsepsom.co.uk",392],["thedewdropinnoxford.co.uk",392],["thejunctionharborne.co.uk",392],["therailwayblackheath.co.uk",392],["whitehartbrasted.co.uk",392],["thewarrenwokingham.co.uk",392],["thedukesheadcrawley.co.uk",392],["thewhitehartse19.co.uk",392],["thesunclapham.co.uk",392],["thevolunteernw1.co.uk",392],["theramsheaddisley.co.uk",392],["thepalaceleeds.co.uk",392],["edinborocastlepub.co.uk",392],["arnosarms.co.uk",392],["dehemspub.co.uk",392],["dukeofdevonshireeastbourne.co.uk",392],["flanagansappleliverpool.co.uk",392],["fontbrighton.co.uk",392],["hawkinsforge.co.uk",392],["hopeandbearreading.co.uk",392],["ploughandharrowaldridge.co.uk",392],["radicalsandvictuallers.co.uk",392],["redlionhandcross.co.uk",392],["stgeorgeanddragon.co.uk",392],["theanchorinnirby.co.uk",392],["thearkley.co.uk",392],["theappletreegerrardscross.co.uk",392],["theashtonbristol.co.uk",392],["thebankplymouth.co.uk",392],["thebathamptonmill.co.uk",392],["theblackbullyarm.co.uk",392],["thebotanistbristol.co.uk",392],["thebootmappleboroughgreen.co.uk",392],["thebullislington.co.uk",392],["thecavershamrosereading.co.uk",392],["thecliffcanfordcliffs.co.uk",392],["thecockinncockfosters.co.uk",392],["theencorestratford.co.uk",392],["theferry.co.uk",392],["viajesatodotren.com",393],["firsttable.co.uk",394],["ticketingcine.fr",395],["agenziavista.it",396],["e-chladiva.cz",396],["bitecode.dev",397],["mjob.si",[398,399,400]],["airportrentacar.gr",401],["mobile-fueling.de",401],["plos.org",402],["autohaus24.de",403],["sixt-neuwagen.de",403],["gadis.es",[404,405]],["dom.ru",405],["ford-kimmerle-reutlingen.de",406],["autohaus-reitermayer.de",406],["autohaus-diefenbach-waldbrunn.de",406],["autohaus-diefenbach.de",406],["autohaus-musberg.de",406],["ford-ah-im-hunsrueck-simmern.de",406],["ford-arndt-goerlitz.de",406],["ford-autogalerie-alfeld.de",406],["ford-bacher-schrobenhausen.de",406],["ford-bathauer-bad-harzburg.de",406],["ford-behrend-waren.de",406],["ford-bergland-frankfurt-oder.de",406],["ford-bergland-wipperfuerth.de",406],["ford-besico-glauchau.de",406],["ford-besico-nuernberg.de",406],["ford-bischoff-neumuenster.de",406],["ford-bodach-borgentreich.de",406],["ford-bunk-saarbruecken.de",406],["ford-bunk-voelklingen.de",406],["ford-busch-kirchberg.de",406],["ford-diermeier-muenchen.de",406],["ford-dinnebier-leipzig.de",406],["ford-duennes-regensburg.de",406],["ford-fischer-bochum.de",406],["ford-fischer-muenster.de",406],["ford-foerster-koblenz.de",406],["ford-fuchs-uffenheim.de",406],["ford-geberzahn-koeln.de",406],["ford-gerstmann-duesseldorf.de",406],["ford-haefner-und-strunk-kassel.de",406],["ford-hartmann-kempten.de",406],["ford-hartmann-rastatt.de",406],["ford-hatzner-karlsruhe.de",406],["ford-heine-hoexter.de",406],["ford-hentschel-hildesheim.de",406],["ford-hessengarage-dreieich.de",406],["ford-hessengarage-frankfurt.de",406],["ford-hga-windeck.de",406],["ford-hommert-coburg.de",406],["ford-horstmann-rastede.de",406],["ford-janssen-sonsbeck.de",406],["ford-jochem-stingbert.de",406],["ford-jungmann-wuppertal.de",406],["ford-kestel-marktzeuln.de",406],["ford-klaiber-bad-friedrichshall.de",406],["ford-koenig-eschwege.de",406],["ford-kohlhoff-mannheim.de",406],["ford-kt-automobile-coesfeld.de",406],["ford-lackermann-wesel.de",406],["ford-ludewig-delligsen.de",406],["ford-maiwald-linsengericht.de",406],["ford-mertens-beckum.de",406],["ford-meyer-bad-oeynhausen.de",406],["ford-mgs-bayreuth.de",406],["ford-mgs-radebeul.de",406],["ford-muecke-berlin.de",406],["ford-norren-weissenthurm.de",406],["ford-nrw-garage-duesseldorf.de",406],["ford-nrw-garage-handweiser.de",406],["ford-nuding-remshalden.de",406],["ford-ohm-rendsburg.de",406],["ford-reinicke-muecheln.de",406],["ford-rennig.de",406],["ford-roerentrop-luenen.de",406],["ford-schankola-dudweiler.de",406],["ford-sg-goeppingen.de",406],["ford-sg-leonberg.de",406],["ford-sg-neu-ulm.de",406],["ford-sg-pforzheim.de",406],["ford-sg-waiblingen.de",406],["ford-storz-st-georgen.de",406],["ford-strunk-koeln.de",406],["ford-tobaben-hamburg.de",406],["ford-toenjes-zetel.de",406],["ford-wagner-mayen.de",406],["ford-wahl-fritzlar.de",406],["ford-wahl-siegen.de",406],["ford-weege-bad-salzuflen.de",406],["ford-westhoff-hamm.de",406],["ford-wieland-hasbergen.de",406],["renault-autocenterprignitz-pritzwalk.de",406],["renault-spenrath-juelich.de",406],["vitalllit.com",407],["fincaparera.com",407],["dbnetbcn.com",407],["viba.barcelona",407],["anafaustinoatelier.com",407],["lamparasherrero.com",407],["calteixidor.cat",407],["argentos.barcelona",407],["anmarlube.com",407],["anynouxines.barcelona",407],["crearunapaginaweb.cat",407],["cualesmiip.com",407],["porndoe.com",[408,409,410]],["thinkingaustralia.com",411],["elrow.com",412],["ownit.se",413],["velo-antwerpen.be",[414,415]],["wwnorton.com",416],["pc-canada.com",417],["mullgs.se",418],["1a-sehen.de",419],["feature.fm",420],["comte.com",421],["baltic-watches.com",422],["np-brijuni.hr",422],["vilgain.com",422],["tradingview.com",423],["wevolver.com",424],["experienciasfree.com",425],["freemans.com",426],["kivikangas.fi",427],["lumingerie.com",427],["melkkobrew.fi",427],["kh.hu",[428,429,430]],["aplgo.com",431],["securityconference.org",432],["aha.or.at",[433,436]],["fantasyfitnessing.com",434],["chocolateemporium.com",435],["account.samsung.com",437],["crushwineco.com",438],["levi.pt",439],["fertagus.pt",440],["snowboardel.es",441],["bagosport.cz",441],["akumo.cz",441],["snowboardel.cz",441],["pompo.cz",441],["oveckarna.cz",441],["rockpoint.cz",441],["rockpoint.sk",441],["parfum-zentrum.de",441],["candy-store.cz",441],["vivobarefoot.cz",441],["sartor-stoffe.de",441],["smiggle.co.uk",442],["ubisoft.com",[443,444,445,446]],["store.ubisoft.com",[443,446,885,886]],["splityourticket.co.uk",447],["invisible.co",448],["eramba.org",448],["openai.com",[449,450]],["kupbilecik.com",[451,452]],["kupbilecik.de",[451,452]],["kupbilecik.pl",[451,452]],["shopilya.com",453],["arera.it",454],["haustier-berater.de",454],["hfm-frankfurt.de",454],["zoommer.ge",455],["studentapan.se",456],["petcity.lt",[457,458,459,460]],["tobroco.com",[461,465]],["tobroco.nl",[461,465]],["tobroco-giant.com",[461,465]],["geosfreiberg.de",[462,463]],["eapvic.org",464],["bassolsenergia.com",464],["bammusic.com",[466,468,469]],["green-24.de",467],["phish-test.de",470],["bokadirekt.se",471],["ford.lt",472],["ford.pt",472],["ford.fr",472],["ford.de",472],["ford.dk",472],["ford.pl",472],["ford.se",472],["ford.nl",472],["ford.no",472],["ford.fi",472],["ford.gr",472],["ford.it",472],["data-media.gr",473],["e-food.gr",[474,475]],["bvmed.de",476],["babyshop.com",[477,478,479]],["griffbereit24.de",480],["checkwx.com",481],["calendardate.com",482],["wefashion.ch",483],["wefashion.fr",483],["wefashion.lu",483],["wefashion.be",483],["wefashion.de",483],["wefashion.nl",483],["brettspiel-angebote.de",[484,485]],["nio.com",486],["kancelarskepotreby.net",[487,488,489]],["segment-anything.com",490],["sketch.metademolab.com",491],["cambridgebs.co.uk",492],["freizeitbad-greifswald.de",493],["giuseppezanotti.com",[494,495,496]],["xcen.se",496],["biggreenegg.co.uk",497],["skihuette-oberbeuren.de",[498,499,500]],["pwsweather.com",501],["xfree.com",502],["theweathernetwork.com",[503,504]],["monese.com",[505,506,507]],["assos.com",505],["helmut-fischer.com",508],["myscience.org",509],["7-eleven.com",510],["airwallex.com",511],["streema.com",512],["gov.lv",513],["tise.com",514],["codecamps.com",515],["avell.com.br",516],["moneyfarm.com",517],["app.moneyfarm.com",517],["simpl.rent",518],["hubspot.com",519],["prodyna.com",[520,521,522,523]],["zutobi.com",[520,521,522,523]],["calm.com",[524,525]],["pubgesports.com",[526,527,528]],["outwrite.com",529],["sbermarket.ru",531],["atani.com",[532,533,534]],["croisieresendirect.com",535],["bgextras.co.uk",536],["sede.coruna.gal",537],["czech-server.cz",538],["hitech-gamer.com",539],["bialettikave.hu",[540,541,542]],["canalplus.com",[543,544,545]],["mader.bz.it",[546,547,548]],["supply.amazon.co.uk",549],["bhaptics.com",550],["cleverbot.com",551],["watchaut.film",552],["tuffaloy.com",553],["fanvue.com",553],["electronoobs.com",554],["xn--lkylen-vxa.se",555],["tiefenthaler-landtechnik.at",556],["tiefenthaler-landtechnik.ch",556],["tiefenthaler-landtechnik.de",556],["varma.fi",557],["vyos.io",558],["digimobil.es",[559,560]],["teenage.engineering",561],["merrell.pl",[562,825]],["converse.pl",562],["shop.wf-education.com",[562,825]],["werkenbijaswatson.nl",563],["converse.com",[564,565]],["buyandapply.nexus.org.uk",566],["img.ly",567],["halonen.fi",[567,599,600,601,602]],["carlson.fi",[567,599,600,601,602]],["cams.ashemaletube.com",[568,569]],["electronicacerler.com",[570,571,572]],["okpoznan.pl",[573,578]],["ielts.idp.com",574],["ielts.co.nz",574],["ielts.com.au",574],["einfach-einreichen.de",[575,576,577]],["endlesstools.io",579],["mbhszepkartya.hu",580],["casellimoveis.com.br",581],["embedplus.com",582],["e-file.pl",583],["sp215.info",584],["empik.com",585],["senda.pl",586],["united-camera.at",587],["befestigungsfuchs.de",587],["cut-tec.co.uk",588],["gaytimes.co.uk",589],["statisticsanddata.org",590],["hello.one",591],["paychex.com",592],["wildcat-koeln.de",593],["libraries.merton.gov.uk",[594,595]],["tommy.hr",[596,597]],["usit.uio.no",598],["demo-digital-twin.r-stahl.com",603],["la31devalladolid.com",[604,605]],["mx.com",606],["foxtrail.fjallraven.com",607],["dotwatcher.cc",608],["bazarchic.com",[609,610,611]],["seedrs.com",612],["mypensiontracker.co.uk",613],["praxisplan.at",[613,634]],["esimplus.me",614],["cineplanet.com.pe",615],["ecologi.com",616],["wamba.com",617],["eurac.edu",618],["akasaair.com",619],["rittal.com",620],["worstbassist.com",[621,622,623,624,625,626]],["haus-ladn.de",[621,624,625,626,983,984]],["hutwiller.de",[621,624,625,626,983,984]],["jumpropeberlin.com",[621,623,624,625,626,983,984,987,988,989]],["die-plank.de",[621,623,624,625,626,983,984,985,986]],["haban-uhren.at",[624,626,983,984]],["leoschilbach.de",[624,983]],["zs-watch.com",627],["crown.com",628],["mesanalyses.fr",629],["teket.jp",630],["fish.shimano.com",[631,632,633]],["simsherpa.com",[635,636,637]],["translit.ru",638],["aruba.com",639],["aireuropa.com",640],["skfbearingselect.com",[641,642]],["scanrenovation.com",643],["ttela.se",644],["dominospizza.pl",645],["devagroup.pl",646],["secondsol.com",647],["angelifybeauty.com",648],["cotopaxi.com",649],["justjoin.it",650],["digibest.pt",651],["two-notes.com",652],["theverge.com",653],["daimant.co",654],["secularism.org.uk",655],["karriere-hamburg.de",656],["musicmap.info",657],["gasspisen.se",658],["medtube.pl",659],["medtube.es",659],["medtube.fr",659],["medtube.net",659],["standard.sk",660],["linmot.com",661],["larian.com",[661,951]],["s-court.me",661],["containerandpackaging.com",662],["top-yp.de",663],["termania.net",664],["account.nowpayments.io",665],["lc.paragon-software.com",666],["fizjobaza.pl",666],["leafly.com",667],["gigasport.at",668],["gigasport.de",668],["gigasport.ch",668],["velleahome.gr",669],["nicequest.com",670],["handelsbanken.no",671],["handelsbanken.com",671],["handelsbanken.co.uk",671],["handelsbanken.se",[671,753]],["handelsbanken.dk",671],["handelsbanken.fi",671],["ilarahealth.com",672],["songtradr.com",[673,935]],["logo.pt",[674,675]],["app.zasta.de",676],["softlist.com.ua",676],["flexwhere.co.uk",[676,677]],["flexwhere.de",[676,677]],["pricewise.nl",676],["getunleash.io",676],["dentmania.de",676],["free.navalny.com",676],["latoken.com",676],["campusbrno.cz",[679,680,681]],["secrid.com",682],["etsy.com",683],["careers.cloud.com",683],["blablacar.rs",684],["blablacar.ru",684],["blablacar.com.tr",684],["blablacar.com.ua",684],["blablacar.com.br",684],["seb.se",685],["sebgroup.com",685],["deps.dev",686],["buf.build",687],["starofservice.com",688],["ytcomment.kmcat.uk",689],["gmx.com",690],["gmx.fr",690],["karofilm.ru",691],["octopusenergy.it",692],["octopusenergy.es",[692,693]],["justanswer.es",694],["justanswer.de",694],["justanswer.com",694],["justanswer.co.uk",694],["citilink.ru",695],["huutokaupat.com",696],["kaggle.com",697],["emr.ch",[698,703]],["gem.cbc.ca",699],["pumatools.hu",700],["ici.tou.tv",701],["crunchyroll.com",702],["mayflex.com",704],["clipchamp.com",704],["gdemoideti.ru",704],["trouwenbijfletcher.nl",704],["fletcher.nl",704],["fletcherzakelijk.nl",704],["intermatic.com",704],["jusbrasil.com.br",705],["mobilevikings.be",706],["ebikelohr.de",707],["eurosender.com",708],["melectronics.ch",709],["guard.io",710],["nokportalen.se",711],["dokiliko.com",712],["valamis.com",[713,714,715]],["sverigesingenjorer.se",716],["shop.almawin.de",[717,718,719,756]],["zeitzurtrauer.de",720],["skaling.de",[721,722,723]],["bringmeister.de",724],["gdx.net",725],["clearblue.com",726],["drewag.de",[727,728,729]],["enso.de",[727,728,729]],["buidlbox.io",727],["helitransair.com",730],["more.com",731],["nwslsoccer.com",731],["watch.sonlifetv.com",732],["climatecentral.org",733],["resolution.de",734],["flagma.by",735],["eatsalad.com",736],["pacstall.dev",737],["web2.0calc.fr",738],["de-appletradein.likewize.com",739],["swissborg.com",740],["qwice.com",741],["canalpluskuchnia.pl",[742,743]],["uizard.io",744],["novayagazeta.eu",746],["kinopoisk.ru",747],["yandex.ru",747],["go.netia.pl",[748,749]],["polsatboxgo.pl",[748,749]],["ing.it",[750,751]],["ing.nl",752],["youcom.com.br",754],["rule34.paheal.net",755],["deep-shine.de",756],["shop.ac-zaun-center.de",756],["kellermann-online.com",756],["kletterkogel.de",756],["pnel.de",756],["korodrogerie.de",[756,758]],["der-puten-shop.de",756],["katapult-shop.de",756],["evocsports.com",756],["esm-computer.de",756],["calmwaters.de",756],["mellerud.de",756],["akustik-projekt.at",756],["vansprint.de",756],["0815.at",756],["0815.eu",756],["ojskate.com",756],["der-schweighofer.de",756],["tz-bedarf.de",756],["zeinpharma.de",756],["weicon.com",756],["dagvandewebshop.be",756],["thiele-tee.de",756],["carbox.de",756],["riapsport.de",756],["trendpet.de",756],["eheizung24.de",756],["seemueller.com",756],["vivande.de",756],["heidegrill.com",756],["gladiator-fightwear.com",756],["h-andreas.com",756],["pp-parts.com",756],["natuerlich-holzschuhe.de",756],["massivart.de",756],["malermeister-shop.de",756],["imping-confiserie.de",756],["lenox-trading.at",756],["cklenk.de",756],["catolet.de",756],["drinkitnow.de",756],["patisserie-m.de",756],["storm-proof.com",756],["balance-fahrradladen.de",756],["magicpos.shop",756],["zeinpharma.com",756],["sps-handel.net",756],["novagenics.com",756],["butterfly-circus.de",756],["holzhof24.de",756],["w6-wertarbeit.de",756],["fleurop.de",756],["leki.com",756],["extremeaudio.de",756],["taste-market.de",756],["delker-optik.de",756],["stuhl24-shop.de",756],["g-nestle.de",756],["alpine-hygiene.ch",756],["fluidmaster.it",756],["cordon.de",756],["belisse-beauty.de",756],["belisse-beauty.co.uk",756],["wpc-shop24.de",756],["liv.si",756],["maybach-luxury.com",756],["leiternprofi24.de",756],["hela-shop.eu",756],["hitado.de",756],["j-koenig.de",756],["gameseal.com",756],["armedangels.com",[756,832,833]],["bvk-beamtenversorgung.de",757],["hofer-kerzen.at",758],["dosenmatrosen.de",758],["karls-shop.de",759],["byggern.no",760],["donauauen.at",761],["woltair.cz",762],["rostics.ru",763],["hife.es",764],["lilcat.com",765],["hot.si",[766,767,768,769]],["crenolibre.fr",770],["monarchmoney.com",771],["e-pole.pl",772],["dopt.com",773],["keb-automation.com",774],["bonduelle.ru",775],["oxfordonlineenglish.com",776],["pccomponentes.fr",777],["pccomponentes.com",777],["pccomponentes.pt",777],["grants.at",778],["africa-uninet.at",778],["rqb.at",778],["youngscience.at",778],["oead.at",778],["innovationsstiftung-bildung.at",778],["etwinning.at",778],["arqa-vet.at",778],["zentrumfuercitizenscience.at",778],["vorstudienlehrgang.at",778],["erasmusplus.at",778],["jeger.pl",779],["bo.de",780],["thegamingwatcher.com",781],["norlysplay.dk",782],["plusujemy.pl",783],["asus.com.cn",[784,786]],["zentalk.asus.com",[784,786]],["mubi.com",785],["photospecialist.co.uk",787],["foto-gregor.de",787],["kamera-express.de",787],["kamera-express.be",787],["kamera-express.nl",787],["kamera-express.fr",787],["kamera-express.lu",787],["dhbbank.com",788],["dhbbank.de",788],["dhbbank.be",788],["dhbbank.nl",788],["login.ingbank.pl",789],["fabrykacukiernika.pl",[790,791]],["peaks.com",792],["3landesmuseen-braunschweig.de",793],["unifachbuch.de",[794,795,796]],["playlumi.com",[797,798,799]],["chatfuel.com",800],["studio3t.com",[801,802,803,804]],["realgap.co.uk",[805,806,807,808]],["hotelborgia.com",[809,810]],["sweet24.de",811],["zwembaddekouter.be",812],["flixclassic.pl",813],["jobtoday.com",814],["deltatre.com",[815,816,830]],["withings.com",[817,818,819]],["blista.de",[820,821]],["hashop.nl",822],["gift.be",[823,824]],["weekend.ee",825],["elevator.de",825],["foryouehealth.de",825],["animaze.us",825],["penn-elcom.com",825],["curantus.de",825],["mtbmarket.de",825],["spanienweinonline.ch",825],["novap.fr",825],["bizkaia.eus",[826,827,828]],["sinparty.com",829],["mantel.com",831],["e-dojus.lv",834],["burnesspaull.com",835],["oncosur.org",836],["photobooth.online",837],["epidemicsound.com",838],["ryanair.com",839],["refurbished.at",[840,841,842]],["refurbished.nl",[840,841,842]],["refurbished.be",[840,841,842]],["refurbishedstore.de",[840,841,842]],["bayernportal.de",[843,844,845]],["ayudatpymes.com",846],["zipjob.com",846],["shoutcast.com",846],["plastischechirurgie-muenchen.info",847],["bonn.sitzung-online.de",848],["depop.com",[849,850,851]],["thenounproject.com",852],["pricehubble.com",853],["ilmotorsport.de",854],["karate.com",855],["psbank.ru",855],["myriad.social",855],["exeedme.com",855],["dndbeyond.com",856],["news.samsung.com",857],["tibber.com",858],["aqua-store.fr",859],["voila.ca",860],["anastore.com",861],["app.arzt-direkt.de",862],["dasfutterhaus.at",863],["e-pity.pl",864],["fillup.pl",865],["dailymotion.com",866],["barcawelt.de",867],["lueneburger-heide.de",868],["polizei.bayern.de",[869,871]],["ourworldofpixels.com",870],["jku.at",872],["matkahuolto.fi",873],["backmarket.de",[874,875,876]],["backmarket.co.uk",[874,875,876]],["backmarket.es",[874,875,876]],["backmarket.be",[874,875,876]],["backmarket.at",[874,875,876]],["backmarket.fr",[874,875,876]],["backmarket.gr",[874,875,876]],["backmarket.fi",[874,875,876]],["backmarket.ie",[874,875,876]],["backmarket.it",[874,875,876]],["backmarket.nl",[874,875,876]],["backmarket.pt",[874,875,876]],["backmarket.se",[874,875,876]],["backmarket.sk",[874,875,876]],["backmarket.com",[874,875,876]],["book-n-drive.de",878],["cotswoldoutdoor.com",879],["cotswoldoutdoor.ie",879],["cam.start.canon",880],["usnews.com",881],["researchaffiliates.com",882],["singkinderlieder.de",883],["stiegeler.com",884],["ba.com",[887,888,889,890,891,892,893]],["britishairways.com",[887,888,889,890,891,892,893]],["cineman.pl",[894,895,896]],["tv-trwam.pl",[894,895,896,897]],["qatarairways.com",[898,899,900,901,902]],["wedding.pl",903],["vivaldi.com",904],["emuia1.gugik.gov.pl",905],["nike.com",906],["adidas.at",907],["adidas.be",907],["adidas.ca",907],["adidas.ch",907],["adidas.cl",907],["adidas.co",907],["adidas.co.in",907],["adidas.co.kr",907],["adidas.co.nz",907],["adidas.co.th",907],["adidas.co.uk",907],["adidas.com",907],["adidas.com.ar",907],["adidas.com.au",907],["adidas.com.br",907],["adidas.com.my",907],["adidas.com.ph",907],["adidas.com.vn",907],["adidas.cz",907],["adidas.de",907],["adidas.dk",907],["adidas.es",907],["adidas.fi",907],["adidas.fr",907],["adidas.gr",907],["adidas.ie",907],["adidas.it",907],["adidas.mx",907],["adidas.nl",907],["adidas.no",907],["adidas.pe",907],["adidas.pl",907],["adidas.pt",907],["adidas.ru",907],["adidas.se",907],["adidas.sk",907],["colourbox.com",908],["ebilet.pl",909],["myeventeo.com",910],["snap.com",911],["louwman.nl",[912,913]],["ratemyprofessors.com",914],["filen.io",915],["leotrippi.com",916],["restaurantclub.pl",916],["context.news",916],["queisser.de",916],["grandprixradio.dk",[917,918,919,920,921]],["grandprixradio.nl",[917,918,919,920,921]],["grandprixradio.be",[917,918,919,920,921]],["businessclass.com",922],["quantamagazine.org",923],["hellotv.nl",924],["jisc.ac.uk",925],["lasestrellas.tv",926],["xn--digitaler-notenstnder-m2b.com",927],["schoonmaakgroothandelemmen.nl",927],["nanuko.de",927],["hair-body-24.de",927],["shopforyou47.de",927],["kreativverliebt.de",927],["anderweltverlag.com",927],["octavio-shop.com",927],["forcetools-kepmar.eu",927],["fantecshop.de",927],["hexen-werkstatt.shop",927],["shop-naturstrom.de",927],["biona-shop.de",927],["camokoenig.de",927],["bikepro.de",927],["kaffeediscount.com",927],["vamos-skateshop.com",927],["holland-shop.com",927],["avonika.com",927],["royal-oak.org",928],["hurton.pl",929],["officesuite.com",930],["fups.com",[931,936]],["kevin.eu",[932,933,934]],["scienceopen.com",937],["moebel-mahler-siebenlehn.de",[938,939]],["calendly.com",940],["batesenvironmental.co.uk",[941,942]],["ubereats.com",943],["101internet.ru",944],["bein.com",945],["beinsports.com",945],["figshare.com",946],["bitso.com",947],["gallmeister.fr",948],["eco-toimistotarvikkeet.fi",949],["proficient.fi",949],["developer.ing.com",950],["webtrack.dhlglobalmail.com",952],["webtrack.dhlecs.com",952],["ehealth.gov.gr",953],["calvinklein.se",[954,955,956]],["calvinklein.fi",[954,955,956]],["calvinklein.sk",[954,955,956]],["calvinklein.si",[954,955,956]],["calvinklein.ch",[954,955,956]],["calvinklein.ru",[954,955,956]],["calvinklein.com",[954,955,956]],["calvinklein.pt",[954,955,956]],["calvinklein.pl",[954,955,956]],["calvinklein.at",[954,955,956]],["calvinklein.nl",[954,955,956]],["calvinklein.hu",[954,955,956]],["calvinklein.lu",[954,955,956]],["calvinklein.lt",[954,955,956]],["calvinklein.lv",[954,955,956]],["calvinklein.it",[954,955,956]],["calvinklein.ie",[954,955,956]],["calvinklein.hr",[954,955,956]],["calvinklein.fr",[954,955,956]],["calvinklein.es",[954,955,956]],["calvinklein.ee",[954,955,956]],["calvinklein.de",[954,955,956]],["calvinklein.dk",[954,955,956]],["calvinklein.cz",[954,955,956]],["calvinklein.bg",[954,955,956]],["calvinklein.be",[954,955,956]],["calvinklein.co.uk",[954,955,956]],["ofdb.de",957],["dtksoft.com",958],["serverstoplist.com",959],["truecaller.com",960],["fruugo.fi",964],["ames-tools.co.uk",965],["ukbrewerytours.com",965],["sk-nic.sk",965],["worldcupchampionships.com",965],["arturofuente.com",[965,967,968]],["protos.com",[965,967,968]],["timhortons.co.th",[965,966,967,969,971,972]],["toyota.co.uk",[965,966,967,970,971,972]],["businessaccountingbasics.co.uk",[965,966,967,969,971,972]],["flickr.org",[965,966,967,969,971,972]],["espacocasa.com",965],["altraeta.it",965],["centrooceano.it",965],["allstoresdigital.com",965],["cultarm3d.de",965],["soulbounce.com",965],["fluidtopics.com",965],["uvetgbt.com",965],["malcorentacar.com",965],["emondo.de",965],["maspero.it",965],["kelkay.com",965],["underground-england.com",965],["vert.eco",965],["turcolegal.com",965],["magnet4blogging.net",965],["moovly.com",965],["automationafrica.co.za",965],["jornaldoalgarve.pt",965],["keravanenergia.fi",965],["kuopas.fi",965],["frag-machiavelli.de",965],["healthera.co.uk",965],["mobeleader.com",965],["powerup-gaming.com",965],["developer-blog.net",965],["medical.edu.mt",965],["deh.mt",965],["bluebell-railway.com",965],["ribescasals.com",965],["javea.com",965],["chinaimportal.com",965],["inds.co.uk",965],["raoul-follereau.org",965],["serramenti-milano.it",965],["cosasdemujer.com",965],["luz-blanca.info",965],["cosasdeviajes.com",965],["safehaven.io",965],["havocpoint.it",965],["motofocus.pl",965],["nomanssky.com",965],["drei-franken-info.de",965],["clausnehring.com",965],["alttab.net",965],["kinderleicht.berlin",965],["kiakkoradio.fi",965],["cosasdelcaribe.es",965],["de-sjove-jokes.dk",965],["serverprofis.de",965],["biographyonline.net",965],["iziconfort.com",965],["sportinnederland.com",965],["natureatblog.com",965],["wtsenergy.com",965],["cosasdesalud.es",965],["internetpasoapaso.com",965],["zurzeit.at",965],["contaspoupanca.pt",965],["steamdeckhq.com",[965,966,967,969,971,972]],["ipouritinc.com",[965,967,969]],["hemglass.se",[965,967,969,971,972]],["sumsub.com",[965,966,967]],["atman.pl",[965,966,967]],["fabriziovanmarciano.com",[965,966,967]],["nationalrail.com",[965,966,967]],["eett.gr",[965,966,967]],["funkypotato.com",[965,966,967]],["equalexchange.co.uk",[965,966,967]],["swnsdigital.com",[965,966,967]],["gogolf.fi",[965,969]],["hanse-haus-greifswald.de",965],["tampereenratikka.fi",[965,967,973,974]],["kymppikatsastus.fi",[967,971,1028,1029]],["santander.rewardgateway.co.uk",[975,976]],["brasiltec.ind.br",977],["xhaccess.com",977],["seexh.com",977],["valuexh.life",977],["xham.live",977],["xhamster.com",977],["xhamster.desi",977],["xhamster1.desi",977],["xhamster19.com",977],["xhamster2.com",977],["xhamster3.com",977],["xhamster42.desi",977],["xhamsterlive.com",977],["xhchannel.com",977],["xhchannel2.com",977],["xhdate.world",977],["xhopen.com",977],["xhspot.com",977],["xhtab4.com",977],["xhwebsite5.com",977],["xhwide5.com",977],["doka.com",[978,979,980]],["abi.de",[981,982]],["studienwahl.de",[981,982]],["journal.hr",[990,991,992,993]],["howstuffworks.com",994],["stickypassword.com",[995,996,997]],["conversion-rate-experts.com",[998,999]],["merkur.si",[1000,1001,1002]],["petitionenligne.com",[1003,1004]],["petitionenligne.be",[1003,1004]],["petitionenligne.fr",[1003,1004]],["petitionenligne.re",[1003,1004]],["petitionenligne.ch",[1003,1004]],["skrivunder.net",[1003,1004]],["petitiononline.uk",[1003,1004]],["petitions.nz",[1003,1004]],["petizioni.com",[1003,1004]],["peticao.online",[1003,1004]],["skrivunder.com",[1003,1004]],["peticiones.ar",[1003,1004]],["petities.com",[1003,1004]],["petitionen.com",[1003,1004]],["petice.com",[1003,1004]],["opprop.net",[1003,1004]],["peticiok.com",[1003,1004]],["peticiones.net",[1003,1004]],["peticion.es",[1003,1004]],["peticiones.pe",[1003,1004]],["peticiones.mx",[1003,1004]],["peticiones.cl",[1003,1004]],["peticije.online",[1003,1004]],["peticiones.co",[1003,1004]],["mediathek.lfv-bayern.de",1005],["aluypvc.es",[1006,1007,1008]],["pracuj.pl",[1009,1010,1011,1012,1013]],["vki.at",1015],["konsument.at",1015],["chollometro.com",1016],["dealabs.com",1016],["hotukdeals.com",1016],["pepper.it",1016],["pepper.pl",1016],["preisjaeger.at",1016],["mydealz.de",1016],["220.lv",[1017,1018]],["pigu.lt",[1017,1018]],["kaup24.ee",[1017,1018]],["hansapost.ee",[1017,1018]],["hobbyhall.fi",[1017,1018]],["direct.travelinsurance.tescobank.com",[1021,1022,1023,1024,1025,1026,1027,1028]],["mediaite.com",1030],["easyfind.ch",[1031,1032]],["e-shop.leonidas.com",[1033,1034]],["lastmile.lt",1035],["veriff.com",1036],["tvpworld.com",1037],["vm.co.mz",1038],["gamearena.pl",1039],["constantin.film",[1040,1041,1042]],["notion.so",1043],["omgevingsloketinzage.omgeving.vlaanderen.be",[1044,1045]],["primor.eu",1046],["tameteo.com",1047],["tempo.pt",1047],["yourweather.co.uk",1047],["meteored.cl",1047],["meteored.mx",1047],["tempo.com",1047],["ilmeteo.net",1047],["meteored.com.ar",1047],["daswetter.com",1047],["myprivacy.dpgmedia.nl",1048],["myprivacy.dpgmediagroup.net",1048],["algarvevacation.net",1049],["3sat.de",1050],["oxxio.nl",[1051,1052]],["butterflyshop.dk",[1053,1054,1055]],["praxis.nl",1056],["brico.be",1056],["kent.gov.uk",[1057,1058]],["pohjanmaanhyvinvointi.fi",1059],["maanmittauslaitos.fi",1060]]);

const entitiesMap = new Map([["airchina",[45,46,47]],["top4mobile",[80,81]]]);

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
        if ( /^-?\d+$/.test(unquoted) === false ) { return; }
        const n = parseInt(value, 10) || 0;
        if ( n < -32767 || n > 32767 ) { return; }
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
        'forbidden', 'forever',
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
