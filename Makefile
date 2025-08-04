.PHONY: clean edge safari safari-extension

# Dev tools
node_modules:
	npm install

init: node_modules

lint: init
	npm run lint

clean:
	rm -rf build node_modules

safari-extension:
	$(MAKE) -sC uBlock/ mv3-safari

safari-macos: safari-extension
	xcodebuild clean archive \
		-configuration release \
		-destination 'generic/platform=macOS' \
		-project "dist/safari/xcode/uBlock Origin Lite.xcodeproj" \
		-scheme "uBlock Origin Lite (macOS)"

safari-ios: safari-extension
	xcodebuild clean archive \
		-configuration release \
		-destination 'generic/platform=iOS' \
		-project "dist/safari/xcode/uBlock Origin Lite.xcodeproj" \
		-scheme "uBlock Origin Lite (iOS)"
