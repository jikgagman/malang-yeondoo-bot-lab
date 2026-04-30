import Cocoa
import Foundation
import WebKit

private let localLiveURL = URL(string: "http://127.0.0.1:4173/api/live")!
private let defaultOverlayURL = "https://malang-yeondoo-bot-lab.onrender.com/overlay.html"
private let overlayBaseURL = ProcessInfo.processInfo.environment["OVERLAY_URL"] ?? defaultOverlayURL
private let pollInterval: TimeInterval = 2.0
private let overlaySize = NSSize(width: 210, height: 88)

final class TiltOverlayLauncher: NSObject, NSApplicationDelegate {
  private var panel: NSPanel!
  private var webView: WKWebView!
  private var timer: Timer?
  private var gameIsActive = false
  private var currentSessionId = ""

  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
    createOverlayWindow()
    pollGameflow()
    timer = Timer.scheduledTimer(withTimeInterval: pollInterval, repeats: true) { [weak self] _ in
      self?.pollGameflow()
    }
  }

  private func createOverlayWindow() {
    let frame = overlayFrame()
    panel = NSPanel(
      contentRect: frame,
      styleMask: [.borderless, .nonactivatingPanel],
      backing: .buffered,
      defer: false,
    )
    panel.level = .screenSaver
    panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
    panel.isOpaque = false
    panel.backgroundColor = .clear
    panel.hasShadow = false
    panel.ignoresMouseEvents = false

    let configuration = WKWebViewConfiguration()
    webView = WKWebView(frame: NSRect(origin: .zero, size: overlaySize), configuration: configuration)
    webView.setValue(false, forKey: "drawsBackground")
    webView.wantsLayer = true
    webView.layer?.backgroundColor = NSColor.clear.cgColor
    panel.contentView = webView
  }

  private func overlayFrame() -> NSRect {
    let screenFrame = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
    return NSRect(
      x: screenFrame.minX + 12,
      y: screenFrame.maxY - overlaySize.height - 12,
      width: overlaySize.width,
      height: overlaySize.height,
    )
  }

  private func pollGameflow() {
    URLSession.shared.dataTask(with: localLiveURL) { [weak self] data, _, _ in
      guard
        let self,
        let data,
        let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let phase = json["phase"] as? String
      else {
        DispatchQueue.main.async { self?.hideOverlay() }
        return
      }

      DispatchQueue.main.async {
        if phase == "InProgress" {
          self.showOverlay()
        } else {
          self.hideOverlay()
        }
      }
    }.resume()
  }

  private func showOverlay() {
    if !gameIsActive {
      currentSessionId = "game-\(Int(Date().timeIntervalSince1970 * 1000))"
      loadOverlay(sessionId: currentSessionId)
    }

    gameIsActive = true
    panel.setFrame(overlayFrame(), display: true)
    panel.orderFrontRegardless()
  }

  private func hideOverlay() {
    guard gameIsActive else { return }
    gameIsActive = false
    panel.orderOut(nil)
  }

  private func loadOverlay(sessionId: String) {
    guard var components = URLComponents(string: overlayBaseURL) else { return }
    var items = components.queryItems ?? []
    items.removeAll { $0.name == "sessionId" }
    items.append(URLQueryItem(name: "sessionId", value: sessionId))
    components.queryItems = items

    if let url = components.url {
      webView.load(URLRequest(url: url))
    }
  }
}

let app = NSApplication.shared
let delegate = TiltOverlayLauncher()
app.delegate = delegate
app.run()
