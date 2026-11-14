
const startButton = document.getElementById("start-button");

startButton.addEventListener("click", function () {
    const playerA = document.getElementById("player-a").value.trim();
    const playerB = document.getElementById("player-b").value.trim();

    if (playerA === "" || playerB === "") {
        alert("2人の選手名を入力してください。");
        return;
    }

    // 新しい試合データを作成
    currentMatch = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString("sv-SE"),
        players: [playerA, playerB],
        points: []
    };

    // 保存する試合一覧に追加
    matchData.matches.push(currentMatch);

    // 現在の試合IDを更新
    matchData.currentMatchId = currentMatch.id;

    // ポイント記録を初期化
    points = currentMatch.points;

    // 全試合を保存
    saveMatch();
    updateScore();

    document.getElementById("pair-name").textContent =
        playerA + "・" + playerB;

    document.getElementById("setup-screen").hidden = true;
    document.getElementById("record-screen").hidden = false;
});


// 記録したポイントを保存する配列
const STORAGE_KEY = "softtennis-matches-v2";

// 保存済みの全試合を読み込む
const savedData = localStorage.getItem(STORAGE_KEY);

let matchData = savedData
    ? JSON.parse(savedData)
    : {
        matches: [],
        currentMatchId: null
    };

// 現在操作している試合
let currentMatch = matchData.matches.find(
    match => match.id === matchData.currentMatchId
) || null;

// 既存のスコア計算・分析で使う配列
let points = currentMatch ? currentMatch.points : [];


// 自ペアが得点したとき
document.getElementById("own-point-button")
    .addEventListener("click", function () {
        addPoint("own");
    });

// 相手ペアが得点したとき
document.getElementById("opponent-point-button")
    .addEventListener("click", function () {
        addPoint("opponent");
    });

// 1ポイント取り消す
document.getElementById("undo-button")
    .addEventListener("click", function () {
        if (points.length === 0) {
            return;
        }

        points.pop();
        updateScore();
        saveMatch();
    });


// ポイントを追加する関数
function addPoint(winner) {
    const server = document.getElementById("server").value;
    const firstServe = document.getElementById("first-serve").value;

    let secondServe = null;

    if (firstServe === "out") {
        secondServe = document.getElementById("second-serve").value;
    }

    // ダブルフォルト時の得点側を確認
    if (firstServe === "out" && secondServe === "out") {
        const expectedWinner =
            server === "opponent" ? "own" : "opponent";

        if (winner !== expectedWinner) {
            alert("ダブルフォルトの場合、レシーバー側の得点になります。");
            return;
        }
    }

    // ポイント詳細を取得
    const recordDetail =
        document.getElementById("record-error").checked;

    let errorPlayer = null;
    let shot = null;
    let hand = null;
    let errorType = null;

    if (recordDetail) {
        errorPlayer = document.getElementById("error-player").value;
        shot = document.getElementById("shot").value;

        hand = shot === "smash"
            ? null
            : document.getElementById("hand").value;

        errorType = document.getElementById("error-type").value;

        // エースは自ペア得点のみ
        if (errorType === "ace" && winner !== "own") {
            alert("自ペアのエースは、自ペア得点として記録してください。");
            return;
        }

        // ミスは相手ペア得点のみ
        if (errorType !== "ace" && winner !== "opponent") {
            alert("自ペアのミスは、相手ペア得点として記録してください。");
            return;
        }

        // ダブルフォルトとショット詳細の重複を防ぐ
        if (firstServe === "out" && secondServe === "out") {
            alert("ダブルフォルトの場合は、ポイント詳細をオフにしてください。");
            return;
        }
    }

    const point = {
        winner: winner,
        server: server,
        firstServe: firstServe,
        secondServe: secondServe,
        errorPlayer: errorPlayer,
        shot: shot,
        hand: hand,
        errorType: errorType
    };

    points.push(point);
    updateScore();
    saveMatch();

    // サーブ入力欄を初期化
    document.getElementById("first-serve").value = "unknown";
    document.getElementById("second-serve").value = "unknown";
    document.getElementById("second-serve-area").hidden = true;

    // ボタンの選択状態も更新
    updateFirstServeButtons();
    updateSecondServeButtons();

    // ポイント詳細欄を初期化
    document.getElementById("record-error").checked = false;
    document.getElementById("error-details").hidden = true;
}

