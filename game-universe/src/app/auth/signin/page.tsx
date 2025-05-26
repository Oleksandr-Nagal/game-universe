// src/app/auth/signin/page.tsx
import React, { Suspense } from 'react';
import { SignInForm } from './SignInForm';

export default function SignInPage() {
    return (

        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
                Завантаження форми входу...
            </div>
        }>
            <SignInForm />
        </Suspense>
    );
}