require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// OpenAIを使用して占い文言を生成
async function createPokemonFortune(pokemonInfo, smileScore, emotion, userExpression) {
    try {
        const prompt = `
あなたは占い師として、以下の情報を元に、ポケモンの特徴を活かした占い結果を生成してください。
結果は150文字程度で、ポケモンの特徴を活かした占い結果を生成してください。口調は関西弁で面白く辛口にしてください。


ポケモン: ${pokemonInfo.name}
ポケモンの説明: ${pokemonInfo.flavorText}
ユーザーの表情: ${userExpression}
笑顔スコア: ${smileScore}
性格カテゴリ: ${emotion}

ポケモンのステータス:
HP: ${pokemonInfo.stats.hp}
攻撃: ${pokemonInfo.stats.attack}
防御: ${pokemonInfo.stats.defense}
素早さ: ${pokemonInfo.stats.speed}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "あなたは優しい占い師です。ポケモンの特徴を活かした占い結果を生成してください。" },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error('占い文章の生成に失敗しました');
    }
}

// 初代151匹のポケモンを10段階の性格に分類
const POKEMON_PERSONALITY = {
    CHEERFUL: { // 陽気で元気 (90-100%)
        pokemons: [
            'pikachu', 'raichu', 'clefairy', 'clefable', 'jigglypuff', 'wigglytuff',
            'chansey', 'magikarp', 'meowth', 'persian', 'psyduck', 'golduck',
            'poliwag', 'poliwhirl', 'poliwrath', 'farfetchd', 'ditto',
            'butterfree', 'pidgey', 'pidgeotto', 'eevee', 'vaporeon', 'jolteon',
            'flareon', 'charmander', 'squirtle', 'bulbasaur', 'oddish', 'gloom',
            'bellsprout', 'weepinbell', 'victreebel', 'ponyta', 'rapidash'
        ],
        description: '陽気で人なつっこい性格のポケモン'
    },
    ENERGETIC: { // 活発 (80-89%)
        pokemons: [
            'charmander', 'charmeleon', 'squirtle', 'wartortle', 'bulbasaur', 'ivysaur',
            'pidgey', 'pidgeotto', 'spearow', 'fearow', 'mankey', 'primeape',
            'growlithe', 'ponyta', 'rapidash', 'tauros', 'flareon', 'jolteon',
            'sandshrew', 'sandslash', 'nidoran-m', 'nidorino', 'nidoran-f', 'nidorina',
            'vulpix', 'ninetales', 'zubat', 'golbat', 'diglett', 'dugtrio',
            'poliwag', 'poliwhirl', 'machop', 'machoke', 'geodude', 'graveler'
        ],
        description: '活発で明るい性格のポケモン'
    },
    FRIENDLY: { // フレンドリー (70-79%)
        pokemons: [
            'butterfree', 'vulpix', 'ninetales', 'oddish', 'gloom', 'vileplume',
            'bellsprout', 'weepinbell', 'victreebel', 'slowpoke', 'slowbro',
            'seel', 'dewgong', 'lickitung', 'tangela', 'horsea', 'seadra',
            'pidgey', 'pidgeotto', 'pikachu', 'clefairy', 'jigglypuff',
            'meowth', 'psyduck', 'growlithe', 'poliwag', 'abra', 'kadabra',
            'ponyta', 'slowpoke', 'magnemite', 'farfetchd', 'ditto', 'eevee'
        ],
        description: '優しくて友好的な性格のポケモン'
    },
    PLAYFUL: { // 遊び好き (60-69%)
        pokemons: [
            'caterpie', 'metapod', 'weedle', 'kakuna', 'rattata', 'raticate',
            'sandshrew', 'sandslash', 'diglett', 'dugtrio', 'venonat', 'venomoth',
            'krabby', 'kingler', 'exeggcute', 'cubone', 'marowak', 'staryu',
            'meowth', 'psyduck', 'mankey', 'poliwag', 'slowpoke', 'magnemite',
            'voltorb', 'electrode', 'ditto', 'eevee', 'porygon', 'magikarp',
            'jigglypuff', 'clefairy', 'paras', 'venonat', 'grimer', 'krabby'
        ],
        description: '遊び好きでユーモアのある性格のポケモン'
    },
    GENTLE: { // おだやか (50-59%)
        pokemons: [
            'nidoran-f', 'nidorina', 'nidoran-m', 'nidorino', 'paras', 'parasect',
            'tentacool', 'tentacruel', 'grimer', 'muk', 'shellder', 'cloyster',
            'drowzee', 'hypno', 'goldeen', 'seaking', 'starmie', 'mr-mime',
            'oddish', 'gloom', 'vileplume', 'bellsprout', 'weepinbell',
            'slowpoke', 'slowbro', 'chansey', 'tangela', 'ditto', 'porygon',
            'seel', 'dewgong', 'horsea', 'seadra', 'magikarp', 'eevee'
        ],
        description: 'おだやかで穏やかな性格のポケモン'
    },
    CALM: { // 冷静 (40-49%)
        pokemons: [
            'kadabra', 'alakazam', 'abra', 'machop', 'machoke', 'geodude',
            'graveler', 'golem', 'magnemite', 'magneton', 'voltorb', 'electrode',
            'porygon', 'omanyte', 'omastar', 'kabuto', 'kabutops', 'starmie',
            'slowbro', 'hypno', 'chansey', 'mr-mime', 'scyther', 'ditto',
            'vaporeon', 'articuno', 'mewtwo', 'mew', 'exeggutor', 'tangela',
            'dewgong', 'cloyster', 'tentacruel', 'golduck', 'blastoise'
        ],
        description: '冷静で落ち着いた性格のポケモン'
    },
    PROUD: { // 誇り高い (30-39%)
        pokemons: [
            'pidgeot', 'arcanine', 'gyarados', 'vaporeon', 'nidoqueen', 'nidoking',
            'venusaur', 'blastoise', 'dragonair', 'kangaskhan', 'scyther',
            'pinsir', 'dratini', 'dragonite', 'charizard', 'ninetales',
            'rapidash', 'persian', 'golduck', 'arbok', 'sandslash', 'fearow',
            'raichu', 'clefable', 'wigglytuff', 'vileplume', 'poliwrath',
            'alakazam', 'machamp', 'victreebel', 'tentacruel', 'starmie'
        ],
        description: '誇り高く気高い性格のポケモン'
    },
    COOL: { // クール (20-29%)
        pokemons: [
            'charizard', 'beedrill', 'ekans', 'arbok', 'rhydon', 'electabuzz',
            'magmar', 'jynx', 'lapras', 'aerodactyl', 'snorlax', 'hitmonlee',
            'hitmonchan', 'rhyhorn', 'scyther', 'pinsir', 'gyarados', 'dragonair',
            'dragonite', 'kabutops', 'omastar', 'sandslash', 'nidoking',
            'nidoqueen', 'arcanine', 'alakazam', 'machamp', 'rapidash',
            'marowak', 'starmie', 'tauros', 'vaporeon', 'jolteon', 'flareon'
        ],
        description: 'クールでかっこいい性格のポケモン'
    },
    MYSTERIOUS: { // 神秘的 (10-19%)
        pokemons: [
            'gengar', 'haunter', 'gastly', 'mew', 'articuno', 'zapdos',
            'moltres', 'exeggutor', 'starmie', 'dewgong', 'cloyster',
            'hypno', 'kadabra', 'alakazam', 'mr-mime', 'jynx', 'porygon',
            'ditto', 'dragonair', 'dragonite', 'mewtwo', 'slowbro',
            'slowking', 'golduck', 'venomoth', 'butterfree', 'vileplume',
            'victreebel', 'tentacruel', 'clefable', 'wigglytuff', 'chansey'
        ],
        description: '神秘的で不思議な性格のポケモン'
    },
    POWERFUL: { // 強大 (0-9%)
        pokemons: [
            'mewtwo', 'machamp', 'onix', 'gyarados', 'dragonite', 'kabutops',
            'omastar', 'aerodactyl', 'snorlax', 'rhydon', 'nidoking',
            'charizard', 'blastoise', 'venusaur', 'arcanine', 'alakazam',
            'gengar', 'tauros', 'pinsir', 'scyther', 'electabuzz', 'magmar',
            'lapras', 'articuno', 'zapdos', 'moltres', 'kangaskhan',
            'golem', 'poliwrath', 'sandslash', 'cloyster', 'mew'
        ],
        description: '強大な力を持つ威厳のある性格のポケモン'
    }
};

// PokeAPIの結果をキャッシュ
const pokemonCache = new Map();

// PokeAPI取得関数を最適化
async function getPokemonInfo(pokemonName) {
    // キャッシュチェック
    if (pokemonCache.has(pokemonName)) {
        return pokemonCache.get(pokemonName);
    }

    try {
        const [pokemonRes, speciesRes] = await Promise.all([
            fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`),
            fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`)
        ]);

        const [pokemonData, speciesData] = await Promise.all([
            pokemonRes.json(),
            speciesRes.json()
        ]);

        // 結果を整形
        const result = {
            id: pokemonData.id,
            name: speciesData.names.find(name => name.language.name === 'ja')?.name || pokemonData.name,
            image: pokemonData.sprites.other?.['official-artwork']?.front_default || 
                   pokemonData.sprites.other?.home?.front_default ||
                   pokemonData.sprites.front_default,
            types: pokemonData.types.map(type => type.type.name),
            height: pokemonData.height / 10,
            weight: pokemonData.weight / 10,
            flavorText: speciesData.flavor_text_entries
                .find(entry => entry.language.name === 'ja')?.flavor_text?.replace(/\f|\n|\r/g, ' ') || '',
            stats: {
                hp: pokemonData.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 0,
                attack: pokemonData.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 0,
                defense: pokemonData.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 0,
                speed: pokemonData.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 0
            }
        };

        // キャッシュに保存
        pokemonCache.set(pokemonName, result);
        return result;
    } catch (error) {
        console.error('PokeAPI error:', error);
        throw new Error(`ポケモン情報の取得に失敗しました: ${error.message}`);
    }
}

// ポケモン選択ロジックを修正
function selectPokemon(smileScore) {
    const score = smileScore * 100;
    
    // スコアに基づいて性格カテゴリを決定
    let category;
    if (score >= 90) category = 'CHEERFUL';
    else if (score >= 80) category = 'ENERGETIC';
    else if (score >= 70) category = 'FRIENDLY';
    else if (score >= 60) category = 'PLAYFUL';
    else if (score >= 50) category = 'GENTLE';
    else if (score >= 40) category = 'CALM';
    else if (score >= 30) category = 'PROUD';
    else if (score >= 20) category = 'COOL';
    else if (score >= 10) category = 'MYSTERIOUS';
    else category = 'POWERFUL';

    // 選択されたカテゴリからランダムに1匹選択
    const pokemonList = POKEMON_PERSONALITY[category].pokemons;
    const selectedPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];

    return {
        pokemon: selectedPokemon,
        description: POKEMON_PERSONALITY[category].description
    };
}

// エンドポイントを更新（OpenAI統合）
app.post('/api/getPokemon', async (req, res) => {
    try {
        const { smileScore, userExpression = "neutral" } = req.body;
        if (smileScore === undefined) {
            throw new Error('表情スコアが提供されていません。');
        }

        // 全ての非同期処理をtry-catch内で実行
        const { pokemon, description } = selectPokemon(smileScore);
        const pokemonInfo = await getPokemonInfo(pokemon);
        const fortune = await createPokemonFortune(
            pokemonInfo,
            smileScore,
            description,
            userExpression
        );

        // レスポンスを送信する前にJSONとして有効か確認
        const response = {
            status: 'complete',
            pokemon: pokemonInfo,
            analysis: {
                smileScore,
                emotion: description
            },
            fortune: fortune || '申し訳ありません。占い結果を生成できませんでした。'
        };

        // JSONとして有効か確認
        JSON.stringify(response);
        
        res.json(response);

    } catch (error) {
        console.error('Error in /api/getPokemon:', error);
        res.status(500).json({ 
            status: 'error', 
            error: error.message || '予期せぬエラーが発生しました。'
        });
    }
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: '予期せぬエラーが発生しました。',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
    });
});