// スコアを更新する関数
function updateScore() {
    let ownScore = 0;
    let opponentScore = 0;

    let ownGames = 0;
    let opponentGames = 0;

    // 記録したポイントを最初から順番に確認
    for (const point of points) {

        // ポイントを加算
        if (point.winner === "own") {
            ownScore++;
        } else {
            opponentScore++;
        }

        // ゲーム終了条件を確認
        const gameFinished =
            (ownScore >= 4 || opponentScore >= 4) &&
            Math.abs(ownScore - opponentScore) >= 2;

        if (gameFinished) {

            // ゲーム獲得数を加算
            if (ownScore > opponentScore) {
                ownGames++;
            } else {
                opponentGames++;
            }

            // 次のゲームに進む
            ownScore = 0;
            opponentScore = 0;
        }
    }

    // 画面にスコアを表示
    document.getElementById("own-score").textContent = ownScore;
    document.getElementById("opponent-score").textContent = opponentScore;

    document.getElementById("own-games").textContent = ownGames;
    document.getElementById("opponent-games").textContent = opponentGames;

    document.getElementById("game-number").textContent =
        "第" + (ownGames + opponentGames + 1) + "ゲーム";
}

// 1stサーブの選択に応じて2ndサーブ欄を表示
document.getElementById("first-serve")
    .addEventListener("change", function () {
        const firstServe = this.value;

        document.getElementById("second-serve-area").hidden =
            firstServe !== "out";
    });

// 詳細記録欄の表示・非表示
document.getElementById("record-error")
    .addEventListener("change", function () {
        document.getElementById("error-details").hidden =
            !this.checked;
    });

// スマッシュの場合はフォア・バック欄を隠す
document.getElementById("shot")
    .addEventListener("change", function () {
        document.getElementById("hand-area").hidden =
            this.value === "smash";
    });

// 分析画面を表示する
document.getElementById("analysis-button")
    .addEventListener("click", function () {
        analysisSource = "record";
        analyzeMatch();

        document.getElementById("record-screen").hidden = true;
        document.getElementById("analysis-screen").hidden = false;
    });

// 記録画面に戻る
document.getElementById("back-button")
    .addEventListener("click", function () {

        document.getElementById("analysis-screen").hidden = true;

        if (analysisSource === "list") {
            // 試合一覧から来た場合
            showMatchList();
            document.getElementById("match-list-screen").hidden = false;
        } else {
            // 記録画面から来た場合
            document.getElementById("record-screen").hidden = false;
        }
    });

// 試合データを分析する
function analyzeMatch() {
    const stats = {
        A: {
            firstIn: 0,
            firstTotal: 0,
            secondIn: 0,
            secondTotal: 0,
            errors: 0,
            aces: 0
        },
        B: {
            firstIn: 0,
            firstTotal: 0,
            secondIn: 0,
            secondTotal: 0,
            errors: 0,
            aces: 0
        }
    };

    const errorTypes = {
        net: 0,
        side: 0,
        back: 0
    };

    // 記録したポイントを順番に分析
    for (const point of points) {

        // 自ペアのサーブのみ集計
        if (point.server === "A" || point.server === "B") {
            const playerStats = stats[point.server];

            if (point.firstServe === "in") {
                playerStats.firstIn++;
                playerStats.firstTotal++;
            } else if (point.firstServe === "out") {
                playerStats.firstTotal++;
            }

            if (point.secondServe === "in") {
                playerStats.secondIn++;
                playerStats.secondTotal++;
            } else if (point.secondServe === "out") {
                playerStats.secondTotal++;
            }
        }

        // ポイント詳細を集計
        if (point.errorPlayer === "A" ||
            point.errorPlayer === "B") {

            if (point.errorType === "ace") {
                // エースとして集計
                stats[point.errorPlayer].aces++;

            } else if (["net", "side", "back"].includes(point.errorType)) {
                // ミスとして集計
                stats[point.errorPlayer].errors++;
                errorTypes[point.errorType]++;
            }
        }

    }

    // 成功率を計算する関数
    function rate(success, total) {
        if (total === 0) {
            return "データなし";
        }

        return (success / total * 100).toFixed(1) + "%";
    }

    // サーブ成功率を表示
    let serveHTML = "";

    for (const player of ["A", "B"]) {
        const s = stats[player];

        serveHTML += `
            <p>
                選手${player}<br>
                1st成功率：${rate(s.firstIn, s.firstTotal)}
                （${s.firstIn}/${s.firstTotal}）<br>
                2nd成功率：${rate(s.secondIn, s.secondTotal)}
                （${s.secondIn}/${s.secondTotal}）
            </p>
        `;
    }

    document.getElementById("serve-analysis").innerHTML = serveHTML;


    // 選手別エース数・ミス数を表示
    document.getElementById("error-analysis").innerHTML = `
        <p>選手A：エース ${stats.A.aces}回 / ミス ${stats.A.errors}回</p>
        <p>選手B：エース ${stats.B.aces}回 / ミス ${stats.B.errors}回</p>
    `;


    // ミスの種類別集計を表示
    document.getElementById("error-type-analysis").innerHTML = `
        <p>ネット：${errorTypes.net}回</p>
        <p>サイドアウト：${errorTypes.side}回</p>
        <p>バックアウト：${errorTypes.back}回</p>
    `;

    // 選手別ミス数の棒グラフ
    const maxErrors = Math.max(
        stats.A.errors,
        stats.B.errors,
        1
    );

    let chartHTML = "";

    for (const player of ["A", "B"]) {
        const count = stats[player].errors;

        // 最もミスが多い選手を100%として棒の長さを計算
        const width = count / maxErrors * 100;

        chartHTML += `
             <div class="chart-row">
                 <div class="chart-label">
                     <span>選手${player}</span>
                     <span>${count}回</span>
                 </div>

                 <div class="chart-track">
                     <div class="chart-bar"
                         style="width: ${width}%">
                     </div>
                 </div>
             </div>
       `;
    }

    document.getElementById("error-chart").innerHTML = chartHTML;
}

