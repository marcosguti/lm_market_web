import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PATHS } from '../../../constants/paths';
import Footer from '../index';

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

describe('Footer', () => {
  it('renders corporate, contact and web sections without the newsletter form', () => {
    renderFooter();

    expect(screen.getByRole('heading', { name: 'Información Corporativa' })).toBeInTheDocument();
    expect(screen.getByText('GRUPO LM MARKET C.A')).toBeInTheDocument();
    expect(screen.getByText('RIF: J-502772642')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+58 0412-1184736' })).toHaveAttribute(
      'href',
      'tel:+584121184736',
    );
    expect(screen.getByRole('link', { name: 'Soporte@lmmarketca.com' })).toHaveAttribute(
      'href',
      'mailto:Soporte@lmmarketca.com',
    );
    expect(screen.getByRole('link', { name: '@grupolmmarket' })).toHaveAttribute(
      'href',
      'https://instagram.com/grupolmmarket',
    );

    expect(screen.getByRole('heading', { name: 'Web' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', PATHS.home);
    expect(screen.getByRole('link', { name: 'Nosotros' })).toHaveAttribute('href', PATHS.about);
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', PATHS.blog);
    expect(screen.getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute(
      'href',
      PATHS.terms,
    );
    expect(screen.getByRole('link', { name: 'Preguntas frecuentes' })).toHaveAttribute(
      'href',
      PATHS.faq,
    );
    expect(screen.getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', PATHS.contact);

    expect(screen.queryByRole('heading', { name: 'Recibe Información' })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Tu email')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });

  it('shows the current year in the copyright notice', () => {
    renderFooter();

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} Todos los derechos reservados`)),
    ).toBeInTheDocument();
    expect(screen.getByText('LM MARKET')).toBeInTheDocument();
  });
});
