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

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_removeClass = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["cookie-consent-active","body","stay"],["cookie-overlay-active","body","stay"],["modal-open","body","stay"],["hasPopup","body","stay"],["scommerce-gdpr-disabled","","stay"],["no-scroll","html","stay"],["cookie-consent__wrapper","","stay"],["cookies-request","body","stay"],["cx-modal-open","html","stay"],["cx-no-scroll","html","stay"],["e-cookie-bar-open","body","stay"],["cookies-not-set","body","stay"],["bottom-0","","stay"],["no-consent","html","stay"],["is-blurred-cookiebox","html","stay"],["ccpaCookieBanner-acceptedAll","body","stay"],["cookies-show",".cookies-show","stay"],["disable-background","","stay"],["cookie--not-set","body","stay"],["_cookiebanner","","stay"],["async-hide","","stay"],["cdk-overlay-container","","stay"],["ntd-gdpr-no-scroll","body","stay"],["modal-background","","stay"],["locked","","stay"],["pef-no-cookie","","stay"],["cookie-not-accepted","","stay"],["c-body--locked-always","","stay"],["darkOverlay","","stay"],["global-cookie","div","stay"],["disable-scroll","","stay"],["darkOverlay-highZ","","stay"],["cookie--not-set","","stay"],["bg-gray","","stay"],["cookie-active","","stay"],["is-modal-cookies-visible","","stay"],["lightbox-is-open","","stay"],["layerActive","","stay"],["cookiebar-open","","stay"],["blur","","stay"],["cookie","","stay"],["cookieconsent-active","body","stay"],["cookieMsg","","stay"],["cookie_consent__alert","","stay"],["gdpr-cookie-notice-center-loaded","","stay"],["has-open-cookie","","stay"],["om_cookie_active","","stay"],["cookie-overlay","","stay"],["disable","","stay"],["prevent-scroll","","stay"],["fog","","stay"],["cookie-hint","","stay"],["dp--cookie-consent","body","stay"],["body-overlay-scrollable","","stay"],["modal-open","","stay"],["no-scroll","body","stay"],["show-cookie-consent","","stay"],["is-active-cookiebar","","stay"],["-locked","","stay"],["has-banner","body.has-banner","stay"],["pointerevents","","stay"],["cookie-accept-required","","stay"],["cookie-open","","stay"],["cookiePopupVisible","","stay"],["unreadable-display","","stay"],["mandatory_cookie_modal","","stay"],["wwzoverlay--open","","stay"],["cookie_popup_exists","div.page-wrapper","stay"],["gdpr-infobar-visible","","stay"],["cookie-enabled","","stay"],["cookie-overlay--open","","stay"],["cookie-banner-open","","stay"],["overlay-content","body","stay"],["is-active-cookiebar","body","stay"],["didomi-popup-open","body"],["idxrcookies-block-user-nav","body","stay"],["darkOverlay","body"],["cookiebanner","","stay"],["show-cookie","","stay"],["ccpa-banner","","stay"],["modal-cacsp-open","","stay"],["modal-cacsp-box","","stay"],["js-modalUnclosable","","stay"],["js-cookiesModal|is-open",".js-cookiesModal,.is-open"],["remodal-bg","","stay"],["cookie-warning-open","","stay"],["with-featherlight","","stay"],["cookies-shown","body","stay"],["filter-blur","","stay"],["no-cookie","","stay"],["snoop-modal-open","body","stay"],["blurred","","stay"],["is-blurred-cookiebox","","stay"],["consent-manager--popup","body","stay"],["consent-manager-open","body","stay"],["zp-gtm-scripts--blur","","stay"],["dots","","stay"],["cookies-modal-open","","stay"],["modal-has-active","body","stay"],["messages-active","","stay"],["xh-thumb-disabled","","stay"],["body--cookies-panel-opened","","stay"],["chefcookie--blur","html","stay"],["chefcookie--fade","html","stay"],["chefcookie--noscroll","html","stay"],["b-dialog","","stay"],["disabled","body","stay"],["lock-scroll","","stay"],["disabled","header","stay"],["cookie-not-accepted-overlay","","stay"],["overlayopen","","stay"],["blurred-page","","stay"],["consent-dialog-open","body"],["cookie-consent--present","","stay"],["header-gdrp-cookies-visible","","stay"],["fixed","","stay"],["noScroll","","stay"],["cookie_notification","","stay"],["blocked-body","","stay"],["transfer__cookie-wall-active",".transfer__cookie-wall-active","stay"],["has-no-scroll","","stay"],["blured","","stay"],["noscroll","body","stay"],["has-overlay","","stay"],["cookie-consent-is-active","body","stay"],["cookiesgdpr__scroll","","stay"],["modal-show","","stay"],["gdpr","","stay"],["cookieopened","body","stay"],["cookiewall-active","body","stay"],["is-cookie-notice","body","stay"],["cookie-consent-banner-open","html","stay"],["modal-overlay","","stay"],["cookielaw-blur-background","","stay"],["sp-message-open","html","stay"],["modalOpen___gZykv","body"],["cookie-bar","","stay"],["hasCookieBanner","body","stay"]];

