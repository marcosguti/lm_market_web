interface FaqItem {
  answer: string
  question: string
}

export function buildFaqPageSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
      name: faq.question,
    })),
  }
}
