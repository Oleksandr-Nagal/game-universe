// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('✨ Start seeding process...');

    try {
        console.log('Step 1: Creating/updating test user...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const testUser = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword,
                role: 'USER',
                emailVerified: new Date(),
                image: 'https://placehold.co/100x100/aabbcc/ffffff?text=TU',
            },
        });
        console.log(`Step 1 Complete: Created/updated user: ${testUser.name} (${testUser.email})`);

        console.log('Step 2: Seeding genres...');
        const genresToSeed = ['Action', 'Adventure', 'RPG', 'Shooter', 'Strategy', 'Indie', 'Simulation', 'Sandbox']; // Added Sandbox
        const createdGenres = await Promise.all(
            genresToSeed.map((name) =>
                prisma.genre.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                })
            )
        );
        console.log('Step 2 Complete: Genres seeded.');

        console.log('Step 3: Seeding platforms...');
        const platformsToSeed = ['PC', 'PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'];
        const createdPlatforms = await Promise.all(
            platformsToSeed.map((name) =>
                prisma.platform.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                })
            )
        );
        console.log('Step 3 Complete: Platforms seeded.');

        console.log('Step 4: Seeding developers...');
        const developersToSeed = ['FromSoftware', 'CD Projekt Red', 'Valve', 'Rockstar Games', 'Naughty Dog', 'id Software', 'Mojang Studios', 'ConcernedApe']; // Added new developers
        const createdDevelopers = await Promise.all(
            developersToSeed.map((name) =>
                prisma.developer.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                })
            )
        );
        console.log('Step 4 Complete: Developers seeded.');

        console.log('Step 5: Seeding publishers...');
        const publishersToSeed = ['Bandai Namco', 'CD Projekt', 'Electronic Arts', 'Take-Two Interactive', 'Sony Interactive Entertainment', 'Bethesda Softworks', 'Xbox Game Studios', 'ConcernedApe']; // Added new publishers
        const createdPublishers = await Promise.all(
            publishersToSeed.map((name) =>
                prisma.publisher.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                })
            )
        );
        console.log('Step 5 Complete: Publishers seeded.');

        console.log('Step 6: All core entities seeded. Preparing to seed games...');

        const actionGenre = createdGenres.find((g) => g.name === 'Action');
        const adventureGenre = createdGenres.find((g) => g.name === 'Adventure');
        const rpgGenre = createdGenres.find((g) => g.name === 'RPG');
        const shooterGenre = createdGenres.find((g) => g.name === 'Shooter');
        const sandboxGenre = createdGenres.find((g) => g.name === 'Sandbox');
        const simulationGenre = createdGenres.find((g) => g.name === 'Simulation');


        const pcPlatform = createdPlatforms.find((p) => p.name === 'PC');
        const ps5Platform = createdPlatforms.find((p) => p.name === 'PlayStation 5');
        const nintendoSwitchPlatform = createdPlatforms.find((p) => p.name === 'Nintendo Switch');


        const fromSoftwareDev = createdDevelopers.find((d) => d.name === 'FromSoftware');
        const cdProjektRedDev = createdDevelopers.find((d) => d.name === 'CD Projekt Red');
        const rockstarGamesDev = createdDevelopers.find((d) => d.name === 'Rockstar Games');
        const idSoftwareDev = createdDevelopers.find((d) => d.name === 'id Software'); // New
        const mojangStudiosDev = createdDevelopers.find((d) => d.name === 'Mojang Studios'); // New
        const concernedApeDev = createdDevelopers.find((d) => d.name === 'ConcernedApe'); // New


        const bandaiNamcoPub = createdPublishers.find((p) => p.name === 'Bandai Namco');
        const cdProjektPub = createdPublishers.find((p) => p.name === 'CD Projekt');
        const takeTwoPub = createdPublishers.find((p) => p.name === 'Take-Two Interactive');
        const bethesdaSoftworksPub = createdPublishers.find((p) => p.name === 'Bethesda Softworks'); // New
        const xboxGameStudiosPub = createdPublishers.find((p) => p.name === 'Xbox Game Studios'); // New
        const concernedApePub = createdPublishers.find((p) => p.name === 'ConcernedApe'); // New


        const gamesToSeed = [
            {
                title: 'Elden Ring',
                description: 'A fantasy action role-playing game developed by FromSoftware and published by Bandai Namco Entertainment.',
                releaseDate: new Date('2022-02-25'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Elden_Ring_cover_art.jpg/220px-Elden_Ring_cover_art.jpg',
                developerId: fromSoftwareDev?.id,
                publisherId: bandaiNamcoPub?.id,
                genreIds: [actionGenre?.id, rpgGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, ps5Platform?.id].filter(Boolean) as string[],
            },
            {
                title: 'Cyberpunk 2077',
                description: 'An open-world, action-adventure RPG set in the megalopolis of Night City.',
                releaseDate: new Date('2020-12-10'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Cyberpunk_2077_cover_art.jpg/220px-Cyberpunk_2077_cover_art.jpg',
                developerId: cdProjektRedDev?.id,
                publisherId: cdProjektPub?.id,
                genreIds: [rpgGenre?.id, actionGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, ps5Platform?.id].filter(Boolean) as string[],
            },
            {
                title: 'Grand Theft Auto V',
                description: 'An action-adventure game played from either a third-person or first-person perspective.',
                releaseDate: new Date('2013-09-17'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a5/Grand_Theft_Auto_V_cover_art.jpg/220px-Grand_Theft_Auto_V_cover_art.jpg',
                developerId: rockstarGamesDev?.id,
                publisherId: takeTwoPub?.id,
                genreIds: [actionGenre?.id, shooterGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, ps5Platform?.id].filter(Boolean) as string[],
            },
            {
                title: 'The Witcher 3: Wild Hunt',
                description: 'A story-driven open world RPG set in a visually stunning fantasy universe full of meaningful choices and impactful consequences.',
                releaseDate: new Date('2015-05-19'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Witcher_3_cover_art.jpg/220px-Witcher_3_cover_art.jpg',
                developerId: cdProjektRedDev?.id,
                publisherId: cdProjektPub?.id,
                genreIds: [rpgGenre?.id, adventureGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, ps5Platform?.id].filter(Boolean) as string[],
            },
            {
                title: 'Red Dead Redemption 2',
                description: 'A Western-themed action-adventure game. It is the third entry in the Red Dead series and a prequel to the 2010 game Red Dead Redemption.',
                releaseDate: new Date('2018-10-26'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/Red_Dead_Redemption_2_cover.jpg/220px-Red_Dead_Redemption_2_cover.jpg',
                developerId: rockstarGamesDev?.id,
                publisherId: takeTwoPub?.id,
                genreIds: [actionGenre?.id, adventureGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, ps5Platform?.id].filter(Boolean) as string[],
            },
            {
                title: 'DOOM Eternal',
                description: 'As the Doom Slayer, discover the origins of the Slayer’s rage and his ultimate mission to rip and tear until it is done.',
                releaseDate: new Date('2020-03-20'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Doom_Eternal_cover_art.jpg/220px-Doom_Eternal_cover_art.jpg',
                developerId: idSoftwareDev?.id,
                publisherId: bethesdaSoftworksPub?.id,
                genreIds: [shooterGenre?.id, actionGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, ps5Platform?.id].filter(Boolean) as string[],
            },
            {
                title: 'Minecraft',
                description: 'A sandbox game where players explore a blocky, procedurally generated 3D world, and can discover and extract raw materials, craft tools, build structures, or earthworks.',
                releaseDate: new Date('2011-11-18'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
                developerId: mojangStudiosDev?.id,
                publisherId: xboxGameStudiosPub?.id,
                genreIds: [sandboxGenre?.id, adventureGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, nintendoSwitchPlatform?.id].filter(Boolean) as string[],
            },
            {
                title: 'Stardew Valley',
                description: 'A simulation role-playing video game. Players take the role of a character who inherits their deceased grandfather\'s dilapidated farm in Stardew Valley.',
                releaseDate: new Date('2016-02-26'),
                imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Stardew_Valley_cover_art.jpg/220px-Stardew_Valley_cover_art.jpg',
                developerId: concernedApeDev?.id,
                publisherId: concernedApePub?.id,
                genreIds: [simulationGenre?.id, rpgGenre?.id].filter(Boolean) as string[],
                platformIds: [pcPlatform?.id, nintendoSwitchPlatform?.id].filter(Boolean) as string[],
            },
            // --- New Games End ---
        ];

        console.log('Step 7: Seeding games...');
        for (const gameData of gamesToSeed) {
            console.log(`Sub-step: Seeding game: ${gameData.title}...`);
            await prisma.game.upsert({
                where: { title: gameData.title },
                update: {
                    description: gameData.description,
                    releaseDate: gameData.releaseDate,
                    imageUrl: gameData.imageUrl,
                    developerId: gameData.developerId,
                    publisherId: gameData.publisherId,
                    genres: {
                        deleteMany: {},
                        create: gameData.genreIds.map((genreId) => ({
                            genre: { connect: { id: genreId } },
                        })),
                    },
                    platforms: {
                        deleteMany: {},
                        create: gameData.platformIds.map((platformId) => ({
                            platform: { connect: { id: platformId } },
                        })),
                    },
                },
                create: {
                    title: gameData.title,
                    description: gameData.description,
                    releaseDate: gameData.releaseDate,
                    imageUrl: gameData.imageUrl,
                    userId: testUser.id, // Assuming all seeded games are "owned" by the test user
                    developerId: gameData.developerId,
                    publisherId: gameData.publisherId,
                    genres: {
                        create: gameData.genreIds.map((genreId) => ({
                            genre: { connect: { id: genreId } },
                        })),
                    },
                    platforms: {
                        create: gameData.platformIds.map((platformId) => ({
                            platform: { connect: { id: platformId } },
                        })),
                    },
                },
            });
            console.log(`Sub-step Complete: Successfully seeded game: ${gameData.title}`);
        }
        console.log('Step 7 Complete: All games seeded.');

        console.log('✅ Seed completed successfully!');
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error('❌ Error seeding database:', e.message);
        } else {
            console.error('❌ An unknown error occurred during seeding:', e);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        console.log('Prisma client disconnected.');
    }
}

main();