const hostnamesMap = new Map([["winparts.be",0],["winparts.eu",0],["winparts.fr",0],["winparts.ie",0],["winparts.nl",0],["winparts.se",0],["sportano.sk",1],["sportano.de",1],["sportano.bg",1],["sportano.hu",1],["sportano.ro",1],["sportano.cz",1],["buildex.cz",2],["gruenderservice.at",3],["pdc-big.nl",4],["pdc-big.it",4],["pdc-big.ie",4],["pdc-big.fr",4],["pdc-big.es",4],["pdc-big.be",4],["pdc-big.at",4],["pdc-big.co.uk",4],["pdc-big.de",4],["pdc-big.com",4],["elio-systems.io",[5,10]],["sanha.com",[5,10]],["opera.com",6],["groningenairport.nl",7],["crocs.co.uk",[8,9]],["crocs.eu",[8,9]],["crocs.nl",[8,9]],["crocs.fi",[8,9]],["crocs.fr",[8,9]],["crocs.de",[8,9]],["rappjmed.ch",11],["theverge.com",12],["stilord.fr",13],["stilord.it",13],["stilord.de",13],["stilord.es",13],["dasfutterhaus.at",14],["developer.paypal.com",15],["cpc2r.ch",16],["zen.com",17],["tecsafe.de",18],["stromnetz.berlin",19],["websummit.com",20],["wunderground.com",21],["evium.de",21],["epochtimes.fr",22],["ajbell.co.uk",23],["passbase.com",24],["economiapertutti.bancaditalia.it",25],["quantamagazine.org",26],["tradersunion.com",26],["phsgreenleaf.co.uk",27],["phswashrooms.ie",27],["drinkaware.co.uk",[28,31,76]],["mccolls.co.uk",[29,30]],["foxracingshox.de",32],["crt.hr",33],["yourstorebox.com",34],["housell.com",35],["stories.com",36],["lactostop.de",37],["dermapharm.de",37],["mibe.de",37],["spilger.de",38],["dbs.si",39],["visti.it",39],["abcya.com",40],["jongcdenv.be",41],["umicore.jp",41],["umicore.cn",41],["umicore.pl",41],["umicore.kr",41],["umicore.co.th",41],["umicore.fr",41],["umicore.de",41],["donneurdecellulessouches.be",41],["stammzellenspender.be",41],["stemcelldonor.be",41],["umicore.com",41],["umicore.com.br",41],["koenvandenheuvel.be",41],["stamceldonor.be",41],["nahima.be",41],["catused.com",42],["eujuicers.cz",43],["graziellawicki.com",44],["funnelcockpit.com",44],["dnk.nl",45],["eam.de",46],["eam-netz.de",46],["cellardoor.co",47],["verpackungsstadl.ch",48],["imkershoperzgebirge.de",48],["modellbahndealer.de",48],["tillit-bikes.shop",48],["bike-onlineshop.de",48],["futspo.de",48],["compravo.de",48],["perpedale.de",48],["modellbau-jung.de",48],["verpackungsstadl.at",48],["modellbau-vordermaier.de",48],["wroc.pl",49],["basenio.de",50],["fm-systeme.de",51],["swffm.de",52],["studentenwerkfrankfurt.de",52],["dmsg.de",52],["bgk.pl",52],["pflegezeit-berlin.de",52],["gpd-nordost-onlineberatung.de",52],["proabschluss-beratung.de",52],["hilfe-telefon-missbrauch.online",52],["dww-suchtberatung.de",52],["cyberforum.de",52],["gutscheine.eurothermen.at",52],["wolff-mueller.de",52],["ras.bz.it",52],["wifiwien.at",[53,54]],["wifikaernten.at",[53,54]],["wifi.at",[53,54]],["pdf-archive.com",54],["swrng.de",54],["5asec.pt",55],["tui.dk",55],["tui.fi",55],["tui.no",55],["tui.se",55],["leslipfrancais.fr",55],["bremischevb.de",[55,124]],["meinebank.de",[55,124]],["vb-rb.de",[55,124]],["gladbacher-bank.de",[55,124]],["nordthueringer-volksbank.de",[55,124]],["bodenseebank.de",[55,124]],["rb-oberaudorf.de",[55,124]],["volksbank-trossingen.de",[55,124]],["owl-immobilien.de",[55,124]],["volksbank-backnang.de",[55,124]],["volksbank-international.de",[55,124]],["raiba-westhausen.de",[55,124]],["vr-nopf.cz",[55,124]],["vrbankimmobilien.de",[55,124]],["cvw-privatbank-ag.de",[55,124]],["rb-denzlingen-sexau.de",[55,124]],["rv-banken.de",[55,124]],["volksbank-remseck.de",[55,124]],["raiba-gr.de",[55,124]],["vrb-spangenberg.de",[55,124]],["rb-berghuelen.de",[55,124]],["vb-lauterecken.de",[55,124]],["rb-sondelfingen.de",[55,124]],["voba-deisslingen.de",[55,124]],["saechsischer-gewinnsparverein.de",[55,124]],["rb-hardt-bruhrain.de",[55,124]],["volksbank-daaden.de",[55,124]],["dervolksbanker.de",[55,124]],["volksbank-kirnau.de",[55,124]],["skbwitten.de",[55,124]],["raiba-ndwa.de",[55,124]],["volksbank-mittleres-erzgebirge.de",[55,124]],["rb-eching.de",[55,124]],["volksbank-aktiv.de",[55,124]],["vbsuedemsland.de",[55,124]],["voba-moeckmuehl.de",[55,124]],["volksbank-freiburg.de",[55,124]],["vbleos.de",[55,124]],["meine-rvb.de",[55,124]],["aachener-bank.de",[55,124]],["muenchner-bank.de",[55,124]],["volksbank-dh.de",[55,124]],["volksbankeg.de",[55,124]],["sparda-bank-hamburg.de",[55,124]],["sparda-sw.de",[55,124]],["volksbank-thueringen-mitte.de",[55,124]],["vrbankeg.de",[55,124]],["bernhauser-bank.de",[55,124]],["vvrbank-krp.de",[55,124]],["vvr-bank.de",[55,124]],["vb-mittelhessen.de",[55,124]],["vr-bayernmitte.de",[55,124]],["pollfish.com",56],["werkenbijtrekpleister.nl",57],["werkenbijkruidvat.be",57],["rassenlijst.info",57],["werkenbijiciparisxl.nl",57],["tesa-labtec.com",58],["tesatape.ru",58],["tesa.com",58],["flightradar24.com",59],["apk-vk.at",60],["vietnamairlines.com",61],["incotec.com",62],["croda.com",62],["exaktafoto.se",63],["campingdusoleil.com",64],["hotel-la-chaumiere.com",64],["les-anges-gardiens.fr",64],["croco-kid.com",64],["cambridge-centre.fr",64],["equisud.com",64],["allokebab-pau.fr",64],["etre-visible.local.fr",64],["mas-montebello66.com",64],["camping-residentiel-les-marronniers-jura.fr",64],["dj4events.fr",64],["saintjoursexpertmaritime.com",64],["az-renovation.fr",64],["presquilemultiservices.com",64],["hotel-aigoual.com",64],["hotel-restaurant-pau.com",64],["desrayaud-paysagistes.com",64],["hotelsaintcharles.fr",64],["agvillagecamarguais.com",64],["joyella.com",64],["gabriel-godard.com",64],["artech-sellerie.com",64],["motoclubernee.com",64],["ledauphinhotel.com",64],["cuisin-studio.com",64],["biomeo-environnement.com",64],["leman-instruments.com",64],["esthetique-meyerbeer.com",64],["institut-bio-naturel-nice.fr",64],["nature-et-bois.fr",64],["transmissions-bordeaux.com",64],["kinechartreuse.com",64],["corsegourmande.com",64],["cotedecor.com",64],["restaurant-la-badiane.fr",64],["systelia.fr",64],["lesjardinsinterieurs.com",64],["helenevue.com",64],["saubusse-thermes.com",64],["dehn.es",65],["dehn.fr",65],["dehn.it",65],["dehn.hu",65],["desitek.dk",65],["dehn.at",65],["dehn.de",65],["wwz.ch",66],["taloon.com",67],["inyova.at",68],["inyova.ch",68],["inyova.de",68],["ccalbacenter.com",68],["wamu.org",68],["momentive.com",69],["kennedyslaw.com",70],["elekta.com",71],["stratasysdirect.com",72],["stratasys.com",72],["werkenbijkruidvat.nl",73],["ghacks.net",74],["cutoff.es",75],["ybpn.de",77],["cwtworktools.com",78],["mbanc.com",79],["hellomtg.com",79],["primejumbo.com",79],["dentalgalindo.com",[80,81]],["brutalvisual.com",[80,81]],["archeologia.com.pl",[80,81]],["letrayframe.com",[80,81]],["osteofisintegral.es",[80,81]],["uco.cat",[80,81]],["buecheler-kollegen.de",[80,81]],["seminariodeosma-soria.org",[80,81]],["kamensenica.sk",[80,81]],["movimentoofficinedelsud.it",[80,81]],["trident.se",[80,81]],["semanasantademalagaayeryhoy.com",[80,81]],["diazfloristasestrella.com",[80,81]],["cosechavida.com",[80,81]],["centre-hypnose-moselle.com",[80,81]],["broncoillustration.com",[80,81]],["sumoingenio.com",[80,81]],["aligepro.es",[80,81]],["muevo.es",[80,81]],["azulejosacedo.com",[80,81]],["sana.cz",[80,81]],["aliapinto.com",[80,81]],["tsconline.es",[80,81]],["polifast.it",[80,81]],["napos.cz",[80,81]],["gutshaus-neuendorf-usedom.de",[80,81]],["kunterbunte-kinder.de",[80,81]],["desatando.org",[80,81]],["ledocom.cz",[80,81]],["aliciasuarez.net",[80,81]],["diabramar.com",[80,81]],["lamagnalonga.org",[80,81]],["benejamrefrigeracion.com",[80,81]],["micropigmentacioncapilarbcn.com",[80,81]],["revistaauge.com.ar",[80,81]],["arcusnet.se",[80,81]],["videogenic.es",[80,81]],["grundschule-remagen.de",[80,81]],["aceitessatunion.com",[80,81]],["servigraphic.com.ar",[80,81]],["textsteine.de",[80,81]],["campergarage.es",[80,81]],["administradorfincasblog.com",[80,81]],["balgal.es",[80,81]],["grafika-dtp-produkcia.sk",[80,81]],["unmardeconstelaciones.com",[80,81]],["salobella.com",[80,81]],["careon.se",[80,81]],["gymnosport.com",[80,81]],["easyhomes.com.es",[80,81]],["casavaledalama.pt",[80,81]],["dosc.es",[80,81]],["fcfoz.pt",[80,81]],["berevolk.com",[80,81]],["hvpropertyclearance.co.uk",[80,81]],["calamo.se",[80,81]],["elserratplanoles.com",[80,81]],["bubblessea.es",[80,81]],["disperator.se",[80,81]],["ecoparquets.com",[80,81]],["zlotaraczkalublin.pl",[80,81]],["congresoscostadelsol.com",[80,81]],["pneumaticiroma.it",[80,81]],["asprona.es",[80,81]],["virgendefatima.es",[80,81]],["patronatpremia.cat",[80,81]],["2points13.fr",[80,81]],["3d3.es",[80,81]],["abantos.es",[80,81]],["abastanimacio.org",[80,81]],["academiafrancesadebelleza.co",[80,81]],["acaluca.org",[80,81]],["acce.es",[80,81]],["ad-particles.com",[80,81]],["adea.sk",[80,81]],["afplr.fr",[80,81]],["agiletalon.fr",[80,81]],["agiratou.com",[80,81]],["aidaromero.com",[80,81]],["alkoholochnarkotika.se",[80,81]],["alligatorbioscience.se",[80,81]],["anea.es",[80,81]],["animala.es",[80,81]],["antequerabelleza.com",[80,81]],["apimadrid.net",[80,81]],["aquatrend.sk",[80,81]],["arabesque-formation.org",[80,81]],["arrivamallorca.es",[80,81]],["arteydeco.es",[80,81]],["asapservicios.net",[80,81]],["aspock.com",[80,81]],["atout-voyages.com",[80,81]],["autocareslazara.es",[80,81]],["autocaresmariano.com",[80,81]],["autoform.pl",[80,81]],["ayudatranspersonal.com",[80,81]],["bacabeton.cz",[80,81]],["begalvi.com",[80,81]],["bent-com.com",[80,81]],["berliner-haeuser.de",[80,81]],["bespokespain.com",[80,81]],["bevent-rasch.se",[80,81]],["bio-cord.es",[80,81]],["biotropica.fr",[80,81]],["bornes-eurorelais.fr",[80,81]],["braeu-stueble.de",[80,81]],["brendanoharamp.scot",[80,81]],["briau.com",[80,81]],["caleulalia.com",[80,81]],["cande-sur-beuvron.com",[80,81]],["carlhag.se",[80,81]],["carrier.se",[80,81]],["casadelaveiga.com",[80,81]],["caytas.com.tr",[80,81]],["cecjecuador.org.ec",[80,81]],["cegef.com",[80,81]],["centrediagonal.com",[80,81]],["centropolisportivomassari.it",[80,81]],["cerai.org",[80,81]],["cervosgrup.com",[80,81]],["chimeneasalicante.com",[80,81]],["circodelshow.com",[80,81]],["cliatec.com",[80,81]],["clinicabadal.es",[80,81]],["cometh-consulting.com",[80,81]],["copysud.fr",[80,81]],["cortilar.com",[80,81]],["crystal-finance.com",[80,81]],["ctangana.com",[80,81]],["cugatresidencial.com",[80,81]],["dake.es",[80,81]],["datatal.se",[80,81]],["degom.com",[80,81]],["delfis.es",[80,81]],["delogica.com",[80,81]],["dentalcompany.es",[80,81]],["descarpack.com.br",[80,81]],["desfiladeroediciones.com",[80,81]],["desomer.be",[80,81]],["diarioandalucia.es",[80,81]],["dibujos-animados.net",[80,81]],["direkt-immobilie.de",[80,81]],["dovozautznemecka.cz",[80,81]],["drpuigdollers.com",[80,81]],["dunamys.inf.br",[80,81]],["easyimplantology.com",[80,81]],["eb2b.com.pl",[80,81]],["echo-mieszkania.pl",[80,81]],["eclinic.com.sg",[80,81]],["edgeict.com",[80,81]],["eiglaw.com",[80,81]],["elandexpediciones.es",[80,81]],["emalec.com",[80,81]],["enlighten.net",[80,81]],["equifab.es",[80,81]],["escuelanauticamarenostrum.com",[80,81]],["esgrima.cat",[80,81]],["espaisperconviure.es",[80,81]],["etbygg.com",[80,81]],["eurepieces.fr",[80,81]],["euroenvio.com",[80,81]],["eurotex.es",[80,81]],["expertetfinance.fr",[80,81]],["farmarsketrhyfuturum.cz",[80,81]],["fastvisa.fr",[80,81]],["fauxdiplomes.org",[80,81]],["fisiolistic.com",[80,81]],["fondazionealbertosordi.it",[80,81]],["foyersekcjapolska.eu",[80,81]],["fundacjaeds.pl",[80,81]],["galeriaxanadu.pl",[80,81]],["garcia-ibanez.com",[80,81]],["gestenaval.com",[80,81]],["glaskogen.se",[80,81]],["globalteam.es",[80,81]],["goia.org.pl",[80,81]],["granibier.com",[80,81]],["grundia.se",[80,81]],["grupoisn.com",[80,81]],["gruporhzaragoza.com",[80,81]],["hagagruppen.se",[80,81]],["halima-magazin.com",[80,81]],["handelskammaren.com",[80,81]],["helitecnics.com",[80,81]],["helux.se",[80,81]],["hermanosalcaraz.com",[80,81]],["hjarnkoll.se",[80,81]],["hmfoundation.com",[80,81]],["hormimpres.com",[80,81]],["hoteldeprony.fr",[80,81]],["hotelroyalcatania.it",[80,81]],["houjethai.nl",[80,81]],["hummer.cz",[80,81]],["icld.se",[80,81]],["ict-project.it",[80,81]],["imagelova.id",[80,81]],["imprentalaspalmas.com",[80,81]],["informamiele.it",[80,81]],["inission.com",[80,81]],["inmobiliariavolga.com",[80,81]],["international-terra-institute.com",[80,81]],["inwaspain.com",[80,81]],["izkigolf.eus",[80,81]],["jdmusic.se",[80,81]],["juveycamps.com",[80,81]],["karel1.nl",[80,81]],["kaunokapiniuprieziura.lt",[80,81]],["kcmkompresor.com",[80,81]],["kewaccountants.co.uk",[80,81]],["konkretplus.pl",[80,81]],["krajci.cz",[80,81]],["krisvagenut.se",[80,81]],["kyoceracapetown.co.za",[80,81]],["labaguette.pl",[80,81]],["labintegrados.com",[80,81]],["ladderupinc.com",[80,81]],["landskronafoto.org",[80,81]],["langarri.es",[80,81]],["lawa.es",[80,81]],["laxo.se",[80,81]],["layher.se",[80,81]],["lifetraveler.net",[80,81]],["lindrooshalsa.se",[80,81]],["lobolab.es",[80,81]],["maisqueromanicorutas.com",[80,81]],["mallandonoandroid.com",[80,81]],["masconcas.com",[80,81]],["mediabest.cz",[80,81]],["megustaelvino.es",[80,81]],["mensa.se",[80,81]],["mestiteslilis.com",[80,81]],["minutoprint.com",[80,81]],["mirano.cz",[80,81]],["mogador.cz",[80,81]],["morphestudio.es",[80,81]],["motoaxial.com",[80,81]],["multiversidad.es",[80,81]],["mundollaves.com",[80,81]],["musicotherapie-federationfrancaise.com",[80,81]],["nauticaravaning.com",[80,81]],["nestville.sk",[80,81]],["nestvillepark.sk",[80,81]],["netromsoftware.ro",[80,81]],["nojesfabriken.se",[80,81]],["oddoneout.se",[80,81]],["opako.pl",[80,81]],["oserlafrique.com",[80,81]],["paintballalcorcon.com",[80,81]],["pallejabcn.com",[80,81]],["penicilinafruits.com",[80,81]],["peregrinoslh.com",[80,81]],["permis-lausanne.ch",[80,81]],["pernillaandersson.se",[80,81]],["piazzadelgusto.it",[80,81]],["pipi-antik.dk",[80,81]],["plasticosgeca.com",[80,81]],["plastimyr.com",[80,81]],["portal.unimes.br",[80,81]],["pro-beruf.de",[80,81]],["prophecyinternational.com",[80,81]],["psicoterapeuta.org",[80,81]],["puertasprieto.com",[80,81]],["puntosdefantasia.es",[80,81]],["pzmk.org.pl",[80,81]],["rastromaquinas.com",[80,81]],["rectoraldecastillon.com",[80,81]],["reinomineral.com",[80,81]],["reklamefreunde.de",[80,81]],["restauraciontalavera.es",[80,81]],["restauranthispania.com",[80,81]],["ristoranteeziogritti.it",[80,81]],["rubinmedical.dk",[80,81]],["rubinmedical.no",[80,81]],["rubinmedical.se",[80,81]],["sak.se",[80,81]],["sammetais.com.br",[80,81]],["sebastiancurylo.pl",[80,81]],["serigrafiaiorgi.com",[80,81]],["seyart.com",[80,81]],["sgaim.com",[80,81]],["sicamemt.org",[80,81]],["siguealconejoblanco.es",[80,81]],["sinfimasa.com",[80,81]],["skp.se",[80,81]],["skrobczynski.pl",[80,81]],["slush.de",[80,81]],["solebike.it",[80,81]],["solu-watt.fr",[80,81]],["soluzionainmobiliaria.es",[80,81]],["somoparque.com",[80,81]],["sorgingaztemoda.com",[80,81]],["sroportal.sk",[80,81]],["ssmf.se",[80,81]],["stobrasil.com.br",[80,81]],["stoparmut2015.ch",[80,81]],["studiodimuro.com",[80,81]],["subkultur-hannover.de",[80,81]],["sustanciagris.com",[80,81]],["szkt.sk",[80,81]],["tagibergslagen.se",[80,81]],["tallergastronomico.es",[80,81]],["tarna.fhsk.se",[80,81]],["tassenyalitzacio.com",[80,81]],["tctech.se",[80,81]],["teknoduegroup.it",[80,81]],["teloliquido.com",[80,81]],["temasa.es",[80,81]],["textilprint.sk",[80,81]],["thehouseofautomata.com",[80,81]],["tmgernika.com",[80,81]],["toastetmoi.fr",[80,81]],["tollare.org",[80,81]],["trattoriabolognesi.it",[80,81]],["triperavigatana.com",[80,81]],["tuckerfranklininsgrp.com",[80,81]],["tuftuf.net",[80,81]],["turuletras.com",[80,81]],["umfmb.fr",[80,81]],["upapsa.com",[80,81]],["valenciatoday.es",[80,81]],["vanghel-und-morawski.de",[80,81]],["vickycan.com",[80,81]],["ville-de-salles.com",[80,81]],["webbigt.se",[80,81]],["westlede.be",[80,81]],["wiemker.org",[80,81]],["woolink.co",[80,81]],["wp.fratgsa.org",[80,81]],["xatobaxestion.com",[80,81]],["xfactor-gmbh.de",[80,81]],["yougoenglish.com",[80,81]],["zigmoon.com",[80,81]],["canyon.com",[82,83]],["drimsim.com",84],["eteam-winkler.de",85],["kdn-elektro.de",85],["elektro-kotz.de",85],["elektro-service-rauh.de",85],["elektroanlagenbuettner.de",85],["be-connect.online",85],["bayergruppe.com",85],["bayer-wkt.de",85],["bayer-wind.de",85],["bayer-wd.de",85],["elektro-joa.de",85],["htechnik.de",85],["ehk-service.de",85],["bittner-tv.de",85],["elektro-suelzner.de",85],["elektro-leps.de",85],["elektromax-hausgeraete.de",85],["elektrotechnik-schedel.de",85],["elkugmbh.de",85],["ln-elektro-gmbh.de",85],["weiss-blau-gmbh.de",85],["sunbeam-energy.de",85],["prokauf.com",85],["lichtstudio-kerl.de",85],["liebing-beese.de",85],["hoeschel-baumann.de",85],["hausgeraete-kraemer.de",85],["gehlhaar-elektrotechnik.de",85],["ehs-elektrotechnik.de",85],["elektrojarschke.de",85],["elektrotechnik-fleischmann.de",85],["elektroseemueller.de",85],["schoerling-blitz.de",85],["ast-apolda.com",85],["elektro-klippel.de",85],["arntz-haustechnik.de",85],["elektro-bindel.de",85],["elektrotechnik-weiss.com",85],["brandschutz-hamburg.de",85],["wagnerelektrotechnik.de",85],["el-kramer.de",85],["mks-hof.de",85],["wernz-elektro.de",85],["e3-energy.de",85],["sg-solar.de",85],["elektrokrebs.de",85],["elektro-roehrl.de",85],["elektro-kreher.de",85],["giegling-vonsaal.de",85],["elektro-lehmann.com",85],["ems-wurzen.de",85],["scholpp.es",86],["scholpp.pl",86],["scholpp.it",86],["ptc.eu",86],["scholpp.com",86],["abo24.de",86],["overdrive.com",86],["wetu.com",86],["superwatchman.com",87],["wedding.pl",88],["bitburger-braugruppe.de",89],["snoopmedia.com",90],["myguide.de",90],["study-in-germany.de",90],["daad.de",90],["biegnaszczyt.pl",91],["call-a-pizza.de",91],["futterhaus.de",92],["scottsofstow.co.uk",[93,94]],["zawszepomorze.pl",95],["wasserkunst-hamburg.de",96],["lta.org.uk",97],["conversion-rate-experts.com",98],["theateramrand.de",99],["jugend-praesentiert.de",99],["xhamster.com",100],["xhamster2.com",100],["xhamster3.com",100],["xhamster18.desi",100],["athletic-club.eus",101],["close2.de",[102,103,104]],["medicalti.it",[102,103,104]],["grottisrl.it",[102,103,104]],["vilmie-pet.com",[102,103,104]],["private-krankenversicherungen-vergleich.de",[102,103,104]],["ipanema-shop.com",[102,103,104]],["buero-rothenfusser.com",[102,103,104]],["versi24.de",[102,103,104]],["rs-vertriebsservice.com",[102,103,104]],["matina-gmbh.de",[102,103,104]],["erding-solar.de",[102,103,104]],["greenwoods-small-pet.com",[102,103,104]],["kfz-schwabing.de",[102,103,104]],["comune.randazzo.ct.it",[102,103,104]],["comune.catania.it",[102,103,104]],["ordineavvocaticatania.it",[102,103,104]],["agentur-alberts.de",[102,103,104]],["waveaudio.de",[102,103,104]],["alexide.com",[102,103,104]],["piske-innovationen.de",[102,103,104]],["sbit.ag",[102,103,104]],["smilla-katzenfutter.de",[102,103,104]],["epayments.com",105],["riceundspice.de",106],["happysocks.com",[107,108]],["win2day.at",109],["petcity.lt",110],["porp.pl",111],["computerbase.de",112],["gesundheitsamt-2025.de",113],["coastfashion.com",114],["oasisfashion.com",114],["warehousefashion.com",114],["misspap.com",114],["karenmillen.com",114],["boohooman.com",114],["nebo.app",115],["groupeonepoint.com",116],["edpsciences.org",117],["bemmaisseguro.com",118],["wetransfer.com",119],["scheidegger.nl",120],["phoenix.de",121],["strato.se",122],["strato.de",122],["mishcon.com",123],["bbva.es",125],["bbvauk.com",125],["bbva.be",125],["bbva.fr",125],["bbva.it",125],["bbva.pt",125],["suntech.cz",126],["digikey.co.za",127],["digikey.cn",127],["digikey.ee",127],["digikey.at",127],["digikey.be",127],["digikey.bg",127],["digikey.cz",127],["digikey.dk",127],["digikey.fi",127],["digikey.fr",127],["digikey.de",127],["digikey.gr",127],["digikey.hu",127],["digikey.ie",127],["digikey.it",127],["digikey.lv",127],["digikey.lt",127],["digikey.lu",127],["digikey.nl",127],["digikey.no",127],["digikey.pl",127],["digikey.pt",127],["digikey.ro",127],["digikey.sk",127],["digikey.si",127],["digikey.es",127],["digikey.se",127],["digikey.ch",127],["digikey.co.uk",127],["digikey.co.il",127],["digikey.com.mx",127],["digikey.ca",127],["digikey.com.br",127],["digikey.co.nz",127],["digikey.com.au",127],["digikey.co.th",127],["digikey.tw",127],["digikey.kr",127],["digikey.sg",127],["digikey.ph",127],["digikey.my",127],["digikey.jp",127],["digikey.in",127],["digikey.hk",127],["digikey.com",127],["eurosupps.nl",128],["pathe.nl",129],["makelaarsland.nl",130],["nordania.dk",131],["365direkte.no",131],["danskebank.lv",131],["danskebank.lt",131],["danskebank.no",131],["danskebank.fi",131],["danskebank.dk",131],["danskebank.com",131],["danskebank.se",131],["danskebank.co.uk",131],["danskeci.com",131],["danicapension.dk",131],["gewerbegebiete.de",132],["balay.es",133],["constructa.com",133],["gaggenau.com",133],["impulse.de",134],["pcgamer.com",134],["infoworld.com",134],["kiplinger.com",134],["omni.se",134],["it-times.de",134],["bitcoinmagazine.com",134],["deliciousmagazine.co.uk",134],["upday.com",134],["theguardian.com",134],["deutschlandcard.de",134],["szbz.de",134],["free-fonts.com",134],["lieferzeiten.info",134],["vice.com",134],["newsnow.co.uk",134],["out.com",134],["streampicker.de",134],["radiotimes.com",134],["nowtv.com",134],["kochbar.de",134],["toggo.de",134],["am-online.com",134],["n-tv.de",134],["newsandstar.co.uk",134],["tag24.de",134],["weltkunst.de",134],["noveauta.sk",134],["pnn.de",134],["economist.com",134],["crash.net",134],["norwaytoday.info",134],["insider.com",134],["preis.de",134],["ibroxnoise.co.uk",134],["celtsarehere.com",134],["nufcblog.co.uk",134],["sport1.de",134],["techconnect.com",134],["followfollow.com",134],["thespun.com",134],["mazdas247.com",134],["fastcar.co.uk",134],["vitalfootball.co.uk",134],["audi-sport.net",134],["bumble.com",134],["arcamax.com",134],["dilbert.com",134],["sportbible.com",134],["givemesport.com",134],["dartsnews.com",134],["gpfans.com",134],["justjared.com",134],["justjaredjr.com",134],["finanzen.at",134],["idealo.at",134],["ladenzeile.at",134],["berliner-zeitung.de",134],["urbia.de",134],["essen-und-trinken.de",134],["wetter.de",134],["rtl-living.de",134],["vox.de",134],["ladenzeile.de",134],["advocate.com",134],["idealo.de",134],["wigantoday.net",134],["economistgroup.com",134],["transfermarkt.nl",134],["transfermarkt.es",134],["transfermarkt.pl",134],["transfermarkt.pt",134],["transfermarkt.at",134],["transfermarkt.it",134],["transfermarkt.fr",134],["transfermarkt.de",134],["transfermarkt.be",134],["transfermarkt.co.uk",134],["transfermarkt.us",134],["footballfancast.com",134],["cio.com",134],["jezebel.com",134],["splinternews.com",134],["denofgeek.com",134],["kinja.com",134],["theinventory.com",134],["rollingstone.de",134],["sueddeutsche.de",134],["csoonline.com",134],["tvmovie.de",134],["testberichte.de",134],["pcgameshardware.de",134],["4players.de",134],["guj.de",134],["bild.de",134],["wieistmeineip.de",134],["testbild.de",134],["stylebook.de",134],["skygroup.sky",134],["speisekarte.de",134],["haeuser.de",134],["cmo.com.au",134],["pcworld.co.nz",134],["idealo.it",134],["transfermarkt.jp",134],["transfermarkt.co.id",134],["autoexpress.co.uk",134],["transfermarkt.com",134],["esportsclub.nl",134],["webwinkel.tubantia.nl",134],["shopalike.nl",134],["autoweek.nl",134],["pcworld.es",134],["macworld.es",134],["idealo.es",134],["businessinsider.es",134],["motor.es",134],["autobild.es",134],["driving.co.uk",134],["stern.de",134],["pcgames.de",134],["sport.de",134],["idealo.fr",134],["barrons.com",134],["tori.fi",134],["snow-forecast.com",134],["tidende.dk",134],["kraloyun.com",134],["arnnet.com.au",134],["bunte.de",134],["handelsblatt.com",134],["techbook.de",134],["metal-hammer.de",134],["macworld.co.uk",134],["maxisciences.com",134],["ohmymag.com",134],["voici.fr",134],["geo.de",134],["businessinsider.de",134],["heise.de",134],["meinestadt.de",134],["politico.eu",134],["spieletipps.de",134],["finanznachrichten.de",134],["vtwonen.nl",134],["stol.it",134],["waitrose.com",135],["storyhouseegmont.dk",136],["storyhouseegmont.no",136],["storyhouseegmont.se",136],["egmont.com",136],["nordiskfilm.com",136],["faq.whatsapp.com",137],["blog.whatsapp.com",137],["www.whatsapp.com",137]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeClass(
    token = '',
    selector = '',
    behavior = ''
) {
    if ( typeof token !== 'string' ) { return; }
    if ( token === '' ) { return; }
    const classTokens = token.split(/\s*\|\s*/);
    if ( selector === '' ) {
        selector = '.' + classTokens.map(a => CSS.escape(a)).join(',.');
    }
    const mustStay = /\bstay\b/.test(behavior);
    let timer;
    const rmclass = function() {
        timer = undefined;
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                node.classList.remove(...classTokens);
            }
        } catch(ex) {
        }
        if ( mustStay ) { return; }
        if ( document.readyState !== 'complete' ) { return; }
        observer.disconnect();
    };
    const mutationHandler = mutations => {
        if ( timer !== undefined ) { return; }
        let skip = true;
        for ( let i = 0; i < mutations.length && skip; i++ ) {
            const { type, addedNodes, removedNodes } = mutations[i];
            if ( type === 'attributes' ) { skip = false; }
            for ( let j = 0; j < addedNodes.length && skip; j++ ) {
                if ( addedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
            for ( let j = 0; j < removedNodes.length && skip; j++ ) {
                if ( removedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
        }
        if ( skip ) { return; }
        timer = self.requestIdleCallback(rmclass, { timeout: 67 });
    };
    const observer = new MutationObserver(mutationHandler);
    const start = ( ) => {
        rmclass();
        observer.observe(document, {
            attributes: true,
            attributeFilter: [ 'class' ],
            childList: true,
            subtree: true,
        });
    };
    runAt(( ) => {
        start();
    }, /\bcomplete\b/.test(behavior) ? 'idle' : 'loading');
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
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
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
    try { removeClass(...argsList[i]); }
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

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_removeClass();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_removeClass = cloneInto([
            [ '(', uBOL_removeClass.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_removeClass);
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
    delete page.uBOL_removeClass;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
