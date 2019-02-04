const getEl = id => document.getElementById(id);

function load(setId, diffId) {
  fetch(`/api/scores/${setId}/${diffId}`)
    .then(res => res.json())
    .then(res => {
      getEl('scores-artist').innerText = res.artist;
      getEl('scores-title').innerText = res.title;
      getEl('scores-creator').innerText = res.creator;
      getEl('scores-stars').innerText = res.stars;
      getEl('scores-star-label').className = `ui big ${res.diffColor} circular label`;
    });
}

function play(setId, diffId) {
  window.location = `/play/${setId}/${diffId}`;
}

console.log("gud");
