const messages = [
  'The island is ready.',
  'The gates have opened for you.',
  'A surprise awaits beyond the trees.',
  'Welcome, guest. The celebration begins now.'
];

const messageNode = document.getElementById('ranger-message');

if (messageNode) {
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  messageNode.textContent = randomMessage;
}
