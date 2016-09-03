store(messages) {
  const allMessages = messages.map(JSON.stringify).join('\n');
  return new Promise((resolve, reject) => {
    this.file.write(allMessages, 'utf8', (e) => {
      if (e) {
        return reject();
      }
      return resolve();
    });
  });
}
