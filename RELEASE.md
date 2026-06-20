# 출시 가이드 (플레이스토어 정식)

탑아이들 = Capacitor 안드로이드 앱. **번들 모드**로 전환됨(앱이 내장 `www/`를 로드 → 오프라인·캐시·심사 안전).
`capacitor.config.json`에 `server.url` 없음. (라이브URL로 되돌리려면 `_liveUrlBackup` 값을 `server.url`로 복원)

## 1. 릴리스 키스토어 (최초 1회, 절대 분실/유출 금지)
플레이스토어는 앱마다 **동일 키**로 영구 서명해야 함. 분실 시 같은 앱 업데이트 불가.

```bash
keytool -genkey -v -keystore toweridle-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias toweridle
```
생성한 `.jks`는 안전한 곳에 백업(클라우드/오프라인 이중). **레포에 커밋 금지**(.gitignore 처리됨).

루트에 `keystore.properties` 생성(미커밋):
```properties
storeFile=C:/secure/toweridle-release.jks
storePassword=********
keyAlias=toweridle
keyPassword=********
```
→ `android/app/build.gradle`의 `signingConfigs.release`가 이 파일을 읽어 release 빌드를 서명함. (파일 없으면 release 빌드만 실패, debug는 무관)

## 2. 버전 올리기 (업데이트마다)
`android/app/build.gradle`:
- `versionCode` +1 (정수, 매 출시 증가 — 필수)
- `versionName` 표기용(예 "1.0", "1.1")

## 3. 빌드 (※ 실제 빌드는 사용자가 직접/요청 시)
- 디버그 APK(자체배포·테스트): `npm run apk:debug` → `android/app/build/outputs/apk/debug/app-debug.apk`
- 릴리스 APK: `npm run apk:release`
- **플레이스토어용 AAB**: `npm run aab` → `android/app/build/outputs/bundle/release/app-release.aab`

빌드 환경: JAVA_HOME = Android Studio JBR(OpenJDK 21), `android/local.properties`에 `sdk.dir` 필요.

## 4. 플레이 콘솔 등록 체크리스트
- [ ] AAB 업로드(internal testing → production)
- [ ] 앱 아이콘/스크린샷(폰·태블릿)/피처 그래픽
- [ ] 짧은/긴 설명, 카테고리, 콘텐츠 등급 설문
- [ ] **개인정보처리방침 URL**(필수) — 인앱 약관(ui.js TERMS) 기준으로 공개 페이지 마련
- [ ] 데이터 보안 양식(수집: 닉네임·진행도, Supabase 저장 명시)
- [ ] 익명/이메일 로그인 안내

## 5. 권장(출시 품질)
- **CDN 자가호스팅**: `index.html`의 supabase-js·twemoji를 레포에 내장하면 완전 오프라인/사내망에서도 안전(현재는 온라인 기능·이모지 이미지가 CDN 의존). 게임 코어는 번들이라 오프라인에도 실행됨.
- 출시 후 핫픽스는 새 AAB 빌드+심사 필요(라이브URL의 즉시반영은 번들 모드에서 사라짐). 잦은 패치가 필요하면 내부 테스트 트랙 활용.
