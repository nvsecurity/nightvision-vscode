export default function formatDuration(duration: number) {
  const secondsDuration = (duration >= 0 ? duration : 0) / 1000;
  const hours = Math.floor(secondsDuration / 3600);
  const minutes = Math.floor((secondsDuration % 3600) / 60);
  const seconds = Math.floor(secondsDuration % 60);
  return `${hours ? hours + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
