import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import SEO from '../../components/SEO';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'Con los mejores precios de la ciudad',
      excerpt: 'Descubre nuestras ofertas especiales y productos con los mejores precios.',
      image: '/logo.png',
    },
  ];

  return (
    <>
      <SEO
        title="Blog"
        description="Mantente informado con las últimas noticias, ofertas y consejos de LM Market."
      />
      <div className="mx-auto max-w-7xl px-[16px] py-[48px] sm:px-[24px] lg:px-[32px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-[32px] text-4xl font-bold text-gray-900"
        >
          Blog
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-[32px] md:grid-cols-2 lg:grid-cols-3"
        >
          {blogPosts.map((post) => (
            <motion.article
              key={post.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="h-[192px] bg-gray-200">
                <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-[24px]">
                <h2 className="mb-[8px] text-xl font-semibold text-gray-900">{post.title}</h2>
                <p className="mb-[16px] text-gray-600">{post.excerpt}</p>
                <motion.div whileHover={{ x: 5 }}>
                  <Link
                    to={`/blog/${post.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Ver más +
                  </Link>
                </motion.div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {blogPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="py-[48px] text-center"
          >
            <p className="text-gray-600">Próximamente más contenido...</p>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default Blog;
