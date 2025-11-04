import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 text-center text-sm text-muted-foreground border-t bg-card">
      <p>
        © 2024 Panthera IT Department | For support,{' '}
        <a
          href="https://itservice.panthera.dyndns.biz/en/customer/create-ticket/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          contact us
        </a>
        .
      </p>
    </footer>
  );
};