# Requirements Document

## Introduction
本仕様は「Godot Docs MCP Server」の要求を定義する。目的は、`doc/classes/*.xml` に格納された Godot Engine の API ドキュメントをローカルで解析・索引化し、MCP クライアントに対してスタンドアロン（オフライン）で高速な全文検索および正確なシンボル取得を提供することで、開発者のドキュメント探索時間を短縮し生産性を向上させることである。

## Requirements

### Requirement 1: 文書解析とインデクシング
**目的:** 開発者として、ローカルに存在する Godot の XML ドキュメントを失敗なく解析・正規化して索引を構築したい。そうすることで、後続の検索と取得が一貫したデータに対して高速に実行できる。

#### Acceptance Criteria
1. WHEN サーバーが起動し `GODOT_DOC_DIR` に `classes/` が存在する THEN Godot Docs MCP Server SHALL `doc/classes/*.xml` を読み込み、各クラスを型付きオブジェクトに変換する。
2. IF 入力が Godot 4.x スキーマである THEN Godot Docs MCP Server SHALL `methods`/`members`(properties)/`signals`/`constants`/`theme_items`/`annotations` を抽出する。
3. IF 入力が 3.x 系で一部セクションが欠落している THEN Godot Docs MCP Server SHALL 欠落セクションを空配列として扱う。
4. WHERE XML に CDATA もしくは実体参照が含まれる THEN Godot Docs MCP Server SHALL それらを正しく解釈し、コード例とインライン書式を保全する。
5. WHILE インデクシングが実行中 THE Godot Docs MCP Server SHALL ネットワークアクセスを行わず、`GODOT_DOC_DIR` と `.cache/` 以外を読み書きしない。
6. WHEN インデクシングが完了する THEN Godot Docs MCP Server SHALL メモリ内インデックスを構築し、検索で参照可能にする。

### Requirement 2: 検索（`godot.search`）
**目的:** MCP クライアント利用者として、クエリと種類で絞り込める高速な全文検索を使いたい。そうすることで、目的のクラスやシンボルに素早く到達できる。

#### Acceptance Criteria
1. WHEN ツール `godot.search` が `{ query }` で呼び出される THEN Godot Docs MCP Server SHALL スコア降順で結果を返し、各要素に `uri`/`name`/`kind`/`score` を含める。
2. IF パラメータ `kind` が指定される THEN Godot Docs MCP Server SHALL 指定種類（`class|method|property|signal|constant`）のみに結果を限定する。
3. WHEN クエリがクラス名に完全一致する THEN Godot Docs MCP Server SHALL 当該クラスを最上位にランク付けする。
4. WHERE `brief` または `description` が存在する THEN Godot Docs MCP Server SHALL `snippet` を短い抜粋として付与し、可能なら一致語を強調する。
5. IF `limit` が与えられる THEN Godot Docs MCP Server SHALL 返却件数を `limit` 以下に制限する。
6. IF 該当がない THEN Godot Docs MCP Server SHALL 空配列を返却しエラーとしない。

### Requirement 3: 取得 API（`godot.get_class` / `godot.get_symbol` / `godot.list_classes`）
**目的:** 開発者として、クラスおよびシンボルを確実に取得できる API がほしい。そうすることで、検索結果から詳細へと機械的に遷移できる。

#### Acceptance Criteria
1. WHEN `godot.get_class` が `{ name }` で呼び出される THEN Godot Docs MCP Server SHALL 指定クラスの `GodotClassDoc` を返す（欠落セクションは空配列）。
2. IF クラスが存在しない THEN Godot Docs MCP Server SHALL ツールエラー `NOT_FOUND` を返し、最大5件の類似候補を提案する。
3. WHEN `godot.get_symbol` が `{ qname }`（例: `Node._ready`, `Vector2.x`, `Button.pressed`）で呼び出される THEN Godot Docs MCP Server SHALL 種別に応じた `GodotSymbolDoc` を返す。
4. IF シンボルが存在しない THEN Godot Docs MCP Server SHALL ツールエラー `NOT_FOUND` を返し、同クラス内の近似シンボル候補を提案する。
5. WHERE `qname` の形式が不正（`<Class>.<member>` でない） THEN Godot Docs MCP Server SHALL ツールエラー `INVALID_ARGUMENT` を返し、正しい形式例を含むメッセージを返す。
6. WHEN `godot.list_classes` が `{ prefix?, limit? }` で呼び出される THEN Godot Docs MCP Server SHALL プレフィックス一致のクラス名配列を返し、`limit` を上限とする。

### Requirement 4: インデックス永続化とウォームスタート
**目的:** 運用者として、起動時間短縮のためにディスク上のインデックスを活用したい。そうすることで、再起動時のパース負荷を回避できる。

#### Acceptance Criteria
1. WHEN 初回起動でメモリ内インデックスが構築される THEN Godot Docs MCP Server SHALL `.cache/godot-index.json`（または `GODOT_INDEX_PATH`）へ永続化する。
2. WHEN 起動時に永続化ファイルが存在する AND XML 更新が検出されない THEN Godot Docs MCP Server SHALL ディスクからインデックスを読み込み、再パースを省略する。
3. IF 永続化の読み込みに失敗する THEN Godot Docs MCP Server SHALL インデックスを再構築し、正常なファイルで上書きする。
4. IF ファイルウォッチャー機能が有効 THEN Godot Docs MCP Server SHALL 変更検知時にバックグラウンドで再構築し、原子的に差し替える。

