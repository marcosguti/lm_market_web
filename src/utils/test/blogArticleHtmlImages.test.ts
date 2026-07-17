import { describe, expect, it } from 'vitest';

import {
  extractFirstImageSrc,
  getImagesFromHtmlAndNewHtml,
  htmlToPlainExcerpt,
} from '../blogArticleHtmlImages';

describe('blogArticleHtmlImages', () => {
  it('extractFirstImageSrc returns first src', () => {
    const html = '<p>x</p><img src="https://cdn/a.jpg" /><img src="https://cdn/b.jpg" />';
    expect(extractFirstImageSrc(html)).toBe('https://cdn/a.jpg');
  });

  it('htmlToPlainExcerpt strips tags, decodes entities and truncates', () => {
    expect(htmlToPlainExcerpt('<p>Hola <strong>mundo</strong></p>', 100)).toBe('Hola mundo');
    expect(htmlToPlainExcerpt('<p>abcdefghij</p>', 5)).toBe('abcde…');
    expect(
      htmlToPlainExcerpt('<p>What&nbsp;is&nbsp;Lorem&nbsp;Ipsum?</p><p>Texto&nbsp;real</p>', 200)
    ).toBe('What is Lorem Ipsum? Texto real');
  });

  it('getImagesFromHtmlAndNewHtml converts base64 and keeps remote urls', async () => {
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const html = `<p><img src="${tinyPng}" /><img src="https://cdn/keep.jpg" /></p>`;

    const { images, newHtml } = await getImagesFromHtmlAndNewHtml(
      html,
      'blog-article-content-image'
    );

    expect(images).toHaveLength(1);
    expect(images[0].name).toMatch(/^blog-article-content-image1\.png$/);
    expect(newHtml).toContain('blog-article-content-image1.png');
    expect(newHtml).toContain('https://cdn/keep.jpg');
    expect(newHtml).not.toContain('data:image/png');
  });
});
