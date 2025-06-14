export function checkKeywordTriggers(text) {
  const triggers = [];
  
  // Define keyword patterns and their animations
  const patterns = [
    {
      regex: /congratulations|happy new year|celebration/i,
      animation: 'fireworks'
    },
    {
      regex: /happy birthday|birthday/i,
      animation: 'confetti'
    },
    {
      regex: /🎉|celebrate|party/i,
      animation: 'celebration'
    },
    {
      regex: /❤️|💕|love/i,
      animation: 'hearts'
    },
    {
      regex: /🏆|victory|win|winner/i,
      animation: 'trophy'
    }
  ];
  
  patterns.forEach(pattern => {
    if (pattern.regex.test(text)) {
      triggers.push(pattern.animation);
    }
  });
  
  return [...new Set(triggers)]; // Remove duplicates
}