let sessionId = null;
let currentQuestion = null;

function fetchHunts() {
  fetch('https://codecyprus.org/th/api/list')
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById('hunt-select');
      select.innerHTML = ''; // clear previous options

      data.treasureHunts.forEach(hunt => {
        const opt = document.createElement('option');
        opt.value = hunt.uuid;
        opt.textContent = hunt.name;
        select.appendChild(opt);
      });
    });
}

function generateRandomName() {
  return 'Player' + Math.floor(Math.random() * 1000000);
}

function startHunt() {
  const huntId = document.getElementById('hunt-select').value;
  const playerNameInput = document.getElementById('player-name');
  let playerName = playerNameInput?.value.trim() || generateRandomName();

  if (!huntId) {
    alert("Please select a treasure hunt first.");
    return;
  }

  fetch(`https://codecyprus.org/th/api/start?player=${encodeURIComponent(playerName)}&app=myapp&treasure-hunt-id=${huntId}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === "ERROR") {
        alert("Failed to start session: " + data.errorMessages.join(", "));
        return;
      }

      sessionId = data.session;
      localStorage.setItem("sessionId", sessionId);
      localStorage.setItem("playerName", playerName);
      localStorage.setItem("huntId", huntId);

      document.getElementById('question-area').style.display = 'block';
      loadQuestion();
      updateScore();
      setInterval(updateLocation, 120000);
    });
}

function resumePreviousSession() {
  const savedSession = localStorage.getItem("sessionId");
  if (savedSession) {
    sessionId = savedSession;
    document.getElementById('question-area').style.display = 'block';
    loadQuestion();
    updateScore();
    setInterval(updateLocation, 120000);
  }
}

function loadQuestion() {
  fetch(`https://codecyprus.org/th/api/question?session=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      const questionText = document.getElementById('question-text');
      const answerInput = document.getElementById('answer-input');
      const mcqOptions = document.getElementById('mcq-options');
      const boolOptions = document.getElementById('bool-options');

      // Clear old UI
      answerInput.style.display = 'none';
      mcqOptions.style.display = 'none';
      boolOptions.style.display = 'none';
      mcqOptions.innerHTML = '';
      boolOptions.innerHTML = '';
      answerInput.value = '';

      if (data.status === 'OK' && !data.completed) {
        questionText.innerHTML = data.questionText;
        const type = data.questionType;

        if (type === "MCQ") {
          mcqOptions.style.display = 'block';
          const options = data.choices || ['A', 'B', 'C', 'D'];
          options.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'answer-button';
            btn.textContent = choice;
            btn.onclick = () => {
              document.getElementById('answer-input').value = choice;
              submitAnswer();
            };
            mcqOptions.appendChild(btn);
          });
        } else if (type === "BOOLEAN") {
          boolOptions.style.display = 'block';
          ["True", "False"].forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'answer-button';
            btn.textContent = choice;
            btn.onclick = () => {
              document.getElementById('answer-input').value = choice;
              submitAnswer();
            };
            boolOptions.appendChild(btn);
          });
        } else {
          answerInput.style.display = 'block';
        }
      } else {
        questionText.innerText = "🎉 Game Over!";
        document.getElementById('status').innerText = "No more questions.";
      }
    });
}

function submitAnswer(passedAnswer = null) {
  const answer = passedAnswer || document.getElementById('answer-input').value.trim();
  if (!answer) {
    document.getElementById('status').innerText = "Please enter an answer.";
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    fetch(`https://codecyprus.org/th/api/answer?session=${sessionId}&answer=${encodeURIComponent(answer)}&latitude=${lat}&longitude=${lng}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById('status').innerText = data.message || "Answer submitted.";
        updateScore();
        loadQuestion();
      });
  }, () => {
    document.getElementById('status').innerText = "Location required to submit the answer.";
  });
}

function skipQuestion() {
  fetch(`https://codecyprus.org/th/api/skip?session=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('status').innerText = data.message || "Question skipped.";
      loadQuestion();
    });
}

function updateScore() {
  fetch(`https://codecyprus.org/th/api/score?session=${sessionId}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'OK') {
        document.getElementById('score').innerText = data.score;
      }
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

function scanQRCode() {
  alert("QR scanning feature will be implemented using html5-qrcode.");
  // Future: integrate html5-qrcode or QR scanning library and submit result like:
  // document.getElementById('answer-input').value = scannedCode;
  // submitAnswer();
}

// Load hunts on page load
fetchHunts();
resumePreviousSession();