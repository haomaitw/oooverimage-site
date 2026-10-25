FROM caddy:2.11.4-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY *.html *.js *.css *.txt *.xml *.webmanifest CNAME /usr/share/caddy/
COPY assets/ /usr/share/caddy/assets/
COPY about/ /usr/share/caddy/about/
COPY contact/ /usr/share/caddy/contact/
COPY en/ /usr/share/caddy/en/
COPY ja/ /usr/share/caddy/ja/
COPY ko/ /usr/share/caddy/ko/
COPY services/ /usr/share/caddy/services/
COPY work/ /usr/share/caddy/work/
COPY zh-cn/ /usr/share/caddy/zh-cn/
ARG SOURCE_COMMIT
LABEL org.opencontainers.image.revision=$SOURCE_COMMIT
RUN test "${#SOURCE_COMMIT}" -eq 40 && printf '{"commit":"%s"}\n' "$SOURCE_COMMIT" > /usr/share/caddy/deployment-version.json
EXPOSE 8080