function saveMatch() {
    if (!currentMatch) {
        return;
    }

    // 現在の試合のポイントを更新
    currentMatch.points = points;

    // 全試合をまとめて保存
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matchData)
    );
}

document.getElementById("new-match-button")
    .addEventListener("click", function () {

        const confirmed = confirm(
            "現在の試合データを削除して、新しい試合を始めますか？"
        );

        if (!confirmed) {
            return;
        }


        // 現在の試合だけを解除する
        matchData.currentMatchId = null;
        currentMatch = null;
        points = [];

        // 過去の試合データは消さずに保存
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(matchData)
        );

        document.getElementById("player-a").value = "";
        document.getElementById("player-b").value = "";

        document.getElementById("record-screen").hidden = true;
        document.getElementById("setup-screen").hidden = false;
    });

// 試合終了ボタン
document.getElementById("finish-button")
    .addEventListener("click", function () {

        const confirmed = confirm(
            "試合を終了して保存しますか？"
        );

        if (!confirmed) return;

        // 試合データは残したまま、記録中の状態を解除
        if (currentMatch) {
            currentMatch.points = points;
        }

        matchData.currentMatchId = null;
        currentMatch = null;
        points = [];

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(matchData)
        );

        showHomeScreen();
    });

// 保存済みの試合一覧を表示する
function showMatchList() {
    const list = document.getElementById("match-list");

    // 前回の表示を消す
    list.innerHTML = "";

    if (matchData.matches.length === 0) {
        list.textContent = "保存された試合はありません。";
        return;
    }

    // 新しい試合から表示
    const matches = [...matchData.matches].reverse();

    for (const match of matches) {
        const item = document.createElement("div");
        item.className = "match-item";

        const title = document.createElement("p");
        title.textContent =
            match.players[0] + "・" + match.players[1];

        const info = document.createElement("p");
        info.textContent =
            match.date + " / " +
            match.points.length + "ポイント記録";

        const button = document.createElement("button");
        button.textContent = "分析を見る";

        button.addEventListener("click", function () {
            openMatchAnalysis(match.id);
        });


        const editButton = document.createElement("button");
        editButton.textContent = "編集";

        editButton.addEventListener("click", function () {
            editMatch(match.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "削除";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function () {
            deleteMatch(match.id);
        });

        // ポイント履歴ボタンを作成
        const historyButton = document.createElement("button");
        historyButton.textContent = "ポイント履歴";

        historyButton.addEventListener("click", function () {
            openPointHistory(match.id);
        });

        // 作成したボタンを画面に追加
        item.appendChild(title);
        item.appendChild(info);
        item.appendChild(button);
        item.appendChild(historyButton);
        item.appendChild(editButton);
        item.appendChild(deleteButton);

        list.appendChild(item);
    }
}

// 選択した試合の分析結果を表示する
function openMatchAnalysis(matchId) {
    const match = matchData.matches.find(
        m => m.id === matchId
    );

    if (!match) {
        alert("試合データが見つかりません。");
        return;
    }

    // 元の試合を記憶しておく
    const previousMatch = currentMatch;
    const previousPoints = points;

    // 分析対象を一時的に切り替える
    currentMatch = match;
    points = match.points;
    analysisSource = "list";
    analyzeMatch();

    // 元の試合に戻す
    currentMatch = previousMatch;
    points = previousPoints;

    // 画面を切り替える
    document.getElementById("match-list-screen").hidden = true;
    document.getElementById("record-screen").hidden = true;
    document.getElementById("analysis-screen").hidden = false;
}

// 試合一覧を開く
document.getElementById("match-list-button")
    .addEventListener("click", function () {

        showMatchList();

        document.getElementById("record-screen").hidden = true;
        document.getElementById("match-list-screen").hidden = false;
    });

// 試合一覧から記録画面に戻る
document.getElementById("list-back-button")
    .addEventListener("click", function () {

        document.getElementById("match-list-screen").hidden = true;
        document.getElementById("record-screen").hidden = false;
    });

let analysisSource = "record";

// 保存済みの全試合から選手名を取得
function getAllPlayers() {
    const players = new Set();

    for (const match of matchData.matches) {
        for (const player of match.players) {
            players.add(player);
        }
    }

    return [...players].sort();
}

// 成長分析画面を開く
function showGrowthScreen() {
    const select = document.getElementById("growth-player");

    select.innerHTML = "";

    const players = getAllPlayers();

    for (const player of players) {
        const option = document.createElement("option");
        option.value = player;
        option.textContent = player;
        select.appendChild(option);
    }

    document.getElementById("record-screen").hidden = true;
    document.getElementById("growth-screen").hidden = false;

    if (players.length > 0) {
        analyzeGrowth(players[0]);
    } else {
        document.getElementById("growth-results").textContent =
            "まだ試合データがありません。";
    }
}

// 選手ごとの試合成績を集計する
function analyzeGrowth(playerName) {
    const results = document.getElementById("growth-results");
    results.innerHTML = "";

    const chartData = [];
    const table = document.createElement("table");
    table.className = "growth-table";

    const header = document.createElement("tr");

    for (const title of [
        "試合日・ペア",
        "1st成功率",
        "2nd成功率",
        "エース数",
        "ミス数"
    ]) {
        const th = document.createElement("th");
        th.textContent = title;
        header.appendChild(th);
    }

    table.appendChild(header);

    // 試合を日付順に並べる
    const matches = [...matchData.matches].sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    for (const match of matches) {
        // 選択した選手が出場していない試合は除外
        const playerIndex = match.players.indexOf(playerName);

        if (playerIndex === -1) {
            continue;
        }

        // その試合でのA/Bを判定
        const playerKey = playerIndex === 0 ? "A" : "B";

        let firstIn = 0;
        let firstTotal = 0;
        let secondIn = 0;
        let secondTotal = 0;
        let aces = 0;
        let errors = 0;

        for (const point of match.points) {
            // 選択選手がサーバーの場合
            if (point.server === playerKey) {
                if (point.firstServe === "in") {
                    firstIn++;
                    firstTotal++;
                } else if (point.firstServe === "out") {
                    firstTotal++;
                }

                if (point.secondServe === "in") {
                    secondIn++;
                    secondTotal++;
                } else if (point.secondServe === "out") {
                    secondTotal++;
                }
            }


            // 選択選手のエース・ミスを集計
            if (point.errorPlayer === playerKey) {
                if (point.errorType === "ace") {
                    aces++;
                } else if (["net", "side", "back"].includes(point.errorType)) {
                    errors++;
                }
            }

            const rate = (success, total) =>
                total === 0
                    ? "データなし"
                    : (success / total * 100).toFixed(1) + "%";

            const row = document.createElement("tr");

            const values = [
                match.date + " " + match.players.join("・"),
                rate(firstIn, firstTotal),
                rate(secondIn, secondTotal),
                aces + "回",
                errors + "回"
            ];

            for (const value of values) {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            }

            table.appendChild(row);

            // グラフ用に試合ごとのデータを保存
            chartData.push({
                date: match.date,
                firstRate: firstTotal === 0
                    ? null
                    : firstIn / firstTotal * 100
            });
        }

        results.appendChild(table);
        drawGrowthChart(chartData);
    }
}

// 成長分析画面を開く
document.getElementById("growth-button")
    .addEventListener("click", showGrowthScreen);

// 選手を変更したら分析結果を更新
document.getElementById("growth-player")
    .addEventListener("change", function () {
        analyzeGrowth(this.value);
    });

// 記録画面に戻る
document.getElementById("growth-back-button")
    .addEventListener("click", function () {
        document.getElementById("growth-screen").hidden = true;
        document.getElementById("record-screen").hidden = false;
    });


function drawGrowthChart(data) {
    const container = document.getElementById("growth-chart");
    container.innerHTML = "";

    // サーブの記録がある試合だけを使用
    const validData = data.filter(item => item.firstRate !== null);

    if (validData.length === 0) {
        container.textContent = "サーブの記録がありません。";
        return;
    }

    const width = 500;
    const height = 260;

    const left = 45;
    const right = 20;
    const top = 20;
    const bottom = 45;

    const graphWidth = width - left - right;
    const graphHeight = height - top - bottom;

    // 成功率0〜100%をグラフ内のY座標に変換
    function getY(rate) {
        return top + graphHeight * (1 - rate / 100);
    }

    // 試合番号をX座標に変換
    function getX(index) {
        if (validData.length === 1) {
            return left + graphWidth / 2;
        }

        return left + graphWidth * index / (validData.length - 1);
    }

    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "試合ごとの1stサーブ成功率の推移");

    // 横の目盛り線
    for (const rate of [0, 25, 50, 75, 100]) {
        const y = getY(rate);

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", left);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - right);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "#dddddd");
        svg.appendChild(line);

        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", left - 8);
        label.setAttribute("y", y + 4);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("font-size", "12");
        label.textContent = rate + "%";
        svg.appendChild(label);
    }

    // データを結ぶ折れ線
    const polyline = document.createElementNS(svgNS, "polyline");

    const positions = validData.map((item, index) => {
        return `${getX(index)},${getY(item.firstRate)}`;
    });

    polyline.setAttribute("points", positions.join(" "));
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#2176ae");
    polyline.setAttribute("stroke-width", "3");

    svg.appendChild(polyline);

    // 各試合の点とラベル
    validData.forEach((item, index) => {
        const x = getX(index);
        const y = getY(item.firstRate);

        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "#2176ae");
        svg.appendChild(circle);

        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", x);
        label.setAttribute("y", height - 15);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "12");
        label.textContent = "試合" + (index + 1);
        svg.appendChild(label);
    });

    container.appendChild(svg);
}

