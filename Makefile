.PHONY: clean edge safari safari-extension safari-app safari-release

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
