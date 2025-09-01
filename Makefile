.PHONY: clean cleanassets \
	safari safari-extension safari-app safari-release \
	publish-chromium publish-edge

# Dev tools
node_modules:
	npm install

init: node_modules

lint: init
	npm run lint

clean:
	rm -rf build node_modules

cleanassets:
	$(MAKE) -sC uBlock/ cleanassets

safari-extension:
	$(MAKE) -sC uBlock/ mv3-safari && \
		rm -rf build/uBOLite.safari && \
		cp -R uBlock/dist/build/uBOLite.safari build/

safari-app: safari-extension
	xcodebuild clean archive \
		-configuration release \
		-destination 'generic/platform=iOS' \
		-project "dist/safari/xcode/uBlock Origin Lite.xcodeproj" \
		-scheme "uBlock Origin Lite (iOS)" && \
	xcodebuild clean archive \
		-configuration release \
		-destination 'generic/platform=macOS' \
		-project "dist/safari/xcode/uBlock Origin Lite.xcodeproj" \
		-scheme "uBlock Origin Lite (macOS)"

publish-chromium:
	node publish-extension/publish-chromium.js \
		ghowner=uBlockOrigin \
		ghrepo=uBOL-home \
		ghtag=$(version) \
		ghasset=chromium \
		storeid=ddkjiahejlhfcafbddmgiahcphecmpfh

publish-edge:
	node publish-extension/publish-edge.js \
		ghowner=uBlockOrigin \
		ghrepo=uBOL-home \
		ghtag=$(version) \
		ghasset=edge \
		storeid=cimighlppcgcoapaliogpjjdehbnofhn \
		productid=$(UBOL_EDGE_ID)

publish-dev-firefox:
	node publish-extension/publish-firefox.js \
		ghowner=uBlockOrigin \
		ghrepo=uBOL-home \
		ghtag=$(version) \
		ghasset=firefox \
		storeid=uBOLiteRedux@raymondhill.net \
		channel=unlisted \
		updatepath=./dist/firefox.updates.json

# Publishable releases are downloaded from GitHub.
# To create publishable release, fill in with release tag:
# 
# node dist/safari/publish-extension.js ghtag=[release tag] ios
# node dist/safari/publish-extension.js ghtag=[release tag] macos
