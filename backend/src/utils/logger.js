export const debugLog = (...msg) => {
  console.log('\nDEBUG LOG:');
  msg.forEach((m) => console.log('   ➜', m));
  console.log('--------------------------------------------------\n');
};

export const debugError = (...msg) => {
  console.error('\nDEBUG ERROR:');
  msg.forEach((m) => console.error('   ✖', m));
  console.error('--------------------------------------------------\n');
};