### Requirement 5: 設定と実行環境
**目的:** 運用者として、環境変数で動作を制御しつつ、期待どおりのトランスポートとログを選択したい。そうすることで、環境に応じた構成が可能になる。

#### Acceptance Criteria
1. WHEN 環境変数が未設定 THEN Godot Docs MCP Server SHALL 既定値として `GODOT_DOC_DIR=./doc`, `GODOT_INDEX_PATH=./.cache/godot-index.json`, `MCP_SERVER_LOG=info`, `MCP_STDIO=1` を用いる。
2. IF `GODOT_DOC_DIR` が存在しない OR `classes/` を含まない THEN Godot Docs MCP Server SHALL 起動を失敗させ、修正方法のヒントを含む明確なエラーメッセージを出力する。
3. WHERE ランタイムの Node.js が v20 未満 THEN Godot Docs MCP Server SHALL 起動を拒否し、必要バージョンを案内する。
4. IF `MCP_STDIO=1` である THEN Godot Docs MCP Server SHALL stdio トランスポートで MCP を提供する。

### Requirement 6: エラーハンドリングと診断
**目的:** 利用者として、失敗時に原因を素早く特定したい。そうすることで、復旧と改善が容易になる。

#### Acceptance Criteria
1. WHEN XML のパースエラーが発生する THEN Godot Docs MCP Server SHALL ファイル名と可能であれば行・列情報を含むエラーを報告する。
2. WHEN ツール呼び出しの必須パラメータが欠落する THEN Godot Docs MCP Server SHALL `INVALID_ARGUMENT` を返し、欠落キー名を明示する。
3. WHERE 検索や取得で対象が見つからない THEN Godot Docs MCP Server SHALL `NOT_FOUND` を返し、類似候補（最大5件）を併記する。
4. IF 予期しない例外が発生する THEN Godot Docs MCP Server SHALL リクエスト識別子を含む汎用エラーを返し、ログに詳細スタックを記録する。

### Requirement 7: 性能と資源使用
**目的:** 利用者として、体感を損なわない応答速度と控えめな資源使用がほしい。そうすることで、ローカル開発体験が快適になる。

#### Acceptance Criteria
1. IF 入力が典型的な Godot 4.x ドキュメント一式 THEN Godot Docs MCP Server SHALL コールドスタートの解析＋索引構築を ≤ 3 秒で完了する。
2. WHILE インデックスが常駐 THE Godot Docs MCP Server SHALL メモリの追加オーバーヘッドを ≤ 150MB に維持する。
3. WHEN 検索が単語1〜2語で実行される THEN Godot Docs MCP Server SHALL p95 応答時間を ≤ 20ms に維持する。
4. WHEN 検索が複数語（3語以上）で実行される THEN Godot Docs MCP Server SHALL p95 応答時間を ≤ 60ms に維持する。

### Requirement 8: セキュリティとプライバシー
**目的:** 運用者として、ローカル限定で安全に動作してほしい。そうすることで、外部依存や情報漏えいの懸念を排除できる。

#### Acceptance Criteria
1. WHILE 実行中 THE Godot Docs MCP Server SHALL いかなるネットワーク呼び出しも行わない。
2. IF 読み取り要求が `GODOT_DOC_DIR` の外側に解決される THEN Godot Docs MCP Server SHALL 処理を拒否しエラーを返す。
3. WHEN インデックス書き込みを行う THEN Godot Docs MCP Server SHALL 書き込み先を `.cache/` もしくは `GODOT_INDEX_PATH` のみとする。
4. WHERE ドキュメントにコード片が含まれる THEN Godot Docs MCP Server SHALL それらをテキストとして扱い、いかなる実行も行わない。

### Requirement 9: ロギングと可観測性
**目的:** 運用者として、最小限のノイズで状態を把握したい。そうすることで、問題を素早く診断できる。

#### Acceptance Criteria
1. WHEN `MCP_SERVER_LOG` が `silent|error|warn|info|debug` に設定される THEN Godot Docs MCP Server SHALL 対応する詳細度でログを出力する。
2. WHEN 起動に成功する THEN Godot Docs MCP Server SHALL 主要設定（ドキュメント件数、インデックスサイズ概数、使用パス）を `info` レベルで記録する。
3. IF `debug` レベルが有効 THEN Godot Docs MCP Server SHALL トークン化済みクエリと上位 N 件のスコアを記録し、機微情報を含めない。
4. WHILE 実行中 THE Godot Docs MCP Server SHALL 個々のドキュメント本文を不必要にログへ出力しない。

### Requirement 10: リソース URI の一貫性
**目的:** クライアントとして、結果を安定した URI で参照したい。そうすることで、ツール間連携や後続の取得が簡潔になる。

#### Acceptance Criteria
1. WHEN 検索結果を返却する THEN Godot Docs MCP Server SHALL 各要素に `godot://class/<ClassName>` または `godot://symbol/<ClassName>/<kind>/<name>` の形式で `uri` を付与する。
2. WHERE 検索クエリを表現する必要がある THEN Godot Docs MCP Server SHALL `godot://search?q=<q>&kind=<kind>` の形式を用いる。

