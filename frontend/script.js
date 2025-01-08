document.addEventListener('DOMContentLoaded', async () => {
    const imageUpload = document.getElementById('imageUpload');
    const cameraButton = document.getElementById('cameraButton');
    const resultDiv = document.getElementById('result');
    const appDiv = document.getElementById('app');
    let stream = null;

    // カメラ起動ボタンのイベントリスナー
    cameraButton.addEventListener('click', async () => {
        try {
            // すでにビデオ要素が存在する場合は削除
            const existingVideo = document.querySelector('video');
            if (existingVideo) {
                existingVideo.remove();
            }

            // カメラストリームを取得
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // ビデオ要素の作成と設定
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.muted = true;
            video.setAttribute('playsinline', '');  // iOS対応
            video.srcObject = stream;

            // ビデオの読み込み完了を待つ
            await video.play().catch(function(error) {
                console.error("ビデオの再生に失敗:", error);
            });

            // appDivにビデオを挿入
            appDiv.insertBefore(video, resultDiv);

            // 撮影ボタンの作成
            const captureButton = document.createElement('button');
            captureButton.textContent = '撮影';
            captureButton.classList.add('capture-button');
            appDiv.insertBefore(captureButton, resultDiv);

            // 撮影ボタンのクリックイベント
            captureButton.addEventListener('click', () => {
                // キャンバスの作成
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0);

                // 画像をBase64形式に変換
                const imageData = canvas.toDataURL('image/jpeg');
                
                // 画像を分析
                analyzeImage(imageData);

                // ストリームの停止とビデオ要素の削除
                stream.getTracks().forEach(track => track.stop());
                video.remove();
                captureButton.remove();
            });

        } catch (error) {
            console.error('カメラの起動に失敗しました:', error);
            alert('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
        }
    });

    // ファイルアップロード処理
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                analyzeImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Blazefaceモデルの初期化
    console.log('Loading Blazeface model...');
    const model = await blazeface.load();
    console.log('Model loaded');

    // 笑顔スコアの計算関数を修正
    function calculateSmileScore(prediction) {
        if (!prediction) return 0;
        
        try {
            // 顔のサイズを計算
            const faceWidth = prediction.bottomRight[0] - prediction.topLeft[0];
            const faceHeight = prediction.bottomRight[1] - prediction.topLeft[1];
            
            // 口の両端のランドマークを取得（landmarks[3]が右端、landmarks[4]が左端）
            const rightMouth = prediction.landmarks[3];
            const leftMouth = prediction.landmarks[4];
            
            // 口の幅を計算
            const mouthWidth = Math.abs(rightMouth[0] - leftMouth[0]);
            
            // 口の高さ（開き具合）を計算
            const mouthHeight = Math.abs(rightMouth[1] - leftMouth[1]);
            
            // 笑顔スコアを計算（口の幅と顔の幅の比率、および口の開き具合を考慮）
            const widthRatio = mouthWidth / faceWidth;
            const heightRatio = mouthHeight / faceHeight;
            
            // 笑顔スコアを0-1の範囲に正規化
            const smileScore = Math.min(
                (widthRatio * 2 + heightRatio) / 2, 
                1.0
            );
            
            return smileScore;
        } catch (error) {
            console.error('笑顔スコアの計算エラー:', error);
            return 0.5; // エラーの場合はデフォルト値を返す
        }
    }

    // 画像分析関数
    async function analyzeImage(imageData) {
        try {
            resultDiv.innerHTML = '<p>分析中...</p>';
            
            // 画像をテンソルに変換
            const img = new Image();
            img.src = imageData;
            await img.decode();

            // 顔検出
            const predictions = await model.estimateFaces(img, false);
            
            if (predictions.length === 0) {
                throw new Error('顔が検出できませんでした。');
            }

            // 笑顔スコアの計算
            const smileScore = calculateSmileScore(predictions[0]);

            // サーバーにスコアを送信してポケモンを取得
            const response = await fetch('http://localhost:3001/api/getPokemon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smileScore })
            });

            const result = await response.json();
            
            // 結果の表示
            resultDiv.innerHTML = `
                <div class="result-container">
                    <img src="${result.pokemon.image}" alt="${result.pokemon.name}" class="pokemon-image">
                    <div class="pokemon-info">
                        <h2>${result.pokemon.name}</h2>
                        <p>${result.analysis.emotion}</p>
                        <p>タイプ: ${result.pokemon.types.join(', ')}</p>
                        <div class="pokemon-stats">
                            <p>身長: ${result.pokemon.height}m</p>
                            <p>体重: ${result.pokemon.weight}kg</p>
                            <div class="stats">
                                <p>HP: ${result.pokemon.stats.hp}</p>
                                <p>攻撃: ${result.pokemon.stats.attack}</p>
                                <p>防御: ${result.pokemon.stats.defense}</p>
                                <p>素早さ: ${result.pokemon.stats.speed}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            resultDiv.innerHTML = `エラー: ${error.message}`;
        }
    }
});