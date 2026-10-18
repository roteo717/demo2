工場在庫管理 PWA（Node.js 起動用）

【起動】
  1. Node.js 16 以上をインストール
  2. このフォルダでコマンドを実行:  node server.js
  3. ブラウザで http://localhost:3000/ を開く
  ※ ポート変更: PORT=8080 node server.js （Windows PowerShell: $env:PORT=8080; node server.js）

【構成】
  server.js            静的ファイル配信サーバー（外部パッケージ不要）
  public/index.html    アプリ本体（元HTMLにPWA用タグ12行を追加しただけ）
  public/manifest.json PWA設定
  public/sw.js         Service Worker
  public/icons/        inventory-icon-192.png / inventory-icon-512.png

【注意】
  ・iPhone/Androidで「インストール」するにはHTTPS公開が必要です（localhostのみ例外）。
  ・データはブラウザのlocalStorageに保存されます（アドレス/ポートごとに別領域）。
  ・sw.js を更新したら CACHE_VERSION を変更してください。
