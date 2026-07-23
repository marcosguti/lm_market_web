import { Link } from 'react-router-dom';

import { PATHS } from '../../constants/paths';

const linkClass =
  'text-gray-300 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const textClass = 'text-sm leading-relaxed text-gray-300';
const headingClass = 'mb-4 text-lg font-semibold text-white';

const webLinks = [
  { label: 'Inicio', to: PATHS.home },
  { label: 'Nosotros', to: PATHS.about },
  { label: 'Blog', to: PATHS.blog },
  { label: 'Términos y Condiciones', to: PATHS.terms },
  { label: 'Preguntas frecuentes', to: PATHS.faq },
  { label: 'Contacto', to: PATHS.contact },
] as const;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <div>
            <h3 className={headingClass}>Información Corporativa</h3>
            <ul className={`space-y-2 ${textClass}`}>
              <li className="font-medium text-white">GRUPO LM MARKET C.A</li>
              <li>RIF: J-502772642</li>
              <li>CR 4A LOCAL NRO 9-173</li>
              <li>SECTOR EL LLANO, TOVAR, MÉRIDA</li>
              <li>ZONA POSTAL 5143</li>
            </ul>
          </div>

          <div>
            <h3 className={headingClass}>Contacto</h3>
            <ul className={`space-y-3 ${textClass}`}>
              <li>
                <a href="tel:+584121184736" className={linkClass}>
                  +58 0412-1184736
                </a>
              </li>
              <li>
                <a href="mailto:Soporte@lmmarketca.com" className={linkClass}>
                  Soporte@lmmarketca.com
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-white">Síguenos en:</h4>
              <a
                href="https://instagram.com/grupolmmarket"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                @grupolmmarket
              </a>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className={headingClass}>Web</h3>
            <ul className={`grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 ${textClass}`}>
              {webLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`mt-10 border-t border-gray-800 pt-8 text-center ${textClass}`}>
          <p>
            © {currentYear} Todos los derechos reservados{' '}
            <span className="font-semibold text-primary">LM MARKET</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
