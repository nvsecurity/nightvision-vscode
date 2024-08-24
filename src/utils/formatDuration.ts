export default function formatDuration(duration: number) {
  let secondsDuration = Math.round(Math.max(0, duration / 1000));

  const hours = Math.floor(secondsDuration / 3600);
  secondsDuration -= hours * 3600;
  
  const minutes = Math.floor(secondsDuration / 60);
  secondsDuration -= minutes * 60;

  const seconds = secondsDuration;

  return `${hours ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
