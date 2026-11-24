#!/bin/sh
# Builds simplechess.apk without Android Studio/Gradle.
# Usage: sh build.sh <android-sdk-dir containing android-15/ (build-tools) and android-35/ (platform)>
# Signing key: release.keystore + keystore.properties next to this script (created on first build; KEEP THEM,
# Android only installs updates signed with the same key; never publish them).
set -e
cd "$(dirname "$0")"
JDK="${JAVA_HOME:-/c/Program Files/Java/jdk-26}"; export PATH="$JDK/bin:$PATH"; export JAVA_HOME="$JDK"
SDK="$1"; BT="$SDK/android-15"; JAR="$SDK/android-35/android.jar"
rm -rf build && mkdir -p build/classes build/dex
if [ ! -f release.keystore ]; then
  PW=$(node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))")
  keytool -genkeypair -keystore release.keystore -alias simplechess -keyalg RSA -keysize 3072 -validity 18250 \
    -storepass "$PW" -keypass "$PW" -dname "CN=Simple Chess"
  echo "password=$PW" > keystore.properties
fi
PW=$(sed -n 's/^password=//p' keystore.properties)
"$BT/aapt2.exe" compile --dir res -o build/res.zip
"$BT/aapt2.exe" link -o build/unsigned.apk -I "$JAR" --manifest AndroidManifest.xml build/res.zip --java build/gen --auto-add-overlay
javac -encoding UTF-8 --release 11 -nowarn -classpath "$JAR" -d build/classes $(find src build/gen -name '*.java')
cmd //c "$BT\d8.bat" --release --min-api 24 --lib "$JAR" --output build/dex $(find build/classes -name '*.class')
python -c "import zipfile; zipfile.ZipFile('build/unsigned.apk', 'a', zipfile.ZIP_DEFLATED).write('build/dex/classes.dex', 'classes.dex')"
"$BT/zipalign.exe" -f -p 4 build/unsigned.apk build/aligned.apk
cmd //c "$BT\apksigner.bat" sign --ks release.keystore --ks-key-alias simplechess --ks-pass "pass:$PW" --key-pass "pass:$PW" --out simplechess.apk build/aligned.apk
cmd //c "$BT\apksigner.bat" verify --print-certs simplechess.apk | head -3
ls -la simplechess.apk
