FROM --platform=linux/amd64 node:16-bullseye

WORKDIR /app

# 必要な環境変数を設定
ENV NODE_ENV=development

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

EXPOSE 3001

# アプリケーションを起動
CMD ["node", "backend/server.js"] 