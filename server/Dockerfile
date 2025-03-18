FROM node:18-alpine

WORKDIR /app

# Instalar dependências necessárias para o Prisma
RUN apk add --no-cache openssl

# Copiar arquivos de configuração
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar o resto dos arquivos
COPY . .

# Build da aplicação
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"] 