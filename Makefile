.PHONY: clean edge

chromium-sources := $(wildcard chromium/* chromium/*/* chromium/*/*/* chromium/*/*/*/*)
firefox-sources := $(wildcard firefox/* firefox/*/* firefox/*/*/* firefox/*/*/*/*)

build/uBlock0.edge: tools/make-edge.sh tools/make-edge.mjs $(chromium-sources)
	tools/make-edge.sh

edge: build/uBlock0.edge

clean:
	rm -rf build