// 過去の試合情報を編集する
function editMatch(matchId) {
    const match = matchData.matches.find(
        m => m.id === matchId
    );

    if (!match) {
        alert("試合が見つかりません。");
        return;
    }

    const newDate = prompt("試合日を入力してください", match.date);
    if (newDate === null) return;

    const newPlayerA = prompt("選手Aの名前", match.players[0]);
    if (newPlayerA === null) return;

    const newPlayerB = prompt("選手Bの名前", match.players[1]);
    if (newPlayerB === null) return;

    // 入力チェック
    if (
        newDate.trim() === "" ||
        newPlayerA.trim() === "" ||
        newPlayerB.trim() === ""
    ) {
        alert("空欄にはできません。");
        return;
    }

    if (newPlayerA.trim() === newPlayerB.trim()) {
        alert("同じ選手名を2人に設定することはできません。");
        return;
    }

    // 試合情報を更新
    match.date = newDate.trim();
    match.players = [
        newPlayerA.trim(),
        newPlayerB.trim()
    ];

    // 全試合を保存
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matchData)
    );

    // 現在記録中の試合を編集した場合も表示を更新
    if (currentMatch && currentMatch.id === matchId) {
        document.getElementById("player-a").value = match.players[0];
        document.getElementById("player-b").value = match.players[1];

        document.getElementById("pair-name").textContent =
            match.players.join("・");
    }

    showMatchList();
}


