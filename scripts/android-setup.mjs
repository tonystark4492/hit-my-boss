// Patches the Capacitor Android project that the GitHub workflow generates:
//  - landscape only, full-screen (immersive), screen stays on while playing
//  - version number goes up with every build, so a new APK installs over the old one
//  - release signing with YOUR key (from GitHub secrets) so updates are accepted
// Run from the project root after `npx cap add android`.
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const app = 'android/app';
const must = (cond, msg) => { if (!cond) { console.error('android-setup: ' + msg); process.exit(1); } };

// ---- version: build number from GitHub (falls back to 1 locally)
const versionCode = parseInt(process.env.APP_VERSION_CODE || '1', 10);
const [maj, min] = pkg.version.split('.');
const versionName = `${maj}.${min}.${versionCode}`;
let gradle = fs.readFileSync(`${app}/build.gradle`, 'utf8');
must(/versionCode \d+/.test(gradle), 'versionCode not found in build.gradle');
gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`)
               .replace(/versionName "[^"]*"/, `versionName "${versionName}"`);

// ---- signing (only when the workflow decoded a keystore)
const ks = process.env.ANDROID_KEYSTORE_FILE;
if (ks && fs.existsSync(ks)) {
  const signing = `
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "hitmyboss"
            keyPassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
        }
    }
`;
  must(gradle.includes('buildTypes {'), 'buildTypes block not found');
  gradle = gradle.replace(/(\n\s*buildTypes \{)/, signing + '$1');
  gradle = gradle.replace(/(release \{\s*\n\s*minifyEnabled false)/, 'release {\n            signingConfig signingConfigs.release\n            minifyEnabled false');
  must(gradle.includes('signingConfig signingConfigs.release'), 'could not attach signing config');
  console.log('android-setup: release signing enabled');
} else {
  console.log('android-setup: no keystore secret - a debug-signed APK will be built');
}
fs.writeFileSync(`${app}/build.gradle`, gradle);

// ---- manifest: landscape, keep hardware acceleration on
const mPath = `${app}/src/main/AndroidManifest.xml`;
let manifest = fs.readFileSync(mPath, 'utf8');
must(manifest.includes('android:name=".MainActivity"'), 'MainActivity not found in manifest');
if (!manifest.includes('screenOrientation')) {
  manifest = manifest.replace('android:name=".MainActivity"',
    'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"\n            android:hardwareAccelerated="true"');
}
fs.writeFileSync(mPath, manifest);

// ---- MainActivity: immersive full screen + keep screen awake
const pkgPath = cfg.appId.split('.').join('/');
const actPath = `${app}/src/main/java/${pkgPath}/MainActivity.java`;
must(fs.existsSync(actPath), 'MainActivity.java not found at ' + actPath);
fs.writeFileSync(actPath, `package ${cfg.appId};

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
`);

// ---- dark window background instead of white flash
const colors = `${app}/src/main/res/values/colors.xml`;
if (fs.existsSync(colors)) {
  let c = fs.readFileSync(colors, 'utf8');
  c = c.replace(/<color name="colorPrimary">[^<]*</, '<color name="colorPrimary">#16141a<')
       .replace(/<color name="colorPrimaryDark">[^<]*</, '<color name="colorPrimaryDark">#16141a<')
       .replace(/<color name="colorAccent">[^<]*</, '<color name="colorAccent">#ff8a1f<');
  fs.writeFileSync(colors, c);
}

console.log(`android-setup: done (version ${versionName}, code ${versionCode})`);
