    const { Client, GatewayIntentBits, REST, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
    const { Routes } = require('discord-api-types/v9');

    const PREFIX = '!';
    const clientId = '1171816916273344592';
    const guildId = '1171816765349695498';
    const botToken = 'MTE3MTgxNjkxNjI3MzM0NDU5Mg.GAaZMq.xBA4o2yhRybKVqpLqr_r7yF2CZJc5u3lay7udA';

    const commands = [
        {
            name: 'info',
            description: 'Get information about the bot',
        },
        {
            name: 'startsnake',
            description: 'Start a Snake game',
        },
        {
            name: 'loop',
        description: 'Dikke loop!!!'
        }
    ];

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    class SnakeGame {
        constructor() {
            this.gameSize = 10;
            this.gameBoard = this.initializeGameBoard();
            this.snake = [{ x: 0, y: 0 }];
            this.food = this.generateFood();
        }

        initializeGameBoard() {
            const board = [];
            for (let i = 0; i < this.gameSize; i++) {
                const row = Array(this.gameSize).fill('🔵');
                board.push(row);
            }
            return board;
        }

        generateFood() {
            const x = Math.floor(Math.random() * this.gameSize);
            const y = Math.floor(Math.random() * this.gameSize);
            this.gameBoard[y][x] = '🍎';
            return { x, y };
        }

        handleInput(input) {
            const head = { ...this.snake[0] };
            let newHead;

            switch (input) {
                case 'up':
                    newHead = { x: head.x, y: (head.y - 1 + this.gameSize) % this.gameSize };
                    break;
                case 'down':
                    newHead = { x: head.x, y: (head.y + 1) % this.gameSize };
                    break;
                case 'left':
                    newHead = { x: (head.x - 1 + this.gameSize) % this.gameSize, y: head.y };
                    break;
                case 'right':
                    newHead = { x: (head.x + 1) % this.gameSize, y: head.y };
                    break;
                default:
                    return;
            }

            if (newHead.x === this.food.x && newHead.y === this.food.y) {
                this.snake.unshift(newHead);
                this.food = this.generateFood();
            } else {
                this.snake.unshift(newHead);
                const tail = this.snake.pop();
                this.gameBoard[tail.y][tail.x] = '🔵';
            }

            this.gameBoard = this.initializeGameBoard(); // Clear the board

            this.snake.forEach((segment) => {
                this.gameBoard[segment.y][segment.x] = '🐍';
            });

            this.gameBoard[this.food.y][this.food.x] = '🍎';
        }

        async initializeButtons(message) {
            const row = new ActionRowBuilder();

            const upButton = new ButtonBuilder()
                .setCustomId('up')
                .setLabel('Up')
                .setStyle('1');

            const downButton = new ButtonBuilder()
                .setCustomId('down')
                .setLabel('Down')
                .setStyle('1');

            const leftButton = new ButtonBuilder()
                .setCustomId('left')
                .setLabel('Left')
                .setStyle('1');

            const rightButton = new ButtonBuilder()
                .setCustomId('right')
                .setLabel('Right')
                .setStyle('1');

            row.addComponents(upButton, downButton, leftButton, rightButton);

            await message.edit({
                components: [row],
                embeds: [getGameEmbed(this.getGameBoard())],
            });
        }

        async startGame(target) {
            const snakeMessage = await target.reply({
                fetchReply: true,
                content: 'Snake game is starting! Use buttons to control the snake.',
                embeds: [getGameEmbed(this.getGameBoard())],
            });

            await this.initializeButtons(snakeMessage);

            const filter = (interaction) => interaction.isButton() && interaction.user.id === target.author.id;

            const collector = snakeMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (interaction) => {
                this.handleInput(interaction.customId);
                await interaction.deferUpdate();
                await this.initializeButtons(snakeMessage);
            });

            collector.on('end', () => {
                target.reply('Snake game has ended.');
            });
        }

        getGameBoard() {
            const boardCopy = this.initializeGameBoard();

            this.snake.forEach((segment) => {
                boardCopy[segment.y][segment.x] = '🐍';
            });

            boardCopy[this.food.y][this.food.x] = '🍎';

            return boardCopy.map(row => row.join(' ')).join('\n');
        }
    }

    async function startSnake(target) {
        const snakeGame = new SnakeGame();
        await snakeGame.startGame(target);
    }

    client.once('ready', () => {
        console.log('Bot is ready!');

        const rest = new REST({ version: '9' }).setToken(botToken);

        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');

                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands },
                );

                console.log('Successfully reloaded application (/) commands.');
            } catch (error) {
                console.error(error);
            }
        })();
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'info') {
            await interaction.reply('This bot is created by Damian Wijnsema!');
        } else if (commandName === 'startsnake') {
            startSnake(interaction);
        }
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'loop') {
            await interaction.reply('!loop');
        } else if (commandName === 'startsnake') {
            startSnake(interaction);
        }
    });

    client.on('messageCreate', (message) => {
        if (!message.content.startsWith(PREFIX) || message.author.bot) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ping') {
            message.reply('Pong!');
        } else if (command === 'startsnake') {
            startSnake(message);
        }
    });

    function getGameEmbed(gameBoard) {
        return new EmbedBuilder()
            .setTitle('Snake Game')
            .setDescription(gameBoard)
            .setColor('#00ff00');
    }

    client.login(botToken);