// 保存済みの試合を削除する
function deleteMatch(matchId) {
    const match = matchData.matches.find(
        m => m.id === matchId
    );

    if (!match) {
        alert("試合が見つかりません。");
        return;
    }

    const confirmed = confirm(
        match.players.join("・") +
        " の試合を削除しますか？\n" +
        "削除したデータは元に戻せません。"
    );

    if (!confirmed) return;

    // 指定した試合だけを削除
    matchData.matches = matchData.matches.filter(
        m => m.id !== matchId
    );

    // 現在の試合を削除した場合
    if (currentMatch && currentMatch.id === matchId) {
        currentMatch = null;
        points = [];
        matchData.currentMatchId = null;

        document.getElementById("player-a").value = "";
        document.getElementById("player-b").value = "";

        document.getElementById("record-screen").hidden = true;
        document.getElementById("setup-screen").hidden = false;
    }

    // 保存データを更新
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matchData)
    );

    showMatchList();
}

let historyMatchId = null;

function openPointHistory(matchId) {
    const match = matchData.matches.find(m => m.id === matchId);

    if (!match) {
        alert("試合が見つかりません。");
        return;
    }

    historyMatchId = matchId;

    document.getElementById("match-list-screen").hidden = true;
    document.getElementById("point-history-screen").hidden = false;

    showPointHistory();
}


