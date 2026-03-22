/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2026-present Raymond Hill

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

// Important!
// Isolate from global scope
(function uBOL_preventPopup() {

    const details = {"id":"nor-0","block":{"hostnames":["y6.no","irb.dk","a2ics.eu","dkdk.shop","fr135.net","gogle.net","noapp.sbs","nono.qpon","p-stn.net","s.free.fr","tnord.sbs","be-sms.com","tnord.qpon","acc-inf.com","ney-acc.com","post-dk.cfd","tnord.click","tnordh.shop","47.76.132.29","65.21.200.49","nestnose.com","ntfx-acc.com","postendk.lol","rumendia.com","147.93.63.211","158.94.209.89","43.100.125.58","43.162.119.45","acc-ntfix.com","flix-area.com","myups.express","netfx-acc.com","postendsk.lat","154.223.16.232","196.251.85.197","43.159.140.215","85.159.213.158","infopostdk.com","lnfoskonto.com","postnorddk.vip","109.230.237.116","195.242.152.122","212.224.107.120","aktienboard.com","appearspacex.de","dhl-trackng.com","galerijajava.ba","havfruen4220.dk","helse-norge.com","postnordse.asia","static-dscn.net","sundhedinfo.com","usaa-verify.com","eccolabgroup.com","economywatch.com","flix-request.com","healtheweb.co.uk","info-sundhed.com","myups-pakket.com","ozarkvillage.net","pestseminars.com","postenspor.today","postnord-24.site","postnord-eco.cfd","postnord-eco.sbs","postnord-eco.xyz","sporposten.today","sundhed-info.com","superbinvest.com","upsbezahlung.com","disneyplus-tv.com","dundeehills.group","norgeposten.today","pakkeposten.today","payement-renew.me","postennorge.today","postenpakke.today","postnord-eco.buzz","levering-myups.com","postenserves.today","printablemagic.com","start-myaltinn.com","tachyoniums.eu.com","trmff.wpengine.com","aib-loginsecure.com","connection-info.com","inquisitivebed.info","trackingfindups.com","wirexapp.africa.com","earnifi-claiming.com","my-subscriptions.net","nflix-management.com","postnord-update.help","premosupplements.com","santandersecurept.com","spotfy-regulation.com","nflix-reactivacion.com","ups-packaging.delivery","trackingpackage.express","790northsierrabonita.com","mitld-forholdsregler.com","directdigital-services.com","eltlnorsgogle.is-a-cpa.com","linkednordersalenavigate.com","195-242-152-122.static.hvvc.us"],"regexes":["iminklub","^[^:]+:\\/\\/([^:/]+\\.)?minklubshop\\.dk\\/dk[^%.0-9a-z_-]?","iminklar","^[^:]+:\\/\\/([^:/]+\\.)?minklarna\\.","inorgesa","norgesalg\\.com[^%.0-9a-z_-]?","isalgnor","salgnorge\\.com[^%.0-9a-z_-]?","ieasypar","^[^:]+:\\/\\/([^:/]+\\.)?easypark-"]},"allow":{"hostnames":[],"regexes":["ifinn.no","^[^:]+:\\/\\/([^:/]+\\.)?finn\\.no\\/user\\/ads\\.html[^%.0-9a-z_-]?"]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
