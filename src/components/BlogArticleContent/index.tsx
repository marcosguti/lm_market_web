import { ClassNames } from '@emotion/react';
import DOMPurify from 'dompurify';

import { colors } from '../../styles/theme';

type BlogArticleContentProps = {
  html: string;
};

const BlogArticleContent = ({ html }: BlogArticleContentProps) => {
  const safeHtml = DOMPurify.sanitize(html);

  return (
    <ClassNames>
      {({ css }) => (
        <div
          className={css`
            color: ${colors.text1};
            font-size: 1.125rem;
            line-height: 1.75;
            overflow-wrap: break-word;
            word-wrap: break-word;
            & > *:first-of-type {
              margin-top: 0;
            }
            & > *:last-of-type {
              margin-bottom: 0;
            }
            p {
              margin: 0 0 1.25rem;
            }
            h1,
            h2,
            h3,
            h4,
            h5,
            h6 {
              color: ${colors.text1};
              font-weight: 700;
              line-height: 1.3;
              margin: 2rem 0 1rem;
            }
            h1 {
              font-size: 2rem;
            }
            h2 {
              font-size: 1.625rem;
            }
            h3 {
              font-size: 1.375rem;
            }
            h4 {
              font-size: 1.2rem;
            }
            h5,
            h6 {
              font-size: 1.05rem;
            }
            img {
              display: block;
              width: 100%;
              max-width: 100%;
              height: auto;
              margin: 1.75rem 0;
              border-radius: 0.75rem;
              object-fit: cover;
            }
            a {
              color: ${colors.primary};
              text-decoration: underline;
              text-underline-offset: 2px;
            }
            ul,
            ol {
              margin: 0 0 1.25rem;
              padding-left: 1.5rem;
            }
            ul {
              list-style: disc;
            }
            ol {
              list-style: decimal;
            }
            li {
              margin: 0.35rem 0;
            }
            blockquote {
              margin: 1.5rem 0;
              padding: 0.25rem 0 0.25rem 1rem;
              border-left: 4px solid #e5e7eb;
              color: ${colors.text2};
              font-style: italic;
            }
            strong,
            b {
              font-weight: 700;
            }
            em,
            i {
              font-style: italic;
            }
            .ql-align-center {
              text-align: center;
            }
            .ql-align-right {
              text-align: right;
            }
            .ql-align-justify {
              text-align: justify;
            }
          `}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
          data-testid="blog-article-content"
        />
      )}
    </ClassNames>
  );
};

export default BlogArticleContent;