function showPointHistory() {
    const match = matchData.matches.find(
        m => m.id === historyMatchId
    );

    if (!match) return;

    const list = document.getElementById("point-history-list");
    list.innerHTML = "";

    document.getElementById("history-match-name").textContent =
        match.date + " " + match.players.join("・");

    if (match.points.length === 0) {
        list.textContent = "まだポイント記録がありません。";
        return;
    }

    match.points.forEach((point, index) => {
        const item = document.createElement("div");
        item.className = "point-history-item";

        const title = document.createElement("h3");
        title.textContent = (index + 1) + "ポイント目";

        const info = document.createElement("p");

        const winnerText =
            point.winner === "own" ? "自分たち" : "相手";

        const playerName = point.errorPlayer === "A"
            ? match.players[0]
            : point.errorPlayer === "B"
                ? match.players[1]
                : "なし";

        const shotNames = {
            receive: "レシーブ",
            stroke: "ストローク",
            volley: "ボレー",
            smash: "スマッシュ"
        };

        const handNames = {
            fore: "フォア",
            back: "バック"
        };

        const resultNames = {
            net: "ネットミス",
            side: "サイドアウト",
            back: "バックアウト",
            ace: "エース"
        };

        const serveNames = {
            in: "IN",
            out: "FAULT",
            unknown: "不明"
        };

        const details = [
            "得点：" + winnerText,
            "サーバー：" + (
                point.server === "A" ? match.players[0] :
                point.server === "B" ? match.players[1] : "相手"
            ),
            "1st：" +
                (serveNames[point.firstServe] || "不明"),
            "2nd：" +
                (point.secondServe === null
                    ? "記録なし"
                    : (serveNames[point.secondServe] || "不明"))
        ];

        if (point.errorPlayer) {
            details.push("プレーした選手：" + playerName);

            details.push(
                "ショット：" +
                (shotNames[point.shot] || "不明")
            );

            if (point.shot !== "smash") {
                details.push(
                    "打球：" +
                    (handNames[point.hand] || "不明")
                );
            }

            details.push(
                "ポイントの結果：" +
                (resultNames[point.errorType] || "不明")
            );
        } else {
            details.push("ポイント詳細：記録なし");
        }

        info.textContent = details.join(" / ");

        const editButton = document.createElement("button");
        editButton.textContent = "編集";

        editButton.addEventListener("click", function () {
            editPoint(index);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "削除";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function () {
            deletePoint(index);
        });

        item.appendChild(title);
        item.appendChild(info);
        item.appendChild(editButton);
        item.appendChild(deleteButton);

        list.appendChild(item);
    });
}



let editingPointIndex = null;

// ポイント編集画面を開く
function editPoint(index) {
    const match = matchData.matches.find(
        m => m.id === historyMatchId
    );

    if (!match || !match.points[index]) return;

    const point = match.points[index];

    editingPointIndex = index;

    document.getElementById("point-edit-title").textContent =
        match.players.join("・") +
        " / " + (index + 1) + "ポイント目";

    document.getElementById("edit-winner").value =
        point.winner;

    document.getElementById("edit-server").value =
        point.server;

    document.getElementById("edit-first-serve").value =
        point.firstServe || "unknown";

    document.getElementById("edit-second-serve").value =
        point.secondServe || "unknown";

    document.getElementById("edit-error-player").value =
        point.errorPlayer || "";

    document.getElementById("edit-shot").value =
        point.shot || "";

    document.getElementById("edit-hand").value =
        point.hand || "";

    document.getElementById("edit-error-type").value =
        point.errorType || "";

    updatePointEditFields();

    document.getElementById("point-history-screen").hidden = true;
    document.getElementById("point-edit-screen").hidden = false;
}


function deletePoint(index) {
    const match = matchData.matches.find(
        m => m.id === historyMatchId
    );

    if (!match || !match.points[index]) return;

    const confirmed = confirm(
        (index + 1) + "ポイント目を削除しますか？"
    );

    if (!confirmed) return;

    match.points.splice(index, 1);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(matchData)
    );

    if (currentMatch && currentMatch.id === match.id) {
        points = currentMatch.points;
        updateScore();
    }

    showPointHistory();
}

document.getElementById("history-back-button")
    .addEventListener("click", function () {
        document.getElementById("point-history-screen").hidden = true;
        document.getElementById("match-list-screen").hidden = false;

        showMatchList();
    });

function updatePointEditFields() {
    const server = document.getElementById("edit-server").value;
    const firstServe = document.getElementById("edit-first-serve").value;
    const errorPlayer = document.getElementById("edit-error-player").value;
    const shot = document.getElementById("edit-shot").value;

    // 2ndサーブは自分たちの1stがOUTのときだけ表示
    const showSecond =
        server !== "opponent" && firstServe === "out";

    document.getElementById("edit-second-serve-area").hidden =
        !showSecond;

    // 得点側に関係なくポイント詳細を表示
    document.getElementById("edit-error-area").hidden = false;

    // 選手を選択した場合に詳細を表示
    document.getElementById("edit-error-details").hidden =
        errorPlayer === "";

    // スマッシュ以外はフォア・バックを表示
    document.getElementById("edit-hand-area").hidden =
        errorPlayer === "" || shot === "smash";
}

// 選択を変更したら表示を更新
for (const id of [
    "edit-winner",
    "edit-server",
    "edit-first-serve",
    "edit-error-player",
    "edit-shot"
]) {
    document.getElementById(id).addEventListener(
        "change",
        updatePointEditFields
    );
}

