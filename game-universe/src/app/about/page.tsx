// src/app/about/page.tsx
export default function AboutPage() {
    return (
        <main className="w-full p-6  text-white min-h-[calc(100vh-100px)] flex flex-col items-center justify-center">
            <div className="container mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-4xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8 leading-tight drop-shadow-lg text-center">
                    Про GameUniverse
                </h1>

                <section className="mb-10">
                    <h2 className="text-3xl font-bold text-indigo-400 mb-4">
                        Наша Місія
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                        GameUniverse — це сучасний портал для справжніх поціновувачів відеоігор. Наша місія полягає в тому, щоб об&#39;єднати геймерів з корисною інформацією, глибокими оглядами та інноваційними функціями, які допоможуть їм досліджувати та керувати своїми ігровими інтересами. Ми прагнемо створити інтуїтивно зрозумілу та
                        комплексну платформу, що забезпечує бездоганний досвід для відкриття нових ігор та перегляду класики.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-3xl font-bold text-teal-400 mb-4">
                        Що ми пропонуємо
                    </h2>
                    <ul className="list-disc list-inside text-lg text-gray-300 space-y-2">
                        <li><span className="font-semibold text-white">Детальні Огляди Ігор:</span> Доступ до вичерпної інформації про ігри, включаючи дати випуску, розробників, видавців, жанри та платформи.</li>
                        <li><span className="font-semibold text-white">Списки Бажань:</span> Слідкуйте за іграми, які ви хочете зіграти, додаючи їх до персонального списку бажань.</li>
                        <li><span className="font-semibold text-white">Коментарі та Рейтинги:</span> Діліться своїми думками та оцінками ігор, взаємодіючи з іншими користувачами.</li>
                        <li><span className="font-semibold text-white">Зручна Навігація:</span> Легко знаходьте ігри за допомогою фільтрів та пошуку.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-3xl font-bold text-rose-400 mb-4">
                        Наші Цінності
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                        Ми віримо у формування живої спільноти, де гравці можуть ділитися своїм досвідом, знаходити нових друзів та бути в курсі останніх тенденцій у світі ігор. Ми прагнемо до прозорості, достовірності та задоволення користувачів.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Приєднуйтесь до нас у цій захоплюючій подорожі по всесвіту ігор!
                    </p>
                </section>
            </div>
        </main>
    );
}