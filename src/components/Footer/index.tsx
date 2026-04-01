import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Información Corporativa</h3>
            <ul className="space-y-2 text-sm">
              <li>GRUPO LM MARKET C.A</li>
              <li>RIF: J-502772642</li>
              <li>CR 4A LOCAL NRO 9-173</li>
              <li>SECTOR EL LLANO, TOVAR, MÉRIDA</li>
              <li>ZONA POSTAL 5143</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Contacto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:+584121184736"
                  className="transition-colors hover:text-primary"
                >
                  +58 0412-1184736
                </a>
              </li>
              <li>
                <a
                  href="mailto:Soporte@lmmarketca.com"
                  className="transition-colors hover:text-primary"
                >
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
                className="text-sm transition-colors hover:text-primary"
              >
                @grupolmmarket
              </a>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Web</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="transition-colors hover:text-primary">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="transition-colors hover:text-primary">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/blog" className="transition-colors hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="transition-colors hover:text-primary">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/preguntas-frecuentes" className="transition-colors hover:text-primary">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="transition-colors hover:text-primary">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-white">Recibe Información</h3>
            <p className="mb-4 text-sm">
              Registra tu email y te enviamos nuestro folleto.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          <p>
            © 2025 Todos los derechos reservados{' '}
            <span className="font-semibold text-primary">LM MARKET</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