document.getElementById("save-point-edit-button")
    .addEventListener("click", function () {

        const match = matchData.matches.find(
            m => m.id === historyMatchId
        );

        if (!match || editingPointIndex === null) return;

        const point = match.points[editingPointIndex];
        if (!point) return;

        const winner = document.getElementById("edit-winner").value;
        const server = document.getElementById("edit-server").value;
        const firstServe = document.getElementById("edit-first-serve").value;
        const secondServe = document.getElementById("edit-second-serve").value;
        const errorPlayer = document.getElementById("edit-error-player").value;
        const shot = document.getElementById("edit-shot").value;
        const hand = document.getElementById("edit-hand").value;
        const errorType = document.getElementById("edit-error-type").value;

        // 2ndサーブは必要な場合だけ保存
        const needsSecond =
            server !== "opponent" && firstServe === "out";

        // サーブ記録の整合性チェック
        if (
            server !== "opponent" &&
            firstServe === "out" &&
            secondServe === "out" &&
            winner !== "opponent"
        ) {
            alert("ダブルフォルトの場合は相手の得点になります。");
            return;
        }

        point.winner = winner;
        point.server = server;
        point.firstServe =
            server === "opponent" ? "unknown" : firstServe;
        point.secondServe =
            needsSecond ? secondServe : "unknown";


        // ポイント詳細と得点側の整合性を確認
        if (errorPlayer !== "") {

            if (errorType === "") {
                alert("ポイントの結果を選択してください。");
                return;
            }

            if (errorType === "ace" && winner !== "own") {
                alert("自ペアのエースは、自ペア得点として記録してください。");
                return;
            }

            if (
                ["net", "side", "back"].includes(errorType) &&
                winner !== "opponent"
            ) {
                alert("自ペアのミスは、相手ペア得点として記録してください。");
                return;
            }

            if (firstServe === "out" && secondServe === "out") {
                alert("ダブルフォルトの場合は、ポイント詳細を記録しないでください。");
                return;
            }
        }

        // ポイント詳細を保存
        if (errorPlayer !== "") {
            point.errorPlayer = errorPlayer;
            point.shot = shot || null;
            point.hand = shot === "smash" ? null : (hand || null);
            point.errorType = errorType;
        } else {
            point.errorPlayer = null;
            point.shot = null;
            point.hand = null;
            point.errorType = null;
        }


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(matchData)
        );

        if (currentMatch && currentMatch.id === match.id) {
            points = currentMatch.points;
            updateScore();
        }

        editingPointIndex = null;

        document.getElementById("point-edit-screen").hidden = true;
        document.getElementById("point-history-screen").hidden = false;

        showPointHistory();
    });

document.getElementById("cancel-point-edit-button")
    .addEventListener("click", function () {

        editingPointIndex = null;

        document.getElementById("point-edit-screen").hidden = true;
        document.getElementById("point-history-screen").hidden = false;
    });


document.getElementById("backup-button")
    .addEventListener("click", function () {
        document.getElementById("record-screen").hidden = true;
        document.getElementById("backup-screen").hidden = false;
    });

document.getElementById("backup-back-button")
    .addEventListener("click", function () {
        document.getElementById("backup-screen").hidden = true;
        document.getElementById("record-screen").hidden = false;
    });


