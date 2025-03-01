const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot está online! Logado como ${client.user.tag}`);

        const statuses = [
            {
                name: 'Gerenciando ações',
                type: ActivityType.Custom,
                state: '🔧 Gerenciando ações',
                url: "https://discord.gg/eRTzAV7S"
            },
            {
                name: 'Aprovando solicitações',
                type: ActivityType.Custom,
                state: '🔍 Aprovando solicitações',
                url: "https://discord.gg/eRTzAV7S"
            },
            {
                name: 'Organizando planilha de craft',
                type: ActivityType.Custom,
                state: '📋 Organizando planilha de craft',
                url: "https://discord.gg/eRTzAV7S"
            },
            {
                name: 'Melhorando a experiência',
                type: ActivityType.Custom,
                state: '🛠️ Melhorando a experiência',
                url: "https://discord.gg/eRTzAV7S"
            },
            {
                name: 'Ajudando a comunidade',
                type: ActivityType.Custom,
                state: '🤝 Ajudando a comunidade',
                url: "https://discord.gg/eRTzAV7S"
            },
        ];

        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        client.user.setPresence({
            status: 'online',
            activities: [randomStatus]
        });

        setInterval(() => {
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            client.user.setPresence({
                status: 'online',
                activities: [randomStatus]
            });
        }, 30 * 60 * 1000);
    }
};