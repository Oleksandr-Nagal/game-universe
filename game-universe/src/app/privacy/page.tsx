// src/app/privacy/page.tsx
export default function PrivacyPage() {
    return (
        <main className="w-full p-6  text-white min-h-[calc(100vh-100px)] flex flex-col items-center justify-center">
            <div className="container mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-4xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-600 mb-8 leading-tight drop-shadow-lg text-center">
                    Політика конфіденційності
                </h1>

                <section className="mb-10">
                    <h2 className="text-3xl font-bold text-indigo-400 mb-4">
                        1. Збір Інформації
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                        GameUniverse збирає інформацію, яку ви надаєте безпосередньо, коли ви реєструєте обліковий запис, створюєте профіль, взаємодієте з іншими користувачами, публікуєте відгуки, оцінки або інший контент. Це може включати ваше ім'я, адресу електронної пошти, зображення профілю та будь-яку іншу інформацію, яку ви вирішите надати.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Ми також автоматично збираємо певну інформацію, коли ви отримуєте доступ до Сервісів та користуєтеся ними, включаючи інформацію про ваш пристрій, IP-адресу, тип браузера, сторінки, які ви переглядали, та час вашого відвідування.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-3xl font-bold text-indigo-400 mb-4">
                        2. Використання Інформації
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                        Ми використовуємо зібрану інформацію для:
                    </p>
                    <ul className="list-disc list-inside text-lg text-gray-300 leading-relaxed mb-4 pl-4">
                        <li>Надання, підтримки та покращення наших Сервісів.</li>
                        <li>Персоналізації вашого досвіду, показуючи відповідний контент та рекомендації.</li>
                        <li>Надання підтримки клієнтам.</li>
                        <li>Надсилання вам повідомлень, включаючи оновлення та рекламні матеріали.</li>
                        <li>Аналізу тенденцій та моніторингу використання Сервісів.</li>
                        <li>Виявлення, розслідування та запобігання шахрайській, несанкціонованій або незаконній діяльності.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="text-3xl font-bold text-indigo-400 mb-4">
                        3. Розкриття Інформації
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                        Ми не передаємо вашу особисту інформацію третім сторонам, за винятком випадків, описаних у цій Політиці конфіденційності, або коли це необхідно для надання Сервісів. Ми можемо ділитися інформацією з постачальниками послуг, які виконують функції від нашого імені, такими як хостинг, аналітика та обслуговування клієнтів.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Ми також можемо розкривати інформацію, якщо це вимагається законом, у відповідь на судовий запит або для захисту наших прав.
                    </p>
                </section>

                <section>
                    <h2 className="text-3xl font-bold text-indigo-400 mb-4">
                        4. Ваші Права
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                        Ви маєте право на доступ, виправлення або видалення вашої особистої інформації. Ви також можете мати право заперечувати проти певних видів обробки або просити обмежити обробку вашої інформації. Будь ласка, зв'яжіться з нами, щоб скористатися цими правами.
                    </p>
                </section>

                <div className="text-center mt-10 text-gray-500 text-sm">
                    <p>Останнє оновлення: 25 травня 2025 р.</p>
                </div>
            </div>
        </main>
    );
}