# 阶段 1：使用 node 镜像编译构建 react 应用
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN npm run build

# 阶段 2：使用 nginx 镜像作为纯静态资源服务器托管编译后的页面
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
