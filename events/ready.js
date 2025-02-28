module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot está online! Logado como ${client.user.tag}`);
    }
};