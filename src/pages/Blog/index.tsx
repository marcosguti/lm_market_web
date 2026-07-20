import { Pagination, Spin } from 'antd';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getPublicBlogArticles, type PublicBlogArticle } from '../../api/blogArticles';
import SEO from '../../components/SEO';
import { PATHS } from '../../constants/paths';
import { extractFirstImageSrc, htmlToPlainExcerpt } from '../../utils/blogArticleHtmlImages';
import { formatDate } from '../../utils/formatDate';

const PAGE_SIZE = 9;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
    y: 0,
  },
};

const Blog = () => {
  const [posts, setPosts] = useState<PublicBlogArticle[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    const res = await getPublicBlogArticles(nextPage, PAGE_SIZE);
    setLoading(false);
    if (!res.ok || !res.data) {
      setError((res.data as { error?: string })?.error ?? 'No se pudo cargar el blog');
      setPosts([]);
      setTotal(0);
      return;
    }
    setPosts(res.data.data);
    setTotal(res.data.total);
    setPage(res.data.page);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load(1);
    });
  }, [load]);

  return (
    <>
      <SEO
        description="Mantente informado con las últimas noticias, ofertas y consejos de LM Market."
        title="Blog"
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12 max-w-2xl">
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary"
            initial={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
          >
            LM Market
          </motion.p>
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
            initial={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
          >
            Blog
          </motion.h1>
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="text-lg leading-relaxed text-gray-600"
            initial={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.05, duration: 0.5 }}
          >
            Noticias, consejos y novedades para comprar mejor en LM Market.
          </motion.p>
        </header>

        {loading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : error ? (
          <p className="py-16 text-center text-gray-600">{error}</p>
        ) : posts.length === 0 ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="py-16 text-center"
            initial={{ opacity: 0 }}
          >
            <p className="text-gray-600">Próximamente más contenido...</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              animate="visible"
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              variants={containerVariants}
            >
              {posts.map((post) => {
                const image = extractFirstImageSrc(post.content) ?? '/logo.png';
                const excerpt = htmlToPlainExcerpt(post.content);
                const dateLabel = formatDate(post.createdAt);

                return (
                  <motion.article
                    className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                    key={post.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <Link
                      className="block aspect-[16/10] overflow-hidden bg-gray-100"
                      to={PATHS.blogDetail(post.id)}
                    >
                      <img alt={post.title} className="h-full w-full object-cover" src={image} />
                    </Link>
                    <div className="flex flex-1 flex-col p-6">
                      <time className="mb-2 text-sm text-gray-500" dateTime={post.createdAt}>
                        {dateLabel}
                      </time>
                      <h2 className="mb-3 text-xl font-semibold leading-snug text-gray-900">
                        <Link className="hover:text-primary" to={PATHS.blogDetail(post.id)}>
                          {post.title}
                        </Link>
                      </h2>
                      <p className="mb-5 flex-1 text-gray-600">{excerpt}</p>
                      <Link
                        className="font-medium text-primary hover:underline"
                        to={PATHS.blogDetail(post.id)}
                      >
                        Leer más
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>

            {total > PAGE_SIZE && (
              <div className="mt-12 flex justify-center">
                <Pagination
                  current={page}
                  onChange={(next) => void load(next)}
                  pageSize={PAGE_SIZE}
                  showSizeChanger={false}
                  total={total}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Blog;
