import { Link } from 'react-router-dom';

const linkClass = 'text-gray-300 transition-colors hover:text-primary';
const textClass = 'text-sm text-gray-300';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Información Corporativa</h3>
            <ul className={`space-y-2 ${textClass}`}>
              <li>GRUPO LM MARKET C.A</li>
              <li>RIF: J-502772642</li>
              <li>CR 4A LOCAL NRO 9-173</li>
              <li>SECTOR EL LLANO, TOVAR, MÉRIDA</li>
              <li>ZONA POSTAL 5143</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contacto</h3>
            <ul className={`space-y-2 ${textClass}`}>
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
            <div className="mt-4">
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
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Web</h3>
            <ul className={`space-y-2 ${textClass}`}>
              <li>
                <Link to="/" className={linkClass}>
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className={linkClass}>
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/terminos" className={linkClass}>
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/preguntas-frecuentes" className={linkClass}>
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/contacto" className={linkClass}>
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Recibe Información</h3>
            <p className={`mb-4 ${textClass}`}>Registra tu email y te enviamos nuestro folleto.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
        <div className={`mt-8 border-t border-gray-800 pt-8 text-center ${textClass}`}>
          <p>
            © 2025 Todos los derechos reservados{' '}
            <span className="font-semibold text-primary">LM MARKET</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
