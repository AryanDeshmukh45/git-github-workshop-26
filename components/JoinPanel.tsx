import QRCode from 'qrcode';
import { LazyDither } from './Backdrop';

export default async function JoinPanel({ repoUrl }: { repoUrl: string }) {
  const qr = await QRCode.toString(repoUrl, { type: 'svg', margin: 1, color: { dark: '#000000', light: '#ffffff' } });
  return (
    <section className="join" id="join">
      <LazyDither waveColor={[0.3, 0.3, 0.3]} colorNum={4} pixelSize={3} waveSpeed={0.02} enableMouseInteraction={false} />
      <div className="join-inner">
        <div>
          <p className="join-joker">JOKER · ALL SUITS WELCOME</p>
          <h2>Game rules</h2>
          <ol className="steps">
            <li>Fork <a href={repoUrl}>the repo</a>.</li>
            <li>Copy <code>profiles/_example.json</code> to a new <code>.json</code> file and fill it in.</li>
            <li>Commit, push, and open a pull request.</li>
            <li>Once it&apos;s merged, your card shows up here within a minute.</li>
          </ol>
        </div>
        <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR code linking to the repository" role="img" />
      </div>
    </section>
  );
}
