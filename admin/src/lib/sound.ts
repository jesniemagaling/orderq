export const playNotificationSound = () => {
  try {
    const audioCtx = new window.AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 920;
    gainNode.gain.value = 0.08;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 200);
  } catch (error) {
    console.warn('Notification sound unavailable:', error);
  }
};
