const getEl = id => document.getElementById(id);

getEl('map-select').children[0].click(); // default pick random map
var selected;

getEl('play-button').addEventListener('click', function() {
  window.location = '/play' + selected;  
});

function load(setId, diffId) {
  selected = `/${setId}/${diffId}`;
  fetch(`/api/scores/${setId}/${diffId}?player=Cychloryn`)
    .then(res => res.json())
    .then(res => {
      console.log(res);
      getEl('scores-artist').innerText = res.meta.artist;
      getEl('scores-title').innerText = res.meta.title;
      getEl('scores-creator').innerText = res.meta.creator;
      getEl('scores-diff').innerText = res.meta.diff;
      getEl('scores-stars').innerText = res.meta.stars;
      getEl('scores-plays').innerText = res.meta.plays || 0;
      getEl('scores-star-label').className = `ui big ${res.meta.diffColor} circular label`;
  
      getEl('pb-player').innerText = 'Cychloryn';

      if (res.personalBest) {
        getEl('pb-rank').innerText = res.personalBest.rank;
        getEl('pb-score').innerText = res.personalBest.score;
        getEl('pb-acc').innerText = res.personalBest.acc;
      } else {
        getEl('pb-rank').innerText = '--';
        getEl('pb-score').innerText = '0';
        getEl('pb-acc').innerText = '0.00%';
      }
    });
}

