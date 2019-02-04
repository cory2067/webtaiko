const getEl = id => document.getElementById(id);

getEl('map-select').children[0].click(); // default pick random map
var selected;

getEl('play-button').addEventListener('click', function() {
  window.location = '/play' + selected;  
});

function load(setId, diffId) {
  selected = `/${setId}/${diffId}`;
  fetch(`/api/scores/${setId}/${diffId}`)
    .then(res => res.json())
    .then(res => {
      getEl('scores-artist').innerText = res.artist;
      getEl('scores-title').innerText = res.title;
      getEl('scores-creator').innerText = res.creator;
      getEl('scores-diff').innerText = res.diff;
      getEl('scores-stars').innerText = res.stars;
      getEl('scores-plays').innerText = res.plays || 0;

      getEl('scores-star-label').className = `ui big ${res.diffColor} circular label`;
    });
}

