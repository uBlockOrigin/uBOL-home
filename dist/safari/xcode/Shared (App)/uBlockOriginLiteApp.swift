//
//  uBlockOriginLiteApp.swift
//  uBlock Origin Lite
//
//  Created by Sebastian on 13/04/2026.
//

import SwiftUI


@main
struct uBlockOriginLiteApp: App {
    var body: some Scene {
      #if os(macOS)
      Window("uBlock Origin Lite", id: "uBlockOriginLite") {
        ContentView()
          .frame(width: 350, height: 460)
      }
      .windowResizability(.contentSize)
      .windowStyle(.hiddenTitleBar)
      #else
      WindowGroup {
          ContentView()
      }
      #endif
    }
}
