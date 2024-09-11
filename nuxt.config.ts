// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  app: {
    head: {
      script: [
        {
          src: "//daybrush.com/moveable/release/latest/dist/moveable.min.js",
          defer: true, // 스크립트가 로드된 후 실행되도록 설정
        },
      ],
    },
  },
});
