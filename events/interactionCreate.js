const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const Acao = require('../models/Acao');
const config = require('../config.json');
const { chain: chain } = require('mathjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'Houve um erro ao executar este comando!',
                    ephemeral: true
                });
            }
        }

        // Handle modal submissions
        if (interaction.isModalSubmit() && interaction.customId === 'iniciaracao-modal') {
            await handleAcaoModalSubmit(interaction, client);
        }

        // Handle button interactions
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('participar_')) {
                await handleParticiparButton(interaction, client);
            } else if (interaction.customId.startsWith('encerrar_')) {
                await handleEncerrarButton(interaction, client);
            } else if (interaction.customId.startsWith('aprovar_')) {
                await handleAprovarButton(interaction, client);
            } else if (interaction.customId.startsWith('reserva_')) {
                await handleReservaButton(interaction, client);
            } else if (interaction.customId.startsWith('recusar_')) {
                await handleRecusarButton(interaction, client);
            }
        }
    }
};

// Handle the modal submission for creating a new action
async function handleAcaoModalSubmit(interaction, client) {
    try {
        // Get values from the modal
        const nome = interaction.fields.getTextInputValue('nome');
        const data = interaction.fields.getTextInputValue('data');
        const radio = interaction.fields.getTextInputValue('radio');
        const vagas = parseInt(interaction.fields.getTextInputValue('vagas'));
        const reservas = parseInt(interaction.fields.getTextInputValue('reservas'));

        // Validate numeric inputs
        if (isNaN(vagas) || isNaN(reservas) || vagas < 0 || reservas < 0) {
            return await interaction.reply({
                content: 'O número de vagas e reservas deve ser um valor numérico positivo.',
                ephemeral: true
            });
        }

        // Generate a unique ID for the action
        const acaoId = uuidv4();

        // Create an embed for the action
        const embed = createActionEmbed(nome, data, radio, vagas, reservas, [], []);

        // Create buttons for the action
        const participarButton = new ButtonBuilder()
            .setCustomId(`participar_${acaoId}`)
            .setLabel('Participar da ação')
            .setStyle(ButtonStyle.Primary);

        const encerrarButton = new ButtonBuilder()
            .setCustomId(`encerrar_${acaoId}`)
            .setLabel('Encerrar Ação')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(participarButton, encerrarButton);

        // Send the embed with buttons
        const mainChannel = client.channels.cache.get(config.mainActionChannel);
        if (!mainChannel) {
            return await interaction.reply({
                content: 'Canal principal para ações não encontrado. Verifique a configuração.',
                ephemeral: true
            });
        }

        const messageResponse = await mainChannel.send({
            embeds: [embed],
            components: [row]
        });

        // Create a topic for this action
        const guild = interaction.guild;
        const category = guild.channels.cache.get(config.actionCategory);

        if (!category) {
            return await interaction.reply({
                content: 'Categoria para tópicos de ação não encontrada. Verifique a configuração.',
                ephemeral: true
            });
        }

        // Create permissions for the topic channel
        const permissionOverwrites = [
            {
                id: guild.id, // @everyone role
                deny: [PermissionFlagsBits.ViewChannel],
            },
            ...config.adminRoleIds.map(roleId => ({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel],
            })),
            {
                id: client.user.id, // Bot itself
                allow: [PermissionFlagsBits.ViewChannel],
            }
        ];

        // Create the topic channel
        const topicChannel = await guild.channels.create({
            name: `acao-${nome.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissionOverwrites
        });

        // Initial message in the topic channel
        await topicChannel.send(`# Ação: ${nome}\nTópico para gerenciar solicitações de participação para esta ação.`);

        // Save the action to the database
        const newAcao = new Acao({
            acao_id: acaoId,
            nome,
            data,
            radio,
            vagas: {
                total: vagas,
                reservas
            },
            participantes: {
                aprovados: [],
                reservas: []
            },
            solicitacoes: [],
            status: 'ativa',
            embed_message_id: messageResponse.id,
            topic_channel_id: topicChannel.id,
            guild_id: interaction.guild.id
        });

        await newAcao.save();

        // Reply to the interaction
        await interaction.reply({
            content: `Ação "${nome}" criada com sucesso!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao criar ação:', error);
        await interaction.reply({
            content: 'Houve um erro ao criar a ação. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Handle the participate button click
async function handleParticiparButton(interaction, client) {
    try {
        // Extract action ID from button custom ID
        const acaoId = interaction.customId.split('_')[1];

        // Find the action in the database
        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                ephemeral: true
            });
        }

        if (acao.status === 'encerrada') {
            return await interaction.reply({
                content: 'Esta ação já foi encerrada.',
                ephemeral: true
            });
        }

        const userId = interaction.user.id;

        // Check if user already applied or is already participating
        if (acao.participantes.aprovados.includes(userId)) {
            return await interaction.reply({
                content: 'Você já está participando desta ação.',
                ephemeral: true
            });
        }

        if (acao.participantes.reservas.includes(userId)) {
            return await interaction.reply({
                content: 'Você já está na lista de reservas desta ação.',
                ephemeral: true
            });
        }

        const existingSolicitation = acao.solicitacoes.find(sol => sol.user_id === userId && sol.status === 'pendente');
        if (existingSolicitation) {
            return await interaction.reply({
                content: 'Você já tem uma solicitação pendente para esta ação.',
                ephemeral: true
            });
        }

        // Get the topic channel
        const topicChannel = client.channels.cache.get(acao.topic_channel_id);
        if (!topicChannel) {
            return await interaction.reply({
                content: 'Tópico da ação não encontrado.',
                ephemeral: true
            });
        }

        // Create buttons for the request
        const aprovarButton = new ButtonBuilder()
            .setCustomId(`aprovar_${acaoId}_${userId}`)
            .setLabel('Aprovar')
            .setStyle(ButtonStyle.Success);

        const reservaButton = new ButtonBuilder()
            .setCustomId(`reserva_${acaoId}_${userId}`)
            .setLabel('Reserva')
            .setStyle(ButtonStyle.Primary);

        const recusarButton = new ButtonBuilder()
            .setCustomId(`recusar_${acaoId}_${userId}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(aprovarButton, reservaButton, recusarButton);

        // Send the request message to the topic
        const requestMessage = await topicChannel.send({
            content: `<@${userId}> (${interaction.user.tag}) solicitou participação na ação "${acao.nome}"`,
            components: [row]
        });

        // Add the solicitation to the database
        acao.solicitacoes.push({
            user_id: userId,
            status: 'pendente',
            mensagem_id: requestMessage.id
        });

        await acao.save();

        // Reply to the interaction
        await interaction.reply({
            content: `Sua solicitação para participar da ação "${acao.nome}" foi enviada!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao solicitar participação:', error);
        await interaction.reply({
            content: 'Houve um erro ao solicitar participação. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Handle the approve button click
async function handleAprovarButton(interaction, client) {
    try {
        // Extract action ID and user ID from button custom ID
        const [_, acaoId, userId] = interaction.customId.split('_');

        // Find the action in the database
        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                ephemeral: true
            });
        }

        if (acao.status === 'encerrada') {
            return await interaction.reply({
                content: 'Esta ação já foi encerrada.',
                ephemeral: true
            });
        }

        // Find the solicitation
        const solicitationIndex = acao.solicitacoes.findIndex(
            sol => sol.user_id === userId && sol.status === 'pendente'
        );

        if (solicitationIndex === -1) {
            return await interaction.reply({
                content: 'Solicitação não encontrada ou já processada.',
                ephemeral: true
            });
        }

        // Check if there are available slots
        if (acao.participantes.aprovados.length >= acao.vagas.total) {
            return await interaction.reply({
                content: 'Não há mais vagas disponíveis para esta ação.',
                ephemeral: true
            });
        }

        // Update the solicitation status
        acao.solicitacoes[solicitationIndex].status = 'aprovado';

        // Add the user to approved participants
        if (!acao.participantes.aprovados.includes(userId)) {
            acao.participantes.aprovados.push(userId);
        }

        await acao.save();

        // Update the original message to disable the buttons
        try {
            await interaction.message.edit({
                content: `<@${userId}> foi **APROVADO** para a ação "${acao.nome}" por <@${interaction.user.id}>`,
                components: []
            });
        } catch (error) {
            console.error('Erro ao editar mensagem de solicitação:', error);
        }

        // Update the action embed
        const mainChannel = client.channels.cache.get(config.mainActionChannel);
        if (mainChannel) {
            try {
                const message = await mainChannel.messages.fetch(acao.embed_message_id);
                if (message) {
                    const updatedEmbed = createActionEmbed(
                        acao.nome,
                        acao.data,
                        acao.radio,
                        acao.vagas.total,
                        acao.vagas.reservas,
                        acao.participantes.aprovados,
                        acao.participantes.reservas
                    );

                    // Keep the same buttons if the action is still active
                    let components = [];
                    if (acao.status === 'ativa') {
                        const participarButton = new ButtonBuilder()
                            .setCustomId(`participar_${acaoId}`)
                            .setLabel('Participar da ação')
                            .setStyle(ButtonStyle.Primary);

                        const encerrarButton = new ButtonBuilder()
                            .setCustomId(`encerrar_${acaoId}`)
                            .setLabel('Encerrar Ação')
                            .setStyle(ButtonStyle.Danger);

                        components = [new ActionRowBuilder().addComponents(participarButton, encerrarButton)];
                    }

                    await message.edit({
                        embeds: [updatedEmbed],
                        components: components
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar embed da ação:', error);
            }
        }

        // Notify the user
        try {
            const user = await client.users.fetch(userId);
            await user.send(`Sua solicitação para participar da ação "${acao.nome}" foi **APROVADA**!`);
        } catch (error) {
            console.error('Erro ao notificar usuário sobre aprovação:', error);
        }

        // Reply to the interaction
        await interaction.reply({
            content: `Usuário <@${userId}> foi aprovado para a ação "${acao.nome}"!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao aprovar solicitação:', error);
        await interaction.reply({
            content: 'Houve um erro ao aprovar a solicitação. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Handle the reserve button click
async function handleReservaButton(interaction, client) {
    try {
        // Extract action ID and user ID from button custom ID
        const [_, acaoId, userId] = interaction.customId.split('_');

        // Find the action in the database
        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                ephemeral: true
            });
        }

        if (acao.status === 'encerrada') {
            return await interaction.reply({
                content: 'Esta ação já foi encerrada.',
                ephemeral: true
            });
        }

        // Find the solicitation
        const solicitationIndex = acao.solicitacoes.findIndex(
            sol => sol.user_id === userId && sol.status === 'pendente'
        );

        if (solicitationIndex === -1) {
            return await interaction.reply({
                content: 'Solicitação não encontrada ou já processada.',
                ephemeral: true
            });
        }

        // Check if there are available reserve slots
        if (acao.participantes.reservas.length >= acao.vagas.reservas) {
            return await interaction.reply({
                content: 'Não há mais vagas de reserva disponíveis para esta ação.',
                ephemeral: true
            });
        }

        // Update the solicitation status
        acao.solicitacoes[solicitationIndex].status = 'reserva';

        // Add the user to reserves participants
        if (!acao.participantes.reservas.includes(userId)) {
            acao.participantes.reservas.push(userId);
        }

        await acao.save();

        // Update the original message to disable the buttons
        try {
            await interaction.message.edit({
                content: `<@${userId}> foi colocado como **RESERVA** para a ação "${acao.nome}" por <@${interaction.user.id}>`,
                components: []
            });
        } catch (error) {
            console.error('Erro ao editar mensagem de solicitação:', error);
        }

        // Update the action embed
        const mainChannel = client.channels.cache.get(config.mainActionChannel);
        if (mainChannel) {
            try {
                const message = await mainChannel.messages.fetch(acao.embed_message_id);
                if (message) {
                    const updatedEmbed = createActionEmbed(
                        acao.nome,
                        acao.data,
                        acao.radio,
                        acao.vagas.total,
                        acao.vagas.reservas,
                        acao.participantes.aprovados,
                        acao.participantes.reservas
                    );

                    // Keep the same buttons if the action is still active
                    let components = [];
                    if (acao.status === 'ativa') {
                        const participarButton = new ButtonBuilder()
                            .setCustomId(`participar_${acaoId}`)
                            .setLabel('Participar da ação')
                            .setStyle(ButtonStyle.Primary);

                        const encerrarButton = new ButtonBuilder()
                            .setCustomId(`encerrar_${acaoId}`)
                            .setLabel('Encerrar Ação')
                            .setStyle(ButtonStyle.Danger);

                        components = [new ActionRowBuilder().addComponents(participarButton, encerrarButton)];
                    }

                    await message.edit({
                        embeds: [updatedEmbed],
                        components: components
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar embed da ação:', error);
            }
        }

        // Notify the user
        try {
            const user = await client.users.fetch(userId);
            await user.send(`Sua solicitação para participar da ação "${acao.nome}" foi aceita como **RESERVA**!`);
        } catch (error) {
            console.error('Erro ao notificar usuário sobre reserva:', error);
        }

        // Reply to the interaction
        await interaction.reply({
            content: `Usuário <@${userId}> foi colocado como reserva para a ação "${acao.nome}"!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao colocar solicitação como reserva:', error);
        await interaction.reply({
            content: 'Houve um erro ao processar a solicitação como reserva. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Handle the reject button click
async function handleRecusarButton(interaction, client) {
    try {
        // Extract action ID and user ID from button custom ID
        const [_, acaoId, userId] = interaction.customId.split('_');

        // Find the action in the database
        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                ephemeral: true
            });
        }

        // Find the solicitation
        const solicitationIndex = acao.solicitacoes.findIndex(
            sol => sol.user_id === userId && sol.status === 'pendente'
        );

        if (solicitationIndex === -1) {
            return await interaction.reply({
                content: 'Solicitação não encontrada ou já processada.',
                ephemeral: true
            });
        }

        // Update the solicitation status
        acao.solicitacoes[solicitationIndex].status = 'recusado';
        await acao.save();

        // Update the original message to disable the buttons
        try {
            await interaction.message.edit({
                content: `<@${userId}> foi **RECUSADO** para a ação "${acao.nome}" por <@${interaction.user.id}>`,
                components: []
            });
        } catch (error) {
            console.error('Erro ao editar mensagem de solicitação:', error);
        }

        // Notify the user
        try {
            const user = await client.users.fetch(userId);
            await user.send(`Sua solicitação para participar da ação "${acao.nome}" foi **RECUSADA**.`);
        } catch (error) {
            console.error('Erro ao notificar usuário sobre recusa:', error);
        }

        // Reply to the interaction
        await interaction.reply({
            content: `Solicitação do usuário <@${userId}> para a ação "${acao.nome}" foi recusada.`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao recusar solicitação:', error);
        await interaction.reply({
            content: 'Houve um erro ao recusar a solicitação. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Handle the end action button click
async function handleEncerrarButton(interaction, client) {
    try {
        // Extract action ID from button custom ID
        const acaoId = interaction.customId.split('_')[1];

        // Find the action in the database
        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                ephemeral: true
            });
        }

        if (acao.status === 'encerrada') {
            return await interaction.reply({
                content: 'Esta ação já foi encerrada.',
                ephemeral: true
            });
        }

        // Update action status
        acao.status = 'encerrada';
        await acao.save();

        // Update the action embed without buttons
        const mainChannel = client.channels.cache.get(config.mainActionChannel);
        if (mainChannel) {
            try {
                const message = await mainChannel.messages.fetch(acao.embed_message_id);
                if (message) {
                    const updatedEmbed = createActionEmbed(
                        acao.nome,
                        acao.data,
                        acao.radio,
                        acao.vagas.total,
                        acao.vagas.reservas,
                        acao.participantes.aprovados,
                        acao.participantes.reservas,
                        true // Indicate action is closed
                    );

                    await message.edit({
                        embeds: [updatedEmbed],
                        components: [] // Remove buttons
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar embed da ação encerrada:', error);
            }
        }

        // Delete the topic channel if it exists
        try {
            const topicChannel = client.channels.cache.get(acao.topic_channel_id);
            if (topicChannel) {
                await topicChannel.delete();
            }
        } catch (error) {
            console.error('Erro ao excluir tópico da ação:', error);
        }

        // Reply to the interaction
        await interaction.reply({
            content: `Ação "${acao.nome}" foi encerrada com sucesso!`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Erro ao encerrar ação:', error);
        await interaction.reply({
            content: 'Houve um erro ao encerrar a ação. Por favor, tente novamente.',
            ephemeral: true
        });
    }
}

// Helper function to create the action embed
function createActionEmbed(nome, data, radio, vagasTotal, vagasReservas, aprovados, reservas, isClosed = false) {
    let vagasRestantes = vagasTotal - aprovados.length;
    let vagasReservasRestantes = vagasReservas - reservas.length;
    const embed = new EmbedBuilder()
        .setColor(isClosed ? '#808080' : '#0099ff')
        .setTitle("Nova Ação Marcada 🔫")
        .setDescription(`Deseja participar da ação ? Clique nos botões abaixo!👇`)
        .addFields(
            { name: "📝 Nome da Ação", value: nome, inline: true },
            { name: "📅 Data e Hora", value: data, inline: true },
            { name: "📻 Rádio", value: radio, inline: true },
        )
        .setTimestamp();

    // Add approved participants
    let approvedText = 'Nenhum participante aprovado.';
    if (aprovados.length > 0) {
        approvedText = aprovados.map((userId, index) => `${index + 1}. <@${userId}>`).join('\n');
    }
    embed.addFields({ name:  `👥(${aprovados.length}) Membros - ${vagasRestantes} Disponíveis`, value: approvedText });

    // Add reserve participants
    if (vagasReservas > 0) {
        let reserveText = 'Nenhum participante na reserva.';
        if (reservas.length > 0) {
            reserveText = reservas.map((userId, index) => `${index + 1}. <@${userId}>`).join('\n');
        }
        embed.addFields({ name: `🪑(${reservas.length}) Membros - ${vagasReservasRestantes} Disponíveis`, value: reserveText });
    }

    // Add a footer
    embed.setFooter({
        text: isClosed
            ? 'Ação encerrada'
            : 'Clique em "Participar da ação" para se inscrever'
    });

    return embed;
}