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
        const genresToSeed = ['Action', 'Adventure', 'RPG', 'Shooter', 'Strategy', 'Indie', 'Simulation'];
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
        const developersToSeed = ['FromSoftware', 'CD Projekt Red', 'Valve', 'Rockstar Games', 'Naughty Dog'];
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
        const publishersToSeed = ['Bandai Namco', 'CD Projekt', 'Electronic Arts', 'Take-Two Interactive', 'Sony Interactive Entertainment'];
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
        const rpgGenre = createdGenres.find((g) => g.name === 'RPG');
        const shooterGenre = createdGenres.find((g) => g.name === 'Shooter');
        const pcPlatform = createdPlatforms.find((p) => p.name === 'PC');
        const ps5Platform = createdPlatforms.find((p) => p.name === 'PlayStation 5');

        const fromSoftwareDev = createdDevelopers.find((d) => d.name === 'FromSoftware');
        const cdProjektRedDev = createdDevelopers.find((d) => d.name === 'CD Projekt Red');
        const rockstarGamesDev = createdDevelopers.find((d) => d.name === 'Rockstar Games');

        const bandaiNamcoPub = createdPublishers.find((p) => p.name === 'Bandai Namco');
        const cdProjektPub = createdPublishers.find((p) => p.name === 'CD Projekt');
        const takeTwoPub = createdPublishers.find((p) => p.name === 'Take-Two Interactive');

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
                    userId: testUser.id,
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