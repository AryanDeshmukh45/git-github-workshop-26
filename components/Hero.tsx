import { HeroBackdrop } from './Backdrop';
import HeroSand from './HeroSand';
// When the workshop date is confirmed, uncomment these and replace the placeholder:
// import VisaCountdown from './VisaCountdown';
// <VisaCountdown deadline="YYYY-MM-DDTHH:mm:ss+05:30" />

export default function Hero({ count, fontFamily }: { count: number; fontFamily: string }) {
  return (
    <header className="hero">
      <div className="hero-bg">
        <HeroBackdrop text="SOURCE START" fontFamily={fontFamily} />
        <HeroSand />
      </div>
      <div className="hero-content">
        <p className="eyebrow">CSI SPIT · Entry Game 2026</p>
        <h1 className="sr-only">Source Start</h1>
        <p className="tagline">Welcome to the Borderland. Your first commit is your entry game.</p>
        <p className="game-status">The game is yet to begin</p>
        {/* <VisaCountdown deadline="YYYY-MM-DDTHH:mm:ss+05:30" /> */}
        <div className="hero-actions">
          <a className="button button--primary" href="#join">Enter the game</a>
          <a className="button" href="#board">View {count} players</a>
        </div>
      </div>
    </header>
  );
}
