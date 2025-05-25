// src/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import HomeContent from './components/HomeContent';

export default async function HomePage() {
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session;
    const isAdmin = session?.user?.role === 'ADMIN';

    return <HomeContent isAuthenticated={isAuthenticated} isAdmin={isAdmin} />;
}