document.getElementById("export-button")
    .addEventListener("click", function () {

        // 現在の全試合データをJSONに変換
        const json = JSON.stringify(matchData, null, 2);

        // ファイルを作成
        const blob = new Blob(
            [json],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        // 日付付きのファイル名
        const date = new Date().toLocaleDateString("sv-SE");
        link.download = "softtennis-backup-" + date + ".json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });


document.getElementById("import-button")
    .addEventListener("click", async function () {

        const fileInput = document.getElementById("import-file");
        const file = fileInput.files[0];

        if (!file) {
            alert("復元するJSONファイルを選択してください。");
            return;
        }

        try {
            const text = await file.text();
            const importedData = JSON.parse(text);

            // ファイルの基本構造を確認
            if (
                !importedData ||
                !Array.isArray(importedData.matches) ||
                !importedData.matches.every(match =>
                    match &&
                    typeof match.id === "string" &&
                    typeof match.date === "string" &&
                    Array.isArray(match.players) &&
                    match.players.length === 2 &&
                    match.players.every(p => typeof p === "string") &&
                    Array.isArray(match.points)
                )
            ) {
                alert("正しいバックアップファイルではありません。");
                return;
            }

            const confirmed = confirm(
                "現在の全試合データを、" +
                "バックアップの内容で置き換えます。\n" +
                "続行しますか？"
            );

            if (!confirmed) return;

            // 復元したデータを保存
            matchData = {
                matches: importedData.matches,
                currentMatchId: null
            };

            currentMatch = null;
            points = [];

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(matchData)
            );

            alert("復元が完了しました。画面を再読み込みします。");

            location.reload();

        } catch (error) {
            console.error(error);
            alert("ファイルを読み込めませんでした。");
        }
    });


/* ===== ホーム画面 ===== */

// 画面を切り替える共通関数
function showScreen(screenId) {
    document.querySelectorAll("body > section").forEach(section => {
        section.hidden = true;
    });

    document.getElementById(screenId).hidden = false;
}

// ホーム画面を表示する
function showHomeScreen() {
    showScreen("home-screen");

    // 記録途中の試合がある場合だけ再開ボタンを表示
    const resumeButton =
        document.getElementById("home-resume-button");

    resumeButton.hidden = !matchData.currentMatchId;
}

// 新しい試合を記録する
document.getElementById("home-new-match-button")
    .addEventListener("click", function () {

        if (matchData.currentMatchId) {
            const confirmed = confirm(
                "記録途中の試合があります。新しい試合を始めますか？\n" +
                "これまでの記録は過去の試合一覧に残ります。"
            );

            if (!confirmed) return;

            matchData.currentMatchId = null;
            currentMatch = null;
            points = [];

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(matchData)
            );
        }

        document.getElementById("player-a").value = "";
        document.getElementById("player-b").value = "";

        showScreen("setup-screen");
    });

// 記録途中の試合を再開する
document.getElementById("home-resume-button")
    .addEventListener("click", function () {

        currentMatch = matchData.matches.find(
            match => match.id === matchData.currentMatchId
        ) || null;

        if (!currentMatch) {
            alert("記録途中の試合が見つかりません。");
            showHomeScreen();
            return;
        }

        points = currentMatch.points;

        document.getElementById("pair-name").textContent =
            currentMatch.players.join("・");

        updateScore();
        showScreen("record-screen");
    });

// 過去の試合記録を見る
document.getElementById("home-match-list-button")
    .addEventListener("click", function () {
        showMatchList();
        showScreen("match-list-screen");
    });

// 成長分析を見る
document.getElementById("home-growth-button")
    .addEventListener("click", function () {
        showGrowthScreen();
        showScreen("growth-screen");
    });

// データ管理を開く
document.getElementById("home-backup-button")
    .addEventListener("click", function () {
        showScreen("backup-screen");
    });

// アプリ起動時はホーム画面を表示
showHomeScreen();

// 各画面の戻るボタンをホーム画面へ変更
const homeBackButtons = [
    "list-back-button",
    "growth-back-button",
    "backup-back-button"
];

homeBackButtons.forEach(buttonId => {
    const oldButton = document.getElementById(buttonId);

    if (!oldButton) return;

    // 以前のクリック処理を外す
    const newButton = oldButton.cloneNode(true);
    oldButton.replaceWith(newButton);

    newButton.textContent = "ホーム画面に戻る";

    newButton.addEventListener("click", function () {
        showHomeScreen();
    });
});

// 1stサーブのボタン選択
const firstServeButtons = document.querySelectorAll(
    "#first-serve-buttons button"
);

const firstServeSelect = document.getElementById("first-serve");

function updateFirstServeButtons() {
    firstServeButtons.forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.value === firstServeSelect.value
        );
    });
}

firstServeButtons.forEach(button => {
    button.addEventListener("click", function () {
        firstServeSelect.value = this.dataset.value;

        // 既存の2ndサーブ表示処理を実行
        firstServeSelect.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        updateFirstServeButtons();
    });
});

// ポイント記録後のリセットにも対応
document.getElementById("own-point-button")
    .addEventListener("click", updateFirstServeButtons);

document.getElementById("opponent-point-button")
    .addEventListener("click", updateFirstServeButtons);

updateFirstServeButtons();

// 2ndサーブのボタン選択
const secondServeButtons = document.querySelectorAll(
    "#second-serve-buttons button"
);

const secondServeSelect = document.getElementById("second-serve");

function updateSecondServeButtons() {
    secondServeButtons.forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.value === secondServeSelect.value
        );
    });
}

secondServeButtons.forEach(button => {
    button.addEventListener("click", function () {
        secondServeSelect.value = this.dataset.value;
        updateSecondServeButtons();
    });
});

// ポイント記録後のリセットにも対応
document.getElementById("own-point-button")
    .addEventListener("click", updateSecondServeButtons);

document.getElementById("opponent-point-button")
    .addEventListener("click", updateSecondServeButtons);

updateSecondServeButtons();

// サーバー選択をボタン式にする
const serverButtons = document.querySelectorAll(
    "#server-buttons button"
);

const serverSelect = document.getElementById("server");

function updateServerButtons() {
    serverButtons.forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.value === serverSelect.value
        );
    });
}

serverButtons.forEach(button => {
    button.addEventListener("click", function () {
        serverSelect.value = this.dataset.value;
        updateServerButtons();
    });
});

// 初期状態の選択表示
updateServerButtons();

// 詳細入力のタップ式ボタンと既存のselectを同期（保存形式は変更しない）
["error-player", "shot", "hand", "error-type"].forEach(id => {
    const select = document.getElementById(id);
    const buttons = document.querySelectorAll(`#${id}-buttons button`);
    function refresh() {
        buttons.forEach(button => {
            const selected = button.dataset.value === select.value;
            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    }
    buttons.forEach(button => button.addEventListener("click", () => {
        select.value = button.dataset.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        refresh();
    }));
    select.addEventListener("change", refresh);
    refresh();
});
