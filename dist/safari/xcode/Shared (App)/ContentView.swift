import SafariServices
import SwiftUI

enum ExtensionStatus {
    case disabled, enabled, unknown
}

#if os(iOS)
    typealias PlatformImage = UIImage
    typealias Application = UIApplication
#else
    typealias PlatformImage = NSImage
    typealias Application = NSApplication
#endif

struct ContentView: View {
    private let extensionBundleIdentifier = "net.raymondhill.uBlock-Origin-Lite.Extension"

    @State private var status: ExtensionStatus = .unknown
    @State private var error: String?
    @State private var isLoading = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 12) {
                if let icon = Bundle.main.appIcon {
                    #if os(macOS)
                        Image(nsImage: icon)
                            .resizable()
                            .frame(width: 120, height: 120)
                    #else
                        Image(uiImage: icon)
                            .resizable()
                            .scaledToFill()
                            .clipped()
                            .clipShape(
                                RoundedRectangle(cornerRadius: 120 * 0.2237, style: .continuous)
                            )
                            .frame(width: 120, height: 120, alignment: .center)
                    #endif
                }

                Text("uBlock Origin Lite")
                    .font(.title2)
                    .bold()
            }

            VStack(spacing: 8) {
                switch status {
                case .disabled:
                    Text(
                        "uBlock Origin Lite is currently turned off. To enable it, go to **Safari Extensions settings**."
                    )
                case .enabled:
                    Text(
                        "uBlock Origin Lite is active. You can disable it anytime in **Safari Extensions settings**."
                    )
                case .unknown:
                    Text(
                        "Get started by enabling uBlock Origin Lite in **Safari Extensions settings**."
                    )
                }

                if let error {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
            .multilineTextAlignment(.center)

            Spacer()

            #if os(macOS)
                Button("Quit and open Safari Extensions settings...", action: openPreferences)
            #else
                Button {
                    openPreferences()
                } label: {
                    Text("Open Safari Extensions settings")
                        .frame(maxWidth: .infinity)
                        .padding(8)
                        .bold()
                }
                .buttonStyle(.borderedProminent)
            #endif
        }
        .padding([.horizontal, .bottom], 40)
        .onAppear(perform: refreshState)
        .onReceive(
            NotificationCenter.default.publisher(
                for: Application.didBecomeActiveNotification
            )
        ) { _ in
            refreshState()
        }
    }

    private func openPreferences() {
        Task {
            do {
                #if os(iOS)
                    if #available(iOS 26.2, *) {
                        try await SFSafariSettings.openExtensionsSettings(forIdentifiers: [
                            extensionBundleIdentifier
                        ])
                    } else {
                        guard
                            let url = URL(
                                string:
                                    "shortcuts://x-callback-url/run-shortcut?name=DummyNoName&x-error=prefs%3Aroot%3DSAFARI%26path%3DWEB_EXTENSIONS%2F;"
                            )
                        else {
                            return
                        }
                        await UIApplication.shared.open(url)
                    }
                #else
                    try await SFSafariApplication.showPreferencesForExtension(
                        withIdentifier: extensionBundleIdentifier)

                    await MainActor.run {
                        NSApp.terminate(self)
                    }
                #endif
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func refreshState() {
        guard !isLoading else { return }
        isLoading = true
        error = nil

        Task {
            defer { Task { @MainActor in isLoading = false } }

            do {
                #if os(iOS)
                    guard #available(iOS 26.2, *) else {
                        await MainActor.run { status = .unknown }
                        return
                    }
                    let result =
                        try await SFSafariExtensionManager
                        .stateOfExtension(withIdentifier: extensionBundleIdentifier)
                #else
                    let result =
                        try await SFSafariExtensionManager
                        .stateOfSafariExtension(withIdentifier: extensionBundleIdentifier)
                #endif
                await MainActor.run {
                    status = result.isEnabled ? .enabled : .disabled
                }
            } catch {
                await MainActor.run {
                    status = .unknown
                    self.error = error.localizedDescription
                }
            }
        }
    }
}

extension Bundle {
    var appIcon: PlatformImage? {
        #if os(iOS)
            guard
                let icons = infoDictionary?["CFBundleIcons"] as? [String: Any],
                let primary = icons["CFBundlePrimaryIcon"] as? [String: Any],
                let files = primary["CFBundleIconFiles"] as? [String],
                let name = files.last
            else { return nil }
            return UIImage(named: name)
        #else
            return NSApplication.shared.applicationIconImage
        #endif
    }
}

#Preview {
    #if os(macOS)
        ContentView()
            .frame(width: 350, height: 460)
    #else
        ContentView()
    #endif
}
