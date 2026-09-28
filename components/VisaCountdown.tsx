'use client';

import { useEffect, useState } from 'react';

export default function VisaCountdown({ deadline }: { deadline: string }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const time = Date.parse(deadline) - Date.now();
      setDays(Number.isFinite(time) ? Math.max(0, Math.ceil(time / 86_400_000)) : null);
    };
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [deadline]);

  return days === null ? null : <p className="visa">VISA: {days} DAYS REMAINING</p>;
}
