# Capacitor is a future option; no native app work in MVP

The Vue app should be structured so that it can be wrapped in Capacitor later for native iOS/Android distribution if demand justifies it. This means avoiding browser APIs that Capacitor does not support, keeping Firebase config env-based, and not building features that assume the browser address bar. However, no Capacitor integration, App Store submission, Apple Developer Program setup, or native plugin work is part of the MVP. The private rebuild is a web app only.

The reason this is recorded: "make it an app" is a recurring instinct and a natural ask from future contributors. This decision says the answer is "yes, eventually, via Capacitor if warranted" — but the Vue web version must reach feature parity and be stable first. Don't let Capacitor complexity block the private launch.
