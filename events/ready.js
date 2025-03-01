const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot está online! Logado como ${client.user.tag}`);

        client.user.setPresence({
            activities: [
                {
                    name: 'Gerenciando ações',
                    type: ActivityType.Playing
                }
            ],
            status: 'online'
        });

        setInterval(() => {
            const statuses = [
                { name: 'Gerenciando ações', type: ActivityType.Playing },
                { name: 'Aprovar solicitações', type: ActivityType.Watching },
                { name: 'Comandos com /iniciaracao', type: ActivityType.Listening }
            ];

            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            client.user.setPresence({
                activities: [randomStatus],
                status: 'online'
            });
        }, 30 * 60 * 1000);
    }
};