import { Button, Spin } from 'antd';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getPublicBlogArticleById, type PublicBlogArticle } from '../../api/blogArticles';
import BlogArticleContent from '../../components/BlogArticleContent';
import SEO from '../../components/SEO';
import { formatDate } from '../../utils/formatDate';

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PublicBlogArticle | null>(null);
  const [loading, setLoading] = useState(() => Boolean(id));
  const [error, setError] = useState<string | null>(() => (id ? null : 'Artículo no encontrado'));

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        const res = await getPublicBlogArticleById(id);
        if (cancelled) return;
        setLoading(false);
        if (!res.ok || !res.data?.data) {
          setError((res.data as { error?: string })?.error ?? 'Artículo no encontrado');
          setPost(null);
          return;
        }
        setPost(res.data.data);
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Artículo no encontrado</h1>
        <p className="mb-8 text-gray-600">Este contenido no está disponible.</p>
        <Link to="/blog">
          <Button type="primary">Volver al blog</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Artículo no encontrado</h1>
        <p className="mb-8 text-gray-600">{error ?? 'Este contenido no está disponible.'}</p>
        <Link to="/blog">
          <Button type="primary">Volver al blog</Button>
        </Link>
      </div>
    );
  }

  const dateLabel = formatDate(post.createdAt);

  return (
    <>
      <SEO description={post.title} title={post.title} />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45 }}
        >
          <Link
            className="mb-8 inline-block text-sm font-medium text-primary hover:underline"
            to="/blog"
          >
            ← Volver al blog
          </Link>
          <time className="mb-3 block text-sm text-gray-500" dateTime={post.createdAt}>
            {dateLabel}
          </time>
          <h1 className="mb-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {post.title}
          </h1>
          <BlogArticleContent html={post.content} />
        </motion.div>
      </article>
    </>
  );
};

export default BlogDetail;
