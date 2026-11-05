export function musicPlayerDemoIntegration() {
  return {
    name: 'music-player-demo',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;

        injectRoute({
          pattern: '/__music-demo',
          entrypoint: './src/components/theme/music-player/demo/MusicPlayerDemo.astro',
        });
      },
    },
  };
}
