import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BlogArticleContent from '../index';

describe('BlogArticleContent', () => {
  it('renders sanitized html content', () => {
    render(
      <BlogArticleContent html='<p>Hola mundo</p><h2>Titulo</h2><img src="https://cdn/x.jpg" alt="x" />' />
    );

    expect(screen.getByTestId('blog-article-content')).toBeInTheDocument();
    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn/x.jpg');
  });

  it('renders decoded entities as readable text', () => {
    render(<BlogArticleContent html="<p>What&nbsp;is&nbsp;Lorem</p>" />);
    expect(screen.getByTestId('blog-article-content').textContent).toMatch(/What\s+is\s+Lorem/);
  });
});
