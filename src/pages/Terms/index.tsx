import { motion } from 'framer-motion';

import SEO from '../../components/SEO';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const Terms = () => {
  return (
    <>
      <SEO
        title="Términos y Condiciones"
        description="Términos y condiciones de uso de LM Market. Conoce nuestras políticas de privacidad y términos de servicio."
      />
      <div className="mx-auto max-w-4xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[32px] text-4xl font-bold text-gray-900"
        >
          Términos y Condiciones
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="prose prose-lg max-w-none space-y-[24px] text-gray-700"
        >
          <motion.p variants={itemVariants}>
            Al ingresar, revisar y comprar en este sitio web usted se compromete a leer, informarse
            y cumplir los términos y condiciones, además se obliga a respetar las políticas de
            privacidad. De conformidad con la legislación Venezuela sobre el tema, pues el
            contenido, productos y ofertas que usted encuentra en este sitio aplican únicamente para
            territorio venezolano.
          </motion.p>

          <motion.p variants={itemVariants}>
            Le informamos que LM Market podrá realizar modificaciones en cualquier momento de los
            términos y condiciones aquí descritas. En todo caso, sí éstos términos y condiciones
            varían lo informaremos, para que usted los conozca y acepte nuevamente.
          </motion.p>

          <motion.p variants={itemVariants}>
            El sitio web que usted está visitando es propiedad de GRUPO LM MARKET C.A, su dirección
            de notificaciones es: CR 4A LOCAL NRO 9-173 SECTOR EL LLANO, TOVAR, MÉRIDA ZONA POSTAL
            5143, Teléfono: +58 0412-1184736
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Derechos de Propiedad intelectual e industrial
          </motion.h2>
          <motion.p variants={itemVariants}>
            La información, documentos (imágenes, vídeos, herramientas, gráficos y demás), marcas,
            nombres, logos y demás material que se encuentra en esta página web, está protegido
            conforme a lo establecido en la legislación de Venezuela e internacional sobre derechos
            de autor, propiedad intelectual e industrial; por lo tanto, su uso está exclusivamente
            delimitado a fines personales de revisión, compra y consulta. De tal suerte que, el uso
            no autorizado que infrinja las leyes, a través de su venta, distribución, copia,
            modificación o adaptación o cualquier otra conducta prohibida, será sancionado de
            acuerdo a lo establecido por las normas aplicables.
          </motion.p>
          <motion.p variants={itemVariants}>
            Así las cosas, no podrán entenderse por el hecho de la publicación de los contenidos que
            se encuentran en este sitio web, que se concede algún tipo de licencia de uso de marca,
            derechos de autor o propiedad intelectual a quien visita, consulta o realiza compras a
            través de éste sitio web.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Uso Autorizado
          </motion.h2>
          <motion.p variants={itemVariants}>
            La página web podrá ser utilizada para revisión, compra y consulta de productos que
            GRUPO LM MARKET C.A tendrá disponible para la entrega a los usuarios, así como la
            información de usos y características de los productos y servicios ofrecidos, que están
            diseñados únicamente con fines informativos del usuario.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Usos prohibidos
          </motion.h2>
          <motion.p variants={itemVariants}>
            La información publicada en nuestra página web no podrá ser objeto de comercialización,
            distribución, copia o modificación.
          </motion.p>
          <motion.p variants={itemVariants}>
            No está autorizado el acceso a cuentas o información confidencial de los usuarios, así
            como la violación de la red y/o servidores o cualquier otro acto que atente contra la
            seguridad de las transacciones y de la página web.
          </motion.p>
          <motion.p variants={itemVariants}>
            La información que el usuario registre debe ser veraz y completa; se prohíbe todo acto
            de suplantación de identidad y/o información incorrecta que no corresponda a la persona
            natural o jurídica que hace uso de la página web.
          </motion.p>
          <motion.p variants={itemVariants}>
            En todo caso, únicamente se permitirá a personas mayores de edad, debidamente
            identificadas con cédula de ciudadanía o cédula de extranjería registrarse y efectuar
            operaciones de compra a través de esta página.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Información de los usuarios
          </motion.h2>
          <motion.p variants={itemVariants}>
            Para realizar pagos online será necesario el registro por parte de los usuarios en la
            página web, para tal efecto se requiere de información personal y confidencial. Esta
            información será de uso exclusivo de LM Market y no será revelada a terceros.
          </motion.p>
          <motion.p variants={itemVariants}>
            Buscando la seguridad en las transacciones, queda expresamente prohibido a los usuarios
            el compartir con terceros su contraseña o el password; pues dicha información es de uso
            exclusivo del usuario y no se podrá utilizar para fines no autorizados.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Información adicional incluida por los usuarios
          </motion.h2>
          <motion.p variants={itemVariants}>
            Los datos referidos en estos términos y condiciones tendrán como finalidad validar las
            órdenes de compra, mejorar la labor de información y comercialización de los productos y
            servicios prestados por la empresa.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Registro y Contraseña
          </motion.h2>
          <motion.p variants={itemVariants}>
            Será requisito necesario para la adquisición de productos y servicios ofrecidos en este
            sitio, la aceptación de las presentes condiciones y el registro por parte del usuario,
            con definición de una clave de acceso. Para tal efecto, se entenderán conocidos y
            aceptados estos Términos y Condiciones por el hecho de su aceptación mediante su
            expresión de voluntad a través de un "click" en el recuadro respectivo.
          </motion.p>
          <motion.p variants={itemVariants}>
            El registro de cada usuario se verificará completando y suscribiendo el formulario que
            se encuentra en el sitio y su posterior envío, el cual se realiza automáticamente
            pulsando "click" en el elemento respectivo.
          </motion.p>
          <motion.p variants={itemVariants}>
            Una vez registrado el usuario dispondrá de un nombre y contraseña o clave definitiva que
            le permitirá el acceso personalizado, confidencial y seguro a este sitio web. Así mismo
            tendrá la posibilidad bajo su exclusiva responsabilidad, de cambiar la clave de acceso,
            para lo cual deberá sujetarse al procedimiento establecido en el sitio respectivo.
          </motion.p>
          <motion.p variants={itemVariants}>
            El usuario es totalmente responsable por el mantenimiento de la confidencialidad de su
            clave secreta registrada en este sitio web, por medio de la cual podrá efectuar compras,
            solicitar servicios y obtener información. Dicha clave es de uso personal y su entrega a
            terceros no involucra responsabilidad de LM Market, ni de las empresas relacionadas en
            caso de indebida utilización.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Derechos del Usuario
          </motion.h2>
          <motion.p variants={itemVariants}>
            El usuario gozará de todos los derechos que le reconoce la legislación sobre Protección
            al Consumidor y Protección de Datos personales, por tal razón, podrá radicar sus
            peticiones, quejas, reclamos y sugerencias (PQR) a través de las diferentes herramientas
            y mecanismos de comunicación establecidos por la página.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            DISPOSICIONES GENERALES Y CONTRACTUALES
          </motion.h2>
          <motion.p variants={itemVariants}>
            Procuramos y ponemos nuestro mejor esfuerzo en que el ingreso a esta página sea seguro y
            su información personal se encuentra resguardada; en todo caso, no podemos hacernos
            responsables por virus, demoras en la operación o transmisión, errores tecnológicos,
            manipulación por terceros no autorizados, cualquier evento de invasión o manipulación
            tecnológica o algún otro error en el funcionamiento de la página web.
          </motion.p>
          <motion.p variants={itemVariants}>
            En consecuencia, toda transacción está sujeta a verificación posterior por parte de
            nuestra empresa y confirmación por parte del usuario, y la misma se sujeta a condición
            resolutoria cuando se presente alguna de las situaciones antes mencionadas.
          </motion.p>
          <motion.p variants={itemVariants}>
            Recuerde que únicamente podrá contratar a través de esta página web, aquellas personas
            que cuenten con plena capacidad legal para hacerlo. En todo caso, únicamente se
            permitirá a personas mayores de edad, debidamente identificadas con cédula de ciudadanía
            o cédula de extranjería registrarse y efectuar operaciones de compra a través de esta
            página.
          </motion.p>
          <motion.p variants={itemVariants}>
            Así mismo, eventualmente este sitio web puede presentar errores involuntarios, sí usted
            los detecta le agradecemos que los ponga nuestro conocimiento escribiendo al e-mail:
            Soporte@lmmarketca.com
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Perfeccionamiento del contrato
          </motion.h2>
          <motion.p variants={itemVariants}>
            Los productos y precios incluidos en esta página están dirigidos al público en general
            como personas indeterminadas y por consiguiente será necesaria siempre una confirmación
            y aceptación de nuestra parte de su orden de compra y del pago realizado, momento en el
            cual se expedirá la correspondiente factura y se entenderá perfeccionado el contrato de
            venta entre el usuario y la empresa.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Privacidad y seguridad
          </motion.h2>
          <motion.p variants={itemVariants}>
            Este sitio web usa un sistema de seguridad llamado SSL (Secure Socket Layer), que
            actualmente es el estándar usado por las compañías más importantes del mundo para
            realizar transacciones electrónicas seguras, lo que significa que toda tu información
            personal no podrá ser leída, ni capturada por terceros mientras viaja por la red.
          </motion.p>

          <motion.h2 variants={itemVariants} className="mt-[32px] text-2xl font-bold text-gray-900">
            Compromiso con la Seguridad
          </motion.h2>
          <motion.p variants={itemVariants}>
            En relación a nuestro Sitio web, hacemos esta declaración de seguridad y privacidad en
            orden a demostrar y comunicar nuestro compromiso con una práctica de negocios de alto
            nivel ético y dotada de los controles internos apropiados. Además hacemos esta
            declaración para garantizar el compromiso con la protección de los datos personales de
            los usuarios del Sitio.
          </motion.p>
          <motion.p variants={itemVariants}>
            Nuestro Sitio está protegido con una amplia variedad de medidas de seguridad, tales como
            procedimientos de control de cambios, claves y controles de acceso físico. También
            empleamos otros mecanismos para asegurar que la información y los Datos Personales que
            usted proporciona no sean extraviados, mal utilizados o modificados inapropiadamente.
          </motion.p>
          <motion.p variants={itemVariants}>
            Esos controles incluyen políticas de confidencialidad y respaldo periódico de bases de
            datos.
          </motion.p>
        </motion.div>
      </div>
    </>
  );
};

export default Terms;
