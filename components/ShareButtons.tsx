'use client';

import { useEffect, useState } from 'react';

export default function ShareButtons({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  // The page address only exists in the browser, so it's filled in after the first render.
  const [url, setUrl] = useState('');
  useEffect(() => setUrl(window.location.href), []);
  const text = `${name} made their first open-source contribution at Source Start!`;
  const enc = encodeURIComponent;

  return (
    <div className="share-buttons">
      <a className="button" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noreferrer">LinkedIn</a>
      <a className="button" href={`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noreferrer">X</a>
      <a className="button" href={`https://wa.me/?text=${enc(`${text} ${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
      <button
        className="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
