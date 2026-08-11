# miniMall-core

Build **native Minima-Core** shop + inbox **APKs** — a fork of [miniMall] retargeted from Maxima MiniDapps
to native Android, on the seed-derived sealed-box comms primitive (the same one the Minima Mail app proved).

Two outputs per shop:
- **Shop APK** — give to customers; browse → cart → checkout → encrypted order + payment.
- **Inbox APK** — the vendor installs it; receives + manages orders (PAID → CONFIRMED → SHIPPED → DELIVERED).

No Maxima, no MDS. Orders ride a shared `MINIMERCH` coin-state address (privacy by encryption); payment is a
separate value send to the vendor address, ref-stamped for matching. Currencies: **Minima** + **mxUSDT**.

## Requirements (builder machine)
- Node 18+
- JDK + Android SDK + the JetBrains Runtime (the studio shells out to `gradlew assembleDebug`).
  Set `JAVA_HOME` (default points at Android Studio's bundled JBR).
- The two native template projects (override paths via env if not siblings of this repo):
  - `MERCH_SHOP_TEMPLATE`  → `../minimaCore/minima-core-android-merchshop`
  - `MERCH_INBOX_TEMPLATE` → `../minimaCore/minima-core-android-merchinbox`

## Workflow
1. **Get your Vendor Card.** Install the generic Inbox APK on your node, let it derive your shop identity from
   the node seed, then **≡ → Vendor Card → Copy** (`0x…publicId…|Mx…address…`).
2. **Run the studio:** `npm run studio` → opens http://localhost:3456.
3. Enter shop name, currency, paste the Vendor Card, add products → **Build**.
4. Download the **Shop** + **Inbox** APKs. Share the Shop with customers; (re)install the branded Inbox.

### CLI
```
node src/index.js build <config.json> [outDir]
```
`config.json`: `{ shopName, currency, vendorPublicId, vendorAddress, products:[{name,description,price,maxUnits}] }`
(see `sample-config.json`). `tokenid` is auto-filled from `currency`.

## How it differs from miniMall
| | miniMall | miniMall-core |
|---|---|---|
| Output | two `.mds.zip` MiniDapps | two native **APKs** |
| Runtime | MDS + Maxima | minimaCore node over IPC, **no Maxima** |
| Encryption | `maxmessage` | seed-derived X25519 sealed box (in-app) |
| Identity | Maxima `mxpublickey` | seed-derived, **forked HKDF path** (no clash with Mail) |

[miniMall]: ../miniMall
