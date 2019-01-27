function download(id) {
  fetch('/api/download/' + id).then((res) => {
    console.log(res.json());
  });
}
