# FleetDesk — Android / Play Store Build Guide

Same process as Driver Day Tracker. The `android/` folder loads the live web app
(https://fleet-desk-tau.vercel.app), so no code changes are needed to publish.

## 1. Get the project on your laptop

1. Download **fleetdesk-android.zip** (link from Boss) on your ASUS ZenBook.
2. Extract it — you will get an `android/` folder.
3. Open **Android Studio** → Open → select the `android/` folder.
4. If Gradle complains about the JDK: Settings → Build Tools → Gradle →
   set **Gradle JDK** to *JetBrains Runtime 21* (same fix as last time).

## 2. Build the signed AAB

1. Menu: **Build → Generate Signed App Bundle / APK** → **Android App Bundle** → Next.
2. Key store: click **Create new…**
   - Path: `D:\fleetdesk-key.jks` (NEW file — do NOT reuse the driver-day-tracker key)
   - Alias: `key0`
   - Choose passwords you will remember and **back up the .jks file**
     (every future update needs this exact file + passwords).
3. Build type: **release** → Finish.
4. Find the file: `android/app/release/app-release.aab`.

## 3. Play Console — new app

1. Go to Play Console → **Create app**.
   - App name: **FleetDesk**
   - Default language: English (US) — you can add more later.
   - App or game: App. Free.
2. Upload the AAB under **Release → Production** (or Internal testing first).
3. Complete, one by one:
   - **Store listing**: app name, short + full description, screenshots
     (take fresh ones from the FleetDesk app on your phone), feature graphic,
     app icon (already in the AAB), category: Business.
   - **Content rating** questionnaire.
   - **Data safety**: the app loads your website; declare what the site
     collects (account email, trip/expense data, receipt photos).
   - **App access / declarations** as prompted.
   - **Testing**: follow whatever your account shows (Driver Day Tracker
     needed testers — do the same flow here).
4. **Privacy Policy URL**: host one or reuse the pattern from Driver Day
   Tracker (a `/privacy` page can be added to the web app later if needed).
5. Roll out to production and wait for review.

## Notes

- App ID: `com.fleetdesk.app` — this can never change after first upload.
- The web app updates itself on Vercel — you only rebuild the AAB when the
  *native shell* changes (it won't, normally).
- Your Play Console identity verification from the Driver Day Tracker
  signup covers this app too.
