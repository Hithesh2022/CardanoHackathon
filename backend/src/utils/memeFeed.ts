const memes = [
  {
    threshold: 850,
    title: 'Hosky Hedge Fund',
    line: 'Diamond paws detected. The meme lords salute you!'
  },
  {
    threshold: 720,
    title: 'Ada Lovelace League',
    line: 'Your on-chain discipline sparks joy for Marlowe devs.'
  },
  {
    threshold: 640,
    title: 'Cardano Koala Club',
    line: 'Steady as a koala on eucalyptus—keep hugging decentralization.'
  },
  {
    threshold: 550,
    title: 'Bear Market Barista',
    line: 'Serving privacy lattes until the next epoch flips green.'
  },
  {
    threshold: 0,
    title: 'Plutus Playground',
    line: 'No shame in learning mode. Stake some patience and try again.'
  }
];

export const memeFeed = {
  pickForScore(score: number) {
    return memes.find((meme) => score >= meme.threshold) ?? memes[memes.length - 1];
  },
  all() {
    return memes;
  }
};
