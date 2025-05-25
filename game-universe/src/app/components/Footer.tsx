// src/components/Footer.tsx
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFacebookF,
    faInstagram,
    faTelegramPlane,
    faTiktok
} from '@fortawesome/free-brands-svg-icons';

export const Footer = () => (
    <footer className="bg-gray-800 text-white p-6 mt-auto shadow-inner rounded-t-lg">
        <div className="flex justify-center space-x-6 mb-4">
            <Link href="https://www.facebook.com/yourgameuniverse" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label="Facebook link"> {/* Додаємо aria-label */}
                <FontAwesomeIcon icon={faFacebookF} className="text-2xl" />
            </Link>
            <Link href="https://www.instagram.com/yourgameuniverse" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label="Instagram link"> {/* Додаємо aria-label */}
                <FontAwesomeIcon icon={faInstagram} className="text-2xl" />
            </Link>
            <Link href="https://t.me/yourgameuniverse" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label="Telegram link"> {/* Додаємо aria-label */}
                <FontAwesomeIcon icon={faTelegramPlane} className="text-2xl" />
            </Link>
            <Link href="https://www.tiktok.com/@yourgameuniverse" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label="TikTok link"> {/* Додаємо aria-label */}
                <FontAwesomeIcon icon={faTiktok} className="text-2xl" />
            </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center text-sm text-gray-400 space-y-2 sm:space-y-0 sm:space-x-4">
            <p className="whitespace-nowrap">
                &copy; {new Date().getFullYear()} GameUniverse. Усі права захищено.
            </p>

            <span className="hidden sm:inline-block text-gray-600">|</span>

            <Link href="/privacy" className="hover:text-white transition-colors duration-300 whitespace-nowrap">
                Політика конфіденційності
            </Link>
        </div>
    </footer>
);