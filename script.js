let sessionId = null;
let currentQuestion = null;

function fetchHunts() {
  fetch('https://codecyprus.org/th/api/list')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('hunt-select');
      data.treasureHunts.forEach(hunt => {
        const opt = document.createElement('option');
        opt.value = hunt.uuid;
        opt.text = hunt.name;
        select.appendChild(opt);
      });
    });
}

function startHunt() {
  const huntId = document.getElementById('hunt-select').value;
  fetch(`https://codecyprus.org/th/api/start?player=DemoPlayer&app=myapp&treasureHuntId=${huntId}`)
    .then(res => res.json())
    .then(data => {
      sessionId = data.session;
      document.getElementById('question-area').style.display = 'block';
      loadQuestion();
      setInterval(updateLocation, 120000); // every 2 minutes
    });
}

function loadQuestion() {
  fetch(`https://codecyprus.org/th/api/question?session=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'OK') {
        currentQuestion = data.question;
        document.getElementById('question-text').innerText = currentQuestion.text;
      } else {
        document.getElementById('status').innerText = 'Game Over!';
      }
    });
}

function submitAnswer() {
  const answer = document.getElementById('answer-input').value;

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    fetch(`https://codecyprus.org/th/api/answer?session=${sessionId}&answer=${answer}&latitude=${lat}&longitude=${lng}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('status').innerText = data.message;
        updateScore();
        loadQuestion();
      });
  });
}

function skipQuestion() {
  fetch(`https://codecyprus.org/th/api/skip?session=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('status').innerText = data.message;
      loadQuestion();
    });
}

function updateScore() {
  fetch(`https://codecyprus.org/th/api/score?session=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('score').innerText = data.score;
    });
}

function updateLocation() {
  if (!sessionId) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    fetch(`https://codecyprus.org/th/api/location?session=${sessionId}&latitude=${lat}&longitude=${lng}`);
  });
}

fetchHunts();
